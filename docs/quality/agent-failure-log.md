# Agent Failure Log

## Purpose

This file is for durable learning from AI-assisted engineering mistakes in this
project. Use it when an agent breaks a contract, misses a verification step,
modifies out-of-scope files, weakens tests, or makes an incorrect assumption
that should become a future guardrail.

Do not use this file as a general changelog. Product changes belong in
`docs/plans/`. Requirements belong in `docs/prd/`.

## How To Record A Failure

Add a short entry with this shape:

```markdown
## YYYY-MM-DD - Short title

- Task:
- What went wrong:
- Root cause:
- Impact:
- Detection:
- Correction:
- Prevent next time by:
```

Keep the entry factual. Avoid blame. The goal is to convert a failure into a
repeatable engineering constraint.

## Turning Failures Into Guardrails

Each failure should produce at least one durable improvement:

- Test: add a unit, integration, contract, or E2E regression test.
- Hook or script: add a local check when the mistake is mechanical.
- Lint or boundary rule: block forbidden imports or unsafe patterns.
- CI: run the guard automatically.
- Documentation: record an architectural or product boundary.
- Checklist: add a review item if automation is not available yet.

## Failure Categories

- Scope violation: changed files or behavior outside the approved task.
- Contract violation: changed API shape, data model, status rule, or fixture
  without approval.
- Test violation: deleted, skipped, or weakened tests.
- Verification miss: claimed completion without running required checks.
- Dependency drift: introduced packages or lockfile churn without approval.
- Boundary violation: moved business rules into UI or IO adapters.
- Product drift: implemented a feature outside the PRD.

## Current Entries

No recorded agent failures yet.

