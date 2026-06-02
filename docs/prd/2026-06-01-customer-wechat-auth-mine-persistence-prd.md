# 2026-06-01 Customer WeChat Auth and Mine Persistence PRD

## Problem Statement

The customer-side modules are expected to behave like a real WeChat Mini
Program: customers can browse products without login, but protected customer
actions should use verified WeChat identity. Current runtime behavior does not
meet that expectation. Product detail order submission can show a phone
authorization prompt, but the CloudBase function still returns:

```text
UNAUTHORIZED: Verified WeChat identity is required
```

The "Mine" module also cannot reliably show persistent customer account
information because the backend customer identity chain is not completing.

## Current Verified State

- The mini program calls CloudBase through `wx.cloud.callFunction` and the
  runtime env `cloud1-d7gifjyzl7721b383`.
- Product browsing and published product detail reads can reach `mallApi`.
- Product detail order submission already injects the real CloudBase WeChat
  auth service and uses `open-type="getPhoneNumber"` for phone authorization.
- The backend `mallApi` requires a verified WeChat identity before customer
  private actions such as `getCurrentCustomer`, `bindCustomerPhone`,
  `createCustomerOrder`, shopping bag, favorites, and customer mine.
- The deployed `mallApi` currently does not successfully resolve WeChat
  `OPENID`, so identity-required actions return `UNAUTHORIZED`.
- The CloudBase NoSQL `customers` collection exists, but the current remote
  query returned zero customer documents.
- Customer account documents are designed to be stored in `customers` with
  fields including `_id`, `openid`, `appid`, `unionid`, `phone_number`,
  `auth_source`, `created_at`, and `updated_at`.

## Product Goals

1. Customer product browsing remains login-free.
2. Customer protected actions use verified WeChat Mini Program identity.
3. First customer identity resolution creates or reuses one customer account
   document by `openid`.
4. Phone authorization binds the WeChat phone number to the same customer
   account.
5. Order creation uses backend-verified customer identity and never trusts a
   client-provided `openid`.
6. The "Mine" module displays customer account information after login and can
   restore that account state after page refresh, tab switching, or app re-entry.
7. Customer-side protected modules use one consistent identity and error
   handling model.

## Non-Goals

- Do not add account/password login.
- Do not introduce a separate Web OAuth login flow.
- Do not trust client-submitted `openid`, `customerId`, or raw phone number.
- Do not require login before browsing product list or product detail.
- Do not redesign the customer UI beyond the states required for auth/account
  clarity.
- Do not change merchant order, stock, payment, logistics, refund, coupon, or
  customer-service behavior.
- Do not add merchant workbench entry points to customer "Mine".

## User Stories

1. As a customer, I want to browse products without login, so that shopping
   discovery stays frictionless.
2. As a customer, I want checkout to use WeChat quick identity, so that I do not
   need to create a separate account.
3. As a customer, I want to authorize my WeChat phone number only when needed,
   so that the merchant can confirm my order.
4. As a customer, I want "Mine" to show my account and phone binding state after
   login, so that I know the app recognizes me.
5. As a customer, I want "Mine" to keep showing my account after I return to the
   app, so that login state does not feel fake or temporary.
6. As a merchant, I want customer orders to keep a phone number and customer
   linkage, so that order confirmation remains operational.
7. As the system owner, I want customer identity to be resolved server-side, so
   that private data cannot be accessed by forged client payloads.

## Requirements

### R1. WeChat Identity Resolution

- When a WeChat Mini Program user calls an identity-required `mallApi` action,
  the backend shall resolve a verified WeChat identity containing `openid`.
- When no verified WeChat identity is available, the backend shall reject the
  action with `UNAUTHORIZED`.
- When production test identity is disabled, the backend shall not accept
  client-provided `event.identity` as proof of customer identity.
- When `OPENID` is available, the backend shall normalize it into the existing
  customer identity shape used by `mallApi`.

### R2. Customer Account Persistence

- When a verified WeChat customer first calls `getCurrentCustomer`, the backend
  shall create a `customers` document if one does not already exist.
- When the same `openid` calls again, the backend shall reuse and update the
  existing `customers` document instead of creating duplicates.
- When customer identity is persisted, the backend shall store `openid`,
  optional `appid`, optional `unionid`, `auth_source`, `created_at`, and
  `updated_at`.
- When a phone number is authorized, the backend shall write the phone number to
  `customers.phone_number` for the same customer.

### R3. Phone Authorization

- When a customer without a bound phone attempts checkout, the product detail
  page shall request WeChat phone authorization.
- When WeChat returns a valid phone code, the backend shall exchange the code
  server-side and bind the resulting phone number to the current customer.
- When phone authorization is canceled or fails, the system shall not create an
  order and shall not deduct stock.
- When the customer already has a bound phone number, checkout shall not prompt
  for phone authorization again.

### R4. Customer Order Creation

- When a customer creates an order with `authSource = wechat`, the backend shall
  resolve the customer from verified server-side WeChat identity.
- When the customer has no bound phone number, order creation shall fail before
  stock deduction.
- When order creation succeeds, the order shall retain customer linkage and the
  merchant-visible phone number.
- When client payload includes identity-like fields, the backend shall treat
  them as session hints only and shall not use them as authority.

### R5. Mine Account Display and Persistence

- When a verified customer opens "Mine", the page shall request a customer mine
  snapshot from the backend.
- When the customer account exists, "Mine" shall display account information
  derived from the backend snapshot.
- When the customer has a bound phone number, "Mine" shall display a masked
  phone binding state.
- When the customer has no bound phone number, "Mine" shall display an unbound
  state without treating it as a login failure.
- When the user switches tabs, refreshes, or re-enters the mini program, "Mine"
  shall restore account state from backend WeChat identity and `customers`, not
  from page-local memory alone.
- When identity resolution fails, "Mine" shall show a retryable auth failure
  state instead of silently showing a fake logged-out state.

### R6. Customer-Side Consistency

- When shopping bag, favorites, order, or mine features require private customer
  data, they shall use the same server-side WeChat identity chain.
- When an identity-required customer feature fails with `UNAUTHORIZED`, the UI
  shall present a consistent retry path.
- When public product data is requested, the system shall not require customer
  login.

## Data Model

### `customers`

The customer account source of truth is the CloudBase NoSQL `customers`
collection.

```text
_id: string
openid: string
appid?: string
unionid?: string
phone_number?: string
auth_source: 'wechat'
created_at: string
updated_at: string
```

Rules:

- `openid` is the WeChat Mini Program user identifier.
- `openid` must come from verified backend runtime context.
- `phone_number` must come from WeChat phone-code exchange.
- The page must not write this collection directly.

### Related Customer-Private Data

- `orders.customer_id` links orders to the customer account.
- `orders.customer_auth_source` records the customer auth source.
- `shopping_bag_items.customer_id` scopes shopping bag rows.
- `customer_favorites.customer_id` scopes favorites rows.

## Technical Approach

### Phase 1 - Backend WeChat Identity Resolution

Scope:

- `cloudfunctions/mallApi/index.js`
- `cloudfunctions/mallApi/package.json`
- focused function-entry tests

Work:

1. Add the correct WeChat Mini Program cloud-function identity reader.
2. Normalize `OPENID`, `APPID`, and `UNIONID` into the existing `mallApi`
   identity object.
3. Preserve production behavior where test identity is disabled.
4. Keep the current CloudBase database adapter and action router contracts.

Acceptance:

- `getCurrentCustomer` succeeds from real WeChat Mini Program runtime.
- Missing identity still returns `UNAUTHORIZED`.
- Client-forged identity remains rejected in production mode.

### Phase 2 - Customer Account and Phone Binding

Scope:

- `cloudfunctions/mallApi/mall-api-core.js`
- function core tests

Work:

1. Verify and, if needed, repair customer upsert by `openid`.
2. Verify and, if needed, repair `bindCustomerPhone` so the phone number updates
   the same `customers` document.
3. Verify order creation uses the backend-resolved customer record.
4. Add or update tests for new customer, returning customer, phone binding,
   missing identity, and missing phone number.

Acceptance:

- First successful `getCurrentCustomer` creates one `customers` document.
- Repeated calls from the same WeChat user do not create duplicates.
- Successful phone authorization writes `phone_number`.
- Checkout can create an order only after verified identity and required phone
  state are satisfied.

### Phase 3 - Mine Snapshot Persistence

Scope:

- `cloudfunctions/mallApi/mall-api-core.js`
- `src/services/cloudbase/mall-api-client.ts`
- `src/features/cloudbase-mall/customer-mine.ts`
- `src/pages/customer/mine/useCustomerMinePageState.ts`
- `src/pages/customer/mine/index.vue`
- focused tests for each changed layer

Work:

1. Ensure `getCustomerMineSnapshot` resolves the current customer from backend
   WeChat identity.
2. Return a page-facing snapshot with account summary, masked phone state,
   order count, favorites count, shopping bag count, recent orders, loading
   empty states, and retryable failure shape.
3. Make "Mine" page state derive account display from the backend snapshot.
4. Avoid page-local hidden identity persistence.

Acceptance:

- "Mine" displays account information after login.
- "Mine" restores the same account after tab switch, refresh, or app re-entry.
- Phone-bound and phone-unbound states are distinct.
- Identity failure shows retryable error copy.

### Phase 4 - Customer-Side Protected Module Alignment

Scope:

- customer shopping bag facade/page state
- customer favorites facade/page state
- product-detail checkout flow
- mine page state
- shared CloudBase client error handling if needed

Work:

1. Audit each customer-private action for the same identity dependency.
2. Normalize `UNAUTHORIZED` handling and retry behavior.
3. Confirm mock auth paths are not used in real customer pages.
4. Preserve public product browsing behavior.

Acceptance:

- Shopping bag, favorites, checkout, and mine all use backend WeChat identity.
- Public product list and detail remain accessible without login.
- No page directly writes customer collections or trusts client identity.

### Phase 5 - Verification and Acceptance

Automated checks:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Targeted checks:

- cloud function identity tests
- customer account upsert tests
- phone binding tests
- order creation auth tests
- mine facade/page-state tests
- customer protected-module error-state tests

Remote CloudBase smoke:

1. Deploy `mallApi` after approval.
2. Confirm `getCurrentCustomer` succeeds from WeChat DevTools or real device.
3. Query `customers` and confirm one customer document is created.
4. Authorize phone and confirm `phone_number` is stored.
5. Create an order and confirm `orders.customer_id` points to the same customer.

Manual acceptance:

1. Open product list without login.
2. Open product detail without login.
3. Tap order.
4. Complete WeChat identity and phone authorization flow.
5. Confirm order creation succeeds.
6. Open "Mine" and confirm account information is shown.
7. Switch tabs and return to "Mine"; account remains shown.
8. Re-enter the mini program and confirm "Mine" restores the same account.
9. Cancel phone authorization and confirm no order is created and stock is not
   deducted.

## Repository Impact Map for Implementation

Expected implementation files:

- `cloudfunctions/mallApi/index.js`
- `cloudfunctions/mallApi/package.json`
- `cloudfunctions/mallApi/index.test.js`
- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`
- `src/services/cloudbase/mall-api-client.ts`
- `src/services/cloudbase/mall-api-client.test.ts`
- `src/features/cloudbase-mall/customer-mine.ts`
- `src/features/cloudbase-mall/customer-mine.test.ts`
- `src/pages/customer/mine/useCustomerMinePageState.ts`
- `src/pages/customer/mine/useCustomerMinePageState.test.ts`
- `src/pages/customer/mine/index.vue`
- `src/pages/customer/mine/index.test.ts`
- related customer shopping bag, favorites, and product-detail tests only if
  protected-module alignment requires them

Out of scope for implementation unless separately approved:

- merchant workbench UI
- admin/staff permission model beyond existing role resolution
- payment
- logistics
- refunds
- coupons
- customer-service chat
- product management workflows
- OCR workflows
- inventory rules unrelated to customer checkout guardrails

Business contracts to preserve:

- Public product browsing remains anonymous.
- Customer private data is scoped by backend-verified identity.
- Order creation continues to enforce stock and status rules.
- Phone number comes only from WeChat phone-code exchange.
- Pages call page-facing facades/clients, not repositories or collections.

## Risks and Mitigations

### Risk 1 - Mistaking Phone Authorization for Login

Mitigation:

- Treat WeChat `OPENID` identity and `getPhoneNumber` authorization as separate
  steps.
- Do not show "phone bound" as proof that backend identity worked unless the
  customer snapshot confirms it.

### Risk 2 - Client Identity Forgery

Mitigation:

- Backend must ignore client-submitted `openid` in production.
- Tests must verify forged identity is rejected when test identity is disabled.

### Risk 3 - Duplicate Customer Records

Mitigation:

- Upsert by `openid`.
- Add a future unique index on `openid` if CloudBase supports it for this
  collection and rollout risk is acceptable.

### Risk 4 - Mine Page Shows Fake Logged-In State

Mitigation:

- Mine state must come from backend snapshot.
- In-memory session can optimize flow but cannot be the source of truth.

### Risk 5 - Broad Customer-Side Regression

Mitigation:

- Execute in phases.
- Verify each protected module separately.
- Keep merchant and unrelated workflows out of scope.

## Recommended Execution Sequence

1. Approve Phase 1 only and fix backend identity resolution.
2. Verify remote `getCurrentCustomer` and `customers` creation.
3. Approve Phase 2 and bind phone/order creation.
4. Approve Phase 3 and repair persistent "Mine" account display.
5. Approve Phase 4 after the core identity chain is green.
6. Complete Phase 5 verification and manual acceptance evidence.

Do not start by redesigning the "Mine" page. The current blocker is the
server-side WeChat identity chain; UI work before identity repair would only
hide the failure rather than creating a persistent customer account.
