# 2026-05-11 Phase 5 Order Inventory Audit Log

## Repository Impact Map

Expected changes:

- `src/domain/order/types.ts`
- `src/domain/order/rules.ts`
- `src/domain/inventory/types.ts`
- `src/services/repositories/mall-repository-port.ts`
- `src/services/repositories/mock-db.ts`
- `src/services/repositories/memory-mall-repository.ts`
- `src/services/repositories/mall-repository-contract.ts`
- `src/features/mall-workflow/mall-workflow.ts`
- `src/features/mall-workflow/phase-5.test.ts`
- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`

Out of scope:

- OCR/AI remains Phase 6.
- UI redesign remains Phase 7.
- Release/monitoring SOP remains Phase 8.
- Existing Phase 4 auth and role rules remain unchanged except for order-entry compatibility.

Business contracts to preserve:

- Customer browsing still does not require login.
- Checkout remains the first customer auth gate.
- Authorization failure must not create orders or reserve stock.
- Confirmed or canceled orders remain merchant-only operations.
- Existing product, draft, and publication flows remain intact.

Planned verification:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/repositories/mall-repository-contract.test.ts src/features/mall-workflow/phase-5.test.ts
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
pnpm.cmd run verify
pnpm.cmd run verify:full
```

## Execution Plan

1. Add Phase 5 coverage for inventory ledger and order idempotency.
   - Acceptance: new tests fail before implementation and pass afterward.
2. Implement repository and workflow support.
   - Acceptance: order creation writes inventory ledger entries and repeated idempotent requests do not duplicate orders.
3. Sync cloudfunction order handling.
   - Acceptance: `mallApi` order create/confirm/cancel behavior matches the workflow contract.
4. Run verification and record residual gaps.
   - Acceptance: targeted tests, `verify`, and `verify:full` are recorded with honest manual-gate status.

## Current Status

- Started on 2026-05-11 and finished in this pass.
- Phase 5 inventory ledger support is now present across the domain types, repository port, in-memory repository, CloudBase repository, database repository, workflow, and cloudfunction gateway.
- Phase 5 order idempotency is now an explicit order field and is honored by the workflow, CloudBase repository, database repository, and `mallApi`.
- The database repository now persists order rows with `idempotency_key`, writes inventory ledger entries, and preserves the order/item relationship under the Phase 5 contract.
- New Phase 5 tests cover repository contract behavior, workflow reserve/release/idempotent order creation, CloudBase behavior, database behavior, and cloudfunction behavior.
- Full repo verification and full smoke verification both passed in this pass.

## Completed Implementation

### Inventory ledger

- Added `InventoryLedgerEntry` domain types.
- Added repository port methods for saving and listing inventory ledger entries.
- Extended the in-memory mock database to store inventory ledger rows.
- The workflow and `mallApi` now write reserve, confirm, and release ledger entries around order activity.
- The CloudBase and database repository implementations both persist and list inventory ledger rows consistently with the contract tests.

### Order idempotency

- Added optional `idempotencyKey` to orders.
- `mallWorkflow.createOrder` returns the existing order when the same idempotency key is reused.
- `mallApi.createCustomerOrder` accepts `idempotencyKey` and returns the existing order for repeated requests.
- The database repository persists `idempotency_key` and reads it back on order listing so repeated submission behavior remains stable across storage backends.

### Phase 5 tests

- Added repository contract coverage for inventory ledger storage and lookup.
- Added workflow coverage for reserve, release, and idempotent order creation.
- Added cloudfunction coverage for inventory ledger entries and idempotent order requests.

## Business Code Intentionally Not Changed

- Product catalog generation rules.
- Phase 4 auth and permission model.
- UI component structure and page behavior.
- OCR/AI recognition flow.
- Release and monitoring mechanics.

## Remaining Gaps

- Manual WeChat DevTools human acceptance is still outside Phase 5 and was not required for this phase gate.
- The inventory ledger is an audit trail for Phase 5, not a full accounting subsystem.
- Future phases may widen idempotency semantics if the PRD asks for stronger source-identity matching.

## Next Task

- No immediate implementation work remains for Phase 5; next phases can proceed from this verified baseline.

## Final Handoff

Phase 5 is complete and verified.

The order/inventory/audit loop now works end to end:

- order creation reserves stock and writes a reserve ledger entry
- repeated creates with the same `idempotencyKey` return the same order
- merchant confirmation and cancellation keep the stock and audit trail in sync
- the repository contract is aligned across memory, CloudBase, and database-backed implementations
- cloudfunction behavior matches the workflow contract

Verification evidence for the final baseline:

- `pnpm.cmd run verify` ✅
- `pnpm.cmd run verify:full` ✅
- targeted Phase 5 repository/workflow/cloudfunction tests ✅
- `pnpm.cmd run backend:test` and `pnpm.cmd run backend:build` via `verify:backend` ✅

Known residual scope:

- manual WeChat DevTools acceptance remains a separate human gate for later phases
- OCR/AI, product UI redesign, and release/monitoring work remain outside Phase 5
