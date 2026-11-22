# Build configuration

## EAS build profiles

`eas.json` defines the following profiles:

| Profile | Purpose | Configuration |
|---|---|---|
| `development` | Development-client builds for local development and device testing. | `developmentClient: true`; internal distribution. |
| `preview` | Internal QA builds before store submission. Used for historical v1.0.0 and v1.1.0 preview build APK releases. | Internal distribution. |
| `production` | Store-ready Android App Bundle (AAB) for Google Play and iOS build for TestFlight/App Store. | Automatic build-number increment enabled. |
| `android-apk` | Installable APK attached to the GitHub release as a direct Android download. Used starting with v1.1.1. | Extends `production`, sets Android `buildType: apk`; not submitted to a store. |

EAS uses `appVersionSource: remote`. The authoritative app build version is
maintained by EAS rather than committed to the repository. Production
auto-increment advances the platform build numbers for subsequent builds.

## Version identifiers

- The user-facing app version (`expo.version`) is `1.3.0` in `app.json`; it is
  aligned with the `package.json` and `package-lock.json` root versions.
- The iOS `buildNumber` is a platform-specific build identifier. EAS manages
  its value remotely under the configured remote app-version source.
- The Android `versionCode` is a monotonically increasing integer build
  identifier, also managed remotely by EAS.
- `production` and `android-apk` are separate builds. Because each profile
  uses remote automatic incrementing, the APK's Android `versionCode` will
  differ from the AAB's `versionCode`.
- App version identifies the release; build numbers distinguish builds of
  that release. A new build may retain the same app version while receiving
  higher platform build numbers.

## Application identifiers

The application identifiers are configured in `app.json`:

| Platform | Identifier |
|---|---|
| iOS bundle identifier | `com.begawo.WealthWise` |
| Android package | `com.begawo.WealthWise` |

## Credentials and secrets

Android and iOS signing credentials are managed by EAS. Do not commit
credentials, private keys, provisioning profiles, tokens, or other secrets to
the repository. The Play Store signs/distributes its store build; direct APK
downloads are not Play Store-signed. iOS builds are distributed only through
TestFlight or the App Store.

## Store tracks

- iOS QA and release distribution use TestFlight and its internal testing
  group before App Store release.
- Google Play distribution progresses through internal testing, closed
  testing, and production as approved.
- Select the intended store track during submission; a production build does
  not itself publish an app to a store.

## Build and submit

Create production builds for both platforms:

```bash
eas build --platform all --profile production
```

After the owner approves the Markdown release draft, the approved code is
merged to `develop`, and the GitHub Release draft exists, the release agent
builds the Android APK from the release branch and uploads it to that draft.
Do not wait for the owner to build or upload the APK. The EAS build must use
the configured `android-apk` profile. Do not ask the owner/developer to
provide an APK or local APK path; the release agent downloads the EAS artifact
outside the repository and uploads it to the GitHub Release draft:

```bash
eas build --platform android --profile android-apk
```

Submit builds to the configured stores after review and explicit release
approval:

```bash
eas submit
```

Builds cannot be rolled back once distributed. To correct a released build,
prepare and ship a higher build number (and a higher app version when the
change warrants a new release).

## Pre-build checklist

Before creating a release build:

1. Run all six repository gates, in order, and require exit code 0:
   `npm test -- --coverage`, `npx tsc --noEmit`, `npx expo lint`,
   `npx expo-doctor`, `npx expo export --platform android`, and
   `npx expo export --platform ios`.
2. Confirm the intended source commit, release notes, app version and
   production EAS profile.
3. Export a fresh app backup and verify that it can be restored.
4. Run and record the Android physical-device
   [release checklist](./device-test-checklist.md). Automated tests and Expo
   exports do not replace device checks. A release must not be built, drafted, tagged or published while any row in ANY section of the device checklist (the Next release section and every earlier section) has a Result other than Pass. Not run, Fail and Blocked all block. Check the checklist first; if blocked, stop and report the blocking IDs, and do not start the build or the GitHub Release draft. A Pass may only be recorded from an owner-observed or owner-reported device result, never inferred from automated tests or Expo exports. Only an explicit written owner waiver for named IDs lifts the block; record the waiver in the ledger (Owner-run actions log) and in the release note, and leave the row's Result unchanged.

   Maintenance rules: new device checks go under Next release device checks (or the decided version's section) with the next free ID, never into a published release's section, never renumbered. When the next version is decided, retitle that section `## vX.Y.Z device checks (next release)` and fill its App version. On publication, retitle it `## vX.Y.Z device checks`, set the published date, move it to the bottom of the version list (ascending order), and create a new empty `## Next release device checks` section at the top. Device-check results the owner reports are recorded under rule R8 (Owner-run actions log) with their evidence. When updating the device checklist, agents must prompt the owner to confirm all metadata fields before making changes: Device model, Android version, Tester (always record the tester username, e.g., sahilsheikh-dev), and verification Date, providing suggestions based on previous releases data (e.g., realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev). For any new feature, bug fix, behavior change, or revision that modifies user-facing behavior, data integrity, calculations, navigation, or forms, agents must add the corresponding physical-device verification check(s) to the device checklist under Next release device checks with the next free sequential ID (`O<n>`) in `Not run` status, and record the check ID in `docs/PROGRESS.md`, `status.md`, and `open-items.md`. Once a release is published, move all checks verified for that specific version into its own `## vX.Y.Z device checks` section placed below previous release checks in ascending version order, keeping each specific version's checks strictly under its own release section, while `## Next release device checks` retains only unreleased checks for the next version.
5. Confirm EAS signing credentials and store access without copying secrets
   into the repository.
6. Confirm the owner approved the Markdown release draft. Finalize all
   release details and screenshots, move the note to `published/vX.Y.Z.md`,
   then commit the approved note with the release changes and merge through
   task -> phase -> `develop`.
7. After merge to `develop`, create `release/vX.Y.Z` from that source and
   create the GitHub Release draft at the release-branch commit. Use every
   supplied screenshot committed under `docs/releases/screenshots/vX.Y.Z/`
   in the published note and draft body. Link each thumbnail to its absolute
   `blob/main` URL and load the image from its matching absolute
   `raw.githubusercontent.com/.../main/` URL. Do not attach screenshots as
   GitHub Release assets; only the APK is uploaded.
   Then run `eas build --platform android --profile android-apk` from the
   release branch, wait for a successful build, download the APK outside the
   repository, and upload it to the draft as
   `WealthWise-android-latest-vX.Y.Z.apk`.
8. Privately verify the uploaded APK against the EAS build artifact, record
   its verified build details, verify each screenshot URL after merge to
   `main`, and finish the post-build checks. Obtain
   explicit publication approval, merge the release branch `--no-ff` into
   `main`, and verify the tag target before publishing.
9. Production Android AABs for Google Play are separate owner-authorized
   store builds; do not submit the GitHub APK to a store.

## Post-build record

Record each platform build in
[`release-history.md`](./release-history.md), including app version, platform,
platform build number, EAS build ID, profile, build date and status. Record
submission track, submission date and store status when submitted. Do not
infer a successful build or submission from a command being started.

After GitHub draft creation, build the APK with the configured EAS profile
and upload it as `WealthWise-android-latest-vX.Y.Z.apk`. This filename and
the `/latest/` route are for the latest **published** release only; a draft
does not become latest until publication. Previous release notes say
`Version`, use only their own versioned APK filenames and direct URLs, and
must not contain `latest` wording or routes. When a newer version is
published, remove `latest` from the previous release asset name, rename it to
`WealthWise-android-vX.Y.Z.apk`, and update its historical Download link to
that exact asset. Verify the latest link and every affected versioned link
using `curl -I -L`; all final responses must be HTTP 200. Record each final
status and `Content-Length`; require the expected artifact size. Verify APK
digests privately against the EAS build artifact, and never include them in
human-authored release material. GitHub may expose a platform-generated
asset digest that cannot be removed by editing the release. Keep the root
README Download block byte-identical to the latest published release Download
block. Update the README Download and What's new sections and the releases-page
link for every release. Record the APK EAS build ID, `versionCode`, profile,
date and status in the Builds table; do not include source commits or digests.
A release is incomplete until the links return HTTP 200 with expected sizes
and the README, published notes, `release-history.md` and GitHub assets agree.
