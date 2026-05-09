# 2026-05-09 CloudBase Route Decision

## Decision

The long-term backend and persistence route for this WeChat mini-program is
changed to the official WeChat CloudBase route.

Approved target:

- CloudBase Cloud Functions for backend/service execution.
- CloudBase Cloud Database for durable persistence.
- CloudBase Cloud Storage for real image/object storage when Phase 3 starts.

The current PostgreSQL-oriented work under `backend/` is preserved as an
engineering baseline and transitional evidence. It is not the default route for
future Phase 2 implementation unless a later PRD explicitly re-approves it.

## Reasons

1. The product is a WeChat mini-program, so CloudBase fits the WeChat ecosystem
   more directly than a generic external PostgreSQL backend.
2. CloudBase can align future WeChat login, cloud functions, database, and
   storage work under one official platform boundary.
3. Supabase's free database size limit creates long-term capacity concern for
   this product direction.
4. Keeping CloudBase as the default route reduces future confusion about whether
   the team should provision `DATABASE_URL` or a CloudBase environment.

Official references:

- [CloudBase documentation](https://docs.cloudbase.net/)
- [CloudBase mini-program introduction](https://docs.cloudbase.net/quick-start/mini-program/introduce)

## Consequences

- Future Phase 2 modules should ask for CloudBase environment information, not
  staging PostgreSQL `DATABASE_URL`.
- Future mini-program runtime integration should call service adapters that wrap
  `wx.cloud.callFunction`; pages must still not call CloudBase directly.
- Future repository implementation should be `CloudBaseMallRepository` or an
  equivalent adapter behind the existing repository port.
- SQL migration language in older docs should be read as historical context.
  New work should use CloudBase collection, index, permission, and data-change
  records instead.
- Existing PostgreSQL tests and code should not be deleted as part of this
  decision. Removal or migration should be a separate approved cleanup task.

## Next Implementation Modules

1. CloudBase environment baseline:
   - create or connect dev/staging/prod CloudBase environments;
   - record environment ID, region, owner, and operator permissions;
   - add local setup and deployment notes.
2. CloudBase cloud function contract:
   - define callable function names and response envelope;
   - keep request validation and stable error codes;
   - keep cloud calls behind service adapters.
3. CloudBase data model:
   - define Phase 2 collections and indexes;
   - document permission assumptions and change process;
   - add initialization/validation scripts or documented rehearsal.
4. CloudBase repository adapter:
   - implement repository contract behind the service layer;
   - run the same contract tests as the in-memory repository.
5. Manual acceptance:
   - rebuild mini-program;
   - run WeChat DevTools acceptance against the CloudBase integration path;
   - record screenshots, environment, and remaining blockers.

## Required External Inputs

Before the next CloudBase implementation module starts, the project needs:

1. CloudBase environment ID for dev/staging.
2. Confirmation of the Tencent Cloud / WeChat mini-program account that owns the
   environment.
3. Operator access for deploying cloud functions and configuring database
   collections/indexes.
4. Decision on whether CloudBase billing is enabled now or whether the first
   implementation must stay inside free quota.
