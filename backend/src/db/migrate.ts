import { createHash } from 'node:crypto'

import { createPgPoolFromEnv, type DatabaseExecutor } from './client'
import { phase2Migrations } from './migrations'
import { BackendConfigurationError } from '../http/errors'

export type Migration = {
  id: string
  name: string
  purpose: string
  compensation: string
  validation: string
  upSql: string
}

export type MigrationRecord = {
  id: string
  name: string
  checksum: string
  appliedAt: string
}

export type MigrationStatus = {
  applied: MigrationRecord[]
  pending: Migration[]
}

type MigrationRuntime = {
  log: (message: string) => void
  logError: (message: string) => void
  setExitCode: (code: number) => void
}

const defaultRuntime: MigrationRuntime = {
  log: console.log,
  logError: console.error,
  setExitCode: (code) => {
    process.exitCode = code
  },
}

const migrationChecksum = (migration: Migration): string => {
  return createHash('sha256').update(migration.upSql).digest('hex')
}

const ensureMigrationTable = async (database: DatabaseExecutor): Promise<void> => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

const listAppliedMigrations = async (database: DatabaseExecutor): Promise<MigrationRecord[]> => {
  const { rows } = await database.query<{
    id: string
    name: string
    checksum: string
    applied_at: string
  }>(`
    SELECT id, name, checksum, applied_at
    FROM schema_migrations
    ORDER BY id
  `)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    checksum: row.checksum,
    appliedAt: row.applied_at,
  }))
}

const assertAppliedMigrationsUnchanged = (
  applied: MigrationRecord[],
  migrations: Migration[],
): void => {
  const migrationsById = new Map(migrations.map((migration) => [migration.id, migration]))

  applied.forEach((record) => {
    const migration = migrationsById.get(record.id)
    if (!migration) {
      return
    }

    const checksum = migrationChecksum(migration)
    if (checksum !== record.checksum) {
      throw new Error(`Migration ${record.id} checksum does not match the current migration definition`)
    }
  })
}

export const getMigrationStatus = async (
  database: DatabaseExecutor,
  migrations: Migration[] = phase2Migrations,
): Promise<MigrationStatus> => {
  await ensureMigrationTable(database)

  const applied = await listAppliedMigrations(database)
  assertAppliedMigrationsUnchanged(applied, migrations)

  const appliedIds = new Set(applied.map((migration) => migration.id))
  const pending = migrations.filter((migration) => !appliedIds.has(migration.id))

  return { applied, pending }
}

export const applyMigrations = async (
  database: DatabaseExecutor,
  migrations: Migration[] = phase2Migrations,
): Promise<MigrationStatus> => {
  const status = await getMigrationStatus(database, migrations)

  if (status.pending.length === 0) {
    return status
  }

  await database.query('BEGIN')
  try {
    for (const migration of status.pending) {
      await database.query(migration.upSql)
      await database.query(
        `
          INSERT INTO schema_migrations (id, name, checksum)
          VALUES ($1, $2, $3)
        `,
        [migration.id, migration.name, migrationChecksum(migration)],
      )
    }

    await database.query('COMMIT')
  } catch (error) {
    await database.query('ROLLBACK')
    throw error
  }

  return getMigrationStatus(database, migrations)
}

const formatMigrationError = (error: unknown): string => {
  if (error instanceof BackendConfigurationError) {
    return `${error.code}: ${error.message}`
  }

  return 'DATABASE_MIGRATION_ERROR: Database migration command failed'
}

export const runMigrationCli = async (
  argv: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
  runtime: MigrationRuntime = defaultRuntime,
): Promise<void> => {
  const command = argv[2] ?? 'status'

  if (command !== 'apply' && command !== 'status') {
    runtime.logError('USAGE_ERROR: Expected command "status" or "apply"')
    runtime.setExitCode(1)
    return
  }

  let pool: ReturnType<typeof createPgPoolFromEnv> | null = null
  try {
    pool = createPgPoolFromEnv(env)

    if (command === 'apply') {
      const before = await getMigrationStatus(pool)
      const after = await applyMigrations(pool)
      const appliedCount = before.pending.length - after.pending.length
      runtime.log(`Applied migrations: ${appliedCount}`)
      return
    }

    const status = await getMigrationStatus(pool)
    runtime.log(`Applied migrations: ${status.applied.length}`)
    runtime.log(`Pending migrations: ${status.pending.map((migration) => migration.id).join(', ') || 'none'}`)
  } catch (error) {
    runtime.logError(formatMigrationError(error))
    runtime.setExitCode(1)
  } finally {
    await pool?.end()
  }
}

if (require.main === module) {
  void runMigrationCli()
}
