import type { Product } from '../../domain/catalog/types'
import { mallAccess } from '../mall-workflow/mall-access'
import { mallWorkflow } from '../mall-workflow/mall-workflow'

export type StaffImageTaskBatchOption = {
  label: string
  value: string
}

export type StaffImageTaskProduct = Product & {
  statusLabel: string
}

export type StaffImageTasksViewModel = {
  batchOptions: StaffImageTaskBatchOption[]
  selectedBatchLabel: string
  products: StaffImageTaskProduct[]
  emptyMessage: string
}

export type StaffImageTaskCommandResult = {
  message: string
}

const allBatchesOption: StaffImageTaskBatchOption = { label: '全部批次', value: '' }

export const getStaffImageTasksView = (params: { keyword: string; selectedBatchId: string }): StaffImageTasksViewModel => {
  const batchOptions = [
    allBatchesOption,
    ...mallAccess.listBatches().map((batch) => ({ label: batch.id, value: batch.id })),
  ]
  const keyword = params.keyword.trim()
  const products = mallAccess
    .listPendingImageProducts()
    .filter((product) => {
      const matchesKeyword = !keyword || product.productCode.includes(keyword)
      const matchesBatch = !params.selectedBatchId || product.createdFromBatchId === params.selectedBatchId
      return matchesKeyword && matchesBatch
    })
    .map((product) => ({ ...product, statusLabel: '待补图' }))

  return {
    batchOptions,
    selectedBatchLabel: batchOptions.find((item) => item.value === params.selectedBatchId)?.label ?? allBatchesOption.label,
    products,
    emptyMessage: '暂无待补图商品',
  }
}

export const supplementStaffProductImages = async (productId: string): Promise<StaffImageTaskCommandResult> => {
  const product = mallAccess.getProduct(productId)
  if (!product) {
    return { message: '商品不存在' }
  }

  const nextProduct = await mallWorkflow.supplementProductImages(product)
  return { message: `${nextProduct.productCode} 已补图，状态变为可上架` }
}
