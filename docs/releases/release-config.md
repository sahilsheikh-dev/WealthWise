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

Bug-fix-only releases bump PATCH. Releases with visible new features bump
MINOR; breaking changes bump MAJOR. Release 2 is planned as v1.1.0 if it
includes the Budget Pace graph, otherwise v1.0.1; confirm the scope and version
with the owner when preparing that release. Change `app.json`, `package.json`
and `package-lock.json` versions only in the release-preparation task for that
version.

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
| Automatic Git Commit | No (draft and archive commits are required) |
| Automatic Git Push | No |

Build targets and EAS profiles are documented in
[`build-config.md`](./build-config.md): production Android AAB for Google Play,
`android-apk` for the GitHub download. iOS distribution is not currently
offered. Signing credentials are EAS-managed; never place them in this
repository.

## 6. Release Documentation

All release-related documentation must remain inside:

`docs/releases/`

Naming conventions:

- Draft: `drafts/vX.Y.Z.md`
- Published release: `published/vX.Y.Z.md`
- History: `release-history.md`

Anyone starting or continuing release work creates or reuses
`docs/releases/drafts/vX.Y.Z.md` and commits it with subject
`docs: draft vX.Y.Z release notes`. Release content belongs in Git, never in
`/tmp`. After verifying successful GitHub publication, move the draft into
`published/` and commit the move. Never leave a published file in drafts or a
draft in published.

## 7. Safety Policies

Follow the shared repository rules in [`AGENTS.md`](../../AGENTS.md),
[`memory/rules.md`](../memory/rules.md), and
[`PROGRESS.md` section 3](../PROGRESS.md#3-standing-rules). In particular:

- Before other work, list every dirty file, run `git diff --stat`, and inspect
  the complete diff. Commit exactly those files with a descriptive
  Conventional Commit subject; split unrelated areas into separate commits.
  Do not bypass commit-message enforcement.
- Keep fixes to completed work in their original phase as `<ID>-R<n>`.
- Never push, amend, or rewrite history without explicit owner approval.
- Release publication and tag creation require explicit owner approval.
- Never overwrite or delete published release records or tags.
- Never expose secrets or commit EAS credentials.
- Anyone starting or continuing release work creates or reuses
  `docs/releases/drafts/vX.Y.Z.md` and commits it as
  `docs: draft vX.Y.Z release notes`. After publication is verified, move the
  file to `docs/releases/published/` and commit the move; never leave a
  published file in drafts or a draft in published. Release content is never
  stored in `/tmp`.
- For every GitHub release:
  - Attach the Android APK under the exact name `WealthWise-android.apk`.
  - Include the Download block and SHA-256 in both the published Markdown and
    GitHub release body. The latest published block matches the README and
    uses the latest route; older releases use their versioned asset link.
  - Add or replace only the Download block in an existing published note; do
    not otherwise rewrite the file.
  - When a newer version is published, replace only the previous release's
    Download block with its versioned link.
  - Verify both latest and versioned links with `curl -I -L`; both must return
    HTTP 200, and the downloaded APK's SHA-256 must match.
  - Record EAS build ID, Android `versionCode`, source commit, exact artifact
    name, profile, date and status in the release-history Builds table.
  - Confirm both links return HTTP 200, the SHA-256 matches, and the README,
    published Markdown, release history and GitHub assets agree. The release
    remains incomplete until every check passes.
  - For old published records, change only that version's Download block; do
    not otherwise rewrite the file.

Use the published Markdown as the release-body source. For v1.0.0, the owner
command is `gh release edit v1.0.0 --notes-file docs/releases/published/v1.0.0.md`.

The worktree and release rules are shared policy, not release-specific
exceptions.

## 8. Configuration Maintenance

Update this file only when repository information or established release policies change.

Do not guess missing configuration values.