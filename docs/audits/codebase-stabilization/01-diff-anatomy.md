# Diff Anatomy

Captured: 2026-06-02
Role: Debugger
PRD phase: 1
Scope: read-only diff anatomy; no business-code changes

Current dirty worktree summary from phase 0:

- 68 tracked modified files.
- 80 untracked files.
- No deleted files observed.
- Current large diff is a multi-round acceptance repair bundle, not a review-ready single topic.

## A. CloudBase Schema / Deployment / Staging Smoke

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/src/cloudbase/cloudbase-data-model.ts`, `backend/src/cloudbase/cloudbase-data-model.test.ts`, `backend/src/cloudbase/cloudbase-health.test.ts`, `cloudfunctions/mallHealth/index.js`, `scripts/smoke-cloudbase-health.mjs` | modified | Adds customer-private collections and updates health collection count from 14 to 16. | yes | yes | no | P1 | no |
| `config/cloudbase/schema.required.json`, `scripts/cloudbase-schema-check.mjs`, `scripts/cloudbase-schema-apply-staging.mjs`, `scripts/cloudbase-schema-utils.mjs`, `scripts/verify-staging.mjs` | added | Adds schema manifest, schema check/apply tooling, and staging smoke that treats private customer `UNAUTHORIZED` as expected without verified WeChat identity. | yes | yes | yes | P1 | no |
| `cloudfunctions/mallApi/index.js`, `cloudfunctions/mallApi/mall-api-core.js` | modified | Adds trusted runtime identity handling, error normalization, and new action exposure. | yes | no, SPLIT_NEEDED | yes | P0 | medium: shared core mixes A/C/E/F |

## B. Customer Runtime Error Handling

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/services/cloudbase/cloudbase-function-client.ts`, `src/services/cloudbase/cloudbase-function-client.test.ts`, `src/services/cloudbase/runtime-mall-api-client.ts`, `src/services/cloudbase/runtime-mall-api-client.test.ts` | modified | Maps raw CloudBase/schema/auth failures to user-safe messages and removes raw runtime details from user-facing failures. | yes | yes | yes | P1 | no |
| `src/features/customer-favorites/customer-favorites.ts`, `src/features/customer-shopping-bag/customer-shopping-bag.ts`, `src/features/cloudbase-mall/customer-product-detail.ts` | modified | Routes customer runtime failures through shared formatter. | yes | no, pair with feature commits | yes | P2 | no |

## C. Shopping Bag / Favorites / Mine

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/features/customer-mine/*`, `src/pages/customer/mine/useCustomerMinePageState.ts`, related tests | added | Adds customer Mine ViewModel/page-state path backed by customer snapshot. | yes | yes | yes | P1 | medium |
| `src/pages/customer/mine/index.vue`, `src/pages/customer/mine/index.test.ts` | modified | Replaces placeholder Mine page with runtime-backed identity, phone, utilities, and recent orders. | yes | yes | yes | P1 | high: large UI/state expansion |
| `src/features/customer-favorites/*`, `src/pages/customer/favorites/*`, `src/features/customer-shopping-bag/*`, `src/pages/customer/shopping-bag/*` | modified/added | Stabilizes runtime error handling, request dedupe, page state, and tests. | yes | yes | yes | P2 | low |
| `src/services/cloudbase/mall-api-client.ts`, `cloudfunctions/mallApi/mall-api-core.js` | modified | Adds `getCustomerMineSnapshot` client/backend contract. | yes | no, SPLIT_NEEDED | yes | P1 | medium |

## D. Image Upload / Temp URL / Image Audit / Image Repair

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/services/storage/product-image-url.ts`, `src/services/storage/product-image-url.test.ts`, `src/services/storage/product-image-audit.ts`, `src/services/storage/product-image-audit.test.ts`, `src/services/storage/cloudbase-upload-service.test.ts` | modified/added | Adds durable product image ViewModel, temp URL refresh/fallback behavior, and image audit rules. | yes | yes | yes | P1 | no |
| `scripts/cloudbase-images-audit.mjs`, `scripts/cloudbase-images-repair-staging.mjs` | added | Adds staging image audit and repair tooling. | yes | yes | yes | P1 | no |
| `src/features/staff-image-tasks/*`, `src/features/cloudbase-mall/staff-image-tasks.ts` | modified | Improves batch labels and image task context. | yes | yes | yes | P2 | low |
| Customer/owner product list/detail/product page files | modified | Consumes image ViewModel and adds retry/fallback behavior for render failures. | yes | no, split between D/E/F | yes | P1 | medium |

## E. Checkout Auth / Phone Binding / Order Creation

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/pages/customer/product-detail/index.vue`, `src/pages/customer/product-detail/index.test.ts` | modified | Uses native `open-type=getPhoneNumber`, removes custom modal path, and supports bound-phone order submission. | yes | yes | yes | P0 | medium |
| `src/features/cloudbase-mall/customer-product-detail.ts`, `src/features/customer-product-detail/customer-product-detail.ts` | modified | Stabilizes login/phone authorization flow, order error messages, and product image ViewModel. | yes | no, SPLIT_NEEDED with D | yes | P0 | medium |
| `src/services/auth/cloudbase-wechat-auth-service.test.ts`, `cloudfunctions/mallApi/index.js`, `cloudfunctions/mallApi/mall-api-core.js` | modified | Covers trusted runtime identity and backend phone/order behavior. | yes | no, SPLIT_NEEDED | yes | P0 | low |

## F. Owner Product Management / Product Edit

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/pages/owner/products/*`, `src/features/owner-products/*`, `src/features/cloudbase-mall/owner-products.ts`, related tests | modified | Adds product basics edit, readonly productCode, SKU inventory loading, and image fallback. | yes | yes | yes | P1 | medium |
| `cloudfunctions/mallApi/mall-api-core.js`, `src/services/cloudbase/mall-api-client.ts` | modified | Adds `updateProductBasics` backend/API contract. | yes | no, SPLIT_NEEDED | yes | P1 | medium |
| `src/features/mall-workflow/mall-workflow.ts`, `src/features/owner-draft-review/*`, `src/features/cloudbase-mall/owner-draft-review.ts` | modified | Adds product basics workflow and hides confirmed/deleted drafts from review. | yes | yes | yes | P2 | low |

## G. Admin Account Management

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `src/features/admin-workbench-auth/*` | modified | Removes shared default-password behavior for non-admin, stores local password hash, and adds explicit initial password setup. | yes | yes | yes | P1 | no |
| `src/pages/owner/account-management/*`, `src/pages/owner/permissions/*`, `src/pages/owner/more/*` | modified | Adds initial-password UI, routing/permission tests, and account-management hardening. | yes | yes | yes | P1 | medium |

## H. Runtime Audit / mp-weixin Build Audit

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `scripts/mp-runtime-audit.mjs`, `scripts/mp-runtime-audit.test.mjs`, `package.json`, `tsconfig.json` | added/modified | Audits mp-weixin build output for unsupported Node built-ins and missing local require targets. | yes | yes | no | P1 | no |
| `package.json` `smoke:mp-weixin` | modified | Chains runtime audit into mini-program smoke. | yes | yes | no | P2 | no |

## I. Tests

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `*.test.ts`, `*.test.js`, `*.test.mjs` across backend, cloudfunctions, features, pages, services, and scripts | modified/added | Adds regression coverage for A-H. | yes | no, split with topic commits | no | P2 | medium: large test files must be reviewed by theme |

## J. Docs

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `docs/contracts/page-facing-ui-contracts.md` | modified | Documents page-facing contract boundaries. | yes | yes | no | P2 | no |
| `docs/audits/**`, `docs/plans/**`, `docs/testing/**`, `docs/prd/debug-prd.md`, `docs/prd/2026-06-01-customer-wechat-auth-mine-persistence-prd.md` | added | Adds prior audit, delivery, acceptance, and PRD artifacts. | yes for stabilization evidence | yes | some checklists yes | P2 | medium: duplicate status docs need consistency review |

## K. Dependency Upgrades

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `package.json`, `pnpm-lock.yaml` | modified | Upgrades `vitest` and `@vitest/coverage-v8` to `4.1.8`; lockfile churn follows. | yes | yes | no | P1 | medium: requires isolated dependency commit |
| `tsconfig.json` | modified | Adds Node types for new scripts/tests. | yes | yes with H/K | no | P2 | no |

## L. Unrelated Or Suspicious Changes

| Files | Type | Purpose | In scope | Independent commit | Manual acceptance | Risk | Over-modification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `.ai/TASK_STATE.md` | modified | Local AI workflow state. | no, SCOPE_LEAK | no | no | P3 | yes |
| `_ai_review_context.zip`, `_ai_review_context/**` | added | Generated review/export context package. | no, SCOPE_LEAK unless explicitly requested | no | no | P2 | yes |
| Broad LF-to-CRLF warnings across tracked files | metadata hygiene | Git reports line-ending rewrite risk. | no, SCOPE_LEAK hygiene | no | no | P2 | yes |

## Split Notes

- `cloudfunctions/mallApi/mall-api-core.js` is the highest `SPLIT_NEEDED` file: schema/error handling, Mine snapshot, checkout/order, and product edit all touch it.
- `src/services/cloudbase/mall-api-client.ts` is `SPLIT_NEEDED` between Mine snapshot and product basics.
- `src/pages/customer/product-detail/index.vue` is `SPLIT_NEEDED` between image fallback and checkout phone auth.
- `package.json` is `SPLIT_NEEDED` between CloudBase/runtime-audit scripts and dependency upgrade.
- Generated `_ai_review_context/**` and `.ai/TASK_STATE.md` should not be part of functional commits.
