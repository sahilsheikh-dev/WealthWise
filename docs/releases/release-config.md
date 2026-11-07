# WealthWise – Release Configuration

This file contains the configuration and policies governing WealthWise GitHub Releases.

See [`build-config.md`](./build-config.md) for EAS build profiles, version
identifiers, store tracks, commands, and pre-/post-build requirements.

## 1. Application Information

| Property | Value |
|---|---|
| Application Name | WealthWise |
| Project Type | Mobile Application |
| Release Platform | GitHub Releases |
| Versioning Standard | Semantic Versioning |
| Version Format | MAJOR.MINOR.PATCH |
| Release Notes Format | Markdown |

## 2. GitHub Repository Configuration

| Property | Value |
|---|---|
| GitHub Owner | sahilsheikh-dev |
| Repository Name | WealthWise |
| Repository URL | https://github.com/sahilsheikh-dev/WealthWise |
| Default Branch | main |
| Remote Name | origin |

Repository identity verified from the `origin` remote and GitHub CLI.

Verification commands:

```bash
git remote get-url origin
gh repo view
```

## 3. Versioning Configuration

| Property | Policy |
|---|---|
| Version Standard | Semantic Versioning |
| Release Tag Format | vX.Y.Z |
| Baseline | Latest published stable GitHub Release |
| MAJOR Increment | Breaking changes |
| MINOR Increment | New backward-compatible features |
| PATCH Increment | Bug fixes and maintenance |
| Prerelease | Disabled unless explicitly requested |
| Version Approval | Required |

## 4. Release Scope

Include:

- Merged pull requests.
- Verified commits.
- Completed features.
- Bug fixes.
- Security improvements.
- Dependency updates.
- Infrastructure improvements.
- Relevant documentation updates.

Exclude:

- Open pull requests.
- Draft pull requests.
- Unmerged changes.
- Reverted functionality.
- Changes outside the selected release range.
- Incomplete functionality.

## 5. Release Publication

| Property | Configuration |
|---|---|
| Platform | GitHub Releases |
| Publication Tool | GitHub CLI |
| Draft Directory | docs/releases/drafts/ |
| Published Notes Directory | docs/releases/published/ |
| Approval Required | Yes |
| Automatic Publication | No |
| Automatic Tagging | Only after approval |
| Automatic Documentation Archival | After successful publication |
| Automatic Git Commit | No |
| Automatic Git Push | No |

Build targets and EAS profiles are documented in
[`build-config.md`](./build-config.md): production Android AAB for Google Play,
`android-apk` for the GitHub download, and iOS builds for TestFlight/App Store.
Signing credentials are EAS-managed; never place them in this repository.

## 6. Release Documentation

All release-related documentation must remain inside:

`docs/releases/`

Naming conventions:

- Draft: `drafts/vX.Y.Z.md`
- Published release: `published/vX.Y.Z.md`
- History: `release-history.md`

Move each draft into `published/` only after verifying successful GitHub
publication. Keep all published Markdown release records in that directory;
do not retain duplicates at the release root or in `drafts/`.

## 7. Safety Policies

Follow the shared repository rules in [`AGENTS.md`](../../AGENTS.md),
[`memory/rules.md`](../memory/rules.md), and
[`PROGRESS.md` section 3](../PROGRESS.md#3-standing-rules). In particular:

- Never checkpoint dirty files with a generic message; inspect and commit only
  the named dirty files with descriptive Conventional Commit messages.
- Keep fixes to completed work in their original phase as `<ID>-R<n>`.
- Never push, amend, or rewrite history without explicit owner approval.
- Release publication and tag creation require explicit owner approval.
- Never overwrite or delete published release records or tags.
- Never expose secrets or commit EAS credentials.
- Keep drafts in `drafts/`; keep published notes in `published/`.
- After every build and before GitHub publication:
  - Download the Android APK, rename it `WealthWise-android.apk`, and attach
    it to the release draft with `gh release upload`.
  - Verify the Android download URL with `curl -I` (HTTP 302) and
    `curl -I -L` (redirect followed by HTTP 200); record the result.
  - Update the README Download version/date, working Android link,
    owner-supplied iOS link and new installation notes; retain Old versions.
  - Record EAS build ID, Android build number/`versionCode`, artifact name,
    profile, date and status in the release-history Builds table.
  - Confirm the README, release history and GitHub release assets agree.
    A release is not complete until they do.

The worktree and release rules are shared policy, not release-specific
exceptions.

## 8. Configuration Maintenance

Update this file only when repository information or established release policies change.

Do not guess missing configuration values.