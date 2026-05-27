# 2026-05-27 Favorites Module PRD

## Problem Statement

Customers can browse products, but they do not yet have a private way to save
products they may want to revisit. Favorites must not be modeled as a shopping
bag, must not affect orders or inventory, and must follow the existing
page-facing snapshot and latency governance path.

## Solution

Introduce a customer-side favorites module that lets customers save and remove
published products. The favorites page shows saved product cards, gracefully
handles unpublished or deleted products, and keeps all writes scoped to the
customer identity.

## User Stories

1. As a customer, I want to favorite a product from product detail, so that I
   can find it again later.
2. As a customer, I want to remove a product from favorites, so that the list
   stays relevant.
3. As a customer, I want to see saved products in a dedicated favorites list,
   so that I can return to product detail quickly.
4. As a customer, I want unavailable products to be marked or hidden according
   to product rules, so that I do not try to buy something unavailable.
5. As a customer, I want favorites to load quickly with a clear empty state, so
   that the page is understandable even before network completion.
6. As a customer, I want failures to keep previous context when possible and
   explain retry options, so that my saved list feels reliable.

## Implementation Decisions

- Customer identity is required for server-persisted favorites because
  favorites are private customer data.
- Phone authorization is not required for favoriting or unfavoriting products.
- Favorites do not affect orders, checkout, stock, or inventory ledger.
- Favorite state should be product-level, not SKU-level, unless a later PRD
  explicitly approves SKU favorites.
- First-screen snapshot action name:

```text
getCustomerFavoriteProductsSnapshot
```

- Product-detail favorite toggle should invalidate:

```text
customer-favorites:{customerId}:v1
customer-product-detail:{productId}:v1
```

- Favorites page remove action should invalidate:

```text
customer-favorites:{customerId}:v1
```

- The favorites list should use list-card data and resolve only the image data
  needed for the list surface.
- Target P0 performance budget: one first-screen favorites snapshot action,
  O(1) from the page perspective.

## Testing Decisions

- CloudFunction core tests must verify customer scoping, empty state, duplicate
  favorite idempotency, and removal behavior.
- CloudBase client tests must verify snapshot and toggle/remove action mapping.
- Facade tests must verify favorite labels, unavailable product handling, and
  empty messages.
- Page-state tests must verify request dedupe, local display behavior where
  applicable, failure state, and write-after-refresh.
- Product listing and detail tests must ensure favorites do not change publish
  eligibility, stock, or checkout behavior.

## Out of Scope

- Shopping-bag behavior.
- Order creation, payment, logistics, coupons, or refunds.
- SKU-level wishlists.
- Social sharing or public favorite lists.
- Customer recommendation algorithms.

## Further Notes

Favorites are private customer data. They must not leak through public product
list APIs and must not be used as an authorization shortcut for checkout.
