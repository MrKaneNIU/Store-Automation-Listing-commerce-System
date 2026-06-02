# Customer Runtime Stabilization - Manual Acceptance Checklist

Captured: 2026-06-01 13:31:00 +08:00

## Status

Manual WeChat DevTools acceptance: not completed in this run.

Manual real-device acceptance: not completed in this run.

Final status is therefore capped at `CONDITIONAL PASS`.

## Required WeChat DevTools Matrix

Use the built mini-program output:

```powershell
pnpm.cmd run build:mp-weixin
```

Import:

```text
dist/build/mp-weixin
```

Record evidence for:

- Customer login / identity context is present.
- Shopping bag opens without raw CloudBase errors.
- Empty shopping bag renders the approved empty/retry state.
- Favorites opens without raw CloudBase errors.
- Empty favorites renders the approved empty/retry state.
- Mine opens with identity, phone state, zero utility counts when applicable, and no raw CloudBase errors.
- Rapid tab switching between shopping bag, favorites, and mine does not create request storms or visibly stale overwrites.
- Retry taps do not start duplicate request storms.

Forbidden page-facing text:

- `DATABASE_COLLECTION_NOT_EXIST`
- `Db or Table not exist`
- `ResourceNotFound`
- `docs.cloudbase.net`
- stack traces
- raw JSON envelopes

## Required Real-Device Matrix

Record evidence for the same paths on a real WeChat device:

- Shopping bag
- Favorites
- Mine
- Tab switching among those pages
- Retry from transient failure state if available

## Evidence Slots

WeChat DevTools screenshots:

- Pending.

Real-device screenshots or screen recording:

- Pending.

Network/runtime notes:

- Pending.

## Manual Conclusion

Manual acceptance is not complete. Do not mark this PRD as final PASS until these evidence slots are filled with observed results.
