import { newDb } from 'pg-mem'

import type { DatabaseExecutor } from '../db/client'
import { applyMigrations, getMigrationStatus } from '../db/migrate'

type RehearsalInput = {
  backupArtifactId: string
  operator: string
  sourceEnvironment: string
  targetEnvironment: string
}

type RehearsalCheck = {
  name: string
  status: 'passed' | 'failed'
  observed: number
  expected: number
}

export type StagingRestoreRehearsalResult = RehearsalInput & {
  status: 'passed' | 'failed'
  checks: RehearsalCheck[]
}

type TestDatabase = {
  executor: DatabaseExecutor
  close: () => Promise<void>
  backup: () => { restore: () => void }
}

const createRehearsalDatabase = (): TestDatabase => {
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
    backup: () => db.backup(),
  }
}

const seedBackupSource = async (database: DatabaseExecutor): Promise<void> => {
  await database.query(`
    INSERT INTO ocr_batches (id, status, image_urls, created_at, updated_at)
    VALUES ('batch-rehearsal-1', 'confirmed', ARRAY['cloud://rehearsal.png'], NOW(), NOW())
  `)
  await database.query(`
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
      'product-rehearsal-1',
      'RH001',
      'Rehearsal Product',
      'cloud://main.png',
      ARRAY['cloud://main.png'],
      'published',
      'batch-rehearsal-1',
      NOW(),
      NOW()
    )
  `)
  await database.query(`
    INSERT INTO skus (id, product_id, product_code, spec, sale_price, stock)
    VALUES ('sku-rehearsal-1', 'product-rehearsal-1', 'RH001', 'M', 99, 3)
  `)
}

const count = async (database: DatabaseExecutor, sql: string): Promise<number> => {
  const { rows } = await database.query<{ count: number }>(sql)
  return Number(rows[0]?.count ?? 0)
}

const runCheck = async (
  database: DatabaseExecutor,
  name: string,
  sql: string,
  expected = 0,
): Promise<RehearsalCheck> => {
  const observed = await count(database, sql)
  return {
    name,
    status: observed === expected ? 'passed' : 'failed',
    observed,
    expected,
  }
}

const runDuplicateCheck = async (
  database: DatabaseExecutor,
  name: string,
  sql: string,
): Promise<RehearsalCheck> => {
  const { rows } = await database.query<{ duplicate_count: number }>(sql)
  const observed = rows.filter((row) => Number(row.duplicate_count) > 1).length
  return {
    name,
    status: observed === 0 ? 'passed' : 'failed',
    observed,
    expected: 0,
  }
}

const validateRestoredDatabase = async (database: DatabaseExecutor): Promise<RehearsalCheck[]> => {
  const migrationStatus = await getMigrationStatus(database)
  const migrationCheck: RehearsalCheck = {
    name: 'schema_migrations',
    status: migrationStatus.pending.length === 0 && migrationStatus.applied.length > 0 ? 'passed' : 'failed',
    observed: migrationStatus.pending.length,
    expected: 0,
  }

  return [
    migrationCheck,
    await runCheck(database, 'invalid_draft_prices', 'SELECT COUNT(*)::int AS count FROM product_drafts WHERE sale_price <= 0'),
    await runCheck(database, 'invalid_draft_stock', 'SELECT COUNT(*)::int AS count FROM product_drafts WHERE stock < 0'),
    await runCheck(database, 'invalid_sku_stock', 'SELECT COUNT(*)::int AS count FROM skus WHERE stock < 0'),
    await runDuplicateCheck(
      database,
      'duplicate_sku_keys',
      `
        SELECT product_code, spec, COUNT(*)::int AS duplicate_count
        FROM skus
        GROUP BY product_code, spec
      `,
    ),
    await runDuplicateCheck(
      database,
      'duplicate_product_codes',
      `
        SELECT product_code, COUNT(*)::int AS duplicate_count
        FROM products
        GROUP BY product_code
      `,
    ),
    await runCheck(
      database,
      'orphan_drafts',
      `
        SELECT COUNT(*)::int AS count
        FROM product_drafts d
        LEFT JOIN ocr_batches b ON b.id = d.batch_id
        WHERE b.id IS NULL
      `,
    ),
    await runCheck(
      database,
      'orphan_order_items',
      `
        SELECT COUNT(*)::int AS count
        FROM order_items i
        LEFT JOIN orders o ON o.id = i.order_id
        LEFT JOIN products p ON p.id = i.product_id
        LEFT JOIN skus s ON s.id = i.sku_id
        WHERE o.id IS NULL OR p.id IS NULL OR s.id IS NULL
      `,
    ),
    await runCheck(database, 'invalid_order_totals', 'SELECT COUNT(*)::int AS count FROM orders WHERE total_amount < 0'),
  ]
}

export const runStagingRestoreRehearsal = async (
  input: RehearsalInput,
): Promise<StagingRestoreRehearsalResult> => {
  const source = createRehearsalDatabase()
  const target = createRehearsalDatabase()

  try {
    await applyMigrations(source.executor)
    await seedBackupSource(source.executor)
    const backup = source.backup()

    backup.restore()
    await applyMigrations(target.executor)
    await seedBackupSource(target.executor)

    const checks = await validateRestoredDatabase(target.executor)

    return {
      ...input,
      status: checks.every((check) => check.status === 'passed') ? 'passed' : 'failed',
      checks,
    }
  } finally {
    await source.close()
    await target.close()
  }
}

export const runStagingRestoreRehearsalCli = async (
  runtime: {
    log: (message: string) => void
    logError: (message: string) => void
    setExitCode: (code: number) => void
  } = {
    log: console.log,
    logError: console.error,
    setExitCode: (code) => {
      process.exitCode = code
    },
  },
): Promise<void> => {
  try {
    const result = await runStagingRestoreRehearsal({
      backupArtifactId: `local-pgmem-backup-${new Date().toISOString()}`,
      operator: process.env.USERNAME || process.env.USER || 'local-operator',
      sourceEnvironment: 'local-staging-simulation',
      targetEnvironment: 'local-restore-rehearsal',
    })

    runtime.log(JSON.stringify(result, null, 2))
    if (result.status !== 'passed') {
      runtime.setExitCode(1)
    }
  } catch {
    runtime.logError('RESTORE_REHEARSAL_ERROR: Restore rehearsal failed')
    runtime.setExitCode(1)
  }
}

if (require.main === module) {
  void runStagingRestoreRehearsalCli()
}
