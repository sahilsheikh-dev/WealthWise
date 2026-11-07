# P28-A Release Preparation Report

## Scope

Report-only release inventory. No application source, protected
`app/(tabs)/index.tsx`, or protected `app/(tabs)/budget.tsx` behavior was
changed. The protected route hashes were:

- Home: `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`
- Budget: `7beea9dd1ee7a3f46d95b8dbc13009b90b184dec`

## a) Release readiness

| Item | Current value | Readiness / mismatch |
|---|---|---|
| `app.json` name | `WealthWise` | Confirmed |
| `app.json` slug | `WealthWise` | Confirmed; matches the app display name field |
| `app.json` version | `0.1.0` | Matches package and lock root; changelog has no matching released `0.1.0` heading |
| Android package | `com.begawo.WealthWise` | Confirmed in app config |
| iOS bundle identifier | `com.begawo.WealthWise` | Confirmed in app config |
| Icon | `assets/images/icon.png` | Referenced; file presence should be retained |
| Splash | `splash-icon.png` plus light/dark variants | Referenced; behavior/config unconfirmed visually |
| Android permissions | `USE_BIOMETRIC`, `USE_FINGERPRINT` | Explicit manifest request; app lock is the evidenced use |
| Android adaptive icon | foreground, background and monochrome assets | Referenced assets; physical visual verification remains open |
| Plugins | Router, splash, build properties, date picker, sharing, notifications, secure store, local auth and SQLite | Confirmed; notifications add their own Android permission at build/runtime as applicable |
| `newArchEnabled` | Not explicitly set | Expo defaults the setting; no explicit release value is declared or mismatched |
| `eas.json` development | Development client, internal distribution | Confirmed |
| `eas.json` preview | Internal distribution | Confirmed |
| `eas.json` production | Remote app version, automatic increment | Confirmed and intentional |
| `eas.json` submit | Empty production submit profile | Confirmed but owner credentials/metadata are unconfirmed |
| Package version | `0.1.0` | Matches app and lockfile root |
| Lockfile root version | `0.1.0` (`packages[""]`) | Matches package and app |
| CHANGELOG | `[Unreleased]`, no released version heading | A release summary covering Phases 24–29 is missing |
| README | Offline-first, local SQLite/AsyncStorage, no runtime cloud requests | Source-backed by grep; large stale old audit counts remain |
| README stale audit claim | Says 27 production and 55 total advisories | Must be corrected to the current audit result |
| License | MIT; holder `Sahil Aspak Sheikh` | File holder explicit; README says the holder is based on account name and should be confirmed, so README confirmation language is stale/unconfirmed wording |
| Node pin | `.nvmrc` `26.13.0`; engine `>=26.0.0 <27` | Confirmed |

### Proposed release number

`0.2.0` is the proposed next version because this repository is on `0.1.0`
and contains additive release work after the initial version. This is a
proposal only; the owner must confirm it before Step 2 metadata changes.

## b) Permissions and usage

| Platform | Declared/requested | Evidence and need |
|---|---|---|
| Android notifications | Runtime permission via `expo-notifications`; plugin present | Needed only for optional local reminders; request occurs from the reminders UI/first-launch prompt |
| Android biometric | `USE_BIOMETRIC` and `USE_FINGERPRINT` in app config | Needed for app-lock authentication with `expo-local-authentication` |
| Android file access | No storage/media permission declared | Backup uses document picker, File APIs and the system share sheet; existing evidence does not support adding permissions |
| iOS notifications | Runtime authorization via `expo-notifications` | Optional local reminders only; remote push is not used |
| iOS Face ID | `faceIDPermission`: `Unlock Wealth Wise` | Required usage string for local app-lock authentication |
| iOS file access | No extra usage string declared | Document picker and share-sheet APIs handle user-selected files; no Photos, Contacts or location need is evidenced |

No unrelated permission removal is supported by the evidence.

## c) Data safety

### Storage keys

| Key / key family | Purpose | Erase-all |
|---|---|---|
| `wealthwise.app.v1` | Active Zustand/AppData payload | Removes it, then the store hydrates to empty AppData |
| `wealthwise.app.v1.premigration.v1`–`v20` | Exact migration inputs archived before migration | Removes v1–v20 |
| `wealthwise.app.v1.prerepair-efallocation` | Emergency-Fund repair original bytes | Removes it |
| `wealthwise.app.v1.preimport` | Previous data retained for Undo of import | Removes it |
| `wealthwise.app.v1.corrupt.latest` | Most recent damaged/invalid payload copy | Removes it |
| `wealthwise.app.v1.corrupt.previous` | Earlier damaged payload copy | Removes it |
| `wealthwise.meta.v1` | AsyncStorage UI/export/reminder metadata | Removes it |
| `wealthwise.lock.v1` | Secure Store app-lock settings | Deletes it |

The archive, recovery, import Undo, UI metadata and lock settings are all
listed in the erase-all implementation or test. SQLite native persistence uses
the same logical `wealthwise.app.v1` key; the active database name is
`wealthwise-state.db`. The erase action writes an empty AppData payload back
after deleting the old one.

### Archive keys

The archive families are `.premigration.v1` through `.premigration.v20`,
`.prerepair-efallocation`, `.corrupt.latest`, `.corrupt.previous`, and
`.preimport` is the import Undo archive. All are removed by `eraseAllData`,
subject to storage error handling.

### Outbound data

A source grep found no `fetch`, `XMLHttpRequest`, `WebSocket`, analytics,
telemetry, Amplitude, Firebase, PostHog, or Sentry reference in `app/`, `src/`,
`package.json`, or `app.json`. README claims no cloud/network synchronization
are therefore consistent with the checked source inventory.

## d) Migration safety

The focused migration/backup/data-store run passed:

- 5 suites
- 184 tests
- 0 failures

Checked-in fixtures covered migration helpers, backup parsing, native store
hydration, safe-storage corruption/premigration archives, and encrypted v1
through v13 migration/Undo behavior. The checked-in suite also directly covers
a v13-to-v14 migration with no persisted-field change.

| Migration case | Result | Equality evidence |
|---|---|---|
| Checked-in migration fixtures | Pass, 184/184 focused tests | Existing assertions cover migrated collections and selected totals; no separate aggregate net-worth/EF numeric report was produced by this inventory |
| Synthetic v13 backup | `v13` migration is covered by the v13-to-v14 migration test; an independently generated v13 backup envelope with explicit net-worth, goal and EF equality assertions is not present in the checked-in fixture inventory | Synthetic equality run: not verified in this report-only pass |
| Encrypted v1 backup through migration chain | Pass and Undo preservation | Liabilities migrate, but the test does not report a separate net-worth/goals/EF equality delta |

The migration safety gap is now explicit: no standalone synthetic-v13
net-worth/goals/Emergency-Fund equality report existed before this task.

## e) npm audit and accepted risks

Current `npm audit --omit=dev --json` result:

- 7 production vulnerability nodes: 4 moderate and 3 high
- 0 critical and 0 low

Direct dependencies are not limited to the count below: `expo` and
`expo-router` are direct and carry the owner/upgrade decision.

| Direct package / advisory node | Severity | Evidence | SDK 57 patch available? | Owner decision |
|---|---|---|---|---|
| `expo-router` through `query-string` / `decode-uri-component` | High (`expo-router`); high/moderate transitive advisories | Advisory range and fix point to Expo Router `58.0.30` | No; npm suggests a major Router version upgrade | Expo SDK major upgrade and SDK compatibility retest are required |
| `expo` through `@expo/fingerprint` / `glob` / `minimatch` | Moderate direct and transitive | npm suggests Expo `53.0.11`; contradictory current Expo SDK metadata does not represent a patch fix to SDK 57 | No SDK-57 patch fix is evidenced | Expo SDK major upgrade owner decision |
| `decode-uri-component` / `query-string` | High | Exponential/quadratic malformed percent-encoded decoding denial of service | Same major upgrade path, no SDK-57 patch fix | Accepted risk until routing upgrade |
| `glob` / `minimatch` | Moderate | `@expo/fingerprint` build-tool chain advisories | No SDK-57 patch fix | Accepted risk; build-time exposure, still owner-tracked |

### Accepted-risk table

| Risk | Status | Reason | Recheck condition |
|---|---|---|---|
| Seven production vulnerability nodes in SDK-57 dependency tree | Accepted for this release pending owner upgrade decision | npm fixes require Expo/Router major upgrades; applying them would violate the no-major/no-force constraints | Reassess on the next Expo SDK upgrade planning pass |
| README stale audit totals | Documentation defect, not runtime risk | Current audit differs from the historical 27 production / 55 total counts in the README | Correct in Step 2 |
| Release license-holder confirmation | Owner/legal confirmation open | LICENSE is explicit; README extra confirmation wording is not evidence of holder mismatch | Owner confirms publication identity |
| Native notification/biometric/device behavior | Physical-device evidence open | Automated gates and exports do not prove permission prompts or layout | Keep in device checklist |
