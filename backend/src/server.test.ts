import { describe, expect, it } from 'vitest'
import { createBackendServer } from './server'

const listenOnRandomPort = async () => {
  const server = createBackendServer()
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected server to listen on a TCP address')
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  }
}

describe('backend HTTP server', () => {
  it('returns a successful health envelope from GET /health', async () => {
    const server = await listenOnRandomPort()

    try {
      const response = await fetch(`${server.baseUrl}/health`)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(body).toMatchObject({
        success: true,
        data: {
          service: 'vx-close-backend',
          status: 'ok',
        },
        error: null,
      })
    } finally {
      await server.close()
    }
  })

  it('returns a safe 404 envelope for unknown routes', async () => {
    const server = await listenOnRandomPort()

    try {
      const response = await fetch(`${server.baseUrl}/missing`)
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body).toEqual({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
        meta: {},
      })
    } finally {
      await server.close()
    }
  })
})
