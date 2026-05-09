# 2026-05-09 Phase 2.3 Repository Port and Database Repository

## Scope

This delivery executes Module 2.3 from
`docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`.

It extracts the current mall repository shape into a port, adapts the current
in-memory repository to that port, adds shared repository contract tests, and
adds a PostgreSQL-backed repository implementation that passes the same
contract in an in-memory PostgreSQL-compatible test database.

This module does not add API routes, mini-program HTTP adapters, real WeChat
auth, real OCR, real object storage, payment, or UI changes.

## PRD Re-Read Checkpoint

Relevant Phase 2 PRD rules carried forward:

- In-memory and database repositories must satisfy the same contract tests.
- Workflows and features must stay behind repository-shaped access.
- Pages must remain unchanged.
- Main MVP loop semantics must stay intact.
- Tests must not touch a production database.

## Architecture Decision

The mini-program keeps the current synchronous in-memory repository for the
accepted MVP loop. The new backend database repository is asynchronous because
real PostgreSQL access is asynchronous.

To keep both implementations verifiable against the same behavior, the shared
contract uses a repository contract type whose return values may be synchronous
or asynchronous. Existing feature code continues to use the synchronous
`mallRepository` compatibility export.

The backend repository keeps local structural types instead of importing
`src/domain` files from production backend code. Shared contract tests still
compare the backend result shape against the existing domain-shaped fixtures.
This preserves the backend `rootDir` boundary while keeping behavior aligned.

## TDD Evidence

RED:

```powershell
pnpm.cmd run backend:test
```

Result:

- The new database repository test file was executed.
- It failed because `backend/src/repositories/database-mall-repository.ts` did
  not exist.
- This was the intended missing-implementation failure.

GREEN:

```powershell
pnpm.cmd run backend:test
pnpm.cmd test
pnpm.cmd run backend:build
```

Result:

- Backend tests passed: 6 test files, 18 tests.
- App/business tests passed: 18 test files, 76 tests.
- Backend TypeScript build passed.

## Completed Changes

Added repository port and memory repository files:

- `src/services/repositories/mall-repository-port.ts`
- `src/services/repositories/memory-mall-repository.ts`
- `src/services/repositories/mall-repository-contract.ts`
- `src/services/repositories/mall-repository-contract.test.ts`

Updated compatibility export:

- `src/services/repositories/mall-repository.ts`

Added backend database repository files:

- `backend/src/repositories/database-mall-repository.ts`
- `backend/src/repositories/database-mall-repository.test.ts`

Updated transaction support:

- `backend/src/db/client.ts`

Updated docs:

- `backend/README.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/module-boundaries.md`
- `docs/testing/test-strategy.md`

## Contract Coverage

The shared repository contract covers:

- Batch save/list/update.
- Draft save/filter/replace.
- Product and SKU save/list/update.
- Order save/list/update.
- Local list mutation not leaking into stored state.

The database repository additionally covers:

- Product/SKU transaction rollback when SKU persistence fails.
- Main MVP loop using database repository operations in a test environment:
  draft confirmation, product/SKU creation, publish-ready data, order creation,
  stock reservation, cancellation, and stock restoration.

## Business Code Intentionally Not Changed

- `src/pages`
- Page-facing ViewModel/facade contracts
- Existing OCR, upload, auth, order, stock, product, draft, and SKU behavior
- Existing mock repository public compatibility export
- Existing accepted fixtures

## Remaining Gaps

- The mini-program still uses the in-memory repository at runtime.
- The backend database repository is not exposed through API routes yet.
- No BFF request/response schemas or route handlers exist yet.
- No production database provisioning or backup/restore automation exists yet.

## Next Step

Stop here for review before Module 2.4. The next PRD-gated task is API contract
and BFF endpoints.
