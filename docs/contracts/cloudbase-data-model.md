# CloudBase Data Model Contract

## Positioning

This contract defines the approved Phase 2 CloudBase data boundary before Phase
3 real image storage work starts.

Current status:

- CloudBase is the approved long-term backend and persistence route.
- PostgreSQL code under `backend/` remains transitional engineering evidence.
- Mini-program pages must not call CloudBase directly.
- CloudBase access must stay behind service/repository adapters.

## Required Environment Inputs

Real CloudBase deployment remains blocked until these external inputs are
provided:

1. `CLOUDBASE_ENV_ID` for dev/staging: `shop-d0gl83cca8b2777b5`.
2. Tencent Cloud or WeChat mini-program account that owns the environment.
3. Operator access for deploying cloud functions and configuring cloud database
   collections/indexes.
4. Billing posture: `free-quota`.

## Collections

The Phase 2 CloudBase model must include these collections:

| Collection | Purpose |
| --- | --- |
| `ocr_batches` | OCR batch metadata and status |
| `product_drafts` | OCR draft rows and review status |
| `products` | SPU product records |
| `skus` | SKU records and stock |
| `orders` | Customer order header |
| `order_items` | Order item rows |
| `customers` | Customer identity placeholder for future real auth |
| `merchant_users` | Merchant owner identity placeholder for future role binding |
| `staff_users` | Owner/staff placeholder for future role binding |
| `role_assignments` | Future user-role binding records |
| `inventory_ledger` | Future inventory audit trail |
| `operation_audit_logs` | Future operation audit records |
| `uploaded_assets` | Uploaded asset metadata for Phase 3 storage |
| `ocr_jobs` | Future asynchronous OCR job records |

The executable definition lives in
`backend/src/cloudbase/cloudbase-data-model.ts`.

## Required Indexes

Minimum indexes required by the MVP loop:

| Collection | Index | Reason |
| --- | --- | --- |
| `product_drafts` | `batch_id` | Draft lookup by OCR batch |
| `products` | `status_updated_at` | Published product browsing and owner review |
| `skus` | `product_id` | SKU lookup by product |
| `orders` | `status_created_at` | Merchant order queue lookup |
| `order_items` | `order_id` | Order detail reconstruction |
| `customers` | `openid` | Future WeChat identity lookup |
| `staff_users` | `role` | Staff role queue and authorization lookup |
| `merchant_users` | `role` | Merchant role lookup |
| `role_assignments` | `user_id` | Future role binding lookup |
| `inventory_ledger` | `sku_id_created_at` | Inventory audit trail lookup |
| `operation_audit_logs` | `target_created_at` | Operation trace reconstruction |
| `uploaded_assets` | `status_created_at` | Asset processing queue lookup |
| `ocr_jobs` | `status_created_at` | OCR job queue lookup |

## Change Rules

CloudBase collection, index, permission, and data-shape changes must be tracked
as scripts or change records.

Each change record must include:

1. Purpose.
2. Environment.
3. Operator.
4. Rollback or compensation plan.
5. Validation result.

Do not silently mutate staging or production collections by hand.

## Validation

Current local validation:

```powershell
pnpm.cmd run backend:test
```

This verifies:

- required collections are defined;
- key indexes exist;
- CloudBase health envelope does not expose credentials;
- CloudBase repository adapter passes the shared repository contract using a
  local memory CloudBase document store;
- CloudBase product/SKU write path rolls back on invalid SKU stock.

Real CloudBase deployment and WeChat DevTools acceptance are still blocked
until Tencent Cloud operator access is available for deployment and collection
configuration.
