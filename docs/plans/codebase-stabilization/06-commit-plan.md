# Commit Split Plan

Captured: 2026-06-02
Role: Reporter
PRD phase: 6
Scope: split the current large working-tree diff into reviewable, reversible commits

## Result

Status: SPLIT_REQUIRED_BEFORE_FINAL_MERGE

This is a commit plan only. No files were staged or committed in this phase.

The working tree contains tracked modifications plus many untracked audit/planning/script/source files. The plan below preserves reviewability by grouping commits by contract and rollback boundary, not by current chronological edit order.

## Cross-Cutting SPLIT_NEEDED Files

These files belong to multiple commit themes and should be staged with `git add -p` or manually split before committing:

| File | Themes | Manual split guidance |
|---|---|---|
| `cloudfunctions/mallApi/mall-api-core.js` | CloudBase schema/runtime, customer private modules, checkout/order guard, owner product edit, image/OCR, role/order permissions | Split hunks by action/helper: schema/health helpers, customer snapshot actions, checkout/order actions, owner product actions, OCR/image actions. Keep the local checkout guard with checkout commit. |
| `cloudfunctions/mallApi/mall-api-core.test.js` | Same as `mall-api-core.js` plus stabilization contract tests | Stage test blocks with their matching backend action theme. Keep new mock rejection, anonymous browse, oversell, and release-ledger tests with checkout/order commit. |
| `src/services/cloudbase/mall-api-client.ts` | Customer private modules, checkout/order, owner products, image flows | Stage client methods with the corresponding feature commit. |
| `src/services/cloudbase/mall-api-client.test.ts` | Multiple client contract themes | Split by `describe`/test block matching client methods. |
| `src/features/cloudbase-mall/cloudbase-mall.test.ts` | Image, checkout, owner products, customer browse | Stage test blocks by feature theme; do not commit the entire file in one topic unless making a checkpoint commit. |
| `package.json` | Runtime audit scripts, staging scripts, Vitest upgrade | Split script additions from dependency version changes if possible. If not practical, commit scripts and lockfile in the dependency/infrastructure commit with clear message. |
| `pnpm-lock.yaml` | Dependency upgrade and script dependency graph | Commit with `package.json` dependency upgrade. |
| `docs/contracts/page-facing-ui-contracts.md` | Shopping bag/favorites/Mine/customer private contracts | Commit with customer private module stabilization docs or docs acceptance commit, depending on hunk content. |
| `.ai/TASK_STATE.md` | AI workflow state | Do not include in implementation commits unless the user requests AI workflow state checkpoint. |

## Commit 1: Test / Runtime Audit Infrastructure

- Commit message: `test: add runtime audit and staging verification tools`
- File list:
  - `scripts/mp-runtime-audit.mjs`
  - `scripts/mp-runtime-audit.test.mjs`
  - `scripts/verify-staging.mjs`
  - package script hunks for `mp:runtime-audit`, `mp:runtime-audit:test`, `verify:staging`
  - related runtime audit docs/testing logs
- Why independent: These tools verify the mini-program runtime/build and staging contract without changing business behavior.
- Rollback impact: Removes extra audit commands only; production behavior should remain unchanged.
- Required tests:
  - `pnpm.cmd run mp:runtime-audit:test`
  - `pnpm.cmd run smoke:mp-weixin`
  - `pnpm.cmd run verify`
- Manual acceptance needed: No, but tool output supports manual acceptance readiness.

## Commit 2: CloudBase Schema and Staging Verification

- Commit message: `chore: add cloudbase schema and staging smoke checks`
- File list:
  - `config/cloudbase/schema.required.json`
  - `scripts/cloudbase-schema-utils.mjs`
  - `scripts/cloudbase-schema-check.mjs`
  - `scripts/cloudbase-schema-apply-staging.mjs`
  - `scripts/smoke-cloudbase-health.mjs`
  - `backend/src/cloudbase/cloudbase-data-model.ts`
  - `backend/src/cloudbase/cloudbase-data-model.test.ts`
  - `backend/src/cloudbase/cloudbase-health.test.ts`
  - `cloudfunctions/mallHealth/index.js`
  - package script hunks for `cloudbase:schema:*`
- Why independent: Establishes required CloudBase data model and staging health verification.
- Rollback impact: Removes schema/staging verification support; may reduce confidence but should not alter UI.
- Required tests:
  - `pnpm.cmd run cloudbase:schema:check`
  - `pnpm.cmd run verify:api`
  - `pnpm.cmd run verify:staging`
- Manual acceptance needed: No direct UI acceptance, but staging status gates manual acceptance.

## Commit 3: Customer Private Module Runtime Stabilization

- Commit message: `feat: stabilize customer private cloudbase snapshots`
- File list:
  - `src/features/cloudbase-mall/customer-shopping-bag.test.ts`
  - `src/features/cloudbase-mall/customer-favorites.test.ts`
  - `src/features/cloudbase-mall/customer-mine.ts`
  - `src/features/cloudbase-mall/customer-mine.test.ts`
  - `src/features/customer-shopping-bag/customer-shopping-bag.ts`
  - `src/features/customer-shopping-bag/customer-shopping-bag.test.ts`
  - `src/features/customer-favorites/customer-favorites.ts`
  - `src/features/customer-favorites/customer-favorites.test.ts`
  - `src/features/customer-mine/customer-mine.ts`
  - `src/features/customer-mine/customer-mine.test.ts`
  - `src/features/customer-mine/customer-mine-page-state.ts`
  - `src/features/customer-mine/customer-mine-page-state.test.ts`
  - `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
  - `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts`
  - `src/pages/customer/favorites/useCustomerFavoritesPageState.ts`
  - `src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts`
  - `src/pages/customer/mine/useCustomerMinePageState.ts`
  - `src/pages/customer/mine/useCustomerMinePageState.test.ts`
  - `src/pages/customer/shopping-bag/index.vue`
  - `src/pages/customer/favorites/index.vue`
  - `src/pages/customer/mine/index.vue`
  - customer snapshot hunks in `cloudfunctions/mallApi/mall-api-core.js` and `.test.js`
  - matching client hunks in `src/services/cloudbase/mall-api-client.ts` and `.test.ts`
  - `docs/contracts/page-facing-ui-contracts.md` customer private sections
- Why independent: Customer shopping bag, favorites, and Mine snapshots share private customer identity/runtime stabilization.
- Rollback impact: Reverts customer-private module stabilization and may reintroduce runtime red errors or stale private data behavior.
- Required tests:
  - Customer private feature/page-state tests
  - `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`
  - `pnpm.cmd run verify`
- Manual acceptance needed: Yes, shopping bag/favorites/Mine customer pages.

## Commit 4: Image Reference and Display Pipeline

- Commit message: `fix: persist and audit durable product image references`
- File list:
  - `src/services/storage/product-image-url.ts`
  - `src/services/storage/product-image-url.test.ts`
  - `src/services/storage/product-image-audit.ts`
  - `src/services/storage/product-image-audit.test.ts`
  - `src/services/storage/cloudbase-upload-service.test.ts`
  - `scripts/cloudbase-images-audit.mjs`
  - `scripts/cloudbase-images-repair-staging.mjs`
  - image hunks in `src/features/cloudbase-mall/owner-products.ts`
  - image hunks in `src/features/cloudbase-mall/customer-product-detail.ts`
  - image/OCR hunks in `cloudfunctions/mallApi/mall-api-core.js` and `.test.js`
  - image-related docs/testing logs
- Why independent: Durable image references and temp URL cleanup are a cohesive data/display pipeline.
- Rollback impact: Product images may return to temp URL expiry or stale display risk.
- Required tests:
  - `pnpm.cmd run cloudbase:images:audit`
  - image storage tests
  - `pnpm.cmd run verify`
- Manual acceptance needed: Yes, product list/detail/owner product image display.

## Commit 5: Checkout Phone Auth and Order Creation

- Commit message: `fix: require verified wechat identity for checkout orders`
- File list:
  - `src/features/cloudbase-mall/customer-product-detail.ts`
  - checkout/order tests in `src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - `src/pages/customer/product-detail/index.vue`
  - `src/pages/customer/product-detail/index.test.ts`
  - `src/services/auth/cloudbase-wechat-auth-service.test.ts`
  - `cloudfunctions/mallApi/index.js`
  - checkout/order hunks in `cloudfunctions/mallApi/mall-api-core.js`
  - checkout/order tests in `cloudfunctions/mallApi/mall-api-core.test.js`
  - order flow docs/testing logs
- Why independent: This commit owns phone authorization, verified backend customer identity, order creation, stock reservation, oversell protection, and cancel-release ledger.
- Rollback impact: Reopens checkout trusted-boundary and order-flow risk; rollback only if real checkout is blocked and a safer patch is not possible.
- Required tests:
  - `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`
  - `pnpm.cmd exec vitest run src/features/cloudbase-mall/cloudbase-mall.test.ts`
  - `pnpm.cmd exec vitest run src/pages/customer/product-detail/index.test.ts`
  - `pnpm.cmd run verify`
  - `pnpm.cmd run verify:staging`
- Manual acceptance needed: Yes, checkout prompt/cancel/bound-phone/order/merchant cancel.

## Commit 6: Owner Product Management Edit Flow

- Commit message: `feat: harden owner product edit and inventory actions`
- File list:
  - `src/features/cloudbase-mall/owner-products.ts`
  - `src/features/owner-products/owner-products.ts`
  - `src/pages/owner/products/index.vue`
  - `src/pages/owner/products/index.test.ts`
  - `src/pages/owner/products/useOwnerProductsPageState.ts`
  - `src/pages/owner/products/useOwnerProductsPageState.test.ts`
  - owner product hunks in `src/services/cloudbase/mall-api-client.ts` and `.test.ts`
  - owner product hunks in `cloudfunctions/mallApi/mall-api-core.js` and `.test.js`
  - product edit docs/testing logs
- Why independent: Product basics, description, SKU inventory, publish/unpublish/delete are one owner product-management surface.
- Rollback impact: Reverts product edit hardening and may restore old productCode/SPU/SKU edit gaps.
- Required tests:
  - owner product feature/page-state tests
  - `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`
  - `pnpm.cmd run verify`
- Manual acceptance needed: Yes, owner product edit and publish lifecycle.

## Commit 7: Admin Account Management Hardening

- Commit message: `fix: harden admin account management access`
- File list:
  - `src/features/admin-workbench-auth/admin-workbench-auth.ts`
  - `src/features/admin-workbench-auth/admin-workbench-auth.test.ts`
  - `src/features/admin-workbench-auth/admin-workbench-guard.test.ts`
  - `src/pages/owner/account-management/index.vue`
  - `src/pages/owner/account-management/index.test.ts`
  - `src/pages/owner/permissions/index.vue`
  - `src/pages/owner/permissions/index.test.ts`
  - `src/pages/owner/more/index.vue`
  - `src/pages/owner/more/index.test.ts`
- Why independent: Account/session/permission UI and guards can be reviewed separately from customer/order/image changes.
- Rollback impact: May reintroduce old account-management access or password setup gaps.
- Required tests:
  - admin auth and account-management tests
  - `pnpm.cmd run verify`
- Manual acceptance needed: Yes if admin account flows are part of current manual checklist.

## Commit 8: Docs and Manual Acceptance Reports

- Commit message: `docs: record stabilization audits and manual acceptance gates`
- File list:
  - `docs/audits/codebase-stabilization/00-stabilization-baseline.md`
  - `docs/audits/codebase-stabilization/01-diff-anatomy.md`
  - `docs/audits/codebase-stabilization/02-boundary-review.md`
  - `docs/audits/codebase-stabilization/03-business-contract-review.md`
  - `docs/audits/codebase-stabilization/04-complexity-duplication-review.md`
  - `docs/audits/codebase-stabilization/07-release-readiness-guard.md`
  - `docs/audits/codebase-stabilization/08-final-code-health-report.md`
  - `docs/plans/codebase-stabilization/05-safe-refactor-plan.md`
  - `docs/plans/codebase-stabilization/06-commit-plan.md`
  - customer runtime / real-device acceptance audit and plan docs
  - manual acceptance checklist docs under `docs/testing/**`
  - new PRD docs if user wants them retained
- Why independent: Documents audit state and acceptance gates without changing runtime code.
- Rollback impact: Removes evidence/history, not product behavior.
- Required tests: Documentation review; no code tests.
- Manual acceptance needed: The docs describe manual acceptance but do not themselves require acceptance.

## Commit 9: Dependency Upgrade Vitest 4.1.8

- Commit message: `chore: upgrade vitest to 4.1.8`
- File list:
  - dependency hunks in `package.json`
  - `pnpm-lock.yaml`
  - `tsconfig.json` if the Node/Vitest type change is required by the upgrade
- Why independent: Dependency upgrade should be reviewable separately from business behavior and script additions.
- Rollback impact: Reverts test runner version; may require reverting test syntax/coverage changes if any were introduced for Vitest 4.
- Required tests:
  - `pnpm.cmd run test`
  - `pnpm.cmd run verify`
  - coverage gates
- Manual acceptance needed: No.

## Exclude From Commits Unless Explicitly Requested

- `.ai/TASK_STATE.md`
- `_ai_review_context.zip`
- `_ai_review_context/**`

These are workflow/export artifacts and should not be mixed with implementation or stabilization docs.

## Suggested Commit Order

1. Dependency upgrade and test/runtime audit infrastructure if required for later verification.
2. CloudBase schema and staging verification.
3. Checkout phone auth and order creation P0 guard.
4. Customer private module runtime stabilization.
5. Image reference and display pipeline.
6. Owner product management edit flow.
7. Admin account management hardening.
8. Documentation and manual acceptance reports.

If the user wants a single safety checkpoint before manual acceptance, create one checkpoint commit after deployment/full verification instead of attempting perfect hunk splitting under time pressure. The checkpoint message should make clear that final release still awaits manual WeChat acceptance.
