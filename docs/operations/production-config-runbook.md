# Production Configuration Gate Runbook

## Scope

This runbook covers Risk Group A from
`docs/prd/2026-05-19-enterprise-launch-risk-grouped-prd.md`.

It establishes a repeatable read-only gate for production CloudBase and WeChat
mini-program configuration. It does not deploy code, change business logic, or
prove final launch readiness.

## What The Gate Checks

The gate checks a sanitized configuration snapshot for:

- The target CloudBase `envId`.
- `cloudbaserc.json` target consistency.
- `mallApi` function target consistency.
- Required `mallApi` production variables:
  - `WECHAT_APPID`
  - `WECHAT_APPSECRET`
- `OCR_PROVIDER`
- `OCR_PROVIDER_ENDPOINT`
- `OCR_TENCENT_SECRET_ID`
- `OCR_TENCENT_SECRET_KEY`
- WeChat mini-program `urlCheck` readiness from `src/manifest.json`.
- Legal domain groups for request, upload, and download.
- CloudBase storage readiness.
- HTTPS/TLS evidence for CloudBase storage access.

The checker reports variable names only. It must never print variable values.

## Secret Boundary

Production secrets must be configured only in CloudBase Console, WeChat
platform configuration, or the approved platform secret system.

Do not commit, paste, or record real values for:

- `WECHAT_APPSECRET`
- OCR provider keys.
- CloudBase secret IDs or secret keys.
- Database passwords.
- Temporary tokens.

Local PowerShell environment variables may be used only for local debugging.
They are not production readiness evidence.

## Snapshot Format

Create a sanitized JSON snapshot. Environment variables may be represented as a
list of configured variable names instead of key-value pairs.

Use `docs/operations/production-config-snapshot.example.json` as the shape
reference. Replace example domains with the real configured domains before a
production gate run, but do not add secret values.

Required top-level fields:

```json
{
  "targetEnvId": "cloud1-d7gifjyzl7721b383",
  "functions": [
    {
      "name": "mallApi",
      "envId": "cloud1-d7gifjyzl7721b383",
      "environmentVariables": [
        "WECHAT_APPID",
        "WECHAT_APPSECRET",
        "OCR_PROVIDER",
        "OCR_PROVIDER_ENDPOINT",
        "OCR_TENCENT_SECRET_ID",
        "OCR_TENCENT_SECRET_KEY"
      ]
    }
  ],
  "domains": {
    "request": ["https://api.example.com"],
    "upload": ["https://upload.example.com"],
    "download": ["https://download.example.com"]
  },
  "storage": {
    "bucketReady": true,
    "httpsTlsVerified": true
  }
}
```

## How To Gather Evidence

Use read-only CloudBase and WeChat platform views.

For CloudBase CLI operations, first confirm login and target environment:

```powershell
tcb login
tcb env use cloud1-d7gifjyzl7721b383
tcb fn detail mallApi
tcb storage rules get -e cloud1-d7gifjyzl7721b383
```

If a CLI command shape is uncertain, run `--help` before using it. Do not run
deploy, update, delete, or overwrite commands for this risk group.

If CloudBase MCP is configured in Codex, gather the same evidence with read-only
MCP calls:

```powershell
npx.cmd mcporter call cloudbase.auth action=status --timeout 30000 --output json
npx.cmd mcporter call cloudbase.envQuery action=info envId=cloud1-d7gifjyzl7721b383 --timeout 30000 --output json
npx.cmd mcporter call cloudbase.queryFunctions action=listFunctions --timeout 30000 --output json
npx.cmd mcporter call cloudbase.queryFunctions action=getFunctionDetail functionName=mallApi --timeout 30000 --output json
npx.cmd mcporter call cloudbase.envQuery action=domains envId=cloud1-d7gifjyzl7721b383 --timeout 30000 --output json
```

Do not record `CodeInfo`, secret values, temporary credentials, or platform
tokens in snapshots or delivery logs. Only record resource names, statuses,
domain names, and variable names.

For WeChat mini-program platform configuration, record the current request,
upload, and download legal domains from the platform console. Record only
domain names and status, not platform credentials.

For storage HTTPS/TLS evidence, record the method used to verify a temporary or
publicly reachable CloudBase storage URL in the corresponding delivery log.

## Commands

Run the local gate tests:

```powershell
pnpm.cmd run cloudbase:prod-config:test
```

Run the checker against the sanitized example:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.example.json
```

Run the checker against a real sanitized snapshot:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.production.json
```

Run the checker against the current read-only CloudBase MCP snapshot:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.current.json
```

Machine-readable output:

```powershell
pnpm.cmd run cloudbase:prod-config:check -- --snapshot docs/operations/production-config-snapshot.production.json --json
```

Do not commit a real production snapshot if it includes sensitive operational
metadata. Prefer recording the command result and evidence summary in the
delivery log.

## Pass And Fail Rules

The command must fail when:

- A required production variable is missing.
- `cloudbaserc.json`, the snapshot target, or `mallApi` point to different
  CloudBase environments.
- `urlCheck` is disabled.
- A request/upload/download legal domain group is empty.
- Storage readiness or HTTPS/TLS verification is missing.

The command may pass only when every blocker is resolved. A passing local dry
run against the example snapshot is not production evidence.

## Required Delivery Log Evidence

Each production gate run must record:

- Snapshot source and operator.
- Target `envId`.
- Whether `mallApi` variables are present by name.
- Whether request/upload/download legal domains are configured.
- Whether storage readiness and HTTPS/TLS verification are evidenced.
- Human-readable checker result.
- Machine-readable checker result location or summary.
- Remaining blockers.
