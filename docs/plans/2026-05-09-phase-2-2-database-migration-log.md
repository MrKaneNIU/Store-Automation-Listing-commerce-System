# 2026-05-09 Phase 2.2 Database Schema and Migration Baseline

## Scope

This delivery executes Module 2.2 from
`docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`.

It adds a PostgreSQL-compatible schema migration baseline, migration status and
apply commands, empty-database migration tests, schema constraint negative
tests, and rollback or compensation documentation.

This module does not add a database-backed repository, API route groups,
mini-program HTTP adapters, real WeChat auth, real OCR, real object storage, or
payment.

## PRD Re-Read Checkpoint

Relevant Phase 2 PRD rules carried forward:

- Keep each module reviewed before starting the next one.
- Add database schema and migration process before repository replacement.
- Keep current mock repository available.
- Do not touch production databases from tests.
- Preserve the current MVP domain statuses and business invariants.

## Architecture Decision

Module 2.2 uses TypeScript-defined SQL migrations with a small custom runner.

Reasoning:

- The current module needs one initial schema and deterministic tests, not a
  large migration framework.
- Migration metadata, checksum drift detection, and status/apply commands are
  small enough to own locally.
- `pg` provides the future real PostgreSQL connection boundary.
- `pg-mem` provides fast empty-database and constraint tests without requiring
  a local or production PostgreSQL server.

Testing note:

- `pg-mem` required `noAstCoverageCheck` for current PostgreSQL DDL parsing.
  Constraint behavior remains covered by explicit negative tests.

## TDD Evidence

RED:

```powershell
pnpm.cmd run backend:test
```

Result:

- The new migration test file was executed.
- It failed because `backend/src/db/migrate.ts` did not exist.
- This was the intended missing-implementation failure.

GREEN:

```powershell
pnpm.cmd run backend:test
pnpm.cmd run backend:build
```

Result:

- Backend tests passed: 5 test files, 12 tests.
- Backend TypeScript build passed with `tsc -p backend/tsconfig.json`.

## Completed Changes

Added database migration baseline files:

- `backend/src/db/client.ts`
- `backend/src/db/migrate.ts`
- `backend/src/db/migrations/202605090001_initial_phase_2_schema.ts`
- `backend/src/db/migrations/index.ts`

Added backend migration tests:

- `backend/src/db/migration.test.ts`

Updated tooling and environment examples:

- Added `pg` for future PostgreSQL connections.
- Added `pg-mem` and `@types/pg` for backend migration tests.
- Added `backend:migrate` and `backend:migrate:status` scripts.
- Added placeholder `DATABASE_URL` to `backend/.env.example`.

Updated docs:

- `backend/README.md`
- `docs/contracts/database-schema.md`
- `docs/architecture/system-overview.md`
- `docs/testing/test-strategy.md`

## Current Schema

The initial migration creates:

- `schema_migrations`
- `ocr_batches`
- `product_drafts`
- `products`
- `skus`
- `customers`
- `staff_users`
- `orders`
- `order_items`

The schema enforces:

- Required Phase 2 foreign keys.
- Draft, batch, product, order, auth-source, and staff-role status checks.
- Positive price and quantity constraints.
- Non-negative stock and order-total constraints.
- Unique `product_code`.
- Unique `product_code + spec` SKU grouping.

## Business Code Intentionally Not Changed

- `src/domain`
- `src/features`
- `src/services`
- `src/pages`
- Existing mock repository behavior
- Existing OCR, upload, auth, order, stock, product, draft, and SKU behavior
- Existing accepted fixtures
- Page-facing UI contracts

## Remaining Gaps

- No database-backed repository yet.
- No repository port extraction yet.
- No MVP API route groups beyond `GET /health`.
- No mini-program HTTP adapter.
- No production database provisioning, backup automation, or restore rehearsal.

## Next Step

Stop here for review before Module 2.3. The next PRD-gated task is repository
port extraction and database repository implementation.
