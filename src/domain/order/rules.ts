import type { Product } from '../catalog/types'
import type { Sku } from '../catalog/types'
import { createId, nowIso } from '../shared/ids'
import type { Order, OrderItem } from './types'

export const canCreateOrder = (product: Product, sku: Sku, quantity: number) => {
  return product.status === 'published' && sku.stock >= quantity && quantity > 0
}

export const createPendingOrder = (params: {
  product: Product
  sku: Sku
  quantity: number
  customerName: string
  customerPhone: string
  customerId?: string
  customerAuthSource?: 'mock_wechat' | 'wechat'
  idempotencyKey?: string
}): Order => {
  const item: OrderItem = {
    skuId: params.sku.id,
    productId: params.product.id,
    productName: params.product.productName,
    productCode: params.product.productCode,
    spec: params.sku.spec,
    salePrice: params.sku.salePrice,
    quantity: params.quantity,
  }
  const timestamp = nowIso()

  return {
    id: createId('order'),
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerId: params.customerId,
    customerAuthSource: params.customerAuthSource,
    idempotencyKey: params.idempotencyKey,
    status: 'pending_merchant_confirm',
    items: [item],
    totalAmount: item.salePrice * item.quantity,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const confirmOrder = (order: Order): Order => ({
  ...order,
  status: 'confirmed',
  updatedAt: nowIso(),
})

export const cancelOrder = (order: Order): Order => ({
  ...order,
  status: 'canceled',
  updatedAt: nowIso(),
})
