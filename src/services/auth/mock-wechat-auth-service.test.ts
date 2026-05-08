import { describe, expect, it } from 'vitest'
import { mockWechatAuthService } from './mock-wechat-auth-service'

describe('mockWechatAuthService', () => {
  it('returns null before a customer logs in', () => {
    mockWechatAuthService.logout()

    expect(mockWechatAuthService.getCurrentSession()).toBeNull()
  })

  it('creates a mock WeChat session after login', async () => {
    mockWechatAuthService.logout()

    const session = await mockWechatAuthService.login()

    expect(session).toMatchObject({
      customerId: 'mock-customer-001',
      openid: 'mock-openid-001',
      nickname: '微信用户',
      authSource: 'mock_wechat',
    })
    expect(session.loggedInAt).toEqual(expect.any(String))
    expect(mockWechatAuthService.getCurrentSession()).toEqual(session)
  })

  it('adds a phone number to the current session after authorization', async () => {
    mockWechatAuthService.logout()
    await mockWechatAuthService.login()

    const session = await mockWechatAuthService.authorizePhoneNumber()

    expect(session?.phoneNumber).toBe('13800000000')
    expect(session?.phoneAuthorizedAt).toEqual(expect.any(String))
    expect(mockWechatAuthService.getCurrentSession()).toEqual(session)
  })

  it('does not authorize a phone number without a login session', async () => {
    mockWechatAuthService.logout()

    await expect(mockWechatAuthService.authorizePhoneNumber()).resolves.toBeNull()
    expect(mockWechatAuthService.getCurrentSession()).toBeNull()
  })
})
