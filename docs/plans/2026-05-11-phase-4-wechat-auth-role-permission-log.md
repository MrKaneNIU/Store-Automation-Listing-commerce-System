# 2026-05-11 Phase 4 WeChat Auth And Role Permission Log

## Repository Impact Map

Expected changes:

- `docs/prd/2026-05-11-phase-4-wechat-auth-role-permission-prd.md`
- `docs/plans/2026-05-11-phase-4-wechat-auth-role-permission-log.md`
- `cloudfunctions/mallApi/*`
- `src/services/auth/*`
- `src/services/cloudbase/*`
- `src/features/cloudbase-mall/*`

Out of scope:

- OCR/AI recognition remains Phase 6.
- Order/inventory ledger expansion remains Phase 5.
- Product-grade UI redesign remains Phase 7.
- Phase 3 upload/storage contracts are preserved.

Business contracts to preserve:

- Customers can browse without login.
- Checkout is the first customer auth gate.
- Authorization failure must not create orders or reserve stock.
- Backend permission checks are mandatory even if UI entries are hidden.

Planned verification:

```powershell
pnpm.cmd run test
pnpm.cmd run verify
pnpm.cmd run verify:full
```

## Execution Plan

1. Phase 4 planning
   - Acceptance: dedicated Phase 4 PRD and delivery log exist.
2. Module 4.1 customer identity boundary
   - Acceptance: `mallApi` can resolve the current CloudBase customer from verified runtime identity and rejects missing identity.
3. Module 4.2 phone authorization boundary
   - Acceptance: phone binding is backend-owned and order creation does not trust arbitrary client identity for real WeChat sessions.
4. Module 4.4 role permission baseline
   - Acceptance: owner/staff/customer API probes cover allow and deny cases.
5. Verification and doc sync
   - Acceptance: automated checks are recorded and remaining manual gates are explicit.

## Current Status

- Started on 2026-05-11.
- Phase 4 PRD created from the master PRD.
- Module 4.1 backend customer identity boundary is implemented for `mallApi`.
- Module 4.2 phone binding boundary is implemented as a backend-owned action.
- Module 4.4 role permission baseline is implemented for the current owner/staff/customer API surface.
- Automated verification passed for the first Phase 4 pass.
- Per user direction on 2026-05-11, WeChat DevTools manual acceptance is intentionally deferred until Phase 6 real OCR/AI asynchronous recognition is complete.

## Completed Implementation

### Module 4.1: Real WeChat Login Boundary

- Added `getCurrentCustomer` to `mallApi`.
- Added backend customer upsert by verified CloudBase identity.
- Added CloudBase runtime identity injection in `cloudfunctions/mallApi/index.js`.
- Tightened `cloudfunctions/mallApi/index.js` so request-body `identity` is only accepted when `MALL_API_ALLOW_TEST_IDENTITY=1`; production runtime identity comes from CloudBase context.
- Added service client support through `CloudBaseMallApiClient`.
- Added `createCloudBaseWechatAuthService` so page-facing flows can use a real CloudBase-backed auth service without page-level `wx.cloud` calls.

### Module 4.2: Phone Authorization Boundary

- Added `bindCustomerPhone` to `mallApi`.
- Kept phone binding behind backend action boundaries and changed the contract to accept a WeChat phone authorization code instead of a client-supplied phone number.
- Updated `WechatAuthService.authorizePhoneNumber` to accept the phone value supplied by a page-safe authorization wrapper.
- Updated customer checkout facades so a future page-level WeChat phone authorization result can be passed into the service without changing order logic.
- For `authSource: "wechat"` orders, backend order creation now uses the backend-resolved customer and bound phone rather than trusting client-supplied customer identity or phone fields.

### Module 4.4: Role Permission Baseline

- Added owner/staff/customer role checks in `mallApi`.
- Role checks now resolve active roles from `role_assignments` unless a local test-role switch is explicitly enabled.
- Owner-only guarded actions include OCR batch creation, draft mutation, batch confirmation, publishing, merchant order list/confirm/cancel.
- Staff/owner shared guarded actions include pending image tasks and image supplementation.
- Customer attempts to call merchant APIs are rejected with `FORBIDDEN`.
- Staff can supplement images but cannot publish products.

### Module 4.3: Privacy Authorization Contract

- Added `WechatPrivacyService`.
- Added runtime wrapper for `wx.getPrivacySetting`, `wx.requirePrivacyAuthorize`, and `wx.openPrivacyContract`.
- Added tests proving refused privacy authorization does not call the phone-code request path.

## Verification Results

Passed:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/services/auth/cloudbase-wechat-auth-service.test.ts src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts cloudfunctions/mallApi/mall-api-core.test.js
```

Result:

- 4 test files passed.
- 18 tests passed.

Passed:

```powershell
pnpm.cmd run test
```

Result:

- 27 test files passed.
- 103 tests passed.

Passed:

```powershell
pnpm.cmd run verify
```

Result:

- lint passed.
- boundary check passed.
- frontend/cloudfunction tests passed: 103 tests.
- coverage passed: statements 87.51%, branches 75.04%, functions 84.72%, lines 87.51%.
- type-check passed.
- backend tests passed: 12 files, 40 tests.
- backend build passed.
- production and full dependency audits found no known vulnerabilities.

Passed:

```powershell
pnpm.cmd run verify:full
```

Result:

- `verify` passed again.
- `build:mp-weixin` passed.
- `smoke:mp-weixin` passed.

## Business Code Intentionally Not Changed

- Real OCR/AI remains Phase 6.
- Inventory ledger, idempotency expansion, and order operations remain Phase 5.
- Product-grade UI redesign remains Phase 7.
- Existing Phase 3 upload/storage contracts were not changed.
- Pages were not rewritten to directly call CloudBase collections or own final permission decisions.

## Remaining Gaps

- Real WeChat `getPhoneNumber` code exchange still needs live Mini Program platform acceptance and may require exact backend exchange implementation after console configuration is confirmed.
- Owner/staff production role assignment initialization still needs a safe binding workflow for live openids.
- WeChat DevTools manual Phase 4 acceptance is intentionally not executed now; it is deferred until after Phase 6 real OCR/AI asynchronous recognition.

## 2026-05-11 Follow-up Implementation

Completed after the initial Phase 4 pass:

- Production identity boundary tightened: request-body `identity/roles` no longer controls production authorization.
- Local test/smoke identity is gated by `MALL_API_ALLOW_TEST_IDENTITY=1`.
- Role permission resolution now reads active `role_assignments`.
- Phone binding now requires a `phoneCode`; direct client phone binding is rejected.
- Privacy authorization service boundary added.
- Added `scripts/cloudbase-bind-owner.mjs` for bootstrap owner initialization without a management UI.
- Added `mallApi.bindStaff` so an owner can bind a staff openid through backend role assignments.
- Added real WeChat phone-code exchange wiring in `cloudfunctions/mallApi/index.js`.

Additional targeted verification passed:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/auth/cloudbase-wechat-auth-service.test.ts src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
```

Results:

- `mall-api-core.test.js`: 7 tests passed after identity/role hardening.
- Phase 4 targeted bundle: 4 files, 21 tests passed after phone-code contract change.

Final automated verification after privacy-service coverage fix:

```powershell
pnpm.cmd run test
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Results:

- `test`: 28 test files passed, 111 tests passed.
- `verify`: lint, boundary-check, tests, coverage, type-check, backend tests/build, and dependency audits passed.
- coverage passed: statements 87.51%, branches 75.09%, functions 84.44%, lines 87.51%.
- backend verification passed: 12 backend test files, 40 tests, plus backend build.
- `verify:full`: `verify`, `build:mp-weixin`, and `smoke:mp-weixin` passed.
- Manual WeChat DevTools acceptance was intentionally not run; it remains deferred until after Phase 6.

2026-05-11 second follow-up verification after owner bootstrap, staff binding, and real phone-code exchange wiring:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts
pnpm.cmd run test
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Results:

- Targeted mall API/client tests passed: 2 files, 14 tests.
- `test` passed: 28 files, 114 tests.
- `verify` passed: lint, boundary-check, tests, coverage, type-check, backend tests/build, and audits.
- coverage passed: statements 87.6%, branches 75.14%, functions 84.51%, lines 87.6%.
- backend verification passed: 12 backend test files, 40 tests, plus backend build.
- `verify:full` passed: `verify`, `build:mp-weixin`, and `smoke:mp-weixin`.
- Manual WeChat DevTools acceptance was intentionally not run.

## Owner/Staff Binding And Phone Exchange Notes

### Owner initialization

Use the bootstrap script after the first owner has opened the mini-program once and the operator has the target openid:

```powershell
node scripts/cloudbase-bind-owner.mjs --envId cloud1-d7gifjyzl7721b383 --openid <OWNER_OPENID> --operator <OPERATOR_NAME> --reason "bootstrap first owner" --dry-run
node scripts/cloudbase-bind-owner.mjs --envId cloud1-d7gifjyzl7721b383 --openid <OWNER_OPENID> --operator <OPERATOR_NAME> --reason "bootstrap first owner"
```

The script:

- Upserts an active `owner` assignment in `role_assignments`.
- Writes a `bind_owner` record to `operation_audit_logs`.
- Is idempotent for the same owner openid and role.
- Requires `@cloudbase/node-sdk` in the runtime where the script is executed.

### Staff binding

`mallApi.bindStaff`:

- Requires the caller to resolve as `owner` from active `role_assignments`.
- Accepts a staff `openid` and optional `reason`.
- Upserts an active `staff` assignment.
- Writes a `bind_staff` audit record.
- Rejects non-owner callers and self-binding.

### Phone code exchange

`bindCustomerPhone` remains the mini-program phone boundary:

- Client sends only `phoneCode`.
- Cloud function exchanges the code through WeChat server API.
- `WECHAT_APPID` and `WECHAT_APPSECRET` must be configured in the CloudBase console on the `mallApi` cloud function before production phone exchange can run.
- `WECHAT_APPSECRET` must not be written into `cloudbaserc.json`, source files, docs, or local committed fixtures.
- The backend stores the returned phone number on the current CloudBase identity's customer record.
- Upstream exchange errors are returned as a safe `EXTERNAL_SERVICE_ERROR` envelope.

## 2026-05-11 Cloud Function Deploy And Secret Configuration Follow-up

Production deploy/interlock work completed after the Phase 4 implementation pass:

- Confirmed CloudBase CLI login and selected environment `cloud1-d7gifjyzl7721b383`.
- Deployed the latest local `cloudfunctions/mallApi` implementation to the `mallApi` cloud function.
- Verified deployed code now includes the CloudBase runtime identity boundary, `role_assignments` role resolution, `bindStaff`, and real WeChat `phoneCode` exchange wiring.
- Verified `mallApi` machine smoke calls after deploy:
  - `health` returned `success: true`, `service: "mall-api"`, and `supportedActions: 23`.
  - `listContracts` returned the Phase 4 action list including `getCurrentCustomer`, `bindCustomerPhone`, and `bindStaff`.

Secret configuration decision:

- Production `WECHAT_APPID` and `WECHAT_APPSECRET` will be configured in the CloudBase console on the `mallApi` cloud function.
- No secret value was written into the repository.
- The current deployed `mallApi` function still reports an empty cloud-function environment variable list, so real WeChat phone exchange is not production-ready until console configuration is completed.
- Manual WeChat DevTools acceptance was not run and remains deferred until after Phase 6 real OCR/AI asynchronous recognition.
