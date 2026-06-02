# Real Device Acceptance Failure - Phase 10 Admin Workbench P1 Delivery Log

Captured: 2026-06-01 18:20:00 +08:00

Agent phase: `agents.prd_implementer.toml`

Status: `IMPLEMENTED`

Overall real-device acceptance status remains: `FAIL`.

## Repository Impact Map

Expected modified files or directories:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/mall-api-core.test.js`
- `src/features/cloudbase-mall/owner-draft-review.ts`
- `src/features/owner-draft-review/owner-draft-review.ts`
- `src/features/cloudbase-mall/staff-image-tasks.ts`
- `src/features/staff-image-tasks/staff-image-tasks.ts`
- `src/features/admin-workbench-auth/admin-workbench-auth.ts`
- `src/features/admin-workbench-auth/admin-workbench-auth.test.ts`
- `src/features/admin-workbench-auth/admin-workbench-guard.test.ts`
- `src/pages/owner/account-management/index.vue`
- `src/pages/owner/account-management/index.test.ts`
- `src/pages/owner/more/index.vue`
- `src/pages/owner/more/index.test.ts`
- `src/pages/owner/permissions/index.vue`
- `src/pages/owner/permissions/index.test.ts`
- Focused tests for the feature/page files above.
- `docs/plans/real-device-acceptance-fixes/10-admin-workbench-fix-delivery-log.md`

Explicitly out of scope:

- Customer shopping bag, favorites, mine, product browsing, order backend, payment, logistics, refunds, coupons, and OCR extraction behavior.
- CloudBase database schema changes.
- Product canonical image storage rules.
- Rewriting accepted PRDs or unrelated delivery logs.
- Broad admin workbench redesign beyond the P1 acceptance blockers.

Business contracts that must remain unchanged:

- Confirming a draft batch still creates products/SKUs through the existing mall workflow and CloudBase action.
- Confirmed drafts must not remain in the review queue after refresh.
- Staff image task filtering still uses batch IDs as stable values; only labels become more readable.
- Account authorization still flows through the existing admin permission feature.
- Password change still logs out the current admin session.
- No page should add direct repository or CloudBase collection writes.

Verification commands planned:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/owner-draft-review/owner-draft-review.test.ts src/features/staff-image-tasks/staff-image-tasks.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/pages/owner/account-management/index.test.ts src/pages/owner/more/index.test.ts src/pages/staff/image-tasks/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts
pnpm.cmd run verify:full
```

## Execution Plan

1. Tighten draft review view-model filtering so confirmed drafts are removed from groups, counts, and confirm eligibility.
   - Acceptance: local and CloudBase draft review tests prove confirmed drafts are hidden after refresh.
2. Replace raw-only batch labels with readable staff image task labels that include batch/status/count context while preserving batch ID values.
   - Acceptance: local and CloudBase staff image task tests prove labels are understandable and filtering still uses the original ID value.
3. Make account registration copy and controls match the existing password-login system by collecting initial password and confirmation.
   - Acceptance: feature/page tests prove the registration UI has password/confirm fields, no longer advertises the shared default password, and registered accounts can use their chosen initial password.
4. Run focused tests, then `verify:full`.
   - Acceptance: all commands complete successfully, or any failure is diagnosed before further changes.

Uncertain assumptions:

- Real WeChat DevTools acceptance cannot be completed from this shell and remains a manual evidence gate.
- Existing admin password storage is an MVP in-memory implementation; this phase avoids introducing a new backend or persistence contract.

## Implementation

Changed behavior:

- Draft review now treats only non-deleted and non-confirmed drafts as reviewable in:
  - local/mock owner draft review ViewModel.
  - CloudBase owner draft review ViewModel.
  - remote `mallApi.getLatestDraftReviewSnapshot`.
- Staff image task batch picker labels now preserve the original batch ID as `value`, but show readable metadata:
  - shortened batch ID.
  - created time.
  - batch status.
  - pending image task count.
  - uploaded screenshot count.
- Account registration now collects explicit initial password and confirmation before authorizing a new admin account.
- Account passwords are stored in the existing MVP in-memory auth feature as deterministic local hashes instead of raw password strings.
- The built-in creator account remains the only account that can use the legacy `123456` default. Newly authorized accounts cannot log in until an explicit initial password is set.
- The permissions page no longer creates brand-new login-capable accounts directly; new-account creation routes to account management so initial password confirmation is mandatory. Existing-account permission edits stay in the permissions page.
- More-page account management copy now describes registration, initial password setup, and password changes.

Intentionally unchanged:

- No customer login/auth behavior was changed.
- No order, payment, logistics, refund, coupon, or OCR extraction behavior was changed.
- No page writes directly to CloudBase collections or repositories.
- Product image Phase 5 code was not widened in this phase; the owner product image acceptance item remains covered by the earlier signed-temp-url render fix plus manual WeChat image evidence.

## Verification

Focused P1 admin tests before Reviewer fix:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/owner-draft-review/owner-draft-review.test.ts src/features/staff-image-tasks/staff-image-tasks.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/pages/owner/account-management/index.test.ts src/pages/owner/more/index.test.ts src/pages/staff/image-tasks/index.test.ts src/features/cloudbase-mall/cloudbase-mall.test.ts cloudfunctions/mallApi/mall-api-core.test.js
```

Result:

- passed.
- 8 files, 127 tests.

Reviewer pass:

- Initial `prd_reviewer` status: `NEEDS_FIX`.
- Blocking issue: permissions page could still create a new account without initial password, and non-creator accounts without stored passwords could still fall back to shared `123456`.
- Fix: route brand-new account creation to account management, restrict default `123456` to the creator account, and update guard/auth tests to set explicit initial passwords for non-creator accounts.

Focused auth/permissions regression tests after Reviewer fix:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/admin-workbench-auth/admin-workbench-guard.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts src/pages/owner/permissions/index.test.ts
```

Result:

- passed.
- 3 files, 16 tests.

Reviewer re-pass:

- Scoped `prd_reviewer` status: `PASS`.
- No concrete blockers found in the Phase 10 file set.
- Reviewer confirmed:
  - non-creator accounts no longer fall back to `123456`.
  - account creation requires explicit initial password and confirmation.
  - permissions page routes unknown accounts to account management while preserving existing-account permission edits.
  - confirmed drafts are filtered from local, CloudBase feature, and backend snapshot paths.
  - staff batch options keep `value: batch.id` while using readable labels.

Full verification after Reviewer fix:

```powershell
pnpm.cmd run verify:full
```

Result:

- passed.
- root Vitest: 75 files, 471 tests.
- backend Vitest: 12 files, 61 tests.
- coverage completed above threshold.
- `vue-tsc --noEmit` passed.
- production and full dependency audits reported no known vulnerabilities.
- `build:mp-weixin`, `e2e-smoke`, and `mp:runtime-audit` passed.

## Remaining Work

- Keep overall real-device acceptance status as `FAIL` until WeChat DevTools or real-device acceptance proves the runtime behavior end to end.
