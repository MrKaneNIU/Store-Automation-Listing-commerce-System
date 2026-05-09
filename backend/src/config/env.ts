import { BackendConfigurationError } from '../http/errors'

export type BackendNodeEnv = 'development' | 'test' | 'production'

export type BackendEnv = {
  host: string
  port: number
  nodeEnv: BackendNodeEnv
}

const validNodeEnvs: BackendNodeEnv[] = ['development', 'test', 'production']

const parsePort = (value: string | undefined): number => {
  if (!value) {
    throw new BackendConfigurationError('BACKEND_PORT is required')
  }

  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new BackendConfigurationError('BACKEND_PORT must be an integer between 1 and 65535')
  }

  return port
}

const parseNodeEnv = (value: string | undefined): BackendNodeEnv => {
  const nodeEnv = value ?? 'development'
  if (!validNodeEnvs.includes(nodeEnv as BackendNodeEnv)) {
    throw new BackendConfigurationError('NODE_ENV must be development, test, or production')
  }

  return nodeEnv as BackendNodeEnv
}

export const parseBackendEnv = (input: NodeJS.ProcessEnv): BackendEnv => ({
  host: input.BACKEND_HOST || '127.0.0.1',
  port: parsePort(input.BACKEND_PORT),
  nodeEnv: parseNodeEnv(input.NODE_ENV),
})
