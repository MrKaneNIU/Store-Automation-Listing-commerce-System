# Customer Runtime Stabilization - Schema Delivery Log

Captured: 2026-06-01 13:08:48 +08:00

## Scope

This log covers Package A from `docs/prd/debug-prd.md`: CloudBase schema stabilization for customer shopping bag, favorites, and mine runtime paths.

In scope:

- Add the missing customer-private schema contract for `shopping_bag_items`.
- Add the missing customer-private schema contract for `customer_favorites`.
- Keep `orders.customer_id` queryability explicit for mine snapshots.
- Add local scripts that prove required collections exist before runtime smoke.
- Create the missing dev/staging collections and indexes in `cloud1-d7gifjyzl7721b383`.

Out of scope:

- Payment, logistics, refunds, coupons, customer service, OCR feature expansion, and merchant-admin feature work.
- Production schema apply.
- Page-level direct database access.

## Implementation

Changed local schema contract:

- `backend/src/cloudbase/cloudbase-data-model.ts`
- `backend/src/cloudbase/cloudbase-data-model.test.ts`
- `config/cloudbase/schema.required.json`
- `cloudfunctions/mallHealth/index.js`
- `scripts/smoke-cloudbase-health.mjs`
- `package.json`
- `scripts/cloudbase-schema-utils.mjs`
- `scripts/cloudbase-schema-check.mjs`
- `scripts/cloudbase-schema-apply-staging.mjs`
- `scripts/verify-staging.mjs`

Remote changes applied to env `cloud1-d7gifjyzl7721b383`:

- Created collection `shopping_bag_items`.
- Created collection `customer_favorites`.
- Added `shopping_bag_items.customer_id_updated_at`.
- Added `shopping_bag_items.customer_product_sku`.
- Added `customer_favorites.customer_id_created_at`.
- Added `customer_favorites.customer_product`.

## Evidence

RED:

- `pnpm.cmd exec vitest run --config backend/vitest.config.ts backend/src/cloudbase/cloudbase-data-model.test.ts`
- Initial failure: schema metadata still listed 14 collections and did not define `shopping_bag_items`.

GREEN:

- `pnpm.cmd exec vitest run --config backend/vitest.config.ts backend/src/cloudbase/cloudbase-data-model.test.ts`
- Result: 1 file, 5 tests passed.

Remote schema before create:

- `pnpm.cmd run cloudbase:schema:check`
- Result: failed as expected with missing `shopping_bag_items` and `customer_favorites`.
- `pnpm.cmd run cloudbase:schema:apply:staging`
- Result: failed safely and generated manual create checklist; it did not fake a create through an unsafe CLI probe.

Remote schema after create:

- `pnpm.cmd run cloudbase:schema:check`
- Result: ok, 16 required collections present.
- `pnpm.cmd run cloudbase:schema:apply:staging`
- Result: ok, idempotent, no changes needed.
- CloudBase MCP `describeCollection` confirmed both customer-private indexes.

Health smoke:

- `pnpm.cmd run cloudbase:health:smoke`
- Result: ok, `requiredCollections` is 16.

## Notes

The CloudBase CLI `find` probe returns success with an empty result for missing empty collections, so `cloudbase:schema:check` uses `listCollections` instead. This prevents a false PASS when the collection does not exist.

CloudBase function detail output exposed environment variable values through the management API response. Those values are intentionally not copied into this repository artifact. Rotate the affected CloudBase function secrets outside this PRD if the team treats tool-output exposure as credential exposure.
