# 2026-05-08 UI Boundary Engineering Delivery Log

## Scope

This delivery implements `docs/prd/2026-05-08-ui-boundary-engineering-prd.md`.
It prepares the mini-program for future UI redesign by moving high-risk page
business composition into page-facing feature ViewModels and facades.

This was not a visual redesign and did not change the accepted mall workflow,
data models, mock service contracts, repository contract, OCR behavior, upload
behavior, auth behavior, order behavior, or inventory rules.

## Completed Modules

### Module 1: Page Risk Inventory

- Added `docs/architecture/page-ui-boundary-inventory.md`.
- Listed every current `.vue` page, its direct imports, risk level, page logic
  that may remain, and logic that should move into features.
- Marked the first and second priority high-risk pages as ViewModel/Facade
  migration targets.

### Module 2: Customer Product Detail ViewModel

- Added `src/features/customer-product-detail/customer-product-detail.ts`.
- Added tests in `src/features/customer-product-detail/customer-product-detail.test.ts`.
- Updated `src/pages/customer/product-detail/index.vue` so it no longer imports
  `mallAccess` or `mockWechatAuthService` directly.
- Preserved anonymous browsing, click-triggered authorization, phone
  authorization, order creation, and stock reservation behavior.

### Module 3: Owner Draft Review ViewModel

- Added `src/features/owner-draft-review/owner-draft-review.ts`.
- Added tests in `src/features/owner-draft-review/owner-draft-review.test.ts`.
- Updated `src/pages/owner/draft-review/index.vue` so latest batch lookup,
  grouping, price-conflict warnings, low-confidence flags, needs-completion
  flags, draft edits, deletion, and confirmation messages come from the feature
  layer.
- Preserved incomplete-draft blocking, deleted-draft filtering, price-conflict
  warnings, and duplicate-confirmation idempotency.

### Module 4: Owner Products, Owner Orders, and Staff Image Tasks Facades

- Added `src/features/owner-products/owner-products.ts`.
- Added `src/features/owner-orders/owner-orders.ts`.
- Added `src/features/staff-image-tasks/staff-image-tasks.ts`.
- Added focused tests for all three facades.
- Updated the owner product management, owner order confirmation, and staff
  image task pages so filtering, button state, status labels, command entry
  points, and result messages are provided by features.
- Preserved publish eligibility, order status protection, cancel-stock restore,
  and image supplementation state transitions.

## UI Refactor Contract

Future UI redesign work may replace:

- Page layout and component structure.
- Styles and visual hierarchy.
- Copy and presentation of empty/loading/error states.
- Local page interaction wiring such as taps, modals, pickers, and route reads.

Future UI redesign work should not change by default:

- Domain rules.
- `mallWorkflow` behavior.
- Repository contracts.
- Auth, OCR, upload, or repository service interfaces.
- Product, SKU, draft, order, and customer-session field meanings.
- Page-facing ViewModel/Facade contracts added in this delivery.

## Verification

The completed delivery passed:

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

`verify` covers lint, boundary checks, unit tests, coverage, type-check, and
dependency audits. `verify:full` additionally builds the WeChat mini-program and
runs the build-artifact smoke check.

## Remaining Gaps

- Current smoke validation checks mini-program build artifacts and routes, not a
  full human click-through flow in WeChat DevTools.
- Customer product list and owner screenshot import pages remain medium-risk
  pages. They were inventoried in module 1 but not required as high-risk module
  migrations in this PRD.
- Any future real backend, real storage, real auth, real OCR, or role permission
  work should plug into the service and feature boundaries rather than changing
  page logic.
