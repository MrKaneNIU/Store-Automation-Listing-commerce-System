import { describe, expect, it, vi } from 'vitest'

import type { CustomerFavoriteProductsSnapshot } from '../../../services/cloudbase/mall-api-client'
import { createCustomerFavoriteProductsView } from '../../../features/customer-favorites/customer-favorites'
import type { CustomerRuntimeRequestLogEntry } from '../../../services/performance/customer-runtime-request-log'
import { createCustomerFavoritesPageState } from './useCustomerFavoritesPageState'

const snapshot = (count: number): CustomerFavoriteProductsSnapshot => ({
  customerId: 'customer-1',
  items: Array.from({ length: count }, (_, index) => ({
    favoriteId: `favorite-${index + 1}`,
    productId: `product-${index + 1}`,
    productCode: `P00${index + 1}`,
    productName: `Favorite ${index + 1}`,
    mainImageUrl: '',
    minPrice: 129,
    availability: 'available',
    availabilityLabel: 'Available',
    canOpenDetail: true,
    favoritedAt: '2026-06-01T00:00:00.000Z',
  })),
  totalCount: count,
  availableCount: count,
  unavailableCount: 0,
  serverTime: '2026-06-01T00:00:00.000Z',
})

const viewWithProductIds = (productIds: string[]) => createCustomerFavoriteProductsView({
  ...snapshot(productIds.length),
  items: productIds.map((productId, index) => ({
    favoriteId: `favorite-${productId}`,
    productId,
    productCode: `P00${index + 1}`,
    productName: `Favorite ${index + 1}`,
    mainImageUrl: '',
    minPrice: 129,
    availability: 'available',
    availabilityLabel: 'Available',
    canOpenDetail: true,
    favoritedAt: '2026-06-01T00:00:00.000Z',
  })),
  totalCount: productIds.length,
  availableCount: productIds.length,
})

describe('customer favorites page state', () => {
  it('deduplicates concurrent snapshot loads and logs the reused request', async () => {
    const logs: CustomerRuntimeRequestLogEntry[] = []
    const loader = vi.fn(async () => createCustomerFavoriteProductsView(snapshot(1)))
    const state = createCustomerFavoritesPageState({
      loadView: loader,
      requestLogger: (entry) => logs.push(entry),
    })

    await Promise.all([
      state.loadSnapshot({ showLoading: true, source: 'onShow' }),
      state.loadSnapshot({ showLoading: true, source: 'onShow' }),
    ])

    expect(loader).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.totalCount).toBe(1)
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'getCustomerFavoriteProductsSnapshot', source: 'onShow', deduped: true }),
      expect.objectContaining({ action: 'getCustomerFavoriteProductsSnapshot', source: 'onShow', deduped: false }),
    ]))
  })

  it('short-caches quick tab returns and invalidates after favorite removal', async () => {
    let currentTime = 1000
    const loader = vi
      .fn()
      .mockResolvedValueOnce(createCustomerFavoriteProductsView(snapshot(1)))
      .mockResolvedValueOnce(createCustomerFavoriteProductsView(snapshot(0)))
    const state = createCustomerFavoritesPageState({
      loadView: loader,
      removeFavorite: vi.fn(async (_productId, previousView) => ({
        view: createCustomerFavoriteProductsView(snapshot(0)),
        message: `${previousView.totalCount} removed`,
      })),
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.loadSnapshot({ showLoading: true, source: 'onShow' })
    currentTime += 500
    await state.loadSnapshot({ showLoading: false, source: 'onShow' })
    await state.removeFavorite('product-1')
    currentTime += 3001
    await state.loadSnapshot({ showLoading: false, source: 'onShow' })

    expect(loader).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.totalCount).toBe(0)
  })

  it('deduplicates rapid retry taps to one retry request', async () => {
    let resolveRetry: (view: ReturnType<typeof createCustomerFavoriteProductsView>) => void = () => {}
    const retryView = vi.fn(() => new Promise<ReturnType<typeof createCustomerFavoriteProductsView>>((resolve) => {
      resolveRetry = resolve
    }))
    const state = createCustomerFavoritesPageState({
      retryView,
    })

    const first = state.reload()
    const second = state.reload()
    resolveRetry(createCustomerFavoriteProductsView(snapshot(1)))
    await Promise.all([first, second])

    expect(retryView).toHaveBeenCalledTimes(1)
  })

  it('does not let an older pending refresh restore a removed favorite', async () => {
    let currentTime = 1000
    let resolveRefresh: (view: ReturnType<typeof createCustomerFavoriteProductsView>) => void = () => {}
    const loader = vi
      .fn()
      .mockResolvedValueOnce(viewWithProductIds(['product-1', 'product-2']))
      .mockImplementationOnce(() => new Promise<ReturnType<typeof createCustomerFavoriteProductsView>>((resolve) => {
        resolveRefresh = resolve
      }))
    const state = createCustomerFavoritesPageState({
      loadView: loader,
      removeFavorite: vi.fn(async () => ({
        view: viewWithProductIds(['product-2']),
        message: 'removed',
      })),
      now: () => currentTime,
      cacheTtlMs: 3000,
    })

    await state.loadSnapshot({ showLoading: true, source: 'onShow' })
    currentTime += 3001
    const pendingRefresh = state.loadSnapshot({ showLoading: false, source: 'onShow' })
    await state.removeFavorite('product-1')
    resolveRefresh(viewWithProductIds(['product-1', 'product-2']))
    await pendingRefresh

    expect(loader).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.items.map((item) => item.productId)).toEqual(['product-2'])
    expect(state.viewModel.value.totalCount).toBe(1)
  })
})
