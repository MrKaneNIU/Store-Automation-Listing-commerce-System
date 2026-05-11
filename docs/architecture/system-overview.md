# System Overview

## Technology Stack

- Runtime target: WeChat mini-program (`mp-weixin`)
- App framework: uni-app
- UI framework: Vue 3
- Language: TypeScript
- Build tool: Vite with `@dcloudio/vite-plugin-uni`
- UI libraries available: TDesign MiniProgram and Vant Weapp
- Backend baseline: CloudBase cloud functions/database as the active
  mini-program persistence route, plus preserved TypeScript Node HTTP server,
  PostgreSQL-compatible migration, database repository, and backend-only
  BFF/API contract baselines under `backend/`
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
| `src/features/mall-workflow` | Preserved in-memory/mock MVP orchestration for import, confirm, publish, order, cancel |
| `src/features/cloudbase-mall` | Page-facing CloudBase facades for owner/staff/customer MVP runtime paths |
| `src/features/mall-workflow/mall-access` | Page-safe query and repository-backed access facade |
| `src/features/customer-order` | Customer login/phone authorization ordering flow |
| `src/features/customer-product-list` | Customer published-product list ViewModel and minimum price display |
| `src/features/customer-product-detail` | Customer product detail ViewModel and authorized order command |
| `src/features/draft-review` | Draft grouping and price-conflict helper logic |
| `src/features/owner-screenshot-import` | Owner screenshot descriptor creation and OCR import result summary |
| `src/features/owner-draft-review` | Owner draft review ViewModel and draft edit/delete/confirm commands |
| `src/features/owner-products` | Owner product list facade, publish button state, and publish commands |
| `src/features/owner-orders` | Owner order list facade, action availability, and confirm/cancel commands |
| `src/features/staff-image-tasks` | Staff image task facade, filters, and supplement-image command |
| `src/services/ocr` | OCR provider interface and mock OCR provider |
| `src/services/storage` | Upload service interface plus runtime mock/CloudBase upload selection, validation, and lifecycle helpers |
| `src/services/auth` | Customer session, auth service interface, mock WeChat auth |
| `src/services/repositories` | Mall repository port, in-memory mock repository, and shared repository contract tests |
| `src/services/cloudbase` | `wx.cloud.callFunction` wrapper and `mallApi` service adapter kept out of pages |
| `src/pages` | Mini-program pages and user interaction |
| `backend` | Phase 2 BFF/API baseline, health check, response envelope, environment validation, database migration baseline, database repository baseline, API contract handlers |

## Current Data Flow

Current real-AppID CloudBase owner import path:

```text
pages/owner/import-upload
-> features/cloudbase-mall/owner-screenshot-import
-> services/storage runtime upload service
-> services/cloudbase/runtime-mall-api-client
-> wx.cloud.callFunction("mallApi")
-> CloudBase cloud storage and cloud database
```

The current owner import path does not claim real OCR accuracy. It no longer
writes fabricated mock product fields before a real OCR provider exists; real
OCR/AI remains Phase 6.

Legacy mock/in-memory flows remain available for local tests and preserved MVP
baseline coverage:

```text
pages/owner/draft-review
-> features/cloudbase-mall/owner-draft-review
-> services/cloudbase mallApi adapter
-> CloudBase cloud database
```

```text
pages/staff/image-tasks
-> features/cloudbase-mall/staff-image-tasks
-> services/storage runtime upload service when product-image upload is re-accepted
-> services/cloudbase mallApi adapter
-> CloudBase cloud database
```

```text
pages/customer/product-detail
-> features/cloudbase-mall/customer-product-detail
-> services/cloudbase mallApi adapter
-> CloudBase cloud database
```

```text
pages/owner/products
-> features/cloudbase-mall/owner-products
-> services/cloudbase mallApi adapter
-> CloudBase cloud database
```

```text
pages/owner/orders
-> features/cloudbase-mall/owner-orders
-> services/cloudbase mallApi adapter
-> CloudBase cloud database
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
- `backend`: server-side BFF/API code. The current Phase 2 baseline owns health
  checks, response envelopes, environment validation, startup wiring, the
  initial PostgreSQL-compatible schema migration runner, a database-backed
  repository implementation, and backend-only API contract handlers. It does not
  own mini-program HTTP adapters, real auth, or real OCR yet. Current mini-
  program persistence and object storage use the CloudBase route.

## Current Architecture Risks

- `mallWorkflow` still directly imports mock OCR, mock upload, and the
  synchronous in-memory repository compatibility export for the legacy mock
  baseline and tests.
- Real object storage is implemented through the storage service boundary and
  CloudBase storage; product-image upload should be re-accepted when a valid
  product creation path exists again.
- Status transitions are represented by TypeScript union types and domain
  helpers, but not by a centralized state-machine table.
- `mockDb` is an in-memory singleton and is not production persistence; active
  mini-program persistence now goes through CloudBase `mallApi` facades.
- `backend` contains preserved PostgreSQL-compatible engineering evidence; the
  approved mini-program route is CloudBase unless a later PRD changes it.
- Real OCR/AI recognition is not implemented yet; it remains Phase 6.
- Low-risk static navigation pages are intentionally simple and do not need
  dedicated business facades.
- The current E2E smoke check validates build artifacts, not real mini-program
  click-through behavior.
- App helper and some service adapter edge cases still have limited test depth.
- CI exists, but remote branch protection and required checks must be configured
  in the Git host.
