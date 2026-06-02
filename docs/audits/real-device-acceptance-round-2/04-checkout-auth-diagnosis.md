# Phase 4 Checkout Auth Diagnosis

Date: 2026-06-01
Status: NEEDS_FIX

## Reported Failure

Real-device acceptance currently fails P0-1:

- Product browsing is expected to remain unauthenticated.
- Tapping order currently shows an in-app "下单前需授权" prompt before the WeChat phone authorization prompt.
- After the auth click, the UI can still report "已取消授权，未创建订单".
- Merchant order confirmation does not see the expected order.

## Current Code Path

### Page Layer

- File: `src/pages/customer/product-detail/index.vue`
- Functions:
  - `submitOrder`
  - `confirmModal`
  - `requestPhoneCode`
  - `handlePhoneNumberAuthorization`

Current page behavior:

- The primary CTA is a normal `@tap="submitOrder"` button.
- `submitOrder` calls `submitCloudBaseCustomerProductDetailOrder`.
- It passes two custom modal callbacks:
  - `confirmLogin: () => confirmModal(...)`
  - `confirmPhoneAuthorization: () => confirmModal(...)`
- The page separately opens a second modal containing a native `open-type="getPhoneNumber"` button.

Root cause at page level:

- The UI has two in-app authorization gates before the native WeChat phone authorization event.
- This violates the acceptance requirement of one native phone authorization prompt on order.

### Feature Facade

- File: `src/features/cloudbase-mall/customer-product-detail.ts`
- Function: `submitCloudBaseCustomerProductDetailOrder`

Current facade behavior:

- If no local session exists, it calls `confirmLogin()` before `authService.login()`.
- If the session has no phone, it calls `confirmPhoneAuthorization()` before `requestPhoneNumber()`.
- Only after `authService.authorizePhoneNumber(phoneCode)` returns a phone-bound session does it call `client.createCustomerOrder`.
- Cancel paths return `status: 'canceled'` before creating the order.

Root cause at facade level:

- The facade explicitly requires the extra custom login/phone confirmation callbacks even though the actual native authorization should be the only customer-facing prompt.
- This makes the page show the "下单前需授权" custom modal before native phone authorization.

### Auth Service

- File: `src/services/auth/cloudbase-wechat-auth-service.ts`
- Function: `createCloudBaseWechatAuthService`

Current service behavior:

- `login()` calls backend `getCurrentCustomer`.
- `authorizePhoneNumber(phoneCode)` calls backend `bindCustomerPhone`.
- It stores a local `currentSession` with backend-returned customer id, openid, and phone number.

Relevant correctness:

- The client does not exchange phone code locally.
- Phone binding is delegated to backend `bindCustomerPhone`.
- If no `phoneCode` exists, it returns `null`.

### Backend

- Files:
  - `cloudfunctions/mallApi/index.js`
  - `cloudfunctions/mallApi/mall-api-core.js`
- Functions:
  - `exports.main`
  - `bindCustomerPhone`
  - `createCustomerOrder`
  - `resolveWechatCustomerForOrder`

Current backend behavior:

- `index.js` strips client-provided `event.identity` and injects runtime identity from CloudBase/WeChat context.
- `bindCustomerPhone` resolves verified identity, exchanges the phone code server-side, and updates the customer record.
- `createCustomerOrder` resolves the customer from server identity for `authSource: 'wechat'`.
- For WeChat orders, it uses the backend customer phone number, not the frontend session phone number.
- It blocks order creation when no backend phone number is bound.

Relevant correctness:

- The backend mostly satisfies "do not trust frontend openid/customerId/phoneNumber" for WeChat orders.
- Existing non-WeChat/mock paths still accept session phone for test/mock flows; this should not be used for real WeChat checkout.

## Minimum Fix Plan

1. Remove the page-level custom `authPrompt` modal from checkout.
2. Make unbound checkout use a native `open-type="getPhoneNumber"` CTA directly.
3. Make phone-bound checkout use a normal direct order CTA.
4. Change `submitCloudBaseCustomerProductDetailOrder` so it silently gets/creates the backend customer session through `authService.login()` when order is attempted, without custom confirmation callbacks.
5. If no phone is bound, require exactly one phone code from `requestPhoneNumber`.
6. If phone authorization is canceled or no code is returned, return `canceled` before order creation.
7. Preserve existing stock/order behavior: only call `client.createCustomerOrder` after backend phone binding succeeds.
8. Add/adjust tests proving:
   - No `confirmLogin`/custom auth modal is wired from the page.
   - One native phone authorization is wired on the order CTA for unbound customers.
   - Canceled phone authorization does not call `createCustomerOrder`.
   - Phone-bound session orders directly without requesting another phone code.
   - Backend WeChat order path does not trust frontend phone number.

## Phase Result

FAIL / NEEDS_FIX.

The root cause is the page/facade custom authorization gate before native phone authorization. Backend phone-code exchange and verified-identity order creation are directionally correct, but frontend flow must be simplified to one native prompt and direct phone-bound order submission.
