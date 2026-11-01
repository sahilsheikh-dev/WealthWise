<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Status

- Current task: P24-A CR-1 local reminders is complete. DEC-P24A and both the
  research commit `372476c6c6185e926de57ead1d52bb0bdc57974a` and implementation
  commit `f5a1a38...` are recorded in [PROGRESS.md](../PROGRESS.md) and
  verified as commit objects; the abbreviated implementation hash must be
  expanded by `git cat-file`.
- Schema version: v14. P29-E adds optional `holdingId` links to Budget items
  with migration support. v15 and newer data is refused.
- Current task: P29-A investment returns, emergency-fund buckets and full-value
  linked goals is implemented and under final verification.
- Test counts: 84 suites, 1013 tests passed on Node 26.13.0 in the 2026-11-02
  P29-A coverage run.
- Coverage: `src/data/` 94.23% lines / 87.74% branches; `src/domain/` 98.32%
  lines / 93.05% branches; pure `src/lib/` 100% / 100%. The new
  `src/domain/backupCrypto.ts` has 100% line and branch coverage.
- KDF: scrypt `N=2^16, r=8, p=1` took 247.4 ms on the Node 26.13.0 development
  machine. Real-phone timing remains unverified.
- P29-A final gates pass in order: coverage exit 0, TypeScript exit 0, Expo lint
  exit 0, Expo Doctor 21/21 exit 0, Android export exit 0 and iOS export exit 0.
- P29-A coverage is computed by summing covered/total lines and branches per
  directory: `src/data/` 95.34%/90.91%, `src/domain/` 99.04%/95.23%, pure
  `src/lib/` 100%/100%.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- Open release items: source-workbook records that do not map faithfully to
  the current app schema are not imported; see [open-items.md](open-items.md).

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
