# Page-Facing UI Contracts

This document freezes the Phase 1 page-facing ViewModel and Facade contracts
for future UI redesign work.

Future UI redesigns may replace layout, components, styles, local page state,
copy presentation, popups, loading affordances, and navigation wiring. They
must not change the business meaning of these contracts without a new PRD and
updated tests.

## Global Rules

UI code may:

- Read ViewModel fields documented below.
- Keep page-local input state such as selected tab, selected SKU, keyword,
  selected batch, modal state, loading state, and toast text.
- Pass user events into documented command functions.
- Render command `message` fields as user feedback.
- Navigate between mini-program pages.

UI code must not:

- Import or write `mockDb` or repository implementations directly.
- Import mock OCR, mock upload, or mock auth adapters directly unless the
  page-facing contract explicitly accepts a test seam.
- Create product, SKU, draft, order, customer, openid, phone, OCR row, or upload
  URL values by itself.
- Re-implement stock reservation, stock restoration, publish eligibility,
  order action eligibility, draft confirmation, OCR batch creation, or status
  transition rules.
- Mutate returned domain objects in place. Use page-facing commands when a
  business change is needed.

## Customer Product List

Feature module:

- `src/features/customer-product-list/customer-product-list.ts`

UI entry point:

- `getCustomerProductListView()`

UI may read:

- `products`: published customer product list.
- `products[].id`: navigation target for product detail.
- `products[].productCode`
- `products[].productName`
- `products[].mainImageUrl`
- `products[].imageUrls`
- `products[].status`: display only; customer page should receive published
  products only.
- `products[].createdFromBatchId`
- `products[].createdAt`
- `products[].updatedAt`
- `products[].minPrice`: feature-derived minimum SKU price or `-`.
- `emptyMessage`

UI may pass:

- No command parameters. Product detail navigation may pass `products[].id` to
  the detail route.

UI must not:

- Call `mallAccess.listPublishedProducts()` or `mallAccess.getMinSkuPrice()`
  from the page.
- Show unpublished products by bypassing this ViewModel.
- Calculate minimum SKU price in the page.

Test protection:

- `src/features/customer-product-list/customer-product-list.test.ts`

## Customer Product Detail

Feature module:

- `src/features/customer-product-detail/customer-product-detail.ts`

UI entry points:

- `getCustomerProductDetailView(productId, selectedSkuId?)`
- `selectCustomerProductSku(productId, skuId)`
- `submitCustomerProductDetailOrder(params)`

UI may read:

- `product`: product detail or `null`.
- `product.id`
- `product.productCode`
- `product.productName`
- `product.mainImageUrl`
- `product.imageUrls`
- `product.status`
- `product.createdFromBatchId`
- `product.createdAt`
- `product.updatedAt`
- `skus[].id`
- `skus[].spec`
- `skus[].salePrice`
- `skus[].stock`
- `skus[].isSelected`
- `skus[].isDisabled`
- `isPublished`
- `canSubmitOrder`
- `emptyMessage`
- command `status`, `order`, and `message`

UI may pass:

- `productId`: route product id.
- `selectedSkuId`: page-local selected SKU id.
- `skuId`: selected SKU id for selection/order commands.
- `quantity`: optional order quantity.
- `confirmLogin`: UI confirmation callback.
- `confirmPhoneAuthorization`: UI confirmation callback.
- `authService`: only for tests or explicitly approved non-page wiring.

UI must not:

- Decide whether a SKU is disabled by stock in the page.
- Decide whether product status allows ordering in the page.
- Create orders directly through workflow or repository APIs.
- Call mock WeChat auth service directly from the page.
- Reserve or restore stock in the page.

Test protection:

- `src/features/customer-product-detail/customer-product-detail.test.ts`

## Owner Screenshot Import

Feature module:

- `src/features/owner-screenshot-import/owner-screenshot-import.ts`

UI entry points:

- `createOwnerScreenshotDescriptors(tempFilePaths, existingCount)`
- `removeOwnerScreenshotDescriptor(screenshots, imageId)`
- `startOwnerScreenshotRecognition(screenshots)`

UI may read:

- screenshot descriptor `id`
- screenshot descriptor `url`
- screenshot descriptor `name`
- recognition `batch.id`
- recognition `batch.status`
- recognition `batch.imageUrls`
- recognition `batch.createdAt`
- recognition `batch.updatedAt`
- recognition `drafts`
- recognition `totalDraftCount`
- recognition `needsCompletionCount`
- recognition `message`

UI may pass:

- `tempFilePaths`: result of `uni.chooseImage`.
- `existingCount`: current selected screenshot count.
- `screenshots`: current selected screenshot descriptors.
- `imageId`: descriptor id to remove.

UI must not:

- Call `createId()` in the page to create uploaded image ids.
- Call `mallWorkflow.createMockImportBatch()` directly from the page.
- Count incomplete drafts or compose OCR result summaries in the page.
- Generate mock OCR rows or batch ids in the page.

Test protection:

- `src/features/owner-screenshot-import/owner-screenshot-import.test.ts`

## Owner Draft Review

Feature module:

- `src/features/owner-draft-review/owner-draft-review.ts`

UI entry points:

- `getOwnerDraftReviewView()`
- `updateOwnerDraftReviewDraft(draftId, field, value)`
- `deleteOwnerDraftReviewDraft(draftId)`
- `confirmLatestOwnerDraftReviewBatch()`

UI may read:

- `latestBatchId`
- `groups[].productCode`
- `groups[].hasPriceConflict`
- `groups[].drafts`
- draft fields from `ProductDraft`
- `drafts[].isNeedsCompletion`
- `drafts[].isLowConfidence`
- `needsCompletionCount`
- `lowConfidenceCount`
- `priceConflictCount`
- `canConfirm`
- `emptyMessage`
- command `message`

UI may pass:

- `draftId`
- `field`: `keyof ProductDraft`
- `value`: string or number from the page input.

UI must not:

- Group drafts by product code in the page.
- Derive low-confidence, needs-completion, or price-conflict flags in the page.
- Replace drafts directly through repository APIs.
- Confirm batches through workflow APIs directly from the page.
- Create products or SKUs directly from the page.

Test protection:

- `src/features/owner-draft-review/owner-draft-review.test.ts`

## Owner Products

Feature module:

- `src/features/owner-products/owner-products.ts`

UI entry points:

- `ownerProductStatusOptions`
- `getOwnerProductsView(selectedStatus)`
- `publishOwnerProduct(productId)`
- `publishReadyOwnerProducts()`

UI may read:

- `statusOptions[].label`
- `statusOptions[].value`
- `products`
- product fields from `Product`
- `products[].statusLabel`
- `products[].skuCount`
- `products[].canPublish`
- `canBatchPublish`
- `readyProductCount`
- `emptyMessage`
- command `message`

UI may pass:

- `selectedStatus`: `'all' | ProductStatus`
- `productId`

UI must not:

- Decide publish eligibility in the page.
- Count SKUs in the page.
- Publish products directly through workflow or repository APIs.
- Batch-publish by scanning product statuses in the page.

Test protection:

- `src/features/owner-products/owner-products.test.ts`

## Owner Orders

Feature module:

- `src/features/owner-orders/owner-orders.ts`

UI entry points:

- `getOwnerOrdersView()`
- `confirmOwnerOrder(orderId)`
- `cancelOwnerOrder(orderId)`

UI may read:

- `orders`
- order fields from `Order`
- `orders[].statusLabel`
- `orders[].canConfirm`
- `orders[].canCancel`
- `emptyMessage`
- command `message`

UI may pass:

- `orderId`

UI must not:

- Decide confirm/cancel eligibility in the page.
- Apply order status transitions in the page.
- Restore stock in the page.
- Call order workflow or repository APIs directly from the page.

Test protection:

- `src/features/owner-orders/owner-orders.test.ts`

## Staff Image Tasks

Feature module:

- `src/features/staff-image-tasks/staff-image-tasks.ts`

UI entry points:

- `getStaffImageTasksView({ keyword, selectedBatchId })`
- `supplementStaffProductImages(productId)`

UI may read:

- `batchOptions[].label`
- `batchOptions[].value`
- `selectedBatchLabel`
- `products`
- product fields from `Product`
- `products[].statusLabel`
- `emptyMessage`
- command `message`

UI may pass:

- `keyword`: page-local search input.
- `selectedBatchId`: page-local selected batch option.
- `productId`

UI must not:

- List pending-image products directly from access or repository APIs.
- Derive batch filter options in the page.
- Upload product images or update product status directly from the page.
- Decide image supplementation state transitions in the page.

Test protection:

- `src/features/staff-image-tasks/staff-image-tasks.test.ts`

## Contract Change Process

Any future change to fields, command parameters, command result shape, or
business meaning must:

1. Update the relevant PRD or create a stage decision record.
2. Update this contract document before changing page UI.
3. Add or update the focused feature tests listed above.
4. Run `pnpm.cmd run boundary-check`.
5. Run `pnpm.cmd test`.
6. Run `pnpm.cmd run verify:full` when the mini-program build can be affected.
