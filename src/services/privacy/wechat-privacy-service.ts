export type WechatPrivacyService = {
  ensurePrivacyAuthorized(): Promise<boolean>
  openPrivacyContract(): Promise<void>
}
