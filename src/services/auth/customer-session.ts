export type CustomerAuthSource = 'mock_wechat' | 'wechat'

export type CustomerSession = {
  customerId: string
  openid: string
  phoneNumber?: string
  nickname?: string
  authSource: CustomerAuthSource
  loggedInAt: string
  phoneAuthorizedAt?: string
}
