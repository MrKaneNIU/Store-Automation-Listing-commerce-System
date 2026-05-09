# 2026-05-09 Phase 0 Baseline Freeze and Acceptance Matrix

## Scope

This delivery starts Phase 0 from
`docs/prd/2026-05-08-enterprise-launch-master-prd.md`.

It records the current automatic baseline, the rollback reference point, the
manual WeChat DevTools acceptance matrix, and the defect triage rules before
the project enters real backend, real storage, real auth, real OCR, or large UI
redesign work.

This is documentation and verification work only. It does not change business
code, page UI, domain contracts, service contracts, repository behavior, tests,
fixtures, or build scripts.

## PRD Re-Read Checkpoint

Relevant master PRD sections reviewed before this work:

- Phase 0 target: freeze the current runnable MVP as the regression baseline
  and complete the WeChat DevTools manual click-through matrix.
- Module 0.1: current baseline archive.
- Module 0.2: WeChat DevTools manual acceptance matrix.
- Module 0.3: defect severity and handling process.

Relevant master PRD rule carried forward:

- Do not enter Phase 2 real backend and persistence until the current main
  chain has been clicked through in WeChat DevTools and P0/P1 defects are
  fixed or explicitly cleared.

## Module 0.1 Current Baseline Archive

### Git Baseline

| Item | Value |
| --- | --- |
| Branch | `main` |
| Baseline commit | `2d290031038573fcc52ecf7a0919a0cf15947cda` |
| Baseline commit summary | `2d29003 chore: freeze engineering baseline` |
| Commit date | `2026-05-09 08:46:42 +0800` |
| Dirty worktree at archive time | No dirty files reported by `git status --short` |
| Existing local tags | No local tags reported by `git tag --list` |

This commit is the current rollback reference point for Phase 0 documentation
work. A durable remote tag can be created after the repository remote and
release naming convention are approved.

### Current Protected MVP Loop

The current baseline continues to protect this mock MVP loop:

```text
Owner uploads cloud e-bao screenshots
-> Mock OCR creates product drafts
-> Owner reviews, edits, deletes, and confirms drafts
-> System creates SPU/SKU records
-> Staff supplements product images
-> Owner publishes products
-> Customer browses published products without login
-> Customer triggers Mock WeChat login and phone authorization only at order time
-> System creates pending merchant-confirmation order and reserves stock
-> Merchant confirms or cancels order
-> Pending-order cancellation restores reserved stock
```

### Current Automatic Verification Result

`pnpm.cmd run verify` passed on `2026-05-09`.

Covered checks:

- ESLint passed.
- Module boundary check passed.
- Vitest passed: 15 test files, 67 tests.
- Coverage passed with current summary: all files 91.45% statements, 83.82%
  branches, 95.04% functions, 91.45% lines.
- `vue-tsc --noEmit` passed.
- `pnpm audit --prod --audit-level moderate` passed with no known
  vulnerabilities.
- `pnpm audit --audit-level low` passed with no known vulnerabilities.

`pnpm.cmd run verify:full` passed on `2026-05-09`.

Additional covered checks:

- `uni build -p mp-weixin` completed successfully.
- `scripts/e2e-smoke.mjs` passed and confirmed `dist/build/mp-weixin` build
  artifacts and page routes are present.

### Current Known Gaps

- Build artifact smoke is not a substitute for WeChat DevTools manual
  click-through acceptance.
- There is no real persistent database.
- There is no real image object storage.
- There is no real WeChat login, real phone-number exchange backend, or role
  permission backend.
- There is no real OCR/AI async recognition chain.
- Production-grade order operations, inventory ledger, audit logs, monitoring,
  backups, rollback SOP, legal domain configuration, HTTPS/TLS verification,
  privacy compliance, and release SOP are not complete.
- Customer product list and owner import-upload pages remain medium-risk pages
  for future UI boundary hardening.
- `mallWorkflow` still directly wires mock providers and repository adapters;
  future real provider work must preserve page-facing boundaries.

### Master PRD Drift Note

The master PRD says the UI boundary worktree was still dirty at the time that
document was written. Current repository facts differ: `git status --short`
reported no dirty files during this Phase 0.1 archive.

## Module 0.2 WeChat DevTools Manual Acceptance Matrix

Manual acceptance has not yet been executed to completion in this Phase 0 pass.
The required import path is:

```text
dist/build/mp-weixin
```

### 2026-05-09 DevTools Preparation Attempt

Current build command executed:

```powershell
pnpm.cmd run verify:full
```

Result:

- Passed.
- `uni build -p mp-weixin` completed successfully.
- `scripts/e2e-smoke.mjs` confirmed build artifacts and page routes are
  present.

WeChat DevTools discovery:

| Item | Value |
| --- | --- |
| CLI path | `D:\Tencent\微信web开发者工具\cli.bat` |
| IDE path | `D:\Tencent\微信web开发者工具\微信开发者工具.exe` |
| Detected install version file | `D:\Tencent\微信web开发者工具\version` |
| Detected `latestNw` | `0.54.1` |
| Detected `previousNw` | `0.49.3` |

CLI commands attempted:

```powershell
& 'D:\Tencent\微信web开发者工具\cli.bat' --help
& 'D:\Tencent\微信web开发者工具\cli.bat' open --project "D:\CodeX\VX close systhem\dist\build\mp-weixin" --lang zh
& 'D:\Tencent\微信web开发者工具\cli.bat' auto --project "D:\CodeX\VX close systhem\dist\build\mp-weixin" --trust-project --port 9420 --lang zh
Start-Process -FilePath 'D:\Tencent\微信web开发者工具\微信开发者工具.exe' -ArgumentList @('D:\CodeX\VX close systhem\dist\build\mp-weixin')
```

Observed result:

- `--help` returned successfully and confirmed `open`, `auto`, `preview`, and
  `upload` commands are available.
- `open --project` timed out from the shell after launching DevTools-related
  processes.
- `auto --project --port 9420` also timed out, and no listener was observed on
  local port `9420`.
- DevTools-related `node.exe` processes under `D:\Tencent\微信web开发者工具\`
  were observed after the CLI attempts.
- `Start-Process` launched the visible IDE process. `微信开发者工具.exe`,
  multiple `wechatdevtools.exe` processes, and `wxfilewatcher_x64.exe` were
  observed around `2026-05-09 09:21:58 +0800`.

Current generated `project.config.json` limitations:

- `appid` is `touristappid`.
- `setting.urlCheck` is `false`.

This is acceptable for local mock-loop inspection, but it is not a formal
production-domain or real-AppID acceptance configuration. Formal acceptance
still needs a real AppID, legal domain settings, and URL check settings aligned
with the release environment.

Manual click-through status:

- Completed for the current mock baseline at a basic functional-chain level on
  `2026-05-09`.
- Human acceptance result reported by the operator: "基本链路和功能是没有问题的".
- No P0/P1 blocker was reported during this manual pass.
- Screenshots or recordings were not provided in this pass; formal release
  acceptance should still capture visual evidence, device details, and
  environment details.
- `2026-05-09 09:25 +0800`: manual acceptance was blocked by a DevTools
  simulator startup/import-path issue. DevTools logs showed
  `app.json: 在项目根目录未找到 app.json` while the generated artifact directory
  `dist\build\mp-weixin` does contain `app.json`. Root-cause evidence indicates
  DevTools also opened `D:\CodeX\VX close systhem` as a project and generated
  root-level `project.config.json` / `project.private.config.json`; that source
  root does not contain `app.json`, so it cannot be used as the mini-program
  import root.
- `2026-05-09 09:34 +0800`: after reopening/importing
  `D:\CodeX\VX close systhem\dist\build\mp-weixin`, DevTools logs confirmed the
  correct project root with `FileUtils instance dirpath = D:\CodeX\VX close systhem\dist\build\mp-weixin`,
  followed by `simulator launch success` and `webview page ready`. The
  import-path blocker is resolved and ready for manual matrix retest.

Manual operator instruction:

1. In the visible WeChat DevTools window, import or confirm the project path
   `D:\CodeX\VX close systhem\dist\build\mp-weixin`.
2. If DevTools asks whether to trust the project, approve trust for this local
   generated build artifact.
3. Use the simulator to click through the Owner, Staff, Customer, and Merchant
   scripts below.
4. Record each actual result as Pass, Fail, or Blocked.
5. For any Fail or Blocked step, capture a screenshot or recording and assign a
   defect ID using the P0/P1/P2/P3 rules in Module 0.3.

Before the manual run, record or update:

| Field | Value |
| --- | --- |
| Acceptance date | `2026-05-09` |
| Baseline commit | `2d290031038573fcc52ecf7a0919a0cf15947cda` |
| Build command | `pnpm.cmd run verify:full` |
| WeChat DevTools version | Pending |
| Base library version | Pending |
| Simulator or device | Pending |
| Debug domain bypass disabled | Pending |
| Screenshots or recordings path | Pending |
| Manual operator result | Basic chain and functions passed; no P0/P1 blocker reported |

### Owner Acceptance Script

| Step | Operation | Expected Result | Actual Result | Defect ID |
| --- | --- | --- | --- | --- |
| O-01 | Open owner entry/dashboard | Owner workbench entry is reachable | Pass by operator basic-chain acceptance | None |
| O-02 | Upload or select mock cloud e-bao screenshots | OCR batch is created and recognized by mock OCR | Pass by operator basic-chain acceptance | None |
| O-03 | Open draft review | Drafts are grouped by product code and spec | Pass by operator basic-chain acceptance | None |
| O-04 | Edit an incomplete draft until required fields are valid | Draft can be confirmed only after required fields are valid | Pass by operator basic-chain acceptance | None |
| O-05 | Delete one draft row | Deleted draft is ignored by confirmation | Pass by operator basic-chain acceptance | None |
| O-06 | Confirm the batch | Products and SKUs are created without duplicates | Pass by operator basic-chain acceptance | None |
| O-07 | Open product management before images | Products without main images cannot publish | Pass by operator basic-chain acceptance | None |
| O-08 | Publish product after staff image supplement | Product becomes visible to customers | Pass by operator basic-chain acceptance | None |
| O-09 | Open merchant orders | Pending merchant-confirmation orders are visible | Pass by operator basic-chain acceptance | None |
| O-10 | Confirm one pending order | Order becomes confirmed and cannot be canceled afterward | Pass by operator basic-chain acceptance | None |
| O-11 | Cancel one pending order | Order becomes canceled and reserved stock is restored | Pass by operator basic-chain acceptance | None |

### Staff Acceptance Script

| Step | Operation | Expected Result | Actual Result | Defect ID |
| --- | --- | --- | --- | --- |
| S-01 | Open staff image task page | Products needing images are listed | Pass by operator basic-chain acceptance | None |
| S-02 | Filter or inspect pending image tasks | Tasks remain tied to product code and product name | Pass by operator basic-chain acceptance | None |
| S-03 | Supplement product main/detail images | Product moves toward ready-to-publish without changing SKU data | Pass by operator basic-chain acceptance | None |
| S-04 | Retry or recover from a mock upload failure if simulated | Failed upload does not publish the product | Not explicitly exercised in reported basic-chain pass | Not filed |

### Customer Acceptance Script

| Step | Operation | Expected Result | Actual Result | Defect ID |
| --- | --- | --- | --- | --- |
| C-01 | Open customer product list before login | Published products can be browsed without login | Pass by operator basic-chain acceptance | None |
| C-02 | Open published product detail | Product image, price, spec, and stock are displayed | Pass by operator basic-chain acceptance | None |
| C-03 | Attempt order and cancel authorization | No order is created and no stock is reserved | Pass by prior automated verification; not separately reported in manual pass | None |
| C-04 | Attempt order and allow Mock WeChat login plus phone authorization | Pending merchant-confirmation order is created | Pass by operator basic-chain acceptance | None |
| C-05 | Attempt quantity above stock | Order is blocked and stock is unchanged | Pass by prior automated verification; not separately reported in manual pass | None |

### Manual Acceptance Exit Criteria

- At least one owner -> staff -> customer -> merchant full click-through is
  completed in WeChat DevTools.
- Every blocking issue has a defect ID.
- P0/P1 defects are fixed or explicitly cleared before Phase 2 starts.
- P2/P3 issues may remain only if they are recorded for later prioritization.

## Module 0.3 Defect Severity and Handling Process

| Severity | Definition | Phase Gate |
| --- | --- | --- |
| P0 | Main chain break, data loss, inventory error, order error, permission bypass | Must fix before continuing |
| P1 | A critical role cannot complete its core workflow | Must fix before Phase 2 |
| P2 | Prompt, compatibility, empty state, recoverable UX, or non-blocking workflow issue | Record and prioritize |
| P3 | Non-blocking visual, copy, or polish issue | Record for later UI/product pass |

Every defect record should include:

- Defect ID.
- Severity.
- Role.
- Page or module.
- Baseline commit.
- Reproduction steps.
- Expected result.
- Actual result.
- Screenshot or recording path.
- Fix owner or next action.
- Retest result.

### Current Defect Records

| Defect ID | Severity | Role | Area | Status | Evidence | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| P1-DEVTOOLS-IMPORT-001 | P1 | All | WeChat DevTools manual acceptance | Resolved, retest ready | Initial failure: `WeappLog\logs\2026-05-09-09-25-27-225-deIxGpebPB.log` lines 119 and 136 report `app.json: 在项目根目录未找到 app.json`; the same log records `.git/objects` file changes, and root-level `project.config.json` / `project.private.config.json` appeared in the repo root after import. Resolution evidence: `WeappLog\logs\2026-05-09-09-34-04-155-deIxGpebPB.log` records correct `dist\build\mp-weixin` dirpath, `simulator launch success`, and `webview page ready`. | Continue with the manual Owner / Staff / Customer / Merchant matrix in the correctly imported DevTools project. |

## Files Changed

- Added `docs/plans/2026-05-09-phase-0-baseline-acceptance-log.md`.

## Business Code Intentionally Not Changed

- `src/domain`
- `src/features`
- `src/services`
- `src/pages`
- Tests and fixtures
- `package.json` scripts
- Build configuration

## Next Phase 0 Task

Phase 0.2 basic manual acceptance is complete for the current mock baseline.
Before entering Phase 2, decide whether to first close the Phase 1 medium-risk
page boundary work or to write the Phase 2 real backend and persistence PRD.
Formal release acceptance still needs screenshots/recordings, exact DevTools
version, base library version, simulator/device, and domain/AppID settings.
