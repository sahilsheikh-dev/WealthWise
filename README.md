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
- Monthly budgets with spend/invest sections, income entries, recurring item
  schedules, due tracking and cash-flow views. Scope choices apply immediately;
  Close, backdrop and Android back dismiss without changing the budget.
- Savings goals, goal-linked assets and an emergency fund with editable
  allocation items.
- Simple editable insurance policy tracking with scheduled premium dues for
  term life, life, health, motor, home and other cover.
- Local backup export and restore with schema validation and a SHA-256
  integrity check.
- Local payment reminders with privacy-aware notification text and an
  in-app paid/not-paid confirmation route. A one-time in-app prompt offers
  setup after unlock; system permission is requested only after choosing
  Turn on reminders.
- Optional device-authenticated app lock and locally stored theme preferences.

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
validate persisted and imported data.

### Investment return calculations

Invested is the opening amount plus all deposit entries. Withdrawals are shown
separately and do not reduce Invested. Zero entries are ignored; same-day
entries are summed. Current value uses a recorded valuation when one exists:
add deposits and subtract withdrawals dated after that valuation, through the
requested as-of date. Entries dated on or before the valuation are treated as
already included. Without a recorded valuation, current value is opening plus
posted deposits minus posted withdrawals through the as-of date. Values never
fall below zero. The app does not estimate interest; current value changes
only when entries are recorded or a valuation is entered.

The absolute gain and return are:

`gain = current value + withdrawals - Invested`

`absolute return % = gain / Invested × 100`

When Invested is zero, the return is `null` and the card says "No return yet".
XIRR solves
`sum(cash flow / (1 + rate)^(days from first flow / 365)) = 0`, using deposits
as negative cash flows, withdrawals as positive cash flows, and current value
as positive on the valuation date. Multiple entries use the XIRR label; one
lump sum uses CAGR: `(current value / Invested)^(365 / span days) - 1`.
Annualised XIRR/CAGR appears only when the first cash flow to valuation date
span is at least 365 days. Under 365 days the card shows only the labelled
absolute return. Cash and Bank holdings show Balance, Deposited and Withdrawn,
never a return percentage, XIRR or CAGR. If entries predate a recorded
valuation, the card explains that they are assumed included in the valuation.

### Recurring liability balances

Recurring liability balances currently accrue simple interest by actual
calendar days over a 365-day year. Interest accrues from the loan start or
previous payment date through the next recorded payment date, then the
recorded payment is subtracted; interest continues through the requested
as-of date after the last payment. A delayed payment therefore accrues through
its actual recorded date. The calculation does not round between periods.
This is the app's accounting convention, not a claim about a lender's method;
compare against a statement using its as-of date and actual payment records.

Zustand persists app data through AsyncStorage. Persisted schema version 18 is
the current version. The migration chain upgrades supported data from schema
versions 1 through 17. Backup import verifies the file integrity and validates
the imported data, applying supported migrations where required.

The bottom tabs are Home, Transactions, Goals and Budget. Route screens for
liabilities, investments, insurance, forms, backup and settings live directly
under `app/`.

### Investment returns and linked amounts

A goal's saved amount is the sum of the full current values of all assets linked
to that goal, so an asset may be counted in multiple goals. Emergency-fund
bucket targets use the user-set goal target with the three-month minimum
retained only as a floor; each bucket's available amount is the sum of the full
values of assets linked to that bucket.

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
- `npm audit --omit=dev` reported 27 advisories (6 high, 20 moderate, 1 low);
  `npm audit` reported 55 (6 high, 44 moderate, 5 low). These include
  production-dependency-tree and development/build-tool findings; see the
  progress ledger for package lists.
- WealthWise is not financial, tax, legal or insurance advice. Insurance cover
  multiples and similar figures are planning guidelines only, not a judgment
  of adequacy or a recommendation.

## License

This project is licensed under the MIT License. Copyright (c) 2026 Sahil Aspak
Sheikh. The license holder is based on the locally configured account name and
should be confirmed by the owner.

## Brand assets

To regenerate the app icon, Android adaptive assets, favicon, splash marks and
in-app BrandMark images:

```bash
npm run build:branding
npm run check:assets
```

Brand source files are in `assets/branding/`; in-app theme colors are managed
separately in `src/theme/`.
