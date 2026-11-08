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

## Project rules

- **R1 — Dirty-file preflight and commit subjects:** before other work, list
  every dirty file and run `git diff --stat` plus the complete diff. Before
  committing, show the proposed subject and staged diff-stat. Commit exactly
  the named files with a descriptive Conventional Commit subject that states
  what actually changed; use one commit per unrelated area. Do not use
  placeholder or update-only subjects, and never bypass the commit hook.
  Preserve owner edits; never use checkout, restore, stash, reset, or
  old-code reapplication to undo them.
- **R2 — Phase and revision IDs:** align each task with existing work. A fix
  or change to a completed subtask stays in its original phase and is logged
  as `<ID>-R<n>` (for example, `P29-AB-R1`); the original row must say
  `Revised by <ID>-R<n>`. Create a new phase with subtasks only for genuinely
  new areas.
- **R3 — History and release approval:** never push, amend or rewrite history
  unless the owner explicitly asks. Release publication and tag creation,
  movement or deletion require explicit owner approval.
- **R4 — Documentation scope:** routine documentation committed to Git is
  limited to `docs/memory/*`, `docs/PROGRESS.md`, and `docs/releases/**`,
  including drafts. Other documentation files may be changed only when the
  owner explicitly names them. Reports and generated output belong in chat or
  `/tmp`; release content must never be placed there.
- Enable commit-message enforcement in each clone with
  `git config core.hooksPath .githooks`.
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
- For every GitHub release, attach the Android APK named exactly
  `WealthWise-android.apk`. Anyone starting or continuing release work
  creates or reuses `docs/releases/drafts/vX.Y.Z.md` and commits it with
  subject `docs: draft vX.Y.Z release notes`. After publication is verified,
  move it to `docs/releases/published/` and commit the move; never leave a
  published file in drafts or a draft in published. Include the Download
  block and SHA-256 in published Markdown and the GitHub release body. The
  README Download section and latest release Download block must be identical
  and use the latest route; older releases use their own versioned link. When
  adding a Download block to an existing published note, add or replace only
  that block; do not otherwise rewrite the file. When a newer version is
  published, change only the previous release's Download block to its
  versioned link. Verify both download links
  with `curl -I -L`; both must return HTTP 200 and the APK hash must match.
  Record EAS build ID, Android `versionCode`, source commit and artifact in
  the `release-history.md` Builds table. A release is incomplete until both
  links return 200, the hash matches, and the README, published Markdown,
  release history and GitHub assets agree. Follow
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
