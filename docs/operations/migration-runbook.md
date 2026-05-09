# Migration Failure And Data Validation Runbook

## Scope

This runbook covers the Phase 2 backend migration runner in
`backend/src/db/migrate.ts`.

Current commands:

```powershell
pnpm.cmd run backend:migrate:status
pnpm.cmd run backend:migrate
```

Both commands require `DATABASE_URL`. Tests use an in-memory
PostgreSQL-compatible database and do not touch production.

## Before Running A Migration

1. Confirm `DATABASE_URL` points to the intended environment.
2. Run:

   ```powershell
   pnpm.cmd run backend:migrate:status
   ```

3. Confirm pending migration IDs match the release plan.
4. Confirm no checksum drift is reported.
5. Take the pre-release backup described in
   `docs/operations/backup-restore.md`.
6. Confirm the app release does not require frontend page contract changes
   unless a separate approved PRD covers them.

## Failure Modes

| Failure | Meaning | Response |
| --- | --- | --- |
| `DATABASE_CONFIGURATION_ERROR` | `DATABASE_URL` or environment config is missing or invalid | Stop, fix environment configuration, rerun status |
| `DATABASE_MIGRATION_ERROR` before any pending migration is applied | Migration command failed safely | Stop, inspect database logs, fix via a new migration or config correction |
| Checksum mismatch | An already-applied migration file no longer matches history | Stop, restore the original migration file or create a new forward migration |
| Partial external failure after migration success | Database changed but release failed elsewhere | Decide between app rollback with database retained, forward compensation, or restore |
| Validation checklist failure | Schema or data no longer satisfies Phase 2 contract | Stop release, restore or compensate before opening traffic |

The runner wraps pending migrations in a transaction. A SQL failure during the
current batch should roll back the unapplied batch, but operators must still
verify database state with `backend:migrate:status` and the checklist below.

## Recovery Process

1. Stop the release or migration rollout.
2. Save the terminal output and database error details.
3. Run migration status against the same target database.
4. Compare `schema_migrations` with the expected migration IDs.
5. Run the validation checklist below.
6. Choose one path:
   - Fix configuration and rerun if no schema/data change was applied.
   - Add a new forward migration if the schema is valid but incomplete.
   - Restore from the latest verified backup if data integrity is uncertain.
   - Apply a narrow compensation script only when affected rows are known.
7. Record the recovery path in the module or release delivery log.

## Data Validation Checklist

Run these checks after restore, migration, and recovery operations.

```sql
SELECT id, name, applied_at
FROM schema_migrations
ORDER BY id;
```

Expected: every intended migration appears once.

```sql
SELECT COUNT(*) AS invalid_draft_prices
FROM product_drafts
WHERE sale_price <= 0;
```

Expected: `0`.

```sql
SELECT COUNT(*) AS invalid_draft_stock
FROM product_drafts
WHERE stock < 0;
```

Expected: `0`.

```sql
SELECT COUNT(*) AS invalid_sku_stock
FROM skus
WHERE stock < 0;
```

Expected: `0`.

```sql
SELECT product_code, spec, COUNT(*) AS duplicate_count
FROM skus
GROUP BY product_code, spec
HAVING COUNT(*) > 1;
```

Expected: no rows.

```sql
SELECT product_code, COUNT(*) AS duplicate_count
FROM products
GROUP BY product_code
HAVING COUNT(*) > 1;
```

Expected: no rows.

```sql
SELECT COUNT(*) AS orphan_drafts
FROM product_drafts d
LEFT JOIN ocr_batches b ON b.id = d.batch_id
WHERE b.id IS NULL;
```

Expected: `0`.

```sql
SELECT COUNT(*) AS orphan_order_items
FROM order_items i
LEFT JOIN orders o ON o.id = i.order_id
LEFT JOIN products p ON p.id = i.product_id
LEFT JOIN skus s ON s.id = i.sku_id
WHERE o.id IS NULL OR p.id IS NULL OR s.id IS NULL;
```

Expected: `0`.

```sql
SELECT COUNT(*) AS invalid_order_totals
FROM orders
WHERE total_amount < 0;
```

Expected: `0`.

## Compensation Notes

For local or staging rebuilds, dependent tables can be recreated in reverse
dependency order when the data is disposable:

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

For production:

- Prefer restore from a verified backup for unknown corruption.
- Prefer a new forward migration for schema correction.
- Prefer a reviewed compensation script for a small, known row set.
- Never weaken constraints or delete migration history to make status pass.

## Required Evidence

Every non-local migration or restore record must include:

- Environment.
- Operator.
- Migration IDs.
- Backup artifact ID.
- Status command result.
- Validation checklist result.
- Restore or compensation decision.
- Follow-up defects, if any.
