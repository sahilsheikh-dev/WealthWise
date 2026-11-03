> AI working memory index: [docs/memory/README.md](docs/memory/README.md).

# Changelog

## [Unreleased]

### Phase 29

- Added Today controls, centered dropdown/paid/scope dialogs, goal-year support
  for 1990–2100, the Home Insurance box and actual due-payment amounts.
- Added Budget start-month handling, schema-v14 holding links, plan/manual
  linked asset behavior, demo coverage and holding-link integrity.
- P29-F4 stabilization tests and ledger audit pass: 84 suites and 1037 tests,
  TypeScript, lint with zero warnings, Expo Doctor 21/21, and Android/iOS
  exports all pass. Coverage uses a fresh `coverage-final.json`; no thresholds
  or exclusions changed.
- Owner decision DEC-P29E-HOLDING-DELETE withdraws the never-existing Undo
  expectation after holding deletion. The accepted behavior is clearing every
  Budget link in the same write; P29-B through P29-F4 are closed. No Home
  source was edited.
- P29-G adds editable Insurance cover goals and policy assignments, migrates
  schema v14 to v15, and retains backup imports through v14. Existing policies
  remain visible even when they do not count toward a cover goal; Home's total
  cover, yearly premium and next-renewal semantics are unchanged.
- P29-G validation: 84 suites and 1054 tests pass; TypeScript, lint with zero
  warnings, Expo Doctor 21/21, and Android/iOS exports pass. Custom-goal future
  premiums use the generic Insurance category; existing transaction history
  retains its stored category.
- P29-H corrects holding Invested, current value and return calculations with
  opening capital included, dated valuation handling, no estimated interest,
  and Cash/Bank return suppression. It does not change the persisted schema or
  the owner-managed Home screen.
- P29-H validation: 84 suites/1060 tests pass; TypeScript, lint with zero
  warnings, Expo Doctor 21/21, and Android/iOS exports all pass.
- P29-J audits recurring-liability balances: the existing model uses actual
  days/365 and applies payments on their recorded dates. This is report-only;
  no liability behavior changed because the bank statement, loan principal,
  tenure and app payment records were not supplied.
- P29-J validation: 84 suites/1061 tests pass; TypeScript, lint with zero
  warnings, Expo Doctor 21/21, and Android/iOS exports all pass. A generic
  14-payment comparison found only sub-EMI convention differences; the owner's
  actual bank comparison remains open pending the missing records.

### Investments and goals

- Added shared pure return calculations for holdings and plans: absolute gain
  and return, dated XIRR, single-lump CAGR, and short-span absolute-only
  labeling.
- Goals now count the full current value of every linked asset, including assets
  shared by multiple goals. Emergency-fund bucket targets now use the set goal
  target, while bucket available values use full linked holding values.

### Data and privacy

- Encrypted backup export is now the default, with passphrase-protected
  AES-256-GCM and scrypt. Plain export remains an explicit, warned option;
  encrypted files are decrypted in memory and continue through the existing
  checksum, validation, migration, staging and Undo flows.
- Backup encryption protects exported files only. On-device app storage
  remains unencrypted, app lock is not encryption, and lost passphrases cannot
  be recovered.

### Reminders

- Added local-only payment reminders for dated unpaid dues, with day-before
  and due-day schedules at a user-selected local time.
- Added privacy-aware notification text, permission and settings controls,
  a 60-reminder rolling window, and a lock-gated paid/not-paid confirmation
  route. Android delivery may be inexact and physical-device behavior still
  requires owner verification.

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
