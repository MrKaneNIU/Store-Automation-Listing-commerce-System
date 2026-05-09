import { parseBackendEnv } from './config/env'
import { createPgPoolFromEnv, createTransactionalDatabase } from './db/client'
import { applyMigrations } from './db/migrate'
import { createApiRequestHandler, type ApiRequestHandler } from './api/routes'
import { BackendConfigurationError } from './http/errors'
import { createBackendServer } from './server'
import { createDatabaseMallRepository } from './repositories/database-mall-repository'

export type BackendStartupRuntime = {
  logError: (message: string) => void
  setExitCode: (code: number) => void
}

type BackendRuntimeOptions = {
  apiHandler?: ApiRequestHandler
  close: () => Promise<void>
}

type BackendRuntimeDependencies = {
  createPool: typeof createPgPoolFromEnv
  applyMigrations: typeof applyMigrations
  createRepository: typeof createDatabaseMallRepository
  createApiHandler: typeof createApiRequestHandler
  createId: (prefix: string) => string
  now: () => string
}

const defaultRuntimeDependencies: BackendRuntimeDependencies = {
  createPool: createPgPoolFromEnv,
  applyMigrations,
  createRepository: createDatabaseMallRepository,
  createApiHandler: createApiRequestHandler,
  createId: (prefix) => `${prefix}-${crypto.randomUUID()}`,
  now: () => new Date().toISOString(),
}

export const formatStartupError = (error: unknown): string => {
  if (error instanceof BackendConfigurationError) {
    return `${error.code}: ${error.message}`
  }

  return 'STARTUP_ERROR: Backend failed to start'
}

export const createBackendRuntimeOptions = async (
  input: NodeJS.ProcessEnv = process.env,
  dependencies: BackendRuntimeDependencies = defaultRuntimeDependencies,
): Promise<BackendRuntimeOptions> => {
  if (!input.DATABASE_URL) {
    return {
      close: async () => undefined,
    }
  }

  const pool = dependencies.createPool(input)
  await dependencies.applyMigrations(pool)
  const database = createTransactionalDatabase(pool)
  const repository = dependencies.createRepository(database)
  const apiHandler = dependencies.createApiHandler({
    repository,
    createId: dependencies.createId,
    now: dependencies.now,
  })

  return {
    apiHandler,
    close: () => pool.end(),
  }
}

export const startBackendServer = async (input: NodeJS.ProcessEnv = process.env) => {
  const env = parseBackendEnv(input)
  const runtimeOptions = await createBackendRuntimeOptions(input)
  const server = createBackendServer({ apiHandler: runtimeOptions.apiHandler })

  server.listen(env.port, env.host, () => {
    console.log(`VX backend listening on http://${env.host}:${env.port}`)
  })

  server.on('close', () => {
    void runtimeOptions.close()
  })

  return server
}

export const runBackendServerFromEnv = async (
  input: NodeJS.ProcessEnv = process.env,
  runtime: BackendStartupRuntime = {
    logError: (message) => console.error(message),
    setExitCode: (code) => {
      process.exitCode = code
    },
  },
) => {
  try {
    return await startBackendServer(input)
  } catch (error) {
    runtime.logError(formatStartupError(error))
    runtime.setExitCode(1)
    return null
  }
}

if (require.main === module) {
  runBackendServerFromEnv()
}
