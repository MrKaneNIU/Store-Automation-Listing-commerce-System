import type { DatabaseExecutor, TransactionalDatabaseExecutor } from '../db/client'

type OcrBatch = {
  id: string
  status: 'uploaded' | 'recognized' | 'confirmed'
  imageUrls: string[]
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
  status: 'pending_merchant_confirm' | 'confirmed' | 'canceled'
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

type BatchRow = {
  id: string
  status: OcrBatch['status']
  image_urls: string[]
  created_at: string | Date
  updated_at: string | Date
}

type DraftRow = {
  id: string
  batch_id: string
  product_code: string
  product_name: string
  sale_price: string | number
  spec: string
  stock: number
  confidence: string | number
  source_image_url: string
  status: ProductDraft['status']
}

type ProductRow = {
  id: string
  product_code: string
  product_name: string
  main_image_url: string
  image_urls: string[]
  status: Product['status']
  created_from_batch_id: string
  created_at: string | Date
  updated_at: string | Date
}

type SkuRow = {
  id: string
  product_id: string
  product_code: string
  spec: string
  sale_price: string | number
  stock: number
}

type OrderRow = {
  id: string
  customer_name: string
  customer_phone: string
  customer_id: string | null
  customer_auth_source: Order['customerAuthSource']
  status: Order['status']
  total_amount: string | number
  created_at: string | Date
  updated_at: string | Date
}

type OrderItemRow = {
  sku_id: string
  product_id: string
  product_name: string
  product_code: string
  spec: string
  sale_price: string | number
  quantity: number
}

const toIso = (value: string | Date): string => new Date(value).toISOString()

const toBatch = (row: BatchRow): OcrBatch => ({
  id: row.id,
  status: row.status,
  imageUrls: row.image_urls,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const toDraft = (row: DraftRow): ProductDraft => ({
  id: row.id,
  batchId: row.batch_id,
  productCode: row.product_code,
  productName: row.product_name,
  salePrice: Number(row.sale_price),
  spec: row.spec,
  stock: row.stock,
  confidence: Number(row.confidence),
  sourceImageUrl: row.source_image_url,
  status: row.status,
})

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  productCode: row.product_code,
  productName: row.product_name,
  mainImageUrl: row.main_image_url,
  imageUrls: row.image_urls,
  status: row.status,
  createdFromBatchId: row.created_from_batch_id,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const toSku = (row: SkuRow): Sku => ({
  id: row.id,
  productId: row.product_id,
  productCode: row.product_code,
  spec: row.spec,
  salePrice: Number(row.sale_price),
  stock: row.stock,
})

const toOrderItem = (row: OrderItemRow): OrderItem => ({
  skuId: row.sku_id,
  productId: row.product_id,
  productName: row.product_name,
  productCode: row.product_code,
  spec: row.spec,
  salePrice: Number(row.sale_price),
  quantity: row.quantity,
})

const toOrder = (row: OrderRow, items: OrderItem[]): Order => ({
  id: row.id,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  ...(row.customer_id ? { customerId: row.customer_id } : {}),
  ...(row.customer_auth_source ? { customerAuthSource: row.customer_auth_source } : {}),
  status: row.status,
  items,
  totalAmount: Number(row.total_amount),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const firstRow = <T>(rows: T[]): T => {
  const row = rows[0]
  if (!row) {
    throw new Error('Expected database mutation to return one row')
  }

  return row
}

const insertProduct = async (database: DatabaseExecutor, product: Product): Promise<Product> => {
  const { rows } = await database.query<ProductRow>(
    `
      INSERT INTO products (
        id,
        product_code,
        product_name,
        main_image_url,
        image_urls,
        status,
        created_from_batch_id,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      product.id,
      product.productCode,
      product.productName,
      product.mainImageUrl,
      product.imageUrls,
      product.status,
      product.createdFromBatchId,
      product.createdAt,
      product.updatedAt,
    ],
  )

  return toProduct(firstRow(rows))
}

const insertSku = async (database: DatabaseExecutor, sku: Sku): Promise<Sku> => {
  const { rows } = await database.query<SkuRow>(
    `
      INSERT INTO skus (id, product_id, product_code, spec, sale_price, stock)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [sku.id, sku.productId, sku.productCode, sku.spec, sku.salePrice, sku.stock],
  )

  return toSku(firstRow(rows))
}

const insertDraft = async (database: DatabaseExecutor, draft: ProductDraft): Promise<ProductDraft> => {
  const { rows } = await database.query<DraftRow>(
    `
      INSERT INTO product_drafts (
        id,
        batch_id,
        product_code,
        product_name,
        sale_price,
        spec,
        stock,
        confidence,
        source_image_url,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      draft.id,
      draft.batchId,
      draft.productCode,
      draft.productName,
      draft.salePrice,
      draft.spec,
      draft.stock,
      draft.confidence,
      draft.sourceImageUrl,
      draft.status,
    ],
  )

  return toDraft(firstRow(rows))
}

const ensureCustomerPlaceholder = async (database: DatabaseExecutor, order: Order): Promise<void> => {
  if (!order.customerId) {
    return
  }

  const existing = await database.query<{ id: string }>('SELECT id FROM customers WHERE id = $1', [order.customerId])
  if (existing.rows.length > 0) {
    return
  }

  await database.query(
    `
      INSERT INTO customers (id, display_name, phone, auth_source, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      order.customerId,
      order.customerName,
      order.customerPhone,
      order.customerAuthSource ?? 'mock_wechat',
      order.createdAt,
      order.updatedAt,
    ],
  )
}

export const createDatabaseMallRepository = (database: TransactionalDatabaseExecutor) => ({
  async saveBatch(batch: OcrBatch): Promise<OcrBatch> {
    const { rows } = await database.query<BatchRow>(
      `
        INSERT INTO ocr_batches (id, status, image_urls, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [batch.id, batch.status, batch.imageUrls, batch.createdAt, batch.updatedAt],
    )

    return toBatch(firstRow(rows))
  },

  async updateBatch(batch: OcrBatch): Promise<OcrBatch> {
    const { rows } = await database.query<BatchRow>(
      `
        UPDATE ocr_batches
        SET status = $2, image_urls = $3, created_at = $4, updated_at = $5
        WHERE id = $1
        RETURNING *
      `,
      [batch.id, batch.status, batch.imageUrls, batch.createdAt, batch.updatedAt],
    )

    return toBatch(firstRow(rows))
  },

  async listBatches(): Promise<OcrBatch[]> {
    const { rows } = await database.query<BatchRow>('SELECT * FROM ocr_batches ORDER BY created_at, id')
    return rows.map(toBatch)
  },

  async saveDrafts(drafts: ProductDraft[]): Promise<ProductDraft[]> {
    return database.transaction(async (transaction) => {
      const saved: ProductDraft[] = []
      for (const draft of drafts) {
        saved.push(await insertDraft(transaction, draft))
      }
      return saved
    })
  },

  async replaceDrafts(batchId: string, drafts: ProductDraft[]): Promise<ProductDraft[]> {
    return database.transaction(async (transaction) => {
      const saved: ProductDraft[] = []
      await transaction.query('DELETE FROM product_drafts WHERE batch_id = $1', [batchId])
      for (const draft of drafts) {
        saved.push(await insertDraft(transaction, draft))
      }
      return saved
    })
  },

  async listDrafts(batchId?: string): Promise<ProductDraft[]> {
    const { rows } = batchId
      ? await database.query<DraftRow>('SELECT * FROM product_drafts WHERE batch_id = $1 ORDER BY id', [batchId])
      : await database.query<DraftRow>('SELECT * FROM product_drafts ORDER BY id')

    return rows.map(toDraft)
  },

  async saveProducts(products: Product[], skus: Sku[]): Promise<{ products: Product[]; skus: Sku[] }> {
    return database.transaction(async (transaction) => {
      const savedProducts: Product[] = []
      const savedSkus: Sku[] = []
      for (const product of products) {
        savedProducts.push(await insertProduct(transaction, product))
      }
      for (const sku of skus) {
        savedSkus.push(await insertSku(transaction, sku))
      }

      return { products: savedProducts, skus: savedSkus }
    })
  },

  async updateProduct(product: Product): Promise<Product> {
    const { rows } = await database.query<ProductRow>(
      `
        UPDATE products
        SET product_code = $2,
            product_name = $3,
            main_image_url = $4,
            image_urls = $5,
            status = $6,
            created_from_batch_id = $7,
            created_at = $8,
            updated_at = $9
        WHERE id = $1
        RETURNING *
      `,
      [
        product.id,
        product.productCode,
        product.productName,
        product.mainImageUrl,
        product.imageUrls,
        product.status,
        product.createdFromBatchId,
        product.createdAt,
        product.updatedAt,
      ],
    )

    return toProduct(firstRow(rows))
  },

  async listProducts(): Promise<Product[]> {
    const { rows } = await database.query<ProductRow>('SELECT * FROM products ORDER BY created_at, id')
    return rows.map(toProduct)
  },

  async listSkus(productId?: string): Promise<Sku[]> {
    const { rows } = productId
      ? await database.query<SkuRow>('SELECT * FROM skus WHERE product_id = $1 ORDER BY id', [productId])
      : await database.query<SkuRow>('SELECT * FROM skus ORDER BY id')

    return rows.map(toSku)
  },

  async updateSku(sku: Sku): Promise<Sku> {
    const { rows } = await database.query<SkuRow>(
      `
        UPDATE skus
        SET product_id = $2, product_code = $3, spec = $4, sale_price = $5, stock = $6
        WHERE id = $1
        RETURNING *
      `,
      [sku.id, sku.productId, sku.productCode, sku.spec, sku.salePrice, sku.stock],
    )

    return toSku(firstRow(rows))
  },

  async saveOrder(order: Order): Promise<Order> {
    return database.transaction(async (transaction) => {
      await ensureCustomerPlaceholder(transaction, order)
      await transaction.query<OrderRow>(
        `
          INSERT INTO orders (
            id,
            customer_name,
            customer_phone,
            customer_id,
            customer_auth_source,
            status,
            total_amount,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
        [
          order.id,
          order.customerName,
          order.customerPhone,
          order.customerId ?? null,
          order.customerAuthSource ?? 'mock_wechat',
          order.status,
          order.totalAmount,
          order.createdAt,
          order.updatedAt,
        ],
      )

      for (const [index, item] of order.items.entries()) {
        await transaction.query(
          `
            INSERT INTO order_items (
              id,
              order_id,
              sku_id,
              product_id,
              product_name,
              product_code,
              spec,
              sale_price,
              quantity
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            `${order.id}-item-${index + 1}`,
            order.id,
            item.skuId,
            item.productId,
            item.productName,
            item.productCode,
            item.spec,
            item.salePrice,
            item.quantity,
          ],
        )
      }

      return order
    })
  },

  async updateOrder(order: Order): Promise<Order> {
    const { rows } = await database.query<OrderRow>(
      `
        UPDATE orders
        SET customer_name = $2,
            customer_phone = $3,
            customer_id = $4,
            customer_auth_source = $5,
            status = $6,
            total_amount = $7,
            created_at = $8,
            updated_at = $9
        WHERE id = $1
        RETURNING *
      `,
      [
        order.id,
        order.customerName,
        order.customerPhone,
        order.customerId ?? null,
        order.customerAuthSource ?? 'mock_wechat',
        order.status,
        order.totalAmount,
        order.createdAt,
        order.updatedAt,
      ],
    )

    return toOrder(firstRow(rows), order.items)
  },

  async listOrders(): Promise<Order[]> {
    const orders = await database.query<OrderRow>('SELECT * FROM orders ORDER BY created_at, id')
    const result: Order[] = []

    for (const order of orders.rows) {
      const items = await database.query<OrderItemRow>(
        `
          SELECT sku_id, product_id, product_name, product_code, spec, sale_price, quantity
          FROM order_items
          WHERE order_id = $1
          ORDER BY id
        `,
        [order.id],
      )
      result.push(toOrder(order, items.rows.map(toOrderItem)))
    }

    return result
  },
})
