# 2026-05-09 CloudBase Console Setup Log

## Environment

- Environment name: `shop`
- Environment ID: `shop-d0gl83cca8b2777b5`
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
npx.cmd -p @cloudbase/cli tcb fn invoke mallHealth --envId shop-d0gl83cca8b2777b5 --json
```

Result:

- `InvokeResult`: `0`
- `RetMsg.success`: `true`
- `RetMsg.data.envId`: `shop-d0gl83cca8b2777b5`
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
npx.cmd -p @cloudbase/cli tcb fn deploy mallApi --envId shop-d0gl83cca8b2777b5 --dir cloudfunctions/mallApi --force --json
```

Validated the deployed function with CloudBase CLI:

```powershell
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId shop-d0gl83cca8b2777b5 -d '@cloudfunctions/mallApi/invoke-health.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId shop-d0gl83cca8b2777b5 -d '@cloudfunctions/mallApi/invoke-list-contracts.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId shop-d0gl83cca8b2777b5 -d '@cloudfunctions/mallApi/invoke-unsupported.json' --json
npx.cmd -p @cloudbase/cli tcb fn invoke mallApi --envId shop-d0gl83cca8b2777b5 -d '@cloudfunctions/mallApi/invoke-create-ocr-batch.json' --json
```

Results:

- `health`: `success=true`, `service=mall-api`, `supportedActions=20`.
- `listContracts`: `success=true`, includes the Phase 2 API action list.
- unknown action: `success=false`, `error.code=NOT_FOUND`.
- contracted but not wired action: `success=false`, `error.code=NOT_IMPLEMENTED`.

This function is intentionally a contract boundary only. It does not yet switch
the mini-program runtime path and does not write CloudBase business data.

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

Still pending before declaring Phase 2 complete:

1. Wire `mallApi` contracted actions to the CloudBase repository adapter.
2. Wire mini-program service adapter to real `wx.cloud.callFunction` only after
   cloud function contracts are deployed.
3. Run WeChat DevTools manual acceptance against the CloudBase integration
   path.
