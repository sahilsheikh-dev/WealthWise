<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Open items

## Unresolved

- **P29-F2 branch headroom:** fresh Jest run passes 84 suites and 1024 tests.
  Headroom is still short: `src/domain/budget.ts` 760/841 branches (90.37%, target
  92%); `src/data/createAppStore.ts` 86/99 branches (86.87%, target 88%).
  P29-B through P29-E remain in progress; P29-F2 source behavior is unchanged.

- **Spreadsheet backup scope:** supplied monthly income and expense items,
  historical loan payments, and the provided emergency-fund activity are
  represented in the local schema-v13 backup. Non-earned inflows remain
  separate from earned income; unmatched source movements and expense
  differences are labeled rather than inferred. Monthly cash-flow totals were
  rebalanced with month-end withdrawals/extra expenses and verified against
  the trackers. Emergency-fund records are mapped to linked holdings and
  transactions, but arbitrary workbook comments and every source-level tracker
  detail have no dedicated schema fields. The local backup is a supported
  snapshot, not a complete workbook migration. Do not retain the user's
  financial values in repository memory.
- **Local app/backup mismatch:** the note-edited backup has a valid recalculated
  checksum and imports, but it does not contain the separate transaction
  deletion/addition described for current app data. Historical custom budget
  snapshots were added through October 2026 using the transactions in this
  backup, including distinct planned/actual historical income rows for
  non-earned inflows; those snapshots do not resolve the missing app
  transaction edit. Export a fresh backup from the app if that edit should be
  included.
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

- **P29-B through P29-E:** verify the Today control, centered Dropdown and paid/scope dialogs, font scales 1.3 and 2.0, keyboard-safe dialogs, Start month/holding-link routes, and real Home Insurance placement on iOS and Android.

- **P29-A:** verify investment XIRR/CAGR labels, absolute-only short spans,
  linked full-value saved totals, shared-goal notes and Emergency Fund bucket
  targets on iOS and Android devices. Automated Jest and exports do not prove
  native rendering.

- **P24-A:** verify local-notification delivery and timing, permission and
  blocked-settings flows, reboot restoration behavior, lock-screen text,
  cold-start and app-locked notification taps, and large-font rendering at
  scales 1.3 and 2.0. Automated layout and Expo exports are not device proof.
- **P25-B:** verify key-derivation time on a real phone, the native share
  sheet, file picker, and large-font rendering at scales 1.3 and 2.0. The
  current 247.4 ms KDF benchmark is from the development machine only.
- Owner-verified: the owner reports that everything works in a physical-device
  test. Device model and operating system were not recorded. This is owner
  report, not automated test evidence or an independently observed device run.
- Automated layout tests still simulate component props and font scales; do
  not present them as physical-device evidence.
- P25-F did not repeat physical-device checks. Its screen-reader label and
  month-routing assertions run in TestRenderer and do not establish native
  announcements or rendering behavior.

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
- **P25-B platform constraint:** Expo SDK 57's cross-platform share sheet and
  picked-file reading use temporary cache files. The explicit plain-export
  option therefore briefly writes plaintext to cache, and plain picked files
  are copied there for reading, then removed. Encrypted export cache files
  contain ciphertext only; decrypted encrypted payloads remain in memory.
  Satisfying the literal no-plaintext-temp rule for the plain paths would
  require a different platform-specific file destination design.
- Previous phase-specific assumptions remain in the linked
  [progress ledger](../PROGRESS.md), not duplicated here.
