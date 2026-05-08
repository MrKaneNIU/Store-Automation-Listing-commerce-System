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

export type Order = {
  id: string
  customerName: string
  customerPhone: string
  customerId?: string
  customerAuthSource?: 'mock_wechat' | 'wechat'
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}
