<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-10 | Updates: owner and AI agents -->

# Status
- CR-108 is in progress. P29-Q-R1 reproduces the four-choice `choiceAsync`
  RangeError before production changes, replaces the stress picker with a
  centered scalable selection dialog, and keeps the helper's two-choice limit.
  Five focused suites / 30 tests and TypeScript pass; task PR #93 and phase PR
  #94 are merged to `develop` at `80eb0e4`. P20-N-R3's failing tests were
  committed first as `bba05be`; the Budget overview implementation now removes
  the visible Pace/Over by/Left lines while retaining chart/table accessible
  descriptions, and focused tests, TypeScript and targeted lint pass. Task PR
  #95 merged to `phase/20-budget` as `77bdef5`; the phase-to-`develop` PR is
  pending. Parts 3–6, schema v23, demo updates and the six final ordered gates
  remain pending. The new Budget blob is recorded in
  [rules.md](rules.md); physical-device checks remain unverified.
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
  change. Physical-device rendering at font scales 1.3 and 2.0 remains
  unverified.
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
  `phase/28-qa-and-release`. The ancestry merges preserve the captured
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
  and `phase/28-qa-and-release` was retained.
  `phase/25-release-and-backups` remains outside this Release 2 PR chain.
  P28-E's final-verification commit was reconciled in P28-E-R2; the separate
  `codex-changes` branch remains under review.
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
  Physical-device rendering remains unverified.
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
  the close-out. P29-O1's physical-device checks remain unverified.
- The owner directed deletion of local `codex-changes` (`d033d6a`). Its
  October schema-v2 loan/liability alternative was stale against schema v22,
  included generated coverage, and contained a migration defect. Nothing was
  ported or pushed.
- Protected hashes reverified with `git hash-object`: Budget
  `b60f77af4f76d47f2cee07393fe9d8f3fa6bd04c` and Home
  `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`. Current values and
  device/release follow-ups are recorded in [open-items.md](open-items.md).
- Phase tag targets `phase-28-complete` and `phase-29-complete` are behind the
  latest commits on their respective phase branches. Tags were not moved;
  whether to update them remains an owner decision.
- Branch audit (2026-11-08): the chronological PR path carries the task
  correction through P28, develop, the release branch and main, then
  back-merges main into develop. The relevant branch refs are verified in the
  GitHub PRs. The v1.1.0 tag points to the verified EAS source commit and its
  GitHub release is published. `phase/25-release-and-backups` remains outside
  the Release 2 chain; `history/by-phase` is a read-only archive. P28-E's
  final-verification commit `72fb325` is preserved by P28-E-R2, with its
  stale status edits reconciled instead of merged verbatim. `codex-changes`
  remains local pending a safe port: it targets schema v2 rather than v22,
  includes generated coverage, and review found a persisted-data migration
  bug and a failing migration assertion. No unsafe branch content was pushed.
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
  Release 2 PR chain. Physical-device verification remains pending.
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
- Test counts: 98 suites, 1279 tests (1278 passed, 1 skipped) on 2026-11-10.
- Latest validated run: 98 suites, 1279 tests (1278 passed, 1 skipped) on
  2026-11-10; all six gates exit 0. Coverage and exact commands are recorded
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
