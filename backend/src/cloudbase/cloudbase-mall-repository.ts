import type { MemoryCloudBaseDocumentStore } from './memory-cloudbase-document-store'

type OcrBatch = {
  id: string
  status: 'uploaded' | 'recognized' | 'confirmed'
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

type OcrJob = {
  id: string
  batchId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying'
  failureReason?: string
  retryCount: number
  createdAt: string
  updatedAt: string
}

type ProductDraft = {
  id: string
  batchId: string
  productCode: string
  productName: string
  salePrice: number
  spec: string
  stock: number
  confidence: number
  sourceImageUrl: string
  fieldConfidence?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', number>>
  fieldSources?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', string>>
  correctionState?: 'ocr_raw' | 'manual_corrected'
  status: 'pending' | 'confirmed' | 'deleted' | 'needs_completion'
}

type Product = {
  id: string
  productCode: string
  productName: string
  mainImageUrl: string
  imageUrls: string[]
  status: 'pending_images' | 'ready_to_publish' | 'published'
  createdFromBatchId: string
  createdAt: string
  updatedAt: string
}

type Sku = {
  id: string
  productId: string
  productCode: string
  spec: string
  salePrice: number
  stock: number
}

type OrderItem = {
  skuId: string
  productId: string
  productName: string
  productCode: string
  spec: string
  salePrice: number
  quantity: number
}

type Order = {
  id: string
  customerName: string
  customerPhone: string
  customerId?: string
  customerAuthSource?: 'mock_wechat' | 'wechat'
  idempotencyKey?: string
  status: 'pending_merchant_confirm' | 'confirmed' | 'canceled'
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

type InventoryLedgerEntry = {
  id: string
  skuId: string
  orderId?: string
  action: 'reserve' | 'release' | 'confirm' | 'adjust'
  quantityDelta: number
  sourceType: 'order' | 'manual'
  sourceId: string
  note: string
  createdAt: string
}

type BatchDocument = {
  _id: string
  status: OcrBatch['status']
  image_urls: string[]
  created_at: string
  updated_at: string
}

type OcrJobDocument = {
  _id: string
  batch_id: string
  status: OcrJob['status']
  failure_reason?: string
  retry_count: number
  created_at: string
  updated_at: string
}

type DraftDocument = {
  _id: string
  batch_id: string
  product_code: string
  product_name: string
  sale_price: number
  spec: string
  stock: number
  confidence: number
  source_image_url: string
  field_confidence?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', number>>
  field_sources?: Partial<Record<'productCode' | 'productName' | 'salePrice' | 'spec', string>>
  correction_state?: ProductDraft['correctionState']
  status: ProductDraft['status']
}

type ProductDocument = {
  _id: string
  product_code: string
  product_name: string
  main_image_url: string
  image_urls: string[]
  status: Product['status']
  created_from_batch_id: string
  created_at: string
  updated_at: string
}

type SkuDocument = {
  _id: string
  product_id: string
  product_code: string
  spec: string
  sale_price: number
  stock: number
}

type OrderDocument = {
  _id: string
  customer_name: string
  customer_phone: string
  customer_id?: string
  customer_auth_source?: Order['customerAuthSource']
  idempotency_key?: string
  status: Order['status']
  total_amount: number
  created_at: string
  updated_at: string
}

type OrderItemDocument = {
  _id: string
  order_id: string
  sku_id: string
  product_id: string
  product_name: string
  product_code: string
  spec: string
  sale_price: number
  quantity: number
}

type InventoryLedgerDocument = {
  _id: string
  sku_id: string
  order_id: string | null
  action: InventoryLedgerEntry['action']
  quantity_delta: number
  source_type: InventoryLedgerEntry['sourceType']
  source_id: string
  note: string
  created_at: string
}

type CloudBaseMallRepository = {
  saveBatch: (batch: OcrBatch) => Promise<OcrBatch>
  updateBatch: (batch: OcrBatch) => Promise<OcrBatch>
  listBatches: () => Promise<OcrBatch[]>
  saveOcrJob: (job: OcrJob) => Promise<OcrJob>
  updateOcrJob: (job: OcrJob) => Promise<OcrJob>
  listOcrJobs: (batchId?: string) => Promise<OcrJob[]>
  saveDrafts: (drafts: ProductDraft[]) => Promise<ProductDraft[]>
  replaceDrafts: (batchId: string, drafts: ProductDraft[]) => Promise<ProductDraft[]>
  listDrafts: (batchId?: string) => Promise<ProductDraft[]>
  saveProducts: (products: Product[], skus: Sku[]) => Promise<{ products: Product[]; skus: Sku[] }>
  updateProduct: (product: Product) => Promise<Product>
  listProducts: () => Promise<Product[]>
  listSkus: (productId?: string) => Promise<Sku[]>
  updateSku: (sku: Sku) => Promise<Sku>
  saveOrder: (order: Order) => Promise<Order>
  updateOrder: (order: Order) => Promise<Order>
  listOrders: () => Promise<Order[]>
  saveInventoryLedgerEntry: (entry: InventoryLedgerEntry) => Promise<InventoryLedgerEntry>
  listInventoryLedgerEntries: (skuId?: string) => Promise<InventoryLedgerEntry[]>
}

const toBatchDocument = (batch: OcrBatch): BatchDocument => ({
  _id: batch.id,
  status: batch.status,
  image_urls: batch.imageUrls,
  created_at: batch.createdAt,
  updated_at: batch.updatedAt,
})

const toBatch = (document: BatchDocument): OcrBatch => ({
  id: document._id,
  status: document.status,
  imageUrls: document.image_urls,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toOcrJobDocument = (job: OcrJob): OcrJobDocument => ({
  _id: job.id,
  batch_id: job.batchId,
  status: job.status,
  ...(job.failureReason ? { failure_reason: job.failureReason } : {}),
  retry_count: job.retryCount,
  created_at: job.createdAt,
  updated_at: job.updatedAt,
})

const toOcrJob = (document: OcrJobDocument): OcrJob => ({
  id: document._id,
  batchId: document.batch_id,
  status: document.status,
  ...(document.failure_reason ? { failureReason: document.failure_reason } : {}),
  retryCount: document.retry_count,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toDraftDocument = (draft: ProductDraft): DraftDocument => ({
  _id: draft.id,
  batch_id: draft.batchId,
  product_code: draft.productCode,
  product_name: draft.productName,
  sale_price: draft.salePrice,
  spec: draft.spec,
  stock: draft.stock,
  confidence: draft.confidence,
  source_image_url: draft.sourceImageUrl,
  ...(draft.fieldConfidence ? { field_confidence: draft.fieldConfidence } : {}),
  ...(draft.fieldSources ? { field_sources: draft.fieldSources } : {}),
  ...(draft.correctionState ? { correction_state: draft.correctionState } : {}),
  status: draft.status,
})

const toDraft = (document: DraftDocument): ProductDraft => ({
  id: document._id,
  batchId: document.batch_id,
  productCode: document.product_code,
  productName: document.product_name,
  salePrice: document.sale_price,
  spec: document.spec,
  stock: document.stock,
  confidence: document.confidence,
  sourceImageUrl: document.source_image_url,
  ...(document.field_confidence ? { fieldConfidence: document.field_confidence } : {}),
  ...(document.field_sources ? { fieldSources: document.field_sources } : {}),
  ...(document.correction_state ? { correctionState: document.correction_state } : {}),
  status: document.status,
})

const toProductDocument = (product: Product): ProductDocument => ({
  _id: product.id,
  product_code: product.productCode,
  product_name: product.productName,
  main_image_url: product.mainImageUrl,
  image_urls: product.imageUrls,
  status: product.status,
  created_from_batch_id: product.createdFromBatchId,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
})

const toProduct = (document: ProductDocument): Product => ({
  id: document._id,
  productCode: document.product_code,
  productName: document.product_name,
  mainImageUrl: document.main_image_url,
  imageUrls: document.image_urls,
  status: document.status,
  createdFromBatchId: document.created_from_batch_id,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toSkuDocument = (sku: Sku): SkuDocument => ({
  _id: sku.id,
  product_id: sku.productId,
  product_code: sku.productCode,
  spec: sku.spec,
  sale_price: sku.salePrice,
  stock: sku.stock,
})

const toSku = (document: SkuDocument): Sku => ({
  id: document._id,
  productId: document.product_id,
  productCode: document.product_code,
  spec: document.spec,
  salePrice: document.sale_price,
  stock: document.stock,
})

const toOrderDocument = (order: Order): OrderDocument => ({
  _id: order.id,
  customer_name: order.customerName,
  customer_phone: order.customerPhone,
  ...(order.customerId ? { customer_id: order.customerId } : {}),
  ...(order.customerAuthSource ? { customer_auth_source: order.customerAuthSource } : {}),
  ...(order.idempotencyKey ? { idempotency_key: order.idempotencyKey } : {}),
  status: order.status,
  total_amount: order.totalAmount,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
})

const toOrderItemDocument = (orderId: string, item: OrderItem): OrderItemDocument => ({
  _id: `${orderId}:${item.skuId}`,
  order_id: orderId,
  sku_id: item.skuId,
  product_id: item.productId,
  product_name: item.productName,
  product_code: item.productCode,
  spec: item.spec,
  sale_price: item.salePrice,
  quantity: item.quantity,
})

const toOrderItem = (document: OrderItemDocument): OrderItem => ({
  skuId: document.sku_id,
  productId: document.product_id,
  productName: document.product_name,
  productCode: document.product_code,
  spec: document.spec,
  salePrice: document.sale_price,
  quantity: document.quantity,
})

const toOrder = (document: OrderDocument, items: OrderItem[]): Order => ({
  id: document._id,
  customerName: document.customer_name,
  customerPhone: document.customer_phone,
  ...(document.customer_id ? { customerId: document.customer_id } : {}),
  ...(document.customer_auth_source ? { customerAuthSource: document.customer_auth_source } : {}),
  ...(document.idempotency_key ? { idempotencyKey: document.idempotency_key } : {}),
  status: document.status,
  items,
  totalAmount: document.total_amount,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
})

const toInventoryLedgerDocument = (entry: InventoryLedgerEntry): InventoryLedgerDocument => ({
  _id: entry.id,
  sku_id: entry.skuId,
  order_id: entry.orderId ?? null,
  action: entry.action,
  quantity_delta: entry.quantityDelta,
  source_type: entry.sourceType,
  source_id: entry.sourceId,
  note: entry.note,
  created_at: entry.createdAt,
})

const toInventoryLedgerEntry = (document: InventoryLedgerDocument): InventoryLedgerEntry => ({
  id: document._id,
  skuId: document.sku_id,
  ...(document.order_id ? { orderId: document.order_id } : {}),
  action: document.action,
  quantityDelta: document.quantity_delta,
  sourceType: document.source_type,
  sourceId: document.source_id,
  note: document.note,
  createdAt: document.created_at,
})

const assertSkuCanPersist = (sku: Sku): void => {
  if (sku.stock < 0) {
    throw new Error('CloudBase SKU stock must not be negative')
  }
}

export const createCloudBaseMallRepository = (
  store: MemoryCloudBaseDocumentStore,
): CloudBaseMallRepository => ({
  async saveBatch(batch) {
    return toBatch(await store.insert('ocr_batches', toBatchDocument(batch)))
  },
  async updateBatch(batch) {
    return toBatch(await store.replace('ocr_batches', toBatchDocument(batch)))
  },
  async listBatches() {
    return (await store.list<BatchDocument>('ocr_batches')).map(toBatch)
  },
  async saveOcrJob(job) {
    return toOcrJob(await store.insert('ocr_jobs', toOcrJobDocument(job)))
  },
  async updateOcrJob(job) {
    return toOcrJob(await store.replace('ocr_jobs', toOcrJobDocument(job)))
  },
  async listOcrJobs(batchId) {
    const jobs = (await store.list<OcrJobDocument>('ocr_jobs')).map(toOcrJob)
    return batchId ? jobs.filter((job) => job.batchId === batchId) : jobs
  },
  async saveDrafts(drafts) {
    const saved: ProductDraft[] = []
    for (const draft of drafts) {
      saved.push(toDraft(await store.insert('product_drafts', toDraftDocument(draft))))
    }
    return saved
  },
  async replaceDrafts(batchId, drafts) {
    await store.deleteWhere('product_drafts', (document) => document.batch_id === batchId)
    return this.saveDrafts(drafts)
  },
  async listDrafts(batchId) {
    const drafts = (await store.list<DraftDocument>('product_drafts')).map(toDraft)
    return batchId ? drafts.filter((draft) => draft.batchId === batchId) : drafts
  },
  async saveProducts(products, skus) {
    return store.transaction(async () => {
      const savedProducts: Product[] = []
      const savedSkus: Sku[] = []

      for (const sku of skus) {
        assertSkuCanPersist(sku)
      }
      for (const product of products) {
        savedProducts.push(toProduct(await store.insert('products', toProductDocument(product))))
      }
      for (const sku of skus) {
        savedSkus.push(toSku(await store.insert('skus', toSkuDocument(sku))))
      }

      return { products: savedProducts, skus: savedSkus }
    })
  },
  async updateProduct(product) {
    return toProduct(await store.replace('products', toProductDocument(product)))
  },
  async listProducts() {
    return (await store.list<ProductDocument>('products')).map(toProduct)
  },
  async listSkus(productId) {
    const skus = (await store.list<SkuDocument>('skus')).map(toSku)
    return productId ? skus.filter((sku) => sku.productId === productId) : skus
  },
  async updateSku(sku) {
    assertSkuCanPersist(sku)
    return toSku(await store.replace('skus', toSkuDocument(sku)))
  },
  async saveOrder(order) {
    await store.insert('orders', toOrderDocument(order))
    for (const item of order.items) {
      await store.insert('order_items', toOrderItemDocument(order.id, item))
    }
    return order
  },
  async updateOrder(order) {
    await store.replace('orders', toOrderDocument(order))
    await store.deleteWhere('order_items', (document) => document.order_id === order.id)
    for (const item of order.items) {
      await store.insert('order_items', toOrderItemDocument(order.id, item))
    }
    return order
  },
  async listOrders() {
    const items = (await store.list<OrderItemDocument>('order_items')).map((document) => ({
      orderId: document.order_id,
      item: toOrderItem(document),
    }))

    return (await store.list<OrderDocument>('orders')).map((order) =>
      toOrder(
        order,
        items.filter((item) => item.orderId === order._id).map((item) => item.item),
      ),
    )
  },
  async saveInventoryLedgerEntry(entry: InventoryLedgerEntry) {
    return toInventoryLedgerEntry(await store.insert('inventory_ledger', toInventoryLedgerDocument(entry)))
  },
  async listInventoryLedgerEntries(skuId?: string) {
    const entries = (await store.list<InventoryLedgerDocument>('inventory_ledger')).map(toInventoryLedgerEntry)
    return skuId ? entries.filter((entry) => entry.skuId === skuId) : entries
  },
})
