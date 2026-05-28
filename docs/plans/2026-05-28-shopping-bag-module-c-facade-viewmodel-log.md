# 2026-05-28 Shopping Bag Module C Facade ViewModel Log

## Repository Impact Map

Governing PRD and contract:

```text
docs/prd/2026-05-27-shopping-bag-module-prd.md
docs/contracts/page-facing-ui-contracts.md
```

Completed scope:

```text
src/features/customer-shopping-bag/customer-shopping-bag.ts
src/features/customer-shopping-bag/customer-shopping-bag.test.ts
src/features/cloudbase-mall/customer-shopping-bag.ts
src/features/cloudbase-mall/customer-shopping-bag.test.ts
docs/plans/2026-05-28-shopping-bag-module-c-facade-viewmodel-log.md
```

Explicitly out of scope:

```text
src/pages/
src/pages.json
src/app/routes.ts
src/app/navigation.ts
cloudfunctions/
backend/
payment
logistics
coupons
refunds
favorites
customer mine
```

Protected business contracts:

- Shopping-bag facade writes still call the Module B CloudBase client methods
  and do not write repositories or CloudBase collections directly.
- Shopping-bag items are not orders and do not reserve, decrement, restore, or
  audit stock.
- Checkout submission from the ViewModel only prepares selected available bag
  items for the next page-facing step; it does not change existing order
  creation semantics.
- Phone authorization remains out of scope for shopping-bag reads and writes.
- Existing navigation, page routes, product publish rules, customer auth,
  merchant order handling, payment, logistics, coupons, refunds, favorites, and
  customer mine remain unchanged in Module C.

## Module C Deliverables

Added pure page-facing ViewModel helpers:

```text
createCustomerShoppingBagView
createCustomerShoppingBagLoadingView
createCustomerShoppingBagFailureView
submitSelectedCustomerShoppingBagItemsToCheckout
```

The ViewModel covers item quantity labels, money labels, unavailable state,
empty state, selected totals, checkout readiness, loading state, failure
message, and last update time from the CloudBase snapshot.

Added CloudBase facade helpers:

```text
getCloudBaseCustomerShoppingBagView
addCloudBaseCustomerShoppingBagItem
updateCloudBaseCustomerShoppingBagItemQuantity
selectCloudBaseCustomerShoppingBagItem
removeCloudBaseCustomerShoppingBagItem
clearUnavailableCloudBaseCustomerShoppingBagItems
```

The command helpers call the Module B client methods, map refreshed snapshots
back into the page-facing ViewModel, return invalidated snapshot keys on
success, and preserve the previous usable ViewModel on command failure.

## Skill Usage

Used only `tdd-workflow` because Module C adds a new feature/facade boundary
and needed RED -> GREEN evidence.

No UI skill was used in Module C because no page, layout, visual component, or
navigation code was edited. UI skills become required before Module D.

## RED Evidence

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts
```

Expected RED result:

- Failed because `./customer-shopping-bag` did not exist yet.

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/customer-shopping-bag.test.ts
```

Expected RED result:

- Failed because `./customer-shopping-bag` did not exist yet.

## GREEN Evidence

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts
```

Result:

- Passed, 1 test file and 4 tests.

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/customer-shopping-bag.test.ts
```

Result:

- Passed, 1 test file and 3 tests.

## Verification

Command:

```powershell
pnpm.cmd run verify
```

Result:

- Passed.
- `test`: passed, 59 test files and 335 tests.
- `coverage`: passed, 90.27% statements, 76.66% branches, 88.60% functions,
  90.27% lines.
- `type-check`: passed.
- `backend:test`: passed, 12 test files and 60 tests.
- `backend:build`: passed.
- `audit:prod`: passed, no known vulnerabilities.
- `audit:all`: passed, no known vulnerabilities.

Command:

```powershell
pnpm.cmd run verify:full
```

Result:

- Passed.
- Re-ran `verify` successfully.
- `build:mp-weixin`: passed.
- `smoke:mp-weixin`: passed; build artifacts and page routes are present.

## Manual Acceptance

Not executed. Module C adds facade and ViewModel helpers only. It does not wire
the page, reserved customer navigation entry, or product-detail add-to-bag
behavior.

Manual acceptance remains open for later modules:

- first entry duration.
- return-entry duration.
- slow-network loading behavior.
- write-after-refresh behavior.
- text availability when images fail.

## Remaining Product Gaps

- Module D must wire the existing reserved customer shopping-bag entry, the
  shopping-bag page, and product-detail add-to-bag behavior using the required
  UI workflow.
- Module E must record real manual acceptance evidence. Build smoke is not
  manual acceptance.
- Production CloudBase deployment and real-device acceptance were not executed
  in this module.

## Next Module Boundary

Module D should stay limited to UI integration:

```text
existing reserved shopping-bag entry
shopping-bag page state and rendering
product-detail add-to-bag command wiring
loading/failure/write-after-refresh UI states
targeted UI/page tests
```

Do not expand Module D into payment, logistics, coupons, refunds, favorites,
customer mine, order semantics, inventory reservation, or navigation redesign.
