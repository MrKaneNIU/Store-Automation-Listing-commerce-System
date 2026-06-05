# 2026-06-04 Customer Account, Order Sync, and Manager Notification PRD

## Problem Statement

The customer-side mall checkout path currently depends on order-time phone
authorization. When WeChat does not return a usable phone code, product detail
checkout reports:

```text
已取消授权，未创建订单
```

This exposes a deeper product gap: customer login state, customer profile
display, customer order ownership, shopping-bag checkout, merchant order
confirmation, and manager WeChat notification are not yet governed as one
verified end-to-end flow.

This PRD defines the only approved scope for repairing that flow.

## Hard Scope Lock

This PRD is a strict execution contract.

- Do not modify files outside the active phase's declared boundary.
- Do not modify unrelated customer, merchant, product, inventory, favorites,
  payment, logistics, refund, coupon, OCR, homepage, upload, account-management,
  or admin-workbench flows.
- Do not perform opportunistic refactors, style rewrites, dependency upgrades,
  route rewrites, data-model broadening, or cleanup outside the current phase.
- Do not add direct CloudBase collection writes from pages.
- Do not trust client-provided `openid`, `customerId`, raw phone number, or
  manager openid as authority.
- Do not hardcode WeChat AppSecret, template IDs, manager openids, phone
  numbers, or production credentials in source code.
- If a required file is not listed in the current phase boundary, stop and
  report before editing it. The boundary must be explicitly amended before
  work continues.
- If a phase needs to touch a protected adjacent flow, stop and request a PRD
  update instead of making the change.

## Mandatory Reviewer Gate

Every implementation phase and every implementation round inside a phase must
end with a `prd_reviewer` review.

Rules:

1. The implementer must run only the current phase's scoped work.
2. The implementer must record the changed files, untouched protected files,
   checks run, and remaining risks before review.
3. `prd_reviewer` must review the current diff against this PRD and the active
   phase boundary.
4. If `prd_reviewer` returns `PASS`, the next phase may begin.
5. If `prd_reviewer` returns anything other than `PASS`, implementation must
   stop. Only reviewer-identified issues may be fixed in the next round.
6. After a fix round, `prd_reviewer` must run again.
7. Do not begin the next phase on a conditional, partial, skipped, or missing
   reviewer result.
8. If `prd_reviewer` is unavailable, stop and report that the phase cannot
   proceed under this PRD.

The reviewer must not modify code.

## Phase Start Protocol

Before starting each phase, the implementer must publish a phase-start note
containing:

1. Phase name.
2. Exact task boundary.
3. Exact files or directories allowed to be edited.
4. Explicitly protected files or flows that must not be touched.
5. Task content for this phase only.
6. Acceptance criteria for this phase only.
7. Verification commands planned for this phase.
8. Open assumptions.

No implementation edits may happen before the phase-start note is produced.

## Product Goals

1. Customer-side login establishes a real backend customer account state.
2. The "Mine" module displays the customer's avatar and customer ID.
3. The "Mine" module provides entries for personal information, wallet,
   address, and customer orders.
4. Product-detail checkout creates a customer-owned order when authorization
   and server validation succeed.
5. Shopping-bag checkout creates a customer-owned order when authorization and
   server validation succeed.
6. Customer-owned orders appear under customer "Mine" -> "My Orders".
7. The same orders appear in the management workbench "Order Confirmation".
8. When a new order is created, subscribed managers receive a WeChat Mini
   Program order notification.

## Non-Goals

- Do not implement real payment.
- Do not implement real wallet balance, recharge, withdrawal, or transaction
  ledger.
- Do not implement full address-book business unless a later approved phase
  explicitly expands scope.
- Do not implement logistics, refund, coupon, invoice, customer-service, or
  marketing behavior.
- Do not require login before public product browsing.
- Do not redesign the full customer shell or admin workbench.
- Do not replace the existing CloudBase `mallApi` facade/router architecture.

Wallet and address are entry requirements in this PRD. Unless separately
approved before the relevant phase begins, they are implemented as visible
entries with safe empty or placeholder states, not as full financial or address
management systems.

## Platform Constraints

- WeChat Mini Program identity must be resolved server-side from the runtime
  WeChat/CloudBase context.
- Phone binding must use WeChat phone authorization code exchange on the
  backend. A missing phone code means no phone binding and no order.
- Avatar and nickname cannot be silently fetched. Profile completion must use
  WeChat-supported user action such as avatar selection and nickname input.
- Manager order notifications require a configured WeChat subscription message
  template and manager-side subscription authorization. The system cannot push
  arbitrary WeChat messages without manager consent.
- Notification send failure must not roll back order creation.

## User Stories

1. As a customer, I want to enter the mini program and become a recognized
   customer account after login, so that protected actions belong to me.
2. As a customer, I want "Mine" to show my avatar and customer ID, so that I
   know the app has recognized my account.
3. As a customer, I want personal information, wallet, address, and order
   entries in "Mine", so that account-related tasks are discoverable.
4. As a customer, I want product-detail checkout to create an order only after
   valid authorization, so that failed authorization does not create hidden
   orders.
5. As a customer, I want shopping-bag checkout to create an order from selected
   items, so that my bag can proceed to purchase.
6. As a customer, I want created orders to appear in "My Orders", so that I can
   track my purchases.
7. As a manager, I want new customer orders to appear in "Order Confirmation",
   so that I can process them.
8. As a manager, I want WeChat order notifications after I subscribe, so that I
   can notice new orders promptly.

## Requirements

### R1. Customer Login State

- When a customer opens a protected customer module, the backend shall resolve
  the verified WeChat Mini Program identity.
- When a verified identity has no customer record, the backend shall create one
  customer account.
- When the same verified identity returns, the backend shall reuse the existing
  customer account.
- When identity cannot be verified, the module shall show a retryable login or
  authorization state instead of creating a fake account.

### R2. Customer Profile Display

- When the customer account exists, "Mine" shall display the customer ID from
  the backend account record.
- When the customer has an avatar, "Mine" shall display it from the backend
  profile snapshot.
- When the customer has no avatar, "Mine" shall display a stable placeholder
  without treating the customer as logged out.
- When the customer completes profile information, the page shall persist it
  through a page-facing facade, not by direct collection writes.

### R3. Mine Entries

- When "Mine" loads, it shall show entries for personal information, wallet,
  address, and my orders.
- When wallet or address functionality is not implemented, the entry shall
  navigate to a safe placeholder or empty state approved for that phase.
- When "My Orders" is tapped, the customer shall reach a customer-scoped order
  list.

### R4. Product Checkout

- When a customer taps product-detail checkout and already has a bound phone,
  the system shall submit the order without prompting for phone authorization.
- When the customer has no bound phone, the page shall request WeChat phone
  authorization.
- When WeChat returns a valid phone code, the backend shall bind the phone
  number before order creation.
- When WeChat returns no phone code or an error, the system shall not create an
  order and shall show a message based on the actual authorization result.
- When order creation succeeds, the order shall be linked to the backend
  customer account.

### R5. Shopping-Bag Checkout

- When a customer checks out selected shopping-bag items, the backend shall
  revalidate product publication state, SKU state, stock, and customer phone
  binding before creating an order.
- When validation succeeds, the backend shall create a customer-owned order and
  clear or update only the checked-out bag items as defined in the phase
  boundary.
- When validation fails, the system shall not create an order and shall not
  mutate unrelated bag items.
- Shopping-bag add, update, and remove behavior must not reserve stock.

### R6. Customer My Orders

- When an order is created by product-detail checkout, it shall appear in the
  current customer's "My Orders" list.
- When an order is created by shopping-bag checkout, it shall appear in the
  current customer's "My Orders" list.
- When another customer opens "My Orders", that customer shall not see orders
  owned by other customers.
- The customer order list shall use backend identity scoping, not client
  customer ID filtering.

### R7. Management Order Confirmation

- When a customer order is created, the same order shall appear in the
  management workbench "Order Confirmation" list.
- Existing manager permissions for order confirmation shall remain in force.
- Customer-side changes shall not weaken merchant order access control.

### R8. Manager WeChat Notification

- When a manager chooses to enable order reminders, the mini program shall
  request subscription permission for the configured order notification
  template.
- When the manager accepts the subscription, the backend shall store a
  notification subscription record scoped to that manager identity.
- When a new customer order is created, the backend shall attempt to send a
  WeChat subscription message to subscribed managers.
- When template ID is missing, subscription is absent, or sending fails, order
  creation shall still succeed and the notification result shall be recorded as
  skipped or failed.

## Data and Contract Boundaries

Allowed source-of-truth collections and concepts:

- `customers`: customer account, profile, phone binding, verified identity.
- `orders`: customer-owned and merchant-visible order records.
- `shopping_bag_items`: customer-scoped shopping-bag rows.
- A new manager notification subscription/log collection may be introduced only
  in the notification phase.

Forbidden patterns:

- Page code writing those collections directly.
- Client-supplied identity fields as authorization proof.
- Duplicating orders into separate customer-only and manager-only collections.
- Creating orders before backend validation succeeds.
- Rolling back successful order creation because notification failed.

## Module Sequence

### Phase A - PRD and Contract Freeze

Allowed edits:

- `docs/prd/2026-06-04-customer-account-order-notification-prd.md`
- Existing contract docs only if explicitly approved at phase start.

Task content:

- Freeze scope, non-goals, phase sequence, reviewer gate, and acceptance
  criteria.

Acceptance:

- PRD contains hard scope lock, reviewer gate, phase-start protocol, module
  sequence, and non-goals.
- No business code is changed.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase B - Customer Account State and Mine Header

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Customer mine facade/ViewModel files.
- Customer mine page files.
- CloudBase customer identity/profile actions if needed.
- Direct tests for the above files.

Task content:

- Establish backend-backed customer account state.
- Display avatar or placeholder and backend customer ID in "Mine".
- Add profile persistence through facade-only calls if required.

Acceptance:

- "Mine" does not show a fake logged-in state.
- Customer ID comes from backend account data.
- Avatar display survives page reload when persisted.
- No unrelated customer modules are edited.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase C - Mine Entries and Customer Orders Entry

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Mine ViewModel/page entry mapping.
- New customer order route/page shell if needed.
- Wallet/address/personal-info placeholder pages only if explicitly listed.
- Route definitions for the new pages.
- Direct tests for the above files.

Task content:

- Add personal information, wallet, address, and my orders entries.
- Wire my orders entry to a customer-scoped order list route.
- Keep wallet/address as entry or empty-state scope unless expanded.

Acceptance:

- Entries are visible and navigable.
- No payment, wallet ledger, or full address-book business is introduced.
- Route changes are limited to the declared pages.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase D - Product Checkout Repair

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Product-detail checkout page event handling.
- Product-detail checkout feature/facade.
- CloudBase mall API client contract only if required.
- Backend order/phone actions only if required.
- Direct tests for the above files.

Task content:

- Preserve direct checkout for already phone-bound customers.
- Preserve WeChat phone authorization for unbound customers.
- Surface actual authorization result when no phone code is returned.
- Ensure no order is created without backend identity and bound phone.

Acceptance:

- Authorization cancellation or missing code creates no order.
- Successful phone binding creates one customer-owned order.
- Stock and order side effects occur only after backend validation succeeds.
- No favorites, product listing, or unrelated detail behavior is changed.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase E - Shopping-Bag Checkout to Order

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Shopping-bag checkout state/facade.
- Shopping-bag checkout backend action if needed.
- Order creation reuse points.
- Direct tests for the above files.

Task content:

- Submit selected bag items into the same customer-owned order model.
- Revalidate stock and SKU state during checkout.
- Keep add/update/remove bag behavior independent from stock reservation.

Acceptance:

- Shopping-bag checkout creates an order only after validation.
- The order is linked to the backend customer account.
- Unchecked or failed items are not mutated outside the phase rule.
- Product-detail checkout behavior remains unchanged unless explicitly listed.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase F - Customer My Orders and Management Order Confirmation

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Customer order list facade/page.
- Existing owner order list facade/page only if needed to prove visibility.
- Backend list actions only if needed.
- Direct tests for the above files.

Task content:

- List customer-owned orders in "My Orders".
- Ensure the same order appears in management "Order Confirmation".
- Preserve manager-side authorization.

Acceptance:

- Product-detail and shopping-bag orders appear in customer "My Orders".
- The same order appears in management "Order Confirmation".
- Customers cannot see other customers' orders.
- Manager access control is not weakened.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase G - Manager Order Notification

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Manager notification subscription UI entry.
- Notification subscription facade/client/backend action.
- Order-created notification sender.
- Notification result logging.
- Direct tests for the above files.

Task content:

- Let managers opt in through WeChat subscription message authorization.
- Store accepted subscription state server-side.
- Send or enqueue order-created notification after successful order creation.
- Record skipped/failed notification results without rolling back orders.

Acceptance:

- No notification is attempted without configured template ID and manager
  subscription state.
- Order creation succeeds even when notification sending fails.
- Notification result is observable in logs or a scoped backend record.
- No hardcoded template ID or manager openid is committed.

Reviewer gate:

- Run `prd_reviewer`.
- Continue only on `PASS`.

### Phase H - End-to-End Verification and Manual Acceptance

Allowed edit boundary must be declared before the phase begins. Expected scope:

- Verification logs or handoff docs only.
- No business code unless a reviewer-approved defect fix round is opened.

Task content:

- Run targeted tests and strongest relevant project checks.
- Build mini program.
- Deploy CloudBase only if implementation phases require remote verification.
- Verify real-device phone authorization and manager subscription notification.

Acceptance:

- Automated checks are recorded with exact command results.
- CloudBase smoke is recorded separately from manual WeChat acceptance.
- Manual acceptance remains `CONDITIONAL PASS` until real-device phone
  authorization and manager notification are both proven.

Reviewer gate:

- Run `prd_reviewer`.
- Final status may be reported only after `PASS`.

## Required Verification

For implementation phases:

```powershell
pnpm.cmd exec vitest run <targeted test files>
pnpm.cmd run type-check
pnpm.cmd run build:mp-weixin
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Run the strongest relevant subset during early narrow phases, but final
end-to-end acceptance must include the full checks unless the command is
unavailable or blocked. Any skipped command must be reported with the exact
reason.

For PRD-only Phase A:

```powershell
git diff -- docs/prd/2026-06-04-customer-account-order-notification-prd.md
```

## Reporting Requirements

Each phase report must include:

1. Phase name and status.
2. Files changed.
3. Files and flows intentionally not changed.
4. Verification commands and results.
5. `prd_reviewer` result.
6. Remaining risks.
7. Whether the next phase is allowed to begin.

## Stop Conditions

Stop immediately when:

- A needed edit is outside the active phase boundary.
- A protected adjacent flow must be changed.
- `prd_reviewer` does not return `PASS`.
- Required WeChat platform configuration is missing for a phase that depends on
  it.
- Test failures cannot be fixed within the current phase without expanding
  scope.
- CloudBase deployed contract differs from local assumptions and the phase did
  not include deployment repair.

