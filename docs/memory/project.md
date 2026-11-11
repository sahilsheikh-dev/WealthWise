<!-- Purpose: Stable product and repository facts for AI contributors. | Last updated: 2026-11-11 | Updates: owner and AI agents -->

# Project

WealthWise is an offline-first personal-finance Expo/React Native app. Its
runtime data is stored locally; the repository describes no cloud account or
runtime synchronization.

- Stack: Expo SDK 57, React Native 0.86.3, TypeScript, Expo Router, Zustand,
  Expo SQLite (native AppData), AsyncStorage (web, metadata and legacy native
  migration), Zod, React Hook Form and Jest.
- Toolchain: Node.js 26; `.nvmrc` selects 26.13.0 and `engines` allows
  `>=26.0.0 <27`.
- Schema version: v23 (`SCHEMA_VERSION` in `src/domain/schemas.ts`). Once-only
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
- Test counts: 101 suites, 1320 tests (1319 passed; one skipped) on
  2026-11-11 for P42-A's full run. P28-F-R6-R3's earlier focused-only check
  was later followed by this full run. All six ordered gates exit 0; the
  owner reports all listed physical-device checks passed. See
  [status.md](status.md) and the [progress ledger](../PROGRESS.md) for exact
  gate results and coverage.

See the canonical [progress ledger](../PROGRESS.md) for full project history,
schema migration evidence, feature decisions and test history.
