<!-- Purpose: Engineering invariants, protected surfaces and verification commands. | Last updated: 2026-11-10 | Updates: owner and AI agents -->

# Rules

## Invariants

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
- Branching: `main` is stable released code; `develop` is integration and
  must pass all six gates; phase branches use `phase/NN-slug`, task branches
  use `task/ID-slug`, release branches use `release/vX.Y.Z`, hotfix branches
  use `hotfix/vX.Y.Z`, and external contributors use `contrib/ISSUE-slug`
  with PRs into `develop`. The branching adoption baseline can contain legacy
  unreleased history; the stable-main rule applies prospectively. Merge tasks
  into phases and phases into `develop` with `--no-ff`; release/hotfix to
  `main` also uses `--no-ff`; contributor PRs are squash-merged with a
  Conventional Commit title. Agents do not push unless asked, do not commit
  directly to `main`/`develop` except an authorized bootstrap, delete merged
  task branches, and keep phase branches.
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
  What's new sections and the releases-page link. Verify the latest and every
  affected versioned link with `curl -I -L`; require HTTP 200 and expected
  artifact size. The Builds table records EAS build ID, profile, Android
  `versionCode`, date and status, but no source commit or digest.
- Name each screenshot `WealthWise-vX.Y.Z-screenshot-<screen>.png` and store
  it under `docs/releases/screenshots/vX.Y.Z/`, committed with its published
  release note. Do not attach screenshots as GitHub Release assets. In release
  notes, link thumbnails to absolute `blob/main` URLs and load images from
  matching absolute `raw.githubusercontent.com/.../main/` URLs; the README may
  use equivalent relative paths. Keep the README gallery limited to the
  latest published release.
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
  releases-page link for every release. Verify the current latest URL and
  every affected versioned link with `curl -I -L`, HTTP 200 and expected size.
  Name screenshots `WealthWise-vX.Y.Z-screenshot-<screen>.png`, commit them
  under `docs/releases/screenshots/vX.Y.Z/` with the corresponding release
  note, and reference the repository files in Markdown; only the APK is
  uploaded to the GitHub Release. README screenshots come from the latest
  published release only.
  Record EAS build ID, profile, Android `versionCode`, date and status in
  Builds, omitting source commits and digests.
  Production Android AABs go to Google Play and APKs to GitHub; iOS
  distribution is not currently offered. Signing credentials are EAS-managed.
  See [`build-config.md`](../releases/build-config.md).

## Protected file hashes

Git blob IDs at the P25-C preflight (verify with `git hash-object` before
relying on them after an authorized edit):

All six protected files were verified at CR-108 preflight. Reverified with
`git hash-object` on 2026-11-10 after the authorized Part 2 edit and again
after P41-C and P41-D changes; all six still match the IDs below and the
Budget blob remains unchanged.

| File | Git blob ID | Rule |
|---|---|---|
| `app/(tabs)/index.tsx` | `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` | User-owned; no Copilot edits authorized. |
| `app/(tabs)/budget.tsx` | `ddc1369da3a9b982e6b377990234c29f4ff051c9` | Updated only for authorized CR-108 Part 2 overview text removal; preserve Opening/Closing balance labels, Cash flow labels, removed controls, no bottom border on Insurance/Transactions balance sections, and Stop/Resume investment labels. |
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
