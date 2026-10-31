<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-10-31 | Updates: owner and AI agents -->

# Open items

## Unresolved

- **CR-1:** reminders/notifications, permission behavior and tests remain held
  for Phase 24.
- **CR-3:** the full-width Save behavior with a visible validation summary is
  still open for `profile-form.tsx` and `transaction-form.tsx`.
- Latest audit: `npm audit --omit=dev` reports 27 advisories (6 high,
  20 moderate, 1 low) across the production dependency tree. `npm audit`
  reports 55 (6 high, 44 moderate, 5 low); the 28 additional advisories are
  dev-only build/test tooling. Exact affected package lists are in the P25-D
  entry in `docs/PROGRESS.md`. Owner direction is required; do not use
  `npm audit fix --force` or approve install scripts.
- Confirm the MIT copyright holder, currently written as
  `Sahil Aspak Sheikh` from the local account name.
- **Node compatibility choice:** the declared engine remains `>=24.3.0 <25`
  and `.nvmrc` remains 24.22.1. The owner reports running `npm install` and
  all 955 tests on Node v26.10.0 with only an `EBADENGINE` warning. Owner
  options: keep the Node 24 pin, test again on Node 24, or relax the engine
  range to `>=24.3.0`. No change without owner instruction.
- The owner reports v0.1.0 is a GitHub pre-release (`v0.1.0`), with EAS build
  and screenshots complete. The slug was confirmed by the owner and was not
  changed.

## Physical-device verification

- Owner-verified: the owner reports that everything works in a physical-device
  test. Device model and operating system were not recorded. This is owner
  report, not automated test evidence or an independently observed device run.
- Automated layout tests still simulate component props and font scales; do
  not present them as physical-device evidence.

## Documented assumptions and constraints

- AI guidance is maintained only in the root `AGENTS.md`; no tool-specific
  instruction or pointer files are intended.
- Fixed Emergency fund allocation items use the same form as custom items but
  retain their built-in title and metadata; fixed titles are read-only.
- The P20-V form omits the Percent option for non-monthly schedules because the
  frozen SegmentedControl has no disabled option API; validation rejects
  non-monthly percent items as well.
- Node 24.22.1 is selected from the Node 24 LTS line, meeting React Native
  0.86.3's `^24.3.0` engine requirement; see P25-C in the ledger.
- Previous phase-specific assumptions remain in the linked
  [progress ledger](../PROGRESS.md), not duplicated here.
