import type { CustomerSession } from './customer-session'

export interface WechatAuthService {
  getCurrentSession(): CustomerSession | null
  login(): Promise<CustomerSession>
  authorizePhoneNumber(): Promise<CustomerSession | null>
  logout(): void
}
