# Changelog

All notable changes to WealthWise are documented here.
Update this file for every release: add the new version heading and confirmed release date, summarise verified changes from the approved release note, and commit the update with the approved release work before creating the GitHub Release draft. Never assign a version or date before the owner authorizes release-candidate preparation.

## [Unreleased]

### New Features
- Opt-in Android notification-based transaction detection (`Transaction detection` screen): includes in-app prominent disclosure, user-selected source apps, local-only in-memory parsing without raw-text storage or SMS permissions, duplicate/7-day draft expiry, dynamic credit/debit/Investment categorization, foreground review, and privacy-safe background `Review` notifications (Android only; iOS uses manual entry).
- Added "Automatically detect transactions" setup and live status entry points on Home and Transactions, showing accurate setup/permission states (`Not set up`, `Notification access needed`, `Notification permission needed`, `Enabled`, or `Unavailable on iOS`) and routing directly to `Transaction detection`.
- Added a dedicated `Settings` screen (`app/settings.tsx`) reached from a gear button in the Home header (replacing the three-dot menu), moved all global menu options and the transaction auto-detection control there, and hid non-Settings auto-detection entry points while detection is enabled.
- Added an `Import backup` / `Cancel` confirmation prompt immediately after selecting and validating/decrypting a backup file in `Backup and restore` (`app/backup.tsx`), warning that importing replaces current app data and updating preview action wording to `Import backup`.
- Added month and year jump selectors (`MonthYearPicker`) to Transactions (`app/(tabs)/transactions.tsx`) and Budget (`app/(tabs)/budget.tsx`), allowing direct period selection while preserving previous/next-month controls, sorting, filters, empty states, and Budget's 24-month forward bound.
- Revised transaction-detection review flow to open `/transaction-form` directly as a modal over the current screen on foreground detection or background notification tap, preserving Save/Dismiss/confirmed Discard semantics, and replaced the source-app list with a Play-policy-compliant searchable picker using scoped `<queries>` for verified payment apps and observed listener apps (without `QUERY_ALL_PACKAGES`).

### Fixes
- Fixed `undefined is not a function` when allowing payment reminders from the first-launch prompt or Reminders screen by removing unbound `this.ensureChannel()` calls in `reminderNotificationAdapter`, ensuring Android creates the `reminders` channel before requesting `POST_NOTIFICATIONS`.

## [1.4.0] - 2026-11-25

### New Features
- Dynamic asset valuation methods across one-time and recurring holdings: Manual, Interest-based (rate and compounding), Unit-based (auto-calculated units and total value), and Balance-based, with live form inputs and valuation updates.
- Dynamic Budget category filter in the Budget filter panel alongside `SortChip`, listing available categories (including custom categories) and persisting across month navigation.
- Goals filter panel with status (`All`, `In progress`, `Achieved`) and dynamic target-year filter chips alongside `SortChip`.
- Persistent per-screen sorting preferences across Transactions, Assets, Liabilities, Goals, and Budget.

### Improvements
- Upgraded runtime platform to Expo SDK 58 (`react-native@0.88.1`, `expo-router@~58.0.32`), resolving the `decode-uri-component` transitive advisory.
- Consistent filter panels across Goals, Assets, Liabilities, Transactions, and Budget without header filter-icon dot indicators.
- Non-intrusive SQLite fallback warning banner when storage falls back to AsyncStorage, accurately confirming preserved local data.
- Excluded development stress-data generators from production Hermes bundles while keeping Demo Mode intact.

### Fixes
- Renaming a Budget item or section across single-month or following scopes now updates linked transaction category names while preserving transaction amount, date, budget link, and custom user notes.
- Added explicit modal route registrations for `ef-allocation-form`, `holding-valuation-form`, `liability-closure-form`, `liability-closure-note-form`, and `recurring-plan-stop-form`, plus safe fallback handling for missing or invalid `wealthwise://` deep-link parameters.

## [1.3.0] - 2026-11-22

### New Features
- Searchable, categorized modal dropdown pickers across all forms with fast filtering, section grouping, and accessible live announcements.
- Custom earned-income categories in Budget Income and Transaction forms, persisted under schema version 24.
- Budget category and item sorting throughout the Budget tab, backed by a persistent SortChip filter control.
- Customizable payment dates and amounts when marking scheduled or budgeted items Paid, defaulting to today with single-write persistence.
- Link multiple one-time investment budgets to a single asset, tracking payments and budget actuals independently.
- Edit Emergency Fund target directly from its dedicated screen with immediate recalculation across Home and Goals.
- Scoped Transaction expense categories prioritizing user-created and applicable scheduled items.

### Improvements
- Keyboard-safe modal sheets and clear search controls meeting 44×44 pt tap targets.
- Streamlined dropdown search input without duplicate header titles.

### Fixes
- None.

## [1.2.0] - 2026-11-11

### New Features
- Real estate and Custom asset types, plus Custom liability types with validated custom names.
- One-time Budget items, income and insurance premiums scheduled for a specified first-due month; they run once and do not repeat.
- Completed loans and achieved goals appear in labelled, initially collapsed sections; existing filters remain available and the Emergency Fund goal stays pinned.
- About screen accessible from the Home menu, showing app and schema versions, license, project links, and the on-device data privacy statement. Check for updates opens the GitHub releases page.

### Improvements
- Stress-tier picker supports all four choices.
- Budget Overview removes redundant Pace and Over by/Left summary text while retaining the chart, table row, and accessible descriptions.

### Fixes
- None.

## [1.1.1] - 2026-11-09

### Improvements
- Shared dropdown and input controls display consistent titles.

### Fixes
- Marking a linked one-time savings item Paid now creates its holding entry; one-step Undo removes the linked changes.

## [1.1.0] - 2026-11-08

### New Features
- Aggregate actual-versus-planned Pace graph in the Budget overview.

### Improvements
- Completed and pending schedule counts in recurring investment and liability Entries.
- Paid history is collapsed by default; pending schedule rows stay visible and stop at maturity or the final EMI.

### Fixes
- Recurring income contributes to planned amounts and dues only in its due months.
- Paid recurring investment and liability dues update linked records together and support Undo.
- Edited financial values survive app restarts.

## [1.0.0] - 2026-11-07

- WealthWise 1.0 provides an offline-first overview of net worth, accounts, transactions, goals, Emergency Fund progress and recurring dues.
- Monthly Budget planning includes income entries with monthly, quarterly, half-yearly and yearly recurrence, first-due months, Received due tracking, projected cash flow and frozen month snapshots. Schema v22 migrates existing income entries to monthly recurrence.
- Investment tracking includes manual and recurring holdings, ledger entries, optional valuations, opening capital, portfolio returns and goal links. Recurring plans support inclusive stop dates and resume; liability details support EMI payment, early foreclosure and closed-loan filtering.
- Policy tracking includes editable policies and scheduled premium dues. Insurance, Transactions, Home, Budget, goal and Emergency Fund surfaces share validated linked records, one-step Undo and local persistence.
- Users can enable privacy-aware local payment reminders after an in-app prompt. Backups support warned plain export/restore and passphrase-protected encryption, with historical migration compatibility.
- Security hardening is accepted for this release; Expo SDK 57-compatible patch-level fixes for `npm audit --omit=dev` advisories were unavailable at release time.
