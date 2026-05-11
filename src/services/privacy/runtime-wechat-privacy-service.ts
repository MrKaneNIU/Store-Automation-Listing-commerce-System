import type { WechatPrivacyService } from './wechat-privacy-service'

type WxPrivacyRuntime = {
  getPrivacySetting?: (options: {
    success: (result: { needAuthorization: boolean }) => void
    fail: () => void
  }) => void
  requirePrivacyAuthorize?: (options: {
    success: () => void
    fail: () => void
  }) => void
  openPrivacyContract?: (options?: {
    fail?: () => void
  }) => void
}
declare const wx: WxPrivacyRuntime | undefined

const callPrivacySetting = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof wx === 'undefined' || !wx.getPrivacySetting) {
      resolve(false)
      return
    }

    wx.getPrivacySetting({
      success: (result) => resolve(result.needAuthorization),
      fail: () => resolve(true),
    })
  })

const requirePrivacyAuthorize = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof wx === 'undefined' || !wx.requirePrivacyAuthorize) {
      resolve(false)
      return
    }

    wx.requirePrivacyAuthorize({
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })

export const runtimeWechatPrivacyService: WechatPrivacyService = {
  async ensurePrivacyAuthorized() {
    const needAuthorization = await callPrivacySetting()
    if (!needAuthorization) return true

    return requirePrivacyAuthorize()
  },
  async openPrivacyContract() {
    if (typeof wx !== 'undefined' && wx.openPrivacyContract) {
      wx.openPrivacyContract()
    }
  },
}
