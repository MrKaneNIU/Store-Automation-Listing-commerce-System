import { describe, expect, it, vi } from 'vitest'

import {
  createCustomerOrdersView,
  type CustomerOrdersView,
} from '../../../features/customer-orders/customer-orders'
import type { CustomerOrdersSnapshot } from '../../../services/cloudbase/mall-api-client'
import { createCustomerOrdersPageState } from './useCustomerOrdersPageState'

const createSnapshot = (): CustomerOrdersSnapshot => ({
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
})

describe('customer orders page state', () => {
  it('deduplicates customer order snapshot loads and keeps the view read-only', async () => {
    const view = createCustomerOrdersView(createSnapshot())
    const loadView = vi.fn(async (): Promise<CustomerOrdersView> => view)
    const state = createCustomerOrdersPageState({ loadView })

    await Promise.all([state.loadSnapshot({ showLoading: true }), state.loadSnapshot({ showLoading: true })])

    expect(loadView).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.items).toHaveLength(1)
    expect(state.viewModel.value.loadingState).toBe('idle')
    expect(Object.keys(state)).not.toEqual(expect.arrayContaining(['confirmOrder', 'cancelOrder', 'payOrder']))
  })

  it('surfaces load failures without clearing the previous usable list', async () => {
    let currentView = createCustomerOrdersView(createSnapshot())
    const state = createCustomerOrdersPageState({
      loadView: vi.fn(async () => {
        if (currentView.items.length > 0) {
          const view = currentView
          currentView = createCustomerOrdersView({ customerId: 'customer-1', orders: [], totalCount: 0, serverTime: '' })
          return view
        }
        throw new Error('network timeout')
      }),
      cacheTtlMs: 0,
    })

    await state.handlePageShow()
    await state.handlePageShow()

    expect(state.viewModel.value.items).toHaveLength(1)
    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.message.value).toBe('network timeout')
  })
})
