import { describe, expect, it } from 'vitest'

import type { CustomerOrdersSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerOrderDetailFailureView,
  createCustomerOrderDetailLoadingView,
  createCustomerOrderDetailPageView,
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
  it('formats customer-owned orders in Chinese for the My Orders page', () => {
    const view = createCustomerOrdersView(snapshot)

    expect(view).toMatchObject({
      totalCount: 1,
      totalCountLabel: '1 个订单',
      emptyMessage: '',
      loadingState: 'idle',
      lastUpdatedAt: '2026-06-04T09:01:00.000Z',
      items: [
        {
          id: 'order-1',
          statusLabel: '待商家确认',
          totalAmountText: '¥ 258.00',
          itemCountLabel: '2 件商品',
          primaryProductName: 'Cotton Shirt',
          createdAtLabel: '2026-06-04 09:00',
        },
      ],
    })
  })

  it('formats detail items and shipping address snapshot for the detail page', () => {
    const view = createCustomerOrderDetailPageView({
      ...snapshot.orders[0],
      shippingAddress: {
        addressId: 'address-1',
        contactName: 'Ada',
        phoneNumber: '13800000000',
        province: '上海市',
        city: '上海市',
        district: '静安区',
        detail: '南京西路 1 号',
      },
    })

    expect(view).toMatchObject({
      loadingState: 'idle',
      order: {
        id: 'order-1',
        statusLabel: '待商家确认',
        totalAmountText: '¥ 258.00',
        itemCountLabel: '2 件商品',
        createdAtLabel: '2026-06-04 09:00',
        updatedAtLabel: '2026-06-04 09:00',
        hasShippingAddress: true,
        shippingContactLine: 'Ada 13800000000',
        shippingAddressLine: '上海市 上海市 静安区 南京西路 1 号',
        detailItems: [
          {
            productName: 'Cotton Shirt',
            unitPriceText: '¥ 129.00',
            lineTotalText: '¥ 258.00',
            quantityLabel: 'x 2',
          },
        ],
      },
    })
  })

  it('uses the legacy shipping address fallback for old order detail records', () => {
    const view = createCustomerOrderDetailPageView(snapshot.orders[0])

    expect(view.order).toMatchObject({
      hasShippingAddress: false,
      shippingContactLine: '未记录收货地址',
      shippingAddressLine: '未记录收货地址',
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
    expect(createCustomerOrderDetailLoadingView()).toMatchObject({
      loadingState: 'loading',
      order: null,
      failureMessage: '',
    })
    expect(createCustomerOrderDetailFailureView(new Error('detail timeout'))).toMatchObject({
      loadingState: 'failed',
      order: null,
      failureMessage: 'detail timeout',
    })
  })
})
