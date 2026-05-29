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

export type PublishedProductDetail = {
  product: Product | null
  skus: Sku[]
  serverTime: string
}

export type LatestDraftReviewSnapshot = {
  batch: OcrBatch | null
  drafts: ProductDraft[]
  serverTime: string
}

export type OwnerProductCard = Product & {
  statusLabel: string
  skuCount: number
  canPublish: boolean
  publishBlockReasons: string[]
}

export type StaffImageTaskSnapshot = {
  batches: OcrBatch[]
  products: Product[]
  serverTime: string
}

export type OwnerOrderSnapshot = {
  orders: Order[]
  serverTime: string
}

export type OwnerDashboardSnapshot = {
  pendingDraftCount: number
  pendingImageTaskCount: number
  pendingOrderCount: number
  serverTime: string
}

type CreateCustomerOrderInput = {
  productId: string
  skuId: string
  quantity: number
  session: CustomerSession
}

type CustomerShoppingBagAvailability = 'available' | 'unpublished' | 'skuUnavailable' | 'outOfStock'

export type CustomerShoppingBagItem = {
  id: string
  productId: string
  skuId: string
  productName: string
  skuSpec: string
  quantity: number
  unitPrice: number
  lineTotal: number
  mainImageUrl: string
  availability: CustomerShoppingBagAvailability
  availabilityLabel: string
  isAvailableForCheckout: boolean
  isSelected: boolean
}

export type CustomerShoppingBagSnapshot = {
  customerId: string
  items: CustomerShoppingBagItem[]
  totalQuantity: number
  selectedQuantity: number
  selectedSubtotal: number
  unavailableCount: number
  serverTime: string
}

type AddCustomerShoppingBagItemInput = {
  productId: string
  skuId: string
  quantity: number
}

type UpdateCustomerShoppingBagItemQuantityInput = {
  quantity: number
}

type SelectCustomerShoppingBagItemInput = {
  isSelected: boolean
}

type CustomerShoppingBagCommandResult = {
  item: {
    id: string
    customerId: string
    productId: string
    skuId: string
    quantity: number
    isSelected: boolean
    createdAt: string
    updatedAt: string
  }
  snapshot: CustomerShoppingBagSnapshot
  invalidatedSnapshotKeys: string[]
}

type CustomerFavoriteProductAvailability = 'available' | 'unpublished' | 'deleted'

export type CustomerFavoriteProductItem = {
  favoriteId: string
  productId: string
  productCode: string
  productName: string
  mainImageUrl: string
  minPrice: number | '-'
  availability: CustomerFavoriteProductAvailability
  availabilityLabel: string
  canOpenDetail: boolean
  favoritedAt: string
}

export type CustomerFavoriteProductsSnapshot = {
  customerId: string
  items: CustomerFavoriteProductItem[]
  totalCount: number
  availableCount: number
  unavailableCount: number
  serverTime: string
}

type CustomerFavoriteProductRecord = {
  id: string
  customerId: string
  productId: string
  createdAt: string
  updatedAt: string
}

type CustomerFavoriteProductInput = {
  productId: string
}

type CustomerFavoriteProductCommandResult = {
  favorite?: CustomerFavoriteProductRecord
  removedFavorite?: CustomerFavoriteProductRecord | null
  snapshot: CustomerFavoriteProductsSnapshot
  invalidatedSnapshotKeys: string[]
}

type ClearUnavailableCustomerShoppingBagItemsResult = {
  removedItemIds: string[]
  snapshot: CustomerShoppingBagSnapshot
  invalidatedSnapshotKeys: string[]
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
  getLatestDraftReviewSnapshot: () => Promise<LatestDraftReviewSnapshot>
  updateDraft: (draftId: string, patch: DraftPatchInput) => Promise<{ draft: ProductDraft }>
  deleteDraft: (draftId: string) => Promise<{ draft: ProductDraft }>
  confirmBatch: (batchId: string) => Promise<{ issues: Array<{ draftId: string; message: string }>; products: Product[]; skus: Sku[] }>
  listProducts: () => Promise<{ products: Product[] }>
  listOwnerProductCards: () => Promise<{ products: OwnerProductCard[]; readyProductCount: number; serverTime: string }>
  listPublishedProducts: () => Promise<{ products: Product[] }>
  listPublishedProductSummaries: () => Promise<{ products: PublishedProductSummary[] }>
  getPublishedProductDetail: (productId: string) => Promise<PublishedProductDetail>
  updateProductDescription: (productId: string, input: UpdateProductDescriptionInput) => Promise<{ product: Product }>
  updateSku: (productId: string, skuId: string, input: UpdateSkuInput) => Promise<{ sku: Sku }>
  restockSkus: (productId: string, input: RestockSkusInput) => Promise<{ skus: Sku[] }>
  clearSkuStock: (productId: string, input: ClearSkuStockInput) => Promise<{ skus: Sku[] }>
  publishProduct: (productId: string) => Promise<{ product: Product }>
  unpublishProduct: (productId: string) => Promise<{ product: Product }>
  deleteProduct: (productId: string) => Promise<{ product: Product; deletedSkuCount: number }>
  listSkus: (productId: string) => Promise<{ skus: Sku[] }>
  listPendingImageTasks: () => Promise<{ products: Product[] }>
  getStaffImageTaskSnapshot: () => Promise<StaffImageTaskSnapshot>
  supplementProductImages: (productId: string, input: SupplementProductImagesInput) => Promise<{ product: Product }>
  createCustomerOrder: (input: CreateCustomerOrderInput) => Promise<{ order: Order }>
  getCustomerOrder: (orderId: string) => Promise<{ order: Order }>
  getOwnerOrderSnapshot: () => Promise<OwnerOrderSnapshot>
  getOwnerDashboardSnapshot: () => Promise<OwnerDashboardSnapshot>
  getCustomerShoppingBagSnapshot: () => Promise<CustomerShoppingBagSnapshot>
  addCustomerShoppingBagItem: (input: AddCustomerShoppingBagItemInput) => Promise<CustomerShoppingBagCommandResult>
  updateCustomerShoppingBagItemQuantity: (
    itemId: string,
    input: UpdateCustomerShoppingBagItemQuantityInput,
  ) => Promise<CustomerShoppingBagCommandResult>
  selectCustomerShoppingBagItem: (
    itemId: string,
    input: SelectCustomerShoppingBagItemInput,
  ) => Promise<CustomerShoppingBagCommandResult>
  removeCustomerShoppingBagItem: (itemId: string) => Promise<CustomerShoppingBagCommandResult>
  clearUnavailableCustomerShoppingBagItems: () => Promise<ClearUnavailableCustomerShoppingBagItemsResult>
  getCustomerFavoriteProductsSnapshot: () => Promise<CustomerFavoriteProductsSnapshot>
  favoriteCustomerProduct: (productId: string) => Promise<CustomerFavoriteProductCommandResult>
  unfavoriteCustomerProduct: (productId: string) => Promise<CustomerFavoriteProductCommandResult>
  removeCustomerFavoriteProduct: (productId: string) => Promise<CustomerFavoriteProductCommandResult>
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
  getLatestDraftReviewSnapshot() {
    return callMallApi(functionClient, { action: 'getLatestDraftReviewSnapshot' })
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
  listOwnerProductCards() {
    return callMallApi(functionClient, { action: 'listOwnerProductCards' })
  },
  listPublishedProducts() {
    return callMallApi(functionClient, { action: 'listPublishedProducts' })
  },
  listPublishedProductSummaries() {
    return callMallApi(functionClient, { action: 'listPublishedProductSummaries' })
  },
  getPublishedProductDetail(productId) {
    return callMallApi(functionClient, { action: 'getPublishedProductDetail', params: { productId } })
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
  unpublishProduct(productId) {
    return callMallApi(functionClient, { action: 'unpublishProduct', params: { productId } })
  },
  deleteProduct(productId) {
    return callMallApi(functionClient, { action: 'deleteProduct', params: { productId } })
  },
  listSkus(productId) {
    return callMallApi(functionClient, { action: 'listSkus', params: { productId } })
  },
  listPendingImageTasks() {
    return callMallApi(functionClient, { action: 'listPendingImageTasks' })
  },
  getStaffImageTaskSnapshot() {
    return callMallApi(functionClient, { action: 'getStaffImageTaskSnapshot' })
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
  getOwnerOrderSnapshot() {
    return callMallApi(functionClient, { action: 'getOwnerOrderSnapshot' })
  },
  getOwnerDashboardSnapshot() {
    return callMallApi(functionClient, { action: 'getOwnerDashboardSnapshot' })
  },
  getCustomerShoppingBagSnapshot() {
    return callMallApi(functionClient, { action: 'getCustomerShoppingBagSnapshot' })
  },
  addCustomerShoppingBagItem(input) {
    return callMallApi(functionClient, { action: 'addCustomerShoppingBagItem', payload: input })
  },
  updateCustomerShoppingBagItemQuantity(itemId, input) {
    return callMallApi(functionClient, {
      action: 'updateCustomerShoppingBagItemQuantity',
      params: { itemId },
      payload: input,
    })
  },
  selectCustomerShoppingBagItem(itemId, input) {
    return callMallApi(functionClient, {
      action: 'selectCustomerShoppingBagItem',
      params: { itemId },
      payload: input,
    })
  },
  removeCustomerShoppingBagItem(itemId) {
    return callMallApi(functionClient, { action: 'removeCustomerShoppingBagItem', params: { itemId } })
  },
  clearUnavailableCustomerShoppingBagItems() {
    return callMallApi(functionClient, { action: 'clearUnavailableCustomerShoppingBagItems' })
  },
  getCustomerFavoriteProductsSnapshot() {
    return callMallApi(functionClient, { action: 'getCustomerFavoriteProductsSnapshot' })
  },
  favoriteCustomerProduct(productId) {
    const payload: CustomerFavoriteProductInput = { productId }
    return callMallApi(functionClient, { action: 'favoriteCustomerProduct', payload })
  },
  unfavoriteCustomerProduct(productId) {
    const payload: CustomerFavoriteProductInput = { productId }
    return callMallApi(functionClient, { action: 'unfavoriteCustomerProduct', payload })
  },
  removeCustomerFavoriteProduct(productId) {
    const payload: CustomerFavoriteProductInput = { productId }
    return callMallApi(functionClient, { action: 'removeCustomerFavoriteProduct', payload })
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
