# Codex Project Instructions

This project is a uni-app + Vue 3 + TypeScript WeChat mini-program MVP. The
current priority is engineering maturity: protect the existing closed loop,
make changes small, and keep future iterations verifiable.

## Codex Working Principles

- Work from repository facts, not imagined architecture.
- Keep every task scoped to the user's approved goal.
- Prefer small, staged changes over broad rewrites.
- Preserve the current MVP business loop unless the task explicitly changes it.
- Do not perform drive-by cleanup, opportunistic refactors, or style churn.
- Do not introduce dependencies unless the task needs them and the reason is
  stated before editing.
- Treat `docs/prd/` and `docs/plans/` as product history. Do not rewrite
  accepted PRDs or delivery logs unless the user asks.

## Required Before Editing

Every implementation task must start with a Repository Impact Map and an
Execution Plan.

Repository Impact Map must list:
- Files or directories expected to change.
- Files or directories explicitly out of scope.
- Business contracts that must remain unchanged.
- Verification commands that will be run.

Execution Plan must list:
- The small steps to perform.
- The acceptance criteria for each step.
- Any uncertain assumptions.

## Boundaries

- Do not modify business logic when the task is documentation, harness, CI, or
  planning only.
- Do not modify UI when the task is backend, service, docs, tests, or harness
  only.
- Do not change data models or API contracts without explicit approval.
- Do not delete tests.
- Do not weaken assertions.
- Do not modify approved fixtures unless the user explicitly approves the new
  expected behavior.
- Do not bypass existing workflow methods from pages. Pages should not grow new
  direct storage writes.
- Do not add hidden global state outside the existing service/repository layer.

## Current Layer Rules

- `src/domain/` owns entity types, pure rules, status checks, and business
  invariants.
- `src/features/` owns use-case orchestration across domain and services.
- `src/services/` owns external IO adapters, mock providers, auth, upload, and
  repository implementations.
- `src/pages/` owns page rendering, page-local state, user interaction, and
  `uni` APIs.
- `docs/` owns PRDs, delivery logs, architecture, test strategy, and quality
  process.

## Dependency Rules

- `domain` must not import `features`, `services`, `pages`, or `uni` APIs.
- `features` may import `domain` and service ports/adapters.
- `pages` may call feature use-cases and page-safe queries, but should not add
  new direct repository writes.
- Mock implementations must stay behind service interfaces whenever possible.
- New packages require a clear reason and must not be added casually.

## Required Checks Before Completion

Run the strongest existing checks that match the task:

```powershell
pnpm.cmd run verify
```

`verify` runs lint, boundary checks, tests, coverage, type-check, and dependency
audits. When code or build configuration changes can affect the mini-program
build, also run:

```powershell
pnpm.cmd run verify:full
```

If a command does not exist or cannot be run, report that explicitly. Never
invent a passing result.

## Required Final Output

Every completed task report must include:
- Files changed and why.
- Business code that was intentionally not changed.
- Checks run and their results.
- Remaining harness or product gaps.
- Suggested next task when useful.
