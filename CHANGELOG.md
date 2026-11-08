> AI working memory index: [docs/memory/README.md](docs/memory/README.md).

# Changelog

## [Unreleased]

### Data and privacy

- Encrypted backup export is now the default, with passphrase-protected
  AES-256-GCM and scrypt. Plain export remains an explicit, warned option;
  encrypted files are decrypted in memory and continue through the existing
  checksum, validation, migration, staging and Undo flows.
- Backup encryption protects exported files only. On-device app storage
  remains unencrypted, app lock is not encryption, and lost passphrases cannot
  be recovered.

## [0.1.0]

Released on GitHub as a pre-release with tag `v0.1.0`. The owner reports the
EAS build and release screenshots are complete and that physical-device
testing works; device model and operating system were not recorded. This
owner-reported verification is not automated device evidence.

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
- User-initiated JSON backup export/restore with integrity validation.
- Optional device-authenticated app lock and local theme preferences.

### Known limitations

- Reminders and notifications are not implemented; they are planned for the
  next release phase.
- npm reports open advisories in both production and full dependency audits;
  see the progress ledger for current counts and affected packages.
- Development and test commands use Node.js 26 (`.nvmrc`: 26.13.0).
- The app is not financial, tax, legal or insurance advice.
- Insurance cover multiples and similar figures are guidelines only, not
  recommendations or judgments of adequacy.
