# VX Close Backend

This is the Phase 2 backend baseline for the VX Close System.

It intentionally uses Node's built-in HTTP server for the first health-check
slice. Module 2.2 adds a PostgreSQL-compatible schema migration baseline.
Module 2.3 adds a database-backed repository that is covered by the same
contract tests as the in-memory repository. Module 2.4 adds backend-only BFF/API
routes and contract tests. No mini-program HTTP adapter, image storage, real
WeChat auth, real OCR provider, or payment is introduced yet.

## Local Commands

```powershell
pnpm.cmd run backend:test
pnpm.cmd run backend:build
$env:BACKEND_HOST = '127.0.0.1'
$env:BACKEND_PORT = '3001'
$env:NODE_ENV = 'development'
pnpm.cmd run backend:start
```

Migration status and apply commands:

```powershell
$env:DATABASE_URL = 'postgresql://vx_close_user:replace-with-local-password@localhost:5432/vx_close_dev'
pnpm.cmd run backend:migrate:status
pnpm.cmd run backend:migrate
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/health
```

Expected response shape:

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

## Environment

Copy `backend/.env.example` into your local environment manager or set the
variables manually. Do not commit real secrets.

Required:

- `BACKEND_PORT`: TCP port from `1` to `65535`.
- `DATABASE_URL`: PostgreSQL connection string for migration commands. Tests use
  an in-memory database and do not require this value.

Optional:

- `BACKEND_HOST`: defaults to `127.0.0.1`.
- `NODE_ENV`: defaults to `development`; allowed values are `development`,
  `test`, and `production`.

## Database Migration Baseline

Module 2.2 uses TypeScript-defined SQL migrations in
`backend/src/db/migrations/` and a small runner in `backend/src/db/migrate.ts`.

The initial migration creates the Phase 2 tables:

- `ocr_batches`
- `product_drafts`
- `products`
- `skus`
- `customers`
- `staff_users`
- `orders`
- `order_items`

Schema details and compensation notes are documented in
`docs/contracts/database-schema.md`.

## Repository Baseline

Module 2.3 adds `backend/src/repositories/database-mall-repository.ts`.

It is not wired to mini-program pages yet. Repository and API tests run it
against an in-memory PostgreSQL-compatible database after applying the Phase 2
migration baseline.

## API Baseline

Module 2.4 adds API route handlers in `backend/src/api/`.

The API contract is documented in `docs/contracts/api-contract.md`. The handler
is injectable into the backend server and is tested against the database
repository. Default local startup remains health-check focused until production
database lifecycle wiring is approved.
