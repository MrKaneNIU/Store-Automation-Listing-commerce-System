# AI Review Context Package

- Project name: vx-close-system
- Generated at: 2026-06-01T02:00:24.925Z
- Technical stack: uni-app + Vue 3 + TypeScript + Vite/Vitest + ESLint; WeChat Mini Program target via @dcloudio/uni-mp-weixin; backend/cloud functions via Node/TypeScript, CloudBase, Tencent Cloud SDK, pg/pg-mem.
- Current branch: main
- Current git status summary:

```
M .ai/TASK_STATE.md
 M cloudfunctions/mallApi/index.js
 M cloudfunctions/mallApi/mall-api-core.js
 M cloudfunctions/mallApi/mall-api-core.test.js
 M docs/contracts/page-facing-[REDACTED_ID].md
 M src/pages/customer/customer-bottom-nav.test.ts
 M src/pages/customer/mine/index.test.ts
 M src/pages/customer/mine/index.vue
 M src/services/cloudbase/mall-api-client.test.ts
 M src/services/cloudbase/mall-api-client.ts
?? _ai_review_context/
?? cloudfunctions/mallApi/index.test.js
?? src/features/cloudbase-mall/customer-mine.test.ts
?? src/features/cloudbase-mall/customer-mine.ts
?? src/features/customer-mine/
?? src/pages/customer/mine/useCustomerMinePageState.test.ts
?? src/pages/customer/mine/useCustomerMinePageState.ts
```

## PRD Files

- docs/prd/2026-05-07-mall-mvp-prd.md
- docs/prd/2026-05-08-customer-wechat-auth-order-prd.md
- docs/prd/2026-05-08-enterprise-launch-master-prd.md
- docs/prd/2026-05-08-ui-boundary-engineering-prd.md
- docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md
- docs/prd/2026-05-11-phase-4-wechat-auth-role-permission-prd.md
- docs/prd/2026-05-12-high-fashion-mall-ui-reference-prd.md
- docs/prd/2026-05-12-phase-6-admin-ocr-ui-prototype-prd.md
- docs/prd/2026-05-13-admin-workbench-high-fashion-ui-prd.md
- docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md
- docs/prd/2026-05-19-enterprise-launch-risk-grouped-prd.md
- docs/prd/2026-05-21-admin-workbench-account-auth-prd.md
- docs/prd/2026-05-25-product-management-operations-prd.md
- docs/prd/2026-05-27-customer-mine-module-prd.md
- docs/prd/2026-05-27-favorites-module-prd.md
- docs/prd/2026-05-27-project-latency-optimization-prd.md
- docs/prd/2026-05-27-shopping-bag-module-prd.md
- docs/prd/README.md

## 20 Important Source Entry Files

- src/main.ts
- src/App.vue
- src/pages.json
- src/manifest.json
- src/app/routes.ts
- src/app/navigation.ts
- src/pages/index/index.vue
- src/pages/customer/product-list/index.vue
- src/pages/customer/product-detail/index.vue
- src/pages/customer/shopping-bag/index.vue
- src/pages/owner/import-upload/index.vue
- src/pages/owner/draft-review/index.vue
- src/pages/owner/products/index.vue
- src/pages/owner/orders/index.vue
- src/pages/staff/image-tasks/index.vue
- src/features/mall-workflow/mall-workflow.ts
- src/features/cloudbase-mall/customer-product-detail.ts
- src/services/repositories/mall-repository-port.ts
- src/services/repositories/memory-mall-repository.ts
- cloudfunctions/mallApi/mall-api-core.js

## How To Read

- Start with `03-architecture-map.md` to understand current layering and import boundaries.
- Read `04-business-flow-trace.md` for the main upload-to-order lifecycle.
- Use `06-critical-source-excerpts.md` as a path-and-line index into the business logic.
- Use `07-test-coverage-map.md` and `08-command-results.md` for verification evidence.
- Use `09-risk-and-gap-list.md` and `10-redaction-report.md` before any security or launch decision.

All copied snippets are redacted for phones, openids, obvious secrets, and CloudBase environment-like identifiers.