# Real Device Acceptance Failure - Runtime Module Diagnosis

Captured: 2026-06-01 14:12:00 +08:00

Agent phase: `agents.prd_debugger.toml`

## Symptom

User-reported real-device / WeChat Developer Tools runtime error:

```text
module 'services/performance/url.js' is not defined, require args is 'url'
```

Affected pages:

- Shopping bag
- Favorites
- Mine

## Root Cause

The mini-program runtime bundle contains an unsupported Node built-in module require:

```js
require("url").pathToFileURL(__filename).href
```

This is produced from `src/services/performance/customer-runtime-request-log.ts`.

The source code reads `import.meta` inside `isDevelopmentRuntime()`. During the mp-weixin CommonJS build, uni/Vite lowers that `import.meta` reference into a runtime helper using Node's built-in `url` module.

In the WeChat mini-program runtime, bare `require("url")` is resolved as a local module near `services/performance/`, causing:

```text
module 'services/performance/url.js' is not defined, require args is 'url'
```

There is no expected local module at:

```text
dist/build/mp-weixin/services/performance/url.js
```

## Root Cause Class

Class A/E from the user-provided checklist:

- A: source code uses a construct that causes Node built-in `url` to enter the mini-program runtime.
- E: the performance logging module is imported by customer runtime pages and depends on runtime metadata unavailable in mp-weixin.

It is not:

- a missing CloudBase action;
- a missing CloudBase collection;
- a `path-to-regexp` runtime dependency;
- a page route issue;
- a deliberate local `services/performance/url.ts` source file omission.

## Evidence Files

Source trigger:

- `src/services/performance/customer-runtime-request-log.ts`

Relevant source line:

```ts
const viteMeta = import.meta as ImportMeta & { env?: { DEV?: boolean; MODE?: string } }
```

Built artifact:

- `dist/build/mp-weixin/services/performance/customer-runtime-request-log.js`

Observed built code contains:

```js
require("url").pathToFileURL(__filename).href
```

No built local shim exists:

```text
dist/build/mp-weixin/services/performance/url.js
```

## Import / Require Chain

Shopping bag:

```text
src/pages/customer/shopping-bag/index.vue
-> src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts
-> src/services/performance/customer-runtime-request-log.ts
-> dist/build/mp-weixin/services/performance/customer-runtime-request-log.js
-> require("url")
-> runtime error
```

Favorites:

```text
src/pages/customer/favorites/index.vue
-> src/pages/customer/favorites/useCustomerFavoritesPageState.ts
-> src/services/performance/customer-runtime-request-log.ts
-> dist/build/mp-weixin/services/performance/customer-runtime-request-log.js
-> require("url")
-> runtime error
```

Mine:

```text
src/pages/customer/mine/index.vue
-> src/pages/customer/mine/useCustomerMinePageState.ts
-> src/features/customer-mine/customer-mine-page-state.ts
-> src/services/performance/customer-runtime-request-log.ts
-> dist/build/mp-weixin/services/performance/customer-runtime-request-log.js
-> require("url")
-> runtime error
```

## Search Results

Checked source and build output for:

- `services/performance/url`
- `performance/url`
- `from 'url'`
- `require('url')`
- `require("url")`
- `node:url`
- `new URL`
- `URLSearchParams`
- `import.meta.url`
- `path-to-regexp`

Findings:

- Runtime `require("url")` appears in the mp-weixin build artifact for `customer-runtime-request-log.js`.
- `path-to-regexp` is not part of this runtime chain.
- `URLSearchParams` appears in `cloudfunctions/mallApi/index.js`, which is Node cloud-function code, not mini-program runtime code.
- Other Node-only imports appear in scripts/tests and are not bundled into mp-weixin runtime pages.

## Why `verify:full` Missed It

`verify:full` runs `build:mp-weixin` and `smoke:mp-weixin`.

Current `smoke:mp-weixin` checks that:

- the build directory exists;
- expected page route files exist;
- page route metadata is present.

It does not:

- execute the WeChat mini-program runtime module loader;
- scan built JS for unsupported Node built-ins;
- verify local `require(...)` targets exist;
- detect `require("url")` in the build artifact.

The smoke script therefore passed even though the built artifact would fail in WeChat runtime.

## Fix Plan

Minimum fix:

- Remove `import.meta` and `process` runtime probing from `src/services/performance/customer-runtime-request-log.ts`.
- Make the default no-logger behavior mini-program safe. The performance logger should only write to an explicitly injected logger, or use a safe no-op fallback.
- Do not add a fake `services/performance/url.js` shim; that would hide the bundling problem.

Required regression gate:

- Add `pnpm.cmd run mp:runtime-audit`.
- Scan `dist/build/mp-weixin/**/*.js`.
- Fail on unsupported Node built-ins in built runtime output:
  - `require("url")`
  - `require('url')`
  - `require("node:url")`
  - `require('node:url')`
  - `pathToFileURL`
  - optionally `fs`, `path`, `crypto`, `stream` as direct runtime requires
- Fail on local relative/static `require(...)` targets that do not resolve to existing `.js` files.
- Add the audit into `smoke:mp-weixin` or `verify:full` so future builds cannot pass with this class of runtime module failure.

Required tests:

- `customer-runtime-request-log` should return entries without `logger` and without relying on runtime env globals.
- `mp:runtime-audit` should fail on `require("url")`.
- `mp:runtime-audit` should fail on a missing local `require(...)` target.
- Existing shopping bag, favorites, and mine state tests continue to prove page states map runtime errors to sanitized recoverable text.

## Next Phase

Proceed to Phase 2 `agents.prd_implementer.toml`: implement the runtime-safe logger and add the mp runtime audit script.
