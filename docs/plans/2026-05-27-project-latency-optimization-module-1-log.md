# 2026-05-27 Project Latency Optimization Module 1 Log

## Repository Impact Map

Governing PRD:

```text
docs/prd/2026-05-27-project-latency-optimization-prd.md
```

Completed scope:

```text
cloudfunctions/mallApi/mall-api-core.js
cloudfunctions/mallApi/mall-api-core.test.js
src/services/cloudbase/mall-api-client.ts
src/services/cloudbase/mall-api-client.test.ts
src/features/cloudbase-mall/owner-products.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
src/pages/owner/products/useOwnerProductsPageState.ts
src/pages/owner/products/useOwnerProductsPageState.test.ts
docs/contracts/page-facing-ui-contracts.md
docs/testing/2026-05-27-page-performance-baseline.md
docs/plans/2026-05-27-project-latency-optimization-module-1-log.md
```

Explicitly out of scope:

```text
src/pages/owner/products/index.vue
src/pages/customer/
src/features/customer-product-list/
src/features/customer-product-detail/
src/features/owner-draft-review/
src/features/staff-image-tasks/
src/features/owner-orders/
orders/payment/logistics/cart/favorites/mine
```

Preserved contracts:

- Existing product publish, batch publish, unpublish, delete, description save,
  SKU update, restock, and clear-stock outcomes remain unchanged.
- SKU inventory drawer still reads single-product SKU details on demand.
- Page code still consumes page-facing state/facade only.
- Service-side product-management permission is required for
  `listOwnerProductCards`.
- Product canonical image fields are not rewritten with signed temporary URLs.

## Module 1 Deliverables

### Aggregated mallApi Action

Added:

```text
listOwnerProductCards
```

The action:

- requires owner/product-management permission.
- reads `products` once.
- reads `skus` once.
- groups SKU data by `productId` server-side.
- returns product card fields, `statusLabel`, `skuCount`, `canPublish`,
  `publishBlockReasons`, `readyProductCount`, and `serverTime`.

### CloudBase Client and Facade

Added `CloudBaseMallApiClient.listOwnerProductCards()`.

Updated owner-products CloudBase facade:

- first-screen list view uses `listOwnerProductCards`.
- first-screen owner-products view no longer calls `listProducts` or
  per-product `listSkus`.
- list rendering resolves only `mainImageUrl`; detail image arrays are not
  resolved as part of the first-screen list.
- signed temporary image URLs are stripped from page-facing image fields.
- batch publish uses the aggregated cards to avoid N+1 eligibility reads.

### Page State

Updated owner-products page state:

- `refreshView()` loads the all-products snapshot once.
- status tab changes filter the already loaded card set locally.
- tab filtering does not trigger another remote owner-products list read.

## Verification

RED:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts
```

Result: failed as expected because `listOwnerProductCards` and local tab
filtering were not implemented.

GREEN:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts
```

Result: passed, 4 test files and 69 tests.

Final automated gates:

```powershell
pnpm.cmd run verify
```

Result: passed. The gate completed lint, boundary checks, unit tests,
coverage, type-check, backend tests/build, and dependency audits. Frontend test
summary: 54 test files and 292 tests passed. Backend test summary: 12 test
files and 60 tests passed. Coverage remained above the configured threshold.
Both production and full dependency audits reported no known vulnerabilities.

```powershell
pnpm.cmd run verify:full
```

Result: passed. The full gate reran `verify`, built the mp-weixin bundle, and
passed the mp-weixin artifact/page-route smoke check.

## Remaining Module 1 Gaps

- WeChat DevTools or real-device manual acceptance has not been executed.
- Unified 30-60 second page snapshot cache is intentionally deferred to the
  shared cache module, instead of creating a one-off owner-products global
  cache.
- CloudBase deployed-function smoke is not executed in this local module pass.

## Next Module Boundary

Next module should start from image URL governance or the next PRD-defined
module only after this module passes full automated gates and the user accepts
the boundary. Do not expand this module into customer cart, favorites, payment,
logistics, or unrelated UI redesign.
