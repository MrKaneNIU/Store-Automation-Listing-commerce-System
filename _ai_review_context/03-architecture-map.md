# Architecture Map

## Layer Files

### app

- src/app/navigation.ts
- src/app/roles.ts
- src/app/routes.ts

### cloudfunctions/backend

- backend/src/api/errors.ts
- backend/src/api/handlers/mall-api.ts
- backend/src/api/routes.ts
- backend/src/api/schemas.ts
- backend/src/cloudbase/cloudbase-data-model.ts
- backend/src/cloudbase/cloudbase-env.ts
- backend/src/cloudbase/cloudbase-health.ts
- backend/src/cloudbase/cloudbase-mall-repository.ts
- backend/src/cloudbase/memory-cloudbase-document-store.ts
- backend/src/config/env.ts
- backend/src/db/client.ts
- backend/src/db/migrate.ts
- backend/src/db/migrations/202605090001_initial_phase_2_schema.ts
- backend/src/db/migrations/index.ts
- backend/src/http/errors.ts
- backend/src/http/response.ts
- backend/src/main.ts
- backend/src/operations/staging-restore-rehearsal.ts
- backend/src/server.ts
- cloudfunctions/mallApi/index.js
- cloudfunctions/mallApi/invoke-create-ocr-batch.json
- cloudfunctions/mallApi/invoke-get-latest-drafts.json
- cloudfunctions/mallApi/invoke-health.json
- cloudfunctions/mallApi/invoke-list-contracts.json
- cloudfunctions/mallApi/invoke-list-products.json
- cloudfunctions/mallApi/invoke-unsupported.json
- cloudfunctions/mallApi/mall-api-core.js
- cloudfunctions/mallApi/package.json
- cloudfunctions/mallApi/tencentcloud-ocr-provider.js
- cloudfunctions/mallHealth/index.js
- cloudfunctions/mallHealth/package.json

### domain

- src/domain/batch/rules.ts
- src/domain/batch/types.ts
- src/domain/catalog/rules.ts
- src/domain/catalog/types.ts
- src/domain/draft/rules.ts
- src/domain/draft/types.ts
- src/domain/inventory/types.ts
- src/domain/order/rules.ts
- src/domain/order/types.ts
- src/domain/shared/ids.ts

### features

- src/features/admin-permissions/admin-permissions.ts
- src/features/admin-workbench-auth/admin-workbench-auth.ts
- src/features/admin-workbench-auth/admin-workbench-entry.ts
- src/features/admin-workbench-auth/admin-workbench-guard.ts
- src/features/cloudbase-mall/customer-favorites.ts
- src/features/cloudbase-mall/customer-mine.ts
- src/features/cloudbase-mall/customer-product-detail.ts
- src/features/cloudbase-mall/customer-product-list.ts
- src/features/cloudbase-mall/customer-shopping-bag.ts
- src/features/cloudbase-mall/owner-dashboard.ts
- src/features/cloudbase-mall/owner-draft-review.ts
- src/features/cloudbase-mall/owner-orders.ts
- src/features/cloudbase-mall/owner-products.ts
- src/features/cloudbase-mall/owner-screenshot-import.ts
- src/features/cloudbase-mall/staff-image-tasks.ts
- src/features/customer-favorites/customer-favorites.ts
- src/features/customer-mine/customer-mine-page-state.ts
- src/features/customer-mine/customer-mine.ts
- src/features/customer-order/customer-order.ts
- src/features/customer-product-detail/customer-product-detail.ts
- src/features/customer-product-list/customer-product-list.ts
- src/features/customer-shopping-bag/customer-shopping-bag.ts
- src/features/draft-review/draft-review.ts
- src/features/homepage-settings/homepage-settings.ts
- src/features/mall-workflow/mall-access.ts
- src/features/mall-workflow/mall-workflow.ts
- src/features/owner-draft-review/owner-draft-review.ts
- src/features/owner-orders/owner-orders.ts
- src/features/owner-products/owner-products.ts
- src/features/owner-screenshot-import/owner-screenshot-import.ts
- src/features/staff-image-tasks/staff-image-tasks.ts

### other

- .agents/skills/cloudbase/SKILL.md
- .agents/skills/cloudbase/references/activation-map.yaml
- .agents/skills/cloudbase/references/ai-model-nodejs/SKILL.md
- .agents/skills/cloudbase/references/ai-model-web/SKILL.md
- .agents/skills/cloudbase/references/ai-model-wechat/SKILL.md
- .agents/skills/cloudbase/references/auth-nodejs/SKILL.md
- .agents/skills/cloudbase/references/auth-tool/SKILL.md
- .agents/skills/cloudbase/references/auth-tool/checklist.md
- .agents/skills/cloudbase/references/auth-web/SKILL.md
- .agents/skills/cloudbase/references/auth-wechat/SKILL.md
- .agents/skills/cloudbase/references/cloud-functions/SKILL.md
- .agents/skills/cloudbase/references/cloud-functions/checklist.md
- .agents/skills/cloudbase/references/cloud-functions/references.md
- .agents/skills/cloudbase/references/cloud-functions/references/event-functions.md
- .agents/skills/cloudbase/references/cloud-functions/references/http-functions.md
- .agents/skills/cloudbase/references/cloud-functions/references/operations-and-config.md
- .agents/skills/cloudbase/references/cloud-storage-web/SKILL.md
- .agents/skills/cloudbase/references/cloudbase-agent/SKILL.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/adapter-coze.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/adapter-development.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/adapter-langgraph.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/agent-deployment.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/authentication.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/references/observability.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/references/recipes.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/references/server.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/references/storage.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/references/tools.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/server-quickstart.md
- .agents/skills/cloudbase/references/cloudbase-agent/py/skill.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/adapter-development.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/adapter-langchain.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/adapter-langgraph.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/agent-deployment.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/agui-protocol.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/server-quickstart.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/skill.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/ui-clients.md
- .agents/skills/cloudbase/references/cloudbase-agent/ts/ui-miniprogram.md
- .agents/skills/cloudbase/references/cloudbase-cli/SKILL.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/access.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/app.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/cloudrun.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/core.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/functions.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/hosting.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/mysql.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/nosql.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/permission.md
- .agents/skills/cloudbase/references/cloudbase-cli/references/storage.md
- .agents/skills/cloudbase/references/cloudbase-platform/SKILL.md
- .agents/skills/cloudbase/references/cloudrun-development/SKILL.md
- .agents/skills/cloudbase/references/data-model-creation/SKILL.md
- .agents/skills/cloudbase/references/http-api/SKILL.md
- .agents/skills/cloudbase/references/http-api/checklist.md
- .agents/skills/cloudbase/references/mcp-setup.md
- .agents/skills/cloudbase/references/miniprogram-development/SKILL.md
- .agents/skills/cloudbase/references/miniprogram-development/references/cloudbase-integration.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/SKILL.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/aggregation.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/complex-queries.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/crud-operations.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/geolocation.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/pagination.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/realtime.md
- .agents/skills/cloudbase/references/no-sql-web-sdk/security-rules.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/SKILL.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/aggregation.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/complex-queries.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/crud-operations.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/geolocation.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/pagination.md
- .agents/skills/cloudbase/references/no-sql-wx-mp-sdk/security-rules.md
- .agents/skills/cloudbase/references/ops-inspector/SKILL.md
- .agents/skills/cloudbase/references/relational-database-tool/SKILL.md
- .agents/skills/cloudbase/references/relational-database-web/SKILL.md
- .agents/skills/cloudbase/references/spec-workflow/SKILL.md
- .agents/skills/cloudbase/references/ui-design/SKILL.md
- .agents/skills/cloudbase/references/ui-design/checklist.md
- .agents/skills/cloudbase/references/web-development/SKILL.md
- .agents/skills/cloudbase/references/web-development/browser-testing.md
- .agents/skills/cloudbase/references/web-development/frameworks.md
- .ai/FAVORITES_MODULE_E_ACCEPTANCE.md
- .ai/TASK_STATE.md
- .codex/agents/agents.prd_debugger.toml
- .codex/agents/agents.prd_implementer.toml
- .codex/agents/agents.prd_planner.toml
- .codex/agents/agents.prd_reporter.toml
- .codex/agents/agents.prd_reviewer.toml
- .codex/config.toml
- .github/workflows/ci.yml
- AGENTS.md
- README.md
- backend/README.md
- backend/tsconfig.json
- backend/vitest.config.ts
- cloudbaserc.json
- docs/architecture/module-boundaries.md
- docs/architecture/page-ui-boundary-inventory.md
- docs/architecture/system-overview.md
- docs/contracts/api-contract.md
- docs/contracts/cloudbase-data-model.md
- docs/contracts/database-schema.md
- docs/contracts/domain-contract.md
- docs/contracts/page-facing-ui-contracts.md
- docs/operations/backup-restore.md
- docs/operations/migration-runbook.md
- docs/operations/production-config-runbook.md
- docs/operations/production-config-snapshot.current.json
- docs/operations/production-config-snapshot.example.json
- docs/plans/2026-05-07-mall-mvp-delivery-log.md
- docs/plans/2026-05-07-mall-mvp-framework.md
- docs/plans/2026-05-08-customer-wechat-auth-order-delivery-log.md
- docs/plans/2026-05-08-harness-hardening-delivery-log.md
- docs/plans/2026-05-08-ui-boundary-engineering-delivery-log.md
- docs/plans/2026-05-09-cloudbase-console-setup-log.md
- docs/plans/2026-05-09-cloudbase-phase-2-execution-log.md
- docs/plans/2026-05-09-cloudbase-route-decision.md
- docs/plans/2026-05-09-phase-0-baseline-acceptance-log.md
- docs/plans/2026-05-09-phase-1-1-ui-boundary-review-log.md
- docs/plans/2026-05-09-phase-1-2-medium-risk-ui-boundary-log.md
- docs/plans/2026-05-09-phase-1-3-ui-contract-freeze-log.md
- docs/plans/2026-05-09-phase-2-1-backend-baseline-log.md
- docs/plans/2026-05-09-phase-2-2-database-migration-log.md
- docs/plans/2026-05-09-phase-2-3-repository-port-log.md
- docs/plans/2026-05-09-phase-2-4-api-contract-log.md
- docs/plans/2026-05-09-phase-2-5-backup-restore-log.md
- docs/plans/2026-05-09-phase-2-backend-handoff.md
- docs/plans/2026-05-09-phase-2-strict-prd-gate-review.md
- docs/plans/2026-05-10-phase-3-real-image-object-storage-log.md
- docs/plans/2026-05-11-phase-4-wechat-auth-role-permission-log.md
- docs/plans/2026-05-11-phase-5-order-inventory-audit-log.md
- docs/plans/2026-05-12-high-fashion-mall-ui-prototype-delivery-log.md
- docs/plans/2026-05-13-admin-workbench-high-fashion-ui-log.md
- docs/plans/2026-05-13-admin-workbench-real-miniprogram-migration-plan.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-a-audit-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-b-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-c-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-d-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-e-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-f-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-g-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-h-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-i-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-j-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-k-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-module-l-freeze-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-1-home-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-2-product-list-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-3-product-detail-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-4-admin-dashboard-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-5-admin-bottom-nav-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-6-owner-products-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-7-owner-orders-log.md
- docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-8-import-upload-log.md
- docs/plans/2026-05-18-high-fashion-real-miniprogram-visual-repair-module-10-staff-image-tasks-log.md
- docs/plans/2026-05-18-high-fashion-real-miniprogram-visual-repair-module-9-draft-review-log.md
- docs/plans/2026-05-18-post-freeze-ui-navigation-performance-log.md
- docs/plans/2026-05-19-risk-group-a-production-config-gate-log.md
- docs/plans/2026-05-19-risk-group-b-ocr-job-main-chain-log.md
- docs/plans/2026-05-21-admin-workbench-account-auth-log.md
- docs/plans/2026-05-22-admin-workbench-entry-nav-defect-fix.md
- docs/plans/2026-05-22-admin-workbench-repair-baseline.md
- docs/plans/2026-05-23-admin-workbench-ocr-to-image-task-handoff.md
- docs/plans/2026-05-25-product-management-operations-delivery-log.md
- docs/plans/2026-05-26-product-management-online-repair-handoff.md
- docs/plans/2026-05-27-project-latency-optimization-cloudbase-smoke-log.md
- docs/plans/2026-05-27-project-latency-optimization-handoff.md
- docs/plans/2026-05-27-project-latency-optimization-manual-acceptance-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-0-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-1-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-2-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-3-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-4-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-5-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-6-log.md
- docs/plans/2026-05-27-project-latency-optimization-module-7-log.md
- docs/plans/2026-05-27-shopping-bag-module-a-contract-log.md
- docs/plans/2026-05-27-shopping-bag-module-b-cloudbase-actions-log.md
- docs/plans/2026-05-28-shopping-bag-module-a-e-handoff.md
- docs/plans/2026-05-28-shopping-bag-module-c-facade-viewmodel-log.md
- docs/plans/2026-05-28-shopping-bag-module-d-ui-integration-log.md
- docs/plans/2026-05-28-shopping-bag-module-e-verification-acceptance-log.md
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
- docs/product/mvp-flow.md
- docs/prototypes/high-fashion-mall-ui/app.js
- docs/prototypes/high-fashion-mall-ui/index.html
- docs/prototypes/high-fashion-mall-ui/styles.css
- docs/quality/agent-failure-log.md
- docs/quality/review-checklist.md
- docs/testing/2026-05-27-page-performance-baseline.md
- docs/testing/test-strategy.md
- eslint.config.mjs
- index.html
- package.json
- pnpm-lock.yaml
- scripts/check-boundaries.mjs
- scripts/check-production-config.mjs
- scripts/cloudbase-bind-owner.mjs
- scripts/e2e-smoke.mjs
- scripts/repro-product-management-contract.mjs
- scripts/smoke-cloudbase-api.mjs
- scripts/smoke-cloudbase-health.mjs
- shims-uni.d.ts
- skills-lock.json
- src/App.vue
- src/env.d.ts
- src/main.ts
- src/manifest.json
- src/pages.json
- src/shime-uni.d.ts
- src/uni.scss
- tests/contracts/product-publish-validation-cases.cjs
- tsconfig.json
- vite.config.ts
- vitest.config.ts

### pages

- src/pages/customer/customer-bottom-nav.ts
- src/pages/customer/favorites/index.vue
- src/pages/customer/mine/index.vue
- src/pages/customer/mine/useCustomerMinePageState.ts
- src/pages/customer/product-detail/index.vue
- src/pages/customer/product-list/index.vue
- src/pages/customer/shopping-bag/index.vue
- src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts
- src/pages/index/index.vue
- src/pages/login/index.vue
- src/pages/owner/account-management/index.vue
- src/pages/owner/dashboard/index.vue
- src/pages/owner/draft-review/index.vue
- src/pages/owner/homepage-settings/index.vue
- src/pages/owner/import-upload/index.vue
- src/pages/owner/more/index.vue
- src/pages/owner/no-permission/index.vue
- src/pages/owner/orders/index.vue
- src/pages/owner/permissions/index.vue
- src/pages/owner/products/index.vue
- src/pages/owner/products/useOwnerProductsPageState.ts
- src/pages/staff/image-tasks/index.vue

### repositories/adapters

- backend/src/repositories/database-mall-repository.ts
- src/services/repositories/mall-repository-contract.ts
- src/services/repositories/mall-repository-port.ts
- src/services/repositories/mall-repository.ts
- src/services/repositories/memory-mall-repository.ts
- src/services/repositories/mock-db.ts

### services

- src/services/auth/admin-workbench-session.ts
- src/services/auth/cloudbase-wechat-auth-service.ts
- src/services/auth/customer-session.ts
- src/services/auth/mock-wechat-auth-service.ts
- src/services/auth/wechat-auth-service.ts
- src/services/cloudbase/cloudbase-function-client.ts
- src/services/cloudbase/mall-api-client.ts
- src/services/cloudbase/runtime-mall-api-client.ts
- src/services/ocr/http-ocr-provider.ts
- src/services/ocr/mock-ocr-provider.ts
- src/services/ocr/ocr-provider.ts
- src/services/ocr/tencentcloud-ocr-provider.ts
- src/services/performance/page-load-trace.ts
- src/services/privacy/runtime-wechat-privacy-service.ts
- src/services/privacy/wechat-privacy-service.ts
- src/services/storage/cloudbase-upload-service.ts
- src/services/storage/mock-upload-service.ts
- src/services/storage/product-image-url.ts
- src/services/storage/runtime-upload-service.ts
- src/services/storage/upload-service.ts

## Allowed Dependencies

- pages: render local UI state, call page-safe ViewModel/composables/facades; no repository/global-storage writes.
- app: route/role/navigation glue; may import shared app config and features, not page internals for business rules.
- features: orchestrate domain rules and service ports/adapters.
- domain: pure rules/types only; no features/services/pages/uni imports.
- services: external IO adapters, auth, storage, OCR, CloudBase clients, repository implementations.
- repositories/adapters: persistence contracts and implementations; should hide storage details from pages.
- cloudfunctions/backend: server-side API/router/repository and CloudBase integration.

## Actual Imports By Layer

### app

- src/app/customer-shopping-bag-routing.test.ts: `vitest`, `../pages.json`, `./routes`
- src/app/navigation.test.ts: `vitest`, `./navigation`, `./routes`
- src/app/navigation.ts: `./routes`
- src/app/pages-config.test.ts: `vitest`, `../pages.json`
- src/app/roles.ts: no imports found
- src/app/routes-more.test.ts: `vitest`, `./routes`
- src/app/routes.ts: no imports found

### cloudfunctions/backend

- backend/src/api/api-contract.test.ts: `node:http`, `node:module`, `node:http`, `pg-mem`, `vitest`, `../db/client`, `../db/migrate`, `../repositories/database-mall-repository`, `./handlers/mall-api`, `./routes`, `../../../tests/contracts/product-publish-validation-cases.cjs`
- backend/src/api/errors.ts: `../http/errors`
- backend/src/api/handlers/mall-api.ts: `../../http/errors`, `../../http/response`, `../errors`, `../schemas`
- backend/src/api/routes.ts: `node:http`, `./handlers/mall-api`, `./errors`
- backend/src/api/schemas.ts: `./errors`
- backend/src/cloudbase/cloudbase-data-model.test.ts: `vitest`, `./cloudbase-data-model`
- backend/src/cloudbase/cloudbase-data-model.ts: no imports found
- backend/src/cloudbase/cloudbase-env.test.ts: `vitest`, `./cloudbase-env`
- backend/src/cloudbase/cloudbase-env.ts: `../http/errors`
- backend/src/cloudbase/cloudbase-health.test.ts: `vitest`, `./cloudbase-health`
- backend/src/cloudbase/cloudbase-health.ts: `../http/response`, `./cloudbase-data-model`, `./cloudbase-env`
- backend/src/cloudbase/cloudbase-mall-repository.test.ts: `vitest`, `../../../src/services/repositories/mall-repository-contract`, `./cloudbase-mall-repository`, `./memory-cloudbase-document-store`
- backend/src/cloudbase/cloudbase-mall-repository.ts: `./memory-cloudbase-document-store`
- backend/src/cloudbase/memory-cloudbase-document-store.ts: no imports found
- backend/src/config/env.test.ts: `vitest`, `./env`
- backend/src/config/env.ts: `../http/errors`
- backend/src/db/client.ts: `pg`, `../http/errors`
- backend/src/db/migrate.ts: `node:crypto`, `./client`, `./migrations`, `../http/errors`
- backend/src/db/migration.test.ts: `pg-mem`, `vitest`, `./client`, `./migrate`
- backend/src/db/migrations/202605090001_initial_phase_2_schema.ts: `../migrate`
- backend/src/db/migrations/index.ts: `./202605090001_initial_phase_2_schema`
- backend/src/http/errors.ts: no imports found
- backend/src/http/response.test.ts: `vitest`, `./response`
- backend/src/http/response.ts: `node:http`, `./errors`
- backend/src/main.test.ts: `vitest`, `./main`
- backend/src/main.ts: `./config/env`, `./db/client`, `./db/migrate`, `./api/routes`, `./http/errors`, `./server`, `./repositories/database-mall-repository`
- backend/src/operations/staging-restore-rehearsal.test.ts: `vitest`, `./staging-restore-rehearsal`
- backend/src/operations/staging-restore-rehearsal.ts: `pg-mem`, `../db/client`, `../db/migrate`
- backend/src/server.test.ts: `vitest`, `./server`
- backend/src/server.ts: `node:http`, `node:http`, `./http/errors`, `./http/response`
- cloudfunctions/mallApi/index.js: `./mall-api-core`, `@cloudbase/node-sdk`, `@cloudbase/node-sdk`
- cloudfunctions/mallApi/mall-api-core.js: `./tencentcloud-ocr-provider`
- cloudfunctions/mallApi/mall-api-core.test.js: `node:module`, `vitest`, `./mall-api-core`, `../../tests/contracts/product-publish-validation-cases.cjs`
- cloudfunctions/mallApi/tencentcloud-ocr-provider.js: `tencentcloud-sdk-nodejs`
- cloudfunctions/mallHealth/index.js: no imports found
- cloudfunctions/mallApi/index.test.js: `node:module`, `vitest`, `./index`

### domain

- src/domain/batch/rules.test.ts: `vitest`, `./rules`, `./types`
- src/domain/batch/rules.ts: `./types`
- src/domain/batch/types.ts: no imports found
- src/domain/catalog/rules.test.ts: `node:module`, `vitest`, `./rules`, `./types`, `../draft/types`, `../../../tests/contracts/product-publish-validation-cases.cjs`
- src/domain/catalog/rules.ts: `../draft/types`, `../shared/ids`, `./types`
- src/domain/catalog/types.ts: no imports found
- src/domain/draft/rules.test.ts: `vitest`, `./rules`, `./types`
- src/domain/draft/rules.ts: `./types`
- src/domain/draft/types.ts: no imports found
- src/domain/inventory/types.ts: no imports found
- src/domain/order/rules.test.ts: `vitest`, `../catalog/types`, `./rules`
- src/domain/order/rules.ts: `../catalog/types`, `../catalog/types`, `../shared/ids`, `./types`
- src/domain/order/types.ts: no imports found
- src/domain/shared/ids.ts: no imports found

### features

- src/features/admin-permissions/admin-permissions.test.ts: `vitest`, `./admin-permissions`
- src/features/admin-permissions/admin-permissions.ts: `../../domain/shared/ids`
- src/features/admin-workbench-auth/admin-workbench-auth.test.ts: `vitest`, `./admin-workbench-auth`, `../../services/auth/admin-workbench-session`, `../admin-permissions/admin-permissions`
- src/features/admin-workbench-auth/admin-workbench-auth.ts: `../../services/auth/admin-workbench-session`, `../admin-permissions/admin-permissions`
- src/features/admin-workbench-auth/admin-workbench-entry.test.ts: `vitest`, `../../app/routes`, `../../services/auth/admin-workbench-session`, `./admin-workbench-entry`
- src/features/admin-workbench-auth/admin-workbench-entry.ts: `../../app/routes`, `../../services/auth/admin-workbench-session`
- src/features/admin-workbench-auth/admin-workbench-guard.test.ts: `vitest`, `../../app/navigation`, `./admin-workbench-guard`, `../../services/auth/admin-workbench-session`, `../admin-permissions/admin-permissions`, `./admin-workbench-auth`
- src/features/admin-workbench-auth/admin-workbench-guard.ts: `../../app/navigation`, `../../app/routes`, `../../services/auth/admin-workbench-session`, `../admin-permissions/admin-permissions`
- src/features/cloudbase-mall/cloudbase-mall.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `../../services/auth/customer-session`, `./owner-screenshot-import`, `./owner-products`, `./customer-product-detail`, `./owner-draft-review`, `./customer-product-list`, `./owner-orders`, `./owner-dashboard`, `./staff-image-tasks`
- src/features/cloudbase-mall/customer-favorites.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `../customer-favorites/customer-favorites`, `./customer-favorites`
- src/features/cloudbase-mall/customer-favorites.ts: `../../services/cloudbase/mall-api-client`, `../../services/cloudbase/runtime-mall-api-client`, `../customer-favorites/customer-favorites`
- src/features/cloudbase-mall/customer-product-detail.ts: `../../domain/catalog/types`, `../../domain/order/types`, `../../services/auth/mock-wechat-auth-service`, `../../services/auth/wechat-auth-service`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../../services/storage/product-image-url`, `../../services/storage/runtime-upload-service`, `../customer-product-detail/customer-product-detail`, `../customer-product-detail/customer-product-detail`
- src/features/cloudbase-mall/customer-product-list.ts: `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../../services/storage/product-image-url`, `../../services/storage/runtime-upload-service`, `../customer-product-list/customer-product-list`
- src/features/cloudbase-mall/customer-shopping-bag.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `./customer-shopping-bag`
- src/features/cloudbase-mall/customer-shopping-bag.ts: `../../services/cloudbase/mall-api-client`, `../../services/cloudbase/runtime-mall-api-client`, `../customer-shopping-bag/customer-shopping-bag`
- src/features/cloudbase-mall/owner-dashboard.ts: `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`
- src/features/cloudbase-mall/owner-draft-review.ts: `../../domain/draft/types`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../draft-review/draft-review`, `../owner-draft-review/owner-draft-review`
- src/features/cloudbase-mall/owner-orders.ts: `../../domain/order/types`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../owner-orders/owner-orders`
- src/features/cloudbase-mall/owner-products.ts: `../../domain/catalog/types`, `../../domain/catalog/rules`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../../services/storage/product-image-url`, `../../services/storage/runtime-upload-service`, `../owner-products/owner-products`
- src/features/cloudbase-mall/owner-screenshot-import.ts: `../../domain/batch/types`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../owner-screenshot-import/owner-screenshot-import`
- src/features/cloudbase-mall/staff-image-tasks.ts: `../../domain/catalog/types`, `../../services/cloudbase/runtime-mall-api-client`, `../../services/cloudbase/mall-api-client`, `../../services/storage/runtime-upload-service`, `../staff-image-tasks/staff-image-tasks`
- src/features/customer-favorites/customer-favorites.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `./customer-favorites`
- src/features/customer-favorites/customer-favorites.ts: `../../services/cloudbase/mall-api-client`
- src/features/customer-order/customer-order.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `../../services/auth/mock-wechat-auth-service`, `./customer-order`
- src/features/customer-order/customer-order.ts: `../../domain/order/types`, `../../domain/catalog/types`, `../../services/auth/wechat-auth-service`, `../mall-workflow/mall-workflow`
- src/features/customer-product-detail/customer-product-detail.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `../../services/auth/mock-wechat-auth-service`, `./customer-product-detail`
- src/features/customer-product-detail/customer-product-detail.ts: `../../domain/catalog/types`, `../../domain/order/types`, `../../services/auth/mock-wechat-auth-service`, `../../services/auth/wechat-auth-service`, `../customer-order/customer-order`, `../mall-workflow/mall-access`
- src/features/customer-product-list/customer-product-list.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./customer-product-list`
- src/features/customer-product-list/customer-product-list.ts: `../../domain/catalog/types`, `../mall-workflow/mall-access`
- src/features/customer-shopping-bag/customer-shopping-bag.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `./customer-shopping-bag`
- src/features/customer-shopping-bag/customer-shopping-bag.ts: `../../services/cloudbase/mall-api-client`
- src/features/draft-review/draft-review.test.ts: `vitest`, `../../domain/draft/types`, `./draft-review`
- src/features/draft-review/draft-review.ts: `../../domain/draft/types`
- src/features/homepage-settings/homepage-settings.test.ts: `vitest`, `./homepage-settings`
- src/features/homepage-settings/homepage-settings.ts: `../../domain/shared/ids`
- src/features/mall-workflow/mall-access.test.ts: `vitest`, `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/order/types`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./mall-access`
- src/features/mall-workflow/mall-access.ts: `../../domain/catalog/types`, `../../domain/catalog/rules`, `../../domain/draft/types`, `../../services/repositories/mall-repository`
- src/features/mall-workflow/mall-workflow.test.ts: `vitest`, `../../services/auth/mock-wechat-auth-service`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./mall-workflow`
- src/features/mall-workflow/mall-workflow.ts: `../../domain/batch/types`, `../../domain/catalog/rules`, `../../domain/catalog/types`, `../../domain/draft/rules`, `../../domain/order/rules`, `../../domain/shared/ids`, `../../services/auth/customer-session`, `../../services/ocr/mock-ocr-provider`, `../../services/repositories/mall-repository`, `../../services/storage/runtime-upload-service`
- src/features/mall-workflow/phase-5.test.ts: `vitest`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./mall-workflow`
- src/features/owner-draft-review/owner-draft-review.test.ts: `vitest`, `../../domain/draft/types`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `../mall-workflow/mall-workflow`, `./owner-draft-review`
- src/features/owner-draft-review/owner-draft-review.ts: `../../domain/draft/types`, `../../domain/draft/types`, `../../domain/draft/rules`, `../draft-review/draft-review`, `../mall-workflow/mall-access`, `../mall-workflow/mall-workflow`
- src/features/owner-orders/owner-orders.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./owner-orders`
- src/features/owner-orders/owner-orders.ts: `../../domain/order/types`, `../mall-workflow/mall-access`, `../mall-workflow/mall-workflow`
- src/features/owner-products/owner-products.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./owner-products`
- src/features/owner-products/owner-products.ts: `../../domain/catalog/types`, `../../domain/catalog/rules`, `../mall-workflow/mall-access`, `../mall-workflow/mall-workflow`
- src/features/owner-screenshot-import/owner-screenshot-import.test.ts: `vitest`, `../../services/repositories/mock-db`, `./owner-screenshot-import`
- src/features/owner-screenshot-import/owner-screenshot-import.ts: `../../domain/batch/types`, `../../domain/draft/types`, `../../domain/shared/ids`, `../mall-workflow/mall-workflow`
- src/features/staff-image-tasks/staff-image-tasks.test.ts: `vitest`, `../mall-workflow/mall-workflow`, `../../services/repositories/mall-repository`, `../../services/repositories/mock-db`, `./staff-image-tasks`
- src/features/staff-image-tasks/staff-image-tasks.ts: `../../domain/catalog/types`, `../mall-workflow/mall-access`, `../mall-workflow/mall-workflow`
- src/features/cloudbase-mall/customer-mine.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `./customer-mine`
- src/features/cloudbase-mall/customer-mine.ts: `../../services/cloudbase/mall-api-client`, `../../services/cloudbase/runtime-mall-api-client`, `../customer-mine/customer-mine`
- src/features/customer-mine/customer-mine-page-state.test.ts: `vitest`, `./customer-mine`, `./customer-mine-page-state`
- src/features/customer-mine/customer-mine-page-state.ts: `vue`, `./customer-mine`
- src/features/customer-mine/customer-mine.test.ts: `vitest`, `../../services/cloudbase/mall-api-client`, `./customer-mine`
- src/features/customer-mine/customer-mine.ts: `../../services/cloudbase/mall-api-client`

### other

- backend/vitest.config.ts: `vitest/config`
- docs/prototypes/high-fashion-mall-ui/app.js: no imports found
- eslint.config.mjs: `@eslint/js`, `eslint-plugin-vue`, `globals`, `typescript-eslint`
- scripts/check-boundaries.mjs: `node:fs`, `node:path`
- scripts/check-production-config.mjs: `node:fs`, `node:path`, `node:url`
- scripts/cloudbase-bind-owner.mjs: `node:module`, `@cloudbase/node-sdk`
- scripts/e2e-smoke.mjs: `node:fs`, `node:path`
- scripts/repro-product-management-contract.mjs: `node:child_process`, `node:module`, `node:fs`, `node:path`, `../cloudfunctions/mallApi/mall-api-core.js`
- scripts/smoke-cloudbase-api.mjs: `node:module`, `../cloudfunctions/mallApi/index.js`
- scripts/smoke-cloudbase-health.mjs: `node:module`, `../cloudfunctions/mallHealth/index.js`
- shims-uni.d.ts: `vue`
- src/App.vue: `@dcloudio/uni-app`, `./features/admin-workbench-auth/admin-workbench-entry`
- src/env.d.ts: `vue`
- src/main.ts: `vue`, `./App.vue`
- src/shime-uni.d.ts: no imports found
- tests/contracts/product-publish-validation-cases.cjs: no imports found
- vite.config.ts: `vite`, `@dcloudio/vite-plugin-uni`
- vitest.config.ts: `vitest/config`

### pages

- src/pages/customer/customer-bottom-nav.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/customer/customer-bottom-nav.ts: `../../app/routes`
- src/pages/customer/favorites/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/customer/favorites/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/cloudbase-mall/customer-favorites`, `../../../features/customer-favorites/customer-favorites`, `../customer-bottom-nav`
- src/pages/customer/mine/index.test.ts: `vitest`, `node:fs`, `node:path`, `./useCustomerMinePageState`
- src/pages/customer/mine/index.vue: `@dcloudio/uni-app`, `vue`, `../../../app/navigation`, `../../../app/routes`, `../customer-bottom-nav`, `./useCustomerMinePageState`
- src/pages/customer/product-detail/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/customer/product-detail/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/customer-product-detail/customer-product-detail`, `../../../features/cloudbase-mall/customer-product-detail`, `../../../features/cloudbase-mall/customer-favorites`, `../../../features/customer-favorites/customer-favorites`, `../../../features/cloudbase-mall/customer-shopping-bag`, `../../../services/auth/cloudbase-wechat-auth-service`
- src/pages/customer/product-list/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/customer/product-list/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/customer-product-list/customer-product-list`, `../../../features/cloudbase-mall/customer-product-list`, `../../../features/cloudbase-mall/customer-favorites`, `../../../features/customer-favorites/customer-favorites`, `../customer-bottom-nav`
- src/pages/customer/shopping-bag/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../customer-bottom-nav`, `./useCustomerShoppingBagPageState`
- src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.test.ts: `vitest`, `node:fs`, `node:path`, `../../../features/customer-shopping-bag/customer-shopping-bag`, `../../../features/cloudbase-mall/customer-shopping-bag`, `../../../services/cloudbase/mall-api-client`, `./useCustomerShoppingBagPageState`
- src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts: `vue`, `../../../features/customer-shopping-bag/customer-shopping-bag`, `../../../features/cloudbase-mall/customer-shopping-bag`
- src/pages/index/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/index/index.vue: `vue`, `@dcloudio/uni-app`, `../../app/navigation`, `../../app/routes`, `../../app/routes`, `../../features/admin-workbench-auth/admin-workbench-entry`, `../../features/homepage-settings/homepage-settings`, `../customer/customer-bottom-nav`
- src/pages/login/index.test.ts: `vitest`, `node:fs`, `node:path`, `../../services/auth/admin-workbench-session`, `../../features/admin-workbench-auth/admin-workbench-auth`
- src/pages/login/index.vue: `vue`, `../../app/navigation`, `../../app/routes`, `../../features/admin-workbench-auth/admin-workbench-auth`
- src/pages/owner/account-management/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/account-management/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-auth`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/admin-permissions/admin-permissions`, `../../../services/auth/admin-workbench-session`
- src/pages/owner/admin-nav-style.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/dashboard/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/dashboard/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/cloudbase-mall/owner-dashboard`
- src/pages/owner/draft-review/index.test.ts: `vitest`, `node:fs`, `node:path`, `../../../app/navigation`, `../../../app/routes`
- src/pages/owner/draft-review/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-draft-review/owner-draft-review`, `../../../features/cloudbase-mall/owner-draft-review`
- src/pages/owner/homepage-settings/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/homepage-settings/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/homepage-settings/homepage-settings`
- src/pages/owner/import-upload/index.vue: `@dcloudio/uni-app`, `vue`, `../../../domain/batch/types`, `../../../domain/draft/types`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-screenshot-import/owner-screenshot-import`, `../../../features/cloudbase-mall/owner-screenshot-import`, `../../../services/storage/runtime-upload-service`
- src/pages/owner/more/index.test.ts: `vitest`, `node:fs`, `node:path`, `../../../app/navigation`
- src/pages/owner/more/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../app/routes`
- src/pages/owner/navigation-recovery.test.ts: `vitest`, `node:fs`, `node:path`, `./useOwnerProductsPageState`
- src/pages/owner/no-permission/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`
- src/pages/owner/orders/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/orders/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-orders/owner-orders`, `../../../features/cloudbase-mall/owner-orders`
- src/pages/owner/permissions/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/owner/permissions/index.vue: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../services/auth/admin-workbench-session`, `../../../features/admin-permissions/admin-permissions`
- src/pages/owner/products/index.test.ts: `vitest`, `node:fs`, `node:path`, `./useOwnerProductsPageState`
- src/pages/owner/products/index.vue: `./useOwnerProductsPageState`
- src/pages/owner/products/useOwnerProductsPageState.test.ts: `node:fs`, `node:path`, `vitest`, `vue`, `./useOwnerProductsPageState`, `./useOwnerProductsPageState`
- src/pages/owner/products/useOwnerProductsPageState.ts: `vue`, `@dcloudio/uni-app`, `../../../app/navigation`, `../../../app/routes`, `../../../app/routes`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/owner-products/owner-products`, `../../../features/cloudbase-mall/owner-products`, `../../../services/storage/product-image-url`
- src/pages/staff/image-tasks/index.test.ts: `vitest`, `node:fs`, `node:path`
- src/pages/staff/image-tasks/index.vue: `vue`, `@dcloudio/uni-app`, `../../../features/admin-workbench-auth/admin-workbench-guard`, `../../../features/staff-image-tasks/staff-image-tasks`, `../../../features/cloudbase-mall/staff-image-tasks`
- src/pages/customer/mine/useCustomerMinePageState.test.ts: `vitest`, `../../../features/customer-mine/customer-mine`, `./useCustomerMinePageState`
- src/pages/customer/mine/useCustomerMinePageState.ts: `../../../features/cloudbase-mall/customer-mine`, `../../../features/customer-mine/customer-mine-page-state`, `../../../features/customer-mine/customer-mine`

### repositories/adapters

- backend/src/repositories/database-mall-repository.test.ts: `pg-mem`, `vitest`, `../../../src/domain/catalog/rules`, `../../../src/domain/draft/rules`, `../../../src/domain/order/rules`, `../../../src/services/repositories/mall-repository-contract`, `../db/client`, `../db/migrate`, `./database-mall-repository`
- backend/src/repositories/database-mall-repository.ts: `../db/client`
- src/services/repositories/mall-repository-contract.test.ts: `./mall-repository-contract`, `./memory-mall-repository`, `./mock-db`
- src/services/repositories/mall-repository-contract.ts: `vitest`, `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/inventory/types`, `../../domain/order/types`, `./mall-repository-port`
- src/services/repositories/mall-repository-port.ts: `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/inventory/types`, `../../domain/order/types`
- src/services/repositories/mall-repository.test.ts: `vitest`, `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/order/types`, `./mall-repository`, `./mock-db`
- src/services/repositories/mall-repository.ts: `./memory-mall-repository`
- src/services/repositories/memory-mall-repository.ts: `./mall-repository-port`, `./mock-db`
- src/services/repositories/mock-db.ts: `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/inventory/types`, `../../domain/order/types`

### services

- src/services/auth/admin-workbench-session.test.ts: `vitest`, `./admin-workbench-session`
- src/services/auth/admin-workbench-session.ts: `../../domain/shared/ids`
- src/services/auth/cloudbase-wechat-auth-service.test.ts: `vitest`, `../cloudbase/mall-api-client`, `./cloudbase-wechat-auth-service`
- src/services/auth/cloudbase-wechat-auth-service.ts: `../../domain/shared/ids`, `../cloudbase/mall-api-client`, `../cloudbase/runtime-mall-api-client`, `./customer-session`, `./wechat-auth-service`
- src/services/auth/customer-session.ts: no imports found
- src/services/auth/mock-wechat-auth-service.test.ts: `vitest`, `./mock-wechat-auth-service`
- src/services/auth/mock-wechat-auth-service.ts: `../../domain/shared/ids`, `./customer-session`, `./wechat-auth-service`
- src/services/auth/wechat-auth-service.ts: `./customer-session`
- src/services/cloudbase/cloudbase-function-client.test.ts: `vitest`, `./cloudbase-function-client`
- src/services/cloudbase/cloudbase-function-client.ts: no imports found
- src/services/cloudbase/mall-api-client.test.ts: `vitest`, `./mall-api-client`, `../auth/admin-workbench-session`
- src/services/cloudbase/mall-api-client.ts: `../../domain/batch/types`, `../../domain/catalog/types`, `../../domain/draft/types`, `../../domain/order/types`, `../auth/customer-session`, `../auth/admin-workbench-session`, `./cloudbase-function-client`
- src/services/cloudbase/runtime-mall-api-client.test.ts: `vitest`, `./runtime-mall-api-client`
- src/services/cloudbase/runtime-mall-api-client.ts: `./cloudbase-function-client`, `./mall-api-client`
- src/services/ocr/http-ocr-provider.test.ts: `vitest`, `./http-ocr-provider`
- src/services/ocr/http-ocr-provider.ts: `../../domain/draft/rules`, `../../domain/draft/types`, `../../domain/shared/ids`, `./ocr-provider`
- src/services/ocr/mock-ocr-provider.test.ts: `vitest`, `./mock-ocr-provider`
- src/services/ocr/mock-ocr-provider.ts: `../../domain/draft/rules`, `../../domain/shared/ids`, `./ocr-provider`
- src/services/ocr/ocr-provider.ts: `../../domain/batch/types`, `../../domain/draft/types`
- src/services/ocr/tencentcloud-ocr-provider.test.ts: `vitest`, `./tencentcloud-ocr-provider`, `./tencentcloud-ocr-provider`
- src/services/ocr/tencentcloud-ocr-provider.ts: `tencentcloud-sdk-nodejs`, `../../domain/draft/rules`, `../../domain/draft/types`, `../../domain/shared/ids`, `./ocr-provider`
- src/services/performance/page-load-trace.test.ts: `vitest`, `./page-load-trace`
- src/services/performance/page-load-trace.ts: no imports found
- src/services/privacy/runtime-wechat-privacy-service.test.ts: `vitest`, `./runtime-wechat-privacy-service`, `./wechat-privacy-service`
- src/services/privacy/runtime-wechat-privacy-service.ts: `./wechat-privacy-service`
- src/services/privacy/wechat-privacy-service.ts: no imports found
- src/services/storage/cloudbase-upload-service.test.ts: `vitest`
- src/services/storage/cloudbase-upload-service.ts: `../../domain/shared/ids`, `./upload-service`
- src/services/storage/mock-upload-service.test.ts: `vitest`, `./mock-upload-service`
- src/services/storage/mock-upload-service.ts: `../../domain/shared/ids`, `./upload-service`
- src/services/storage/product-image-url.test.ts: `vitest`, `./product-image-url`
- src/services/storage/product-image-url.ts: `./upload-service`
- src/services/storage/runtime-upload-service.test.ts: `vitest`
- src/services/storage/runtime-upload-service.ts: `./upload-service`, `./cloudbase-upload-service`, `./mock-upload-service`
- src/services/storage/upload-service.ts: no imports found

### tests

- scripts/check-production-config.test.mjs: `node:assert/strict`, `node:test`, `./check-production-config.mjs`

## Direct Page Boundary Scan

- P2 src/pages/customer/favorites/index.vue: flags=cloudbase, order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/cloudbase-mall/customer-favorites, ../../../features/customer-favorites/customer-favorites, ../customer-bottom-nav
- P2 src/pages/customer/mine/index.vue: flags=openid, customerId, phone, order; imports=@dcloudio/uni-app, vue, ../../../app/navigation, ../../../app/routes, ../customer-bottom-nav, ./useCustomerMinePageState
- P2 src/pages/customer/product-detail/index.vue: flags=cloudbase, phone, stock, order, publish; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/customer-product-detail/customer-product-detail, ../../../features/cloudbase-mall/customer-product-detail, ../../../features/cloudbase-mall/customer-favorites, ../../../features/customer-favorites/customer-favorites, ../../../features/cloudbase-mall/customer-shopping-bag, ../../../services/auth/cloudbase-wechat-auth-service
- P2 src/pages/customer/product-list/index.vue: flags=cloudbase, order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/customer-product-list/customer-product-list, ../../../features/cloudbase-mall/customer-product-list, ../../../features/cloudbase-mall/customer-favorites, ../../../features/customer-favorites/customer-favorites, ../customer-bottom-nav
- P2 src/pages/customer/shopping-bag/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../customer-bottom-nav, ./useCustomerShoppingBagPageState
- P3 src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts: flags=cloudbase, customerId; imports=vue, ../../../features/customer-shopping-bag/customer-shopping-bag, ../../../features/cloudbase-mall/customer-shopping-bag
- P2 src/pages/index/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../app/navigation, ../../app/routes, ../../app/routes, ../../features/admin-workbench-auth/admin-workbench-entry, ../../features/homepage-settings/homepage-settings, ../customer/customer-bottom-nav
- P2 src/pages/login/index.vue: flags=order; imports=vue, ../../app/navigation, ../../app/routes, ../../features/admin-workbench-auth/admin-workbench-auth
- P2 src/pages/owner/account-management/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-auth, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/admin-permissions/admin-permissions, ../../../services/auth/admin-workbench-session
- P2 src/pages/owner/dashboard/index.vue: flags=cloudbase, upload, order, draft; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/cloudbase-mall/owner-dashboard
- P2 src/pages/owner/draft-review/index.vue: flags=cloudbase, ocr, stock, order, draft; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/owner-draft-review/owner-draft-review, ../../../features/cloudbase-mall/owner-draft-review
- P2 src/pages/owner/homepage-settings/index.vue: flags=upload, order, draft; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/homepage-settings/homepage-settings
- P2 src/pages/owner/import-upload/index.vue: flags=cloudbase, ocr, upload, order, draft; imports=@dcloudio/uni-app, vue, ../../../domain/batch/types, ../../../domain/draft/types, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/owner-screenshot-import/owner-screenshot-import, ../../../features/cloudbase-mall/owner-screenshot-import, ../../../services/storage/runtime-upload-service
- P2 src/pages/owner/more/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../app/routes
- P2 src/pages/owner/no-permission/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard
- P2 src/pages/owner/orders/index.vue: flags=cloudbase, phone, order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/owner-orders/owner-orders, ../../../features/cloudbase-mall/owner-orders
- P2 src/pages/owner/permissions/index.vue: flags=order; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../services/auth/admin-workbench-session, ../../../features/admin-permissions/admin-permissions
- P2 src/pages/owner/products/index.vue: flags=stock, order, draft, publish; imports=./useOwnerProductsPageState
- P2 src/pages/owner/products/useOwnerProductsPageState.ts: flags=cloudbase, stock, draft, publish; imports=vue, @dcloudio/uni-app, ../../../app/navigation, ../../../app/routes, ../../../app/routes, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/owner-products/owner-products, ../../../features/cloudbase-mall/owner-products, ../../../services/storage/product-image-url
- P2 src/pages/staff/image-tasks/index.vue: flags=cloudbase, ocr, order; imports=vue, @dcloudio/uni-app, ../../../features/admin-workbench-auth/admin-workbench-guard, ../../../features/staff-image-tasks/staff-image-tasks, ../../../features/cloudbase-mall/staff-image-tasks
- P3 src/pages/customer/mine/useCustomerMinePageState.ts: flags=cloudbase; imports=../../../features/cloudbase-mall/customer-mine, ../../../features/customer-mine/customer-mine-page-state, ../../../features/customer-mine/customer-mine

## Domain Boundary Scan

- No domain forbidden imports found.

## Boundary Risks

- No domain imports of features/services/pages/uni found by regex scan.
- No page direct repository or wx.cloud imports found by regex scan.