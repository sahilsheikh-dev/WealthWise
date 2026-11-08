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
- 2026-11-08 verification: `git ls-remote --tags origin` returned
  `v1.0.0`; `git merge-base --is-ancestor v1.0.0 origin/main` exited 1.
  The tag is not an ancestor of the current `origin/main` and was not moved
  or deleted.

## 3. Builds

| Version | Platform | Build number / versionCode | EAS build ID | Source commit | Artifact name / size | SHA-256 | Download link status | Profile | Date | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| v1.0.0 | Android APK (app version 1.0.0) | 1 | `7addde9a-34df-4f00-a54a-b695c1578859` | `cac6fedc6242b495558f11cc6d7fe8551fd354ea` | `WealthWise-android.apk` / 112,133,413 bytes (~106.9 MiB) | `ddaac3222cd4069d1c2121b3fcb9410724b9ee23649ddcc2603cd7c90a796af3` | `curl -I -L`: latest HTTP 200, Content-Length 112133413; versioned HTTP 200, Content-Length 112133413; downloaded APK SHA-256 matches | preview | 2026-11-07 (completed 14:52 UTC) | EAS build finished; its artifact SHA-256 and size match the GitHub APK exactly. Owner release-body edit remains pending |

## 4. Draft Releases

Unpublished releases are stored in:

`docs/releases/drafts/`

Drafts must not be included in the published release history.

## 5. Versioning Policy

WealthWise follows Semantic Versioning:

- MAJOR: Breaking or incompatible changes.
- MINOR: New backward-compatible features.
- PATCH: Backward-compatible bug fixes and maintenance.

## 6. Historical Record Rules

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

## 7. Update Procedure

After every successful GitHub Release:

1. Verify GitHub publication.
2. Verify the release tag.
3. Verify the target commit.
4. Archive the final Markdown.
5. Add a row to the Published Releases table.
6. Update the release details.
7. Verify all links.