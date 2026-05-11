# 2026-05-09 Phase 2 Strict PRD Gate Review

## Scope

This review strictly compares the current repository state against:

- `docs/prd/2026-05-08-enterprise-launch-master-prd.md`
- `docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`
- `docs/plans/2026-05-09-cloudbase-route-decision.md`
- `docs/plans/2026-05-09-cloudbase-console-setup-log.md`
- `docs/plans/2026-05-09-cloudbase-phase-2-execution-log.md`

It is a gate review. Earlier entries were written before the CloudBase
business-data wiring pass; this file now records the latest gate state after
that pass. Mini-program visual UI remains unchanged, but page-facing runtime
facades now call the CloudBase `mallApi` service path instead of the in-memory
repository for the main owner/staff/customer pages.

## Route Update

On 2026-05-09, the user approved changing the long-term backend and persistence
route to WeChat official CloudBase:

- CloudBase cloud functions
- CloudBase cloud database
- CloudBase cloud storage

The PostgreSQL-compatible backend/database work remains preserved as historical
engineering baseline and transitional evidence. Future Phase 2 gate checks must
use the CloudBase route unless a later PRD explicitly re-approves PostgreSQL.

## Strict Conclusion

Phase 2 is complete enough to enter Phase 3 planning and implementation under
the strict master PRD gate.

CloudBase Phase 2 now has environment, collection/index, cloud function
contract, deployed `mallApi` business-data write/read, service-adapter evidence,
mini-program page-facing CloudBase runtime wiring, refreshed `verify` /
`verify:full` evidence, and recorded real-AppID WeChat DevTools manual
acceptance for the current owner screenshot import path.

Important scope note: this is a Phase 2 persistence/backend gate. The current
owner screenshot import path intentionally does not claim real OCR accuracy.
The previous fixed mock-output problem is closed by preventing fabricated
product fields from being written before a real OCR provider exists. Real
OCR/AI recognition remains Phase 6.

## Completed Evidence

Completed from the previous engineering baseline:

- Phase 2.1 backend baseline.
- Phase 2.2 database schema and migration baseline.
- Phase 2.3 repository port and database repository baseline.
- Phase 2.4 API contract and BFF endpoint baseline.
- Phase 2.5 backup/restore/migration runbook baseline.

Completed on the approved CloudBase route:

- CloudBase environment recorded: `cloud1-d7gifjyzl7721b383`.
- Billing posture recorded: free quota first.
- Required Phase 2 CloudBase collections created with `ADMINONLY`
  permissions.
- Core MVP-path indexes created or confirmed.
- `mallHealth` deployed and invoked successfully.
- `mallApi` deployed and invoked successfully as a business-data boundary.
- `createOcrBatch` writes CloudBase `ocr_batches` and `product_drafts`.
- `getLatestDrafts` reads the persisted CloudBase batch/draft data back.
- `confirmBatch` creates CloudBase product/SKU data and has a duplicate guard
  for partially completed or repeated confirmation.
- Local CloudBase-shaped repository contract baseline exists.
- Local `wx.cloud.callFunction`-style client wrapper exists.
- Local `mallApi` service adapter exists and keeps action calls behind
  `src/services/cloudbase`.
- Owner screenshot import, draft review, product management, order management,
  staff image task, customer product list, and customer product detail pages now
  call CloudBase page-facing facades under `src/features/cloudbase-mall`.

## Current CloudBase Gate Status

| Gate | Status | Evidence or blocker |
| --- | --- | --- |
| CloudBase environment and authorization | Pass | Environment `cloud1-d7gifjyzl7721b383`; console and CLI authorization succeeded during setup |
| CloudBase collections and core indexes | Pass for baseline | Required collections use `ADMINONLY`; MVP-path indexes created or confirmed |
| Cloud function contract | Pass | `mallHealth` and `mallApi` deployed and smoke-tested |
| `mallApi` business-data integration | Pass for OCR/draft/product baseline | Deployed `createOcrBatch`, `getLatestDrafts`, `confirmBatch`, and `listProducts` smoke probes pass against CloudBase data |
| Mini-program CloudBase runtime path | Pass for MVP pages | Page-facing CloudBase facades are wired for owner/staff/customer MVP pages; pages still do not call `wx.cloud` directly |
| WeChat DevTools manual acceptance | Pass for current Phase 2 owner import gate | Real-AppID build `wxa63c53796488d4d4` can call CloudBase environment `cloud1-d7gifjyzl7721b383`; owner `开始识别` path was manually accepted on 2026-05-10 |

2026-05-10 update: the earlier `touristappid` artifact blocker is resolved in
source and build output. `src/manifest.json` and generated
`dist/build/mp-weixin/project.config.json` now use real AppID
`wxa63c53796488d4d4`. The subsequent CloudBase environment/function/collection
blockers were also resolved for `cloud1-d7gifjyzl7721b383`, and the user
confirmed the current owner screenshot recognition gate passed in WeChat
DevTools.

## Phase 1 Gate Check

| Master PRD item | Evidence | Status |
| --- | --- | --- |
| Module 1.1 UI boundary delivery review | `docs/plans/2026-05-09-phase-1-1-ui-boundary-review-log.md` | Pass |
| Module 1.2 medium-risk page closure | `docs/plans/2026-05-09-phase-1-2-medium-risk-ui-boundary-log.md` | Pass |
| Module 1.3 UI contract freeze | `docs/plans/2026-05-09-phase-1-3-ui-contract-freeze-log.md`, `docs/contracts/page-facing-ui-contracts.md` | Pass |
| Boundary and verification commands | Latest Phase 2 verification records | Pass |

Phase 1 can be treated as completed.

## Phase 2 Exit Criteria Check

| Exit criterion | Status | Evidence or blocker |
| --- | --- | --- |
| Repository contract | Pass for local contract baseline | Local repository contract tests cover the CloudBase-shaped adapter |
| Cloud function contract | Pass | `mallHealth` and `mallApi` smoke probes pass |
| CloudBase collection/index initialization | Pass for baseline | Required collections and core MVP indexes are recorded |
| Integration | Pass for Phase 2 baseline | Deployed `mallApi` writes and reads CloudBase business data; mini-program pages are wired to CloudBase facades; real AppID-gated owner import flow passed manual acceptance |
| Manual acceptance | Pass for current Phase 2 gate | User confirmed acceptance after CloudBase env/function/collection fixes and the mock-output fix |

## Phase 2 Final Closure Notes

Resolved on 2026-05-10:

1. Real AppID `wxa63c53796488d4d4` is synced into `src/manifest.json`.
2. `pnpm.cmd run build:mp-weixin` generated
   `dist/build/mp-weixin/project.config.json` with AppID
   `wxa63c53796488d4d4`.
3. WeChat DevTools Stable `2.01.2510290` opened the mp-weixin artifact without
   the earlier `touristappid` change-failure dialog during the desktop
   observation pass.
4. `pnpm.cmd run verify:full` passed again after the AppID sync.
5. A manual owner screenshot recognition attempt then failed with
   `cloud.callFunction:fail errCode: -501000` / `Environment not found` from
   the WeChat runtime. CloudBase CLI can still invoke `mallApi` in
   `cloud1-d7gifjyzl7721b383`, so the remaining blocker is mini-program AppID
   access to that CloudBase environment.
6. The account/environment mismatch was corrected to AppID
   `wxa63c53796488d4d4` and CloudBase environment
   `cloud1-d7gifjyzl7721b383`.
7. `mallHealth` and `mallApi` were deployed to the correct CloudBase
   environment and validated through CloudBase CLI.
8. Required CloudBase collections were created/confirmed in
   `cloud1-d7gifjyzl7721b383`; the `ocr_batches` collection-not-exist blocker
   is resolved.
9. The owner `开始识别` path was manually accepted by the user.
10. The later accuracy complaint was traced to fixed mock OCR output. The
    current Phase 2 fix prevents fabricated product name/code/price/spec fields
    from being written before a real OCR provider exists. This preserves the
    Phase 6 boundary for real OCR/AI.
11. Final local verification passed:

    ```powershell
    pnpm.cmd run verify
    pnpm.cmd run verify:full
    ```

## Business Code Intentionally Not Changed

- Current OCR provider behavior
- Product and SKU domain rules
- Customer order and merchant order domain rules
- Existing page-facing UI contracts and visual layout
- Direct page-to-CloudBase access remains prohibited; pages only call feature
  facades.

## Gate Decision

Phase 2 can be marked complete for the CloudBase backend/persistence gate.

Allowed wording:

```text
CloudBase Phase 2 environment, collections, core indexes, and cloud function
contract deployment are established. Real mallApi business-data wiring and the
service adapter are in place, MVP pages call CloudBase facades, final
`verify`/`verify:full` pass, and the current real-AppID WeChat DevTools owner
import gate was manually accepted. Phase 3 real image/object storage may start
next, with real OCR/AI still reserved for Phase 6.
```
