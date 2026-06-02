# Real Device Acceptance Failure - Phase 4 Product Image Chain Diagnosis

Captured: 2026-06-01 17:33:05 +08:00

Agent phase: `agents.prd_debugger.toml`

Status: `DIAGNOSED`

Overall real-device acceptance status remains: `FAIL`.

## Failure Area

Phase 0 product image failures:

- Product image preview missing.
- Owner product management preview still shows `NO IMAGE`.
- Customer product list/detail image display needs confirmation after owner fix.

## Evidence

Remote product data is not empty.

CloudBase `products` sample:

- `_id`: `product-mpm3rv2e-1`
- `product_code`: `122334`
- `product_name`: `衬衫`
- `status`: `published`
- `main_image_url`: `cloud://cloud1-d7gifjyzl7721b383.636c-cloud1-d7gifjyzl7721b383-1429982088/uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-TXn7kd1CsGjPd95800c2b721d9a4074c95c6077e6c24.jpg`
- `image_urls`: same durable `cloud://` fileID.

CloudBase storage can resolve that fileID into a signed temporary URL:

```text
https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-TXn7kd1CsGjPd95800c2b721d9a4074c95c6077e6c24.jpg?sign=...&t=...
```

Remote `mallApi.listPublishedProductSummaries` returns the same durable `cloud://` product image fields.

## Root Cause

Root cause class: runtime URL normalization and owner page rendering guard mismatch.

The product record correctly stores a durable `cloud://` fileID. `resolveProductImageUrls()` then resolves that fileID to a signed CloudBase temporary URL for rendering.

The owner product management page then re-applies `isRenderableOwnerProductImageUrl(product.mainImageUrl)` in the template. That predicate intentionally rejects signed CloudBase temporary URLs to prevent expired signed URLs from being persisted as canonical product data.

Because the owner page applies the canonical-data guard after the ViewModel has already normalized the URL for rendering, it rejects a freshly resolved render URL and shows `NO IMAGE`.

Relevant files:

- `src/services/storage/product-image-url.ts`
  - `isSignedCloudBaseTempUrl()` identifies signed CloudBase temporary URLs.
  - `resolveProductImageUrls()` resolves durable `cloud://` fileIDs to signed temporary render URLs.
- `src/features/cloudbase-mall/owner-products.ts`
  - `getCloudBaseOwnerProductsView()` resolves product main images before returning page-facing ViewModels.
- `src/pages/owner/products/index.vue`
  - The template still gates `product.mainImageUrl` through `isRenderableOwnerProductImageUrl()`.

## Classification

- Data contract: OK for `products`; the durable `cloud://` fileID is the intended canonical value.
- URL normalization: primary failure.
- CloudBase temp URL generation: works through storage URL resolution.
- Page rendering: owner product page blocker.
- Fixture gap: tests used `/static/logo.png?...` or non-CloudBase `renderable.example.com`, not real `tcb.qcloud.la?...sign=...` render URLs.
- Runtime-only risk: yes, because the failure shape depends on real CloudBase signed URLs.
- `uploaded_assets`: currently empty and not used by this display path. This is an audit/status gap, not the direct cause of `NO IMAGE`.
- SKU image fields: not involved; current chain is product/SPU image only.

## Customer List And Detail

Customer product list and detail pages render any non-empty `mainImageUrl`:

- `src/pages/customer/product-list/index.vue`
- `src/pages/customer/product-detail/index.vue`

If these still show gray on device after the owner guard fix, the likely remaining seam is WeChat image loading/domain behavior for signed temporary URLs. That should be verified with real-device image `@error` evidence before changing customer rendering behavior.

## Minimal Fix Plan

1. Keep product records storing `cloud://` fileIDs.
2. Do not persist signed temporary URLs.
3. In owner product page, render the already-normalized ViewModel URL with `v-if="product.mainImageUrl"`.
4. Keep `resolveProductImageUrls()` dropping signed URLs when they arrive as canonical API/data input.
5. Add tests with a real CloudBase-shaped signed temp URL returned from `refreshAssetUrls`.
6. Add owner page source test proving the template does not re-block resolved render URLs.
7. Add customer list/detail ViewModel tests proving `cloud://` resolves to signed CloudBase render URLs and remains in `mainImageUrl`.

## Read-Only Verification

The debugger ran:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts
```

Result:

- passed, 5 files, 64 tests.

This confirms the current suite misses the real signed-temp-URL shape.
