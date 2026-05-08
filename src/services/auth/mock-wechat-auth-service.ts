import { nowIso } from '../../domain/shared/ids'
import type { CustomerSession } from './customer-session'
import type { WechatAuthService } from './wechat-auth-service'

let currentSession: CustomerSession | null = null

const copySession = (session: CustomerSession): CustomerSession => ({ ...session })

export const mockWechatAuthService: WechatAuthService = {
  getCurrentSession() {
    return currentSession ? copySession(currentSession) : null
  },
  async login() {
    currentSession = {
      customerId: 'mock-customer-001',
      openid: 'mock-openid-001',
      nickname: '微信用户',
      authSource: 'mock_wechat',
      loggedInAt: nowIso(),
    }

    return copySession(currentSession)
  },
  async authorizePhoneNumber() {
    if (!currentSession) {
      return null
    }

    currentSession = {
      ...currentSession,
      phoneNumber: '13800000000',
      phoneAuthorizedAt: nowIso(),
    }

    return copySession(currentSession)
  },
  logout() {
    currentSession = null
  },
}
