# 2026-05-27 Project Latency Optimization Module 4 Log

## Repository Impact Map

Governing PRD:

```text
docs/prd/2026-05-27-project-latency-optimization-prd.md
```

Completed scope:

```text
cloudfunctions/mallApi/mall-api-core.js
cloudfunctions/mallApi/mall-api-core.test.js
src/services/cloudbase/mall-api-client.ts
src/services/cloudbase/mall-api-client.test.ts
src/features/cloudbase-mall/staff-image-tasks.ts
src/features/cloudbase-mall/owner-draft-review.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
src/pages/staff/image-tasks/index.vue
src/pages/staff/image-tasks/index.test.ts
src/services/auth/cloudbase-wechat-auth-service.test.ts
docs/contracts/page-facing-ui-contracts.md
docs/testing/2026-05-27-page-performance-baseline.md
docs/plans/2026-05-27-project-latency-optimization-module-4-log.md
```

Explicitly out of scope:

```text
order confirmation
admin dashboard
shopping bag/favorites/mine/payment/logistics
product publish and inventory semantics
OCR recognition provider flow
page template/style/visual layout
```

Preserved contracts:

- Staff can supplement product images but cannot publish products or edit
  product operating data from the staff image task page.
- Draft review confirmation, low-confidence blocking, required-field blocking,
  deleted-draft behavior, and product/SKU creation semantics remain unchanged.
- Staff image keyword and batch filtering are local display behavior.
- The staff image task page did not receive template, style, or visual layout
  changes.

## Module 4 Deliverables

### Staff Image Task Snapshot

Added the aggregated mallApi action:

```text
getStaffImageTaskSnapshot
```

The action returns OCR batches, pending-image products, and server time. It is
protected by the existing product-management permission path for owner/staff
roles.

The CloudBase staff image task facade now reads this single snapshot instead of
composing `listOcrBatches` and `listPendingImageTasks`.

### Local Staff Image Filtering

Added a ViewModel-local staff image task filter:

```text
filterCloudBaseStaffImageTasksView(view, { keyword, selectedBatchId })
```

The staff image task page now keeps the loaded snapshot in page state and
applies keyword and batch changes locally. Supplementing images still refreshes
the affected staff image task snapshot after the write succeeds.

### Draft Review Snapshot

Added the aggregated mallApi action:

```text
getLatestDraftReviewSnapshot
```

The action returns the latest OCR batch, its drafts, and server time. The
CloudBase draft review facade now uses this explicit snapshot action while
preserving existing ViewModel derivation for grouping, low-confidence flags,
field source labels, needs-completion counts, and price-conflict flags.

## Verification

RED:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/staff/image-tasks/index.test.ts
```

Result: failed as expected because the two snapshot actions and client methods
did not exist yet, the CloudBase facades still used the old read paths, and the
staff image task page still refreshed remotely for keyword and batch changes.

GREEN:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts cloudfunctions/mallApi/mall-api-core.test.js src/services/cloudbase/mall-api-client.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/pages/staff/image-tasks/index.test.ts
```

Result: passed, 4 test files and 75 tests.

Final automated gates:

```powershell
pnpm.cmd run verify
```

Result: passed. The gate completed lint, boundary checks, unit tests,
coverage, type-check, backend tests/build, and dependency audits. Frontend test
summary: 55 test files and 308 tests passed. Backend test summary: 12 test
files and 60 tests passed. Coverage remained above the configured threshold.
Both production and full dependency audits reported no known vulnerabilities.

```powershell
pnpm.cmd run verify:full
```

Result: passed. The full gate reran `verify`, built the mp-weixin bundle, and
passed the mp-weixin artifact/page-route smoke check.

## Remaining Module 4 Gaps

- WeChat DevTools or real-device manual acceptance has not been executed.
- CloudBase deployed-function smoke against a real environment was not executed
  in this local module pass.
- Shared page snapshot cache and stale-while-revalidate infrastructure remain
  outside this module boundary.

## Next Module Boundary

Next module should follow the PRD sequence for order confirmation and
management workbench loading/cache behavior. Do not expand this module into
shopping bag, favorites, mine, payment, logistics, or UI redesign work.
