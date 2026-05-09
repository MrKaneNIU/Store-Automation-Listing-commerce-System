import { Pool, type QueryResultRow } from 'pg'

import { BackendConfigurationError } from '../http/errors'

export type DatabaseQueryResult<T extends QueryResultRow = QueryResultRow> = {
  rows: T[]
  rowCount: number | null
}

export type DatabaseExecutor = {
  query: <T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: readonly unknown[],
  ) => Promise<DatabaseQueryResult<T>>
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

const queryPg = async <T extends QueryResultRow>(
  executor: Pick<Pool, 'query'>,
  sql: string,
  params?: readonly unknown[],
): Promise<DatabaseQueryResult<T>> => {
  const result = await executor.query<T>(sql, params ? [...params] : undefined)
  return {
    rows: result.rows,
    rowCount: result.rowCount,
  }
}

export const createTransactionalDatabase = (pool: Pool): TransactionalDatabaseExecutor => ({
  query: (sql, params) => queryPg(pool, sql, params),
  transaction: async (work) => {
    const client = await pool.connect()
    const transactionExecutor: DatabaseExecutor = {
      query: (sql, params) => queryPg(client, sql, params),
    }

    try {
      await client.query('BEGIN')
      const result = await work(transactionExecutor)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  },
})
