import { newDb } from 'pg-mem'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { DatabaseExecutor } from './client'
import { applyMigrations, getMigrationStatus, runMigrationCli } from './migrate'

type TestDatabase = {
  executor: DatabaseExecutor
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
    },
    close: () => pool.end(),
  }
}

describe('Phase 2 database migrations', () => {
  let database: TestDatabase

  beforeEach(() => {
    database = createTestDatabase()
  })

  afterEach(async () => {
    await database.close()
  })

  it('creates the full Phase 2 schema from an empty database', async () => {
    await applyMigrations(database.executor)

    const { rows } = await database.executor.query<{ table_name: string }>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'schema_migrations',
            'ocr_batches',
            'product_drafts',
            'products',
            'skus',
            'orders',
            'order_items',
            'customers',
            'staff_users'
          )
        ORDER BY table_name
      `,
    )

    expect(rows.map((row) => row.table_name)).toEqual([
      'customers',
      'ocr_batches',
      'order_items',
      'orders',
      'product_drafts',
      'products',
      'schema_migrations',
      'skus',
      'staff_users',
    ])
  })

  it('can run repeatedly without recording duplicate migration history', async () => {
    await applyMigrations(database.executor)
    await applyMigrations(database.executor)

    const status = await getMigrationStatus(database.executor)
    const { rows } = await database.executor.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM schema_migrations',
    )

    expect(status.pending).toEqual([])
    expect(status.applied.map((migration) => migration.id)).toEqual(['202605090001'])
    expect(rows[0]?.count).toBe(1)
  })

  it('rejects invalid statuses, missing foreign keys, and invalid quantities', async () => {
    await applyMigrations(database.executor)

    await expect(
      database.executor.query(
        `
          INSERT INTO ocr_batches (id, status, image_urls, created_at, updated_at)
          VALUES ('batch-1', 'failed', ARRAY['cloud://one.png'], NOW(), NOW())
        `,
      ),
    ).rejects.toThrow()

    await expect(
      database.executor.query(
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
          VALUES (
            'draft-1',
            'missing-batch',
            'A1023',
            'Cotton Shirt',
            129,
            'M',
            10,
            0.95,
            'cloud://one.png',
            'pending'
          )
        `,
      ),
    ).rejects.toThrow()

    await database.executor.query(
      `
        INSERT INTO ocr_batches (id, status, image_urls, created_at, updated_at)
        VALUES ('batch-2', 'confirmed', ARRAY['cloud://two.png'], NOW(), NOW())
      `,
    )
    await database.executor.query(
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
        VALUES (
          'product-1',
          'A1023',
          'Cotton Shirt',
          'cloud://main.png',
          ARRAY['cloud://main.png'],
          'published',
          'batch-2',
          NOW(),
          NOW()
        )
      `,
    )
    await database.executor.query(
      `
        INSERT INTO skus (id, product_id, product_code, spec, sale_price, stock)
        VALUES ('sku-1', 'product-1', 'A1023', 'M', 129, 10)
      `,
    )
    await database.executor.query(
      `
        INSERT INTO orders (
          id,
          customer_name,
          customer_phone,
          customer_auth_source,
          status,
          total_amount,
          created_at,
          updated_at
        )
        VALUES (
          'order-1',
          'Alice',
          '13800000000',
          'mock_wechat',
          'pending_merchant_confirm',
          129,
          NOW(),
          NOW()
        )
      `,
    )

    await expect(
      database.executor.query(
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
          VALUES (
            'order-item-1',
            'order-1',
            'sku-1',
            'product-1',
            'Cotton Shirt',
            'A1023',
            'M',
            129,
            0
          )
        `,
      ),
    ).rejects.toThrow()
  })

  it('reports missing migration database configuration without a stack trace', async () => {
    const errors: string[] = []
    const exitCodes: number[] = []

    await runMigrationCli(['node', 'migrate.js', 'status'], {}, {
      log: () => undefined,
      logError: (message) => errors.push(message),
      setExitCode: (code) => exitCodes.push(code),
    })

    expect(errors).toEqual(['CONFIGURATION_ERROR: DATABASE_URL is required for database migrations'])
    expect(errors.join('\n')).not.toContain('backend\\dist')
    expect(errors.join('\n')).not.toContain('at ')
    expect(exitCodes).toEqual([1])
  })
})
