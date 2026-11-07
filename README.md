> AI agent context and durable project memory: [docs/memory/README.md](docs/memory/README.md).

# WealthWise

WealthWise is an offline-first personal finance app built with Expo and React
Native. It keeps application data on the device using local storage and makes
no cloud or network requests at runtime.

## Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Architecture and data](#architecture-and-data)
- [Data and privacy](#data-and-privacy)
- [Limitations and disclaimer](#limitations-and-disclaimer)
- [License](#license)
- [Brand assets](#brand-assets)

## Features

- Home overview of net worth, account balances, emergency-fund progress,
  Insurance cover and scheduled dues.
- Income, expense and investment transactions, with linked holding and policy
  entries where supported. Transactions keeps month selection and cash-flow
  balances without a Review-month link.
- Manual and planned investment holdings, investment-entry history, and
  recurring and one-time liabilities with payment tracking.
  On the holding details screen, recurring-plan details and financial Summary
  values are combined in one card; recurring Stop/Resume stays in the holding
  action row.
  Active recurring asset plans show Stop investment; stopped plans show Resume
  investment. Liability cards and details consistently use Foreclosure.
  The global three-dot options menu appears only on the Home/Index screen;
  assets, liabilities, reminders, backup, security, profile and theme screens
  keep screen-specific actions instead of showing duplicate global options.
  Liability cards keep Pay EMI, Foreclosure and conditional Entries
  actions in one row; liability detail pages use an entries-only asset-style
  layout with a columned Summary card.
  Recurring plans can be stopped at an inclusive date or resumed without
  changing entries, current value, returns, goal links or Emergency Fund
  links.
- Monthly budgets with spend/invest sections, income entries, recurring item
  schedules, due tracking and cash-flow views. Scope choices apply immediately;
  Close, backdrop and Android back dismiss without changing the budget.
- Savings goals, goal-linked assets and an emergency fund with editable
  allocation items.
- Emergency Fund holdings link by holding ID across manual holdings, recurring
  plans and migrated Fixed deposits. Deletion and hydration remove dangling
  links without changing net worth or valid goal/link amounts.
- Simple editable insurance policy tracking with scheduled premium dues for
  term life, life, health, motor, home and other cover.
- Local backup export and restore with schema validation and a SHA-256
  integrity check.
- Local payment reminders with privacy-aware notification text and an
  in-app paid/not-paid confirmation route. A one-time in-app prompt offers
  setup after unlock; system permission is requested only after choosing
  Turn on reminders.
- Optional device-authenticated app lock and locally stored theme preferences.
- Developer-only stress fixtures for 50, 100 and 126 years, plus a dense
  200-year record-count and daily-SIP tier compressed into the supported
  126-year date window. They load through replace-all with Undo for persistence
  and rendering checks.

## Screenshots

Release screenshots were prepared by the owner; image files are not included
in this repository.

## Getting started

This repository uses npm and includes `package-lock.json`. Use Node.js 26;
`.nvmrc` selects 26.13.0 and `package.json` permits `>=26.0.0 <27`.

```bash
npm ci
npm run start
```

Use the Expo development server to open the app. The `ios` and `android`
commands below run native projects locally and require the corresponding
development toolchain.

## Commands

These commands correspond to scripts in `package.json`:

| Command | Purpose |
|---|---|
| `npm run start` | Start the Expo development server. |
| `npm run ios` | Run the app on an iOS simulator/device using the local native toolchain. |
| `npm run android` | Run the app on an Android emulator/device using the local native toolchain. |
| `npm run web` | Start the web development server. |
| `npm test -- --coverage` | Run Jest tests and collect coverage. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run Expo lint. |
| `npm run build:branding` | Regenerate branding assets. |
| `npm run check:assets` | Validate generated/committed branding assets. |
| `npm run reset-project` | Destructive Expo starter-template reset; **do not run on this application**. |

The additional release checks used for this repository are:

```bash
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

## Release process

The current version is **v1.0.0**; the previous version is the initial
release. The GitHub release and tag are published, but the production EAS
builds are **not built** yet. Follow
[`docs/releases/build-config.md`](docs/releases/build-config.md) for the
pre-build gates, backup/device checks, EAS commands and build record. Release
publication and tagging require explicit owner approval.

`eas.json` defines development, preview and production EAS profiles. There is
no app-build command in `package.json`.

## Project structure

- `app/` — Expo Router routes and the four tab screens.
- `src/domain/` — domain types, Zod schemas, migrations, pure financial rules,
  summaries and backup validation.
- `src/data/` — Zustand store, persistence, safe storage and data migrations.
- `src/components/` — shared UI, including reusable form controls in
  `src/components/form/`.
- `src/hooks/` — application hooks.
- `src/lib/` — shared pure utilities and platform-facing helpers.
- `src/mock/` — demo data and its tests.
- `src/theme/` and `src/constants/` — theme definitions and application
  constants.
- `assets/` and `scripts/` — bundled visual assets and branding/asset scripts.
- `docs/PROGRESS.md` — project decisions, phase history, verification record
  and release-preparation audit.

## Architecture and data

The app uses Expo SDK 57, Expo Router routes in `app/`, and a pure domain layer
in `src/domain/`. The domain layer has no React or Expo dependency; date and
identifier inputs are supplied at the boundary where needed. Zod schemas
validate persisted and imported data. The current persisted data schema is
v22; migration and backup-import compatibility are retained.

### Investment return calculations

The holding ledger includes the opening amount and dated deposit and withdrawal
entries. Zero entries are ignored. Displayed Invested is net of withdrawals and
floored at zero:

`raw invested = opening amount + deposits - withdrawals`

`Invested = max(0, raw invested)`

When raw invested is negative, the holding shows a "Cost recovered" note.
Entries on the same date remain separate ledger entries; return cash flows for
that date are combined for calculation. Current value uses a recorded
valuation when one exists: add deposits and subtract withdrawals dated after
that valuation, through the requested as-of date. Entries dated on or before
the valuation are reflected in the stored value in the same write as the
entry change, and are not added a second time. Without a recorded valuation,
current value is opening plus posted deposits minus posted withdrawals through
the as-of date. Values never fall below zero. The app does not estimate
interest for unconfigured holdings; configured accrual holdings use their
saved rate, compounding convention and date-based valuation described below.

Return calculations use gross contributions (opening amount plus deposits),
not displayed net Invested:

`gain = current value + withdrawals - contributions`

`absolute return % = gain / contributions × 100`

When contributions are zero, the return is `null` and the card says "No return
yet".
XIRR solves
`sum(cash flow / (1 + rate)^(days from first flow / 365)) = 0`, using deposits
as negative cash flows, withdrawals as positive cash flows, and current value
as positive on the valuation date. Multiple entries use the XIRR label; one
lump sum uses CAGR: `(current value / contributions)^(365 / span days) - 1`.
Annualised XIRR/CAGR appears only when the first cash flow to valuation date
span is at least 365 days. Under 365 days the card shows only the labelled
absolute return. Cash and Savings accounts show balance and net Invested, but
never a return percentage, XIRR or CAGR. Entries after the valuation date
continue to change the value through the normal as-of calculation. Undo
restores the entry, linked transaction and snapshot together.

Every holding uses the same Deposit, Withdraw and Entries actions when its
capabilities allow them; Fixed deposits retain their maturity-withdrawal-only
rule. The opening amount is shown as the first, derived "Opening" row in
Entries and is edited in the holding form. Recurring holdings show their
frequency, amount and next due date inside the holding's Recurring plan
section. These presentation and invested-display changes were delivered on
schema v18; P29-U later adds optional valuation metadata in schema v19.

The owner cancelled the separate P29-O2 ledger-only storage redesign. P29-U
uses schema v19 only for additive, optional valuation metadata; it does not
reintroduce the cancelled ledger converter or prototype. P29-O1's unified
Deposit, Withdraw and Entries presentation remains the supported behavior.

### Recurring liability balances

Recurring liability balances currently accrue simple interest by actual
calendar days over a 365-day year. Interest accrues from the loan start or
previous payment date through the next recorded payment date, then the
recorded payment is subtracted; interest continues through the requested
as-of date after the last payment. A delayed payment therefore accrues through
its actual recorded date. The calculation does not round between periods.
This is the app's accounting convention, not a claim about a lender's method;
compare against a statement using its as-of date and actual payment records.

Recurring liabilities can be closed early from their detail card. The closure
date must be between the first payment date and today. The shared `loanState`
calculation supplies the outstanding amount; the amount paid can be adjusted.
The confirmation shows outstanding, amount paid and the difference. A payment
up to the outstanding is recorded as one linked expense. Any excess is a
separate "Loan closure charges" expense; a short payment requires a second
confirmation before the remainder is written off. Closure, payment, charge
and zero-balance settlement are one persisted action and one Undo. The shared
schedule/pending derivation suppresses dues after closure for Transactions,
Home, Budget and reminders. Closed loans have their own filter; only the
closure note remains editable, and deletion is confirmed.

On iOS and Android, Zustand persists the AppData blob with Expo SQLite's
`SQLiteStorage`; existing native AsyncStorage data is retained as a fallback
and copied into SQLite on the next write. The copied bytes are read back and
compared before the legacy copy is removed; SQLite failures and mismatches keep
the legacy backend active. Web continues to use AsyncStorage. UI metadata and
preferences remain in AsyncStorage. Persisted AppData schema
version 21 is current; P29-Q changes only the storage backend. P29-U adds
optional holding valuation fields without restructuring existing holding data,
and P29-W adds an optional recurring-liability closure record. The migration
chain upgrades supported data from schema versions 1 through 20.
Backup import accepts dates from 1900 through 2100, verifies file integrity
and validates imported data, applying supported migrations where required.
Backup export refuses data that would change on import and refuses plain files
over the 5,000,000-character import limit before creating a temporary file.

The development menu's stress loader replaces all AppData with a deterministic
long-history fixture and uses the existing Undo snapshot. It reports build,
validation, save/replace and first-render timings. The Node benchmark and
measured device checks are recorded in [docs/PROGRESS.md](docs/PROGRESS.md).
The 50-year fixture measures 2.67 MB, above the requested 1.5 MB target.
Node timings do not substitute for physical-device verification.

The bottom tabs are Home, Transactions, Goals and Budget. Route screens for
liabilities, investments, insurance, forms, backup and settings live directly
under `app/`.

### Investment returns and linked amounts

A goal's saved amount is the sum of the full current values of all assets linked
to that goal, so an asset may be counted in multiple goals. Emergency-fund
bucket targets use the user-set goal target with the three-month minimum
retained only as a floor; each bucket's available amount is the sum of the full
values of assets linked to that bucket.

### Holding valuation methods

Existing holdings keep their legacy current-value calculation until a method
is explicitly saved or a value/price is confirmed. The type-based suggestion
is not activated automatically: this preserves existing balances, net worth,
goal amounts and Emergency Fund figures during the additive v18-to-v19
migration. Suggestions are balance for Cash, balance plus interest entries
for Savings accounts, accrual for Fixed/Recurring deposits and EPFO/PF when a
rate is present, units x price for priced Stocks/ETF, Mutual fund/SIP, Gold
and Silver entries, and manual otherwise.

Accrual compounds each deposit from its date, uses actual elapsed days divided
by 365, stops at maturity, and restarts from the last confirmed value. For
quarterly compounding the factor is `(1 + r / 4)^(4t)`, where `r` is the annual
rate as a decimal and `t` is actual days / 365. Estimated values are labelled
"estimated". A manual opening amount has no start date in the current model;
without a dated value snapshot it is treated as current rather than assigning
an invented accrual period. Units are `entry amount / entry price`; withdrawals reduce units
at their entry price, and current value is total units times the latest
hand-entered price. No market data is fetched. The existing opening amount has
no historical unit-price field, so it is valued at the latest price until the
owner records priced entries.

Manual and units-price cards show the age of the last value/price and flag
updates older than 90 days. The optional monthly "Update values" reminder is
off by default. Cash and Savings accounts continue to suppress holding return
percentages. Rate is already required by the existing recurring-plan model;
P29-U preserves that requirement while keeping valuation fields optional for
manual holdings.

### Holding entry capabilities

Fixed deposits are one-time holdings: they do not accept new deposits or
recurring schedules and cannot be linked to recurring Budget schedules.
Maturity proceeds are recorded as withdrawals. Recurring deposits, SIPs and
other recurring-capable holdings retain their supported entry and schedule
flows. Existing entries on a Fixed deposit are preserved and remain available
for review, editing and deletion; the app blocks changing a holding with
entries to Fixed deposit.

### Insurance tracking

Insurance is a simple editable policy list. When there is no saved Term
insurance or Life insurance policy, the screen shows an unstored placeholder
with an Add details action; saving creates an ordinary policy. **Assumed:** the
Life placeholder uses the existing `life-savings` policy type. Other insurance
types can be added from the plus action. Policy forms capture type, name,
insurer, optional cover amount, premium, frequency, next due date, and optional
policy number and note.

The next due date is the first premium due. Later dues follow the selected
monthly, quarterly, half-yearly, yearly or custom interval (1–120 months),
with month-end date clamping, until an optional existing end date. Pending
premiums appear in Transactions, Home, Budget and reminders; paying a due
records its exact scheduled due date, the linked transaction, and advances the
schedule in one persisted write. Matching uses the due date the payment
settles, not the date it was paid, so early and late payments clear the same
slot. Undo restores the payment and transaction together. Legacy payments
without a due date keep the prior rule: payments on or after the policy's
tracking date are matched FIFO. The v17-to-v18 migration annotates only those
legacy payments that the prior schedule already matched; earlier and unmatched
payments remain historical records. Typed premium categories remain derived
from policy type; savings-policy premiums use the generic Insurance category.
The Budget Insurance system section and its categories remain fixed and
unchanged; making them editable is out of scope and requires a separate
product decision.

The migration to schema v17 removes only retired cover-goal records and policy
goal assignments. Schema v18 adds an optional due date to each policy payment
and migrates only existing payments already matched to a schedule slot by the
v17 FIFO rule. Historical policy fields not shown in the simplified form
remain in stored data. In particular, savings-policy current values and
goal-linked assets remain available to their existing investment and goal
features. Policies with a legacy inactive status remain visible as Ended and
produce no dues.

## Data and privacy

Application data is stored locally on the device; there are no user accounts or
runtime cloud synchronization. Backup files are created only when the user
exports them. Encrypted export is the default and protects the exported file
with a passphrase; the passphrase is never stored, and a lost passphrase cannot
be recovered. The optional plain-export choice is unencrypted and clearly
warns before sharing. SHA-256 in the original backup JSON checks integrity; it
is not encryption or authentication.

Backup encryption protects exported files only. App data stored on this device
remains unencrypted; an app lock or device authentication is not encryption.
Encrypted backups are decrypted in memory before the existing integrity,
validation and migration checks. Picked files use a temporary cache copy for
reading and are removed afterward. The explicit plain-export choice also uses
a temporary cache file for the system share sheet and removes it afterward.
The plaintext result of decrypting an encrypted backup is never written to a
temporary file. Operating-system backups may include app data according to
platform settings.

## Limitations and disclaimer

- Local reminders cover up to 60 nearest dated dues and refresh when the app
  opens, returns to the foreground, or relevant data/settings change. A long
  gap without opening the app may leave the reminder window empty. Notification
  delivery is local only; no push tokens, network service, or exact alarms are
  used. Android and iOS local notifications may require a development or
  production build for native validation.
- The owner reports that the app works on a physical device. Device model and
  operating system were not recorded; this is owner verification, not
  automated device evidence.
- The current `npm audit --omit=dev` run reports 7 production advisories:
  4 moderate and 3 high. These are accepted release risks because patch-level
  fixes that remain within Expo SDK 57 are not available. Major Expo/Router
  upgrades or `npm audit fix --force` require separate owner approval and are
  not included in this release.
- WealthWise is not financial, tax, legal or insurance advice. Insurance cover
  multiples and similar figures are planning guidelines only, not a judgment
  of adequacy or a recommendation.

## License

This project is licensed under the MIT License. Copyright (c) 2026 Sahil Aspak
Sheikh.

## Brand assets

To regenerate the app icon, Android adaptive assets, favicon, splash marks and
in-app BrandMark images:

```bash
npm run build:branding
npm run check:assets
```

Brand source files are in `assets/branding/`; in-app theme colors are managed
separately in `src/theme/`.
