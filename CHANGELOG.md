# Changelog

## [Unreleased]

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
- First-release hardening adds accessibility and font-scale regressions,
  virtualized stress data, performance budgets, dependency and dead-code
  cleanup, plain and encrypted backup compatibility, migration safety and
  local-only storage/privacy safeguards.
- Security hardening is accepted for this release with the current
  `npm audit --omit=dev` result of 7 production advisories: 4 moderate and 3
  high. Expo SDK 57-compatible patch-level fixes are unavailable; upgrading
  major Expo/Router dependencies or using force fixes remains owner-approved
  work outside this release.
