# Release Readiness Guard

Captured: 2026-06-02
Role: Reviewer
PRD phase: 7
Scope: release readiness guard after stabilization audit, local fixes, deployment, and verification

## Conclusion

READY FOR CHECKPOINT COMMIT

This is not `READY FOR RELEASE`. WeChat DevTools / real-device manual acceptance is still pending, and `verify:staging` cannot complete customer-private smoke without a verified WeChat identity.

## Gate Checklist

| # | Check | Status | Evidence |
|---|---|---|---|
| 1 | `verify` passes | PASS | `pnpm.cmd run verify` passed. Frontend: 76 test files, 502 tests. Backend: 12 test files, 61 tests. Coverage/audit/type checks passed. |
| 2 | `verify:full` passes | PASS | `pnpm.cmd run verify:full` passed, including `build:mp-weixin`, `smoke:mp-weixin`, and nested `mp:runtime-audit`. |
| 3 | `verify:api` passes | PASS | `pnpm.cmd run verify:api` passed with backend tests and build. |
| 4 | `mp:runtime-audit` passes | PASS | Nested in `verify:full`; output: MP runtime audit passed. |
| 5 | `cloudbase:schema:check` passes | PASS | `pnpm.cmd run cloudbase:schema:check` passed for env `cloud1-d7gifjyzl7721b383`; 16 required collections present. |
| 6 | `cloudbase:images:audit` has no blocking issue | PASS_WITH_SCOPE_LIMIT | `pnpm.cmd run cloudbase:images:audit` returned `ok: true`, `blockingIssues: []`; it is contract-only/local evidence and not real product-image manual acceptance evidence. |
| 7 | `mallApi` deployed | PASS | `manageFunctions(updateFunctionCode)` succeeded for `mallApi`; function detail is `Active` / `Available`; ModTime `2026-06-02 10:52:41`; test identity remains disabled. |
| 8 | WeChat DevTools / real-device manual acceptance complete | PENDING | Not provided by user in this task. |
| 9 | P0/P1 defects are zero | PASS_FOR_BLOCKERS | The Phase 2 P0 checkout trusted-boundary issue was fixed locally, tested, and deployed. Remaining P1/P2 items are complexity/refactor debt, not current release blockers. |
| 10 | Current diff can be split, reviewed, and rolled back | PASS_WITH_SPLIT_REQUIRED | Phase 6 commit plan defines review/rollback slices. Several files are `SPLIT_NEEDED`, so final merge should not use one undifferentiated commit unless explicitly choosing a checkpoint commit. |

## Staging Result

`pnpm.cmd run verify:staging` exited with code 1, but the failure reason remains the known manual-identity boundary:

- schema: ok
- `mallApi.health`: ok
- `mallApi.listContracts`: ok
- customer-private actions: transport ok, API returns `UNAUTHORIZED`
- raw error leak: false
- manual acceptance required: verified WeChat identity from DevTools or real device

This result is not a release PASS and not an unexpected runtime failure. It confirms the deployed backend refuses customer-private access without trusted runtime identity.

## P0/P1 Review

P0:

- No open P0 blocker remains after the deployed checkout guard.

P1:

- No open P1 release blocker remains for automated/manual-acceptance readiness.
- Maintenance P1 remains for `cloudfunctions/mallApi/mall-api-core.js` and `cloudfunctions/mallApi/mall-api-core.test.js` size. This should be addressed after manual acceptance, not before.

## Remaining Risks

- Manual WeChat acceptance is still required for anonymous browse, phone authorization prompt, cancel authorization, bound-phone direct submit, order creation, merchant cancellation, customer-private pages, and product images.
- `cloudbase:images:audit` is not real image acceptance evidence; it only proves the read-only audit script has no current blocking records in its local contract mode.
- `_ai_review_context/` and `_ai_review_context.zip` remain untracked and should be excluded from commits.
- Large files and split-needed diffs require careful hunk staging or a consciously named checkpoint commit.

## Recommended Readiness State

Use `READY FOR CHECKPOINT COMMIT` if the next action is to save the deployed, verified stabilization state.

Use `READY FOR MANUAL ACCEPTANCE` if the next action is to ask the user to run WeChat DevTools / real-device checks before any checkpoint commit.

Do not use `READY FOR RELEASE` until the user completes and reports manual WeChat acceptance.

## Reviewer Agent Addendum

The `prd_reviewer` read-only pass returned `STATUS: PASS` for this guard:

- Current conclusion remains `READY FOR CHECKPOINT COMMIT`.
- P0 release blockers: 0.
- P1 release blockers: 0.
- P1 debt remains for oversized `mallApi` core/test files, but it is post-acceptance refactor debt.
- Current diff is not single-theme merge-ready; it is checkpoint-ready or split-required before final merge.
- `_ai_review_context/`, `_ai_review_context.zip`, and `.ai/TASK_STATE.md` should not enter functional commits.
