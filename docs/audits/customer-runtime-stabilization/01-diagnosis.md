# Customer Runtime Stabilization Diagnosis

Agent phase: `agents.prd_debugger.toml`

## Root Cause Conclusion

The WeChat Developer Tools acceptance failure is caused by real CloudBase schema drift, not only local code behavior.

- Runtime envId is consistently `cloud1-d7gifjyzl7721b383`.
- The deployed `mallApi` in that environment exposes `getCustomerShoppingBagSnapshot`, `getCustomerFavoriteProductsSnapshot`, and `getCustomerMineSnapshot`.
- The real CloudBase database is missing `shopping_bag_items` and `customer_favorites`.
- Local schema metadata exists in `backend/src/cloudbase/cloudbase-data-model.ts`, but it does not include `shopping_bag_items` or `customer_favorites`.
- `package.json` has no `cloudbase:schema:check`, `cloudbase:schema:apply:staging`, or `verify:staging` scripts.
- Page-facing error conversion still allows raw backend error messages to become page failure text.

Result: this is a P0 release blocker.

## Evidence Paths

- Runtime mini-program env: `src/services/cloudbase/runtime-mall-api-client.ts`
- Cloud function env fallback: `cloudfunctions/mallApi/mall-api-core.js`
- CloudBase project config: `cloudbaserc.json`
- WeChat app manifest: `src/manifest.json`
- Deployed function detail: CloudBase MCP `queryFunctions(getFunctionDetail, mallApi)` showed namespace `cloud1-d7gifjyzl7721b383`, status `Active`, runtime `Nodejs18.15`, modified `2026-06-01 11:19:29`.
- Deployed contract: CloudBase MCP `manageFunctions(invokeFunction, mallApi, listContracts)` returned customer shopping-bag, favorites, mine, auth, and order actions.
- Remote collection checks: CloudBase MCP `readNoSqlDatabaseStructure(checkCollection, ...)`.
- Local schema metadata: `backend/src/cloudbase/cloudbase-data-model.ts`
- Local scripts: `package.json`
- Backend collection access: `cloudfunctions/mallApi/index.js`, `cloudfunctions/mallApi/mall-api-core.js`
- Page-facing adapter: `src/services/cloudbase/cloudbase-function-client.ts`, `src/services/cloudbase/mall-api-client.ts`
- Shopping bag request state: `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
- Favorites page state: `src/pages/customer/favorites/index.vue`
- Mine page state: `src/features/customer-mine/customer-mine-page-state.ts`, `src/pages/customer/mine/useCustomerMinePageState.ts`

## EnvId Sources

| Source | Observed value |
| --- | --- |
| `cloudbaserc.json` | `cloud1-d7gifjyzl7721b383` |
| `src/services/cloudbase/runtime-mall-api-client.ts` | hardcoded `cloud1-d7gifjyzl7721b383` |
| `dist/build/mp-weixin/services/cloudbase/runtime-mall-api-client.js` | built output contains `cloud1-d7gifjyzl7721b383` |
| `src/services/storage/cloudbase-upload-service.ts` / built output | same env for storage runtime |
| `cloudfunctions/mallApi/mall-api-core.js` health fallback | `process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || 'cloud1-d7gifjyzl7721b383'` |
| CloudBase MCP auth status | current env `cloud1-d7gifjyzl7721b383` |
| `src/manifest.json` | WeChat appid `wxa63c53796488d4d4`; no envId field |

## mallApi Deployment State

- Local function source is under `cloudfunctions/mallApi`.
- `cloudbaserc.json` maps `mallApi` to `./cloudfunctions/mallApi`.
- Historical docs include manual deploy command:
  `npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId cloud1-d7gifjyzl7721b383 --dir cloudfunctions/mallApi --force --json`
- `package.json` has no reusable deploy script for `mallApi`.
- Remote function is active and recently modified.
- Remote `listContracts` includes the customer private actions, so the current blocker is not missing action discovery.
- The remote function environment contains sensitive variables. Values are intentionally not copied here; they should be treated as secrets and not committed.

## Code Actual Collection Usage

Confirmed collection names used by source/runtime paths:

- `ocr_batches`
- `ocr_jobs`
- `product_drafts`
- `products`
- `skus`
- `orders`
- `order_items`
- `customers`
- `merchant_users`
- `staff_users`
- `role_assignments`
- `inventory_ledger`
- `operation_audit_logs`
- `uploaded_assets`
- `shopping_bag_items`
- `customer_favorites`

Customer-private collection call sites:

- `cloudfunctions/mallApi/mall-api-core.js`: `listShoppingBagItems`, `saveShoppingBagItem`, `updateShoppingBagItem`, `deleteShoppingBagItem` use `shopping_bag_items`.
- `cloudfunctions/mallApi/mall-api-core.js`: `listCustomerFavorites`, `saveCustomerFavorite`, `deleteCustomerFavorite` use `customer_favorites`.

## Initialization / Schema Coverage

Existing schema-like coverage:

- `backend/src/cloudbase/cloudbase-data-model.ts`
- `backend/src/cloudbase/cloudbase-data-model.test.ts`

Covered there:

- `ocr_batches`
- `product_drafts`
- `products`
- `skus`
- `orders`
- `order_items`
- `customers`
- `merchant_users`
- `staff_users`
- `role_assignments`
- `inventory_ledger`
- `operation_audit_logs`
- `uploaded_assets`
- `ocr_jobs`

Missing there:

- `shopping_bag_items`
- `customer_favorites`

Script coverage:

- No `cloudbase:schema:check`.
- No `cloudbase:schema:apply:staging`.
- No `verify:staging`.
- Existing CloudBase smoke scripts are local function smoke and health smoke only: `cloudbase:api:smoke`, `cloudbase:health:smoke`.

## Remote Collection Existence

CloudBase MCP is authenticated and bound to `cloud1-d7gifjyzl7721b383`.

Confirmed existing:

- `customers`
- `orders`
- `order_items`
- `products`
- `skus`
- `inventory_ledger`
- `operation_audit_logs`
- `uploaded_assets`
- `role_assignments`
- `ocr_batches`
- `product_drafts`
- `ocr_jobs`
- `merchant_users`
- `staff_users`

Confirmed missing:

- `shopping_bag_items`
- `customer_favorites`

The MCP `listCollections` call reported total `14`, and individual checks identify the two missing collections that match the screenshot errors.

## Request Chains

Shopping bag:

`src/pages/customer/shopping-bag/index.vue`
-> `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
-> `src/features/cloudbase-mall/customer-shopping-bag.ts`
-> `src/services/cloudbase/mall-api-client.ts`
-> `mallApi.getCustomerShoppingBagSnapshot`
-> `cloudfunctions/mallApi/mall-api-core.js`
-> repository methods over `shopping_bag_items`, `products`, `skus`

Favorites:

`src/pages/customer/favorites/index.vue`
-> `src/features/cloudbase-mall/customer-favorites.ts`
-> `src/services/cloudbase/mall-api-client.ts`
-> `mallApi.getCustomerFavoriteProductsSnapshot`
-> `cloudfunctions/mallApi/mall-api-core.js`
-> repository methods over `customer_favorites`, `products`, `skus`

Mine:

`src/pages/customer/mine/index.vue`
-> `src/pages/customer/mine/useCustomerMinePageState.ts`
-> `src/features/customer-mine/customer-mine-page-state.ts`
-> `src/features/cloudbase-mall/customer-mine.ts`
-> `src/services/cloudbase/mall-api-client.ts`
-> `mallApi.getCustomerMineSnapshot`
-> `cloudfunctions/mallApi/mall-api-core.js`
-> `createCustomerMineSnapshot`
-> `orders`, `shopping_bag_items`, `customer_favorites`

## Slow Request / Duplicate Request Causes

Evidence-backed causes:

- Shopping bag has in-page in-flight dedupe through `pendingSnapshot`, but no shared short cache across tab returns.
- Mine has in-page in-flight dedupe through `pendingSnapshotLoad`, but no short cache or stale response guard.
- Favorites currently calls `loadSnapshot` directly on every `onShow` and `reload`, with no in-flight dedupe.
- Mine backend snapshot uses one action, but internally waits on `listOrders`, `listShoppingBagItems`, and `listCustomerFavorites`. Missing collections make these fail and turn the whole page into failure.
- `createCustomerMineSnapshot` uses `Promise.all`, so one missing optional utility collection rejects the whole snapshot instead of returning usable zero-count state while separately surfacing schema infrastructure failure to smoke checks.
- Customer-private queries need `customer_id` indexes for `shopping_bag_items`, `customer_favorites`, and `orders`.
- `src/services/cloudbase/cloudbase-function-client.ts` throws `${code}: ${message}` for error envelopes, and page view factories convert that error message to user-facing failure text. This is the raw error leak path.

Not observed yet:

- A verified runtime request-duration log for each page lifecycle source. This is missing and must be added in the performance phase.
- A real WeChat DevTools repeated-tab-switch timing matrix. This remains manual acceptance evidence, not local automation.

## Missing Tests

Required missing or incomplete coverage:

- schema manifest includes `shopping_bag_items` and `customer_favorites`
- schema check fails when either collection is absent remotely
- schema apply refuses production and can create missing dev/staging collections
- missing collection errors map to `INFRA_SCHEMA_MISSING`
- raw CloudBase strings do not leak through API responses or page failure text
- favorites onShow/retry in-flight dedupe
- shared request perf log includes action, lifecycle source, duration, success/fail, dedupe status
- stale response ignore for customer page state
- short cache and invalidation for shopping bag/favorites/mine
- staging smoke for health/current customer/empty bag/empty favorites/empty mine/no raw error strings

## Risk Levels

- P0: `shopping_bag_items` missing remotely blocks shopping bag page.
- P0: `customer_favorites` missing remotely blocks favorites and mine.
- P0: no real schema check/apply/staging smoke gate lets schema drift reach manual acceptance.
- P1: raw CloudBase errors can become customer-visible failure text.
- P1: favorites lacks request dedupe and customer pages lack shared short cache/stale response guard.
- P2: `mallApi` deploy relies on manual documented commands instead of a package script.
- P2: remote function configuration contains sensitive environment variables; values must stay out of repo artifacts and should be rotated if considered exposed.

## Release Blocker

Yes. This blocks release until at least:

- `shopping_bag_items` exists in the target CloudBase environment.
- `customer_favorites` exists in the target CloudBase environment.
- schema check/apply and staging smoke are implemented and passing.
- raw error leak paths are sanitized.
- manual WeChat Developer Tools / real-device acceptance is completed or final result is capped at `CONDITIONAL PASS`.
