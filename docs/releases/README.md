# WealthWise release management

This directory contains release policy, build guidance, drafts, published
notes and the verified release register.

## Documentation

| File | Purpose |
|---|---|
| [RELEASE_PROMPT.md](RELEASE_PROMPT.md) | Reusable release discovery and verification workflow |
| [TEMPLATE.md](TEMPLATE.md) | Release-note template |
| [release-config.md](release-config.md) | Repository release policy |
| [release-history.md](release-history.md) | Published releases and build records |
| [build-config.md](build-config.md) | EAS profiles and pre/post-build gates |
| [device-test-checklist.md](device-test-checklist.md) | Owner-run Android device checks |
| [drafts/](drafts/) | Committed unpublished notes |
| [published/](published/) | Permanent notes for published releases |

The shared project rules are in [AGENTS.md](../../AGENTS.md),
[memory/rules.md](../memory/rules.md) and
[PROGRESS.md section 3](../PROGRESS.md#3-standing-rules).

## Release lifecycle

1. Discover the latest published GitHub Release and the previous stable
   version. Analyze the actual merged changes and verify their implementation.
2. Create `release/vX.Y.Z` from `develop`. Recommend a semantic version and
   obtain approval before publication or tag creation.
3. Create or reuse `docs/releases/drafts/vX.Y.Z.md` and commit the draft in
   Git. Never stage release content in a temporary directory.
4. Run all six gates in order and complete the physical-device checklist.
   Expo exports are allowed; EAS and Gradle builds are only run when separately
   authorized.
5. After build approval, attach the Android APK as exactly
   `WealthWise-android.apk`. Production Android AABs are for Google Play; APKs
   are for GitHub. iOS distribution is not currently offered.
6. Verify the APK digest privately against the artifact before publication.
   Never publish the digest in the README, release notes, GitHub body or
   release history.
7. Keep the README Download block byte-identical to the latest published
   release Download block. Older published notes use their versioned asset
   link. Update the README Download and What's new sections and its releases
   page link for every release.
8. Check both latest and versioned download URLs with `curl -I -L`; both must
   return HTTP 200 and the expected artifact size. Record the observed status
   and size in the internal verification record.
9. Record the EAS build ID, profile, Android `versionCode`, date and status in
   the Builds table. Do not list source commits or APK digests there.
10. Publish only after explicit approval and successful verification. Move
    the draft to `published/` after publication is confirmed and commit the
    move. Never overwrite an existing published record.

## Release rules

- Include only verified, complete and merged functionality.
- Follow Semantic Versioning and document confirmed breaking changes.
- Preserve published notes. When updating an existing note, change only its
  Download block; older releases use versioned links.
- The expected download URL is
  `https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android.apk`
  for the latest release and
  `https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android.apk`
  for a versioned release.
- A release is incomplete until links, expected artifact size, notes, README,
  release history and GitHub assets agree.
- Never commit signing credentials, publish without approval, or rewrite
  history.

## Current release

- Current published version: v1.1.0
- Release date: 2026-11-08
- GitHub release:
  [WealthWise v1.1.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.1.0)
- APK artifact verification: both URLs returned HTTP 200 with a content
  length of 112,147,677 bytes. The digest was verified privately and is not
  published.
- Production AAB: not verified.

See [release-history.md](release-history.md) for the published release and
build records, and [build-config.md](build-config.md) for build guidance.
