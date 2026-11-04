<!-- Purpose: Stable product and repository facts for AI contributors. | Last updated: 2026-11-03 | Updates: owner and AI agents -->

# Project

WealthWise is an offline-first personal-finance Expo/React Native app. Its
runtime data is stored locally; the repository describes no cloud account or
runtime synchronization.

- Stack: Expo SDK 57, React Native 0.86.3, TypeScript, Expo Router, Zustand,
  AsyncStorage, Zod, React Hook Form and Jest.
- Toolchain: Node.js 26; `.nvmrc` selects 26.13.0 and `engines` allows
  `>=26.0.0 <27`.
- Schema version: v18 (`SCHEMA_VERSION` in `src/domain/schemas.ts`).
- Insurance is a simple editable policy tracker with scheduled premiums;
  cover-goal management and policy lifecycle controls were removed in P29-L.
- Backup encryption protects exported files only; app data on device remains
  unencrypted and a lost backup passphrase cannot be recovered.
- Tabs: Home, Transactions, Goals and Budget.
- Budget scope choices apply on selection; Close, backdrop and Android back
  dismiss the popup without applying a change.
- Routes are in `app/`. Domain rules/schemas are in `src/domain/`; persistence
  and stores in `src/data/`; shared UI/form components in `src/components/`;
  pure utilities and platform helpers in `src/lib/`; demo data in `src/mock/`.
- Other source groups: `src/hooks/`, `src/theme/`, `src/constants/`, `assets/`
  and `scripts/`.
- Test counts: 86 suites, 1086 tests in the current P29-L test inventory; the
  final verified run is recorded in
  [status.md](status.md) for the run date and exact gate results.

See the canonical [progress ledger](../PROGRESS.md) for full project history,
schema migration evidence, feature decisions and test history.
