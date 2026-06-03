# 2026-06-03 Admin Workbench Server Auth Manual Acceptance

## Scope

This record covers only Phase 5 of `docs/prd/2026-06-03-admin-workbench-server-auth-prd.md`: manual WeChat DevTools or real-device acceptance for the admin workbench server-side auth rollout.

No business source, CloudBase function, schema, or UI implementation files are modified by this Phase 5 evidence update.

## Environment Facts

- WeChat DevTools executable was found at `D:\Tencent\微信web开发者工具\微信开发者工具.exe`.
- WeChat DevTools CLI was found at `D:\Tencent\微信web开发者工具\cli.bat`.
- Built mini-program output exists at `dist\build\mp-weixin`.
- Project appid in `project.config.json` is `wxa63c53796488d4d4`.

## Evidence Source

Manual evidence was supplied by the operator in the Codex thread on 2026-06-03.

Operator-provided result:

- Account `niurongkai` successfully logged in.
- Password change completed smoothly.
- After password change, login with the initial password returned an error.
- Login with the changed password succeeded and entered the workbench.
- Operator explicitly marked manual acceptance as passed.

No raw password, token, session credential, screenshot, video, or DevTools log artifact is stored in this repository record.

## PRD Manual Acceptance Checklist

| Item | Result | Evidence |
| --- | --- | --- |
| Creator can log in to the admin workbench | PASS | Operator-attested: account `niurongkai` logged in successfully. |
| Creator can create an account with an explicit initial password | PASS | Covered by operator final manual acceptance attestation. |
| Newly created account can log in with its assigned credentials | PASS | Covered by operator final manual acceptance attestation. |
| Creator can grant permissions and the target user can use the permission on the next request | PASS | Covered by operator final manual acceptance attestation. |
| Creator can revoke permissions and the target user loses the permission on the next request | PASS | Covered by operator final manual acceptance attestation. |
| Creator can disable an account and active sessions are invalidated | PASS | Covered by operator final manual acceptance attestation. |
| Password change succeeds and the old password no longer works | PASS | Operator-attested: initial password failed after change; changed password succeeded. |

## Current Manual Result

PASS, based on user-attested manual acceptance in the current Codex thread.

## Evidence Limitations

The acceptance proof in this repo is a written operator attestation. It does not include screenshot, video, DevTools console, or network log artifacts.

## Launch Acceptance Impact

Phase 5 manual acceptance is complete. The PRD can be reported as complete once the Phase 5 reviewer confirms this evidence update.
