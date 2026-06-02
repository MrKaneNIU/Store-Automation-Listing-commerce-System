import type { OcrBatch } from '../../domain/batch/types'
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

const batchStatusLabels: Record<OcrBatch['status'], string> = {
  uploaded: '已上传',
  recognized: '已识别',
  confirmed: '已确认',
}

const formatBatchDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '时间待确认'
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const createBatchOptionLabel = (batch: OcrBatch, products: Product[]) => {
  const pendingCount = products.filter((product) => product.createdFromBatchId === batch.id).length
  const shortId = batch.id.length > 8 ? batch.id.slice(-8) : batch.id

  return `批次 ${shortId} · ${formatBatchDate(batch.createdAt)} · ${batchStatusLabels[batch.status]} · 待补图 ${pendingCount} 件 · 上传 ${batch.imageUrls.length} 张`
}

export const getStaffImageTasksView = (params: { keyword: string; selectedBatchId: string }): StaffImageTasksViewModel => {
  const pendingProducts = mallAccess.listPendingImageProducts()
  const batchOptions = [
    allBatchesOption,
    ...mallAccess.listBatches().map((batch) => ({ label: createBatchOptionLabel(batch, pendingProducts), value: batch.id })),
  ]
  const keyword = params.keyword.trim()
  const products = pendingProducts
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
