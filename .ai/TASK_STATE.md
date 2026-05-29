# Favorites Task State

Current module: Module D

Current slice: D4

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
- Started Module C1 read-only landing point confirmation.
- Confirmed existing page-facing facade pattern under `src/features/cloudbase-mall/`.
- Confirmed existing pure ViewModel pattern under `src/features/customer-shopping-bag/`, `src/features/customer-product-list/`, and `src/features/customer-product-detail/`.
- Confirmed page-state lives under `src/pages/**` and must remain out of Module C unless explicitly opened.
- Wrote `.ai/FAVORITES_MODULE_C1_IMPACT.md`.
- Implemented Module C2 page-facing favorites ViewModel.
- Implemented Module C2 CloudBase favorites facade and command helpers.
- Added targeted tests for favorites empty, loading, failure, unavailable/deleted, and write-after-refresh command mapping.
- Kept Module D UI integration unstarted.
- Completed Module D1 read-only UI landing point confirmation.
- Loaded and confirmed future UI implementation must apply `ui-ux-pro-max`.
- Loaded and confirmed future UI implementation must apply `design-taste-frontend`.
- Confirmed reserved favorites entries currently exist as visual-only bottom-nav entries in:
  - `src/pages/index/index.vue`
  - `src/pages/customer/product-list/index.vue`
- Confirmed the favorites page does not yet exist under `src/pages/customer/favorites/`.
- Confirmed `src/pages.json` and `src/app/routes.ts` do not yet register a favorites page.
- Confirmed product-detail favorite toggle landing point is the existing visual-only `.favorite-button` in `src/pages/customer/product-detail/index.vue`.
- Confirmed product-list favorite toggle landing point is the existing visual-only `.favorite-button` in `src/pages/customer/product-list/index.vue`.
- Confirmed pages must call only Module C favorites facade/commands and must not write repositories, CloudBase collections, or hidden global state.
- Wrote `.ai/FAVORITES_MODULE_D1_IMPACT.md`.
- Started Module D2 favorites page UI integration.
- Loaded and applied `ui-ux-pro-max` for UI structure, page states, touch targets, and feedback rules.
- Loaded and applied `design-taste-frontend` as the minimal project frontend skill.
- Registered the customer favorites page route.
- Added the customer favorites page UI.
- Favorites page calls only Module C page-facing favorites facade/ViewModel/commands.
- Favorites page displays saved product cards, empty state, loading state, failure/retry state, image fallback, and unavailable/deleted/unpublished product state.
- Favorites page remove action uses `removeCloudBaseCustomerFavoriteProduct`.
- Added targeted favorites page UI integration tests.
- Fixed the D2 reviewer blocker so refresh/retry failures preserve previous favorite cards when available while still showing failure and retry UI.
- Added targeted coverage that refresh/retry failure keeps previous favorite cards visible.
- Started Module D3 product detail favorite toggle UI integration.
- Loaded and applied `ui-ux-pro-max` for detail-page favorite toggle states and interaction feedback.
- Loaded and applied `design-taste-frontend` as the minimal project frontend skill for this UI change.
- Product detail now derives product-level favorite state from the Module C customer favorites facade.
- Product detail favorite toggle now calls only Module C page-facing favorite/unfavorite commands.
- Product detail favorite toggle keeps previous product detail context on failure.
- Product detail favorite toggle checks PRD invalidation keys returned by Module C commands:
  - `customer-favorites:{customerId}:v1`
  - `customer-product-detail:{productId}:v1`
- Added targeted product detail tests for initial favorite state display, favorite success, unfavorite success, failure preservation, and no checkout/stock/shopping-bag coupling.
- Did not modify `.vue` pages, homepage navigation, bottom navigation, shopping bag, orders, checkout, stock, inventory ledger, payment, logistics, coupons, refunds, or recommendations.
- Started Module D4 product list favorite state / toggle UI integration.
- Loaded and applied `ui-ux-pro-max` for product-list card favorite state, touch target, busy, and failure feedback behavior.
- Loaded and applied `design-taste-frontend` as the minimal project frontend skill for this UI change.
- Product list now derives product-level favorite state from the Module C customer favorites facade.
- Product list favorite toggle now calls only Module C page-facing favorite/unfavorite commands.
- Product list favorite toggle keeps previous product list cards visible on failure.
- Product list favorite toggle checks PRD favorites invalidation key returned by Module C commands:
  - `customer-favorites:{customerId}:v1`
- Added targeted product list tests for initial favorite state display, favorite success, unfavorite success, failure preservation, unchanged product visibility/publish eligibility, and no checkout/stock/shopping-bag coupling.

## Incomplete

- Existing reserved favorites bottom-nav entries on homepage/product-list are not rewired in this slice.
- Product-detail favorite toggle is implemented and passed reviewer.
- Product-list favorite toggle/state is implemented and pending reviewer.
- Reserved favorites bottom-nav navigation is not implemented.
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

## Module C1 Read-Only Landing Point Confirmation

- Read the governing Favorites PRD.
- Read `.ai/TASK_STATE.md`.
- Read `.ai/FAVORITES_MODULE_B1_IMPACT.md`.
- Read `.ai/REVIEW.md`.
- Reviewed current git diff/status.
- Read related facade/ViewModel/page-state files:
  - `src/features/cloudbase-mall/customer-product-list.ts`
  - `src/features/cloudbase-mall/customer-product-detail.ts`
  - `src/features/cloudbase-mall/customer-shopping-bag.ts`
  - `src/features/customer-shopping-bag/customer-shopping-bag.ts`
  - `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
  - `src/services/cloudbase/mall-api-client.ts`
  - `src/features/customer-product-list/customer-product-list.ts`
  - `src/features/customer-product-detail/customer-product-detail.ts`
- Confirmed Module C minimal candidates:
  - `src/features/customer-favorites/customer-favorites.ts`
  - `src/features/customer-favorites/customer-favorites.test.ts`
  - `src/features/cloudbase-mall/customer-favorites.ts`
  - `src/features/cloudbase-mall/customer-favorites.test.ts`
- Confirmed Module C should keep UI/page wiring out of scope.
- Current diff still contains uncommitted Module B CloudBase client contract/test-helper files; isolate or commit them before C2 so Module C diff is clean.

## Module C1 Next Step Recommendation

- Do not enter Module D/E.
- Before C2, resolve the remaining Module B client diff:
  - `src/services/cloudbase/mall-api-client.ts`
  - `src/services/cloudbase/mall-api-client.test.ts`
  - related test helper files updated for the expanded client contract.
- Then C2 can implement only the favorites ViewModel and CloudBase facade with targeted tests.

## Can Enter Module C2

Yes, after isolating the remaining Module B client diff or explicitly accepting it as baseline.

Scope guard for C2:

- Pure ViewModel and CloudBase facade only.
- No UI pages.
- No homepage/navigation.
- No shopping bag behavior.
- No orders, checkout, stock, inventory ledger, payment, logistics, coupons, refunds, or recommendations.

## Module C2 Implementation

- Added `src/features/customer-favorites/customer-favorites.ts`.
  - Builds page-facing `CustomerFavoriteProductsView`.
  - Derives `priceText`, `isUnavailable`, empty message, loading state, failure state, and `lastUpdatedAt`.
  - Preserves previous view on refresh failure.
- Added `src/features/cloudbase-mall/customer-favorites.ts`.
  - Provides `getCloudBaseCustomerFavoriteProductsView`.
  - Provides `favoriteCloudBaseCustomerProduct`, `unfavoriteCloudBaseCustomerProduct`, and `removeCloudBaseCustomerFavoriteProduct`.
  - Provides `retryCloudBaseCustomerFavoriteProductsSnapshot`.
  - Propagates Module B `invalidatedSnapshotKeys` for write-after-refresh.
  - Does not require phone authorization.
  - Does not access repositories or CloudBase collections directly.
- Added targeted tests:
  - `src/features/customer-favorites/customer-favorites.test.ts`
  - `src/features/cloudbase-mall/customer-favorites.test.ts`

## Module C2 Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/features/customer-favorites/customer-favorites.test.ts src/features/cloudbase-mall/customer-favorites.test.ts` passed with 2 files / 5 tests.
- GREEN: `pnpm.cmd exec eslint src/features/customer-favorites/customer-favorites.ts src/features/customer-favorites/customer-favorites.test.ts src/features/cloudbase-mall/customer-favorites.ts src/features/cloudbase-mall/customer-favorites.test.ts` passed.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd run verify` passed.

## Module C2 Next Step Recommendation

- Stop for reviewer result.
- If reviewer passes, isolate and commit Module C2 facade/ViewModel files and related task-state docs.
- Do not enter Module D/E until explicitly requested.

## Module D1 Read-Only Landing Point Confirmation

- Read the governing Favorites PRD.
- Read `.ai/TASK_STATE.md`.
- Reviewed current git diff/status.
- Confirmed current tracked diff before D1 docs was `AGENTS.md` only and unrelated to Module D UI implementation.
- Read future UI workflow skills:
  - `C:/Users/65188/.codex/skills/ui-ux-pro-max/SKILL.md`
  - `C:/Users/65188/.codex/skills/design-taste-frontend/SKILL.md`
- Read related UI/facade files:
  - `src/app/routes.ts`
  - `src/pages.json`
  - `src/pages/index/index.vue`
  - `src/pages/customer/product-detail/index.vue`
  - `src/pages/customer/product-list/index.vue`
  - `src/features/cloudbase-mall/customer-favorites.ts`
  - `src/features/customer-favorites/customer-favorites.ts`
  - `src/pages/customer/product-detail/index.test.ts`
  - `src/pages/customer/product-list/index.test.ts`
- Confirmed Module D minimal candidates:
  - `src/pages/customer/favorites/index.vue`
  - `src/pages/customer/favorites/index.test.ts`
  - `src/app/routes.ts`
  - `src/pages.json`
  - `src/pages/customer/product-detail/index.vue`
  - `src/pages/customer/product-detail/index.test.ts`
  - `src/pages/customer/product-list/index.vue`
  - `src/pages/customer/product-list/index.test.ts`
- Confirmed D1 made no implementation edits to pages, navigation, product visibility, stock, checkout, shopping bag, orders, inventory ledger, payment, logistics, coupons, refunds, or recommendations.

## Module D1 Next Step Recommendation

- Stop after D1.
- Do not enter D2 without explicit user approval.
- Recommended D2 target: favorites page shell and route registration only.
- Keep product-detail and product-list favorite toggles for later focused D slices.

## Can Enter Module D2

Yes, after explicit user approval.

Scope guard for D2:

- UI implementation must load/apply `ui-ux-pro-max` and `design-taste-frontend`.
- Page must call Module C facade/commands only.
- No direct repository writes.
- No direct CloudBase collection writes.
- No hidden global favorite state.
- Product-level favorites only.
- No phone authorization precondition.
- No shopping bag, orders, checkout, stock, inventory ledger, payment, logistics, coupons, refunds, recommendations, product visibility, or Module E changes.

## Module D2 Implementation

- Changed:
  - `src/app/routes.ts`
  - `src/pages.json`
  - `src/pages/customer/favorites/index.vue`
  - `src/pages/customer/favorites/index.test.ts`
  - `.ai/TASK_STATE.md`
- Kept out of scope:
  - product-detail favorite toggle
  - product-list favorite toggle/state
  - homepage navigation structure
  - bottom navigation redesign
  - shopping bag
  - orders
  - checkout
  - stock
  - inventory ledger
  - payment
  - logistics
  - coupons
  - refunds
  - recommendations
  - product visibility / publish eligibility

## Module D2 Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/favorites/index.test.ts` passed with 1 file / 4 tests.
- GREEN: `pnpm.cmd exec eslint src/app/routes.ts src/pages/customer/favorites/index.vue src/pages/customer/favorites/index.test.ts` passed.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd run verify` passed.

## Module D2 Reviewer Blocker Fix

- Source: reviewer reported `src/pages/customer/favorites/index.vue` refreshed/retried failure state replaced an existing favorites list with an empty failure view.
- Changed only:
  - `src/pages/customer/favorites/index.vue`
  - `src/pages/customer/favorites/index.test.ts`
  - `.ai/TASK_STATE.md`
- Added page-local `keepPreviousCardsOnFailure` so failed refresh/retry keeps the previous favorite cards when available and updates only `loadingState` / `failureMessage`.
- Preserved first-load failure behavior when no previous cards exist.
- Did not modify `src/app/routes.ts`, `src/pages.json`, product detail toggle, product list toggle, homepage navigation, bottom navigation, shopping bag, orders, checkout, stock, inventory ledger, payment, logistics, coupons, refunds, recommendations, or product visibility.

## Module D2 Blocker Fix Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/favorites/index.test.ts` passed with 1 file / 5 tests.
- GREEN: `pnpm.cmd exec eslint src/pages/customer/favorites/index.vue src/pages/customer/favorites/index.test.ts` passed.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd run verify` passed.

## Module D3 Implementation

- Changed:
  - `src/pages/customer/product-detail/index.vue`
  - `src/pages/customer/product-detail/index.test.ts`
  - `.ai/TASK_STATE.md`
- Kept out of scope:
  - favorites page
  - product-list favorite toggle/state
  - homepage navigation
  - bottom navigation
  - shopping bag
  - orders
  - checkout
  - stock
  - inventory ledger
  - payment
  - logistics
  - coupons
  - refunds
  - recommendations
  - product visibility / publish eligibility

## Module D3 Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-detail/index.test.ts` passed with 1 file / 10 tests.
- GREEN: `pnpm.cmd exec eslint src/pages/customer/product-detail/index.vue src/pages/customer/product-detail/index.test.ts` passed.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd run verify` passed.

## Module D4 Implementation

- Changed:
  - `src/pages/customer/product-list/index.vue`
  - `src/pages/customer/product-list/index.test.ts`
  - `.ai/TASK_STATE.md`
- Kept out of scope:
  - favorites page
  - product-detail favorite toggle behavior
  - homepage navigation
  - bottom navigation redesign
  - shopping bag
  - orders
  - checkout
  - stock
  - inventory ledger
  - payment
  - logistics
  - coupons
  - refunds
  - recommendations
  - product visibility / publish eligibility

## Module D4 Verification

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-list/index.test.ts` passed with 1 file / 6 tests.
- GREEN: `pnpm.cmd exec eslint src/pages/customer/product-list/index.vue src/pages/customer/product-list/index.test.ts` passed.
- GREEN: `pnpm.cmd run type-check` passed.
- GREEN: `pnpm.cmd run verify` passed.
