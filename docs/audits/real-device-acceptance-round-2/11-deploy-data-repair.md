# Phase 11 Deploy And Data Repair

Recorded at: 2026-06-02 01:08:16 +08:00

## CloudBase Environment

| Field | Value |
| --- | --- |
| envId | `cloud1-d7gifjyzl7721b383` |
| alias | `cloud1` |
| region | `ap-shanghai` |
| env status | `NORMAL` |
| auth status | `READY` |

## Deployment

`mallApi` source changed in this round, so the cloud function was redeployed.

| Item | Evidence |
| --- | --- |
| Function | `mallApi` |
| Deploy source | `D:\CodeX\VX close systhem\cloudfunctions\mallApi` |
| Deploy operation | CloudBase MCP `manageFunctions(action=updateFunctionCode)` |
| Deploy RequestId | `4ea49bde-6ed7-450a-ba8b-a71e10043550` |
| Post-deploy function status | `Active` |
| Post-deploy available status | `Available` |
| Post-deploy mod time | `2026-06-02 01:01:55` |
| Runtime | `Nodejs18.15` |
| Handler | `index.main` |

## Remote Contract Confirmation

| Check | Result | Evidence |
| --- | --- | --- |
| `health` | PASS | Remote invoke RequestId `ba7108e8-2b3b-473f-a84c-4ce4ee68743c`; response `success: true`, service `mall-api`, envId `cloud1-d7gifjyzl7721b383`, supportedActions `50` during update window. |
| `listContracts` before status settled | OLD CONTRACT OBSERVED | Remote invoke RequestId `8c3839d5-9486-4389-9ff8-9b5f4d3f1e25`; function status was still `Updating`, and `updateProductBasics` was not yet present. |
| Function status poll | PASS | Function reached `Active` / `Available`; CodeSize changed to `14384132`. |
| `listContracts` after status settled | PASS | Remote invoke RequestId `438811ce-f090-414f-a1b2-e9140b48da60`; response includes `updateProductBasics`, `getCustomerMineSnapshot`, shopping bag, favorites, and checkout actions. |

## Schema And Data Repair

No data repair write was executed in this phase.

Rationale:

- The deployed code change adds `updateProductBasics` and does not require a schema migration.
- Product image audit in Phase 10 was local contract evidence only and did not identify a safe automated production/staging write to perform.
- `pnpm.cmd run cloudbase:schema:check` after deploy reported all 16 required collections present:
  `ocr_batches`, `product_drafts`, `products`, `skus`, `orders`, `order_items`, `customers`, `shopping_bag_items`, `customer_favorites`, `merchant_users`, `staff_users`, `role_assignments`, `inventory_ledger`, `operation_audit_logs`, `uploaded_assets`, `ocr_jobs`.

## Staging Smoke

`pnpm.cmd run verify:staging` was executed after deploy and returned exit code 1.

Interpretation:

- `healthOk: true`
- `listContractsOk: true`
- Customer-private actions returned `UNAUTHORIZED`, with no raw CloudBase error leakage:
  `getCurrentCustomer`, `getCustomerShoppingBagSnapshot`, `getCustomerFavoriteProductsSnapshot`, `getCustomerMineSnapshot`
- This is expected for local invocation without a verified WeChat identity and must be completed in WeChat DevTools or on a real device.

The post-deploy staging run also reported probe errors for `skus` and `merchant_users`, but an immediate dedicated `pnpm.cmd run cloudbase:schema:check` passed and confirmed both collections exist. Treat the staging schema probe error as non-final unless it reproduces in a focused schema check.

## Manual Acceptance Boundary

Remote deployment and contract availability are confirmed. Customer-private runtime acceptance remains conditional until verified with a real WeChat identity in WeChat DevTools or on a real device.
