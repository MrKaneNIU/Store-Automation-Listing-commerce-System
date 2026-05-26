# 2026-05-26 Product Management Online Repair Handoff

## Scope

This handoff records the seven-step repair loop for the product management and staff image supplementation defects.

Original symptoms:

1. After staff supplemented product images and the owner published the product, the published product did not show the supplemented image.
2. The product description editor accepted input but did not persist real changes.
3. Unpublish and delete buttons were clickable but had no real online effect.
4. SKU stock edits did not actually change inventory quantities.

## Repository Impact Map

Changed areas in this repair checkpoint:

```text
scripts/repro-product-management-contract.mjs
src/services/storage/product-image-url.ts
src/services/storage/product-image-url.test.ts
src/features/cloudbase-mall/
src/features/owner-products/
src/features/mall-workflow/
src/pages/owner/products/
src/services/cloudbase/
src/services/repositories/
src/services/storage/
backend/src/cloudbase/
backend/src/repositories/
cloudfunctions/mallApi/
docs/plans/2026-05-26-product-management-online-repair-handoff.md
```

Explicitly out of scope:

```text
payment
cart
logistics
coupons
refunds
multi-warehouse inventory
Cloud e Bao real-time inventory sync
new order authorization semantics
new customer checkout flow
new modules outside Product Management Operations PRD
```

Preserved contracts:

- Pages continue to call page-facing ViewModel/facade methods instead of writing repositories or CloudBase collections directly.
- Existing customer checkout authorization, order stock reservation, and order cancellation stock-release semantics remain unchanged.
- Product management changes stay within description, image rendering, lifecycle actions, SKU inventory editing, and publish validation.
- Production secrets remain in runtime/cloud configuration, not in the repository.

## Seven-Step Result

1. Online `mallApi.listContracts` diagnosis confirmed the remote function exposed 27 actions and missed these product-management actions: `updateProductDescription`, `updateSku`, `restockSkus`, `clearSkuStock`, `unpublishProduct`, `deleteProduct`.
2. Added `scripts/repro-product-management-contract.mjs` as a stable remote contract reproduction script. Before deployment it failed with the six missing actions.
3. Unified product image handling: product records keep durable `cloud://` file IDs, page-facing view models resolve renderable URLs before display, and signed `.tcb.qcloud.la` temporary URLs are not treated as durable product images.
4. Product management write failures are no longer silent. Description save, SKU save, restock, clear stock, publish, batch publish, unpublish, and delete now surface failure messages through the existing page `message` state while releasing loading state.
5. Local real-persistence checks passed across facade, CloudBase client, repository contracts, CloudFunction core, and backend repository adapters.
6. Deployed `mallApi` code to CloudBase environment `cloud1-d7gifjyzl7721b383` with a code-only update. Remote `listContracts` now exposes 33 actions and the six missing product-management actions are present.
7. Automated verification passed. WeChat DevTools or real-device manual acceptance is still pending and must not be counted as completed by automation alone.

## CloudBase Deployment Evidence

Deployment command:

```powershell
npx.cmd --yes --package @cloudbase/cli tcb fn code update mallApi --dir .\cloudfunctions\mallApi --json
```

Remote verification after deployment:

```text
Function: mallApi
Environment: cloud1-d7gifjyzl7721b383
Status: Active
Runtime: Nodejs18.15
Type: Event
Remote modified time: 2026-05-26 11:50:21
Remote action count: 33
missingRemoteProductActions: []
missingRemoteLocalActions: []
```

The deployment was code-only. It did not change runtime, environment variables, gateway rules, permissions, database schema, or CloudBase configuration.

## Verification

Targeted checks run during the repair loop:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/storage/product-image-url.test.ts src/services/storage/cloudbase-upload-service.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/owner/products/useOwnerProductsPageState.test.ts
pnpm.cmd exec vitest run --config vitest.config.ts src/pages/owner/products/useOwnerProductsPageState.test.ts
pnpm.cmd exec vitest run --config vitest.config.ts src/features/owner-products/owner-products.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/services/cloudbase/mall-api-client.test.ts src/services/repositories/mall-repository-contract.test.ts cloudfunctions/mallApi/mall-api-core.test.js
pnpm.cmd run backend:test
node scripts\repro-product-management-contract.mjs
```

Final gate:

```powershell
pnpm.cmd run verify
```

Final result:

- Frontend/cloudfunction tests: 53 files, 283 tests passed.
- Backend tests: 12 files, 60 tests passed.
- `lint`: passed.
- `boundary-check`: passed.
- `coverage`: passed.
- `type-check`: passed.
- `backend:build`: passed.
- `audit:prod`: passed, no known vulnerabilities.
- `audit:all`: passed, no known vulnerabilities.
- Remote product-management contract repro: passed, with no missing actions.

## Manual Acceptance Pending

The following must still be verified in WeChat DevTools or on a real device:

1. Staff supplements images, owner publishes, and customer-facing product list/detail shows the supplemented image.
2. Owner edits product description, saves it, leaves and re-enters product management, and the new description remains.
3. Owner unpublishes a published product, and the product returns to the publishable/ready queue as expected.
4. Owner deletes a product, and the product plus its SKU inventory entry disappear from product management.
5. Owner saves SKU stock, restocks, and clears stock; after closing and reopening the SKU inventory panel, the updated quantity remains.

Do not mark the release as human-accepted until the checklist above is executed by a person in the mini-program runtime.

## Reopen Notes

- If product management buttons fail online again, first run:

```powershell
node scripts\repro-product-management-contract.mjs
```

- If the repro fails, the online `mallApi` function is stale or deployed to the wrong environment.
- If the repro passes but the mini-program still fails, inspect page-visible `message` first; step 4 made the previously silent errors visible.
- If product images disappear again after publish, inspect whether product records contain durable `cloud://` IDs or expired signed temporary URLs.
