<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-12 | Updates: owner and AI agents -->

# Open items

## CR-110-R1 planned work

CR-110's original planned-only row is retained and marked **Revised by
CR-110-R1**. Five P43 rows are Planned, each with dependencies and
`Evidence: not started`.
The authorized local phase `phase/43-lifecycle-and-transaction-planning` and
task `task/P43-A-plan-cr110` were created from `develop` for the PR flow.

- **P43-A — Lifecycle tracking separation:** list `cleanup` and
  `qa-and-release` outside numbered development phases, alongside `develop`
  and `release/vX.Y.Z`; document current branches
  `phase/27-cleanup` and `phase/28-qa-and-release` with proposed ongoing
  branch names `cleanup` and `qa-and-release`; preserve P27/P28 completion
  evidence. Update
  PROGRESS.md, section 12, memory, tests and Markdown references when the
  plan is executed. Documentation reordering only; Git chronology unchanged
  unless the owner gives explicit written authorization for a specific
  rewrite. Open decision: remote branch renames, which require pushing new
  names and deleting the old remote refs. Retain stale phase tags as
  previously directed.
- **P43-B — Tag and integration audit:** preserve every `vX.Y.Z` release tag.
  Non-release phase/task-tag deletion is blocked on owner approval of an exact
  tag list. Produce a separate report-only audit of branch, PR and merge
  balance; report in chat or `/tmp`, not Git.
- **P43-C — Emergency Fund target editing:** edit from the Emergency Fund
  screen and reflect the value on that screen, Home, Goals, allocation and
  bucket targets, and in the three-month minimum-floor logic. Require one
  domain action, one Zustand `set`, one persisted write and Undo; validation,
  tests at font scales 1.3 and 2.0, and DEC-DEMO data. `app/(tabs)/index.tsx`
  is user-owned; editing it needs explicit owner authorization.
- **P43-D — Transaction form:** derive investment category with
  `investCategoryFor` only after a holding is selected; show only
  user-created/Budget-defined expense categories plus Custom; design category
  (e.g. Wants/Expenses) versus item (e.g. party/others) hierarchy and
  persistence; add custom Income type. Schema v23 is current and P36 already
  claims v24. Schema impact remains undetermined; any bump needs a separate
  plan, identity-preserving migration, premigration archive and backup import
  support. Plan test-first regressions, demo-data updates and backup
  compatibility checks.
- **P43-E — GitHub issue strategy (plan only):** one issue per ledger part
  or CR; phase/type/status labels; release milestones; pending issues open;
  completed issues retrospective and closed; verified commits, PRs, merge
  SHAs and original dates in each body; one retrospective comment per issue.
  GitHub sets actual timestamps; original dates are text only. About 216
  ledger parts need deduplication; assess API rate, batching and noise. Issue
  creation is a separate owner-approved task; create no issues now.
- No app implementation, tag operation, issue creation or history rewrite is
  included. The branch/PR/merge-balance report is not a Git deliverable. The
  test-first commit is `e5114e01f363d6de5a12acb61886039469d4a86f`.
  Full plan and final evidence: [PROGRESS.md](../PROGRESS.md).

## v1.2.0 release close-out

- v1.2.0 was published on 2026-11-11. Release PR #124 merged
  `release/v1.2.0` into `main` at
  `2e419f8c7d482adc7523b380fe5b71d3bf15dce3`; tag `v1.2.0` points to exact
  candidate `199ebed307ce7755bc92c1f15544999d852db54f`.
- EAS build `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` succeeded with profile
  `android-apk` and `versionCode` 3; its 112,163,081-byte artifact was
  byte-verified against EAS. The latest and four versioned APK URLs returned
  HTTP 200 with expected sizes.
- All 104 release screenshot image/link URLs returned HTTP 200; each of the
  52 raw image sizes matched its repository file. Historical release
  screenshot sections were updated while preserving non-screenshot body
  content, and v1.1.1's former latest APK was renamed to its versioned name.
- Task PR #125 merged the README/gallery/latest-note parity, prior-version
  APK link and release-history updates into the retained phase as
  `87c8e8f902c313c35e7d48e154ec8d9c9f504789`. The phase-to-develop PR,
  develop-to-main synchronization and main-to-develop back-merge are complete
  through PRs #127, #128 and #129. Final ledger/test evidence was merged and
  synchronized through PRs #130–#133; `main` and `develop` trees match.
- The final ledger/test correction task PR #134 merged into the retained
  `phase/28-qa-and-release` at `2d3a0f6`; see the P28-F-R6-R2 ledger entry.
- P28-F-R6-R3 task PR #138 merged into the retained phase at `6f5b1cb`;
  phase PR #139 merged to `develop` at `fd7ba55`. O45-O60 are recorded as
  owner-reported Pass, with device identity details absent.
- O45-O60 are owner-reported Pass (2026-11-11); device model, OS version and
  tester were not supplied.

## CR-108 completion and future scope

- CR-108 is complete: P41-B-R1 task PR #108 merged into the retained phase as
  `e1db78e`, and phase PR #109 merged to `develop` as `5cb4957`. All six
  ordered gates pass; detailed commands, coverage and PR evidence are in
  [PROGRESS.md](../PROGRESS.md). The owner reports O45-O60 physical-device
  checks passed on 2026-11-11; device/tester details were not supplied.

## CR-109 integration

- P42-A is integrated into `develop`: task PR #142 merged into the phase at
  `8f38e9f`, and phase PR #143 merged into `develop` at `8988121`. The six
  ordered gates passed again on integrated `develop` and were repeated on the
  P42-A-R1 task tree; no app behavior changed.

## Owner-approved planned direction (2026-11-11)

- A true in-app update check is approved for future planning. The current
  About action remains browser-based after confirmation and makes no
  app-side request; no in-app checker is implemented.
- Once-only frequency for investment plans or liabilities is approved for future planning;
  schema v23 and current forms remain unchanged until separately scoped.
- Public adoption is an approved future project goal; no launch campaign or
  community-response commitment is authorized by this decision.
- P31-D privacy statement is approved. It remains Planned, depends on P39-C,
  and must use verified source facts.
- The owner confirms Sahil Aspak Sheikh as the MIT copyright holder; the
  existing `LICENSE` notice already uses that name.
- P40-B is approved and Planned after P40-A. P40-A remains Planned.
- Configure branch protection after P31-E passes a real PR run; this
  follow-up is owner-approved and Planned.
- Retain the existing stale phase tags `phase-28-complete` and
  `phase-29-complete`; no tag mutation is requested.

Not adopted in CR-106:

- ClaudEx Loop and the agent-swarm kit: no demonstrated repository need for
  additional external agent orchestration or its maintenance surface.
- Shunt: it is not Claude Code and relies on a third-party 0.1.0 hook; the
  identified root cause is progress-ledger size, not a missing tool hook.
- GDPR consent/processor items: no server or analytics is described in the
  verified app architecture; do not add server-processing controls without a
  verified processing surface.
- Show HN, GitHub Discussions and issue-response items: not adopted by this
  decision; evaluate them separately against community-response capacity.

## Recently resolved

- **P29-J is resolved for now (2026-11-11):** the owner confirms the current
  actual-days/365 behavior is satisfactory; no statement comparison or
  calculation change is requested. Reopen only if new bank evidence is later
  supplied and a comparison is requested.
- **CR-3 is resolved by owner acceptance (2026-11-11):** the existing Save
  behavior in `profile-form.tsx` and `transaction-form.tsx` is satisfactory;
  no UI change is requested.
- **Dependency audit accepted (2026-11-11):** the owner accepts the last
  recorded advisory snapshot for now; no dependency changes are requested.
  P39-E remains Planned for the broader report-first dependency audit.
- **No fresh backup is requested (2026-11-11):** the owner accepts the
  existing snapshot; no backup data was altered or regenerated.
- **Node 26 is accepted; no Node 24 repair is requested (2026-11-11):** the
  project remains pinned to Node 26.13.0.
- **The owner accepts the previous documentation-only verification scope
  (2026-11-11):** that prior update ran the focused ledger test, not the full
  suite or six gates; this records the actual scope without retroactively
  claiming a full run.
- **`codex-changes` was deleted at the owner's direction; no work is to be ported
  (2026-11-11):** its obsolete schema-v2 loan/liability changes,
  attempted Home edit, generated coverage output and migration defect are
  detailed below and in [PROGRESS.md](../PROGRESS.md).
- **Retain the existing stale phase tags (2026-11-11):** the owner directs
  keeping `phase-28-complete` and `phase-29-complete` as-is. No tag was moved.
- **Owner roadmap decisions (2026-11-09):** accessibility is the planned
  statement and audit checklist, not new app features. The owner supplied all
  23 versioned screenshots, so P32-A/B/C capture work is cancelled; no new
  captures or capture script are needed. Widgets, quick capture (shake,
  double-tap back or key combination) and notification/SMS detection are
  Planned, with research/reactivation requirements retained. P33-C still
  requires iOS distribution; P35-C requires the P35-B owner go/no-go before
  implementation. Notes includes text, voice/audio recordings, photos and
  videos; its planned migration impact is now schema v24 after CR-108's v23
  release. Skeleton loading is planned as P38. See
  [PROGRESS.md](../PROGRESS.md) for the recorded acceptance scope.
- **Release screenshots and APK handoff:** all 23 owner-supplied screenshots
  (7 for v1.0.0, 8 for v1.1.0 and 8 for v1.1.1) have been copied to
  `docs/releases/screenshots/vX.Y.Z/` as
  `WealthWise-vX.Y.Z-screenshot-<screen>.png`. All 46 main-branch blob/raw
  URLs returned HTTP 200; raw image sizes matched the committed files. The
  release bodies now use browser-viewable links and the 23 screenshot assets
  were removed; each release retains only its unchanged APK.
  The owner-provided APK for EAS build
  `ecc97480-7229-41ac-8aad-64ea2cd255b5` is byte-verified against EAS
  (app 1.1.1, `android-apk`, `versionCode` 2), and the published
  `WealthWise-android-latest-v1.1.1.apk` matches the approved APK. v1.1.1 is
  latest-published. The v1.1.0 APK now uses its versioned filename; the latest
  and affected versioned APK URLs return HTTP 200 with expected sizes.
  The README Download block remains byte-identical to the latest published
  note; its screenshot gallery contains the v1.1.1 set. No APK Download block
  changed.
- **CR-107 decisions and closeout:** the owner resolved the repository
  screenshot decision as YES; this supersedes the earlier "no screenshots in
  the repository" decision. Capture work P32-A/B/C remains cancelled because
  the owner supplied all images. The owner-authorized `develop` -> `main` ->
  `develop` exception changed no version, tag or release publication state.
  Only the v1.0.0 screenshot section was changed in its release body; its
  existing non-screenshot difference from the published note was preserved
  at the owner's direction. The v1.1.1 APK does not contain the demo-data
  revision. All six gates and output/asset evidence are recorded in
  [PROGRESS.md](../PROGRESS.md).
- **Remote branch audit (2026-11-09):** fetched all 36 remote branches and
  checked their ancestry against `develop` and `main`. Every remote branch is
  integrated into `develop`; `release/v1.1.1` is integrated into `main`;
  `main`, `develop` and the release branch have identical trees. No open PRs
  or pending merge work remain. The stale local `main` was fast-forwarded.
- **APK handoff rule (2026-11-09):** the existing guide already required
  `eas build --platform android --profile android-apk`, artifact download and
  draft upload without waiting for the owner to build or upload. Clarified in
  the shared rules and all release guides that the agent must not ask the
  owner/developer to provide an APK or local APK path.
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
  merged PRs #1-#3. P28 was integrated into develop, the release branch
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
  recorded in the release history. PRs #11-#15 merged task -> P28 ->
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
  merged task -> P28 -> develop -> release -> main -> develop. The four
  remote trees match; the v1.1.0 tag was not changed.
- **P28-F-R2-R1 audit correction:** task PR #4 merged into P28 and PR #5
  merged P28 into develop; PR #6 carries the release branch to main and
  PR #7 is the main-to-develop back-merge. The full sequence preserves
  task -> phase -> develop -> release -> main -> develop.
- **P29-O-R1 scope close-out:** P29-O is superseded by the accepted P29-O1
  holding workflow and the explicit P29-S cancellation of the separate
  ledger-only migration. No app implementation remains in scope; P29 is
  41/41. The owner reports the P29-O1 physical-device checks below passed on
  2026-11-11.
- **Local `codex-changes` branch:** deleted on 2026-11-08 at the owner's
  direction. Commit `d033d6a` attempted an obsolete schema-v2 loan/liability
  model, included generated coverage output, changed the protected Home screen,
  and contained a data-loss migration defect. It was never merged; no work is
  to be ported.
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
- **P28-E-R4 history graph integration:** task PR #49 merged into P28
  (`7f9221a`), then P28 PR #50 merged into `develop` (`b5dbe5f`). The
  `history/by-phase` tip and every remote branch tip are reachable from
  `develop`. `main` and `release/v1.1.0` remain at
  `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`, with tree
  `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. The task branch was deleted;
  P28 is retained. Verification is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R5 historical main commit audit:** the 403 non-merge commits after
  the initial commit are already integrated into `main` and `develop`; 84
  legacy subjects fail the current Conventional Commit hook. Do not rewrite
  these original commits: a PR cannot change commit provenance or subjects
  retroactively. The owner-selected `release/v1.0.0` branch was created at
  the existing v1.0.0 tag target and is already an ancestor of `main` and
  `develop`. Task PR #52 merged into P28 as `f9bb715`, and P28 PR
  #53 merged into `develop` as `0402592`. P28-E-R5-R1 records this final
  integration; no application code or protected branch tip changes.
  Evidence is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R3 ancestry reconciliation:** owner-authorized `ours` merges record
  `f994457`, `7bea8e6` and `b779c21` as ancestry on the task branch without
  changing the captured `develop` tree. The accompanying changes are limited
  to ledger/memory documentation and a ledger test. At R3 completion, the
  archive was still separate; P28-E-R4 is connecting it. `main` and its
  v1.1.0 tag remain untouched. Task PR #47 merged into P28 and PR #48
  promoted R3 to `develop`. Details are in [PROGRESS.md](../PROGRESS.md).
- **P28-F-R3 GitHub integration:** PR #11 merged the publication task into
  P28 (`a2f9db2`), #12 promoted P28 to develop (`3e2a5a8`), #13
  merged develop to `release/v1.1.0` (`d4d69fa`), #14 merged that release to
  main (`b0aeef9`), and #15 back-merged main into develop (`6f5df18`). The
  publication task branch was deleted; the phase branch remains at its
  recorded tip. Main, develop, release and P28 have identical trees.

## Unresolved

- **Physical-device validation report (2026-11-11):** the owner reports that
  all device checks listed in the previous assistant summary passed. The
  categories and owner-reported Pass results are recorded as O54-O60 in the
  [device checklist](../releases/device-test-checklist.md). This supersedes
  older pending/unverified wording for the covered device checks below and in
  the physical-device section. Device model, OS version and tester details
  were not provided; these remain owner-reported, not independently observed.
- **P20-S-R1 device check:** owner reports the physical-device rendering check
  passed on 2026-11-11.
  Owner approved commit/merge; SegmentedControl labels removed by the owner
  remain absent. Final gate results and PR integration are in
  [`PROGRESS.md`](../PROGRESS.md). Implementation commit `d36103e` is in
  task-to-phase PR #42; phase-to-develop PR #43.
- **CR-107 demo display:** route tests verify the Rs 1 crore Assets total at
  simulated font scales 1.3 and 2.0. The owner reports physical-device
  rendering at both scales passed on 2026-11-11.
- **v1.1.1 release:** the owner-approved patch release was published on
  2026-11-09 after PR #69 merged it to `main` and PR #70 back-merged it to
  `develop`. Tag `v1.1.1` points to the main merge commit. The owner-run EAS
  APK build was verified against the uploaded asset and published as the
  latest APK. The v1.1.0 asset was renamed to its versioned filename, and
  README, release notes, release history and latest screenshots are aligned.
  N44 is owner-reported Pass; device identity fields remain blank.
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
  The obsolete `codex-changes` commit `d033d6a` targeted schema v2 rather than
  current v23, included generated coverage files, attempted a protected Home
  edit, and had unsafe migration behavior and a failing migration assertion.
  It conflicts with current `main` and was deleted at the owner's direction;
  no port is needed or authorized.
- **v1.1.0 release integrity:** the owner explicitly approved the `preview`
  profile and reused versionCode 1 for this release. For future releases,
  restore the configured `android-apk` profile and increment versionCode.
- **Stale phase tags (owner decision, resolved 2026-11-11):**
  `phase-28-complete` and `phase-29-complete` remain on their historical
  targets by owner direction. No tag was moved.
- **P29-O1-R2 / P29-W-R2 integration:** task and phase merges are included in
  the v1.1.0 release on GitHub main and develop through the merged PR chain.
- **P29-O1-R2 / P29-W-R2 physical-device check:** the owner reports paired
  count-cell layout and date ordering on Assets and Liabilities at font scales
  1.3 and 2.0 passed on 2026-11-11.
  TestRenderer checks are simulated. The six ordered repository gates pass
  locally; integration is complete on `develop`.
- **Pre-build synthetic v13 equality:** automated coverage now imports a
  deterministic, checksummed v13 backup through `parseBackup` and compares
  source-derived net worth, every goal's saved amount and Emergency Fund
  available amount. The owner reports physical-device backup/restore checks
  passed on 2026-11-11; they remain listed in
  [`build-config.md`](../releases/build-config.md) as the procedure.
- **P26-A physical-device checks:** owner reports the touch-target, scalable-label,
  text at 1.3x/2.0x, focus order, announced form errors, color-only status,
  screen-reader navigation, cold hydration, first render and action-write
  checks passed on 2026-11-11. Jest/TestRenderer and Node benchmarks are not
  device evidence. `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` remain
  user-owned/report-only surfaces under the P26-A scope.
- **P29-AA Emergency Fund links resolved (2026-11-06):** repeated failing
  reproduction and store coverage confirmed valid links for Cash, Savings,
  Fixed deposits and recurring plans. Plan deletion now clears EF bucket and
  goal links in the same write; hydration repairs dangling links once and
  preserves valid links, net worth and goal values. No schema change.
- **Emergency Fund form font-scale and device check:** owner reports the
  resolved link picker and EF allocation form passed at 1.3x and 2.0x on
  physical devices on 2026-11-11.
- **P29-Z documentation verification (historical, superseded 2026-11-08):**
  source wins over docs; current schema v22 and the migration/archive chain
  through `.premigration.v21`, Foreclosure labels, Home-only menu rule and real
  Gate 1 counts are recorded. P29-Z made no behavior, schema or UI source
  change.
- **Home-only global menu physical-device check (2026-11-05):** the owner
  reports the three-dot options menu remained present on Index/Home and absent
  on Assets, Liabilities and detail screens, including backup, reminders,
  security, profile and theme routes at font scales 1.3 and 2.0. Pass reported
  2026-11-11.
- **Recurring asset stop/resume label physical-device check:** owner reports
  active recurring cards showed Stop investment and stopped plans showed Resume
  investment in the shared instrument-card row; Pass reported 2026-11-11.
- **Holding and liability layout physical-device check (2026-11-05):** the
  owner reports the two-column investment Summary, same-row liability actions,
  conditional Entries button and liability Summary/details layout at font
  scales 1.3 and 2.0 passed on 2026-11-11. Automated route, ownership and focused font-scale
  tests pass, and all six gates exit 0.
- **Holding layout validation (2026-11-05):** the owner-edited holding screen
  passes the focused route smoke test at font scales 1.3 and 2.0. All six gates
  are green: 92 suites passed, with 1192 tests passed and 1 skipped.
- **Merged holding summary card physical-device check:** the owner reports the
  Recurring plan and Summary information remain readable in one card and
  Stop/Resume stays in the action row at font scales 1.3 and 2.0; Pass reported
  2026-11-11.
- **P29-Y resolved (2026-11-05):** Gate 1 was repaired from `91` passing suites
  plus one stale `memoryDocs.test.ts` failure to `92` passed suites and `1191`
  passed tests with `1` skipped at that repair step. The final real run is
  `1192` passed tests with `1` skipped (1193 total). The project inventory, status memory and
  ledger now match the repaired run; all six gates pass.
- **P29-X physical-device checks:** the owner reports stop/resume
  confirmation, inclusive stop-date filtering, stopped card text, past unpaid
  dues, Deposit availability and one-write Undo passed at font scales 1.3 and
  2.0 on 2026-11-11, including the native SQLite archive/restart check.
- **P29-X assumption:** `stopDate` is the last inclusive scheduled date. Resume
  removes the field; it restores schedule rows without rewriting entries or
  linked transactions.
- **P29-W physical-device checks:** the owner reports closure-date selection
  and outstanding recalculation, overpayment/shortfall confirmations,
  one-write Undo, future-due removal, Closed filtering, read-only
  payment/schedule rows, note-only editing/deletion, font scales 1.3/2.0 and
  native SQLite archive/restart behavior passed on 2026-11-11. Jest and Expo
  exports do not verify native interaction, persistence or layout.

- **P29-V physical-device checks:** the owner reports AsyncStorage migration
  byte comparison before removal, fallback after restart, all four stress
  tiers loading/Undo, native SQLite capacity, hydration, actions, selectors,
  memory and first render, and plain/encrypted 50-year backup round trips with
  larger tiers refused before temporary-file creation passed on 2026-11-11.
  Node measurements and Expo exports do not prove device behavior.

- **P29-O2 cancelled by owner (P29-S, 2026-11-05):** do not implement the
  ledger-only schema-v19 storage redesign. Its converter, alternate v19
  schemas/types and prototype tests had no production callers and have been
  removed. The cancelled storage design does not affect the current schema
  v22; P29-O1's unified holding actions remain supported. Historical
  preparation commits are retained; see
  DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE in [PROGRESS.md](../PROGRESS.md).
- **P29-O1 physical-device checks:** the owner reports manual and recurring
  holding cards, Entries, opening amount edits, Recurring plan details at
  font scales 1.3 and 2.0, the 10,000 + five 1,000 deposits - 2,000 withdrawal
  case showing Invested 13,000 and seven rows, and Fixed-deposit maturity
  withdrawal passed on 2026-11-11.
  Jest and Expo exports do not prove native layout or interaction.
  Automated validation is complete: 90 suites/1140 tests, TypeScript, lint,
  Expo Doctor 21/21, and Android/iOS exports all pass. Coverage and assertion
  counts are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-T physical-device checks:** the owner reports adding, editing and
  deleting dated deposits and withdrawals on or before a valuation updated
  manual and plan values once, in the same write; Undo restored the entry and
  linked transaction. Goal, Emergency Fund, net-worth and Budget-linked flows
  at font scales 1.3 and 2.0 also passed on 2026-11-11. Jest and Expo exports
  do not verify native persistence, rendering or interaction. Budget's current
  linked-actual selector is transaction-based, not a current-holding-value
  display; that display was not redesigned.
- **P29-U physical-device checks:** the owner reports configured accrual and
  units-price values, manual confirmation, staleness notices, the optional
  monthly reminder at font scales 1.3 and 2.0, v18-to-v19 migration,
  confirmed-value reset, and entry-price/withdrawal interactions passed on
  2026-11-11.
  Node tests and Expo exports do not prove native layout,
  persistence or notification scheduling. Automated validation passes:
  91 suites/1170 tests and all six ordered gates exit 0; directory coverage
  and the exact calculation method are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-U model constraint:** recurring plans already require `ratePct` in
  the v18 model and use it for the plan projection. That existing required
  field is preserved; valuation metadata remains optional. Manual holdings
  may omit `ratePct` unless accrual is explicitly selected.
- **P29-L complete:** the Insurance dependency inventory, simplification and
  v16-to-v17 migration are recorded in [PROGRESS.md](../PROGRESS.md). The
  former P29-G cover-goal feature is removed; Home remains unchanged. The owner
  reports its physical-device checks passed on 2026-11-11.
- **P29-J bank-balance comparison:** resolved for now. The owner confirms the
  current actual-days/365 method is satisfactory; no statement comparison or
  calculation change is requested. Reopen only if the owner later supplies
  bank evidence and asks for a comparison.
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
- **Local app/backup mismatch:** the owner accepts the current snapshot and
  does not request a fresh export. The historical mismatch remains documented;
  no backup data was altered or regenerated.
- **CR-3:** resolved by owner acceptance of the existing Save behavior in
  `profile-form.tsx` and `transaction-form.tsx`; no UI change is requested.
- The last recorded audit snapshot reports 27 production advisories (6 high,
  20 moderate, 1 low) and 55 total (6 high, 44 moderate, 5 low); the extra 28
  are dev-only tooling. The owner accepts this snapshot for now; no dependency
  changes are requested. P39-E remains Planned for a broader, current
  dependency-risk report. Never use `npm audit fix --force` or approve
  install scripts without separate authorization.
- The MIT copyright holder is confirmed by the owner as Sahil Aspak Sheikh;
  the existing `LICENSE` notice already matches.
- **Node 24 Jest issue (accepted, not a pending fix):** on Node 24.22.2, after clearing Jest cache, 13 suites
  fail because `expo-modules-core` reads `ReactNativePlatform.select` while
  `react-native` is mocked without a `Platform` export in affected test files.
  The full suite passes on Node 26.13.0. React Native 0.86.3's declared engine
  supports Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; therefore the
  test difference does not prove that the SDK itself rejects Node 24.
  Project Node is pinned to 26.13.0 and the allowed engine is `>=26.0.0 <27`
  based on the observed test results. The owner accepts the Node 26.13.0
  project pin; no Node 24-specific mock repair is requested.
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

- **Owner-reported Pass (2026-11-11):** the owner confirms the previously
  listed physical-device checks passed. The grouped record is in O54-O60 of
  the [device checklist](../releases/device-test-checklist.md):
  accessibility/large text and screen readers; native dialogs, navigation
  and Home menu; reminders and notifications; SQLite/AsyncStorage migration,
  restart, stress data and storage responsiveness; holdings, valuations,
  linked financial flows, stop/resume and liability closure/foreclosure;
  encrypted backup/restore, passphrase handling, file picker/share and
  erase-all; and Budget/list layouts, counts and ordering.
- The owner also reports the prior v1.2.0-specific checks O45-O53 passed.
  Device model, OS version and tester were not supplied. These results remain
  owner-reported; they are not independently observed or automated evidence.
- Automated layout tests still simulate component props and font scales; do
  not present them as physical-device evidence. They are separate from the
  owner's reported device validation.
- P25-F did not repeat physical-device checks. Its screen-reader label and
  month-routing assertions run in TestRenderer and do not establish native
  announcements or rendering behavior; the owner reports the later device
  checks passed.

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
