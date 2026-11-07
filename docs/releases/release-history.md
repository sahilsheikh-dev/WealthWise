# WealthWise – Release History

This document maintains the historical register of WealthWise releases.

Only successfully published GitHub Releases should be recorded here.

## 1. Published Releases

| Version | Release Date | Previous Version | Release Type | Status | GitHub Release |
|---|---|---|---|---|---|
| v1.0.0 | 2026-11-07 | Initial | Initial stable release | Published | [WealthWise v1.0.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0) |

## 2. Release Details

### v1.0.0

- Release notes: [v1.0.0.md](./published/v1.0.0.md)
- GitHub Release: [WealthWise v1.0.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0)
- Tag: `v1.0.0` (verified at `1c1426d03fadccc51278ed9af5426cacd4c9d7af`)
- Target commit: `1c1426d03fadccc51278ed9af5426cacd4c9d7af`

## 3. Draft Releases

Unpublished releases are stored in:

`docs/releases/drafts/`

Drafts must not be included in the published release history.

## 4. Versioning Policy

WealthWise follows Semantic Versioning:

- MAJOR: Breaking or incompatible changes.
- MINOR: New backward-compatible features.
- PATCH: Backward-compatible bug fixes and maintenance.

## 5. Historical Record Rules

1. Maintain reverse chronological order.
2. Record only verified published releases.
3. Include the actual publication date.
4. Include the actual previous stable version.
5. Link the actual GitHub Release.
6. Link the permanent Markdown release notes in `published/`.
7. Never overwrite historical entries.
8. Never fabricate release information.
9. Verify release tags against their actual target commits.
10. Keep every published version's Markdown record in `published/`; never
    leave published notes at the `docs/releases/` root or in `drafts/`.

## 6. Update Procedure

After every successful GitHub Release:

1. Verify GitHub publication.
2. Verify the release tag.
3. Verify the target commit.
4. Archive the final Markdown.
5. Add a row to the Published Releases table.
6. Update the release details.
7. Verify all links.