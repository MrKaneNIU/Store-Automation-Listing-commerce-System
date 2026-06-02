# Real Device Acceptance Fixes - Manual Acceptance Checklist

Captured: 2026-06-01 18:30:00 +08:00

Status: `PENDING_MANUAL_ACCEPTANCE`

Overall PRD status remains: `FAIL` until the checklist below is executed in WeChat DevTools or on a real device.

## Build Under Test

Use the latest local build output:

```powershell
pnpm.cmd run verify:full
```

Import:

```text
dist/build/mp-weixin
```

The latest automated run passed:

- root Vitest: 75 files, 471 tests.
- backend Vitest: 12 files, 61 tests.
- `build:mp-weixin`, `e2e-smoke`, and `mp:runtime-audit` passed.

## Acceptance Items

1. Customer shopping bag, favorites, and mine pages load without the mp-weixin runtime module error.
   - Expected: no `services/performance/url.js`, `require("url")`, or raw module-loader error appears.
   - Expected: page-facing error copy remains sanitized if remote infrastructure is not ready.

2. Customer product image preview loads on product list and product detail.
   - Expected: products with stored CloudBase image asset IDs render an image.
   - Capture if failing: product ID, `main_image_url`/`image_urls` shape, `getTempFileURL` result shape, and image `@error` detail.

3. Product detail order creation with real WeChat phone authorization.
   - Steps: open an in-stock product, choose SKU, tap checkout, approve phone authorization, submit order.
   - Expected: order is created under the backend verified customer.
   - Expected: merchant pending order list shows the created order.
   - Expected: canceling phone authorization creates no order and deducts no stock.

4. Owner draft review clears confirmed drafts.
   - Steps: import/recognize a confirmable batch, confirm it, return to draft review.
   - Expected: confirmed/deleted drafts no longer appear in the review queue.
   - Expected: the page does not keep offering confirm for an already confirmed batch.

5. Staff image task batch filter labels are readable.
   - Expected: picker labels show batch context, status, pending image count, and uploaded screenshot count.
   - Expected: changing the picker still filters by the original batch ID.

6. Owner product management image preview after upload.
   - Expected: uploaded image appears in owner product cards instead of `NO IMAGE`.
   - Capture if failing: whether the imported package was rebuilt after Phase 5 and whether `refreshAssetUrls` returned an empty URL.

7. More, permissions, account management, and registration/password wording.
   - Expected: More page describes account registration, initial password setup, and password change consistently.
   - Expected: Account management registration requires account ID, initial password, and confirmation.
   - Expected: unknown/new accounts cannot be created from permissions page without going through account management.
   - Expected: non-creator accounts cannot log in with shared default `123456`.

## Pass Criteria

Manual acceptance can be marked `PASS` only when all seven items above pass on WeChat DevTools or a real device using the latest `dist/build/mp-weixin`.

If any item fails, keep status `FAIL` and record:

- exact page path.
- account/role used.
- product/order/batch ID where applicable.
- screenshot or console/runtime error.
- CloudBase action name and request time when applicable.
