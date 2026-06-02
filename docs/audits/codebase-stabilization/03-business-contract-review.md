# Business Contract Review

Captured: 2026-06-02
Role: Reviewer
PRD phase: 3
Scope: business contract test-protection audit

## Result

Status: PASS_WITH_MANUAL_ACCEPTANCE_PENDING

The first reviewer pass found three direct backend-contract test gaps. Per the user's instruction to execute the full PRD, only tests were added; no business rules or production behavior were changed.

Added protection:

- `cloudfunctions/mallApi/mall-api-core.test.js` `allows anonymous clients to browse published product summaries and detail`
- `cloudfunctions/mallApi/mall-api-core.test.js` `rejects direct mallApi overselling before creating an order or ledger entry`
- `cloudfunctions/mallApi/mall-api-core.test.js` `releases reserved SKU stock and writes a release ledger entry when canceling a pending order`

Verification:

- `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js` passed: 73 tests.

Manual WeChat DevTools / real-device acceptance remains pending and is recorded separately from automated contract coverage.

## Contract Matrix

| # | Business contract | Test coverage | Test file | Test name | Real/manual acceptance item | Current risk |
|---|---|---|---|---|---|---|
| 1 | Incomplete drafts cannot be confirmed. | Yes | `src/features/owner-draft-review/owner-draft-review.test.ts`; `src/features/mall-workflow/mall-workflow.test.ts`; `src/domain/draft/rules.test.ts` | `blocks confirmation when required draft fields are missing...`; `blocks incomplete drafts...`; draft rule validation tests | Merchant draft-review confirmation should still be clicked in manual acceptance. | P3 |
| 2 | Repeated confirmation does not create duplicate products/SKUs. | Yes | `src/features/owner-draft-review/owner-draft-review.test.ts`; `src/features/mall-workflow/mall-workflow.test.ts`; `cloudfunctions/mallApi/mall-api-core.test.js` | `confirms complete drafts and duplicate confirmation does not create duplicate products or SKUs`; `does not create duplicate products or SKUs...`; latest draft snapshot removes confirmed drafts | Manual repeat-click confirmation should remain in acceptance list. | P3 |
| 3 | Repeated SKU merges inventory. | Yes | `src/domain/catalog/rules.test.ts`; `cloudfunctions/mallApi/mall-api-core.test.js` | `merges repeated SKU stock for the same product code and spec`; OCR/admin draft paths assert SKU grouping | Batch OCR/import with duplicate productCode/spec can be checked manually if relevant. | P3 |
| 4 | Product without a main image cannot be published. | Yes | `src/domain/catalog/rules.test.ts`; `cloudfunctions/mallApi/mall-api-core.test.js`; `tests/contracts/product-publish-validation-cases.cjs` | `returns publish blocking reasons for missing image, missing SKU, and empty stock`; shared publish validation contract tests | Merchant publish action after deleting main image should remain blocked. | P3 |
| 5 | Customers only see published products. | Yes | `src/features/customer-product-list/customer-product-list.test.ts`; `cloudfunctions/mallApi/mall-api-core.test.js` | `shows only published products...`; `returns published product summaries with min prices in one customer list call`; `returns an empty published product detail snapshot for unpublished products` | Customer list/detail real-device browse. | P3 |
| 6 | Anonymous users can browse. | Yes, direct backend contract added. | `cloudfunctions/mallApi/mall-api-core.test.js`; `src/features/cloudbase-mall/cloudbase-mall.test.ts` | `allows anonymous clients to browse published product summaries and detail`; `keeps customer product browsing open when the published summary call fails` | Real-device anonymous launch/list/detail browse remains required. | P2 until manual acceptance |
| 7 | Phone authorization happens only when checkout is clicked. | Yes | `src/pages/customer/product-detail/index.test.ts`; `src/features/cloudbase-mall/cloudbase-mall.test.ts` | `requests a WeChat phone code before submitting the order`; `submits customer orders only after real WeChat phone binding...` | Real-device click-order phone authorization prompt. | P2 until manual acceptance |
| 8 | Authorization cancellation creates no order and reserves no stock. | Yes | `src/features/cloudbase-mall/cloudbase-mall.test.ts`; `src/features/customer-product-detail/customer-product-detail.test.ts`; `cloudfunctions/mallApi/mall-api-core.test.js` | `cancels checkout without creating an order when native phone authorization returns no code`; `does not create an order or reserve stock...`; backend no-phone-before-reservation tests | Real-device cancel phone authorization. | P2 until manual acceptance |
| 9 | Order creation cannot oversell. | Yes, direct backend contract added. | `cloudfunctions/mallApi/mall-api-core.test.js`; `src/domain/order/rules.test.ts`; `src/features/mall-workflow/mall-workflow.test.ts` | `rejects direct mallApi overselling before creating an order or ledger entry`; `allows orders only for published products with enough stock`; `reserves SKU stock when creating an order and blocks overselling` | Real stock-bound checkout should still be smoke-tested. | P2 |
| 10 | Canceling a pending order releases stock. | Yes, direct backend contract added. | `cloudfunctions/mallApi/mall-api-core.test.js`; `src/features/mall-workflow/mall-workflow.test.ts`; `src/features/owner-orders/owner-orders.test.ts` | `releases reserved SKU stock and writes a release ledger entry when canceling a pending order`; `restores reserved SKU stock when canceling a pending order`; `cancels pending orders and restores reserved stock` | Merchant cancellation in manual acceptance. | P2 |
| 11 | Confirmed orders cannot be canceled. | Yes | `cloudfunctions/mallApi/mall-api-core.test.js`; `src/features/mall-workflow/mall-workflow.test.ts`; `src/features/owner-orders/owner-orders.test.ts` | `records ledger entries when merchant confirms or cancels orders`; `allows confirming or canceling only pending orders`; `keeps non-pending order protection...` | Merchant confirmed-order cancel attempt. | P3 |
| 12 | Staff cannot overreach to publish or confirm outside permission. | Mostly yes | `cloudfunctions/mallApi/mall-api-core.test.js` | `allows staff image supplementation but denies staff publishing`; `requires order-confirmation permission for admin merchant order review`; role assignment tests | Staff account manual permissions remain important because permission matrix is broad. | P2 |
| 13 | Customers cannot access merchant APIs. | Yes | `cloudfunctions/mallApi/mall-api-core.test.js` | `denies customer access to merchant APIs` | Can be covered by staging smoke / role test. | P3 |
| 14 | UI refactors cannot change ViewModel / Facade contracts. | Yes | `src/pages/owner/products/useOwnerProductsPageState.test.ts`; `src/services/cloudbase/mall-api-client.test.ts`; `src/features/cloudbase-mall/*.test.ts`; customer page-state tests | `keeps page-facing facade calls outside the Vue page shell`; `maps ... through mallApi`; customer shopping-bag/favorites/mine page-facing ViewModel tests | Page visual/manual regression remains separate. | P2 |
| 15 | Product images must use durable references, not only temp URLs. | Yes | `src/services/storage/product-image-url.test.ts`; `src/services/storage/product-image-audit.test.ts`; `src/features/cloudbase-mall/cloudbase-mall.test.ts` | `drops expired signed temporary URLs...`; `flags signed temporary URLs...`; `drops signed CloudBase temporary product image URLs from page-facing ViewModels` | Product image display on real device plus image audit. | P2 |
| 16 | Bound phone sessions do not prompt phone authorization again. | Yes | `src/features/cloudbase-mall/cloudbase-mall.test.ts`; `src/pages/customer/product-detail/index.test.ts` | `submits customer orders directly for phone-bound sessions without requesting another phone code`; `uses direct order submit only after the customer session is phone-bound` | Real-device already-bound customer checkout. | P2 until manual acceptance |
| 17 | Product basics editing does not break `productCode -> SPU` and `productCode + spec -> SKU`. | Yes | `cloudfunctions/mallApi/mall-api-core.test.js`; `src/services/cloudbase/mall-api-client.test.ts`; `src/pages/owner/products/useOwnerProductsPageState.test.ts`; `src/features/cloudbase-mall/cloudbase-mall.test.ts` | `updates product basics without mutating core productCode or SKU productCode`; `maps product basics updates through mallApi without sending core productCode`; `prefills and saves unified product basics without productCode mutation` | Owner product edit manual acceptance. | P2 |

## Reviewer Follow-Up

The original reviewer blocker was valid: contracts 6, 9, and 10 needed direct `mallApi` tests. Those gaps are now closed locally. The remaining risk is not missing automated coverage; it is pending deployment/full verification plus real WeChat acceptance.

Reviewer recheck result:

- `prd_reviewer` status: PASS.
- Recheck command: `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`.
- Recheck result: 73/73 tests passed.
- Release wording remains conditional: automated business-contract coverage is PASS, but the project remains awaiting manual WeChat acceptance.
