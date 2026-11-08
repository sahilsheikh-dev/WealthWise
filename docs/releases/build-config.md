# Build configuration

## EAS build profiles

`eas.json` defines the following profiles:

| Profile | Purpose | Configuration |
|---|---|---|
| `development` | Development-client builds for local development and device testing. | `developmentClient: true`; internal distribution. |
| `preview` | Internal QA builds before store submission. | Internal distribution. |
| `production` | Store-ready Android App Bundle (AAB) for Google Play and iOS build for TestFlight/App Store. | Automatic build-number increment enabled. |
| `android-apk` | Installable APK attached to the GitHub release as a direct Android download. | Extends `production`, sets Android `buildType: apk`; not submitted to a store. |

EAS uses `appVersionSource: remote`. The authoritative app build version is
maintained by EAS rather than committed to the repository. Production
auto-increment advances the platform build numbers for subsequent builds.

## Version identifiers

- The user-facing app version (`expo.version`) is `1.1.0` in `app.json`; it is
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

Create an Android APK for the GitHub download asset:

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
   exports do not replace device checks.
5. Confirm EAS signing credentials and store access without copying secrets
   into the repository.
6. Confirm the owner explicitly approved release publication and tagging.
7. Build the production Android AAB for Google Play and an `android-apk`
   artifact for the GitHub release; do not submit the APK to a store.

## Post-build record

Record each platform build in
[`release-history.md`](./release-history.md), including app version, platform,
platform build number, EAS build ID, profile, build date and status. Record
submission track, submission date and store status when submitted. Do not
infer a successful build or submission from a command being started.

Before publishing a GitHub release, download the `android-apk` EAS artifact,
rename it exactly `WealthWise-android.apk`, and attach it to the current
release with `gh release upload`. When a newer version is published, rename
the previous release asset to `WealthWise-android-vX.Y.Z.apk` and update its
historical Download link to that exact asset; never use `/latest/` for an old
version. Verify the latest link and every affected versioned link using
`curl -I -L`; all final responses must be HTTP 200. Record each final status
and `Content-Length`; require the expected artifact size. Verify APK digests
privately against the EAS artifact before publication, and never include them
in human-authored release material. GitHub may expose a platform-generated
asset digest that cannot be removed by editing the release. Keep the root
README Download block byte-identical to the latest published release Download
block. Update the README Download and
What's new sections and the releases-page link for every release. Record the
APK EAS build ID, `versionCode`, profile, date and status in the Builds table;
do not include source commits or digests. A release is incomplete until the
links return HTTP 200 with expected sizes and the README, published notes,
`release-history.md` and GitHub assets agree.
