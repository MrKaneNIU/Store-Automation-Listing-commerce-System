# Real Device Acceptance Round 2 Failure Baseline

- Agent: `agents.prd_reporter.toml`
- Phase: 0
- Generated at: `2026-06-01 23:06:24 +08:00`
- Current status: `FAIL`
- Scope: documentation baseline only; no business-code changes in this phase.

## PRD Completion Status

Round 2 real-device acceptance is not complete. The current human acceptance result is `FAIL`, with two P0 blockers and two P1 defects recorded below.

This file establishes the failure baseline only. It does not claim any fix, reviewer pass, deployed smoke pass, or real-device re-acceptance pass.

## Human Acceptance Failure Source

Source: user-pasted manual acceptance text in the Phase 0 request.

Key original text:

> P0-1：真实下单链路失败。点击下单后出现两次授权提示，所有授权点击后仍然显示“已取消授权，未创建订单”，后台“订单确认”中没有收到订单。
>
> P0-2：商品图片加载失败。用户侧“商品”页面和管理侧“商品管理”页面都会报 `Failed to load image ... net::ERR_CONNECTION_CLOSED`。
>
> P1-1：商品管理历史已上传图片仍不显示。商品管理界面的商品预览图仍然没有显示之前上传的图片。
>
> P1-2：商品管理编辑入口不完整。已上架商品只能编辑简介、规格库存，不能统一编辑商品名、货号等基础信息。

## Failure List

| ID | Severity | Status | Failure | Baseline impact |
| --- | --- | --- | --- | --- |
| P0-1 | P0 | Open | 真实下单链路失败 | Blocks core buyer checkout/order acceptance. |
| P0-2 | P0 | Open | 商品图片加载 `ERR_CONNECTION_CLOSED` | Blocks product browsing/inspection on real device when images cannot load. |
| P1-1 | P1 | Open | 商品管理历史图片不显示 | Degrades owner product-management review and edit confidence. |
| P1-2 | P1 | Open | 商品管理编辑入口不完整 | Degrades owner product-management workflow completion. |

## Current Repository State

Current branch:

```text
main
```

Current git status:

```text
 M .ai/TASK_STATE.md
 M backend/src/cloudbase/cloudbase-data-model.test.ts
 M backend/src/cloudbase/cloudbase-data-model.ts
 M backend/src/cloudbase/cloudbase-health.test.ts
 M cloudfunctions/mallApi/index.js
 M cloudfunctions/mallApi/mall-api-core.js
 M cloudfunctions/mallApi/mall-api-core.test.js
 M cloudfunctions/mallHealth/index.js
 M docs/contracts/page-facing-ui-contracts.md
 M package.json
 M scripts/smoke-cloudbase-health.mjs
 M src/features/admin-workbench-auth/admin-workbench-auth.test.ts
 M src/features/admin-workbench-auth/admin-workbench-auth.ts
 M src/features/admin-workbench-auth/admin-workbench-guard.test.ts
 M src/features/cloudbase-mall/cloudbase-mall.test.ts
 M src/features/cloudbase-mall/customer-product-detail.ts
 M src/features/cloudbase-mall/owner-draft-review.ts
 M src/features/cloudbase-mall/staff-image-tasks.ts
 M src/features/customer-favorites/customer-favorites.test.ts
 M src/features/customer-favorites/customer-favorites.ts
 M src/features/customer-shopping-bag/customer-shopping-bag.test.ts
 M src/features/customer-shopping-bag/customer-shopping-bag.ts
 M src/features/owner-draft-review/owner-draft-review.test.ts
 M src/features/owner-draft-review/owner-draft-review.ts
 M src/features/staff-image-tasks/staff-image-tasks.test.ts
 M src/features/staff-image-tasks/staff-image-tasks.ts
 M src/pages/customer/customer-bottom-nav.test.ts
 M src/pages/customer/favorites/index.test.ts
 M src/pages/customer/favorites/index.vue
 M src/pages/customer/mine/index.test.ts
 M src/pages/customer/mine/index.vue
 M src/pages/customer/shopping-bag/index.vue
 M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts
 M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts
 M src/pages/owner/account-management/index.test.ts
 M src/pages/owner/account-management/index.vue
 M src/pages/owner/more/index.test.ts
 M src/pages/owner/more/index.vue
 M src/pages/owner/permissions/index.test.ts
 M src/pages/owner/permissions/index.vue
 M src/pages/owner/products/index.vue
 M src/pages/owner/products/useOwnerProductsPageState.test.ts
 M src/pages/owner/products/useOwnerProductsPageState.ts
 M src/services/cloudbase/cloudbase-function-client.test.ts
 M src/services/cloudbase/cloudbase-function-client.ts
 M src/services/cloudbase/mall-api-client.test.ts
 M src/services/cloudbase/mall-api-client.ts
 M src/services/cloudbase/runtime-mall-api-client.test.ts
 M src/services/cloudbase/runtime-mall-api-client.ts
 M src/services/storage/product-image-url.test.ts
?? _ai_review_context.zip
?? _ai_review_context/
?? cloudfunctions/mallApi/index.test.js
?? config/
?? docs/audits/
?? docs/plans/customer-runtime-stabilization/
?? docs/plans/real-device-acceptance-fixes/
?? docs/prd/2026-06-01-customer-wechat-auth-mine-persistence-prd.md
?? docs/prd/debug-prd.md
?? docs/testing/customer-runtime-stabilization/
?? docs/testing/real-device-acceptance-fixes/
?? scripts/cloudbase-schema-apply-staging.mjs
?? scripts/cloudbase-schema-check.mjs
?? scripts/cloudbase-schema-utils.mjs
?? scripts/mp-runtime-audit.mjs
?? scripts/mp-runtime-audit.test.mjs
?? scripts/verify-staging.mjs
?? src/features/cloudbase-mall/customer-mine.test.ts
?? src/features/cloudbase-mall/customer-mine.ts
?? src/features/customer-mine/
?? src/pages/customer/favorites/useCustomerFavoritesPageState.test.ts
?? src/pages/customer/favorites/useCustomerFavoritesPageState.ts
?? src/pages/customer/mine/useCustomerMinePageState.test.ts
?? src/pages/customer/mine/useCustomerMinePageState.ts
?? src/services/performance/customer-runtime-request-log.test.ts
?? src/services/performance/customer-runtime-request-log.ts
```

Note: this phase intentionally did not revert or normalize the existing dirty worktree.

## Current CloudBase State

Current CloudBase envId:

```text
cloud1-d7gifjyzl7721b383
```

Evidence:

- `cloudbaserc.json` declares `envId: cloud1-d7gifjyzl7721b383`.
- CloudBase auth status reports `current_env_id: cloud1-d7gifjyzl7721b383`, `auth_status: READY`, and `env_status: READY`.
- CloudBase env detail reports status `NORMAL`, storage bucket `636c-cloud1-d7gifjyzl7721b383-1429982088`, CDN domain `636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la`, database instance `tnt-e71ztb4u6`, and storage status `NORMAL`.

Current `mallApi` deployment status:

```text
FunctionName: mallApi
Namespace: cloud1-d7gifjyzl7721b383
Runtime: Nodejs18.15
Handler: index.main
Status: Active
AvailableStatus: Available
FunctionVersion: $LATEST
FunctionId: lam-p9pnqzgv
ResourceId: scf-sh-p9pnqzgv
DeployMode: code
Type: Event
ModTime: 2026-06-01 13:23:03
AddTime: 2026-05-10 10:34:35
CodeResult: success
```

Evidence source: read-only CloudBase `queryFunctions(action="getFunctionDetail", functionName="mallApi")`.

Sensitive values returned in CloudBase function environment variables were intentionally omitted and must not be copied into reports.

Evidence gaps:

- `mallApi` action-level contract behavior was not invoked in this phase.
- No real-device rerun was performed in this phase.

## Current mp-weixin Build Baseline

Current `dist/build/mp-weixin` exists.

Observed latest build artifact time:

```text
2026-06-01 18:23:48 +08:00
```

Evidence sample:

```text
dist/build/mp-weixin/pages/customer/mine/index.wxss           2026-06-01 18:23:48
dist/build/mp-weixin/pages/customer/mine/index.wxml           2026-06-01 18:23:48
dist/build/mp-weixin/pages/owner/more/index.wxss              2026-06-01 18:23:48
dist/build/mp-weixin/pages/customer/product-detail/index.wxss 2026-06-01 18:23:48
dist/build/mp-weixin/pages/customer/product-detail/index.wxml 2026-06-01 18:23:48
```

## Verification Performed In This Phase

No automated product test suite was run, because this phase is a documentation-only failure baseline.

Commands/read-only checks used:

```text
git status --short
git branch --show-current
git log -1 --oneline --decorate
Get-Content -Raw cloudbaserc.json
Get-ChildItem dist/build/mp-weixin -Recurse
CloudBase auth status
CloudBase envQuery info
CloudBase queryFunctions getFunctionDetail mallApi
```

## Reviewer Conclusion

Reporter conclusion: `FAIL baseline established`.

The four user-reported failures are accepted as the current Round 2 manual acceptance baseline. No fix is claimed. No reviewer pass is claimed for implementation code in this phase.

## Debugger Involvement

Debugger did not intervene in Phase 0.

Reason: this phase is limited to report/documentation setup and failure-baseline capture. No debugging or business-code repair was performed.

## Remaining Risks

- The order-chain failure root cause is not yet isolated.
- The image loading failure may involve CloudBase storage temporary URLs, CDN/network behavior, image URL normalization, or Mini Program domain/security settings.
- Owner product-management historical image display may be affected by stored data shape, image URL expiry, local rendering code, or deployed API behavior.
- Owner product-management edit-entry completeness needs UI/workflow inspection before fix scope can be bounded.
- The current dirty worktree contains many unrelated modified and untracked files, increasing diff attribution risk for later phases.
- `mallApi` is deployed and available, but action-level runtime behavior for the four failures remains unverified in this baseline.

## Merge Recommendation

Do not merge as a product fix.

This Phase 0 report is suitable to merge only as a documentation baseline if the owner wants the failure state recorded before repair work begins.

## Human Owner Focus Areas

- Confirm the exact real-device reproduction steps for P0-1 order failure, including account state, product/SKU, payment/mock-payment path, and observed error text.
- Capture the exact image URL or fileID path that produced `ERR_CONNECTION_CLOSED`.
- Confirm whether P1-1 affects all historical product images or only images created before a specific storage/API change.
- Confirm whether the product-management edit gap is a missing button, missing route, missing fields, missing save affordance, or role-gated entry.

## Follow-up Phase Index

| Phase | Target | Primary output |
| --- | --- | --- |
| Phase 1 | Debugger diagnoses image chain and `ERR_CONNECTION_CLOSED` | `01-image-chain-diagnosis.md` |
| Phase 2 | Implementer fixes image persistence, display, and historical data | `02-image-fix-delivery-log.md` |
| Phase 3 | Reviewer audits image fix | `03-image-review.md` |
| Phase 4 | Debugger diagnoses checkout authorization chain | `04-checkout-auth-diagnosis.md` |
| Phase 5 | Implementer fixes checkout authorization and order creation | `05-checkout-auth-fix-delivery-log.md` |
| Phase 6 | Reviewer audits checkout authorization fix | `06-checkout-auth-review.md` |
| Phase 7 | Debugger diagnoses product edit entry | `07-product-edit-diagnosis.md` |
| Phase 8 | Implementer builds unified product edit entry | `08-product-edit-fix-delivery-log.md` |
| Phase 9 | Reviewer audits product edit fix | `09-product-edit-review.md` |
| Phase 10 | Full automated verification | `10-automated-verification.md` |
| Phase 11 | Deployment and data repair confirmation | `11-deploy-data-repair.md` |
| Phase 12 | Manual acceptance checklist | `12-manual-acceptance-checklist.md` |
| Phase 13 | Final report | `13-final-report.md` |
