export type ProductStatus = 'pending_images' | 'ready_to_publish' | 'published'

export type Product = {
  id: string
  productCode: string
  productName: string
  description: string
  mainImageUrl: string
  imageUrls: string[]
  status: ProductStatus
  createdFromBatchId: string
  createdAt: string
  updatedAt: string
}

export type Sku = {
  id: string
  productId: string
  productCode: string
  spec: string
  salePrice: number
  stock: number
}

export type ImportWarning = {
  type: 'price_conflict'
  productCode: string
  message: string
}
