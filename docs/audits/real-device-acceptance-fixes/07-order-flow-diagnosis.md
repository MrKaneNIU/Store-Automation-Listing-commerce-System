# Real Device Acceptance Failure - Phase 7 Order Flow Diagnosis

Captured: 2026-06-01 17:45:33 +08:00

Agent phase: `agents.prd_debugger.toml`

Status: `DIAGNOSED`

Overall real-device acceptance status remains: `FAIL`.

## Failure Area

Phase 0 P0 failure:

- Customer product detail can show product and SKU, but order creation does not succeed on real device.

## Evidence

Frontend order flow:

- `src/pages/customer/product-detail/index.vue`
  - browsing product detail does not require login.
  - `submitOrder()` calls `submitCloudBaseCustomerProductDetailOrder()`.
  - `requestPhoneNumber` is wired to a modal button with `open-type="getPhoneNumber"`.
  - canceling the phone modal resolves `null`.
- `dist/build/mp-weixin/pages/customer/product-detail/index.wxml`
  - compiled artifact contains `open-type="getPhoneNumber"` and `bindgetphonenumber`.

Feature/facade order flow:

- `src/features/cloudbase-mall/customer-product-detail.ts`
  - loads product detail and selected SKU.
  - blocks unavailable or out-of-stock SKU before auth.
  - logs in only after user confirms checkout.
  - requests phone authorization only when the session has no phone number.
  - creates the order only after `session.phoneNumber` exists.

Backend order contract:

- `cloudfunctions/mallApi/mall-api-core.js`
  - `createCustomerOrder` parses product/SKU/quantity/session input.
  - for `authSource: 'wechat'`, it resolves the backend verified identity and customer document.
  - it uses the backend customer document phone number, not the client session phone number.
  - if the backend customer has no phone number, it returns `UNAUTHORIZED`.

Runtime entrypoint:

- `cloudfunctions/mallApi/index.js`
  - production strips client-forged `event.identity`.
  - `MALL_API_ALLOW_TEST_IDENTITY=0` in the deployed `mallApi`.
  - trusted identity must come from CloudBase runtime context.
  - local code and deployed `CodeInfo` both include `getCloudbaseContext` / `getWXContext` identity normalization.

CloudBase state:

- `mallApi` is `Active` / `Available`.
- deployed `mallApi` has WeChat app ID and app secret variables configured.
- secrets are intentionally not copied into this report.

## Root Cause Conclusion

The primary proven failure class is backend runtime identity / real WeChat authorization, not SKU selection or a missing frontend phone-code bridge.

The frontend already passes the WeChat phone code bridge into checkout. The backend intentionally refuses to trust frontend `openid`, `customerId`, or `phoneNumber`. Therefore, if real-device checkout still fails with `UNAUTHORIZED: Verified WeChat identity is required`, either:

1. the CloudBase runtime is not resolving a verified mini-program identity for the call, or
2. phone binding failed before `createCustomerOrder`, or
3. the UI is surfacing a generic/raw authorization message that makes the real step unclear.

Do not fix this by trusting frontend identity or phone fields.

## SKU State

The order feature blocks only when no selected SKU exists or the selected SKU is disabled. Product detail tests already cover sold-out selection remaining visible while checkout stays blocked.

The real screenshot note that the selected spec can show `请选择` while a SKU chip is visible still needs manual WeChat confirmation after the current build is imported. Local source does not show a direct SKU default-selection bug; the user must tap a SKU before checkout can proceed.

## Missing Automated Coverage

Existing tests covered a mock-WeChat success path but did not explicitly prove the real `authSource: 'wechat'` success path:

- login returns a backend verified customer without phone.
- `requestPhoneNumber` returns the WeChat one-time phone code.
- `authorizePhoneNumber` binds the phone and returns a phone-bound session.
- `createCustomerOrder` is called only after the phone-bound session exists.

Existing error handling also allowed plain `UNAUTHORIZED: Verified WeChat identity is required` errors from injected auth services to propagate as user messages in feature tests.

## Minimal Fix Plan

1. Keep backend verified identity as the only trusted customer identity.
2. Keep `createCustomerOrder` rejecting unbound backend customers before stock deduction.
3. Add a real-WeChat success-path facade test.
4. Sanitize `UNAUTHORIZED` into a short Chinese retry-WeChat-identity message.
5. Update rejected identity/phone binding tests to assert no raw technical error leaks.
6. Keep real-device order creation as a manual acceptance gate.

## Verification During Diagnosis

Frontend/facade focused tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
```

Result:

- passed.
- 1 file, 28 tests.

Cloud function order/auth focused tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js cloudfunctions/mallApi/index.test.js
```

Result:

- passed.
- 2 files, 74 tests.

The first attempted backend command used a non-existent config path:

```powershell
pnpm.cmd exec vitest run --config cloudfunctions/vitest.config.mjs cloudfunctions/mallApi/mall-api-core.test.js cloudfunctions/mallApi/index.test.js
```

Result:

- failed because `cloudfunctions/vitest.config.mjs` does not exist.
- equivalent command was rerun with the root `vitest.config.ts` and passed.

## Remaining Manual Acceptance

Manual WeChat DevTools or real-device acceptance must still verify:

- in-stock SKU can be selected and enables checkout.
- phone authorization cancel creates no order and deducts no stock.
- phone authorization success creates an order.
- `orders.customer_id` points to the backend verified customer.
- merchant order list shows the pending order.
