import { describe, expect, it, vi } from 'vitest'
import { createCustomerShoppingBagView, type CustomerShoppingBagViewModel } from '../../../features/customer-shopping-bag/customer-shopping-bag'
import type { CloudBaseCustomerShoppingBagCommandResult } from '../../../features/cloudbase-mall/customer-shopping-bag'
import type { CustomerShoppingBagSnapshot } from '../../../services/cloudbase/mall-api-client'
import { createCustomerShoppingBagPageState } from './useCustomerShoppingBagPageState'

const createSnapshot = (quantity: number): CustomerShoppingBagSnapshot => ({
  customerId: 'customer-1',
  items: [
    {
      id: 'bag-item-1',
      productId: 'product-1',
      skuId: 'sku-1',
      productName: 'Cotton Shirt',
      skuSpec: 'Black/M',
      quantity,
      unitPrice: 129,
      lineTotal: 129 * quantity,
      mainImageUrl: '/static/logo.png',
      availability: 'available',
      availabilityLabel: 'Available',
      isAvailableForCheckout: true,
      isSelected: true,
    },
  ],
  totalQuantity: quantity,
  selectedQuantity: quantity,
  selectedSubtotal: 129 * quantity,
  unavailableCount: 0,
  serverTime: '2026-05-28T00:00:00.000Z',
})

const createCommandResult = (view: CustomerShoppingBagViewModel): CloudBaseCustomerShoppingBagCommandResult => ({
  status: 'succeeded',
  message: 'Quantity updated',
  invalidatedSnapshotKeys: ['customer-shopping-bag:customer-1:v1'],
  view,
})

describe('customer shopping bag page state', () => {
  it('deduplicates concurrent snapshot loads', async () => {
    const loader = vi.fn(async () => createCustomerShoppingBagView(createSnapshot(1)))
    const state = createCustomerShoppingBagPageState({ loadView: loader })

    await Promise.all([state.loadSnapshot({ showLoading: true }), state.loadSnapshot({ showLoading: true })])

    expect(loader).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.totalQuantity).toBe(1)
    expect(state.viewModel.value.loadingState).toBe('idle')
  })

  it('keeps the cached view visible while refreshing on return entry', async () => {
    let resolveRefresh: (view: CustomerShoppingBagViewModel) => void = () => {}
    const firstView = createCustomerShoppingBagView(createSnapshot(1))
    const refreshedView = createCustomerShoppingBagView(createSnapshot(2))
    const loader = vi
      .fn()
      .mockResolvedValueOnce(firstView)
      .mockImplementationOnce(() => new Promise<CustomerShoppingBagViewModel>((resolve) => {
        resolveRefresh = resolve
      }))
    const state = createCustomerShoppingBagPageState({ loadView: loader })

    await state.handlePageShow()
    const refreshPromise = state.handlePageShow()

    expect(state.viewModel.value.items).toEqual(firstView.items)
    expect(state.viewModel.value.loadingState).toBe('refreshing')

    resolveRefresh(refreshedView)
    await refreshPromise

    expect(state.viewModel.value.totalQuantity).toBe(2)
  })

  it('keeps the previous usable view when a return refresh fails', async () => {
    const firstView = createCustomerShoppingBagView(createSnapshot(1))
    const loader = vi
      .fn()
      .mockResolvedValueOnce(firstView)
      .mockRejectedValueOnce(new Error('network timeout'))
    const state = createCustomerShoppingBagPageState({ loadView: loader })

    await state.handlePageShow()
    await state.handlePageShow()

    expect(state.viewModel.value.items).toEqual(firstView.items)
    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.viewModel.value.failureMessage).toBe('network timeout')
  })

  it('maps write commands to refreshed views and invalidated snapshot keys', async () => {
    const initialView = createCustomerShoppingBagView(createSnapshot(1))
    const updatedView = createCustomerShoppingBagView(createSnapshot(2))
    const updateQuantity = vi.fn(async () => createCommandResult(updatedView))
    const state = createCustomerShoppingBagPageState({
      loadView: vi.fn(async () => initialView),
      updateQuantity,
    })

    await state.handlePageShow()
    await state.updateQuantity('bag-item-1', 2)

    expect(updateQuantity).toHaveBeenCalledWith('bag-item-1', 2, initialView)
    expect(state.message.value).toBe('Quantity updated')
    expect(state.invalidatedSnapshotKeys.value).toEqual(['customer-shopping-bag:customer-1:v1'])
    expect(state.viewModel.value.selectedSubtotalText).toBe('¥258.00')
  })
})
