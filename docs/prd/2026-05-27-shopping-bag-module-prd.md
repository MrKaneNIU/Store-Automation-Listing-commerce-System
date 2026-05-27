# 2026-05-27 Shopping Bag Module PRD

## Problem Statement

Customers can browse products and create an order from a product detail page,
but they do not yet have a place to collect multiple purchase intentions before
checkout. Future shopping-bag work must not reuse the merchant order model as a
temporary cart, must not reserve stock before checkout, and must not bypass the
latency governance rules defined in
`docs/prd/2026-05-27-project-latency-optimization-prd.md`.

## Solution

Introduce a customer-side shopping bag as a private customer snapshot. Customers
can add published products/SKUs to the bag, review quantities, remove items,
and proceed to the existing order-creation flow. The bag itself is not an
order, does not reserve stock, and does not guarantee final inventory.

The module must be designed before implementation around a page-facing facade,
a CloudBase snapshot action, loading/failure state, write-after-refresh, and
manual acceptance evidence.

## User Stories

1. As a customer, I want to add a published product SKU to my shopping bag, so
   that I can decide later whether to place an order.
2. As a customer, I want to see the product name, SKU spec, quantity, price,
   and image for each bag item, so that I can review my intended purchase.
3. As a customer, I want to change item quantity in the bag, so that I can
   adjust my intended purchase before checkout.
4. As a customer, I want to remove an item from the bag, so that unwanted items
   do not stay in my purchase plan.
5. As a customer, I want unavailable or unpublished items to be marked clearly,
   so that I do not assume they can still be purchased.
6. As a customer, I want checkout to revalidate stock on the server, so that I
   do not rely on stale bag data.
7. As a customer, I want the bag page to show cached or loading content quickly,
   so that page entry does not feel blocked by network calls.
8. As a customer, I want failures to explain what happened and allow retry, so
   that I can continue without losing context.

## Implementation Decisions

- Customer identity is required for server-persisted shopping-bag data. A local
  anonymous draft may be considered later, but it must not become canonical
  server data.
- Phone authorization is not required to add or edit bag items. Phone
  authorization remains part of order creation when required by the existing
  checkout flow.
- Shopping-bag writes do not affect orders or inventory. Inventory is checked
  only during order creation.
- Customer-private data must be scoped by the verified customer/openid or
  customer session.
- First-screen snapshot action name:

```text
getCustomerShoppingBagSnapshot
```

- Page-facing facade should expose a ViewModel with bag items, availability
  labels, totals for display, loading/failure state, and command messages.
- Write commands should include add item, update quantity, remove item, clear
  unavailable items, and submit selected items into the existing checkout path.
- Write-after-refresh invalidates:

```text
customer-shopping-bag:{customerId}:v1
```

- Product publish/unpublish or SKU stock changes should eventually make bag
  item availability consistent, but bag item existence must not reserve stock.
- Target P0 performance budget: one first-screen bag snapshot action, O(1)
  with respect to bag size from the page perspective.

## Testing Decisions

- CloudFunction core tests must verify customer scoping, unavailable product
  handling, empty bag state, and no stock reservation on bag writes.
- CloudBase client tests must verify the snapshot and command action contracts.
- Facade tests must verify ViewModel labels, totals, unavailable states, and
  command messages.
- Page-state tests must verify onShow request dedupe, failure state, and
  write-after-refresh behavior.
- Existing customer order tests remain the authority for stock reservation and
  oversell prevention.

## Out of Scope

- Payment, logistics, coupon, refund, marketing, and customer-service behavior.
- Multi-address checkout.
- Merging anonymous local bags into server bags.
- Reserving inventory before order creation.
- Turning shopping-bag rows into merchant orders before checkout is confirmed.
- UI redesign beyond what is needed by the eventual approved module.

## Further Notes

Manual acceptance must record first entry duration, return-entry duration,
slow-network loading behavior, write-after-refresh behavior, and whether text
data remains available when images fail. Build smoke is not manual acceptance.
