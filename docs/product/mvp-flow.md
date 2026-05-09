# MVP Flow

## Core Closed Loop

The current MVP is a clothing-store WeChat mini-program flow:

```text
Owner uploads product screenshots
-> Mock OCR creates product drafts
-> Owner reviews and confirms drafts
-> System creates products and SKUs
-> Staff supplements product images
-> Owner publishes products
-> Customer browses published products
-> Customer selects a SKU and orders with Mock WeChat login plus phone authorization
-> System creates a pending merchant-confirmation order and reserves stock
-> Merchant confirms or cancels the order
```

The main orchestration entry is `src/features/mall-workflow/mall-workflow.ts`.
Customer authorization ordering is coordinated by
`src/features/customer-order/customer-order.ts`.
High-risk pages call page-facing ViewModels and facades under `src/features`
before reaching workflow/domain/services, so future UI redesigns can replace
page structure without rewriting the accepted business chain.

## Implemented Features

- WeChat mini-program scaffold with uni-app, Vue 3, TypeScript, Vite, TDesign
  MiniProgram, and Vant Weapp dependencies.
- Owner dashboard navigation.
- Screenshot selection and Mock OCR import batch creation.
- Product draft review grouped by product code.
- Draft validation for product code, product name, sale price, and spec.
- SPU/SKU creation from confirmed drafts.
- Duplicate SKU stock merge by `productCode + spec`.
- Price conflict warning data from catalog rules.
- Staff image supplementation for products waiting on images.
- Product publishing after image and SKU checks.
- Customer product list and product detail pages for published products.
- Mock WeChat login and Mock phone authorization before ordering.
- Order creation with stock reservation.
- Merchant order confirmation and cancellation.
- Pending order cancellation restores reserved stock.
- Unit/integration tests for domain rules, workflow, mock OCR, mock auth, and
  customer order orchestration.
- Page-facing ViewModel and facade tests for customer product detail, owner
  draft review, owner product management, owner orders, and staff image tasks.

## Future Features Not Yet Implemented

- Real OCR or AI extraction.
- Real image upload and object storage.
- Persistent database or cloud storage.
- Real WeChat `wx.login`, `code2Session`, and phone-number exchange backend.
- Payment.
- Customer order history and user center.
- Merchant inventory ledger and order operation audit log.
- Real monitoring, logging, and rollback automation.
- E2E tests that click through the mini-program pages.
- CI branch protection on a remote repository.

## Explicit Non-Goals For The Current MVP

- Do not integrate Taobao, external marketplace APIs, or web crawling.
- Do not store production WeChat credentials.
- Do not implement payment.
- Do not implement real OCR in the current mock flow.
- Do not force login before browsing products.
- Do not rewrite the owner OCR, draft review, product creation, image
  supplementation, or publishing flow while working on customer authorization.
- Do not bypass existing stock reservation and order-state protection.

## Core User Paths

### Owner Import And Confirm

```text
Open owner dashboard
-> Select screenshot import
-> Choose screenshots
-> Start recognition
-> Review generated drafts
-> Complete or delete incomplete rows
-> Confirm batch
-> Products and SKUs are created
```

### Staff Supplement Images

```text
Open staff image tasks
-> Filter pending-image products
-> Upload/supplement product images through the mock service
-> Product moves to ready_to_publish
```

### Owner Publish

```text
Open product management
-> Review ready_to_publish products
-> Publish one product or batch publish ready products
-> Product becomes visible to customers
```

### Customer Order

```text
Open customer product list
-> Open a published product
-> Select an in-stock SKU
-> Tap WeChat phone order
-> Confirm Mock login if needed
-> Confirm Mock phone authorization if needed
-> Order is created and stock is reserved
```

### Merchant Confirm Or Cancel

```text
Open owner orders
-> Review pending_merchant_confirm orders
-> Confirm order, or cancel order and restore reserved stock
```
