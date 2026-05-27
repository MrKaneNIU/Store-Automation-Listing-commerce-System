# 2026-05-27 Project Latency Optimization Module 3 Log

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
src/features/cloudbase-mall/customer-product-detail.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
src/pages/customer/product-detail/index.vue
src/pages/customer/product-detail/index.test.ts
src/services/auth/cloudbase-wechat-auth-service.test.ts
docs/contracts/page-facing-ui-contracts.md
docs/testing/2026-05-27-page-performance-baseline.md
docs/plans/2026-05-27-project-latency-optimization-module-3-log.md
```

Explicitly out of scope:

```text
product management
draft review
staff image tasks
order confirmation
cart/favorites/mine/payment/logistics
inventory reservation/release semantics
WeChat auth semantics
page template/style/visual layout
```

Preserved contracts:

- Customer product list remains list-card oriented and does not resolve detail
  image arrays.
- Customer order submission still revalidates product, SKU, and inventory
  through the existing order creation path.
- Sold-out SKUs remain visible on detail surfaces but are not orderable.
- The customer product detail page did not receive template, style, or visual
  layout changes.

## Module 3 Deliverables

### Customer Detail Aggregation

Added the aggregated mallApi action:

```text
getPublishedProductDetail(productId)
```

The action returns one published product detail snapshot, its SKU list, and
server time. It returns an empty snapshot when the product is missing,
unpublished, or no longer satisfies publish eligibility.

### CloudBase Detail Facade

Updated the CloudBase customer product detail facade to load detail data through
`client.getPublishedProductDetail(productId)`. The facade no longer calls
`listPublishedProducts` to search for one product, and no longer performs a
standalone first-entry `listSkus(productId)` call.

### Local SKU Selection

Added a ViewModel-local SKU selector for the CloudBase detail runtime:

```text
selectCloudBaseCustomerProductSkuInView(view, skuId)
```

The customer product detail page now uses that selector for SKU clicks. It
updates selected flags in page state, preserves sold-out SKU visibility, and
does not trigger a remote detail reload for pure SKU selection.

## Verification

RED:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/customer/product-detail/index.test.ts
```

Result: failed as expected because the aggregated detail action and client
method did not exist yet, the facade still depended on the old product-list plus
SKU-read path, and the page script did not use local ViewModel SKU selection.

GREEN:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/customer/product-detail/index.test.ts
```

Result: passed, 4 test files and 73 tests.

Final automated gates:

```powershell
pnpm.cmd run verify
```

Result: passed. The gate completed lint, boundary checks, unit tests,
coverage, type-check, backend tests/build, and dependency audits. Frontend test
summary: 54 test files and 301 tests passed. Backend test summary: 12 test
files and 60 tests passed. Coverage remained above the configured threshold.
Both production and full dependency audits reported no known vulnerabilities.

```powershell
pnpm.cmd run verify:full
```

Result: passed. The full gate reran `verify`, built the mp-weixin bundle, and
passed the mp-weixin artifact/page-route smoke check.

## Remaining Module 3 Gaps

- WeChat DevTools or real-device manual acceptance has not been executed.
- CloudBase deployed-function smoke against a real environment was not executed
  in this local module pass.
- Shared page snapshot cache and in-flight request dedupe remain outside this
  module boundary.

## Next Module Boundary

Next module should start from the PRD-defined shared page snapshot cache and
write-side invalidation rules. Do not expand this module into unrelated order,
payment, logistics, cart, favorites, mine, or UI redesign work.
