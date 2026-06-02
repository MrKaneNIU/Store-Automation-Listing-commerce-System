# Phase 2 Image Fix Delivery Log

Date: 2026-06-01
Status: CONDITIONAL PASS - automated image chain repair is implemented; real-device acceptance is still required.

## Scope

Implemented the P0-2 / P1-1 image-chain repair only. Checkout authorization, order creation, and unified product edit remain outside this phase. The working tree already contains separate checkout/auth diffs; they are not claimed as Phase 2 image evidence here.

## Files Changed

- `src/services/storage/product-image-url.ts`
  - Added `ProductImageViewModel`, image status, durable source, thumbnail, fallback reason, and alt text fields.
  - Preserved durable `cloud://` source while resolving render URLs through the existing upload service.
  - Distinguishes `missing` from `refresh_failed` so expired signed URLs are not mislabeled as products without images.
- `src/services/storage/product-image-audit.ts`
  - Added pure audit logic for durable images, signed temporary URLs, staging repair candidates, and unrecoverable records.
- `src/features/cloudbase-mall/owner-products.ts`
- `src/features/cloudbase-mall/customer-product-list.ts`
- `src/features/cloudbase-mall/customer-product-detail.ts`
  - Propagated normalized image ViewModel fields through page-facing facades.
- `src/features/owner-products/owner-products.ts`
- `src/features/customer-product-list/customer-product-list.ts`
- `src/features/customer-product-detail/customer-product-detail.ts`
  - Kept non-CloudBase/local ViewModel types compatible with the new image fields.
- `src/pages/owner/products/index.vue`
- `src/pages/owner/products/useOwnerProductsPageState.ts`
- `src/pages/customer/product-list/index.vue`
- `src/pages/customer/product-detail/index.vue`
  - Added image `error` handlers and one-shot no-loading refresh attempts.
  - Added explicit fallback copy when a product has an image source but rendering fails.
- `scripts/cloudbase-images-audit.mjs`
- `scripts/cloudbase-images-repair-staging.mjs`
- `scripts/cloudbase-schema-utils.mjs`
- `package.json`
  - Added `cloudbase:images:audit` and `cloudbase:images:repair:staging`.
  - Default audit mode is local mallApi contract audit; `--remote` uses TCB CLI, which currently times out in this shell.
- `docs/testing/real-device-acceptance-round-2/image-domain-checklist.md`
  - Added the required WeChat download-domain checklist.

## Automated Evidence

- RED confirmed before implementation:
  - Missing `resolveProductImageView`
  - Missing image audit module
  - Missing owner/customer page image error handlers
- GREEN after implementation:
  - `pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/product-image-audit.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts`
  - Result: 5 files / 47 tests passed.
- Type check:
  - `pnpm.cmd run type-check`
  - Result: passed.
- Script checks:
  - `pnpm.cmd run cloudbase:images:audit`
  - Result: script executable in local mallApi contract mode, `productsChecked: 0`.
  - Acceptance note: this local zero-product run is not product-image data evidence.
  - `pnpm.cmd run cloudbase:images:repair:staging`
  - Result: script executable in local staging-readiness mode, no local repair candidates found.
  - Acceptance note: this does not replace remote image-data audit or real-device verification.

## Remote Evidence Already Captured

- CloudBase env: `cloud1-d7gifjyzl7721b383`
- Remote `mallApi` is Active and Available.
- Remote product sample stores durable `cloud://` image IDs, not persisted signed HTTPS URLs.
- Storage object for the current product main image exists.
- Fresh signed URL responds HTTP 200 through `curl.exe -I`; unsigned public URL responds HTTP 403.
- TCB CLI remote script mode (`cloudbase:images:audit -- --remote`) timed out in this shell, so remote script evidence is not claimed.

## Remaining Acceptance Gap

This phase cannot be marked PASS until WeChat DevTools or real-device confirms:

- Customer product list image renders.
- Customer product detail gallery image renders.
- Owner product management historical image renders.
- WeChat download domain includes `https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la`.

## Recommendation

Proceed to Phase 3 reviewer for image changes, then continue to checkout auth diagnosis. Do not mark the overall Round 2 acceptance as PASS before manual real-device evidence is captured.
