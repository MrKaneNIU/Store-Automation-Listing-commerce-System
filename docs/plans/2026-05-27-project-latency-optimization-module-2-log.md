# 2026-05-27 Project Latency Optimization Module 2 Log

## Repository Impact Map

Governing PRD:

```text
docs/prd/2026-05-27-project-latency-optimization-prd.md
```

Completed scope:

```text
src/services/storage/product-image-url.ts
src/services/storage/product-image-url.test.ts
src/services/storage/cloudbase-upload-service.ts
src/services/storage/cloudbase-upload-service.test.ts
src/features/cloudbase-mall/customer-product-list.ts
src/features/cloudbase-mall/owner-products.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
docs/contracts/page-facing-ui-contracts.md
docs/testing/2026-05-27-page-performance-baseline.md
docs/plans/2026-05-27-project-latency-optimization-module-2-log.md
```

Explicitly out of scope:

```text
src/pages/
orders/payment/logistics/cart/favorites/mine
OCR semantics
inventory/order/permission/data-model changes
new customer-side modules
```

Preserved contracts:

- Product records continue to keep durable `cloud://` file IDs as canonical
  image values.
- Signed temporary URLs are never treated as durable product image data.
- Customer product detail still resolves detail images on the detail surface.
- Owner product management still uses `listOwnerProductCards` for first-screen
  data and does not reintroduce SKU N+1 reads.
- No page visual, layout, or interaction code was changed.

## Module 2 Deliverables

### Shared Product Image URL Resolution

Added shared image resolution behavior:

- `resolveProductImageUrls()` accepts multiple image URLs.
- blank values and signed CloudBase temp URLs resolve to empty strings.
- repeated `cloud://` IDs are deduped before `refreshAssetUrls()`.
- resolved temporary URLs are cached for 45 minutes.
- `resolveProductImageFields()` now batches main/detail IDs for detail surfaces.

### CloudBase Storage Refresh

Updated CloudBase upload service refresh:

- `getTempFileURL` receives unique file IDs in one request.
- caller result order and duplicate positions are preserved.
- CloudBase temp URL `maxAge` is now 2700 seconds.

### List/Detail Image Layering

Updated CloudBase facades:

- customer product list resolves only `mainImageUrl` and returns `imageUrls: []`.
- owner product management resolves list main images in a batch.
- owner product detail image arrays remain unresolved in the list snapshot.

## Verification

RED:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/cloudbase-upload-service.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
```

Result: failed as expected because image URL batch/cache helpers did not exist,
CloudBase refresh still used one-hour maxAge/partial batching, and the customer
product list still resolved detail image arrays.

GREEN:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/cloudbase-upload-service.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
```

Result: passed, 3 test files and 27 tests.

Final automated gates:

```powershell
pnpm.cmd run verify
```

Result: passed. The gate completed lint, boundary checks, unit tests,
coverage, type-check, backend tests/build, and dependency audits. Frontend test
summary: 54 test files and 295 tests passed. Backend test summary: 12 test
files and 60 tests passed. Coverage remained above the configured threshold.
Both production and full dependency audits reported no known vulnerabilities.

```powershell
pnpm.cmd run verify:full
```

Result: passed. The full gate reran `verify`, built the mp-weixin bundle, and
passed the mp-weixin artifact/page-route smoke check.

## Remaining Module 2 Gaps

- WeChat DevTools or real-device manual acceptance has not been executed.
- CloudBase deployed-function/storage smoke is not executed in this local
  module pass.
- In-flight request dedupe for whole page snapshots remains part of the shared
  page snapshot cache module.

## Next Module Boundary

Next module should start from the PRD-defined customer product list/detail
aggregation work. Do not expand this module into cart, favorites, payment,
logistics, mine, or unrelated UI redesign.
