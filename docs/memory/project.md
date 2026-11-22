<!-- Purpose: Stable product and repository facts for AI contributors. | Last updated: 2026-11-22 | Updates: owner and AI agents -->

# Project

WealthWise is an offline-first personal-finance Expo/React Native app. Its
runtime data is stored locally; the repository describes no cloud account or
runtime synchronization.

- Stack: Expo SDK 57, React Native 0.86.3, TypeScript, Expo Router, Zustand,
  Expo SQLite (native AppData), AsyncStorage (web, metadata and legacy native
  migration), Zod, React Hook Form and Jest.
- Toolchain: Node.js 26; `.nvmrc` selects 26.13.0 and `engines` allows
  `>=26.0.0 <27`.
- Schema version: v24 (`SCHEMA_VERSION` in `src/domain/schemas.ts`). Once-only
  recurrence applies to Budget items, Budget income and insurance premiums;
  investment plans and liabilities remain excluded.
- Liability and goal lists show in-progress entries before collapsed
  Completed/Achieved groups. A liability is completed below Rs 1 outstanding
  or when closed; goals at or above target are achieved. The pinned Emergency
  fund goal remains in its first position and is not moved into Achieved.
- Insurance is a simple editable policy tracker with scheduled premiums;
  cover-goal management and policy lifecycle controls were removed in P29-L.
- Backup encryption protects exported files only; app data on device remains
  unencrypted and a lost backup passphrase cannot be recovered.
- Tabs: Home, Transactions, Goals and Budget.
- The About route is available from the Home app menu and displays Expo-config
  app metadata, schema version, MIT license and verified repository links.
  Update discovery asks first, then opens the GitHub latest-release page in
  the browser; it does not make an app-side network request.
- Future planning is owner-approved for an in-app update check and Once-only
  frequency on investment plans/liabilities; neither is implemented. Public
  adoption is a future project goal. The owner confirms Sahil Aspak Sheikh as
  the MIT copyright holder; the existing `LICENSE` notice matches.
- Budget scope choices apply on selection; Close, backdrop and Android back
  dismiss the popup without applying a change.
- Manual and recurring holdings share Deposit, Withdraw and Entries actions
  where capabilities allow. Opening amounts are derived as the first Entries
  row, recurring plans are shown inside Entries, and Invested is net of
  withdrawals without a schema change.
- P29-U adds optional valuation settings and a default-off monthly update
  reminder. Unconfigured holdings preserve legacy values; configured values
  share the portfolio selector.
- P29-W adds an optional closure record for recurring liabilities; closures
  retain their dated linked payment, suppress later shared dues and support
  note-only edits after closure.
- P29-X adds an optional recurring-plan stop date; schedule slots after the
  inclusive cutoff are removed from shared projections while entries, value,
  returns, goal links and Emergency Fund links remain unchanged.
- Budget's current and past month overview compares cumulative actual and
  planned values by section with a toggleable legend, distinct line styles,
  colors/markers and accessible text summaries; future months retain the
  existing empty state.
- Routes are in `app/`. Domain rules/schemas are in `src/domain/`; persistence
  and stores in `src/data/`; shared UI/form components in `src/components/`;
  pure utilities and platform helpers in `src/lib/`; demo data in `src/mock/`.
- Other source groups: `src/hooks/`, `src/theme/`, `src/constants/`, `assets/`
  and `scripts/`.
- Test counts: 105 suites, 1438 tests (1,437 passed; one skipped) on
  2026-11-22. The merged D3 task tree Gate 1 coverage was
  96.08/92.35/98.22/97.71% statements/branches/functions/lines. See
  [status.md](status.md) for exact ordered-gate results and local merge SHAs;
  the latest Gate 4 exit was not captured.
- P20-W-D3's pre-merge Gate 1 was 102 suites, 1382 tests (1,381 passed; one
  skipped), coverage 95.97/92.15/98.03/97.64% statements/branches/functions/
  lines; `src/data` 91.12/87.51/94.53/94.21%, `src/domain`
  96.93/92.97/98.81/98.32%, and pure `src/lib` 100% in all measures. Gates
  2–3 and 5–6 exited 0. Gate 4 exited 1 with `ENOTFOUND registry.npmjs.org`
  on its single attempt. D3 uses schema v24; P36-A/B are replanned to v25.
  O69–O72 remain Not run. P20-W gate evidence is recorded
  in [status.md](status.md) and the [progress ledger](../PROGRESS.md).
- P20-W integration: task PR #174 merged into `phase/20-budget` at
  `419a37b07e6853b3c683d22ec243ea58223514c1`; phase PR #175 merged into `develop` at `9e47856f20848e03ac6a4b8e699f47c387d08161`.
  CM-2 synchronized local `develop`. P20-W-R1 records the merge evidence.
  D1/D2 are integrated. D3 implementation commit `f2541fd` widens earned-income
  categories under v24 and P36-A/B are replanned to v25; focused suites passed
  (8 suites / 524 tests). Gates 1–3 and 5–6 passed; Gate 4 failed with the
  documented DNS error. Task/phase PR integration is pending.
  Device checks O69–O72 remain Not run.
- P21-F synced Gate 1 was 102 suites, 1,366 tests (1,365 passed; one skipped),
  coverage 95.96/92.14/98.03/97.63%. Gates 1–3 and 5–6 exited 0. Gate 4
  network attempt exited 1 (`ENOTFOUND registry.npmjs.org`); the owner-supplied
  result exited 1 at 20/21 on the six-package Expo SDK 57 patch mismatch.
  Dependencies and app config matched `origin/develop`. Task PR #170 merged to
  P21 at `c877f6d19e35c0b9fbcba90e9722da7531948c8e`; phase PR #171 merged to
  `develop` at `2e5e18a7a2be207387a7462b039547f51b0e4631`; CM-2 synchronized
  local `develop`. P21-F-R1 records the evidence.
- P20-W pre-sync task run: 102 suites, 1,348 tests (1,347 passed; one skipped),
  coverage 95.97/92.15/98.02/97.63%. Gates 1–3 exited 0 after correcting a
  fixture; Expo Doctor and its retry failed with `ENOTFOUND registry.npmjs.org`;
  Gates 5–6 were not run on that pre-sync tree.
  prior CR-112 task-tree run had 101 suites, 1325 tests (1324 passed; one skipped) on
  2026-11-12. The prior CR-111 task-tree run had
  101 suites, 1,323 tests (1,322 passed; one skipped). The prior P42-A full
  run had 101 suites and 1,320 tests (1,319 passed; one skipped) on
  2026-11-11, repeated on integrated `develop` at
  `8988121`; P42-A-R1 repeated the same six gates on its documentation-only
  revision tree. P28-F-R6-R3's earlier focused-only check was later followed
  by this full run. All six ordered gates exit 0; the owner reports all
  listed physical-device checks passed. See
  [status.md](status.md) and the [progress ledger](../PROGRESS.md) for exact
  gate results and coverage.

See the canonical [progress ledger](../PROGRESS.md) for full project history,
schema migration evidence, feature decisions and test history.


## Remote-history reconciliation (2026-11-22)

The owner snapshot exported at `2026-11-22T11:12:56+05:30` records 183 PRs, no open PRs or issues, and #39 as the only closed unmerged PR number from #1–#183. It confirms PR #178–#183 creator/merge metadata, the PR #181 body correction/comment, 42 remote branches, 51 tags, and v1.2.0 as the latest release. D3 task/phase/develop trees match; schema v24 and migration compatibility through v23 are current. The documentation task full Gate 1 completed with 105 suites / 1,438 tests (1,437 passed; one skipped); Gates 2–3 and 5–6 exited 0; Gate 4 was invoked once in the prior run but its exit was not captured and was not rerun. See `/tmp/sync/inventory-cont.md` and the current reconciliation in `status.md`.
