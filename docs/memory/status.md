<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-04 | Updates: owner and AI agents -->

# Status

- Current task: P29-O2 is introducing the unified ledger and v19 migration
  through the compatibility adapter; source schema remains v18 while staged
  consumer conversion proceeds. P29-O1 is committed and verified.
  P29-O1 used the existing v18 holding model;
  manual and recurring holdings share Deposit, Withdraw and Entries actions,
  with a derived Opening row and an in-holding Recurring plan section.
  Displayed Invested is net of withdrawals and floored at zero; fixed-deposit
  restrictions and P29-H return/current-value logic remain unchanged. The
  final 90-suite/1140-test coverage run and all six ordered gates pass; physical
  device checks remain open in [open-items.md](open-items.md).
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
- Phase 29 status: P29-A through P29-L, P29-N, P29-M2 and P29-Q are Done; P29-M is
  Superseded by P29-M2; P29-O inventory is committed and P29-O1 is Done on
  schema v18; no AppData schema change was made for P29-O1 or P29-Q.
  Includes P29-F2, P29-F3 and
  P29-F4. DEC-P29E-HOLDING-DELETE withdraws Undo after holding deletion; the
  retained same-write Budget unlink requirement is proven.
- Schema version: v18 pending P29-O2's v19 migration. P29-L removes the retired coverGoals and policy
  coverGoalId data; P29-M2 adds PolicyPayment dueDate and supports migrations
  and backups through v17.
- Runtime: Node.js 26.13.0.
- Test counts: 90 suites, 1140 tests. P29-M2's 1120-test run, P29-N's
  1104-test run and P29-M's blocked reproduction remain historical records in
  [PROGRESS.md](../PROGRESS.md).
- Latest validated run: 90 suites, 1140 tests for P29-O1. All six ordered gates
  exit 0. Fresh coverage from a deleted-then-regenerated
  `coverage-final.json`, grouped by immediate `src/` directory with
  `istanbul-lib-coverage`: `src/data` 702/745 lines (94.23%), 735/838
  branches (87.71%); `src/domain` 3315/3365 lines (98.51%), 3205/3437
  branches (93.25%); `src/lib` 107/107 lines and 126/126 branches (100%).
  Per-file branches: `budget.ts` 788/867 (90.89%) and
  `createAppStore.ts` 86/101 (85.15%); both configured thresholds pass.
  Exact gates, assertion audit and device checks are in [PROGRESS.md](../PROGRESS.md).
- Latest full Jest run: 90 suites, 1140 tests passed. Final ordered gate
  results and fresh coverage are recorded in
  [PROGRESS.md](../PROGRESS.md).
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
