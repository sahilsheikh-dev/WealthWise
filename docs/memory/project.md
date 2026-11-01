<!-- Purpose: Stable product and repository facts for AI contributors. | Last updated: 2026-11-01 | Updates: owner and AI agents -->

# Project

WealthWise is an offline-first personal-finance Expo/React Native app. Its
runtime data is stored locally; the repository describes no cloud account or
runtime synchronization.

- Stack: Expo SDK 57, React Native 0.86.3, TypeScript, Expo Router, Zustand,
  AsyncStorage, Zod, React Hook Form and Jest.
- Toolchain: Node.js 26; `.nvmrc` selects 26.13.0 and `engines` allows
  `>=26.0.0 <27`.
- Schema version: v13 (`SCHEMA_VERSION` in `src/domain/schemas.ts`).
- Tabs: Home, Transactions, Goals and Budget.
- Routes are in `app/`. Domain rules/schemas are in `src/domain/`; persistence
  and stores in `src/data/`; shared UI/form components in `src/components/`;
  pure utilities and platform helpers in `src/lib/`; demo data in `src/mock/`.
- Other source groups: `src/hooks/`, `src/theme/`, `src/constants/`, `assets/`
  and `scripts/`.
- Test counts: 79 suites, 958 tests passed on Node 26.13.0 in the 2026-11-01
  P25-F final coverage run; see
  [status.md](status.md) for the run date and exact gate results.

See the canonical [progress ledger](../PROGRESS.md) for full project history,
schema migration evidence, feature decisions and test history.
