# Review Checklist

Use this checklist for PR review, AI-generated diff review, and pre-completion
self-review.

## PR Review Checklist

- The change matches the approved task and PRD.
- The Repository Impact Map matches the actual diff.
- No unrelated files were modified.
- No business logic changed in docs/harness-only tasks.
- No UI changed in non-UI tasks.
- No data model or API contract changed without explicit approval.
- No lockfile changed unless a dependency change was approved.
- The final report lists checks run and results.

## AI Diff Review Checklist

- Did the agent modify only the allowed file ranges?
- Did the agent avoid drive-by refactors?
- Did the agent preserve existing tests?
- Did the agent preserve approved fixtures?
- Did the agent avoid weakening assertions?
- Did the agent avoid adding speculative abstraction?
- Did the agent report missing commands honestly?
- Did the agent keep product language and user paths consistent with docs?

## Module Boundary Checklist

- Domain rules remain in `src/domain`.
- Use-case orchestration remains in `src/features`.
- External IO and mock adapters remain in `src/services`.
- Pages use page-facing feature ViewModels/facades or
  `src/features/mall-workflow/mall-access.ts` for repository-backed mall data.
- High-risk pages should not recompute status labels, button eligibility,
  warning flags, or command result messages directly in `.vue` files.
- Pages do not import repositories or mock DB directly.
- Pages do not import mock service implementations directly.
- Pages do not generate mock customer identity, OCR rows, or upload URLs.
- Domain does not import services, features, pages, or `uni` APIs.
- Mock implementations stay behind service interfaces where practical.
- Future UI redesigns preserve ViewModel/Facade contracts unless a PRD
  explicitly approves a contract change.

## Testing Checklist

- New domain behavior has unit tests.
- New workflow behavior has integration-style tests.
- New page-facing ViewModel or Facade behavior has focused feature tests.
- Repository behavior changes have contract tests.
- Bugfixes include regression tests.
- Assertions remain specific.
- No tests are skipped or deleted.
- `pnpm.cmd run lint` passes.
- `pnpm.cmd run boundary-check` passes.
- `pnpm.cmd test` passes.
- `pnpm.cmd run coverage` passes.
- `pnpm.cmd run type-check` passes.
- Build-affecting changes pass `pnpm.cmd run build:mp-weixin` and
  `pnpm.cmd run e2e:smoke`.

## Contract Checklist

- Entity fields remain compatible unless migration is approved.
- Status transitions remain compatible with `docs/contracts/domain-contract.md`.
- Stock reservation and restoration invariants are preserved.
- Customer authorization still gates authorized order creation.
- Browsing published products remains login-free.
- Product publishing still requires image and valid SKU conditions.

## Security Checklist

- No secrets, tokens, app credentials, or API keys are hardcoded.
- No `.env` or local secret file is committed.
- User input that crosses a boundary is validated.
- Error messages do not leak credentials.
- New external calls have clear failure behavior.
- Dependency audit is clean or exceptions are documented.

Required security commands:

```powershell
pnpm.cmd run audit:prod
pnpm.cmd run audit:all
```
