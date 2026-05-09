# 2026-05-09 Phase 2.4 API Contract and BFF Endpoints

## Scope

This delivery executes Module 2.4 from
`docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`.

It adds backend-only API route names, request validation, MVP BFF handlers,
stable error codes, API contract tests, negative validation tests, and API
documentation.

This module does not add mini-program HTTP adapters, UI changes, real WeChat
auth, real OCR, real object storage, payment, or production database
provisioning.

## PRD Re-Read Checkpoint

Relevant Phase 2 PRD rules carried forward:

- API must use the unified response envelope.
- API error codes must be stable and documented.
- API must not expose stack traces, secrets, or database internals.
- API fields must match frontend/domain contract names.
- Duplicate batch confirmation must be idempotent.

## Architecture Decision

The API layer uses Node's built-in HTTP primitives and hand-written validators.

Reasoning:

- The backend still has a small route surface and no external framework yet.
- Manual validation keeps this module dependency-neutral.
- The API handler is injectable into the backend server, so tests can run it
  against a migrated in-memory PostgreSQL-compatible database without touching
  production.

The default backend startup remains health-check safe. API production wiring can
be enabled in a later operational module when real database configuration and
runtime lifecycle rules are approved.

## TDD Evidence

RED:

```powershell
pnpm.cmd run backend:test
```

Result:

- The new API contract test file was executed.
- It failed because `backend/src/api/routes.ts` did not exist.
- This was the intended missing-implementation failure.

GREEN:

```powershell
pnpm.cmd run backend:test
pnpm.cmd run backend:build
```

Result:

- Backend tests passed: 7 test files, 24 tests.
- Backend TypeScript build passed.

## Completed Changes

Added API files:

- `backend/src/api/routes.ts`
- `backend/src/api/schemas.ts`
- `backend/src/api/errors.ts`
- `backend/src/api/handlers/mall-api.ts`
- `backend/src/api/api-contract.test.ts`

Updated backend server and error codes:

- `backend/src/server.ts`
- `backend/src/http/errors.ts`

Updated tooling and docs:

- Added `verify:api`.
- Added `docs/contracts/api-contract.md`.
- Updated backend and architecture/test docs.

## Route Groups Covered

- `GET /health`
- OCR batches
- Draft review
- Products/SKUs
- Image tasks
- Customer orders
- Merchant orders

## Test Coverage Added

- Request validation error envelope.
- No stack/path leakage in validation errors.
- Batch creation and latest draft listing.
- Draft update and delete commands.
- Idempotent batch confirmation.
- Product/SKU/image-task endpoints.
- Unauthorized customer order negative path.
- Customer order creation and lookup.
- Merchant cancellation and stock restoration.
- Invalid state transition conflict.

## Business Code Intentionally Not Changed

- `src/pages`
- Mini-program feature facades and ViewModels
- Existing synchronous in-memory repository runtime path
- Existing mock OCR, upload, auth, order, product, draft, SKU behavior
- Existing accepted UI-facing contracts

## Remaining Gaps

- Mini-program HTTP adapter is not implemented yet.
- Default backend startup is not yet wired to a production database-backed API
  lifecycle.
- No production auth, storage, OCR job processing, payment, backup automation,
  or restore rehearsal exists yet.

## Next Step

Stop here for review before Module 2.5 or a separate frontend HTTP-adapter
module. The next PRD-listed task is backup, restore, and operational baseline.
