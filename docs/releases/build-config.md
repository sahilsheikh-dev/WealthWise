# Build configuration

## EAS build profiles

`eas.json` defines the following profiles:

| Profile | Purpose | Configuration |
|---|---|---|
| `development` | Development-client builds for local development and device testing. | `developmentClient: true`; internal distribution. |
| `preview` | Internal QA builds before store submission. | Internal distribution. |
| `production` | Store-ready release builds. | Automatic build-number increment enabled. |

EAS uses `appVersionSource: remote`. The authoritative app build version is
maintained by EAS rather than committed to the repository. Production
auto-increment advances the platform build numbers for subsequent builds.

## Version identifiers

- The user-facing app version (`expo.version`) is `1.0.0` in `app.json`; it is
  aligned with the `package.json` and `package-lock.json` root versions.
- The iOS `buildNumber` is a platform-specific build identifier. EAS manages
  its value remotely under the configured remote app-version source.
- The Android `versionCode` is a monotonically increasing integer build
  identifier, also managed remotely by EAS.
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

Signing credentials are managed by EAS. Do not commit credentials, private
keys, provisioning profiles, tokens, or other secrets to the repository.

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
4. Complete and record the iOS and Android physical-device pass for the
   release candidate.
5. Confirm EAS signing credentials and store access without copying secrets
   into the repository.
6. Confirm the owner explicitly approved release publication and tagging.

## Post-build record

Record each platform build in
[`release-history.md`](./release-history.md), including app version, platform,
platform build number, EAS build ID, profile, build date and status. Record
submission track, submission date and store status when submitted. Do not
infer a successful build or submission from a command being started.
