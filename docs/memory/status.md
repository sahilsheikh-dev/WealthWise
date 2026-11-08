<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: P25-B encrypted backups is complete. The research/decision
  commit and implementation close-out are recorded in [PROGRESS.md](../PROGRESS.md).
- Schema version: v13. No native module or persisted schema change was
  introduced.
- Test counts: 80 suites, 984 tests passed on Node 26.13.0 in the final
  coverage run.
- Coverage: `src/data/` 94.23% lines / 87.74% branches; `src/domain/` 98.32%
  lines / 93.05% branches; pure `src/lib/` 100% / 100%. The new
  `src/domain/backupCrypto.ts` has 100% line and branch coverage.
- KDF: scrypt `N=2^16, r=8, p=1` took 247.4 ms on the Node 26.13.0 development
  machine. Real-phone timing remains unverified.
- All six final gates pass: coverage tests, TypeScript, Expo lint, Expo Doctor
  21/21, Android export and iOS export. Exact exit codes are in the ledger.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
