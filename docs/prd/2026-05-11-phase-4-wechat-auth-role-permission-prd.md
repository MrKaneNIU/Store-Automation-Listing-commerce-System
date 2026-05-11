# 2026-05-11 Phase 4 WeChat Auth And Role Permission PRD

## Scope

This PRD implements Phase 4 from `docs/prd/2026-05-08-enterprise-launch-master-prd.md`: real WeChat identity, phone authorization, privacy compliance, and owner/staff/customer role permission hardening.

Phase 4 must preserve the current CloudBase route:

- The mini-program calls feature facades and service ports.
- Pages must not call databases or own final permission decisions.
- CloudBase cloud functions are the business API boundary.
- Real OCR remains Phase 6.
- Order/inventory ledger expansion remains Phase 5.
- Product UI redesign remains Phase 7.

## Current Baseline

- Phase 2 CloudBase backend/persistence gate is recorded as passed.
- Phase 3 real image object storage gate is recorded as passed for owner screenshot upload and CloudBase storage/TLS evidence.
- Existing customer checkout still uses `WechatAuthService` and mock phone data for local tests.
- `mallApi` already has baseline collections for `customers`, `merchant_users`, `staff_users`, and `role_assignments`, but permission enforcement is not yet complete.

## Requirements

### 1. WeChat Customer Identity

User story: As a customer, I can browse products without interruption and only identify myself when I place an order.

Acceptance criteria:

- When a customer opens product list or product detail, the system shall not require login.
- When a customer submits an order, the system shall require a verified WeChat customer identity before creating the order.
- When the CloudBase runtime provides `OPENID`, the backend shall create or update a customer record without trusting a client-supplied openid.
- When identity is unavailable, the backend shall reject customer-auth actions with `UNAUTHORIZED`.

### 2. Phone Authorization

User story: As a customer, I authorize my phone number during checkout so the merchant can process my order.

Acceptance criteria:

- When phone authorization is refused or fails, the system shall not create an order.
- When phone authorization succeeds, the system shall bind the phone to the current customer and use that phone for order creation.
- When an order is created, the system shall use backend-bound customer identity and phone data rather than trusting arbitrary client customer fields.

Implementation note: real WeChat encrypted phone-code exchange depends on platform configuration and must stay behind backend action boundaries. The initial implementation may add a verifiable backend contract and explicit unavailable-state behavior before live phone exchange is manually accepted.

### 3. Privacy Compliance

User story: As a customer, I see privacy authorization before sensitive APIs are used.

Acceptance criteria:

- When a sensitive action is triggered, the mini-program shall be able to check whether privacy authorization is required.
- When privacy authorization is refused, the system shall not call phone-sensitive APIs.
- When new collected data types are introduced, docs shall record the required privacy declaration update.

### 4. Owner And Staff Role Permissions

User story: As the merchant, I need owner/staff/customer access separated by backend enforcement.

Acceptance criteria:

- When a customer calls owner/staff APIs, the backend shall reject the request.
- When a staff member calls owner-only APIs such as product publish or merchant order confirmation, the backend shall reject the request.
- When an owner calls owner APIs, the backend shall allow the operation.
- When a staff member calls staff-approved image supplement APIs, the backend shall allow the operation.
- When the frontend hides an entry, the backend shall still enforce the final permission decision.

## Phase 4 Module Plan

### Module 4.1: Real WeChat Login Boundary

Tasks:

1. Add a `getCurrentCustomer`/customer identity action to `mallApi`.
2. Use CloudBase caller context as the source of `openid`, `appid`, and optional `unionid`.
3. Upsert the customer collection by openid.
4. Add tests for successful identity, missing identity, and client-supplied openid not being trusted.

### Module 4.2: Phone Authorization Boundary

Tasks:

1. Add backend action shape for binding a phone to the current customer.
2. Keep phone exchange server-side and reject missing/invalid authorization input.
3. Update client service types to call the new action.
4. Ensure order creation requires the backend-bound phone when auth source is `wechat`.

### Module 4.3: Privacy Authorization Contract

Tasks:

1. Add page-safe privacy service boundary.
2. Document required WeChat privacy declarations for phone and image collection.
3. Add tests for refusal not calling phone-sensitive actions.

### Module 4.4: Role Permission Enforcement

Tasks:

1. Add backend role resolution for owner/staff/customer.
2. Guard owner/staff/customer APIs by permission matrix.
3. Add negative tests for customer and staff overreach.
4. Keep UI entry visibility secondary to backend authorization.

## Verification

Minimum commands:

```powershell
pnpm.cmd run test
pnpm.cmd run verify
```

Because this phase affects mini-program runtime auth and CloudBase API behavior, run when code changes are complete:

```powershell
pnpm.cmd run verify:full
```

Manual gate:

- WeChat Developer Tools must verify browsing without login.
- Checkout must trigger the login/phone/privacy sequence.
- Owner/staff/customer role probes must be recorded.

## Non-goals

- No real OCR/AI implementation.
- No inventory ledger or order operations expansion.
- No UI redesign.
- No direct page-to-database or page-to-CloudBase collection access.
