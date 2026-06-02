# Phase 8 Product Edit Fix Delivery Log

Date: 2026-06-01
Status: CONDITIONAL PASS - unified product edit implementation is complete; reviewer and real-device acceptance are still required.

## Scope

Implemented the product-management unified edit entry only. This phase does not add payment, logistics, refund, OCR, customer service, product-code migration, or product-level price fields.

## Strategy

Used Phase 7 Strategy B:

- Core `productCode` remains read-only.
- No productCode cascade or migration was introduced.
- Editable product basics are `productName` and `description`.
- SKU `spec`, `salePrice`, and `stock` continue to use the existing SKU inventory path and inventory ledger behavior.

Reason:

`productCode` is the SPU grouping key and is copied onto SKUs and order items. Editing it safely requires a separate PRD-level cascade and historical-order policy.

## Files Changed

- `cloudfunctions/mallApi/mall-api-core.js`
  - Added `updateProductBasics`.
  - Validates `productName` and `description`.
  - Updates only `productName`, `description`, and `updatedAt`.
  - Leaves `productCode`, SKU records, order snapshots, image fields, and inventory ledger untouched.
- `cloudfunctions/mallApi/mall-api-core.test.js`
  - Added backend coverage proving product basics update does not mutate product/SKU `productCode`.
  - Added proof customer product detail reads the updated product name and description from the same product record.
- `src/services/cloudbase/mall-api-client.ts`
  - Added typed `updateProductBasics`.
- `src/services/cloudbase/mall-api-client.test.ts`
  - Added client mapping coverage proving `productCode` is not sent in the update payload.
- `src/features/owner-products/owner-products.ts`
- `src/features/mall-workflow/mall-workflow.ts`
- `src/features/cloudbase-mall/owner-products.ts`
  - Added local and CloudBase facade paths for product basics update.
  - Kept validation narrow: non-empty product name and description length limit.
- `src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - Added facade coverage for trimmed product basics updates without productCode mutation.
- `src/pages/owner/products/useOwnerProductsPageState.ts`
  - Added unified product editor state.
  - Prefills product name, read-only product code, description, image status, and SKU drafts.
  - Saves product basics through the facade and refreshes the product list.
  - Keeps SKU save/restock/clear paths on existing facade methods.
- `src/pages/owner/products/index.vue`
  - Replaced split `编辑简介` / `规格库存` card actions with one `编辑` entry.
  - Unified editor sections:
    - Basic info
    - Read-only product code
    - Product description
    - Image status
    - SKU spec / sale price / stock
- `src/pages/owner/products/useOwnerProductsPageState.test.ts`
  - Added source-contract coverage for the unified edit entry and read-only product code.
  - Added page-state coverage for saving product basics without productCode mutation.

## Preserved Contracts

- Page shell still imports only `useOwnerProductsPageState`.
- Page-state still calls feature facades; it does not write repositories, collections, `mockDb`, or `wx.cloud`.
- Core `productCode` semantics remain unchanged.
- SKU stock changes still use SKU actions and preserve inventory ledger behavior.
- Existing publish, unpublish, delete, image status, and batch publish paths were not redesigned.

## Automated Evidence

- Product-edit targeted tests:
  - `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/pages/owner/products/useOwnerProductsPageState.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/cloudbase/mall-api-client.test.ts`
  - Result: 4 files / 133 tests passed.
- Type check:
  - `pnpm.cmd run type-check`
  - Result: passed.
- Lint:
  - `pnpm.cmd run lint`
  - Result: passed.
- Mini-program build:
  - `pnpm.cmd run build:mp-weixin`
  - Result: passed.

## Remaining Acceptance Gap

This is not a real-device PASS. Manual WeChat DevTools or real-device validation must still confirm:

- Product management shows one `编辑` entry.
- The editor allows product name and description updates.
- Product code is visible but read-only.
- SKU spec / price / stock editing still works.
- Owner product list refreshes after save.
- Customer product list/detail show updated product name and description.
- Re-entering the mini-program preserves updated data.

## Recommendation

Proceed to Phase 9 reviewer for product-edit changes. Do not mark Round 2 PASS before manual acceptance evidence is captured.
