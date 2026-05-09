# 2026-05-09 Phase 1.3 UI Refactor Contract Freeze

## Scope

This delivery executes Phase 1.3 from
`docs/prd/2026-05-08-enterprise-launch-master-prd.md`.

It freezes the current page-facing ViewModel and Facade contracts so future UI
redesign work can replace page shells without reading or changing lower-level
business implementation.

This is documentation and verification work only. It does not change business
code, page UI, tests, fixtures, build scripts, package dependencies, or data
contracts.

## PRD Re-Read Checkpoint

Relevant master PRD sections reviewed before this work:

- Module 1.3: write contract descriptions for every page-facing ViewModel and
  Facade.
- Module 1.3: clarify which fields UI may use.
- Module 1.3: clarify which fields or rules UI must not modify.
- Module 1.3: clarify what future UI redesign may not change by default.
- Phase 7 gate: large UI redesign requires frozen page-facing ViewModel /
  Facade contracts.

Relevant master PRD rule carried forward:

- Do not start Phase 2 implementation directly from the master PRD. Real
  backend and persistence still need a dedicated Phase 2 PRD or execution plan.

## Completed Changes

Added:

- `docs/contracts/page-facing-ui-contracts.md`

The contract document covers:

- Global UI rules.
- `src/features/customer-product-list`
- `src/features/customer-product-detail`
- `src/features/owner-screenshot-import`
- `src/features/owner-draft-review`
- `src/features/owner-products`
- `src/features/owner-orders`
- `src/features/staff-image-tasks`
- Contract change process.

For each page-facing module, the document records:

- Feature module path.
- UI entry points.
- Fields UI may read.
- Parameters UI may pass.
- Logic UI must not own.
- Focused feature test file that protects the contract.

Updated:

- `docs/architecture/module-boundaries.md`
- `docs/testing/test-strategy.md`
- `docs/quality/review-checklist.md`

These docs now point future UI work to
`docs/contracts/page-facing-ui-contracts.md`.

## Business Code Intentionally Not Changed

- `src/domain`
- `src/features`
- `src/services`
- `src/pages`
- Tests and fixtures
- Build scripts
- Package dependencies

## Verification

The Phase 1.3 delivery passed the following commands on `2026-05-09`:

```powershell
pnpm.cmd run boundary-check
pnpm.cmd test
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Observed results:

- `boundary-check`: passed.
- Vitest: 17 test files passed, 72 tests passed.
- `verify`: passed lint, boundary check, tests, coverage, type-check, prod
  audit, and full audit.
- `verify:full`: passed `verify`, `uni build -p mp-weixin`, and
  `scripts/e2e-smoke.mjs`.
- E2E smoke confirmed mp-weixin build artifacts and page routes are present.

## Phase 1 Exit Decision

Phase 1 UI boundary engineering is now complete at the PRD level:

- Phase 1.1 reviewed and archived the high-risk page boundaries.
- Phase 1.2 closed the medium-risk customer list and owner screenshot import
  page boundaries.
- Phase 1.3 froze the page-facing UI contracts for future redesign work.

The next PRD-gated step is Phase 2: real backend and persistence. Per the
master PRD, Phase 2 should begin with a dedicated Phase 2 PRD or execution plan
before implementation.

## Remaining Gaps

- Formal release acceptance still needs screenshots or recordings, exact
  WeChat DevTools version, base library version, simulator/device details, and
  release AppID/domain settings.
- Real backend, real storage, real auth, real OCR, inventory ledger, audit
  logging, monitoring, backups, rollback SOP, and production release SOP remain
  future phases.
