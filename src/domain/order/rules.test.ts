import { describe, expect, it } from 'vitest'
import type { Product, Sku } from '../catalog/types'
import { canCreateOrder, cancelOrder, confirmOrder, createPendingOrder } from './rules'

const product: Product = {
  id: 'product-1',
  productCode: 'A1023',
  productName: '圆领针织衫',
  mainImageUrl: '/tmp/main.png',
  imageUrls: ['/tmp/main.png'],
  status: 'published',
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-07T00:00:00.000Z',
  updatedAt: '2026-05-07T00:00:00.000Z',
}

const sku: Sku = {
  id: 'sku-1',
  productId: 'product-1',
  productCode: 'A1023',
  spec: '黑色/M',
  salePrice: 129,
  stock: 1,
}

describe('canCreateOrder', () => {
  it('allows orders only for published products with enough stock', () => {
    expect(canCreateOrder(product, sku, 1)).toBe(true)
    expect(canCreateOrder({ ...product, status: 'pending_images' }, sku, 1)).toBe(false)
    expect(canCreateOrder({ ...product, status: 'ready_to_publish' }, sku, 1)).toBe(false)
    expect(canCreateOrder(product, { ...sku, stock: 0 }, 1)).toBe(false)
    expect(canCreateOrder(product, { ...sku, stock: 1 }, 2)).toBe(false)
    expect(canCreateOrder(product, sku, 0)).toBe(false)
    expect(canCreateOrder(product, sku, -1)).toBe(false)
  })
})

describe('order status transitions', () => {
  it('creates pending order and supports confirm or cancel', () => {
    const order = createPendingOrder({
      product,
      sku,
      quantity: 1,
      customerName: '测试客户',
      customerPhone: '13800000000',
    })

    expect(order.status).toBe('pending_merchant_confirm')
    expect(confirmOrder(order).status).toBe('confirmed')
    expect(cancelOrder(order).status).toBe('canceled')
  })

  it('records authorized customer fields and total amount when creating an order', () => {
    const order = createPendingOrder({
      product,
      sku,
      quantity: 2,
      customerName: 'Wechat Customer',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
    })

    expect(order).toMatchObject({
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      status: 'pending_merchant_confirm',
      totalAmount: 258,
    })
    expect(order.items[0]).toMatchObject({
      skuId: 'sku-1',
      productId: 'product-1',
      salePrice: 129,
      quantity: 2,
    })
  })
})
