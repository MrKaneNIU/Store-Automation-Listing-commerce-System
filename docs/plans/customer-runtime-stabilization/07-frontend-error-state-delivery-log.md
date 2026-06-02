# Customer Runtime Stabilization - Frontend Error State Delivery Log

Captured: 2026-06-01 13:31:00 +08:00

## Scope

This log covers Package C from `docs/prd/debug-prd.md`: customer-facing error display hardening for shopping bag, favorites, and mine.

In scope:

- Convert backend and CloudBase transport failures into stable customer-facing messages.
- Prevent raw CloudBase/runtime strings from reaching page failure text.
- Preserve page-facing facade and ViewModel boundaries.

Out of scope:

- Visual redesign.
- Routing outside customer shopping bag, favorites, and mine.
- Any direct page access to repositories, collections, mock DB, or `wx.cloud`.

## Implementation

Changed files:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/cloudbase-function-client.test.ts`
- `src/services/cloudbase/runtime-mall-api-client.ts`
- `src/services/cloudbase/runtime-mall-api-client.test.ts`
- `src/features/customer-shopping-bag/customer-shopping-bag.ts`
- `src/features/customer-shopping-bag/customer-shopping-bag.test.ts`
- `src/features/customer-favorites/customer-favorites.ts`
- `src/features/customer-favorites/customer-favorites.test.ts`
- `src/features/customer-mine/customer-mine.ts`
- `src/features/customer-mine/customer-mine.test.ts`
- `src/pages/customer/favorites/index.vue`
- `src/pages/customer/favorites/index.test.ts`

Key behavior:

- `UNAUTHORIZED` maps to login/retry guidance.
- `INFRA_SCHEMA_MISSING` and raw CloudBase missing-resource patterns map to service-initialization guidance.
- Unknown internal failures map to a generic sync retry message.
- Page-facing ViewModels keep failure text sanitized.
- Favorites page now uses a page-state module and facade call rather than direct repository or CloudBase access.

## Evidence

Focused tests:

- `src/services/cloudbase/cloudbase-function-client.test.ts`
- `src/services/cloudbase/runtime-mall-api-client.test.ts`
- `src/features/customer-shopping-bag/customer-shopping-bag.test.ts`
- `src/features/customer-favorites/customer-favorites.test.ts`
- `src/features/customer-mine/customer-mine.test.ts`
- `src/pages/customer/favorites/index.test.ts`

Full gate:

- Command: `pnpm.cmd run verify:full`
- Result: passed.

Staging raw leak check:

- Command: `pnpm.cmd run verify:staging`
- Result: customer-private action transport returned `UNAUTHORIZED` and `rawErrorLeak: false` for all probed customer-private actions.

## Notes

The final customer runtime PASS still requires WeChat DevTools and real-device manual acceptance because these page states depend on the real mini-program identity context.
