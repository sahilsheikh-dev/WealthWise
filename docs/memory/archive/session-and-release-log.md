> Canonical current ledger: [docs/PROGRESS.md](../../PROGRESS.md) | Archive index: [README.md](README.md)

# Archived Session and Release Log (Pre-2026-11-22)

### P20-U-R1 — Budget edit/delete defect (2026-11-21)

- The explicit owner authorization supersedes CR-115's earlier “Don't start
  working on this” instruction. Work stays in P20 as the next revision of
  completed P20-U (R2).
- Read-only matrix: 60 edit and 12 delete cells covered Spend, Invest and
  Income; one-time and recurring entries; name/value/amount/start month/
  frequency/due day; and month/following scopes. Four following-scope Income
  schedule cases reproduced: start month and frequency changes for one-time
  and recurring income. The plan changed and persisted, while the selected
  month snapshot and form stayed stale. No delete failure reproduced.
- Root cause is the `scheduleChanged` branch in `src/domain/budget.ts`, which
  returned the old month row; `app/budget-income-form.tsx` reads that row via
  `effectiveMonthBudget`. The fix updates the matching income in both the plan
  and selected month. No schema change; code says v23, despite AGENTS.md's v22
  statement.
- Red test commit `c7ff3a6` (four store cells plus route form); fix commit
  `2dc72b5`; ledger test commit `db4c338`. Focused Budget/domain/store/route
  suites pass (4 suites, 358 tests). The old frozen-snapshot assertion was
  replaced with an assertion requiring the schedule to update in the selected
  month; this is documented in the verification matrix above.
- Ordered gates: 1 `npm test -- --coverage --watchman=false` exit 0 (103 suites, 1,374 passed, 1 skipped); 2 `npx tsc --noEmit` exit 0; 3 `npx expo lint` exit 0; 4 `npx expo-doctor` exit 1 (`ENOTFOUND registry.npmjs.org`; no retry); 5 Android export exit 0; 6 iOS export exit 0. Coverage: domain 98.32% lines/92.99% branches; pure src/lib 100%/100%; src/data 94.20%/87.47%.
- O73 was added for physical-device edit/delete and restart persistence and is
  Not run.

### P20-A-R3 reproduction checkpoint (2026-11-21)

- Reviewed the Transactions pending-row path, shared `PendingItemActions`,
  `pendingItems`, `budgetLineActual`, `clearDue`/Undo, Home, Budget,
  `/payment-confirm`, and reminder due boundaries. H1 is not supported by
  current source/tests: Budget pending sources preserve month and holding ID.
  H2 is not supported by current source/tests: holding-entry transactions are
  included in the explicitly linked Budget line even when their generated
  transaction category differs. H3 is not supported by current source/tests:
  recurring-plan due rows are generated only for plan-kind holdings, while the
  Budget-linked manual-holding path uses a holding target. These remain
  hypotheses absent a failing owner reproduction.
- Existing real-store coverage exercises exact/lower/higher payments for
  Savings account, Cash and Other holdings; one Deposit, one linked invest
  transaction, matching Budget actual, one persisted write, and exact Undo all
  pass. Existing domain coverage rejects Fixed Deposit. The shared
  `PendingItemActions` component test passes for a linked manual Budget row.
  Focused command `npm test -- --runInBand
  src/data/__tests__/createAppStore.test.ts
  src/components/__tests__/PendingItemActions.test.tsx
  src/domain/__tests__/pending.test.ts src/domain/__tests__/dues.test.ts`
  exited 0 (4 suites, 195 tests). Focused ledger/memory tests initially
  terminated in Watchman with `fchmod ... Operation not permitted`; rerun as
  `npm test -- --runInBand --watchman=false
  src/lib/__tests__/progressLedger.test.ts
  src/lib/__tests__/memoryDocs.test.ts` exited 0 (2 suites, 33 tests).
  `git diff --check` exited 0. No per-route regression tests or application
  edits were made; full gates and physical-device checks were not run. The
  planned P20-A-R3 remains open until the reported Transactions failure can be
  reproduced; the exact user's triggering data/steps are still needed.

### P20-A-R3 continuation (2026-11-21)

- Owner reproduction fields remained blank. S1 used the real store action to
  create a linked one-time Savings Budget row, persisted it, rehydrated a new
  store, rendered the shared Paid action and verified one Deposit, one linked
  holding-entry invest transaction, matching actual, one persisted write and
  exact Undo. Existing exact/lower/higher × Savings/Cash/Other tests also pass;
  Fixed Deposit remains rejected.
- S2 real-store matrix covered the link in the plan only, month snapshot only,
  both places, and neither place with a matching category; current and different
  viewed months were tested. Before the fix, plan-only lost the holding target
  when the snapshot omitted the link, while snapshot-only in another month did
  not contribute the deposit to the linked Budget actual. H1 is confirmed for
  plan-only; H2's cross-month attribution symptom is reproduced, but the generic
  `Other investments` transaction category alone is not the cause once the
  holding link is resolved; H3 is refuted for recurring Budget items linked to
  manual one-time holdings.
- S3 creates with following scope, edits only the current month, and pays from
  the later month. S4 exercises persistence rehydration, plain-backup import
  migration envelopes v20–v23, and demo data; the backup envelope tests use
  current-shaped data rather than separate archived historical user backups.
  S5 renders the real Transactions pending row and `/payment-confirm` route,
  and tests a cold-start reminder tap through to `/payment-confirm`. Home's due
  list filters to `kind === 'due'`; Budget has no Paid action for a Budget
  pending row, so neither is an entry point for this action. Home source was
  read only; `app/(tabs)/index.tsx` was not edited.
- Test-first red regression commit `d10fd82` failed as expected (1 suite, 7
  tests; 4 failed and 3 passed). Expanded real-store/route integration suite
  passes 18 tests; adjacent store/domain/route suites pass 8 suites and 489
  tests. Full Gate 1 exited 0: 103 suites, 1,387 passed, 1 skipped, coverage
  96.00/92.23/98.09/97.66% statements/branches/functions/lines. Gate 2 exited
  0. Gate 3 first exited 1 on Jest-hoisted mock lint, then exited 0 after the
  test-only cleanup. Gate 4 `npx expo-doctor` was run once and exited 1 because
  `registry.npmjs.org` could not be resolved (`ENOTFOUND`). Gate 5 Android
  export exited 0; Gate 6 iOS export exited 0. After adding stronger route
  Undo assertions, the integration suite, TypeScript and lint were rechecked
  and passed; Gate 4 was not rerun. O74 is Not run on a physical device.
- Commits: test-first regression `d10fd82`; characterization expansion
  `404c0c3`; domain fix `3edd025`; test lint cleanup `62d1a43`; route Undo
  assertions `f115bde`; ledger test updates `123b301`/`09b3a14`; memory test
  update `1774ad1`. Documentation close-out and final git evidence follow in
  this same task commit. Task/phase PR integration remains pending until Gate 4
  succeeds. The exact PR and `--no-ff` merge commands are in the final report.

### INTEGRATE-LOCAL-P20-U-R1 — local phase sync and task merge preparation (2026-11-22)

- Synced `phase/20-budget` with the local `develop` tip using no-ff merge
  `cb363423384923ef19f00399cd380baba01e9e59` (`chore(P20): sync
  phase/20-budget with develop`). The local develop commit was PR #179; no
  remote fetch, push, PR, or remote merge was performed in this task.
- Merged the phase into `task/P20-U-R1-budget-edit-delete`. Text conflicts in
  this ledger, `docs/memory/status.md`, and the device checklist retain both
  P20-U-R1 and P20-A-R3 findings/status; O73 and O74 remain unique and Not run.
  `docs/memory/open-items.md`, project summary and ledger/memory tests merged
  automatically. No source-code conflict occurred, and no protected file or
  `app/(tabs)/index.tsx` was changed. The combined dashboard remains 149/190
  overall and P20 35/37; P20-U-R1 is Done and P20-A-R3 remains In progress
  pending Gate 4 evidence. Focused verification exited 0 (12 suites, 364
  tests). Ordered gates on task HEAD `becbd83c0b18051bf54a00904c6463bd2232f5b3`:
  Gate 1 `npm test -- --coverage --watchman=false` exit 0 (105 suites,
  1,424 passed, 1 skipped; 96.07/92.35/98.22/97.70% statements/branches/
  functions/lines); Gate 2 `npx tsc --noEmit` exit 0; Gate 3 `npx expo lint`
  exit 0; Gate 4 `npx expo-doctor` exit 1 (`npx` could not resolve
  `expo-doctor` from `registry.npmjs.org`, `ENOTFOUND`); Gate 5 Android export
  exit 0; Gate 6 iOS export exit 0. No Gate 4 retry. Protected-file hashes
  match `docs/memory/rules.md`. O73 and O74 remain Not run.

### INTEGRATE-LOCAL-P20-W-D3 — phase sync and task merge preparation (2026-11-22)

- Local refs confirm PR #178 merged at
  `e1e2fc9cb6472daf6ec121d65e9075e421ceadde`, PR #179 at
  `f7d40f47d00aa14969799461de25631ae16d98c8`, PR #180 at
  `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478`, and PR #181 at
  `22f332fe9310e92c50d94cc6640c19f4e1552dcc`; each was verified as a commit.
  Synced local `phase/20-budget` from `develop` with no-ff commit
  `b5f8c52477ba88dce1c376904c36dee72b84a092`.
- The expected D3 branch tip `0257452a2410733354cdf2a084230b4fe7a6d864`
  matched. Merging the synced phase caused text conflicts in
  `docs/memory/project.md` and `docs/memory/status.md`. The ledger, open-items,
  checklist, tests and `src/domain/budget.ts` merged automatically. The budget
  merge retains U-R1's `holdingId` preservation and schedule snapshot updates,
  plus A-R3's cross-month linked-actual behavior and D3's custom income logic.
- On the merged tree, `SCHEMA_VERSION` is 24; safe-storage recognizes v23
  premigration data, and erase-all removes `.premigration.v23`. O71 describes
  the implemented custom income flow and remains Not run. O73 and O74 remain
  unchanged, unique and Not run. No protected file or Home screen was changed.
  Focused suites passed (15 suites / 664 tests). Full gates on task merge
  `8f0840f82646f2b3ec91457cb48b932abf8caeaa`: Gate 1 exit 0 (105 suites,
  1,436 passed, 1 skipped; coverage 96.08/92.35/98.22/97.71% statements/
  branches/functions/lines); Gate 2 TypeScript exit 0; Gate 3 Expo lint exit 0;
  Gate 4 Expo Doctor exit 1 because npm could not resolve the package from
  `registry.npmjs.org` (`ENOTFOUND`); Gate 5 Android export exit 0; Gate 6 iOS
  export exit 0. Gate 4 was not retried. Task/phase PR integration remains
  owner-side work under the local-only instruction.


### P20-W — Transaction form/category investigation (2026-11-21)

- Confirmed the P20-S-R2 merge `6b50a1dbd36b401352776e71028fc07071c11991` is an ancestor of local and `origin/develop` at `3473c61a6b32fa6f82ae51306e16828f6b7d8eea`. Synced `phase/20-budget` from that origin tip with no-ff merge `e44ce6f0dc4614339f766ac91d73f0df0d428363`; task branch `task/P20-W-transaction-form-categories` is based on it.
- D1: `transaction-form.tsx` defaults investment category to the first constant (`Mutual fund / SIP`) before selection; selected holdings already derive the category with `investCategoryFor`. The schema already requires an instrument and provides “Choose where this is invested”; Save only surfaces validation after submit. No persisted field is needed.
- D2: Budget sections/items are persisted; an expense transaction stores the item name in its existing string `category`. Effective-month category choices already group by section; the form can show the selected item’s derived section without persisting it. Budget item deletion does not rewrite transactions. No persisted field is needed.
- D3: transaction `category` is already a bounded string, but `BudgetIncomeItem.category` is `EarnedIncomeCategory`; the app schema, backup schema and domain add/edit validation enforce the enum. Proposed schema widening: preserve the same `category` field and widen it to a trimmed nonempty string of at most 60 characters; no new field. A v23→v24 migration can preserve category values unchanged because all v23 values satisfy the wider shape. Backup format remains 1, imports v1–v23 migrate through the same chain, and tests must cover encrypted export/decrypt/import preserving a custom value. Add v23 to safe-storage premigration archive recognition/union and `.premigration.v23` erase cleanup; erase-all continues deleting the data and all archives.
- **STOP GATE:** P36-A/B already claim schema v24. No D3 schema work is authorized until the owner decides whether P20-W takes v24 and P36 is replanned to v25, or P36 keeps v24 and P20-W is replanned. D1/D2 are authorized and remain schema-free.
- Assertion replacement: old ledger expectation blocked all implementation pending schema impact; new expectation allows the explicitly authorized D1/D2 work while keeping D3 Planned behind the owner’s schema-version decision. Reason: isolate schema-free requirements from the gated persisted-schema change.
- D1 test-first commit `3ad0dd8` reproduced the premature investment-category default; implementation commit `3683793` leaves category neutral until a holding is selected and retains the existing missing-holding Save validation. Focused TransactionForm, progress-ledger and memory checks passed (3 suites, 58 tests).
- D2 test-first commits `0986632` and `0deda30` cover the Custom expense entry, derived Budget section context and saving an existing category after its Budget item has been removed. Implementation adds a bounded custom-name input that saves to the existing transaction category string and a read-only derived section row. No persisted schema or demo fixture changes. Focused TransactionForm and schema suites passed (2 suites, 68 tests); the deletion-preservation case passes without rewriting the stored category.
- Assertion clarification: the new Custom option test first identified the special choice by value `Custom`; it now asserts the reserved form sentinel plus the visible title `Custom`. Reason: keep the command distinct from a legitimate Budget item or historical transaction whose actual category string is `Custom`.
- Physical-device follow-ups O69–O72 were added as Not run for P20-W because P21-F already uses O65–O68; they cover investment placeholder/derivation, searchable expense Custom/category behavior, D3 custom income after approval, and form usability at font scales 1.3/2.0.
- Integration assertion updates: old P20-W ledger test expected all work to wait for schema/backup review; new expectation keeps D1/D2 In progress and D3 Planned behind the schema-version decision. Reason: D1/D2 are authorized and schema-free. Old P21-F font-scale ledger expectation listed 1.3/2.0; new expectation requires 1.0/1.3/2.0. Reason: preserve the merged P21-F coverage at all recorded scales. P20-W physical-check IDs moved from O65–O68 to O69–O72 because P21-F had already merged with O65–O68; no device scenario was removed. Old memory summary named the P21-F tree as latest and showed 1,366 tests; new project/status counts name synced P20-W as latest with 1,369 tests (1,368 passed, one skipped). Reason: record the most recent completed full run accurately.
- Final Gate 1 on task head `2c90215539c0a628a7cd0323b84deed862959bb2` exited 0: 102 suites, 1,347 passed, 1 skipped; coverage 95.97/92.15/98.02/97.63% statements/branches/functions/lines. Gate 2 first exited 2 because the new deleted-item fixture treated optional `monthBudgets` as defined; corrected with `(mockAppData.monthBudgets ?? [])` in `2c90215`, then Gate 2 exited 0. Gate 3 exited 0. Gate 4 `npx expo-doctor` exited 1 with `ENOTFOUND registry.npmjs.org`; its single retry exited 1 with the same error. Under the task stop rule, Gates 5–6 were not run and the push/PR/merge workflow was not started. Node was `v26.10.0`; Expo was `57.0.32`.

### P20-W-D3 — Custom earned-income categories (2026-11-21)

- Test-first commit `06b2659` added app/backup schema acceptance and bounds,
  v23→v24 identity migration preservation, v1–v23 backup import coverage,
  plain/encrypted custom-category round trips, `.premigration.v23` archive and
  erase-all checks, Budget reconciliation/filter/labels, both custom-income
  forms and demo-fixture coverage. Its focused red run reported 8 suites / 530
  tests with one suite passing; the expected implementation gaps remained.
- Implementation commit `f2541fd` advances `SCHEMA_VERSION` to 24, widens the
  existing Budget income category to a trimmed nonempty string up to 60
  characters, registers an identity-preserving v23→v24 migration, recognizes
  and removes `.premigration.v23`, and retains backup format v1. Budget income
  and Transaction forms expose a searchable Custom choice and bounded field;
  domain actions normalize and validate the value. Budget actual-income
  reconciliation, category labels/filtering and a deterministic upcoming demo
  override retain custom strings. No protected file or the user-owned Home
  route changed.
- Focused verification passed: 8 suites / 524 tests, including app and backup
  schemas, migration/import, archive cleanup, domain behavior, both forms and
  demo data. Physical-device checks O69–O72 remain Not run; O71 now covers
  custom income entry, persistence and reopening. Full gates are recorded in
  the follow-up verification below.
- Final ordered-gate results (the coverage command used `--watchman=false` after
  the default Watchman client failed its state-directory `fchmod`):

| Gate | Command | Exit | Result |
|---:|---|---:|---|
| 1 | `npm test -- --coverage --watchman=false` | 0 | 102 suites; 1,381 passed, 1 skipped. Coverage statements/branches/functions/lines: overall 95.97/92.15/98.03/97.64%; `src/data` 91.12/87.51/94.53/94.21%; `src/domain` 96.93/92.97/98.81/98.32%; pure `src/lib` 100% in all measures. |
| 2 | `npx tsc --noEmit` | 0 | Passed after fixing Custom option inference and including schema 23 in the premigration type. |
| 3 | `npx expo lint` | 0 | Passed. |
| 4 | `npx expo-doctor` | 1 | `ENOTFOUND registry.npmjs.org`; one attempt, no retry. |
| 5 | `npx expo export --platform android` | 0 | Exported to `dist`. |
| 6 | `npx expo export --platform ios` | 0 | Exported to `dist`. |

- The first two Gate 1 invocations failed before Jest due to Watchman `fchmod`;
  a no-Watchman full run exposed the stale future-schema fixture, changed from
  v24 to v25. The corrected no-Watchman coverage run passed. Gate 2 first exited
  2 on two typing errors; both were corrected in `b817944`, then Gate 2 passed.
  Coverage floors are met: domain and pure-lib line/branch coverage are at least
  90%, and data line/branch coverage exceeds 85%.
- Assertion replacements (old / new / reason):
  - Old schema expectations used v23 as current and refused v24; new tests
    require v24 and refuse v25. Reason: owner decision DEC-P20W-D3-SCHEMA24
    assigns v24 to P20-W.
  - Old current-schema migration identity test passed version 23; it now passes
    v24, while the new v23→v24 test checks exact serialized preservation.
    Reason: version 23 now requires the identity migration.
  - Old store test expected a v22 blob to persist at v23; it now expects v24,
    retaining exact `.premigration.v22` bytes and erase-all checks. Reason:
    hydration applies both v22→v23 and v23→v24.
  - Old income-edit invalid-input assertion used category `Invalid`; it now uses
    an empty category because arbitrary nonempty category strings are valid.
    New assertions reject blank and 61-character categories and accept a
    trimmed custom category. Reason: preserve invalid-input coverage under the
    wider contract.
  - Old progress-ledger assertions described D3 as blocked by the v24 decision;
    new assertions require the resolved decision and v25 P36 plan. Reason: the
    owner authorized D3 and resolved the schema collision.
  - The P20-W dashboard retains the owner-supplied Gate 4 20/21 result and its
    six SDK 57 patch mismatch detail, alongside the prior local `ENOTFOUND`.
    Reason: preserve verified integration-era evidence while recording D3.
  - Old safe-storage future-version fixture used schema v24; new fixture uses
    v25 and still requires rejection. Reason: schema v24 is now current.
- README.md still describes supported backup imports only through v22. It was
  left unchanged as explicitly directed; current source and tests support
  imports through v23.
- Branch `task/P20-W-D3-custom-earned-income` is based on `phase/20-budget`;
  no push was authorized. PR merge commands and remaining owner actions are
  reported after the final gates.

### P20-W-R1 — P20-W integration evidence (2026-11-21)

- Test-first commit `6f31775` failed while P20-W-R1 and PR integration evidence
  were absent. The ledger now records task PR #174 merge
  `419a37b07e6853b3c683d22ec243ea58223514c1` and phase PR #175 merge `9e47856f20848e03ac6a4b8e699f47c387d08161`; `gh pr view` verified
  both as Merged and `git cat-file -t` verified each merge commit. CM-2
  synchronized local `develop` to the phase PR merge.
- Focused ledger and memory checks pass (2 suites / 33 tests); `git diff --check`
  passes. No application behavior changed. D1/D2 are integrated; P20-W remains
  In progress while D3 awaits the owner’s v24 decision against P36. Device checks
  O69–O72 remain Not run.
- Gate 4 provenance: the local synced-tree attempt exited 1 with
  `ENOTFOUND registry.npmjs.org`; owner-supplied Gate 4 exited 1 at 20/21 on
  the six known Expo SDK 57 patch mismatches (owner-approved cleanup exception).
  Dependencies and app config did not change between owner and synced runs.
- Assertion/count replacements (old / new / reason): old P20-W status assertion
  required only `In progress`; it now requires `In progress; Revised by
  P20-W-R1` while also retaining D3 Planned. Old phase-index count `36` and
  phase progress `33/36`; new values `37` and `34/37`. Overall progress changed
  from `147/189` to `148/190`. Reason: add one completed evidence revision;
  P20-W itself remains open. No behavior assertion was removed or weakened.
- Derived counts: old overall `147/189` and P20 `33/36`; new overall `148/190`
  and P20 `34/37`. Reason: add this completed evidence revision while keeping
  P20-W open. Old phase-index count `36`; new count `37` for this revision.
  Process deviation: phase sync commit `206f116` was created directly by `git merge`
  before a separate staged diff-stat display, contrary to R1; it changed no files.
  Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and P20-W records; related P20-W and CM-2; reason: record verified task/phase integration as the next P20-W revision required by the integration workflow.

### P20-S-R2-R2 — Preserve the complete Dropdown revision chain (2026-11-21)

- Test-first ledger commit `0375e55` exposed that the parent status omitted
  P20-S-R2 while listing P20-S-R2-R1. The ledger now retains both entries and
  adds this correction revision.
- Focused ledger and memory suites pass (2 suites / 32 tests); no app behavior
  changed. The full application gate set was not rerun for this docs-only
  correction. Physical-device checks O61–O64 remain Not run.

### P20-S-R2-R1 — Searchable Dropdown integration evidence (2026-11-21)

- Task PR #164 merged `task/P20-S-R2-dropdown-search` into
  `phase/20-budget` at `185a5ea125f64ac104344f00ad013d68cdb7a946`.
- Phase PR #165 merged `phase/20-budget` into `develop` at
  `6b50a1dbd36b401352776e71028fc07071c11991`; CM-2 fast-forwarded local
  `develop` to that remote tip. Test-first ledger commit: `cf90f78`.
- Focused ledger and memory tests pass. No application behavior changed;
  O61–O64 remain Not run on physical devices.

### CR-115 — Record planned Budget edit and delete bug (2026-11-13)

- Recorded owner-reported Budget update and delete failure across single month and following months as Planned under P20-U-R1.
- Owner report (verbatim): "In budget while updating any item/value/amount/start-month/frequency/due-day/etc it is not updating also while trying to delete it is not even deleting, not for single month and this and following months."
- Owner instruction: "Don't start working on this."
- Documentation and ledger recording only; no investigation, reproduction, app/schema/dependency changes, or work on the bug was started.
- Focused test suite passed: 5 suites / 50 passed.

### CR-114 — Restructure independent entities, empty slots and R7 (2026-11-12)

- Restructured work tracking into independent lifecycle entities: `cleanup`,
  `qa-and-release`, `schema-migration`, and `documentation`, plus a Cancelled /
  unassigned bucket under Section 13 in `docs/PROGRESS.md`.
- Empty reserved slots established: P7, P27, P28 and P32. Phase progress bars
  and totals derive only from non-empty product phases (142/184, 77%).
- R7 slot-filling rule added to AGENTS.md, docs/memory/rules.md,
  docs/memory/work-placement.md, CONTRIBUTING.md and PROGRESS.md section 3.
- Standalone documentation lifecycle branch `documentation` established
  alongside `cleanup`, `qa-and-release` and `schema-migration`. Standalone
  docs tasks branch as `task/docs-<slug>` and merge back `--no-ff`.
- Remote branches: `schema-migration` and `documentation` pushed at their exact
  tips and verified with `git ls-remote`; obsolete remote ref
  `origin/phase/07-schema-migration` deleted. Historical completion tags
  `phase-07-complete`, `phase-27-complete`, and `phase-28-complete` retained.
- Git history map committed at `docs/history/entity-history-map.md` classifying all commits
  and 95 PRs without rewriting any Git history.
- Verification on documentation branch and PR #161 candidate HEAD `3d9efc2`:
  1 `npm test -- --coverage --watchman=false` (0; 101 suites, 1,328 passed, 1 skipped)
  2 `npx tsc --noEmit` (0)
  3 `npx expo lint` (0)
  4 `npx expo-doctor` (1; owner-approved exception; pre-existing upstream SDK 57 patch advisory on both develop and documentation; patch alignment tracked under cleanup)
  5 `npx expo export --platform android` (0)
  6 `npx expo export --platform ios` (0)
- PR integration: PR #161 merged `documentation` into `develop` via merge commit `9058386` at 2026-11-12T18:58:36Z; CM-2 synchronized `develop` and fast-forwarded `documentation`.
- Decisions Q1–Q4 recorded: Q1 push authorized for schema-migration/documentation;
  Q2 documentation standalone lifecycle workflow; Q3 keep historical tags;
  Q4 history map deliverable.

### CR-110-R1 — Lifecycle and transaction planning (2026-11-12)

- Revised CR-110 as five Planned items, P43-A–P43-E. Each has explicit
  dependencies and `Evidence: not started`; this record plans work only.
- `cleanup` and `qa-and-release` are ongoing lifecycle activities outside the
  numbered development phases, alongside `develop` and `release/vX.Y.Z`.
  Preserve P27/P28 completion evidence. At planning time, remote rename
  execution awaited owner authorization; the owner later authorized and
  completed it under CR-112. Retain the stale phase tags previously
  directed. Documentation reordering only; Git chronology unchanged unless
  the owner gives explicit written authorization for a specific rewrite.
- Non-release phase/task-tag deletion is blocked on owner approval of an
  exact tag list; preserve every release tag. The branch/PR/merge-balance
  audit is report-only, with output in chat or `/tmp`.
- Emergency Fund editing must reflect the saved target throughout the
  screen, Home, Goals, allocation/bucket targets and three-month minimum
  floor; use one domain action, one Zustand `set`, one persisted write and
  Undo; include validation, 1.3/2.0 font-scale tests and DEC-DEMO data.
  `app/(tabs)/index.tsx` is user-owned and needs explicit authorization if a
  Home-source edit is necessary.
- Transaction plans cover investment category derivation only after holding
  selection (`investCategoryFor`), user-created/Budget-defined expense
  categories plus a Custom category with category/item hierarchy and
  persistence decided in design, and custom Income types. Schema v23 is
  current while P36 claims v24; schema impact is undetermined. Any bump needs
  a separate plan, identity-preserving migration, premigration archive and
  backup-import support; regressions, demo-data updates and backup
  compatibility are planned.
- The issue strategy proposes one issue per ledger part or CR, phase/type/
  status labels, release milestones, pending issues open and completed work
  retrospective/closed, with verified commits/PRs/merge SHAs and original
  dates in bodies plus one retrospective comment. GitHub controls actual
  timestamps. Approximately 216 ledger parts need deduplication and a rate,
  batching and noise assessment. Issue creation is a separate
  owner-approved task; create no issues now.
- Test-first commit `e5114e01f363d6de5a12acb61886039469d4a86f` adds regression
  requirements before these documentation rows. The assertion changes are
  old / expect 32 phase-index rows and prior CR-110-C/D/E roadmap labels /
  new / expect P43 as row 33 and verify its branch; require the consolidated
  P43-C/D/E plan wording / reason / P43 is the newly opened planning phase
  and the requirements have been grouped into five dependency-aware parts,
  not the former under-specified CR-110 bullet list. The total dashboard
  count now includes five planned P43 parts; standalone lifecycle activities
  are excluded from development progress.
- The phase/task branches were pushed only to create their authorized PRs.
  Task PR #146 merged into `phase/43-lifecycle-and-transaction-planning` at
  `e4d950adf0344dbe12e2e0d085e83d60538ede68`; phase PR #147 merged into
  `develop` at `a93feaecfbd591c1b6f27bac15b5839c68d10709`. The task branch
  was deleted and the phase branch is retained. At CR-110-R1 completion, no
  app implementation, lifecycle-branch rename, tag operation, issue creation
  or history rewrite had occurred; the authorized lifecycle renames were later
  completed under CR-112. The exact non-release tag-deletion list remains an
  owner decision.

### CR-111 — Linked savings, spending heat map and Git sync planning (2026-11-12)

- CR-111's product work remains Planned. It groups P20-A-R3 (a revision to
  completed P20-A-R2) and new P44-A–P44-D; CM-2 was activated separately by
  CR-112. All Planned product parts require `Evidence: not started`; no app or
  schema implementation or demo-data change is included here.
- P20-A-R3 is a revision to P20-A-R2, remains unimplemented, and records the
  owner-reported behavior as unverified. The three causes are hypotheses,
  not conclusions. Required store/component coverage, expected atomic result,
  payment/holding matrix, schema assumption and future device-check slot are
  recorded. Task PR #149 merged into the retained `phase/20-budget` branch at
  `7a5fed6c4a98d8394652e0dbb499b9aa810bae29`; phase PR #150 merged into
  `develop` at `4170545cbaa8a4f37d4583b5c29c909c0c99a015`.
- P44-A–P44-D plan a daily transaction-derived monthly heat map. Placement
  and income semantics remain owner decisions; the recommended entry is a
  Transactions header action to a stack route. The calendar uses bounded
  month navigation, not an infinite rendered list. Derived selector/schema
  assumptions and all performance, accessibility, stress, demo-data and
  device-check requirements are in Section 9. P44 task PR #151 merged into
  `phase/44-spending-heatmap` at `0cdd8406225d15247a3843956da98c0d4dbfc2ad`;
  phase PR #152 merged into `develop` at
  `c0bb36a06b0726dcdc536243dbc10236e40d7fdd`.
- CM-2's original proposal and default-No decision are historical; CR-112
  activated the rule using the exact owner-authorized sentence in shared
  instructions. It does not authorize pushes.
- Assertion replacements: old P20-A-R2 revision text mentioned only
  P20-A-R2-R1; new text also says `Revised by P20-A-R3`. Reason: the planned
  work corrects an entry point in the completed behavior. Old P20 count was
  30/30; new is 30/31. Old overall count was 182/221 before the P20 revision;
  after P20-A-R3 and four P44 parts it is 182/226; P44 is 0/4. Reason: count
  every new Planned development-phase part and derive bars from dashboard
  statuses. Old phase branch index/assertion had 33 rows ending at P43; new
  index and test expect 34 rows including P44. Reason: P44 is a genuinely new
  development phase. `memoryDocs.test.ts` adds CR-111 planned-record checks;
  no existing assertion was weakened.
- Test-first commits: P20 `b15783c`; P44/CR-111 `01c707c`. P20 docs commit
  `a943b94`; P44 planning commit `3bf0274` and gate/memory correction
  `e520236`. The P44 task and phase PR integrations are recorded above. No
  GitHub issues, tags, or history changes were authorized or performed.

### CR-112 — P43 lifecycle rename and placement-rule execution (2026-11-12)

- Gate 4 was retried with network access and passed 21/21; the complete
  ordered six-gate rerun then passed with exit 0 for every gate. Exact
  commands, results, coverage and the initial DNS failure are in Section 10.
- `cleanup` and `qa-and-release` were pushed at their original tips, each new
  remote tip was compared with its old counterpart before deleting the old
  ref, and final remote checks found only the new names. The three
  `phase-27-complete`, `phase-28-complete` and `phase-29-complete` tag objects
  and peeled targets are unchanged. The six protected file blob IDs match
  `docs/memory/rules.md`.
- P43-A and P43-F are Done. P43-F task PR #153 merged into the phase at
  `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154 merged into
  `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`. P43-F-R1 records
  the verified merge evidence. No application, schema, migration, demo-data,
  issue, release, tag or Git-history work was performed.
- Assertion replacements: old `P43-F` status was `In progress` and its
  placement register said task/phase PR integration was pending; new status
  is `Done; Revised by P43-F-R1` with PR #153/#154 and both verified merge
  SHAs. Reason: mark the process work complete only after both authorized PRs
  merged. The P43 count changes from 1/4 to 3/5 and the overall dashboard
  changes from 183/226 to 185/227 because P43-F is now Done and the
  completion-evidence revision is a separately tracked part. No assertion
  was weakened.

### CR-113 — Owner approvals for planned work (2026-11-12)

| Gate | Command | Exit code / result |
|---:|---|---|
| 1 | `npm test -- --coverage --watchman=false` | 0; 101 suites, 1,326 passed, 1 skipped (1,327 total) |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | Initial attempt 1 (`ENOTFOUND registry.npmjs.org`); authorized network retry 0, 21/21 checks passed |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

- This is a planning-only reconciliation. No app implementation, research,
  tag deletion or GitHub issue creation was started. The affected feature
  rows remain Planned and retain their prerequisite ordering.
- The owner authorized P21-F to edit Home if necessary; reactivated widgets
  and approved P33 platform research; renewed and approved P34 quick-capture
  research; approved P35 research and a Go after that research; approved the
  P43-B cleanup/audit and P43-E issue-planning scope; selected P44's
  Transactions stack placement and counting semantics; and resolved P39/P40
  placement to stay in their current areas.
- P43-B still needs an exact proposed tag-deletion list for review before any
  tag operation. P43-E still needs the verified ledger inventory and a
  separate execution task. P33-C also remains contingent on iOS distribution;
  P35 implementation remains gated on completed P35-A research.
- New regression coverage asserts all owner decisions, Planned statuses,
  preserved dependencies, the exact-list hold, updated phase counts and
  current branch index. It does not authorize or verify the future tasks.
- Focused ledger regression: `npm test -- --runInBand --watchman=false
  src/lib/__tests__/progressLedger.test.ts` — exit 0, 24 tests passed.
- P43 moves from 3/5 to 4/6 closed; overall progress moves from 185/227 to
  186/228. No app code, schema, demo data or device checklist changed; no
  physical-device check was performed.
- P43-G-R1 records the subsequent PR evidence, bringing the current dashboard
  totals to P43 5/7 and overall 187/229. Its ordered six-gate rerun passed:
  101 suites, 1,326 passed, 1 skipped; TypeScript, lint, Expo Doctor (21/21)
  and both platform exports exited 0. Expo Doctor's first retry in this run
  hit the same npm DNS failure; the authorized network retry passed.
- Task PR #157 merged into P43 at
  `01e5559f00a3b7008292db07ed7900af0ea8f828`; phase PR #158 merged into
  `develop` at `14f539b4c70da1a00e24642fd3e6068091f3ed9c`. Both used merge
  commits and were followed by CM-2 fast-forward synchronization.

### DEC-CR109-OWNER-PLANNING-AND-CLOSEOUT (2026-11-11)

- Future planning is approved for a true in-app update check, Once-only
  frequency on investment plans/liabilities, and public adoption. None is
  implemented by this record. The current About action remains a confirmed
  browser link; schema v23 still excludes Once-only from investment plans and
  liabilities; public-launch activities remain unscoped.
- P31-D's privacy statement and P40-B's archive split are approved as Planned
  work with their existing dependencies intact. Configure branch protection
  only after P31-E passes a real PR run. Keep `phase-28-complete` and
  `phase-29-complete` unchanged. The owner confirms Sahil Aspak Sheikh as the
  MIT copyright holder; the existing `LICENSE` already matches.
- The owner accepts the current P29-J calculation without a statement
  comparison or calculation change, the existing CR-3 Save behavior, the
  recorded dependency-advisory snapshot, the existing local backup snapshot
  and the Node 26 pin. No calculation, UI, dependency, backup or Node 24 fix
  is requested. P39-E remains Planned as a separate report-first audit.
- Integration: task PR #142 merged to the phase at `8f38e9f`; phase PR #143
  merged to `develop` at `8988121`. All six ordered gates passed again on the
  integrated `develop` tree; P42-A-R1 records this evidence.
- `codex-changes` was deleted at the owner's direction and is not to be
  revived or ported. Its commit `d033d6a` targeted an obsolete schema-v2
  loan/liability model, edited protected Home code, included generated
  coverage output and contained unsafe migration behavior. It was never
  merged. Its migration accepted only a v1 source, defaulted missing arrays
  and cleared manual holding logs while converting to v2; this is incompatible
  with the current schema-v23 migration and backup requirements.
- Replaced assertions (old / new / reason):
  - Old: owner approval for P40-B was still an open decision. New: P40-B is
    Planned with approval recorded and P40-A as its dependency. Reason: the
    owner approved the archive split while preserving sequencing.
  - Old: the About update-check, investment/liability Once-only, public
    adoption, privacy statement, MIT holder, and post-P31-E branch-protection
    decisions were unresolved. New: future items are approved as Planned and
    current limitations remain explicit. Reason: capture owner direction
    without presenting future work as implemented.
  - Old: P29-J evidence, CR-3 Save layout, dependency advisories, the local
    backup mismatch, Node 24 and the prior focused-only test run were framed
    as owner-pending follow-ups. New: the owner accepts the current state or
    explicitly declines additional work; the previous test scope remains
    accurately described. Reason: remove items that no longer need owner
    action without claiming unrun validation.
  - Old: the deleted `codex-changes` branch was described as awaiting review
    or a safe port. New: it was deleted at the owner's direction and no work
    is to be ported. Reason: reflect the explicit decision and preserve the
    evidence explaining the risk.

### DEC-CR108-MENU-STRESS-DIALOG (2026-11-10)

- The Home dev-menu stress action exposed four tiers through `choiceAsync`,
  whose shared contract intentionally allows at most two choices. The menu
  handler therefore threw `RangeError` before opening a picker.
- Keep that limit. Present stress tiers in a separate centered shared-sheet
  selection dialog with scalable rows; cancellation performs no load, and the
  selected callback preserves loading, timing, error and Undo behavior.
- The pre-edit handler regression failed with the reported RangeError. The
  updated menu/confirmation tests cover all four tiers, cancel, Undo, every
  app-menu handler, and simulated 1.3x/2.0x font scales.

### DEC-CR108-FINANCIAL-TYPES (2026-11-10)

- Real estate is a finite built-in holding type. It supports recurring
  deposits and returns, maps to the `Real estate` investment category, and is
  included in the `Savings and Investments` Budget group.
- Custom holdings and liabilities store the finite `Custom` type plus an
  optional validated, trimmed `customTypeName` of 1–30 characters; this does
  not create open-ended enum values. Custom holdings support recurring
  deposits and returns, map to `Other investments`, and share the `Savings
  and Investments` Budget group.
- Forms require a custom display name when `Custom` is selected, while
  persisted/imported fields remain additive and optional for compatibility.
  Custom labels are derived consistently in cards, entries, filters/search,
  goal links and backup data.
- The P41-A regression suite passes (7 suites/292 tests), as does TypeScript.
  Demo data re-splits existing values rather than increasing the assets total;
  final before/after details are recorded at CR-108 close-out.

### DEC-CR108-ONCE-ONLY (2026-11-10)

- Once-only recurrence is available only for Budget items, Budget income and
  insurance premiums. Investment plans and liabilities retain their existing
  one-time forms and do not receive a Once-only frequency option.
- Budget schedules require the first-due month; insurance schedules use the
  configured first due date. A once-only item is due only in that specified
  month/date, is not repeated in later months and cannot use percentage mode.
- Shared schedule, pending-due, reminder, Budget-total, projected-cash-flow
  and virtual-month paths evaluate the same due rule. Frozen month snapshots
  retain their saved values. Schema v22 migrates identity-preservingly to
  v23; `.premigration.v22` keeps the original serialized bytes once and is
  removed by erase-all. Backups through v22 migrate through the chain;
  encrypted v23 round-trip and refusal of v24 are covered by tests.
- P41-B focused domain, migration, archive, backup and demo tests pass
  (7 suites / 216 tests); TypeScript passes. The full ordered gates remain
  pending at the time of this decision note; Parts 5–6 and the final six gates
  were later completed as recorded in CR-108 close-out.

### DEC-CR108-COMPLETED-SECTIONS (2026-11-10)

- A liability belongs in Completed when its as-of outstanding balance is
  below 1 or it has a recorded closure. Existing sort, kind filter, Closed
  filter and search are applied before grouping; therefore the collapsed
  section count reflects the current results.
- A non-pinned goal belongs in Achieved when its displayed saved amount is at
  or above its displayed target. The Emergency fund goal remains pinned first
  even when its linked value reaches its target; it is not counted in Achieved.
- Expand/collapse reuses the existing liability and goal cards. Tests use
  separate in-progress, cleared, foreclosed, closed, exactly-at-target and
  over-target fixtures and exercise search/sort/filter behavior at simulated
  1.3x and 2.0x font scales. Physical-device checks remain unverified.
- Demo data adds one fully closed personal loan with zero outstanding through
  the shared closure action. The added Rs 1,000 principal is settled in full,
  so total liabilities remain Rs 10,00,000 and assets remain Rs 1,00,00,000;
  goal percentages remain capped at 87%.
- Focused route, demo, progress-ledger and memory-doc verification passes
  (4 suites / 209 tests); TypeScript and Expo lint pass. Full ordered gates are
  pending at the time of this decision note; the final six gates later passed
  as recorded in CR-108 close-out.
- Test-first commits `0fae9e5` and `538046b` precede screen/demo changes.

### DEC-CR108-UPDATE-CHECK (2026-11-10)

- The application remains offline-first: the app itself makes no network
  requests for update discovery. The About screen shows the exact privacy
  statement, "Data stays on this device; the app makes no network requests."
- After an explicit confirmation, Check for updates opens the GitHub
  latest-release page in the user's browser with React Native `Linking`.
  Cancellation opens nothing; app code does not fetch release metadata,
  compare versions online, or poll in the background.
- A true in-app update check remains an owner decision for future work.
  The current browser-only behavior is the CR-108 decision and does not
  change v1.1.1, release branches, tags or release artifacts.
  Task PR #104 merged into `phase/41-types-frequency-completion` as
  `c255ada`; phase PR #105 later merged to `develop` as `37a3429`. P41-D task
  PR #106 merged into the phase as `7ddfef5`; phase PR #107 merged to
  `develop` as `8e4a2d1`.

### CR-108 close-out (2026-11-11)

All six authorized parts and the P41-B-R1 Gate 1 correction are integrated
into `develop`. No CR-108 change was made to v1.1.1, a release branch, a tag
or a release artifact.

| Part | Test-first commit(s) | Implementation commit | Task PR → task merge | Phase PR → develop merge |
|---|---|---|---|---|
| P29-Q-R1 | `89b2654` | `ca4c904` | #93 → `1b1a6d5` | #94 → `80eb0e4` |
| P20-N-R3 | `bba05be` | `47b0469` | #95 → `77bdef5` | #96 → `f5f6e16` |
| P41-A | `5b83d27` | `c326de2` | #97 → `a03ee54` | #98 → `9aa6540` |
| P41-A-R1 | `16b2e39` | — (test correction) | #99 → `0985ef3` | #100 → `a67f54f` |
| P41-B | `f98d7dd` | `873eed7` | #101 → `9ab6e79` | #102 → `b4275d3`; evidence PR #103 → `c1e810b` |
| P41-C | `0fae9e5`, `538046b` | `3138cde` | #104 → `c255ada` | #105 → `37a3429` |
| P41-D | `bd980ad` | `05e725e` | #106 → `7ddfef5` | #107 → `8e4a2d1` |
| P41-B-R1 | `bd8f1c9` | — (no production change); docs `efbf9ac` | #108 → `e1db78e` | #109 → `5cb4957` |

Task branches were deleted after merge; `phase/41-types-frequency-completion`
is retained. P41-B-R1 corrected the stale reminder assertion and added
schedule/schema boundaries; the test-first and documentation commits are
present in the PR chain above. The final documentation/test-ledger close-out
commit `14fb472` was merged by task PR #110 into the retained phase as
`14c079a`.

#### Final six ordered gates

| Gate | Exact command | Exit | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` | 0 | 101 suites passed; 1,316 passed, 1 skipped, 1,317 total. Coverage (statements/branches/functions/lines): overall 95.96/92.15/98.02/97.62%; `src/data` 91.06/87.47/94.48/94.19%; `src/domain` 96.94/93.00/98.80/98.31%; `src/lib` 100/100/100/100%. |
| 2 | `npx tsc --noEmit` | 0 | Passed. |
| 3 | `npx expo lint` | 0 | Passed. |
| 4 | `npx expo-doctor` | 0 | 21/21 checks passed. |
| 5 | `npx expo export --platform android` | 0 | Passed; exported to `dist`. |
| 6 | `npx expo export --platform ios` | 0 | Passed; exported to `dist`. |

The final gate run occurred on integrated `develop` after PR #109. Expo
exports are not physical-device checks. Physical font-scale and screen-reader
verification remain outstanding; no EAS or Gradle build was run.

#### Demo before/after evidence

The before state is the deterministic demo builder at `80eb0e4`; the after
state is the CR-108 builder. Both are evaluated for `2026-10-16` using the
domain selectors, `holdingValue`, `liabilitySummary`, `goalView` and
`monthSummary`.

| Holding value | Before | After |
|---|---:|---:|
| Emergency cash | Rs 5,00,000 | Rs 5,00,000 |
| Emergency savings account | Rs 7,00,000 | Rs 7,00,000 |
| Emergency fixed deposit | Rs 8,00,000 | Rs 8,00,000 |
| Index mutual fund | Rs 10,00,000 | Rs 10,00,000 |
| Broad market ETF | Rs 20,00,000 | Rs 20,00,000 |
| Rental apartment (Real estate) | — | Rs 15,09,000 |
| Collectible art (Custom: Collectibles) | — | Rs 5,00,000 |
| Gold savings | Rs 10,00,000 | Rs 10,00,000 |
| Employee provident fund | Rs 39,96,000 | Rs 19,87,000 |
| Monthly recurring deposit | Rs 4,000 | Rs 4,000 |
| **Total assets** | **Rs 1,00,00,000** | **Rs 1,00,00,000** |

There is exactly one Real estate holding and exactly one Custom holding. The
asset values were re-split, not added to the former total.

| Liability | Before outstanding | After outstanding |
|---|---:|---:|
| Home improvement loan | Rs 9,82,500 | Rs 9,82,500 |
| Settled education loan | Rs 0 | Rs 0 |
| Borrowed from a friend | Rs 17,500 | Rs 17,500 |
| Paid-off personal loan | — | Rs 0 |
| Fully closed personal loan | — | Rs 0 |
| **Total outstanding** | **Rs 10,00,000** | **Rs 10,00,000** |

The new fully closed liability has zero outstanding; its settled principal does
not increase the outstanding total.

| Goal | Before saved/target | Before % | After saved/target | After % |
|---|---:|---:|---:|---:|
| Emergency fund | Rs 20,00,000 / Rs 25,00,000 | 80% | Rs 20,00,000 / Rs 25,00,000 | 80% |
| Retirement portfolio | Rs 4,000 / Rs 20,000 | 20% | Rs 4,000 / Rs 20,000 | 20% |
| Home deposit | Rs 40,00,000 / Rs 47,00,000 | 85.11% | Rs 40,00,000 / Rs 47,00,000 | 85.11% |
| Education fund | Rs 20,00,000 / Rs 25,00,000 | 80% | Rs 20,00,000 / Rs 25,00,000 | 80% |
| Family holiday | Rs 25,000 / Rs 1,25,000 | 20% | Rs 25,000 / Rs 1,25,000 | 20% |

The six-month actual Budget totals are computed from the fixed demo transactions.
Earned income remains Rs 1,00,000 per month; May also has Rs 20,000 borrowed
income. Each row shows `earned income; expenses; investments; expenses +
investments`, before → after:

| Month | Earned income | Expenses | Investments | Expenses + investments |
|---|---:|---:|---:|---:|
| 2026-05 | 1,00,000 → 1,00,000 | 72,200 → 87,200 | 6,500 → 8,000 | 78,700 → 95,200 |
| 2026-06 | 1,00,000 → 1,00,000 | 67,200 → 67,200 | 6,500 → 8,000 | 73,700 → 75,200 |
| 2026-07 | 1,00,000 → 1,00,000 | 67,200 → 67,200 | 6,500 → 8,000 | 73,700 → 75,200 |
| 2026-08 | 1,00,000 → 1,00,000 | 73,800 → 73,800 | 6,500 → 8,000 | 80,300 → 81,800 |
| 2026-09 | 1,00,000 → 1,00,000 | 74,300 → 74,300 | 8,500 → 10,000 | 82,800 → 84,300 |
| 2026-10 | 1,00,000 → 1,00,000 | 76,650 → 77,650 | 8,500 → 10,000 | 85,150 → 87,650 |

Expenses plus investments remain below earned income in every month. The new
Domain renewal Budget item and health premium each have one configured due
month/date; neither repeats.

#### Replaced assertions and defect regressions

| Area | Old assertion / regression | New assertion | Reason |
|---|---|---|---|
| Stress menu | Four stress tiers passed to `choiceAsync` threw `RangeError`; test reproduced the failure. | Centered selection dialog exposes all four tiers; cancel, Undo, handler paths and 1.3x/2.0x scales are covered. | Preserve `choiceAsync`'s two-choice contract while supporting four tiers. |
| Budget Overview | Tests expected visible Pace and redundant Over by/Left summary lines. | Those visible lines are absent; chart, table Left row and accessible descriptions remain. | Owner-directed removal without loss of accessible context. |
| Real estate mapping | Stale test expected the new Real estate holding to map to Other investments. | Test requires the deliberate Real estate investment category and Savings and Investments group. | Match the accepted category mapping. |
| Once-only reminders | Demo reminder aggregate expected 909. | It expects 893; the configured Once-only policy contributes a single due. | Correct the recurrence expectation; no production behavior change. |
| Completed liabilities | Closed-filter test expected the card immediately after selecting Closed. | It expects the collapsed Completed heading/count and the same card after expansion. | Keep completed sections collapsed while preserving the Closed filter. |
| CR-108 ledger | Test expected CR-108 to remain In progress while integrations/gates were open. | It requires Done (device checks outstanding) after all parts, PRs and gates pass. | Reflect completed automated scope while keeping physical checks explicit. |

The P41-B-R1 phase-index assertion moved from four tasks / 3/4 to five
tasks / 5/5 as the revision was added and completed. No assertion was weakened.

#### Protected files and release boundary

| Protected file | Final Git blob |
|---|---|
| `app/(tabs)/index.tsx` | `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` |
| `app/(tabs)/budget.tsx` | `eca7607015cb3c8b85dfc7e0d4001235166742a2` |
| `src/components/SortChip.tsx` | `837a675af94dd056532bc63fc4697efc905a5af3` |
| `src/lib/sorting.ts` | `7491663f0987d83d03f3ed72b01de5b376e3572d` |
| `src/components/form/frozen-manifest.json` | `476418c7084f0774f1b6fb86ddfe08c7a265fc40` |
| `src/components/__tests__/formComponentsFrozen.test.ts` | `44e6f7e1592dabf9de95d2ed09cbe65af7968d1c` |

The Budget labels and removed Back/Review controls remain protected by its
unchanged authorized blob. No CR-108 changes were made to v1.1.1, release
branches, versions, tags or release artifacts.

### CR-107 implementation integration and release cleanup (2026-11-10)

- P28-F-R5 task PR #83 merged to `qa-and-release` (historical branch name: `phase/28-qa-and-release`) as
  `c9fe4660602fc443fcfa9c4bd00cacccb98c3173`; P22-A-R1 task PR #84 merged as
  `77cdc9e2f1899b18e0cf108bfb4eba6dc8652f4e`; P28-G task PR #85 merged as
  `8afd37401ef8abcf7e5fe8ee4a91468b20c58b97`. Phase PR #86 merged to
  `develop` as `d6cc56822ee332f609e2d7800df0fca657453623`.
- Under the owner exception DEC-CR107-MAIN-MERGE, `develop` -> `main` PR #87
  merged as `c8a58abbc2ebcc9b9e25e80c47e5472d58294620`, followed by main ->
  develop PR #88 as `8da39bd8653ceee6ea066e7ee78d7b3f05e38033`. The
  `main`, `develop` and P28 phase trees match at
  `2667fd423730bb2a25406b3634c9f2ff58d2a6d7`.
- The 23 repository screenshots cover v1.0.0/v1.1.0/v1.1.1 at 7/8/8 images.
  All 46 blob/raw URLs returned HTTP 200, all raw sizes matched, and rendered
  release pages display the expected image counts. Only screenshot sections
  were updated before deleting the 23 screenshot release assets; all three
  APK assets remain at their recorded names and sizes, and their URLs return
  HTTP 200. No APK, tag, version or release publication state changed.
- The owner chose screenshot-only edits to the v1.0.0 release body because
  its pre-existing non-screenshot text differs from the published note; that
  difference remains. The v1.1.1 APK predates and does not contain the demo
  data revision. CR-107 final evidence gates and before/after outputs are in
  Section 10; the final evidence task branch/PR chain is reported with the
  closeout.

### CR-106 roadmap planning (2026-11-10)

- Fetched `origin`; `develop` was already at `origin/develop`. Verified all six
  protected Git blob IDs and fast-forwarded the existing P28 branch to
  `develop` before creating `task/CR-106-roadmap-external-guides`.
- Added only planned P31, 39 and 40 rows, owner decisions/non-adoptions,
  and derived-ledger-test expectations. Reports and audit findings remain out
  of Git until the report-first roadmap parts are executed.
- All six ordered gates exited 0: Gate 1 had 98 suites, 1,271 passed and
  1 skipped; coverage 95.96/92.04/98.02/97.63% overall. TypeScript, lint,
  Expo Doctor 21/21, Android export and iOS export passed. No source behavior
  or physical-device result is claimed.

### P28-E-R5 historical commit audit and v1.0.0 branch (2026-11-09)

- Audited the 403 first-parent non-merge commits after the initial commit.
  All are already in `main` and `develop`; 319 subjects match the current
  Conventional Commit hook and 84 legacy subjects do not pass the hook.
- No PRs were opened for those commits: their existing ancestry is already
  integrated, so a PR would have no new commit to merge. Rewording historic
  subjects would change commit IDs and require prohibited history rewriting.
- Created and pushed `release/v1.0.0` at peeled tag target
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`. The tag and the `main`,
  `develop`, and `release/v1.1.0` refs/trees were not modified. The new
  release branch is already an ancestor of `main` and `develop`.
- Task PR #52 merged into P28 as `f9bb715`; the P28 -> `develop` PR
  merged as PR #53 (`0402592`). Task-branch and final P28 branch gates
  all exit 0:
  `npm test -- --coverage` (98 suites, 1,267 passed, 1 skipped;
  95.96/92.04/98.02/97.63% coverage), `npx tsc --noEmit`, `npx expo lint`,
  `npx expo-doctor` (21/21), `npx expo export --platform android`, and
  `npx expo export --platform ios`.

### P28-E-R5-R1 final integration ledger sync (2026-11-09)

- Recorded the completed P28 -> `develop` integration: PR #53 merged as
  `04025926a95b8dda22f15e67b4ea3c3c8769a994`. The merge changed only the
  P28-E-R5 ledger/memory evidence and its progress-ledger regression.
- Verified remote tips after integration: `develop` at the PR merge commit,
  `main` and `release/v1.1.0` remain at `7bea8e62`, and `release/v1.0.0`
  remains at the existing tag target `cac6fed`. No tag or protected branch
  was moved.
- Updated the exact-once progress guard for P28-E-R5-R1 and the dashboard
  totals. Old P28 / overall counts were 24/24 and 152/174; new counts
  are 25/25 and 153/175. No assertion was removed or weakened.
- The final six ordered task-branch gates all exit 0: coverage (98 suites,
  1,267 passed, 1 skipped; 95.96/92.04/98.02/97.63%), TypeScript, lint,
  Expo Doctor (21/21), Android export and iOS export. The focused
  progress-ledger test passes (1 suite, 11 tests).

### P28-E-R4 history archive ancestry (2026-11-09)

- Added tree-preserving merge `c4f9aba` on
  `task/P28-E-R4-connect-history-archive`, with
  `origin/history/by-phase` tip `e4a95d57d7bfa3d062d233c3ca315a1a520ef654`
  as a parent. The merge's tree equals the captured `develop` tree; the
  archive tree itself was not checked out. `main` and `release/v1.1.0` remain
  at their original tip and tree.
- All 30 remote `phase/*` tips are ancestors of `develop`; `history/by-phase`
  was the only disconnected head found. The task -> P28 -> `develop`
  route and final reachability check remain pending.
- All six ordered gates exit 0. Gate 1: 98 suites, 1,267 passed, 1 skipped;
  coverage 95.96/92.04/98.02/97.63% overall, `src/data`
  91.03/87.41/94.46/94.17%, `src/domain` 96.94/92.87/98.80/98.33%, and
  `src/lib` 100% in all measures. Gates 2-6 exit 0; Expo Doctor is 21/21.

### P28-E-R3 selected ancestry (2026-11-09)

- Added three `ours` merge commits on
  `task/P28-E-R3-record-selected-ancestry` for `f994457`, `7bea8e6` and
  `b779c21`. The ancestry merges preserve the captured `origin/develop` tree;
  subsequent changes are limited to ledger/memory documentation and a ledger
  test. Application source, `main`, and release tags are unchanged. PR #46
  remains isolated to `history/by-phase`.
- Task PR #47 merged to `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at
  `3553b736861919d6f617c3048080152268714c42`; the phase integration PR follows
  the documented route into `develop`.
- Gate 1: 98 suites, 1,267 passed, 1 skipped; coverage 95.96/92.04/98.02/97.63%
  overall, `src/data` 91.03/87.41/94.46/94.17%, `src/domain`
  96.94/92.87/98.80/98.33%, and `src/lib` 100% in all measures. Gates 2-6 exit
  0; Expo Doctor is 21/21. Full gate commands and results are in Section 10.
- Replaced the progress-ledger test's `Revised by P28-E-R1` check with the
  exact R1/R2/R3 revision chain and added exact-once tracking for R2/R3.
  Reason: protect the newly recorded revision without weakening status,
  percentage, or phase-index assertions.

### Owner-edit preservation instruction (2026-11-09)

- P20-S-R1-R1 adds R5 to root `AGENTS.md` at the owner's explicit request:
  when owner edits follow agent changes, ask before changing the affected
  file, and revert or overwrite those edits only on explicit request.
- Documentation-only change; no code behavior changed. The focused permanent
  progress-ledger test passes; full six-gate validation is not applicable.
- Updated the P20 dashboard and branch-index counts from 27 to 28 and
  added the revision ID guard. Old assertion: P20 had 27 subtasks. New:
  P20 has 28, including P20-S-R1-R1. Reason: ledger now tracks this
  completed revision in its existing phase; no new phase or branch row was
  added.
- Commit `e955021`; task-to-phase PR #44 merged as
  `93dfb6acacca296ff7ef5c4629721efd5e0d3995`; phase-to-develop PR #45.

### P20-S-R1 form controls (2026-11-09)

- Replaced app-form/settings ChoiceField controls with Dropdown, excluding
  filters; the ChoiceField component and frozen form components remain.
- Added persistent, single-line titles to editable text, money, number and
  percent fields that previously relied on placeholders, and contextual
  titles to date controls that lacked them. SegmentedControl labels are
  intentionally omitted, as directed by the owner after review. Existing
  Dropdown, SwitchRow and ReadOnlyRow titles remain; filters are unchanged.
  No ReadOnlyRow was added to editable inputs.
- After the title changes, `npx tsc --noEmit` and `npx expo lint` pass.
  `npm test -- --runInBand --silent src/components/__tests__/RouteRenderSmoke.test.tsx src/components/__tests__/TransactionForm.test.tsx src/components/__tests__/formComponentsFrozen.test.ts src/lib/__tests__/progressLedger.test.ts`
  passes: 4 suites, 204 tests. An initial run exposed that the existing
  transaction assertion checked a `MoneyField` placeholder prop instead of
  the new visible title; the assertion was updated to check rendered title
  text as documented below.
- Superseded test assertion: `expect(amount.props.label).toBe('Amount')` only
  checked the input placeholder prop. It is now replaced by an assertion that
  the rendered form contains the visible `Amount` title. Reason: the request
  is for a persistent title, not a component label/placeholder; the visible
  title assertion checks that exact behavior without weakening coverage.
- Final-tree six-gate run, in order, all exit 0: `npm test -- --coverage`
  (98 suites, 1,267 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall);
  `npx tsc --noEmit`; `npx expo lint`; `npx expo-doctor` (21/21);
  `npx expo export --platform android`; `npx expo export --platform ios`.
  Coverage per instrumented `src/` directory (statements/branches/functions/
  lines): `data` 91.03/87.41/94.46/94.17%, `domain`
  96.94/92.87/98.80/98.33%, and `lib` 100% in all measures.
- Replaced assertions: the old `expect(amount.props.label).toBe('Amount')`
  checked the placeholder prop; the new assertion checks rendered `Amount`
  title text. Owner-removed SegmentedControl title expectations were removed;
  transaction type options are still checked against `expense`, `income` and
  `invest`, and the manual Investment type still verifies `Fixed deposit` is
  selectable. Reason: the approved UI intentionally has no SegmentedControl
  titles, while choice behavior remains covered.
- Owner approved commit/merge and explicitly requested not to restore removed
  SegmentedControl labels. No version change, release preparation, or
  EAS/Gradle build.
- Integration: commit `d36103e`; task-to-phase PR #42 merged as
  `bb755347a809a46df9fd81d83859dd8c3c98027e`; phase-to-develop PR #43.

### v1.1.0 versioned APK filename integration (2026-11-08)

- The filename and release-documentation changes reached GitHub `main` through
  chronological PRs: #21 task to P28 (`a7df47f`), #22 P28 to
  `develop` (`9c79b23`), #23 `develop` to `release/v1.1.0` (`0ee755f`),
  #24 release to `main` (`9192fd6`), and #25 `main` back to `develop`
  (`ddb17ff`).
- Verified the remote trees for `main`, `develop`, `release/v1.1.0`, and
  `qa-and-release` (historical branch name: `phase/28-qa-and-release`) are identical. The v1.1.0 tag was not changed.
  The merged task branch was deleted; the P28 branch remains available.
- The final ordered six-gate run passed: 98 Jest suites, 1,244 passed, 1
  skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data`
  91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%,
  `src/lib` 100%; TypeScript, lint, Expo Doctor (21/21), Android export and
  iOS export all exited 0.
- P28-E-R2 preserves the final-verification commit `72fb325` and reconciles
  its stale status edits before chronological PR integration. Review found
  `codex-changes` is not safe to publish as-is: it targets schema v2 rather
  than current v22, includes generated coverage, contains a persisted-data
  migration defect and failing assertion, and conflicts with current `main`.
  It remains local pending a separately scoped decision to port needed work.

### Historical commit-subject corrections (superseded by CM-1 enforcement; 2026-11-07)

- With explicit owner authorization, corrected five historical checkpoint
  subjects on `main` and force-pushed using a lease from
  `6d50bdb9887ced961433c93daaf3a4c67f341d7c`. Each replacement commit has the
  same tree as its original:
  - `9b9066bb3c51c33a78e98b2779d664f16f2c2700` ->
    `9e8bde709c618fe5359258507e8182a4c873499c` — `docs: add release
    management documentation`.
  - `b0586fcbdf0787a0acd929f8bb3f2e044d699389` ->
    `3ef87b1cb54370addd987ad382f8350a25778858` — `docs: align Phase 29
    progress counter`.
  - `ff349515887dae09ac5ebc34776ec2754ed80dbe` ->
    `f467e58701a91b709009f03eb1b7b47a3f5d1332` — `chore: update Expo SDK 57
    patch dependencies`.
  - `ecc5c354579bf5812effe5adc3492e61cfd98f4f` ->
    `c94aca65b842c3fe2b6590bb3c3e3093e50fdcf3` — `fix: clarify Budget
    due-day field labels`.
  - `75e9097bcf62c09cf22149160318e6392fb1060c` ->
    `46ffe0966dcacd8839244f4a7e9e87ddb2c3cbaa` — `fix: simplify Budget
    management sheet labels`.
- Verified the rewritten subjects and unchanged tree IDs, and confirmed
  `origin/main` now resolves to `91cfde59c4cd4821377399c55fb1ba3052aaf9f2`.
  The published `v1.0.0` tag was intentionally left unchanged at
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`; no tests or builds were needed
  for this message-only history change.

### Release commit message correction (2026-11-07)

- Reworded local commit `6a407b45226ac9e3dc8e2a6399467fe05f6a0a15` to
  `60a4c8b1d287fbea1cec7f622690aa898b61bda0`
  (`docs: prepare initial v1.0.0 release draft`), matching its release-draft
  and status changes.
- Reworded local commit `8c0857c2c50dfc87cc67808cdc0bf09aa7139739` to
  `be1e626f8b13e499f94bc86b1a517ed33d0cab14`
  (`docs: record v1.0.0 release publication`), matching its publication
  record, history and release-documentation changes.
- Replayed descendant `8324822981153b602f5168e08b6759537fc0f111` unchanged in
  content as `a29d861d0d8541c942e06b9ebbdc04f61e7c8c29`; no commits were
  pushed. Existing Copilot co-author trailers were retained. All replacement
  commits were verified in Git.

### Published release notes directory (2026-11-07)

- Created `docs/releases/published/` and moved the already-published
  `v1.0.0.md` record there.
- Updated the release prompt, README, configuration, history, and release
  rules to require all published Markdown records to live in `published/`;
  drafts move there after publication verification and are removed from
  `drafts/`.
- Updated current status/open-items memory links. This documentation-only
  change does not alter the GitHub Release or its published notes.

### v1.0.0 GitHub Release published (2026-11-07)

- Published the approved `v1.0.0` GitHub Release at
  https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0.
  GitHub reports it is published, not a draft or prerelease, at
  `2026-11-07T14:12:34Z` (2026-11-07).
- The `v1.0.0` tag resolves to target commit
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`, matching `origin/main` at
  publication. The release notes' date placeholder was corrected to
  `2026-11-07` and the published body reverified.
- Archived the final notes in `docs/releases/published/v1.0.0.md`, updated release
  configuration/history/index and the memory status/open items, and removed
  the published draft.
- Pre-publication worktree edits were committed exactly in
  `6a407b45226ac9e3dc8e2a6399467fe05f6a0a15`
  (historical subject, superseded by CM-1 enforcement:
  `chore: user manual changes (checkpoint)`). That commit included the
  deletion of the placeholder `docs/releases/v1.0.0.md`; the permanent record
  was recreated as requested after publication. The owner's release README
  line reflow was preserved.
- No application source or version files were changed. No tests/builds were
  run. The EAS production build remains unrun.

### Initial v1.0.0 release draft prepared (2026-11-07)

- Preflight worktree was clean. The initial unscoped GitHub CLI listing showed
  a `v0.1.0` draft; subsequent repository-scoped CLI/API checks returned no
  releases or tags. Neither result shows a published stable baseline. Reconcile
  the discrepancy during approval revalidation. The repository initial commit
  is `f27258093e14809fe923e480381488ece0d859a9`; target branch `main` is at
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`.
- Recommended version is `v1.0.0`, consistent with `app.json`, `package.json`
  and `CHANGELOG.md`. The initial commit is the history baseline; 365 commits
  follow it through the target. GitHub CLI returned no merged PRs; GitHub's
  contributors endpoint verifies `sahilsheikh-dev` and `Copilot`.
- Saved the unpublished, source-checked release draft at
  `docs/releases/drafts/v1.0.0.md`. No version files, tags, GitHub releases,
  permanent release records or application code were changed.
- No tests or builds were run for this documentation-only draft. Publication
  awaits explicit approval; revalidate the target commit and release notes
  before publishing.

### Release README approval prompts (2026-11-07)

- Added copyable draft-preparation and post-approval publication prompts to
  `docs/releases/README.md`. The preparation prompt explicitly prohibits
  publishing and waits for approval; the second prompt revalidates the target
  commit and release notes before publication and permanent documentation
  updates.
- Documentation-only change; no release was prepared or published. No tests
  were run.

### P29-AB completion record (2026-11-07)

- Owner checkpoint: initial worktree was clean; no owner-manual checkpoint
  commit was required. Owner edits remained untouched.
- Added v22 Budget income recurrence: monthly, quarterly, half-yearly and
  yearly; non-monthly first-due month; strict backup/import support.
- Preserved owner UI edits: no Insurance or Transactions Available balance
  border/divider restoration; recurring action remains "Stop investment".
  The stopped-plan action is now "Resume investment".
- Gate 1 passed 91 suites: 1193 tests passed, 1 skipped. All files coverage
  was 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines.
  Gate 2 TypeScript passed; Gate 3 lint passed with one existing array-style
  warning; Gate 4 Expo Doctor passed 21/21; Gate 5 Android export passed with
  a 5.5 MB bundle; Gate 6 iOS export passed with a 5.2 MB bundle.

### P29-AB-R1 recurring income correction (2026-11-08)

- Evidence-first reproduction used the exact form payload fields
  (`name`, `amount`, `category`, `day`, `frequency`, `firstDueMonth`) at
  domain, store/hydration and route levels before production edits. The
  baseline overview listed the combined monthly, quarterly, half-yearly and
  yearly items as 55,000 every month; the policy estimate was 660,000. A
  following-scope edit also changed the stored current-month snapshot from the
  quarterly schedule to the new half-yearly schedule.
- Reproduced 12 months from 2026-03 through 2027-02 before and after the
  fix. The due-month totals are 13,000; 19,000; 25,000; 13,000; 1,000;
  1,000; 13,000; 19,000; 1,000; 13,000; 1,000; 1,000 in every tested
  consumer: `plannedIncomeOf`, overview income rows and totals, summary text,
  Received dues, projected cash flow, virtual months, applied snapshots and
  backup import. Non-due entries contribute zero; due entries contribute the
  full amount. The policy estimate is 119,000 over its current-February-to-
  January 12-month window because the first 1,000 monthly item is first due in
  March; the separately tested March-to-February table totals 120,000.
- Assertion replacements: old — monthly overview showed 55,000 in each of
  12 months and policy estimate 660,000; new — each consumer follows the
  item’s due month and the annual estimate uses the effective monthly budget;
  reason — a frequency must affect every monthly consumer, not only the
  recurrence helper. Old — a following-scope frequency edit rewrote the
  current frozen snapshot; new — changing frequency/first-due metadata updates
  the   plan but leaves that snapshot data-equal; reason — past and
  current snapshots remain frozen. Monthly income behavior and v22 schema
  compatibility are unchanged.
- Form route tests submit both scopes and edit quarterly income to half-yearly
  at font scales 1.3 and 2.0. The Budget route announces a non-due quarterly
  item as zero planned at both scales. Store tests verify persisted JSON,
  fresh hydration, and following/month-only edit scopes.
- Real gates, in order: `npm test -- --coverage` exit 0 (94 suites; 1,211
  passed, 1 skipped; 95.90% statements, 91.94% branches, 97.75% functions,
  97.57% lines overall; `src/data` 90.63/86.95/93.07/93.92%,
  `src/domain` 96.96/92.88/98.79/98.31%, pure `src/lib` 100% in all
  measures); `npx tsc --noEmit` exit 0; `npx expo lint` exit 0;
  `npx expo-doctor` exit 0 (21/21). Android and iOS export gates were skipped
  under the explicit no-build instruction. No version bump, release
  preparation, build or push.
- Commit: `fix: honor recurring income schedules in summaries`.

### P28-B first-release 1.0.0 metadata (2026-11-07)

- Owner-edit preflight: the worktree was clean; no owner checkpoint commit was
  required. Protected Home and Budget routes were not edited.
- Release metadata is aligned to version `1.0.0` in `app.json`,
  `package.json` and the `package-lock.json` root. CHANGELOG documents the
  user-visible result from P24 through P29, including Budget income
  recurrence and schema v22.
- Exact release commands, not run:
  `eas build --platform all --profile production`
  then
  `git tag -a v1.0.0 -m "WealthWise 1.0.0"`
- Tag preflight found 17 local tags, no local `v1.0.0`, and no tags returned by
  `git ls-remote --tags origin`. No tag was created, moved, or deleted.
- Assertion replacement: old `P29 ██████████ 97% (31/32)`; new
  `P29         ██████████ 97% (31/32)`; reason: preserve the owner's
  dashboard column alignment. The memory test counts now match the latest
  validated 91-suite, 1194-test run rather than the stale 92/1195 record.
- Six ordered gates: Gate 1 `npm test -- --coverage` exit 0 (91 suites; 1193
  passed, 1 skipped, 1194 total); Gate 2 `npx tsc --noEmit` exit 0; Gate 3
  `npx expo lint` exit 0 (one array-style warning); Gate 4 `npx expo-doctor`
  exit 0 (21/21); Gate 5 Android export exit 0 (5.5 MB bundle); Gate 6 iOS
  export exit 0 (5.2 MB bundle).
- Fresh Gate 1 coverage by `src/` directory: `src/data` 758/807 lines
  (93.93%) and 793/912 branches (86.95%); `src/domain` 3567/3628 lines
  (98.32%) and 3505/3776 branches (92.82%); `src/lib` 107/107 lines and
  126/126 branches (100%). Overall coverage: 95.90% statements, 91.89%
  branches, 97.75% functions and 97.57% lines. Coverage thresholds unchanged.

### P28-B Assets resume action label (2026-11-07)

- The Assets and investment-entries action, its confirmation title, icon
  selection, accessibility hint, domain assertion and current documentation
  now use "Resume investment" instead of "Resume recurring".
- Focused domain regression and TypeScript verification are recorded in chat.
  No commit was requested or created.

### Release management documentation (2026-11-07)

- Added the release-management documentation set under `docs/releases/`:
  [README](releases/README.md), reusable
  [release prompt](releases/RELEASE_PROMPT.md),
  [release configuration](releases/release-config.md),
  [release history](releases/release-history.md),
  [v1.0.0 release record](releases/published/v1.0.0.md), and the `drafts/`
  directory.
- The documentation defines source-verified release discovery, semantic
  versioning, draft preparation, explicit publication approval, and archival
  of published release notes and history. It prohibits inventing release
  details, publishing without approval, and overwriting published records.
- The user-added files were preserved and committed exactly in
  `9b9066b` (historical subject, superseded by CM-1 enforcement:
  `chore: user manual changes (checkpoint)`), verified as a commit.
  No release build or tag was performed by this documentation setup.
- Release metadata remains unverified: `release-config.md` has `UPDATE_ME`
  repository identity fields; `release-history.md` marks v1.0.0 as Verify; and
  `v1.0.0.md` retains placeholders for actual publication date, GitHub Release
  URL, target commit, verified notes and full changelog URL. These must be
  populated only after checking the actual published GitHub Release and tag.
- **Superseded (2026-11-08):** later v1.0.0 publication records verified the
  release identity, date, tag target, notes and changelog; see
  `docs/releases/published/v1.0.0.md` and `release-history.md`.

### P28-C release organization and build management (2026-11-08)

- Preflight worktree was clean. Protected-file `git hash-object` results for
  Home, Budget, `SortChip`, sorting, the frozen manifest and its test match
  the recorded hashes. Neither protected route was edited.
- Step 1: `git ls-remote --tags origin` returned `v1.0.0`; the required
  `git merge-base --is-ancestor v1.0.0 origin/main` check exited 1. The tag
  was not changed. Its current ancestry status is recorded in
  `docs/releases/release-history.md` and `docs/memory/open-items.md`.
- Added the reusable release-notes template and EAS build/configuration guide,
  updated release prompts/config/index, ignored release drafts except for
  `.gitkeep`, added build tracking (`v1.0.0` production build: Not built),
  and summarized the release process in the root README. No build, submission,
  publication, tag creation or tag movement occurred.
- Assertion replacements (old → new; reason):
  - `memoryDocs.test.ts`: hardcoded project test-count assertions (`91`,
    `1194`) → project counts must equal the counts in `status.md` and its
    latest validated run; reason: counts are read from the project records,
    not duplicated as literals, while equality checks remain.
  - `progressLedger.test.ts`: fixed overall/phase bars and counts, fixed
    maximum phase 29, and the ten-section expected list → derive bars and
    counts from dashboard rows and section count/order from numbered headings
    and the Contents index; reason: retain validations for every displayed
    count, percentage, bar, row status and indexed heading without freezing
    future phase or section totals.
- All progress bars are recomputed from the dashboard rows. The prior
  Resume point, Schema history, Roadmap and CR-1 open record now carry dated
  supersession notes; v16-v22 schema entries are based on current migration
  source. Missing report/checklist paths were removed or redirected to the
  ledger and release build guide.
- Gate results, run in the required order:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1193 passed, 1 skipped, 1194 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | 0 errors; one pre-existing `array-type` warning at `src/data/__tests__/migrate.test.ts:221`. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- Focused ledger/memory tests: 2 suites, 10 tests passed. All dashboard rows
  have unique IDs; derived totals are 113/114 overall, 3/3 for P28 and
  32/33 for P29. Current schema v22 and all six protected blob IDs were
  verified against source and `git hash-object`. Native physical-device
  checks remain unverified. Production build and store submission were not
  performed.

### P28-C-R1 README downloads and release rules (2026-11-08)

- Preflight worktree was clean. Fixed the existing `array-type` lint warning
  separately: `Array<Record<string, unknown>>` became
  `Record<string, unknown>[]` in `src/data/__tests__/migrate.test.ts`; no
  behavior or assertion changed. Isolated commit: `13fce0e`.
- README now has a Download section before Contents, source-version/release
  date, the live Old versions link, explicit pending Android/iOS notices and
  APK installation guidance. No dead Android link or invented iOS URL is
  shown. What's new summarizes `CHANGELOG.md` v1.0.0.
- Source audit corrected the schema and migration range to v22 / v1–v22,
  documented monthly/quarterly/half-yearly/yearly Budget income, current
  Insurance placeholder behavior, and the real 91-suite/1194-test run.
  Stop/Resume investment and Foreclosure labels remain aligned with source.
- Added the `android-apk` profile extending production with APK output, without
  changing existing profiles. Documented production AAB for Play, GitHub APK,
  separately auto-incremented `versionCode`, iOS store channels and EAS-managed
  signing credentials. No build was started.
- Release instructions require exact APK asset naming/upload, 302-to-200
  download verification, README and Builds table updates, and consistency
  across README, release history and GitHub release assets before publication.
- Assertion record: `progressLedger.test.ts` now expects the P28-C revision ID
  and derives phase/progress values from ledger rows; its old fixed phase list
  assertion is replaced with an additional P28 completion check so this
  revision is tracked without hardcoded counters. `memoryDocs.test.ts` remains
  file-derived, comparing the recorded counts to status and the latest run.
- Ordered gates:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1193 passed, 1 skipped, 1194 total. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed with 0 errors and 0 warnings. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- Focused migration, ledger and memory run: 3 suites, 40 tests passed.
  Coverage in the full run: 95.90% statements, 91.89% branches, 97.75%
  functions and 97.57% lines. No device build, store submission, release
  publication, tag operation or push occurred. Physical-device checks remain
  unverified.

### P28-C-R2 release downloads and P28-A-R1 v13 backup equality (2026-11-08)

- R1 preflight found a clean worktree. `app.json` and the published v1.0.0
  release record both identify version 1.0.0 and release date 2026-11-07.
  `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` were not edited.
- Step commits: P28-C-R2 README `144a847`, published note `1742174`, release
  rules `181aa44`, Builds record `356ec56`; P28-A-R1 test `f8ae2ad`.
- `gh release view v1.0.0` verified the uploaded asset name
  `WealthWise-android.apk`, size 112,133,413 bytes (about 106.9 MiB); its
  digest was verified privately.
  At that time, `gh repo view` reported the repository as private and
  unauthenticated links returned HTTP 404. This historical result was
  superseded by P28-C-R3 after the repository became public.
- Superseded by P28-C-R3: staging release-note content under `/tmp` is no
  longer permitted. The published v1.0.0 Markdown is the canonical release
  body source. The GitHub body was not edited in P28-C-R2.
- The new deterministic v13 backup fixture has a valid SHA-256 checksum and
  is imported through `parseBackup`. Expected net worth, every goal's saved
  amount and Emergency Fund available amount are independently computed from
  source fixture values; all imported outputs match. No personal data or app
  behavior change was introduced. The focused backup suite passed 37 tests.
- Assertion record: no backup/value assertion was removed or weakened. The
  ledger test's old revision-marker assertion
  `Revised by P28-C-R1` is replaced by `Revised by P28-C-R2`, because R2 is
  the current release-rules revision; a P28-A-R1 revision assertion was
  added. Derived dashboard counts remain based on ledger rows. The
  `memoryDocs.test.ts` test remains derived from project/status files. Two
  intermediate focused ledger runs failed because the text did not satisfy
  its case-sensitive revision-marker expectation; the wording was corrected,
  and the final focused ledger/memory run passed 2 suites and 10 tests.
- Six ordered gates, all exit 0:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1,194 passed, 1 skipped, 1,195 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. `src/data`: 90.63/86.95/93.07/93.92; `src/domain`: 96.96/92.82/98.79/98.31; `src/lib`: 100/100/100/100 (statements/branches/functions/lines). |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- No native build, `gh release edit`, tag operation or push occurred.
  Physical-device checks remain unverified.

### P28-C-R3 release finalization (complete)

- Step 1: release drafts are committed under `docs/releases/drafts/`, and the
  shared release rules direct publication to move verified notes to
  `published/`. The old drafts ignore rule and temporary-block reference were
  removed. The v1.0.0 release body remains owner-managed from
  `docs/releases/published/v1.0.0.md`.
- Step 2: README, template and latest published v1.0.0 Download blocks are
  byte-identical. Added a Jest regression that derives the current version
  from README and verifies older published notes use their own versioned link.
- Focused documentation tests: 3 suites and 12 tests passed after close-out
  edits. The release-download test added expectations without replacing any
  assertions. `progressLedger.test.ts` now expects the parent revision marker
  `Revised by P28-C-R3 and earlier revisions` instead of
  `Revised by P28-C-R2`; this is the intended ledger revision update, not a
  weakened assertion.
- Step 3: `curl -I -L` returned HTTP 200 and `Content-Length: 112133413` for
  both latest and versioned APK links. The downloaded GitHub APK was
  112,133,413 bytes and its SHA-256 matched the published digest. The scratch
  APK was removed. Results are recorded in `release-history.md`.
- Step 4: EAS build `7addde9a-34df-4f00-a54a-b695c1578859` is FINISHED,
  Android profile `preview`, app version 1.0.0, `appBuildVersion` /
  `versionCode` 1, source commit
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`, completed 2026-11-07 14:52 UTC.
  Its artifact has the same 112,133,413-byte size and SHA-256 as the GitHub
  APK; all requested build fields are recorded in `release-history.md`.
- Step 5: with explicit approval for this single tag move, moved remote
  `v1.0.0` from `1c1426d03fadccc51278ed9af5426cacd4c9d7af` to
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`. The build commit is an ancestor
  of `origin/main`; runtime diff is empty. Remote peeled tag verification
  matches the new target and `git merge-base --is-ancestor` exited 0.
  `gh release view` still confirms the APK asset; its stored `targetCommitish`
  remains the old target. No GitHub release edit or branch push was made.
- Step 6: release policy now maps bug-fix-only to PATCH, visible new features
  to MINOR, and breaking changes to MAJOR. Release 2 is conditionally v1.1.0
  with Budget Pace or v1.0.1 without it; owner confirmation is required when
  preparing that release. App/package/lockfile versions change only in that
  version's release-preparation task.
- Step 7: added the Android owner checklist with all X1–X4 and A1–N39 checks,
  device metadata fields, and every result set to Not run (43 checks). Linked
  it from the release index and build guidance. The later owner report below
  records all 43 results as Pass.
- Step 8: P28 dashboard count is 7/7 and the full ledger is 117/118.
  The parent P28-C revision text and derived test expectations were updated;
  no unrelated or product assertion changed. `status.md`, `open-items.md` and
  `project.md` record the verified build/tag/link state, six gates and owner
  actions. Remaining owner work is the GitHub release-body edit and supplying
  details for the separately reported Release 2 bugs.

- Final gates, run in the required order; all commands exited 0:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 92 suites; 1,196 passed, 1 skipped, 1,197 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- No application behavior changed. No build, branch push or GitHub release
  edit was performed. The sole remote change was the explicitly approved
  `v1.0.0` tag alignment described above.

### Superseded owner device-validation report (2026-11-08)

- The owner manually updated the checklist (preserved in historical commit
  `cc7eded7b5f5ba8dee957f96a1ab5725cd08e796`): at that time, all 43 rows were
  marked Pass, including N39. This report is superseded by the Release 2
  stabilization checklist update below: N39 and N40 are Fail, and N41 is Not
  run.
- The checklist header's device model, Android version, tester and date fields
  remain blank; no values were inferred.
- This historical report predates owner confirmation that the Release 2 bugs
  reproduce and the evidence-first reproductions recorded in the later task
  entries. It must not be used as current device evidence.

### Owner-requested local commit subject correction (2026-11-08)

- Reviewed commit `3ed74ba2ae338c9722ce49ed77f38222d15ebb7b`: its only change
  was replacing the 43 device checklist results from `Not run` with `Pass`.
  Reworded its historical subject (superseded by CM-1 enforcement) from
  `chore: user manual changes (checkpoint)` to
  `docs: record owner Android device test results`
  (`cc7eded7b5f5ba8dee957f96a1ab5725cd08e796`).
- Verified old and new commit trees are identical. Replayed the following
  owner-report commit without changing its tree:
  `79afe4f0c43a70e85f05fe881d729657663dc82b` ->
  `79bad92c8161d136c1477f6e817c7ecb55b6caa7`.
- The rewritten commits remain local and unpushed; `main` is two commits ahead
  of `origin/main`. No file content was changed by the history rewrite.

### P28-D branching and contributor-doc bootstrap (2026-11-08)

- Created local `develop` from the exact main adoption baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d` (commit object verified).
  Existing main history includes unreleased Release 2 changes; the stable-main
  rule applies prospectively and no history was rewritten.
- Added the COMMON RULES section to AGENTS.md, mirrored R1-R4, branch policy,
  merge policy and six gates in the shared rules/ledger, and added
  contributor/security guidance, PR/issue templates and CODEOWNERS.
- New Jest documentation checks require the common-rule declaration and all
  branch prefixes in CONTRIBUTING.md and shared rules. Progress totals remain
  derived from ledger rows.
- This bootstrap commit is the sole direct commit to `develop` authorized by
  the owner. Push is deferred to the authorized final branch-publishing step.
- Six gates, in order: `npm test -- --coverage` exit 0 on retry (98 suites;
  1,230 passed, 1 skipped, 1,231 total); `npx tsc --noEmit` exit 0;
  `npx expo lint` exit 0; `npx expo-doctor` exit 0 (21/21);
  `npx expo export --platform android` exit 0 (5.5 MB bundle);
  `npx expo export --platform ios` exit 0 (5.2 MB bundle). Coverage:
  overall 95.96/92.01/98.01/97.62% (statements/branches/functions/lines);
  `src/data` 91.03/87.39/94.46/94.17%; `src/domain`
  96.95/92.85/98.80/98.32%; `src/lib` 100% in all measures. The initial
  parallel Gate 1 attempt exited 1 on two 5-second crypto/stress test
  timeouts; both tests pass in isolation and the complete retry passed.

### Release 2 stabilization close-out (2026-11-08)

- Commit-subject enforcement was the first task commit (`54abb4b`): old
  placeholder subjects were accepted; the new POSIX hook requires a supported
  Conventional Commit type and rejects prohibited subjects. Reason: make each
  change's scope clear and keep unrelated work separate. The proposed subject
  and staged diff-stat are reviewed before commits. Hook, docs and ledger
  tests pass.
- P29-AB-R1: prior consumers reported 55,000 of planned income every month
  (monthly 1,000 + quarterly 12,000 + half-yearly 18,000 + yearly 24,000).
  After the fix, the combined monthly planned-income contribution is:

  | Month | Before: all tested monthly consumers | After: due-month total |
  |---|---:|---:|
  | 2026-03 | 55,000 | 13,000 |
  | 2026-04 | 55,000 | 19,000 |
  | 2026-05 | 55,000 | 25,000 |
  | 2026-06 | 55,000 | 13,000 |
  | 2026-07 | 55,000 | 1,000 |
  | 2026-08 | 55,000 | 1,000 |
  | 2026-09 | 55,000 | 13,000 |
  | 2026-10 | 55,000 | 19,000 |
  | 2026-11 | 55,000 | 1,000 |
  | 2026-12 | 55,000 | 13,000 |
  | 2027-01 | 55,000 | 1,000 |
  | 2027-02 | 55,000 | 1,000 |

  The after values match `plannedIncomeOf`, overview income rows/totals and
  text, Received dues, projected cash flow's monthly income inputs, virtual
  months, applied/repeated plans, edit snapshots and backup round trips.
  Quarterly, half-yearly and yearly item amounts are zero in non-due months
  and full in due months; existing monthly income is unchanged. The separate
  policy-summary window is March-to-February 120,000; its current-February-to-
  January annual estimate is 119,000 because the monthly item first comes due
  in March. Store/form tests cover both scopes, frequency edits and frozen
  current/past snapshots.
- P30-A/B/C: confirmed hypothesis — after failed SQLite write, read-back
  mismatch or legacy fallback, restart selected stale SQLite over the newest
  fallback value. All three red tests pass after source-precedence repair, and
  persistence errors are visible. Not reproduced: UI memoization/React
  Compiler, missing mounted-screen subscriptions, module-level caches,
  in-place state mutation or route-param object caching. Real store JSON,
  fresh hydration, eight mounted-screen refresh checks and previous-state
  immutability passed; source guards cover memo inputs and module caches.
- P20-N-R1: before production edits the route test failed at font scales 1.0,
  1.3 and 2.0 because two stacked bars rendered instead of zero. After the
  chart change, section lines, independent toggles, marker/color patterns,
  cumulative axes, accessibility summaries and dark-theme contrast tests
- P20-N-R2: the old section-specific Pace tests and implementation are replaced
  by the restored aggregate actual/planned Pace graph above the overview
  table, with no stacked bar. The old section-line/toggle assertions are
  superseded by aggregate chart and route assertions at font scales 1.0, 1.3
  and 2.0 because the requested presentation is aggregate. The demo remains
  non-trivial. Cash-flow labels, removed controls, Insurance/Transactions
  border removals, and Stop/Resume investment labels remain unchanged.
- P20-A-R1: the failing linked-plan Paid path created a plain transaction
  without the holding entry/payment ledger. After the fix, Transactions,
  Home, Budget and reminder confirmation use shared clearDue/Undo, with one
  persisted write.
- P29-O1-R1/P29-W-R1: old Entries screens lacked completed/pending counts and
  collapsed paid history; investment rows could extend past maturity and
  liability rows past the last EMI. New tests assert counts, collapsed/expanded
  paid groups and the rendered schedule caps at font scales 1.0, 1.3 and 2.0.
  The fixed seven-row assertion was replaced by a schedule-derived expected
  row set because pending scheduled rows are now rendered.
- P29-AB-R2: old Budget route output presented non-due recurring income as
  planned/due and counted it in summaries. New: non-due items appear only in
  the collapsed editable Recurring income group with their next due month;
  due-month totals remain exact. Route cases cover 12 months and font scales
  1.0, 1.3 and 2.0.
- P30 is complete (P30-A/B/C, 3/3); P29-AB-R1/R2 and P20-N-R1/R2 are
  recorded in their original phases with each preceding row marked `Revised
  by`. P20-A-R1, P29-O1-R1 and P29-W-R1 are also in their original phases.
  Derived dashboard progress is 130/131; P20 25/25, P28 10/10,
  P29 36/37, P30 3/3.
- Final integrated-`develop` gates all exit 0. Gate 1:
  `npm test -- --coverage` — 98 suites, 1,242 passed, 1 skipped; coverage
  95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%,
  `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100% in all measures.
  Gate 2 `npx tsc --noEmit` — 0; Gate 3 `npx expo lint` — 0; Gate 4
  `npx expo-doctor` — 0 (21/21); Gate 5 Android export — 0 (5.5 MB);
  Gate 6 iOS export — 0 (5.2 MB). The full run preceded only ledger/hash
  documentation corrections; the focused ledger test passed afterward.
  No EAS or Gradle build, release preparation or version/schema bump is in
  scope.
- Checklist results: N39 Fail, N40 Fail, N41 Not run (aggregate Pace graph,
  no stacked bar), N42 Not run (paid sync/Undo), and N43 Not run (Entries
  counts and schedule caps). Device header fields remain blank; physical
  re-test and v1.1.0 release preparation remain pending because the Pace graph
  is a visible feature.
- Protected hashes verified with `git hash-object`: Budget
  `589ce9d73c80971cc78ac2a7011faa96186944fb`; Home
  `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`.

### P28-E phase-history mapping (2026-11-08)

- Added 30 `phase/NN-slug` branches and annotated `phase-NN-complete` tags;
  the existing `v1.0.0` tag is unchanged. At the archive snapshot, the source
  set contained 512 commits: 487 reachable from selected main/codex/task/phase
  branches and tags, plus 25 additional commit objects explicitly referenced
  in the ledger. Integration and follow-up commits created after that snapshot
  are intentionally outside the read-only archive.
- The final map assigns 337 commits directly from task subjects, prompt commit
  cells, phase notes, labels, task refs and phase tags; 175 remaining commits
  use the nearest preceding subtask date within the closest evidenced phase.
  All 512 original hashes appear exactly once; none are unmapped. Four direct
  mapping ties prefer an exact commit-subject match, then the most specific
  task ID and ledger order. Sixteen subtasks lack an original source commit
  and reuse the preceding archive tree rather than inventing a source.
- The preliminary 485 / 354-direct / 158-date-fallback / 18-empty estimate is
  superseded by the reconciled source set and phase-aware mapping above. The
  snapshot includes five recorded phase integration commits and the codex
  branch head. The later P29-AB-R2-R1 and P28-E-R1 commits and their integration
  merges are follow-ups, not original hashes; the archive remains unchanged.
- Rows without an original source commit are P07, P09, P10, P28-E, P29-B,
  P29-C, P29-D, P29-E, P29-F2, P29-N, P29-M2, P29-S, P29-U, P29-V, P29-W
  and P29-Y; these reuse the preceding archive tree and do not represent
  unmapped original hashes.
- `history/by-phase` has 131 synthetic commits in ledger order and is
  read-only/unmerged. Its 512 `Original-Commit` trailers are unique; the final
  tree equals `main` (`git diff --quiet main history/by-phase`). The archive
  tip is `867347b068725c57c05765d84c02640d8cd57405`. The adoption baseline
  `a258579` maps to P30-C and has the main tree; P28-D's implementation is
  `b314113`. P7, P9 and P10 have no unique phase-specific commit and use
  the nearest preceding evidenced anchor.
- Authorized plain pushes are complete: `main`, `develop`, all 30 `phase/*`
  branches, `history/by-phase`, and all 30 `phase-NN-complete` tags were
  remotely verified. The v1.0.0 tag was not changed. The status-ledger
  follow-up was integrated into P28 and develop, pushed, and re-verified;
  no force push was used.

### P28-F-R4 review-only candidate and screenshots (2026-11-09)

- Prepared a proposed v1.1.1 note for owner review and added pending screenshot
  sections for the current/previous published releases. No images, app version
  changes, build, tag, release publication or merge were made.
- N44 is recorded as owner-reported Pass; device identity fields remain blank.
- Current focused verification: 2 suites / 17 tests pass for release and
  ledger documentation; `git diff --check` exits 0. Full six-gate results
  remain those of the prior clean application-source validation.

### P28-F-R4-R1 screenshots and owner handoff (2026-11-09)

- Added the owner-supplied PNG under versioned screenshot folders for v1.0.0,
  v1.1.0 and proposed v1.1.1. The owner confirmed all three files are
  intentionally identical. README and release Markdown embed the image.
- Attached `WealthWise-v1.0.0-home.png` and
  `WealthWise-v1.1.0-home.png` to their existing published GitHub releases and
  updated only the screenshot section in each published note/release body.
  Both URLs return HTTP 200 with Content-Length 244,108. The v1.1.1 image
  remains in its local draft; no GitHub release was created.
- Updated shared rules, release workflow, build guidance and regression tests
  for owner approval -> task/phase/develop PR merge -> GitHub draft with
  screenshot -> owner build/APK upload/confirmation -> verification ->
  separate publication approval. No commit, PR, app build, tag or push was
  made because the owner has not yet approved the v1.1.1 Markdown draft.
- Focused command passed 3 suites / 18 tests; `git diff --check` exited 0.
  The full six gates remain the earlier verified run; they were not repeated
  for this docs-and-assets update.

### P28-F-R4-R1-R1 approved v1.1.1 release handoff (2026-11-09)

- The owner approved the patch-release Markdown draft. The task branch aligns
  `app.json`, `package.json` and `package-lock.json` at 1.1.1 and contains the
  approved release notes and screenshot.
- The original candidate passed all six ordered gates; Gate 1 was 98 suites /
  1,269 passed / 1 skipped. Task PR #56 and P28 PR #57 merged the
  candidate to `develop`; `release/v1.1.1` and its GitHub Release draft now
  exist. The draft predates the later rule requiring note finalization before
  GitHub draft creation and remains at its original target. The owner APK
  build/upload and publication remain pending; no EAS/Gradle build or
  publication was made by the agent.
- After merge and GitHub draft creation, wait for the owner APK upload and
  confirmation before artifact verification; publication remains separately
  gated.

### P28-F-R6 v1.2.0 minor release candidate (2026-11-11)

- The owner confirmed v1.2.0, approved the release-note content and supplied
  fourteen reviewed screenshots. The note is finalized in `published/`; app,
  package and lockfile versions are aligned to 1.2.0. Release PR #124 merged
  `release/v1.2.0` into `main` as `2e419f8c7d482adc7523b380fe5b71d3bf15dce3`;
  tag `v1.2.0` points to the exact built candidate
  `199ebed307ce7755bc92c1f15544999d852db54f`. EAS build
  `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` succeeded on 2026-11-11 with
  profile `android-apk` and `versionCode` 3. Its 112,163,081-byte APK is
  byte-verified against EAS and published.
- The final six gates passed on `develop` at `3bd5be6`; the documentation-only
  follow-up is integrated at `cd1fa78`. Screenshot URLs and final APK links
  were checked after main integration; URL results and sizes are in
  `release-history.md`. Post-publication task PR #125 merged the README,
  gallery, published-note and release-history updates into the retained phase
  at `87c8e8f902c313c35e7d48e154ec8d9c9f504789`; the focused regression run
  passed 2 suites / 24 tests. Task PR #126, phase PR #127, develop-to-main
  PR #128 and main-to-develop PR #129 have all merged; the final local and
  remote `develop` tip was `c554c0b7adf76ab6066755d26775c58f34c93cc0` at that
  point. The final ledger correction and branch synchronization completed
  through PRs #130–#133; #133 back-merged to `develop` at
  `eedff48c58876c6bc1457fdb9bdd151fc496f621`, and `main` and `develop` trees
  match.
- Task PR #112 merged into the retained phase as `fa153da`; phase PR #113
  merged into `develop` as `d347526`; evidence PR #114 merged as `5ae1b72`,
  with evidence PR #115 merged as `936ee25`; the original task branch was
  deleted. Screenshot task PR #116 merged into the phase as `f08f963`;
  phase PR #117 merged into `develop` as `25258ac`; final gates were rerun
  on `3bd5be6`. Build-record task PR #121 merged into the retained phase as
  `e74c39a610f9ac0bbb8b5edebe3160ea5fa0f2b8`; phase PR #122 merged into
  `develop` as `cd1fa789a143803dcfe0858a4f98a039062029e3`. Release-sync PR #123
  merged at `0c8b38012e20fe275f903ecd19da9bd3e9995a9a`; PR #124 merged into
  `main` at `2e419f8c7d482adc7523b380fe5b71d3bf15dce3`. All 104 screenshot
  image/link URLs returned HTTP 200; all five APK URLs returned HTTP 200 at
  expected sizes. Historical release screenshot sections were updated without
  changing non-screenshot body content, and the previous v1.1.1 asset was
  renamed to its versioned filename. Post-publication task PRs #125/#126
  merged into `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at `87c8e8f`/`9db08be`; phase PR #127
  merged into `develop` at `d65ce75`; develop-to-main PR #128 merged at
  `48a64c0`; and main-to-develop PR #129 merged   at `c554c0b`. Local and remote `develop` matched at that earlier
  synchronization point; final PRs #130–#133 subsequently corrected the
  ledger and synced both branch trees. The v1.2.0 tag still targets the
  verified APK candidate. O45-O53 remain owner-reported; device details were
  not supplied.
- Release-document test assertions were replaced, not weakened:

  | Area | Old assertion | New assertion | Reason |
  |---|---|---|---|
  | Latest APK URL | Expected every asset under `/download/<version>/`, including the latest APK. | Requires `/latest/download/<latest-name>` for the latest release and `/download/<version>/<version-name>` for older releases. | v1.2.0 is now published as latest and v1.1.1 was renamed to a versioned asset. |
  | README gallery and release note | Hard-coded v1.1.1 screenshot paths, section heading and Download URL. | Derives the current version from the README and checks its screenshot paths, matching published note and latest URL; separately rejects the former v1.1.1 gallery paths. | The README must track the newest published release rather than retain v1.1.1-specific expectations. |
  | Release closeout ledger | Expected P28-F-R6 to remain In progress and P28 completion to be 36/37. | Requires P28-F-R6 Done and P28 completion 37/37. | The task, phase, develop-to-main and main-to-develop PR chain is now verified merged. |
  | Final branch sync ledger | Expected PR #129 / `c554c0b` to be the final synchronization and P28 to be 37/37. | Requires PR #133 / `eedff48` as the final back-merge, matching `main`/`develop` trees, and P28 38/38. | The later test-first documentation correction was integrated after the earlier status assertion. |

- Test-first closeout commit `6f7f850` failed on the prior ledger as intended:
  the new assertion expected 37 completed P28 tasks but found 36. Updating the
  completion status and progress totals made the focused run pass (2 suites,
  24 tests).
  P28-F-R6-R2 test-first commit `b446fb5` then failed against the earlier
  37/37 ledger and pre-#130–#133 integration record as intended; the final
  ledger and release-status updates satisfy the 38/38 and PR #133 assertions.

### P28-F-R6-R1 expanded release screenshots (2026-11-11)

- Added Backup and Restore, Reminders, Security, Profile and Theme screenshots
  to the versioned sets for v1.0.0, v1.1.0, v1.1.1 and v1.2.0. The About
  screenshot is exclusive to v1.2.0. The README gallery now shows only the
  latest-published v1.2.0 set with 14 images.
- The test-first commit `cb1db2b` failed because the README still contained
  only two rows of four. Implementation commit `6bf46f8` makes the regression
  pass (3 documentation suites / 26 tests); TypeScript, Expo lint and source
  screenshot byte comparisons pass.
- The owner reports O45-O53 physical checks passed on 2026-11-11; device and
  tester details were not supplied. The checklist records these as
  owner-reported, not independently performed by the agent.
- Task PR #116 merged into the phase as `f08f963`; phase PR #117 merged into
  `develop` as `25258ac`. The final six ordered gates passed on
  `develop` commit `3bd5be6`:
  1. `npm test -- --coverage` — exit 0; 101 suites; 1,316 passed, 1 skipped,
     1,317 total. Coverage (statements/branches/functions/lines): overall
     95.96/92.15/98.02/97.62%; `src/data` 91.06/87.47/94.48/94.19%;
     `src/domain` 96.94/93.00/98.80/98.31%; `src/lib` 100/100/100/100%.
  2. `npx tsc --noEmit` — exit 0.
  3. `npx expo lint` — exit 0.
  4. `npx expo-doctor` — exit 0; 21/21 checks passed.
  5. `npx expo export --platform android` — exit 0; Android bundle 5.6 MB.
  6. `npx expo export --platform ios` — exit 0; iOS bundle 5.3 MB.
- v1.2.0 was published with tag `v1.2.0` targeting `199ebed`; EAS APK build
  `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` completed with `android-apk` and
  `versionCode` 3. The 112,163,081-byte artifact was byte-verified and
  published. The 104 screenshot URLs and five APK URLs passed HTTP 200 and
  size checks. Historical release bodies were updated without changing other
  text; the previous v1.1.1 APK was renamed. Post-publication docs were
  initially integrated through PRs #125–#129. Final ledger/test evidence was
  synchronized through PRs #130–#133; the back-merge PR #133 is
  `eedff48c58876c6bc1457fdb9bdd151fc496f621`.

### P28-F-R6-R3 owner-reported device validation (2026-11-11)

- Added O54-O60 for the owner's Pass report on previously listed
  physical-device follow-ups; O45-O53 were already recorded Pass. Device
  identity details were not supplied. These are owner-reported results, not
  independent observations.
- Test-first commits `71250b2` and `b7c5891` exposed missing device rows,
  stale progress counts and status text before documentation changes. The
  initial regression run had 5 failures and 11 passes as expected. A later
  focused run found one wording-only mismatch: the test expected
  `owner reports all physical-device checks O45-O60 passed`, while the ledger
  used `O45-O60 are owner-reported Pass (2026-11-11)`. The assertion now
  checks the ledger's exact wording; reason: preserve the owner's status
  without rewriting the existing CR-108 row. Final focused run:
  `npm test -- --runInBand src/lib/__tests__/progressLedger.test.ts` — 1 suite,
  16 passed. `git diff --check` passed. The full suite and six application
  gates were not rerun for this documentation/test-only update.

### P28-F-R6-R3-R1 integration evidence (2026-11-11)

- Task PR #138 merged into `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at
  `6f5b1cb832873b970caa0e96163890fb0a6b16e6`. Phase PR #139 merged into
  `develop` at `fd7ba55adc103aa94fa7be6c5e590c82f46bce4e`; local `develop`
  was fast-forwarded to the remote tip. The phase branch is retained.
- Test-first commit `1220b8a` exposed absent merge-SHA records and stale
  status. Its final focused run passes 17 tests; the full suite and six
  application gates were not rerun for this documentation/test-only
  integration record.
