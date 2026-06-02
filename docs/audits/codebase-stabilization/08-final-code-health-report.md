# Final Code Health Report

Captured: 2026-06-02
Role: Reporter
PRD phase: 8
Scope: final code health report for stabilization PRD

## Final Conclusion

CODEBASE STABLE ENOUGH FOR MANUAL ACCEPTANCE

This does not mean the project is released. Automated verification and `mallApi` deployment are now closed, but WeChat DevTools / real-device acceptance is still pending.

## 1. Is There Current "Spaghetti Code" Risk?

Yes, there is emerging stabilization-debt risk, but not a blocking architecture-collapse risk.

The risk is concentrated in a few oversized backend, page, and test files. Current behavior is protected by tests and deployment checks, and the Phase 2 P0 checkout trusted-boundary issue has been fixed and deployed. The safe path is manual acceptance first, then small contract-protected refactors.

## 2. Top 10 Risks

1. `cloudfunctions/mallApi/mall-api-core.js` is too large and spans many domains.
2. `cloudfunctions/mallApi/mall-api-core.test.js` is too large and mixes many backend contracts.
3. Several customer/owner `.vue` pages exceed maintainable size and combine UI, loading, navigation, retry, image, and action states.
4. Customer shopping bag, favorites, and Mine repeat request dedupe/cache/failure-preserve logic.
5. Image fileID/temp URL classification is duplicated across runtime service, audit service, and scripts.
6. Mock/fallback paths remain useful but can confuse production-vs-test reasoning if not isolated later.
7. Legacy local/MVP checkout/order paths and current CloudBase checkout/order paths coexist.
8. Product edit and publish validation appear in multiple layers and can drift in copy or rule interpretation.
9. Historical docs contain different scoped status words (`PASS`, `FAIL`, `CONDITIONAL PASS`), so release wording must stay disciplined.
10. `_ai_review_context/` and `_ai_review_context.zip` can pollute review and commit staging if included.

## 3. Five Closeout Actions To Do Now

1. Keep the deployed `mallApi` state as the current checkpoint candidate.
2. Run WeChat DevTools / real-device manual acceptance in the order below.
3. Exclude `_ai_review_context/`, `_ai_review_context.zip`, and `.ai/TASK_STATE.md` from functional commits.
4. If committing now, use a clearly named checkpoint commit or follow the Phase 6 split plan.
5. Preserve release wording as `READY FOR CHECKPOINT COMMIT` / awaiting manual acceptance until the user reports real-device results.

## 4. Five Things Not To Do Now

1. Do not rewrite or broadly split `mallApi` before manual acceptance.
2. Do not redesign customer or owner pages.
3. Do not delete legacy MVP/domain tests.
4. Do not change schema or public API contracts for cleanup.
5. Do not rewrite old PRDs or handoff logs to force one historical narrative.

## 5. Should This Be Merged Immediately?

No final merge yet.

The code is checkpoint-ready after automated verification and deployment, but final merge should wait for either:

- a checkpoint commit explicitly labelled as pre-manual-acceptance stabilization, or
- PR splitting per Phase 6 followed by manual acceptance.

## 6. Should We Create a Checkpoint Tag?

Yes, after a checkpoint commit is created.

Recommended tag style:

- `checkpoint/codebase-stabilization-2026-06-02`

Do not create a release tag until manual WeChat acceptance passes.

## 7. Should We Split PRs?

Yes.

Use Phase 6 commit/PR groups:

1. Runtime audit and staging verification tools.
2. CloudBase schema and staging checks.
3. Checkout phone auth and order creation guard.
4. Customer private modules.
5. Image reference/display pipeline.
6. Owner product management edit flow.
7. Admin account management hardening.
8. Docs and manual acceptance reports.
9. Vitest 4.1.8 dependency upgrade.

If time pressure requires one commit, call it a checkpoint commit, not a final merge-ready PR.

## 8. Refactor After Manual Acceptance?

Yes.

Start with test/file split refactors that do not change runtime behavior:

1. Split `mall-api-core.test.js` by domain.
2. Split `mall-api-core.js` one backend action slice at a time.
3. Isolate mock auth/upload fallbacks as explicit test/local adapters.
4. Consolidate image URL classification through shared test vectors or a pure helper.
5. Extract customer request-state helper one page at a time.

## 9. Next Prompt For Codex

Use this after manual acceptance is completed:

```text
按照 docs/plans/codebase-stabilization/05-safe-refactor-plan.md 和 06-commit-plan.md 执行人工验收后的第一轮收口。只处理一个 slice：先拆分 cloudfunctions/mallApi/mall-api-core.test.js 的 checkout/order 测试，不改生产代码。执行前重读这两个计划和 08-final-code-health-report.md，输出 Repository Impact Map 和 Execution Plan，然后运行对应测试和 verify。
```

Use this if manual acceptance fails:

```text
根据这次微信开发者工具/真机验收失败现象做只读诊断。先读取 docs/audits/codebase-stabilization/07-release-readiness-guard.md 和 08-final-code-health-report.md，再定位实际失败链路。不要重构，不要改无关文件；只允许针对失败链路提出最小修复计划。
```

## 10. Manual Acceptance Order For User

1. Anonymous customer browse: open customer home/list/detail without triggering login or phone authorization.
2. Product image display: verify list/detail/owner product images display durable images and do not rely on expired temp URLs.
3. Checkout phone prompt: click order and confirm phone authorization appears only at checkout.
4. Cancel phone authorization: cancel the prompt and verify no order is created and stock is unchanged.
5. Bound-phone direct checkout: retry as an already phone-bound user and verify no repeated phone prompt.
6. Successful order creation: verify order appears in customer Mine/recent order and owner order list.
7. Merchant cancellation: cancel a pending order and verify stock returns.
8. Confirmed-order protection: confirm an order, then verify cancellation is blocked.
9. Shopping bag: add/update/select/remove/clear unavailable items and verify no cross-customer leakage.
10. Favorites: favorite/unfavorite/remove and verify unavailable products remain represented correctly.
11. Mine page: verify identity, phone, recent orders, utilities, retry/refresh states.
12. Owner product edit: update product basics and SKU inventory without changing productCode/SPU/SKU invariants.
13. Admin account management: verify account setup and role-gated pages.

## Verification Summary

- `pnpm.cmd exec vitest run cloudfunctions/mallApi/mall-api-core.test.js`: passed, 73 tests.
- `mallApi` deployed with `updateFunctionCode`; function status `Active` / `Available`, ModTime `2026-06-02 10:52:41`.
- `pnpm.cmd run verify`: passed.
- `pnpm.cmd run verify:full`: passed.
- `pnpm.cmd run verify:api`: passed.
- `pnpm.cmd run cloudbase:schema:check`: passed; 16 required collections present.
- `pnpm.cmd run cloudbase:images:audit`: passed with no blocking issues, contract-only/local evidence.
- `pnpm.cmd run verify:staging`: expected pre-manual-acceptance block; schema/health/listContracts pass, customer-private actions return `UNAUTHORIZED` without real WeChat identity.

## Final Status

Current state is suitable for manual acceptance and checkpointing, not final release.
