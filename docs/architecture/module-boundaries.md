# Module Boundaries

## Directory Responsibilities

| Directory | Responsibility |
| --- | --- |
| `src/domain` | Entity types, pure business rules, invariants, status checks |
| `src/features` | Application use-cases plus page-facing ViewModels and facades that orchestrate domain rules and services |
| `src/services` | External IO ports, mock adapters, auth, upload, OCR, repository storage |
| `src/pages` | Mini-program page rendering, page-local state, `uni` UI interactions |
| `src/app` | App-level route constants, navigation helper, role labels |
| `backend` | Server-side BFF/API baseline; no mini-program page code or direct UI dependencies |
| `docs` | Product, architecture, contract, testing, and quality process docs |

## Allowed Dependencies

```text
pages -> app
pages -> features
pages -> domain types

features -> domain
features -> services

services -> domain types

backend -> backend-local modules
backend test code -> shared repository contract tests
backend production code -> backend-local modules

app -> no business modules
domain -> no app, feature, service, page, or uni dependency
```

Current pages access repository-backed mall data through feature-layer
query/use-case functions. Generic page-safe access remains in
`src/features/mall-workflow/mall-access.ts`, while high-risk pages now use
dedicated page-facing ViewModels and facades:

- `src/features/customer-product-list`
- `src/features/customer-product-detail`
- `src/features/owner-screenshot-import`
- `src/features/owner-draft-review`
- `src/features/owner-products`
- `src/features/owner-orders`
- `src/features/staff-image-tasks`

The frozen UI-facing field and command contract is documented in
`docs/contracts/page-facing-ui-contracts.md`. Future UI redesign work should
use that document as the handoff surface instead of reading lower-level
workflow or repository implementations.

`src/services/repositories/mall-repository-port.ts` is the repository contract
surface. The current mini-program runtime uses the synchronous in-memory
repository through the existing `mallRepository` compatibility export. The
backend database repository is verified against the same contract in backend
tests but is not imported by mini-program source.

`scripts/check-boundaries.mjs` fails page imports of
`services/repositories/mall-repository` or `mock-db`.

## Forbidden Dependencies

- `src/domain` must not import `src/features`.
- `src/domain` must not import `src/services`.
- `src/domain` must not import `src/pages`.
- `src/domain` must not call `uni` APIs.
- `src/pages` must not import `mockDb`.
- `src/pages` must not import `mallRepository` directly.
- `src/pages` must not import mock service implementations directly.
- `src/pages` must not generate mock openid, customer IDs, phone numbers, OCR
  rows, or upload URLs.
- `src/services` must not own product workflow decisions such as whether a
  batch can be confirmed or whether an order can be canceled.
- Mock implementations must not be imported into new business code unless the
  task is explicitly about the mock adapter.
- `backend` must not be imported by `src/pages`, `src/features`, `src/services`,
  or `src/domain`.
- `backend` must not import mini-program page modules or `uni` APIs.

## Logic That Must Live In Domain

- Required draft-field validation.
- SPU/SKU grouping rules.
- Duplicate SKU stock merge rules.
- Product publish eligibility rules.
- Order creation rules.
- Order total calculation.
- Stock eligibility checks.
- Status transition rules and invariants.
- Future inventory ledger invariants.

## Logic That Must Not Live In UI

- Product/SKU creation.
- Draft confirmation rules.
- Draft grouping warning rules, low-confidence flags, and needs-completion
  display flags.
- Stock deduction or restoration.
- Order status transition rules.
- Product publish eligibility and order action eligibility.
- Mock customer identity generation.
- Mock OCR row generation.
- Real OCR, auth, upload, or storage IO.
- Cross-page persistence rules.
- Security-sensitive validation.

## Modules That Must Not Call Each Other Directly

- `src/pages` must not call `mockDb`.
- `src/pages` must not call `mallRepository` directly.
- `src/domain` must not call `src/services`.
- `src/domain` must not call `src/features`.
- `src/services/ocr` must not call page modules.
- `src/services/auth` must not call page modules.
- `src/services/storage` must not call page modules.

## Change Safety Rules

- Add tests before changing domain rules.
- Add or update contract tests before changing repository behavior.
- Keep current page behavior unchanged when moving logic behind a feature
  function.
- Future UI redesign may change layout, component structure, styles, and copy,
  but should not change page-facing ViewModel/Facade contracts without an
  explicit PRD.
- Preserve existing field names unless a PRD explicitly approves a data model
  migration.
- Preserve accepted fixtures unless the user approves new expected behavior.
