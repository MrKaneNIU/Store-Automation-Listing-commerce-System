# Customer Runtime Stabilization - Final Report

Captured: 2026-06-01 13:42:00 +08:00

## Final Status

Status: CONDITIONAL PASS

The PRD implementation, local automated verification, real CloudBase schema verification, remote deployment check, and staging smoke guard are complete.

The result is not final PASS because WeChat DevTools and real-device manual acceptance were not completed in this run.

## PRD Completion

Completed:

- CloudBase schema contract now covers `shopping_bag_items` and `customer_favorites`.
- Target environment `cloud1-d7gifjyzl7721b383` has the required 16 collections.
- Customer-private collection indexes exist for shopping bag and favorites.
- `mallApi` normalizes missing CloudBase collection/resource failures without raw error leaks.
- Shopping bag, favorites, and mine map raw backend/runtime failures to stable page-facing messages.
- Shopping bag, favorites, and mine have request dedupe / short-cache behavior at page-state seams.
- Favorites protects against stale pending refresh restoring a removed favorite.
- `mallApi` was redeployed and remote `listContracts` exposes the customer runtime actions.
- Documentation artifacts 00-14 are present under the PRD audit/plan/testing directories.

Not completed:

- WeChat DevTools customer identity acceptance.
- Real-device customer identity acceptance.

## Modified Areas

Schema and staging tooling:

- `backend/src/cloudbase/cloudbase-data-model.ts`
- `backend/src/cloudbase/cloudbase-data-model.test.ts`
- `backend/src/cloudbase/cloudbase-health.test.ts`
- `config/cloudbase/schema.required.json`
- `cloudfunctions/mallHealth/index.js`
- `scripts/smoke-cloudbase-health.mjs`
- `scripts/cloudbase-schema-utils.mjs`
- `scripts/cloudbase-schema-check.mjs`
- `scripts/cloudbase-schema-apply-staging.mjs`
- `scripts/verify-staging.mjs`
- `package.json`

Backend customer-private stabilization:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`

Frontend facade/ViewModel and page-state stabilization:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/runtime-mall-api-client.ts`
- `src/features/customer-shopping-bag/customer-shopping-bag.ts`
- `src/features/customer-favorites/customer-favorites.ts`
- `src/features/customer-mine/customer-mine.ts`
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
- `src/pages/customer/favorites/index.vue`
- `src/pages/customer/favorites/useCustomerFavoritesPageState.ts`
- `src/features/customer-mine/customer-mine-page-state.ts`
- related focused tests beside those seams

Performance logging:

- `src/services/performance/customer-runtime-request-log.ts`
- `src/services/performance/customer-runtime-request-log.test.ts`

Documentation:

- `docs/audits/customer-runtime-stabilization/*`
- `docs/plans/customer-runtime-stabilization/*`
- `docs/testing/customer-runtime-stabilization/*`

## Intentionally Unchanged

The following areas were intentionally kept outside scope:

- payment
- logistics
- refunds
- coupons
- customer service
- OCR feature expansion
- merchant/admin feature expansion
- data model/API contract changes outside the customer runtime blocker
- direct page database/repository/CloudBase access

## Verification

Local focused tests:

- `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/performance/customer-runtime-request-log.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/features/customer-mine/customer-mine-page-state.test.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts src/pages/customer/favorites/index.test.ts`
- Result: passed, 6 files, 93 tests.

Reviewer follow-up test:

- `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts`
- Result: passed, 1 file, 4 tests.

Type check:

- `pnpm.cmd run type-check`
- Result: passed.

Full local gate:

- `pnpm.cmd run verify:full`
- Result: passed.
- Root Vitest: 75 files, 454 tests passed.
- Backend Vitest: 12 files, 61 tests passed.
- Coverage: all files 91.69% statements, 78.4% branches, 89.6% functions, 91.69% lines.
- Dependency audits: no known vulnerabilities.
- `build:mp-weixin` and `smoke:mp-weixin`: passed.

CloudBase schema:

- `pnpm.cmd run cloudbase:schema:check`: passed.
- `pnpm.cmd run cloudbase:schema:apply:staging`: passed, `changed: false`.
- MCP `describeCollection`: confirmed required customer-private indexes.

CloudBase deployment and staging:

- `mallApi` deployed by CloudBase `manageFunctions.updateFunctionCode`, request id `b12e2f64-0417-4ed0-a4f9-05fc5814cf35`.
- `mallApi` status after deploy: `Active` / `Available`.
- Remote `listContracts`: passed and includes customer runtime actions.
- `pnpm.cmd run verify:staging`: failed intentionally with exit code 1 because verified WeChat identity is unavailable in shell/MCP smoke. Passed buckets inside the script were schema, health, listContracts, transport, and raw-error leak checks.

Diff hygiene:

- `git diff --check`: no whitespace errors; Windows line-ending conversion warnings only.

## Reviewer Status

Initial reviewer result: NEEDS_FIX.

Resolved blockers:

- Mine snapshot non-critical utility query failures no longer fail the whole page.
- `verify:staging` parses mallApi envelopes and refuses transport-only false success.
- Request performance logging exists and is covered.
- Delivery, staging, manual, and review artifacts are present.
- Favorites dedupe/cache has behavior tests.
- Favorites stale pending refresh cannot restore a removed favorite.

Current package review artifacts:

- `04-schema-review.md`: PASS.
- `06-backend-review.md`: PASS.
- `08-frontend-review.md`: PASS.
- `10-performance-review.md`: PASS.

Final reviewer result after debugger round 2: PASS.

## Remaining Risks

- Manual WeChat DevTools acceptance is pending.
- Manual real-device acceptance is pending.
- CloudBase management output exposed function environment variable values during inspection. Values are intentionally not copied into repo artifacts; rotate affected secrets outside this PRD if the team treats management-output exposure as credential exposure.

## Merge Recommendation

Recommendation: merge only as a conditional customer-runtime stabilization checkpoint, not as final manual acceptance.

Do not label this PRD final PASS until `docs/testing/customer-runtime-stabilization/13-manual-acceptance.md` is completed with WeChat DevTools and real-device evidence.
