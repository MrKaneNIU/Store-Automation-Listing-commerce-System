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

Status: not executed.

Blocking conditions:

1. `tcb` is not available in the current shell.
2. The target envId has not been explicitly confirmed by an operator for this
   smoke pass.
3. No CloudBase login state was verified.
4. No deployed function invocation was performed.

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
The deployed CloudBase environment smoke is still open because the CloudBase
CLI is not callable in this shell and no remote environment operation was
performed.

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

Updated blocking conditions:

1. A callable CloudBase CLI path is still missing.
2. Target envId still requires explicit operator confirmation before any remote
   operation.
3. CloudBase login state has not been verified.
4. No deployed `mallHealth` or `mallApi` invocation has been performed.

Minimum next unblock options:

1. Install or expose a stable local `tcb` command in PATH, then run
   `tcb --version` and `tcb fn invoke --help`.
2. Alternatively provide a known working CloudBase CLI path and confirmed
   envId.
3. After that, run login/environment selection and remote invokes only against
   the confirmed envId.
