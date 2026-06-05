import { describe, expect, it } from 'vitest'

import type { CustomerOrdersSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerOrdersFailureView,
  createCustomerOrdersLoadingView,
  createCustomerOrdersView,
} from './customer-orders'

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
          quantity: 2,
        },
      ],
      totalAmount: 258,
      createdAt: '2026-06-04T09:00:00.000Z',
      updatedAt: '2026-06-04T09:00:00.000Z',
    },
  ],
  totalCount: 1,
  serverTime: '2026-06-04T09:01:00.000Z',
}

describe('customer orders ViewModel', () => {
  it('formats customer-owned orders for the My Orders page', () => {
    const view = createCustomerOrdersView(snapshot)

    expect(view).toMatchObject({
      totalCount: 1,
      totalCountLabel: '1 order',
      emptyMessage: '',
      loadingState: 'idle',
      lastUpdatedAt: '2026-06-04T09:01:00.000Z',
      items: [
        {
          id: 'order-1',
          statusLabel: 'Pending merchant confirmation',
          totalAmountText: '¥258.00',
          itemCountLabel: '2 items',
          primaryProductName: 'Cotton Shirt',
        },
      ],
    })
  })

  it('creates loading and failure states without order mutation affordances', () => {
    expect(createCustomerOrdersLoadingView()).toMatchObject({
      loadingState: 'loading',
      items: [],
    })
    expect(createCustomerOrdersFailureView(new Error('network timeout'))).toMatchObject({
      loadingState: 'failed',
      failureMessage: 'network timeout',
      items: [],
    })
  })
})
