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

  it('builds a WeChat subscription-message payload without hardcoded template or manager identity', () => {
    const payload = __private__.createOrderNotificationPayload({
      templateId: 'runtime-template-id',
      managerOpenid: 'manager-runtime-openid',
      order: {
        id: 'order-1',
        totalAmount: 129,
        createdAt: '2026-06-04T09:00:00.000Z',
        items: [{ productName: 'Cotton Shirt' }],
      },
    })

    expect(payload).toMatchObject({
      touser: 'manager-runtime-openid',
      template_id: 'runtime-template-id',
      page: 'pages/owner/orders/index',
      data: {
        thing1: { value: 'Cotton Shirt' },
        amount2: { value: '129.00元' },
        phrase3: { value: '待确认' },
        time4: { value: '2026-06-04 09:00' },
        thing5: { value: 'order-1' },
      },
    })
  })

  it('sends order notifications through the WeChat subscribe-message endpoint', async () => {
    const calls = []

    await expect(__private__.sendWechatOrderNotification({
      templateId: 'runtime-template-id',
      managerOpenid: 'manager-runtime-openid',
      order: {
        id: 'order-1',
        totalAmount: 129,
        createdAt: '2026-06-04T09:00:00.000Z',
        items: [{ productName: 'Cotton Shirt' }],
      },
    }, {
      getWechatAccessToken: async () => 'runtime-access-token',
      requestJson: async (url, options) => {
        calls.push({ url, options })
        return { errcode: 0 }
      },
    })).resolves.toEqual({ errcode: 0 })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=runtime-access-token',
    )
    expect(JSON.parse(calls[0].options.body)).toMatchObject({
      touser: 'manager-runtime-openid',
      template_id: 'runtime-template-id',
    })
    expect(__private__.createRuntimeHandlerOptions().sendOrderNotification).toBe(__private__.sendWechatOrderNotification)
  })

  it('surfaces WeChat subscribe-message API failures for core logging', async () => {
    await expect(__private__.sendWechatOrderNotification({
      templateId: 'runtime-template-id',
      managerOpenid: 'manager-runtime-openid',
      order: {
        id: 'order-1',
        totalAmount: 129,
        createdAt: '2026-06-04T09:00:00.000Z',
        items: [{ productName: 'Cotton Shirt' }],
      },
    }, {
      getWechatAccessToken: async () => 'runtime-access-token',
      requestJson: async () => ({ errcode: 43101, errmsg: 'user refuse to accept the msg' }),
    })).rejects.toThrow('Wechat order notification failed: 43101 user refuse to accept the msg')
  })
})
