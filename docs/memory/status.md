<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-10-31 | Updates: owner and AI agents -->

# Status

- Current task: Phase 25 part D (P25-D), release sync.
- Current task state: Complete. v0.1.0 is a GitHub pre-release (tag `v0.1.0`);
  the owner reports the EAS build, screenshots and physical-device testing are
  complete and working. Device model and OS were not recorded; this is
  owner-verified, not automated evidence.
- Last implementation/test commit at final verification:
  `ee1a23c156c7d08163cddd44a0f2e3061fb9aa6c`
  (`fix: type Home card test lookup`); verify later documentation commits with
  `git log`.
- Schema version: v13 (`src/domain/schemas.ts`).
- Test counts: 79 suites, 955 tests passed in the latest required coverage run;
  date and current gate results are recorded in the P25-D ledger entry.
- Open release items: latest `npm audit --omit=dev` reports 27 advisories and
  `npm audit` reports 55; counts and affected packages are recorded in the
  P25-D ledger entry. The Node 24 pin remains unchanged despite the owner's
  Node v26.10.0 install/test run with an `EBADENGINE` warning.
- Next release phase: Phase 24 reminders and notifications (CR-1); later accessibility,
  performance, cleanup and release work remain in their planned phases.

The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth for
step verdicts, coverage, device checks and release records. Simulated UI tests
do not establish actual iOS or Android behavior.
