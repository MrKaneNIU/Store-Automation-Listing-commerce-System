import type { OcrBatch, OcrJob } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { Order } from '../../domain/order/types'
import type { CustomerSession } from '../auth/customer-session'
import { getAdminWorkbenchSession } from '../auth/admin-workbench-session'
import type { CloudBaseFunctionClient } from './cloudbase-function-client'

type CloudBaseMallApiRequest = {
  action: string
  params?: Record<string, string>
  payload?: unknown
  adminSession?: {
    account: string
    role: 'creator' | 'owner' | 'staff'
    permissions: string[]
  }
}

type CreateOcrBatchInput = {
  imageUrls: string[]
  imageAssetIds?: string[]
  drafts: Array<{
    productCode: string
    productName: string
    salePrice: number
    spec: string
    stock: number
    confidence: number
    sourceImageUrl: string
  }>
}

type DraftPatchInput = Partial<{
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  correctionState: 'ocr_raw' | 'manual_corrected' | 'accepted'
}>

type SupplementProductImagesInput = {
  mainImageUrl: string
  imageUrls: string[]
}

type UpdateProductDescriptionInput = {
  description: string
}

type UpdateSkuInput = {
  spec: string
  salePrice: number
  stock: number
  reason: string
}

type RestockSkusInput = {
  quantity: number
  reason: string
}

type ClearSkuStockInput = {
  reason: string
}

type CustomerIdentity = {
  id: string
  openid: string
  appid?: string
  unionid?: string
  phoneNumber?: string
  authSource: 'wechat'
  createdAt: string
  updatedAt: string
}

type BindCustomerPhoneInput = {
  phoneCode: string
}

type BindStaffInput = {
  openid: string
  reason?: string
}

type RoleAssignment = {
  id: string
  openid: string
  role: 'owner' | 'staff' | 'customer'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type PublishedProductSummary = Product & {
  minPrice: number | '-'
}

type CreateCustomerOrderInput = {
  productId: string
  skuId: string
  quantity: number
  session: CustomerSession
}

export type CloudBaseMallApiClient = {
  getCurrentCustomer: () => Promise<{ customer: CustomerIdentity }>
  bindCustomerPhone: (input: BindCustomerPhoneInput) => Promise<{ customer: CustomerIdentity }>
  bindStaff: (input: BindStaffInput) => Promise<{ roleAssignment: RoleAssignment }>
  createOcrBatch: (input: CreateOcrBatchInput) => Promise<{ batch: OcrBatch; job: OcrJob; drafts: ProductDraft[] }>
  listOcrJobs: (batchId?: string) => Promise<{ jobs: OcrJob[] }>
  processOcrJob: (jobId: string) => Promise<{ job: OcrJob; drafts: ProductDraft[] }>
  retryOcrJob: (jobId: string) => Promise<{ job: OcrJob; drafts: ProductDraft[] }>
  listOcrBatches: () => Promise<{ batches: OcrBatch[] }>
  getCurrentOcrBatch: () => Promise<{ batch: OcrBatch | null }>
  getLatestDrafts: () => Promise<{ batch: OcrBatch | null; drafts: ProductDraft[] }>
  updateDraft: (draftId: string, patch: DraftPatchInput) => Promise<{ draft: ProductDraft }>
  deleteDraft: (draftId: string) => Promise<{ draft: ProductDraft }>
  confirmBatch: (batchId: string) => Promise<{ issues: Array<{ draftId: string; message: string }>; products: Product[]; skus: Sku[] }>
  listProducts: () => Promise<{ products: Product[] }>
  listPublishedProducts: () => Promise<{ products: Product[] }>
  listPublishedProductSummaries: () => Promise<{ products: PublishedProductSummary[] }>
  updateProductDescription: (productId: string, input: UpdateProductDescriptionInput) => Promise<{ product: Product }>
  updateSku: (productId: string, skuId: string, input: UpdateSkuInput) => Promise<{ sku: Sku }>
  restockSkus: (productId: string, input: RestockSkusInput) => Promise<{ skus: Sku[] }>
  clearSkuStock: (productId: string, input: ClearSkuStockInput) => Promise<{ skus: Sku[] }>
  publishProduct: (productId: string) => Promise<{ product: Product }>
  listSkus: (productId: string) => Promise<{ skus: Sku[] }>
  listPendingImageTasks: () => Promise<{ products: Product[] }>
  supplementProductImages: (productId: string, input: SupplementProductImagesInput) => Promise<{ product: Product }>
  createCustomerOrder: (input: CreateCustomerOrderInput) => Promise<{ order: Order }>
  getCustomerOrder: (orderId: string) => Promise<{ order: Order }>
  listMerchantOrders: () => Promise<{ orders: Order[] }>
  confirmMerchantOrder: (orderId: string) => Promise<{ order: Order }>
  cancelMerchantOrder: (orderId: string) => Promise<{ order: Order }>
}

const callMallApi = <TData>(
  functionClient: CloudBaseFunctionClient,
  request: CloudBaseMallApiRequest,
): Promise<TData> => {
  const adminSession = getAdminWorkbenchSession()

  return functionClient.call<TData>('mallApi', {
    ...request,
    ...(adminSession
      ? {
          adminSession: {
            account: adminSession.account,
            role: adminSession.role,
            permissions: adminSession.permissions,
          },
        }
      : {}),
  })
}

export const createCloudBaseMallApiClient = (
  functionClient: CloudBaseFunctionClient,
): CloudBaseMallApiClient => ({
  getCurrentCustomer() {
    return callMallApi(functionClient, { action: 'getCurrentCustomer' })
  },
  bindCustomerPhone(input) {
    return callMallApi(functionClient, { action: 'bindCustomerPhone', payload: input })
  },
  bindStaff(input) {
    return callMallApi(functionClient, { action: 'bindStaff', payload: input })
  },
  createOcrBatch(input) {
    return callMallApi(functionClient, { action: 'createOcrBatch', payload: input })
  },
  listOcrJobs(batchId) {
    return callMallApi(functionClient, {
      action: 'listOcrJobs',
      ...(batchId ? { params: { batchId } } : {}),
    })
  },
  processOcrJob(jobId) {
    return callMallApi(functionClient, { action: 'processOcrJob', params: { jobId } })
  },
  retryOcrJob(jobId) {
    return callMallApi(functionClient, { action: 'retryOcrJob', params: { jobId } })
  },
  listOcrBatches() {
    return callMallApi(functionClient, { action: 'listOcrBatches' })
  },
  getCurrentOcrBatch() {
    return callMallApi(functionClient, { action: 'getCurrentOcrBatch' })
  },
  getLatestDrafts() {
    return callMallApi(functionClient, { action: 'getLatestDrafts' })
  },
  updateDraft(draftId, patch) {
    return callMallApi(functionClient, { action: 'updateDraft', params: { draftId }, payload: patch })
  },
  deleteDraft(draftId) {
    return callMallApi(functionClient, { action: 'deleteDraft', params: { draftId } })
  },
  confirmBatch(batchId) {
    return callMallApi(functionClient, { action: 'confirmBatch', params: { batchId } })
  },
  listProducts() {
    return callMallApi(functionClient, { action: 'listProducts' })
  },
  listPublishedProducts() {
    return callMallApi(functionClient, { action: 'listPublishedProducts' })
  },
  listPublishedProductSummaries() {
    return callMallApi(functionClient, { action: 'listPublishedProductSummaries' })
  },
  updateProductDescription(productId, input) {
    return callMallApi(functionClient, { action: 'updateProductDescription', params: { productId }, payload: input })
  },
  updateSku(productId, skuId, input) {
    return callMallApi(functionClient, { action: 'updateSku', params: { productId, skuId }, payload: input })
  },
  restockSkus(productId, input) {
    return callMallApi(functionClient, { action: 'restockSkus', params: { productId }, payload: input })
  },
  clearSkuStock(productId, input) {
    return callMallApi(functionClient, { action: 'clearSkuStock', params: { productId }, payload: input })
  },
  publishProduct(productId) {
    return callMallApi(functionClient, { action: 'publishProduct', params: { productId } })
  },
  listSkus(productId) {
    return callMallApi(functionClient, { action: 'listSkus', params: { productId } })
  },
  listPendingImageTasks() {
    return callMallApi(functionClient, { action: 'listPendingImageTasks' })
  },
  supplementProductImages(productId, input) {
    return callMallApi(functionClient, { action: 'supplementProductImages', params: { productId }, payload: input })
  },
  createCustomerOrder(input) {
    return callMallApi(functionClient, { action: 'createCustomerOrder', payload: input })
  },
  getCustomerOrder(orderId) {
    return callMallApi(functionClient, { action: 'getCustomerOrder', params: { orderId } })
  },
  listMerchantOrders() {
    return callMallApi(functionClient, { action: 'listMerchantOrders' })
  },
  confirmMerchantOrder(orderId) {
    return callMallApi(functionClient, { action: 'confirmMerchantOrder', params: { orderId } })
  },
  cancelMerchantOrder(orderId) {
    return callMallApi(functionClient, { action: 'cancelMerchantOrder', params: { orderId } })
  },
})
