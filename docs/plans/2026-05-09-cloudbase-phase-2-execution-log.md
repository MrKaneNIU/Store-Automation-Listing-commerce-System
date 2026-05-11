# 2026-05-09 CloudBase Phase 2 Execution Log

## Scope

This log tracks execution against the six-step CloudBase gate required before
entering Phase 3 real image/object storage.

The work is intentionally scoped to CloudBase backend/persistence boundaries.
It does not change mini-program pages, existing OCR behavior, product rules,
order rules, or the current in-memory runtime path unless explicitly recorded
as service-adapter wiring.

## Step Status

### 1. CloudBase Environment

Status: complete for the current Phase 2 CloudBase baseline.

Known:

1. CloudBase environment ID: `cloud1-d7gifjyzl7721b383`.
2. Billing posture: free quota first.

Confirmed through console/CLI work:

1. CloudBase console access was available for this session.
2. Cloud function deployment and invocation authorization succeeded through the
   CloudBase CLI device authorization flow.
3. No paid upgrade was enabled; continue using the free quota posture unless a
   later PRD explicitly approves a billing change.

Local code added:

- `backend/src/cloudbase/cloudbase-env.ts`
- `backend/src/cloudbase/cloudbase-env.test.ts`

### 2. CloudBase Cloud Function Baseline

Status: deployed and smoke-tested for the current Phase 2 business-data
baseline.

Implemented:

- CloudBase environment parser.
- Health cloud function response envelope contract.
- Credential-safe health payload.
- `mallHealth` deployed to `cloud1-d7gifjyzl7721b383`.
- `mallApi` deployed to `cloud1-d7gifjyzl7721b383`.
- `mallApi` health, contract listing, unsupported action, malformed
  `createOcrBatch`, real `createOcrBatch`, `getLatestDrafts`, `confirmBatch`,
  and `listProducts` smoke probes were run through the CloudBase CLI.
- `createOcrBatch` now writes CloudBase business data instead of returning
  `NOT_IMPLEMENTED`.
- `getLatestDrafts` reads back the persisted CloudBase batch and draft data.
- `confirmBatch` can create product/SKU data from CloudBase drafts.

Local code added:

- `backend/src/cloudbase/cloudbase-health.ts`
- `backend/src/cloudbase/cloudbase-health.test.ts`
- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/index.js`

### 3. CloudBase Data Model

Status: complete for required Phase 2 collection creation and core MVP indexes;
deeper operational indexes remain future-module work.

Implemented:

- Phase 2 collection definitions.
- Required index validation.
- Data model contract documentation.
- Required Phase 2 CloudBase collections were created with `ADMINONLY`
  permissions.
- Core MVP-path indexes were created or confirmed.

Local code/docs added:

- `backend/src/cloudbase/cloudbase-data-model.ts`
- `backend/src/cloudbase/cloudbase-data-model.test.ts`
- `docs/contracts/cloudbase-data-model.md`

Console setup evidence:

- `docs/plans/2026-05-09-cloudbase-console-setup-log.md`
- The required Phase 2 collections were created in
  `cloud1-d7gifjyzl7721b383` with `ADMINONLY` permissions.

### 4. CloudBase Repository Adapter

Status: CloudBase SDK/cloud function business wiring is complete for the
current MVP OCR/draft/product baseline; broader order/image-task operations are
implemented behind the same `mallApi` action table and still need full WeChat
DevTools flow acceptance.

Implemented:

- `createCloudBaseMallRepository` adapter over a CloudBase-shaped document
  store.
- Local memory CloudBase document store for contract tests only.
- Shared repository contract execution against the CloudBase adapter.
- Transaction-style rollback test for invalid SKU persistence.
- Deployed `mallApi` uses `@cloudbase/node-sdk` in the cloud function runtime
  and a local memory store only when `MALL_API_LOCAL_MEMORY=1` is set for local
  smoke tests.
- CloudBase update payloads strip `_id` before `doc(id).update(...)` to satisfy
  the CloudBase SDK rule that `_id` cannot be updated.
- `confirmBatch` includes a compensation-style duplicate guard: if products
  already exist for `createdFromBatchId`, it updates the batch to confirmed and
  returns existing products/SKUs instead of creating another product set.

Local code added:

- `backend/src/cloudbase/cloudbase-mall-repository.ts`
- `backend/src/cloudbase/cloudbase-mall-repository.test.ts`
- `backend/src/cloudbase/memory-cloudbase-document-store.ts`

### 5. Mini-Program Runtime Acceptance

Status: page-facing CloudBase runtime wiring completed; real AppID is synced;
the current owner screenshot import gate passed manual WeChat DevTools
acceptance.

Completed:

1. Implement CloudBase runtime wiring for the existing service adapter.
2. Keep all calls behind feature/service boundaries.
3. Wire owner screenshot import, owner draft review, owner products, owner
   orders, staff image tasks, customer product list, and customer product detail
   through `src/features/cloudbase-mall`.
4. Confirm pages do not call `wx.cloud` directly; only
   `src/services/cloudbase/runtime-mall-api-client.ts` owns the mini-program
   CloudBase runtime call.

This step remains scoped to service/repository adapters. Mini-program pages
must not call `wx.cloud` directly.

Local service contract added:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/cloudbase-function-client.test.ts`
- `src/services/cloudbase/mall-api-client.ts`
- `src/services/cloudbase/mall-api-client.test.ts`
- `src/services/cloudbase/runtime-mall-api-client.ts`
- `src/features/cloudbase-mall/*`

This service wraps `wx.cloud.callFunction` style calls behind a testable
adapter and rejects malformed cloud function envelopes before they leak into
features or pages. `mall-api-client.ts` maps MVP action names, params, and
payloads into the deployed `mallApi` cloud function without exposing
`wx.cloud` to pages.

Manual DevTools observation:

- WeChat DevTools Stable `2.01.2510290` is running and has
  `dist/build/mp-weixin` imported.
- After `verify:full`, a desktop-triggered refresh exposed the blocking dialog:
  `更改 AppID 失败 touristappid` / `Error: tourist appid`.
- On 2026-05-10, the real AppID was synced to `src/manifest.json` and the
  rebuilt artifact generated `dist/build/mp-weixin/project.config.json`
  with `appid: "wxa63c53796488d4d4"`.
- A follow-up desktop observation showed the earlier `touristappid` dialog was
  no longer present. This is not a substitute for the required manual
  click-through acceptance record.
- 2026-05-10 manual acceptance attempt failed on owner screenshot recognition:
  WeChat runtime returned `cloud.callFunction:fail errCode: -501000`
  / `Environment not found` for environment `cloud1-d7gifjyzl7721b383`.
  The same environment and `mallApi` function still invoked successfully
  through CloudBase CLI, so the remaining blocker is the mini-program AppID's
  CloudBase environment access or binding, not a missing deployed function.
- 2026-05-10 follow-up recovery resolved the AppID/environment/function
  mismatch for AppID `wxa63c53796488d4d4` and CloudBase environment
  `cloud1-d7gifjyzl7721b383`.
- `mallHealth` and `mallApi` were deployed and verified in the correct
  environment.
- Required CloudBase collections were created/confirmed in
  `cloud1-d7gifjyzl7721b383`; the `DATABASE COLLECTION NOT EXIST:
  ocr_batches` blocker is resolved.
- The user confirmed the current owner `开始识别` path can run in WeChat
  DevTools.
- A later recognition-accuracy complaint was traced to the fixed mock OCR path.
  The current Phase 2 closure intentionally prevents fabricated product
  name/code/price/spec fields from being written before a real OCR provider is
  connected. Real OCR/AI remains Phase 6.

### 6. Final Verification And Documentation

Status: automatic verification refreshed after the CloudBase business-data
wiring and the 2026-05-10 manual acceptance fixes.

Completed:

```powershell
pnpm.cmd run backend:test
pnpm.cmd run test -- src/services/cloudbase/cloudbase-function-client.test.ts
pnpm.cmd exec vitest run --config vitest.config.ts src/services/cloudbase/cloudbase-function-client.test.ts src/services/cloudbase/mall-api-client.test.ts
node scripts\smoke-cloudbase-api.mjs
npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId cloud1-d7gifjyzl7721b383 --dir cloudfunctions/mallApi --force --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-create-ocr-batch.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-get-latest-drafts.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-list-products.json' --json
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Observed result:

- Focused CloudBase service tests: 2 files, 5 tests passed.
- Local `mallApi` smoke: health, contract list, validation failure,
  `createOcrBatch`, `getLatestDrafts`, and `confirmBatch` passed against the
  local memory store.
- Deployed CloudBase smoke:
  - `createOcrBatch` returned `success=true`, batch
    `batch-moy3j5l6-1`, draft `draft-moy3j5st-2`.
  - `getLatestDrafts` read back the same persisted batch/draft from CloudBase.
  - `confirmBatch` returned `success=true` and created product
    `product-moy3lf6q-1` plus SKU `sku-moy3lf6q-2`.
  - `listProducts` read CloudBase product rows back through `mallApi`.
- CloudBase facade tests: `src/features/cloudbase-mall/cloudbase-mall.test.ts`
  covers page-facing CloudBase calls for OCR import, draft review, products,
  staff image tasks, customer product list/detail order creation, and owner
  orders.
- `pnpm.cmd run verify`: passed with 21 app/business test files, 88 tests,
  12 backend test files, 40 backend tests, lint, boundary-check, type-check,
  backend build, dependency audits, and 88.89% line coverage.
- `pnpm.cmd run verify:full`: passed; mini-program build completed and
  `smoke:mp-weixin` passed.
- 2026-05-10 AppID-sync refresh: `pnpm.cmd run verify:full` passed again after
  `src/manifest.json` was updated to `wxa63c53796488d4d4`.
- 2026-05-10 final Phase 2 gate refresh after CloudBase env/function/collection
  recovery and mock-output prevention:
  - `pnpm.cmd run verify`: passed with lint, boundary-check, 22 app/business
    test files, 89 tests, coverage, type-check, 12 backend test files, 40
    backend tests, backend build, and dependency audits.
  - `pnpm.cmd run verify:full`: passed; it reran `verify`, built
    `dist/build/mp-weixin`, and `smoke:mp-weixin` passed.

Remaining gaps carried forward:

1. Real image/object storage is not implemented yet; this is Phase 3.
2. Real OCR/AI recognition is not implemented yet; this is Phase 6. The current
   owner import path must not be represented as accurate OCR output.
3. Phase 2 smoke/manual data may be cleaned if a pristine dev CloudBase dataset
   is needed for Phase 3 acceptance.

## Business Code Preserved

The following remain intentionally unchanged:

- current OCR provider behavior;
- product and SKU domain rules;
- customer order and merchant order domain rules;
- visual page layout and page-facing UI contract shapes;
- existing PostgreSQL engineering baseline under `backend/`.

## Gate Decision

Phase 2 is complete for the CloudBase backend/persistence gate and may hand off
to Phase 3 real image/object storage.

Allowed wording:

```text
CloudBase Phase 2 environment, collections, core indexes, and cloud function
contract deployment are established. Real mallApi business-data wiring and the
service adapter are now in place, and MVP pages are wired to CloudBase facades.
The mp-weixin build uses real AppID `wxa63c53796488d4d4`, the current
CloudBase owner import gate passed manual acceptance, and refreshed `verify`
and `verify:full` pass. Phase 3 real image/object storage can start next.
```
