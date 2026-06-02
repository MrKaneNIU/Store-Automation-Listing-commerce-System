# Risk And Gap List

## Categories Covered

- main-chain breakage
- data consistency
- inventory and orders
- idempotency and concurrency
- authorization bypass
- page boundaries
- mock leakage
- real WeChat capability
- CloudBase / backend
- image upload
- OCR
- privacy compliance
- secret leakage
- test coverage
- launch readiness

## RISK-001

- level: P1
- category/evidence: git status --short / 00-readme.md
- related code/log position: working tree has modified and untracked files before audit export
- impacted flow: release hygiene / launch
- launch impact: Dirty tree blocks a clean release decision until changes are reviewed/staged intentionally.
- suggested next step: Review current diff and decide whether it is intended before release.

## RISK-002

- level: P1
- category/evidence: 07-test-coverage-map.md
- related code/log position: some required PRD assertions have no direct test-name/content hit
- impacted flow: test coverage
- launch impact: Potentially weak coverage for launch-critical rules.
- suggested next step: Add or identify explicit tests for each NO DIRECT HIT assertion.

## RISK-003

- level: P2
- category/evidence: package.json / 08-command-results.md
- related code/log position: no requested e2e script name present
- impacted flow: real WeChat capability / launch
- launch impact: Automated gates do not prove real WeChat DevTools/device behavior.
- suggested next step: Add documented e2e/manual acceptance gate for launch.

## RISK-004

- level: P2
- category/evidence: package.json / 08-command-results.md
- related code/log position: no test:cloudbase script present
- impacted flow: CloudBase / backend
- launch impact: Local tests may not prove deployed CloudBase action parity.
- suggested next step: Run deployed smoke separately with redacted env evidence before launch.