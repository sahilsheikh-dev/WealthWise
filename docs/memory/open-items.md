<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-09 | Updates: owner and AI agents -->

# Open items

## Recently resolved

- **Owner roadmap decisions (2026-11-09):** accessibility is the planned
  statement and audit checklist, not new app features. Use Device Hub.app for
  screenshots, not Android tooling; capture synthetic demo data only, keep a
  one-off script outside the repository and delete it after use. The owner
  explicitly requests version-specific feature screenshots in README,
  release Markdown and GitHub Release bodies, attached to each release,
  including v1.0.0 and v1.1.0.
  Widgets, quick capture (shake, double-tap back or key combination) and
  notification/SMS detection are Held for later. Notes includes text, voice/
  audio recordings, photos and videos. Skeleton loading is planned in Phase
  38. See [PROGRESS.md](../PROGRESS.md) for the recorded acceptance scope.
- **Release screenshots and owner handoff:** the owner supplied 23
  version-specific screenshots (7 for v1.0.0, 8 for v1.1.0 and 8 for
  v1.1.1). They are in versioned repository paths and attached to their
  corresponding GitHub releases. README shows only the latest set; historical
  sets remain in their matching notes. The release process requires note
  approval, moving the finalized note to `published/`, PR integration, then
  creation of a GitHub Release draft. The owner builds/uploads the APK and
  confirms before artifact verification and separate publication approval.
- **Owner-edit handling:** P20-S-R1-R1 records R5 in root
  [AGENTS.md](../../AGENTS.md): ask before changing a file with owner edits
  made after agent changes, and revert or overwrite those edits only when
  explicitly requested. Task PR #44 is merged; phase PR #45 promotes the
  revision to `develop`. See [PROGRESS.md](../PROGRESS.md).
- **Release 2 device checks N39-N43:** the owner reported all five checks Pass
  on 2026-11-08. The device checklist records Pass for income recurrence and
  backup restore, immediate edit refresh, aggregate Pace, linked paid sync and
  Undo, and Entries counts/schedule caps. Device model, Android version and
  tester remain blank as requested.
- **P20-A-R2 device check N44:** the owner reported Pass on 2026-11-09 for
  marking a linked one-time savings item Paid from Transactions, verifying
  that a holding entry is created, and confirming Undo removes it. The
  checklist records Pass; device identity fields remain blank.
- **P28-F-R1 GitHub sync:** owner-reported N39-N43 results are included in
  merged PRs #1-#3. Phase 28 was integrated into develop, the release branch
  into main, and main back into develop. The merged PRs and remote tips are
  recorded in [PROGRESS.md](../PROGRESS.md).
- **P28-F-R2 contributor correction:** the v1.1.0 draft matches the linked
  contributor credits in v1.0.0, and the template requires release-specific,
  verified contributors. This correction is included in PRs #1-#3.
- **P28-F-R3 v1.1.0 publication:** the owner-approved release is published
  with its versioned latest APK asset. The tag points to the
  verified EAS source commit; the uploaded artifact matched the EAS build,
  and latest/versioned links returned HTTP 200 at 112,147,677 bytes. The
  owner-approved `preview` profile and reused versionCode 1 exceptions are
  recorded in the release history. PRs #11-#15 merged task -> Phase 28 ->
  develop -> release -> main -> develop; all four remote trees match and the
  v1.1.0 tag remains unchanged.
- **P28-F-R3-R2 historical asset rollover:** v1.0.0 now downloads from its
  own versioned APK filename and URL; the generic old URL returns 404. Its
  GitHub release body matches the checksum-free published note. Latest and
  affected versioned URLs return HTTP 200 with the expected sizes.
- **P28-F-R3-R3 latest APK filename:** v1.1.0 now uses
  `WealthWise-android-latest-v1.1.0.apk`; the README, published note, release
  history and GitHub release body match. Latest and versioned v1.1.0 routes
  return HTTP 200 at 112,147,677 bytes. The old v1.0.0 filename has no
  `latest` marker and returns HTTP 200 at 112,133,413 bytes. PRs #21-#25
  merged task -> Phase 28 -> develop -> release -> main -> develop. The four
  remote trees match; the v1.1.0 tag was not changed.
- **P28-F-R2-R1 audit correction:** task PR #4 merged into Phase 28 and PR #5
  merged Phase 28 into develop; PR #6 carries the release branch to main and
  PR #7 is the main-to-develop back-merge. The full sequence preserves
  task -> phase -> develop -> release -> main -> develop.
- **P29-O-R1 scope close-out:** P29-O is superseded by the accepted P29-O1
  holding workflow and the explicit P29-S cancellation of the separate
  ledger-only migration. No app implementation remains in scope; Phase 29 is
  41/41. The P29-O1 physical-device checks below remain open.
- **Local `codex-changes` branch:** deleted on 2026-11-08 at the owner's
  direction. Its sole commit (`d033d6a`) was an October schema-v2 alternative
  with checked-in coverage output and an unsafe migration; current schema-v22
  loan/liability behavior supersedes its source changes. Nothing was ported.
- **P29-O1-R2 / P29-W-R2 Entries layout:** completed/pending month counts now
  use paired summary cells on Assets and Liabilities; pending schedule rows
  are sorted together with dated entries. Focused route tests pass at font
  scales 1.0, 1.3 and 2.0. No schema change.
- **CM-1 commit-subject enforcement:** old subjects could be non-descriptive;
  the new hook requires supported Conventional Commit types and rejects
  placeholders. The reason is to keep scope explicit and unrelated changes
  separate; proposed subjects and staged diff-stats are shown before commit.
  The hook and docs tests pass.
- **P28-C-R4 release documentation:** completed; the README and latest
  published Download blocks match, public digest/commit identifiers are
  absent, and the task is integrated into `develop`. The authorized refs were
  pushed and verified. The release body remains intentionally unchanged.
- **P28-E remote history:** all 30 phase branches, `history/by-phase`, and 30
  annotated phase completion tags were pushed and verified. `main`, `develop`,
  and the v1.0.0 tag were also verified; v1.0.0 was not changed. No force push
  was used.
- **P28-E-R4 history graph integration:** task PR #49 merged into Phase 28
  (`7f9221a`), then Phase 28 PR #50 merged into `develop` (`b5dbe5f`). The
  `history/by-phase` tip and every remote branch tip are reachable from
  `develop`. `main` and `release/v1.1.0` remain at
  `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`, with tree
  `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. The task branch was deleted;
  Phase 28 is retained. Verification is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R5 historical main commit audit:** the 403 non-merge commits after
  the initial commit are already integrated into `main` and `develop`; 84
  legacy subjects fail the current Conventional Commit hook. Do not rewrite
  these original commits: a PR cannot change commit provenance or subjects
  retroactively. The owner-selected `release/v1.0.0` branch was created at
  the existing v1.0.0 tag target and is already an ancestor of `main` and
  `develop`. Task PR #52 merged into Phase 28 as `f9bb715`, and Phase 28 PR
  #53 merged into `develop` as `0402592`. P28-E-R5-R1 records this final
  integration; no application code or protected branch tip changes.
  Evidence is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R3 ancestry reconciliation:** owner-authorized `ours` merges record
  `f994457`, `7bea8e6` and `b779c21` as ancestry on the task branch without
  changing the captured `develop` tree. The accompanying changes are limited
  to ledger/memory documentation and a ledger test. At R3 completion, the
  archive was still separate; P28-E-R4 is connecting it. `main` and its
  v1.1.0 tag remain untouched. Task PR #47 merged into Phase 28 and PR #48
  promoted R3 to `develop`. Details are in [PROGRESS.md](../PROGRESS.md).
- **P28-F-R3 GitHub integration:** PR #11 merged the publication task into
  Phase 28 (`a2f9db2`), #12 promoted Phase 28 to develop (`3e2a5a8`), #13
  merged develop to `release/v1.1.0` (`d4d69fa`), #14 merged that release to
  main (`b0aeef9`), and #15 back-merged main into develop (`6f5df18`). The
  publication task branch was deleted; the phase branch remains at its
  recorded tip. Main, develop, release and Phase 28 have identical trees.

## Unresolved

- **P20-S-R1 device check:** physical-device rendering remains unverified.
  Owner approved commit/merge; SegmentedControl labels removed by the owner
  remain absent. Final gate results and PR integration are in
  [`PROGRESS.md`](../PROGRESS.md). Implementation commit `d36103e` is in
  task-to-phase PR #42; phase-to-develop PR #43.
- **Phase 32 screenshots:** supplied screenshots are embedded in README and
  versioned Markdown. The owner supplied 23 versioned screenshots, visually
  showing synthetic demo content. Their version-specific assets are attached
  to the corresponding v1.0.0, v1.1.0 and v1.1.1 GitHub releases. The
  v1.1.1 draft body currently references public v1.1.0 image assets so its
  screenshots render before publication; its own versioned assets are also
  attached. All galleries use 150-pixel thumbnails, with at most four
  screenshots per row. README contains only the latest set under the generic
  Screenshots heading; historical galleries remain in their release notes.
  Galleries follow the requested Home, Assets, Liabilities, Emergency Fund,
  Goals, Insurance, Budget, Transactions order, omitting unavailable screens.
  The v1.1.1 note contains all template sections, has owner approval and is
  moved to `published/`; required PR integration is in progress.
  The temporary capture script remains outside the repository and
  must be deleted after use; it must never be uploaded or included in an app
  build.
- **v1.1.1 release candidate:** the owner approved the patch-release Markdown
  draft on 2026-11-09. App, package and lockfile versions are aligned to 1.1.1.
  Task PR #56 and Phase 28 PR #57 are merged; `release/v1.1.1` is based on
  merged `develop`. The GitHub Release draft was created before the revised
  note-approval rule and remains at its original target. The owner approved
  the complete note, which is now in `published/`; the screenshot/document
  revision still needs task/phase/develop PR integration. APK build/upload,
  artifact verification and publication remain pending; N44 is
  owner-reported Pass, but the release APK has not been built or tested.
  Direct source-tree comparison confirms v1.1.0
  contains the P30 SQLite persistence repair; v1.0.0 predates that repair.
  Neither release should be described as bug-free, and user impact is not
  established by the available checks.
- **Branching baseline exception:** the initial `develop` baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d` was created from current main,
  which contains legacy unreleased Release 2 work. Branch protection and
  release-only main merges apply prospectively; no history rewrite was made.
- **Local-only branch audit:** the release-policy commits are integrated
  through PRs #21-#25; their merged task branch was deleted as required.
  Other local task branches whose commits are already in `main` remain local
  only because merged task branches are deleted by policy. P28-E's final
  verification commit `72fb325` is preserved and its stale status text is
  reconciled on the P28-E-R2 task branch for chronological PR integration.
  `codex-changes` is not safe to publish as-is: it is based on schema v2
  rather than current v22, includes generated coverage files, and review
  found a persisted-data migration bug, a failing migration assertion, and
  merge conflicts with current `main`. It remains local pending a decision
  to port any still-needed changes.
- **v1.1.0 release integrity:** the owner explicitly approved the `preview`
  profile and reused versionCode 1 for this release. For future releases,
  restore the configured `android-apk` profile and increment versionCode.
- **Stale phase tags (owner decision):** `phase-28-complete` and
  `phase-29-complete` target commits behind their current phase branch tips.
  No tag was moved. Decide whether to retain or update them in a separately
  authorized change.
- **P29-O1-R2 / P29-W-R2 integration:** task and phase merges are included in
  the v1.1.0 release on GitHub main and develop through the merged PR chain.
- **P29-O1-R2 / P29-W-R2 physical-device check:** verify paired count-cell
  layout and date ordering on Assets and Liabilities at font scales 1.3 and
  2.0 on devices. TestRenderer checks are simulated. The six ordered
  repository gates pass locally; integration is complete on `develop`.
- **Pre-build synthetic v13 equality:** automated coverage now imports a
  deterministic, checksummed v13 backup through `parseBackup` and compares
  source-derived net worth, every goal's saved amount and Emergency Fund
  available amount. Physical-device backup/restore checks remain part of the
  pre-build checklist in [`build-config.md`](../releases/build-config.md).
- **P26-A physical-device checks:** verify touch targets, scalable labels and
  text at 1.3x/2.0x, focus order, announced form errors, color-only status,
  screen-reader navigation, cold hydration, first render and action writes on
  iOS and Android. Jest/TestRenderer and Node benchmarks are not device
  evidence. `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` remain
  user-owned/report-only surfaces under the P26-A scope.
- **P29-AA Emergency Fund links resolved (2026-11-06):** repeated failing
  reproduction and store coverage confirmed valid links for Cash, Savings,
  Fixed deposits and recurring plans. Plan deletion now clears EF bucket and
  goal links in the same write; hydration repairs dangling links once and
  preserves valid links, net worth and goal values. No schema change.
- **Emergency Fund form font-scale and device check:** verify the resolved
  link picker and EF allocation form at 1.3x and 2.0x on physical devices.
- **P29-Z documentation verification (historical, superseded 2026-11-08):**
  source wins over docs; current schema v22 and the migration/archive chain
  through `.premigration.v21`, Foreclosure labels, Home-only menu rule and real
  Gate 1 counts are recorded. P29-Z made no behavior, schema or UI source
  change.
- **Home-only global menu physical-device check (2026-11-05):** verify the
  three-dot options menu remains present on Index/Home and absent on Assets,
  Liabilities and detail screens, including backup, reminders, security,
  profile and theme routes, at font scales 1.3 and 2.0.
- **Recurring asset stop/resume label physical-device check:** verify active
  recurring cards show Stop investment and stopped plans show Resume
  investment while the action remains within the shared instrument-card row.
- **Holding and liability layout physical-device check (2026-11-05):** verify
  the two-column investment Summary, same-row liability actions, conditional
  Entries button and liability Summary/details layout at font scales 1.3 and
  2.0 on iOS and Android. Automated route, ownership and focused font-scale
  tests pass, and all six gates exit 0.
- **Holding layout validation (2026-11-05):** the owner-edited holding screen
  passes the focused route smoke test at font scales 1.3 and 2.0. All six gates
  are green: 92 suites passed, with 1192 tests passed and 1 skipped.
- **Merged holding summary card physical-device check:** verify the Recurring
  plan and Summary information remain readable in one card and Stop/Resume stays
  in the action row at font scales 1.3 and 2.0 on iOS and Android.
- **P29-Y resolved (2026-11-05):** Gate 1 was repaired from `91` passing suites
  plus one stale `memoryDocs.test.ts` failure to `92` passed suites and `1191`
  passed tests with `1` skipped at that repair step. The final real run is
  `1192` passed tests with `1` skipped (1193 total). The project inventory, status memory and
  ledger now match the repaired run; all six gates pass.
- **P29-X physical-device checks:** verify stop/resume confirmation, inclusive
  stop-date filtering, stopped card text, past unpaid dues, Deposit
  availability and one-write Undo at font scales 1.3 and 2.0 on iOS and Android.
  Confirm the v20-to-v21 archive and restart behavior on native SQLite.
- **P29-X assumption:** `stopDate` is the last inclusive scheduled date. Resume
  removes the field; it restores schedule rows without rewriting entries or
  linked transactions.
- **P29-W physical-device checks:** verify closure-date selection and
  outstanding recalculation, overpayment/shortfall confirmations, one-write
  Undo, future-due removal, Closed filtering, read-only payment/schedule rows,
  note-only editing/deletion and font scales 1.3 and 2.0 on iOS and Android.
  Also verify the v19-to-v20 archive and restart behavior on native SQLite.
  Jest and Expo exports do not verify native interaction, persistence or
  layout.

- **P29-V physical-device checks:** confirm AsyncStorage migration compares
  exact bytes before removal, failure fallback survives restart, and all four
  stress tiers load/Undo on iOS and Android. Time native SQLite capacity,
  hydration, actions, selectors, memory and first render. Confirm the 50-year
  backup exports/imports plain and encrypted, and larger tiers refuse before
  creating a temporary file. Node measurements and Expo exports do not prove
  device behavior.

- **P29-O2 cancelled by owner (P29-S, 2026-11-05):** do not implement the
  ledger-only schema-v19 storage redesign. Its converter, alternate v19
  schemas/types and prototype tests had no production callers and have been
  removed. The cancelled storage design does not affect the current schema
  v22; P29-O1's unified holding actions remain supported. Historical
  preparation commits are retained; see
  DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE in [PROGRESS.md](../PROGRESS.md).
- **P29-O1 physical-device checks:** verify manual and recurring holding
  cards, Entries, opening amount edits and Recurring plan details at font
  scales 1.3 and 2.0 on iOS and Android. Confirm the manual and recurring
  10,000 + five 1,000 deposits - 2,000 withdrawal case shows Invested 13,000
  and seven rows. Fixed-deposit maturity withdrawal remains unchanged. Jest
  and Expo exports do not prove native layout or interaction.
  Automated validation is complete: 90 suites/1140 tests, TypeScript, lint,
  Expo Doctor 21/21, and Android/iOS exports all pass. Coverage and assertion
  counts are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-T physical-device checks:** verify that adding, editing and deleting
  dated deposits and withdrawals on or before a valuation updates manual and
  plan values once, in the same write; verify Undo restores the entry and
  linked transaction. Confirm goal, Emergency Fund, net-worth and Budget-linked
  flows at font scales 1.3 and 2.0 on iOS and Android. Jest and Expo exports
  do not verify native persistence, rendering or interaction. Budget's current
  linked-actual selector is transaction-based, not a current-holding-value
  display; that display was not redesigned.
- **P29-U physical-device checks:** verify configured accrual and units-price
  values, manual confirmation, staleness notices, and the optional monthly
  reminder at font scales 1.3 and 2.0 on iOS and Android. Confirm v18-to-v19
  migration, a confirmed-value reset, and entry-price/withdrawal interactions
  on device. Node tests and Expo exports do not prove native layout,
  persistence or notification scheduling. Automated validation passes:
  91 suites/1170 tests and all six ordered gates exit 0; directory coverage
  and the exact calculation method are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-U model constraint:** recurring plans already require `ratePct` in
  the v18 model and use it for the plan projection. That existing required
  field is preserved; valuation metadata remains optional. Manual holdings
  may omit `ratePct` unless accrual is explicitly selected.
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

## Recent completed validation

- **Commit-subject enforcement (2026-11-08):** superseded the former
  unenforced placeholder-subject practice because it obscured the scope of
  changes and encouraged unrelated edits to be grouped together. The
  repository hook now requires descriptive Conventional Commit subjects;
  enable it with `git config core.hooksPath .githooks`. Full ordered gates are
  recorded as Gate 1-4 exit 0; Gate 1 had 93 suites, 1,205 passed and 1
  skipped. Both Expo export gates were intentionally skipped because the task
  forbids builds.
- **P29-R:** the external schema-v13 backup migrated through the production
  import path to v18 with no differences in the requested before/after
  summaries. The script prints only numbered holdings/goals, types, and
  calculated values; the backup and personal text remain outside Git. Reminder
  preferences are not in the backup, so the recorded preview uses enabled
  day-before and same-day reminders at 09:00 with amounts hidden. Details are
  in [PROGRESS.md](../PROGRESS.md). All six ordered gates were run: TypeScript,
  lint, Doctor and both platform exports pass; 92 suites/1148 tests pass, but
  coverage exits 1 because the unchanged `src/domain/schemas.ts` branch
  coverage is 89.41%, below its configured 90% threshold. No assertion was
  weakened.

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

## Resolved

- **Historical checkpoint commit message audit (2026-11-07):** reviewed all
  five matching commits on `origin/main` and recorded proposed descriptive
  subjects in [PROGRESS.md](../PROGRESS.md). Their remote messages remain
  unchanged because repository policy prohibits rewriting/pushing shared
  history.
- **v1.0.0 release commit messages (2026-11-07):** replaced generic checkpoint
  messages with descriptions of release-draft preparation and publication
  documentation. The changes are local and unpushed; see the verified
  old-to-new commit mapping in [PROGRESS.md](../PROGRESS.md).
