import { describe, expect, it, vi } from 'vitest'
import { runBackendServerFromEnv } from './main'

describe('backend startup', () => {
  it('reports configuration errors without leaking stack traces or local paths', () => {
    const logError = vi.fn()
    const setExitCode = vi.fn()

    const server = runBackendServerFromEnv(
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
})
