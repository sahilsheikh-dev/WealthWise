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
  entries where supported.
- Manual and planned investment holdings, investment-entry history, and
  recurring and one-time liabilities with payment tracking.
- Monthly budgets with spend/invest sections, income entries, recurring item
  schedules, due tracking and cash-flow views.
- Savings goals, goal-linked assets and an emergency fund with editable
  allocation items.
- Insurance policies, policy-payment tracking and editable cover goals for
  term life, health, motor, home and other cover.
- Local backup export and restore with schema validation and a SHA-256
  integrity check.
- Local payment reminders with privacy-aware notification text and an
  in-app paid/not-paid confirmation route.
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

For every holding return screen, contributions are the sum of dated deposit
entries and withdrawals are the sum of dated withdrawal entries. Same-day
entries are summed. Absolute gain is:

`current value + withdrawals - contributions`

Absolute return is `gain / contributions`, or "No return yet" when contributions
are zero. XIRR solves dated cash flows with deposits negative, withdrawals
positive, and current value positive on the valuation date. It is labelled
XIRR for multiple entries and CAGR for one lump sum. Annualised XIRR or CAGR is
shown only when the first cash-flow date to valuation-date span is at least
365 days; shorter spans show only absolute return and its label.

Zustand persists app data through AsyncStorage. Persisted schema version 15 is
the current version. The migration chain upgrades supported data from schema
versions 1 through 14. Backup import verifies the file integrity and validates
the imported data, applying supported migrations where required.

The bottom tabs are Home, Transactions, Goals and Budget. Route screens for
liabilities, investments, insurance, forms, backup and settings live directly
under `app/`.

### Investment returns and linked amounts

For a dated holding ledger, contributions are the sum of deposit entries and
withdrawals are the sum of withdrawal entries; zero entries are ignored and
same-date entries are summed. Absolute gain is
`current value + withdrawals - contributions`. Absolute return is
`absolute gain / contributions`; when contributions are zero, the app shows
"No return yet".

XIRR solves the dated cash-flow equation
`sum(cash flow / (1 + rate)^(days from first flow / 365)) = 0`. Deposits are
negative cash flows, withdrawals are positive cash flows, and current value is
positive on the valuation date. XIRR and single-lump CAGR are shown only when
the first cash flow to valuation span is at least 365 days; under that span,
the app shows only absolute return.

CAGR is `(current value / contributions)^(365 / span days) - 1`. A goal's saved
amount is the sum of the full current values of all assets linked to that goal,
so an asset may be counted in multiple goals. Emergency-fund bucket targets use
the user-set goal target with the three-month minimum retained only as a floor.

### Insurance cover goals

Cover goals are a user-managed list of up to 20 goals. Names are unique without
case sensitivity; each policy kind can be assigned to at most one goal, and a
goal may cover a custom policy kind or no kind. Targets can use the existing
income-multiple, fixed-amount, active-only or no-target modes. Active
non-savings policies count toward an explicit goal assignment first, then fall
back to the goal matching their policy kind. Savings policies are excluded
from goal totals. Policies that do not count toward a goal remain visible under
"Not in any cover goal"; Home's total cover, yearly premium and next renewal
continue to use the existing policy summary. Custom-goal premiums use the
generic Insurance premium category for future dues, planned rows and newly
recorded payments. Typed premium categories remain derived from policy kind.
Existing transactions keep their recorded category. The Budget Insurance
system section and its categories are unchanged.

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
