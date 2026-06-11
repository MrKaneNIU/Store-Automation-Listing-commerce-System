# 2026-06-11 Customer Mine Completion PRD

## Status

Draft for phased implementation.

## Goal

Complete the customer-side "Mine" module for four account surfaces:

- Profile editing and persistence.
- Wallet balance and ledger read-only display.
- Address book CRUD, default address, and checkout address selection.
- Customer orders list/detail with shipping address snapshots, including owner order-confirmation display.

## Hard Scope Lock

Allowed scope:

- Customer Mine, profile, wallet, address, and orders surfaces.
- Customer product-detail and shopping-bag checkout only for selecting and submitting a customer-owned address.
- Order domain/API changes only for adding a backward-compatible shipping address snapshot.
- Owner order-confirmation display only for showing the order shipping address snapshot.
- CloudBase `mallApi` actions and client facades needed by the above surfaces.
- Tests and workflow reports for these changes.

Forbidden scope:

- Payment, recharge, withdrawal, refunds, logistics, coupons, invoices, marketing, recommendations.
- Product management, OCR, homepage settings, favorites semantics, inventory rules, admin account/permission flows.
- Rewriting customer bottom navigation, global design system, dependency upgrades, or unrelated refactors.
- Direct page-layer CloudBase collection or repository writes.
- Trusting client-provided `customerId`, `openid`, raw phone, or address ownership.

## UI/UX Requirements

Every UI implementation phase must apply `ui-ux-pro-max` before editing. New UI must match the existing customer style:

- `#f8f8f8` page background, white cards, existing shadow/radius density.
- Sticky custom header with current back-button alignment logic.
- Existing `press-feedback`, skeleton/loading, inline error, retry, and empty-state patterns.
- Visible form labels, field-local error messages, disabled saving buttons, and retryable failures.
- No new UI library, no new visual language, no bottom-nav redesign.

## Functional Requirements

### R1 Profile

- The customer profile page shall load the current customer's profile snapshot.
- The customer can update nickname and avatar URL/avatar selection result through a page-facing facade.
- Saved profile data shall be visible when returning to Mine.
- The page shall show loading, saving, saved, failure, and retry states.

### R2 Wallet

- The wallet page shall load the current customer's wallet snapshot.
- It shall show balance and ledger entries.
- Empty ledger and failure states shall be explicit.
- This PRD does not implement recharge, withdrawal, payment, or any money-moving command.

### R3 Address Book

- The address page shall list current-customer addresses.
- The customer can add, edit, delete, and set a default address.
- A customer can have multiple addresses.
- Address mutations shall be customer-scoped on the backend.

### R4 Checkout Address Selection

- Product-detail checkout and shopping-bag checkout shall require selecting a valid current-customer address.
- Backend order creation shall validate the address belongs to the resolved runtime customer.
- The order shall store a shipping address snapshot at creation time.
- Missing or invalid address shall block order creation without mutating order, stock, or shopping-bag state.

### R5 Orders

- Customer order list labels shall be Chinese.
- Customer order detail shall show order items, total amount, status, and shipping address snapshot.
- Customer order detail shall not expose another customer's order.
- Owner order confirmation shall display the same shipping address snapshot.
- Old orders without a snapshot shall display `未记录收货地址`.

### R6 Mine Summary

- Mine shall continue to use the page-facing state facade.
- Mine utilities shall reflect real profile, wallet, address, and order status/counts where available.
- Existing favorites and shopping-bag bottom-nav behavior shall remain unchanged.

## Phase Gates

1. Phase 0 Scope Lock: `prd_planner` output, this PRD, `.ai/PLAN.md`, and `prd_reviewer` PASS.
2. Phase 1 Backend Contracts: types, CloudBase client, mallApi actions, backend tests, reviewer PASS.
3. Phase 2 Profile UI: `ui-ux-pro-max`, profile page/state/facade/tests, reviewer PASS.
4. Phase 3 Address + Checkout Address: `ui-ux-pro-max`, address page/state/facade/checkout/order owner display/tests, reviewer PASS.
5. Phase 4 Wallet UI: `ui-ux-pro-max`, wallet page/state/facade/tests, reviewer PASS.
6. Phase 5 Orders UI: `ui-ux-pro-max`, Chinese orders list, order detail/tests, reviewer PASS.
7. Phase 6 Verification: final tests, CloudBase smoke, final reviewer PASS, `prd_reporter`.

If `prd_reviewer` returns `STATUS: NEEDS_FIX`, run `prd_debugger` only for the listed blocker. Stop and report after two unsuccessful debugger rounds for the same phase.

## Verification

Targeted tests:

- `cloudfunctions/mallApi/mall-api-core.test.js`
- `src/services/cloudbase/mall-api-client.test.ts`
- Customer profile, wallet, address, orders feature/page tests.
- Product-detail and shopping-bag checkout address tests.
- Owner orders address display tests.
- Mine utility state tests.

Final gates:

- `pnpm.cmd run verify`
- `pnpm.cmd run verify:full` because routes/pages and CloudBase actions change.
- CloudBase `mallApi listContracts` includes new actions after deployment.
