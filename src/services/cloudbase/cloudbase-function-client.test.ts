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

  it('sanitizes raw CloudBase infrastructure errors before page features can render them', async () => {
    const client = createCloudBaseFunctionClient({
      callFunction: async () => ({
        result: {
          success: false,
          data: null,
          error: {
            code: 'DATABASE_COLLECTION_NOT_EXIST',
            message: 'Db or Table not exist. See https://cloud.tencent.com/document/api/876/34822',
          },
          meta: {},
        },
      }),
    })

    await expect(client.call('mallApi', {})).rejects.toThrow('系统数据初始化中，请稍后重试')
    await expect(client.call('mallApi', {})).rejects.not.toThrow('DATABASE_COLLECTION_NOT_EXIST')
  })

  it('sanitizes mp runtime module loader errors before page features can render them', async () => {
    const rawMessage = "module 'services/performance/url.js' is not defined, require args is 'url'"
    const client = createCloudBaseFunctionClient({
      callFunction: async () => ({
        result: {
          success: false,
          data: null,
          error: {
            code: 'RUNTIME_MODULE_ERROR',
            message: rawMessage,
          },
          meta: {},
        },
      }),
    })

    await expect(client.call('mallApi', {})).rejects.toThrow('系统数据初始化中，请稍后重试')
    await expect(client.call('mallApi', {})).rejects.not.toThrow('services/performance/url.js')
    await expect(client.call('mallApi', {})).rejects.not.toThrow('require args')
  })

  it('maps unauthorized CloudBase envelopes and raw unauthorized messages to retry-WeChat-identity copy', async () => {
    const envelopeClient = createCloudBaseFunctionClient({
      callFunction: async () => ({
        result: {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Verified WeChat identity is required',
          },
          meta: {},
        },
      }),
    })
    const rawMessageClient = createCloudBaseFunctionClient({
      callFunction: async () => ({
        result: {
          success: false,
          data: null,
          error: {
            code: 'AUTH_FAILED',
            message: 'UNAUTHORIZED: Verified WeChat identity is required',
          },
          meta: {},
        },
      }),
    })

    await expect(envelopeClient.call('mallApi', {})).rejects.toThrow('请重试验证微信身份')
    await expect(envelopeClient.call('mallApi', {})).rejects.not.toThrow('Verified WeChat identity is required')
    await expect(rawMessageClient.call('mallApi', {})).rejects.toThrow('请重试验证微信身份')
    await expect(rawMessageClient.call('mallApi', {})).rejects.not.toThrow('UNAUTHORIZED')
  })

  it('rejects malformed function responses before they leak into features', () => {
    expect(() => parseCloudBaseFunctionResponse({ result: { nope: true } })).toThrow(
      'CloudBase function returned an invalid envelope',
    )
  })
})
