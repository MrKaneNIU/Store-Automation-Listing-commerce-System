# Safe Stabilization and Refactor Plan

Captured: 2026-06-02
Role: Planner
PRD phase: 5
Scope: safe closeout plan after codebase stabilization audit

## Planning Rule

Do not expand product scope. Do not redesign UI. Do not split large files before manual acceptance unless a P0/P1 blocker appears. Automated verification, CloudBase deployment smoke, and WeChat manual acceptance remain separate gates.

## A. Must Do Now

### A1. Deploy and verify the checkout trusted-boundary guard

- Problem: Phase 2 found a P0 order-creation boundary issue. A local minimal fix now rejects default production `mock_wechat` order sessions and adds direct tests, but deployment/full verification are still pending.
- Files: `cloudfunctions/mallApi/mall-api-core.js`, `cloudfunctions/mallApi/mall-api-core.test.js`.
- Risk: P1 until deployed. Without deployment, local code and remote `mallApi` contract diverge.
- Suggested change: Deploy `cloudfunctions/mallApi`, then run local full verification and staging smoke. Do not add new checkout behavior.
- Estimated production-code lines: already applied under 20 production lines; deployment has no new source lines.
- Tests: `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`, `pnpm.cmd run verify`, `pnpm.cmd run verify:full`, `pnpm.cmd run verify:api`, `pnpm.cmd run verify:staging`.
- Manual acceptance: Yes. Real WeChat checkout still needs click-order, cancel authorization, bound-phone direct submit, order creation, and merchant cancellation checks.
- Rollback: Revert the small `createCustomerOrder` guard and test helper option changes, then redeploy previous `mallApi`. Only do this if deployment breaks verified production checkout.

### A2. Keep `_ai_review_context` artifacts out of commits

- Problem: `_ai_review_context/` and `_ai_review_context.zip` are untracked review/export artifacts and can pollute review and commit splitting.
- Files: `_ai_review_context/`, `_ai_review_context.zip`.
- Risk: P3 for code, P2 for review hygiene.
- Suggested change: Do not commit these artifacts. If a cleanup commit is requested later, remove or ignore them separately from business changes.
- Estimated production-code lines: 0.
- Tests: No code tests. Use `git status --short -uall` before staging.
- Manual acceptance: No.
- Rollback: If removed accidentally and needed, regenerate/export review context.

### A3. Preserve current status wording until manual acceptance

- Problem: Historical docs contain `PASS`, `FAIL`, and `CONDITIONAL PASS` for different scopes. Current release readiness must not become `READY FOR RELEASE` before real-device acceptance.
- Files: `docs/audits/codebase-stabilization/*.md`, `.ai/FINAL_REPORT.md`, older `docs/plans/*.md`.
- Risk: P2.
- Suggested change: Use Phase 7 readiness guard as current release-readiness source. Keep final wording at `READY FOR MANUAL ACCEPTANCE` or `READY FOR CHECKPOINT COMMIT`.
- Estimated production-code lines: 0.
- Tests: Documentation review plus final verification commands.
- Manual acceptance: Yes, because wording depends on manual gate status.
- Rollback: Restore previous report wording if the current status is incorrectly overstated.

## B. Refactor After Manual Acceptance

### B1. Split `mall-api-core.js` by backend action domain

- Problem: `cloudfunctions/mallApi/mall-api-core.js` is 1,983 lines and owns too many domains.
- Files: `cloudfunctions/mallApi/mall-api-core.js`; future extracted files under `cloudfunctions/mallApi/`.
- Risk: P1 maintenance risk, but high regression risk if done before acceptance.
- Suggested change: Extract one slice at a time: customer identity/private snapshots, checkout/orders/inventory ledger, owner products/publish, OCR/image tasks. Keep the exported handler contract stable.
- Estimated production-code lines: 300-900 moved over several PRs; first slice should stay under 300 changed production lines.
- Tests: `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`, then full `verify`.
- Manual acceptance: Yes after any checkout/order/customer-private slice.
- Rollback: Revert the single extraction commit; no data migration should be involved.

### B2. Split `mall-api-core.test.js` by contract topic

- Problem: `cloudfunctions/mallApi/mall-api-core.test.js` is 2,537 lines and now covers unrelated domains.
- Files: `cloudfunctions/mallApi/mall-api-core.test.js`; future test files by topic.
- Risk: P1 review/maintainability risk.
- Suggested change: Extract shared fixtures into a test helper and split tests into auth/identity, product/publish, checkout/orders, shopping bag, favorites, Mine, OCR/image.
- Estimated production-code lines: 0; test lines moved across files.
- Tests: Run all split backend tests and full `verify`.
- Manual acceptance: No direct acceptance, but keep after manual acceptance to reduce risk while current diff is still dirty.
- Rollback: Recombine or revert the test split commit.

### B3. Isolate mock auth/upload fallbacks as explicit test/runtime adapters

- Problem: `mockWechatAuthService`, `allowMockCustomerOrder`, memory-store fallback, and mock upload fallback are necessary in tests/local runtime but easy to misread as production paths.
- Files: `src/features/cloudbase-mall/customer-product-detail.ts`, `src/services/auth/mock-wechat-auth-service.ts`, `src/services/storage/runtime-upload-service.ts`, `cloudfunctions/mallApi/index.js`, `cloudfunctions/mallApi/mall-api-core.js`.
- Risk: P2 after the backend guard; P1 if future code relies on the default mock auth path again.
- Suggested change: Rename or wrap defaults so production CloudBase facades require explicit auth injection. Keep test-only mock paths behind test helper options.
- Estimated production-code lines: 80-180.
- Tests: Checkout facade tests, page product-detail tests, `mall-api-core.test.js`, `verify`.
- Manual acceptance: Yes, checkout phone authorization must be retested.
- Rollback: Restore prior fallback injection behavior.

### B4. Consolidate image URL/temp URL classification

- Problem: Runtime image resolution, image audit service, and CloudBase image audit script each classify CloudBase file IDs and signed temp URLs.
- Files: `src/services/storage/product-image-url.ts`, `src/services/storage/product-image-audit.ts`, `scripts/cloudbase-images-audit.mjs`.
- Risk: P2.
- Suggested change: Extract shared pure classification rules or keep a documented test vector shared by runtime and scripts. Prefer test vectors first if cross-runtime import is awkward.
- Estimated production-code lines: 80-160.
- Tests: `product-image-url.test.ts`, `product-image-audit.test.ts`, image audit script test if available, `verify`.
- Manual acceptance: Yes, product image display and repair/audit flow should be checked.
- Rollback: Revert shared helper extraction and return script/runtime rules to previous implementation.

### B5. Extract customer snapshot request-state helper

- Problem: Shopping bag, favorites, and Mine repeat pending-load/cache/failure-preserve logic.
- Files: `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`, `src/pages/customer/favorites/useCustomerFavoritesPageState.ts`, `src/features/customer-mine/customer-mine-page-state.ts`.
- Risk: P2.
- Suggested change: Extract a small page-state helper for pending request dedupe, cache TTL, and last-usable-snapshot retention. Start with one page, then migrate the others.
- Estimated production-code lines: 120-250 per slice.
- Tests: Page-state tests for each migrated module, `verify`.
- Manual acceptance: Yes for migrated customer page onShow/retry behavior.
- Rollback: Revert one page-state helper migration at a time.

### B6. Split large page shells only after page-state contracts are stable

- Problem: Several `.vue` page shells exceed 500-1000 lines.
- Files: `src/pages/customer/product-detail/index.vue`, `src/pages/owner/products/index.vue`, `src/pages/customer/product-list/index.vue`, `src/pages/customer/shopping-bag/index.vue`, `src/pages/customer/favorites/index.vue`, `src/pages/customer/mine/index.vue`.
- Risk: P2 maintenance risk, high visual regression risk.
- Suggested change: Do not redesign. Extract only inert presentational subcomponents after snapshot/page-state tests are stable. Keep page-facing contracts unchanged.
- Estimated production-code lines: 200-500 moved per page across multiple PRs.
- Tests: Existing page tests, `build:mp-weixin`, Playwright/WeChat visual smoke where available.
- Manual acceptance: Yes for any changed page.
- Rollback: Revert the component extraction commit.

### B7. Label legacy local/MVP tests versus CloudBase runtime contracts

- Problem: Local domain/MVP tests and deployed CloudBase tests both cover similar checkout/order/product flows.
- Files: `src/features/customer-order/customer-order.ts`, `src/features/mall-workflow/*.test.ts`, `src/features/cloudbase-mall/*.test.ts`, backend/API tests.
- Risk: P2 review confusion.
- Suggested change: Add test-suite grouping or docs comments so future reviewers know which tests protect deployed CloudBase behavior and which protect local/domain regression.
- Estimated production-code lines: 0-40, mostly test/doc text.
- Tests: Existing relevant tests.
- Manual acceptance: No.
- Rollback: Revert labeling/doc comments.

## C. Do Not Do Now

### C1. Do not rewrite `mallApi` into a new backend architecture before manual acceptance

- Problem: The core file is too large, but a broad rewrite would risk every current acceptance chain.
- Files: `cloudfunctions/mallApi/mall-api-core.js`.
- Risk: P0 if attempted now.
- Suggested modification: None now.
- Estimated production-code lines: Would exceed 1,000; out of scope.
- Tests: Would require full regression and manual acceptance.
- Manual acceptance: Yes, too risky before current manual gate.
- Rollback: Hard to rollback cleanly if mixed with other changes; avoid.

### C2. Do not redesign customer or owner UI while stabilizing

- Problem: Large page files invite cleanup, but UI redesign is outside PRD.
- Files: all `src/pages/**/*.vue`.
- Risk: P1 visual/interaction regression.
- Suggested modification: None now. Only fix blockers tied to acceptance.
- Estimated production-code lines: 0.
- Tests: Not applicable now.
- Manual acceptance: Would be required if changed.
- Rollback: Avoid creating the risk.

### C3. Do not remove legacy local/MVP tests until CloudBase contracts are fully isolated

- Problem: Some tests may feel duplicated, but they still protect domain and in-memory regression behavior.
- Files: `src/features/mall-workflow/*.test.ts`, `src/features/customer-order/*.test.ts`, `src/domain/**/*.test.ts`.
- Risk: P2 if removed prematurely.
- Suggested modification: Label/split later; do not delete now.
- Estimated production-code lines: 0.
- Tests: Existing tests remain.
- Manual acceptance: No.
- Rollback: Keep unchanged.

### C4. Do not change database schema or API contract for cleanup

- Problem: Schema/API cleanup would be tempting after diff anatomy, but current acceptance depends on existing CloudBase actions and collections.
- Files: `backend/src/cloudbase/cloudbase-data-model.ts`, `cloudfunctions/mallApi/mall-api-core.js`, `src/services/cloudbase/mall-api-client.ts`.
- Risk: P1/P0.
- Suggested modification: None unless a verified P0 schema mismatch appears.
- Estimated production-code lines: 0.
- Tests: `cloudbase:schema:check`, `verify:api`, `verify:staging`.
- Manual acceptance: Yes if changed.
- Rollback: Avoid changing.

### C5. Do not collapse historical docs into a new single narrative

- Problem: Historical plans and PRDs contain old statuses, but rewriting them can destroy useful audit history.
- Files: `docs/prd/**`, `docs/plans/**`, `.ai/**`.
- Risk: P2 audit/history loss.
- Suggested modification: Use current stabilization docs as the latest entry point instead of rewriting older accepted docs.
- Estimated production-code lines: 0.
- Tests: Documentation review.
- Manual acceptance: No.
- Rollback: Keep history unchanged.

## Planner Agent Addendum

The `prd_planner` read-only pass agrees with this plan:

- Execute only A1-A3 before manual acceptance.
- Do not start B-class refactors until manual acceptance is complete.
- Treat remote `mallApi` deployment of the local checkout guard as the largest current closure risk.
- Keep `READY FOR RELEASE` out of all current status wording.
- Preserve schema/API contracts and page visual structure unless a new verified P0/P1 appears.
