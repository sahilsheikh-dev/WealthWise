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
2. Create or reuse `docs/releases/drafts/vX.Y.Z.md`, prepare the candidate
   code and release notes, and ask the owner to approve the Markdown draft.
   Do not commit the release candidate before this approval.
3. After approval, commit the approved work on its task branch and merge it
   task -> phase -> `develop` through PRs. Run all six gates in order and
   complete the physical-device checklist. Never build from unmerged changes.
4. Once the approved code is merged to `develop`, create
   `release/vX.Y.Z` from that commit and create the GitHub Release draft at
   the release-branch commit. This draft may create the version tag; never
   retarget it. Attach the matching screenshot asset and use its absolute URL
   in the draft body, then notify the owner. The owner builds the application
   from that merged source and uploads the APK to the GitHub draft; agents do
   not build or upload the APK. The owner confirms when upload is complete.
5. After confirmation, verify the uploaded artifact and release links. The
   current APK filename must be `WealthWise-android-latest-vX.Y.Z.apk`; the
   latest-route URL must use that exact filename. When publishing a newer
   version, remove `latest` from the previous filename and rename that asset
   to `WealthWise-android-vX.Y.Z.apk`; its historical link must point to that
   release and filename, never the latest route.
   Production Android AABs are for Google Play; APKs are for GitHub. iOS
   distribution is not currently offered.
6. Verify the APK digest privately against the uploaded artifact before
   publication. Never include it in human-authored release material. GitHub
   may expose a platform-generated asset digest that cannot be removed by
   editing the release.
7. Keep the README Download block byte-identical to the latest published
   release Download block. Older published notes use their versioned release
   URL and versioned asset filename. Update the README Download and What's new
   sections and its releases page link for every release.
8. Check the current `/latest/` URL and every affected version-specific URL
   with `curl -I -L`; each must return HTTP 200 and the expected artifact size.
   Record the observed status and size in the internal verification record.
9. Record the build ID, profile, Android `versionCode`, date and status in
   the Builds table using verified owner-supplied build details. Do not list
   source commits or APK digests there.
10. After successful verification and separate publication approval, merge
    the release branch `--no-ff` into `main` and verify the tag target. Publish
    only after that integration. Move
    the draft to `published/` after publication is confirmed and commit the
    move. Never overwrite an existing published record.

## Release rules

- Include only verified, complete and merged functionality.
- Do not commit a release candidate before the owner approves its Markdown
  draft. After approval, merge the approved code through the required PR path
  before creating a GitHub Release draft.
- The owner performs the app build from the merged source and uploads the APK
  to the GitHub Release draft. Wait for the owner's confirmation before
  artifact verification or publication.
- Follow Semantic Versioning and document confirmed breaking changes.
- Preserve published notes. When updating an existing note, change only its
  Download block; older releases use versioned links.
- The expected download URL is
  `https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android-latest-vX.Y.Z.apk`
  for the latest release. Its asset filename includes both `latest` and the
  version. When superseded, remove `latest` from the old asset filename,
  rename it to `WealthWise-android-vX.Y.Z.apk`, and use
  `https://github.com/sahilsheikh-dev/WealthWise/releases/download/vX.Y.Z/WealthWise-android-vX.Y.Z.apk`.
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
