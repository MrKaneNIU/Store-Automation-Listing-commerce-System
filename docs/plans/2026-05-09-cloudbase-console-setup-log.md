# 2026-05-09 CloudBase Console Setup Log

## Environment

- Environment name: `shop`
- Environment ID: `cloud1-d7gifjyzl7721b383`
- Plan shown in console: `体验版`
- Billing posture: free quota first

## Completed Console Actions

Opened CloudBase console and confirmed the environment can be accessed.

Created Phase 2 document database collections with `ADMINONLY` permissions:

- `ocr_batches`
- `product_drafts`
- `products`
- `skus`
- `orders`
- `order_items`
- `customers`
- `merchant_users`
- `staff_users`
- `role_assignments`
- `inventory_ledger`
- `operation_audit_logs`
- `uploaded_assets`
- `ocr_jobs`

`ADMINONLY` was chosen so mini-program pages cannot directly read or write the
database. Runtime access must go through cloud functions and service adapters.

Created or confirmed CloudBase indexes from the executable Phase 2 contract:

- `ocr_batches`: `status_created_at` (`status`, `created_at`)
- `product_drafts`: `batch_id` (`batch_id`)
- `product_drafts`: `batch_status` (`batch_id`, `status`)
- `products`: `product_code` (`product_code`)
- `products`: `status_updated_at` (`status`, `updated_at`)
- `skus`: `product_id` (`product_id`)
- `skus`: `product_code_spec` (`product_code`, `spec`)
- `orders`: `status_created_at` (`status`, `created_at`)
- `orders`: `customer_id_created_at` (`customer_id`, `created_at`)
- `order_items`: `order_id` (`order_id`)
- `order_items`: `sku_id` (`sku_id`)
- `customers`: `openid` (`openid`)
- `staff_users`: `role` (`role`)

Additional PRD collections were created with `ADMINONLY` permissions. Their
deeper operational indexes remain part of the contract and should be created
before those modules become runtime paths:

- `merchant_users`
- `role_assignments`
- `inventory_ledger`
- `operation_audit_logs`
- `uploaded_assets`
- `ocr_jobs`

Created CloudBase health cloud function:

- Function name: `mallHealth`
- Function type: normal event function
- Runtime: `Nodejs18.15`
- Description: `Phase 2 CloudBase health check function`
- Local source: `cloudfunctions/mallHealth`
- Config source: `cloudbaserc.json`

Validated the deployed function with CloudBase CLI:

```powershell
npx.cmd -p @cloudbase/cli tcb fn invoke mallHealth --envId cloud1-d7gifjyzl7721b383 --json
```

Result:

- `InvokeResult`: `0`
- `RetMsg.success`: `true`
- `RetMsg.data.envId`: `cloud1-d7gifjyzl7721b383`
- `RetMsg.data.billingMode`: `free-quota`
- `RetMsg.data.requiredCollections`: `14`

The CLI opened a CloudBase device authorization page and authorization completed
successfully before invocation.

Created and deployed CloudBase MVP API contract cloud function:

- Function name: `mallApi`
- Function type: normal event function
- Runtime: `Nodejs18.15`
- Local source: `cloudfunctions/mallApi`
- Config source: `cloudbaserc.json`
- Deployment command:

```powershell
npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId cloud1-d7gifjyzl7721b383 --dir cloudfunctions/mallApi --force --json
```

Validated the deployed function with CloudBase CLI:

```powershell
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-health.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-list-contracts.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-unsupported.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-create-ocr-batch.json' --json
```

Initial validation before business-data wiring:

- `health`: `success=true`, `service=mall-api`, `supportedActions=20`.
- `listContracts`: `success=true`, includes the Phase 2 API action list.
- unknown action: `success=false`, `error.code=NOT_FOUND`.
- Business-data actions were wired in the follow-up deployment below; the
  follow-up result is the current state.

Follow-up deployment after business-data wiring:

```powershell
npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId cloud1-d7gifjyzl7721b383 --dir cloudfunctions/mallApi --force --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-create-ocr-batch.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-get-latest-drafts.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId cloud1-d7gifjyzl7721b383 -d '@cloudfunctions/mallApi/invoke-list-products.json' --json
```

Follow-up results:

- `createOcrBatch`: `success=true`; created CloudBase batch
  `batch-moy3j5l6-1` and draft `draft-moy3j5st-2`.
- `getLatestDrafts`: `success=true`; read back the same persisted batch and
  draft through deployed `mallApi`.
- `confirmBatch`: `success=true`; created product `product-moy3lf6q-1` and
  SKU `sku-moy3lf6q-2` after fixing CloudBase `doc(id).update(...)` to omit
  `_id` from the update payload.
- `listProducts`: `success=true`; read CloudBase product data through deployed
  `mallApi`.

The function is no longer only a contract boundary for the OCR/draft/product
baseline. The mini-program MVP pages are now wired through CloudBase facades,
and the generated mp-weixin project now uses real AppID
`wxa63c53796488d4d4`.

2026-05-10 final Phase 2 gate update:

- The AppID/environment/function/collection blockers were resolved for
  CloudBase environment `cloud1-d7gifjyzl7721b383`.
- The required collections were created/confirmed in the correct environment;
  the `ocr_batches` collection-not-exist blocker is resolved.
- The user confirmed the current owner `开始识别` path passed WeChat DevTools
  manual acceptance after the CloudBase fixes.
- The fixed mock OCR output issue was handled by preventing fabricated product
  fields from being written before a real OCR provider exists. Real OCR/AI
  remains Phase 6.

## Console Warnings Observed

The CloudBase database page showed:

1. Database rollback capability is not enabled.
2. The current CloudBase built-in database instance is shared and may have
   compute contention; the console suggests upgrading to a dedicated instance.

Decision:

- Do not upgrade now because the approved billing posture is free quota first.
- Treat rollback capability as a pre-production operations gap, not a blocker
  for local CloudBase Phase 2 contract work.

## Remaining Console Actions

No CloudBase console action blocks Phase 2 backend/persistence closure.

Carried-forward operations gaps:

1. Clean/reset Phase 2 smoke data if a pristine manual acceptance dataset is
   needed.
2. Database rollback capability and dedicated database instance remain
   pre-production operations decisions; they are not blockers for entering
   Phase 3 development under the current free-quota posture.
