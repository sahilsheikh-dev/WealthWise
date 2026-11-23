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
   GitHub Release body. Name each file
   `WealthWise-vX.Y.Z-screenshot-<screen>.png`, store it in
   `docs/releases/screenshots/vX.Y.Z/`, and commit it with the published
   release note. Do not attach screenshots as GitHub Release assets. In
   release notes, link each thumbnail to the absolute `blob/main` URL and load
   its image from the matching absolute `raw.githubusercontent.com/.../main/`
   URL; the README may use equivalent relative paths. The README Screenshots
   section contains only the latest published release's complete screenshot
   set and has no version title. If none are supplied, reuse the previous
   published release's complete image set under the new version's filenames.
   Render thumbnails 150 pixels wide in table rows with no more than four
   images per row, ordered Home, Assets, Liabilities, Emergency Fund, Goals,
   Insurance, Budget, Transactions; omit unavailable screens.
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
   retarget it. Use the published note's absolute repository screenshot links
   in the body and verify that each rendered image opens the expected
   repository file. Screenshots remain committed under
   `docs/releases/screenshots/vX.Y.Z/`; only the APK is uploaded as a release
   asset.
   Then run
   `eas build --platform android --profile android-apk`, wait for success,
   download the APK outside the repository, and upload it to the draft as
   `WealthWise-android-latest-vX.Y.Z.apk`. Do not wait for the owner to build
   or upload it manually, and do not ask the owner/developer to supply an APK
   or local APK path. The release agent owns the build, artifact download and
   draft upload.
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

## Device checklist release gate

A release must not be built, drafted, tagged or published while any row in ANY section of the device checklist (the Next release section and every earlier section) has a Result other than Pass. Not run, Fail and Blocked all block. Check the checklist first; if blocked, stop and report the blocking IDs, and do not start the build or the GitHub Release draft. A Pass may only be recorded from an owner-observed or owner-reported device result, never inferred from automated tests or Expo exports. Only an explicit written owner waiver for named IDs lifts the block; record the waiver in the ledger (Owner-run actions log) and in the release note, and leave the row's Result unchanged.

Maintenance rules: new device checks go under Next release device checks (or the decided version's section) with the next free ID, never into a published release's section, never renumbered. When the next version is decided, retitle that section `## vX.Y.Z device checks (next release)` and fill its App version. On publication, retitle it `## vX.Y.Z device checks`, set the published date, move it to the bottom of the version list (ascending order), and create a new empty `## Next release device checks` section at the top. Device-check results the owner reports are recorded under rule R8 (Owner-run actions log) with their evidence. When updating the device checklist, agents must prompt the owner to confirm all metadata fields before making changes: Device model, Android version, Tester (always record the tester username, e.g., sahilsheikh-dev), and verification Date, providing suggestions based on previous releases data (e.g., realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev). For any new feature, bug fix, behavior change, or revision that modifies user-facing behavior, data integrity, calculations, navigation, or forms, agents must add the corresponding physical-device verification check(s) to the device checklist under Next release device checks with the next free sequential ID (`O<n>`) in `Not run` status, and record the check ID in `docs/PROGRESS.md`, `status.md`, and `open-items.md`. Once a release is published, move all checks verified for that specific version into its own `## vX.Y.Z device checks` section placed below previous release checks in ascending version order, keeping each specific version's checks strictly under its own release section, while `## Next release device checks` retains only unreleased checks for the next version. Agents must never add, bump, or assign a specific application version number in the device checklist, metadata tables, package manifests, or anywhere in the repository until the owner explicitly decides to prepare a release candidate draft; until a release draft is finalized, keep the version unassigned (TBD / Next release).

## Release rules

- Include only verified, complete and merged functionality.
- Do not commit a release candidate before the owner approves its Markdown
  draft. After approval, merge the approved code through the required PR path
  before creating a GitHub Release draft.
- After approved release code is merged and the GitHub Release draft exists,
  build the APK from that merged source with EAS using the `android-apk`
  profile, then upload it to the draft. Do not wait for the owner to build or
  upload the APK, and do not ask the owner/developer to provide an APK or
  local APK path. The release agent must build, download and upload the
  artifact, then verify it before requesting separate publication approval.
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
- Store screenshots named `WealthWise-vX.Y.Z-screenshot-<screen>.png` under
  `docs/releases/screenshots/vX.Y.Z/` with the published note. Do not attach
  screenshots as GitHub Release assets. Link release-note thumbnails to
  absolute `blob/main` URLs and load images from matching
  `raw.githubusercontent.com/.../main/` URLs; README may use relative paths.
  Verify the rendered links and repository files after merge to `main`.
- A release is incomplete until links, expected artifact size, notes, README,
  release history and GitHub assets agree.
- Never commit signing credentials, publish without approval, or rewrite
  history.

## Current release

- Latest published version: v1.2.0
- Release date: 2026-11-11
- GitHub release:
  [WealthWise v1.2.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.2.0)
- APK artifact verification: latest and versioned URLs returned HTTP 200 with
  a content length of 112,163,081 bytes; the artifact was byte-verified
  against EAS privately.
- v1.2.0 was published after release PR #124 merged
  `release/v1.2.0` into `main` at `2e419f8`; tag `v1.2.0` points to the exact
  built candidate `199ebed307ce7755bc92c1f15544999d852db54f`. Release-sync PR
  #123 merged the final build record into the release branch at `0c8b380`.
  The final six gates passed on integrated `develop` commit `3bd5be6`; the
  documentation-only follow-up is integrated at `cd1fa78`. EAS build
  `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` completed with profile `android-apk`
  and Android `versionCode` 3. All 104 rendered screenshot links returned
  HTTP 200, with all 52 raw image sizes matching repository files. The latest
  and four versioned APK URLs returned HTTP 200 at their expected sizes.
- Historical release screenshot sections were updated without changing other
  release-body content. The former v1.1.1 latest-named APK was renamed to
  `WealthWise-android-v1.1.1.apk`; its GitHub Download block now uses
  `Version`. Post-publication task PRs #125/#126 merged into
  `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at
  `87c8e8f`/`9db08be`; phase PR #127 merged into
  `develop` at `d65ce75`; develop-to-main PR #128 merged at `48a64c0`; and
  main-to-develop PR #129 merged at `c554c0b`. Final ledger/test evidence was
  then synchronized by task PR #130 (`202dabe`), phase PR #131 (`6f4f4df`),
  develop-to-main PR #132 (`b678493`) and main-to-develop PR #133 (`eedff48`).
  The `main` and `develop` trees match, and the v1.2.0 tag remains at its
  verified build candidate.
- v1.3.0 release: EAS build `c2ec9414-ae63-44cc-b34a-0f67f6cb51cb`
  completed with profile `android-apk` and Android `versionCode` 4 on
  2026-11-22. The 107,030,213-byte APK was uploaded to the GitHub release
  and byte-verified against EAS. Publication completed; release/v1.3.0 merged
  to main via PR #216 (341dbcb), tagged v1.3.0, and back-merged to develop via
  PR #217 (97c6d02).
- O45-O53 are owner-reported Pass; device model, Android version and tester
  details were not supplied.
- Production AAB: not verified.

See [release-history.md](release-history.md) for the published release and
build records, and [build-config.md](build-config.md) for build guidance.
