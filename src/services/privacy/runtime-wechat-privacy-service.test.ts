import { describe, expect, it } from 'vitest'

import { runtimeWechatPrivacyService } from './runtime-wechat-privacy-service'
import type { WechatPrivacyService } from './wechat-privacy-service'

declare global {
  var wx: {
    getPrivacySetting?: (options: {
      success: (result: { needAuthorization: boolean }) => void
      fail: () => void
    }) => void
    requirePrivacyAuthorize?: (options: {
      success: () => void
      fail: () => void
    }) => void
    openPrivacyContract?: () => void
  } | undefined
}

const createCheckoutGate = async (privacyService: WechatPrivacyService, requestPhoneNumber: () => Promise<string | null>) => {
  const allowed = await privacyService.ensurePrivacyAuthorized()
  if (!allowed) return null
  return requestPhoneNumber()
}

describe('WeChat privacy authorization boundary', () => {
  it('does not call phone authorization when privacy authorization is refused', async () => {
    let requestedPhone = false
    const result = await createCheckoutGate(
      {
        ensurePrivacyAuthorized: async () => false,
        openPrivacyContract: async () => undefined,
      },
      async () => {
        requestedPhone = true
        return 'phone-code-ok'
      },
    )

    expect(result).toBeNull()
    expect(requestedPhone).toBe(false)
  })

  it('allows the phone code request after privacy authorization passes', async () => {
    const result = await createCheckoutGate(
      {
        ensurePrivacyAuthorized: async () => true,
        openPrivacyContract: async () => undefined,
      },
      async () => 'phone-code-ok',
    )

    expect(result).toBe('phone-code-ok')
  })

  it('returns true when the runtime says no privacy authorization is needed', async () => {
    globalThis.wx = {
      getPrivacySetting: ({ success }) => success({ needAuthorization: false }),
    }

    await expect(runtimeWechatPrivacyService.ensurePrivacyAuthorized()).resolves.toBe(true)
    globalThis.wx = undefined
  })

  it('requires privacy authorization when the runtime reports it is needed', async () => {
    globalThis.wx = {
      getPrivacySetting: ({ success }) => success({ needAuthorization: true }),
      requirePrivacyAuthorize: ({ success }) => success(),
    }

    await expect(runtimeWechatPrivacyService.ensurePrivacyAuthorized()).resolves.toBe(true)
    globalThis.wx = undefined
  })

  it('opens the WeChat privacy contract when the runtime supports it', async () => {
    let opened = false
    globalThis.wx = {
      openPrivacyContract: () => {
        opened = true
      },
    }

    await runtimeWechatPrivacyService.openPrivacyContract()

    expect(opened).toBe(true)
    globalThis.wx = undefined
  })
})
