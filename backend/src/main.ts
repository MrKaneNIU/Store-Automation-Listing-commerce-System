import { parseBackendEnv } from './config/env'
import { BackendConfigurationError } from './http/errors'
import { createBackendServer } from './server'

export type BackendStartupRuntime = {
  logError: (message: string) => void
  setExitCode: (code: number) => void
}

export const formatStartupError = (error: unknown): string => {
  if (error instanceof BackendConfigurationError) {
    return `${error.code}: ${error.message}`
  }

  return 'STARTUP_ERROR: Backend failed to start'
}

export const startBackendServer = (input: NodeJS.ProcessEnv = process.env) => {
  const env = parseBackendEnv(input)
  const server = createBackendServer()

  server.listen(env.port, env.host, () => {
    console.log(`VX backend listening on http://${env.host}:${env.port}`)
  })

  return server
}

export const runBackendServerFromEnv = (
  input: NodeJS.ProcessEnv = process.env,
  runtime: BackendStartupRuntime = {
    logError: (message) => console.error(message),
    setExitCode: (code) => {
      process.exitCode = code
    },
  },
) => {
  try {
    return startBackendServer(input)
  } catch (error) {
    runtime.logError(formatStartupError(error))
    runtime.setExitCode(1)
    return null
  }
}

if (require.main === module) {
  runBackendServerFromEnv()
}
