import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRuntimeCloudBaseError } from './runtime-mall-api-client'

describe('runtime CloudBase mall API client', () => {
  afterEach(() => {
    vi.resetModules()
    Reflect.deleteProperty(globalThis, 'wx')
  })

  it('maps WeChat environment-not-found errors to an operator-readable message', () => {
    const error = createRuntimeCloudBaseError(
      new Error('cloud.callFunction:fail Error: errCode: -501000 | errMsg: Environment not found'),
      'cloud1-d7gifjyzl7721b383',
    )

    expect(error.message).toContain('CloudBase environment not found')
    expect(error.message).toContain('cloud1-d7gifjyzl7721b383')
    expect(error.message).toContain('current mini-program AppID')
    expect(error.message).not.toContain('-501000')
    expect(error.message).not.toContain('Original error')
  })

  it('preserves ordinary Error instances and wraps non-Error failures', () => {
    const ordinaryError = new Error('plain failure')

    expect(createRuntimeCloudBaseError(ordinaryError)).toBe(ordinaryError)
    expect(createRuntimeCloudBaseError('string failure').message).toBe('string failure')
  })

  it('initializes wx.cloud once and reuses the mallApi client', async () => {
    const calls: Array<{ name: string; data: unknown }> = []
    const init = vi.fn()
    Reflect.set(globalThis, 'wx', {
      cloud: {
        init,
        callFunction: vi.fn(async (request: { name: string; data: unknown }) => {
          calls.push(request)
          return { result: { success: true, data: { products: [] }, error: null, meta: {} } }
        }),
      },
    })

    const { getRuntimeCloudBaseMallApiClient } = await import('./runtime-mall-api-client')

    const firstClient = getRuntimeCloudBaseMallApiClient()
    const secondClient = getRuntimeCloudBaseMallApiClient()

    await firstClient.listProducts()
    await secondClient.listPublishedProducts()

    expect(firstClient).toBe(secondClient)
    expect(init).toHaveBeenCalledTimes(1)
    expect(init).toHaveBeenCalledWith({ env: 'cloud1-d7gifjyzl7721b383' })
    expect(calls).toEqual([
      { name: 'mallApi', data: { action: 'listProducts' } },
      { name: 'mallApi', data: { action: 'listPublishedProducts' } },
    ])
  })

  it('fails outside the WeChat runtime before invoking mallApi', async () => {
    const { getRuntimeCloudBaseMallApiClient } = await import('./runtime-mall-api-client')

    await expect(getRuntimeCloudBaseMallApiClient().listProducts()).rejects.toThrow(
      'CloudBase runtime is only available inside WeChat Mini Program',
    )
  })
})
