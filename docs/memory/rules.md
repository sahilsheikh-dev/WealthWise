<!-- Purpose: Engineering invariants, protected surfaces and verification commands. | Last updated: 2026-11-22 | Updates: owner and AI agents -->

# Rules

## Invariants

- Persisted schema is v24 (`SCHEMA_VERSION` in `src/domain/schemas.ts`);
  preserve migrations and backup imports from schemas v1–v23.

- **COMMON RULES apply to every prompt**, even if not repeated in a prompt.
  R1 requires a dirty-file preflight with `git diff --stat` and the complete
  diff; before each commit show its subject and staged diff-stat, commit only
  named files, and use a descriptive Conventional Commit subject. Allowed
  types are `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`,
  `style`, `build`, `ci`, and `revert`; optional scopes are allowed. The
  hook rejects prohibited placeholder subjects. Never bypass it; enable it with
  `git config core.hooksPath .githooks`.
- **R2 — Phase and revision IDs:** align each task with existing work. A fix
  or change to a completed subtask stays in its original phase and is logged
  as `<ID>-R<n>` (for example, `P29-AB-R1`); the original row must say
  `Revised by <ID>-R<n>`. Create a new phase with subtasks only for genuinely
  new areas.
- **R3 — History and release approval:** never push, amend or rewrite history
  unless the owner explicitly authorizes a push; never force-push. Release
  publication and tag creation, movement or deletion require explicit owner
  approval.
- **R4 — Documentation scope:** routine documentation committed to Git is
  limited to `docs/memory/*`, `docs/PROGRESS.md`, `docs/releases/**`,
  `CONTRIBUTING.md`, `SECURITY.md`, and `.github/**`. Other documentation
  files may be changed only when explicitly named. Reports and generated
  output belong in chat or `/tmp`; release content must remain in Git.
- **R6 — Work placement:** classify every new ledger row, task and branch by
  searching the dashboard, register, phase history, roadmap, memory and
  touched source/features. Apply the first match: (1) ongoing standalone
  lifecycle work (`cleanup`, `qa-and-release`, `schema-migration`,
  `documentation`), branch/tag hygiene, CI and repository-process work belongs
  in standalone lifecycle tracking outside numbered development phases; P43 is
  the task-designated temporary setup-phase exception; (2) revise completed work
  as the next sequential revision of the original part and phase; (3) amend
  open work in place when widening scope; (4) use the next part in a related
  feature phase; (5) create a new phase for a new feature area. New/moved rows
  require a `Placement: rule <1-5>; searched <what>; related <IDs or none>;
  reason <one sentence>` line. See [work-placement.md](work-placement.md) for
  the complete procedure and lifecycle exception.
- **R7 — Slot-filling and empty phase reservations:** empty phase numbers freed
  by independent entity separation or cancellation (P7, P27, P28, P32) stay
  reserved as empty slots so no existing phase is renumbered and no
  historical branch, tag, commit or ID is rewritten. A new feature may take an
  empty slot only if it is related to the phase immediately before or after it:
  P7 for backup & security (P6) or investments (P8) work; P27 for
  accessibility & performance (P26) work; P28 for income
  recurrence / Budget income (P29) work; P32 for project health/community (P31) or
  widgets (P33) work. For multiple consecutive empty slots, apply the same
  adjacency pattern per slot. Unrelated work never takes an empty slot; it
  opens a new phase at the end under R6 rule 5. Precedence: R6 rules 1–3 first
  (standalone lifecycle, completed-part revisions, and open-part scope), then
  R7 for new-feature placement into an eligible adjacent empty slot before
  opening a new phase.
- **R8 — Owner-run and remote-only actions:** Record actions performed outside
  an agent session (pushes, PR creation/edits/comments/merges, branch deletion,
  network gates, device checks and release steps) and remote facts (PR numbers,
  merge SHAs, PR text/comments, tags and releases) in the ledger from
  verifiable evidence only: owner terminal output, owner-exported remote
  snapshots, or Git refs. Never infer or invent them. Begin each task by
  comparing the latest snapshot—or `git fetch --all --prune` plus first-parent
  merge logs for `develop` and phase branches—with
  `docs/history/entity-history-map.md` and the ledger; record omissions before
  new work. Record exact network-gate exit codes when captured, otherwise
  `not captured`. If a PR description conflicts with Git history, Git wins; add
  a dated correction without rewriting history. Every final report ends with
  an `Owner actions pending` list.

  Record manual owner terminal sessions with
  `script -a /tmp/wealthwise-remote-snapshot/owner-terminal-$(date +%F).log`
  and finish the session with `exit`. `pbpaste` only copies the clipboard; it
  is not session evidence unless the full terminal text was copied first.
  The owner exports the snapshot with `export-remote-snapshot.sh`; its PR
  records include number, title, state, base (`baseRefName`), head
  (`headRefName`), headRefOid, createdAt,
  updatedAt, mergedAt, closedAt, mergeCommit, mergedBy, url, author, labels
  and body, plus detail files for the latest 60 PRs, releases, tags, issues and
  remote branches. After every manual merge, refresh the snapshot before the
  next agent task. Export and capture procedures are maintained in
  `docs/memory/README.md`.
- Branching: `main` is stable released code; `develop` is integration and
  must pass all six gates; phase branches use `phase/NN-slug`, task branches
  use `task/ID-slug`, release branches use `release/vX.Y.Z`, hotfix branches
  use `hotfix/vX.Y.Z`, standalone lifecycle branches use `cleanup` (historical
  branch name: `phase/27-cleanup`), `qa-and-release` (historical branch name:
  `phase/28-qa-and-release`), `schema-migration` (historical branch name:
  `phase/07-schema-migration`), and `documentation`, and external contributors
  use `contrib/ISSUE-slug` with PRs into `develop`. Standalone documentation
  tasks branch from `documentation` as `task/docs-<slug>` and merge back
  `--no-ff`, then merge `documentation` into `develop` via PR; code tasks
  continue updating their own ledger rows in the same commit. The branching
  adoption baseline can contain legacy unreleased history; the stable-main
  rule applies prospectively. Merge tasks into phases and phases into `develop`
  with `--no-ff`; release/hotfix to `main` also uses `--no-ff`; contributor PRs
  are squash-merged with a Conventional Commit title. Agents do not push unless
  asked, do not commit directly to `main`/`develop` except an authorized
  bootstrap, delete merged task branches, and keep phase branches.
- **CM-2 — Active:** After any merge that lands on a target branch (task->phase, phase->develop, release->main, main->develop): git fetch --all --prune; git switch <target>; git pull --ff-only. Refuse and report if the worktree is dirty, the fast-forward fails or the target has no upstream. This rule never authorizes pushing; R3 is unchanged.
- The ordered six gates are `npm test -- --coverage`, `npx tsc --noEmit`,
  `npx expo lint`, `npx expo-doctor`, `npx expo export --platform android`,
  and `npx expo export --platform ios`. Expo exports are allowed. EAS Android
  APK builds are authorized after owner Markdown approval, code merge to
  `develop`, and GitHub Release draft creation; use the `android-apk` profile
  and upload/verify the result. Other EAS builds and local Gradle builds need
  explicit authorization.
- No cloud/network runtime behavior. Keep `src/domain/` pure: no React/Expo,
  ambient clock or randomness; inject dates, IDs and digests.
- React Compiler is enabled. Forms use React Hook Form `Controller` and
  `useWatch` only.
- Multi-entity operations use one pure domain action, one Zustand `set()` and
  one persisted write.
- Preserve unrequested behavior; remove replaced implementations rather than
  keeping parallel paths. Never weaken tests to get green.
- Reports, audits and generated output belong in chat replies or `/tmp`.
  Release content, including checklists, belongs in `docs/releases/` and never
  in `/tmp`.
- Anyone starting or continuing release work creates or reuses
  `docs/releases/drafts/vX.Y.Z.md`. Do not commit it before owner approval of
  the Markdown draft; then include it in the approved task -> phase ->
  `develop` PR path with subject `docs: draft vX.Y.Z release notes`. After
  approval, finalize the note and move it to `docs/releases/published/` before
  creating the GitHub Release draft. Never leave a published file in drafts
  or an unapproved draft in published.
- After approved changes merge to `develop`, create the GitHub Release draft.
  Then build the APK from the release branch with EAS profile `android-apk`,
  upload it to the draft, and verify the artifact. Do not wait for the owner
  to build or upload it manually. Publication still requires separate
  explicit approval.
- The latest **published** release alone may use `Latest version`,
  `/latest/`, and `WealthWise-android-latest-vX.Y.Z.apk`; a draft does not
  become latest until publication. Older release notes use `Version`, their
  own versioned APK filename, and a direct version URL, with no `latest`
  wording or route. When a newer version is published, rename the previous
  APK to `WealthWise-android-vX.Y.Z.apk` and update only that release's
  Download block and history link.
- Verify each APK digest privately against the artifact before release; never
  include it in human-authored release material. GitHub may expose a
  platform-generated asset digest that cannot be removed by editing the
  release. Keep the README Download block byte-identical to the latest
  published block. Each release updates the README Download and
  What's new sections and the releases-page link. During release preparation
  of an approved candidate, update README.md (Download block, What's new, and
  Screenshots gallery), docs/releases/published/vX.Y.Z.md, and release history
  to use the newer candidate release's screenshots, download details, and links
  so the candidate repository state is fully aligned and ready for publication.
  Verify the latest and every
  affected versioned link with `curl -I -L`; require HTTP 200 and expected
  artifact size. The Builds table records EAS build ID, profile, Android
  `versionCode`, date and status, but no source commit or digest.
- Name each screenshot `WealthWise-vX.Y.Z-screenshot-<screen>.png` and store
  it under `docs/releases/screenshots/vX.Y.Z/`, committed with its published
  release note. Do not attach screenshots as GitHub Release assets. In release
  notes, link thumbnails to absolute `blob/main` URLs and load images from
  matching absolute `raw.githubusercontent.com/.../main/` URLs; the README may
  use equivalent relative paths. Keep the README gallery limited to the
  latest release.
- No null-silencing `!` or `as` in `app/` or `src/components/`.
- Format monetary values through `AmountText`/`formatAmount` with an explicit
  display tier.
- Tabs remain Home, Transactions, Goals, Budget.
- Add/Edit/Delete are Feather icon actions. Reuse the established
  `plus`/`edit-2`/`trash-2` naming through shared icon/action components; do not
  substitute text or emoji for these actions.
- Demo fixtures use deterministic synthetic data, stable IDs/dates and valid
  links. Preserve demo constraints and domain integrity tests; never introduce
  private user financial data.
- For each GitHub release, attach its APK with the version in the filename.
  Only the latest published asset is named
  `WealthWise-android-latest-vX.Y.Z.apk`; on supersession, remove `latest`
  and rename it `WealthWise-android-vX.Y.Z.apk`, updating the old note and
  history URL. The latest status belongs to the newest published release;
  creating a draft does not change it.
  Verify
  APK digests privately; never include them in human-authored release
  material. GitHub may expose a platform-generated asset digest that cannot
  be removed by editing the release. Keep the README and latest published
  Download blocks identical; update README Download/What's new and the
  releases-page link for every release. During release preparation of an
  approved candidate, update README (Download block, What's new, Screenshots)
  and release docs to use the newer release assets and screenshots.
  Verify the current latest URL and
  every affected versioned link with `curl -I -L`, HTTP 200 and expected size.
  Name screenshots `WealthWise-vX.Y.Z-screenshot-<screen>.png`, commit them
  under `docs/releases/screenshots/vX.Y.Z/` with the corresponding release
  note, and reference the repository files in Markdown; only the APK is
  uploaded to the GitHub Release. README screenshots come from the latest
  release.
  Record EAS build ID, profile, Android `versionCode`, date and status in
  Builds, omitting source commits and digests.
  Production Android AABs go to Google Play and APKs to GitHub; iOS
  distribution is not currently offered. Signing credentials are EAS-managed.
  See [`build-config.md`](../releases/build-config.md).

## Device checklist release gate

A release must not be built, drafted, tagged or published while any row in ANY section of the device checklist (the Next release section and every earlier section) has a Result other than Pass. Not run, Fail and Blocked all block. Check the checklist first; if blocked, stop and report the blocking IDs, and do not start the build or the GitHub Release draft. A Pass may only be recorded from an owner-observed or owner-reported device result, never inferred from automated tests or Expo exports. Only an explicit written owner waiver for named IDs lifts the block; record the waiver in the ledger (Owner-run actions log) and in the release note, and leave the row's Result unchanged.

Maintenance rules: new device checks go under Next release device checks (or the decided version's section) with the next free ID, never into a published release's section, never renumbered. When the next version is decided, retitle that section `## vX.Y.Z device checks (next release)` and fill its App version. On publication, retitle it `## vX.Y.Z device checks`, set the published date, move it to the bottom of the version list (ascending order), and create a new empty `## Next release device checks` section at the top. Device-check results the owner reports are recorded under rule R8 (Owner-run actions log) with their evidence. When updating the device checklist, agents must prompt the owner to confirm all metadata fields before making changes: Device model, Android version, Tester (always record the tester username, e.g., sahilsheikh-dev), and verification Date, providing suggestions based on previous releases data (e.g., realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev).

## Protected file hashes

Git blob IDs at the P25-C preflight (verify with `git hash-object` before
relying on them after an authorized edit):

All six protected files were verified at CR-108 preflight. Reverified with
`git hash-object` on 2026-11-10 after the authorized Part 2 edit and again
after P41-C and P41-D changes, then on 2026-11-11 at final develop
verification; all six still match the IDs below and the authorized Budget
blob remains unchanged.

| File | Git blob ID | Rule |
|---|---|---|
| `app/(tabs)/index.tsx` | `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` | User-owned; no Copilot edits authorized. |
| `app/(tabs)/budget.tsx` | `eca7607015cb3c8b85dfc7e0d4001235166742a2` | Updated only for authorized CR-108 Part 2 overview text removal and CR-125 / P20-X Budget category and item sorting; preserve Opening/Closing balance labels, Cash flow labels, removed controls, no bottom border on Insurance/Transactions balance sections, and Stop/Resume investment labels. |
| `src/components/SortChip.tsx` | `837a675af94dd056532bc63fc4697efc905a5af3` | Leave unchanged. |
| `src/lib/sorting.ts` | `7491663f0987d83d03f3ed72b01de5b376e3572d` | Leave unchanged. |
| `src/components/form/frozen-manifest.json` | `476418c7084f0774f1b6fb86ddfe08c7a265fc40` | Frozen inputs are governed by this manifest. |
| `src/components/__tests__/formComponentsFrozen.test.ts` | `44e6f7e1592dabf9de95d2ed09cbe65af7968d1c` | Leave unchanged; run the test. |

## Commits and ledger

Read and update `docs/PROGRESS.md` with each task commit. Preserve uncommitted
user changes; if dirty at preflight, commit named files with descriptive
Conventional Commit messages derived from their diffs. Commit each task step
separately. Never push, amend, or rewrite history unless the owner explicitly
asks; release publication and tag changes require explicit owner approval.
Every reported/recorded commit hash must
be copied from `git log` and verified with `git cat-file -t`. Record assumptions
as `Assumed: ...`; state superseded assertions and the replacement/reason.

## Gates

Run sequentially, retaining actual exit codes:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Coverage floors: `src/domain/` and pure `src/lib/` at least 90% lines and
branches; `src/data/` at least 85%, excluding hooks. Layout tests are simulated:
record unverified physical-device behavior in the ledger and `open-items.md`.
