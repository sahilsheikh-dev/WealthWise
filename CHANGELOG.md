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
- P29-G temporarily introduced editable Insurance cover goals and policy
  assignments. P29-L supersedes and removes that complexity; see the current
  Insurance tracker behavior below.
- Historical P29-G validation (before P29-L removed cover goals): 84 suites and
  1054 tests pass; TypeScript, lint with zero
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
- P29-I makes Fixed deposits one-time holdings while preserving legacy entries,
  keeps Recurring deposits and other recurring-capable holdings on their
  existing entry/schedule paths, and migrates schema v15 to v16 with raw-byte
  archival and backup compatibility through v15.
- P29-I validation: 85 suites/1078 tests pass; TypeScript, lint with zero
  warnings, Expo Doctor 21/21, and Android/iOS exports all pass. Manual holding
  forms have no existing rate or maturity fields; no new fields were added.
- P29-K scope popups apply the selected month scope immediately. Close,
  backdrop and Android back dismiss without applying; counted category-delete
  copy remains in the popup and Undo is unchanged. No schema or domain changes.
- P29-L replaces cover goals, filtering/search and policy lifecycle controls
  with a simple editable policy list and Term/Life placeholders. Premiums recur
  from the selected next due date, including custom month intervals, and flow
  through Transactions, Home, Budget and reminders. Schema v16 migrates to v17,
  dropping only cover goals and policy cover-goal assignments while preserving
  older backup imports, hidden legacy policy fields and savings-policy goal
  links. Home remains unchanged.
- P29-N removes Transactions' Review-month section while retaining its normal
  month navigation and Budget's independent month routing. A one-time,
  unlock-gated Payment reminders prompt can enable local reminders using the
  existing defaults; dismissing it is stored in UI metadata, cleared by
  erase-all, and never invokes the system permission prompt unless the user
  chooses Turn on reminders.
- P29-M2 replaces the blocked P29-M: policy payments store the exact due date
  settled, and all premium-due surfaces share the same schedule derivation.
  Schema v18 migrates v17 FIFO matches without changing existing schedule
  output; payment and linked transaction remain one-write and one-Undo actions.
- P29-O Step 1 inventories the current split manual/plan holding models,
  calculation and schedule behavior, and connected UI/domain/test surfaces.
  The report-only inventory is committed before the approved schema-v19
  unified-ledger implementation.

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
