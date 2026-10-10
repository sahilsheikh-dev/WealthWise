# WealthWise

WealthWise is a local-first Expo / React Native finance app with TypeScript,
Expo Router, a typed design system, domain validation, local persistence,
backup and restore, and optional device-authenticated app lock. It has no cloud
services or account authentication.

## Create and install

```bash
npx create-expo-app@latest WealthWise --template blank-typescript
cd WealthWise
npx expo install expo-router expo-font expo-status-bar expo-splash-screen expo-constants expo-linking react-native-safe-area-context react-native-screens @expo/vector-icons @expo-google-fonts/montserrat
```

Then copy the Phase 1 source into the project and start it:

```bash
npx expo start
```

Open the QR code with Expo Go, or use the interactive terminal menu to launch
an iOS simulator or Android emulator.

## Structure

- `app/` contains the Expo Router root stack, five tabs, domain forms, backup,
  security, erase-data, Loans, and Emergency fund screens.
- `src/theme/` contains dark/light tokens and the in-memory system-aware theme.
- `src/components/ui.tsx` contains reusable accessible, themed UI components.
- `src/domain/` contains the data schema, pure financial logic, and backup
  validation.
- `src/data/` contains the local store, persistence, and separate backup
  metadata store.
- `src/mock/data.ts` contains demo values and precomputed summary figures.
- `src/lib/format.ts` provides Indian currency and date formatting.

## Validation

```bash
npm test -- --coverage
npx expo lint
npx tsc --noEmit
npx expo config --type public
```

Theme preference is in-memory. Transaction and domain data are stored locally
on this device; backup and restore are available from More.

## Data and privacy

Wealth Wise stores app data locally on this device. A backup export contains all
financial data in a readable plain-text JSON file, so anyone who can access a
copy can read it. Its SHA-256 checksum detects accidental file damage; it is
not encryption and does not prove who created or changed a file.

App lock uses the device's local authentication and does not encrypt data stored
on this device. On iOS, the operating system's device backup may include app
data; an app cannot disable that operating-system backup from within the app.
