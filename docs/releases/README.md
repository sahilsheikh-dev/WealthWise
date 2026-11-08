# WealthWise – Release Management

## Overview

This directory contains the official release management documentation for WealthWise.

It maintains release configurations, version history, published release notes,
unpublished drafts, and the reusable AI-powered GitHub release workflow.

## Documentation Index

| File | Description |
|---|---|
| `RELEASE_PROMPT.md` | Master reusable prompt for automated release discovery, analysis, and publication |
| `TEMPLATE.md` | Reusable skeleton for new release notes |
| `release-config.md` | Repository configuration and release policies |
| `release-history.md` | Historical register of published releases |
| `build-config.md` | EAS profiles, versioning, store tracks and build checklist |
| `device-test-checklist.md` | Owner-run Android release candidate checklist |
| `drafts/` | Committed unpublished release notes |
| `published/` | Permanent Markdown records for published releases |

## Project Documentation

The release workflow also uses the following project context:

- `docs/memory/architecture.md`
- `docs/memory/decisions.md`
- `docs/memory/open-items.md`
- `docs/memory/project.md`
- `docs/memory/README.md`
- `docs/memory/rules.md`
- `docs/memory/status.md`
- `docs/memory/working-style.md`
- `docs/memory/rules.md`
- `docs/PROGRESS.md`

## Release Lifecycle

Every release follows this lifecycle:

1. Discover the latest published GitHub Release.
2. Identify changes since the previous release.
3. Analyze commits, merged pull requests, and code changes.
4. Identify new features, improvements, bug fixes, and breaking changes.
5. Determine and justify the next semantic version.
6. Generate release notes.
7. Create or reuse `docs/releases/drafts/vX.Y.Z.md` and commit it with subject
   `docs: draft vX.Y.Z release notes`. Release content remains in Git, never
   in `/tmp`.
8. Obtain explicit approval.
9. Build the production Android AAB for Play and a separate Android APK using
   the `android-apk` profile for the GitHub release. iOS builds are for
   TestFlight/App Store only.
10. Download the APK artifact, name it exactly `WealthWise-android.apk`,
    and attach it to the GitHub release draft with `gh release upload`.
11. Add a Download block with the versioned asset link and SHA-256 to both the
    published Markdown and GitHub release body.
12. Keep the README Download section and latest release Download block
    identical. When a newer version is published, replace only the previous
    release's Download block with its versioned link.
13. Verify both latest and versioned APK links with `curl -I -L`; record the
    final HTTP status and `Content-Length`. Both must return HTTP 200 and the
    APK SHA-256 must match.
14. Update the root README Download section with latest version/date, a
    version-labelled latest link, SHA-256, the iOS availability message and
    the older-versions link.
15. Record the EAS build ID, Android `versionCode`, source commit, profile,
    date, status and exact artifact name in the `release-history.md` Builds
    table.
16. Confirm both links return HTTP 200, the APK SHA-256 matches, and the
    README, published Markdown, `release-history.md` and GitHub release assets
    agree. The release remains incomplete until all checks pass.
17. Publish the GitHub Release only after the checklist passes.
18. After verifying publication, move the draft into `published/`, commit the
    move, and update release history.

### Release process summary

The current release is v1.0.0; the previous version is the initial release.
Its APK is attached to the public GitHub release. P28-C-R3 verified HTTP 200
and `Content-Length: 112133413` for both latest and versioned download links,
confirmed the APK SHA-256, and matched it to EAS build
`7addde9a-34df-4f00-a54a-b695c1578859` (profile `preview`, app version
1.0.0, `versionCode` 1, source commit
`cac6fedc6242b495558f11cc6d7fe8551fd354ea`). The tag now points to that
source commit and is an ancestor of `origin/main`; the owner's GitHub
release-body edit remains pending. The production AAB has not been verified.
Record build evidence in
[`release-history.md`](./release-history.md); see
[`build-config.md`](./build-config.md).

## Use the Release Prompt

First, prepare the release:

```
Read docs/releases/RELEASE_PROMPT.md.
Discover all changes since the last published release. Analyze the codebase and merged PRs.
Recommend the next version, generate the release notes, and save the draft.

Do not publish anything. Wait for approval.
```

After reviewing and committing the draft:

```
I approve the proposed release.
Revalidate the target commit and release notes.
Publish the GitHub Release. Once publication is verified, move the draft into
`docs/releases/published/` and commit the move.
```

## Directory Structure

```text
releases/
├── drafts/
│   ├── .gitkeep
│   └── vX.Y.Z.md
├── published/
│   └── v1.0.0.md
├── README.md
├── RELEASE_PROMPT.md
├── TEMPLATE.md
├── build-config.md
├── release-config.md
└── release-history.md
```

## Important Rules

- Only verified and merged changes can be included.
- Unpublished functionality must not appear as completed functionality.
- Every release must follow Semantic Versioning.
- Breaking changes must be explicitly documented.
- Release publication requires approval.
- Anyone starting or continuing release work creates or reuses
  `docs/releases/drafts/vX.Y.Z.md` and commits it as
  `docs: draft vX.Y.Z release notes`. After publication is verified, move it
  into `published/` and commit the move. Never leave a published note in
  `drafts/` or a draft in `published/`.
- Every release must attach `WealthWise-android.apk`, include the Download
  block and SHA-256 in published Markdown and the GitHub release body, keep
  the README and latest published Download blocks identical, and record EAS
  build ID, Android `versionCode`, source commit and artifact name in the
  Builds table. Verify both latest and versioned links with `curl -I -L`;
  both must return HTTP 200 and the downloaded APK hash must match.
- A release is incomplete until both links return HTTP 200, the hash matches,
  and the README, published Markdown, release history and GitHub assets agree.
  When publishing a newer release, replace only the previous release's
  Download block with its versioned link.
- The production Android AAB is for Google Play; `android-apk` is for the
  GitHub download. iOS distribution is not currently offered.
- Never overwrite or remove published release records.
- All release-related documentation must remain inside `docs/releases/`.
- The shared worktree, phase, history and release-approval rules are in
  [`AGENTS.md`](../../AGENTS.md), [`memory/rules.md`](../memory/rules.md) and
  [`PROGRESS.md` section 3](../PROGRESS.md#3-standing-rules).
- Run the [Android device-test checklist](./device-test-checklist.md) on the
  release candidate before marking physical-device checks complete.
- The owner-run device checklist is
  [`device-test-checklist.md`](./device-test-checklist.md); build guidance is
  in [`build-config.md`](./build-config.md).

## Latest Release

Update this section after every successful publication.

- Current version: v1.0.0
- Previous version: Initial release
- Release date: 2026-11-07
- GitHub Release: [WealthWise v1.0.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0)
- Production builds: Not built

## Maintenance

Update this documentation whenever the release process, repository configuration, or release management policies change.