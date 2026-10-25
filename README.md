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
- Insurance policies, policy-payment tracking and cover targets for term life,
  health, motor, home and other cover.
- Local backup export and restore with schema validation and a SHA-256
  integrity check.
- Optional device-authenticated app lock and locally stored theme preferences.

## Screenshots

<!-- Add current app screenshots here. -->

## Getting started

This repository uses npm and includes `package-lock.json`. Use Node.js 24 LTS
(24.3.0 or newer within the 24.x major); `.nvmrc` selects 24.22.1.

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

Zustand persists app data through AsyncStorage. Persisted schema version 13 is
the current version. The migration chain upgrades supported data from schema
versions 1 through 13. Backup import verifies the file integrity and validates
the imported data, applying supported migrations where required.

The bottom tabs are Home, Transactions, Goals and Budget. Route screens for
liabilities, investments, insurance, forms, backup and settings live directly
under `app/`.

## Data and privacy

Application data is stored locally on the device; there are no user accounts or
runtime cloud synchronization. Backup files are created only when the user
exports them. Backups contain readable financial data: the SHA-256 integrity
check is not encryption or authentication. App lock uses device authentication
and does not encrypt data stored on the device. Operating-system backups may
include app data according to platform settings.

## Limitations and disclaimer

- Reminders and notifications are not implemented.
- The interface has not been verified on physical iOS or Android devices;
  automated layout tests simulate font scales and inspect component props.
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
