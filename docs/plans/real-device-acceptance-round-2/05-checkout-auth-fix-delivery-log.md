# Phase 5 Checkout Auth Fix Delivery Log

Date: 2026-06-01
Status: CONDITIONAL PASS - automated checkout auth repair is implemented; real-device order acceptance is still required.

## Scope

Implemented the P0-1 checkout authorization repair only. Product edit, payment, logistics, refund, OCR, and manual real-device acceptance remain outside this phase.

## Files Changed

- `src/pages/customer/product-detail/index.vue`
  - Removed the custom checkout auth modal and custom phone-code modal.
  - Changed the unbound checkout CTA to a native `open-type="getPhoneNumber"` button.
  - Added a phone-bound direct checkout CTA that only appears after the local customer session has a phone number.
  - Kept browsing unauthenticated and kept order creation behind the existing CloudBase facade.
- `src/pages/customer/product-detail/index.test.ts`
  - Added source-contract coverage for the native phone authorization button, phone-bound direct order path, and absence of the old custom prompt chain.
- `src/features/cloudbase-mall/customer-product-detail.ts`
  - Removed required `confirmLogin` / `confirmPhoneAuthorization` callbacks from the order facade.
  - On order attempt, obtains the current backend customer session through `authService.login()` when needed.
  - Requires a phone-bound session before calling `createCustomerOrder`.
  - Returns `canceled` before phone binding or order creation when native phone authorization returns no code.
  - Skips repeat phone authorization when the current session is already phone-bound.
  - Uses the existing CloudBase failure formatter for order errors.

## Preserved Contracts

- Customer product browsing does not require login.
- The page does not write directly to CloudBase collections or repositories.
- Phone-code exchange remains in backend/auth service flow, not in the page.
- WeChat order creation still depends on backend-resolved customer identity and backend-bound phone data.
- Existing shopping-bag and favorites flows are not rerouted through checkout.

## Automated Evidence

- Checkout/image combined targeted tests:
  - `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-detail/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts cloudfunctions/mallApi/mall-api-core.test.js`
  - Result: 4 files / 117 tests passed.
- Phase 2 and Phase 5 broader targeted tests:
  - `pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/product-image-audit.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts cloudfunctions/mallApi/mall-api-core.test.js`
  - Result: 8 files / 151 tests passed.
- Reviewer blocker fix check:
  - `pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - Result: 1 file / 32 tests passed.
- Static source check:
  - `Select-String -Path src/pages/customer/product-detail/index.vue -Pattern 'authPrompt|phoneCodeRequest|confirmLogin|confirmPhoneAuthorization|handlePhoneNumberAuthorization|confirmModal|requestPhoneCode|resolvePhoneCode|submitOrderWithPhoneAuthorization|hasBoundCustomerPhone'`
  - Result: only the new `submitOrderWithPhoneAuthorization` and `hasBoundCustomerPhone` references remain.
- Type check:
  - `pnpm.cmd run type-check`
  - Result: passed.
- Lint:
  - `pnpm.cmd run lint`
  - Result: passed.
- Mini-program build:
  - `pnpm.cmd run build:mp-weixin`
  - Result: passed.

## Reviewer Feedback Addressed

Phase 6 reviewer initially failed this phase on missing required facade tests, not on the main implementation path:

- Added proof that native phone authorization returning no code cancels checkout before `authorizePhoneNumber` and before `createCustomerOrder`.
- Added proof that a phone-bound current session orders directly without calling `login`, `requestPhoneNumber`, or `authorizePhoneNumber`.

## Remaining Acceptance Gap

This phase cannot be marked real-device PASS until WeChat DevTools or a real device confirms:

- Product browsing still opens without forcing login.
- Tapping checkout shows only the native WeChat phone authorization prompt for an unbound customer.
- Canceling phone authorization does not create an order.
- Accepting phone authorization creates the order.
- Merchant order confirmation can see the created order.
- A phone-bound repeat order uses the direct order CTA without asking for another phone code.

## Recommendation

Proceed to Phase 6 reviewer for checkout auth/order changes. Keep the overall Round 2 status at CONDITIONAL PASS until manual real-device evidence is captured.
