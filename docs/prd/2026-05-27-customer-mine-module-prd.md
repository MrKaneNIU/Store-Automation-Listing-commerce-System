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
