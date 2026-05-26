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
  saveOcrJob(job) {
    database.ocrJobs = [...database.ocrJobs, job]
    return job
  },
  updateOcrJob(job) {
    database.ocrJobs = database.ocrJobs.map((item) => (item.id === job.id ? job : item))
    return job
  },
  listOcrJobs(batchId) {
    return batchId ? database.ocrJobs.filter((job) => job.batchId === batchId) : [...database.ocrJobs]
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
  deleteProduct(productId) {
    const product = database.products.find((item) => item.id === productId) ?? null
    database.products = database.products.filter((item) => item.id !== productId)
    return product
  },
  deleteSkus(productId) {
    const skus = database.skus.filter((sku) => sku.productId === productId)
    database.skus = database.skus.filter((sku) => sku.productId !== productId)
    return skus
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
  saveInventoryLedgerEntry(entry) {
    database.inventoryLedger = [...database.inventoryLedger, entry]
    return entry
  },
  listInventoryLedgerEntries(skuId) {
    return skuId ? database.inventoryLedger.filter((entry) => entry.skuId === skuId) : [...database.inventoryLedger]
  },
})

export const memoryMallRepository = createMemoryMallRepository()
