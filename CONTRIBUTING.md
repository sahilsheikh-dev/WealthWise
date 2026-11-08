# Contributing to WealthWise

Thank you for helping improve WealthWise. The app is offline-first; please do
not include real financial records, backups, credentials, or personal data in
issues, pull requests, fixtures, or screenshots.

## Setup

Use the Node.js version pinned by `.nvmrc` and npm:

```bash
npm ci
npx expo start
```

Enable the repository commit hook once per clone:

```bash
git config core.hooksPath .githooks
```

## Branching

- `main` contains stable released code. Changes arrive through release or
  hotfix merges and receive a `vX.Y.Z` tag. The initial branching adoption
  baseline may contain legacy unreleased history; this rule applies
  prospectively.
- `develop` is the integration branch and must pass all six gates.
- Create one `phase/NN-slug` branch per phase from `develop`. A revision to a
  completed phase reopens its phase branch from `develop`.
- Create one `task/ID-slug` branch per subtask or revision from that phase,
  such as `task/P29-AB-R2-income-rows`.
- Create `release/vX.Y.Z` from `develop` for version, changelog, and draft
  release-note changes. Merge to `main` with `--no-ff`, tag the release, then
  back-merge into `develop`.
- Create `hotfix/vX.Y.Z` from `main`; merge to `main`, tag, and merge to
  `develop`.
- External contributors fork and use `contrib/ISSUE-slug`, then open a PR
  targeting `develop`.

Merge tasks into their phase and phases into `develop` with `--no-ff`.
Contributor PRs are squash-merged with a Conventional Commit title. Merged
task branches are deleted; phase branches are retained. Agents do not push
unless the owner explicitly asks, do not force-push, and do not commit
directly to `main` or `develop` except an authorized bootstrap. They report
merge commands in chat.

## Commit subjects

Use a descriptive Conventional Commit subject with one of these types:
`feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `perf`, `style`, `build`,
`ci`, or `revert`. Optional scopes are allowed, for example:

```text
fix(P29-AB-R2): hide income outside its due month
```

The commit hook rejects placeholder subjects. Do not bypass it.

## Gates

Run and record these six commands in order:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Expo exports are allowed when required. EAS and Gradle builds are not
authorized unless explicitly requested.

## Pull request checklist

- [ ] Branch and target follow the phase workflow; target `develop`.
- [ ] Commits have descriptive Conventional Commit subjects.
- [ ] Tests cover the requested behavior, including failure reproductions
      where applicable.
- [ ] All six gates pass and their actual results are recorded.
- [ ] Documentation, migration/backup compatibility, and accessibility were
      reviewed where relevant.
- [ ] No personal financial data, secrets, or generated native files are
      included.
- [ ] Device-only checks that remain unverified are listed.

## Where to ask

Use GitHub Issues for reproducible bugs and feature requests. For security
concerns, use the private reporting channel described in [SECURITY.md](SECURITY.md).
Do not post personal financial data in public issue trackers.
