# Real Device Acceptance Failure - Baseline

Captured: 2026-06-01 14:00:00 +08:00

Agent phase: `agents.prd_reporter.toml`

## Current Status

Status: FAIL

This supersedes the previous customer runtime stabilization `CONDITIONAL PASS`.

Reason: the user completed real-device / WeChat Developer Tools manual acceptance and reported new real runtime failures. Local automation, build smoke, staging smoke, or previous conditional results must not be treated as final acceptance.

Final `PASS` is blocked until the real-device / WeChat Developer Tools checklist passes again.

## User-Reported Raw Error

Observed on customer shopping bag, favorites, and mine pages:

```text
module 'services/performance/url.js' is not defined, require args is 'url'
```

This raw module/runtime error must not be shown to customers, and the root cause must be fixed rather than hidden.

## Failure List

### P0. Customer Shopping Bag / Favorites / Mine Runtime Module Failure

Affected pages:

- Shopping bag
- Favorites
- Mine

Observed error:

- `module 'services/performance/url.js' is not defined, require args is 'url'`

Requirements:

- No raw module error in UI.
- No English technical error in UI.
- No `require args`, stack trace, or raw JSON in UI.
- Root cause must be removed from the mini-program runtime bundle.
- Pages must show a normal empty state or short Chinese recoverable error.

### P0. Product Image Preview Missing

Affected paths:

- Product detail hero image area renders blank / gray block.
- Owner product management still shows `NO IMAGE` after uploaded supplemental images.
- Customer product detail cannot display product image.

Requirements:

- Owner product management shows uploaded images.
- Customer product list and detail show product main images.
- Images remain visible after refresh and mini-program restart.
- CloudBase `fileID` / temporary URL handling must be verified.
- Mock images are not acceptable evidence.

### P0. Product Detail Order Creation Fails

Affected path:

- Product detail shows product and SKU, but checkout cannot create an order.

Requirements:

- Anonymous browsing remains available.
- WeChat identity and phone authorization are triggered only when placing order.
- Phone authorization cancel creates no order and deducts no stock.
- Phone authorization success creates order.
- `orders.customer_id` points to the backend verified customer.
- Merchant side can see pending confirmation order.
- Frontend `openid`, `customerId`, and `phoneNumber` are not trusted.
- Inventory reservation, oversell prevention, and cancel-release rules must remain intact.

### P1. Draft Confirmation Does Not Clear Confirmed Drafts

Affected path:

- After draft confirmation succeeds, confirmed drafts remain in pending list or current batch view.

Requirements:

- Confirmed drafts are removed from pending list.
- Current batch summary refreshes.
- Unconfirmed drafts must not be removed by mistake.
- Refreshing the page keeps state consistent.

### P1. Staff Image Task Batch Filter Labels Are Unclear

Affected path:

- Staff supplemental image task batch filter labels are not readable.

Requirements:

- Batch filter options must show human-readable Chinese metadata.
- At minimum include batch number, upload time, status, pending image count, completed image count, or equivalent clear wording.
- Do not show only opaque internal IDs.
- Do not change supplemental image business rules.

### P1. Owner Product Management Image Preview Still Shows NO IMAGE

Affected path:

- Products with uploaded SKU/supplemental images still show `NO IMAGE` in product management preview.

Requirements:

- Product management must use real uploaded main/detail image data.
- Product cards/previews show images when available.
- `NO IMAGE` appears only when no usable image exists.
- Uploading supplemental images makes images visible immediately or after refresh.

### P1. Account Management / Registration Wording Or Password Fields Are Inconsistent

Affected path:

- More / account management registration module has only new account ID and no password field.

Requirements:

- First diagnose the current admin account system.
- If it is username/password login, registration needs password and confirm password, and backend must not store plaintext passwords.
- If it is account binding/invitation, UI must not call it account registration; it should be account binding or account invitation with clear explanation.
- Do not change customer-side WeChat login into account/password login.

## Current Git Branch

```text
main
```

## Current Git Status

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
 M src/features/cloudbase-mall/cloudbase-mall.test.ts
 M src/features/cloudbase-mall/customer-product-detail.ts
 M src/features/customer-favorites/customer-favorites.test.ts
 M src/features/customer-favorites/customer-favorites.ts
 M src/features/customer-shopping-bag/customer-shopping-bag.test.ts
 M src/features/customer-shopping-bag/customer-shopping-bag.ts
 M src/pages/customer/customer-bottom-nav.test.ts
 M src/pages/customer/favorites/index.test.ts
 M src/pages/customer/favorites/index.vue
 M src/pages/customer/mine/index.test.ts
 M src/pages/customer/mine/index.vue
 M src/pages/customer/shopping-bag/index.vue
 M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts
 M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts
 M src/services/cloudbase/cloudbase-function-client.test.ts
 M src/services/cloudbase/cloudbase-function-client.ts
 M src/services/cloudbase/mall-api-client.test.ts
 M src/services/cloudbase/mall-api-client.ts
 M src/services/cloudbase/runtime-mall-api-client.test.ts
 M src/services/cloudbase/runtime-mall-api-client.ts
?? _ai_review_context.zip
?? _ai_review_context/
?? cloudfunctions/mallApi/index.test.js
?? config/
?? docs/audits/
?? docs/plans/customer-runtime-stabilization/
?? docs/prd/2026-06-01-customer-wechat-auth-mine-persistence-prd.md
?? docs/prd/debug-prd.md
?? docs/testing/customer-runtime-stabilization/
?? scripts/cloudbase-schema-apply-staging.mjs
?? scripts/cloudbase-schema-check.mjs
?? scripts/cloudbase-schema-utils.mjs
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

The worktree was already dirty before this new failure-baseline artifact. Do not revert unrelated user or previous-session changes.

## Current mallApi Deployment State

EnvId:

```text
cloud1-d7gifjyzl7721b383
```

Function:

```text
mallApi
```

Observed through CloudBase MCP:

- Runtime: `Nodejs18.15`
- Namespace: `cloud1-d7gifjyzl7721b383`
- Status: `Active`
- AvailableStatus: `Available`
- ModTime: `2026-06-01 13:23:03`

Previous deploy request id recorded in the prior stabilization run:

```text
b12e2f64-0417-4ed0-a4f9-05fc5814cf35
```

Note: CloudBase management output includes environment variable values. Secret values are intentionally not copied into this artifact.

## Current Build Artifact

Mini-program build artifact path:

```text
dist/build/mp-weixin
```

Observed locally:

- Exists: yes
- LastWriteTime: `2026-06-01 13:39:40 +08:00`

This proves a local build artifact exists. It does not prove the user imported that exact artifact into WeChat Developer Tools during the failed manual acceptance.

## Phase Plan Index

- Phase 0: Reporter establishes this failure baseline.
- Phase 1: Debugger diagnoses mini-program runtime module missing root cause for `services/performance/url.js`.
- Phase 2: Implementer fixes runtime module missing and raw error exposure.
- Phase 3: Reviewer audits runtime module fix.
- Phase 4: Debugger diagnoses product image chain.
- Phase 5: Implementer fixes owner/customer image display.
- Phase 6: Reviewer audits image fix.
- Phase 7: Debugger diagnoses product-detail order failure.
- Phase 8: Implementer fixes order flow.
- Phase 9: Reviewer audits order fix.
- Phase 10: Implementer fixes admin-side gaps.
- Phase 11: Reviewer audits admin-side fixes.
- Phase 12: Debugger/Reporter records full automated verification.
- Phase 13: Debugger records deploy/build artifact confirmation.
- Phase 14: Reporter generates manual acceptance checklist.
- Phase 15: Reporter generates final report.

## Stop Conditions

Allowed final statuses:

- `PASS`: automation, deployment, WeChat Developer Tools, and real-device manual acceptance all pass.
- `CONDITIONAL PASS`: code and automation complete, but this environment cannot execute WeChat Developer Tools / real-device acceptance; user must complete the manual checklist.
- `FAIL`: an unfixed P0/P1 blocker remains or required automation fails.

Current status remains `FAIL` until at least Phase 1 diagnosis and the required fixes are completed.
