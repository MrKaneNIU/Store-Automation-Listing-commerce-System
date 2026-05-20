# 2026-05-19 Risk Group A Production Configuration Gate Log

## Repository Impact Map

Changed in this risk group:

```text
scripts/check-production-config.mjs
scripts/check-production-config.test.mjs
package.json
docs/operations/production-config-runbook.md
docs/operations/production-config-snapshot.example.json
docs/plans/2026-05-19-risk-group-a-production-config-gate-log.md
```

Explicitly out of scope:

```text
src/pages/
src/features/
src/services/
src/domain/
backend/
cloudfunctions/ business logic
pnpm-lock.yaml
```

Business contracts preserved:

- No production secret was added to the repository.
- Local environment variables remain local debugging inputs only.
- This gate does not change OCR, product, SKU, order, inventory, auth, or page
  behavior.
- The checker reports variable names and statuses only; secret values are not
  printed.

Planned verification:

```powershell
pnpm.cmd run cloudbase:prod-config:test
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.example.json
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.example.json --json
pnpm.cmd run verify
```

## Execution Plan

1. Add production configuration gate tests first.
   - Acceptance: tests fail before the checker exists.
2. Implement a dependency-free Node checker.
   - Acceptance: missing required variables, environment mismatch, disabled
     `urlCheck`, missing domains, and missing storage/TLS evidence are blockers.
3. Add package scripts.
   - Acceptance: the checker and tests can be run through `pnpm.cmd`.
4. Add runbook and sanitized snapshot example.
   - Acceptance: operators can gather evidence without recording secret values.
5. Run verification and record gaps.
   - Acceptance: command results are recorded separately from future manual
     production evidence.

## Completed Implementation

- Added a production configuration checker for sanitized CloudBase production
  snapshots.
- Added blocker checks for target env consistency, `mallApi` required variable
  presence, `urlCheck`, legal domain groups, storage readiness, and HTTPS/TLS
  evidence.
- Added human-readable and JSON output modes.
- Added tests proving blockers are reported by variable name only and secret
  values are not rendered.
- Added `package.json` commands:
  - `cloudbase:prod-config:test`
  - `cloudbase:prod-config:check`
- Added a runbook that makes CloudBase Console/platform secrets the production
  secret boundary.
- Added a sanitized example snapshot with placeholder domains and variable
  names only.
- Added pnpm argument separator compatibility so `pnpm.cmd run
  cloudbase:prod-config:check -- --snapshot ...` works on Windows.

## Verification

RED evidence:

```powershell
node --test scripts/check-production-config.test.mjs
```

Result: failed as expected before `scripts/check-production-config.mjs` existed.

Final targeted verification:

```powershell
pnpm.cmd run cloudbase:prod-config:test
```

Result: passed. Node test runner reported 4 tests passing.

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.example.json
```

Result: passed. Human-readable output reported `Production config gate: PASS`
with 0 blockers.

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.example.json --json
```

Result: passed. JSON output reported `"ok": true` with an empty `blockers`
array.

Full repository verification:

```powershell
pnpm.cmd run verify
```

Result: failed at `pnpm audit --prod --audit-level moderate` after the earlier
steps passed.

Passed inside `verify` before the audit failure:

- `lint`
- `boundary-check`
- frontend/cloudfunction tests: 30 files / 131 tests
- coverage
- `type-check`
- backend tests: 12 files / 46 tests
- backend build

Failure:

```text
@dcloudio/uni-mp-weixin > ws@8.18.0
GHSA-58qx-3vcg-4xpx
Severity: moderate
Patched versions: >=8.20.1
```

Follow-up evidence:

```powershell
pnpm.cmd why ws
```

Result: production path includes `@dcloudio/uni-mp-weixin -> ws@8.18.0`.
Updating this requires a dependency override or package/lockfile change, which
is outside Risk Group A without separate approval because the PRD forbids
touching `pnpm-lock.yaml` unless a new dependency or dependency decision is
separately confirmed.

## Gap Closure Follow-up

User asked to handle the remaining gaps in the same risk group.

Completed:

- Added a narrow pnpm override for `ws` to `^8.20.1`.
- Refreshed `pnpm-lock.yaml`.
- Ran `pnpm.cmd install` so local `node_modules` matched the lockfile.
- Confirmed the local dependency tree now resolves a single `ws@8.20.1`.

Verification:

```powershell
pnpm.cmd why ws
```

Result: one version only, `ws@8.20.1`, used by `@dcloudio/uni-mp-weixin`,
`@dcloudio/uni-automator`, and `jsdom`.

```powershell
pnpm.cmd audit --prod --audit-level moderate
pnpm.cmd audit --audit-level low
```

Result: both passed with `No known vulnerabilities found`.

```powershell
pnpm.cmd run verify
```

Result: passed.

Included:

- lint
- boundary-check
- frontend/cloudfunction tests: 30 files / 131 tests
- coverage
- type-check
- backend tests: 12 files / 46 tests
- backend build
- prod/all audit: no known vulnerabilities

```powershell
pnpm.cmd run verify:full
```

Result: passed.

Included the full `verify` chain plus:

- `build:mp-weixin`
- `scripts/e2e-smoke.mjs`

Smoke output:

```text
E2E smoke passed: mp-weixin build artifacts and page routes are present.
```

Production platform evidence check:

```powershell
where.exe tcb
Get-Command tcb -ErrorAction SilentlyContinue
npx.cmd mcporter list
```

Result:

- `tcb` CLI is not installed or not on PATH in this environment.
- mcporter listed Context7, Exa, GitHub, Memory, Playwright, and Sequential
  Thinking, but no CloudBase MCP server.
- Therefore this local session cannot directly query CloudBase Console or
  WeChat platform production configuration.
- The remaining production evidence must be gathered by an operator from the
  CloudBase and WeChat platform consoles, saved as a sanitized snapshot, and
  checked with `cloudbase:prod-config:check`.

CloudBase MCP follow-up:

- Read the official getting-started guide:
  `https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/getting-started`.
- Installed the official MCP package globally:

  ```powershell
  npm.cmd install -g @cloudbase/cloudbase-mcp@latest
  ```

- Updated `C:\Users\65188\.codex\config.toml` to use the official Windows
  Codex form:

  ```toml
  [mcp_servers.cloudbase]
  command = "cmd"
  args = ["/c", "cloudbase-mcp"]
  env = { INTEGRATION_IDE = "CodeX" }
  startup_timeout_sec = 30
  ```

- Verified discovery:

  ```powershell
  npx.cmd mcporter list cloudbase --all-parameters --timeout 30000
  ```

  Result: passed. CloudBase MCP exposed 36 tools in 444ms through
  `STDIO cmd /c cloudbase-mcp`.

## Remaining Gaps

- This risk group provides the gate and runbook. It does not prove the real
  production CloudBase environment is configured.
- A real sanitized production snapshot must still be gathered from CloudBase and
  WeChat platform read-only views.
- HTTPS/TLS evidence for storage must still be recorded from a real CloudBase
  storage URL.
- Automated repo verification is no longer blocked; `verify` and `verify:full`
  pass after the `ws` override.
- CloudBase MCP is now configured and discoverable. Real production readiness
  evidence is still not complete until the CloudBase MCP session is authenticated
  and bound to the target environment, then a sanitized CloudBase/WeChat platform
  snapshot and real storage HTTPS/TLS evidence are recorded.

## CloudBase MCP Read-only Evidence Run

Date: 2026-05-19

Repository Impact Map for this follow-up:

```text
Changed:
docs/operations/production-config-snapshot.current.json
docs/operations/production-config-runbook.md
docs/plans/2026-05-19-risk-group-a-production-config-gate-log.md

Explicitly out of scope:
src/pages/
src/features/
src/services/
src/domain/
backend/
cloudfunctions/ business logic
CloudBase resource writes/deploy/update/delete
production secret values
```

Execution plan:

1. Confirm CloudBase MCP auth and bound environment.
2. Query CloudBase environment, function, domains, permissions, and storage
   evidence with read-only MCP calls.
3. Create a sanitized current snapshot without secret values.
4. Run the production config gate against the current snapshot.
5. Record blockers separately from automated repository verification.

Read-only evidence:

```powershell
npx.cmd mcporter call cloudbase.auth action=status --timeout 30000 --output json
```

Result:

- `auth_status`: `READY`
- `current_env_id`: `cloud1-d7gifjyzl7721b383`
- `env_status`: `READY`

```powershell
npx.cmd mcporter call cloudbase.envQuery action=info envId=cloud1-d7gifjyzl7721b383 --timeout 30000 --output json
```

Result:

- Environment status: `NORMAL`
- Region: `ap-shanghai`
- Database status: `RUNNING`
- Storage status: `NORMAL`
- Storage bucket: `636c-cloud1-d7gifjyzl7721b383-1429982088`
- Storage CDN domain:
  `636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la`

```powershell
npx.cmd mcporter call cloudbase.queryFunctions action=listFunctions --timeout 30000 --output json
npx.cmd mcporter call cloudbase.queryFunctions action=getFunctionDetail functionName=mallApi --timeout 30000 --output json
```

Result:

- `mallApi` exists.
- `mallApi` status: `Active`
- `mallApi` available status: `Available`
- `mallApi` runtime: `Nodejs18.15`
- `mallApi` namespace: `cloud1-d7gifjyzl7721b383`
- `mallApi` environment variable list from CloudBase:
  `Environment.Variables: []`

This is a real production blocker. The checker must fail until required
production variable names are configured in the CloudBase function environment.
No variable values were recorded.

```powershell
npx.cmd mcporter call cloudbase.envQuery action=domains envId=cloud1-d7gifjyzl7721b383 --timeout 30000 --output json
```

Result:

- Enabled user domain:
  `cloud1-d7gifjyzl7721b383-1429982088.tcloudbaseapp.com`
- Enabled CloudBase system domains were returned, including
  `tcb.cloud.tencent.com` and related CloudBase console domains.

```powershell
npx.cmd mcporter call cloudbase.queryPermissions action=listResourcePermissions resourceType=function resourceId=mallApi --timeout 30000 --output json
```

Result:

- Function invocation permission is `CUSTOM`.
- Rule summary: authenticated non-anonymous users can invoke functions.

HTTPS/TLS evidence:

```powershell
HEAD https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/
```

Result:

- HTTPS connection succeeded.
- HTTP response: `403 Forbidden`.
- Interpretation: TLS connectivity is available and the storage endpoint is
  protected; this is acceptable storage HTTPS/TLS evidence for the config gate.

Sanitized snapshot:

```text
docs/operations/production-config-snapshot.current.json
```

The snapshot records resource names, statuses, domains, and variable names only.
It contains no secret values.

Gate result against current CloudBase evidence:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.current.json
```

Result: failed as expected for the real current CloudBase state.

Blockers:

- `mallApi` is missing required production variable `WECHAT_APPID`.
- `mallApi` is missing required production variable `WECHAT_APPSECRET`.
- `mallApi` is missing required production variable `OCR_PROVIDER`.
- `mallApi` is missing required production variable `OCR_PROVIDER_ENDPOINT`.
- `mallApi` is missing required production variable `OCR_PROVIDER_API_KEY`.
- `WECHAT_APPID` cannot be confirmed against manifest appid because the
  variable is not exported by the CloudBase function environment.

Passing checks in the same run:

- `cloudbaserc.json` envId matches `cloud1-d7gifjyzl7721b383`.
- `mallApi` envId matches `cloud1-d7gifjyzl7721b383`.
- `src/manifest.json` mp-weixin `urlCheck` is enabled.
- Request, upload, and download domain groups are present in the sanitized
  snapshot.
- CloudBase storage bucket readiness is verified.
- CloudBase storage HTTPS/TLS connectivity is verified.

Machine-readable run:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.current.json --json
```

Result: failed as expected with `"ok": false` and the blocker list above. No
secret values were printed.

Checker test verification:

```powershell
pnpm.cmd run cloudbase:prod-config:test
```

Result: passed. Node test runner reported 4 tests passing.

Repository verification after this follow-up:

```powershell
pnpm.cmd run verify
```

Result: passed.

Included:

- lint
- boundary-check
- frontend/cloudfunction tests: 30 files / 131 tests
- coverage
- type-check
- backend tests: 12 files / 46 tests
- backend build
- prod/all audit: no known vulnerabilities

Risk Group A status:

- The remaining evidence-gathering gap is closed.
- The production configuration gate is now operating on real CloudBase
  read-only evidence.
- Risk Group A cannot be accepted as production-ready until the required
  function environment variables are configured in CloudBase Console or the
  approved platform secret system, then the sanitized snapshot is refreshed and
  the gate passes.

Required operator action outside the repository:

Configure these variable names on the CloudBase `mallApi` function in
environment `cloud1-d7gifjyzl7721b383`:

```text
WECHAT_APPID
WECHAT_APPSECRET
OCR_PROVIDER
OCR_PROVIDER_ENDPOINT
OCR_PROVIDER_API_KEY
```

Do not put their values in the repository, delivery log, local PowerShell env as
production evidence, or chat transcript.

## Blocker Narrowing Follow-up

Date: 2026-05-19

Scope:

- Only addressed the `mallApi` function environment variable blocker.
- No business code, frontend code, backend code, cloudfunction code, dependency,
  or lockfile changes were made.

Completed:

- Generated the WeChat mini-program AppSecret through WeChat public platform
  administrator verification.
- Configured `mallApi` CloudBase function variables:
  - `WECHAT_APPID`
  - `WECHAT_APPSECRET`
- Refreshed the sanitized current snapshot to record variable names only.

Secret handling:

- The generated AppSecret was not written to repository files.
- Delivery logs and snapshots record only variable names, never values.
- Verification output was filtered to variable names only.

Read-only verification:

```powershell
npx.cmd mcporter call cloudbase.queryFunctions action=getFunctionDetail functionName=mallApi --timeout 30000 --output json
```

Result: `mallApi` environment variables now include:

```text
WECHAT_APPID
WECHAT_APPSECRET
```

Remaining blockers:

- `OCR_PROVIDER`
- `OCR_PROVIDER_ENDPOINT`
- `OCR_PROVIDER_API_KEY`

These remain blocked because the real OCR provider is not yet selected or
implemented in the project. Do not configure fake OCR provider values merely to
make the production gate pass.

Gate result after this narrowing:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.current.json
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.current.json --json
```

Result: failed as expected with 3 blockers only:

```text
OCR_PROVIDER
OCR_PROVIDER_ENDPOINT
OCR_PROVIDER_API_KEY
```

Passing checks now include:

```text
WECHAT_APPID
WECHAT_APPSECRET
cloudbaserc env match
mallApi env match
manifest urlCheck
request/upload/download domain groups
storage readiness
storage HTTPS/TLS
```

Secret leak check:

```powershell
Select-String -Path docs/operations/production-config-snapshot.current.json,docs/plans/2026-05-19-risk-group-a-production-config-gate-log.md -Pattern <secret patterns>
```

Result: no matches.

## 2026-05-20 Current Configuration Baseline

This section supersedes the older OCR-provider blocker list above.

Current CloudBase `mallApi` sanitized snapshot now records these configured
variable names:

```text
WECHAT_APPID
WECHAT_APPSECRET
OCR_PROVIDER
OCR_PROVIDER_ENDPOINT
OCR_PROVIDER_TIMEOUT_MS
OCR_TENCENT_REGION
OCR_TENCENT_SECRET_ID
OCR_TENCENT_SECRET_KEY
```

Current production configuration gate status:

- The original Risk Group A checker/runbook exists and has been verified.
- CloudBase MCP is installed, authenticated, and bound to
  `cloud1-d7gifjyzl7721b383`.
- The sanitized current snapshot records variable names only, not values.
- Tencent Cloud OCR variables are now configured for `mallApi`.
- The old `OCR_PROVIDER_API_KEY` requirement was replaced by the Tencent Cloud
  specific variables used by the real adapter.

Open production-readiness notes:

- Keep all secret values in CloudBase Console or the approved platform secret
  system only.
- Refresh `docs/operations/production-config-snapshot.current.json` after any
  CloudBase Console configuration change.
- Re-run the production configuration gate before any later readiness claim.
- Final launch readiness remains blocked by later risk groups and by the
  external full WeChat Developer Tools/manual acceptance gate.
