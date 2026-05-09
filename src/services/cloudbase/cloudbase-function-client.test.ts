import { describe, expect, it } from 'vitest'

import {
  createCloudBaseFunctionClient,
  parseCloudBaseFunctionResponse,
} from './cloudbase-function-client'

describe('CloudBase function client', () => {
  it('wraps wx.cloud.callFunction behind a service adapter contract', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const client = createCloudBaseFunctionClient({
      callFunction: async (request) => {
        calls.push(request)
        return {
          result: {
            success: true,
            data: { status: 'ok' },
            error: null,
            meta: {},
          },
        }
      },
    })

    await expect(client.call('health', { source: 'service-test' })).resolves.toEqual({ status: 'ok' })
    expect(calls).toEqual([{ name: 'health', data: { source: 'service-test' } }])
  })

  it('maps CloudBase error envelopes into user-safe errors', async () => {
    const client = createCloudBaseFunctionClient({
      callFunction: async () => ({
        result: {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
          },
          meta: {},
        },
      }),
    })

    await expect(client.call('health', {})).rejects.toThrow('VALIDATION_ERROR: Invalid request')
  })

  it('rejects malformed function responses before they leak into features', () => {
    expect(() => parseCloudBaseFunctionResponse({ result: { nope: true } })).toThrow(
      'CloudBase function returned an invalid envelope',
    )
  })
})
