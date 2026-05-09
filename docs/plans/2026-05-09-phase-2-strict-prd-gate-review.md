# 2026-05-09 Phase 2 Strict PRD Gate Review

## Scope

This review strictly compares the current repository state against:

- `docs/prd/2026-05-08-enterprise-launch-master-prd.md`
- `docs/prd/2026-05-09-phase-2-real-backend-persistence-prd.md`
- `docs/plans/2026-05-09-cloudbase-route-decision.md`
- `docs/plans/2026-05-09-cloudbase-console-setup-log.md`
- `docs/plans/2026-05-09-cloudbase-phase-2-execution-log.md`

It is a gate review, not an implementation module. It does not change business
code, API code, repository code, cloud functions, or mini-program UI.

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

Phase 2 is not fully complete under the strict master PRD gate.

CloudBase Phase 2 now has environment, collection/index, and cloud function
contract evidence. However, it does not yet satisfy the Phase 2 integration and
manual acceptance gates required before entering Phase 3.

## Completed Evidence

Completed from the previous engineering baseline:

- Phase 2.1 backend baseline.
- Phase 2.2 database schema and migration baseline.
- Phase 2.3 repository port and database repository baseline.
- Phase 2.4 API contract and BFF endpoint baseline.
- Phase 2.5 backup/restore/migration runbook baseline.

Completed on the approved CloudBase route:

- CloudBase environment recorded: `shop-d0gl83cca8b2777b5`.
- Billing posture recorded: free quota first.
- Required Phase 2 CloudBase collections created with `ADMINONLY`
  permissions.
- Core MVP-path indexes created or confirmed.
- `mallHealth` deployed and invoked successfully.
- `mallApi` deployed and invoked successfully as a contract boundary.
- Local CloudBase-shaped repository contract baseline exists.
- Local `wx.cloud.callFunction`-style client wrapper exists.

## Current CloudBase Gate Status

| Gate | Status | Evidence or blocker |
| --- | --- | --- |
| CloudBase environment and authorization | Pass | Environment `shop-d0gl83cca8b2777b5`; console and CLI authorization succeeded during setup |
| CloudBase collections and core indexes | Pass for baseline | Required collections use `ADMINONLY`; MVP-path indexes created or confirmed |
| Cloud function contract | Pass for contract | `mallHealth` and `mallApi` deployed and smoke-tested |
| `mallApi` business-data integration | Pending | Contracted business actions such as `createOcrBatch` still return `NOT_IMPLEMENTED` |
| Mini-program CloudBase runtime path | Pending | Local client wrapper exists, but the active mini-program runtime is not switched through real `wx.cloud.callFunction` |
| WeChat DevTools manual acceptance | Pending | No acceptance record exists for the CloudBase integration path |

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
| Integration | Pending | Deployed `mallApi` is not wired to CloudBase business persistence yet |
| Manual acceptance | Pending | WeChat DevTools acceptance against CloudBase integration path has not been run |

## Required Next Work Before Declaring Phase 2 Complete

1. Wire the minimum Phase 2 `mallApi` OCR/draft actions to CloudBase
   business-data persistence: `createOcrBatch`, `listOcrBatches`,
   `getCurrentOcrBatch`, and `getLatestDrafts`.
2. Smoke-test real CloudBase writes and reads through deployed `mallApi`.
3. Wire the mini-program service adapter to the deployed cloud function path,
   while keeping pages behind feature/service boundaries and avoiding direct
   page-level `wx.cloud` calls.
4. Rebuild and rerun WeChat DevTools manual acceptance against the CloudBase
   integration path, or record any remaining blocker with a defect ID.
5. Run:

   ```powershell
   pnpm.cmd run verify
   pnpm.cmd run verify:full
   ```

## Business Code Intentionally Not Changed

- `src/pages/`
- Current OCR provider behavior
- Product and SKU domain rules
- Customer order and merchant order domain rules
- Existing page-facing UI contracts

## Gate Decision

Do not mark Phase 2 as fully complete yet.

Allowed wording:

```text
CloudBase Phase 2 environment, collections, core indexes, and cloud function
contract deployment are established, but real mallApi business-data wiring,
mini-program CloudBase service integration, and WeChat DevTools acceptance
remain pending. Do not enter Phase 3 yet.
```
