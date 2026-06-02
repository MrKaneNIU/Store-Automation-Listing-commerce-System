# Customer Runtime Stabilization - Verification Log

Captured: 2026-06-01 13:42:00 +08:00

## Local Automated Verification

Focused schema:

- Command: `pnpm.cmd exec vitest run --config backend/vitest.config.ts backend/src/cloudbase/cloudbase-data-model.test.ts`
- Result: passed, 1 file, 5 tests.

Focused mallApi and customer runtime slice:

- Command: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js cloudfunctions/mallApi/index.test.js src/services/cloudbase/cloudbase-function-client.test.ts src/services/cloudbase/runtime-mall-api-client.test.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/customer-mine/customer-mine.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/pages/customer/favorites/index.test.ts src/features/customer-mine/customer-mine-page-state.test.ts`
- Result: passed, 10 files, 118 tests.

Type check:

- Command: `pnpm.cmd run type-check`
- Result: passed.

Full local gate:

- Command: `pnpm.cmd run verify:full`
- First run: failed at `backend/src/cloudbase/cloudbase-health.test.ts` because the test still expected 14 collections.
- Fix: updated the backend health contract test to expect 16 collections.
- Final run after debugger fixes: passed. This included lint, boundary check, full Vitest suite, coverage, type-check, backend tests/build, production/all dependency audits, mp-weixin build, and mp-weixin smoke artifact checks.
- Final suite counts observed after reviewer stale-refresh fix: frontend/root Vitest 75 files and 454 tests passed; backend Vitest 12 files and 61 tests passed.
- Coverage observed: all files 91.69% statements, 78.4% branches, 89.6% functions, 91.69% lines.

Reviewer follow-up:

- Command: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts`
- Result: passed, 1 file, 4 tests.
- Added behavior coverage for stale pending favorites refresh not restoring a removed item.

Diff hygiene:

- Command: `git diff --check`
- Result: no whitespace errors; Windows line-ending conversion warnings only.

## CloudBase Schema Verification

Before remote create:

- Command: `pnpm.cmd run cloudbase:schema:check`
- Result: failed with missing `shopping_bag_items`, `customer_favorites`.

After remote create:

- Command: `pnpm.cmd run cloudbase:schema:check`
- Result: passed, 16 required collections present.

Idempotent apply:

- Command: `pnpm.cmd run cloudbase:schema:apply:staging`
- Result: passed, `changed: false`, all required collections already exist.

MCP structure verification:

- `shopping_bag_items`: exists; indexes include `_id_`, `_openid_1`, `customer_id_updated_at`, `customer_product_sku`.
- `customer_favorites`: exists; indexes include `_id_`, `_openid_1`, `customer_id_created_at`, `customer_product`.

## Deployed mallApi Verification

Deploy:

- Tool: CloudBase `manageFunctions.updateFunctionCode`
- Function: `mallApi`
- Initial result: success, request id recorded by CloudBase management response.
- Final result after debugger fixes: success, request id `b12e2f64-0417-4ed0-a4f9-05fc5814cf35`.

Deployment detail:

- Tool: CloudBase `queryFunctions.getFunctionDetail`
- Function: `mallApi`
- Result: `Status=Active`, `AvailableStatus=Available`, runtime `Nodejs18.15`, namespace `cloud1-d7gifjyzl7721b383`, mod time `2026-06-01 13:23:03`.

Contract smoke:

- Tool: CloudBase `manageFunctions.invokeFunction`
- Event: `{ "action": "listContracts" }`
- Result: success; action list includes `getCustomerMineSnapshot`, `getCustomerShoppingBagSnapshot`, `getCustomerFavoriteProductsSnapshot`, and related command actions.

Staging script:

- Command: `pnpm.cmd run verify:staging`
- Result: failed intentionally, not a PASS.
- Passed buckets inside script: schema ok, health ok, listContracts ok, customer-private transport ok, no raw CloudBase error leak detected for customer-private actions.
- Blocking bucket: customer-private actions returned `UNAUTHORIZED` because verified WeChat identity/manual acceptance is required, so the script refuses to mark full success.

## Manual Acceptance Status

WeChat DevTools acceptance: not completed in this run.

Real-device acceptance: not completed in this run.

Final status cannot be PASS under `docs/prd/debug-prd.md` until both manual buckets are recorded with evidence.
