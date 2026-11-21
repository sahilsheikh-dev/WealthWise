# Changelog

## [Unreleased]

## [1.1.0] - TBD

- Budget plans recurring income only in its due months. Other recurring
  schedules remain editable in a collapsed Recurring income group.
- Restored the aggregate actual-versus-planned Budget Pace graph.
- Paid recurring investment and liability dues now update their linked
  records together and can be reversed with Undo.
- Entries show completed and pending schedule counts, keep paid history
  collapsed, and stop scheduled rows at maturity or the final EMI date.
- Edited financial values are verified when saved and remain current after
  restarting the app.

## [1.0.0] - 2026-11-07

- WealthWise 1.0 provides an offline-first overview of net worth, accounts,
  transactions, goals, Emergency Fund progress and recurring dues.
- Monthly Budget planning now includes income entries with monthly, quarterly,
  half-yearly and yearly recurrence, first-due months, Received due tracking,
  projected cash flow and frozen month snapshots. Schema v22 migrates existing
  income entries to monthly recurrence.
- Investment tracking includes manual and recurring holdings, ledger entries,
  optional valuations, opening capital, portfolio returns and goal links.
  Recurring plans support inclusive stop dates and resume; liability details
  support EMI payment, early foreclosure and closed-loan filtering.
- Policy tracking includes editable policies and scheduled premium dues.
  Insurance, Transactions, Home, Budget, goal and Emergency Fund surfaces share
  validated linked records, one-step Undo and local persistence.
- Users can enable privacy-aware local payment reminders after an in-app prompt.
  Backups support warned plain export/restore and passphrase-protected
  encryption, while retaining historical migration compatibility.
- First-release hardening adds accessibility and font-scale regressions,
  long-history performance safeguards, migration safety and local-only
  storage/privacy protections.
- Security hardening is accepted for this release with the current
  `npm audit --omit=dev` result of 7 production advisories: 4 moderate and 3
  high. Expo SDK 57-compatible patch-level fixes are unavailable; upgrading
  major Expo/Router dependencies or using force fixes remains owner-approved
  work outside this release.
