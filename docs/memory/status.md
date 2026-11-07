<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-07 | Updates: owner and AI agents -->

# Status
- Audited all five remaining `chore: user manual changes (checkpoint)` commits
  reachable from `origin/main` and identified patch-based subject
  recommendations. No shared commit history was rewritten or pushed; details
  are in [PROGRESS.md](../PROGRESS.md).
- Corrected the messages on the two local v1.0.0 release documentation
  commits; the release-folder follow-up was replayed unchanged in content.
  New commit IDs and verification are recorded in [PROGRESS.md](../PROGRESS.md).
  No history was pushed.
- Release-management documentation is present under `docs/releases/`:
  reusable workflow prompt, configuration, release history and
  `published/v1.0.0.md` record.
  The v1.0.0 GitHub Release was published on 2026-11-07 at
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`; its remote tag and release URL
  are verified. The process requires verified changes and explicit
  publication approval. The release README now gives separate prompts for
  preparing an unpublished draft and publishing only after approval.
  See the release publication entry in [PROGRESS.md](../PROGRESS.md).
- P28-B first-release metadata is aligned to version 1.0.0. All six ordered
  gates pass: 91 suites, 1193 tests passed and 1 skipped; TypeScript, lint,
  Expo Doctor 21/21 and Android/iOS exports pass. Lint reports one
  array-style warning. The GitHub Release and remote `v1.0.0` tag are
  published and verified; the EAS production build has not been run.
- Schema version: v22 (`SCHEMA_VERSION` in `src/domain/schemas.ts`).
- P29-AB is complete. Budget income recurrence supports monthly, quarterly,
  half-yearly and yearly frequencies, with a required first-due month for
  non-monthly items. Migration v21-to-v22 defaults existing income monthly
  and the strict backup schema accepts the additive fields. The owner changes
  remain preserved: Insurance card and Transactions available-balance have no
  restored bottom border/divider. Recurring investment actions are
  "Stop investment" and "Resume investment".
  Real Gate 1: 91 suites passed, 1193 tests passed, 1 skipped. Coverage:
  all files 95.90% statements, 91.89% branches, 97.75% functions, 97.57%
  lines; `src/data` 90.63/86.95/93.07/93.92; `src/domain`
  96.96/92.82/98.79/98.31. Gates 2-6 passed: TypeScript, lint (one warning),
  Expo Doctor 21/21, and Android/iOS exports. Final implementation commits:
  `df7c109`, `6515c57`, `38a823d`.

- P28-A release preparation is complete through the report, metadata update,
  and release checklist. Report commit `fbdcbac` records source-backed release
  readiness, permissions, storage, audit and migration evidence. Owner-confirmed
  release `0.2.0` is aligned in `app.json`, `package.json` and the lockfile
  root. Metadata commit `41c4617` updates the changelog and README audit/license
  claims. The single all-platform production build and tag commands remain
  documented in `docs/RELEASE-CHECKLIST.md` and have not been run. Home and
  Budget remain protected and unchanged.

- P27-A cleanup is complete. Report-only commit `b805fb1`; implementation
  commits are `a8a2d78` (dead code), `61714ec` (dependencies), and
  `dd0c930` (robust schedule benchmark). Final Gate 1 has 91 suites and 1192
  tests (1191 passed, 1 skipped). All six gates passed after each cleanup
  implementation commit. Coverage remains above thresholds:
  `src/data` 749/798 lines/780/896 branches; `src/domain`
  3549/3609/3480/3747; `src/lib` 107/107 and 126/126. Protected Home and Budget
  files remain unchanged. Full inventory: [P27-A-report.md](../P27-A-report.md).
- P26-A accessibility/performance audit and fixes are complete. The report
  was committed first as `cfbe023`; implementation and regressions are in
  `d4071a5`, `f59b01a`, and `08b3992`. Home and Budget source files remain
  protected and unedited. The bottom-tab fitting assertions were superseded
  by wrapping/scaling assertions. Final Gate 1 passed 93 suites with 1199
  passed tests, 1 skipped and 1200 total; all six gates exit 0. Fresh
  coverage is `src/data` 749/798 lines (93.86%), 780/896 branches (87.05%);
  `src/domain` 3549/3609 (98.34%), 3480/3747 (92.87%); `src/lib` 107/107
  lines and 126/126 branches (100%). Full P26-A evidence is in
  [PROGRESS.md](../PROGRESS.md).
- Current task: owner recurring-stop, foreclosure, and Home-only menu refinements complete.
  P29-Y Gate 1 repair complete; P29-X stop/resume implementation
  remains the latest product change.
  The recurring plan details and financial Summary now share one card on the
  investment entries screen; Stop/Resume is in the holding action row above the
  card. The owner's current edit has no Entries or Edit recurring plan control
  on the holding screen; removed screen data is not to be restored.
  Schema v21 stores one optional `stopDate`; plan schedules, pending items,
  Budget linked rows, reminders and goal projections share the inclusive cutoff.
  Stop/resume is one store write with Undo and does not change entries, value,
  returns or links.
  Verification: the real `npm test -- --coverage` run passed 92 suites with
  1194 passed tests, 1 skipped and 1195 total. The six-gate sequence is
  recorded in [PROGRESS.md](../PROGRESS.md).
  P29-AA repairs Emergency Fund link integrity without schema change. It
  clears a deleted plan's bucket and EF goal links in the same store write,
  and repairs valid and dangling linked holdings once during hydration while
  preserving full-value net-worth and goal behavior.
  P29-W implements early foreclosure for recurring liabilities.
  The report-only inventory was committed first. Schema v20 adds optional
  closure metadata; close, payment, optional charge and zero-balance settlement
  are one domain action/store write with one-step Undo. Closed loans are
  filterable, future dues disappear from shared projections, and only the
  closure note remains editable.
  P29-U's optional valuation metadata remains on schema v19; P29-W adds
  optional foreclosure metadata in schema v20. P29-T's atomic
  dated-entry adjustments remain in
  [PROGRESS.md](../PROGRESS.md). P29-R's separate
  schema-v13 backup dry-run remains complete.
  P29-O1 used the existing v18 holding model;
  manual and recurring holdings share Deposit, Withdraw and Entries actions,
  with a derived Opening row and an in-holding Recurring plan section.
  Displayed Invested is net of withdrawals and floored at zero; fixed-deposit
  restrictions and P29-H return/current-value logic remain unchanged. The
  P29-U's compatibility table and six ordered gates are recorded in
  [PROGRESS.md](../PROGRESS.md); physical-device checks remain open in
  [open-items.md](open-items.md).
  P29-Q is implemented after the owner approved Expo SQLite.
  Native Zustand AppData uses the SDK-57 SQLite key-value adapter with lazy
  migration from AsyncStorage; web and UI metadata remain on AsyncStorage.
  The full-fixture dev loader uses replace/Undo and reports save/replace and
  first-render time. Five-sample Node benchmarks and remaining device checks
  are in [PROGRESS.md](../PROGRESS.md).
- P29-M2 is complete. Policy payments store the exact due date settled; all
  due surfaces derive from `policySchedule`, Undo restores the payment and
  transaction together, and schema v17 migrates to v18 without changing
  legacy schedule outputs. P29-M2 supersedes the blocked P29-M.
  Findings and evidence are recorded in [PROGRESS.md](../PROGRESS.md).
- P29-O Step 1 report-only inventory is committed. P29-O1 supersedes its
  schema-v19 model for this step and changes only the presentation/derived
  invested display on the existing schema-v18 ledger. The original inventory
  remains historical; see [PROGRESS.md](../PROGRESS.md).
- P29-N remains complete. Transactions no longer shows the Review-month link;
  Budget's independent month routing and Home remain unchanged. The one-time
  reminders prompt is mounted inside `LockGate` and stores its handled flag in
  the existing metadata store, not AppData. The P24-A supersession is recorded
  in [PROGRESS.md](../PROGRESS.md).
- P29-L Insurance implementation and migration remain complete. Home was
  inspected read-only: it imports `policySummary` for its Insurance box and
  generic pending dues for Upcoming and due; it does not depend on cover goals.
  `app/(tabs)/index.tsx` remains user-owned and was not edited.
- Phase 29 status: P29-O2 is Cancelled by the owner; P29-S, P29-T, P29-U,
  P29-V and P29-W are Done. P29-M is
  Superseded by P29-M2; P29-O inventory is committed and P29-O1 remains Done
  on schema v18. P29-S makes no behavior or schema change.
  Includes P29-F2, P29-F3 and
  P29-F4. DEC-P29E-HOLDING-DELETE withdraws Undo after holding deletion; the
  retained same-write Budget unlink requirement is proven.
- Schema version: v21. The P29-O2 ledger-only v19 storage redesign was
  cancelled; P29-U uses v19 for additive optional valuation metadata.
  P29-W adds optional recurring-liability closure metadata in v20.
  P29-X adds optional recurring-stop metadata; P29-Z is documentation/ledger
  consistency and adds no behavior, schema, or UI source change.
  P29-L removes the retired coverGoals and policy
  coverGoalId data; P29-M2 adds PolicyPayment dueDate and supports migrations
  and backups through v17.
- Runtime: Node.js 26.13.0.
- Test counts: 91 suites, 1194 tests (1193 passed; one opt-in stress benchmark
  skipped); all six ordered gate results are recorded in
  [PROGRESS.md](../PROGRESS.md). P29-M2's 1120-test run, P29-N's
  1104-test run and P29-M's blocked reproduction remain historical records in
  [PROGRESS.md](../PROGRESS.md).
- Latest validated run: 91 suites, 1194 tests (1193 passed, 1 skipped); all six final
  gates exit 0. Fresh directory
  coverage and test counts are recorded in [PROGRESS.md](../PROGRESS.md).
  Exact commands and methodology are in [PROGRESS.md](../PROGRESS.md).
- Latest full Jest run: 91 suites, 1193 passed, 1 skipped, 1194 total; coverage thresholds
  met. Final ordered gate results are recorded in [PROGRESS.md](../PROGRESS.md).
- All six P29-L gates exit 0: Jest coverage, TypeScript, Expo lint with zero
  warnings, Expo Doctor 21/21, Android export and iOS export. Exact commands
  and exit codes are in [PROGRESS.md](../PROGRESS.md).
- All six P29-N gates exit 0 in the required order. Fresh P29-N coverage was
  generated after deleting `coverage/coverage-final.json` and measured from
  the regenerated file with `istanbul-lib-coverage`, grouping source by
  immediate `src/` directory: `src/data` 660/699 lines (94.42%) and 700/795
  branches (88.05%); `src/domain` 3182/3232 lines (98.45%) and 3130/3361
  branches (93.13%); `src/lib` 107/107 lines and 126/126 branches (100%).
  Per-file branches: `src/domain/budget.ts` 770/849 (90.69%) and
  `src/data/createAppStore.ts` 73/84 (86.90%); configured thresholds pass.
  Full test, assertion-count and gate details are in [PROGRESS.md](../PROGRESS.md).
- Fresh P29-L coverage was generated after deleting the prior
  `coverage/coverage-final.json`, then measured from the regenerated file with
  `istanbul-lib-coverage`: files were grouped by immediate `src/` directory;
  line coverage counts executable source lines and branch coverage counts
  branch arms. `src/data`: 660/699 lines (94.42%), 700/795 branches (88.05%);
  `src/domain`: 3186/3236 lines (98.45%), 3132/3363 branches (93.13%);
  `src/lib`: 107/107 lines and 126/126 branches (100%). Per-file branch
  coverage: `src/domain/budget.ts` 770/849 (90.69%) and
  `src/data/createAppStore.ts` 73/84 (86.90%); configured thresholds of 90%
  and 85% are satisfied.
- `npx expo lint` exits 0 with zero warnings and no eslint-disable comments
  added.
- The P29-K assertion audit compares `d8af3f5` with the final worktree:
  630 to 651 `expect(` occurrences (+21, -0, net +21) across four changed
  test files. The two updated memory/ledger expectation values are documented
  as data/count replacements in [PROGRESS.md](../PROGRESS.md); no assertion
  was weakened.
- The P29-F4 assertion audit compares 531d659 with its audited worktree:
  2050 to 2184 `expect(` occurrences (+134); 41 removed expectation lines are
  documented replacements, not removed-only assertions.
- The P29-J final assertion audit compares 337fcc5 with HEAD: the two changed
  test files remain at 169 total `expect(` occurrences (0 added, 0 removed,
  0 net); the modified expected ledger counts and P29-J coverage are recorded
  in [PROGRESS.md](../PROGRESS.md).
- The P29-L assertion audit compares inventory commit `8255857` with the final
  task changes: 2513 to 2430 `expect(` occurrences (18 added, 101 removed,
  net -83) across the changed test files. All removed/replaced assertions and
  reasons are listed in [PROGRESS.md](../PROGRESS.md).
- The P29-M store-level reproduction recorded one persisted write and correct
  PolicyPayment/linked-transaction data before failing its expected next-slot
  assertion (`2026-12-07` expected, `2026-11-07` received). The temporary test
  was removed; repository tests are not left failing. No P29-M behavior tests
  or six gates were run after the schema blocker was established.
- P29-M2's fresh coverage, per-file assertion audit, exact six gate exit
  codes, acceptance-test names, and device checks are recorded in
  [PROGRESS.md](../PROGRESS.md). Fresh directory coverage: `src/data`
  680/721 lines (94.31%), 722/821 branches (87.94%); `src/domain` 3195/3245
  lines (98.46%), 3137/3369 branches (93.11%); `src/lib` 107/107 lines and
  126/126 branches (100%). Per-file branch coverage: `src/domain/budget.ts`
  770/849 (90.69%) and `src/data/createAppStore.ts` 73/84 (86.90%).
- The prior Gate 1 timeout output is unavailable and cannot be quoted. The
  final fresh full run passes; see the ledger for the historical isolated-run
  information and the preliminary TypeScript correction.
- Coverage and UI tests are simulated. See [open-items.md](open-items.md) for
  physical-device checks not verified.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth
  for decisions, status, acceptance evidence, gates and device checks.
