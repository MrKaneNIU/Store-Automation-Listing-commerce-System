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
})
