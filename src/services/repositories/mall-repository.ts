import type { OcrBatch } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { Order } from '../../domain/order/types'
import { mockDb } from './mock-db'

export const mallRepository = {
  saveBatch(batch: OcrBatch) {
    mockDb.batches = [...mockDb.batches, batch]
    return batch
  },
  updateBatch(batch: OcrBatch) {
    mockDb.batches = mockDb.batches.map((item) => (item.id === batch.id ? batch : item))
    return batch
  },
  listBatches() {
    return [...mockDb.batches]
  },
  saveDrafts(drafts: ProductDraft[]) {
    mockDb.drafts = [...mockDb.drafts, ...drafts]
    return drafts
  },
  replaceDrafts(batchId: string, drafts: ProductDraft[]) {
    mockDb.drafts = [...mockDb.drafts.filter((draft) => draft.batchId !== batchId), ...drafts]
    return drafts
  },
  listDrafts(batchId?: string) {
    return batchId ? mockDb.drafts.filter((draft) => draft.batchId === batchId) : [...mockDb.drafts]
  },
  saveProducts(products: Product[], skus: Sku[]) {
    mockDb.products = [...mockDb.products, ...products]
    mockDb.skus = [...mockDb.skus, ...skus]
    return { products, skus }
  },
  updateProduct(product: Product) {
    mockDb.products = mockDb.products.map((item) => (item.id === product.id ? product : item))
    return product
  },
  listProducts() {
    return [...mockDb.products]
  },
  listSkus(productId?: string) {
    return productId ? mockDb.skus.filter((sku) => sku.productId === productId) : [...mockDb.skus]
  },
  updateSku(sku: Sku) {
    mockDb.skus = mockDb.skus.map((item) => (item.id === sku.id ? sku : item))
    return sku
  },
  saveOrder(order: Order) {
    mockDb.orders = [...mockDb.orders, order]
    return order
  },
  updateOrder(order: Order) {
    mockDb.orders = mockDb.orders.map((item) => (item.id === order.id ? order : item))
    return order
  },
  listOrders() {
    return [...mockDb.orders]
  },
}
