# Phase 2 Database Schema Contract

## Scope

This contract documents the Phase 2 durable persistence baseline. It mirrors
the current MVP domain contract without replacing the in-memory repository or
mini-program page-facing facades yet.

The schema is created by backend migration `202605090001` and is intentionally
limited to:

- OCR batch metadata.
- Product draft review rows.
- Product SPU records.
- SKU records and stock.
- Customer identity placeholders for future real WeChat auth.
- Staff user placeholders for future role binding.
- Order headers and order item rows.

Real object storage, real WeChat auth, real OCR jobs, payment, inventory ledger,
audit logs, and operations dashboards are outside this schema baseline.

## Migration Tooling

Module 2.2 uses TypeScript-defined SQL migrations and a small custom runner in
`backend/src/db/migrate.ts`.

Commands:

```powershell
pnpm.cmd run backend:migrate:status
pnpm.cmd run backend:migrate
```

Both commands require `DATABASE_URL`. Tests use an in-memory PostgreSQL-compatible
database and do not touch any production database.

Migration history is stored in `schema_migrations` with:

| Column | Purpose |
| --- | --- |
| `id` | Stable migration identifier |
| `name` | Human-readable migration name |
| `checksum` | SHA-256 checksum of the migration SQL |
| `applied_at` | Application timestamp |

If a migration with the same `id` has a different checksum, the runner fails
instead of silently accepting drift.

## Tables

### `ocr_batches`

Stores OCR batch metadata.

Required constraints:

- `id` primary key.
- `status` must be one of `uploaded`, `recognized`, `confirmed`.
- `image_urls` is a non-null text array.
- `created_at` and `updated_at` are required.

### `product_drafts`

Stores draft rows created from OCR output.

Required constraints:

- `id` primary key.
- `batch_id` references `ocr_batches(id)` with cascade delete.
- `status` must be one of `pending`, `needs_completion`, `confirmed`,
  `deleted`.
- `sale_price` must be greater than `0`.
- `stock` must be greater than or equal to `0`.
- `confidence` must be between `0` and `1`.

### `products`

Stores SPU product records.

Required constraints:

- `id` primary key.
- `product_code` is unique and remains the SPU grouping key.
- `status` must be one of `pending_images`, `ready_to_publish`, `published`.
- `created_from_batch_id` references `ocr_batches(id)`.
- `image_urls` is a non-null text array.

### `skus`

Stores SKU records and available stock.

Required constraints:

- `id` primary key.
- `product_id` references `products(id)` with cascade delete.
- `product_code + spec` is unique and remains the SKU grouping key.
- `product_id + spec` is unique.
- `sale_price` must be greater than `0`.
- `stock` must be greater than or equal to `0`.

### `customers`

Stores customer identity placeholders for Phase 4 real auth.

Required constraints:

- `id` primary key.
- `auth_source` must be `mock_wechat` or `wechat`.
- `phone` is unique when present.

### `staff_users`

Stores owner and staff placeholders for future role binding.

Required constraints:

- `id` primary key.
- `role` must be `owner` or `staff`.
- `external_user_id` is unique when present.

### `orders`

Stores order headers.

Required constraints:

- `id` primary key.
- `customer_id` optionally references `customers(id)`.
- `customer_auth_source` must be `mock_wechat` or `wechat`.
- `status` must be one of `pending_merchant_confirm`, `confirmed`,
  `canceled`.
- `total_amount` must be greater than or equal to `0`.

### `order_items`

Stores order line items.

Required constraints:

- `id` primary key.
- `order_id` references `orders(id)` with cascade delete.
- `sku_id` references `skus(id)`.
- `product_id` references `products(id)`.
- `sale_price` must be greater than `0`.
- `quantity` must be greater than `0`.

## Rollback and Compensation

Before applying this migration outside local development:

1. Take a database backup.
2. Confirm the target database is the intended environment.
3. Run `backend:migrate:status` and review pending migrations.

For local or staging compensation, export data that must be preserved and drop
dependent tables in reverse dependency order:

```text
order_items
orders
staff_users
customers
skus
products
product_drafts
ocr_batches
schema_migrations
```

For production, prefer restoring from a verified backup or applying a new
forward migration. Do not edit an already-applied migration file.

## Validation Requirements

The migration test suite must keep covering:

- Empty database migration.
- Repeated migration execution without duplicate history.
- Status check constraints.
- Required foreign keys.
- Numeric quantity, stock, and price constraints.
- Safe missing-configuration output for migration CLI commands.
