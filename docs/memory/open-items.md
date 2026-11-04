<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-04 | Updates: owner and AI agents -->

# Open items

## Unresolved

- **P29-O2 in progress:** complete the staged v19 unified-holding migration,
  convert all domain/store/screen/mock consumers, preserve current values and
  net worth for demo/mock/legacy fixtures, and add migration/archive/backup/
  encryption/erase-all coverage. The temporary adapter foundation is not yet a
  persisted-schema change. See DEC-P29O2-UNIFIED-LEDGER in [PROGRESS.md](../PROGRESS.md).
- **P29-O1 physical-device checks:** verify manual and recurring holding
  cards, Entries, opening amount edits and Recurring plan details at font
  scales 1.3 and 2.0 on iOS and Android. Confirm the manual and recurring
  10,000 + five 1,000 deposits - 2,000 withdrawal case shows Invested 13,000
  and seven rows. Fixed-deposit maturity withdrawal remains unchanged. Jest
  and Expo exports do not prove native layout or interaction.
  Automated validation is complete: 90 suites/1140 tests, TypeScript, lint,
  Expo Doctor 21/21, and Android/iOS exports all pass. Coverage and assertion
  counts are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-L complete:** the Insurance dependency inventory, simplification and
  v16-to-v17 migration are recorded in [PROGRESS.md](../PROGRESS.md). The
  former P29-G cover-goal feature is removed; Home remains unchanged. Its
  physical-device checks below remain unverified.
- **P29-J bank-balance comparison:** no calculation bug was proven. The owner
  did not provide the bank outstanding/as-of date, principal, contractual
  tenure, or app payment date/amount records. The actual statement-method
  comparison and any monthly-amortization change remain pending those inputs
  and owner approval; current behavior remains actual-days/365.
- **P29-F2 headroom targets withdrawn:** the 92% `src/domain/budget.ts` and 88%
  `src/data/createAppStore.ts` targets were advisory and are no longer requirements.
  Configured per-file thresholds are authoritative and green.
- **DEC-P29E-HOLDING-DELETE (owner decision, 2026-11-02):** the requirement for
  Undo after deleting a linked holding is withdrawn. Deletion has never offered
  Undo, and adding it is out of scope. The retained requirement is that all
  Budget item links to the deleted holding are cleared in the same persisted
  write; the acceptance test passes. P29-B through P29-L, P29-N and P29-M2
  are Done; P29-M is superseded by P29-M2.

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

- **P29-Q:** verify migration from existing AsyncStorage to SQLite, a full
  200-year and daily-SIP fixture load, Undo, cold hydration, write latency,
  selector responsiveness and available device storage on iOS and Android.
  The SQLite adapter and loader are implemented; Node SQLite-memory timings
  are not native bridge, disk, device-memory or physical-render measurements.
  The 50-year serialized AppData value remains above the 1.5 MB target. The
  installed SQLite adapter has no app-level per-value guard, but physical
  device capacity remains unverified.
  Details and import limits are in [PROGRESS.md](../PROGRESS.md).
- **P29-N:** verify the first-launch prompt after unlock, Not now/Close/
  backdrop/Android-back persistence, granted/denied/blocked permission flows,
  Reminders menu reachability and 1.3/2.0 font-scale layout on iOS and Android.
  Also verify Transactions has no Review-month affordance while its month
  navigation and Budget's routed month/editor flows still work. Automated
  TestRenderer and Expo exports do not verify native dialogs, layout or
  notification permission behavior.
- **P29-K:** verify immediate-once scope application and native Close,
  backdrop, and Android-back dismissal, including the 44 pt Close target,
  category-delete count and Undo, and option wrapping at font scales 1.3 and
  2.0 on iOS and Android. Jest simulates these interactions and layout; native
  hit testing, screen-reader announcements and rendering remain unverified.
- **P29-I:** verify that Fixed deposits expose no new deposit, entry, recurring
  schedule, or Budget-link controls; legacy entries remain viewable/editable/
  deletable; maturity withdrawal works; and recurring deposits remain fully
  available at font scales 1.3 and 2.0 on iOS and Android. The tests and Expo
  exports are simulated/build evidence, not physical-device verification.
- **P29-H:** verify asset list/card/portfolio totals and Investment Entries on
  iOS and Android, including Cash/Bank labels, the back-dated-entry helper,
  large amounts, and font scales 1.3 and 2.0. Automated TestRenderer cases and
  Expo exports are not physical-device evidence.
- **P29-B through P29-E:** verify the Today control and filter retention,
  centered Dropdown, paid/scope dialogs at each entry point, font scales 1.3
  and 2.0, keyboard-safe dialogs, start-month/holding-link routes, and actual
  Home Insurance placement on iOS and Android. Holding-delete Undo is not a
  requirement under DEC-P29E-HOLDING-DELETE.

- **P29-A:** verify investment XIRR/CAGR labels, absolute-only short spans,
  linked full-value saved totals, shared-goal notes and Emergency Fund bucket
  targets on iOS and Android devices. Automated Jest and exports do not prove
  native rendering.

- **P29-L:** verify Term/Life placeholders, full policy editing and deletion
  confirmation/Undo, all premium frequencies including custom month-end
  clamping, pending/overdue dues, payment advancement, reminder behavior and
  large-font layout at scales 1.3 and 2.0 on iOS and Android. Home's
  `policySummary` source and screen remain unchanged. Jest and Expo exports
  simulate or build the app; they do not verify native presentation.
- **P29-M2:** verify early/on-time/late payment from the Insurance card, Home,
  Transactions, `/payment-confirm` and reminder action on iOS and Android;
  confirm the settled slot disappears everywhere, next dues appear in
  Insurance/Transactions/Budget/Home/reminders, and Undo restores all state.
  Also verify month-boundary timing, custom frequency, edited schedules,
  notification action behavior and font scaling. Jest validates the real
  store and selectors; it does not prove native notifications, dialogs or
  physical-device interaction.

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

- **Assumed for P29-H:** if a holding has no valuation date, its stored `value`
  is not treated as a recorded valuation; current value is based on opening
  capital and posted entries, with no estimated interest. Manual holdings have
  no start-date field, so their opening cash flow uses the injected as-of date.
- P29-H did not change schema v15; P29-I advanced it to v16, P29-L to v17 and
  P29-M2 to v18. Home remained unmodified throughout these steps.
- **Assumed for P29-I:** the current manual holding model and form do not
  contain rate or maturity fields. No new fields were introduced; Fixed
  deposits use their opening amount, recorded valuation and withdrawal for
  maturity payout.
- **Assumed for P29-Q:** Expo SQLite's installed `SQLiteStorage` key-value
  adapter accepts each measured state value because it contains no
  app-level per-value cap; native SQLite/device storage limits and capacity
  remain subject to device verification.
- AI guidance is maintained only in the root `AGENTS.md`; no tool-specific
  instruction or pointer files are intended.
- Fixed Emergency fund allocation items use the same form as custom items but
  retain their built-in title and metadata; fixed titles are read-only.
- **Assumed for P29-L:** the Life placeholder maps to `life-savings`; Term maps
  to `term-life`. Typed premium categories remain derived from policy kind;
  savings-policy premiums use the existing generic Insurance category. The
  Budget Insurance system section and its categories remain fixed and out of
  scope; making them editable needs a separate product decision.
- P29-L preserves `nominee`, `status`, `premiumYears`, `trackFrom`, `endDate`,
  savings-policy `currentValue`/`valueAsOf`, and savings-policy goal links.
  `status` still marks Ended records and suppresses dues; `trackFrom` is the
  user-editable next-due date; `endDate` still caps legacy schedules;
  `currentValue` and goal links remain used by savings-policy goal calculations.
  `nominee` and `premiumYears` remain intact for data compatibility although
  the simplified tracker no longer edits them or uses `premiumYears` to
  schedule dues.
- **Assumed for P29-M2:** “no Paid button” means the settled slot is no longer
  actionable; the Insurance card's existing generic Paid action remains
  available for the next unpaid slot so early payment through that entry point
  remains possible. Hiding that action conflicts with the required early
  Insurance-card payment flow.
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
