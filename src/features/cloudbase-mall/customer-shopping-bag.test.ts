import { describe, expect, it, vi } from 'vitest'

import type {
  CloudBaseMallApiClient,
  CustomerShoppingBagSnapshot,
} from '../../services/cloudbase/mall-api-client'
import {
  addCloudBaseCustomerShoppingBagItem,
  clearUnavailableCloudBaseCustomerShoppingBagItems,
  getCloudBaseCustomerShoppingBagView,
  removeCloudBaseCustomerShoppingBagItem,
  selectCloudBaseCustomerShoppingBagItem,
  updateCloudBaseCustomerShoppingBagItemQuantity,
} from './customer-shopping-bag'

const snapshot: CustomerShoppingBagSnapshot = {
  customerId: 'customer-1',
  items: [
    {
      id: 'bag-item-1',
      productId: 'product-1',
      skuId: 'sku-1',
      productName: 'Cotton Shirt',
      skuSpec: 'Black/M',
      quantity: 1,
      unitPrice: 129,
      lineTotal: 129,
      mainImageUrl: '/static/logo.png',
      availability: 'available',
      availabilityLabel: 'Available',
      isAvailableForCheckout: true,
      isSelected: true,
    },
  ],
  totalQuantity: 1,
  selectedQuantity: 1,
  selectedSubtotal: 129,
  unavailableCount: 0,
  serverTime: '2026-05-27T00:00:00.000Z',
}

const commandResult = {
  item: {
    id: 'bag-item-1',
    customerId: 'customer-1',
    productId: 'product-1',
    skuId: 'sku-1',
    quantity: 1,
    isSelected: true,
    createdAt: '2026-05-27T00:00:00.000Z',
    updatedAt: '2026-05-27T00:00:00.000Z',
  },
  snapshot,
  invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1'],
}

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient => {
  const missing = vi.fn(async () => {
    throw new Error('unexpected shopping-bag client call')
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
    getOwnerDashboardSnapshot: missing,
    getCustomerShoppingBagSnapshot: missing,
    addCustomerShoppingBagItem: missing,
    updateCustomerShoppingBagItemQuantity: missing,
    selectCustomerShoppingBagItem: missing,
    removeCustomerShoppingBagItem: missing,
    clearUnavailableCustomerShoppingBagItems: missing,
    listMerchantOrders: missing,
    confirmMerchantOrder: missing,
    cancelMerchantOrder: missing,
    ...overrides,
  }
}

describe('CloudBase customer shopping bag facade', () => {
  it('loads a page-facing shopping-bag ViewModel from the snapshot action', async () => {
    const client = createClient({
      getCustomerShoppingBagSnapshot: vi.fn(async () => snapshot),
    })

    await expect(getCloudBaseCustomerShoppingBagView(client)).resolves.toMatchObject({
      items: [{ id: 'bag-item-1', unitPriceText: '¥129.00' }],
      selectedSubtotalText: '¥129.00',
      loadingState: 'idle',
    })
    expect(client.getCustomerShoppingBagSnapshot).toHaveBeenCalledTimes(1)
  })

  it('maps write commands to refreshed views and invalidated snapshot keys', async () => {
    const client = createClient({
      addCustomerShoppingBagItem: vi.fn(async () => commandResult),
      updateCustomerShoppingBagItemQuantity: vi.fn(async () => commandResult),
      selectCustomerShoppingBagItem: vi.fn(async () => commandResult),
      removeCustomerShoppingBagItem: vi.fn(async () => commandResult),
      clearUnavailableCustomerShoppingBagItems: vi.fn(async () => ({
        removedItemIds: ['bag-item-2'],
        snapshot,
        invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1'],
      })),
    })

    await expect(addCloudBaseCustomerShoppingBagItem({ productId: 'product-1', skuId: 'sku-1', quantity: 1 }, client)).resolves.toMatchObject({
      status: 'succeeded',
      message: 'Added to shopping bag',
      invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1'],
      view: { selectedSubtotalText: '¥129.00' },
    })
    await updateCloudBaseCustomerShoppingBagItemQuantity('bag-item-1', 2, client)
    await selectCloudBaseCustomerShoppingBagItem('bag-item-1', false, client)
    await removeCloudBaseCustomerShoppingBagItem('bag-item-1', client)
    await clearUnavailableCloudBaseCustomerShoppingBagItems(client)

    expect(client.addCustomerShoppingBagItem).toHaveBeenCalledWith({ productId: 'product-1', skuId: 'sku-1', quantity: 1 })
    expect(client.updateCustomerShoppingBagItemQuantity).toHaveBeenCalledWith('bag-item-1', { quantity: 2 })
    expect(client.selectCustomerShoppingBagItem).toHaveBeenCalledWith('bag-item-1', { isSelected: false })
    expect(client.removeCustomerShoppingBagItem).toHaveBeenCalledWith('bag-item-1')
    expect(client.clearUnavailableCustomerShoppingBagItems).toHaveBeenCalledTimes(1)
  })

  it('returns a failed command result without replacing the previous usable view', async () => {
    const previousView = await getCloudBaseCustomerShoppingBagView(createClient({
      getCustomerShoppingBagSnapshot: vi.fn(async () => snapshot),
    }))
    const client = createClient({
      addCustomerShoppingBagItem: vi.fn(async () => {
        throw new Error('CloudBase unavailable')
      }),
    })

    await expect(addCloudBaseCustomerShoppingBagItem({ productId: 'product-1', skuId: 'sku-1', quantity: 1 }, client, previousView)).resolves.toMatchObject({
      status: 'failed',
      message: 'CloudBase unavailable',
      view: {
        items: previousView.items,
        loadingState: 'failed',
        failureMessage: 'CloudBase unavailable',
      },
    })
  })
})
