# Favorites Module E Acceptance

## Scope

Module E started as verification and acceptance. The 2026-05-30 repair slice
also aligned the deployed CloudBase `mallApi` contract with the local
Favorites implementation and replaced the remaining customer bottom-nav
Favorites placeholder with navigation to the existing favorites route.

No shopping bag, order, inventory, payment, logistics, coupon, checkout,
product visibility, or SKU-level wishlist semantics were changed.

## Changed Files Summary

Module A - contracts and workflow:

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/*.toml`
- `docs/contracts/page-facing-ui-contracts.md`

Module B - customer-scoped storage and CloudBase actions:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/index.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`
- `src/services/cloudbase/mall-api-client.ts`
- `src/services/cloudbase/mall-api-client.test.ts`

Module C - page-facing facade and ViewModel:

- `src/features/customer-favorites/customer-favorites.ts`
- `src/features/customer-favorites/customer-favorites.test.ts`
- `src/features/cloudbase-mall/customer-favorites.ts`
- `src/features/cloudbase-mall/customer-favorites.test.ts`

Module D - UI integration:

- `src/app/routes.ts`
- `src/pages.json`
- `src/pages/customer/favorites/index.vue`
- `src/pages/customer/favorites/index.test.ts`
- `src/pages/customer/product-detail/index.vue`
- `src/pages/customer/product-detail/index.test.ts`
- `src/pages/customer/product-list/index.vue`
- `src/pages/customer/product-list/index.test.ts`

Module E - verification and acceptance:

- `.ai/FAVORITES_MODULE_E_ACCEPTANCE.md`

2026-05-30 repair slice:

- `src/pages/customer/product-list/index.vue`
- `src/pages/customer/product-list/index.test.ts`
- `src/pages/index/index.vue`
- `src/pages/index/index.test.ts`
- `.ai/FAVORITES_MODULE_E_ACCEPTANCE.md`

Remote CloudBase deployment:

- `cloud1-d7gifjyzl7721b383` / `mallApi` code updated from
  `cloudfunctions/mallApi`.

## Business Code Intentionally Not Changed

- Shopping bag behavior, rows, commands, and page state.
- Orders and order creation.
- Checkout authorization flow.
- Stock and inventory ledger behavior.
- Payment, logistics, coupons, refunds, and recommendations.
- Product publish eligibility and visibility rules.
- SKU-level wishlist semantics.
- Public product-list APIs leaking customer favorite state.

## PRD Constraint Evidence

- Favorites remain product-level: tests assert favorite payloads do not accept
  `skuId`, and product detail/list UI toggle paths pass only `productId`.
- Customer-private scoping is server-side: CloudFunction tests cover customer
  scoping and private `customer_favorites` behavior.
- Phone authorization is not a favorite/unfavorite precondition: UI and facade
  tests keep phone authorization isolated to checkout/order flows.
- Invalidation keys:
  - Product detail favorite/unfavorite validates
    `customer-favorites:{customerId}:v1`.
  - Product detail favorite/unfavorite validates
    `customer-product-detail:{productId}:v1`.
  - Favorites page remove validates `customer-favorites:{customerId}:v1`.
  - Product list toggle checks the favorites invalidation key and does not
    operate on product-detail cache from the page layer.
- Favorites do not affect shopping bag, orders, checkout, stock, or inventory
  ledger: product list/detail tests assert no coupling to checkout, stock, or
  shopping-bag commands, and project checks passed.

## Checks Run And Results

- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/cloudbase-mall/customer-favorites.test.ts src/pages/customer/favorites/index.test.ts src/pages/customer/product-detail/index.test.ts src/pages/customer/product-list/index.test.ts`
  - 7 files passed.
  - 101 tests passed.
- GREEN: `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-detail/index.test.ts src/pages/customer/product-list/index.test.ts`
  - 2 files passed.
  - 18 tests passed.
  - Added request-dedupe coverage for repeated favorite toggle taps while a
    product-detail or product-list write is pending.
- GREEN: `pnpm.cmd run verify`
  - lint passed.
  - boundary-check passed.
  - unit test suite passed: 65 files / 372 tests.
  - coverage passed.
  - type-check passed.
  - backend tests/build passed: 12 backend files / 60 tests.
  - prod/all audits passed with no known vulnerabilities.
- GREEN: `pnpm.cmd run verify:full`
  - reran `verify` successfully.
  - `build:mp-weixin` completed.
  - `smoke:mp-weixin` passed: mp-weixin build artifacts and page routes are
    present.

## Testing Decisions Coverage

- CloudFunction core tests cover customer scoping, empty state, duplicate
  favorite idempotency, and removal behavior.
- CloudBase client tests cover snapshot and favorite/unfavorite/remove action
  mapping.
- Facade tests cover favorite labels/messages, unavailable product handling,
  empty messages, failure state, and write-after-refresh command results.
- Page-level tests cover local display behavior, failure preservation, retry
  behavior, loading/empty/failure states, and write-after-refresh surfaces.
- Page-level request dedupe is covered by product detail and product list tests:
  repeated favorite toggle taps while a write is pending are guarded before the
  Module C favorite/unfavorite command is called, preserving previous context
  and avoiding duplicate writes for the same active UI operation.
- Product listing/detail tests cover that favorites do not change publish
  eligibility, stock, checkout behavior, or shopping-bag behavior.

## Remote CloudBase Deployment And Smoke - 2026-05-30

- Deployment target: `cloud1-d7gifjyzl7721b383` / `mallApi`.
- Deployment command surface: `manageFunctions(action="updateFunctionCode",
  functionName="mallApi", functionRootPath="D:\\CodeX\\VX close systhem\\cloudfunctions")`.
- Deployment result: GREEN, RequestId `30f73f99-6469-46b2-a981-e207a7dc45ec`.
- Function detail after deploy: `ModTime` `2026-05-30 10:27:34`,
  `DeployMode` `code`, `Status` `Active`, `AvailableStatus` `Available`.
- `listContracts` smoke after deploy: GREEN, RequestId
  `bd3381d2-7193-473e-9d74-0a65c09ea0b6`, 49 actions returned.
- Favorite actions confirmed present:
  - `getCustomerFavoriteProductsSnapshot`
  - `favoriteCustomerProduct`
  - `unfavoriteCustomerProduct`
  - `removeCustomerFavoriteProduct`
- Direct snapshot action smoke: GREEN for contract routing, RequestId
  `13d2df4d-fec9-4ed6-b146-5d6e94a83b1e`.
  - Result was not `NOT_FOUND`.
  - Management-side direct invoke returned `UNAUTHORIZED: Verified WeChat
    identity is required`, which is expected because this smoke does not run
    inside a verified WeChat mini-program user context and
    `MALL_API_ALLOW_TEST_IDENTITY` is disabled in the remote function.

## 2026-05-30 Repair Checks

- RED before fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/index/index.test.ts src/pages/customer/product-list/index.test.ts`
  - 2 failed tests confirmed the bottom Favorites entries did not reference
    `routes.customerFavorites`.
- GREEN after fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/index/index.test.ts src/pages/customer/product-list/index.test.ts`
  - 2 files passed.
  - 11 tests passed.
- GREEN targeted Favorites checks:
  `pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/cloudbase-mall/customer-favorites.test.ts src/pages/customer/favorites/index.test.ts src/pages/customer/product-detail/index.test.ts src/pages/customer/product-list/index.test.ts src/pages/index/index.test.ts`
  - 8 files passed.
  - 105 tests passed.
- GREEN: `pnpm.cmd run verify`
  - lint, boundary-check, unit tests, coverage, type-check, backend
    tests/build, and prod/all audits passed.
  - Unit suite: 66 files / 378 tests.
  - Backend suite: 12 files / 60 tests.
- GREEN: `pnpm.cmd run verify:full`
  - reran `verify` successfully.
  - `build:mp-weixin` completed.
  - `smoke:mp-weixin` passed: mp-weixin build artifacts and page routes are
    present.

## 2026-05-30 Follow-up: Customer Product Unauthorized Message

- Customer product list and detail pages now treat favorite snapshot preload
  failure as non-blocking background state. A remote `UNAUTHORIZED: Verified
  WeChat identity is required` response from `getCustomerFavoriteProductsSnapshot`
  no longer renders the bottom red favorite feedback banner on browsing pages.
- Explicit favorite/unfavorite write feedback remains unchanged.
- RED before fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts`
  - 2 failed tests confirmed preload failure still wrote
    `favoriteProductsView.value.failureMessage` into page feedback.
- GREEN after fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/product-list/index.test.ts src/pages/customer/product-detail/index.test.ts`
  - 2 files passed.
  - 21 tests passed.
- GREEN: `pnpm.cmd run verify:full`
  - lint, boundary-check, unit tests, coverage, type-check, backend
    tests/build, prod/all audits, `build:mp-weixin`, and `smoke:mp-weixin`
    passed.
  - Unit suite: 66 files / 379 tests.
  - Backend suite: 12 files / 60 tests.

## 2026-05-30 Follow-up: Customer Bottom Navigation Consistency

- Scope: navigation consistency repair only. This did not add a customer mine
  route, implement a customer center, or change Favorites / Shopping Bag
  business semantics.
- Added shared customer bottom-nav route config:
  `src/pages/customer/customer-bottom-nav.ts`.
- Customer bottom-nav matrix after repair:
  - Home page:
    - Home: current page scroll/top handling.
    - Catalog: `customerBottomNavRoutes.catalog`.
    - Shopping bag: `customerBottomNavRoutes.shoppingBag`.
    - Favorites: `customerBottomNavRoutes.favorites`.
    - Mine: `CUSTOMER_MINE_PLACEHOLDER`.
  - Product list page:
    - Home: `customerBottomNavRoutes.home`.
    - Catalog: current page active state.
    - Shopping bag: `customerBottomNavRoutes.shoppingBag`.
    - Favorites: `customerBottomNavRoutes.favorites`.
    - Mine: `CUSTOMER_MINE_PLACEHOLDER`.
  - Favorites page:
    - Home: `customerBottomNavRoutes.home`.
    - Catalog: `customerBottomNavRoutes.catalog`.
    - Shopping bag: `customerBottomNavRoutes.shoppingBag`.
    - Favorites: current page active state.
    - Mine: `CUSTOMER_MINE_PLACEHOLDER`.
  - Shopping bag page:
    - Home: `customerBottomNavRoutes.home`.
    - Catalog: `customerBottomNavRoutes.catalog`.
    - Shopping bag: current page active state.
    - Favorites: `customerBottomNavRoutes.favorites`.
    - Mine: `CUSTOMER_MINE_PLACEHOLDER`.
- The old misleading bottom-nav placeholder copy for existing routes was
  removed from customer-facing pages:
  - `购物袋为视觉入口，真实购物袋能力需单独 PRD`
  - `收藏能力需单独 PRD 接入`
  - `收藏为视觉入口，真实收藏能力需单独 PRD`
- Real bottom-nav jumps remain guarded by pending/busy page state before
  calling `redirectTo`.
- RED before fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/customer-bottom-nav.test.ts src/pages/index/index.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/favorites/index.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts`
  - Failed because the shared bottom-nav config did not exist, home shopping
    bag was still a placeholder, and product-list tests still expected direct
    route constants instead of shared config.
- GREEN after fix:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/customer-bottom-nav.test.ts src/pages/index/index.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/favorites/index.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts`
  - 5 files passed.
  - 28 tests passed.
- Final targeted nav regression:
  `pnpm.cmd exec vitest run --config vitest.config.ts src/pages/customer/customer-bottom-nav.test.ts src/pages/index/index.test.ts src/pages/customer/product-list/index.test.ts src/pages/customer/favorites/index.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/app/navigation.test.ts`
  - 6 files passed.
  - 37 tests passed.
- Full verification:
  `pnpm.cmd run verify`
  - Passed lint, boundary-check, unit tests, coverage, type-check,
    backend tests/build, prod audit, and full audit.
  - Unit tests: 67 files passed, 387 tests passed.
  - Backend tests: 12 files passed, 60 tests passed.
  `pnpm.cmd run verify:full`
  - Passed full verify, `build:mp-weixin`, and `smoke:mp-weixin`.
  - mp-weixin build artifacts and page routes are present.

## Remaining Harness / Product Gaps

- Manual acceptance is still open. Automated checks and mp-weixin smoke are not
  a substitute for human acceptance in WeChat DevTools or on a device.
- Slow-network and image-failure behavior are represented by page states/tests
  and the acceptance checklist below, but still need human validation.
- Homepage and customer product-list bottom-nav Favorites entries are now wired
  to the existing `routes.customerFavorites` route. Manual WeChat DevTools or
  device validation is still open.

## Manual Acceptance Checklist

Use this as the human acceptance evidence template. Record date, device or
DevTools version, tester, and result for each item.

| Scenario | Steps | Expected Result | Evidence | Status |
| --- | --- | --- | --- | --- |
| First entry | Open customer product list, favorite a product, open favorites page. | Product appears once in favorites, marked as saved, with list-card image/name/price. | Screenshot / notes | OPEN |
| Return entry | Leave favorites page and return later. | Saved favorites reload from customer-scoped snapshot; previous context is understandable while refreshing. | Screenshot / notes | OPEN |
| Slow network | Simulate slow network and open favorites page. | Loading state is visible; page does not show a blank or broken surface. | Screenshot / notes | OPEN |
| Empty state | Use a customer with no favorites. | Favorites page shows clear empty state and retry/return affordance where applicable. | Screenshot / notes | OPEN |
| Failure | Force snapshot failure or block network. | Existing favorite cards remain visible when previous data exists; failure message and retry entry are visible. | Screenshot / notes | OPEN |
| Write-after-refresh | Favorite/unfavorite from detail/list, then revisit favorites page and detail/list. | Favorite state reflects the latest write after invalidation/refresh; no duplicate favorites appear. | Screenshot / notes | OPEN |
| Image-failure behavior | Use a favorite product with missing/broken image URL. | Page shows fallback visual and keeps product card usable; unavailable/deleted/unpublished state remains clear. | Screenshot / notes | OPEN |

## Manual Acceptance Status

Manual acceptance is still open.

Automated checks, CloudBase contract smoke, and mp-weixin route smoke passed on
2026-05-30, but no WeChat DevTools or physical-device human acceptance was
performed in this repair slice.

## Final Human Review Readiness

The Favorites PRD is ready for final human review from an automated verification
standpoint. Human acceptance should be completed before marking the product
experience fully accepted.
