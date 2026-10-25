<!-- Purpose: Unresolved requirements, owner decisions and device verification. | Last updated: 2026-10-26 | Updates: owner and AI agents -->

# Open items

## Unresolved

- **CR-1:** reminders/notifications, permission behavior and tests remain held
  for Phase 24.
- **CR-3:** the full-width Save behavior with a visible validation summary is
  still open for `profile-form.tsx` and `transaction-form.tsx`.
- `npm audit --json` reports 8 advisories: five high
  (`@expo/cli`, `@expo/code-signing-certificates`, `expo`, `node-forge`,
  `zod`) and three moderate (`decode-uri-component`, `expo-router`,
  `query-string`). Owner direction is required; do not use
  `npm audit fix --force` or approve install scripts.
- Confirm the MIT copyright holder, currently written as
  `Sahil Aspak Sheikh` from the local account name.
- Screenshots and an EAS build are deferred to the owner’s later release work.
  The app slug was confirmed by the owner and was not changed.

## Device checks not verified

- iOS and Android physical-device rendering, clipping, dynamic type and safe
  areas, including the Insurance card at font scales 1.3 and 2.0.
- Native nested touch behavior, router navigation, accessibility
  announcements/activation, keyboard behavior and screen-reader operation.
- App lock, persistence/archive behavior, backup file interaction and native
  builds on physical devices. Automated tests simulate components and props.

## Documented assumptions and constraints

- Fixed Emergency fund allocation items use the same form as custom items but
  retain their built-in title and metadata; fixed titles are read-only.
- The P20-V form omits the Percent option for non-monthly schedules because the
  frozen SegmentedControl has no disabled option API; validation rejects
  non-monthly percent items as well.
- Node 24.22.1 is selected from the Node 24 LTS line, meeting React Native
  0.86.3's `^24.3.0` engine requirement; see P25-C in the ledger.
- Previous phase-specific assumptions remain in the linked
  [progress ledger](../PROGRESS.md), not duplicated here.
