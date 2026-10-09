# WealthWise

Phase 1 of the WealthWise mobile MVP: Expo, TypeScript, Expo Router tabs, a
typed in-memory theme, bundled Montserrat and Feather assets, and static demo
screens. No authentication, network services, persistence, or form flows are
included in this phase.

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

- `app/` contains the Expo Router root stack, five tabs, Loans, and Emergency
  fund screens.
- `src/theme/` contains dark/light tokens and the in-memory system-aware theme.
- `src/components/ui.tsx` contains reusable accessible, themed UI components.
- `src/domain/types.ts` locks the static data schema.
- `src/mock/data.ts` contains demo values and precomputed summary figures.
- `src/lib/format.ts` provides Indian currency and date formatting.

## Validation

```bash
npx expo lint
npx tsc --noEmit
```

The theme switch is intentionally in-memory. Form-entry actions are tappable
placeholders for Phase 5; Export and Reset remain disabled in this static phase.
