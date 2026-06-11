export type OrderStatus = 'pending_merchant_confirm' | 'confirmed' | 'canceled'

export type OrderItem = {
  skuId: string
  productId: string
  productName: string
  productCode: string
  spec: string
  salePrice: number
  quantity: number
}

export type ShippingAddressSnapshot = {
  addressId: string
  contactName: string
  phoneNumber: string
  province: string
  city: string
  district: string
  detail: string
}

export type Order = {
  id: string
  customerName: string
  customerPhone: string
  customerId?: string
  customerAuthSource?: 'mock_wechat' | 'wechat'
  idempotencyKey?: string
  shippingAddress?: ShippingAddressSnapshot
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}
