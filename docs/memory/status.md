<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-22 | Updates: owner and AI agents -->

# Status
- **CR-136 / Documentation (2026-11-23) — Device checklist rearrangement for published v1.3.0.**
  Rearranged docs/releases/device-test-checklist.md: moved published checks O61–O76 into
  dedicated ## v1.3.0 device checks section placed below v1.2.0 in ascending order.
  Next release device checks at the top retains only unreleased checks (O77) for upcoming
  version 1.3.1. Established standing rule across all policy documents requiring published
  release checks to move into their own specific version section below previous releases.
- **CR-135 / Documentation (2026-11-22) — Device check O77 and feature/fix checklist rule.**
  Added check O77 to docs/releases/device-test-checklist.md under Next release device
  checks in Not run status to verify budget item and section rename on physical devices.
  Confirmed metadata with owner (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream,
  tester sahilsheikh-dev, 2026-11-22). Established standing repository rule across policy
  docs requiring physical-device verification check(s) to be added for any feature,
  fix, bug fix, or revision that modifies user-facing behavior or core logic.
- **P20-Y-R3 / CR-134 (2026-11-22) — Sync budget category only, preserving transaction note.**
  Refined budget item and section rename behavior to update transaction.category only,
  preserving transaction.note even if it is identical to the old name. Updated editItem,
  renameSection, editBudgetIncome, and reconcileBudgetItemTransactions. Added regression
  tests verifying note preservation. All six repository gates pass with exit 0.
- **P20-Y-R2 / CR-133 (2026-11-22) — Budget item rename reflects in transaction category item.**
  Fixed WealthWise bug where renaming an expense or standard budget item did not
  reflect in transaction category item, leaving transactions showing the old name.
  In P20-Y-R1, transaction updates were gated behind targetHoldingId. P20-Y-R2
  updates tx.category and tx.note for matching transactions across month/following
  scopes for all budget items in editItem, renameSection, and editBudgetIncome. Adds
  reconcileBudgetItemTransactions in budgetCategories.ts and invokes it on store
  rehydration and backup import to heal desynced transactions. Updates
  TransactionsScreen categoryLabel to reflect linkedBudgetItem.name. Regression
  tests in budgetItemRenameTransactions.test.ts and TransactionsScreen.test.tsx.
  All six repository gates pass with exit 0.
- **P20-Y-R1 / CR-132 (2026-11-22) — Linked transactions update on budget item rename.**
  Fixed WealthWise bug where renaming a budget item or category in one month did
  not update the name shown by transactions linked to that item. Linked
  transactions now reflect the current budget item name wherever it appears,
  including existing transactions, while preserving amount, date, category, and
  budget link. Handles month-specific items and create, edit, display,
  persistence, migration, and backup-import paths. Added regression tests in
  `src/domain/__tests__/budgetItemRenameTransactions.test.ts`. All six
  repository gates pass with exit 0.
- **P28-F-R7 / CR-130 (2026-11-22) — Prepare v1.3.0 release candidate.**
  Prepared owner-approved v1.3.0 release candidate: bumped versions in app.json,
  package.json, and package-lock.json to 1.3.0; moved finalized release note to
  docs/releases/published/v1.3.0.md with 8 owner-supplied screenshots under
  docs/releases/screenshots/v1.3.0/; aligned build-config.md and device checklist
  to v1.3.0. Candidate PR #210 and PR #211 integrated to develop (afeb987);
  release/v1.3.0 created; EAS build c2ec9414-ae63-44cc-b34a-0f67f6cb51cb (profile android-apk,
  versionCode 4) verified and 107,030,213-byte APK uploaded to GitHub release draft.
  Per owner instruction, updated README.md (Download block and 8-screenshot gallery for v1.3.0),
  aligned published v1.3.0 and v1.2.0 download blocks and release history, and updated
  release rules in AGENTS.md and rules.md to mandate aligning README and release docs during
  candidate staging. Publication remains pending owner approval. All six repository gates pass.
- **P20-X-R1 / CR-129 (2026-11-22) — Remove transaction sorting & Dropdown search title.**
  Removed sorting option from TransactionForm category dropdowns (Expense, Income, Invest)
  and removed redundant static Search header title from shared Dropdown sheet, keeping
  search placeholder inside the input box. Regression tests in Dropdown.test.tsx and
  TransactionForm.test.tsx pass. All six repository gates pass.
- **CR-128 (2026-11-22) — Once-only frequency for plans/liabilities cancelled by owner.**
  The owner decided not to add Once-only frequency to investment plans or liabilities;
  investment plans retain existing manual (one-time) and recurring plan kinds, and
  liabilities retain existing one-time and recurring EMI structures. No schema or form
  changes are made. Updated open-items.md, status.md, PROGRESS.md, and ledger tests.
- **P20-Y (2026-11-22) — Done; O76 physical-device check validated Pass.**
  CR-126 implements three related changes: (1) payment date input (defaulting
  to today, customizable) when marking scheduled/budgeted items Paid in
  Transactions and Budget, propagating to clearDue / clearDuesThrough /
  addTransaction; (2) support for one asset linking to multiple one-time
  investment Budget items, attributing holding entries by category/note and
  updating the correct holding and budget actuals; (3) limiting Transaction
  form Expense categories to user-created Budget items and applicable scheduled
  items (dues/policies) plus Custom, while preserving historical removed
  categories when editing existing transactions. Full regression tests pass
  in PaidAmountDialog.test.tsx, PendingItemActions.paymentDate.test.tsx,
  budgetMultiAssetLink.test.ts, budgetCategoriesLimited.test.ts, and
  TransactionForm.test.tsx. All six repository gates pass exit 0. O76 was
  validated Pass on physical device realme Narzo 60 Pro 5g by owner on 2026-11-22.
- **P20-X (2026-11-22) — Done; O75 physical-device check validated Pass.**
  Implemented sorting for Budget categories and items throughout WealthWise using
  existing sorting behavior in Transactions, Assets, and Liabilities as reference.
  Added SortChip in AppHeader filter toggle panel on BudgetScreen using
  useSort('budgetSpending') with Planned, Actual, Percent used, and Name options;
  preserved Income at top while sorting its items; sorted spending/investing
  sections and items within sections; added sorting support to shared Dropdown
  with SortChip rendered in sheet; connected category dropdowns in
  TransactionForm and BudgetIncomeForm with persistent budgetSpending sort spec;
  extended budgetCategoryChoiceSections with pure sortSpec handling. Regression
  tests: BudgetSorting.test.tsx, Dropdown.test.tsx, RouteRenderSmoke.test.tsx,
  budgetCategories.test.ts. All six repository gates pass. Protected-file hash
  for app/(tabs)/budget.tsx updated to eca7607015cb3c8b85dfc7e0d4001235166742a2.
  O75 was validated Pass on physical device realme Narzo 60 Pro 5g by owner on 2026-11-22.
- **P20-U-R1 (2026-11-21) — Done; O73 physical-device restart check remains open.**
  CONT3 completed the form/store/persistence matrix for reported fields,
  sections, kinds and both scopes, plus non-current viewed months, plain-backup
  restore, demo origin and H1–H5. Confirmed fixes: Income plan/snapshot
  schedule mismatch (`2dc72b5`), optional-field item edit overwrite
  (`a292f33`), and category-line holding-link loss (`e4accf5`). Name,
  amount/value, start month, frequency and due day are covered; Spend, Invest
  and Income include one-time/recurring cases where applicable. H1 is refuted
  for the tested reopen flow; H2 for live update followed by selected-ID
  deletion; H3 was not reproduced in tested Budget routes (Alert/reminder
  entry points were not exercised); H4 is confirmed/fixed; H5 is refuted for
  the synchronous test-storage path. O73 remains Not run. At P20-U-R1 closeout
  the schema was v23; P20-W-D3 later advanced it to v24. U-R1 made no migration
  or protected-file change. Final gates: 1 exit 0 (104 suites,
  1,406 passed, 1 skipped); 2 exit 0 after test-only harness typing fixes;
  3 exit 0; 4 exit 1 once (`ENOTFOUND registry.npmjs.org`); 5–6 exit 0.
  Protected-file hashes match `docs/memory/rules.md`. O73 remains Not run.
- **P20-U-R1 local integration prep (2026-11-22):** phase sync commit
  `cb363423384923ef19f00399cd380baba01e9e59` incorporates local `develop`;
  task branch `task/P20-U-R1-budget-edit-delete` includes the phase at merge
  commit `becbd83c0b18051bf54a00904c6463bd2232f5b3`. Conflict resolution kept
  both U-R1/A-R3 records and unique O73/O74 rows. Focused suites passed (12/364).
  Gates 1–3 and 5–6 exited 0; Gate 4 exited 1 because `npx` could not resolve
  `expo-doctor` from `registry.npmjs.org` (`ENOTFOUND`); it was not retried.
  No remote action occurred during that prep. The owner subsequently merged
  task PR #180 at `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` and phase PR #181
  at `22f332fe9310e92c50d94cc6640c19f4e1552dcc`, verified in local refs. O73
  remains Not run.
- **P20-A-R3 linked savings Paid fix (2026-11-21) — implementation and PR integration complete.** Real-store placement regressions reproduced a plan-only holding link being lost from a viewed month snapshot and a snapshot-only link failing to attribute a holding-entry transaction to the Budget item from another month. `pendingItems` now resolves a snapshot's link from its plan item; linked Budget actuals include stored month-snapshot links. Focused real Transactions and `/payment-confirm` route tests, reminder cold-start routing, real-store create/rehydration, v20–v23 plain-backup import/migration path, scope history and demo data pass. Exact/lower/higher × Savings/Cash/Other tests pass; Fixed deposit remains rejected. Home's due list filters to `kind === 'due'`; Budget has no Paid action for pending items. The owner-provided exact data origin and steps remain blank, so the synthetic failure shape is established but the exact device reproduction is still unknown. Six gates: Gate 1 exit 0 (103 suites, 1,387 passed, 1 skipped; coverage 96.00/92.23/98.09/97.66% statements/branches/functions/lines); Gate 2 exit 0; Gate 3 first exit 1 for test-harness lint, then exit 0 after correction; Gate 4 exit 1 (`ENOTFOUND registry.npmjs.org`); Gates 5–6 exit 0. After strengthening route Undo assertions, the focused 18-test suite, TypeScript and lint were rerun successfully. O74 is Not run. No schema, dependency or protected-file change. See the task row and final evidence in [PROGRESS.md](../PROGRESS.md).
- **P20-W (2026-11-22) — D1/D2/D3 integrated; schema v24.**
  Schema version: v24 (`SCHEMA_VERSION` in `src/domain/schemas.ts`). D3 uses
  the existing custom earned-income category field with its v23→v24 migration
  and backup compatibility. Phase sync is
  `b5f8c52477ba88dce1c376904c36dee72b84a092`; D3 task merge is
  `8f0840f82646f2b3ec91457cb48b932abf8caeaa`. Text conflicts in this file and
  `project.md` retained both branches' records. Focused suites passed (15/664).
  Gates 1–3 and 5–6 exited 0; Gate 4 exited 1 because npm could not resolve
  `expo-doctor` (`ENOTFOUND registry.npmjs.org`), with no retry. O71 is Not run
  and covers custom earned-income entry, persistence and reopening. O73/O74
  remain Not run. P36-A/B are replanned to v25. No push or PR was performed.
  P20-S-R2 merge `6b50a1d` is on `develop`; phase `phase/20-budget` was
  synced from current `origin/develop`, and the task tree now includes that
  phase history. D1/D2 remain schema-free and implemented; focused
  TransactionForm/schema suites pass (68 tests). On the synced task tree,
  Gate 1 exited 0 (102 suites, 1,368 passed, 1 skipped; coverage
  95.96/92.14/98.03/97.63% statements/branches/functions/lines); Gates 2–3
  exited 0; local Gate 4 attempt exited 1 with
  `ENOTFOUND registry.npmjs.org`; owner-supplied Gate 4 exited 1 at 20/21 on
  the six known SDK 57 patch mismatches (owner-approved cleanup exception);
  Gates 5–6 exited 0. Dependencies and app config did not change since the
  owner run. DEC-P20W-D3-SCHEMA24 resolves schema ownership: P20-W takes v24
  and P36-A/B are replanned to v25. D3 commit `f2541fd` adds custom income schemas/forms, identity
  v23→v24 migration, archive cleanup and backup compatibility. Focused checks
  pass (8 suites / 524 tests). D3 gates: Gate 1 exit 0 (102 suites, 1,381
  passed, one skipped; coverage 95.97/92.15/98.03/97.64%); Gates 2–3 and 5–6
  exit 0; Gate 4 exit 1 (`ENOTFOUND registry.npmjs.org`) on its single attempt.
  Task PR #182 and phase PR #183 are merged; exact merge SHAs are in the
  current snapshot reconciliation below. Physical checks O69–O72 remain Not
  run; O65–O68 belong to P21-F. Task PR #174 merged at `419a37b07e6853b3c683d22ec243ea58223514c1`; phase
  PR #175 merged at `9e47856f20848e03ac6a4b8e699f47c387d08161`; CM-2 synchronized local `develop`.
  P20-W-R1 records task PR #174 and phase PR #175; D3 schema ownership is
  resolved by DEC-P20W-D3-SCHEMA24.
- **P20-W-R1 (2026-11-21) — integration evidence recorded; P20-W remains open for D3.**
  Task PR #174 merged into `phase/20-budget` at `419a37b07e6853b3c683d22ec243ea58223514c1`; phase PR #175
  merged into `develop` at `9e47856f20848e03ac6a4b8e699f47c387d08161`. CM-2 synchronized local `develop`.
  D1/D2 are integrated. D3 is authorized to use v24; P36-A/B are replanned to
  v25. Device checks O69–O72 remain Not run.
- **P21-F / CR-117 (2026-11-21) — Emergency Fund target editing merged; P21-F-R1 records integration.**
  Read-only investigation confirms the existing persisted `Goal.target` is used;
  schema v23 and backup shape remain unchanged. DEC-P21F-FLOOR keeps the
  max(stored target, three-month floor) effective target and rejects below-floor
  edits using current typed validation. Task branch is
  `task/P21-F-emergency-fund-target-editing`; test-first ledger commit is
  `f759932`. One `Edit Emergency Fund` header action now opens a combined target
  and allocation form. The plan saves through one domain action, one store set
  and one persisted write with one-step Undo. Domain, store, screen, form, route,
  backup and demo tests pass. Synced task gates: Gate 1 exit 0 (102 suites,
  1,365 passed, 1 skipped; coverage 95.96/92.14/98.03/97.63% statements/
  branches/functions/lines); Gates 2–3 exit 0; this session's Gate 4 attempt
  exit 1 with `ENOTFOUND registry.npmjs.org`; owner-supplied Gate 4 exit 1 at
  20/21 on the known six-package SDK 57 patch mismatch; Gates 5–6 exit 0.
  Task PR #170 merged into `phase/21-emergency-fund` at
  `c877f6d19e35c0b9fbcba90e9722da7531948c8e`; phase PR #171 merged into
  `develop` at `2e5e18a7a2be207387a7462b039547f51b0e4631`. CM-2 synchronized
  local `develop`. P21-F-R1 records task PR #170 and phase PR #171 merge SHAs.
  O65–O68 remain Not run.
- **P20-S-R2 / CR-116 (2026-11-21) — searchable Dropdown implementation complete.**
  Task branch `task/P20-S-R2-dropdown-search` merged into `phase/20-budget`
  through PR #164 at `185a5ea125f64ac104344f00ad013d68cdb7a946`; phase PR #165
  merged into `develop` at `6b50a1dbd36b401352776e71028fc07071c11991`.
  CM-2 fast-forwarded local `develop` to that remote tip. Six ordered
  gates completed: 1 exit 0 (102 suites, 1,342 passed, 1 skipped); 2 exit 0;
  3 exit 0; 4 exit 1 (known SDK 57 patch mismatch after one DNS retry); 5 exit
  0; 6 exit 0. The test-first ledger expectation is `36e8ba4`; helper,
  component and focused route checks pass. **Assumed:** no schema, domain,
  demo-data or dependency changes were needed; confirmed. Native keyboard,
  result-count announcement, clear tap target and real-device 1.3/2.0 font
  scale checks remain unverified (O61–O64). P20-S-R2-R1 records the verified
  integration evidence; P20-S-R2-R2 preserves the complete revision chain.
- **CR-115 (2026-11-13) — Budget edit/delete report recorded under P20-U-R1.**
  Owner reported: "In budget while updating any item/value/amount/start-month/frequency/due-day/etc
  it is not updating also while trying to delete it is not even deleting, not for
  single month and this and following months." The original "Don't start
  working on this" instruction was superseded by explicit owner authorization
  on 2026-11-21. P20-U-R1 is Done after the complete automated owner-report
  matrix; physical-device restart verification O73 remains open and Not run.
- **CR-114 (2026-11-12) — independent entities, empty slots and R7 merged into develop.**
  Work tracking restructured: `cleanup`, `qa-and-release`, `schema-migration`
  and `documentation` operate as independent lifecycle entities with dedicated
  branches and Section 13 tracking, excluded from phase progress bars (142/184, 77%).
  Freed phase slots P7, P27, P28 and P32 remain reserved as Empty (reserved)
  slots so no phase is renumbered and no historical ref is rewritten. R7
  slot-filling rule enforced across instructions and placement guide. Remote
  branches `schema-migration` and `documentation` pushed and verified;
  `phase/07-schema-migration` deleted on origin. Historical tags
  `phase-07-complete`, `phase-27-complete`, `phase-28-complete` retained. All
  historical commits/PRs preserved with complete history map in
  `docs/history/entity-history-map.md`. PR #161 merged `documentation` into `develop`
  as `9058386`. Preflight Gates 1–3, 5, 6 passed; Gate 4 exit 1 owner-approved
  exception (upstream Expo SDK 57 patch advisory on both develop and documentation).
  Dependency patch alignment is tracked as a Planned `cleanup` task. Merge evidence
  recorded on `documentation` (unpushed).
- **CR-113 (2026-11-12) — owner approvals recorded; all feature work remains
  Planned.** P21-F Home-source editing is authorized if needed; P33/P34/P35
  research and stated follow-on scopes are approved; P35 has a Go after
  research; P43-B/E planning direction is approved; P44-A placement/counting
  is decided; P39/P40 stay in their existing areas. No research, app
  implementation, tag deletion or issue creation started. The exact proposed
  non-release tag list still needs approval, and P43-E needs verified inventory.
  P43-G task PR #157 and phase PR #158 are merged; their exact merge commits
  are recorded in [PROGRESS.md](../PROGRESS.md).
  See [open-items.md](open-items.md) and [PROGRESS.md](../PROGRESS.md).
- **CR-111 (2026-11-12):** P20-A-R3 implementation/tests are complete locally,
  but Gate 4 network failure blocks task/phase PR integration. P44-A–P44-D
  remain Planned; CM-2 is Active and enforced as a repository rule, not a phase
  part. The earlier P20 planning PRs #149/#150 remain historical integrations.
  Current P20-A-R3 work has no schema or demo-data changes; no issue creation,
  tag operation or history rewrite occurred. See [open-items.md](open-items.md)
  and [PROGRESS.md](../PROGRESS.md).
- **CR-112 (2026-11-12) is complete:** R6, the indexed placement guide,
  ledger relocations, tests and CM-2 are complete on
  `task/P43-F-work-placement-rules`. Test-first commits include `e2f0263`,
  `d24acd9`, `e7c134a`, `770393d` and `bdbe159`; the placement audit is
  `5841373`.
  Initial Gate 4 exited 1 on registry DNS (`ENOTFOUND registry.npmjs.org`);
  the authorized network retry passed 21/21, then the full ordered rerun
  passed all six gates. Gate 1: 101 suites, 1,324 passed, 1 skipped;
  coverage 95.96/92.15/98.02/97.62% statements/branches/functions/lines.
  No physical-device verification was performed. Task PR #153 and phase PR
  #154 are merged as recorded in the CR-112 closeout.
- **P43-A is Done:** `origin/cleanup` is at the old
  `origin/phase/27-cleanup` tip `a2fa24f930da15c49f779577eb749b33f11a7059`;
  `origin/qa-and-release` is at the old
  `origin/phase/28-qa-and-release` tip
  `9d914638e50462cbadef84df3294ed07cbf42732`. Each new ref matched its old
  counterpart before deletion; final checks show the old refs are absent.
  Historical branch name: `phase/27-cleanup`; historical branch name:
  `phase/28-qa-and-release`. The retained `phase-27-complete`,
  `phase-28-complete` and `phase-29-complete` tag targets are unchanged.
  P43-A and P43-F are Done. Task PR #153 merged into P43 at
  `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154 merged into
  `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`. P43-F-R1 records
  the verified merge evidence. No application/schema/demo, release, tag,
  issue or history work occurred.
- **CR-110-R1 (2026-11-12) is Planned only:** CR-110 is marked Revised by
  CR-110-R1. Five P43 items record lifecycle tracking separation, tag cleanup and
  a report-only branch/PR/merge audit, Emergency Fund target editing,
  transaction-form changes, and a GitHub issue strategy. Every item has
  dependencies and `Evidence: not started`. No application implementation,
  remote branch rename, tag operation, issue creation or history rewrite is
  authorized. Historical P27/P28 evidence and Git chronology remain intact.
  The test-first commit is `e5114e01f363d6de5a12acb61886039469d4a86f`;
  authorized local P43 phase/task branches were created for the planned PR
  flow. Task PR #146 merged into P43 at
  `e4d950adf0344dbe12e2e0d085e83d60538ede68`; phase PR #147 merged into
  `develop` at `a93feaecfbd591c1b6f27bac15b5839c68d10709`. The task branch
  was deleted and the phase branch is retained. See
  [open-items.md](open-items.md) and [PROGRESS.md](../PROGRESS.md).
- Lifecycle branches are currently `cleanup` and `qa-and-release`; the
  historical branch name: `phase/27-cleanup`; historical branch name:
  `phase/28-qa-and-release`. Their remote refs have been renamed and verified.
  Any deletion of non-release tags is blocked on an owner-approved exact tag
  list; retain all `vX.Y.Z` releases and stale phase tags already directed.
  GitHub issue creation is a separate owner-approved task; GitHub controls
  actual issue/comment/closure timestamps.
- **Owner-decision reconciliation (CR-109, 2026-11-11):** future in-app
  update discovery, Once-only investment/liability frequencies, public
  adoption, the P31-D privacy statement, P40-B and post-P31-E branch
  protection are approved as Planned; this record implements none of them.
  The MIT holder is confirmed as Sahil Aspak Sheikh. The owner accepts current
  P29-J calculation behavior, CR-3 Save behavior, the recorded dependency
  audit, existing backup snapshot and Node 26 pin. Stale phase tags are to be
  retained. See [open-items.md](open-items.md) and [PROGRESS.md](../PROGRESS.md).
- v1.2.0 (minor) is published. `app.json`, package metadata and the
  About-screen test identify v1.2.0. The approved note has fourteen
  screenshots, with five new settings/backup screens added to every release
  and About only to v1.2.0. Release PR #124 merged `release/v1.2.0` into
  `main` as `2e419f8c7d482adc7523b380fe5b71d3bf15dce3`; tag `v1.2.0` points to
  the APK's exact source candidate
  `199ebed307ce7755bc92c1f15544999d852db54f`. EAS build
  `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` succeeded with profile `android-apk`
  and Android `versionCode` 3; the 112,163,081-byte APK was privately
  byte-verified against EAS and published.
- All six gates were rerun on `develop` at `3bd5be6`: 101 suites, 1,316
  passed, 1 skipped; coverage is 95.96/92.15/98.02/97.62% overall,
  `src/data` 91.06/87.47/94.48/94.19%, `src/domain` 96.94/93.00/98.80/98.31%,
  and `src/lib` 100% in all measures. The final docs/test correction merged
  through task PR #130 (`202dabe`), phase PR #131 (`6f4f4df`), develop-to-main
  PR #132 (`b678493`) and main-to-develop PR #133 (`eedff48`); `main` and
  `develop` trees match.
- P28-F-R6-R2's ledger regression correction merged from task PR #134 into
  `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at
  `2d3a0f6`. Its evidence records the prior
  release sync and exact P28 38/38 completion status.
- The owner reports all previously listed physical-device follow-ups passed
  on 2026-11-11. O54-O60 in the device checklist record the grouped areas:
  accessibility/large text, dialogs/navigation, reminders/notifications,
  persistence/storage, financial flows, backup/restore and Budget/list
  layouts. No device model, OS version or tester details were supplied; these
  are owner-reported, not independently observed.
- P28-F-R6-R3 changes documentation and ledger tests only; the focused
  progress-ledger test passes 17/17. The full suite and six application gates
  were not rerun for this update. Task PR #138 merged into the retained phase
  at `6f5b1cb`; phase PR #139 merged to `develop` at `fd7ba55`. P28-F-R6-R3
  is integrated into `develop` at `fd7ba55`.
- CR-109 is integrated without application behavior changes. P42-A task PR
  #142 merged into the phase at `8f38e9f`; phase PR #143 merged into
  `develop` at `8988121`. P42-A-R1 records task PR #142 and phase PR #143;
  all six gates were rerun on integrated `develop` and passed. P42-A-R1 also
  reran all six gates on its task branch with the same results. Exact results
  are in the CR-109 verification entry.
- All 104 screenshot image/link URLs returned HTTP 200; raw image sizes match
  all 52 repository files. The latest and four versioned APK URLs returned
  HTTP 200 with their expected artifact sizes. Historical release screenshot
  sections were updated without changing other release-body content, and the
  previous v1.1.1 latest APK was renamed to its versioned filename.
- The final README/latest-release Download parity update and branch
  synchronization are complete: task PRs #125/#126, phase PR #127,
  develop-to-main PR #128 and main-to-develop PR #129 are merged. O45-O60 are
  owner-reported Pass; device identity details were not supplied. The
  subsequent final ledger/test correction is also synchronized through PRs
  #130–#133; `main` and `develop` have identical trees.
- CR-108 is complete on `develop`. P29-Q-R1 and P20-N-R3 merged at
  `80eb0e4` and `f5f6e16`. P41-A and its category correction merged through
  PRs #97–#100 at `9aa6540` and `a67f54f`; P41-B merged through PRs #101/#102
  at `b4275d3`, with evidence follow-up PR #103 at `c1e810b`; P41-C merged
  through #104/#105 at `37a3429`; P41-D merged through #106/#107 at
  `8e4a2d1`. P41-B-R1 corrected the stale once-only reminder count (909 to
  893), added schedule/schema branch coverage, and merged through task PR #108
  and phase PR #109 to `develop` at `5cb4957`. All six ordered gates pass:
  Gate 1 has 101 suites, 1,316 passed, 1 skipped; coverage is
  95.96/92.15/98.02/97.62% overall, `src/data` 91.06/87.47/94.48/94.19%,
  `src/domain` 96.94/93.00/98.80/98.31%, and `src/lib` 100% in all measures.
  The current schema is v23; Once only applies to Budget items, Budget income
  and insurance premiums, not investment plans or liabilities. No CR-108 work
  ships in v1.1.1. The owner reports O45-O60 physical checks passed; device
  and tester fields remain blank. The authorized Budget blob and all other
  protected hashes are recorded in [rules.md](rules.md).
- CR-106 adds planning rows only: P31-D privacy and P31-E CI, report-first
  P39 release audit/hardening, and P40 agent-context hygiene.
  No audit part, app-source change, phase implementation, or release work has
  started. All six ordered gates passed for this ledger/test-only change:
  98 suites, 1,271 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall
  statement/branch/function/line coverage. Per-directory results are recorded
  in [PROGRESS.md](../PROGRESS.md).
- CR-107 is complete under its owner authorization. P32-A/B/C screenshot
  capture is cancelled because the owner supplied all 23 images; all are
  committed in versioned repository paths. All 46 blob/raw URLs returned
  HTTP 200, raw sizes matched, the three release-body screenshot sections
  were updated and only the 23 screenshot assets were removed. The three
  APKs remain unchanged. P22-A-R1 provides six deterministic months, Rs 1 lakh
  earned income/month, Rs 1 crore in assets and Rs 10 lakh in liabilities;
  P28-G standardized phase labels and added the ledger-derived glossary.
  Final verification passed all six ordered gates: 98 suites, 1,278 passed,
  1 skipped; 95.96/92.04/98.02/97.63% overall coverage. The detailed demo
  before/after table, goal percentages, PR SHAs and APK sizes are in
  [PROGRESS.md](../PROGRESS.md). Directly seeded holding openings are an
  explicit sample-data assumption. The v1.1.1 APK does not contain the demo
  change. The owner reports physical-device rendering at font scales 1.3 and
  2.0 passed on 2026-11-11.
- The owner-approved v1.1.1 patch release was published on 2026-11-09. The
  app, package and lockfile versions are aligned to 1.1.1. All six ordered
  gates passed on the release candidate: 98 suites, 1,271 passed, 1 skipped;
  TypeScript, lint, Expo Doctor 21/21, Android export and iOS export also
  passed. Release PR #69 merged to `main`; back-merge PR #70 integrated it
  into `develop`. Post-publication record updates were integrated through
  PRs #71-#74. Tag `v1.1.1` still points to the original main release merge.
  A fresh audit fetched all 36 remote branches: every branch tip is reachable
  from `develop`, the v1.1.1 release branch is reachable from `main`, and no
  open PRs remain. The `main`, `develop` and v1.1.1 release branch trees
  match; the stale local `main` branch was fast-forwarded to `origin/main`.
- Release policy review confirmed the agent-run EAS
  `eas build --platform android --profile android-apk` and GitHub draft upload
  were already required. The guide and shared rules now explicitly prohibit
  waiting for or asking the owner/developer to provide an APK or local APK
  path. A documentation regression test guards the handoff requirement.
- The owner-provided APK for EAS build
  `ecc97480-7229-41ac-8aad-64ea2cd255b5` finished with app version 1.1.1,
  Android `versionCode` 2 and profile `android-apk`. Its bytes match the EAS
  artifact, owner-provided APK and published 112,150,605-byte asset
  `WealthWise-android-latest-v1.1.1.apk`. The latest URL returns HTTP 200 at
  the expected size; no digest is recorded here.
- N44 is owner-reported Pass. The 23 screenshots are being moved from GitHub
  Release assets into `docs/releases/screenshots/vX.Y.Z/` as
  `WealthWise-vX.Y.Z-screenshot-<screen>.png`; release-body updates and
  screenshot-asset deletion are pending the authorized main merge and URL
  verification. The README gallery points to the v1.1.1 screenshots. The
  existing screenshot URL checks predate the new repository links. The v1.1.0
  APK was renamed to its versioned filename after publication; the v1.1.0 and
  v1.0.0 versioned APK URLs return HTTP 200 at their expected sizes. The
  release prompt heading sequence is corrected, including “Generate Release
  Notes” as 9. Focused documentation tests and release evidence are recorded
  in the progress ledger; the six app gates were not rerun for this
  docs/assets revision.
- Direct comparison confirms the v1.1.0 source tree contains the P30
  persistence repair and its SQLite storage implementation matches current
  develop; v1.0.0 predates that repair.
- Owner roadmap decisions: accessibility means a statement plus audit
  checklist, not new app features. The owner supplied all 23 versioned
  screenshots, so no additional capture or capture script is needed. The
  repository-backed galleries and browser-viewable links are part of CR-107;
  screenshot asset removal awaits post-main URL verification.
  Release-note Contributors sections were removed. The updated rule requires
  owner approval, full note completion and moving the note to `published/`
  before GitHub draft creation; after draft creation, the agent builds with
  EAS `android-apk`, uploads and verifies the APK. The owner-run v1.1.1 build
  already in progress is handled as an exception without starting a duplicate.
  Widgets, quick capture and SMS/notification detection are Planned with their
  owner/research gates retained; Notes includes text, recordings, photos and
  videos; skeleton loading is planned as P38. Details and safeguards are in
  [open-items.md](open-items.md) and [PROGRESS.md](../PROGRESS.md).
- P28-F-R4-R1-R1-R1-R1-R1 release-asset revision: the release naming and
  latest-published rules, screenshot embeds and release bodies are aligned;
  the local screenshot folder and temporary asset/APK copies are removed.
  The focused documentation tests and all six ordered gates pass. Task PR
  #64 merged into P28 as `dd8c6b6`; Phase PR #65 carries the change to
  `develop`. The follow-up release workflow is now complete: v1.1.1 is
  published and latest, and v1.1.0 uses its versioned APK asset.
- Current instruction update: P20-S-R1-R1 adds R5 to
  [AGENTS.md](../../AGENTS.md) at the owner's request. When owner edits follow
  agent changes, ask before changing the affected file; revert or overwrite
  those edits only on explicit request. Commit `e955021` is merged by task PR
  #44 into P20; phase PR #45 is the promotion to `develop`. Details are
  recorded in [PROGRESS.md](../PROGRESS.md).
- P28-E-R3 records the selected P25-F, v1.1.0 merge and P1 commits as
  ancestry through `task/P28-E-R3-record-selected-ancestry` and
  `qa-and-release` (historical branch name: `phase/28-qa-and-release`). The ancestry merges preserve the captured
  `develop` tree; the task adds only ledger/memory documentation and a ledger
  test. PR #47 merged to P28 and PR #48 merged to `develop`; no
  application source or `main` changes were included.
- P28-E-R4 connected the complete `history/by-phase` ancestry through task PR
  #49 (`7f9221a`) and P28 PR #50 (`b5dbe5f`) to `develop`. The `ours`
  merge preserves the captured application tree; every remote branch tip is
  reachable from `develop`. `main` and `release/v1.1.0` remain unchanged.
- P28-E-R5 audits the 403 non-merge first-parent commits after the initial
  commit: all are already present in `main` and `develop`, and 84 legacy
  subjects do not match the current Conventional Commit hook. No historical
  messages or hashes were changed because that requires rewriting history.
  The new `release/v1.0.0` branch points to the existing tag target
  `cac6fed`; it is already an ancestor of `main` and `develop`. The audit
  record's task PR #52 merged into P28 as `f9bb715`, and P28 PR #53
  merged into `develop` as `0402592`. P28-E-R5-R1 records the completed
  integration and verifies `main` and both release branch refs remain
  unchanged.
- Current integration: P28-D, P28-C-R4, P28-E, P20-A-R1, P20-N-R2,
  P29-AB-R2, P29-O1-R1, P29-W-R1, P28-F-R1/R2 and the P30 work are
  integrated into GitHub `main` and `develop`. P28-E-R4 is integrated into
  `develop` only and did not change `main`. `develop` began at main baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d`, which contains legacy
  unreleased Release 2 history; the stable-main rule applies prospectively.
  The earlier P28-E authorized pushes verified `main`, `develop`, all 30 phase
  branches, `history/by-phase`, and all 30 phase completion tags at that time.
  The `v1.0.0` tag was not changed; no force push was used.
- Release 2 PRs #1-#7 follow the chronological flow: P28 to develop (#1),
  release to main (#2), main back to develop (#3), audit task to P28
  (#4), P28 to develop (#5), release branch to main (#6), and main back
  to develop (#7). The contributor-credit correction and owner-reported
  N39-N43 results are on main and develop; the audit records are carried
  through the same release/back-merge path.
- GitHub branch audit found 35 remote heads after P28-E-R5: main, develop, the
  read-only `history/by-phase` archive, all 30 phase branches, and release
  branches `release/v1.0.0` and `release/v1.1.0`.
  Publication PRs #11-#15 are merged in order; their task branch was deleted
  and `qa-and-release` (historical branch name: `phase/28-qa-and-release`) was retained.
  `phase/25-release-and-backups` remains outside this Release 2 PR chain.
  P28-E's final-verification commit was reconciled in P28-E-R2; at that time
  the separate `codex-changes` branch was under review. The later owner
  decision recorded below supersedes that status: the branch was deleted and
  no work is to be ported.
- The v1.1.0 release-tree gates passed before publication. The clean
  2026-11-09 develop preflight at `c939458` passed all six ordered gates;
  Gate 1 had 98 suites, 1,268 passed and 1 skipped, with 95.96/92.04/98.02/
  97.63% overall coverage (statements/branches/functions/lines),
  `src/data` 91.03/87.41/94.46/94.17%, `src/domain`
  96.94/92.87/98.80/98.33%, and `src/lib` 100% in all four measures.
  TypeScript and lint pass; Expo Doctor is 21/21; Android and iOS exports
  succeed. No new EAS or Gradle build was run.
- Previous task P20-S-R1 applied the owner-requested form-control conversion
  and visible-title pass. App-form ChoiceField usages are Dropdowns;
  ChoiceField remains and filters are unchanged. Editable text, money, number
  and percent controls without a visible title now have persistent
  single-line titles; existing Dropdown, SwitchRow, ReadOnlyRow and already
  titled date controls are preserved. SegmentedControl title props remain
  absent at the owner's direction; no editable input was replaced with
  ReadOnlyRow. Owner approved commit/merge. Working branch:
  `task/P20-S-R1-form-choicefields-labels`. Final gates, test totals and
  integration PRs are recorded in `docs/PROGRESS.md`. Implementation commit
  `d36103e` is in PR #42 (task to phase); PR #43 promotes the phase to develop.
  At that close-out, physical-device rendering was unverified; the owner
  later reported it passed on 2026-11-11.
- P20-S-R1 final-tree validation: all six ordered gates exit 0. Coverage:
  98 suites, 1,267 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall
  (statements/branches/functions/lines), `src/data`
  91.03/87.41/94.46/94.17%, `src/domain` 96.94/92.87/98.80/98.33%,
  and `src/lib` 100% in all measures. Expo Doctor is 21/21.
- Previous task: P20-A-R2 repairs Paid on a linked one-time manual savings
  Budget row. The pre-fix component reproduction confirmed that a link present
  only in a viewed-month snapshot fell through to a generic transaction;
  category-matched actuals hid the missing holding entry. The shared
  clearDue/undoClearDue path now creates one Deposit and one linked invest
  transaction in one persisted write, and exact Undo removes both in one
  write. Store tests cover Savings account, Cash and Other manual holdings at
  exact, lower and higher amounts. No schema/version/release change was made.
  Final ordered gates on the develop-synced phase tree all exit 0: 98 suites,
  1,267 passed and 1 skipped; overall coverage 95.96/92.04/98.02/97.63%
  (statements/branches/functions/lines). `src/data`:
  91.03/87.41/94.46/94.17%; `src/domain`: 96.94/92.87/98.80/98.33%;
  `src/lib`: 100% in all four measures.
  TypeScript, lint, Expo Doctor 21/21, Android export and iOS export pass.
  N44 is owner-reported Pass on a physical device; no feature from planned or
  held P31–P38 has been started. Owner decisions are listed in
  [open-items.md](./open-items.md), with full evidence in
  [PROGRESS.md](../PROGRESS.md). Integration route: task PR #40 merged into
  P20; phase PR #41 carries the synchronized branch to develop after
  sync merge `6982ff2`.
- Ordered release-branch gates on `release/v1.1.0`: all six exit 0. Gate 1
  has 98 suites, 1,242 passed, 1 skipped; coverage is 95.96/92.01/98.01/97.62%
  overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain`
  96.95/92.85/98.80/98.32%, and `src/lib` 100%; Expo Doctor is 21/21.
- Commit-subject enforcement is active: the POSIX hook requires supported
  Conventional Commit types and rejects placeholders. Its reason is to keep
  scope explicit and unrelated changes separate. Enable it with
  `git config core.hooksPath .githooks`; hook and documentation tests pass.
- Release 2 code changes are complete: recurrence-aware income summaries and
  editable non-due rows, verified persistence-source precedence, shared paid
  sync/Undo, capped Entries schedules, and the restored aggregate Pace graph
  without the stacked bar. The owner reported N39-N43 Pass and the checklist
  records those results. Device model, Android version and tester fields remain
  blank. P28-F release preparation and integration are complete on
  `release/v1.1.0`; v1.1.0 is published with the required README Download
  parity, release notes and build-history record. The owner-approved
  `preview` profile and reused versionCode 1 exceptions are documented.
- CR-124 historical APK profile documentation: v1.0.0 and v1.1.0 published
  release notes and release-history records are updated to explicitly identify
  their direct APK downloads as preview build APKs (built with EAS `preview`
  profile and versionCode 1) rather than production builds, while v1.1.1 and
  v1.2.0 distribute production `android-apk` builds with incremented version codes.
- P28-E archive evidence: 337 direct plus 175 date-fallback mappings; zero
  unmapped hashes, 512 unique original commits, and 131 synthetic archive
  commits. Its tree matched `main` at the original verification point; the
  current archive tree is an older snapshot, not the current `main` tree. The
  later route-diagnostic and ledger revisions are outside the read-only
  snapshot. Full details are in
  [PROGRESS.md](../PROGRESS.md).
- P28-F-R3-R2 corrected historical downloads: the v1.0.0 asset is now
  `WealthWise-android-v1.0.0.apk` at its version-specific URL, and the GitHub
  release body matches the canonical checksum-free note. The former generic
  v1.0.0 URL returns 404; the versioned URL returns HTTP 200 with its expected
  size.
- P28-F-R3-R3 names the current v1.1.0 APK
  `WealthWise-android-latest-v1.1.0.apk`; its README/note/release-body links
  and release-history entry match. Both latest-route and versioned v1.1.0
  links return HTTP 200 at 112,147,677 bytes; v1.0.0's versioned link returns
  HTTP 200 at 112,133,413 bytes. The changes reached `main` and `develop`
  through PRs #21-#25: task to P28, P28 to develop, develop to
  `release/v1.1.0`, release to main, then main back to develop. Remote trees
  for main, develop, release and P28 are identical; the tag was not
  changed.
- P29-O-R1 closes the only uncompleted P29 implementation row. The
  proposed ledger-only migration was explicitly cancelled as unnecessary;
  P29-O1's accepted unified holding workflow remains. P29 is 41/41 after
  the close-out. The owner reports P29-O1's physical-device checks passed on
  2026-11-11.
- The owner directed deletion of local `codex-changes` (`d033d6a`). Its
  October schema-v2 loan/liability alternative is stale against schema v23,
  modifies the protected Home screen, includes generated coverage and has
  unsafe migration behavior. It was never merged; nothing is to be ported or
  pushed.
- Protected hashes reverified with `git hash-object`: Budget
  `b60f77af4f76d47f2cee07393fe9d8f3fa6bd04c` and Home
  `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`. Current values and
  device/release follow-ups are recorded in [open-items.md](open-items.md).
- Phase tag targets `phase-28-complete` and `phase-29-complete` remain behind
  the latest commits on their phase branches. The owner directs retaining
  these historical tags; they were not moved.
- Branch audit (2026-11-08): the chronological PR path carries the task
  correction through P28, develop, the release branch and main, then
  back-merges main into develop. The relevant branch refs are verified in the
  GitHub PRs. The v1.1.0 tag points to the verified EAS source commit and its
  GitHub release is published. `phase/25-release-and-backups` remains outside
  the Release 2 chain; `history/by-phase` is a read-only archive. P28-E's
  final-verification commit `72fb325` is preserved by P28-E-R2, with its
  stale status edits reconciled instead of merged verbatim. The earlier note
  that `codex-changes` awaited a safe port is superseded by the owner's
  2026-11-11 decision: the branch was deleted, no work is to be ported, and no
  unsafe branch content was pushed.
- P28-F-R2 contributor-credit correction and owner-reported device results
  are integrated through PRs #1-#3. P28-F-R2-R1 audit records use PRs #4-#7
  to follow task -> P28 -> develop -> release -> main -> develop.
  P28-F-R3 published v1.1.0 after the owner uploaded the verified APK; PRs
  #11-#15 complete task -> P28 -> develop -> release -> main -> develop.
  The remote trees for main, develop, release/v1.1.0 and P28 are
  identical; the tag remains at the verified build source.
- P29-O1-R2 and P29-W-R2 align recurring-asset and liability completed/pending
  month counts in two-column summary cells and sort pending schedule rows with
  dated entries (newest first). Route regressions pass at font scales 1.0,
  1.3 and 2.0; all six ordered gates exit 0. Gate 1 on the reopened P29
  branch: 98 suites, 1,242 passed, 1 skipped; coverage is
  95.96/92.01/98.01/97.62% overall, `src/data`
  91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, and
  `src/lib` 100% in all measures. No schema change. Task commit `601a731` and
  P29 merge `22a0ec4` are included in GitHub main/develop through the
  Release 2 PR chain. Physical-device verification was pending at that time;
  the owner later reported it passed on 2026-11-11.
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
- Current schema version: v24 (`SCHEMA_VERSION` in `src/domain/schemas.ts`);
  P20-W-D3 added the v23→v24 migration. Earlier P29-AB work described below
  introduced schema v22.
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
  An earlier owner checklist marked all 43 rows Pass; subsequent Release 2
  verification superseded N39-N43, which the owner has now reported Pass again.
  No build, submission, GitHub release-body edit or branch push was made in
  that earlier task.

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
  [PROGRESS.md](../PROGRESS.md); the owner reports the physical-device checks
  passed on 2026-11-11, as recorded in [open-items.md](open-items.md).
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
  proposed schema-v19 model and delivers the accepted presentation/derived
  invested display on the existing holding model. P29-O-R1 closes the proposed
  migration under the P29-S owner decision; the original inventory remains
  historical. See [PROGRESS.md](../PROGRESS.md).
- P29-N remains complete. Transactions no longer shows the Review-month link;
  Budget's independent month routing and Home remain unchanged. The one-time
  reminders prompt is mounted inside `LockGate` and stores its handled flag in
  the existing metadata store, not AppData. The P24-A supersession is recorded
  in [PROGRESS.md](../PROGRESS.md).
- P29-L Insurance implementation and migration remain complete. Home was
  inspected read-only: it imports `policySummary` for its Insurance box and
  generic pending dues for Upcoming and due; it does not depend on cover goals.
  `app/(tabs)/index.tsx` remains user-owned and was not edited.
- P29 status: P29-O2 is Cancelled by the owner; P29-S, P29-T, P29-U,
  P29-V and P29-W are Done. P29-M is
  Superseded by P29-M2; P29-O is superseded by P29-O1/P29-S and closed by
  P29-O-R1. P29-O1 remains Done. P29-S makes no behavior or schema change.
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
- CR-108 baseline: 101 suites, 1317 tests (1316 passed, 1 skipped) on
  2026-11-11; all six CR-108 gates exited 0.
- Test counts: 106 suites, 1449 tests (1,448 passed, 1 skipped) on
  2026-11-22.
- Latest validated run: 106 suites, 1449 tests
  (1,437 passed, 1 skipped) on 2026-11-22 on the documentation task tree, which shares the D3 tree. Gate 1
  coverage was 96.08/92.35/98.22/97.71% statements/branches/functions/lines;
  Gates 1–3 and 5–6 exited 0. Gate 4 exited 1 because `npx` could not resolve
  `expo-doctor` from `registry.npmjs.org` (`ENOTFOUND`). D3 uses v24; P36-A/B
  are replanned to v25. O69–O74 remain Not run.
  Coverage and exact commands are recorded in [PROGRESS.md](../PROGRESS.md).
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
- Coverage and UI tests are simulated and distinct from device evidence. The
  owner reports all listed physical-device checks passed; see
  [open-items.md](open-items.md) for scope and provenance.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth
  for decisions, status, acceptance evidence, gates and device checks.


## Earlier reconciliation (2026-11-22, snapshot exported 11:12:56 IST)

- `develop` is `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db`; `phase/20-budget` is
  `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`. D3 task tip
  `5424171b5eee69dc70606c8664da2e2f5c3f2e71` and both remote branch tips have
  tree `e56c0b89c671ff3c23bdd96886bfd2d8090f45cc`. Schema v24 and
  `.premigration.v23` migration/archive handling are present.
- Snapshot contains 183 PRs, zero open PRs and zero issues. #39 is closed
  unmerged; every other PR number from #1 through #183 is merged. The remote
  branch snapshot contains 42 refs: phase branches are retained and merged
  task branches are absent. There are 51 tags; the four `v1.*` release tags
  match `docs/releases/release-history.md`. GitHub lists v1.2.0 as latest,
  published 2026-11-10T20:38:40Z, consistent with the release history.
- PR #181's corrected body and comment #7067953238 are confirmed; PR #179's
  Gate 4 comment #7067676816 is confirmed. Both failed PR-create attempts and
  the owner Gate 4 outputs are documented in the ledger from the reconstructed
  terminal paste and supplied capture files. The 00:29 phase exit remains not
  captured; 00:51 develop and 01:17 D3 task runs exited 1 (20/21; six SDK 57
  patch mismatches).
- Current documentation-task Gate 1 passed: 105 suites, 1,437 passed, 1
  skipped (1,438 total); focused docs/ledger/memory checks pass (3 suites,
  37 tests). Gates 2–3 and 5–6 exit 0. Gate 4 was invoked once in the previous
  run but did not return a captured code; it was not rerun. Protected-file
  hashes match `docs/memory/rules.md`.
- Device checks O61–O74 remain Not run. Owner still needs to perform those
  checks and push/open/merge this documentation task through its task PR and
  documentation-to-develop PR, then run CM-2. P20-A-R3's exact device
  reproduction remains unknown.


## Current reconciliation (2026-11-22, snapshot exported 11:39:32 IST)

- PR #184 merged the remote task branch into `documentation` at
  `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea` at 11:34:08 IST / 06:04:08 UTC;
  `mergedBy` is `sahilsheikh-dev`. PR #185 merged `documentation` into
  `develop` at `a946baff7793e7485b54cb363048f7906983574c` at 11:34:59 IST /
  06:04:59 UTC; `mergedBy` is `sahilsheikh-dev`. `origin/develop` agrees with
  the snapshot develop SHA.
- PR #184's head OID is `c14fc2a420f0efc791813ab5cc2f42d0a15ef5fc`;
  `origin/documentation` is `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea`. Exact
  push actions/times are not in the terminal recording; remote refs and PR
  head OIDs establish the published tips. Correction (2026-11-22): this refers
  to the 2,188-byte script(1) recording; reconstructed terminal paste records
  `documentation` pushed at 11:33:08 IST and the task branch at 11:33:15 IST,
  plus PR #184/#185 and CM-2. The script log itself is incomplete and does not
  contain those commands.
- The `script` log records a session from 11:13:17 to 11:37:46 IST but contains
  no Git/PR commands. `gate4-develop-after185.txt` shows 20/21 and the six
  known SDK 57 patch mismatches; no exit code is printed, so Gate 4 exit is
  not captured. Correction (2026-11-22): this is true of the output file; the
  reconstructed terminal paste shows exit 1 at 11:40:11 IST, while the file
  has no exit code because the command had an unterminated quote. This agent
  continuation performed no network action.
- The repository contains 187 PRs, zero open PRs and zero issues; #39 remains
  the only closed unmerged PR. PR #186 merged `task/docs-device-checklist-by-release`
  into `documentation` at `001df8b812e0b2c990137f22747be4d0e5cfd2a1` at 12:42:48 IST;
  PR #187 merged `documentation` into `develop` at `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6`
  at 12:43:16 IST. Local `develop` and `origin/develop` match at `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6`.
  Gate 4 exits 0 (21/21 checks passed, no issues detected). The prior Gate 4 exit 1 exception on six SDK 57 patch mismatches was cleared by task cleanup-expo-sdk57-patch-align.
  Device checklist is merged to `develop` (78 rows, release gate rule).
  The owner reported physical-device validation for O61–O74 on 2026-11-22 as Pass.
  All 78 rows in the device checklist now Pass; the release gate is unblocked.


## Current task — CR-119 device checklist by release (2026-11-22)

- Branch: `task/docs-device-checklist-by-release`; local task base is sync
  commit `25c7b29d8fc3a2e7e6ecfe1660b6b9f32e385098`. Test-first commits are
  `1d9b574` (expected failure on old versioned H1), `9864859` (pin all 78
  original IDs), `7221ba5` (CR-119/policy regression), `c7eb5e1` (range punctuation correction), and `26f7a92` (full shared wording checks).
- The checklist now has Next release O61–O74 first, then published v1.0.0,
  v1.1.0, v1.1.1 and v1.2.0 sections in ascending order. Every check row's
  ID, Test, Result and Notes matches the pre-change baseline by ID. The
  v1.0.0, v1.1.0, v1.1.1 and v1.2.0 assignments follow release-history dates,
  tags and ledger entries; none is uncertain.
- The release gate blocks release work for every non-Pass row in every section.
  O61–O74 remain Not run and block the next release. No owner waiver is
  recorded. Focused ledger suite passes after the checklist and gate changes.
- Final six gates: Gate 1 exit 0 (105 suites, 1,439 passed, 1 skipped); its
  initial Watchman attempt exited 1, then passed with `--watchman=false`. Gates
  2–3 exit 0. Gate 4 is not captured because local-only forbids network; the
  supplied post-#185 owner output is 20/21 with six known SDK 57 patch
  mismatches, but no exit code was captured. Correction (2026-11-22): no exit
  code appears in the output file, but reconstructed terminal paste shows
  owner-run exit 1 at 11:40:11 IST. Gates 5–6 exit 0. All six
  protected-file hashes match; `package.json`, `package-lock.json` and
  `app.json` have no diff against `develop`.
- This is local-only work: no network, push, PR, merge, release, tag or build
  was performed. Device checks O61–O74 remain Not run and block the next
  release.


## Current task — DOCS-R8-LOG-CORRECTIONS (2026-11-22)

- Branch: `task/docs-device-checklist-by-release`; expected starting HEAD
  `a914ab17b8768465cb91245dbefec0b5ddcd19e8`. Corrected the Owner-run actions
  log with reconstructed terminal evidence and the refreshed remote snapshot.
  The script(1) recording is incomplete: its 2,188 bytes contain shell start,
  prompt and exit only; reconstructed segments 7–8 contain the pushes, PR
  operations, CM-2 and Gate 4 absent from that recording.
- The supplied PR snapshot and reconstructed terminal paste agree on PR #184/#185
  merges and branch state. CLI prompt observations may occur after snapshot API
  `createdAt`/`mergedAt`; the ledger keeps snapshot timestamps authoritative
  and records terminal observations separately.
- Focused ledger/memory tests: 3 suites, 39 tests passed. Gate 1 exit 0 (105
  suites, 1,439 passed, 1 skipped); Gates 2–3 exit 0; Gate 4 not run locally
  because this task prohibits network access. The owner terminal paste records
  Gate 4 exit 1 at 11:40:11 IST / 06:10:11 UTC, 20/21 with six known SDK 57
  patch mismatches; the output file itself has no exit code. Gates 5–6 exit 0.
  Protected hashes match and package/config diff against `develop` is empty.
- Local only: no network, push, PR or merge. O61–O74 remain Not run and block
  the next release; owner PR flow remains pending.


## Current task — cleanup-expo-sdk57-patch-align (2026-11-22)

- Branch: `task/cleanup-expo-sdk57-patch-align`; standalone lifecycle: `cleanup`.
- Aligned Expo SDK 57 patch dependencies: `expo ~57.0.33`, `expo-constants ~57.0.24`, `expo-linking ~57.0.14`, `expo-router ~57.0.31`, `expo-sharing ~57.0.26`, `expo-sqlite ~57.0.5`.
- All six gates passed with exit 0; Gate 4 now passes with exit 0 (21/21 checks passed, no issues detected).
- Six protected-file hashes match. No application code or schema changed.
- Device checks O61–O74 remain Not run and block releases.


## Current task — docs-device-checks-pass-o61-o74 (2026-11-22)

- Branch: `task/docs-device-checks-pass-o61-o74`; standalone lifecycle branch: `documentation`.
- Recorded owner-reported physical-device validation Pass for checks O61–O74:
  - O61–O64: Searchable shared Dropdown keyboard usability, polite screen-reader announcements, clear tap target (44x44 pt), and font scale 1.3/2.0 layout (P20-S-R2).
  - O65–O68: Emergency Fund target edit/save, Undo toast timing, Home/Goals refresh, and font scale 1.3/2.0 layout (P21-F).
  - O69: Invest transaction neutral category and holding selection derivation (P20-W D1).
  - O70: Expense Budget category picker, derived section, and custom category entry (P20-W D2).
  - O71: Custom earned-income type entry, trimming, persistence, and reopening under schema v24 (P20-W D3).
  - O72: Transaction form scrolling, validation, category picker, and font scale 1.3/2.0 layout (P20-W).
  - O73: Spend/Invest/Income item edit/delete persistence across single/following scopes and device restart (P20-U-R1).
  - O74: Linked one-time savings Budget item marked Paid from Transactions, holding deposit, Budget actual, and Undo (P20-A-R3).
- Device model, OS version, and tester details were not supplied and remain blank.
- All 78 rows across all 5 sections of the device checklist now Pass.
- The release gate is unblocked for candidate builds.


## Current task — docs-device-checklist-metadata-rules (2026-11-22)

- Branch: `task/docs-device-checklist-metadata-rules`; standalone lifecycle branch: `documentation`.
- Recorded physical device metadata across all 5 sections of `docs/releases/device-test-checklist.md`:
  - Device model: `realme Narzo 60 Pro 5g`
  - Android version: `15 Vanilla Ice Cream`
  - Tester: `sahilsheikh-dev`
  - Dates: `2026-11-22` (Next release), `2026-11-07` (v1.0.0), `2026-11-08` (v1.1.0), `2026-11-09` (v1.1.1), `2026-11-11` (v1.2.0).
- Updated Notes across all Pass checks to record owner-reported physical-device verification as of the respective release date.
- Updated device checklist maintenance rules across all policy documents (`device-test-checklist.md`, `rules.md`, `AGENTS.md`, `README.md`, `RELEASE_PROMPT.md`, `release-config.md`, `build-config.md`) requiring agents to prompt the owner to confirm all metadata fields (Device model, Android version, Tester username, and Date) with suggestions based on previous releases data before making changes.


## Current task — P7-plan-cloud-backup (2026-11-22)

- Branch: `task/P7-plan-cloud-backup`; phase branch: `phase/07-cloud-backup`.
- Recorded Phase P7 — Cloud Backup (Google Drive) as Planned across repository ledgers, memory, and roadmap under Rule R7 (empty slot adjacent to P6 Backup & Security).
- Planned subtasks (all Planned; Evidence: not started):
  - P7-A: Research Google Drive REST API (v3) appDataFolder scope, Expo SDK 57 Google OAuth2/Sign-In integration, and background scheduling (expo-background-fetch / Android WorkManager) with Wi-Fi gating.
  - P7-B: Pure domain model for cloud backup scheduling (frequency: daily / weekly / monthly / manual, retention policy, zero-knowledge local passphrase encryption before upload).
  - P7-C: UI & settings in Backup / Security screen (Connect/Disconnect Google Drive, last backup status/timestamp, frequency picker, Wi-Fi only toggle, "Back up now", and "Restore from Google Drive" flow).
  - P7-D: Deterministic demo data, offline fallback, token revocation handling, unit tests, and device checklist rows.
- Planning-only task: no application code, no dependencies, no schema change.


## Current task — P43-B-delete-non-release-tags (2026-11-22)

- Branch: `task/P43-B-delete-non-release-tags`; phase branch: `phase/43-lifecycle-and-transaction-planning`.
- Executed P43-B per explicit owner approval: deleted all 47 non-release and legacy phase tags locally and on remote `origin`, keeping exclusively the 5 verified release tags (`v1.0.0`, `v1.1.0`, `v1.1.1`, `v1.2.0`, `v1.3.0`).
- Updated Rule R3 across `AGENTS.md`, `docs/memory/rules.md`, and `docs/PROGRESS.md` to establish that only `vX.Y.Z` release tags are maintained in the repository and non-release tags are prohibited.
- Updated `PROGRESS.md`, `open-items.md`, and `progressLedger.test.ts`.

