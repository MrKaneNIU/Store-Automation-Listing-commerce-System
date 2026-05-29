# Favorites Task State

Current module: Module B

Current slice: B3

## Completed

- Confirmed Module A was already completed from `.ai/FINAL_REPORT.md`.
- Read the governing Favorites PRD.
- Read existing Module A plan/report artifacts where present.
- Confirmed `.ai/TASK_STATE.md` and `.ai/FAVORITES_MODULE_A.md` were missing at the start of this slice.
- Reviewed current git diff.
- Read 15 or fewer related files for B1.
- Identified the customer identity path for server-persisted customer data.
- Identified existing CloudBase action organization.
- Identified product summary/list-card data source.
- Identified the current cache invalidation convention.
- Identified customer-scoped storage pattern.
- Listed candidate files for B2.
- Listed out-of-scope modules that must not be modified.
- Wrote `.ai/FAVORITES_MODULE_B1_IMPACT.md`.
- Implemented B2 CloudFunction favorites storage/actions.
- Added customer-private `customer_favorites` storage in `cloudfunctions/mallApi/mall-api-core.js`.
- Added product-level favorites snapshot, favorite, unfavorite, and remove actions.
- Added CloudBase client snapshot/result types and action mappings.
- Added targeted CloudFunction and client adapter tests for favorites.
- Kept Module C facade/ViewModel and Module D UI work unstarted.
- Completed B3 CloudFunction behavior hardening.
- Added tests that favorites actions are advertised by `listContracts`.
- Added tests that SKU-level favorite payloads are rejected.
- Added tests that public product summaries do not leak favorite state.
- Added tests that `unfavoriteCustomerProduct` invalidates both favorites and product-detail snapshots.
- Tightened favorite payload parsing so only `productId` is accepted.
- Completed Module B reviewer blocker cleanup.
- Rolled back out-of-scope tracked page diffs from `src/pages/customer/shopping-bag/index.vue`.
- Rolled back out-of-scope tracked page diffs from `src/pages/index/index.vue`.
- Confirmed `AGENTS.md` diff is project workflow/configuration text, not Module B favorites implementation.
- Confirmed `docs/contracts/page-facing-ui-contracts.md` diff is prior Module A contract documentation, not Module B storage/action implementation.
- Fixed the Module B favorite idempotency blocker reported by reviewer.
- Changed favorite creation to use a deterministic customer/product-level favorite document id.
- Changed favorite persistence to use store upsert instead of random-id insert.
- Added CloudBase document-store upsert support for deterministic favorite document writes.
- Added targeted coverage for concurrent duplicate favorite calls producing one `customer_favorites` record.

## Incomplete

- Module B broad/full verification is not run.
- Module C facade/ViewModel is not started.
- Module D UI integration is not started.
- Module E verification/manual acceptance is not started.

## Files Read

1. `docs/prd/2026-05-27-favorites-module-prd.md`
2. `.ai/TASK_STATE.md` - missing at start
3. `.ai/PLAN.md`
4. `.ai/FAVORITES_MODULE_A.md` - missing at start
5. `.ai/FINAL_REPORT.md`
6. `cloudfunctions/mallApi/mall-api-core.js`
7. `cloudfunctions/mallApi/mall-api-core.test.js`
8. `src/services/cloudbase/mall-api-client.ts`
9. `src/services/cloudbase/mall-api-client.test.ts`
10. `src/features/cloudbase-mall/customer-product-list.ts`
11. `src/features/cloudbase-mall/customer-product-detail.ts`
12. `src/services/repositories/mall-repository-port.ts`
13. `src/services/repositories/mall-repository.ts`
14. `src/services/repositories/memory-mall-repository.ts`
15. `src/services/auth/customer-session.ts`

## Next Step Recommendation

Proceed to Module C only after reviewing the Module B diff. Recommended Module C target:

- Add a focused `src/features/customer-favorites/customer-favorites.ts` ViewModel.
- Add a `src/features/cloudbase-mall/customer-favorites.ts` facade.
- Keep UI/page wiring out of scope until Module D.

Keep Module C limited to facade/ViewModel and targeted tests. Do not implement UI/page-state.

## Can Enter Module C

Yes, with scope guard:

- Product-level favorites only.
- Server-derived customer identity required.
- No phone authorization precondition.
- No shopping bag, order, inventory, checkout, payment, logistics, coupon, refund, recommendation, or UI changes.

## B2 Verification

- RED: `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts` failed because `client.getCustomerFavoriteProductsSnapshot` was missing.
- RED: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js` failed because favorites actions returned unsupported-action errors.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts cloudfunctions/mallApi/mall-api-core.test.js` passed with 2 files / 68 tests.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/cloudbase-mall/customer-shopping-bag.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts` passed with 3 files / 31 tests after updating mock client helpers.
- GREEN: targeted `eslint` on changed TypeScript files passed.
- GREEN: `git diff --check` on B2 files passed.

## B3 Verification

- RED: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js` failed because `favoriteCustomerProduct` accepted a payload containing `skuId`.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js` passed with 1 file / 55 tests.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts` passed with 1 file / 17 tests.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `git diff --check` on B3 files passed.
- Note: Vitest reported `WebSocket server error: Port 24678 is already in use` during one successful test run, but the targeted test command still exited 0.

## Module B Reviewer Blocker Cleanup

- Source: reviewer reported `STATUS: NEEDS_FIX` for out-of-scope tracked diffs and missing broad verification.
- Rolled back tracked UI/page diffs:
  - `src/pages/customer/shopping-bag/index.vue`
  - `src/pages/index/index.vue`
- Removed untracked out-of-scope UI test files that were introduced outside Module B and caused full verification to assert reverted UI behavior:
  - `src/pages/customer/shopping-bag/index.test.ts`
  - `src/pages/index/index.test.ts`
- These files are no longer present in `git diff --name-only` after cleanup.
- Left `AGENTS.md` unchanged and marked it as pre-existing/project configuration diff, not Module B favorites storage/actions.
- Left `docs/contracts/page-facing-ui-contracts.md` unchanged and marked it as prior Module A contract diff, not Module B favorites storage/actions.
- Preserved Module B legal changes:
  - `cloudfunctions/mallApi/mall-api-core.js`
  - `cloudfunctions/mallApi/mall-api-core.test.js`
  - `src/services/cloudbase/mall-api-client.ts`
  - `src/services/cloudbase/mall-api-client.test.ts`
  - related test helper shape updates needed for the expanded client contract.

## Module B Cleanup Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts cloudfunctions/mallApi/mall-api-core.test.js src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/cloudbase-mall/customer-shopping-bag.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts` passed with 5 files / 103 tests.
- RED then cleaned: `pnpm.cmd run verify` initially failed because untracked out-of-scope UI tests `src/pages/index/index.test.ts` and `src/pages/customer/shopping-bag/index.test.ts` asserted the reverted homepage/shopping-bag UI changes.
- GREEN: rerun `pnpm.cmd run verify` passed after removing the untracked out-of-scope UI tests.

## Module B Idempotency Blocker Fix

- Source: reviewer reported `cloudfunctions/mallApi/mall-api-core.js` used "find first then insert random favorite id", which could duplicate `customer_favorites` under concurrent favorite calls.
- Changed:
  - `cloudfunctions/mallApi/mall-api-core.js`
  - `cloudfunctions/mallApi/index.js`
  - `cloudfunctions/mallApi/mall-api-core.test.js`
- Scope kept to Module B storage/actions and targeted tests. No UI, homepage, shopping bag behavior, orders, checkout, stock, inventory ledger, payment, logistics, coupons, refunds, recommendations, or Module C/D/E files were changed.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js` passed with 1 file / 56 tests.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts cloudfunctions/mallApi/mall-api-core.test.js src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/cloudbase-mall/customer-shopping-bag.test.ts src/services/auth/cloudbase-wechat-auth-service.test.ts` passed with 5 files / 104 tests.
- GREEN: `pnpm.cmd run verify` passed.
