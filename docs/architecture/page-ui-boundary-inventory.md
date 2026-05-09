# Page UI Boundary Inventory

This inventory implements module 1 of
`docs/prd/2026-05-08-ui-boundary-engineering-prd.md`. It is a migration map for
future UI work, not a product behavior change request.

## Boundary Rule

Pages may keep layout, local input state, taps, modals, toasts, route reads, and
navigation. Business queries, action eligibility, workflow commands, display
summaries, and error-message mapping should move behind page-facing feature
ViewModels or facades.

## Page Risk Map

| Page | Current imports | Risk | Page logic to keep | Logic to sink into features |
| --- | --- | --- | --- | --- |
| `src/pages/customer/product-detail/index.vue` | `customer-order`, `mall-access`, `mock-wechat-auth-service` | High | Route `id`, selected SKU id, auth modals, message rendering | Product detail VM, SKU availability, submit eligibility, default auth service wiring, order result messages |
| `src/pages/owner/draft-review/index.vue` | `mall-workflow`, `mall-access`, `draft-review`, draft types | High | Input binding, edit/delete taps, confirm tap, result rendering | Latest batch lookup, draft grouping, missing-field count, price-conflict warnings, draft edit/delete/confirm commands |
| `src/pages/owner/products/index.vue` | `mall-workflow`, `mall-access`, product status type | High | Status tab local state, publish taps, message rendering | Product list VM, publish eligibility, SKU count display, single and batch publish commands |
| `src/pages/owner/orders/index.vue` | `mall-workflow`, `mall-access`, order status type | High | Confirm/cancel taps, message rendering | Order list VM, status text, action availability, confirm/cancel commands |
| `src/pages/staff/image-tasks/index.vue` | `mall-workflow`, `mall-access` | High | Keyword input, batch picker local state, upload tap | Pending-image list VM, batch filter options, supplement-image command, post-action status message |
| `src/pages/customer/product-list/index.vue` | `mall-access` | Medium | Product-card tap and navigation | Published product list VM and minimum price display |
| `src/pages/owner/import-upload/index.vue` | `mall-workflow`, uploaded image and draft types, `createId` | Medium | Image picker, local selected screenshots, remove tap, loading state | Uploaded-image descriptor creation, OCR batch command, draft/import result summary |
| `src/pages/index/index.vue` | `navigation`, `routes` | Low | Static role navigation | No business migration needed |
| `src/pages/owner/dashboard/index.vue` | `navigation`, `routes` | Low | Static owner navigation | No business migration needed |

## First Migration Targets

1. Customer product detail page: create a page-facing ViewModel/command so the
   page no longer imports mock auth or direct mall access.
2. Owner draft review page: create a page-facing ViewModel/command around latest
   batch review, draft edits, grouping, warnings, and confirmation.
3. Owner products, owner orders, and staff image tasks: move filters, button
   states, and action entry points into facades after the two highest-risk pages
   are stable.

## Non-Goals

- Do not change product, SKU, draft, order, customer-session, auth, OCR, upload,
  or repository contracts.
- Do not redesign UI in this pass.
- Do not weaken existing tests or accepted fixtures.
