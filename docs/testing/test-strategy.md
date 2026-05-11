# Test Strategy

## Test Priority

1. Domain invariants: pure rules that protect product creation, publishing,
   ordering, stock, and statuses.
2. Workflow integration: use-cases that coordinate domain rules and mock
   services.
3. Service contracts: repository, auth, OCR, and upload behavior.
4. Page behavior: view-model logic, filters, input parsing, and user feedback.
5. E2E smoke: critical mini-program paths once browser/miniprogram automation is
   available.

## Current Test Coverage

Current tests live beside source files under `src/**/*.test.ts` and are run by:

```powershell
pnpm.cmd test
```

Backend Phase 2 tests live under `backend/src/**/*.test.ts` and are run by:

```powershell
pnpm.cmd run backend:test
```

Existing coverage includes:

- Draft validation and completion marking.
- Catalog product/SKU creation and publish eligibility.
- Order creation and status transitions.
- Mock OCR provider output shape.
- Mock WeChat auth session behavior.
- Repository contract behavior for drafts, products, SKUs, stock, orders, and
  reset isolation.
- Shared repository contract tests that run against the in-memory repository and
  the backend database repository.
- Main mall workflow including duplicate confirmation, publish, order, stock
  reservation, oversell prevention, cancellation, and authorized ordering.
- Customer order authorization orchestration.
- Draft review grouping, completion summary, price conflict detection, and empty
  input behavior.
- Page-facing `mall-access` facade behavior.
- Customer product list ViewModel behavior for published-only product listing
  and minimum SKU price display.
- Customer product detail ViewModel behavior for missing/unpublished products,
  out-of-stock SKUs, authorization cancellation, authorization success, and
  stock reservation.
- Owner screenshot import facade behavior for uploaded-image descriptor
  creation, immutable removal, OCR import summary, and needs-completion counts.
- Owner draft review ViewModel behavior for empty batches, grouping,
  needs-completion flags, low-confidence flags, price-conflict warnings,
  deletion, confirmation, and duplicate confirmation.
- Owner product, owner order, and staff image-task facades for status labels,
  button availability, filtering, publish commands, order commands, stock
  restoration, and image supplementation.
- Frozen page-facing UI contracts are documented in
  `docs/contracts/page-facing-ui-contracts.md`; every listed ViewModel or
  facade has a focused feature test file named in that contract document.
- Phase 2.1 backend baseline tests cover response envelopes, environment
  validation, `GET /health`, and safe 404 responses.
- Phase 2.2 backend migration tests cover empty-database schema creation,
  repeated migration execution, schema migration history, status constraints,
  required foreign keys, numeric constraints, and safe missing database
  configuration output.
- Phase 2.3 backend repository tests cover database repository contract
  behavior, transaction rollback for product/SKU persistence, and the main MVP
  loop against a migrated in-memory PostgreSQL-compatible test database.
- Phase 2.4 API tests cover response envelopes, request validation, stable error
  codes, idempotent batch confirmation, product/SKU/image-task endpoints,
  unauthorized customer order rejection, merchant order transitions, and stock
  restoration.
- Backend runtime wiring tests cover health-check-only startup without
  `DATABASE_URL` and database-backed API startup when `DATABASE_URL` is
  configured.
- Phase 2.5 restore rehearsal tests cover local PostgreSQL-compatible backup
  restore rehearsal and the core Phase 2 validation checklist.
- CloudBase service adapter tests cover safe `wx.cloud.callFunction` envelope
  parsing and the `mallApi` action/params/payload mapping kept behind
  `src/services/cloudbase`.
- CloudBase page-facing facade tests cover the mini-program runtime cutover
  boundary: owner import/review/products/orders, staff image tasks, customer
  product list/detail, and customer order creation call `mallApi` through
  service adapters instead of local repository writes.
- Phase 3 storage tests cover runtime upload service selection, mock upload
  contract behavior, CloudBase upload/delete/temp-URL mapping, asset
  replacement, URL refresh, file-size validation, file-format validation, and
  upload failure-code mapping.
- `scripts/smoke-cloudbase-api.mjs` covers the local `mallApi` memory-store
  path for health, contract listing, validation failure, OCR batch creation,
  latest-draft readback, and batch confirmation.
- Deployed CloudBase `mallApi` smoke is currently run through CloudBase CLI
  for `createOcrBatch`, `getLatestDrafts`, `confirmBatch`, and `listProducts`
  against environment `cloud1-d7gifjyzl7721b383`.
- Lint, module-boundary, coverage, audit, and build-artifact smoke commands.

## Current Test Gaps

- No centralized state-machine implementation beyond current domain helpers and
  transition tests.
- No real mini-program click-through E2E test.
- No automated real mini-program click-through E2E test yet for the CloudBase
  integration path. The generated artifact uses real AppID
  `wxa63c53796488d4d4`, and the current owner screenshot import gate passed
  manual WeChat DevTools acceptance after the CloudBase environment/function/
  collection fixes.
- No automated real CloudBase image upload/download E2E test yet. Phase 3
  automated checks cover service contracts and build artifacts. The 2026-05-11
  WeChat Developer Tools acceptance confirmed owner screenshot upload to
  CloudBase storage with `urlCheck: true`; staff/product image upload should be
  re-accepted when a valid product creation path exists again.
- No real OCR/AI recognition test yet. The current owner import path no longer
  writes fabricated mock product fields, but real OCR remains a Phase 6 gap.
- App helper, mock upload, and route helper edge cases have limited coverage.
- No fixture approval process beyond convention.

## Core Closed Loop Test Requirements

The following path must remain covered before changing business behavior:

```text
Mock OCR batch
-> draft validation
-> owner confirmation
-> product/SKU creation
-> image supplementation
-> product publish
-> customer authorized order
-> stock reservation
-> merchant confirm/cancel
```

Required assertions:

- Incomplete drafts block product creation.
- Duplicate batch confirmation does not duplicate products or SKUs.
- Repeated SKU rows merge stock.
- Product cannot publish before image/SKU requirements are met.
- Order cannot be created for unpublished products.
- Order cannot oversell stock.
- Authorized order writes customer phone and auth fields.
- Authorization cancellation creates no order and reserves no stock.
- Canceling a pending order restores stock.
- Confirmed orders cannot be canceled.

## Bugfix Flow Requirements

For every bugfix:

1. Reproduce the bug with a failing test or a documented manual reproduction.
2. Make the smallest implementation change that fixes the bug.
3. Keep existing assertions as strong as before.
4. Add a regression test at the lowest layer that catches the bug.
5. Run the relevant checks before completion.

## Approved Fixtures Rules

Approved fixtures are test inputs or mock rows that encode accepted behavior.
Examples include:

- Mock OCR sample rows.
- Mock WeChat customer identity and phone authorization values.
- Published product/order setup helpers in workflow tests.
- Expected domain statuses and error paths.

Rules:

- Do not modify approved fixtures to make a failing test pass.
- Do not weaken expected fields to broad snapshots when exact values matter.
- When product requirements change, update fixtures only after naming the new
  expected behavior.
- Prefer adding a new fixture for a new scenario over mutating an old one.

## Assertion Strength

- Do not remove assertions unless the behavior is explicitly removed.
- Do not replace specific assertions with vague truthiness checks.
- Do not skip tests to pass CI.
- Do not delete tests during refactors.
- When changing state rules, assert both the allowed path and the forbidden
  path.

## Required Local Checks

Routine task:

```powershell
pnpm.cmd run verify
```

Backend-specific verification:

```powershell
pnpm.cmd run verify:backend
```

API-specific verification:

```powershell
pnpm.cmd run verify:api
```

Build-affecting task:

```powershell
pnpm.cmd run verify:full
```

Individual commands are also available when a narrower check is justified:

```powershell
pnpm.cmd run lint
pnpm.cmd run boundary-check
pnpm.cmd test
pnpm.cmd run coverage
pnpm.cmd run type-check
pnpm.cmd run backend:test
pnpm.cmd run backend:build
pnpm.cmd run verify:api
pnpm.cmd run verify:backend
pnpm.cmd run backend:restore:rehearsal
pnpm.cmd run cloudbase:api:smoke
pnpm.cmd run cloudbase:health:smoke
pnpm.cmd run build:mp-weixin
pnpm.cmd run e2e:smoke
pnpm.cmd run audit:prod
pnpm.cmd run audit:all
```

Missing or failing commands must be reported honestly. Do not invent a passing
result.
