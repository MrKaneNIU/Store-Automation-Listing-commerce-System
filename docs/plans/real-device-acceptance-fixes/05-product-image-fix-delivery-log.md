# Real Device Acceptance Failure - Phase 5 Product Image Fix Delivery Log

Captured: 2026-06-01 17:40:23 +08:00

Agent phase: `agents.prd_implementer.toml`

Status: `IMPLEMENTED`

Overall real-device acceptance status remains: `FAIL`.

## Scope

This phase fixes the product image display chain for the Phase 0 failures:

- Product image preview missing.
- Owner product management preview still shows `NO IMAGE`.

In scope:

- Preserve durable `cloud://` product image storage.
- Preserve signed temporary URL generation for rendering.
- Stop the owner product page from re-blocking already-normalized render URLs.
- Add tests using a real CloudBase-shaped signed temporary URL.

Out of scope:

- Product detail order creation.
- Draft confirmation clearing.
- Staff image task batch filter labels.
- Account management and registration wording/password fields.
- Payment, logistics, refunds, coupons, customer service, or OCR expansion.

## Repository Impact Map

Modified files for this phase:

- `src/pages/owner/products/index.vue`
- `src/pages/owner/products/useOwnerProductsPageState.ts`
- `src/pages/owner/products/useOwnerProductsPageState.test.ts`
- `src/services/storage/product-image-url.test.ts`
- `src/features/cloudbase-mall/cloudbase-mall.test.ts`

Business contracts intentionally preserved:

- Product records continue storing durable `cloud://` file IDs as canonical image values.
- Signed CloudBase temporary URLs are still rejected when they arrive as canonical product data input.
- Page-facing ViewModels may contain fresh signed temporary URLs after `refreshAssetUrls` resolves a durable file ID.
- Customer product list/detail behavior remains unchanged in this phase.

Known unrelated dirty work intentionally left untouched:

- CloudBase schema/staging scripts and package scripts from the earlier stabilization work.
- Customer mine/shopping-bag/favorites runtime stabilization files outside the product image chain.
- Existing checkout-auth tests already present in `src/features/cloudbase-mall/cloudbase-mall.test.ts`.

## Root Cause Fixed

The product data and storage chain were valid:

- The product record stores a durable `cloud://` file ID.
- CloudBase storage can resolve the file ID into a signed temporary URL.
- `resolveProductImageUrls()` returns that signed temporary URL as a page render URL.

The owner product page then called `isRenderableOwnerProductImageUrl(product.mainImageUrl)` in the template. That predicate is correct for canonical data validation because it rejects signed temporary URLs, but it is too strict for an already-normalized page-facing render URL.

The page therefore rejected a fresh signed temporary render URL and showed `NO IMAGE`.

## Implementation

Changed behavior:

- The owner product page now renders any non-empty `product.mainImageUrl` already provided by the page-facing ViewModel.
- The owner page state no longer exports the canonical-data image predicate to the template.
- The storage URL tests now prove that a signed temporary URL returned by `refreshAssetUrls` is preserved as a render URL.
- The CloudBase mall facade tests now mock upload URL refresh explicitly and prove customer list, customer detail, and owner product ViewModels keep fresh signed temporary URLs resolved from durable `cloud://` IDs.

No data model, CloudBase API contract, or product write-path contract was changed.

## Verification

Focused product image tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/products/index.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts
```

Result:

- passed.
- 6 files, 74 tests.

Full verification:

```powershell
pnpm.cmd run verify:full
```

Result:

- passed.
- Root Vitest: 75 files, 461 tests.
- Backend Vitest: 12 files, 61 tests.
- Coverage: 91.68 statements, 78.59 branches, 89.37 functions, 91.68 lines.
- `audit:prod` and `audit:all`: no known vulnerabilities found.
- `e2e:smoke`: passed.
- `mp:runtime-audit`: passed.

## Remaining Work

Proceed to read-only Reviewer re-audit for this product image phase.

This phase still requires manual WeChat DevTools/real-device confirmation that:

- Owner product management no longer shows `NO IMAGE` for the tested product.
- Customer product list/detail images load successfully on device.
- If customer image loading still fails, capture the `image @error` detail before changing customer rendering behavior.

The overall PRD remains incomplete until every baseline failure is fixed and manual acceptance passes.
