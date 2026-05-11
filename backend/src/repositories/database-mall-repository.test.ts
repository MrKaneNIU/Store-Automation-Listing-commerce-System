import { newDb } from 'pg-mem'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createProductsFromDrafts } from '../../../src/domain/catalog/rules'
import { confirmDrafts } from '../../../src/domain/draft/rules'
import { canCreateOrder, cancelOrder, createPendingOrder } from '../../../src/domain/order/rules'
import {
  repositoryContractFixtures,
  runMallRepositoryContract,
} from '../../../src/services/repositories/mall-repository-contract'
import type { DatabaseExecutor, TransactionalDatabaseExecutor } from '../db/client'
import { applyMigrations } from '../db/migrate'
import { createDatabaseMallRepository } from './database-mall-repository'

type TestDatabase = {
  executor: TransactionalDatabaseExecutor
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

let database: TestDatabase

beforeEach(async () => {
  database = createTestDatabase()
  await applyMigrations(database.executor)
})

afterEach(async () => {
  await database.close()
})

runMallRepositoryContract('database', {
  createRepository: () => createDatabaseMallRepository(database.executor),
})

describe('database mall repository transactions', () => {
  it('rolls back product inserts when SKU persistence fails', async () => {
    const repository = createDatabaseMallRepository(database.executor)
    const { batch, product, sku } = repositoryContractFixtures

    await repository.saveBatch(batch)

    await expect(
      repository.saveProducts([product], [{ ...sku, stock: -1 }]),
    ).rejects.toThrow()

    expect(await repository.listProducts()).toEqual([])
    expect(await repository.listSkus()).toEqual([])
  })

  it('saves and lists inventory ledger entries by sku', async () => {
    const repository = createDatabaseMallRepository(database.executor)
    const { batch } = repositoryContractFixtures

    await repository.saveBatch(batch)
    await repository.saveProducts(
      [{
        id: 'product-1',
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        mainImageUrl: '/tmp/main.png',
        imageUrls: ['/tmp/main.png'],
        status: 'published',
        createdFromBatchId: batch.id,
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      }],
      [{
        id: 'sku-1',
        productId: 'product-1',
        productCode: 'A1023',
        spec: 'M',
        salePrice: 129,
        stock: 10,
      }],
    )
    await repository.saveOrder({
      id: 'order-1',
      customerName: 'Wechat Customer',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      status: 'pending_merchant_confirm',
      items: [{
        skuId: 'sku-1',
        productId: 'product-1',
        productName: 'Cotton Shirt',
        productCode: 'A1023',
        spec: 'M',
        salePrice: 129,
        quantity: 1,
      }],
      totalAmount: 129,
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    })

    const entry = {
      id: 'ledger-1',
      skuId: 'sku-1',
      orderId: 'order-1',
      action: 'reserve' as const,
      quantityDelta: -1,
      sourceType: 'order' as const,
      sourceId: 'order-1',
      note: 'reserve stock for order',
      createdAt: '2026-05-11T00:00:00.000Z',
    }

    await repository.saveInventoryLedgerEntry(entry)

    expect(await repository.listInventoryLedgerEntries('sku-1')).toEqual([entry])
  })

  it('persists ledger entries without depending on ledger foreign keys', async () => {
    const repository = createDatabaseMallRepository(database.executor)
    const { batch } = repositoryContractFixtures

    await repository.saveBatch(batch)
    await repository.saveProducts(
      [{
        id: 'product-1',
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        mainImageUrl: '/tmp/main.png',
        imageUrls: ['/tmp/main.png'],
        status: 'published',
        createdFromBatchId: batch.id,
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      }],
      [{
        id: 'sku-1',
        productId: 'product-1',
        productCode: 'A1023',
        spec: 'M',
        salePrice: 129,
        stock: 10,
      }],
    )

    const entry = {
      id: 'ledger-1',
      skuId: 'sku-1',
      orderId: 'order-1',
      action: 'reserve' as const,
      quantityDelta: -1,
      sourceType: 'order' as const,
      sourceId: 'order-1',
      note: 'reserve stock for order',
      createdAt: '2026-05-11T00:00:00.000Z',
    }

    await expect(repository.saveInventoryLedgerEntry(entry)).resolves.toEqual(entry)
  })
})

describe('database mall repository MVP loop', () => {
  it('runs the draft to product to order cancellation loop against the database repository', async () => {
    const repository = createDatabaseMallRepository(database.executor)
    const { batch, draft } = repositoryContractFixtures

    await repository.saveBatch({ ...batch, status: 'recognized' })
    await repository.saveDrafts([{ ...draft, status: 'pending' }])

    const confirmation = confirmDrafts(await repository.listDrafts(batch.id))
    await repository.replaceDrafts(batch.id, confirmation.drafts)

    const catalog = createProductsFromDrafts(confirmation.drafts)
    await repository.saveProducts(catalog.products, catalog.skus)
    const product = {
      ...catalog.products[0],
      mainImageUrl: '/tmp/main.png',
      imageUrls: ['/tmp/main.png'],
      status: 'published' as const,
    }
    await repository.updateProduct(product)

    const sku = (await repository.listSkus(product.id))[0]
    expect(canCreateOrder(product, sku, 1)).toBe(true)

    const order = createPendingOrder({
      product,
      sku,
      customerName: 'Wechat Customer',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat',
      quantity: 1,
    })
    await repository.updateSku({ ...sku, stock: sku.stock - 1 })
    await repository.saveOrder(order)
    await repository.updateSku({ ...sku, stock: sku.stock })
    await repository.updateOrder(cancelOrder(order))

    expect((await repository.listOrders())[0]?.status).toBe('canceled')
    expect((await repository.listSkus(product.id))[0]?.stock).toBe(sku.stock)
  })

  it('persists orders with an idempotency key and returns the same record on repeat saves', async () => {
    const repository = createDatabaseMallRepository(database.executor)
    const { batch } = repositoryContractFixtures

    await repository.saveBatch(batch)
    await repository.saveProducts(
      [{
        id: 'product-1',
        productCode: 'A1023',
        productName: 'Cotton Shirt',
        mainImageUrl: '/tmp/main.png',
        imageUrls: ['/tmp/main.png'],
        status: 'published',
        createdFromBatchId: batch.id,
        createdAt: '2026-05-11T00:00:00.000Z',
        updatedAt: '2026-05-11T00:00:00.000Z',
      }],
      [{
        id: 'sku-1',
        productId: 'product-1',
        productCode: 'A1023',
        spec: 'M',
        salePrice: 129,
        stock: 10,
      }],
    )

    const order = {
      id: 'order-1',
      customerName: 'Wechat Customer',
      customerPhone: '13800000000',
      customerId: 'mock-customer-001',
      customerAuthSource: 'mock_wechat' as const,
      idempotencyKey: 'checkout-1',
      status: 'pending_merchant_confirm' as const,
      items: [{
        skuId: 'sku-1',
        productId: 'product-1',
        productName: 'Cotton Shirt',
        productCode: 'A1023',
        spec: 'M',
        salePrice: 129,
        quantity: 1,
      }],
      totalAmount: 129,
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    }

    const first = await repository.saveOrder(order)
    const second = await repository.updateOrder({ ...order, updatedAt: '2026-05-11T00:01:00.000Z' })

    expect(first.idempotencyKey).toBe('checkout-1')
    expect(second.idempotencyKey).toBe('checkout-1')
    expect(await repository.listOrders()).toHaveLength(1)
  })
})
