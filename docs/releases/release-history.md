# WealthWise release history

Only verified, published GitHub Releases appear in the Published Releases
table. Build records describe the artifact without exposing source identifiers
or checksums.

## Published releases

| Version | Date | Type | Android download | Release notes | Status |
|---|---|---|---|---|---|
| v1.2.0 | 2026-11-11 | Minor | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android-latest-v1.2.0.apk) | [v1.2.0 notes](./published/v1.2.0.md) | Published |
| v1.1.1 | 2026-11-09 | Patch | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.1.1/WealthWise-android-v1.1.1.apk) | [v1.1.1 notes](./published/v1.1.1.md) | Published |
| v1.1.0 | 2026-11-08 | Minor | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.1.0/WealthWise-android-v1.1.0.apk) | [v1.1.0 notes](./published/v1.1.0.md) | Published |
| v1.0.0 | 2026-11-07 | Initial | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.0.0/WealthWise-android-v1.0.0.apk) | [v1.0.0 notes](./published/v1.0.0.md) | Published |

More versions are listed on the [WealthWise releases page](https://github.com/sahilsheikh-dev/WealthWise/releases).

## Builds

| App version | Platform | EAS build ID | Profile | Android versionCode | Date | Status |
|---|---|---|---|---:|---|---|
| v1.2.0 | Android | `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` | android-apk | 3 | 2026-11-11 | Published; artifact verified against EAS (112,163,081 bytes) |
| v1.1.1 | Android | `ecc97480-7229-41ac-8aad-64ea2cd255b5` | android-apk | 2 | 2026-11-09 | Published; artifact verified against EAS |
| v1.1.0 | Android | `e45392bd-8146-4077-b76b-fe139993b141` | preview | 1 | 2026-11-08 | Published; artifact verified; owner-approved release exceptions |
| v1.0.0 | Android | `7addde9a-34df-4f00-a54a-b695c1578859` | preview | 1 | 2026-11-07 | Complete; artifact verified |

The v1.2.0 Android APK matched the EAS artifact and is published as
`WealthWise-android-latest-v1.2.0.apk`. Its latest and versioned URLs return
HTTP 200 with a content length of 112,163,081 bytes.

The v1.1.1 Android APK matched the owner-supplied EAS artifact and is published
as `WealthWise-android-v1.1.1.apk`. Its versioned URL returns HTTP 200 with a
content length of 112,150,605 bytes. The latest-named asset was renamed after
v1.2.0 publication.

The v1.1.0 Android APK matched the EAS artifact and is published as
`WealthWise-android-v1.1.0.apk`. Its versioned URL returns HTTP 200 with a
content length of 112,147,677 bytes. The former latest-named asset was
replaced after v1.1.1 publication. The owner explicitly approved using the
`preview` profile and reusing Android `versionCode` 1 for this release.

The v1.0.0 Android APK artifact was verified against its published download.
After v1.1.0 became latest, the v1.0.0 asset was renamed to
`WealthWise-android-v1.0.0.apk`, and its Download block was updated to the
matching versioned URL. That URL returns HTTP 200 with a content length of
112,133,413 bytes; the former generic v1.0.0 URL returns HTTP 404. Its digest
was checked privately and is not included in human-authored release material.

## Versioning

WealthWise follows Semantic Versioning:

- MAJOR: breaking or incompatible changes.
- MINOR: new backward-compatible features.
- PATCH: backward-compatible bug fixes and maintenance.

## Release record policy

- Keep published versions in reverse chronological order.
- Record only verified releases, their actual publication date, and release
  type.
- Link each Android APK through its versioned release asset and each note in
  `published/`.
- Name the latest **published** APK asset
  `WealthWise-android-latest-vX.Y.Z.apk`; a draft does not become latest
  until publication. Previous release notes say `Version`, use their own
  versioned APK filename and direct URL, and contain no `latest` wording.
  When a newer version is published, remove `latest` from the previous APK
  asset name, rename it to `WealthWise-android-vX.Y.Z.apk`, and update that
  release's Download block and table link.
- Keep screenshots named `WealthWise-vX.Y.Z-screenshot-<screen>.png` under
  `docs/releases/screenshots/vX.Y.Z/` alongside the published note, and
  reference those repository files in Markdown. Do not attach screenshots as
  GitHub Release assets; verify screenshot links after merge to `main`.
- Never fabricate release or build data or overwrite a published record.
- Keep unapproved notes in `drafts/`. After owner approval, finalize the note
  and move it to `published/` before GitHub Release draft creation. Add a
  release-history record only after successful publication.
- Verify the APK digest before publication, but never publish the digest.
- For the current latest APK URL and every affected versioned APK URL, use
  `curl -I -L`; require HTTP 200 and the expected artifact size. Record the
  status and size in the release verification record.
- GitHub may expose a platform-generated digest in asset metadata. This is
  controlled by GitHub; never copy it into human-authored release material.
