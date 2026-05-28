# 2026-05-27 Customer Mine Module PRD

## Problem Statement

The customer side does not yet have a dedicated "Mine" area for identity,
orders, and saved customer utilities. Without a separate PRD, there is risk of
mixing customer "Mine" with merchant workbench entry points or adding private
data reads directly inside pages.

## Solution

Introduce a customer "Mine" module as a customer-private account and activity
surface. It should show customer identity status, phone binding status, recent
orders, and navigation entries to future shopping-bag and favorites pages. It
must not become a merchant-admin entry point and must not bypass existing auth,
order, or inventory contracts.

## User Stories

1. As a customer, I want to see whether I am signed in, so that I understand my
   current customer identity state.
2. As a customer, I want to see whether my phone is bound, so that I know
   whether checkout may require authorization.
3. As a customer, I want to see recent orders, so that I can return to order
   status information.
4. As a customer, I want entries to favorites and shopping bag, so that I can
   reach customer utilities from one place.
5. As a customer, I want login or phone failures to be understandable, so that
   I know what action to take next.
6. As a merchant or staff user, I should not see merchant workbench access
   embedded in customer "Mine", so that customer and admin surfaces remain
   separate.

## Implementation Decisions

- Customer identity is required for private "Mine" data. Public product
  browsing remains login-free.
- Phone authorization is not required to enter "Mine"; it is only shown as a
  status or triggered by approved customer actions.
- "Mine" may display order summaries but must not change order state.
- "Mine" must not affect inventory.
- "Mine" must not link to merchant workbench routes unless a separate admin
  entry PRD explicitly approves that surface.
- First-screen snapshot action name:

```text
getCustomerMineSnapshot
```

- Snapshot should include customer identity summary, phone binding status,
  recent customer orders, and availability of customer utility entries.
- Write-after-refresh invalidates only the affected customer-private snapshot:

```text
customer-mine:{customerId}:v1
```

- If a future phone-bind command is added here, it must reuse the existing
  CloudBase WeChat phone-code path and must not accept raw phone numbers from
  the page.
- Target P0 performance budget: one first-screen mine snapshot action, O(1)
  from the page perspective.

## Execution Governance

- This PRD must be executed module by module. Do not combine unrelated modules,
  merchant workbench entry, shopping-bag implementation, favorites
  implementation, checkout, payment, logistics, coupons, refunds, or
  customer-service work into a customer mine implementation without explicit
  approval.
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
- Do not touch unrelated business code. Merchant workbench routing,
  admin/staff permissions, order state transitions, stock reservation and
  restoration, product publish rules, payment, logistics, coupons, refunds, and
  customer-service features remain out of scope.
- Keep code modular and reviewable. New customer mine work should be split
  across focused domain, feature/facade, service/client, CloudBase action,
  page-state, and page files as appropriate. Do not pile unrelated logic into
  `.vue` pages, global helpers, or oversized files.
- Pages may call page-facing facades and commands only. Pages must not directly
  write repositories, CloudBase collections, order rows, stock rows, auth rows,
  or hidden global state.
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
   Define the concrete page-facing contract, snapshot shape, mine entries,
   recent-order summary fields, invalidation rules, and protected out-of-scope
   business contracts before writing implementation code.
2. Module B - Customer-scoped snapshot action:
   Add the customer-private mine snapshot with customer identity, phone binding
   status, recent orders, utility counts, and strict customer scoping.
3. Module C - Page-facing facade and ViewModel:
   Build focused ViewModel helpers for identity labels, phone status, recent
   order summaries, utility entries, empty states, loading, failure, and retry.
4. Module D - UI integration:
   Wire the existing reserved mine entry and customer mine page without adding
   merchant workbench access or changing order, auth, or inventory behavior.
5. Module E - Verification and acceptance:
   Run the required targeted tests and project checks, then record manual
   acceptance evidence for first entry, return entry, slow network, unauth
   state, phone-bound state, recent-order empty state, failure, retry, and
   image-failure behavior where applicable.

## Testing Decisions

- CloudFunction core tests must verify customer scoping and that one customer
  cannot read another customer's private data.
- CloudBase client tests must verify snapshot and any future phone-bind action
  mapping.
- Facade tests must verify identity labels, phone status, recent order
  summaries, and empty states.
- Page-state tests must verify loading/failure states, request dedupe, and
  retry behavior.
- Existing order tests remain the authority for merchant confirm/cancel and
  stock restoration.

## Out of Scope

- Merchant workbench entry.
- Payment, logistics tracking, refund, customer-service chat, and marketing.
- Editing customer profile fields beyond approved WeChat identity/phone flows.
- Creating orders directly from "Mine".
- Admin role management.

## Further Notes

"Mine" is a customer-private surface. It must stay separate from owner/staff
workbench pages and must reuse the latency PRD's snapshot, cache, loading, and
manual acceptance path before implementation.
