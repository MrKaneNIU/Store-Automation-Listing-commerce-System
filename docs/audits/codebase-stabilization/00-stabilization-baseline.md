# Codebase Stabilization Baseline

Captured: 2026-06-02
Role: Reporter
PRD phase: 0
Scope: code health baseline only; no business-code implementation

## PRD Boundary

This audit follows `C:/Users/65188/Desktop/xiufu-prd.md`. The current task is codebase stabilization, not feature delivery.

Explicit non-goals:

- Do not add features.
- Do not redesign UI.
- Do not change business rules.
- Do not expand scope beyond current stabilization evidence.
- Do not mark the project as release-ready before manual WeChat acceptance.

## Current Git State

- Branch: `main`
- HEAD: `ba12344`
- Worktree: dirty
- `git status --short -uall`: 148 paths
- Tracked modified files: 68
- Untracked files: 80

Command evidence:

```text
git branch --show-current
main

git rev-parse --short HEAD
ba12344
```

`git status --short` currently includes tracked modifications in `.ai/`, `backend/`, `cloudfunctions/`, `docs/contracts/`, `package.json`, `pnpm-lock.yaml`, `scripts/`, `src/`, and `tsconfig.json`, plus untracked review context, audit docs, plan docs, PRD/testing docs, CloudBase scripts, customer mine files, runtime logging, and image audit files.

Git also reports LF-to-CRLF working-copy warnings for many tracked files. This is a diff hygiene risk, not a product behavior failure by itself.

## Verification Status

All verification commands in this table were run in this phase unless marked otherwise.

| Command | Current result | Evidence summary |
| --- | --- | --- |
| `pnpm.cmd run verify` | PASS | lint PASS, boundary-check PASS, frontend Vitest 76 files / 498 tests PASS, coverage PASS, type-check PASS, backend 12 files / 61 tests PASS, prod/all audit PASS |
| `pnpm.cmd run verify:full` | PASS | Includes `verify` PASS, `build:mp-weixin` PASS, `smoke:mp-weixin` PASS, `mp:runtime-audit` PASS |
| `pnpm.cmd run verify:api` | PASS | Backend Vitest 12 files / 61 tests PASS, backend build PASS |
| `pnpm.cmd run verify:staging` | EXPECTED BLOCK | schema OK, mallApi health/listContracts OK, customer-private actions return `UNAUTHORIZED` without verified WeChat identity |
| `pnpm.cmd run mp:runtime-audit` | PASS | Run through `verify:full`; no unsupported Node built-ins or missing local require targets |

Coverage from `verify` / `verify:full`:

| Metric | Current value |
| --- | ---: |
| Statements | 90.8% |
| Branches | 75.1% |
| Functions | 93.19% |
| Lines | 90.75% |

`verify:staging` output summary:

```text
[verify:staging] envId=cloud1-d7gifjyzl7721b383
schema.ok=true
mallApi.healthOk=true
mallApi.listContractsOk=true
getCurrentCustomer -> UNAUTHORIZED
getCustomerShoppingBagSnapshot -> UNAUTHORIZED
getCustomerFavoriteProductsSnapshot -> UNAUTHORIZED
getCustomerMineSnapshot -> UNAUTHORIZED
manualAcceptanceRequired="Customer-private smoke needs verified WeChat identity from DevTools or real device."
```

Interpretation: this is a manual-acceptance precondition block, not evidence for release PASS.

## CloudBase / mallApi Status

CloudBase MCP status:

- Auth status: `READY`
- Current envId: `cloud1-d7gifjyzl7721b383`
- Env status: `READY`

Remote `mallApi` function detail:

- FunctionName: `mallApi`
- Namespace: `cloud1-d7gifjyzl7721b383`
- FunctionId: `lam-p9pnqzgv`
- Runtime: `Nodejs18.15`
- Status: `Active`
- AvailableStatus: `Available`
- DeployMode: `code`
- Type: `Event`
- Handler: `index.main`
- Last modified: `2026-06-02 01:01:55`

Sensitive function environment variable values were returned by the CloudBase detail query. They are intentionally omitted from this repository document. Record only that runtime configuration exists, not secret values.

## Manual Acceptance Status

Status: pending.

Manual-only acceptance buckets still required:

- WeChat DevTools run with verified WeChat identity.
- Real-device customer-private flows.
- Product image rendering on target device.
- Native phone authorization and checkout.
- Owner product edit persistence.

## Uncommitted File List Summary

Tracked modified groups:

- Workflow state: `.ai/TASK_STATE.md`
- Backend / CloudBase model and health: `backend/src/cloudbase/*`
- Cloud functions: `cloudfunctions/mallApi/*`, `cloudfunctions/mallHealth/index.js`
- Contract docs: `docs/contracts/page-facing-ui-contracts.md`
- Config and dependency metadata: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`
- Scripts: `scripts/smoke-cloudbase-health.mjs`
- Features: admin auth, CloudBase mall, customer favorites/product/shopping bag, mall workflow, owner draft/products, staff image tasks
- Pages: customer favorites/mine/product detail/product list/shopping bag and owner account/more/permissions/products
- Services: auth, CloudBase clients, runtime mall API client, storage/image URL

Untracked groups:

- Generated/review context: `_ai_review_context.zip`, `_ai_review_context/*`
- CloudBase config: `config/cloudbase/schema.required.json`
- Audit docs: `docs/audits/customer-runtime-stabilization/*`, `docs/audits/real-device-acceptance-fixes/*`, `docs/audits/real-device-acceptance-round-2/*`
- Plan docs: `docs/plans/customer-runtime-stabilization/*`, `docs/plans/real-device-acceptance-fixes/*`, `docs/plans/real-device-acceptance-round-2/*`
- PRDs and testing docs: `docs/prd/*`, `docs/testing/*`
- New scripts: CloudBase schema/image/staging/runtime audit scripts
- New tests/source: `cloudfunctions/mallApi/index.test.js`, customer mine feature files, page-state files, performance request log, image audit files

## Package Scripts Summary

Core gates:

- `verify`
- `verify:full`
- `verify:api`
- `verify:backend`
- `verify:staging`

Test and quality:

- `test`
- `coverage`
- `lint`
- `type-check`
- `typecheck`
- `boundary-check`
- `audit:prod`
- `audit:all`

Build and smoke:

- `build:mp-weixin`
- `smoke:mp-weixin`
- `e2e:smoke`
- `mp:runtime-audit`
- `mp:runtime-audit:test`

Backend:

- `backend:test`
- `backend:build`
- `backend:start`
- `backend:migrate`
- `backend:migrate:status`
- `backend:restore:rehearsal`

CloudBase:

- `cloudbase:api:smoke`
- `cloudbase:health:smoke`
- `cloudbase:images:audit`
- `cloudbase:images:repair:staging`
- `cloudbase:schema:check`
- `cloudbase:schema:apply:staging`
- `cloudbase:prod-config:test`
- `cloudbase:prod-config:check`

## Diff Statistics

Tracked diff:

```text
git diff --stat
68 files changed, 4091 insertions(+), 1357 deletions(-)
```

Tracked category summary:

| Category | Files | Insertions | Deletions |
| --- | ---: | ---: | ---: |
| production source | 34 | 1641 | 872 |
| tests | 29 | 2010 | 132 |
| scripts | 1 | 1 | 1 |
| docs | 1 | 234 | 0 |
| config | 2 | 11 | 4 |
| lockfile | 1 | 194 | 348 |
| generated/build | 0 | 0 | 0 |

Untracked category summary:

| Category | Files |
| --- | ---: |
| docs | 43 |
| generated/build | 13 |
| tests | 8 |
| scripts | 8 |
| production source | 7 |
| config | 1 |

Name-status summary:

```text
git diff --name-status
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
M pnpm-lock.yaml
M scripts/smoke-cloudbase-health.mjs
M src/features/admin-workbench-auth/admin-workbench-auth.test.ts
M src/features/admin-workbench-auth/admin-workbench-auth.ts
M src/features/admin-workbench-auth/admin-workbench-guard.test.ts
M src/features/cloudbase-mall/cloudbase-mall.test.ts
M src/features/cloudbase-mall/customer-favorites.test.ts
M src/features/cloudbase-mall/customer-product-detail.ts
M src/features/cloudbase-mall/customer-product-list.ts
M src/features/cloudbase-mall/customer-shopping-bag.test.ts
M src/features/cloudbase-mall/owner-draft-review.ts
M src/features/cloudbase-mall/owner-products.ts
M src/features/cloudbase-mall/staff-image-tasks.ts
M src/features/customer-favorites/customer-favorites.test.ts
M src/features/customer-favorites/customer-favorites.ts
M src/features/customer-product-detail/customer-product-detail.ts
M src/features/customer-product-list/customer-product-list.ts
M src/features/customer-shopping-bag/customer-shopping-bag.test.ts
M src/features/customer-shopping-bag/customer-shopping-bag.ts
M src/features/mall-workflow/mall-workflow.ts
M src/features/owner-draft-review/owner-draft-review.test.ts
M src/features/owner-draft-review/owner-draft-review.ts
M src/features/owner-products/owner-products.ts
M src/features/staff-image-tasks/staff-image-tasks.test.ts
M src/features/staff-image-tasks/staff-image-tasks.ts
M src/pages/customer/customer-bottom-nav.test.ts
M src/pages/customer/favorites/index.test.ts
M src/pages/customer/favorites/index.vue
M src/pages/customer/mine/index.test.ts
M src/pages/customer/mine/index.vue
M src/pages/customer/product-detail/index.test.ts
M src/pages/customer/product-detail/index.vue
M src/pages/customer/product-list/index.test.ts
M src/pages/customer/product-list/index.vue
M src/pages/customer/shopping-bag/index.vue
M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts
M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts
M src/pages/owner/account-management/index.test.ts
M src/pages/owner/account-management/index.vue
M src/pages/owner/more/index.test.ts
M src/pages/owner/more/index.vue
M src/pages/owner/permissions/index.test.ts
M src/pages/owner/permissions/index.vue
M src/pages/owner/products/index.test.ts
M src/pages/owner/products/index.vue
M src/pages/owner/products/useOwnerProductsPageState.test.ts
M src/pages/owner/products/useOwnerProductsPageState.ts
M src/services/auth/cloudbase-wechat-auth-service.test.ts
M src/services/cloudbase/cloudbase-function-client.test.ts
M src/services/cloudbase/cloudbase-function-client.ts
M src/services/cloudbase/mall-api-client.test.ts
M src/services/cloudbase/mall-api-client.ts
M src/services/cloudbase/runtime-mall-api-client.test.ts
M src/services/cloudbase/runtime-mall-api-client.ts
M src/services/storage/cloudbase-upload-service.test.ts
M src/services/storage/product-image-url.test.ts
M src/services/storage/product-image-url.ts
M tsconfig.json
```

## Risk Conclusion

Current risk conclusion: awaiting manual acceptance.

Do not mark release PASS. Current automated evidence is strong enough to proceed to manual acceptance preparation, but customer-private CloudBase smoke still requires verified WeChat identity from WeChat DevTools or a real device. The broad dirty worktree also requires reviewable commit splitting before merge.
