# 2026-05-09 Phase 2.1 Backend Project and Environment Baseline

## Scope

This delivery executes Module 2.1 from
`docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`.

It adds the first backend BFF/API baseline: a TypeScript Node HTTP server,
health check endpoint, unified response envelopes, environment validation,
backend verification scripts, and local startup documentation.

This module does not add database schema, migrations, repository replacement,
mini-program page changes, real WeChat auth, real image storage, real OCR, or
payment.

## PRD Re-Read Checkpoint

Relevant Phase 2 PRD rules carried forward:

- Start with Module 2.1 only.
- Keep the backend separate from `src/` mini-program source.
- Keep mini-program pages free of direct HTTP, database, repository, and mock
  adapter access.
- Do not start database schema, migrations, repository replacement, or real
  auth/storage/OCR in this module.

Relevant master PRD rules carried forward:

- Do not mix real backend, real OCR, payment, or UI redesign in one round.
- Each module must finish verification and documentation before the next
  module starts.

## Architecture Decision

Module 2.1 uses Node's built-in HTTP server instead of adding Express, Fastify,
or Hono.

Reasoning:

- The first slice only needs `GET /health` and a response envelope.
- Avoiding a framework keeps dependency scope small until API routing,
  validation, and middleware needs are clearer in Module 2.4.
- Future modules may still introduce a backend framework by PRD-approved
  decision if route complexity warrants it.

## TDD Evidence

RED:

```powershell
pnpm.cmd exec vitest run --config backend/vitest.config.ts
```

Result:

- 3 backend test files were executed.
- They failed because `./env`, `./response`, and `./server` did not exist.
- This was the intended missing-implementation failure.

GREEN:

```powershell
pnpm.cmd run backend:test
pnpm.cmd run backend:build
```

Result:

- Backend tests passed: 3 test files, 7 tests.
- Backend TypeScript build passed with `tsc -p backend/tsconfig.json`.

## Completed Changes

Added backend baseline files:

- `backend/src/http/response.ts`
- `backend/src/http/errors.ts`
- `backend/src/config/env.ts`
- `backend/src/server.ts`
- `backend/src/main.ts`
- `backend/tsconfig.json`
- `backend/vitest.config.ts`
- `backend/.env.example`
- `backend/README.md`

Added backend tests:

- `backend/src/http/response.test.ts`
- `backend/src/config/env.test.ts`
- `backend/src/server.test.ts`

Updated root tooling:

- Added `@types/node` as a dev dependency for typed Node APIs.
- Added `backend:test`, `backend:build`, `backend:start`, and
  `verify:backend`.
- Added `verify:backend` to the root `verify` command.
- Updated `.gitignore` so `.env.example` files remain trackable while real
  `.env` files stay ignored.

Updated docs:

- `README.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/module-boundaries.md`
- `docs/testing/test-strategy.md`
- `docs/quality/review-checklist.md`

## Current API

```text
GET /health
```

Successful response:

```json
{
  "success": true,
  "data": {
    "service": "vx-close-backend",
    "status": "ok"
  },
  "error": null,
  "meta": {}
}
```

Unknown routes return a safe `NOT_FOUND` envelope. Unsupported methods on
`/health` return a safe `METHOD_NOT_ALLOWED` envelope.

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

- No database schema or migration process yet.
- No repository port extraction yet.
- No database-backed repository yet.
- No MVP API route groups beyond `GET /health` yet.
- No mini-program HTTP adapter yet.
- CI currently has explicit mini-program checks; the backend baseline is
  covered by `pnpm.cmd run verify` locally and should be mirrored into CI when
  the project updates the workflow.

## Next Step

Stop here for review before Module 2.2. The next PRD-gated task is database
schema and migration baseline.
