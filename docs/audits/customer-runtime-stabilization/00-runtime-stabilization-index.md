# Customer Runtime Stabilization Index

Agent phase: `agents.prd_reporter.toml`

## Current Issue Summary

Customer-side Phase 1-5 work previously reached Codex review `PASS`, but WeChat Developer Tools / simulator manual acceptance failed on real CloudBase runtime behavior.

The current P0/P1 issue set is limited to customer runtime stabilization for:

- Shopping bag
- Favorites
- Mine

## Manual Acceptance Screenshot Errors

- Shopping bag page: `DATABASE_COLLECTION_NOT_EXIST: Db or Table not exist: shopping_bag_items`
- Favorites page: `DATABASE_COLLECTION_NOT_EXIST: Db or Table not exist: customer_favorites`
- Mine page: `DATABASE_COLLECTION_NOT_EXIST: Db or Table not exist: customer_favorites`

## Task Goals

- Prevent raw CloudBase errors from reaching customer pages.
- Ensure required customer-private CloudBase collections are covered by schema manifest, schema check, and staging apply flow.
- Keep customer-private data on backend verified customer identity.
- Restore usable empty states for shopping bag, favorites, and mine.
- Reduce duplicate requests and slow tab switching.
- Produce local verification, real CloudBase/staging verification, and manual WeChat acceptance evidence.

## Scope Not Allowed To Change

- No new payment, logistics, refunds, coupons, customer service, OCR, or merchant/admin features.
- No broad visual redesign or large style refactor.
- No direct page access to database collections, repositories, mockDb, or `wx.cloud`.
- No trust in frontend-provided `openid`, `customerId`, or `phoneNumber`.
- No test deletion, weakened assertions, or fixture edits that hide failures.
- No raw `DATABASE_COLLECTION_NOT_EXIST`, `ResourceNotFound`, `Db or Table not exist`, `docs.cloudbase.net`, stack traces, or raw JSON in page-facing UI.

## Subagent Invocation Plan

- `agents.prd_reporter.toml`: create and maintain task artifacts, verification records, manual checklist, and final report.
- `agents.prd_debugger.toml`: diagnose root causes, validate request chains, envId, CloudBase/schema state, and performance evidence.
- `agents.prd_planner.toml`: convert diagnosis into a bounded repair plan.
- `agents.prd_implementer.toml`: implement schema, backend, frontend, and performance fixes in scoped loops.
- `agents.prd_reviewer.toml`: review each implementation loop and produce `PASS` or `NEEDS_FIX`.

Explicit subagent support is available in the current Codex environment. The first `prd_debugger` subagent was started for Phase 1 evidence gathering while this reporter index was created locally.

## Current Git Status

Branch: `main`

Captured at: `2026-06-01 12:29:01 +08:00`

```text
 M .ai/TASK_STATE.md
 M cloudfunctions/mallApi/index.js
 M cloudfunctions/mallApi/mall-api-core.js
 M cloudfunctions/mallApi/mall-api-core.test.js
 M docs/contracts/page-facing-ui-contracts.md
 M src/features/cloudbase-mall/cloudbase-mall.test.ts
 M src/features/cloudbase-mall/customer-product-detail.ts
 M src/pages/customer/customer-bottom-nav.test.ts
 M src/pages/customer/mine/index.test.ts
 M src/pages/customer/mine/index.vue
 M src/pages/customer/shopping-bag/index.vue
 M src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts
 M src/services/cloudbase/mall-api-client.test.ts
 M src/services/cloudbase/mall-api-client.ts
?? _ai_review_context.zip
?? _ai_review_context/
?? cloudfunctions/mallApi/index.test.js
?? docs/prd/2026-06-01-customer-wechat-auth-mine-persistence-prd.md
?? docs/prd/debug-prd.md
?? src/features/cloudbase-mall/customer-mine.test.ts
?? src/features/cloudbase-mall/customer-mine.ts
?? src/features/customer-mine/
?? src/pages/customer/mine/useCustomerMinePageState.test.ts
?? src/pages/customer/mine/useCustomerMinePageState.ts
```

## Package Scripts Summary

- `test`: `vitest run --config vitest.config.ts`
- `build:mp-weixin`: `uni build -p mp-weixin`
- `verify`: lint, boundary check, tests, coverage, type check, backend verify, production audit, full audit
- `verify:full`: `verify` plus mp-weixin build and smoke
- `verify:backend`: backend tests and backend build
- `verify:api`: backend tests and backend build
- Existing CloudBase smoke scripts: `cloudbase:api:smoke`, `cloudbase:health:smoke`
- Missing at Phase 0: `cloudbase:schema:check`, `cloudbase:schema:apply:staging`, `verify:staging`

## Artifact Links

- [00 Runtime Stabilization Index](./00-runtime-stabilization-index.md)
- [01 Diagnosis](./01-diagnosis.md)
- [02 Execution Plan](../../plans/customer-runtime-stabilization/02-execution-plan.md)
- [03 CloudBase Schema Delivery Log](../../plans/customer-runtime-stabilization/03-cloudbase-schema-delivery-log.md)
- [04 Schema Review](./04-schema-review.md)
- [05 Backend Private Modules Delivery Log](../../plans/customer-runtime-stabilization/05-backend-private-modules-delivery-log.md)
- [06 Backend Review](./06-backend-review.md)
- [07 Frontend Error State Delivery Log](../../plans/customer-runtime-stabilization/07-frontend-error-state-delivery-log.md)
- [08 Frontend Review](./08-frontend-review.md)
- [09 Performance Delivery Log](../../plans/customer-runtime-stabilization/09-performance-delivery-log.md)
- [10 Performance Review](./10-performance-review.md)
- [11 Local Verification](./11-local-verification.md)
- [12 Staging Verification](./12-staging-verification.md)
- [13 Manual Acceptance](../../testing/customer-runtime-stabilization/13-manual-acceptance.md)
- [14 Final Report](./14-final-report.md)
