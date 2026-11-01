<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Open items

## Unresolved

- **Spreadsheet backup scope:** the current schema has no faithful representation
  for the supplied historical income/expense, emergency-fund passbook and
  repayment tracker detail, or source comments. These records were not
  converted into transactions where that would misclassify mixed flows or imply
  realized activity. The local backup is a supported snapshot, not a complete
  workbook migration. Do not retain the user's financial values in repository
  memory.
- **Backup edit follow-up:** the restored file at the expected path is the
  previous valid snapshot and does not contain the revised records shown in the
  owner's latest message. Do not patch its checksum or synthesize missing
  records; regenerate only after the complete revised JSON is available.
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
- **Node 24 Jest issue:** on Node 24.22.2, after clearing Jest cache, 13 suites
  fail because `expo-modules-core` reads `ReactNativePlatform.select` while
  `react-native` is mocked without a `Platform` export in affected test files.
  The full suite passes on Node 26.13.0. React Native 0.86.3's declared engine
  supports Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; therefore the
  test difference does not prove that the SDK itself rejects Node 24.
  Project Node is pinned to 26.13.0 and the allowed engine is `>=26.0.0 <27`
  based on the observed test results. Node 24/Jest mock behavior remains
  unresolved and can be revisited if test mocks are corrected in a future
  authorized task.
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
- **Assumed:** use stable Node 26.13.0 because the full suite passed on it and
  the clean-cache full run failed on Node 24.22.2. Expo SDK 57 uses React
  Native 0.86; see SDK and RN engine evidence in P25-E of the ledger. Node
  26.13.0 is a stable release, not a pre-release.
- Previous phase-specific assumptions remain in the linked
  [progress ledger](../PROGRESS.md), not duplicated here.
