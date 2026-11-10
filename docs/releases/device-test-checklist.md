# WealthWise v1.0.0 Android Device Test Checklist

| Field | Value |
|---|---|
| App version | 1.0.0 |
| Device model | |
| Android version | |
| Tester | |
| Date | |

## Results

Use only `Pass`, `Fail`, or `Blocked` after running each check.

| ID | Test | Result | Notes |
|---|---|---|---|
| X1 | Download the APK from the README link. | Pass | |
| X2 | Verify the APK SHA-256 against the retained build artifact before installation. | Pass | |
| X3 | Install the APK and open the app. | Pass | |
| X4 | Confirm About/version shows 1.0.0. | Pass | |
| A1 | Confirm data remains intact after install or restore. | Pass | |
| A2 | Force-close and reopen; confirm data remains. | Pass | |
| A3 | Confirm the app works in airplane mode. | Pass | |
| A4 | Confirm the first-launch reminders prompt appears once; try Not now, Close, and Android back. | Pass | |
| B5 | With reminders enabled and permission granted, verify day-before and same-day notifications. | Pass | |
| B6 | Verify the permission-denied message and monthly Update values reminder on/off behavior. | Pass | |
| C7 | Confirm the three-dot options menu appears only on Home. | Pass | |
| C8 | Confirm Home layout: Assets and Liabilities on row 1; Emergency fund and Insurance on row 2. | Pass | |
| D9 | Confirm every holding shows Deposit, Withdraw, and Entries; Fixed deposit has no Deposit action. | Pass | |
| D10 | Confirm holding details has one Summary card. | Pass | |
| D11 | Verify font scales 1.3 and 2.0. | Pass | |
| D12 | Add 10,000, five deposits of 1,000, and a 2,000 withdrawal; confirm 7 entries and Invested 13,000. | Pass | |
| E13 | Add a back-dated deposit; verify value rises, edit/delete work, and Undo restores it. | Pass | |
| E14 | Verify RD 73,000 plus four deposits of 2,000 shows Invested 81,000 and value 81,000. | Pass | |
| E15 | Verify Fixed deposit has no deposits and maturity withdrawal works. | Pass | |
| E16 | Withdraw more than profit; verify Invested floors at 0 and Cost recovered is shown. | Pass | |
| E17 | Verify Cash and Savings show no return percentage. | Pass | |
| F18 | Verify rate, compounding, and maturity show “estimated”; restart after Update value. | Pass | |
| F19 | Verify priced stock/gold entries and Update price. | Pass | |
| F20 | Verify the 90-day stale flag. | Pass | |
| G21 | Stop investment on each recurring card; verify future dues disappear everywhere while past unpaid dues remain. | Pass | |
| G22 | Verify stopped date is shown and Resume investment restores dues. | Pass | |
| G23 | Deposit while stopped; verify Undo restores the previous state. | Pass | |
| H24 | Verify liability cards show Pay EMI, Foreclosure, and Entries in one row. | Pass | |
| H25 | Verify Foreclosure exact amount, overpayment with a separate charge, and underpayment with a second confirmation. | Pass | |
| H26 | Close a loan; verify dues disappear and net worth rises, then Undo restores the loan. | Pass | |
| H27 | Verify Closed filter, note-only edit, and confirmed delete. | Pass | |
| H28 | Verify liability details have no Schedule/Payments tabs and Summary shows Outstanding, Paid, Interest accrued, and Next due. | Pass | |
| I29 | Verify Term and Life placeholders; add, edit, and delete a policy with Undo. | Pass | |
| I30 | Pay a premium early from Insurance, Home, Transactions, and a reminder; verify custom frequency. | Pass | |
| J31 | Verify Budget scope popup applies on selection; Close, backdrop, and Android back apply nothing. | Pass | |
| J32 | Link a Budget investment to a holding; verify Fixed deposit cannot be linked. | Pass | |
| J33 | Verify Paid amount dialog for lower amount, higher amount, and Not paid. | Pass | |
| K34 | Verify Transactions has no Review-month link, Today button works, and past goal year works. | Pass | |
| K35 | Export encrypted backup; restore with correct passphrase, reject wrong passphrase, and verify plain-backup warning. | Pass | |
| K36 | Restore a backup and compare net worth; verify Erase all clears data. | Pass | |
| L37 | Load 50-year data from the dev menu and verify smooth use and Undo; confirm larger export is refused with a message. | Pass | |
| M38 | Verify dark theme, font scales 1.3 and 2.0, Android back, and lock screen. | Pass | |
| N39 | Add quarterly and yearly income with a first-due month; check planned income, Received dues, and projected cash flow in due and non-due months. Export a backup, erase all, restore it, and verify frequencies survive. | Pass | |
| N40 | Edit a value and verify it refreshes immediately without restarting the app. | Pass | |
| N41 | Verify Budget overview shows the aggregate Pace graph and no stacked bar. | Pass | |
| N42 | Mark linked recurring-plan dues and liability EMIs as Paid from Transactions, Home, Budget and reminder confirmation; verify linked ledgers update and Undo restores all changes. | Pass | |
| N43 | Verify recurring investment and liability Entries show completed/pending counts, collapsed paid rows, and no installments after maturity or the final EMI date. | Pass | |
| N44 | Linked one-time savings item marked Paid from Transactions creates a holding entry; Undo removes it. | Pass | Owner-reported physical-device verification, 2026-11-09; P20-A-R2. |

## Owner follow-up

The owner reports N39-N43 passed on 2026-11-08 and N44 passed on 2026-11-09,
superseding the earlier Fail/Not run results. The Release 2 recurrence,
edit-refresh, aggregate Pace, paid-sync/Undo, Entries, and linked one-time
savings Paid/Undo checks are recorded as passed. Device model, Android
version, and tester fields remain blank.

## v1.2.0 release-candidate checks

| ID | Test | Result | Notes |
|---|---|---|---|
| O45 | Install the v1.2.0 APK; confirm About shows version 1.2.0 and schema version 23. | Pass | Owner-reported, 2026-11-11. |
| O46 | In airplane mode, verify local app behavior; cancel Check for updates, then confirm it opens the GitHub releases page in the browser without an in-app check. | Pass | Owner-reported, 2026-11-11. |
| O47 | Create Real estate and named Custom holdings, then verify names in cards, search and filters; verify recurring and one-time asset forms use the same title and option order. | Pass | Owner-reported, 2026-11-11. |
| O48 | Create a named Custom liability; verify recurring and one-time liability forms use the same title and options, and Fixed deposit is rejected with a clear message in recurring mode. | Pass | Owner-reported, 2026-11-11. |
| O49 | Verify once-only Budget item, income and insurance dues occur only in their first-due month/date, do not repeat, and do not offer percentage mode. | Pass | Owner-reported, 2026-11-11. |
| O50 | Verify in-progress and completed liabilities and goals appear in the correct collapsed sections with counts; filters, sorting, search and Closed filter still work, and Emergency fund remains pinned. | Pass | Owner-reported, 2026-11-11. |
| O51 | Verify Budget Overview has no redundant Pace or Over by/Left summary text; confirm the chart, Left table row and accessible descriptions remain. | Pass | Owner-reported, 2026-11-11. |
| O52 | Verify all four stress-tier choices, cancellation, Undo, and usability at font scales 1.3 and 2.0. | Pass | Owner-reported, 2026-11-11. |
| O53 | Verify font scales 1.3 and 2.0 and screen-reader labels/reading order on About, Budget, liabilities and goals. | Pass | Owner-reported, 2026-11-11. |

The owner reports O45-O53 passed on 2026-11-11. Device model, Android
version, and tester fields were not supplied and remain blank.

## How to run

1. Download the APK using the README Download link and verify its SHA-256
   against the retained build artifact before installing. Do not publish the
   digest. Allow installs from this source in Android settings if prompted.
2. Fill in the device and tester fields above, run each scenario, and replace
   `Not run` only with `Pass`, `Fail`, or `Blocked`. Record steps and observed
   behavior in Notes; do not infer a pass from an automated test.
3. Report failures in a
   [WealthWise GitHub issue](https://github.com/sahilsheikh-dev/WealthWise/issues)
   and link it in Notes. Include app/device versions, reproduction steps,
   expected and actual behavior, and relevant screenshots. Do not attach
   backups or personal financial data.
