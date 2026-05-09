import { describe, expect, it, vi } from 'vitest'
import { createBackendRuntimeOptions, runBackendServerFromEnv } from './main'

describe('backend startup', () => {
  it('reports configuration errors without leaking stack traces or local paths', async () => {
    const logError = vi.fn()
    const setExitCode = vi.fn()

    const server = await runBackendServerFromEnv(
      {
        BACKEND_HOST: '127.0.0.1',
        NODE_ENV: 'development',
      },
      {
        logError,
        setExitCode,
      },
    )

    expect(server).toBeNull()
    expect(setExitCode).toHaveBeenCalledWith(1)
    expect(logError).toHaveBeenCalledWith('CONFIGURATION_ERROR: BACKEND_PORT is required')
    expect(logError.mock.calls[0][0]).not.toContain('backend\\dist')
    expect(logError.mock.calls[0][0]).not.toContain('at ')
  })

  it('keeps health-check-only startup when DATABASE_URL is not configured', async () => {
    const options = await createBackendRuntimeOptions({
      BACKEND_HOST: '127.0.0.1',
      BACKEND_PORT: '3001',
      NODE_ENV: 'development',
    })

    expect(options.apiHandler).toBeUndefined()
    await options.close()
  })

  it('wires API runtime when DATABASE_URL is configured', async () => {
    const pool = {
      query: vi.fn(),
      end: vi.fn(),
    }
    const repository = { kind: 'database-repository' }
    const apiHandler = vi.fn()

    const options = await createBackendRuntimeOptions(
      {
        BACKEND_HOST: '127.0.0.1',
        BACKEND_PORT: '3001',
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/vx_close_test',
      },
      {
        createPool: vi.fn(() => pool),
        applyMigrations: vi.fn(),
        createRepository: vi.fn(() => repository),
        createApiHandler: vi.fn(() => apiHandler),
        createId: () => 'test-id',
        now: () => '2026-05-09T00:00:00.000Z',
      },
    )

    expect(options.apiHandler).toBe(apiHandler)
    await options.close()
    expect(pool.end).toHaveBeenCalled()
  })
})
