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

### Branching

- `main` is stable, released code; changes arrive by release or hotfix merge
  and receive a `vX.Y.Z` tag. The initial branching adoption baseline may
  contain legacy unreleased history; this rule applies prospectively.
- `develop` is the integration branch and must pass all six gates.
- Create one `phase/NN-slug` branch per phase from `develop`. A revision to a
  completed phase reopens its existing phase branch from `develop` (R2).
- Create `task/ID-slug` branches from their phase branch, one per subtask or
  revision. Example: `task/P29-AB-R2-income-rows`.
- Create `release/vX.Y.Z` from `develop` for versioning, changelog and draft
  notes. Merge it `--no-ff` into `main`, tag it, then back-merge into
  `develop`. Create `hotfix/vX.Y.Z` from `main`, then merge to `main`, tag,
  and merge to `develop`.
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
  continuing release work
  creates or reuses `docs/releases/drafts/vX.Y.Z.md` and commits it with
  subject `docs: draft vX.Y.Z release notes`. After publication is verified,
  move it to `docs/releases/published/` and commit the move; never leave a
  published file in drafts or a draft in published. Before each release,
  verify the APK digest against the artifact privately; never include the
  digest in human-authored release material. GitHub may expose a
  platform-generated asset digest that cannot be removed by editing the
  release.
  The README Download block and latest published release Download block must
  be identical.
  Every release updates the README Download and What's new sections and its
  releases-page link. When updating an existing published note, change only
  its Download block. Verify the current latest URL and every affected
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
