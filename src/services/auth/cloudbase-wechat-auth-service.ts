import { nowIso } from '../../domain/shared/ids'
import type { CloudBaseMallApiClient } from '../cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../cloudbase/runtime-mall-api-client'
import type { CustomerSession } from './customer-session'
import type { WechatAuthService } from './wechat-auth-service'

const toSession = (customer: {
  id: string
  openid: string
  phoneNumber?: string
  createdAt: string
  updatedAt: string
}): CustomerSession => ({
  customerId: customer.id,
  openid: customer.openid,
  phoneNumber: customer.phoneNumber,
  nickname: '微信用户',
  authSource: 'wechat',
  loggedInAt: customer.createdAt || nowIso(),
  phoneAuthorizedAt: customer.phoneNumber ? customer.updatedAt : undefined,
})

export const createCloudBaseWechatAuthService = (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): WechatAuthService => {
  let currentSession: CustomerSession | null = null

  return {
    getCurrentSession() {
      return currentSession ? { ...currentSession } : null
    },
    async login() {
      const { customer } = await client.getCurrentCustomer()
      currentSession = toSession(customer)
      return { ...currentSession }
    },
    async authorizePhoneNumber(phoneCode?: string) {
      if (!currentSession) {
        return null
      }
      if (!phoneCode) {
        return null
      }
      const { customer } = await client.bindCustomerPhone({ phoneCode })
      currentSession = toSession(customer)
      return { ...currentSession }
    },
    logout() {
      currentSession = null
    },
  }
}
