import type { OcrBatch, OcrJob } from '../../domain/batch/types'
import type { Product, Sku } from '../../domain/catalog/types'
import type { ProductDraft } from '../../domain/draft/types'
import type { InventoryLedgerEntry } from '../../domain/inventory/types'
import type { Order } from '../../domain/order/types'

export type MockDb = {
  batches: OcrBatch[]
  ocrJobs: OcrJob[]
  drafts: ProductDraft[]
  products: Product[]
  skus: Sku[]
  orders: Order[]
  inventoryLedger: InventoryLedgerEntry[]
}

export const mockDb: MockDb = {
  batches: [],
  ocrJobs: [],
  drafts: [],
  products: [],
  skus: [],
  orders: [],
  inventoryLedger: [],
}

export const resetMockDb = () => {
  mockDb.batches = []
  mockDb.ocrJobs = []
  mockDb.drafts = []
  mockDb.products = []
  mockDb.skus = []
  mockDb.orders = []
  mockDb.inventoryLedger = []
}
