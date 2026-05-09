# 2026-05-09 Phase 2.5 Backup, Restore, And Operational Baseline

## Scope

This delivery executes Module 2.5 from
`docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`.

It adds the backup, restore, migration failure recovery, and data validation
runbooks needed before Phase 2 can move toward a real staging or production
database.

This module started as documentation and operations work, then added local
restore rehearsal automation to疏通 the Phase 2.5 gate. It does not change
mini-program UI, repository behavior, API contracts, migrations, real auth,
object storage, OCR, payment, or production database provisioning.

## PRD Re-Read Checkpoint

Relevant Phase 2.5 requirements:

- Define backup frequency.
- Define restore rehearsal process.
- Define pre-release backup checkpoint.
- Define migration failure recovery process.
- Define data validation queries.
- Define who can run backup and restore operations.

The master PRD also requires migration rollback or compensation SOPs and a
database backup strategy before production release.

## Completed Changes

Added operations docs:

- `docs/operations/backup-restore.md`
- `docs/operations/migration-runbook.md`

Added operations automation:

- `backend/src/operations/staging-restore-rehearsal.ts`
- `backend/src/operations/staging-restore-rehearsal.test.ts`
- `pnpm.cmd run backend:restore:rehearsal`

Updated backend startup wiring:

- `backend/src/main.ts`
- `backend/src/db/client.ts`
- `backend/src/main.test.ts`

Updated handoff:

- `docs/plans/2026-05-09-phase-2-backend-handoff.md`

## Acceptance Coverage

| Requirement | Status |
| --- | --- |
| Backup frequency | Covered for local, staging, and production |
| Restore rehearsal | Covered with staging rehearsal steps and required evidence |
| Pre-release backup | Covered as a required checkpoint before non-local migration |
| Migration failure recovery | Covered with failure modes and recovery decision paths |
| Data validation checklist | Covered with SQL checks for migration history, constraints, duplicates, and orphans |
| Operator permissions | Covered for local, staging, and production backup/restore |

## Important Limitation

No real staging or production database exists in this module, so no real cloud
backup artifact or real staging restore rehearsal was executed.

The repo now contains the operational baseline and a local PostgreSQL-compatible
restore rehearsal command. The first real staging restore must still be recorded
in a future release or environment-provisioning delivery log before production
release.

Strict master PRD gate status:

- `PH2-GATE-001`: Partially疏通. Local restore rehearsal passes through
  `pnpm.cmd run backend:restore:rehearsal`. The master PRD still cannot be
  marked fully Pass until a real staging database or approved staging-like
  database, a backup artifact, a restore target, and validation evidence exist.
- This module is therefore an SOP plus local rehearsal baseline, not final
  Phase 2 completion.

## Business Code Intentionally Not Changed

- `src/`
- `backend/src/db/migrations/`
- Existing API/repository/domain/page contracts

The existing MVP loop remains unchanged:

```text
OCR batch -> drafts -> SPU/SKU -> image supplementation -> publish -> customer order -> merchant confirm/cancel
```

## Verification Result

Commands run on `2026-05-09`:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
pnpm.cmd run backend:restore:rehearsal
```

Result:

- `verify` passed.
- `verify:full` passed.
- `backend:restore:rehearsal` passed with all validation checks at expected
  values.
- App/business tests passed: 18 files, 76 tests.
- Backend tests passed: 8 files, 27 tests.
- Coverage stayed above the current project threshold.
- `build:mp-weixin` completed.
- `smoke:mp-weixin` passed.

## Remaining Gaps

- Real staging database provisioning is still not done.
- Real staging restore rehearsal is still not done; only local rehearsal exists.
- Master PRD Phase 2 cannot be marked fully complete until real staging
  evidence resolves `PH2-GATE-001`.
- Mini-program HTTP adapter remains intentionally out of scope.
- Production auth, object storage, OCR job processing, payment, monitoring,
  alerting, and release rollback automation remain later phases.

## Next Step

Stop here for review before choosing the next module.

The next module should be explicitly approved because the likely paths diverge:

- Provision a real staging database and perform the first restore rehearsal.
- Start a separate frontend HTTP adapter PRD/module.
- Move to Phase 3 object storage planning.
