# Phase 15 progress

## Part A — Phase 14 audit

Schema precondition: `SCHEMA_VERSION = 4` in `src/domain/schemas.ts`, verified before changes.

### Phase 14 traceability matrix

| Requirement | Status | Evidence files | Tests proving completed behavior / remaining gap |
|---|---|---|---|
| B1 Home 2x2 quick actions, exact labels, unique icons, button labels and font-scale renders | Done | `app/(tabs)/index.tsx`, `src/components/IconButton.tsx`, `src/components/testUtils/assertNoVerbText.ts` | `Home screen theme smoke › renders Home quick actions at font scale %s` |
| B2 Transactions swipe month navigation, direction, chip-origin exclusion, adjustable month label | Partial | `src/lib/swipe.ts`, `app/(tabs)/transactions.tsx` | `swipeIntent › detects horizontal intent at the distance and velocity boundaries`; the screen currently has only chevron navigation and has no PanResponder or adjustable label |
| B3 CardHeaderRow/ListRow own all edit pencils and align them at the far right | Missing | `src/components/InstrumentCard.tsx`, `app/liabilities.tsx`, `app/emergency-fund.tsx`, `app/investment-entries.tsx`, `app/liability-payments.tsx` | No shared `CardHeaderRow` / `ListRow` implementation or exclusive-render test; `edit-2` remains outside a shared component |
| B4 Goal cards have no edit pencil and navigate on first tap with editor hint | Partial | `app/(tabs)/goals.tsx`, `app/(tabs)/index.tsx` | No tap/navigation test; both screens currently expose `Edit ...` labels on goal cards |
| C1 Schema v4, efAllocation field, v3-to-v4 migration, persisted copy and backup upgrade | Done | `src/domain/schemas.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `src/domain/backup.ts` | `migrate v3 to v4 › adds efAllocation null without altering the rest of the data`; `createAppStore persistence › migrates a v2 database once and does not overwrite its premigration copy`; backup migration tests |
| C2 Suggested allocation, exact paise distribution, thresholds, validation and pure actions | Done | `src/domain/efAllocation.ts`, `src/domain/efAllocationActions.ts` | `ef allocation › apportions 20,000 seeded balances exactly in whole paise`; other `ef allocation` validation/action/warning tests |
| C3 Emergency-fund allocation card and allocation form | Missing | No allocation UI route/card exists under `app/` | No UI render test |
| C4 Allocation boundaries, migration and backup tests | Partial | `src/domain/__tests__/efAllocation.test.ts`, `src/data/__tests__/migrateV4.test.ts`, `src/domain/__tests__/backup.test.ts` | Pure allocation and v3-to-v4 cases exist; allocation UI, custom-mix restart and round-trip coverage are absent |
| D1 UTF-8 byte size, levels and human-readable storage summary | Done | `src/lib/storageGuard.ts` | `storageGuard › reports byte lengths and level boundaries` |
| D2 Successful-write byte reporting, Home warning banners, seven-day dismissal, Backup size, stress menu data | Missing | `src/lib/storageGuard.ts` only; no storage-size state/UI or stress-data action | No integration or dismissal-timing test |
| D3 Serialized-size calibration for daily SIPs, 20,000 transactions and demo data | Missing | No calibration script or fixture report | No calibration test/report |
| E Local notifications and reminder preferences/planner/scheduler/permission/deep-link UI (optional in Phase 14) | Missing | No `expo-notifications` dependency or reminder source files/routes | No reminder tests |
| F Encrypted backup envelope, crypto adapter, UI, and tests (optional in Phase 14) | Missing | No `backupCrypto.ts` or crypto dependencies | No encrypted-backup tests |
| G1 Friendly sentences for all typed domain errors | Partial | `src/lib/friendlyError.ts` | `friendlyError › maps known domain errors to plain messages`; linked-transaction, EF and later-phase error classes are not mapped |
| G2 Accessible roles/labels, 44pt targets, status semantics and all-screen font-scale renders | Partial | `src/components/IconButton.tsx`, `src/components/__tests__/IconButton.test.tsx`, `src/components/__tests__/RouteRenderSmoke.test.tsx` | `IconButton` checks its own target/label; route coverage and font-scale checks are not exhaustive |
| G3 Virtualized large lists, debounced search, memoization and domain benchmarks | Partial | `app/investment-entries.tsx`, `app/liability-payments.tsx`, `app/(tabs)/transactions.tsx` | `investment-entries` and `liability-payments` use FlatList; Transactions still renders mapped rows and no benchmark tests exist |
| G4 Empty states and hydration-safe rendering on every list/screen | Partial | `app/`, `src/components/__tests__/RouteRenderSmoke.test.tsx` | Smoke tests render selected routes; no complete route-by-route hydration/empty-state assertion |
| K Local reminders (Phase 15 Part K) | Missing | No planner, scheduler, notification adapter, prefs, or route | No reminder tests |
| L Passphrase-encrypted backups (Phase 15 Part L) | Missing | `src/domain/backup.ts` handles plain backups only; no crypto adapter or encrypted UI | No encryption tests |

### Part A work and validation

| Part | Status | Files | Tests / gate results |
|---|---|---|---|
| A | Done | `docs/PROGRESS.md`, `src/domain/efAllocation.ts`, `src/domain/__tests__/efAllocation.test.ts`, `src/lib/storageGuard.ts`, `src/lib/__tests__/friendlyError.test.ts`, `src/lib/__tests__/format.test.ts`, `src/lib/__tests__/storageGuard.test.ts`, `src/lib/__tests__/swipe.test.ts`, `app/(tabs)/index.tsx`, `src/components/IconButton.tsx`, `src/components/testUtils/assertNoVerbText.ts`, Home render smoke tests | 44 suites / 303 tests; two consecutive full coverage runs exit 0; allocation property proof seed `0x015A110C`; all requested build and diagnostics gates exit 0 |

Part A gate results: `npm test -- --coverage` passed twice consecutively; `npx tsc --noEmit`, `npx expo lint`, Android export, iOS export, and `npx expo-doctor` all exited 0. Expo Doctor reported 21/21 checks passed. Expo lint reported one warning: `src/components/__tests__/RouteRenderSmoke.test.tsx:27`, `mockStoreState` is assigned but never used. Coverage totals: domain 1,133/1,145 lines (98.95%) and 1,075/1,133 branches (94.88%); data excluding hooks 249/261 lines (95.40%) and 177/196 branches (90.31%); pure lib 96/96 lines (100%) and 112/112 branches (100%).

`jest.config.js` and `tsconfig.json` have no remaining diff against HEAD. `jest.setup.js` is loaded by the existing Jest config and installs a no-op optional Expo Modules JS logger in the Jest runtime where native modules are unavailable. This prevents native logger listener setup from depending on the device module; it was not the cause of the Home render test failures.

### Coverage configuration audit

The working-tree diff had removed the `collectCoverageFrom` entries and per-file 90% branch/line thresholds for `src/lib/format.ts`, `friendlyError.ts`, `greeting.ts`, `storageGuard.ts`, and `swipe.ts`. Those entries and thresholds were restored; no coverage threshold or exclusion was loosened. The existing Node test typing in `tsconfig.json` has no diff in this audit.

The allocation implementation had been changed from integer-paise largest-remainder arithmetic to a floating-point distribution followed by a compensating adjustment. The compensating path depended on two separate `Math.abs` reads and could change one bucket after the paise split. It was replaced with the committed integer-paise algorithm; a seeded test now verifies 20,000 balances and tenths-based allocations with exact sums, non-negative amounts, and per-bucket error no greater than one paisa. The `storageSummary` branch that returned `"about 2 MB"` on both sides was removed as coverage-only logic; exact byte-summary assertions preserve the original display output.
