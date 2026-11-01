<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: one-off, local backup preparation for user-provided financial
  data.
- Current task state: A schema-v13 WealthWise backup was generated in the
  repository root and validated through backup parsing and the app-store import
  action. It is git-ignored and must remain uncommitted. The file represents
  supported current holdings, goals, emergency-fund allocation and explicit
  budget lines; it does not contain the full spreadsheet history.
- Verification: the focused backup suite passed (25 tests). A full coverage
  run had 79 suites / 955 tests in the last fully passing run on Node 26.13.0.
  The current run found failing TransactionsScreen and RouteRenderSmoke tests;
  those failures repeated in focused runs and are unrelated to the backup data.
- Schema version: v13 (`src/domain/schemas.ts`).
- Test counts: 79 suites, 955 tests in the last fully passing run; the
  2026-11-01 run has 9 failures in TransactionsScreen and RouteRenderSmoke.
- Latest complete project gate results remain in the P25-E ledger entry.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).
- Next release phase: Phase 24 reminders and notifications (CR-1); later accessibility,
  performance, cleanup and release work remain in their planned phases.

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
