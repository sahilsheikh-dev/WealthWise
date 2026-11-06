> AI agents: read [docs/memory/README.md](docs/memory/README.md) first. Before
> finishing, update `status.md` and `open-items.md` there.

This `AGENTS.md` is the repository's single instruction entry point for every
AI tool. Keep tool-specific instruction files out of the repository; update
these shared instructions instead.

WealthWise is an offline-first Expo SDK 57 / React Native application. Use npm
(`package-lock.json` is present) and Node.js 26 LTS (`.nvmrc` pins 26.13.0;
`engines` allows `>=26.0.0 <27`); routes are in `app/`, not `src/app/`.

## Project rules

- Read `docs/PROGRESS.md` before changing behavior; update its decision and
  verification records with the same task commit.
- Treat `app/(tabs)/index.tsx` as user-owned; do not edit without explicit task
  authorization. Preserve the separately hashed files listed in
  `docs/memory/rules.md`.
- Keep `src/domain/` pure: no React/Expo imports, clock reads or randomness.
  Inject dates and identifiers.
- A multi-entity action must be one pure domain action and one Zustand store
  `set`, producing one persisted write.
- Use Expo Router for navigation. Forms use React Hook Form `Controller` and
  `useWatch`; React Compiler is enabled.
- Do not use `!` or `as` to silence nullability in `app/` or
  `src/components/`. Format amounts with `AmountText` or `formatAmount` and an
  explicit display tier.
- Keep tabs Home, Transactions, Goals and Budget. Preserve the Budget cash-flow
  labels, `SortChip.tsx`, `src/lib/sorting.ts`, frozen inputs in
  `src/components/form/`, and the `formComponentsFrozen` test unless the task
  explicitly requires a change.
- Do not weaken assertions. If a design is superseded, document the old
  assertion, its replacement and the reason in `docs/PROGRESS.md`.
- Check the installed Expo major version before using Expo APIs and consult
  matching Expo documentation. Keep native changes in app config/plugins;
  do not hand-edit generated native files.

## Schema and verification

Current persisted schema version: **21**. Preserve migration and backup-import
compatibility.

Run the gates in this order, recording each exit code:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Layout tests are simulated. Record physical-device checks that remain
unverified in `docs/PROGRESS.md`.
