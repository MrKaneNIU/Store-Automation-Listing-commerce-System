import { createRequire } from 'node:module'
import { afterEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const api = require('./index')
const { __private__ } = api

const restoreEnv = (key, value) => {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

describe('mallApi runtime WeChat identity', () => {
  const originalLocalMemory = process.env.MALL_API_LOCAL_MEMORY
  const originalAllowTestIdentity = process.env.MALL_API_ALLOW_TEST_IDENTITY

  afterEach(() => {
    restoreEnv('MALL_API_LOCAL_MEMORY', originalLocalMemory)
    restoreEnv('MALL_API_ALLOW_TEST_IDENTITY', originalAllowTestIdentity)
  })

  it('reads verified mini-program identity from CloudBase node runtime context', () => {
    const identity = __private__.readRuntimeIdentityFromCloudbase({
      getCloudbaseContext: () => ({
        OPENID: 'customer-openid',
        APPID: 'wxa63c53796488d4d4',
        UNIONID: 'customer-unionid',
      }),
    })

    expect(identity).toEqual({
      openid: 'customer-openid',
      appid: 'wxa63c53796488d4d4',
      unionid: 'customer-unionid',
      roles: ['customer'],
    })
  })

  it('normalizes WX-prefixed CloudBase node runtime context fields', () => {
    const identity = __private__.readRuntimeIdentityFromCloudbase({
      getCloudbaseContext: () => ({
        WX_OPENID: 'wx-customer-openid',
        WX_APPID: 'wxa63c53796488d4d4',
        WX_UNIONID: 'wx-customer-unionid',
      }),
    })

    expect(identity).toEqual({
      openid: 'wx-customer-openid',
      appid: 'wxa63c53796488d4d4',
      unionid: 'wx-customer-unionid',
      roles: ['customer'],
    })
  })

  it('keeps the wx context fallback for compatible runtimes', () => {
    const identity = __private__.readRuntimeIdentityFromCloudbase({
      getWXContext: () => ({
        OPENID: 'fallback-openid',
        APPID: 'wxa63c53796488d4d4',
      }),
    })

    expect(identity).toEqual({
      openid: 'fallback-openid',
      appid: 'wxa63c53796488d4d4',
      unionid: undefined,
      roles: ['customer'],
    })
  })

  it('does not create a customer identity when the platform context has no openid', () => {
    const identity = __private__.readRuntimeIdentityFromCloudbase({
      getCloudbaseContext: () => ({
        APPID: 'wxa63c53796488d4d4',
      }),
    })

    expect(identity).toBeNull()
  })

  it('rejects client-forged identity when production test identity is disabled', () => {
    const identity = __private__.resolveTrustedIdentity(
      {
        identity: {
          openid: 'forged-openid',
          appid: 'wxa63c53796488d4d4',
          roles: ['customer'],
        },
      },
      null,
      false,
    )

    expect(identity).toBeNull()
  })

  it('prefers verified runtime identity over local test identity', () => {
    const identity = __private__.resolveTrustedIdentity(
      {
        identity: {
          openid: 'forged-openid',
          appid: 'wxa63c53796488d4d4',
          roles: ['customer'],
        },
      },
      {
        openid: 'runtime-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['customer'],
      },
      true,
    )

    expect(identity).toEqual({
      openid: 'runtime-openid',
      appid: 'wxa63c53796488d4d4',
      roles: ['customer'],
    })
  })

  it('does not pass client-forged identity through the production entrypoint', async () => {
    process.env.MALL_API_LOCAL_MEMORY = '1'
    delete process.env.MALL_API_ALLOW_TEST_IDENTITY

    const result = await api.main({
      action: 'getCurrentCustomer',
      identity: {
        openid: 'forged-openid',
        appid: 'wxa63c53796488d4d4',
        roles: ['customer'],
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
  })

  it('does not pass client-forged adminSession through the production entrypoint', async () => {
    process.env.MALL_API_LOCAL_MEMORY = '1'
    delete process.env.MALL_API_ALLOW_TEST_IDENTITY

    const result = await api.main({
      action: 'getOwnerDashboardSnapshot',
      adminSession: {
        account: 'forged-admin',
        role: 'creator',
        permissions: ['workbenchAccess', 'accountManagement', 'permissionManagement', 'productManagement'],
      },
    })

    expect(result).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    })
  })
})
