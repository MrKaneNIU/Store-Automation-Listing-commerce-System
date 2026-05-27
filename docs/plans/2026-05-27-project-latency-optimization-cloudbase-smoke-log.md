# 2026-05-27 Project Latency Optimization CloudBase Smoke Log

## Scope

This log covers the CloudBase smoke gap left after modules 0-6.

The goal is to separate three evidence types:

1. local CloudFunction entry smoke,
2. mp-weixin build/route smoke,
3. deployed CloudBase environment smoke.

Only item 3 can close the deployed-environment gap.

## Repository Impact Map

Changed in this step:

```text
scripts/smoke-cloudbase-api.mjs
docs/plans/2026-05-27-project-latency-optimization-cloudbase-smoke-log.md
docs/plans/2026-05-27-project-latency-optimization-module-6-log.md
```

Explicitly out of scope:

```text
src/
cloudfunctions/
backend/
runtime pages
business domain rules
data models
API action semantics
```

Preserved contracts:

- Local smoke remains supporting evidence only.
- Build smoke remains supporting evidence only.
- No local command result is reported as deployed CloudBase acceptance.
- No CloudBase CLI operation is executed without a confirmed envId and
  available login state.

## Target Environment

Configured in `cloudbaserc.json`:

```text
envId: cloud1-d7gifjyzl7721b383
functionRoot: ./cloudfunctions
functions:
- mallHealth
- mallApi
```

Status: target envId is documented from repository config but has not been
confirmed by an operator for this smoke pass.

## CLI Readiness

CloudBase CLI status:

```powershell
Get-Command tcb -ErrorAction SilentlyContinue
```

Result: no callable `tcb` command was found in this local shell.

Because the CloudBase CLI is unavailable, this pass did not run:

```powershell
tcb login
tcb env use cloud1-d7gifjyzl7721b383
tcb fn list
tcb fn invoke mallHealth
tcb fn invoke mallApi
```

## Local Smoke Evidence

### mallHealth

Command:

```powershell
pnpm.cmd run cloudbase:health:smoke
```

Result: passed.

Observed envelope:

```json
{
  "success": true,
  "data": {
    "service": "cloudbase",
    "envId": "cloud1-d7gifjyzl7721b383",
    "region": "ap-shanghai",
    "billingMode": "free-quota",
    "requiredCollections": 14
  },
  "error": null,
  "meta": {}
}
```

### mallApi

Initial result: failed before harness correction.

Failure:

```text
mallApi did not validate malformed createOcrBatch payloads
```

Root cause: the smoke script still used a synthetic request identity and
expected role claims to be trusted by the function entry. The current runtime
contract resolves privileged actions through verified runtime roles or an
admin session. The smoke harness was updated to use an admin session for the
local function-entry smoke. No CloudFunction business code was changed.

Command after correction:

```powershell
pnpm.cmd run cloudbase:api:smoke
```

Result: passed.

Observed summary:

```json
{
  "health": {
    "success": true,
    "data": {
      "service": "mall-api",
      "envId": "cloud1-d7gifjyzl7721b383",
      "route": "cloudbase-function",
      "supportedActions": 39
    },
    "error": null,
    "meta": {}
  },
  "contractsCount": 39
}
```

## Deployed Smoke Status

Status: passed on 2026-05-27 after the online product-management and
order-confirmation repairs.

Operator-confirmed target environment:

```text
envId: cloud1-d7gifjyzl7721b383
```

CloudBase CLI evidence:

```text
tcb path: C:\Users\65188\AppData\Local\Temp\codex-cloudbase-cli-clean\node_modules\@cloudbase\cli\bin\tcb
tcb path exists: true
CloudBase CLI version: 3.5.0
tcb login: already logged in
tcb env use cloud1-d7gifjyzl7721b383: succeeded
mallApi status: Active / Available
mallApi runtime: Nodejs18.15
```

Security note: `tcb fn detail mallApi --json` returns CloudBase environment
variables. The command was used only to confirm function status and runtime.
No secret values are reproduced in this log.

Remote read-only smoke results:

| Action | Result | Notes |
| --- | --- | --- |
| `mallApi.health` | Passed | `success: true`, `supportedActions: 39`, envId `cloud1-d7gifjyzl7721b383` |
| `mallApi.listContracts` | Passed | `success: true`; includes product-management and order-confirmation actions |
| `mallApi.listOwnerProductCards` | Passed | `success: true`; returned deployed product `122334` / `衬衫` |
| `mallApi.getOwnerOrderSnapshot` | Passed | `success: true`; returned an empty deployed order list |
| `mallApi.listMerchantOrders` | Passed | `success: true`; returned an empty deployed order list |

Actions intentionally not invoked:

```text
confirmMerchantOrder
cancelMerchantOrder
createCustomerOrder
publishProduct
unpublishProduct
deleteProduct
stock or SKU write actions
```

Those actions were skipped because this smoke pass was read-only and must not
mutate deployed business data.

## Exit Criteria

The deployed CloudBase smoke gap can be closed only when all items below are
recorded:

1. Operator confirms target envId.
2. `tcb` is available and authenticated.
3. Active environment is set to the confirmed envId.
4. `mallHealth` deployed invocation returns a success envelope.
5. `mallApi` deployed invocation returns `health` success and exposes the
   expected action contract count.
6. Smoke evidence records timestamp, operator, envId, command, and result.

## Current Conclusion

Local CloudFunction entry smoke is green after updating the smoke harness.
The deployed CloudBase `mallApi` environment smoke is now closed for the
read-only management paths exercised above.

## CLI Readiness Follow-Up

Timestamp: 2026-05-27 16:54 Asia/Shanghai.

Commands:

```powershell
Get-Command tcb -ErrorAction SilentlyContinue
npm.cmd view @cloudbase/cli bin --json
npm.cmd view @cloudbase/cli version
npx.cmd --yes -p @cloudbase/cli tcb --version
npx.cmd --yes -p @cloudbase/cli tcb fn invoke --help
npx.cmd --yes -p @cloudbase/cli tcb login --help
```

Results:

- Global `tcb` is still not available in this shell.
- npm metadata lookup succeeded. `@cloudbase/cli` latest observed version is
  `3.5.0`, and the package exposes `tcb`, `cloudbase`, and `cloudbase-mcp`
  binaries.
- Direct `npx.cmd --yes @cloudbase/cli ...` could not determine the executable
  to run.
- `npx.cmd --yes -p @cloudbase/cli tcb ...` did not return within 120 seconds
  for version/help probes.
- The three temporary `npx` probe processes started at this timestamp were
  stopped after timeout. No CloudBase environment command was executed.

Updated status after follow-up:

1. A callable CloudBase CLI path is available via the temporary clean install.
2. Target envId `cloud1-d7gifjyzl7721b383` was used for all remote smoke
   commands.
3. CloudBase login state was verified.
4. Deployed `mallApi` read-only invocations were performed and passed.

Remaining caveat:

- This follow-up closed the `mallApi` deployed smoke needed by the repaired
  product-management and order-confirmation paths. `mallHealth` was not
  re-invoked in this final follow-up because the repair scope and online
  defects were both in `mallApi`.
