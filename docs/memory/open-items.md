<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-11-25 | Updates: owner and AI agents -->

# Open items

## P20-AB Transactions header missing-link icon (Done; CR-190; #629; device check O98 Not run)

- Subtask P20-AB (CR-190, 2026-11-28): Replaced the Transactions header three-dot `menu` for missing linked transactions with a conditional `link` icon in `rightActions` (`app/(tabs)/transactions.tsx`) opening `/link-missing` only while `unlinkedCount > 0` and hidden otherwise. Updated `TransactionsScreen.test.tsx`, `RouteRenderSmoke.test.tsx`, `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O98` (`Not run`). Issue `#629`. Schema remains version 24.

## P35-C-R6 Inline Profile in Settings and Pending review drafts in Transactions (Done; CR-190; #626; device check O97 Not run)

- Subtask P35-C-R6 (CR-190, 2026-11-28): Removed `Data & developer actions` title from `app/settings.tsx`, removed `app/profile-form.tsx` and its navigation/menu entries, added inline Profile display and editing above Transaction detection in `app/settings.tsx` preserving `data.settings`, and moved `Pending review drafts` from `app/transaction-detection.tsx` to `app/(tabs)/transactions.tsx`. Updated tests, `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O97` (`Not run`). Issue `#626`. Schema remains version 24.

## CR-189 Record physical-device checks O86–O91, O95, O96 as Pass (Done; #623; O92–O94 remain Not run)

- Subtask CR-189 (2026-11-28): Recorded owner-reported physical-device verification **Pass** for `O86`, `O87`, `O88`, `O89`, `O90`, `O91`, `O95`, and `O96` in `docs/releases/device-test-checklist.md` (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-28`). `O92`, `O93`, and `O94` remain `Not run`. Issue `#623`. Documentation only; schema remains version 24.

## P26-A-R1 Reorder bottom tabs to Home, Goals, Budget, Transactions (Done; CR-188; #620; device check O96 Pass)

- Subtask P26-A-R1 (CR-188, 2026-11-28): Reordered `bottomTabs` in `src/components/ui.tsx` and `<Tabs.Screen>` in `app/(tabs)/_layout.tsx` to **Home, Goals, Budget, Transactions** on both platforms while preserving each tab's behavior and navigation state. Updated `BottomTabBar.test.tsx`, `TabsLayout.test.tsx`, `docs/memory/rules.md`, `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O96` (`Not run`). Issue `#620`. Schema remains version 24.

## P35-C-R5 Hide automatic transaction detection on iOS (Done; CR-188; #617; device check O95 Not run)

- Subtask P35-C-R5 (CR-188, 2026-11-28): Hidden automatic transaction detection controls and entry points on iOS across `app/settings.tsx`, `app/(tabs)/index.tsx` (explicitly authorized), `app/(tabs)/transactions.tsx`, and `TransactionDetectionRuntime`, while keeping Android behavior intact and keeping `/transaction-detection` on iOS as a graceful Android-only manual-entry fallback. Updated `SettingsScreen.test.tsx`, `TransactionDetectionEntryPoints.test.tsx`, `TransactionDetectionScreen.test.tsx`, `rules.md`, `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O95` (`Not run`). Issue `#617`. Schema remains version 24.

## P35-C-R4 Improve Android transaction-detection reliability and parser coverage (Done; CR-187; #614; device check O94 Not run)

- Subtask P35-C-R4 (CR-187, 2026-11-28): Fixed backgrounded `emitIfActive()` dropping events in `plugins/withNotificationListener.js` (`onHostResume`/`onHostPause`), added `EXTRA_BIG_TEXT` / `EXTRA_TEXT_LINES` / `EXTRA_MESSAGES` extraction, OEM SMS packages, `reviewLatest=1` draft hydration (`app/transaction-form.tsx`), active-drain routing (`ReminderRuntime.tsx`), full default source-app selection + troubleshooting note (`app/transaction-detection.tsx`), and broadened domain parsing (`src/domain/transactionDetection.ts`) without `READ_SMS` or `QUERY_ALL_PACKAGES`. Updated `PRIVACY.md`, `CHANGELOG.md` (`[Unreleased]`), tests, and added physical-device check `O94` (`Not run`). Issue `#614`. Schema remains version 24.

## P35-C-R3 Direct draft modal review flow and compliant source-app picker (Done; CR-186; #611; device checks O92, O93 Not run)

- Subtask P35-C-R3 (CR-186, 2026-11-28): Updated `ReminderRuntime.tsx`, `app/transaction-form.tsx`, `plugins/withNotificationListener.js`, `src/domain/transactionDetection.ts`, `src/lib/notificationListener.ts`, `app/transaction-detection.tsx`, and `PRIVACY.md` so foreground detections and background notification taps open `/transaction-form` directly (Save/Dismiss/Discard semantics, no stacked modals) and the Add app picker uses scoped `<queries>` + observed listener apps without `QUERY_ALL_PACKAGES` (`Trusted` only for verified catalogue packages). Added `TransactionDraftReviewFlow.test.tsx`, updated `TransactionDetectionScreen.test.tsx` and `CHANGELOG.md` (`[Unreleased]`), and added physical-device checks `O92` and `O93` (`Not run`). Issue `#611`. Schema remains version 24.

## P20-AA Month and year jump selectors for Transactions and Budget (Done; CR-185; #608; device check O91 Not run)

- Subtask P20-AA (CR-185, 2026-11-28): Added `src/components/MonthYearPicker.tsx` and integrated month/year jump selectors into `app/(tabs)/transactions.tsx` and `app/(tabs)/budget.tsx`, preserving previous/next-month controls, sorting, filters, empty periods, and Budget's 24-month forward bound. Added `MonthYearJump.test.tsx`, updated `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O91` (`Not run`). Issue `#608`. Schema remains version 24.

## P25-B-R1 Confirm backup import after file selection (Done; CR-184; #605; device check O90 Not run)

- Subtask P25-B-R1 (CR-184, 2026-11-28): Updated `app/backup.tsx` to prompt `Import backup` / `Cancel` after plain or decrypted backup validation with a clear data-replacement warning, keeping Cancel non-mutating and temp-file safe, and replacing `"Replace my data"` preview action wording with `"Import backup"`. Added `BackupImportConfirm.test.tsx`, updated `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O90` (`Not run`). Issue `#605`. Schema remains version 24.

## P35-C-R2 Add Settings screen and hide enabled detection entry points (Done; CR-183; #602; device check O89 Not run)

- Subtask P35-C-R2 (CR-183, 2026-11-28): Added `app/settings.tsx` (`Settings` screen with all `useAppMenu()` items and `Automatically detect transactions` control), replaced Home header's three-dot menu with a `Settings` gear button (`app/(tabs)/index.tsx`), hid Home/Transactions auto-detection entry points while `status === 'enabled'`, added `SettingsScreen.test.tsx`, updated `TransactionDetectionEntryPoints.test.tsx` and `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O89` (`Not run`). Issue `#602`. Schema remains version 24.

## CR-182 Align Expo SDK 58 package versions (Done; cleanup; #599)

- Subtask CR-182 (2026-11-28): Aligned `expo` (`~58.1.0`), `expo-crypto` (`~58.0.9`), `expo-file-system` (`~58.0.15`), `expo-notifications` (`~58.1.10`), `expo-router` (`~58.0.33`), `expo-sharing` (`~58.0.24`), `expo-splash-screen` (`~58.0.15`), and `jest-expo` (`~58.0.16` in `devDependencies`) under `cleanup` lifecycle (`#599`), preserving `.npmrc` (`legacy-peer-deps=true`). `npx expo install --check` (`0`) and `npx expo-doctor` (`20/20`, `0`) pass. Schema remains version 24.

## P35-C-R1 Add Home & Transactions auto-detection entry points (Done; CR-181; device check O88 Not run)

- Subtask P35-C-R1 (CR-181, 2026-11-27): Added `src/lib/transactionDetectionStatus.ts` and `"Automatically detect transactions"` setup/status entry points on Home (`app/(tabs)/index.tsx`, explicitly authorized) and Transactions (`app/(tabs)/transactions.tsx`), displaying accurate status (`Unavailable on iOS`, `Not set up`, `Notification access needed`, `Notification permission needed`, `Enabled`), routing to `/transaction-detection`, adding `transactionDetectionStatus.test.ts` and `TransactionDetectionEntryPoints.test.tsx`, updating `CHANGELOG.md` (`[Unreleased]`), and adding physical-device check `O88` (`Not run`). Schema remains version 24.

## P24-A-R1 Fix payment-reminder permission failure (Done; CR-180; device check O87 Not run)

- Subtask P24-A-R1 (CR-180, 2026-11-27): Fixed `_this.ensureChannel is not a function` in `src/lib/reminderNotifications.ts` by extracting standalone `ensureRemindersChannel()` so unbound `requestPermission` / `scheduleTest` callbacks create the Android `reminders` channel before `requestPermissionsAsync()`, clarified Android 12 vs 13+ and `POST_NOTIFICATIONS` vs Notification Access in `app/reminders.tsx`, added `reminderNotifications.test.ts`, updated `CHANGELOG.md` (`[Unreleased]`), and added physical-device check `O87` (`Not run`). Schema remains version 24.

## CR-179 GitHub issue inventory audit and durable templates (Done)

- Subtask CR-179 (2026-11-27): Audited all 276 non-PR GitHub issues (23 open, 253 closed), completed 205 truncated `...` titles and sparse bodies, posted activity summaries on 23 open zero-comment issues, updated `AGENTS.md` and `docs/memory/rules.md` with Fibonacci (`1, 2, 3, 5, 8, 13`) estimate & issue-writing rules, and updated `.github/ISSUE_TEMPLATE/` (`bug_report.yml`, `feature_request.yml`, `planned_task.yml`). 13 historical `P1`–`P14` issues lack recoverable Git history for a retrospective estimate and are flagged `Unavailable` for owner input if desired. Schema remains version 24.

## P35-C Opt-in Android notification-based transaction detection (Done; CR-178; #442; device check O86 Not run)

- Subtask P35-C (CR-178, 2026-11-25): Implemented opt-in Android `NotificationListenerService` transaction detection (`plugins/withNotificationListener.js`, zero SMS permissions), local-only parsing/dedup/7-day expiry (`src/domain/transactionDetection.ts`), `metaStore.ts` draft queue (schema v24), prominent disclosure & source-app allowlist (`app/transaction-detection.tsx`), dynamic credit/debit/Investment categorization (`app/transaction-form.tsx`), foreground review & generic background `Review` notification (`TransactionDetectionRuntime`), and `PRIVACY.md` / `CHANGELOG.md` (`[Unreleased]`) updates. Physical-device check `O86` added in `Not run` status (requires installable native Android build). Issue `#442`. Schema remains version 24.

## P35-B Transaction auto-detection scope validation and design (Done; CR-177; #441)

- Subtask P35-B (CR-177, 2026-11-25): Validated P35-A research and finalized P35-C implementation design in `/tmp/wealthwise/reports/p35-b-implementation-design.md`. Confirmed Android-only `NotificationListenerService`, zero SMS permissions, `metaStore` draft queue/dedup/7-day expiry (schema v24), dynamic credit/debit/Investment categorization, prominent disclosure, foreground review vs generic background `Review` notification, and acceptance criteria. Unblocks `P35-C` (`#442`). Issue `#441`. Schema remains version 24.

## P35-A Transaction auto-detection research and plan (Done; CR-176; #440)

- Subtask P35-A (CR-176, 2026-11-25): Completed SMS/notification transaction detection research and implementation plan in `/tmp/wealthwise/reports/p35-a-transaction-detection-research.md`. Recommended Android `NotificationListenerService` (no `READ_SMS`/`RECEIVE_SMS`), 100% local-only parsing with zero raw-message storage, in-app Prominent Disclosure + affirmative opt-in consent, Android 13+ Restricted Settings walkthrough for sideloaded APKs, and reviewable drafts in `metaStore` (iOS unsupported). Unresolved owner questions for P35-B validation: confirm dropping `READ_SMS`, `metaStore` draft queue (schema stays v24), iOS unsupported posture, and `PRIVACY.md` update in P35-C. Issue `#440`. Schema remains version 24.

## P34-A Quick-capture research and implementation plan (Done; CR-175; #437)

- Subtask P34-A (CR-175, 2026-11-25): Completed quick-capture platform and policy research for Expo SDK 58 / React Native `0.88.1` in `/tmp/wealthwise/reports/p34-a-quick-capture-research.md`. Recommended P34-B (`expo-quick-actions` + Android `TileService` via config plugin + opt-in `expo-notifications` action behind `LockGate`) and P34-C (opt-in foreground-only shake via `expo-sensors`), with double-tap back, key combos, and background gestures out of scope. Unresolved owner questions: whether to include the persistent Notification Action in P34-B, preferred default shortcut items, and P34-C sequencing. Issue `#437`. Schema remains version 24.

## P28-F-R8 Prepare and publish v1.4.0 release (Done; CR-174; #574)

- Subtask P28-F-R8 (CR-174, 2026-11-25): Published **WealthWise v1.4.0** (`main` `40cc7a2`, tag `v1.4.0`, EAS build `21c0f156-39ff-4087-a4e2-df0519121650`, `android-apk`, `versionCode` `6`, `106,032,738` bytes). Renamed `v1.3.0` asset to `WealthWise-android-v1.3.0.apk`, verified all APK and 13 screenshot URLs (`HTTP 200`), updated `release-history.md`, and back-merged `main` into `develop`. Issue `#574`.

## P40-B Archive completed-phase narrative (Done; CR-173; #462)

- Subtask P40-B (CR-173, 2026-11-25): Archived completed-phase narrative from `docs/PROGRESS.md` into `docs/memory/archive/` (`README.md` + 6 section archives), reducing `docs/PROGRESS.md` by ~75% in bytes while preserving all historical records and full `progressLedger.test.ts` coverage. Phase `P40` is now complete (`2/2`). Issue `#462`.

## P40-A Documentation size and read-cost audit (Done; CR-172; #461)

- Subtask P40-A (CR-172, 2026-11-25): Measured `AGENTS.md`, `docs/PROGRESS.md`, and `docs/memory/*` (17,359 lines / 1,751,606 bytes / ~436,456 estimated tokens at `chars / 4`; `docs/PROGRESS.md` alone is 13,495 lines / 1,443,604 bytes / ~359,592 tokens, with 78.8% in sections `## 10`, `## 6`, `## 4`, and `## 11`), plus 5 doc-parsing Jest suites (96 `it()` blocks, 1,312 `expect()` assertions). Full report stored outside Git at `/tmp/wealthwise/reports/p40-a-doc-size-audit.md`. Unblocks `P40-B` (`#462`). Issue `#461`.

## CR-171 Complete CHANGELOG.md and add mandatory update rule (Done; #566)

- Subtask CR-171 (2026-11-25): Completed `CHANGELOG.md` for all five published releases (`[1.3.0] - 2026-11-22`, `[1.2.0] - 2026-11-11`, `[1.1.1] - 2026-11-09`, `[1.1.0] - 2026-11-08`, `[1.0.0] - 2026-11-07`) plus `[Unreleased]`. Added the mandatory per-release `CHANGELOG.md` update rule to `AGENTS.md`, `docs/releases/README.md`, `docs/releases/TEMPLATE.md`, and `docs/releases/RELEASE_PROMPT.md`. Verified `app/about.tsx` and `AboutScreen.test.tsx` changelog link, and added regression assertions in `progressLedger.test.ts`. Issue `#566`. Documentation only; schema remains version 24.

## CR-170 Record owner-reported physical-device check O85 as Pass (Done; #565)

- Subtask CR-170 (2026-11-25): Recorded owner-reported physical-device verification **Pass** for check `O85` (Expo SDK 58 / React Native 0.88.1 runtime, bottom tab navigation, forms, SQLite persistence, local notifications, biometrics, and backup export/import) in `docs/releases/device-test-checklist.md` under `## Next release device checks`. Confirmed metadata: `realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`. All Next release device checks now Pass. Issue `#565`. Documentation only; schema remains version 24.

## P39-E-R1 Expo SDK 58 upgrade and DEC-P39-DEPS-01 resolution (Done; CR-169; #562; device check O85 Pass)

- Subtask P39-E-R1 (CR-169, 2026-11-25):
  1. **SDK 58 upgrade:** Upgraded `expo` (`^58.0.26`), `react-native` (`0.88.1`), `react` (`19.3.0`), `expo-router` (`~58.0.32`), and all compatible SDK 58 packages, plus `@react-native/jest-preset` and `react-test-renderer@19.3.0`.
  2. **Advisory resolution (`DEC-P39-DEPS-01`):** `npm ls decode-uri-component` is empty and `npm audit` reports 0 critical/0 high advisories (27 moderate dev/CLI advisories remain in `glob`/`minimatch`).
  3. **Physical-device check:** Added `O85` and recorded as **Pass** (CR-170, 2026-11-25) in `docs/releases/device-test-checklist.md` for Expo SDK 58 / React Native 0.88.1 runtime verification. Schema version 24 preserved.

## Record physical-device checks O83 and O84 as Pass (Done; CR-168; #559)

- Subtask CR-168 (2026-11-25): Recorded owner-reported physical-device verification Pass for `O83` and `O84` in `docs/releases/device-test-checklist.md` with confirmed metadata (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`).

## Remote-snapshot refresh rules, GitHub issue-tracking rules, and missing issue backfill (Done; CR-167)

- Subtask CR-167 (2026-11-25):
  1. **Refreshed remote snapshot:** Executed `bash scripts/export-remote-snapshot.sh` (`2026-11-25T12:28:13+05:30`, `develop=f3da010`) into `/tmp/wealthwise/remote-snapshot/`.
  2. **Updated standing rules:** Updated `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/README.md`, and `docs/memory/working-style.md` to require conditional remote-snapshot refreshes whenever remote state changes or at task start if stale, and immediate GitHub issue creation/closure with verified commits, PRs, merge SHAs, and gate evidence for any unissued approved work.
  3. **Backfilled missing Model A issues:** Created and closed `#548` (`CR-159`), `#549` (`CR-160`), `#550` (`CR-161`), `#551` (`CR-162`), `#552` (`CR-163`), `#553` (`CR-164`), `#554` (`CR-165`), and `#555` (`P39-H-R1`/`CR-166`); opened `#556` for `CR-167`.
- Owner physical-device checks `O83` and `O84` remain `Not run` (owner confirmed they will run them before any future release candidate build/draft). Schema version 24 preserved.

## P39-H-R1 P39 audit remediations and SDK 57 patch alignment (Done; CR-166; device checks O83–O84 Not run)

- Subtask P39-H-R1 (CR-166, 2026-11-25):
  1. **SQLite fallback warning:** Wired `onSQLiteFailure` in `stateStorage.native.ts` through `sqliteFallback.ts` to `StorageErrorBanner.tsx` (`storageWarning` state) without implying data loss.
  2. **Modal route registrations:** Added explicit `<Stack.Screen ... options={{ presentation: 'modal' }} />` declarations for `ef-allocation-form`, `holding-valuation-form`, `liability-closure-form`, `liability-closure-note-form`, and `recurring-plan-stop-form` in `app/_layout.tsx`.
  3. **Deep-link parameter handling:** Added `src/lib/routeParams.ts` (`singleParam`, `closeRouteSafely`) across form/reminder/due routes so missing/invalid params render safe fallback UI and exit cleanly on cold deep-link launches.
  4. **Production stress-data bundle:** Guarded `src/domain/stressData.ts` behind `__DEV__` lazy `require` in `createAppStore.ts`, preserving Demo Mode (`demoData.ts`) while excluding stress fixtures from production Hermes output.
  5. **Expo SDK 57 patch alignment:** Aligned the 8 SDK 57 packages via npm (`expo` `~57.0.34`, `expo-router` `~57.0.32`, `expo-sqlite` `~57.0.7`, `expo-build-properties` `~57.0.24`, `expo-constants` `~57.0.25`, `expo-notifications` `~57.0.26`, `expo-sharing` `~57.0.27`, `expo-splash-screen` `~57.0.12`). `DEC-P39-DEPS-01` remains accepted until the next planned Expo SDK major upgrade.
  6. **Physical-device checks pending:** Added `O83` (modal presentation & deep-link fallback) and `O84` (Demo Mode & SDK 57 patch verification) in `Not run` status under `## Next release device checks` in `docs/releases/device-test-checklist.md`.
- Schema version 24 preserved.

## Temporary artifact organization and exporter relocation (Done; CR-165)

- Subtask CR-165 (2026-11-25):
  1. **Organized `/tmp/wealthwise/`:** Moved 312 WealthWise-specific `/tmp` artifacts into `/tmp/wealthwise/` preserving timestamps and permissions (`remote-snapshot/`: 177, `reports/`: 59, `logs/`: 74, `build-artifacts/`: 2; 0 conflicts; unrelated system/editor files left unmoved).
  2. **Relocated exporter:** Moved `~/export-remote-snapshot.sh` to `scripts/export-remote-snapshot.sh` (verified WealthWise-specific, zero embedded tokens/credentials, uses `gh` CLI authentication) and updated output path to `/tmp/wealthwise/remote-snapshot/`.
  3. **Updated references & tests:** Updated `AGENTS.md`, `docs/memory/README.md`, `docs/memory/rules.md`, `src/lib/__tests__/branchingDocs.test.ts`, and `src/lib/__tests__/progressLedger.test.ts`. Historical entries keep their original `/tmp` paths; current artifacts reside under `/tmp/wealthwise/`.
- Pure documentation/tooling scope; no `/tmp` artifacts committed to Git; schema remains version 24.

## Resolve DEC-P39-DEPS-01 by owner approval (Done; CR-164)

- Subtask CR-164 (2026-11-25): Resolved owner decision `DEC-P39-DEPS-01` per explicit owner approval:
  1. **Decision:** Accept the `decode-uri-component@0.2.2` ReDoS risk (`GHSA-vcc3-ghjq-m6fr` Moderate `<=0.4.2`, `GHSA-qr28-fpjm-wq7f` High `<=0.5.0` via `expo-router@57.0.31` → `query-string@7.1.3`) until the next planned Expo SDK upgrade.
  2. **Constraint & mitigation:** `npm audit` fix requires SemVer-major `expo-router@58.0.32` (Expo SDK 58), incompatible with Expo SDK 57 (`expo@57.0.33`). Mitigated by 100% offline-first runtime (`offlineRuntime.test.ts`, zero network calls) and internal routes (`scheme: "wealthwise"`). The vulnerability is not fixed.
  3. **Follow-up condition:** Re-evaluate `decode-uri-component` / `query-string` / `expo-router` advisories during the next planned Expo SDK upgrade.
- Pure documentation and decision-tracking scope; no dependencies upgraded; schema remains version 24.

## Historical PR label reconciliation and DEC-P39-DEPS-01 review (Done; CR-163; DEC-P39-DEPS-01 resolved in CR-164)

- Subtask CR-163 (2026-11-25):
  1. **Fresh remote snapshot:** Exported via `export-remote-snapshot.sh` at `2026-11-25T10:01:47+05:30` with terminal session capture in `/tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-25.log`.
  2. **Historical PR labels:** Audited all 277 PRs (276 `MERGED`, 1 `CLOSED` [#39]). Applied missing taxonomy labels to 276 PRs (`ok=276, fail=0`, 0 labels created; mapped 21 `phase:p28` draft entries to `lifecycle:qa-and-release`); PR #39 retained `phase:p01`, `type:chore`, `status:superseded`, `wontfix`. Post-update check confirmed 277/277 PRs labeled (0 unlabeled). Artifacts in `/tmp/wealthwise-pr-label-reconciliation.json` and `/tmp/wealthwise-pr-label-apply-results.json`.
  3. **DEC-P39-DEPS-01 (Open — Pending owner confirmation):** Verified `decode-uri-component@0.2.2` (`GHSA-vcc3-ghjq-m6fr`, `GHSA-qr28-fpjm-wq7f`) via `expo-router@57.0.31` → `query-string@7.1.3`. Upstream fix requires SemVer-major `expo-router@58.0.32` (Expo SDK 58), incompatible with Expo SDK 57 (`expo@57.0.33`). Mitigated by 100% offline-first runtime. No dependencies upgraded; awaiting explicit owner confirmation to accept risk until the next planned Expo SDK upgrade.
  4. **Future tracking rules:** Verified `AGENTS.md`, `rules.md`, and `working-style.md` cover PR/issue labeling and commit/PR/merge evidence without gaps.
- Pure documentation and repository-process scope; schema remains version 24; no runtime behavior changed.

## PR #39 reconciliation, PR/issue label policy, and future tracking (Done; CR-161)

- Subtask CR-161 (2026-11-24): Reconciled PR #39, PR/issue label policies, release records, and future tracking:
  1. **PR #39 verified disposition:** Truthfully confirmed PR #39 as Closed Unmerged with labels `phase:p01`, `type:chore`, `status:superseded`, `wontfix` and detailed verified body; commit `b779c21` was connected as an ancestry parent in P28-E-R3 (merge commit `0697d88`) and released in `v1.1.1` (PR #69 `ce90a13`), `v1.2.0`, and `v1.3.0`.
  2. **PR & Issue audit:** Audited all 273 PRs and 261 issues; compiled complete mapping in `/tmp/wealthwise-pr-label-audit.json` and report in `/tmp/wealthwise-pr-issue-audit-report.md`.
  3. **Policy updates:** Updated `AGENTS.md`, `rules.md`, `working-style.md`, `release-history.md`, and added test enforcement in `src/lib/__tests__/progressLedger.test.ts`.
  4. **Public safety:** Verified zero personal financial data, tokens, secrets, or private findings in any PR or issue.
- Pure documentation and repository-process scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (repository documentation/process only).
- Ordered six gates pass.

## GitHub issue reconciliation and test-enforced tracking (Done; CR-160)

- Subtask CR-160 (2026-11-24): Reconciled complete GitHub issue history backfill and established test-enforced ongoing tracking:
  1. **Semantic standard labels:** Assigned `enhancement` (features), `bug` (defects/fixes), and `documentation` (process/documentation) across all 261 issues.
  2. **Detailed planned issues:** Enriched all 29 open planned roadmap issues with explicit scope, dependencies, and current state under milestone `Planned`.
  3. **Preserved retrospective closures:** Preserved all 232 closed issues with original verifiable evidence and zero backdating.
  4. **Test-enforced workflow:** Updated `AGENTS.md`, `rules.md`, `working-style.md`, and added automated test assertions to `src/lib/__tests__/progressLedger.test.ts`.
  5. **Public safety:** Verified zero personal financial amounts, account numbers, secrets, tokens, or private audit findings in any issue.
- Pure documentation and repository-process scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (repository documentation/process only).
- Ordered six gates pass.

## GitHub issue history backfill and ongoing tracking setup (Done; CR-159)

- Subtask CR-159 (2026-11-24): Executed complete GitHub issue history backfill approved under P43-E / CR-150:
  1. **Metadata configuration:** Created 7 milestones (`v1.0.0` through `v1.3.1`, `Planned`) and 54 labels across types, statuses, lifecycles, and phases (`phase:p01`–`phase:p44`).
  2. **Model A backfill:** 261 discrete GitHub issues created: 232 completed retrospective issues closed with verifiable evidence, 29 open planned roadmap issues.
  3. **Ongoing tracking protocol:** Rules and invariants documented in `AGENTS.md`, `rules.md`, `working-style.md`, and `README.md`.
  4. **Public safety:** Verified zero personal financial data, tokens, secrets, or private audit findings in any issue.
- Pure documentation and repository-process scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (repository documentation/process only).
- Ordered six gates pass.

## P20-L-R1 Consistent filter panels and dot removal (Done; CR-158)

- Subtask P20-L-R1 (CR-158, 2026-11-24):
  1. **Consistent filter panels:** Added status chips (`All`, `In progress`, `Achieved`) and dynamic target year filter chips to Goals screen alongside `SortChip`. Audited all 5 screens with a header filter icon (Goals, Assets, Liabilities, Transactions, Budget); confirmed filter selections and persistent sorting preferences operate independently.
  2. **Header filter dot indicator removal:** Removed `showIndicator: filterActive` across all 5 screens; the filter icon never displays a dot indicator initially or after changing sorting or filtering.
  3. **Regression tests:** Added `src/components/__tests__/ConsistentFilterPanels.test.tsx` (10/10 passing); updated `RouteRenderSmoke.test.tsx` and `BudgetCategoryFilter.test.tsx` to expect dot indicator absence.
  4. **Physical-device check:** Check `O82` recorded as Pass based on owner-reported physical-device verification on 2026-11-24 (metadata: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev).
- Schema version 24 preserved.
- Ordered six gates pass.

## P39-H Release audit remediation plan (Done; CR-157)

- Subtask P39-H (CR-157, 2026-11-24): Synthesized all findings from P39-A through P39-G into three prioritized independent remediation batches:
  1. **Batch 1 (Containment & Storage Fallback):** Connect SQLite fallback to `StorageErrorBanner` for user degradation visibility.
  2. **Batch 2 (Production Bundle Optimization):** Dynamically load demo/stress data in `createAppStore.ts` to exclude from Hermes bytecode; register 5 missing modal form routes in `_layout.tsx`.
  3. **Batch 3 (Dependency Alignment):** Upstream Expo SDK resolution tracking for `decode-uri-component` under `DEC-P39-DEPS-01`.
  4. **Report artifact:** Persisted in `/tmp/wealthwise-p39-h-remediation-plan.md`.
- Pure planning scope; schema remains version 24; no runtime behavior changed. Phase P39 is 100% complete (8/8 subtasks Done).
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-G Clean-install and first-launch walkthrough (Done; CR-156)

- Subtask P39-G (CR-156, 2026-11-24): Completed clean-install walkthrough across onboarding, reminders, app lock, and transaction creation:
  1. **Boot sequence & Onboarding:** Confirmed smooth splash dismissal and atomic store transition; hardware back cleanly exits app.
  2. **Reminders prompt sheet:** Non-modal `FirstLaunchReminderPrompt` tested; denial cleanly sets `meta.remindersPromptHandled`.
  3. **Denied & interrupted paths:** Biometric rejection fallback to passcode verified; storage resilience verified.
  4. **P37 handoff:** Onboarding and first-launch observations documented to feed P37 tutorial development.
  5. **Report artifact:** Persisted in `/tmp/wealthwise-p39-g-clean-install-walkthrough.md`.
- Pure audit/documentation scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-F Debt, TODO/FIXME markers, and skipped test audit (Done; CR-155)

- Subtask P39-F (CR-155, 2026-11-24): Completed audit of debt markers, skipped tests, and benchmark performance:
  1. **Debt markers:** Verified zero inline `TODO`, `FIXME`, `HACK`, or `XXX` markers exist in the codebase.
  2. **Skipped test investigation:** Single skipped test in `src/domain/__tests__/stressData.test.ts#L93` confirmed as documented architectural exception (opt-in 50y/100y/126y stress benchmark via `WEALTHWISE_STRESS_BENCHMARK=1`).
  3. **Assertion preservation:** Confirmed no test assertions were removed or weakened.
  4. **Report artifact:** Persisted in `/tmp/wealthwise-p39-f-test-debt-audit.md`.
- Pure audit/documentation scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-E Dependency risk triage and CVE review (Done; CR-154)

- Subtask P39-E (CR-154, 2026-11-24): Completed dependency risk review across 1,124 dependencies:
  1. **Production reachability triage:** 11 total advisories (0 critical, 3 high, 8 moderate). `decode-uri-component` in `expo-router`/`query-string` is the sole production-reachable advisory, mitigated by offline runtime.
  2. **Tooling advisories:** `minimatch`, `tar`, `micromatch`, and `braces` affect development/build steps only.
  3. **Strict security posture:** No `npm audit fix --force` executed; no arbitrary install scripts approved.
  4. **Resolved owner decision (`DEC-P39-DEPS-01`):** Accepted `decode-uri-component@0.2.2` ReDoS risk until the next planned Expo SDK upgrade per owner approval (CR-164, 2026-11-25); vulnerability is not fixed and will be re-evaluated during the next Expo SDK upgrade.
  5. **Report artifact:** Persisted in `/tmp/wealthwise-p39-e-dependency-risk-audit.md`.
- Pure audit/documentation scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-D Silent failures and recovery-state audit (Done; CR-153)

- Subtask P39-D (CR-153, 2026-11-24): Completed report-first audit extending P30 across storage, backup import/export, notification scheduling, and SQLite fallback visibility:
  1. **SQLite fallback visibility:** Identified P2 finding that SQLite read/write-verification failure falls back to legacy AsyncStorage silently in `src/data/stateStorage.native.ts` (logs `console.warn`, but shows no user-facing degradation banner).
  2. **Backup corruption and recovery:** Defensive parsing and AES-256-GCM verification confirmed clean error returns for corrupted or tampered files; `undoImport` store action provides instant recovery.
  3. **Notification scheduling:** Non-blocking error handling ensures reminder failures never interrupt transaction creation.
  4. **Report artifact:** Persisted detailed analysis in `/tmp/wealthwise-p39-d-recovery-audit.md`.
- Pure audit/documentation scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-B Security, network boundary, and debug residue audit (Done; CR-152)

- Subtask P39-B (CR-152, 2026-11-24): Completed security, network boundary, and debug residue verification:
  1. **Secrets & EAS configuration:** Verified zero API keys, credentials, or private keys across codebase, Git history, and EAS configuration; `.env*` files properly ignored.
  2. **Offline runtime boundary:** Verified zero network calls in `app/` and `src/`; added regression test assertions for `EventSource` and `sendBeacon` to `src/lib/__tests__/offlineRuntime.test.ts`.
  3. **Debug residue & Hermes bytecode:** Proved dev menu unreachable at runtime in production (`__DEV__ === false`); confirmed static imports of mock/stress fixtures in `createAppStore.ts` bundle fixtures into production Hermes binary (P2 finding).
  4. **Detailed report:** Persisted to `/tmp/wealthwise-p39-b-security-debug-audit.md`.
- Pure audit/documentation scope with boundary regression test; schema version remains 24.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P39-A Master read-only codebase audit (Done; CR-151)

- Subtask P39-A (CR-151, 2026-11-24): Completed master read-only codebase audit across 12 areas (dead code, secrets/config, app lock, notification-response routes, deep links, silent failures, performance, dependencies, debug residue, TODO debt, permissions, first launch):
  1. **Audit results:** Recorded 12 findings with file/line evidence across P0–P3 severities. Confirmed zero P0 (critical) and zero P1 (high) blockers.
  2. **P2 findings:** Identified bundle bloat from static mock imports in `createAppStore.ts`, lack of UI indication when SQLite falls back to legacy AsyncStorage in `stateStorage.native.ts`, and ungated deep links into modal forms.
  3. **P3 clean areas:** Verified zero leaked secrets or tracked `.env` files, zero inline TODO/FIXME debt, zero debugger statements, and clean clean-install onboarding and notification response routing.
  4. **Detailed report:** Persisted to `/tmp/wealthwise-p39-a-master-audit.md`.
- Pure audit/documentation scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P43-E GitHub issue inventory and execution planning (Done; CR-150)

- Subtask P43-E (CR-150, 2026-11-24): Completed GitHub issue inventory and execution planning as a pure documentation and repository-process task (no GitHub issues created, edited, commented on, or closed):
  1. **Ledger inventory & deduplication:** Audited all 209 active dashboard subtasks (173 Done, 36 Planned; P27, P28, P32 reserved slots excluded) and 145 Change Requests (CR-1 through CR-150; 94 mapped to subtasks, 51 standalone lifecycle). Evaluated mapping models and recommended Model A (Atomic Ledger Mapping) yielding 260 discrete issues (209 subtasks + 51 standalone lifecycle CRs; 224 retrospective closed, 36 open planned).
  2. **Metadata & labeling schema:** Structured taxonomy across `phase/*`, `type/*` (`feature`, `fix`, `docs`, `chore`, `debt`, `test`), `status/*` (`planned`, `in-progress`, `completed`), and release milestones (`v1.0.0` through `v1.3.0`, `Future`). Issue bodies strictly reference verified commits, PRs, merge SHAs, and original completion dates; GitHub timestamps are never backdated.
  3. **Rate limit mitigation:** Defined 7 sequential batches of 35–40 issues with 2–3s delays (~4.5 min per batch, ~32 min total run) to remain well within GitHub API limits (5,000 req/hr) and secondary abuse thresholds.
  4. **Report artifact:** Persisted detailed findings, schema, and issue generation specs in `/tmp/wealthwise-p43-e-issue-inventory-plan.md`.
- Pure documentation and repository-process scope; schema remains version 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## P31 Community and project health deliverables (Done; CR-149)

- Subtasks P31-A, P31-B, P31-C, P31-D (CR-149, 2026-11-24): Completed repository deliverables for project health, community, accessibility, and privacy:
  1. **P31-A (Community guidelines):** Added `CODE_OF_CONDUCT.md` at repository root establishing standards of mutual respect, constructive collaboration, strict confidentiality of financial records, prohibited behaviors, and private maintainer reporting procedures.
  2. **P31-B (Issue forms):** Upgraded `.github/ISSUE_TEMPLATE/` to structured YAML forms: `bug_report.yml`, `feature_request.yml`, `question.yml`, and `config.yml`. Explicit privacy banners and required confirmation checkboxes ensure contributors do not disclose real financial data, balances, account numbers, credentials, or backups. Removed legacy markdown templates (`bug_report.md`, `feature_request.md`). Configured `config.yml` with `blank_issues_enabled: false` and maintainer security contact links.
  3. **P31-C (Accessibility documentation):** Added accessibility statement (`docs/accessibility/accessibility-statement.md`) establishing WCAG 2.1 AA conformance targets, 44x44 pt touch targets, dynamic typography (1.0x, 1.3x, 2.0x), high contrast ratios, and screen reader semantic mappings. Added practical audit checklist (`docs/accessibility/audit-checklist.md`) detailing verification steps across target sizes, scaling, color contrast, and assistive technologies.
  4. **P31-D (Privacy statement):** Added `PRIVACY.md` at repository root derived strictly from verified facts established during the P39-C audit trace: 100% offline-first architecture, local SQLite (`wealthwise-state.db`) and AsyncStorage (`wealthwise.app.v1`) sandboxing, zero network calls (`fetch`, `XMLHttpRequest`, `WebSocket`), zero analytics/telemetry, local notifications only on channel `'reminders'`, biometric authentication evaluated locally via OS Secure Enclave with passcode fallback, scoped file access via SAF, optional AES-256-GCM + PBKDF2 (100k iterations) backup export encryption, `android:allowBackup="false"`, and explicit disclosure that local data on device storage is unencrypted at rest at the app layer.
- Pure documentation scope; schema version remains 24; no runtime behavior changed.
- Physical-device checks: none required (no user-facing application behavior changed).
- Ordered six gates pass: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).

## CR-143 Plan Budget category filter (P20-Z) and Dynamic asset valuation (P29-U-R1) (Planned)

- Change request CR-143 (2026-11-23): Recorded two feature requests as Planned work only across repository ledgers, memory, and roadmap:
  1. **P20-Z (Budget Category Filter):** Add a dynamic category filter alongside the existing Budget sorting option. It should default to "All", list available categories (including Income, Expenses, Needs, Wants, Debt, Assets, and Liabilities), and automatically include newly created categories, following the Transactions section's behavior. Placed in Phase P20 (`phase/20-budget`) under Rule 4 (new part in existing feature area).
  2. **P29-U-R1 (Dynamic Asset Valuation):** Make valuation inputs and calculations depend on the selected valuation type (manual value input, interest-based rate calculation, unit-based purchase amount/unit price/units purchased calculation, balance-based current balance) across recurring and one-time assets. Placed in Phase P29 (`phase/29-income-recurrence`) under Rule 2 (adjustment to completed subtask P29-U valuation methods).
- Recorded explicit open product questions for both features without inventing decisions. No application code, schema, dependency, version, release, or device checklist changes made. Ordered six gates pass with exit 0.

## P20-Y-R5 Preserve transaction name/note on budget category item rename (Done; CR-139)

- Subtask P20-Y-R5 (CR-139, 2026-11-23): Strictly preserve the transaction name/note as previously set when a budget category item is renamed, updating only the transaction budget category item.
- User reported: when renaming a budget category item (e.g. from 'Bills' to 'Credit Card Bills'), if the transaction budget category item was selected as 'Bills' and name/note was also 'Bills', the transaction budget category item updated to 'Credit Card Bills' (which was wanted) but the transaction name/note also changed to 'Credit Card Bills' (which was unwanted); the transaction name/note must remain as previously set ('Bills').
- Root cause: in `app/(tabs)/transactions.tsx`, `itemTitle` fell back to `linkedBudgetItem?.name` for empty-note transactions, causing the transaction title to dynamically change to the new budget item name; additionally, if note was empty at creation, the original category name was not persisted in note when renamed.
- P20-Y-R5 removes `linkedBudgetItem?.name` fallback from `itemTitle` in `transactions.tsx` (keeping `(item.note || categoryLabel)`), and updates `editItem`, `renameSection`, `editBudgetIncome`, and `reconcileBudgetItemTransactions` to set `note: tx.note ? tx.note : oldName` when renaming, ensuring the transaction's previously set name/note is permanently preserved across both domain and display layers.
- Regression tests in `src/domain/__tests__/budgetItemRenameTransactions.test.ts` and `src/components/__tests__/TransactionsScreen.test.tsx`.
- Ordered six gates pass with exit 0. Physical-device check O77 marked Pass following owner physical-device verification on 2026-11-23.

## CR-140 Owner-reported physical-device validation Pass for O77 (Done)

- Change request CR-140 (2026-11-23): Recorded owner physical-device verification for check O77 as Pass in docs/releases/device-test-checklist.md.
- Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-23.
- Device checklist release gate is unblocked for candidate builds.

## P20-Y-R4 Strictly preserve transaction note across all budget item renames (Done; Revised by P20-Y-R5; CR-138)

- Subtask P20-Y-R4 (CR-138, 2026-11-23): Strictly preserve transaction notes across all budget item, section, and income renames including holding-linked investments, syncing category only.
- In P20-Y-R3, non-holding budget item renames preserved notes, but holding-linked items in `editItem` still updated transaction notes via `matchedTxIds` when note matched `oldName` or deposit templates.
- P20-Y-R4 completely removes `matchedTxIds` transaction note modification from `editItem` in `src/domain/budget.ts`.
- `budgetItemForTransaction` in `src/domain/budgetCategories.ts` is enhanced with a fallback to match sibling holding items using historical budget item records.
- Transaction notes are strictly preserved across expense, section, holding-linked, and income renames even when note equals old item/section name.
- Regression tests in `src/domain/__tests__/budgetItemRenameTransactions.test.ts` (15 passing tests).
- Ordered six gates pass with exit 0. Physical-device check O77 remains Not run.

## CR-137 Prohibit premature app version assignment until release draft (Done)

- Change request CR-137 (2026-11-23): Established standing rule across all policy documents that agents must never add, bump, or assign a specific application version number in the device checklist, metadata tables, package manifests, or anywhere in the repository until the owner explicitly decides to prepare a release candidate draft.
- Updated `## Next release device checks` in `docs/releases/device-test-checklist.md` to keep App version as `TBD (unassigned until release draft finalization)`.
- Next release device check O77 remains pending physical-device validation by the owner.

## CR-136 Device checklist rearrangement for published v1.3.0 (Done)

- Change request CR-136 (2026-11-23): Rearranged `docs/releases/device-test-checklist.md` to move published v1.3.0 checks O61–O76 into dedicated `## v1.3.0 device checks` section placed below `v1.2.0` in ascending version order.
- `## Next release device checks` at the top contains only unreleased checks (O77) for upcoming version 1.3.1.
- Established standing rule across all policy documents: once a release is published, move all checks verified for that specific version into its own `## vX.Y.Z device checks` section placed below previous release checks in ascending order, keeping each specific version's checks strictly under its own release section.
- Next release device check O77 remains pending physical-device validation by the owner.

## CR-135 Device check O77 and feature/fix checklist rule (Done)

- Change request CR-135 (2026-11-22): Added physical device check O77 to `docs/releases/device-test-checklist.md` under Next release device checks in `Not run` status for P20-Y-R3 budget item and section rename note preservation.
- Established standing repository rule across all policy documents requiring physical-device verification check(s) to be added for any feature, fix, bug fix, or revision that modifies user-facing behavior, data integrity, calculations, navigation, or forms.
- O77 is pending physical-device validation by the owner.

## P20-Y-R3 Sync budget category only, preserving transaction note (Done; Revised by P20-Y-R4; CR-134)

- Subtask P20-Y-R3 (CR-134, 2026-11-22): Refine budget item and section rename to sync transaction category only while preserving transaction note.
- Previously in P20-Y-R2, if a transaction note matched the old item or section name, the note was also updated.
- P20-Y-R3 ensures that `editItem`, `renameSection`, `editBudgetIncome`, and `reconcileBudgetItemTransactions` strictly update `transaction.category` to the new name and leave `transaction.note` untouched.
- Regression tests added in `src/domain/__tests__/budgetItemRenameTransactions.test.ts`.
- Ordered six gates pass with exit 0.

## P20-Y-R2 Budget item rename reflects in transaction category item (Done; Revised by P20-Y-R3; CR-133)

- Subtask P20-Y-R2 (CR-133, 2026-11-22): Fix WealthWise bug where renaming an expense or standard budget item did not reflect in transaction category item, leaving transactions showing the old name.
- In P20-Y-R1, transaction updates were gated behind `targetHoldingId`, preventing expense/spend budget items from updating transactions on rename and leaving `tx.category` as the old name.
- `editItem` in `src/domain/budget.ts` now updates `tx.category` and `tx.note` across matching transactions for all budget items within the specified month/following scope, while preserving amount, date, custom notes, and holding links.
- `renameSection` and `editBudgetIncome` update matching transactions within scope.
- `budgetItemForTransaction` dynamically resolves the budget item for non-holding transactions by direct match, note match, or historical rename lookup by item ID.
- `reconcileBudgetItemTransactions` reconciles existing or backup-imported transactions whose category matches an older budget item name; integrated into store rehydration and backup import.
- `TransactionsScreen` in `app/(tabs)/transactions.tsx` updates `categoryLabel` to reflect `linkedBudgetItem?.name || item.category`.
- Regression tests in `src/domain/__tests__/budgetItemRenameTransactions.test.ts` (12 tests) and `src/components/__tests__/TransactionsScreen.test.tsx` (28 tests).
- Ordered six gates pass with exit 0.

## P20-Y-R1 Linked transactions update on budget item rename (Done; Revised by P20-Y-R2; CR-132)

- Subtask P20-Y-R1 (CR-132, 2026-11-22): Fix WealthWise bug where renaming a budget item or category in one month did not update the name shown by transactions linked to that item.
- Linked transactions reflect the current budget item name wherever they appear, including existing transactions, while preserving their amount, date, category (e.g. `'Mutual fund / SIP'`), and budget link source.
- Handles month-specific items and create, edit, display, persistence, migration, and backup-import paths.
- Regression tests added in `src/domain/__tests__/budgetItemRenameTransactions.test.ts` (5 tests passing).
- Ordered six gates pass with exit 0.

## P28-F-R7 Prepare and publish v1.3.0 release candidate (Done; CR-130)

- Subtask P28-F-R7 (CR-130, 2026-11-22): Prepare owner-approved v1.3.0 release candidate.
- Bumps app version in `app.json`, `package.json`, and `package-lock.json` to `1.3.0`.
- Places finalized v1.3.0 release note in `docs/releases/published/v1.3.0.md` with 8 owner-supplied screenshots in `docs/releases/screenshots/v1.3.0/` (About and auxiliary settings screens omitted).
- Retitles device checklist to `## v1.3.0 device checks (next release)` with confirmed metadata; all O1–O76 checks pass.
- Task branch `task/P28-F-R7-prepare-v1.3.0` merged to `qa-and-release` via PR #210, integrated to `develop` via PR #211 (`afeb987`).
- `release/v1.3.0` created at candidate commit `afeb987` and pushed to origin.
- EAS build `c2ec9414-ae63-44cc-b34a-0f67f6cb51cb` (profile `android-apk`, Android `versionCode` 4) completed on 2026-11-22; 107,030,213-byte APK downloaded, privately byte-verified against EAS artifact, and uploaded to GitHub draft release `v1.3.0` as `WealthWise-android-latest-v1.3.0.apk`.
- Task branch `task/P28-F-R7-record-v1.3.0-build` merged to `qa-and-release` via PR #212, integrated to `develop` via PR #213 (`58d9a26`), and synchronized to `release/v1.3.0`.
- Task branch `task/P28-F-R7-align-v1.3.0-readme-screenshots-details` updates `README.md` (v1.3.0 Download block and 8-screenshot gallery), aligns `v1.3.0.md` and `v1.2.0.md` download blocks, updates `release-history.md`, and adds release rules in `AGENTS.md` and `rules.md` requiring candidate README and screenshot alignment during staging.
- Publication approved and completed on 2026-11-22; release/v1.3.0 merged to main via PR #216 (341dbcb); tag v1.3.0 created at 51523b8; GitHub Release v1.3.0 published as Latest by sahilsheikh-dev; post-publication sync merged main to develop via PR #217 (97c6d02); release candidate and publication lifecycle complete.

## CR-142 Reconcile planned and unimplemented roadmap items (Done)

- Change request CR-142 (2026-11-23): Reconciled documentation across repository docs to resolve stale historical plan notes and establish the authoritative inventory of active planned and unimplemented roadmap items.
- Corrected historical CR-113 and CR-110-R1 notes in open-items.md to confirm that P21-F (Emergency Fund target editing) and P43-B (non-release tag cleanup) are Done and released, not planned.
- Confirmed that physical-device checks O1–O77 are all Pass, and the release gate is unblocked.
- The 12 active planned roadmap areas on develop are: P7, P31, P33, P34, P35, P36, P37, P38, P39, P40, P43-E, and P44.

## CR-141 Reconcile documentation to reflect completed v1.3.0 publication (Done)

- Change request CR-141 (2026-11-23): Reconciled documentation across repository docs to accurately reflect completed v1.3.0 publication.
- Updated release-history.md, docs/releases/README.md, memory status, open items, and PROGRESS.md to document that v1.3.0 publication, merge to main (PR #216 at 341dbcb), tag v1.3.0 (51523b8), and post-publication sync to develop (PR #217 at 97c6d02) are fully completed.

## P20-Y Budget payment date, multi-asset budget links, and limited expense categories (Done; device check Pass)

- CR-126 implements three related changes:
  1. Payment date input (defaulting to today, customizable) when marking scheduled/budgeted
     items Paid in Transactions and Budget, propagated to `clearDue`, `clearDuesThrough`,
     and `addTransaction`.
  2. Support for one asset linking to multiple one-time investment Budget items,
     attributing holding entries by category/note and updating the correct holding
     and budget actuals.
  3. Limiting Transaction form Expense categories to user-created Budget items and
     applicable scheduled items (due EMIs, policy premium categories, pending dues)
     plus Custom, while preserving historical removed categories when editing.
- Full six-gate run passes exit 0. Regression tests pass across components, domain,
  and smoke suites.
- Physical-device check O76 validated Pass by owner on 2026-11-22 on realme Narzo 60 Pro 5g
  (Android 15 Vanilla Ice Cream, tester sahilsheikh-dev).

## P20-X Budget category and item sorting (Done; device check Pass)

- CR-125 adds sorting for Budget categories and items throughout WealthWise using
  the existing sorting behavior in Transactions, Assets, and Liabilities as reference.
- Adds SortChip in AppHeader filter toggle panel on BudgetScreen using
  `useSort('budgetSpending')` with Planned, Actual, Percent used, and Name options;
  preserves Income at top while sorting its items; sorts spending/investing
  sections and items within sections; adds sorting support to shared Dropdown
  with SortChip rendered in sheet; connects category dropdowns in TransactionForm
  and BudgetIncomeForm with persistent budgetSpending sort spec; extends
  `budgetCategoryChoiceSections` with pure sortSpec handling.
- Full six-gate run passes exit 0. Regression tests: `BudgetSorting.test.tsx`,
  `Dropdown.test.tsx`, `RouteRenderSmoke.test.tsx`, `budgetCategories.test.ts`.
- Physical-device check O75 validated Pass by owner on 2026-11-22 on realme Narzo 60 Pro 5g
  (Android 15 Vanilla Ice Cream, tester sahilsheikh-dev).
- **P20-X-R1 (CR-129):** Remove sorting option from TransactionForm category dropdowns
  (Expense, Income, Invest) and remove static Search header title from shared Dropdown
  sheet, keeping search placeholder in the input. Regression coverage in `Dropdown.test.tsx`
  and `TransactionForm.test.tsx`. All six repository gates pass.

## P20-S-R2 searchable Dropdowns (implementation complete; device checks open)

- CR-116 adds a default-visible search field and normalized filtering/ranking to
  the shared Dropdown component. **Assumed and confirmed:** no schema, domain,
  demo-data or dependency changes were needed. Existing callers need no edits.
- Full six-gate run is complete. Gates 1–3 and 5–6 exited 0. Gate 4 exited 1
  after one DNS retry on the same known Expo SDK 57 patch mismatch (20/21
  checks); dependencies were not changed. Task PR #164 and phase PR #165 are
  merged and recorded under P20-S-R2-R1; local `develop` was synchronized.
- P20-S-R2-R2 corrects the parent revision-chain record only; it changes no app
  behavior and leaves O61–O64 open.
- Physical-device checks are not run: keyboard behavior on iOS/Android,
  polite result-count announcements, clear-button tap target and font scales
  1.3/2.0. Track these as O61–O64 in the release device checklist.

## P20-U-R1 Budget edit/delete defect (automated implementation complete; device check open)

- CONT3 completed the owner-report matrix on the existing P20-U-R1 branch.
  Confirmed root causes: Income plan/snapshot schedule mismatch fixed by
  `2dc72b5`; optional-field item edit overwrite fixed by `a292f33`; and
  category-line holding-link loss in both scopes fixed by `e4accf5`.
- Automated form/store coverage includes item name, amount/value, start month,
  frequency and due day; Spend, Invest and Income; one-time and recurring cases
  where applicable; month-only and following edits/deletes; non-current viewed
  month; backup restore and demo-data origin. Persistence and rehydration pass.
  H1/H2/H5 are refuted for tested scenarios; H3 was not reproduced in tested
  Budget routes (Alert/reminder entry points not exercised); H4 was confirmed
  and fixed. Details and six gate results are in `docs/PROGRESS.md`.
- O73 remains Not run: on a physical device, restart after edits/deletions and
  verify persistence for Spend, Invest and Income, one-time/recurring items,
  all fields, and both scopes.
- Local-only PR preparation is complete at task commit
  `becbd83c0b18051bf54a00904c6463bd2232f5b3`, after syncing
  `phase/20-budget` with the locally available `develop` commit
  `cb363423384923ef19f00399cd380baba01e9e59`. Gates 1–3 and 5–6 pass; Gate 4
  could not resolve `expo-doctor` (`ENOTFOUND registry.npmjs.org`). No push or
  PR was created during that prep. The owner subsequently merged task PR #180
  at `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` and phase PR #181 at
  `22f332fe9310e92c50d94cc6640c19f4e1552dcc`; both merge commits are verified
  in local refs. O73 is still Not run.

## CR-114 independent entities, empty slots and R7 (2026-11-12)

Restructuring of work tracking completed under CR-114 and merged into `develop` via PR #161 (`9058386`):
- Independent lifecycle entities established: `cleanup`, `qa-and-release`,
  `schema-migration` and `documentation`. They operate on dedicated branches and
  are tracked in Section 13 outside the phase denominator.
- Empty reserved slots established: P7, P27, P28 and P32. Reserved for adjacent
  feature work under R7; no renumbering or ref rewrite.
- R7 slot-filling rule added to AGENTS.md, rules.md, work-placement.md and
  PROGRESS.md.
- Branches: `origin/schema-migration` and `origin/documentation` pushed and
  verified; old `origin/phase/07-schema-migration` deleted.
- Git history map committed at `docs/history/entity-history-map.md`.
- PR #161 merged into `develop` with merge commit `9058386`.

## Cleanup lifecycle work

- **SDK 57 patch alignment (Done):** aligned Expo SDK 57 patch dependencies
  (`expo ~57.0.33`, `expo-constants ~57.0.24`, `expo-linking ~57.0.14`,
  `expo-router ~57.0.31`, `expo-sharing ~57.0.26`, `expo-sqlite ~57.0.5`);
  all six gates passed, with Gate 4 exiting 0 (21/21 checks passed).
  Placement: rule 1; searched dashboard, register, memory; related cleanup
  lifecycle; reason: dependency maintenance is ongoing repository lifecycle work.
  The prior Gate 4 exit 1 owner-approved exception is now cleared.

## CR-113 owner-approved planning (2026-11-12)

The owner approved planning/research and the decisions below. All affected
feature parts remain **Planned**; this update starts no research,
implementation, tag deletion or GitHub issue creation.

- **P21-F (Done):** Emergency Fund target editing was completed and merged
  on 2026-11-21 (PR #170 / #171; revised by P21-F-R1 via PR #172);
  physical-device checks O65–O68 validated Pass on 2026-11-22 and released
  in v1.3.0. No Home edit was needed.
- **P33-A–C:** widgets are reactivated and platform research is approved.
  Android implementation is approved after research/scope confirmation;
  iOS implementation still depends on iOS distribution. No research has
  started.
- **P34-A–C:** renewed quick-capture scope and platform research are
  approved. Research and dependent evaluation remain unstarted.
- **P35-A–C:** permission/platform/policy research is approved, and the owner
  has given a Go for implementation after that research. P35-A research is a
  prerequisite; no research or implementation has started.
- **P43-B (Done):** tag-cleanup scope and the report-only branch/PR/merge audit were
  approved under CR-113. The exact proposed deletion list has not been supplied or
  approved at the time of CR-113; subsequently all 47 non-release tags were deleted
  and release-only tag policy was enforced under approved task P43-B / CR-131 on 2026-11-22.
- **P43-E:** GitHub issue scope, strategy and batching direction are approved,
  including issue creation. No issues are created in this planning-only task;
  verify the ledger inventory and use a separate execution task.
- **P44-A:** use a Transactions header action to open a stack screen. Include
  all inflows in Income with an option to exclude non-earned inflows; count
  linked investment transactions only under Investment. Remaining design and
  implementation work is Planned.
- **P39-A–H:** approved to remain in P39; no lifecycle move.
- **P40-A–B:** approved to remain in P40; P40-B still depends on P40-A.

Full row-level details and verification are in [PROGRESS.md](../PROGRESS.md).
P43-G task PR #157 merged into P43 at
`01e5559f00a3b7008292db07ed7900af0ea8f828`; phase PR #158 merged into
`develop` at `14f539b4c70da1a00e24642fd3e6068091f3ed9c`. CM-2 synchronization
completed after both merges.

## CR-110-R1 planned work

CR-110's original planned-only row is retained and marked **Revised by
CR-110-R1**. Its original five P43 rows are preserved as evidence; P43-C/D
were relocated to P21-F/P20-W (both Done), and P43-A and P43-B are
Done. Only P43-E remains Planned with dependencies and `Evidence: not started`.
The authorized local phase `phase/43-lifecycle-and-transaction-planning` and
task `task/P43-A-plan-cr110` were created from `develop` for the PR flow.
Task PR #146 merged into the phase at
`e4d950adf0344dbe12e2e0d085e83d60538ede68`; the task branch was deleted and
the phase branch is retained. Phase PR #147 merged into `develop` at
`a93feaecfbd591c1b6f27bac15b5839c68d10709`.

- **P43-A — Lifecycle tracking separation:** list `cleanup` and
  `qa-and-release` outside numbered development phases, alongside `develop`
  and `release/vX.Y.Z`; preserve P27/P28 completion evidence. Both remote
  renames are complete and verified: `cleanup` retained the old tip
  `a2fa24f930da15c49f779577eb749b33f11a7059`, and `qa-and-release` retained
  `9d914638e50462cbadef84df3294ed07cbf42732`. The old remote refs are absent.
  Historical branch name: `phase/27-cleanup`; historical branch name:
  `phase/28-qa-and-release`. The stale phase tags remain unchanged.
- **P43-B — Tag and integration audit (Done):** owner explicitly approved
  deleting all non-release tags while keeping only release tags and enforcing
  the release-only tag policy in repository rules. All 47 non-release and
  legacy phase tags (`phase-01-complete` through `phase-30-complete`, and 17
  intermediate phase tags) were deleted locally and on remote `origin` on
  2026-11-22. Only the five verified release tags (`v1.0.0`, `v1.1.0`, `v1.1.1`,
  `v1.2.0`, `v1.3.0`) are retained. Rules in `AGENTS.md`, `rules.md`, and
  `PROGRESS.md` were updated to prohibit non-release tags. Report the audit in
  chat or `/tmp`, not Git.
- **P21-F (Previously: P43-C) — Emergency Fund target editing (Done; Revised by P21-F-R1):**
  the existing persisted Goal.target is reused; schema v23 and backup formats
  remain unchanged. DEC-P21F-FLOOR keeps the effective max(stored target,
  three-month floor) and rejects below-floor input with the existing typed
  validation. One header edit action opens a combined target/allocation form;
  the plan saves through one domain action, one store write and one Undo.
  Target/bucket reflection, demo fixture and v23 backup round-trip tests are
  covered. On the synced task tree, Gate 1 exited 0 (102 suites, 1,365 passed,
  1 skipped; coverage 95.96/92.14/98.03/97.63% statements/branches/functions/
  lines), Gates 2–3 exited 0, and Gates 5–6 exited 0. This session's Gate 4
  attempt exited 1 with `ENOTFOUND registry.npmjs.org`; the owner-supplied run
  exited 1 with 20/21 checks and the six documented Expo SDK 57 patch
  mismatches. The latter is the known owner-approved cleanup exception; the
  network failure is not. Dependencies and app config match `origin/develop`.
  P21-F is integrated into `develop` through PR #170 and PR #171. Task PR #170
  merged at `c877f6d19e35c0b9fbcba90e9722da7531948c8e`; phase
  PR #171 merged at `2e5e18a7a2be207387a7462b039547f51b0e4631`; CM-2
  synchronized local `develop`. P21-F-R1 records this evidence. Home source is
  untouched. Device checks O65–O68 are Not run.
  Placement: rule 4; searched dashboard, register, P21-A–E, phase history,
  roadmap, memory and Emergency Fund/Home/Goals modules; related P21-A–E;
  reason this extends the existing Emergency Fund feature area.
- **P20-W (Previously: P43-D) — Transaction form (D1/D2 integrated; D3 implemented, final gates/PR pending):**
  P20-S-R2 is confirmed on `develop` at merge `6b50a1d`; phase sync commit
  `e44ce6f` and task branch `task/P20-W-transaction-form-categories` are ready.
  D1 is implemented without a persisted-schema change: a new Invest form starts
  with a neutral category until a holding is selected, derives with
  `investCategoryFor`, and blocks Save with the existing missing-holding
  message. D2 is implemented without a persisted-schema change: show
  effective-month Budget-defined categories grouped by section, include a
  Custom entry with a bounded name field, derive the selected section as
  read-only context, and preserve transaction category strings when Budget
  items are deleted. Custom input is stored only in the existing transaction
  category string. Focused TransactionForm and schema suites pass (68 tests);
  existing demo fixtures already include effective Budget items and require no
  change. Pre-sync gates: Gate 1 exit 0 (102 suites, 1,347 passed, 1 skipped);
  Gates 2–3 exit 0 after fixture correction; Gate 4 and retry exit 1 with
  `ENOTFOUND registry.npmjs.org`; Gates 5–6 were not run. Synced-tree gates:
  Gate 1 exit 0 (102 suites, 1,368 passed, 1 skipped; coverage
  95.96/92.14/98.03/97.63%); Gates 2–3 exit 0; local Gate 4 attempt exit 1
  (`ENOTFOUND registry.npmjs.org`); owner-supplied Gate 4 exit 1 (20/21, six
  known SDK 57 patch mismatches; owner-approved cleanup exception); Gates 5–6
  exit 0. Dependencies and app config did not change since the owner run. Task PR #174 merged at `419a37b07e6853b3c683d22ec243ea58223514c1`; phase
  PR #175 merged at `9e47856f20848e03ac6a4b8e699f47c387d08161`; CM-2 synchronized local `develop`. P20-W
  D3 implementation commit `f2541fd` is on the current v24 task branch; final
  gates and PR integration remain pending. O69–O72 remain Not run.

  Integration evidence: P20-W-R1 records task PR #174 merge `419a37b07e6853b3c683d22ec243ea58223514c1` and
  phase PR #175 merge `9e47856f20848e03ac6a4b8e699f47c387d08161`. D1/D2 are integrated; P20-W remains open for D3. O69–O72 remain Not run.

  **D3 implemented on schema v24** under DEC-P20W-D3-SCHEMA24. The existing
  `BudgetIncomeItem.category` field is a trimmed nonempty string up to 60
  characters; v23→v24 is identity-preserving. Backup format v1 and imports
  v1–v23 remain supported, including plain/encrypted custom-category round
  trips. `.premigration.v23` is archived and removed by erase-all. Custom
  earned-income entry is available in the Budget income and Transaction forms;
  labels, filtering, and a deterministic demo override preserve the custom
  value. Focused verification passed (8 suites / 524 tests). Gates 1–3 and 5–6
  passed; Gate 4 exited 1 with `ENOTFOUND registry.npmjs.org`. Task PR #182
  and phase PR #183 are merged (see the verified SHAs in the current status
  reconciliation). O69–O72 remain Not run; O71 now checks
  custom income persistence and reopening on device. **STOP GATE RESOLVED (DEC-P20W-D3-SCHEMA24,
  2026-11-21):** P20-W owns v24 and P36-A/B remain on v25.
  Placement: rule 3; searched dashboard, register, phase history, roadmap,
  memory, P20-W/P20-O/P20-P records and income/transaction form modules;
  related P20-W D1/D2 and P36-A/B; reason this widens the existing open
  Budget/category behavior after the owner resolved schema ownership.
- D3 task/phase PR integration is complete: PR #182 merged into
  `phase/20-budget` at `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`, and PR #183
  merged into `develop` at `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db`; the
  owner snapshot confirms `mergedBy` and timestamps. O71 is implemented but
  Not run; O73 and O74 remain unchanged and Not run.
- **P43-E — GitHub issue strategy (plan only):** one issue per ledger part
  or CR; phase/type/status labels; release milestones; pending issues open;
  completed issues retrospective and closed; verified commits, PRs, merge
  SHAs and original dates in each body; one retrospective comment per issue.
  GitHub sets actual timestamps; original dates are text only. About 216
  ledger parts need deduplication; assess API rate, batching and noise.
  Strategy, scope and batching are owner-approved; issue creation was not
  started in CR-113 and requires a separate execution task.
- **P43-F — Work placement and CM-2:** add R6, an indexed guide, ledger tests,
  a placement audit and CM-2 activation. Test-first commits and the complete
  six-gate run are recorded in [PROGRESS.md](../PROGRESS.md); all gates passed
  after retrying the network-dependent Expo Doctor gate. Task PR #153 merged
  into P43 at `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154
  merged into `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`.
  P43-F-R1 records these merge SHAs. No feature implementation is included.
- No app implementation, tag operation, issue creation or history rewrite is
  included. The branch/PR/merge-balance report is not a Git deliverable. The
  test-first commit is `e5114e01f363d6de5a12acb61886039469d4a86f`.
  Full plan and final evidence: [PROGRESS.md](../PROGRESS.md).

## CR-111 planned work

CR-111 includes P20-A-R3 implementation/tests (complete locally; PR integration
blocked on Gate 4 network access), Planned P44-A–P44-D feature work, and active
CM-2 repository procedure. P20-A-R3 revises completed P20-A-R2 and remains
in progress until `npx expo-doctor` passes and task/phase PR integration can
proceed. See [PROGRESS.md](../PROGRESS.md) for commits, actual gate exits and
merge commands.

- **P20-A-R3 — Linked one-time savings Paid from Transactions:** real-store
  regressions reproduced two storage-placement failures: a plan-only link was
  absent from the displayed month snapshot and the pending row lost its
  holding ID; a snapshot-only link in another month did not attribute a
  holding-entry actual to the Budget line. The shared domain fix resolves the
  holding link from the plan and retains actual attribution across stored
  snapshots. H1 is confirmed for plan-only links; the H2 symptom is reproduced as
  cross-month snapshot-link attribution, but the generic `Other investments`
  transaction category alone is not the cause when the holding link is resolved.
  H3 is refuted for a recurring Budget row linked to a manual one-time
  holding. Tests cover real store-action creation and persistence rehydration,
  current and different viewed months, plan-only/snapshot-only/both/neither
  locations, following-scope creation then month-only edit, v20–v23 plain
  backup import/migration, demo data, the real Transactions pending row,
  `/payment-confirm`, and a cold-start reminder tap. Exact/lower/higher ×
  Savings/Cash/Other cases and Fixed Deposit rejection remain covered. Home
  lists only `kind === 'due'`; Budget shows counts for Budget pending items but
  has no Paid action, so neither exposes the Budget-row Paid flow. The owner's
  exact data origin and reproduction steps remain unknown. Gate 4 exited 1
  (`ENOTFOUND registry.npmjs.org`); other ordered gates passed, with final
  focused route tests, TypeScript and lint rerun after assertion strengthening.
  Physical-device check O74 is Not run. No schema bump, dependency change or
  protected-file edit.
- **P44-A — Design:** owner approved a stack route opened by a Transactions
  header action; include all inflows as Income with a toggle to exclude
  non-earned inflows, and count linked investment transactions only as
  Investment. Home is user-owned, Budget is protected and
  tabs remain Home/Transactions/Goals/Budget; do not edit Home or Budget
  without explicit authorization. A Budget section remains an alternative,
  not the default.
- **P44-B — Pure selector:** depends on P44-A. Add an injected-date pure
  `src/domain/` selector for daily totals by transaction type for one month,
  with no React/Expo imports, clock reads or randomness. Tests include a
  seeded oracle and 50-year and 126-year stress fixtures.
- **P44-C — Screen and route:** depends on P44-B. Add a stack route, month
  navigation, one-at-a-time Expense (default)/Income/Investment toggle and
  day detail. “Infinite” means previous/next navigation clamped to available
  data plus the current month, not an infinite rendered list. Group
  transactions by date in one pass per month and meet existing stress-tier
  budgets. Use font-scale tests at 1.0, 1.3 and 2.0.
- **P44-D — Demo/layout/accessibility:** depends on P44-C. Add DEC-DEMO
  fixtures, simulated layout tests, accessibility checks and device
  checklist rows. Cells need exact-date/amount accessible labels, numeric
  day labels and a bucket-range legend; color alone cannot carry meaning.
  Targets are at least 44pt; support dark/light/all themes and explicit-tier
  `AmountText`/`formatAmount`. Use a plain seven-column React Native View;
  no new dependency or charting library.
- P44-A placement and counting decisions are approved by the owner (CR-113).
  Five intensity buckets are relative to
  the visible month's maximum, with an option for a trailing-12-month
  percentile to resist outlier flattening. No persisted schema change is
  Assumed; any user setting belongs in the meta store, not AppData.
- Separately approvable P44 candidates (none included as committed scope):
  weekday average spend; no-spend-day count and longest streak; top spending
  days with day transaction tap-through; month-over-month delta; payday
  effect (seven days after main income vs. the rest); biggest category on
  day tap; and a Budget over-plan overlay. More than three add-ons would
  bloat v1. Recommended v1 is the heat grid, day detail, weekday summary and
  no-spend streak.
- **CM-2 — Git sync rule:** Active and enforced in `AGENTS.md`, `rules.md`,
  `CONTRIBUTING.md` and PROGRESS section 3 using the owner's exact sentence.
  It does not authorize pushes. No app behavior, schema, demo data, device
  checks, tags or history changes are part of the rule.

## CR-112 closeout

- P43-A and P43-F are Done. Remote `cleanup` and `qa-and-release` were each pushed at
  their original tips, compared against the old refs before deletion, and
  verified afterward with only the new remote names present. Tag targets and
  all six protected blob IDs remain unchanged. See the rename evidence in
  [PROGRESS.md](../PROGRESS.md).
- P43-F adds R6 and the indexed work-placement guide. Test-first commits:
  `e2f0263`, `d24acd9`, `e7c134a`, `770393d` and `bdbe159`; rules/guide commit
  `7dab04b`; placement-audit commit `5841373`. The initial Expo Doctor attempt
  exited 1 on `ENOTFOUND registry.npmjs.org`; the network retry passed 21/21,
  then all six ordered gates exited 0. Gate 1: 101 suites, 1,324 passed,
  1 skipped; coverage 95.96/92.15/98.02/97.62%. Task PR #153 merged into
  P43 at `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154 merged
  into `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`. No
  physical-device check was run.
- P31-E CI work moved to `qa-and-release` lifecycle tracking under rule 1.
  It is still Planned and needs a real PR run before branch protection.
- P39-A–H remain in P39 by owner decision (CR-113); no lifecycle move.
- P40-A/B remain under Agent-context hygiene by owner decision (CR-113); no
  lifecycle move. P40-B remains dependent on P40-A.
- All placements, exact row mappings, count changes and assertion replacements
  are in [PROGRESS.md](../PROGRESS.md). No Planned application feature was
  implemented and no device verification is claimed.

## v1.2.0 release close-out

- v1.2.0 was published on 2026-11-11. Release PR #124 merged
  `release/v1.2.0` into `main` at
  `2e419f8c7d482adc7523b380fe5b71d3bf15dce3`; tag `v1.2.0` points to exact
  candidate `199ebed307ce7755bc92c1f15544999d852db54f`.
- EAS build `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` succeeded with profile
  `android-apk` and `versionCode` 3; its 112,163,081-byte artifact was
  byte-verified against EAS. The latest and four versioned APK URLs returned
  HTTP 200 with expected sizes.
- All 104 release screenshot image/link URLs returned HTTP 200; each of the
  52 raw image sizes matched its repository file. Historical release
  screenshot sections were updated while preserving non-screenshot body
  content, and v1.1.1's former latest APK was renamed to its versioned name.
- Task PR #125 merged the README/gallery/latest-note parity, prior-version
  APK link and release-history updates into the retained phase as
  `87c8e8f902c313c35e7d48e154ec8d9c9f504789`. The phase-to-develop PR,
  develop-to-main synchronization and main-to-develop back-merge are complete
  through PRs #127, #128 and #129. Final ledger/test evidence was merged and
  synchronized through PRs #130–#133; `main` and `develop` trees match.
- The final ledger/test correction task PR #134 merged into the retained
  `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at
  `2d3a0f6`; see the P28-F-R6-R2 ledger entry.
- P28-F-R6-R3 task PR #138 merged into the retained phase at `6f5b1cb`;
  phase PR #139 merged to `develop` at `fd7ba55`. O45-O60 are recorded as
  owner-reported Pass, with device identity details absent.
- O45-O60 are owner-reported Pass (2026-11-11); device model, OS version and
  tester were not supplied.

## CR-108 completion and future scope

- CR-108 is complete: P41-B-R1 task PR #108 merged into the retained phase as
  `e1db78e`, and phase PR #109 merged to `develop` as `5cb4957`. All six
  ordered gates pass; detailed commands, coverage and PR evidence are in
  [PROGRESS.md](../PROGRESS.md). The owner reports O45-O60 physical-device
  checks passed on 2026-11-11; device/tester details were not supplied.

## CR-109 integration

- P42-A is integrated into `develop`: task PR #142 merged into the phase at
  `8f38e9f`, and phase PR #143 merged into `develop` at `8988121`. The six
  ordered gates passed again on integrated `develop` and were repeated on the
  P42-A-R1 task tree; no app behavior changed.

## Owner-approved planned direction (2026-11-11)

- A true in-app update check is approved for future planning. The current
  About action remains browser-based after confirmation and makes no
  app-side request; no in-app checker is implemented.
- Once-only frequency for investment plans or liabilities is approved for future planning (subsequently cancelled by owner decision on 2026-11-22; see Recently resolved);
  schema v23 and current forms remain unchanged until separately scoped.
- Public adoption is an approved future project goal; no launch campaign or
  community-response commitment is authorized by this decision.
- P31-D privacy statement is approved. It remains Planned, depends on P39-C,
  and must use verified source facts.
- The owner confirms Sahil Aspak Sheikh as the MIT copyright holder; the
  existing `LICENSE` notice already uses that name.
- P40-B is approved and Planned after P40-A. P40-A remains Planned.
- Configure branch protection after P31-E passes a real PR run; this
  follow-up is owner-approved and Planned.
- Retain the existing stale phase tags `phase-28-complete` and
  `phase-29-complete`; no tag mutation is requested.

Not adopted in CR-106:

- ClaudEx Loop and the agent-swarm kit: no demonstrated repository need for
  additional external agent orchestration or its maintenance surface.
- Shunt: it is not Claude Code and relies on a third-party 0.1.0 hook; the
  identified root cause is progress-ledger size, not a missing tool hook.
- GDPR consent/processor items: no server or analytics is described in the
  verified app architecture; do not add server-processing controls without a
  verified processing surface.
- Show HN, GitHub Discussions and issue-response items: not adopted by this
  decision; evaluate them separately against community-response capacity.

## Recently resolved

- **Once-only frequency for investment plans or liabilities cancelled (2026-11-22):**
  The owner decided not to implement Once-only frequency for investment plans or
  liabilities; investment plans retain existing manual (one-time) and recurring
  plan kinds, and liabilities retain existing one-time and recurring EMI structures.
  No schema or form changes will be made.
- **P29-J is resolved for now (2026-11-11):** the owner confirms the current
  actual-days/365 behavior is satisfactory; no statement comparison or
  calculation change is requested. Reopen only if new bank evidence is later
  supplied and a comparison is requested.
- **CR-3 is resolved by owner acceptance (2026-11-11):** the existing Save
  behavior in `profile-form.tsx` and `transaction-form.tsx` is satisfactory;
  no UI change is requested.
- **Dependency audit accepted (2026-11-11):** the owner accepts the last
  recorded advisory snapshot for now; no dependency changes are requested.
  P39-E remains Planned for the broader report-first dependency audit.
- **No fresh backup is requested (2026-11-11):** the owner accepts the
  existing snapshot; no backup data was altered or regenerated.
- **Node 26 is accepted; no Node 24 repair is requested (2026-11-11):** the
  project remains pinned to Node 26.13.0.
- **The owner accepts the previous documentation-only verification scope
  (2026-11-11):** that prior update ran the focused ledger test, not the full
  suite or six gates; this records the actual scope without retroactively
  claiming a full run.
- **`codex-changes` was deleted at the owner's direction; no work is to be ported
  (2026-11-11):** its obsolete schema-v2 loan/liability changes,
  attempted Home edit, generated coverage output and migration defect are
  detailed below and in [PROGRESS.md](../PROGRESS.md).
- **Retain the existing stale phase tags (2026-11-11):** the owner directs
  keeping `phase-28-complete` and `phase-29-complete` as-is. No tag was moved.
- **Owner roadmap decisions (2026-11-09):** accessibility is the planned
  statement and audit checklist, not new app features. The owner supplied all
  23 versioned screenshots, so P32-A/B/C capture work is cancelled; no new
  captures or capture script are needed. Widgets, quick capture (shake,
  double-tap back or key combination) and notification/SMS detection are
  Planned, with research/reactivation requirements retained. P33-C still
  requires iOS distribution. These research and scope gates were updated by
  the owner's 2026-11-12 approvals in CR-113; P35-C remains gated on completed
  P35-A research. Notes includes text, voice/audio recordings, photos and
  videos; its planned migration impact is now schema v25 after CR-108's v23
  release. Skeleton loading is planned as P38. See
  [PROGRESS.md](../PROGRESS.md) for the recorded acceptance scope.
- **Release screenshots and APK handoff:** all 23 owner-supplied screenshots
  (7 for v1.0.0, 8 for v1.1.0 and 8 for v1.1.1) have been copied to
  `docs/releases/screenshots/vX.Y.Z/` as
  `WealthWise-vX.Y.Z-screenshot-<screen>.png`. All 46 main-branch blob/raw
  URLs returned HTTP 200; raw image sizes matched the committed files. The
  release bodies now use browser-viewable links and the 23 screenshot assets
  were removed; each release retains only its unchanged APK.
  The owner-provided APK for EAS build
  `ecc97480-7229-41ac-8aad-64ea2cd255b5` is byte-verified against EAS
  (app 1.1.1, `android-apk`, `versionCode` 2), and the published
  `WealthWise-android-latest-v1.1.1.apk` matches the approved APK. v1.1.1 is
  latest-published. The v1.1.0 APK now uses its versioned filename; the latest
  and affected versioned APK URLs return HTTP 200 with expected sizes.
  The README Download block remains byte-identical to the latest published
  note; its screenshot gallery contains the v1.1.1 set. No APK Download block
  changed.
- **CR-107 decisions and closeout:** the owner resolved the repository
  screenshot decision as YES; this supersedes the earlier "no screenshots in
  the repository" decision. Capture work P32-A/B/C remains cancelled because
  the owner supplied all images. The owner-authorized `develop` -> `main` ->
  `develop` exception changed no version, tag or release publication state.
  Only the v1.0.0 screenshot section was changed in its release body; its
  existing non-screenshot difference from the published note was preserved
  at the owner's direction. The v1.1.1 APK does not contain the demo-data
  revision. All six gates and output/asset evidence are recorded in
  [PROGRESS.md](../PROGRESS.md).
- **Remote branch audit (2026-11-09):** fetched all 36 remote branches and
  checked their ancestry against `develop` and `main`. Every remote branch is
  integrated into `develop`; `release/v1.1.1` is integrated into `main`;
  `main`, `develop` and the release branch have identical trees. No open PRs
  or pending merge work remain. The stale local `main` was fast-forwarded.
- **APK handoff rule (2026-11-09):** the existing guide already required
  `eas build --platform android --profile android-apk`, artifact download and
  draft upload without waiting for the owner to build or upload. Clarified in
  the shared rules and all release guides that the agent must not ask the
  owner/developer to provide an APK or local APK path.
- **Owner-edit handling:** P20-S-R1-R1 records R5 in root
  [AGENTS.md](../../AGENTS.md): ask before changing a file with owner edits
  made after agent changes, and revert or overwrite those edits only when
  explicitly requested. Task PR #44 is merged; phase PR #45 promotes the
  revision to `develop`. See [PROGRESS.md](../PROGRESS.md).
- **Release 2 device checks N39-N43:** the owner reported all five checks Pass
  on 2026-11-08. The device checklist records Pass for income recurrence and
  backup restore, immediate edit refresh, aggregate Pace, linked paid sync and
  Undo, and Entries counts/schedule caps. Device model, Android version and
  tester remain blank as requested.
- **P20-A-R2 device check N44:** the owner reported Pass on 2026-11-09 for
  marking a linked one-time savings item Paid from Transactions, verifying
  that a holding entry is created, and confirming Undo removes it. The
  checklist records Pass; device identity fields remain blank.
- **P28-F-R1 GitHub sync:** owner-reported N39-N43 results are included in
  merged PRs #1-#3. P28 was integrated into develop, the release branch
  into main, and main back into develop. The merged PRs and remote tips are
  recorded in [PROGRESS.md](../PROGRESS.md).
- **P28-F-R2 contributor correction:** the v1.1.0 draft matches the linked
  contributor credits in v1.0.0, and the template requires release-specific,
  verified contributors. This correction is included in PRs #1-#3.
- **P28-F-R3 v1.1.0 publication:** the owner-approved release is published
  with its versioned latest APK asset. The tag points to the
  verified EAS source commit; the uploaded artifact matched the EAS build,
  and latest/versioned links returned HTTP 200 at 112,147,677 bytes. The
  owner-approved `preview` profile and reused versionCode 1 exceptions are
  recorded in the release history. PRs #11-#15 merged task -> P28 ->
  develop -> release -> main -> develop; all four remote trees match and the
  v1.1.0 tag remains unchanged.
- **P28-F-R3-R2 historical asset rollover:** v1.0.0 now downloads from its
  own versioned APK filename and URL; the generic old URL returns 404. Its
  GitHub release body matches the checksum-free published note. Latest and
  affected versioned URLs return HTTP 200 with the expected sizes.
- **P28-F-R3-R3 latest APK filename:** v1.1.0 now uses
  `WealthWise-android-latest-v1.1.0.apk`; the README, published note, release
  history and GitHub release body match. Latest and versioned v1.1.0 routes
  return HTTP 200 at 112,147,677 bytes. The old v1.0.0 filename has no
  `latest` marker and returns HTTP 200 at 112,133,413 bytes. PRs #21-#25
  merged task -> P28 -> develop -> release -> main -> develop. The four
  remote trees match; the v1.1.0 tag was not changed.
- **P28-F-R2-R1 audit correction:** task PR #4 merged into P28 and PR #5
  merged P28 into develop; PR #6 carries the release branch to main and
  PR #7 is the main-to-develop back-merge. The full sequence preserves
  task -> phase -> develop -> release -> main -> develop.
- **P29-O-R1 scope close-out:** P29-O is superseded by the accepted P29-O1
  holding workflow and the explicit P29-S cancellation of the separate
  ledger-only migration. No app implementation remains in scope; P29 is
  41/41. The owner reports the P29-O1 physical-device checks below passed on
  2026-11-11.
- **Local `codex-changes` branch:** deleted on 2026-11-08 at the owner's
  direction. Commit `d033d6a` attempted an obsolete schema-v2 loan/liability
  model, included generated coverage output, changed the protected Home screen,
  and contained a data-loss migration defect. It was never merged; no work is
  to be ported.
- **P29-O1-R2 / P29-W-R2 Entries layout:** completed/pending month counts now
  use paired summary cells on Assets and Liabilities; pending schedule rows
  are sorted together with dated entries. Focused route tests pass at font
  scales 1.0, 1.3 and 2.0. No schema change.
- **CM-1 commit-subject enforcement:** old subjects could be non-descriptive;
  the new hook requires supported Conventional Commit types and rejects
  placeholders. The reason is to keep scope explicit and unrelated changes
  separate; proposed subjects and staged diff-stats are shown before commit.
  The hook and docs tests pass.
- **P28-C-R4 release documentation:** completed; the README and latest
  published Download blocks match, public digest/commit identifiers are
  absent, and the task is integrated into `develop`. The authorized refs were
  pushed and verified. The release body remains intentionally unchanged.
- **P28-E remote history:** all 30 phase branches, `history/by-phase`, and 30
  annotated phase completion tags were pushed and verified. `main`, `develop`,
  and the v1.0.0 tag were also verified; v1.0.0 was not changed. No force push
  was used.
- **P28-E-R4 history graph integration:** task PR #49 merged into P28
  (`7f9221a`), then P28 PR #50 merged into `develop` (`b5dbe5f`). The
  `history/by-phase` tip and every remote branch tip are reachable from
  `develop`. `main` and `release/v1.1.0` remain at
  `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`, with tree
  `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. The task branch was deleted;
  P28 is retained. Verification is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R5 historical main commit audit:** the 403 non-merge commits after
  the initial commit are already integrated into `main` and `develop`; 84
  legacy subjects fail the current Conventional Commit hook. Do not rewrite
  these original commits: a PR cannot change commit provenance or subjects
  retroactively. The owner-selected `release/v1.0.0` branch was created at
  the existing v1.0.0 tag target and is already an ancestor of `main` and
  `develop`. Task PR #52 merged into P28 as `f9bb715`, and P28 PR
  #53 merged into `develop` as `0402592`. P28-E-R5-R1 records this final
  integration; no application code or protected branch tip changes.
  Evidence is in [PROGRESS.md](../PROGRESS.md).
- **P28-E-R3 ancestry reconciliation:** owner-authorized `ours` merges record
  `f994457`, `7bea8e6` and `b779c21` as ancestry on the task branch without
  changing the captured `develop` tree. The accompanying changes are limited
  to ledger/memory documentation and a ledger test. At R3 completion, the
  archive was still separate; P28-E-R4 is connecting it. `main` and its
  v1.1.0 tag remain untouched. Task PR #47 merged into P28 and PR #48
  promoted R3 to `develop`. Details are in [PROGRESS.md](../PROGRESS.md).
- **P28-F-R3 GitHub integration:** PR #11 merged the publication task into
  P28 (`a2f9db2`), #12 promoted P28 to develop (`3e2a5a8`), #13
  merged develop to `release/v1.1.0` (`d4d69fa`), #14 merged that release to
  main (`b0aeef9`), and #15 back-merged main into develop (`6f5df18`). The
  publication task branch was deleted; the phase branch remains at its
  recorded tip. Main, develop, release and P28 have identical trees.

## Unresolved

- **Physical-device validation report (2026-11-11):** the owner reports that
  all device checks listed in the previous assistant summary passed. The
  categories and owner-reported Pass results are recorded as O54-O60 in the
  [device checklist](../releases/device-test-checklist.md). This supersedes
  older pending/unverified wording for the covered device checks below and in
  the physical-device section. Device model, OS version and tester details
  were not provided; these remain owner-reported, not independently observed.
- **P20-S-R1 device check:** owner reports the physical-device rendering check
  passed on 2026-11-11.
  Owner approved commit/merge; SegmentedControl labels removed by the owner
  remain absent. Final gate results and PR integration are in
  [`PROGRESS.md`](../PROGRESS.md). Implementation commit `d36103e` is in
  task-to-phase PR #42; phase-to-develop PR #43.
- **CR-107 demo display:** route tests verify the Rs 1 crore Assets total at
  simulated font scales 1.3 and 2.0. The owner reports physical-device
  rendering at both scales passed on 2026-11-11.
- **v1.1.1 release:** the owner-approved patch release was published on
  2026-11-09 after PR #69 merged it to `main` and PR #70 back-merged it to
  `develop`. Tag `v1.1.1` points to the main merge commit. The owner-run EAS
  APK build was verified against the uploaded asset and published as the
  latest APK. The v1.1.0 asset was renamed to its versioned filename, and
  README, release notes, release history and latest screenshots are aligned.
  N44 is owner-reported Pass; device identity fields remain blank.
  Direct source-tree comparison confirms v1.1.0
  contains the P30 SQLite persistence repair; v1.0.0 predates that repair.
  Neither release should be described as bug-free, and user impact is not
  established by the available checks.
- **Branching baseline exception:** the initial `develop` baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d` was created from current main,
  which contains legacy unreleased Release 2 work. Branch protection and
  release-only main merges apply prospectively; no history rewrite was made.
- **Local-only branch audit:** the release-policy commits are integrated
  through PRs #21-#25; their merged task branch was deleted as required.
  Other local task branches whose commits are already in `main` remain local
  only because merged task branches are deleted by policy. P28-E's final
  verification commit `72fb325` is preserved and its stale status text is
  reconciled on the P28-E-R2 task branch for chronological PR integration.
  The obsolete `codex-changes` commit `d033d6a` targeted schema v2 rather than
  current v23, included generated coverage files, attempted a protected Home
  edit, and had unsafe migration behavior and a failing migration assertion.
  It conflicts with current `main` and was deleted at the owner's direction;
  no port is needed or authorized.
- **v1.0.0 and v1.1.0 preview APK artifacts:** historical releases v1.0.0 and
  v1.1.0 distribute preview build APKs (built with EAS `preview` profile and
  versionCode 1) rather than production builds. The owner confirmed keeping
  these historical releases as-is while explicitly noting in their published
  release notes, release history, and build configuration that they are preview
  build APKs. v1.1.1 and v1.2.0 distribute production `android-apk` builds with
  incremented version codes.
- **Stale phase tags (owner decision, resolved 2026-11-11):**
  `phase-28-complete` and `phase-29-complete` remain on their historical
  targets by owner direction. No tag was moved.
- **P29-O1-R2 / P29-W-R2 integration:** task and phase merges are included in
  the v1.1.0 release on GitHub main and develop through the merged PR chain.
- **P29-O1-R2 / P29-W-R2 physical-device check:** the owner reports paired
  count-cell layout and date ordering on Assets and Liabilities at font scales
  1.3 and 2.0 passed on 2026-11-11.
  TestRenderer checks are simulated. The six ordered repository gates pass
  locally; integration is complete on `develop`.
- **Pre-build synthetic v13 equality:** automated coverage now imports a
  deterministic, checksummed v13 backup through `parseBackup` and compares
  source-derived net worth, every goal's saved amount and Emergency Fund
  available amount. The owner reports physical-device backup/restore checks
  passed on 2026-11-11; they remain listed in
  [`build-config.md`](../releases/build-config.md) as the procedure.
- **P26-A physical-device checks:** owner reports the touch-target, scalable-label,
  text at 1.3x/2.0x, focus order, announced form errors, color-only status,
  screen-reader navigation, cold hydration, first render and action-write
  checks passed on 2026-11-11. Jest/TestRenderer and Node benchmarks are not
  device evidence. `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` remain
  user-owned/report-only surfaces under the P26-A scope.
- **P29-AA Emergency Fund links resolved (2026-11-06):** repeated failing
  reproduction and store coverage confirmed valid links for Cash, Savings,
  Fixed deposits and recurring plans. Plan deletion now clears EF bucket and
  goal links in the same write; hydration repairs dangling links once and
  preserves valid links, net worth and goal values. No schema change.
- **Emergency Fund form font-scale and device check:** owner reports the
  resolved link picker and EF allocation form passed at 1.3x and 2.0x on
  physical devices on 2026-11-11.
- **P29-Z documentation verification (historical, superseded 2026-11-08):**
  source wins over docs; current schema v22 and the migration/archive chain
  through `.premigration.v21`, Foreclosure labels, Home-only menu rule and real
  Gate 1 counts are recorded. P29-Z made no behavior, schema or UI source
  change.
- **Home-only global menu physical-device check (2026-11-05):** the owner
  reports the three-dot options menu remained present on Index/Home and absent
  on Assets, Liabilities and detail screens, including backup, reminders,
  security, profile and theme routes at font scales 1.3 and 2.0. Pass reported
  2026-11-11.
- **Recurring asset stop/resume label physical-device check:** owner reports
  active recurring cards showed Stop investment and stopped plans showed Resume
  investment in the shared instrument-card row; Pass reported 2026-11-11.
- **Holding and liability layout physical-device check (2026-11-05):** the
  owner reports the two-column investment Summary, same-row liability actions,
  conditional Entries button and liability Summary/details layout at font
  scales 1.3 and 2.0 passed on 2026-11-11. Automated route, ownership and focused font-scale
  tests pass, and all six gates exit 0.
- **Holding layout validation (2026-11-05):** the owner-edited holding screen
  passes the focused route smoke test at font scales 1.3 and 2.0. All six gates
  are green: 92 suites passed, with 1192 tests passed and 1 skipped.
- **Merged holding summary card physical-device check:** the owner reports the
  Recurring plan and Summary information remain readable in one card and
  Stop/Resume stays in the action row at font scales 1.3 and 2.0; Pass reported
  2026-11-11.
- **P29-Y resolved (2026-11-05):** Gate 1 was repaired from `91` passing suites
  plus one stale `memoryDocs.test.ts` failure to `92` passed suites and `1191`
  passed tests with `1` skipped at that repair step. The final real run is
  `1192` passed tests with `1` skipped (1193 total). The project inventory, status memory and
  ledger now match the repaired run; all six gates pass.
- **P29-X physical-device checks:** the owner reports stop/resume
  confirmation, inclusive stop-date filtering, stopped card text, past unpaid
  dues, Deposit availability and one-write Undo passed at font scales 1.3 and
  2.0 on 2026-11-11, including the native SQLite archive/restart check.
- **P29-X assumption:** `stopDate` is the last inclusive scheduled date. Resume
  removes the field; it restores schedule rows without rewriting entries or
  linked transactions.
- **P29-W physical-device checks:** the owner reports closure-date selection
  and outstanding recalculation, overpayment/shortfall confirmations,
  one-write Undo, future-due removal, Closed filtering, read-only
  payment/schedule rows, note-only editing/deletion, font scales 1.3/2.0 and
  native SQLite archive/restart behavior passed on 2026-11-11. Jest and Expo
  exports do not verify native interaction, persistence or layout.

- **P29-V physical-device checks:** the owner reports AsyncStorage migration
  byte comparison before removal, fallback after restart, all four stress
  tiers loading/Undo, native SQLite capacity, hydration, actions, selectors,
  memory and first render, and plain/encrypted 50-year backup round trips with
  larger tiers refused before temporary-file creation passed on 2026-11-11.
  Node measurements and Expo exports do not prove device behavior.

- **P29-O2 cancelled by owner (P29-S, 2026-11-05):** do not implement the
  ledger-only schema-v19 storage redesign. Its converter, alternate v19
  schemas/types and prototype tests had no production callers and have been
  removed. The cancelled storage design does not affect the current schema
  v22; P29-O1's unified holding actions remain supported. Historical
  preparation commits are retained; see
  DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE in [PROGRESS.md](../PROGRESS.md).
- **P29-O1 physical-device checks:** the owner reports manual and recurring
  holding cards, Entries, opening amount edits, Recurring plan details at
  font scales 1.3 and 2.0, the 10,000 + five 1,000 deposits - 2,000 withdrawal
  case showing Invested 13,000 and seven rows, and Fixed-deposit maturity
  withdrawal passed on 2026-11-11.
  Jest and Expo exports do not prove native layout or interaction.
  Automated validation is complete: 90 suites/1140 tests, TypeScript, lint,
  Expo Doctor 21/21, and Android/iOS exports all pass. Coverage and assertion
  counts are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-T physical-device checks:** the owner reports adding, editing and
  deleting dated deposits and withdrawals on or before a valuation updated
  manual and plan values once, in the same write; Undo restored the entry and
  linked transaction. Goal, Emergency Fund, net-worth and Budget-linked flows
  at font scales 1.3 and 2.0 also passed on 2026-11-11. Jest and Expo exports
  do not verify native persistence, rendering or interaction. Budget's current
  linked-actual selector is transaction-based, not a current-holding-value
  display; that display was not redesigned.
- **P29-U physical-device checks:** the owner reports configured accrual and
  units-price values, manual confirmation, staleness notices, the optional
  monthly reminder at font scales 1.3 and 2.0, v18-to-v19 migration,
  confirmed-value reset, and entry-price/withdrawal interactions passed on
  2026-11-11.
  Node tests and Expo exports do not prove native layout,
  persistence or notification scheduling. Automated validation passes:
  91 suites/1170 tests and all six ordered gates exit 0; directory coverage
  and the exact calculation method are recorded in [PROGRESS.md](../PROGRESS.md).
- **P29-U model constraint:** recurring plans already require `ratePct` in
  the v18 model and use it for the plan projection. That existing required
  field is preserved; valuation metadata remains optional. Manual holdings
  may omit `ratePct` unless accrual is explicitly selected.
- **P29-L complete:** the Insurance dependency inventory, simplification and
  v16-to-v17 migration are recorded in [PROGRESS.md](../PROGRESS.md). The
  former P29-G cover-goal feature is removed; Home remains unchanged. The owner
  reports its physical-device checks passed on 2026-11-11.
- **P29-J bank-balance comparison:** resolved for now. The owner confirms the
  current actual-days/365 method is satisfactory; no statement comparison or
  calculation change is requested. Reopen only if the owner later supplies
  bank evidence and asks for a comparison.
- **P29-F2 headroom targets withdrawn:** the 92% `src/domain/budget.ts` and 88%
  `src/data/createAppStore.ts` targets were advisory and are no longer requirements.
  Configured per-file thresholds are authoritative and green.
- **DEC-P29E-HOLDING-DELETE (owner decision, 2026-11-02):** the requirement for
  Undo after deleting a linked holding is withdrawn. Deletion has never offered
  Undo, and adding it is out of scope. The retained requirement is that all
  Budget item links to the deleted holding are cleared in the same persisted
  write; the acceptance test passes. P29-B through P29-L, P29-N and P29-M2
  are Done; P29-M is superseded by P29-M2.

- **Spreadsheet backup scope:** supplied monthly income and expense items,
  historical loan payments, and the provided emergency-fund activity are
  represented in the local schema-v13 backup. Non-earned inflows remain
  separate from earned income; unmatched source movements and expense
  differences are labeled rather than inferred. Monthly cash-flow totals were
  rebalanced with month-end withdrawals/extra expenses and verified against
  the trackers. Emergency-fund records are mapped to linked holdings and
  transactions, but arbitrary workbook comments and every source-level tracker
  detail have no dedicated schema fields. The local backup is a supported
  snapshot, not a complete workbook migration. Do not retain the user's
  financial values in repository memory.
- **Local app/backup mismatch:** the owner accepts the current snapshot and
  does not request a fresh export. The historical mismatch remains documented;
  no backup data was altered or regenerated.
- **CR-3:** resolved by owner acceptance of the existing Save behavior in
  `profile-form.tsx` and `transaction-form.tsx`; no UI change is requested.
- The last recorded audit snapshot reports 27 production advisories (6 high,
  20 moderate, 1 low) and 55 total (6 high, 44 moderate, 5 low); the extra 28
  are dev-only tooling. The owner accepts this snapshot for now; no dependency
  changes are requested. P39-E remains Planned for a broader, current
  dependency-risk report. Never use `npm audit fix --force` or approve
  install scripts without separate authorization.
- The MIT copyright holder is confirmed by the owner as Sahil Aspak Sheikh;
  the existing `LICENSE` notice already matches.
- **Node 24 Jest issue (accepted, not a pending fix):** on Node 24.22.2, after clearing Jest cache, 13 suites
  fail because `expo-modules-core` reads `ReactNativePlatform.select` while
  `react-native` is mocked without a `Platform` export in affected test files.
  The full suite passes on Node 26.13.0. React Native 0.86.3's declared engine
  supports Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; therefore the
  test difference does not prove that the SDK itself rejects Node 24.
  Project Node is pinned to 26.13.0 and the allowed engine is `>=26.0.0 <27`
  based on the observed test results. The owner accepts the Node 26.13.0
  project pin; no Node 24-specific mock repair is requested.
- The owner reports v0.1.0 is a GitHub pre-release (`v0.1.0`), with EAS build
  and screenshots complete. The slug was confirmed by the owner and was not
  changed.

## Recent completed validation

- **Commit-subject enforcement (2026-11-08):** superseded the former
  unenforced placeholder-subject practice because it obscured the scope of
  changes and encouraged unrelated edits to be grouped together. The
  repository hook now requires descriptive Conventional Commit subjects;
  enable it with `git config core.hooksPath .githooks`. Full ordered gates are
  recorded as Gate 1-4 exit 0; Gate 1 had 93 suites, 1,205 passed and 1
  skipped. Both Expo export gates were intentionally skipped because the task
  forbids builds.
- **P29-R:** the external schema-v13 backup migrated through the production
  import path to v18 with no differences in the requested before/after
  summaries. The script prints only numbered holdings/goals, types, and
  calculated values; the backup and personal text remain outside Git. Reminder
  preferences are not in the backup, so the recorded preview uses enabled
  day-before and same-day reminders at 09:00 with amounts hidden. Details are
  in [PROGRESS.md](../PROGRESS.md). All six ordered gates were run: TypeScript,
  lint, Doctor and both platform exports pass; 92 suites/1148 tests pass, but
  coverage exits 1 because the unchanged `src/domain/schemas.ts` branch
  coverage is 89.41%, below its configured 90% threshold. No assertion was
  weakened.

## Physical-device verification

- **Owner-reported Pass (2026-11-11):** the owner confirms the previously
  listed physical-device checks passed. The grouped record is in O54-O60 of
  the [device checklist](../releases/device-test-checklist.md):
  accessibility/large text and screen readers; native dialogs, navigation
  and Home menu; reminders and notifications; SQLite/AsyncStorage migration,
  restart, stress data and storage responsiveness; holdings, valuations,
  linked financial flows, stop/resume and liability closure/foreclosure;
  encrypted backup/restore, passphrase handling, file picker/share and
  erase-all; and Budget/list layouts, counts and ordering.
- The owner also reports the prior v1.2.0-specific checks O45-O53 passed.
  Device model, OS version and tester were not supplied. These results remain
  owner-reported; they are not independently observed or automated evidence.
- Automated layout tests still simulate component props and font scales; do
  not present them as physical-device evidence. They are separate from the
  owner's reported device validation.
- P25-F did not repeat physical-device checks. Its screen-reader label and
  month-routing assertions run in TestRenderer and do not establish native
  announcements or rendering behavior; the owner reports the later device
  checks passed.

## Documented assumptions and constraints

- **Assumed for P29-H:** if a holding has no valuation date, its stored `value`
  is not treated as a recorded valuation; current value is based on opening
  capital and posted entries, with no estimated interest. Manual holdings have
  no start-date field, so their opening cash flow uses the injected as-of date.
- P29-H did not change schema v15; P29-I advanced it to v16, P29-L to v17 and
  P29-M2 to v18. Home remained unmodified throughout these steps.
- **Assumed for P29-I:** the current manual holding model and form do not
  contain rate or maturity fields. No new fields were introduced; Fixed
  deposits use their opening amount, recorded valuation and withdrawal for
  maturity payout.
- **Assumed for P29-Q:** Expo SQLite's installed `SQLiteStorage` key-value
  adapter accepts each measured state value because it contains no
  app-level per-value cap; native SQLite/device storage limits and capacity
  remain subject to device verification.
- AI guidance is maintained only in the root `AGENTS.md`; no tool-specific
  instruction or pointer files are intended.
- Fixed Emergency fund allocation items use the same form as custom items but
  retain their built-in title and metadata; fixed titles are read-only.
- **Assumed for P29-L:** the Life placeholder maps to `life-savings`; Term maps
  to `term-life`. Typed premium categories remain derived from policy kind;
  savings-policy premiums use the existing generic Insurance category. The
  Budget Insurance system section and its categories remain fixed and out of
  scope; making them editable needs a separate product decision.
- P29-L preserves `nominee`, `status`, `premiumYears`, `trackFrom`, `endDate`,
  savings-policy `currentValue`/`valueAsOf`, and savings-policy goal links.
  `status` still marks Ended records and suppresses dues; `trackFrom` is the
  user-editable next-due date; `endDate` still caps legacy schedules;
  `currentValue` and goal links remain used by savings-policy goal calculations.
  `nominee` and `premiumYears` remain intact for data compatibility although
  the simplified tracker no longer edits them or uses `premiumYears` to
  schedule dues.
- **Assumed for P29-M2:** “no Paid button” means the settled slot is no longer
  actionable; the Insurance card's existing generic Paid action remains
  available for the next unpaid slot so early payment through that entry point
  remains possible. Hiding that action conflicts with the required early
  Insurance-card payment flow.
- The P20-V form omits the Percent option for non-monthly schedules because the
  frozen SegmentedControl has no disabled option API; validation rejects
  non-monthly percent items as well.
- **Assumed:** use stable Node 26.13.0 because the full suite passed on it and
  the clean-cache full run failed on Node 24.22.2. Expo SDK 57 uses React
  Native 0.86; see SDK and RN engine evidence in P25-E of the ledger. Node
  26.13.0 is a stable release, not a pre-release.
- **P25-B platform constraint:** Expo SDK 57's cross-platform share sheet and
  picked-file reading use temporary cache files. The explicit plain-export
  option therefore briefly writes plaintext to cache, and plain picked files
  are copied there for reading, then removed. Encrypted export cache files
  contain ciphertext only; decrypted encrypted payloads remain in memory.
  Satisfying the literal no-plaintext-temp rule for the plain paths would
  require a different platform-specific file destination design.
- Previous phase-specific assumptions remain in the linked
  [progress ledger](../PROGRESS.md), not duplicated here.

## Resolved

- **Historical checkpoint commit message audit (2026-11-07):** reviewed all
  five matching commits on `origin/main` and recorded proposed descriptive
  subjects in [PROGRESS.md](../PROGRESS.md). Their remote messages remain
  unchanged because repository policy prohibits rewriting/pushing shared
  history.
- **v1.0.0 release commit messages (2026-11-07):** replaced generic checkpoint
  messages with descriptions of release-draft preparation and publication
  documentation. The changes are local and unpushed; see the verified
  old-to-new commit mapping in [PROGRESS.md](../PROGRESS.md).


## Active Planned and Unimplemented Roadmap Items

The remaining tasks recorded as Planned on `develop` across dashboard, roadmap, and memory are:

1. **P7 (Cloud Backup — Google Drive):** Research, pure domain scheduling model, Settings UI, Wi-Fi gating, offline handling, and tests (P7-A through P7-D).
2. **P33 (Widgets):** Platform widget research and implementation planning for Android and iOS (P33-A through P33-C).
3. **P34 (Quick Capture):** Quick-capture platform research, home-screen shortcuts, and gesture features (P34-A through P34-C).
4. **P35 (Transaction Auto-Detection):** SMS/notification transaction detection permissions/platform research, scope validation, and implementation planning (P35-A through P35-C).
5. **P36 (Notes):** Notes design and implementation, media, storage, backup compatibility, and demo data (P36-A through P36-D).
6. **P37 (Tutorials):** Accessible, replayable in-app walkthroughs and feature introductions (P37-A through P37-C).
7. **P38 (Skeleton Loaders):** Identify real asynchronous loading states, then implement and verify skeleton loaders (P38-A through P38-C).
8. **P39 (Hardening & Audits):** Project audit covering security, privacy, permissions, recovery, dependencies, test debt, and onboarding, followed by remediation plan (P39-A through P39-H, with P39-C complete).
9. **P40 (Context Hygiene):** Measure documentation size/read costs, then archive completed-phase narrative from main ledger (P40-A through P40-B).
10. **P44 (Spending Heat Map):** Transactions spending heat map with selector, screen, demo data, accessibility, and device checks (P44-A through P44-D).

*(Note: P21-F, P31, P43-B, and P43-E are Done; P29-U-R1 is completed under CR-147; device checks O80, O81, and O82 are Pass; no release candidate or release lifecycle work is pending.)*

## Phase P7 Google Drive automated backup (planned)

- **Goal:** Provide automated periodic backups to Google Drive using the `appDataFolder` scope, keeping the app serverless and private with zero-knowledge local passphrase encryption before upload.
- **P7-A (Research & Prototyping):** Research Google Drive REST API (v3) `appDataFolder` scope (`https://www.googleapis.com/auth/drive.appdata`), Expo SDK 57 Google OAuth2/Sign-In integration, and background scheduling (`expo-background-fetch` / Android WorkManager) with Wi-Fi gating. Dependencies: none. Evidence: not started.
- **P7-B (Pure Domain Model):** Pure domain model for cloud backup scheduling (frequency: daily, weekly, monthly, manual; retention policy: keep latest N backups; zero-knowledge AES-GCM local passphrase encryption before upload). Dependencies: P7-A. Evidence: not started.
- **P7-C (UI & Settings):** UI & settings in Backup / Security screen (Connect/Disconnect Google Drive account, last backup status/timestamp, frequency picker, Wi-Fi only toggle, "Back up now", and "Restore from Google Drive" flow). Dependencies: P7-B. Evidence: not started.
- **P7-D (Fixtures, Tests & Device Verification):** Deterministic demo data, offline fallback, token revocation handling, unit tests, and device checklist rows. Dependencies: P7-C. Evidence: not started.

## P20-Z Dynamic budget category filter (Done; Revised by P20-Z-R1; CR-144)

- **Goal:** Add a dynamic category filter alongside the existing Budget sorting option in the Budget screen.
- **Scope & Delivery:**
  - Added dynamic category filter inside `budget-filter-panel` in `app/(tabs)/budget.tsx` alongside `SortChip`.
  - Filter defaults to "All".
  - Lists base categories: "All", "Income", "Expenses", "Needs", "Wants", "Debt", "Assets", "Liabilities".
  - Dynamically computes and displays chips for newly created and custom sections (e.g. "Freelance Expenses", "Insurance", etc.) from both active budget definitions and overview sections.
  - Selecting a category filters the displayed Budget sections using `matchesCategory`, and renders an accessible `EmptyState` card ("No categories found") if no budget items match the selected category.
  - Maintains `categoryOverride` state with `routeCategory` search param fallback, and activates the filter indicator when `selectedCategory !== 'All'`.
- **Placement:** Rule 4 (new part in existing Phase P20 Monthly Budget feature area); searched dashboard, register, phase history, roadmap, memory, and `app/(tabs)/budget.tsx`; related P20, P20-X, and P17-C; reason: category filtering alongside sorting extends the existing Phase P20 Budget feature area.
- **Branch:** `phase/20-budget` (reopened from `develop`), task branch `task/P20-Z-budget-category-filter`.
- **Verification:** Regression test suite `src/components/__tests__/BudgetCategoryFilter.test.tsx` (4 tests passing). Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).
- **Device check:** Physical-device check row O78 verified as Pass by owner on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-23.

## P20-Z-R1 Budget filter icon indicator dot and margin refinement (Done; CR-145)

- **Goal:** Remove unwanted dot indicator on Budget filter icon on default view to match other screens (Assets, Liabilities, Transactions), and preserve owner margin changes in filterPanel.
- **Scope & Delivery:**
  - In `app/(tabs)/budget.tsx`, updated `filterActive` to `selectedCategory !== 'All'`, decoupling sort comparison conditions from filter indicator dot.
  - When category is "All" (default), filter icon renders clean without dot indicator, matching Assets, Liabilities, and Transactions.
  - Activates indicator dot only when a specific category filter is active (`selectedCategory !== 'All'`).
  - Preserved owner edit removing `marginHorizontal: 20` from `styles.filterPanel`.
- **Placement:** Rule 2 (revision to completed part in Phase P20); searched dashboard, register, phase history, roadmap, memory, and `app/(tabs)/budget.tsx`; related P20-Z; reason: revise Budget category filter active indicator logic and preserve owner margin changes.
- **Branch:** `phase/20-budget` (reopened from `develop`), task branch `task/P20-Z-R1-budget-filter-icon-indicator`.
- **Verification:** Regression test suite `src/components/__tests__/BudgetCategoryFilter.test.tsx` (4 tests passing). Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).
- **Device check:** Physical-device check row O79 verified as Pass by owner on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-23.

## P17-C-R1 Persistent sorting preferences across screens and sections (Done; CR-146)

- **Goal:** Implement persistent sorting preferences across every WealthWise screen or section offering sorting (Transactions, Assets, Liabilities, Budget, Goals, Investment Entries, Link Missing).
- **Scope & Delivery:**
  - Remember selected sort field and direction independently for each screen or section.
  - In `src/data/metaStore.ts`, added in-memory `cachedMeta` and `writeQueue` serialization to `createMetaStore` to guarantee atomic writes during rapid or concurrent sort updates and eliminate mount delays.
  - In `src/data/useSort.ts`, initialized `stored` synchronously from `metaStore.getCachedMeta()` and subscribed to `metaStore.subscribe` so that sort preference updates propagate immediately to all active screens/components in real time.
  - Restore each preference when the user returns to that screen and after app restart.
  - Persist new choices immediately on user selection.
  - Keep sorting preferences separate from filters without clearing or overwriting them.
- **Placement:** Rule 2 (revision to completed part in Phase P17 Cash flow, budgets, and sorting); searched dashboard, register, phase history, roadmap, memory, and sorting files; related P17-C; reason: revise completed sorting persistence in Phase P17 to ensure reliable persistence across all screens and sections.
- **Branch:** `phase/17-cash-flow-budgets-sorting` (reopened from `develop`), task branch `task/P17-C-R1-persistent-sorting-preferences`.
- **Verification:** Regression test suite `src/data/__tests__/useSort.test.tsx` (6 tests passing). Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).
- **Device check:** Physical-device check row O80 verified as Pass by owner on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-23.

## P29-U-R1 Dynamic asset valuation inputs and calculations (Done; CR-147)

- **Goal:** Make valuation inputs and calculations depend dynamically on the selected valuation type for both recurring and one-time assets.
- **Scope & Delivery:**
  - *Recurring asset form (`app/investment-form.tsx` -> `PlanFields`):* Placed `<FormSection title="Valuation">` immediately below `<FormSection title="Basics">` (which contains `Name`, `Holding type`, and optional `Custom type name`), ahead of `Contribution` and `Dates`. Inside `Valuation`, dynamically renders fields for `manual` (opening, actual value, date, worked example modal), `accrual` (opening, annual rate, compounding, maturity date), `unitsPrice` (purchase amount, unit price, units purchased, 2-way auto-calculation, live total value), and `balance` (opening balance, dynamic calculated current balance display). Moved `Frequency` to `Contribution`; omitted `Annual return` when `accrual` is selected. Removed redundant bottom `Opening and value` and `Valuation` sections.
  - *One-time asset form (`app/investment-form.tsx` -> `ManualFields`):* Renders type-dependent inputs for manual, accrual, unitsPrice, and balance with 2-way unit calculation.
  - *Holding valuation update route (`app/holding-valuation-form.tsx`):* Displays type-specific screen title, input label, live calculated total value for unit-based, and dispatches appropriate action (`updateHoldingPrice` for `unitsPrice`; `updateHoldingValue` for `accrual` and `balance`).
  - *Domain purity & schema v24:* Injected dates into form schema builders in `src/domain/schemas.ts`; schema remains v24 (additive `unitCount?: number` optional field on domain type and schema).
- **Placement:** Rule 2 (adjustment to completed P29-U valuation methods on existing holding model); searched dashboard, register, phase history, roadmap, memory, `valuation.ts`, `holding-valuation-form.tsx`, and `investment-form.tsx`; related P29-U, P8, and P29-S; reason: adjusts the valuation method mechanics and dynamic form inputs established by completed subtask P29-U.
- **Branch:** `phase/29-income-recurrence` (reopened from `develop`), task branch `task/P29-U-R1-dynamic-asset-valuation`.
- **Verification:** Regression test suites `src/components/__tests__/InvestmentFormRecurringValuation.test.tsx`, `src/domain/__tests__/valuation.test.ts`, `src/domain/__tests__/schemas.test.ts`, `src/components/__tests__/HoldingValuationDynamic.test.tsx`, and `src/components/__tests__/RouteRenderSmoke.test.tsx` pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch mismatch (20/21 checks passed).
- **Device check:** Physical-device check row O81 recorded as Pass based on owner report on 2026-11-24. Physical-device check O80 marked Pass based on owner report on 2026-11-23.

## P39-C Report-first permissions and privacy trace (Done; CR-148)

- **Goal:** Trace privacy-sensitive permissions from declaration to request to use (notifications, biometrics, file/share/document picker, SQLite, data-at-rest encryption boundary, allowBackup=false, offline boundary), verifying denial/revocation behavior and marking unverifiable items unverified.
- **Scope & Delivery:**
  - *Network & Analytics:* Zero network calls (`fetch`, `XMLHttpRequest`, `WebSocket`) verified by `src/lib/__tests__/offlineRuntime.test.ts`; zero telemetry or analytics SDKs.
  - *Android allowBackup:* Explicitly configured `allowBackup: false` in `app.json`, disabling automatic cloud upload of financial records to Google Drive.
  - *Notifications:* Local scheduling only under channel `'reminders'`; no remote push tokens or remote servers; denial/blocked states gracefully mapped in `reminderPermissions.ts`.
  - *Biometrics:* Used for optional app lock; evaluated locally in OS Secure Enclave / Keystore; no biometric data captured or stored; passcode fallback available in `authenticate.ts`.
  - *Storage & File Intents:* Scoped SAF file picker (`expo-document-picker`) and system share sheet (`expo-sharing`); no broad external storage permissions requested at runtime.
  - *Data at Rest & Backup Encryption:* SQLite database (`wealthwise-state.db`) and AsyncStorage stored unencrypted at rest within OS app sandbox; exported backups support strong AES-256-GCM + PBKDF2 encryption in `backupCrypto.ts`.
  - *Unverifiable items:* Marked root/jailbreak kernel bypass and custom vendor OEM intent quirks as unverifiable at application level.
- **Detailed Audit Report:** `/tmp/wealthwise-p39-c-permissions-privacy-trace.md`.
- **Placement:** Rule 5 (kept in Phase P39 per owner decision CR-113); searched dashboard, register, memory, app.json, permissions code; related P39, P31-D; reason: release audit and hardening permissions trace.
- **Branch:** `phase/39-release-audit-and-hardening`, task branch `task/P39-C-permissions-privacy-trace`.
- **Verification:** `src/lib/__tests__/offlineRuntime.test.ts`, all six ordered gates pass. Findings directly unblock and feed P31-D privacy statement.

## Pending owner actions (2026-11-24 reconciliation)

- **Next-release device gate:** O61–O74 and O75–O76 were tested and validated on physical devices by the owner on 2026-11-22 and marked Pass (now under ## v1.3.0 device checks). O77, O78, O79, and O80 were tested and validated Pass on physical device by the owner on 2026-11-23. Physical-device check O81 (verifying dynamic asset valuation inputs and calculations on a physical device) and check O82 (verifying consistent filter panels and absence of filter icon dot indicator on a physical device) were tested and validated Pass on physical device by the owner on 2026-11-24. Physical device metadata (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, tester sahilsheikh-dev, 2026-11-24) is recorded across all sections, all device checks in the Next release section are now Pass, and zero physical-device checks remain pending.
- **Documentation PR flow:** CR-118's PR #184/#185 and CR-119's PR #186/#187
  merges are confirmed in Git history and terminal session evidence. PR #186
  merged `task/docs-device-checklist-by-release` into `documentation` at
  `001df8b812e0b2c990137f22747be4d0e5cfd2a1`; PR #187 merged `documentation`
  into `develop` at `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6`. Local `develop`
  was synchronized by CM-2.

The supplied snapshot resolves the earlier request for PR/ref/release/issue
exports and terminal evidence. See the current snapshot reconciliation in
[status.md](status.md) and the evidence table in [PROGRESS.md](../PROGRESS.md).
