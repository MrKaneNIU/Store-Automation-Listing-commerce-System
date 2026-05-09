# 2026-05-09 CloudBase Phase 2 Execution Log

## Scope

This log tracks execution against the six-step CloudBase gate required before
entering Phase 3 real image/object storage.

The work is intentionally scoped to CloudBase backend/persistence boundaries.
It does not change mini-program pages, existing OCR behavior, product rules,
order rules, or the current in-memory runtime path.

## Step Status

### 1. CloudBase Environment

Status: complete for the current Phase 2 CloudBase baseline.

Known:

1. CloudBase environment ID: `shop-d0gl83cca8b2777b5`.
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

Status: deployed and smoke-tested for the current Phase 2 contract baseline.

Implemented:

- CloudBase environment parser.
- Health cloud function response envelope contract.
- Credential-safe health payload.
- `mallHealth` deployed to `shop-d0gl83cca8b2777b5`.
- `mallApi` deployed to `shop-d0gl83cca8b2777b5` as a contract boundary.
- `mallApi` health, contract listing, unsupported action, and unwired action
  smoke probes were run through the CloudBase CLI.

Local code added:

- `backend/src/cloudbase/cloudbase-health.ts`
- `backend/src/cloudbase/cloudbase-health.test.ts`

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
  `shop-d0gl83cca8b2777b5` with `ADMINONLY` permissions.

### 4. CloudBase Repository Adapter

Status: local contract baseline complete; real CloudBase SDK/cloud function
business wiring remains the next gate item.

Implemented:

- `createCloudBaseMallRepository` adapter over a CloudBase-shaped document
  store.
- Local memory CloudBase document store for contract tests only.
- Shared repository contract execution against the CloudBase adapter.
- Transaction-style rollback test for invalid SKU persistence.

Not complete yet:

- The deployed `mallApi` still returns `NOT_IMPLEMENTED` for contracted
  business actions such as `createOcrBatch`.
- The cloud function does not yet write or read CloudBase business data.
- The mini-program runtime has not been switched to the real CloudBase
  integration path.

Local code added:

- `backend/src/cloudbase/cloudbase-mall-repository.ts`
- `backend/src/cloudbase/cloudbase-mall-repository.test.ts`
- `backend/src/cloudbase/memory-cloudbase-document-store.ts`

### 5. Mini-Program Runtime Acceptance

Status: not started.

Still required:

1. Implement CloudBase runtime wiring for the existing service adapter.
2. Keep all calls behind feature/service boundaries.
3. Rebuild mini-program.
4. Run WeChat DevTools acceptance against the CloudBase integration path.
5. Record screenshots, environment, defects, and remaining blockers.

This step is now unblocked by environment availability, but it must remain
scoped to service/repository adapters. Mini-program pages must not call
`wx.cloud` directly.

Local service contract added:

- `src/services/cloudbase/cloudbase-function-client.ts`
- `src/services/cloudbase/cloudbase-function-client.test.ts`

This service wraps `wx.cloud.callFunction` style calls behind a testable
adapter and rejects malformed cloud function envelopes before they leak into
features or pages.

### 6. Final Verification And Documentation

Status: in progress; final Phase 2 gate verification still pending.

Completed:

```powershell
pnpm.cmd run backend:test
pnpm.cmd run test -- src/services/cloudbase/cloudbase-function-client.test.ts
```

Observed result:

- Backend tests: 12 files, 39 tests passed.
- App/business tests with CloudBase service adapter: 19 files, 79 tests passed.

Still required before Phase 3:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Also required before Phase 3:

1. Smoke-test real `mallApi` business actions after wiring them to CloudBase
   data.
2. Run WeChat DevTools acceptance against the CloudBase integration path.
3. Record the operator, environment, result, defects, and screenshots.

## Business Code Preserved

The following remain intentionally unchanged:

- `src/pages/`
- current OCR provider behavior;
- product and SKU domain rules;
- customer order and merchant order domain rules;
- current in-memory mini-program runtime path;
- existing PostgreSQL engineering baseline under `backend/`.

## Gate Decision

Phase 2 is not complete yet.

Allowed wording:

```text
CloudBase Phase 2 environment, collections, core indexes, and cloud function
contract deployment are established, but real mallApi business-data wiring,
mini-program CloudBase service integration, and WeChat DevTools acceptance
remain pending. Do not enter Phase 3 yet.
```
