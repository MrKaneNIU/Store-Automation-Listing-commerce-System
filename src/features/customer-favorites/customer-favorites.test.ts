import { describe, expect, it } from 'vitest'
import type { CustomerFavoriteProductsSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerFavoriteProductsFailureView,
  createCustomerFavoriteProductsLoadingView,
  createCustomerFavoriteProductsView,
} from './customer-favorites'

const favoriteSnapshot = (items: CustomerFavoriteProductsSnapshot['items']): CustomerFavoriteProductsSnapshot => ({
  customerId: 'customer-1',
  items,
  totalCount: items.length,
  availableCount: items.filter((item) => item.availability === 'available').length,
  unavailableCount: items.filter((item) => item.availability !== 'available').length,
  serverTime: '2026-05-29T00:00:00.000Z',
})

describe('customer favorites ViewModel', () => {
  it('maps favorite product cards with labels and unavailable state', () => {
    const view = createCustomerFavoriteProductsView(favoriteSnapshot([
      {
        favoriteId: 'favorite-1',
        productId: 'product-1',
        productCode: 'P001',
        productName: 'Black coat',
        mainImageUrl: 'cloud://image',
        minPrice: 129,
        availability: 'available',
        availabilityLabel: 'Available',
        canOpenDetail: true,
        favoritedAt: '2026-05-28T00:00:00.000Z',
      },
      {
        favoriteId: 'favorite-2',
        productId: 'product-2',
        productCode: 'P002',
        productName: 'Archived dress',
        mainImageUrl: '',
        minPrice: '-',
        availability: 'deleted',
        availabilityLabel: 'Deleted',
        canOpenDetail: false,
        favoritedAt: '2026-05-27T00:00:00.000Z',
      },
    ]))

    expect(view).toMatchObject({
      totalCount: 2,
      availableCount: 1,
      unavailableCount: 1,
      emptyMessage: '',
      loadingState: 'idle',
      failureMessage: '',
      lastUpdatedAt: '2026-05-29T00:00:00.000Z',
    })
    expect(view.items[0]).toMatchObject({
      productId: 'product-1',
      priceText: 'CNY 129.00',
      isUnavailable: false,
      canOpenDetail: true,
    })
    expect(view.items[1]).toMatchObject({
      productId: 'product-2',
      priceText: '-',
      isUnavailable: true,
      availability: 'deleted',
      canOpenDetail: false,
    })
  })

  it('creates empty, loading, refreshing, and failure states', () => {
    const emptyView = createCustomerFavoriteProductsView(favoriteSnapshot([]))
    const loadingView = createCustomerFavoriteProductsLoadingView()
    const refreshingView = createCustomerFavoriteProductsLoadingView(emptyView)
    const failedFreshView = createCustomerFavoriteProductsFailureView(new Error('network failed'))
    const failedRefreshView = createCustomerFavoriteProductsFailureView('retry failed', emptyView)

    expect(emptyView).toMatchObject({
      items: [],
      emptyMessage: 'No favorite products yet',
      loadingState: 'idle',
    })
    expect(loadingView).toMatchObject({
      items: [],
      loadingState: 'loading',
      failureMessage: '',
    })
    expect(refreshingView).toMatchObject({
      items: [],
      loadingState: 'refreshing',
      failureMessage: '',
    })
    expect(failedFreshView).toMatchObject({
      items: [],
      loadingState: 'failed',
      failureMessage: 'network failed',
    })
    expect(failedRefreshView).toMatchObject({
      items: [],
      loadingState: 'failed',
      failureMessage: 'retry failed',
    })
  })
})
