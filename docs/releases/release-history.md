# WealthWise release history

Only verified, published GitHub Releases appear in the Published Releases
table. Build records describe the artifact without exposing source identifiers
or checksums.

## Published releases

| Version | Date | Type | Android download | Release notes | Status |
|---|---|---|---|---|---|
| v1.1.0 | 2026-11-08 | Minor | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.1.0/WealthWise-android.apk) | [v1.1.0 notes](./published/v1.1.0.md) | Published |
| v1.0.0 | 2026-11-07 | Initial stable | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.0.0/WealthWise-android-v1.0.0.apk) | [v1.0.0 notes](./published/v1.0.0.md) | Published |

More versions are listed on the [WealthWise releases page](https://github.com/sahilsheikh-dev/WealthWise/releases).

## Builds

| EAS build ID | Profile | Android versionCode | Date | Status |
|---|---|---:|---|---|
| `e45392bd-8146-4077-b76b-fe139993b141` | preview | 1 | 2026-11-08 | Published; artifact verified; owner-approved release exceptions |
| `7addde9a-34df-4f00-a54a-b695c1578859` | preview | 1 | 2026-11-07 | Complete; artifact verified |

The v1.1.0 Android APK matched the EAS artifact and published asset. Its
versioned release URL and the current latest URL returned HTTP 200 with a
content length of 112,147,677 bytes. The owner explicitly approved using the
`preview` profile and reusing Android `versionCode` 1 for this release. The
artifact digest was checked privately and is not included in human-authored
release material.

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
- The current/latest APK asset uses `WealthWise-android.apk`; when it becomes
  an older release, rename it `WealthWise-android-vX.Y.Z.apk` and update its
  Download block and table link to the matching asset URL.
- Never fabricate release or build data or overwrite a published record.
- Keep unpublished notes in `drafts/`; move notes to `published/` only after
  verifying successful publication.
- Verify the APK digest before publication, but never publish the digest.
- For the current latest APK URL and every affected versioned APK URL, use
  `curl -I -L`; require HTTP 200 and the expected artifact size. Record the
  status and size in the release verification record.
- GitHub may expose a platform-generated digest in asset metadata. This is
  controlled by GitHub; never copy it into human-authored release material.
