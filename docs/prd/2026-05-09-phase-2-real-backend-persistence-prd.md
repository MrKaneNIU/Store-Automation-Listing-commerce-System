# 2026-05-09 Phase 2 Real Backend and Persistence PRD

## 0.0 Route Update: CloudBase Is Now The Approved Long-Term Path

On 2026-05-09, the user approved changing the long-term backend and
persistence route to WeChat official CloudBase. From this point forward, future
Phase 2 implementation should target:

- CloudBase Cloud Functions as the backend/service layer.
- CloudBase Cloud Database as the durable persistence layer.
- CloudBase Cloud Storage as the official storage path when Phase 3 starts.

The earlier PostgreSQL-oriented work under `backend/` remains useful as an
engineering baseline and transitional evidence, but it is no longer the default
future implementation route unless a later PRD explicitly re-approves it.

This document is kept for history and updated below so future readers do not
follow the PostgreSQL / `DATABASE_URL` / SQL migration path by mistake.

## 0. Document Positioning

This PRD breaks Phase 2 from
`docs/prd/2026-05-08-enterprise-launch-master-prd.md` into an executable stage
plan.

Phase 2 replaces the current in-memory mock persistence with CloudBase Cloud
Functions and Cloud Database boundaries. It must preserve the accepted MVP
business loop and the Phase 1 page-facing ViewModel / Facade contracts.

This PRD is not permission to implement all backend work in one pass. Each
module below must be implemented, verified, documented, and reviewed before the
next module starts.

## 1. Current Baseline

Current app:

- uni-app + Vue 3 + TypeScript WeChat mini-program.
- Current persistence is `src/services/repositories/mock-db.ts`.
- Current repository implementation is
  `src/services/repositories/mall-repository.ts`.
- Current workflow orchestration lives in `src/features/mall-workflow`.
- Page-facing UI contracts are frozen in
  `docs/contracts/page-facing-ui-contracts.md`.
- Phase 0 and Phase 1 automatic checks pass with `verify` and `verify:full`.

Protected MVP loop:

```text
Owner uploads cloud e-bao screenshots
-> Mock OCR creates product drafts
-> Owner reviews, edits, deletes, and confirms drafts
-> System creates SPU/SKU records
-> Staff supplements product images
-> Owner publishes products
-> Customer browses published products without login
-> Customer triggers login and phone authorization only at order time
-> System creates pending merchant-confirmation order and reserves stock
-> Merchant confirms or cancels order
-> Pending-order cancellation restores reserved stock
```

## 2. Goals

1. Add a CloudBase Cloud Function service layer between the mini-program and
   durable storage.
2. Define and enforce a stable repository port before replacing persistence.
3. Add CloudBase collection, index, permission, and data-change process for
   Phase 2 entities.
4. Add a CloudBase-backed repository implementation that passes the same
   repository contract tests as the current mock repository.
5. Add API contracts for the current MVP loop without moving real image
   storage, real WeChat auth, real OCR, payment, or UI redesign into Phase 2.
6. Keep mini-program pages free of direct HTTP, database, repository, and mock
   adapter access.
7. Keep the current mock repository available for fast tests and local fallback.

## 3. Non-Goals

Phase 2 must not implement:

- Real object storage for product images. That belongs to Phase 3.
- Real WeChat login, phone-number exchange, or role permission backend. That
  belongs to Phase 4.
- Production-grade inventory ledger, audit log, or operations dashboard. Those
  belong to Phase 5.
- Real OCR/AI asynchronous job processing. That belongs to Phase 6.
- Large UI redesign or visual system refactor. That belongs to Phase 7.
- Payment.
- Multi-tenant merchant operations beyond the current MVP owner/staff/customer
  flow.

## 4. Architecture Decisions

### 4.1 Backend Shape

Recommended Phase 2 baseline:

- Add CloudBase Cloud Functions as the official backend/service layer.
- Keep CloudBase adapters separate from `src/pages/`; pages must still call
  feature/service ports.
- Recommended runtime shape: callable cloud functions with health check,
  request validation, stable error codes, and unified response envelope.
- Recommended durable database target: CloudBase Cloud Database.
- Recommended future storage target: CloudBase Cloud Storage, implemented in
  Phase 3 rather than mixed into Phase 2.

Reasoning:

- The product is a WeChat mini-program, so CloudBase is the closest official
  ecosystem fit for cloud functions, database, storage, and future WeChat
  identity integration.
- The route avoids coupling the long-term product plan to Supabase free-tier
  database limits.
- Current domain types can be mapped into CloudBase document collections while
  keeping the repository port stable.

Implementation may keep the existing `backend/` PostgreSQL baseline for local
evidence, but new long-term Phase 2 modules should not extend that path unless
the route is re-approved.

### 4.2 Mini-Program Boundary

The mini-program must not:

- Connect directly to a database.
- Store database credentials.
- Build SQL or persistence queries.
- Put HTTP calls in `.vue` pages.
- Bypass feature/service ports.

Future frontend HTTP access must sit behind service adapters. Pages continue to
call page-facing ViewModels / Facades.

For CloudBase, the same rule applies to `wx.cloud.callFunction`: calls belong in
service adapters, not in `.vue` pages.

### 4.3 Repository Boundary

Before any database implementation, define a `MallRepository` port that covers
the current repository surface:

- `saveBatch`
- `updateBatch`
- `listBatches`
- `saveDrafts`
- `replaceDrafts`
- `listDrafts`
- `saveProducts`
- `updateProduct`
- `listProducts`
- `listSkus`
- `updateSku`
- `saveOrder`
- `updateOrder`
- `listOrders`

The current mock repository and future CloudBase repository must both satisfy
the same port and contract tests.

### 4.4 CloudBase Change Rules

Every CloudBase collection, index, permission, or data-shape change must be a
tracked change record or script.

Change rules:

- Do not silently mutate staging/production collections by hand.
- Keep collection/index/permission changes separate from data backfill scripts.
- Each change must include purpose, rollback or compensation notes, and data
  validation notes.
- Add optional fields first when changing existing document shapes.
- Avoid destructive changes until application references are removed.
- Test initialization and compatibility scripts against an empty CloudBase
  environment and an existing test environment.

## 5. Data Model Scope

Phase 2 CloudBase collections must cover the current MVP entities:

| Collection | Purpose |
| --- | --- |
| `ocr_batches` | OCR batch metadata and status |
| `product_drafts` | OCR draft rows and review status |
| `products` | SPU product records |
| `skus` | SKU records and stock |
| `orders` | Customer order header |
| `order_items` | Order item rows |
| `customers` | Customer identity placeholder for future real auth |
| `staff_users` | Owner/staff placeholder for future role binding |

Phase 2 may include placeholder identity fields needed by the current order
shape, but it must not implement final WeChat auth or role permission rules.

Required compatibility with `docs/contracts/domain-contract.md`:

- Keep `productCode` meaning as SPU grouping key.
- Keep `productCode + spec` meaning as SKU grouping key.
- Keep order stock reservation and cancellation restoration semantics.
- Preserve draft statuses, product statuses, order statuses, and batch
  statuses.

## 6. API Contract Scope

Phase 2 API contract should cover the current MVP loop:

| API Group | Minimum Operations |
| --- | --- |
| Health | `GET /health` |
| OCR batches | create/list/get current batch |
| Draft review | list latest drafts, update draft, delete draft, confirm batch |
| Products/SKUs | list products, list published products, publish product, list SKUs |
| Image tasks | list pending-image products, mark product images supplemented through existing mock behavior until Phase 3 |
| Customer orders | create authorized mock-backed order, list relevant order result |
| Merchant orders | list orders, confirm order, cancel order |

Unified response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

Error response envelope:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-safe message"
  },
  "meta": {}
}
```

Phase 2 must define stable error codes before exposing APIs to the mini-program.

## 7. Module Plan

### Module 2.1 CloudBase Environment And Cloud Function Baseline

Tasks:

1. Create or connect the CloudBase dev/staging/prod environments.
2. Record environment ID, region, resource owner, and operator boundary.
3. Add cloud function directory structure and local invocation/deploy commands.
4. Add health check cloud function.
5. Add unified response envelope helpers.
6. Add CloudBase environment example file without secrets.
7. Add verify scripts to `package.json` if needed.
8. Document local setup, deployment, and rollback commands.

Suggested files:

- CloudBase cloud function source directory.
- CloudBase local config template without secrets.
- Response envelope and error helpers.
- CloudBase setup notes in `README.md` or `docs/operations/`.
- `docs/plans/YYYY-MM-DD-phase-2-1-backend-baseline-log.md`

Acceptance:

- Health cloud function can be invoked locally or in a dev CloudBase
  environment.
- Health function returns a successful JSON envelope.
- Missing or invalid CloudBase environment configuration fails fast with a safe
  message.
- No real secret is committed.
- Root verification commands still pass.

Required tests:

- Health cloud function test.
- Response envelope unit test.
- Environment validation unit test.

Required checks:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

### Module 2.2 CloudBase Collection, Index, And Change Baseline

Tasks:

1. Define Phase 2 CloudBase collections and indexes.
2. Add CloudBase environment configuration template without secrets.
3. Add initialization scripts for Phase 2 collections, indexes, and permission
   baseline.
4. Add change-status or validation commands.
5. Add empty-environment initialization test or documented rehearsal.
6. Add document-shape and status negative tests at repository/service boundary.
7. Document rollback or compensation strategy.

Suggested files:

- CloudBase collection/index definition files or scripts.
- CloudBase repository tests.
- `docs/contracts/cloudbase-data-model.md`
- `docs/plans/YYYY-MM-DD-phase-2-2-database-migration-log.md`

Acceptance:

- Initialization can create the full Phase 2 collection/index baseline from an
  empty CloudBase test environment.
- Initialization can be run repeatedly in a test environment without drift.
- Required indexes, permission assumptions, and status validations exist.
- Rollback or compensation notes exist.
- No production CloudBase environment is touched by tests.

Required tests:

- CloudBase initialization or validation test.
- Document-shape and status negative tests.
- Status enum or check-constraint test.

Required checks:

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify
```

### Module 2.3 Repository Port and CloudBase Repository

Tasks:

1. Extract the current repository shape into a `MallRepository` port.
2. Adapt the current in-memory repository to that port.
3. Add repository contract tests that run against the in-memory repository.
4. Add CloudBase repository implementation.
5. Run the same repository contract tests against the CloudBase repository.
6. Ensure workflows/features depend on the repository port, not concrete
   database code.
7. Keep pages unchanged.

Suggested files:

- `src/services/repositories/mall-repository-port.ts`
- `src/services/repositories/memory-mall-repository.ts`
- `src/services/repositories/mall-repository-contract.test.ts`
- CloudBase repository implementation.
- CloudBase repository tests.
- `docs/plans/YYYY-MM-DD-phase-2-3-repository-port-log.md`

Acceptance:

- In-memory and CloudBase repositories pass the same contract tests.
- Current workflow integration tests still pass.
- Main MVP loop can run using the CloudBase repository in a test environment.
- No `.vue` page changes are needed.

Required tests:

- Shared repository contract tests.
- CloudBase repository integration tests.
- Workflow integration test using CloudBase repository.
- CloudBase transaction or compensation test for order creation or cancellation.

Required checks:

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify
pnpm.cmd run verify:full
```

### Module 2.4 Cloud Function Contract And Service Endpoints

Tasks:

1. Define cloud function names and request/response schemas.
2. Add validation for every request body and route parameter.
3. Add handlers for the MVP API groups.
4. Map domain/workflow errors to stable API error codes.
5. Add cloud function contract tests.
6. Add negative tests for validation and unauthorized placeholder flows.
7. Add service contract docs.

Suggested files:

- Cloud function route/handler source files.
- Cloud function request/response schemas.
- Cloud function error mapping tests.
- `docs/contracts/api-contract.md` or `docs/contracts/cloud-function-contract.md`
- `docs/plans/YYYY-MM-DD-phase-2-4-api-contract-log.md`

Acceptance:

- Cloud functions use the unified response envelope.
- Error codes are stable and documented.
- Cloud functions do not expose internal stack traces, secrets, or database
  errors.
- Cloud function fields match frontend/domain contract names.
- Cloud function contract tests pass.

Required tests:

- Cloud function contract tests.
- Request validation tests.
- Error mapping tests.
- Idempotency or duplicate-confirmation tests for batch confirmation.

Required checks:

```powershell
pnpm.cmd run verify:api
pnpm.cmd run verify
```

### Module 2.5 CloudBase Backup, Restore, And Operational Baseline

Tasks:

1. Define CloudBase cloud database and cloud storage backup frequency for
   development/staging/production.
2. Define restore rehearsal process.
3. Define pre-release backup checkpoint.
4. Define CloudBase collection/index/data-change failure recovery process.
5. Define data validation queries.
6. Document who can run backup/restore operations.

Suggested files:

- `docs/operations/backup-restore.md`
- `docs/operations/cloudbase-change-runbook.md`
- `docs/plans/YYYY-MM-DD-phase-2-5-backup-restore-log.md`

Acceptance:

- Backup and restore runbook exists.
- CloudBase change rollback or compensation runbook exists.
- CloudBase staging restore rehearsal is documented before production release.
- Data validation checklist exists for core collections.

Required checks:

```powershell
pnpm.cmd run verify
```

## 8. Phase 2 Exit Criteria

Phase 2 is complete only when:

1. CloudBase cloud function path can be invoked locally or in dev/staging.
2. Health check cloud function and response envelope are tested.
3. CloudBase collection/index initialization creates all Phase 2 collections.
4. CloudBase change process is documented and tested.
5. In-memory and CloudBase repositories pass the same contract tests.
6. Main MVP loop passes with CloudBase repository in integration tests.
7. Cloud function contracts and error codes are documented and tested.
8. Mini-program pages remain behind feature/service boundaries.
9. `verify`, `verify:full`, and any new backend/API verify scripts pass.
10. WeChat DevTools manual acceptance is rerun against the Phase 2 integration
    path or explicitly recorded as blocked with defect IDs.

## 9. Required Documentation Updates Per Module

Each Phase 2 module must update:

- Its delivery log under `docs/plans/`.
- `docs/architecture/system-overview.md` if module structure changes.
- `docs/testing/test-strategy.md` if commands or coverage change.
- `docs/contracts/domain-contract.md` if entity meanings change.
- `docs/contracts/page-facing-ui-contracts.md` only if a page-facing contract
  is intentionally changed by an approved PRD update.
- `README.md` if local startup or verification commands change.

## 10. Risks and Guardrails

| Risk | Guardrail |
| --- | --- |
| Backend work leaks into pages | Pages continue to call feature ViewModels / Facades only |
| CloudBase document shapes drift from domain types | Data-model contract and repository contract tests must be updated together |
| Mock path breaks while adding CloudBase path | Keep in-memory repository and run existing workflow tests |
| CloudBase change damages data | Test initialization and data-change scripts on empty and existing test environments; document compensation |
| Real auth/storage/OCR scope creeps into Phase 2 | Keep those as Phase 3, Phase 4, and Phase 6 tasks |
| API exposes internal errors | Enforce unified response envelope and error mapping tests |

## 11. Recommended First Implementation Slice

Start with Module 2.1 only.

Repository Impact Map for Module 2.1 should include:

- CloudBase cloud function source/config directories.
- root package scripts if needed
- CloudBase local config template
- cloud function tests
- docs for CloudBase setup and deployment

Module 2.1 should not include:

- CloudBase collection/index initialization
- repository replacement
- mini-program page changes
- real auth/storage/OCR

After Module 2.1 passes, reread this PRD and the master PRD before starting
Module 2.2.
