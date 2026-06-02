# Phase 6 Checkout Auth Review

Date: 2026-06-01
Status: CONDITIONAL PASS - reviewer blockers fixed; manual real-device order acceptance is still required.

## Review Scope

Read-only review of the Phase 5 checkout auth/order repair:

- `src/pages/customer/product-detail/index.vue`
- `src/pages/customer/product-detail/index.test.ts`
- `src/features/cloudbase-mall/customer-product-detail.ts`
- `src/features/cloudbase-mall/cloudbase-mall.test.ts`
- `src/services/auth/cloudbase-wechat-auth-service.ts`
- `cloudfunctions/mallApi/index.js`
- `cloudfunctions/mallApi/mall-api-core.js`
- `docs/audits/real-device-acceptance-round-2/04-checkout-auth-diagnosis.md`
- `docs/plans/real-device-acceptance-round-2/05-checkout-auth-fix-delivery-log.md`

Unrelated dirty worktree files and the earlier image repair were not used as checkout PASS criteria.

## Initial Reviewer Result

The `prd_reviewer` result was `STATUS: NEEDS_FIX`.

Findings:

1. Missing required facade test proving canceled/no-code phone authorization does not call `createCustomerOrder`.
2. Missing required facade test proving phone-bound sessions order directly without requesting another phone code.

The reviewer did not block on the core implementation path. The reviewer confirmed:

- Browsing still loads product detail without auth.
- Unbound checkout uses native `open-type="getPhoneNumber"`.
- Page order flow stays behind the facade/auth service.
- Backend strips client identity at entry.
- WeChat orders use backend-resolved customer phone data instead of frontend phone/customer identity.

## Fixes After Review

- `src/features/cloudbase-mall/customer-product-detail.ts`
  - Added an explicit no-code guard before `authorizePhoneNumber`.
  - Trims the native authorization code before passing it to the auth service.
- `src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - Added `cancels checkout without creating an order when native phone authorization returns no code`.
  - Added `submits customer orders directly for phone-bound sessions without requesting another phone code`.
  - Updated the legacy mock WeChat success case to provide explicit phone authorization input under the stricter facade contract.

## Evidence

- Native phone CTA:
  - `src/pages/customer/product-detail/index.vue:158`
  - `open-type="getPhoneNumber"`
  - `@getphonenumber="submitOrderWithPhoneAuthorization"`
- Phone-bound direct CTA:
  - `src/pages/customer/product-detail/index.vue:149`
  - `v-if="hasBoundCustomerPhone"`
  - `@tap="submitBoundOrder"`
- Page passes the native phone code through the facade:
  - `src/pages/customer/product-detail/index.vue:395`
  - `requestPhoneNumber: () => Promise.resolve(phoneCode ?? null)`
- Facade no-code cancel guard:
  - `src/features/cloudbase-mall/customer-product-detail.ts:120`
  - no code returns `canceled` before phone binding or order creation.
- Facade order creation remains after phone-bound session proof:
  - `src/features/cloudbase-mall/customer-product-detail.ts:132`
  - `src/features/cloudbase-mall/customer-product-detail.ts:136`
- No-code test:
  - `src/features/cloudbase-mall/cloudbase-mall.test.ts:860`
  - asserts `authorizePhoneNumber` and `createCustomerOrder` are not called.
- Phone-bound direct test:
  - `src/features/cloudbase-mall/cloudbase-mall.test.ts:895`
  - asserts `login`, `requestPhoneNumber`, and `authorizePhoneNumber` are not called before order creation.

## Verification

- `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-detail/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts cloudfunctions/mallApi/mall-api-core.test.js`
  - Result: 4 files / 117 tests passed.
- `pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/product-image-audit.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts cloudfunctions/mallApi/mall-api-core.test.js`
  - Result: 8 files / 151 tests passed.
- `pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - Result: 1 file / 32 tests passed.
- `pnpm.cmd run type-check`
  - Result: passed.
- `pnpm.cmd run lint`
  - Result: passed.
- `pnpm.cmd run build:mp-weixin`
  - Result: passed.

## Remaining Acceptance Gap

This is not a real-device PASS. Manual WeChat DevTools or real-device validation must still prove:

- Product browsing does not force login.
- Unbound checkout shows only the native WeChat phone authorization prompt.
- Canceling native phone authorization creates no order.
- Accepting native phone authorization creates an order.
- Merchant order confirmation can see the created order.
- Phone-bound repeat checkout orders directly without another phone prompt.

## Verdict

CONDITIONAL PASS for Phase 6 automated/reviewer criteria after the two reviewer blockers were fixed.

Do not mark Round 2 acceptance PASS until the manual real-device checkout evidence is captured.
