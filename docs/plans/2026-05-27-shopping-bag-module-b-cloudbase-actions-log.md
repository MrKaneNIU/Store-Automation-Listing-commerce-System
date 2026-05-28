# 2026-05-27 Shopping Bag Module B CloudBase Actions Log

## Repository Impact Map

Governing PRD:

```text
docs/prd/2026-05-27-shopping-bag-module-prd.md
docs/contracts/page-facing-ui-contracts.md
```

Completed scope:

```text
cloudfunctions/mallApi/mall-api-core.js
cloudfunctions/mallApi/mall-api-core.test.js
src/services/cloudbase/mall-api-client.ts
src/services/cloudbase/mall-api-client.test.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
src/services/auth/cloudbase-wechat-auth-service.test.ts
docs/plans/2026-05-27-shopping-bag-module-b-cloudbase-actions-log.md
```

Explicitly out of scope:

```text
src/pages/
src/pages.json
src/app/routes.ts
src/app/navigation.ts
src/features/customer-product-detail/
src/features/customer-order/
backend/
payment
logistics
coupons
refunds
favorites
customer mine
```

Protected business contracts:

- Shopping-bag writes do not reserve, decrement, restore, or audit stock.
- Existing customer order creation remains the only checkout stock-reservation
  path.
- Phone authorization is not required for shopping-bag snapshot, add, update,
  remove, or clear-unavailable actions.
- Customer-private rows are scoped by verified CloudBase identity resolved to a
  customer record.
- Unpublished products and out-of-stock SKUs remain visible in the bag snapshot
  as unavailable items instead of being silently converted into orders.

## Module B Deliverables

Added CloudFunction actions:

```text
getCustomerShoppingBagSnapshot
addCustomerShoppingBagItem
updateCustomerShoppingBagItemQuantity
selectCustomerShoppingBagItem
removeCustomerShoppingBagItem
clearUnavailableCustomerShoppingBagItems
```

Added CloudFunction storage support:

```text
shopping_bag_items
```

The stored item contains customer id, product id, SKU id, quantity, selected
state, and timestamps. The snapshot joins current product and SKU data at read
time so availability can change without treating the bag as inventory truth.

Added CloudBase client methods:

```text
getCustomerShoppingBagSnapshot
addCustomerShoppingBagItem
updateCustomerShoppingBagItemQuantity
selectCustomerShoppingBagItem
removeCustomerShoppingBagItem
clearUnavailableCustomerShoppingBagItems
```

## RED Evidence

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
```

Expected RED result:

- Failed with 5 shopping-bag tests because the actions were not yet supported
  and returned null data.

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts
```

Expected RED result:

- Failed with `client.getCustomerShoppingBagSnapshot is not a function`.

## GREEN Evidence

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
```

Result:

- Passed, 1 test file and 47 tests.

Command:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts
```

Result:

- Passed, 1 test file and 16 tests.

## Verification

Initial full verification:

```powershell
pnpm.cmd run verify
```

Result:

- Failed at `type-check` because existing partial client test helpers needed
  defaults for the new required shopping-bag client methods.
- Before that failure, lint, boundary-check, full test, and coverage had
  passed.

Targeted type fix:

```powershell
pnpm.cmd run type-check
```

Result:

- Passed.

Final full verification:

```powershell
pnpm.cmd run verify
```

Result:

- Passed.
- `test`: passed, 57 test files and 328 tests.
- `coverage`: passed, 90.26% statements, 76.63% branches, 88.20% functions,
  90.26% lines.
- `backend:test`: passed, 12 test files and 60 tests.
- `backend:build`: passed.
- `audit:prod`: passed, no known vulnerabilities.
- `audit:all`: passed, no known vulnerabilities.

Mini-program build and smoke:

```powershell
pnpm.cmd run verify:full
```

Result:

- Passed.
- `build:mp-weixin`: passed.
- `smoke:mp-weixin`: passed; build artifacts and page routes are present.

## Manual Acceptance

Not executed. Module B exposes CloudBase/server and client contracts only. It
does not wire UI entry, page state, or product-detail add-to-bag behavior.

Manual acceptance remains open for later modules:

- first entry duration.
- return-entry duration.
- slow-network loading behavior.
- write-after-refresh behavior.
- text availability when images fail.

## Remaining Product Gaps

- Module C must add the page-facing facade and ViewModel command messages.
- Module D must wire product detail and the shopping-bag page UI after loading
  the required UI skills.
- Submit-selected-items checkout behavior is not wired in Module B; checkout
  semantics remain unchanged until the facade/UI module explicitly connects to
  the existing order-creation path.
- Production CloudBase deployment and real-device acceptance were not executed
  in this module.

## Next Module Boundary

Module C should stay limited to:

```text
src/features/customer-shopping-bag/
facade ViewModel
command message mapping
write-after-refresh facade behavior
targeted facade tests
```

Do not expand Module C into navigation redesign, UI layout, payment, logistics,
favorites, customer mine, or changed checkout semantics.
