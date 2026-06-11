import { describe, expect, it, vi } from 'vitest'

import {
  createCustomerOrderDetailPageView,
  type CustomerOrderDetailPageView,
} from '../../../features/customer-orders/customer-orders'
import type { Order } from '../../../domain/order/types'
import { createCustomerOrderDetailPageState } from './useCustomerOrderDetailPageState'

const order: Order = {
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
}

describe('customer order detail page state', () => {
  it('loads detail by orderId through the injected customer-scoped facade', async () => {
    const loadView = vi.fn(async (): Promise<CustomerOrderDetailPageView> =>
      createCustomerOrderDetailPageView(order),
    )
    const state = createCustomerOrderDetailPageState({ loadView })

    await state.loadOrder('order-1', { showLoading: true })

    expect(loadView).toHaveBeenCalledWith('order-1')
    expect(JSON.stringify(loadView.mock.calls)).not.toContain('customerId')
    expect(JSON.stringify(loadView.mock.calls)).not.toContain('openid')
    expect(state.viewModel.value.order?.id).toBe('order-1')
    expect(state.viewModel.value.loadingState).toBe('idle')
  })

  it('deduplicates repeated detail loads and supports retry after failure', async () => {
    const loadView = vi
      .fn<() => Promise<CustomerOrderDetailPageView>>()
      .mockRejectedValueOnce(new Error('detail unavailable'))
      .mockResolvedValueOnce(createCustomerOrderDetailPageView(order))
    const state = createCustomerOrderDetailPageState({ loadView })

    await Promise.all([
      state.loadOrder('order-1', { showLoading: true }),
      state.loadOrder('order-1', { showLoading: true }),
    ])

    expect(loadView).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.message.value).toBe('detail unavailable')

    await state.reload()

    expect(loadView).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.loadingState).toBe('idle')
    expect(state.message.value).toBe('')
  })
})
