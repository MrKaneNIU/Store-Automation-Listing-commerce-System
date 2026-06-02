# Business Flow Trace

## 1. Owner bulk-uploads Yun e Bao screenshots

- Page entry: src/pages/owner/import-upload/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/owner-screenshot-import.ts; src/features/owner-screenshot-import/owner-screenshot-import.ts
- Service: src/services/ocr/*; src/services/storage/*
- Domain function/file: src/domain/batch/rules.ts
- Repository / mock / CloudBase / cloud function: cloudfunctions/mallApi/mall-api-core.js createOcrBatch/processOcrJob
- Related tests: src/features/cloudbase-mall/cloudbase-mall.test.ts; backend/src/api/api-contract.test.ts
- Status: implemented with mock/real provider seams

## 2. OCR creates product drafts

- Page entry: src/pages/owner/import-upload/index.vue (exists)
- ViewModel / Facade: owner-screenshot-import facade
- Service: OCR provider -> mallApi
- Domain function/file: src/domain/draft/rules.ts
- Repository / mock / CloudBase / cloud function: repository saveProductDrafts / CloudBase action
- Related tests: backend/src/api/api-contract.test.ts
- Status: implemented; real OCR depends on provider config

## 3. Owner reviews, edits, deletes, and confirms drafts

- Page entry: src/pages/owner/draft-review/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/owner-draft-review.ts; src/features/owner-draft-review/owner-draft-review.ts
- Service: mall-api-client draft actions
- Domain function/file: src/domain/draft/rules.ts; src/domain/catalog/rules.ts
- Repository / mock / CloudBase / cloud function: cloudfunctions/mallApi updateDraft/deleteDraft/confirmBatch
- Related tests: src/features/draft-review/draft-review.test.ts; backend/src/api/api-contract.test.ts
- Status: implemented

## 4. System creates SPU/SKU

- Page entry: owner draft confirmation (missing or conceptual)
- ViewModel / Facade: confirm facade
- Service: repository product persistence
- Domain function/file: src/domain/catalog/rules.ts createProductFromDraft/createSkuFromDraft
- Repository / mock / CloudBase / cloud function: saveConfirmedProduct / backend repository
- Related tests: backend/src/repositories/database-mall-repository.test.ts
- Status: implemented

## 5. Staff supplements product image

- Page entry: src/pages/staff/image-tasks/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/staff-image-tasks.ts
- Service: upload-service / mall-api-client
- Domain function/file: src/domain/catalog/rules.ts publish validation
- Repository / mock / CloudBase / cloud function: cloudfunctions mallApi supplementProductImage
- Related tests: src/features/staff-image-tasks/staff-image-tasks.test.ts; backend/src/api/api-contract.test.ts
- Status: implemented

## 6. Owner publishes product

- Page entry: src/pages/owner/products/index.vue (exists)
- ViewModel / Facade: src/pages/owner/products/useOwnerProductsPageState.ts; src/features/cloudbase-mall/owner-products.ts
- Service: mall-api-client publishProduct
- Domain function/file: src/domain/catalog/rules.ts validateProductPublishReady
- Repository / mock / CloudBase / cloud function: cloudfunctions mallApi publishProduct
- Related tests: tests/contracts/product-publish-validation-cases.cjs; backend/src/api/api-contract.test.ts
- Status: implemented

## 7. Customer browses published products

- Page entry: src/pages/customer/product-list/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/customer-product-list.ts; src/features/customer-product-list/customer-product-list.ts
- Service: mall-api-client listPublishedProducts/listPublishedSkus
- Domain function/file: src/domain/catalog/rules.ts published state
- Repository / mock / CloudBase / cloud function: cloudfunctions listPublishedProducts
- Related tests: src/features/customer-product-list/customer-product-list.test.ts
- Status: implemented

## 8. Customer logs in / authorizes phone only when ordering

- Page entry: src/pages/customer/product-detail/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/customer-product-detail.ts
- Service: src/services/auth/cloudbase-wechat-auth-service.ts
- Domain function/file: src/domain/order/rules.ts canCreateOrder
- Repository / mock / CloudBase / cloud function: cloudfunctions createCustomerOrder
- Related tests: src/pages/customer/product-detail/index.test.ts; src/features/customer-product-detail/customer-product-detail.test.ts
- Status: implemented; real device acceptance not proven here

## 9. System creates pending merchant-confirmation order and reserves stock

- Page entry: product detail submit (missing or conceptual)
- ViewModel / Facade: customer-product-detail facade
- Service: mall-api-client createCustomerOrder
- Domain function/file: src/domain/order/rules.ts; inventory types
- Repository / mock / CloudBase / cloud function: repository createOrder + stock adjustment
- Related tests: backend/src/api/api-contract.test.ts; repository contract tests
- Status: implemented

## 10. Merchant confirms or cancels order

- Page entry: src/pages/owner/orders/index.vue (exists)
- ViewModel / Facade: src/features/cloudbase-mall/owner-orders.ts; src/features/owner-orders/owner-orders.ts
- Service: mall-api-client confirm/cancel merchant order
- Domain function/file: src/domain/order/rules.ts
- Repository / mock / CloudBase / cloud function: cloudfunctions confirmMerchantOrder/cancelMerchantOrder
- Related tests: src/features/owner-orders/owner-orders.test.ts; backend api tests
- Status: implemented

## 11. Canceling a pending order releases stock

- Page entry: owner orders/customer detail paths (missing or conceptual)
- ViewModel / Facade: owner-orders/customer-product-detail facades
- Service: mall-api-client cancel actions
- Domain function/file: src/domain/order/rules.ts canCancelOrder
- Repository / mock / CloudBase / cloud function: repository cancelOrder and ledger
- Related tests: backend/src/api/api-contract.test.ts; repository tests
- Status: implemented