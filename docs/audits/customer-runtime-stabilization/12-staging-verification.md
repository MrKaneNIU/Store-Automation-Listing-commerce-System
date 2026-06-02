# Customer Runtime Stabilization - Staging Verification

Captured: 2026-06-01 13:31:00 +08:00

## Target

Environment:

- EnvId: `cloud1-d7gifjyzl7721b383`
- Function: `mallApi`
- Runtime: `Nodejs18.15`
- Function status after deploy: `Active`
- Function availability after deploy: `Available`

## Schema Verification

Command:

```powershell
pnpm.cmd run cloudbase:schema:check
```

Result: passed.

Observed required collection count: 16.

Required customer-private collections:

- `shopping_bag_items`: exists
- `customer_favorites`: exists

Command:

```powershell
pnpm.cmd run cloudbase:schema:apply:staging
```

Result: passed, idempotent.

Observed output:

- `ok: true`
- `changed: false`
- message: all required CloudBase collections already exist.

## Index Verification

CloudBase MCP `describeCollection` confirmed:

- `shopping_bag_items.customer_id_updated_at`
- `shopping_bag_items.customer_product_sku` unique
- `customer_favorites.customer_id_created_at`
- `customer_favorites.customer_product` unique

## mallApi Deployment Verification

Deploy tool:

- CloudBase `manageFunctions.updateFunctionCode`
- Request id: `b12e2f64-0417-4ed0-a4f9-05fc5814cf35`

Contract smoke:

- Tool: CloudBase `manageFunctions.invokeFunction`
- Event: `{ "action": "listContracts" }`
- Result: success.

Required customer actions observed:

- `getCurrentCustomer`
- `getCustomerMineSnapshot`
- `getCustomerShoppingBagSnapshot`
- `getCustomerFavoriteProductsSnapshot`
- `addCustomerShoppingBagItem`
- `updateCustomerShoppingBagItemQuantity`
- `selectCustomerShoppingBagItem`
- `removeCustomerShoppingBagItem`
- `clearUnavailableCustomerShoppingBagItems`
- `favoriteCustomerProduct`
- `unfavoriteCustomerProduct`
- `removeCustomerFavoriteProduct`

## Staging Script

Command:

```powershell
pnpm.cmd run verify:staging
```

Result: failed intentionally with exit code 1.

Passed buckets:

- schema ok
- `mallApi.health` ok
- `mallApi.listContracts` ok
- customer-private action transport ok
- no raw CloudBase error leak detected

Blocked bucket:

- customer-private actions returned `UNAUTHORIZED` because this shell/MCP smoke lacks a verified WeChat mini-program runtime identity.
- Script reported `manualAcceptanceRequired: Customer-private smoke needs verified WeChat identity from DevTools or real device.`

## Staging Conclusion

Remote schema, deployment, contract discovery, transport, and raw-error leak checks are complete.

The staging script correctly refuses final success until verified WeChat identity smoke is completed in DevTools or on a real device.
