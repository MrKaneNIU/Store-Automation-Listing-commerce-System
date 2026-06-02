# Customer Runtime Stabilization Execution Plan

Agent phase: `agents.prd_planner.toml`

Basis: [01 Diagnosis](../../audits/customer-runtime-stabilization/01-diagnosis.md)

## A. CloudBase Schema Stabilization

Risk: P0

Modify files:

- `backend/src/cloudbase/cloudbase-data-model.ts`
- `backend/src/cloudbase/cloudbase-data-model.test.ts`
- `cloudfunctions/mallHealth/index.js`
- `cloudfunctions/mallHealth/index.test.js` if present or add focused test coverage
- `package.json`

Add files:

- `config/cloudbase/schema.required.json`
- `scripts/cloudbase-schema-check.mjs`
- `scripts/cloudbase-schema-apply-staging.mjs`
- `scripts/verify-staging.mjs`
- `docs/plans/customer-runtime-stabilization/03-cloudbase-schema-delivery-log.md`

Do not touch:

- page UI files
- order/inventory business rules
- payment/logistics/refund/coupon/OCR feature behavior

Commands:

- `pnpm.cmd exec vitest run --config vitest.config.ts backend/src/cloudbase/cloudbase-data-model.test.ts`
- `pnpm.cmd run cloudbase:schema:check`
- `pnpm.cmd test`
- `pnpm.cmd run verify`
- `pnpm.cmd run verify:full` because `package.json` scripts change

Acceptance:

- Required schema includes `shopping_bag_items` and `customer_favorites`.
- `shopping_bag_items` required fields include `customer_id`, `product_id`, `sku_id`, `quantity`, `created_at`, `updated_at`.
- `customer_favorites` required fields include `customer_id`, `product_id`, `created_at`, `updated_at`.
- `orders` required fields include `customer_id`, `status`, `created_at`, `updated_at`.
- Schema check reports envId and fails non-zero on missing collections.
- Schema apply refuses production and is idempotent for dev/staging.
- `verify:staging` is a real script, not an empty placeholder.

Rollback:

- Revert added schema scripts and `package.json` scripts.
- Do not delete remote collections during rollback; only stop relying on newly added automation if needed.

## B. Backend Customer-Private Module Stabilization

Risk: P0

Modify files:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`
- `cloudfunctions/mallApi/index.js` only if store-level error mapping is required

Add files:

- `docs/plans/customer-runtime-stabilization/05-backend-private-modules-delivery-log.md`

Do not touch:

- product browsing auth behavior
- order stock reservation/cancel/confirm rules
- frontend page layout

Commands:

- `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js`
- `pnpm.cmd test`
- `pnpm.cmd run verify`
- `pnpm.cmd run verify:backend`
- `pnpm.cmd run verify:api`

Acceptance:

- Missing `shopping_bag_items` and `customer_favorites` map to `INFRA_SCHEMA_MISSING`.
- Raw CloudBase strings are logged server-side but not returned in API envelopes.
- Empty existing shopping bag returns successful empty snapshot.
- Empty existing favorites returns successful empty snapshot.
- Empty mine snapshot returns identity, phone state, zero utility counts, and empty recent orders.
- Customer-private reads and writes use backend verified customer identity only.
- Unauthorized actions return stable `UNAUTHORIZED`.
- `createCustomerOrder` does not trust client `customerId`, `openid`, or `phoneNumber`.

Rollback:

- Revert backend error-mapping and snapshot changes while keeping tests as evidence if reviewer finds the implementation unsafe.

## C. Frontend Error Display Stabilization

Risk: P1

Modify files:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/mall-api-client.ts` if typed error helpers belong there
- `src/features/customer-shopping-bag/customer-shopping-bag.ts`
- `src/features/customer-favorites/customer-favorites.ts`
- `src/features/customer-mine/customer-mine.ts`
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
- `src/pages/customer/favorites/index.vue`
- `src/features/customer-mine/customer-mine-page-state.ts`
- `src/pages/customer/mine/useCustomerMinePageState.ts`
- UI page files only for small text/state wiring if state-layer changes cannot satisfy the PRD

Add files:

- focused tests beside changed state/facade files if existing files do not cover the behavior
- `docs/plans/customer-runtime-stabilization/07-frontend-error-state-delivery-log.md`

Do not touch:

- visual redesign
- routing outside customer shopping bag/favorites/mine
- backend collection access from pages

Commands:

- `pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/mall-api-client.test.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/customer-mine/customer-mine.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/pages/customer/mine/useCustomerMinePageState.test.ts`
- `pnpm.cmd test`
- `pnpm.cmd run verify`
- `pnpm.cmd run verify:full`

Acceptance:

- `UNAUTHORIZED` maps to `请重试验证微信身份`.
- `INFRA_SCHEMA_MISSING` maps to `服务正在初始化，请稍后重试`.
- `NETWORK_TIMEOUT` maps to `网络较慢，请稍后重试`.
- unknown failures map to `暂时无法同步，请稍后重试`.
- Page-facing text never contains `DATABASE_COLLECTION_NOT_EXIST`, `ResourceNotFound`, `Db or Table not exist`, `docs.cloudbase.net`, stack traces, or raw JSON.
- Shopping bag, favorites, and mine preserve usable empty/retry states.

Rollback:

- Revert error mapping and page-state changes only; keep schema/backend artifacts intact unless reviewer ties failure to those changes.

## D. Performance And Duplicate Request Repair

Risk: P1

Modify files:

- `src/services/cloudbase/mall-api-client.ts`
- `src/services/cloudbase/cloudbase-function-client.ts` if request tracing belongs at the generic function boundary
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
- `src/pages/customer/favorites/index.vue` or extracted favorites page-state module
- `src/features/customer-mine/customer-mine-page-state.ts`
- `src/features/cloudbase-mall/customer-shopping-bag.ts`
- `src/features/cloudbase-mall/customer-favorites.ts`
- `src/features/cloudbase-mall/customer-mine.ts`
- `cloudfunctions/mallApi/mall-api-core.js` for mine aggregation and query optimization

Add files:

- shared page snapshot cache helper if existing patterns are insufficient
- performance/dedupe tests
- `docs/plans/customer-runtime-stabilization/09-performance-delivery-log.md`

Do not touch:

- sensitive identity persistence
- global hidden state outside explicit short-lived in-memory cache
- unrelated owner/staff pages

Commands:

- targeted page-state/facade/client/backend tests
- `pnpm.cmd test`
- `pnpm.cmd run verify`
- `pnpm.cmd run verify:full`

Acceptance:

- Same `action + payload` in-flight request reuses the existing promise.
- Retry taps are debounced and do not start request storms.
- Older responses cannot overwrite newer state.
- Short cache is 30-60 seconds and excludes `openid`, `phoneNumber`, tokens, and secrets.
- Bag/favorites mutations invalidate affected cache keys.
- Mine page uses a single `getCustomerMineSnapshot` facade call.
- Development request logs include action, lifecycle source, duration, success/failure, and dedupe status.

Rollback:

- Revert cache/dedupe helper and affected page-state changes; no data migration needed.

## E. Test Completion

Risk: P1

Modify files:

- existing tests beside changed production files
- `scripts/*` tests if script behavior is complex

Add files:

- schema script tests if a pure parser/helper is introduced
- smoke tests if no existing smoke file can be extended

Do not touch:

- approved fixtures unless adding new explicit cases
- unrelated tests

Commands:

- `pnpm.cmd test`
- `pnpm.cmd run coverage`
- targeted `vitest` commands for each changed seam
- `pnpm.cmd run verify`

Acceptance:

- Tests fail for the intended missing behavior before implementation where practical.
- New tests assert the exact P0/P1 contract without weak substring-only assertions when a behavioral seam exists.
- Coverage gate remains under `pnpm.cmd run verify`.

Rollback:

- Revert failing tests only if reviewer confirms the tested expectation is outside PRD scope.

## F. Real Environment Verification

Risk: P0

Modify files:

- `docs/audits/customer-runtime-stabilization/11-local-verification.md`
- `docs/audits/customer-runtime-stabilization/12-staging-verification.md`
- `docs/testing/customer-runtime-stabilization/13-manual-acceptance.md`
- `docs/audits/customer-runtime-stabilization/14-final-report.md`

Add files:

- manual command checklist if CloudBase deploy/schema operations cannot be completed from this environment

Do not touch:

- production data deletion
- production schema apply without explicit staging/dev guard
- manual acceptance results not actually observed

Commands:

- `pnpm.cmd test`
- `pnpm.cmd run verify`
- `pnpm.cmd run verify:full`
- `pnpm.cmd run verify:backend`
- `pnpm.cmd run verify:api`
- `pnpm.cmd run cloudbase:schema:check`
- `pnpm.cmd run cloudbase:schema:apply:staging` only if target is confirmed non-production/dev-staging
- deploy `mallApi` using the existing CloudBase function deployment path or document exact manual step
- `pnpm.cmd run verify:staging`

Acceptance:

- Local verification is fully recorded.
- Remote schema check proves `shopping_bag_items` and `customer_favorites` exist.
- Remote smoke proves health/current customer/empty bag/empty favorites/empty mine/no raw error strings.
- Manual WeChat Developer Tools / real-device matrix is complete before final `PASS`.
- If manual or remote proof is unavailable, final result is capped at `CONDITIONAL PASS` or `FAIL`.

Rollback:

- Re-deploy the last known good `mallApi` package if a deploy regression is confirmed.
- Disable or revert newly added staging scripts if they block release checks incorrectly.
- Do not remove created required collections unless the product owner explicitly requests destructive cleanup.
