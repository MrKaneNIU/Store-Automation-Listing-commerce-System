# 2026-06-03 Admin Workbench Server Auth PRD

## Problem Statement

The admin workbench intentionally uses an independent account system instead of
WeChat login. That product direction is correct and must be preserved.

The current blocker is that admin identity and permissions can be supplied by
the client as `adminSession`. A client can forge role or permission fields and
the CloudBase `mallApi` admin guards may treat those fields as authority. This
means the current boundary is not safe for production even if the UI login flow
looks correct.

This PRD defines the server-side account, session, permission, and audit model
needed before formal launch.

## Current Verified State

- The admin workbench has an independent account/password UX.
- Admin session state is currently represented on the client side and sent to
  `mallApi` as `adminSession`.
- The CloudBase function contains admin guard logic in `mallApi`.
- A forged `adminSession` can be used to exercise admin API paths that should
  require verified server-side authority.
- Customer WeChat identity flows are separate from this issue and are not in
  scope for this PRD.

## Product Goals

1. Keep the admin workbench as an independent account/password system.
2. Move admin account authority to CloudBase server-side state.
3. Make the client store only a server-issued opaque admin token.
4. Make every admin API validate the token, account status, role, and
   permissions server-side.
5. Make registration, authorization, permission changes, disable, and revoke
   operations synchronize with CloudBase immediately.
6. Ensure disabled accounts, revoked sessions, and removed permissions lose
   access on the next admin request.
7. Preserve existing admin workbench user experience unless a small copy/state
   change is required to reflect server-side errors.
8. Produce test and smoke evidence before the fix is considered launch-ready.

## Frozen Existing Contracts

The implementation must preserve these current admin-workbench contracts:

- Admin roles remain `creator`, `owner`, and `staff`.
- Permission scopes remain:
  - `workbenchAccess`
  - `productManagement`
  - `orderConfirmation`
  - `more`
  - `homepageSettings`
  - `accountManagement`
  - `permissionManagement`
- `creator` can grant owner-level access.
- `owner` can grant only `staff` access and only within the owner's current
  permission subset.
- `staff` can only use the permissions explicitly granted.
- `creator` account takeover, disable, or overwrite behavior remains forbidden.
- The `mallApi` response envelope remains compatible with the existing client
  shape.
- Page code must continue to use feature/facade/client seams and must not write
  admin CloudBase collections directly.

## Non-Goals

- Do not replace admin login with WeChat login, OAuth, SMS, or customer login.
- Do not modify customer-side WeChat auth, shopping bag, favorites, mine,
  checkout, payment, logistics, refunds, coupons, or customer-service flows.
- Do not redesign admin pages.
- Do not change product, order, inventory, OCR, homepage, or upload business
  behavior except where an existing admin API must receive verified authority.
- Do not introduce public self-registration for admin accounts.
- Do not keep or add shared default-password fallback for login-capable accounts.
- Do not add new dependencies unless the implementer proves the existing runtime
  cannot safely hash passwords or generate tokens.

## User Stories

1. As the system owner, I want admin accounts to be managed independently from
   WeChat, so that merchant staff do not need personal WeChat identity for the
   management workbench.
2. As the creator admin, I want to create an admin account with an explicit
   initial password, so that the account can log in without hidden defaults.
3. As the creator admin, I want to grant or revoke role permissions in the
   account-management page, so that access control remains operational.
4. As an admin user, I want permission changes to take effect immediately, so
   that I cannot continue using removed permissions after the next request.
5. As the system owner, I want forged client sessions to fail, so that the
   CloudBase function is the only authority for admin access.
6. As an operator, I want audit logs for account and permission operations, so
   that sensitive admin changes are traceable.

## Requirements

### R1. Server-Side Admin Account Source of Truth

- Admin accounts shall be stored in a CloudBase collection controlled by
  `mallApi`.
- Account records shall contain account id, password hash metadata, role,
  permission list, status, timestamps, and last login metadata.
- The page shall not write account records directly.
- Login-capable accounts shall require an explicit initial password.
- No non-creator account may use a shared default password.
- If a creator bootstrap path is required, it shall be one-time, server-side,
  environment-controlled, and disabled once a creator account exists.
- The legacy `admin / 123456` creator seed may be retained only as a controlled
  server-side bootstrap or migration path, not as front-end authority.

### R2. Server-Issued Opaque Admin Sessions

- Successful login shall return an opaque token issued by `mallApi`.
- The token shall be stored only as a hash server-side.
- The client may persist the token for session restore.
- The client shall not persist or submit role or permission fields as authority.
- Session records shall support expiration, revocation, last-seen update, and
  account linkage.
- Logout shall revoke the current token server-side.

### R3. Admin Guard Replacement

- Every admin-only `mallApi` action shall resolve authority from the opaque
  token.
- The CloudBase function entry shall strip or ignore client-submitted
  `adminSession` before dispatching privileged admin actions.
- Guard logic shall load the active session and active account from CloudBase.
- Guard logic shall evaluate current role and permissions from the account
  record on every admin request.
- Guard logic shall ignore client-submitted `adminSession.role`,
  `adminSession.permissions`, or equivalent self-reported authority fields.
- Missing, expired, revoked, disabled, or permission-insufficient sessions shall
  return a stable unauthorized or forbidden error.

### R4. Account Management Actions

`mallApi` shall provide server-side actions for the admin workbench:

- `adminLogin`
- `adminLogout`
- `getAdminSession`
- `changeAdminPassword`
- `createAdminAccount`
- `updateAdminPermissions`
- `disableAdminAccount`
- `revokeAdminSessions`
- `listAdminAccounts`
- `listAdminAuditLogs`

The final implementation may keep action names aligned with existing router
style, but each capability above must exist behind server-side authorization.

### R5. Immediate Permission Synchronization

- Creating an account shall write the account to CloudBase before the UI reports
  success.
- Updating permissions shall write to CloudBase before the UI reports success.
- Disabling an account shall write to CloudBase and revoke active sessions for
  that account.
- Revoking a user's access shall take effect on the user's next admin request.
- `getAdminSession` shall refresh the UI's displayed role and permission state
  from CloudBase, not from stale page-local memory.

### R6. Auditability

- Successful and failed sensitive operations shall create audit entries.
- Audit entries shall include operator account, action, target account when
  present, result, timestamp, and safe details.
- Audit logs shall not store raw passwords, raw tokens, password hashes, or
  secrets.

### R7. Client Integration

- Admin pages shall call page-facing services or facades rather than directly
  writing CloudBase collections.
- The CloudBase mall API client shall send the opaque token to admin actions.
- The client shall stop sending role and permissions as authority.
- Existing admin workbench pages shall keep their current interaction model:
  login, account creation, permission management, logout, and guarded page
  access.
- UI changes shall be limited to server error states and session refresh states
  required by this PRD.

## Data Model

### `admin_accounts`

```text
_id: string
account: string
display_name?: string
password_hash: string
password_salt?: string
password_algorithm: string
role: 'creator' | 'owner' | 'staff'
permissions: string[]
status: 'active' | 'disabled'
failed_login_count: number
lock_until?: string
last_login_at?: string
last_login_ip?: string
created_by?: string
created_at: string
updated_at: string
```

Rules:

- `account` shall be unique.
- Raw passwords shall never be stored.
- Role and permissions are server-side authority.
- Disabled accounts cannot create valid sessions.

### `admin_sessions`

```text
_id: string
account_id: string
account: string
token_hash: string
expires_at: string
revoked_at?: string
created_at: string
last_seen_at?: string
created_ip?: string
user_agent?: string
```

Rules:

- Raw tokens shall be returned once at login and never stored in clear text.
- Expired or revoked sessions are invalid.
- Token validation shall use the hashed token.

### `admin_audit_logs`

```text
_id: string
operator_account?: string
action: string
target_account?: string
result: 'success' | 'failure'
details?: Record<string, unknown>
created_at: string
```

Rules:

- Audit details must be safe for operational review.
- Passwords, raw tokens, hashes, and secrets must never be logged.

### Required Indexes

- `admin_accounts.account` unique.
- `admin_accounts.status`.
- `admin_sessions.token_hash` unique or equivalent lookup index.
- `admin_sessions.account_id` plus `expires_at`.
- `admin_audit_logs.operator_account` plus `created_at`.
- `admin_audit_logs.target_account` plus `created_at`.

## API Contract

### `adminLogin`

Input:

```text
account: string
password: string
```

Output:

```text
adminToken: string
account: string
role: string
permissions: string[]
expiresAt: string
```

Rules:

- Password verification happens only on the server.
- Failed login shall not reveal whether the account exists.
- Lockout or throttling behavior shall be implemented if supported by existing
  project patterns.

### `getAdminSession`

Input:

```text
adminToken: string
```

Output:

```text
account: string
role: string
permissions: string[]
status: 'active'
expiresAt: string
```

Rules:

- The response reflects current CloudBase account permissions.
- Invalid tokens return unauthorized.

### Account And Permission Actions

Input:

```text
adminToken: string
targetAccount?: string
role?: string
permissions?: string[]
initialPassword?: string
oldPassword?: string
newPassword?: string
```

Rules:

- `adminToken` identifies the operator.
- Operator permission is checked server-side.
- Target account changes are written before success is returned.
- Session revocation must be explicit when disabling or revoking access.

## Technical Scope

Expected implementation files or directories:

- `cloudfunctions/mallApi/mall-api-core.js`
- `cloudfunctions/mallApi/index.js`
- `cloudfunctions/mallApi/*test*`
- `src/services/cloudbase/mall-api-client.ts`
- `src/services/cloudbase/runtime-mall-api-client.ts` if runtime request shape
  must change.
- `src/services/auth/admin-workbench-session.ts`
- `src/features/admin-workbench-auth/`
- `src/features/admin-permissions/`
- Existing admin workbench page tests only where they exercise login, account
  management, permission management, or guarded navigation.

Explicitly out of implementation scope:

- `src/pages/customer/`
- customer private modules and customer auth.
- payment, logistics, refunds, coupons, customer-service flows.
- product/OCR/homepage/upload behavior except existing admin guard calls.
- new UI redesign or navigation restructuring.

## Agent Workflow Requirements

This PRD must be executed phase by phase. A phase is one implementation round.

Required agent order per phase:

1. `prd_planner` restates the phase boundary, write scope, tests, and risks.
2. `prd_implementer` makes only the scoped changes for that phase.
3. The main Codex thread runs the agreed verification for that phase.
4. `prd_reviewer` reviews scope, correctness, regressions, tests, and security.
5. If `prd_reviewer` returns `PASS`, the next phase may start.
6. If `prd_reviewer` returns `NEEDS_FIX` or `FAIL`, do not start the next phase.
7. `prd_debugger` may be called only to fix reviewer blockers or failing tests,
   with at most two debugger rounds before stopping and reporting.
8. `prd_reporter` is called only after all phases have reviewer `PASS`.

No phase may begin from chat memory alone. The implementer must reread this PRD
at the start of each phase.

## Implementation Phases

### Phase 0 - Planning Gate

Scope:

- No business code changes.
- Produce Repository Impact Map and Execution Plan for Phase 1 only.

Acceptance:

- `prd_planner` identifies exact Phase 1 files and tests.
- `prd_reviewer` returns `PASS` on the Phase 1 plan.
- If PASS is not returned, stop.

### Phase 1 - Server Data Model And Auth Utilities

Scope:

- Add or adapt server-side account, session, token, password-hash, and audit
  helpers inside the `mallApi` backend boundary.
- Add tests for token hashing, session validation, password verification,
  expired session rejection, revoked session rejection, and disabled account
  rejection.

Acceptance:

- No client UI behavior changes.
- Raw tokens and raw passwords are not stored or logged.
- Utility tests pass.
- `prd_reviewer` returns `PASS`.

### Phase 2 - Admin API Actions And Guard Replacement

Scope:

- Add admin auth/account actions in `mallApi`.
- Replace admin guard trust in client-provided `adminSession` with server-side
  token resolution.
- Strip or ignore client-submitted `adminSession` in the CloudBase function
  entry path before privileged action dispatch.
- Ensure existing admin action permission checks use current account role and
  permissions from CloudBase.

Acceptance:

- Forged `adminSession` without a valid token is rejected.
- Valid token with sufficient permission succeeds.
- Valid token with insufficient permission is forbidden.
- Expired, revoked, or disabled sessions are rejected.
- Existing customer WeChat identity behavior remains untouched.
- `prd_reviewer` returns `PASS`.

### Phase 3 - Admin Client And Page-Facing Facades

Scope:

- Update admin auth services to call server-side actions.
- Persist only the opaque admin token client-side.
- Refresh displayed role and permission state from `getAdminSession`.
- Keep account-management and permission-management UX intact unless a server
  error state is required.

Acceptance:

- Login uses `adminLogin`.
- Logout uses `adminLogout`.
- Account creation requires explicit password and writes through `mallApi`.
- Permission grant/revoke writes through `mallApi`.
- Page code does not directly write admin collections.
- Client requests no longer rely on self-reported role or permissions.
- `prd_reviewer` returns `PASS`.

### Phase 4 - Verification And Remote Smoke

Scope:

- Run automated project checks.
- Deploy or verify the relevant CloudBase function state according to the
  project's existing deployment workflow.
- Run remote smoke tests against the deployed environment.

Acceptance:

- `pnpm.cmd run verify` passes.
- `pnpm.cmd run verify:full` passes if build or CloudBase integration changed.
- Remote forged `adminSession` smoke returns unauthorized or forbidden.
- Remote valid-token smoke proves login and at least one read-only authorized
  admin action.
- Remote revoke or disable smoke proves next-request invalidation.
- `prd_reviewer` returns `PASS`.

### Phase 5 - Manual Acceptance And Final Report

Scope:

- Manual WeChat DevTools or real-device admin acceptance.
- Final docs/report only.

Acceptance:

- Creator can log in.
- Creator can create an account with explicit initial password.
- New account can log in.
- Creator can grant permission and the user can use it on the next request.
- Creator can revoke permission and the user loses access on the next request.
- Creator can disable an account and all active sessions are invalidated.
- Password change succeeds and old password no longer works.
- `prd_reporter` summarizes files changed, tests, reviewer results, manual
  acceptance, remaining risks, and merge recommendation.

## Test Plan

### Unit Tests

- Password hash/verify success and failure.
- Token generation, hashing, lookup, expiration, and revocation.
- Account status checks.
- Permission matching.
- Audit log sanitization.

### Backend Contract Tests

- `adminLogin` success.
- `adminLogin` failure without account enumeration.
- `getAdminSession` returns current role and permissions.
- Forged client `adminSession` is ignored.
- Missing token is rejected.
- Expired token is rejected.
- Revoked token is rejected.
- Disabled account token is rejected.
- Permission grant takes effect on next request.
- Permission revoke takes effect on next request.

### Frontend Service Tests

- Login facade stores only token-bearing session data.
- Mall API client sends token and not self-reported authority.
- Account creation calls server action with explicit password.
- Permission updates call server action and refresh session/account state.
- Logout revokes token and clears local session.

### Integration And Smoke Tests

- Local `verify`.
- Full build verification when integration changes require it.
- CloudBase read-only smoke for valid admin token.
- CloudBase malicious smoke for forged `adminSession`.
- CloudBase revoke/disable smoke for real-time invalidation.

## Security Requirements

- No hardcoded production password, token, or bootstrap secret.
- No password, raw token, hash, or secret in logs.
- Server-side guards are mandatory for every admin action.
- Client-submitted role and permissions are never authority.
- Account creation, permission update, disable, and session revoke require
  server-side creator or equivalent privileged permission.
- Error messages must not reveal whether an account exists.
- Audit logs must be written for sensitive success and failure paths.

## Launch Acceptance

The PRD is complete only when all conditions are met:

1. Every implementation phase has a `prd_reviewer` result of `PASS`.
2. No out-of-scope business files were modified.
3. Forged admin session remote smoke fails.
4. Valid admin token remote smoke succeeds.
5. Permission revoke and account disable are effective on the next request.
6. Automated verification passes.
7. Manual admin acceptance is recorded separately from automated tests.
8. Final report clearly states remaining risks and merge recommendation.

## Stop Conditions

Stop and report before continuing if any of the following occurs:

- A phase cannot get `prd_reviewer` `PASS`.
- The fix requires changing customer-side modules.
- The fix requires broad UI redesign.
- The fix requires a new dependency without a documented security reason.
- CloudBase deployment or remote smoke cannot be verified.
- The worktree contains conflicting user changes in a file required by the next
  phase.
