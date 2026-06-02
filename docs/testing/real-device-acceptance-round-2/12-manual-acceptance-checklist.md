# Phase 12 Manual Acceptance Checklist

This checklist must be completed in WeChat DevTools or on a real device using the deployed CloudBase environment:

```text
cloud1-d7gifjyzl7721b383
```

Automated verification and deployment are not substitutes for this checklist.

## Product Image Chain

| ID | Operation | Expected Result | Actual Result | Screenshot / Evidence | Pass? | Issue ID | Blocks Release? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IMG-01 | Open customer product list. | Published product images render from durable `cloud://` source through temporary URL resolution; no expired signed URL placeholder is shown. |  |  |  |  |  |
| IMG-02 | Open a product detail page from the list. | Main image renders; detail image section does not show broken/expired signed URLs. |  |  |  |  |  |
| IMG-03 | Disable network briefly or force image load error, then restore and revisit product list/detail. | Page can refresh the image view or show the intended fallback without corrupting product data. |  |  |  |  |  |
| IMG-04 | Open owner product management. | Product cards show image status consistently; image state does not depend on stale signed URL persistence. |  |  |  |  |  |

## Owner Product Unified Edit

| ID | Operation | Expected Result | Actual Result | Screenshot / Evidence | Pass? | Issue ID | Blocks Release? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EDIT-01 | Open owner product management and tap a product's unified edit button. | A single product edit modal opens with product basics and SKU inventory in one flow. |  |  |  |  |  |
| EDIT-02 | Inspect the product code field. | Product code is visible but read-only/disabled. |  |  |  |  |  |
| EDIT-03 | Change product name and description, then save basics. | Save succeeds; product list/detail can show the updated product name and description; product code remains unchanged. |  |  |  |  |  |
| EDIT-04 | Edit a SKU spec, sale price, or stock from the same modal. | SKU save succeeds through the existing SKU inventory flow and inventory view refreshes. |  |  |  |  |  |
| EDIT-05 | Restock or clear stock using the modal controls. | Existing inventory ledger behavior is preserved; no unrelated product basics fields are changed. |  |  |  |  |  |
| EDIT-06 | Reopen the edited product. | Updated basics and SKU values are persisted after reload. |  |  |  |  |  |

## Customer Checkout Auth

| ID | Operation | Expected Result | Actual Result | Screenshot / Evidence | Pass? | Issue ID | Blocks Release? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-01 | Open product detail as a customer without a bound phone. | Primary checkout button uses native WeChat phone authorization. |  |  |  |  |  |
| AUTH-02 | Tap checkout and cancel phone authorization. | No phone is bound, no order is created, and the UI returns to a safe idle state. |  |  |  |  |  |
| AUTH-03 | Tap checkout and approve phone authorization. | Phone is bound through CloudBase/WeChat auth, then the order is created. |  |  |  |  |  |
| AUTH-04 | Repeat checkout after phone is already bound. | Checkout proceeds without requesting phone authorization again. |  |  |  |  |  |
| AUTH-05 | Open customer Mine after phone binding. | Mine shows phone-bound state consistently with the same customer identity. |  |  |  |  |  |

## Customer Private Runtime Smoke

| ID | Operation | Expected Result | Actual Result | Screenshot / Evidence | Pass? | Issue ID | Blocks Release? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CUST-01 | Open customer Mine with a verified WeChat identity. | `getCustomerMineSnapshot` succeeds; no raw CloudBase error appears. |  |  |  |  |  |
| CUST-02 | Open customer Shopping Bag with a verified WeChat identity. | `getCustomerShoppingBagSnapshot` succeeds; empty or populated state renders normally. |  |  |  |  |  |
| CUST-03 | Open customer Favorites with a verified WeChat identity. | `getCustomerFavoriteProductsSnapshot` succeeds; empty or populated state renders normally. |  |  |  |  |  |

## Release Decision Fields

| Field | Value |
| --- | --- |
| Tester |  |
| Device / DevTools version |  |
| Mini Program AppID |  |
| CloudBase envId | `cloud1-d7gifjyzl7721b383` |
| Build artifact | `dist/build/mp-weixin` |
| Overall result |  |
| Blocking issue IDs |  |
| Release recommendation |  |
