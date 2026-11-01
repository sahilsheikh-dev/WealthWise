<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: complete historical Budget income and reconcile planned and
  actual amounts to all transaction categories through October 2026.
- Current task state: the local schema-v13 backup contains 52 custom,
  month-specific budgets from July 2022 through October 2026. Earned and
  non-earned income rows are represented separately; planned and actual
  income, expenses and investments match by month/category. All 716
  transactions and their explicit source links were preserved.
- Verification: focused budget/schema/backup and Budget route tests passed;
  TypeScript, Expo lint, Expo Doctor (21/21), and Android/iOS exports pass.
  The local backup checksum and schema-v13 import are valid. Full coverage
  exits 1: 77 suites passed, 2 failed; 949 tests passed, 9 failed (958 total).
  Failures are Transactions available-balance theme/action expectations and a
  RouteRenderSmoke large-amount accessibility expectation; no historical
  Budget assertions failed. See the CR-95 ledger entry.
- Schema version: v13 (`src/domain/schemas.ts`).
- Test counts: latest full coverage run has 79 suites and 958 tests; the last
  fully passing run had 79 suites and 955 tests.
- Latest complete project gate results remain in the P25-E ledger entry.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).
- Next release phase: Phase 24 reminders and notifications (CR-1); later accessibility,
  performance, cleanup and release work remain in their planned phases.

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
