# Customer Runtime Stabilization - Performance And Dedupe Delivery Log

Captured: 2026-06-01 13:31:00 +08:00

## Scope

This log covers Package D from `docs/prd/debug-prd.md`: duplicate request and tab-return stabilization for customer shopping bag, favorites, and mine.

In scope:

- In-flight dedupe for page snapshot loads.
- Short cache for quick tab-return loads.
- Stale response protection where mutations can race snapshot refreshes.
- Request logging with action, lifecycle source, duration, status, and dedupe flag.

Out of scope:

- Long-lived identity, token, phone, or openid caching.
- Hidden global state outside explicit page/runtime request logging.
- Unrelated owner/staff pages.

## Implementation

Changed or added files:

- `src/services/performance/customer-runtime-request-log.ts`
- `src/services/performance/customer-runtime-request-log.test.ts`
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts`
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts`
- `src/pages/customer/favorites/useCustomerFavoritesPageState.ts`
- `src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts`
- `src/pages/customer/favorites/index.vue`
- `src/pages/customer/favorites/index.test.ts`
- `src/features/customer-mine/customer-mine-page-state.ts`
- `src/features/customer-mine/customer-mine-page-state.test.ts`

Key behavior:

- Shopping bag, favorites, and mine reuse a pending snapshot promise for duplicate lifecycle/retry requests.
- Shopping bag and mine keep useful previous views while refreshes are running or fail.
- Favorites now has a dedicated page-state module with pending request dedupe and cache invalidation after removal.
- Request logs include action, source, duration, success/failure, and dedupe status.
- No customer identity fields, tokens, phone numbers, or openids are stored in the short cache.

## Evidence

Focused tests:

- Command: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/performance/customer-runtime-request-log.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/features/customer-mine/customer-mine-page-state.test.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts src/pages/customer/favorites/index.test.ts`
- Result: passed, 6 files, 93 tests.

Full gate:

- Command: `pnpm.cmd run verify:full`
- Result: passed.

## Notes

Automated tests prove dedupe/cache behavior at the page-state seam. WeChat DevTools and real-device timing observations remain manual acceptance evidence.
