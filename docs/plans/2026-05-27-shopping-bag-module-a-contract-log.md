# 2026-05-27 Shopping Bag Module A Contract Log

## Repository Impact Map

Governing PRD:

```text
docs/prd/2026-05-27-shopping-bag-module-prd.md
```

Completed scope:

```text
docs/contracts/page-facing-ui-contracts.md
docs/plans/2026-05-27-shopping-bag-module-a-contract-log.md
```

Explicitly out of scope:

```text
src/
cloudfunctions/
backend/
src/pages.json
src/app/routes.ts
src/app/navigation.ts
docs/prd/2026-05-27-favorites-module-prd.md
docs/prd/2026-05-27-customer-mine-module-prd.md
```

Protected business contracts:

- Shopping-bag rows are not orders and do not reserve stock.
- Existing customer order creation remains the only stock revalidation and
  reservation authority.
- Phone authorization is not required for shopping-bag add, update, remove, or
  snapshot reads.
- Customer-private shopping-bag data must be scoped by verified customer
  identity or CloudBase identity.
- Product publish/unpublish, SKU stock, customer auth semantics, merchant
  order handling, payment, logistics, coupons, refunds, favorites, and customer
  mine remain unchanged in Module A.
- Existing reserved customer navigation entries are preserved; no new global
  entry point is implemented in this module.

Verification planned for this module:

```powershell
git diff --check
```

This is a contract-only module, so `pnpm.cmd run verify` and
`pnpm.cmd run verify:full` are not required for Module A. They become required
when implementation modules touch code or mini-program build behavior.

## Execution Plan

1. Read the shopping-bag PRD and the latency governance PRD.
2. Check the existing page-facing contract template and current customer-side
   product/detail/order boundaries.
3. Freeze the shopping-bag page-facing contract before implementation code.
4. Record the Module A boundary, out-of-scope business contracts, and next
   module gate.
5. Run a document-safe diff check and review the resulting diff.

Acceptance criteria:

- The concrete shopping-bag contract names the snapshot action, snapshot key,
  ViewModel fields, command list, customer identity requirement, phone
  authorization boundary, write-after-refresh rule, and tests to add later.
- The contract keeps pages behind facade commands and prevents direct
  repository, CloudBase collection, order workflow, or stock writes.
- Module A produces no business-code changes.

Uncertain assumptions:

- The final page route and exact reserved customer navigation entry are deferred
  to Module D because the PRD says to preserve existing reserved entries and not
  redesign navigation in Module A.
- The storage collection and backend document shape are deferred to Module B;
  Module A only freezes the page-facing and snapshot-facing contract.

## Module A Deliverables

Updated:

```text
docs/contracts/page-facing-ui-contracts.md
```

Added a concrete `Customer Shopping Bag` contract covering:

- planned feature module and UI entry points.
- `getCustomerShoppingBagSnapshot`.
- `customer-shopping-bag:{customerId}:v1`.
- required customer identity and phone-authorization boundary.
- ViewModel fields pages may read.
- command parameters pages may pass.
- page-facing command list.
- write-after-refresh invalidation rules.
- UI prohibitions for orders, inventory, customer scoping, and temporary image
  URLs.
- target snapshot shape.
- P0 loading and performance contract.
- implementation tests required in Modules B-E.

## Skill Usage

Used only `spec-workflow` because this task is PRD-driven, multi-module, and
requires a contract gate before implementation. The full spec workflow was not
expanded because the PRD already defines the requirements, module order, and
acceptance boundaries.

No UI skill was used in Module A because no UI code, layout, visual state, or
interaction behavior was edited. UI skills become mandatory before Module D UI
integration.

## Manual Acceptance

Not executed. Module A is a documentation and contract gate only.

Manual acceptance remains open for later implementation modules and must record:

- first entry duration.
- return-entry duration.
- slow-network loading behavior.
- write-after-refresh behavior.
- text availability when images fail.

## Next Module Boundary

Module B may start only after this contract gate is accepted. It should stay
limited to customer-scoped storage and CloudBase actions:

```text
getCustomerShoppingBagSnapshot
add/update/remove/clear shopping-bag commands
customer scoping
unavailable-item handling
no stock reservation
targeted CloudFunction and CloudBase client tests
```

Do not expand Module B into UI integration, navigation redesign, payment,
logistics, coupons, refunds, favorites, customer mine, or checkout semantic
changes.
