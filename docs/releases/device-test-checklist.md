# WealthWise v1.0.0 Android Device Test Checklist

| Field | Value |
|---|---|
| App version | 1.0.0 |
| APK SHA-256 | `ddaac3222cd4069d1c2121b3fcb9410724b9ee23649ddcc2603cd7c90a796af3` |
| Device model | |
| Android version | |
| Tester | |
| Date | |

## Results

Use only `Pass`, `Fail`, or `Blocked` after running each check. Every result
below is initially **Not run**.

| ID | Test | Result | Notes |
|---|---|---|---|
| X1 | Download the APK from the README link. | Not run | |
| X2 | Verify the APK SHA-256 matches the README. | Not run | |
| X3 | Install the APK and open the app. | Not run | |
| X4 | Confirm About/version shows 1.0.0. | Not run | |
| A1 | Confirm data remains intact after install or restore. | Not run | |
| A2 | Force-close and reopen; confirm data remains. | Not run | |
| A3 | Confirm the app works in airplane mode. | Not run | |
| A4 | Confirm the first-launch reminders prompt appears once; try Not now, Close, and Android back. | Not run | |
| B5 | With reminders enabled and permission granted, verify day-before and same-day notifications. | Not run | |
| B6 | Verify the permission-denied message and monthly Update values reminder on/off behavior. | Not run | |
| C7 | Confirm the three-dot options menu appears only on Home. | Not run | |
| C8 | Confirm Home layout: Assets and Liabilities on row 1; Emergency fund and Insurance on row 2. | Not run | |
| D9 | Confirm every holding shows Deposit, Withdraw, and Entries; Fixed deposit has no Deposit action. | Not run | |
| D10 | Confirm holding details has one Summary card. | Not run | |
| D11 | Verify font scales 1.3 and 2.0. | Not run | |
| D12 | Add 10,000, five deposits of 1,000, and a 2,000 withdrawal; confirm 7 entries and Invested 13,000. | Not run | |
| E13 | Add a back-dated deposit; verify value rises, edit/delete work, and Undo restores it. | Not run | |
| E14 | Verify RD 73,000 plus four deposits of 2,000 shows Invested 81,000 and value 81,000. | Not run | |
| E15 | Verify Fixed deposit has no deposits and maturity withdrawal works. | Not run | |
| E16 | Withdraw more than profit; verify Invested floors at 0 and Cost recovered is shown. | Not run | |
| E17 | Verify Cash and Savings show no return percentage. | Not run | |
| F18 | Verify rate, compounding, and maturity show “estimated”; restart after Update value. | Not run | |
| F19 | Verify priced stock/gold entries and Update price. | Not run | |
| F20 | Verify the 90-day stale flag. | Not run | |
| G21 | Stop investment on each recurring card; verify future dues disappear everywhere while past unpaid dues remain. | Not run | |
| G22 | Verify stopped date is shown and Resume investment restores dues. | Not run | |
| G23 | Deposit while stopped; verify Undo restores the previous state. | Not run | |
| H24 | Verify liability cards show Pay EMI, Foreclosure, and Entries in one row. | Not run | |
| H25 | Verify Foreclosure exact amount, overpayment with a separate charge, and underpayment with a second confirmation. | Not run | |
| H26 | Close a loan; verify dues disappear and net worth rises, then Undo restores the loan. | Not run | |
| H27 | Verify Closed filter, note-only edit, and confirmed delete. | Not run | |
| H28 | Verify liability details have no Schedule/Payments tabs and Summary shows Outstanding, Paid, Interest accrued, and Next due. | Not run | |
| I29 | Verify Term and Life placeholders; add, edit, and delete a policy with Undo. | Not run | |
| I30 | Pay a premium early from Insurance, Home, Transactions, and a reminder; verify custom frequency. | Not run | |
| J31 | Verify Budget scope popup applies on selection; Close, backdrop, and Android back apply nothing. | Not run | |
| J32 | Link a Budget investment to a holding; verify Fixed deposit cannot be linked. | Not run | |
| J33 | Verify Paid amount dialog for lower amount, higher amount, and Not paid. | Not run | |
| K34 | Verify Transactions has no Review-month link, Today button works, and past goal year works. | Not run | |
| K35 | Export encrypted backup; restore with correct passphrase, reject wrong passphrase, and verify plain-backup warning. | Not run | |
| K36 | Restore a backup and compare net worth; verify Erase all clears data. | Not run | |
| L37 | Load 50-year data from the dev menu and verify smooth use and Undo; confirm larger export is refused with a message. | Not run | |
| M38 | Verify dark theme, font scales 1.3 and 2.0, Android back, and lock screen. | Not run | |
| N39 | Add quarterly and yearly income with a first-due month; check planned income, Received dues, and projected cash flow in due and non-due months. Export a backup, erase all, restore it, and verify frequencies survive. This is a known Release 2 bug area: record failures; do not fix them in this release check. | Not run | |

## How to run

1. Download the APK using the README Download link and verify its SHA-256
   before installing. Allow installs from this source in Android settings if
   prompted.
2. Fill in the device and tester fields above, run each scenario, and replace
   `Not run` only with `Pass`, `Fail`, or `Blocked`. Record steps and observed
   behavior in Notes; do not infer a pass from an automated test.
3. Report failures in a
   [WealthWise GitHub issue](https://github.com/sahilsheikh-dev/WealthWise/issues)
   and link it in Notes. Include app/device versions, reproduction steps,
   expected and actual behavior, and relevant screenshots. Do not attach
   backups or personal financial data.
