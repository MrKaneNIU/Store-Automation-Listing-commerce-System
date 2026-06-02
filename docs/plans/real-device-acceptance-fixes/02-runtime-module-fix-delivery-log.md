# Real Device Acceptance Failure - Runtime Module Fix Delivery Log

Captured: 2026-06-01 16:56:00 +08:00

Agent phase: `agents.prd_implementer.toml`

## Scope

This phase fixes the real-device runtime error:

```text
module 'services/performance/url.js' is not defined, require args is 'url'
```

In scope:

- Remove the root `require("url")` source from the mp-weixin bundle.
- Add an mp runtime audit that catches unsupported Node built-ins and missing local require targets.
- Keep customer page errors sanitized by preserving existing ViewModel/facade error handling.

Out of scope:

- Product image display.
- Product detail order creation.
- Admin workbench follow-up defects.
- Payment, logistics, refunds, coupons, customer service, or OCR feature expansion.

## Root Cause Fixed

`src/services/performance/customer-runtime-request-log.ts` previously read `import.meta` to decide whether to write a default development console log.

In the mp-weixin build, that `import.meta` access produced:

```js
require("url").pathToFileURL(__filename).href
```

The mini-program runtime does not provide Node's built-in `url` module, so the page crashed before it could render a recoverable state.

## Implementation

Changed files:

- `src/services/performance/customer-runtime-request-log.ts`
- `src/services/performance/customer-runtime-request-log.test.ts`
- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/cloudbase-function-client.test.ts`
- `src/features/customer-shopping-bag/customer-shopping-bag.test.ts`
- `src/features/customer-favorites/customer-favorites.test.ts`
- `src/features/customer-mine/customer-mine.test.ts`
- `scripts/mp-runtime-audit.mjs`
- `scripts/mp-runtime-audit.test.mjs`
- `package.json`

Behavior:

- `logCustomerRuntimeRequest` now writes only to an explicitly injected logger.
- Without a logger, it returns the structured log entry and performs no runtime environment probing.
- It no longer references `import.meta`, `process`, `document`, `new URL`, `URLSearchParams`, or Node built-ins.
- `formatCloudBaseFailureMessage` now sanitizes mini-program module-loader failures such as `module 'services/performance/url.js' is not defined, require args is 'url'`.
- Shopping bag, favorites, and mine ViewModel tests now assert that the raw module-loader text is not rendered to users.

New script:

```powershell
pnpm.cmd run mp:runtime-audit
```

The script scans `dist/build/mp-weixin/**/*.js` and fails on:

- `require("url")`
- `require('url')`
- `require("node:url")`
- `require('node:url')`
- direct runtime requires for `fs`, `path`, `crypto`, `stream`
- `pathToFileURL`
- `services/performance/url.js`
- missing local static `require(...)` targets

Integration:

- `smoke:mp-weixin` now runs `node scripts/e2e-smoke.mjs && pnpm run mp:runtime-audit`.
- `verify:full` already runs `e2e:smoke`, so it now includes the runtime audit after building mp-weixin.

## Verification

Script tests:

```powershell
pnpm.cmd run mp:runtime-audit:test
```

Result:

- passed, 3 tests.

Focused runtime/page-state tests:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/performance/customer-runtime-request-log.test.ts src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts src/features/customer-mine/customer-mine-page-state.test.ts
```

Result:

- passed, 4 files, 20 tests.

Build:

```powershell
pnpm.cmd run build:mp-weixin
```

Result:

- passed.

Runtime audit:

```powershell
pnpm.cmd run mp:runtime-audit
```

Result:

- passed.

Reviewer blocker follow-up:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/cloudbase-function-client.test.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/customer-mine/customer-mine.test.ts
```

Result:

- passed, 4 files, 25 tests.

Full verification:

```powershell
pnpm.cmd run verify:full
```

Result:

- passed.
- Root Vitest: 75 files, 459 tests.
- Backend Vitest: 12 files, 61 tests.
- `audit:prod` and `audit:all`: no known vulnerabilities found.
- `e2e:smoke`: passed.
- `mp:runtime-audit`: passed.

Built artifact inspection:

- `dist/build/mp-weixin/services/performance/customer-runtime-request-log.js` now contains no `require("url")`, no `pathToFileURL`, and no `services/performance/url.js` reference.
- Search over `dist/build/mp-weixin/**/*.js` found no forbidden runtime `url` patterns.

Build artifact path:

```text
dist/build/mp-weixin
```

Observed LastWriteTime after rebuild:

```text
2026-06-01 16:54:17 +08:00
```

## Remaining Work

Proceed to Phase 3 reviewer re-audit for the runtime module fix.

This phase does not resolve the image display, order creation, or admin workbench failures listed in the real-device baseline.
