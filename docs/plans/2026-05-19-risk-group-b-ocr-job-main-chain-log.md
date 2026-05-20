# 2026-05-19 Risk Group B OCR Job Main Chain Log

## Repository Impact Map

Changed in this risk group:

```text
src/domain/batch/
src/domain/draft/
src/services/ocr/
src/services/repositories/
src/services/cloudbase/mall-api-client.ts
src/features/cloudbase-mall/
src/features/owner-draft-review/
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
cloudfunctions/mallApi/
backend/src/api/
backend/src/cloudbase/
backend/src/db/
backend/src/repositories/
docs/plans/2026-05-19-risk-group-b-ocr-job-main-chain-log.md
```

Explicitly out of scope:

```text
src/pages/customer/
src/pages/owner/products/
src/pages/owner/orders/
src/pages/staff/
payment, logistics, refunds, coupons
order status semantics
product/SKU/inventory business rules
production secret values
Risk Group C and later risk groups
```

Business contracts preserved:

- Customer browsing and checkout auth timing were not changed.
- OCR upload still enters recognition and draft review only; it does not
  directly create products, SKUs, inventory entries, or orders.
- Failed OCR jobs do not generate products.
- Retried OCR jobs reuse the existing batch/job path and must not duplicate
  drafts.
- Draft confirmation still uses the existing product/SKU merge rules.
- Pages continue to call page-facing ViewModel/facade functions instead of
  writing repositories or CloudBase collections directly.
- No production secret value was added to the repository.

Planned verification:

```powershell
pnpm.cmd run test -- src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/owner-draft-review/owner-draft-review.test.ts src/services/cloudbase/mall-api-client.test.ts src/services/ocr/http-ocr-provider.test.ts src/services/ocr/mock-ocr-provider.test.ts src/domain/batch/rules.test.ts src/domain/draft/rules.test.ts
pnpm.cmd run type-check
pnpm.cmd run verify:backend
pnpm.cmd run verify:api
pnpm.cmd run verify
pnpm.cmd run verify:full
```

## Execution Plan

1. Add OCR job state-machine contracts.
   - Acceptance: invalid transitions fail clearly, failed jobs do not create
     products, retries do not duplicate drafts, and repository/cloudfunction
     tests cover job persistence.
2. Add OCR provider boundary.
   - Acceptance: provider input/output is explicit, mock provider remains for
     tests, HTTP provider maps timeout/rate-limit/service/format/configuration
     failures into recoverable errors, and provider code does not write
     products, SKUs, or orders.
3. Add draft quality metadata and manual correction state.
   - Acceptance: only the OCR draft fields `productCode`, `productName`,
     `salePrice`, and `spec` carry field confidence/source metadata; missing
     required fields still block confirmation; manual corrections are marked.
4. Add minimal owner UI integration.
   - Acceptance: screenshot import displays OCR job status/failure/retry, draft
     review displays confidence/source/manual-correction signals, and the
     existing visual structure is preserved without a redesign.
5. Run verification and record remaining production gaps separately from code
   verification.

## Completed Implementation

- Added OCR job types and transition rules for `queued`, `running`,
  `succeeded`, `failed`, and `retrying`.
- Added `ocr_jobs` persistence to in-memory, backend database, and CloudBase
  repository adapters.
- Added backend and CloudFunction mall API actions for listing, retrying, and
  processing OCR jobs.
- Added an HTTP OCR provider boundary with recoverable provider error codes.
- Preserved the fake/mock OCR provider for deterministic tests.
- Made `processOcrJob` create drafts only after provider success and only when
  the batch has no existing drafts.
- Added draft field confidence/source metadata and manual-correction state.
- Added minimal owner screenshot import UI status/retry display.
- Added minimal owner draft review UI signals for confidence/source/manual
  correction.
- Updated CloudBase facade and client contracts so page code remains behind
  the existing mall API boundary.

## Verification

RED evidence:

- OCR job rule tests were written before the state-transition implementation.
- HTTP OCR provider tests were written before the concrete provider adapter.
- CloudBase facade tests covered provider failure and retry duplicate-draft
  behavior before the facade was corrected.

Targeted verification:

```powershell
pnpm.cmd run test -- src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/owner-draft-review/owner-draft-review.test.ts src/services/cloudbase/mall-api-client.test.ts src/services/ocr/http-ocr-provider.test.ts src/services/ocr/mock-ocr-provider.test.ts src/domain/batch/rules.test.ts src/domain/draft/rules.test.ts
```

Result: passed. Vitest reported 32 test files and 142 tests passing.

```powershell
pnpm.cmd run type-check
```

Result: passed.

Full gate results are recorded after the final verification run below.

Backend/API verification:

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify:api
```

Result: both passed. Each run reported backend tests passing with 12 test
files and 49 tests, followed by a successful backend TypeScript build.

Full repository verification:

```powershell
pnpm.cmd run verify
```

Result: passed.

Included:

- lint
- boundary-check
- frontend/cloudfunction tests: 32 files / 142 tests
- coverage
- type-check
- backend tests: 12 files / 49 tests
- backend build
- prod/all audit: no known vulnerabilities

Full mini-program verification:

```powershell
pnpm.cmd run verify:full
```

Result: passed.

Included the full `verify` chain plus:

- `build:mp-weixin`
- `scripts/e2e-smoke.mjs`

Smoke output:

```text
E2E smoke passed: mp-weixin build artifacts and page routes are present.
```

## Tencent Cloud OCR Adapter Follow-up

Date: 2026-05-19

Decision:

- Use Tencent Cloud OCR `GeneralBasicOCR` as the real OCR provider.
- Keep the OCR result behind the existing job -> draft review chain.
- Do not call Tencent Cloud OCR directly from pages.
- Do not store Tencent Cloud `SecretId` or `SecretKey` in the repository.

Completed:

- Added a Tencent Cloud OCR provider adapter with TC3-HMAC-SHA256 request
  signing.
- The adapter calls `GeneralBasicOCR` at `https://ocr.tencentcloudapi.com`.
- The adapter maps Tencent Cloud `TextDetections` into review drafts using
  labeled text lines for:
  - `productCode`
  - `productName`
  - `salePrice`
  - `spec`
- The adapter records OCR confidence per field and keeps
  `correctionState: ocr_raw`.
- The adapter returns recoverable errors for configuration, timeout, rate
  limit, service, and invalid-response failures.
- `mallApi` now selects this adapter when
  `OCR_PROVIDER=tencentcloud-general-basic`.
- The production configuration gate now expects Tencent Cloud secret variable
  names instead of the old generic `OCR_PROVIDER_API_KEY`.

Tencent Cloud OCR variables expected on CloudBase `mallApi`:

```text
OCR_PROVIDER=tencentcloud-general-basic
OCR_PROVIDER_ENDPOINT=https://ocr.tencentcloudapi.com
TENCENTCLOUD_SECRET_ID
TENCENTCLOUD_SECRET_KEY
TENCENTCLOUD_REGION=ap-guangzhou
OCR_PROVIDER_TIMEOUT_MS=10000
```

Verification for this follow-up:

```powershell
pnpm.cmd run test -- src/services/ocr/tencentcloud-ocr-provider.test.ts cloudfunctions/mallApi/mall-api-core.test.js
pnpm.cmd run type-check
pnpm.cmd run cloudbase:prod-config:test
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Result: passed.

Final follow-up verification details:

- `test`: 33 files / 146 tests passed.
- `coverage`: passed with overall line coverage above the configured 80%
  threshold.
- `verify:backend`: 12 files / 49 tests passed, followed by backend build.
- `audit:prod` and `audit:all`: no known vulnerabilities found.
- `verify:full`: passed and included `build:mp-weixin` plus
  `scripts/e2e-smoke.mjs`.

Smoke output:

```text
E2E smoke passed: mp-weixin build artifacts and page routes are present.
```

## Remaining Production Gaps

Updated on 2026-05-20 after Tencent Cloud OCR configuration, CloudBase
deployment, and the PRD B1-B4 audit.

Current CloudBase `mallApi` state:

```text
envId: cloud1-d7gifjyzl7721b383
status: Active / Available
runtime: Nodejs18.15
modTime: 2026-05-20 10:54:19
OCR_PROVIDER=tencentcloud-general-basic
OCR_PROVIDER_ENDPOINT=https://ocr.tencentcloudapi.com
OCR_PROVIDER_TIMEOUT_MS=10000
OCR_TENCENT_REGION=ap-guangzhou
OCR_TENCENT_SECRET_ID configured
OCR_TENCENT_SECRET_KEY configured
```

Secret values are configured only in CloudBase and are not recorded in this
repository.

Image URL stability follow-up:

- CloudBase upload descriptors now carry `assetId` / fileID.
- The OCR job path passes `imageAssetIds` to `mallApi`.
- `mallApi` injects `resolveImageUrl` through CloudBase `getTempFileURL`.
- Tencent Cloud OCR receives the freshly resolved URL through
  `GeneralBasicOCR({ ImageUrl })`.
- This avoids stale temporary URL failures without converting large images to
  Base64.

Real OCR smoke evidence:

- Input: user-provided product screenshot.
- Expected fields: product code, product name, sale price, spec.
- Result: OCR returned one draft with `productCode=122334`,
  `productName=衬衫`, `salePrice=666`, and `spec=黑色/XL`.
- The smoke remained behind the OCR job -> draft review chain and did not
  create products, SKUs, inventory records, or orders.

Verification after the ImageUrl follow-up:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Result: both passed. `verify:full` included the mini-program build and the E2E
smoke script.

## 2026-05-20 Handoff Baseline

Risk Group B current status:

- B1 OCR Job state machine: implemented and verified.
- B2 OCR Provider interface: implemented with Tencent Cloud OCR
  `GeneralBasicOCR({ ImageUrl })`, recoverable error mapping, mock/fake
  provider preservation, and no direct writes to products, SKUs, or orders.
- B3 Draft quality and manual correction: partly complete. Field confidence,
  source metadata, low-confidence display, missing-field status, price-conflict
  display, and manual-correction state exist. Remaining gap: low-confidence
  fields are currently display warnings only; confirmation rules do not yet
  block low-confidence OCR fields until they are manually corrected or
  explicitly accepted.
- B4 Minimal OCR UI integration: partly complete. Screenshot import displays
  job status, failure reason, and retry action; draft review displays
  confidence/source/manual-correction/conflict signals. Remaining gap: the UI
  still behaves mostly as create-and-process followed by result display; a
  clearer asynchronous progress refresh/polling path is not yet closed.

Do not proceed to Risk Group C until the user explicitly accepts or defers the
two remaining B-group gaps above.

Manual WeChat Developer Tools acceptance for this PRD remains separate from
automated build smoke and is not claimed by this log.
