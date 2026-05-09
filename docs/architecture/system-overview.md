# System Overview

## Technology Stack

- Runtime target: WeChat mini-program (`mp-weixin`)
- App framework: uni-app
- UI framework: Vue 3
- Language: TypeScript
- Build tool: Vite with `@dcloudio/vite-plugin-uni`
- UI libraries available: TDesign MiniProgram and Vant Weapp
- Test runner: Vitest
- Type checking: `vue-tsc`
- Package manager in current workflow: `pnpm`

## Current System Modules

| Module | Current responsibility |
| --- | --- |
| `src/app` | Routes, navigation helper, role labels |
| `src/domain/batch` | OCR batch types |
| `src/domain/draft` | Product draft types and validation rules |
| `src/domain/catalog` | Product/SKU types, SPU/SKU creation, publish checks |
| `src/domain/order` | Order types, order creation, order status changes |
| `src/features/mall-workflow` | Main MVP orchestration for import, confirm, publish, order, cancel |
| `src/features/mall-workflow/mall-access` | Page-safe query and repository-backed access facade |
| `src/features/customer-order` | Customer login/phone authorization ordering flow |
| `src/features/customer-product-detail` | Customer product detail ViewModel and authorized order command |
| `src/features/draft-review` | Draft grouping and price-conflict helper logic |
| `src/features/owner-draft-review` | Owner draft review ViewModel and draft edit/delete/confirm commands |
| `src/features/owner-products` | Owner product list facade, publish button state, and publish commands |
| `src/features/owner-orders` | Owner order list facade, action availability, and confirm/cancel commands |
| `src/features/staff-image-tasks` | Staff image task facade, filters, and supplement-image command |
| `src/services/ocr` | OCR provider interface and mock OCR provider |
| `src/services/storage` | Upload service interface and mock upload service |
| `src/services/auth` | Customer session, auth service interface, mock WeChat auth |
| `src/services/repositories` | In-memory mock database and mall repository |
| `src/pages` | Mini-program pages and user interaction |

## Current Data Flow

```text
pages/owner/import-upload
-> features/mall-workflow.createMockImportBatch
-> services/storage mock image selection or page-selected images
-> services/ocr mock OCR
-> services/repositories mockDb
```

```text
pages/owner/draft-review
-> features/owner-draft-review ViewModel and commands
-> features/mall-workflow/mall-access reads and replaces drafts
-> features/draft-review groups drafts
-> features/mall-workflow.confirmBatch
-> domain/draft validates drafts
-> domain/catalog creates products and SKUs
-> services/repositories stores products and SKUs
```

```text
pages/staff/image-tasks
-> features/staff-image-tasks ViewModel and command
-> features/mall-workflow/mall-access lists pending products
-> features/mall-workflow.supplementProductImages
-> services/storage mock upload
-> services/repositories updates product status
```

```text
pages/customer/product-detail
-> features/customer-product-detail ViewModel and command
-> features/mall-workflow/mall-access reads product and SKUs
-> features/customer-order.submitCustomerWechatOrder
-> services/auth mock WeChat auth
-> features/mall-workflow.createAuthorizedOrder
-> domain/order creates order
-> services/repositories reserves stock and stores order
```

```text
pages/owner/products
-> features/owner-products ViewModel and publish commands
-> features/mall-workflow/mall-access reads products/SKUs
-> features/mall-workflow.publishProduct
-> domain/catalog checks publish eligibility
-> services/repositories updates product status
```

```text
pages/owner/orders
-> features/owner-orders ViewModel and commands
-> features/mall-workflow/mall-access lists orders
-> features/mall-workflow.confirmOrder/cancelOrder
-> domain/order applies status transitions
-> services/repositories updates orders and restores stock on cancellation
```

## Main Directory Responsibilities

- `docs/prd`: approved product requirements for each task.
- `docs/plans`: delivery logs and approved implementation plans.
- `docs/product`: durable product flow and scope documents.
- `docs/architecture`: system overview and module boundary rules.
- `docs/contracts`: domain contracts and business invariants.
- `docs/testing`: test strategy and fixture rules.
- `docs/quality`: review checklists and agent failure learning logs.
- `src/domain`: pure business language and rules.
- `src/features`: use-case orchestration plus page-facing ViewModels and facades.
- `src/services`: replaceable IO adapters and repository implementations.
- `src/pages`: page UI and mini-program interaction.

## Current Architecture Risks

- `mallWorkflow` still directly imports mock OCR, mock upload, and repository
  implementations.
- Status transitions are represented by TypeScript union types and domain
  helpers, but not by a centralized state-machine table.
- `mockDb` is an in-memory singleton and is not production persistence.
- Medium-risk pages (`customer/product-list` and `owner/import-upload`) still
  use generic workflow/access entry points and can receive dedicated facades in a
  future UI-hardening pass if their UI is redesigned.
- The current E2E smoke check validates build artifacts, not real mini-program
  click-through behavior.
- App helper and some service adapter edge cases still have limited test depth.
- CI exists, but remote branch protection and required checks must be configured
  in the Git host.
