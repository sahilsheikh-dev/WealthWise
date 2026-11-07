# WealthWise Release Checklist

## Pre-build owner steps

- Confirm the target version and changelog heading. Current release metadata is
  `0.2.0`.
- Export a plain or encrypted backup from the release candidate before
  upgrading or switching devices; retain the backup passphrase separately.
- Confirm the MIT copyright holder and store-release identities.
- Confirm notification permission, app-lock Face ID/Touch ID behavior, and
  document/share-sheet behavior on target devices.
- Confirm Apple/Google accounts, bundle/package ownership, signing credentials,
  submission privacy answers and any store screenshots or release text.
- Review the current `npm audit --omit=dev` accepted risks. Do not run
  `audit fix --force`; major Expo/Router upgrades require separate approval.
- Verify the production profile has the intended remote app-version policy and
  that automatic build-number increment is acceptable.
- Confirm EAS CLI `>=18.13.1` and the Node 26 toolchain are active.

## Device test list

Run each item on a physical iOS device and a physical Android device unless
it is platform-specific. Treat automated tests and exports as supplementary,
not as substitutes for these checks.

1. Install the exported app and complete first launch, onboarding and demo
   loading; verify Home, Transactions, Goals and Budget tabs.
2. Test text and controls at font scales `1.0`, `1.3` and `2.0`, including
   protected Home and Budget routes, bottom tabs, forms, dropdowns, modal
   sheets and screen headers. Confirm wrapping and no clipped labels or values.
3. Verify touch targets, screen-reader labels, roles, focus order, form-error
   announcements, color-independent status and no color-only meaning.
4. Test app lock: enable, disable, grace periods, previews, Face ID/Touch ID,
   fingerprint, immediate lock, background/resume lock and erase-all
   authentication.
5. Test notifications: prompt timing, permission grant/deny/blocked states,
   settings deep link, test reminder, schedule/cancel, privacy-aware text,
   foreground/background delivery and exact due-month behavior.
6. Test backup export and restore: unencrypted warning, encrypted passphrase,
  wrong passphrase, corrupt/tampered file, document picker, share sheet,
  temporary-file cleanup, invalid schema, size limit and import Undo.
7. Test native persistence across restart: SQLite read-back migration from an
   existing AsyncStorage install, legacy fallback after simulated failure, exact
   archive bytes, no legacy-copy removal until verification, and erase-all.
8. Test migrations from every supported stored/backup version through schema
   21. Add a synthetic v13 backup with net-worth, goals and Emergency Fund
   equality assertions before release; record the pre/post values.
9. Verify recurring assets: Stop, Resume, inclusive stop date, Transactions,
   Home pending dues, Budget rows and reminder suppression; confirm past unpaid
   dues remain actionable and Undo is one write.
10. Verify recurring liability Foreclosure: closure date, outstanding balance,
    overpayment charge, shortfall confirmation, linked expense, future-due
    removal, Closed filtering, note-only edit and one-step Undo.
11. Verify investment holdings: manual/recurring Deposit, Withdraw, Entries,
    opening/net Invested display, valuation methods, recurring plan details,
    stop/resume, retirement cutoff and goal/EF/return updates.
12. Verify Budget and Transactions sorting, filtering, cash-flow labels,
    recurring links, linked actuals, month scope, paid/partial/linked rows,
    category selection and frozen form inputs.
13. Verify Home/Insurance and owner-owned layouts, including the Home-only
    options menu, two-column investment Summary, liability Summary/actions,
    conditional Entries and no restored removed controls.
14. Verify stress tiers on native devices: 50-, 100-, 126-year and dense
    200-year tiers load, render, Undo and do not leak or exhaust memory.
15. Verify cold hydration, Home/Budget first render, action writes, selector
    responsiveness, notification scheduler behavior and export/import size.
16. Confirm app data does not leave the device, OS backup behavior is expected
    with Android `allowBackup: false` and no analytics/network SDK is active.
17. Record build, device model, OS version, font scale, test result and
    evidence path in the owner release record; unverified items are not
    reported as passed.

## Rollback and backups

Expo/EAS builds cannot be rolled back at application-store level by deleting a
build. Keep exported plain/encrypted backups for the same data generation,
use the store's previous-release rollback or staged-rollout controls if
available, and keep the previous native build plus its backup. Never delete
backup files from the release workspace until import/Undo verification is
complete.

## Build and tag commands

Run only after all owner pre-build checks and physical-device acceptance pass:

```bash
eas build --platform all --profile production
git tag -a v0.2.0 -m "WealthWise 0.2.0"
git push origin v0.2.0
```

These commands are intentionally not run by the release-preparation task.
