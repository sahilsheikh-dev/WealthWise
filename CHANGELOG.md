> AI working memory index: [docs/memory/README.md](docs/memory/README.md).

# Changelog

## [0.1.0] - 2026-10-25

Initial release-preparation record. Feature work and physical-device release QA
remain separate from this documentation and metadata update.

### App and navigation

- Home, Transactions, Goals and Budget tabs, with Expo Router detail and form
  routes.
- Offline-first personal finance overview and local-only data storage.

### Transactions and planning

- Income, expense and investment transactions; manual and planned holdings;
  recurring and one-time liabilities; linked entries and payment tracking.
- Monthly budgets, recurring budget items, scheduled dues, cash-flow views,
  savings goals and emergency-fund allocation.

### Insurance

- Policy records, premium payment tracking and cover goals for term life,
  health, motor, home and other insurance.

### Data and privacy

- Persisted schema version 13, with supported migrations from schema v1 through
  v13 and version-aware backup import.
- User-initiated JSON backup export/restore with integrity validation. Backup
  files are readable and are not encrypted.
- Optional device-authenticated app lock and local theme preferences.

### Known limitations

- Reminders and notifications are not implemented.
- Physical iOS/Android device behavior has not been comprehensively verified.
- The app is not financial, tax, legal or insurance advice.
