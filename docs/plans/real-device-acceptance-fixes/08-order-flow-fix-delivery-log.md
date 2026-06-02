# Real Device Acceptance Failure - Phase 8 Order Flow Fix Delivery Log

Captured: 2026-06-01 17:53:49 +08:00

Agent phase: `agents.prd_implementer.toml`

Status: `IMPLEMENTED`

Overall real-device acceptance status remains: `FAIL`.

## Scope

This phase addresses the P0 product detail order creation failure that can be safely fixed and verified without creating a real remote order from Codex.

In scope:

- Preserve backend verified WeChat identity as the only trusted customer identity.
- Preserve the rule that phone authorization cancel creates no order and deducts no stock.
- Preserve the rule that order creation requires a backend phone-bound customer.
- Add real-WeChat success-path facade coverage.
- Prevent raw `UNAUTHORIZED: Verified WeChat identity is required` copy from reaching page-facing order messages.

Out of scope:

- Payment, logistics, refunds, coupons, customer service, or OCR expansion.
- Trusting frontend `openid`, `customerId`, or `phoneNumber`.
- Creating a real remote order from a non-WeChat shell.
- Changing backend stock reservation, oversell prevention, or merchant order status rules.

## Repository Impact Map

Modified files for this phase:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/cloudbase-function-client.test.ts`
- `src/features/cloudbase-mall/customer-product-detail.ts`
- `src/features/cloudbase-mall/cloudbase-mall.test.ts`
- `docs/audits/real-device-acceptance-fixes/07-order-flow-diagnosis.md`
- `docs/plans/real-device-acceptance-fixes/08-order-flow-fix-delivery-log.md`

Business contracts intentionally preserved:

- Public product browsing still does not require login.
- WeChat identity still comes from CloudBase runtime context, not from frontend payload fields.
- `createCustomerOrder` still requires the backend customer document to have a phone number.
- Phone authorization cancellation still returns a canceled result before `createCustomerOrder`.
- Stock deduction remains backend-owned.

Known unrelated dirty work intentionally left untouched:

- Runtime module fix files from earlier phases.
- Product image fix files from earlier phases.
- CloudBase schema/staging scripts from earlier stabilization work.
- Admin workbench P1 files not yet handled in this phase.

## Implementation

Changed behavior:

- `formatCloudBaseFailureMessage()` now maps both error-code `UNAUTHORIZED` and raw `UNAUTHORIZED: ...` messages to the short Chinese copy `请重试验证微信身份`.
- `submitCloudBaseCustomerProductDetailOrder()` now uses the shared CloudBase failure formatter in its catch path, so injected auth/client failures cannot leak raw backend identity errors into the product detail page.

Added coverage:

- CloudBase function client test proves `UNAUTHORIZED` envelopes and raw unauthorized message strings are sanitized.
- CloudBase mall facade test proves the real `authSource: 'wechat'` success path:
  - login returns a backend verified customer without phone.
  - the page requests a one-time WeChat phone code.
  - phone binding returns a phone-bound session.
  - `createCustomerOrder` is called only after that phone-bound session exists.

No cloud function source behavior was changed in this phase, because the backend already rejects client-forged identity and requires runtime verified identity.

## Verification

Focused frontend/order tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/cloudbase-function-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/customer/product-detail/index.test.ts
```

Result:

- passed.
- 3 files, 47 tests.
- Vitest also printed `WebSocket server error: Port 24678 is already in use`; the command still exited with code 0 and all tests passed.

Cloud function identity/order tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js cloudfunctions/mallApi/index.test.js
```

Result:

- passed.
- 2 files, 74 tests.

## Remaining Work

Proceed to read-only Reviewer re-audit for this order-flow phase.

Manual WeChat DevTools or real-device acceptance is still required to prove:

- the real runtime supplies verified mini-program identity to `mallApi`.
- phone authorization success creates a remote order.
- `orders.customer_id` maps to the backend verified customer.
- merchant pending order list shows the created order.
- phone authorization cancel creates no order and deducts no stock.

If the manual run still fails with `请重试验证微信身份`, the next evidence must be the exact `mallApi` request log around `getCurrentCustomer`, `bindCustomerPhone`, and `createCustomerOrder`, because Codex cannot fully simulate a real `wx.cloud.callFunction` identity context from PowerShell.
