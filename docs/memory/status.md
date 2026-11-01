<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: encrypted backups without a schema change or native build
  change (P25-B).
- Current task state: preflight and research are complete and DEC-P25B is
  recorded in [PROGRESS.md](../PROGRESS.md). The selected portable-JavaScript
  path is Noble AES-256-GCM and asynchronous scrypt, with Expo SDK 57 secure
  random bytes at the app boundary. Implementation, installation, tests and
  gates have not started.
- Schema version: v13 (`src/domain/schemas.ts`).
- Test counts: 79 suites, 958 tests passed on Node 26.13.0 in the P25-F final
  coverage run.
- Coverage for `src/domain/`, `src/data/` and pure `src/lib/` is above the
  documented floors; see P25-F in the ledger for the exact percentages.
- P25-B research benchmark: scrypt `N=2^16, r=8, p=1` took 247.4 ms on Node
  26.13.0; the owner still needs to measure key-derivation time on a real
  phone after implementation.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).
- Next release phase: Phase 24 reminders and notifications (CR-1); later accessibility,
  performance, cleanup and release work remain in their planned phases.

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
