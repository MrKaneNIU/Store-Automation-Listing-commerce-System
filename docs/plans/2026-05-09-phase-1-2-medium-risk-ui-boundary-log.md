# 2026-05-09 Phase 1.2 Medium-Risk UI Boundary Delivery

## Scope

This delivery executes Phase 1.2 from
`docs/prd/2026-05-08-enterprise-launch-master-prd.md`.

It closes the remaining medium-risk page boundary gaps for:

- Customer product list page.
- Owner screenshot import page.

This is a page-boundary hardening task. It does not change product, SKU, draft,
order, auth, OCR, upload, repository, or mock data contracts. It also does not
redesign the UI or introduce a real backend.

## PRD Re-Read Checkpoint

Relevant master PRD sections reviewed before this work:

- Module 1.2: customer product list page should sink product list ViewModel and
  minimum price display into a feature module.
- Module 1.2: owner screenshot import page should sink uploaded image
  descriptor creation and OCR batch result summary into a feature module.
- Module 1.2 acceptance: pages still do not call lower-level services directly.
- Module 1.2 acceptance: screenshot import behavior remains unchanged.
- Module 1.2 acceptance: customer list only shows published products.

Relevant master PRD rule carried forward:

- Do not mix real backend, real OCR, payment, or UI redesign into this module.

## TDD Evidence

RED:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/customer-product-list/customer-product-list.test.ts src/features/owner-screenshot-import/owner-screenshot-import.test.ts
```

After syntax cleanup in the new tests, the valid RED failure was:

- `./customer-product-list` did not exist.
- `./owner-screenshot-import` did not exist.

GREEN:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/customer-product-list/customer-product-list.test.ts src/features/owner-screenshot-import/owner-screenshot-import.test.ts
```

Result:

- 2 test files passed.
- 5 tests passed.

## Completed Changes

### Customer Product List

Added:

- `src/features/customer-product-list/customer-product-list.ts`
- `src/features/customer-product-list/customer-product-list.test.ts`

Behavior:

- Builds a customer-facing published product list ViewModel.
- Filters through `mallAccess.listPublishedProducts()`, so unpublished products
  are not exposed to the customer page.
- Adds `minPrice` to each list item through the feature layer.
- Returns a stable empty-state message when no published products exist.

Updated:

- `src/pages/customer/product-list/index.vue`

Page result:

- The page no longer imports `mallAccess`.
- The page keeps layout, product-card tap, and navigation only.
- Price display uses `product.minPrice` from the ViewModel.

### Owner Screenshot Import

Added:

- `src/features/owner-screenshot-import/owner-screenshot-import.ts`
- `src/features/owner-screenshot-import/owner-screenshot-import.test.ts`

Behavior:

- Creates uploaded image descriptors from selected temp file paths.
- Removes selected image descriptors immutably.
- Runs the existing mock OCR import workflow.
- Returns `totalDraftCount`, `needsCompletionCount`, and page-ready result
  message.

Updated:

- `src/pages/owner/import-upload/index.vue`

Page result:

- The page no longer imports `mallWorkflow` or `createId`.
- The page keeps image picker, local selected screenshot state, remove tap,
  loading state, and draft rendering.
- OCR import behavior remains backed by the existing mock workflow.

## Verification

The Phase 1.2 delivery passed the following commands on `2026-05-09`:

```powershell
pnpm.cmd run boundary-check
pnpm.cmd test
pnpm.cmd run coverage
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Observed results:

- `boundary-check`: passed.
- Vitest: 17 test files passed, 72 tests passed.
- Coverage: all files 91.73% statements, 83.91% branches, 95.37% functions,
  91.73% lines.
- `verify`: passed lint, boundary check, tests, coverage, type-check, prod
  audit, and full audit.
- `verify:full`: passed `verify`, `uni build -p mp-weixin`, and
  `scripts/e2e-smoke.mjs`.
- E2E smoke confirmed mp-weixin build artifacts and page routes are present.

## Files Changed

- Added `src/features/customer-product-list/customer-product-list.ts`.
- Added `src/features/customer-product-list/customer-product-list.test.ts`.
- Added `src/features/owner-screenshot-import/owner-screenshot-import.ts`.
- Added `src/features/owner-screenshot-import/owner-screenshot-import.test.ts`.
- Updated `src/pages/customer/product-list/index.vue`.
- Updated `src/pages/owner/import-upload/index.vue`.
- Updated `docs/architecture/system-overview.md`.
- Updated `docs/architecture/module-boundaries.md`.
- Updated `docs/testing/test-strategy.md`.
- Added `docs/plans/2026-05-09-phase-1-2-medium-risk-ui-boundary-log.md`.

## Business Code Intentionally Not Changed

- `src/domain`
- `src/services`
- `src/features/mall-workflow`
- Repository, OCR, upload, auth, product, SKU, draft, and order contracts
- Existing accepted fixtures
- Build scripts and package dependencies

## Remaining Gaps

- Phase 1.3 still needs page-facing ViewModel / Facade contract freeze
  documentation.
- Formal release acceptance still needs screenshots or recordings, exact
  WeChat DevTools version, base library version, simulator/device details, and
  release AppID/domain settings.
- Real backend, real storage, real auth, real OCR, inventory ledger, audit
  logging, monitoring, backups, rollback SOP, and production release SOP remain
  future phases.

## Phase 1.2 Exit Decision

Phase 1.2 is complete. The customer product list and owner screenshot import
pages now use page-facing feature modules, and the behavior is protected by
focused tests plus the full verification suite.

Per the master PRD, the next Phase 1 task is Module 1.3: UI refactor contract
freeze.
