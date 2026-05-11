# 2026-05-10 Phase 3 Real Image Object Storage Delivery Log

## Scope

This delivery completes `docs/prd/2026-05-08-enterprise-launch-master-prd.md`
Phase 3: real image object storage.

Phase 3 is limited to image upload, object storage, access URLs, replacement,
failure handling, and mini-program storage/domain acceptance.

Out of scope:

- Real OCR/AI recognition. That remains Phase 6.
- Real WeChat authorization and role permission hardening. That remains Phase 4.
- Order, inventory ledger, and audit expansion. That remains Phase 5.
- Product-level UI redesign. That remains Phase 7.

## Completed Modules

### Module 3.1: Upload Service Port Strengthening

- Extended the upload service contract with explicit upload context, failure
  codes, upload asset metadata, delete results, replacement, and asset refresh
  operations.
- Kept page-facing upload behavior behind the storage service boundary.
- Preserved the existing MVP business loop and page/view-model contracts.

### Module 3.2: Real Object Storage Implementation

- Added CloudBase-backed storage using `wx.cloud.uploadFile`,
  `wx.cloud.getTempFileURL`, and `wx.cloud.deleteFile`.
- Added runtime selection so the mini-program runtime uses CloudBase storage
  while non-mini-program execution keeps the mock implementation.
- Added upload path naming by business type, source role, entity type, and
  entity id.
- Added product image replacement and asset URL refresh helpers.

### Module 3.3: Image Processing And Safety

- Added PNG, JPG, JPEG, and WEBP format validation.
- Added file-size validation with a hard limit.
- Added image compression hooks when runtime support exists.
- Added upload failure mapping for file size, format, network, server, and
  security-review failures.
- Added user-friendly upload error messages.

### Module 3.4: Mini Program Domain Configuration

- Set the mini-program AppID to `wxa63c53796488d4d4`.
- Set `mp-weixin.setting.urlCheck` to `true` in `src/manifest.json`.
- Rebuilt `dist/build/mp-weixin`; generated `project.config.json` contains
  `appid: wxa63c53796488d4d4` and `setting.urlCheck: true`.
- Confirmed CloudBase environment `cloud1-d7gifjyzl7721b383` is the active
  storage/backend environment.

## Automated Verification

Previously completed for the Phase 3 implementation:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Additional verification on 2026-05-11:

```powershell
pnpm.cmd run build:mp-weixin
npx.cmd -p @cloudbase/cli tcb storage get-acl --envId cloud1-d7gifjyzl7721b383
npx.cmd -p @cloudbase/cli tcb storage rules get --env-id cloud1-d7gifjyzl7721b383
npx.cmd -p @cloudbase/cli tcb cors list --env-id cloud1-d7gifjyzl7721b383
npx.cmd -p @cloudbase/cli tcb storage upload tmp-phase3-storage-probe.png uploads/phase3-acceptance/owner/product/manual-gate/probe-2026-05-11.png --env-id cloud1-d7gifjyzl7721b383
npx.cmd -p @cloudbase/cli tcb storage detail uploads/phase3-acceptance/owner/product/manual-gate/probe-2026-05-11.png --env-id cloud1-d7gifjyzl7721b383
npx.cmd -p @cloudbase/cli tcb storage url uploads/phase3-acceptance/owner/product/manual-gate/probe-2026-05-11.png --env-id cloud1-d7gifjyzl7721b383
Invoke-WebRequest -Uri <temporary-cloudbase-url> -Method Head
Invoke-WebRequest -Uri <temporary-cloudbase-url> -OutFile tmp-phase3-storage-probe-download.png
npx.cmd -p @cloudbase/cli tcb storage rm uploads/phase3-acceptance/owner/product/manual-gate/probe-2026-05-11.png --env-id cloud1-d7gifjyzl7721b383
```

Observed results:

- CloudBase storage permission rule: `Only creator and admin can read and write`.
- CloudBase security domain list includes
  `cloud1-d7gifjyzl7721b383-1429982088.tcloudbaseapp.com` with status
  `Enabled`.
- Temporary storage URL is HTTPS and served by `tencent-cos`.
- HTTPS `HEAD` request returned `200` with `Content-Type: image/png` for the
  probe file.
- Downloaded probe file MD5 matched the uploaded local file MD5.
- Probe object was removed after validation.

## Manual WeChat DevTools Acceptance

Manual acceptance environment on 2026-05-11:

- WeChat Developer Tools: `2.01.2510290`.
- Project artifact: `dist/build/mp-weixin`.
- AppID: `wxa63c53796488d4d4`.
- CloudBase environment: `cloud1-d7gifjyzl7721b383`.
- Domain check: `setting.urlCheck: true`.

Accepted:

- Owner screenshot upload from WeChat Developer Tools wrote real CloudBase
  storage objects under `uploads/ocr_screenshot/owner/ocr_batch/unbound/`.
- Evidence object:
  `uploads/ocr_screenshot/owner/ocr_batch/unbound/1778492171577-1-ivtePpW1W27H5d78ff14a78d07197522ea5131dc8666.jpg`
  with `LastModified` `2026-05-11 17:36:11`, size `124.35 KB`, and ETag
  `"ac85aefbfdc1678b0d4c53c0b5b280ba"`.
- A later owner screenshot upload also wrote:
  `uploads/ocr_screenshot/owner/ocr_batch/unbound/1778492345403-1-PQMDerX397Ab5d78ff14a78d07197522ea5131dc8666.jpg`.
- The second uploaded object resolved to an HTTPS temporary URL. HTTPS `HEAD`
  returned `200`, `Content-Type: image/jpeg`, and `Server: tencent-cos`.

Not executed in this acceptance pass:

- Staff/product image upload. The user confirmed the previous field-recognition
  path is no longer a valid prerequisite because real field recognition was
  cancelled for now. Without a valid generated product/pending-image task, this
  product-image route is not treated as a remaining Phase 3 blocker.

## Remaining Gaps

- Real OCR/AI remains Phase 6.
- Product image upload should be re-accepted when a valid product creation path
  exists again.
- Real-device preview acceptance is still recommended before production
  release, but the 2026-05-11 DevTools plus CloudBase storage/TLS evidence
  closes the current Phase 3 manual storage gate.
