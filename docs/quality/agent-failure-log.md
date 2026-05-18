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

## 2026-05-18 - Navigation stack overflow after partial fixes

- Task: Optimize post-freeze mini-program UI/navigation performance and page switching.
- What went wrong: Initial fixes only changed several visible navigation buttons. Repeated manual switching still triggered `navigateTo:fail webview count limit exceed`.
- Root cause: The project-level `navigateTo` wrapper still delegated directly to `uni.navigateTo`, so any missed entry could continue growing the mini-program webview stack. Some same-level management tabs and customer page transitions were also using push navigation where replacement navigation was required.
- Impact: Manual acceptance in WeChat DevTools could freeze or emit repeated red console errors after enough page switches.
- Detection: User reproduced the issue by repeatedly switching pages in the customer and management areas and provided WeChat DevTools console screenshots.
- Correction: Same-level tabs were changed to `redirectTo`, management-to-customer transitions were normalized to `reLaunch`, and `src/app/navigation.ts` now guards `navigateTo` globally by replacing current page when the target is current or the page stack is near the mini-program limit. The remaining direct product-detail navigation was routed through this wrapper.
- Prevent next time by: Treat WeChat page-stack behavior as a global routing contract. Before claiming navigation fixes, search for all `uni.navigateTo`/`navigateTo` usages, ensure only the project wrapper calls `uni.navigateTo`, and verify repeated manual switching after recompiling the mini-program.
