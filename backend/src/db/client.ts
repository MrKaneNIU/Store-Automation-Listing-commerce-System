import { Pool } from 'pg'

import { BackendConfigurationError } from '../http/errors'

export type DatabaseQueryResult<T = unknown> = {
  rows: T[]
  rowCount: number | null
}

export type DatabaseExecutor = {
  query: <T = unknown>(sql: string, params?: readonly unknown[]) => Promise<DatabaseQueryResult<T>>
}

export type TransactionalDatabaseExecutor = DatabaseExecutor & {
  transaction: <T>(work: (database: DatabaseExecutor) => Promise<T>) => Promise<T>
}

export type DatabaseEnv = {
  databaseUrl: string
}

export const parseDatabaseEnv = (input: NodeJS.ProcessEnv): DatabaseEnv => {
  if (!input.DATABASE_URL) {
    throw new BackendConfigurationError('DATABASE_URL is required for database migrations')
  }

  return {
    databaseUrl: input.DATABASE_URL,
  }
}

export const createPgPoolFromEnv = (input: NodeJS.ProcessEnv = process.env): Pool => {
  const env = parseDatabaseEnv(input)

  return new Pool({
    connectionString: env.databaseUrl,
    allowExitOnIdle: true,
  })
}
