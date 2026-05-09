# Backup And Restore Runbook

## Scope

This runbook is the Phase 2.5 operational baseline for the durable PostgreSQL
boundary.

It applies to the Phase 2 tables documented in
`docs/contracts/database-schema.md`:

- `schema_migrations`
- `ocr_batches`
- `product_drafts`
- `products`
- `skus`
- `customers`
- `staff_users`
- `orders`
- `order_items`

It does not cover real object storage, real WeChat auth secrets, payment data,
audit logs, or OCR job artifacts. Those belong to later phases.

## Backup Frequency

| Environment | Frequency | Retention | Purpose |
| --- | --- | --- | --- |
| Local development | Manual before destructive migration tests | Developer discretion | Recover a local working dataset |
| Staging | Daily automated backup once staging exists, plus manual backup before release rehearsal | At least 7 daily restore points | Rehearse migration and restore before production |
| Production | Daily automated backup, plus manual backup before every release or migration | At least 14 daily restore points and the latest pre-release backup | Recover from migration failure, operator error, or data loss |

Until staging and production databases are provisioned, this repository only
defines the process. Do not record a production backup as complete without a
real backup artifact and restore evidence.

## Pre-Release Backup Checkpoint

Before applying a migration outside local development:

1. Confirm the target environment and database name.
2. Run:

   ```powershell
   pnpm.cmd run backend:migrate:status
   ```

3. Confirm the pending migration IDs match the release plan.
4. Create a database backup using the environment's approved tool.
5. Record the backup artifact ID, timestamp, operator, and target environment
   in the release notes or delivery log.
6. Restore the backup into a non-production database when this is a staging
   rehearsal or a production release with material schema risk.
7. Run the data validation checklist from `docs/operations/migration-runbook.md`
   against the restored database.

## Restore Rehearsal Process

Staging restore rehearsal is required before production Phase 2 release.

1. Choose a staging backup artifact.
2. Restore it into a clean rehearsal database.
3. Run migration status against the restored database:

   ```powershell
   $env:DATABASE_URL = '<restored rehearsal database url>'
   pnpm.cmd run backend:migrate:status
   ```

4. If migrations are pending, apply them only after confirming the environment:

   ```powershell
   pnpm.cmd run backend:migrate
   ```

5. Run the validation checklist in `docs/operations/migration-runbook.md`.
6. Record:
   - Backup artifact ID.
   - Source environment.
   - Restore target.
   - Operator.
   - Start and finish time.
   - Validation result.
   - Any defects or manual compensation.

## Operator Permissions

| Operation | Allowed operator |
| --- | --- |
| Local backup or restore | Developer working on the local database |
| Staging backup | Developer or release owner |
| Staging restore rehearsal | Release owner, with at least one reviewer for production-bound rehearsal |
| Production backup | Release owner or database operator |
| Production restore | Database operator plus release owner approval |
| Production destructive compensation | Database operator plus explicit business approval |

Production restore should never be performed from an unverified backup.

## Restore Decision Rules

Use restore when:

- A migration fails after modifying data or schema.
- Operator error deletes or corrupts multiple business records.
- Production data no longer satisfies the core validation checklist.
- A release must return to the exact pre-release database state.

Prefer forward compensation when:

- The issue affects a small set of identified rows.
- The schema remains valid.
- A new corrective migration is safer than restoring the whole database.

Do not edit an already-applied migration file to repair production. Add a new
forward migration or restore from a verified backup.

## Current Phase 2.5 Status

The repo now has an operational runbook baseline, but no real staging or
production database has been provisioned from this module. The first real
staging restore rehearsal must be recorded in a future delivery log before
production release.
