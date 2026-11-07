# WealthWise – Release Management

## Overview

This directory contains the official release management documentation for WealthWise.

It maintains release configurations, version history, published release notes,
unpublished drafts, and the reusable AI-powered GitHub release workflow.

## Documentation Index

| File | Description |
|---|---|
| `RELEASE_PROMPT.md` | Master reusable prompt for automated release discovery, analysis, and publication |
| `release-config.md` | Repository configuration and release policies |
| `release-history.md` | Historical register of published releases |
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
9. Publish the GitHub Release.
10. Move the published notes into `published/` and update release history.

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
├── published/
│   └── v1.0.0.md
├── README.md
├── RELEASE_PROMPT.md
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
- Never overwrite or remove published release records.
- All release-related documentation must remain inside `docs/releases/`.

## Latest Release

Update this section after every successful publication.

- Current version: v1.0.0
- Previous version: Initial release
- Release date: 2026-11-07
- GitHub Release: [WealthWise v1.0.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0)

## Maintenance

Update this documentation whenever the release process, repository configuration, or release management policies change.