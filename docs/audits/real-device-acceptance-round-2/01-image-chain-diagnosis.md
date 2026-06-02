# Round 2 Image Chain Diagnosis

Captured: 2026-06-01 23:30 +08:00

Agent phase: `agents.prd_debugger.toml`

Scope: read-only diagnosis. No business code, CloudBase data, storage object, deployment, or schema write was performed.

## Root Cause Conclusion

Primary root cause for the observed product image failure / `ERR_CONNECTION_CLOSED` class is not missing product image data. The current remote product record stores a durable CloudBase fileID in `products.main_image_url` and `products.image_urls`, the corresponding storage object exists, and CloudBase can generate a signed temporary URL for it.

The remaining blocker is the render-time delivery path from temporary HTTPS URL to WeChat `<image src>`. Evidence points to a domain / runtime access risk around `https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/...`, not a missing `products` field. The mini program has `urlCheck: true`, so real-device acceptance must prove the storage CDN domain is present in the WeChat Mini Program download legal-domain configuration and that the device network can load the signed URL.

Secondary data-model finding: `uploaded_assets` exists and is part of the required schema, but the current staff product image path does not write asset metadata into it. Product image display uses durable `cloud://` fileIDs persisted directly on `products`; `uploaded_assets` is an audit/status gap, not the direct display source for the current product image.

## Evidence Files

- `src/pages/staff/image-tasks/index.vue:176` calls `supplement(product.id)`, then refreshes the task snapshot after upload.
- `src/features/cloudbase-mall/staff-image-tasks.ts:85` calls `uploadService.chooseAndUploadImages(...)` with `businessType: 'product_main_image'`, `sourceRole: 'staff'`, `entityType: 'product'`, then calls `client.supplementProductImages(...)`.
- `src/services/storage/cloudbase-upload-service.ts:180` builds storage paths under `uploads/{businessType}/{sourceRole}/{entityType}/{entityId}/...`.
- `src/services/storage/cloudbase-upload-service.ts:162` persists `cloud://` fileIDs for `product_main_image` and `product_detail_image`.
- `src/services/storage/cloudbase-upload-service.ts:220` refreshes fileIDs with `wx.cloud.getTempFileURL(... maxAge: 2700)`.
- `src/services/storage/product-image-url.ts:53` resolves `cloud://` product image fields into render URLs and caches them for 45 minutes.
- `cloudfunctions/mallApi/mall-api-core.js:598` maps `Product.mainImageUrl/imageUrls` to `products.main_image_url/image_urls`.
- `cloudfunctions/mallApi/mall-api-core.js:1896` handles `supplementProductImages` by updating product image fields and setting status to `ready_to_publish`.
- `src/features/cloudbase-mall/owner-products.ts:49` reads `listOwnerProductCards` and resolves `mainImageUrl` for owner product cards.
- `src/pages/owner/products/index.vue:55` renders `product.mainImageUrl` directly as `<image :src="product.mainImageUrl">`.
- `src/features/cloudbase-mall/customer-product-list.ts:13` reads `listPublishedProductSummaries` and resolves only `mainImageUrl`.
- `src/pages/customer/product-list/index.vue:97` renders `product.mainImageUrl` directly as image `src`.
- `src/features/cloudbase-mall/customer-product-detail.ts:37` reads `getPublishedProductDetail` and resolves product image fields.
- `src/pages/customer/product-detail/index.vue:50` renders `viewModel.product.mainImageUrl` directly as image `src`.
- `config/cloudbase/schema.required.json:145` declares `uploaded_assets` with required fields, but no product display path reads it.
- `docs/operations/production-config-snapshot.current.json:38` records the storage CDN as a required download domain snapshot from an earlier production config capture.

## Chain Trace

1. Staff image page:
   `src/pages/staff/image-tasks/index.vue` -> `supplement(product.id)`.

2. Staff facade:
   `src/features/cloudbase-mall/staff-image-tasks.ts` -> `uploadService.chooseAndUploadImages({ businessType: 'product_main_image', sourceRole: 'staff', entityType: 'product', entityId: productId })`.

3. Upload service:
   `src/services/storage/runtime-upload-service.ts` selects `cloudbaseUploadService` in mini program runtime.
   `src/services/storage/cloudbase-upload-service.ts` uses `wx.cloud.uploadFile`, then `wx.cloud.getTempFileURL`.

4. CloudBase storage:
   product image object path shape:
   `uploads/product_main_image/staff/product/{productId}/{timestamp}-{index}-{filename}`.

5. Product update:
   `client.supplementProductImages(productId, { mainImageUrl, imageUrls })` -> `mallApi.supplementProductImages` -> `products.main_image_url` / `products.image_urls`.

6. Owner product management preview:
   `listOwnerProductCards` returns product cards with durable fields.
   `getCloudBaseOwnerProductsView` resolves `mainImageUrl`.
   `src/pages/owner/products/index.vue` renders `product.mainImageUrl`.

7. Customer product list:
   `listPublishedProductSummaries` returns durable fields.
   `getCloudBaseCustomerProductListView` resolves `mainImageUrl`.
   `src/pages/customer/product-list/index.vue` renders `product.mainImageUrl`.

8. Customer product detail:
   `getPublishedProductDetail` returns product + skus.
   `getCloudBaseCustomerProductDetailView` resolves `mainImageUrl` and `imageUrls`.
   `src/pages/customer/product-detail/index.vue` renders `viewModel.product.mainImageUrl`.

9. Mini program image src:
   `<image :src="...">` receives a signed HTTPS URL from `wx.cloud.getTempFileURL`, not the canonical `cloud://` fileID.

## Collections And Storage Paths

Collections directly involved:

- `products`: canonical product image fields.
- `skus`: used to validate whether published product summaries/details are saleable.
- `uploaded_assets`: required schema collection, currently empty in the remote read-only sample and not used by the current product display path.

Remote read-only samples:

```json
{
  "collection": "products",
  "_id": "product-mpm3rv2e-1",
  "product_code": "122334",
  "product_name": "衬衫",
  "status": "published",
  "main_image_url": "cloud://cloud1-d7gifjyzl7721b383.636c-cloud1-d7gifjyzl7721b383-1429982088/uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-<redacted>.jpg",
  "image_urls": [
    "cloud://cloud1-d7gifjyzl7721b383.636c-cloud1-d7gifjyzl7721b383-1429982088/uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-<redacted>.jpg"
  ],
  "created_at": "2026-05-26T03:56:03.206Z",
  "updated_at": "2026-05-27T14:28:07.061Z"
}
```

```json
{
  "collection": "skus",
  "_id": "sku-mpm3rv2e-2",
  "product_id": "product-mpm3rv2e-1",
  "spec": "黑色/XL"
}
```

```json
{
  "collection": "uploaded_assets",
  "data": [],
  "total": 0,
  "note": "Remote collection exists but contains no product image asset metadata in the read-only sample."
}
```

CloudBase storage read-only sample:

```json
{
  "Key": "uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-<redacted>.jpg",
  "LastModified": "2026-05-26T03:56:15.000Z",
  "Size": "10651",
  "StorageClass": "STANDARD"
}
```

Historical product-image storage paths observed in read-only listing:

- `uploads/product_main_image/staff/product/product-mpi04go4-1/1779519775694-1-<redacted>.jpg`
- `uploads/product_main_image/staff/product/product-mpkjfsqw-1/1779673152005-1-<redacted>.jpg`
- `uploads/product_main_image/staff/product/product-mpm3rv2e-1/1779767771566-1-<redacted>.jpg`

No new upload was performed in this diagnosis phase. New-upload data shape is inferred from code:

```json
{
  "assetId": "cloud://<env>.<bucket>/uploads/product_main_image/staff/product/<productId>/<timestamp>-1-<filename>",
  "cloudPath": "uploads/product_main_image/staff/product/<productId>/<timestamp>-1-<filename>",
  "url": "https://<bucket>.tcb.qcloud.la/uploads/product_main_image/...?...",
  "status": "uploaded"
}
```

## Remote Function Evidence

Read-only `mallApi.listContracts` confirmed the deployed function includes:

- `listPublishedProductSummaries`
- `getPublishedProductDetail`
- `listOwnerProductCards`
- `getStaffImageTaskSnapshot`
- `supplementProductImages`

Read-only `mallApi.listPublishedProductSummaries` returned one published product with the durable `cloud://...uploads/product_main_image/...jpg` `mainImageUrl`.

Read-only `mallApi.getPublishedProductDetail` for `product-mpm3rv2e-1` returned the same durable product image fields and one SKU.

Function detail was queried read-only. It confirmed `mallApi` is active in `cloud1-d7gifjyzl7721b383` and was last modified at `2026-06-01 13:23:03`. The tool output also exposed plaintext environment variable values; this document intentionally does not persist those values. Rotate those secrets if this transcript or logs are shared outside the trusted development context.

## Page Read Fields

Owner product management:

- Facade reads `OwnerProductCard.mainImageUrl`.
- Page reads `product.mainImageUrl`.
- Page renders `<image :src="product.mainImageUrl" mode="aspectFill">`.
- Page no longer applies the earlier `isRenderableOwnerProductImageUrl(product.mainImageUrl)` guard.

Customer product list:

- Facade reads `PublishedProductSummary.mainImageUrl`.
- Facade returns `imageUrls: []` for list rows.
- Page reads `product.mainImageUrl`.
- Page renders `<image :src="product.mainImageUrl" mode="aspectFill">`.

Customer product detail:

- Facade reads `product.mainImageUrl` and `product.imageUrls`.
- Page currently renders `viewModel.product.mainImageUrl` as the first gallery image.
- Detail `imageUrls` are resolved by the facade, but the current first viewport still uses the primary image field.

SKU image fields:

- Current remote `skus` sample has no SKU image field.
- Current code path does not use SKU-level image URLs for product list or detail rendering.
- The customer detail SKU view maps only `id`, `spec`, `salePrice`, `stock`, `isSelected`, and `isDisabled`.

## URL Expiration Assessment

Canonical stored value:

- `cloud://...` fileID in `products.main_image_url` and `products.image_urls`.
- This value does not expire and is the correct persisted data shape.

Render value:

- Client-side `wx.cloud.getTempFileURL` uses `maxAge: 2700` seconds.
- MCP `queryStorage(action=url)` generated a temporary URL with `expireTime: 3600秒`.
- `src/services/storage/product-image-url.ts` caches resolved URLs for 45 minutes.

Conclusion: signed HTTPS render URLs do expire. The current code should not persist them as canonical product data, and current product data does not show that problem. If a user leaves a page open past the temporary URL TTL, image reload can fail unless the view refreshes and re-resolves the `cloud://` fileID.

## Domain And Permission Risk

Confirmed:

- `src/manifest.json` has `mp-weixin.setting.urlCheck: true`.
- CloudBase env storage CDN domain is `636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la`.
- Earlier production config snapshot lists that domain under `download`.
- TCP 443 to the storage CDN domain succeeded from this workstation.
- `curl.exe -I` against the signed URL returned `HTTP/1.1 200 OK`, `Content-Type: image/jpeg`, and `Content-Length: 10651`.

Risk still requiring real-device proof:

- The current workstation DNS resolved the storage CDN domain to `198.18.0.173`, which is a non-public benchmark/private-use style address. `curl.exe` still succeeded locally, but this does not prove the WeChat real-device network path.
- PowerShell `Invoke-WebRequest -Method Head` against both signed and unsigned storage URLs failed with `基础连接已经关闭: 发送时发生错误。`. This reproduces the connection-closed class at the local HTTP client layer, even though `curl.exe` succeeds.
- WeChat `<image>` loads are governed by the Mini Program domain whitelist and runtime networking. If the active WeChat app configuration does not include the exact `https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la` download domain, `urlCheck: true` can block image loading despite valid product data.
- Unsigned `publicUrl` is only safe if the bucket/path is public-read. Current flow uses signed temporary URLs; do not switch to unsigned public URLs without an explicit storage ACL decision.

## Is A Data Repair Script Needed?

Not for the current observed sample.

Reasons:

- `products.main_image_url` and `products.image_urls` contain durable `cloud://` fileIDs.
- The storage object exists at the matching `uploads/product_main_image/...` path.
- `listPublishedProductSummaries` and `getPublishedProductDetail` return the expected product image fields.

Potential data repair is only needed if a future scan finds products where:

- `main_image_url` is a signed `https://...tcb.qcloud.la...?sign=...` URL instead of `cloud://`.
- `image_urls` contains expired signed URLs as canonical data.
- `main_image_url` points to a missing storage object.

`uploaded_assets` backfill is optional for audit/history completeness, not required to unblock current product image rendering.

## Minimal Fix Scheme

1. Do not change product data shape: keep canonical product images as `cloud://` fileIDs.
2. Do not persist signed temporary URLs in `products` or `skus`.
3. Verify in WeChat Mini Program console that `https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la` is in the download legal domain list for appid `wxa63c53796488d4d4`.
4. On real device, capture the `<image>` error event payload or DevTools network row for the signed URL. Distinguish whitelist block, TLS/network close, 403/expired signature, and DNS/proxy failure.
5. If the domain is configured but real device still reports `ERR_CONNECTION_CLOSED`, prefer resolving images with `wx.cloud.getTempFileURL` immediately before render and retrying once on image `@error` by re-resolving the original `cloud://` fileID.
6. If product rows with persisted signed URLs are found, add a separate read-only scan first, then a narrowly scoped data repair script that rewrites only recoverable signed URLs back to corresponding `cloud://` fileIDs when the storage path can be proven.
7. If product image audit history is required, add a separate backfill plan for `uploaded_assets`; do not make customer image rendering depend on it.

## Rollback Scheme

For config-only domain fixes:

- Remove the newly added download domain from the WeChat Mini Program console and restore the prior domain configuration snapshot.
- No database rollback is needed.

For a future retry/re-resolve frontend fix:

- Revert only the image retry/re-resolve commit.
- Keep existing canonical `cloud://` product records untouched.

For a future data repair script:

- Require a dry-run output and backup export before writes.
- Store pre-repair `{ productId, main_image_url, image_urls }`.
- Roll back by restoring only those captured fields for affected products.

For `uploaded_assets` backfill:

- Make records idempotent by deterministic key or unique source tuple.
- Roll back by deleting only records tagged with the backfill batch id.

## Current Blocker Status

Image data chain status: data is present and product fields are correct for the current sample.

Display status: still blocked until real-device WeChat `<image>` loading proves the signed storage URL can load under `urlCheck: true`.

Acceptance status: do not mark PASS yet. The current phase proves the data/storage chain, but not the device-side image renderer.
