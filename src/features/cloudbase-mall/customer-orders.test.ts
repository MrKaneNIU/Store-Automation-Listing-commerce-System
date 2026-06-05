import { describe, expect, it, vi } from 'vitest'

import type { CloudBaseMallApiClient, CustomerOrdersSnapshot } from '../../services/cloudbase/mall-api-client'
import { getCloudBaseCustomerOrdersView } from './customer-orders'

const snapshot: CustomerOrdersSnapshot = {
  customerId: 'customer-1',
  orders: [
    {
      id: 'order-1',
      customerName: 'Wechat Customer',
      customerPhone: '13800000000',
      customerId: 'customer-1',
      customerAuthSource: 'wechat',
      status: 'pending_merchant_confirm',
      items: [
        {
          skuId: 'sku-1',
          productId: 'product-1',
          productName: 'Cotton Shirt',
          productCode: 'A1023',
          spec: 'Black/M',
          salePrice: 129,
          quantity: 1,
        },
      ],
      totalAmount: 129,
      createdAt: '2026-06-04T09:00:00.000Z',
      updatedAt: '2026-06-04T09:00:00.000Z',
    },
  ],
  totalCount: 1,
  serverTime: '2026-06-04T09:01:00.000Z',
}

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient => {
  const missing = vi.fn(async () => {
    throw new Error('unexpected mallApi call')
  })

  return {
    getCurrentCustomer: missing,
    bindCustomerPhone: missing,
    bindStaff: missing,
    createOcrBatch: missing,
    listOcrJobs: missing,
    processOcrJob: missing,
    retryOcrJob: missing,
    listOcrBatches: missing,
    getCurrentOcrBatch: missing,
    getLatestDrafts: missing,
    getLatestDraftReviewSnapshot: missing,
    updateDraft: missing,
    deleteDraft: missing,
    confirmBatch: missing,
    listProducts: missing,
    listPublishedProducts: missing,
    listPublishedProductSummaries: missing,
    getPublishedProductDetail: missing,
    listOwnerProductCards: missing,
    updateProductDescription: missing,
    updateProductBasics: missing,
    updateSku: missing,
    restockSkus: missing,
    clearSkuStock: missing,
    publishProduct: missing,
    unpublishProduct: missing,
    deleteProduct: missing,
    listSkus: missing,
    listPendingImageTasks: missing,
    getStaffImageTaskSnapshot: missing,
    supplementProductImages: missing,
    createCustomerOrder: missing,
    getCustomerOrder: missing,
    getOwnerOrderSnapshot: missing,
    getManagerOrderNotificationConfig: missing,
    subscribeManagerOrderNotifications: missing,
    getOwnerDashboardSnapshot: missing,
    getCustomerShoppingBagSnapshot: missing,
    addCustomerShoppingBagItem: missing,
    updateCustomerShoppingBagItemQuantity: missing,
    selectCustomerShoppingBagItem: missing,
    removeCustomerShoppingBagItem: missing,
    clearUnavailableCustomerShoppingBagItems: missing,
    checkoutCustomerShoppingBag: missing,
    getCustomerFavoriteProductsSnapshot: missing,
    favoriteCustomerProduct: missing,
    unfavoriteCustomerProduct: missing,
    removeCustomerFavoriteProduct: missing,
    getCustomerOrdersSnapshot: missing,
    listMerchantOrders: missing,
    confirmMerchantOrder: missing,
    cancelMerchantOrder: missing,
    ...overrides,
  }
}

describe('CloudBase customer orders facade', () => {
  it('loads customer-owned orders through the customer-scoped snapshot action', async () => {
    const client = createClient({
      getCustomerOrdersSnapshot: vi.fn(async () => snapshot),
    })

    await expect(getCloudBaseCustomerOrdersView(client)).resolves.toMatchObject({
      totalCount: 1,
      items: [{ id: 'order-1', totalAmountText: '¥129.00' }],
    })
    expect(client.getCustomerOrdersSnapshot).toHaveBeenCalledTimes(1)
  })

  it('returns a failure ViewModel without exposing raw infrastructure details', async () => {
    const client = createClient({
      getCustomerOrdersSnapshot: vi.fn(async () => {
        throw new Error('CloudBase unavailable')
      }),
    })

    await expect(getCloudBaseCustomerOrdersView(client)).resolves.toMatchObject({
      loadingState: 'failed',
      failureMessage: 'CloudBase unavailable',
      items: [],
    })
  })
})
