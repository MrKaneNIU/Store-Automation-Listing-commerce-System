# 2026-05-09 Phase 2 Backend Handoff

## Current Status

Phase 0 and Phase 1 have been implemented and verified in the local workspace.
Phase 2.1 through Phase 2.4 have been implemented and verified as engineering
baselines. Phase 2.5 has an operations SOP baseline. The latest strict Phase 2
CloudBase backend/persistence gate is complete enough to hand off to Phase 3
real image/object storage.

Route update:

- On 2026-05-09, the user approved changing the long-term backend and
  persistence route to WeChat official CloudBase.
- The PostgreSQL-compatible backend/database work listed below remains
  preserved as engineering baseline and transitional evidence.
- Future Phase 2 implementation should follow
  `docs/plans/2026-05-09-cloudbase-route-decision.md` and should not request a
  staging PostgreSQL `DATABASE_URL` unless a later PRD explicitly re-approves
  the PostgreSQL route.

Strict gate review:

- `docs/plans/2026-05-09-phase-2-strict-prd-gate-review.md`

Current CloudBase progress:

- CloudBase environment `cloud1-d7gifjyzl7721b383` is recorded and accessible.
- Free quota remains the approved billing posture.
- Required Phase 2 collections were created with `ADMINONLY` permissions.
- Core MVP-path indexes were created or confirmed.
- `mallHealth` and `mallApi` were deployed and smoke-tested.
- `mallApi` now writes and reads CloudBase business data for the
  OCR/draft/product baseline:
  `createOcrBatch -> getLatestDrafts -> confirmBatch -> listProducts`.
- `mallApi` no longer returns `NOT_IMPLEMENTED` for `createOcrBatch`.
- A mini-program service adapter now maps `wx.cloud.callFunction` style calls
  to the deployed `mallApi` action contract without page-level `wx.cloud`
  calls.
- The active owner/staff/customer MVP pages now call CloudBase page-facing
  facades under `src/features/cloudbase-mall`.
- The generated mp-weixin artifact now uses real AppID
  `wxa63c53796488d4d4`.
- The AppID/environment/function/collection blockers were resolved for
  CloudBase environment `cloud1-d7gifjyzl7721b383`.
- The user confirmed the current owner `开始识别` path passed WeChat DevTools
  manual acceptance after the CloudBase fixes.
- Fixed mock OCR output is no longer written as if it were recognized product
  data; real OCR/AI remains a Phase 6 scope item.

This handoff is the single entry point for the work completed today. Detailed
module evidence remains in the per-module logs listed below.

## Completed Work

### Phase 0 And Phase 1 Boundary Work

Completed:

- Baseline acceptance and verification records.
- Page-facing UI boundary review.
- Medium-risk page boundary tightening.
- Frozen page-facing UI contracts.
- Customer product list and owner screenshot import feature boundaries.

Key docs:

- `docs/plans/2026-05-09-phase-0-baseline-acceptance-log.md`
- `docs/plans/2026-05-09-phase-1-1-ui-boundary-review-log.md`
- `docs/plans/2026-05-09-phase-1-2-medium-risk-ui-boundary-log.md`
- `docs/plans/2026-05-09-phase-1-3-ui-contract-freeze-log.md`
- `docs/contracts/page-facing-ui-contracts.md`

### Phase 2.1 Backend Baseline

Completed:

- TypeScript Node backend directory under `backend/`.
- Health endpoint.
- Unified response envelope helpers.
- Safe environment validation and startup error handling.
- Backend test/build scripts and CI backend verification.

Key docs:

- `docs/plans/2026-05-09-phase-2-1-backend-baseline-log.md`
- `backend/README.md`

### Phase 2.2 Database Schema And Migration Baseline

Completed:

- PostgreSQL-compatible migration baseline.
- Phase 2 schema covering OCR batches, drafts, products, SKUs, customers,
  staff users, orders, and order items.
- Migration status/apply commands.
- Empty-database migration tests.
- Constraint negative tests.
- Rollback and compensation documentation.

Key docs:

- `docs/plans/2026-05-09-phase-2-2-database-migration-log.md`
- `docs/contracts/database-schema.md`

### Phase 2.3 Repository Port And Database Repository

Completed:

- Mall repository port.
- Memory repository factory and compatibility export.
- Shared repository contract tests.
- Database repository implementation.
- Transaction rollback test.
- Main MVP loop test against migrated in-memory PostgreSQL-compatible database.

Key docs:

- `docs/plans/2026-05-09-phase-2-3-repository-port-log.md`

### Phase 2.4 API Contract And BFF Endpoints

Completed:

- Backend-only API route table.
- Request validation.
- Stable API error codes.
- MVP route handlers for OCR batches, draft review, products/SKUs, image tasks,
  customer orders, and merchant orders.
- API contract tests.
- API documentation.

Key docs:

- `docs/plans/2026-05-09-phase-2-4-api-contract-log.md`
- `docs/contracts/api-contract.md`

### Phase 2.5 Backup, Restore, And Operational Baseline

Completed:

- Backup frequency baseline for local, staging, and production.
- Pre-release backup checkpoint.
- Restore rehearsal process and required evidence.
- Migration failure recovery runbook.
- Data validation SQL checklist for Phase 2 tables.
- Operator permission boundary for backup and restore operations.

Open operations gaps carried forward:

- `PH2-GATE-001`: CloudBase console still reports database rollback capability
  is not enabled; production-grade restore/rollback remains a pre-production
  operations gap.
- Phase 2 smoke/manual data may be cleaned if a pristine dev CloudBase dataset
  is needed for Phase 3 acceptance.

Key docs:

- `docs/plans/2026-05-09-phase-2-5-backup-restore-log.md`
- `docs/operations/backup-restore.md`
- `docs/operations/migration-runbook.md`

## Verification Evidence

Latest successful checks:

```powershell
node scripts\smoke-cloudbase-api.mjs
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/cloudbase-function-client.test.ts src/services/cloudbase/mall-api-client.test.ts
npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId cloud1-d7gifjyzl7721b383 --dir cloudfunctions/mallApi --force --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-create-ocr-batch.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-get-latest-drafts.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-list-products.json' --json
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Observed results:

- Focused CloudBase service/facade tests include `src/features/cloudbase-mall`
  and cover page-facing CloudBase calls for the MVP runtime path.
- Local `mallApi` smoke passed against explicit memory mode.
- Deployed CloudBase `mallApi` smoke passed for write/read/confirm/list
  actions.
- `verify` passed with 21 app/business test files, 88 tests, 12 backend test
  files, 40 backend tests, lint, boundary-check, 88.89% line coverage,
  type-check, backend build, and dependency audits.
- `verify:full` passed; mini-program build completed and `smoke:mp-weixin`
  passed.
- 2026-05-10 AppID-sync refresh: `verify:full` passed again after
  `src/manifest.json` was updated to `wxa63c53796488d4d4`.
- 2026-05-10 final Phase 2 gate refresh:
  - `pnpm.cmd run verify` passed with 22 app/business test files, 89 tests, 12
    backend test files, 40 backend tests, lint, boundary-check, coverage,
    type-check, backend build, and dependency audits.
  - `pnpm.cmd run verify:full` passed; it reran `verify`, built
    `dist/build/mp-weixin`, and `smoke:mp-weixin` passed.
- 2026-05-10 manual acceptance: after the CloudBase AppID/environment/function/
  collection fixes, the user confirmed the current owner `开始识别` path passed.
- `boundary-check` passed.
- `type-check` passed.
- `audit:prod` and `audit:all` found no known vulnerabilities.
- `build:mp-weixin` completed.
- `smoke:mp-weixin` passed.

## Business Code Preserved

The following behavior remains intentionally unchanged:

- Existing OCR to draft to SPU/SKU to publish to order MVP loop.
- Mini-program pages are not wired directly to backend HTTP APIs or
  `wx.cloud`.
- Visual page layouts and page-facing UI contract shapes remain unchanged.
- No real WeChat auth, real OCR job processing, real object storage, payment,
  production database provisioning, backup automation, or real staging restore
  rehearsal has been added.

## Next Recommended Step

Begin Phase 3 real image/object storage with a dedicated Phase 3 PRD /
Repository Impact Map / Execution Plan before implementation.

Phase 3 scope must stay limited to real image upload, storage, access,
replacement, failure handling, and CloudBase storage/domain acceptance. Do not
pull real OCR/AI into Phase 3; that remains Phase 6.
