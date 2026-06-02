# Complexity and Duplication Review

Captured: 2026-06-02
Role: Debugger
PRD phase: 4
Scope: complexity, duplication, temporary patch, stale-code, and documentation conflict audit

## Result

Status: NEEDS_PLANNED_REFACTOR_AFTER_ACCEPTANCE

No code was modified in this phase. The codebase is not blocked by an immediate complexity P0, but it has clear "large stabilization diff" risk. The largest risks should be handled after manual acceptance through small, reversible refactors with tests already in place.

## Oversized Files

### Cloud function core over 500 lines

| Lines | File | Risk | Finding |
|---:|---|---|---|
| 1,983 | `cloudfunctions/mallApi/mall-api-core.js` | P1 | Single file owns contracts, validation, repositories, snapshots, role gates, checkout, inventory ledger, OCR, products, customer private modules, and handler dispatch. |
| 2,537 | `cloudfunctions/mallApi/mall-api-core.test.js` | P1 | Test file covers many unrelated domains: auth, OCR, product publish, checkout, order ledger, shopping bag, favorites, Mine. It is useful but hard to review as one unit. |

### Page state / facade / service over 300 lines

| Lines | File | Risk | Finding |
|---:|---|---|---|
| 1,017 | `src/pages/customer/product-detail/index.vue` | P2 | Page shell is large and holds multiple UI states for product details, SKU selection, checkout, favorites, and phone authorization UX. |
| 999 | `src/pages/owner/products/index.vue` | P2 | Owner product page combines list, publish lifecycle, edit modal, SKU inventory, and delete UX. |
| 968 | `src/pages/customer/product-list/index.vue` | P2 | Customer list page is a large shell with category/search/error/image state. |
| 762 | `src/pages/customer/shopping-bag/index.vue` | P2 | Shopping bag UI shell is large but currently routed through page-facing state/facade contracts. |
| 699 | `src/pages/owner/draft-review/index.vue` | P2 | Draft review page remains a large combined workflow surface. |
| 652 | `src/pages/customer/favorites/index.vue` | P2 | Favorites page has image/retry/loading/empty state in one shell. |
| 583 | `src/pages/customer/mine/index.vue` | P2 | Mine page has recent order, utility counts, identity, retry, and bottom navigation in one shell. |
| 553 | `src/pages/owner/orders/index.vue` | P2 | Owner order UI remains combined list/action state. |
| 519 | `src/pages/staff/image-tasks/index.vue` | P2 | Staff image task page remains a large combined task surface. |
| 517 | `src/pages/owner/dashboard/index.vue` | P2 | Dashboard page is large but not currently a direct business-boundary break. |
| 496 | `src/services/cloudbase/mall-api-client.ts` | P2 | CloudBase client facade maps many actions and errors in one file. |
| 451 | `src/pages/owner/products/useOwnerProductsPageState.ts` | P2 | Page-state module combines filtering, navigation locks, product basics edit, SKU inventory, publish/unpublish/delete, and messages. |

### Test files over 200 lines

| Lines | File | Risk | Finding |
|---:|---|---|---|
| 2,537 | `cloudfunctions/mallApi/mall-api-core.test.js` | P1 | Needs topic split after acceptance. |
| 1,042 | `src/features/cloudbase-mall/cloudbase-mall.test.ts` | P2 | Covers many facades in one file; useful but difficult to review with feature-specific diffs. |
| 702 | `src/services/cloudbase/mall-api-client.test.ts` | P2 | Large adapter-contract test file. |
| 242 | `src/pages/owner/products/useOwnerProductsPageState.test.ts` | P3 | Manageable but should not grow further without splitting. |

## Oversized Functions / Handlers

Evidence from `cloudfunctions/mallApi/mall-api-core.js`:

- Handler table region spans roughly lines 1381-2053 and contains all backend action implementations.
- `createCustomerOrder` spans roughly lines 1935-1991 and is currently below the PRD's 120-line handler threshold, but it carries identity, phone, stock, order, and ledger responsibilities.
- `createCustomerMineSnapshot` starts at line 911, `createShoppingBagSnapshot` at 956, and `createFavoriteProductsSnapshot` at 1002. Each snapshot helper is acceptable in isolation, but repeated snapshot-rebuild patterns now exist across private customer modules.
- The file contains about 127 `if` checks, which is expected for validation/authorization code but indicates a high density of branching in one module.

Evidence from `src/pages/owner/products/useOwnerProductsPageState.ts`:

- `useOwnerProductsPageState` starts at line 87 and keeps many nested command functions in one closure.
- The file contains about 27 `if` checks and 10 `catch` blocks, mostly action-level error handling.
- This is not a current boundary violation, but it is a refactor candidate after manual acceptance.

## Duplicate Logic

### Error mapping

Evidence:

- `cloudfunctions/mallApi/mall-api-core.js` has backend `normalizeMallApiError`.
- `src/services/cloudbase/cloudbase-function-client.ts` has `formatCloudBaseFailureMessage` and related fallback error handling.
- `src/pages/owner/products/useOwnerProductsPageState.ts` has `getActionErrorDetail` and `formatActionFailureMessage`.

Risk: P2. Error copy and mapping can drift. Do not refactor before manual acceptance; consolidate later around page-facing failure-message helpers.

### Image URL parsing

Evidence:

- `src/services/storage/product-image-url.ts` owns CloudBase image URL resolution and fallback display metadata.
- `src/features/cloudbase-mall/customer-product-detail.ts` and `src/features/cloudbase-mall/owner-products.ts` both call `resolveProductImageFields`.
- `src/features/cloudbase-mall/cloudbase-mall.test.ts` contains multiple image ViewModel and signed-temp URL tests.

Risk: P2. The image service is the right technical seam, but it also contains ViewModel-ish display fields. Move display copy/shaping closer to feature facades after acceptance.

### Phone auth state

Evidence:

- `src/features/cloudbase-mall/customer-product-detail.ts` manages bound-session vs request-phone-code behavior.
- `src/pages/customer/product-detail/index.vue` owns native button events and UI state.
- Tests cover direct submit for bound phone sessions and cancel/no-order behavior.

Risk: P2. Behavior is covered, but the page/facade split is subtle. Avoid UI changes before manual acceptance.

### Order create payload assembly

Evidence:

- `src/features/cloudbase-mall/customer-product-detail.ts` assembles checkout payload and auth session.
- `cloudfunctions/mallApi/mall-api-core.js#createCustomerOrder` validates and re-resolves backend customer identity.
- Test fixtures still use `mock_wechat` in explicit test-only paths.

Risk: P2. The new backend guard prevents production mock leakage, but the frontend test helper/default mock-auth seam should be tightened after acceptance.

### Product edit validation

Evidence:

- `src/features/cloudbase-mall/owner-products.ts` trims and validates basics.
- `src/pages/owner/products/useOwnerProductsPageState.ts` also manages product basics drafts and save messages.
- `cloudfunctions/mallApi/mall-api-core.js#updateProductBasics` validates backend update input.

Risk: P2. Validation is intentionally duplicated across UI/facade/backend layers, but user-facing messages can drift.

### Customer snapshot requests

Evidence:

- `cloudfunctions/mallApi/mall-api-core.js` has repeated `createShoppingBagSnapshot` calls after add/update/select/remove/clear actions.
- Favorites actions repeat `createFavoriteProductsSnapshot` after favorite/unfavorite/remove.
- Page-facing facades for Mine, shopping bag, and favorites all contain similar retry/load ViewModel patterns.
- `src/pages/customer/shopping-bag/useCustomerShoppingBagPageState.ts` uses `hasLoadedSnapshot`, `pendingSnapshot`, `cacheTtlMs`, and runtime request logging.
- `src/pages/customer/favorites/useCustomerFavoritesPageState.ts` has similar `pendingSnapshot`, `hasLoadedSnapshot`, `snapshotVersion`, and `cacheTtlMs` logic.
- `src/features/customer-mine/customer-mine-page-state.ts` repeats `pendingSnapshotLoad`, `hasLoadedSnapshot`, and `cacheTtlMs`.

Risk: P2. This is acceptable for correctness but should be extracted into small helpers only after current acceptance is closed.

### Legacy checkout/backend paths

Evidence:

- `src/features/cloudbase-mall/customer-product-detail.ts` owns the current CloudBase checkout phone-auth/order path.
- `src/features/customer-order/customer-order.ts` still has an older local/MVP `requestPhoneNumber` flow.
- `backend/src/api/handlers/mall-api.ts` and `cloudfunctions/mallApi/mall-api-core.js` both contain `createCustomerOrder` style backend logic.

Risk: P2. Existing tests still cover both local/MVP regression and deployed CloudBase contract. That is useful during stabilization, but docs and commit plans must make clear which path is runtime-critical.

## Temporary Patch / Mock Leakage Audit

Production-code findings:

- `cloudfunctions/mallApi/mall-api-core.js` still parses `session.authSource` values `mock_wechat` and `wechat`. After the local P0 fix, default production order creation rejects non-`wechat` sessions unless `allowMockCustomerOrder` is explicitly true.
- `src/features/cloudbase-mall/customer-product-detail.ts` imports `mockWechatAuthService` and defaults to it when no `authService` is injected. Backend now rejects mock order sessions in production, but this default is still confusing and should become test-only injection after manual acceptance.
- `src/features/cloudbase-mall/owner-screenshot-import.ts` uses a `fallbackBatch` when refreshing OCR job state. This looks intentional for resilient UI mapping, not a release blocker.
- `src/services/cloudbase/cloudbase-function-client.ts` contains fallback message handling. This is normal error hardening, not a temporary hack.
- `cloudfunctions/mallApi/index.js` can fall back to `createMemoryDocumentStore` outside a CloudBase store context. This is useful for local smoke/testing, but should stay clearly non-production.
- `src/services/storage/runtime-upload-service.ts` returns `mockUploadService` outside mini-program runtime. This is an adapter fallback, not a current blocker, but it should be named and tested as non-production behavior.

Test-only findings:

- Multiple test files contain `mock`, `fake`, and `mock_wechat`; most are legitimate fixture/mocking usage.
- `cloudfunctions/mallApi/mall-api-core.test.js` now explicitly separates default production handler behavior from test-only `allowMockCustomerOrder`.

Risk: P1 for frontend default `mockWechatAuthService` naming/default; P2 for remaining test-fixture density.

## Stale Code / Unused Surface

Potential stale or split-needed areas:

- Legacy mall workflow tests and feature tests still cover the in-memory MVP path while CloudBase mall facades cover the deployed path. Both are useful today, but should be labelled more clearly as domain/MVP regression vs CloudBase runtime contract.
- `src/features/cloudbase-mall/cloudbase-mall.test.ts` now mixes owner products, images, checkout, favorites, shopping bag, and Mine. Split by module after acceptance.
- `_ai_review_context.zip` and `_ai_review_context/**` are untracked local review artifacts and should not be committed.
- `.ai/TASK_STATE.md` is an AI workflow artifact, not module implementation diff.

No deprecated checkout flow or deleted account-registration path was removed in this phase because PRD phase 4 is read-only.

## Documentation Duplication / Status Conflicts

Findings:

- There are many historical PRDs, handoff logs, and acceptance reports in `docs/plans` and `.ai`. This is expected project history, but status words vary across time (`PASS`, `CONDITIONAL PASS`, `FAIL`, `READY...`).
- Current stabilization docs should preserve the strongest current status: automated checks may pass, but release status remains awaiting manual WeChat acceptance.
- Phase 0 baseline and Phase 7 readiness guard should be treated as the current source for final release readiness, not older handoff logs.
- `.ai/FINAL_REPORT.md` may contain an older overall `FAIL`, while current stabilization phase 3 can be `PASS` for automated contract coverage. These are different scopes and should not be conflated.

Risk: P2. The main risk is accidental overstatement of release status.

## Debugger Agent Addendum

The `prd_debugger` independent read-only pass agreed with the main findings and highlighted these additional risks:

- P1: `mallApi` core and test files are the highest-maintenance concentration point.
- P1/P2: customer/owner page shells are too large for continued patch-style fixes.
- P2: customer snapshot request dedupe/cache logic is duplicated across shopping bag, favorites, and Mine.
- P2: image URL/temp URL classification appears in runtime service, audit service, and script code.
- P2: mock/fallback paths remain useful for local testing but should be named and isolated more explicitly.
- P3: `_ai_review_context/` and `_ai_review_context.zip` are untracked review artifacts and should stay out of commits.

## Conclusion

The codebase shows stabilization debt, not an irreversible "spaghetti" failure. The main debt is concentration: too much backend behavior in `mall-api-core.js`, too much page state in several Vue/page-state files, and too many module contracts in large test files.

Do not split these files before manual acceptance unless another P0/P1 blocker appears. The safe path is to keep the current behavior stable, deploy the P0 checkout guard, finish manual acceptance, then refactor by one contract-protected slice at a time.
