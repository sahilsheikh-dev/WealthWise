> AI agents: read [docs/memory/README.md](docs/memory/README.md) first. Before
> finishing, update `status.md` and `open-items.md` there.

This `AGENTS.md` is the repository's single instruction entry point for every
AI tool. Keep tool-specific instruction files out of the repository; update
these shared instructions instead.

Reports, audits and generated output belong in chat or `/tmp`; release content
must remain in Git and never be placed under `/tmp`. Routine documentation
changes in Git are limited to `docs/memory/*`, `docs/PROGRESS.md`, and
`docs/releases/**`, including release drafts. Change other documentation only
when the owner explicitly requests those files.

WealthWise is an offline-first Expo SDK 57 / React Native application. Use npm
(`package-lock.json` is present) and Node.js 26 LTS (`.nvmrc` pins 26.13.0;
`engines` allows `>=26.0.0 <27`); routes are in `app/`, not `src/app/`.

## COMMON RULES

These COMMON RULES apply to every prompt and task, whether or not a prompt
repeats or pastes them. If a task explicitly authorizes a narrower exception,
apply only that exception and preserve all other rules.

- **R1 — Preflight and commits:** before other work, list every dirty file and
  run `git diff --stat` plus the complete diff. Before each commit, show the
  proposed subject and staged diff-stat. Commit exactly the named files, use
  one commit per unrelated area, and use a descriptive Conventional Commit
  subject stating what changed. Subjects require one of `feat`, `fix`, `docs`,
  `test`, `chore`, `refactor`, `perf`, `style`, `build`, `ci`, or `revert`;
  optional scopes are allowed. Use a descriptive subject and never bypass
  the hook, which rejects prohibited placeholder subjects. Preserve owner
  edits; never use checkout, restore, stash, reset, or old-code reapplication
  to undo them. Enable the hook with
  `git config core.hooksPath .githooks`.
- **R2 — Phase and revision IDs:** align work with its existing phase. A fix
  to a completed subtask stays in that phase and uses `<ID>-R<n>`; the
  original row must say `Revised by <ID>-R<n>`. Create a new phase only for
  genuinely new work.
- **R3 — History, pushes and release approval:** agents do not push unless
  the owner explicitly authorizes it, and never force-push or rewrite history.
  Never publish releases or create, move, or delete release tags without
  explicit owner approval.
- **R4 — Documentation scope:** routine Git documentation is limited to
  `docs/memory/*`, `docs/PROGRESS.md`, `docs/releases/**`, `CONTRIBUTING.md`,
  `SECURITY.md`, and `.github/**`. Change other documentation only when
  explicitly authorized. Reports and generated output belong in chat or
  `/tmp`; release content must remain in Git, never `/tmp`.
- **R5 — Preserve owner edits:** when the owner edits a file after agent
  changes, ask whether they want those owner edits reverted before changing
  the affected file further. Revert or overwrite owner edits only when the
  owner explicitly requests it; otherwise preserve them and work around them.

### Branching

- `main` is stable, released code; changes arrive by release or hotfix merge
  and receive a `vX.Y.Z` tag. The initial branching adoption baseline may
  contain legacy unreleased history; this rule applies prospectively.
- `develop` is the integration branch and must pass all six gates.
- Create one `phase/NN-slug` branch per phase from `develop`. A revision to a
  completed phase reopens its existing phase branch from `develop` (R2).
- Create `task/ID-slug` branches from their phase branch, one per subtask or
  revision. Example: `task/P29-AB-R2-income-rows`.
- After approved task/phase work is merged to `develop`, create
  `release/vX.Y.Z` from `develop` and create the GitHub Release draft at that
  exact candidate commit. Creating the draft may create its version tag; do
  not retarget it. After owner APK upload/confirmation, artifact verification
  and separate publication approval, merge the release branch `--no-ff` into
  `main`, verify the tag target, and back-merge into `develop`. Create
  `hotfix/vX.Y.Z` from `main`, then merge to `main`, tag, and merge to
  `develop`.
- External contributors fork and use `contrib/ISSUE-slug`, submitting a PR
  into `develop`. Contributor PRs are squash-merged with a Conventional
  Commit title.
- Merge task into phase, then phase into `develop`, with `--no-ff`. Merge
  release/hotfix to `main` with `--no-ff`. Agents never commit directly to
  `main` or `develop`, except the explicitly authorized bootstrap. Delete
  merged task branches and keep phase branches. Do not push unless asked;
  report merge commands in chat.

### Gates

Run these six gates in order and record each real exit code:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Expo exports are allowed when required. EAS builds and local Gradle builds
are not authorized unless explicitly requested.

## Project rules

- If an owner edit causes a test failure, update the test to match the source
  and record the old assertion, new assertion, and reason in `docs/PROGRESS.md`.
- Read `docs/PROGRESS.md` before changing behavior; update its decision and
  verification records with the same task commit.
- Treat `app/(tabs)/index.tsx` as user-owned; do not edit without explicit task
  authorization. Preserve the separately hashed files listed in
  `docs/memory/rules.md`.
- Keep `src/domain/` pure: no React/Expo imports, clock reads or randomness.
  Inject dates and identifiers.
- A multi-entity action must be one pure domain action and one Zustand store
  `set`, producing one persisted write.
- Use Expo Router for navigation. Forms use React Hook Form `Controller` and
  `useWatch`; React Compiler is enabled.
- Do not use `!` or `as` to silence nullability in `app/` or
  `src/components/`. Format amounts with `AmountText` or `formatAmount` and an
  explicit display tier.
- Keep tabs Home, Transactions, Goals and Budget. Preserve the Budget cash-flow
  labels, `SortChip.tsx`, `src/lib/sorting.ts`, frozen inputs in
  `src/components/form/`, and the `formComponentsFrozen` test unless the task
  explicitly requires a change.
- Do not weaken assertions. If a design is superseded, document the old
  assertion, its replacement and the reason in `docs/PROGRESS.md`.
- Check the installed Expo major version before using Expo APIs and consult
  matching Expo documentation. Keep native changes in app config/plugins;
  do not hand-edit generated native files.
- For the current/latest GitHub release, attach the APK as
  `WealthWise-android-latest-vX.Y.Z.apk`; the `/latest/` URL uses this exact
  filename. When a newer version is published, remove `latest` from the
  previous asset name and rename it to `WealthWise-android-vX.Y.Z.apk` before
  linking it. Each non-latest release uses its own version-specific asset.
  Never use the `/latest/` route for an older release. Anyone starting or
  continuing release work creates or reuses
  `docs/releases/drafts/vX.Y.Z.md`. Do not commit the candidate before the
  owner approves the Markdown draft. After approval, complete all release
  details and screenshots, move the finalized note to
  `docs/releases/published/`, and commit it with the approved release work
  before creating a GitHub Release draft; never leave a published file in
  drafts or an unapproved draft in published. Before each release,
  verify the APK digest against the artifact privately; never include the
  digest in human-authored release material. GitHub may expose a
  platform-generated asset digest that cannot be removed by editing the
  release.
  Release sequence: obtain approval of the Markdown draft first, then commit
  the approved code and finalized note (already moved to `published/`) on the
  task branch and merge task -> phase -> `develop` through PRs. After the
  merge, create the GitHub Release as a draft at the merged code, attach every
  version screenshot and use each absolute asset URL in the draft body.
  Immediately use the ask-user dialogue to request the absolute local path to
  the owner's built APK, state the required filename, and wait for the owner
  to provide the path or confirm manual upload. Agents do not build APKs.
  Continue only after owner upload confirmation. Then privately verify the
  artifact and links, finish the release records, and publish only after
  explicit publication approval.
  The README Download block and latest published release Download block must
  be identical.
  Every release updates the README Download and What's new sections and its
  releases-page link. Include all screenshots explicitly supplied for a
  release in its Markdown and GitHub Release body. The README Screenshots
  section contains only the latest release's screenshot set and has no
  version title. If no screenshots are supplied, reuse the previous release's
  full set for the new release and README, preserving the original image bytes
  under the new versioned screenshot directory. Display images at 150 pixels
  wide in table rows, with no more than four screenshots per row. Keep
  capture scripts outside the app and
  repository. Display categories in this order, omitting unavailable screens:
  Home, Assets, Liabilities, Emergency Fund, Goals, Insurance, Budget,
  Transactions. Release notes and GitHub release bodies must not contain a
  Contributors section. When updating an existing published note, change
  only its Download block except for screenshot updates and contributor
  section removal explicitly requested by the owner. Verify every rendered
  screenshot URL and the current latest URL and every affected
  versioned URL with `curl -I -L`; each must return HTTP 200 and the expected
  artifact size. Record EAS build
  ID, profile, Android `versionCode`, date and status in the release-history
  Builds table; do not include source commits or digests. Follow
  `docs/releases/build-config.md`; production Android AABs go to Google Play
  and APKs to GitHub. iOS distribution is not currently offered.

## Schema and verification

Current persisted schema version: **22**. Preserve migration and backup-import
compatibility.

Run the gates in this order, recording each exit code:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Layout tests are simulated. Record physical-device checks that remain
unverified in `docs/PROGRESS.md`.
