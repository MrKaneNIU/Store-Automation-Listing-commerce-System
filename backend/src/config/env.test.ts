import { describe, expect, it } from 'vitest'
import { parseBackendEnv } from './env'

describe('backend environment parsing', () => {
  it('parses a valid backend environment', () => {
    const env = parseBackendEnv({
      BACKEND_HOST: '127.0.0.1',
      BACKEND_PORT: '3001',
      NODE_ENV: 'development',
    })

    expect(env).toEqual({
      host: '127.0.0.1',
      port: 3001,
      nodeEnv: 'development',
    })
  })

  it('fails fast when BACKEND_PORT is missing', () => {
    expect(() =>
      parseBackendEnv({
        BACKEND_HOST: '127.0.0.1',
        NODE_ENV: 'development',
      }),
    ).toThrow('BACKEND_PORT is required')
  })

  it('fails fast when BACKEND_PORT is not a valid TCP port', () => {
    expect(() =>
      parseBackendEnv({
        BACKEND_HOST: '127.0.0.1',
        BACKEND_PORT: '99999',
        NODE_ENV: 'development',
      }),
    ).toThrow('BACKEND_PORT must be an integer between 1 and 65535')
  })
})
