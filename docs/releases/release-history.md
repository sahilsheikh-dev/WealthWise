# WealthWise release history

Only verified, published GitHub Releases appear in the Published Releases
table. Build records describe the artifact without exposing source identifiers
or checksums.

## Published releases

| Version | Date | Type | Android download | Release notes | Status |
|---|---|---|---|---|---|
| v1.0.0 | 2026-11-07 | Initial stable | [APK](https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.0.0/WealthWise-android.apk) | [v1.0.0 notes](./published/v1.0.0.md) | Published |

More versions are listed on the [WealthWise releases page](https://github.com/sahilsheikh-dev/WealthWise/releases).

## Builds

| EAS build ID | Profile | Android versionCode | Date | Status |
|---|---|---:|---|---|
| `7addde9a-34df-4f00-a54a-b695c1578859` | preview | 1 | 2026-11-07 | Complete; artifact verified |

The v1.0.0 Android APK artifact was verified against the published download.
Both latest and versioned links returned HTTP 200 with a content length of
112,133,413 bytes. The artifact digest was checked privately and is not
published.

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
- Never fabricate release or build data or overwrite a published record.
- Keep unpublished notes in `drafts/`; move notes to `published/` only after
  verifying successful publication.
- Verify the APK digest before publication, but never publish the digest.
- For both latest and versioned APK URLs, use `curl -I -L`; require HTTP 200
  and the expected artifact size. Record the status and size in the release
  verification record.
