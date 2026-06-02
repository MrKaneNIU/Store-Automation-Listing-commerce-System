# Real Device Round 2 Image Domain Checklist

Date: 2026-06-01
Scope: P0-2 / P1-1 product image loading for customer catalog, customer detail, and owner product management.

## Required WeChat Mini Program Settings

- Download file valid domain must include: `https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la`
- DevTools project currently has `urlCheck: true` in `dist/build/mp-weixin/project.config.json`; do not rely on domain bypass for acceptance.
- Real-device verification must test with domain verification enabled.

## Expected Data Shape

- Product image source stored in CloudBase must be durable `cloud://...`, not persisted signed `https://*.tcb.qcloud.la?...sign=...`.
- Runtime may convert `cloud://...` to a signed temporary HTTPS URL immediately before rendering.
- Expired signed HTTPS URLs are expected to fail; the page should retry by refreshing the product ViewModel instead of treating the product as image-missing.

## Current Evidence

- Remote product `product-mpm3rv2e-1` stores durable `cloud://.../uploads/product_main_image/...jpg`.
- Storage object exists under bucket `636c-cloud1-d7gifjyzl7721b383-1429982088`.
- Fresh signed URL returned HTTP 200 through `curl.exe -I`.
- Unsigned public URL returned HTTP 403, so public URL must not be used as an anonymous fallback.
- The user-reported signed URL was expired by the time it was rechecked and returned HTTP 403.

## Manual Acceptance Steps

1. Open customer product list on real device.
2. Confirm product image renders without `ERR_CONNECTION_CLOSED`.
3. Open product detail from the same card.
4. Confirm detail gallery image renders without showing fallback text.
5. Open owner product management.
6. Confirm historical product image renders for the published product.
7. If an image fails, capture the failing `src`, DevTools network error, device network type, and whether `tcb.qcloud.la` is configured as a download domain.

## Result Rule

- PASS only after real device confirms customer list, customer detail, and owner product management images all render.
- CONDITIONAL PASS is allowed only for automated checks plus domain checklist completion when real device acceptance is still pending.
- FAIL if the same durable `cloud://` product still becomes a broken `<image>` after domain settings are confirmed.
