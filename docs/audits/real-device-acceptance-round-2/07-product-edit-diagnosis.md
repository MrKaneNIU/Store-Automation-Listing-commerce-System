# Phase 7 Product Edit Diagnosis

Date: 2026-06-02
Status: NEEDS_PHASE_8_FIX
Scope: read-only diagnosis for owner product-management unified edit entry only.

No business code, CloudBase data, storage objects, deployment, schema, or tests were changed in this phase. The only write in this phase is this audit document.

## Root Cause Conclusion

The current owner product-management page does not have a unified product edit entry. It has separate narrow entries:

- Description edit.
- SKU/spec/price/stock edit.
- Batch restock and stock clear.
- Publish, unpublish, and delete lifecycle actions.

There is no current owner-side entry for editing `productName`, `productCode`, product-level base price, or a unified SPU edit form. Product price is effectively SKU `salePrice`; product list minimum price is derived by facade/backend, not stored as an editable product field.

`productCode` is not a safe field to edit as a normal published-product form field. It is currently both the SPU grouping key and a copied SKU grouping/search key. It is also copied into order items at order creation time. Editing it safely would require uniqueness checks plus a deliberate cascade policy across `products`, `skus`, downstream display/search surfaces, and historical order semantics.

Recommendation: use Strategy B for Phase 8. Do not edit core `productCode` on existing/published products. If a user-visible alternate code is needed, add a non-core `displayCode` or `alias` concept behind a dedicated PRD/schema/API plan. For the immediate product edit capability, keep `productCode` read-only and add only low-risk editable fields such as `productName` and `description`, while preserving the existing SKU workbench for `spec`, `salePrice`, and `stock`.

## Current Owner Product-Management Entries

Page shell:

- `src/pages/owner/products/index.vue:52` renders `viewModel.products`.
- `src/pages/owner/products/index.vue:71` displays `product.productCode`.
- `src/pages/owner/products/index.vue:72` displays `product.productName`.
- `src/pages/owner/products/index.vue:73` displays `product.description || descriptionFallbackText`.
- `src/pages/owner/products/index.vue:82` opens `openDescriptionEditor(product.id, product.description || '')`.
- `src/pages/owner/products/index.vue:84` opens `openSkuInventory(product.id)`.
- `src/pages/owner/products/index.vue:93` calls `publish(product.id)`.
- `src/pages/owner/products/index.vue:103` calls `unpublishProduct(product.id)`.
- `src/pages/owner/products/index.vue:112` calls `deleteProduct(product.id, product.productCode)`.

Description modal:

- `src/pages/owner/products/index.vue:130` shows the modal when `editingProductId` is set.
- `src/pages/owner/products/index.vue:141` binds `descriptionDraft`.
- `src/pages/owner/products/index.vue:144` limits description to 120 characters.
- `src/pages/owner/products/index.vue:150` calls `saveDescription`.

SKU/stock modal:

- `src/pages/owner/products/index.vue:157` shows the inventory modal when `inventoryProductId` is set.
- `src/pages/owner/products/index.vue:177` binds batch restock quantity.
- `src/pages/owner/products/index.vue:181` binds inventory reason.
- `src/pages/owner/products/index.vue:184` calls `restockSkus`.
- `src/pages/owner/products/index.vue:187` calls `clearSkuStock`.
- `src/pages/owner/products/index.vue:202` binds SKU `spec`.
- `src/pages/owner/products/index.vue:207` binds SKU `salePriceText`.
- `src/pages/owner/products/index.vue:211` binds SKU `stockText`.
- `src/pages/owner/products/index.vue:215` calls `saveSkuDraft(draft.id)`.

Page-state composable:

- `src/pages/owner/products/useOwnerProductsPageState.ts:153` reads cards through `getCloudBaseOwnerProductsView('all')`.
- `src/pages/owner/products/useOwnerProductsPageState.ts:207` opens description editing.
- `src/pages/owner/products/useOwnerProductsPageState.ts:221` opens SKU inventory.
- `src/pages/owner/products/useOwnerProductsPageState.ts:248` sends `{ spec, salePrice, stock, reason }` to `updateCloudBaseOwnerProductSku`.
- `src/pages/owner/products/useOwnerProductsPageState.ts:271` sends restock quantity/reason.
- `src/pages/owner/products/useOwnerProductsPageState.ts:293` sends stock clear reason.
- `src/pages/owner/products/useOwnerProductsPageState.ts:312` sends description to `updateCloudBaseOwnerProductDescription`.
- `src/pages/owner/products/useOwnerProductsPageState.ts:333` publishes.
- `src/pages/owner/products/useOwnerProductsPageState.ts:350` unpublishes.
- `src/pages/owner/products/useOwnerProductsPageState.ts:387` deletes.

## Editable Fields Today

Currently editable through owner product-management:

| Field | Current edit path | Backend action |
| --- | --- | --- |
| `description` | description modal | `updateProductDescription` |
| SKU `spec` | SKU inventory modal | `updateSku` |
| SKU `salePrice` | SKU inventory modal | `updateSku` |
| SKU `stock` | SKU inventory modal | `updateSku`, `restockSkus`, `clearSkuStock` |

Currently displayed but not editable in owner product-management:

| Field | Evidence |
| --- | --- |
| `productCode` | rendered at `src/pages/owner/products/index.vue:71`; no `updateProductCode`, `displayCode`, or `alias` action exists in product edit path |
| `productName` | rendered at `src/pages/owner/products/index.vue:72`; only draft review has productName patching before confirmation |
| product-level price | no `Product` price field exists; price is SKU `salePrice` in `src/domain/catalog/types.ts:21` |

Client/API contract evidence:

- `src/services/cloudbase/mall-api-client.ts:50` defines `UpdateProductDescriptionInput` with only `description`.
- `src/services/cloudbase/mall-api-client.ts:54` defines `UpdateSkuInput` with `spec`, `salePrice`, `stock`, and `reason`.
- `src/services/cloudbase/mall-api-client.ts:311` exposes `updateProductDescription`.
- `src/services/cloudbase/mall-api-client.ts:312` exposes `updateSku`.
- `src/services/cloudbase/mall-api-client.ts:431` maps description updates to mallApi action `updateProductDescription`.
- `src/services/cloudbase/mall-api-client.ts:434` maps SKU updates to mallApi action `updateSku`.

Backend action evidence:

- `cloudfunctions/mallApi/mall-api-core.js:20` lists `updateProductDescription`.
- `cloudfunctions/mallApi/mall-api-core.js:21` lists `updateSku`.
- `cloudfunctions/mallApi/mall-api-core.js:22` lists `restockSkus`.
- `cloudfunctions/mallApi/mall-api-core.js:23` lists `clearSkuStock`.
- `cloudfunctions/mallApi/mall-api-core.js:284` parses only description for product description updates.
- `cloudfunctions/mallApi/mall-api-core.js:292` parses only `spec`, `salePrice`, `stock`, and `reason` for SKU updates.
- `cloudfunctions/mallApi/mall-api-core.js:1795` implements `updateProductDescription` by replacing `description` and `updatedAt`.
- `cloudfunctions/mallApi/mall-api-core.js:1837` implements `updateSku`.
- `cloudfunctions/mallApi/mall-api-core.js:1850` calculates `quantityDelta` and writes manual inventory ledger only when stock changes.

## ProductCode Role And Coupling

Domain and schema contracts:

- `src/domain/catalog/types.ts:5` defines `Product.productCode`.
- `src/domain/catalog/types.ts:19` defines `Sku.productCode`.
- `src/domain/draft/types.ts:8` defines `ProductDraft.productCode`.
- `docs/contracts/domain-contract.md:44` states `productCode` is the SPU grouping key.
- `docs/contracts/domain-contract.md:61` states SKU `productCode` is a copy for grouping/search.
- `docs/contracts/domain-contract.md:103` states the same `productCode` creates one product.
- `docs/contracts/domain-contract.md:104` states the same `productCode + spec` creates one SKU.
- `docs/contracts/domain-contract.md:199` states product code is the SPU grouping key.
- `docs/contracts/domain-contract.md:200` states product code plus spec is the SKU grouping key.
- `docs/contracts/database-schema.md:84` states `products.product_code` is unique and remains the SPU grouping key.
- `docs/contracts/database-schema.md:97` states `skus.product_code + spec` is unique and remains the SKU grouping key.
- `backend/src/db/migrations/202605090001_initial_phase_2_schema.ts:57` makes `products.product_code` unique in SQL.
- `backend/src/db/migrations/202605090001_initial_phase_2_schema.ts:78` makes `skus.product_code, spec` unique in SQL.

CloudBase document mapping:

- `cloudfunctions/mallApi/mall-api-core.js:598` maps `Product.productCode` to `products.product_code`.
- `cloudfunctions/mallApi/mall-api-core.js:611` maps `products.product_code` back to `Product.productCode`.
- `cloudfunctions/mallApi/mall-api-core.js:624` maps `Sku.productCode` to `skus.product_code`.
- `cloudfunctions/mallApi/mall-api-core.js:633` maps `skus.product_code` back to `Sku.productCode`.

Draft confirmation:

- `cloudfunctions/mallApi/mall-api-core.js:1169` creates products from confirmed drafts.
- `cloudfunctions/mallApi/mall-api-core.js:1175` groups products by `draft.productCode`.
- `cloudfunctions/mallApi/mall-api-core.js:1191` builds SKU keys as `${draft.productCode}::${draft.spec}`.
- `cloudfunctions/mallApi/mall-api-core.js:1196` copies `draft.productCode` into each SKU.
- `cloudfunctions/mallApi/mall-api-core.js:1207` requires non-empty `productCode` before confirmation.

Orders:

- `cloudfunctions/mallApi/mall-api-core.js:655` stores `order_items.product_code`.
- `cloudfunctions/mallApi/mall-api-core.js:667` reads `order_items.product_code` into order item `productCode`.
- `cloudfunctions/mallApi/mall-api-core.js:1942` copies current `product.productCode` into the order item at order creation.
- Existing order inventory reserve/release paths identify stock by `skuId`, not by product code (`cloudfunctions/mallApi/mall-api-core.js:1954`, `cloudfunctions/mallApi/mall-api-core.js:2008`).

Inventory:

- `cloudfunctions/mallApi/mall-api-core.js:691` inventory ledger stores `sku_id`, not product code.
- `cloudfunctions/mallApi/mall-api-core.js:1245` manual inventory ledger entries are keyed to `sku.id`.
- `cloudfunctions/mallApi/mall-api-core.js:1850` calculates stock delta against the old SKU and writes a ledger entry with the original SKU id.

Image tasks:

- `src/features/cloudbase-mall/staff-image-tasks.ts:54` filters pending image tasks by `product.productCode`.
- `src/features/cloudbase-mall/staff-image-tasks.ts:89` uploads images by `entityId: productId`, not product code.
- `src/features/cloudbase-mall/staff-image-tasks.ts:100` returns a message containing `product.productCode`.
- `cloudfunctions/mallApi/mall-api-core.js:1896` supplements product images by `productId`.
- `cloudfunctions/mallApi/mall-api-core.js:1901` updates product image fields without touching `productCode`.

Drafts:

- `src/services/cloudbase/mall-api-client.ts:34` allows draft patches to include `productCode`.
- `cloudfunctions/mallApi/mall-api-core.js:249` allows `updateDraft` to patch `productCode`.
- Draft `productCode` editing is pre-confirmation review behavior, not post-product edit behavior.

## Should Published ProductCode Be Editable?

No, not as a normal Phase 8 product edit field.

Reasons:

- It is a canonical grouping key, not just display copy.
- It is duplicated from products into SKUs.
- SQL schema enforces uniqueness on product code and SKU product-code/spec pairs.
- CloudBase document paths currently have replace-based product/SKU updates but no dedicated cascade action for renaming product codes.
- Historical order items already snapshot product code at order creation. Cascading old orders would rewrite historical order facts; not cascading would make current product code differ from order snapshots. Either policy is possible, but it needs an explicit PRD decision.
- Image tasks and staff search use `productCode` as display/search metadata, while uploads and supplements are product-id keyed. This is lower risk than SKU/order coupling but still affected by a rename.

If the business truly needs editable product codes later, Strategy A must be a separate migration-class change, not a small UI repair. It needs:

- A new backend action, for example `renameProductCode(productId, newProductCode)`.
- Owner-role authorization.
- New product-code validation and uniqueness checks before write.
- Transactional product + SKU cascade.
- A written policy for historical `order_items.product_code`: immutable snapshot versus cascade.
- Tests proving duplicate prevention, SKU cascade, order policy, image-task search behavior, and failure rollback.
- CloudBase schema/index checks for product and SKU uniqueness.

## Page Layer Contract Assessment

The current owner product-management page uses page-state and facade seams rather than direct repository or CloudBase writes:

- `src/pages/owner/products/index.vue:249` imports only `useOwnerProductsPageState`.
- `src/pages/owner/products/useOwnerProductsPageState.ts:14` to `src/pages/owner/products/useOwnerProductsPageState.ts:24` imports CloudBase owner-product facade functions.
- `src/features/cloudbase-mall/owner-products.ts:48` reads cards through the `listOwnerProductCards` facade path.
- `src/features/cloudbase-mall/owner-products.ts:101` wraps `updateProductDescription`.
- `src/features/cloudbase-mall/owner-products.ts:142` wraps `updateSku`.
- `src/pages/owner/products/index.test.ts:15` asserts the page shell does not import `updateCloudBaseOwnerProductDescription` directly.
- `src/pages/owner/products/index.test.ts:42` asserts the page shell does not import SKU inventory facade functions directly.
- `src/pages/owner/products/useOwnerProductsPageState.test.ts:81` asserts facade calls stay outside the Vue page shell and that page-state does not import `mallRepository` or `mockDb`.
- `docs/contracts/page-facing-ui-contracts.md:22` to `docs/contracts/page-facing-ui-contracts.md:33` prohibits pages from direct repository writes and business-rule reimplementation.
- `docs/contracts/page-facing-ui-contracts.md:864` to `docs/contracts/page-facing-ui-contracts.md:905` freezes owner-products page-facing rules, including no publish eligibility decisions and no SKU counting in the page.

Assessment: current page layering is acceptable. Phase 8 should preserve the same page shell -> page-state composable -> feature facade -> mallApi client -> backend action layering.

## Strategy Decision

Recommended: Strategy B.

Do not edit core `productCode` in Phase 8. Treat it as read-only canonical identity for existing products, especially published products. If the acceptance issue is that the displayed code is wrong or needs merchant-friendly presentation, introduce a separate `displayCode`/`alias` plan only after a PRD/schema/API decision.

For Phase 8, implement the minimal product edit capability without touching `productCode`:

1. Add a unified edit entry from the owner product card.
2. Pre-fill read-only `productCode`.
3. Allow editing `productName` and `description`.
4. Keep SKU `spec`, `salePrice`, and `stock` in the existing SKU inventory workbench, or link to it from the unified edit sheet without changing its backend contract.
5. Do not add product-level price because the current model has no product price field.
6. Preserve publish/unpublish/delete behavior.

## Minimal Phase 8 Fix Strategy

Repository Impact Map:

- Expected source changes:
  - `src/pages/owner/products/index.vue`: add unified edit button/sheet and show `productCode` as read-only.
  - `src/pages/owner/products/useOwnerProductsPageState.ts`: add unified edit state, prefill, save, reset, and facade call.
  - `src/features/cloudbase-mall/owner-products.ts`: add a product-core update facade for `productName` + `description`.
  - `src/services/cloudbase/mall-api-client.ts`: add a typed client method for a new product-core update action.
  - `cloudfunctions/mallApi/mall-api-core.js`: add a narrow owner-only action that updates `productName`, `description`, and `updatedAt` only.
  - Tests in the corresponding page, facade/client, and mallApi suites.
- Explicitly out of scope:
  - Editing core `productCode`.
  - Cascading product code into SKUs or orders.
  - Data migration or CloudBase index changes.
  - Product-level price field.
  - Direct page repository writes.
- Business contracts to preserve:
  - `productCode` remains SPU grouping key.
  - SKU `productCode + spec` grouping remains unchanged.
  - Historical order item snapshots remain unchanged.
  - Stock updates stay in SKU/inventory actions and write ledger entries.
  - Pages keep using ViewModel/facade seams.

Implementation steps:

1. Add tests proving the page renders one unified edit entry and does not import backend/facade functions directly.
2. Add page-state tests proving the edit sheet pre-fills `productCode` read-only, saves only `productName` and `description`, and refreshes the card list.
3. Add facade/client tests for `updateOwnerProductCore(productId, { productName, description })`.
4. Add mallApi tests for:
   - owner authorization required;
   - empty `productName` rejected;
   - description max length preserved;
   - `productCode`, image fields, status, SKUs, orders, and inventory ledger untouched.
5. Implement the smallest backend action, for example `updateProductCore`, that only replaces `productName`, `description`, and `updatedAt`.
6. Wire facade -> client -> page-state -> page.
7. Run targeted tests first:
   - `pnpm.cmd vitest run src/pages/owner/products/index.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts`
   - `pnpm.cmd vitest run src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/cloudbase/mall-api-client.test.ts`
   - `pnpm.cmd vitest run cloudfunctions/mallApi/mall-api-core.test.js`
8. Run the strongest matching gate:
   - `pnpm.cmd run verify`
   - `pnpm.cmd run verify:full` if mallApi/runtime build output is changed.

## Residual Risks

- This diagnosis did not invoke remote CloudBase contracts; it is source-level read-only evidence.
- Current working tree contains many unrelated uncommitted changes. Phase 8 must stage only the product-edit files and avoid mixing customer/runtime stabilization changes into this fix.
- If acceptance explicitly requires editing `productCode`, Strategy B will not satisfy that requirement. That would need a new PRD-level decision and Strategy A cascade design.
