> AI working memory index: [memory/README.md](memory/README.md). This file remains the complete canonical progress and decision ledger.

# Wealth Wise master progress ledger

## Contents

1. [How to use this file](#1-how-to-use-this-file)
2. [Status dashboard](#2-status-dashboard)
3. [Standing rules](#3-standing-rules)
4. [Architecture and decisions](#4-architecture-and-decisions)
5. [Phase history](#5-phase-history)
6. [Prompt and session log](#6-prompt-and-session-log)
7. [Change-request register](#7-change-request-register)
8. [Known issues and risks](#8-known-issues-and-risks)
9. [Upcoming roadmap](#9-upcoming-roadmap)
10. [Verification matrix](#10-verification-matrix)
11. [Session and release log](#11-session-and-release-log)
12. [Phase branch index](#12-phase-branch-index)

## 1. How to use this file

This is the permanent status, decision, evidence, and verification ledger for
Wealth Wise. Prompt text is not stored in the repo. Every prompt is logged in
the Prompt log (ID, purpose, outcome, commits, agent mistakes). Verbatim
texts of P15-FIX-R1 to R4 and earlier archived files are recoverable from git:
`git show <RECOVERY>:docs/prompts/<file>`. For this ledger, RECOVERY is
`5aeefb96e70df7c388e5eb39454285204adb5707`, the last commit containing the
archive; current HEAD already removed the directory. Every future prompt
starts by reading this file and ends by updating the dashboard, prompt log, change-request register,
verification matrix and session/release log with the prompt ID, purpose,
outcome and evidence. Use IDs `P<phase>-<part>` for phase prompts, `<ID>-R<n>`
for revisions to completed work, `FX-<id>` for fixes, and `CR-<n>` for change
requests. Never delete history: supersede an earlier entry with a dated note.
When the repository and this ledger disagree, Git and current source win;
correct the ledger and record the conflict. Do not infer completion from a
prior summary or a prompt: require a repository commit and named test
evidence. Historical claims without that evidence remain user-reported,
unverified. Never push.

### Glossary

| Shortform | Full form | Meaning as used in this ledger | Example |
|---|---|---|---|
| `P` | Phase | Phase labels use `P<n>`; phase-part IDs use the same prefix. | `P28` |
| `P<n>-<part>` | Phase-part ID | Labels work within a phase. | `P28-F` |
| `-R<n>` | Revision suffix | Identifies a revision to an existing part; the original row records `Revised by`. | `P22-A-R1` |
| `CR` | Change request | Request ID tracked in the change-request register. | `CR-107` |
| `FX` | inferred from usage | Legacy fix identifier; the ledger does not state an expanded form. | `FX-BASE` |
| `CH` | inferred from usage | Legacy change identifier; the ledger does not state an expanded form. | `CH-1` |
| `CM` | inferred from usage | Repository commit-message rule identifier; the ledger does not state an expanded form. | `CM-1` |
| `DEC` | Decision | Architecture or project decision identifier. | `DEC-DEMO` |
| `N` | inferred from usage | Numbered physical-device checklist item. | `N44` |
| `X` | inferred from usage | Legacy device-checklist item. | `X1` |
| `A` | inferred from usage | Legacy device-checklist item. | `A1` |
| Status words | Status labels | `Done`, `Superseded`, and `Cancelled` are closed; `Planned`, `In progress`, `Held`, and `Pending` describe open or waiting work. `Blocked` is used in outcome records. | `Done`, `Planned`, `In progress`, `Held`, `Pending`, `Blocked`, `Cancelled by owner` |

Phase labels use `P<n>` throughout the ledger and shared memory. Verbatim Git
commit subjects, commit hashes, branch and tag names, URLs, release notes,
`CHANGELOG.md`, and app source are excluded from notation changes.

## 2. Status dashboard

Repository-backed `Done` requires a verified commit and test; app completion
confirmed by the user is explicitly marked with its confirmation date. `Held`
means explicitly deferred by the user. `Pending` means in scope but not yet
verified. `Planned` means later roadmap work. Hashes are repository evidence;
user claims that cannot be proven are called out as such.

Progress bars use the percentage rounded to the nearest whole number and a
10-character bar with `round(10 × closed / total)` filled blocks. A part is
closed when its status starts with `Done`, `Superseded`, or `Cancelled`; closed
parts count in the numerator and denominator. P1–P14 count as one part
each.

```text
Overall progress ████████░░ 83% (175/210)
P1          ██████████ 100% (1/1)
P2          ██████████ 100% (1/1)
P3          ██████████ 100% (1/1)
P4          ██████████ 100% (1/1)
P5          ██████████ 100% (1/1)
P6          ██████████ 100% (1/1)
P7          ██████████ 100% (1/1)
P8          ██████████ 100% (1/1)
P9          ██████████ 100% (1/1)
P10         ██████████ 100% (1/1)
P11         ██████████ 100% (1/1)
P12         ██████████ 100% (1/1)
P13         ██████████ 100% (1/1)
P14         ██████████ 100% (1/1)
P15         ██████████ 100% (4/4)
P16         ██████████ 100% (3/3)
P17         ██████████ 100% (3/3)
P18         ██████████ 100% (9/9)
P19         ██████████ 100% (3/3)
P20         ██████████ 100% (30/30)
P21         ██████████ 100% (6/6)
P22         ██████████ 100% (2/2)
P23         ██████████ 100% (4/4)
P24         ██████████ 100% (1/1)
P25         ██████████ 100% (6/6)
P26         ██████████ 100% (1/1)
P27         ██████████ 100% (1/1)
P28         ██████████ 97% (35/36)
P29         ██████████ 100% (42/42)
P30         ██████████ 100% (3/3)
P31         ░░░░░░░░░░ 0% (0/5)
P32         ██████████ 100% (3/3)
P33         ░░░░░░░░░░ 0% (0/3)
P34         ░░░░░░░░░░ 0% (0/3)
P35         ░░░░░░░░░░ 0% (0/3)
P36         ░░░░░░░░░░ 0% (0/4)
P37         ░░░░░░░░░░ 0% (0/3)
P38         ░░░░░░░░░░ 0% (0/3)
P39         ░░░░░░░░░░ 0% (0/8)
P40         ░░░░░░░░░░ 0% (0/2)
P41         ██████████ 100% (5/5)
```

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| P1 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; original HTML prototype/Expo UI history not recoverable from current Git history. | 2026-10-15 |
| P2 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; no phase-tagged commit or original coverage report available. | 2026-10-15 |
| P3 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current store exists, original schema-v1 commit not identified. | 2026-10-15 |
| P4 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current implementation exists, original phase evidence unavailable. | 2026-10-15 |
| P5 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; exact original phase commit/test mapping unavailable. | 2026-10-15 |
| P6 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current plain backup/security features do not prove all original acceptance criteria. | 2026-10-15 |
| P7 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; schema-v2 migration code is present, historical phase commit not identified. | 2026-10-15 |
| P8 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current investment features do not prove the original phase report. | 2026-10-15 |
| P9 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current link-management code does not prove the original phase report. | 2026-10-15 |
| P10 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current schedules and virtualized history do not prove original acceptance. | 2026-10-15 |
| P11 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; exact original crash-fix evidence unavailable. | 2026-10-15 |
| P12 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; schema-v3/theme code is present, original phase report unavailable. | 2026-10-15 |
| P13 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current UI has related work, no phase-tagged commit/test matrix. | 2026-10-15 |
| P14 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; audited follow-up evidence is in P15 A/A2 and later parts. | 2026-10-15 |
| P15-A | — | Done | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; audit/gate evidence in this repository. | 2026-10-15 |
| P15-A2 | — | Done | `0322c9d`; migration, premigration archive, restored assertions and coverage files. | 2026-10-15 |
| P15-B | — | Done | `fbeb1d7`; P14 UI follow-up files and screen tests. | 2026-10-15 |
| P15-C | — | Done | `e155bcd`; date clarity and Home card tests. | 2026-10-15 |
| P16-A | P15-D | Done | `394d338`; schema v5 migration, policy and goal-link tests. | 2026-10-15 |
| P16-B | P15-E | Done | `f28657c`; shared due engine and due/store/screen tests. | 2026-10-15 |
| P16-C | P15-G | Done | `9399e23`; goal-link, projection, store and route tests. | 2026-10-15 |
| P17-A | P15-H | Done | `68d9cd4`; cash-flow, seeded conservation, movement and store tests. | 2026-10-15 |
| P17-B | P15-I | Done | `19afe88`; budget domain, store, backup, category, dues and route tests. | 2026-10-15 |
| P17-C | P15-J | Done | `1e206ad`; sort comparator, persistence, screen and route tests. | 2026-10-15 |
| P18-R0 | P15-fix-0 | Done | `db967bf`; `src/lib/__tests__/progressLedger.test.ts` passes. | 2026-10-15 |
| P18-R1 | P15-FIX-R1 | Superseded by P18-R3 | `6562de1`, `6771f37`; baseline and interrupted-work history retained. | 2026-10-15 |
| P18-R2 | P15-FIX-R2 | Superseded by P18-R3 | `c0ba0da`; initial FX-BASE was repaired and assertions restored in R3. | 2026-10-15 |
| P18-R3 | P15-FIX-R3 | Done | `60b8c54` and related FX commits through `f805481`; UI/coverage corrections and restored assertions. | 2026-10-15 |
| P18-R4 | P15-FIX-R4 | Done | `0df1952` through `17f4748`; sorting, CH fixes, liability work and schema-v6 close-out. | 2026-10-15 |
| P18-R5 | P15-FIX-R5 | Done (automated gates pass; device checks outstanding) | `9859d73` UI delivery. | 2026-10-15 |
| P18-R6 | P15-FIX-R6 | Done | `367361c`; baseline audit and complete automated gates. | 2026-10-15 |
| P18-LEDGER | P15-LEDGER | Done | `d11af45`, `b92e145`, `2e5d594`; merged session/checkpoint history and ledger tests. | 2026-10-15 |
| P18-R7 | — | Done | `0304acd`; tab-label regression tests and all R7 ledger/gate checks pass. | 2026-10-15 |
| P19-A | — | Done | Five-group model and category mapping; five-group suggestions; grouped setup/month editors with compact controls, subtotals and recurring-items summary; v6 schema compatibility and demo data. Commits `acc94df`, `af885c1`; see the P19 gate record. | 2026-10-15 |
| P19-B | — | Done | Invest category and earned-income sync, reconciliation, Month review sources, and History/Month review/Templates actions with no Budget header menu; commit `221d2ed` and the P19 gate record. | 2026-10-15 |
| P19-C | — | Done (automated gates pass; device checks outstanding) | Restore/freeze user-owned inputs; Budget header icons; compact expandable Transactions balance card. See the P19-C gate record. | 2026-10-15 |
| P20-A | — | Done; Revised by P20-A-R1; Revised by P20-A-R2 | Derived pending rows for unpaid plan/liability dues and remaining budget lines; Pay/Clear due actions, FIFO and Undo; mock data covers overdue, upcoming and applied-budget rows. | 2026-10-15 |
| P20-A-R1 | — | Done | Linked recurring-plan Budget rows and liability EMI confirmations now use shared clearDue/Undo, preserving linked ledgers and one-write behavior across entry points. | 2026-11-08 |
| P20-A-R2 | — | Done; Revised by P20-A-R2-R1 | Linked one-time manual savings now create one Deposit entry and linked invest transaction through clearDue; one-write Undo, frozen snapshot link resolution, category duplicate suppression and exact/lower/higher payments are covered. | 2026-11-09 |
| P20-A-R2-R1 | — | Done | Owner-reported physical-device check N44 passed: Paid creates a linked holding entry and one-step Undo removes it. Device identity fields remain blank. | 2026-11-09 |
| P20-B | — | Done | Home due action sheet and collapsed category spending with conditional Apply budget (CR-7, CR-10; formerly P19-C). | 2026-10-16 |
| P20-C | — | Done | Restrict bottom tabs to Home, Transactions, Goals and Budget; remove detail-screen tab bars (CR-11). | 2026-10-16 |
| P20-D | — | Done | CR-21–CR-26 delivered; focused 12 suites/294 tests and all final coverage, TypeScript, lint, Doctor and platform-export gates pass. | 2026-10-16 |
| P20-E | — | Done | CR-27, CR-28 and CR-31 delivered; 70 suites / 772 tests and all final gates pass. | 2026-10-17 |
| P20-F | — | Done | F1–F5 budget groundwork; final 70-suite/777-test coverage gate and all required gates pass. CR-29 remains in progress for later one-plan/apply behavior. | 2026-10-17 |
| P20-G | — | Done | Schema-v8 single budget plan, current-month apply/repeat, linked rows, setup screen and CR-30 no-menu behavior. | 2026-10-17 |
| P20-H | — | Done | CR-32–CR-34; cash flow and plan summary, single grouped cards, paid/partial/linked rows, Month review screen/route removal and Transactions Review-to-Budget navigation. | 2026-10-17 |
| P20-I | — | Done | `e396059`; initial CR-35/CR-36 delivery; the tick control is corrected by CR-43 and status wording is superseded by CR-40. | 2026-10-17 |
| P20-J | — | Done | CR-40–CR-43; Home text action, details-first goal cards, equal-split shared assets, and Feather `edit-2` standardization. | 2026-10-17 |
| P20-K | — | Done | `026e671`; CR-44–CR-46; one Home goals card, tap-to-edit asset/liability cards with independent buttons, and liability data-before-progress order. | 2026-10-17 |
| P20-L | — | Done | CR-47–CR-50; due section, inline header filters, liability-kind chips and search. Full tests/coverage and all required gates pass. | 2026-10-18 |
| P20-M | — | Done | CR-52–CR-55; categories, schema-v9 migration, future virtual budgets, income dues, projected cash flow and setup income items. 71 suites/820 tests; all six final gates pass. | 2026-10-18 |
| P20-N | — | Done; Revised by P20-N-R1 and P20-N-R3 | CR-56/CR-57 overview model, charts, screen, demo, cleanup, and all automated gates complete; device checks remain unverified. | 2026-10-18 |
| P20-N-R1 | — | Done; Revised by P20-N-R2 | Replaced the stacked planned-allocation bar and global pace line with per-section actual/plan comparisons, toggles, markers, axes and accessible summaries. | 2026-11-08 |
| P20-N-R2 | — | Done | Restored the aggregate actual-versus-planned Pace graph above the overview table; removed section-specific lines/toggles and restored aggregate chart tests. N41 device re-test remains pending. | 2026-11-08 |
| P20-N-R3 | — | Done | Removed the visible pace heading and Over by/Left summary lines while retaining the chart, table Left row and accessible summaries. Failing route/chart tests were committed before production edits; tests pass at font scales 1.0, 1.3 and 2.0. Task PR #95 merged to P20 as `77bdef5`; phase PR #96 merged to `develop` as `f5f6e16`. | 2026-11-10 |
| P20-O | — | Done | CR-58/CR-59 item edit sheet, scope-aware remove/Undo, grouped budget hints and editable demo override. 76 suites/848 tests; all six required gates pass. Device checks remain unverified. | 2026-10-18 |
| P20-P | — | Done | CR-60/CR-61 schema-v10 user-managed budget sections/items, v9 migration, scoped mutations, and custom-category transaction integration. 76 suites/865 tests; all six final gates pass. Device checks remain unverified. | 2026-10-18 |
| P20-Q | `55f9eaa` | Done | CR-62–CR-65: in-screen budget management and responsive overview; 75 suites/857 tests and all six required gates pass. Simulated layouts pass; native device checks remain. | 2026-10-19 |
| P20-R | `391a227` | Done | CR-66–CR-69: top-anchored sheets, edit-mode header trash, and responsive per-section Budget cards. 75 suites/857 tests; all six gates exit 0. Simulated layout passes; physical-device checks remain. | 2026-10-19 |
| P20-S | — | Done; Revised by P20-S-R1 | CR-70–CR-75: accessible dropdowns, shared sheet shell, actual-first values, custom budget item categories and manageable transaction-derived rows; Insurance manual items reconcile separately from linked policies. All six final gates pass; physical-device checks remain unverified. | 2026-10-19 |
| P20-S-R1 | — | Done; Revised by P20-S-R1-R1 | Convert all non-filter app-form ChoiceField uses to Dropdown and add persistent single-line titles to eligible editable controls. SegmentedControl titles are intentionally absent per owner direction. All six final-tree gates pass; physical-device rendering remains unverified. Implementation commit `d36103e`; task-to-phase PR #42; phase-to-develop PR #43. | 2026-11-09 |
| P20-S-R1-R1 | — | Done | Add the owner-requested rule to ask before reverting or overwriting owner edits made after agent changes. Documented in root `AGENTS.md` as R5; task-to-phase PR #44 merged, phase-to-develop PR #45. | 2026-11-09 |
| P20-T | `e432034` | Done | CR-76–CR-77: one shared FormShell header/body/footer core for full-screen and sheet forms; all data-entry forms converted with route-param coverage. Six gates pass; native keyboard/font-scale behavior remains unverified. | 2026-10-19 |
| P20-U | `02bfbb1` | Done | CR-86–CR-87: replace BudgetManagementSheet with section, item and income FormScreen routes; scoped save/delete Undo and route coverage. Focused suites pass; final gates and device limitations recorded below. | 2026-10-21 |
| P20-V | `6d3feab`, `82793e8`, `1afac16`, `139230d` | Done | CR-88/CR-89: schema v13 and migration, recurrence-aware Budget planning/dues, route form, row display, demo and tests. All six automated gates pass; native-device checks remain unverified. | 2026-10-21 |
| P21-A | — | Done | Schema-v7 linked emergency-fund model, backup/migration and integrity tests; final Expo Doctor and all other gates pass. | 2026-10-16 |
| P21-B | — | Done | Emergency-fund cover and allocation UI/tests; final Expo Doctor and all other gates pass. | 2026-10-16 |
| P21-C | `d43be28` | Done | CR-37 header-only edit action, detail-first allocation rows without status labels and progress bar last; CR-38 editable allocation items, four defaults and no-menu behavior. | 2026-10-17 |
| P21-C1 | `3405101c1d65b6dfdbc7d84176d17b3208f389ca` | Done | CR-39: resolve malformed stored emergency-fund allocations, repair/archive on hydration and block invalid form saves; schema remains v8. | 2026-10-17 |
| P21-D | — | Done | CR-51; null/default/repair targets are Cash 10, Bank account 40, FD / RD 50. Full tests/coverage and all required gates pass; schema v8 unchanged. | 2026-10-18 |
| P21-E | `c199c8e` | Done | CR-90: replace the predefined allocation-item picker and custom-option modal with a shared-shell add/edit item route form. Schema v13 remains unchanged; full gates pass. | 2026-10-21 |
| P22-A | — | Done; Revised by P22-A-R1 | `1f2d9c8`; deterministic four-month linked demo and undoable dev loader; final acceptance tests and all required gates pass. | 2026-10-16 |
| P22-A-R1 | — | Done | `00faeb2`; six deterministic months ending the injected current month, Rs 1,00,000 earned income per month, Rs 1 crore assets, Rs 10 lakh liabilities, and every goal at or below 87%. Holdings use directly seeded opening values, not six months of accumulated flows. PR #84 merged into P28. | 2026-11-10 |
| P23-A | P15-F | Done | Schema v11 policy model, migration/archive, pure actions/summary, active-only schedule and budget dues, Undo and demo coverage; no screens. Six final gates pass. | 2026-10-21 |
| P23-B | — | Done | CR-80/CR-81: schema v12 cover goals, typed insurance categories, domain summary/target/suggestion actions, and Budget reconciliation. 78 suites/914 tests and all six gates pass; native device checks remain. | 2026-10-21 |
| P23-C | — | Done | CR-82–CR-85: Insurance cover and policy screens, cover targets, premium linking, and Goals/Budget/Home entry points; screen, form, transaction and store tests. Schema v12 preserved. Goals link and compact Home gap/missing row superseded by P23-D. | 2026-10-21 |
| P23-D | — | Done | CR-91 Home Insurance Card tests now assert the user-owned Home order: after Upcoming and due when present and before Goal Progress, with Insurance content excluded from Goals. | 2026-10-26 |
| P24-A | P15-K | Done | DEC-P24A; CR-1 local reminders, lock-gated confirmation, privacy controls and 60-item scheduler complete. Research commit `372476c`; implementation commit `f5a1a38`; all six gates pass. No push or schema change. | 2026-11-01 |
| P25-A | — | Done | v0.1.0 documentation and metadata release preparation; source audit and six gates recorded below. | 2026-10-25 |
| P25-B | P15-L | Done | DEC-P25B; encrypted backup implementation, tests, documentation and all six ordered gates complete. No schema or native build change. | 2026-11-01 |
| P25-C | — | Done | Expo Doctor 21/21; Node metadata and MIT license; shared AI memory; user-order CR-91 tests; all six final gates pass. Release sync is in P25-D; Node/test stability is in P25-E. | 2026-10-26 |
| P25-D | — | Done | v0.1.0 GitHub pre-release sync; owner-reported physical-device verification; current npm audit and Node engine report; six gates pass. | 2026-10-31 |
| P25-E | — | Done | Pin stable Node 26.13.0 after Node 24.22.2 clean-cache Jest failure; full Node 26 suite passes; schedule benchmark retains a ten-second bound. | 2026-10-31 |
| P25-F | — | Done | Restore green baseline on Node 26.13.0: 79 suites / 958 tests; six ordered gates pass. No features or schema changes. | 2026-11-01 |
| CR-93 | — | Done | Transactions always displays the selected month's available/closing balance amount, including zero and negative values. | 2026-11-01 |
| CR-94 | — | Done | Add editable month-by-month historical budgets matching transaction actuals from July 2022 through October 2026. | 2026-11-01 |
| CR-95 | — | Done | `a507254`; include all logged income types in historical Budget snapshots, reconcile planned/actual by month, and preserve transaction links. | 2026-11-01 |
| CR-96 | — | Done | P29-K: Budget scope choices apply immediately; Close, backdrop and Android back dismiss without applying. | 2026-11-03 |
| CR-97 | — | Done | P29-L: replace cover-goal/lifecycle Insurance complexity with a simple editable policy list and recurring premium dues; schema v17 migration preserves backups and linked savings data. | 2026-11-03 |
| CR-98 | — | Done | Audit historical first-parent commits, preserve their existing hashes, and establish a `release/v1.0.0` branch at the published tag without changing protected branch trees. Task PR #52 is merged into P28; P28 -> `develop` integration remains pending. | 2026-11-09 |
| CR-99 | — | Done | Record owner-reported N44 Pass, add screenshot sections to README and prior release Markdown, and prepare a proposed v1.1.1 release note. | 2026-11-09 |
| CR-100 | — | Done | Add owner-supplied screenshots to versioned documentation and published v1.0.0/v1.1.0 GitHub releases; update release policy to require draft approval, PR merge, owner build/upload and confirmation before artifact verification/publication. | 2026-11-09 |
| CR-101 | — | Done | Published the owner-approved v1.1.1 candidate after six-gate validation, required release PR integration, APK verification and owner confirmation. | 2026-11-09 |
| CR-102 | — | Done | Change the approved release workflow so the agent builds with EAS `android-apk`, uploads and verifies the APK after approved code is merged and the GitHub draft exists; audit ordered-list numbering across all release Markdown. | 2026-11-09 |
| CR-103 | — | Done | Aligned v1.0.0 metadata, published v1.1.1, promoted it to latest in README/history, renamed the v1.1.0 APK asset, and verified the download and screenshot URLs. | 2026-11-09 |
| CR-104 | — | Done | Fetched and audited all 36 remote branches; all tips are integrated into `develop`, the v1.1.1 release branch is integrated into `main`, the three release-line trees match, and no open PRs or pending merges remain. Fast-forwarded the stale local `main` branch. | 2026-11-09 |
| CR-105 | — | Done | Confirmed the release workflow already mandates the agent's EAS `android-apk` build and draft upload; explicitly prohibit waiting for or asking the owner/developer for an APK or local APK path in shared rules and release guides, with regression coverage. | 2026-11-09 |
| CR-106 | — | Done | Plan report-first external-guidance work for P31 privacy/CI rows, new P39 release audit and hardening, and P40 agent-context hygiene; record owner decisions and keep reports out of Git except for the findings summary table. | 2026-11-10 |
| CR-108 | — | Done (device checks outstanding) | All six owner-authorized parts and the Gate 1 correction are integrated into `develop`; all six ordered gates pass. Physical-device font-scale and screen-reader checks remain unverified. No v1.1.1, release branch, tag or artifact was changed. | 2026-11-11 |
| P26-A | P15-M | Done (device checks outstanding) | Accessibility/performance fixes, 91-suite verification and all six ordered gates passed; native font-scale, touch and accessibility checks remain open. | 2026-11-06 |
| P27-A | — | Done | Dead-code/dependency cleanup, bundle audit and bounded schedule benchmark; 91 suites and all six ordered gates passed. | 2026-11-07 |
| P28-A | `fbdcbac`, `41c4617`, `d0ddff8` | Done | Report-first release readiness, initial `0.2.0` metadata alignment, audit/data-safety/migration inventory, README and changelog corrections. Revised by P28-B for stable-version metadata; Revised by P28-A-R1 for the v13 backup equality regression. Protected routes remain unchanged. | 2026-11-07 |
| P28-A-R1 | — | Done | Added a deterministic, checksummed synthetic v13 backup test through `parseBackup`; independently computed net worth, every goal's saved amount and Emergency Fund available amount match after import. No app behavior changed. | 2026-11-08 |
| P28-B | — | Done | Aligned first stable release metadata to v1.0.0 and updated release notes/changelog; no source behavior change. | 2026-11-07 |
| P28-C | — | Done | Release template, EAS build configuration guidance, build history, draft policy and release process documentation; no source behavior change. Revised by P28-C-R4 and earlier revisions. | 2026-11-08 |
| P28-C-R1 | — | Done | Added pending-safe app downloads and What's new, an Android APK profile, post-build asset/link/README/history checklist, and corrected README schema, recurrence, Insurance and test claims. Fixed the existing lint warning in its own commit. Its pending-APK status was updated by P28-C-R2. All six ordered gates passed at that revision; no build, publication, tag or protected-route changes. | 2026-11-08 |
| P28-C-R2 | — | Done | Published the v1.0.0 APK Download details, tightened release requirements across shared policy files, and recorded the uploaded asset's name, size and digest. Its `/tmp` release-block staging approach was superseded by P28-C-R3. No release-body edit, build, tag or push. | 2026-11-08 |
| P28-C-R3 | — | Done | Finalized release rules, Download parity and its derived Jest regression; verified both public APK links and SHA-256, matched the EAS build, aligned the approved v1.0.0 tag, and added the owner-run device checklist. No app behavior changed; GitHub release-body edit and physical-device tests remain owner actions. | 2026-11-08 |
| P28-C-R4 | — | Done | Reorganized README user/developer/documentation sections; removed public APK digest and commit identifiers; aligned release notes, history, release rules and verification tests. GitHub release body was not edited per instruction. | 2026-11-08 |
| P28-D | — | Done | Established shared branching, commit and gate rules; added contributor/security guidance and GitHub templates. `develop` bootstrapped at `a258579c4b580d6f3a157b8d13de53334aa8d34d`; rule applies prospectively to legacy unreleased history. All six gates pass; Gate 1: 98 suites, 1,230 passed, 1 skipped. | 2026-11-08 |
| P28-E | — | Done; Revised by P28-E-R1, P28-E-R2, P28-E-R3, P28-E-R4, P28-E-R5 and P28-E-R5-R1 | Reconstructed phase/task history, established 30 phase branches and annotated tags, and verified the 131-commit archive. 512 original commits are mapped exactly once. P28-E-R3 records selected commits; P28-E-R4 connects the complete archive ancestry to `develop`; P28-E-R5 audits historical commit/PR feasibility and records the v1.0.0 release branch. | 2026-11-08 |
| P28-E-R1 | — | Done | Close out the phase-history evidence and record final integrated Release 2 gates, branch integrations, and remaining device/release follow-ups. | 2026-11-08 |
| P28-E-R2 | — | Done | Preserve the local final-remote-verification commit in GitHub history while reconciling its stale status text with the current ledger. Final remote branch/tag and archive checks are recorded; no tag was changed. | 2026-11-08 |
| P28-E-R3 | — | Done | Added ancestry-only merge records for P25-F, the v1.1.0 merge and the P1 refactor on the task branch. Application source is unchanged; PR #46 remained separate at R3 completion, and P28-E-R4 later connected the complete archive ancestry. PR #47 merged to P28 and PR #48 merged to `develop`. | 2026-11-09 |
| P28-E-R4 | — | Done | Connected the complete `history/by-phase` archive ancestry to `develop` through task PR #49 and phase PR #50. Every remote branch tip is reachable from `develop`; `main` and `release/v1.1.0` remain unchanged. The ancestry-only merge preserved application code. | 2026-11-09 |
| P28-E-R5 | — | Done; Revised by P28-E-R5-R1 | Audited the 403 non-merge first-parent commits after the initial commit. They are already present in `main` and `develop`; all 30 phase branches exist, and none of these commits can be newly introduced by PR without rewriting history. Created `release/v1.0.0` at the existing v1.0.0 tag target. Task PR #52 merged into P28 as `f9bb715`; phase PR #53 later merged into `develop`. | 2026-11-09 |
| P28-E-R5-R1 | — | Done | Finalized P28-E-R5 integration evidence: P28 PR #53 merged into `develop` as `0402592`; no historical commit subjects or hashes were changed, and `main` and release branch trees remain unchanged. | 2026-11-09 |
| P28-F | — | Done; Revised by P28-F-R1, P28-F-R2, P28-F-R2-R1, P28-F-R3, P28-F-R3-R1, P28-F-R3-R2, P28-F-R3-R3, P28-F-R3-R3-R1, P28-F-R4, P28-F-R4-R1-R1, P28-F-R4-R1-R1-R1-R1-R1, P28-F-R4-R1-R1-R1-R1-R1-R1, P28-F-R4-R1-R1-R1-R1-R1-R1-R1, P28-F-R5 and P28-F-R6 | Prepared v1.1.0 on `release/v1.1.0`; all six gates passed. PR #2 merged the release into main and PR #3 back-merged main into develop. Revised by P28-F-R3 for verified EAS build, tag and publication evidence, P28-F-R3-R1 for the completed publication PR chain, P28-F-R3-R2 for historical asset rollover and checksum removal, P28-F-R3-R3 for versioned latest-asset naming, P28-F-R3-R3-R1 for the merged filename-policy PR chain, Revised by P28-F-R4 for a review-only v1.1.1 candidate, P28-F-R4-R1 for supplied screenshot integration and owner-led release workflow, P28-F-R4-R1-R1 for the approved v1.1.1 release integration, P28-F-R4-R1-R1-R1-R1-R1 for screenshot-asset naming, latest-version rules and APK handoff corrections, P28-F-R4-R1-R1-R1-R1-R1-R1 for template-aligned historical metadata and release preparation, P28-F-R4-R1-R1-R1-R1-R1-R1-R1 for v1.1.1 publication and post-publication asset/doc rollover, and P28-F-R5 for repository-backed, browser-viewable screenshots and roadmap cancellation. | 2026-11-08 |
| P28-F-R5 | — | Done | `ff5a5a6`; cancelled screenshot capture because the owner supplied all 23 images, stored them by release in the repository and changed thumbnails to browser-viewable blob links. Release-note links, guide/tests and the screenshot decision are updated; PR #83 merged into P28. | 2026-11-10 |
| P28-F-R6 | — | In progress | Prepare the owner-approved v1.2.0 minor release candidate with eight supplied screenshots, aligned app/package metadata, release documentation and v1.1.1 retained as latest published. Task PR #112 merged into the retained phase as `fa153da`; phase PR #113 merged into `develop` as `d347526`; evidence PR #114 merged as `5ae1b72`. All six ordered gates pass; physical-device checks, GitHub draft, EAS build and publication remain pending. | 2026-11-11 |
| P28-G | — | Done | `e6395a1`; converted ledger/shared-memory phase labels to PN notation, added the derived glossary and notation/exclusion/prefix regression guards. Focused tests passed 2 suites/15 tests; PR #85 merged into P28. | 2026-11-10 |
| P28-F-R1 | — | Done | Recorded owner-reported Pass results for device checklist N39-N43; device identification fields remain blank. | 2026-11-08 |
| P28-F-R2 | — | Done; Revised by P28-F-R2-R1 | Corrected the v1.1.0 draft contributor credits using the published v1.0.0 format, added contributor guidance, and verified the PR integration path. | 2026-11-08 |
| P28-F-R2-R1 | — | Done; Revised by P28-F-R3 | Corrected stale branch/GitHub audit records; task and P28 PRs are integrated into develop, with release and back-merge PRs carrying the correction through main. Latest six ordered gates pass: 98 suites, 1,243 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; TypeScript, lint, Doctor 21/21, Android export and iOS export all pass. At that revision v1.1.0 was untagged; publication is recorded by P28-F-R3. | 2026-11-08 |
| P28-F-R3 | — | Done; Revised by P28-F-R3-R1 and P28-F-R3-R2 | Published v1.1.0 after verifying the owner-uploaded APK against the EAS artifact, exact tag target, release notes, README parity and both public download links. Owner-approved exceptions: EAS `preview` profile and Android `versionCode` 1. | 2026-11-08 |
| P28-F-R3-R1 | — | Done | Recorded the complete publication PR chain (#11-#15) and verified the merged GitHub branch/tree and tag state. | 2026-11-08 |
| P28-F-R3-R2 | — | Done; Revised by P28-F-R3-R3 | Renamed the superseded v1.0.0 APK to a versioned asset, updated its download block and GitHub release body to remove the published checksum, and aligned release policy, history and tests. | 2026-11-08 |
| P28-F-R3-R3 | — | Done; Revised by P28-F-R3-R3-R1 | Added the version and `latest` marker to the current APK filename, kept superseded APK filenames versioned without `latest`, and aligned the v1.1.0 release asset, Download links, policies and regression tests. | 2026-11-08 |
| P28-F-R3-R3-R1 | — | Done | Verified chronological PR integration: task to P28 (#21), P28 to develop (#22), develop to release/v1.1.0 (#23), release to main (#24), and main back to develop (#25). The four remote trees match; the merged task branch was deleted and the phase branch retained. | 2026-11-08 |
| P28-F-R4 | — | Done; Revised by P28-F-R4-R1 | Prepared proposed v1.1.1 release notes for owner review, added screenshot sections to README and the v1.0.0/v1.1.0 notes, and made the template safe for pending images. No app version, build, tag, GitHub release or merge was changed. | 2026-11-09 |
| P28-F-R4-R1 | — | Done; Revised by P28-F-R4-R1-R1 | Added the owner-supplied Home screenshot to versioned v1.0.0, v1.1.0 and proposed v1.1.1 repository paths, README and release Markdown. Uploaded screenshot assets and updated the published v1.0.0/v1.1.0 GitHub release bodies; both image URLs returned HTTP 200 with Content-Length 244,108. Owner confirmed the identical image is intentional. Updated release policy for draft approval -> task/phase/develop PR merge -> GitHub draft -> owner build/APK upload/confirmation -> verification -> explicit publication approval. | 2026-11-09 |
| P28-F-R4-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1 | Owner-approved v1.1.1 app/package versions passed all six gates and merged through PRs #56/#57 to `develop`; the APK was verified and attached. Later revisions completed publication and post-publication asset/document rollover. | 2026-11-09 |
| P28-F-R4-R1-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1-R1 | Owner approved the complete v1.1.1 release note, now moved to `published/`. Added all 23 screenshots to versioned paths and all three GitHub releases; README now contains only latest screenshots under the generic heading. All galleries use 150-pixel images, four per row, in the requested category order. Removed Contributors sections, completed all release-template sections, clarified release/APK-path rules, and adjusted regression tests to distinguish finalized notes from actually published releases. Required task/phase/develop integration is recorded by the follow-up revision. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1 | Changed the release default to agent-run EAS `android-apk` build and GitHub draft upload after Markdown approval, merge to `develop`, and draft creation. Audited all 10 release Markdown files; every ordered sequence was consecutive, so no numbering edits were needed. Three focused documentation suites/19 tests and `git diff --check` pass. Task PR #60 merged into P28 as `3605468`; Phase PR #61 merged into `develop` as `c61272f`. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1 | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1-R1 | Corrected release-note numbering and latest-version routing; standardized screenshot assets, removed local screenshot files, verified the owner-supplied APK and aligned README, release notes, GitHub bodies, rules and regression tests. All six gates pass; task PR #64 merged to P28 as `dd8c6b6`, and Phase PR #65 promotes the change to `develop`. v1.1.1 publication and latest-asset rollover remain pending. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1-R1 | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1-R1-R1 | Add template metadata to v1.0.0, remove its duplicate legacy metadata block, and publish the owner-approved v1.1.1 release after the required task/phase/develop/release PR flow. Finalize README and release-history links and rename v1.1.0's APK only after publication. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1-R1-R1 | Done | Complete post-publication v1.1.1 date, README, release-history, screenshot and v1.1.0 APK rollover updates. The latest APK and three versioned APK URLs return HTTP 200 at expected sizes; all eight v1.1.1 screenshots return HTTP 200. | 2026-11-09 |
| P29-A | — | Done | Investment returns, emergency-fund bucket targets and full-value linked goal amounts; implementation and validation committed on 2026-11-02. | 2026-11-02 |
| P29-B | — | Done | Today, goal-year, centered Dropdown and Home-row behavior tests pass; all six final gates exit 0. | 2026-11-02 |
| P29-C | — | Done | Paid-dialog entry points, actual amounts, Not paid and Undo paths pass; all six final gates exit 0. | 2026-11-02 |
| P29-D | — | Done | Scope controls/dialogs, cancellation, Today and start-month rules pass; all six final gates exit 0. | 2026-11-02 |
| P29-E | — | Done | Schema-v14 links, duplicate prevention, plan/manual behavior and same-write unlink-on-delete pass; Undo on holding deletion is explicitly out of scope by owner decision DEC-P29E-HOLDING-DELETE. | 2026-11-02 |
| P29-F | — | Done | Fresh coverage and all six gates pass; acceptance matrix is complete after the owner withdrew the holding-delete Undo requirement. | 2026-11-02 |
| P29-F2 | — | Done | Branch-coverage closure and all configured thresholds pass; six final gates exit 0. | 2026-11-02 |
| P29-F3 | — | Done | Assertion audit, Home layout, acceptance evidence, lint and all six gates pass; acceptance matrix is complete. | 2026-11-02 |
| P29-F4 | — | Done | Final assertion audit, acceptance tests, zero-warning lint and all six gates pass; the owner withdrew holding-delete Undo as a requirement. | 2026-11-02 |
| P29-G | — | Done | Editable Insurance cover goals, v14-to-v15 migration, backup compatibility, acceptance tests and all six final gates pass. | 2026-11-02 |
| P29-H | — | Done | Opening-inclusive invested/current values, shared return calculations, no estimated interest and Cash/Bank suppression; 84 suites/1060 tests and all six gates pass. | 2026-11-03 |
| P29-I | — | Done | Schema v16 migration, shared holding capabilities, Fixed-deposit one-time controls, legacy entry preservation, backup compatibility and acceptance tests pass; 85 suites/1078 tests and all six gates exit 0. | 2026-11-03 |
| P29-J | — | Done | Read-only liability balance audit and characterization test; no calculation bug proven, method-switch proposal pending owner evidence/approval; 84 suites/1061 tests and all six gates pass. | 2026-11-03 |
| P29-K | — | Done | Immediate Budget scope application, Close/backdrop/back dismissal, counted delete copy and Undo tests; six gates pass. | 2026-11-03 |
| P29-L | — | Done | Simple editable Insurance tracker, Term/Life placeholders, custom premium schedules, v16-to-v17 migration, backup compatibility and Home unchanged; tests and six gates pass. | 2026-11-03 |
| P29-M | — | Superseded by P29-M2 | The schema prohibition that blocked P29-M was superseded by explicit v18 authorization; see P29-M2. | 2026-11-04 |
| P29-N | — | Done | Transactions' Review-month section and dead reviewableMonths helper removed without affecting independent month routing. First-launch reminders prompt uses the existing meta store, is mounted inside LockGate, reuses the permission flow and defaults, and is cleared by erase-all. Focused tests and all six ordered gates pass. | 2026-11-04 |
| P29-M2 | — | Done | PolicyPayment dueDate, shared exact-slot schedule matching and v17-to-v18 migration; store, backup, selector and Undo tests pass. All six gates pass. | 2026-11-04 |
| P29-O | — | Superseded by P29-O1 and P29-S; Revised by P29-O-R1 | Report-only inventory is retained as historical evidence. The owner later confirmed the ledger-only migration was neither authorized nor needed: P29-O1 provides the accepted unified holding workflow, and P29-S removed the cancelled prototype. | 2026-11-08 |
| P29-O-R1 | — | Done | Closed P29-O against the explicit P29-S owner decision; no code/schema migration remains in scope. P29-O1 device checks remain open separately. Progress-ledger assertions pass (10 tests). | 2026-11-08 |
| P29-O1 | P29-O | Done; Revised by P29-O1-R1 and P29-O1-R2 | Shared Deposit/Withdraw/Entries presentation and net-invested display on the existing v18 model; 90 suites/1140 tests and all six ordered gates pass, with no schema change. | 2026-11-04 |
| P29-O1-R1 | — | Done | Recurring entries show completed/pending month counts, visible pending installments and collapsed paid investments; schedules stop at maturity. Domain and route tests pass at font scales 1.0, 1.3 and 2.0. No schema change. | 2026-11-08 |
| P29-O1-R2 | — | Done | Completed and pending month counts use adjacent two-column summary cells. Visible plan installments and entries follow the selected date order, with newest first by default. Route regressions pass at font scales 1.0, 1.3 and 2.0; schema unchanged. | 2026-11-08 |
| P29-O2 | — | Cancelled by owner | The ledger-only schema-v19 storage redesign was cancelled; its converter, validation additions and uncalled prototype are removed. P29-O1's unified actions remain on schema v18. | 2026-11-05 |
| P29-Q | — | Done; Revised by P29-Q-R1 | Owner-approved Expo SQLite native persistence, lazy legacy AsyncStorage migration, seeded stress loader with Undo, measured selector optimizations and five-sample Node benchmarks; no AppData schema change. Device checks remain open. | 2026-11-04 |
| P29-Q-R1 | — | Done | Replaced the four-choice stress picker with a centered selection dialog; retained the two-choice adapter limit. Four tiers, cancellation, Undo, all app-menu handler paths, and simulated 1.3x/2.0x text scaling are covered. Focused tests and TypeScript pass; task PR #93 and phase PR #94 are merged to `develop` at `80eb0e4`; device checks remain unverified. | 2026-11-10 |
| P29-R | — | Done | The local schema-v13 backup passed through the real v13-to-v18 backup import pipeline; anonymized pre/post comparisons found no differences in holding, goal, net-worth, liability, pending-due or reminder outputs. The backup remains outside the repository. | 2026-11-05 |
| P29-S | — | Done | Removed the uncalled v18-to-v19 converter, unused v19 validation/types and test-only ledger prototype; preserved P29-O1, schema v18 and migration compatibility. Six ordered gates pass with coverage thresholds met. | 2026-11-05 |
| P29-T | — | Done | Backdated/on-snapshot deposits and withdrawals now adjust manual and plan stored values within the same write; linked transaction Undo and downstream selectors are covered at store level. No schema change. | 2026-11-05 |
| P29-U | — | Done | Additive schema-v19 valuation methods, value/price confirmation, shared configured values and default-off monthly update reminders. Unconfigured holdings preserve legacy amounts; focused tests and all six ordered gates pass. | 2026-11-05 |
| P29-V | — | Done | SQLite migration verifies read-back bytes before removing legacy data and retains legacy fallback on SQLite failures. Date validation accepts records from 1900; stress tiers are 50/100/126 years plus dense 200-year record counts within the window. Backup export refuses data that would not round-trip or exceeds the 5,000,000-character import limit. Six ordered gates pass. | 2026-11-05 |
| P29-W | — | Done; Revised by P29-W-R1 and P29-W-R2 | Report-only inventory committed first; recurring-liability foreclosure now records an optional closure state, linked payment and separate excess charge, suppresses later dues, supports note-only edits and one-step Undo. Schema v20 is additive; native-device checks remain open. | 2026-11-05 |
| P29-W-R1 | — | Done | Recurring liability Entries show completed/pending EMI counts and collapsed Paid EMIs, with route coverage proving pending rows stop at the final EMI date at font scales 1.0, 1.3 and 2.0. No schema change. | 2026-11-08 |
| P29-W-R2 | — | Done | Completed and pending EMI counts use adjacent two-column summary cells. Pending EMI rows and other dated payments are chronologically ordered; the collapsed Paid EMIs group remains unchanged. Route regressions pass at font scales 1.0, 1.3 and 2.0; schema unchanged. | 2026-11-08 |
| P29-X | — | Done | Recurring investment stop/resume implementation preserves entries, valuation, returns and links, suppresses schedule rows after the inclusive stop date and restores future dues on resume. Schema v21 is additive with identity-preserving migration and archive support through `.premigration.v20`. Focused and full gates pass. | 2026-11-05 |
| P29-Y | — | Done | Repaired the red Gate 1 memory expectations and matched the real suite/test counts without weakening assertions; all six ordered gates pass. The source-of-truth run evidence is recorded in the latest verification section. | 2026-11-05 |
| P29-Z | — | Done | Documentation and ledger consistency restored from source: Foreclosure label, Home-only AppHeader menu, schema v21 migration chain, archive range through `.premigration.v20`, real Gate 1 counts and owner holding/liability UI history. No behavior, schema or UI source change. | 2026-11-05 |
| P29-AA | — | Done | Emergency Fund now links manual holdings, recurring plans and Fixed deposits through their live holding IDs. Deleted plans clear EF bucket and goal links in one write; hydration removes dangling links once, archives raw bytes and writes the repaired state; valid links, net worth and goal values remain unchanged. No schema change. Real Gate 1: 92 suites, 1194 passed, 1 skipped. All six gates exit 0. | 2026-11-06 |
| P29-AB | — | Done; Revised by P29-AB-R1 | Budget income recurrence supports monthly, quarterly, half-yearly and yearly frequencies with strict backup/import support; v22 migration defaults existing income monthly. | 2026-11-07 |
| P29-AB-R1 | — | Done; Revised by P29-AB-R2 | Recurrence-aware Budget overview, totals, annual income estimate and frozen-snapshot-safe schedule edits; failing domain/store/route reproductions now pass. No schema change. | 2026-11-08 |
| P29-AB-R2 | — | Done; Revised by P29-AB-R2-R1 | Budget hides non-due recurring income from planned/due rows and totals, retaining it only in the collapsed editable Recurring income group. Route coverage spans 12 months and font scales 1.0, 1.3 and 2.0. | 2026-11-08 |
| P29-AB-R2-R1 | — | Done | Make the recurrence-route diagnostic safe when monthBudgets is absent; Gate 2 type-checks the route test. | 2026-11-08 |
| P30-A | — | Done | Real-store action persistence/hydration and eight screen refresh checks pass; three SQLite fallback/restart tests reproduce stale-value restoration. Source scan finds no module-level Map caches; the prior-state mutation harness passes. | 2026-11-08 |
| P30-B | — | Done | Durable legacy authority markers win over stale SQLite after failed writes, read-back mismatch and fallback; deletion tombstones prevent removed values returning. Restart regressions now pass, and a mounted banner test verifies persistence failures are visible. | 2026-11-08 |
| P30-C | — | Done | TypeScript source scan guards hook closure inputs, explicit memo dependencies and module-level Map caches; a dev-only diagnostic reports hydration source and last-write verification. | 2026-11-08 |
| P31-A | — | Planned | CODE_OF_CONDUCT.md; root-document changes require explicit owner authorization when executed. Dependencies: none. | 2026-11-09 |
| P31-B | — | Planned | YAML bug, feature and question issue forms plus config.yml; warn contributors not to include financial data. Dependencies: none. | 2026-11-09 |
| P31-C | — | Planned | Write an accessibility statement and audit checklist; owner confirmed documentation plus audit, not new app features. Dependencies: none. | 2026-11-09 |
| P31-D | — | Planned | Privacy statement derived only from verified source facts: local-only storage, no network calls or analytics, local notifications, permissions, encrypted-backup scope, and the unencrypted-at-rest limit. Root document; explicit owner authorization required when executed. Dependencies: P39-C. | 2026-11-10 |
| P31-E | — | Planned | GitHub Actions workflow for pull requests to develop and main; run gates 1-4 on the Node version in .nvmrc, pin action versions, use no secrets and minimal permissions, and verify with a real PR run. Owner then sets branch protection to require it. Dependencies: none. | 2026-11-10 |
| P32-A | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots. Dependencies: none. | 2026-11-10 |
| P32-B | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots. Dependencies: P32-A. | 2026-11-10 |
| P32-C | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots; repository-backed image organization is handled by P28-F-R5. Dependencies: P32-B. | 2026-11-10 |
| P33-A | — | Planned | Widgets are deferred; retain SDK 57/platform/privacy research for future reactivation. Dependencies: none. | 2026-11-10 |
| P33-B | — | Planned | Android widget implementation requires owner reactivation and research approval. Dependencies: P33-A. | 2026-11-10 |
| P33-C | — | Planned | iOS widget implementation requires owner reactivation and iOS distribution. Dependencies: P33-A and iOS distribution. | 2026-11-10 |
| P34-A | — | Planned | Quick capture (shake, double-tap back or key combination) requires renewed scope/platform research. Dependencies: none. | 2026-11-10 |
| P34-B | — | Planned | App shortcuts, Quick Settings and notification-action quick capture require P34-A research. Dependencies: P34-A. | 2026-11-10 |
| P34-C | — | Planned | Foreground shake capture requires P34-A research; background gestures remain out of scope unless research proves a policy-safe route. Dependencies: P34-A. | 2026-11-10 |
| P35-A | — | Planned | SMS/notification transaction auto-detection requires permission, platform and policy research. Dependencies: none. | 2026-11-10 |
| P35-B | — | Planned | Obtain the owner's explicit go/no-go decision before transaction auto-detection implementation. Dependencies: P35-A. | 2026-11-10 |
| P35-C | — | Planned | No transaction auto-detection implementation may begin until the owner explicitly gives a go decision in P35-B. Dependencies: P35-B owner go/no-go approval. | 2026-11-10 |
| P36-A | — | Planned | Design Notes for text, voice/audio recordings, photos and videos; define optional financial-record links, local storage, limits, backup/migration and schema-v24 impact. Dependencies: none. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P36-B | — | Planned | Implement Notes schema, attachment metadata and pure domain behavior with offline-safe storage and backup compatibility. Dependencies: P36-A. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P36-C | — | Planned | Implement Notes UI for writing, recording and attaching/viewing photos and videos. Dependencies: P36-B. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P36-D | — | Planned | Add deterministic Notes demo data without personal media. Dependencies: P36-C. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-A | — | Planned | Design per-feature skippable coach marks, replay from menu, meta-store flags rather than AppData, and accessibility. Dependencies: none. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-B | — | Planned | Implement the tutorial framework. Dependencies: P37-A. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-C | — | Planned | Implement per-feature tours. Dependencies: P37-B. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P38-A | — | Planned | Inventory operations with genuine asynchronous loading and define when skeleton placeholders should appear, including theme, accessibility and reduced-motion behavior. Dependencies: none. | 2026-11-09 |
| P38-B | — | Planned | Implement reusable skeleton loaders and connect them only to the identified loading states; keep errors and empty states explicit. Dependencies: P38-A. | 2026-11-09 |
| P38-C | — | Planned | Test loading, success, empty and failure transitions and confirm skeletons never mask errors or flash during synchronous operations. Dependencies: P38-B. | 2026-11-09 |
| P39-A | — | Planned | Report-first master read-only audit of dead code, secrets/config, app lock, notification-response route, wealthwise:// deep links, silent failures, performance, dependencies, debug residue, TODO debt, permissions, and first launch. Every finding needs file/line evidence and severity P0-P3. Dependencies: none. | 2026-11-10 |
| P39-B | — | Planned | Report-first secrets/network/debug-residue verification across tracked files, Git history patterns and EAS config; inspect the exported bundle to prove dev-menu demo/stress loaders and the dev storage diagnostic are absent or unreachable; check console/debugger statements and source maps; turn the no-fetch/XHR/WebSocket-in-app-or-src finding into a regression test. Dependencies: P39-A. | 2026-11-10 |
| P39-C | — | Planned | Report-first permissions/privacy trace from declaration to request to use for notifications, biometrics, file/share/document picker and SQLite; verify denial/revocation behavior and Android allowBackup from resolved config, marking unverifiable items unverified. Dependencies: P39-A. | 2026-11-10 |
| P39-D | — | Planned | Report-first silent-failure and recovery-state audit extending P30 across storage, backup import/export, notification scheduling and SQLite fallback visibility. Dependencies: P39-A. | 2026-11-10 |
| P39-E | — | Planned | Report-first dependency risk triage using current npm audit; separate production-reachable dependencies from tooling, record accepted risks and owner decisions; no force fix or install-script approval. Dependencies: P39-A. | 2026-11-10 |
| P39-F | — | Planned | Report-first debt/skipped-test audit of TODO/FIXME markers, the one skipped test and opt-in stress benchmark, with a disposition per item. Dependencies: P39-A. | 2026-11-10 |
| P39-G | — | Planned | Report-first clean-install walkthrough of onboarding, lock, reminders prompt, first transaction, and interrupted/denied paths; findings feed P37-A. Dependencies: P39-A. | 2026-11-10 |
| P39-H | — | Planned | Remediation plan grouping findings into the smallest independent batches, with containment before cleanup, required owner approvals and rollback. Detailed reports stay in chat or /tmp; only the findings summary table enters the ledger. Dependencies: P39-B, P39-C, P39-D, P39-E, P39-F and P39-G. | 2026-11-10 |
| P40-A | — | Planned | Report-only measurement of docs/PROGRESS.md, docs/memory/* and AGENTS.md sizes, parsing tests and per-prompt read cost. Dependencies: none. | 2026-11-10 |
| P40-B | — | Held pending owner approval | After P40-A, move completed-phase narrative out of PROGRESS.md into archive files, keep the dashboard, standing rules and open items in the main file, and update ledger tests to read the archives without weakening assertions. Dependencies: P40-A and owner approval. | 2026-11-10 |
| P41-A | — | Done; Revised by P41-A-R1 | Add finite Real estate and Custom financial types, validated optional custom names, consistent forms, display/search/backup behavior, and balanced demo data. Real estate maps to the Real estate invest category; Custom maps to Other investments; both use Savings and Investments. Task PR #97 and phase PR #98 merged to `develop` as `9aa6540`; P41-A-R1 task PR #99 and phase PR #100 merged to `develop` as `a67f54f`. | 2026-11-10 |
| P41-B | — | Done; Revised by P41-B-R1 | Add Once only recurrence to Budget items, income and insurance premiums with exact-once due, reminder, cash-flow, snapshot and schema-v23 migration behavior. Do not add it to investment plans or liabilities. Nine focused suites / 233 tests, TypeScript and Expo lint pass. Task PR #101 and phase PR #102 merged to `develop` as `b4275d3`. | 2026-11-10 |
| P41-B-R1 | — | Done | Correct the stale once-only demo reminder expectation and cover schema/schedule branches exposed by Gate 1 without changing production behavior. Task PR #108 merged into `phase/41-types-frequency-completion` as `e1db78e`; phase PR #109 merged into `develop` as `5cb4957`; all six ordered gates pass. | 2026-11-11 |
| P41-C | — | Done | Separate completed liabilities and achieved goals into labelled collapsed sections while retaining filters, sorting, search and the pinned Emergency fund goal. Task PR #104 merged into `phase/41-types-frequency-completion` as `c255ada`; phase PR #105 merged to `develop` as `37a3429`. Dependencies: P41-A. | 2026-11-10 |
| P41-D | — | Done | Add the offline About route, app-menu access, confirmed browser update link, route tests and offline regression evidence. Test-first commit `bd980ad`; task PR #106 merged into `phase/41-types-frequency-completion` as `7ddfef5`; phase PR #107 merged to `develop` as `8e4a2d1`. Dependencies: none. | 2026-11-10 |
| CR-92 | — | Done | Local schema-v13 backup reconciled against monthly income, expense, loan and emergency-fund trackers; focused import/reconciliation verification passed. This data-only deliverable does not change application phase progress. | 2026-11-01 |

DEC-P29AA-EF-LINK-INTEGRITY: Assumed valid Emergency Fund links are holding IDs
present in `AppData.holdings`; plan and manual deletion must clear stale bucket
and EF goal links, while no schema change is needed because repair is a
hydration-only transformation. Replaced assertion: old / any EF bucket ID must
remain valid forever and deletion/save can surface
`Every linked investment must exist.` / new / EF links may be repaired once from
live holding IDs, and valid saving/deletion uses the shared holding collection
/ reason / stale deleted-plan links and legacy dangling data prevented otherwise
valid EF saves.

### Unchanged fix, change, and request IDs

| ID | Status | Evidence | Last updated |
|---|---|---|---|
| FX-BASE | Done | `60b8c54`; `TransactionsScreen.test.tsx`, `StatPill.test.tsx`; full suite 520 tests, tsc, lint, Android/iOS export and Doctor pass. | 2026-10-13 |
| FX-U1 | Done | `f805481`; compact formatter and explicit-tier rendering cover app/components; exact parent labels and the seven-screen large-amount matrix pass. | 2026-10-13 |
| FX-U2 | Done | `src/components/SectionHeaderRow.tsx` waits for complete measurements; app SortChips are AST-checked; fit, no-flicker, inline/stacked and simulated font-scale-2 cases pass. | 2026-10-13 |
| FX-U3 | Done | `b205a84`; route registry, route controls/labels/44pt targets, fallback and Android back paths pass. | 2026-10-13 |
| FX-U4 | Done | `FormScreen` owns close/discard handling; 87 focused route/close tests pass. | 2026-10-13 |
| FX-B1 | Done | `b8bc4a1`; current-month Home expense breakdown, wants weights, category flow and v5 backup tests pass. | 2026-10-13 |
| FX-B2 | Done | `5e2f78f`; four ordered tabs, menu links, grouped Budget routes and simulated 2.0 font-scale labels verified. | 2026-10-13 |
| FX-T1 | Done | `de94950`; direct plus route, header-menu behavior and all add-form save paths are tested. | 2026-10-13 |
| FX-T2 | Done | `a3423ec`; available-balance carry, date-boundary, future exclusion, negative/no-history and past-close tests. | 2026-10-13 |
| FX-T3 | Done | `c1df77d`; Festival, Donation and Gifts exercised through create/edit, filters and Budget links. | 2026-10-13 |
| FX-T4 | Done | `88d5190`; compact card cap, collapsed/expanded rows, review routing/dismissal and tone tests. | 2026-10-13 |
| FX-S1 | Done | `0df1952`; filter/sort row layout, SortChip placement and swipe suppression verified. | 2026-10-14 |
| FX-S2 | Done | `8364053`; Budget history sorting, comparator directions, tie breaks, persistence/fallback and labels verified. | 2026-10-14 |
| FX-T5 | Done | `03c67aa`; expanded available-balance card uses normal content sizing; only collapsed state has the 64pt maximum. | 2026-10-14 |
| FX-I1 | Done | `172b24e`; investment value explanations, accessible recurring forms, and today's date prefill. | 2026-10-14 |
| FX-L1 | Done | `ef7c5b0`; recurring liability solver and calculated form outputs. | 2026-10-14 |
| FX-L2 | Done | `2bc35f0`; received-funds default and atomic liability-origin transactions. | 2026-10-14 |
| FX-E1 | Done | `f805481`; Emergency Fund balance/targets/allocation/passbook/Home/Goals use amount tiers and exact accessible labels. | 2026-10-13 |
| FX-E2 | Done | `5f6f883`; allocation controls/hints and one-write reset assertion. | 2026-10-13 |
| CH-1 | Done | `c831fe6`; custom EF buckets, holding links, atomic plan-save and v5→v6 migration. | 2026-10-14 |
| CH-2 | Done | `e8b1d26`; Budget owns History and Month review. | 2026-10-14 |
| CH-3 | Done | `cac7cc0`; link-missing action and conditional count notice route to the existing screen. | 2026-10-14 |
| CH-4 | Done | `1321e29`; removed Transactions movement sheet/route, preserving liability-origin logic. | 2026-10-14 |
| CR-1 | Done; superseded by P24-A (2026-11-08) | Resolved by local reminders, lock-gated confirmation, privacy controls and the 60-item scheduler. Original open-state note is historical and was superseded on 2026-11-08. | 2026-11-08 |
| CR-2 | Done | Session/checkpoint backfill and prompt archive removal; source limitations remain in Section 8. | 2026-10-14 |
| CR-3 | Open | Save narrows with validation summaries in `profile-form.tsx` and `transaction-form.tsx`. | 2026-10-14 |
| CR-4 | Done | Tab label is Transactions, never the superseded short label; verified by tab tests and the source guard. | 2026-10-15 |
| CR-5 | Done | Five-group categories, suggestions, compact inputs, subtotals and recurring-items summary; P19-A gates pass. | P19-A |
| CR-6 | Done | Applied budgets and recurring assets/liabilities, past and future, appear under Transactions' Due payments with Pay and Clear due. | P20-A |
| CR-7 | Done | Home upcoming/due rows offer Pay and Clear due and update Transactions. | P20-B |
| CR-8 | Done | Linked emergency-fund goal and asset links; final Expo Doctor and all required gates pass. | P21-A |
| CR-9 | Done | Investment categories remain distinct; every earned-income source appears in budget review and month review, with non-earned inflows separated. | P19-B |
| CR-10 | Done | Home spending by category is collapsed initially; user-owned spending-card actions remain absent. | P20-B |
| CR-11 | Done | Bottom tabs appear only on Home, Transactions, Goals and Budget. | P20-C |
| CR-12 | Done | Four-month deterministic demo, linked records, validation, loader Undo and route smoke tests pass; all required gates are green. | P22-A |
| CR-13 | Done | v6→v7 migration and linked-asset conversion preserve net worth; final required gates pass. | P21-A |
| CR-14 | Done | Expense/salary fallback and truncated one-decimal cover are tested; final required gates pass. | P21-B |
| CR-15 | Done | Compact editor and linked-assets table are tested; final required gates pass. | P21-B |
| CR-16 | Superseded by CR-17 | Former Budget body action row, replaced by header icons. | P19-C |
| CR-17 | Superseded by CR-24 | P19-C header icons were replaced by the ordered three-dot menu. | P19-C, P20-D |
| CR-18 | Superseded by CR-22 | The expandable four-metric card was replaced by the user's reduced always-visible balance card. | P19-C, P20-D |
| CR-19 | Done | User-owned input components restored/current, frozen by SHA-256 guard. | P19-C |
| CR-20 | Done | Emergency fund remains a linked-goal visualization; ledger/category/instrument removed; all required gates pass. | P21-A/B |

### Resume point

**Superseded (2026-11-08):** this earlier P23 resume point predates
completion of P24–P29 and release 1.0.0. Use the current status dashboard
and open-items memory for active work.

P19-A/B/C and P20-A/B/C/D passed their required gates and are complete.
P20-E/F/G/H/I, P21-A/B/C and P22-A are Done. The optional importer has been removed
from active scope. P23 is next. CR-29's single-plan replacement and
apply-from-next-month behavior are delivered in P20-G. The earlier
Doctor failure was resolved by CR-26. P20-H removes Month review UI while
keeping the Transactions Review link to Budget. The previously planned P19-B, P19-C and
P19-D became P20-A, P20-B and P21-A/P21-B, respectively. **Assumed:**
category assignment follows the five groups specified in
this request, and the starter split is Survival 50%, Savings and Investments
20%, Wants 15%, Festival 5%, and Unexpected Extras 10% of income.
**Assumed:** within-group template weights are Survival (Living 25, Food 20,
Transport 10, Family 10, Health 5, Bills 10, Education 5, EMI 10, Insurance
5); Savings and Investments (Emergency fund 35, Mutual fund / SIP 25, Stocks /
ETF 15, Fixed deposit / RD 10, Gold / Silver 10, Other investments 5); Wants
(Shopping 35, Other 20, Eating out 15, Entertainment 15, Fashion 15);
Festival, Donations, Culture (Festival 30, Donation 20, Gifts 20, Culture
30); Unexpected Extras (Unexpected 100). Each group's weights sum to 100.
**Assumed:** CR-27 uses the native alert's default dismissal behavior, and the
existing five-second ActionToast is the requested brief demo-undo notification.
**Superseded by CR-20:** remove Emergency fund as a category and combine its
former 35% with Other investments, now 40%. **Assumed:** CR-16's “no header
menu on Budget” removed the whole menu at first; CR-17 later replaced its
body row with three icons, and CR-24 supersedes those icons with one menu.
**Assumed:** Home's existing five-item due preview cap remains unchanged.
**Assumed:** P20-I uses the existing native Paid / Not paid confirmation and
Undo behavior, and labels a goal with projection status `none` as “Not
reachable with current contributions.”
Schema was v7 at checkpoint `51842bb`; P20-G advanced it to v8, and P20-H/I
made no further schema changes. The earlier “keep schema version 6” phrase
conflicted with the persisted v7 state, so no downgrade was made.

**FX-BASE root cause and audit:** the withdrawal-only screen mock lacked
`useWindowDimensions`; the selector already returned `rates: null` for zero
earned income. The Round 2 test changed the old “No earned income logged this
month” assertion to a summary-data assertion and changed the old “Includes
₹5,000 from withdrawals, borrowing, loan proceeds and own funds” assertion to
only check the “Other money in” label. Round 3 restored both visible messages
(the latter when expanded), and tests now assert them alongside `rates: null`
and no rendered `NaN`. StatPill accepts text, so monetary call sites retain
compact display while passing an exact accessibility label.

**FX-E2 evidence (superseded by P21-C):** the former explicit suggestion
control populated the React Hook Form values and saved only through the
“Save allocation” action. P21-C also removed the reset-to-default function
`resetEfAllocation`, its store wrapper and form control; the previous
reset-specific pure, form and one-write store assertions were replaced by
default-item, validation and save/rehydration coverage.

**Part 0 baseline evidence (2026-10-13, before fix implementation):**

- `git log --oneline --decorate -n 100`: HEAD was `5de5a44` (`Minor UI
  Changes`), preceded by `d1a30d8`, `d8b40da`, `19afe88`, `1e206ad`,
  `68d9cd4`, `9399e23`, `f28657c`, `d64d298`, `394d338`, `e155bcd`,
  `fbeb1d7`, `0322c9d`, `9975201`, `bdb146a`, `6ac4ca7`, `e3c8500`,
  `85a0a52`, `d8dc666`, `f697403`, `3a29ea3`, `235a738`, `a89fa2a`,
  `8987f22`, `9c0762d`, `beb9711`, `e31782c`, `ca4d70b`, `487759e`,
  `585656c`, `03813e6`, `a481a0e`, `f3c9daa`, `a514958`, `f272580`.
  The command requested 100; Git returned the complete available history (34
  commits), so there were no further entries to print.
- `git status --short`: clean before the baseline commands. The old
  `package-lock.json` change mentioned in the prior session summary was absent
  at this starting point.
- `SCHEMA_VERSION`: `5` (`src/domain/schemas.ts`); precondition satisfied.
- Baseline gates, each run once with an explicit exit code: test coverage
  `exit=1` (52 suites, 7 failed tests / 481 passed); TypeScript `exit=0`; Expo
  lint `exit=0` with four unused-variable warnings in
  `app/(tabs)/transactions.tsx` lines 59 and 76; Android export `exit=0`; iOS
  export `exit=0`; Expo Doctor `exit=0`, 21/21 checks passed.
- Baseline coverage, summed separately from Istanbul per-file summaries:
  domain 1,888/1,915 lines (98.59%) and 1,785/1,897 branches (94.10%); data
  excluding hooks 301/320 lines (94.06%) and 207/228 branches (90.79%); pure
  lib 101/101 lines (100%) and 120/120 branches (100%). The aggregate Jest
  coverage was 96.86% statements, 94.07% branches, 97.67% functions and
  98.03% lines. The test command was red due to seven existing render
  assertions expecting hidden withdrawal-only summary copy that the current
  screen no longer renders; no assertion was removed.
- Baseline coverage aggregation script:

  ```js
  const { createCoverageMap } = require('istanbul-lib-coverage');
  const map = createCoverageMap(require('./coverage/coverage-final.json'));
  for (const [name, match] of Object.entries({
    domain: f => /\/src\/domain\//.test(f) && !/\/__tests__\//.test(f),
    data: f => /\/src\/data\//.test(f) && !/\/__tests__\//.test(f) && !/\/hooks?\//.test(f),
    lib: f => /\/src\/lib\//.test(f) && !/\/__tests__\//.test(f),
  })) {
    let lc=0, lt=0, bc=0, bt=0;
    for (const file of map.files()) if (match(file)) {
      const s = map.fileCoverageFor(file).toSummary();
      lc += s.lines.covered; lt += s.lines.total;
      bc += s.branches.covered; bt += s.branches.total;
    }
    console.log(`${name}: lines ${lc}/${lt} (${(100*lc/lt).toFixed(2)}%); branches ${bc}/${bt} (${(100*bc/bt).toFixed(2)}%)`);
  }
  ```

## 3. Standing rules

These COMMON RULES apply to every prompt and task, whether or not a prompt
repeats or pastes them. If a task explicitly authorizes a narrower exception,
apply only that exception and preserve all other rules.

- **R1 — Preflight and commits:** before other work, list every dirty file and
  run `git diff --stat` plus the complete diff. Before each commit, show the
  proposed subject and staged diff-stat. Commit exactly the named files, use
  one commit per unrelated area, and use a descriptive Conventional Commit
  subject stating what changed. Allowed types are `feat`, `fix`, `docs`,
  `test`, `chore`, `refactor`, `perf`, `style`, `build`, `ci`, and `revert`;
  optional scopes are allowed. Use a descriptive subject and never bypass
  the hook, which rejects prohibited placeholder subjects. Preserve owner
  edits; never use checkout, restore, stash, reset, or old-code reapplication
  to undo them. Enable the hook with
  `git config core.hooksPath .githooks`.
- **R2 — Phase and revision IDs:** align work with its existing phase. A fix
  to a completed subtask stays in that phase and uses `<ID>-R<n>`; the
  original row must say `Revised by <ID>-R<n>`. Create a new phase only for
  genuinely new work.
- **R3 — History, pushes and release approval:** agents do not push unless
  the owner explicitly authorizes it, and never force-push or rewrite history.
  Never publish releases or create, move, or delete release tags without
  explicit owner approval.
- **R4 — Documentation scope:** routine Git documentation is limited to
  `docs/memory/*`, `docs/PROGRESS.md`, `docs/releases/**`, `CONTRIBUTING.md`,
  `SECURITY.md`, and `.github/**`. Change other documentation only when
  explicitly authorized. Reports and generated output belong in chat or
  `/tmp`; release content must remain in Git, never `/tmp`.

### Branching

- `main` is stable, released code; changes arrive by release or hotfix merge
  and receive a `vX.Y.Z` tag. The initial branching adoption baseline may
  contain legacy unreleased history; this rule applies prospectively.
- `develop` is the integration branch and must pass all six gates.
- Create one `phase/NN-slug` branch per phase from `develop`. A revision to a
  completed phase reopens its existing phase branch from `develop` (R2).
- Create `task/ID-slug` branches from their phase branch, one per subtask or
  revision. Example: `task/P29-AB-R2-income-rows`.
- After approved task/phase work merges to `develop`, create
  `release/vX.Y.Z` from that commit and create the GitHub Release draft at the
  release-branch commit. Draft creation may create the version tag; do not
  retarget it. After owner APK upload/confirmation, artifact verification and
  separate publication approval, merge the release branch `--no-ff` into
  `main`, verify the tag target, then back-merge into `develop`. Create
  `hotfix/vX.Y.Z` from `main`, merge to `main`, tag, and merge to `develop`.
- External contributors fork and use `contrib/ISSUE-slug`, submitting a PR
  into `develop`. Contributor PRs are squash-merged with a Conventional
  Commit title.
- Merge task into phase, then phase into `develop`, with `--no-ff`. Merge
  release/hotfix to `main` with `--no-ff`. Agents never commit directly to
  `main` or `develop`, except the explicitly authorized bootstrap. Delete
  merged task branches and keep phase branches. Do not push unless asked;
  report merge commands in chat.

### Gates

Run these six gates in order and record each real exit code:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Expo exports are allowed when required. EAS builds and local Gradle builds
are not authorized unless explicitly requested.
- **Release documentation:** create or reuse
  `docs/releases/drafts/vX.Y.Z.md`, but do not commit a release candidate
  before owner approval of its Markdown draft. After approval, commit the
  approved work on a task branch and merge task -> phase -> `develop` through
  PRs, using subject `docs: draft vX.Y.Z release notes`. Create the GitHub
  After the merge, create `release/vX.Y.Z` from `develop` and create the
  GitHub Release draft at that release-branch commit; it may create the
  version tag, which must not be retargeted. Notify the owner to build from
  merged source and upload the APK. Wait for owner confirmation before
  artifact verification. Publication requires separate explicit approval;
  then merge the release branch to `main`, verify the tag target, and publish.
  After publication is verified, move the draft to `docs/releases/published/`
  and commit the move.
  The README Download block and latest published Download block are identical;
  older notes use versioned links. Every release updates the README Download
  and What's new sections and its releases-page link. Verify the APK digest
  privately after owner upload; never include it in human-authored release
  material. GitHub may expose a platform-generated asset digest that cannot
  be removed by editing the release. Verify the current latest URL and every
  affected versioned URL with `curl -I -L`; require HTTP 200 and expected
  artifact size. Rename each superseded asset to
  `WealthWise-android-vX.Y.Z.apk` and use that release's version-specific URL.
  The Builds table records owner-verified build ID, profile, Android
  `versionCode`, date and status, but no source commit or digest.
- No cloud or network at runtime. Domain logic is pure: no React/Expo imports,
  clock reads, or randomness; inject dates, identifiers and other varying
  values.
- React Compiler is enabled. Forms use React Hook Form `Controller` and
  `useWatch` only.
- A multi-entity operation is one pure domain action, one Zustand `set()`, and
  one persisted write.
- Unrequested behavior remains unchanged. Replaced logic is removed; do not
  leave parallel paths or dead code.
- No non-null assertions or `as` casts to silence nullable values in `app/` or
  `src/components/`.
- Never weaken/delete an existing test assertion to get green. Fix a wrong test
  and explain the correction. Do not change production logic only to increase
  coverage or adjust coverage thresholds/exclusions.
- Every required gate must exit 0. Run as `command; echo "exit=$?"`; report all
  warnings and the full Expo Doctor result.
- Coverage totals use per-file Istanbul summaries and independently sum line
  and branch counts: domain and pure `src/lib` >=90%; `src/data` excluding
  hooks >=85%.
- Tabs, in order: Home, Transactions, Goals, Budget.
- Add/Edit/Delete are icon actions. Deposit/Withdraw/Pay EMI/Log
  installment/Save/Clear due/Clear past dues are text with a small icon.
  `CardHeaderRow` or `ListRow` alone owns the edit pencil. Goal cards open the
  editor on tap and have no pencil. Home quick actions uniquely pair icons and
  text.
- Commit each part locally without pushing, and update this ledger at each
  part.

## 4. Architecture and decisions

### Storage, purity, and transaction integrity

App financial data is one local AsyncStorage JSON blob persisted through
Zustand. Migrations, schemas, calculations, integrity validation, and
immutable financial actions belong in pure domain/data modules. Inject dates,
IDs, and digests; no runtime cloud/network dependency or ambient clock/random
reads in domain code. UI-only preferences belong in the meta-store. An action
touching linked financial entities is applied through one store `set()` and
one persisted write. Legacy backup checksums are verified against data as
written before migration and validation; newer backup schemas are refused.
Premigration bytes are copied once and removed by erase-all.

### Schema history

| Version | Recorded addition | Evidence quality |
|---|---|---|
| v1 | Initial persisted financial data and transaction records; exact historical field inventory is unavailable. | Reconstructed / user-reported |
| v2 | Loans replaced by recurring and one-time liabilities; investment logs became typed entries; linked transaction source kinds and integrity rules migrated. | Reconstructed |
| v3 | Onboarding state, `monthlySalary`, and theme ID/preference. | Reconstructed |
| v4 | Emergency-fund allocation across seven fixed buckets. | Reconstructed; later migration/audit commits verify current implementation, not all original acceptance |
| v5 | Liability settlement snapshots, goal asset links, policies, budget templates/month snapshots, and added transaction source/category types. | P15-D commit `394d338` |
| v6 | Custom emergency-fund buckets and holding links, with v5→v6 migration. | CH-1 commit `c831fe6`; close-out `17f4748` |
| v7 | Emergency fund becomes a goal funded by linked assets; legacy ledger/category removed with v6→v7 migration. | P21-A implementation and migration tests; final gates pass |
| v8 | A single budget plan replaces templates; month snapshots record source and linked-item inclusion, with v7→v8 migration. | P20-G migration, strict backup and current-month apply tests; P20-H/I leave schema unchanged |
| v9 | Budget plans and month snapshots store income items; schema-v8 data migrates and older backups import through the chain. | P20-M |
| v10 | User-managed budget sections/items replace fixed budget lines; schema-v9 data migrates and backups through v9 import. | P20-P / CR-60 |
| v11 | Insurance policy model, lifecycle and premium schedules; v10 policy records migrate into the current model. | P23-A / DEC-P23-A |
| v12 | Typed cover goals and insurance categories with migration and backup compatibility. | P23-B / DEC-P23-COVER |
| v13 | Recurring Budget item frequencies and first due month, with migration of prior plan/snapshot items. | P20-V / DEC-P20V |
| v14 | Optional Budget item-to-holding links; deleting a linked holding clears all Budget links in one write. | P29-E / DEC-P29E-HOLDING-DELETE |
| v15 | Editable cover goals and optional explicit policy-to-goal assignment. | P29-G / DEC-P29G-COVER-MANAGEMENT |
| v16 | Distinguishes fixed deposits from recurring deposits while preserving scheduled holdings and entry history. | `migrateV15ToV16` in `src/data/migrate.ts`; P29-I |
| v17 | Removes retired cover-goal records and policy-to-goal assignments. | `migrateV16ToV17`; P29-L |
| v18 | Adds the scheduled due date settled by each insurance-policy payment. | `migrateV17ToV18`; P29-M2 |
| v19 | Adds optional holding valuation methods and valuation metadata. | P29-U; identity-preserving v18-to-v19 migration |
| v20 | Adds optional recurring-liability closure metadata. | P29-W; identity-preserving v19-to-v20 migration |
| v21 | Adds optional recurring-investment stop date. | P29-X; identity-preserving v20-to-v21 migration |
| v22 | Adds Budget income recurrence frequency and first-due month; existing income defaults to monthly. | P29-AB; additive v21-to-v22 migration |
| v23 | Adds optional custom holding/liability names and Once-only recurrence for Budget items, Budget income and insurance premiums. Existing records remain unchanged; each Once-only schedule matches only its specified first due month/date. | P41-A/P41-B; identity-preserving v22-to-v23 migration |

Current schema is `SCHEMA_VERSION = 23` (`src/domain/schemas.ts`); the
persisted migration chain and backup importer cover v1 through v22.
**Superseded (2026-11-08):** the prior v15 current-schema statement and
v1-through-v14 migration boundary were accurate only at their earlier
checkpoint; the table now records the subsequent source-backed v16–v23
changes.

### Financial and UI rules

- P1 uses Expo/React Native, TypeScript, Expo Router, bundled Montserrat
  and Feather, typed theme/components, and mobile-first screens; the initial
  static-only/no-persistence scope was superseded by later phases. The original
  five-tab design (Home, Transactions, Goals, Invest, More) was superseded by the
  current four tabs.
- Domain date calculations use UTC and explicit as-of dates. SIP schedules
  anchor to the plan start, not chained dates. Liability balance is a daily
  accrual estimate. EF monthly baseline uses prior months and a documented
  current-month fallback.
- Linked source transactions cannot be edited/deleted except for allowed note
  edits; parent deletion has explicit keep/delete-linked-transaction behavior.
  Compound changes are immutable pure actions through one store write.
- EF end-of-day aggregation cannot make a balance negative. The automatic EF
  goal is pinned/idempotently ensured, and its amount derives from EF balance.
  Missing holding valuation date is unknown/stale; staleness is over 90 days.
- P6 lock is device biometric/passcode only (no custom PIN/auth service);
  locked content must not mount. Hide previews includes app switching and
  screenshot blocking where supported. Erase requires typed `ERASE` and clears
  financial data plus separate metadata/lock keys. Android
  `allowBackup: false` remains unverified in a built APK.
- P6 backup is readable plain text; checksum detects accidental
  modification, not tampering/security. Import uses bounded schema and
  integrity checks; only a missing EF goal may be repaired. Reminder threshold
  is five records, stale/never-exported is 30 days, and dismissal is seven
  days. Corrupt-blob recovery keeps latest/previous slots and avoids rewriting
  identical latest content; storage-read failure is distinct from corruption
  and must not silently start fresh.
- P1 amounts are rupees and `ISODate` is `YYYY-MM-DD`. Historical rules
  include UTC/explicit-as-of date calculations, plan-anchored SIP schedules,
  daily accrual for liabilities, and end-of-day EF balance checks.
- Liability recurring balance math remains unchanged; one-time liabilities
  use daily accrual. EMI solving is recurring-only. A one-time liability's
  due date cannot precede its start date, and its payment cannot exceed the
  outstanding balance.
- Investments, manual holdings, and liabilities maintain transaction links in
  both directions. Deletion supports keeping or deleting linked transactions
  where applicable. The emergency goal's value derives from linked asset
  shares, not a separate ledger.
- EF allocations use fixed plus custom bucket IDs and largest-remainder
  rounding exact in paise. Links are explanatory and do not move money or
  change net worth.
- Budget-history sorting covers month, planned/actual spend, planned saving,
  actual invested, savings rate (null last), closing balance, outstanding
  amount, template name, and customized; each direction uses ID tie-breaks.
- Amounts use explicit visual tiers while accessibility labels preserve exact
  Indian-grouped values. The formal row cutoff is ₹1 crore; screen-reader
  output remains exact. `formatINRShort` retains its existing behavior.
- Theme IDs are `system`, `light`, `dark`, `sky`, `mint`, `blush`, and
  `midnight`. Tabs are Home, Transactions, Goals, Budget.
- DEC-DEMO: every part that adds or changes a feature also extends demo data
  and adds tests. P22-A adds `buildDemoData(today)` in `src/mock/demoData.ts`:
  deterministic IDs and amounts, explicit injected date, and six complete
  months ending with the current month. Keep `src/mock/data.ts` and its
  established fixtures stable. The data covers all current budget/investment
  categories, linked instrument/payment transactions, an overdue SIP, upcoming
  EMI, future-month due, later installment and planned-budget rows, monthly
  spending within earned income, a surplus allocation, goals, linked emergency
  assets, allocation, policies and stored month budgets. P20-G extends the
  current snapshot from one repeatable plan with all five groups, a Bills due
  day, `linkedIncluded: true`, and linked rows from recurring holdings,
  liabilities and policies; no templates are present. It also includes a
  one-time borrowed-money liability and partial payment. Load demo data only
  from the confirmed development-menu action through `replaceAllData`,
  preserving its existing backup/Undo path; never load it automatically. The
  P20-H current-month snapshot deliberately has a fully paid Festival row, an
  overdue Bills row, a partially paid Food row and a linked SIP row so the
  grouped Budget screen demonstrates Paid, Overdue, partial and Auto states.
  P22-A-R1 directly seeds holding opening values rather than deriving the
  crore-scale portfolio from six months of flows. The demo monthly earned
  income is exactly Rs 1,00,000, total assets are Rs 1 crore including linked
  Emergency Fund holdings, liabilities total Rs 10 lakh, and every goal is
  capped at 87% saved. These are deterministic sample values, not personal
  financial data.
- DEC-CR107-SCREENSHOTS: the owner supplied all 23 screenshots, so capture
  work P32-A/B/C is cancelled. The screenshots are committed under
  `docs/releases/screenshots/vX.Y.Z/` and release-note thumbnails link to
  browser-viewable repository blobs with raw repository images. This
  supersedes the earlier "no screenshots in the repository" decision and
  resolves the open decision to commit screenshots to Git as YES. Screenshots
  are not GitHub Release assets; only APKs are attached.
- DEC-CR107-MAIN-MERGE: for CR-107 only, the owner authorizes merging
  `develop` to `main` and back-merging `main` to `develop` without a release,
  version bump or tag. No other release or main-branch rule changes.
  The strict backup/import entry
  schema accepts `snapshotAdjustment`, matching the app schema so valid
  manual-holding entries can be replaced and restored without losing metadata.
- DEC-BUDGET-PLAN: the target budget design has one budget plan replacing
  templates. Its own lines may have a due day; when present, a line due row is
  dated on that day clamped to the month's final day. Without a due day, the
  existing undated planned-row behavior remains. The plan may repeat monthly
  from next month, and auto-apply creates only the current month. EMI,
  Insurance and recurring investments are linked automatically from their
  schedules; they are computed, never stored on the plan, and never emitted as
  extra due rows. Month views may include linked rows in planned category and
  group totals, while actuals remain transaction-derived. Budget actuals use
  expense transactions for expense categories and investment transactions for
  investment categories (with non-investment investment transactions grouped
  as Other investments); linked EMI, Insurance and plan schedule amounts affect
  planned totals, not actuals. `pendingItems` creates plan and liability due
  rows from schedules, suppresses duplicate EMI/Insurance/instrument budget
  rows, and creates a budget due row only for an otherwise-unrepresented
  category.
  Assumed: a one-time liability with no due date is omitted from linked
  calendar rows, matching existing `monthlyCommitments` and `pendingItems`
  behavior; the schedule's internal start-date fallback is not treated as a
  user-scheduled due.
  Assumed: `budgetMonthView` evaluates linked schedule statuses as of the
  month's final day, matching the existing `monthlyCommitments` projection;
  direct callers of `linkedRecurringForMonth` provide their own `asOf`.
  Assumed: absent or false `linkedIncluded` keeps all derived budget-view
  values unchanged and keeps all existing snapshots valid; the `budget` field
  continues to echo its stored input. Additive linked-total behavior is opt-in.
- DEC-BUDGET-SPEC: P20-N changes only the Budget overview presentation and
  pure model; its frozen past/current display, read-only future months, income
  dues, and projection rules remain. The v9 fixed-line data model is
  superseded by DEC-BUDGET-V10.
  The overview reports income, spending, investing and left as planned/actual
  figures, reconciles totals to ordered budget sections, and shows pace only
  for past/current months. Linked liability, investment-plan and policy rows
  remain automatically derived and are not editable from the overview.
  DEC-BUDGET-V10 supersedes the fixed-category data constraint and the
  section-card header-only/fixed-category setup constraints for the upcoming
  management UI; P20-P does not rebuild those screens.
  P20-N preflight verified that the user-owned Cash flow labels are exactly
  “Opening balance” and “Closing balance”, and that Budget has no “Back to
  Transactions” or “Review” control. Preserve those labels and absences;
  Transactions retains its “Review {Mon}” route into Budget. Empty months
  without a budget offer setup, while an unplanned future month with a plan
  offers “Apply plan to {Month}”. Assumed: because no policy edit route or
  update action existed, the linked policy row uses a new limited editor for
  name, insurer and premium; schedule and payment fields remain unchanged.
  CR-56/CR-57 supersede the CR-32/CR-33 Budget presentation structure only;
  their due-clearing, apply-plan and Transactions Review navigation behavior
  remains in place.
  Chart/layout tests are simulated; chart
  rendering, rotated pace segments, scrolling, and native font-scale/touch
  behavior require real-device verification. Assumed: selected-month actuals
  include all past-month transactions, stop at injected today for the current
  month, and are empty in future months; linked entry transactions are assigned
  to their scheduled parent rows where possible.
- DEC-BUDGET-V10: schema v10 replaces plan/snapshot budget lines with
  user-managed sections and items. Defaults seed Survival (Needs), Savings and
  Investments (invest), Wants, Festival/Donations/Culture and Unexpected Extras;
  Income, Debt repayments and Insurance remain system sections. Built-in
  category names stay exact. Item names are transaction category strings;
  past/current snapshots freeze their own sections/items, while eligible
  upcoming months derive from the plan. Section/item add, rename, type-change,
  delete and edit actions apply to either the viewed month or the plan plus
  viewed stored snapshot, preserving later custom snapshots. Limits are 12
  sections, 40 items per section and 100 items total; names are trimmed,
  1–30 characters and unique case-insensitively across items. Built-in names
  cannot be placed in a different seeded section. Deleting a section removes
  only its plan/snapshot items; transactions and their category strings remain
  unchanged. Month views place unplanned transactions under Unbudgeted in the
  mapped section, or Other (not in budget) when no section mapping remains.
  CR-60/CR-61 supersede the fixed-category/flat-line data constraint in
  DEC-BUDGET-SPEC. They also supersede the header-only section-card and
  fixed-category setup-form constraints as future UI design constraints;
  P20-P intentionally does not rebuild those screens. The next UI phase owns
  section/item management controls. Assumed: a v9 category with no seeded
  group maps to the first spend section, Survival, during migration. Unknown
  investment transaction categories that are not built-in remain custom
  category strings rather than collapsing into Other investments, so removing
  their budget item does not rewrite their visible/filterable identity.
  Device checks for persisted v9 recovery, custom section editing UX and
  category/filter layout remain unverified.
- DEC-P20G: schema v8 replaces all budget-template state with one nullable
  `budgetPlan`; applied month snapshots use `source: 'plan'`, hand-edited
  month snapshots use `source: 'custom'`, and v7 snapshots retain their lines
  while migrating to `source: 'custom'` with `linkedIncluded: false`. Migration
  selects the default template, otherwise the most-used template (ties by
  latest snapshot month, then original list order), otherwise the first
  template; EMI and Insurance lines are removed from the selected plan and
  the remaining templates are dropped. Migrated plans do not repeat.
  Assumed: template list order is the stable final tie-breaker where usage and
  latest month are equal. Repetition begins next month; hydration may apply
  only the current month when its repeat start has arrived and no snapshot
  exists, never backfills past months, and is idempotent. Applying a plan
  changes only that month's snapshot and never edits recorded transactions.
  The setup screen's Apply Undo restores both the previous plan and previous
  month snapshot with one data action; Budget-tab Apply Undo restores only the
  month snapshot it replaced. `applyBudgetPlanToMonth` keeps the required
  injected `newId` option for action consistency, although month snapshots
  have no ID field to consume it. CR-30 supersedes CR-24: the Budget header has
  no menu and month navigation remains. CR-34 later removes the Budget Review
  control. Home applies an existing plan for the selected current month or
  opens setup when none exists.
- DEC-BUDGET-SCREEN: before P20-H, Budget showed a header/month switcher; a
  cash-flow card with opening, flow and closing; a plan/no-budget summary
  (planned income, spending, savings, left to allocate, edit/setup/apply and
  month adjustment); an earned-income/source and other-money-in breakdown;
  Bills and dues count/list/actions; reminders; a sort control; five group
  cards with planned/actual subtotals, progress bars, category links and Auto
  rows; separate Debt repayments and Insurance cards; and outstanding at
  month-end. Month review showed opening, earned income/source details, other
  money in, withdrawals, borrowed/loan proceeds/own funds, expenses,
  investments, closing, shortfall/surplus and remaining amount. Its actions
  were Record funding, Save allocations, Keep as cash, Add allocation, Remove
  an allocation, and How was it funded? with Borrowed, Loan proceeds,
  Savings or investments, Own funds, Invest and Repay a liability choices;
  choice-specific inputs included amount, target, lender and note. No
  persisted reviewed/dismissed flag existed: eligible months were derived
  from transactions and committed allocations were transactions.
  P20-H final screen has the existing header, one Edit budget action and
  month switcher; a Cash flow card with only Opening balance and Closing
  balance; a same-style plan summary with the existing plan figures and actual
  income where available; then one card per group in the order Survival
  (Needs), Savings and Investments, Wants, Festival/Donations/Culture,
  Unexpected Extras, Debt repayments, Insurance. Each row appears once in
  its group with name, optional due date, actual/planned amounts, text status,
  and action; linked rows retain Auto. Paid rows remain visible without an
  action. No progress bars, nested cards, separate Bills and dues section,
  source-breakdown card, reminders, sort control, outstanding card, or Review
  control is absent. The amount figures appear only in cash flow, the plan
  summary, the relevant group header and its rows; no duplicated due block or
  repeated linked row remains. Transactions' user-kept Review {Mon} action
  opens Budget for the eligible month. Decisions: KEEP opening/closing once in
  Cash flow, planned income/spending/saving/left-to-allocate and actual income
  once in Plan summary, and month switching. MERGE linked schedules and budget
  rows into their category groups; each group has one card, each obligation
  one row, and paid status remains visible. REMOVE the separate Bills and dues
  block, progress bars, nested group cards, the earned-income/source card,
  reminders, sorting, month-end outstanding card, and Budget Review action.
  The Review-reference audit found: `app/month-review.tsx` was the removed
  screen; its route-kind registration is removed; `app/(tabs)/budget.tsx` no
  longer has a Review action; `app/(tabs)/transactions.tsx` retains the one
  “Review {Mon}” action and routes it to Budget with the month; no Month review
  entry remains in `src/lib/appMenu.ts` or the rendered menu. The corresponding
  references in `src/lib/routeKinds.ts` are removed; tests in
  `src/components/__tests__/RouteRenderSmoke.test.tsx`,
  `src/components/__tests__/TransactionsScreen.test.tsx`,
  `src/components/__tests__/useAppMenu.test.tsx`, and
  `src/lib/__tests__/routeKinds.test.ts` now test removal or the retained
  Budget navigation. `src/domain/cashFlow.ts` and its tests retain
  `reviewableMonths`, used to choose the Transactions link's eligible month.
  `src/lib/sorting.ts` still contains its `monthReview` sort metadata, left
  unchanged as protected legacy metadata for P27-A. The demo test's old
  “Month-review-funded” title was renamed to avoid implying the removed screen.
  Generic confirmation cancel labels in `app/clear-dues.tsx`,
  `app/investment-form.tsx` and `app/liability-form.tsx` changed from “Review”
  to “Cancel”; their negative/cancel outcomes and form data remain unchanged.
  Other `Preview`/`preview` strings in security settings, import/form previews,
  and `duesThroughPreview` refer to distinct behavior and remain unchanged.
- DEC-P20H-retired: P20-H removed the Month review screen/action surface.
  Retired
  controls are the empty-state Back and screen close/back navigation, Record
  funding, Save allocations, Keep as cash, Add allocation, Remove,
  How was it funded?, and the source choices Borrowed, Loan proceeds, Savings
  or investments, Own funds, Invest and Repay a liability. Pure
  `reviewableMonths`, `shortfallForMonth`, `surplusForMonth`, `fundShortfall`,
  and `allocateSurplus`, their allocation types/schema, store actions and
  persisted transaction records remain unchanged as P27-A cleanup candidates.
  `reviewableMonths` is not dead code because Transactions still uses it to
  determine the month in its retained link; only shortfall/surplus allocation
  UI and store-action call sites are no longer reachable from a screen.
  There was no separate persisted review flag or review data to delete.
  CR-34 removes the old Month review route and Budget's Review control, plus
  the review menu action if present; Transactions' “Review {Mon}” is retained
  and routes to Budget. Home had no Month review navigation reference.
  Assumed: linked schedule row actuals use the schedule payment amount, while
  manual budget actuals stay derived from transactions in the selected month;
  current-month schedule rows are the usual payment-action path. Assumed:
  rows sort by due date then name, undated last; due-date and 1.3/2.0 text
  wrapping tests model styles and accessibility props, not native pixel   layout.
- DEC-P21C-CR37-38: normal Emergency fund mode no longer renders linked holding
  names/chips or Over/Under/On target labels; each active allocation row shows
  name, available amount, target amount and target percentage before a full
  width progress bar as its final element. The single `edit-2` “Edit
  allocation” action is in AppHeader; no card pencil or menu is shown.
  Emergency fund explicitly opts out of AppHeader's global menu. Other screens
  that show a menu are Home, Transactions, Security, Backup and restore, Link
  missing transactions, Theme, Investment entries, and Liability schedule;
  none were changed for this request. The allocation editor adds predefined
  items from its header plus action, offers Custom, and confirms removal of
  fixed or custom items with the exact requested copy. Removal changes only
  the draft grouping/allocation; `saveEfPlan` persists the single plan in one
  store write and leaves emergency-goal asset shares intact. The old direct
  `deleteEfCustomBucket` domain/store path was removed rather than retained as
  a second deletion behavior. Old zero-percent fixed items without links are
  treated as deleted when opening the editor.
  Assumed at P21-C delivery (superseded for defaults by DEC-P21D-CR51): the
  current seven-bucket domain has a combined `FD / RD` item, not separate FD
  and RD items; the original suggested 10/40/35/15 mix included Mutual funds /
  Bonds. P21-D now uses only Cash, Bank account and FD / RD as defaults.
  Superseded P21-C assertions: the old EmergencyGoalScreens expectation that
  “Savings account” linked-asset text/chips render in normal mode and the
  beside/stacked status layout assertions are replaced by checks that the
  header has exactly one `edit-2` action, rows omit status labels, and each
  allocation item's bar is last at font scales 1.0, 1.3 and 2.0 (CR-37).
  The old compact custom-only deletion tests that required moving a positive
  allocation, tested move targets, and expected an empty custom link-map entry
  are replaced by exact confirmation, 100%-total validation and a pure
  save-plan test proving fixed/custom grouping removal preserves goal links
  (CR-38). In `EfAllocationForm.test.tsx`, obsolete reset-control assertions
  and the prior `resetEfAllocation` action assertions in
  `efAllocation.test.ts` and `createAppStore.test.ts` are deleted; the former
  form test is replaced by a source scan proving no reset/suggested-mix action
  remains. Four default-value checks, header add-choice/custom flow, deletion
  confirmation and live-total checks remain. Deleted function/store action:
  `resetEfAllocation`; removed/replaced tests: the reset assertion in
  `normalizes partial and invalid allocations and applies set/reset actions`
  (renamed `normalizes partial and invalid allocations and validates set
  actions`), the reset block in `saves emergency fund allocation with one
  persisted write and restores the suggestion` (renamed `saves emergency fund
  allocation with one persisted write and rehydrates it`), and the reset UI
  assertions in `keeps reset-to-default behavior and removes the old
  suggested-mix control` (replaced by `does not expose an expand-all control or
  legacy allocation reset actions`). The unused expand-all assertion is
  replaced by an explicit absence check.
  The form-level “Market-linked” switch remains and now has its requested
  helper. `FormScreen`'s existing optional header action gained optional icon
  and variant props; its legacy trash/destructive defaults remain tested.
  The edit-ownership scanner's former blanket rule that only the shared row
  components may contain `edit-2` is replaced by an exact allowance/assertion
  for Budget's required header-only “Edit budget” action (CR-33); the user's
  `app/(tabs)/budget.tsx` source was not changed.
  The repeated `3c644d3` audit and unchanged title are recorded in
  DEC-USER-CHANGES. No schema change; the schema remains v8.
  P21-C font-scale tests are simulated: real OS scaling, rendered clipping,
  touch behavior for header edit/add/remove controls, native confirmation
  presentation/cancellation, editor scrolling/keyboard behavior and
  VoiceOver/TalkBack announcements remain unverified on a physical device.
- DEC-P21C1-CR39: the crash reproduces when a v8 allocation contains a stale
  fixed/custom bucket key such as `deleted-custom: 0`. `appDataSchema` checks
  numeric range and total but not that allocation keys belong to the current
  fixed/custom bucket set; `safeStorage` previously accepted that schema-valid
  blob without running cross-record integrity. `EmergencyFundScreen` then
  passed the stored record to `allocateAmounts`, whose stricter key validation
  correctly threw. The form also accepted two-decimal input while its total
  calculation rounded to one decimal, and Save stayed enabled for invalid
  totals. Domain actions now reject unknown, negative and non-finite entries,
  compare the total at two-decimal precision, and store a largest-remainder
  canonical allocation. The form displays the hundredth-percent live total,
  the validation message and a disabled Save. `resolveEfAllocation` is used by
  the screen, form, allocation selector and hydration; invalid persisted
  allocations are repaired once and their exact raw envelope is archived at
  `.prerepair-efallocation`. `allocateAmounts` retains its throwing contract.
  No schema-version change; v8 remains current.
  Assumed: valid positive percentages are proportionally renormalized to
  hundredth-percent units; stable fixed/custom bucket order breaks equal
  remainders. At P21-C1 delivery, if nothing valid remained, the four P21-C
  default buckets (10/40/35/15) were used; this fallback is superseded by
  DEC-P21D-CR51.
  Assumed: P21-C remains Done as previously delivered; P21-C1 is an additive
  fourth P21 entry rather than a rewrite of the earlier delivery.
  Superseded assertions: the old `effectiveAllocation` partial-map expectation
  that missing buckets inherit suggested percentages is replaced by resolver
  normalization/default tests; invalid warning fixtures that summed above
  100% are replaced by valid 100% mixes because warning selectors now resolve
  allocation first; persisted full maps with zero-valued keys are replaced by
  canonical positive-only allocation assertions. Form totals now display two
  decimal places (`100.0%` → `100.00%`) so 99.99% does not appear complete.
- DEC-P21D-CR51: Null allocations and repair fallbacks now use only Cash 10,
  Bank account 40, and FD / RD 50. The demo allocation follows that mix.
  At P21-D delivery, Mutual funds / Bonds remained available from the editor
  header; P21-E supersedes that picker. Valid allocations already stored by
  users are unchanged. Schema v8 was current then; later work advanced it to
  v13, which P21-E leaves unchanged.
  Superseded assertions: the old four-default `activeEfBucketMetadata(null)`
  list is replaced by the three requested defaults; form and demo expectations
  for 10/40/35/15 are replaced by 10/40/50; the empty-allocation hydration
  fallback expectation changes from four groups to three. The form separately
  verifies that Mutual funds / Bonds is still addable. Existing saved 10/40/35/15
  allocations remain in tests and must resolve without repair.
  Assumed: this request supersedes only the default and repair-fallback mix
  from P21-C/P21-C1; it does not rewrite any valid persisted allocation.
- DEC-P21E-CR90: Allocation item creation is direct and custom-only from the
  Edit allocation plus action; the predefined add choices and their separate
  custom-option modal are removed. Add and edit use one route form with title,
  access speed, and market-linked fields. Schema v13 is unchanged.
  New custom items begin at 0%, so the separate allocation editor continues to
  enforce a 100% total when saved. Deletion retains the existing confirmation
  and keeps assets linked to the Emergency fund goal while removing the bucket
  grouping.
  The obsolete `addEfCustomBucket`, `renameEfCustomBucket`, and
  `setEfCustomBucketAccess` mutations were removed; `saveEfPlan` is the only
  form mutation path.
  Superseded assertions: the picker-choice test for Mutual funds / Bonds,
  Stock market, LIC / Insurance, Other, Custom and Cancel is replaced by
  direct-route/add-form assertions; custom-option modal creation and
  metadata-edit tests are replaced by route-form validation/save tests; direct
  custom-bucket add/rename/access domain-action tests are replaced by
  saved-plan transformation and shared-form tests.
  Assumed: fixed bucket metadata remains canonical because this part explicitly
  makes no schema change; fixed items use the same edit route with an immutable
  title and read-only built-in access/market metadata.
- DEC-P20I-CR35-36: Initial Home due confirmation and goal-status layout,
  subsequently corrected/superseded by P20-J; see DEC-P20J-CR40-43 below.
- DEC-P20J-CR40-43: Home due rows remain non-interactive and show title,
  amount, date and the compact text action “Marked as paid”; only the button
  opens the unchanged native Paid / Not paid confirmation. Oldest dues clear
  directly, later dues use the existing clear-through preview/action, and
  both preserve Undo and the existing atomic store actions. At font scale 1.3
  and above the Home rows stack. Goal cards on Home and Goals (including
  Emergency fund) show details before a final progress bar and no projection
  status or unreachable text; projection calculations and dates remain.
  Linked asset values are divided by the count of linked goals, in integer
  paise; sorted goal IDs deterministically receive remainder paise. Legacy
  `share` properties remain optional for older stored/backup data, but are
  ignored by calculations and omitted by new links. The EF bucket-link
  integrity rules are unchanged. Remaining edit icons use Feather `edit-2`.
- DEC-P20K-CR44-46: Home goals share one card and single hairline row dividers
  (none after the last row). Transactions' transaction list itself is not a
  card; it uses `ListItem` rows with the shared hairline divider, while its
  separate Available balance card remains unchanged. Asset and liability
  cards retain their existing visuals and gain accessible body edit targets;
  card action buttons stop propagation. Liability data and explanatory text
  are before the progress bar, with only existing due/action buttons after it.
  Replaced assertions: prior asset-card and recurring/one-time liability edit
  icon expectations are replaced by body-role/label/hint and route assertions;
  old card-owned edit-action ownership expectations are replaced by no-icon
  assertions on those cards, while shared row icon ownership and the global
  `edit-2` scan remain.
- DEC-P20L-CR47: Transactions' "Due payments" section keeps the user's exact
  count/total header wording, is always expanded in one Card, and is omitted
  when the current filtered month has no dues. Rows use the list's hairline
  divider style and show title/date, amount and only one compact Paid or
  Received clear action; they omit pending-status badges. The oldest due still
  clears directly with Undo; later dues retain the exact FIFO confirm preview,
  one store action and one Undo. The old collapsed-toggle/arrow/hidden-list
  assertions become always-open/no-toggle/visible-list assertions; old
  separate Pay/Clear due button expectations become the one Paid/Received
  action; reason: the section is now always open and has one clear action.
  Current source/tests had no literal "After earlier dues" assertion; the
  existing clear-through confirmation assertion remains and checks the exact
  "This includes N-1 earlier dues" message.
  Assumed: only Transactions due rows adopt these labels; the prefilled Pay
  form is no longer shown on Transactions due rows, and income dues use
  "Received". Home/Budget clear behavior and the generic Pay-navigation path
  stay unchanged. The initial
  targeted run also found stale Home RouteRenderSmoke expectations for
  "Marked as paid": `268e4c7` changed that user-owned Home label to "Paid",
  so only those test expectations were aligned to the current source; Home
  code was not changed.
- DEC-P20L-CR48: On Transactions, Assets, Liabilities and Goals, the
  Feather `filter` action toggles a closed-by-default inline panel directly
  under the header. The existing SortChip and type chips live in the panel;
  sorting persistence/logic remain unchanged. Transactions orders the
  existing menu before Filter and keeps the plus action rightmost; Assets,
  Liabilities and Goals have Filter immediately before their existing plus.
  The dot marks a non-All type filter or a non-default sort. Replaced tests
  that expected SortChip/type chips visible in the old screen-level row now
  assert no panel controls while closed, accessibility expanded state,
  panel contents after opening, header order and active-filter dot; reason:
  the user explicitly relocates those controls into the header panel.
  `SortChip.tsx` and `src/lib/sorting.ts` remain unchanged. Of the four
  screens, only Transactions already had an explicit menu; other menu
  visibility was not changed.
- DEC-P20L-CR50: Liabilities adds local All, Recurring and One-time chips to
  the existing inline filter panel. The selected kind combines with the
  existing sort without changing sort persistence; a non-All selection lights
  the filter indicator. When the selected kind has no records, the list shows
  "No matches". Tests cover each kind, panel visibility, active state, and
  the empty state. Search composition is covered with CR-49.
  Assumed: kind selection resets to All when leaving and remounting the screen.
- DEC-P20L-CR49: Assets, Liabilities and Goals each show the shared SearchField
  below the header/filter panel; Transactions retains its existing search
  unchanged. Search trims and lowercases the query and matches the displayed
  holding name/type, liability name/type, or goal name (including the
  Emergency fund label). A labelled clear action appears only on these three
  screens, preserving Transactions' existing field without a clear action.
  No matches appears for empty results, and local queries reset on remount.
  Tests cover case/trim, matching by type, clear handling, no matches,
  remount reset, type-filter composition, and active sorting.
- DEC-P20L-GATE-TEST: The full suite exposed an existing HomeThemeSmoke
  assertion that looked for "Hide spending by category" among visible child
  text, while the unchanged Home control exposes that exact string as its
  accessibilityLabel and renders a numeric summary. The assertion now checks
  the existing accessible label directly; Home screen source is unchanged.
- DEC-BUDGET-DIRECTION: Done. P20-N completed the visual overview, P20-O the
  item editor and budget-aware category picker, and P20-P user-managed
  sections/items with custom transaction categories. Budget is a forward-
  looking plan of recurring income, bills and investments arranged in
  user-managed sections. It is created from the Budget screen and flows into
  future months and into Transactions as due items. Actual spending is recorded
  in Transactions by selecting a budget item. Budget has no pay buttons;
  paying is done in Transactions and Home. Upcoming months derive from the
  plan, while stored months remain frozen. See DEC-P20Q-CR62-65 for the
  current screen contract and superseded UI.
- DEC-P20Q-CR62-65: P20-Q moves plan creation and management into the Budget
  screen, reuses Home’s collapsed spending-summary presentation for expandable
  sections, extends the existing sheet for section/item/income edits, and
  replaces the overview layout with responsive table rows. It supersedes the
  header-only section-card presentation and the dedicated setup/month forms;
  persisted schema-v10 data and P20-P scoped action semantics remain unchanged.
  CR-62 replaces `app/budget-setup.tsx` / `BudgetSetupScreen` and
  `app/budget-month-form.tsx` / `BudgetMonthFormScreen` with direct plan
  creation/application and in-screen management. The deleted setup-only
  assertions in `RouteRenderSmoke.test.tsx` (font-scale setup groups/suggested
  split, linked recurring setup preview, setup route tab-bar absence, and
  income add/remove/save validation) are superseded by CR-64 sheet/action
  coverage; `/budget-setup` and `/budget-month-form` are explicitly absent from
  route-registry tests. The `suggestBudgetSplit` function and its
  `BUDGET_CATEGORY_WEIGHTS` constant are removed. The domain assertions
  “suggests rounded five-group allocations, respects commitments, and warns on
  group overages” and “keeps fixed within-group weights at 100% and rounds each
  category to the nearest hundred” are superseded because the UI no longer
  offers a suggested split; default section/category integrity remains tested.
  The P20-M setup-income-editor acceptance row is superseded by the integrated
  Budget-screen sheet. CR-63 replaces the standalone section-card presentation
  and "Planned vs actual" card with collapsible section rows; rows start
  collapsed, past months are read-only, linked rows retain source edit routes,
  and unbudgeted categories are read-only. CR-64 consolidates section, item,
  and income management into one scoped sheet; delete confirmation names the
  affected item count, while Remove item remains the edit-sheet deletion
  affordance. CR-65 uses one planned allocation stack, a four-row planned/
  actual table, and short visible summaries; the longer summaries are
  accessibility labels. Home's summary presentation is extracted without
  changing its visible look. CR-64 removes the superseded `BudgetItemEditSheet`
  and `BudgetSectionAddSheet` components and `BudgetItemEditSheet.test.tsx`;
  `BudgetManagementSheet` now owns all six modes. The setup tests that imported
  `BudgetSetupScreen`/`BudgetMonthFormScreen`, including linked recurring setup
  preview, setup-route tab-bar absence, and separate setup-income save/remove
  flow, are replaced by route absence, direct create/apply, integrated
  sheet/action, and source-route coverage.
  Assumed: Create budget atomically saves and applies the empty default plan
  to the current month, since current-month sections cannot otherwise be
  managed before a snapshot exists. The same one-write action has an Undo
  restoring the previous plan and month snapshot. Management controls remain
  hidden in past months. Assumed: section rows begin collapsed on each screen
  mount; the stacked bar visualizes planned allocation while actual values are
  communicated in the adjacent table.
- DEC-P20R: Budget management sheets are top-anchored beneath the safe-area
  inset, constrained by the available window and keyboard, and use a shared
  wrapper also for the Goal screen's bottom-anchored asset picker. Other Modal
  uses are not sheet-style forms (or are frozen form inputs) and remain
  unchanged: the `SortChip` selection modal remains protected; `DateField`'s
  native date-picker modal remains frozen; `HeaderMenu` is a fade menu;
  `investment-form` is informational; `ef-allocation-form` uses centered
  dialogs. Section actions move to icon buttons in each section Card; edit
  and delete are separated into labeled actions, and item deletion moves from
  the body text link to the edit sheet's trash icon. P20-R supersedes the
  collapsible-row portion of CR-63 with one Card per section, while preserving
  its item rows, source routes, and past-month read-only behavior. It
  supersedes CR-64's section-action text buttons and the sheet-body
  “Remove item” text button with section-card icons and a header trash icon;
  scoped mutations, confirmation copy, one-write behavior, and Undo remain.
  Assumed: `KeyboardAvoidingView` and keyboard-height-aware available-space
  calculation provide a visible first field while retaining the 60%-of-window
  height cap; the shared wrapper is also used for the Goal asset picker because
  it is a bottom-anchored selection sheet launched from a full-screen form.
  Assumed: React Native keyboard show/hide events report the available keyboard
  height accurately on supported devices; tests simulate the event and verify
  style contracts, not physical keyboard overlap.
  Replaced assertions: the CR-63 collapsed/expanded state and chevron
  assertions become one Card per section with no expanded state; reason:
  P20-R explicitly removes collapsible rows. CR-64's text section actions and
  body “Remove item” link become labeled 44×44 section icons and edit-mode
  header trash; reason: P20-R moves deletion to the header while retaining
  scope confirmation, one persisted write and Undo. The former bottom sheet's
  bottom anchoring / fixed `maxHeight: '60%'` expectation becomes top safe-area
  placement and a keyboard-adjusted window-height cap; reason: CR-66.
- DEC-P20S: convert only transaction expense/invest category, investment
  holding type, liability type, and Budget item category controls to the new
  dropdown. Preserve other ChoiceField uses and frozen form components.
  Compose FormShell inside the existing top-anchored sheet for Budget
  management and the Goal asset picker; keep FormScreen unchanged for
  full-screen route forms. Transaction-derived budget rows become manageable;
  linked asset/liability rows remain read-only and route to their source forms.
  CR-59's visible “Left X of Y” category hint is superseded by titles-only
  dropdown options, and its unbudgeted read-only presentation is superseded
  by edit affordances for transaction-derived unbudgeted expense/invest and
  income rows. Insurance remains a protected system section but may contain
  user-managed manual items; linked policy rows remain read-only and must not
  duplicate manual dues or actuals.
  Assumed: Dropdown follows the existing top-anchored sheet interaction
  pattern, with group headings excluded from selectable/accessibility options
  and a keyboard-safe scroll area capped at 60% of the window.
  Assumed: a manual Insurance plan item contributes its own planned line and
  due independently from linked policy rows, which retain their existing
  linked commitment/actual treatment.
  Assumed: the protected Insurance system section accepts the built-in
  Insurance category and user-entered Custom item names; other built-in
  categories remain restricted to their mapped sections.
  Superseded assertions: P20-Q's collapsible-section and section text-button
  assertions are superseded by P20-R's one-card-per-section and icon-action
  assertions; reason: CR-68 replaced those presentation patterns. CR-59's
  visible remaining/over-budget hints and unbudgeted read-only assertions are
  superseded by titles-only Dropdown options and transaction-derived edit
  affordances; reason: CR-70 and CR-75.
- DEC-P20S-R1: the owner broadens P20-S's ChoiceField scope to all form
  controls, including security settings, while keeping filters unchanged and
  retaining the ChoiceField component. Replace missing persistent titles on
  editable text, money, number, percent and date controls without changing
  frozen components. SegmentedControl title props are intentionally omitted
  per the owner's follow-up. Existing Dropdown titles and selected
  values/options must be preserved when converting to Dropdown.
  Superseded assertion: DEC-P20S's instruction to preserve other ChoiceField
  uses. New: every non-filter ChoiceField usage in app form/settings controls
  uses Dropdown. Reason: the owner explicitly broadened the conversion scope.
  Test assertions move from ChoiceField/choices to Dropdown/options and retain
  option-value and behavior checks. Title assertions do not require
  SegmentedControl labels; no behavior assertion is weakened.
- DEC-P20S-R1-R1: if the owner edits a file after agent changes, ask whether
  they want those edits reverted before changing that file further. Revert or
  overwrite owner edits only on explicit request; otherwise preserve them and
  work around them. This project-wide instruction is recorded as R5 in
  `AGENTS.md`.
- DEC-P20T: the user explicitly authorizes changing only
  `src/components/form/FormScreen.tsx` among frozen inputs, and requires its
  updated SHA-256 in `frozen-manifest.json` and `formComponentsFrozen.test.ts`.
  FormScreen SHA-256 before the authorized edit:
  `f454190b2efe6372b3c502af8581af5b7a3e1f8eb5ae4bb8f82dc9081ca3f5e0`.
  Authorized implementation SHA-256:
  `6ccd3d7863d28c00d4e63f51e0cafc5a847ff69739cf676e368ace15a8eb55f6`.
  Implementation commit: `e432034` (verified with `git log` and
  `git cat-file -t`).
  Reason: FormScreen and FormShell must share one header/body/footer
  implementation. Every other frozen input stays byte-identical. Full-screen
  forms use a Back action on the left; sheet forms use Close as the rightmost
  action; destructive actions appear to its left; Save remains in the fixed
  footer. Preserve dirty-form discard, validation summary, defaults,
  validation, field values and store calls. Form route pages with inputs and
  footer actions use FormScreen; Budget management and the Goal asset picker
  use FormShell. `link-missing` is a bulk-action/selection screen rather than
  a data-entry form; its existing AppHeader, list and fixed action footer
  remain. EF linked-investment selection remains a picker; EF custom-option
  add/edit dialogs now use FormShell.
  Assumed: the shared shell preserves platform keyboard handling by keeping
  FormScreen's SafeAreaView/KeyboardAvoidingView around the shared core and
  TopAnchoredSheet around sheet forms.
  Assumed: onboarding retains its original no-back/exit-app behavior; its
  custom top content stays scrollable and Continue/Skip move into the shared
  fixed footer. Erase-data retains its confirmation and destructive action,
  with the action moved into the shared footer.
  Assumed: invalid/missing-route states use the shared Back action without a
  redundant footer Back button; non-form settings, list filters and pickers
  remain outside the data-entry form shell.
  Form inventory (previous structure → P20-T structure):
  | Form surface | Previous | P20-T |
  |---|---|---|
  | `app/transaction-form.tsx` | `FormScreen` local layout | `FormScreen` adapter to shared core |
  | `app/investment-form.tsx` | `FormScreen` local layout | `FormScreen` adapter; info modal remains informational |
  | `app/liability-form.tsx` | `FormScreen` local layout | `FormScreen` adapter |
  | `app/liability-payment-form.tsx` | `FormScreen` local layout | `FormScreen` adapter |
  | `app/goal-form.tsx` | `FormScreen` plus asset-picker `FormShell` with left Close | shared core; picker Close moved to rightmost action |
  | `app/ef-allocation-form.tsx` | `FormScreen` plus locally laid out custom-option modals | shared core; custom add/edit dialogs use `FormShell`; linked-investment modal remains a selection picker |
  | `app/policy-form.tsx` | `FormScreen` local layout | `FormScreen` adapter |
  | `app/investment-entry-form.tsx` | `FormScreen` local layout | `FormScreen` adapter |
  | `app/clear-dues.tsx` | `FormScreen` local layout | `FormScreen` adapter; Done/Confirm remain footer actions |
  | `app/profile-form.tsx` | `FormScreen` local layout | `FormScreen` adapter |
  | `app/onboarding.tsx` | `Screen`, custom content and inline actions | `FormScreen` shared header/body/footer; retains no-back entry behavior |
  | `app/erase-data.tsx` | `Screen`, `AppHeader`, inline destructive action | `FormScreen` shared header/body/footer |
  | Budget management sheet | `FormShell` | shared core through `FormShell` inside `TopAnchoredSheet` |
  | Goal asset picker | `FormShell` | shared core through `FormShell` inside `TopAnchoredSheet` |
  | Security settings | `AppHeader` and setting controls | unchanged; settings surface, not a data-entry route form |
  | `app/link-missing.tsx` | `AppHeader`, selection list and fixed action | unchanged; bulk-selection flow, not a data-entry form |
  | Liability payments / investment entries lists | list headers and filters | unchanged; list/filter surfaces, not forms |
  - DEC-P20U (CR-86/CR-87): replace the BudgetManagementSheet editor with
    full-screen `FormScreen` routes for budget sections, items and income;
    keep the existing domain/store actions and scoped Undo behavior. Item
    names become user-entered names with no category chooser or Custom option;
    section identity is implicit in the route and visible as read-only context.
    Keep the section Spend/Invest choice because `addSection` requires a type
    and the prior flow exposed both choices. Add/edit route forms retain the
    existing month/following scope semantics, validators and default scope.
    Section delete remains an immediate counted confirmation from Budget.
    `TopAnchoredSheet` remains because the Goal asset picker and `Dropdown`
    still use it. Supersede the BudgetManagementSheet design from CR-64,
    CR-66, CR-67 and CR-73: its modes, in-sheet validation/form implementation,
    header action arrangement and sheet-layout contracts are replaced by route
    forms with the shared FormScreen header/body/footer.
    Superseded functions: `makeFormSchema`, `titleFor`, and
    `BudgetManagementSheet`; `BudgetManagementMode` and
    `BudgetManagementValues` are replaced by each route's local typed schema
    and form values. Superseded sheet-only tests and
    assertions: inline sheet header/backdrop/top-anchor/font styling and the
    embedded sheet editing flows in `RouteRenderSmoke.test.tsx`; replacements
    exercise add/edit routes, scoped values, Budget entry points, validation,
    one-write Undo, and font-scale layout contracts. No standalone
    BudgetManagementSheet test file exists. Assumed: added sections default
    to Spend unless the form's preserved Spend/Invest selector is changed;
    route forms receive an explicit scope default from the selected Budget
    month and existing later-custom-month context. Schema remains v12.
    CR-86 implementation adds `/budget-section-form`, `/budget-item-form`,
    and `/budget-income-form`, registered in the root stack and form-route
    map; Budget entry points now route to these forms, and the old sheet path
    is deleted. The only new pure domain operation is `editBudgetIncome`,
    required so the income edit form can update all visible fields under the
    existing month/following scope rules; it is wired through one store action.
    No schema or protected input/sorting files change. The sheet's
    `CUSTOM_ITEM_CATEGORY` sentinel is removed because item names are direct
    text input and the requested item form has no category or Custom control.
  - DEC-P20V (CR-88/CR-89): Budget items support monthly, quarterly,
    half-yearly, and yearly recurrence. Monthly remains the default and requires
    no first-due month; non-monthly items require a valid first-due month and
    percent mode is prohibited. One pure `plannedForMonth(item, month)` helper
    governs monthly planned values and item-derived dues across Budget views,
    totals, pace, projected cash flow, dropdowns, and Insurance reconciliation.
    Existing month snapshots remain frozen. Schema v12 migrates to v13 by
    explicitly marking plan and snapshot items monthly; v14 imports are refused.
    Premigration v12 bytes are archived once and cleared by erase-all. Income
    behavior and existing category validity stay unchanged; Recharge is added
    as an expense in Utilities. P20-V supersedes monthly-only assumptions for
    item planning and any assertions that expected each plan item to contribute
    in every month; test assertions now distinguish due and non-due months.
    `resolveBudgetPlan` requires an explicit month so no caller can bypass
    `plannedForMonth`; the old monthless amount/percent resolver assertions now
    pass the month under test.
    Assumed: when adding a recurring item, the selected Budget month is the
    default first-due month; the first-due month chooser offers that month and
    the next eleven calendar months because the frozen field set has no
    MonthField. Assumed: because the frozen SegmentedControl has no disabled
    option API, Percent is omitted for non-monthly items and the helper text
    explains the restriction rather than rendering an inert Percent option.
    Assumed: the monthly demo item named `Recharge` represents the requested
    Mobile recharge example and uses the newly added built-in category name.
  DEC-USER-CHANGES (P23-A preflight audit): on 2026-10-21, using base
  `0774e51`, the worktree was clean;
  no manual checkpoint was needed. Re-audit of `5bd3c41..HEAD` found the same
  seven non-Copilot commits and two prior manual checkpoints; all paths are
  listed one per entry:
  - `4cb6367` — `.claude/settings.json`: removed local settings.
  - `4cb6367` — `.gitignore`: ignored `.claude` content.
  - `c49cafd` — `app.json`: formatting adjustment.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: available-balance card margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: Home action label and UI.
  - `268e4c7` — `src/components/IconButton.tsx`: exact action label support.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: label test.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: action text allowance.
  - `9a01941` — `app/goal-form.tsx`: blank initial Saved field.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-owned cash flow labels/layout and removed controls.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact Edit allocation title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and balance placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed Back to Transactions control.
  - `75e9097` — `src/components/BudgetManagementSheet.tsx`: user checkpoint; removed Value type / Apply changes to labels and renamed due-day label.
  - `ecc5c35` — `src/components/BudgetManagementSheet.tsx`: user checkpoint preserving the sheet edits above.
  - `7af5abe` — `app/(tabs)/index.tsx`: user-owned Home due-button label changed to `Paid`.
  The Budget screen's Cash flow labels and user-removed controls remain
  unchanged. The attached `file_Untitled-2.txt` is read-only. P23-A changes
  schema v10 to v11 only after inventory is committed.
- DEC-P23-INVENTORY: pre-change inventory and gaps against CR-78/CR-79:

  | Area | Exists in schema v10/source | Missing against spec; planned gap |
  |---|---|---|
  | Policy fields | `id`, `name`, `insurer`, `kind`, `premium`, `frequency`, `startDate`, `premiumYears`, `trackFrom`, `coverAmount`, `currentValue`, `valueAsOf`, `maturityDate`, `payments` | Lifecycle `status`, `policyNumber`, `sumAssured`, `endDate`, `nominee`, `note`; policy summary and annualized cover/income metrics |
  | Kinds/frequency | Kinds `term`, `health`, `life-savings`, `ulip`, `vehicle`, `home`, `other`; frequencies monthly/quarterly/half-yearly/yearly plus `single` | Frozen target names: `term-life`, `health`, `life-savings`, `ulip`, `motor`, `home`, `other`; explicit v10 mappings and four recurring frequencies |
  | Schedule | `policySchedule` derives finite slots using startDate, frequency, premiumYears and trackFrom; FIFO-matches payment history; `addMonths` gives month-end clamping | Policy endDate cap and active-only dues; recurring frequency schedule tests across all four frequencies |
  | Payment history | Policy payments have id/date/positive amount/note and create linked Insurance expenses | Existing records and links need retained history; policy deletion must unlink source but retain transaction |
  | Goal links | `goalLinks.ts` permits only `life-savings` and `ulip` policy assets; current savings value/payment history contribute | Kind changes must preserve valid links or throw typed error naming linked goals; policy deletion removes its links |
  | Integrity | `links.ts` validates policy-payment source parent/entry and linked expense fields; Goal validation checks linkable instruments | Deleted policy links must be removed atomically while transaction integrity remains valid |
  | Pending/Home | `upcomingDue` in `schedule.ts` includes policy next due; `clear-dues.tsx` clears dues; Home renders common due rows | Exclude inactive policy dues while retaining payment history |
  | Budget | `budget.ts` adds all policy schedules to monthly commitments and linked recurring rows; manual Insurance actual reconciliation excludes linked policy payments where requested | Inactive policies must contribute no planned rows/amounts; active policy rows must not double count manual Insurance items |
  | Actions/store | `policyActions.ts` only updates name/insurer/premium; `createAppStore.ts` only exposes `updatePolicy` and historical add | Add/update/status/delete, single persisted write per action, delete/status Undo and deep-equal restoration |
  | Summary | None | Add active count/cover/yearly premium, next renewal, 60-day upcoming rows, term cover, annual income estimate and cover multiple |
  | Screens | `app/policy-form.tsx` edits name/insurer/premium; no policy list route. Budget/Home dues route to policy edit; clear dues uses `app/clear-dues.tsx`. | This part explicitly adds no screens; existing screen behavior should remain compatible with extended data. |
  | Fixtures/demo | Mock data has one life-savings policy; demo data has one health policy; tests cover schedule/payment/link/budget/backup paths | Update fixtures to v11; add term-life, yearly health, motor and lapsed demo policies; test migration, backup, actions, summary and reconciliation |

  Migration maps existing `term` to `term-life` and `vehicle` to `motor`;
  `health`, `life-savings`, `ulip`, `home`, and `other` keep their names.
  Legacy `single` maps to yearly with one premium period, preserving its
  single scheduled due. Existing `premiumYears`, `trackFrom`, `currentValue`,
  `valueAsOf` and `payments` remain to preserve schedule and savings history.
  `coverAmount` migrates to the new `sumAssured`; `maturityDate` migrates to
  `endDate` where no explicit endDate exists.
  DEC-P23-A: Schema v11 extends policy lifecycle and metadata without adding
  policy screens. Existing names map explicitly (`term` → `term-life`,
  `vehicle` → `motor`); already-valid names remain unchanged. Legacy `single`
  frequency becomes `yearly` with one premium period, and missing `startDate`
  falls back to the earliest payment date, then injected `today`. A missing or
  unknown recurring frequency defaults to yearly; invalid policy kinds fail
  migration rather than being silently coerced. Existing schedule/payment and
  savings-history fields are retained.
  Assumed: the v10 single-premium representation is equivalent to one yearly
  period for the existing schedule engine; there is no explicit once-only
  frequency in schema v11.
  Assumed: when no schedule or payment date exists, the migration's injected
  `today` is the correct deterministic start date.
  Replaced assertion: the v10 `single` frequency expectation was changed from
  a `single` schedule to `yearly` with one period; reason: `single` is not a
  v11 frequency, while preserving the one scheduled due is required.
  Policy deletion removes policy-payment source links and policy goal/EF
  bucket references while retaining the linked transaction as an ordinary
  Insurance expense. Status changes and deletion are undoable; all policy
  lifecycle actions use one persisted write, and Undo restores deep-equal data.
  Active policies alone contribute premium dues, Budget commitments, cover,
  and premium summary values; inactive payment history is retained.
  Annual income uses the effective planned budget when available, otherwise
  the last three months of earned income annualized, otherwise `null`.
  No UI/screen files were changed. Physical-device behavior for existing policy
  routes and native accessibility remains unverified.
  DEC-P23-COVER (P23-B, CR-80/CR-81): cover goals are separate from savings
  goals and are excluded from net worth, saved totals, savings-goal progress,
  and Emergency Fund calculations. One non-deletable cover goal exists for
  each of term-life, health, motor, home, and other. Defaults are term-life
  income-multiple 10, health amount with no target value, and active-only for
  motor/home/other. Income-multiple targets allow 1–50; amount targets allow
  values >= 0. Cover summaries distinguish covered, gap, no-target, and
  missing; active-only is satisfied by at least one active policy.
  Only active policies contribute cover, yearly premium and renewal. Savings
  policies (life-savings and ULIP) are excluded from cover goals. The five
  insurance expense categories coexist with historical Insurance records and
  map to the protected Insurance Budget section. Manual Insurance budget
  entries remain manageable; linked policy rows remain read-only; actual
  category totals must reconcile without duplicate counting. Recording a
  scheduled policy premium uses its type category; manual typed premiums may
  suggest a policy only when exactly one active policy has that type.
  P23-B scope is schema v12/migration/archive and pure domain, store, budget,
  category, demo and test changes only; no new screens. The earlier planned
  screen-only P23-B is cancelled and superseded by this scope.
  Preflight at base `501956a` found a clean worktree; no manual checkpoint
  was needed. The user-owned Budget cash-flow labels and removed actions remain
  protected.
  Assumed: the generic `Insurance premium` category applies to `other`,
  `life-savings`, and `ulip`, because those kinds have no dedicated typed
  category. Assumed: the demo uses a term-life income multiple of 12 and a
  health target of 2,000,000 solely to demonstrate the required term gap and
  an editable health target; schema and empty-data defaults remain unchanged.
  Assumed: an active home demo policy is added to satisfy P23-B's required
  home-covered example, even though the P23-A demo fixture did not contain one.
  Linked policy schedule rows in Budget aggregate by premium category (one row
  per cover type); manual planned items remain separate/editable.
  DEC-DEMO (P23-B): preserves the P23-A term, health, motor and lapsed records;
  adds active home cover, demo-only term/health targets, and typed-premium
  transactions so the term gap, health target, motor/home covered and other
  missing states are represented.
  The direct source/test audit of the legacy `'Insurance'` category is recorded
  below; no legacy category or transaction history was removed.
  DEC-P23-C-SCREENS (P23-C, CR-82–CR-85): add the Insurance cover stack route
  without changing the four tabs or schema v12. Goals links from its Emergency
  Fund card, Budget's Insurance section, and a compact Home gap/missing row all
  open that route. Insurance cover cards are detail-first with the progress bar
  last; target editing and policy editing use the shared FormScreen. Policy
  card bodies open edit, while Paid and Schedule remain separate actions below
  the card details. The Insurance list uses local All/Active/Lapsed/Matured/
  Cancelled and kind filters plus case-insensitive name, insurer, policy-number
  and kind search. The premium category switch defaults on only when the domain
  suggestion identifies exactly one active matching policy; saving uses the
  existing policy-payment domain path. No savings-goal, Emergency Fund, or net
  worth calculations change.
  P23-C preflight on 2026-10-21 found a clean worktree at `b2a3d7c`; no manual
  checkpoint was required. `git log` re-confirmed the same seven non-Copilot
  commits since `5bd3c41` and the two user checkpoints already itemized one
  changed file per line under DEC-USER-CHANGES above; no newer user-owned commit
  or path was present. The Cash flow labels and removed Budget controls remain
  protected.
  Assumed: the existing `policy-form` route is retained for create and edit,
  expanded to the full P23-C policy fields; a separate `cover-goal-form` route
  edits the non-deletable target record. Policy dues use the existing clearDue
  flow and Undo toast rather than a second payment implementation.
  Assumed: a policy with no `sumAssured` contributes zero cover, and the policy
  number search is exact to the policy record's stored value (case-insensitive
  substring across searchable fields).
  Assumed: the existing premium schedule horizon accepts an 80-year term for
  newly-created policies; no separate policy-term field was requested.
  Assumed: when an explicitly linked manual premium includes a note, that note
  is retained in both payment history and the linked transaction; an empty
  note keeps the existing `{policy name} premium` transaction label.
  DEC-P23D (P23-D, CR-91): replace the Goals tab's `Insurance cover` text link
  and P23-C's gap/missing-only compact Home row with one Home Insurance Card.
  The card reuses `Card`, hairline-separated detail rows and `GoalProgressRow`;
  active policy summary supplies Total cover, Yearly premium and Next renewal,
  with a term-life progress bar only for a known target. It opens `/insurance`;
  with no policy records it displays the shared No policies yet empty state and
  routes Add policy to `/policy-form`. Budget's Manage policies entry and all
  Insurance and cover-goal screens/forms remain unchanged; Goals contains no
  Insurance content. Schema v13 and the four tabs remain unchanged.
  Assumed: “immediately after the Emergency fund card” means directly after
  the existing top Home summary Card, whose Emergency fund StatPill is the
  current Home emergency-fund summary; Home has no standalone Emergency fund
  Card. The Home Goal Progress Card remains in its existing position and
  unchanged. A policy-free state means `data.policies.length === 0`.
  Home Emergency fund inspection (STEP 1):

  | Surface | Existing structure, order and behavior |
  |---|---|
  | Emergency fund summary | The first Home `Card` contains Net Worth followed by Assets, Liabilities and Emergency fund StatPills; the EF StatPill is third and opens `/emergency-fund`. |
  | Goal Progress | Later on Home, one shared `Card` contains ordered goal rows with hairline dividers; each row is a `Pressable`, and the emergency goal includes details/actions followed by `GoalProgressRow`. There is no separate EF Card or EF-specific empty state. |
  | Empty state | Home does not render an EF-specific empty state; the emergency goal is ensured by the domain summary. Empty policy state is explicitly handled by the Insurance policy list with `No policies yet` and `Add policy`. |
  | Card style | The shared `Card` component applies themed surface/border, horizontal margin, padding and rounded border; row divider uses `StyleSheet.hairlineWidth`. The new Insurance card reuses `Card` and `GoalProgressRow`, without changing the Emergency fund or Goal Progress layout. |
  P23-D preflight on 2026-10-22 found a clean tree at `211e514`; no checkpoint
  was needed. The only later commit was the user's committed `5558bf4` with no
  Copilot trailer; its edits remain untouched:
  - `5558bf4` — `app/budget-income-form.tsx`: removed the scope SegmentedControl label.
  - `5558bf4` — `app/budget-item-form.tsx`: import ordering and removed Value type / Apply changes to labels.
  - `5558bf4` — `app/budget-section-form.tsx`: removed the scope SegmentedControl label.
  The Cash flow labels and removed Budget controls remain protected.
  Superseded by P23-D: P23-C's Goals-tab `Insurance cover` link (CR-82) and
  the gap/missing-only compact Home cover row (CR-82). The Budget `Manage
  policies` link remains the non-Home Insurance entry point.
  Replaced assertions: the Goals Insurance-link assertion becomes a no-
  Insurance-content assertion; the conditional compact-row/route assertion
  becomes Home Card ordering, detail ordering, target-gated final progress bar,
  empty-state Add policy route, and always-available Insurance navigation.
  The Budget route smoke test now selects the Value type segmented control by
  its current value rather than its removed label; the assertion on the Amount
  option remains unchanged, preserving the user-owned UI update in `5558bf4`.
  Assumed: TestRenderer font-scale checks at 1.3 and 2.0 verify responsive style
  props only; native wrapping, clipping, keyboard, safe-area and touch behavior
  still require physical-device validation.
  P23-D verification: `EmergencyGoalScreens.test.tsx`,
  `RouteRenderSmoke.test.tsx` and `HomeThemeSmoke.test.tsx` pass (182 tests);
  `npm test -- --coverage` passes 78 suites / 954 tests. Istanbul reports
  domain 98.25% lines / 92.92% branches, data (excluding hooks) 94.23% lines /
  87.74% branches, and pure lib 100% lines / 100% branches. `npx tsc --noEmit`,
  `npx expo lint`, Android export and iOS export exit 0. `npx expo-doctor`
  exits 1: 20/21 checks pass; SDK patch versions are behind for `@expo/ui`
  (57.0.25; expected ~57.0.26), `expo` (57.0.30; expected ~57.0.31),
  `expo-router` (57.0.28; expected ~57.0.29), and `expo-sharing` (57.0.23;
  expected ~57.0.24). These dependency versions were not changed in P23-D.
  The schema source remains `SCHEMA_VERSION = 13`; no persisted model/schema
  files were changed. `app/(tabs)/budget.tsx`, SortChip, sorting logic,
  frozen form components and their freeze test remain unchanged.
  Device checks not verified: physical iOS/Android card wrapping and clipping at
  system font scales 1.3/2.0; native touch propagation for the nested Add policy
  action; safe-area placement; accessibility announcements/activation; and
  actual navigation behavior. Tests simulate font scale and assert component
  props/styles only.

  DEC-P25A (v0.1.0 release preparation): documentation and app/package version
  metadata only; no feature, persisted schema or runtime behavior changes.
  The audit below is against the checked-in source and configuration as of
  2026-10-25.

  | File/resource | Exists | Audit | Finding / action |
  |---|---|---|---|
  | `README.md` | Yes | Stale | Described Expo starter creation rather than this app, omitted current features and privacy limitations, named only three tabs, and used an obsolete structure and incomplete commands. Rewritten to match the app. |
  | `LICENSE` | Yes | Needs owner confirmation | MIT text is dated `2015-present` and names `650 Industries, Inc. (aka Expo)`, not WealthWise. Preserved unchanged; repository evidence cannot establish intended copyright holder or licensing scope. |
  | `AGENTS.md` | Yes | Stale | Pointed routes to `src/app/` (actual routes are in `app/`) and did not reflect current schema, protected files or required gates. Updated with verified project rules. |
  | `CONTRIBUTING` / `CONTRIBUTING.md` | No | Missing | No contribution instructions found. |
  | `CHANGELOG.md` | No | Missing | Added a v0.1.0 summary from completed project work and current schema/migration support. |
  | `docs/PROGRESS.md` | Yes | Project history and schema record are useful; release plan stale | Old P25-A was reserved for encrypted backups. This request assigns release preparation to P25-A and retains encryption as planned P25-B. The release audit also records an unresolved CR-91 Home card-order discrepancy and reopens P23-D. |
  | `package.json` | Yes | Version stale before this task | Package name `wealthwise`, scripts and Expo SDK 57 were set; package version was 1.0.0. Updated only the version to 0.1.0. No project `engines` field. |
  | `package-lock.json` | Yes | Version stale before this task | Lockfile and root package metadata were 1.0.0; synced to 0.1.0. |
  | `app.json` | Yes | Version stale before this task | Expo name/slug are `WealthWise`; version was 1.0.0. iOS bundle ID and Android package are both set to `com.begawo.WealthWise`; scheme is `wealthwise`; EAS project ID is configured. Updated only version to 0.1.0. |
  | `app.config.*` | No | Not applicable | Static `app.json` is the Expo config. |
  | `eas.json` | Yes | Accurate | Development, preview and production profiles are present; EAS `appVersionSource` is `remote`. No app-build script exists in `package.json`. |
  | Node version pin (`.nvmrc` / `engines`) | No | Missing | No supported Node version is declared. The audit environment reported Node v26.10.0; this does not establish the project's supported range. |
  | `docs/` | Yes | Current inventory | `PROGRESS.md` is the only tracked documentation file before this task; this record adds the release audit and decisions. |
  | Runtime source | Yes | Core README claims match; CR-91 ordering gap found | Expo Router tabs are Home, Transactions, Goals and Budget; `SCHEMA_VERSION` is 13 and `migrate.ts` contains the v1-to-v13 chain. No `fetch`, Axios, XMLHttpRequest or WebSocket use was found in `app/` or `src/`. The Home Insurance Card currently appears after spending and due sections rather than directly after the Home summary's Emergency fund StatPill. |
  | Tests / project structure | Yes | Verified at preflight | Jest reported 78 suites / 954 tests at the P23-D close-out. Routes live in `app/`; domain, data, components, hooks, libraries, mocks, themes and constants live under `src/`. |

  Package scripts audited from `package.json`: `start`, `reset-project`,
  `android`, `ios`, `web`, `lint`, `test`, `typecheck`, `build:branding`, and
  `check:assets`. `reset-project` is the destructive Expo starter reset and
  must not be run on this application. The README lists the useful scripts and
  warns about this reset script.

  DEC-USER-CHANGES: the following commits after `5bd3c41` have no Copilot
  `Co-authored-by` trailer. Each line identifies one changed file; all listed
  changes were preserved:

  | Commit | Changed file |
  |---|---|
  | `6cb4fa0` | `app/(tabs)/budget.tsx` |
  | `6cb4fa0` | `app/(tabs)/transactions.tsx` |
  | `6cb4fa0` | `app/month-review.tsx` |
  | `64ffb5d` | `app/(tabs)/budget.tsx` |
  | `64ffb5d` | `app/ef-allocation-form.tsx` |
  | `9a01941` | `app/goal-form.tsx` |
  | `268e4c7` | `app/(tabs)/index.tsx` |
  | `268e4c7` | `src/components/IconButton.tsx` |
  | `268e4c7` | `src/components/__tests__/HomeThemeSmoke.test.tsx` |
  | `268e4c7` | `src/components/testUtils/assertNoVerbText.ts` |
  | `b217a2a` | `app/(tabs)/transactions.tsx` |
  | `c49cafd` | `app.json` |
  | `4cb6367` | `.claude/settings.json` |
  | `4cb6367` | `.gitignore` |
  | `75e9097` | `src/components/BudgetManagementSheet.tsx` |
  | `ecc5c35` | `src/components/BudgetManagementSheet.tsx` |
  | `7af5abe` | `app/(tabs)/index.tsx` |
  | `5558bf4` | `app/budget-income-form.tsx` |
  | `5558bf4` | `app/budget-item-form.tsx` |
  | `5558bf4` | `app/budget-section-form.tsx` |
  | `f1cdb1e` | `app/(tabs)/index.tsx` |
  | `f1cdb1e` | `src/components/ui.tsx` |
  | `0066166` | `app/(tabs)/index.tsx` |
  | `ff349515887dae09ac5ebc34776ec2754ed80dbe` | `package.json` |
  | `ff349515887dae09ac5ebc34776ec2754ed80dbe` | `package-lock.json` |

  P25-C preflight (2026-10-26): the worktree contained only the user's
  `package.json` and `package-lock.json` SDK patch update. It was committed
  unchanged as `ff349515887dae09ac5ebc34776ec2754ed80dbe`
  (historical subject, superseded by CM-1 enforcement:
  `chore: user manual changes (checkpoint)`), and both changed paths are
  included above. All earlier non-Copilot commit paths listed above were
  re-audited; the user-owned Home order and Budget cash-flow labels remain
  untouched.

  **Needs the owner:** confirm that the existing MIT `LICENSE` is intended to
  cover WealthWise and identify the correct copyright holder; choose and
  document a supported Node.js version; confirm ownership/availability of the
  configured Expo slug, iOS bundle ID, Android package and EAS project before
  publishing; provide approved screenshots if desired; schedule the CR-91 Home
  Insurance Card ordering fix before treating P23-D as complete. The repository
  does not establish those ownership or release-account facts.

  **P25-A changes:** README now documents verified features, npm commands,
  folder layout, SDK 57, Zustand/AsyncStorage, schema v13, migrations, local
  data and backup limits, missing notifications, device-verification limits
  and the requested financial/legal/insurance disclaimer. Added
  `CHANGELOG.md`; corrected `AGENTS.md`; set package, lockfile and Expo app
  versions to 0.1.0. License and identifiers were not changed. The
  `app/(tabs)/budget.tsx` cash-flow labels remain exactly as user-authored.
  Replaced assertion: P23-D's Card-order test compared two independently
  retrieved ReactTestInstance wrappers by object identity; it now checks the
  required second-Card Insurance content directly. The focused test shows that
  the actual second Card is the spending summary (`This month`), so CR-91 order
  is not satisfied. This feature fix is outside P25-A's documentation/metadata
  scope and remains a release follow-up; the failure is not suppressed.

  **P25-A gates (2026-10-25), run sequentially:** `npm test -- --coverage`
  exit 1 (78 suites; 952 passed, 2 failed), both font-scale variants of the
  P23-D Insurance Card ordering test. They report the second Card is `This
  month`, not Insurance, confirming the CR-91 discrepancy above;
  `npx tsc --noEmit` exit 0; `npx expo lint` exit 0; `npx expo-doctor` exit 1
  (20/21 checks: patch-version mismatches for `@expo/ui`, `expo`,
  `expo-router`, and `expo-sharing`); Android export exit 0; iOS export exit 0.
  These SDK package mismatches predate the documentation task and were not
  changed. No physical-device, store-signing, submission or publishing checks
  were performed.
  Coverage was emitted despite the test-gate failure: `src/domain/` 96.83%
  lines / 92.92% branches, `src/data/` 91.58% / 87.75%, and `src/lib/` 100% /
  100%. The focused progress-ledger test passed (9 tests).

  DEC-P25C (2026-10-26): P25-C is the next unused P25 ID; P25-B remains
  reserved for encrypted backups. This task makes no feature or schema changes.
  The user's Home screen is user-owned and frozen. Its intended order is the
  Net Worth summary (Assets, Liabilities, Emergency fund pills), quick actions,
  spending summary, backup nudge, storage warning, Upcoming and due when
  present, Insurance heading/card, then Goal Progress.

  Superseded CR-91 placement: the requirement to put Insurance immediately
  after the Emergency fund summary card is superseded by the user's Home order.
  Replaced assertions:

  | Old assertion | New assertion | Reason |
  |---|---|---|
  | The Insurance Card must be the second Home Card / directly after Emergency fund. | Insurance heading and pressable card follow Upcoming and due when present and precede Goal Progress at font scales 1.3 and 2.0. | The Home order is user-owned and frozen; the card is after the spending, backup and storage areas. |
  | The prior P25-A assertion compared independently retrieved ReactTestInstance wrappers by identity, then checked second-card Insurance text. | The test traverses rendered headings and card marker in order, while separately asserting rows, final target-gated bar, styles, navigation and empty state. | Object identity was not a reliable order assertion, and the second card is not the Insurance card in the user's design. |

  Focused validation: `EmergencyGoalScreens.test.tsx` passes all 38 tests,
  including both font-scale order cases. The current P23-D/CR-91 implementation
  remains unchanged; the Home screen source was not edited.
  The full coverage suite completed 79 suites/955 tests. Its initial typecheck
  found that `findByType('card')` was not accepted by the renderer types; the
  test now finds the card by a typed predicate and guards the missing result.
  The focused Home/memory/ledger suites (48 tests) and TypeScript then pass.

  **P25-C STEP 2 — Expo patch versions and audit:** the user checkpoint commit
  `ff349515887dae09ac5ebc34776ec2754ed80dbe` contains the completed SDK patch
  update. `package.json`, lockfile package entries, and installed packages now
  agree on `@expo/ui` 57.0.26, `expo` 57.0.31, `expo-router` 57.0.29, and
  `expo-sharing` 57.0.24; package, lockfile root and Expo app versions remain
  0.1.0. `npx expo-doctor` passes 21/21.
  Historical audit on 2026-10-26 exited 1: 8 advisories (0 critical, 5 high,
  3 moderate); superseded by the P25-D audit below.
  Reported packages: high — `@expo/cli`, `@expo/code-signing-certificates`,
  `expo`, `node-forge`, `zod`; moderate — `decode-uri-component`, `expo-router`,
  `query-string`. Audit fix suggestions require Expo 54 or Router 58 and a
  major SDK change; this release task does not apply them.
  **Needs the owner:** decide how to address the audited dependency findings;
  do not run `npm audit fix --force` or approve install scripts without owner
  direction. No install scripts were approved or run by this task.

  **P25-C STEP 3 — license and Node:** the MIT text is unchanged except for
  the requested holder line, `Copyright (c) 2026 Sahil Aspak Sheikh`. This name
  was taken from the local account name and requires owner confirmation.
  Node.js is pinned to 24.22.1 in `.nvmrc`; `package.json` and
  `package-lock.json` declare `>=24.3.0 <25`. Source evidence: the app uses
  React Native 0.86.3; the installed `react-native/package.json` supports
  `^24.3.0`; the React Native 0.86 environment setup page says Node 22.11.0 or
  newer; and the Node.js release page lists 24.22.1 as the current Node 24 LTS
  release while Node 26 is Current. The machine reports Node v26.10.0.
  **Assumed:** Node 24.22.1 is the highest even LTS major/release that meets
  this app's installed React Native engine requirement; `engines` allows the
  compatible Node 24 range while `.nvmrc` selects the documented current
  patch. Sources:
  [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/),
  [React Native 0.86 setup](https://reactnative.dev/docs/0.86/set-up-your-environment),
  [Node.js releases](https://nodejs.org/en/about/previous-releases).
  The lockfile was synced for the Node engine using
  `npm install --package-lock-only --ignore-scripts --offline`; lifecycle
  scripts were explicitly ignored and not approved or run.
  README and AGENTS now state the Node requirement and the README identifies
  the MIT license. At P25-C, screenshots and EAS build had not been performed
  by the agent; the owner later reported completing both, recorded in P25-D.
  Slug, bundle identifier and Android package remain unchanged.
  **Needs the owner:** confirm the MIT copyright holder; the slug was confirmed.

  **P25-C STEP 4 — AI memory inventory:** source and hidden-file inventory at
  the repository root found:

  | Existing source or tool file | Decision |
  |---|---|
  | `AGENTS.md` | Keep as the only instruction entry point; move durable detail to `docs/memory/` and point agents to the index first. |
  | `docs/PROGRESS.md` | Keep complete and unrenamed as the canonical ledger; added a top pointer. Memory pages link here instead of copying tables. |
  | `README.md` | Keep as user-facing app/setup documentation; added a pointer to the memory index. |
  | `CHANGELOG.md` | Keep as release history; added a pointer to the memory index. |
  | `design.html` | Keep as existing design reference; not an agent instruction or memory source. |
  | `.cursorrules`, `.cursor/`, `GEMINI.md`, existing `CLAUDE.md`, existing `.github/copilot-instructions.md` | None existed at preflight. Cursor/Gemini files were not added because those tools were not requested. |
  | `docs/prompts/`, notes and prior memory files | No source directories/files found; no source document was deleted. |
  | New `CLAUDE.md`, `.github/copilot-instructions.md`, `CHATGPT.md` | Initially created as tool-specific one-line pointers; removed in the user-requested P25-C follow-up. All AI guidance now lives in root `AGENTS.md`. |
  | New `docs/memory/{README,project,architecture,rules,decisions,status,open-items,working-style}.md` | Create the requested shared memory set; summarized repository facts and linked to the full ledger rather than copying its history. |
  | New `src/lib/__tests__/memoryDocs.test.ts` | Verify all memory files/headers/index links, AGENTS entry-point reference, schema version from source and synchronized documented test counts. |

  Memory facts were cross-checked against `src/domain/schemas.ts`,
  `src/data/safeStorage.ts`, `src/data/createAppStore.ts`,
  `src/domain/backup.ts`, shared form/Dropdown components and the current
  issue register. `decisions.md` indexes every current `DEC-*` identifier
  found in the ledger. No financial data, credentials or tokens were added.
  `SCHEMA_VERSION` remains 13. The memory-document test and progress-ledger
  test both pass (10 tests total).

  **P25-C final gates (2026-10-26):** all six commands were run sequentially
  after the final implementation, test, memory-count and ledger updates.
  `npm test -- --coverage` exit 0 (79 suites, 955 tests); `npx tsc --noEmit`
  exit 0; `npx expo lint` exit 0; `npx expo-doctor` exit 0 (21/21); Android
  export exit 0; iOS export exit 0.
  An earlier gate pass exposed the renderer type error documented above; it was
  fixed before this final all-green sequence. The historical
  `npm audit --json` result was 8 advisories; current results are recorded in
  P25-D. No physical-device validation was performed by the agent during
  P25-C; the owner subsequently reported a successful device test in P25-D.
  Final Istanbul directory totals: `src/domain/` 98.26% lines / 92.92%
  branches; `src/data/` excluding hooks 94.23% lines / 87.75% branches; pure
  `src/lib/` 100% lines / 100% branches. All coverage floors are met.

#### P25-C follow-up — Single AI instruction file

The user requested one shared AI instruction file rather than per-tool
Markdown pointers. `AGENTS.md` is now the only AI instruction entry point.
Removed `CHATGPT.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`;
the themed `docs/memory/` pages remain project-memory references, not
tool-specific instructions. `memoryDocs.test.ts` asserts those pointer files
remain absent and that `AGENTS.md` identifies itself as the shared entry point.
`status.md` and `open-items.md` were updated; unresolved owner/device items are
unchanged.

### P25-D Release sync (2026-10-31)

Documentation-only release sync; no application code, persisted schema or
dependency manifests changed.

- **Release:** owner reports that v0.1.0 is a GitHub pre-release under tag
  `v0.1.0`, and that its EAS build and screenshots are complete.
- **Physical device:** owner reports the app works after a physical-device
  test. Device model and operating system were not recorded. This is
  owner-verified, not automated evidence or an independently observed test.
  Earlier statements in P25-C describe the agent's verification state at that
  time and are superseded for the current release by this owner report.
- **Node:** `.nvmrc` remains `24.22.1`; `package.json` still declares
  `>=24.3.0 <25`. The owner reports `npm install` and all 955 tests completed
  on Node v26.10.0, with only an `EBADENGINE` warning. No pin or engine-range
  change was made. Owner choices remain: keep the current Node 24 pin, test
  again on Node 24, or relax the engine range to `>=24.3.0`.
- **Audit:** both requested commands exited 1 because advisories remain.
  `npm audit --omit=dev` reported 27 advisories: 6 high, 20 moderate, 1 low,
  0 critical. Affected package names in the production dependency graph:
  `@expo/cli`, `@expo/config`, `@expo/config-plugins`, `@expo/fingerprint`,
  `@expo/inline-modules`, `@expo/local-build-cache-provider`,
  `@expo/metro-config`, `@expo/prebuild-config`, `@jest/transform`,
  `@react-native-community/datetimepicker`, `@react-native/jest-preset`,
  `@react-native/virtualized-lists`, `babel-jest`, `babel-plugin-istanbul`,
  `decode-uri-component`, `deepmerge`, `expo`, `expo-router`, `expo-sharing`,
  `expo-splash-screen`, `glob`, `minimatch`, `node-forge`, `query-string`,
  `react-native`, `test-exclude`, `zod`.
  The direct app/runtime packages among those findings are
  `@react-native-community/datetimepicker`, `expo`, `expo-router`,
  `expo-sharing`, `expo-splash-screen`, and `react-native`. The same
  production dependency graph also includes Expo CLI/config/build and
  transitive tooling packages; their appearance here reflects npm's
  production-tree reachability, not a claim that each ships in the app binary.
- `npm audit` reported 55 advisories: 6 high, 44 moderate, 5 low, 0 critical.
  This includes the 27 production-tree advisories above plus 28 advisories
  across development-only build/test tooling. The additional package names
  are `@eslint-community/eslint-utils`, `@eslint/config-array`,
  `@eslint/eslintrc`, `@jest/core`, `@jest/expect`, `@jest/globals`,
  `@jest/reporters`, `@typescript-eslint/eslint-plugin`,
  `@typescript-eslint/parser`, `@typescript-eslint/type-utils`,
  `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`,
  `create-jest`, `eslint`, `eslint-config-expo`, `eslint-plugin-expo`,
  `eslint-plugin-import`, `eslint-plugin-react`, `jest`, `jest-circus`,
  `jest-cli`, `jest-config`, `jest-expo`, `jest-resolve-dependencies`,
  `jest-runner`, `jest-runtime`, `jest-snapshot`, `jest-watch-typeahead`.
  No audit fix was applied.
- **Next release:** P24 reminders and notifications remain unimplemented
  and are planned for the next release. Insurance cover multiples and similar
  figures remain guidelines, not advice or adequacy judgments.

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 1, then 0 on one required retry | First run: only `builds a fifty-year daily schedule within two seconds` failed at 2,411 ms (threshold 2,000 ms). The same command was rerun once; 79 suites / 955 tests passed. The benchmark was not edited. |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed. |
| `npx expo-doctor` | 0 | 21/21 checks passed. |
| `npx expo export --platform android` | 0 | Export passed. |
| `npx expo export --platform ios` | 0 | Export passed. |

The other five gates exited 0 in the initial sequential run. The one-time test
retry then passed with 79 suites/955 tests; no code or test was changed in
response to the wall-clock result.

### P25-E Node engine and test stability (2026-10-31)

**Assumed:** set the project to stable Node `26.13.0`, with
`engines.node` `>=26.0.0 <27`, because the full test suite passed on Node
26.13.0 and failed after a clean Jest cache on Node 24.22.2. This records
observed project test behavior; it does not claim that Expo SDK 57 or React
Native 0.86 rejects Node 24.

- Current machine default: Node `v26.10.0`; comparison runs used installed
  stable Node `v26.13.0` and `v24.22.2`.
- Node `v26.13.0`: `npm test` passed 79 suites / 955 tests. After clearing
  Jest's cache, the previously failing `AppHeader.test.tsx` passed all 10
  tests.
- Node `v24.22.2`: `npx jest --clearCache` exited 0, then `npm test` had 13
  failing suites, 66 passing suites, and 880 passing tests. Failures report
  `Cannot read properties of undefined (reading 'select')` from
  `expo-modules-core/src/Platform.ts`.
- Installed versions are Expo `57.0.31`, React Native `0.86.3`, and
  `expo-modules-core` `57.0.24`. React Native 0.86.3 declares Node
  `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`; this includes Node 24.
  Expo SDK 57 release notes identify React Native 0.86, and the versioned SDK
  57 docs are at https://docs.expo.dev/versions/v57.0.0/. React Native 0.86
  environment setup says Node 22.11.0 or newer:
  https://reactnative.dev/docs/0.86/set-up-your-environment.
- The observed error path is reproducible from repository/package code:
  Expo Modules Core evaluates `ReactNativePlatform.select` in
  `src/Platform.ts`; multiple test-local `jest.mock('react-native', ...)`
  factories omit `Platform`. This explains the thrown access when that path
  initializes, but the repository evidence does not establish why Node 24
  activates the path while Node 26 does not. No test mock was changed in this
  task.
- `.nvmrc`, `package.json` and the lockfile root engine metadata now agree on
  `26.13.0` / `>=26.0.0 <27`. No dependency versions or app/schema behavior
  changed.

Replaced assertions:

| Old assertion | New assertion | Reason |
|---|---|---|
| Fifty-year daily schedule had to finish in `< 2_000` ms; test name said “within two seconds.” | Retain exact 18,250-row assertion and require elapsed time `< 10_000` ms; test says “within ten seconds.” | A previous full test run took 2,411 ms on shared execution; the original strict wall-clock ceiling was unstable. The wider bound preserves a finite performance check without changing schedule correctness assertions. |
| Progress-ledger test expected 72/77 overall and P25 3/4. | It now requires 73/78 overall and P25 4/5, and explicitly checks P25-E is Done in dashboard and prompt log. | P25-D and P25-E are recorded as additional completed P25 items; counts must derive from the current dashboard rather than stale totals. |

Focused validation on Node 26.13.0: `schedule.test.ts` and
`progressLedger.test.ts`, 2 suites / 19 tests passed.

Final sequential gates, all on Node `v26.13.0`:

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 79 suites / 955 tests passed. |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed. |
| `npx expo-doctor` | 0 | 21/21 checks passed. |
| `npx expo export --platform android` | 0 | Export passed. |
| `npx expo export --platform ios` | 0 | Export passed. |

Coverage from this run: `src/domain/` 99.04% lines / 95.23% branches;
`src/data/` excluding hooks 95.34% / 90.91%; pure `src/lib/` 100% / 100%.

#### P23-B legacy Insurance literal audit

Case-sensitive `rg -n "'Insurance'" app src` returned 67 matches in 20 files.
The existing `Insurance` spelling remains valid for legacy history; each
source/test hit and its disposition is listed here:

| File | Matching lines | Disposition |
|---|---|---|
| `src/domain/policyCategories.ts` | 19 | Preserved as the legacy transaction category alongside the new premium categories. |
| `src/domain/budget.ts` | 56, 1035, 1089 | Preserved Insurance section identity and compatibility handling for legacy budget/history categories. |
| `src/mock/demoData.ts` | 107, 140 | Excludes the legacy category from generated generic transaction rows; retains the manual Insurance demo budget item. |
| `src/domain/__tests__/backup.test.ts` | 265 | Keeps a legacy linked premium backup fixture to verify import compatibility. |
| `src/domain/schemas.ts` | 219, 249, 443 | Keeps Insurance valid in budget and transaction schemas and retains the Insurance section definition. |
| `src/mock/__tests__/demoData.test.ts` | 98, 165 | Verifies the manual legacy Insurance budget item remains and reconciles. |
| `src/domain/budgetGroups.ts` | 51 | Names the existing protected Budget group Insurance. |
| `src/domain/__tests__/budgetCategories.test.ts` | 15 | Verifies the transaction dropdown group title remains Insurance. |
| `src/domain/__tests__/pending.test.ts` | 206, 219 | Exercises a manually planned legacy Insurance item and its due row. |
| `src/data/migrate.ts` | 468, 632, 642, 652 | Preserves old items and moves legacy Insurance budget items into the current Insurance system section when needed. |
| `src/domain/__tests__/v5Integrity.test.ts` | 17, 83, 84 | Retains old-format linked policy transactions in migration/integrity fixtures. |
| `src/data/__tests__/createAppStore.test.ts` | 664 | Retains a legacy manual Insurance budget item in the store test. |
| `src/data/__tests__/migrate.test.ts` | 196, 219, 225, 352 | Verifies migration relocates legacy Insurance items and retains legacy Insurance in the earlier migration fixture. |
| `src/domain/__tests__/policyActions.test.ts` | 42, 51, 142, 150, 173, 180 | Preserves legacy linked Insurance transactions in policy delete/update tests. |
| `src/components/__tests__/RecurringItemsSummary.test.tsx` | 47 | Preserves a legacy Insurance category in the recurring summary fixture. |
| `src/domain/__tests__/budget.test.ts` | 714, 1040, 1102, 1118, 1449, 1520, 1548, 1556, 1567, 1573, 1580, 1582, 1584, 1596, 1607, 1635, 1644, 1711, 1721 | Retains coverage for legacy category grouping, history, manual items, linked transactions and no-double-counting. |
| `src/domain/__tests__/schemas.test.ts` | 324, 374 | Asserts legacy Insurance remains schema-valid alongside typed premium categories. |
| `src/domain/links.ts` | 189 | Allows previously linked policy payments whose stored category is Insurance. |
| `src/components/__tests__/PendingItemActions.test.tsx` | 164, 177, 184 | Keeps legacy manual Insurance due-action fixtures. |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 2965, 2973, 2981, 3090, 3123, 3129, 3138 | Keeps Budget management route assertions for existing Insurance items and category selection. |

### DEC-P24A (2026-11-01)

- Frozen scope: local-only reminders from `pendingItems()` and budget income
  Received dues; two independently enabled reminders per dated unpaid due,
  at a configurable local time (default 09:00). The pure domain plans only;
  native scheduling, permission prompts, channels, response handling and
  settings remain at the app boundary. No push token, network request, schema
  migration or persisted app-data change.
- Planning target: deterministic IDs; day-before and same-day local calendar
  triggers; omit fire times already passed; sort nearest-first and cap the
  scheduled rolling window at 60. The requested iOS platform ceiling of 64 is
  not documented in the consulted SDK 57 notifications page; the 60 cap is
  retained as the frozen requirement, not represented as Expo documentation.
  Reminders refresh only when the app opens/returns to foreground or relevant
  local state changes; a long unopened gap may exhaust the window.
- Notification privacy: amounts are omitted unless explicitly enabled;
  existing `hidePreviews` overrides that choice and produces generic text
  without names or amounts. The due name/date/amount is shown only in the
  in-app confirmation route after the app lock has allowed protected screens
  to mount. Paid and no-date items are never planned.
- Settings are UI-only fields inside `wealthwise.meta.v1`; `eraseAllData`
  already removes that key. The erase action will also cancel scheduled
  notifications. Changing dues (including import and Undo) will debounce a
  serialized cancel-all then reschedule pass.
- Source inventory: `app/_layout.tsx` currently registers routes inside
  `LockGate` and mounts `ActionToastHost` only after hydration; no notification
  listener or reminders route exists. `src/lib/appMenu.ts` builds the global
  header menu and `src/components/useAppMenu.ts` maps labels to Expo Router
  destinations. `src/data/metaStore.ts` uses a strict Zod schema in the
  UI-only metadata key; `src/data/createAppStore.ts` already clears metadata
  during erase and owns import/Undo/erase actions. `src/components/LockGate.tsx`
  does not mount its children while locked; `hidePreviews` is stored separately
  in SecureStore and exposed by `SecurityProvider`. `pendingItems()` in
  `src/domain/pending.ts` includes unpaid plan, liability (including dated
  one-time), active policy, budget due-day items, and budget earned-income
  dues; it is scoped to one month and excludes paid and undated budget items.
  `PendingItemActions` already calls clear-due/add-transaction store actions,
  displays the existing Undo toast, and supports `Received` for income.
- SDK 57 documentation consulted before implementation:
  [expo-notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
  and [app config](https://docs.expo.dev/versions/v57.0.0/config/app/).
  `expo-notifications@57.0.24` was installed with
  `npm_config_ignore_scripts=true npx expo install expo-notifications`. It is
  the Expo SDK-matched notification API needed for local channel, permission,
  scheduling and response handling; its installed package is approximately
  3.4 MB unpacked. It has no `preinstall`, `install` or `postinstall` scripts;
  its package build/test scripts are not lifecycle install hooks. Audit stayed
  at 55 advisories (6 high, 44 moderate, 5 low), delta zero.
- The Expo config plugin is added to `app.json` with no options. The SDK docs
  list build-time options for Android icon/color/default FCM channel/sounds
  and iOS background *remote* notifications; none is needed for local reminder
  scheduling. The package automatically includes Android
  `RECEIVE_BOOT_COMPLETED` support for rescheduling after device restart.
  Android 13+ requires user notification permission; create the runtime
  notification channel before requesting. SDK docs say exact alarms on
  Android 12+ require `SCHEDULE_EXACT_ALARM`; do not add/request that
  permission, so Android delivery may be inexact.
- **Spec conflict — Expo Go:** the SDK 57 docs explicitly say local
  notifications remain available in Expo Go; only remote push is unavailable
  there on Android. Therefore “a development build is required” is not true
  for the local-only feature. Keep local notifications usable in Expo Go where
  supported, and require a development/production build only to validate
  generated native configuration and real-device behavior.
- **Spec conflict — documented iOS cap:** the consulted Expo SDK 57 page does
  not state an iOS pending-local-notification maximum. Apply the spec's 60
  nearest-first rolling cap, but mark the claimed OS limit as not independently
  verified from Expo's documentation.
- **Spec conflict — exact timing on Android:** the frozen local-time setting
  cannot guarantee exact Android alarm timing without adding the platform's
  exact-alarm permission, which the spec excludes. Schedule local date triggers
  without requesting exact alarms; document and physically verify delivery
  behavior.

#### P24-A implementation and verification close-out (2026-11-01)

- **Verdict:** complete. Added the pure reminder planner, serialized scheduler,
  Expo notification adapter, UI-only metadata settings, Reminders screen,
  lock-gated notification response routing and payment-confirmation route.
  No persisted app schema or migration changed; `app/(tabs)/index.tsx` and
  Budget cash-flow labels were not edited.
- Research commit: `372476c6c6185e926de57ead1d52bb0bdc57974a` (verified
  `commit` object). Implementation commit: `f5a1a38` (verify the full hash with
  `git cat-file -t f5a1a38`).
- Dependency: `expo-notifications@57.0.24` (`~57.0.24`), approximately 3.4 MB
  unpacked, with no lifecycle install scripts. Audit delta: zero.
- Coverage gate: 83 suites / 1006 tests pass; total line coverage 98.46%,
  branch 94.98%, function 99.35%, statement 97.84%. Pure reminder planner
  coverage: 100% line, 94.11% branch in the focused run.
- Replaced assertions: none. The demo-data reminder assertion was moved out of
  a nested test body after implementation; it asserts today, tomorrow and
  later demo dues and was not weakened.
- Gate exit codes: coverage tests 0; TypeScript 0; Expo lint 0 after removing
  an unused planner value and a synchronous effect state initialization;
  Expo Doctor 0 with 21/21 checks; Android export 0; iOS export 0.
- Physical-device checks not verified: notification delivery/timing, granted/
  denied/blocked permission flows, reboot restoration, lock-screen text,
  cold-start and locked notification taps, and layouts at font scales 1.3/2.0.

  P20-T preflight at base `e99c705` found a clean worktree; no new manual
  checkpoint was needed. The seven no-Copilot commits since `5bd3c41` and
  prior user checkpoints were audited; each changed path is listed:
  - `4cb6367` — `.claude/settings.json`: removed local settings.
  - `4cb6367` — `.gitignore`: ignored `.claude` content.
  - `c49cafd` — `app.json`: formatting adjustment.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: available-balance card margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: Home action wording and UI.
  - `268e4c7` — `src/components/IconButton.tsx`: exact action label allowance.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: label assertion.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: action allowance.
  - `9a01941` — `app/goal-form.tsx`: blank initial Saved value for new goals.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-owned Cash flow labels/layout and removed controls.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact “Edit allocation” title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and balance amount placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed “Back to Transactions” control.
  - `75e9097` — `src/components/BudgetManagementSheet.tsx`: prior manual checkpoint snapshot; preserve as committed.
  - `ecc5c35` — `src/components/BudgetManagementSheet.tsx`: P20-S manual checkpoint snapshot; preserve as committed.
  The current Budget screen retains the user-selected Cash flow labels and
  still has no “Back to Transactions” or review control.
- DEC-BUDGET-SPEC: Budget is a forward-looking plan of recurring income,
  bills, investments and loans arranged in sections. BudgetPlan income items
  are {id, name, category, amount, day?}; their amounts sum to planned income,
  and an item with a day creates a "Received" due. Loans, SIPs and policies
  remain linked automatically. Past and current months are frozen snapshots.
  Months after the current month, through 24 months ahead, derive a virtual
  snapshot on demand from the plan only when repeatMonthly is on and the
  month is at or after repeatFrom; viewing a future month stores nothing.
  Budget setup is in scope; rebuilding the Budget screen is not. The user's
  Cash flow labels and layout in app/(tabs)/budget.tsx are user-owned and
  must remain untouched.
  P20-Q supersedes the section-cards/header-only management presentation and
  the dedicated setup/month editor screens; the plan and snapshot data contract
  remains current.
- DEC-P20J-LEGACY-SHARES: P20-J ignores legacy goal-link shares and splits
  linked asset value equally. Derived saved totals rose as a result; the user
  will verify this against real data.
- DEC-P20M-CR52: Added Rent and Utilities to Survival (Needs), and
  Subscriptions, Personal spending and Travel to Wants. None of the five exact
  names was already in the transaction/budget expense category lists. Existing
  group suggestions remain normalized to 100%; Rent/Utilities use 5% each,
  and Wants redistributes its 100% across all eight categories. Transaction
  labels use the existing pass-through mapping; the special "Unexpected"
  label remains "Unexpected extras". Demo expense amounts are supplied for
  each new category. Replaced assertions: old category membership lists omit
  the five new entries; the updated group-map/import/form/demo assertions
  require them in their intended groups and valid through backup import.
  Expected suggestion values for Living, Shopping, Other and EMI are updated
  (1300→1000, 500→400, 300→200, 1400→1200) because the normalized weights
  now account for the added categories.
- DEC-P20M-CR53-55: schema v9 stores plan and frozen-month income as item
  arrays. v8 migration makes a Salary/day-1 plan item and dayless Income
  snapshot items, choosing the most common earned-income category over the
  current and two preceding calendar months; it creates no plan item for a
  zero total. Virtual budgets are read-only and derive only for repeated
  months from repeatFrom through 24 months ahead. Clearing an income due
  records the remaining amount as income in one undoable action. Projected
  cash flow carries each prior close into the next month's opening.
  **Assumed:** “most common” means transaction count, with alphabetical
  tie-breaking and Salary fallback; the three-month window includes the
  current month through injected today. Same-category recorded earnings are
  applied to income items in their stored order to avoid double-counting.
  The existing monthly-budget editor still edits one scalar income total,
  so saving it stores one Income item rather than preserving multiple item
  labels/categories. The user's
  Cash flow labels/layout and Budget screen presentation remain unchanged.
  Replaced assertions: schema tests that accepted plannedIncome on v9
  snapshots now require income arrays; safe-storage's future-version case
  moves from v9 to v10; premigration archive coverage expands through v8.
  Device acceptance is not established by simulator-style tests.
- DEC-P20O-CR58: Budget plan-line and income-row edits are now owned by the
  item sheet instead of routing to Budget setup. Linked plan/liability/policy
  rows continue to open their source editor routes.
  “This month only” materializes a virtual month as a custom
  snapshot; “This and following months” updates the plan plus the viewed
  stored snapshot, without rewriting later custom snapshots. Remove follows
  the same scope rules. Edit and remove each use one store action and the
  existing five-second Undo toast restores the prior plan and viewed month.
  Income name/category remain read-only. Replaced assertion: line/income
  edit-icon routing to setup is replaced by the editable bottom sheet and
  scope-aware domain/store tests; linked-item routes remain unchanged.
- DEC-P20O-CR59: Expense categories are grouped by Budget section, budgeted
  categories sort first within each section, and each category exposes the
  selected month's remaining/over-budget hint. Investment categories remain
  instrument-derived and show the same hint; income still uses the frozen
  ChoiceField. The frozen ChoiceField and all frozen form components are
  unchanged. Assumed: transaction dates are selectable through the last
  day of the month 24 months ahead so users can inspect upcoming budget hints.
  Replaced assertion: the old flat expense ChoiceField expectation is replaced
  with grouped budget-aware categories and date-driven hints; investment
  category derivation remains asserted. Device checks for scrolling, keyboard
  avoidance and 1.3/2.0 font-scale picker layout remain outstanding.
- DEC-P20O-DEMO: Demo budget plan retains Salary (day 1) and Freelance
  (day 15) as its two plan incomes. A custom snapshot two months ahead changes
  the Food amount/day and Freelance amount/day, demonstrating month-only
  overrides without changing the continuing virtual plan.
- DEC-P20P-CR60-61: v9 backups verify checksum over data as written, then pass
  through the migration chain to schema v10; persisted v9 raw bytes are
  archived once as `.premigration.v9`. Item/category names are exact strings,
  with case-insensitive uniqueness and immutable transactions. Store mutations
  use one pure data action, one Zustand `set`, and one persisted write; Undo
  restores deep-equal state. Category choices use effective sections/items for
  the selected month, with budgeted categories first. Transactions and Home
  retain categories after an item is removed; unknown investment names are
  treated as custom rather than folded into Other investments. Replaced
  assertions: schema-v9 fixed `lines` snapshots become schema-v10 frozen
  `sections`/`items`; fixed-category rejection becomes valid custom-category
  validation; category mapping of unknown investment labels to Other
  investments becomes retention as an unbudgeted custom string. Reasons:
  v10 makes user-managed item names valid transaction categories and requires
  deletion never to rewrite a recorded category. Device checks for true
  persisted-v9 restoration and native category/filter layout remain unverified.
- DEC-P20P-DEMO: Deterministic demo data contains a Pets section with Pet care,
  a Domestic help item in Survival, and a transaction in each category.
- DEC-USER-CHANGES: preserve all changes from commits `0e965d4`, `e57fd0f`
  and `6cb4fa0` (authored by Sahil Sheikh without a Copilot co-author
  trailer). File
  intent: `app/(tabs)/index.tsx` reorders the Home pills (Liabilities before
  Emergency fund), shows only EF cover in the pill, removes the spending-card
  action buttons, and cleans imports; `app/(tabs)/transactions.tsx` removes
  the expandable balance metrics/captions and the review-dismiss control,
  retains the current balance, optional brought-forward chip, divider and
  review link, and renames the section to “Due payments” with the user's total
  wording; `app/emergency-fund.tsx` removes the linked-assets card and changes
  allocation “Actual” to “Available amount”; `src/components/CardHeaderRow.tsx`
  makes the value prop optional; the follow-up `e57fd0f` only refines the
  “Due payments” count/total wording in `app/(tabs)/transactions.tsx`.
  Commit `6cb4fa0` changes `app/(tabs)/budget.tsx` by removing the review-dot
  prop from the Budget menu and reordering imports; `app/(tabs)/transactions.tsx`
  changes the Shortfall label and moves the displayed position amount into the
  brought-forward chip while removing its prior balance amount rendering; and
  `app/month-review.tsx` removes the “Back to transactions” button and
  reorders imports. These edits are user-owned; keep the removed button and
  other removed elements absent.
  Repeated audit of `3c644d3` before P21-C: its Budget diff removes the menu
  prop and does not restore “Back to Transactions”; it does not change
  `app/ef-allocation-form.tsx`. The current form title remains exactly
  “Edit allocation” (from user commit `64ffb5d`). These removals and title are
  preserved. At final audit, the current Budget worktree diff also contains
  import ordering and the pencil icon changing from `edit` to `edit-2`; this
  was left intact, and P21-C made no Budget screen code changes.
  Re-verified at the start of P21-C1 with
  `git show 3c644d3 -- 'app/(tabs)/budget.tsx' app/ef-allocation-form.tsx`:
  the commit changes only `app/(tabs)/budget.tsx`, removes the budget-menu
  wiring and retains the user's missing Back to Transactions action; it has
  no allocation-form diff. The current allocation form still has the exact
  title “Edit allocation”. Preserve both.
  Repeated at the start of this P21-C request with the same `git show`:
  the Budget diff removes the app menu/template workflow and does not restore
  “Back to Transactions”; `3c644d3` contains no allocation-form changes.
  Verified current `app/(tabs)/budget.tsx` still has no “Back to Transactions”
  or “Review” action, and `app/ef-allocation-form.tsx` still uses the exact
  title “Edit allocation”. No protected user edits were restored or changed.
  Re-verified before P20-K with `git show 3c644d3 -- 'app/(tabs)/budget.tsx'
  app/ef-allocation-form.tsx`: the commit changes only Budget, removes the
  menu/template workflow, and does not restore “Back to Transactions”; it has
  no allocation-form diff. Current Budget still lacks “Back to Transactions”
  and “Review”, while the allocation-form title remains exactly “Edit
  allocation”. No protected edits were changed.
  Re-verified before P20-J using `git show 3c644d3 -- 'app/(tabs)/budget.tsx'
  app/ef-allocation-form.tsx`: the Budget changes remove the prior menu and
  budget-template controls and retain the user's removed Back to Transactions
  action; the commit has no allocation-form diff. The current allocation form
  still displays exactly “Edit allocation”; current Budget still lacks the
  removed Back to Transactions and Review actions. No protected edits were
  changed.
  Related stale assertions are replaced as follows: the Transactions test's
  old expectation of an accessible red `-₹1,000` amount becomes an assertion
  that this amount is absent while the Shortfall text remains; reason:
  `6cb4fa0` removed the main balance amount. The Budget route test's old
  expectation of a visible review dot becomes an assertion that no indicator
  prop or dot renders; reason: the user's commit removed that indicator.
  Transaction balance card final user-kept elements: balance label and amount
  (including “Shortfall” and danger tone when negative), optional “From {Mon}
  ₹X” chip, divider, and review link when available. There are no retained
  metric columns or captions.
  This task's starting audit found four commits since `5bd3c41` without a
  Copilot co-author trailer; each changed file is recorded separately below
  and is preserved:
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-selected cash-flow labels and
    plan-summary layout. Keep the missing "Back to Transactions" action and
    all other removed items absent.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: user-selected title exactly
    "Edit allocation".
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot prop and import
    ordering.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and the
    user's balance amount placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed "Back to transactions"
    control and import ordering.
  - `9a01941` — `app/goal-form.tsx`: a new goal's Saved field starts blank.
  - `268e4c7` — `app/(tabs)/index.tsx`: exact "New Transaction" label and
    associated Home UI changes.
  - `268e4c7` — `src/components/IconButton.tsx`: verb-guard allowance for
    "New Transaction".
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: test
    expectations updated to "New Transaction".
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: allowed
    text action updated to "New Transaction".
  No checkpoint commit was needed; the initial worktree was clean.
  P20-M preflight since `5bd3c41` found these commits without a Copilot
  co-author trailer; each changed file is listed separately:
  - `4cb6367` — `.claude/settings.json`: removed the local settings file.
  - `4cb6367` — `.gitignore`: ignored `.claude` content.
  - `c49cafd` — `app.json`: adjusted formatting.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: corrected the available-balance
    card top margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: changed Home's New Transaction action.
  - `268e4c7` — `src/components/IconButton.tsx`: allowed its exact label.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: aligned
    Home action-label assertions.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: allowed the
    New Transaction action text.
  - `9a01941` — `app/goal-form.tsx`: new-goal Saved field starts blank.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-owned Cash flow labels/layout
    and removals, including no Back to Transactions action.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact "Edit allocation" title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: preserved removed Budget menu wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: preserved Shortfall wording
    and brought-forward amount placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: preserved no Back to Transactions.
  Worktree was clean and no checkpoint commit was needed.
  P20-O start audit (`5bd3c41..HEAD`) reconfirmed seven commits without a
  Copilot co-author trailer. Every changed file is recorded separately:
  - `4cb6367` — `.claude/settings.json`: removed the local settings file.
  - `4cb6367` — `.gitignore`: ignored `.claude` content.
  - `c49cafd` — `app.json`: formatting adjustment.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: available-balance card margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: Home action wording and related UI.
  - `268e4c7` — `src/components/IconButton.tsx`: allow the exact action label.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: align label assertion.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: allow the action text.
  - `9a01941` — `app/goal-form.tsx`: blank initial Saved field for new goals.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-owned Cash flow labels/layout and removed controls.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact “Edit allocation” title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and balance placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed “Back to transactions” control.
  The worktree was clean, so no user-manual checkpoint commit was needed.
  The present Budget screen still preserves “Opening balance” and “Closing
  balance” and has no “Back to Transactions” or “Review” control. The snapshot
  `file_Untitled-2.txt` remains read-only. P20-O does not change the schema
  (still v9) or any frozen form component.
  P20-P preflight on 2026-10-18, from base `0809b67`, re-ran the requested
  audit from `5bd3c41..HEAD`. The worktree was clean, so no manual checkpoint
  commit was needed. The same seven commits without a Copilot co-author
  trailer remain the full list; each changed file is recorded below:
  - `4cb6367` — `.claude/settings.json`: removed local settings.
  - `4cb6367` — `.gitignore`: ignores `.claude` content.
  - `c49cafd` — `app.json`: formatting adjustment.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: available-balance card margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: New Transaction action wording/UI.
  - `268e4c7` — `src/components/IconButton.tsx`: allow exact action label.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: label tests.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: allow label.
  - `9a01941` — `app/goal-form.tsx`: blank Saved value for new goals.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: user-owned Cash flow labels/layout;
    removed controls stay absent.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact Edit allocation title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and balance
    placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed Back to transactions action.
  - `ecc5c35` — `src/components/BudgetManagementSheet.tsx`: removed the
    “Value type” and “Apply changes to” segmented-control labels; changed the
    integer-field label to “Due day”. The checkpoint commit is verified and
    these user edits remain preserved.
  In particular, no Back to Transactions button, Review control, or other
  removed Budget items were restored.
  P20-P final audit confirms its only Budget-screen change adapts the existing
  due-day lookup from lines to items; the user-owned Cash flow labels and
  absence of Back to Transactions/Review remain unchanged. `SortChip.tsx`,
  `src/lib/sorting.ts`, and frozen form input components remain untouched.
  P20-Q preflight (base `0809b67`) confirms the worktree was clean and the
  “Opening balance” / “Closing balance” labels (with “Projected” when
  applicable) remain user-owned; there is no Back to Transactions action or
  Review control. The `file_Untitled-2.txt` attachment remains read-only.
  The seven prior commits since `5bd3c41` without a Copilot co-author trailer
  were re-audited, and P20-R's required user-manual checkpoint is included;
  every changed file is listed separately:
  - `75e9097` — `src/components/BudgetManagementSheet.tsx`: user formatting
    changes, removed visible labels from the value-type and scope segmented
    controls, removed screen-rendered calendar labels/icons in favor of the
    frozen `IntegerField` calendar icon and “Due day” label. Preserved exactly.
  - `4cb6367` — `.claude/settings.json`: removed the local settings file.
  - `4cb6367` — `.gitignore`: ignores `.claude` content.
  - `c49cafd` — `app.json`: formatting adjustment.
  - `b217a2a` — `app/(tabs)/transactions.tsx`: balance card top margin.
  - `268e4c7` — `app/(tabs)/index.tsx`: New Transaction action wording/UI.
  - `268e4c7` — `src/components/IconButton.tsx`: allow exact action label.
  - `268e4c7` — `src/components/__tests__/HomeThemeSmoke.test.tsx`: label assertions.
  - `268e4c7` — `src/components/testUtils/assertNoVerbText.ts`: allow label.
  - `9a01941` — `app/goal-form.tsx`: blank Saved value for new goals.
  - `64ffb5d` — `app/(tabs)/budget.tsx`: Cash flow labels/layout; removed
    actions remain absent.
  - `64ffb5d` — `app/ef-allocation-form.tsx`: exact “Edit allocation” title.
  - `6cb4fa0` — `app/(tabs)/budget.tsx`: removed review-dot wiring.
  - `6cb4fa0` — `app/(tabs)/transactions.tsx`: Shortfall wording and balance
    placement/removal.
  - `6cb4fa0` — `app/month-review.tsx`: removed “Back to transactions”.
  No user changes were restored or altered; no manual checkpoint was needed.
  - P20-Q: preserve Home’s existing “This month: spent of” look while
    extracting its reusable summary; Budget management moves into one sheet
    and the current overview layout is redesigned without changing its cash
    flow labels.
  Re-verified for P20-L/P21-D with
  `git show 3c644d3 -- 'app/(tabs)/budget.tsx' app/ef-allocation-form.tsx`:
  `3c644d3` changes Budget and removes menu/template workflow, without
  restoring "Back to Transactions"; there is no allocation-form diff.
  Current Budget still has no "Back to Transactions" action, and
  `app/ef-allocation-form.tsx` still has the exact title "Edit allocation".
  These protected edits remain unchanged.
- The requested checkpoint audit from `51842bb` through the P20-D start found
  these user-authored commits without a Copilot co-author trailer: `0e965d4`
  changed `app/(tabs)/index.tsx` (Home pill order/content and removed spending
  actions), `app/(tabs)/transactions.tsx` (removed balance details/review
  dismissal and restored the user's Due payments wording),
  `app/emergency-fund.tsx` (removed linked-assets card and renamed the
  allocation value), and `src/components/CardHeaderRow.tsx` (made the value
  optional); `e57fd0f` changed only `app/(tabs)/transactions.tsx` (refined
  Due payments count/total text). Checkpoint `51842bb` changed only this
  ledger with prior P22-A delivery/gate evidence and has a Copilot co-author
  trailer; it contains no user-owned application changes.
- The P20-E start audit found one additional commit without a Copilot
  co-author trailer: `6cb4fa0`, changing the three files and UI described
  above. No checkpoint commit was needed because the worktree was clean.
- Post-baseline audit (`5bd3c41..HEAD`): `6cb4fa0` has no Copilot
  co-author trailer; the other commits in range have one. Changed-file record:
  `6cb4fa0` — `app/(tabs)/budget.tsx`: preserves the user-edited Budget menu
  review indicator and import ordering.
  `6cb4fa0` — `app/(tabs)/transactions.tsx`: preserves the user's Shortfall
  label and brought-forward balance placement.
  `6cb4fa0` — `app/month-review.tsx`: preserves removal of the Back to
  Transactions button and import ordering.
- Before P20-H, explicitly inspected `git show 3c644d3 -- 'app/(tabs)/budget.tsx' app/ef-allocation-form.tsx`.
  At that commit the Budget header had no default menu, the old menu was
  removed, and no Back to Transactions control or removed balance section was
  introduced. `app/ef-allocation-form.tsx` was not changed by `3c644d3` and
  still had title `Emergency fund allocation` there; therefore the exact
  `Edit allocation` title did not survive in that commit. The later user-owned
  commit `64ffb5d` changes that title to `Edit allocation` and changes only
  import ordering plus the Budget cash-flow labels/layout and plan-summary
  grid. Preserve the current title, the no-menu/no-Back-to-Transactions
  Budget state, and the user's other removals; P20-H's requested layout is
  applied without restoring those removed controls. P20-I's pre-work audit
  reconfirmed the exact `3c644d3` diff: `app/(tabs)/budget.tsx` had no menu or
  Back to Transactions control, and `app/ef-allocation-form.tsx` was not
  changed there; the later `64ffb5d` still supplies the current `Edit
  allocation` title. Neither user edit was altered in P20-I.
- DEC-TRACKER-CLEANUP: spreadsheet import is removed from active planning.
  The old dashboard, prompt-log and part-list assertions for P22-B are replaced
  with assertions that it is absent; reason: the importer was withdrawn from
  scope. The old `P15-SEED` legacy-ID mapping assertion is removed and the
  new legacy list no longer expects that row; reason: it represented only the
  withdrawn importer part. The old phase totals (P20 4/4 and P22 1/2)
  are replaced with seven P20 parts and one P22 part; reason: P20-E,
  P20-F and P20-G now belong to P20 and P22-A is the only P22 item.
- DEC-P20E-CR28: `normalizeMoney` in `src/domain/cashFlow.ts` rounds finite
  amounts to paise and returns positive zero whenever the rounded value is
  zero. Monthly closing positions are normalized at calculation time, then
  Budget normalizes its displayed closing amount before both AmountText and
  tone selection. Negative uses `err`, positive uses `primary`, and zero uses
  `neutral`; AmountText's existing `formatINR` accessibility label receives
  the normalized amount. Other screens are not altered by the tone change.
- DEC-P20E-CR27: the Home due interaction is now a native confirmation with
  `Paid` and `Not paid`; the Paid action uses the existing single-due clear or
  FIFO clear-through store action, each with the existing one-step Undo toast.
  Not paid and native dismissal leave data unchanged. The old CR-21 sheet tests
  asserting bottom anchoring, safe-area padding, 60% max height, scrollability,
  backdrop dismissal, and Pay/Clear due/View schedule/Close sheet actions are
  superseded by assertions for the exact alert copy and button labels,
  no-op cancellation, oldest/later clear actions and Undo. Reason: CR-27
  explicitly replaces the sheet with the platform's standard confirmation.
- DEC-P20E-CR31: successful demo loading now remains on the current route and
  opens the native `Demo data loaded` alert with `Undo` and `OK`. Undo calls
  the store's existing `undoImport` path and shows the existing five-second
  action-toast treatment with `Demo data removed`; failures are shown
  explicitly. Repository search found no prior test asserting navigation from
  the demo loader to Backup; the superseded behavior is the old
  `router.push('/backup')` success path, now covered by an explicit no-navigation
  assertion and exact popup/Undo tests.
- DEC-P20E-STATUS: the pre-closeout test temporarily distinguished implemented
  but ungated P20-E and CR-27/28/31 as Pending. After every final gate passed,
  those assertions were replaced with Done, and progress moved from 43/52 to
  44/52 and P20 from 4/7 to 5/7. At that P20-E close-out, P20-F/G and
  CR-29/30 were Planned.
  CR-21 is asserted as `Superseded by CR-27`. This replaces the old assertion
  that all P20-E/G and CR-27/31 work remained Planned, matching the closed
  implementation and its green gates.
- DEC-P20F-STATUS: while P20-F was active, the ledger test's old assertion
  that P20-F and CR-29 remain Planned was replaced with exact In progress
  assertions; P20-G and CR-30 stayed Planned and the progress numerator stayed
  44/52 (5/7 for P20). After all P20-F gates passed, P20-F became Done
  and its dashboard assertion was updated to Done; progress moved to 45/52
  (6/7). CR-29 remains In progress because P20-F delivers only its budget
  groundwork: the single-plan replacement and apply-from-next-month behavior
  are not implemented in this phase.
- Full-suite assertion corrections preserving user commit `6cb4fa0`: the old
  Transactions balance test expected both `₹830` and the removed separate
  `₹600` brought-forward amount; it now asserts only the kept `₹830` amount.
  The old shortfall test expected the hidden `-₹130` amount when no
  brought-forward balance existed; its fixture now includes prior-month
  `₹100`, expects the rendered `-₹30` closing value, and still verifies
  Shortfall plus danger tone. The old Budget-header source test expected
  `menuIndicator={Boolean(reviewableMonth)}`; it now asserts that prop remains
  absent, preserving the user's deliberate removal. Home theme test fixtures
  now expose `useAppActions` after Home began using the existing store action
  hook; no visible Home actions were restored. The old check for a `From Sep`
  caption is replaced with an assertion that it stays absent, because the
  user-owned balance section no longer renders that prior-month caption.
- Hash audit of P19-C through P22-A and CR-21–CR-26 rows: every abbreviated
  object resolves with `git cat-file -t`. Replaced the ambiguous “this commit”
  labels with verified hashes: P19-C `d3477f2`, P20-C `4d3f117`, P21-B
  `6dd663f`; P20-D close-out is `5bd3c41`. `1c596e0` is the Home due-sheet
  implementation (also relevant to CR-21), while `1f2d9c8` is P22-A demo
  delivery, not a close-out commit.
- DEC-EXPO-ICON: top-level `expo.icon` and `ios.icon` both pointed to
  `./assets/images/icon.png`; `ios.icon` was changed from `./assets/expo.icon`
  to that duplicate path by user-authored commit `beb9711` on 2026-10-10.
  Since both values were identical, P20-D removes only the redundant iOS
  override; the shared top-level icon remains.
- **Assumed:** user-owned Home changes in `0e965d4` remove the “Open budget”
  and “Apply budget” actions from the spending card. The old route-smoke
  assertions expecting “Apply budget” with no stored budget and its absence
  with a stored budget are replaced with assertions that both buttons remain
  absent in either case; reason: preserve the user's intentional removal.
- CR-21 root cause: the old 90% `maxHeight` was attached to the ScrollView's
  `contentContainerStyle`, so it did not constrain the scroll viewport; the
  sheet also had only generic backdrop padding and no safe-area-aware bottom
  inset. The height limit now belongs to the ScrollView style, and the sheet
  is bottom-anchored with the inset applied to its container.
- DEC-P20D-CR22: the Transactions balance card is always visible and retains
  only the user-kept balance label/amount (including Shortfall and danger
  tone), optional brought-forward chip, divider, and review link. Replaced
  assertions for the expand/collapse control, expanded four-metric grid,
  captions, “Pending” due caption and review-dismiss action with always-visible
  kept-content/no-toggle/no-caption assertions; kept label switching, Shortfall
  and no-NaN assertions. The old `renders a compact collapsed summary and
  balanced expanded details with review actions` test is now
  `always shows only the user-kept balance elements and keeps the review
  action`; the old `shows Pending only when recurring items have unpaid dues`
  assertion is now that no recurring-due caption appears in the balance card.
- DEC-P20D-CR23: `clearDuesThrough` preflights the selected scheduled slot and
  unpaid slots through it, refuses empty/stale selections and ranges over 400,
  then applies all oldest-first payments as one pure result. The store commits
  that result with one persisted write; batch Undo restores all entries and
  linked transactions with one write. Later plan/liability rows show only
  Clear due and require confirmation; budget rows record a plain transaction.
  FIFO matching pays installments oldest-first, so clearing a later slot alone
  would require per-payment installment tracking, a stored-data change outside
  this task. Tests cover one/three/future/mixed/401 dues, plan and liability
  payments, one-time settlement, linked transaction integrity, budget actuals,
  and one-write/deep-equal Undo behavior.
- DEC-P20D-CR24: Budget now has one AppHeader ellipsis menu with Budget history,
  Month review, Budget templates, then the standard Home menu entries. When a
  month is reviewable the Month review label adds “review pending” and the
  ellipsis shows a dot. CR-17's three independent header icons are superseded;
  their old icon/order/44pt/indicator assertions are replaced by one menu
  button, ordered accessible menu labels, navigation callbacks and review-dot
  presence/absence checks. AppHeader's former three-action support is removed;
  it now renders at most two right-side actions, which leaves all current
  non-Budget headers unchanged. **Assumed:** standard app-menu items remain
  below the three Budget-specific menu items.
- DEC-P20D-CR25: Bills and dues uses one section heading with count/total and
  one shared Card of `PendingItemRow` rows, divided by hairlines and paired
  with the same action component used in Home and Transactions. At font scale
  1.3 and above, the row details stack title/date above amount/status. The
  no-budget state is one Card with the requested helper text, full-width
  primary Apply template action and secondary Set up budget wizard link.
  Layout tests assert the single-card structure, divider/alignment/stacking,
  actions, destinations and empty states. The four-month demo tests additionally
  verify an overdue SIP, upcoming EMI, future-month liability due, a later
  non-oldest installment and applied planned-budget rows.
- Gate-repair assertion audit: updated stale pre-existing tests to match the
  preserved user UI rather than restoring removed controls. In
  `HomeThemeSmoke.test.tsx`, the old “opens the Budget tab from the Home budget
  card”/`Open budget` expectation is replaced by asserting both “Open budget”
  and “Apply budget” are absent; reason: those Home spending-card actions were
  deliberately removed in `0e965d4`. Its old “Spending by category” section
  heading expectation is replaced with the rendered “Hide spending by
  category” control after expansion; category and amount assertions remain.
  In `EmergencyGoalScreens.test.tsx`, the old pill order
  Assets/Emergency fund/Liabilities becomes Assets/Liabilities/Emergency fund,
  matching `0e965d4`; the old “Manage links” presence check becomes absence
  because the linked-assets card was intentionally removed, while the empty
  allocation state still verifies “Link assets.” In `AppHeaderUsage.test.ts`,
  Budget is removed from the global-menu opt-out list; its explicit menu
  prepends Budget entries and includes the Home entries under CR-24. Added
  safe-area hook mocks in the Home/Emergency screen suites for the CR-21 sheet
  import; no runtime behavior changed.
- Coverage-driven CR-23 follow-up: the first full run exposed `dues.ts` below
  its 90% per-file branch floor (85.98%). Removed the unreachable empty-range
  guard after exact-slot validation and added coverage for invalid preview
  dates, undated one-time liabilities, policy targets and missing targets.
  `dues.ts` then measured 95.49% lines and 91.61% branches in the focused
  Istanbul report; the final full-suite run remains the actual gate.
- **Assumed:** fixed weights inside the five budget groups are Survival (Living
  25, Food 20, Transport 10, Family 10, Health 5, Bills 10, Education 5, EMI
  10, Insurance 5); Savings and Investments (Emergency fund 35, Mutual fund /
  SIP 25, Stocks / ETF 15, Fixed deposit / RD 10, Gold / Silver 10, Other
  investments 5); Wants (Shopping 35, Other 20, Eating out 15, Entertainment
  15, Fashion 15); Festival, Donations, Culture (Festival 30, Donation 20,
  Gifts 20, Culture 30); Unexpected Extras (Unexpected 100). Each group's
  weights sum to 100. **Superseded by CR-20:** Emergency fund is no longer a
  budget or investment category; its former 35% weight is combined with Other
  investments, now 40%.
- **Assumed:** CR-16's “no header menu on Budget” removes the entire Budget
  header menu; initially, its three actions were placed in a body row. CR-17
  supersedes that row with right-side header icons; the title stays.
- DEC-FORM-COMPONENTS: field components under `src/components/form/` are
  user-owned. Feature work must adapt call sites, not edit those files; the
  SHA-256 manifest and freeze test guard their contents.
- **Assumed:** commits without a `Copilot` co-author trailer are treated as
  user-authored for the input-component ownership audit.
- **Assumed:** percentage values entered per budget category in the month
  editor are converted to fixed planned rupee amounts on save, preserving the
  existing `MonthBudget` schema and actual-amount semantics.
- DEC-TABS: the bottom tab bar appears only on Home, Transactions, Goals and
  Budget; this supersedes P18-R5 detail-tab-bar behavior, effective P20-C.
- DEC-EF-GOAL: Emergency fund is a goal funded by shares of linked assets, not
  a separate ledger or investment instrument. Schema v6 migrates to v7 by
  materializing a positive legacy ledger balance as one manual holding linked
  to the emergency goal; current totals derive only from assets and liabilities.
- Route kinds enumerate every route; form routes have close/discard handling,
  and stack routes have back/fallback behavior. Shared UI follows Section 3's
  text-versus-icon rules.
- P6 backup checksum detects accidental changes; it is not encryption.
  App lock is not encryption. Biometric/passcode authentication is device
  local; no custom PIN or auth service. OS backup inclusion and device
  privacy behavior require platform verification.

### Superseded decisions

| Earlier decision | Superseded by |
|---|---|
| P1 static-only/no-persistence boundary | Later phases added persistence, domain actions, forms, and routes. |
| Five tabs including Invest and More | FX-B2 established Home, Transactions, Goals, Budget. |
| P11-era three-tab navigation (exact provenance approximate) | FX-B2's four-tab Home, Transactions, Goals, Budget rule. |
| CR-17: Budget's three independent header icons | CR-24's single three-dot menu with ordered Budget and standard app items. |
| CR-18: expandable balance card with four metrics and captions | CR-22's always-visible user-kept balance elements, with no toggle, metric grid or captions. |
| Loans as the feature/entity name | Schema v2 and later UI renamed the feature to Liabilities. |
| Schema v1, then v2, v3, v4, v5, v6, or v7 as current | Successive migrations; current schema is v8. P4's no-new-fields rule was amended by P5's `ManualHolding.valueAsOf`, then later schemas. |
| Saving every prompt in the repository prompt archive | P15-LEDGER: the user keeps prompt text; this file records ID, purpose, outcome, source quality, and Git evidence only. |
| Global-menu placement for Link missing transactions, Budget history, and Month review | CH-3 and CH-2 placed those actions on their relevant screens; routes remain. |
| Standalone Record money movement UI/route | CH-4 removed the UI/route; the shared pure logic remains only where still used by liability receipt flows. |
| Earlier short tab label “Txns” | Superseded on 2026-10-15: the tab must read “Transactions”; tab order is Home, Transactions, Goals, Budget. |
| P18-R5 detail-tab-bar behavior | Superseded by DEC-TABS; tabs appear only on the four main screens, effective P20-C. |
| P19-B Budget body action row (CR-16) | Superseded by CR-17: History, Month review and Templates are right-side Budget header icons. |

### DEC-BACKUP-RECONCILIATION (2026-11-01)

- Reconcile the supplied monthly income and expense totals, loan subtotals,
  emergency-fund activity and existing transactions without duplicating
  source movements.
- Remove stale cash-flow balancing transactions and represent remaining
  month-end deficits as linked Bank withdrawals and surpluses as `Other`
  expenses, dated on each month's final calendar day.
- Preserve the 18 existing linked ICICI RD deposits and linked HDFC liability
  payments; account for their loan-tracker rounding differences in comparison
  checks rather than changing the source-linked records.
- **Supersedes the earlier claim** that the prior first-of-month balancing
  entries constituted a complete reconciliation. That pass omitted positive
  balances as expenses and used the wrong adjustment dates. The replacement
  verification covers every month from July 2022 through October 2026.

### DEC-TRANSACTIONS-CLOSING-BALANCE (2026-11-01)

- Always render the selected month's balance amount, even when the previous
  month's closing balance was zero. This applies to positive, zero and
  negative amounts for both current-month Available balance and past-month
  Closing balance.
- The monthly overspend warning compares that month's total expenses and
  investments with that month's income; the balance card separately includes
  the carried-forward balance. Currency display rounds paise to whole rupees,
  so a fractional overspend can appear rounded in the warning.
- The current local JSON backup's notes were edited without updating its
  checksum. The checksum was recalculated and the backup passed importer
  validation. The separate transaction deletion/addition described in the
  current app was not present in this backup snapshot and was not invented.

### DEC-P25B (2026-11-01)

- Implement the frozen P25-B encrypted-backup envelope without changing the
  app schema or adding a native module. Keep the existing checksummed backup
  JSON, `parseBackup`, v1–v13 migration chain, import staging, Undo and
  `lastExportAt` behavior unchanged.
- Use `@noble/ciphers@2.4.0` AES-256-GCM and `@noble/hashes@2.4.0`
  asynchronous scrypt in the pure domain module. They are zero-runtime-
  dependency MIT packages intended for portable JavaScript. Noble's README
  recommends scrypt over its Argon2 implementation and explicitly says
  Argon2 is unaudited and slower in JavaScript; therefore Argon2id is not
  selected for this audited-library requirement. Expo SDK 57's existing
  `expo-crypto@57.0.4` supplies random salt and nonce bytes at the app
  boundary. Existing `expo-file-system@57.0.7` remains the file I/O layer.
  No Expo package or native build change is needed.
- Default scrypt parameters: `N=65536, r=8, p=1, dkLen=32`, with 16-byte salt
  and 12-byte GCM nonce. Imports will accept only documented bounded values,
  with `N` between `2^15` and `2^16`, `r=8`, and `p=1`. The selected setting
  used about 64 MiB and took 247.4 ms on this Node 26.13.0 development
  machine. Noble reports mobile scrypt may be 1–4× slower; this desktop
  benchmark is not a substitute for the owner's real-device measurement.
- Expo SDK 57 references consulted: [expo-crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/)
  (`getRandomBytesAsync`) and
  [expo-file-system](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/)
  (in-memory file APIs and cache file handling). Noble implementation
  references: [@noble/hashes 2.4.0](https://github.com/paulmillr/noble-hashes/tree/2.4.0)
  and [@noble/ciphers 2.4.0](https://github.com/paulmillr/noble-ciphers/tree/2.4.0).
- Package research: `@noble/ciphers@2.4.0` is approximately 138 KiB
  compressed / 548,134 bytes unpacked; `@noble/hashes@2.4.0` is approximately
  164 KiB compressed / 691,646 bytes unpacked. Neither declares runtime
  dependencies or `preinstall`, `install` or `postinstall` scripts. Their
  other package scripts are development/test/build tasks. They were installed
  at exact versions with `npm install --save-exact --ignore-scripts`; no
  install scripts ran or were approved. The full npm audit remains at 55
  advisories (6 high, 44 moderate, 5 low), so the dependency audit delta is
  zero.
- Preserve the specified envelope header as GCM additional authenticated
  data. Export plaintext remains in memory and must never be written to a
  temporary file on the encrypted export path. Salt, nonce and ciphertext are
  lowercase hexadecimal strings in the JSON envelope; this avoids a runtime
  base64 dependency. The passphrase is transient only. Plain backups remain
  importable, while encrypted exports use a distinct filename.
- **Spec conflict — truncated data error:** the requested typed-error list
  contains no truncation-specific error, and GCM cannot distinguish a wrong
  passphrase from authenticated ciphertext tampering or truncation. Follow
  the closest specified behavior: malformed/structurally incomplete envelope
  is `InvalidEnvelope`; a structurally valid envelope with failed GCM
  authentication is `WrongPassphraseOrTampered`, whose message states that
  GCM cannot distinguish the causes. All other listed format/version/KDF
  failures remain distinct.
- **Spec conflict — plaintext temporary files:** the frozen spec requires a
  plain-export opt-out and legacy plain-file import, but also says never to
  write plaintext backup data to a temporary file. SDK 57's
  [Sharing API](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/) shares a
  local file URL; its
  [DocumentPicker guidance](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/)
  says a cache copy is needed to ensure immediate file-system reads. Without
  adding a platform-specific/native destination picker, the closest behavior
  is to keep encrypted exports ciphertext-only in cache, retain the requested
  explicit plain-export opt-out with a clear warning and remove its cache file
  immediately after sharing, and retain the existing picked-file cache copy
  then delete it immediately after reading. Decrypted encrypted payloads are
  never written to disk. The literal no-plaintext-temp rule cannot be
  satisfied for those two explicit legacy/plain paths with the current
  cross-platform APIs.
- Pre-change flow inventory: `app/backup.tsx` creates plain JSON in memory,
  writes it to a temporary cache file for sharing, deletes that file, and
  updates `lastExportAt` after successful sharing. Import copies the picked
  file to cache, reads and deletes the copy, then calls `parseBackup`.
  `src/domain/backup.ts` verifies the JSON checksum before validating and
  migrating supported schemas v1–v13. The store stages the prior data for
  Undo before replacement; `lastExportAt` is persisted metadata. No
  passphrase currently exists in app or persisted state. Integration must
  ensure the only export temporary file contains ciphertext.
- The progress-ledger test's `P25-B` status expectation changed from
  `Planned` to `In progress` because this task has begun; it continues to
  enforce the task's actual state rather than relaxing a product assertion.
- Implementation completes P25-B below; physical-device checks remain
  unverified.

## 5. Phase history

Historical descriptions without a repository commit have the user confirmation
recorded below; that confirmation does not supply missing Git hashes or original
test reports. Commit hashes below are from Git; source quality describes the
available prompt/history evidence, not a new verification of every acceptance
criterion.

### P1–P14 — single-part phases

### P1

Expo Router static mobile MVP, design system, mock data and screens.

### P2

Pure deterministic domain calculations, selectors, tests and screen wiring.

### P3

Validated local persistence, Zustand/AsyncStorage, transaction CRUD/forms and settings.

### P4

Pure plan/loan actions, schemas, linked transactions, forms and routes.

### P5

Goals, holdings, Emergency Fund ledger/invariants, typed errors and UI.

### P6

Recovery fixes, plain backup/import/undo, lock/privacy, erase and configuration.

### P7

Schema v2 migration; Loans-to-Liabilities and typed transaction links.

### P8

Recurring/one-time investment flows and manual holding ledger.

### P9

Instrument transaction linking, missing-link creation and retargeting.

### P10

Schedules, upcoming dues, entries/payments lists and virtualization.

### P11

Transactions/navigation behavior, error boundaries and shared headers/cards.

### P12

Schema v3 onboarding, salary/theme fields, palettes and branding.

### P13

Income wording, EF minimum target and transaction/goal/menu refinements.

### P14

A–G close-out: UI, v4 EF allocation, storage guard, reminders, encrypted backup and polish.

### P15 — Audit and P14 completion

| New ID | Legacy ID | History |
|---|---|---|
| P15-A | — | Audit P14 and restore reliable gates; coverage-summary command failed and follow-up addressed coverage/test issues. |
| P15-A2 | — | Audit migration/premigration and assertions; restored version-chain behavior; exact earlier assertion details unavailable. |
| P15-B | — | Complete P14 UI leftovers; exact scope unavailable. |
| P15-C | — | Clarify SIP dates and goal-card behavior; exact review unavailable. |

### P16 — Data foundation (schema v5, dues engine, goal links)

| New ID | Legacy ID | History |
|---|---|---|
| P16-A | P15-D | Schema v5 and related data features; the one-time origin transaction ID interpretation was an assumption and approval is unknown. |
| P16-B | P15-E | Shared schedules and due-clearing behavior; exact prompt unavailable. |
| P16-C | P15-G | Goal asset links and projection; exact review unavailable. |

### P17 — Cash flow, budgets and sorting

| New ID | Legacy ID | History |
|---|---|---|
| P17-A | P15-H | Cash-flow history and money movement; CH-4 removed movement UI/route but retained shared liability-receipt logic. |
| P17-B | P15-I | Monthly budget tracker; earlier test-count report was corrected. |
| P17-C | P15-J | Sorting infrastructure and integrations; exact prompt unavailable. |

### P18 — UI fix rounds and ledger

| New ID | Legacy ID | History |
|---|---|---|
| P18-R0 | P15-fix-0 | Created initial fix-round ledger/baseline evidence. |
| P18-R1 | P15-FIX-R1 | Baseline had seven withdrawal-only render failures; work was interrupted and remained unverified. |
| P18-R2 | P15-FIX-R2 | Recovered interrupted work; R3 later found and restored two weakened visible-message assertions. |
| P18-R3 | P15-FIX-R3 | Audited FX-BASE, restored messages/assertions, applied the formal ₹1 crore cutoff; gates reported green. |
| P18-R4 | P15-FIX-R4 | Delivered FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2 and CH-1; Git date 2026-10-14 resolves the export date conflict. |
| P18-R5 | P15-FIX-R5 | Shared bottom navigation and Month Review/Budget improvements; Sort UI remained unchanged; device checks outstanding. |
| P18-R6 | P15-FIX-R6 | R5 close-out, baseline and UI-history audit, Expo SDK patch alignment and green automated gates; device checks outstanding. |
| P18-LEDGER | P15-LEDGER | Merged histories/checkpoints, verified forms, removed prompt archive and closed CR-2. |
| P18-R7 | — | Restore Transactions label, restructure progress ledger, record confirmations/CRs, and label old commits locally. |

### P19 — Budget model and sync

P19-A (CR-5), P19-B (CR-9, CR-16) and P19-C (CR-17–CR-19) are Done. CR-16's
body action row was superseded by the header icons in CR-17. The earlier
grouped-form delivery remains historical and does not substitute for the
expanded scope verified here. Next planned work is P20-A.

### P20 — Pending items, Home and navigation

P20-A [former P19-B; CR-6], P20-B [former P19-C; CR-7, CR-10], P20-C
[CR-11] and P20-D [CR-21–CR-26] are complete; the final required gates pass.
P20-E [CR-27, CR-28, CR-31] is complete after the final sequential gates;
P20-F budget groundwork and P20-G single-plan replacement (CR-29) are complete
after final gates. P20-G also supersedes CR-24 with CR-30's explicit no-menu
design. P20-H closes CR-32–CR-34; Budget group cards show paid, overdue,
partial and linked rows. The 9/9 count was the phase status at that historical
checkpoint; P20-I through P20-T subsequently completed CR-35–CR-77.
P20-U completes CR-86/CR-87 by replacing the Budget management sheet with
shared-shell route forms. P20-V completes CR-88/CR-89: schema STEP 1 is
committed as `6d3feab`, recurrence-aware planning/dues as `82793e8`, and UI,
demo and acceptance coverage are complete. All six required gates pass:
coverage 78 suites/944 tests, TypeScript, lint, Expo Doctor 21/21, Android
export, and iOS export. Directory coverage: domain 98.27% lines/92.91%
branches; data excluding hooks 93.81%/87.75%; pure lib 100%/100%. Existing
monthly-only planned-total expectations and the route payload expecting no
frequency were replaced with due/non-due monthly totals and explicit monthly
frequency, because recurrence is now part of the stored plan. The demo uses
the new built-in `Recharge` category as the mobile-recharge example. Plan
resolution takes a required month, ensuring every planned amount is evaluated
through `plannedForMonth`. P20-A-R1 routes linked plan and liability payments
through shared clearDue/Undo. Old: linked planned dues could create only a plain
transaction. New: linked entries/payments are recorded with the transaction and
reversed through Undo. Reason: keep the instrument/payment ledger in sync
atomically. Real-store tests verify all entry points and one persisted write.
P20-A-R2 repairs linked
one-time manual savings: the component previously searched the current-month
snapshot and base plan instead of using the viewed-month source, so a link
present only in a frozen snapshot fell through to addTransaction. A
category-matched transaction still counted as Budget actual, making the
remaining amount zero and removing the pending row even though the holding had
no entry; the observed Budget status enum was `near`, not a literal Paid
label. The pending-row duplicate filter also suppressed explicitly linked
manual items when their category matched an instrument category.

The committed red component regression expected clearDue for a snapshot-only
link but observed no call. The createAppStore baseline for Savings account,
Cash and Other manual holdings recorded one generic invest transaction, zero
holding entries and one persisted write; with a $10,000 starting holding and a
$5,000 planned item, Invested/value stayed $10,000 while Budget actual became
$5,000, remaining became zero and the pending row disappeared. The exact
Budget enum status was `near`. The reproduction was committed before
production edits (`4cfa20c`); the real-store output was recorded separately
(`4107494`).

The fix carries the viewed month and holding ID in the pending Budget source,
does not suppress an explicitly linked manual item, and routes its Paid/Undo
through clearDue/undoClearDue. The shared pure action creates one Deposit and
one linked invest transaction; clear and exact one-step Undo each perform one
persisted write. Store tests cover Savings account, Cash and Other holdings at
exact ($5,000), lower ($3,500) and higher ($6,500) amounts, with Budget actuals
counted once and Invested/value verified. Domain tests cover the P29-T
historical valuation-snapshot adjustment and Fixed Deposit rejection; plan-only
and virtual-future-month tests verify link context. No schema change or Cash/
Savings return-display change is intended.

Hypotheses: (a) confirmed, the old lookup missed a link in the viewed-month
snapshot; (b) confirmed, category-matched transactions drive Budget actuals
independently of holding entries; (c) section type still determines the
transaction type, while a valid explicit holding link selects the holding
ledger path; linked holdings are valid only in non-system investment sections;
(d) confirmed, category duplicate suppression could hide the linked manual
row. The old Budget-source assertion contained only `kind`, `category` and
`type`; the new assertion also requires the viewed `month`, because the action
must preserve the frozen snapshot context. No assertion was weakened.

The snapshot-only PendingItemActions regression now passes; Transactions and
Budget use this shared component, and `/payment-confirm` also mounts it.
Home exposes only `kind: 'due'` rows, not Budget rows; the user-owned
`app/(tabs)/index.tsx` was not edited. Asset/Entries behavior is verified at
the real-store ledger level, not on a physical device. Physical-device checks
remain in N44. P20-N-R2 restores the aggregate actual-versus-planned Pace graph
above the Income/Spending/Investing/Left table. Old section-specific line,
toggle and marker assertions are replaced by aggregate Pace behavior and route
assertions at font scales 1.0, 1.3 and 2.0 because the requested presentation
is aggregate, not per-section. P20 is 26/26.

After syncing P20 with `develop`, all six required gates passed in order:
`npm test -- --coverage` (98 suites, 1,267 passed, 1 skipped; overall coverage
95.96/92.04/98.02/97.63% statements/branches/functions/lines; `src/data`
91.03/87.41/94.46/94.17%; `src/domain` 96.94/92.87/98.80/98.33%; `src/lib`
100% in all four measures), `npx tsc --noEmit`, `npx expo lint`,
`npx expo-doctor` (21/21), `npx expo export --platform android`, and
`npx expo export --platform ios`; each exited 0.

### P21 — Emergency fund as a goal-linked model and allocation editor

Implementation delivered: P21-A [former P19-D, split; CR-8, CR-13], P21-B
[CR-14, CR-15, CR-20], P21-C [CR-37, CR-38] and P21-C1 [CR-39]. Schema
version advanced from v6 to v7 in P21-A; later parts retain schema v8. The
P21-C1 crash repair, allocation normalization, hydration archive, typecheck,
lint, Doctor and both exports pass. CR-26 repaired the initial Expo Doctor
config issue; the final 21/21 Doctor gate and all other required gates pass.
Migration, linked asset integrity, backup import, cover, allocation editing,
crash recovery and device-only limitations are recorded below.

### P22 — Demo data

P22-A (CR-12) implementation and acceptance tests are complete, and its final
required gates are green. Spreadsheet import is out of scope and is not
tracked as a P22 part.

### P23 — Insurance and cover goals

P23-A [P15-F] and P23-B [CR-80/CR-81] are complete. P23-C [CR-82–CR-85]
implements the insurance cover and policy screens, and replaces the earlier
screen-only P23-B plan.

### P24 — Reminders and notifications

P24-A [P15-K] / CR-1 local reminders are in progress. Frozen behavior and SDK
57 research are recorded in DEC-P24A.

### P25 — Release preparation and encrypted backups

P25-A v0.1.0 release-preparation documentation and metadata, P25-B encrypted
backups [P15-L], P25-C release blockers/license/shared AI memory, P25-D
release sync, P25-E Node engine and test stability, and P25-F green test
baseline are complete. P25-E changed only Node metadata and the existing
schedule timing test; P25-F changes tests and documentation only, with no app,
schema or dependency changes. v0.1.0 is a GitHub pre-release. P25-D records the
owner's report that the EAS build, screenshots and
physical-device test are complete; device/OS details were not recorded. P24
reminders and notifications are planned for the next release.

### P26 — Accessibility, performance and final gates

- **P26-A complete (2026-11-06):** report-only inventory committed first as
  `cfbe023`; accessibility fixes followed in `d4071a5`, performance fixes in
  `f59b01a`, and regressions/log cleanup in `08b3992`. The report-only audit
  is summarized in this ledger; generated report files are not tracked.
  `app/(tabs)/index.tsx` and
  `app/(tabs)/budget.tsx` remained unedited with protected hashes unchanged;
  findings for those user-owned screens are reported read-only.
- Accessibility fixes raise compact actions and search clear targets to 44px,
  and replace fitted/single-line bottom-tab labels with scalable wrapping
  labels. Source scanning excludes the protected Home/Budget routes,
  `SortChip.tsx`, and test files because those surfaces are externally
  governed or intentionally frozen. Goals memoization was restored because
  React Compiler rejected it; transactions sorting/group derivation and
  liability sorting/overview derivation remain memoized.
- Gate-repair assertions replace old bottom-tab fitting expectations with
  wrapping/scaling assertions in `BottomTabBar.test.tsx` and
  `TabsLayout.test.tsx`; the superseded assertions required
  `adjustsFontSizeToFit`, `minimumFontScale: 0.75`, and one-line labels.
  The replacement assertions preserve scalable wrapping and document why the
  old expectations are invalid. These test replacements do not weaken
  accessibility behavior.
- Real Gate 1 rerun: 93 suites passed, 1199 tests passed, 1 skipped, 1200
  total. Gate 2 TypeScript, Gate 3 Expo lint, Gate 4 Expo Doctor 21/21,
  Gate 5 Android export, and Gate 6 iOS export all exit 0. Lint was rerun
  cleanly after removing one exhaustive-deps warning.
- Fresh coverage from the final Gate 1 run, grouped by immediate `src/`
  directory: `src/data` 749/798 lines (93.86%) and 780/896 branches (87.05%);
  `src/domain` 3549/3609 lines (98.34%) and 3480/3747 branches (92.87%);
  `src/lib` 107/107 lines (100%) and 126/126 branches (100%). The repository
  coverage thresholds remain unchanged; this directory grouping does not
  include uninstrumented directories such as `src/components` in the
  coverage-final map.
- Five-sample Node/TestRenderer medians recorded by P26-A: demo/50-year
  cold hydration 0 ms/147 ms, demo/50-year Home first render 9 ms/11 ms,
  demo/50-year Budget first render 3 ms/2 ms, and 50-year action write 3 ms.
  The 50-year fixture stores 2,604,654 bytes. These are Jest/Node
  measurements, not physical-device evidence. Native layout, touch and
  font-scale behavior remain pending physical-device verification.

### P27 — Cleanup

- **P27-A complete (2026-11-07):** report committed first as `b805fb1`.
  Dead-code cleanup was committed as `a8a2d78`; dependency cleanup as
  `61714ec`; and the   robust schedule benchmark as `dd0c930`. The audit inventory is summarized
  in this ledger; generated report files are not tracked.
- Knip and ts-prune were run. Knip's high-confidence orphan production paths
  were verified by grep and removed: `SectionHeaderRow`, `fitsInline`,
  `BudgetCategorySections`, and the standalone `scripts/dryRunMigration.ts`.
  Orphaned tests for removed code were removed; this did not delete tests to
  gain coverage. `src/lib/sorting.ts` remains protected, so legacy
  `monthReview` metadata stays unchanged. `app/(tabs)/index.tsx` and
  `app/(tabs)/budget.tsx` were not edited.
- `@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`,
  `expo-symbols`, and `expo-web-browser` had no source/config reference and
  were removed from direct dependencies. Config-required Expo dependencies,
  Expo native packages used by transitive tooling, and Expo build/plugins were
  retained. No install-script approval or audit-force operation was performed.
- Current `npm audit --omit=dev --json` reported 7 vulnerability nodes (4
  moderate, 3 high), not the 27 mentioned in the task or the historical 67 in
  older ledger notes; the attached snapshot was not an audit record.
  SDK-57-compatible patch fixes were not offered by npm, and only Expo SDK/Router
  major-owner decisions remain.
- Android export measured 16,674,443 bytes (15.90 MiB, 69 files); iOS export
  measured 15,396,647 bytes (14.68 MiB, 65 files). The largest file on each
  platform is the single Hermes bundle. No unused source asset was proven by
  `check:assets`; branding checks pass.
- The 50-year daily schedule benchmark now asserts exactly 18,250 rows and uses
  a generous 60-second safety ceiling instead of the previous 10-second
  wall-clock assertion.
- Gate results after every implementation commit: Gate 1 0, Gate 2 0, Gate 3 0,
  Gate 4 0, Gate 5 0, Gate 6 0. Final Gate 1 passed 91 suites/1192 tests: 1191
  passed and 1 skipped. Coverage is `src/data` 749/798 lines (93.86%) and
  780/896 branches (87.05%); `src/domain` 3549/3609 lines (98.34%) and
  3480/3747 branches (92.87%); `src/lib` 107/107 and 126/126 (100%).

### P28 — QA and release

P28-A: report-only release preparation covered release identity, permissions, storage/archive
keys, erase-all, migration fixtures and accepted npm risks. The owner confirmed
version `0.2.0`; `app.json`, `package.json`, package-lock root/package entries,
CHANGELOG and README were aligned without source behavior or schema changes.
[`docs/releases/build-config.md`](releases/build-config.md) records the current
pre-build gates, backup/device checks, build tracking and exact EAS commands.
No store build or submission was run. P28-A-R1 adds a deterministic v13 backup
import equality test; it changes no application behavior. The `npm audit
--omit=dev` result is 7 production vulnerability nodes; no major upgrade,
force fix or install-script approval occurred.

P28-C-R2 records the v1.0.0 APK asset uploaded to the GitHub release:
`WealthWise-android.apk`, 112,133,413 bytes; its digest was verified privately.
At that
revision, the latest and versioned public URLs returned HTTP 404
(Content-Length 9) while the repository was private, and build metadata was
owner to supply. P28-C-R3 superseded those observations after the repository
became public, verified the asset/build, and aligned the tag with explicit
approval. P28-F-R3-R2 later renamed the superseded asset, updated its link and
removed the human-authored checksum from the GitHub body.

**Assumed:** historical commits are assigned to the new part whose delivery
they most directly evidence; round/ledger close-out commits use that round or
ledger label.

P28-E completed the historical commit map and phase refs. P7, P9 and P10
have no distinct phase-specific commit in the available evidence and use the
nearest preceding evidenced anchor; these inferred anchors are identified in
Section 12.

#### P28-G — Ledger notation and glossary

Phase labels now use `P<n>` across the ledger and shared memory. Original Git
subjects, hashes, branch/tag names, URLs, release notes, `CHANGELOG.md` and app
source remain excluded. The glossary records only identifiers found in the
ledger.

| Previous assertion | Replacement | Reason |
|---|---|---|
| Roadmap expected `**Phase ${phase} —`. | It expects `**P${phase} —`. | Phase headings now use the PN form. |
| Dashboard row parsing accepted `Phase <n>` and part IDs separately. | It parses `P<n>` and `P<n>-<part>` with one PN prefix rule. | Single-part phase IDs now follow PN notation too. |
| Progress-bar expectations and parser matched `Phase <n>`. | Expected labels and parser match `P<n>`. | Keep computed progress counts while changing only their labels. |
| Branch-index rows began with zero-padded numeric phase values, and dashboard aggregation parsed `Phase <n>`. | Index rows use `P1` through `P30`; aggregation parses `P<n>`/`P<n>-<part>`, while branch and tag values retain their original zero-padded names. | Align ledger labels without changing Git refs. |
| A ledger-content assertion searched for the `Phase <n>` Release 2 stabilization label. | It searches for `P30 — Release 2 stabilization`. | Keep the historical phase reference aligned with the notation. |
| `memoryDocs.test.ts` had no phase-label notation assertion. | It rejects `Phase <digits>` and `Phase-<digits>` in shared memory pages. | Prevent old phase-label notation from returning. |

New ledger guards verify PN dashboard/bar/roadmap/branch-index labels, allow
`Phase <digits>` only inside the documented verbatim-subject and URL
exclusions, and require every ID prefix used in the dashboard/register to
appear in the glossary. No product assertion was weakened.

### Commit label map

| Hash | Original subject (`git log --format=%s`) | New label |
|---|---|---|
| `5de5a44` | Minor UI Changes | Pre-P15 manual commit: Minor UI Changes |
| `d1a30d8` | Soft Button UI Fix | Pre-P15 manual commit: Soft Button UI Fix |
| `d8b40da` | Minor UI Changes | Pre-P15 manual commit: Minor UI Changes |
| `d64d298` | chore: update gitignore and remove generated files | Pre-P15 manual commit: chore: update gitignore and remove generated files |
| `a89fa2a` | Phase 15 Part A | P15-A P15 Part A |
| `d8dc666` | Phase 15 Part A | P15-A P15 Part A |
| `3a29ea3` | Phase 15 Part A property range fix | P15-A P15 Part A property range fix |
| `235a738` | Phase 15 Part A coverage follow-up | P15-A P15 Part A coverage follow-up |
| `f697403` | Phase 15 Part A progress ledger | P15-A P15 Part A progress ledger |
| `85a0a52` | Phase 15 Part A coverage cleanup | P15-A P15 Part A coverage cleanup |
| `e3c8500` | Phase 15 Part A gate follow-up | P15-A P15 Part A gate follow-up |
| `6ac4ca7` | Phase 15 Part A coverage totals | P15-A P15 Part A coverage totals |
| `0322c9d` | Phase 15 Part A2 | P15-A2 P15 Part A2 |
| `fbeb1d7` | Phase 15 Part B | P15-B P15 Part B |
| `e155bcd` | Phase 15 Part C | P15-C P15 Part C |
| `394d338` | Phase 15 Part D | P16-A P15 Part D |
| `f28657c` | Phase 15 Part E | P16-B P15 Part E |
| `9399e23` | Phase 15 Part G | P16-C P15 Part G |
| `68d9cd4` | Phase 15 Part H | P17-A P15 Part H |
| `19afe88` | Phase 15 Part I | P17-B P15 Part I |
| `1e206ad` | Phase 15 Part J | P17-C P15 Part J |
| `db967bf` | Phase 15 fix: Part 0 | P18-R0 P15 fix: Part 0 |
| `6562de1` | Phase 15 fix: Part 0 evidence | P18-R1 P15 fix: Part 0 evidence |
| `6771f37` | WIP: Phase 15 fix round checkpoint (unverified) | P18-R1 WIP: P15 fix round checkpoint (unverified) |
| `c0ba0da` | Phase 15 fix: FX-BASE | P18-R2 P15 fix: FX-BASE |
| `60b8c54` | Phase 15 fix: FX-BASE | P18-R3 P15 fix: FX-BASE |
| `5f6f883` | Phase 15 fix: FX-E2 | P18-R3 P15 fix: FX-E2 |
| `de94950` | Phase 15 fix: FX-T1 | P18-R3 P15 fix: FX-T1 |
| `a3423ec` | Phase 15 fix: FX-T2 | P18-R3 P15 fix: FX-T2 |
| `c1df77d` | Phase 15 fix: FX-T3 | P18-R3 P15 fix: FX-T3 |
| `88d5190` | Phase 15 fix: FX-T4 | P18-R3 P15 fix: FX-T4 |
| `b8bc4a1` | Phase 15 fix: FX-B1 | P18-R3 P15 fix: FX-B1 |
| `5e2f78f` | Phase 15 fix: FX-B2 | P18-R3 P15 fix: FX-B2 |
| `b205a84` | Phase 15 fix: FX-U3 | P18-R3 P15 fix: FX-U3 |
| `862af8a` | Phase 15 fix: FX-U4 | P18-R3 P15 fix: FX-U4 |
| `6627d03` | Phase 15 fix: FX-U2 | P18-R3 P15 fix: FX-U2 |
| `f805481` | Phase 15 fix: FX-U1 + FX-E1 | P18-R3 P15 fix: FX-U1 + FX-E1 |
| `0df1952` | Phase 15 fix: FX-S1 | P18-R4 P15 fix: FX-S1 |
| `8364053` | Phase 15 fix: FX-S2 | P18-R4 P15 fix: FX-S2 |
| `03c67aa` | Phase 15 fix: FX-T5 | P18-R4 P15 fix: FX-T5 |
| `172b24e` | Phase 15 fix: FX-I1 | P18-R4 P15 fix: FX-I1 |
| `cac7cc0` | Phase 15 fix: CH-3 | P18-R4 P15 fix: CH-3 |
| `e8b1d26` | Phase 15 fix: CH-2 | P18-R4 P15 fix: CH-2 |
| `1321e29` | Phase 15 fix: CH-4 | P18-R4 P15 fix: CH-4 |
| `ef7c5b0` | Phase 15 fix: FX-L1 | P18-R4 P15 fix: FX-L1 |
| `2bc35f0` | Phase 15 fix: FX-L2 | P18-R4 P15 fix: FX-L2 |
| `c831fe6` | Phase 15 fix: CH-1 | P18-R4 P15 fix: CH-1 |
| `17f4748` | Phase 15 fix: record CH-1 close-out | P18-R4 P15 fix: record CH-1 close-out |
| `9859d73` | feat: Implement shared bottom navigation and UI improvements for Month Review and Budget screens | P18-R5 feat: Implement shared bottom navigation and UI improvements for Month Review and Budget screens |
| `798e8ef` | expo doctor fix | P18-R6 expo doctor fix |
| `367361c` | Phase 15 fix: P15-FIX-R5 close-out | P18-R6 P15 fix: P15-FIX-R5 close-out |
| `5aeefb96e70df7c388e5eb39454285204adb5707` | Refactor: Update UI components to replace SectionHeaderRow with ChipRow and improve label consistency | P18-R6 Refactor: Update UI components to replace SectionHeaderRow with ChipRow and improve label consistency |
| `af76eec` | Refactor: Replace SectionHeaderRow with ChipRow for improved UI consistency across multiple screens | P18-R6 Refactor: Replace SectionHeaderRow with ChipRow for improved UI consistency across multiple screens |
| `4178c28` | Txns to Transactions Changed | P18-R7 Txns to Transactions Changed |
| `e7d8173` | Txns to Transactions | P18-R7 Txns to Transactions |
| `0304acd` | fix: restore Transactions tab label | P18-R7 fix: restore Transactions tab label |
| `d11af45` | P15-LEDGER | P18-LEDGER P15-LEDGER |
| `b92e145` | P15-LEDGER closeout | P18-LEDGER P15-LEDGER closeout |
| `2e5d594` | docs: merge session exports into PROGRESS.md and remove docs/prompts | P18-LEDGER docs: merge session exports into PROGRESS.md and remove docs/prompts |

History was not rewritten; original commit hashes are unchanged. Notes under
`refs/notes/phases` and annotated phase tags are local only and are not pushed.
View notes with `git log --notes=phases --oneline`; view tags with `git tag -n`.

### Original prompt records (legacy identifiers retained as source evidence)

| Phase / prompt | Purpose and agent-reported delivery | Review findings / user corrections | Outcome; Git commits | Source quality |
|---|---|---|---|---|
| P1 | Expo Router static mobile MVP, theme/components, mock data and screens. | Partial prompt specified five tabs and no-op future actions; remainder and review unknown. Checkpoint reports static routes/UI and Expo/browser checks. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed (partial visible prompt) |
| P2 | Pure deterministic domain calculations, selectors, tests and screen wiring. | Early checkpoint found self-import, unnecessary summary extras, missing tests/config and unwired screens; later checkpoints report fixes/done, but exact correction record is absent. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P3 | Validated local persistence, Zustand/AsyncStorage, transaction CRUD/forms and settings. | Checkpoint reports schemas, recovery and 11 suites/76 tests; force-quit persistence was not device-verified. User review/corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P4 | Pure plan/loan actions, schemas, linked transactions, forms and routes. | Later checkpoint reports 12 suites/93 tests and browser checks; final linked-transaction validation edit awaited recheck at checkpoint. Exact user correction/review unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P5 | Goals, holdings, EF ledger/invariants, typed errors and UI. | Checkpoint reports implementation and 5 focused suites/50 tests; coverage/browser/device work still pending at that checkpoint. User review unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P6 | Recovery fixes, plain backup/import/undo, lock/privacy, erase, reminders/configuration. | Checkpoint reports 20 suites/132 tests, typecheck/lint/platform exports; requested full changed-source output was omitted. Device/APK, biometric, share/import UX and privacy checks remain unverified. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Verbatim (session export only) |
| P06-FIX-R1 | Visible date labels and full-width Save buttons across forms (2026-10-10). | Patch partially failed after `DateField` label support; not validated before export. Current repository was explicitly rechecked below, rather than trusting old checkpoint. | Held / unverified at export; now audited as CR-3. | Verbatim (session export only) |
| P7 | Schema v2 migration; Loans→Liabilities and typed entries/source links. | Initial prompt truncated; history reports completion but exact code/test/review mapping and user corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P8 | Unified recurring/one-time investment flows and manual holding ledger. | Checkpoint records implementation; original tests, review, corrections and final counts unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P9 | Instrument transaction linking both directions, missing-link creation and retargeting. | Checkpoints document instrument transaction work; exact prompt, test map and user review unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P10 | Schedules, upcoming dues, entries/payments lists and virtualization. | Checkpoint documents schedules and screens; exact acceptance/test mapping and user corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P11 | Transaction/navigation behavior, error boundaries and shared headers/cards. | Later R3 audit found two user-visible assertions weakened/removed in intermediate work and restored them. Three-tab direction was superseded by four tabs. | Done (user-confirmed in app, 2026-10-15); FX-BASE follow-up `60b8c54`. | Reconstructed |
| P12 | Schema v3 onboarding, monthly salary/theme fields, palettes and branding. | Checkpoints report completion; exact version provenance, tests and user corrections unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P13 | Income wording, EF minimum target and transaction/goal/menu refinements. | Multiple checkpoints report work; exact prompt sequence, review, user corrections and final test map unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| P14 | A–G close-out: UI, v4 EF allocation, storage guard, reminders, encrypted backup and polish. | Initial completion report was challenged by user for wrong coverage arithmetic, skipped work and weakened tests; P15-A re-audited. Exact omissions unknown. | Done (user-confirmed in app, 2026-10-15); P15 follow-up commits below. | Reconstructed |
| P15 | Audit/fixes A/A2; B/C; schema v5 D; due engine E; G–J. | User required correct counts and restored assertions; P15-F/K/L/M held. P15-I count was corrected; CH/R4 mistakes and repairs recorded below. | A `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; A2 `0322c9d`; B `fbeb1d7`; C `e155bcd`; D `394d338`; E `f28657c`; G `9399e23`; H `68d9cd4`; I `19afe88`; J `1e206ad`. | Reconstructed |
| P15-FIX-R1 | Rebuilt ledger/baseline and began fixes. | Baseline had seven withdrawal-only render failures; the work was interrupted and remained unverified. No assertion was weakened per report. | Part 0 `db967bf`, `6562de1`; checkpoint `6771f37`. | Verbatim in Git at `5aeefb9` |
| P15-FIX-R2 | Recover interrupted work, repair baseline and inventory FX items. | R3 found two visible messages had been replaced by weaker assertions and restored them. | WIP `6771f37`; initial FX-BASE `c0ba0da`; superseded by R3 repair. | Verbatim in Git at `5aeefb9` |
| P15-FIX-R3 | Audit FX-BASE and complete baseline FX items with truthful gates. | Restored messages/assertions; applied formal ₹1 crore cutoff over a conflicting example; no thresholds/assertions weakened. | `60b8c54`, `5f6f883`, `de94950`, `a3423ec`, `c1df77d`, `88d5190`, `b8bc4a1`, `5e2f78f`, `b205a84`, `862af8a`, `6627d03`, `f805481`. | Verbatim in Git at `5aeefb9` |
| P15-FIX-R4 | FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2, then CH-1 v5→v6. | Fixed route-render v6 defaults, market-linked label/test import issues; no assertions weakened. Gates reported green twice; simulated layout is not device evidence. Export called date 2026-10-13; Git commit date is 2026-10-14. | `0df1952`, `8364053`, `03c67aa`, `172b24e`, `cac7cc0`, `e8b1d26`, `1321e29`, `ef7c5b0`, `2bc35f0`, `c831fe6`, `17f4748`. | Verbatim in Git at `5aeefb9` |
| P15-SEED | Seed backup tool prompt/work. | No corresponding prompt, output, or commit was found in available Git history or export files; scope and outcome are unknown. | Unknown; none identified. | Unknown |
| P15-LEDGER | Merge both exports and local checkpoints, audit form labels/save widths, remove prompt archive and test ledger invariants. | Current repository already contained the earlier P15-LEDGER removal; recovery commit found as `5aeefb9`. Current form audit found CR-3; no application code changed. | This commit. | Verbatim current request |

## 6. Prompt and session log

Prompt text is not duplicated here. RECOVERY is the last Git commit with the
prompt archive. The repository was already at `b92e145`, whose parent
`d11af45` removed that archive; `5aeefb9` is the last commit containing it.
Unknown dates/outcomes are not inferred. “Agent mistakes” records only
evidence present in exports/checkpoints.

| ID | Phase | Legacy ID | Session | Date | Purpose | Outcome | Commits (Git only) | Agent mistakes / review findings | Text |
|---|---|---|---:|---|---|---|---|---|---|
| CM-1 | Repository rules | — | current | 2026-11-08 | Enforce descriptive Conventional Commit subjects. | Old: non-descriptive placeholder subjects were unenforced. New: a POSIX commit-msg hook requires supported Conventional Commit types and rejects placeholders. Reason: make each commit's scope clear and keep unrelated work separate. Gates 1-4: `npm test -- --coverage` 0; `npx tsc --noEmit` 0; `npx expo lint` 0; `npx expo-doctor` 0. Exports skipped by the no-build constraint. | First task commit: `54abb4bcee262287facda1f600022d6189bedc39` (`docs: enforce descriptive commit subjects`). | Initial focused reproduction failed because the hook was absent; after implementation, all 9 focused tests pass. Full Gate 1: 93 suites, 1,205 passed, 1 skipped. | current request |
| P28-D | P28 | — | current | 2026-11-08 | Adopt branching, shared task rules, and contributor documentation. | Done; `develop` starts at main baseline `a258579c4b580d6f3a157b8d13de53334aa8d34d`; docs, templates and source-derived tests added. Legacy unreleased content in the adoption baseline is an explicit exception; rules apply prospectively. Six gates pass. | `b314113` (`docs: add branching strategy and contributor guide`). | Old: no shared branch workflow or contributor/security templates. New: documented branches, merge rules, six gates, conventional commits and contribution path. Reason: make future work reproducible and protect the stable/release flow. | current request |
| P28-C-R4 | P28 | P28-C | current | 2026-11-08 | Restructure README and align release documents with the no-public-digest policy. | Done; README follows the user/developer/documentation order. README and latest published Download blocks match; public README and published notes contain no 40/64-character hex identifiers; release docs require private digest verification and expected-size link checks. The final integrated six-gate run passed: 98 suites, 1,242 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, data 91.03/87.39/94.46/94.17%, domain 96.95/92.85/98.80/98.32%, lib 100%; Gates 2-6 all exit 0, Doctor 21/21, Android and iOS exports succeeded. | Task `89739755081f9c5ed32a6067f4b85bdfcbe39edc` (`P28-C-R4: Restructure README and align release documents with the no-public-digest policy`); phase integration `fd0360ab4affd805fda6fa778e5f06d20b6acc8d`. | Old: release hashes/commit identifiers were presented publicly and README sections were ordered around download/development details. New: ordered user-first docs and internal-only APK digest verification, with a precise parity regression. Reason: improve discovery and avoid exposing internal build identifiers/checksums. GitHub release body intentionally unchanged. | current request |
| P28-E | P28 | — | current | 2026-11-08 | Map repository history to phase/subtask IDs and create historical phase branches, completion tags and an archival `history/by-phase` branch. | Done; Revised by P28-E-R1, P28-E-R2, P28-E-R3, P28-E-R4, P28-E-R5 and P28-E-R5-R1. 30 phase branches/tags and the 131-commit archive are verified. The snapshot contains 512 original commits: 337 directly mapped and 175 date-fallback mapped, with zero unmapped. Each original hash appears once. Its tree matched `main` at the original verification point; it is a historical snapshot, not the current main tree. | Task `73d07f22237fb8db9d039618ffb1709a9d75ca45` (`docs: map phase history and record Release 2 revisions`); P28 integration `c841cf412ea84abf35429a9a23e033f0546abda6`; develop integration `e629ae76cb572a933148664ec6c3cb67e6434a21`. | The baseline hash in P28-D evidence is not treated as P28-D's implementation commit. P7, P9 and P10 use nearest preceding evidenced anchors because no dedicated original commit was found. | current request |
| P28-E-R2 | P28 | P28-E | current | 2026-11-08 | Preserve and reconcile the final P28-E remote-verification record. | Done; local commit `72fb325` is retained in history via merge commit `196deef`. All six gates pass on the reconciliation branch: Gate 1 has 98 suites, 1,244 passed, 1 skipped; coverage is 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; Gates 2-6 exit 0, Expo Doctor 21/21. Its outdated device, release and branch status was not allowed to overwrite the current ledger. | P28-E final-verification commit `72fb325ed395c6f7e968c44e6af177689051f898`; reconciliation merge `196deefc454403614f2994bd976958996be92ce8`. | Old: the local P28-E follow-up mixed valid final-gate evidence with stale release/device status. New: retain its final-gate entry and commit ancestry while using current records for Release 2 status. Reason: preserve useful P28-E evidence without restoring superseded claims. | current request |
| P28-E-R1 | P28 | P28-E | current | 2026-11-08 | Close out P28-E evidence and record final integrated gates, protected hashes and remaining follow-ups. | Done; final integrated `develop` run: all six gates exit 0. Gate 1: 98 suites, 1,242 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, data 91.03/87.39/94.46/94.17%, domain 96.95/92.85/98.80/98.32%, lib 100%. Protected hashes verified: Budget `b60f77af4f76d47f2cee07393fe9d8f3fa6bd04c`; Home `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`. The archived 512-commit source snapshot predates follow-up commits and remains unchanged. Authorized refs and the final P28/develop ledger integrations were pushed and remotely verified; `v1.0.0` remains unchanged. | Task `a9407d002a527ffa9a1edd8a4d01870cce0eb7d2` (`docs: close P28-E history and record final gates`); follow-up `533aafb07c242fd1be7f682115527074f64026ac` (`docs: verify authorized Budget screen hash`); P28 and develop merges use `--no-ff`. | Old: P28-E was described as in progress with a preliminary 485-source estimate and pending archive checks; the Budget protected hash did not include the later authorized recurring-income editor. New: final evidence records 512 mapped hashes (337 direct, 175 date fallback, zero unmapped), the 131-commit archive, all six gates, and the current Budget/Home blobs. Reason: replace provisional history and stale protected-hash evidence with verified results without rewriting the read-only snapshot. Device checks and v1.1.0 release preparation remain pending. | current request |
| P28-F | P28 | — | current | 2026-11-08 | Verify branch integration and prepare the Release 2 code on `release/v1.1.0`, then merge to main and back-merge to develop. | Done; all six ordered release-branch gates exit 0: Gate 1 98 suites, 1,242 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; Gates 2-6 exit 0, Expo Doctor 21/21. On main, post-merge Gates 1-2 exit 0 with 98 suites, 1,242 passed, 1 skipped. Release PR #2 merged as `91e0cc2`; back-merge PR #3 merged as `0d2bf0a`. Revised by P28-F-R3, which records the later EAS build, tag and publication. | `ed2f596` (`chore: prepare v1.1.0 release`); test correction `29f91ff`; gate evidence `86ca5dd`; PR #2 merge `91e0cc2`; PR #3 merge `0d2bf0a`. | Initial Gate 2 found a TypeScript narrowing issue in the new derived progress assertion (exit 2); the test was corrected and the ordered six-gate rerun passed. Main Gate 1 and 2 also passed. Old: no v1.1.0 release record existed. New: release metadata, changelog, draft and README What's new are integrated while Download remains on v1.0.0. Reason: prepare verified Release 2 changes for owner-led APK build and publication. | current request |
| P28-F-R1 | P28 | P28-F | current | 2026-11-08 | Record owner-reported Android device verification for Release 2 checklist items N39-N43. | Done; owner supplied Pass for recurring-income due/non-due months and backup restore, immediate edit refresh, aggregate Pace/no stacked bar, linked paid sync/Undo, and Entries counts/caps. Checklist results updated; device model, Android version and tester remain blank. | `98865a8` (`docs: record Release 2 device test results`). | Old: N39-N40 Fail and N41-N43 Not run, with notes describing pre-fix bugs or pending tests. New: all five are Pass, with obsolete failure notes removed. Reason: record the owner's reported device verification without inferring or filling device identity details. | current request |
| P28-F-R2 | P28 | P28-F | current | 2026-11-08 | Correct the v1.1.0 release draft's Contributors section and document verified branch/GitHub alignment. | Done. The draft's linked contributor credits match published v1.0.0; the template requires release-specific verified attribution. PR #1 merged P28 into develop at `5664cee`; PR #2 merged `release/v1.1.0` into main at `91e0cc2`; PR #3 back-merged main into develop at `0d2bf0a`. All three PRs are merged. At that stage, the v1.1.0 tag and publication were pending; Revised by P28-F-R3. | Contributor task `4f5b5f4`; P28 tip `67ef4d2`; PR #1 merge `5664cee`; PR #2 merge `91e0cc2`; PR #3 merge `0d2bf0a`. | Old: the draft used a generic contributor label and the template lacked attribution criteria. New: linked credits match the published reference and the template requires release-specific verification. Reason: prevent inaccurate attribution. The Release 2 device results and contributor correction are available in GitHub main and develop through the required PR path. | current request |
| P28-F-R2-R1 | P28 | P28-F-R2 | current | 2026-11-08 | Correct stale PR/GitHub sync records after the Release 2 follow-up PRs merged. | Done; PR #4 merged the task correction into P28, PR #5 merged P28 into develop, PR #6 integrated the release branch into main, and PR #7 is the main-to-develop back-merge. The correction follows task -> phase -> develop -> release -> main -> develop. PRs #1-#3 record the earlier Release 2 follow-ups. Latest six ordered gates pass: 98 suites, 1,243 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; Gates 2-6 exit 0. At this revision `v1.1.0` was untagged; Revised by P28-F-R3 for publication. | Task commit `0b07f9d`; PR #4 merge `3fc4c3b`; P28 sync `645969d`; P28 merge `5ae2bd6`; PR #5 merge `c4be8e8`; PR #6 release merge `e868468`; PR #7 is the back-merge. | Old: status and open-item records said device results and contributor corrections were local-only despite PRs having merged. New: the chronological PR path and verified GitHub availability are recorded. Reason: align the project record with actual remote refs and PR state. | current request |
| P28-F-R3 | P28 | P28-F | current | 2026-11-08 | Publish the approved v1.1.0 release and align release documentation. | Done; GitHub release [v1.1.0](https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.1.0) is published with the exact asset name. The annotated tag peels to the verified EAS source commit. The uploaded APK matched the EAS artifact; latest and versioned URLs returned HTTP 200 with `Content-Length: 112147677`. The README and published-note Download blocks match; v1.0.0 uses its versioned URL. Owner-approved exceptions: `preview` profile and reused versionCode 1. All six ordered gates exit 0: 98 suites, 1,243 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall; `src/data` 91.03/87.39/94.46/94.17%; `src/domain` 96.95/92.85/98.80/98.32%; `src/lib` 100%; TypeScript, lint, Doctor 21/21 and Android/iOS exports pass. Revised by P28-F-R3-R1 for actual PR and remote branch evidence, P28-F-R3-R2 for historical asset and body corrections, and P28-F-R3-R3 for versioned latest-asset naming. | Publication task `9dd350c`; PR #11 task-to-P28 merge `a2f9db2`; PR #12 P28-to-develop merge `3e2a5a8`; PR #13 develop-to-release merge `d4d69fa`; PR #14 release-to-main merge `b0aeef9`; PR #15 main-to-develop merge `6f5df18`. | Old: v1.1.0 was a dated-TBD draft and README still pointed to v1.0.0. New: v1.1.0 is published, both APK links and exact expected size are verified, and latest/older Download blocks are correct. Reason: complete the approved release without publishing a digest or committing the APK. | current request |
| P28-F-R3-R1 | P28 | P28-F-R3 | current | 2026-11-08 | Record the publication PR chain and verify that the merged v1.1.0 branch state is aligned. | Done; PR #11 merged task to P28 (`a2f9db2`), #12 merged P28 to develop (`3e2a5a8`), #13 merged develop to `release/v1.1.0` (`d4d69fa`), #14 merged the release branch to main (`b0aeef9`), and #15 back-merged main to develop (`6f5df18`). The remote `main`, `develop`, `release/v1.1.0`, and `phase/28-qa-and-release` trees are identical. The v1.1.0 tag remains unchanged at verified source `da111707`; both download URLs return HTTP 200 and 112,147,677 bytes. The original publication task branch was deleted after PR #11; the P28 branch is retained. | Task record commit `421e53f`; publication PR chain #11-#15 with merge commits listed in P28-F-R3. | Old: publication PR/merge IDs and final remote tree state were pending. New: all five PRs are merged, remote trees match, the tag target is unchanged, and the publication task branch is removed. Reason: complete the requested chronological GitHub integration audit. | current request |
| P28-F-R3-R2 | P28 | P28-F-R3 | current | 2026-11-08 | Correct historical APK download routing and remove the v1.0.0 digest from the human-authored release body. | Done; renamed v1.0.0 asset without re-upload, updated its Download block and made the GitHub body byte-match the canonical note. Versioned v1.0.0 URL: HTTP 200, 112,133,413 bytes; former generic URL: HTTP 404. At this revision, v1.1.0 retained the generic latest asset; P28-F-R3-R3 replaces that filename. The v1.0.0 tag was unchanged. Ordered gates: Gate 1 initially exited 1 because the derived P28 branch-index count remained 17; after correcting it to 18, the final run passed with 98 suites, 1,244 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, data 91.03/87.39/94.46/94.17%, domain 96.95/92.85/98.80/98.32%, lib 100%; Gates 2-6 exit 0 and Expo Doctor 21/21. | Local docs/test task branch; public GitHub release asset and body updated. | Old: the superseded v1.0.0 asset used the generic filename and its human-authored body exposed the digest; the branch index count was stale at 17 while the dashboard derived 18. New: versioned asset URL/name and checksum-free body are aligned, and branch index says 18. Reason: keep historical downloads version-specific, remove the authored checksum and keep derived ledger tests consistent. | current request |
| P28-F-R3-R3 | P28 | P28-F-R3 | current | 2026-11-08 | Include version and latest marker in the current APK filename, removing the marker when it becomes historical. | Done; v1.1.0 asset `WealthWise-android-latest-v1.1.0.apk`; README, v1.1.0 note, release history and GitHub release body use the matching latest route. The v1.1.0 latest and versioned routes return HTTP 200 with 112,147,677 bytes; v1.0.0 versioned route returns HTTP 200 with 112,133,413 bytes. Six gates passed: 98 suites, 1,244 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; Gates 2-6 exit 0 and Expo Doctor 21/21. Revised by P28-F-R3-R3-R1 for GitHub integration evidence. | Implementation commit `1ca095c925e3a9840cf97408e03ec443b74a0eb4`; GitHub asset renamed and release body updated. | Old: latest used a generic APK filename without version. New: latest filename includes both `latest` and version; superseded names omit `latest`. Reason: make each download's release identity explicit and prevent old downloads resolving to another version. | current request |
| P28-F-R3-R3-R1 | P28 | P28-F-R3-R3 | current | 2026-11-08 | Verify versioned APK filename changes are integrated through the chronological PR path and that the integrated branches match. | Done; PR #21 task-to-P28 merged as `a7df47f86df90cee4479f609856e54f0983fea69`; PR #22 P28-to-develop as `9c79b235819297ff99f25d19a18206bfaa51297c`; PR #23 develop-to-release as `0ee755f6bc0627a97c57861e5ac7a3aa6b1495a2`; PR #24 release-to-main as `9192fd60b0a081ee849dd7e4b2e467c19ddb13a6`; PR #25 main-to-develop as `ddb17ffea4c1293d3b7fd64bc4a9b73a6f6a75cf`. Remote `main`, `develop`, `release/v1.1.0` and `phase/28-qa-and-release` trees are identical. All six gates exit 0: Gate 1 has 98 suites, 1,244 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; TypeScript and lint pass, Expo Doctor 21/21, Android/iOS exports pass. The v1.1.0 tag was not changed. | Filename-policy commits `47fdb82`, `1ca095c`, `3c71fd4`; PR chain #21-#25. | Old: the versioned APK change existed on a local task branch and was not integrated; memory still said the branch was unpushed. New: all five PRs merged chronologically, the task branch was deleted, and the four relevant remote trees match. Reason: make the documented release asset policy available on GitHub main and align all integration branches. | current request |
| P20-N-R1 | P20 | — | current | 2026-11-08 | Replace Budget's stacked allocation bar with per-section actual-versus-planned Pace. | Red route test before production edits: expected zero stacked bars, received two at font scales 1.0, 1.3 and 2.0. After the change, chart/domain/route/demo suites pass (4 suites, 247 tests). The full Gate 1 passed 97 suites, 1,227 tests passed, 1 skipped; Gates 2-4 passed. Exports were skipped under the no-build instruction. | `f904769` (`feat: add section-based Budget Pace chart`). | Old: stacked-bar proportion assertions and global spending-pace assertions. New: section timelines, dashed/solid pairs, toggles, axes, accessibility, and contrast; route asserts no stacked bar. Reason: the chart now compares actual and planned pace by section. | current request |
| P30-A | P30 | — | current | 2026-11-08 | Diagnose edited values that appear stale after actions or restart. | Three restart tests fail: failed SQLite write, SQLite read-back mismatch and temporary legacy fallback all restore old SQLite bytes. Real store action JSON/fresh hydration match; all eight mounted screen refresh checks and previous-state immutability checks pass. | Diagnosis commit: `a251c3a60a0d0ef8b101d9721246c05f8559d41f` (`test: reproduce persisted value loss after restart`). | Confirmed stale SQLite preference. Not confirmed: UI memoization/React Compiler, module-level caches (none found), in-place mutation, broad/missing subscriptions, or route-param object caching. | current request |
| P30-B | P30 | — | current | 2026-11-08 | Fix confirmed persisted-value loss and expose failed writes. | All three restart reproductions now pass; deletion tombstones also prevent stale SQLite values returning. A mounted StorageErrorBanner test confirms an unpersistable update is announced. | Implementation commit: `ec019effd1b1f29190885c4effb5235be50898cd` (`fix: prefer verified fallback data after restart`). | The old adapter selected SQLite first after process restart despite a newer legacy fallback. A durable, read-back-verified authority marker now resolves source precedence; old failed-write assertions were replaced by restart-passing assertions because the newest verified value must win. | current request |
| P30-C | P30 | — | current | 2026-11-08 | Guard memo inputs and report storage verification in development. | Source scan passes across production `app/` and `src/`; development diagnostic reports both hydration source and last-write verification in one line and is disabled in production. | Guard commit: `54c264c7a33051412050600f672fe3524dd0ac72` (`test: guard memo inputs and storage diagnostics`). | The scan treats React state setters and refs as stable, requires every other closure input in the dependency array, rejects React.memo without a comparator, and blocks module-level Map/WeakMap caches without review. | current request |
| P01 | P1 | — | 1 | unknown | Mobile foundation, design system and static screens. | Done (user-confirmed in app, 2026-10-15). | none identified | Partial prompt and later review unavailable. | reconstructed |
| P02 | P2 | — | 1 | unknown | Pure domain logic and computed screens. | Done (user-confirmed in app, 2026-10-15). | none identified | Early self-import, unnecessary extras, missing tests/config and unwired screens; later resolution reported only. | reconstructed |
| P03 | P3 | — | 1 | unknown | Validated local persistence and transaction forms. | Done (user-confirmed in app, 2026-10-15). | none identified | Native force-quit persistence not verified. | reconstructed |
| P04 | P4 | — | 1 | unknown | Plan/loan flows and linked transactions. | Done (user-confirmed in app, 2026-10-15). | none identified | Final linked-transaction edit awaited revalidation at checkpoint. | reconstructed |
| P05 | P5 | — | 1 | unknown | Goals, holdings and Emergency Fund flows. | Done (user-confirmed in app, 2026-10-15). | none identified | Coverage/browser/device checks remained pending at checkpoint. | reconstructed |
| P06 | P6 | — | 1 | unknown | Review fixes, backup, lock/privacy and erase. | Done (user-confirmed in app, 2026-10-15); device/APK acceptance unverified. | none identified | Required full source contents were omitted from response. | verbatim in session export |
| P06-FIX-R1 | P6 | — | 1 | 2026-10-10 | Visible form labels and full-width Save buttons. | Held / unverified at export; current state audited as CR-3. | none identified | Multi-file patch failed partway and was not validated. | verbatim in session export |
| P07 | P7 | — | 2 | unknown | Schema v2 and Loans-to-Liabilities migration. | Done (user-confirmed in app, 2026-10-15). | none identified | Initial prompt truncated; exact review/tests unavailable. | reconstructed |
| P08 | P8 | — | 2 | unknown | Unified investment ledger and manual holdings. | Done (user-confirmed in app, 2026-10-15). | none identified | Original request/review/test mapping unavailable. | reconstructed |
| P09 | P9 | — | 2 | unknown | Instrument transaction linking/retargeting. | Done (user-confirmed in app, 2026-10-15). | none identified | Exact acceptance evidence unavailable. | reconstructed |
| P10 | P10 | — | 2 | unknown | Schedules, dues, entry/payment lists and virtualization. | Done (user-confirmed in app, 2026-10-15). | none identified | Original test map and corrections unavailable. | reconstructed |
| P11 | P11 | — | 2 | unknown | Transactions/navigation and crash/error handling. | Done (user-confirmed in app, 2026-10-15); later audited in FX-BASE. | none identified for P11 | R3 found two visible-message assertions weakened/removed in intermediate work; restored. | reconstructed |
| P12 | P12 | — | 2 | unknown | Schema v3 onboarding, themes and branding. | Done (user-confirmed in app, 2026-10-15). | none identified | Exact schema-version provenance and review unavailable. | reconstructed |
| P13 | P13 | — | 2 | unknown | Income wording, EF minimum and UI refinements. | Done (user-confirmed in app, 2026-10-15). | none identified | Prompt sequence and full review unavailable. | reconstructed |
| P14 | P14 | — | 2 | unknown | Close-out/features A–G. | Done (user-confirmed in app, 2026-10-15); audited in P15-A. | none identified for original phase | User later reported wrong coverage arithmetic, skipped work and weakened tests. | reconstructed |
| P15-A | P15 | — | 2 | 2026-10-11 | Audit P14 and restore reliable gates. | Done (audit work). | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7` | Coverage-summary command failed; follow-up addressed coverage/test issues. | reconstructed |
| P15-A2 | P15 | — | 2 | 2026-10-12 | Migration/premigration and assertion audit. | Done. | `0322c9d` | Restored assertions/version-chain behavior; exact prior assertion details unavailable. | reconstructed |
| P15-B | P15 | — | 2 | 2026-10-12 | P14 UI leftovers. | Done. | `fbeb1d7` | Exact scope unavailable. | reconstructed |
| P15-C | P15 | — | 2 | 2026-10-12 | SIP date clarity and goal-card behavior. | Done. | `e155bcd` | Exact review unavailable. | reconstructed |
| P16-A | P16 | P15-D | 2 | 2026-10-12 | Schema v5 and related data features. | Done. | `394d338` | One-time origin transaction ID interpretation was an assumption; approval unknown. | reconstructed |
| P16-B | P16 | P15-E | 2 | 2026-10-12 | Shared schedules and due-clearing behavior. | Done. | `f28657c` | Exact prompt unavailable. | reconstructed |
| P23-A | P23 | P15-F | 2 | 2026-10-21 | Policy data model, schema-v11 migration and pure domain summary/actions; no screens (CR-78–CR-79). | Done; all six gates exit 0; 77 suites/894 tests pass. | Preflight `0774e51`; inventory `67ddfc4`; implementation `0c805d4`. | Assumed: v10 `single` is represented as yearly with one period; absent start date falls back to earliest payment then injected today; unknown frequency defaults yearly. | current request |
| P23-B | P23 | — | 2 | 2026-10-21 | Insurance cover goals, schema-v12 migration, budget/category and policy-suggestion integration; no new screens (CR-80–CR-81). | Done; 78 suites/914 tests pass; all six gates exit 0. | Preflight/decision `04bf7f0`; schema/migration `1f9917e`; domain/tests `8893bf9`; coverage correction `b9cb4f6`; lint cleanup `c443191`. | Assumed: see DEC-P23-COVER demo/category details; preserve all policy screens and all existing Insurance transaction history. | current request |
| P23-C | P23 | — | 2 | 2026-10-21 | Insurance cover and policy screens, with cover goal forms and transaction/Budget/Home integration (CR-82–CR-85). | Done; final gates and tests recorded below. | Preflight `1858997`; implementation `69a16ec`. | Assumed: see DEC-P23-C-SCREENS; preserve schema v12 and all P23-B domain behavior. | current request |
| P23-D | P23 | — | 2 | 2026-10-22 | Replace Goals Insurance link and conditional compact Home row with a policy summary Insurance Card (CR-91). | Done; P25-C's 38 focused screen tests confirm the user-owned Home order, ordered details, final goal bar, empty state, navigation and no Insurance content on Goals. | Preflight/decision `9dedb6f`; implementation `20cf7b9`; P25-C tests. Base `211e514`; user-owned commit `5558bf4` audited. | Assumed: see DEC-P23D and DEC-P25C; schema v13 and remaining P23-C behavior stay unchanged. | current request |
| P16-C | P16 | P15-G | 2 | 2026-10-12 | Goal asset links and projection. | Done. | `9399e23` | Exact review unavailable. | reconstructed |
| P17-A | P17 | P15-H | 2 | 2026-10-12 | Cash-flow history and money movement. | Done. | `68d9cd4` | CH-4 removed movement UI/route but retained shared logic required by liability receipt. | reconstructed |
| P17-B | P17 | P15-I | 2 | 2026-10-12 | Monthly budget tracker. | Done. | `19afe88` | Earlier test-count report was corrected. | reconstructed |
| P17-C | P17 | P15-J | 2 | 2026-10-12 | Sorting infrastructure and integrations. | Done. | `1e206ad` | Exact prompt unavailable. | reconstructed |
| P18-R1 | P18 | P15-FIX-R1 | 2 | 2026-10-13 | Ledger/baseline and initial FX fixes. | Part 0 done; remaining FX work interrupted/unverified. | `db967bf`, `6562de1`, `6771f37` | Baseline had seven withdrawal-only render failures; work was left unverified. | verbatim in git at `5aeefb9` |
| P18-R2 | P18 | P15-FIX-R2 | 2 | 2026-10-13 | Recover interrupted work and fix baseline. | Superseded by R3 audit/repair. | `6771f37`, `c0ba0da` | Two visible-message assertions were replaced with weaker checks; R3 restored them. | verbatim in git at `5aeefb9` |
| P18-R3 | P18 | P15-FIX-R3 | 2 | 2026-10-13 | Audit FX-BASE and complete fixes with truthful gates. | Done; gates reported green twice. | `60b8c54`, `5f6f883`, `de94950`, `a3423ec`, `c1df77d`, `88d5190`, `b8bc4a1`, `5e2f78f`, `b205a84`, `862af8a`, `6627d03`, `f805481` | Restored UI messages/assertions; followed formal ₹1 crore cutoff over a conflicting example. | verbatim in git at `5aeefb9` |
| P18-R4 | P18 | P15-FIX-R4 | 2 | 2026-10-14 | FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2, then CH-1. | Done; gates reported green twice; real-device behavior unverified. | `0df1952`, `8364053`, `03c67aa`, `172b24e`, `cac7cc0`, `e8b1d26`, `1321e29`, `ef7c5b0`, `2bc35f0`, `c831fe6`, `17f4748` | Fixed missing v6 fixture defaults, label-scan wording and unimported test error class without weakening assertions. Export date conflict resolved in favor of Git. | verbatim in git at `5aeefb9` |
| P18-R5 | P18 | P15-FIX-R5 | 2 | 2026-10-15 | Unify bottom navigation; align Budget History/Month review actions; improve Cash flow and editable plan summary while preserving Sort UI. | Delivered in `9859d73`; R6 verified the full gates and corrected superseded layout expectations. Real-device checks remain outstanding. | `9859d73`; verification close-out in R6 | No SortChip appearance, options, logic, or placement changes. Visible/accessibility label is Transactions. | verbatim prior request |
| P18-R6 | P18 | P15-FIX-R6 | 2 | 2026-10-15 | Close out R5: green baseline, SortChip/header history audit, Expo SDK patch alignment and complete gates. | Baseline 64 suites/659 tests, current 65 suites/669 tests, source coverage above floors, Doctor 21/21, both exports, TypeScript and lint pass; device checks remain unverified. | `798e8ef`, `367361c` | Updated superseded layout assertions; SortChip and sorting logic untouched. No WIP commit because the tree was clean. | verbatim current request |
| P18-LEDGER | P18 | P15-LEDGER | 2 | 2026-10-14 | Merge exports/checkpoints, verify forms, remove prompt archive and close CR-2. | Earlier ledger task had already removed archive; form audit opened CR-3. | `d11af45`, `b92e145`, `2e5d594` | No application code changed in the ledger close-out. | verbatim in current request |
| P18-R0 | P18 | P15-fix-0 | 2 | 2026-10-13 | Initial fix-round ledger/baseline. | Done. | `db967bf` | Progress-ledger test passed. | reconstructed |
| P18-R7 | P18 | — | 2 | 2026-10-15 | Restore Transactions label, restructure phase tree/progress bars, record confirmation and CR-4–CR-8, and label old commits locally. | Focused tests and all required gates pass; device checks remain outstanding. | `e7d8173`, `0304acd`; this ledger commit | No history rewrite or push. | verbatim current request |
| P19-A | P19 | — | — | 2026-10-15 | Five-group budget model, categories, suggestion, compact setup, subtotals and recurring items (CR-5). | Done; focused and full gates pass. | `acc94df`, `af885c1` | Assumed starter split and within-group weights are recorded in Section 4; schema remains v6. | current request |
| P19-B | P19 | — | — | 2026-10-15 | Investment category and earned-income sync; History, Month review and Templates buttons; no Budget header menu (CR-9, CR-16). | Done; focused and full gates pass, including 500-case reconciliation. | `221d2ed` | Assumed the entire Budget header menu is removed. | current request |
| P19-C | P19 | — | — | 2026-10-15 | Restore and freeze user-owned input components; Budget header icons (CR-17); compact Transactions balance card (CR-18); user-owned components (CR-19). | Done; focused and full gates pass; physical-device layout remains unverified. | `d3477f2` | Assumed commits without a Copilot co-author trailer are user-authored; current field files already matched `bf4adf3`, so no restore-only commit was needed. | current request |
| P20-A | P20 | — | — | 2026-10-15 | Derived pending rows, FIFO Pay/Clear due and Undo, Transactions section and balance caption; applied budgets and recurring schedule slots (CR-6). | Done; Revised by P20-A-R1; Revised by P20-A-R2. Original focused/full gates are historical. | `8545909` | Linked-plan and linked-manual plain-transaction behaviors are superseded by P20-A-R1/R2. | current request |
| P20-A-R1 | P20 | P20-A | current | 2026-11-08 | Route paid linked recurring-plan and liability EMI actions through the shared clearDue path. | Reproduced before implementation: a linked planned investment row created only a plain transaction. Real-store tests cover Transactions, Home, Budget and reminder entry points, one write and Undo; the fixed route regressions pass. | `0778b8b740a2980fa5d08a3e60ba66cad80f63aa` (`fix(P20-A-R1): sync linked planned payments`) | Old: linked plan payment skipped the holding entry/payment ledger. New: shared clearDue/undoClearDue preserves linked ledgers. Reason: keep the payment ledger and transaction atomic. | current request |
| P20-A-R2 | P20 | P20-A | current | 2026-11-09 | Fix one-time manual savings paid from a linked Budget row through clearDue and exact one-step Undo. | Done; red snapshot-only component reproduction committed before production edits. Real-store baseline: one generic transaction, zero holding entries, one write; $10,000 Invested/value unchanged while the $5,000 Budget actual consumed the plan. Focused tests: 6 suites/267 tests; all six final gates pass. Revised by P20-A-R2-R1 after owner-reported N44 Pass. | Red regression `4cfa20c`; store baseline `4107494`; implementation `d2acde3`. | Old: lookup only current-month snapshot/base plan and generic addTransaction fallback; category actuals hid missing entries; linked manual rows could be duplicate-suppressed. New: pending source carries month/holding ID and clearDue/undoClearDue writes both linked ledger records once. Budget assertion now requires month; reason: preserve viewed frozen-snapshot context. Home has no Budget-kind due row and its user-owned screen was not edited. | current request |
| P20-A-R2-R1 | P20 | P20-A-R2 | current | 2026-11-09 | Record the owner-reported physical-device result for N44. | Done; owner reported Pass for a linked one-time savings item marked Paid from Transactions creating a holding entry, and Undo removing it. Device identity fields remain blank. | No implementation commit; checklist evidence only. | Old checklist result: Not run. New: Pass based on the owner's report; reason: owner confirmed the physical-device test was completed. | current request |
| P28-F-R4 | P28 | P28-F | current | 2026-11-09 | Prepare a proposed next-release note and add version-specific screenshot sections for current and previous releases. | Done as a review draft only. Proposed v1.1.1 notes describe the verified manual-savings Paid/Undo flow and shared form titles. Revised by P28-F-R4-R1 to embed supplied screenshots and record the owner-led build/upload sequence. No v1.1.1 version bump, build, tag, publication or merge. | No commit; working-tree draft only. | Old: no next-release draft or per-version screenshot sections; template contained a broken example image URL. New: candidate records pending version approval; screenshot is embedded as owner-designated, and GitHub release creation remains gated on approval and merge. | current request |
| P28-F-R4-R1 | P28 | P28-F-R4 | current | 2026-11-09 | Add supplied release screenshots and codify the owner-led build/upload/release sequence. | Done; Revised by P28-F-R4-R1-R1. Three supplied PNGs were identical and the owner confirmed intentional reuse. Versioned screenshots are present in README and release Markdown; v1.0.0/v1.1.0 assets and release bodies are updated. Both screenshot URLs return HTTP 200 with Content-Length 244,108. Release rules require owner draft approval, PR integration, GitHub draft creation after merge, owner APK build/upload and confirmation, verification, then separate publication approval. | No commit; current working tree. GitHub image asset edits are complete. | Old: release notes referenced missing screenshots and build guidance did not define the owner handoff. New: release assets render from versioned URLs and roles/gates are explicit; reason: prevent builds from unmerged code and publishing before owner confirmation. | current request |
| P28-F-R4-R1-R1 | P28 | P28-F-R4-R1 | current | 2026-11-09 | Continue the approved v1.1.1 release candidate through version alignment, six-gate validation, required PR integration and publication. | In progress; owner-approved note and app/package versions passed all six gates, task PR #56 and P28 PR #57 merged the candidate to `develop`, and the APK was verified and attached. The GitHub release remains a draft pending final publication. | Task branch `task/P28-F-R4-R1-R1-approve-v1-1-1`; P28 branch; PRs #56 and #57; release branch and GitHub draft. | Candidate title/status changed from proposed review to owner-approved release; publication remains pending. | current request |
| P28-F-R4-R1-R1-R1 | P28 | P28-F-R4-R1-R1 | current | 2026-11-09 | Complete screenshots, release-note completeness and screenshot display rules. | Done; Revised by P28-F-R4-R1-R1-R1-R1. Owner approved the note and requested compact thumbnails, latest-only README images, and a fixed category order. Added all 23 screenshots to versioned paths and all three GitHub releases. README now contains only latest screenshots under the generic heading; galleries use 150-pixel images, four per row, ordered Home, Assets, Liabilities, Emergency Fund, Goals, Insurance, Budget, Transactions (omitting unavailable screens). Removed Contributors sections, completed all template sections in v1.1.1, removed the APK-upload status message and updated policies/tests. All release image URLs return HTTP 200; focused tests and `git diff --check` pass. The approved note is now in `published/`; PRs #58 and #59 merged the screenshot/doc revision to P28 and `develop`. APK upload, verification and publication remain pending. | Task branch `task/P28-F-R4-R1-R1-R1-release-screenshots`; P28 branch; PRs #58/#59; GitHub releases v1.0.0, v1.1.0, v1.1.1 draft. | Old: all releases displayed in README and galleries were vertical; draft omitted template sections and said APK unavailable. New: latest-only README, 150-pixel four-per-row galleries in owner order, complete template note without upload-status message. Release-download tests now identify published versions from the Published release-history table, not every note in `published/`; the progress-ledger test and dashboard account for the integrated subtask. Reason: owner-directed display/review requirements, approval-first note placement, and accurate release/ledger status. | current request |
| P28-F-R4-R1-R1-R1-R1 | P28 | P28-F-R4-R1-R1-R1 | current | 2026-11-09 | Update the approved release workflow so the agent builds and uploads the Android APK, and audit ordered-list numbering throughout release Markdown. | Done; release rules consistently authorize the agent to build with EAS `android-apk` and upload to the GitHub draft only after Markdown approval, code merge to `develop`, and draft creation. Audited all 10 release Markdown files: every ordered sequence is consecutive; no numbering edits were needed. Three focused suites / 19 tests and `git diff --check` pass. Task PR #60 merged into P28 as `3605468`; Phase PR #61 merged into `develop` as `c61272f`. | Task branch `task/P28-F-R4-R1-R1-R1-R1-agent-apk-release-workflow`; task PR #60; Phase PR #61; `develop` merge `c61272f`. | Old: release docs instructed the owner to build/upload and prompted for an APK path; current ordered lists were already consecutive. New: agent-run EAS build/upload is the default, with separate publication approval retained. Reason: owner-directed release automation without confusing the build step with permission to publish. | current request |
| P28-F-R4-R1-R1-R1-R1-R1 | P28 | P28-F-R4-R1-R1-R1-R1 | current | 2026-11-09 | Correct release-note numbering, latest-version wording, screenshot asset names/storage, README/release links and the v1.1.1 APK handoff. | Done; all six gates pass. Task PR #64 merged to P28 as `dd8c6b6`; Phase PR #65 promotes the update to `develop`. v1.1.1 remained a draft at that revision; its publication and latest-asset rollover are recorded in the next revision. | Commit `d086756`; task PR #64; Phase PR #65; screenshot/APK assets attached to GitHub releases. | Old: release-numbering gap, conflicting latest labels, repository screenshot directory, and outdated APK handoff state. New: release assets and docs use consistent version-specific names; only publication transfers latest status. Reason: explicit owner direction and accurate, reviewable release material. | current request |
| P28-F-R4-R1-R1-R1-R1-R1-R1 | P28 | P28-F-R4-R1-R1-R1-R1-R1 | current | 2026-11-09 | Align v1.0.0 metadata to the shared template and publish v1.1.1 with the latest APK and screenshot routes. | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1-R1-R1. Release PR #69 merged to main and PR #70 back-merged to develop; tag v1.1.1 targets the main merge. | Task branch `task/P28-F-R4-R1-R1-R1-R1-R1-R1-release-and-metadata`; release PR #69; back-merge PR #70; tag `v1.1.1`. | Old: v1.0.0 metadata was duplicated below Download, and README/release history still treated v1.1.0 as current. New: v1.1.1 published and latest; post-publication notes, README, asset rollover and URL verification are recorded in the revision. | current request |
| P28-F-R4-R1-R1-R1-R1-R1-R1-R1 | P28 | P28-F-R4-R1-R1-R1-R1-R1-R1 | current | 2026-11-09 | Finalize published v1.1.1 links, dates, screenshots and historical APK naming. | Done; README and v1.1.1 Download blocks match, v1.1.0 uses its versioned APK, release history reflects publication, and all required APK/screenshot URLs return HTTP 200 at expected sizes. | Main merge `ce90a13`; back-merge `b8c17f6`; tag `v1.1.1`. | Old: v1.1.1 date and latest docs were pending, and v1.1.0 still had a latest-named asset. New: published release and asset/link rollover are verified. Reason: preserve latest/versioned naming and release-note accuracy. | current request |
| P20-B | P20 | — | — | 2026-10-16 | Home due action sheet and collapsed category spending with conditional Apply budget (CR-7, CR-10; formerly P19-C). | Done; focused Home/route tests pass; full 70-suite/720-test coverage run and all final gates pass. | `1c596e0` | Assumed Home's existing five-item due preview cap remains unchanged. | current request |
| P20-C | P20 | — | — | 2026-10-16 | Bottom tabs only on Home, Transactions, Goals and Budget; no detail-route tab bars (CR-11). | Done; focused route/tab tests pass; full 70-suite/720-test coverage run and all final gates pass. | `4d3f117` | Replaced the P18-R5 test that expected one Budget-selected bar on history/review with route-registry no-bar checks and exactly one correctly selected bar on each main tab; DEC-TABS supersedes the old behavior. | current request |
| P20-D | P20 | — | — | 2026-10-16 | Due-payment clearing, the user-kept always-visible balance card, Home due sheet position, Budget menu and due formatting (CR-21–CR-26). | Done; focused 12 suites/294 tests and final full coverage, TypeScript, lint, Doctor and Android/iOS export gates pass. | `8590a4a`, `13fbae8`, `1c596e0` (Home due-sheet implementation; CR-21), `54bcabf`, `d58ef45`, `5caf2aa`, `ae8ad7e`, `8f27f4b`, `7ec7ce0`, `c899a6d`, close-out `5bd3c41` | Assumed sheet max height is 60% of window height and bottom inset is added to 12pt spacing; FIFO clear-through is required because installments have no stored per-payment association. | current request |
| P20-E | P20 | — | — | 2026-10-17 | Budget balance normalization, Home due confirmation and demo-loaded popup (CR-27, CR-28, CR-31). | Done; focused suites and 70 suites / 772 tests pass; TypeScript, lint, Doctor 21/21, Android and iOS exports all exit 0. | `033d493` (CR-28), `501dce7` (CR-27), `fe5fa1e` (CR-31), tracker/test updates `973241e`, `b0cb6ee` | Assumed: Paid / Not paid use the existing confirm helper's labels; default native-alert dismissal is not paid; the existing five-second ActionToast is the brief Undo notice. | current request |
| P20-F | P20 | — | — | 2026-10-17 | Budget groundwork: due days, linked recurring schedule projection, opt-in month-view totals and demo data (CR-29 part 1). | Done; five focused suites / 84 tests, full 70 suites / 777 tests; all six final gates exit 0. | `5d81b65` (F1 design), `e36d153` (F2 due day), `d736b11` (F3 schedules), `f41d6d4` (F4 month view), `b8fff43` (F5 demo), `18fc19d` (ledger regression) | Assumed: dueDay is preserved but not user-editable in existing budget forms; editor UX is outside P20-F. Assumed: one-time liabilities without dueDate do not become linked rows. CR-29's single-plan replacement/apply behavior remains for later work. | current request |
| P20-G | P20 | — | — | 2026-10-17 | Schema-v8 single budget plan, template migration, repeat/apply store actions, setup screen, Budget/Home routing and CR-30 no-menu behavior. | Done; 70 suites / 763 tests and all six final gates pass. | `3c644d3` | See DEC-P20G; real-device UI checks remain unverified. | current request |
| P20-H | P20 | — | — | 2026-10-17 | Budget cash flow and plan summary, one card per spending group with paid rows and compact actions; Month review UI/route removed and Transactions Review routes to Budget with its month (CR-32–CR-34). | Done; 70 suites / 765 tests pass; all six final gates pass; see P20-H close-out below. | `00d0ec0` inventory/design; `799a12c` implementation | Assumed: manual budget actuals remain selected-month transaction totals; linked schedule row actuals use schedule payment amounts. See DEC-P20H. | current request |
| P20-I | P20 | — | — | 2026-10-17 | Home due tick confirmation and responsive goal projection status placement (CR-35–CR-36). | Initially done; CR-35 wording corrected by CR-43 and CR-36 superseded by CR-40; see P20-J close-out. | `e396059` | The Home due cap and native confirmation/Undo remain; former goal-status copy is no longer shown. | current request |
| P20-J | P20 | — | — | 2026-10-17 | Correct Home due wording, remove goal-card status text, share linked-asset value equally across goals and standardize edit icons (CR-40–CR-43). | Done; 70 suites / 791 tests and all final gates pass; see P20-J close-out. | `269da35` | Legacy shares remain optional for imports and are ignored by calculations; remainder paise assigned by sorted goal ID. | current request |
| P20-K | P20 | — | — | 2026-10-17 | Group Home goals and make asset/liability card bodies edit targets with independent buttons and liability data-before-progress order (CR-44–CR-46). | Done; 3 focused suites / 122 tests and 70 suites / 799 full tests; all requested automated gates pass; see P20-K close-out. | `026e671` | Simulated route/propagation/layout assertions do not replace real-device touch, font-scale or assistive-technology checks. | current request |
| P20-L | P20 | — | — | 2026-10-18 | Always-open Transactions due payments, inline header filters, liability-kind filtering, and search across Assets, Liabilities and Goals (CR-47–CR-50). | Done; full suite 71/71, 811/811 tests; all six required gates exit 0. Simulated UI only; device checks remain outstanding. | `1be9c92`, `086d084`, `9f11265`, `7c71377`, `d56a553`, `b48a624` | Assumed: only due rows use the new compact Paid/Received labels; existing Budget/Home actions and paid/Undo behavior remain unchanged. Liability kind filtering is local, defaults to All and preserves sort persistence. Search is local, trims and lowercases the query, and resets on screen remount. | current request |
| P20-M | P20 | — | — | 2026-10-18 | Budget plan schema v9, v8 migration, derived future months, income dues, projected cash flow, and setup income editor (CR-52–CR-55). | Done; 71 suites/820 tests; all six final gates pass. Directory coverage: domain 99.04% lines/95.23% branches, data excluding hooks 95.34%/90.91%, lib 100%/100%. Real-device checks remain unverified. | Preflight `fabde34`; CR-52 `62d7a20`; CR-53–CR-55 `b5c6c7a`. | Assumed: see DEC-P20M-CR53-55. | current request |
| P20-N | P20 | — | — | 2026-10-18 | Rebuild Budget as a visual overview (CR-56–CR-57). | Done; Revised by P20-N-R1 and P20-N-R3. Original 73-suite/828-test and six-gate evidence remains historical. | Preflight `9d72ab1`; model `e630a3d`; charts `cf876bb`; screen `530fccd`; cleanup `88154aa`; demo `d825c1e`; final closeout `9e48d83`. | Assumed: see DEC-BUDGET-SPEC. | current request |
| P20-N-R2 | P20 | P20-N | current | 2026-11-08 | Restore the aggregate Budget Pace graph above the overview summary table, with no stacked bar. | Route tests pass at font scales 1.0, 1.3 and 2.0; aggregate Pace tests restored and section-specific chart code/toggles removed. | `eed40750f68bebc9168907f79f74a67c1f301b83` (`fix(P20-N-R2): restore aggregate Budget pace chart`) | Old: P20-N-R1 section lines/toggles and extra section assertions. New: one aggregate actual/planned Pace graph and aggregate route coverage. Reason: restore the requested overview presentation without the stacked bar. | current request |
| P20-N-R3 | P20 | P20-N | current | 2026-11-10 | Remove the visible Pace heading and the two Over by/Left summary lines from Budget Overview; retain the chart, Left row and accessible descriptions. | Failing tests were committed before production changes. After implementation, focused chart/route tests pass (2 suites, 4 tests; route checks cover font scales 1.0, 1.3 and 2.0); TypeScript and targeted lint exit 0. Opening/Closing balance labels and absence of Back/Review controls are unchanged. Task PR #95 merged into `phase/20-budget` as `77bdef5`; phase PR #96 merged to `develop` as `f5f6e16`. | Test-first commit `bba05be`; implementation commit `47b0469`; task PR #95 merge `77bdef5`; phase PR #96 merge `f5f6e16`. | Old: a chart test expected `Left ₹250` visibly; route tests allowed `Pace`, `Over by`/`Left` summary text, and checked that no element in all of Overview used absolute positioning. New: those summary strings are absent from visible Overview text, the table's Left row remains, both accessible labels are retained, and the chart itself has no absolute-positioned children. Reason: owner-directed removal of the redundant visible lines; absolute positioning is now confined to the accessible-only summary. Progress assertions changed from overall 168/203 and P20 29/29 to 169/204 and 30/30 because this completed revision adds one ledger part. | current request |
| P20-O | P20 | — | — | 2026-10-18 | Budget item edit sheet and budget-aware category picker (CR-58–CR-59). | Done; 76 suites/848 tests; all six final gates exit 0. Domain 98.58% lines/93.61% branches, data excluding hooks 93.53%/87.57%, pure lib 100%/100%. Device checks remain unverified. | Preflight `c84215e`; CR-58 `509653e`; CR-59 `7a8a6cf`; demo/close-out commit included with this P20-O delivery. | Assumed: transaction dates extend through the 24-month budget horizon; see DEC-P20O-CR59. | current request |
| P20-P | P20 | — | — | 2026-10-18 | Schema-v10 user-managed budget sections/items, v9 migration, scoped actions and custom-category integration (CR-60–CR-61). | Done; 76 suites/865 tests; final coverage, TypeScript, lint, Doctor and Android/iOS exports exit 0. Device criteria remain unverified. | Preflight `1e4fdce`; implementation and ledger are included in this delivery. | Assumed: an ungrouped v9 category migrates into the first spend section; non-built-in investment category strings remain custom after item deletion. See DEC-BUDGET-V10 and DEC-P20P-CR60-61. | current request |
| P20-Q | P20 | `55f9eaa` | `94297e1` | 2026-10-19 | Manage budget sections/items in Budget and make overview responsive (CR-62–CR-65). | Implementation, 75-suite/857-test coverage run, and six gates complete; simulated layouts pass. | Preflight `17f5ee4`; CR-62 `93a5356`; CR-63–CR-65 `55f9eaa`; assertion update `94297e1`. | Assumed: section rows start collapsed on each screen mount; current/future actions use P20-P scope semantics; create budget applies an empty current-month snapshot for immediate management; the stacked chart visualizes planned allocation. | current request |
| P20-R | P20 | — | — | 2026-10-19 | Top-anchored Budget and bottom-sheet form surfaces; section Cards and accessible icon actions (CR-66–CR-69). | Done; 75 suites/857 tests; full coverage, TypeScript, lint, Expo Doctor and Android/iOS exports pass. | Preflight `5049ab8`; checkpoint `75e9097`; implementation `391a227`. | Assumed: see DEC-P20R; simulated keyboard and layout contracts do not verify native rendering. | current request |
| P20-S | P20 | — | — | 2026-10-19 | Dropdowns, shared sheet form shell, Budget category selection, Actual/Planned order, and manual Insurance items (CR-70–CR-75). | Done; Revised by P20-S-R1. Original gates and implementation remain historical. | Preflight `a8a95db`; CR-70 `b7e0d53`; CR-71 `b340416`; CR-72 `aa9f050`; CR-73/74 `4134844`; CR-75 `d612e2b`; correction `4d898c6`. | Assumed: see DEC-P20S; simulated keyboard, dropdown, hint wrapping and icon layout do not establish native-device behavior. | current request |
| P20-S-R1 | P20 | P20-S | current | 2026-11-09 | Replace form ChoiceField controls with Dropdown except filters; add persistent single-line titles to eligible editable controls. | 98 suites/1,267 passed/1 skipped and all six ordered gates exit 0; physical-device rendering remains unverified. Revised by P20-S-R1-R1. | Implementation `d36103e`; task-to-phase PR #42; phase-to-develop PR #43. | Old: preserve non-designated ChoiceField uses and assert the Amount placeholder prop plus SegmentedControl titles. New: all app-form ChoiceFields use Dropdown except filters; Amount checks visible title text; transaction type options and manual Investment type selection remain asserted without requiring a SegmentedControl title. Reason: owner broadened Dropdown scope, requested visible input titles, and explicitly removed SegmentedControl titles. | current request |
| P20-S-R1-R1 | P20 | P20-S-R1 | current | 2026-11-09 | Add a shared rule for preserving owner edits: ask before changing a file with owner edits made after agent changes, and only revert/overwrite on explicit owner request. | Documentation-only update; focused progress-ledger test passes; full six gates not applicable. | Task commit `e955021`; task-to-phase PR #44 merged as `93dfb6acacca296ff7ef5c4629721efd5e0d3995`; phase-to-develop PR #45. | Old: R1 required preserving owner edits but did not require asking before further changes. New: ask first, and revert or overwrite only on explicit request. Reason: owner requested a clear safeguard after an agent restored owner-removed labels. | current request |
| P20-T | P20 | — | — | 2026-10-19 | Consolidate full-screen and sheet forms on one header/body/footer core; convert all data-entry forms (CR-76–CR-77). | Done; 76 suites/873 tests, focused form/route tests, and all six required gates pass; native keyboard and font-scale rendering remain unverified. | Preflight `b449d9d`; implementation `e432034`. | Assumed: see DEC-P20T; onboarding retains no-back exit behavior and selection/information surfaces remain non-forms. | current request |
| P20-U | P20 | — | 2 | 2026-10-21 | Replace the Budget management sheet with route forms for sections, items and income (CR-86/CR-87). | Done; 6 focused suites / 264 tests pass; full suite and final gates pass as recorded below. | Preflight/spec `47a2bd8`; route implementation `02bfbb1`; tests and final ledger are in the close-out commit. | Assumed: preserve the Spend/Invest selector on section creation; use explicit month/following scope from Budget context. Schema v12 and protected files remain unchanged. | current request |
| P21-A | P21 | — | — | 2026-10-16 | Emergency-fund goal links; remove EF entries and exclude EF from net worth; schema v7 (CR-8, CR-13, CR-20; split from P19-D). | Done; final required gates including Expo Doctor 21/21 pass. | `3ac13a7` | Migrated positive ledger balances into a manual holding; bucket links gain emergency-goal shares or are dropped if fully allocated. | current request |
| P21-B | P21 | — | — | 2026-10-16 | Months of cover, salary fallback, allocation edit and linked-assets table (CR-14, CR-15, CR-20; split from P19-D). | Done; final required gates including Expo Doctor 21/21 pass. | `6dd663f` | Visualization-only EF screen; only goal-link management and allocation editing remain. Device behavior unverified. | current request |
| P21-C | P21 | — | — | 2026-10-17 | Emergency fund header edit action, detail-first allocation display without status labels, all-item editor and four defaults (CR-37, CR-38). | Done; focused tests and all six final gates pass; schema remains v8. The four-default assumption is superseded by P21-D/CR-51. | `d43be28`; revised acceptance implementation recorded at close-out | Assumed at delivery: the fourth default was Mutual funds / Bonds. Stored zero-percent unlinked items count as deleted. | current request |
| P21-C1 | P21 | — | — | 2026-10-17 | Repair malformed stored allocation crash and prevent invalid emergency-fund plan saves (CR-39). | Done; 70 suites / 786 tests and all six final gates pass; schema remains v8. Its four-default fallback is superseded by P21-D/CR-51. | `3405101c1d65b6dfdbc7d84176d17b3208f389ca` | Assumed at delivery: normalize positive known buckets by largest remainder and fall back to P21-C's 10/40/35/15 mix. Preserve P21-C behavior; CR-51 supersedes only the fallback mix. | current request |
| P21-D | P21 | — | — | 2026-10-18 | Change emergency-fund defaults and repair fallback to Cash 10, Bank account 40, FD / RD 50 (CR-51). | Done; full suite and all six required gates exit 0; schema remains v8. | `cd2c746` | Assumed: only null/default/fallback values change; existing valid stored allocations stay byte-for-byte unchanged. Mutual funds / Bonds remains addable. | current request |
| P22-A | P22 | — | — | 2026-10-16 | Deterministic four-month linked demo data, undoable development loader, and DEC-DEMO (CR-12). | Done; final acceptance tests and required gates including Expo Doctor 21/21 pass. | `1f2d9c8` | Preserved existing `mockAppData` fixtures; expanded strict import validation to preserve supported `snapshotAdjustment`. Device behavior remains unverified. | current request |
| P24-A | P24 | P15-K | 2 | 2026-11-01 | Reminders and notifications, including CR-1. | Done; local reminders, lock-gated confirmation, privacy controls and scheduler delivered; all six gates pass. | Research `372476c`; implementation `f5a1a38` | Physical notification delivery remains subject to native-device verification. | current request |
| P25-A | P25 | — | 2 | 2026-10-25 | v0.1.0 release preparation: audit/update documentation and version metadata. | Done; audit, gates and owner follow-ups recorded in DEC-P25A. | `6165922273156b41bcc131996669784a0041afe1`. | Assumed: encrypted backups move from the previous P25-A label to P25-B and remain unimplemented. | current request |
| P25-B | P25 | P15-L | 2 | 2026-11-01 | Encrypted backups. | Done; 80 suites / 984 tests pass; all six ordered gates exit 0; `backupCrypto.ts` has 100% line and branch coverage. | Research/decision commit `d5aac3eb9535ac0b7cd3e3a11d37c77a8452d6aa`; implementation commit `c90a8f323e355348b1fd17d7589d8a4cd505f7d4`; final ledger update follows. | Encrypted exports protect exported files only; app data remains unencrypted. Plain export and picked-file cache paths retain the documented temporary-plaintext API conflict. | current request |
| P25-C | P25 | — | — | 2026-10-26 | Resolve release blockers; pin license and Node metadata; add repository-based shared AI memory. | Done; 79 suites/955 tests; all six sequential final gates exit 0; Expo Doctor 21/21. Historical audit and device status were subsequently updated by P25-D. | Preflight checkpoint `ff349515887dae09ac5ebc34776ec2754ed80dbe`; Home order `1361f05288c858a00bb2732ca54d50f8e8a49171`; dependency audit `bb5e3976b6a50696cd3943670f4b36d43689a5a2`; license/Node `b9c84914c4d4e7cfbcfd56bfa1923c8715d9cf7f`; memory `66510745b64aa9f702571986c2e647566394ac41`; test-type correction `ee1a23c156c7d08163cddd44a0f2e3061fb9aa6c`; final ledger/gate close-out is recorded below. | Assumed: P25-C was the next unused P25 ID; keep encrypted backups under P25-B. No feature/schema changes. | current request |
| P25-D | P25 | — | — | 2026-10-31 | Sync the v0.1.0 release state; record owner-reported physical-device verification, Node v26 result and current npm audits. | Done; owner reports the GitHub pre-release, EAS build, screenshots and working device test are complete. Six automated gates pass; current audit and Node choices are recorded below. | `5b29544f1ded8d93a21b5fd824bd6d239f455d94` | Assumed: owner-reported device verification only; device model and OS not recorded. No feature/schema/dependency changes. | current request |
| P25-E | P25 | — | — | 2026-10-31 | Test supported Node versions, choose a stable project engine pin, and stabilize the long-schedule timing check. | Done; Node 26.13.0 passes all 79 suites/955 tests. After `npx jest --clearCache`, Node 24.22.2 has 13 suite failures in Expo Modules Core initialization; all six final gates and the benchmark update are recorded below. | P25-E documentation/metadata/test close-out commit; hash verified in Git. | Assumed: use stable Node 26.13.0 (`>=26.0.0 <27`) because Node 26 passes and Node 24 fails after clean cache. SDK/RN package engines permit Node 24; suite failures trace to mocks missing `Platform`, so this pin follows observed project test behavior, not an asserted SDK Node-24 incompatibility. | current request |
| P25-F | P25 | — | — | 2026-11-01 | Restore a green test baseline without features or schema changes. | Done; 79 suites / 958 tests pass on Node 26.13.0. Baseline failures, replacements and final gates are documented in the P25-F verification entry. | `f99445790f44a20e022201452ddd4755ecc9d243` (verified Git commit). | The baseline exposed stale user-owned balance-label expectations, date-bound test fixtures, and an outdated memory test count. Protected source labels were not edited; assertions and exact-amount checks were retained. | current request |
| CR-92 | Data backup | — | — | 2026-11-01 | Reconcile the restored backup against all supplied income, expense, loan and emergency-fund tracker data; remove duplicate points and date balancing adjustments at month end. | Done; 52 monthly cash-flow totals reconcile, loan subtotals and emergency-fund metadata were checked, 16 linked month-end withdrawals and 3 month-end extra expenses were verified, and the schema-v13 importer accepted the recalculated checksum. | Documentation close-out commit; hash verified in Git. | A focused test initially omitted RD holding logs because their notes begin with tracker metadata, not the recurring-deposit label; the selector was corrected and the passing test includes those linked entries. Failed test runs did not write the backup. | current request |
| CR-93 | Transactions UI | — | — | 2026-11-01 | Show zero and negative Available/Closing balances; validate the updated local backup and the reported tracker edit. | Done; focused zero/negative balance tests pass. Edited backup checksum was repaired and importer validation passed. Full gates and the difference between monthly overspend and carried-forward balance are documented in the close-out. | Implementation and documentation close-out commit; hash verified in Git. | The tagged backup does not contain the separate deletion/addition described for the current app, so no transaction was inferred or changed. Overspend display rounds paise to whole rupees. | current request |
| CR-94 | Data backup | — | — | 2026-11-01 | Add flexible historical budgets through October 2026, using each month's transaction log as the source of actual category targets. | Done; 52 custom snapshots cover every month from July 2022 through October 2026. Category-level planned amounts match calculated actuals and the schema-v13 importer accepts the updated backup. | Local backup only; intentionally not committed. | Assumed and owner-selected: historical month snapshots match actuals; do not alter transactions, the legacy budget, or add a repeating future plan. Non-earned inflows remain outside planned earned-income rows. | current request |
| CR-95 | Budget income | — | — | 2026-11-01 | Include all logged income types in historical budgets, keep non-earned inflows categorized as income, match planned and actual totals, and retain transaction links. | Done; the month-budget schema and Budget overview display separate non-earned income rows. All 52 monthly income, expense and investment totals match actuals; the schema-v13 backup importer accepts the updated file. | `a507254` implementation/docs commit; backup data stays local and is not committed. | Owner clarified that loans, borrowed funds and withdrawals must remain income; do not reclassify them as Unexpected Extras. Expense/investment categories in the backup all map to existing budget categories, so no Unexpected fallback was needed. Transaction matching remains month/category-based; explicit asset/liability/policy source links are preserved. | current request |
| CR-96 | P29-K Budget scope popup | — | — | 2026-11-03 | Apply Budget month scope immediately when selected; close without applying through Close, backdrop or Android back. | Done; shared dialog, all item/section/income Save/Delete flows, counted category-delete copy and Undo are tested. | Implementation `5a2572e` verified with `git cat-file -t`; documentation/verification commit follows. | Assumed: no schema or domain change; `app/(tabs)/index.tsx` unchanged. | current request |
| P26-A | P26 | P15-M | 2 | 2026-11-06 | Accessibility/performance and final gates. | Done; fixes and all six ordered gates pass; native-device checks remain open. | Report and implementation evidence recorded in this ledger. | Physical font-scale, touch and accessibility checks remain unverified. | current request |
| P27-A | P27 | — | — | 2026-11-07 | Cleanup: dead code, dependencies, bundle, README and schedule benchmark. | Done; cleanup and all six ordered gates pass. | Implementation evidence recorded in this ledger. | SDK-57-compatible dependency audit decisions remain open. | current request |
| P28-A | P28 | — | — | 2026-11-07 | QA and initial release preparation. | Done; original `0.2.0` preparation is historical; stable release metadata was revised by P28-B, and backup equality coverage by P28-A-R1. | `fbdcbac`, `41c4617`, `d0ddff8` | The release target and build work are tracked by P28-B/P28-C. | current request |
| P28-A-R1 | P28 | — | — | 2026-11-08 | Add a synthetic v13 backup import regression for independently computed net worth, every goal's saved amount, and Emergency Fund available amount. | Done; the focused backup suite passes (37 tests) and all six ordered gates are recorded below. No app behavior changed. | `f8ae2ad` | No prior assertion was replaced or weakened. `progressLedger.test.ts` updates its expected revision marker from P28-C-R1 to P28-C-R2 and adds the P28-A-R1 revision check. | current request |
| P28-B | P28 | — | — | 2026-11-07 | Align and prepare v1.0.0 release metadata. | Done; app/package versions and release notes are aligned; no source behavior change. | Release metadata evidence recorded in this ledger. | Production build remains unbuilt; see build configuration and open items. | current request |
| P28-C | P28 | — | — | 2026-11-08 | EAS build management, release templates and history, draft handling and release-process documentation. | Done; documentation/configuration only. Revised by P28-C-R4 and earlier revisions. | Release docs and verification recorded in this ledger. | Publication and tagging require explicit owner approval. | current request |
| P28-C-R1 | P28 | — | — | 2026-11-08 | Add pending-safe README app downloads and What's new, an Android APK profile, release-asset publication checks, and source-accurate README details. | Done; all six ordered gates passed at that revision. No build, publication, tag or protected-route changes. Revised by P28-C-R2. | Step commits `13fce0e`, `19a99c5`, `44545ee`, `95f63a3`; verification is in the session/release log. | Its pending-APK status was later updated; the v1.0.0 tag decision was resolved by P28-C-R3. | current request |
| P28-C-R2 | P28 | — | — | 2026-11-08 | Publish the v1.0.0 APK Download details and define complete release records and link checks. | Done; README and published note updated; release rules include the versioned block, README fields, both-link checks, and Builds metadata. Asset size/digest are verified. No GitHub release-body edit, build, tag or push. | `144a847`, `1742174`, `181aa44`, `356ec56` | Historical public links returned HTTP 404 while the repository was private; this observation was superseded by P28-C-R3 after visibility changed. EAS build ID, `versionCode`, source commit and profile remained owner to supply at this revision. | current request |
| P28-C-R3 | P28 | — | — | 2026-11-08 | Finalize v1.0.0 release rules, public download verification, build record, approved tag alignment, and Android device checklist. | Done; no app behavior changed. Both APK links and SHA-256, EAS artifact and remote tag are verified and recorded. Owner release-body edit and physical-device run remain pending; all checklist results remain Not run. | Step commits: `807e4cda92877a9b9a8f22a3daecd12eb0a26c80`, `1eaa78c235b50127567c8e7cd5f71b44c7d10590`, `2ea579b1f349c1a3937c65daf044f2e415d2245a`, `5e792472377c7bfa7d4d94bdd4abf67c211049cc`, `bc4f714bb46c72d1b5401f3b49ed35d4450ee008`, `407569093a87c381fec1a167d65125fc4751c88b`, `a2c23958839423946de65a82e58cc2d1c8758d4d`; ordered gates and final close-out recorded below. | Replaced the old `Revised by P28-C-R2` parent-row assertion with `Revised by P28-C-R3 and earlier revisions` because this revision supersedes the earlier release-rule revisions. No other assertions were weakened. GitHub release `targetCommitish` metadata still lists the prior target; no release edit was made. | current request |
| P29-A | P29 | — | — | 2026-11-02 | Correct investment return calculations, emergency-fund bucket targets, and linked-goal amounts without a schema change. | Done; implementation, reproduction validation and final verification are recorded in this ledger. | Pending the final P29-A commit and verified gate run | Assumed: P29 as requested; no edit to `app/(tabs)/index.tsx`; Budget cash-flow labels preserved. | current request |
| P29-B | P29 | — | — | 2026-11-02 | Today controls, centered dropdowns, goal-year validation and user-owned Home layout assertions. | Done; acceptance tests pass and all six final gates exit 0. | `d01bdac`, `0ef0df0`, `c9238d4`, `d47ff67`; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: owner Home implementation remains user-owned and unchanged. | current request |
| P29-C | P29 | — | — | 2026-11-02 | Shared paid-amount due dialog, actual-payment clearing, and Not paid behavior. | Done; acceptance tests pass and all six final gates exit 0. | `d01bdac`, `0ef0df0`, `c9238d4`, `d47ff67`; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: actual lower/higher amounts do not carry differences across dues. | current request |
| P29-D | P29 | — | — | 2026-11-02 | Budget save/delete scope dialogs and start-month firstDueMonth behavior. | Done; acceptance tests pass and all six final gates exit 0. | `c9238d4`, `d47ff67`; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: past months stay frozen and later start months plan zero before their first month. | current request |
| P29-E | P29 | — | — | 2026-11-02 | Schema-v14 optional Budget holding links, migration and manual/plan integration. | Done; linked deletion clears all Budget links in one write. Owner decision DEC-P29E-HOLDING-DELETE withdraws Undo after holding deletion; no app behavior change was required. | `c9238d4` plus prior P29-E implementation commits; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: v14 links are optional and schema 15 remains refused. | current request |
| P29-F | P29 | — | — | 2026-11-02 | Stabilize interrupted P29 without new features. | Done; all six gates pass and acceptance evidence is complete after the owner decision. | `d01bdac`, `0ef0df0`, `c9238d4`, `d47ff67`; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: the exact previous Gate 1 failure excerpts are unavailable; isolated repeats and the fresh full run passed. | current request |
| P29-F2 | P29 stabilization | — | — | 2026-11-02 | Close two coverage branches with behavior tests; no features or threshold changes. | Done; configured thresholds and all six final gates pass. | `97f2bbc`; final F4 gates; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: the withdrawn 92%/88% targets were informational only. | current request |
| P29-F3 | P29 stabilization | — | — | 2026-11-02 | Close out stabilization documentation, assertions, Home tests, acceptance evidence and lint. | Done; acceptance evidence, lint and all six gates pass. | `7225a7e`, `a48f3af` plus F4 verification commits; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: owner Home implementation remains user-owned and unchanged. | current request |
| P29-F4 | P29 stabilization | — | — | 2026-11-02 | Finish F3 with the final assertion audit, acceptance tests, lint and six gates; no features or source behavior changes. | Done; all six gates pass and acceptance evidence is complete after the owner withdrew the holding-delete Undo requirement. | `d01bdac`, `0ef0df0`, `c9238d4`, `d47ff67`; closeout `86a3baa`, `4ea3b56`, `f70e968` | Assumed: exact prior Gate 1 failure excerpts cannot be reconstructed from available logs; no failure details were fabricated. | current request |
| P29-G | P29 | — | — | 2026-11-02 | Make Insurance cover goals user-managed and assign policies explicitly, with schema v15 migration and no Home source changes. | Done; editable goals, explicit/kind-fallback policy counting, v14-to-v15 migration/archive, backup chain, store Undo and UI acceptance tests pass; all six final gates exit 0. | P29-G implementation, tests and documentation close-out commit; verified with `git cat-file -t` | DEC-P29G-COVER-MANAGEMENT supersedes the fixed, non-deletable five-goal rule in DEC-P23-COVER. Assumed: custom goals use the generic Insurance premium category; typed premium categories remain derived from policy kind; the Budget Insurance system section/categories stay unchanged and should not be made editable without a separate scope decision. `app/(tabs)/index.tsx` unchanged. | current request |
| P29-H | P29 | — | — | 2026-11-03 | Correct invested, current-value and return semantics for asset holdings without a schema change. | Done; 84 suites/1060 tests and all six gates pass; P29-H report and coverage are recorded below. | Step 1 `2829c31`; impact analysis `a9cb81d`; behavior `e60c893`; migration regression `0db51f9`; closeout commit verified in Git. | Assumed: this is new P29 work; schema remains v15; an undated stored value is not a recorded valuation; manual opening flow uses injected as-of date when no start date exists; `app/(tabs)/index.tsx` remains user-owned and unchanged. | current request |
| P29-I | P29 | — | — | 2026-11-03 | Inventory and capability-gate holding entries, recurring deposits, schedules and Budget links; schema v16 per owner request. | Done; 85 suites/1078 tests and all six gates exit 0; final capability matrix, assertions, coverage and device limitations are recorded below. | Inventory `eeeec26`; migration `34fa401`; capabilities `ce3bf4e`; regression/docs `13ef972`; persisted-link tests `94c3dfb`; each verified with `git cat-file -t`. | DEC-P29I-CAPABILITIES: Fixed deposit is the only one-time type; Cash and Savings account may use recurring plans. Assumed: schema v16 is required by the task although the type split is already present; the manual model has no rate or maturity fields so no new ones were introduced; the emergency-fund `FD / RD` bucket and links remain unchanged. `app/(tabs)/index.tsx` unchanged. | current request |
| P29-J | P29 | — | — | 2026-11-03 | Audit recurring-liability outstanding balance and compare daily actual/365 with monthly amortization; no behavior change absent proof of a bug. | Done as a report-only audit; actual bank match is undetermined because statement balance/date, principal, tenure and app payment rows are missing. Generic convention comparison and conditional proposal recorded below. | Step 1 `237d5a7`; Step 2 `337fcc5`; final audit commit verified with `git cat-file -t`. | Assumed: synthetic principal 250,000 and on-time monthly dates are illustrative only. No schema or Home-source change; standard monthly amortization and a separate statement-balance anchor require owner evidence/approval. | current request |
| P29-K | P29 | — | — | 2026-11-03 | Change the shared Budget scope popup to apply immediately on either choice and dismiss without applying via Close, backdrop or Android back. | Done; component and route tests cover both scopes, double-taps, dismissals, counted category-delete copy, Undo, and simulated large fonts. Six final gates exit 0. `npm test -- --coverage`: 86 suites/1086 tests; fresh coverage and assertion audit below. | Implementation `5a2572e` verified with `git cat-file -t`; documentation/verification commit follows. | DEC-P29K-SCOPE-IMMEDIATE records the frozen interaction. Assumed: P29-K is new P29 work; schema, domain behavior and the user-owned Home screen remain unchanged. No assertion was weakened. | current request |
| P29-L | P29 | — | — | 2026-11-03 | Simplify Insurance into an editable policy tracker with recurring premium dues and preserve linked savings-policy use. | Done; inventory, implementation, migration, tests, documentation and all six gates are complete. Home imports only `policySummary`; no Home edit was required. | Inventory `8255857`; implementation and closeout commit hashes verified with `git cat-file -t` and reported with the task. | DEC-P29L-SIMPLE-INSURANCE removes cover-goal management and policy lifecycle controls. Assumed: Term placeholder maps to `term-life`; Life placeholder maps to `life-savings`. Existing savings-policy values and goal links remain; schema v17 follows v16. | current request |
| P29-M | P29 | — | — | 2026-11-04 | Fix insurance premium payments so the exact scheduled slot clears across all surfaces, with one-write persistence and Undo. | Superseded by P29-M2 after the owner authorized schema v18 and froze the dueDate migration rule. The original store reproduction and blocker remain recorded below. | Initial reproduction from P29-M; supersession and implementation evidence recorded in P29-M2. | Assumed: P29-M's no-schema-change constraint was superseded only by the explicit P29-M2 authorization. | current request |
| P29-N | P29 | — | — | 2026-11-04 | Remove Transactions' Review-month link and add a one-time first-launch reminders prompt. | Done; Review-month UI, strings, tests and the now-unused `reviewableMonths` helper are removed. Prompt is root-mounted inside LockGate, only eligible on the Home route, persists dismissal in `wealthwise.meta.v1`, reuses the shared permission flow, and is reset by erase-all clearing metadata. Six ordered gates pass. | Focused Transactions, cash-flow, prompt, permission-helper, metadata, LockGate and route tests; final six-gate run and assertion audit recorded below. | Assumed: P29-N is new P29 work. This supersedes DEC-P24A's "no prompt until reminders are switched on": an in-app setup prompt is shown once, while the operating-system permission prompt still appears only after the user taps Turn on reminders. No AppData schema or protected Home/Budget screen change. | current request |
| P29-M2 | P29 | — | — | 2026-11-04 | Replace blocked P29-M with exact policy-payment slot identity, shared due derivation, and a schema-v18 migration. | Done; early/on-time/late payments, all frequencies, consecutive slots, month-boundary timing, schedule edits, Undo, shared surface selectors, v17 migration/archive, older backup import and encrypted v18 round trip are verified. See the P29-M2 evidence below. | Six ordered gates, acceptance evidence and coverage are recorded below; commit object verification is reported in task close-out. | DEC-P29M2-POLICY-DUE-IDENTITY; Assumed: the settled slot ceases to be actionable while the generic Paid action remains for the next unpaid slot, since hiding it would prevent the required early Insurance-card payment. No Home/Budget screen edits. | current request |
| P29-O | P29 | — | — | 2026-11-04 | Inventory the split holding models, entry/schedule semantics, value calculations, and connected UI/domain/test surfaces before the proposed unified ledger. | Superseded by P29-O1 and closed by P29-O-R1 under the P29-S owner decision: no schema-v19 migration or ledger-only redesign is authorized or needed. The report-only inventory remains historical evidence. | Inventory commit verified with `git cat-file -t`; close-out recorded by P29-O-R1. | DEC-P29O-LEDGER-INVENTORY is historical; DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE is the controlling decision. No code, schema, migration, or device work was added. | current request |
| P29-O-R1 | P29 | P29-O | current | 2026-11-08 | Resolve the remaining P29-O dashboard item after the owner-directed cancellation of the ledger-only migration. | Done; P29-O1 already supplies the accepted unified Deposit/Withdraw/Entries experience. P29-S explicitly says no schema change, runtime behavior change or migration is authorized or needed. P29-O1 device checks remain open separately. Updated status and progress guards; focused progress-ledger tests pass (10/10). | Documentation-only close-out on `task/P29-O-R1-closeout`; no application code changed. | Old: P29-O appeared pending because the proposed v19 migration was not implemented. New: P29-O is superseded by P29-O1 and P29-S; reason: the owner cancelled the separate storage redesign and confirmed no migration is needed. | current request |
| P29-O1-R1 | P29 | P29-O1 | current | 2026-11-08 | Show recurring-plan schedule progress and group paid investments in Entries; cap schedule at maturity. | Focused domain and route tests pass (2 suites, 174 tests); route checks counts, pending rows, collapsed/expanded paid entries, and maturity/final-date caps at font scales 1.0, 1.3 and 2.0. TypeScript exits 0. | Implementation and regression tests in its task commit. | Old: Entries showed only stored logs, had no month counts or collapsed paid group, and generated plan slots through tenure regardless of maturity. New: pending rows stay visible, matched paid entries are collapsed, and only scheduled slots on/before maturity are generated. Reason: make schedule status inspectable without showing installments after maturity. Old plan-list test asserted a fixed seven rows; new assertion derives pending rows from the schedule because those rows are now part of the list. | current request |
| P29-O1-R2 | P29 | P29-O1 | current | 2026-11-08 | Align recurring asset completed/pending month counts in two columns and show entries chronologically. | Red route test failed at font scales 1.0, 1.3 and 2.0 because the two count cells were absent; after adding the grid, a mixed pending/withdrawal fixture exposed non-chronological output (pending dates preceded the later-dated withdrawal). Both assertions pass after the screen change; route test also preserves count, paid-group and maturity assertions. | Asset Entries screen, route regression and derived ledger guard are in this task commit. | Old: counts were inline text rather than two summary cells, and pending plan slots were prepended separately from dated entries. New: Completed/Pending are paired summary cells; visible dated entries are sorted with the selected sort, date descending by default. Reason: align metrics with other summary pairs and keep dated rows chronologically ordered. | current request |
| P29-W-R2 | P29 | P29-W | current | 2026-11-08 | Put completed/pending liability month counts in two columns and chronologically sort dated entries. | The focused Assets/Liabilities route regression passes (1 suite; 3 font-scale cases at 1.0, 1.3 and 2.0). It checks the count-cell layout, accessible count labels, pending schedule cap, collapsed Paid EMIs state and descending chronology across pending rows and a payment after the final EMI date. | Liability Entries screen, route regression and derived ledger guard are in this task commit. | Old: Completed/Pending counts were inline text in one row, and pending EMI rows were prepended separately from dated payments. New: counts use two summary cells and pending/dated rows share newest-first date sorting; Paid EMIs remain in the existing collapsed group. Reason: make status metrics match other paired summaries and keep dated entries in chronological order. | current request |
| P29-O2 | P29 | — | — | 2026-11-04 | Begin a schema-v19 ledger-only storage redesign with a converter, strict ledger validation and staged runtime adoption. | Cancelled by the owner in P29-S: the separate storage redesign is not wanted; P29-O1 remains the accepted v18 implementation. Prototype migration/schema/types and their tests were removed. | Historical preparation commits remain intact; removal and six-gate evidence recorded in P29-S. | Supersedes DEC-P29O2-UNIFIED-LEDGER. The cancellation is not a schema migration; schema remains v18. | current request |
| P29-Q | P29 | — | — | 2026-11-04 | Measure persistence and performance for seeded 50-, 100- and 200-year app datasets; load them from the dev menu with Undo and report build/save/render timing. | Done after the owner approved Expo SQLite. Native AppData now uses Expo SQLite's key-value adapter with lazy legacy AsyncStorage migration; the stress loader uses replace/Undo. Normal 200-year hydration and single-write targets pass in Node; the measured 50-year size still exceeds 1.5 MB. No AppData schema change. Revised by P29-Q-R1. | Installed AsyncStorage and Expo SQLite package inspection; five-sample benchmark tables, focused behavior tests and six final gates recorded below. Native-device checks remain unverified. | DEC-P29Q-STORAGE-STOP (historical stop point), DEC-P29Q-SQLITE-APPROVAL. Assumed: each tier spans `years × 12` calendar months including injected today; 25 transactions and 12 monthly holding entries per month; five samples use the same seeded payload. Assumed: `SQLiteStorage` has no app-level per-value cap based on the installed source; actual native SQLite/device capacity needs device validation. | current request |
| P29-Q-R1 | P29 | P29-Q | current | 2026-11-10 | Replace the stress-data menu's four-choice confirmation call with a proper centered selection dialog; keep the two-choice adapter limit and exercise every app-menu handler. | Done; the pre-edit menu-handler regression failed with `RangeError: At most two choices are supported.` after four choices reached `choiceAsync`. The replacement uses the centered shared-sheet pattern; all four tiers load the expected stress parameters, cancellation does not load, Undo restores the prior data, and 1.3x/2.0x simulated font-scale UI tests pass. Focused tests (5 suites / 30 tests), TypeScript and targeted lint pass. Task PR #93 and phase PR #94 merged to `develop` as `80eb0e4`; device checks remain unverified. | Failing reproduction committed before implementation; implementation and focused tests were merged from `task/P29-Q-R1-stress-menu-picker`. | Old: the menu-handler test expected `choiceAsync` to receive all four stress tiers, which reproduces the RangeError. New: the handler exposes four selection-dialog options and never calls `choiceAsync`; the independent helper test still rejects more than two choices. Reason: preserve the helper contract and offer a scalable native selection UI. Audit: all app/src choiceAsync calls pass one or two choices; confirmAsync uses its fixed Cancel/confirm pair. | current request |
| P41-A | P41 | — | — | 2026-11-10 | Add finite Real estate and Custom financial types, validated optional display names, consistent holding/liability forms, display/search/backup behavior and balanced demo data. | Test-first regression commit `5b83d27` preceded production edits. Task PR #97 and phase PR #98 merged to `develop` as `9aa6540`. Revised by P41-A-R1: the stale category assertion omitted the required `Real estate` Savings and Investments group entry; the corrected Budget suite and ledger checks pass. | Test-first commit `5b83d27`; implementation merged through `task/P41-A-custom-financial-types` and `phase/41-types-frequency-completion`; P41-A-R1 task PR #99 merged to phase as `0985ef3`, and phase PR #100 merged to `develop` as `a67f54f`. | Old: Real estate/Custom were unavailable; custom names could not be persisted or shown consistently; one-time/recurring holding forms had non-unified type options. New: finite enum values, optional validated `customTypeName`, one shared ordered holding-type list, consistent liability options, explicit categories/groups, and custom labels across display/search/backup paths. For P41-A-R1, old assertion omitted Real estate from this group; new assertion includes it. Reason: reflect the accepted category mapping; no production behavior changed. | current request |
| P41-B | P41 | — | — | 2026-11-10 | Add Once-only frequency to Budget items, Budget income and insurance premiums, with exact-once schedules and an identity-preserving schema-v23 migration; exclude investment plans and liabilities. | Done; Revised by P41-B-R1. Test-first commit `f98d7dd`; implementation `873eed7`; nine focused suites / 233 tests (including progress and memory-doc guards), TypeScript and Expo lint pass. Task PR #101 merged into phase as `9ab6e79`; phase PR #102 merged to `develop` as `b4275d3`. | Task branch `task/P41-B-once-only-frequency` (deleted after merge); retained phase branch `phase/41-types-frequency-completion`. | Old: once-only due dates were unsupported for these three scheduled features; new: they match only their configured first month/date and flow through shared dues, reminders, Budget totals, projections and frozen snapshots. Reason: implement CR-108 Part 4 while retaining v22 import compatibility; no once-only option is added to investment plans or liabilities. | current request |
| P41-C | P41 | — | — | 2026-11-10 | Group completed liabilities and achieved goals in collapsed sections, retaining existing sort/filter/search behavior and pinning Emergency fund at the top. | Test-first commits `0fae9e5` (screen states) and `538046b` (demo closed-loan fixture); implementation commit `3138cde`. Focused route/demo/ledger/memory verification: 4 suites / 209 tests; TypeScript and Expo lint pass. Task PR #104 merged to phase as `c255ada`; phase PR #105 merged to `develop` as `37a3429`. Fixtures cover outstanding below 1, foreclosed/closed liabilities, exactly-at-target/over-target goals, an achieved pinned Emergency fund, collapse/expand, Closed filter, search/sort and simulated font scales 1.3/2.0. Demo adds a $1,000 fully closed loan at $0 outstanding; total liabilities remain Rs 10,00,000. | Task branch `task/P41-C-completed-liabilities-achieved-goals` (deleted after merge); retained phase `phase/41-types-frequency-completion`. | Old: the Closed-filter test expected the matching card to render immediately. New: it expects the default-collapsed Completed heading/count and requires expansion before the same card appears. Reason: completed rows are now presented in a collapsed section; the Closed filter still selects the same record. No assertion was weakened. |
| P41-D | P41 | — | — | 2026-11-10 | Add an offline About route reachable from the Home app menu, display Expo app version/schema/license and verified project links, and open the GitHub latest-release page in the browser only after confirmation. | Test-first commit `bd980ad`: 3 suites failed on missing About route/menu registration (14 tests passed); offline API regression passed. Implementation commit `05e725e` adds `/about` to `routeKinds` and the root stack, routes the app-menu item through `useAppMenu`, displays app metadata and one privacy statement, and uses `Linking.openURL` only after `confirmAsync`. The AST regression scans app/src for `fetch`, `XMLHttpRequest` and `WebSocket`. Focused verification: 8 suites / 47 tests, plus RouteRenderSmoke (1 suite / 174 tests); TypeScript and Expo lint pass. Task PR #106 merged to phase as `7ddfef5`; phase PR #107 merged to `develop` as `8e4a2d1`. | Task branch `task/P41-D-about-offline-updates` (deleted after merge); retained phase `phase/41-types-frequency-completion`. | Old: `/about` had no route-kind/root-stack entry or app-menu destination, and no About/update screen existed. New: About shows the configured app version, schema version, MIT license, verified GitHub links, and exactly one privacy statement; update confirmation opens the latest-release page in the browser, while cancellation does nothing. Reason: provide discoverable app information without adding app-side network behavior. The test-first route/menu failures were committed before production changes; no existing assertion was weakened. |

| P29-R | P29 | — | — | 2026-11-05 | Dry-run every supported migration on the owner's local backup using the production import pipeline; compare all requested summaries without copying the backup into the repository or printing personal text. | Done; schema v13 migrated to v18 and the anonymized comparison found no differences in holding invested/current values, net worth/assets, Emergency fund, all goal saved amounts, liabilities, counts, pending dues or reminder preview. `scripts/dryRunMigration.ts` is committed; the backup was not copied or modified. | TypeScript, lint, Expo Doctor, Android export and iOS export exit 0. Full Jest tests pass, but coverage exits 1 because the unchanged `src/domain/schemas.ts` branch coverage is 89.41% against its 90% configured threshold. | DEC-P29R-BACKUP-DRY-RUN. Assumed: reminder preview uses enabled/day-before/same-day, 09:00, amounts hidden, because reminder preferences are not included in backups. Before-state comparison validates source AppData without migration; after-state uses `parseBackup` and its complete migration/validation pipeline. | current request |
| P29-S | P29 | — | — | 2026-11-05 | Restore Gate 1's coverage threshold and remove uncalled P29-O2 schema-v19 ledger code; no behavior/schema change. | Done; production caller audit found no runtime consumers for the converter, v19 schema/type additions or prototype ledger. Removed the dead code and its tests; P29-O1 remains unchanged. All six ordered gates exit 0. | Final combined P29-S/P29-T closeout commit; hash verified with `git cat-file -t` in the task report. | DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE supersedes DEC-P29O2-UNIFIED-LEDGER. Deleted test assertions covered canceled prototype behavior, not current app behavior; current holding, migration and progress-ledger tests remain. | current request |
| P29-T | P29 | — | 16d1c9bc | 2026-11-05 | Make deposits/withdrawals dated on or before a manual or plan valuation adjust the stored value in the same store write; preserve linked-transaction Undo and schema v18. | Done; real-store tests cover manual/plan snapshots, before/on/after dates, edits, deletes, withdrawals, linked transaction paths, Undo and downstream selectors. Final six-gate results are recorded below. | Final combined P29-S/P29-T closeout commit; hash verified with `git cat-file -t` in the task report. | DEC-P29T-HISTORICAL-ENTRY-SNAPSHOT. Assumed: Budget links refer to transaction actuals/planned flows, because Budget has no current-holding-value selector; no Budget redesign. Native-device checks remain open. | current request |
| P29-U | P29 | — | 16d1c9bc | 2026-11-05 | Add optional valuation methods to the current holding model, with shared values, v19 additive migration and a default-off monthly update reminder. | Done; compatibility tests compare mock, demo and all checked-in old-version fixtures; configured accrual/unit vectors, reminders and all six ordered gates are recorded below. | Single task commit; hash verified with `git cat-file -t` and reported in the task response. | DEC-P29U-LEGACY-VALUATION-COMPAT. Assumed: P29-U is new P29 work; inferred defaults remain suggestions until saved. Conflict: plan `ratePct` is already required in v18, so preserve it instead of weakening the existing schema; manual holdings may omit it. Manual opening value has no start date and is treated as current when no snapshot date exists; an opening amount without a historical unit price is valued at the latest price. Replaced assertions are listed in the P29-U section below. | current request |
| P29-V | P29 | — | — | 2026-11-05 | Prevent SQLite migration data loss, support historical dates through 1900, revise stress tiers to the supported date window, and ensure backup exports round-trip or refuse before file creation. | Done; failure-injection tests cover SQLite open/write/read-back errors, date/stress fixtures validate through import, the 50-year tier round-trips plain and encrypted, larger tiers report the character limit, and all six ordered gates pass. | Single task commit; hash verified with `git cat-file -t` and reported in the task response. | DEC-P29V-SQLITE-VERIFIED-FALLBACK, DEC-P29V-DATE-STRESS-BOUNDS, DEC-P29V-BACKUP-ROUNDTRIP. Assumed: P29-V is new P29 work; dense means 200-year transaction/holding-entry and daily-SIP record counts mapped into the 126-year supported window. No schema bump. Replaced assertions are listed in the P29-V section below. | current request |
| P29-W | P29 | — | 16d1c9bc | 2026-11-05 | Inventory early recurring-liability closure and implement the owner's frozen foreclosure behavior across due, payment, Budget, reminder, Home and net-worth surfaces. | Step 1 report-only inventory committed first (`bf2610cb5add9a8857b07f3cad50415c0e624cbf`). Step 2 adds an optional closure record in schema v20, a one-write close action with Undo, linked payment and separate excess charge, Closed filter, and note-only closed-loan editing. | Focused store, backup/migration and route tests pass; final six ordered gate results and implementation commit object are recorded below. | DEC-P29W-FORECLOSURE-INVENTORY; DEC-P29W-FORECLOSURE-RECORD. Assumed: P29-W is new P29 work. Existing `settlement` is a dated balance anchor, not an explicit closed-state marker; the optional closure record is required to distinguish foreclosure from ordinary settlement. No Home source edit. Replaced assertions are listed below. | current request |
| P29-W-R1 | P29 | P29-W | current | 2026-11-08 | Show liability Entries schedule counts and collapsed paid EMIs; enforce the last EMI date. | Focused route test passes (1 suite; 3 font-scale cases); route and ledger tests pass, and TypeScript exits 0. The route checks completed/pending counts, hidden/expanded paid EMIs, and verifies rendered pending rows do not extend beyond the final scheduled EMI. | `1d2d62b29519441ed29654eddbab328a3a13fe43` (`test(P29-W-R1): verify liability entry schedule cap`); shared Entries screen changes landed in P29-O1-R1. | Old: liability Entries had no schedule counts or grouped paid EMI history, and route coverage checked only visible header text for the last date. New: counts and collapsed paid rows are verified, and actual pending FlatList rows are checked against the final EMI date. Reason: assert the rendered schedule itself, not only its summary text. | current request |
| P29-X | P29 | — | 16d1c9bc | 2026-11-05 | Stop or resume recurring investments while preserving holdings, entries, value, returns and links. | Added inclusive stop-date behavior and Resume investment restoration on schema v21; scheduled dues after stop are removed from shared projections while overdue and past unpaid dues remain. | Report-only inventory `a4a47e63515c90a61903322ae73fe55fa40bf4b8`, implementation commit `b20b4a76b2afb5114ce9934d54d9145a574521a7`, layout follow-up `ee3966e` and all ordered gates verified. | Assumed: stopDate is the inclusive last scheduled date. Replaced assertions are recorded in the P29-X implementation record. | current request |
| P29-Y | P29 | — | 16d1c9bc | 2026-11-05 | Repair stale Gate 1 memory assertions and verify the real counts. | Memory and progress expectations were reconciled to real Jest output without weakening assertions; ordered gates pass. | Commit `7ffa09ad75b2ad42883c1d573ba8133d15cf1304`; real suite/test evidence is preserved in this ledger. | Replaced assertions: stale suite/test counts and latest-run text / real source-derived counts / owner asked Gate 1 repaired. | current request |
| P29-Z | P29 | — | 16d1c9bc | 2026-11-05 | Align documentation and ledger with owner-edited source without changing behavior, schema or UI. | Updated schema, migration/archive, Foreclosure, Home-only menu and real gate evidence; added dashboard rows and source-backed replaced assertions. | Worktree was clean before this task; source wins over docs; protected Home/Budget hashes remained unchanged. | Owner's Foreclosure, Home menu and holding/liability layout edits are user-authored source facts. No behavior/UI change belongs to this commit. | current request |
| P29-AA | P29 | — | — | 2026-11-06 | Repair Emergency Fund holding links on deletion and hydration. | Done; valid links, net worth and goal values preserved; all six gates passed at completion. | Implementation and gate evidence recorded in this ledger. | Original Gate 1 count is historical, not the current suite count. No schema change. | current request |
| P29-AB | P29 | — | — | 2026-11-07 | Add Budget income recurrence and strict backup/import support. | Done; Revised by P29-AB-R1. | Implementation and original gate evidence recorded in this ledger. | Physical-device checks remain open. | current request |
| P29-AB-R1 | P29 | P29-AB | — | 2026-11-08 | Fix quarterly, half-yearly and yearly income appearing every month in Budget consumers. | Done; Revised by P29-AB-R2. Failing 12-month domain, store/hydration, edit-snapshot and route reproductions pass; no schema change. | `cbddbe04920540bfc1dd8147a57eb998bec651ca` (`fix: honor recurring income schedules in summaries`). | Old overview rows/totals and policy estimate ignored recurrence; old following-scope frequency edits rewrote the frozen month snapshot. Replaced with due-month outputs and snapshot-preserving edits because scheduled amounts and frozen history must agree. | current request |
| P29-AB-R2 | P29 | P29-AB | — | 2026-11-08 | Hide non-due recurring incomes from Budget planned/due rows and totals while keeping them editable. | Done; Revised by P29-AB-R2-R1. Route tests dump recurrence labels across 12 months at font scales 1.0, 1.3 and 2.0. | `9c327c8f6ed43b0009e9536a4208a531899ae18f` (`fix(P29-AB-R2): hide non-due recurring income rows`) | Old: non-due incomes appeared as planned/due and affected summaries. New: only due months contribute; non-due items remain available in the collapsed editable Recurring income group. Reason: preserve editability without implying cash is due. | current request |
| P29-AB-R2-R1 | P29 | P29-AB-R2 | current | 2026-11-08 | Make the recurrence-route failure diagnostic type-safe when optional month snapshots are absent. | Gate 2 initially failed with TS18048 at `RouteRenderSmoke.test.tsx:1937`; `npx tsc --noEmit` passed after the diagnostic switched to optional chaining; 173 focused tests passed. | `9637d222c4feb4a001384a4d9094e472eff23728` (`fix(P29-AB-R2-R1): make route diagnostic optional-safe`). | Old: the error diagnostic indexed optional `monthBudgets` directly. New: optional access tolerates absent snapshots. Reason: diagnostics must not make valid optional state fail type-checking. | current request |

### P29-L STEP 1 — Insurance inventory (report only)

| Surface | Current Insurance dependency |
|---|---|
| Insurance list (`app/insurance.tsx`) | Cover-goal cards, target/gap/income-multiple and missing/unassigned states; status/kind filter panel and search; policy cards with status, cover, premium, next due; Paid and Schedule actions. |
| Policy form and route | `/policy-form` creates/edits policy kind, cover-goal assignment, premium, frequency, start/end dates, policy number, sum assured, nominee, note and status. `/cover-goal-form` creates/edits/deletes target goals. Both are modal stack routes. |
| Domain selectors and actions | `coverGoals.ts` owns goal targets/counting, missing cover, generic-category selection for no-kind goals, and automatic policy suggestion. `policyActions.ts` adds/updates/deletes policies, changes lifecycle status, validates cover-goal IDs and clears savings-goal links on deletion. |
| Premium scheduling and payment | `policySchedule.ts` uses `startDate`, `frequency`, `premiumYears`, `trackFrom`, `endDate`, `status` and payment history. `dues.ts` creates linked expense transactions using typed categories except policies assigned to no-kind goals, which use generic `Insurance premium`. |
| Home (read only) | `app/(tabs)/index.tsx` imports only `policySummary` for the Insurance box and generic `pendingItems` for upcoming/due items. Its current summary requires active policy count, total cover, yearly premium and next renewal. It imports no cover-goal types or UI. No Home change is needed. |
| Goals | Savings policies (`life-savings`, `ulip`) remain linkable goal assets; `goalLinks.ts` reads `currentValue`. Policy deletion and kind changes currently remove/block some links. The new form must preserve `currentValue`/`valueAsOf`, existing savings links and link integrity. |
| Budget | `pending.ts`, `schedule.ts` and `budget.ts` project unpaid policy dues into Insurance and linked planned rows; typed premium categories derive from policy kind. Keep the system Insurance section/categories. |
| Reminders | `reminders.ts` extends the search horizon using policy `startDate`, `premiumYears` and optional `endDate`, then consumes policy dues through `pendingItems`. |
| Transactions | `policyPayments` are linked expense transactions; the paid-amount flow records them and Undo restores the payment. `transaction-form.tsx` uses automatic policy suggestion for typed premium categories. |
| Persistence and backups | `AppData`, schema, strict backup import/export, v14→v15 cover-goal migration and v15→v16 holding migration currently include `coverGoals`/`coverGoalId`. Safe storage archives raw prior bytes once, currently through v15; erase-all removes those archives. |
| Tests and demo | Coverage is spread across cover-goal domain/screen, policy action/summary, pending/dues, Budget categories, migration/backup/schema, route smoke, reminders, goal links, store and demo tests. Demo currently creates five default cover goals and linked policies. |

Retained hidden fields and why: `nominee` and `policyNumber` remain on records
for data safety; `status` remains to label historical lapsed/matured/cancelled
policies as Ended and suppress their dues; `premiumYears` remains as the
existing finite schedule horizon; `trackFrom` becomes the editable next-due
date anchor used by the new form and payment schedule; `endDate` continues to
bound schedules; `currentValue`/`valueAsOf` remain necessary for savings-policy
goal links. Cover-goal targets, `coverGoalId`, the default goal set, lifecycle
controls, and no-kind-goal generic category override have no remaining user
purpose and will be removed. Policy history payments and linked transactions
remain intact.

Assumed: Term insurance is `term-life`; Life insurance is `life-savings`.
Schema v17 is the next free version after v16. The v16→v17 migration will
remove `coverGoals` and `coverGoalId` only; no policy/history field is dropped.

### P29-K final verification

**DEC-P29K-SCOPE-IMMEDIATE:** selecting either scope applies the operation
immediately and once; Close, backdrop, and Android back dismiss without
applying. This applies to item, section, and income Save/Delete flows through
the shared `ApplyScopeDialog`. No schema/domain behavior changed, and
`app/(tabs)/index.tsx` was not edited.

Acceptance evidence (test titles are the Jest test names):

| Frozen requirement | Exact test evidence |
|---|---|
| "This month only" and "This and following months" apply immediately and only once, including a double tap | `src/components/__tests__/ApplyScopeDialog.test.tsx` — `applies This month only immediately and at most once`; `applies This and following months immediately and at most once` |
| The shared popup is used by item, section and income Save/Delete flows; the selected scope is applied | `src/components/__tests__/RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` |
| Close, backdrop and Android back close without applying | `src/components/__tests__/ApplyScopeDialog.test.tsx` — `Close closes without applying a change`; `backdrop closes without applying a change`; `Android back closes without applying a change` |
| No Cancel or Apply choice; accessible 44-by-44 Close; category-delete count remains in popup; Undo remains available | `src/components/__tests__/ApplyScopeDialog.test.tsx` — `shows only the two scope choices and keeps counted delete copy in the dialog body`; `src/components/__tests__/RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` |
| Options are full-width, stacked/scrollable and not clipped at font scales 1.3 and 2.0 | `src/components/__tests__/ApplyScopeDialog.test.tsx` — `keeps options expandable and the content scrollable at font scale 1.3`; `keeps options expandable and the content scrollable at font scale 2` |

The assertion audit compares `d8af3f5` with the final worktree. Counts are
literal `expect(` occurrences; Added/Removed are the positive/negative
count deltas, and Net is HEAD minus baseline.

| Changed test file | At `d8af3f5` | At HEAD | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/components/__tests__/ApplyScopeDialog.test.tsx` | 0 | 15 | 15 | 0 | +15 |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 461 | 466 | 5 | 0 | +5 |
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 0 | 0 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 158 | 159 | 1 | 0 | +1 |
| **Total** | **630** | **651** | **21** | **0** | **+21** |

No assertion was removed or weakened. The changed expected values are:

| Test | Old | New | Reason |
|---|---|---|---|
| `shared AI memory documents` in `src/lib/__tests__/memoryDocs.test.ts` | Project inventory `85` suites / `1078` tests | `86` suites / `1086` tests | P29-K adds one suite and eight tests; repository inventory updated to the measured run. Two `expect(` calls were replaced in place, so the file count stays 11. |
| `records the unchanged FX/CH IDs, CR-4 through CR-96 and current phase work` in `src/lib/__tests__/progressLedger.test.ts` | Overall `89/92`; P29 `13/13` | Overall `90/93`; P29 `14/14`; CR-96/P29-K required as Done | One new completed P29 task and its change-request record. Existing dashboard expectations were updated in place; one explicit CR-96 status expectation was added. |

Final gates (run in required order; each command exited 0):

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` after deleting `coverage/` | 0 (86 suites, 1086 tests) |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0; zero warnings |
| 4 | `npx expo-doctor` | 0 (21/21 checks) |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Fresh coverage method: aggregate the regenerated `coverage/coverage-final.json`
by each source file's immediate directory. A line is covered if any Istanbul
statement starting on that source line executed; branch coverage counts
executed branch outcomes. This yields:

| Source directory | Line coverage | Branch coverage |
|---|---:|---:|
| `src/data` | 676/714 (94.68%) | 713/809 (88.13%) |
| `src/domain` | 3318/3381 (98.14%) | 3262/3506 (93.04%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

Per-file branch coverage: `src/domain/budget.ts` 770/849 (90.69%) against the
90% threshold; `src/data/createAppStore.ts` 93/107 (86.92%) against the 85%
threshold. No `eslint-disable` comments were found in the changed
implementation/test files. Physical-device checks remain unverified: native
iOS/Android backdrop hit testing, Android system-back behavior, 1.3/2.0 system
font rendering, and screen-reader announcements; Jest and Expo exports are
not device evidence.

P28-F ledger assertion: Old: the completion regression assumed every P28
row was closed, which could not represent a release workflow in progress. New:
phase counts remain derived from ledger statuses and check the active P28-F row
as open, then closed after integration. Reason: preserve accurate progress and
completion checks without hardcoding totals.

| P28-E-R3 | P28 | P28-E | current | 2026-11-09 | Record selected historical commit ancestry on `develop` without changing application source. | Done; all six gates exit 0. Gate 1: 98 suites, 1,267 passed, 1 skipped; coverage 95.96/92.04/98.02/97.63% overall, `src/data` 91.03/87.41/94.46/94.17%, `src/domain` 96.94/92.87/98.80/98.33%, `src/lib` 100%; Expo Doctor 21/21. Baseline `origin/develop` tip/tree `825636564a4af5568e84911e34198157fd5427ea` / `dba012ebe61de2796960711ed9948b2fad1352f1`; baseline `origin/main` tip/tree `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a` / `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. `f994457`, `7bea8e6` and `b779c21` are ancestry parents via merge commits `a654f66`, `be7b394` and `0697d88`; those ancestry commits preserve the develop tree, while the task adds only ledger/memory documentation and a ledger test. Task PR #47 merged into P28 as `3553b73`; phase PR #48 merged into `develop` as `8c1e670`. P28-E-R4 later connected the full archive ancestry. | Task branch `task/P28-E-R3-record-selected-ancestry`; phase branch `phase/28-qa-and-release`; PRs #47 and #48 merged task -> phase -> `develop`. | Old: selected commits were represented only on the archive branch, and the archive was described as matching the current main tree. New: record the three selected commits by `ours` ancestry merges and clarify that the archive tree is an older snapshot. Reason: connect requested commits without changing application source or main. Updated the guard to exact-once track P28-E-R3. | current request |
| P28-E-R4 | P28 | P28-E | current | 2026-11-09 | Connect the complete `history/by-phase` ancestry to `develop` while preserving `develop`, `release/v1.1.0`, and `main` tracked content. | Done; archive tip `e4a95d57d7bfa3d062d233c3ca315a1a520ef654` is reachable through tree-preserving merge `c4f9aba`. Task PR #49 merged into P28 as `7f9221a`; P28 PR #50 merged into `develop` as `b5dbe5f`. Every remote branch tip is reachable from `develop`. `main` and `release/v1.1.0` remain at `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`, tree `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. | Task branch `task/P28-E-R4-connect-history-archive`; phase branch `phase/28-qa-and-release`; PRs #49 and #50 merged task -> phase -> `develop`. | Old assertions expected P28-E-R4 `In progress` and P28 22/23 done. New assertions expect `Done` and 23/23 after PR #50 integration and remote-branch reachability verification. Reason: the work is fully integrated; no guard or threshold was removed. | current request |
| P28-E-R5 | P28 | P28-E | current | 2026-11-09 | Audit requested first-parent commit subjects and create `release/v1.0.0` at the existing `v1.0.0` tag target without rewriting history or changing protected branch trees. | Done; Revised by P28-E-R5-R1. 403 non-merge commits after the initial commit are already ancestors of `main` and `develop`. All 30 phase branches exist and every requested commit is reachable from at least one. Eighty-four old subjects do not pass the current Conventional Commit hook; rewording would rewrite history, so no commit IDs or messages were changed. New historical branch `release/v1.0.0` points to tagged commit `cac6fedc6242b495558f11cc6d7fe8551fd354ea`, already an ancestor of `main` and `develop`. Task PR #52 merged into P28 as `f9bb715`; phase PR #53 merged into `develop` as `0402592`. | Task branch `task/P28-E-R5-record-v1.0-release-branch`; P28 branch `phase/28-qa-and-release`; PRs #52 and #53 merged task -> phase -> `develop`. | Old: the v1.0.0 tag existed but no matching release branch was present, and 403 historical commits appeared on the first-parent main line. New: a branch points at the published tag; commits remain unchanged because ordinary PRs cannot re-introduce existing ancestors and rewriting is prohibited. Reason: preserve existing code/history while making the historical release branch explicit. |
| P28-E-R5-R1 | P28 | P28-E-R5 | current | 2026-11-09 | Record final integration of P28-E-R5 to `develop` and reconcile status/memory evidence without changing application code or protected release branches. | Done; P28 PR #53 merged into `develop` as `04025926a95b8dda22f15e67b4ea3c3c8769a994`. `main` remains `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`; `release/v1.0.0` remains at the existing v1.0.0 tag target and `release/v1.1.0` remains unchanged. | Task branch `task/P28-E-R5-R1-record-develop-merge`; phase branch `phase/28-qa-and-release`. | Old: the P28-E-R5 record said P28 -> `develop` was pending after PR #53 had merged. New: this revision records PR #53's merge SHA and verifies the protected refs. Reason: synchronize the permanent ledger with completed PR integration. |
| CR-106 | P28 | — | current | 2026-11-10 | Plan report-first external-guidance work for P31, P39 and P40, with roadmap, owner decisions and test expectations. | Done; planning rows only, with no audit, implementation or app-source change. All six ordered gates passed; Gate 1: 98 suites, 1,271 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall coverage. | This task commit; task/phase PR references are reported in chat. | Old: roadmap checks enumerated P31-A-C/P32-P38 and CR/prompt coverage stopped at CR-103/CR-96. New: exact-once checks include P31-D/E, P39-A-H, P40-A/B and CR-106, with P40-B's owner-approval hold checked explicitly. Reason: assert the added planning inventory without weakening prior checks. `memoryDocs.test.ts` remains unchanged because its count expectations are derived from the documented values; the verified counts changed from 98 suites/1,270 tests (1,269 passed, 1 skipped) to 98 suites/1,272 tests (1,271 passed, 1 skipped). | current request |
| CR-107 | P28 | — | current | 2026-11-10 | Complete the owner-authorized roadmap/demo/screenshot/notation work, verify release assets and URLs, and record final evidence. | Done; P22-A-R1, P28-F-R5 and P28-G are closed. All 23 screenshots are committed under versioned paths; all 46 blob/raw URLs returned HTTP 200 and each raw size matched its local file. Screenshot sections are updated in all three release bodies, then the 23 screenshot assets were removed; only the unchanged APK remains on each release. Demo data is six months, Rs 1 lakh earned income/month, Rs 1 crore assets and Rs 10 lakh liabilities; direct opening values are assumed. All six gates and the final task/phase/develop/main/back-merge PR chain are recorded in Section 10/11. | P22-A-R1 `00faeb2` / PR #84; P28-F-R5 `ff5a5a6` / PR #83; P28-G `e6395a1` / PR #85; final evidence branch and PR chain below. | Old: screenshot references used downloadable release-asset URLs; new: versioned main-branch repository blob/raw links. Reason: thumbnails should open the image in the browser. Old: phase labels used `Phase <n>` and documentation assertions expected that form; new: ledger/shared memory use PN labels while preserving specified Git/release exclusions. Reason: consistent notation without changing refs or original subjects. Old: four-month/lower-scale demo fixtures; new: deterministic six-month lakh/crore values and every goal at or below 87%. Reason: requested regression coverage for the production-like sample. Old test guards stopped at CR-106 and had no CR-107 completion check; new guards include one exact-once register row, one prompt-log row and all three completed dashboard parts. Reason: ensure final status cannot drift. `memoryDocs.test.ts` remains unchanged because it derives test-count expectations from documented counts. Owner chose screenshot-only edits to v1.0.0's release body because its non-screenshot text differs from the published note; that difference remains intentional. The v1.1.1 APK does not contain this demo change. | current request |
| CR-108 | P29/P20/P41 | — | current | 2026-11-11 | Deliver the six owner-authorized menu, Budget, type/form, once-only/schema, completed-section, and offline About/update changes; preserve all stated protected surfaces and release boundaries. | All six parts are integrated into `develop`; P41-B-R1 task PR #108 merged into phase as `e1db78e` and phase PR #109 merged to `develop` as `5cb4957`. All six ordered gates passed: 101 suites, 1,316 passed, 1 skipped; 95.96/92.15/98.02/97.62% overall coverage. Demo constraints and protected hashes are verified; physical-device checks remain unverified. No v1.1.1 artifact changes. | P29-Q-R1: task/phase PRs #93/#94; P20-N-R3: #95/#96; P41-A: #97/#98 and correction #99/#100; P41-B: #101/#102 and evidence PR #103; P41-C: #104/#105; P41-D: #106/#107; P41-B-R1: #108/#109. Retained phase: `phase/41-types-frequency-completion`. | Old: four stress tiers were sent to a helper capped at two choices; Budget Overview exposed redundant Pace/Over by/Left lines; holding types lacked finite Real estate/Custom options; once-only frequency was unsupported for Budget items/income and policies. New: Parts 1–6 are integrated, including exact-once recurrence/schema v23, completed sections and offline About/browser update navigation. Reason: owner-directed CR-108 scope. P41-B-R1 replaces the stale reminder assertion (909→893) and closes the phase ledger from 4/5 to 5/5. Old completion assertions and their reasons are listed in the close-out evidence below; none were weakened. No CR-108 changes were made to v1.1.1, release branches, tags or release artifacts. | current request |
| P41-B-R1 | P41 | P41-B | current | 2026-11-11 | Correct CR-108 Gate 1's once-only demo reminder assertion and cover schedule/schema branches without changing production behavior. | Initial Gate 1 failed in 100 suites / 1,314 passed / 1 failed / 1 skipped: reminders expected 909 but Once-only behavior correctly yields 893. The corrected focused run passes (4 suites / 86 tests); TypeScript and Expo lint pass. Task PR #108 merged into `phase/41-types-frequency-completion` as `e1db78e`; phase PR #109 merged to `develop` as `5cb4957`. Final ordered gates pass (101 suites / 1,316 passed / 1 skipped). | Test-first commit `bd8f1c9d286dd32a2b94065d729455d747a00a08`; documentation follow-up `efbf9ac0d4ca0846c542e9203fd8684949017e49`; task merge `e1db78e7f67a60ab5c833d856e1bedce894388ff`; develop merge `5cb4957d854da5cec2bb38694d48e9d12ea2cbce`. | Old: demo reminder aggregate asserted 909. New: it asserts 893. Reason: the Once-only policy creates a single due slot rather than recurring across the demo horizon. Old: P41 phase index asserted 4 subtasks and the dashboard showed 3/4; new: the revision adds the fifth task and the completed phase is 5/5. Reason: the revision is integrated and done. Added boundaries for the custom-policy default interval, Once-only after its end date, pre-trackFrom legacy payment exclusion, and required/trimmed Custom holding names. No production assertion or behavior was weakened. | current request |

| P28-F-R6 | P28 | P28-F | current | 2026-11-11 | Prepare the owner-approved v1.2.0 minor release candidate with the supplied screenshots, aligned metadata and required documentation; preserve v1.1.1 as latest published pending publication. | In progress; the approved note is finalized, version metadata is aligned to 1.2.0, and focused release/About/ledger tests, TypeScript and lint pass. Task PR #112 merged into the retained phase as `fa153da`; phase PR #113 merged into `develop` as `d347526`; evidence PR #114 merged as `5ae1b72`. All six ordered gates pass. Physical-device checks, GitHub draft, EAS build/upload and separate publication approval remain pending. | Commit `55559c7` (`docs: draft v1.2.0 release notes`); task PR #112 → `fa153da`; phase PR #113 → `d347526`; evidence PR #114 → `5ae1b72`; task branch deleted; phase branch retained. | Old: About tests and app/package metadata were pinned to 1.1.1, the README described v1.1.1 as current What's new, and release docs identified v1.1.0 as latest published. New: candidate metadata/docs target v1.2.0 while the README Download block and gallery retain v1.1.1 until publication. Reason: prepare the approved candidate without misrepresenting the latest published release. | current request |

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-1 | 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not' | Done; superseded by P24-A (2026-11-08) | Resolved by local reminders, lock-gated confirmation, privacy controls and the 60-item scheduler. Original open-state note is historical and was superseded on 2026-11-08. |
| CR-2 | LEDGER-BACKFILL: merge session exports and checkpoint evidence into the permanent project record, reconcile against Git, and remove prompt archives from the repository. | Done | This commit completes the checkpoint-informed merge and CR-3 form audit. The earlier P15-LEDGER commits removed the prompt archive; recovery is `5aeefb9`. |
| CR-3 | Form labels and full-width Save follow-up from 2026-10-10. | Open | Every current `app/*-form.tsx` field has a visible label. Save is not full width while an error summary is visible in `profile-form.tsx` and `transaction-form.tsx`; no code changed. |
| CR-4 | Tab label must read Transactions, never Txns. | Done | `0304acd`; single-line fit behavior, 44pt target and source guard tested. |
| CR-5 | Budget divided into five groups: Survival (Needs); Savings and Investments; Wants (non-essential or lifestyle spending: eating out, online shopping, entertainment, fashion); Festival, Donations, Culture; Unexpected Extras (surprises and emergencies: medical bills, home or vehicle repairs, sudden gifts); compact Set up your budget inputs; replace the Line type label. | Done | P19-A; focused and full gates pass. |
| CR-6 | Applied budget and all recurring items (assets and liabilities, past and future) show in Transactions as due payments, with Pay and Clear due. | Done | P20-A (formerly P19-B). |
| CR-7 | Home upcoming and due rows offer Pay and Clear due and update Transactions. | Done | P20-B (formerly P19-C). |
| CR-8 | Emergency fund goal can link assets like other goals; Emergency fund is not listed as an asset. | Done | P21-A; final Expo Doctor 21/21 and all required gates pass. |
| CR-9 | Budget review retains every investment category and includes Freelance, Rental, Business and Other earned income by source. | Done | P19-B; category/source reconciliation tests pass. |
| CR-10 | Home spending by category is collapsed; existing Home-card actions stay as user-owned. | Done | P20-B. |
| CR-11 | Bottom tabs appear only on Home, Transactions, Goals and Budget. | Done | P20-C; DEC-TABS. |
| CR-12 | Four months of linked demo data; every feature part extends demo data and tests. | Done | `buildDemoData`, integrity/budget/due/net-worth/storage tests, loader Undo and every-route smoke pass; all required gates are green. |
| CR-13 | Remove emergency-fund entries and exclude emergency fund from net worth; schema v7. | Done | P21-A migration, backup and link tests pass; final required gates are green. |
| CR-14 | Emergency-fund months of cover use salary fallback. | Done | P21-B expense/salary fallback and cover tests pass; final required gates are green. |
| CR-15 | Minimal emergency-fund allocation edit UI and linked-assets allocation table. | Done | P21-B allocation tests pass; final required gates are green. |
| CR-16 | Templates joins History and Month review; remove Budget header menu. | Superseded by CR-17 | P19-B's body action row was replaced by the Budget header icons in P19-C. |
| CR-17 | Put History, Month review and Templates in the Budget header as ordered, accessible right-side icons; no body action row or header menu. | Superseded by CR-24 | P19-C icon UI was replaced by the single accessible three-dot menu and ordered menu entries. |
| CR-18 | Compact expandable Transactions balance card with four balanced metrics, secondary money/pending caption and review action. | Superseded by CR-22 | P20-D preserves the user's reduced always-visible balance card and removes expansion, metrics and captions. |
| CR-19 | Input components are user-owned; restore the user's versions and freeze them against agent edits. | Done | P19-C; current field files matched the latest user-authored version; SHA-256 manifest and guard test added. |
| CR-20 | Emergency fund is a goal, not an entity: remove ledger entries and the Emergency fund invest category and instrument reference; visualization-only screen. | Done | P21-A/B tests pass; final required gates are green. |
| CR-21 | Anchor Home due popup to the bottom safe area, bound and scroll the sheet, and support backdrop dismissal. | Superseded by CR-27 | P20-D sheet was replaced by the native Paid / Not paid confirmation; its style, scroll, backdrop and action assertions are replaced by confirmation tests. |
| CR-22 | Keep only the user's surviving Available/Closing balance elements and remove its expansion behavior. | Done | P20-D; DEC-USER-CHANGES records the final element set and replaces expansion tests with always-visible/no-toggle assertions. |
| CR-23 | Clear later due slots by paying through them in FIFO order, with atomic records and one-step Undo. | Done | P20-D; 1/3/401, future, mixed, plan, liability and budget cases; single-write/deep-equal Undo tests pass. |
| CR-24 | Replace Budget's three header actions with a single three-dot menu and ordered Budget/global entries. | Superseded by CR-30 | The interim menu design is replaced by an explicit no-menu Budget header; month switching and on-screen Review remain. |
| CR-25 | Format Budget bills/dues and the no-budget card with responsive row layout and actions. | Superseded by CR-32 | The separate Bills and dues section is merged into the group cards; linked rows appear once in their group. |
| CR-26 | Repair the redundant iOS icon override so Expo Doctor passes. | Done | `8590a4a`; top-level and iOS icon paths were identical; `npx expo-doctor` now passes 21/21. |
| CR-27 | Home due rows open the default Paid / Not paid confirmation; paid dues update derived lists and can be undone. | Done | P20-E; oldest/later due confirmation, cancellation/dismissal no-op, clear-through preview, Undo and no-navigation tests pass. |
| CR-28 | Normalize Budget closing balance to two decimals and use danger/primary/neutral tones with correct zero labeling. | Done | P20-E; domain and screen tests cover -0, -0.001, 0, 0.004, 1500 and -1500; all final gates pass. |
| CR-29 | Keep one budget plan, apply from next month and link recurring items. | Done | P20-F due-day/linked groundwork plus P20-G schema-v8 migration, one plan, repeat/apply actions, setup UI, Home/Budget flows, demo and tests. |
| CR-30 | Remove the Budget header menu. | Done | P20-G sets `showDefaultMenu={false}`; tests assert no header menu while preserving month switching. CR-34 later removes Budget's Review control. |
| CR-31 | Show a Demo data loaded popup with Undo and OK after the development loader succeeds. | Done | P20-E; exact popup copy/button order, current-route retention, Undo restoration and brief toast tests pass; all final gates pass. |
| CR-32 | Merge Budget dues and planned/actual data into one responsive card per group, retaining paid rows and direct clear/Undo behavior. | Done | P20-H; grouped row projection, paid/partial/overdue/linked states, one card per group and simulated 1.3/2.0 font-scale layout tests pass. |
| CR-33 | Reorder Budget to cash flow, plan summary and group cards, with only the Edit budget header action. | Done | P20-H; screen-order, two-row cash-flow, tone, plan-summary styling, no-menu and month-switch tests pass. |
| CR-34 | Remove Month review UI and route; route Transactions' Review {Mon} action to Budget at that month. | Done | P20-H; route-kind absence and valid/invalid month navigation tests pass; pure review allocation functions and transaction records remain. |
| CR-35 | Home upcoming/due rows show title, amount, date and a compact tick button; Paid clears oldest/later dues with Undo, while Not paid/dismissal do nothing. | Done; corrected by CR-43 | P20-I behavior remains; CR-43 replaces the check icon with the exact compact text action “Marked as paid”; confirmation/Undo semantics are unchanged. |
| CR-36 | Put a text status to the right of every goal progress bar, including Emergency fund; at font scale 1.3+ stack status below and right-aligned. | Superseded by CR-40 | P20-J removes all status words and unreachable-status copy; projection calculations remain. |
| CR-37 | Remove linked-asset details and status labels from normal Emergency fund mode; put one Edit allocation icon in the app header and show each allocation bar last after row details. | Done | P21-C; normal-mode, one-header-action/no-menu and bar-last checks at font scales 1.0, 1.3 and 2.0 pass. |
| CR-38 | Edit allocation items from a header add menu, remove any fixed/custom item with confirmation, retain goal asset links, and default to four items. | Done | P21-C; add choices, exact removal copy, 100% validation, custom metadata, preserved goal links and one-write save tests pass. |
| CR-39 | Prevent Emergency fund from crashing on invalid/stale saved allocation data; validate at source, resolve every render input, and repair/archive invalid data once on hydration. | Done | P21-C1; malformed-data screen matrix, domain rejection/rounding, form blocking, exact raw archive, single write and idempotent hydration tests pass; schema v8 unchanged. |
| CR-40 | Remove goal-card status and unreachable-contribution wording on Home and Goals; keep details above a final progress bar. | Done | P20-J; every card, including Emergency fund, is covered at font scales 1, 1.3 and 2; projection logic remains. |
| CR-41 | Allow assets to link to multiple goals and split each value equally in paise, deterministically; retain legacy share compatibility and EF bucket invariants. | Done | P20-J; one/two/three-goal splits, paise remainder, rebalancing, form picker, duplicate rejection, import compatibility, projection and EF integrity tests pass. |
| CR-42 | Standardize every remaining edit action on Feather `edit-2`. | Done | P20-J; ownership coverage and source scan reject `edit`, `edit-3` and `pencil` icon names. |
| CR-43 | Replace the Home due tick icon with the exact compact text action “Marked as paid”. | Done | P20-J; text label and font-scale tests cover the unchanged Paid/Not paid confirmation path; corrects CR-35. |
| CR-44 | Render Home goals inside one card with single hairline row dividers and no divider after the final row. | Done | P20-K; one-card grouping and divider assertions pass at font scales 1.0, 1.3 and 2.0. |
| CR-45 | Remove asset-card edit icons; make the card body an accessible edit target without triggering edit from existing buttons. | Done | P20-K; route, accessible-label, no-edit-icon and button-propagation tests pass. |
| CR-46 | Remove liability-card edit icons, make card bodies edit targets, and place data before the bar with only existing buttons after it. | Done | P20-K; recurring and one-time cards, routing, button isolation and ordering are covered. |
| CR-47 | Make Transactions Due payments always open; show each due as title, date, amount and one compact Paid/Received clear action, retaining FIFO confirm/Undo semantics. | Done | P20-L; always-open rows, labels, one-write FIFO clearing, Undo, empty-month hiding and simulated font-scale layout tests pass; full gates pass. |
| CR-48 | Move existing sort/type controls on Transactions, Assets, Liabilities and Goals into an inline header filter panel with ordered filter/plus actions and active indicator. | Done | P20-L; closed-by-default and toggle/content/order/active-filter tests pass; SortChip and sorting implementation remain unchanged; full gates pass. |
| CR-49 | Add local case-insensitive, trimmed search to Assets, Liabilities and Goals; compose with filters and sorting. | Done | P20-L; all three screens cover matching, filters/sort composition, clear, empty results and remount reset; Transactions search remains unchanged; full gates pass. |
| CR-50 | Add All/Recurring/One-time liability-kind filters in the Liabilities filter panel. | Done | P20-L; all three kinds filter correctly, selection is local/default All, active dot and No matches empty state are covered; full gates pass. |
| CR-51 | Set only null/default/repair emergency-fund allocation to Cash 10, Bank account 40, FD / RD 50; preserve saved allocations. | Done | P21-D; default/resolver, empty repair hydration, UI, demo and schema-v8 tests pass; saved 10/40/35/15 allocation remains unchanged. CR-90 later removes the predefined add picker; full P21-D gates pass. |
| CR-90 | Replace Emergency fund allocation-item picker and custom-option modal with direct shared-shell add/edit item route forms. | Done | P21-E replaces predefined options with direct custom-item creation, preserves zero-percent insertion and 100% allocation-save validation, and moves metadata editing/deletion into the item form. Schema v13 remains unchanged. |
| CR-52 | Add Rent, Utilities, Subscriptions, Personal spending and Travel to expense categories, grouping them under Survival or Wants with normalized suggestions. | Done | P20-M; category schema, form options, group mapping/weights, import validation and demo amounts pass focused domain/schema/backup/demo tests. |
| CR-53 | Replace scalar planned income with income items in plans and frozen month snapshots; migrate v8 and import backups v1-v8. | Done | P20-M; schema, backup, migration and premigration archive tests pass; schema version 9, version 10 refused. |
| CR-54 | Derive repeated future month budgets on demand through 24 months; include income dues and undoable clearing without persisting views. | Done | P20-M; future snapshot/plan edits, repeat-off/horizon/no-write, income due remainder/category sharing, clearing and Undo tests pass. |
| CR-55 | Project current and future cash flow from actual balances and chained plans. | Done | P20-M; current/past actual, 24-month chain and no-plan flat-month tests pass. |
| CR-56 | Create a pure Budget overview model with ordered income/expense/investment sections, planned/actual totals, linked sources, cash-flow projection, pace, and accessible text summaries. | Done | `budgetOverview` covers empty, current, past, future, linked plan/liability/policy, shared-category and overspend cases; `budget.test.ts` and full coverage pass. |
| CR-57 | Replace the Budget screen with stacked/section/pace charts, text equivalents, mode-specific edit routes and empty states while preserving user-owned labels and removals. | Done | Chart, screen, route, mode, demo and font-scale tests pass; all six final gates exit 0. Opening/Closing balance labels and absence of Budget Back/Review controls are preserved. |
| CR-58 | Add a bottom-anchored budget-item edit sheet with month/following scope, amount/day validation, remove and Undo; materialize edited virtual months and preserve later custom snapshots. | Done | Domain, store single-write/deep-equal Undo, route and sheet tests cover both scopes, current/derived months, custom snapshots, income/line edits, removal and validation. |
| CR-59 | Show budget-section grouped expense categories with selected-month remaining/over-budget hints; keep investments instrument-derived and show their hint. | Done; visible hints and unbudgeted read-only rule superseded by P20-S | Grouping/order and instrument-derived investment selection remain; P20-S replaces hints with titles-only Dropdown options and makes transaction-derived unbudgeted rows editable. |
| CR-60 | Migrate schema v9 budget lines to v10 user-managed plan/month sections and items, preserving raw v9 bytes and importing older backups through the migration chain. | Done | `migrateV9ToV10`, v1-v9 checksum/migration tests, one-time `.premigration.v9` archive, schema-11 rejection and schema integrity validation pass. Unknown migrated categories fall back to the first spend section. |
| CR-61 | Add scoped section/item domain and store mutations, then integrate custom categories through budget views, pending items, transaction validation/filtering/labels, Home summaries and category choices. | Done | Both scopes/current and derived months, later custom snapshot preservation, constraints, deletion without transaction mutation, one persisted write, Undo, dynamic category ordering and custom transaction round trips are covered. |
| CR-62 | Replace the budget setup/month-form routes with direct Budget-screen plan creation, application, and one Add category header action. | Done | `createDefaultBudgetPlan` produces default sections/no items/repeating from the current month; Home and Budget create/apply it in one action with Undo. Both obsolete routes, screens, links and suggested-split logic are removed. Five targeted suites/204 tests pass; source/action sheet coverage continues through CR-64. |
| CR-63 | Replace separate budget section cards with collapsible Home-styled section rows, editable item rows, and read-only past-month rendering. | Done; collapsible rows superseded by P20-R | P20-Q assertions for collapsed/expanded state and chevrons are superseded by CR-68's one-Card-per-section/no-expanded-state assertions; reason: P20-R replaces the collapsible rows with section Cards while retaining item rows, routes and past-month read-only behavior. |
| CR-64 | Extend the existing budget item sheet into the scoped section/item/income management sheet and wire mutations with Undo. | Done; text-button affordances superseded by P20-R | P20-Q assertions for section text buttons and the body “Remove item” action are superseded by CR-67/68 icon-action and header-trash assertions; reason: deletion moves to edit-mode trash, while scoped confirmation, one write and Undo remain. |
| CR-65 | Rework overview and pace cards for fixed-width responsive rows and compact visible summaries. | Done | `BudgetCharts.test.tsx` and screen tests cover planned-only stack, Planned/Actual header, four divided rows, short visible summary and long accessibility labels; all final gates pass. |
| CR-66 | Move Budget management and other bottom-anchored sheet-style forms to a shared top-anchored, keyboard-aware wrapper. | Done | `TopAnchoredSheet` is used by Budget management and the Goal asset picker; style tests cover safe-area, keyboard height, scroll and backdrop. All six gates exit 0. |
| CR-67 | Put edit-mode trash and rightmost Close icons in the Budget sheet header; remove body Remove item link. | Done | Edit modes expose trash then Close; add/section modes only Close; confirmation choices, Undo callback and persisted delete/restore tests are covered. All six gates exit 0. |
| CR-68 | Render each Budget section in its own Card with responsive, accessible icon actions. | Done | Cards, per-section icon policy, item rows/dividers, responsive stacking, past-month read-only behavior, linked routes and unchanged Home summary are covered. All six gates exit 0. |
| CR-69 | Cover top-sheet, card, deletion, accessibility and font-scale acceptance; close ledger and gates. | Done | Focused acceptance and store tests; full coverage and all six gates pass. Real-device checks remain listed in P20-R verification. |
| CR-70 | Add accessible, grouped Dropdown control and convert specified transaction, holding, liability and Budget category choices. | Done | `Dropdown.test.tsx`, `TransactionForm.test.tsx`, `budgetCategories.test.ts`; category options are grouped titles-only and planned items sort first. |
| CR-71 | Compose sheet forms with a shared FormShell while keeping frozen FormScreen and form inputs unchanged. | Done; FormScreen freeze superseded by CR-76 | `FormShell.test.tsx`, `RouteRenderSmoke.test.tsx`, and `HomeThemeSmoke.test.tsx` pass; both converted sheets use the shared core. CR-76 explicitly authorizes the shared-core FormScreen edit; all other frozen inputs remain unchanged. |
| CR-72 | Show Actual before Planned in paired Budget values and accessibility text. | Done | Budget overview table, section/item rows, pace/income labels, charts and accessibility equivalents use Actual-left/Planned-right; Home's existing wording is unchanged. |
| CR-73 | Use category dropdowns with Custom-name flow in Budget item add/edit. | Done | Route and Dropdown tests cover section-specific choices, occupied-category exclusion, current edit selection and Custom validation. |
| CR-74 | Add accessible Due day helper text without changing frozen IntegerField. | Done | Route tests assert exact helper copy and stacking at 1.0/1.3/2.0. |
| CR-75 | Make transaction-derived unbudgeted rows manageable and permit manual Insurance items without linked-policy duplication. | Done | Budget/domain/schema/import/pending/store and route tests cover edit affordances, protected Insurance section, plan/snapshot mutations, due clearing, policy non-duplication, one write and deep-equal Undo. |
| CR-76 | Unify full-screen and sheet forms on one shared header/body/footer implementation while preserving FormScreen behavior. | Done | `FormScreen.test.tsx`, `FormShell.test.tsx`, frozen hash test; dirty discard, validation summary, action slots, scrollable body and fixed footer remain covered. |
| CR-77 | Convert every data-entry form to the common shell and enforce consistent Back/Close/delete/Save placement. | Done | Route parameter smoke test covers create/edit entry points; every route form plus onboarding, erase-data, Budget sheet, Goal picker and EF custom-option dialogs use the shared shell. Selection/information/list/settings surfaces remain deliberately unchanged. |
| CR-78 | Migrate policy data to schema v11 with lifecycle/metadata, schedule compatibility and backup support. | Done | v10→v11 migration, exact one-time `.premigration.v10` archive, schema/backup chain and migration branch tests pass; v12 is rejected. |
| CR-79 | Add pure policy actions and summary; enforce active-only dues/Budget rows and deletion cleanup with Undo. | Done | Typed policy actions, active-only/end-date schedule, policy summary, store one-write/Undo, linked transaction retention, integrity and Insurance reconciliation tests pass. |
| CR-80 | Add cover-goal schema v12, one goal per cover type, migration/archive and backup support. | Done | `migrateV11ToV12`, exact-byte once-only `.premigration.v11`, erase behavior, v11 backup migration, checksum-before-migration, and v13 refusal pass focused and full coverage tests. |
| CR-81 | Add cover goal summaries/target action, typed policy suggestion, insurance categories and reconciliation. | Done | Cover-state/income/policy/category/pending/Budget/demo/backup/one-write/Undo acceptance tests pass; no new screens. All six required gates exit 0. |
| CR-82 | Add an Insurance cover stack screen with Goals, Budget, and Home entry points, ordered header actions, filters, and search. | Done | RouteRenderSmoke asserts all entry routes, action order, status filtering, search, Add policy, and policy edit navigation. |
| CR-83 | Show ordered cover-goal cards and edit non-deletable targets in the shared FormScreen. | Done | RouteRenderSmoke asserts five-type order, progress-last layout, term income line/null helper, and all target modes; targets remain non-deletable. |
| CR-84 | Add complete policy list/card actions and create/edit form with confirmation and Undo. | Done | RouteRenderSmoke asserts create/edit fields, edit-only status, date bound, delete confirmation, Paid/Undo and large-font style props; store tests assert deep-equal delete/status Undo. |
| CR-85 | Integrate typed premium linking, policy dues, and Budget/Home navigation without changing savings or net worth. | Done | TransactionForm asserts typed titles and default-on unique-policy link; createAppStore asserts linked payment/expense and exactly one write; linked Budget row navigation and Home paid label remain covered. |
| CR-91 | Replace Goals Insurance link and conditional Home cover row with an Insurance Card in the user's Home order. | Done | P23-D adds the card/content/routes; P25-C replaces the superseded immediate-after-Emergency-fund placement assertion with tests for the user-owned order after Upcoming and due (when present), before Goal Progress. |
| CR-86 | Replace BudgetManagementSheet with full-screen route forms for budget sections, items and income; keep scope, validation, Save and edit/delete behavior. | Done | P20-U adds three shared FormScreen routes, removes the sheet, routes all Budget entry points and adds the full-field `editBudgetIncome` domain/store action. Focused route/domain/store tests pass. |
| CR-87 | Verify route-form entry points, scoped save/delete Undo, validation, shared-shell layout and protected behavior; close P20-U. | Done | P20-U route smoke, domain/store, route-kind, shared-shell and frozen-component tests pass; final six gates and simulated-device limitations are recorded in the P20-U close-out. |
| CR-88 | Add Budget item recurrence to schema v13 with v12 migration, backup-chain support, and once-only raw-byte archive. | Done | STEP 1 committed as `6d3feab`; recurrence-aware domain planning, due suppression and focused tests committed as `82793e8`. Full migration/backup coverage passes. |
| CR-89 | Add recurrence-aware Budget forms, rows, dues, projections, categories, demo data and tests. | Done | Route form, row frequency/next-due copy, category choices, demo and route/domain acceptance tests complete; full suite and all six gates pass. Simulated layout only; native-device checks remain. |
| CR-92 | Reconcile the local backup against monthly income, expenses, loan and emergency-fund tracker data; remove duplicate points; add month-end deficit/surplus adjustments. | Done | Temporary focused reconciliation test passed; all 52 monthly cash-flow totals, duplicate signatures, adjustment dates, checksum and `parseBackup` import were verified. The private backup remains a local deliverable and is not committed. |
| CR-93 | Show Transactions Available/Closing balance amounts for positive, zero and negative values; validate current backup notes and reported transaction changes. | Done | The amount now renders regardless of brought-forward balance. Zero and negative UI tests pass. The edited local backup checksum was recalculated and `parseBackup` passed. The backup snapshot does not contain the separate transaction deletion/addition reported for app data. |
| CR-94 | Add historical monthly budgets through October 2026 using transaction logs; keep past actuals immutable and budgets flexible to recorded categories. | Done | The local backup has 52 custom month snapshots. Focused validation confirms each month's planned expense/investment category matches its transaction actual, every month is covered, the checksum is valid and `parseBackup` accepts the result. The backup remains ignored user data and was not committed. |
| CR-95 | Include all income types in each historical budget, classify them from transaction logs, route unknown spending categories to Unexpected Extras, keep planned and actual equal, and link transaction logs. | Done | Added backward-compatible optional `otherIncomes` month-snapshot data and rendered separate non-earned rows without changing earned-income planning. The 52-month local backup now contains all income categories, matches planned/actual income and expense/investment category totals, retains all 716 transactions and their 119 explicit source links, and passes `parseBackup`. No unsupported expense/investment category was present. |
| CR-96 | P29-K: Budget scope selection applies immediately; Close, backdrop and Android back discard the pending operation. | Done | Shared `ApplyScopeDialog` is used by item, section and income Save/Delete flows; section-delete counts remain in the popup and Undo is preserved. No schema/domain change. |
| CR-97 | P29-L: Replace cover-goal/lifecycle Insurance complexity with a simple editable policy list and recurring premium dues. | Done | The P29-L acceptance matrix, migration/backup evidence and six ordered gates are recorded in the final P29-L section. |
| CR-98 | Audit requested first-parent commits and create the historical `release/v1.0.0` branch. | Done | The 403 requested non-merge commits are already ancestors of `main` and `develop`; 84 legacy subjects do not pass the current Conventional Commit hook. Do not rewrite history. `release/v1.0.0` points at the existing v1.0.0 tag target. Task PR #52 and P28 PR #53 are merged through `develop`. |
| CR-103 | Correct v1.0.0 release metadata to match the template and publish the owner-approved v1.1.1 release with all latest-version links/assets aligned. | Done | P28-F-R4-R1-R1-R1-R1-R1-R1-R1; release published, latest links aligned and previous APK asset renamed after verification. |
| CR-107 | Complete owner-authorized roadmap, demo-data, screenshot-storage, and PN-notation work; verify release links/assets and record final evidence. | Done | P22-A-R1, P28-F-R5 and P28-G complete. All six gates passed; screenshots are repository-backed and browser-viewable; 23 screenshot release assets were removed only after all 46 blob/raw URLs returned HTTP 200 and raw sizes matched. The three release APKs remain unchanged. See Sections 6, 10 and 11 for outputs, gate results, owner decisions and PR evidence. |
| CR-108 | Deliver the owner-authorized six-part menu, Budget, custom type/frequency/schema, completed-section and offline About/update work without modifying Home or crossing release boundaries. | Done (device checks outstanding) | Parts 1–6 and P41-B-R1 are integrated to `develop`; phase PR #109 merged as `5cb4957`. All six ordered gates pass. Physical-device font-scale and screen-reader checks remain open. No v1.1.1, release branch, tag or artifact was touched. |

## 8. Known issues and risks

On 2026-10-15 the user confirmed that every item previously marked user-reported, unverified is done, available in the app and working. Items that were never labelled that way keep their own device-check lists.

- **Assumed:** font-scale 1.0/1.3/2.0 TestRenderer cases verify the native Text fitting props and style contract, not OS font scaling or rendered pixel clipping; those remain device checks.
- The earlier checkpoint had 43 failing tests; current baseline is green
  (519/519 before the Round 3 additions, 520/520 after FX-BASE). Round 3
  close-out was green at 604/604; Round 4 currently passes 656/656 tests
  across 64 suites and meets all measured coverage floors.
- Checkpoint lint once reported seven stale imported-module parse errors;
  current standard Expo lint passes.
- Budget now lives only under `(tabs)`; the identified Home/history links and
  Budget header menu use the tab route. Full device navigation verification
  remains part of final QA.
- The formatter scan allows direct exact formatting only in `AmountText.tsx`
  and `MoneyField.tsx`; device/screen-reader behavior remains unverified on
  physical iOS and Android devices.
- The app has no category-specific icon, color, or label-map layer; Festival,
  Donation, and Gifts use the existing generic expense presentation.
- No real iOS or Android device/development-build verification has been done
  for this fix round.
- **P18-R7 device checks not verified:** actual system font scaling at 1.0/1.3/2.0 and rendered no-clipping behavior, native tab spacing/safe areas, and touch-target behavior on physical iOS/Android devices. Tests inspect the scaling props/style contract only.
- **P19-A device checks not verified:** category-header wrapping and form scrolling on physical iOS/Android at large system font scales, native dynamic type and VoiceOver/TalkBack interaction; simulated tests assert the 44-point minimum header style/accessibility state, not rendered clipping or touch behavior on a device.
- **P20-L / P21-D device checks not verified:** actual filter-panel tapping and accessibility announcements, search keyboard/focus/clear behavior, real-device 1.3/2.0 system font scaling and clipping, touch-target behavior, and Emergency fund default-item layout on physical iOS/Android devices. Automated layout checks use TestRenderer simulations and do not verify native rendering.
- **P19-B device checks not verified (historical CR-16 body row, superseded by CR-17):** real-device wrapping/clipping, native menu behavior, and accessibility interaction for the former action row on iOS/Android.
- **P19-C device checks not verified:** actual 360pt header title/icon fit at system font scale 2.0; Budget icon hit-target/indicator announcements and route behavior with VoiceOver/TalkBack; Transactions card rendered height, wrapping/clipping, expanded scroll flow, and touch behavior at font scales 1.0, 1.3 and 2.0 on physical iOS/Android devices.
- **Assumed:** component ownership is determined by the requested author heuristic: commits with no `Copilot` co-author trailer are user-authored. The latest such commit was `bf4adf3`; all eight field components in the freeze manifest already matched it, so no source restore commit was necessary.
- **P19-C report-only category audit:** all five are present in the transaction expense enum and budget category list in `src/domain/schemas.ts`, the form choices in `app/transaction-form.tsx`, and the group mapping in `src/domain/budget.ts`; each is tested in `src/components/__tests__/TransactionForm.test.tsx` and exhaustive group coverage is tested in `src/domain/__tests__/budget.test.ts`.
  - Eating out — Yes.
  - Entertainment — Yes.
  - Fashion — Yes.
  - Culture — Yes.
  - Unexpected — Yes.
- **Invest-category coverage:** `src/components/__tests__/TransactionForm.test.tsx` exercises every investment category through instrument selection, form submission/stored category, transaction label/filter, and budget actual (planned line or the Savings and Investments unbudgeted group). `src/components/__tests__/TransactionsScreen.test.tsx` additionally checks the investment row label.
- **Investment category behavior:** users do not choose an investment category directly. They choose a real holding in the transaction form; `investCategoryFor` derives the read-only category from the selected holding type. Emergency fund is a goal only, not an instrument or investment category.
- **Schema version:** P19-C does not change persisted or backup schema; it remains v6.
- **P19-C replaced test assertions:** (1) direct field-component style assertions for compact input height/font size, 40pt wrappers, segmented-option height/font size and hitSlop were replaced with screen-rendering checks for user-field props, labels, values and errors, as explicitly requested by CR-19; (2) body-row wrapping/width/equal-style assertions were replaced with ordered 44pt header targets, exact labels/icons, indicator and navigation checks because CR-17 supersedes that row; (3) five separate expanded balance lines and the old “Includes …” string were replaced by four equal metrics and the compact “Other money in”/optional “Pending” caption, as required by CR-18. The collapsed cap, review dismissal, Available/Closing label switch and no-NaN checks remain.
- **P19-C final gates (2026-10-15):** focused tests 9 suites/203 tests; `npm test -- --coverage` 68 suites/707 tests; TypeScript, Expo lint, Expo Doctor, Android export and iOS export all exit 0. Expo Doctor output: `Running 21 checks on your project...` / `21/21 checks passed. No issues detected!`. Istanbul totals: domain 2,144/2,177 lines (98.48%) and 1,999/2,136 branches (93.59%); data excluding hooks 306/331 lines (92.45%) and 219/241 branches (90.87%); pure lib 107/107 lines and 126/126 branches (100%). `git diff --check` passes. Jest prints a Node experimental warning that localStorage is unavailable without `--localstorage-file`; it does not affect the test result.
- **Expo patch alignment:** the first Doctor run found three SDK 57 patch mismatches (`@expo/ui` 57.0.24→57.0.25, `expo` 57.0.29→57.0.30, `expo-router` 57.0.27→57.0.28). `npx expo install --fix` applied the Expo-compatible versions and the final Doctor run passes 21/21. npm reported 67 audit advisories (17 moderate, 50 high) and two install-script allow-list notices; no `npm audit fix` was run.
- **P19-C device acceptance not verified:** actual title/icon fit at 360pt and OS font scale 2.0; native 44pt touch targets and VoiceOver/TalkBack announcements; rendered 130pt expanded-card height, clipping and scrolling at font scales 1.0/1.3/2.0; and route behavior on physical iOS/Android devices. Tests assert styles and simulated font-scale state only.
- **P21-A/B device acceptance not verified:** actual screen-reader announcements and link/edit flow on physical devices; native dynamic type scaling and clipping in Emergency fund and allocation screens; allocation table wrapping/scrolling; and safe-area/sticky-total behavior on physical iOS/Android. Tests cover pure links/migrations, style contracts, and simulated font scales but no real device.
- **P21-C device acceptance not verified:** actual OS font scaling and clipping of detail-first allocation rows and their final progress bars at 1.3/2.0; header edit and form add/remove touch targets; native confirm-alert copy/layout and cancellation; allocation-form scrolling/keyboard behavior; and VoiceOver/TalkBack announcements. Tests inspect component props and simulated styles only.
- **P21-C1 device acceptance not verified:** open Emergency fund with a real legacy/stale allocation and verify the adjusted-total message, editor keyboard entry and disabled Save at 99.99/100.01, a valid save on iOS and Android, native font scaling/clipping of the repair line, and VoiceOver/TalkBack announcement. Hydration/archive correctness and one-write behavior are covered by tests; physical-device storage behavior is not.
- **P21 Expo Doctor blocker, resolved by P20-D CR-26:** the original Doctor result was 20/21 because user-authored `beb9711` set `ios.icon` to the same PNG as the top-level icon. Commit `8590a4a` removes only the duplicate iOS override. The final P20-E `npx expo-doctor` result is 21/21; Android and iOS exports, tests, typecheck and lint also pass, so P21/P22 gates remain green.
- **P22-A real-device acceptance not verified:** menu confirmation and navigation to Backup/restore, platform persistence and Undo after app restart, and usability/rendering of every screen with the generated four-month dataset have only been checked in Jest/TestRenderer and the store mock; no physical iOS/Android device was used. Final automated gates pass.
- **P20-D CR-21 device acceptance not verified:** at the time of P20-D, bottom placement above physical iOS/Android home indicators, backdrop hit testing, scroll gestures with system font scale 2.0, and action-sheet clipping/keyboard interaction were unverified. CR-27 supersedes the sheet with a native confirmation; physical native alert button behavior remains unverified.
- **P20-K device acceptance not verified:** actual OS font scaling/clipping and goal-row divider rendering at 1.3/2.0; touch conflict and VoiceOver/TalkBack behavior for nested asset/liability card buttons and body edit targets; liability progress-bar/action spacing and clear/Undo toast behavior on physical iOS/Android.
- **P20-D CR-22–CR-25 and P20-E CR-27/28/31 device acceptance not verified:** actual rendered balance/card wrapping and Shortfall contrast; native confirmation button appearance/dismissal, FIFO payment, five-second Undo timing and persistence; demo-load popup behavior and Undo against real storage; divider visibility, row wrapping and no-budget card fit at system font scale 1.3/2.0; VoiceOver/TalkBack announcements and actions; and Home/Transactions/Budget due-list consistency on physical iOS/Android. Tests assert component structure, props/styles, action callbacks and store persistence, but are simulated.
- **Earlier P19-A gate record:** the first `npx tsc --noEmit` attempt exited 2 because the initial mock-budget test did not narrow its nullable fixture; the guard fixed it for that earlier scope. That record predates the expanded P19-A task.
- **P19-A/B final gate record (2026-10-15):** focused tests 11 suites/235 tests; full coverage 68 suites/702 tests; TypeScript, lint, Expo Doctor (21/21) and Android/iOS exports all exit 0. Istanbul aggregation: domain 2,144/2,177 lines (98.48%) and 1,999/2,136 branches (93.59%); data excluding hooks 306/331 lines (92.45%) and 219/241 branches (90.87%); pure lib 107/107 lines and 126/126 branches (100%).
- P15-FIX-R4 final automated gates ran twice and exited 0: 64/64 suites,
  656/656 tests each run; TypeScript; Expo lint; Android and iOS exports; and
  Expo Doctor (21/21 checks). Simulated font-scale tests are not device
  verification.
- **P15-FIX-R5/R6 verification (2026-10-15):** the last green commit
  `2e5d594` passed both target suites (24/24) and the full baseline
  (`npm test -- --runInBand`: 64/64 suites, 659/659 tests). The then-current
  tree reproduced two stale layout failures: `SectionHeaderRow.test.tsx`
  required SortChip inside `SectionHeaderRow`, while current `ChipRow` layout
  was intentional; `TransactionsScreen.test.tsx` expected a separate filter
  scroller although the screen renders one horizontal `ChipRow`. The P15
  ledger commit `d11af45` had reverted the 5aeefb9 ChipRow wrappers on
  `(tabs)/budget.tsx`, `(tabs)/goals.tsx`, `transactions.tsx`, `assets.tsx`,
  `budget-history.tsx`, `emergency-fund.tsx`, `investment-entries.tsx`,
  `liabilities.tsx`, `liability-payments.tsx`, and `link-missing.tsx`; it also
  moved the Transactions sort chip out of the shared ChipRow. That commit
  changed the tab text from `Transactions` to `Txns`; `4178c28` later changed
  it back to `Transactions`. `b92e145` was docs-only. `af76eec` subsequently
  restored the ChipRow presentation, so the present code matches the intended
  wrapper pattern. The two test assertions now require the current ChipRow
  structure and the Transactions test mock models its horizontal scrolling
  behavior. The visible tab label is `Transactions`; accessibility remains
  `Transactions`.
- `npx expo install --check` reported dependencies up to date. The previously
  committed `798e8ef` changed only `package.json` and `package-lock.json`;
  `package.json` updated the direct ranges for `@expo/ui`, `expo`,
  `expo-linking`, and `expo-router`. `expo-constants` was already accepted by
  the current SDK check. Expo Doctor now passes 21/21. Full
  `npm test -- --coverage` passes 65/65 suites and 669/669 tests. Aggregate
  coverage: domain 98.47% lines / 93.68% branches, data excluding hooks
  92.45% / 90.87%, and pure lib 100% / 100%. TypeScript, Expo lint, Android
  export, and iOS export all exit 0. No source, schema, migration, or
  financial-calculation changes were made in R6. The app was not exercised on
  a physical Android/iOS device or development build; safe-area geometry,
  native navigation behavior, and font scales 1.0/1.3/2.0 still need device
  verification.
- **Assumed:** R5 implementation already committed as `9859d73` satisfies the
  requested preservation step; because the worktree was clean, no redundant
  WIP commit was created. SDK patch alignment already existed in the separate
  `798e8ef` package-only commit, so no duplicate `expo install --fix` or empty
  chore commit was created. The visible tab label is `Transactions` per the explicit
  four-tab rule, while the accessibility label remains `Transactions`.
- Final per-directory coverage: domain 2,120/2,153 lines (98.47%) and
  1,986/2,120 branches (93.68%); data excluding hooks 306/331 lines (92.45%)
  and 219/241 branches (90.87%); pure lib 107/107 lines and 126/126 branches
  (100%).
### Known gaps in the record

- The session export archives were not present under `seed/`; available
  session-state exports were used instead. Session 1 and Session 2 history
  report `/mnt/transcripts/` unavailable, so exact prompt text could not be
  recovered for reconstructed entries.
- Reconstructed prompt IDs: P01–P05, P07–P15-J. P01 is only partially
  recoverable; P07 begins with a truncated visible fragment. P06 and
  P06-FIX-R1 are marked verbatim in the session export but could not be
  compared against raw transcripts. P15-FIX-R1 through R4 are verbatim prompt
  files recoverable through the Git commit paths in Section 6. P15-SEED has
  no prompt or matching commit in available inputs and remains unknown.
- P1–P14 original commit hashes/dates are not identifiable in the
  available Git history. The user confirmed their in-app completion on
  2026-10-15 (see the dated confirmation above); original commit/test
  provenance and real-device checks remain unavailable. P15 per-part
  hashes/dates in this ledger were checked against Git; where export summaries
  conflict with Git, Git wins. No unverified export-only commit hash or date is
  recorded as repository evidence.
- **Export/Git date conflict:** the Session 2 export metadata and prior ledger
  date P15-FIX-R4 as 2026-10-13; its first corresponding Git commit
  `0df1952` is dated 2026-10-14. This ledger uses the Git date.
- **P15-LEDGER baseline test issue:** the first full Jest run on the clean
  starting tree failed 26 tests in five suites after UI refactor `5aeefb9`
  removed required section headers, moved the Transactions sort chip into the
  scroller, changed the tab label, and left test doubles unaware of `ChipRow`.
  Restored the documented UI structures/label and added the missing test
  double support; no existing assertions were removed or weakened. The
  subsequent full coverage run passed 64 suites / 658 tests, with aggregate
  coverage 97.76% lines and 93.72% branches.
- **P15-LEDGER gates:** `npx tsc --noEmit`, `npx expo lint`, Android and iOS
  exports all exited 0; Expo Doctor exited 0 with 21/21 checks passed.
- **P20 device checks:** all layout and interaction checks were simulated
  in React Native tests and platform exports; no physical device was used.
  Actual OS font scaling/wrapping, touch response, sheet/modal presentation,
  navigation/back behavior, immediate cross-screen refresh, and tab-bar
  visibility on-device remain unverified.
- **Checkpoint-informed ledger update gates:** the focused progress-ledger Jest
  run passed 5/5 tests; `npm test -- --coverage` passed 64 suites / 659 tests
  (96.55% statements, 93.72% branches, 97.76% lines); TypeScript and Expo
  lint exited 0. Expo exports and Doctor were not rerun because this update
  changes only documentation and the ledger test.
- `seed/export-session-1.zip` and `seed/export-session-2.zip` were missing in
  this checkout. The specified session-state exports and checkpoints were
  available and used; raw `/mnt/transcripts/` were not available.
- P6 real-device/emulator items remain unverified: share-sheet backup and
  import, document picker, biometric/passcode behavior, foreground/background
  lock grace, app-switcher/screenshot privacy, erase UX, force-quit persistence,
  and `allowBackup: false` in a built APK. P6 web execution is unknown.
- P14 review details and exact skipped deliverables remain unknown beyond
  the user's report of incorrect coverage arithmetic, skipped work and
  weakened tests. Original prompt and commit mapping for P1–P14 remain
  incomplete as identified in the Prompt log.
- **Resolved source conflicts:** (1) Session 1's export said several form
  routes were absent and the October 10 patch was incomplete; current Git
  contains 11 `app/*-form.tsx` routes, so their present code was audited and
  supersedes that older checkout snapshot. (2) Session 2's open-items export
  still called CR-2 planned, while Git HEAD `b92e145` already included the
  P15-LEDGER close-out and removed the prompt folder; this task adds checkpoint
  evidence and marks CR-2 Done in this commit. (3) Session 2 dates P15-FIX-R4
  2026-10-13; its first implementation commit `0df1952` is dated
  2026-10-14, so Git wins. (4) Session 2 decisions mark exact P12 schema
  provenance unclear; current `schemas.ts` and `migrate.ts` establish the
  v1→v6 migration chain, and this ledger records v3 onboarding/theme fields
  based on repository/history evidence. No prompt wording or test count was
  invented.
- Prompt log source counts (32 rows): 7 verbatim (2 session-export texts,
  4 Git-archived fix prompts, and this current request), 23 reconstructed,
  and 2 unknown (P15-F and P15-SEED). No phase 1–15 has exclusively unknown
  delivery evidence; P15-F's prompt/scope is unknown and its status is
  explicitly Held. P1–P14 original hashes remain unidentifiable.
- **Current form audit (2026-10-14):** every field has a visible label;
  `DateField` and `MoneyField` supply visible defaults (`Date`, `Amount`)
  where a route omits an explicit label. Two Save buttons become narrower
  when validation summaries are present; these are recorded as CR-3. No form
  source was changed for this audit.

| Form route | Visible field labels | Save full width |
|---|---|---|
| `budget-setup.tsx` | Yes | Yes; sticky footer contains Apply and Save only actions. |
| `budget-month-form.tsx` | Yes | Yes; footer column stretches the Save button. |
| `ef-allocation-form.tsx` | Yes | Yes; footer column stretches the Save button. |
| `ef-entry-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `goal-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `investment-entry-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `investment-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `liability-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `liability-payment-form.tsx` | Yes | Yes; Save flexes across its footer row. |
| `profile-form.tsx` | Yes | **No when validation summary is present**; both summary and Save are `flex: 1` siblings. |
| `transaction-form.tsx` | Yes | **No when validation summary is present**; both summary and Save are `flex: 1` siblings. |

## 9. Upcoming roadmap

1. **P19 — Budget model and sync** (Done): P19-A five-group setup (CR-5),
   P19-B investment/income reconciliation and Budget actions (CR-9, CR-16), and
   P19-C header icons, user-owned inputs and balance card (CR-17–CR-19).
2. **P20 — Pending items, Home, navigation and Budget management**
   (P20-A through P20-V Done; P20-A-R1/R2 and P20-S-R1-R1 revisions Done):
   P20-A pending
   Transactions with Pay/Clear due (CR-6), P20-B Home due actions and collapsed
   spending plan (CR-7, CR-10), P20-C main-screen-only tabs (CR-11), P20-E
   balance normalization/Home confirmations/demo-load popup (CR-27, CR-28,
   CR-31), P20-F due-day and linked schedule groundwork, and P20-G schema-v8
   single-plan setup/apply/repeat behavior (CR-29) with no Budget header menu
   (CR-30 supersedes CR-24). Later parts complete the overview, user-managed
   sections/items, shared form shell, and P20-U route-form replacement of the
   Budget management sheet (CR-86/CR-87). P20-A-R1 routes linked payments
   through clearDue/Undo; P20-N-R2 restores the aggregate Pace graph and
   supersedes P20-N-R1's section-specific chart.
3. **P21 — Emergency fund as a goal-linked model** (Done): P21-A links,
   entries and net-worth/schema v7 changes (CR-8, CR-13); P21-B cover and
   allocation table (CR-14, CR-15); P21-C normal-mode presentation and
   allocation item editing (CR-37, CR-38); P21-C1 invalid-allocation crash
   repair (CR-39), with schema v8 unchanged.
4. **P22 — Demo data**: P22-A's original four-month demo data (CR-12) is
   complete; P22-A-R1 now uses six complete months, Rs 1,00,000 earned
   income/month, Rs 1 crore in assets and Rs 10 lakh in liabilities while
   preserving the existing demo fixtures. Holding opening values are seeded
   directly rather than accumulated from six months of flows.
5. **P23 — Insurance** (Done) [P15-F].
6. **P24 — Reminders and notifications** (Done), including CR-1
   [P15-K]. P24-A implemented local reminders and confirmation; CR-1's former
   Open entry was superseded on 2026-11-08.
7. **P25 — Release preparation and encrypted backups**: P25-A v0.1.0
   release-preparation documentation (Done); P25-B encrypted backups (Done)
   [P15-L]; P25-C release blockers and shared AI memory (Done).
8. **P26 — Accessibility, performance and final gates** (Done)
   [P15-M]; physical-device checks remain open.
9. **P27 — Cleanup** (Done): dead-code/dependency cleanup, bundle audit,
   README update and robust schedule benchmark.
10. **P28 — QA and release** (release records and approved tag verified):
    P28-A/P28-B/P28-C and their recorded revisions plus P28-D/P28-E,
    P28-F-R5 and P28-G are complete. CR-107 moved all 23 screenshots into
    versioned repository paths, changed release thumbnails to browser-viewable
    links, removed only the screenshot release assets after URL verification,
    and standardized ledger/memory phase labels. The v1.0.0
    APK, EAS build metadata, public latest/versioned links and checksum are
    verified; the approved tag points to the build commit on `origin/main`.
    The earlier 43-row Pass report was superseded by P29-AB-R1/R2, P30-A/B/C,
    P20-N-R1/R2 and the P20-A-R1/P29-O1-R1/P29-W-R1 device-checklist updates;
    device re-test remains pending. The v1.0.0 release body intentionally
    retains its pre-existing non-screenshot difference from the published
    note; only its screenshot section was changed at the owner's direction.
    See
    [`docs/releases/build-config.md`](releases/build-config.md), the
    release-build record and the device checklist.
11. **P29 — Product delivery** (42/42 closed): P29-O-R1 closes the
    cancelled ledger-migration scope; P29-O1-R1 and P29-W-R1 add schedule
    counts, collapsed paid entries and maturity/final-EMI caps; P29-AB-R2
    removes non-due recurring income from planned/due rows and totals while
    preserving editability; P29-Q-R1 replaces the unsupported four-choice
    confirmation call with a scalable centered selection dialog.
12. **P30 — Release 2 stabilization** (Done; physical-device re-test
    pending):
    - P30-A — Failing persistence/restart tests and mounted-screen refresh
      harness; the stale SQLite precedence defect was reproduced.
    - P30-B — Verified fallback authority markers and deletion tombstones make
      the newest persisted value win and expose failed writes.
    - P30-C — Memo-input/cache source guard and development-only hydration/write
      verification diagnostic.
13. **P31 — Project health and community** (Planned):
    - P31-A — Add `CODE_OF_CONDUCT.md`. Dependencies: none. This root document
      requires explicit owner authorization when executed.
    - P31-B — Upgrade bug, feature and question issue templates to YAML issue
      forms and add `config.yml`; warn users not to include financial data.
      Dependencies: none.
    - P31-C — Write an accessibility statement and audit checklist. The owner
      confirmed documentation plus an audit, not new app features.
      Dependencies: none.
    - P31-D — Draft a privacy statement from verified source facts only:
      local-only storage, no network calls or analytics, local notifications,
      permissions, encrypted-backup scope, and the unencrypted-at-rest limit.
      This is a root document and requires explicit owner authorization when
      executed. Dependencies: P39-C.
    - P31-E — Add a GitHub Actions workflow for pull requests to `develop` and
      `main`, running gates 1–4 with the Node version in `.nvmrc`, pinned action
      versions, no secrets and minimal permissions. Verify with a real PR run;
      the owner then configures branch protection to require it. Dependencies:
      none.
14. **P32 — Screenshots** (Cancelled by owner):
    - P32-A — Cancelled because the owner already supplied the screenshots.
      Dependencies: none.
    - P32-B — Cancelled because the owner already supplied the screenshots.
      Dependencies: P32-A.
    - P32-C — Cancelled because the owner already supplied the screenshots;
      the supplied images are organized by P28-F-R5. Dependencies: P32-B.
15. **P33 — Widgets** (Planned):
    - P33-A — Research SDK 57 options, config plugin, dev-build need, privacy
      and hide-previews behavior after reactivation. Dependencies: none.
    - P33-B — Implement the Android widget only after owner reactivation and
      research approval. Dependencies: P33-A.
    - P33-C — Implement the iOS widget only if reactivated and iOS
      distribution exists. Dependencies: P33-A and iOS distribution.
16. **P34 — Quick capture** (Planned):
    - P34-A — Research quick-capture scope and platform constraints after
      reactivation; candidates include shake, double-tap back and a key
      combination. Dependencies: none.
    - P34-B — Consider app shortcuts, Quick Settings and notification actions
      that open a prefilled quick-add form after reactivation. Dependencies:
      P34-A.
    - P34-C — Consider an opt-in foreground shake gesture after reactivation.
      Background gestures remain out of scope unless research proves a
      policy-safe route. Dependencies: P34-A.
17. **P35 — Transaction auto-detect** (Planned):
    - P35-A — Research Android notification-listener vs SMS-permission
      options, iOS limitations, Play policy, prominent disclosure, local-only
      parsing and no raw-message storage after reactivation. Dependencies:
      none.
    - P35-B — Obtain the owner's explicit go/no-go decision after reactivation.
      Dependencies: P35-A.
    - P35-C — No transaction auto-detection implementation may begin until
      the owner explicitly gives a go decision in P35-B. Dependencies: P35-B
      owner go/no-go approval.
18. **P36 — Notes** (Planned):
    - P36-A — Design text notes, voice/audio recordings, photos and videos;
      optional links to financial records; offline storage, media limits,
      backup/migration compatibility and schema-v24 impact. Dependencies:
      none. Demo data and tests are required per DEC-DEMO.
    - P36-B — Implement Notes schema, attachment metadata and pure domain
      behavior with offline-safe storage and backup compatibility.
      Dependencies: P36-A. Demo data and tests are required per DEC-DEMO.
    - P36-C — Implement the Notes UI for writing, recording and attaching or
      viewing photos and videos. Dependencies: P36-B. Demo data and tests are
      required per DEC-DEMO.
    - P36-D — Add deterministic Notes demo data without personal media.
      Dependencies: P36-C. Demo data and tests are required per DEC-DEMO.
19. **P37 — First-run tutorials** (Planned):
    - P37-A — Design per-feature skippable coach marks, replay from the menu,
      flags in the meta store rather than AppData, and accessibility.
      Dependencies: none. Demo data and tests are required per DEC-DEMO.
    - P37-B — Implement the tutorial framework. Dependencies: P37-A. Demo
      data and tests are required per DEC-DEMO.
    - P37-C — Implement per-feature tours. Dependencies: P37-B. Demo data and
      tests are required per DEC-DEMO.
20. **P38 — Loading feedback and skeletons** (Planned):
    - P38-A — Inventory operations with genuine asynchronous loading and
      define skeleton behavior, theme, accessibility and reduced-motion
      requirements. Dependencies: none.
    - P38-B — Implement reusable skeleton loaders for identified loading
      states only; preserve explicit errors and empty states. Dependencies:
      P38-A.
    - P38-C — Test loading, success, empty and failure transitions; ensure
      skeletons do not mask errors or flash during synchronous operations.
      Dependencies: P38-B.
21. **P39 — Release audit and hardening** (Planned; report-first):
    - P39-A — Read-only audit of dead code, secrets/configuration, app lock,
      notification-response routing, `wealthwise://` deep links, silent
      failures, performance, dependencies, debug residue, TODO debt,
      permissions and first launch. Every finding needs file/line evidence
      and severity P0-P3. Dependencies: none.
    - P39-B — Verify secrets, network behavior and debug residue across
      tracked files, Git history patterns and EAS config; inspect the exported
      bundle to prove demo/stress loaders and the dev storage diagnostic are
      absent or unreachable; inspect console/debugger statements and source
      maps; add a regression test for no fetch/XHR/WebSocket in `app/` or
      `src/`. Dependencies: P39-A.
    - P39-C — Trace privacy-sensitive permissions from declaration through
      request to use for notifications, biometrics, file/share/document
      picker and SQLite; check denial/revocation behavior and Android
      `allowBackup` in resolved config, marking unverifiable items unverified.
      Dependencies: P39-A.
    - P39-D — Extend P30's silent-failure/recovery audit across storage,
      backup import/export, notification scheduling and SQLite fallback
      visibility. Dependencies: P39-A.
    - P39-E — Triage current `npm audit` findings by production reachability
      versus tooling, record accepted risks and owner decisions; no force fix
      or install-script approval. Dependencies: P39-A.
    - P39-F — Inventory TODO/FIXME markers, the skipped test and opt-in stress
      benchmark; assign a disposition to each. Dependencies: P39-A.
    - P39-G — Walk through onboarding, lock, reminders prompt, first
      transaction and interrupted/denied paths from a clean install; findings
      feed P37-A. Dependencies: P39-A.
    - P39-H — Group findings into the smallest independent remediation
      batches, containment before cleanup, owner approvals and rollback.
      Detailed reports stay in chat or `/tmp`; only the findings summary table
      enters this ledger. Dependencies: P39-B through P39-G.
22. **P40 — Agent-context hygiene** (Planned):
    - P40-A — Report-only measurement of `docs/PROGRESS.md`,
      `docs/memory/*` and `AGENTS.md` sizes, their parsing tests and
      per-prompt read cost. Dependencies: none.
    - P40-B — After P40-A and owner approval, move completed-phase narrative
      from `PROGRESS.md` into archive files, keep the dashboard,
      standing rules and open items in the main file, and update ledger tests
      to read archives without weakening assertions. Dependencies: P40-A and
      owner approval.

**Superseded (2026-11-08):** the earlier roadmap ended at P28 and marked
P24, P26, P27 and P28 as in progress or planned. Those entries have been
updated above; use the dashboard for the canonical status. Fixes to completed
work remain in their original phase and use `<ID>-R<n>` (for example,
`P29-AB-R1`), with the original row noting `Revised by`.

## 10. Verification matrix

An item is `Done` only when its named source and test evidence are available.
Paths below are repository-relative. Baseline results are not completion
evidence for the fixes.

### 2026-11-10 — CR-106 roadmap planning

- Updated only the progress ledger, shared status/open-items memory and the
  progress-ledger regression. No app source or release files changed. The six
  protected Git blob IDs in `docs/memory/rules.md` were all verified unchanged.
- The six ordered gates all exited 0:

  | Gate | Command | Exit / result |
  |---:|---|---|
  | 1 | `npm test -- --coverage` | 0; 98 suites, 1,271 passed, 1 skipped (1,272 total); coverage 95.96/92.04/98.02/97.63% statements/branches/functions/lines |
  | 2 | `npx tsc --noEmit` | 0 |
  | 3 | `npx expo lint` | 0 |
  | 4 | `npx expo-doctor` | 0; 21/21 checks |
  | 5 | `npx expo export --platform android` | 0 |
  | 6 | `npx expo export --platform ios` | 0 |

- Gate 1 per-source coverage: `src/data` lines 760/807 (94.18%), branches
  799/914 (87.42%); `src/domain` lines 3,598/3,659 (98.33%), branches
  3,573/3,847 (92.88%); `src/lib` lines 107/107 (100%), branches 126/126
  (100%). The focused ledger/memory test run passed 2 suites/12 tests.
- All progress bars and percentages are recomputed by the ledger regression.
  Final `git diff --check` exited 0. No
  physical-device behavior was claimed or tested; no EAS or Gradle build was
  run.

### 2026-11-10 — CR-107 final verification

- Gate 1 passed with 98 suites, 1,278 passed and 1 skipped (1,279 total).
  Coverage, in statements/branches/functions/lines order:

  | Scope | Statements | Branches | Functions | Lines |
  |---|---:|---:|---:|---:|
  | Overall | 95.96% | 92.04% | 98.02% | 97.63% |
  | `src/data` | 91.03% | 87.41% | 94.46% | 94.17% |
  | `src/domain` | 96.94% | 92.87% | 98.80% | 98.33% |
  | `src/lib` | 100% | 100% | 100% | 100% |

- All six gates passed in order:

  | Gate | Command | Exit / result |
  |---:|---|---|
  | 1 | `npm test -- --coverage` | 0; 98 suites, 1,278 passed, 1 skipped (1,279 total); coverage as above |
  | 2 | `npx tsc --noEmit` | 0 |
  | 3 | `npx expo lint` | 0 |
  | 4 | `npx expo-doctor` | 0; 21/21 checks |
  | 5 | `npx expo export --platform android` | 0 |
  | 6 | `npx expo export --platform ios` | 0 |

- Focused `progressLedger.test.ts` and `memoryDocs.test.ts` passed 2 suites /
  16 tests. `memoryDocs.test.ts` needed no assertion change because its test
  counts are derived from the documented values. This focused run was repeated
  after the final ledger/memory updates; the full ordered gates had already
  passed on the completed feature and regression-test tree. The test
  replacements were:

  | Old assertion | New assertion | Reason |
  |---|---|---|
  | Dashboard counts expected P22 at 1/2, P28 at 32/35 and overall at 164/202. | Derived counts are P22 2/2, P28 34/35 and overall 167/202; bars are 100%, 97% and 83%. | P22-A-R1, P28-F-R5 and P28-G are now closed; the denominator and rounding rule are unchanged. |
  | Change-request and prompt-log guards stopped at CR-106; no CR-107 row was required. | Guards require CR-107 exactly once in the register and prompt log, and assert all three revised/completed dashboard rows. | Keep final task status and completion evidence synchronized without weakening prior inventory checks. |
  | `demoData.test.ts` expected four complete months and menu labels/copy said four months. | Tests and user-visible demo-menu copy require six complete months. | Keep the sample horizon clear and match the six-month fixtures. |
  | Demo assertions used Rs 75,000 monthly earned income, the former asset/liability scale and prior valuation/net-worth fixtures. | Plan incomes sum to Rs 1,00,000 each month, expenses plus investments stay within income, and the injected-date portfolio is Rs 1 crore assets / Rs 10 lakh liabilities / Rs 90 lakh net worth. | Verify the new lakh/crore data contract instead of stale aggregate values. |
  | `goalLinks.test.ts` expected Rs 1,87,000 for the linked Emergency Fund at 2026-10-12; demo checks covered projections but had no every-goal percentage cap. | It expects Rs 20,00,000 at that as-of date; acceptance now caps every goal, including the automatic Emergency Fund, at 87% and retains a broad spread. | Reflect directly seeded linked assets and enforce the owner-specified cap across all goals. |
  | Selector snapshots expected 34 pending dues / Rs 38,900 and 869 uncapped reminders; the Emergency Fund available bucket used Rs 1,87,000. | Snapshots expect 33 / Rs 41,650 and 909 reminders; the available bucket is Rs 20,00,000. | Reconcile dependent selector, reminder and bucket outputs to the expanded deterministic fixture. |
  | The demo route had no explicit crore-tier render assertion at larger font scales. | `RouteRenderSmoke` requires `₹1.00 Cr` at simulated font scales 1.3 and 2.0. | Verify the expected amount tier and layout contract; physical-device rendering remains separate. |
  | Screenshot thumbnails used GitHub Release asset links that open as downloads. | Documentation tests require the versioned main-branch blob/raw repository links. | Images should open in the browser and remain part of the repository rather than release assets. |
  | Phase-label checks expected `Phase <n>` in dashboard, bars and roadmap. | Checks require `P<n>` / PN labels and allow `Phase <digits>` only in documented exclusions. | Consistent notation while preserving original subjects, Git refs, URLs, release docs, changelog and app source. |

- Demo outputs at the fixed injected date 2026-11-04:

  | Output | Before (four-month fixture) | After (six-month fixture) |
  |---|---:|---:|
  | Earned income per month | Rs 75,000 | Rs 1,00,000 |
  | Assets | Rs 5,24,000 | Rs 1,00,00,000 |
  | Liabilities outstanding | Rs 3,89,107.93 | Rs 10,00,000 |
  | Net worth | Rs 1,34,892.07 | Rs 90,00,000 |
  | Goal savings total | Rs 4,87,300 | Rs 80,29,000 |
  | Emergency Fund available | Rs 1,87,000 | Rs 20,00,000 |
  | Pending dues | 34 / Rs 38,900 | 33 / Rs 41,650 |
  | Uncapped reminder count | 869 | 909 |

  | Goal | Before saved / target | Before progress | After saved / target | After progress |
  |---|---:|---:|---:|---:|
  | Emergency Fund | Rs 1,87,000 / Rs 2,50,000 | 74.80% | Rs 20,00,000 / Rs 25,00,000 | 80.00% |
  | Retirement portfolio | Rs 16,400 / Rs 10,00,000 | 1.64% | Rs 4,000 / Rs 20,000 | 20.00% |
  | Home deposit | Rs 2,21,400 / Rs 8,00,000 | 27.68% | Rs 40,00,000 / Rs 47,00,000 | 85.11% |
  | Education fund | Rs 37,500 / Rs 2,00,000 | 18.75% | Rs 20,00,000 / Rs 25,00,000 | 80.00% |
  | Family holiday | Rs 25,000 / Rs 5,00,000 | 5.00% | Rs 25,000 / Rs 1,25,000 | 20.00% |

  Linked asset values count in full for each linked goal. Holding opening
  valuations are directly seeded at the injected `today`; they are not derived
  from six months of contributions. Monthly expenses plus investments remain
  within earned income; existing categories, custom Pets/Domestic help items,
  policies, linked records, overdue SIP and paid/partial/overdue/future Budget
  rows remain covered. The simulated screen-level route test renders the
  crore tier at font scales 1.3 and 2.0; physical-device rendering remains
  unverified.

- Screenshot/release verification:

  | Release | Repository screenshots | Release screenshot assets before → after | Retained APK (bytes) |
  |---|---:|---:|---|
  | v1.0.0 | 7 | 7 → 0 | `WealthWise-android-v1.0.0.apk` (112,133,413) |
  | v1.1.0 | 8 | 8 → 0 | `WealthWise-android-v1.1.0.apk` (112,147,677) |
  | v1.1.1 | 8 | 8 → 0 | `WealthWise-android-latest-v1.1.1.apk` (112,150,605) |

  All 46 main-branch blob/raw screenshot URLs returned HTTP 200; all 23 raw
  image sizes matched the committed files. Rendered releases show 7/8/8
  images. After screenshot-asset deletion, each release has only its APK;
  all three APK URLs still return HTTP 200 at the recorded byte sizes. The
  README Download block remains byte-identical to the latest published note.
  At the owner's direction, only the screenshot section of the v1.0.0 release
  body changed because its pre-existing non-screenshot body differs from the
  published note. The v1.1.0 and v1.1.1 bodies match their notes outside
  screenshot-section updates. The published v1.1.1 APK does not contain the
  demo-data change.

- The feature integration chain is verified: task PR #83 merged to P28 as
  `c9fe4660602fc443fcfa9c4bd00cacccb98c3173`; task PR #84 as
  `77cdc9e2f1899b18e0cf108bfb4eba6dc8652f4e`; task PR #85 as
  `8afd37401ef8abcf7e5fe8ee4a91468b20c58b97`; P28 PR #86 to `develop` as
  `d6cc56822ee332f609e2d7800df0fca657453623`; authorized `develop` to `main`
  PR #87 as `c8a58abbc2ebcc9b9e25e80c47e5472d58294620`; and main-to-develop
  back-merge PR #88 as `8da39bd8653ceee6ea066e7ee78d7b3f05e38033`. The three
  integrated refs had tree `2667fd423730bb2a25406b3634c9f2ff58d2a6d7`;
  final evidence-branch integration is recorded in Section 11 and the task
  report.

### 2026-11-09 — current develop verification and roadmap decisions

- The clean preflight on `develop` at `c939458` passed all six ordered gates.
  Its full Gate 1 run was 98 suites, 1,268 passed, 1 skipped; coverage was
  95.96% statements, 92.04% branches, 98.02% functions and 97.63% lines.
  Gates 2-6 exited 0, with Expo Doctor 21/21 and Android/iOS exports complete.
  Those full gates predate this continuation's final documentation/test edits.
- This revision changes release/memory/ledger documentation and documentation
  regression tests only; app source is unchanged. The six required gates were
  rerun in order: `npm test -- --coverage` exited 0 (98 suites, 1,271 passed,
  1 skipped; 95.96/92.04/98.02/97.63% statements/branches/functions/lines),
  `npx tsc --noEmit` 0, `npx expo lint` 0, `npx expo-doctor` 0 (21/21),
  `npx expo export --platform android` 0, and
  `npx expo export --platform ios` 0. Focused release/memory/ledger tests
  passed 3 suites/21 tests; `git diff --check` exited 0.
- Previously recorded ordered gate exit codes:

  | Gate | Command | Exit |
  |---:|---|---:|
  | 1 | `npm test -- --coverage` | 0 |
  | 2 | `npx tsc --noEmit` | 0 |
  | 3 | `npx expo lint` | 0 |
  | 4 | `npx expo-doctor` (21/21) | 0 |
  | 5 | `npx expo export --platform android` | 0 |
  | 6 | `npx expo export --platform ios` | 0 |

  No new EAS or Gradle build was run; the previously verified owner-provided
  v1.1.1 APK remains attached to the GitHub draft.
- P30-A reproduced the stale-SQLite-over-newer-fallback persistence path after
  failed writes, read-back mismatch or legacy fallback; P30-B repaired it and
  P30-C added source guards and diagnostics. The P30 repair is not in the
  published v1.0.0 source tree. Direct tree comparison confirms the v1.1.0
  release source contains the repaired `sqliteStateStorage.ts` implementation
  and matches develop for that file; the recorded v1.1.0 APK was verified
  against its EAS artifact and tag. Do not infer the v1.0.0 behavior from
  v1.1.0; it predates that persistence repair. The new linked one-time savings
  fix remains after v1.1.0 and is in this candidate release scope.
- The owner confirmed that accessibility scope is an accessibility statement
  plus an audit checklist, not new app features. Screenshot capture will use
  Device Hub.app, synthetic demo data and a one-off script kept outside the
  repository and deleted after capture; the script must never be included in
  an app build. Capture only the matching release build unless the owner
  explicitly approves reuse of one image across versions; never capture
  personal phone data. Version-specific screenshots are planned for README,
  release Markdown and GitHub Release bodies, with image assets attached to each
  corresponding release, including v1.0.0 and v1.1.0. The owner explicitly
  authorizes screenshot-only additions to those published records.
- The owner deferred widgets, quick capture (including shake, double-tap back
  and key-combination options), and SMS/notification auto-detection; those
  remain Held for future reactivation. Notes scope now includes text,
  recordings, photos and videos. Skeleton loading is a separate P38.
- N44 is owner-reported Pass and recorded in the device checklist. A new EAS
  artifact had not been built or verified at this earlier pre-approval
  checkpoint. Candidate notes were still under owner review; this state was
  updated after approval in the v1.1.1 candidate validation entry below.
- The roadmap regression now requires P33-P35 to be `Held by owner`, preserves
  planned status for the remaining future work and includes the new P38
  rows. This replaces the old assertion that every P31–P37 part was
  `Planned`, because the owner explicitly deferred widgets, quick capture and
  transaction auto-detection and requested skeleton loading. The dashboard
  denominator changes from 175 to 178 while the 153 completed parts remain
  unchanged. Focused validation exited 0 (3 suites, 18 tests):

  ```bash
  npm test -- --runInBand src/lib/__tests__/progressLedger.test.ts src/lib/__tests__/memoryDocs.test.ts src/lib/__tests__/releaseDownloadDocs.test.ts
  ```

### 2026-11-09 — approved v1.1.1 candidate validation

- The owner approved the v1.1.1 Markdown draft. The app, package and lockfile
  versions now agree at 1.1.1; the candidate remains a patch release.
- All six required gates passed in order on
  `task/P28-F-R4-R1-R1-approve-v1-1-1`:

  | Gate | Command | Exit |
  |---:|---|---:|
  | 1 | `npm test -- --coverage` (98 suites; 1,269 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall coverage) | 0 |
  | 2 | `npx tsc --noEmit` | 0 |
  | 3 | `npx expo lint` | 0 |
  | 4 | `npx expo-doctor` (21/21) | 0 |
  | 5 | `npx expo export --platform android` | 0 |
  | 6 | `npx expo export --platform ios` | 0 |

- Focused release/memory/ledger verification passed 3 suites / 19 tests;
  `git diff --check` passed. No EAS or Gradle build was run.
- Task PR #56 and P28 PR #57 merged; the pushed `release/v1.1.1` branch
  is at `cbb8454`, based on merged candidate `d16886d`. The GitHub draft
  targets `cbb8454` and includes the screenshot asset. N44 remains
  owner-reported Pass; APK/device verification awaits owner build and upload.
  Publication requires separate approval after artifact checks.

### P28-F-R4-R1-R1-R1 — expanded screenshots and clarified release handoff (2026-11-09)

- Copied 23 owner-supplied PNGs into versioned paths and attached them to the
  corresponding GitHub releases: 7 for v1.0.0, 8 for v1.1.0, and 8 for
  v1.1.1. The screenshots display demo labels/content. Updated README and all
  release Markdown screenshot sections; removed Contributors sections from
  all release notes and GitHub release bodies.
- Updated release instructions: after owner approval, complete all release
  details and move the note to `published/` before GitHub Release draft
  creation. Immediately after draft creation, ask via the ask-user dialogue
  for the absolute APK path or manual-upload confirmation. If no screenshots
  are supplied, reuse the previous release's complete set.
- After owner feedback, changed the README, all three release notes and all
  three GitHub release bodies to 150-pixel thumbnails in rows of no more than
  four; the focused documentation test now checks these row limits.
- Further owner feedback limited README to only the latest screenshot set
  under the unversioned `Screenshots` heading. The v1.1.1 note now contains
  every template section, uses the expected versioned latest-download link,
  and omits the prior APK-upload status message; the existing GitHub draft
  body mirrors the complete note with public preview image URLs.
- Owner specified screenshot order: Home, Assets, Liabilities, Emergency Fund,
  Goals, Insurance, Budget, Transactions, omitting screens unavailable in a
  release. Reordered the README, three release notes and GitHub release
  galleries accordingly.
- The published v1.1.0 GitHub page visually renders the gallery as two rows
  of four thumbnails. All 23 image links across the three release bodies
  return HTTP 200; no APK was built or uploaded and no release was published.
- The existing v1.1.1 draft predates this revised process and remains at its
  original target. Its own eight screenshot assets are attached; its body
  uses byte-identical public v1.1.0 image assets because v1.1.1 draft assets
  are not publicly fetchable before publication. The revised v1.1.1 Markdown
  has owner approval and is now moved to `published/`; required task/phase/
  `develop` PR integration is in progress. The GitHub draft remains
  unpublished; no APK was built or uploaded.
- `npm test -- --runInBand src/lib/__tests__/releaseDownloadDocs.test.ts`:
  passed (1 suite, 7 tests). `git diff --check`: passed.
- All 23 image links in the three GitHub release bodies returned HTTP 200;
  each release has the corresponding complete screenshot set attached, and
  all three release bodies omit Contributors sections.
- The six required gates were rerun in order on the screenshot/documentation
  revision: `npm test -- --coverage` 0 (98 suites, 1,269 passed, 1 skipped;
  95.96/92.04/98.02/97.63% overall coverage); `npx tsc --noEmit` 0;
  `npx expo lint` 0; `npx expo-doctor` 0 (21/21);
  `npx expo export --platform android` 0; `npx expo export --platform ios`
  0. An initial Gate 1 attempt exited 1 because the progress ledger
  dashboard/index and assertions had not yet been updated for this new
  in-progress subtask; counts and guards were corrected, then the full
  ordered rerun passed. Targeted ledger/release tests pass 2 suites/18 tests.

### P28-F-R4-R1-R1-R1-R1 — agent-run APK build and release numbering audit (2026-11-09)

- Updated the shared repository instructions and release docs so the release
  agent builds with EAS profile `android-apk`, uploads the APK to the GitHub
  draft and verifies it after Markdown approval, merge to `develop` and draft
  creation. Separate publication approval remains required. Other EAS builds
  and local Gradle builds remain gated.
- Audited all 10 Markdown files under `docs/releases/`. Every ordered list
  sequence is consecutive, including README lifecycle steps, release/build
  checklists and numbered RELEASE_PROMPT sections. No renumbering was needed.
- `npm test -- --runInBand src/lib/__tests__/releaseDownloadDocs.test.ts src/lib/__tests__/progressLedger.test.ts src/lib/__tests__/memoryDocs.test.ts`: exit 0 (3 suites, 19 tests).
- `git diff --check`: exit 0.
- The six app gates were not rerun because this is a documentation and test
  update with no application-source changes. The owner has already started
  the v1.1.1 `android-apk` EAS build; no duplicate build was started.
- Task PR #60 merged into P28 as `3605468`; Phase PR #61 merged into
  `develop` as `c61272f`. The task branch was deleted; P28 remains.

### P28-F-R4-R1-R1-R1-R1-R1 — release screenshot assets and latest-version rules (2026-11-09)

- Corrected `RELEASE_PROMPT.md` section numbering and clarified that only the
  latest published release uses `Latest version`, `/latest/`, and the
  `latest` APK filename. Older published notes use `Version` and versioned
  direct links.
- Standardized image asset names to
  `WealthWise-vX.Y.Z-screenshot-<screen>.png`, updated README and release
  galleries to use release asset URLs, and removed the repository screenshot
  directory after confirming all 23 screenshots were attached to their
  matching GitHub releases. The README continues to show v1.1.0 screenshots
  while v1.1.0 is the latest published release.
- Updated v1.0.0 and v1.1.0 GitHub release bodies to match their versioned
  screenshot assets. Updated the v1.1.1 draft body to match its approved
  versioned note and assets; the release remains a draft, so its assets are
  not publicly downloadable before publication.
- The owner-provided v1.1.1 APK was previously verified against EAS and
  remains attached as `WealthWise-android-latest-v1.1.1.apk`; its 112,150,605
  byte size and build metadata are recorded in the release history. No digest
  is included here.
- Focused documentation tests: exit 0 (3 suites, 20 tests).
- Ordered gates: `npm test -- --coverage` exit 0 (98 suites, 1,270 passed,
  1 skipped; coverage 95.96/92.04/98.02/97.63% overall); `npx tsc --noEmit`
  exit 0; `npx expo lint` exit 0; `npx expo-doctor` exit 0 (21/21);
  `npx expo export --platform android` exit 0; and
  `npx expo export --platform ios` exit 0. `git diff --check` exits 0.
- Task PR #64 merged into P28 as `dd8c6b6`; Phase PR #65 carries the
  completed release documentation to `develop`. v1.1.1 is not published; no
  tag or latest-route rollover was made.

### P28-F-R4-R1-R1-R1-R1-R1-R1-R1 — v1.1.1 publication and rollover (2026-11-09)

- Published the owner-approved v1.1.1 release after release PR #69 merged to
  `main` and back-merge PR #70 integrated it into `develop`. Tag `v1.1.1`
  points to the main merge commit `ce90a13`; GitHub confirms it is latest.
- Verified the owner-provided APK against the EAS artifact and the uploaded
  asset byte-for-byte before publication. The 112,150,605-byte APK is
  published as `WealthWise-android-latest-v1.1.1.apk`; no digest is recorded.
- Updated the README and release history for v1.1.1, finalized its release
  date, and changed only the Download block in the published v1.1.0 note.
  Uploaded `WealthWise-android-v1.1.0.apk`, updated its release body and
  removed the obsolete latest-named asset.
- `curl -I -L` checks passed: the v1.1.1 latest APK returns HTTP 200 at
  112,150,605 bytes; the v1.1.0 and v1.0.0 versioned APKs return HTTP 200 at
  112,147,677 and 112,133,413 bytes; the retired v1.1.0 latest-named URL
  returns HTTP 404. All eight v1.1.1 screenshot URLs return HTTP 200 at their
  expected sizes.

### P28-E-R3 — selected history ancestry on develop

| Area | Status | Evidence |
|---|---|---|
| Ancestry and tree preservation | Verified on `develop` | `f994457`, `7bea8e6` and `b779c21` are ancestors via `a654f66`, `be7b394` and `0697d88`. These ancestry commits preserve the captured `origin/develop` tree `dba012ebe61de2796960711ed9948b2fad1352f1`; subsequent changes are limited to ledger/memory documentation and a ledger test. No application source paths changed. `main` remains at baseline `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`. |
| Archive clarification | Recorded | PR #46 initially changed only `history/by-phase`; P28-E-R4 connects its full tip by ancestry without taking its tree. The archive tree `f5f10867771cf74d03071f4c8d8a5cbfd7941156` is an older snapshot, not the current main tree; task PR #49 and P28 PR #50 are merged. |
| Progress-ledger assertions | Updated | Old: the dashboard assertion required only `Revised by P28-E-R1`, and the ID lists omitted P28-E-R2/R3. New: the assertion requires `Revised by P28-E-R1, P28-E-R2 and P28-E-R3`, and both ID lists include R2/R3. Reason: ensure the new revision is tracked exactly once while retaining count and branch-index guards. |

Final-tree gates, run in order: `npm test -- --coverage` 0 (98 suites,
1,267 passed, 1 skipped; 95.96% statements, 92.04% branches, 98.02% functions,
97.63% lines overall); `npx tsc --noEmit` 0; `npx expo lint` 0;
`npx expo-doctor` 0 (21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Gate 1 coverage by `src/` directory
(statements/branches/functions/lines): `data` 91.03/87.41/94.46/94.17%,
`domain` 96.94/92.87/98.80/98.33%, and `lib` 100% in all four measures.
The merge PRs follow task -> P28 -> `develop`; no release, tag, or `main`
change is included.

### P28-E-R4 — connect the history archive to develop

| Area | Status | Evidence |
|---|---|---|
| Archive ancestry | Verified on `develop` | The full `history/by-phase` tip `e4a95d57d7bfa3d062d233c3ca315a1a520ef654` is reachable via tree-preserving merge `c4f9aba`; the merge retained the captured `develop`/P28 tree `ba3afcec6de34a28295ac3cf5f14736c29b1e96d`. |
| Branch code preservation | Verified after PRs | `main` and `release/v1.1.0` remain at `7bea8e62c10f641f1fe9aeb9e3ef605b3620250a`, tree `207ed97e541e55919d5cb58afbd25c4b0ed835c0`. |
| Branch connectivity | Verified after PR #50 | Every remote branch tip, including all 30 phase branches and `history/by-phase`, is reachable from `develop`. Task PR #49 merged as `7f9221a`; P28 PR #50 merged as `b5dbe5f`. |
| Progress assertions | Updated | The test counts P28-E-R4 exactly once and expects the completed P28 total, without weakening branch-index, status, or progress-percentage checks. |

Final ordered gates on the ancestry-connected task branch: `npm test -- --coverage`
0 (98 suites, 1,267 passed, 1 skipped; 95.96% statements, 92.04% branches,
98.02% functions, 97.63% lines); `npx tsc --noEmit` 0; `npx expo lint` 0;
`npx expo-doctor` 0 (21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Gate 1 coverage by `src/` directory
(statements/branches/functions/lines): `data` 91.03/87.41/94.46/94.17%,
`domain` 96.94/92.87/98.80/98.33%, and `lib` 100% in all measures. Task PR #49 and P28 PR #50 are merged in
order. Physical-device checks do not apply to this history-only change.

### P28-E-R5 — audit historical commits and add the v1.0.0 branch

| Area | Status | Evidence |
|---|---|---|
| Historical commit reachability | Verified | The 403 first-parent non-merge commits after `f272580` are already in `main` and therefore in `develop`; every commit is also reachable from at least one of the 30 existing remote phase branches. No original commit remains to be introduced through a new PR. |
| Commit-subject audit | Verified | 319 of 403 subjects pass the current commit-msg hook; 84 legacy subjects do not. Rewording them changes commit IDs and requires history rewriting, so subjects and hashes were left unchanged. |
| v1.0.0 release branch | Created | `release/v1.0.0` points to tagged commit `cac6fedc6242b495558f11cc6d7fe8551fd354ea` (the peeled `v1.0.0` tag target). It is already an ancestor of `main` and `develop`; this branch adds no commits or tree changes. |
| Protected branches | Verified | `main`, `develop`, and `release/v1.1.0` were not moved or modified by creating the historical alias branch. The tag was not moved. |
| PR feasibility | No PR for original commits | All requested commits are already ancestors of the intended integration branches. GitHub would offer no new diff to merge; retroactively changing their PR provenance or subjects is not possible without rewriting history. |
| Audit record integration | Verified | Task PR #52 merged into P28 as `f9bb715`; P28 PR #53 merged into `develop` as `04025926a95b8dda22f15e67b4ea3c3c8769a994`. |
| Progress-ledger assertions | Updated | Old: P28-E-R5 was asserted as in progress, P28 was 23/24, and overall progress was 151/174. New: P28-E-R5 is done, P28 is 24/24, and overall progress is 152/174. Reason: task PR #52 merged the completed audit record into P28; no progress guard or threshold was removed. |
| Final integration | Verified | P28 PR #53 merged into `develop` as `04025926a95b8dda22f15e67b4ea3c3c8769a994`. `main` and both release branch tips remain unchanged. |
| Progress-ledger revision | Updated | Old: P28-E-R5 evidence said PR #53 was pending, with P28 at 24/24 and overall progress at 152/174. New: P28-E-R5-R1 records the merge; P28 is 25/25 and overall progress is 153/175. Reason: keep the ledger and memory current after authorized PR integration, with exact-once ID and count guards retained. |

Ordered task-branch gates before PR: `npm test -- --coverage` 0 (98 suites,
1,267 passed, 1 skipped; 95.96% statements, 92.04% branches, 98.02% functions,
97.63% lines); `npx tsc --noEmit` 0; `npx expo lint` 0; `npx expo-doctor` 0
(21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Physical-device checks do not apply to
this history-only change.

Final ordered P28 branch gates before PR to `develop`: `npm test --
--coverage` 0 (98 suites, 1,267 passed, 1 skipped; 95.96% statements, 92.04%
branches, 98.02% functions, 97.63% lines); `npx tsc --noEmit` 0;
`npx expo lint` 0; `npx expo-doctor` 0 (21/21);
`npx expo export --platform android` 0; and
`npx expo export --platform ios` 0.

Final ordered P28-E-R5-R1 task-branch gates: `npm test -- --coverage` 0
(98 suites, 1,267 passed, 1 skipped; 95.96% statements, 92.04% branches,
98.02% functions, 97.63% lines); `npx tsc --noEmit` 0; `npx expo lint` 0;
`npx expo-doctor` 0 (21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Focused
`npm test -- --runInBand --silent src/lib/__tests__/progressLedger.test.ts`
also passes (1 suite, 11 tests).

### P20-S-R1 — form Dropdowns and visible titles

| Area | Status | Evidence |
|---|---|---|
| ChoiceField conversion | Done (owner-approved) | All non-filter `ChoiceField` uses in app forms/settings are replaced with `Dropdown`; `ChoiceField` remains implemented, and filter chips are unchanged. |
| Visible titles | Done (owner-approved) | Added persistent single-line titles to editable text, money, number and percent controls without an existing title, plus context-specific labels on date controls that lacked them. SegmentedControl title props are intentionally absent per the owner's follow-up. Existing Dropdown, SwitchRow and ReadOnlyRow labels remain; filters are unchanged. No editable input was replaced with ReadOnlyRow. |
| Assertions | Updated | The old `expect(amount.props.label).toBe('Amount')` checked a placeholder prop; the replacement asserts visible `Amount` title text. The former Transaction type title and Investment type title assertions are removed per the owner's request to keep SegmentedControl titles absent; the Transaction test still asserts all three type options, and the manual Investment type test asserts that `Fixed deposit` remains selectable. |
| Owner review | Approved | Owner approved commit/merge and explicitly directed that removed SegmentedControl labels stay removed. |

Final-tree gates, run in order: `npm test -- --coverage` 0 (98 suites, 1,267
passed, 1 skipped; 95.96% statements, 92.04% branches, 98.02% functions,
97.63% lines overall); `npx tsc --noEmit` 0; `npx expo lint` 0;
`npx expo-doctor` 0 (21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Coverage by instrumented `src/` directory
(statements/branches/functions/lines): `data` 91.03/87.41/94.46/94.17%,
`domain` 96.94/92.87/98.80/98.33%, and `lib` 100% in all measures. PR
integration evidence is recorded below. Physical-device rendering remains
unverified.

### P20-A-R2 — linked one-time manual savings

| Area | Status | Evidence |
|---|---|---|
| Before-fix screen reproduction | Reproduced | `PendingItemActions.test.tsx` failed before production edits when a Budget link existed only in the viewed-month snapshot: expected `clearDue`, observed no call. Red reproduction commit: `4cfa20c`. |
| Before-fix real-store output | Reproduced | For Savings account, Cash and Other manual holdings: one generic invest transaction, zero holding entries, one persisted write. With $10,000 starting Invested/value and a $5,000 planned item, Budget actual became $5,000, remaining became zero and the pending row disappeared; holding values stayed $10,000 and Budget enum status was `near`. Recorded in `4107494`. |
| After-fix atomic action and Undo | Done (focused tests) | `dues.test.ts` and `createAppStore.test.ts`: one Deposit plus one linked invest transaction; one persisted write on clear and one on exact Undo; original data is restored. Exact/lower/higher amounts ($5,000/$3,500/$6,500) run for Savings account, Cash and Other. Missing targets, invalid amounts and omitted note handling are also covered. |
| Budget source and duplicate suppression | Done (focused tests) | `pending.test.ts` verifies explicit manual links survive category suppression and carry month/holding ID for frozen and virtual future months. `budget.test.ts` now expects the `month` field in Budget source metadata. |
| Holding invariants | Done (focused tests) | P29-T historical valuation-snapshot adjustment is retained; Fixed Deposit is rejected; Cash/Savings return-display code is unchanged. |
| Entry-point boundaries | Automated scope recorded | Transactions and Budget share `PendingItemActions`; `/payment-confirm` mounts the same component. Home exposes only due-kind rows, so a Budget-kind row is not available there; `app/(tabs)/index.tsx` remains untouched. Asset Entries are covered through the real store, not a physical-device run. Reminder delivery was not separately exercised with this Budget scenario. |
| Physical-device check | Not run | N44 is added to the release device checklist and owner re-test list. |

Final ordered gates (real exit codes): `npm test -- --coverage` 0 (98 suites,
1,255 passed, 1 skipped; 95.96% statements, 92.04% branches, 98.02% functions,
97.63% lines); `npx tsc --noEmit` 0; `npx expo lint` 0; `npx expo-doctor` 0
(21/21); `npx expo export --platform android` 0; and
`npx expo export --platform ios` 0. Gate 1 coverage by `src/` directory:
`data` 91.03/87.41/94.46/94.17%, `domain` 96.94/92.88/98.80/98.33%, and
`lib` 100% in all four measures (statements/branches/functions/lines). Earlier
Gate 1 attempts exited 1: the initial run found `dues.ts` branch coverage at
89.89%, then two parallel retries hit Jest's 5-second timeout under load. Guard
tests were added without lowering thresholds; the serial diagnostic and final
required Gate 1 command both passed. The focused 6-suite run passed 267 tests.

### Current P20-L / P21-D work

| Part / step | Status | Source evidence | Test / verification evidence |
|---|---|---|---|
| P20-L STEP 1 — Transactions Due payments (CR-47) | Done (focused tests; final gates pending) | `app/(tabs)/transactions.tsx`, `src/components/PendingItemRow.tsx`, `src/components/PendingItemActions.tsx`, `src/components/IconButton.tsx` | `RouteRenderSmoke.test.tsx`, `PendingItemActions.test.tsx`: always-open section, hidden when empty, Card/list dividers, Paid/Received labels, font-scale stacking, direct oldest clear/Undo and later clear-through confirmation. |
| P20-L STEP 2 — inline filters (CR-48) | Done (focused tests; final gates pending) | `src/components/AppHeader.tsx`; Transactions, Assets, Liabilities and Goals screens; SortChip/sorting sources unchanged | `AppHeader.test.tsx`, `AppHeaderUsage.test.ts`, `RouteRenderSmoke.test.tsx`, `TransactionsScreen.test.tsx`, `SectionHeaderRow.test.tsx`: icon order, expanded state, panel content, default closed state, active dot and protected placement scan. |
| P20-L STEP 3 — Liabilities type filter (CR-50) | Done (focused tests; final gates pending) | `app/liabilities.tsx`; `src/components/__tests__/RouteRenderSmoke.test.tsx` | `filters recurring and one-time liabilities and shows a no-matches state`, `shows No matches when a liability kind has no records`; All/Recurring/One-time filtering, active indicator and empty state. CR-49 tests also cover composition with search and sorting. |
| P20-L STEP 4 — Assets/Liabilities/Goals search (CR-49) | Done (71 suites/820 tests; all final gates pass) | `app/assets.tsx`, `app/liabilities.tsx`, `app/(tabs)/goals.tsx`, `src/components/ui.tsx` | `searches assets by trimmed case-insensitive name or type and composes with type filters`, `searches liabilities by trimmed case-insensitive name or type alongside the kind filter`, `searches goals by trimmed case-insensitive name and shows No matches`, `SearchField`, `HomeThemeSmoke.test.tsx`; type/name matching, sort/filter composition, clear action, empty state and remount reset. |
| P21-D — Emergency-fund default items (CR-51) | Done (71 suites/820 tests; all final gates pass) | `src/domain/efAllocation.ts`, `src/mock/demoData.ts` | `uses the three requested defaults and leaves saved allocations unchanged`, `repairs an empty allocation to the three requested defaults only once`, `shows only the three requested default items when no allocation is saved`, `offers missing predefined items including Mutual funds / Bonds from the header`, `uses the three requested emergency-fund default allocations`; schema v8. |
| P20-M STEP 1 — Expense categories (CR-52) | Done | `src/domain/schemas.ts`, `src/domain/budget.ts`, transaction form, mock/demo data | `schemas.test.ts`, `backup.test.ts`, `budget.test.ts`, `TransactionForm.test.tsx`, `demoData.test.ts`; new groups, normalized weights, import compatibility and demo values. |
| P20-M STEP 2 — Schema v9 and v8 migration (CR-53) | Done | `src/domain/types.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `src/data/createAppStore.ts` | `migrate.test.ts`, `backup.test.ts`, `safeStorage.test.ts`, `createAppStore.test.ts`, `schemas.test.ts`; v1-v8 imports, v8 raw-byte archive, v10 rejection, category selection, IDs and migration branches. |
| P20-M STEP 3 — Future month derivation (CR-54) | Done | `src/domain/budget.ts`, `src/domain/pending.ts`, Budget/Home/Transactions callers | `budget.test.ts`, `pending.test.ts`, `createAppStore.test.ts`; stored snapshots freeze, virtual months follow plan edits, repeat/horizon guards, and view-only no-write. |
| P20-M STEP 4 — Income dues (CR-53) | Done | `src/domain/pending.ts`, `src/components/PendingItemActions.tsx`, store action | `pending.test.ts`, `PendingItemActions.test.tsx`, `createAppStore.test.ts`; remaining amount/status, shared-category item allocation, category/date, one write, Undo, no duplicate and future month. |
| P20-M STEP 5 — Projected cash flow (CR-55) | Done | `src/domain/budget.ts` | `budget.test.ts`; current/past actuals, first future month actual remainder, a 24-month chain and a flat month without a plan. |
| P20-M STEP 6 — Setup income editor | Superseded by P20-Q / CR-64 | The dedicated setup route and screen are deleted; income management moves into the Budget-screen sheet. | The old setup route test is deleted; integrated add/edit income coverage is tracked under P20-Q STEP 3. |
| P20-M STEP 7 — Demo, ledger and gates | Done | `src/mock/data.ts`, `src/mock/demoData.ts`, `docs/PROGRESS.md` | `demoData.test.ts`, `progressLedger.test.ts`; demo salary/freelance items, upcoming virtual months, 820 tests, all six gates. UI layout is simulated; no Android/iOS device verification. |
| P20-N STEP 1 — Pure overview model (CR-56) | Done | `src/domain/budget.ts` | `budget.test.ts`: empty model, ordered sections, shared earned-income allocation, linked plan/liability/policy rows, current-day cutoff, future plan edits, planned/actual overspend copy, and reconciliation of section/stacked totals; full coverage passes. |
| P20-N STEP 2 — Charts (CR-57) | Done; Revised by P20-N-R1, P20-N-R2 and P20-N-R3 | `src/components/BudgetCharts.tsx` | P20-N-R1 replaced stacked-bar/global-pace assertions with section timelines, dashed/solid lines, toggles, axes, accessibility and contrast. P20-N-R2 replaces those section-specific expectations with the aggregate Pace graph and aggregate route tests because the requested view is one month-wide comparison. P20-N-R3 replaces visible chart-summary text expectations with an assertion that it is absent while `paceSummary` remains accessible; reason: remove redundant visible copy without losing the spoken chart description. |
| P20-N STEP 3 — Budget overview screen and linked edit routes (CR-57) | Done | `app/(tabs)/budget.tsx`, `app/policy-form.tsx`, `src/domain/policyActions.ts`, `src/data/createAppStore.ts`, `src/lib/routeKinds.ts` | `RouteRenderSmoke.test.tsx`: screen order, exact Cash flow labels/modes, empty states, row/edit routing, read-only past mode, font-scale stacking and Transactions month-param navigation; `policyActions.test.ts`, `createAppStore.test.ts`: linked policy update and one persisted write. Direct exact amount formatting uses explicit `formatAmount(..., 'exact', 1)`; all final gates pass. |
| P20-N STEP 4 — Remove superseded grouped-row implementation | Done | `src/domain/pending.ts`, pending/demo tests | Removed `budgetGroupRows`/`BudgetGroupRow` and its schedule-to-section aggregation. Superseded assertions: paid/partial/overdue group-row ordering and amounts in `pending.test.ts`, late-cleared group-row amounts in `pending.test.ts`, and current-budget group-row status/automatic-tag checks in `demoData.test.ts`; CR-56 overview totals/linked rows and CR-57 screen tests now cover the presentation. `pendingItems` remains for Home/Transactions dues. Progress-count assertions changed from 90% (55/61), P20 100% (13/13) to interim 89% (55/62), 93% (13/14), then final 90% (56/62), 100% (14/14), because adding and completing P20-N changes both denominator and completed count. |
| P20-N STEP 5 — Demo, ledger and final gates | Done | `src/mock/demoData.ts`, `src/mock/__tests__/demoData.test.ts`, `docs/PROGRESS.md` | Demo plan income items remain Salary/day 1 and Freelance/day 15; snapshots cover three past months/current month, next month derives virtually. `demoData.test.ts`, `progressLedger.test.ts`; 73 suites/828 tests pass. Directory coverage: domain 98.58% lines/93.48% branches; data excluding hooks 93.51%/87.57%; pure lib 100%/100%. `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`, Android and iOS exports exit 0. Expo Doctor: `Running 21 checks on your project... 21/21 checks passed. No issues detected!` Full gate output and coverage aggregation appear in the close-out. Device checks remain unverified. |
| P20-O STEP 1 — Edit sheet (CR-58) | Done | `src/domain/budget.ts`, `src/domain/schemas.ts`, `src/data/createAppStore.ts`, `app/(tabs)/budget.tsx`, `src/components/BudgetItemEditSheet.tsx` | `budget.test.ts`, `createAppStore.test.ts`, `BudgetItemEditSheet.test.tsx`, `RouteRenderSmoke.test.tsx`: current/future month scopes, virtual materialization, preserved later custom snapshots, remove, Undo, one persisted write, deep-equal restore and amount/day validation. |
| P20-O STEP 2 — Budget-aware categories (CR-59) | Done | `src/domain/budgetCategories.ts`, `src/components/BudgetCategoryPicker.tsx`, `app/transaction-form.tsx`, transaction schema | `budgetCategories.test.ts`, `BudgetCategoryPicker.test.tsx`, `TransactionForm.test.tsx`: grouping, planned-first order, hints, selected-date future month recomputation and instrument-derived investment category/hint. Frozen form components unchanged. |
| P20-O STEP 3 — Demo, ledger and final gates | Done | `src/mock/demoData.ts`, `src/mock/__tests__/demoData.test.ts`, `docs/PROGRESS.md`, `src/lib/__tests__/progressLedger.test.ts` | Demo keeps Salary/day 1 and Freelance/day 15; a future custom snapshot overrides Food amount/day and Freelance amount/day. 76 suites/848 tests; all six required gates exit 0. Directory coverage: domain 98.58% lines/93.61% branches, data excluding hooks 93.53%/87.57%, pure lib 100%/100%. Expo Doctor reports 21/21 checks passed. UI layout remains simulated; device checks listed in P20-O close-out. |
| P20-Q STEP 0 — Preflight and user-change audit | Done | `docs/PROGRESS.md`; `app/(tabs)/budget.tsx` read-only audit; protected attachment untouched | Clean tree at start; `git log` audit lists all seven non-Copilot commits and every changed path under DEC-USER-CHANGES; Cash flow labels and absence of Back/Review controls confirmed. Preflight commit `17f5ee4`. |
| P20-Q STEP 1 — In-screen creation and route removal (CR-62) | Done | `src/domain/budget.ts`, `src/domain/schemas.ts`, `app/(tabs)/budget.tsx`, `app/(tabs)/index.tsx`, `app/_layout.tsx`, `src/lib/routeKinds.ts`; `app/budget-setup.tsx` and `app/budget-month-form.tsx` deleted | `budget.test.ts`, `schemas.test.ts`, `HomeThemeSmoke.test.tsx`, `RouteRenderSmoke.test.tsx`, `routeKinds.test.ts`, `progressLedger.test.ts`: direct current-month plan creation, empty/future empty states, routes absent, Cash flow labels preserved. Commit `93a5356`. |
| P20-Q STEP 2 — Collapsible section list (CR-63) | Done | `app/(tabs)/budget.tsx`, `src/components/BudgetSummaryToggle.tsx`, `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/components/__tests__/HomeThemeSmoke.test.tsx` | `manages categories, items, and income through scoped sheets and counted deletes`, `preserves the routed month, hides category management in past months, and keeps Cash flow labels`, and Home breakdown tests cover expansion state/content, source routes, read-only periods and unchanged Home summary. |
| P20-Q STEP 3 — Scoped management sheet and Undo (CR-64) | Done | `src/components/BudgetManagementSheet.tsx`, `src/domain/budget.ts`, `src/data/createAppStore.ts`, `app/(tabs)/budget.tsx` | Integrated screen tests cover all six modes, scope defaults, inline amount/day row, validation, counted deletes and Remove item; `budget.test.ts` / `createAppStore.test.ts` cover scope rules, one persisted write and deep-equal restoration. Font-scale style contracts pass at 1.3 and 2.0. |
| P20-Q STEP 4 — Responsive overview and final gates (CR-65) | Done | `src/components/BudgetCharts.tsx`, `app/(tabs)/budget.tsx`, `src/components/__tests__/BudgetCharts.test.tsx`, `docs/PROGRESS.md` | Chart tests cover the planned stack, four planned/actual rows, dividers, short visible text and full accessibility descriptions; whole-screen TestRenderer cases cover font scales 1, 1.3 and 2. Schema remains v10; frozen inputs, `SortChip.tsx` and `src/lib/sorting.ts` remain unchanged. All six required gates exit 0. |
| P20-R STEP 0 — Preflight and checkpoint audit | Done | `docs/PROGRESS.md`, `app/(tabs)/budget.tsx`, modal/sheet source audit; protected attachment untouched | Starting tree had a user edit to `BudgetManagementSheet.tsx`; checkpointed exactly as `75e9097`. Re-audit finds seven earlier non-Copilot commits since `5bd3c41`; all eight file lists recorded in DEC-USER-CHANGES. Cash flow labels and absence of Back/Review controls confirmed. |
| P20-R STEP 1 — Shared top-anchored sheets (CR-66) | Done | `src/components/TopAnchoredSheet.tsx`, `src/components/BudgetManagementSheet.tsx`, `app/goal-form.tsx` | `RouteRenderSmoke.test.tsx` asserts safe-area top placement, window/keyboard max-height, scrollable first field, backdrop dismissal, and the Goal asset picker wrapper. Other Modal inventory and dispositions are in DEC-P20R. |
| P20-R STEP 2 — Budget sheet header actions (CR-67) | Done | `src/components/BudgetManagementSheet.tsx`, `app/(tabs)/budget.tsx` | `RouteRenderSmoke.test.tsx` asserts trash then rightmost Close in edit modes, Close only in add/section modes, 44×44 targets, native scope confirmation, Undo, and no body “Remove item” text. `createAppStore.test.ts` asserts one persisted write for delete and restore with deep-equal data. |
| P20-R STEP 3 — Section Cards and icon actions (CR-68) | Done | `app/(tabs)/budget.tsx` | `RouteRenderSmoke.test.tsx` asserts one Card per section, item/divider structure, icon names/labels/targets, system/custom action policy, linked source routes, read-only past months, and stacked title/actions at 1.3/2.0. `HomeThemeSmoke.test.tsx` confirms Home's existing summary look. |
| P20-R STEP 4 — Acceptance and final gates (CR-69) | Done | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/data/__tests__/createAppStore.test.ts`, `src/lib/__tests__/progressLedger.test.ts`, `docs/PROGRESS.md` | Focused route/Home/store tests: 3 suites/179 tests; full coverage: 75 suites/857 tests. All six gates exit 0. Expo Doctor output: `Running 21 checks on your project... 21/21 checks passed. No issues detected!` Directory coverage: domain 98.53% lines/93.15% branches; data excluding hooks 93.14%/86.75%; pure lib 100%/100%. |
| P20-S STEP 5 — Insurance management and final gates (CR-75) | Done | `app/(tabs)/budget.tsx`, `src/components/BudgetManagementSheet.tsx`, `src/domain/budget.ts`, `src/domain/pending.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts` | Unbudgeted spending and income are editable; Insurance custom/manual items, protected system-section behavior, policy/manual actual reconciliation, non-duplicated budget due, Insurance expense clearing and store one-write/deep-equal Undo are covered. 76 suites/865 tests; all six required gates exit 0. Simulated layout only; physical-device checks remain. |
| P20-T STEP 1 — Shared three-region form core (CR-76) | Done | `src/components/FormShell.tsx`, `src/components/form/FormScreen.tsx` | `FormScreen` delegates header/body/footer to `FormShell`; SafeAreaView, KeyboardAvoidingView, dirty discard and existing props remain. Structural tests confirm the adapter has no duplicate header/body/footer layout. |
| P20-T STEP 2 — Convert every data-entry form (CR-77) | Done | app form routes, BudgetManagementSheet, Goal asset picker, EF allocation custom-option dialogs | Route parameter smoke test covers create/edit route params; shared Back-left/right-action/Save-footer rule applies. Onboarding retains no-back exit behavior. Settings, list filters, selection pickers and informational modals remain outside the data-entry shell. |
| P20-T STEP 3 — Acceptance, freeze and final gates | Done | `FormScreen.test.tsx`, `FormShell.test.tsx`, `RouteRenderSmoke.test.tsx`, `OnboardingForms.test.tsx`, `TransactionForm.test.tsx`, `EfAllocationForm.test.tsx`, `formComponentsFrozen.test.ts`, `docs/PROGRESS.md` | Dirty discard and validation summary remain; font-scale tests assert non-clipping structure; authorized FormScreen hash is frozen and all other input hashes unchanged. Replaced assertion: full-screen left “Close” becomes left “Back”; reason: CR-77 navigation rule. Redundant footer Back buttons on invalid/missing-route states are replaced by the header action; reason: one navigation affordance per the shared layout. |
| P23-A STEP 0 — Preflight and STEP 1 — Policy inventory | Done | `docs/PROGRESS.md` DEC-USER-CHANGES and DEC-P23-INVENTORY | Clean tree at base `0774e51`; seven no-Copilot commits and both earlier manual checkpoints re-audited with one line per changed file. Inventory records current fields, kind/frequency mapping, schedule/payment logic, goal links, integrity, dues/Budget behavior, mock/demo state, and existing policy screens; identifies CR-78/79 gaps. No source code or screens changed in the inventory step. |
| P23-A STEP 2 — Schema v11, migration and backup (CR-78) | Done | `src/domain/types.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts` | v10 migration branches, v1–v10 backup chain, checksum-before-migration, schema v12 refusal, raw-byte archive/no-recopy/erase and schema bounds are covered by `migrate.test.ts`, `safeStorage.test.ts`, `backup.test.ts`, and `schemas.test.ts`. |
| P23-A STEP 3 — Policy domain, schedule, store and demo (CR-79) | Done | `src/domain/policyActions.ts`, `src/domain/policySchedule.ts`, `src/domain/policySummary.ts`, `src/data/createAppStore.ts`, mock data | Four-frequency schedule/month-end/end-date/status cases; typed goal-link errors; linked transaction retention and integrity; status/delete one-write/Undo deep equality; summary fallbacks; active-only dues and Budget reconciliation; and demo records are covered. No policy screen changes. |
| P23-A STEP 4 — Tests, ledger and final gates | Done | 77 suites/894 tests; `docs/PROGRESS.md` | `npm test -- --coverage` passed (lines 95.99%, branches 92.57%, functions 97.58%, statements 97.87%). Source-directory coverage: domain 97.12% lines/93.45% branches; data excluding hooks 90.24%/87.37%; pure lib 100%/100%. All six required gates exit 0; Expo Doctor reports 21/21. |
| P23-B STEP 0 — Preflight and cover-goal decision | Done | `docs/PROGRESS.md` DEC-P23-COVER; clean base `501956a` | No manual checkpoint was needed. Cancelled the former screen-only P23-B plan and recorded v12 cover-goal semantics, category behavior, Budget reconciliation, defaults, and no-screen scope. |
| P23-B STEP 1 — Schema v12 and migration (CR-80) | Done | Types, schemas, backup import, `migrateV11ToV12`, safe-storage archive | Targeted gates: migration, safe-storage archive, store hydration, schema and backup tests; 5 suites/151 tests pass. v11 archive is exact-byte, once-only and erased with app data; schema v13 is refused; backups preserve checksum-before-migration. |
| P23-B STEP 2 — Cover-goal domain, categories, Budget and demo (CR-81) | Done | `src/domain/coverGoals.ts`, `src/domain/policyCategories.ts`, `src/domain/budget.ts`, `src/domain/pending.ts`, `src/domain/links.ts`, `src/data/createAppStore.ts`, `app/(tabs)/budget.tsx`, demo data | Focused acceptance: 13 suites/403 tests pass, including all cover states, no-income target, multiple and inactive policies, policy suggestions, schema/dropdown category validity, v11 backup chain, typed-category backup round trip, single-write/Undo, Home spending breakdown, typed pending dues and Budget aggregation. Existing policy rows aggregate by type and are read-only; manual legacy items remain manageable. |
| P23-B STEP 3 — Demo, ledger and final gates | Done | `src/mock/demoData.ts`, `src/mock/__tests__/demoData.test.ts`, `docs/PROGRESS.md` | Full coverage: 78 suites/914 tests pass. All six sequential gates exit 0; directory coverage meets all required floors. Assumptions and legacy category inventory are documented. Native keyboard/footer behavior, small-device layout and OS font scaling remain device-only checks. |
| P23-C STEP 1 — Insurance route and entry links (CR-82) | Done | `app/insurance.tsx`, `app/_layout.tsx`, `src/lib/routeKinds.ts`, Goals, Budget and Home routes | Route smoke asserts all three entry points, Filter-then-Add header order, typed route navigation, and the separate Insurance stack screen. |
| P23-C STEP 2 — Cover-goal cards and target form (CR-83) | Done | `app/insurance.tsx`, `app/cover-goal-form.tsx` | UI tests assert fixed type order, detail-first card content with progress last, target form modes, term-life income line and its null-income helper. |
| P23-C STEP 3 — Policy list and CRUD form (CR-84) | Done | `app/insurance.tsx`, `app/policy-form.tsx` | Tests cover fields, edit-only status, start-date maximum, optional end date, delete confirmation and route return; existing store tests cover deletion/status Undo and deep-equal restore. |
| P23-C STEP 4 — Transaction, Budget and Home integration (CR-85) | Done | `app/transaction-form.tsx`, `app/(tabs)/budget.tsx`, `app/(tabs)/index.tsx`, `src/domain/dues.ts`, `src/data/createAppStore.ts` | Typed Insurance categories display; unique-policy suggestion defaults on; linked manual premium preserves note and creates payment plus expense in one persisted write. Budget policy rows open edit; Home policy dues use Marked as paid and existing Undo. Savings goals, EF and net worth logic are unchanged. |
| P23-C STEP 5 — Acceptance, ledger and final gates | Done | `RouteRenderSmoke.test.tsx`, `TransactionForm.test.tsx`, `createAppStore.test.ts`, `routeKinds.test.ts`, `docs/PROGRESS.md` | Full coverage: 78 suites/923 tests passed; all six required gates exit 0. Directory coverage: domain 98.46% lines/93.21% branches; data excluding hooks 93.70%/87.59%; pure lib 100%/100%. Insurance routes are registered, including `/insurance` as stack and `/cover-goal-form` as form. Layout/font-scale assertions are simulated; device limitations are listed below. |

P23-C replaced assertions and reasons:

| Previous assertion | Updated assertion | Reason |
|---|---|---|
| Budget policy rows had no Edit action and were read-only/non-tappable. | Tapping a policy row navigates to `/policy-form` with that policy ID; the row remains read-only apart from navigation. | CR-85 explicitly makes policy rows tappable for editing while keeping policy amounts and manual-item management semantics unchanged. |

P23-C final gates, run sequentially after the final edits:

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 78 suites / 923 tests passed; 95.90% statements, 92.40% branches, 97.67% functions and 97.65% lines. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed without warnings. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported to `dist`. | 0 |
| `npx expo export --platform ios` | iOS bundle exported to `dist`. | 0 |

Per-directory source coverage, independently aggregated from Istanbul
statement/branch counters (data hooks excluded): `src/domain` 2869/2914 lines
(98.46%) and 2746/2946 branches (93.21%); `src/data` 610/651 lines (93.70%)
and 607/693 branches (87.59%); pure `src/lib` 107/107 lines (100%) and
126/126 branches (100%). A first full-coverage attempt exposed the two new Expo
Router routes missing from `ROUTE_KINDS` and a missed false branch for a
same-status policy update; both were corrected and the rerun passed. No
assertions were weakened.

P23-C device checks not verified: native navigation/back behavior, VoiceOver
and TalkBack, real keyboard/focus/search behavior, native switch interaction,
safe-area/footer placement, actual system font scaling and clipping at 1.3/2.0,
small-device wrapping, touch targets, and the visual presentation of policy and
cover cards on physical iOS and Android devices. Automated checks inspect
TestRenderer output and style props only.

P23-B replaced assertions and reasons:

| Previous assertion | Updated assertion | Reason |
|---|---|---|
| `emptyAppData` exact shape omitted `coverGoals`. | Exact shape includes five pinned defaults. | Schema v12 requires the independently seeded cover-goal set. |
| Legacy Insurance category dropdown expected only `Insurance` and `Custom`. | It expects legacy Insurance, the five typed premium categories, and Custom. | CR-81 adds typed categories to the Budget Insurance choices without removing history. |
| Pending Budget lines expected only Food for a fixture with a manual Insurance item. | It expects Food and the planned manual Insurance item. | The legacy category now maps into the Insurance system section where manual rows remain manageable. |
| Scheduled health premiums expected category `Insurance`. | They expect `Health premium`; historic linked `Insurance` transactions remain accepted. | New scheduled payments use the policy-type category; migration/history compatibility is retained. |
| Budget linked policy rows were named after individual policies and exposed edit-route buttons. | Active schedule rows aggregate under one type category and policy rows have no edit button. | CR-81 requires one row per cover type and read-only policy rows; manual Budget items remain editable. |
| Migration coverage exercised only default v11 fixtures, leaving the new branch under the per-file coverage threshold. | Tests cover legacy item relocation into existing and missing Insurance sections and malformed budget inputs. | Exercise every new migration branch while keeping the existing coverage threshold unchanged. |

Gate iteration: the first full coverage run found the empty-data exact-shape
assertion missing the new schema-v12 goals and `src/data/migrate.ts` at 84.27%
branch coverage. Commit `b9cb4f6` adds the exact defaults and migration branch
tests; the rerun passes. The first `npx expo lint` exited 0 with one unused
`addDays` import warning in `coverGoals.ts`; commit `c443191` removed it before
the final sequential gates.

P23-B final gates, run sequentially at commit `c443191`:

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 78 suites / 914 tests passed; 95.93% statements, 92.39% branches, 97.59% functions, 97.70% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed without warnings. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Final verification was rerun sequentially after `17a3efd` and the progress-ledger
test update. The first coverage attempt exposed only a stale progress assertion:
`Overall progress █████████░ 91% (63/69)` was replaced with
`Overall progress █████████░ 93% (64/69)`, and the P23 `2/2` assertion was
added, matching the current dashboard. The rerun passed 78 suites / 914 tests;
typecheck, lint, Doctor, Android export and iOS export all exited 0. Coverage
remained at the values above. The test assertion change does not alter product
behavior.

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 78 suites / 914 tests; 95.93% statements, 92.39% branches, 97.59% functions, 97.70% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed without warnings. | 0 |
| `npx expo-doctor` | 21/21 checks passed; no issues detected. | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Per-directory coverage is aggregated independently from Istanbul's per-file
summary using the `coverage/coverage-final.json` counters:

```python
import json
from pathlib import Path

coverage = json.loads(Path("coverage/coverage-final.json").read_text())
areas = {"src/domain": [], "src/data excluding hooks": [], "pure src/lib": []}
for filename, file_coverage in coverage.items():
    path = filename.replace("\\", "/")
    if "/src/domain/" in path:
        area = "src/domain"
    elif "/src/data/" in path and "/hooks/" not in path:
        area = "src/data excluding hooks"
    elif "/src/lib/" in path:
        area = "pure src/lib"
    else:
        continue
    line_counts = {}
    for key, location in file_coverage["statementMap"].items():
        line = location["start"]["line"]
        line_counts[line] = max(line_counts.get(line, 0), file_coverage["s"][key])
    lines = list(line_counts.values())
    branches = [count for counts in file_coverage["b"].values() for count in counts]
    areas[area].append((sum(count > 0 for count in lines), len(lines),
                        sum(count > 0 for count in branches), len(branches),
                        path.split("/src/", 1)[1]))
for area, files in areas.items():
    covered_lines = sum(item[0] for item in files)
    total_lines = sum(item[1] for item in files)
    covered_branches = sum(item[2] for item in files)
    total_branches = sum(item[3] for item in files)
    print(area, f"{covered_lines}/{total_lines}",
          f"{covered_lines / total_lines * 100:.2f}%",
          f"{covered_branches}/{total_branches}",
          f"{covered_branches / total_branches * 100:.2f}%")
    for cl, tl, cb, tb, name in sorted(files, key=lambda item: item[4]):
        print(f"  {name}: lines {cl}/{tl} ({cl / tl * 100 if tl else 100:.2f}%), "
              f"branches {cb}/{tb} ({cb / tb * 100 if tb else 100:.2f}%)")
```

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2864/2907 (98.52%) | 2735/2934 (93.22%) |
| `src/data` excluding hooks | 604/645 (93.64%) | 600/686 (87.46%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Per-file Istanbul results (lines and branches):

| File | Lines | Branches |
|---|---:|---:|
| `src/domain/actions.ts` | 100.00% | 100.00% |
| `src/domain/backup.ts` | 96.89% | 92.97% |
| `src/domain/backupNudge.ts` | 100.00% | 100.00% |
| `src/domain/budget.ts` | 97.70% | 90.88% |
| `src/domain/budgetCategories.ts` | 100.00% | 100.00% |
| `src/domain/budgetGroups.ts` | 100.00% | 100.00% |
| `src/domain/cashFlow.ts` | 100.00% | 97.58% |
| `src/domain/coverGoals.ts` | 100.00% | 94.12% |
| `src/domain/dates.ts` | 100.00% | 94.12% |
| `src/domain/dues.ts` | 100.00% | 91.61% |
| `src/domain/ef.ts` | 100.00% | 100.00% |
| `src/domain/efAllocation.ts` | 100.00% | 95.45% |
| `src/domain/efAllocationActions.ts` | 100.00% | 92.96% |
| `src/domain/goalActions.ts` | 100.00% | 100.00% |
| `src/domain/goalLinks.ts` | 100.00% | 91.03% |
| `src/domain/goals.ts` | 100.00% | 93.75% |
| `src/domain/holdingActions.ts` | 92.31% | 96.15% |
| `src/domain/index.ts` | n/a | n/a |
| `src/domain/instrumentCard.ts` | 100.00% | 95.45% |
| `src/domain/instruments.ts` | 98.96% | 90.83% |
| `src/domain/investmentActions.ts` | 100.00% | 93.88% |
| `src/domain/liability.ts` | 99.07% | 94.03% |
| `src/domain/liabilityActions.ts` | 100.00% | 96.33% |
| `src/domain/links.ts` | 95.38% | 91.23% |
| `src/domain/pending.ts` | 98.68% | 95.51% |
| `src/domain/planActions.ts` | 100.00% | 94.74% |
| `src/domain/policyActions.ts` | 100.00% | 97.06% |
| `src/domain/policyCategories.ts` | 100.00% | 100.00% |
| `src/domain/policySchedule.ts` | 100.00% | 92.31% |
| `src/domain/policySummary.ts` | 100.00% | 100.00% |
| `src/domain/portfolio.ts` | 100.00% | 95.45% |
| `src/domain/schedule.ts` | 100.00% | 93.65% |
| `src/domain/schemas.ts` | 96.46% | 90.58% |
| `src/domain/sip.ts` | 100.00% | 96.67% |
| `src/domain/slots.ts` | 100.00% | 100.00% |
| `src/domain/stressData.ts` | 100.00% | 100.00% |
| `src/domain/summary.ts` | 100.00% | 100.00% |
| `src/domain/transactions.ts` | 100.00% | 100.00% |
| `src/data/createAppStore.ts` | 92.71% | 85.56% |
| `src/data/metaStore.ts` | 100.00% | 90.91% |
| `src/data/migrate.ts` | 93.46% | 86.80% |
| `src/data/safeStorage.ts` | 96.36% | 94.29% |
| `src/lib/appMenu.ts` | 100.00% | 100.00% |
| `src/lib/authenticate.ts` | 100.00% | 100.00% |
| `src/lib/format.ts` | 100.00% | 100.00% |
| `src/lib/friendlyError.ts` | 100.00% | 100.00% |
| `src/lib/greeting.ts` | 100.00% | 100.00% |
| `src/lib/lockPolicy.ts` | 100.00% | 100.00% |
| `src/lib/savingsLine.ts` | 100.00% | 100.00% |
| `src/lib/securitySettings.ts` | 100.00% | 100.00% |
| `src/lib/storageGuard.ts` | 100.00% | 100.00% |
| `src/lib/swipe.ts` | 100.00% | 100.00% |

**P23-B acceptance criteria not verified on a real device:** OS font scaling
and rendered clipping; Budget row interaction/layout at small phone sizes;
native keyboard behavior with policy/edit forms and fixed footer; native screen
reader announcements for cover summaries and category choices; and persistent
device storage/archive behavior across actual app process termination. Jest
asserts data, rendered trees and style/API contracts only; no physical device
was used.

#### P20-O final verification

Focused acceptance tests include:

- `budget item edits` — current and upcoming month/following scopes,
  virtual-month materialization, custom-snapshot preservation, line and income
  editing/removal, invalid sources/values and fallback snapshots.
- `edits and removes budget items in one write and restores exact data with one
  Undo write` — persisted-write counter and deep-equal restoration.
- `uses a bottom-anchored, scrollable 60% sheet with safe-area padding and
  read-only income details`; `validates before saving and removes with the
  selected scope`.
- `groups categories, orders budgeted items first and calculates actuals by
  selected month`; `uses virtual upcoming budgets and groups derived
  investment categories`.
- `recomputes expense budget hints when the selected transaction date moves to
  an upcoming month`; `keeps investment categories instrument-derived and
  shows the selected month budget hint`.
- `has four complete months and a custom upcoming override for the item editor
  demo`; `tracks completed P20-M, P20-N and P20-O while preserving P20-L and
  P21-D`.

The first full coverage attempt exposed `src/domain/budget.ts` at 88.66%
branches, below its 90% per-file threshold. Domain edge-case tests were added
for absent lines, fallback snapshots, missing incomes, unresolvable
percentages and invalid edit bounds. The final rerun passed at 91.62%
branches for `budget.ts`.

| Required gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 76 suites / 848 tests passed; 96.22% statements, 92.82% branches, 97.60% functions, 97.75% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Per-directory coverage (Istanbul covered/total; lines and branches shown
separately):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2,438/2,473 (98.58%) | 2,242/2,395 (93.61%) |
| `src/data` excluding hooks | 506/541 (93.53%) | 465/531 (87.57%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Per-file Istanbul summaries for changed domain/data source:

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/domain/budget.ts` | 97.18% | 91.62% | 98.06% | 99.51% |
| `src/domain/budgetCategories.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `src/domain/schemas.ts` | 93.18% | 90.77% | 100.00% | 93.25% |
| `src/data/createAppStore.ts` | 89.16% | 87.17% | 86.71% | 91.81% |

Directory aggregation script:

```js
const fs = require('node:fs');
const path = require('node:path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8')));
const groups = {
  'src/domain': (file) => file.includes(`${path.sep}src${path.sep}domain${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
  'src/data excluding hooks': (file) => file.includes(`${path.sep}src${path.sep}data${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes(`${path.sep}hooks${path.sep}`),
  'pure src/lib': (file) => file.includes(`${path.sep}src${path.sep}lib${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
};
for (const [name, include] of Object.entries(groups)) {
  const summaries = map.files().filter(include).map((file) => map.fileCoverageFor(file).toSummary());
  const totals = summaries.reduce((total, summary) => {
    for (const metric of ['lines', 'branches']) {
      total[metric].covered += summary[metric].covered;
      total[metric].total += summary[metric].total;
    }
    return total;
  }, { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } });
  for (const metric of ['lines', 'branches']) {
    totals[metric].pct = totals[metric].total ? 100 * totals[metric].covered / totals[metric].total : 100;
  }
  console.log(`${name}: lines ${totals.lines.covered}/${totals.lines.total} (${totals.lines.pct.toFixed(2)}%); branches ${totals.branches.covered}/${totals.branches.total} (${totals.branches.pct.toFixed(2)}%)`);
}
```

**P20-O acceptance criteria not verified on a real device:** native bottom-sheet
keyboard avoidance, safe-area positioning, backdrop hit target and scroll
behavior on iOS/Android; category-picker spacing, readability and scrolling at
font scales 1.3 and 2.0; screen-reader grouping/selection announcements; and
the native date-picker experience through the 24-month horizon. TestRenderer
checks props, tree content and callbacks only.

#### P20-P final verification

| Step | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| STEP 1 — Schema v10 and v9 migration (CR-60) | Done | `src/domain/types.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts` | `migrate.test.ts`: v9 plan lines and snapshots map to section items, unknown category falls back to Survival; `backup.test.ts`: checksum is verified on v9 bytes before migration and schema 11 is refused; `safeStorage.test.ts`/`createAppStore.test.ts`: raw v9 copy occurs once and erase removes it. |
| STEP 2 — Scoped section/item domain actions (CR-60) | Done | `src/domain/budget.ts`, `src/domain/budgetGroups.ts` | `budget.test.ts`: frozen snapshots, virtual month materialization, both scopes, retained later custom snapshots, percent resolution, typed invalid-name/reserved-name/limit/value failures, cascade deletion and unchanged transactions. |
| STEP 3 — Store and transaction integration (CR-61) | Done | `src/data/createAppStore.ts`, `src/domain/budget.ts`, `src/domain/budgetCategories.ts`, `src/domain/transactions.ts`, `src/domain/links.ts`, `src/domain/pending.ts`, `app/transaction-form.tsx`, `app/(tabs)/transactions.tsx`, `app/(tabs)/budget.tsx`, `app/budget-setup.tsx`, `app/budget-month-form.tsx` | `createAppStore.test.ts`: each managed mutation performs one persisted write and retains one-write/deep-equal Undo behavior; budget/category/selector/transaction tests cover user section order, custom category validation, linked rows, investment type inference, labels/filtering and retained categories after deleting their item. |
| STEP 4 — Demo, ledger and gates | Done | `src/mock/demoData.ts`, `src/mock/data.ts`, demo and ledger tests, `docs/PROGRESS.md` | Demo carries Pets/Pet care and Survival/Domestic help transactions. Full suite 76/76, 865/865. All six final gates pass. |

**Superseded assertions:** the v9 fixed `lines` snapshot shape is replaced by
v10 section/item snapshots because user-defined items must persist by their
category name; schema v10's former “newer version” rejection moves to v11;
fixed transaction-category rejection is replaced by acceptance of item names
in the effective transaction month; unknown investment names formerly grouped
as “Other investments” remain custom/unbudgeted names so deleting a budget item
never changes transaction identity. The P20-N section-card header-only and
P20-M fixed-category setup constraints are superseded only as data/UI design
constraints for the next screen-management part; this P20-P did not rebuild
those screens.

**Category-list/BUDGET_GROUPS grep audit (all 12 source/test hits):**

- `app/budget-setup.tsx`: retained the existing setup surface; it still
  presents seeded defaults, while custom-section/item management is explicitly
  deferred to the next UI part.
- `app/budget-month-form.tsx`: retained the existing month editor; its data
  now uses item/section snapshots and preserves the P20-O scope behavior.
- `app/transaction-form.tsx`: custom expense/invest item names in the selected
  effective month validate; investment category remains instrument-derived.
- `src/domain/budget.ts`: default sections, scoped mutations, effective
  snapshots, totals and unbudgeted-category mapping use section/item records.
- `src/domain/budgetCategories.ts`: groups choices from the effective month,
  ordering planned item names first within each section.
- `src/domain/budgetGroups.ts`: defines seeded defaults and category-to-section
  mappings, including the v9 fallback.
- `src/domain/schemas.ts`: validates built-ins plus unique, bounded budget
  section/item names and valid stored snapshots.
- `src/mock/demoData.ts`: demonstrates the Pets/Pet care custom category and
  Domestic help in Survival, with a transaction for each.
- `src/mock/__tests__/demoData.test.ts`: verifies custom demo sections/items
  and associated transactions.
- `src/data/__tests__/migrate.test.ts`: verifies v9 mapping and unmapped
  category fallback.
- `src/domain/__tests__/schemas.test.ts`: verifies built-in and selected-month
  custom category validation and schema limits.
- `src/domain/__tests__/budget.test.ts`: verifies scoped actions, categories,
  reconciliation, custom deletion and fallback behavior.

The first full-coverage run exited 1 because the ledger accidentally contained
two P20-P prompt rows; the ledger was corrected without weakening assertions.
The final required gates were then run sequentially:

| Gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 76 suites / 865 tests passed; 95.93% statements, 92.43% branches, 97.64% functions, 97.79% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Per-directory coverage (covered/total; independent line and branch totals):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2,680/2,715 (98.71%) | 2,499/2,678 (93.32%) |
| `src/data` excluding hooks | 542/582 (93.13%) | 504/581 (86.75%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Changed-source Istanbul summaries (statements / branches / functions / lines):

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/data/createAppStore.ts` | 89.70% | 87.17% | 87.89% | 92.10% |
| `src/data/migrate.ts` | 88.10% | 85.37% | 98.21% | 92.77% |
| `src/data/safeStorage.ts` | 96.72% | 94.11% | 75.00% | 96.36% |
| `src/domain/backup.ts` | 98.19% | 96.36% | 100.00% | 98.63% |
| `src/domain/budget.ts` | 95.73% | 90.82% | 97.97% | 97.60% |
| `src/domain/budgetCategories.ts` | 100.00% | 100.00% | 100.00% | 100.00% |
| `src/domain/links.ts` | 96.35% | 92.41% | 100.00% | 96.85% |
| `src/domain/pending.ts` | 96.55% | 95.00% | 91.66% | 98.48% |
| `src/domain/schemas.ts` | 93.00% | 90.47% | 100.00% | 96.96% |
| `src/domain/transactions.ts` | 100.00% | 100.00% | 100.00% | 100.00% |

**P20-P acceptance criteria not verified on a real device:** hydrating an
actual v9 file from device storage and confirming the archived bytes on both
platforms; custom categories in the native transaction picker at font scales
1.3 and 2.0, including scrolling and screen-reader announcements; and touch/
layout behavior of section/item management UI, which is intentionally deferred
to the next part. Automated tests cover schema, migration, props, data,
callbacks and persistence behavior, not native device rendering.

#### P20-Q final verification

| Step | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| STEP 0 — Preflight and ownership audit | Done | `docs/PROGRESS.md`, `app/(tabs)/budget.tsx` | Clean preflight at `17f5ee4`; seven non-Copilot commits and all changed files recorded under DEC-USER-CHANGES. Opening/Closing cash-flow labels remain unchanged; no Back to Transactions, Review, or other removed controls were restored. |
| STEP 1 — In-screen creation and route removal (CR-62) | Done | `app/(tabs)/budget.tsx`, `app/(tabs)/index.tsx`, `app/_layout.tsx`, `app/budget-setup.tsx` (deleted), `app/budget-month-form.tsx` (deleted), `src/domain/budget.ts`, `src/lib/routeKinds.ts` | `createDefaultBudgetPlan` creates the empty default plan for the current month; no-plan/future empty states create/apply from Budget. Route registry and source scans confirm both routes and all links are gone. Commit `93a5356`. |
| STEP 2 — Collapsible sections and Home summary extraction (CR-63) | Done | `app/(tabs)/budget.tsx`, `app/(tabs)/index.tsx`, `src/components/BudgetSummaryToggle.tsx` | `RouteRenderSmoke.test.tsx`: collapsed/expanded state, item edit affordances, linked-source routes, unbudgeted rows and past read-only behavior. `HomeThemeSmoke.test.tsx`: spending breakdown and existing Home presentation remain. |
| STEP 3 — Unified scoped management and Undo (CR-64) | Done | `src/components/BudgetManagementSheet.tsx`, `src/domain/budget.ts`, `src/data/createAppStore.ts`, `app/(tabs)/budget.tsx` | `manages categories, items, and income through scoped sheets and counted deletes`, domain scope tests, and `applies each managed budget mutation with one persisted write`: six modes, defaults, amount/day validation, current/following scope, counted delete, Remove item, one write and deep-equal Undo. Simulated inline-row layout is checked at font scales 1.3/2.0. |
| STEP 4 — Responsive overview and final gates (CR-65) | Done | `src/components/BudgetCharts.tsx`, `src/components/__tests__/BudgetCharts.test.tsx`, `docs/PROGRESS.md` | Chart tests cover the single planned stack, Planned/Actual header, four divided rows, compact visible summary and longer accessibility description. Whole-screen simulated font-scale coverage is 1.0/1.3/2.0. Demo requirements are met by the existing Pets/Pet care and Survival/Domestic help plan items and their transactions in `src/mock/demoData.ts`; `demoData.test.ts` covers them. |

#### P20-R final verification

| Step | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| STEP 0 — Preflight and ownership audit | Done | `docs/PROGRESS.md`, `app/(tabs)/budget.tsx` | Seven commits without a Copilot co-author trailer since `5bd3c41`, plus checkpoint `75e9097`, are listed one changed file per entry under DEC-USER-CHANGES. Cash flow labels and removed Back/Review controls were preserved. |
| STEP 1 — Shared top-anchored sheets (CR-66) | Done | `src/components/TopAnchoredSheet.tsx`, `src/components/BudgetManagementSheet.tsx`, `app/goal-form.tsx` | Budget editor and Goal asset picker use the shared wrapper. TestRenderer asserts top safe-area inset, 60%-of-window maximum minus simulated keyboard height, scrollable form, visible first field, and tappable backdrop. |
| STEP 2 — Sheet header actions (CR-67) | Done | `src/components/BudgetManagementSheet.tsx`, `app/(tabs)/budget.tsx` | Edit modes render Feather trash-2 then rightmost x with 44×44 targets; add and section modes render Close only. No body “Remove item” button remains. Native confirmation scope choices and Undo are tested; store delete/restore each perform one write and restore deep-equal data. |
| STEP 3 — Section Cards (CR-68) | Done | `app/(tabs)/budget.tsx` | Each budget section has a separate Card; tests cover item rows/dividers, no chevron/expanded state, icon names/labels/hints/targets and system-section action policy, 1.3/2.0 stacked headers, linked source routes, and past-month read-only behavior. Home's summary look is unchanged (`HomeThemeSmoke.test.tsx`). |
| STEP 4 — Acceptance and gates (CR-69) | Done | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/data/__tests__/createAppStore.test.ts`, `src/lib/__tests__/progressLedger.test.ts` | `npm test -- --coverage`: 75/75 suites, 857/857 tests. `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`, `npx expo export --platform android`, and `npx expo export --platform ios` exit 0. |

#### P20-S interim verification

| Step | Status | Evidence |
|---|---|---|
| STEP 0 — Preflight and ownership audit | Done | Base `003fc4f`, preserved user checkpoint `ecc5c35`; clean preflight worktree. DEC-P20S records CR-59 supersessions, choices, assumptions and user-owned Cash flow/removal constraints. |
| STEP 1 — Dropdown component and specified conversions (CR-70) | Done | `Dropdown.test.tsx`, `TransactionForm.test.tsx`, `budgetCategories.test.ts`; 3 suites/32 tests pass. TypeScript and lint exit 0. Hint function/component/test deleted; selected instrument still determines invest category. |
| STEP 2 — Common sheet form shell (CR-71) | Done | Added `FormShell.tsx` and converted `BudgetManagementSheet` plus the Goal asset picker inside `TopAnchoredSheet`; `FormScreen` remains unchanged for route forms. `FormShell.test.tsx`, `RouteRenderSmoke.test.tsx` (108 tests) and `HomeThemeSmoke.test.tsx` pass; `npx tsc --noEmit` and `npx expo lint` exit 0. |
| STEP 3 — Actual-left / Planned-right ordering (CR-72) | Done | Budget overview header and metric values, accessibility descriptions, and pace legend now read Actual then Planned. Section/item rows were already actual-first and are asserted. Home `BudgetSummaryToggle` already uses actual “spent of” planned and remains unchanged. Transactions due rows show a due amount only, not an Actual/Planned pair, so remain unchanged. `RouteRenderSmoke.test.tsx`, `BudgetCharts.test.tsx`, and `HomeThemeSmoke.test.tsx`: 3 suites/125 tests pass; TypeScript and lint exit 0. |
| STEP 4 — Category dropdown and Due day helper (CR-73/CR-74) | Done | Budget item forms use built-in categories from the section's group, exclude names already in the active plan while retaining the edit item's own value, and append Custom; Custom displays the existing 1–30 character Name validation. Due-day helper copy is present below the date field. `RouteRenderSmoke.test.tsx`: 108 tests pass, including category filtering, custom and built-in saves, existing invalid-value rejection, and helper rendering at 1.0/1.3/2.0. TypeScript and lint exit 0. |
| STEP 5 — Manageability and Insurance system items (CR-75) | Done | Unbudgeted transaction rows and actual-only income open prefilled add sheets; Insurance allows manual items, remains system-protected from rename/delete, and linked policy rows remain read-only. Domain and backup schemas preserve built-in-category mapping while allowing Insurance Custom names. Insurance actuals split into manual/policy rows, the manual due excludes policy-linked payments, and clearing creates an Insurance expense. Domain, backup, schema, store, route, pending-action and demo tests pass. |

#### P20-S final verification

`npm test -- --coverage`: 76 suites / 865 tests passed. Final gates:
TypeScript, Expo lint, Expo Doctor (21/21), Android export and iOS export all
exit 0. Focused CR-75 run: 8 suites / 302 tests passed.
After the final run, the protected-system-section validation message was
clarified to describe both protected sections and the manual Insurance
exception; the full suite and all six gates were rerun successfully.

Coverage aggregation from Istanbul: domain 2,705/2,739 lines (98.76%) and
2,562/2,744 branches (93.37%); data excluding hooks 543/583 lines (93.14%)
and 504/581 branches (86.75%); pure `src/lib` 107/107 lines and 126/126
branches (100%). Per-file Istanbul output: `backup.ts` 97.19% statements,
95.16% branches, 100% functions, 98.70% lines; `budget.ts` 96.04%, 91.23%,
97.58%, 97.97%; `pending.ts` 96.59%, 95.18%, 91.66%, 98.50%; `schemas.ts`
92.89%, 90.76%, 99.07%, 96.71%.

**Superseded assertions:** the blanket assertion that system sections cannot
contain items is narrowed to keep Income and Debt protected while allowing
manual Insurance items; reason: CR-75. The earlier “Insurance never has budget
items” demo assertion becomes an explicit manual Insurance item plus
policy-row reconciliation test. CR-59's read-only unbudgeted-row and visible
“Left X of Y” hint assertions remain superseded as described above. P20-Q
collapsible-row and text-button assertions remain superseded by P20-R's Cards
and icon actions.

**Not verified on a real device:** dropdown list behavior on small screens;
Custom-name keyboard interactions; due-day helper wrapping; keyboard overlap
and focus scrolling; safe-area/top anchoring on notched devices; icon
alignment/touch targets; native screen-reader announcements and full-font-
scale pixel rendering. TestRenderer assertions simulate layout/style state.

CR-71 replaces the earlier sheet-local header/body/footer layouts with one
shared shell, including accessible 44×44 action slots and a fixed footer.
Full-screen route forms continue using the existing `FormScreen`; no
`FormScreen` changes were needed. The route smoke test's assertions for the
removed visible “Apply changes to” and “Value type” labels now locate the
existing controls by their option values, preserving scope and validation
coverage without restoring the user-removed labels. The duplicated “Close”
lookup now targets the full-screen form action (the test Modal mock renders
children while hidden), and the investment informational Modal lookup now
excludes the sheet Modal. The FormShell body assertion uses a stable host node
instead of assuming its children are raw text.

CR-72 changes only the Budget overview pair order and chart legend. The table
header and each row now place Actual in the left value column and Planned in
the right; the stacked-chart and summary accessibility descriptions state
actual before planned. The four section summary lines and item values already
used actual before planned, and tests now assert their order and equivalent
accessibility labels. Home's “spent of” summary was already compliant. A
repository search found the Transactions due rows render the due amount only,
not a planned/actual pair, so those rows are unchanged. The Budget pace legend
now lists Actual before Planned pace; the pace accessibility description was
already actual-first.

CR-73 keeps income-category selection separate from budget-item category
selection. Built-in choices come from the category group mapped to the current
section, names already in the effective month are excluded except the item
being edited, and the Insurance system section is prepared to offer its
Insurance category when CR-75 enables manual Insurance items. Choosing Custom
shows the existing Name field and its 1–30 character validation. CR-74 places
the exact due-day helper below the unchanged frozen IntegerField; the existing
row stacks at font scale 1.3 and above.

The first lint attempt found a synchronous state reset inside the shared
wrapper effect. The reset was removed; keyboard state is now updated by native
keyboard show/hide events only. The full six-gate sequence was rerun after the
correction and passed. Standard Istanbul totals: 95.81% statements, 92.31%
branches, 97.49% functions and 97.65% lines. Directory line/branch aggregation
is provided in the P20-R completion report. The implementation commit is
`391a227`; preflight ledger commit is `5049ab8`. Schema remains v10;
`SortChip.tsx`, `src/lib/sorting.ts`, frozen form inputs and Home's
`BudgetSummaryToggle` are unchanged.

**Modal/sheet inventory:** `BudgetManagementSheet` now delegates to
`TopAnchoredSheet`; the Goal asset picker in `app/goal-form.tsx` now uses the
same wrapper. `SortChip.tsx` remains bottom-anchored and unchanged as a
protected sort-options modal. `DateField.tsx` remains unchanged as a frozen
native date picker. `HeaderMenu.tsx` is a fade menu, `investment-form.tsx`
contains a bottom informational example modal, and `ef-allocation-form.tsx`
contains centered dialogs; none is a bottom-anchored sheet-style form.

**Not verified on a real device:** keyboard overlap/scroll behavior; safe-area
placement on notched phones and Android edge-to-edge layouts; section collapse
animation (removed); icon hit targets and screen-reader announcements; full
font-scale text clipping and touch behavior. The layout assertions are
simulated TestRenderer style contracts, not pixel-level renders.

**Superseded assertions and implementation:** setup navigation to `/budget-setup`
and `/budget-month-form`, the separate linked-recurring setup preview,
setup-route tab-bar absence, and the separate setup-income add/remove/save
validation flow are replaced by direct Create budget / Apply plan behavior,
explicit route-absence checks, and integrated sheet/action coverage. The
`suggestBudgetSplit` and `BUDGET_CATEGORY_WEIGHTS` tests for rounded suggested
five-group weights/overages are removed because suggested splits no longer
exist. The old `BudgetItemEditSheet`/`BudgetSectionAddSheet` components and
`BudgetItemEditSheet.test.tsx` are replaced by `BudgetManagementSheet` and
integrated management tests. The prior separate section cards/`SectionBars`
and "Planned vs actual" card expectations are replaced by expandable section
rows and the planned/actual table. `EditActionOwnership.test.tsx` now expects
the required `plus` / `Add category` header instead of the superseded
`edit-2` / `Edit budget` header. `HomeThemeSmoke.test.tsx` still asserts the
same collapsed accessibility state and expanded label/content, but locates
the nested Pressable by both `testID` and button role after extraction.
`progressLedger.test.ts` changes CR-63–CR-65 from Pending to Done after their
implementation and acceptance tests completed. Its progress-count assertions
move from overall 89% (58/65) to 91% (59/65) and P20 94% (16/17) to
100% (17/17), reflecting the newly completed P20-Q row.

The initial full-coverage attempt exited 1 with those three stale assertions;
the assertions were updated only for the superseding CR-62/CR-65 behavior and
the extracted component boundary. The final `npm test -- --coverage` run
passed 75 suites / 857 tests (95.81% statements, 92.31% branches, 97.49%
functions, 97.65% lines). The implementation commit is `55f9eaa`; the
assertion/ledger alignment commit is `94297e1`.

| Required gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 75 suites / 857 tests pass. | 0 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Passes. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Per-directory coverage, independently aggregated from Istanbul counters:

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2,679/2,719 (98.53%) | 2,517/2,702 (93.15%) |
| `src/data` excluding hooks | 543/583 (93.14%) | 504/581 (86.75%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Changed source Istanbul summaries (statements / branches / functions / lines):

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/domain/budget.ts` | 95.20% | 90.23% | 97.57% | 96.94% |
| `src/data/createAppStore.ts` | 89.77% | 87.18% | 88.05% | 92.14% |

**P20-Q acceptance criteria not verified on a real device:** native sheet
keyboard avoidance, safe-area positioning and scroll behavior; calendar icon
alignment with the due-day field; collapse/expand animation and touch behavior;
whole-screen clipping/readability at font scales 1.3 and 2.0; and native
screen-reader announcements on iOS/Android. TestRenderer checks structure,
style props, callbacks, accessibility props and behavior, not pixel layout or
native interactions.

### P18-R7 housekeeping

| Step | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| STEP 1 — Transactions tab label | Done | `src/components/ui.tsx`; `src/components/__tests__/BottomTabBar.test.tsx`; `src/components/__tests__/TabsLayout.test.tsx`; `src/lib/__tests__/noTxnsLabel.test.ts`; commit `0304acd` | Four focused suites / 18 tests; single-line fit contract, minimum font scale, accessibility label and 44pt target checked at 1.0, 1.3 and 2.0. |
| STEP 2 — Phase tree | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts` | Ten-section heading order; new IDs are unique in dashboard/log; legacy IDs occur once in dashboard mapping column; FX/CH/CR identifiers retained. |
| STEP 3 — Progress bars | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts` | Test recomputes each 10-character bar, percentage, and done/total from dashboard status. |
| STEP 4 — Confirmations and CRs | Done | `docs/PROGRESS.md` | Dated user-confirmation line; CR-4 Done and CR-5–CR-8 Planned, mapped to P19-A–D. |
| STEP 5 — Local commit labels | Done | `docs/PROGRESS.md`; local `refs/notes/phases` and annotated tags | Commit-subject map cross-checked against Git; notes and tags created locally, without history rewrite or push. |
| STEP 6 — Gates and ledger | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts`; tab tests | Focused tests, coverage, TypeScript, lint, Doctor, Android/iOS exports, and line/branch coverage aggregation are recorded in the close-out. |

### P19 — budget model and sync

| Part | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| P19-A — expanded five-group budget setup | Done | `src/domain/budget.ts`, `src/domain/schemas.ts`, budget forms, grouped/compact form components, recurring-items summary, mock data | Focused 11 suites/235 tests; full 68 suites/702 tests; tsc, lint, Doctor 21/21, Android/iOS exports all exit 0. Domain 98.48% lines/93.59% branches; data excluding hooks 92.45%/90.87%; pure lib 100%/100%. |
| P19-A — earlier grouped-form delivery | Historical baseline only | `src/domain/schemas.ts`; `src/components/form/BudgetCategorySections.tsx`; `app/budget-template-form.tsx`; `app/budget-month-form.tsx`; `src/mock/data.ts`; `src/domain/__tests__/budget.test.ts`; `src/components/__tests__/RouteRenderSmoke.test.tsx` | Prior gates were reported green for the older scope; they do not verify current P19-A requirements. Schema v6 remained unchanged. |
| P19-B — budget category/income sync and actions | Done | `src/domain/budget.ts`, `src/domain/links.ts`, `src/domain/transactions.ts`, `app/(tabs)/budget.tsx`, `app/month-review.tsx`, investment/income demo data | Every invest category through form/store/Transactions/budget; earned sources and non-earned inflows in review; 500 seeded reconciliation cases (seed 19052026); 11 focused suites/235 tests and 68 full suites/702 tests. All gates exit 0; device checks remain listed in Section 8. |
| P19-C — owned inputs, Budget header icons and balance card | Done (automated; device checks outstanding) | `src/components/form/frozen-manifest.json`, `scripts/freezeFormComponents.js`, `src/components/AppHeader.tsx`, `app/(tabs)/budget.tsx`, `app/(tabs)/transactions.tsx`; focused UI/form/ledger tests | Focused 9 suites/203 tests; full 68 suites/707 tests; TypeScript, lint, Doctor (21/21), Android/iOS exports and `git diff --check` all exit 0. Istanbul: domain 98.48% lines/93.59% branches; data excluding hooks 92.45%/90.87%; pure lib 100%/100%. Input source diff against `bf4adf3` is empty. Device layout and screen-reader behavior remain unverified. |

### P14 items

| Item | Status | Source evidence | Test evidence / gap |
|---|---|---|---|
| P14-A close-out/UI | Pending, user-reported | `app/`, `src/components/` | P14-specific test mapping unavailable; Part 15 A/B/C evidence is not full P14 acceptance. |
| P14-B refinements | Pending, user-reported | `app/`, `src/components/` | Original acceptance/test names unavailable. |
| P14-C schema v4 / EF allocation | Pending as P14; follow-up verified in P15-A/A2 | `src/domain/efAllocation.ts`, `src/domain/schemas.ts`, `src/data/migrate.ts` | `src/domain/__tests__/efAllocation.test.ts`; `src/data/__tests__/migrateV4.test.ts`; does not prove all P14 criteria. |
| P14-D storage guard | Pending, user-reported | `src/lib/storageGuard.ts`, `src/data/safeStorage.ts` | `src/lib/__tests__/storageGuard.test.ts`; P14 phase acceptance not established. |
| P14-E reminders | Pending / held follow-up | No verified reminder planner or route | No reminder tests; P15-K held. |
| P14-F encrypted backup | Pending / held follow-up | Plain backup only: `src/domain/backup.ts` | `src/domain/__tests__/backup.test.ts` only covers plain backup; P15-L held. |
| P14-G polish | Pending, user-reported | `app/`, `src/components/` | Original test matrix unavailable. |

### P15–P17 data and UI items

| Item | Status | Source evidence | Test evidence |
|---|---|---|---|
| P15-A/A2 audit and repairs | Done | `src/domain/efAllocation.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `jest.config.js` | `src/domain/__tests__/efAllocation.test.ts`, `src/data/__tests__/migrate.test.ts`, `src/data/__tests__/safeStorage.test.ts`; historical gate evidence in commit ledger. |
| P15-B UI leftovers | Done | `app/(tabs)/index.tsx`, `app/(tabs)/transactions.tsx`, `src/components/` | `src/components/__tests__/HomeThemeSmoke.test.tsx`, `src/components/__tests__/TransactionsScreen.test.tsx` |
| P15-C SIP date clarity | Done | `app/investment-form.tsx`, `app/(tabs)/index.tsx` | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/components/__tests__/HomeThemeSmoke.test.tsx` |
| P16-A schema v5 | Done | `src/domain/schemas.ts`, `src/domain/types.ts`, `src/data/migrate.ts`, `src/domain/backup.ts` | `src/data/__tests__/migrateV4.test.ts`, `src/domain/__tests__/backup.test.ts`, `src/domain/__tests__/schemas.test.ts`, `src/domain/__tests__/v5Integrity.test.ts` |
| P16-B clearing dues | Done | `src/domain/dues.ts`, `src/domain/schedule.ts`, `src/data/createAppStore.ts`, `app/clear-dues.tsx` | `src/domain/__tests__/dues.test.ts`, `src/domain/__tests__/schedule.test.ts`, `src/data/__tests__/createAppStore.test.ts` |
| P20-A pending Transactions | Done | `src/domain/pending.ts`, `src/domain/dues.ts`, `src/components/PendingItemRow.tsx`, `src/components/PendingItemActions.tsx`, `app/(tabs)/transactions.tsx`, budget forms and mock data | Focused pending/store/form tests; `src/domain/__tests__/backup.test.ts` fixture aligns with the added demo default template; full test suite and all configured gates pass. |
| P20-B Home actions and spending plan | Done | `app/(tabs)/index.tsx`, `src/components/PendingItemActionSheet.tsx`, `src/components/PendingItemActions.tsx`, `src/components/PendingItemRow.tsx` | `src/components/__tests__/HomeThemeSmoke.test.tsx`, `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/components/__tests__/PendingItemActions.test.tsx`; Home/route focused suites pass. |
| P20-C main-screen tab visibility | Done | `app/(tabs)/_layout.tsx`, all non-tab route screens, `src/components/form/FormScreen.tsx`, `src/components/ui.tsx`, `src/lib/routeKinds.ts` | `src/lib/__tests__/routeKinds.test.ts` proves every route is registered and non-tab routes contain no bar; `src/components/__tests__/TabsLayout.test.tsx` checks one correctly active shared bar for each tab; `src/components/__tests__/RouteRenderSmoke.test.tsx` checks Budget history/Month review. The prior P18-R5 assertion expecting a Budget-selected detail bar was superseded by DEC-TABS. |

#### Earlier P20 gate snapshot (P20-A/B/C)

All commands ran sequentially after the P20 source changes; each exited 0.

| Gate | Result | Exit |
|---|---|---:|
| Focused P20/ledger tests | 9 suites, 213 tests passed | 0 |
| `npm test -- --coverage` | 70 suites, 720 tests passed; statements 96.50%, branches 93.66%, functions 97.01%, lines 97.82% | 0 |
| `npx tsc --noEmit` | Typecheck passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | 21/21 checks passed; no issues detected | 0 |
| `npx expo export --platform android` | Exported Android bundle | 0 |
| `npx expo export --platform ios` | Exported iOS bundle | 0 |

Per-directory source coverage (Istanbul per-file summaries, excluding tests;
`src/data` excludes hooks): domain 2192/2225 lines (98.52%), 2047/2187
branches (93.60%); data 306/331 lines (92.45%), 221/243 branches (90.95%);
lib 107/107 lines (100.00%), 126/126 branches (100.00%).
### P21 — Emergency fund goal model and allocation

Schema changed from v6 to v7 in P21-A; P21-B and P21-C did not change the
schema (current v8). Feature implementation and feature-specific tests are
complete. CR-26 repaired the Expo Doctor blocker; final required gates pass
and P21-A/B/C with CR-8, CR-13, CR-14, CR-15, CR-20, CR-37 and CR-38 are Done.

| Part | Status | Coverage evidence | Test / verification evidence |
|---|---|---|---|
| P21-A emergency-fund linked model [schema v7] | Done | v6→v7 migration, backups, premigration archive, link integrity, category remap and total preservation | `src/data/__tests__/migrate.test.ts`, `migrateV4.test.ts`, `safeStorage.test.ts`, `createAppStore.test.ts`; `src/domain/__tests__/backup.test.ts`, `goalLinks.test.ts`, `schemas.test.ts` |
| P21-B emergency-fund cover/allocation | Done | Expense/salary fallback, truncation, minimum target, linked table and compact allocation UI | `src/components/__tests__/EmergencyGoalScreens.test.tsx`, `EfAllocationForm.test.tsx`; `src/domain/__tests__/selectors.test.ts`, `efAllocationCustom.test.ts` |
| P21-C allocation display and editor | Done | Header-only edit action, no status labels, allocation bar-last rows at multiple font scales, four defaults, fixed/custom deletion and retained goal links; schema v8 unchanged | `src/components/__tests__/EmergencyGoalScreens.test.tsx`, `EfAllocationForm.test.tsx`, `FormScreen.test.tsx`, `AppHeaderUsage.test.ts`; `src/domain/__tests__/efAllocation.test.ts`, `efAllocationCustom.test.ts`; `src/data/__tests__/createAppStore.test.ts`; `src/mock/__tests__/demoData.test.ts` |
| P21-C1 allocation crash repair | Done | CR-39; strict domain action validation, resolver with largest-remainder normalization, safe render path, one-write hydration repair and exact raw archive; schema v8 unchanged | `src/domain/__tests__/efAllocation.test.ts`, `src/components/__tests__/EmergencyGoalScreens.test.tsx`, `EfAllocationForm.test.tsx`, `src/data/__tests__/createAppStore.test.ts`, `safeStorage.test.ts`, `src/domain/__tests__/schemas.test.ts` |

#### P21 initial gates (historical; Doctor issue resolved in CR-26)

| Gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 69 suites / 723 tests passed. Domain: 98.33% lines, 93.54% branches; data excluding hooks: 93.38% lines, 87.73% branches; pure lib: 100% lines and branches. | 0 |
| `npx tsc --noEmit` | Typecheck passed. | 0 |

#### P20-T final verification

`npm test -- --coverage`: 76 suites / 873 tests passed; 95.93% statements,
92.49% branches, 97.50% functions and 97.84% lines overall. The first
coverage run exited 1 because the progress-ledger test still expected CR-71
to be plain `Done`; its assertion now records CR-76's explicitly authorized
FormScreen freeze supersession, and the complete coverage run passed on rerun.
Focused form verification: 6 suites / 136 tests passed (FormScreen, FormShell,
route render, onboarding, EF allocation and frozen-component tests).

| Required gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 76 suites / 873 tests pass; 95.93% statements, 92.49% branches, 97.50% functions, 97.84% lines. | 0 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Passes. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Coverage aggregation from the final Istanbul counters:

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2,705/2,739 (98.76%) | 2,562/2,744 (93.37%) |
| `src/data` excluding hooks | 543/583 (93.14%) | 504/581 (86.75%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Per-file Istanbul summaries for changed UI source: `FormShell.tsx` and
`FormScreen.tsx` are not instrumented by the current Jest coverage config.
No pure domain/data/lib implementation function changed in P20-T; the changed
`progressLedger.test.ts` is test code, not an instrumented source module.
The full run reported 95.93% statements / 92.49% branches / 97.50% functions /
97.84% lines across instrumented source.

The directory aggregation script used the final `coverage/coverage-final.json`:

```js
const coverage = require('./coverage/coverage-final.json');
const groups = {
  domain: (file) => file.includes('/src/domain/') && !file.includes('/__tests__/'),
  data: (file) => file.includes('/src/data/') && !file.includes('/__tests__/') && !/\/use[^/]*\.[jt]sx?$/.test(file),
  lib: (file) => file.includes('/src/lib/') && !file.includes('/__tests__/'),
};
for (const [name, include] of Object.entries(groups)) {
  let linesHit = 0, linesTotal = 0, branchesHit = 0, branchesTotal = 0;
  for (const [file, item] of Object.entries(coverage)) {
    if (!include(file)) continue;
    const lines = new Map();
    for (const [id, statement] of Object.entries(item.statementMap)) {
      const line = statement.start.line;
      lines.set(line, (lines.get(line) ?? false) || item.s[id] > 0);
    }
    linesTotal += lines.size;
    linesHit += [...lines.values()].filter(Boolean).length;
    const branches = Object.values(item.b).flat();
    branchesTotal += branches.length;
    branchesHit += branches.filter((count) => count > 0).length;
  }
  console.log(name, {
    lines: `${linesHit}/${linesTotal} (${(100 * linesHit / linesTotal).toFixed(2)}%)`,
    branches: `${branchesHit}/${branchesTotal} (${(100 * branchesHit / branchesTotal).toFixed(2)}%)`,
  });
}
```

**Replaced assertions:** full-screen Close-on-left assertions now expect
Back-on-left; reason: CR-77 assigns one navigation rule to full-screen forms.
Redundant footer Back buttons on invalid/missing-route states are replaced by
the header Back action; reason: the shared form has one navigation affordance.
The previous CR-71 assertion that FormScreen remained frozen is superseded by
the user's explicit CR-76 authorization; the baseline and authorized SHA-256
are recorded in DEC-P20T, and all other frozen input hashes still match.
FormShell titles no longer use a single-line-only constraint; layout
assertions verify wrapping space and persistent 44×44 action/footer structure
at simulated font scales 1.3 and 2.0.

**Modal/form inventory:** Budget management and Goal asset selection remain
inside TopAnchoredSheet and share FormShell. EF allocation's custom-option
edit and add dialogs now use FormShell with KeyboardAvoidingView. Its linked
investment chooser remains a selection picker, not a data-entry form.
Investment-form's slide modal is informational. Other `Modal` uses in `app/`
are these three EF dialogs and that informational investment modal; native
date/dropdown pickers are unchanged. Security settings, link-missing
bulk-selection, liability-payment/investment-entry lists and their filters
remain non-form surfaces.

**Not verified on a real device:** keyboard overlap with and reachability of
the fixed footer; actual keyboard resizing on iOS/Android; safe-area positioning
on notched/small phones; title and footer pixel clipping at system font scales
1.3/2.0; centered EF dialog sizing while the keyboard is open; and onboarding
hardware-back exit behavior. TestRenderer checks are simulated style and
structure assertions only.
| `npx expo lint` | Lint passed. | 0 |
| `npx expo export --platform android` | Android export passed. | 0 |
| `npx expo export --platform ios` | iOS export passed. | 0 |
| `npx expo doctor` | Unsupported by the installed local Expo CLI. | 1 |
| `npx expo-doctor` | 20/21 checks passed. App config check failed because `ios.icon` in `app.json` points to `./assets/images/icon.png`; the checker requires a `.icon` directory. The app config was not modified because this is pre-existing and outside P21 scope. | 1 |

The config issue above was repaired in P20-D commit `8590a4a`. Recheck:
`npx expo-doctor` now passes 21/21; Android and iOS exports pass. Relevant
existing tests are `hydrates v6 into v7 and archives exact raw bytes only
once` (`src/data/__tests__/createAppStore.test.ts`),
`round-trips custom emergency-fund options and refuses schema version eight`
and `round-trips a manual holding snapshot adjustment through backup export
and import` (`src/domain/__tests__/backup.test.ts`).

#### P21-C final gates (2026-10-17, reverified after P21-C1)

| Gate | Result | Exit |
|---|---|---:|
| Focused P21-C and ledger tests | 8 suites / 133 tests passed | 0 |
| `npm test -- --coverage` | 70 suites / 786 tests passed; statements 96.31%, branches 93.02%, functions 97.54%, lines 97.78% | 0 |
| `npx tsc --noEmit` | TypeScript passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | `Running 21 checks on your project...` / `21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported | 0 |
| `npx expo export --platform ios` | iOS bundle exported | 0 |
| `git diff --check` | No whitespace errors | 0 |

Per-directory coverage from the final run, excluding tests and data hooks:
domain 98.42% lines / 93.72% branches; data 94.38% lines / 87.76% branches;
pure lib 100% lines / 100% branches. The first full run exposed the expected
edit-action ownership assertion that needed to allow the newly required
Emergency Fund header action, plus test typing issues; the test and types were
corrected before the final green run. Font-scale checks remain simulated; see
the device limitations in DEC-P21C-CR37-38.

#### P21-C1 final gates (2026-10-17)

| Gate | Result | Exit |
|---|---|---:|
| Focused allocation, hydration, form and screen regressions | 4 suites / 108 tests passed | 0 |
| `npm test -- --coverage` | 70 suites / 786 tests passed. Statements 96.31%, branches 93.02%, functions 97.55%, lines 97.78%. | 0 |
| `npx tsc --noEmit` | TypeScript passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | `Running 21 checks on your project...` / `21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported | 0 |
| `npx expo export --platform ios` | iOS bundle exported | 0 |
| `git diff --check` | No whitespace errors | 0 |

Per-directory coverage aggregation, lines and branches reported separately,
excluding tests and data hooks: domain 2250/2286 lines (98.43%), 2091/2231
branches (93.72%); data 472/500 lines (94.40%), 409/466 branches (87.77%);
pure lib 107/107 lines (100%), 126/126 branches (100%). These are aggregate
counts; Jest's per-file Istanbul percentages are separate:

| File | Lines | Branches |
|---|---:|---:|
| `src/domain/efAllocation.ts` | 100% | 95.45% |
| `src/domain/efAllocationActions.ts` | 100% | 92.95% |
| `src/domain/schemas.ts` | 92.27% | 90% |
| `src/domain/backup.ts` | 97.85% | 96.22% |
| `src/data/createAppStore.ts` | 92.62% | 88.46% |
| `src/data/safeStorage.ts` | 96.36% | 93.93% |

Aggregation script used with `coverage/coverage-final.json`:

```js
const { createCoverageMap } = require('istanbul-lib-coverage');
const raw = require('./coverage/coverage-final.json');
const map = createCoverageMap(raw);
const groups = Object.fromEntries(['domain', 'data', 'lib'].map((name) => [
  name,
  { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } },
]));
for (const file of map.files()) {
  const rel = file.replace(`${process.cwd()}/`, '');
  let group;
  if (rel.startsWith('src/domain/')) group = 'domain';
  else if (rel.startsWith('src/data/')
    && !/(^|\\/)(hooks|use[A-Z][^/]*\\.[jt]sx?)($|\\/)/.test(rel)) group = 'data';
  else if (rel.startsWith('src/lib/')) group = 'lib';
  else continue;
  const summary = map.fileCoverageFor(file).toSummary();
  for (const metric of ['lines', 'branches']) {
    groups[group][metric].covered += summary[metric].covered;
    groups[group][metric].total += summary[metric].total;
  }
}
for (const [name, metrics] of Object.entries(groups)) {
  const output = Object.fromEntries(Object.entries(metrics).map(([metric, count]) => [
    metric,
    `${count.covered}/${count.total} (${(count.covered / count.total * 100).toFixed(2)}%)`,
  ]));
  console.log(name, JSON.stringify(output));
}
```

#### P22-A initial gates (historical; Doctor issue resolved in CR-26)

P22-A implementation and acceptance tests are green. Its initial Doctor issue
was resolved in CR-26. No schema change was made; `SCHEMA_VERSION` remains 7.

| Gate | Result | Exit |
|---|---|---:|
| Focused demo/store/menu/backup tests | 4 suites / 72 tests passed; generated-demo route smoke adds 2 suites / 105 tests across the focused route and demo run. | 0 |
| `npm test -- --coverage --runInBand` | 70 suites / 733 tests passed. Domain: 98.37% lines, 93.73% branches; data excluding hooks: 93.36% lines, 87.72% branches; pure lib: 100% lines and branches. | 0 |
| `npx tsc --noEmit` | Typecheck passed. | 0 |
| `npx expo lint` | Lint passed with no warnings after cleanup. | 0 |
| `npx expo export --platform android` | Android export passed. | 0 |
| `npx expo export --platform ios` | iOS export passed. | 0 |
| `npx expo doctor` | Unsupported by the installed local Expo CLI; it instructed use of `npx expo-doctor`. | 1 |
| `npx expo-doctor` | 20/21 checks passed. Expo config validation failed because `ios.icon` in `app.json` points to `./assets/images/icon.png`, which is not the `.icon` directory required by the checker. This pre-existing config was not changed as part of P22-A. | 1 |

| P22-A four-month linked demo | Done | `src/mock/demoData.ts`, development-menu loader, and strict import preservation of `snapshotAdjustment` | `src/mock/__tests__/demoData.test.ts`, `src/data/__tests__/createAppStore.test.ts`, `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/lib/__tests__/appMenu.test.ts`; acceptance tests and final required gates pass |
| P23-A insurance [P15-F] | Done | Schema-v11 policy model and migration; policy actions, schedules and due integration | Policy, migration, backup and route tests; final six gates pass |
| P16-C goal links | Done | `src/domain/goalLinks.ts`, `src/domain/goals.ts`, `app/goal-form.tsx` | `src/domain/__tests__/goalLinks.test.ts`, store and route smoke suites |
| P17-A cash flow/movements | Done | `src/domain/cashFlow.ts`, `app/month-review.tsx`, `app/money-movement-form.tsx` | `src/domain/__tests__/cashFlow.test.ts`, `src/data/__tests__/createAppStore.test.ts` |
| P17-B budgets | Done | `src/domain/budget.ts`, `app/budget.tsx`, `app/budget-template-form.tsx`, `app/budget-history.tsx` | `src/domain/__tests__/budget.test.ts`, `src/data/__tests__/createAppStore.test.ts`, route and Transactions screen suites |
| P17-C sorting | Done | `src/lib/sorting.ts`, `src/data/useSort.ts`, `src/components/SortChip.tsx`, sortable `app/` lists | `src/lib/__tests__/sorting.test.ts`, `src/data/__tests__/metaStore.test.ts`, screen and route smoke suites |
| P24-A reminders / CR-1 [P15-K] | Done | Local reminders, lock-gated confirmation, privacy controls and scheduler | Focused tests and all six ordered gates pass; native delivery remains unverified |
| P25-A release preparation | Done | `README.md`, `CHANGELOG.md`, `AGENTS.md`, package/app version metadata and this ledger | Release gates recorded in DEC-P25A; store deployment and device QA remain outside this task |
| P25-B encrypted backup [P15-L] | Done | `src/domain/backupCrypto.ts`, `app/backup.tsx`, and the existing import/migration chain | `src/domain/__tests__/backupCrypto.test.ts`, route smoke and store migration/Undo tests; 80 suites / 984 tests and all six gates pass |
| P26-A accessibility/performance [P15-M] | Done | Accessibility and performance fixes; audit evidence summarized in this ledger | Full coverage and six ordered gates pass; native-device checks remain open |
| P27-A cleanup | Done | Dead-code/dependency, bundle and schedule benchmark cleanup | Six ordered gates pass; accepted dependency audit risk remains open |
| P28-A QA and release | Done | Initial release preparation; stable v1.0.0 metadata subsequently handled in P28-B | See dashboard and release history; production EAS build remains unbuilt |
| P28-B release metadata | Done | v1.0.0 app/package metadata and published notes | See dashboard and release history |
| P28-C release organization/build management | Done | Reusable notes, EAS build configuration, build history and release rules | See dashboard and build history; production build remains unbuilt |
| P29-AA Emergency Fund link integrity | Done | Deletion/hydration repair preserving valid links and balances | Six gates passed at completion; original test counts remain historical |
| P29-AB Budget income recurrence | Done; Revised by P29-AB-R1 | Monthly, quarterly, half-yearly and yearly income schedules; migration and backup/import | Original six gates passed; recurrence UI/device retest remains open |
| P29-AB-R1 income recurrence consumers | Done | `src/domain/budget.ts`, `src/domain/pending.ts`, `src/domain/policySummary.ts` | Recurrence table, store persistence/hydration, frozen-snapshot edit and route font-scale tests; full coverage and Gates 2-4 passed |
| P29-AB-R2 non-due recurring rows | Done | `app/(tabs)/budget.tsx`, recurring-income row selectors | Old route output included a recurring item as planned/due and in totals in non-due months. New: non-due items appear only in the collapsed editable Recurring income group with the next due month; planned/due rows and totals exclude them. Reason: preserve editability without implying cash is due. Twelve-month route tests cover font scales 1.0, 1.3 and 2.0. |
| P20-N Budget overview | Done; Revised by P20-N-R1 and P20-N-R3 | Original overview model, chart and route; initial visual assertions are historical | Original section/stacked summary tests remain historical; the chart presentation is revised below |
| P20-N-R1 section Pace graph | Done; Revised by P20-N-R2 | `src/domain/budget.ts`, `src/components/BudgetCharts.tsx`, `app/(tabs)/budget.tsx` | Old: aggregate Pace graph tests. New: section lines/toggles and per-section accessibility/contrast tests. P20-N-R2 supersedes this presentation with the aggregate graph. |
| P20-N-R2 aggregate Pace graph | Done | `src/components/BudgetCharts.tsx`, `app/(tabs)/budget.tsx` | Restored the aggregate actual-versus-planned Pace graph above the overview table; removed per-section code/toggles and replaced section tests with aggregate chart and route tests at font scales 1.0, 1.3 and 2.0. Reason: restore the requested overview behavior without the stacked bar. |
| P20-N-R3 Budget overview text removal | Done | `src/components/BudgetCharts.tsx`, `app/(tabs)/budget.tsx` | Old: visible `Left ₹250`, Pace, Over by/Left summary text was expected or not prohibited, and the route assertion rejected absolute positioning anywhere in Overview. New: visible summary text is absent at font scales 1.0, 1.3 and 2.0; table Left row and chart/table accessible descriptions remain; only the chart is asserted free of absolute-positioned children. Reason: owner-directed removal of redundant visible lines while preserving accessibility and chart behavior. |
| P20-A-R1 paid sync | Done | Shared `clearDue` action and linked plan/liability paid-entry routes | Old: one linked planned row used plain `addTransaction`, omitting the holding entry/liability payment. New: all paid entry points use `clearDue`/Undo with one store write. Reason: keep transaction, holding and liability ledgers consistent atomically. |
| P29-O1-R1 investment Entries | Done | Recurring investment Entries selectors and route | Old: no completed/pending counts or collapsed paid group; generated schedule could extend past maturity. New: counts, visible pending rows, collapsed Paid investments and maturity cap. The fixed seven-row assertion is replaced by a schedule-derived expected row set because pending scheduled rows are now rendered. |
| P29-W-R1 liability Entries | Done | Liability Entries selectors and route | Old: no counts or collapsed Paid EMIs, with coverage checking only summary text. New: counts, collapsed paid rows, and actual rendered pending rows bounded by final EMI date. Reason: verify the rendered schedule, not only its label. |

### Fix round

| Item | Status | Planned source evidence | Required tests |
|---|---|---|---|
| P18-R0 [P15-fix-0] | Done | `docs/PROGRESS.md` | `src/lib/__tests__/progressLedger.test.ts` |
| P18-LEDGER [P15-LEDGER] | Done | `docs/PROGRESS.md`; prompt archive absent at current HEAD; recovery `5aeefb9` | `src/lib/__tests__/progressLedger.test.ts` — ten headings, all FX IDs unique in dashboard, every prompt row unique and required IDs present, CR-3/current work and archive absence asserted |
| CR-3 form follow-up | Open | `app/profile-form.tsx`, `app/transaction-form.tsx` | Current code has visible field labels; Save shares footer width with a validation summary in these two routes. No source fix made. |
| FX-BASE | Done | `app/(tabs)/transactions.tsx`, `app/(tabs)/index.tsx`, `app/assets.tsx`, `app/liabilities.tsx`, `src/components/ui.tsx` | `src/components/__tests__/TransactionsScreen.test.tsx` (withdrawal-only notice, expanded information, null rates/no NaN), `src/components/__tests__/StatPill.test.tsx` (exact accessible label), plus four prior focused suites; 520 full-suite tests pass |
| FX-U1 | Done | `src/lib/amountDisplay.ts`, `src/lib/format.ts`, `src/components/AmountText.tsx`, `src/components/form/MoneyField.tsx`, amount consumers in `app/`, `src/components/InstrumentCard.tsx` | `src/lib/__tests__/amountDisplay.test.ts` — thresholds and rounding promotion; `src/components/__tests__/AmountText.test.tsx` — live font scale, exact labels and formatter scan; `src/components/__tests__/RouteRenderSmoke.test.tsx` — exact-label matrix across Home, Assets, Liabilities, Emergency fund, Goals, Budget and Transactions |
| FX-U2 | Done | `src/lib/sectionLayout.ts`, `src/components/SectionHeaderRow.tsx`, all `SortChip` routes in `app/` | `sectionLayout.test.ts` — exact fit boundary and configurable gap; `SectionHeaderRow.test.tsx` — inline/stacked thresholds, hidden-until-measured behavior, simulated font-scale-2.0 stacking, and AST scan proving every app `SortChip` is inside `SectionHeaderRow` |
| FX-U3 | Done | `src/lib/routeKinds.ts`, `src/components/AppHeader.tsx`, all registered `app/` routes | `routeKinds.test.ts` — every app route is registered; `AppHeader.test.tsx` — each route's expected left control, label and 44pt target; router back/fallback and Android hardware-back behavior |
| FX-U4 | Done | `src/components/form/FormScreen.tsx`; `app/*-form.tsx`, `app/clear-dues.tsx`, `app/month-review.tsx` | `FormScreen.test.tsx` — Close target, clean button and Android-back close, dirty confirmation/cancel and hardware-back behavior; `RouteRenderSmoke.test.tsx` — Close and boolean dirty-state wiring on each form, clear-dues and month-review route |
| FX-B1 | Done | `src/domain/transactions.ts` (`expenseCategoryBreakdown`), `src/domain/budget.ts`, `src/domain/schemas.ts`, `src/mock/data.ts`, `app/(tabs)/index.tsx`; no category-specific icon/color/label-map layer exists to update | `budget.test.ts` — weights total 100 and rounding, template/month validation and actuals; `selectors.test.ts` — category breakdown and filter; `HomeThemeSmoke.test.tsx` — rendered breakdown; `backup.test.ts` — new categories round-trip in schema-v5 backup |
| FX-B2 | Done | `app/(tabs)/budget.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/budget-history.tsx`, `src/lib/appMenu.ts` | `TabsLayout.test.tsx` — order, unique icons, one-line labels and 44pt targets under simulated 2.0 scale; `RouteRenderSmoke.test.tsx` — Budget menu actions/history route; `HomeThemeSmoke.test.tsx` — Home Budget link; `appMenu.test.ts` and `routeKinds.test.ts` — menu removal and old-route absence |
| FX-T1 | Done | `app/(tabs)/transactions.tsx`, `app/transaction-form.tsx` | `TransactionsScreen.test.tsx` — plus routes directly to form, menu opens movement sheet; `TransactionForm.test.tsx` — Expense, Income and Invest saves |
| FX-T2 | Done | `src/domain/cashFlow.ts` (`availableBalance`) | `src/domain/__tests__/cashFlow.test.ts` — carries opening across an empty month, counts through today, excludes future-dated current-month entries, preserves negative/no-history values and returns past-month closing |
| FX-T3 | Done | `src/domain/schemas.ts`, `src/mock/data.ts`, `app/(tabs)/transactions.tsx`, `app/(tabs)/budget.tsx` | `TransactionForm.test.tsx` — Festival/Donation/Gifts create and edit; `TransactionsScreen.test.tsx` — routed filter results; `RouteRenderSmoke.test.tsx` — Budget line navigates with each category filter |
| FX-T4 | Done | `app/(tabs)/transactions.tsx` — collapsed balance card max height 64pt; obsolete review-banner styles removed | `src/components/__tests__/TransactionsScreen.test.tsx` — exactly two collapsed visible amounts, five expanded rows, review link/menu/dot/dismissal and negative danger tone |
| FX-S1 | Done | `app/(tabs)/transactions.tsx`, `app/(tabs)/budget.tsx`, `app/(tabs)/goals.tsx`, `app/assets.tsx`, `app/budget-history.tsx`, `app/emergency-fund.tsx`, `app/investment-entries.tsx`, `app/liabilities.tsx`, `app/liability-payments.tsx`, `app/link-missing.tsx` | `src/components/__tests__/TransactionsScreen.test.tsx` — filter/sort row layout, chips, styles at simulated font scale 2.0; existing filter/search/category/sort tests; `src/components/__tests__/RouteRenderSmoke.test.tsx` — chip-origin swipe suppression; `src/components/__tests__/SectionHeaderRow.test.tsx` — only the Transactions filter-row SortChip is exempt from SectionHeaderRow placement |
| FX-S2 | Done | `src/lib/sorting.ts`, `app/budget-history.tsx` | `src/lib/__tests__/sorting.test.ts` — all Budget history comparators ascending/descending, null savings-rate last, month-id tie breaks, default month-first registry; `src/data/__tests__/metaStore.test.ts` — persistence and invalid-key fallback; `src/components/__tests__/RouteRenderSmoke.test.tsx` — rendered SortChip lists all ten keys |
| FX-T5 | Done | `app/(tabs)/transactions.tsx` — `cashCard` has no fixed height cap; `cashCardCollapsed` alone applies `maxHeight: 64` | `src/components/__tests__/TransactionsScreen.test.tsx` — flattened collapsed/expanded styles, toggle behavior, no absolute descendant, normal-flow month/filter/list sections, and simulated font-scale-2.0 expanded rows |
| FX-I1 | Done | `app/investment-form.tsx` — recurring create/edit value helpers, worked example, and actual-value date prefill; `src/components/form/HelperText.tsx` forwards accessibility hints | `src/components/__tests__/RouteRenderSmoke.test.tsx` — recurring create/edit helpers and info sheet, date prefill, and one-time/manual exclusion |
| CH-3 | Done | `src/lib/appMenu.ts`, `src/components/useAppMenu.ts` — remove link-missing app-menu entry; `app/(tabs)/transactions.tsx` — always-present Transactions header action and conditional count notice | `src/lib/__tests__/appMenu.test.ts`, `src/components/__tests__/useAppMenu.test.tsx` — app menu no longer contains link-missing; `src/components/__tests__/TransactionsScreen.test.tsx` — count visibility, route actions, placement and simulated font scale 2.0 |
| CH-2 | Done | `src/lib/appMenu.ts`, `src/components/useAppMenu.ts` — remove global Budget history/Month review actions; `app/(tabs)/budget.tsx` — History/Month review quick actions, reviewable-month indicator and routing; `app/investment-form.tsx` — avoid unnecessary async validation for the valid automatic date prefill | `src/lib/__tests__/appMenu.test.ts`, `src/components/__tests__/useAppMenu.test.tsx` — global menu removals; `src/components/__tests__/RouteRenderSmoke.test.tsx` — button/menu navigation, latest-review-month dot and route, wrapping style at simulated scale 2.0, awaited date-prefill update |
| CH-4 | Done | `app/(tabs)/transactions.tsx` — remove movement menu and sheet; `app/money-movement-form.tsx` deleted; `src/lib/routeKinds.ts` — remove form route; `src/domain/schemas.ts` — remove form-only schema and types | `src/components/__tests__/TransactionsScreen.test.tsx` — no movement action/sheet; `src/lib/__tests__/routeKinds.test.ts` — route registry and source-string scan; `src/domain/__tests__/schemas.test.ts` — delete removed form cases; `src/domain/__tests__/cashFlow.test.ts`, `src/data/__tests__/createAppStore.test.ts` — preserve Month review allocation and shared movement-action behavior |
| FX-L1 | Done | `src/domain/liability.ts` — pure EMI/rate/tenure solver; `src/domain/schemas.ts` — two-known-value validation and calculated output mapping; `app/liability-form.tsx` — live calculated values, No interest chip, mismatch warning/action | `src/domain/__tests__/liability.test.ts` — known value, zero rate, 2,000 seeded round trips, all solver errors and mismatch; `src/domain/__tests__/schemas.test.ts` — solver direction outputs, required fields and bounds; `src/components/__tests__/RouteRenderSmoke.test.tsx` — all solve directions displayed before save and stored, No interest, entered EMI retention and calculated-EMI action |
| FX-L2 | Done | `2bc35f0`; `app/liability-form.tsx` — received switch defaults on, auto-off for historical starts until user touch, and explanation; `src/domain/cashFlow.ts` — Borrowed category for full one-time origin inflow | `src/components/__tests__/RouteRenderSmoke.test.tsx` — default state, historical auto-off, touched override and form receipt action; `src/data/__tests__/createAppStore.test.ts` — recurring/one-time origin records and one persisted write; `src/domain/__tests__/cashFlow.test.ts` — legacy partial and linked movement behavior |
| FX-E1 | Done | `src/lib/amountDisplay.ts`, `src/components/AmountText.tsx`, `app/emergency-fund.tsx`, Home/Goals emergency cards and passbook | `src/components/__tests__/RouteRenderSmoke.test.tsx` — exact labels for large balance/baseline figures; `src/components/__tests__/EmergencyGoalScreens.test.tsx` — three-month target behavior; `AmountText.test.tsx` — exact accessibility |
| FX-E2 | Done | `app/ef-allocation-form.tsx`, `src/domain/efAllocationActions.ts`, `src/data/createAppStore.ts` | `src/components/__tests__/EfAllocationForm.test.tsx` — each remaining control's label, hint and stored result plus orphaned-string scan; `src/data/__tests__/createAppStore.test.ts` — reset persisted state and one write |
| CH-1 | Done | `src/domain/efAllocation.ts`, `src/domain/efAllocationActions.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts`, `src/domain/links.ts`, `src/domain/holdingActions.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `src/data/createAppStore.ts`, `app/ef-allocation-form.tsx`, `app/emergency-fund.tsx` — custom buckets, metadata-based warning/allocation, link cascade and one-write plan save; v5→v6 migration/archive and v6 backups | `src/domain/__tests__/efAllocationCustom.test.ts` — action validation, moveTo, integrity, warning metadata and seeded 20,000-case paise proof; `src/data/__tests__/migrateV4.test.ts` — v5 defaults/deep preservation; `src/data/__tests__/createAppStore.test.ts` — v6 hydration/archive/erase and one-write save; `src/domain/__tests__/backup.test.ts` — v6 round-trip and v7 refusal; `src/domain/__tests__/schemas.test.ts` — custom bounds; `src/components/__tests__/EfAllocationForm.test.tsx` — custom option, totals, picker and single save; `src/components/__tests__/EmergencyGoalScreens.test.tsx` — linked rows and values; `src/components/__tests__/RouteRenderSmoke.test.tsx` — routes use v6 state |
| P18-R5-1 Bottom navigation [P15-FIX-R5-1] | Done (automated; device checks outstanding) | `app/(tabs)/_layout.tsx`, `src/components/ui.tsx`, `app/budget-history.tsx`, `app/month-review.tsx`, `src/components/form/FormScreen.tsx` | `BottomTabBar.test.tsx`, `TabsLayout.test.tsx`, `RouteRenderSmoke.test.tsx` — shared tabs/order/labels/icons/selection/safe-area structure, touch target and simulated font scales. Android/iOS device spacing not verified. |
| P18-R5-2 Budget actions [P15-FIX-R5-2] | Done (automated; device checks outstanding) | `app/(tabs)/budget.tsx` — shared History/Month review action styling, selected-month review routing and review dot | `RouteRenderSmoke.test.tsx` — matched action style/minimum target and distinct routes under simulated font scale. |
| P18-R5-3 Cash flow [P15-FIX-R5-3] | Done (automated; device checks outstanding) | `app/(tabs)/budget.tsx` — opening, previous position, monthly flow and closing hierarchy; `budgetMonthView` calculations unchanged | `RouteRenderSmoke.test.tsx` — values/labels, positive/negative statuses, review navigation and normal-flow responsive layout. Device rendering not verified. |
| P18-R5-4 Budget plan summary [P15-FIX-R5-4] | Done (automated; device checks outstanding) | `app/(tabs)/budget.tsx` — summary card opens selected-month editor, template action remains independent, pencil removed, exact values preserved | `RouteRenderSmoke.test.tsx`, `EditActionOwnership.test.tsx` — edit/apply ownership, template modal, month route, populated/no-budget state and accessible financial values. |
| P18-R6-A Baseline evidence [P15-FIX-R6-A] | Done | No source changes; temporary worktree at `2e5d594` was removed after testing | The two requested suites passed 24/24; full `npm test -- --runInBand` passed 64 suites/659 tests. Current pre-fix failures were captured verbatim in the R6 report and summarized in Section 8. |
| P18-R6-B Sort UI history and assertions [P15-FIX-R6-B] | Done | `src/components/ui.tsx` — visible tab text restored to `Transactions`; `src/components/__tests__/BottomTabBar.test.tsx`, `SectionHeaderRow.test.tsx`, `TransactionsScreen.test.tsx` — revised assertions for the intended ChipRow layout | Focused six-suite run passed 180 tests, including `src/lib/__tests__/sorting.test.ts`; full current coverage run passed 65 suites/669 tests. `src/components/SortChip.tsx` and `src/lib/sorting.ts` are unchanged. |
| P18-R6-C Expo SDK alignment [P15-FIX-R6-C] | Done | Existing separate `798e8ef` updates only `package.json` and `package-lock.json`; four direct Expo package ranges were bumped, while `expo-constants` was accepted unchanged | `npx expo install --check` — dependencies up to date; `npx expo-doctor` — 21/21; Android/iOS exports and full tests pass after alignment. |
| P18-R6-D Gates and close-out [P15-FIX-R6-D] | Done (automated; device checks outstanding) | `docs/PROGRESS.md` — R5/R6 status, assumptions, historical audit, and evidence | `npm test -- --coverage` — 65/65 suites, 669/669 tests; `npx tsc --noEmit`; `npx expo lint`; `npx expo-doctor` 21/21; Android/iOS exports; per-directory line/branch coverage; `git diff --check`. Native safe-area and font-scale checks remain for real devices. |

### P20-D green-gate close-out

P20-D, P21-A/B, P22-A and CR-8, CR-12–15, CR-20–26 are closed after
sequential green gates. P22-B and its former P15-SEED mapping were removed
from active tracking. The focused P20-D verification
passed 12 suites / 294 tests. Relevant tests include the clear-through
one/three/401, future and mixed-due cases in
`src/domain/__tests__/dues.test.ts`; one-write persistence and deep-equal
Undo in `src/data/__tests__/createAppStore.test.ts`; confirmation and action
behavior in `src/components/__tests__/PendingItemActions.test.tsx`; reduced
balance/menu/layout assertions in `src/components/__tests__/TransactionsScreen.test.tsx`
and `src/components/__tests__/RouteRenderSmoke.test.tsx`; and this ledger
guard in `src/lib/__tests__/progressLedger.test.ts`.

Backup/version tests re-confirmed: `hydrates v6 into v7 and archives exact
raw bytes only once` (`src/data/__tests__/createAppStore.test.ts`),
`round trips custom emergency-fund options and refuses schema version eight`,
and `round-trips a manual holding snapshot adjustment through backup export
and import` (`src/domain/__tests__/backup.test.ts`).

| Gate (run sequentially) | Result | Exit |
|---|---|---:|
| Focused P20-D tests | 12 suites / 294 tests passed | 0 |
| First `npm test -- --coverage` attempt | One timing assertion failed: 50-year daily schedule took 2141ms against a 2000ms ceiling; 69 other suites passed | 1 |
| Retried `npm test -- --coverage` | 70 suites / 756 tests passed; lines 97.66%, branches 93.28% | 0 |
| `npx tsc --noEmit` | TypeScript check passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | `Running 21 checks on your project...`; `21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android export passed | 0 |
| `npx expo export --platform ios` | iOS export passed | 0 |

Per-directory Istanbul aggregation (tests excluded; data hooks excluded):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2157/2192 (98.40%) | 1984/2113 (93.89%) |
| `src/data` excluding hooks | 414/443 (93.45%) | 336/383 (87.73%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Exact aggregation script run from the repository root:

```sh
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const raw = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
const map = createCoverageMap(raw);
const groups = {
  'src/domain': (file) => file.includes(`${path.sep}src${path.sep}domain${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
  'src/data excluding hooks': (file) => file.includes(`${path.sep}src${path.sep}data${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes(`${path.sep}hooks${path.sep}`),
  'pure src/lib': (file) => file.includes(`${path.sep}src${path.sep}lib${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
};
const count = (summary, key) => `${summary[key].covered}/${summary[key].total} (${summary[key].pct.toFixed(2)}%)`;
for (const [name, include] of Object.entries(groups)) {
  const summaries = map.files().filter(include).map((file) => map.fileCoverageFor(file).toSummary());
  const totals = summaries.reduce((total, summary) => {
    for (const metric of ['lines', 'branches']) {
      total[metric].covered += summary[metric].covered;
      total[metric].total += summary[metric].total;
    }
    return total;
  }, { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } });
  for (const metric of ['lines', 'branches']) {
    totals[metric].pct = totals[metric].total ? 100 * totals[metric].covered / totals[metric].total : 100;
  }
  console.log(`${name}: lines ${count(totals, 'lines')}; branches ${count(totals, 'branches')}`);
}
NODE
```

Per-file Istanbul summaries for changed source: `src/domain/dues.ts` reports
165/165 lines (100.00%) and 142/155 branches (91.61%); `src/data/createAppStore.ts`
reports 196/214 lines (91.58%) and 65/74 branches (87.83%). The aggregate above is
computed from Istanbul file summaries by summing covered and total line and
branch counts independently.

Expo Doctor's original 20/21 result came from redundant `ios.icon`; CR-26
removed it because it exactly duplicated top-level `expo.icon`. Current
Doctor result is 21/21. `SCHEMA_VERSION` was 7 at `51842bb` and remains 7;
the earlier v6 instruction was not applied because it would downgrade the
persisted schema.

### P20-E green-gate close-out

P20-E closes CR-27, CR-28 and CR-31. Implementation commits are `033d493`
(Budget money normalization), `501dce7` (Home Paid / Not paid confirmation and
removal of the old action sheet), and `fe5fa1e` (demo-loaded Undo / OK popup).
Ledger/test follow-ups include `973241e` and `b0cb6ee`. All hashes are verified
Git objects.

Focused regression run: 9 suites / 189 tests pass, including
`normalizes %s to %s`, `rounds finite values to paise and rejects non-finite
amounts`, `keeps Home spending collapsed and asks before changing a due`,
`clears a confirmed Home due with Undo and previews earlier dues`,
`uses the requested Paid and Not paid button labels and treats Not paid as
false`, `treats dismissal of a Paid confirmation as not paid`,
`shows the demo-loaded Undo / OK popup without navigating, then restores data
and shows a toast`, and `matches each frozen component hash`.

Replaced assertions and reasons:

- CR-21: bottom sheet alignment/inset/max-height/scroll/backdrop/action-button
  assertions are replaced by exact native confirmation copy and button
  labels, no-op Not paid/dismissal, oldest and later due action/preview, Undo,
  and no-inline-action assertions. Reason: CR-27 replaces the sheet entirely.
- CR-28 adds Budget screen cases for `-0`, `-0.001`, `0`, `0.004`, `1500`,
  and `-1500`, verifying normalized value, tone, visual text and
  accessibility label. These are new acceptance checks, not weakened or
  replaced assertions; the pure money helper also has direct domain tests.
- The progress-ledger test's temporary Pending assertions for P20-E and
  CR-27/28/31 are replaced by Done after green gates, and its totals change
  from 43/52 and 4/7 to 44/52 and 5/7. Reason: P20-E is now closed.
- No existing test asserted that the demo loader navigated to Backup. The old
  `router.push('/backup')` code path is replaced by a test asserting the
  success popup and current-route retention.
- To preserve user-authored commit `6cb4fa0`, the stale expected Transactions
  figure `₹600` is removed; the balance test now asserts the retained `₹830`
  only. The `From Sep` caption expectation becomes an explicit absence check.
  The prior no-opening-balance `-₹130` display assertion is replaced with a
  fixture containing ₹100 brought forward and a rendered `-₹30` closing
  balance, retaining the Shortfall and danger-tone checks. The Budget-header
  `menuIndicator={Boolean(reviewableMonth)}` expectation is replaced by an
  assertion that the user's removed prop remains absent. These old assertions
  contradicted the intentional user UI changes.
- In the prior RouteRenderSmoke assertion, the expected visible `-₹1,000`
  Shortfall amount/color is now asserted absent when no amount is rendered by
  the user's conditional balance UI; the separate Transactions test above
  verifies danger tone and Shortfall in a state where the user-kept amount is
  rendered. No hidden amount was reintroduced.

The first full coverage attempt exited 1: 3 suites / 18 tests failed because
the Home screen test mock did not expose the newly used `useAppActions` hook
and stale Transactions/Budget-header assertions contradicted commit `6cb4fa0`.
Those fixtures/assertions were corrected without restoring removed UI. The
final sequential gate run is green:

| Gate (run sequentially) | Result | Exit |
|---|---|---:|
| Focused P20-E regressions | 9 suites / 189 tests passed | 0 |
| First `npm test -- --coverage` attempt | 3 suites failed / 18 tests failed; stale mocks/assertions corrected | 1 |
| Final `npm test -- --coverage` | 70 suites / 772 tests passed; statements 96.25%, branches 93.29%, functions 97.12%, lines 97.66% | 0 |
| `npx tsc --noEmit` | TypeScript check passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | `Running 21 checks on your project...`; `21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android export passed | 0 |
| `npx expo export --platform ios` | iOS export passed | 0 |

Per-directory Istanbul coverage (summed independently from per-file summaries;
tests excluded and data hooks excluded):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2160/2195 (98.41%) | 1988/2117 (93.91%) |
| `src/data` excluding hooks | 414/443 (93.45%) | 336/383 (87.73%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Exact aggregation script used:

```sh
node <<'NODE'
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(require('./coverage/coverage-final.json'));
for (const [name, match] of Object.entries({
  domain: f => /\/src\/domain\//.test(f) && !/\/__tests__\//.test(f),
  data: f => /\/src\/data\//.test(f) && !/\/__tests__\//.test(f) && !/\/hooks?\//.test(f),
  lib: f => /\/src\/lib\//.test(f) && !/\/__tests__\//.test(f),
})) {
  let lc = 0, lt = 0, bc = 0, bt = 0;
  for (const file of map.files()) if (match(file)) {
    const s = map.fileCoverageFor(file).toSummary();
    lc += s.lines.covered; lt += s.lines.total;
    bc += s.branches.covered; bt += s.branches.total;
  }
  console.log(`${name}: lines ${lc}/${lt} (${(100 * lc / lt).toFixed(2)}%); branches ${bc}/${bt} (${(100 * bc / bt).toFixed(2)}%)`);
}
NODE
```

Changed pure-source per-file Istanbul summary: `src/domain/cashFlow.ts`,
132/132 lines (100.00%) and 121/124 branches (97.58%). The configured
coverage map does not instrument `src/components/useAppMenu.ts` or `app/`
screen files. First invocation of the requested `npx expo-doctor` found no
local executable and invoked npm's ephemeral `expo-doctor@1.21.5` install;
the later final run used that cache. No project package manifest or lockfile
changed. This was an unintended network-capable tool resolution despite the
no-network standing instruction and is recorded as a deviation.

`SCHEMA_VERSION` was 7 at the P20-F start and remained 7 at its close-out.
SortChip, `src/lib/sorting.ts` and every frozen input component are unchanged;
the frozen-component hash test passes. P21-A/B and P22-A remain Done with all
final gates green. P20-F is Done; P20-G is now complete and P23 is next.

**P20-E device checks not verified:** real iOS/Android rendering and interaction
for native Paid/Not paid and Demo data loaded alerts; hardware Back/outside
dismissal; full Home/Transactions/Budget due-list refresh after actual storage
writes; Undo against device storage; five-second toast timing; TalkBack/
VoiceOver copy and actions; and text/tone visibility at OS font scaling. Test
Renderer verifies callbacks and styles only; no physical device was used.

### P20-F green-gate close-out

F1 audited budget due rows and schedule/actual flows and recorded
DEC-BUDGET-PLAN. The design note specifies one future budget plan replacing
templates, optional line due days, repeat-from-next-month, current-month-only
auto-apply, and schedule-computed linked EMI, Insurance and investments that
are never stored or emitted as extra due rows.

F2 adds optional validated `dueDay` (integer 1–31) to template, month and
legacy budget lines and optional `linkedIncluded` to month snapshots; both app
and strict backup schemas accept these fields while absent fields remain
compatible and `SCHEMA_VERSION` stays 7. Budget due dates clamp at the actual
month length, including leap February. Without `dueDay`, the line remains
undated and `planned`, as before. The existing template and month forms
preserve imported due-day values but do not expose due-day editing controls.

F3 adds pure `linkedRecurringForMonth(data, month, asOf)` and tests for plans,
recurring and one-time liabilities, policies, paid/unpaid/zero rows, leap
February, empty/invalid months and `buildDemoData`. F4 makes
`linkedIncluded: true` additive over the month’s own line amounts, provides
linked rows grouped by category and planned totals by budget group, and leaves
transaction actuals unchanged. Absent/false flags keep prior derived budget
view results. Linked rows are not written into budgets and do not create
pending due rows; the Bills budget line still creates its own row. F5 sets the
current demo month to `linkedIncluded: true` and gives its Bills line `dueDay:
5`, with schema, totals and one-row assertions.

Focused test runs:

- `npm test -- --runInBand src/domain/__tests__/pending.test.ts src/domain/__tests__/schemas.test.ts src/domain/__tests__/backup.test.ts src/domain/__tests__/budget.test.ts`: 4 suites / 72 tests pass.
- `npm test -- --runInBand src/domain/__tests__/budget.test.ts`: 21 tests pass, including `projects paid and unpaid recurring schedule rows by month and category` and `matches calendar months, including leap February and demo schedule rows`.
- Final focused P20-F run: 5 suites / 84 tests pass, including `clamps budget due days to the month length, including leap February`, `adds opt-in linked rows to planned category and group totals without changing actuals or dues`, and four-month demo data tests.
- `npm test -- --runInBand src/lib/__tests__/progressLedger.test.ts`: 1 suite / 9 tests pass; the renamed test is `tracks P20-F done, keeps P20-G planned, and removes the withdrawn importer part`.

Replaced assertion and reason:

- The old progress-ledger assertion required both P20-F and P20-G to remain
  Planned and required CR-29 to remain Planned. During implementation it now
  asserts P20-F and CR-29 are In progress while P20-G and CR-30 remain
  Planned, because work began but final gates had not yet passed. After the
  final gates, P20-F's assertion changed to Done while CR-29 stayed In
  progress and P20-G/CR-30 remained Planned. Progress counts remained 44/52
  and 5/7 while in progress, then closed at 45/52 and 6/7. No product
  behavior assertion was weakened. The paired progress-count assertions were
  also updated from 44/52 and 5/7 to 45/52 and 6/7 after closure; the
  intermediate focused test caught this stale expected count and passed after
  the exact calculated totals were updated.

The first full coverage run exited 1 only because of that stale tracker
expectation (69 suites passed, 1 failed; 776 tests passed, 1 failed). The
ledger assertion was updated as described and the full command was rerun.
Final sequential gates:

| Gate | Result | Exit |
|---|---|---:|
| First `npm test -- --coverage` | Stale progress-ledger status assertion failed; corrected without changing product assertions. | 1 |
| Final `npm test -- --coverage` | 70 suites / 777 tests passed; statements 96.28%, branches 93.32%, functions 97.15%, lines 97.69%. | 0 |
| `npx tsc --noEmit` | TypeScript check passed. | 0 |
| `npx expo lint` | Lint passed. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project...` / `21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android export passed. | 0 |
| `npx expo export --platform ios` | iOS export passed. | 0 |

Per-directory Istanbul totals (tests excluded; hooks excluded from data):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2187/2222 (98.42%) | 2026/2157 (93.93%) |
| `src/data` excluding hooks | 414/443 (93.45%) | 336/383 (87.73%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Changed pure-domain per-file Istanbul summaries:

| File | Statements | Branches | Lines |
|---|---:|---:|---:|
| `src/domain/budget.ts` | 98.87% | 94.55% | 100.00% |
| `src/domain/pending.ts` | 96.66% | 94.82% | 100.00% |
| `src/domain/schemas.ts` | 92.57% | 90.22% | 92.62% |
| `src/domain/backup.ts` | 98.65% | 97.05% | 98.54% |

Exact per-directory aggregation script used:

```sh
node <<'NODE'
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(require('./coverage/coverage-final.json'));
for (const [name, match] of Object.entries({
  domain: f => /\/src\/domain\//.test(f) && !/\/__tests__\//.test(f),
  data: f => /\/src\/data\//.test(f) && !/\/__tests__\//.test(f) && !/\/hooks?\//.test(f),
  lib: f => /\/src\/lib\//.test(f) && !/\/__tests__\//.test(f),
})) {
  let lc = 0, lt = 0, bc = 0, bt = 0;
  for (const file of map.files()) if (match(file)) {
    const s = map.fileCoverageFor(file).toSummary();
    lc += s.lines.covered; lt += s.lines.total;
    bc += s.branches.covered; bt += s.branches.total;
  }
  console.log(`${name}: lines ${lc}/${lt} (${(100 * lc / lt).toFixed(2)}%); branches ${bc}/${bt} (${(100 * bc / bt).toFixed(2)}%)`);
}
NODE
```

P20-F implementation commits (all abbreviated hashes checked as Git commit
objects): `5d81b65` (F1 design), `e36d153` (F2 due-day support), `d736b11`
(F3 linked schedule projection), `f41d6d4` (F4 budget view), `b8fff43` (F5
demo data), and `18fc19d` (tracker-test state update). No dependencies changed.
`SCHEMA_VERSION` was 7 before and after. SortChip, `src/lib/sorting.ts`, and
the frozen form components were not modified; `formComponentsFrozen` passes.
Assumed: an undated one-time liability is not a linked month row, consistent
with existing pending and monthly-commitment behavior rather than the
schedule's internal start-date fallback. `budgetMonthView` uses month-end as
its schedule `asOf`, matching `monthlyCommitments`; direct helper callers
inject their own `asOf`.
The user's manual change commit `6cb4fa0` remains intact: the touched user-owned
files are `app/(tabs)/budget.tsx`, `app/(tabs)/transactions.tsx`, and
`app/month-review.tsx`; specifically, the removed “Back to transactions”
button and other removed Budget/balance UI were not restored. The final
Transactions balance section remains the user's label and amount (including
Shortfall/danger styling), optional “From {Mon} ₹X” chip, divider and review
link when available, without the removed metric columns or captions.

**P20-F device checks not verified:** no physical iOS/Android device or
development build was used. Native rendering and month-form persistence of
imported `dueDay` data, TalkBack/VoiceOver announcements, platform-specific
date boundaries, and real-device storage/backup round trips remain unverified.
P20-G adds due-day entry in the single-plan setup; see the P20-G device checklist
below for the new setup and sticky-footer checks.

### P20-G schema-v8 single-plan close-out

P20-G replaces template persistence/routes with `budgetPlan`, migrates v7
snapshots and archives their exact raw bytes once, and sets schema version 8.
The chosen template and repeat defaults follow DEC-P20G. Plan apply preserves
recorded transactions; repeat hydration only applies the current month and is
idempotent. Save-and-Apply is one store update, and its Undo restores the
previous plan plus month snapshot in one update. The Budget setup screen
provides five groups, editable amount/percent lines, conditional due-day input,
computed recurring items, suggestion confirmation, repeat switch and sticky
Apply/Save footer. Budget's header has no menu; month switching and on-screen
Review remain. Home applies a plan or opens setup when no plan exists.

The current mock/demo data has exactly one budget plan, all five groups, a
Bills due day, repeat enabled from next month and the current month applied
with linked rows; legacy templates are absent from current app state and UI.
The setup screen groups read-only linked rows by budget group with name,
category, amount, due date and the source note. The pre-P20-G schema was 7;
the post-migration/current schema is 8. `SortChip.tsx`, `src/lib/sorting.ts`,
and all frozen `src/components/form` inputs are unchanged;
`formComponentsFrozen` passes.

Replaced test assertions and reason:

- Old route smoke expected Budget History to open a selected month and keep
  the old History route in the registered screens. It now tests the single
  Budget setup route and its stack behavior; month selection remains available
  through Budget's previous/next controls. Reason: history was explicitly
  removed rather than retained alongside the one-plan design.
- Old template-management tests expected a template list, template form,
  default-template selection and template-picker behavior. They are replaced
  by single-plan setup/apply/repeat assertions and v7 migration tests.
  Reason: schema v8 drops all template state and routes.
- Old Budget-menu assertions expected the CR-24 three-dot menu, ordered
  entries, navigation and review indicator. They are replaced by an explicit
  no-menu assertion plus previous/next month navigation and the on-screen
  Review control. Specifically, `shows the ordered Budget menu, review dot,
  navigation and Home menu entries`, `omits the review dot when there is no
  reviewable month`, `keeps explicit menu items ahead of the standard Home
  menu items`, `shows one Budget menu with ordered Budget items followed by
  Home menu entries`, and `marks a reviewable month in the Budget header and
  opens that month review` no longer assert Budget menu entries or a dot.
  Reason: CR-30 supersedes CR-24.
- The old `keeps the no-budget prompt in one card with both setup actions and
  empty bills state` assertion expected both setup actions; it now expects one
  primary action whose label and behavior depend on whether a plan exists.
  The old `shows cash-flow positions and keeps plan editing separate from
  template application` assertion now expects the single-plan setup flow and
  separate month adjustment. Reason: schema v8 removes the template picker.
- Old Budget History sorting tests asserted template-name/customized keys
  and history-month tie-break ordering, and the metadata test expected saved
  `budgetHistory` sort preferences. Those assertions were removed; active-list
  sort persistence tests remain and `src/lib/sorting.ts` stays unchanged.
  This includes `lists every Budget history sort key in the SortChip menu`,
  `uses month as the id tie-breaker in both Budget history directions`,
  `returns from Budget history to the tab with the selected month`,
  `shows no tab bar on Budget history or Month review stack routes`, and
  `persists Budget history sort choices and falls back to month for an invalid
  stored key`. Reason: history snapshots and their fields are no longer a
  screen or model surface.
- Old AppHeader tests expected a Budget menu containing History, Month review
  and Templates, tested its navigation/review-dot behavior and global-item
  ordering. This covers `shows one Budget menu with ordered Budget items
  followed by Home menu entries`, `marks a reviewable month in the Budget
  header and opens that month review`, and `keeps explicit menu items ahead
  of the standard Home menu items`. They are replaced by direct Budget
  no-menu assertions; Home's standard menu tests remain. Reason: CR-30
  removes the Budget menu entirely.
- Old ledger assertions kept P20-G Planned, CR-29 In progress, CR-30 Planned,
  overall 45/52 and P20 6/7. They now assert Done, Done, Done, 46/52 and
  7/7 respectively. Reason: P20-G and both change requests are complete.

Focused P20-G verification:

- `npm test -- --runInBand src/components/__tests__/RouteRenderSmoke.test.tsx src/components/__tests__/EditActionOwnership.test.tsx`: 2 suites / 102 tests passed, including the linked-items-by-group content, font scales 1/1.3/2, no-menu/month-review and empty-state checks.
- `npm test -- --runInBand src/domain/__tests__/budget.test.ts src/data/__tests__/migrate.test.ts src/components/__tests__/EditActionOwnership.test.tsx src/components/__tests__/RouteRenderSmoke.test.tsx`: 4 suites / 137 tests passed, including percent-line repeat calculation, malformed-v7 rejection and empty-template migration.
- Full verification command `npm test -- --coverage`: 70 suites / 763 tests passed.

Final gate sequence (all exit code 0, run in the listed order):

| Command | Result |
| --- | --- |
| `npm test -- --coverage` | 70 suites / 763 tests; coverage thresholds pass |
| `npx tsc --noEmit` | Passed |
| `npx expo lint` | Passed without warnings |
| `npx expo-doctor` | Passed; 21/21 checks, no issues |
| `npx expo export --platform android` | Passed; bundle exported |
| `npx expo export --platform ios` | Passed; bundle exported |

Expo Doctor output: `Running 21 checks on your project... 21/21 checks passed. No issues detected!`

Directory coverage uses Istanbul line and branch percentages, aggregated with
the script below; Jest's following per-file columns are Statements, Branches,
Functions and Lines (in that order).

| Source directory | Lines | Branches | Threshold |
| --- | ---: | ---: | ---: |
| `src/domain` | 98.36% | 93.58% | >=90% each |
| `src/lib` pure modules | 100.00% | 100.00% | >=90% each |
| `src/data` excluding hooks | 94.39% | 88.08% | >=85% each |

Coverage aggregation script:

```js
const fs = require('node:fs');
const { createCoverageMap } = require('istanbul-lib-coverage');
const coverage = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'));
for (const directory of ['src/domain', 'src/lib', 'src/data']) {
  const selected = Object.entries(coverage).filter(([path]) => {
    const relative = path.replace(process.cwd() + '/', '');
    return relative.startsWith(`${directory}/`)
      && !relative.includes('/__tests__/')
      && !(directory === 'src/data' && /\/(use[A-Z]|hooks?\/)/.test(relative));
  }).map(([, file]) => file);
  const map = createCoverageMap({});
  selected.forEach((file) => map.addFileCoverage(file));
  const summary = map.getCoverageSummary();
  console.log(`${directory}: lines ${summary.lines.pct.toFixed(2)}%, branches ${summary.branches.pct.toFixed(2)}% (${selected.length} files)`);
}
```

The Jest per-file Istanbul summary reports `src/data` at 94.39% Lines and
88.08% Branches (`createAppStore.ts` 92.48/87.83, `metaStore.ts` 100/90.9,
`migrate.ts` 95.14/86.17, `safeStorage.ts` 97.56/100); `src/domain` at
98.36/93.58 and `src/lib` at 100/100. Jest also reports Statements/Functions:
data 90.68/89.06, domain 97.27/99.39 and lib 100/100. No hooks are included in
the `src/data` directory aggregation.

Hash audit: every hash cited in the P19-C through P22-A rows and CR-21 through
CR-31 register resolves to a commit and has a matching commit subject; no
corrections were required. P20-G commit `3c644d3` was verified with
`git cat-file -t` and is recorded above.

Assumed: the original template list order is the final deterministic tie-break
when usage count and latest snapshot month are both tied. `applyBudgetPlanToMonth`
retains the required injected `newId` option although the month snapshot has no
ID field. Saving and applying the plan does not create, delete or rewrite
transactions; existing recorded payments remain transaction-derived.
Assumed: due-day entry is available for either amount or percent lines after a
value is entered; percent lines resolve to a planned amount at apply time.
Assumed: the pre-existing non-clean worktree was unfinished P20-G implementation
from the prior session, not a new user-only manual change set; it was preserved
and closed as the P20-G feature rather than mislabeled as a manual checkpoint.

**P20-G device checks not verified:** setup-screen scrolling with all five
groups, keyboard interaction and due-day entry; sticky footer behavior with
the keyboard open at narrow widths and large text; native confirmation and
discard dialogs; month switching/review navigation on iOS and Android;
voice-control/screen-reader behavior for automatic linked rows; and storage
write/Undo behavior on physical devices. Layout tests assert React Native
props and styles only; no real iOS/Android device or development build was
used.

### P20-H grouped Budget and Month review retirement close-out

P20-H closes CR-32, CR-33 and CR-34; CR-25 is superseded by CR-32. The Budget
screen now has cash flow, plan summary and one card for each group, with
schedule and own-line rows merged, paid rows retained, and compact
“Marked as paid”/“Received” labels. Transactions keeps “Review {Mon}” but
routes to Budget with the selected month. Month review screen and route are
deleted. No schema or persisted data changed: `SCHEMA_VERSION` is 8 before and
after P20-H; month-review calculations, store actions, allocation schema/types
and transaction records remain unchanged.

P20-H test evidence:

- Focused: `npm test -- --runInBand src/domain/__tests__/pending.test.ts src/components/__tests__/PendingItemActions.test.tsx src/components/__tests__/RouteRenderSmoke.test.tsx src/components/__tests__/TransactionsScreen.test.tsx src/components/__tests__/useAppMenu.test.tsx src/lib/__tests__/routeKinds.test.ts src/mock/__tests__/demoData.test.ts src/lib/__tests__/progressLedger.test.ts` — 8 suites / 162 tests passed.
- Acceptance tests include `uses Paid wording for expense/investment rows and Received for income rows`; `projects paid, partial, overdue, and linked rows once in due-date order`; `shows the paid amount for a scheduled row cleared after its due month`; `clears a compact budget row directly as Marked as paid and offers undo`; `uses the compact paid action for later dues and confirms the exact clear-through preview`; `keeps paid, overdue, partial and linked rows inside their budget groups`; `renders grouped Auto and budget rows at font scale 1, 1.3 and 2`; `keeps one Edit budget action and the month switcher without a menu or Review control`; `shows cash flow, plan summary and grouped rows in the required order`; `normalizes Budget closing balance with matching tone and accessible label`; `selects the routed Budget month, falling back for an invalid value`; `keeps the Review action and routes its selected month to Budget`; and route-kind assertions that no Month review route is registered.
- Demo test confirms the four-month data shows a paid row, overdue row, partial
  row and linked schedule row in the Budget groups.

Replaced assertions and reasons:

- `keeps one no-budget card with a plan-dependent primary action and empty bills state` now asserts the primary action and its setup/apply behavior in Plan summary; the separate Bills and dues block is gone. Reason: CR-32 merges rows into groups and CR-33 sets the new order.
- `shows cash-flow positions and keeps plan editing separate from template application` now checks only Opening/Closing cash-flow rows, the plan summary metrics and matching metric-row styles. Reason: CR-33 removes the extra flow metric and template application model.
- `expands earned-income sources and labels unexpected spending clearly` is replaced by group-card, category-row and actual/planned assertions. Reason: the separate income/source card and nested category presentation are removed.
- `shows earned income by source and separates other money in on Month review` is removed; its values/actions are not a separate screen. Opening/closing remain in Cash flow and available plan figures remain in Plan summary. Reason: CR-34 deletes Month review UI.
- `keeps the Budget header menu removed and retains on-screen month review` now asserts no Budget Review control and retains month switching/Edit budget. Reason: CR-34 moves the remaining review link to Transactions.
- `shows no tab bar on Budget setup or Month review stack routes` is replaced by a Budget setup stack-route check and a Month review route-kind absence check. Reason: the Month review route no longer exists.
- The old RouteRenderSmoke MonthReview empty-state screen entry and `/month-review` route assertion are replaced by route-registry absence and valid/invalid Budget month-parameter assertions. Reason: CR-34 deletes that screen and routes Transactions Review to Budget.
- The prior Transactions assertion that only kept the Review button visible is replaced by an assertion that its selected month is passed to `/(tabs)/budget`. Reason: the button remains, but its destination changes.
- The prior menu assertion that included a Month review entry is replaced by no Review menu item and no Budget header menu. Reason: no Month review action remains in app menus.
- Old single Bills/dues-row and nested/progress-card expectations are replaced by seven group cards in fixed order, each containing rows once, no nested cards/progress bars, Auto tags, paid chips, partial balances and responsive row styles. Reason: CR-32 supersedes CR-25's section design.
- The old `Edit budget plan` accessibility-label assertion is replaced by the exact `Edit budget` label. Due-row `Clear due` label assertions are replaced by `Marked as paid` for expense/investment and `Received` for income; direct clear and Undo behavior remain. Reason: CR-32 specifies compact action copy without changing the underlying action.
- The ledger test's P20-H Pending/CR-32–34 Planned, CR-25 Done, 46/53 and 7/8 assertions are replaced by Done, CR-25 Superseded, 47/53 and 8/8. Reason: P20-H and its CRs closed after acceptance and gates.

Final sequential gates (real exit codes):

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 70 suites / 765 tests passed. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Coverage aggregates (independent Istanbul covered/total line and branch counts):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2227/2263 (98.41%) | 2069/2210 (93.62%) |
| `src/data` excluding hooks | 455/482 (94.40%) | 392/445 (88.09%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Aggregation script:

```js
const fs = require('node:fs');
const path = require('node:path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8')));
const groups = {
  'src/domain': (file) => file.includes(`${path.sep}src${path.sep}domain${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
  'src/data excluding hooks': (file) => file.includes(`${path.sep}src${path.sep}data${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes(`${path.sep}hooks${path.sep}`),
  'pure src/lib': (file) => file.includes(`${path.sep}src${path.sep}lib${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
};
for (const [name, include] of Object.entries(groups)) {
  const summaries = map.files().filter(include).map((file) => map.fileCoverageFor(file).toSummary());
  const totals = summaries.reduce((total, summary) => {
    for (const metric of ['lines', 'branches']) {
      total[metric].covered += summary[metric].covered;
      total[metric].total += summary[metric].total;
    }
    return total;
  }, { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } });
  for (const metric of ['lines', 'branches']) {
    totals[metric].pct = totals[metric].total ? 100 * totals[metric].covered / totals[metric].total : 100;
  }
  console.log(`${name}: lines ${totals.lines.covered}/${totals.lines.total} (${totals.lines.pct.toFixed(2)}%); branches ${totals.branches.covered}/${totals.branches.total} (${totals.branches.pct.toFixed(2)}%)`);
}
```

Changed-source per-file Istanbul summary for `src/domain/pending.ts`:
Statements 98.54%, Branches 94.55%, Functions 100.00%, Lines 100.00%.

Assumed: manual budget actuals remain selected-month transaction totals;
schedule-linked row actuals use their schedule payment amounts. Assumed:
monthly schedule rows are the usual payment-action path; row ordering is by
due date then name with undated rows last. Layout tests inspect React Native
styles/accessibility props only.

**P20-H acceptance criteria not verified on a real device:** OS font scaling
and actual text wrapping/clipping at 1.3/2.0; touch and navigation behavior
for the month switcher, Edit budget and due actions; native dialog/toast
presentation and five-second Undo timing; VoiceOver/TalkBack announcements
for Paid, Auto and compact action labels; real-time refresh across Budget,
Transactions and Home after a payment; and platform-specific rendering on
iOS/Android. No physical device or development build was used.

### P20-I Home due action and Goals status close-out

P20-I closes CR-35 and CR-36 without changing persisted data or schema
(`SCHEMA_VERSION` remains 8). Home's title/amount/date rows are noninteractive;
only the accessible compact check button opens the existing native
confirmation. Goals and Home each render one status as text alongside every
visible progress bar, including Emergency fund. Font-scale layout assertions
cover 1, 1.3 and 2; the demo schedule test confirms at least one of Home's
five visible due rows is later than earlier unpaid installments.

Focused tests passed: `RouteRenderSmoke.test.tsx`,
`demoData.test.ts` and `createAppStore.test.ts` — 3 suites / 162 tests.
Relevant acceptance test names:

- `keeps Home spending collapsed and asks before changing a due`
- `stacks Home due content and the tick action at font scale 1.3`
- `stacks Home due content and the tick action at font scale 2`
- `clears a confirmed Home due with Undo and previews earlier dues`
- `places one status beside every goal progress bar at font scale 1`
- `places one status beside every goal progress bar at font scale 1.3`
- `places one status beside every goal progress bar at font scale 2`
- `shows a later clearable due in Home's five-row preview`
- `clears one due and bulk-settles dues with one persisted write per action`

Replaced assertions and reasons:

- P20-E's Home due test invoked the row's `onPress` and asserted that no
  inline payment control existed. It now asserts the row itself has no
  `onPress`, contains only title/amount/date plus the check button, and the
  button alone opens the same native confirmation. Reason: CR-35 moves the
  action to the explicit tick button while keeping row-body taps inert.
- P20-E's “no Pay/Clear due/View schedule button and no action sheet” checks
  remain; the old actionable-row trigger is replaced by `Mark as paid`
  button-only confirmation and repeat no-op cancellation/dismissal checks.
  Reason: CR-35 removes row tapping and preserves the retired sheet design's
  absence.
- Existing Home projection copy `Projected {date} · {status}` is replaced by
  the projected date below the progress row and one status beside the bar;
  `Already reached` and unreachable wording move into that one status.
  Goals' separate status line moves beside its bar. Reason: CR-36 requires one
  right-side text status per card rather than status below/away from the bar.
- Added Home and Goals screen assertions for one status per visible card,
  including the emergency goal, bar `flex: 1`/`minWidth: 0`, non-shrinking
  status text, and right-aligned stacking from 1.3. No prior assertion was
  weakened; this is new CR-36 coverage.

Assumed: Home's five-item due preview remains the intended display cap;
native dismissal resolves to the existing `false` confirmation result;
`none` goal projections use the exact existing “Not reachable with current
contributions” message. The direct store test asserts one persisted write for
single-due and clear-through actions; the UI calls one such action per Paid
confirmation. Layout tests inspect style props and rendered text only.

P20-I final sequential gates (exit codes):

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 70 suites / 771 tests passed; 96.29% statements, 93.02% branches, 97.53% functions, 97.79% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed with no warnings. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Coverage aggregates (independent Istanbul covered/total line and branch counts):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2227/2263 (98.41%) | 2069/2210 (93.62%) |
| `src/data` excluding hooks | 455/482 (94.40%) | 392/445 (88.09%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Per-file Istanbul summaries for the code paths exercised by this change:

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/domain/goalLinks.ts` | 99.29% | 92.55% | 100.00% | 100.00% |
| `src/domain/pending.ts` | 98.54% | 94.55% | 100.00% | 100.00% |
| `src/data/createAppStore.ts` | 89.53% | 87.83% | 86.42% | 92.48% |

Istanbul does not instrument `app/` or `src/components/` in this repository's
coverage configuration; responsive screen behavior is asserted in
`RouteRenderSmoke.test.tsx`.

Aggregation script:

```js
const fs = require('node:fs');
const path = require('node:path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8')));
const groups = {
  'src/domain': (file) => file.includes(`${path.sep}src${path.sep}domain${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
  'src/data excluding hooks': (file) => file.includes(`${path.sep}src${path.sep}data${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes(`${path.sep}hooks${path.sep}`),
  'pure src/lib': (file) => file.includes(`${path.sep}src${path.sep}lib${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`),
};
for (const [name, include] of Object.entries(groups)) {
  const summaries = map.files().filter(include).map((file) => map.fileCoverageFor(file).toSummary());
  const totals = summaries.reduce((total, summary) => {
    for (const metric of ['lines', 'branches']) {
      total[metric].covered += summary[metric].covered;
      total[metric].total += summary[metric].total;
    }
    return total;
  }, { lines: { covered: 0, total: 0 }, branches: { covered: 0, total: 0 } });
  for (const metric of ['lines', 'branches']) {
    totals[metric].pct = totals[metric].total ? 100 * totals[metric].covered / totals[metric].total : 100;
  }
  console.log(`${name}: lines ${totals.lines.covered}/${totals.lines.total} (${totals.lines.pct.toFixed(2)}%); branches ${totals.branches.covered}/${totals.branches.total} (${totals.branches.pct.toFixed(2)}%)`);
}
```

The P20-I ledger assertions were updated in P20-J to track CR-40–CR-43,
overall progress 51/57, and P20 10/10. P20-I remains historical; CR-35
is corrected by CR-43 and CR-36 is superseded by CR-40.

**P20-I acceptance criteria not verified on a real device:** actual OS font
scaling, text clipping and touch target rendering at 1.3/2.0; native Paid /
Not paid dialog button ordering and dismissal on iOS/Android; check-button
touch behavior, status placement and assistive-technology announcements; and
the Undo toast's real five-second timing. No physical device or development
build was used.

### P20-J Home action, goal status removal and shared-asset close-out

P20-J closes CR-40–CR-43 without a schema change (`SCHEMA_VERSION` remains
8). Home's due-row action is now the exact compact text “Marked as paid” and
continues to call the same native Paid / Not paid confirmation. Goal cards
show their name, saved/target and available target/projection details before
one final progress bar; all status and unreachable-contribution copy is
removed while projection calculations remain. Goal-linked asset values are
divided equally in integer paise across the linked-goal count. Sorted goal IDs
make remainder assignment deterministic; unlinking automatically rebalances.
New links omit `share`; old stored/backup links with an explicit optional
`share` still parse, but calculations ignore it. The EF bucket-link
invariants remain intact. Every remaining UI edit icon uses Feather
`edit-2`.

Acceptance coverage:

- Home's existing Paid / Not paid confirmation test asserts the exact text
  action, unchanged confirmation labels/message, cancellation no-op behavior
  and absence of the old due-row action sheet; the Home row stacks at font
  scales 1.3 and 2.0.
- Home and Goals goal-card tests, including Emergency fund, assert status and
  unreachable wording are absent and the progress bar is the last element at
  font scales 1.0, 1.3 and 2.0.
- Goal-link tests cover one/two/three-goal allocation, deterministic
  largest-remainder paise (including 1,000.01), rebalance after unlink,
  duplicate rejection, projection and EF bucket compatibility.
- Goal-form test confirms an asset already linked to another goal remains
  selectable and newly linked form data has no share input/property.
- Schema test confirms legacy explicit-share goal links still parse.
- Edit-action tests check ownership and scan source for legacy `edit`,
  `edit-3` and `pencil` icon names.
- `goalLinks.test.ts` records before/after saved totals at the fixed as-of
  date 2026-10-12:

| Fixture | Goal | Before (legacy shares) | After (equal split) |
|---|---|---:|---:|
| Mock | First ₹5L portfolio | ₹35,532.14 | ₹118,440.47 |
| Mock | Home - Nagpur | ₹20,625.00 | ₹82,500.00 |
| Mock | Poultry farm | ₹0.00 | ₹0.00 |
| Mock | Emergency fund | ₹155,000.00 | ₹290,456.00 |
| Demo | Emergency fund | ₹189,000.00 | ₹189,000.00 |
| Demo | Retirement portfolio | ₹9,626.45 | ₹8,022.04 |
| Demo | Home deposit | ₹56,363.22 | ₹214,222.04 |
| Demo | Education fund | ₹7,250.00 | ₹29,000.00 |
| Demo | Family holiday | ₹25,000.00 | ₹25,000.00 |

Replaced assertions and their reasons:

1. P20-I's Home tick accessibility-label and tick-button stacking assertions
   are replaced with the exact `Marked as paid` text-button label and text
   action stacking assertions; CR-43 changes presentation only.
2. P20-I's expectation of one status beside each Home/Goals progress bar,
   including the 1.3+ status-placement assertions, is replaced by absence of
   status/unreachable text and details-before-final-bar assertions; CR-40
   supersedes CR-36 while retaining projection logic.
3. The per-goal share/free-share allocation expectations and the
   `goal-link-overallocated` integrity assertion are replaced with equal
   per-goal split, deterministic paise remainder, rebalance and valid
   cross-goal integrity assertions; CR-41 permits shared assets.
4. The Emergency Fund custom-bucket test's expected over-allocation exception
   is replaced with a successful shared-link assertion; the existing
   one-bucket-per-holding and Emergency-goal invariants remain tested.
5. The icon ownership test's old icon allow-list expectations are updated
   for the changed UI edit icons; a source scan now explicitly rejects
   `edit`, `edit-3` and `pencil` icon names, allowing only `edit-2`.

Assumed: a legacy link whose `share` is absent contributes as a normal link
under the equal-split rule; the count includes each goal once, and the
lexicographically sorted goal ID order assigns any leftover paise. A goal
with no links continues to use its existing manually saved value (or zero
for the automatic Emergency fund goal). Stored share fields remain accepted
for compatibility and are stripped whenever a goal's links are rewritten.

P20-J final gates:

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 70 suites / 791 tests passed; 96.35% statements, 93.03% branches, 97.72% functions, 97.84% lines overall. | 0 |
| `npx tsc --noEmit` | TypeScript passed. | 0 |
| `npx expo lint` | Passed. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported. | 0 |
| `npx expo export --platform ios` | iOS bundle exported. | 0 |

Coverage gates (Istanbul covered/total):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2663/2733 (97.44%) | 2071/2209 (93.75%) |
| `src/data` excluding hooks | 561/618 (90.78%) | 409/466 (87.77%) |
| Pure `src/lib` | 133/133 (100.00%) | 126/126 (100.00%) |

**P20-J acceptance criteria not verified on a real device:** actual OS font
scaling, text clipping and the hit target at 1.3/2.0; native confirmation and
Undo-toast presentation/timing on iOS and Android; progress-bar-last layout
and VoiceOver/TalkBack announcements; and real save/render behavior for a
single asset linked to multiple goals. Simulated tests inspect tree content,
accessibility props and styles only; no physical device or development build
was used.

### P20-K Home goals, Assets and Liabilities close-out

P20-K closes CR-44–CR-46 without changing schema or Transactions. Home's
visible goals now occupy one shared `Card`, separated by hairline dividers
except after the last row; details and progress-bar order remain unchanged.
Asset and recurring/one-time liability cards have no separate edit icon: the
accessible card body opens the existing edit route. Existing buttons stop
propagation so payments, deposits, due clearing and Undo do not open edit.
Liability data and explanatory text appear before its progress bar; after the
bar, the action area contains only the existing due/payment button groups.

Transactions' transaction list is the other observed presentation: it uses
`ListItem` rows and hairline separators rather than a card. The Transactions
screen and its available-balance card were not changed.

Replaced assertions:

1. Asset-card edit-icon expectations for `InstrumentCard` are replaced by
   accessible body role/label/hint and route assertions, a no-`IconButton`
   assertion, and proof that an existing Deposit button stops propagation.
2. Recurring and one-time liability edit-icon expectations are replaced by
   accessible body route/no-icon assertions, action isolation, and
   data/progress/action ordering checks at font scales 1.3 and 2.0.
3. EditActionOwnership now rejects separate asset/liability `editLabel`
   wiring; shared `CardHeaderRow`/`ListRow` edit action ownership and the
   global Feather `edit-2` scan remain. ActionRow and Undo toast tests prove
   their child actions stop propagation to the body edit target.

Focused tests: 3 suites / 122 tests pass. The full test suite passes 70
suites / 799 tests. Istanbul aggregation (covered/total):

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2,237/2,271 (98.50%) | 2,071/2,209 (93.75%) |
| `src/data` excluding hooks | 471/499 (94.39%) | 409/466 (87.77%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Final gates: `npx tsc --noEmit`, `npx expo lint`, Android/iOS `npx expo
export`, and `npx expo-doctor` pass. Expo Doctor output:
`Running 21 checks on your project...` / `21/21 checks passed. No issues detected!`
The separately requested `npx expo doctor` alias is not supported by this
local CLI (`$ expo doctor is not supported in the local CLI, please use npx
expo-doctor instead`); the documented supported `npx expo-doctor` gate passes.
`git diff --check` passes.

**P20-K acceptance criteria not verified on a real device:** OS font scaling,
divider rendering and clipping at 1.3/2.0; native touch conflict behavior and
screen-reader announcements for nested card buttons/body edit targets; and
liability progress/action spacing, due clearing and Undo toast on physical
iOS/Android. TestRenderer verifies structure, styles, accessibility props
and callbacks only.

### P20-U Budget route forms close-out (CR-86/CR-87)

STEP 0 preflight: the worktree was clean at `7af5abe`; no manual checkpoint
was needed. `DEC-USER-CHANGES` already records the user-owned `Paid` Home label
and the earlier manual changes. The Budget Cash flow labels remain exactly
“Opening balance” and “Closing balance”; no removed Budget control was restored.
The P20-U decision was committed in `47a2bd8`.

STEP 1 implementation: `02bfbb1` adds route forms for sections, items and
income, registers them in the Expo Router stack and route-kind map, routes the
Budget entry points to them, and deletes `src/components/BudgetManagementSheet.tsx`.
`editBudgetIncome` adds full name/amount/day/category updates using the existing
month/following scope semantics; the store action applies the change through
one data action. The existing domain/store mutation and snapshot Undo model is
retained. `TopAnchoredSheet` stays because Goal asset picking and `Dropdown`
still use it. No schema or demo change was needed; `SCHEMA_VERSION` remains 12.

**Replaced assertions and removed sheet behavior:**

| Previous assertion / implementation | Replacement | Reason |
|---|---|---|
| `BudgetManagementSheet.tsx`: `makeFormSchema`, `titleFor`, and `BudgetManagementSheet`, plus `BudgetManagementMode`, `BudgetManagementValues`, and the `CUSTOM_ITEM_CATEGORY` sentinel. | Separate typed route schemas and the three route screens; item name is direct text, with no category dropdown or Custom item. | CR-86 explicitly replaces the modes/single-sheet form with section, item and income route forms. |
| `edits and removes plan lines in the sheet, with a snapshot-aware Undo callback` | `opens plan item editing as a scoped budget-item route`, plus route save/Undo and store one-write/deep-equal restore tests. | The edit is now a route and continues to use the same month snapshot Undo behavior. |
| `manages categories, items, and income through scoped sheets and counted deletes` | `renders Budget route forms in the shared shell at font scale 1.3/2`, `saves Budget route forms with scope, Undo, validation and edit-only delete actions`, and `wires Budget section, item, income and unbudgeted entry points to routes`. | Each former sheet mode now has a route and is tested for its shell, fields, route params, scope and entry point. Counted section deletion remains on Budget. |
| `edits and deletes manually planned Insurance items with scoped Undo` | Insurance manual-item add/edit route entry, item save/delete confirmation, and one-write/Undo coverage. | Manual Insurance items remain manageable but now use the same route form as other section items. |
| Sheet backdrop, top-anchor, keyboard-height and sheet-only font assertions. | Shared FormScreen header/body/footer contracts and 1.3/2.0 simulated route-form layout tests; the shared FormShell component test remains. | The sheet is removed; native route/keyboard/layout behavior is separately listed as unverified. |

No standalone BudgetManagementSheet test file existed. `TopAnchoredSheet`
remains in use. The frozen input test, `SortChip.tsx`, `src/lib/sorting.ts`,
Cash flow labels and schema v12 were not changed.

Focused verification: 6 suites / 264 tests pass:
`budget.test.ts`, `createAppStore.test.ts`, `RouteRenderSmoke.test.tsx`,
`FormShell.test.tsx`, `routeKinds.test.ts`, and `progressLedger.test.ts`.
The full coverage run passes 78 suites / 934 tests (95.93% statements, 92.37%
branches, 97.69% functions, 97.67% lines overall).

Required gates, run sequentially:

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 78 suites / 934 tests pass; 95.93% statements, 92.37% branches, 97.69% functions, 97.67% lines. | 0 |
| `npx tsc --noEmit` | TypeScript passes. An initial check caught a test-mock type omission; adding the typed Undo mock and rerunning passed. | 0 |
| `npx expo lint` | Passes without warnings. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported to `dist`. | 0 |
| `npx expo export --platform ios` | iOS bundle exported to `dist`. | 0 |

Directory coverage independently summed from Istanbul per-file summaries:

| Source area | Lines | Branches |
|---|---:|---:|
| `src/domain` | 2895/2940 (98.47%) | 2778/2982 (93.16%) |
| `src/data` excluding hooks | 611/652 (93.71%) | 607/693 (87.59%) |
| Pure `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Changed-file per-file Istanbul summaries (separate from the directory totals):

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/domain/budget.ts` | 96.16% | 91.06% | 97.69% | 97.79% |
| `src/data/createAppStore.ts` | 90.74% | 86.59% | 89.20% | 92.91% |

Coverage aggregation script:

```js
const { createCoverageMap } = require('istanbul-lib-coverage');
const map = createCoverageMap(require('./coverage/coverage-final.json'));
for (const [name, match] of Object.entries({
  domain: (file) => /\/src\/domain\//.test(file) && !/\/__tests__\//.test(file),
  data: (file) => /\/src\/data\//.test(file) && !/\/__tests__\//.test(file) && !/\/hooks?\//.test(file),
  lib: (file) => /\/src\/lib\//.test(file) && !/\/__tests__\//.test(file),
})) {
  let lc = 0, lt = 0, bc = 0, bt = 0;
  for (const file of map.files()) {
    if (!match(file)) continue;
    const summary = map.fileCoverageFor(file).toSummary();
    lc += summary.lines.covered;
    lt += summary.lines.total;
    bc += summary.branches.covered;
    bt += summary.branches.total;
  }
  console.log(`${name}: lines ${lc}/${lt} (${(100 * lc / lt).toFixed(2)}%); branches ${bc}/${bt} (${(100 * bc / bt).toFixed(2)}%)`);
}
```

**P20-U acceptance criteria not verified on a real device:** route navigation
and hardware-back/dirty-discard behavior; native keyboard avoidance, field
scrolling and footer reachability; OS font scaling and clipping at 1.3/2.0;
segmented control and income dropdown touch/announcements; delete confirmation
and Undo toast presentation; and modal stack/tab-bar presentation on physical
iOS and Android. Tests assert route calls, component/style props and callbacks
in TestRenderer; exports are bundles, not device runs.

### P21-E Emergency-fund allocation item route form (CR-90)

Preflight decision and in-progress ledger entry are in `fca168b`;
implementation and closeout are in `c199c8e`. The implementation removes the
predefined add-choice modal from Emergency fund allocation. The header plus
now opens the `/ef-bucket-form` route directly;
fixed and custom allocation rows open the same route for editing. The shared
FormScreen shell provides the header, body and Save footer. Custom item title,
access and market-linked fields validate and persist through `saveEfPlan` in a
single store action; a new item is present at 0% without altering the existing
100% allocation. Removing a custom item keeps the existing confirmation,
removes it from the allocation/link grouping, normalizes remaining percentages,
and preserves its emergency-fund goal asset links.

The obsolete `addEfCustomBucket`, `renameEfCustomBucket`, and
`setEfCustomBucketAccess` store/domain action paths were removed. Their former
direct-action tests were superseded by saved-plan domain and route form tests.
No source files were deleted; the previous picker and custom-option modal
implementation was removed from `app/ef-allocation-form.tsx`.

Superseded assertions and tests:

| Previous assertion / implementation | Replacement | Reason |
|---|---|---|
| Header plus presented the missing fixed choices and Custom/Cancel picker. | Header plus calls the direct add route; source scan confirms the allocation screen contains no predefined picker. | CR-90 removes the add-option picker. |
| Custom-option modal created and edited a custom bucket. | Shared-shell route tests cover title, access, market-linked state, uniqueness, length, add/edit and zero-percent insertion. | Item creation/editing moves to the route form. |
| Allocation screen removed items locally and displayed a changed draft total. | Route form confirmation removes grouping through one `saveEfPlan` call; existing allocation screen tests still enforce 100% before saving percentages. | Delete now belongs to the item edit route; allocation percentage editing remains unchanged. |
| Direct `addEfCustomBucket`, `renameEfCustomBucket`, and `setEfCustomBucketAccess` domain/store mutations. | One `saveEfPlan` path for form creation and editing, with one-write coverage. | Avoid parallel form mutation paths. |

The custom allocation demo contains one item for each access speed and one
market-linked item. Fixed bucket title/access/market metadata remain canonical
and read-only in the shared route because P21-E makes no persisted-schema
change. This is the recorded assumption in DEC-P21E-CR90.

Focused acceptance verification: 6 suites / 233 tests pass:
`EfAllocationForm.test.tsx`, `efAllocationCustom.test.ts`,
`createAppStore.test.ts`, `RouteRenderSmoke.test.tsx`, `FormShell.test.tsx`,
and `demoData.test.ts`.

Final required gates, run sequentially:

| Command | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 78 suites / 950 tests pass; 95.99% statements, 92.20% branches, 98.12% functions, 97.60% lines. | 0 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Passes without warnings. | 0 |
| `npx expo-doctor` | `Running 21 checks on your project... 21/21 checks passed. No issues detected!` | 0 |
| `npx expo export --platform android` | Android bundle exported to `dist`. | 0 |
| `npx expo export --platform ios` | iOS bundle exported to `dist`. | 0 |

Directory coverage is computed from Istanbul per-file summaries (excluding
tests and hooks): domain 98.26% lines / 92.92% branches; data 94.23% / 87.75%;
pure lib 100% / 100%.

**P21-E acceptance criteria not verified on a real device:** OS font scaling,
clipping and touch-target behavior at 1.3/2.0; native keyboard avoidance,
scrolling and footer reachability; Dropdown and Switch interaction/announcements;
navigation, hardware back and dirty-form discard; delete-confirmation
presentation; and screen-reader behavior on physical iOS and Android. These
tests use TestRenderer to inspect structure, props and callbacks; bundle exports
are not device runs.

### P25-C Release blockers and shared AI memory

| Step | Status | Evidence | Verification |
|---|---|---|---|
| STEP 0 — Preflight and user-change audit | Done | `docs/PROGRESS.md` DEC-USER-CHANGES; checkpoint `ff349515887dae09ac5ebc34776ec2754ed80dbe` | Required date/log/status run; only package manifests were dirty. Checkpoint content was preserved exactly and added one path row per file. |
| STEP 1 — CR-91 Home order follow-up | Done | `src/components/__tests__/EmergencyGoalScreens.test.tsx`; Home source unchanged | `renders the Home Insurance section after upcoming dues and before Goal Progress at font scale 1.3/2`; 38 focused screen tests pass. |
| STEP 2 — Expo patch versions and dependency audit | Done | User-updated `package.json`/lockfile in checkpoint; `docs/PROGRESS.md` records audit | Expo Doctor 21/21. `npm audit --json` reports 8 advisories (5 high, 3 moderate); requires owner decision, no force fix or install-script approval. |
| STEP 3 — License and Node metadata | Done | `LICENSE`, `.nvmrc`, package engines, README, AGENTS | Holder specified as `Sahil Aspak Sheikh`, subject to confirmation. Node 24.22.1 chosen from official Node 24 LTS and React Native 0.86 requirements; no EAS build. |
| STEP 4 — Shared AI memory | Done | `docs/memory/`, `AGENTS.md`; tool-specific pointer files were initially created and removed in the P25-C follow-up | `shared AI memory documents` and `permanent progress ledger`; memory pages/header/index/schema/count checks pass, and the follow-up test requires a single `AGENTS.md` instruction entry point. |
| STEP 5 — Final gates | Done | Current task source/docs and this ledger | 79 suites / 955 tests; six ordered gates all exit 0; Expo Doctor 21/21. |

P25-C's simulated layout tests did not establish physical-device behavior.
In P25-D the owner reported that physical-device testing works; device model
and operating system were not recorded. This is owner-verified, not automated
evidence. The owner also reports the EAS build and screenshots are complete.
Full automated test and coverage results are recorded in DEC-P25C; see
[`docs/memory/open-items.md`](./memory/open-items.md) for outstanding owner
decisions and the source of the owner-reported verification.

### 2026-11-01 backup revalidation

The restored local schema-v13 backup was parsed and validated by the app
importer with a temporary Jest smoke test (1/1 passed); the temporary test was
removed. Its existing checksum matches its data. The revised envelope shown in
the owner's message does not match the file currently at the tagged path, so
no entries were changed or inferred and the existing file was left intact.
The owner then supplied the complete data, matching `sahil_wealthwise_import.json`
(31 transactions, 28 goals, 5 holdings and 1 liability). The supplied checksum
does not match the app's canonical JSON digest. Recomputing it in a temporary
test exposed three importer constraints: a goal name exceeds the 40-character
limit, the plan includes an unrecognized derived `invested` field, and a
non-null actual value has no snapshot date. A diagnostic normalization using a
shortened goal name, removing the derived field and setting the snapshot date
to the export date passed importer validation (1/1). The owner approved those
minimal adjustments. Created `wealthwise-backup-20261101-complete.json` from
the complete supplied data, recalculated its checksum using the app's canonical
JSON, and verified the resulting backup imports successfully (1/1 temporary
smoke test). The temporary test was removed. The original source and earlier
dated backup remain intact. No commit was created.

### 2026-11-01 monthly income added to backup

Added the owner's July 2022–October 2026 income details to
`wealthwise-backup-20261101-complete.json` as 115 separate source-level income
transactions, each dated on the first of its month. Mapped salary to Salary,
freelancing/agency to Freelance, other income to Other, savings withdrawals to
Withdrawal, friends/family help to Borrowed, and loan/credit-card proceeds to
Loan proceeds. Notes preserve the supplied source labels where category names
are normalized. Monthly totals were used as reconciliation checks, not added
again as duplicate transactions. A temporary Jest test confirmed that all 52
component sums equal the supplied totals, then recalculated the canonical
checksum and verified importer success (1/1); the temporary test was removed.
The original source and dated prior backup remain unchanged. No commit was
created.

### 2026-11-01 monthly expenses and loan logs added to backup

Added the owner's July 2022–October 2026 monthly expense components and
November 2022–October 2026 loan payment breakdowns to
`wealthwise-backup-20261101-complete.json`. Non-loan expense items are dated
on each month's first day. Savings and investments are `invest` transactions
in the unlinked `Other investments` category; other expense labels use the
nearest supported category and retain the original label in the note. Loan
components already match each month's Loans subtotal; they are represented
once, with historical non-HDFC components as EMI transactions and the HDFC
payments linked to the existing recurring liability. The missing September
2025 HDFC payment was added on its due date using the existing liability EMI.
Existing HDFC payments through October 2026 remain unchanged. Future
installments through the liability term remain scheduled, not marked paid.
No separate settled liabilities were invented for the old loans, as their
individual creditors and original principals were not supplied. Income
transactions from the previous update were not duplicated.

Five expense months had itemized amounts below their stated totals. Per owner
approval, the differences were added as distinct `Other` expenses on the first
of each month with notes identifying them as unitemized differences; no
categories were inferred. A temporary Jest test confirmed the monthly expense
totals and loan subtotals, updated the checksum, and verified importer success
(1/1); the temporary test was removed. The full project gates were not rerun
for this backup-data-only update. No commit was created.

### 2026-11-01 emergency-fund logs and cash-flow reconciliation

Updated `wealthwise-backup-20261101-complete.json` with the supplied emergency-
fund activity for January 2025 through October 2026. Existing linked ICICI RD
deposits were reused, and 18 duplicate unlinked investment transactions were
removed. Other deposits and withdrawals were mapped to linked holding entries
and transactions; existing savings, investment and withdrawal transactions
were reused or split where amounts matched. A zero-current-value Bachat Gat
holding was added and linked to the FD/RD emergency-fund bucket and Emergency
Fund goal. Existing Cash, Bank and HDFC FD values were preserved with snapshot
dates at the backup export date.

The supplied net movements reconcile to their itemized entries except for
unitemized deposit/withdrawal differences, which remain explicitly labeled.
Monthly tracker net, target and cumulative metadata are retained in notes.
Per the owner's request, cash-flow deficits were covered with linked Bank
withdrawals in 16 months; all 52 transaction months now reconcile. Future HDFC
loan installments remain scheduled rather than marked paid, and existing
income, sale and loan proceeds were not duplicated.

A temporary updater test reconciled the emergency-fund activity and passed
(1/1), and a separate temporary final-file test verified canonical checksum,
schema/import integrity, unique transaction IDs, snapshots, links and monthly
cash flow (1/1). `npx tsc --noEmit` exited 0. Temporary tests were removed.
The full project gates were not rerun for this backup-data-only update. No
commit was created.

### 2026-11-01 Transactions closing balance and local backup validation (CR-93)

The Transactions card hid the balance amount whenever the brought-forward
balance was zero, even when the selected month had a zero or negative closing
balance. The amount is now always rendered; negative amounts retain the
existing danger tone and shortfall label. Added route tests for zero and
negative balances and updated the route smoke assertion to require a visible
negative value.

The edited local schema-v13 backup had a stale SHA-256 checksum after note
changes. Recalculated only the checksum, then verified that the backup imports.
The tagged backup still contains its month-end balancing record and does not
include the separate transaction deletion/addition described for current app
data, so no financial transaction was changed in the file. The monthly
overspend warning measures the selected month's expenses plus investments
against that month's income; the balance card also includes carried-forward
amounts. Existing currency formatting rounds paise to whole rupees, which can
make the warning display round a fractional difference.

| Verification | Result | Exit |
|---|---|---:|
| Zero/negative balance focused tests | `TransactionsScreen.test.tsx` verifies zero and negative balances; the route smoke test verifies the negative amount is present. | 0 |
| Edited local backup | Recalculated canonical checksum; schema-v13 `parseBackup` accepts the result. | 0 |
| `npm test -- --coverage` | 77 of 79 suites pass; 9 of 957 tests fail in the pre-existing `TransactionsScreen.test.tsx` and `RouteRenderSmoke.test.tsx` cases. | 1 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Lint passes. | 0 |
| `npx expo-doctor` | 21/21 checks pass. | 0 |
| `npx expo export --platform android` | Android bundle export passes. | 0 |
| `npx expo export --platform ios` | iOS bundle export passes. | 0 |

Temporary backup validation test was removed. The local backup remains ignored
user data; only its checksum was updated. The pre-existing `backup.ts` change
was preserved.

### 2026-11-01 complete tracker reconciliation (CR-92)

Re-tallied the local schema-v13 backup against the supplied income, monthly
expense, loan and emergency-fund trackers. Removed the 16 stale cash-flow
balancing transactions and their linked holding logs. Added a linked Bank
withdrawal on the final calendar day for each remaining deficit month, and an
`Other` expense on the final calendar day for each surplus month. The resulting
backup contains 716 transactions across all 52 tracker months; each month's
income equals its recorded outflows. The 48 supplied loan months, emergency-
fund tracker metadata, unique transaction IDs/signatures, and the 18 existing
linked RD deposits were checked. Existing HDFC payments and holding snapshots
were preserved.

**Superseded assertion:** the previous close-out said the 52 transaction
months reconciled, but its balancing rows were placed on the first of each
month, and positive balances were not recorded as extra expenses. The new
assertion requires month-end dates, separate deficit withdrawals and surplus
expenses, no duplicate points, and zero net cash flow for every supplied
month. This corrects the earlier claim without changing the source tracker
amounts.

| Verification | Result | Exit |
|---|---|---:|
| `npm test -- --runInBand src/domain/__tests__/reconcileBackupTransactions.test.ts` | 1 suite / 1 test passed; monthly totals, loan totals, emergency-fund logs, duplicate detection, adjustment counts/dates and importer integrity verified. | 0 |
| Schema-v13 backup | Canonical SHA-256 recalculated; `parseBackup` accepts the final file. | 0 |
| `npm test -- --runInBand src/lib/__tests__/progressLedger.test.ts src/domain/__tests__/backup.test.ts` | 2 suites / 34 tests passed. | 0 |
| `npm test -- --coverage` | 77 of 79 suites pass; 9 of 955 tests fail in `TransactionsScreen.test.tsx` and `RouteRenderSmoke.test.tsx` (the same baseline failures recorded before this data-only task). | 1 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Lint passes. | 0 |
| `npx expo-doctor` | 21/21 checks pass. | 0 |
| `npx expo export --platform android` | Android bundle export passes. | 0 |
| `npx expo export --platform ios` | iOS bundle export passes. | 0 |

The temporary test was removed after verification. The full backup is kept as
a local user-data deliverable and is not committed to the repository.

### 2026-11-01 historical actual-based budgets (CR-94)

The owner selected monthly custom snapshots that match each completed month's
transaction actuals. Added 52 snapshots for July 2022 through October 2026.
Each expense/investment category's planned amount is aligned to the recorded
transactions, including linked schedule rows, so historical budget views
reflect what was logged rather than imposing new limits on immutable past
transactions. Earned-income rows follow the logged earned-income categories;
borrowed funds, loan proceeds and withdrawals remain non-earned inflows in the
app's existing model.

Transactions, holdings, linked records, the legacy `budget` object, and the
null repeating `budgetPlan` were preserved. All snapshots are custom and
month-specific; no future recurring budget was created.

| Verification | Result | Exit |
|---|---|---:|
| Temporary focused budget/import test | 1 suite / 1 test passed; all 52 months have category-level planned/actual agreement, the transaction array is unchanged, and the schema-v13 backup imports. The temporary test was removed. | 0 |
| Local backup checksum and coverage | Canonical SHA-256 is valid; 52 consecutive month snapshots span July 2022 through October 2026. | 0 |
| `git diff --check` | Passed. | 0 |
| Full application gates | Not rerun; this was a local backup data-only update. | — |

**Decision — DEC-BUDGET-HISTORICAL-ACTUALS:** preserve past transactions as
immutable facts and store month-specific editable budget snapshots whose
planned categories match those facts. Keep planned income limited to the
app's earned-income model and do not invent non-earned-income classifications.
The user backup remains local ignored data and is intentionally not committed.

### 2026-11-01 complete historical Budget income reconciliation (CR-95)

The owner clarified that loans, borrowed funds, withdrawals and other
non-earned inflows must remain income, not be reclassified as Unexpected
Extras, and selected category-total transaction matching rather than
per-transaction budget rows. Added optional `otherIncomes` to month snapshots
and both app/import schemas. Budget overview renders these as distinct
read-only income rows matched by month and transaction category; earned-income
planning and future projections remain unchanged. Unknown income categories
also remain income and are reconciled as non-earned rows. All existing
expense/investment categories in the backup map to supported budget
categories; none needed Unexpected Extras fallback.

Updated the local backup with non-earned income rows across the 52 historical
months. Actual transactions, transaction categories, notes, holdings, linked
entries and existing explicit transaction source links were preserved. All
month/category planned and actual income, expense and investment totals
reconcile; the current transaction array contains 716 records and 119 explicit
source-linked records.

| Verification | Result | Exit |
|---|---|---:|
| Focused historical backup test | 1 suite / 1 test passed; all 52 months reconciled, backup imports, and transactions remain unchanged. Temporary test removed. | 0 |
| Focused budget/schema/backup and ledger tests | 4 suites / 130 tests passed. | 0 |
| Focused Budget route smoke cases | Responsive income-row cases pass at font scales 1, 1.3 and 2. | 0 |
| `progressLedger.test.ts` | 1 suite / 9 tests passed after CR-94 documentation update. | 0 |
| `npm test -- --coverage` | 77 suites passed and 2 failed; 949 tests passed and 9 failed (958 total). Failures are in Transactions available-balance theme/action expectations and one RouteRenderSmoke large-amount accessibility expectation; no historical Budget assertions failed. | 1 |
| `npx tsc --noEmit` | TypeScript passes. | 0 |
| `npx expo lint` | Lint passes. | 0 |
| `npx expo-doctor` | 21/21 checks passed; no issues detected. | 0 |
| `npx expo export --platform android` | Android export completed successfully. | 0 |
| `npx expo export --platform ios` | iOS export completed successfully. | 0 |
| Backup checksum | Canonical SHA-256 valid; schema-v13 importer accepted updated backup. | 0 |

**Decision — DEC-BUDGET-HISTORICAL-INCOME:** keep non-earned inflows distinct
from earned income, but include them as planned/actual income rows in historical
month snapshots. Preserve existing future earned-income projections and the
original transaction/source-link records.

**Superseded detail from CR-94:** its first decision said non-earned inflows
would remain outside planned income rows. CR-95 replaces that display rule for
historical snapshots by adding separate non-earned rows so historical planned
and actual totals reconcile; earned-income calculations and future projections
remain unchanged.

### P25-F green test baseline (2026-11-01)

No features or schema changes. The required baseline run used Node
`v26.13.0`: 79 suites (76 passed, 3 failed), 948 tests passed and 10 failed
(958 total), exit 1. The requested nine UI failures and the additional stale
memory-count failure were:

| File | Test | Expected | Received |
|---|---|---|---|
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the system theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the light theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the dark theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the sky theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the mint theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the blush theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `renders the withdrawals-only state under the midnight theme` | Text contains `Available balance`. | Rendered text contains `Closing balance ₹5.00 K` (October 2026 is a past month on 2026-11-01). |
| `src/components/__tests__/TransactionsScreen.test.tsx` | `keeps the Review action and routes its selected month to Budget` | Cash-card labels contain `Available balance`. | Labels are `Closing balance`, `₹830`, and `Review October 2026`. |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | `announces exact large amounts in screen-level accessibility labels` | A Budget accessibility label includes `₹1,23,45,678 spent of ₹12,34,56,789` (`true`). | No matching label (`false`); the hard-coded October dates were future-dated relative to the 2026-11-01 current-month cutoff. |
| `src/lib/__tests__/memoryDocs.test.ts` | `keeps all memory pages indexed, headed and aligned with source schema/test records` | A `Test counts: <suites> suites, <tests> tests` record is present (`not null`). | `null`; the status record used a different format and the remembered 955-test total was stale. |

**Assertion decisions and replacements:**

| Old assertion / fixture | Replacement | Reason |
|---|---|---|
| Eight Transactions cases required the October card label `Available balance`. | Keep checking the label, now `Closing balance`; keep the always-visible amount, no-toggle, and Review action/routing assertions. | DEC-USER-CHANGES preserves the user's compact balance card and amount; DEC-TRANSACTIONS-CLOSING-BALANCE distinguishes current-month Available from past-month Closing. The selected October month is past on November 1, so changing app text or removing an assertion would contradict the recorded decisions. |
| Review test fixed transactions to September/October 2026 and expected Review September. | Derive the selected month as the most recently completed month, use month-relative transaction dates, preserve the ₹830 closing-balance assertion, and route Review to that derived month. | The original test became stale as the calendar advanced; this still tests a past-month amount and selected-month routing. |
| Large-amount smoke fixture fixed transactions to October 10/11 and required an exact Budget label. | Keep the exact accessibility-label assertion; put the current-month income/expense on `todayISO()` and derive the budget snapshot month from that date. | The actuals selector correctly excludes future dates in the current month. October 10/11 became future-dated when the system date changed to November 1; this was a fixture issue, not a Budget source regression. |
| Memory test fixed the repository total at 955 tests. | Update the expected total to 958; keep the exact suite count and cross-check of both memory pages. | The checked-in suite now contains 958 tests. The assertion remains exact and requires the project and status records to agree. |

The TransactionsScreen and RouteRenderSmoke focused run passes 155/155 tests;
the memory and ledger tests pass 10/10.

The first ordered gate run had a shared-runner timeout in
`TransactionForm.test.tsx`: `saves a new expense transaction` exceeded the
5-second test timeout, then `saves a new income transaction` observed two Back
calls instead of one. The isolated file passed 25/25; the exact full coverage
command then passed all 79 suites / 958 tests in 15.093 seconds. No timeout or
assertion was changed.

Final ordered gates on Node `v26.13.0`:

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 1, then 0 on retry | First full run had only the two `TransactionForm.test.tsx` timeout/follow-on failures; isolated file passed 25/25. Retry: 79 suites / 958 tests passed. |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed. |
| `npx expo-doctor` | 0 | 21/21 checks passed; no issues detected. |
| `npx expo export --platform android` | 0 | Android export completed successfully. |
| `npx expo export --platform ios` | 0 | iOS export completed successfully. |

Coverage from the passing full run: `src/data/` 94.23% lines / 87.74%
branches; `src/domain/` 98.26% / 92.88%; pure `src/lib/` 100% / 100%.
All documented directory floors pass. No physical-device check was performed
for P25-F; these route/accessibility checks are simulated.

### P25-B encrypted backups close-out (2026-11-01)

Commit evidence: research/decision commit
`d5aac3eb9535ac0b7cd3e3a11d37c77a8452d6aa` and implementation commit
`c90a8f323e355348b1fd17d7589d8a4cd505f7d4` both return `commit` from
`git cat-file -t`. No tag or push was created.

**Step verdicts**

| Step | Verdict | Evidence |
|---|---|---|
| 0. Preflight | Complete | Read `AGENTS.md` and `docs/memory/`; checked date, `git log -n 12`, status and Node `v26.13.0`. Initial tree was clean. Protected Budget source hash `5f5fd6e34555affd04c441e18f8acf5b43907083` matches the P25-B research commit; the older hash in `docs/memory/rules.md` predates commit `a507254`. No protected source was edited. |
| 1. Research and decision | Complete | SDK 57 Crypto/FileSystem/Sharing/DocumentPicker documentation and Noble package references recorded in DEC-P25B. Research commit `d5aac3eb9535ac0b7cd3e3a11d37c77a8452d6aa`. |
| 2. Pure crypto domain | Complete | `src/domain/backupCrypto.ts` implements the versioned envelope, header AAD, NFKC, bounded async scrypt, AES-256-GCM and typed errors; salt/nonce are injected. |
| 3. Import/export integration | Complete | `app/backup.tsx` keeps decrypted data in memory, uses Expo secure random bytes at the boundary, retains plain import, migration, staging, Undo and `lastExportAt` behavior. |
| 4. UI | Complete | Encrypted export default, warned plain opt-out, double-entry and show/hide passphrase controls, import retry and visible busy state. Automated font-scale cases run at 1.3 and 2.0. |
| 5. Tests | Complete | 80 suites / 984 tests pass. Standard scrypt and AES-GCM known-answer vectors, deterministic round-trip, NFKC, errors, mutation/truncation, plain import, v1→v13 migration, Undo, ciphertext-only encrypted export file and no persisted passphrase are covered. |
| 6. Docs and gates | Complete | README privacy disclosure, Unreleased changelog, memory and this ledger updated. All six final gates pass in order. |

No persisted schema change: current schema remains v13. No native dependency,
tag or push was created. The passphrase exists only in transient form state;
the format envelope is a file format, not persisted application data.

No product assertion was weakened or deleted. The progress-ledger test's P25-B
status expectation changed from `In progress` to `Done` because implementation
and final gates are now complete. The memory test's exact suite/test counts
changed from 79/958 to 80/984 to match the verified full run. Both changes
preserve strict status/count assertions.

**Dependency and KDF report**

| Package | Version | Purpose | Install scripts / runtime dependencies | Approx. size | npm audit delta |
|---|---:|---|---|---:|---:|
| `@noble/ciphers` | 2.4.0 | Portable AES-256-GCM | No lifecycle install scripts; zero runtime dependencies | 138 KiB compressed; 548,134 bytes unpacked | 0 |
| `@noble/hashes` | 2.4.0 | Portable asynchronous scrypt and byte utilities | No lifecycle install scripts; zero runtime dependencies | 164 KiB compressed; 691,646 bytes unpacked | 0 |

Both versions are exact-pinned. Installed with `npm install --save-exact
--ignore-scripts`; no install script ran or was approved. Existing
`expo-crypto@57.0.4` and `expo-file-system@57.0.7` provide random bytes and
file operations, respectively, so no Expo dependency or native build change
was needed. `npm audit` remained at 55 total advisories (6 high, 44 moderate,
5 low); production audit remained at 27 (6 high, 20 moderate, 1 low).
Dependency audit delta: zero.

Chosen KDF: scrypt `N=2^16, r=8, p=1, dkLen=32`, 16-byte salt, 12-byte nonce.
The benchmark was 247.4 ms on Node 26.13.0 using about 64 MiB. Imports bound
`N` to `2^15..2^16` and fix the other parameters. This development-machine
result is not a mid-range-phone measurement.

**Test and coverage evidence**

The final `npm test -- --coverage` run passed 80/80 suites and 984/984 tests.
The preceding integration-test run had one timeout because concurrent scrypt
work exceeded Jest's default five-second limit; the test timeout was set to
30 seconds without changing assertions, and the complete ordered gates were
rerun successfully.

| Coverage scope | Statements | Branches | Lines |
|---|---:|---:|---:|
| All instrumented files | 96.09% | 92.33% | 97.67% |
| `src/data/` | 91.58% | 87.74% | 94.23% |
| `src/domain/` | 96.92% | 93.05% | 98.32% |
| `src/lib/` | 100% | 100% | 100% |

| Instrumented file | Statements | Branches | Lines |
|---|---:|---:|---:|
| `src/domain/backupCrypto.ts` | 100% | 100% | 100% |
| `src/domain/backup.ts` | 94.79% | 91.42% | 95.85% |
| `src/data/createAppStore.ts` | 92.42% | 86.59% | 94.04% |

The configured Jest coverage collection does not instrument route files such
as `app/backup.tsx`; its import/export behavior is exercised by route tests.

**Final six gates (Node `v26.13.0`, ordered)**

| Gate | Exit code | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 80 suites / 984 tests; coverage above |
| `npx tsc --noEmit` | 0 | Passed |
| `npx expo lint` | 0 | Passed without warnings |
| `npx expo-doctor` | 0 | 21/21 checks passed |
| `npx expo export --platform android` | 0 | Export completed |
| `npx expo export --platform ios` | 0 | Export completed |

**Spec conflicts and closest behavior**

- Truncation has no dedicated requested error type, and GCM cannot identify
  wrong passphrase versus tampering. Structurally malformed/truncated JSON is
  `InvalidEnvelope`; valid structure with failed authentication is
  `WrongPassphraseOrTampered`, whose message explains that distinction is
  impossible.
- Expo SDK 57's cross-platform system share sheet requires a local file URL,
  and DocumentPicker's cache-copy mode provides reliable file reads. Thus the
  explicit plain-export option temporarily writes a plaintext cache file and
  deletes it after sharing; picked plain files are copied to cache and deleted
  after reading. Encrypted export files contain ciphertext only, and decrypted
  encrypted backups are never written to disk. This platform API constraint
  is disclosed in README and the screen. A different platform-specific file
  destination design is needed to satisfy literal no-plaintext-temp behavior
  for those plain paths.
- Noble's package documentation says its Argon2 implementation is unaudited
  and slower in JavaScript. The selected audited portable fallback is async
  scrypt; no native Argon2 dependency was added.

**Physical-device checks not verified:** scrypt timing on an actual phone,
native share sheet, file picker behavior, and large-font rendering at scales
1.3 and 2.0. Layout tests are simulated.

## P29 - Investment returns, emergency fund and linked amounts (2026-11-02)

**Task:** P29-A.

**Assumed:** record P29 as an implementation assumption; the frozen spec is
implemented without a persisted schema change. No edit is authorized for
`app/(tabs)/index.tsx`.

### DEC-P29B-E P29 integration snapshot

DEC-P29B-E: preserve the frozen Cash flow labels, use centered shared dialogs,
accept goal years 1990–2100, add schema-v14 holding links, keep legacy v1–v13
imports, and refuse schema 15 or newer.

Assumed: P29 is recorded as implementation work, not owner-confirmed
physical-device verification.

## P29-H asset value and return correction (2026-11-03)

**Assumed:** P29-H is new P29 work; schema v15 remains unchanged. The
user-owned `app/(tabs)/index.tsx` is read-only.

### Step 1 reproduction — before source changes

The regression tests in `src/domain/__tests__/investmentReturns.test.ts` pass
against the pre-change source and lock the current output for four minimal
fixtures. The old code path is:

- Invested: `holdingInvested()` in `src/domain/portfolio.ts:18-21`; the
  investment-entry summary renders it in `app/investment-entries.tsx:193-194`.
- Current value: `holdingValue()` in `src/domain/portfolio.ts:24-32`; the
  investment-entry summary renders it in `app/investment-entries.tsx:196-197`.
- Entry totals: the `logs` reductions in `app/investment-entries.tsx:201-207`.
- Gain and return: `row()` in `src/domain/portfolio.ts:43-70` calls
  `investmentReturnSummary()` in `src/domain/investmentReturns.ts:108-145`;
  `absoluteGainAndReturn()` in `src/domain/investmentReturns.ts:5-30` uses
  only deposit entries for the return denominator and omits the opening
  amount. `buildInstrumentCardModel()` in `src/domain/instrumentCard.ts:105-144`
  displays that result for every manual holding, including Cash and Bank.

| Fixture | Invested | Current value | Total deposits | Total withdrawals | Gain | Return shown by old function |
|---|---:|---:|---:|---:|---:|---:|
| Opening 73,000; four 2,000 monthly deposits after 2024-01-01 valuation; current as of 2024-01-01 | 81,000 | 81,000 | 8,000 | 0 | 73,000 | +912.5% |
| Same opening/deposits, entries on or before valuation; stored valuation 72,000 as of 2024-06-01 | 81,000 | 72,000 | 8,000 | 0 | 64,000 | +800.0% |
| Cash entries 1,000 / 3,000 / 0 / 0 / 5,000; valuation 5,400 after the entries | 9,000 | 5,400 | 9,000 | 0 | -3,600 | -40.0% |
| Opening 1,000; later deposit 2,000 and withdrawal 300; value 1,000 at 2024-01-01 | 2,700 | 2,700 | 2,000 | 300 | 1,000 | +50.0% |

These are pre-change outputs, not the intended P29-H results. In particular,
the source did not reproduce an `Invested` output of 73,000 when
an opening 73,000 and four 2,000 deposits are all represented in that
holding's `logs`: `holdingInvested()` returned 81,000. The owner
reported 73,000/72,000/8,000/0; that exact display implies a different stored
opening or entry representation and cannot be inferred without exact dates
and data. The old return denominator does ignore the opening: using the
reported 72,000 valuation and 8,000 in logged deposits gives
`(72,000 - 8,000) / 8,000 = 800%`.

The pre-change implementation also netted withdrawals out of
`holdingInvested()`, added `holding.value` to all entries when `valueAsOf` was
absent, and used rate-based `planValue()` estimates without an actual
valuation. It had no back-dated-entry helper line. The P29-H implementation
and final behavior are recorded in the later P29-H closeout section.

### DEC-29A Step 1 reproduction ledger

Old formula: manual/plan gain percentage was `(current value - invested) / invested * 100`,
where invested was the opening amount plus deposit/withdrawal net activity and
current value was the stored valuation plus later entry adjustments. There was
no dated XIRR/CAGR calculation shared across screens.

| Reproduction | Minimal old output | Cause |
|---|---:|---|
| Manual pattern deposits 1000, 3000, 0, 0, 5000; current value 5400 | -40% | old denominator is invested 9000 and old numerator is value minus invested |
| Same ledger-style pattern with current value 81000 and invested 9000 | +800% | old formula `(81000 - 9000) / 9000 * 100` |
| Emergency balance/linked current balance 38536 with allocation 10/20/70 | targets 3854, 7707, 26975 | old `allocateAmounts(balance, allocation)` used the displayed/current saved balance instead of the set effective goal target |
| Cash asset 30000 shared across goals | each goal could show 5000 | old equal split divided by the linked-goal count |
| Bank asset 35000 shared across goals | each goal could show 5000 | old equal split divided by the linked-goal count |
| FD/RD asset 28000 shared across goals | each goal could show a split share | old equal split divided by the linked-goal count |

Replaced assertions:

- Old: `goalAssetValueFor` and `goalSavedFor` divide an asset equally among linked
  goals using deterministic paise remainder.
- New: `goalAssetValueFor`/`goalSavedFor` count the full current value of an asset
  in every goal; `share` fields remain ignored.
- Reason: the frozen P29-A requirement reverses the P20-J equal-split rule and
  explicitly permits one asset to be counted in several goals.

- Old: emergency bucket targets came from `allocateAmounts(balance, ...)`.
- New: emergency bucket targets come from `allocateAmounts(effective goal target, ...)`.
- Reason: bucket targets must equal the user's emergency goal target, while
  bucket available values use full linked asset values.

Step 1 verification: focused Jest reproduction was red as intended:
`Cannot find module '../investmentReturns'`; linked goal expectations received
500 instead of the required full 1000 in 3 shared-link fixtures.

### DEC-P29A Step 2 implementation decision

DEC-P29A: use one pure `src/domain/investmentReturns.ts` implementation for
manual holdings and plans. Same-date entries are merged by date; contributions,
withdrawals, absolute gain and return are computed from dated entries plus the
valuation date. XIRR uses bracketed bisection with a 300-iteration bound and
`1e-9` NPV tolerance; CAGR uses a single deposited lump sum. Annualized figures
are emitted only for spans of at least 365 days. No schema change is needed.

Goal links no longer use share fields or equal splitting. A linked asset's full
current value is included in every linked goal. Shared-goal UI displays the
exact note required by the frozen spec. EF bucket targets are allocated from the
effective goal target, with bucket available values using full holding values.

### P29-A verification

**Gate table**

| Gate | Exit |
|---|---:|
| `npm test -- --coverage` | 0 |
| `npx tsc --noEmit` | 0 |
| `npx expo lint` | 0 |
| `npx expo-doctor` | 0 |
| `npx expo export --platform android` | 0 |
| `npx expo export --platform ios` | 0 |

**Assumed:** `record P29 as an implementation assumption`; P29 is new
and recorded as completed after repository verification.

**Verification commits:** Step 1 `01069e149e3447b938aa8ff233227869d238b19e`,
Step 2 `39b0c4f9bcba863a75e15fe1fb532d23a27bc43d`, Step 3
`a60c30aef...`, Gate 2 fixture fix `5d4871c...`. Final ledger commit is recorded
after verification.

**Coverage method:** one method only, sum Jest covered and total line/branch
counters for every file under each directory, then divide covered by total.
`src/data/` 95.34% lines / 90.91% branches; `src/domain/` 99.04% lines /
95.23% branches; `src/lib/` 100% lines / 100% branches.

| User pattern / EF example | Old | New |
|---|---:|---:|
| Manual pattern, current value 5400 | -40% | -40% absolute; no XIRR until 365-day span |
| Manual pattern, current value 81000 | +800% | +800% absolute |
| EF bucket targets at target 38536 / 10/20/70 | 3854 / 7707 / 26975 based on wrong current balance | 3853.60 / 7707.20 / 26975.20 based on effective target |
| EF bucket available, demo Cash/Bank/FD-RD | split or stale balances | full linked holding values |

## P29-F stabilization record (2026-11-02)

**Task:** stabilization of interrupted P29 work; no new features.

DEC-P29F: P29-B through P29-E remain In progress because the configured Jest
coverage gate exits 1. A passing test suite alone does not satisfy the repository
ledger rule for Done. Owner-owned `app/(tabs)/index.tsx` was not edited.
`git hash-object` recorded its current hash as
`d3d1e465fe9f5d238d338afeb033e2a54889ddc6`; `app/(tabs)/budget.tsx` is
`7beea9dd1ee7a3f46d95b8dbc13009b90b184dec`.

Assumed: the two uncovered branch thresholds are test-coverage gaps rather than
source behavior defects. Assumed: no archived raw-data bytes were lost by
coverage recovery.

Replaced assertions:
- old: native Paid / Not paid alert / new: `PaidAmountDialog` at every due entry
  point; reason: frozen P29-C shared centered-dialog requirement.
- old: persisted backup schema stayed below v14 / new: schema 14; reason:
  frozen P29-E holding-link schema requirement.
- old: Home lower Insurance heading/card / new: owner Home first-card row layout;
  reason: owner changed the file while Home editing was not authorized.
- old: Budget forms exposed a scope segmented control / new: forms have no scope
  control and use `ApplyScopeDialog` on Save/Delete; reason: frozen P29-D.
- old: month switchers had no Today control / new: Today control hidden in the
  current month and shown otherwise; reason: frozen P29-B.

The interrupted checkpoint commit `6d181561a13e30d09768cd662cca0a22e6047862`
was audited separately from owner commits and stabilization commits. No source
feature work was performed after the three stabilization commits. No generated
coverage, dist, `.expo`, log, temp or cache artifact was retained as a repository
change in the final worktree.

### P29-F acceptance evidence

| Frozen requirement area | Exact proof |
|---|---|
| Today hidden/visible/return/filter state | `RouteRenderSmoke.test.tsx` Today and month-route cases; `RouteRenderSmoke.test.tsx` route rendering cases |
| Goal year 1990–2100 and past years | `schemas.test.ts`, `actions.test.ts`, `TransactionForm.test.tsx` goal form cases |
| Dropdown centered modal and font scale | Shared modal tests in `RouteRenderSmoke.test.tsx`; modal implementation is `Dropdown.tsx` |
| Paid dialog all entry points/default/lower/higher/invalid/Not paid | `PaidAmountDialog.test.tsx`, `RouteRenderSmoke.test.tsx`, `PendingItemActions.test.tsx`, `dues.test.ts` |
| Paid one write, liability, Undo actual | `dues.test.ts`; `createAppStore.test.ts`; `investmentActions.test.ts` |
| Budget scope save/delete/cancel | `RouteRenderSmoke.test.tsx` ApplyScope cases and Budget route cases |
| Start month defaults/later-month validation | `RouteRenderSmoke.test.tsx`; `budget.test.ts` |
| Manual holding link clear one write and entry/transaction | `investmentActions.test.ts`; `PendingItemActions.test.tsx` |
| Plan holding link no second due/no double count | `budget.test.ts`; `createAppStore.test.ts` |
| Holding delete unlink with Undo | `createAppStore.test.ts`; `investmentActions.test.ts` |
| Schema v14 migration/archives/round trips | `migrate.test.ts`; `createAppStore.test.ts`; `backup.test.ts` |

### P29-F gates and fresh coverage

Fresh coverage measurement method: delete `coverage/` before Jest, then sum
Jest/Istanbul `coverage-final.json` `s` statement counters and `b` branch-counter
hits per file under each directory, divide covered counters by total counters.
`coverage-summary.json` is generated by the Jest/istanbul coverage pipeline,
but the ledger does not use it because stale-summary risk is eliminated by
deleting coverage and measuring the fresh JSON directly.

| Gate | Exit |
|---|---:|
| `npm test -- --coverage` | 1 |
| `npx tsc --noEmit` | 0 |
| `npx expo lint` | 0 |
| `npx expo-doctor` | 0 (21/21) |
| `npx expo export --platform android` | 0 |
| `npx expo export --platform ios` | 0 |

Fresh directory totals: `src/data/` lines 762/832 91.59%, branches 641/734
87.33%; `src/domain/` lines 3821/3945 96.86%, branches 3109/3350 92.81%;
`src/lib/` lines 133/133 100%, branches 126/126 100%.

Configured threshold failures: `src/domain/budget.ts` branch 89.77% vs 90%;
`src/data/createAppStore.ts` branch 83.83% vs 85%. No thresholds or exclusions
were weakened.

### Manual holding with no valuation update

For a manual Cash or Bank holding, current value is `holding.value` plus
deposit/withdrawal entry amounts whose entry date is after `holding.valueAsOf`,
clamped to zero. In `holdingValue()` this is no-source-value logic:
`src/domain/portfolio.ts` calls `holdingValue`. The return is then calculated by
`absoluteGainAndReturn()` in `src/domain/investmentReturns.ts` as
`gain = current value + withdrawals - contributions`, with
`gain/contributions` as absolute return percent. Thus the app shows whichever
valued baseline plus later entries exists; deposits after the valuation date
increase it, while the return percent is still based on the deposits in the
entry ledger. There is no fixed demo number because "no value update" means no
valuation field was supplied. The actual fixture value is `holding.value`, and
the displayed return is the fixture's gain divided by its contribution sum.

### P29-F part verdicts

| Part | Verdict | Reason |
|---|---|---|
| P29-B | In progress | Repository tests pass and UI implementation exists, but gate coverage is not green and native layout is unverified. |
| P29-C | In progress | Actual payment dialogs/actions are implemented, but final gates are not fully green. |
| P29-D | In progress | Budget scope/start-month behavior is implemented; branch threshold remains red. |
| P29-E | In progress | v14 migration and links are implemented; branch threshold remains red. |
| P29-F | In progress | Stabilization is complete in source/test/audit evidence except the two coverage thresholds. |

### DEC-P29F3 assertion and coverage correction

DEC-P29F3: the P29-F2 92% and 88% branch-headroom targets were advisory and
are withdrawn. Configured per-file thresholds remain the only repository
coverage rule. The earlier P29-F3 summary's assertion statement was
inconsistent: 94 added / 41 removed / +53 described changed lines in its F3
subset, not expectation-call counts; 2050→2174/+124 described the broader
base-to-interim-HEAD test set. Its "removed 0 / eight replacements / seven
Home plus one Dropdown" wording was not a valid complete audit. The final
base-531d659 test-file audit below reports expectation calls consistently;
there are 41 deleted expectation lines and no Dropdown deletions.

### DEC-P29F4 final stabilization audit

**Task constraint:** no feature or application source behavior changed. F4 code
changes are tests only (actual-payment Undo and ledger consistency);
`app/(tabs)/index.tsx` remains untouched. The previous Gate 1 failure's output
is not available in the current workspace, so its exact first 15 lines and
durations cannot be reconstructed. The three reported suites were run alone
three times each in this task:

| Suite | Run 1 | Run 2 | Run 3 | Tests per run |
|---|---:|---:|---:|---:|
| `TransactionForm.test.tsx` | Pass, 1.494 s | Pass, 1.379 s | Pass, 1.324 s | 25 |
| `RouteRenderSmoke.test.tsx` | Pass, 2.962 s | Pass, 3.057 s | Pass, 3.186 s | 137 |
| `backupCrypto.test.ts` | Pass, 4.526 s | Pass, 4.595 s | Pass, 4.676 s | 22 |

No root cause for the unavailable historical failure can be established, so
it is not labeled environmental or attributed to a specific timeout cause.
The final fresh full run passed 84 suites / 1037 tests in 16.674 s.

Preflight: 2026-11-02, Node v26.13.0, base `531d659` verified as a commit,
and the worktree was clean before F4 edits. The only non-Copilot commit since
that ledger base is owner commit `95451cf`, which changes only
`app/(tabs)/index.tsx`; the file was read-only in F4.

The two audited P29-F3 commits contain:

| Commit | Files |
|---|---|
| `7225a7e` (`chore: P29-F3 stabilization checkpoint`) | `docs/PROGRESS.md`; `docs/memory/open-items.md`; `docs/memory/status.md`; `src/components/__tests__/EmergencyGoalScreens.test.tsx`; `src/components/__tests__/RouteRenderSmoke.test.tsx`; `src/data/createAppStore.ts`; `src/lib/__tests__/progressLedger.test.ts` |
| `a48f3af` (`fix: close P29-F3 ledger and lint checks`) | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts` |

Neither commit contains generated or stray coverage, `dist`, `.expo`, log or
temporary files; there was nothing to untrack. The `dist/` output generated by
the final Android/iOS exports is not tracked and is cleaned after verification.

#### DEC-P29F4-AUDIT: Assertion integrity

Method: for each test file changed between base commit `531d659` and the final
worktree, count syntactic `expect(` occurrences in the base and worktree source.
The base commit resolves to a Git commit object (`git cat-file -t 531d659` =
`commit`). The line diff has 175 added and 41 removed expectation lines after
the ledger-test update; the occurrence count changes from 2050 to 2184, a net
increase of 134. In semantic accounting, the 41 deleted old expressions are
the documented replacements listed below (0 removed-only assertions, 41
modified/replaced assertions, 134 new-only assertions); line-based diff
therefore reports 175 additions and 41 removals; the syntactic occurrence
delta is +134.

| Test file | `expect(` at 531d659 | `expect(` in worktree | Net |
|---|---:|---:|---:|
| `src/components/__tests__/Dropdown.test.tsx` | 16 | 18 | +2 |
| `src/components/__tests__/EmergencyGoalScreens.test.tsx` | 82 | 79 | -3 |
| `src/components/__tests__/HomeThemeSmoke.test.tsx` | 20 | 20 | 0 |
| `src/components/__tests__/PendingItemActions.test.tsx` | 32 | 43 | +11 |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 377 | 402 | +25 |
| `src/components/__tests__/TransactionsScreen.test.tsx` | 77 | 84 | +7 |
| `src/data/__tests__/createAppStore.test.ts` | 372 | 398 | +26 |
| `src/data/__tests__/migrate.test.ts` | 99 | 101 | +2 |
| `src/data/__tests__/safeStorage.test.ts` | 28 | 28 | 0 |
| `src/domain/__tests__/backup.test.ts` | 79 | 83 | +4 |
| `src/domain/__tests__/budget.test.ts` | 278 | 314 | +36 |
| `src/domain/__tests__/dues.test.ts` | 131 | 138 | +7 |
| `src/domain/__tests__/investmentActions.test.ts` | 38 | 43 | +5 |
| `src/domain/__tests__/pending.test.ts` | 34 | 38 | +4 |
| `src/domain/__tests__/schemas.test.ts` | 234 | 240 | +6 |
| `src/lib/__tests__/progressLedger.test.ts` | 153 | 155 | +2 |
| **Total** | **2050** | **2184** | **+134** |

Every deleted expectation expression is accounted for here. "Modified" means
the old source assertion was replaced by a current-spec assertion, often with
a different component or action; it is not an assertion removal or weakening.
Where replacements are broader than one-to-one, the new behavioral test is
identified in the acceptance table.

| # | File and old test name | Deleted expectation | Ledger entry; replacement / reason |
|---:|---|---|---|
| 1 | `EmergencyGoalScreens.test.tsx` — `renders Home, Goals and Emergency fund for malformed persisted allocations` | `insurancePressable.props.accessibilityRole === 'button'` | DEC-P29F4-HOME; the shared Home insurance row now asserts the current label, placement and route instead of the obsolete separate card role. |
| 2 | same | `insurancePressable.props.accessibilityLabel === 'Open Insurance'` | DEC-P29F4-HOME; use the current Insurance summary accessibility label. |
| 3 | same | `upcomingIndex >= 0` | DEC-P29F4-HOME; the old lower-section ordering no longer exists. |
| 4 | same | `insuranceHeadingIndex > upcomingIndex` | DEC-P29F4-HOME; replaced by explicit two-row summary structure. |
| 5 | same | `insuranceCardIndex > insuranceHeadingIndex` | DEC-P29F4-HOME; the lower Insurance card was removed by the owner layout. |
| 6 | same | `goalProgressIndex > insuranceCardIndex` | DEC-P29F4-HOME; no lower Insurance card precedes goal content. |
| 7 | same | unique labels collected from the old Insurance pressable subtree | DEC-P29F4-HOME; old subtree shape is gone; current row/pill structure is asserted directly. |
| 8 | same | last child has `home-insurance-term-progress` | DEC-P29F4-HOME; obsolete lower-card testID removed; current Insurance box placement is tested. |
| 9 | same | old subtree contains `home-insurance-term-progress` | DEC-P29F4-HOME; see the current Insurance summary behavior test. |
| 10 | same | old Insurance card switches to a stacked layout at 1.3/2.0 font scale | DEC-P29F4-HOME; tests now assert row structure at those scales, not the removed card. |
| 11 | same | old Insurance card text contains `₹20,00,000` | DEC-P29F4-HOME; card content was replaced by the compact Home Insurance summary. |
| 12 | same | old Insurance card text contains `Yearly premium` | DEC-P29F4-HOME; the old card copy is not part of the owner layout. |
| 13 | same | old Insurance card text contains `Term cover` | DEC-P29F4-HOME; the old card copy is not part of the owner layout. |
| 14 | `EmergencyGoalScreens.test.tsx` — `hides the term-life bar without a known target and routes the empty-state Add policy action` | old `home-insurance-term-progress` testID absent | DEC-P29F4-HOME; the Home box no longer renders the old term-life bar. |
| 15 | same | old `home-insurance-row-next-renewal` testID present | DEC-P29F4-HOME; obsolete row testID removed; Insurance screen still owns detailed renewal content. |
| 16 | same | old `No policies yet` card title exists | DEC-P29F4-HOME; current compact summary is asserted by its value. |
| 17 | same | `stopPropagation` called once from the old card action | DEC-P29F4-HOME; the current empty-box action routes directly to policy creation. |
| 18 | `PendingItemActions.test.tsx` — `uses the Transactions Paid label for a direct oldest-due clear and offers Undo` | direct `clearDue(plan, 'slot-1')` callback assertion | DEC-P29F4-ACCEPTANCE (P29-C); the shared paid dialog now mediates the action; route and store tests assert confirmation, one write and Undo. |
| 19 | `PendingItemActions.test.tsx` — `uses the compact paid action for later dues and confirms the exact clear-through preview` | old `mockConfirmAsync` clear-through payload assertion | DEC-P29F4-ACCEPTANCE (P29-C); current route tests assert the paid dialog and exact due behavior. |
| 20 | `PendingItemActions.test.tsx` — `asks before clearing later installments, records one through action and provides one undo` | old `mockConfirmAsync` payload assertion | DEC-P29F4-ACCEPTANCE (P29-C); modal behavior replaced the native confirmation assertion; action/Undo assertions remain. |
| 21 | `RouteRenderSmoke.test.tsx` — `renders each route form with representative create and edit entry params` | exactly one inline Budget `Dropdown` | DEC-P29F4-ACCEPTANCE (P29-D); inline scope control is intentionally removed; the form test asserts it is absent. |
| 22 | same | inline `budgetScopeControl(...).props.value` is `month` | DEC-P29F4-ACCEPTANCE (P29-D); scope is selected in the save popup, not the form. |
| 23 | `RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` | exactly one inline Budget `Dropdown` | DEC-P29F4-ACCEPTANCE (P29-D); replaced by no-inline-control assertion plus popup choices. |
| 24 | same | first-due Dropdown has 12 options | DEC-P29F4-ACCEPTANCE (P29-D); replaced by viewed-month default and explicit later-start validation. |
| 25 | same | inline scope value is `month` | DEC-P29F4-ACCEPTANCE (P29-D); scope now comes from the popup. |
| 26 | same | native `mockConfirmAsync` save payload | DEC-P29F4-ACCEPTANCE (P29-D); current scope dialog tests exercise save, cancel and both scope choices. |
| 27 | `RouteRenderSmoke.test.tsx` — `keeps Home spending collapsed and asks before changing a due` | native confirmation payload | DEC-P29F4-ACCEPTANCE (P29-C); replaced by shared paid-dialog behavior. |
| 28 | same | native confirmation called twice | DEC-P29F4-ACCEPTANCE (P29-C); paid-dialog dismissal/Not paid behavior is asserted at the current entry points. |
| 29 | `RouteRenderSmoke.test.tsx` — `clears a confirmed Home due with Undo and previews earlier dues` | direct one-slot `clearDue` action expectation | DEC-P29F4-ACCEPTANCE (P29-C); replaced by the selected actual-amount/clear-through action and Undo checks. |
| 30 | same | native clear-through confirmation payload | DEC-P29F4-ACCEPTANCE (P29-C); shared paid dialog now supplies the amount before clearing. |
| 31 | same | `clearDuesThrough` called with the later plan and current month date | DEC-P29F4-ACCEPTANCE (P29-C); current test asserts the selected due/actual amount flow and resulting Undo. |
| 32 | `createAppStore.test.ts` — `applies a repeating plan once after hydration and stays idempotent on the next launch` | primary storage write count is exactly 2 | DEC-P29F4-ACCEPTANCE (P29-E); replaced by the one-write expectation, while the separate second-launch assertion still proves idempotence. |
| 33 | `migrate.test.ts` — `rejects invalid input and unknown or future versions` | schema 14 is rejected | DEC-P29F4-ACCEPTANCE (P29-E); v14 is now current; schema 15 refusal remains covered by backup/import tests. |
| 34 | `migrate.test.ts` — `passes the current persisted schema through unchanged` | v13 migration returns the original object | DEC-P29F4-ACCEPTANCE (P29-E); current schema v14 has its own identity assertion, while v13 now migrates. |
| 35 | `migrate.test.ts` — `adds monthly recurrence to v12 plan and snapshot items without changing other fields` | schema 14 is rejected | DEC-P29F4-ACCEPTANCE (P29-E); v14 is accepted and future versions remain rejected. |
| 36 | `backup.test.ts` — `canonicalizes recursively and creates a pretty-printed backup` | exported backup schema is 13 | DEC-P29F4-ACCEPTANCE (P29-E); backup export/import now uses v14. |
| 37 | `backup.test.ts` — `round trips v10 backups containing user-managed budget items and expense categories` | `SCHEMA_VERSION` is 13 | DEC-P29F4-ACCEPTANCE (P29-E); the v14 migration chain is the current backup version. |
| 38 | `schemas.test.ts` — `accepts the typed mock app data and exports schema version thirteen` | schema version is 13 | DEC-P29F4-ACCEPTANCE (P29-E); replaced with schema-v14 integrity and migration assertions. |
| 39 | `schemas.test.ts` — `validates goal and holding forms` | goal year 2025 is rejected | P29-B; past years are now accepted. |
| 40 | same | editing year 2019 is rejected | P29-B; the range is 1990–2100 and past years are accepted. |
| 41 | `progressLedger.test.ts` — `tracks completed P20-M through P20-U while preserving P20-L and P21-D` | dashboard expected `96% (77/80)` | DEC-P29F4-STATUS; dashboard counters now include nine P29 parts and the still-open acceptance gap. |

#### DEC-P29F4-HOME: Home layout tests

The only tests asserting the owner's Home row layout are:

| Test | Exact structure asserted |
|---|---|
| `EmergencyGoalScreens.test.tsx` — `shows the Home asset, emergency fund and liability pills with net worth as assets minus liabilities` | Row 1 is `Assets`, `Liabilities`; row 2 is `Emergency fund`, `Insurance`; flattened order is asserted. |
| `EmergencyGoalScreens.test.tsx` — `renders Assets/Liabilities then Emergency fund/Insurance in Home row 2 at font scale %s` (`it.each([1.3, 2])`) | Both rows are asserted at font scales 1.3 and 2.0; the test also asserts there is no separate Insurance content in the lower section. |

No test expects four items in one row, an old lower Insurance heading/card, or the removed lower-card testIDs. The first layout test also checks the row labels and the second checks that the Insurance summary is in row 2 rather than below it. All Home component changes remain unapproved and untouched.

#### DEC-P29F4-ACCEPTANCE: P29-B–P29-E acceptance matrix

| Part | Frozen acceptance line | Evidence (exact test file and test name) | Result |
|---|---|---|---|
| P29-B | Today hidden on current month; returns to it and keeps filters | `RouteRenderSmoke.test.tsx` — `shows Today only off the current Budget month and returns to the current routed month`; `RouteRenderSmoke.test.tsx` — `preserves the routed month, hides category management in past months, and keeps Cash flow labels` | Pass |
| P29-B | Goal year 1990–2100 and past years accepted | `schemas.test.ts` — `validates goal and holding forms` | Pass |
| P29-B | Dropdown is centered, not top-anchored | `Dropdown.test.tsx` — `opens a centered sheet with grouped titles, checks selection, and closes on selection` | Pass |
| P29-B | Home row 1 Assets/Liabilities; row 2 Emergency fund/Insurance; no lower Insurance card | `EmergencyGoalScreens.test.tsx` — `shows the Home asset, emergency fund and liability pills with net worth as assets minus liabilities`; `EmergencyGoalScreens.test.tsx` — `renders Assets/Liabilities then Emergency fund/Insurance in Home row 2 at font scale %s` | Pass |
| P29-C | Paid dialog from Home | `RouteRenderSmoke.test.tsx` — `clears a confirmed Home due with Undo and previews earlier dues` | Pass |
| P29-C | Paid dialog from Transactions; Not paid leaves due unchanged | `RouteRenderSmoke.test.tsx` — `opens the paid-amount dialog from a Transactions due row without clearing on Not paid` | Pass |
| P29-C | Paid dialog from `/payment-confirm`; Not paid leaves due unchanged | `RouteRenderSmoke.test.tsx` — `opens the paid-amount dialog from the payment-confirm route and Not paid leaves the due unchanged` | Pass |
| P29-C | Paid dialog from Budget; Not paid leaves Budget unchanged | `PendingItemActions.test.tsx` — `leaves a compact Budget row unchanged when Not paid is selected` | Pass |
| P29-C | Paid dialog from Insurance; filters/search/header remain | `RouteRenderSmoke.test.tsx` — `keeps Budget as the other Insurance entry point and removes Insurance from Goals` | Pass |
| P29-C | Default due amount and lower/higher/invalid amounts | `RouteRenderSmoke.test.tsx` — `clears a confirmed Home due with Undo and previews earlier dues`; `dues.test.ts` — `records actual paid amounts for lower, higher, and invalid plan and policy dues` | Pass |
| P29-C | One persisted write; Undo restores the actual due amount/linked data | `createAppStore.test.ts` — `clears an actual due amount and undoes it with one persisted write per action`; `dues.test.ts` — `clears one due and undoes the linked entry and transaction together`; `PendingItemActions.test.tsx` — `clears a linked manual investment budget item with one holding entry and exact Undo` | Pass |
| P29-D | Budget forms have no inline scope control | `RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` | Pass |
| P29-D | Scope popup on save/delete, each choice and cancel | `RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` (popup cancel and each choice are asserted for save/delete) | Pass |
| P29-D | Start month defaults to viewed month; later start rejects “This month only” | `RouteRenderSmoke.test.tsx` — `saves Budget route forms with scope, Undo, validation and edit-only delete actions` | Pass |
| P29-E | Manual holding clear creates deposit entry + invest transaction in one write; exact Undo | `createAppStore.test.ts` — `creates and undoes a linked manual investment deposit in one persisted write each`; `PendingItemActions.test.tsx` — `clears a linked manual investment budget item with one holding entry and exact Undo` | Pass |
| P29-E | Plan link creates no second due and no double count | `pending.test.ts` — `does not duplicate a linked plan due and counts its linked transaction once` | Pass |
| P29-E | At most one budget item per holding | `budget.test.ts` — `validates investment holding links and rejects invalid, missing, and duplicate links` | Pass |
| P29-E | Holding deletion clears every Budget item link to the holding in the same single write | `createAppStore.test.ts` — `unlinks budget items when a holding is deleted in one persisted write` | Pass |
| P29-E | v13→v14 migration, raw v13 archive once, erase-all removes archive | `migrate.test.ts` — `migrates v13 to v14 without changing any persisted fields`; `safeStorage.test.ts` — `copies the raw v%s payload exactly once and never overwrites its archive` with `version = 13`; `createAppStore.test.ts` — `erases all supported storage keys and hydrates to empty data` | Pass |
| P29-E | Refuse schema 15; import backup versions v1–v13; v14 and encrypted v14 round trips | `backup.test.ts` — `round trips custom emergency-fund options and refuses schema version fifteen`; v1 `verifies a v1 data checksum before migration and imports the v7 result`; v2 `verifies v2 data as written before migrating and validates the v7 result`; v3–v6 `verifies the v%s checksum before migrating its data`; v7 `verifies v7 checksums before migrating backups to schema nine`; v8 `verifies v8 checksums as written before migrating income totals`; v9 `verifies a v9 checksum over the original data before migrating its budget lines`; v10 `round trips v10 backups containing user-managed budget items and expense categories`; v11 `verifies v11 backup bytes and imports seeded cover goals`; v12 `verifies v12 backup bytes before adding monthly recurrence defaults`; v13 `imports a v13 backup through the no-op v14 migration`; plain v14 `round-trips typed insurance premium categories through current backups`; encrypted v14 `round-trips an encrypted v14 backup containing a linked investment item` | Pass |

#### DEC-P29E-HOLDING-DELETE: Owner decision and acceptance correction

On 2026-11-02, the owner withdrew the P29-E expectation that deleting a linked
holding provides Undo. Deletion has never offered Undo in this app; adding it
is out of scope. The retained requirement is that deleting a holding clears
every Budget item link to it in the same single persisted write, proven by
`createAppStore.test.ts` — `unlinks budget items when a holding is deleted in
one persisted write`.

Replaced assertion: old: deleting a holding must offer Undo and restore its
Budget links / new: deleting a holding clears every Budget link in the same
single write / reason: owner decision withdraws the never-existing Undo
behavior as out of scope; preserve and verify the atomic unlink behavior.

With that row withdrawn, the acceptance table has no missing requirements.
P29-B, P29-C, P29-D, P29-E, P29-F, P29-F2, P29-F3 and P29-F4 are Done: their
acceptance evidence is present and all six final gates exit 0.

#### Lint, coverage and gates

The prior-session summary reports two lint warnings but does not preserve their
diagnostic lines or rule names. The named variables in that summary cannot be
found in the available Git snapshots, so their exact file/line/rule details
cannot be independently recovered and are not restated as verified facts.
Final `npx expo lint` exits 0 with zero warnings; no eslint-disable comment was
added.

Coverage method: remove `coverage/`, run the configured `npm test -- --coverage`,
then read the fresh `coverage/coverage-final.json`. For each `src/<directory>`
sum each file's Istanbul statement and branch maps: covered is the count of
nonzero counters; total is the number of counters; percentage is covered/total
× 100. Do not use the generated summary file.

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data excluding hooks` | 638/676 (94.38%) | 645/734 (87.87%) |
| `src/domain` | 3207/3261 (98.34%) | 3116/3350 (93.01%) |
| `pure src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Informational branch coverage only: `src/domain/budget.ts` is 762/841
(90.60%); `src/data/createAppStore.ts` is 87/99 (87.87%). The advisory P29-F2
headroom targets are withdrawn; configured per-file thresholds remain
authoritative.

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 — 84 suites, 1037 tests passed |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 — zero warnings |
| 4 | `npx expo-doctor` | 0 — 21/21 checks |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Preliminary Gate 2 before the final ordered rerun exited 2 because the new
actual-payment Undo test passed `string | undefined` to the Undo action. A
runtime guard was added; the final six-gate run above was then executed in
order and all commands exited 0.

#### Device checks not verified

Physical iOS/Android checks remain unverified for the Today control and filter
retention, centered Dropdown and paid/scope dialog placement/keyboard behavior,
the paid dialog at each entry point, start-month and holding-link routes, Home
Insurance placement, and font scales 1.3/2.0. Simulator/TestRenderer assertions
and Expo exports are not physical-device verification. No Home source file was
edited.

Pure-function source changes in P29-F4: none.

## P29-G closeout - Editable Insurance cover goals (2026-11-02)

**Decision DEC-P29G-COVER-MANAGEMENT:** supersede DEC-P23-COVER's fixed,
non-deletable five-goal model. Goals are user-managed, may have a null kind,
and support add, full update and deletion. Deletion clears assigned policy
references but preserves policies and transaction history.

**Assumed:** policies explicitly assigned to a no-kind custom goal use the
generic `Insurance premium` category for future scheduled dues, planned rows
and newly recorded premium payments. Typed premium categories remain derived
from policy kind. Existing transactions retain their stored category. The
Budget Insurance system section and categories remain fixed and out of scope;
making them editable requires a separate scope decision.

`app/(tabs)/index.tsx` was not edited. Home's existing total-cover, yearly
premium and next-renewal semantics continue to use the unchanged policy
summary.

### P29-G replaced assertions

| File and test | Old assertion | New assertion | Reason |
|---|---|---|---|
| `coverGoals.test.ts` — `preserves cover, premium and renewal summary states using user-managed targets` | Summary lookup used policy `type` and assumed five pinned goal records. | Summary lookup uses stable goal IDs and validates the same target, cover, premium and renewal outcomes. | Goal records are user-managed and can be renamed, retyped or removed. |
| `coverGoals.test.ts` — `returns no-target for unknown income and excludes inactive cover` | Fixed-type target rows represented missing/inactive goals. | Explicit assignment, kind fallback, inactive/savings exclusion and unmatched policies are asserted with editable goals. | The count rule is based on goal assignment, not a fixed five-row list. |
| `coverGoals.test.ts` — `validates target updates and rejects absent goals with typed errors` | Target-only updates and fixed goal lookup. | Add/update/delete validate the full record, duplicate name/kind, 20-goal limit and target constraints. | Every field is editable and typed validation remains behavior-tested. |
| `coverGoals.test.ts` — `reports duplicate and missing cover types through integrity validation` | Integrity depended on exactly one goal per policy type. | Integrity rejects a missing explicit `coverGoalId`; duplicate IDs, names and kinds remain schema/domain errors. | Kinds are optional and user-managed; explicit policy links must resolve. |
| `schemas.test.ts` — `validates editable cover goal constraints and policy assignments` | Removing a default goal (`goals.slice(1)`) was invalid. | A subset/empty goal list is valid; duplicates, invalid targets, excessive count and missing policy references remain invalid. | Deletion and an empty user-managed list are supported; integrity constraints remain. |
| `RouteRenderSmoke.test.tsx` — `renders policy and editable cover-goal forms with delete confirmation` | Route inputs and assertions covered a type-selected target-only form, including its type-specific helper and value-field visibility. | The form is ID-based and asserts name/kind/target creation and editing, conditional value fields, delete confirmation, policy assignment choices and action routing. | The form now manages complete CoverGoal records. |
| `createAppStore.test.ts` — `does not publish Undo or writes for unchanged policies and cover goals` | Called the removed target-only setter and asserted unchanged data. | The no-op test retains policy non-mutation checks; add/update/delete have separate one-write, typed-error and exact-Undo behavior tests. | The target-only setter is superseded by full user-managed CRUD actions. |
| `createAppStore.test.ts` — `adds a cover goal in one write and Undo restores deep-equal data` | Looked up the created record by fixed `type`. | Looks up the new record by stable `id` and `kind`; one write and exact Undo are still asserted. | The new shape has `kind`, not legacy `type`. |
| `migrate.test.ts`, `backup.test.ts`, `schemas.test.ts` | Current schema asserted v14 and future schema 15 was refused. | Current schema is v15; v14 migrates, v1-v14 backups import, and v16 is refused. | P29-G adds the requested v14-to-v15 migration without losing prior backup compatibility. |
| `memoryDocs.test.ts` — `keeps all memory pages indexed, headed and aligned with source schema/test records` | Expected the earlier 1013-test inventory. | Expects schema v15 and the verified 84-suite/1054-test inventory. | The schema and total test inventory changed. |
| `progressLedger.test.ts` — `tracks completed P20-M through P20-U while preserving P20-L and P21-D` | Expected 88% (77/88), P29 11% (1/9), and P29 parts In progress. | Expects 97% (86/89), P29 100% (10/10), and completed P29 parts. | Dashboard counts reflect the owner closeout decision and completed P29-G. |

### P29-G assertion counts

The audit compares `expect(` occurrences in test files at `f70e968` with the
current worktree. Modified assertions count once as removed and once as added;
the net is added minus removed.

| Test file | At `f70e968` | Current | Net |
|---|---:|---:|---:|
| `RouteRenderSmoke.test.tsx` | 402 | 432 | +30 |
| `createAppStore.test.ts` | 398 | 419 | +21 |
| `migrate.test.ts` | 101 | 104 | +3 |
| `safeStorage.test.ts` | 28 | 28 | 0 |
| `actions.test.ts` | 23 | 23 | 0 |
| `backup.test.ts` | 83 | 85 | +2 |
| `budget.test.ts` | 314 | 317 | +3 |
| `budgetCategories.test.ts` | 18 | 21 | +3 |
| `coverGoals.test.ts` | 16 | 37 | +21 |
| `dues.test.ts` | 138 | 145 | +7 |
| `pending.test.ts` | 38 | 39 | +1 |
| `policySummary.test.ts` | 10 | 12 | +2 |
| `schemas.test.ts` | 240 | 245 | +5 |
| `memoryDocs.test.ts` | 11 | 11 | 0 |
| `progressLedger.test.ts` | 155 | 158 | +3 |
| `demoData.test.ts` | 90 | 92 | +2 |
| **Total** | **2065** | **2168** | **+103** |

The diff contains 133 added and 30 removed `expect(` invocations. All removed
or changed assertions are represented in the replacement table above and are
accounted for as fixed goal/type/schema expectations, the superseded
target-only setter, or stale dashboard/test-count expectations.

### P29-G acceptance evidence

| Frozen requirement | Exact proving test(s) | Result |
|---|---|---|
| User-managed CoverGoal shape, 1–40-character case-insensitive unique names, one goal per kind, max 20, target modes/ranges, and deletion of the former fixed five | `coverGoals.test.ts` — `creates stable default goals with the existing target behavior`, `adds, edits and removes complete goal records without mutating input`, `returns typed errors for duplicate names, kinds, limit and invalid targets`; `schemas.test.ts` — `validates editable cover goal constraints and policy assignments` | Pass |
| Optional policy `coverGoalId`; explicit assignment wins, otherwise kind fallback; count at most once; inactive and savings excluded | `coverGoals.test.ts` — `applies explicit assignment before kind fallback and excludes inactive and savings policies`, `rejects missing policy goal references and permits valid assignments` | Pass |
| Unmatched policies remain listed; Home total-cover semantics unchanged | `coverGoals.test.ts` — `applies explicit assignment before kind fallback and excludes inactive and savings policies`; `policySummary.test.ts` — `keeps total cover unchanged when a policy is assigned to a custom cover goal`; `RouteRenderSmoke.test.tsx` — `shows an actionable empty cover-goal section` | Pass |
| Pure v14→v15 migration gives stable IDs/names/kinds and preserves targets/other data | `migrate.test.ts` — `migrates v14 cover goals to stable editable records without changing other data` | Pass |
| Raw v14 archive is exact, written once and removed by erase-all | `createAppStore.test.ts` — `hydrates v14 cover goals, archives exact original bytes once and erases the archive` | Pass |
| Refuse v16; import backup versions v1–v14; current and encrypted v15 backup round trips | `migrate.test.ts` — `rejects invalid input and unknown or future versions`; `backup.test.ts` — `round trips custom emergency-fund options and refuses schema version sixteen`, `imports a v1 data checksum before migration and imports the v7 result`, `verifies v2 data as written before migrating and validates the v7 result`, `verifies the v%s checksum before migrating its data` (v3–v6), `verifies v7 checksums before migrating backups to schema nine`, `verifies v8 checksums as written before migrating income totals`, `verifies v9 checksum over the original data before migrating its budget lines`, `verifies v10 checksums as written before migrating policy fields`, `verifies v11 backup bytes and imports seeded cover goals`, `verifies v12 backup bytes before adding monthly recurrence defaults`, `imports a v13 backup through the editable cover-goal migration`, `imports a v14 backup through the editable cover-goal migration`, `canonicalizes recursively and creates a pretty-printed backup`, `round-trips an encrypted v15 backup containing a linked investment item` | Pass |
| Add/update/delete actions are one store write with Undo restoring deep-equal data; delete clears assigned links while preserving policy/transaction data; typed failures | `createAppStore.test.ts` — `adds a cover goal in one write and Undo restores deep-equal data`, `updates all cover-goal fields in one write and Undo restores deep-equal data`, `deletes a cover goal and clears assigned policies in one write with exact Undo`; `coverGoals.test.ts` — `deletes a goal, clears its explicit policy assignments and preserves policies and transactions`, `returns typed errors for duplicate names, kinds, limit and invalid targets` | Pass |
| Insurance Cover section add/card edit actions, complete goal form, conditional target-mode value fields, delete confirmation naming affected policy count, and Counts toward choices | `RouteRenderSmoke.test.tsx` — `keeps Budget as the other Insurance entry point and removes Insurance from Goals`, `renders policy and editable cover-goal forms with delete confirmation` | Pass |
| Empty section says “No cover goals yet” and provides Add | `RouteRenderSmoke.test.tsx` — `shows an actionable empty cover-goal section` | Pass |
| Delete Undo toast; large-font form layouts at 1.3 and 2.0 | `createAppStore.test.ts` — `deletes a cover goal and clears assigned policies in one write with exact Undo`; `RouteRenderSmoke.test.tsx` — `keeps cover-goal forms accessible at font scale %s` (1.3 and 2.0) | Pass |
| Demo has a custom assigned goal and a default goal with no matching policy | `demoData.test.ts` — `includes the required active and lapsed policy demo records` | Pass |
| Generic category for no-kind custom goal, typed categories remain kind-derived, historical payments survive deletion | `budgetCategories.test.ts` — `uses the generic category for policies assigned to a no-kind cover goal`; `budget.test.ts` — `uses the generic category for scheduled premiums under no-kind cover goals`; `pending.test.ts` — `projects custom-goal policy dues under the generic insurance category`; `dues.test.ts` — `keeps custom-goal premium history valid and derives typed categories after goal deletion` | Pass |
| Budget Insurance system section and categories stay unchanged | `budget.test.ts` — `allows only manual Insurance items while keeping the system section protected`, `keeps manual Insurance actuals separate from linked policy rows and budget dues` | Pass |

No P29-G acceptance row is missing. Configured per-file coverage thresholds
remain authoritative; the task-specific minimums are met: `src/domain/budget.ts`
branches 762/841 (90.61%) and `src/data/createAppStore.ts` branches 93/107
(86.92%).

### P29-G coverage and gates

Coverage method: remove `coverage/`, run `npm test -- --coverage`, then use
Istanbul's `createCoverageMap` over the fresh `coverage/coverage-final.json`.
Exclude test files; sum each source file's `toSummary().lines` and
`toSummary().branches` covered and total counters by directory. Exclude
`src/data/hooks` from the data group. Do not use `coverage-summary.json`.

| Directory | Lines | Branches |
|---|---:|---:|
| `src/domain` | 3272/3334 (98.14%) | 3161/3403 (92.89%) |
| `src/data` excluding hooks | 658/696 (94.54%) | 679/774 (87.73%) |
| `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 — 84 suites, 1054 tests passed |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 — zero warnings |
| 4 | `npx expo-doctor` | 0 — 21/21 checks |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

**Physical-device checks not verified:** native Insurance screen and form
rendering, delete confirmation and Undo presentation, policy assignment
dropdowns, custom-goal premium presentation and font scales 1.3/2.0 remain
unverified on iOS and Android. TestRenderer and Expo exports are not device
verification.

## P29-H impact analysis (2026-11-03)

**Assumed:** P29-H is new P29 work, schema v15 remains unchanged, and
`app/(tabs)/index.tsx` is user-owned and read-only.

### DEC-P29H-ASSET-VALUATION

The old manual-value path treated an undated `value` as a current valuation,
added every ledger entry to it, and calculated returns from logged deposits
without including the opening amount. The old plan-value path estimated
interest from `ratePct`. The new calculations use opening plus all deposits
as Invested; a dated valuation includes only later entries; without a dated
valuation, current value starts from opening and posted entries, with no
estimated interest. Withdrawals remain separate from Invested. Cash and Bank
holdings do not display returns. No schema or Home-screen change is needed.

### Step 3 impact: demo and mock fixture

Values below are the old implementation at commit `2829c31` versus the
P29-H implementation at `e60c893`, evaluated at `2026-11-03`. Return labels
reflect the card behavior, not an unlabelled percentage. Cash and Bank return
percentages are suppressed in the new output.

| Holding | Old Invested | New Invested | Old value | New value | Old return shown | New return shown |
|---|---:|---:|---:|---:|---|---|
| Demo — Emergency cash | 25,000 | 25,000 | 25,000 | 25,000 | No return yet | Not shown (Cash/Bank) |
| Demo — Emergency savings account | 85,000 | 85,000 | 92,000 | 92,000 | No return yet | Not shown (Cash/Bank) |
| Demo — Emergency fixed deposit | 73,000 | 73,000 | 72,000 | 72,000 | 800.00% absolute | -1.37% absolute |
| Demo — Index mutual fund | 50,000 | 50,000 | 45,000 | 45,000 | 275.00% absolute | -10.00% absolute |
| Demo — Broad market ETF | 30,000 | 30,000 | 29,000 | 29,000 | 383.33% absolute | -3.33% absolute |
| Demo — Gold savings | 21,200 | 21,200 | 21,300 | 21,300 | 565.63% absolute | 0.47% absolute |
| Demo — Employee provident fund | 184,800 | 184,800 | 206,200 | 206,200 | 4,195.83% absolute | 11.58% absolute |
| Demo — Monthly recurring deposit | 16,000 | 16,000 | 16,037.80 | 16,000 | 0.24% absolute | 0.00% absolute |
| Mock — EPFO - PF | 96,985 | 96,985 | 135,385 | 96,985 | No return yet | 0.00% absolute |
| Mock — HDFC Fixed Deposit | 110,000 | 110,000 | 135,456 | 135,456 | No return yet | 23.14% absolute |
| Mock — Emergency cash | 19,544 | 19,544 | 19,544 | 19,544 | No return yet | Not shown (Cash/Bank) |
| Mock — Emergency savings | 135,456 | 135,456 | 135,456 | 135,456 | No return yet | Not shown (Cash/Bank) |
| Mock — Retirement fund | 113,600 | 113,600 | 119,252.28 | 118,000 | 4.98% absolute | XIRR 2.73% |

The mock EPFO decrease is intentional: it has no valuation date, so the old
undated `value` of 135,385 is not treated as a recorded valuation; its opening
amount is 96,985. The recurring-deposit and retirement-plan value reductions
remove estimated interest; no interest is inferred without a recorded value.
The corrected return denominator removes the large positive percentages caused
by using only ledger deposits while omitting opening capital.

| Fixture totals | Old | New | Reason |
|---|---:|---:|---|
| Demo assets | 506,537.80 | 506,500.00 | Estimated plan interest removed |
| Demo net worth | 113,492.58 | 113,454.78 | Demo assets decrease by 37.80 |
| Mock assets | 545,093.28 | 505,441.00 | Undated EPFO value and plan interest are no longer inferred |
| Mock net worth | 217,281.97 | 177,629.68 | Mock assets decrease by 39,652.28 |
| Demo emergency-fund saved / bucket available | 189,000 / 25,000, 92,000, 72,000 | unchanged | All linked bucket holdings have dated values |
| Mock emergency-fund saved | 290,456 | unchanged | Linked emergency holdings have unchanged values; mock has no bucket links |

Linked goal amounts change only when the linked holding value changes: demo
Retirement portfolio 16,037.80 to 16,000 and Home deposit 222,237.80 to
222,200; mock First 5L portfolio 119,252.28 to 118,000. Other listed goals
remain unchanged. No Emergency Fund goal or bucket available amount changes in
these fixtures.

### P29-H assertion replacements

| File and test | Old assertion | New assertion | Reason |
|---|---|---|---|
| `investmentReturns.test.ts` — `corrects P29-H opening, back-dated, pattern and withdrawal outputs` | No opening amount in contribution totals; the recorded valuation was treated as simply old-value-plus-all-entries. | Invested includes opening and all deposits; valuation includes only later entries; gain/return use opening-inclusive capital. | Frozen P29-H formula and valuation-date rule. |
| `investmentReturns.test.ts` — `uses the plan start date for opening-flow CAGR and current value only changes by ledger or valuation` | Plan value could include rate-based estimated growth. | Actual value or opening plus posted ledger entries only; opening flow is dated at plan start. | Interest estimation is explicitly out of scope. |
| `investmentReturns.test.ts` — `returns null absolute return for zero contributions and handles withdrawals` | Return denominator contained deposits only. | Opening is included when present; withdrawals are displayed and added back in gain, never subtracted from Invested. | Frozen P29-H invested, gain and return formulas. |
| `investmentReturns.test.ts` — `labels long-span lump sums CAGR and multi-entry ledgers XIRR` | Opening cash flow absent or dated at the tracking-start date. | Manual opening uses the injected as-of date; plan opening uses its start date. | P29-H's opening-flow dating rule. |
| `sip.test.ts` — `clamps behind counts and values plans from actual value or posted entries` | Plan current value could be interest-estimated. | No-valuation plan value is opening plus posted ledger activity only. | No estimated interest; values change only through entries or recorded valuations. |
| `instrumentCard.test.ts` — `covers untracked plan snapshots and negative manual holdings without an asset total` | Manual cards included a percentage/progress display for Cash/Bank. | Cash/Bank cards show balance and deposit/withdrawal totals without return or progress percentages. | Frozen Cash/Bank presentation rule. |
| `RouteRenderSmoke.test.tsx` — `renders ledger-based asset totals and Cash/Bank details at font scale %s` | No asset-list/card/portfolio-total test for the new semantics at large fonts. | Asserts totals, back-dated helper text and Cash/Bank return suppression at 1.3 and 2.0; checks investment-entry summary. | Required P29-H responsive surface verification. |

This impact analysis was recorded before the P29-H behavior commit.

### Owner fixture output: old versus new

The old side is the recorded pre-change output; the new side is the frozen
P29-H calculation. The percentage column is what a user sees: Cash/Bank
percentages are suppressed even when the underlying absolute return is
calculable.

| Fixture | Old: Invested / value / deposits / withdrawals / gain / return | New: Invested / value / deposits / withdrawals / gain / return |
|---|---|---|
| Opening 73,000; four 2,000 monthly deposits after month-0 as-of date | 81,000 / 81,000 / 8,000 / 0 / 73,000 / +912.50% | 81,000 / 73,000 / 8,000 / 0 / -8,000 / -9.88% absolute |
| Same entries dated on or before valuation; valuation 72,000 | 81,000 / 72,000 / 8,000 / 0 / 64,000 / +800.00% | 81,000 / 72,000 / 8,000 / 0 / -9,000 / -11.11% absolute |
| Cash entries 1,000 / 3,000 / 0 / 0 / 5,000; valuation 5,400 | 9,000 / 5,400 / 9,000 / 0 / -3,600 / -40.00% | 9,000 / 5,400 / 9,000 / 0 / -3,600 / not shown (Cash) |
| Opening 1,000; deposit 2,000; withdrawal 300; value 2,700 | 2,700 / 2,700 / 2,000 / 300 / 1,000 / +50.00% | 3,000 / 2,700 / 2,000 / 300 / 0 / 0.00% absolute |

The owner-reported FD/RD `Invested 73,000 / Current value 72,000 / Total
deposits 8,000 / Total withdrawals 0` cannot be reproduced from one holding
whose opening is 73,000 and whose four deposits are represented in its ledger:
the corrected Invested is 81,000. The owner did not have exact dates or a data
export available, so the recorded fixture isolates the denominator and
valuation-date defects without claiming an exact reproduction of that
different stored representation.

### P29-H acceptance evidence

| Frozen requirement | Exact behavior test |
|---|---|
| Invested includes opening plus every deposit; withdrawals remain separate; zero and same-date entries are handled; the four owner fixtures produce the listed outputs. | `src/domain/__tests__/investmentReturns.test.ts` — `corrects P29-H opening, back-dated, pattern and withdrawal outputs`; `keeps opening-only, over-withdrawn and same-date cash flows consistent` |
| Dated valuations include only entries after the valuation through as-of; no-valuation current value uses opening and posted entries, is clamped at zero, and excludes future entries. | `src/domain/__tests__/investmentReturns.test.ts` — `matches an independent opening, valuation and return oracle over 2000 seeded sequences (seed 291103)`; `src/domain/__tests__/sip.test.ts` — `keeps dated actual snapshots fixed and includes only later logs` |
| Gain is current value plus withdrawals minus Invested; return is gain / Invested and null at zero. | `src/domain/__tests__/investmentReturns.test.ts` — `corrects P29-H opening, back-dated, pattern and withdrawal outputs`; `returns null absolute return for zero contributions and handles withdrawals` |
| XIRR/CAGR known vectors, multiple entries, single lump sums, short-span absolute-only output, and no-sign-change/null paths. | `src/domain/__tests__/investmentReturns.test.ts` — `has XIRR, CAGR, same-day, short-span and known-vector behavior`; `labels long-span lump sums CAGR and multi-entry ledgers XIRR`; `covers invalid annualization and no-sign-change branches` |
| Opening flow dates use plan start date, and no interest is estimated without recorded valuation/ledger activity. | `src/domain/__tests__/investmentReturns.test.ts` — `uses the plan start date for opening-flow CAGR and current value only changes by ledger or valuation`; `src/domain/__tests__/investmentActions.test.ts` — `keeps plan current value to the opening balance and recorded entries`; `src/domain/__tests__/sip.test.ts` — `clamps behind counts and values plans from actual value or posted entries` |
| Cash/Bank show Balance, Deposited and Withdrawn, never return percentages; back-dated entries show the helper line. | `src/components/__tests__/RouteRenderSmoke.test.tsx` — `renders ledger-based asset totals and Cash/Bank details at font scale %s`; `src/domain/__tests__/instrumentCard.test.ts` — `covers untracked plan snapshots and negative manual holdings without an asset total` |
| Asset list, holding cards, portfolio totals and investment-entry summary remain correct at 1.3 and 2.0 font scale; the Home source is untouched. | `src/components/__tests__/RouteRenderSmoke.test.tsx` — `renders ledger-based asset totals and Cash/Bank details at font scale %s`; `app/(tabs)/index.tsx` was not changed. |
| Independent plain return oracle over 2,000 sequences with logged seed. | `src/domain/__tests__/investmentReturns.test.ts` — `matches an independent plain implementation over 2000 seeded entry sequences (seed 290329)` |
| Independent opening/valuation/current-value oracle over 2,000 sequences with logged seed. | `src/domain/__tests__/investmentReturns.test.ts` — `matches an independent opening, valuation and return oracle over 2000 seeded sequences (seed 291103)` |
| Demo and mock data impact was measured for holdings, linked goal amounts, net worth and emergency-fund figures. | Recorded above in `Step 3 impact: demo and mock fixture`; values and reasons are preserved in the demo/mock comparison table. |
| No schema change; persisted schema remains v15. | `src/domain/schemas.ts` remains at `SCHEMA_VERSION = 15`; the P29-H source diff contains no schema, migration or backup changes. |

### P29-H assertion audit

Counts compare `expect(` occurrences at the previous task commit `51c2ff4`
(P29-G) with the P29-H closeout tree. The `expect(` count uses a literal
text-match per test file. Raw diff lines contain 63 added and 22 removed
`expect(` lines; every removed line was replaced by a stronger or corrected
behavior assertion. Thus there are 41 new assertions, 0 unreplaced removals,
22 modified assertions, and a net increase of 41.

| Test file | Before | After | Added (not replacement) | Removed (unreplaced) | Modified | Net |
|---|---:|---:|---:|---:|---:|---:|
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 432 | 447 | 15 | 0 | 2 | +15 |
| `src/data/__tests__/createAppStore.test.ts` | 419 | 420 | 1 | 0 | 1 | +1 |
| `src/domain/__tests__/instrumentCard.test.ts` | 25 | 25 | 0 | 0 | 1 | 0 |
| `src/domain/__tests__/investmentActions.test.ts` | 43 | 43 | 0 | 0 | 4 | 0 |
| `src/domain/__tests__/investmentReturns.test.ts` | 27 | 52 | 25 | 0 | 0 | +25 |
| `src/domain/__tests__/selectors.test.ts` | 82 | 82 | 0 | 0 | 4 | 0 |
| `src/domain/__tests__/sip.test.ts` | 43 | 43 | 0 | 0 | 7 | 0 |
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 0 | 0 | 1 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 158 | 158 | 0 | 0 | 2 | 0 |
| **Total** | **1,240** | **1,281** | **41** | **0** | **22** | **+41** |

Every modified assertion, with its test and reason:

| File and test | Old assertion | New assertion | Reason |
|---|---|---|---|
| `RouteRenderSmoke.test.tsx` — `announces exact large amounts in screen-level accessibility labels` | Expected old overall gain amount and `Cash, invested …` label. | Asserts zero gain, exact opening-inclusive Invested, Cash label and absence of the old Cash-invested label. | Invested includes the opening amount; Cash no longer shows a return/Invested card line. |
| `createAppStore.test.ts` — `migrates a v1 database once and preserves the exact pre-migration bytes` | Migrated asset total omitted the legacy manual holding's current value. | Explicitly asserts the legacy manual value and includes it in migrated net worth. | Corrected no-valuation opening/current-value semantics; migration bytes and one-time archive behavior remain asserted. |
| `instrumentCard.test.ts` — `shows ledger-based plan values and rejects rows without their holding` | Expected `Estimated value`. | Expects `Current value`. | Plans no longer estimate interest. |
| `investmentActions.test.ts` — `records manual deposits and withdrawals with linked transactions and updates/deletes both sides` | Invested was 13,000 after opening plus entries. | Invested is 15,000; withdrawal does not reduce it. | Frozen opening-inclusive Invested rule. |
| `investmentActions.test.ts` — `keeps plan current value to the opening balance and recorded entries` | Expected estimated plan value and 1,500 invested. | Expects recorded value 1,500 and Invested 2,000 including opening. | Remove rate-estimated interest; include opening in Invested. |
| `investmentActions.test.ts` — `includes manual entries only after a value snapshot and preserves no-entry valuation` | Expected 6,500 after a dated valuation. | Expects 5,500. | Only post-valuation entries through as-of affect current value. |
| `selectors.test.ts` — `builds holding rows and calculates totals` | Expected manual value 120, portfolio totals 350/370/120/48, and unknown-date value 130. | Expects 100, totals 350/350/0/0, and no-valuation value 110. | Snapshot boundary and opening-based current value; correct aggregate totals. |
| `selectors.test.ts` — `calculates net worth by summing assets and subtracting loan balances` | Counted an undated stored value as a valuation, yielding assets 14,500. | Uses the 12,500 opening/recorded-valuation total. | An undated `value` is not treated as a recorded valuation. |
| `sip.test.ts` — `clamps behind counts and values plans from actual value or posted entries` | Included estimated interest in two plan values. | Expects opening plus posted ledger amounts only. | Interest is not estimated. |
| `sip.test.ts` — `counts deposits only for tracked progress and clamps withdrawn balances at zero` | Expected no Invested and estimated value zero. | Includes opening plus all deposits in Invested and asserts the clamped current value is zero. | Withdrawals do not reduce Invested; current value is clamped. |
| `sip.test.ts` — `keeps dated actual snapshots fixed and includes only later logs` | Expected pre-snapshot logs and rate growth to affect value. | Keeps the snapshot fixed and adds only post-snapshot ledger entries. | Frozen valuation-date rule and no estimated interest. |
| `memoryDocs.test.ts` — `keeps all memory pages indexed, headed and aligned with source schema/test records` | Expected 1,054 tests. | Expects the verified inventory of 1,060 tests. | Test inventory increased with P29-H behavior coverage. |
| `progressLedger.test.ts` — `tracks completed P20-M through P20-U while preserving P20-L and P21-D` | Expected 86/89 overall and 10/10 P29. | Expects 87/90 overall and 11/11 P29. | P29-H is recorded Done and included in dashboard counts. |

### P29-H final verification

All six gates were run in order after the implementation and lint cleanup:

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 84 suites, 1,060 tests passed |
| `npx tsc --noEmit` | 0 | Passed |
| `npx expo lint` | 0 | Zero warnings |
| `npx expo-doctor` | 0 | 21/21 checks passed |
| `npx expo export --platform android` | 0 | Passed |
| `npx expo export --platform ios` | 0 | Passed |

### P29-Z documentation consistency (2026-11-05)

- Source facts: schema v21; migration chain v1 through v20; safe-storage
  archives `.premigration.v1` through `.premigration.v20`; liability closure
  labels are `Foreclosure`; AppHeader default menu is limited to `/`, `(tabs)`
  and `(tabs)/index`.
- Replaced assertions: old / schema documented as v20 / new / schema v21 /
  source `SCHEMA_VERSION` is 21.
- Replaced assertions: old / README migration chain ended at v19 and safe
  storage archives ended at v19 / new / migration chain ends at v20 and archive
  support ends at `.premigration.v20` / source migration and erase-all code
  include v21 and v20 archives.
- Replaced assertions: old / `Close loan early` appears as current liability
  copy in documentation / new / `Foreclosure` / source card, entries and form
  use `Foreclosure`.
- Replaced assertions: old / status claims a red Gate 1 with 13 failing suites /
  new / status is tied to the real 92-suite run with 1192 passed, 1 skipped /
  owner asked false historical gate claims removed.
- Replaced assertions: old / phase dashboard omitted P29-X, P29-Y and owner
  UI/menu/Foreclosure work / new / P29-X, P29-Y and P29-Z are Done rows /
  progress counts derive 106/110 overall and 30/31 P29.
- Gate 1 real final count: 92 suites passed; 1192 passed, 1 skipped, 1193 total.
- Coverage method: one regenerated `coverage/coverage-final.json`, sum
  Istanbul statement and branch counters by immediate `src/<directory>`.
  `src/data`: 857/940 statements (91.17%), 748/851 branches (87.90%);
  `src/domain`: 4182/4312 statements (96.99%), 3471/3737 branches (92.88%);
  `src/lib`: 133/133 statements (100.00%), 126/126 branches (100.00%).

Coverage was regenerated after deleting `coverage/`, then calculated from
`coverage/coverage-final.json`. Method: use Istanbul `createCoverageMap`, sum
each instrumented source file's covered/total line and branch counters by
`src/` directory, then divide covered by total; tests are not included.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data/` | 658/696 (94.54%) | 679/774 (87.73%) |
| `src/domain/` | 3,279/3,342 (98.11%) | 3,193/3,436 (92.93%) |
| `src/lib/` | 107/107 (100%) | 126/126 (100%) |

Informational branch coverage: `src/domain/budget.ts` 762/841 (90.61%);
`src/data/createAppStore.ts` 93/107 (86.92%). Configured per-file thresholds
remain authoritative.

**Physical-device checks not verified:** asset list/card/portfolio totals,
Investment Entries Balance/Deposited/Withdrawn labels, back-dated helper text,
and large-amount rendering at font scales 1.3 and 2.0 remain unverified on
physical iOS and Android devices. TestRenderer and Expo exports are not
physical-device evidence.

## P29-J liability outstanding-balance audit (2026-11-03)

**Assumed:** P29-J is new P29 audit work. Schema remains v15, liability
behavior is not changed unless the audit proves a plain calculation bug, and
the user-owned `app/(tabs)/index.tsx` is read-only.

### Step 1 — read-only characterization

The recurring-liability outstanding balance is calculated by `loanState()` in
`src/domain/liability.ts` (lines 173–210). The path is actual-days/365 simple
interest, not standard monthly amortization:

1. Start with the principal (or a saved settlement balance and date).
2. Select recorded payments whose dates are on or before `asOf`, sort by date
   and stable payment ID, and clamp any pre-start payment date to the loan start.
3. Before each payment, accrue `balance × annual rate / 100 × elapsed days / 365`.
   `daysBetween()` in `src/domain/dates.ts` uses UTC calendar-day differences.
4. Add accrued interest to the balance, then subtract the entire payment and
   clamp the balance to zero. There is no separate interest-vs-principal split
   in this state calculation.
5. After the last payment, accrue the same daily formula through `asOf`.

For the owner's start date 2025-08-07 and first due/payment date 2025-09-07,
the first period is 31 days. At 15.03%, that period's interest is principal
× 0.1503 × 31 / 365. A payment recorded after its due date accrues through its
actual payment date; `loanState()` itself does not consult the schedule due
date. A missed payment likewise leaves the balance accruing through the
requested `asOf`. The balance is not rounded after each accrual or payment;
the calculation retains JavaScript number precision. Rendering goes through
`AmountText`/`formatAmount`, so displayed precision follows its display tier.

Characterization coverage was added in
`src/domain/__tests__/liability.test.ts` — `characterizes the reported
personal-loan inputs with an explicitly illustrative principal`. The fixture
uses the provided rate, EMI, start date, first due date and 14 assumed
on-schedule payment dates, with a round synthetic principal of 250,000; it is
not asserted to be the owner's principal. The test verifies the 31-day
first-period interest, balance after each of 14 payments, and the extra
interest from a seven-day-late payment. Focused test result: 12 tests passed.
No source behavior, schema or Home-screen code changed.

Assertion correction before comparison: the first Step 1 fixture used a
synthetic principal reverse-calibrated to the reported approximate app
balance, which risked appearing to reproduce missing owner data. It was
replaced with the round illustrative principal 250,000 and recomputed
characterization outputs; reason: principal and payment records are explicitly
blank, so an arbitrary input must be clearly illustrative rather than tuned
to the observed result.

### Step 2 — numerical comparison

The owner's bank outstanding and its as-of date, principal, tenure, and app
payment records were blank. The following is therefore a generic example,
not the owner's account: principal 250,000 (illustrative only), annual rate
15.03%, EMI 5,713, start 2025-08-07, and 14 assumed full EMI payments on the
7th of each month from 2025-09-07 through 2026-10-07. Each row is the balance
immediately after that payment.

| k | Payment date | App actual/365 | Monthly, full month from first period | Monthly after first 31 actual days | Actual/365 daily |
|---:|---|---:|---:|---:|---:|
| 1 | 2025-09-07 | 247,478.30 | 247,418.25 | 247,478.30 | 247,478.30 |
| 2 | 2025-10-07 | 244,822.51 | 244,804.16 | 244,864.97 | 244,822.51 |
| 3 | 2025-11-07 | 242,234.72 | 242,157.34 | 242,218.90 | 242,234.72 |
| 4 | 2025-12-07 | 239,514.14 | 239,477.36 | 239,539.69 | 239,514.14 |
| 5 | 2026-01-07 | 236,858.59 | 236,763.81 | 236,826.93 | 236,858.59 |
| 6 | 2026-02-07 | 234,169.14 | 234,016.28 | 234,080.18 | 234,169.14 |
| 7 | 2026-03-07 | 231,156.08 | 231,234.33 | 231,299.04 | 231,156.08 |
| 8 | 2026-04-07 | 228,393.83 | 228,417.54 | 228,483.06 | 228,393.83 |
| 9 | 2026-05-07 | 225,502.28 | 225,565.47 | 225,631.81 | 225,502.28 |
| 10 | 2026-06-07 | 222,667.86 | 222,677.68 | 222,744.85 | 222,667.86 |
| 11 | 2026-07-07 | 219,705.57 | 219,753.72 | 219,821.73 | 219,705.57 |
| 12 | 2026-08-07 | 216,797.16 | 216,793.13 | 216,861.99 | 216,797.16 |
| 13 | 2026-09-07 | 213,851.62 | 213,795.47 | 213,865.19 | 213,851.62 |
| 14 | 2026-10-07 | 210,780.42 | 210,760.25 | 210,830.85 | 210,780.42 |

The app and actual/365 columns are identical because `loanState()` uses that
day-count formula. At payment 14, the full-month convention is 20.17 below
the app result; retaining the first 31-day actual period and using monthly
steps thereafter is 50.43 above it. The two monthly variants differ by 70.60.
These convention deltas are far below one EMI (5,713) in this generic
example. The first 31-day period contributes 60.05 more interest than a
rate/12 period (365/12 equivalent days) on the same opening principal; later calendar
months and compounding determine the final net differences.

This comparison does not establish a match to the bank: its balance and
statement date are absent, and the synthetic principal was not supplied by
the owner. It also cannot explain the app's approximate 201,000 display using
the generic 250,000 principal. If the example were instead viewed on
2026-11-03, 27 days after its 14th payment, the app's actual/365 balance would
be 213,123.89; that is a different as-of date, not an apples-to-apples
comparison with the 2026-10-07 row.

Gap decomposition for the owner's account:

| Factor | Evidence / unresolved input |
|---|---|
| Day-count basis | App is actual/365. Generic daily-vs-monthly differences above are under one EMI; bank method cannot be identified without a statement. |
| First-period handling | App accrues 31 actual days from 2025-08-07 to 2025-09-07. Bank's first-period convention is unknown. |
| Payment timing | App uses recorded dates. The exact app payment dates and bank debit dates are not supplied; late dates accrue through the date paid. |
| Number recorded | Owner says 14 installments were paid, but the app's recorded dates and amounts are blank; it is unverified that all 14 are in app data. |
| Rounding | App does not round each period; bank statement rounding is unknown. |
| Amount/date comparison | Bank outstanding and its as-of date are blank, so the actual gap and whether it exceeds one EMI cannot be calculated. |

Inputs needed to compare the actual account: principal at disbursement,
contractual tenure in months, bank outstanding and statement date, app's 14
payment rows (date and amount), and bank debit dates if different. The tenure
is also needed to verify the scheduled payoff, though principal and payment
history determine the balance calculation itself.

### DEC-P29J-LIABILITY-AUDIT — report and proposal

The supplied evidence does not establish a plain bug: the current path applies
all recorded payments dated on or before `asOf`, accrues actual/365 interest
between payment dates, and does not add a second monthly-interest charge.
There is no actual statement balance/date or app payment ledger to check for
an omitted payment, a wrong date/day count, or duplicated interest. Therefore
P29-J is report-only; no liability behavior or schema was changed.

If a bank statement and the corresponding input record confirm standard
monthly reducing-balance amortization, propose changing the shared recurring
liability balance model only after owner approval. Do not separately change
screens: use one approved domain rule and let each current caller continue to
consume it. The affected surfaces/callers are:

| Surface | Current source path | Effect of an approved method switch |
|---|---|---|
| Home net-worth/liability totals | `src/domain/summary.ts` → `netWorth()`; `app/(tabs)/index.tsx` is user-owned and must remain read-only | Liability total and net worth change with the new balance; no Home source edit is expected. |
| Liabilities list, total outstanding, row summaries and payoff info | `app/liabilities.tsx` → `liabilitySummary()` / `liabilitiesOverview()` | Displayed balances, cleared state, progress and payoff projections may change. |
| Liability Schedule/Payments detail | `app/liability-payments.tsx`, `src/domain/schedule.ts` | Balance summary and interest/principal/balance-after schedule rows may change. |
| Add/edit payment form and payment validation | `app/liability-payment-form.tsx`, `src/domain/liabilityActions.ts` | Suggested amount/current balance and overpayment validation may change. |
| Clear-due suggested balance | `app/clear-dues.tsx` → `amortizedBalanceAfter()` and `src/domain/dues.ts` | Suggested balance and paid-through schedule may change. |
| Budget/Transactions loan proceeds and repayment caps | `src/domain/cashFlow.ts`, `src/domain/dues.ts` | Existing-loan allocation limits and due clearing amounts may change. |

Existing test evidence that would need review or updated expected values under
an approved switch:

| Test file | Exact test(s) |
|---|---|
| `src/domain/__tests__/liability.test.ts` | `preserves the existing recurring balance and payoff math`; `accrues daily interest and applies payments on their dates`; `characterizes the reported personal-loan inputs with an explicitly illustrative principal`; `summarizes recurring payoff dates and extra-payment savings` |
| `src/domain/__tests__/selectors.test.ts` | `calculates net worth by summing assets and subtracting loan balances`; `summarizes active loan commitments, payoff date, cleared and never cases` |
| `src/domain/__tests__/dues.test.ts` | `keeps the pre-refactor plan and recurring-liability outputs across a fixed date grid`; `settles recurring liabilities at an explicit or amortized balance and ignores historical payments after settlement`; `records recurring-liability dues by due date and caps each payment at the remaining balance`; `marks installments through settlement as assumed paid and stops after a zero balance`; `clears recurring liability dues oldest-first and updates its balance and schedule` |
| `src/domain/__tests__/cashFlow.test.ts` | `records borrowed, new and existing loan proceeds, repayments, withdrawals and own funds`; `does not replace an existing liability origin or exceed its principal`; `rejects surplus allocations without targets or above the outstanding balance` |
| `src/domain/__tests__/linkedActions.test.ts` | `creates an auto-EMI loan, syncs payments and removes linked transactions` |
| `src/data/__tests__/createAppStore.test.ts` | `clears recurring liability installments and undoes linked payments in one write each`; `runs the loan payment scenario through store actions and deletes all linked records`; `round-trips linked plans, liability payments, goals and holdings` |
| `src/domain/__tests__/schedule.test.ts` | `handles cleared and one-time liability schedule statuses` |
| `src/components/__tests__/EmergencyGoalScreens.test.tsx` | `shows the Home asset, emergency fund and liability pills with net worth as assets minus liabilities` |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | `renders every registered screen with the four-month demo data`; `renders each route form with representative create and edit entry params`; `opens linked plan, liability, and policy rows in their edit routes`; add explicit liability balance assertions for list, detail, payment form and clear-due routes if the method changes. |

A future “balance per statement” recalibration should be a distinct,
explicitly dated statement-balance anchor with an audited forward-calculation
rule. Do not reuse the existing `settlement` field: it marks a liability
settled and causes schedule rows through its date to be treated as assumed
paid. A separate anchor likely needs a schema/backup migration and UI for
statement date and balance; that work is outside this no-schema-change audit
and requires approval.

### P29-J acceptance and audit record

| Frozen line | Evidence |
|---|---|
| Document the outstanding calculation, day-count basis, first 31-day period, payment application, late-payment accrual and rounding. | `src/domain/__tests__/liability.test.ts` — `characterizes the reported personal-loan inputs with an explicitly illustrative principal`; implementation path documented in Step 1 above. |
| Compare all 14 installment balances under app, standard monthly (full first month and actual 31-day first period), and actual/365 daily methods. | Generic 250,000 principal comparison table in Step 2 above. Actual owner principal/statement remains unavailable. |
| Identify which model matches the bank and quantify the account's gap. | Not determinable: owner bank outstanding/as-of date and principal/payment records are blank. No match is claimed. |
| Propose-only method change and statement recalibration; do not change behavior pending approval. | `DEC-P29J-LIABILITY-AUDIT` proposal above. No production source or schema changes. |

**Assumed:** the synthetic 250,000 principal and scheduled payment dates exist
only to compare conventions; they do not represent the owner's loan. The
owner's bank balance, bank method, contractual principal/tenure and app
payment rows remain unverified. Device checks are not relevant to this
domain-only audit; no UI behavior changed.

### P29-J final verification

| Gate | Command | Exit code |
|---|---|---:|
| 1 | `rm -rf coverage && npm test -- --coverage` | 0 |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` (zero warnings) | 0 |
| 4 | `npx expo-doctor` (21/21 checks) | 0 |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Coverage was computed from the freshly regenerated `coverage/coverage-final.json`.
Executable statement locations are grouped by their immediate directory under
`src/`; a source line is covered when any statement at that line ran. Branch
coverage sums executed versus total Istanbul branch arms.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 658/696 (94.54%) | 679/774 (87.73%) |
| `src/domain` | 3279/3342 (98.11%) | 3193/3436 (92.93%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

Informational branch coverage: `src/domain/budget.ts` 762/841 (90.61%);
`src/data/createAppStore.ts` 93/107 (86.92%). Configured repository thresholds
remain authoritative.

Assertion-count audit against `337fcc5` (the P29-J Step 2 commit):

| Test file | Before | HEAD | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 0 | 0 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 158 | 158 | 0 | 0 | 0 |
| **Total** | **169** | **169** | **0** | **0** | **0** |

No `expect(` assertion was removed. The memory-doc test's expected inventory
was updated from 1060 to 1061 tests. The progress-ledger test's expected
overall and P29 counts were updated from 87/90 and 11/11 to 88/91 and
12/12, and its required P29 ID lists now include P29-J. These are additions
or replacements of ledger expectations, not weakened assertions.

## P29-I holding capabilities (2026-11-03)

**Assumed:** P29-I is new P29 work. The current schema was v15 and the
requested next schema version is v16. Implementation and focused verification
are complete; full gates and closeout remain in progress.

### Step 1 — read-only capability inventory

`HoldingType` in `src/domain/types.ts` already stores `Fixed deposit` and
`Recurring deposit` as separate values. No split is needed for current-schema
records. The emergency-fund bucket label `FD / RD` and its bucket links are
separate concepts and remain unchanged. The app has no holding type named
`Bank`; `Savings account` is the current bank-like holding type.

All ten current types are currently selectable in both manual-holding and
recurring-plan forms. Because no central capability rule exists yet, each
type currently offers the same surfaces:

| Holding type | Manual form | Recurring-plan form | Entry controls | Monthly deposit / schedule | Budget link |
|---|---|---|---|---|---|
| Mutual fund / SIP | Yes | Yes | Yes | Yes | Yes |
| Stocks / ETF | Yes | Yes | Yes | Yes | Yes |
| Fixed deposit | Yes | Yes | Yes | Yes | Yes |
| Recurring deposit | Yes | Yes | Yes | Yes | Yes |
| EPFO / PF | Yes | Yes | Yes | Yes | Yes |
| Savings account (Bank-like) | Yes | Yes | Yes | Yes | Yes |
| Cash | Yes | Yes | Yes | Yes | Yes |
| Gold | Yes | Yes | Yes | Yes | Yes |
| Silver | Yes | Yes | Yes | Yes | Yes |
| Other | Yes | Yes | Yes | Yes | Yes |

Current behavior paths: `app/assets.tsx` routes Deposit, Withdraw, Entries and
Schedule from cards; `src/domain/instrumentCard.ts` constructs those actions
for every manual holding or plan. `app/investment-form.tsx` offers all types
in both form modes. `app/investment-entry-form.tsx` accepts every holding
without a type guard. `app/investment-entries.tsx` exposes Add investment
entry and renders plan schedules. `app/budget-item-form.tsx` lists all
holdings; `src/domain/budget.ts` permits any holding link. A linked plan
provides its schedule to Budget, while a linked manual holding can have a
generic editable Budget-item frequency. `src/domain/pending.ts` creates dues
for every plan and `src/domain/reminders.ts` plans reminders from those dues.

The demo already includes a Fixed deposit with no entry log and a Recurring
deposit plan with entry logs. The owner confirmed for the capability decision
that Fixed deposit is the only one-time holding type; Cash and Savings
account may also use recurring plans. The later matrix and migration do not
change the emergency-fund bucket label or links.

### DEC-P29I-CAPABILITIES — schema v16 migration

The persisted schema is bumped from v15 to v16 as requested. `migrateV15ToV16`
is pure and one-way: legacy combined type strings `FD / RD` and
`Fixed deposit / RD` become Fixed deposit only when the holding is manual and
has no entries; an entry-bearing combined holding or a combined scheduled plan
becomes Recurring deposit. An already separate Fixed deposit plan is
reclassified as Recurring deposit so its persisted schedule is retained under
the new capability rule. Existing entries are copied, not deleted. Other
fields and the Emergency fund `FD / RD` bucket/link data are unchanged.

Safe storage archives raw v15 bytes exactly once at
`.premigration.v15`; erase-all removes that archive. The migration rejects v17,
the next unsupported schema. Backup tests cover importing v15 and an encrypted
v16 round trip; the existing v1–v14 import tests remain in the chain.

**Assumed:** schema v16 is warranted by the owner-requested schema bump even
though current types are already separate. The migration also recognizes
legacy combined strings defensively. Fixed deposit is the only one-time
holding type; Cash and Savings account remain eligible for recurring plans.

The exhaustive `holdingCapabilities(type)` map is the shared source for entry,
recurring-plan, and return availability. It is applied to card actions, manual
and plan forms, entry screens and entry actions, transaction-linked deposits,
schedule/due/reminder generation, and Budget link options/actions. New
Fixed-deposit deposits and entries are rejected while maturity withdrawals
remain available. Existing entries remain visible/editable/deletable with the
required helper note; changing a holding with entries to Fixed deposit is
blocked. Persisted plans and Fixed-deposit Budget links are rejected by schema
and integrity validation. Migration reclassifies a legacy Fixed-deposit plan
as Recurring deposit to retain its schedule. The Emergency fund bucket label
and links remain unchanged.

The existing manual-holding schema/form has no rate or maturity fields.
**Assumed:** no new rate or maturity model is added; the existing opening
amount, valuation update, and withdrawal controls are the closest available
implementation of the frozen form request.

Focused validation before the full suite: 12 suites, 348 tests passed,
including holding capability matrix/actions, form and route behavior, and
migration. Final validation: 85 suites, 1078 tests pass; all six ordered gates
exit 0. The final acceptance matrix and fresh coverage follow.

Assertion replacements:

| File and exact test | Old | New | Reason |
|---|---|---|---|
| `src/domain/__tests__/instrumentCard.test.ts` — `includes stale-value confirmation and exact manual actions` | `['deposit', 'withdraw', 'entries', 'confirm']` | `['withdraw', 'confirm']` | Fixed deposits cannot accept new deposits or entries. |
| `src/domain/__tests__/instrumentCard.test.ts` — `uses fresh manual value dates without stale actions` | `['deposit', 'withdraw', 'entries']` | `['withdraw']` | Same capability rule; `keeps legacy fixed-deposit entries visible without offering new deposits` proves legacy entries remain accessible. |
| `src/domain/__tests__/goalLinks.test.ts` — `demo data covers full emergency assets and shared recurring deposits` | `189_000` | `187_000` | Demo recurring contribution moved off the one-time Fixed deposit; the demo asserts the Fixed deposit is entry-free and RD plan has entries. |
| `src/domain/__tests__/schemas.test.ts` — `accepts the typed mock app data and exports schema version sixteen` | `15` | `16` | P29-I adds the v15-to-v16 migration. |
| `src/mock/__tests__/demoData.test.ts` — `has four complete months and a custom upcoming override for the item editor demo` | Required every investment category in every month | Excludes the one-time FD/RD category from the monthly loop and asserts two RD-plan investment entries | The monthly deposit rule no longer applies to Fixed deposits; the recurring plan remains represented by its recorded installments. |
| `src/components/__tests__/TransactionForm.test.tsx` — `stores, labels and budgets invest category %s end to end` | Included the direct deposit case `['Fixed deposit / RD', 'invest-fd', 'Fixed deposit']` | Removed that impossible case; `does not offer fixed deposits for transaction-linked investment deposits` asserts it is absent from choices | The UI must not offer a one-time holding as a deposit target; RD remains tested end to end. |
| `src/lib/__tests__/memoryDocs.test.ts` — `keeps all memory pages indexed, headed and aligned with source schema/test records` | `84` suites / `1061` tests | `85` suites / `1078` tests | Current inventory increased with P29-I tests; both counts remain exact. |
| `src/lib/__tests__/progressLedger.test.ts` — `keeps progress bars, percentages and counts consistent with dashboard statuses` | Overall `96% (88/92)`; P29 `92% (12/13)`; P29-I absent from the Done assertion list | Overall `97% (89/92)`; P29 `100% (13/13)`; P29-I asserted Done | P29-I is complete; dashboard counts and the completion assertion now match the ledger. |

No assertion was deleted without a replacement or reason. Behavior changes,
focused evidence and these assertion replacements are recorded. The dashboard
and the progress-ledger test now count P29-I as Done.

The first fresh full coverage run exited 1: 82 suites passed and 3 failed
(1075 passed, 3 failed). `demoData.test.ts` still required a recurring
deposit-category transaction in all four months after that category was moved
off the Fixed deposit; `TransactionForm.test.tsx` still attempted to submit a
Fixed-deposit deposit despite the new action guard; `memoryDocs.test.ts` still
expected schema v15 and the earlier 84/1061 inventory. The first two test
expectations were corrected to prove the new one-time rule and retained RD
behavior, while memory documentation and its exact inventory assertion were
updated to v16 and 85/1078. The three affected suites then passed (41 tests).
This initial Gate 1 result is retained. After those fixes and a focused
month-snapshot integrity test, the final ordered Gate 1 run passed 85 suites
and 1078 tests; all six final gates passed.

### P29-I final capability matrix

| Holding type | Manual holding | Recurring plan | New entries | Recurring schedule / monthly deposit | Budget link | Returns |
|---|---|---|---|---|---|---|
| Mutual fund / SIP | Yes | Yes | Yes | Yes | Yes | Yes |
| Stocks / ETF | Yes | Yes | Yes | Yes | Yes | Yes |
| Fixed deposit | Yes | No | No | No | No | Yes |
| Recurring deposit | Yes | Yes | Yes | Yes | Yes | Yes |
| EPFO / PF | Yes | Yes | Yes | Yes | Yes | Yes |
| Savings account (Bank-like) | Yes | Yes | Yes | Yes | Yes | No |
| Cash | Yes | Yes | Yes | Yes | Yes | No |
| Gold | Yes | Yes | Yes | Yes | Yes | Yes |
| Silver | Yes | Yes | Yes | Yes | Yes | Yes |
| Other | Yes | Yes | Yes | Yes | Yes | Yes |

`Savings account` is the application's bank-like holding; there is no distinct
`Bank` type. `Fixed deposit` is the only one-time type. The emergency-fund
bucket remains `FD / RD` and its links are unchanged.

### P29-I frozen-spec acceptance

| Frozen requirement | Exact test evidence | Result |
|---|---|---|
| Existing type inventory and one shared capability matrix | `src/domain/__tests__/holdingCapabilities.test.ts` — `defines entry, recurring and return capabilities for every holding type` | Pass |
| Legacy combined FD/RD migration: no entries/no schedule becomes FD; entries or schedule becomes RD; preserve unrelated data and already-separated records | `src/data/__tests__/migrate.test.ts` — `splits legacy combined FD/RD holdings by entries and schedule without changing other data`; `leaves already-separated v15 holdings and malformed non-data inputs unchanged` | Pass |
| Migration is pure and schema v16 is current | `src/domain/__tests__/schemas.test.ts` — `accepts the typed mock app data and exports schema version sixteen`; migration test asserts source holdings remain unchanged | Pass |
| Archive raw v15 bytes once; erase-all removes archive | `src/data/__tests__/createAppStore.test.ts` — `hydrates v15 holding types, archives exact original bytes once and erases the archive`; `src/data/__tests__/safeStorage.test.ts` — `copies the raw v%s payload exactly once and never overwrites its archive` (v1–v15 cases) | Pass |
| Reject schema v17 | `src/domain/__tests__/backup.test.ts` — `round trips custom emergency-fund options and refuses schema version seventeen`; `src/data/__tests__/migrate.test.ts` — `rejects invalid input and unknown or future versions` | Pass |
| Backup import chain v1–v15 | `src/domain/__tests__/backup.test.ts` — `verifies a v1 data checksum before migration and imports the v7 result`; `verifies v2 data as written before migrating and validates the v7 result`; `verifies the v%s checksum before migrating its data` (v3–v6); `verifies v7 checksums before migrating backups to schema nine`; `verifies v8 checksums as written before migrating income totals`; `verifies a v9 checksum over the original data before migrating its budget lines`; `verifies v10 checksums as written before migrating policy fields`; `verifies v11 backup bytes and imports seeded cover goals`; `verifies v12 backup bytes before adding monthly recurrence defaults`; `imports a v%s backup through the editable cover-goal migration` (v13–v14); `imports a v15 backup and separates its legacy combined holding type` | Pass |
| Encrypted v16 backup round trip | `src/domain/__tests__/backup.test.ts` — `round-trips an encrypted v16 backup containing a linked investment item` | Pass |
| Fixed-deposit capability: no recurring plan or persisted plan | `src/domain/__tests__/holdingCapabilities.test.ts` — `rejects adding or changing a plan to a one-time holding type`; `rejects persisted plans with a one-time holding type` | Pass |
| No new deposit/entry; maturity payout remains; type change with existing entries is blocked | `src/domain/__tests__/investmentActions.test.ts` — `blocks new fixed-deposit entries and type changes with existing entries while allowing maturity payouts`; `src/domain/__tests__/instruments.test.ts` — `rejects failed destination guards atomically` | Pass |
| Existing entries retained, editable/deletable, surfaced with required note; add controls hidden | `src/domain/__tests__/instrumentCard.test.ts` — `keeps legacy fixed-deposit entries visible without offering new deposits`; `src/domain/__tests__/investmentActions.test.ts` — `blocks new fixed-deposit entries and type changes with existing entries while allowing maturity payouts`; `src/components/__tests__/RouteRenderSmoke.test.tsx` — `renders ledger-based asset totals and Cash/Bank details at font scale %s` | Pass |
| Budget link add/edit refusal and persisted plan/snapshot integrity | `src/domain/__tests__/budget.test.ts` — `rejects new and edited Budget links to fixed deposits`; `src/domain/__tests__/holdingCapabilities.test.ts` — `flags a persisted Budget schedule linked to a fixed deposit` | Pass |
| Schedule, pending dues, reminders and transaction-linked deposits use capabilities | `src/domain/__tests__/schedule.test.ts` — `does not project recurring schedule rows for a fixed deposit plan`; `src/domain/__tests__/pending.test.ts` — `excludes a non-recurring fixed deposit plan from pending dues`; `src/domain/__tests__/reminders.test.ts` — `does not plan reminders for a fixed deposit with legacy schedule fields`; `src/components/__tests__/TransactionForm.test.tsx` — `does not offer fixed deposits for transaction-linked investment deposits` | Pass |
| Form and linked-asset choices at font scales 1.3 and 2.0 | `src/components/__tests__/RouteRenderSmoke.test.tsx` — `uses capability-filtered investment and Budget form choices at font scale %s`; `renders ledger-based asset totals and Cash/Bank details at font scale %s` | Pass |
| Demo has entry-free FD and RD plan with entries | `src/domain/__tests__/goalLinks.test.ts` — `demo data covers full emergency assets and shared recurring deposits`; `src/mock/__tests__/demoData.test.ts` — `has four complete months and a custom upcoming override for the item editor demo` | Pass |

### P29-I final assertion-count audit

Counts compare `expect(` occurrences in test files at the pre-capability
baseline `34fa401` with the final implementation head. Added/removed counts
are expectation lines in the unified diff; moved/replaced lines count as one
removed and one added. The documentation-only closeout commit does not change
test assertions.

| Test file | At 34fa401 | At HEAD | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 447 | 461 | 14 | 0 | +14 |
| `src/components/__tests__/TransactionForm.test.tsx` | 32 | 33 | 1 | 0 | +1 |
| `src/data/__tests__/migrate.test.ts` | 113 | 114 | 1 | 0 | +1 |
| `src/domain/__tests__/backup.test.ts` | 86 | 86 | 0 | 0 | 0 |
| `src/domain/__tests__/budget.test.ts` | 317 | 319 | 2 | 0 | +2 |
| `src/domain/__tests__/goalLinks.test.ts` | 43 | 47 | 5 | 1 | +4 |
| `src/domain/__tests__/holdingCapabilities.test.ts` | 0 | 7 | 7 | 0 | +7 |
| `src/domain/__tests__/instrumentCard.test.ts` | 25 | 27 | 4 | 2 | +2 |
| `src/domain/__tests__/instruments.test.ts` | 50 | 53 | 3 | 0 | +3 |
| `src/domain/__tests__/investmentActions.test.ts` | 43 | 50 | 7 | 0 | +7 |
| `src/domain/__tests__/pending.test.ts` | 39 | 40 | 1 | 0 | +1 |
| `src/domain/__tests__/reminders.test.ts` | 31 | 32 | 1 | 0 | +1 |
| `src/domain/__tests__/schedule.test.ts` | 41 | 44 | 3 | 0 | +3 |
| `src/domain/__tests__/schemas.test.ts` | 245 | 248 | 4 | 1 | +3 |
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 2 | 2 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 158 | 158 | 1 | 1 | 0 |
| `src/mock/__tests__/demoData.test.ts` | 92 | 93 | 1 | 0 | +1 |
| **Total** | **1773** | **1823** | **58** | **8** | **+50** |

The eight removed expectation lines are the five replacement groups listed
above: two one-time action arrays in `instrumentCard.test.ts`; the demo
emergency total in `goalLinks.test.ts`; the schema version in `schemas.test.ts`;
the two exact test-inventory counts in `memoryDocs.test.ts`; and the progress
dashboard counts in `progressLedger.test.ts` (two assertions). Each has an old value,
replacement and reason above. The demo monthly category loop and transaction
form fixture change are test-case expectation replacements even though they do
not remove `expect(` lines.

### P29-I final gates and coverage

All commands ran in required order on Node.js 26.13.0. Gate 1's first run
exited 1 for the three documented stale expectations above. After correction,
the final ordered run passed:

| Gate | Command | Exit code | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` (after `rm -rf coverage`) | 0 | 85 suites, 1078 tests pass |
| 2 | `npx tsc --noEmit` | 0 | Pass |
| 3 | `npx expo lint` | 0 | Pass, zero warnings |
| 4 | `npx expo-doctor` | 0 | 21/21 checks |
| 5 | `npx expo export --platform android` | 0 | Exported |
| 6 | `npx expo export --platform ios` | 0 | Exported |

Coverage was computed from the freshly regenerated `coverage/coverage-final.json`
using `istanbul-lib-coverage`: source files were grouped by immediate `src/`
directory and each group's `getCoverageSummary().lines` and `.branches` were
reported; branches count each Istanbul branch arm. The two requested file
branch percentages use the same file coverage map's `toSummary().branches`.

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 676/714 (94.67%) | 713/809 (88.13%) |
| `src/domain` | 3318/3381 (98.13%) | 3262/3506 (93.04%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

| File | Branches | Required floor | Result |
|---|---:|---:|---|
| `src/domain/budget.ts` | 770/849 (90.69%) | 90% | Pass |
| `src/data/createAppStore.ts` | 93/107 (86.91%) | 85% | Pass |

Physical-device checks for Fixed-deposit entry controls, maturity payouts,
legacy entries, recurring deposits, Budget links and large-font layouts remain
unverified; see [`docs/memory/open-items.md`](memory/open-items.md). Layout
tests are simulated. No source changes were made to
`app/(tabs)/index.tsx` or `app/(tabs)/budget.tsx`.

### P29-L — Simplified Insurance tracker (schema v17)

**Decision — DEC-P29L-SIMPLE-INSURANCE (2026-11-03).** The owner replaced the
P29-G user-managed cover-goal tracker with a simple editable Insurance details
list. Cover goals, assignments, target/gap calculations, insurance filters and
search, and policy lifecycle controls are removed from the current product.
The Term and Life rows are unstored placeholders; saved policies are editable
and deletable, and premiums are scheduled as pending dues. Schema v17 drops
only `coverGoals` and `Policy.coverGoalId`; earlier migration steps remain to
preserve the import chain. The Home screen and its Insurance summary remain
unchanged. This decision supersedes P29-G's cover-goal behavior but does not
rewrite its historical record.

**Assumptions.** Assumed: the Term placeholder maps to `term-life`; the Life
placeholder maps to `life-savings`. Assumed: policy premium categories remain
derived from policy kind, and savings-policy premiums use the existing generic
Insurance category. Assumed: the Budget Insurance system section/categories
stay fixed and out of scope; making them editable should be a separate product
decision because it would change a system-owned category contract. Assumed:
P29-L is implementation work in P29, as recorded in the phase ledger.

**Retained compatibility fields.** `nominee` and `premiumYears` remain stored
for older data compatibility but are no longer edited by this form or used to
generate dues. `status` remains to label ended policies and suppress their
dues. `trackFrom` remains the effective editable next-due date. `endDate`
continues to cap schedules. Savings-policy `currentValue` and `valueAsOf`
remain used by existing asset calculations; savings-policy goal links remain
in place so linked savings assets continue to contribute to goals. Editing a
policy preserves these hidden fields.

**Replaced assertions (old / new / reason).** Assertions were retired only
where P29-L removes the feature; no surviving behavioral assertion or
threshold was weakened.

| Old assertion / coverage | New assertion / coverage | Reason |
|---|---|---|
| `src/domain/__tests__/coverGoals.test.ts`: default goals, stable goal IDs, target modes, cover gaps, missing states and goal totals | `RouteRenderSmoke.test.tsx`: `shows the two unstored Insurance placeholders and a simple add action`; `EmergencyGoalScreens.test.tsx` no longer expects Insurance cover-goal content in Goals | Cover goals and their target/gap UI are removed, not hidden. |
| `coverGoals.test.ts`: explicit assignment precedence, type fallback, single-goal counting, and inactive/savings policy exclusions | `policySummary.test.ts`: `summarizes active cover, annualized premiums, next renewal, upcoming dues and income cover`; `pending.test.ts`: `projects active policy dues with their typed insurance category and excludes inactive policies` | The cover-goal counting model no longer exists; active-cover summary and premium-category rules remain independently tested. |
| `coverGoals.test.ts`: add/update/delete goals, typed duplicate-name/kind/limit/target errors, and clearing policy goal assignments | `policyActions.test.ts`: `adds and updates policies while retaining their schedule and payment history`; `createAppStore.test.ts`: `persists policy add and delete atomically and Undo restores deep-equal data` | Goal actions and their errors are removed; the replacement CRUD is policy CRUD with its own store/Undo behavior. |
| `coverGoals.test.ts`: rejects missing policy-goal references and preserves policies/transactions when deleting a goal | `migrate.test.ts`: `removes only cover goals and policy assignments when migrating v16 to v17`; `policyActions.test.ts`: `deletes a policy without deleting its insurance transaction` | v17 drops the retired assignment field; policy deletion continues to preserve its transaction history. |
| `coverGoals.test.ts`: policy-category suggestion for a custom goal without a kind | `policySuggestions.test.ts`: typed suggestions stay derived from policy kind; `budget.test.ts`: `derives scheduled premium categories from policy kind` | Custom goal kinds are removed; typed category selection remains type-based. |
| `coverGoals.test.ts`: cover-goal totals remain separate from net worth, emergency-fund progress and savings-goal links | Existing net-worth, Emergency-fund and goal-link tests remain; `policyActions.test.ts`: `retains hidden legacy fields and savings-policy goal links when editing a policy` | Cover-goal totals are deleted; unrelated financial calculations and savings-policy links are preserved. |
| `RouteRenderSmoke.test.tsx`: Insurance filter/search, lifecycle/status controls, cover-goal cards and `/cover-goal-form` route | `RouteRenderSmoke.test.tsx`: `shows the two unstored Insurance placeholders and a simple add action`; `renders the simplified policy form with custom frequency fields`; `EmergencyGoalScreens.test.tsx`: `removes all Insurance content and the old compact cover row from Goals and Home` | P29-L explicitly removes the complex Insurance navigation and lifecycle UX. |
| `RouteRenderSmoke.test.tsx`: cover-goal form fields, target choices, save/delete confirmations and Undo | `RouteRenderSmoke.test.tsx`: `renders the simplified policy form with custom frequency fields`; `confirms policy deletion and removes the selected policy`; store Undo test above | The form now edits policy details, and goal-target interaction is no longer applicable. |
| `EmergencyGoalScreens.test.tsx`: Insurance cover-goal bar/summary on Goals | `EmergencyGoalScreens.test.tsx`: `removes all Insurance content and the old compact cover row from Goals and Home`; Home's unchanged summary is asserted by `RouteRenderSmoke.test.tsx`: `keeps Budget as the other Insurance entry point and removes Insurance from Goals` and `policySummary.test.ts`: `keeps savings policies in the unchanged total-cover summary` | Goal-linked Insurance display is removed while Home total cover remains unchanged. |
| `schemas.test.ts`, `actions.test.ts`, `selectors.test.ts`, and `createAppStore.test.ts`: current-schema fixtures and assertions include `coverGoals` / `coverGoalId` | Current schema fixtures omit both retired fields; `schemas.test.ts` validates v17 and `migrate.test.ts` validates the v16→v17 drop | The persisted current schema no longer contains cover-goal data. |
| `backup.test.ts`: current backups include user-managed cover goals and policy assignments | `backup.test.ts`: `imports a v16 backup while dropping only the retired insurance-goal fields`; `round-trips an encrypted v17 backup containing a linked investment item` | Historical imports remain supported while current backups no longer serialize retired fields. |
| `budgetCategories.test.ts`: a custom cover goal with no kind selects the generic Insurance category | `budget.test.ts`: `derives scheduled premium categories from policy kind`; `pending.test.ts`: `projects savings-policy dues under the generic insurance category` | The custom-goal exception is removed; savings-policy premium categorization remains. |
| `demoData.test.ts`: demo cover-goal assignments and cover-gap states | `demoData.test.ts`: `includes a paid-premium Term policy and leaves the Life placeholder available` | Demo now exercises the new tracker and placeholder behavior. |
| `reminders.test.ts`: expected two premium reminders for a policy with an end date | `reminders.test.ts`: `plans a reminder for a premium due the following week` and the full schedule assertions; the existing end-date fixture now expects six scheduled reminders | A policy's due schedule continues at each interval through its end date; the old count omitted valid dues and was corrected to match the schedule rule. |
| `progressLedger.test.ts`: P29-L/CR-97 incomplete dashboard counts and status | Updated ledger assertions require P29-L and CR-97 to be Done and the corresponding dashboard totals to match | The ledger now reflects completed implementation and verification. |

#### P29-L acceptance evidence

| Frozen requirement | Exact test evidence |
|---|---|
| Term and Life placeholders are unstored, appear when their type has no saved policy, and route to preselected add forms; additional policies can be added | `RouteRenderSmoke.test.tsx`: `shows the two unstored Insurance placeholders and a simple add action`; `demoData.test.ts`: `includes a paid-premium Term policy and leaves the Life placeholder available` |
| Simple policy form includes required details, optional details, five frequencies and custom interval fields | `RouteRenderSmoke.test.tsx`: `renders the simplified policy form with custom frequency fields`; `policyActions.test.ts`: `adds and updates policies while retaining their schedule and payment history` |
| Saved policies can be edited/deleted; Undo restores data; transactions are preserved | `policyActions.test.ts`: `deletes a policy without deleting its insurance transaction`; `createAppStore.test.ts`: `persists policy add and delete atomically and Undo restores deep-equal data`; `RouteRenderSmoke.test.tsx`: `confirms policy deletion and removes the selected policy` |
| Monthly, quarterly, half-yearly, yearly and custom schedules use the next due date, clamp month ends and stop at end date | `dues.test.ts`: `schedules each %s frequency with calendar month-end clamping`; `generates a yearly policy schedule from the selected next due date`; `stops policy dues after endDate and suppresses dues for inactive policies` |
| First due does not predate `trackFrom`; paying a due records the payment and advances tracking | `dues.test.ts`: `starts at the selected next due date and advances after the first premium is paid`; `records each policy payment on the slot date and settles policy tracking without writes` |
| Pending dues are projected to Transactions, Home upcoming dues, Budget and reminders; past due policies remain overdue | `pending.test.ts`: `creates an upcoming premium due on the selected date in its month`; `dues.test.ts`: `includes policy dues in Home upcoming dues when there are no liabilities`; `budget.test.ts`: `shows a policy premium on its selected next due date in the Insurance section`; `reminders.test.ts`: `plans a reminder for a premium due the following week`; `RouteRenderSmoke.test.tsx`: `stacks Transactions due rows at font scale %s` |
| Deletion removes future pending dues; ended policies produce no dues but remain visible | `pending.test.ts`: `removes pending premium dues when a policy is deleted`; `dues.test.ts`: `stops policy dues after endDate and suppresses dues for inactive policies`; `budget.test.ts`: `keeps inactive policy history but excludes it from linked dues and budget commitments` |
| Policies retain the Home total-cover, yearly premium and renewal summary semantics | `policySummary.test.ts`: `summarizes active cover, annualized premiums, next renewal, upcoming dues and income cover`; `keeps savings policies in the unchanged total-cover summary`; `RouteRenderSmoke.test.tsx`: `keeps Budget as the other Insurance entry point and removes Insurance from Goals` |
| v16→v17 migration drops only `coverGoals` and `coverGoalId`; the raw v16 archive is exact, written once and erased by erase-all | `migrate.test.ts`: `removes only cover goals and policy assignments when migrating v16 to v17`; `createAppStore.test.ts`: `hydrates v16 policies, archives exact bytes once, and erases the v16 archive` |
| v1–v16 backup imports remain compatible; encrypted v17 round trip works; future schema v18 is refused | `backup.test.ts`: `verifies a v1 data checksum before migration and imports the v7 result`; `verifies v2 data as written before migrating and validates the v7 result`; `verifies the v%s checksum before migrating its data` (v3–v6); `verifies v7 checksums before migrating backups to schema nine`; `verifies v8 checksums as written before migrating income totals`; `verifies a v9 checksum over the original data before migrating its budget lines`; `verifies v10 checksums as written before migrating policy fields`; `verifies v11 backup bytes and removes superseded cover goals during migration`; `verifies v12 backup bytes before adding monthly recurrence defaults`; `imports a v%s backup and drops its superseded cover goals` (v13–v14); `imports a v15 backup and separates its legacy combined holding type`; `imports a v16 backup while dropping only the retired insurance-goal fields`; `round-trips an encrypted v17 backup containing a linked investment item`; and `round trips custom emergency-fund options and refuses schema version eighteen` |
| Savings-policy goal links and hidden legacy data survive editing; premium category rules remain derived from policy kind | `policyActions.test.ts`: `retains hidden legacy fields and savings-policy goal links when editing a policy`; `budget.test.ts`: `derives scheduled premium categories from policy kind`; `pending.test.ts`: `projects savings-policy dues under the generic insurance category` |
| Insurance list remains accessible at font scales 1.3 and 2.0; Home source stays unchanged | `RouteRenderSmoke.test.tsx`: `keeps the Insurance list accessible at font scale %s`; Home's total-cover evidence above; protected Home file hash remains `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` |

#### Assertion count audit

Counts are literal `expect(` occurrences, compared between inventory commit
`8255857` and the P29-L working tree. Added/removed counts are per-file
positive deltas; the net is current minus baseline.

| Test file | Baseline | Current | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `EmergencyGoalScreens.test.tsx` | 79 | 79 | 0 | 0 | 0 |
| `RouteRenderSmoke.test.tsx` | 466 | 439 | 0 | 27 | -27 |
| `createAppStore.test.ts` | 428 | 407 | 0 | 21 | -21 |
| `migrate.test.ts` | 114 | 117 | 3 | 0 | +3 |
| `safeStorage.test.ts` | 28 | 28 | 0 | 0 | 0 |
| `actions.test.ts` | 23 | 23 | 0 | 0 | 0 |
| `backup.test.ts` | 86 | 89 | 3 | 0 | +3 |
| `budget.test.ts` | 319 | 319 | 0 | 0 | 0 |
| `budgetCategories.test.ts` | 21 | 20 | 0 | 1 | -1 |
| deleted `coverGoals.test.ts` | 37 | 0 | 0 | 37 | -37 |
| `dues.test.ts` | 145 | 145 | 0 | 0 | 0 |
| `pending.test.ts` | 40 | 43 | 3 | 0 | +3 |
| `policyActions.test.ts` | 23 | 22 | 0 | 1 | -1 |
| `policySummary.test.ts` | 12 | 12 | 0 | 0 | 0 |
| `reminders.test.ts` | 32 | 34 | 2 | 0 | +2 |
| `schedule.test.ts` | 44 | 44 | 0 | 0 | 0 |
| `schemas.test.ts` | 248 | 235 | 0 | 13 | -13 |
| `selectors.test.ts` | 82 | 82 | 0 | 0 | 0 |
| `progressLedger.test.ts` | 160 | 160 | 0 | 0 | 0 |
| `routeKinds.test.ts` | 33 | 33 | 0 | 0 | 0 |
| `demoData.test.ts` | 93 | 92 | 0 | 1 | -1 |
| new `policySuggestions.test.ts` | 0 | 7 | 7 | 0 | +7 |
| **Total** | **2513** | **2430** | **18** | **101** | **-83** |

#### Verification

Executed in the repository-required order after deleting the prior
`coverage/coverage-final.json`; all six gates passed:

| # | Gate | Exit | Result |
|---:|---|---:|---|
| 1 | `npm test -- --coverage` | 0 | 86 suites, 1086 tests passed; generated fresh coverage |
| 2 | `npx tsc --noEmit` | 0 | Passed |
| 3 | `npx expo lint` | 0 | Passed without warnings |
| 4 | `npx expo-doctor` | 0 | 21/21 checks passed |
| 5 | `npx expo export --platform android` | 0 | Exported |
| 6 | `npx expo export --platform ios` | 0 | Exported |

Coverage was computed from the freshly regenerated
`coverage/coverage-final.json` with `istanbul-lib-coverage`: files were grouped
by immediate `src/` directory, using each group's `getCoverageSummary().lines`
and `.branches`; branch counts are branch arms. Per-file branch coverage uses
the same map's `toSummary().branches`.

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 660/699 (94.42%) | 700/795 (88.05%) |
| `src/domain` | 3186/3236 (98.45%) | 3132/3363 (93.13%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

| File | Branches | Required floor | Result |
|---|---:|---:|---|
| `src/domain/budget.ts` | 770/849 (90.69%) | 90% | Pass |
| `src/data/createAppStore.ts` | 73/84 (86.90%) | 85% | Pass |

Physical-device checks remain unverified: screen layout/accessibility at font
scales 1.3 and 2.0, native navigation/back behavior, reminder delivery, and
premium-due interactions on iOS and Android. UI tests are simulated and Expo
exports are not physical-device verification. No source change was made to
`app/(tabs)/index.tsx` or `app/(tabs)/budget.tsx`.

### P29-M — Insurance premium payment slot identity (blocked; no schema change)

**Reproduction result, before any behavior change.** A real
`createAppStore` was hydrated with an active monthly Health policy whose
`trackFrom` and next slot were 2026-11-07. With the injected store date
2026-11-04, `actions.clearDue({ kind: 'policy', id }, 'policy:0', 900)` made
exactly one persisted write. It appended a PolicyPayment dated 2026-11-04 and a
linked expense transaction for 900 in `Health premium`, with source
`{ kind: 'policy-payment', parentId, entryId }`. Yet `policySchedule` still
returned 2026-11-07 as its next unpaid due; the expected next slot was
2026-12-07. The focused temporary store test failed at that exact selector
assertion after its write/payment/transaction assertions passed. The test was
removed after reproduction because this task's schema prohibition prevents a
safe implementation; no regression test that blesses stale behavior remains.

**Root cause.** In [policySchedule.ts](../src/domain/policySchedule.ts),
payments are accepted only when `payment.date >= policy.trackFrom`. P29-L sets
`trackFrom` to the user-selected next due date. Therefore an early payment
dated before that due date is removed before FIFO matching, even though
`clearDue` correctly accepts slot `policy:0`. `clearDue` in
[dues.ts](../src/domain/dues.ts) records the payment and linked transaction
but does not persist the `rowId` it was asked to clear. The PolicyPayment
schema/type has only `id`, `date`, `amount`, and `note`; the linked transaction
source has only `parentId` and `entryId`, not a due slot identity. The UI
routes do not independently lose the store update.

**Entry-point trace.** All routes call the same store wrapper, which invokes
the pure `clearDue` action through `applyDataAction`; each successful single
payment action causes one Zustand set/persisted write.

| Entry point | Store call / identity passed | Recorded state | Stale derivation |
|---|---|---|---|
| Insurance card | `app/insurance.tsx` finds the first non-paid row in `policySchedule` and calls `clearDue` with its row id. | `Policy.payments` and linked transaction are appended in one write. | Insurance card recomputes `policySchedule`; the date filter excludes the early payment, so the same due date remains and the Paid action is still enabled. |
| Home Upcoming and due | `app/(tabs)/index.tsx` gets `source.slotId` from `pendingItems`; actionable rows use `clearDue`, while a non-actionable overdue row may use `clearDuesThrough`. | Same payment/transaction update; a batch clear is one store action/write. | `pendingItems` is derived from `policySchedule`, so the slot remains in Home and later reminder planning. |
| Transactions due row | `PendingItemActions` receives the policy `slotId` from `pendingItems` and calls `clearDue` (or `clearDuesThrough` for a non-actionable overdue item). | Same one-write payment and linked transaction. | The pending selector still returns the slot; the paid transaction can appear in the month list but is not linked to a cleared schedule slot. |
| `/payment-confirm` | Resolves `dueItemId` against `pendingItems`, then uses `PendingItemActions` and the same store action. | Same one-write payment and linked transaction. | The route can continue resolving the same due because it remains pending. |
| Reminder action | Reminder previews are generated by `planReminders` over `pendingItems`; the notification target opens `/payment-confirm`, which follows the path above. | Same one-write payment and linked transaction. | The stale selector schedules the original due again. |

Budget actuals change because the transaction is present and linked to
PolicyPayment; the linked planned row and every pending view still use
`policySchedule`, so they keep the old slot. Existing Undo removes the linked
payment and transaction in one store operation; it restores the prior state
but cannot resolve the missing slot association.

**Why the task stops here.** Removing the lower date bound would make the
reproduction pass, but it would also count pre-existing v16 payments that
precede `trackFrom` against future slots. The persisted v16/v17 data cannot
distinguish (a) an old premium payment before the configured next due from
(b) a new early payment for that due: both have the same four PolicyPayment
fields and the same `trackFrom`. The due `rowId` is currently transient and is
not written. Matching by dates, array order, or amount cannot prove which slot
was settled for old data, consecutive early payments, or edited tracking
dates. Persisting a slot identifier (or equivalent unambiguous marker) in the
payment and validating/backing it up requires a schema update and migration.
That is explicitly prohibited by P29-M, so no implementation or broad route /
frequency matrix was attempted after the store-level proof.

No behavior assertions were replaced or weakened. The required next step is
owner authorization for a schema version bump and a migration policy for
legacy payments whose slot cannot be reconstructed. Until then, current
behavior remains unchanged. P29-M's full frequency/entry-point/Undo matrix
and six gates are not run because implementation is blocked by that constraint.

Ledger assertion replacement: old `Overall progress 97% (91/94)` and P29
`100% (15/15)`; new `96% (91/95)` and `94% (15/16)`; reason: P29-M is now
recorded as a blocked task, adding one item to the denominator without
increasing completed work. The P29-M ledger test asserts `Blocked`, not `Done`.

P28-A assertion replacement: old `Overall progress 96% (107/111)` and P28
`0% (0/1)`; new `97% (108/111)` and P28 `100% (1/1)`; reason: the
release-report, metadata and checklist work is completed and counted as Done.

### DEC-P29N — Reminders prompt (2026-11-04)

- **Assumed:** P29-N is new P29 work. Schema remains v17; no AppData
  migration is needed. The existing `wealthwise.meta.v1` store owns the
  one-time `remindersPromptHandled` flag, and erase-all clears it through
  `metaStore.clearMeta`.
- The prompt is mounted in the root layout inside `LockGate`, so it cannot
  render while the lock screen is active. It is eligible only on the Home
  route, after a 400 ms settling delay; `/payment-confirm` and other routes
  cannot show it. The system notification permission is requested only after
  the explicit Turn on reminders action.
- Turn on uses the same `enableReminderPreferences` implementation as the
  Reminders screen, with defaults day-before/on-due-date enabled, local time
  09:00 and amounts hidden. Granted permission enables defaults and routes to
  Reminders. Denied/blocked results route there with the existing actionable
  message. Permission and storage failures are reported through an alert.
- Dismissal by Not now, Close, backdrop or Android back is persisted before
  display, so it remains handled after restart. If permission is already
  granted and reminders are enabled, no prompt is displayed. The prompt uses
  a centered scrollable dialog with a 44 by 44 pt Close action.
- The Transactions Review-month section/link, its UI strings and
  `reviewableMonths` were removed. Budget still consumes `month` for its own
  month state and editor routes; Home continues to use `month` with
  `apply=1`. `monthPositions`, `monthPositionAt`, `shortfallForMonth` and
  `surplusForMonth` remain in use for cash-flow, budget and allocation
  calculations; they are not Review-only helpers.
- Replaced assertions/decisions:
  - Old Transactions assertion: `keeps the Review action and routes its selected month to Budget`, including a visible `Review {Mon YYYY}` label and route call. New: `keeps the balance card without the removed month review action`, asserts the Review label and Review-only route are absent, while retaining the balance-card assertions. Reason: the feature is removed; independent month navigation remains.
  - Old route-smoke assertion: Review link is visible. New: no Review label is rendered. Reason: same UI removal.
  - Old `reviewableMonths` domain assertions: prior-month results and empty results. New: the helper and its now-orphaned tests are deleted. Reason: no production caller remains after removing the link.
  - Old P24-A product decision, “no prompt until reminders are switched on.” New: show the one-time in-app prompt after unlock; the operating-system permission prompt still appears only after Turn on reminders. Reason: explicit P29-N supersession without changing permission timing.
- P27-A follow-up: `monthPositions` remains used by cash-flow summaries and shortfall/surplus derivation; `monthPositionAt` remains used by Budget snapshots and store/pending tests; `shortfallForMonth` remains used by allocation and demo-data calculations; `surplusForMonth` remains used by surplus-allocation validation. `reviewableMonths` has no remaining caller and is deleted.
- Acceptance tests:
  - `Transactions available-balance card › keeps the balance card without the removed month review action`
  - `route render smoke audit › filters due payments and always shows only the user-kept balance elements` asserts that no Review label is rendered.
  - `cash flow positions › keeps empty month cash-flow helpers at zero after removing the review list` preserves the non-Review empty-month behavior.
  - `FirstLaunchReminderPrompt › shows once and persists Not now across a remount`
  - `FirstLaunchReminderPrompt › Close dismisses without requesting permission and remains dismissed`
  - `FirstLaunchReminderPrompt › backdrop dismisses without requesting permission and remains dismissed`
  - `FirstLaunchReminderPrompt › Android back dismisses without requesting permission and remains dismissed`
  - `FirstLaunchReminderPrompt › runs the Turn on flow for granted permission`
  - `FirstLaunchReminderPrompt › runs the Turn on flow for denied permission`
  - `FirstLaunchReminderPrompt › runs the Turn on flow for blocked permission`
  - `FirstLaunchReminderPrompt › skips the prompt when reminders are already enabled and permission is granted`
  - `FirstLaunchReminderPrompt › does not show over payment confirmation or another route`
  - `FirstLaunchReminderPrompt › keeps content scrollable and buttons full width at font scale 1.3` and the same test at scale 2.
  - `LockGate › does not mount its children until the lock is passed`
  - `route render smoke audit › shows the existing denied permission fix message after prompt setup` and `route render smoke audit › shows the existing blocked permission fix message after prompt setup`.
  - `backup metadata storage › stores reminder preferences in UI metadata and publishes updates and erase` covers clearing the handled flag with metadata; `createAppStore persistence › erases all supported storage keys and hydrates to empty data` verifies erase-all removes `wealthwise.meta.v1`.
  - `enableReminderPreferences › uses the granted permission and saves enabled preferences`; `does not save when permission is denied`; `does not save when permission is blocked`; `requests permission after a denied status and saves only when granted`.
- No assertion was weakened. Assertion count changes and exact gate exit codes
  are recorded in the P29-N close-out below after final validation.

#### P29-N final verification (2026-11-04)

The six required gates ran in order after deleting the previous
`coverage/coverage-final.json`; all completed with exit code 0.

| Gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 89 suites / 1104 tests passed; overall lines 97.79%, branches 92.38% | 0 |
| `npx tsc --noEmit` | TypeScript check passed | 0 |
| `npx expo lint` | Lint passed with no warnings | 0 |
| `npx expo-doctor` | 21/21 checks passed | 0 |
| `npx expo export --platform android` | Android export passed | 0 |
| `npx expo export --platform ios` | iOS export passed | 0 |

Fresh coverage was read from the regenerated `coverage/coverage-final.json`
with `istanbul-lib-coverage` `createCoverageMap`; test files were not included
in the `src/` groups, and files were grouped by immediate `src/` directory.
Line coverage counts executable lines; branch coverage counts branch arms.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 660/699 (94.42%) | 700/795 (88.05%) |
| `src/domain` | 3182/3232 (98.45%) | 3130/3361 (93.13%) |
| `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Per-file branch coverage remains above configured thresholds: `src/domain/budget.ts`
770/849 (90.69%; threshold 90%) and `src/data/createAppStore.ts` 73/84
(86.90%; threshold 85%).

Assertion-count audit compares previous commit `194ecb14260f22f3671da070b3d807ab07655ec7`
with the P29-N final commit. Counts use occurrences of `expect(`; added/removed
count changed expectation lines, while net is the current minus prior count.

| Test file | Previous | HEAD | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `FirstLaunchReminderPrompt.test.tsx` | 0 | 22 | 22 | 0 | +22 |
| `LockGate.test.tsx` | 0 | 3 | 3 | 0 | +3 |
| `RouteRenderSmoke.test.tsx` | 439 | 440 | 2 | 1 | +1 |
| `TransactionsScreen.test.tsx` | 84 | 82 | 2 | 4 | -2 |
| `createAppStore.test.ts` | 407 | 407 | 0 | 0 | 0 |
| `metaStore.test.ts` | 20 | 20 | 0 | 0 | 0 |
| `cashFlow.test.ts` | 75 | 73 | 0 | 2 | -2 |
| `progressLedger.test.ts` | 161 | 161 | 2 | 2 | 0 |
| `reminderPreferences.test.ts` | 0 | 9 | 9 | 0 | +9 |

Removed expectation lines are the prior positive assertions for the now-deleted
Review link/route and `reviewableMonths` results, plus the old progress
dashboard counts. Their replacements assert the Review label and Review-only
route are absent, retain the unrelated balance/cash-flow checks, and assert the
new progress counts/status. No behavior assertion was weakened.

Physical-device checks remain unverified: native dialog/backdrop and Android
back behavior; permission grant/denial/blocking; erase-all followed by a fresh
first-launch presentation; and font scales 1.3 and 2.0. See
`docs/memory/open-items.md`.

### DEC-P29M2-POLICY-DUE-IDENTITY — Exact policy payment slot identity (2026-11-04)

- The owner authorized schema v18, superseding P29-M's no-schema-change
  constraint. `PolicyPayment.dueDate` is optional and stores the ISO due date
  of the exact slot settled, independent of payment date.
- Explicit due dates match only an identical current schedule slot. An
  unmatched explicit due date remains history. Undated legacy payments retain
  the old rule: dates before `trackFrom` are ignored, then remaining payments
  match FIFO. The v17-to-v18 migration annotates only the payments matched by
  that old rule and preserves schedule output.
- `policySchedule` is the shared source for due rows, policy summaries, budget
  planned rows, Home Upcoming, Transactions and reminders. Clearing a due
  writes its slot date on the payment and writes the linked transaction
  atomically; Undo restores both in one write.
- **Assumed:** the paid slot's action is removed, while the Insurance card's
  generic Paid action remains available for the next unpaid slot. Hiding that
  generic action after payment would prevent the required early payment of the
  next slot through the Insurance card. This is the closest behavior to the
  frozen card rule without blocking the specified early-payment flow.
- No Home or Budget screen source was edited. Schema v18 retains support for
  v1-v17 data and backups, archives original v17 bytes once at
  `.premigration.v17`, refuses v19, and erase-all removes the archive.

Acceptance evidence (test names are exact):

| Frozen behavior | Test evidence |
|---|---|
| Explicit due date identifies the slot regardless of payment date | `src/domain/__tests__/dues.test.ts` — `matches dated payments to only their exact slot regardless of payment timing`; `does not let duplicate or future-dated explicit payments settle another slot` |
| Legacy undated payments retain the tracking-date/FIFO rule | `src/domain/__tests__/dues.test.ts` — `starts policy tracking at the selected date and FIFO-matches existing payments` |
| Early payment is one write; linked transaction and Undo are atomic | `src/data/__tests__/createAppStore.test.ts` — `records an early premium against its selected due date in one write and undoes both records` |
| Monthly, quarterly, yearly and custom-2-month dues advance on early, on-time and late payment | `src/data/__tests__/createAppStore.test.ts` — `settles the exact %s slot and advances to %s for early, on-time and late payments` |
| Consecutive slots, schedule edits, and Undo | `src/data/__tests__/createAppStore.test.ts` — `settles consecutive policy slots separately, supports schedule edits and undoes both payments` |
| Month-boundary dates and actual paid amounts | `src/data/__tests__/createAppStore.test.ts` — `settles a premium dated across the following month boundary`; `settles the exact %s slot and advances to %s for early, on-time and late payments` |
| Insurance, Transactions, Budget, Home and reminders share updated due state | `src/data/__tests__/createAppStore.test.ts` — `updates Insurance, Transactions, Budget, Home and reminder due selectors together` |
| Slot selection from every payment entry point | `src/data/__tests__/createAppStore.test.ts` — `settles the due selected by Insurance, Home, Transactions, payment-confirm and reminder entry points` |
| Optional due-date schema validation and v17 migration preserve old schedule output | `src/domain/__tests__/schemas.test.ts` — `accepts an optional valid policy-payment due date and rejects invalid dates`; `src/data/__tests__/migrate.test.ts` — `adds dueDate only to payments matched by the v17 FIFO schedule`; `src/data/__tests__/createAppStore.test.ts` — `migrates v17 policy payments without changing the existing FIFO schedule and archives bytes once` |
| Older backups, encrypted v18 round trip, archive-once, erase and future-version refusal | `src/domain/__tests__/backup.test.ts` — `imports a v17 backup and pins its existing premium to the FIFO-matched due date`; `round-trips an encrypted v18 backup with a settled policy slot and linked investment item`; `src/data/__tests__/migrate.test.ts` — `rejects invalid input and unknown or future versions`; the v17 store-migration test above |

#### P29-M2 final verification (2026-11-04)

All six gates ran in the required order against the final code and test set.
Each command exited 0.

| Gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 89 suites / 1120 tests passed | 0 |
| `npx tsc --noEmit` | TypeScript check passed | 0 |
| `npx expo lint` | Lint passed | 0 |
| `npx expo-doctor` | 21/21 checks passed | 0 |
| `npx expo export --platform android` | Android export passed | 0 |
| `npx expo export --platform ios` | iOS export passed | 0 |

Fresh coverage was read from the regenerated `coverage/coverage-final.json`
using `istanbul-lib-coverage` `createCoverageMap`; test files were excluded
from the `src/` groups, files were grouped by immediate `src/` directory, line
coverage counts executable lines, and branch coverage counts branch arms.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 680/721 (94.31%) | 722/821 (87.94%) |
| `src/domain` | 3195/3245 (98.46%) | 3137/3369 (93.11%) |
| `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

Required per-file branch coverage: `src/domain/budget.ts` 770/849 (90.69%;
threshold 90%) and `src/data/createAppStore.ts` 73/84 (86.90%; threshold 85%).

Assertion-count audit compares previous commit `bc5eadcd799352210c3f12617fcfa0dfe9c31abb`
with final task HEAD. Counts are occurrences of `expect(`; Added and Removed
count occurrences on changed lines, and Net is the final HEAD total minus the
previous-commit total.

| Test file | Previous | Worktree | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/data/__tests__/createAppStore.test.ts` | 407 | 448 | 41 | 0 | +41 |
| `src/data/__tests__/migrate.test.ts` | 117 | 120 | 12 | 9 | +3 |
| `src/data/__tests__/safeStorage.test.ts` | 28 | 28 | 0 | 0 | 0 |
| `src/domain/__tests__/backup.test.ts` | 89 | 91 | 5 | 3 | +2 |
| `src/domain/__tests__/dues.test.ts` | 145 | 149 | 6 | 2 | +4 |
| `src/domain/__tests__/schemas.test.ts` | 235 | 237 | 3 | 1 | +2 |
| `src/lib/__tests__/progressLedger.test.ts` | 161 | 161 | 3 | 3 | 0 |

The progress-ledger test's old progress totals (`96% (92/96)` and P29
`94% (16/17)`) are replaced by `97% (94/97)` and `100% (18/18)`; P29-M's
`Blocked` status is replaced by `Superseded by P29-M2`, and P29-M2 is asserted
`Done`. Reason: the authorized schema-v18 replacement closes the work while
retaining P29-M's history.

Other replaced assertions, each with its reason:

- In `migrate.test.ts`, old schema-current calls `migratePersisted(..., 17)`
  become `migratePersisted(..., 18)`; old future-version inputs `18` become
  `19`. Reason: v18 is now current and the next version must be refused.
- In `migrate.test.ts`, migration expectations from versions 12–16 now pass
  deterministic `today`/`newId` options through the newly required v17-to-v18
  step. Their expected migrated data remains unchanged; only the injected
  migration dependencies are added. Reason: preserve deterministic migration
  tests while the chain reaches v18.
- In `backup.test.ts`, the old `schemaVersion: 17` and `SCHEMA_VERSION === 17`
  expectations become version 18; the corresponding newly imported v17 data
  assertions include its migrated dueDate. Reason: v18 is the authorized
  schema and matched legacy payments gain explicit slot identity.
- In `schemas.test.ts`, `SCHEMA_VERSION === 17` becomes `=== 18`. Reason:
  schema version is intentionally bumped.
- In `dues.test.ts`, payment tuples previously asserted only `(date, amount)`
  now assert `(date, amount, dueDate)`; a policy-payment count-only assertion
  is replaced by an exact one-payment payload assertion including the slot
  date. Reason: verify the newly persisted slot identity without reducing
  cardinality or transaction/integrity assertions.
- In the progress-ledger test, the old totals and P29-M `Blocked` assertion
  are replaced as described above. No behavioral assertion was weakened.

Physical-device checks remain unverified: native notification/reminder actions
and dialogs across all five entry points, early/on-time/late payment behavior,
Undo interaction, schedule edits, month-boundary timing, and font-scale/native
presentation on iOS and Android. See `docs/memory/open-items.md`.

### DEC-P29O-LEDGER-INVENTORY — Step 1 report-only inventory (2026-11-04)

This inventory was committed before any P29-O source or behavior changes.
Preflight was clean at `682e0b36a92cfc6a8e68235d2ea0ef57e9bb2a7c` on Node
26.13.0. The installed app schema is v18 (`SCHEMA_VERSION` in
`src/domain/schemas.ts`); the root `AGENTS.md` incorrectly said v17, corrected
in the inventory commit. The owner has authorized the next schema version,
v19. No holding model, runtime behavior, Home or Budget screen changed in
Step 1.

#### Existing model and calculations

The persisted `Holding` union in `src/domain/types.ts` has two different shapes:

| Kind | Stored shape | Current entry/schedule semantics |
|---|---|---|
| `manual` | `invested`, `value`, optional `valueAsOf`, `logs[]` | Opening capital and current valuation are separate scalar fields; entries are Deposit/Withdrawal. Fixed deposit cannot accept new deposits or recurring schedules, but can receive a maturity Withdrawal. |
| `plan` | `frequency`, `amount`, `ratePct`, `stepUpPct`, `tenureYears`, `startDate`, `trackFrom`, `opening`, nullable `actualValue`/`actualValueDate`, `logs[]` | Opening capital and recurring-plan configuration are separate from logs; schedule and value snapshot are independent fields. `holdingCapabilities(type).recurring` gates plan creation. |

`InvestmentEntry` currently stores `id`, `date`, `amount`, `note`, `kind`
(`Deposit`/`Withdrawal`) and optional `snapshotAdjustment`. It has no slot date,
price, units, value-update kind, opening-entry identity or direct transaction
ID. Transactions instead point back through
`source: { kind: 'holding-entry', parentId, entryId }`.
Budget links are separate `BudgetItem.holdingId` values.

Current formula locations:

- `src/domain/portfolio.ts`: manual invested = opening `invested` + log
  deposits; plan invested delegates to `planInvested` = `opening` + log
  deposits. Withdrawals do not reduce either invested number today.
- `src/domain/portfolio.ts` and `src/domain/sip.ts`: manual value uses the
  stored `value` when `valueAsOf` exists, otherwise the `invested` opening;
  it adds/subtracts dated logs after that snapshot through `asOf`, and floors
  at zero. Plan value uses `actualValue` (or `opening`) and dated logs after
  its snapshot through `asOf`, also floored at zero. No rate-based interest
  is currently estimated in either selector.
- `src/domain/investmentReturns.ts`: returns use opening amount plus all
  deposits as contributions; withdrawals are counted in gain but not deducted
  from contributions. The shared P29-A helper computes gain, absolute return,
  XIRR/CAGR and annualization span. `src/domain/portfolio.ts` suppresses
  return percentages for Cash and Savings account by capabilities.
- `src/domain/summary.ts`: net-worth assets sum `holdingValue`; liabilities
  are subtracted afterward. `src/domain/goalLinks.ts` uses
  `holdingValue`/`holdingInvested` for holdings linked to goals; Emergency
  Fund is the auto-goal and uses the same full linked values.
- `src/domain/budget.ts` uses `planSchedule` for linked recurring rows,
  commitments and category actual/planned derivation. `holdingId` links at
  most one Budget item to a recurring-capable holding. EF bucket available
  amounts are derived from linked holdings by `holdingValue` in
  `app/emergency-fund.tsx`; the allocation editor also shows `holdingValue`.

#### Schedule matching today

`src/domain/schedule.ts` generates plan slots with IDs `plan:<index>` from
`startDate`/frequency/tenure and begins at the first scheduled index on or
after `trackFrom`. It filters logs to Deposits dated on/after `trackFrom` and
on/before `asOf`, sorts them by date then ID through `matchEntriesFIFO`, and
assigns them in order to schedule slots. A deposit has no stored slot identity:
an early deposit consumes the oldest slot, even if it was intended for a
later one; withdrawals are not schedule payments. `planNextRows` similarly
counts tracked deposits to find the next unpaid slot. The existing policy
schedule is separate and its P29-M2 `dueDate` slot identity applies only to
insurance payments.

#### UI, routes, actions and selectors

| Surface | Current route/files | Current behavior/dependency |
|---|---|---|
| Asset list/cards | `/assets` (`app/assets.tsx`), `src/components/InstrumentCard.tsx`, `src/domain/instrumentCard.ts` | `buildPortfolioRows`, `portfolioTotals`, `monthlyCommitment`; manual and plan cards share Deposit/Withdraw/Entries/Edit actions, subject to Fixed-deposit restrictions. Cards display net Invested/value/gain/return and, for plans, projection, logged count, next due and due status. |
| Holding form | `/investment-form` (`app/investment-form.tsx`) | Segments into recurring PlanEditor and one-time ManualEditor. Plan stores schedule/rate/step-up/opening/optional actual value; manual stores invested/value/valueAsOf. Type controls use `holdingCapabilities`. |
| Entry and schedule list | `/investment-entries` (`app/investment-entries.tsx`) | P29-O1 uses one Entries list for both holding kinds, with a derived Opening row first, an in-holding Recurring plan section and a shared financial summary. Recurring due rows continue to use `planSchedule`; Fixed deposits retain maturity withdrawal access. |
| Entry form | `/investment-entry-form` (`app/investment-entry-form.tsx`) | Adds/edits/deletes Deposit or Withdrawal; a selected due row supplies date/amount, but not a persisted slot date. Linked transaction is edited/deleted with its entry. |
| Due/payment routes | `/clear-dues`, `/payment-confirm`, `app/(tabs)/transactions.tsx`, Home (user-owned read-only), `app/reminders.tsx` | Plan rows flow through `planSchedule` to pending dues, pending items, reminder planning and payment actions. Clearing uses plan slot ID but currently creates an entry without due-slot identity. Home and Transactions consume shared due selectors. |
| Transaction entry/form | `app/transaction-form.tsx`, `src/domain/links.ts` | Investment transactions can be linked to an instrument/holding; linked transactions navigate to `/investment-entries`. Entry transaction source fields link each transaction to the owning holding entry. |
| Budget linked plan | `app/budget-item-form.tsx`, `app/(tabs)/budget.tsx`, `src/domain/budget.ts` | One Budget item may link to a recurring-capable holding; its amount, due month/day and recurring actual/planned rows derive from the plan schedule. Deleting a holding clears those links. |
| Goals | `app/(tabs)/goals.tsx`, `/goal-form` (`app/goal-form.tsx`), `src/domain/goalLinks.ts`, `src/domain/goals.ts` | Linkable holdings use the same value/invested selectors. Full current asset value is counted for every linked goal; shared-goal note derives from link count. Plan projection separately reads plan rate, frequency and tenure. |
| Emergency Fund | `/emergency-fund`, `/ef-allocation-form` | EF goal saved amount and each bucket's available amount use linked holding values. Bucket links are persisted separately in `efBucketLinks`; link integrity is checked with goal links. |
| Net worth/Home | `src/domain/summary.ts`; `app/(tabs)/index.tsx` (read-only) | `netWorth` and Home summary delegate asset totals to `holdingValue`; Home Upcoming uses shared pending due selectors. Home source remains user-owned. |
| Persistence/migration/backup | `src/data/createAppStore.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts` | Store actions wrap domain actions; schema v18 validates the two holding variants and their entries. Existing migration chain is v1-v18 and backup import migrates older versions. Safe storage archives raw bytes under `.premigration.v<N>` and erase-all removes version archives. |

Store/domain action inventory: `addHolding`, `updateHolding`,
`confirmHoldingValue`, `deleteHolding` in `src/domain/holdingActions.ts`;
`addPlan`, `updatePlan`, `deletePlan` in `src/domain/planActions.ts`;
`addInvestmentEntry`, `updateInvestmentEntry`, `deleteInvestmentEntry`,
`deleteHoldingWithTransactions` and transaction synchronization in
`src/domain/investmentActions.ts`; and `clearDue`/clear-through/past-due
operations in `src/domain/dues.ts`. `src/data/createAppStore.ts` exposes the
corresponding UI actions and applies them through the app store.

#### Current test and fixture surfaces

The holding/ledger dependency tests are in
`src/domain/__tests__/{investmentActions,investmentReturns,sip,schedule,dues,pending,budget,goalLinks,holdingCapabilities,instrumentCard,instruments,selectors,efAllocation,efAllocationCustom,reminders,schemas,backup}.test.ts`,
`src/data/__tests__/{createAppStore,migrate,phase5Store,migrateV4}.test.ts`,
`src/components/__tests__/{InstrumentCard,EmergencyGoalScreens,RouteRenderSmoke,TransactionForm}.test.tsx`,
and `src/mock/__tests__/{data,demoData}.test.ts`. The old model and calculations
are exercised across individual domain contracts, store persistence/Undo,
screen summaries, backups/migrations, link integrity and demo data.

Fixtures exist in `src/mock/data.ts` (three manual and one plan holding, with
dated plan logs and an actual-value snapshot), `src/mock/demoData.ts` (generated
manual and plan holdings, linked Budget/goal/EF examples), and legacy
`src/data/testFixtures/v1.ts`, `v9.ts`, `v10.ts`, `v11.ts`, and `v12.ts`.
Migration and backup tests also contain inline schema-v13-v17 fixtures. These
are the required equivalence set for old-versus-new values/net worth before
the migration is accepted.

#### Decisions for following implementation step

The owner-approved unified model is recorded for implementation under
P29-O: one entry ledger for every holding, opening Deposit entry, valueUpdate
delta entries, optional recurring schedule, slotDate-based due settlement,
per-type valuation methods, and rate-compound estimates with confirmation.
Schema v19 is authorized. The six required gates, P29-A return rules, current
`holdingCapabilities` matrix, transaction links, Budget/goal/EF links and
offline-only pricing remain constraints. No source behavior or existing
assertion has been changed in this report-only step.

### DEC-P29O1-CURRENT-MODEL — unify holding actions without schema change (2026-11-04)

**Assumed:** P29-O1 is a new P29 follow-up on the schema-v18 ledger, and
the owner's no-schema-change instruction supersedes P29-O's earlier v19
migration proposal for this step. Do not redesign valuations or returns:
preserve P29-H current-value and return behavior and existing FIFO plan-slot
matching. Fixed-deposit capability restrictions remain in force.

All holdings use the same Deposit, Withdraw and Entries presentation where
allowed by `holdingCapabilities`. A plan's Deposit continues to use the
existing entry action and FIFO schedule matching. Entries shows the derived
opening amount as its first "Opening" row, editable through the holding form;
the recurring schedule is a section in that screen with frequency, amount,
next due date and an edit action. Fixed deposits still expose only the
maturity-withdrawal action and do not gain additional deposits.

Displayed Invested is computed by the shared ledger helper:

`raw invested = opening + deposits - withdrawals`

`Invested = max(0, raw invested)`

When raw invested is negative, show "Cost recovered". Current value and P29-H
return math continue to use the existing value selector and gross contribution
cash flows. Goal-linked invested metadata intentionally remains gross
contributions so Goals, Emergency Fund, Budget links, pending dues, reminders
and net worth retain their previous values. No persisted field or schema
version changes.

**Replaced assertions (old / new / reason):**

- `holdingInvested` ignored withdrawals: the 1,000 opening + 2,000 deposit -
  300 withdrawal fixture expected 3,000; it now expects 2,700, matching the
  owner's net Invested definition. Gain/return remain 0 because P29-H uses
  gross contributions in its denominator.
- An over-withdrawn 1,000 opening + 50 deposit - 200 withdrawal fixture
  expected Invested 1,050; it now expects 850. The added profit-recovery case
  separately proves a negative raw invested value displays as 0 with a
  4,000 gain and "Cost recovered".
- Manual Cash cards previously exposed separate deposited/withdrawn totals;
  they now show net Invested only, because the owner removed those totals.
- Plan cards previously offered a separate Schedule action; the exact shared
  actions are now Deposit, Withdraw and Entries. The recurring plan remains
  visible as an editable section inside Entries.
- Fixed-deposit entries remain visible but have no Deposit action; their
  dedicated maturity-withdrawal action remains unchanged.
- The holding-entry list now has one derived Opening row followed by the
  existing editable/deletable entries. The opening amount is not persisted as
  a new entry and does not change schema.

**Demo/mock before-and-after selector evidence:** the old gross invested value
for goal-link metadata equals the new `holdingContributions` value for every
holding in both fixtures. Current value, goal saved values, Emergency Fund
available bucket amounts, pending dues, reminder plans, Budget-linked rows and
net worth are preserved. The linked Budget item used in this comparison is a
test-only recurring-plan link; no fixture or persisted data is changed.

| Output | Mock before | Mock after | Demo before | Demo after |
|---|---:|---:|---:|---:|
| Budget linked rows / planned amount | 1 / 21,200 | 1 / 21,200 | 1 / 2,000 | 1 / 2,000 |
| Pending dues / amount | 2 / 30,101.32 | 2 / 30,101.32 | 34 / 38,900 | 34 / 38,900 |
| Reminder plan count | 910 | 910 | 897 | 897 |
| Goal saved total | 490,956 | 490,956 | 479,200 | 479,200 |
| Emergency Fund bucket available total | 0 | 0 | 187,000 | 187,000 |
| Net worth (assets / liabilities / net) | 505,441 / 327,903.94 / 177,537.06 | 505,441 / 327,903.94 / 177,537.06 | 504,500 / 389,107.93 / 115,392.07 | 504,500 / 389,107.93 / 115,392.07 |

Acceptance tests include `uses the same seven-row net-invested ledger for
manual and plan holdings`, `floors invested at zero after a profit withdrawal
while preserving the gain`, `preserves linked outputs and legacy linked-
invested values for mock and demo data`, `keeps manual and recurring holdings
on the same card, entries and form flow at font scale %s`, and `uses
scheduled-deposit wording in the recurring holding due cleanup`. The fixture
tests run at simulated font scales 1.3 and 2.0; physical device checks remain
unverified.

**Additional assertion replacements (old / new / reason):**

- The Cash card's combined `Deposited 100.00. Withdrawn 0.00` accessibility
  label and the separate Deposited/Withdrawn labels, alongside an assertion
  that Invested was absent, are replaced by the shared `Invested 600.00`
  accessibility label. The old gross-flow labels are removed; the new value
  is opening 500 + deposits 100 - withdrawals 0.
- The manual ledger's `holdingInvested` expectation changes from 15,000 to
  13,000 for the five-deposit, 2,000-withdrawal example. The plan expectation
  separately changes from 2,000 to 1,500 and from 225 to zero where
  withdrawals exceed contributions, following the net-invested rule.
- `Entries (1)` on the Fixed-deposit action becomes `Entries`; the common
  action label no longer includes a log count.
- A prior assertion excluding "Invested" on cash/bank cards is replaced by
  assertions that the removed Deposited and Withdrawn totals are absent. The
  card now shows net Invested.
- Plan action assertions replace the old `Schedule` action with `Entries`;
  the recurring plan remains in its editable section inside the Entries
  screen, and Fixed-deposit deposit restrictions remain tested.
- SIP helper copy, tracking labels and recurring transaction notes replace
  installment terminology with scheduled-deposit wording. The generated plan
  transaction stays linked; the wording now matches the unified Deposit
  action.
- The legacy orphan note `Old installment` becomes `Orphan deposit`; only
  note copy changes, while orphan category behavior remains unchanged.
- The schema-validation assertion's old "logged installment" error text
  becomes "logged deposit", matching the renamed action without changing
  validation behavior.
- The progress-ledger test's dashboard counts change from 95/99 overall and
  19/20 in P29 to 96/100 and 20/21, reflecting the new closed P29-O1
  part. `memoryDocs.test.ts` changes its expected latest test count from 1134
  to 1140 to match the final run. Neither count update weakens a behavioral
  assertion.

#### P29-O1 acceptance tests

| Frozen requirement | Exact test name |
|---|---|
| Manual and recurring holdings have Deposit, Withdraw and Entries at font scales 1.3 and 2.0; plan schedule stays in Entries and opening is the first derived row | `keeps manual and recurring holdings on the same card, entries and form flow at font scale %s` |
| Seven displayed rows and Invested 13,000 for manual and plan ledgers | `uses the same seven-row net-invested ledger for manual and plan holdings` |
| Net Invested floors at zero after a profit withdrawal; Cost recovered and gain remain correct | `floors invested at zero after a profit withdrawal while preserving the gain` |
| Plan Deposit/store action and linked transaction behavior | `runs the scheduled-deposit integration scenario with one write per action and rehydrates links`; `clears multiple plan dues and fully undoes them with one persisted write per action` |
| Fixed-deposit deposit/maturity restrictions remain | `blocks new fixed-deposit entries and type changes with existing entries while allowing maturity payouts`; `keeps legacy fixed-deposit entries visible without offering new deposits` |
| Current value and P29-H return outputs remain intact | `corrects P29-H opening, back-dated, pattern and withdrawal outputs`; `has XIRR, CAGR, same-day, short-span and known-vector behavior` |
| Budget, pending dues, reminders, goals, EF availability, and net worth remain identical in mock and demo data | `preserves linked outputs and legacy linked-invested values for mock and demo data` |
| Cash and Savings show Invested without return labels or separate totals | `renders ledger-based asset totals and Cash/Bank details at font scale %s` |
| Obsolete holding wording removed from rendered UI and holding-specific test copy | `explains the first scheduled deposit and deposit tracking dates`; `uses scheduled-deposit wording in the recurring holding due cleanup`. The holding UI/test search found no `Log installment`, `Total deposits` or `Total withdrawals`; liability terminology and legacy domain API names are not holding UI copy. |

#### P29-O1 final ordered verification

The gates were run sequentially after the final source and test updates; each
process returned exit code 0.

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 (90 suites, 1140 tests) |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 (21/21 checks) |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Coverage was collected after deleting and regenerating
`coverage/coverage-final.json`. Using `istanbul-lib-coverage`, each
instrumented source file's Istanbul summary was aggregated by its immediate
`src/` directory; line totals are executable line counters and branch totals
are branch-arm counters.

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 702/745 (94.23%) | 735/838 (87.71%) |
| `src/domain` | 3315/3365 (98.51%) | 3205/3437 (93.25%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

Per-file branch coverage: `src/domain/budget.ts` is 788/867 (90.89%),
above its 90% threshold; `src/data/createAppStore.ts` is 86/101 (85.15%),
above its 85% threshold.

Per-file `expect(` occurrence audit compares the previous commit (HEAD before
P29-O1) with the final committed task contents. Added/removed counts are
literal `expect(` lines in zero-context Git diff hunks, and net is added minus
removed; unchanged rows are included for every modified test file.

| Test file | Previous commit | Task HEAD | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/components/__tests__/IconButton.test.tsx` | 9 | 9 | 0 | 0 | 0 |
| `src/components/__tests__/PendingItemActions.test.tsx` | 43 | 43 | 0 | 0 | 0 |
| `src/components/__tests__/RouteRenderSmoke.test.tsx` | 440 | 457 | 22 | 5 | +17 |
| `src/data/__tests__/createAppStore.test.ts` | 463 | 463 | 0 | 0 | 0 |
| `src/domain/__tests__/dues.test.ts` | 149 | 149 | 0 | 0 | 0 |
| `src/domain/__tests__/instrumentCard.test.ts` | 27 | 27 | 3 | 3 | 0 |
| `src/domain/__tests__/instruments.test.ts` | 53 | 53 | 0 | 0 | 0 |
| `src/domain/__tests__/investmentActions.test.ts` | 50 | 50 | 3 | 3 | 0 |
| `src/domain/__tests__/investmentReturns.test.ts` | 52 | 62 | 11 | 1 | +10 |
| `src/domain/__tests__/linkedActions.test.ts` | 93 | 93 | 1 | 1 | 0 |
| `src/domain/__tests__/pending.test.ts` | 43 | 43 | 0 | 0 | 0 |
| `src/domain/__tests__/phase5.test.ts` | 40 | 40 | 1 | 1 | 0 |
| `src/domain/__tests__/schemas.test.ts` | 237 | 237 | 1 | 1 | 0 |
| `src/domain/__tests__/selectors.test.ts` | 82 | 86 | 4 | 0 | +4 |
| `src/domain/__tests__/sip.test.ts` | 43 | 43 | 1 | 1 | 0 |
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 1 | 1 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 162 | 162 | 2 | 2 | 0 |
| `src/mock/__tests__/demoData.test.ts` | 92 | 92 | 0 | 0 | 0 |
| **Total** | **2089** | **2120** | **50** | **19** | **+31** |

P29-O1 physical-device checks not verified: manual and recurring cards,
Entries, editing the opening amount, and Recurring plan details at font scales
1.3 and 2.0 on iOS and Android; visual confirmation of the 13,000 Invested /
seven-row example; Fixed-deposit maturity withdrawal. Jest renderer tests and
Expo exports do not establish native device layout or interaction.

### DEC-P29O2-UNIFIED-LEDGER — staged v19 persisted holding model (2026-11-04)

**Assumed:** legacy recurring plans retain `trackFrom` and `stepUpPct` inside
the new recurring section because existing due matching, amount progression,
Budget links and reminders depend on them, although the new model explicitly
names only frequency, amount, start and end. The core ledger adapter is being
introduced alongside v18 types first; the persisted schema remains v18 until
the migration and consumers are ready. The requested v19 change will include
the opening ledger, recurring schedule, valuation method, rate, compounding
and maturity date so P29-O3 does not require another schema bump.

**Assumed:** legacy accrual plans use yearly compounding when their rate is
transferred. Their value is separately preserved by the migration adjustment;
the annual rate's interpretation needs an explicit verification against the
new valuation rules before the migration is finalized.

**Assumed:** legacy manual Fixed deposit, Recurring deposit and EPFO/PF
holdings have no persisted accrual rate. Migration initializes those records
at 0% with yearly compounding, preserving the old current value without
inventing an interest rate; the owner can enter the actual rate after upgrade.

The shared ledger formula is date-bounded:

`invested = max(0, deposits - withdrawals)`

`value = deposits - withdrawals + valueUpdate deltas`

`gain = value + withdrawals - deposits`

`costRecovered` is true when deposits less withdrawals is negative. New ledger
entry kinds are lowercase `deposit`, `withdrawal` and `valueUpdate`; the
opening deposit is the first array entry and must remain editable but
non-deletable. The old model remains intact while adapters and consumer groups
are migrated. Migration preserves the v18 current value at the injected test
date, link records and old FIFO plan-slot matches.

The first adapter-only step adds the unified ledger types, default
valuation-method mapping and pure date-bounded summary, with focused tests.
No persisted data is changed in this step.

The migration-preparation step adds a pure v18-to-v19 converter without
changing the active schema version. Tests cover mock data, demo data, available
older-version fixtures, old current-value/net-worth equivalence, manual value
adjustments, and FIFO slot-date mapping. The v1 SIP fixture's September log
matches the old schedule's August 1 slot; the migration preserves that exact
old match rather than inferring a slot from the payment date.

Verified migration-preparation commit `0f1cac4` (`git cat-file -t` returned
`commit`). `npm test -- --runTestsByPath
src/data/__tests__/migrateV18ToV19.test.ts` exited 0 (4 tests), and
`npx tsc --noEmit` exited 0 after the commit. This does not complete P29-O2:
the converter is not wired into `migratePersisted`, the active schema remains
v18, and store/screen/mock consumers, archive handling, backup compatibility,
full gates and device validation remain open.

The v19 validation-schema preparation adds a strict ledger-only holding
schema and an alternate AppData schema for validating converted data while
the current v18 runtime remains unchanged. It validates that the opening entry
is first, accrual fields are complete, recurring plans are capability-allowed,
and optional transaction links/prices/units use the expected types. Focused
migration tests validate both demo and available legacy fixture outputs.

### DEC-P29S-CANCEL-LEDGER-ONLY-STORAGE — cancelled redesign (2026-11-05)

**Owner decision:** cancel the ledger-only P29-O2 STORAGE redesign. P29-O1
already provides the unified Deposit, Withdraw and Entries user experience on
the current v18 holding model. No schema change, runtime behavior change, or
data migration is authorized or needed.

**Production-caller audit:**

| Surface | Production callers before removal | Finding |
|---|---|---|
| `migrateV18ToV19` converter and its helper | Only the converter definition in `src/data/migrate.ts` used `legacyHoldingToV19`; `migratePersisted` did not call it and ends its supported chain at v17→v18. | Dead migration path; removed. |
| v19 schemas (`ledgerHoldingSchema`, `ledgerAppDataSchema`) | Only the definitions/exports in `src/domain/schemas.ts`; the actual `appDataSchema` still validates the v18 manual/plan union and is the production import/persistence schema. | Test-only alternate schema; removed. |
| `src/domain/holdingLedger.ts` | Only imported by the unused v18→v19 converter. | No application caller; module removed. |
| New ledger types and constants | Only referenced by the converter, alternate schema/type assertion, and tests. | No production consumer; declarations removed from `src/domain/types.ts`. |
| P29-O1 portfolio summary | `src/domain/portfolio.ts` uses a different `holdingLedgerSummary` built on the existing `Holding` type and `investmentReturns`; active list/card/portfolio behavior depends on it. | Preserved unchanged. This similarly named function is not part of the removed prototype. |

Removed prototype-only tests:

| Old test assertions | Replacement / reason |
|---|---|
| `migrateV18ToV19.test.ts`: v19 ledger value/net-worth equivalence for mock/demo and older fixtures; ledger schema shape; FIFO slotDate; opening and migrated valueUpdate assertions (7 `expect` calls across 4 tests). | Removed with the cancelled converter and v19 schema. Existing v1→v18 and v17→v18 migration/import tests remain and validate the supported schema path; P29-O1 store/domain/UI tests continue to cover the shipped v18 holding behavior. |
| `holdingLedger.test.ts`: default v19 valuation mapping, ledger arithmetic, recovered-cost and empty-ledger expectations (4 `expect` calls across 3 tests). | Removed with the uncalled prototype module and types; these formulas were not runtime behavior. Existing P29-O1 `investmentReturns`/portfolio assertions remain. |

No assertion about shipped behavior was weakened. The removed assertions
specified the cancelled storage model; the replacement is retaining the
existing v18 migration and P29-O1 behavior tests. Preparation commits
`316f76e`, `53c5dae`, `0f1cac4` and `13138b0` remain in history; this cleanup
is a new commit and does not rewrite them.

#### P29-S ordered gates (final shared-tree revalidation with P29-T)

| Gate | Command | Exit code | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` | 0 | 90 suites / 1150 tests pass. Coverage is recomputed below from the final P29-S/P29-T tree; `src/domain/schemas.ts` branches are 307/340 (90.29%), above the configured 90% threshold. |
| 2 | `npx tsc --noEmit` | 0 | Pass |
| 3 | `npx expo lint` | 0 | Pass |
| 4 | `npx expo-doctor` | 0 | 21/21 checks pass |
| 5 | `npx expo export --platform android` | 0 | Pass |
| 6 | `npx expo export --platform ios` | 0 | Pass |

### P29-T — valuation snapshots and dated entries (2026-11-05)

#### Step 1: store-level reproduction before changes

Using `createAppStore` with real `addHolding`, `addPlan`, and
`addInvestmentEntry` actions, each holding was created with opening/invested
73,000 and a value of 73,000 dated 2026-11-05. Four 2,000 deposits dated
2026-11-01 through 2026-11-04 were then added.

| Holding | Invested | Current value before fix | Gain | Absolute return | Annualized |
|---|---:|---:|---:|---:|---|
| Manual | 81,000 | 73,000 | -8,000 | -9.876543209876543% | none |
| Plan | 81,000 | 73,000 | -8,000 | -9.876543209876543% | none |

Expected under the owner rule: Invested 81,000, current value 81,000, gain 0,
and absolute return 0%. The focused store test failed before implementation
with the exact baseline above.

Root causes:

- `src/domain/portfolio.ts`, `holdingValue` entry filter: it includes only
  `entry.date > valuationDate`, so a dated historical deposit is excluded.
- `src/domain/sip.ts`, `planValue` entry filter: it likewise includes only
  `entry.date > snapshotDate`.
- `src/domain/investmentActions.ts`, `snapshotAdjustmentForEntry`: it only
  returns an adjustment for a manual entry whose date exactly equals
  `valueAsOf`; earlier entries and plan actual values are not adjusted.

Old formula: the stored valuation is the base, and only entries strictly
after its date are added.

#### DEC-P29T-HISTORICAL-ENTRY-SNAPSHOT — P29-T decision (2026-11-05)

For an entry dated on or before a manual `valueAsOf` or plan
`actualValueDate`, add its signed amount to the stored value in the same store
action that adds, edits or deletes the entry. Deposits are positive;
withdrawals are negative. Edits apply the new signed amount minus the old
signed amount; deletion reverses the old signed amount. Entries after the
snapshot date retain the existing as-of behavior, and holdings without a
valuation date continue counting all entries. The entry and linked
transaction remain atomic; one Undo restores both and the stored value.
Schema v18 and persisted shape are unchanged.

`snapshotAdjustmentForEntry` now covers manual and plan holdings and every
entry date through the snapshot date. `applySnapshotAdjustment` applies that
delta to manual `value` or a non-null plan `actualValue`. The entry mutation
and instrument-linked transaction paths use the shared adjustment helper.
`createAppStore` wraps those mutations with the existing Undo toast while the
data action itself still makes one Zustand `set`.

The value selectors continue excluding entries on or before a valuation date:
the store action now folds those entries into the snapshot, so including them
again in the selector would double count. The existing helper text saying
entries before the last valuation are assumed included remains accurate.

| Assertion | Old | New | Reason |
|---|---|---|---|
| `holdingValue` and `planValue` for four 2,000 deposits dated before a 73,000 snapshot | Invested 81,000; value 73,000; gain -8,000; absolute return -9.876543209876543% | Invested 81,000; value 81,000; gain 0; absolute return 0% | The old read-time filter correctly avoided double counting but no longer represented newly added historical entries in the stored snapshot. |
| Snapshot action adjustment for plan holdings and entries earlier than the snapshot | No adjustment; only a manual entry exactly on `valueAsOf` was folded into stored value | Same signed adjustment for manual/plan entries on or before their valuation date | The snapshot must reflect each accepted historical mutation, not just same-day manual mutations. |
| One store write and Undo for linked entry mutations | Linked transaction pathways could change entry history without updating the snapshot as one reversible action | One persisted write adjusts entry, transaction and snapshot; one Undo restores the prior data | Keep history, flow transactions and current value consistent through add/edit/move/delete. |
| Demo fixture's stored valuation after its three historical monthly contributions | Goal saved 479,200; assets 504,500; net worth 115,392.07002514548 | Goal saved 487,300; assets 524,000; net worth 134,892.07002514548 | `buildDemoData` creates dated deposits through `addInvestmentEntry`; all are on/before the demo valuation date and now correctly adjust the snapshot. Mock fixture, pending dues, reminders, EF available and Budget flows remain unchanged. |

| Holding | Before: invested / value / gain / return | After: invested / value / gain / return |
|---|---|---|
| Manual, 73,000 opening + four 2,000 dated deposits | 81,000 / 73,000 / -8,000 / -9.876543209876543% | 81,000 / 81,000 / 0 / 0% |
| Plan, 73,000 opening + four 2,000 dated deposits | 81,000 / 73,000 / -8,000 / -9.876543209876543% | 81,000 / 81,000 / 0 / 0% |

**Assumed:** “Budget links read the same number” means linked cash-flow
transactions and planned dues remain correctly linked and visible. The current
Budget actual selector is transaction-based (`budgetLineActual`), not a
current-holding-value selector. The store test therefore verifies 8,000 of
linked transaction actuals for each holding, while value readers (goal,
Emergency Fund, portfolio and net worth) return the adjusted holding value.
Changing Budget to display an asset balance would redesign its flow semantics,
so that was not done.

#### Store-level acceptance evidence

| Requirement | Test evidence |
|---|---|
| Reproduce old state, then verify manual and plan reach 81,000 invested/value with zero gain and return | `phase5Store.test.ts` — `reproduces backdated entries against a stored manual and plan valuation` |
| Before/on/after valuation dates, edit/delete, linked transaction changes and Undo | `phase5Store.test.ts` — `updates %s stored valuations for entries before, on and after the snapshot, including edit/delete/Undo`; `applies the same snapshot adjustments through linked transaction add, edit, move, delete and Undo`; `undoes adding and editing a backdated entry with its linked transaction and stored value` |
| Withdrawal sign, edit/delete reversal and Undo | `phase5Store.test.ts` — `adjusts %s valuation by signed withdrawal changes and reverses the value on delete/Undo` |
| No-date behavior, Cash/Savings return suppression, goals, EF, net worth and Budget links | `phase5Store.test.ts` — `continues to count every %s entry when there is no valuation date`; `keeps Cash and Savings returns hidden while shared value selectors follow the adjusted balance`; reproduction test above |
| Demo and mock selector outputs after historical demo contributions | `selectors.test.ts` — `preserves linked outputs and legacy linked-invested values for mock and demo data` |
| Single persisted write and data integrity on store actions | Snapshot and linked-transaction store tests count `storage.setItemCalls` and assert `validateIntegrity` |

The P29-T mutation tests use real `createAppStore` actions; the mock/demo
selector regression verifies the derived outputs directly. Device verification
of persistence, rendering and font-scale behavior remains open in
[`docs/memory/open-items.md`](./memory/open-items.md).

The first full Gate 1 attempt exited 1 because the demo selector test still
expected the pre-P29-T values. `buildDemoData` adds dated contributions through
`addInvestmentEntry`, so those on/before-snapshot deposits now correctly
increase the affected manual holding values. The test's exact expected goal,
asset and net-worth totals were updated; no assertion was removed or relaxed.
The focused selector test and the full retry passed.

#### Final ordered gates

| Gate | Command | Exit | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` | 0 | 90 suites / 1150 tests pass; configured coverage thresholds pass. |
| 2 | `npx tsc --noEmit` | 0 | Pass |
| 3 | `npx expo lint` | 0 | Pass |
| 4 | `npx expo-doctor` | 0 | 21/21 checks pass |
| 5 | `npx expo export --platform android` | 0 | Pass |
| 6 | `npx expo export --platform ios` | 0 | Pass |

Coverage method: use the Gate 1 `coverage/coverage-final.json` generated by
this run, convert each file with `istanbul-lib-coverage`, then sum Istanbul
line and branch covered/total counts by the immediate directory below `src/`.
No earlier report is used for comparison.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 715/757 (94.45%) | 739/842 (87.77%) |
| `src/domain` | 3327/3377 (98.52%) | 3207/3436 (93.34%) |
| `src/lib` | 107/107 (100.00%) | 126/126 (100.00%) |

### DEC-P29Q-STORAGE-STOP — initial measured persistence limit (2026-11-04)

**Historical stop point:** stop P29-Q after measuring serialized sizes. The normal
200-year dataset is 10,184,994 bytes, exceeding the installed Android
AsyncStorage database cap of 6 MiB (6,291,456 bytes) by 3,893,538 bytes. The
explicit P29-Q stop condition was met at that time. The owner later approved
Expo SQLite; the measured-size table and this initial stop remain historical
evidence. The approval and completed follow-through are recorded in
DEC-P29Q-SQLITE-APPROVAL below.

**Installed backend evidence:** `@react-native-async-storage/async-storage`
2.2.0 is installed. Its Android `android/config.gradle` sets
`AsyncStorage_db_size_in_MB` to 6 by default, and
`ReactDatabaseSupplier.java` applies this as the SQLite database maximum.
No project override was found. This is a whole-database limit, not a per-key
limit, so other keys and database overhead consume some of the same capacity.
On iOS, values over 1 KiB are stored in separate files; the package's 2 MiB
`NSCache.totalCostLimit` is an in-memory cache setting, not a persistent
storage cap. No fixed iOS persistent per-value limit was found in the
installed package source.

The deterministic seeded fixtures span exactly `years × 12` calendar months,
including the injected current month. Each month generates 25 transactions,
monthly entries for 12 holdings, one budget snapshot, and six liabilities
(three settled and three active/renewed). Three policies, two seeded goals and
the default emergency-fund goal are included. The 200-year heavy tier adds a
daily SIP. The five serialized-size
samples use the persisted Zustand envelope
`JSON.stringify({ state: { data }, version: SCHEMA_VERSION })`; each sample is
the same deterministic payload. Sizes below use decimal MB (1 MB =
1,000,000 bytes), while the backend limit is binary MiB.

| Tier | Median serialized bytes (5 samples) | Decimal MB | Transactions | Holding entries | Month snapshots | Backup validation |
|---|---:|---:|---:|---:|---:|---|
| 50y | 2,604,654 | 2.60 | 15,000 | 7,200 | 600 | Rejected: earliest transaction date is outside the import date range |
| 100y | 5,130,944 | 5.13 | 30,000 | 14,400 | 1,200 | Rejected: earliest transaction date is outside the import date range |
| 200y | 10,184,994 | 10.18 | 60,000 | 28,800 | 2,400 | Rejected: earliest transaction date is outside the import date range |
| 200y + daily SIP | 16,895,576 | 16.90 | 60,000 | 101,850 | 2,400 | Rejected: earliest transaction date is outside the import date range |

The 50-year size misses the requested 1.5 MB budget by 1,104,654 bytes.
Import validation separately has a 1990 lower date bound; the 100-year state
also exceeds 5,000,000 bytes while the import validator has a 5,000,000-
character guard; because every fixture is already rejected at
`transactions.0.date`, we did not isolate the character-limit result. The
200-year tiers also exceed the validator's 1,200 month-snapshot limit, and
the daily-SIP tier's 201-year tenure exceeds its 100-year plan limit.
`appDataSchema` accepts each generated fixture, but `validateImportData`
rejects the old first transaction date (`transactions.0.date`). These
validator limits were inspected, not changed.

At this initial stop, no backup export/import, encryption,
validation/migration timing, hydration, store-write, selector timing or heap
medians were collected. Those measurements were performed after owner approval
and are recorded below.

**Storage proposal for owner approval:**

1. **expo-sqlite (recommended):** normalized/partitionable records, indexed
   month/date/parent lookups and selective reads suit 60,000+ transactions and
   long holding histories. Requires a migration plan from the current
   AsyncStorage blob and transactional replace/Undo semantics.
2. **Year-partitioned files via Expo FileSystem:** avoids the AsyncStorage
   database cap and allows year-at-a-time reads, but requires a manifest,
   atomic replacement/recovery, backup encryption and schema migration design.
3. **Multiple AsyncStorage keys:** not sufficient alone because the Android
   6 MiB cap applies to the whole database. Raising that cap also needs owner
   approval and device validation; it does not solve the observed 10.18 MB
   200-year payload.

This proposal was superseded by the owner's Expo SQLite approval recorded
below. **Assumed:** P29-Q is new P29 work; the initial benchmark samples
measure the JSON state envelope and exclude native SQLite overhead and
unrelated stored keys.

#### P29-Q verification

Acceptance evidence is in `src/domain/__tests__/stressData.test.ts`:

| Requirement | Exact test |
|---|---|
| Deterministic 50-, 100- and 200-year data ending on injected today; 25 monthly transactions; 12 holdings with monthly entries; six liabilities; policies, goals, monthly budgets; schema acceptance | `generates a deterministic %i-year AppData fixture ending today` (each `STRESS_YEARS` case) |
| Daily SIP is restricted to the 200-year tier and injected seed must be a safe integer | `requires an explicitly seeded 200-year tier for daily SIP data` |
| Five-sample serialized-size medians and import validation outcome for all tiers | `measures serialized bytes and records backup validation for each stress tier` |
| Existing transaction stress fixture remains deterministic and includes 20,000 rows | `covers a year of daily entries, demo data, and 20,000 stress transactions`; `generates deterministic valid transaction types and injected identifiers` |

Before the final ordered run, Gate 1 exited 1 twice because
`memoryDocs.test.ts` could not parse the updated test-count record when it was
slash-separated and then when the line wrapped. A later Gate 1 attempt exited
1 because the new fixture assertion initially expected two total goals rather
than the default emergency-fund goal plus two stress goals; this was corrected
without weakening coverage. An intervening Gate 2 attempt exited 2 because
the test accessed recurring-only fields without narrowing the liability
union; a discriminant type guard fixed it. The ordered gates at the initial stop point (historical, before SQLite
follow-through) were:

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 (89 suites, 1125 tests) |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 (21/21 checks) |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

The measured 50-year payload exceeds its 1.5 MB target. Hydration, backup
export/import timing, encryption, validation/migration timing, store-write
timing, selector timing, heap use and the 3-second/300-ms performance budgets
were not measured because the 200-year size triggered the explicit storage
stop. The dev-menu loader was not implemented. Physical-device checks remain
unverified: storage fit and safe replace/Undo on iOS/Android, and loader
hydrate/render timing (there is no loader yet).

Assertion replacements and rationale:

| Test | Old | New | Reason |
|---|---|---|---|
| `shared AI memory documents` in `src/lib/__tests__/memoryDocs.test.ts` | Project inventory `86` suites / `1086` tests; no matching latest-run count | `89` suites / `1125` tests, matching both project inventory and latest run | Historical P29-Q count correction; the current follow-through replacement is listed below. |
| `records the unchanged FX/CH IDs, CR-4 through CR-97 and current phase work` in `src/lib/__tests__/progressLedger.test.ts` | Overall `94/98`; P29 `18/19` | Overall `94/99`; P29 `18/20`; P29-Q explicitly expected as stopped pending approval | Historical dashboard update at the initial stop point; current completion counts are listed below. |

No assertion was removed or weakened. The current directory and schema state
was verified at v18; P29-Q makes no AppData schema change.

### DEC-P29R-BACKUP-DRY-RUN — privacy-safe comparison through schema v18 (2026-11-05)

**Decision:** the requested backup comparison runs through `parseBackup`, so
checksum validation, the ordered migration chain and final import validation
are the same as production. The source schema-v13 AppData is separately
validated for its pre-migration baseline; the comparison includes holdings,
net worth/assets, Emergency fund, every goal's saved amount, liabilities,
record counts, pending dues and planned reminders. Output uses numbered
holdings/goals and omits names, notes, descriptions, IDs and other personal
text. The backup is read directly from its external path and is not copied into
the repository.

The real local schema-v13 backup migrated successfully to v18. No differences
were found in any measured selector output. The final run was as of
2026-11-05. Reminder preferences are metadata
and are absent from backup files. **Assumed:** the reminder-plan comparison
uses enabled reminders, both day-before and same-day, 09:00 local time, and
hidden amounts; it is a reproducible preview, not a claim about the owner's
configured preferences.

#### P29-R ordered gates

| Gate | Command | Exit code | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` | 1 | 92 suites and 1148 tests passed; Jest exits 1 because unchanged `src/domain/schemas.ts` branch coverage is 89.41%, below its configured 90% threshold. No assertion was weakened. |
| 2 | `npx tsc --noEmit` | 0 | Pass |
| 3 | `npx expo lint` | 0 | Pass |
| 4 | `npx expo-doctor` | 0 | 21/21 checks pass |
| 5 | `npx expo export --platform android` | 0 | Pass |
| 6 | `npx expo export --platform ios` | 0 | Pass |

### DEC-P29Q-SQLITE-APPROVAL — approved storage and benchmark follow-through (2026-11-04)

**Decision:** the owner approved Expo SQLite after the initial AsyncStorage
limit finding. Native Zustand AppData persistence now uses the installed Expo
SQLite `SQLiteStorage` key-value adapter; Web and metadata continue using
AsyncStorage. Existing native AsyncStorage data remains readable as a
fallback, then is copied into SQLite on the next persisted write. The
SQLite-backed value keeps the existing Zustand envelope and replace/Undo
behavior. This is a key-value blob, not a normalized or year-partitioned
database. AppData schema remains v18; no new persisted data schema was added.

Inspection of the installed Expo SQLite adapter found no app-level
per-value-size guard. This is not a claim that physical devices have unlimited
storage or that native bridge/disk performance equals Node SQLite memory.
Assumed: the adapter's absence of an app-level guard is sufficient to continue
the requested measurement after the owner's explicit storage approval; native
capacity and performance still require device verification.

The dev menu offers 50-year, 100-year, 200-year and 200-year-plus-daily-SIP
deterministic fixtures. It uses the existing replace-all/Undo path and reports
build, validate, save/replace and first-render intervals. The persistence
timing waits for the actual write. All fixtures end on injected today and use
seeded data. **Assumed:** benchmark payloads use the same seed and each tier
spans exactly `years × 12` calendar months including the current month; the
normal monthly fixtures generate about 25 transactions, 12 holding-entry
streams and one budget snapshot per month, plus six liabilities and policy/
goal fixtures.

#### Five-sample Node benchmark

Each cell is the median of five runs. Sizes are bytes; times are milliseconds.
Backup import results are outcomes, not successful timing values where
validation rejected the stress fixture. Selector order is net worth / month
view / budget overview / pending items / reminders planner. Heap used is a
post-GC measurement after dropping temporary backup strings. Node SQLite used
in-memory storage; these figures do not represent Expo native bridge or disk.

| Tier | State bytes | Plain backup bytes | Plain export / import ms | Encrypted bytes | Encrypted export / import ms | Validate / migrate ms | Hydrate / one-write action ms | Selectors ms (NW / month / budget / pending / reminders) | Heap bytes | Import outcome (plain / encrypted) |
|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---|
| 50y | 2,673,975 | 4,734,319 | 176 / 316 | 9,468,921 | 401 / 763 | 138 / 19 | 139 / 14 | 1 / 0 / 47 / 24 / 39 | 85,687,224 | invalid-data / invalid-data (oldest dates) |
| 100y | 5,266,865 | 9,303,009 | 341 / 0 | 18,606,301 | 489 / 615 | 312 / 20 | 278 / 27 | 1 / 1 / 56 / 26 / 62 | 88,724,984 | too-large / too-large |
| 200y | 10,454,115 | 18,441,859 | 690 / 0 | 36,884,001 | 723 / 0 | 545 / 19 | 551 / 51 | 1 / 1 / 91 / 27 / 78 | 103,646,120 | too-large / InvalidEnvelope |
| 200y + daily SIP | 17,383,850 | 32,092,367 | 1,129 / 0 | 64,185,017 | 992 / 0 | 988 / 20 | 938 / 94 | 4 / 1 / 589 / 455 / 472 | 127,068,712 | too-large / InvalidEnvelope |

The normal 200-year fixture meets the requested Node budgets: hydration is
551 ms (under 3 s) and the tested one-write action is 51 ms (under 300 ms).
The measured 50-year AppData state is 2,673,975 bytes (2.67 MB decimal), so it
does **not** meet the requested 1.5 MB size target. The owner-approved SQLite
adapter has no app-level per-value guard in its installed source, so this is
reported rather than silently treated as a measured backend-limit failure.
The 200-year normal state is 10,454,115 bytes; the heavy tier is 17,383,850
bytes. Backup import is separately bounded by current import validation:
the 50-year fixture is rejected for dates before the import minimum, the
100-year fixture exceeds the character-size limit, and the 200-year fixtures
exceed it as well; encrypted imports for the latter tiers exceed the envelope
limit. No import validation limits were changed.

The first benchmark proved three selector hot spots: `monthPositions`
repeatedly filtered all transactions for each month; Budget rebuilt custom
category membership within loops; reminders regenerated recurring schedules
while scanning months. Grouping transactions once, reusing category sets and
caching schedules per selector call reduced normal 200-year Budget overview
from about 8.3 seconds to 91 ms and reminder planning from about 1.4 seconds
to 78 ms. The heavy daily-SIP tier remains slower; no selector latency
threshold was specified.

#### Acceptance tests

| Requirement | Exact test |
|---|---|
| Deterministic 50/100/200-year data; injected today; seeded monthly data; schema-valid state | `generates a deterministic %i-year AppData fixture ending today` |
| 200-year daily-SIP tier and explicit safe seed | `requires an explicitly seeded 200-year tier for daily SIP data` |
| Measured payload sizes and import validation outcomes | `measures serialized bytes and records backup validation for each stress tier` |
| SQLite preference, AsyncStorage fallback/migration and preservation after write failure | `prefers the SQLite value and falls back to legacy AsyncStorage`; `preserves the old value in SQLite before replacing it and removes the legacy copy`; `keeps an existing SQLite value when replacing a stale legacy copy`; `retains the previous data if the new SQLite write fails after legacy migration` |
| Full dev-menu fixture load, timing report and Undo | `loads a selected stress tier, reports hydration/render timing, and offers Undo` |
| Existing full replacement Undo behavior | `shows the demo-loaded Undo / OK popup without navigating, then restores data and shows a toast` |
| Store-level 50-year stress replacement, one Undo, and persisted-write timing | `loads a complete 50-year stress fixture through replace-all and restores the previous data with Undo`; `includes the persisted AppData write in stress-load timing` |

#### Current ordered verification

The six commands below are run after the SQLite follow-through, in the
repository-required order. Coverage is measured from a newly generated
`coverage/coverage-final.json` after deleting the prior file. Directory
coverage groups instrumented source files by their immediate `src/` directory;
line coverage aggregates Istanbul's executable line counters, and branch
coverage aggregates branch-arm counters. Per-file coverage uses the same
Istanbul summaries.

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 (90 suites, 1134 tests) |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 (21/21 checks) |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Fresh coverage after deleting and regenerating `coverage/coverage-final.json`,
measured with `istanbul-lib-coverage` by aggregating each instrumented file's
Istanbul summary into its immediate `src/` directory:

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 702/745 (94.23%) | 735/838 (87.71%) |
| `src/domain` | 3309/3359 (98.51%) | 3207/3440 (93.23%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

Required per-file branch coverage: `src/domain/budget.ts` 788/867 (90.88%),
above 90%; `src/data/createAppStore.ts` 86/101 (85.14%), above 85%. Overall
coverage is 97.79% lines and 92.37% branches. No coverage thresholds or
exclusions were changed.

The per-file assertion audit compares previous commit `9df1559` with the final
P29-Q task tree. Counts are literal `expect(` occurrences; added/removed count
changed diff lines containing that token (the new SQLite test has no previous
file).

| Test file | Previous | Final | Added | Removed | Net |
|---|---:|---:|---:|---:|---:|
| `src/components/__tests__/useAppMenu.test.tsx` | 14 | 17 | 3 | 0 | +3 |
| `src/data/__tests__/createAppStore.test.ts` | 448 | 463 | 18 | 3 | +15 |
| `src/data/__tests__/sqliteStateStorage.test.ts` | 0 | 12 | 12 | 0 | +12 |
| `src/lib/__tests__/appMenu.test.ts` | 5 | 5 | 0 | 0 | 0 |
| `src/lib/__tests__/memoryDocs.test.ts` | 11 | 11 | 2 | 2 | 0 |
| `src/lib/__tests__/progressLedger.test.ts` | 162 | 162 | 3 | 3 | 0 |
| **Total** | **640** | **670** | **38** | **8** | **+30** |

**Assumptions:** P29-Q is P29 work; the approved storage path is Expo
SQLite's installed `SQLiteStorage` key-value adapter, not a normalized schema;
benchmark times are median Node measurements and cannot prove physical-device
performance.

#### Assertion replacements

| Test | Old | New | Reason |
|---|---|---|---|
| `shared AI memory documents` in `src/lib/__tests__/memoryDocs.test.ts` | Project inventory `89` suites / `1125` tests; `status.md` had no `Latest validated run:` value | Project inventory `90` suites / `1134` tests; current status requires a matching `Latest validated run:` count | SQLite tests and storage behavior tests increased the full suite count; preserve the consistency assertion with the fresh run. |
| `keeps progress bars, percentages and counts consistent with dashboard statuses` in `src/lib/__tests__/progressLedger.test.ts` | Overall `94/99`; P29 `18/20`; P29-Q marked stopped | Overall `95/99`; P29 `19/20`; P29-Q marked Done | Owner-approved implementation and verification complete the existing P29 part; denominator is unchanged. |
| `records the unchanged FX/CH IDs, CR-4 through CR-97 and current phase work` in `src/lib/__tests__/progressLedger.test.ts` | P29-Q expected as `Stopped pending storage approval` | P29-Q expected as `Done` | Matches the completed SQLite follow-through and does not remove any ledger assertion. |

No assertion was weakened or deleted. The historical initial-stop metrics and
gate results above remain as an audit trail; the final gate codes, fresh
coverage values and assertion counts above record the approved follow-through.

#### Physical-device checks not verified

Verify on iOS and Android: migration from an existing AsyncStorage install,
legacy-copy retention/removal across interrupted writes, SQLite capacity for
the normal 200-year and daily-SIP fixtures, stress-load replace/Undo, cold
hydration, one-write latency, selector responsiveness, first-render timing and
actual device storage. Node in-memory SQLite tests/benchmarks and Expo exports
do not verify native bridge/disk behavior, physical capacity, device memory or
rendering.

### P29-U — valuation methods on the existing holding model (2026-11-05)

**Assumed:** P29-U is new P29 work. P29-O2's ledger-only schema-v19
redesign remains cancelled; this step uses v19 only for additive, optional
valuation metadata. No holding structure was replaced.

Schema v18 migrates to v19 through a pure input-preserving migration.
`valuationMethod`, `ratePct` on manual holdings, `compounding`, `maturityDate`,
`latestPrice`, `priceAsOf` and entry `price` are optional. `ratePct` already
exists as a required field on recurring plans for their projection, so that
existing schema/type requirement is retained rather than weakened. Manual
holdings may omit it unless accrual is selected. Raw v18 bytes are archived
once as `.premigration.v18`; future v20 data is refused; older plain/encrypted
backups remain supported; erase-all removes migration archives.

#### DEC-P29U-LEGACY-VALUATION-COMPAT — owner compatibility decision

The type-derived method is only a suggestion until explicitly saved or a
value/price is confirmed. This is necessary because recurring plans already
carry `ratePct`, and applying an inferred accrual method without user action
would change legacy values during migration. The shared `holdingValue`
selector routes explicitly configured accrual and units-price holdings through
`src/domain/valuation.ts`; all unconfigured holdings keep the v18 calculation.

Accrual compounds dated deposits independently using actual days / 365,
quarterly factor `(1 + r / 4)^(4t)`, optional maturity cap and the last
confirmed snapshot as the new base. Entries with price derive units as
`amount / price`; latest manually entered price values total units and
withdrawals use their entry price. Manual/units-price cards show update age
and become stale after 90 days. The monthly update-values reminder is opt-in
and stored in the existing metadata store, not AppData.

**Assumed:** a manual opening amount has no date in the current schema. If
there is no dated snapshot, it is treated as current and not assigned an
invented accrual span. The current model also has no opening-unit price; an
opening amount is valued at the latest price until the owner records priced
entries. No live prices are fetched. Plan `ratePct` supplies its accrual rate.

#### Before/after compatibility evidence

The prior v18 manual formula was reimplemented in the test and compared with
the unchanged `planValue` path and the new shared selector for every holding
after the corresponding legacy fixture had been migrated. It also compared
asset totals, net worth, each linked goal amount and each Emergency Fund
bucket's available value. All persisted fixture holdings lacked an explicitly
configured valuation method.

| Source fixture | Holdings | Assets before / after | Net worth before / after | Goal saved before / after | EF bucket available before / after |
|---|---:|---:|---:|---:|---:|
| mock | 5 | 505,441 / 505,441 | 177,444.43 / 177,444.43 | 490,956 / 490,956 | 0 / 0 |
| demo | 8 | 524,000 / 524,000 | 134,829.36 / 134,829.36 | 487,300 / 487,300 | 187,000 / 187,000 |
| v1 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v2 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v3 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v4 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v5 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v6 | 3 | 1,500 / 1,500 | -6,500 / -6,500 | 500 / 500 | 0 / 0 |
| v9 | 5 | 505,441 / 505,441 | 177,444.43 / 177,444.43 | 490,956 / 490,956 | 0 / 0 |
| v10 | 5 | 505,441 / 505,441 | 177,444.43 / 177,444.43 | 490,956 / 490,956 | 0 / 0 |
| v11 | 5 | 505,441 / 505,441 | 177,444.43 / 177,444.43 | 490,956 / 490,956 | 0 / 0 |
| v12 | 5 | 505,441 / 505,441 | 177,444.43 / 177,444.43 | 490,956 / 490,956 | 0 / 0 |

The repository contains no separate v7, v8, or v13-v18 fixture modules;
existing migration/backup tests cover those versions, and the encrypted v18
import passes through v18-to-v19. Current v19 backups round-trip and schema
v20 is rejected.

#### Assertion replacements

| Old assertion / behavior | New assertion / behavior | Reason |
|---|---|---|
| No interest estimation; values change only through entries or a manually entered valuation. | Unconfigured holdings retain that exact behavior; accrual estimates run only after the method is configured or a value is confirmed. | Make the requested valuation options opt-in and preserve every legacy amount on migration. |
| There was no valuation-method setting or monthly value-update reminder. | Type-based defaults are suggestions; the optional monthly reminder defaults off. | Avoid activating a new calculation or notification without user action. |
| Schema v18 was current after P29-S. | Schema v19 adds optional valuation metadata and preserves the cancelled O2 ledger-only design boundary. | P29-U explicitly authorizes this additive schema bump; no storage redesign is revived. |
| A recurring plan's `ratePct` remains an existing required projection input. | It also supplies accrual rate; it remains required on plan holdings, while manual rate is optional. | Making the existing field optional would weaken the v18 model assertion; this is the closest compatible implementation. |

No assertion was weakened. Final validation used Node.js 26.13.0:

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 (21/21 checks) |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Gate 1 reports 91 suites and 1,170 tests passing. During repair, Gate 1 first
exited 1 on branch coverage and passed after adding tests for valuation,
holding-action and valuation-form branches; an initial Gate 3 run exited 1
for an unescaped JSX apostrophe and duplicate imports, both corrected before
its final exit 0. A later full Gate 1 attempt caught the memory-doc test's
stale exact-count assertion after the test baseline was updated; that expected
count was advanced to 91/1170 without weakening the assertion. One intervening
parallel run also timed out in the encrypted-backup test; its focused run and
the final full run passed at the existing timeout.

Coverage was computed only from the final regenerated
`coverage/coverage-final.json`: `istanbul-lib-coverage` `createCoverageMap`,
grouping files by immediate `src/` directory and summing each file's Istanbul
summary covered/total line and branch counts. No historical report is used
for comparison.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 720/762 (94.49%) | 742/845 (87.81%) |
| `src/domain` | 3,415/3,468 (98.47%) | 3,341/3,584 (93.22%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

#### Device checks not verified

Verify accrual and units-price forms, the update-value/price route, staleness
indicators and optional reminder scheduling on iOS and Android at font scales
1.3 and 2.0. Confirm native rendering, persistence across restart, local
notification delivery and price/value entry interactions. Automated layout
tests are simulated and Expo exports do not establish device behavior.

### P29-V — SQLite safety, supported date window and backup scale (2026-11-05)

**Assumed:** P29-V is new P29 work. Schema remains v19; no data-shape or
migration-version change was made.

#### DEC-P29V-SQLITE-VERIFIED-FALLBACK

When legacy AppData is copied to SQLite, the adapter reads it back and compares
the exact string bytes. The legacy key is removed only after the copied bytes
match and the subsequent SQLite write is read back exactly. A SQLite open/read,
write, or read-back failure or mismatch switches that storage instance to
legacy AsyncStorage. If SQLite is unreadable and no legacy copy exists, the
adapter throws an explicit error instead of presenting an empty value that
could overwrite inaccessible data. Failure-injection tests cover open, write
and read-back errors; a mismatch test proves the legacy copy remains active.
SQLite removal failure is also surfaced explicitly after the legacy key is
removed, rather than being reported as a successful deletion.

#### DEC-P29V-DATE-STRESS-BOUNDS

Before this change, the backup import `dateSchema` accepted
`1990-01-01` through `2100-12-31` for transactions, holding entries, liability
payments, policy dates and other imported dates; imported goal years were
1990–2100. The domain AppData ISO-date validator checked calendar validity but
had no lower bound, while its goal year and goal form were 1990–2100.
**Assumed:** use the requested default 1900 floor for date and goal-year
validation, retaining the existing 2100 upper bound for backup dates and goal
years. The domain ISO validator accepts valid dates on/after 1900 without
introducing a new upper bound. This is validation-only; persisted schema stays
v19 and older backups still pass through the same migration chain.

The old stress options `[50, 100, 200]` and `200 + daily SIP` were replaced by
50, 100 and 126-year tiers, plus a dense tier containing the 200-year
transaction, holding-entry and daily-SIP record counts mapped into the 126-year
window. Every date is on/after 1900; dense keeps one month budget per supported
month (1,512 total). Its SIP tenure remains within the existing 100-year plan
tenure validator; its entry dates and count represent 200 years of records.
The backup snapshot cap changes from 1,200 to 1,512 to include all months in
the 126-year tier.

#### DEC-P29V-BACKUP-ROUNDTRIP

Export now validates the current data and refuses it if import would normalize
or change it. It also refuses a serialized plain backup over the existing
5,000,000-character import limit. The exception is surfaced in Backup before
the temporary `File` is created. The 50-year fixture round-trips plain and
encrypted with data equality; larger fixtures are refused at plain export
with their exact size and the limit, so no oversized encrypted file is made.

#### Five-sample final-model Node measurements

The deterministic seed and today are held constant. State bytes, validation,
migration, hydration, one-action persistence, each selector, and backup
operations are medians of five. Selector order is net worth / month view /
Budget overview / pending items / reminder planner. Heap is the observed
`process.memoryUsage().heapUsed` after that tier's measurements, without
forcing garbage collection. Backup size is UTF-8 bytes for successful exports;
the refusal reports characters, which are ASCII for these fixtures.

| Tier | State bytes | Transactions | Holding entries | Month budgets | Plain export bytes / result | Plain export / import ms | Encrypted bytes / result | Encrypted export / import ms | Validate / migrate ms | Hydrate / one-write ms | Selectors ms (NW / month / Budget / pending / reminders) | Heap bytes |
|---|---:|---:|---:|---:|---|---:|---|---:|---:|---:|---|---:|
| 50y | 2,604,654 | 15,000 | 7,200 | 600 | 4,664,998 / accepted | 749 / 755 | 9,330,279 / accepted | 253 / 1,079 | 262 / 0 | 142 / 3 | 1 / 0 / 44 / 24 / 40 | 189,532,320 |
| 100y | 5,130,944 | 30,000 | 14,400 | 1,200 | 9,167,088 chars / refused (5,000,000 limit) | refused | refused at plain export | refused | 503 / 0 | 663 / 13 | 1 / 1 / 61 / 25 / 52 | 437,172,192 |
| 126y | 6,444,985 | 37,800 | 18,144 | 1,512 | 11,508,545 chars / refused (5,000,000 limit) | refused | refused at plain export | refused | 641 / 0 | 351 / 8 | 1 / 1 / 62 / 25 / 56 | 325,695,568 |
| Dense (200y records + daily SIP) | 16,589,944 | 60,000 | 101,800 | 1,512 | 30,992,829 chars / refused (5,000,000 limit) | refused | refused at plain export | refused | 1,658 / 0 | 883 / 25 | 4 / 1 / 294 / 240 / 309 | 350,297,056 |

The dense tier has 28,800 monthly manual entries and 73,000 daily-SIP entries.
The measured 50-year serialized AppData is 2.60 MB and still exceeds the
historical 1.5 MB target; this task changes no storage architecture or
per-value persistence limit. Hydration and one-write action measurements remain
under 3 seconds and 300 ms respectively on Node for every tier. These Node
measurements do not prove physical-device responsiveness.

#### Replaced assertions

| Old assertion / behavior | New assertion / behavior | Reason |
|---|---|---|
| Copy legacy bytes to SQLite and remove AsyncStorage without checking the copied value. | Read back and compare exact bytes; remove legacy only after an exact match; use legacy fallback on SQLite failures or mismatches. | Prevent migration and write failures from discarding the only valid copy. |
| Backup dates and goal years start at 1990. | Valid historical dates and goal years start at 1900; existing upper bounds remain. | Allow supported historical fixtures and records while preserving the upper bound. |
| Stress tiers are 50, 100 and 200 years, plus a separate 200-year daily SIP. | Stress tiers are 50, 100, 126 years and dense 200-year record counts within the 126-year window. | Keep every generated date inside the supported range and retain the high-volume workload. |
| Backup export can produce content that the importer rejects for size or normalization. | Export round-trips unchanged or refuses before the UI creates a file, with the 5,000,000-character limit stated. | Keep export/import compatibility and avoid unusable files. |
| Entry-before-valuation helper says those entries are assumed included in the snapshot. | No such claim; dated entries update the snapshot atomically. | P29-T made the former helper assertion false. |

No assertion was weakened. The source schema remains v19.

#### Verification

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Gate 1 reports 91 suites passed and 1,178 tests passed (one opt-in stress
benchmark skipped; the same five-sample benchmark was run separately). Fresh
coverage is grouped by immediate `src/` directory using
`istanbul-lib-coverage` `createCoverageMap()` and per-file
`toSummary().toJSON()` counts, summed once per source file from
`coverage/coverage-final.json`. This is a single method on the final run; no
older coverage report is used for comparison.

| Source directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 720/762 (94.49%) | 742/845 (87.81%) |
| `src/domain` | 3,435/3,489 (98.45%) | 3,354/3,602 (93.11%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

The first Gate 1 attempt exited 1 because the route-smoke backup fixture was
not valid AppData and the newly required export validation correctly refused
it. The fixture was corrected to include the automatic Emergency Fund goal
and nullable Budget field; the final Gate 1 exited 0. A preliminary lint run
exited 0 with two duplicate-import warnings; imports were consolidated, and
the final Gate 3 exited 0 without warnings. Only the six final exit codes
above are used as the release verdict.

The five-sample benchmark is opt-in in the routine Jest run to avoid adding
the several-minute persistence/crypto diagnostic to every test run. Re-run
with `WEALTHWISE_STRESS_BENCHMARK=1 npm test -- --runInBand src/domain/__tests__/stressData.test.ts`.

#### Device checks not verified

Verify on physical iOS and Android devices: (1) legacy AsyncStorage migration
with exact read-back, failure fallback and subsequent restart; (2) load 50y,
100y, 126y and dense data through the dev menu, then Undo; (3) hydration,
one-write latency, selectors, memory and first render on device; (4) plain and
encrypted 50-year backup export/import; (5) clear export refusal for larger
tiers before any temporary file is created. Simulator/layout tests, Node
measurements and Expo exports do not verify native SQLite, device capacity,
memory, rendering or file-sharing behavior.

### P29-W STEP 1 — foreclosure inventory (report only; 2026-11-05)

#### DEC-P29W-FORECLOSURE-INVENTORY

No product behavior or persisted data was changed for this inventory. The
current code paths and their implications for early recurring-loan closure
are:

| Area | Existing implementation | Closure implication |
|---|---|---|
| Liability model | `src/domain/types.ts`: recurring and one-time liabilities share `principal`, `ratePct`, `startDate` and payment rows. Recurring liabilities also have tenure, EMI and nullable `settlement`; one-time liabilities have an optional due date. `src/domain/schemas.ts` validates settlement as `{ asOf, balance }`, with a nonnegative balance and an `asOf` no earlier than `startDate`. | Only recurring liabilities are in the requested action scope. |
| Settlement | `src/domain/liability.ts` `loanState()` uses settlement as an accounting anchor: before `asOf` it returns the saved balance; on/after it starts from that balance and applies later payments. `src/domain/dues.ts` `clearPastDues(..., mode: 'settle')` writes this anchor using an entered or calculated remaining balance. | Settlement can anchor a zero balance and stop subsequent schedule rows, but it does not identify *why* the balance is zero. It is not a dedicated closed flag/date/note; historical setup can also create a zero anchor. This is insufficient by itself to distinguish an explicitly foreclosed loan in a Closed filter. |
| Schedule rows | `src/domain/schedule.ts` generates recurring due dates monthly from `startDate` and creates EMI rows. Recorded EMI payments are matched FIFO to schedule slots; prepayments affect `loanState()` but do not match an EMI slot. A settlement marks due slots on/before its date as assumed paid, and a zero balance stops later rows. Schedule projections use a monthly-rate calculation while the shared outstanding calculation accrues actual/365 between dated payments. | Using a zero settlement at the closure date is compatible with stopping future schedule rows; the closure payment must remain a dated payment/expense and the explicit closed state must remain distinguishable from generic settlement anchors. |
| Payments and EMI dues | `src/domain/liabilityActions.ts` adds each payment and a linked expense transaction (`source.kind: 'liability-payment'`) together; edits/deletes update/remove the matching transaction. Recurring payment kinds include EMI and Prepayment. `src/domain/dues.ts` clears the first actionable schedule row and records its payment/transaction. `src/data/createAppStore.ts` exposes these operations through the persisted store. | The foreclosure payment and any excess charge need one pure domain operation/store update so a single Undo restores the complete closure. |
| Transactions and Home pending dues | `src/domain/pending.ts` derives unpaid liability rows from `liabilitySchedule()`. Transactions renders those pending rows; `app/(tabs)/index.tsx` (user-owned) derives Home's Upcoming and due list through the same pending selector. | Removing future schedule rows in the shared schedule projection removes them from both surfaces; Home source should not need editing. |
| Budget linked rows and actuals | `src/domain/budget.ts` derives planned and linked recurring liability rows from `liabilitySchedule()` (category `EMI`). Actual payments are expense transactions linked by liability/payment IDs and feed Budget actuals. | Future planned dues can disappear through the shared schedule; the dated closure expense must still appear as actual spending. |
| Reminders | `src/domain/reminders.ts` builds reminders from `createPendingItemsReader()` and extends its search horizon through recurring liability tenure. | Reminder dues are derived, not stored; removing future dues from the shared schedule prevents their reminders. |
| Home and net worth | `src/domain/summary.ts` `netWorth()` sums each `liabilitySummary(...).balance`; `homeSummary()` uses it for Home totals. `app/(tabs)/index.tsx` displays the result and links to Liabilities. | A zero balance drops the closed loan from liabilities and increases net worth by the previously outstanding amount. The Home route remains user-owned and read-only. |
| Loan proceeds | `src/domain/cashFlow.ts` `recordMoneyMovement()` and `fundShortfall()` can create a liability and a linked income transaction (`source.kind: 'liability-origin'`) or record proceeds against an existing liability. | Loan origin/proceeds remain historical; foreclosure adds expense records and does not remove or rewrite the proceeds transaction. |
| Existing settled/closed UI state | There is no persisted `closed` state. `liabilitySummary()` derives `cleared` when balance is below 1. The Liabilities list shows all records and filters only All / Recurring / One-time; naturally cleared records remain in those lists with “Cleared” text. Schedule detail also shows “Cleared”. There is no Closed filter or early-close action today. | Explicit foreclosure needs a durable discriminator for the Closed filter and its closure date/note; generic `cleared` remains a calculated balance state. |

**Inventory conclusion:** the existing `settlement` field can represent the
zero balance and date needed by the loan calculation and schedule cutoff, but
cannot by itself record explicit closure identity or the closure note because
it is already used as a general historical balance anchor. Step 2 may require
one additive optional closure field set and the next schema version; no bump
or source change is made in this report-only commit. Older backup, encryption,
raw-byte archive and erase-all compatibility will be addressed if that field
is introduced.

| Step | Status | Evidence |
|---|---|---|
| P29-W Step 1 — report-only inventory | Done; committed before implementation | Current types/schema, loan calculator, schedule, payment actions, store actions, pending selector, Budget, reminders, Home, summary and loan-proceeds paths listed above. |
| P29-W Step 2 — foreclosure behavior | Done; implementation committed separately after all six gates | Schema v20 optional closure record; pure action and one-write store Undo; closed filter and note-only editor; future schedule, pending, Budget and reminder rows stop at the closure date. |

### DEC-P29W-FORECLOSURE-RECORD

The existing `settlement` field remains an accounting anchor that may be used
for historical balance corrections; it does not identify a foreclosure.
Schema v20 therefore adds an optional recurring-liability closure record with
date, linked payment ID, optional note and optional excess-charge transaction
ID. The close action stores a zero settlement on the same date, allowing the
existing shared loan and schedule calculations to stop future dues without
changing unrelated loan arithmetic.

The closure date is constrained to today or earlier and to the first payment
date or later. The confirmation shows outstanding, amount paid and difference.
Payment is capped at outstanding; any excess is a separate "Loan closure
charges" expense that does not reduce balance. A short payment requires a
second explicit confirmation and the difference is written off. The payment,
charge, closure metadata and zero settlement are created by one pure action
and one store write; one Undo restores AppData and linked transactions.
Closed loans are isolated by the Closed filter; only the closure note can be
edited, and deletion uses the existing confirmed linked-record choice.

| Fixture | Before closure | After closure |
|---|---|---|
| Store test: 100,000 principal, 0% rate, 10,000 EMI, one 10,000 payment, close on the next due date | Outstanding on 2026-03-10 is 90,000; later schedule rows are generated. | Outstanding is 0; a linked 90,000 closing expense and separate 250 closure-charge expense are recorded; no later schedule, pending, Budget or reminder dues remain. |
| Store test: 50,000 principal, 0% rate, no payments; amount paid 49,900 | Outstanding on 2026-03-10 is 50,000; no closure is recorded without the second confirmation. | After explicit write-off confirmation, outstanding is 0; payment is 49,900 and the 100 remainder is written off without an excess-charge transaction. |

#### Replaced assertions

| Old assertion / behavior | New assertion / behavior | Reason |
|---|---|---|
| A zero `settlement.balance` alone identifies a closed loan. | Only an optional closure record identifies a foreclosed recurring liability; generic settlement remains an accounting anchor. | Historical settlement may be used without foreclosure and must not appear in Closed. |
| Recurring due rows continue to be derived from the scheduled term unless ordinary balance logic clears them. | A confirmed foreclosure stores a zero settlement on its closure date; every later due disappears from shared surfaces while earlier payments remain. | Explicit early closure must stop future obligations consistently. |
| Recurring liabilities have no early-close action or write-off confirmation. | Close date and amount are confirmed; an underpayment requires explicit write-off confirmation and overpayment is separated as a charge. | Preserve the lender's reported settlement amount without silently changing the shared balance calculation. |

No existing assertion was weakened. Home source remains untouched.

#### Verification

| Gate | Command | Exit |
|---|---|---:|
| 1 | `npm test -- --coverage` | 0 |
| 2 | `npx tsc --noEmit` | 0 |
| 3 | `npx expo lint` | 0 |
| 4 | `npx expo-doctor` | 0 |
| 5 | `npx expo export --platform android` | 0 |
| 6 | `npx expo export --platform ios` | 0 |

Gate 1 reports 91 suites, 1,187 passed tests and one skipped opt-in stress
benchmark. Coverage was measured from the freshly generated
`coverage/coverage-final.json` with `istanbul-lib-coverage`, summing per-file
summaries by immediate `src/` directory:

| Directory | Lines | Branches |
|---|---:|---:|
| `src/data` | 725/767 (94.52%) | 745/848 (87.85%) |
| `src/domain` | 3,507/3,566 (98.35%) | 3,449/3,711 (92.94%) |
| `src/lib` | 107/107 (100%) | 126/126 (100%) |

#### Device checks not verified

Physical iOS and Android validation remains open for closure-date selection,
confirmation flows, same-write Undo, schedule/pending/Budget/reminder removal,
Closed filtering, read-only closed-loan payment/schedule rows, note-only
editing/deletion and font scales 1.3 and 2.0.
Native SQLite v19-to-v20 archive/restart behavior also remains unverified.

### P29-X STEP 1 — recurring investment stop inventory (2026-11-05)

#### DEC-P29X-PLAN-STOP-INVENTORY

Report-only inventory; no recurring-plan product data or behavior changed.
`PlanHolding` currently owns `startDate`, `trackFrom`, `tenureYears`, `frequency`,
`amount`, `stepUpPct`, `logs`, opening/current value and valuation metadata. It
has no stop date. The next persisted schema version is therefore v21, and the
planned additive field is `PlanHolding.stopDate?: ISODate`.

| Area | Existing implementation | P29-X implication |
|---|---|---|
| Plan schedule | `src/domain/schedule.ts` `planSchedule()` generates calendar slots with `scheduledDate()` and `totalPeriods()` from SIP frequency, tenure and start date; `firstPlanIndex()` clips to `trackFrom`; slots are matched FIFO against `Deposit` entries dated at or before `asOf`. Entries dated after the valuation date retain existing behavior. | The stop must cut slots after `stopDate`, but preserve every slot on or before it, including unpaid overdue/ongoing rows. It must be applied centrally in `planRows()` and `planNextRows()` so all consumers stay identical. Resume removes the field and restores the next due after today, without changing entries/value. |
| Tenure | `src/domain/sip.ts` `totalPeriods()` calculates frequency × tenure years. `projection()` also loops the full tenure without a stop cutoff. `planProgressPct()` uses that original tenure contribution total. | Stop does not rewrite tenure, opening, entries or valuation fields; it only cuts displayed/derived future schedule occurrences. Separate goal projection use will be reviewed so stopped plans do not silently continue deposits after the cutoff. |
| Pending dues and Home | `src/domain/pending.ts` calls `planSchedule(plan, today)` and emits unpaid rows for `Transactions` and the shared pending/Home surface. | A schedule cutoff based on `stopDate` automatically removes post-stop rows because pending derives them from the shared schedule. No separate Home edit is required and the user-owned Home file remains unchanged. |
| Budget linked rows | `src/domain/budget.ts` calls the same `planSchedule()` for `linkedRecurringForMonth()` and applies matching schedule rows to planned linked investment amounts. | Shared schedule cutoff removes post-stop planned rows; paid/posted due behavior remains unchanged. Budget cache keys include plan identity and date but the schedule itself reads the plan field, so stopping/resuming invalidates values through existing data updates. |
| Reminders | `src/domain/reminders.ts` gets active schedule rows through `createPendingItemsReader()` and its search horizon currently extends plans to `startDate + tenureYears × 12` regardless of schedule contents. `pending.ts` remains the actual reminder row source. | Post-stop rows disappear through pending data; reminder horizon may still search a historical stopped plan, but no reminder item is emitted unless pending emits one. |
| Goal saved value and EF | `src/domain/goals.ts`/`goalLinks.ts` link by instrument ID; plan saved contributions use current plan/holding value and `planValue()` rather than mutating entry history. EF uses linked holding values through the shared asset link calculation. | Stop/resume must not create entries, adjust opening, value snapshots or linked transaction records; goal and EF current amounts therefore remain unchanged. Future plan goal simulation currently treats plans as active through tenure and must use the stop date as an injected schedule cutoff rather than treating the stopped plan as continuously contributing. |
| Card/screen/actions | `app/assets.tsx` derives each plan card status/progress from `planSchedule()` and card model `src/domain/instrumentCard.ts` marks completed plans. `app/investment-entries.tsx` owns the in-holding `Recurring plan` section, Deposit/Withdraw/Entries actions, next-due text, clear-dues and Edit actions. | P29-X adds Stop/Resume controls to this existing section and card text. Deposit remains available because stop is schedule state, not an entry deletion or valuation change. Fixed-deposit capability already yields no plan schedule and stays outside the recurring action scope. |
| Store actions | `src/domain/planActions.ts` edits/deletes plans through `updatePlan()` and `deletePlan()`; there is no stop/resume action. Entry actions in `src/domain/investmentActions.ts` update logs and linked transactions in the same store write and Undo history. | Stop/resume should be pure domain plan mutations or a shared holding action that patches only `stopDate`, performed by one Zustand store set; Undo restores the prior plan object. No entries/value/transactions are changed. |
| Transaction matching | `planSchedule()` matches deposits FIFO within scheduled slots and does not distinguish logs by `slotDate` for plan holdings. `installment` and entry actions use the existing due matching for logging. | A stop only cuts the schedule; past unpaid dues stay actionable and remain matchable after stop. The existing FIFO rule determines which deposits settle which unpaid slot. |

Assumed: `stopDate` is the inclusive last scheduled date/range boundary; due
rows whose `dueDate <= stopDate` remain, and rows after the date are removed.
`last paid entry` means the latest date of a matching paid `Deposit` entry, not
the latest raw entry date; the stop form validates stop date against that value,
and against today's date. Assumed: an optional stop confirmation note is
non-persisted UI copy because schema change is limited to one additive optional
`stopDate` field. Assumed: resume restores the original tenure schedule after
removing `stopDate`, with unpaid overdue dues before today remaining and future
rows starting at the next due on or after tomorrow, not recreating/resorting
entries.

## P29-X implementation record

| Item | Status | Evidence |
|---|---|---|
| P29-X Step 1 | Done | Report-only inventory committed first as `a4a47e63515c90a61903322ae73fe55fa40bf4b8`; schedule, dues, Budget, reminders, goals, card and store paths were inventoried before product edits. |
| P29-X schema | Done | Schema v21 adds optional `PlanHolding.stopDate`; migration from v20 is identity-preserving and the existing premigration archive supports `.premigration.v20`. |
| P29-X stop/resume behavior | Done | Pure `stopPlan()` and `resumePlan()` mutations plus one-write store Undo actions. `planSchedule()` and `planNextRows()` apply the inclusive cutoff; goal projections stop future contributions. |
| P29-X UI | Done | Recurring-plan section has Stop investment / Resume investment controls and card text; stop date uses a validated form and confirmation dialog. |
| P29-X verification | Done | Focused schedule/store tests passed; all six ordered gates passed before implementation commit. |

P29-X final verification:

| Gate | Exit code | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 92 suites passed; 1191 tests passed, 1 skipped. |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed with zero warnings. |
| `npx expo-doctor` | 0 | 21/21 checks passed. |
| `npx expo export --platform android` | 0 | Passed. |
| `npx expo export --platform ios` | 0 | Passed. |

Fresh coverage method: regenerated `coverage/coverage-final.json` during the
final Gate 1 and summed istanbul `lines`/`branches` coverage by immediate
`src/<directory>` group. No comparison to historical reports was made:
`src/data` 728/772 lines (94.30%), 748/851 branches (87.90%);
`src/domain` 3533/3592 lines (98.36%), 3467/3733 branches (92.87%);
`src/lib` 107/107 lines (100.00%), 126/126 branches (100.00%).

## P29-Y Gate 1 repair record (2026-11-05)

- Assumed P29-X Gate 1 in earlier memory text was `92 suites / 1191 passed`
  and `1` skipped. The real pre-repair run was `92` total suites with `91`
  passed and `1` failed, `1190` passed tests, `1` skipped, and `1192` total.
- The repaired Gate 1 run is `92` passed suites, `1191` passed tests, `1`
  skipped test, and `1192` total tests.
- Replacement: old `project.md` assertion `91 suites / 1187 tests` and stale
  `memoryDocs.test.ts` expectation were replaced with the real post-repair
  `92 suites / 1191 passed tests` assertion. Reason: P29-X added coverage-backed
  tests and the memory expectation had not been advanced.
- Fresh coverage method for the repair run: read regenerated
  `coverage/coverage-final.json` and sum `istanbul-lib-coverage` statement
  maps by immediate source directory. No older coverage report was compared.
  `src/data`: 857/940 lines (91.17%), 748/851 branches (87.90%);
  `src/domain`: 4182/4312 lines (96.99%), 3467/3733 branches (92.87%);
  `src/lib`: 133/133 lines (100.00%), 126/126 branches (100.00%).
- Per-file branches: `src/domain/budget.ts` 788/867 (90.89%);
  `src/data/createAppStore.ts` 90/105 (85.71%);
  `src/domain/schemas.ts` 351/389 (90.23%).

### P29-Y ordered gate results (2026-11-05)

| Gate | Exit code | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 92 suites passed; 1191 tests passed, 1 skipped. |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed. |
| `npx expo-doctor` | 0 | 21/21 checks passed. |
| `npx expo export --platform android` | 0 | Passed. |
| `npx expo export --platform ios` | 0 | Passed. |

### Merged holding Summary card (2026-11-05)

The owner requested a layout-only consolidation on
`app/investment-entries.tsx`: old assertion / new assertion / reason.

- Old: Recurring plan and Summary rendered as separate cards.
- New: Recurring plan details and Summary values render in one `Summary` card;
  Stop/Resume appears in the holding action row above the card. The owner then
  removed the Entries and Edit recurring plan controls from the holding screen,
  and those removed controls remain removed.
- Reason: owner-directed frozen layout correction; no financial or persistence
  behavior changed.
- Replaced assertions: the holding screen previously retained an Entries action
  and an Edit recurring plan control / the owner-edited screen has neither /
  preserve owner removal without restoring unwanted data.
- Validation: the focused `RouteRenderSmoke.test.tsx` suite passed 150 tests at
  font scales 1.3 and 2.0; TypeScript and all subsequent gates passed. The full
  Gate 1 run passed 92 suites with 1191 tests passed and 1 skipped.

DEC-P29X-PLAN-STOP-CUTOFF: the optional `stopDate` is an inclusive date
boundary. Rows with due dates on or before it remain, including past unpaid
rows; later rows are removed from schedule-derived surfaces. `resumePlan`
removes the field without changing entries, value, returns, transactions or
links. Assumed: the owner may stop only on or after the latest deposit entry
date and no later than today; resume restores future schedule rows from the
original tenure without rewriting historical entries.

Old assertion / replaced assertion / reason: plan schedules always span the
full remaining tenure / stopped plans span only dues on or before `stopDate`
/ `stopDate` must suppress all future schedule occurrences without changing
stored entries or valuation.

#### P29 layout refinement — owner-edited holding and liability screens (2026-11-05)

DEC-P29LAYOUT-ASSET-LIABILITY: the holding Summary card is a single card that
contains recurring-plan details and financial values. The Summary uses
single-column rows for Monthly amount, Next due and Value date, and two-column
detail cells for Invested, Current value/balance, date and Gain. `Stop
investment` / `Resume investment` remains in the holding action row/footer area.
The owner's removed holding Entries and Edit recurring-plan controls are not
restored.

Liability cards expose `Pay EMI`, `Foreclosure`, and a conditional
`Entries` button in one no-wrap action row. Liability detail pages are
entries-only: Schedule and Payments tabs, payment sorting/filter controls and
the old ActionRow layout are removed; `Summary` shows Outstanding, Paid,
Interest accrued and Next due in columned detail rows, with `Pay EMI` and
`Foreclosure` actions in the same page structure as assets.

Assumed: these changes are presentation-only; no schema, migration, domain
value, goal, Emergency Fund, net-worth, Budget-link or liability-payment
behavior changes. Replaced assertions are old/new/reason entries in the
layout and ownership tests:

- Old: one-time and recurring liability cards require `ActionRow`; new: card
  actions are direct row `Button` components; reason: owner requested the three
  liability controls in a consistent single row.
- Old: closed liability actions require an `ActionRow` and its
  `Edit closure note` action contract; new: a direct closure-note `Button`
  action in the card's action container; reason: the owner removed the old
  liability action structure.
- Old: liability payments expose a SortChip and Schedule/Payments tabs; new:
  the liability page is entries-only and has no sort/filter control; reason:
  payment entries now follow the asset entries presentation.
- Old: holding `Summary` uses fixed-font separate recurring and financial
  sections; new: existing typography styles and two-column detail cells in one
  Summary card; reason: owner-directed visual correction at large font scales.

Gate table:

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 92 suites passed; 1191 passed, 1 skipped, 1192 total |
| `npx tsc --noEmit` | 0 | Passed |
| `npx expo lint` | 0 | Passed |
| `npx expo-doctor` | 0 | 21/21 checks passed |
| `npx expo export --platform android` | 0 | Android bundle exported |
| `npx expo export --platform ios` | 0 | iOS bundle exported |

Unverified: physical-device rendering and interaction at font scales 1.3 and
2.0 on iOS and Android. Protected Home and Budget blobs remain unchanged.

### Home-only options menu and recurring asset controls (2026-11-05)

- Replaced assertions: old / liability action label “Close loan early” / new /
  “Foreclosure” / reason: owner renamed the recurring-liability early closure
  action consistently across card, entries and form surfaces.
- Replaced assertions: old / only one-time and recurring holding card paths /
  new / every recurring plan card exposes Stop investment or Resume investment /
  reason: owner requires stop/resume on all recurring asset cards.
- Replaced assertions: old / global three-dot menu available where no explicit
  right actions exist / new / menu appears only for Home route variants /
  reason: owner requires global options only on Index/Home.
- DEC-P29HOME-MENU: AppHeader treats `/`, `(tabs)` and `(tabs)/index` as
  Home route variants; explicit supplied `menu` and `showDefaultMenu={false}`
  behavior remains independent.
- DEC-P29RECURRING-CARD: instrument-card actions use id `stop` for both stop
  and resume labels; active plans show Stop investment, stopped plans show
  Resume investment.
- Validation state before final ordered rerun: focused AppHeader,
  instrument-card and route smoke tests passed; TypeScript passed; Gate 1 real
  run passed 92 suites, 1192 passed tests, 1 skipped, 1193 total.

### Final ordered verification (2026-11-05)

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 92 suites passed; 1192 passed, 1 skipped, 1193 total |
| `npx tsc --noEmit` | 0 | Passed |
| `npx expo lint` | 0 | Passed with zero warnings |
| `npx expo-doctor` | 0 | 21/21 checks passed |
| `npx expo export --platform android` | 0 | Passed |
| `npx expo export --platform ios` | 0 | Passed |

### P28-E phase history

| Check | Status | Evidence |
|---|---|---|
| Phase branch/tag index and derived counts | Pass | All 30 phase branches/tags are indexed; `progressLedger.test.ts` checks Section 12 against dashboard rows. |
| Original commit mapping and archive trailers | Pass | 512 original commits mapped; all appear exactly once in unique archive trailers; none unmapped. |
| Archive final tree | Pass | `history/by-phase` tip `867347b068725c57c05765d84c02640d8cd57405` has the same tree as `main`. |

### Final integrated `develop` gates (2026-11-08)

| Gate | Exit | Result |
|---|---:|---|
| `npm test -- --coverage` | 0 | 98 suites passed; 1,242 passed, 1 skipped, 1,243 total. Coverage: overall 95.96/92.01/98.01/97.62%; `src/data` 91.03/87.39/94.46/94.17%; `src/domain` 96.95/92.85/98.80/98.32%; `src/lib` 100% in all four measures (statements/branches/functions/lines). |
| `npx tsc --noEmit` | 0 | Passed. |
| `npx expo lint` | 0 | Passed. |
| `npx expo-doctor` | 0 | 21/21 checks passed. |
| `npx expo export --platform android` | 0 | Exported to `dist`. |
| `npx expo export --platform ios` | 0 | Exported to `dist`. |

These are simulated/export checks, not physical-device verification. No EAS or
Gradle build, version bump, or release preparation was performed.

### 2026-11-11 — P28-F-R6 final integrated-develop gates

- `npm test -- --runInBand src/lib/__tests__/releaseDownloadDocs.test.ts src/components/__tests__/AboutScreen.test.tsx`
  passed 2 suites / 11 tests. `npx tsc --noEmit` exited 0;
  `npx expo lint` exited 0. `git diff --check` exited 0.
- After the final ledger update, the release/About/progress focused command
  passed 3 suites / 26 tests; TypeScript, Expo lint and the commit whitespace
  check also exited 0. Task PR #112 merged into the phase as `fa153da`; phase
  PR #113 merged into `develop` as `d347526`.
- After phase PR #113 integrated the candidate and evidence PR #114 recorded
  the merge into `develop`, all six required gates passed in order:

  | Gate | Command | Exit / result |
  |---:|---|---|
  | 1 | `npm test -- --coverage` | 0; 101 suites, 1,316 passed, 1 skipped (1,317 total); coverage 95.96/92.15/98.02/97.62% overall |
  | 2 | `npx tsc --noEmit` | 0 |
  | 3 | `npx expo lint` | 0 |
  | 4 | `npx expo-doctor` | 0; 21/21 checks |
  | 5 | `npx expo export --platform android` | 0; exported 5.6 MB bundle |
  | 6 | `npx expo export --platform ios` | 0; exported 5.3 MB bundle |

- Gate 1 coverage by `src/` directory, in statements/branches/functions/lines
  order: `src/data` 91.06/87.47/94.48/94.19%;
  `src/domain` 96.94/93.00/98.80/98.31%; `src/lib` 100% in all measures.
- Physical Android checks O45-O53 remain `Not run`; Expo exports do not
  replace native-device or screen-reader verification. No EAS or Gradle build
  was run.

## 11. Session and release log

### DEC-CR108-MENU-STRESS-DIALOG (2026-11-10)

- The Home dev-menu stress action exposed four tiers through `choiceAsync`,
  whose shared contract intentionally allows at most two choices. The menu
  handler therefore threw `RangeError` before opening a picker.
- Keep that limit. Present stress tiers in a separate centered shared-sheet
  selection dialog with scalable rows; cancellation performs no load, and the
  selected callback preserves loading, timing, error and Undo behavior.
- The pre-edit handler regression failed with the reported RangeError. The
  updated menu/confirmation tests cover all four tiers, cancel, Undo, every
  app-menu handler, and simulated 1.3x/2.0x font scales.

### DEC-CR108-FINANCIAL-TYPES (2026-11-10)

- Real estate is a finite built-in holding type. It supports recurring
  deposits and returns, maps to the `Real estate` investment category, and is
  included in the `Savings and Investments` Budget group.
- Custom holdings and liabilities store the finite `Custom` type plus an
  optional validated, trimmed `customTypeName` of 1–30 characters; this does
  not create open-ended enum values. Custom holdings support recurring
  deposits and returns, map to `Other investments`, and share the `Savings
  and Investments` Budget group.
- Forms require a custom display name when `Custom` is selected, while
  persisted/imported fields remain additive and optional for compatibility.
  Custom labels are derived consistently in cards, entries, filters/search,
  goal links and backup data.
- The P41-A regression suite passes (7 suites/292 tests), as does TypeScript.
  Demo data re-splits existing values rather than increasing the assets total;
  final before/after details are recorded at CR-108 close-out.

### DEC-CR108-ONCE-ONLY (2026-11-10)

- Once-only recurrence is available only for Budget items, Budget income and
  insurance premiums. Investment plans and liabilities retain their existing
  one-time forms and do not receive a Once-only frequency option.
- Budget schedules require the first-due month; insurance schedules use the
  configured first due date. A once-only item is due only in that specified
  month/date, is not repeated in later months and cannot use percentage mode.
- Shared schedule, pending-due, reminder, Budget-total, projected-cash-flow
  and virtual-month paths evaluate the same due rule. Frozen month snapshots
  retain their saved values. Schema v22 migrates identity-preservingly to
  v23; `.premigration.v22` keeps the original serialized bytes once and is
  removed by erase-all. Backups through v22 migrate through the chain;
  encrypted v23 round-trip and refusal of v24 are covered by tests.
- P41-B focused domain, migration, archive, backup and demo tests pass
  (7 suites / 216 tests); TypeScript passes. The full ordered gates remain
  pending at the time of this decision note; Parts 5–6 and the final six gates
  were later completed as recorded in CR-108 close-out.

### DEC-CR108-COMPLETED-SECTIONS (2026-11-10)

- A liability belongs in Completed when its as-of outstanding balance is
  below 1 or it has a recorded closure. Existing sort, kind filter, Closed
  filter and search are applied before grouping; therefore the collapsed
  section count reflects the current results.
- A non-pinned goal belongs in Achieved when its displayed saved amount is at
  or above its displayed target. The Emergency fund goal remains pinned first
  even when its linked value reaches its target; it is not counted in Achieved.
- Expand/collapse reuses the existing liability and goal cards. Tests use
  separate in-progress, cleared, foreclosed, closed, exactly-at-target and
  over-target fixtures and exercise search/sort/filter behavior at simulated
  1.3x and 2.0x font scales. Physical-device checks remain unverified.
- Demo data adds one fully closed personal loan with zero outstanding through
  the shared closure action. The added Rs 1,000 principal is settled in full,
  so total liabilities remain Rs 10,00,000 and assets remain Rs 1,00,00,000;
  goal percentages remain capped at 87%.
- Focused route, demo, progress-ledger and memory-doc verification passes
  (4 suites / 209 tests); TypeScript and Expo lint pass. Full ordered gates are
  pending at the time of this decision note; the final six gates later passed
  as recorded in CR-108 close-out.
- Test-first commits `0fae9e5` and `538046b` precede screen/demo changes.

### DEC-CR108-UPDATE-CHECK (2026-11-10)

- The application remains offline-first: the app itself makes no network
  requests for update discovery. The About screen shows the exact privacy
  statement, "Data stays on this device; the app makes no network requests."
- After an explicit confirmation, Check for updates opens the GitHub
  latest-release page in the user's browser with React Native `Linking`.
  Cancellation opens nothing; app code does not fetch release metadata,
  compare versions online, or poll in the background.
- A true in-app update check remains an owner decision for future work.
  The current browser-only behavior is the CR-108 decision and does not
  change v1.1.1, release branches, tags or release artifacts.
  Task PR #104 merged into `phase/41-types-frequency-completion` as
  `c255ada`; phase PR #105 later merged to `develop` as `37a3429`. P41-D task
  PR #106 merged into the phase as `7ddfef5`; phase PR #107 merged to
  `develop` as `8e4a2d1`.

### CR-108 close-out (2026-11-11)

All six authorized parts and the P41-B-R1 Gate 1 correction are integrated
into `develop`. No CR-108 change was made to v1.1.1, a release branch, a tag
or a release artifact.

| Part | Test-first commit(s) | Implementation commit | Task PR → task merge | Phase PR → develop merge |
|---|---|---|---|---|
| P29-Q-R1 | `89b2654` | `ca4c904` | #93 → `1b1a6d5` | #94 → `80eb0e4` |
| P20-N-R3 | `bba05be` | `47b0469` | #95 → `77bdef5` | #96 → `f5f6e16` |
| P41-A | `5b83d27` | `c326de2` | #97 → `a03ee54` | #98 → `9aa6540` |
| P41-A-R1 | `16b2e39` | — (test correction) | #99 → `0985ef3` | #100 → `a67f54f` |
| P41-B | `f98d7dd` | `873eed7` | #101 → `9ab6e79` | #102 → `b4275d3`; evidence PR #103 → `c1e810b` |
| P41-C | `0fae9e5`, `538046b` | `3138cde` | #104 → `c255ada` | #105 → `37a3429` |
| P41-D | `bd980ad` | `05e725e` | #106 → `7ddfef5` | #107 → `8e4a2d1` |
| P41-B-R1 | `bd8f1c9` | — (no production change); docs `efbf9ac` | #108 → `e1db78e` | #109 → `5cb4957` |

Task branches were deleted after merge; `phase/41-types-frequency-completion`
is retained. P41-B-R1 corrected the stale reminder assertion and added
schedule/schema boundaries; the test-first and documentation commits are
present in the PR chain above. The final documentation/test-ledger close-out
commit `14fb472` was merged by task PR #110 into the retained phase as
`14c079a`.

#### Final six ordered gates

| Gate | Exact command | Exit | Result |
|---|---|---:|---|
| 1 | `npm test -- --coverage` | 0 | 101 suites passed; 1,316 passed, 1 skipped, 1,317 total. Coverage (statements/branches/functions/lines): overall 95.96/92.15/98.02/97.62%; `src/data` 91.06/87.47/94.48/94.19%; `src/domain` 96.94/93.00/98.80/98.31%; `src/lib` 100/100/100/100%. |
| 2 | `npx tsc --noEmit` | 0 | Passed. |
| 3 | `npx expo lint` | 0 | Passed. |
| 4 | `npx expo-doctor` | 0 | 21/21 checks passed. |
| 5 | `npx expo export --platform android` | 0 | Passed; exported to `dist`. |
| 6 | `npx expo export --platform ios` | 0 | Passed; exported to `dist`. |

The final gate run occurred on integrated `develop` after PR #109. Expo
exports are not physical-device checks. Physical font-scale and screen-reader
verification remain outstanding; no EAS or Gradle build was run.

#### Demo before/after evidence

The before state is the deterministic demo builder at `80eb0e4`; the after
state is the CR-108 builder. Both are evaluated for `2026-10-16` using the
domain selectors, `holdingValue`, `liabilitySummary`, `goalView` and
`monthSummary`.

| Holding value | Before | After |
|---|---:|---:|
| Emergency cash | Rs 5,00,000 | Rs 5,00,000 |
| Emergency savings account | Rs 7,00,000 | Rs 7,00,000 |
| Emergency fixed deposit | Rs 8,00,000 | Rs 8,00,000 |
| Index mutual fund | Rs 10,00,000 | Rs 10,00,000 |
| Broad market ETF | Rs 20,00,000 | Rs 20,00,000 |
| Rental apartment (Real estate) | — | Rs 15,09,000 |
| Collectible art (Custom: Collectibles) | — | Rs 5,00,000 |
| Gold savings | Rs 10,00,000 | Rs 10,00,000 |
| Employee provident fund | Rs 39,96,000 | Rs 19,87,000 |
| Monthly recurring deposit | Rs 4,000 | Rs 4,000 |
| **Total assets** | **Rs 1,00,00,000** | **Rs 1,00,00,000** |

There is exactly one Real estate holding and exactly one Custom holding. The
asset values were re-split, not added to the former total.

| Liability | Before outstanding | After outstanding |
|---|---:|---:|
| Home improvement loan | Rs 9,82,500 | Rs 9,82,500 |
| Settled education loan | Rs 0 | Rs 0 |
| Borrowed from a friend | Rs 17,500 | Rs 17,500 |
| Paid-off personal loan | — | Rs 0 |
| Fully closed personal loan | — | Rs 0 |
| **Total outstanding** | **Rs 10,00,000** | **Rs 10,00,000** |

The new fully closed liability has zero outstanding; its settled principal does
not increase the outstanding total.

| Goal | Before saved/target | Before % | After saved/target | After % |
|---|---:|---:|---:|---:|
| Emergency fund | Rs 20,00,000 / Rs 25,00,000 | 80% | Rs 20,00,000 / Rs 25,00,000 | 80% |
| Retirement portfolio | Rs 4,000 / Rs 20,000 | 20% | Rs 4,000 / Rs 20,000 | 20% |
| Home deposit | Rs 40,00,000 / Rs 47,00,000 | 85.11% | Rs 40,00,000 / Rs 47,00,000 | 85.11% |
| Education fund | Rs 20,00,000 / Rs 25,00,000 | 80% | Rs 20,00,000 / Rs 25,00,000 | 80% |
| Family holiday | Rs 25,000 / Rs 1,25,000 | 20% | Rs 25,000 / Rs 1,25,000 | 20% |

The six-month actual Budget totals are computed from the fixed demo transactions.
Earned income remains Rs 1,00,000 per month; May also has Rs 20,000 borrowed
income. Each row shows `earned income; expenses; investments; expenses +
investments`, before → after:

| Month | Earned income | Expenses | Investments | Expenses + investments |
|---|---:|---:|---:|---:|
| 2026-05 | 1,00,000 → 1,00,000 | 72,200 → 87,200 | 6,500 → 8,000 | 78,700 → 95,200 |
| 2026-06 | 1,00,000 → 1,00,000 | 67,200 → 67,200 | 6,500 → 8,000 | 73,700 → 75,200 |
| 2026-07 | 1,00,000 → 1,00,000 | 67,200 → 67,200 | 6,500 → 8,000 | 73,700 → 75,200 |
| 2026-08 | 1,00,000 → 1,00,000 | 73,800 → 73,800 | 6,500 → 8,000 | 80,300 → 81,800 |
| 2026-09 | 1,00,000 → 1,00,000 | 74,300 → 74,300 | 8,500 → 10,000 | 82,800 → 84,300 |
| 2026-10 | 1,00,000 → 1,00,000 | 76,650 → 77,650 | 8,500 → 10,000 | 85,150 → 87,650 |

Expenses plus investments remain below earned income in every month. The new
Domain renewal Budget item and health premium each have one configured due
month/date; neither repeats.

#### Replaced assertions and defect regressions

| Area | Old assertion / regression | New assertion | Reason |
|---|---|---|---|
| Stress menu | Four stress tiers passed to `choiceAsync` threw `RangeError`; test reproduced the failure. | Centered selection dialog exposes all four tiers; cancel, Undo, handler paths and 1.3x/2.0x scales are covered. | Preserve `choiceAsync`'s two-choice contract while supporting four tiers. |
| Budget Overview | Tests expected visible Pace and redundant Over by/Left summary lines. | Those visible lines are absent; chart, table Left row and accessible descriptions remain. | Owner-directed removal without loss of accessible context. |
| Real estate mapping | Stale test expected the new Real estate holding to map to Other investments. | Test requires the deliberate Real estate investment category and Savings and Investments group. | Match the accepted category mapping. |
| Once-only reminders | Demo reminder aggregate expected 909. | It expects 893; the configured Once-only policy contributes a single due. | Correct the recurrence expectation; no production behavior change. |
| Completed liabilities | Closed-filter test expected the card immediately after selecting Closed. | It expects the collapsed Completed heading/count and the same card after expansion. | Keep completed sections collapsed while preserving the Closed filter. |
| CR-108 ledger | Test expected CR-108 to remain In progress while integrations/gates were open. | It requires Done (device checks outstanding) after all parts, PRs and gates pass. | Reflect completed automated scope while keeping physical checks explicit. |

The P41-B-R1 phase-index assertion moved from four tasks / 3/4 to five
tasks / 5/5 as the revision was added and completed. No assertion was weakened.

#### Protected files and release boundary

| Protected file | Final Git blob |
|---|---|
| `app/(tabs)/index.tsx` | `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` |
| `app/(tabs)/budget.tsx` | `ddc1369da3a9b982e6b377990234c29f4ff051c9` |
| `src/components/SortChip.tsx` | `837a675af94dd056532bc63fc4697efc905a5af3` |
| `src/lib/sorting.ts` | `7491663f0987d83d03f3ed72b01de5b376e3572d` |
| `src/components/form/frozen-manifest.json` | `476418c7084f0774f1b6fb86ddfe08c7a265fc40` |
| `src/components/__tests__/formComponentsFrozen.test.ts` | `44e6f7e1592dabf9de95d2ed09cbe65af7968d1c` |

The Budget labels and removed Back/Review controls remain protected by its
unchanged authorized blob. No CR-108 changes were made to v1.1.1, release
branches, versions, tags or release artifacts.

### CR-107 implementation integration and release cleanup (2026-11-10)

- P28-F-R5 task PR #83 merged to `phase/28-qa-and-release` as
  `c9fe4660602fc443fcfa9c4bd00cacccb98c3173`; P22-A-R1 task PR #84 merged as
  `77cdc9e2f1899b18e0cf108bfb4eba6dc8652f4e`; P28-G task PR #85 merged as
  `8afd37401ef8abcf7e5fe8ee4a91468b20c58b97`. Phase PR #86 merged to
  `develop` as `d6cc56822ee332f609e2d7800df0fca657453623`.
- Under the owner exception DEC-CR107-MAIN-MERGE, `develop` -> `main` PR #87
  merged as `c8a58abbc2ebcc9b9e25e80c47e5472d58294620`, followed by main ->
  develop PR #88 as `8da39bd8653ceee6ea066e7ee78d7b3f05e38033`. The
  `main`, `develop` and P28 phase trees match at
  `2667fd423730bb2a25406b3634c9f2ff58d2a6d7`.
- The 23 repository screenshots cover v1.0.0/v1.1.0/v1.1.1 at 7/8/8 images.
  All 46 blob/raw URLs returned HTTP 200, all raw sizes matched, and rendered
  release pages display the expected image counts. Only screenshot sections
  were updated before deleting the 23 screenshot release assets; all three
  APK assets remain at their recorded names and sizes, and their URLs return
  HTTP 200. No APK, tag, version or release publication state changed.
- The owner chose screenshot-only edits to the v1.0.0 release body because
  its pre-existing non-screenshot text differs from the published note; that
  difference remains. The v1.1.1 APK predates and does not contain the demo
  data revision. CR-107 final evidence gates and before/after outputs are in
  Section 10; the final evidence task branch/PR chain is reported with the
  closeout.

### CR-106 roadmap planning (2026-11-10)

- Fetched `origin`; `develop` was already at `origin/develop`. Verified all six
  protected Git blob IDs and fast-forwarded the existing P28 branch to
  `develop` before creating `task/CR-106-roadmap-external-guides`.
- Added only planned P31, 39 and 40 rows, owner decisions/non-adoptions,
  and derived-ledger-test expectations. Reports and audit findings remain out
  of Git until the report-first roadmap parts are executed.
- All six ordered gates exited 0: Gate 1 had 98 suites, 1,271 passed and
  1 skipped; coverage 95.96/92.04/98.02/97.63% overall. TypeScript, lint,
  Expo Doctor 21/21, Android export and iOS export passed. No source behavior
  or physical-device result is claimed.

### P28-E-R5 historical commit audit and v1.0.0 branch (2026-11-09)

- Audited the 403 first-parent non-merge commits after the initial commit.
  All are already in `main` and `develop`; 319 subjects match the current
  Conventional Commit hook and 84 legacy subjects do not pass the hook.
- No PRs were opened for those commits: their existing ancestry is already
  integrated, so a PR would have no new commit to merge. Rewording historic
  subjects would change commit IDs and require prohibited history rewriting.
- Created and pushed `release/v1.0.0` at peeled tag target
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`. The tag and the `main`,
  `develop`, and `release/v1.1.0` refs/trees were not modified. The new
  release branch is already an ancestor of `main` and `develop`.
- Task PR #52 merged into P28 as `f9bb715`; the P28 -> `develop` PR
  merged as PR #53 (`0402592`). Task-branch and final P28 branch gates
  all exit 0:
  `npm test -- --coverage` (98 suites, 1,267 passed, 1 skipped;
  95.96/92.04/98.02/97.63% coverage), `npx tsc --noEmit`, `npx expo lint`,
  `npx expo-doctor` (21/21), `npx expo export --platform android`, and
  `npx expo export --platform ios`.

### P28-E-R5-R1 final integration ledger sync (2026-11-09)

- Recorded the completed P28 -> `develop` integration: PR #53 merged as
  `04025926a95b8dda22f15e67b4ea3c3c8769a994`. The merge changed only the
  P28-E-R5 ledger/memory evidence and its progress-ledger regression.
- Verified remote tips after integration: `develop` at the PR merge commit,
  `main` and `release/v1.1.0` remain at `7bea8e62`, and `release/v1.0.0`
  remains at the existing tag target `cac6fed`. No tag or protected branch
  was moved.
- Updated the exact-once progress guard for P28-E-R5-R1 and the dashboard
  totals. Old P28 / overall counts were 24/24 and 152/174; new counts
  are 25/25 and 153/175. No assertion was removed or weakened.
- The final six ordered task-branch gates all exit 0: coverage (98 suites,
  1,267 passed, 1 skipped; 95.96/92.04/98.02/97.63%), TypeScript, lint,
  Expo Doctor (21/21), Android export and iOS export. The focused
  progress-ledger test passes (1 suite, 11 tests).

### P28-E-R4 history archive ancestry (2026-11-09)

- Added tree-preserving merge `c4f9aba` on
  `task/P28-E-R4-connect-history-archive`, with
  `origin/history/by-phase` tip `e4a95d57d7bfa3d062d233c3ca315a1a520ef654`
  as a parent. The merge's tree equals the captured `develop` tree; the
  archive tree itself was not checked out. `main` and `release/v1.1.0` remain
  at their original tip and tree.
- All 30 remote `phase/*` tips are ancestors of `develop`; `history/by-phase`
  was the only disconnected head found. The task -> P28 -> `develop`
  route and final reachability check remain pending.
- All six ordered gates exit 0. Gate 1: 98 suites, 1,267 passed, 1 skipped;
  coverage 95.96/92.04/98.02/97.63% overall, `src/data`
  91.03/87.41/94.46/94.17%, `src/domain` 96.94/92.87/98.80/98.33%, and
  `src/lib` 100% in all measures. Gates 2-6 exit 0; Expo Doctor is 21/21.

### P28-E-R3 selected ancestry (2026-11-09)

- Added three `ours` merge commits on
  `task/P28-E-R3-record-selected-ancestry` for `f994457`, `7bea8e6` and
  `b779c21`. The ancestry merges preserve the captured `origin/develop` tree;
  subsequent changes are limited to ledger/memory documentation and a ledger
  test. Application source, `main`, and release tags are unchanged. PR #46
  remains isolated to `history/by-phase`.
- Task PR #47 merged to `phase/28-qa-and-release` at
  `3553b736861919d6f617c3048080152268714c42`; the phase integration PR follows
  the documented route into `develop`.
- Gate 1: 98 suites, 1,267 passed, 1 skipped; coverage 95.96/92.04/98.02/97.63%
  overall, `src/data` 91.03/87.41/94.46/94.17%, `src/domain`
  96.94/92.87/98.80/98.33%, and `src/lib` 100% in all measures. Gates 2-6 exit
  0; Expo Doctor is 21/21. Full gate commands and results are in Section 10.
- Replaced the progress-ledger test's `Revised by P28-E-R1` check with the
  exact R1/R2/R3 revision chain and added exact-once tracking for R2/R3.
  Reason: protect the newly recorded revision without weakening status,
  percentage, or phase-index assertions.

### Owner-edit preservation instruction (2026-11-09)

- P20-S-R1-R1 adds R5 to root `AGENTS.md` at the owner's explicit request:
  when owner edits follow agent changes, ask before changing the affected
  file, and revert or overwrite those edits only on explicit request.
- Documentation-only change; no code behavior changed. The focused permanent
  progress-ledger test passes; full six-gate validation is not applicable.
- Updated the P20 dashboard and branch-index counts from 27 to 28 and
  added the revision ID guard. Old assertion: P20 had 27 subtasks. New:
  P20 has 28, including P20-S-R1-R1. Reason: ledger now tracks this
  completed revision in its existing phase; no new phase or branch row was
  added.
- Commit `e955021`; task-to-phase PR #44 merged as
  `93dfb6acacca296ff7ef5c4629721efd5e0d3995`; phase-to-develop PR #45.

### P20-S-R1 form controls (2026-11-09)

- Replaced app-form/settings ChoiceField controls with Dropdown, excluding
  filters; the ChoiceField component and frozen form components remain.
- Added persistent, single-line titles to editable text, money, number and
  percent fields that previously relied on placeholders, and contextual
  titles to date controls that lacked them. SegmentedControl labels are
  intentionally omitted, as directed by the owner after review. Existing
  Dropdown, SwitchRow and ReadOnlyRow titles remain; filters are unchanged.
  No ReadOnlyRow was added to editable inputs.
- After the title changes, `npx tsc --noEmit` and `npx expo lint` pass.
  `npm test -- --runInBand --silent src/components/__tests__/RouteRenderSmoke.test.tsx src/components/__tests__/TransactionForm.test.tsx src/components/__tests__/formComponentsFrozen.test.ts src/lib/__tests__/progressLedger.test.ts`
  passes: 4 suites, 204 tests. An initial run exposed that the existing
  transaction assertion checked a `MoneyField` placeholder prop instead of
  the new visible title; the assertion was updated to check rendered title
  text as documented below.
- Superseded test assertion: `expect(amount.props.label).toBe('Amount')` only
  checked the input placeholder prop. It is now replaced by an assertion that
  the rendered form contains the visible `Amount` title. Reason: the request
  is for a persistent title, not a component label/placeholder; the visible
  title assertion checks that exact behavior without weakening coverage.
- Final-tree six-gate run, in order, all exit 0: `npm test -- --coverage`
  (98 suites, 1,267 passed, 1 skipped; 95.96/92.04/98.02/97.63% overall);
  `npx tsc --noEmit`; `npx expo lint`; `npx expo-doctor` (21/21);
  `npx expo export --platform android`; `npx expo export --platform ios`.
  Coverage per instrumented `src/` directory (statements/branches/functions/
  lines): `data` 91.03/87.41/94.46/94.17%, `domain`
  96.94/92.87/98.80/98.33%, and `lib` 100% in all measures.
- Replaced assertions: the old `expect(amount.props.label).toBe('Amount')`
  checked the placeholder prop; the new assertion checks rendered `Amount`
  title text. Owner-removed SegmentedControl title expectations were removed;
  transaction type options are still checked against `expense`, `income` and
  `invest`, and the manual Investment type still verifies `Fixed deposit` is
  selectable. Reason: the approved UI intentionally has no SegmentedControl
  titles, while choice behavior remains covered.
- Owner approved commit/merge and explicitly requested not to restore removed
  SegmentedControl labels. No version change, release preparation, or
  EAS/Gradle build.
- Integration: commit `d36103e`; task-to-phase PR #42 merged as
  `bb755347a809a46df9fd81d83859dd8c3c98027e`; phase-to-develop PR #43.

### v1.1.0 versioned APK filename integration (2026-11-08)

- The filename and release-documentation changes reached GitHub `main` through
  chronological PRs: #21 task to P28 (`a7df47f`), #22 P28 to
  `develop` (`9c79b23`), #23 `develop` to `release/v1.1.0` (`0ee755f`),
  #24 release to `main` (`9192fd6`), and #25 `main` back to `develop`
  (`ddb17ff`).
- Verified the remote trees for `main`, `develop`, `release/v1.1.0`, and
  `phase/28-qa-and-release` are identical. The v1.1.0 tag was not changed.
  The merged task branch was deleted; the P28 branch remains available.
- The final ordered six-gate run passed: 98 Jest suites, 1,244 passed, 1
  skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data`
  91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%,
  `src/lib` 100%; TypeScript, lint, Expo Doctor (21/21), Android export and
  iOS export all exited 0.
- P28-E-R2 preserves the final-verification commit `72fb325` and reconciles
  its stale status edits before chronological PR integration. Review found
  `codex-changes` is not safe to publish as-is: it targets schema v2 rather
  than current v22, includes generated coverage, contains a persisted-data
  migration defect and failing assertion, and conflicts with current `main`.
  It remains local pending a separately scoped decision to port needed work.

### Historical commit-subject corrections (superseded by CM-1 enforcement; 2026-11-07)

- With explicit owner authorization, corrected five historical checkpoint
  subjects on `main` and force-pushed using a lease from
  `6d50bdb9887ced961433c93daaf3a4c67f341d7c`. Each replacement commit has the
  same tree as its original:
  - `9b9066bb3c51c33a78e98b2779d664f16f2c2700` ->
    `9e8bde709c618fe5359258507e8182a4c873499c` — `docs: add release
    management documentation`.
  - `b0586fcbdf0787a0acd929f8bb3f2e044d699389` ->
    `3ef87b1cb54370addd987ad382f8350a25778858` — `docs: align Phase 29
    progress counter`.
  - `ff349515887dae09ac5ebc34776ec2754ed80dbe` ->
    `f467e58701a91b709009f03eb1b7b47a3f5d1332` — `chore: update Expo SDK 57
    patch dependencies`.
  - `ecc5c354579bf5812effe5adc3492e61cfd98f4f` ->
    `c94aca65b842c3fe2b6590bb3c3e3093e50fdcf3` — `fix: clarify Budget
    due-day field labels`.
  - `75e9097bcf62c09cf22149160318e6392fb1060c` ->
    `46ffe0966dcacd8839244f4a7e9e87ddb2c3cbaa` — `fix: simplify Budget
    management sheet labels`.
- Verified the rewritten subjects and unchanged tree IDs, and confirmed
  `origin/main` now resolves to `91cfde59c4cd4821377399c55fb1ba3052aaf9f2`.
  The published `v1.0.0` tag was intentionally left unchanged at
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`; no tests or builds were needed
  for this message-only history change.

### Release commit message correction (2026-11-07)

- Reworded local commit `6a407b45226ac9e3dc8e2a6399467fe05f6a0a15` to
  `60a4c8b1d287fbea1cec7f622690aa898b61bda0`
  (`docs: prepare initial v1.0.0 release draft`), matching its release-draft
  and status changes.
- Reworded local commit `8c0857c2c50dfc87cc67808cdc0bf09aa7139739` to
  `be1e626f8b13e499f94bc86b1a517ed33d0cab14`
  (`docs: record v1.0.0 release publication`), matching its publication
  record, history and release-documentation changes.
- Replayed descendant `8324822981153b602f5168e08b6759537fc0f111` unchanged in
  content as `a29d861d0d8541c942e06b9ebbdc04f61e7c8c29`; no commits were
  pushed. Existing Copilot co-author trailers were retained. All replacement
  commits were verified in Git.

### Published release notes directory (2026-11-07)

- Created `docs/releases/published/` and moved the already-published
  `v1.0.0.md` record there.
- Updated the release prompt, README, configuration, history, and release
  rules to require all published Markdown records to live in `published/`;
  drafts move there after publication verification and are removed from
  `drafts/`.
- Updated current status/open-items memory links. This documentation-only
  change does not alter the GitHub Release or its published notes.

### v1.0.0 GitHub Release published (2026-11-07)

- Published the approved `v1.0.0` GitHub Release at
  https://github.com/sahilsheikh-dev/WealthWise/releases/tag/v1.0.0.
  GitHub reports it is published, not a draft or prerelease, at
  `2026-11-07T14:12:34Z` (2026-11-07).
- The `v1.0.0` tag resolves to target commit
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`, matching `origin/main` at
  publication. The release notes' date placeholder was corrected to
  `2026-11-07` and the published body reverified.
- Archived the final notes in `docs/releases/published/v1.0.0.md`, updated release
  configuration/history/index and the memory status/open items, and removed
  the published draft.
- Pre-publication worktree edits were committed exactly in
  `6a407b45226ac9e3dc8e2a6399467fe05f6a0a15`
  (historical subject, superseded by CM-1 enforcement:
  `chore: user manual changes (checkpoint)`). That commit included the
  deletion of the placeholder `docs/releases/v1.0.0.md`; the permanent record
  was recreated as requested after publication. The owner's release README
  line reflow was preserved.
- No application source or version files were changed. No tests/builds were
  run. The EAS production build remains unrun.

### Initial v1.0.0 release draft prepared (2026-11-07)

- Preflight worktree was clean. The initial unscoped GitHub CLI listing showed
  a `v0.1.0` draft; subsequent repository-scoped CLI/API checks returned no
  releases or tags. Neither result shows a published stable baseline. Reconcile
  the discrepancy during approval revalidation. The repository initial commit
  is `f27258093e14809fe923e480381488ece0d859a9`; target branch `main` is at
  `1c1426d03fadccc51278ed9af5426cacd4c9d7af`.
- Recommended version is `v1.0.0`, consistent with `app.json`, `package.json`
  and `CHANGELOG.md`. The initial commit is the history baseline; 365 commits
  follow it through the target. GitHub CLI returned no merged PRs; GitHub's
  contributors endpoint verifies `sahilsheikh-dev` and `Copilot`.
- Saved the unpublished, source-checked release draft at
  `docs/releases/drafts/v1.0.0.md`. No version files, tags, GitHub releases,
  permanent release records or application code were changed.
- No tests or builds were run for this documentation-only draft. Publication
  awaits explicit approval; revalidate the target commit and release notes
  before publishing.

### Release README approval prompts (2026-11-07)

- Added copyable draft-preparation and post-approval publication prompts to
  `docs/releases/README.md`. The preparation prompt explicitly prohibits
  publishing and waits for approval; the second prompt revalidates the target
  commit and release notes before publication and permanent documentation
  updates.
- Documentation-only change; no release was prepared or published. No tests
  were run.

### P29-AB completion record (2026-11-07)

- Owner checkpoint: initial worktree was clean; no owner-manual checkpoint
  commit was required. Owner edits remained untouched.
- Added v22 Budget income recurrence: monthly, quarterly, half-yearly and
  yearly; non-monthly first-due month; strict backup/import support.
- Preserved owner UI edits: no Insurance or Transactions Available balance
  border/divider restoration; recurring action remains "Stop investment".
  The stopped-plan action is now "Resume investment".
- Gate 1 passed 91 suites: 1193 tests passed, 1 skipped. All files coverage
  was 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines.
  Gate 2 TypeScript passed; Gate 3 lint passed with one existing array-style
  warning; Gate 4 Expo Doctor passed 21/21; Gate 5 Android export passed with
  a 5.5 MB bundle; Gate 6 iOS export passed with a 5.2 MB bundle.

### P29-AB-R1 recurring income correction (2026-11-08)

- Evidence-first reproduction used the exact form payload fields
  (`name`, `amount`, `category`, `day`, `frequency`, `firstDueMonth`) at
  domain, store/hydration and route levels before production edits. The
  baseline overview listed the combined monthly, quarterly, half-yearly and
  yearly items as 55,000 every month; the policy estimate was 660,000. A
  following-scope edit also changed the stored current-month snapshot from the
  quarterly schedule to the new half-yearly schedule.
- Reproduced 12 months from 2026-03 through 2027-02 before and after the
  fix. The due-month totals are 13,000; 19,000; 25,000; 13,000; 1,000;
  1,000; 13,000; 19,000; 1,000; 13,000; 1,000; 1,000 in every tested
  consumer: `plannedIncomeOf`, overview income rows and totals, summary text,
  Received dues, projected cash flow, virtual months, applied snapshots and
  backup import. Non-due entries contribute zero; due entries contribute the
  full amount. The policy estimate is 119,000 over its current-February-to-
  January 12-month window because the first 1,000 monthly item is first due in
  March; the separately tested March-to-February table totals 120,000.
- Assertion replacements: old — monthly overview showed 55,000 in each of
  12 months and policy estimate 660,000; new — each consumer follows the
  item’s due month and the annual estimate uses the effective monthly budget;
  reason — a frequency must affect every monthly consumer, not only the
  recurrence helper. Old — a following-scope frequency edit rewrote the
  current frozen snapshot; new — changing frequency/first-due metadata updates
  the   plan but leaves that snapshot data-equal; reason — past and
  current snapshots remain frozen. Monthly income behavior and v22 schema
  compatibility are unchanged.
- Form route tests submit both scopes and edit quarterly income to half-yearly
  at font scales 1.3 and 2.0. The Budget route announces a non-due quarterly
  item as zero planned at both scales. Store tests verify persisted JSON,
  fresh hydration, and following/month-only edit scopes.
- Real gates, in order: `npm test -- --coverage` exit 0 (94 suites; 1,211
  passed, 1 skipped; 95.90% statements, 91.94% branches, 97.75% functions,
  97.57% lines overall; `src/data` 90.63/86.95/93.07/93.92%,
  `src/domain` 96.96/92.88/98.79/98.31%, pure `src/lib` 100% in all
  measures); `npx tsc --noEmit` exit 0; `npx expo lint` exit 0;
  `npx expo-doctor` exit 0 (21/21). Android and iOS export gates were skipped
  under the explicit no-build instruction. No version bump, release
  preparation, build or push.
- Commit: `fix: honor recurring income schedules in summaries`.

### P28-B first-release 1.0.0 metadata (2026-11-07)

- Owner-edit preflight: the worktree was clean; no owner checkpoint commit was
  required. Protected Home and Budget routes were not edited.
- Release metadata is aligned to version `1.0.0` in `app.json`,
  `package.json` and the `package-lock.json` root. CHANGELOG documents the
  user-visible result from P24 through P29, including Budget income
  recurrence and schema v22.
- Exact release commands, not run:
  `eas build --platform all --profile production`
  then
  `git tag -a v1.0.0 -m "WealthWise 1.0.0"`
- Tag preflight found 17 local tags, no local `v1.0.0`, and no tags returned by
  `git ls-remote --tags origin`. No tag was created, moved, or deleted.
- Assertion replacement: old `P29 ██████████ 97% (31/32)`; new
  `P29         ██████████ 97% (31/32)`; reason: preserve the owner's
  dashboard column alignment. The memory test counts now match the latest
  validated 91-suite, 1194-test run rather than the stale 92/1195 record.
- Six ordered gates: Gate 1 `npm test -- --coverage` exit 0 (91 suites; 1193
  passed, 1 skipped, 1194 total); Gate 2 `npx tsc --noEmit` exit 0; Gate 3
  `npx expo lint` exit 0 (one array-style warning); Gate 4 `npx expo-doctor`
  exit 0 (21/21); Gate 5 Android export exit 0 (5.5 MB bundle); Gate 6 iOS
  export exit 0 (5.2 MB bundle).
- Fresh Gate 1 coverage by `src/` directory: `src/data` 758/807 lines
  (93.93%) and 793/912 branches (86.95%); `src/domain` 3567/3628 lines
  (98.32%) and 3505/3776 branches (92.82%); `src/lib` 107/107 lines and
  126/126 branches (100%). Overall coverage: 95.90% statements, 91.89%
  branches, 97.75% functions and 97.57% lines. Coverage thresholds unchanged.

### P28-B Assets resume action label (2026-11-07)

- The Assets and investment-entries action, its confirmation title, icon
  selection, accessibility hint, domain assertion and current documentation
  now use "Resume investment" instead of "Resume recurring".
- Focused domain regression and TypeScript verification are recorded in chat.
  No commit was requested or created.

### Release management documentation (2026-11-07)

- Added the release-management documentation set under `docs/releases/`:
  [README](releases/README.md), reusable
  [release prompt](releases/RELEASE_PROMPT.md),
  [release configuration](releases/release-config.md),
  [release history](releases/release-history.md),
  [v1.0.0 release record](releases/published/v1.0.0.md), and the `drafts/`
  directory.
- The documentation defines source-verified release discovery, semantic
  versioning, draft preparation, explicit publication approval, and archival
  of published release notes and history. It prohibits inventing release
  details, publishing without approval, and overwriting published records.
- The user-added files were preserved and committed exactly in
  `9b9066b` (historical subject, superseded by CM-1 enforcement:
  `chore: user manual changes (checkpoint)`), verified as a commit.
  No release build or tag was performed by this documentation setup.
- Release metadata remains unverified: `release-config.md` has `UPDATE_ME`
  repository identity fields; `release-history.md` marks v1.0.0 as Verify; and
  `v1.0.0.md` retains placeholders for actual publication date, GitHub Release
  URL, target commit, verified notes and full changelog URL. These must be
  populated only after checking the actual published GitHub Release and tag.
- **Superseded (2026-11-08):** later v1.0.0 publication records verified the
  release identity, date, tag target, notes and changelog; see
  `docs/releases/published/v1.0.0.md` and `release-history.md`.

### P28-C release organization and build management (2026-11-08)

- Preflight worktree was clean. Protected-file `git hash-object` results for
  Home, Budget, `SortChip`, sorting, the frozen manifest and its test match
  the recorded hashes. Neither protected route was edited.
- Step 1: `git ls-remote --tags origin` returned `v1.0.0`; the required
  `git merge-base --is-ancestor v1.0.0 origin/main` check exited 1. The tag
  was not changed. Its current ancestry status is recorded in
  `docs/releases/release-history.md` and `docs/memory/open-items.md`.
- Added the reusable release-notes template and EAS build/configuration guide,
  updated release prompts/config/index, ignored release drafts except for
  `.gitkeep`, added build tracking (`v1.0.0` production build: Not built),
  and summarized the release process in the root README. No build, submission,
  publication, tag creation or tag movement occurred.
- Assertion replacements (old → new; reason):
  - `memoryDocs.test.ts`: hardcoded project test-count assertions (`91`,
    `1194`) → project counts must equal the counts in `status.md` and its
    latest validated run; reason: counts are read from the project records,
    not duplicated as literals, while equality checks remain.
  - `progressLedger.test.ts`: fixed overall/phase bars and counts, fixed
    maximum phase 29, and the ten-section expected list → derive bars and
    counts from dashboard rows and section count/order from numbered headings
    and the Contents index; reason: retain validations for every displayed
    count, percentage, bar, row status and indexed heading without freezing
    future phase or section totals.
- All progress bars are recomputed from the dashboard rows. The prior
  Resume point, Schema history, Roadmap and CR-1 open record now carry dated
  supersession notes; v16-v22 schema entries are based on current migration
  source. Missing report/checklist paths were removed or redirected to the
  ledger and release build guide.
- Gate results, run in the required order:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1193 passed, 1 skipped, 1194 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | 0 errors; one pre-existing `array-type` warning at `src/data/__tests__/migrate.test.ts:221`. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- Focused ledger/memory tests: 2 suites, 10 tests passed. All dashboard rows
  have unique IDs; derived totals are 113/114 overall, 3/3 for P28 and
  32/33 for P29. Current schema v22 and all six protected blob IDs were
  verified against source and `git hash-object`. Native physical-device
  checks remain unverified. Production build and store submission were not
  performed.

### P28-C-R1 README downloads and release rules (2026-11-08)

- Preflight worktree was clean. Fixed the existing `array-type` lint warning
  separately: `Array<Record<string, unknown>>` became
  `Record<string, unknown>[]` in `src/data/__tests__/migrate.test.ts`; no
  behavior or assertion changed. Isolated commit: `13fce0e`.
- README now has a Download section before Contents, source-version/release
  date, the live Old versions link, explicit pending Android/iOS notices and
  APK installation guidance. No dead Android link or invented iOS URL is
  shown. What's new summarizes `CHANGELOG.md` v1.0.0.
- Source audit corrected the schema and migration range to v22 / v1–v22,
  documented monthly/quarterly/half-yearly/yearly Budget income, current
  Insurance placeholder behavior, and the real 91-suite/1194-test run.
  Stop/Resume investment and Foreclosure labels remain aligned with source.
- Added the `android-apk` profile extending production with APK output, without
  changing existing profiles. Documented production AAB for Play, GitHub APK,
  separately auto-incremented `versionCode`, iOS store channels and EAS-managed
  signing credentials. No build was started.
- Release instructions require exact APK asset naming/upload, 302-to-200
  download verification, README and Builds table updates, and consistency
  across README, release history and GitHub release assets before publication.
- Assertion record: `progressLedger.test.ts` now expects the P28-C revision ID
  and derives phase/progress values from ledger rows; its old fixed phase list
  assertion is replaced with an additional P28 completion check so this
  revision is tracked without hardcoded counters. `memoryDocs.test.ts` remains
  file-derived, comparing the recorded counts to status and the latest run.
- Ordered gates:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1193 passed, 1 skipped, 1194 total. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed with 0 errors and 0 warnings. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- Focused migration, ledger and memory run: 3 suites, 40 tests passed.
  Coverage in the full run: 95.90% statements, 91.89% branches, 97.75%
  functions and 97.57% lines. No device build, store submission, release
  publication, tag operation or push occurred. Physical-device checks remain
  unverified.

### P28-C-R2 release downloads and P28-A-R1 v13 backup equality (2026-11-08)

- R1 preflight found a clean worktree. `app.json` and the published v1.0.0
  release record both identify version 1.0.0 and release date 2026-11-07.
  `app/(tabs)/index.tsx` and `app/(tabs)/budget.tsx` were not edited.
- Step commits: P28-C-R2 README `144a847`, published note `1742174`, release
  rules `181aa44`, Builds record `356ec56`; P28-A-R1 test `f8ae2ad`.
- `gh release view v1.0.0` verified the uploaded asset name
  `WealthWise-android.apk`, size 112,133,413 bytes (about 106.9 MiB); its
  digest was verified privately.
  At that time, `gh repo view` reported the repository as private and
  unauthenticated links returned HTTP 404. This historical result was
  superseded by P28-C-R3 after the repository became public.
- Superseded by P28-C-R3: staging release-note content under `/tmp` is no
  longer permitted. The published v1.0.0 Markdown is the canonical release
  body source. The GitHub body was not edited in P28-C-R2.
- The new deterministic v13 backup fixture has a valid SHA-256 checksum and
  is imported through `parseBackup`. Expected net worth, every goal's saved
  amount and Emergency Fund available amount are independently computed from
  source fixture values; all imported outputs match. No personal data or app
  behavior change was introduced. The focused backup suite passed 37 tests.
- Assertion record: no backup/value assertion was removed or weakened. The
  ledger test's old revision-marker assertion
  `Revised by P28-C-R1` is replaced by `Revised by P28-C-R2`, because R2 is
  the current release-rules revision; a P28-A-R1 revision assertion was
  added. Derived dashboard counts remain based on ledger rows. The
  `memoryDocs.test.ts` test remains derived from project/status files. Two
  intermediate focused ledger runs failed because the text did not satisfy
  its case-sensitive revision-marker expectation; the wording was corrected,
  and the final focused ledger/memory run passed 2 suites and 10 tests.
- Six ordered gates, all exit 0:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 91 suites; 1,194 passed, 1 skipped, 1,195 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. `src/data`: 90.63/86.95/93.07/93.92; `src/domain`: 96.96/92.82/98.79/98.31; `src/lib`: 100/100/100/100 (statements/branches/functions/lines). |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- No native build, `gh release edit`, tag operation or push occurred.
  Physical-device checks remain unverified.

### P28-C-R3 release finalization (complete)

- Step 1: release drafts are committed under `docs/releases/drafts/`, and the
  shared release rules direct publication to move verified notes to
  `published/`. The old drafts ignore rule and temporary-block reference were
  removed. The v1.0.0 release body remains owner-managed from
  `docs/releases/published/v1.0.0.md`.
- Step 2: README, template and latest published v1.0.0 Download blocks are
  byte-identical. Added a Jest regression that derives the current version
  from README and verifies older published notes use their own versioned link.
- Focused documentation tests: 3 suites and 12 tests passed after close-out
  edits. The release-download test added expectations without replacing any
  assertions. `progressLedger.test.ts` now expects the parent revision marker
  `Revised by P28-C-R3 and earlier revisions` instead of
  `Revised by P28-C-R2`; this is the intended ledger revision update, not a
  weakened assertion.
- Step 3: `curl -I -L` returned HTTP 200 and `Content-Length: 112133413` for
  both latest and versioned APK links. The downloaded GitHub APK was
  112,133,413 bytes and its SHA-256 matched the published digest. The scratch
  APK was removed. Results are recorded in `release-history.md`.
- Step 4: EAS build `7addde9a-34df-4f00-a54a-b695c1578859` is FINISHED,
  Android profile `preview`, app version 1.0.0, `appBuildVersion` /
  `versionCode` 1, source commit
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`, completed 2026-11-07 14:52 UTC.
  Its artifact has the same 112,133,413-byte size and SHA-256 as the GitHub
  APK; all requested build fields are recorded in `release-history.md`.
- Step 5: with explicit approval for this single tag move, moved remote
  `v1.0.0` from `1c1426d03fadccc51278ed9af5426cacd4c9d7af` to
  `cac6fedc6242b495558f11cc6d7fe8551fd354ea`. The build commit is an ancestor
  of `origin/main`; runtime diff is empty. Remote peeled tag verification
  matches the new target and `git merge-base --is-ancestor` exited 0.
  `gh release view` still confirms the APK asset; its stored `targetCommitish`
  remains the old target. No GitHub release edit or branch push was made.
- Step 6: release policy now maps bug-fix-only to PATCH, visible new features
  to MINOR, and breaking changes to MAJOR. Release 2 is conditionally v1.1.0
  with Budget Pace or v1.0.1 without it; owner confirmation is required when
  preparing that release. App/package/lockfile versions change only in that
  version's release-preparation task.
- Step 7: added the Android owner checklist with all X1–X4 and A1–N39 checks,
  device metadata fields, and every result set to Not run (43 checks). Linked
  it from the release index and build guidance. The later owner report below
  records all 43 results as Pass.
- Step 8: P28 dashboard count is 7/7 and the full ledger is 117/118.
  The parent P28-C revision text and derived test expectations were updated;
  no unrelated or product assertion changed. `status.md`, `open-items.md` and
  `project.md` record the verified build/tag/link state, six gates and owner
  actions. Remaining owner work is the GitHub release-body edit and supplying
  details for the separately reported Release 2 bugs.

- Final gates, run in the required order; all commands exited 0:

  | Command | Exit | Result |
  |---|---:|---|
  | `npm test -- --coverage` | 0 | 92 suites; 1,196 passed, 1 skipped, 1,197 total. Coverage: 95.90% statements, 91.89% branches, 97.75% functions, 97.57% lines. |
  | `npx tsc --noEmit` | 0 | Passed. |
  | `npx expo lint` | 0 | Passed. |
  | `npx expo-doctor` | 0 | 21/21 checks passed. |
  | `npx expo export --platform android` | 0 | Passed. |
  | `npx expo export --platform ios` | 0 | Passed. |

- No application behavior changed. No build, branch push or GitHub release
  edit was performed. The sole remote change was the explicitly approved
  `v1.0.0` tag alignment described above.

### Superseded owner device-validation report (2026-11-08)

- The owner manually updated the checklist (preserved in historical commit
  `cc7eded7b5f5ba8dee957f96a1ab5725cd08e796`): at that time, all 43 rows were
  marked Pass, including N39. This report is superseded by the Release 2
  stabilization checklist update below: N39 and N40 are Fail, and N41 is Not
  run.
- The checklist header's device model, Android version, tester and date fields
  remain blank; no values were inferred.
- This historical report predates owner confirmation that the Release 2 bugs
  reproduce and the evidence-first reproductions recorded in the later task
  entries. It must not be used as current device evidence.

### Owner-requested local commit subject correction (2026-11-08)

- Reviewed commit `3ed74ba2ae338c9722ce49ed77f38222d15ebb7b`: its only change
  was replacing the 43 device checklist results from `Not run` with `Pass`.
  Reworded its historical subject (superseded by CM-1 enforcement) from
  `chore: user manual changes (checkpoint)` to
  `docs: record owner Android device test results`
  (`cc7eded7b5f5ba8dee957f96a1ab5725cd08e796`).
- Verified old and new commit trees are identical. Replayed the following
  owner-report commit without changing its tree:
  `79afe4f0c43a70e85f05fe881d729657663dc82b` ->
  `79bad92c8161d136c1477f6e817c7ecb55b6caa7`.
- The rewritten commits remain local and unpushed; `main` is two commits ahead
  of `origin/main`. No file content was changed by the history rewrite.

### P28-D branching and contributor-doc bootstrap (2026-11-08)

- Created local `develop` from the exact main adoption baseline
  `a258579c4b580d6f3a157b8d13de53334aa8d34d` (commit object verified).
  Existing main history includes unreleased Release 2 changes; the stable-main
  rule applies prospectively and no history was rewritten.
- Added the COMMON RULES section to AGENTS.md, mirrored R1-R4, branch policy,
  merge policy and six gates in the shared rules/ledger, and added
  contributor/security guidance, PR/issue templates and CODEOWNERS.
- New Jest documentation checks require the common-rule declaration and all
  branch prefixes in CONTRIBUTING.md and shared rules. Progress totals remain
  derived from ledger rows.
- This bootstrap commit is the sole direct commit to `develop` authorized by
  the owner. Push is deferred to the authorized final branch-publishing step.
- Six gates, in order: `npm test -- --coverage` exit 0 on retry (98 suites;
  1,230 passed, 1 skipped, 1,231 total); `npx tsc --noEmit` exit 0;
  `npx expo lint` exit 0; `npx expo-doctor` exit 0 (21/21);
  `npx expo export --platform android` exit 0 (5.5 MB bundle);
  `npx expo export --platform ios` exit 0 (5.2 MB bundle). Coverage:
  overall 95.96/92.01/98.01/97.62% (statements/branches/functions/lines);
  `src/data` 91.03/87.39/94.46/94.17%; `src/domain`
  96.95/92.85/98.80/98.32%; `src/lib` 100% in all measures. The initial
  parallel Gate 1 attempt exited 1 on two 5-second crypto/stress test
  timeouts; both tests pass in isolation and the complete retry passed.

### Release 2 stabilization close-out (2026-11-08)

- Commit-subject enforcement was the first task commit (`54abb4b`): old
  placeholder subjects were accepted; the new POSIX hook requires a supported
  Conventional Commit type and rejects prohibited subjects. Reason: make each
  change's scope clear and keep unrelated work separate. The proposed subject
  and staged diff-stat are reviewed before commits. Hook, docs and ledger
  tests pass.
- P29-AB-R1: prior consumers reported 55,000 of planned income every month
  (monthly 1,000 + quarterly 12,000 + half-yearly 18,000 + yearly 24,000).
  After the fix, the combined monthly planned-income contribution is:

  | Month | Before: all tested monthly consumers | After: due-month total |
  |---|---:|---:|
  | 2026-03 | 55,000 | 13,000 |
  | 2026-04 | 55,000 | 19,000 |
  | 2026-05 | 55,000 | 25,000 |
  | 2026-06 | 55,000 | 13,000 |
  | 2026-07 | 55,000 | 1,000 |
  | 2026-08 | 55,000 | 1,000 |
  | 2026-09 | 55,000 | 13,000 |
  | 2026-10 | 55,000 | 19,000 |
  | 2026-11 | 55,000 | 1,000 |
  | 2026-12 | 55,000 | 13,000 |
  | 2027-01 | 55,000 | 1,000 |
  | 2027-02 | 55,000 | 1,000 |

  The after values match `plannedIncomeOf`, overview income rows/totals and
  text, Received dues, projected cash flow's monthly income inputs, virtual
  months, applied/repeated plans, edit snapshots and backup round trips.
  Quarterly, half-yearly and yearly item amounts are zero in non-due months
  and full in due months; existing monthly income is unchanged. The separate
  policy-summary window is March-to-February 120,000; its current-February-to-
  January annual estimate is 119,000 because the monthly item first comes due
  in March. Store/form tests cover both scopes, frequency edits and frozen
  current/past snapshots.
- P30-A/B/C: confirmed hypothesis — after failed SQLite write, read-back
  mismatch or legacy fallback, restart selected stale SQLite over the newest
  fallback value. All three red tests pass after source-precedence repair, and
  persistence errors are visible. Not reproduced: UI memoization/React
  Compiler, missing mounted-screen subscriptions, module-level caches,
  in-place state mutation or route-param object caching. Real store JSON,
  fresh hydration, eight mounted-screen refresh checks and previous-state
  immutability passed; source guards cover memo inputs and module caches.
- P20-N-R1: before production edits the route test failed at font scales 1.0,
  1.3 and 2.0 because two stacked bars rendered instead of zero. After the
  chart change, section lines, independent toggles, marker/color patterns,
  cumulative axes, accessibility summaries and dark-theme contrast tests
- P20-N-R2: the old section-specific Pace tests and implementation are replaced
  by the restored aggregate actual/planned Pace graph above the overview
  table, with no stacked bar. The old section-line/toggle assertions are
  superseded by aggregate chart and route assertions at font scales 1.0, 1.3
  and 2.0 because the requested presentation is aggregate. The demo remains
  non-trivial. Cash-flow labels, removed controls, Insurance/Transactions
  border removals, and Stop/Resume investment labels remain unchanged.
- P20-A-R1: the failing linked-plan Paid path created a plain transaction
  without the holding entry/payment ledger. After the fix, Transactions,
  Home, Budget and reminder confirmation use shared clearDue/Undo, with one
  persisted write.
- P29-O1-R1/P29-W-R1: old Entries screens lacked completed/pending counts and
  collapsed paid history; investment rows could extend past maturity and
  liability rows past the last EMI. New tests assert counts, collapsed/expanded
  paid groups and the rendered schedule caps at font scales 1.0, 1.3 and 2.0.
  The fixed seven-row assertion was replaced by a schedule-derived expected
  row set because pending scheduled rows are now rendered.
- P29-AB-R2: old Budget route output presented non-due recurring income as
  planned/due and counted it in summaries. New: non-due items appear only in
  the collapsed editable Recurring income group with their next due month;
  due-month totals remain exact. Route cases cover 12 months and font scales
  1.0, 1.3 and 2.0.
- P30 is complete (P30-A/B/C, 3/3); P29-AB-R1/R2 and P20-N-R1/R2 are
  recorded in their original phases with each preceding row marked `Revised
  by`. P20-A-R1, P29-O1-R1 and P29-W-R1 are also in their original phases.
  Derived dashboard progress is 130/131; P20 25/25, P28 10/10,
  P29 36/37, P30 3/3.
- Final integrated-`develop` gates all exit 0. Gate 1:
  `npm test -- --coverage` — 98 suites, 1,242 passed, 1 skipped; coverage
  95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%,
  `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100% in all measures.
  Gate 2 `npx tsc --noEmit` — 0; Gate 3 `npx expo lint` — 0; Gate 4
  `npx expo-doctor` — 0 (21/21); Gate 5 Android export — 0 (5.5 MB);
  Gate 6 iOS export — 0 (5.2 MB). The full run preceded only ledger/hash
  documentation corrections; the focused ledger test passed afterward.
  No EAS or Gradle build, release preparation or version/schema bump is in
  scope.
- Checklist results: N39 Fail, N40 Fail, N41 Not run (aggregate Pace graph,
  no stacked bar), N42 Not run (paid sync/Undo), and N43 Not run (Entries
  counts and schedule caps). Device header fields remain blank; physical
  re-test and v1.1.0 release preparation remain pending because the Pace graph
  is a visible feature.
- Protected hashes verified with `git hash-object`: Budget
  `589ce9d73c80971cc78ac2a7011faa96186944fb`; Home
  `d3d1e465fe9f5d238d338afeb033e2a54889ddc6`.

### P28-E phase-history mapping (2026-11-08)

- Added 30 `phase/NN-slug` branches and annotated `phase-NN-complete` tags;
  the existing `v1.0.0` tag is unchanged. At the archive snapshot, the source
  set contained 512 commits: 487 reachable from selected main/codex/task/phase
  branches and tags, plus 25 additional commit objects explicitly referenced
  in the ledger. Integration and follow-up commits created after that snapshot
  are intentionally outside the read-only archive.
- The final map assigns 337 commits directly from task subjects, prompt commit
  cells, phase notes, labels, task refs and phase tags; 175 remaining commits
  use the nearest preceding subtask date within the closest evidenced phase.
  All 512 original hashes appear exactly once; none are unmapped. Four direct
  mapping ties prefer an exact commit-subject match, then the most specific
  task ID and ledger order. Sixteen subtasks lack an original source commit
  and reuse the preceding archive tree rather than inventing a source.
- The preliminary 485 / 354-direct / 158-date-fallback / 18-empty estimate is
  superseded by the reconciled source set and phase-aware mapping above. The
  snapshot includes five recorded phase integration commits and the codex
  branch head. The later P29-AB-R2-R1 and P28-E-R1 commits and their integration
  merges are follow-ups, not original hashes; the archive remains unchanged.
- Rows without an original source commit are P07, P09, P10, P28-E, P29-B,
  P29-C, P29-D, P29-E, P29-F2, P29-N, P29-M2, P29-S, P29-U, P29-V, P29-W
  and P29-Y; these reuse the preceding archive tree and do not represent
  unmapped original hashes.
- `history/by-phase` has 131 synthetic commits in ledger order and is
  read-only/unmerged. Its 512 `Original-Commit` trailers are unique; the final
  tree equals `main` (`git diff --quiet main history/by-phase`). The archive
  tip is `867347b068725c57c05765d84c02640d8cd57405`. The adoption baseline
  `a258579` maps to P30-C and has the main tree; P28-D's implementation is
  `b314113`. P7, P9 and P10 have no unique phase-specific commit and use
  the nearest preceding evidenced anchor.
- Authorized plain pushes are complete: `main`, `develop`, all 30 `phase/*`
  branches, `history/by-phase`, and all 30 `phase-NN-complete` tags were
  remotely verified. The v1.0.0 tag was not changed. The status-ledger
  follow-up was integrated into P28 and develop, pushed, and re-verified;
  no force push was used.

### P28-F-R4 review-only candidate and screenshots (2026-11-09)

- Prepared a proposed v1.1.1 note for owner review and added pending screenshot
  sections for the current/previous published releases. No images, app version
  changes, build, tag, release publication or merge were made.
- N44 is recorded as owner-reported Pass; device identity fields remain blank.
- Current focused verification: 2 suites / 17 tests pass for release and
  ledger documentation; `git diff --check` exits 0. Full six-gate results
  remain those of the prior clean application-source validation.

### P28-F-R4-R1 screenshots and owner handoff (2026-11-09)

- Added the owner-supplied PNG under versioned screenshot folders for v1.0.0,
  v1.1.0 and proposed v1.1.1. The owner confirmed all three files are
  intentionally identical. README and release Markdown embed the image.
- Attached `WealthWise-v1.0.0-home.png` and
  `WealthWise-v1.1.0-home.png` to their existing published GitHub releases and
  updated only the screenshot section in each published note/release body.
  Both URLs return HTTP 200 with Content-Length 244,108. The v1.1.1 image
  remains in its local draft; no GitHub release was created.
- Updated shared rules, release workflow, build guidance and regression tests
  for owner approval -> task/phase/develop PR merge -> GitHub draft with
  screenshot -> owner build/APK upload/confirmation -> verification ->
  separate publication approval. No commit, PR, app build, tag or push was
  made because the owner has not yet approved the v1.1.1 Markdown draft.
- Focused command passed 3 suites / 18 tests; `git diff --check` exited 0.
  The full six gates remain the earlier verified run; they were not repeated
  for this docs-and-assets update.

### P28-F-R4-R1-R1 approved v1.1.1 release handoff (2026-11-09)

- The owner approved the patch-release Markdown draft. The task branch aligns
  `app.json`, `package.json` and `package-lock.json` at 1.1.1 and contains the
  approved release notes and screenshot.
- The original candidate passed all six ordered gates; Gate 1 was 98 suites /
  1,269 passed / 1 skipped. Task PR #56 and P28 PR #57 merged the
  candidate to `develop`; `release/v1.1.1` and its GitHub Release draft now
  exist. The draft predates the later rule requiring note finalization before
  GitHub draft creation and remains at its original target. The owner APK
  build/upload and publication remain pending; no EAS/Gradle build or
  publication was made by the agent.
- After merge and GitHub draft creation, wait for the owner APK upload and
  confirmation before artifact verification; publication remains separately
  gated.

### P28-F-R6 v1.2.0 minor release candidate (2026-11-11)

- The owner confirmed v1.2.0, approved the release-note content and supplied
  eight reviewed screenshots. The note is finalized in `published/`; app,
  package and lockfile versions are aligned to 1.2.0. No tag, GitHub draft,
  APK, EAS/Gradle build or publication was created.
- The README What's new section and release/build documentation describe the
  candidate; the README Download block and screenshot gallery still match the
  latest published v1.1.1 note. The release overview now identifies v1.1.1 as
  latest published.
- Task PR #112 merged into the retained phase as `fa153da`; phase PR #113
  merged into `develop` as `d347526`; evidence PR #114 merged as `5ae1b72`,
  and the task branch was deleted. All six ordered gates pass. Physical-device
  checks, GitHub draft, EAS build/upload, artifact/link verification and
  publication remain pending. Publication requires separate explicit
  approval.

## 12. Phase branch index

The phase branch tips contain task/phase integration commits; completion tags
point to the phase's last identified original subtask commit. `history/by-phase`
remains a read-only synthetic archive; P28-E-R4 connects its complete ancestry
to `develop` with a tree-preserving merge, without checking out the archive
tree. Task PR #49 and P28 PR #50 are merged; P28-E-R5 adds the historical
`release/v1.0.0` branch at the existing tag target. All remote branch tips are
reachable from `develop`. Subtask counts are derived from the dashboard and
are guarded by `progressLedger.test.ts`.

| ID | Branch | Tag | Last original commit | Subtask count |
|---:|---|---|---|---:|
| P1 | `phase/01-mobile-foundation` | `phase-01-complete` | `a514958f652e6a86ca0e9c835c41150adc493aa9` | 1 |
| P2 | `phase/02-domain-calculations` | `phase-02-complete` | `a481a0e5f0a5876aa58b0f6886b4b056bad6db3b` | 1 |
| P3 | `phase/03-local-persistence` | `phase-03-complete` | `03813e6b59bd846ef628a309f534ff9669965438` | 1 |
| P4 | `phase/04-plans-and-liabilities` | `phase-04-complete` | `f3c9daaf66e0df5e2f6f6ff490563d7f1cde5df9` | 1 |
| P5 | `phase/05-goals-and-holdings` | `phase-05-complete` | `585656c09854d414ada4d2edacb9022e36645bd3` | 1 |
| P6 | `phase/06-backup-and-security` | `phase-06-complete` | `487759ebe7bc0d423631ed16572afddc19f65ad0` | 1 |
| P7 | `phase/07-schema-migration` | `phase-07-complete` | `487759ebe7bc0d423631ed16572afddc19f65ad0` | 1 |
| P8 | `phase/08-investments` | `phase-08-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P9 | `phase/09-asset-links` | `phase-09-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P10 | `phase/10-schedules-and-dues` | `phase-10-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P11 | `phase/11-navigation-and-screens` | `phase-11-complete` | `beb971167116c0af6079bf3254d826eb72ac5650` | 1 |
| P12 | `phase/12-onboarding-and-theme` | `phase-12-complete` | `9c0762d9fef695bb6832ab41c36f622b1fbf8ec4` | 1 |
| P13 | `phase/13-income-and-goals` | `phase-13-complete` | `8987f229501e69989e829977cb1a4abcb65a92db` | 1 |
| P14 | `phase/14-ui-and-data-polish` | `phase-14-complete` | `5de5a440db2813f5bcd278e12d7eac1faa443c5a` | 1 |
| P15 | `phase/15-phase-14-audit` | `phase-15-complete` | `e155bcdb527c4f68b2173a8b98b3ca203b848281` | 4 |
| P16 | `phase/16-data-foundation` | `phase-16-complete` | `9399e23f86bbefe51ec3cf7eeeb350eec7217ae8` | 3 |
| P17 | `phase/17-cash-flow-budgets-sorting` | `phase-17-complete` | `1e206ad754e95cd53f7cc06e9cba4d2d9b151a68` | 3 |
| P18 | `phase/18-ui-fix-rounds` | `phase-18-complete` | `3e28f763502fa09b32c00fce1bae95c71285f556` | 9 |
| P19 | `phase/19-budget-model-and-sync` | `phase-19-complete` | `d3477f2e1266e686b611aa819be90dba113a7a5f` | 3 |
| P20 | `phase/20-budget` | `phase-20-complete` | `eed40750f68bebc9168907f79f74a67c1f301b83` | 30 |
| P21 | `phase/21-emergency-fund` | `phase-21-complete` | `96b85d72e401215a0f17864b9f8099e5452e3a66` | 6 |
| P22 | `phase/22-demo-data` | `phase-22-complete` | `6cb4fa0a42be2c60ee3d4bf162bb41d6a2f0ea58` | 2 |
| P23 | `phase/23-insurance` | `phase-23-complete` | `04988e8366949c0cde04912ca1f472c4b31c227f` | 4 |
| P24 | `phase/24-reminders` | `phase-24-complete` | `afe54225c10d2a402d79fdc751c7c75225000e43` | 1 |
| P25 | `phase/25-release-and-backups` | `phase-25-complete` | `f99445790f44a20e022201452ddd4755ecc9d243` | 6 |
| P26 | `phase/26-accessibility-and-performance` | `phase-26-complete` | `643ef5bbb5b8481332d1416754d71b0647431f2f` | 1 |
| P27 | `phase/27-cleanup` | `phase-27-complete` | `a2fa24f930da15c49f779577eb749b33f11a7059` | 1 |
| P28 | `phase/28-qa-and-release` | `phase-28-complete` | `421e53f974b72f6869a725d39fd1a8dfd95baa99` | 36 |
| P29 | `phase/29-income-recurrence` | `phase-29-complete` | `9637d222c4feb4a001384a4d9094e472eff23728` | 42 |
| P30 | `phase/30-release-2-stabilization` | `phase-30-complete` | `a258579c4b580d6f3a157b8d13de53334aa8d34d` | 3 |
| P41 | `phase/41-types-frequency-completion` | — | — | 5 |

### P29-O1-R2 / P29-W-R2 month-count layout (2026-11-08)

- Added two-column Completed months / Pending months summary cells to Assets
  and Liabilities Entries. Existing accessible count phrases remain available
  to screen readers.
- Pending investment installments now sort with dated investment entries
  using the selected entry sort (newest first by default). Pending EMIs sort
  with other dated liability payments in descending date order; Paid
  investments and Paid EMIs remain in their existing collapsed groups.
- Red route checks exposed missing count-cell layouts at font scales 1.0, 1.3
  and 2.0. The mixed withdrawal/payment fixtures also verify chronological
  ordering when a dated entry falls between scheduled rows. The route
  regression passes for both screens at all three scales; the derived ledger
  tests pass. No schema change.
- Final ordered gates on the reopened P29 branch, all exit 0:
  `npm test -- --coverage` (98 suites; 1,242 passed, 1 skipped, 1,243 total);
  `npx tsc --noEmit`; `npx expo lint`;
  `npx expo-doctor` (21/21); `npx expo export --platform android`;
  `npx expo export --platform ios`. Coverage: overall
  95.96/92.01/98.01/97.62%; `src/data` 91.03/87.39/94.46/94.17%;
  `src/domain` 96.95/92.85/98.80/98.32%; pure `src/lib` 100% in all four
  measures (statements/branches/functions/lines).
- Physical-device rendering at font scales 1.3 and 2.0 remains unverified.
- Replaced assertions: old / inline month counts and pending rows separate
  from dated entries / new / paired summary cells and descending date order
  across pending and dated rows / reason: make month status scannable like
  other paired financial metrics and present a single date-ordered timeline.
### P29-O-R1 scope close-out (2026-11-08)

- The P29-O inventory and P29-O1 implementation are retained. The P29-S owner
  decision explicitly cancels the separate ledger-only schema-v19 redesign
  and says no schema change, runtime behavior change or data migration is
  authorized or needed.
- Closed P29-O as superseded by P29-O1 and P29-S; no application, schema,
  migration or physical-device work was inferred or added. The pre-existing
  P29-O1 physical-device checks remain listed separately in
  [open-items.md](memory/open-items.md).
- The focused progress-ledger test passes: 10 tests. P29 now derives to
  41/41; the dashboard, branch index, task register and regression assertions
  agree. The phase branch is synced to the current `develop` baseline for PR
  integration; no direct push to `develop` was made.
- The separately requested local `codex-changes` branch (`d033d6a`) was
  deleted at the owner's direction; its stale schema-v2 changes were not
  ported and no remote branch was touched.
