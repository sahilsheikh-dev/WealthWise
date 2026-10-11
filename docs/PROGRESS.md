# Phase 15 progress

## Part A — Phase 14 audit

Schema precondition: `SCHEMA_VERSION = 4` in `src/domain/schemas.ts` (verified before starting).

### Phase 14 traceability matrix

| Requirement | Status | Evidence files | Tests proving completed behavior / gap |
|---|---|---|---|
| B1 Home quick actions: exact visible labels, 2x2 grid, distinct Feather glyphs, accessibility labels, large-font wrapping, Home-only verb allow-list | Partial | `app/(tabs)/index.tsx`, `src/components/IconButton.tsx`, `src/components/__tests__/HomeThemeSmoke.test.tsx`, `src/components/__tests__/IconButton.test.tsx` | `Home screen theme smoke > renders Home with the … palette` verifies exact labels and unique glyphs for all themes; `IconButton > exports the approved text-action allow-list`. The 2x2/wrapping layout is in place, but no explicit render-at-font-scale 1.0/1.3/2.0 test exists yet. |
| B2 Transaction month swipe, chip-origin exclusion, vertical scroll/tap preservation, adjustable month accessibility actions | Partial | `src/lib/swipe.ts`, `src/lib/__tests__/swipe.test.ts`, `app/(tabs)/transactions.tsx` | `swipeIntent >` boundary cases cover basic directional classification only. The Transactions screen has no PanResponder integration or adjustable month actions. |
| B3 `CardHeaderRow` / `ListRow`, sole `edit-2` renderers, far-right pencil across the specified cards and rows | Missing | `app/emergency-fund.tsx`, `app/assets.tsx`, `app/liabilities.tsx`, `app/investment-entries.tsx`, `app/liability-payments.tsx` | No `CardHeaderRow`, shared `ListRow`, or source scan test exists. |
| B4 Goal cards without edit pencils, open editor with the specified hint | Partial | `app/(tabs)/goals.tsx`, `app/(tabs)/index.tsx` | `EmergencyGoalScreens >` covers emergency-target rendering, not goal-card first-tap navigation or the required hint. Goal cards currently navigate through a pressable labeled `Edit …`. |
| B5 Emergency-fund allocation screen card and form, exact messages, reset confirmation, single write | Partial | `src/domain/efAllocation.ts`, `src/domain/efAllocationActions.ts`, `src/domain/__tests__/efAllocation.test.ts`, `src/domain/schemas.ts` | `ef allocation > suggested allocation totals 100%`, `allocateAmounts keeps exact total for awkward balances`, `warns at threshold boundaries`, `normalizes partial and invalid allocations and applies set/reset actions`, `validates totals and decimals`; no allocation UI or screen/form render test exists. |
| B6 Storage thresholds and byte helper, Home banners and dismissal, Backup size, dev stress action, calibration | Partial | `src/lib/storageGuard.ts`, `src/lib/__tests__/storageGuard.test.ts`, `src/data/safeStorage.ts` | `storageGuard > reports byte lengths and level boundaries`; storage helper exists but write-size state/UI/dismissal/stress-data/calibration are not implemented. |
| B7 Render test for every route with `assertNoVerbText` and `AppHeader` checks | Partial | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/components/testUtils/assertNoVerbText.ts`, `app/` | `route render smoke audit > … renders without verb text` covers a subset of routes. Several route files are not imported by the smoke test, and the test replaces `AppHeader` with a title-only stub, so it does not assert header actions. |
| K1 Read SDK 57 notification docs and report local scheduling, Android channel, permission, Expo Go behavior | Missing | None | No documentation result or development-build verification recorded. |
| K2 Zod-validated reminder preferences in the meta store | Missing | `src/data/metaStore.ts` | No reminder preference schema or test. |
| K3 Pure reminder planner: sources, timing, privacy, overdue summary, cap, stable signature | Missing | None | No planner module or tests. |
| K4 Injectable reminder scheduler and lifecycle/data/pref triggers | Missing | None | No scheduler module or fake-adapter tests. |
| K5 Permission requested only on enable; denied-state settings action | Missing | None | No reminder UI or permission-flow test. |
| K6 Notification tap routing after unlock/onboarding | Missing | `src/components/LockGate.tsx` | No notification response integration or queued-route test. |
| K7 Reminders screen, app-menu entry, controls, preview and test notification | Missing | `src/lib/appMenu.ts` | No reminders route or reminder menu item/test. |
| L1 Encrypted backup envelope, injected cryptography/randomness, KDF caps and uniform errors | Missing | `src/domain/backup.ts` | Plain backup format only; no encrypted format or crypto tests. |
| L2 Encrypted export/import UI, passphrase handling, throttling, naming and user guidance | Missing | `app/backup.tsx`, `README.md` | No encrypted backup UI or tests. |
| L3 Crypto vectors, tamper/cap/fresh-randomness/plain-backup regression tests, export compatibility | Missing | `src/domain/__tests__/backup.test.ts` | Plain backup tests exist; no encryption-related tests or package dependencies. |

### Gate audit notes

- The working diff for `jest.config.js` and `tsconfig.json` is empty; no threshold, collection entry, or exclusion was loosened or removed.
- The two prior lint warnings were `mockStoreState` in `src/components/__tests__/RouteRenderSmoke.test.tsx` and `originalAbs` in `src/domain/__tests__/efAllocation.test.ts`. The unused smoke-test mock was removed; the allocation test was replaced by the seeded property test. The final `npx expo lint` run reports no warnings.
- `jest.setup.js` provides `ExpoModulesCoreJSLogger.addListener` for Expo Modules Core's JS logger bootstrap. Jest does not provide the native Expo logger module; the setup makes the native bridge surface available to the test environment without changing app runtime behavior.
- The full coverage suite first exposed a real smoke-fixture failure: the `react-native` test mocks omitted `Text`, which made `IconButton` render an undefined element. `Text` was added to the mocks in `HomeThemeSmoke.test.tsx` and `EmergencyGoalScreens.test.tsx`; Home's exact action labels were also corrected to match the existing verb-text policy.

### Allocation proof

The valid-allocation distribution was changed to largest-remainder arithmetic over integer paise. The previous floating-point correction branch was only reachable in its test by mocking `Math.abs` to return inconsistent values; it was removed. The replacement seeded property test is:

- Test: `ef allocation > distributes 20,000 seeded balances exactly in paise (seed 0x15a110c)`
- Seed: `0x15a110c` (`22679820`)
- Cases: 20,000
- For each case: balance is an integer number of paise from 0 through 10,000,000,000; the seven weights are generated in tenths and sum to 1,000 tenths; results sum exactly to the input paise, are nonnegative, and differ from each exact share by at most one paisa.

## Part ledger

| Part | Status | Files | Test names / counts / coverage |
|---|---|---|---|
| A — Phase 14 audit and allocation proof | Done | `docs/PROGRESS.md`; `src/domain/efAllocation.ts`; `src/domain/__tests__/efAllocation.test.ts`; `src/components/__tests__/RouteRenderSmoke.test.tsx`; `src/components/__tests__/HomeThemeSmoke.test.tsx`; `src/components/__tests__/EmergencyGoalScreens.test.tsx`; `app/(tabs)/index.tsx`; `src/components/IconButton.tsx` | `distributes 20,000 seeded balances exactly in paise (seed 0x15a110c)`; Home theme smoke action assertions; two consecutive full runs: 297/297 tests, 43/43 suites. Coverage: domain 98.95% lines / 95.06% branches; data 95.40% / 90.31%; collected pure lib 100% / 100%. |
| B — Phase 14 UI refinements | Pending | — | — |
| C — SIP date clarity and emergency-fund cards | Pending | — | — |
| D — Schema v5 migration | Pending | — | — |
| E — Clear dues | Pending | — | — |
| F — Insurance | Pending | — | — |
| G — Goal asset links | Pending | — | — |
| H — Past-month carry-over | Pending | — | — |
| I — Monthly budget | Pending | — | — |
| J — Sorting | Pending | — | — |
| K — Local reminders | Pending | — | — |
| L — Encrypted backups | Pending | — | — |
| M — Polish and final gates | Pending | — | — |
