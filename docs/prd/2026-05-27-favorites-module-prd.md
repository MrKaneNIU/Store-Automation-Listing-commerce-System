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

## Execution Governance

- This PRD must be executed module by module. Do not combine unrelated modules,
  shopping-bag behavior, customer mine aggregation, checkout, payment,
  logistics, coupons, refunds, or recommendation work into a favorites
  implementation without explicit approval.
- Before any implementation edit, produce a Repository Impact Map and Execution
  Plan for the current module only.
- Frontend UI work must load and apply `ui-ux-pro-max` before editing UI code.
  It must also load the smallest necessary set of project-required frontend
  skills, such as `design-taste-frontend`; use specialized skills like
  `high-end-visual-design`, `redesign-existing-projects`, `image-to-code`, or
  image-generation skills only when the task actually needs them.
- Use only necessary skills and tools for the active module. Do not invoke broad
  research, multi-agent, design, browser, or automation tooling unless it is
  required by the current acceptance criteria.
- Preserve the existing bottom navigation entries already reserved on the
  customer side. Do not redesign navigation or add new global entry points
  unless a later approved task opens that scope.
- Do not touch unrelated business code. Product publish eligibility, stock,
  inventory ledger, order creation, shopping-bag rows, customer auth semantics,
  merchant order handling, payment, logistics, coupons, and refunds remain out
  of scope.
- Keep code modular and reviewable. New favorites work should be split across
  focused domain, feature/facade, service/client, CloudBase action, page-state,
  and page files as appropriate. Do not pile unrelated logic into `.vue` pages,
  global helpers, or oversized files.
- Pages may call page-facing facades and commands only. Pages must not directly
  write repositories, CloudBase collections, order rows, stock rows, or hidden
  global state.
- Each module must finish with necessary verification for the files touched:
  targeted tests for changed contracts, relevant lint/type/build checks when
  code changes, `pnpm.cmd run verify` for meaningful implementation changes,
  and `pnpm.cmd run verify:full` when mini-program build behavior can be
  affected. PRD-only edits require a diff review and targeted document check.
- Each module report must list changed files, business code intentionally not
  changed, checks run and results, remaining harness/product gaps, and whether
  manual acceptance is still open. Build smoke is not manual acceptance.

## Module Sequence

1. Module A - Contract and impact map:
   Define the concrete page-facing contract, snapshot shape, favorite toggle
   commands, invalidation rules, and protected out-of-scope business contracts
   before writing implementation code.
2. Module B - Customer-scoped storage and CloudBase actions:
   Add customer-private favorite snapshot, idempotent favorite creation,
   removal behavior, unavailable product handling, and customer scoping.
3. Module C - Page-facing facade and ViewModel:
   Build focused ViewModel and command helpers for favorite labels, empty
   states, unavailable states, loading, failure, and write-after-refresh.
4. Module D - UI integration:
   Wire the existing reserved favorites entry, favorites page, and product
   list/detail favorite toggles without changing product visibility, stock, or
   checkout behavior.
5. Module E - Verification and acceptance:
   Run the required targeted tests and project checks, then record manual
   acceptance evidence for first entry, return entry, slow network, empty
   state, failure, write-after-refresh, and image-failure behavior.

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
