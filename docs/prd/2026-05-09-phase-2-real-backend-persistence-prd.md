# 2026-05-09 Phase 2 Real Backend and Persistence PRD

## 0. Document Positioning

This PRD breaks Phase 2 from
`docs/prd/2026-05-08-enterprise-launch-master-prd.md` into an executable stage
plan.

Phase 2 replaces the current in-memory mock persistence with a real backend
and durable database boundary. It must preserve the accepted MVP business loop
and the Phase 1 page-facing ViewModel / Facade contracts.

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

1. Add a backend BFF/API layer between the mini-program and durable storage.
2. Define and enforce a stable repository port before replacing persistence.
3. Add database schema and migration process for Phase 2 entities.
4. Add a database-backed repository implementation that passes the same
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

- Add a TypeScript Node backend/BFF inside this repository.
- Keep it separate from `src/` mini-program source.
- Recommended directory: `backend/`.
- Recommended runtime shape: HTTP JSON API with a health check and unified
  response envelope.
- Recommended durable database target: PostgreSQL-compatible SQL database.

Reasoning:

- The repo is already TypeScript-based.
- Current domain types can be mapped without introducing a second language
  model.
- PostgreSQL gives stable relational constraints for products, SKUs, orders,
  and batch/draft relationships.
- This keeps future Supabase, managed PostgreSQL, or self-hosted PostgreSQL
  options open.

Implementation may choose Express, Fastify, Hono, or another small TypeScript
HTTP framework in Module 2.1, but the choice must be documented before adding
dependencies.

### 4.2 Mini-Program Boundary

The mini-program must not:

- Connect directly to a database.
- Store database credentials.
- Build SQL or persistence queries.
- Put HTTP calls in `.vue` pages.
- Bypass feature/service ports.

Future frontend HTTP access must sit behind service adapters. Pages continue to
call page-facing ViewModels / Facades.

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

The current mock repository and future database repository must both satisfy
the same port and contract tests.

### 4.4 Migration Rules

Every schema change must be a migration file.

Migration rules:

- Do not edit migrations after they have run outside local development.
- Keep schema migrations and data migrations separate.
- Each migration must include purpose, rollback or compensation notes, and data
  validation notes.
- Add nullable columns first when changing existing tables.
- Avoid destructive changes until application references are removed.
- Test migrations against an empty database and an existing test database.

## 5. Data Model Scope

Phase 2 schema must cover the current MVP entities:

| Table | Purpose |
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

### Module 2.1 Backend Project and Environment Baseline

Tasks:

1. Choose the TypeScript backend framework.
2. Add backend directory structure.
3. Add health check endpoint.
4. Add unified response envelope helpers.
5. Add backend environment example file without secrets.
6. Add backend verify scripts to `package.json`.
7. Document local startup commands.

Suggested files:

- `backend/package.json` or root package scripts if using one workspace.
- `backend/src/server.ts`
- `backend/src/http/response.ts`
- `backend/src/http/errors.ts`
- `backend/src/config/env.ts`
- `backend/.env.example`
- `backend/README.md`
- `docs/plans/YYYY-MM-DD-phase-2-1-backend-baseline-log.md`

Acceptance:

- Backend starts locally.
- `GET /health` returns a successful JSON envelope.
- Missing or invalid environment variables fail fast with a safe message.
- No real secret is committed.
- Root verification commands still pass.

Required tests:

- Health endpoint test.
- Response envelope unit test.
- Environment validation unit test.

Required checks:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

### Module 2.2 Database Schema and Migration Baseline

Tasks:

1. Choose migration tool.
2. Add database configuration with `.env.example` only.
3. Add initial schema migration for Phase 2 tables.
4. Add migration status/apply commands.
5. Add empty-database migration test.
6. Add schema constraint negative tests.
7. Document rollback or compensation strategy.

Suggested files:

- `backend/src/db/client.ts`
- `backend/src/db/migrations/*`
- `backend/src/db/schema.ts` or SQL schema files depending on tool choice.
- `backend/src/db/migrate.ts`
- `backend/src/db/migration.test.ts`
- `docs/contracts/database-schema.md`
- `docs/plans/YYYY-MM-DD-phase-2-2-database-migration-log.md`

Acceptance:

- Migration can create the full Phase 2 schema from an empty test database.
- Migration can be run repeatedly in a test environment without schema drift.
- Required foreign keys and status constraints exist.
- Rollback or compensation notes exist.
- No production database is touched by tests.

Required tests:

- Migration test.
- Schema constraint negative test.
- Status enum or check-constraint test.

Required checks:

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify
```

### Module 2.3 Repository Port and Database Repository

Tasks:

1. Extract the current repository shape into a `MallRepository` port.
2. Adapt the current in-memory repository to that port.
3. Add repository contract tests that run against the in-memory repository.
4. Add database repository implementation.
5. Run the same repository contract tests against the database repository.
6. Ensure workflows/features depend on the repository port, not concrete
   database code.
7. Keep pages unchanged.

Suggested files:

- `src/services/repositories/mall-repository-port.ts`
- `src/services/repositories/memory-mall-repository.ts`
- `src/services/repositories/mall-repository-contract.test.ts`
- `backend/src/repositories/database-mall-repository.ts`
- `backend/src/repositories/database-mall-repository.test.ts`
- `docs/plans/YYYY-MM-DD-phase-2-3-repository-port-log.md`

Acceptance:

- In-memory and database repositories pass the same contract tests.
- Current workflow integration tests still pass.
- Main MVP loop can run using the database repository in a test environment.
- No `.vue` page changes are needed.

Required tests:

- Shared repository contract tests.
- Database repository integration tests.
- Workflow integration test using database repository.
- Transaction rollback test for order creation or cancellation.

Required checks:

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify
pnpm.cmd run verify:full
```

### Module 2.4 API Contract and BFF Endpoints

Tasks:

1. Define API route names and request/response schemas.
2. Add validation for every request body and route parameter.
3. Add handlers for the MVP API groups.
4. Map domain/workflow errors to stable API error codes.
5. Add API contract tests.
6. Add negative tests for validation and unauthorized placeholder flows.
7. Add API docs.

Suggested files:

- `backend/src/api/routes.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/handlers/*.ts`
- `backend/src/api/errors.ts`
- `backend/src/api/*.test.ts`
- `docs/contracts/api-contract.md`
- `docs/plans/YYYY-MM-DD-phase-2-4-api-contract-log.md`

Acceptance:

- API uses the unified response envelope.
- API error codes are stable and documented.
- API does not expose internal stack traces, secrets, or database errors.
- API fields match frontend/domain contract names.
- API contract tests pass.

Required tests:

- API contract tests.
- Request validation tests.
- Error mapping tests.
- Idempotency or duplicate-confirmation tests for batch confirmation.

Required checks:

```powershell
pnpm.cmd run verify:api
pnpm.cmd run verify
```

### Module 2.5 Backup, Restore, and Operational Baseline

Tasks:

1. Define backup frequency for development/staging/production.
2. Define restore rehearsal process.
3. Define pre-release backup checkpoint.
4. Define migration failure recovery process.
5. Define data validation queries.
6. Document who can run backup/restore operations.

Suggested files:

- `docs/operations/backup-restore.md`
- `docs/operations/migration-runbook.md`
- `docs/plans/YYYY-MM-DD-phase-2-5-backup-restore-log.md`

Acceptance:

- Backup and restore runbook exists.
- Migration rollback or compensation runbook exists.
- Staging restore rehearsal is documented before production release.
- Data validation checklist exists for core tables.

Required checks:

```powershell
pnpm.cmd run verify
```

## 8. Phase 2 Exit Criteria

Phase 2 is complete only when:

1. Backend BFF/API can start locally.
2. Health check and response envelope are tested.
3. Database schema migrations create all Phase 2 tables.
4. Migration process is documented and tested.
5. In-memory and database repositories pass the same contract tests.
6. Main MVP loop passes with database repository in integration tests.
7. API contracts and error codes are documented and tested.
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
| Database schema drifts from domain types | Schema contract and repository contract tests must be updated together |
| Mock path breaks while adding database path | Keep in-memory repository and run existing workflow tests |
| Migration damages data | Test migrations on empty and existing test databases; document compensation |
| Real auth/storage/OCR scope creeps into Phase 2 | Keep those as Phase 3, Phase 4, and Phase 6 tasks |
| API exposes internal errors | Enforce unified response envelope and error mapping tests |

## 11. Recommended First Implementation Slice

Start with Module 2.1 only.

Repository Impact Map for Module 2.1 should include:

- `backend/`
- root package scripts if needed
- backend `.env.example`
- backend tests
- docs for backend startup

Module 2.1 should not include:

- database schema
- migrations
- repository replacement
- mini-program page changes
- real auth/storage/OCR

After Module 2.1 passes, reread this PRD and the master PRD before starting
Module 2.2.
