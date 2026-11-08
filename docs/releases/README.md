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
| `drafts/` | Temporary storage for unpublished release notes |
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
7. Save the unpublished draft.
8. Obtain explicit approval.
9. Build the production Android AAB for Play and a separate Android APK using
   the `android-apk` profile for the GitHub release. iOS builds are for
   TestFlight/App Store only.
10. Download the APK artifact, name it exactly `WealthWise-android.apk`,
    and attach it to the GitHub release draft with `gh release upload`.
11. Add a Download block with the versioned asset link and SHA-256 to both the
    published Markdown and GitHub release body.
12. Verify both latest and versioned APK links with `curl -I` and
    `curl -I -L`; record the observed status for each.
13. Update the root README Download section with latest version/date, a
    version-labelled latest link, SHA-256, the iOS availability message and
    the older-versions link.
14. Record the EAS build ID, Android `versionCode`, source commit, profile,
    date, status and exact artifact name in the `release-history.md` Builds
    table.
15. Confirm README, published Markdown, `release-history.md` and GitHub
    release assets agree, then publish the GitHub Release. A release remains
    incomplete until all four agree.
16. Move the published notes into `published/` and update release history.

### Release process summary

The current release is v1.0.0; the previous version is the initial release.
Its APK asset is attached to the GitHub release, but its EAS build metadata
remains owner to supply. The repository is private, so unauthenticated public
download URLs currently return HTTP 404. The production AAB and iOS build have
not been verified. Run the pre-build checklist in [`build-config.md`](./build-config.md),
record each platform build and submission result in
[`release-history.md`](./release-history.md), and wait for explicit owner
approval before changing visibility, publishing or tagging.

## Use the Release Prompt

First, prepare the release:

```
Read docs/releases/RELEASE_PROMPT.md.
Discover all changes since the last published release. Analyze the codebase and merged PRs.
Recommend the next version, generate the release notes, and save the draft.

Do not publish anything. Wait for approval.
```

After reviewing the draft:

```
I approve the proposed release.
Revalidate the target commit and release notes.
Publish the GitHub Release and update the permanent release documentation.
```

## Directory Structure

```text
releases/
├── drafts/
│   └── .gitkeep
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
- Draft notes belong in `drafts/`; every published release note belongs in
  `published/`.
- After publication is verified, move the draft Markdown into `published/`;
  do not leave a second copy in `drafts/` or at the `docs/releases/` root.
- Every release must attach `WealthWise-android.apk`, include a versioned
  Download block with SHA-256 in its published Markdown and GitHub release
  body, update the README Download section, verify both latest and versioned
  links with `curl -I` and `curl -I -L`, and record EAS build ID, Android
  `versionCode`, source commit and artifact name in the Builds table.
- A release is incomplete until the README, published Markdown, release
  history and GitHub assets agree. Old published notes may receive only their
  own versioned Download block; do not otherwise rewrite them.
- The production Android AAB is for Google Play; `android-apk` is for the
  GitHub download. iOS builds are distributed through TestFlight/App Store.
- Never overwrite or remove published release records.
- All release-related documentation must remain inside `docs/releases/`.
- The shared worktree, phase, history and release-approval rules are in
  [`AGENTS.md`](../../AGENTS.md), [`memory/rules.md`](../memory/rules.md) and
  [`PROGRESS.md` section 3](../PROGRESS.md#3-standing-rules).

## Latest Release

Update this section after every successful publication.

- Current version: v1.0.0
- Previous version: Initial release
- Release date: 2026-11-07
- GitHub Release: [WealthWise v1.0.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0)
- Production builds: Not built

## Maintenance

Update this documentation whenever the release process, repository configuration, or release management policies change.