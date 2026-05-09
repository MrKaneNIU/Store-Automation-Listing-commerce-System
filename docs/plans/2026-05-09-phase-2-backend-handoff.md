# 2026-05-09 Phase 2 Backend Handoff

## Current Status

Phase 0 and Phase 1 have been implemented and verified in the local workspace.
Phase 2.1 through Phase 2.4 have been implemented and verified as engineering
baselines. Phase 2.5 has an operations SOP baseline, but the strict Phase 2
gate is not fully complete yet.

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

- CloudBase environment `shop-d0gl83cca8b2777b5` is recorded and accessible.
- Free quota remains the approved billing posture.
- Required Phase 2 collections were created with `ADMINONLY` permissions.
- Core MVP-path indexes were created or confirmed.
- `mallHealth` and `mallApi` were deployed and smoke-tested.
- `mallApi` is still a contract boundary only; business actions such as
  `createOcrBatch` still return `NOT_IMPLEMENTED`.
- The mini-program runtime is not yet switched to the real CloudBase cloud
  function path.
- WeChat DevTools manual acceptance against the CloudBase integration path is
  still pending.

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

Blocked:

- `PH2-GATE-001`: no real staging database or backup artifact exists yet, so a
  real staging restore rehearsal has not been completed.
- `PH2-GATE-002`: the mini-program runtime is not wired to the backend API
  integration path yet, so WeChat DevTools acceptance cannot be rerun against
  that path.
- `PH2-GATE-003`: the actual mini-program runtime still uses the in-memory
  repository path, so the master PRD's durable-persistence replacement goal is
  not fully met.

Key docs:

- `docs/plans/2026-05-09-phase-2-5-backup-restore-log.md`
- `docs/operations/backup-restore.md`
- `docs/operations/migration-runbook.md`

## Verification Evidence

Latest successful checks:

```powershell
pnpm.cmd run verify:api
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Observed results:

- Backend tests: 8 files, 27 tests passed.
- App/business tests: 18 files, 76 tests passed.
- Coverage: 92.62% statements, 83.83% branches, 95.53% functions, 92.62% lines.
- `boundary-check` passed.
- `type-check` passed.
- `audit:prod` and `audit:all` found no known vulnerabilities.
- `build:mp-weixin` completed.
- `smoke:mp-weixin` passed.

## Business Code Preserved

The following behavior remains intentionally unchanged:

- Existing OCR to draft to SPU/SKU to publish to order MVP loop.
- Current mini-program runtime still uses the in-memory repository path.
- Mini-program pages are not wired to backend HTTP APIs yet.
- No real WeChat auth, real OCR job processing, real object storage, payment,
  production database provisioning, backup automation, or real staging restore
  rehearsal has been added.

## Next Recommended Step

Phase 2.5 now defines the operational baseline for the previous PostgreSQL
engineering path, but the approved next route is CloudBase. The first real
acceptance blockers are now CloudBase business-data wiring, mini-program
CloudBase service integration, and WeChat DevTools acceptance.

Do not mark Phase 2 fully complete until the strict gate review blockers are
re-scoped and resolved under the CloudBase PRD route.

Stop here for review before selecting the next module. Likely next paths are:

- Wire the minimum `mallApi` OCR/draft actions to CloudBase persistence.
- Smoke-test real CloudBase writes and reads through deployed `mallApi`.
- Wire the mini-program service adapter to the deployed cloud function path
  without page-level `wx.cloud` calls.
- Run WeChat DevTools manual acceptance against the CloudBase integration path.

Do not move to Phase 3 object storage planning until these CloudBase Phase 2
gate items are resolved and recorded.
