# 2026-05-08 Harness Hardening Delivery Log

## Scope

This delivery moved the accepted MVP from a runnable demo toward a protected,
repeatable engineering baseline. It did not add product features, change UI
flows, change data fields, or replace the mock backend.

## Completed Harness Changes

- Added repository working rules in `AGENTS.md`.
- Added durable product, architecture, contract, testing, and quality docs under
  `docs/`.
- Added CI in `.github/workflows/ci.yml`.
- Added ESLint flat config in `eslint.config.mjs`.
- Added module-boundary enforcement in `scripts/check-boundaries.mjs`.
- Added build-artifact smoke verification in `scripts/e2e-smoke.mjs`.
- Added `package.json` scripts for lint, boundary check, tests, coverage,
  type-check, audits, verification, full verification, and mini-program build.
- Added Vitest coverage thresholds through `@vitest/coverage-v8`.
- Added repository contract tests for the in-memory mall repository.
- Added `src/features/mall-workflow/mall-access.ts` as the page-facing access
  facade.
- Updated pages so repository-backed mall reads and writes go through the
  feature layer instead of direct page imports of `mallRepository`.
- Expanded domain and workflow tests around invalid paths, state transitions,
  stock rules, duplicate confirmation, image supplementation, authorization, and
  draft review grouping.

## Current Command Baseline

Routine verification:

```powershell
pnpm.cmd run verify
```

Full build-affecting verification:

```powershell
pnpm.cmd run verify:full
```

Useful narrow checks:

```powershell
pnpm.cmd run lint
pnpm.cmd run boundary-check
pnpm.cmd test
pnpm.cmd run coverage
pnpm.cmd run type-check
pnpm.cmd run build:mp-weixin
pnpm.cmd run e2e:smoke
pnpm.cmd run audit:prod
pnpm.cmd run audit:all
```

## Protected Boundaries

- `src/domain` owns pure rules, entity language, statuses, and invariants.
- `src/features` owns business orchestration and page-safe use-case facades.
- `src/services` owns mock adapters, IO ports, and repository implementations.
- `src/pages` owns mini-program interaction and page-local state.
- Pages must not import `mockDb` or `mallRepository` directly.
- Approved fixtures and existing tests must not be weakened to make changes pass.

## What Was Intentionally Not Changed

- No new product capability was added.
- No UI layout or copy change was introduced.
- No API contract or data model migration was performed.
- No real OCR, real storage, real auth, or production database integration was
  added.
- The existing in-memory mock persistence remains the MVP storage layer.

## Remaining Harness Gaps

- Real click-through E2E still needs mini-program automation or a browser-backed
  page testing setup.
- Remote branch protection and required CI checks must be configured in the Git
  host after pushing.
- `mallWorkflow` still directly wires mock services and repository adapters; a
  future small refactor can introduce explicit ports without changing behavior.
- Page ViewModel behavior is still mostly covered indirectly through features,
  not through page-level tests.
- App helper, route helper, and mock upload edge cases can use deeper tests.

## Suggested Next Task

Add a narrow page-facing ViewModel or page interaction test layer for the owner
draft review and customer product detail paths, without changing business
behavior.
