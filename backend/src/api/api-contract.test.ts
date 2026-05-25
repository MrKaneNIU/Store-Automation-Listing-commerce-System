import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import type { Server } from 'node:http'
import { newDb } from 'pg-mem'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { DatabaseExecutor, TransactionalDatabaseExecutor } from '../db/client'
import { applyMigrations } from '../db/migrate'
import { createDatabaseMallRepository } from '../repositories/database-mall-repository'
import { validateProductForPublish as validateBackendProductForPublish } from './handlers/mall-api'
import { createApiRequestHandler } from './routes'

const require = createRequire(import.meta.url)

type ProductPublishValidationCase = {
  name: string
  product: Parameters<typeof validateBackendProductForPublish>[0]
  skus: Parameters<typeof validateBackendProductForPublish>[1]
  expectedMessages: string[]
}

const { productPublishValidationCases } = require('../../../tests/contracts/product-publish-validation-cases.cjs') as {
  productPublishValidationCases: ProductPublishValidationCase[]
}

type TestDatabase = {
  executor: TransactionalDatabaseExecutor
  close: () => Promise<void>
}

type TestServer = {
  baseUrl: string
  close: () => Promise<void>
}

const createTestDatabase = (): TestDatabase => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
    noAstCoverageCheck: true,
  })
  const pg = db.adapters.createPg()
  const pool = new pg.Pool()

  return {
    executor: {
      query: (sql, params) => pool.query(sql, params),
      transaction: async (work) => {
        const snapshot = db.backup()
        const client = await pool.connect()
        const transactionExecutor: DatabaseExecutor = {
          query: (sql, params) => client.query(sql, params),
        }

        try {
          await client.query('BEGIN')
          const result = await work(transactionExecutor)
          await client.query('COMMIT')
          return result
        } catch (error) {
          await client.query('ROLLBACK')
          snapshot.restore()
          throw error
        } finally {
          client.release()
        }
      },
    },
    close: () => pool.end(),
  }
}

const listen = async (server: Server): Promise<TestServer> => {
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected TCP server address')
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  }
}

const requestJson = async (baseUrl: string, path: string, init?: RequestInit) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  return {
    status: response.status,
    body: await response.json(),
  }
}

describe('Phase 2.4 API contract', () => {
  let database: TestDatabase
  let server: TestServer
  let idCounter: number

  beforeEach(async () => {
    database = createTestDatabase()
    await applyMigrations(database.executor)
    idCounter = 0
    const repository = createDatabaseMallRepository(database.executor)
    const handler = createApiRequestHandler({
      repository,
      createId: (prefix) => `${prefix}-${++idCounter}`,
      now: () => '2026-05-09T00:00:00.000Z',
    })
    server = await listen(createServer((request, response) => void handler(request, response)))
  })

  afterEach(async () => {
    await server.close()
    await database.close()
  })

  it('validates request bodies with a stable error envelope', async () => {
    const result = await requestJson(server.baseUrl, '/api/ocr-batches', {
      method: 'POST',
      body: JSON.stringify({ imageUrls: [] }),
    })

    expect(result.status).toBe(400)
    expect(result.body).toEqual({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'imageUrls must contain at least one image URL',
      },
      meta: {},
    })
    expect(JSON.stringify(result.body)).not.toContain('backend\\dist')
    expect(JSON.stringify(result.body)).not.toContain(' at Object.')
  })

  it('creates OCR batches, exposes latest drafts, and confirms each batch only once', async () => {
    const created = await requestJson(server.baseUrl, '/api/ocr-batches', {
      method: 'POST',
      body: JSON.stringify({
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      }),
    })

    expect(created.status).toBe(201)
    expect(created.body.success).toBe(true)
    expect(created.body.data.batch).toMatchObject({
      id: 'batch-1',
      status: 'recognized',
      imageUrls: ['cloud://page-1.png'],
    })
    expect(created.body.data.drafts[0]).toMatchObject({
      id: 'draft-2',
      batchId: 'batch-1',
      productCode: 'A1023',
      status: 'pending',
    })

    const latest = await requestJson(server.baseUrl, '/api/drafts/latest')
    expect(latest.body.data.batch.id).toBe('batch-1')
    expect(latest.body.data.drafts).toHaveLength(1)

    const firstConfirm = await requestJson(server.baseUrl, '/api/batches/batch-1/confirm', { method: 'POST' })
    const secondConfirm = await requestJson(server.baseUrl, '/api/batches/batch-1/confirm', { method: 'POST' })
    const products = await requestJson(server.baseUrl, '/api/products')

    expect(firstConfirm.status).toBe(200)
    expect(firstConfirm.body.data.products).toHaveLength(1)
    expect(firstConfirm.body.data.skus).toHaveLength(1)
    expect(secondConfirm.body.data.products).toEqual([])
    expect(secondConfirm.body.data.skus).toEqual([])
    expect(products.body.data.products).toHaveLength(1)
  })

  it('creates OCR jobs with batches and retries failed jobs without duplicating drafts', async () => {
    const created = await requestJson(server.baseUrl, '/api/ocr-batches', {
      method: 'POST',
      body: JSON.stringify({
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      }),
    })
    const jobs = await requestJson(server.baseUrl, '/api/ocr-jobs?batchId=batch-1')
    const retryBlocked = await requestJson(server.baseUrl, '/api/ocr-jobs/job-batch-1/retry', { method: 'POST' })
    const draftsBeforeFailedRetry = await requestJson(server.baseUrl, '/api/drafts/latest')

    expect(created.body.data.job).toMatchObject({
      id: 'job-batch-1',
      batchId: 'batch-1',
      status: 'queued',
      retryCount: 0,
    })
    expect(jobs.body.data.jobs).toEqual([created.body.data.job])
    expect(retryBlocked.status).toBe(409)
    expect(retryBlocked.body.error.message).toContain('Only failed OCR jobs can be retried')
    expect(draftsBeforeFailedRetry.body.data.drafts).toHaveLength(1)
  })

  it('updates draft review rows through validated patch and delete commands', async () => {
    await requestJson(server.baseUrl, '/api/ocr-batches', {
      method: 'POST',
      body: JSON.stringify({
        imageUrls: ['cloud://page-1.png'],
        drafts: [
          {
            productCode: 'A1023',
            productName: 'Cotton Shirt',
            salePrice: 129,
            spec: 'Black/M',
            stock: 2,
            confidence: 0.96,
            sourceImageUrl: 'cloud://page-1.png',
          },
        ],
      }),
    })

    const updated = await requestJson(server.baseUrl, '/api/drafts/draft-2', {
      method: 'PATCH',
      body: JSON.stringify({ productName: 'Oxford Shirt', stock: 3 }),
    })
    const deleted = await requestJson(server.baseUrl, '/api/drafts/draft-2', { method: 'DELETE' })

    expect(updated.body.data.draft).toMatchObject({
      id: 'draft-2',
      productName: 'Oxford Shirt',
      stock: 3,
    })
    expect(deleted.body.data.draft.status).toBe('deleted')
  })

  it('supports product, SKU, and image-task endpoints before customer ordering', async () => {
    await seedConfirmedProduct(server.baseUrl)

    const pending = await requestJson(server.baseUrl, '/api/image-tasks/pending')
    expect(pending.body.data.products[0].status).toBe('pending_images')

    const supplemented = await requestJson(server.baseUrl, '/api/image-tasks/product-3/supplement', {
      method: 'POST',
      body: JSON.stringify({
        mainImageUrl: 'cloud://main.png',
        imageUrls: ['cloud://main.png', 'cloud://detail.png'],
      }),
    })
    const published = await requestJson(server.baseUrl, '/api/products/product-3/publish', { method: 'POST' })
    const publishedProducts = await requestJson(server.baseUrl, '/api/products/published')
    const skus = await requestJson(server.baseUrl, '/api/products/product-3/skus')
    const described = await requestJson(server.baseUrl, '/api/products/product-3/description', {
      method: 'PATCH',
      body: JSON.stringify({ description: '进口羊毛混纺，适合通勤叠穿。' }),
    })
    const refreshedProducts = await requestJson(server.baseUrl, '/api/products')

    expect(pending.body.data.products[0].description).toBe('')
    expect(supplemented.body.data.product.status).toBe('ready_to_publish')
    expect(published.body.data.product.status).toBe('published')
    expect(publishedProducts.body.data.products).toHaveLength(1)
    expect(skus.body.data.skus[0]).toMatchObject({ id: 'sku-4', productId: 'product-3' })
    expect(described.body.data.product).toMatchObject({
      id: 'product-3',
      description: '进口羊毛混纺，适合通勤叠穿。',
    })
    expect(refreshedProducts.body.data.products[0].description).toBe('进口羊毛混纺，适合通勤叠穿。')
  })

  it('updates SKU inventory operations and records manual inventory ledger entries', async () => {
    await seedConfirmedProduct(server.baseUrl)

    const updated = await requestJson(server.baseUrl, '/api/products/product-3/skus/sku-4', {
      method: 'PATCH',
      body: JSON.stringify({
        spec: 'Black/XL',
        salePrice: 139,
        stock: 5,
        reason: '补货入库',
      }),
    })
    const restocked = await requestJson(server.baseUrl, '/api/products/product-3/skus/restock', {
      method: 'POST',
      body: JSON.stringify({ quantity: 4, reason: '补货入库' }),
    })
    const cleared = await requestJson(server.baseUrl, '/api/products/product-3/skus/clear', {
      method: 'POST',
      body: JSON.stringify({ reason: '盘点清零' }),
    })
    const skus = await requestJson(server.baseUrl, '/api/products/product-3/skus')
    const ledger = await database.executor.query<{ quantity_delta: number; source_type: string }>(
      'SELECT quantity_delta, source_type FROM inventory_ledger ORDER BY created_at, id',
    )

    expect(updated.body.data.sku).toMatchObject({
      id: 'sku-4',
      spec: 'Black/XL',
      salePrice: 139,
      stock: 5,
    })
    expect(restocked.body.data.skus[0].stock).toBe(9)
    expect(cleared.body.data.skus[0].stock).toBe(0)
    expect(skus.body.data.skus[0]).toMatchObject({ spec: 'Black/XL', salePrice: 139, stock: 0 })
    expect(ledger.rows).toEqual([
      { quantity_delta: 3, source_type: 'manual' },
      { quantity_delta: 4, source_type: 'manual' },
      { quantity_delta: -9, source_type: 'manual' },
    ])
  })

  it('blocks publishing and published listing when no SKU is saleable', async () => {
    await seedConfirmedProduct(server.baseUrl)
    await requestJson(server.baseUrl, '/api/image-tasks/product-3/supplement', {
      method: 'POST',
      body: JSON.stringify({
        mainImageUrl: 'cloud://main.png',
        imageUrls: ['cloud://main.png'],
      }),
    })
    await requestJson(server.baseUrl, '/api/products/product-3/skus/clear', {
      method: 'POST',
      body: JSON.stringify({ reason: '盘点清零' }),
    })

    const blocked = await requestJson(server.baseUrl, '/api/products/product-3/publish', { method: 'POST' })
    const publishedProducts = await requestJson(server.baseUrl, '/api/products/published')

    expect(blocked.status).toBe(409)
    expect(blocked.body.error.message).toBe('全部规格暂无库存，请先补库存')
    expect(publishedProducts.body.data.products).toEqual([])
  })

  it('rejects unauthorized customer order requests without creating an order', async () => {
    await seedPublishedProduct(server.baseUrl)

    const rejected = await requestJson(server.baseUrl, '/api/customer-orders', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-3',
        skuId: 'sku-4',
        quantity: 1,
        session: { customerId: 'mock-customer-001' },
      }),
    })
    const orders = await requestJson(server.baseUrl, '/api/merchant-orders')

    expect(rejected.status).toBe(401)
    expect(rejected.body.error.code).toBe('UNAUTHORIZED')
    expect(orders.body.data.orders).toEqual([])
  })

  it('creates customer orders, lists them, and supports merchant cancel with stock restoration', async () => {
    await seedPublishedProduct(server.baseUrl)

    const created = await requestJson(server.baseUrl, '/api/customer-orders', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-3',
        skuId: 'sku-4',
        quantity: 1,
        session: {
          customerId: 'mock-customer-001',
          nickname: 'Wechat Customer',
          phoneNumber: '13800000000',
          authSource: 'mock_wechat',
        },
      }),
    })
    const detail = await requestJson(server.baseUrl, '/api/customer-orders/order-5')
    const canceled = await requestJson(server.baseUrl, '/api/merchant-orders/order-5/cancel', { method: 'POST' })
    const invalidConfirm = await requestJson(server.baseUrl, '/api/merchant-orders/order-5/confirm', { method: 'POST' })
    const skus = await requestJson(server.baseUrl, '/api/products/product-3/skus')

    expect(created.status).toBe(201)
    expect(created.body.data.order).toMatchObject({
      id: 'order-5',
      customerPhone: '13800000000',
      status: 'pending_merchant_confirm',
    })
    expect(detail.body.data.order.id).toBe('order-5')
    expect(canceled.body.data.order.status).toBe('canceled')
    expect(invalidConfirm.status).toBe(409)
    expect(invalidConfirm.body.error.code).toBe('CONFLICT')
    expect(skus.body.data.skus[0].stock).toBe(2)
  })
})

describe('backend publish validation contract', () => {
  it.each(productPublishValidationCases)('matches the shared publish validation contract: $name', (contractCase) => {
    expect(validateBackendProductForPublish(contractCase.product, contractCase.skus)).toEqual(
      contractCase.expectedMessages,
    )
  })
})

const seedConfirmedProduct = async (baseUrl: string) => {
  await requestJson(baseUrl, '/api/ocr-batches', {
    method: 'POST',
    body: JSON.stringify({
      imageUrls: ['cloud://page-1.png'],
      drafts: [
        {
          productCode: 'A1023',
          productName: 'Cotton Shirt',
          salePrice: 129,
          spec: 'Black/M',
          stock: 2,
          confidence: 0.96,
          sourceImageUrl: 'cloud://page-1.png',
        },
      ],
    }),
  })
  await requestJson(baseUrl, '/api/batches/batch-1/confirm', { method: 'POST' })
}

const seedPublishedProduct = async (baseUrl: string) => {
  await seedConfirmedProduct(baseUrl)
  await requestJson(baseUrl, '/api/image-tasks/product-3/supplement', {
    method: 'POST',
    body: JSON.stringify({
      mainImageUrl: 'cloud://main.png',
      imageUrls: ['cloud://main.png'],
    }),
  })
  await requestJson(baseUrl, '/api/products/product-3/publish', { method: 'POST' })
}
