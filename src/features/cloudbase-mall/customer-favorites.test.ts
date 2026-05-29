import { describe, expect, it, vi } from 'vitest'
import type {
  CloudBaseMallApiClient,
  CustomerFavoriteProductsSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { createCustomerFavoriteProductsView } from '../customer-favorites/customer-favorites'
import {
  favoriteCloudBaseCustomerProduct,
  getCloudBaseCustomerFavoriteProductsView,
  removeCloudBaseCustomerFavoriteProduct,
  retryCloudBaseCustomerFavoriteProductsSnapshot,
  unfavoriteCloudBaseCustomerProduct,
} from './customer-favorites'

const snapshot = (productId = 'product-1'): CustomerFavoriteProductsSnapshot => ({
  customerId: 'customer-1',
  items: [{
    favoriteId: 'favorite-1',
    productId,
    productCode: 'P001',
    productName: 'Black coat',
    mainImageUrl: '',
    minPrice: 129,
    availability: 'available',
    availabilityLabel: 'Available',
    canOpenDetail: true,
    favoritedAt: '2026-05-28T00:00:00.000Z',
  }],
  totalCount: 1,
  availableCount: 1,
  unavailableCount: 0,
  serverTime: '2026-05-29T00:00:00.000Z',
})

const createClient = (
  overrides: Partial<CloudBaseMallApiClient> = {},
): CloudBaseMallApiClient => ({
  getCurrentCustomer: vi.fn(),
  bindCustomerPhone: vi.fn(),
  bindStaff: vi.fn(),
  createOcrBatch: vi.fn(),
  listOcrJobs: vi.fn(),
  processOcrJob: vi.fn(),
  retryOcrJob: vi.fn(),
  listOcrBatches: vi.fn(),
  getCurrentOcrBatch: vi.fn(),
  getLatestDrafts: vi.fn(),
  getLatestDraftReviewSnapshot: vi.fn(),
  updateDraft: vi.fn(),
  deleteDraft: vi.fn(),
  confirmBatch: vi.fn(),
  listProducts: vi.fn(),
  listOwnerProductCards: vi.fn(),
  listPublishedProducts: vi.fn(),
  listPublishedProductSummaries: vi.fn(),
  getPublishedProductDetail: vi.fn(),
  updateProductDescription: vi.fn(),
  updateSku: vi.fn(),
  restockSkus: vi.fn(),
  clearSkuStock: vi.fn(),
  publishProduct: vi.fn(),
  unpublishProduct: vi.fn(),
  deleteProduct: vi.fn(),
  listSkus: vi.fn(),
  listPendingImageTasks: vi.fn(),
  getStaffImageTaskSnapshot: vi.fn(),
  supplementProductImages: vi.fn(),
  createCustomerOrder: vi.fn(),
  getCustomerOrder: vi.fn(),
  getOwnerOrderSnapshot: vi.fn(),
  getOwnerDashboardSnapshot: vi.fn(),
  getCustomerShoppingBagSnapshot: vi.fn(),
  addCustomerShoppingBagItem: vi.fn(),
  updateCustomerShoppingBagItemQuantity: vi.fn(),
  selectCustomerShoppingBagItem: vi.fn(),
  removeCustomerShoppingBagItem: vi.fn(),
  clearUnavailableCustomerShoppingBagItems: vi.fn(),
  getCustomerFavoriteProductsSnapshot: vi.fn(),
  favoriteCustomerProduct: vi.fn(),
  unfavoriteCustomerProduct: vi.fn(),
  removeCustomerFavoriteProduct: vi.fn(),
  listMerchantOrders: vi.fn(),
  confirmMerchantOrder: vi.fn(),
  cancelMerchantOrder: vi.fn(),
  ...overrides,
})

describe('CloudBase customer favorites facade', () => {
  it('loads and retries the page-facing favorites ViewModel', async () => {
    const client = createClient({
      getCustomerFavoriteProductsSnapshot: vi.fn().mockResolvedValue(snapshot()),
    })

    const view = await getCloudBaseCustomerFavoriteProductsView(client)
    const retryView = await retryCloudBaseCustomerFavoriteProductsSnapshot(client)

    expect(client.getCustomerFavoriteProductsSnapshot).toHaveBeenCalledTimes(2)
    expect(view).toMatchObject({
      totalCount: 1,
      emptyMessage: '',
      loadingState: 'idle',
    })
    expect(retryView.items[0]).toMatchObject({
      productId: 'product-1',
      priceText: 'CNY 129.00',
    })
  })

  it('maps favorite, unfavorite, and remove commands with invalidation keys', async () => {
    const result = {
      snapshot: snapshot(),
      invalidatedSnapshotKeys: [
        'customer-favorites:customer-1:v1',
        'customer-product-detail:product-1:v1',
      ],
    }
    const removeResult = {
      snapshot: snapshot(),
      invalidatedSnapshotKeys: ['customer-favorites:customer-1:v1'],
    }
    const client = createClient({
      favoriteCustomerProduct: vi.fn().mockResolvedValue(result),
      unfavoriteCustomerProduct: vi.fn().mockResolvedValue(result),
      removeCustomerFavoriteProduct: vi.fn().mockResolvedValue(removeResult),
    })

    const favorite = await favoriteCloudBaseCustomerProduct('product-1', client)
    const unfavorite = await unfavoriteCloudBaseCustomerProduct('product-1', client)
    const removed = await removeCloudBaseCustomerFavoriteProduct('product-1', client)

    expect(client.favoriteCustomerProduct).toHaveBeenCalledWith('product-1')
    expect(client.unfavoriteCustomerProduct).toHaveBeenCalledWith('product-1')
    expect(client.removeCustomerFavoriteProduct).toHaveBeenCalledWith('product-1')
    expect(favorite).toMatchObject({
      status: 'succeeded',
      message: 'Favorite saved',
      invalidatedSnapshotKeys: result.invalidatedSnapshotKeys,
      view: { totalCount: 1 },
    })
    expect(unfavorite).toMatchObject({
      status: 'succeeded',
      message: 'Favorite removed',
      invalidatedSnapshotKeys: result.invalidatedSnapshotKeys,
    })
    expect(removed).toMatchObject({
      status: 'succeeded',
      message: 'Favorite removed',
      invalidatedSnapshotKeys: removeResult.invalidatedSnapshotKeys,
    })
  })

  it('keeps the previous view on command failure without invalidating caches', async () => {
    const previousView = createCustomerFavoriteProductsView(snapshot())
    const client = createClient({
      favoriteCustomerProduct: vi.fn().mockRejectedValue(new Error('favorite failed')),
    })

    const result = await favoriteCloudBaseCustomerProduct('product-1', client, previousView)

    expect(result).toMatchObject({
      status: 'failed',
      message: 'favorite failed',
      invalidatedSnapshotKeys: [],
      view: {
        totalCount: 1,
        loadingState: 'failed',
        failureMessage: 'favorite failed',
      },
    })
  })
})
