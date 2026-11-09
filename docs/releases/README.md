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
3. Use every screenshot supplied for that release in its release notes and
   GitHub Release body. Name each asset
   `WealthWise-vX.Y.Z-screenshot-<screen>.png` and store it only on the
   matching GitHub Release; do not check screenshot files into the repository.
   The README Screenshots section contains only the latest published release's
   complete screenshot set and has no version title. If none are supplied,
   reuse the previous published release's complete image set and attach it
   under the new version's filenames. Render thumbnails 150 pixels wide in
   table rows with no more than four images per row, ordered Home, Assets,
   Liabilities, Emergency Fund, Goals, Insurance, Budget, Transactions;
   omit screens that are unavailable for that release.
4. After the owner approves the Markdown draft, finalize it with all release
   details and screenshots, move it to `docs/releases/published/`, and include
   the approved note in the release-work commit before creating the GitHub draft.
   Release notes and GitHub release bodies must not contain a Contributors
   section.
5. Commit the approved work on its task branch and merge it
   task -> phase -> `develop` through PRs. Run all six gates in order and
   complete the physical-device checklist. Never build from unmerged changes.
6. Once the approved code is merged to `develop`, create
   `release/vX.Y.Z` from that commit and create the GitHub Release draft at
   the release-branch commit. This draft may create the version tag; never
   retarget it. Attach every version screenshot under its required
   version-specific filename and use each absolute asset URL in the draft
   body. Verify the uploaded assets, then remove any local screenshot folder
   and confirm no `docs/releases/screenshots/` repository folder remains.
   Then run
   `eas build --platform android --profile android-apk`, wait for success,
   download the APK outside the repository, and upload it to the draft as
   `WealthWise-android-latest-vX.Y.Z.apk`. Do not wait for the owner to build
   or upload it manually.
7. Verify the uploaded artifact and release links. The latest **published**
   APK filename must be `WealthWise-android-latest-vX.Y.Z.apk`; the
   latest-route URL must use that exact filename. A draft is not yet latest.
   When publishing a newer
   version, remove `latest` from the previous filename and rename that asset
   to `WealthWise-android-vX.Y.Z.apk`; its historical link must point to that
   release and filename, never the latest route.
   Production Android AABs are for Google Play; APKs are for GitHub. iOS
   distribution is not currently offered.
8. Verify the APK digest privately against the uploaded artifact before
   publication. Never include it in human-authored release material. GitHub
   may expose a platform-generated asset digest that cannot be removed by
   editing the release.
9. Keep the README Download block byte-identical to the latest published
   release Download block. Older published notes use their versioned release
   URL and versioned asset filename. Update the README Download and What's new
   sections and its releases page link for every release.
10. Check the current `/latest/` URL and every affected version-specific URL
   with `curl -I -L`; each must return HTTP 200 and the expected artifact size.
   Record the observed status and size in the internal verification record.
11. Record the build ID, profile, Android `versionCode`, date and status in
   the Builds table using verified EAS build details. Do not list
   source commits or APK digests there.
12. After successful verification and separate publication approval, merge
    the release branch `--no-ff` into `main` and verify the tag target. Publish
    only after that integration. The finalized note is already in
    `published/`; update it only with owner-authorized final publication
    details. Never overwrite an existing published record.

## Release rules

- Include only verified, complete and merged functionality.
- Do not commit a release candidate before the owner approves its Markdown
  draft. After approval, merge the approved code through the required PR path
  before creating a GitHub Release draft.
- After approved release code is merged and the GitHub Release draft exists,
  build the APK from that merged source with EAS using the `android-apk`
  profile, then upload it to the draft. Do not wait for the owner to build or
  upload the APK. Verify the uploaded artifact before requesting separate
  publication approval.
- Follow Semantic Versioning and document confirmed breaking changes.
- Preserve published notes. When updating an existing note, change only its
  Download block; older releases use versioned links.
- Only the latest **published** release may use the expected download URL
  `https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android-latest-vX.Y.Z.apk`
  A draft does not change which release is latest. Only that release's
  Download block may say `Latest version` or use the latest route/filename;
  previous release notes say `Version`, use their own versioned APK
  URL/filename and contain no `latest` wording. On publication of a newer
  version, rename the previous APK to `WealthWise-android-vX.Y.Z.apk` and
  update its Download block and history link.
- Name screenshots `WealthWise-vX.Y.Z-screenshot-<screen>.png`, attach them
  only to the matching GitHub Release, and embed absolute asset URLs in
  release notes. Do not retain screenshots in `docs/releases/screenshots/`;
  verify the uploaded assets before removing any local screenshot folder.
- A release is incomplete until links, expected artifact size, notes, README,
  release history and GitHub assets agree.
- Never commit signing credentials, publish without approval, or rewrite
  history.

## Current release

- Latest published version: v1.1.0
- Release date: 2026-11-08
- GitHub release:
  [WealthWise v1.1.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.1.0)
- APK artifact verification: both URLs returned HTTP 200 with a content
  length of 112,147,677 bytes. The digest was verified privately and is not
  published.
- v1.1.1 is the approved release candidate and remains a GitHub draft. Its
  owner-supplied APK was verified against its finished EAS build and uploaded
  to the draft; publication and public latest-route rollover are still
  pending separate approval.
- Production AAB: not verified.

See [release-history.md](release-history.md) for the published release and
build records, and [build-config.md](build-config.md) for build guidance.
