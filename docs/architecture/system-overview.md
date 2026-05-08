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
| `src/features/draft-review` | Draft grouping and price-conflict helper logic |
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
-> features/mall-workflow/mall-access reads and replaces drafts
-> features/draft-review groups drafts
-> features/mall-workflow.confirmBatch
-> domain/draft validates drafts
-> domain/catalog creates products and SKUs
-> services/repositories stores products and SKUs
```

```text
pages/staff/image-tasks
-> features/mall-workflow/mall-access lists pending products
-> features/mall-workflow.supplementProductImages
-> services/storage mock upload
-> services/repositories updates product status
```

```text
pages/customer/product-detail
-> features/mall-workflow/mall-access reads product and SKUs
-> features/customer-order.submitCustomerWechatOrder
-> services/auth mock WeChat auth
-> features/mall-workflow.createAuthorizedOrder
-> domain/order creates order
-> services/repositories reserves stock and stores order
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
- `src/features`: use-case orchestration.
- `src/services`: replaceable IO adapters and repository implementations.
- `src/pages`: page UI and mini-program interaction.

## Current Architecture Risks

- `mallWorkflow` still directly imports mock OCR, mock upload, and repository
  implementations.
- Status transitions are represented by TypeScript union types and domain
  helpers, but not by a centralized state-machine table.
- `mockDb` is an in-memory singleton and is not production persistence.
- Page-level error handling is inconsistent.
- The current E2E smoke check validates build artifacts, not real mini-program
  click-through behavior.
- App helper and some service adapter edge cases still have limited test depth.
- CI exists, but remote branch protection and required checks must be configured
  in the Git host.
