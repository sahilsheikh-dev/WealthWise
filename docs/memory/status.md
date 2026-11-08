<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-08 | Updates: owner and AI agents -->

# Status
- Branching adoption: local `develop` was bootstrapped from main baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d`. The baseline contains legacy
  unreleased Release 2 history; the new stable-main rule applies
  prospectively. P28-D adds COMMON RULES, the branch/gate workflow, and
  contributor/security templates. All six gates pass; Gate 1: 98 suites,
  1,230 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall,
  `src/data` 91.03/87.39/94.46/94.17%, `src/domain`
  96.95/92.85/98.80/98.32%, `src/lib` 100% in all measures.
- Commit-subject enforcement is active in the repository: the old behavior
  allowed non-descriptive placeholder subjects; the new POSIX hook requires a
  supported Conventional Commit subject and rejects placeholders. The reason
  is to make scope clear and keep unrelated work separate; proposed subjects
  and staged diff-stats are shown before commits. Enable it with
  `git config core.hooksPath .githooks`. Focused tests cover accepted and
  rejected subjects. Its implementation Gate 1 had 93 suites, 1,205 passed,
  1 skipped; 95.90%
  statements, 91.89% branches, 97.75% functions, 97.57% lines overall.
  `src/data`: 90.63/86.95/93.07/93.92%; `src/domain`:
  96.96/92.82/98.79/98.31%; pure `src/lib`: 100% in all four measures.
  Gate 1 `npm test -- --coverage` exit 0; Gate 2 `npx tsc --noEmit` exit 0;
  Gate 3 `npx expo lint` exit 0; Gate 4 `npx expo-doctor` exit 0. Gates 5-6
  (Expo exports) were skipped to honor the explicit no-build boundary.
- Prior task: Release 2 stabilization is implemented and committed locally.
  P29-AB-R1 fixes recurring-income consumers; P30-A/B/C reproduce and repair
  stale persisted values and add source guards; P20-N-R1 replaces the stacked
  bar with accessible per-section actual/planned Pace lines (`f904769`). No
  schema or version bump, release preparation, build, export or push occurred.
  P30 confirms SQLite winning over newer verified fallback data after restart;
  mounted-screen refresh, selector/memoization, module-cache, prior-state
  mutation, and route-param hypotheses were not reproduced by the harness.
  The device checklist now marks N39 and N40 Fail and N41 Not run; device
  re-test and v1.1.0 release preparation remain pending. The full Gate 1 run
  has 97 suites, 1,227 passed, 1 skipped; coverage is 95.96% statements,
  92.01% branches, 98.01% functions and 97.62% lines overall. `src/data`:
  91.03/87.39/94.46/94.17%; `src/domain`: 96.95/92.85/98.80/98.32%;
  `src/lib`: 100% in all four measures. Gates 1-4 passed; exports were skipped
  because the task forbids builds. Full evidence is in [PROGRESS.md](../PROGRESS.md).
- Current continuation: P29-W-R1 is complete locally on
  `task/P29-W-R1-liability-entries`. A route regression now inspects actual
  pending EMI list rows, not just summary text, and confirms they stop at the
  last scheduled EMI date at font scales 1.0, 1.3 and 2.0. Focused route tests
  pass (2 suites, 5 tests); TypeScript passes. Phase integration is pending.
  The broader authorized task still includes P28-E history organization and
  final task-branch integration.
- Current request: P29-O1-R2 and P29-W-R2 align recurring-asset and liability
  completed/pending month counts into two-column summary cells and sort pending
  schedule rows together with dated entries (newest first). Focused route
  regression passes for both screens at font scales 1.0, 1.3 and 2.0; full
  gates, device verification and phase integration remain pending. No schema
  change.
- Corrected the five historical checkpoint commit subjects and force-pushed
  the rewritten `main` history to `origin/main` with explicit owner
  authorization. Replacement commit IDs, unchanged tree verification, and
  remote tip are recorded in [PROGRESS.md](../PROGRESS.md). The published
  `v1.0.0` tag was later aligned with the verified EAS build source under the
  explicit P28-C-R3 approval; details are in [PROGRESS.md](../PROGRESS.md).
- The two v1.0.0 release-documentation message corrections and their
  release-folder follow-up are included in the rewritten, pushed `main`
  history; details are recorded in [PROGRESS.md](../PROGRESS.md).
- Release-management documentation is present under `docs/releases/`:
  reusable workflow prompt, configuration, release history and
  `published/v1.0.0.md` record.
  The v1.0.0 GitHub Release was published on 2026-11-07 and its release URL
  is verified. The tag was aligned to the verified build source in P28-C-R3.
  The process requires verified changes and explicit
  publication approval. The release README now gives separate prompts for
  preparing an unpublished draft and publishing only after approval.
  See the release publication entry in [PROGRESS.md](../PROGRESS.md).
- P28-B first-release metadata is aligned to version 1.0.0. The v1.0.0 GitHub
  Release and APK are published; the public links, EAS build and approved
  remote tag alignment are verified in P28-C-R3. The GitHub release body's
  stored `targetCommitish` still shows the original target because no release
  edit was made.
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

- P28-A initial release preparation is complete through the report, metadata update,
  and release checklist. Report commit `fbdcbac` records source-backed release
  readiness, permissions, storage, audit and migration evidence. Its initial
  `0.2.0` metadata was later revised by P28-B to the stable `1.0.0` release.
  Metadata commit `41c4617` updates the changelog and README audit/license
  claims. Current EAS build commands and checklist are in
  [build-config.md](../releases/build-config.md). Home and Budget remain
  protected and unchanged.

- P28-C release organization and build management are complete. The reusable
  release-notes template, EAS profiles/version identifiers, build history,
  release approval rules and committed draft workflow are documented under
  `docs/releases/`. P28-C-R2 records the v1.0.0 APK asset and download details;
  P28-C-R3 verifies the public links, EAS artifact and approved tag alignment.
  The owner entered Pass for all 43 device checklist rows. No build,
  submission, GitHub release-body edit or branch push was made.

- P27-A cleanup is complete. Report-only commit `b805fb1`; implementation
  commits are `a8a2d78` (dead code), `61714ec` (dependencies), and
  `dd0c930` (robust schedule benchmark). Final Gate 1 has 91 suites and 1192
  tests (1191 passed, 1 skipped). All six gates passed after each cleanup
  implementation commit. Coverage remains above thresholds:
  `src/data` 749/798 lines/780/896 branches; `src/domain`
  3549/3609/3480/3747; `src/lib` 107/107 and 126/126. Protected Home and Budget
  files remain unchanged. The inventory is summarized in [PROGRESS.md](../PROGRESS.md);
  generated report files are not tracked.
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
- Historical P29-X/P29-AA context (not the current task): owner recurring-stop,
  foreclosure, and Home-only menu refinements complete.
  P29-Y Gate 1 repair complete; P29-X stop/resume implementation
  remains the latest product change.
  The recurring plan details and financial Summary now share one card on the
  investment entries screen; Stop/Resume is in the holding action row above the
  card. The owner's current edit has no Entries or Edit recurring plan control
  on the holding screen; removed screen data is not to be restored.
  P29-X introduced schema-v21 `stopDate`; plan schedules, pending items,
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
- Historical schema context: P29-X introduced schema v21. The P29-O2
  ledger-only v19 storage redesign was
  cancelled; P29-U uses v19 for additive optional valuation metadata.
  P29-W adds optional recurring-liability closure metadata in v20.
  P29-X adds optional recurring-stop metadata; P29-Z is documentation/ledger
  consistency and adds no behavior, schema, or UI source change.
  P29-L removes the retired coverGoals and policy
  coverGoalId data; P29-M2 adds PolicyPayment dueDate and supports migrations
  and backups through v17.
- Runtime: Node.js 26.13.0.
- The historical 2026-11-08 P28-C-R2/P28-A-R1 run had 91 suites and 1195
  tests (1194 passed; one opt-in stress benchmark skipped). P29-M2's
  1120-test run, P29-N's 1104-test run and P29-M's blocked reproduction remain
  historical records in [PROGRESS.md](../PROGRESS.md).
- Test counts: 98 suites, 1231 tests (1230 passed; one opt-in stress benchmark
  skipped) in the P28-D run.
- Latest validated run: 98 suites, 1231 tests (1230 passed, 1 skipped) on
  2026-11-08; all six gates exit 0. Coverage and exact commands are recorded
  in [PROGRESS.md](../PROGRESS.md).
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
