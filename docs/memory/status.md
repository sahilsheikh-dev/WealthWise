<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: fix and validate Transactions available/closing-balance
  visibility, and validate the user's note-edited local backup.
- Current task state: the selected-month balance amount now appears for zero
  and negative balances even when the brought-forward balance is zero. The
  local backup checksum was recalculated after note edits and the file passed
  importer validation. The backup does not contain the separately described
  app transaction deletion/addition.
- Verification: focused zero/negative balance tests and backup import passed.
  TypeScript, lint, Expo Doctor (21/21), and Android/iOS exports passed. Full
  coverage exited 1: 77/79 suites pass and 9 tests fail in the existing
  `TransactionsScreen.test.tsx` and `RouteRenderSmoke.test.tsx` cases. The
  overspend warning compares only the selected month's flows and rounds paise
  to whole rupees; the balance includes the carried-forward amount. Details
  and exact gate results are recorded in the 2026-11-01 ledger entries.
- The prior full coverage run had unrelated TransactionsScreen and
  RouteRenderSmoke failures; see the ledger.
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
