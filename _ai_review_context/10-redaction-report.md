# Redaction Report

## Excluded Paths / File Classes

- .env and .env.* real env files (if present)
- node_modules/
- dist/
- build/
- coverage/
- .git/
- miniprogram_npm/
- _ai_review_context/ when scanning source
- binary/image/video/archive/cache/log files from source tree
- .agents/ and .codex/ were excluded from sensitive-variable scan to avoid skill/config noise
- pnpm-lock.yaml was summarized in 02 but excluded from sensitive-variable scan

## Redaction Rules Applied

- Phone-like mainland China mobile numbers -> [REDACTED_PHONE]
- openid-like values -> [REDACTED_OPENID]
- CloudBase environment-like identifiers -> [REDACTED_CLOUDBASE_ENV]
- obvious secret/token/password/key assignment values -> [REDACTED_SECRET]
- large asset/binary/generated directories excluded from tree and scans

## Suspected Sensitive Variables Found

- src/domain/order/rules.ts: customerPhone
- src/domain/order/types.ts: customerPhone
- src/features/admin-workbench-auth/admin-workbench-auth.ts: AdminWorkbenchPasswordChangeResult, INITIAL_PASSWORD, passwordByAccount, resetAdminWorkbenchPasswordsForTests, getPasswordForAccount, password, changeAdminWorkbenchPassword, oldPassword, newPassword, confirmPassword, nextPassword
- src/features/cloudbase-mall/customer-product-detail.ts: confirmPhoneAuthorization, shouldAuthorizePhone, phoneNumber
- src/features/customer-mine/customer-mine.ts: identityOpenidLabel, phoneLabel, phoneDisplayText, openidMasked, phone, maskedPhoneNumber, normalizePhoneStatusLabel
- src/features/customer-order/customer-order.ts: confirmPhoneAuthorization, shouldAuthorizePhone, phoneNumber
- src/features/customer-product-detail/customer-product-detail.ts: confirmPhoneAuthorization
- src/features/mall-workflow/mall-workflow.ts: customerPhone
- src/pages/customer/product-detail/index.vue: getphonenumber, PhoneCodeRequest, PhoneNumberAuthorizationEvent, phoneCodeRequest, requestPhoneCode, resolvePhoneCode, handlePhoneNumberAuthorization, confirmPhoneAuthorization, requestPhoneNumber
- src/pages/login/index.vue: password
- src/pages/owner/account-management/index.vue: passwordAccountId, oldPassword, newPassword, confirmPassword, clearPasswordFields, submitPasswordChange
- src/services/auth/cloudbase-wechat-auth-service.ts: openid, phoneNumber, phoneAuthorizedAt
- src/services/auth/customer-session.ts: openid
- src/services/auth/mock-wechat-auth-service.ts: openid, phoneNumber, phoneAuthorizedAt
- src/services/cloudbase/mall-api-client.ts: openid, BindCustomerPhoneInput, phoneCode, openidMasked, phone, maskedPhoneNumber, bindCustomerPhone
- src/services/ocr/tencentcloud-ocr-provider.ts: secretId, secretKey
- src/services/repositories/mall-repository-contract.ts: customerPhone
- backend/README.md: DATABASE_URL
- backend/src/api/handlers/mall-api.ts: customerPhone
- backend/src/api/schemas.ts: phoneNumber
- backend/src/cloudbase/cloudbase-mall-repository.ts: customerPhone, customer_phone
- backend/src/repositories/database-mall-repository.ts: customerPhone, customer_phone
- cloudfunctions/mallApi/index.js: openid, cachedAccessToken, secret, getWechatAccessToken, exchangePhoneCode, accessToken, access_token, phoneNumber, __private__
- cloudfunctions/mallApi/mall-api-core.js: phoneNumber, parseBindCustomerPhoneInput, phoneCode, openid, resolvePhoneNumberFromCode, exchangePhoneCode, customer_phone, customerPhone, phone_number, operator_openid, target_openid, maskOpenid, maskPhoneNumber, openidMasked, phone, maskedPhoneNumber
- cloudfunctions/mallApi/tencentcloud-ocr-provider.js: secretId, secretKey
- docs/contracts/cloudbase-data-model.md: secrets
- docs/contracts/page-facing-ui-contracts.md: openidMasked, phone, maskedPhoneNumber
- docs/operations/backup-restore.md: DATABASE_URL
- docs/plans/2026-05-11-phase-4-wechat-auth-role-permission-log.md: openid
- docs/prd/2026-05-08-customer-wechat-auth-order-prd.md: openid, customerPhone, phoneNumber, phoneAuthorizedAt
- docs/prd/2026-06-01-customer-wechat-auth-mine-persistence-prd.md: openid
- scripts/check-production-config.test.mjs: WECHAT_APPSECRET, OCR_TENCENT_SECRET_ID, OCR_TENCENT_SECRET_KEY
- scripts/cloudbase-bind-owner.mjs: ownerOpenid, openid, target_openid
- .ai/CUSTOMER_MINE_MODULE_A_CONTRACT.md: openidMasked, phone, maskedPhoneNumber
- .playwright-mcp/page-2026-05-19T03-01-41-380Z.yml: token
- .playwright-mcp/page-2026-05-19T03-02-08-048Z.yml: token
- .playwright-mcp/page-2026-05-19T03-02-30-125Z.yml: token
- .playwright-mcp/page-2026-05-19T03-02-55-445Z.yml: token
- .playwright-mcp/page-2026-05-19T03-03-36-976Z.yml: token

## Real Phone/Openid/Customer Data Scan

- Phone/openid-like literal values were redacted if copied into reports.
- Files with variable names involving phone/openid/customer are listed above where matched.
- No sensitive values are reproduced in this report.

## Logs With Personal Information

- Command logs were generated from package scripts and version/status commands only.
- No PII values were intentionally copied; log files remain subject to local-only review if auditors need to inspect raw output.