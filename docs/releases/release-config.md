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
| Automatic Documentation Archival | After owner Markdown approval, before GitHub draft |
| Automatic Git Commit | No (draft and archive commits are required) |
| Automatic Git Push | No |

## Approved release sequence

1. Prepare the versioned Markdown release draft, complete it with verified
   release details and screenshot links, and ask the owner to approve it. Do
   not commit the candidate before that approval.
2. After approval, finalize the release note and move it from `drafts/` to
   `published/vX.Y.Z.md` before beginning GitHub Release draft setup. Commit
   the approved code and finalized note on the task branch, then merge task ->
   phase -> `develop` using PRs and the required gates. Never build from an
   unmerged branch. Release notes and GitHub release bodies must not contain a
   Contributors section.
3. Use all screenshots explicitly supplied for a release. Name each image
   `WealthWise-vX.Y.Z-screenshot-<screen>.png` and attach it to the matching
   GitHub Release. Do not retain screenshot files in the repository. If none
   are supplied, reuse the previous published release's complete set and
   attach it under the new version's filenames.
4. After the changes merge to `develop`, create `release/vX.Y.Z` at that
   source and create the GitHub Release draft at the release-branch commit.
   The draft may create the version tag; do not retarget it. Attach every
   screenshot, use each absolute attached-asset URL in the draft body, then
   run `eas build --platform android --profile android-apk` from the release
   branch. Wait for the successful build, download the APK outside the
   repository, and upload it to the draft as
   `WealthWise-android-latest-vX.Y.Z.apk`. Do not wait for the owner to build
   or upload it manually.
5. Privately verify the uploaded APK against its EAS artifact and verify the
   digest, links, release notes and build-history record. After separate
   explicit publication approval, merge the release branch `--no-ff` into
   `main`, verify the tag target, then publish. The finalized note is already
   in `published/`; do not move it after publication.

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
`docs/releases/drafts/vX.Y.Z.md`. Do not commit the candidate before the owner
approves the Markdown draft. After approval, finalize all release details,
move the note to `published/vX.Y.Z.md`, and commit it with the approved work
on the task branch using subject `docs: draft vX.Y.Z release notes`; then
merge task -> phase -> `develop` through PRs. The finalized note must be in
`published/` before GitHub Release draft creation. Release content belongs in
Git, never in `/tmp`. Never leave an approved release note in `drafts/` or an
unapproved draft in `published/`.

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
  `docs/releases/drafts/vX.Y.Z.md`. Do not commit before owner approval of the
  Markdown draft; then include it with approved work in the task -> phase ->
  `develop` PR path. Use subject `docs: draft vX.Y.Z release notes`. After
  publication is verified, move the file to `docs/releases/published/` and
  commit the move; never leave a published file in drafts or a draft in
  published. Release content is never stored in `/tmp`.
- For every GitHub release:
  - Only the latest **published** release may say `Latest version` or use the
    `/latest/` download URL and filename
    `WealthWise-android-latest-vX.Y.Z.apk`. A draft does not become latest
    until publication. Previous versions say `Version`, use their own
    versioned APK filename and direct URL, and contain no `latest` wording.
  - When publishing a newer version, remove `latest` from the previous
    release asset name, rename it to `WealthWise-android-vX.Y.Z.apk`, and
    update the previous release link to the matching versioned filename.
    Never use `/latest/` for an older release.
  - Verify the APK digest privately before publication, but never include it
    in human-authored release material. GitHub may expose a platform-generated
    asset digest that cannot be removed by editing the release.
  - Keep the latest published Download block identical to README; older
    releases use their versioned asset link and versioned download filename.
  - Update the README Download and What's new sections and its releases-page
    link for every release.
  - Include every supplied screenshot in that version's release Markdown and
    GitHub Release body using absolute asset URLs. Name each asset
    `WealthWise-vX.Y.Z-screenshot-<screen>.png` and store it only on the
    matching GitHub Release; do not retain a `docs/releases/screenshots/`
    directory. README's Screenshots section contains only the latest
    published release's complete image set, without a version title. If no
    screenshots are supplied, reuse the previous published release's complete
    image set and attach it under the new version's filenames. Verify every
    rendered asset URL before removing any local screenshot folder.
    Render images at 150 pixels wide in table rows, with no more than four
    screenshots per row. Order categories Home, Assets, Liabilities,
    Emergency Fund, Goals, Insurance, Budget, Transactions; omit unavailable
    screens.
  - Capture screenshots with deterministic synthetic demo data on the
    owner-designated test setup. Never capture personal phone data. Keep any
    one-off capture script outside the repository, do not package or upload
    it, and delete it after use. Upload only reviewed screenshots. If the
    owner explicitly designates the same image for multiple versions, record
    that approval and reuse the exact file without implying separate captures.
  - For an existing published note, change only its Download block unless the
    owner explicitly authorizes another specific change. The owner has
    explicitly authorized adding release-specific screenshots to v1.0.0,
    v1.1.0 and future release records and removing Contributors sections from
    all release notes; make no unrelated historical edits.
  - When a newer version is published, replace only the previous release's
    Download block with its versioned link and filename, except for
    separately owner-authorized screenshot additions.
  - Verify latest and versioned links with `curl -I -L`; both must return
    HTTP 200 with the expected artifact size.
  - Record EAS build ID, Android `versionCode`, profile, date and status in
    the release-history Builds table; omit source commits and digests.
  - Confirm the README, published Markdown, release history, version-specific
    screenshots and GitHub release body agree. The release remains incomplete
    until every check passes.
  - For old published records, change only that version's Download block,
    except for screenshot additions explicitly authorized by the owner; do not
    otherwise rewrite the file.

After creating a GitHub Release draft, run the configured EAS Android APK
build, upload the APK under the required versioned asset filename, and verify
the artifact before requesting separate publication approval. Do not wait
for the owner to build or upload the APK manually.

Use the finalized published Markdown as the release-body source. For images
in GitHub release bodies, replace repository-relative screenshot paths with
the absolute URLs of the matching attached release assets.

The worktree and release rules are shared policy, not release-specific
exceptions.

## 8. Configuration Maintenance

Update this file only when repository information or established release policies change.

Do not guess missing configuration values.