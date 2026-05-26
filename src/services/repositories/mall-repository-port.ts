import type { OcrBatch, OcrJob } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { InventoryLedgerEntry } from '../../domain/inventory/types'
import type { Order } from '../../domain/order/types'

export type RepositoryResult<T> = T | Promise<T>

export type MallRepositoryContract = {
  saveBatch: (batch: OcrBatch) => RepositoryResult<OcrBatch>
  updateBatch: (batch: OcrBatch) => RepositoryResult<OcrBatch>
  listBatches: () => RepositoryResult<OcrBatch[]>
  saveOcrJob: (job: OcrJob) => RepositoryResult<OcrJob>
  updateOcrJob: (job: OcrJob) => RepositoryResult<OcrJob>
  listOcrJobs: (batchId?: string) => RepositoryResult<OcrJob[]>
  saveDrafts: (drafts: ProductDraft[]) => RepositoryResult<ProductDraft[]>
  replaceDrafts: (batchId: string, drafts: ProductDraft[]) => RepositoryResult<ProductDraft[]>
  listDrafts: (batchId?: string) => RepositoryResult<ProductDraft[]>
  saveProducts: (products: Product[], skus: Sku[]) => RepositoryResult<{ products: Product[]; skus: Sku[] }>
  updateProduct: (product: Product) => RepositoryResult<Product>
  deleteProduct: (productId: string) => RepositoryResult<Product | null>
  deleteSkus: (productId: string) => RepositoryResult<Sku[]>
  listProducts: () => RepositoryResult<Product[]>
  listSkus: (productId?: string) => RepositoryResult<Sku[]>
  updateSku: (sku: Sku) => RepositoryResult<Sku>
  saveOrder: (order: Order) => RepositoryResult<Order>
  updateOrder: (order: Order) => RepositoryResult<Order>
  listOrders: () => RepositoryResult<Order[]>
  saveInventoryLedgerEntry: (entry: InventoryLedgerEntry) => RepositoryResult<InventoryLedgerEntry>
  listInventoryLedgerEntries: (skuId?: string) => RepositoryResult<InventoryLedgerEntry[]>
}

export type MallRepository = {
  saveBatch: (batch: OcrBatch) => OcrBatch
  updateBatch: (batch: OcrBatch) => OcrBatch
  listBatches: () => OcrBatch[]
  saveOcrJob: (job: OcrJob) => OcrJob
  updateOcrJob: (job: OcrJob) => OcrJob
  listOcrJobs: (batchId?: string) => OcrJob[]
  saveDrafts: (drafts: ProductDraft[]) => ProductDraft[]
  replaceDrafts: (batchId: string, drafts: ProductDraft[]) => ProductDraft[]
  listDrafts: (batchId?: string) => ProductDraft[]
  saveProducts: (products: Product[], skus: Sku[]) => { products: Product[]; skus: Sku[] }
  updateProduct: (product: Product) => Product
  deleteProduct: (productId: string) => Product | null
  deleteSkus: (productId: string) => Sku[]
  listProducts: () => Product[]
  listSkus: (productId?: string) => Sku[]
  updateSku: (sku: Sku) => Sku
  saveOrder: (order: Order) => Order
  updateOrder: (order: Order) => Order
  listOrders: () => Order[]
  saveInventoryLedgerEntry: (entry: InventoryLedgerEntry) => InventoryLedgerEntry
  listInventoryLedgerEntries: (skuId?: string) => InventoryLedgerEntry[]
}
