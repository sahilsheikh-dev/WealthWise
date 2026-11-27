# WealthWise Android Device Test Checklist

This checklist records owner-run Android physical-device checks for WealthWise releases. Keep each check with the release it verifies and preserve its result history. Automated tests and Expo exports do not replace physical-device verification.

## Next release device checks

Next release (TBD)

| Field | Value |
|---|---|
| App version | TBD (unassigned until release draft finalization) |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-27 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| O86 | Verify opt-in Android notification-based transaction detection on a physical device: open Transaction detection, accept the prominent disclosure, grant Android Notification Access (including Allow restricted settings on sideloaded APK), trigger a test payment/bank notification while foregrounded (in-app review) and backgrounded (privacy-safe Review notification), verify OTP/promo/hidden notifications are ignored, and confirm/dismiss a draft without silent transaction creation. | Not run | P35-C; requires installable native Android build (config plugin `withNotificationListener`). Metadata: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-25. |
| O87 | Verify payment-reminder permission flow on a physical Android device: tap Turn on reminders in the first-launch Payment reminders sheet (or toggle Enable reminders in Reminders), confirm no `undefined is not a function` error occurs, Android 13+ displays the `POST_NOTIFICATIONS` permission dialog after creating the `reminders` channel, and denying/blocking keeps reminders off and offers Open system settings. | Not run | P24-A-R1; metadata: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-27. |
| O88 | Verify "Automatically detect transactions" entry points on Home and Transactions on a physical Android device: confirm both tabs show `Not set up` initially, update to `Notification access needed` or `Notification permission needed` if either permission is missing/revoked, show `Enabled` once both are granted, and open `/transaction-detection` when tapped. | Not run | P35-C-R1; metadata: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-27. |

## v1.0.0 device checks

Version 1.0.0 · Published 2026-11-07

| Field | Value |
|---|---|
| App version | 1.0.0 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-07 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| X1 | Download the APK from the README link. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| X2 | Verify the APK SHA-256 against the retained build artifact before installation. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| X3 | Install the APK and open the app. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| X4 | Confirm About/version shows 1.0.0. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| A1 | Confirm data remains intact after install or restore. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| A2 | Force-close and reopen; confirm data remains. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| A3 | Confirm the app works in airplane mode. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| A4 | Confirm the first-launch reminders prompt appears once; try Not now, Close, and Android back. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| B5 | With reminders enabled and permission granted, verify day-before and same-day notifications. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| B6 | Verify the permission-denied message and monthly Update values reminder on/off behavior. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| C7 | Confirm the three-dot options menu appears only on Home. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| C8 | Confirm Home layout: Assets and Liabilities on row 1; Emergency fund and Insurance on row 2. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| D9 | Confirm every holding shows Deposit, Withdraw, and Entries; Fixed deposit has no Deposit action. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| D10 | Confirm holding details has one Summary card. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| D11 | Verify font scales 1.3 and 2.0. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| D12 | Add 10,000, five deposits of 1,000, and a 2,000 withdrawal; confirm 7 entries and Invested 13,000. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| E13 | Add a back-dated deposit; verify value rises, edit/delete work, and Undo restores it. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| E14 | Verify RD 73,000 plus four deposits of 2,000 shows Invested 81,000 and value 81,000. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| E15 | Verify Fixed deposit has no deposits and maturity withdrawal works. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| E16 | Withdraw more than profit; verify Invested floors at 0 and Cost recovered is shown. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| E17 | Verify Cash and Savings show no return percentage. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| F18 | Verify rate, compounding, and maturity show “estimated”; restart after Update value. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| F19 | Verify priced stock/gold entries and Update price. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| F20 | Verify the 90-day stale flag. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| G21 | Stop investment on each recurring card; verify future dues disappear everywhere while past unpaid dues remain. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| G22 | Verify stopped date is shown and Resume investment restores dues. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| G23 | Deposit while stopped; verify Undo restores the previous state. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| H24 | Verify liability cards show Pay EMI, Foreclosure, and Entries in one row. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| H25 | Verify Foreclosure exact amount, overpayment with a separate charge, and underpayment with a second confirmation. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| H26 | Close a loan; verify dues disappear and net worth rises, then Undo restores the loan. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| H27 | Verify Closed filter, note-only edit, and confirmed delete. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| H28 | Verify liability details have no Schedule/Payments tabs and Summary shows Outstanding, Paid, Interest accrued, and Next due. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| I29 | Verify Term and Life placeholders; add, edit, and delete a policy with Undo. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| I30 | Pay a premium early from Insurance, Home, Transactions, and a reminder; verify custom frequency. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| J31 | Verify Budget scope popup applies on selection; Close, backdrop, and Android back apply nothing. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| J32 | Link a Budget investment to a holding; verify Fixed deposit cannot be linked. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| J33 | Verify Paid amount dialog for lower amount, higher amount, and Not paid. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| K34 | Verify Transactions has no Review-month link, Today button works, and past goal year works. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| K35 | Export encrypted backup; restore with correct passphrase, reject wrong passphrase, and verify plain-backup warning. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| K36 | Restore a backup and compare net worth; verify Erase all clears data. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| L37 | Load 50-year data from the dev menu and verify smooth use and Undo; confirm larger export is refused with a message. | Pass | Owner-reported physical-device verification, 2026-11-07. |
| M38 | Verify dark theme, font scales 1.3 and 2.0, Android back, and lock screen. | Pass | Owner-reported physical-device verification, 2026-11-07. |

### Owner follow-up

Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-07.

## v1.1.0 device checks

Version 1.1.0 · Published 2026-11-08

| Field | Value |
|---|---|
| App version | 1.1.0 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-08 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| N39 | Add quarterly and yearly income with a first-due month; check planned income, Received dues, and projected cash flow in due and non-due months. Export a backup, erase all, restore it, and verify frequencies survive. | Pass | Owner-reported physical-device verification, 2026-11-08. |
| N40 | Edit a value and verify it refreshes immediately without restarting the app. | Pass | Owner-reported physical-device verification, 2026-11-08. |
| N41 | Verify Budget overview shows the aggregate Pace graph and no stacked bar. | Pass | Owner-reported physical-device verification, 2026-11-08. |
| N42 | Mark linked recurring-plan dues and liability EMIs as Paid from Transactions, Home, Budget and reminder confirmation; verify linked ledgers update and Undo restores all changes. | Pass | Owner-reported physical-device verification, 2026-11-08. |
| N43 | Verify recurring investment and liability Entries show completed/pending counts, collapsed paid rows, and no installments after maturity or the final EMI date. | Pass | Owner-reported physical-device verification, 2026-11-08. |

### Owner follow-up

The owner reports N39-N43 passed on 2026-11-08 and N44 passed on 2026-11-09, superseding the earlier Fail/Not run results.

The Release 2 recurrence, edit-refresh, aggregate Pace, paid-sync/Undo, Entries, and linked one-time savings Paid/Undo checks are recorded as passed.

Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

## v1.1.1 device checks

Version 1.1.1 · Published 2026-11-09

| Field | Value |
|---|---|
| App version | 1.1.1 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-09 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| N44 | Linked one-time savings item marked Paid from Transactions creates a holding entry; Undo removes it. | Pass | Owner-reported physical-device verification, 2026-11-09; P20-A-R2. |

### Owner follow-up

Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream on 2026-11-09.

## v1.2.0 device checks

Version 1.2.0 · Published 2026-11-11

| Field | Value |
|---|---|
| App version | 1.2.0 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-11 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| O45 | Install the v1.2.0 APK; confirm About shows version 1.2.0 and schema version 23. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O46 | In airplane mode, verify local app behavior; cancel Check for updates, then confirm it opens the GitHub releases page in the browser without an in-app check. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O47 | Create Real estate and named Custom holdings, then verify names in cards, search and filters; verify recurring and one-time asset forms use the same title and option order. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O48 | Create a named Custom liability; verify recurring and one-time liability forms use the same title and options, and Fixed deposit is rejected with a clear message in recurring mode. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O49 | Verify once-only Budget item, income and insurance dues occur only in their first-due month/date, do not repeat, and do not offer percentage mode. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O50 | Verify in-progress and completed liabilities and goals appear in the correct collapsed sections with counts; filters, sorting, search and Closed filter still work, and Emergency fund remains pinned. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O51 | Verify Budget Overview has no redundant Pace or Over by/Left summary text; confirm the chart, Left table row and accessible descriptions remain. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O52 | Verify all four stress-tier choices, cancellation, Undo, and usability at font scales 1.3 and 2.0. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O53 | Verify font scales 1.3 and 2.0 and screen-reader labels/reading order on About, Budget, liabilities and goals. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O54 | Verify accessibility and large text across remaining screens: font scales 1.3/2.0, screen-reader announcements and focus order, touch targets, and form validation on iOS/Android. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O55 | Verify native dialogs and navigation: backdrop taps, Android Back, scope-picker dismissal, and Home-only menu visibility/behavior. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O56 | Verify reminder/notification permission granted, denied and blocked flows; delivery/timing, lock-screen content, cold-start taps, and paying/undoing dues from each entry point. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O57 | Verify persistence/storage on device: SQLite migration/restart, AsyncStorage fallback, large-data loading, storage capacity/responsiveness, and stress-data load/Undo. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O58 | Verify financial flows on device: holding entries/valuations, linked transaction/goal/Emergency Fund updates and Undo, recurring-plan stop/resume, and liability closure/foreclosure. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O59 | Verify backup/restore on device: encrypted export/import, wrong-passphrase handling, native file picker/share sheet, and erase-all. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |
| O60 | Verify Budget/list layouts: recurring holding/liability summaries, completed/pending counts and date ordering at larger font scales. | Pass | Owner-reported, 2026-11-11. Physical-device verification. |

### Owner follow-up

The owner reports O45-O60 passed on 2026-11-11. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

## v1.3.0 device checks

Version 1.3.0 · Published 2026-11-22

| Field | Value |
|---|---|
| App version | 1.3.0 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-22 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| O61 | Verify the searchable Dropdown keyboard remains usable and the sheet stays keyboard-safe on iOS and Android. | Pass | P20-S-R2; owner-reported physical-device verification, 2026-11-22. |
| O62 | Verify screen readers announce the filtered-result count politely on iOS and Android. | Pass | P20-S-R2; owner-reported physical-device verification, 2026-11-22. |
| O63 | Verify the Dropdown clear-search control meets the 44x44 pt tap target on iOS and Android. | Pass | P20-S-R2; owner-reported physical-device verification, 2026-11-22. |
| O64 | Verify searchable Dropdown row layout and operation at real-device font scales 1.3 and 2.0 on iOS and Android. | Pass | P20-S-R2; owner-reported physical-device verification, 2026-11-22. |
| O65 | Edit and save an Emergency Fund target from its screen on a physical device. | Pass | P21-F; owner-reported physical-device verification, 2026-11-22. |
| O66 | Verify Emergency Fund target Undo toast timing and exact one-step restoration on a physical device. | Pass | P21-F; owner-reported physical-device verification, 2026-11-22. |
| O67 | Verify Home and Goals refresh to the edited Emergency Fund target on a physical device. | Pass | P21-F; owner-reported physical-device verification, 2026-11-22. |
| O68 | Verify Emergency Fund target form layout at font scales 1.3 and 2.0 on a physical device. | Pass | P21-F; owner-reported physical-device verification, 2026-11-22. |
| O69 | Verify an Invest transaction shows a neutral category before holding selection, blocks Save without a holding, and derives the category after selection. | Pass | P20-W D1; owner-reported physical-device verification, 2026-11-22. |
| O70 | Verify the expense Budget category picker, derived section context, searchable Custom option and custom category entry on iOS and Android. | Pass | P20-W D2; owner-reported physical-device verification, 2026-11-22. |
| O71 | Verify custom earned-income type entry and persistence in Budget income and Transaction forms, including trimming and reopening the saved value. | Pass | P20-W D3 implemented under schema v24; owner-reported physical-device verification, 2026-11-22. |
| O72 | Verify Transaction form scrolling, validation, category picker and custom category entry at font scales 1.3 and 2.0 on iOS and Android. | Pass | P20-W; owner-reported physical-device verification, 2026-11-22. |
| O73 | On a physical device, use Spend, Invest and Income items, including one-time and recurring items where applicable. Edit name, value/amount, start month, frequency and due day; verify both single-month and this-and-following edits. Delete with each scope, restart after each flow, and confirm the changed values and deletions persist. | Pass | P20-U-R1; owner-reported physical-device verification, 2026-11-22. |
| O74 | On a physical device, create a linked one-time savings Budget item, then mark it Paid from Transactions with a different viewed month and after a month-only edit; verify one holding Deposit, one linked transaction, correct Budget actual, one-write persistence and one-step Undo. | Pass | P20-A-R3; owner-reported physical-device verification, 2026-11-22. |
| O75 | Verify Budget category and item sorting on iOS and Android: SortChip in filter panel on Budget screen, persistent sort order across app restart, and category dropdown sorting in TransactionForm and BudgetIncomeForm at font scales 1.0, 1.3, and 2.0. | Pass | P20-X; owner-reported physical-device verification, 2026-11-22. |
| O76 | Verify payment date prompt when marking scheduled/budgeted items Paid in Transactions and Budget (default today, customizable, historical dates preserved), verify linking one asset to multiple one-time investment budgets and paying each updates correct holding and budget actuals, and verify Transaction form Expense category dropdown only displays user-created or applicable scheduled categories while preserving historical removed categories when editing. | Pass | P20-Y; owner-reported physical-device verification, 2026-11-22. |

### Owner follow-up

The owner reports O75 and O76 passed on 2026-11-22. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O61-O74 passed on 2026-11-22. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

## v1.4.0 device checks

Version 1.4.0 · Published 2026-11-25

| Field | Value |
|---|---|
| App version | 1.4.0 |
| Device model | realme Narzo 60 Pro 5g |
| Android version | 15 Vanilla Ice Cream |
| Tester | sahilsheikh-dev |
| Date | 2026-11-25 |

Use only `Pass`, `Fail`, or `Blocked` after running each check. `Not run` remains the pending marker.

### Results

| ID | Test | Result | Notes |
|---|---|---|---|
| O77 | Verify budget item and section rename on a physical device: rename an expense, investment, or income budget item and a section across month and following scopes; confirm that linked transactions update to display the new category name in Transactions list, filter, and detail views, while preserving the transaction amount, date, budget link, and custom note (even when the note matches the old item or section name). | Pass | P20-Y-R5; owner-reported physical-device verification, 2026-11-23. |
| O78 | Verify dynamic Budget category filter on a physical device: open Filter panel in Budget, verify category filter chips alongside SortChip defaulting to "All" and listing available categories (Income, Expenses, Needs, Wants, Debt, Assets, Liabilities, and newly created categories); verify selecting each category filters the visible Budget sections correctly, verify filter indicator on Filter icon when active, and verify category persistence across month navigation. | Pass | P20-Z; owner-reported physical-device verification, 2026-11-23. |
| O79 | Verify Budget filter icon indicator dot behavior and margin on a physical device: confirm that the filter icon in Budget does not show a dot indicator when category filter is "All" (default), matching Assets, Liabilities, and Transactions filter icon appearance; confirm that the dot indicator appears only when a specific category is filtered; confirm that the filter panel margin aligns with the screen layout. | Pass | P20-Z-R1; owner-reported physical-device verification, 2026-11-23. |
| O80 | Verify persistent sorting preferences across screens on a physical device: change sort order on Transactions, Assets, Liabilities, and Budget; verify preferences persist when switching between screens and after app close and reopen; confirm filters remain separate and unchanged. | Pass | P17-C-R1; owner-reported physical-device verification, 2026-11-23. |
| O81 | Verify dynamic asset valuation inputs and calculations on a physical device: create and edit one-time and recurring assets with Manual, Interest-based, Unit-based, and Balance-based valuation methods; verify form inputs adjust dynamically for each method (e.g., auto-calculation of units and total value for unit-based, interest rate and compounding for interest-based, read-only calculated balance for balance-based); verify holding value calculation, value update route, and persistence across app restart. | Pass | P29-U-R1; owner-reported physical-device verification, 2026-11-24. |
| O82 | Verify consistent filter panels and absence of filter icon dot indicator on a physical device: open filter panel across Goals, Assets, Liabilities, Transactions, and Budget; verify Goals offers status (All, In progress, Achieved) and target year filter chips alongside SortChip; verify selecting filters and changing sort orders across all 5 screens keeps sort and filter states independent; verify that the header filter icon never displays a dot indicator initially or after changing sorting or filtering on any screen. | Pass | P20-L-R1; owner-reported physical-device verification, 2026-11-24. |
| O83 | Verify modal presentation and deep-link parameter fallback on a physical device: open `ef-allocation-form`, `holding-valuation-form`, `liability-closure-form`, `liability-closure-note-form`, and `recurring-plan-stop-form` in-app to confirm modal presentation; open a `wealthwise://` deep link with a missing or invalid ID (for example, `wealthwise://holding-valuation-form?id=missing`) and confirm the safe empty/unavailable screen renders without crashing and Close navigates to a valid screen. | Pass | P39-H-R1; owner-reported physical-device verification, 2026-11-25. |
| O84 | Verify Demo Mode and production APK behavior after Expo SDK 57 patch alignment on a physical device: enable/use Demo Mode in-app and verify screens, reminders, SQLite persistence, and backup export/import operate normally on the aligned SDK 57 packages. | Pass | P39-H-R1; owner-reported physical-device verification, 2026-11-25. |
| O85 | Verify Expo SDK 58 / React Native 0.88.1 runtime, bottom tab navigation (`navigateToTab`), forms, SQLite persistence, local notifications, biometrics, and backup export/import on a physical Android device. | Pass | CR-170; owner-reported physical-device verification, 2026-11-25. realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev. Expo SDK 58 / React Native 0.88.1 runtime, bottom tabs, forms, SQLite persistence, local notifications, biometrics, and backup export/import verified. |

### Owner follow-up

The owner reports O77 passed on 2026-11-23. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O78 and O79 passed on 2026-11-23. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O80 passed on 2026-11-23. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O81 and O82 passed on 2026-11-24. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O83 and O84 passed on 2026-11-25. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream.

The owner reports O85 passed on 2026-11-25. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream. Expo SDK 58 / React Native 0.88.1 runtime, bottom tab navigation, forms, SQLite persistence, local notifications, biometrics, and backup export/import verified.

## Release gate

A release must not be built, drafted, tagged or published while any row in ANY section of the device checklist (the Next release section and every earlier section) has a Result other than Pass. Not run, Fail and Blocked all block. Check the checklist first; if blocked, stop and report the blocking IDs, and do not start the build or the GitHub Release draft. A Pass may only be recorded from an owner-observed or owner-reported device result, never inferred from automated tests or Expo exports. Only an explicit written owner waiver for named IDs lifts the block; record the waiver in the ledger (Owner-run actions log) and in the release note, and leave the row's Result unchanged.

Maintenance rules: new device checks go under Next release device checks (or the decided version's section) with the next free ID, never into a published release's section, never renumbered. When the next version is decided, retitle that section `## vX.Y.Z device checks (next release)` and fill its App version. On publication, retitle it `## vX.Y.Z device checks`, set the published date, move it to the bottom of the version list (ascending order), and create a new empty `## Next release device checks` section at the top. Device-check results the owner reports are recorded under rule R8 (Owner-run actions log) with their evidence. When updating the device checklist, agents must prompt the owner to confirm all metadata fields before making changes: Device model, Android version, Tester (always record the tester username, e.g., sahilsheikh-dev), and verification Date, providing suggestions based on previous releases data (e.g., realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev). For any new feature, bug fix, behavior change, or revision that modifies user-facing behavior, data integrity, calculations, navigation, or forms, agents must add the corresponding physical-device verification check(s) to the device checklist under Next release device checks with the next free sequential ID (`O<n>`) in `Not run` status, and record the check ID in `docs/PROGRESS.md`, `status.md`, and `open-items.md`. Once a release is published, move all checks verified for that specific version into its own `## vX.Y.Z device checks` section placed below previous release checks in ascending version order, keeping each specific version's checks strictly under its own release section, while `## Next release device checks` retains only unreleased checks for the next version. Agents must never add, bump, or assign a specific application version number in the device checklist, metadata tables, package manifests, or anywhere in the repository until the owner explicitly decides to prepare a release candidate draft; until a release draft is finalized, keep the version unassigned (TBD / Next release).

## How to run

1. Download the APK using the README Download link and verify its SHA-256
   against the retained build artifact before installing. Do not publish the
   digest. Allow installs from this source in Android settings if prompted.
2. Fill in the device and tester fields above (confirming Device model, Android version, Tester username, and Date before updating, with suggestions from prior releases), run each scenario, and replace `Not run` only with `Pass`, `Fail`, or `Blocked`. Record steps and observed behavior in Notes; do not infer a pass from an automated test.
3. Report failures in a
   [WealthWise GitHub issue](https://github.com/sahilsheikh-dev/WealthWise/issues)
   and link it in Notes. Include app/device versions, reproduction steps,
   expected and actual behavior, and relevant screenshots. Do not attach
   backups or personal financial data.
