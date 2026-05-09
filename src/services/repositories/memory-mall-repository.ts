import type { MallRepository } from './mall-repository-port'
import { mockDb, type MockDb } from './mock-db'

export const createMemoryMallRepository = (database: MockDb = mockDb): MallRepository => ({
  saveBatch(batch) {
    database.batches = [...database.batches, batch]
    return batch
  },
  updateBatch(batch) {
    database.batches = database.batches.map((item) => (item.id === batch.id ? batch : item))
    return batch
  },
  listBatches() {
    return [...database.batches]
  },
  saveDrafts(drafts) {
    database.drafts = [...database.drafts, ...drafts]
    return drafts
  },
  replaceDrafts(batchId, drafts) {
    database.drafts = [...database.drafts.filter((draft) => draft.batchId !== batchId), ...drafts]
    return drafts
  },
  listDrafts(batchId) {
    return batchId ? database.drafts.filter((draft) => draft.batchId === batchId) : [...database.drafts]
  },
  saveProducts(products, skus) {
    database.products = [...database.products, ...products]
    database.skus = [...database.skus, ...skus]
    return { products, skus }
  },
  updateProduct(product) {
    database.products = database.products.map((item) => (item.id === product.id ? product : item))
    return product
  },
  listProducts() {
    return [...database.products]
  },
  listSkus(productId) {
    return productId ? database.skus.filter((sku) => sku.productId === productId) : [...database.skus]
  },
  updateSku(sku) {
    database.skus = database.skus.map((item) => (item.id === sku.id ? sku : item))
    return sku
  },
  saveOrder(order) {
    database.orders = [...database.orders, order]
    return order
  },
  updateOrder(order) {
    database.orders = database.orders.map((item) => (item.id === order.id ? order : item))
    return order
  },
  listOrders() {
    return [...database.orders]
  },
})

export const memoryMallRepository = createMemoryMallRepository()
