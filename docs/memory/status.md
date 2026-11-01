<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: restore a green test baseline with no feature or schema
  changes (P25-F).
- Current task state: corrected stale past-month balance-label expectations,
  made the Review and large-amount smoke fixtures date-relative, and updated
  the memory test count. The TransactionsScreen and RouteRenderSmoke focused
  suites pass (155/155); all six full project gates are recorded in
  [PROGRESS.md](../PROGRESS.md).
- Schema version: v13 (`src/domain/schemas.ts`).
- Test counts: 79 suites, 958 tests passed on Node 26.13.0 in the P25-F final
  coverage run.
- Coverage for `src/domain/`, `src/data/` and pure `src/lib/` is above the
  documented floors; see P25-F in the ledger for the exact percentages.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).
- Next release phase: Phase 24 reminders and notifications (CR-1); later accessibility,
  performance, cleanup and release work remain in their planned phases.

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
