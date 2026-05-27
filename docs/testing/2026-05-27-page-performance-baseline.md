# 2026-05-27 Page Performance Baseline

This document is the Module 0 baseline for
`docs/prd/2026-05-27-project-latency-optimization-prd.md`.

It records current P0 page remote action shape and target budgets before any
business optimization. It is not a manual acceptance record.

## Shared Budget

| Item | Baseline Budget |
| --- | --- |
| First visible loading/cache/empty state | 300ms |
| Cached content visible when available | 500ms |
| Fresh data p75 under normal network | 1500ms |
| Fresh data p95 under normal network | 3000ms |
| Remote failure enters explainable state | 3000ms |
| Page snapshot fresh TTL | 30s |
| Page snapshot stale-while-revalidate TTL | 60s |
| CloudBase temp image URL cache TTL | 45min |

Write operations must explicitly invalidate only affected snapshots. Cached
stock and signed image URLs must not become canonical business truth.

## P0 Baseline Table

| P0 Page | Current Remote Business Actions | Current Bottleneck | Target Snapshot Key | Target First-screen Remote Budget |
| --- | --- | --- | --- | --- |
| Customer product list | `listPublishedProductSummaries` once | Resolves full product image fields for each listed product, including detail image arrays. | `customer-product-list:v1` | O(1), one list-card action; main image only. |
| Customer product detail | `listPublishedProducts` once, then `listSkus(productId)` once when found | Pulls all published products to find one product; SKU selection path can reload the detail view. | `customer-product-detail:{productId}:v1` | O(1), one `getPublishedProductDetail(productId)` action. |
| Owner product management | `listProducts` once, then `listSkus(productId)` once per product | N+1 SKU reads; resolves full product image fields per product; status tab switching refreshes remotely. | `owner-products:list:v1` | O(1), one `listOwnerProductCards` action. |
| Owner draft review | `getLatestDrafts` once | Current first-screen action count is O(1), but no shared trace/cache budget is recorded yet. | `owner-draft-review:latest:v1` | O(1), one latest-draft snapshot action. |
| Staff image tasks | `listOcrBatches` once and `listPendingImageTasks` once | Two parallel reads are composed in the facade; keyword and batch filtering should remain local after snapshot load. | `staff-image-tasks:list:v1` | O(1), one `getStaffImageTaskSnapshot` action. |
| Owner order confirmation | `listMerchantOrders` once | Current first-screen action count is O(1), but no shared cache/loading/write-refresh rule is recorded yet. | `owner-orders:list:v1` | O(1), one order snapshot/list action. |

## Current Owner Product N+1 Evidence

The current CloudBase owner product facade performs:

```text
getCloudBaseOwnerProductsView
-> client.listProducts()
-> products.map(toListItem)
-> toListItem(product)
-> client.listSkus(product.id)
-> resolveProductImageFields(product, uploadService)
```

For N products, the current first-screen business action count is:

```text
1 listProducts + N listSkus
```

The Module 1 target is:

```text
1 listOwnerProductCards
```

Status tab changes must be local filtering over cached cards and must not
trigger a fresh `listOwnerProductCards` request by default.

Module 1 implementation result:

```text
getCloudBaseOwnerProductsView
-> client.listOwnerProductCards()
-> resolve only product.mainImageUrl for display
-> page state filters selected status locally
```

Targeted tests now assert that `listOwnerProductCards` is one mallApi action,
the CloudFunction reads `products` once and `skus` once, the facade no longer
calls `listProducts` or per-product `listSkus` for the owner-products first
screen, and status tab changes do not trigger another remote refresh.

## Module 2 Image URL Strategy Result

Module 2 introduces a shared product image URL resolver:

```text
resolveProductImageUrls
-> normalize blank and signed CloudBase temp URLs to empty strings
-> batch unique cloud:// file IDs
-> cache resolved temporary URLs for 45 minutes
-> return renderable URLs without mutating canonical product image fields
```

CloudBase storage URL refresh now calls `getTempFileURL` with unique file IDs
and `maxAge: 2700`.

Customer product list now resolves only `mainImageUrl` for the list snapshot and
returns an empty `imageUrls` array. Customer product detail continues to resolve
detail image fields on the detail page. Owner product management resolves list
main images in one batch and leaves detail image arrays unresolved.

Targeted tests now assert:

- repeated `cloud://` IDs resolve once and then hit the 45-minute cache.
- `resolveProductImageFields` batches main/detail IDs for detail surfaces.
- CloudBase storage refresh dedupes file IDs and preserves caller order.
- customer product list does not resolve detail image arrays.
- owner product list resolves repeated main images through the shared batch
  path while preserving unresolved detail image IDs for non-list surfaces.

## Module 3 Customer Detail Aggregation Result

Module 3 introduces an aggregated customer product detail action:

```text
getPublishedProductDetail(productId)
-> read products once
-> read skus(productId) once
-> return a published product detail snapshot, SKU list, and serverTime
```

The CloudBase customer product detail facade now loads detail data through this
single mallApi action instead of calling `listPublishedProducts` to find one
product and then calling `listSkus(productId)` from the facade. Detail image
fields are still resolved only on the detail page.

SKU selection is now local after the detail ViewModel is loaded:

```text
selectCloudBaseCustomerProductSkuInView(view, skuId)
-> update selected SKU flags in the existing ViewModel
-> preserve sold-out SKU visibility
-> disable submit for sold-out or missing SKU selections
```

The order submission path remains server-validated through the existing
customer order creation flow, so local SKU selection does not become canonical
inventory truth.

Targeted tests now assert:

- `getPublishedProductDetail(productId)` maps to one mallApi action.
- the CloudFunction performs one products read and one SKU read for the detail
  snapshot.
- unpublished or publish-invalid products return an empty detail snapshot.
- the CloudBase detail facade does not call `listPublishedProducts` or
  standalone `listSkus` for first entry.
- SKU clicks update the loaded ViewModel locally without another remote detail
  read.
- sold-out SKUs remain visible but cannot submit an order.

## Module 4 Staff Image And Draft Snapshot Result

Module 4 introduces a staff image task snapshot:

```text
getStaffImageTaskSnapshot
-> read OCR batches once
-> read products once
-> return batch options source data, pending-image products, and serverTime
```

The CloudBase staff image task facade now loads first-screen data through this
single mallApi action instead of composing `listOcrBatches` and
`listPendingImageTasks` in the facade. Keyword search and batch switching are
local filters over the loaded ViewModel and do not trigger a remote read by
default.

Module 4 also introduces a draft review snapshot:

```text
getLatestDraftReviewSnapshot
-> read OCR batches once
-> read drafts for the latest batch once
-> return latest batch, drafts, and serverTime
```

The CloudBase draft review facade now uses that explicit snapshot action while
preserving the existing ViewModel-derived low-confidence, field-source,
completion, and price-conflict flags.

Targeted tests now assert:

- `getStaffImageTaskSnapshot` maps to one mallApi action.
- `getLatestDraftReviewSnapshot` maps to one mallApi action.
- the staff image CloudFunction snapshot performs one batch read and one
  products read.
- the draft review CloudFunction snapshot performs one batch read and one
  drafts read.
- staff image task keyword and batch filtering use the loaded ViewModel
  locally after the snapshot read.
- staff image task snapshots require product-management permission.

## Module 5 Order And Dashboard Snapshot Result

Module 5 introduces an owner order snapshot:

```text
getOwnerOrderSnapshot
-> read orders once
-> return owner order list and serverTime
```

The CloudBase owner order facade now reads this snapshot instead of calling the
legacy merchant-order list path for page entry. Confirm and cancel commands
remain unchanged, and the page refreshes the order snapshot after each write so
command results do not become cached final truth.

Module 5 also introduces an owner dashboard snapshot:

```text
getOwnerDashboardSnapshot
-> read OCR batches once
-> read latest-batch drafts once
-> read products once
-> read orders once
-> return pending draft, image task, and order counts plus serverTime
```

The dashboard page now loads first-screen counts through this facade instead of
hard-coded page constants. The owner orders, owner dashboard, and homepage
settings pages now expose loading and failure state for their low-frequency
reads. The owner orders and dashboard pages also dedupe in-flight refreshes.

Targeted tests now assert:

- `getOwnerOrderSnapshot` maps to one mallApi action.
- `getOwnerDashboardSnapshot` maps to one mallApi action.
- the owner order CloudFunction snapshot performs one orders read.
- the owner dashboard CloudFunction snapshot performs bounded aggregate reads.
- owner order confirm/cancel still use the existing command paths and refresh
  the server snapshot after writes.
- dashboard counts come from the CloudBase facade instead of hard-coded page
  values.
- homepage settings reads are wrapped with loading and failure state.

## Module 6 Frozen Performance Gate

The module 0-6 baseline is frozen with these automatic quality gates:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/orders/index.test.ts src/pages/owner/dashboard/index.test.ts src/pages/owner/homepage-settings/index.test.ts
pnpm.cmd run verify
pnpm.cmd run verify:full
git diff --check
```

The performance gate requires every future P0 page change to document:

1. Target snapshot key.
2. First-screen remote business action budget.
3. Whether page filters/search/tabs are local or remote.
4. Cache/freshness behavior.
5. Write-after-refresh behavior.
6. Failure-state behavior.
7. Manual acceptance status.

Automatic verification can prove action count, test coverage, build integrity,
and smoke artifact presence. It must not be described as WeChat DevTools or
real-device manual acceptance.

## Trace Contract

Module 0 adds `src/services/performance/page-load-trace.ts` as a pure tracing
contract. It records:

- page name, start/end timestamps, cache status, and failure reason.
- remote action name, params shape, duration, status, and error code.
- image resolution count, duration, status, and error code.
- remote action count summary for O(1) budget tests.

The params shape records types and collection sizes, not raw values. Sensitive
keys such as `secret`, `token`, `openid`, `phone`, `password`, `authorization`,
and signed URL query data are redacted or reduced to shape-only markers.

## Manual Acceptance Status

No WeChat DevTools or real-device manual acceptance has been executed for this
module 0-6 latency optimization pass. Future P0 module logs must record:

1. First entry duration.
2. Return-entry duration.
3. Slow-network loading-state understandability.
4. Post-write refresh behavior.
5. Text availability when image resolution fails.

Manual acceptance evidence must include the tested page, device or DevTools
profile, network condition, timestamp, observed result, and whether the result
passed or requires follow-up. Build smoke and route smoke are supporting
automation only; they are not manual acceptance.
