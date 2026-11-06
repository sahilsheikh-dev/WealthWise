# P27-A Cleanup Audit Report

Date: 2026-11-07

This is a report-only inventory. No production behavior, persisted schema, Home
route, or Budget route was changed.

## Method

- Dead-code scan: `npx --yes knip --reporter compact`; high-confidence hits
  were verified by repository grep. `npx --yes ts-prune -p tsconfig.json` was
  also run; its output was dominated by exported API/type inventory rather than
  repository-proven production orphan paths.
- Dependencies: package imports/config references were searched under `app`,
  `src`, `scripts`, `package.json`, and `app.json`.
- Security: `npm audit --omit=dev --json` against the current lockfile.
- Bundle: separate Expo static exports under `/tmp` for Android and iOS; output
  totals and the largest files were measured from the export directories.
- Assets: `npm run check:assets`, plus direct source/config grep for asset names.
- Protected routes: `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` retain
  their verified blob hashes (`d3d1e465...` and `7beea9dd...`) and were not
  opened for editing.

## A. Dead code inventory

| Symbol / item | File | Production callers | Decision |
|---|---|---|---|
| `SectionHeaderRow` | `src/components/SectionHeaderRow.tsx` | None outside its test file | Proven unused production component; candidate for dead-code deletion with its orphaned component test. |
| `fitsInline` | `src/components/SectionHeaderRow.tsx`, `src/lib/sectionLayout.ts` | Only `SectionHeaderRow`; its only remaining production use becomes no production use if the component is removed | Proven orphan helper; candidate deletion with its dedicated helper/component tests if `SectionHeaderRow` is deleted. |
| `BudgetCategorySections` | `src/components/form/BudgetCategorySections.tsx` | No imports found; Knip reports it unused | Candidate deletion; verify no dynamic route/form loader references it before removal. |
| `monthReview` sorting metadata | `src/lib/sorting.ts` | Protected sorting module; route is deleted, but grep found only metadata declarations in the protected file | Preserve for this task. Report-only legacy metadata; any deletion is separate from this cleanup and requires governance because `src/lib/sorting.ts` is user-protected. |
| `dryRunMigration.ts` | `scripts/dryRunMigration.ts` | Not imported or referenced by package scripts | Candidate deletion if no external/owner workflow uses it. |
| `freezeFormComponents.js` | `scripts/freezeFormComponents.js` | No direct script entry, but repository docs/tests mention the freeze workflow and its manifest is governed | Preserve; this is an owner/governance utility, not a dead runtime file. |
| `BACKUP_APP`, `importDataSchema` | `src/domain/backup.ts` | `importDataSchema` no production importer; `BACKUP_APP` only self-references in backup implementation | `BACKUP_APP` is used internally and is not dead; `importDataSchema` export is candidate-only and requires test/type API verification. |
| `ENCRYPTED_BACKUP_VERSION` | `src/domain/backupCrypto.ts` | Only declared/self-exported, no production importer | Candidate export removal; confirm external package/backup API is not expected before deletion. |
| `BUDGET_CATEGORIES` | `src/domain/budget.ts` | No production importer in grep inventory | Candidate export cleanup; preserve implementation if exported for tests only. |
| `AllocationMismatchError` | `src/domain/cashFlow.ts` | No production importer | Candidate export cleanup. |
| `EF_MIN_MONTHS` | `src/domain/goals.ts` | No production importer | Candidate export cleanup. |
| `POLICY_COVER_CATEGORIES` | `src/domain/policyCategories.ts` | No production importer | Candidate export cleanup; verify policy model migration consumers. |
| `holdingLedgerSummary` | `src/domain/portfolio.ts` | No production importer | Candidate export cleanup. |
| `planHoldingSchema`, `efAllocationSchema`, `efCustomBucketSchema`, `efCustomBucketsSchema`, `efBucketLinksSchema`, `makeBudgetSectionFormSchema` | `src/domain/schemas.ts` | Knip reports no importers; several may be test/API types | Candidate export cleanup requires per-symbol test/API verification; do not remove until importer grep is complete. |
| `STORAGE_WARN_BYTES`, `STORAGE_CRITICAL_BYTES` | `src/lib/storageGuard.ts` | No production importer | Candidate export cleanup. |
| Mock demo exports: `transactions`, `goals`, `holdings`, `liabilities`, `policies` | `src/mock/data.ts` | Some are used only through mock assembly or tests | Preserve/mock export role requires verification; not proven dead. |
| `relativeLuminance` | `src/theme/contrast.ts` | No production importer | Candidate export cleanup; test importer also exists, so verify whether production-only export removal is safe. |
| Exported types listed by Knip (`CorruptionReason`, `SortOption`, budget types, schedule types, auth types, form types, and others) | `src/data`, `src/domain`, `src/lib` | Usually public structural/test consumers; Knip cannot prove runtime reachability | No deletion in this cleanup. Exported types are not bundle/runtime dead code unless a package boundary uses no declarations; preserve unless a producer is also removed. |

The report inventory does not treat every Knip export hit as deletion-ready.
The only high-confidence production orphan paths are `SectionHeaderRow`,
`fitsInline`, `BudgetCategorySections`, and the unused standalone migration
script. The route/report files under `app/` remain out of scope.

### User-owned screen findings

- `app/(tabs)/index.tsx`: no cleanup candidates were introduced or edited.
  The file does not import `SectionHeaderRow`, the orphan helper, or the legacy
  `monthReview` sorting metadata.
- `app/(tabs)/budget.tsx`: no cleanup candidates were introduced or edited.
  Its sorting imports and cash-flow labels remain user-owned and unchanged.

## B. Dependency inventory

Knip's package import scan and direct grep found these package.json dependencies
with no source/config import:

| Package | Kind | Evidence / config | Decision |
|---|---|---|---|
| `@expo/ui` | dependency | No import under `app`, `src`, or `scripts`; package.json only | Proven no direct source use, but owner requires SDK/Expo compatibility decision before removal. |
| `expo-device` | dependency | No import under `app`, `src`, or `scripts`; no config plugin entry | Candidate removal after Expo SDK 57 native dependency impact is confirmed. |
| `expo-glass-effect` | dependency | No import under `app`, `src`, or `scripts` | Candidate removal; not an app config plugin. |
| `expo-image` | dependency | No import under `app`, `src`, or `scripts` | Candidate removal; not needed by build config. |
| `expo-symbols` | dependency | No import under `app`, `src`, or `scripts` | Candidate removal; Expo package candidate only. |
| `expo-web-browser` | dependency | No import under `app`, `src`, or `scripts`; no app config entry | Candidate removal; no config/plugin requirement found. |

Preserve Expo packages automatically used by Expo or native tooling unless
direct use/import/config is found. `expo-build-properties` is retained because
it is configured in `app.json`; `expo-updates` is not present in package.json
but is referenced by Expo tooling/app configuration and is not an npm removal
candidate.

`react-test-renderer` is imported by 24 component/theme test files and is
present in `node_modules`/lockfile as a transitive dev dependency, but it is
not declared as a root devDependency. Knip correctly reports it as an unlisted
dependency. It is required by the current Jest render suites and should remain
available; if declared, it requires a deliberate React 19-compatible
devDependency/version update rather than cleanup removal.

Other package.json production/dev dependencies had source, script, config, or
toolchain references and are not reported as unused.

## C. Production npm audit

Current `npm audit --omit=dev --json` result on 2026-11-07:

- 7 vulnerability nodes: 4 moderate and 3 high.
- 0 critical/low nodes.
- 713 production dependencies in the audit summary.
- The 27-production-advisory number cannot be reproduced from the current
  lockfile. The attached terminal snapshot contains no `npm audit` output; it is
  a prior terminal/test log. The previous ledger historically mentions 67
  advisories at an older point, but that is not current evidence.

| Direct package / advisory path | Severity | Patch-level fix within Expo SDK 57? | Owner/action |
|---|---|---|---|
| `expo` via `@expo/fingerprint`/`glob`/`minimatch` | Moderate | No SDK-57 compatible `npm audit` fix reported; suggested fix is `expo@53.0.11`, a downgrade outside the SDK-57 stack | Owner decision required for SDK upgrade/downgrade strategy; do not run audit force. |
| `expo-router` via `query-string`/`decode-uri-component` | High | No; suggested fix is `expo-router@58.0.30`, a major SDK-58 upgrade | Owner decision required; keep SDK 57 until a compatible migration is approved. |
| `decode-uri-component` via `query-string` | High | No direct patch fix stays on current Expo SDK 57; fix chain ends at Expo Router 58 | Owner decision for Expo SDK/Router upgrade. |
| `query-string` (`5.0.0`-`9.4.1`) | High | No direct SDK-57 patch fix reported | Transitive lockfile package; owner decision for Expo Router upgrade. |
| `glob` (`9.0.0`-`14.0.1`) via `@expo/fingerprint` | Moderate | No SDK-57 compatible suggested fix | Transitive tooling advisory; owner review of Expo upgrade path. |
| `minimatch` (`7.0.0`-`11.0.0`) via fingerprint/glob | Moderate | No SDK-57 compatible suggested fix | Transitive tooling advisory; owner review of Expo upgrade path. |
| `@expo/fingerprint` | Moderate | No direct patch-level fix | Expo tooling advisory; upgrade/lockfile patch requires SDK review. |

No `npm audit fix --force`, major upgrade, install-script approval, or package
major change was performed.

## D. Bundle inventory

### Android export

- Export directory: `/tmp/wealthwise-android-export`
- Total: 16,674,443 bytes / 15.90 MiB
- Files: 69

| Rank | Size | Export path |
|---|---:|---|
| 1 | 5,518,482 | `_expo/static/js/android/entry-d675acb537ed67af4e555877735eff70.hbc` |
| 2 | 1,307,660 | hashed asset `assets/6e435534bd35da5fef04168860a9b8fa` |
| 3 | 970,844 | hashed asset `assets/8b042be199ec74ce82b9cd2604568e73` |
| 4-15 | 423,676-337,092 | remaining hashed assets/modules; exports do not retain source asset names in this directory |

### iOS export

- Export directory: `/tmp/wealthwise-ios-export`
- Total: 15,396,647 bytes / 14.68 MiB
- Files: 65

| Rank | Size | Export path |
|---|---:|---|
| 1 | 5,211,404 | `_expo/static/js/ios/entry-3ce061905f78995b4b4ff33389e0393b.hbc` |
| 2 | 1,307,660 | hashed asset `assets/6e435534bd35da5fef04168860a9b8fa` |
| 3 | 423,676 | hashed asset `assets/adec7d6f310bc577f05e0fe06a5daccf` |
| 4-15 | 389,724-336,808 | remaining hashed assets/modules; exports do not retain source asset names |

The Android/iOS exports contain 67 app assets on Android and corresponding
hashed assets on iOS. The exact module table cannot be recovered from static
export output alone because Metro exported a single Hermes bundle plus hashed
assets rather than source maps/module list. The report therefore lists the HBC
bundle and hashed assets rather than inventing source-module names.

### Asset usage

`npm run check:assets` passes all brand, dimension, opacity, adaptive safe zone,
monochrome color and favicon checks.

No unused branding or app icon asset is proven. The concepts SVGs are branding
tool inputs used by `scripts/build-branding.mjs`; root app icon/splash/monochrome
files are referenced by `app.json`. Tab PNGs, mark variants, favicon and splash
assets have direct asset/config/script evidence and should be preserved unless
an app icon configuration audit proves otherwise.

## E. Schedule benchmark

`src/domain/__tests__/schedule.test.ts` contains:

- Exact count assertion: `planSchedule(...)` returns 18,250 rows.
- Wall-clock assertion: elapsed `Date.now()` must be below 10 seconds.

The wall-clock check is flammable across slower CI/dev machines and may stop
measuring schedule correctness when only a baseline machine assumption is used.
The robust replacement is a count-based invariant plus a generous bound (for
example 30 seconds) or, preferably, a relative timing comparison against a
small baseline schedule run in the same process. A count-independent relative
check is preferred: warm the same process, run a baseline schedule and a
50-year schedule, assert exact output count and a generous normalized ratio
with a large absolute safety ceiling. This task does not change behavior, and
the benchmark replacement should be implemented only after recording a baseline.
