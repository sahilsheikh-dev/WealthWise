<!-- Purpose: Stable product and repository facts for AI contributors. | Last updated: 2026-11-05 | Updates: owner and AI agents -->

# Project

WealthWise is an offline-first personal-finance Expo/React Native app. Its
runtime data is stored locally; the repository describes no cloud account or
runtime synchronization.

- Stack: Expo SDK 57, React Native 0.86.3, TypeScript, Expo Router, Zustand,
  Expo SQLite (native AppData), AsyncStorage (web, metadata and legacy native
  migration), Zod, React Hook Form and Jest.
- Toolchain: Node.js 26; `.nvmrc` selects 26.13.0 and `engines` allows
  `>=26.0.0 <27`.
- Schema version: v21 (`SCHEMA_VERSION` in `src/domain/schemas.ts`).
- Insurance is a simple editable policy tracker with scheduled premiums;
  cover-goal management and policy lifecycle controls were removed in P29-L.
- Backup encryption protects exported files only; app data on device remains
  unencrypted and a lost backup passphrase cannot be recovered.
- Tabs: Home, Transactions, Goals and Budget.
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
- Routes are in `app/`. Domain rules/schemas are in `src/domain/`; persistence
  and stores in `src/data/`; shared UI/form components in `src/components/`;
  pure utilities and platform helpers in `src/lib/`; demo data in `src/mock/`.
- Other source groups: `src/hooks/`, `src/theme/`, `src/constants/`, `assets/`
  and `scripts/`.
- Test counts: 92 suites, 1193 tests (1192 passed; one opt-in stress benchmark
  skipped) in the latest P29-W run. See [status.md](status.md) and the
  [progress ledger](../PROGRESS.md) for exact gate results and coverage.

See the canonical [progress ledger](../PROGRESS.md) for full project history,
schema migration evidence, feature decisions and test history.
