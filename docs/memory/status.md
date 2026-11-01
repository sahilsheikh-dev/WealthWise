<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: create flexible historical budget snapshots from transaction
  logs through October 2026.
- Current task state: the local schema-v13 backup contains 52 custom,
  month-specific budgets from July 2022 through October 2026. Category-level
  planned expenses and investments match transaction actuals. The transaction
  records, legacy budget and null repeating plan were preserved; no future
  recurring budget was added.
- Verification: focused 52-month budget matching and schema-v13 import passed;
  the backup checksum is valid. The local backup remains ignored and was not
  committed. Prior Transactions balance fix and its full gate results remain
  recorded in the 2026-11-01 ledger entries.
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
