import type { Product } from '../../domain/catalog/types'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { uploadService } from '../../services/storage/runtime-upload-service'
import type {
  StaffImageTaskCommandResult,
  StaffImageTaskProduct,
  StaffImageTasksViewModel,
} from '../staff-image-tasks/staff-image-tasks'

const allBatchesOption = { label: '全部批次', value: '' }

const toTaskProduct = (product: Product): StaffImageTaskProduct => ({
  ...product,
  statusLabel: '待补图',
})

export const getCloudBaseStaffImageTasksView = async (
  params: { keyword: string; selectedBatchId: string },
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<StaffImageTasksViewModel> => {
  const { batches, products } = await client.getStaffImageTaskSnapshot()
  const batchOptions = [allBatchesOption, ...batches.map((batch) => ({ label: batch.id, value: batch.id }))]
  const keyword = params.keyword.trim()
  const filteredProducts = products.map(toTaskProduct)
    .filter((product) => {
      const matchesKeyword = !keyword || product.productCode.includes(keyword)
      const matchesBatch = !params.selectedBatchId || product.createdFromBatchId === params.selectedBatchId
      return matchesKeyword && matchesBatch
    })

  return {
    batchOptions,
    selectedBatchLabel: batchOptions.find((item) => item.value === params.selectedBatchId)?.label ?? allBatchesOption.label,
    products: filteredProducts,
    emptyMessage: '暂无待补图商品',
  }
}

export const filterCloudBaseStaffImageTasksView = (
  view: StaffImageTasksViewModel,
  params: { keyword: string; selectedBatchId: string },
): StaffImageTasksViewModel => {
  const keyword = params.keyword.trim()
  const filteredProducts = view.products.filter((product) => {
    const matchesKeyword = !keyword || product.productCode.includes(keyword)
    const matchesBatch = !params.selectedBatchId || product.createdFromBatchId === params.selectedBatchId
    return matchesKeyword && matchesBatch
  })

  return {
    ...view,
    selectedBatchLabel: view.batchOptions.find((item) => item.value === params.selectedBatchId)?.label ?? allBatchesOption.label,
    products: filteredProducts,
  }
}

export const supplementCloudBaseStaffProductImages = async (
  productId: string,
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<StaffImageTaskCommandResult> => {
  const uploaded = await uploadService.chooseAndUploadImages({
    businessType: 'product_main_image',
    sourceRole: 'staff',
    entityType: 'product',
    entityId: productId,
  })
  const { product } = await client.supplementProductImages(productId, {
    mainImageUrl: uploaded.mainImageUrl,
    imageUrls: uploaded.imageUrls,
  })

  return { message: `${product.productCode} 已补图，状态变为可上架` }
}
