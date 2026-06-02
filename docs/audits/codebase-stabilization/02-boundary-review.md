# Boundary Review

Captured: 2026-06-02
Role: Reviewer
PRD phase: 2
Scope: architecture boundary audit only

## Result

Status: FIXED_PENDING_DEPLOYMENT_AND_REVIEW

Phase 2 found a P0 trusted-boundary violation in checkout/order creation. The user then instructed Codex to execute the full PRD, so the minimal approved stabilization fix was applied after the review finding.

Fix evidence:

- `cloudfunctions/mallApi/mall-api-core.js#createCustomerOrder` now rejects non-`wechat` order sessions unless an explicit test-only `allowMockCustomerOrder` option is enabled.
- The default production handler does not set `allowMockCustomerOrder`.
- Test-only helpers that still need mock order fixtures opt in with `allowMockCustomerOrder: true`.
- The production-role ledger test now binds the customer phone through a backend WeChat phone-code exchange and creates the order with `authSource: 'wechat'`.
- Added test: `cloudfunctions/mallApi/mall-api-core.test.js` `rejects mock customer order sessions in the default production handler`.
- Verification: `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js` passed with 70/70 tests.

## P0 Blocker

### `mallApi.createCustomerOrder` still allows frontend `mock_wechat` session data into order creation

Failed checks:

- `cloudfunctions/mallApi` must remain the trusted backend boundary for customer-private data and merchant operations.
- Customer identity must not trust frontend `openid`, `customerId`, or `phoneNumber`.
- Checkout must still go through a backend-verified customer.

Evidence:

- `cloudfunctions/mallApi/mall-api-core.js` `parseCustomerOrderInput` accepts `session.authSource` as `mock_wechat` or `wechat`, and reads frontend `session.customerId`, `session.nickname`, and `session.phoneNumber`.
- `cloudfunctions/mallApi/mall-api-core.js` `createCustomerOrder` resolves the backend customer only when `input.session.authSource === 'wechat'`.
- When `customer` is null, `createCustomerOrder` uses frontend `input.session.phoneNumber`.
- When `customer` is null, the saved order uses frontend `input.session.customerId`.
- The same handler then decrements SKU stock and writes an inventory ledger entry.
- `cloudfunctions/mallApi/mall-api-core.test.js` still contains a successful order/idempotency path using `authSource: 'mock_wechat'`, frontend `customerId`, and frontend `phoneNumber`.
- `src/features/cloudbase-mall/customer-product-detail.ts` still defaults `authService` to `mockWechatAuthService` if no auth service is injected.

Risk:

- A client can forge `authSource: 'mock_wechat'`, `customerId`, and `phoneNumber` to create orders and reserve inventory.
- This affects order ownership, customer-private order data, inventory reservation, and real-device acceptance credibility.
- This is not a UI-only issue; it is a backend trusted-boundary break.

Minimal fix suggestion:

1. In `cloudfunctions/mallApi/mall-api-core.js#createCustomerOrder`, reject `input.session.authSource !== 'wechat'` for the default production handler.
2. Always call `resolveWechatCustomerForOrder(event, context)` before order creation.
3. Only use backend-derived `customer.id` and backend-bound `customer.phoneNumber` in the saved order.
4. Remove fallback order writes from `input.session.customerId` and `input.session.phoneNumber`.
5. Update tests so `mock_wechat` order creation is rejected in the default handler.
6. If a mock order path is still needed for isolated tests, it must be guarded by an explicit test-only handler option and must not be part of the deployed `mallApi` contract.
7. In `src/features/cloudbase-mall/customer-product-detail.ts`, remove the production default fallback to `mockWechatAuthService` or restrict it to test-only injection so accidental omission cannot create a mock session for CloudBase checkout.

PRD action: wait for user approval before implementing this P0 fix.

## Required Boundary Checks

### 1. Pages direct imports

Search target: `src/pages/**/*.vue`, `src/pages/**/*.ts`

Findings:

- No direct page import of repository implementations, `mockDb`, low-level database handles, `wx.cloud`, CloudBase SDK adapter, mock OCR, or mock upload was found.
- Customer and owner pages call feature/facade/page-state seams such as:
  - `features/cloudbase-mall/customer-product-detail`
  - `features/cloudbase-mall/customer-favorites`
  - `features/cloudbase-mall/customer-shopping-bag`
  - `features/cloudbase-mall/owner-products`
  - page-state wrappers under page directories
- `src/pages/customer/product-detail/index.vue` imports `createCloudBaseWechatAuthService` directly. This is an auth service seam, not a repository/CloudBase collection write, but it remains part of the checkout risk because the facade currently defaults to mock auth if omitted.

Risk level: P2 for page auth-service coupling; P0 is the backend trust fallback above.

### 2. Pages self-handling business rules

Search target: page files for inventory, order status, draft confirmation, publish, identity generation, upload URL generation, and CloudBase fileID/temp URL conversion.

Findings:

- Pages and page-state files hold UI state, navigation locks, selected SKU, request dedupe/cache timers, retry state, and form drafts.
- No page-level stock decrement, order status transition, draft confirmation, product publish rule, CloudBase fileID/temp URL conversion, or upload URL generation was found.
- Page-state files invoke feature/facade commands for shopping bag, favorites, Mine, checkout, owner products, and account management.

Risk level: P2. Page-state files are growing, but they still route business writes through feature/facade functions.

### 3. Domain imports

Search target: `src/domain/**/*.ts`

Findings:

- No import from pages, services, features, `uni`, `wx`, or `@dcloudio` was found.

Risk level: P3.

### 4. Features bypassing service/repository ports

Search target: `src/features/**/*.ts`

Findings:

- The existing `src/features/mall-workflow/mall-access.ts` and `src/features/mall-workflow/mall-workflow.ts` import `mallRepository` from `src/services/repositories/mall-repository`. This is an established MVP seam, not newly introduced direct page access.
- No feature use of `wx.cloud`, `uni.cloud`, raw CloudBase SDK, direct `collection()`, `getTempFileURL`, `uploadFile`, or `deleteFile` was found outside tests.
- CloudBase-facing feature files use `src/services/cloudbase/mall-api-client.ts` and runtime client seams.

Risk level: P2. The older `mallWorkflow -> mallRepository` dependency remains a layering debt but not a new P0/P1 regression for this stabilization pass.

### 5. Services mixing page state or UI copy

Search target: `src/services/**/*.ts`

Findings:

- `src/services/storage/product-image-url.ts` defines `ProductImageViewModel` and fallback display copy such as `商品图片`, `未上传商品图片`, and `图片链接已过期，请刷新图片链接`.
- This service is doing both URL resolution and page-facing display shaping.

Risk level: P2. It is not blocking manual acceptance, but it should be moved behind a feature/facade ViewModel after acceptance so service remains an IO/adapter layer.

### 6. `mallApi` trusted boundary

Findings:

- `cloudfunctions/mallApi/index.js` now strips client `event.identity` unless runtime identity exists or `MALL_API_ALLOW_TEST_IDENTITY === '1'`.
- `requireAdminOrResolvedAnyRole` still gates merchant operations.
- Customer private snapshot actions resolve customer identity server-side.
- Blocking exception: `createCustomerOrder` still accepts frontend mock session values in the default handler, documented as P0 above.

Risk level: P1 until deployed and re-reviewed. The local P0 code path has been fixed; deployment and full verification are still required.

### 7. Customer identity trust

Findings:

- Mine, favorites, and shopping-bag private actions resolve customer identity through backend identity helpers.
- `createCustomerOrder` remains the exception because it accepts frontend `mock_wechat` values for non-`wechat` sessions.

Risk level: P1 until deployed and re-reviewed. The local P0 code path has been fixed; deployment and full verification are still required.

### 8. Image chain

Findings:

- Pages consume image fields and render fallback/retry state.
- CloudBase temp URL refresh is encapsulated in `src/services/storage/product-image-url.ts` plus upload-service seam.
- No page direct `wx.cloud.getTempFileURL`, `uploadFile`, or `deleteFile` was found.

Risk level: P2 due to service-level ViewModel/copy mixing; no direct page CloudBase violation found.

### 9. Product edit path

Findings:

- Owner product page calls `useOwnerProductsPageState`.
- Page state calls `features/cloudbase-mall/owner-products`.
- CloudBase feature calls `CloudBaseMallApiClient`, including `updateProductBasics`.
- Backend `mallApi` gates product updates through `requireAdminOrResolvedAnyRole`.
- `productCode` is shown as readonly in owner product edit UI.

Risk level: P2. `mall-api-core.js` is large and split-needed, but the product edit path uses the intended facade/API seam.

### 10. Checkout path

Findings:

- Customer product detail page uses native `open-type="getPhoneNumber"` and calls the CloudBase checkout facade.
- The CloudBase checkout facade calls `createCustomerOrder`.
- Backend `createCustomerOrder` currently does not always require backend-verified WeChat customer identity, as documented in the P0 blocker.

Risk level: P1 until deployed and re-reviewed. The local P0 code path has been fixed; deployment and full verification are still required.

## Summary

- Domain direction remains clean.
- Page direct repository/CloudBase collection writes were not found.
- Most customer-private modules now use backend snapshot/facade seams.
- The P0 checkout trusted-boundary issue has a local minimal fix and targeted test coverage.
- The current release cannot proceed to manual acceptance with full confidence until the fix is deployed and the full verification ladder passes again.
