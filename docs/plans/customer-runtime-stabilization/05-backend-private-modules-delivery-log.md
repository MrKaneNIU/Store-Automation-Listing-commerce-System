# Customer Runtime Stabilization - Backend Private Modules Delivery Log

Captured: 2026-06-01 13:31:00 +08:00

## Scope

This log covers Package B from `docs/prd/debug-prd.md`: backend customer-private runtime stabilization for shopping bag, favorites, and mine.

In scope:

- Normalize missing CloudBase collection failures behind stable API errors.
- Keep customer-private reads and writes on backend verified identity.
- Preserve empty-state success for existing empty shopping bag and favorites data.
- Keep Mine usable when non-critical utility lists fail.

Out of scope:

- Payment, logistics, refunds, coupons, customer service, OCR, and merchant-admin feature work.
- Client-provided `customerId`, `openid`, or `phoneNumber` trust.
- Direct page-to-database access.

## Implementation

Changed files:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`

Key behavior:

- Missing CloudBase collection/resource strings are mapped to `INFRA_SCHEMA_MISSING`.
- API envelopes do not expose raw strings such as `DATABASE_COLLECTION_NOT_EXIST`, `Db or Table not exist`, `ResourceNotFound`, or CloudBase documentation URLs.
- Unauthorized customer-private actions continue to return stable `UNAUTHORIZED`.
- `getCustomerMineSnapshot` now resolves non-critical order/bag/favorite list failures to empty lists, preserving identity, phone state, zero utility counts, and recent orders fallback behavior.

## Evidence

Focused backend/customer runtime test:

- Command: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/performance/customer-runtime-request-log.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/features/customer-mine/customer-mine-page-state.test.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts src/pages/customer/favorites/index.test.ts`
- Result: passed, 6 files, 93 tests.

Full gate:

- Command: `pnpm.cmd run verify:full`
- Result: passed.

Deployment:

- Tool: CloudBase `manageFunctions.updateFunctionCode`
- Function: `mallApi`
- Result: success, request id `b12e2f64-0417-4ed0-a4f9-05fc5814cf35`.

Post-deploy state:

- Function `mallApi` is `Active` and `Available`.
- Runtime is `Nodejs18.15`.
- Namespace is `cloud1-d7gifjyzl7721b383`.
- Remote `listContracts` includes `getCustomerMineSnapshot`, `getCustomerShoppingBagSnapshot`, `getCustomerFavoriteProductsSnapshot`, and related write actions.

## Notes

CloudBase management output included environment variable values. The values are intentionally not copied here. Rotate the affected CloudBase function secrets outside this PRD if the team treats management-output exposure as credential exposure.
