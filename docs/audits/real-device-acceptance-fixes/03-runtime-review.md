# Real Device Acceptance Failure - Phase 3 Runtime Review

Captured: 2026-06-01 17:23:34 +08:00

Agent phase: `agents.prd_reviewer.toml`

Status: `PASS` for the runtime module fix only.

Overall real-device acceptance status remains: `FAIL`.

## Reviewed Scope

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
- `docs/audits/real-device-acceptance-fixes/`
- `docs/plans/real-device-acceptance-fixes/`

## Reviewer Result

The second read-only reviewer returned `PASS` after isolating pre-existing dirty work from the earlier customer-runtime-stabilization phase.

Reviewer evidence:

- `customer-runtime-request-log.ts` is data-only and no longer uses `import.meta`, `node:url`, `pathToFileURL`, or runtime URL helpers.
- `cloudbase-function-client.ts` sanitizes mini-program module loader failures before page-facing feature views can render the raw text.
- Shopping bag, favorites, and mine ViewModel failure paths remain behind `formatCloudBaseFailureMessage`.
- Built `dist/build/mp-weixin` has no `services/performance/url`, `require("url")`, `require('url')`, `node:url`, or `pathToFileURL`.
- `mp:runtime-audit` is wired into `smoke:mp-weixin`, and `verify:full` reaches it through `e2e:smoke`.
- Runtime audit tests cover forbidden Node built-ins and missing local require targets.

## Verification

Parent-run verification:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/cloudbase-function-client.test.ts src/features/customer-shopping-bag/customer-shopping-bag.test.ts src/features/customer-favorites/customer-favorites.test.ts src/features/customer-mine/customer-mine.test.ts
```

Result:

- passed, 4 files, 25 tests.

```powershell
pnpm.cmd run mp:runtime-audit:test
```

Result:

- passed, 3 tests.

```powershell
pnpm.cmd run e2e:smoke
```

Result:

- passed.
- Rebuilt `dist/build/mp-weixin`.
- `mp:runtime-audit` passed after build.

```powershell
pnpm.cmd run verify:full
```

Result:

- passed.
- Root Vitest: 75 files, 459 tests.
- Backend Vitest: 12 files, 61 tests.
- `audit:prod`: no known vulnerabilities found.
- `audit:all`: no known vulnerabilities found.
- `e2e:smoke`: passed.
- `mp:runtime-audit`: passed.

Reviewer re-run verification:

- `pnpm.cmd run mp:runtime-audit`: passed.
- `pnpm.cmd run mp:runtime-audit:test`: passed, 3 tests.
- Focused Vitest: passed, 5 files, 27 tests.
- `pnpm.cmd run e2e:smoke`: passed and rebuilt `mp-weixin`; runtime audit passed after build.

## Scope Isolation

The following dirty work was identified as pre-existing customer-runtime-stabilization work and was not treated as part of this Phase 3 runtime-module review:

- `cloudbase:schema:check`
- `cloudbase:schema:apply:staging`
- `verify:staging`
- `scripts/cloudbase-schema-check.mjs`
- `scripts/cloudbase-schema-apply-staging.mjs`
- `scripts/verify-staging.mjs`

Those scripts are documented under `docs/plans/customer-runtime-stabilization/` and `docs/audits/customer-runtime-stabilization/`, with file timestamps before this runtime-module fix.

## Residual Risk

This phase fixes only the P0 runtime module loader crash and raw module-loader error leak.

The real-device acceptance baseline remains `FAIL` until the remaining failures are fixed and manual WeChat Developer Tools / real-device acceptance passes.
