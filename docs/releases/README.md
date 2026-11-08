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
10. Download the APK artifact, rename it exactly `WealthWise-android.apk`,
    and attach it to the GitHub release draft with `gh release upload`.
11. Verify the Android asset with `curl -I -L`; confirm and record the 302
    redirect and final 200 response.
12. Update the root README Download section with the latest version/date,
    working Android asset URL, owner-supplied iOS URL, installation notes and
    unchanged Old versions link.
13. Record the APK EAS build ID, Android build number/versionCode, profile,
    date, status and exact artifact name in `release-history.md`.
14. Confirm README, `release-history.md` and the GitHub release assets agree,
    then publish the GitHub Release.
15. Move the published notes into `published/` and update release history.

### Release process summary

The current release is v1.0.0; the previous version is the initial release.
The GitHub release and tag exist, but no production EAS build has been
created. Run the pre-build checklist in [`build-config.md`](./build-config.md),
record each platform build and submission result in
[`release-history.md`](./release-history.md), and wait for explicit owner
approval before publishing or tagging.

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
- Before publishing, attach the Android APK as `WealthWise-android.apk`,
  verify the release download route with `curl -I -L` (302 then 200), update
  the README Download section, and record its EAS build ID, versionCode and
  artifact name. The README, release history and GitHub assets must agree.
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