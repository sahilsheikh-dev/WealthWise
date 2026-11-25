> AI working memory index: [memory/README.md](memory/README.md) | Archived completed-phase narrative: [memory/archive/README.md](memory/archive/README.md). This file remains the canonical current progress and decision ledger.

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
13. [Independent entities](#13-independent-entities)

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
Overall progress █████████░ 87% (185/212)
P1          ██████████ 100% (1/1)
P2          ██████████ 100% (1/1)
P3          ██████████ 100% (1/1)
P4          ██████████ 100% (1/1)
P5          ██████████ 100% (1/1)
P6          ██████████ 100% (1/1)
P7          ░░░░░░░░░░ 0% (0/4)
P8          ██████████ 100% (1/1)
P9          ██████████ 100% (1/1)
P10         ██████████ 100% (1/1)
P11         ██████████ 100% (1/1)
P12         ██████████ 100% (1/1)
P13         ██████████ 100% (1/1)
P14         ██████████ 100% (1/1)
P15         ██████████ 100% (4/4)
P16         ██████████ 100% (3/3)
P17         ██████████ 100% (4/4)
P18         ██████████ 100% (9/9)
P19         ██████████ 100% (3/3)
P20         ██████████ 100% (51/51)
P21         ██████████ 100% (8/8)
P22         ██████████ 100% (2/2)
P23         ██████████ 100% (4/4)
P24         ██████████ 100% (1/1)
P25         ██████████ 100% (6/6)
P26         ██████████ 100% (1/1)
P29         ██████████ 100% (43/43)
P30         ██████████ 100% (3/3)
P31         ██████████ 100% (4/4)
P33         ░░░░░░░░░░ 0% (0/3)
P34         ░░░░░░░░░░ 0% (0/3)
P35         ░░░░░░░░░░ 0% (0/3)
P36         ░░░░░░░░░░ 0% (0/4)
P37         ░░░░░░░░░░ 0% (0/3)
P38         ░░░░░░░░░░ 0% (0/3)
P39         ██████████ 100% (10/10)
P40         ██████████ 100% (2/2)
P41         ██████████ 100% (5/5)
P42         ██████████ 100% (2/2)
P43         ██████████ 100% (7/7)
P44         ░░░░░░░░░░ 0% (0/4)
```

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| P1 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; original HTML prototype/Expo UI history not recoverable from current Git history. | 2026-10-15 |
| P2 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; no phase-tagged commit or original coverage report available. | 2026-10-15 |
| P3 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current store exists, original schema-v1 commit not identified. | 2026-10-15 |
| P4 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current implementation exists, original phase evidence unavailable. | 2026-10-15 |
| P5 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; exact original phase commit/test mapping unavailable. | 2026-10-15 |
| P6 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current plain backup/security features do not prove all original acceptance criteria. | 2026-10-15 |
| P7-A | — | Planned | Research Google Drive REST API (v3) appDataFolder scope, Expo SDK 57 Google OAuth2/Sign-In integration, and background scheduling (expo-background-fetch / Android WorkManager) with Wi-Fi gating. Placement: rule 4; searched dashboard, register, memory; related P6 backup; reason: automated cloud backup extends P6 Backup & Security under Rule R7 empty slot. Dependencies: none. Evidence: not started. | 2026-11-22 |
| P7-B | — | Planned | Pure domain model for cloud backup scheduling (frequency: daily / weekly / monthly / manual, retention policy, zero-knowledge local passphrase encryption before upload). Placement: rule 4; searched dashboard, register, memory; related P7-A; reason: pure domain scheduling and encryption logic. Dependencies: P7-A. Evidence: not started. | 2026-11-22 |
| P7-C | — | Planned | UI & settings in Backup / Security screen (Connect/Disconnect Google Drive, last backup status/timestamp, frequency picker, Wi-Fi only toggle, "Back up now", and "Restore from Google Drive" flow). Placement: rule 4; searched dashboard, register, memory; related P7-B; reason: user interface and interaction for cloud backup. Dependencies: P7-B. Evidence: not started. | 2026-11-22 |
| P7-D | — | Planned | Deterministic demo data, offline fallback, token revocation handling, unit tests, and device checklist rows. Placement: rule 4; searched dashboard, register, memory; related P7-C; reason: demo fixtures, offline resilience and device verification for cloud backup. Dependencies: P7-C. Evidence: not started. | 2026-11-22 |
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
| P17-C | P15-J | Done; Revised by P17-C-R1 | `1e206ad`; sort comparator, persistence, screen and route tests. | 2026-10-15 |
| P17-C-R1 | — | Done | CR-146: Persistent sorting preferences across screens and sections (Transactions, Assets, Liabilities, Budget, Goals, Investment Entries, Link Missing). In-memory cache and serialized write queue in metaStore resolve concurrent sort updates and eliminate mount delays; real-time subscription propagates changes; regression tests in useSort.test.tsx pass. Gates 1, 2, 3, 5, 6 exit 0; Gate 4 exit 1 (expo-sqlite ~57.0.6 advisory). Physical-device check O80 added (Not run). Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and sorting files; related P17-C; reason: revise completed sorting persistence in Phase P17. Dependencies: P17-C. Evidence: src/data/metaStore.ts, src/data/useSort.ts, src/data/__tests__/useSort.test.tsx. | 2026-11-23 |
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
| P20-A-R2 | — | Done; Revised by P20-A-R2-R1 and P20-A-R3 | Linked one-time manual savings now create one Deposit entry and linked invest transaction through clearDue; one-write Undo, frozen snapshot link resolution, category duplicate suppression and exact/lower/higher payments are covered. | 2026-11-09 |
| P20-A-R3 | — | Done; Revised by P20-A-R3-R1 | Correction (2026-11-22): the earlier status text said Gate 4 blocked integration and PRs were pending; PR #178 and #179 are present in local Git refs. Owner-run Gate 4 is 20/21 (exit 1), six known Expo SDK 57 patch mismatches.  Reproduced two plan/snapshot link-placement failures with real-store regressions and fixed them in shared pending and Budget actual selectors. Link fallback now preserves linked holding Paid across current/historical viewed months and matching actuals; real Transactions and `/payment-confirm` routes, reminder cold-start routing, rehydration, v20–v23 plain-backup import/migration path, demo data, following-scope/month-only history and exact/lower/higher × Cash, Savings and Other cases are covered. Each paid case checks one Deposit entry, one linked invest transaction, matching Budget actual, no new Budget row, unchanged Budget item set, one persisted write and one-step Undo; Fixed deposit excluded. Dependencies: none. Schema and protected files unchanged. Owner's exact device reproduction details remain unknown; O74 is Not run. | 2026-11-21 |
| P20-A-R3-R1 | — | Done | Record task PR #178 and phase PR #179 as merged in local Git refs; Gate 4 owner output is exit 1, 20/21, six known SDK 57 patch mismatches. `mergedAt`, PR body/comment and owner exact repro are not recorded; O74 remains Not run. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and local refs; related P20-A-R3; reason: record verified integration as its next revision. | 2026-11-22 |
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
| P20-L | — | Done; Revised by P20-L-R1 | CR-47–CR-50; due section, inline header filters, liability-kind chips and search. Full tests/coverage and all required gates pass. | 2026-10-18 |
| P20-L-R1 | — | Done | Consistent filter panels across screens with header filter icon (Goals, Assets, Liabilities, Transactions, Budget); added Goals filter controls (All, In progress, Achieved status and dynamic target year chips) alongside SortChip; removed filter icon dot indicator everywhere; verified sort and filter independence; regression tests pass; physical device check O82 added in Not run status. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched files; related P20-L, P20-Z, P20-Z-R1, P17-C-R1; reason: revision of completed subtask P20-L. | 2026-11-24 |
| P20-M | — | Done | CR-52–CR-55; categories, schema-v9 migration, future virtual budgets, income dues, projected cash flow and setup income items. 71 suites/820 tests; all six final gates pass. | 2026-10-18 |
| P20-N | — | Done; Revised by P20-N-R1 and P20-N-R3 | CR-56/CR-57 overview model, charts, screen, demo, cleanup, and all automated gates complete; device checks remain unverified. | 2026-10-18 |
| P20-N-R1 | — | Done; Revised by P20-N-R2 | Replaced the stacked planned-allocation bar and global pace line with per-section actual/plan comparisons, toggles, markers, axes and accessible summaries. | 2026-11-08 |
| P20-N-R2 | — | Done | Restored the aggregate actual-versus-planned Pace graph above the overview table; removed section-specific lines/toggles and restored aggregate chart tests. N41 device re-test remains pending. | 2026-11-08 |
| P20-N-R3 | — | Done | Removed the visible pace heading and Over by/Left summary lines while retaining the chart, table Left row and accessible summaries. Failing route/chart tests were committed before production edits; tests pass at font scales 1.0, 1.3 and 2.0. Task PR #95 merged to P20 as `77bdef5`; phase PR #96 merged to `develop` as `f5f6e16`. | 2026-11-10 |
| P20-O | — | Done | CR-58/CR-59 item edit sheet, scope-aware remove/Undo, grouped budget hints and editable demo override. 76 suites/848 tests; all six required gates pass. Device checks remain unverified. | 2026-10-18 |
| P20-P | — | Done | CR-60/CR-61 schema-v10 user-managed budget sections/items, v9 migration, scoped mutations, and custom-category transaction integration. 76 suites/865 tests; all six final gates pass. Device checks remain unverified. | 2026-10-18 |
| P20-Q | `55f9eaa` | Done | CR-62–CR-65: in-screen budget management and responsive overview; 75 suites/857 tests and all six required gates pass. Simulated layouts pass; native device checks remain. | 2026-10-19 |
| P20-R | `391a227` | Done | CR-66–CR-69: top-anchored sheets, edit-mode header trash, and responsive per-section Budget cards. 75 suites/857 tests; all six gates exit 0. Simulated layout passes; physical-device checks remain. | 2026-10-19 |
| P20-S | — | Done; Revised by P20-S-R1, P20-S-R1-R1, P20-S-R2, P20-S-R2-R1 and P20-S-R2-R2 | CR-70–CR-75: accessible dropdowns, shared sheet shell, actual-first values, custom budget item categories and manageable transaction-derived rows; Insurance manual items reconcile separately from linked policies. All six final gates pass; physical-device checks remain unverified. | 2026-10-19 |
| P20-S-R1 | — | Done; Revised by P20-S-R1-R1 | Convert all non-filter app-form ChoiceField uses to Dropdown and add persistent single-line titles to eligible editable controls. SegmentedControl titles are intentionally absent per owner direction. All six final-tree gates pass; physical-device rendering remains unverified. Implementation commit `d36103e`; task-to-phase PR #42; phase-to-develop PR #43. | 2026-11-09 |
| P20-S-R1-R1 | — | Done | Add the owner-requested rule to ask before reverting or overwriting owner edits made after agent changes. Documented in root `AGENTS.md` as R5; task-to-phase PR #44 merged, phase-to-develop PR #45. | 2026-11-09 |
| P20-T | `e432034` | Done | CR-76–CR-77: one shared FormShell header/body/footer core for full-screen and sheet forms; all data-entry forms converted with route-param coverage. Six gates pass; native keyboard/font-scale behavior remains unverified. | 2026-10-19 |
| P20-U | `02bfbb1` | Done; Revised by P20-U-R1 | CR-86–CR-87: replace BudgetManagementSheet with section, item and income FormScreen routes; scoped save/delete Undo and route coverage. Focused suites pass; final gates and device limitations recorded below. | 2026-10-21 |
| P20-U-R1 | P20-U | Done | Owner authorization on 2026-11-21 superseded CR-115’s earlier hold. CONT3 completed the real-form/store/persistence matrix across Spend, Invest and Income, recurring and one-time kinds where applicable, edit fields and both scopes; delete coverage passes for both scopes across each section/kind. The original store matrix reproduced four following-scope Income schedule snapshot defects (one-time/recurring × frequency/start-month), fixed by `2dc72b5`. Real-form edit reproduced amount loss when optional fields were cleared, fixed by `a292f33`; the legacy category-line action also dropped `holdingId` in both scopes, fixed by `e4accf5`. Name, amount/value, start month, frequency, due day and other tested cells pass. Backup restore, demo origin, non-current viewed month, and H1–H5 findings are recorded in CONT3. Tests: `936ff8f`, `3866bf3`, `10a8f6f`, `8ceecb5`, `4f02446`, `88693ab`, `51a907c`, `7074b25`, `c3d0cc7`, `421d080`, `a5ea806`; harness typing `cc0b3c6`; fixes: `2dc72b5`, `a292f33`, `e4accf5`. Six-gate results below. Schema v23; no migration, dependency or protected-file change. O73 physical-device check remains Not run. Placement: initial work rule 2; continuations rule 3; searched dashboard, register, phase history, roadmap, memory and touched Budget forms/domain/store; related P20-U-R1; reason: complete the widened owner-report scope in place. | 2026-11-21 |
| P20-U-R1-R1 | P20-U | Done | Record task PR #180 and phase PR #181 as merged in local Git refs. PR #181 body correction/comment remain owner-reported but not verifiable from supplied files; O73 remains Not run. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and local refs; related P20-U-R1 and CM-2; reason: record verified integration as its next revision. | 2026-11-22 |
| P20-V | `6d3feab`, `82793e8`, `1afac16`, `139230d` | Done | CR-88/CR-89: schema v13 and migration, recurrence-aware Budget planning/dues, route form, row display, demo and tests. All six automated gates pass; native-device checks remain unverified. | 2026-10-21 |
| P20-W | — | Done; Revised by P20-W-R1 and P20-W-R2 | Correction (2026-11-22): the earlier text said PR integration was pending; D3 and phase PRs #182/#183 are merged; PR #182 merged into `phase/20-budget` at `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`, and PR #183 merged into `develop` at `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db`. Previously: P43-D. D1/D2 schema-free scope: both implemented. D1: no investment category before holding selection; selected holding derives via `investCategoryFor`; missing holding blocks Save. D2: the picker groups Budget-defined/effective-month expense categories plus a Custom entry, shows the derived Budget section, and retains removed-item transaction categories. Custom names save as transaction category strings only; no new persisted field. D3 is authorized: widen earned-income category to a trimmed nonempty string up to 60 characters; preserve v23 strings in an identity v23→v24 migration; retain backup format v1 and v1–v23 import compatibility; add v23 pre-migration archive recognition/erase cleanup; offer custom earned-income entry in Budget income and Transaction forms. Owner decision DEC-P20W-D3-SCHEMA24 assigns schema v24 to P20-W and replans P36-A/B to v25; implementation `f2541fd` adds custom earned-income categories, v23→v24 identity migration and `.premigration.v23` handling. Focused suites pass (8 suites / 524 tests). Gate 1 passes (102 suites, 1,381 passed, 1 skipped); Gates 2–3 and 5–6 exit 0; Gate 4 exits 1 (`ENOTFOUND registry.npmjs.org`). Task/phase PR integration is complete through #182/#183; the prior six-gate evidence includes local Gate 4 exit 1 (`ENOTFOUND registry.npmjs.org`) and owner-supplied Gate 4 exit 1 (20/21 checks, six SDK 57 patch mismatches; owner-approved cleanup exception); prior PR #174/#175 evidence remains recorded. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, P20-W/P20-O/P20-P records and income/transaction form modules; related P20-W D1/D2 and P36-A/B; reason this widens the existing open Budget/category behavior after the owner resolved schema ownership. | 2026-11-21 |
| P20-W-R1 | — | Done | Record P20-W task PR #174 merge `419a37b07e6853b3c683d22ec243ea58223514c1` and phase PR #175 merge `9e47856f20848e03ac6a4b8e699f47c387d08161`; local `develop` was synchronized by CM-2. No application behavior changed; D3 remains Planned and O69–O72 remain Not run. Test-first commit `6f31775`. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and P20-W records; related P20-W and CM-2; reason: record verified task/phase integration as the next P20-W revision required by the integration workflow. | 2026-11-21 |
| P20-W-R2 | P20-W | Done | Record D3 task PR #182 and phase PR #183 merge commits; schema v24 and `.premigration.v23` handling are present. Correction (2026-11-22): snapshot confirms #181's corrected PR body and comment #7067953238; D3 was integrated separately. Gate 4 task/develop captures exit 1 (20/21; six SDK 57 mismatches). O69–O72 remain Not run. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and owner snapshot; related P20-W and CM-2; reason: record completed integration and reconcile its remote evidence. | 2026-11-22 |
| P20-X | — | Done; Revised by P20-X-R1 | Implement sorting for Budget categories and items throughout WealthWise using the existing sorting behavior in Transactions, Assets, and Liabilities as reference. Adds SortChip in AppHeader filter toggle panel on BudgetScreen using useSort('budgetSpending') with options Planned, Actual, Percent used, and Name; preserves Income at top while sorting items; sorts spending/investing sections and items within sections; adds sorting support to shared Dropdown with SortChip rendered in sheet; connects category dropdowns in TransactionForm and BudgetIncomeForm with persistent budgetSpending sort spec; extends budgetCategoryChoiceSections with pure sortSpec handling. Regression tests BudgetSorting.test.tsx, Dropdown.test.tsx, RouteRenderSmoke.test.tsx, budgetCategories.test.ts. All six gates pass. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and Budget/sorting code; related P20 and P17-C; reason: Budget category and item sorting extends the existing P20 Monthly Budget feature area. Physical-device check O75 marked Pass (owner-reported 2026-11-22). | 2026-11-22 |
| P20-X-R1 | — | Done | Remove sorting option from TransactionForm category dropdowns (Expense, Income, Invest) and remove static Search header title from shared Dropdown sheet, keeping search placeholder in the input. Placement: rule 2; searched dashboard, register, phase history, memory, transaction-form.tsx, Dropdown.tsx; related P20-X and P20-S-R2; reason: user-requested removal of sorting in add transaction and removal of redundant Search title in dropdowns. | 2026-11-22 |
| P20-Y | — | Done; Revised by P20-Y-R1 | Implement payment date when marking scheduled/budgeted items Paid in Transactions and Budget (defaulting to today, customizable); allow one asset to link to multiple one-time investment budgets with note-based attribution in budgetLineActual; limit Transaction expense categories to user-created or applicable scheduled items plus Custom, retaining historical removed categories when editing. Regression tests in PaidAmountDialog.test.tsx, PendingItemActions.paymentDate.test.tsx, budgetMultiAssetLink.test.ts, budgetCategoriesLimited.test.ts, TransactionForm.test.tsx. All six gates pass with exit 0. Physical-device check O76 marked Pass (owner-reported 2026-11-22). Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and Budget/dues/transaction code; related P20, P20-A-R3, and P20-W; reason: Payment date on clearing dues, multi-budget asset linking, and user-scoped transaction expense categories extend the P20 Budget and Transaction category feature area. | 2026-11-22 |
| P20-Y-R1 | — | Done; Revised by P20-Y-R2 | Fix WealthWise bug where renaming a budget item or category in one month did not update the name shown by transactions linked to that item. Linked transactions now reflect the current budget item name wherever it appears, including existing transactions, while preserving amount, date, category, and budget link. Handles month-specific items and create, edit, display, persistence, migration, and backup-import paths. Added regression tests in budgetItemRenameTransactions.test.ts. All six gates pass with exit 0. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/dues/transaction code; related P20-Y; reason: renaming a budget item or category in one month updates transactions linked to that item while preserving amount, date, category, and budget link. | 2026-11-22 |
| P20-Y-R2 | — | Done; Revised by P20-Y-R3 | Fix WealthWise bug where renaming an expense or standard budget item did not reflect in transaction category item, leaving transactions showing the old name. In P20-Y-R1, transaction updates were gated behind targetHoldingId. P20-Y-R2 updates tx.category and tx.note for matching transactions across month/following scopes for all budget items in editItem, renameSection, and editBudgetIncome. Adds reconcileBudgetItemTransactions in budgetCategories.ts and invokes it on store rehydration and backup import to heal desynced transactions. Updates TransactionsScreen categoryLabel to reflect linkedBudgetItem.name. Regression tests in budgetItemRenameTransactions.test.ts and TransactionsScreen.test.tsx. All six gates pass with exit 0. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R1; reason: budget item rename updates transaction category and display for all budget items across month and following scopes. | 2026-11-22 |
| P20-Y-R3 | — | Done; Revised by P20-Y-R4 | Refine budget item and section rename to sync transaction category only while preserving transaction note. Previously in P20-Y-R2, if a transaction note matched the old item or section name, the note was also updated. P20-Y-R3 ensures that editItem, renameSection, editBudgetIncome, and reconcileBudgetItemTransactions strictly update transaction.category to the new name and leave transaction.note untouched. Regression tests in budgetItemRenameTransactions.test.ts. All six gates pass with exit 0. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R2; reason: budget item and section rename syncs transaction category only, preserving transaction note. | 2026-11-22 |
| P20-Y-R4 | — | Done; Revised by P20-Y-R5 | Strictly preserve transaction note across all budget item, section, and income renames including holding-linked investments, syncing category only. In P20-Y-R3, non-holding budget item renames preserved notes, but holding-linked items in editItem still updated transaction notes via matchedTxIds. P20-Y-R4 completely removes matchedTxIds transaction note modification, adds a fallback in budgetItemForTransaction to resolve sibling holding items by historical item IDs, and verifies that transaction notes are strictly preserved across expense, section, holding-linked, and income renames even when note equals old item/section name. All six gates pass with exit 0. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R3; reason: ensure transaction note is never updated on budget item/section rename across domain and display layers. | 2026-11-23 |
| P20-Y-R5 | — | Done | Strictly preserve transaction name/note as previously set when budget item or category is renamed, updating transaction budget category item only. Previously in P20-Y-R1–R4, TransactionsScreen itemTitle dynamically fell back to linkedBudgetItem.name for empty-note transactions, causing the transaction title to change when its category was renamed, and if a transaction had empty note its original name was lost. P20-Y-R5 removes linkedBudgetItem.name fallback from TransactionsScreen itemTitle, sets note to oldName when category is renamed for empty-note transactions in editItem, renameSection, editBudgetIncome, and reconcileBudgetItemTransactions, and ensures that transaction name/note strictly preserves its previously set value while transaction category updates to the new budget item name. All six gates pass with exit 0. Physical-device check O77 marked Pass (owner-reported 2026-11-23). Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R4; reason: preserve transaction name/note as previously set when budget item is renamed, updating transaction budget category item only. | 2026-11-23 |
| P20-S-R2 | — | Done; Revised by P20-S-R2-R1 and P20-S-R2-R2 | Searchable shared Dropdown with Unicode-normalized, case/diacritic-insensitive AND matching; exact/prefix/word-start/contains ranking; grouping; selected-state behavior; Custom pinning; no-match feedback; query reset; accessibility announcements. No call-site edits, schema/domain/demo-data changes or new dependencies. All six gates completed; Gate 4 exited 1 on the known SDK 57 patch mismatch after the required DNS retry. Task PR #164 and phase PR #165 are merged; O61–O64 remain open. | 2026-11-21 |
| P20-S-R2-R1 | — | Done | Record verified task and phase PR integration for searchable Dropdowns. Task PR #164 merged into `phase/20-budget` at `185a5ea125f64ac104344f00ad013d68cdb7a946`; phase PR #165 merged into `develop` at `6b50a1dbd36b401352776e71028fc07071c11991`. Focused ledger and memory tests pass. O61–O64 remain Not run on physical devices. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched records; related P20-S-R2 and CM-2; reason: record integration evidence as the next sequential revision in the original phase. | 2026-11-21 |
| P20-S-R2-R2 | — | Done | Correct the P20-S revision chain to retain the P20-S-R2 revision entry alongside its integration-evidence revision. No application behavior changed; device checks remain Not run. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched records; related P20-S-R2 and P20-S-R2-R1; reason: preserve the full sequential revision history after ledger close-out. | 2026-11-21 |
| P20-Z | — | Done; Revised by P20-Z-R1 | Dynamic category filter alongside existing Budget sorting option defaulting to "All", listing available categories (Income, Expenses, Needs, Wants, Debt, Assets, Liabilities) and auto-including newly created categories following Transactions behavior. In app/(tabs)/budget.tsx, added categoryOptions computing base categories (All, Income, Expenses, Needs, Wants, Debt, Assets, Liabilities) plus custom/additional sections, category filter chips inside ChipRow in budget-filter-panel alongside SortChip, categoryOverride state with routeCategory fallback, and matchesCategory helper filtering sortedSections into displayedSections with EmptyState fallback when no sections match. Verified with regression tests in src/components/__tests__/BudgetCategoryFilter.test.tsx. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O78 added in Not run status. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and budget.tsx; related P20, P20-X, P17-C; reason: dynamic category filtering extends existing Phase P20 Budget feature area. | 2026-11-23 |
| P20-Z-R1 | — | Done | Refine Budget filter icon indicator to remove dot indicator on default view, making filter icon appearance match Assets, Liabilities, and Transactions, and preserve owner margin changes in filterPanel. In app/(tabs)/budget.tsx, updated filterActive to selectedCategory !== 'All', removing sort spec comparison so sorting does not activate filter indicator dot, ensuring filter icon renders clean without dot when category filter is 'All' (default), and activating indicator only when a specific category is filtered. Kept owner edit removing marginHorizontal from styles.filterPanel. Verified with regression tests in src/components/__tests__/BudgetCategoryFilter.test.tsx. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O79 added in Not run status. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and budget.tsx; related P20-Z; reason: revise Budget category filter active indicator logic and preserve owner margin changes. | 2026-11-23 |
| P21-A | — | Done | Schema-v7 linked emergency-fund model, backup/migration and integrity tests; final Expo Doctor and all other gates pass. | 2026-10-16 |
| P21-B | — | Done | Emergency-fund cover and allocation UI/tests; final Expo Doctor and all other gates pass. | 2026-10-16 |
| P21-C | `d43be28` | Done | CR-37 header-only edit action, detail-first allocation rows without status labels and progress bar last; CR-38 editable allocation items, four defaults and no-menu behavior. | 2026-10-17 |
| P21-C1 | `3405101c1d65b6dfdbc7d84176d17b3208f389ca` | Done | CR-39: resolve malformed stored emergency-fund allocations, repair/archive on hydration and block invalid form saves; schema remains v8. | 2026-10-17 |
| P21-D | — | Done | CR-51; null/default/repair targets are Cash 10, Bank account 40, FD / RD 50. Full tests/coverage and all required gates pass; schema v8 unchanged. | 2026-10-18 |
| P21-E | `c199c8e` | Done | CR-90: replace the predefined allocation-item picker and custom-option modal with a shared-shell add/edit item route form. Schema v13 remains unchanged; full gates pass. | 2026-10-21 |
| P21-F | — | Done; Revised by P21-F-R1 | Previously: P43-C. Emergency Fund target editing and reflection on Emergency Fund, Home, Goals, allocation/bucket targets and the three-month minimum floor; one combined header action and form edits the target and allocation together. Saving uses one domain plan action, one Zustand set, one persisted write and one-step Undo; typed validation, font-scale tests at 1.0/1.3/2.0 and DEC-DEMO data. DEC-P21F-FLOOR: effective target = max(stored target, three-month floor); reject below-floor input with the existing typed validation error and show the floor as helper text, preserving current goal behavior and avoiding a schema change. Owner explicitly authorized editing `app/(tabs)/index.tsx` if required (CR-113); no Home edit was needed. Combined-editor tests pass. Synced task gates: Gate 1 exit 0 (102 suites, 1,365 passed, 1 skipped); Gates 2–3 exit 0; local Gate 4 attempt exit 1 (`ENOTFOUND registry.npmjs.org`); owner-supplied Gate 4 exit 1 (20/21; six SDK 57 patch mismatches); Gates 5–6 exit 0. Task PR #170 and phase PR #171 are merged; P21-F-R1 records the exact merge evidence. Physical-device checks O65–O68 remain Not run. Placement: rule 4; searched dashboard, register, P21-A–E evidence, phase history, roadmap, memory and Emergency Fund modules; related P21-A–E; reason Emergency Fund target editing extends the existing P21 feature area. | 2026-11-21 |
| P21-F-R1 | — | Done | Record P21-F task PR #170 merge `c877f6d19e35c0b9fbcba90e9722da7531948c8e` and phase PR #171 merge `2e5e18a7a2be207387a7462b039547f51b0e4631`; local `develop` was synchronized by CM-2. No application behavior changed. Focused ledger and memory tests pass; O65–O68 remain Not run on physical devices. Test-first commit `647a0c9`. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched P21-F records; related P21-F and CM-2; reason: record verified PR integration as the next sequential revision of completed P21-F. | 2026-11-21 |
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
| CR-108 | — | Done (owner-reported device checks Pass) | All six owner-authorized parts and the Gate 1 correction are integrated into `develop`; all six ordered gates pass. The owner reports all physical-device checks O45-O60 passed on 2026-11-11; device details were not supplied. No v1.1.1, release branch, tag or artifact was changed. | 2026-11-11 |
| CR-112 | P43 | Done | Add work-placement rules and guide, execute lifecycle tracking separation, move only unambiguous Planned rows, and activate CM-2. P43-A and P43-F are complete; P43-B/E and product work remain Planned. Task PR #153 and phase PR #154 are merged; six gates passed. | 2026-11-12 |
| P26-A | P15-M | Done (device checks outstanding) | Accessibility/performance fixes, 91-suite verification and all six ordered gates passed; native font-scale, touch and accessibility checks remain open. | 2026-11-06 |
| P27 | — | Empty (reserved) | Formerly cleanup; tracking moved to independent entity cleanup per CR-114. Reserved empty slot eligible for adjacent accessibility & performance (P26) work per R7. | 2026-11-12 |
| P28 | — | Empty (reserved) | Formerly QA and release; tracking moved to independent entity qa-and-release and documentation per CR-114. Reserved empty slot eligible for adjacent income recurrence / Budget income (P29) work per R7. | 2026-11-12 |
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
| P29-U | — | Done; Revised by P29-U-R1 | Additive schema-v19 valuation methods, value/price confirmation, shared configured values and default-off monthly update reminders. Unconfigured holdings preserve legacy amounts; focused tests and all six ordered gates pass. | 2026-11-05 |
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
| P29-U-R1 | — | Done | Dynamic asset valuation inputs and calculations depending on selected valuation type (manual value input, interest-based rate calculation with compounding and maturity, unit-based 2-way auto-calculation between units, unit price, and purchase amount, balance-based current balance calculation) across recurring and one-time assets; type-specific valuation update route; unitCount support on holding valuation; regression tests pass; physical-device check O81 added (Not run). Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, valuation.ts, holding-valuation-form.tsx, investment-form.tsx; related P29-U, P8, P29-S; reason: adjusts valuation method mechanics and dynamic form inputs established by completed subtask P29-U. | 2026-11-23 |
| P30-A | — | Done | Real-store action persistence/hydration and eight screen refresh checks pass; three SQLite fallback/restart tests reproduce stale-value restoration. Source scan finds no module-level Map caches; the prior-state mutation harness passes. | 2026-11-08 |
| P30-B | — | Done | Durable legacy authority markers win over stale SQLite after failed writes, read-back mismatch and fallback; deletion tombstones prevent removed values returning. Restart regressions now pass, and a mounted banner test verifies persistence failures are visible. | 2026-11-08 |
| P30-C | — | Done | TypeScript source scan guards hook closure inputs, explicit memo dependencies and module-level Map caches; a dev-only diagnostic reports hydration source and last-write verification. | 2026-11-08 |
| P31-A | — | Done | Community guidelines (CODE_OF_CONDUCT.md) at repository root; standards for respectful collaboration, privacy protection, and enforcement procedures. Placement: rule 4; searched dashboard, register, memory, CONTRIBUTING.md; related P31; reason: project health and community guidelines. | 2026-11-24 |
| P31-B | — | Done | GitHub issue forms (.github/ISSUE_TEMPLATE/bug_report.yml, feature_request.yml, question.yml, config.yml) with explicit warnings against sharing financial data, credentials, or backups; legacy markdown templates deleted. Placement: rule 4; searched dashboard, register, memory, .github/ISSUE_TEMPLATE; related P31; reason: GitHub issue forms and configuration. | 2026-11-24 |
| P31-C | — | Done | Accessibility statement (docs/accessibility/accessibility-statement.md) and practical audit checklist (docs/accessibility/audit-checklist.md) covering WCAG 2.1 AA targets, 44x44 pt touch targets, dynamic font scaling (1.0x, 1.3x, 2.0x), and screen reader semantics. Placement: rule 4; searched dashboard, register, memory, docs/accessibility; related P31; reason: accessibility documentation and audit checklist. | 2026-11-24 |
| P31-D | — | Done | Owner-approved privacy statement (PRIVACY.md) at root derived strictly from P39-C verified facts: 100% offline-first, local-only storage (SQLite/AsyncStorage), zero network requests, zero telemetry, local notifications, local biometrics via Secure Enclave, scoped storage, AES-256-GCM encrypted backup export, allowBackup=false, and unencrypted-at-rest limitation. Placement: rule 4; searched dashboard, register, memory, P39-C audit trace; related P31, P39-C; reason: verified privacy statement. | 2026-11-24 |
| P32 | — | Empty (reserved) | Formerly screenshots (cancelled by owner); rows moved to Cancelled / unassigned bucket under Section 13 Independent entities per CR-114. Reserved empty slot eligible for adjacent project health/community (P31) or widgets (P33) work per R7. | 2026-11-12 |
| P33-A | — | Planned | Reactivated by owner approval; conduct SDK 57/platform/privacy research, including config plugin, dev-build need and hide-previews behavior. Research is authorized but not started. Dependencies: none. | 2026-11-10 |
| P33-B | — | Planned | Android widget implementation is approved in principle after P33-A research and scope confirmation. No implementation started. Dependencies: P33-A. | 2026-11-10 |
| P33-C | — | Planned | iOS widget research/reactivation is approved; implementation remains contingent on P33-A research and iOS distribution. No implementation started. Dependencies: P33-A and iOS distribution. | 2026-11-10 |
| P34-A | — | Planned | Renewed quick-capture scope and platform research approved; evaluate shake, double-tap back and key-combination options. Research is not started. Dependencies: none. | 2026-11-10 |
| P34-B | — | Planned | App shortcuts, Quick Settings and notification-action quick capture are approved for planning after P34-A research. Dependencies: P34-A. | 2026-11-10 |
| P34-C | — | Planned | Foreground shake capture is approved for planning after P34-A research; background gestures remain out of scope unless research proves a policy-safe route. Dependencies: P34-A. | 2026-11-10 |
| P35-A | — | Planned | SMS/notification transaction auto-detection permission, platform and policy research approved; research is not started. Dependencies: none. | 2026-11-10 |
| P35-B | — | Planned | Owner has given a Go for implementation after P35-A research; validate research findings and scope before implementation. No implementation started. Dependencies: P35-A. | 2026-11-10 |
| P35-C | — | Planned | Transaction auto-detection implementation is owner-approved after P35-A research and P35-B Go; implementation remains unstarted until those prerequisites are completed. Dependencies: P35-B and completed P35-A research. | 2026-11-10 |
| P36-A | — | Planned | Design Notes for text, voice/audio recordings, photos and videos; define optional financial-record links, local storage, limits, backup/migration and schema-v25 impact. Dependencies: none. Demo data and tests required per DEC-DEMO. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory and P36 planning records; related P20-W D3; reason the owner assigns v24 to P20-W and keeps Notes schema planning at v25. | 2026-11-09 |
| P36-B | — | Planned | Implement Notes schema, attachment metadata and pure domain behavior with offline-safe storage and backup compatibility. Dependencies: P36-A. Demo data and tests required per DEC-DEMO. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory and P36 planning records; related P20-W D3; reason the owner assigns v24 to P20-W and keeps Notes schema implementation at v25. | 2026-11-09 |
| P36-C | — | Planned | Implement Notes UI for writing, recording and attaching/viewing photos and videos. Dependencies: P36-B. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P36-D | — | Planned | Add deterministic Notes demo data without personal media. Dependencies: P36-C. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-A | — | Planned | Design per-feature skippable coach marks, replay from menu, meta-store flags rather than AppData, and accessibility. Dependencies: none. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-B | — | Planned | Implement the tutorial framework. Dependencies: P37-A. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P37-C | — | Planned | Implement per-feature tours. Dependencies: P37-B. Demo data and tests required per DEC-DEMO. | 2026-11-09 |
| P38-A | — | Planned | Inventory operations with genuine asynchronous loading and define when skeleton placeholders should appear, including theme, accessibility and reduced-motion behavior. Dependencies: none. | 2026-11-09 |
| P38-B | — | Planned | Implement reusable skeleton loaders and connect them only to the identified loading states; keep errors and empty states explicit. Dependencies: P38-A. | 2026-11-09 |
| P38-C | — | Planned | Test loading, success, empty and failure transitions and confirm skeletons never mask errors or flash during synchronous operations. Dependencies: P38-B. | 2026-11-09 |
| P39-A | — | Done | Master read-only audit of dead code, secrets/config, app lock, notification-response routes, deep links, silent failures, performance, dependencies, debug residue, TODO debt, permissions, and first launch. Recorded 12 findings with file/line evidence across P0-P3 severities; zero P0/P1 blockers; report in /tmp/wealthwise-p39-a-master-audit.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: master release audit and hardening. | 2026-11-24 |
| P39-B | — | Done | Verify secrets, network behavior and debug residue across tracked files, Git history patterns and EAS config; inspect the exported bundle to prove demo/stress loaders and the dev storage diagnostic are absent or unreachable; inspect console/debugger statements and source maps; add a regression test for no fetch/XHR/WebSocket/EventSource/sendBeacon in app/ or src/. Report in /tmp/wealthwise-p39-b-security-debug-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: security, network boundary, and debug residue audit. | 2026-11-24 |
| P39-C | — | Done | Report-first permissions and privacy trace from declaration to request to use for notifications, biometrics, file/share/document picker, SQLite, data-at-rest encryption boundary, allowBackup=false, and offline runtime boundary; findings summary table recorded; detailed report in /tmp/wealthwise-p39-c-permissions-privacy-trace.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, app.json, permissions code; related P39, P31-D; reason: release audit and hardening permissions trace. | 2026-11-24 |
| P39-D | — | Done | Report-first silent-failure and recovery-state audit extending P30 across storage, backup import/export, notification scheduling and SQLite fallback visibility. Identified P2 finding that SQLite write verification fallback to legacy AsyncStorage in stateStorage.native.ts passes onSQLiteFailure as undefined (logged to console but no user-facing UI degradation banner); backup import/export, AES-256-GCM corruption handling, and local notifications error resilience verified robust; detailed report in /tmp/wealthwise-p39-d-recovery-audit.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: silent failures and recovery paths audit. | 2026-11-24 |
| P39-E | — | Done; Revised by P39-E-R1 | Report-first dependency risk triage using current npm audit across 1,124 packages. Separated production-reachable dependencies from developer tooling; identified 11 advisories (0 critical, 3 high, 8 moderate); high severity decode-uri-component ReDoS in expo-router/query-string triaged as production-reachable but mitigated by 100% offline runtime (requires owner decision DEC-P39-DEPS-01 for upstream Expo SDK upgrade); tooling advisories in minimatch, tar, micromatch, braces recorded; zero force-fixes or install-script approvals permitted; report in /tmp/wealthwise-p39-e-dependency-risk-audit.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: dependency risk and CVE review. | 2026-11-24 |
| P39-E-R1 | — | Done | Upgraded WealthWise from Expo SDK 57 to Expo SDK 58 (`expo@^58.0.26`, `react-native@0.88.1`, `react@19.3.0`, `expo-router@~58.0.32`, and 31 aligned SDK 58 packages plus `@react-native/jest-preset` and `react-test-renderer@19.3.0`); verified `npm ls decode-uri-component` is empty and `npm audit` reports 0 critical/0 high advisories (27 moderate dev/CLI tooling advisories remain in `glob`/`minimatch`), resolving `DEC-P39-DEPS-01` via the supported SDK 58 upgrade path; updated `app/(tabs)/_layout.tsx` (`navigateToTab`), `ef-allocation-form.tsx`, `onboarding.tsx`, `profile-form.tsx`, `jest.config.js`, `app.json` (added `expo-font`, `expo-status-bar` plugins), and `TabsLayout.test.tsx`; added physical-device check `O85` (`Not run`); issue `#562`. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-E, DEC-P39-DEPS-01, package.json, app.json, jest.config.js, app/(tabs)/_layout.tsx; related P39-E, DEC-P39-DEPS-01, CR-164; reason: executes the planned Expo SDK 58 major upgrade and resolves DEC-P39-DEPS-01 from completed P39-E. | 2026-11-25 |
| P39-F | — | Done | Report-first debt/skipped-test audit of TODO/FIXME markers, the one skipped test and opt-in stress benchmark. Confirmed zero TODO/FIXME/HACK/XXX markers in codebase; investigated single skipped test in stressData.test.ts#L93 (stressBenchmark 50y/100y/126y benchmark) and assigned disposition as documented architectural exception (opt-in via WEALTHWISE_STRESS_BENCHMARK=1 to keep standard gate runs fast); confirmed zero weakened test assertions; report in /tmp/wealthwise-p39-f-test-debt-audit.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: test debt, TODO markers, and skipped test audit. | 2026-11-24 |
| P39-G | — | Done | Report-first clean-install walkthrough of onboarding, lock, reminders prompt, first transaction, and interrupted/denied paths. Verified root layout hydration, onboarding exit behavior, non-blocking reminder bottom sheet, transaction creation validation, app lock initialization, and denied permission paths; findings recorded to feed P37-A tutorial planning; report in /tmp/wealthwise-p39-g-clean-install-walkthrough.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H, P37; reason: clean-install and first-launch walkthrough. | 2026-11-24 |
| P39-H | — | Done; Revised by P39-H-R1 | Remediation plan grouping findings from P39-A through P39-G into minimal independent batches (Batch 1: Storage fallback visibility; Batch 2: Bundle treeshaking & route registration; Batch 3: Dependency monitoring & SDK alignment); prioritized containment before cleanup; assigned rollback strategies and owner decisions; report in /tmp/wealthwise-p39-h-remediation-plan.md. Owner approved keeping P39-A–H in P39 (CR-113). Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–G; reason: release audit remediation plan. | 2026-11-24 |
| P39-H-R1 | — | Done | Implemented P39 audit remediations: wired SQLite fallback warning via `sqliteFallback.ts` and `StorageErrorBanner.tsx` without implying data loss; registered 5 modal form routes in `app/_layout.tsx`; added `routeParams.ts` (`singleParam`, `closeRouteSafely`) across form/reminder/due routes for safe cold deep-link fallback; guarded `stressData.ts` behind `__DEV__` lazy `require` in `createAppStore.ts` while preserving Demo Mode (`demoData.ts`); aligned 8 Expo SDK 57 patch packages (`expo`, `expo-router`, `expo-sqlite`, `expo-build-properties`, `expo-constants`, `expo-notifications`, `expo-sharing`, `expo-splash-screen`) keeping `DEC-P39-DEPS-01` accepted until next SDK major upgrade; added `P39AuditRemediations.test.tsx` and physical-device checks `O83` and `O84` (`Not run`); verified production bundles exclude `stressData.ts`. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-A–H, stateStorage.native.ts, StorageErrorBanner.tsx, _layout.tsx, createAppStore.ts, package.json; related P39-A, P39-B, P39-D, P39-E, P39-H, DEC-P39-DEPS-01; reason: implements remediations for completed P39 audit findings under P39-H. | 2026-11-25 |
| P40-A | — | Done | Report-only measurement of `docs/PROGRESS.md` (13,495 lines, 1,443,604 bytes, ~359,592 tokens), `docs/memory/*` (3,545 lines, 286,061 bytes, ~71,388 tokens), and `AGENTS.md` (319 lines, 21,941 bytes, ~5,477 tokens); 5 doc-parsing Jest suites (96 `it()` blocks, 1,312 assertions); detailed report at `/tmp/wealthwise/reports/p40-a-doc-size-audit.md`; tracked in `#461` (`CR-172`). Owner approved keeping P40-A/B in P40 (CR-113). Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, AGENTS.md, and doc tests; related P40-A, P40-B, CR-113, #461; reason: executes already-approved P40-A measurement work in P40. | 2026-11-25 |
| P40-B | — | Done | Archived completed-phase narrative from `docs/PROGRESS.md` (sections 4, 5, 6, 7, 10, 11) into 6 linked files under `docs/memory/archive/` indexed by `docs/memory/archive/README.md`, reducing `docs/PROGRESS.md` from 13,495 lines (1,443,604 bytes) to ~2,035 lines (~365 KB) while keeping the active dashboard, standing rules, open items, current roadmap, recent CR/verification records, branch index, and independent entities in `docs/PROGRESS.md`; updated `progressLedger.test.ts` (`loadLedgerWithArchives()`) to validate archives without weakening any assertion; tracked in `#462` (`CR-173`). Owner approved keeping P40-A/B in P40 (CR-113). Dependencies: P40-A. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and progressLedger.test.ts; related P40-A, CR-113, CR-172, #462; reason: executes already-approved P40-B archival work in P40. | 2026-11-25 |
| P41-A | — | Done; Revised by P41-A-R1 | Add finite Real estate and Custom financial types, validated optional custom names, consistent forms, display/search/backup behavior, and balanced demo data. Real estate maps to the Real estate invest category; Custom maps to Other investments; both use Savings and Investments. Task PR #97 and phase PR #98 merged to `develop` as `9aa6540`; P41-A-R1 task PR #99 and phase PR #100 merged to `develop` as `a67f54f`. | 2026-11-10 |
| P41-B | — | Done; Revised by P41-B-R1 | Add Once only recurrence to Budget items, income and insurance premiums with exact-once due, reminder, cash-flow, snapshot and schema-v23 migration behavior. Do not add it to investment plans or liabilities. Nine focused suites / 233 tests, TypeScript and Expo lint pass. Task PR #101 and phase PR #102 merged to `develop` as `b4275d3`. | 2026-11-10 |
| P41-B-R1 | — | Done | Correct the stale once-only demo reminder expectation and cover schema/schedule branches exposed by Gate 1 without changing production behavior. Task PR #108 merged into `phase/41-types-frequency-completion` as `e1db78e`; phase PR #109 merged into `develop` as `5cb4957`; all six ordered gates pass. | 2026-11-11 |
| P41-C | — | Done | Separate completed liabilities and achieved goals into labelled collapsed sections while retaining filters, sorting, search and the pinned Emergency fund goal. Task PR #104 merged into `phase/41-types-frequency-completion` as `c255ada`; phase PR #105 merged to `develop` as `37a3429`. Dependencies: P41-A. | 2026-11-10 |
| P41-D | — | Done | Add the offline About route, app-menu access, confirmed browser update link, route tests and offline regression evidence. Test-first commit `bd980ad`; task PR #106 merged into `phase/41-types-frequency-completion` as `7ddfef5`; phase PR #107 merged to `develop` as `8e4a2d1`. Dependencies: none. | 2026-11-10 |
| P42-A | — | Done; Revised by P42-A-R1 | Reconcile owner-approved future plans and close accepted follow-ups; record the deleted codex branch contents and preserve historical evidence. No application behavior changes. | 2026-11-11 |
| P42-A-R1 | — | Done | Record P42-A task/phase PR integration and rerun the six gates on the integrated develop tree. No application behavior changes. | 2026-11-11 |
| P43-A | — | Done | Lifecycle tracking is separate from numbered phases. Remote `cleanup` and `qa-and-release` refs were pushed at their original tips, verified against the old refs, and the old refs deleted: `a2fa24f930da15c49f779577eb749b33f11a7059` and `9d914638e50462cbadef84df3294ed07cbf42732`. P27/P28 completion evidence and all three stale phase tag targets are preserved. No Git chronology or tags changed. | 2026-11-12 |
| P43-B | — | Done | Owner approved the non-release tag-cleanup scope and deletion of all non-release tags. Deleted all 47 non-release and legacy phase tags locally and on remote origin, retaining exclusively the five verified release tags (v1.0.0, v1.1.0, v1.1.1, v1.2.0, v1.3.0). Enforced release-only tag policy in AGENTS.md, rules.md, and standing rules: only vX.Y.Z release tags are maintained, and non-release tags are prohibited. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, git tags; related cleanup/hygiene and repository process; reason: repository tag hygiene and standing tag policy enforcement. | 2026-11-22 |
| P43-E | — | Done | Owner approved the GitHub issue strategy, scope and batching direction: verified inventory of 209 active dashboard parts (173 done, 36 planned) and 145 CRs (94 mapped, 51 standalone lifecycle); deduplicated strategy of 260 issues (224 closed retrospective, 36 open planned); taxonomy of phase, type, status labels and release milestones; API rate limit mitigation and 7-batch execution plan; zero issues created/modified (creation requires separate execution task); report in /tmp/wealthwise-p43-e-issue-inventory-plan.md. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-A–G; reason: repository-process issue inventory and execution planning setup exception. | 2026-11-24 |
| P43-F | — | Done; Revised by P43-F-R1 | Add and enforce R6 work-placement rules, activate CM-2, audit and relocate Planned work, and add the shared work-placement guide. task PR #153 merged into P43 at `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154 merged into `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`. All six ordered gates passed after the successful Expo Doctor retry. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, tests and branch instructions; related P43-A–E and CM-2; reason: this is shared repository-process policy and lifecycle setup. | 2026-11-12 |
| P43-F-R1 | — | Done | Record P43-F task/phase PR integration and exact merge commits; task PR #153 merged into P43 at `6e8632f61226fabbfdeca1040f6dee097a808607`, phase PR #154 merged into `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`. No app behavior changed; focused ledger and memory tests pass. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, tests and branch instructions; related P43-F and CM-2; reason: complete the lifecycle/process setup record with verified remote integration evidence. | 2026-11-12 |
| P43-G | — | Done; Revised by P43-G-R1 | Reconcile owner-approved decisions across Planned work without starting implementation. Record P21 Home-source authorization; reactivate/approve P33/P34/P35 research and post-research widget/auto-detection scope; approve P35 Go after research; approve P43-B/E planning direction; resolve P44 placement/counting and P39/P40 placement. Exact tag deletion list and P43-E execution inventory remain prerequisites. Test-first assertion, documentation commits, PR chain and six-gate results are recorded under CR-113 and P43-G-R1. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement guide and all touched plan entries; related P21-F, P33-A–C, P34-A–C, P35-A–C, P39-A–H, P40-A–B, P43-B/E and P44-A–D; reason: this is cross-plan owner-decision and repository lifecycle tracking. | 2026-11-12 |
| P43-G-R1 | — | Done | Record task/phase PR integration and exact merge commits for P43-G. Task PR #157 merged into P43 at `01e5559f00a3b7008292db07ed7900af0ea8f828`; phase PR #158 merged into `develop` at `14f539b4c70da1a00e24642fd3e6068091f3ed9c`. Both merge commits are verified. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, work-placement guide and touched records; related P43-G; reason: record merge evidence as the next sequential revision in the original phase. | 2026-11-12 |
| P44-A | — | Planned | Design the spending heat map: owner approved a Transactions stack route opened from a Transactions header action; include all inflows in Income with a toggle to exclude non-earned inflows; count linked investment transactions only as Investment. Finalize metrics/scales, accessibility, performance and schema impact. Dependencies: none. Evidence: not started. | 2026-11-12 |
| P44-B | — | Planned | Implement a pure, injected-date domain selector for daily totals by transaction type for one month; include unit and seeded-oracle tests plus 50-year and 126-year stress fixtures. Dependencies: P44-A. Evidence: not started. | 2026-11-12 |
| P44-C | — | Planned | Add the screen/stack route, bounded month navigation, type toggle and day detail; test font scales 1.0, 1.3 and 2.0. Dependencies: P44-B. Evidence: not started. | 2026-11-12 |
| P44-D | — | Planned | Add DEC-DEMO data, simulated-layout and accessibility checks, and device-checklist rows. Dependencies: P44-C. Evidence: not started. | 2026-11-12 |
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
| CR-3 | Done (owner accepted current behavior) | Owner confirmed the existing Save behavior in `profile-form.tsx` and `transaction-form.tsx` is satisfactory; no implementation change requested. | 2026-11-11 |
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
  explicit owner approval. Only `vX.Y.Z` release tags are maintained in the
  repository; non-release, phase, and intermediate tags are prohibited and
  must not be created. Legacy non-release tags were deleted under approved
  task P43-B.
- **R4 — Documentation scope:** routine Git documentation is limited to
  `docs/memory/*`, `docs/PROGRESS.md`, `docs/releases/**`, `CONTRIBUTING.md`,
  `SECURITY.md`, and `.github/**`. Change other documentation only when
  explicitly authorized. Reports and generated output belong in chat or
  `/tmp`; release content must remain in Git, never `/tmp`.
- **R6 — Work placement:** before adding a ledger row, branch or task, search
  the dashboard, register, phase history, roadmap, memory and touched
  files/features. Apply the first matching rule: (1) ongoing standalone
  lifecycle work (cleanup, qa-and-release, schema-migration, documentation,
  release/hotfix, branch/tag hygiene, CI and repository operations) goes in
  standalone lifecycle tracking outside product phases; P43 is the designated
  temporary setup-phase exception; (2) revise completed work with the next
  sequential revision of its original part and phase; (3) widen an open part
  in place; (4) add related feature work as the next part in its phase; (5)
  create a new phase for a genuinely new feature area. Every new or moved row
  has `Placement: rule <1-5>; searched <what>; related <IDs or none>; reason
  <one sentence>`. See [work-placement.md](memory/work-placement.md).
- **R7 — Slot filling and empty phase reservations:** empty phase numbers freed
  by independent entity separation or cancellation (P7, P27, P28, P32) stay
  reserved as empty slots so no existing phase is renumbered and no
  historical branch, tag, commit or ID is rewritten. A new feature may take an
  empty slot only if it is related to the phase immediately before or after it:
  P7 for backup & security (P6) or investments (P8) work; P27 for
  accessibility & performance (P26) work; P28 for income
  recurrence / Budget income (P29) work; P32 for project health/community (P31) or
  widgets (P33) work. For multiple consecutive empty slots, apply the same
  adjacency pattern per slot. Unrelated work never takes an empty slot; it
  opens a new phase at the end under R6 rule 5. Precedence: R6 rules 1–3 first
  (standalone lifecycle, completed-part revisions, and open-part scope), then
  R7 for new-feature placement into an eligible adjacent empty slot before
  opening a new phase.

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

#### CM-2 — Active; enforced

After any merge that lands on a target branch (task->phase, phase->develop, release->main, main->develop): git fetch --all --prune; git switch <target>; git pull --ff-only. Refuse and report if the worktree is dirty, the fast-forward fails or the target has no upstream. This rule never authorizes pushing; R3 is unchanged.

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

### DEC-P39-DEPS-01 (2026-11-25)

- **Status:** Resolved by Expo SDK 58 upgrade (`P39-E-R1` / `CR-169`, 2026-11-25); previously accepted by owner approval under SDK 57 (`CR-164`).
- **Decision:** Accept the documented `decode-uri-component@0.2.2` ReDoS risk until the next planned Expo SDK upgrade (`CR-164`), then upgrade to Expo SDK 58 (`P39-E-R1` / `CR-169`) to eliminate the vulnerable dependency path.
- **Verified evidence:** Under SDK 57 (`CR-164`), `decode-uri-component@0.2.2` (`<=0.5.0`) was a transitive dependency via `expo-router@57.0.31` -> `query-string@7.1.3` (`GHSA-vcc3-ghjq-m6fr` Moderate `<=0.4.2`; `GHSA-qr28-fpjm-wq7f` High `<=0.5.0`, not fixed under SDK 57). After upgrading to Expo SDK 58 (`expo@^58.0.26`, `expo-router@~58.0.32`) under `P39-E-R1` (`CR-169`), `npm ls decode-uri-component` is empty and `npm audit` reports 0 critical and 0 high vulnerabilities (27 moderate advisories remain in dev/CLI tooling `glob` and `minimatch`).
- **Mitigation & scope:** WealthWise remains 100% offline-first (`src/lib/__tests__/offlineRuntime.test.ts` forbids network APIs) with internal Expo Router routes (`scheme: "wealthwise"` in `app.json`).
- **Follow-up condition:** Satisfied on 2026-11-25 via `P39-E-R1` / `CR-169`; monitor remaining dev/CLI tooling advisories during routine dependency maintenance.

### DEC-DOCS-DEVICE-CHECKLIST-RELEASE-GATE (2026-11-22)

A device result belongs to exactly one release section, and the checklist keeps
published-release history separate from checks for the next release. Every
non-Pass row in every section blocks building, drafting, tagging and
publication; only an explicit written owner waiver for named IDs lifts the
block, while the row remains unchanged. New rows use the next free ID in the
next-release section and are never renumbered. On publication, the completed
section joins the ascending release list and a fresh next-release section is
created. Owner-reported results are logged under R8 with their evidence.

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

> Historical schema history and completed-phase decisions are archived in [memory/archive/architecture-and-decisions.md](memory/archive/architecture-and-decisions.md) (see [memory/archive/README.md](memory/archive/README.md)).

## 5. Phase history

Historical descriptions without a repository commit have the user confirmation
recorded below; that confirmation does not supply missing Git hashes or original
test reports. Commit hashes below are from Git; source quality describes the
available prompt/history evidence, not a new verification of every acceptance
criterion.

### Placement moves (CR-112)

| Previously | Current home | Rule | Evidence / branch handling |
|---|---|---|---|
| P43-C | P21-F | 4 | Planned-row relocation to the Emergency Fund feature area; no implementation commit, PR or Done evidence references P43-C, so P21's branch was not reopened. |
| P43-D | P20-W | 4 | Planned-row relocation to Budget and transaction-category forms owned by P20-O/P; P3 is generic persistence. No implementation commit, PR or Done evidence references P43-D, so P20's branch was not reopened. |
| P31-E | qa-and-release CI workflow | 1 | Planned CI/repository-process work moved to standalone lifecycle tracking; no implementation commit, PR or Done evidence references P31-E. |

These are ledger-text relocations only. They are the one-time R2 branch
reopen exception because no work has been performed in P20 or P21 for these
items.

### Placement moves (CR-114)

| Previously | Current home | Rule | Evidence / branch handling |
|---|---|---|---|
| P7 | `schema-migration` (independent entity) | 1 | Schema migration tracking separated from numbered product phases to independent lifecycle entity; branch renamed to `schema-migration` (historical branch name: `phase/07-schema-migration`). P7 remains an Empty (reserved) slot. |
| P27-A | `cleanup` (independent entity) | 1 | Repository and dead-code cleanup separated to independent lifecycle entity `cleanup` (historical branch name: `phase/27-cleanup`). P27 remains an Empty (reserved) slot. |
| P28 release/QA parts (14 parts) | `qa-and-release` (independent entity) | 1 | Release readiness, EAS builds, tags, publication and CI workflow separated to independent lifecycle entity `qa-and-release` (historical branch name: `phase/28-qa-and-release`). P28 remains an Empty (reserved) slot. |
| P28 documentation parts (26 parts) | `documentation` (independent entity) | 1 | Documentation, README, release notes, screenshots, memory, rules and ledger tracking separated to independent lifecycle entity `documentation` on standalone branch `documentation`. |
| P32-A, P32-B, P32-C | `Cancelled / unassigned` bucket (under Section 13) | 1 | Cancelled screenshot capture rows preserved in Section 13 Cancelled / unassigned bucket. P32 remains an Empty (reserved) slot. |

These are ledger-text relocations only to preserve historical commit references, legacy IDs, and audit evidence while maintaining empty slots and independent entities.

Assertion updates: the old roadmap checks for Emergency Fund's three-month
floor and font-scale coverage now read P21-F; the schema-impact assertion now
reads P20-W; roadmap name checks now use the relocated P20-W/P21-F entries.
These preserve the same required content while following its new canonical
placement. Placement-format checks accept the existing optional colon after
`reason`; no assertion was removed or weakened.

### DOCS-REMOTE-SYNC R8 assertion update

The old `branchingDocs.test.ts` assertion required only the heading `Remote
snapshot export`. The new assertions require the recorded `script` session and
`exit`, explain why `pbpaste` is insufficient, identify the export script and
record fields, and require a snapshot refresh after each manual merge. Reason:
the old check passed while the repository protocol did not preserve the
owner-provided evidence workflow. No prior assertion was weakened.

### 2026-11-22 remote snapshot reconciliation

Owner snapshot exported at `2026-11-22T11:12:56+05:30` reports `develop` at
`b3fa175b999f3ae62e2b099a412f5a9e9da5f0db` and `phase/20-budget` at
`4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`. The D3 task tip
`5424171b5eee69dc70606c8664da2e2f5c3f2e71`, `origin/phase/20-budget`, and
`origin/develop` all have tree `e56c0b89c671ff3c23bdd96886bfd2d8090f45cc`.
The snapshot contains 183 PR records, zero open PRs, zero issues, and one
non-merged PR number (#39, closed); the full generated inventory and number
classification is retained in `/tmp/sync/inventory-cont.md` and
`/tmp/sync/unmerged-numbers-cont.md`.

PR #181's current body corrects the original description, and its correction
comment is present at issuecomment-7067953238 (created 2026-11-21 19:20:47Z).
The original body claim that it integrated D3 is preserved as history; the
correction says D3 was integrated separately. PR #179's Gate 4 comment is
issuecomment-7067676816 (2026-11-21 18:59:43Z). Snapshot PR records confirm
creator and merger `sahilsheikh-dev` for #179–#183 and provide merge timestamps
and SHAs, recorded in Section 11. The reconstructed owner transcript confirms
two failed phase-to-develop PR creation attempts at 01:19 and 01:20 IST because
`develop` and `phase/20-budget` had no differing commits before the required
branch pushes. The 00:29 phase Gate 4 exit code remains not captured; 00:51 on
develop and 01:17 on the D3 task branch both exited 1 with 20/21 and the six
known SDK 57 patch mismatches. The 01:17 run was on task tip `5424171` despite
the temporary filename `gate4-phase-d3.txt`.

The snapshot reports no open PRs/issues and retains phase branches while merged
task branches are absent from the remote branch list. Tags match the local
release tag inventory. GitHub releases report v1.2.0 latest and published
2026-11-10T20:38:40Z; this matches the release-history document. Release
materials were report-only and unchanged. Current task Gate 4 was already
invoked once in the preceding run and returned no captured code; it was not
rerun. Focused test and remaining gates are recorded below. Protected-file
hashes were checked against `docs/memory/rules.md`.

> Completed-phase narrative history is archived in [memory/archive/phase-history.md](memory/archive/phase-history.md).

## 6. Prompt and session log

Prompt text is not duplicated here. RECOVERY is the last Git commit with the
prompt archive. The repository was already at `b92e145`, whose parent
`d11af45` removed that archive; `5aeefb9` is the last commit containing it.
Unknown dates/outcomes are not inferred. “Agent mistakes” records only
evidence present in exports/checkpoints.

| ID | Phase | Legacy ID | Session | Date | Purpose | Outcome | Commits (Git only) | Agent mistakes / review findings | Text |
|---|---|---|---:|---|---|---|---|---|---|
| CR-115 | documentation | — | complete | 2026-11-13 | Record the owner-reported Budget edit/delete defect under P20-U-R1. | Recording is Done; the original “Don’t start working on this” instruction was superseded by the owner’s explicit 2026-11-21 authorization. Product work completed under P20-U-R1. | Original documentation commit; implementation evidence is recorded in P20-U-R1. | No owner edits were overwritten; source and current schema v23 were inspected. | current request |
| CR-116 | P20 | — | current | 2026-11-21 | Add searchable filtering and stable relevance ranking to the shared Dropdown sheet across the app. | Done as P20-S-R2; task PR #164 and phase PR #165 are merged and verified by P20-S-R2-R1. Six ordered gates completed with the documented Gate 4 SDK patch exception. | Test-first ledger `36e8ba4`; implementation commits through `d69c5cf`; task merge `185a5ea125f64ac104344f00ad013d68cdb7a946`; phase merge `6b50a1dbd36b401352776e71028fc07071c11991`. | Assumed and confirmed: no schema, domain, demo-data or dependency changes. O61–O64 remain Not run on physical devices. | current request |
| P20-W | P20 | P43-D | current | 2026-11-21 | Implement D1/D2 transaction forms and custom earned-income D3 with schema v24. | Done; Revised by P20-W-R1 and P20-W-R2. Correction (2026-11-22): prior status said task/phase PR integration pending; local refs now contain #182/#183. D1/D2 are integrated. D3 authorized by DEC-P20W-D3-SCHEMA24; P20-W owns v24 and P36-A/B are replanned to v25. Test-first commit `06b2659`; implementation commit `f2541fd` on `task/P20-W-D3-custom-earned-income`. Focused verification: 8 suites / 524 tests passed. Final gates: Gate 1 exit 0 (102 suites, 1,381 passed, 1 skipped); Gates 2–3 exit 0; Gate 4 exit 1 (`ENOTFOUND registry.npmjs.org`); Gates 5–6 exit 0. Task PR #182 merged into `phase/20-budget` at `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`; phase PR #183 merged into `develop` at `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db`; CM-2 synchronized `develop`. Prior task/phase integration and six-gate evidence remains recorded above. | Prior phase sync `e44ce6f0dc4614339f766ac91d73f0df0d428363`; D1/D2 commits and task/phase merge SHAs are recorded in the P20-W session history. | D3 keeps the existing category field, widens it to a trimmed nonempty string up to 60 characters, preserves v23 strings in identity migration, retains backup format v1 and v1–v23 imports, and adds `.premigration.v23` recognition/cleanup. | current request |
| P20-W-R1 | P20 | P20-W | current | 2026-11-21 | Record verified P20-W task and phase PR integration while retaining D3 as Planned. | Done. Historical statement: P20-W remained In progress pending the D3 decision. Correction (2026-11-22): P20-W-R2 records D3 integration after that decision; O69–O72 remain Not run. Task PR #174 merged into `phase/20-budget` at `419a37b07e6853b3c683d22ec243ea58223514c1`; phase PR #175 merged into `develop` at `9e47856f20848e03ac6a4b8e699f47c387d08161`; CM-2 synchronized local `develop`. O69–O72 remain Not run. | Test-first commit `6f31775`; task integration commit `8d04514ff0fd057365506433f2a9f0a0fbb7b32e`. | No application behavior changed. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and P20-W records; related P20-W and CM-2; reason: record verified task/phase integration as the next P20-W revision required by the integration workflow. | current request |
| P20-A-R3-R1 | P20 | P20-A-R3 | current | 2026-11-22 | Record local task/phase PR merge evidence. | Done; #178/#179 merge commits are in local Git; Gate 4 owner output is 20/21 exit 1 with six known SDK 57 patch mismatches; O74 Not run. Remote PR metadata and owner repro remain not recorded. | `e1e2fc9cb6472daf6ec121d65e9075e421ceadde`; `f7d40f47d00aa14969799461de25631ae16d98c8` | Owner terminal export absent. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Git refs; related P20-A-R3; reason: next sequential integration evidence revision. | current request |
| P20-U-R1-R1 | P20 | P20-U-R1 | current | 2026-11-22 | Record local task/phase PR merge evidence. | Done; #180/#181 merge commits are in local Git; O73 Not run. Owner-reported PR #181 edit/comment and failed PR-create attempts are not independently verified by supplied terminal files. | `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478`; `22f332fe9310e92c50d94cc6640c19f4e1552dcc` | Terminal captures contain only clipboard redirection commands. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Git refs; related P20-U-R1; reason: next sequential integration evidence revision. | current request |
| P20-W-R2 | P20 | P20-W | current | 2026-11-22 | Record P20-W-D3 task/phase PR merge evidence. | Done; #182/#183 merged; schema v24; O69–O72 remain Not run. Correction: snapshot confirms #181's corrected body and comment #7067953238; D3 was integrated separately. | `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b`; `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db` | Gate 4 task and develop outputs exit 1, 20/21, six known SDK 57 patch mismatches; phase #179 exit not captured. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and owner snapshot; related P20-W and CM-2; reason: record integration and reconcile its remote evidence. | current request |
| CR-117 | P21 | — | current | 2026-11-21 | Implement one Emergency Fund edit entry point and one form to change the saved target and allocation together, with floor behavior, cross-screen reflection, one action/write and Undo, validation, demo fixture and backup round-trip proof. | Done as P21-F; Revised by P21-F-R1; task PR #170 merged at `c877f6d19e35c0b9fbcba90e9722da7531948c8e`, phase PR #171 merged at `2e5e18a7a2be207387a7462b039547f51b0e4631`, and CM-2 synchronized local `develop`. Synced task gates: Gate 1 exit 0 (102 suites, 1,365 passed, 1 skipped); Gates 2–3 exit 0; local Gate 4 attempt exit 1 (`ENOTFOUND registry.npmjs.org`); owner-supplied Gate 4 exit 1 (20/21 checks, six SDK 57 patch mismatches); Gates 5–6 exit 0. O65–O68 remain Not run on physical devices. | Test-first ledger assertion `f759932`; gate-evidence regression `54dc17f`; evidence-revision test `647a0c9`; combined-editor test commit `99ec2fc`; integration evidence P21-F-R1. | DEC-P21F-FLOOR: retain max(stored target, three-month floor) and reject below-floor input to match existing typed validation; no schema bump or backup shape change. | current request |
| CR-118 | documentation | — | current | 2026-11-22 | Establish R8 owner-run action evidence and reconcile local remote-history records with the repository ledger and memory. | Done; PR #184 merged into `documentation` at `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea`; PR #185 merged into `develop` at `a946baff7793e7485b54cb363048f7906983574c`. Snapshot exported at 2026-11-22T11:39:32+05:30 confirms merge status and timestamps. | Commits: sync `e5808c4`; failing test `fc50970`; test assertion update `ce911c0`; R8 memory/policy `9b54d92`; owner log `3097fc3`; generated history map `72c1def`, mapping correction `cc18b52`, commit-map update `8b059db`; memory sync `3c54da3` and final gates/status `1c27944`; ledger action log `3097fc3` and history closeout `917b313`. | The prior reconciliation performed no network, push, PR or merge. This continuation also made no network action. Correction (2026-11-22): reconstructed terminal paste records the owner's 11:33–11:35 IST push, PR and merge commands and develop CM-2 sync; see Owner-run actions log and owner-terminal-2026-11-22-reconstructed-2.txt segments 7–8. The script recording itself is incomplete. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory and R8/ledger tests; related documentation lifecycle and CR-118; reason: remote-state logging and repository memory are ongoing standalone documentation work. | current request |
| CR-119 | documentation | — | current | 2026-11-22 | Split the Android device checklist by published release and add a release-blocking device gate with consistent maintenance rules. | Done; published and merged under owner authorization. PR #186 merged into `documentation` at `001df8b812e0b2c990137f22747be4d0e5cfd2a1`; PR #187 merged into `develop` at `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6`. Local `develop` synchronized via CM-2. Gate 4 on develop exits 1 (20/21 passed, six known Expo SDK 57 patch mismatches). O61–O74 remain Not run and block releases. | Test-first structure commit `1d9b574`; ID-set strengthening `9864859`; CR-119/policy regression `7221ba5`, `c7eb5e1`, `26f7a92`; checklist and policy documentation commit `855b666`. | Old: one versioned H1 and a v1.2.0 release-candidate section mixed published and next-release checks. New: one shared H1, Next release first, then v1.0.0 (X1–M38), v1.1.0 (N39–N43), v1.1.1 (N44), and v1.2.0 (O45–O60); O61–O74 remain next release. Release-history dates and tag records confirm published assignment; no row values changed. Old test failed on the versioned H1; new test asserts headings, per-section fields/results, unique original ID set, Pass-only published sections, and exact shared gate/maintenance wording. Reason: make each release's evidence auditable and prevent release actions while any device check is incomplete. No existing assertion was weakened. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, release history/tags, checklist and tests; related documentation lifecycle and CR-119; reason: release checklist policy is ongoing standalone documentation work. | current request |
| CR-120 | cleanup | — | current | 2026-11-22 | Align Expo SDK 57 patch versions for expo, expo-constants, expo-linking, expo-router, expo-sharing, expo-sqlite to resolve Gate 4. | Done; upgraded six packages to Expo SDK 57 recommended versions; Gate 4 exits 0 (21/21); all six gates pass; no app behavior change. | Dependency upgrade in package.json and package-lock.json; commit `fac699e`. | Old: Gate 4 failed with exit 1 on 6 patch mismatches as an owner-approved exception. New: all packages match SDK 57 requirements, Gate 4 passes exit 0 (21/21). Reason: eliminate dependency patch mismatches and clear Gate 4 exception. Placement: rule 1; searched dashboard, register, memory; related cleanup lifecycle; reason: dependency maintenance is ongoing cleanup lifecycle work. | current request |
| CR-121 | documentation | — | current | 2026-11-22 | Record owner-reported physical-device validation Pass for O61–O74 across Dropdowns, Emergency Fund, Invest transactions, Budget categories, custom earned income, and Budget items. | Done; O61–O74 marked Pass in Next release device checks; release gate unblocked for candidate builds. | Documentation commits and PR merges on documentation and develop. | Physical-device validation performed and reported Pass by owner on 2026-11-22; device model, OS version and tester details omitted. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | current request |
| CR-122 | documentation | — | current | 2026-11-22 | Record physical device details across all release checklist tables, update verification notes, and add checklist maintenance prompting rule with previous release suggestions. | Done; device model (realme Narzo 60 Pro 5g), Android version (15 Vanilla Ice Cream), tester (sahilsheikh-dev), and respective release dates recorded across all 5 checklist sections; Pass notes updated; maintenance rule updated in all policy docs. | Documentation commits on task/docs-device-checklist-metadata-rules, merged into documentation and develop. | Placement: rule 1; searched dashboard, register, phase history, memory, device checklist and policy files; related documentation lifecycle; reason: checklist metadata and maintenance policy updates are ongoing documentation work. | current request |
| CR-123 | P7 | — | current | 2026-11-22 | Record Phase P7 — Automated Google Drive Cloud Backup as Planned across repository ledgers, memory, and roadmap under Rule R7 (adjacent to P6 Backup & Security). | Planned; subtasks P7-A through P7-D planned across PROGRESS.md, status.md, open-items.md, and work-placement.md. | Planning docs commit; no implementation. | Phase title: P7 — Cloud Backup (Google Drive). Subtasks P7-A to P7-D all Planned; Evidence: not started. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory; related P6 backup; reason: automated cloud backup extends P6 Backup & Security under Rule R7 empty slot. | current request |
| CR-124 | documentation | — | current | 2026-11-22 | Document that v1.0.0 and v1.1.0 APK downloads are preview build APKs (built with EAS preview profile and versionCode 1) rather than production builds, while v1.1.1 and v1.2.0 distribute production android-apk builds. | Done; published release notes (v1.0.0, v1.1.0), release history, and build config updated; tests pass. | Documentation commits on task/docs-v100-v110-preview-apk-notes, merged into documentation and develop. | Placement: rule 1; searched dashboard, register, phase history, memory, release notes, and build history; related documentation lifecycle; reason: historical release artifact profile clarification is ongoing documentation work. | current request |
| CR-128 | documentation | — | current | 2026-11-22 | Record owner cancellation of Once-only frequency for investment plans or liabilities across repository documentation and roadmap. | Done; candidate cancelled by owner decision; investment plans retain manual/plan kinds and liabilities retain one-time/recurring kinds; no schema or form changes made. | Documentation commits and PR merges on documentation and develop. | Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, open-items.md; related documentation lifecycle; reason: recording owner cancellation of candidate feature is ongoing documentation work. | current request |
| CR-127 | documentation | — | current | 2026-11-22 | Record owner-reported physical-device validation Pass for O75 and O76 across Budget sorting, payment date prompt, multi-asset budget links, and limited transaction expense categories. | Done; O75 and O76 marked Pass in Next release device checks; release gate unblocked for candidate builds. Tested and validated by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream. | Documentation commits and PR merges on documentation and develop. | Physical-device validation performed and reported Pass by owner on 2026-11-22; device model realme Narzo 60 Pro 5g, OS Android 15 Vanilla Ice Cream, tester sahilsheikh-dev confirmed. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | current request |
| CR-126 | P20 | P20-Y | current | 2026-11-22 | Implement payment date when marking scheduled/budgeted items Paid in Transactions and Budget; allow one asset to link to multiple one-time investment budgets; limit Transaction expense categories to user-created or applicable scheduled items plus Custom, preserving historical removed categories when editing. | Done; payment date input with today default added to PaidAmountDialog and propagated through clearDue / clearDuesThrough / addTransaction; multiple one-time investment budgets can link to the same asset with note-based entry attribution in budgetLineActual; TransactionForm expense picker limited to user-created budget items and applicable scheduled dues/policies, preserving historical removed categories; regression tests pass; all six gates pass with exit 0. Physical-device check O76 recorded as Not run. | Task branch task/P20-Y-budget-payment-date-links-categories, phase branch phase/20-budget. | Old: marking dues Paid always used today's date with no date input; linking an asset to multiple investment budgets was blocked as a duplicate link; Transaction expense categories showed generic unbudgeted built-in categories (entertainment, gifts, etc.). New: Paid dialog prompts for payment date (defaults to today, editable); multiple one-time investment budgets can link to the same holding with correct payment attribution; Transaction expense categories are strictly limited to user-created budget items, applicable scheduled dues/policies, and Custom, while preserving historical categories when editing existing transactions. Superseded test assertions in TransactionForm.test.tsx updated and documented. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and Budget/dues/transaction code; related P20, P20-A-R3, and P20-W; reason: Payment date on clearing dues, multi-budget asset linking, and user-scoped transaction expense categories extend the P20 Budget and Transaction category feature area. | current request |
| CR-129 | P20 | P20-X-R1 | current | 2026-11-22 | Remove sorting option from TransactionForm category dropdowns (Expense, Income, Invest) and remove static Search header title from shared Dropdown sheet, keeping search placeholder inside the input box. | Done; TransactionForm category dropdowns no longer render or accept sorting props; shared Dropdown removes the static Search AppText title while preserving input placeholder and live results. Tests in Dropdown.test.tsx and TransactionForm.test.tsx pass. All six gates pass with exit 0. | Task branch task/P20-X-R1-remove-transaction-sorting-dropdown-title, phase branch phase/20-budget. | Old: TransactionForm category dropdowns rendered SortChip and connected budgetSpending sort spec; Dropdown sheet rendered static Search text title above search input box. New: TransactionForm category dropdowns do not configure or display sorting; Dropdown sheet displays search input with placeholder without separate text title. Superseded assertions documented. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Dropdown/transaction-form code; related P20-X and P20-S-R2; reason: user-directed removal of sorting in add transaction and removal of duplicate Search title in dropdowns. | current request |
| CR-130 | qa-and-release | P28-F-R7 | current | 2026-11-22 | Prepare and publish owner-approved v1.3.0 minor release candidate: bump app and package manifests to 1.3.0, publish v1.3.0 release notes with 8 owner-supplied screenshots, align device-test checklist and build configuration, and verify all six gates. | Done; candidate PRs #210/#211 integrated to develop (afeb987); release/v1.3.0 created; EAS build c2ec9414-ae63-44cc-b34a-0f67f6cb51cb (profile android-apk, versionCode 4) verified and uploaded to GitHub draft (107,030,213 bytes); build records integrated via PRs #212/#213 (58d9a26); README.md (v1.3.0 download block and 8-screenshot gallery), release notes, release history, and AGENTS.md/rules.md release rules aligned for v1.3.0; release/v1.3.0 merged to main via PR #216 (341dbcb); tag v1.3.0 created; GitHub Release v1.3.0 published as Latest by sahilsheikh-dev; post-publication sync PR #217 (97c6d02) merged to develop. | Task branch task/P28-F-R7-align-v1.3.0-readme-screenshots-details, phase branch qa-and-release (historical branch name: `phase/28-qa-and-release`). | Old: app version 1.2.0, schema 24 unreleased. New: app version 1.3.0, published v1.3.0 release notes with 8 owner-supplied screenshots. Reason: prepare verified v1.3.0 candidate for release. Placement: rule 1; searched dashboard, register, memory, release history; related qa-and-release lifecycle; reason: ongoing release engineering. | current request |
| CR-141 | documentation | — | current | 2026-11-23 | Reconcile documentation to reflect completed v1.3.0 publication across release-history.md, docs/releases/README.md, memory status, open items, and PROGRESS.md. | Done; release documentation updated to record completed publication of v1.3.0, PR #216 merge to main (341dbcb), tag v1.3.0 (51523b8), GitHub Release publication as Latest, and post-publication sync PR #217 (97c6d02) to develop. All six gates pass with exit 0. | Task branch task/docs-reconcile-v130-published-status, branch documentation. | Old: release-history, docs/releases/README.md, open-items.md, status.md, and PROGRESS.md retained pre-publication candidate draft notes indicating publication was pending. New: all documentation accurately reflects verified publication, release merge to main, tag creation, and post-publication develop sync. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, release docs; related documentation lifecycle; reason: reconciling documentation to reflect completed v1.3.0 publication is ongoing documentation lifecycle work. | current request |
| CR-142 | documentation | — | current | 2026-11-23 | Reconcile planned and unimplemented roadmap items across repository docs; correct stale historical plan notes (P21-F and P43-B are Done and released; only P7, P31, P33-P40, P43-E, P44 remain planned). | Done; open-items.md and status.md updated to resolve stale historical notes on P21-F and P43-B, and authoritative list of 12 active planned roadmap areas documented; tests pass; all six gates pass with exit 0. | Task branch task/docs-correct-planned-items-cr142, branch documentation. | Old: open-items.md CR-113 section retained historical note stating P21-F remained unimplemented and P43-B tag deletion was not authorized; pending owner actions noted O77 was pending. New: P21-F and P43-B explicitly recorded as Done; O77 recorded as Pass; authoritative inventory of 12 planned roadmap items established. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, open-items; related documentation lifecycle; reason: roadmap and open-items reconciliation is ongoing documentation lifecycle work. | current request |
| CR-143 | documentation | — | current | 2026-11-23 | Record feature requests for Budget category filter (P20-Z) and Dynamic asset valuation (P29-U-R1) as Planned work only across repository ledgers, memory, and roadmap under Rule R6 (Rules 4 and 2). | Planned; subtasks P20-Z and P29-U-R1 planned across PROGRESS.md, status.md, and open-items.md with open product questions documented without inventing decisions; tests pass; all six gates pass with exit 0. | Task branch task/docs-plan-budget-category-filter-dynamic-valuation-cr143, branch documentation. | Old: Budget category filter and dynamic asset valuation not recorded in repository roadmap. New: P20-Z (Planned, Phase P20 under Rule 4) and P29-U-R1 (Planned, Phase P29 under Rule 2) recorded with placement rationale, branch targets, and open product questions. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, open-items; related documentation lifecycle; reason: recording feature requests as planned work in documentation is ongoing documentation lifecycle work. | current request |
| CR-144 | P20 | P20-Z | current | 2026-11-23 | Implement dynamic Budget category filter (P20-Z) alongside existing Budget sorting option, defaulting to "All", listing available categories (Income, Expenses, Needs, Wants, Debt, Assets, Liabilities), and auto-including newly created categories following Transactions behavior. | Done; categoryOptions dynamically computes base categories and active custom section names, ChipRow category chips rendered in budget-filter-panel alongside SortChip, categoryOverride state with routeCategory fallback, and matchesCategory helper filters sortedSections into displayedSections with EmptyState when no sections match. Regression tests in BudgetCategoryFilter.test.tsx pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O78 added in Not run status. | Task branch task/P20-Z-budget-category-filter, phase branch phase/20-budget. | Old: Budget screen filter panel only displayed SortChip with no category filter options. New: Budget screen filter panel includes dynamic category filter chips alongside SortChip defaulting to "All", supporting Income, Expenses, Needs, Wants, Debt, Assets, Liabilities, and active custom sections, filtering visible Budget sections and showing empty state if no sections match. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and budget.tsx; related P20, P20-X, P17-C; reason: dynamic category filtering extends existing Phase P20 Budget feature area. | current request |
| CR-145 | P20 | P20-Z-R1 | current | 2026-11-23 | Remove unwanted dot on Budget filter icon to match Assets, Liabilities, and Transactions filter icon appearance, and preserve owner margin changes. | Done; updated filterActive in app/(tabs)/budget.tsx to selectedCategory !== 'All' so that filter icon is clean without dot on default view (matching other screens) and activates dot indicator only when an active category filter is selected; preserved owner edit removing marginHorizontal from styles.filterPanel. Regression tests in BudgetCategoryFilter.test.tsx pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O79 added in Not run status. | Task branch task/P20-Z-R1-budget-filter-icon-indicator, phase branch phase/20-budget. | Old: filterActive in Budget included sorting condition, causing filter icon to permanently show indicator dot on default view; filterPanel had marginHorizontal. New: filterActive depends only on selectedCategory !== 'All' so filter icon has no dot on default view, matching Assets, Liabilities, and Transactions; owner margin change in filterPanel preserved. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and budget.tsx; related P20-Z; reason: revise Budget category filter active indicator logic and preserve owner margin changes. | current request |
| CR-146 | P17 | P17-C-R1 | current | 2026-11-23 | Implement persistent sorting preferences across every WealthWise screen or section that offers sorting (Transactions, Assets, Liabilities, Budget, Goals, Investment Entries, Link Missing). In-memory caching and serialized write queue in metaStore ensure atomic sort updates and eliminate mount delay; metaStore subscription keeps mounted components synchronized. Physical-device check O80 added (Not run). Physical-device checks O78 and O79 verified and recorded as Pass based on owner report. All ordered gates run: Gates 1, 2, 3, 5, 6 exit 0; Gate 4 exits 1 (expo-sqlite ~57.0.6 advisory). | Done; metaStore enhanced with in-memory cachedMeta and writeQueue serialization to prevent race conditions during rapid or concurrent sort updates and eliminate initial hook mount lag; useSort subscribes to metaStore changes so all mounted sort consumers update in real time; independent preferences for each list survive screen switches and app restarts; filter states remain completely separate and unaffected. Comprehensive regression tests in useSort.test.tsx pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O80 added in Not run status; O78 and O79 marked Pass based on owner report. | Task branch task/P17-C-R1-persistent-sorting-preferences, phase branch phase/17-cash-flow-budgets-sorting. | Old: metaStore had no in-memory cache or write serialization, causing concurrent sort updates to race and overwrite each other, and useSort did not subscribe to metaStore updates; sort preferences across multiple screens could drop or revert on rapid switches or app restarts. New: metaStore caches metadata in memory and serializes writes, guaranteeing atomic sort updates without mount delay; useSort subscribes to metaStore for real-time propagation across screens; sort preferences persist independently across all screens without affecting filter states. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and sorting code; related P17-C; reason: revise completed sorting preferences in Phase P17 to ensure reliable persistence across all screens and sections. | current request |
| CR-147 | P29 | P29-U-R1 | current | 2026-11-23 | Mark physical-device check O80 as Pass based on owner report; implement P29-U-R1 dynamic asset valuation inputs and calculations depending on selected valuation type (manual value input, interest-based rate calculation, unit-based purchase amount/unit price/units purchased calculation, balance-based current balance) across recurring and one-time assets; type-specific valuation update route; unitCount support on holding valuation; regression tests pass; physical-device check O81 added (Not run). | Done; form inputs dynamically adjust based on valuation method in investment-form.tsx (ManualFields and PlanFields); 2-way auto-calculation implemented between units, unit price, and purchase amount; holding-valuation-form.tsx displays type-specific titles, labels, live total value calculation, and save actions; schema v24 preserved; regression tests in valuation.test.ts, schemas.test.ts, HoldingValuationDynamic.test.tsx, and RouteRenderSmoke.test.tsx pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O81 added in Not run status; O80 marked Pass based on owner report. | Task branch task/P29-U-R1-dynamic-asset-valuation, phase branch phase/29-income-recurrence. | Old: valuation forms had static inputs regardless of method; manual value was required even for unit-based, interest-based, or balance-based holdings; unit-based holdings had no 2-way calculation between units, unit price, and purchase amount; holding-valuation-form had generic 'Update holding value'. New: forms render type-dependent inputs for manual, accrual, unitsPrice, and balance; unit-based 2-way auto-calculation derives units or total value; holding-valuation-form adjusts titles and inputs to unit price, accrual, or balance reconciliation; schema v24 preserved. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, valuation.ts, holding-valuation-form.tsx, investment-form.tsx; related P29-U, P8, P29-S; reason: adjusts valuation method mechanics and dynamic form inputs established by completed subtask P29-U. | current request |
| CR-159 | documentation | P43-E | current | 2026-11-24 | Execute GitHub issue history backfill and ongoing issue-tracking setup approved under P43-E / CR-150 across 261 Model A items (210 subtasks + 51 standalone CRs); establish taxonomy (7 milestones, 54 labels); backfill 232 retrospective closed issues and 29 open roadmap issues with verified ledger commits, PRs, merge SHAs, and original dates; document ongoing tracking policy in AGENTS.md, rules.md, README.md, and working-style.md. | Done; 7 milestones (v1.0.0 through v1.3.1, Planned) and 54 labels created; 261 issues generated under 7-stage rate-limited schedule; 232 completed issues closed with retrospective summaries; 29 planned issues left open; ongoing tracking rules established in AGENTS.md, rules.md, working-style.md, README.md; progressLedger.test.ts extended; all six ordered gates run. | Task branch task/docs-github-issue-backfill-cr159, branch documentation. | Old: Zero GitHub issues created; historical issue inventory and plan established in CR-150 without execution; ongoing issue tracking rules absent from repository instructions. New: Full historical backfill executed; 261 GitHub issues created with exact 1:1 traceability under Model A; retrospective closures verified; ongoing tracking rules documented in AGENTS.md and memory. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150; reason: standalone repository-process and documentation lifecycle execution. | current request |
| CR-160 | documentation | P43-E | current | 2026-11-24 | Reconcile GitHub issue backfill across all 261 Model A items (210 subtasks + 51 standalone CRs) with semantic standard labels (enhancement, bug, documentation), enrich open planned issues with explicit scope and dependencies, and establish test-enforced issue-tracking workflow in AGENTS.md, rules.md, working-style.md, and progressLedger.test.ts. | Done; all 261 issues reconciled: 29 open planned roadmap issues enriched with detailed bodies, dependencies, and semantic labels; 232 closed retrospective issues enriched with standard labels; verified mapping recorded in /tmp/wealthwise-issue-mapping-verified.json; ongoing issue-tracking workflow test-enforced via progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-github-issue-backfill-cr160, branch documentation. | Old: GitHub issue backfill items lacked semantic standard labels (enhancement, bug, documentation); open planned issues lacked detailed dependencies in bodies; ongoing issue tracking was documented without test enforcement. New: Full taxonomy reconciliation across all 261 issues completed without duplicates or timestamp backdating; semantic standard labels assigned; open issues enriched with scope and dependencies; progressLedger.test.ts asserts issue tracking workflow rules. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150, CR-159; reason: standalone repository-process and documentation lifecycle execution. | current request |
| CR-161 | documentation | P43-E | current | 2026-11-24 | Reconcile PR #39 (DO_NOT_MERGE-Refactor code structure for improved readability and maintainability), PR and issue label policies, release records, and future tracking workflow; audit all 273 PRs and 261 issues; apply labels phase:p01, type:chore, status:superseded, wontfix and verified body to PR #39; attribute commit b779c21 to v1.1.1 ancestry via P28-E-R3 (0697d88); test-enforce issue and PR tracking invariants in progressLedger.test.ts; all six ordered gates run. | Done; PR #39 verified as Closed Unmerged with labels phase:p01, type:chore, status:superseded, wontfix and verified body; commit b779c21 confirmed ancestor of v1.1.1, v1.2.0, v1.3.0 via P28-E-R3; full audit of 273 PRs and 261 issues compiled in /tmp/wealthwise-pr-issue-audit-report.md and /tmp/wealthwise-pr-label-audit.json; PR labeling and tracking invariants formalized in AGENTS.md, rules.md, working-style.md, release-history.md, and progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-pr39-and-label-reconciliation-cr161, branch documentation. | Old: PR #39 was recorded as closed unmerged in text notes without formal PR labels or verified body; PRs lacked a documented labeling taxonomy and test-enforced tracking rule; release ancestry connection of b779c21 to v1.1.1 was omitted from release-history.md. New: PR #39 is truthfully verified as Closed Unmerged with formal labels, verified body, and release attribution; 273 PRs audited with complete label mapping in /tmp; issue and PR tracking invariants test-enforced in progressLedger.test.ts. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150, CR-159, CR-160; reason: standalone repository-process and documentation lifecycle execution. | current request |
| CR-162 | documentation | — | current | 2026-11-24 | Record owner-reported physical-device checks O81 and O82 as Pass in device-test-checklist.md, PROGRESS.md, status.md, and open-items.md. | Done; O81 and O82 recorded as Pass with confirmed owner-reported physical-device verification (realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-24); pending device checks resolved; tests pass; all six ordered gates run. | Task branch task/docs-record-device-checks-o81-o82, branch documentation. | Old: O81 and O82 were Not run in device-test-checklist.md; open-items.md had pending physical-device verification actions for P29-U-R1 and P20-L-R1. New: O81 and O82 recorded as Pass with confirmed metadata; pending device check open items resolved. Placement: rule 1; searched dashboard, register, memory, device-test-checklist; related documentation lifecycle; reason: recording owner-reported physical-device test results in the device test checklist is standalone documentation lifecycle work. | current request |
| CR-163 | documentation | — | current | 2026-11-25 | Reconcile historical GitHub PR labels across all 277 PRs using fresh remote snapshot, verify DEC-P39-DEPS-01 advisory and Expo-compatible resolution for owner decision, and verify future tracking rules. | Done (DEC-P39-DEPS-01 remains Open pending owner confirmation); exported fresh snapshot at 2026-11-25T10:01:47+05:30 with terminal capture; applied missing taxonomy labels to 276 PRs (ok=276, fail=0; PR #39 already complete; 277/277 PRs verified labeled, 0 unlabeled); verified decode-uri-component@0.2.2 (GHSA-vcc3-ghjq-m6fr, GHSA-qr28-fpjm-wq7f) via expo-router@57.0.31 requires SemVer-major expo-router@58.0.32 (SDK 58); verified future tracking rules have no gaps; all six ordered gates run. | Task branch task/docs-pr-label-reconciliation-p39-decision, branch documentation. | Old: 274 PRs lacked labels and PRs #538/#539 lacked status:done; CR-161 audit JSON mapped 21 PRs to non-existent phase:p28; DEC-P39-DEPS-01 awaited verification of Expo SDK 57 compatibility. New: 277/277 PRs labeled accurately (21 phase:p28 entries mapped to lifecycle:qa-and-release); DEC-P39-DEPS-01 verified and presented for owner decision without upgrading dependencies. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and remote snapshot; related CR-161, P39-E, DEC-P39-DEPS-01; reason: standalone repository-process and documentation lifecycle work. | current request |
| CR-164 | documentation | — | current | 2026-11-25 | Resolve owner decision DEC-P39-DEPS-01 per explicit owner approval: accept documented decode-uri-component risk until the next planned Expo SDK upgrade without modifying dependencies or runtime behavior. | Done; recorded DEC-P39-DEPS-01 as resolved by owner approval in PROGRESS.md, decisions.md, status.md, and open-items.md; verified advisory path (expo-router@57.0.31 -> query-string@7.1.3 -> decode-uri-component@0.2.2), Expo SDK 57 constraint, offline mitigation, non-fixed status, and next-SDK-upgrade re-evaluation condition; regression test added in progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-resolve-dec-p39-deps-01, branch documentation. | Old: DEC-P39-DEPS-01 remained Open pending explicit owner confirmation. New: DEC-P39-DEPS-01 resolved by owner approval to accept the decode-uri-component@0.2.2 ReDoS risk until the next planned Expo SDK upgrade, with re-evaluation scheduled at that upgrade. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, decisions.md, work-placement.md, package.json, and offlineRuntime.test.ts; related P39-E, CR-163, DEC-P39-DEPS-01; reason: recording an owner-approved dependency risk-acceptance decision and follow-up condition is standalone documentation lifecycle work. | current request |
| CR-165 | documentation | — | current | 2026-11-25 | Organize WealthWise-specific /tmp artifacts under /tmp/wealthwise/ and relocate export-remote-snapshot.sh into scripts/ with updated documentation and regression assertions. | Done; organized 312 WealthWise /tmp artifacts under /tmp/wealthwise/ (remote-snapshot: 177, reports: 59, logs: 74, build-artifacts: 2; 0 conflicts; unrelated files unmoved); relocated ~/export-remote-snapshot.sh to scripts/export-remote-snapshot.sh (verified WealthWise-specific, zero secrets/tokens); updated output path and standing references in AGENTS.md, docs/memory/README.md, and docs/memory/rules.md; preserved historical ledger paths with current-path note; updated branchingDocs.test.ts and progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-organize-wealthwise-tmp-artifacts, branch documentation. | Old: WealthWise temporary files were scattered in /tmp and /tmp/wealthwise-remote-snapshot/, and export-remote-snapshot.sh lived outside the repo at ~/. New: 312 WealthWise artifacts organized under /tmp/wealthwise/, exporter tracked at scripts/export-remote-snapshot.sh targeting /tmp/wealthwise/remote-snapshot/, and standing docs/tests updated while preserving historical ledger paths. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, scripts/, and /tmp; related R8, CR-163; reason: organizing repository temporary artifacts and tracking the project-specific snapshot exporter is standalone documentation and repository-process lifecycle work. | current request |
| CR-166 | phase/39-release-audit-and-hardening | P39-H-R1 | current | 2026-11-25 | Fix P39 audit findings: SQLite fallback warning, 5 explicit modal route registrations in _layout.tsx, deep-link parameter fallback handling, __DEV__-only stressData bundling, and Expo SDK 57 patch alignment for 8 packages. | Done; wired SQLite fallback warning via sqliteFallback.ts and StorageErrorBanner.tsx; registered 5 modal routes in _layout.tsx; added routeParams.ts across form/reminder/due routes; guarded stressData.ts behind __DEV__ lazy require in createAppStore.ts preserving Demo Mode; aligned 8 SDK 57 patch packages keeping DEC-P39-DEPS-01 accepted; added P39AuditRemediations.test.tsx and device checks O83–O84 (Not run); verified production bundles exclude stressData.ts; all six ordered gates run. | Task branch task/P39-H-R1-audit-remediations, branch phase/39-release-audit-and-hardening. | Old: onSQLiteFailure was undefined in stateStorage.native.ts; 5 modal forms lacked Stack.Screen declarations; cold deep-link empty states used router.back(); createAppStore.ts statically imported stressData.ts; 8 SDK 57 packages were 1-2 patch versions behind. New: fallback warning displayed without implying data loss; 5 modal routes registered; cold deep-link fallback navigates safely; stressData excluded from production Hermes bundles; 8 SDK 57 packages patch-aligned. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-A–H, stateStorage.native.ts, StorageErrorBanner.tsx, _layout.tsx, createAppStore.ts, package.json; related P39-A, P39-B, P39-D, P39-E, P39-H, DEC-P39-DEPS-01; reason: implements remediations for completed P39 audit findings under P39-H. | current request |
| CR-167 | documentation | — | current | 2026-11-25 | Refresh pending remote snapshot, update standing rules for conditional remote-snapshot refreshes and mandatory GitHub issue creation/closure, and backfill missing Model A GitHub issues (#548–#555; #556 for CR-167). | Done; refreshed snapshot at 2026-11-25T12:28:13+05:30 via scripts/export-remote-snapshot.sh; updated AGENTS.md, docs/memory/rules.md, docs/memory/README.md, and docs/memory/working-style.md; created and closed missing Model A issues #548–#555 (CR-159–CR-165, P39-H-R1/CR-166) with verified commits/PRs/gates and opened #556 for CR-167; added regression test in progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-snapshot-and-issue-tracking-rules, branch documentation. | Old: remote snapshot was stale after PRs #546–#547; rules only stated refreshing after manual merges and did not explicitly require creating/closing missing issues for completed work; CR-159–CR-166 lacked GitHub issues. New: snapshot refreshed; rules require conditional remote-snapshot refresh and immediate GitHub issue creation/closure for any unissued approved work; issues #548–#556 created. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, rules.md, README.md, working-style.md, and gh issues; related R8, CR-159, CR-160, CR-165, CR-166; reason: updating repository-process rules and reconciling Model A GitHub issues is standalone documentation lifecycle work. | current request |
| CR-168 | documentation | — | current | 2026-11-25 | Record owner-reported physical-device checks O83 and O84 as Pass in device-test-checklist.md, PROGRESS.md, status.md, and open-items.md (issue #559). | Done; O83 and O84 recorded as Pass with confirmed owner-reported physical-device metadata (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-25); replaced Not run assertions for O83/O84 in progressLedger.test.ts with Pass; all six ordered gates run. | Task branch task/docs-record-device-checks-o83-o84, branch documentation. | Old: O83 and O84 were Not run in device-test-checklist.md; progressLedger.test.ts asserted Not run for O83 and O84. New: O83 and O84 recorded as Pass with owner-confirmed metadata; progressLedger.test.ts updated to assert Pass for O83 and O84. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-H-R1, CR-166, #559; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | current request |
| CR-169 | phase/39-release-audit-and-hardening | P39-E-R1 | current | 2026-11-25 | Upgrade WealthWise to Expo SDK 58 (`expo@^58.0.26`, `react-native@0.88.1`, `expo-router@~58.0.32`), verify and resolve `DEC-P39-DEPS-01` (`decode-uri-component@0.2.2`), and pass all six ordered repository gates (issue #562). | Done; upgraded Expo and 31 compatible packages to SDK 58 plus `@react-native/jest-preset` and `react-test-renderer@19.3.0`; verified `npm ls decode-uri-component` is empty and `npm audit` has 0 critical/0 high advisories (27 moderate dev/CLI advisories remain); updated `app/(tabs)/_layout.tsx`, `ef-allocation-form.tsx`, `onboarding.tsx`, `profile-form.tsx`, `jest.config.js`, `app.json`, `TabsLayout.test.tsx`, and `progressLedger.test.ts`; added device check `O85` (`Not run`); all six ordered gates run. | Task branch task/P39-E-R1-expo-sdk-58-upgrade, branch phase/39-release-audit-and-hardening. | Old: app was on Expo SDK 57 (`expo@~57.0.34`, `expo-router@~57.0.32`, `react-native@0.86.3`) with `decode-uri-component@0.2.2` ReDoS advisories accepted under `DEC-P39-DEPS-01`. New: app is on Expo SDK 58 (`expo@^58.0.26`, `expo-router@~58.0.32`, `react-native@0.88.1`), `decode-uri-component` is eliminated (`DEC-P39-DEPS-01` resolved), and all six gates pass. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-E, DEC-P39-DEPS-01, package.json, app.json, jest.config.js, app/(tabs)/_layout.tsx; related P39-E, DEC-P39-DEPS-01, CR-164; reason: executes the planned Expo SDK 58 major upgrade and resolves DEC-P39-DEPS-01 from completed P39-E. | current request |
| CR-170 | documentation | — | current | 2026-11-25 | Record owner-reported physical-device check O85 as Pass in device-test-checklist.md, PROGRESS.md, status.md, and open-items.md (issue #565). | Done; O85 recorded as Pass with confirmed owner-reported physical-device metadata (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-25); updated progressLedger.test.ts O85 assertion from Not run to Pass and added CR-170 test; all six ordered gates run. | Task branch task/docs-record-device-check-o85, branch documentation. | Old: O85 was Not run in device-test-checklist.md; progressLedger.test.ts asserted Not run for O85. New: O85 recorded as Pass with owner-confirmed metadata; progressLedger.test.ts updated to assert Pass for O85 and asserts CR-170 ledger entries. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-E-R1, CR-169, #562; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | current request |
| CR-171 | documentation | — | current | 2026-11-25 | Complete CHANGELOG.md for all published releases (v1.0.0–v1.3.0) and add mandatory per-release changelog update rule across AGENTS.md and release workflow docs (issue #566). | Done; backfilled CHANGELOG.md with verified entries for v1.0.0 (2026-11-07), v1.1.0 (2026-11-08), v1.1.1 (2026-11-09), v1.2.0 (2026-11-11), and v1.3.0 (2026-11-22) plus Unreleased; wired mandatory CHANGELOG.md update rule into AGENTS.md, docs/releases/README.md, docs/releases/TEMPLATE.md, and docs/releases/RELEASE_PROMPT.md; verified About screen changelog link and AboutScreen.test.tsx; added CR-171 regression assertions in progressLedger.test.ts; all six ordered gates run. | Task branch task/docs-changelog-completion, branch documentation. | Old: CHANGELOG.md only had `[1.1.0] - TBD` (incomplete) and `[1.0.0] - 2026-11-07`, missing v1.1.1, v1.2.0, and v1.3.0, and release docs lacked an explicit CHANGELOG.md update rule. New: CHANGELOG.md covers all five published releases with verified dates and summaries, and AGENTS.md plus release docs enforce updating CHANGELOG.md for every release. Placement: rule 1; searched dashboard, register, memory, CHANGELOG.md, AGENTS.md, docs/releases/, app/about.tsx, and AboutScreen.test.tsx; related documentation lifecycle, P28-F-R7, #566; reason: completing historical changelog entries and adding a release-process rule is standalone documentation lifecycle work. | current request |
| CR-172 | phase/40-agent-context-hygiene | P40-A | current | 2026-11-25 | Measure docs/PROGRESS.md, docs/memory/*, and AGENTS.md sizes, parsing-test coverage, and per-prompt read cost (P40-A, issue #461). | Done; measured 17,359 lines / 1,751,606 bytes / ~436,456 estimated tokens (chars/4) across AGENTS.md, docs/PROGRESS.md (13,495 lines, 1,443,604 bytes, ~359,592 tokens; 78.8% in sections 10, 6, 4, 11), and docs/memory/* (3,545 lines, 286,061 bytes, ~71,388 tokens); inventoried 5 doc-parsing Jest suites (96 it() blocks, 1,312 assertions); wrote detailed report to /tmp/wealthwise/reports/p40-a-doc-size-audit.md; updated ledger, memory, branch index, and progressLedger.test.ts; all six ordered gates run. | Task branch task/P40-A-doc-size-audit, branch phase/40-agent-context-hygiene. | Old: P40-A was Planned (0/2 in P40) with no measured baseline. New: P40-A is Done (1/2 in P40) with verified size/token/test measurements and P40-B unblocked. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, AGENTS.md, and doc tests; related P40-A, P40-B, CR-113, #461; reason: executes already-approved P40-A measurement work in P40. | current request |
| CR-173 | phase/40-agent-context-hygiene | P40-B | current | 2026-11-25 | Archive completed-phase narrative from docs/PROGRESS.md into linked archive files under docs/memory/archive/ and update ledger tests without weakening assertions (P40-B, issue #462). | Done; moved completed-phase narrative from sections 4, 5, 6, 7, 10, and 11 into 6 linked archive files under docs/memory/archive/ indexed by docs/memory/archive/README.md; reduced docs/PROGRESS.md from 13,495 lines (1,443,604 bytes) to ~2,035 lines (~365 KB); added failing P40-B archive test first, then added loadLedgerWithArchives() in progressLedger.test.ts preserving all 82 ledger tests; updated memory README, status, and open-items; all six ordered gates run. | Task branch task/P40-B-archive-completed-narrative, branch phase/40-agent-context-hygiene. | Old: docs/PROGRESS.md held 1.44 MB of completed-phase narrative; P40-B was Planned (1/2 in P40). New: completed-phase narrative is archived in docs/memory/archive/*, docs/PROGRESS.md is ~365 KB, and P40 is Done (2/2). Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and progressLedger.test.ts; related P40-A, CR-113, CR-172, #462; reason: executes already-approved P40-B archival work in P40. | current request |
| CR-174 | qa-and-release | P28-F-R8 | current | 2026-11-25 | Prepare WealthWise v1.4.0 minor release candidate after owner approval of v1.4.0 draft and 13 supplied screenshots (P28-F-R8, issue #574). | In progress; bumped app.json, package.json, and package-lock.json to 1.4.0; moved approved v1.4.0.md to docs/releases/published/v1.4.0.md with 13 screenshots under docs/releases/screenshots/v1.4.0/; updated CHANGELOG.md, README.md, v1.3.0.md Download block, device-test-checklist.md (moved O77-O85 into v1.4.0 device checks), releaseDownloadDocs.test.ts, and progressLedger.test.ts; all six ordered gates run. | Task branch task/P28-F-R8-prepare-v1.4.0-release, branch qa-and-release (historical branch name: `phase/28-qa-and-release`). | Old: app version was 1.3.0, O77-O85 were under Next release device checks, and README/CHANGELOG/release notes reflected v1.3.0. New: v1.4.0 candidate prepared with 13 screenshots, v1.4.0 device checks section, and aligned release/test docs. Placement: rule 1; searched dashboard, register, memory, release-history.md, device-test-checklist.md, README.md, and releaseDownloadDocs.test.ts; related qa-and-release lifecycle, P28-F-R7, #574; reason: ongoing release engineering under qa-and-release. | current request |
| CR-158 | phase/20-budget | P20-L-R1 | current | 2026-11-24 | Implement consistent filter panel across WealthWise screens with header filter icon (Goals, Assets, Liabilities, Transactions, Budget); add Goals filtering controls (All, In progress, Achieved, dynamic target year chips) alongside SortChip; audit all 5 screens and preserve independent sorting and filtering; remove header filter icon dot indicator everywhere. | Done; Goals filter panel provides All, In progress, Achieved status chips and dynamic target year chips alongside SortChip with empty state handling; dot indicator removed from header filter icon across all 5 screens; filter and sort states operate independently; regression tests in ConsistentFilterPanels.test.tsx pass (10/10); RouteRenderSmoke.test.tsx and BudgetCategoryFilter.test.tsx assertions updated to expect dot indicator absence; physical-device check O82 added in Not run status. All six ordered gates run. | Task branch task/P20-L-R1-consistent-filter-panels, phase branch phase/20-budget. | Old: Goals screen only rendered SortChip in its filter panel without filter controls; header filter icon showed active dot indicator on Transactions, Assets, Liabilities, and Budget when filters or sorting were active; RouteRenderSmoke.test.tsx and BudgetCategoryFilter.test.tsx expected dot indicator presence. New: Goals screen offers status (All, In progress, Achieved) and dynamic target year filter chips alongside SortChip; header filter icon dot indicator is removed everywhere; sorting and filter preferences remain independent across screens; tests verify dot absence across all 5 screens. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched files; related P20-L, P20-Z, P20-Z-R1, P17-C-R1; reason: revision of completed subtask P20-L. | current request |
| CR-157 | phase/39-release-audit-and-hardening | P39-H | current | 2026-11-24 | Remediation plan grouping findings into the smallest independent batches, with containment before cleanup, required owner approvals and rollback (P39-H). | Done; synthesized findings from P39-A through P39-G into 3 prioritized independent remediation batches; defined rollback plans and owner decisions; pure planning scope; report in /tmp/wealthwise-p39-h-remediation-plan.md; all six ordered gates run. | Task branch task/P39-H-remediation-plan, branch phase/39-release-audit-and-hardening. | Old: P39-H planned in P39 with dependencies. New: P39-H completed; remediation plan report in /tmp/wealthwise-p39-h-remediation-plan.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–G; reason: release audit remediation plan. | current request |
| CR-156 | phase/39-release-audit-and-hardening | P39-G | current | 2026-11-24 | Report-first clean-install walkthrough of onboarding, lock, reminders prompt, first transaction, and interrupted/denied paths (P39-G). | Done; verified boot sequence, onboarding exit handling, reminder prompt bottom sheet, transaction creation, and permission denial paths; findings feed P37-A; report in /tmp/wealthwise-p39-g-clean-install-walkthrough.md; all six ordered gates run. | Task branch task/P39-G-clean-install-walkthrough, branch phase/39-release-audit-and-hardening. | Old: P39-G planned in P39 with dependencies. New: P39-G completed; clean-install walkthrough report in /tmp/wealthwise-p39-g-clean-install-walkthrough.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H, P37; reason: clean-install and first-launch walkthrough. | current request |
| CR-155 | phase/39-release-audit-and-hardening | P39-F | current | 2026-11-24 | Report-first debt/skipped-test audit of TODO/FIXME markers, the one skipped test and opt-in stress benchmark, with a disposition per item (P39-F). | Done; confirmed zero TODO/FIXME markers in codebase; analyzed single skipped test in stressData.test.ts#L93 and confirmed documented architectural exception (opt-in via WEALTHWISE_STRESS_BENCHMARK=1); verified zero weakened assertions; report in /tmp/wealthwise-p39-f-test-debt-audit.md; all six ordered gates run. | Task branch task/P39-F-test-debt-audit, branch phase/39-release-audit-and-hardening. | Old: P39-F planned in P39 with dependencies. New: P39-F completed; test debt and skipped test audit report in /tmp/wealthwise-p39-f-test-debt-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: test debt, TODO markers, and skipped test audit. | current request |
| CR-154 | phase/39-release-audit-and-hardening | P39-E | current | 2026-11-24 | Report-first dependency risk triage using current npm audit; separate production-reachable dependencies from tooling, record accepted risks and owner decisions; no force fix or install-script approval (P39-E). | Done; triaged 1,124 dependencies with npm audit (11 advisories: 0 critical, 3 high, 8 moderate); identified production-reachable decode-uri-component ReDoS in expo-router/query-string requiring owner decision DEC-P39-DEPS-01; verified zero force fixes and zero install-script approvals; report in /tmp/wealthwise-p39-e-dependency-risk-audit.md; all six ordered gates run. | Task branch task/P39-E-dependency-risk-audit, branch phase/39-release-audit-and-hardening. | Old: P39-E planned in P39 with dependencies. New: P39-E completed; dependency risk audit report in /tmp/wealthwise-p39-e-dependency-risk-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: dependency risk and CVE review. | current request |
| CR-153 | phase/39-release-audit-and-hardening | P39-D | current | 2026-11-24 | Report-first silent-failure and recovery-state audit extending P30 across storage, backup import/export, notification scheduling and SQLite fallback visibility (P39-D). | Done; verified storage fallback paths, backup import/export corrupted data recovery, and notification scheduling; identified P2 finding that SQLite fallback in stateStorage.native.ts leaves onSQLiteFailure undefined (silent console log without user-facing banner); detailed report in /tmp/wealthwise-p39-d-recovery-audit.md; all six ordered gates run. | Task branch task/P39-D-recovery-audit, branch phase/39-release-audit-and-hardening. | Old: P39-D planned in P39 with dependencies. New: P39-D completed; silent failures and recovery audit report in /tmp/wealthwise-p39-d-recovery-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: silent failures and recovery paths audit. | current request |
| CR-152 | phase/39-release-audit-and-hardening | P39-B | current | 2026-11-24 | Security, network boundary, and debug residue audit (P39-B); verify secrets, EAS config, and bundle reachability; add regression test coverage for no-network boundary (EventSource, sendBeacon). | Done; verified zero secrets tracked; zero debugger statements; dev menu unreachable in production; Hermes bytecode bundles demo/stress fixtures (P2 finding); regression tests in offlineRuntime.test.ts extended to forbid EventSource and sendBeacon; report in /tmp/wealthwise-p39-b-security-debug-audit.md; all six ordered gates run. | Task branch task/P39-B-security-debug-audit, branch phase/39-release-audit-and-hardening. | Old: P39-B planned in P39 with dependencies. New: P39-B completed; offline runtime boundary extended to forbid EventSource and sendBeacon; debug residue audit report in /tmp/wealthwise-p39-b-security-debug-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: security, network boundary, and debug residue audit. | current request |
| CR-151 | phase/39-release-audit-and-hardening | P39-A | current | 2026-11-24 | Master read-only codebase audit across dead code, secrets, app lock, notification routes, deep links, silent failures, performance, dependencies, debug residue, TODO debt, permissions, and first launch (P39-A). | Done; 12 findings with file/line evidence and P0–P3 severities recorded in /tmp/wealthwise-p39-a-master-audit.md; zero P0/P1 blockers; all six ordered gates run. | Task branch task/P39-A-master-audit, branch phase/39-release-audit-and-hardening. | Old: P39-A planned in P39 with dependencies. New: P39-A completed as read-only master audit; 12 findings categorized P0–P3; zero P0/P1 blockers; report in /tmp/wealthwise-p39-a-master-audit.md. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: master release audit and hardening. | current request |
| CR-150 | documentation | P43-E | current | 2026-11-24 | Complete P43-E GitHub issue inventory and execution planning as a documentation and repository-process task; inventory ledger work, deduplicate parts and change requests, assess labels, release milestones, API limits, and noise; prepare execution plan; no issues created/modified (creation requires separate task). | Done; verified inventory of 209 active dashboard parts (173 done, 36 planned) and 145 CRs (94 mapped, 51 standalone lifecycle); deduplicated strategy of 260 issues (224 closed retrospective, 36 open planned); taxonomy of phase, type, status labels and release milestones (v1.0.0 through v1.4.0); secondary rate limit and noise mitigation with a 7-stage batch execution plan; zero issues created/modified (creation requires separate execution task); detailed report in /tmp/wealthwise-p43-e-issue-inventory-plan.md. Regression tests in progressLedger.test.ts pass. All six ordered gates run. | Task branch task/docs-p43-e-issue-inventory-plan, branch documentation. | Old: P43-E planned in P43 with dependencies and 'Evidence: not started'; issue inventory unverified. New: P43-E completed as documentation-only inventory and execution plan; verified counts established; 7-stage batching plan defined; report written to /tmp/wealthwise-p43-e-issue-inventory-plan.md. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-A–G; reason: repository-process issue inventory and execution planning setup exception. | current request |
| CR-149 | P31 | P31-A–D | current | 2026-11-24 | Complete P31 community and project health deliverables: community guidelines (P31-A), GitHub issue forms (P31-B), accessibility statement and audit checklist (P31-C), and privacy statement (P31-D) derived from verified P39-C trace. | Done; CODE_OF_CONDUCT.md created at root; .github/ISSUE_TEMPLATE/ upgraded to bug_report.yml, feature_request.yml, question.yml, config.yml with financial data warnings and legacy .md templates removed; docs/accessibility/accessibility-statement.md and audit-checklist.md added adhering to WCAG 2.1 AA; PRIVACY.md created at root reflecting verified P39-C facts (100% offline-first, local-only SQLite/AsyncStorage, zero network calls, zero telemetry, local notifications, local biometrics, AES-256-GCM backups, and unencrypted-at-rest boundary). Regression tests in progressLedger.test.ts pass. All six ordered gates run. | Task branch task/P31-community-and-project-health, phase branch phase/31-community-and-project-health. | Old: P31 planned across P31-A..D; issue templates were legacy markdown; accessibility statement, audit checklist, and privacy statement absent. New: P31-A..D completed as documentation-only repository deliverables; CODE_OF_CONDUCT.md and PRIVACY.md at root; issue forms upgraded; accessibility docs created; verified facts from P39-C trace used without unsupported claims. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and repository docs; related P31, P39-C; reason: project health, community, accessibility, and privacy documentation deliverables. | current request |
| CR-148 | P39 | P39-C | current | 2026-11-24 | Report-first permissions and privacy trace (P39-C) from declaration to request to use for notifications, biometrics, file/share/document picker, SQLite, data-at-rest encryption boundary, allowBackup=false, and offline runtime boundary; detailed report in /tmp/wealthwise-p39-c-permissions-privacy-trace.md. | Done; permissions and privacy trace completed across app.json, app code, and dependencies; verified zero network calls (fetch/XHR/WebSocket), zero analytics/telemetry, allowBackup=false in resolved config, local-only notifications, biometrics via OS Secure Enclave, SAF/scoped storage sharing, unencrypted at rest SQLite/AsyncStorage limitation, and strong AES-256-GCM backup encryption; detailed report written to /tmp/wealthwise-p39-c-permissions-privacy-trace.md; all six ordered gates pass. | Task branch task/P39-C-permissions-privacy-trace, phase branch phase/39-release-audit-and-hardening. | Old: P39-C planned; permissions and privacy trace unexecuted. New: P39-C executed as report-first audit; findings summary table recorded; verified source facts feed P31-D privacy statement. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, app.json, permissions code; related P39, P31-D; reason: release audit and hardening permissions trace. | current request |
| CR-131 | P43 | P43-B | current | 2026-11-22 | Delete all non-release tags locally and on remote origin per explicit owner approval, enforce release-only tag policy in repository rules, and preserve only verified vX.Y.Z release tags. | Done; all 47 non-release and legacy phase tags deleted locally and on remote origin per explicit owner approval (P43-B); verified release tags v1.0.0, v1.1.0, v1.1.1, v1.2.0, v1.3.0 retained. Release-only tag rule added to AGENTS.md, rules.md, and PROGRESS.md. | Commits on task/P43-B-delete-non-release-tags, merged into phase/43-lifecycle-and-transaction-planning and develop via PRs. | Old: 47 non-release/phase tags present in repository; P43-B Planned. New: 47 non-release tags deleted, only vX.Y.Z release tags permitted in repository rules; P43-B Done. Reason: user request and explicit approval to delete non-release tags and enforce release-only tag policy. Placement: rule 1; searched dashboard, register, phase history, memory, git tags; related repository process and cleanup; reason: repository tag hygiene and standing tag policy enforcement. | current request |
| CR-132 | P20 | P20-Y-R1 | current | 2026-11-22 | Fix WealthWise bug where renaming a budget item or category in one month did not update the name shown by transactions linked to that item. Linked transactions now reflect the current budget item name wherever it appears, including existing transactions, while preserving amount, date, category, and budget link. Handles month-specific items and create, edit, display, persistence, migration, and backup-import paths. Added regression tests in budgetItemRenameTransactions.test.ts. All six gates pass with exit 0. | Done; editItem updates matching transactions and holding log entries upon renaming a budget item; budgetItemForTransaction resolves dynamic budget item name for display in transactions list; dues and investment note propagation aligned; regression tests pass; all six gates pass with exit 0. | Commits on task/P20-Y-R1-rename-budget-item-linked-transactions, merged into phase/20-budget and develop via PRs. | Old: renaming a budget item in one month left existing linked transactions displaying the old budget item name or generic deposit note in transactions list and actuals attribution. New: renaming a budget item updates transactions and holding entries linked to that item across the appropriate month/scope while preserving amount, date, category, and holding link; transactions list displays the updated budget item name; budgetLineActual attributes actuals to the updated budget item name. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/dues/transaction code; related P20-Y; reason: renaming a budget item or category in one month updates transactions linked to that item while preserving amount, date, category, and budget link. | current request |
| CR-133 | P20 | P20-Y-R2 | current | 2026-11-22 | Fix WealthWise bug where renaming a budget item does not reflect in transaction category item, remaining on old name. Update tx.category and tx.note for matching transactions across month/following scope for all budget items; heal legacy desynced transactions via reconcileBudgetItemTransactions on store rehydration and backup import; display linkedBudgetItem.name in TransactionsScreen categoryLabel. | Done; editItem, renameSection, and editBudgetIncome update matching transactions and categories across appropriate month/scope; reconcileBudgetItemTransactions reconciles older budget item names on hydration; TransactionsScreen displays current budget item name; regression tests pass; all six gates pass with exit 0. | Task branch task/P20-Y-R2-rename-budget-item-transaction-category, phase branch phase/20-budget. | Old: in P20-Y-R1, transaction updates were gated behind targetHoldingId, preventing expense/spend budget items from updating transactions on rename and leaving transaction category as the old name. New: editItem updates tx.category and tx.note across matching transactions for all budget items; renameSection and editBudgetIncome update matching transactions; reconcileBudgetItemTransactions heals legacy or imported desynced transactions on hydration; TransactionsScreen categoryLabel displays linkedBudgetItem?.name. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R1; reason: budget item rename updates transaction category and display for all budget items across month and following scopes. | current request |
| CR-134 | P20 | P20-Y-R3 | current | 2026-11-22 | Sync category item in budget with budget section/category item in transaction only, preserving transaction note even if identical to old name. | Done; editItem, renameSection, editBudgetIncome, and reconcileBudgetItemTransactions update transaction category only and preserve transaction note; regression tests pass; all six gates pass with exit 0. | Task branch task/P20-Y-R3-sync-category-preserve-note, phase branch phase/20-budget. | Old: P20-Y-R2 updated tx.note if it matched old item or section name. New: tx.category alone is updated; tx.note is preserved as user narrative. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Budget/transaction code; related P20-Y-R2; reason: budget item and section rename syncs transaction category only, preserving transaction note. | current request |
| CR-135 | documentation | — | current | 2026-11-22 | Add check O77 to device test checklist for P20-Y-R3 and establish standing repository rule requiring physical-device verification checks for all features, bug fixes, and revisions. | Done; check O77 added to device-test-checklist.md in Not run status; metadata confirmed (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-22); standing rule added across policy documents; progress ledger tests updated; all six gates pass with exit 0. | Task branch task/docs-checklist-rule-and-p20-check, branch documentation. | Old: no explicit standing requirement that every feature, fix, or revision must add a physical-device check to Next release device checks in the checklist; P20-Y-R3 check missing. New: check O77 added for P20-Y-R3 in Not run status; mandatory rule added across AGENTS.md, rules.md, device-test-checklist.md, and all policy docs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist, policy docs and touched files; related P20-Y-R3 and device checklist release gate; reason: standalone repository process rule and device checklist update for feature/bug-fix verification. | current request |
| CR-140 | documentation | — | current | 2026-11-23 | Record owner-reported physical-device validation Pass for check O77 verifying budget item/section rename with preserved transaction name/note. | Done; check O77 marked Pass in Next release device checks; tested and confirmed by sahilsheikh-dev on physical device realme Narzo 60 Pro 5g running Android 15 Vanilla Ice Cream. All six gates pass with exit 0. | Task branch task/docs-device-checks-pass-o77, branch documentation. | Old: O77 marked Not run in Next release device checks. New: O77 marked Pass with owner verification evidence recorded. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | current request |
| CR-136 | documentation | — | current | 2026-11-23 | Rearrange device test checklist to move published v1.3.0 checks O61-O76 into dedicated v1.3.0 section below previous releases, retain unreleased O77 under Next release, and establish standing published-release checks rule. | Done; v1.3.0 device checks section created below v1.2.0 in ascending order containing O61-O76; Next release device checks contains O77 for upcoming v1.3.1; rule added across policy documents requiring published release checks to move into their specific version section below previous releases; progress ledger tests updated; all six gates pass with exit 0. | Task branch task/docs-checklist-v130-publish-rearrange, branch documentation. | Old: checks O61-O76 verified for v1.3.0 remained under Next release device checks after v1.3.0 publication; no explicit rule requiring published checks to move into versioned section below prior releases. New: v1.3.0 device checks section added below v1.2.0 with O61-O76; Next release device checks retains O77; standing published-release checks rule enforced across policy docs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist, policy docs and touched files; related CR-135, P28-F-R7 and device checklist release gate; reason: standalone repository process rule and checklist rearrangement upon release publication. | current request |
> Earlier prompt and session log entries (CR-139 and earlier) are archived in [memory/archive/prompt-and-session-log.md](memory/archive/prompt-and-session-log.md).

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-140 | Record owner-reported physical-device validation Pass for O77 | Check O77 marked Pass in Next release device checks table after owner physical device validation on realme Narzo 60 Pro 5g (Android 15 Vanilla Ice Cream, tester sahilsheikh-dev, 2026-11-23); ledger and memory updated; all six gates pass with exit 0. | Commits on task/docs-device-checks-pass-o77, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | 2026-11-23 |
| CR-146 | Implement persistent sorting preferences across screens and sections | Done; in-memory cache and writeQueue serialization added to createMetaStore in src/data/metaStore.ts to ensure atomic sort preferences and eliminate mount delay; useSort subscribed to metaStore updates for real-time sync across mounted hooks; sort preferences persist independently per screen/section across navigation and app restarts; filter states remain completely separate and unaffected; physical-device check O80 added in Not run status; O78 and O79 marked Pass based on owner report. | Commits on task/P17-C-R1-persistent-sorting-preferences, merged into phase/17-cash-flow-budgets-sorting and develop via PRs. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and sorting code; related P17-C; reason: revise completed sorting preferences in Phase P17 to ensure reliable persistence across all screens and sections. | 2026-11-23 |
| CR-147 | Implement P29-U-R1 dynamic asset valuation forms and calculations, and record owner-reported O80 Pass | Done; valuation forms in investment-form.tsx and holding-valuation-form.tsx dynamically render type-dependent inputs for manual, accrual, unitsPrice, and balance; unit-based 2-way auto-calculation between units, unit price, and purchase amount; type-specific update route; schema v24 preserved; regression tests in valuation.test.ts, schemas.test.ts, HoldingValuationDynamic.test.tsx, and RouteRenderSmoke.test.tsx pass. Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed). Physical-device check O81 added in Not run status; O80 marked Pass based on owner report. | Commits on task/P29-U-R1-dynamic-asset-valuation, merged into phase/29-income-recurrence and develop via PRs. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, valuation.ts, holding-valuation-form.tsx, investment-form.tsx; related P29-U, P8, P29-S; reason: adjusts valuation method mechanics and dynamic form inputs established by completed subtask P29-U. | 2026-11-23 |
| CR-159 | Execute GitHub issue history backfill and ongoing issue-tracking setup approved under P43-E | Done; created 7 milestones (v1.0.0 through v1.3.1, Planned) and 54 taxonomy labels; executed 261 discrete issues under Model A (210 subtasks + 51 standalone CRs; 232 retrospective closed with verified commits, PRs, merge SHAs, and original dates, 29 open planned roadmap issues); rate-limited batch schedule executed without abuse blocks; established ongoing issue-tracking protocol in AGENTS.md, rules.md, working-style.md, and README.md. | Commits on task/docs-github-issue-backfill-cr159, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150; reason: standalone repository-process and documentation lifecycle execution. | 2026-11-24 |
| CR-160 | Reconcile GitHub issue backfill with semantic labels, dependencies, and test-enforced workflow | Done; reconciled all 261 discrete issues under Model A (210 subtasks + 51 standalone CRs); added standard semantic labels (`enhancement`, `bug`, `documentation`) across all 261 issues; enriched all 29 open planned issues with explicit scope, dependencies, and current state; verified zero duplicates and zero backdated timestamps; test-enforced ongoing issue-tracking workflow in progressLedger.test.ts. | Commits on task/docs-github-issue-backfill-cr160, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150, CR-159; reason: standalone repository-process and documentation lifecycle execution. | 2026-11-24 |
| CR-161 | Reconcile PR #39, PR and issue label policy, release records, and future tracking workflow | Done; verified PR #39 as truthfully Closed Unmerged with labels `phase:p01`, `type:chore`, `status:superseded`, `wontfix` and verified body; attributed commit `b779c21` to `v1.1.1` ancestry via P28-E-R3; audited all 273 PRs and 261 issues; generated audit report and label mapping in `/tmp/wealthwise-pr-issue-audit-report.md` and `/tmp/wealthwise-pr-label-audit.json`; updated `AGENTS.md`, `rules.md`, `working-style.md`, `release-history.md`, and test-enforced in `progressLedger.test.ts`. | Commits on task/docs-pr39-and-label-reconciliation-cr161, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-E, CR-150, CR-159, CR-160; reason: standalone repository-process and documentation lifecycle execution. | 2026-11-24 |
| CR-162 | Record physical-device checks O81 and O82 as Pass | Done; confirmed owner verification on realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, tester sahilsheikh-dev, 2026-11-24; updated device-test-checklist.md, PROGRESS.md, status.md, and open-items.md; tests pass; all six ordered gates run. | Commits on task/docs-record-device-checks-o81-o82, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, device-test-checklist; related documentation lifecycle; reason: recording owner-reported physical-device test results in the device test checklist is standalone documentation lifecycle work. | 2026-11-24 |
| CR-163 | Reconcile historical GitHub PR labels and review DEC-P39-DEPS-01 | Done (DEC-P39-DEPS-01 remains Open pending owner confirmation); exported fresh snapshot at `2026-11-25T10:01:47+05:30` with terminal capture; applied missing taxonomy labels across 276 PRs (`ok=276, fail=0`; PR #39 already complete; 277/277 PRs verified labeled, 0 unlabeled); verified `decode-uri-component@0.2.2` (`GHSA-vcc3-ghjq-m6fr`, `GHSA-qr28-fpjm-wq7f`) via `expo-router@57.0.31` requires SemVer-major `expo-router@58.0.32` (Expo SDK 58); verified future tracking rules; all six ordered gates run. | Commits on task/docs-pr-label-reconciliation-p39-decision, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and remote snapshot; related CR-161, P39-E, DEC-P39-DEPS-01; reason: standalone repository-process and documentation lifecycle work. | 2026-11-25 |
| CR-164 | Resolve DEC-P39-DEPS-01 by owner approval | Done; recorded owner approval accepting `decode-uri-component@0.2.2` ReDoS risk (`GHSA-vcc3-ghjq-m6fr`, `GHSA-qr28-fpjm-wq7f` via `expo-router@57.0.31` -> `query-string@7.1.3`) until next planned Expo SDK upgrade; vulnerability not fixed; mitigated by offline runtime; updated `PROGRESS.md`, `decisions.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; all six ordered gates run. | Commits on task/docs-resolve-dec-p39-deps-01, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, decisions.md, work-placement.md, package.json, and offlineRuntime.test.ts; related P39-E, CR-163, DEC-P39-DEPS-01; reason: recording an owner-approved dependency risk-acceptance decision and follow-up condition is standalone documentation lifecycle work. | 2026-11-25 |
| CR-165 | Organize `/tmp/wealthwise/` artifacts and relocate `scripts/export-remote-snapshot.sh` | Done; moved 312 WealthWise `/tmp` artifacts under `/tmp/wealthwise/` (`remote-snapshot/`: 177, `reports/`: 59, `logs/`: 74, `build-artifacts/`: 2; 0 conflicts; unrelated files unmoved); relocated `~/export-remote-snapshot.sh` to `scripts/export-remote-snapshot.sh` (zero secrets/tokens); updated exporter output path and `AGENTS.md`, `docs/memory/README.md`, `docs/memory/rules.md`, `branchingDocs.test.ts`, and `progressLedger.test.ts`; preserved historical ledger paths with current-path note; all six ordered gates run. | Commits on task/docs-organize-wealthwise-tmp-artifacts, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, scripts/, and /tmp; related R8, CR-163; reason: organizing repository temporary artifacts and tracking the project-specific snapshot exporter is standalone documentation and repository-process lifecycle work. | 2026-11-25 |
| CR-166 | Implement P39 audit remediations and SDK 57 patch alignment (`P39-H-R1`) | Done; wired SQLite fallback warning via `sqliteFallback.ts` and `StorageErrorBanner.tsx`; registered 5 modal routes in `app/_layout.tsx`; added `routeParams.ts` (`singleParam`, `closeRouteSafely`) across form/reminder/due routes; guarded `stressData.ts` behind `__DEV__` lazy `require` in `createAppStore.ts` preserving Demo Mode; aligned 8 SDK 57 patch packages keeping `DEC-P39-DEPS-01` accepted; added `P39AuditRemediations.test.tsx` and device checks `O83`–`O84` (`Not run`); verified production bundles exclude `stressData.ts`; all six ordered gates run. | Commits on task/P39-H-R1-audit-remediations, merged into phase/39-release-audit-and-hardening and develop via PRs. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-A–H, stateStorage.native.ts, StorageErrorBanner.tsx, _layout.tsx, createAppStore.ts, package.json; related P39-A, P39-B, P39-D, P39-E, P39-H, DEC-P39-DEPS-01; reason: implements remediations for completed P39 audit findings under P39-H. | 2026-11-25 |
| CR-167 | Refresh remote snapshot, update snapshot/issue-tracking rules, and backfill missing Model A GitHub issues | Done; refreshed remote snapshot at `2026-11-25T12:28:13+05:30` via `scripts/export-remote-snapshot.sh`; updated `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/README.md`, and `docs/memory/working-style.md` to require conditional remote-snapshot refreshes and immediate GitHub issue creation/closure for any unissued approved work; created and closed missing issues `#548`–`#555` (`CR-159`–`CR-165`, `P39-H-R1`/`CR-166`) and opened `#556` (`CR-167`); added regression assertions in `progressLedger.test.ts`; all six ordered gates run. | Commits on task/docs-snapshot-and-issue-tracking-rules, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, rules.md, README.md, working-style.md, and gh issues; related R8, CR-159, CR-160, CR-165, CR-166; reason: updating repository-process rules and reconciling Model A GitHub issues is standalone documentation lifecycle work. | 2026-11-25 |
| CR-168 | Record physical-device checks O83 and O84 as Pass | Done; recorded owner-reported physical-device verification Pass for `O83` and `O84` (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`) in `docs/releases/device-test-checklist.md`; updated `PROGRESS.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; tracked in issue `#559`; all six ordered gates run. | Commits on task/docs-record-device-checks-o83-o84, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-H-R1, CR-166, #559; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | 2026-11-25 |
| CR-169 | Upgrade to Expo SDK 58 and resolve `DEC-P39-DEPS-01` (`P39-E-R1`) | Done; upgraded Expo and 31 compatible packages to SDK 58 (`expo@^58.0.26`, `react-native@0.88.1`, `react@19.3.0`, `expo-router@~58.0.32`) plus `@react-native/jest-preset` and `react-test-renderer@19.3.0`; verified `npm ls decode-uri-component` is empty and `npm audit` has 0 critical/0 high advisories (27 moderate dev/CLI advisories remain); updated `app/(tabs)/_layout.tsx`, `ef-allocation-form.tsx`, `onboarding.tsx`, `profile-form.tsx`, `jest.config.js`, `app.json`, `TabsLayout.test.tsx`, and `progressLedger.test.ts`; added device check `O85` (`Not run`); tracked in issue `#562`; all six ordered gates run. | Commits on task/P39-E-R1-expo-sdk-58-upgrade, merged into phase/39-release-audit-and-hardening and develop via PRs. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory, P39-E, DEC-P39-DEPS-01, package.json, app.json, jest.config.js, app/(tabs)/_layout.tsx; related P39-E, DEC-P39-DEPS-01, CR-164; reason: executes the planned Expo SDK 58 major upgrade and resolves DEC-P39-DEPS-01 from completed P39-E. | 2026-11-25 |
| CR-170 | Record owner-reported physical-device check O85 as Pass | Done; O85 recorded as Pass with confirmed owner-reported physical-device metadata (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`) in `docs/releases/device-test-checklist.md`; updated `PROGRESS.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; tracked in issue `#565`; all six ordered gates run. | Commits on task/docs-record-device-check-o85, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-E-R1, CR-169, #562; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | 2026-11-25 |
| CR-171 | Complete CHANGELOG.md for all published releases and add mandatory update rule | Done; backfilled `CHANGELOG.md` with verified entries for `v1.0.0` (`2026-11-07`), `v1.1.0` (`2026-11-08`), `v1.1.1` (`2026-11-09`), `v1.2.0` (`2026-11-11`), and `v1.3.0` (`2026-11-22`) plus `[Unreleased]`; wired mandatory per-release `CHANGELOG.md` update rule into `AGENTS.md`, `docs/releases/README.md`, `docs/releases/TEMPLATE.md`, and `docs/releases/RELEASE_PROMPT.md`; verified `app/about.tsx` and `AboutScreen.test.tsx`; added regression assertions in `progressLedger.test.ts`; tracked in issue `#566`; all six ordered gates run. | Commits on task/docs-changelog-completion, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, memory, CHANGELOG.md, AGENTS.md, docs/releases/, app/about.tsx, and AboutScreen.test.tsx; related documentation lifecycle, P28-F-R7, #566; reason: completing historical changelog entries and adding a release-process rule is standalone documentation lifecycle work. | 2026-11-25 |
| CR-172 | Measure documentation size, parsing-test coverage, and per-prompt read cost (`P40-A`) | Done; measured `AGENTS.md` (319 lines, 21,941 bytes, ~5,477 tokens), `docs/PROGRESS.md` (13,495 lines, 1,443,604 bytes, ~359,592 tokens; 78.8% in sections `## 10`, `## 6`, `## 4`, `## 11`), and `docs/memory/*` (3,545 lines, 286,061 bytes, ~71,388 tokens); inventoried 5 doc-parsing Jest suites (96 `it()` blocks, 1,312 assertions); wrote detailed report to `/tmp/wealthwise/reports/p40-a-doc-size-audit.md`; updated ledger, memory, branch index, and `progressLedger.test.ts`; tracked in issue `#461`; all six ordered gates run. | Commits on `task/P40-A-doc-size-audit`, merged into `phase/40-agent-context-hygiene` and `develop` via PRs. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, AGENTS.md, and doc tests; related P40-A, P40-B, CR-113, #461; reason: executes already-approved P40-A measurement work in P40. | 2026-11-25 |
| CR-173 | Archive completed-phase narrative from `docs/PROGRESS.md` (`P40-B`) | Done; moved completed-phase narrative from sections 4, 5, 6, 7, 10, and 11 into 6 linked archive files under `docs/memory/archive/` indexed by `docs/memory/archive/README.md`, reducing `docs/PROGRESS.md` from 13,495 lines (1,443,604 bytes) to ~2,035 lines (~365 KB); added failing P40-B archive test first and `loadLedgerWithArchives()` in `progressLedger.test.ts` preserving every existing assertion; updated `docs/memory/README.md`, `status.md`, and `open-items.md`; tracked in issue `#462`; all six ordered gates run. | Commits on `task/P40-B-archive-completed-narrative`, merged into `phase/40-agent-context-hygiene` and `develop` via PRs. Placement: rule 3; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and `progressLedger.test.ts`; related P40-A, CR-113, CR-172, #462; reason: executes already-approved P40-B archival work in P40. | 2026-11-25 |
| CR-174 | Prepare WealthWise `v1.4.0` minor release candidate (`P28-F-R8`) | In progress; bumped `app.json`, `package.json`, and `package-lock.json` to `1.4.0` after owner approval of `v1.4.0` draft; moved finalized note to `docs/releases/published/v1.4.0.md` with 13 screenshots under `docs/releases/screenshots/v1.4.0/`; updated `CHANGELOG.md`, `README.md`, `v1.3.0.md` Download block, `device-test-checklist.md` (`O77`–`O85` moved to `## v1.4.0 device checks`), `releaseDownloadDocs.test.ts`, and `progressLedger.test.ts`; tracked in issue `#574`; all six ordered gates run. | Commits on `task/P28-F-R8-prepare-v1.4.0-release`, branch `qa-and-release`. Placement: rule 1; searched dashboard, register, memory, release-history.md, device-test-checklist.md, README.md, and `releaseDownloadDocs.test.ts`; related qa-and-release lifecycle, P28-F-R7, #574; reason: ongoing release engineering under qa-and-release. | 2026-11-25 |
| CR-158 | Implement consistent filter panel across screens and remove filter icon dot indicator (P20-L-R1) | Done; Goals filter panel provides All, In progress, Achieved status chips and dynamic target year chips alongside SortChip with empty state handling; dot indicator removed from header filter icon across all 5 screens (Goals, Assets, Liabilities, Transactions, Budget); filter and sort states operate independently; regression tests in ConsistentFilterPanels.test.tsx pass (10/10); RouteRenderSmoke.test.tsx and BudgetCategoryFilter.test.tsx assertions updated to expect dot indicator absence; physical-device check O82 added in Not run status. All six ordered gates run. | Commits on task/P20-L-R1-consistent-filter-panels, merged into phase/20-budget and develop via PRs. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and touched files; related P20-L, P20-Z, P20-Z-R1, P17-C-R1; reason: revision of completed subtask P20-L. | 2026-11-24 |
| CR-157 | Release audit remediation plan (P39-H) | Done; synthesized findings from P39-A through P39-G into 3 prioritized batches (Batch 1: storage fallback visibility; Batch 2: bundle treeshaking; Batch 3: dependency alignment); rollback plans defined; report in /tmp/wealthwise-p39-h-remediation-plan.md; all six ordered gates pass. | Commits on task/P39-H-remediation-plan, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–G; reason: release audit remediation plan. | 2026-11-24 |
| CR-156 | Clean-install and first-launch walkthrough (P39-G) | Done; verified boot sequence, onboarding, reminder sheet, and permission denial paths; findings feed P37-A; report in /tmp/wealthwise-p39-g-clean-install-walkthrough.md; all six ordered gates pass. | Commits on task/P39-G-clean-install-walkthrough, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H, P37; reason: clean-install and first-launch walkthrough. | 2026-11-24 |
| CR-155 | Debt, TODO/FIXME markers, and skipped test audit (P39-F) | Done; zero TODO markers found; stressBenchmark single skipped test documented as intentional opt-in benchmark exception; zero weakened assertions; report in /tmp/wealthwise-p39-f-test-debt-audit.md; all six ordered gates pass. | Commits on task/P39-F-test-debt-audit, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: test debt, TODO markers, and skipped test audit. | 2026-11-24 |
| CR-154 | Dependency risk triage and CVE review (P39-E) | Done; 1,124 packages audited; decode-uri-component ReDoS in expo-router/query-string triaged as accepted risk pending owner decision DEC-P39-DEPS-01; zero force fixes; report in /tmp/wealthwise-p39-e-dependency-risk-audit.md; all six ordered gates pass. | Commits on task/P39-E-dependency-risk-audit, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: dependency risk and CVE review. | 2026-11-24 |
| CR-153 | Silent failures and recovery-state audit (P39-D) | Done; SQLite fallback to AsyncStorage leaves onSQLiteFailure undefined without UI banner (P2); backup error handling and notification recovery verified; report in /tmp/wealthwise-p39-d-recovery-audit.md; all six ordered gates pass. | Commits on task/P39-D-recovery-audit, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: silent failures and recovery paths audit. | 2026-11-24 |
| CR-152 | Security, network boundary, and debug residue audit (P39-B) | Done; zero secrets/debugger statements; dev menu unreachable; Hermes bytecode bundles fixtures (P2); offlineRuntime.test.ts extended to forbid EventSource and sendBeacon; report in /tmp/wealthwise-p39-b-security-debug-audit.md; all six ordered gates pass. | Commits on task/P39-B-security-debug-audit, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: security, network boundary, and debug residue audit. | 2026-11-24 |
| CR-151 | Master read-only codebase audit (P39-A) | Done; 12 findings with file/line evidence and P0–P3 severities recorded in /tmp/wealthwise-p39-a-master-audit.md; zero P0/P1 blockers; all six ordered gates pass. | Commits on task/P39-A-master-audit, merged into phase/39-release-audit-and-hardening via PR. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, codebase; related P39-A–H; reason: master release audit and hardening. | 2026-11-24 |
| CR-150 | Complete P43-E GitHub issue inventory and execution planning (documentation-only) | Done; verified inventory of 209 active dashboard parts and 145 CRs; deduplicated strategy of 260 issues (224 closed retrospective, 36 open planned); taxonomy of phase, type, status labels and release milestones; API rate limit mitigation and 7-batch execution plan; zero issues created/modified; detailed report in /tmp/wealthwise-p43-e-issue-inventory-plan.md; all six ordered gates pass. | Commits on task/docs-p43-e-issue-inventory-plan, merged into documentation and develop via PRs. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md; related P43-A–G; reason: repository-process issue inventory and execution planning setup exception. | 2026-11-24 |
| CR-149 | Complete P31 community and project health deliverables (P31-A, P31-B, P31-C, P31-D) | Done; CODE_OF_CONDUCT.md created at root; YAML issue forms bug_report.yml, feature_request.yml, question.yml, config.yml added with financial data warnings and legacy .md templates removed; docs/accessibility/accessibility-statement.md and audit-checklist.md added; PRIVACY.md created at root derived from verified P39-C facts; all six ordered gates pass. | Commits on task/P31-community-and-project-health, merged into phase/31-community-and-project-health and develop via PRs. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and repository docs; related P31, P39-C; reason: project health, community, accessibility, and privacy documentation deliverables. | 2026-11-24 |
| CR-148 | Report-first permissions and privacy trace (P39-C) across notifications, biometrics, storage, and allowBackup | Done; permissions and privacy trace completed across app.json, app code, and dependencies; verified zero network calls, zero telemetry, allowBackup=false, local notifications, local biometrics, SAF scoped storage, and unencrypted at rest limitation; detailed report in /tmp/wealthwise-p39-c-permissions-privacy-trace.md; all six ordered gates pass. | Commits on task/P39-C-permissions-privacy-trace, merged into phase/39-release-audit-and-hardening and develop via PRs. Placement: rule 5 (kept in P39 per CR-113); searched dashboard, register, memory, app.json, permissions code; related P39, P31-D; reason: release audit and hardening permissions trace. | 2026-11-24 |
> Earlier change-request register entries (CR-1 through CR-139) are archived in [memory/archive/change-request-register.md](memory/archive/change-request-register.md).

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


- **DOCS-REMOTE-SYNC (2026-11-22):** the complete owner snapshot exported at 2026-11-22T11:12:56+05:30 is reconciled in Section 11 and the PR history map. Refresh it after every manual merge. The supplied terminal transcript is reconstructed from chat pastes, not an original capture.

## 9. Upcoming roadmap

0. **P17 — Cash flow, budgets, and sorting** (P17-A–C Done; P17-C-R1 Done): P17-A cash-flow model and movements, P17-B budgets domain and store, P17-C sort comparator and persistence. P17-C-R1 (Done; CR-146; O80 physical-device check open): in-memory cache and writeQueue serialization in createMetaStore (metaStore.ts) ensure atomic sort preferences and eliminate mount delay; useSort subscribed to metaStore updates for real-time sync across mounted hooks; sort preferences persist independently per screen/section across navigation and app restarts; filter states remain completely separate and unaffected. Physical-device check O80 added in Not run status. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and sorting code; related P17-C; reason: revise completed sorting preferences in Phase P17 to ensure reliable persistence across all screens and sections.
1. **P19 — Budget model and sync** (Done): P19-A five-group setup (CR-5),
   P19-B investment/income reconciliation and Budget actions (CR-9, CR-16), and
   P19-C header icons, user-owned inputs and balance card (CR-17–CR-19).
2. **P20 — Pending items, Home, navigation and Budget management**
   (P20-A through P20-V Done; P20-A-R1/R2 and P20-S-R1-R1/P20-S-R2/P20-S-R2-R1/P20-S-R2-R2 revisions Done;
   P20-U-R1 Done; P20-A-R3 Done; P20-W Done):
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
   supersedes P20-N-R1's section-specific chart. P20-A-R3 — Linked one-time savings Paid from Transactions (Done; implementation/tests complete; PR #178/#179 merge commits present in local Git. Correction: the earlier roadmap entry said Gate 4 blocked integration): realistic regressions reproduced plan-only and snapshot-only link-placement failures. Shared selectors now retain the holding target and count its transaction in the linked Budget line. Real Transactions and `/payment-confirm` Paid flows, reminder cold-start routing, rehydration, backup migration, demo data, scope history and exact/lower/higher × Savings/Cash/Other are covered. Home lists only due-kind rows; Budget has no Paid control for pending items. Gate 4 exited 1 because `registry.npmjs.org` was not resolvable; historical Gate 4 pending statement is superseded by local merge commits #178/#179 (P20-A-R3-R1); owner Gate 4 was 20/21, exit 1, six SDK 57 patch mismatches. O74 device verification remains Not run. Owner's exact reported data and steps remain unknown. No schema change or protected-file edit.
   P20-W (Previously: P43-D) is In progress for schema-free D1/D2 transaction
   form changes. D1/D2 are implemented and focused tested: no default
   investment category before a holding is selected; the holding derives the
   category and missing holding blocks Save. Expense choices are grouped Budget
   categories plus Custom; the selected section is derived, and deleted Budget
   items do not rewrite transactions. Full Gate 1 and Gates 2–3 pass; Gate 4
   and the required retry both failed with `ENOTFOUND registry.npmjs.org`, so
   Gates 5–6 and PR integration remained stopped on that earlier tree. D3
   custom Income is authorized by DEC-P20W-D3-SCHEMA24 to use v24; its Budget
   income item category is currently a fixed enum. Current schema is v23;
   P36-A/B are replanned to v25. Placement: rule 3;
   searched dashboard, register, P20-O/P, P3
   history, roadmap, memory and transaction form modules; related P20-O and
   P20-P; reason: the work extends existing Budget/category forms.
   P20-U-R1 — Budget edit/delete defect (Done; O73 device check open): CONT3 completed the field, section, kind, scope, viewed-month, backup and demo-origin matrix. Confirmed roots and fixes: following-scope Income snapshot schedule mismatch (`2dc72b5`), optional-field item edit overwrite (`a292f33`), and holding-link loss in category-line edits (`e4accf5`). H1 refuted for tested reopen; H2 refuted for live store update plus selected-ID delete; H3 not reproduced in tested routes (Alert/reminder entry points untested); H4 confirmed/fixed; H5 refuted for synchronous storage. O73 remains Not run. Six-gate results are in CONT3.
   P20-S-R2 — searchable shared Dropdowns (Done): add default-visible search with accessible clear/result feedback, Unicode-normalized case/diacritic-insensitive AND matching, exact/prefix/word-start/contains ranking, group preservation, selected-state behavior, Custom pinning, no-match feedback and query reset. All six gates completed; Gate 4 remains the known SDK 57 patch mismatch. No caller edits or schema/domain/demo-data/dependency changes. O61–O64 device checks remain open. Task PR #164 merged into the phase at `185a5ea`; phase PR #165 merged into `develop` at `6b50a1d`; P20-S-R2-R1 records the evidence. P20-S-R2-R2 preserves the complete revision chain. Placement: rule 2; searched dashboard, register, phase history, roadmap, memory and Dropdown source/tests; related P20-S; reason: adjusts completed shared Dropdown behavior. Assumed: no schema, domain, demo-data or dependency changes were required; confirmed.
   P20-Z — Dynamic budget category filter (Done; Revised by P20-Z-R1; CR-144; O78 physical-device check Pass based on owner report on 2026-11-23): dynamic category filter alongside existing Budget sorting option, defaulting to "All", listing available categories (Income, Expenses, Needs, Wants, Debt, Assets, Liabilities), and dynamically including newly created categories following Transactions section behavior. Added categoryOptions computing base and custom section categories, ChipRow category chips in budget-filter-panel, categoryOverride with routeCategory fallback, and matchesCategory filtering sortedSections with EmptyState fallback. Revised by P20-Z-R1 (Done; CR-145; O79 physical-device check Pass based on owner report on 2026-11-23) to refine filterActive indicator to selectedCategory !== 'All' so filter icon is clean without dot on default view matching Assets, Liabilities, and Transactions, and to preserve owner margin changes in filterPanel. Physical-device checks O78 and O79 verified Pass by owner. Placement: rule 4; searched dashboard, register, phase history, roadmap, memory and budget.tsx; related P20, P20-X, P17-C; reason: dynamic category filtering extends existing Phase P20 Budget feature area.
3. **P21 — Emergency fund as a goal-linked model** (P21-A–F Done; P21-F-R1 Done): P21-A links,
   entries and net-worth/schema v7 changes (CR-8, CR-13); P21-B cover and
       allocation table (CR-14, CR-15); P21-C normal-mode presentation and
   allocation item editing (CR-37, CR-38); P21-C1 invalid-allocation crash
   repair (CR-39), with schema v8 unchanged. P21-F (Previously: P43-C) is Done: one Emergency Fund edit action and combined target/allocation form, shared target reflection, one domain action/store write/Undo, typed floor validation, demo and v23 backup coverage. Task PR #170 and phase PR #171 are integrated; P21-F-R1 records exact SHAs. O65–O68 remain unverified on physical devices. Placement: rule
   4; searched dashboard, register, P21-A–E, roadmap, memory and Emergency
   Fund modules; related P21-A–E; reason: the work extends the Emergency Fund
   feature area. The owner authorized editing `app/(tabs)/index.tsx` if needed. DEC-P21F-FLOOR: the effective target is max(stored target, three-month floor); the form rejects lower values using existing typed validation and shows the floor helper. The existing persisted Goal.target suffices, so schema v23 remains unchanged.
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
9. **P29 — Product delivery** (43/43 closed; 43 Done): P29-O-R1 closes the
    cancelled ledger-migration scope; P29-O1-R1 and P29-W-R1 add schedule
    counts, collapsed paid entries and maturity/final-EMI caps; P29-AB-R2
    removes non-due recurring income from planned/due rows and totals while
    preserving editability; P29-Q-R1 replaces the unsupported four-choice
    confirmation call with a scalable centered selection dialog; P29-U-R1 — Dynamic asset valuation inputs and calculations
    (Done; CR-147): implements type-dependent dynamic valuation inputs and calculations
    (manual value input, interest-based rate calculation with compounding and maturity, unit-based 2-way auto-calculation between units, unit price, and purchase amount,
    balance-based current balance calculation) across recurring and one-time assets; type-specific valuation update route; schema v24 preserved; physical-device check O81 added (Not run) under Rule 2.
10. **P30 — Release 2 stabilization** (Done; physical-device re-test
    pending):
    - P30-A — Failing persistence/restart tests and mounted-screen refresh
      harness; the stale SQLite precedence defect was reproduced.
    - P30-B — Verified fallback authority markers and deletion tombstones make
      the newest persisted value win and expose failed writes.
    - P30-C — Memo-input/cache source guard and development-only hydration/write
      verification diagnostic.
11. **P31 — Project health and community** (Done; CR-149):
    - P31-A — Added `CODE_OF_CONDUCT.md` establishing community standards, privacy expectations, and maintainer reporting procedures. (Done; CR-149).
    - P31-B — Upgraded issue templates to YAML forms (`bug_report.yml`, `feature_request.yml`, `question.yml`, `config.yml`) with strict financial data warnings; removed legacy `.md` templates. (Done; CR-149).
    - P31-C — Added accessibility statement (`docs/accessibility/accessibility-statement.md`) and practical audit checklist (`docs/accessibility/audit-checklist.md`) aligning with WCAG 2.1 AA and mobile guidelines. (Done; CR-149).
    - P31-D — Added owner-approved privacy statement (`PRIVACY.md`) derived strictly from verified P39-C source facts: 100% offline-first, local-only storage (SQLite `wealthwise-state.db` and AsyncStorage `wealthwise.app.v1`), zero network calls, zero telemetry, local notifications, biometrics via OS Secure Enclave, scoped storage, AES-256-GCM encrypted backup export, `allowBackup: false`, and the unencrypted-at-rest limitation. (Done; CR-149).
    - The owner confirms public adoption as a future project goal; community
      launch activities remain separately planned and are not authorized by
      this status update.
12. **P32 — Empty (reserved)** (formerly screenshots; cancelled by owner):
    - P32-A, P32-B and P32-C screenshot capture rows moved to Cancelled / unassigned
      bucket under Section 13 Independent entities per CR-114. Slot is reserved
      for adjacent P31 or P33 work per R7.
13. **P33 — Widgets** (Planned):
    - P33-A — Research SDK 57 options, config plugin, dev-build need, privacy
      and hide-previews behavior. Owner reactivated the work and approved
      research; it remains Planned and not started. Dependencies: none.
    - P33-B — Android widget implementation is approved after P33-A research
      and scope confirmation. Dependencies: P33-A.
    - P33-C — iOS widget research/reactivation is approved; implementation
      remains contingent on P33-A research and iOS distribution. Dependencies:
      P33-A and iOS distribution.
14. **P34 — Quick capture** (Planned):
    - P34-A — Research the approved quick-capture scope and platform
      constraints; candidates include shake, double-tap back and a key
      combination. Research is authorized but not started. Dependencies: none.
    - P34-B — Evaluate app shortcuts, Quick Settings and notification actions
      that open a prefilled quick-add form after P34-A research. Dependencies:
      P34-A.
    - P34-C — Evaluate an opt-in foreground shake gesture after P34-A research.
      Background gestures remain out of scope unless research proves a
      policy-safe route. Dependencies: P34-A.
15. **P35 — Transaction auto-detect** (Planned):
    - P35-A — Research Android notification-listener vs SMS-permission
      options, iOS limitations, Play policy, prominent disclosure, local-only
      parsing and no raw-message storage. Research is owner-approved but not
      started. Dependencies: none.
    - P35-B — Owner has given a Go for implementation after P35-A research;
      validate findings and scope before implementation. Dependencies: P35-A.
    - P35-C — Implementation is owner-approved after P35-A research and the
      P35-B Go; do not start until those prerequisites are complete.
      Dependencies: P35-B and completed P35-A research.
16. **P36 — Notes** (Planned):
    - P36-A — Design text notes, voice/audio recordings, photos and videos;
      optional links to financial records; offline storage, media limits,
      backup/migration compatibility and schema-v25 impact. Dependencies:
      none. Demo data and tests are required per DEC-DEMO.
    - P36-B — Implement Notes schema, attachment metadata and pure domain
      behavior with offline-safe storage and backup compatibility.
      Dependencies: P36-A. Demo data and tests are required per DEC-DEMO.
    - P36-C — Implement the Notes UI for writing, recording and attaching or
      viewing photos and videos. Dependencies: P36-B. Demo data and tests are
      required per DEC-DEMO.
    - P36-D — Add deterministic Notes demo data without personal media.
      Dependencies: P36-C. Demo data and tests are required per DEC-DEMO.
17. **P37 — First-run tutorials** (Planned):
    - P37-A — Design per-feature skippable coach marks, replay from the menu,
      flags in the meta store rather than AppData, and accessibility.
      Dependencies: none. Demo data and tests are required per DEC-DEMO.
    - P37-B — Implement the tutorial framework. Dependencies: P37-A. Demo
      data and tests are required per DEC-DEMO.
    - P37-C — Implement per-feature tours. Dependencies: P37-B. Demo data and
      tests are required per DEC-DEMO.
18. **P38 — Loading feedback and skeletons** (Planned):
    - P38-A — Inventory operations with genuine asynchronous loading and
      define skeleton behavior, theme, accessibility and reduced-motion
      requirements. Dependencies: none.
    - P38-B — Implement reusable skeleton loaders for identified loading
      states only; preserve explicit errors and empty states. Dependencies:
      P38-A.
    - P38-C — Test loading, success, empty and failure transitions; ensure
      skeletons do not mask errors or flash during synchronous operations.
      Dependencies: P38-B.
19. **P39 — Release audit and hardening** (Planned; report-first):
    - P39-A — Read-only audit of dead code, secrets/configuration, app lock,
      notification-response routing, `wealthwise://` deep links, silent
      failures, performance, dependencies, debug residue, TODO debt,
      permissions and first launch. Every finding needs file/line evidence
      and severity P0-P3. (Done; CR-151). Dependencies: none.
    - P39-B — Verify secrets, network behavior and debug residue across
      tracked files, Git history patterns and EAS config; inspect the exported
      bundle to prove demo/stress loaders and the dev storage diagnostic are
      absent or unreachable; inspect console/debugger statements and source
      maps; add a regression test for no fetch/XHR/WebSocket/EventSource/sendBeacon
      in `app/` or `src/`. (Done; CR-152). Dependencies: P39-A.
    - P39-C — Trace privacy-sensitive permissions from declaration through
      request to use for notifications, biometrics, file/share/document
      picker and SQLite; check denial/revocation behavior and Android
      `allowBackup` in resolved config, marking unverifiable items unverified.
      (Done; CR-148). Dependencies: none (unblocked and executed per explicit
      owner instruction to verify source facts before drafting P31-D).
    - P39-D — Extend P30's silent-failure/recovery audit across storage,
      backup import/export, notification scheduling and SQLite fallback
      visibility. (Done; CR-153). Dependencies: P39-A.
    - P39-E — Triage current `npm audit` findings by production reachability
      versus tooling, record accepted risks and owner decisions; no force fix
      or install-script approval. (Done; CR-154). Dependencies: P39-A.
    - P39-F — Inventory TODO/FIXME markers, the skipped test and opt-in stress
      benchmark; assign a disposition to each. (Done; CR-155). Dependencies: P39-A.
    - P39-G — Walk through onboarding, lock, reminders prompt, first
      transaction and interrupted/denied paths from a clean install; findings
      feed P37-A. (Done; CR-156). Dependencies: P39-A.
    - P39-H — Group findings into the smallest independent remediation
      batches, containment before cleanup, owner approvals and rollback.
      (Done; CR-157). Dependencies: P39-B through P39-G.
    - Placement: owner approved keeping P39-A–H in P39; no lifecycle move.
20. **P40 — Agent-context hygiene** (Done; P40-A and P40-B Done):
    - P40-A — Done (`CR-172`, `#461`, 2026-11-25): Report-only measurement of `docs/PROGRESS.md`,
      `docs/memory/*` and `AGENTS.md` sizes, their parsing tests and
      per-prompt read cost. Full report at `/tmp/wealthwise/reports/p40-a-doc-size-audit.md`.
    - P40-B — Done (`CR-173`, `#462`, 2026-11-25): Archived completed-phase narrative
      from `docs/PROGRESS.md` into `docs/memory/archive/`, kept the active dashboard,
      standing rules and open items in the main file, and updated ledger tests
      to read archives without weakening assertions. Owner approved keeping
      P40-A/B in P40 (2026-11-12). Dependencies: P40-A.

21. **P43 — Repository process and lifecycle** (In progress; P43-A, P43-F and
    P43-G Done; P43-B/E remain Planned):
    - **P43-A — Lifecycle tracking separation:** track `cleanup` and
      `qa-and-release` as independent, ongoing lifecycle activities alongside
      `develop` and `release/vX.Y.Z`, not as sequential development milestones.
      Update PROGRESS.md, section 12, memory, tests and Markdown references
      Preserve P27/P28 as historical completion evidence. Documentation
      reordering only; Git chronology remains unchanged. Remote rename
      evidence: `origin/phase/27-cleanup` and `origin/cleanup` both resolved
      to `a2fa24f930da15c49f779577eb749b33f11a7059` before the old ref was
      deleted; final `origin/cleanup` remains at that SHA. Likewise,
      `origin/phase/28-qa-and-release` and `origin/qa-and-release` both
      resolved to `9d914638e50462cbadef84df3294ed07cbf42732` before deletion;
      final `origin/qa-and-release` remains at that SHA. Neither obsolete
      remote ref remains. Historical branch name: `phase/27-cleanup`;
      historical branch name: `phase/28-qa-and-release`. The retained tag
      targets are `phase-27-complete` → `a2fa24f930da15c49f779577eb749b33f11a7059`,
      `phase-28-complete` → `533aafb07c242fd1be7f682115527074f64026ac`, and
      `phase-29-complete` → `9637d222c4feb4a001384a4d9094e472eff23728`;
      tag objects and targets are unchanged.
    - **P43-B — Tag and integration audit:** owner approved the scope to plan
      non-release phase/task tag cleanup while preserving every `vX.Y.Z`
      release tag. Prepare the exact proposed deletion list for review; the
      list has not yet been supplied or approved, so no deletion is authorized
      by this update. Retain the previously directed stale phase tags.
      Separately audit branch, PR and merge balance as a report-only item;
      report only in chat or `/tmp`, not Git. Dependencies: produce and obtain
      approval for the exact list. Evidence: not started.
    - **P43-E — GitHub issue strategy (Done; CR-150):** strategy of one issue per ledger part or CR; phase/type/status labels; release milestones (v1.0.0 through v1.4.0); pending items open; completed items retrospective and closed; each body carries verified ledger commits, PR numbers, merge SHAs, and original dates; one retrospective comment per issue; GitHub sets actual creation, comment, and closure timestamps (original dates in body only); verified inventory of 209 active dashboard parts (173 done, 36 planned) and 145 CRs (94 mapped, 51 standalone lifecycle); deduplicated strategy of 260 issues (224 closed retrospective, 36 open planned); assessed API rate and noise concerns with a 7-stage batch rate limit mitigation plan; zero issues created/modified (creation requires separate execution task); report in /tmp/wealthwise-p43-e-issue-inventory-plan.md.
    - **P43-F — Work placement and CM-2:** add R6, the indexed guide, tests,
      the Planned-row placement audit and CM-2 activation. Test-first commits
      `e2f0263`, `d24acd9`, `e7c134a`, `770393d` and `bdbe159`; ordered gates
      passed after the successful Expo Doctor retry. Task PR #153 merged into
      P43 at `6e8632f61226fabbfdeca1040f6dee097a808607`; phase PR #154 merged
      into `develop` at `faa126ba75ee58ee703b8e43b375aece91c8f4d1`.
      Placement: rule 1; searched dashboard, register, phase history, roadmap,
      memory, tests and branch instructions; related P43-A–E and CM-2; reason:
      shared repository-process policy and lifecycle setup. Evidence pending.
    - **P43-G — Owner-approval planning reconciliation:** record written
      owner approvals and placement decisions across existing Planned work;
      preserve dependencies and do not begin implementation. P43-B's exact
      proposed tag-deletion list and P43-E's verified issue inventory remain
      prerequisites. See CR-113.
22. **P44 — Spending heat map** (Planned; implementation has not started):
    - **P44-A — Design:** owner approved a Transactions stack route opened
      from a Transactions header action; metrics/scales, accessibility,
      performance and schema impact remain to be designed. Count all inflows
      in Income, with an option to exclude non-earned inflows. Count linked
      investment transactions only under Investment. Home is user-owned, the
      tabs remain Home/Transactions/Goals/Budget, and `app/(tabs)/budget.tsx`
      is protected. A Budget section was not selected. Do not edit Home or
      Budget without explicit task authorization. “Infinite” means unbounded
      month navigation, with previous/next
      navigation clamped to the available data range plus the current month,
      not an unbounded rendered list. Compute each month on demand in one pass
      over transactions grouped by date; meet existing stress-tier budgets.
      Show one metric at a time with a segmented control (Expense default,
      Income, Investment). Use five intensity buckets relative to the visible
      month's maximum, with an option for a trailing-12-month percentile so
      one outlier does not flatten other days. Color cannot be the only
      signal: each cell needs date and exact-amount accessibility text,
      numeric day labels and a bucket-range legend; targets are at least
      44pt; support dark/light/all themes and use `AmountText` or
      `formatAmount` with an explicit display tier.
      Owner approved the placement and Income/investment counting decisions;
      no further owner decision is pending for P44-A. Schema impact: no
      persisted schema change is Assumed; any user setting belongs in the meta store, not
      AppData. Use a plain seven-column React Native View, with no new dependency or charting
      library. Dependencies: none. Evidence: not started.
    - **P44-B — Pure daily totals selector:** add a deterministic
      `src/domain/` selector for daily totals by type for one month, with
      injected dates and no React/Expo imports, clock reads or randomness.
      Add unit tests, a seeded oracle and 50-year and 126-year stress fixtures.
      Dependencies: P44-A. Evidence: not started.
    - **P44-C — Spending heat map screen and route:** add the stack route, bounded month
      navigation, metric toggle and day detail; test font scales 1.0, 1.3 and
      2.0. Dependencies: P44-B. Evidence: not started.
    - **P44-D — Demo data, layout, accessibility and device checklist:** add DEC-DEMO-compliant
      deterministic fixtures, simulated-layout tests, accessibility checks
      and device-checklist rows. No physical-device check is claimed until
      executed. Candidate add-ons, each separately approvable and not
      committed to scope: average spend by weekday; no-spend-day count and
      longest streak; top spending days with day-transaction tap-through;
      month-over-month delta; payday effect (seven days after main income
      versus the rest); biggest category on day tap; and a Budget overlay for
      category plan overruns. More than three add-ons would bloat v1; the
      recommendation is the heat grid, day detail, weekday summary and
      no-spend streak. Dependencies: P44-C. Evidence: not started.
23. **P7 — Cloud Backup (Google Drive)** (Planned; Rule R7 slot-filling adjacent to P6 Backup & Security):
    - **P7-A — Research & prototyping:** research Google Drive REST API (v3)
      `appDataFolder` scope (`https://www.googleapis.com/auth/drive.appdata`),
      Expo SDK 57 Google OAuth2/Sign-In integration, and background scheduling
      (`expo-background-fetch` / Android WorkManager) with Wi-Fi gating.
      Keep the app serverless, zero-knowledge, and private. Dependencies: none.
      Evidence: not started.
    - **P7-B — Pure domain model:** pure domain model for cloud backup
      scheduling (frequency: daily / weekly / monthly / manual, retention
      policy: keep latest N backups, zero-knowledge local passphrase
      encryption before upload using AES-GCM). Pure `src/domain/` logic without
      clock reads or native imports. Dependencies: P7-A. Evidence: not started.
    - **P7-C — UI & settings:** UI & settings in Backup / Security screen
      (Connect/Disconnect Google Drive account, last backup status/timestamp,
      frequency picker, Wi-Fi only toggle, "Back up now", and "Restore from
      Google Drive" flow). Accessibility labels, theme consistency, and 44pt tap
      targets required. Dependencies: P7-B. Evidence: not started.
    - **P7-D — Fixtures, testing & device verification:** deterministic demo
      data per DEC-DEMO, offline fallback and token revocation handling, unit
      and store tests, and device checklist rows. Dependencies: P7-C. Evidence:
      not started.

### CM-2 Git sync rule (Active; enforced)

After any merge that lands on a target branch (task->phase, phase->develop, release->main, main->develop): git fetch --all --prune; git switch <target>; git pull --ff-only. Refuse and report if the worktree is dirty, the fast-forward fails or the target has no upstream. This rule never authorizes pushing; R3 is unchanged.

### Standalone lifecycle activities (Active; outside numbered development phases)

- **`cleanup`** — ongoing cleanup, dependency/bundle hygiene and maintenance;
  current branch is `cleanup`, and `origin/cleanup` is verified at the original
  tip. Historical branch name: `phase/27-cleanup`.
- **`qa-and-release`** — ongoing QA and release lifecycle tracking alongside
  `develop` and `release/vX.Y.Z`; current branch is `qa-and-release`, and
  `origin/qa-and-release` is verified at the original tip. Historical branch
  name: `phase/28-qa-and-release`.
- **`qa-and-release` CI workflow** — GitHub Actions gates
  1–4 and the follow-up protection rule remain Planned in this lifecycle.
  Placement: rule 1; searched dashboard, register, roadmap, memory, P31 files
  and GitHub workflow area; related qa-and-release; reason: CI and protection
  are ongoing repository-process work.
- P27/P28 remain completed historical milestones, not current lifecycle
  trackers.

Owner-approved future scope beyond the numbered roadmap (2026-11-11):

- Plan a true in-app update check; until implemented, About continues to open
  the latest-release page in the browser after confirmation.
- Once-only frequency for investment plans and liabilities was evaluated and
  cancelled by owner decision on 2026-11-22 (CR-128); current forms, investment
  kinds, and liability schemas remain unchanged.

**Superseded (2026-11-08):** the earlier roadmap ended at P28 and marked
P24 and P26 as in progress or planned. Those entries have been updated above;
use the dashboard for the canonical status. P27/P28 remain historical phase
records; ongoing cleanup and QA/release tracking are listed separately above.
Fixes to completed
work remain in their original phase and use `<ID>-R<n>` (for example,
`P29-AB-R1`), with the original row noting `Revised by`.

## 10. Verification matrix

An item is `Done` only when its named source and test evidence are available.
Paths below are repository-relative. Baseline results are not completion
evidence for the fixes.

### 2026-11-22 — P20-Y Budget payment date, multi-asset budget links, and limited expense categories

- Implemented payment date when marking scheduled or budgeted items Paid across Transactions and Budget: `PaidAmountDialog` includes DateField defaulting to today and passes payment date to `onPaid`; `clearDue`, `clearDuesThrough`, `PendingItemActions`, and `app/insurance.tsx` accept and propagate `paymentDate` to linked transactions and holding logs, preserving correct historical dates, one-write persistence, and Undo.
- Supported one asset linking to multiple one-time investment Budget items (`frequency === 'once'`) in `budget.ts` (`addItem`, `editItem`) and `app/budget-item-form.tsx`; `budgetLineActual` attributes holding entries by matching category or note, falling back to single-link attribution; verified paying each linked item updates the correct holding and budget actuals.
- Limited Transaction form Expense category picker to user-created Budget items and applicable scheduled items (due EMIs, policy premium categories, pending dues) plus Custom, removing unbudgeted built-in suggestions (entertainment, fashion, subscription, travel, gifts, generic insurance premiums); preserved Income and Investment category behaviors; retained historical categories when editing existing transactions to avoid data loss.
- Documented superseded test assertions in `src/components/__tests__/TransactionForm.test.tsx` (lines 340, 389, 671) where tests previously asserted unbudgeted built-in categories (`Donation`, `Gifts`, unlinked policy titles) rather than user-created or applicable scheduled categories; updated assertions to test user-created items (`Festival`, `Culture`, `Unexpected`) and scheduled policy categories (`Health premium`), and added explicit test for preserving historical removed category `Gifts`.
- Regression tests: `src/components/__tests__/PaidAmountDialog.test.tsx`, `src/components/__tests__/PendingItemActions.paymentDate.test.tsx`, `src/domain/__tests__/budgetMultiAssetLink.test.ts`, `src/domain/__tests__/budgetCategoriesLimited.test.ts`, `src/components/__tests__/TransactionForm.test.tsx`.
- Six gates: Gate 1 exit 0; Gates 2–3 exit 0; Gate 4 exit 0 (21/21 checks passed); Gates 5–6 exit 0.
- Physical-device check O76 validated Pass by owner on 2026-11-22 (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, tester sahilsheikh-dev).

### 2026-11-22 — P20-Y-R1 Linked transactions update on budget item rename

- Fixed WealthWise bug where renaming a budget item or category in one month did not update the name shown by transactions linked to that item.
- Linked transactions now reflect the current budget item name wherever they appear, including existing transactions, while preserving their amount, date, category (e.g. `'Mutual fund / SIP'`), and budget link source.
- `editItem` in `src/domain/budget.ts` locates linked transactions and holding log entries for the item's target holding and updates `note` to the new budget item name across the specified month/scope, preserving amount, date, category, and budget link.
- `budgetItemForTransaction` in `src/domain/budgetCategories.ts` dynamically resolves the linked budget item for a transaction within that transaction's effective month budget.
- `TransactionsScreen` in `app/(tabs)/transactions.tsx` displays the resolved budget item name for linked transactions.
- Dues clearing in `src/domain/dues.ts` and `src/components/PendingItemActions.tsx` passes the budget item title when clearing planned holding dues.
- Investment entry update in `src/domain/instruments.ts` and `src/domain/investmentActions.ts` synchronizes the note on linked transactions.
- `filterTransactions` in `src/domain/transactions.ts` matches investment transactions by `note` against budget categories.
- Added regression tests in `src/domain/__tests__/budgetItemRenameTransactions.test.ts` (5 tests covering month-only scope, following scope, multi-asset link preservation, recurring plan holdings, and transaction display resolution).
- Six gates: all pass exit 0.

### 2026-11-22 — P28-F-R7 Prepare v1.3.0 release candidate

- Subtask `P28-F-R7` under `qa-and-release` lifecycle.
- Version bump: `app.json`, `package.json`, and `package-lock.json` bumped to `1.3.0`.
- Release note: finalized note moved to `docs/releases/published/v1.3.0.md` with 8 owner-supplied screenshots in `docs/releases/screenshots/v1.3.0/` and draft removed.
- Configuration and checklist: `build-config.md` version identifier updated to `1.3.0`; `device-test-checklist.md` updated to `## v1.3.0 device checks (next release)` with confirmed metadata; `README.md` What's new updated to `v1.3.0`.
- Tests updated: `src/components/__tests__/AboutScreen.test.tsx` and `src/lib/__tests__/releaseDownloadDocs.test.ts`.
- Integration and build: Task PR #210 and phase PR #211 merged to `develop` at candidate commit `afeb987`; `release/v1.3.0` created; EAS build `c2ec9414-ae63-44cc-b34a-0f67f6cb51cb` completed with profile `android-apk` and Android `versionCode` 4. The 107,030,213-byte APK artifact was downloaded, byte-verified privately, and uploaded to the `v1.3.0` draft as `WealthWise-android-latest-v1.3.0.apk`. Build records integrated via PR #212 and #213 (`58d9a26`). Per owner instruction, `README.md` (v1.3.0 Download block and 8-screenshot gallery), release notes, release history, and `AGENTS.md`/`rules.md` release rules were updated to align all candidate assets and docs for v1.3.0. Publication approved and completed on 2026-11-22; release/v1.3.0 merged to main via PR #216 (341dbcb); tag v1.3.0 created at 51523b8; GitHub Release v1.3.0 published as Latest by sahilsheikh-dev; post-publication sync PR #217 (97c6d02) merged to develop.
- Six gates: all pass exit 0.

### CR-141 verification — reconcile documentation for completed v1.3.0 publication (2026-11-23)

- Reconciled documentation across release-history.md, docs/releases/README.md, open-items.md, status.md, and PROGRESS.md to accurately record completed v1.3.0 publication.
- Verifiable release facts documented: PR #216 merged release/v1.3.0 to main (341dbcb), tag v1.3.0 points to 51523b8, GitHub Release published as Latest by sahilsheikh-dev, APK artifact (107,030,213 bytes) verified HTTP 200, and PR #217 back-merged main to develop (97c6d02).
- Ordered six gates pass with exit 0.

### CR-142 verification — reconcile planned and unimplemented roadmap items (2026-11-23)

- Reconciled open-items.md and status.md to remove stale historical references indicating P21-F or P43-B were unimplemented.
- Documented verified facts: P21-F (Emergency Fund target editing) was completed and released in v1.3.0 with device checks O65–O68 Pass; P43-B (non-release tag cleanup) was completed under CR-131; O77 is Pass.
- Formally established the authoritative list of 12 active planned/unimplemented roadmap areas: P7 (Google Drive Cloud Backup), P31 (Project health/community), P33 (Widgets), P34 (Quick capture), P35 (SMS/notification transaction detection), P36 (Notes), P37 (Tutorials), P38 (Skeleton loaders), P39 (Security/privacy audit), P40 (Context hygiene/archival), P43-E (GitHub issue inventory), P44 (Spending heat map).
- Ordered six gates pass with exit 0.

### P28-F-R8 / CR-174 verification — prepare WealthWise v1.4.0 release candidate (2026-11-25)

- **Version & release-note alignment:** Bumped `app.json`, `package.json`, and `package-lock.json` to `1.4.0`. Moved owner-approved `docs/releases/drafts/v1.4.0.md` to `docs/releases/published/v1.4.0.md`, added all 13 owner-supplied screenshots under `docs/releases/screenshots/v1.4.0/`, updated `CHANGELOG.md` (`[1.4.0] - 2026-11-25`), `README.md` (Download block, What's new, and 13-screenshot gallery), and `docs/releases/published/v1.3.0.md` Download block (`Version: v1.3.0` and versioned APK URL).
- **Device checklist rearrangement:** Moved verified checks `O77`–`O85` into `## v1.4.0 device checks` below `## v1.3.0 device checks` in `docs/releases/device-test-checklist.md`, leaving `## Next release device checks` empty with `App version: TBD`.
- **Replaced assertions (`releaseDownloadDocs.test.ts` & `progressLedger.test.ts`):**
  - `releaseDownloadDocs.test.ts`: Old: aligned-version check expected `docs/releases/published/v1.3.0.md` / `'1.3.0'`. Replacement: expects `docs/releases/published/v1.4.0.md` / `'1.4.0'` and includes `v1.4.0` in `releases`, `releaseFiles`, `screenshotSets` (13 screens), and `markdownByVersion`. Reason: `v1.4.0` is the approved candidate version.
  - `progressLedger.test.ts`: Added `'v1.4.0 device checks'` to `expectedSections`. Reason: `O77`–`O85` moved into `## v1.4.0 device checks` for the `v1.4.0` release candidate.
- Ordered six gates: all run with actual exit codes recorded.

### P40-B / CR-173 verification — archive completed-phase narrative (2026-11-25)

- **Archive structure (`docs/memory/archive/`):** Created [README.md](memory/archive/README.md) plus 6 section archives (`architecture-and-decisions.md`, `phase-history.md`, `prompt-and-session-log.md`, `change-request-register.md`, `verification-matrix.md`, `session-and-release-log.md`), keeping `docs/PROGRESS.md` as the canonical current ledger (`~2,045` lines, `~365 KB`, down from `13,495` lines / `1,443,604` bytes) with active dashboard, standing rules, open items, current roadmap, recent CR/verification records, branch index, and independent entities.
- **Test-first & full-coverage preservation (`progressLedger.test.ts`):** Added the failing `P40-B` archive validation test first, then added `loadLedgerWithArchives()` so all 82 ledger tests (including all historical assertions across `P1`–`P43` and `CR-1`–`CR-173`) run against `docs/PROGRESS.md` + `docs/memory/archive/*`.
- **Replaced assertions (`progressLedger.test.ts`):**
  - Old: `P40-B` asserted as `| Planned |` in `CR-109` test and `plannedPartIds`; `Overall progress` up to `87% (184/212)`.
  - Replacement: `P40-B` asserted as `| Done |`, removed from `plannedPartIds`, and `Overall progress` allows `87% (185/212)`.
  - Reason: `P40-B` completed (issue `#462`), completing `P40` (`2/2`).
- Ordered six gates: all run with actual exit codes recorded.

### P40-A / CR-172 verification — documentation size and read-cost audit (2026-11-25)

- **Method & assumptions:** Exact UTF-8 line, byte, character, and whitespace-word counts measured from disk at `develop` `f8b8a71`; estimated token cost uses `Math.round(chars / 4)` (~4 chars/token BPE heuristic).
- **Measured totals:** `17,359` lines, `1,751,606` bytes, `237,480` words, `~436,456` tokens across:
  - `AGENTS.md`: `319` lines, `21,941` bytes, `~5,477` tokens (always-on startup cost).
  - `docs/PROGRESS.md`: `13,495` lines, `1,443,604` bytes, `~359,592` tokens (`78.8%` concentrated in sections `## 10` `575,212` bytes, `## 6` `233,125` bytes, `## 4` `162,669` bytes, and `## 11` `139,441` bytes).
  - `docs/memory/*` (9 files): `3,545` lines, `286,061` bytes, `~71,388` tokens (led by `open-items.md` `116,809` bytes and `status.md` `109,468` bytes).
- **Parsing-test coverage:** 5 Jest suites (`progressLedger.test.ts`, `memoryDocs.test.ts`, `branchingDocs.test.ts`, `releaseDownloadDocs.test.ts`, `commitMessage.test.ts`) totaling `3,291` lines, `96` `it()` blocks, and `1,312` `expect()` assertions (`progressLedger`, `memoryDocs`, and `branchingDocs` execute in `3.096 s`).
- **Detailed report:** Written outside Git at `/tmp/wealthwise/reports/p40-a-doc-size-audit.md` (issue `#461`).
- **Replaced assertions (`progressLedger.test.ts`):**
  - Old: `P40-A` in the `Planned` roadmap list; `branchLabels` without `'P40'`; `expect(rows).toHaveLength(35)` in phase branch index; `Overall progress` up to `86% (183/212)`.
  - Replacement: `P40-A` removed from `Planned` list (now `Done`, `P40-B` remains `Planned`); `'P40'` added to `branchLabels`; `expect(rows).toHaveLength(36)`; `Overall progress` allows `87% (184/212)`.
  - Reason: `P40-A` completed and `phase/40-agent-context-hygiene` added to Section 12 (Phase branch index).
- Ordered six gates: all run with actual exit codes recorded.

### CR-171 verification — complete CHANGELOG.md and add mandatory update rule (2026-11-25)

- **Changelog backfill (`CHANGELOG.md`):** Populated verified entries from `docs/releases/published/` and `docs/releases/release-history.md` for all five published releases: `[1.3.0] - 2026-11-22`, `[1.2.0] - 2026-11-11`, `[1.1.1] - 2026-11-09`, `[1.1.0] - 2026-11-08` (correcting the prior `TBD` date and incomplete summary), and `[1.0.0] - 2026-11-07`, keeping `[Unreleased]` at the top.
- **Release-process rule wiring:** Added mandatory per-release `CHANGELOG.md` update requirements (with no version/date assignment before owner authorization of release-candidate preparation) to `AGENTS.md`, `docs/releases/README.md`, `docs/releases/TEMPLATE.md`, and `docs/releases/RELEASE_PROMPT.md`.
- **About screen verification:** Verified `app/about.tsx` and `src/components/__tests__/AboutScreen.test.tsx` already point to `https://github.com/sahilsheikh-dev/WealthWise/blob/main/CHANGELOG.md` and pass unchanged.
- **Regression assertions:** Added `completes CHANGELOG.md for all published releases and enforces per-release updates under CR-171` in `src/lib/__tests__/progressLedger.test.ts` (issue `#566`).
- Ordered six gates: all run with actual exit codes recorded.

### CR-170 verification — record owner-reported physical-device check O85 as Pass (2026-11-25)

- **Device checklist update:** Marked `O85` as `Pass` in `docs/releases/device-test-checklist.md` under `## Next release device checks` (`App version: TBD`) with owner-confirmed metadata (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`), preserving description and ID. All `## Next release device checks` entries are now Pass.
- **Replaced assertions (`progressLedger.test.ts`):**
  - Old assertion: `expect(checklist).toMatch(/\|\s*O85\s*\|[^|]+\|\s*Not run\s*\|/)` (in P39-E-R1/CR-169 test).
  - Replacement: `expect(checklist).toMatch(/\|\s*O85\s*\|[^|]+\|\s*Pass\s*\|/)`.
  - Reason: Owner confirmed physical-device check `O85` passed on `2026-11-25` (issue `#565`).
- Ordered six gates: all run with actual exit codes recorded.

### CR-169 verification — Expo SDK 58 major upgrade and `DEC-P39-DEPS-01` resolution (`P39-E-R1`) (2026-11-25)

- **SDK 58 upgrade:** Upgraded `expo` to `^58.0.26`, `react-native` to `0.88.1`, `react`/`react-dom` to `19.3.0`, `expo-router` to `~58.0.32`, and 27 additional Expo/React Native/Jest/ESLint packages to SDK 58 compatible versions (with `--legacy-peer-deps` due to `@react-native-community/datetimepicker@9.2.1`'s optional `react-native-windows` peer dependency), plus `@react-native/jest-preset` and `react-test-renderer@19.3.0`.
- **Advisory verification (`DEC-P39-DEPS-01`):** `npm ls decode-uri-component` is empty (`(empty)`), and `npm audit` reports 0 critical and 0 high vulnerabilities (27 moderate advisories remain in dev/CLI tooling `glob` and `minimatch`).
- **Compatibility & config updates:** Updated `app/(tabs)/_layout.tsx` to use `BottomTabBarProps.navigateToTab(route.key)`, wrapped `onPress` handlers in `app/ef-allocation-form.tsx`, `app/onboarding.tsx`, and `app/profile-form.tsx` for RN 0.88 `GestureResponderEvent` compatibility, added `expo-modules-core` path resolution in `jest.config.js`, and retained `expo-font` / `expo-status-bar` plugins added by `expo install --fix` in `app.json`.
- **Replaced assertions:**
  - `TabsLayout.test.tsx`: Old: `navigation: { navigate }` and `expect(navigate).toHaveBeenCalledWith('budget')`. Replacement: `navigateToTab` with `routes.map((name) => ({ key: '${name}-key', name }))` and `expect(navigateToTab).toHaveBeenCalledWith('budget-key')`. Reason: `expo-router@58` `BottomTabBarProps` replaced `navigation` with `navigateToTab`.
  - `progressLedger.test.ts`: Old: `expect(p39e).toContain('| Done |')`. Replacement: `expect(p39e).toContain('| Done; Revised by P39-E-R1 |')`. Reason: `P39-E` is revised by `P39-E-R1`.
- **Device verification:** Added `O85` (`Not run`) in `docs/releases/device-test-checklist.md`.
- Ordered six gates: all run with actual exit codes recorded (`20/20` `expo-doctor` checks passed).

### CR-168 verification — record owner-reported physical-device checks O83 and O84 as Pass (2026-11-25)

- **Device checklist update:** Marked `O83` and `O84` as `Pass` in `docs/releases/device-test-checklist.md` under `## Next release device checks` (`App version: TBD`) with owner-confirmed metadata (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`), preserving descriptions and IDs.
- **Replaced assertions (`progressLedger.test.ts`):**
  - Old assertions: `expect(checklist).toMatch(/\|\s*O83\s*\|[^|]+\|\s*Not run\s*\|/)` and `expect(checklist).toMatch(/\|\s*O84\s*\|[^|]+\|\s*Not run\s*\|/)`.
  - Replacement: `expect(checklist).toMatch(/\|\s*O83\s*\|[^|]+\|\s*Pass\s*\|/)` and `expect(checklist).toMatch(/\|\s*O84\s*\|[^|]+\|\s*Pass\s*\|/)`.
  - Reason: Owner confirmed physical-device checks `O83` and `O84` passed on `2026-11-25` (issue `#559`).

### CR-167 verification — remote-snapshot refresh, rule updates, and Model A issue backfill (2026-11-25)

- **Remote snapshot refresh:** Ran `bash scripts/export-remote-snapshot.sh` at `2026-11-25T12:28:13+05:30` (`develop=f3da01070eebeef2057da54518db2a79f7ab6cb9`), updating `/tmp/wealthwise/remote-snapshot/` after PRs `#546` and `#547`.
- **Standing rule updates:** Updated `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/README.md`, and `docs/memory/working-style.md` so agents/owners refresh the remote snapshot via `scripts/export-remote-snapshot.sh` whenever remote state changes or at task start if stale, and create/close a corresponding Model A GitHub issue immediately if any approved work lacks one.
- **Missing Model A GitHub issues created and closed:** Created and closed `#548` (`CR-159`), `#549` (`CR-160`), `#550` (`CR-161`), `#551` (`CR-162`), `#552` (`CR-163`), `#553` (`CR-164`), `#554` (`CR-165`), and `#555` (`P39-H-R1` / `CR-166`) with verified commits, PRs, merge SHAs, and gate evidence; created `#556` for `CR-167` (closed upon merge to `develop`).
- **Tests:** Added regression assertions in `src/lib/__tests__/progressLedger.test.ts`; all six ordered gates run.

### CR-166 verification — P39 audit remediations and SDK 57 patch alignment (`P39-H-R1`) (2026-11-25)

- **SQLite fallback warning (`P39-D`):** Added `src/data/sqliteFallback.ts` and wired `onSQLiteFailure` in `src/data/stateStorage.native.ts` to preserve `console.warn` logging while notifying `src/data/store.ts` (`storageWarning` + `dismissStorageWarning` in `src/data/createAppStore.ts`) so `src/components/StorageErrorBanner.tsx` displays `"Primary database unavailable; using backup local storage. Your data is preserved."` without implying data loss.
- **Explicit modal routes (`P39-A`):** Added `<Stack.Screen ... options={{ presentation: 'modal' }} />` in `app/_layout.tsx` for `ef-allocation-form`, `holding-valuation-form`, `liability-closure-form`, `liability-closure-note-form`, and `recurring-plan-stop-form`.
- **Deep-link parameter handling (`P39-A`):** Added `src/lib/routeParams.ts` (`singleParam`, `closeRouteSafely`) across form/reminder/due routes so missing or invalid `wealthwise://` params fail gracefully and exit to a safe route even on cold deep-link launch (`router.canGoBack() === false`).
- **Production stress-data bundle (`P39-B`):** Replaced static `createStressData` import in `src/data/createAppStore.ts` with `__DEV__`-guarded `require('../domain/stressData')`, keeping `buildDemoData` / Demo Mode intact and excluding stress fixtures from production Android and iOS Hermes bundles.
- **Expo SDK 57 patch alignment (`P39-E`):** Updated the 8 SDK 57 packages via npm (`expo` `~57.0.34`, `expo-build-properties` `~57.0.24`, `expo-constants` `~57.0.25`, `expo-notifications` `~57.0.26`, `expo-router` `~57.0.32`, `expo-sharing` `~57.0.27`, `expo-splash-screen` `~57.0.12`, `expo-sqlite` `~57.0.7`); `DEC-P39-DEPS-01` (`decode-uri-component@0.2.2`) remains accepted until the next planned Expo SDK major upgrade.
- **Tests & device checks:** Added `src/components/__tests__/P39AuditRemediations.test.tsx`, updated `src/lib/__tests__/progressLedger.test.ts` (updated `P39-H` status assertion from `| Done |` to `| Done; Revised by P39-H-R1 |` and overall progress regex to include `182/211` because `P39-H-R1` revises `P39-H`), and added physical-device checks `O83` and `O84` (`Not run`) in `docs/releases/device-test-checklist.md`.
- Ordered six gates: all run with actual exit codes recorded.

### CR-165 verification — temporary artifact organization and exporter relocation (2026-11-25)

- **Organized `/tmp/wealthwise/` (outside Git):**
  - `remote-snapshot/`: `177` files (moved from `/tmp/wealthwise-remote-snapshot/`, including snapshots and `owner-terminal-*.log`).
  - `reports/`: `59` files (audit reports, label reconciliation JSONs, PR draft bodies, progress/findings notes).
  - `logs/`: `74` files (gate logs, `doctor`/`lint`/`tsc`/`export` outputs, CM-2/PR logs, temporary helper scripts).
  - `build-artifacts/`: `2` files (`WealthWise-android-latest-v1.3.0.apk`, `WealthWise-android-v1.2.0.apk`).
  - Total moved: `312` files; `0` conflicts; unrelated `/tmp` system/editor files left unmoved.
- **Exporter relocation & safety verification:**
  - Moved `~/export-remote-snapshot.sh` to `scripts/export-remote-snapshot.sh` preserving permissions (`-rw-r--r--`).
  - Verified WealthWise-specific scope (`REPO=sahilsheikh-dev/WealthWise`) and zero embedded credentials/tokens (uses owner-authenticated `gh` CLI).
  - Updated output path to `/tmp/wealthwise/remote-snapshot/` and usage path to `bash scripts/export-remote-snapshot.sh`.
- **Documentation & tests:**
  - Updated standing path references in `AGENTS.md`, `docs/memory/README.md`, and `docs/memory/rules.md`.
  - Current-path note: historical ledger entries above retain their original `/tmp/wealthwise-remote-snapshot/` and `/tmp/wealthwise-*` paths without rewriting past evidence; those artifacts now reside under `/tmp/wealthwise/`.
  - Updated `src/lib/__tests__/branchingDocs.test.ts` (replaced `/tmp/wealthwise-remote-snapshot/owner-terminal-$(date +%F).log` and `export-remote-snapshot.sh` assertions with `/tmp/wealthwise/remote-snapshot/owner-terminal-$(date +%F).log` and `scripts/export-remote-snapshot.sh` because the exporter and snapshot directory were relocated under CR-165) and `src/lib/__tests__/progressLedger.test.ts` (updated the 8 report paths for P43-E and P39-A/B/D/E/F/G/H from `/tmp/wealthwise-*.md` to `/tmp/wealthwise/reports/wealthwise-*.md` to match the organized `/tmp/wealthwise/reports/` layout).
- Ordered six gates: all run with actual exit codes recorded.

### CR-164 verification — resolve DEC-P39-DEPS-01 by owner approval (2026-11-25)

- **Decision recorded (`DEC-P39-DEPS-01`):** Resolved by explicit owner approval on 2026-11-25 to accept the `decode-uri-component@0.2.2` ReDoS risk until the next planned Expo SDK upgrade.
- **Repository evidence:**
  - `package.json` pins `expo: "~57.0.33"` and `expo-router: "~57.0.31"`.
  - `npm ls` / `npm audit` confirms `decode-uri-component@0.2.2` is transitive via `expo-router@57.0.31` -> `query-string@7.1.3` (`GHSA-vcc3-ghjq-m6fr` Moderate `<=0.4.2`; `GHSA-qr28-fpjm-wq7f` High `<=0.5.0`), with automated fix requiring SemVer-major `expo-router@58.0.32` (Expo SDK 58).
  - Mitigated by 100% offline-first runtime (`src/lib/__tests__/offlineRuntime.test.ts`) and internal routing (`scheme: "wealthwise"` in `app.json`). The vulnerability is **not** fixed; no dependencies were modified.
  - Follow-up condition: re-evaluate during the next planned Expo SDK upgrade.
- Updated `docs/PROGRESS.md`, `docs/memory/decisions.md`, `docs/memory/status.md`, `docs/memory/open-items.md`, and `src/lib/__tests__/progressLedger.test.ts`.
- Ordered six gates: all run with actual exit codes recorded.

### CR-163 verification — historical PR label reconciliation and DEC-P39-DEPS-01 review (2026-11-25)

- **Fresh remote snapshot:** Exported via `export-remote-snapshot.sh` at `2026-11-25T10:01:47+05:30` with terminal session capture in `/tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-25.log`.
- **Historical PR label reconciliation:**
  - Audited all 277 PRs (276 `MERGED`, 1 `CLOSED` [#39]).
  - PR #39 already carried complete labels (`phase:p01`, `type:chore`, `status:superseded`, `wontfix`).
  - Applied missing taxonomy labels to 276 PRs (`ok=276, fail=0`, 0 new taxonomy labels created; corrected 21 legacy `phase:p28` draft entries to `lifecycle:qa-and-release`; added missing `status:done` to PRs #538 and #539).
  - Post-update verification confirmed 277/277 PRs labeled and 0 unlabeled.
  - Detailed plan and application results recorded in `/tmp/wealthwise-pr-label-reconciliation.json` and `/tmp/wealthwise-pr-label-apply-results.json`.
- **DEC-P39-DEPS-01 verification (Open — Pending owner confirmation):**
  - `npm ls` and `npm audit --json` confirmed `decode-uri-component@0.2.2` is transitive via `expo-router@57.0.31` -> `query-string@7.1.3`.
  - Advisories: `GHSA-vcc3-ghjq-m6fr` (Moderate, `<=0.4.2`) and `GHSA-qr28-fpjm-wq7f` (High, `<=0.5.0`).
  - Upstream fix requires SemVer-major `expo-router@58.0.32` (Expo SDK 58), incompatible with installed Expo SDK 57 (`expo@57.0.33`).
  - Mitigated by 100% offline-first runtime (`offlineRuntime.test.ts`); no dependencies upgraded and decision remains open for owner confirmation.
- **Future tracking rules:** Verified `AGENTS.md`, `docs/memory/rules.md`, and `docs/memory/working-style.md` already enforce PR/issue labels and commit/PR/merge evidence without gaps.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert CR-163 and open `DEC-P39-DEPS-01` tracking.

### CR-162 verification — record physical-device checks O81 and O82 as Pass (2026-11-24)

- Recorded owner-reported physical-device verification for checks O81 and O82 as `Pass` in `docs/releases/device-test-checklist.md`:
  - `O81`: Dynamic asset valuation inputs and calculations (P29-U-R1) tested and validated Pass on physical device.
  - `O82`: Consistent filter panels and absence of filter icon dot indicator (P20-L-R1) tested and validated Pass on physical device.
  - Metadata confirmed by owner: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-24.
- Resolved pending physical-device check open items in `docs/memory/open-items.md` and updated `docs/memory/status.md`.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert CR-162 and Pass status for O81 and O82.
- Ordered six gates: all run and pass.

### CR-161 verification — PR #39 reconciliation, PR/issue label policy, and future tracking (2026-11-24)

- PR #39 reconciliation:
  - Verified historical PR #39 (`DO_NOT_MERGE-Refactor code structure for improved readability and maintainability`) as Closed Unmerged.
  - Head branch `phase/01-mobile-foundation`, commit `b779c21c0b67113d8df8125ec87b9eaf7d69fb7a`, targeting `main`.
  - Content verified: 71 files, 62,293 insertions, strictly in `coverage/` directory; zero application code changes.
  - Applied labels: `phase:p01`, `type:chore`, `status:superseded`, `wontfix`.
  - Updated PR #39 description on GitHub with verified historical facts, commit analysis, and ancestry connection.
  - Ancestry and release attribution: commit `b779c21` was brought into repository ancestry in P28-E-R3 (2026-11-09) via merge commit `0697d88` (`chore: record P1 refactor ancestry`) using `ours` merge strategy, merged via PR #47 and PR #48 to `develop`, and released in `v1.1.1` (PR #69, `ce90a13`).
  - PR #39 remains truthfully Closed Unmerged; no code missing, no reopening, and no further merge required.
- Full PR and Issue label audit (273 PRs, 261 Issues):
  - Audited all 273 PRs: 272 merged, 1 closed unmerged (#39), 0 open.
  - Proposed label mapping generated across milestones (`v1.1.0`: 38, `v1.1.1`: 31, `v1.2.0`: 55, `v1.3.0`: 92, `v1.3.1`: 57), types (`type:docs`: 163, `type:feat`: 30, `type:fix`: 30, `type:audit`: 26, `type:chore`: 21, `type:test`: 3), and standard semantics (`documentation`: 176, `bug`: 30, `enhancement`: 30, `wontfix`: 1).
  - Preserved all 261 Model A issues (232 closed, 29 open).
  - Persisted audit report in `/tmp/wealthwise-pr-issue-audit-report.md` and data mapping in `/tmp/wealthwise-pr-label-audit.json`.
- Policy & test enforcement:
  - Updated `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/working-style.md`, and `docs/releases/release-history.md`.
  - Added automated test assertions to `src/lib/__tests__/progressLedger.test.ts`.
- Schema remains version 24.

### CR-160 verification — GitHub issue reconciliation and test-enforced ongoing tracking (2026-11-24)

- Reconciled complete GitHub issue history backfill and ongoing issue tracking across all 261 Model A items (#270–#531):
  - 29 open planned roadmap issues (milestone `Planned`, `status:planned`): updated issue bodies with detailed scope, dependencies, status, and semantic standard labels (`enhancement`, `bug`, `documentation`).
  - 232 completed retrospective issues (closed, original historical dates): added semantic standard labels (`enhancement` for feature work, `bug` for defect fixes, `documentation` for documentation/process) while preserving closed state, verifiable evidence, and original timestamps without backdating.
  - Zero duplicate issues created; reused exact 261 verified issue numbers #270–#531.
  - Public safety verified: zero personal financial amounts, account numbers, secrets, tokens, or private audit findings in any issue.
  - Output mapping verified and persisted in `/tmp/wealthwise-issue-mapping-verified.json`.
- Test enforcement:
  - Updated `AGENTS.md`, `docs/memory/rules.md`, and `docs/memory/working-style.md` to define semantic standard labels and ongoing tracking protocol.
  - Extended `src/lib/__tests__/progressLedger.test.ts` to assert that issue tracking rules, semantic standard labels, and CR-160 are enforced by automated test suite.
- Schema remains version 24.

### CR-159 verification — GitHub issue history backfill and ongoing issue tracking (2026-11-24)

- Executed complete GitHub issue history backfill and ongoing issue tracking setup approved under P43-E / CR-150.
- Repository metadata configuration:
  - Created 7 release milestones on GitHub: `v1.0.0`, `v1.1.0`, `v1.1.1`, `v1.2.0`, `v1.3.0`, `v1.3.1`, and `Planned`.
  - Created 54 taxonomy labels: 6 types (`type:feat`, `type:fix`, `type:docs`, `type:chore`, `type:test`, `type:audit`), 4 statuses (`status:planned`, `status:done`, `status:superseded`, `status:cancelled`), 4 lifecycles (`lifecycle:documentation`, `lifecycle:cleanup`, `lifecycle:qa-and-release`, `lifecycle:schema-migration`), and 41 phases (`phase:p01`–`phase:p44`, excluding reserved slots P27, P28, P32).
- Historical backfill execution (Model A):
  - Created exactly 261 issues mapping 1:1 to 210 active dashboard subtasks and 51 standalone lifecycle Change Requests.
  - 232 completed issues created with verified historical ledger dates, owning phases, deliverable descriptions, and commit/PR evidence, commented with standardized retrospective completion summaries, and closed. Server timestamps preserved without backdating.
  - 29 open roadmap issues created with `status:planned` under milestone `Planned` across 9 planned roadmap areas (P7, P33–P38, P40, P44).
  - Rate-limited inter-request delays (1.5s–2.0s) strictly adhered to; zero secondary rate limit violations or abuse blocks.
  - Execution state tracked in `/tmp/wealthwise-issue-backfill-state.json` and execution log recorded in `/tmp/wealthwise-issue-backfill-execution.log`.
  - Verified 100% public-safety: zero personal financial amounts, account numbers, secrets, tokens, or private audit findings in any issue title or body.
- Ongoing tracking protocol documented:
  - Updated `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/working-style.md`, and `docs/memory/README.md` to establish the ongoing issue tracking rule.
- Regression tests added to `src/lib/__tests__/progressLedger.test.ts`.
- Schema remains version 24.

### CR-158 verification — consistent filter panels and dot removal (P20-L-R1) (2026-11-24)

- Implemented consistent filter panels across all 5 screens with a header filter icon: Goals, Assets, Liabilities, Transactions, and Budget.
- Goals screen (`app/(tabs)/goals.tsx`):
  - Added filter state for `statusFilter` (`All`, `In progress`, `Achieved`) and `yearFilter` (`All`, dynamic target year numbers).
  - Dynamically extracts available target years from `goals` list.
  - Composes status and target year filters with search query and sorting.
  - Automatically expands the Achieved goals section when `statusFilter === 'Achieved'`.
  - Added `EmptyState` when filter/query combination matches zero goals.
- Removed the header filter icon's dot indicator everywhere:
  - Removed `showIndicator: filterActive` from `AppHeader` `rightActions` across all 5 screens (`goals.tsx`, `assets.tsx`, `liabilities.tsx`, `transactions.tsx`, `budget.tsx`).
  - Confirmed the dot indicator remains absent initially and after changing either sorting or filtering on any screen.
- Maintained strict independence between sorting preferences and filter selections.
- Regression test coverage:
  - Added `src/components/__tests__/ConsistentFilterPanels.test.tsx` (10/10 tests passing) verifying Goals filter controls, status/year filtering, 'All' reset, and absence of dot indicator across all 5 screens.
  - Updated test assertions:
    - `src/components/__tests__/RouteRenderSmoke.test.tsx`: replaced old assertion expecting `showIndicator: true` and length 1 with `toBeFalsy()` and length 0 across Transactions, Assets, Liabilities.
    - `src/components/__tests__/BudgetCategoryFilter.test.tsx`: replaced old assertion expecting length 1 when category filtered with length 0.
- Added physical-device check `O82` in `Not run` status to `docs/releases/device-test-checklist.md` under `## Next release device checks` (metadata confirmed: realme Narzo 60 Pro 5g, 15 Vanilla Ice Cream, sahilsheikh-dev, 2026-11-24).
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P20-L-R1 Done, CR-158 ledger records, and `O82` in `expectedIds`.
- Preserved schema version 24.

### CR-157 verification — release audit remediation plan (P39-H) (2026-11-24)

- Synthesized all findings from P39-A through P39-G into three independent, prioritized remediation batches:
  1. *Batch 1 (Containment & Storage Fallback Visibility):* Route `onSQLiteFailure` in `src/data/stateStorage.native.ts` to surface a persistent degradation banner in `StorageErrorBanner.tsx`; extend runtime tests.
  2. *Batch 2 (Bundle Treeshaking & Route Registration):* Decouple static imports of demo and stress mock fixtures in `createAppStore.ts` via dynamic `import(...)` guarded by `__DEV__` to eliminate mock bytecode from production Hermes binaries; register missing stack modal screens in `app/_layout.tsx`.
  3. *Batch 3 (Dependency Monitoring & SDK Alignment):* Track upstream Expo SDK updates for `decode-uri-component` ReDoS patch resolution under owner decision `DEC-P39-DEPS-01`.
- Defined clear rollback strategies, containment-first sequencing, and explicit owner decision gates.
- Confirmed report-first scope: pure remediation planning; zero application code changes made.
- Detailed report written to `/tmp/wealthwise-p39-h-remediation-plan.md`.
- Schema version remains 24.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-H Done and CR-157 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-156 verification — clean-install and first-launch walkthrough (P39-G) (2026-11-24)

- Conducted exhaustive clean-install walkthrough across boot sequence, splash screen dismissal, onboarding gate, reminder permission prompting, first transaction creation, and error/denial paths.
- Verified boot sequence & hydration: `SplashScreen.preventAutoHideAsync()` prevents layout flashes; `OnboardingScreen` gates un-onboarded state; back button cleanly exits app via `BackHandler.exitApp()`.
- Verified non-modal reminder prompt bottom sheet (`FirstLaunchReminderPrompt`): mounts on Home tab when `meta.remindersPromptHandled === false`; permission denial gracefully marks prompt handled without re-prompt nag.
- Verified first transaction creation and validation: Zod schema enforces positive amount; single-action persistence cleanly writes state.
- Verified denied and interrupted paths: biometrics denial falls back to OS passcode or bypasses lock cleanly; storage fallback triggers gracefully.
- Findings recorded to feed future Phase P37 tutorials and walkthrough planning.
- Detailed report written to `/tmp/wealthwise-p39-g-clean-install-walkthrough.md`.
- Pure audit/documentation scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-G Done and CR-156 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-155 verification — test debt, TODO markers, and skipped test audit (P39-F) (2026-11-24)

- Audited codebase for developer debt markers: verified zero `TODO`, `FIXME`, `HACK`, `XXX` comments across all source files in `app/`, `src/`, config files, and tests.
- Investigated the single skipped test in the Jest suite (`src/domain/__tests__/stressData.test.ts#L93`, `L269-L331`):
  - Confirmed test is conditionally skipped by default via `process.env.WEALTHWISE_STRESS_BENCHMARK === '1' ? it : it.skip`.
  - Confirmed reason: benchmark generates 50y, 100y, and dense 126y datasets (20,000+ transactions) taking ~180 seconds, which would unacceptably slow regular test and CI runs.
  - Assigned disposition: documented architectural exception, preserved as opt-in via environment flag.
- Verified test suite integrity: confirmed zero weakened assertions across all 115 test suites.
- Detailed report written to `/tmp/wealthwise-p39-f-test-debt-audit.md`.
- Pure audit/documentation scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-F Done and CR-155 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-154 verification — dependency risk and CVE review (P39-E) (2026-11-24)

- Evaluated all 1,124 dependencies (706 production, 395 development, 51 optional, 12 peer) using `npm audit`.
- Triaged 11 reported advisories (0 critical, 3 high, 8 moderate):
  - *Production-reachable:* `decode-uri-component` (<= 0.5.0) via `query-string` in `expo-router` has High/Moderate ReDoS advisories (`GHSA-qr28-fpjm-wq7f`, `GHSA-vcc3-ghjq-m6fr`). Mitigated by WealthWise's 100% offline-first architecture; requires upstream Expo SDK upgrade (tracked under owner decision `DEC-P39-DEPS-01`).
  - *Developer tooling:* `minimatch`, `tar`, `micromatch`, and `braces` advisories affect build/lint tooling only and are not reachable in compiled production bundles.
- Preserved strict policy: zero `npm audit fix --force` and zero install-script approvals.
- Detailed report written to `/tmp/wealthwise-p39-e-dependency-risk-audit.md`.
- Pure audit/documentation scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-E Done and CR-154 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-153 verification — silent failures and recovery-state audit (P39-D) (2026-11-24)

- Delivered deep audit of silent failure modes and recovery states across storage, backup import/export, notifications, and SQLite fallback.
- Audited two-tier SQLite + AsyncStorage storage architecture (`sqliteStateStorage.ts`): identified P2 finding in `src/data/stateStorage.native.ts` where `onSQLiteFailure` is passed as `undefined`, meaning fallback to legacy storage emits only a `console.warn` without a user-visible degradation banner.
- Verified backup import and export recovery (`backup.ts`, `backupCrypto.ts`): verified clean handling of corrupted JSON, schema mismatches, tampered/invalid AES-256-GCM ciphertexts, and 25MB/35MB size caps; verified `undoImport` snapshot functionality in `createAppStore.ts`.
- Verified notification scheduling error handling (`reminders.ts`): non-blocking warning logging without state corruption.
- Verified state reset and unrecoverable error handling: confirmed clean fallback and error boundaries.
- Detailed report written to `/tmp/wealthwise-p39-d-recovery-audit.md`.
- Pure audit/documentation scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-D Done and CR-153 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-152 verification — security, network boundary, and debug residue audit (P39-B) (2026-11-24)

- Delivered security, network boundary, and debug residue verification across tracked files, Git history, EAS config, and exported bundles.
- Verified zero leaked credentials or `.env` files; verified zero `debugger` statements; verified zero source maps in `dist/`.
- Inspected exported Hermes bytecode in `dist/`: proved dev menu unreachable at runtime, but confirmed static imports of mock/stress fixtures in `createAppStore.ts` bundle fixtures into production binary (P2 finding).
- Added regression test coverage for the no-network boundary in `src/lib/__tests__/offlineRuntime.test.ts`, explicitly forbidding `EventSource` and `sendBeacon` alongside `fetch`, `XMLHttpRequest`, and `WebSocket`.
- Detailed report written to `/tmp/wealthwise-p39-b-security-debug-audit.md`.
- Pure audit/documentation scope with boundary regression test; schema version remains 24; no application behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-B Done and CR-152 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-151 verification — master read-only codebase audit (P39-A) (2026-11-24)

- Delivered read-only master audit covering 12 focus areas: dead code, secrets/config, app lock, notification response routes, deep links, silent failures, performance, dependencies, debug residue, TODO debt, permissions, and first launch.
- Recorded 12 findings with file/line evidence and P0–P3 severities; zero P0/P1 blockers identified.
- Detailed report written to `/tmp/wealthwise-p39-a-master-audit.md`.
- Pure audit and documentation scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P39-A Done and CR-151 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

### CR-150 verification — GitHub issue inventory and execution planning (P43-E) (2026-11-24)

- Delivered complete documentation and repository-process inventory and execution planning for P43-E:
  1. *Inventory & Breakdown:* Verified 209 active dashboard subtasks (173 done, 36 planned) and 145 change requests in `docs/PROGRESS.md`. Mapped 94 CRs to specific subtask parts/revisions and 51 CRs to standalone repository lifecycle activities (documentation, cleanup, QA/release, schema-migration, rules).
  2. *Deduplication & Issue Volume:* Evaluated three models; confirmed Model A (atomic ledger mapping of 209 subtask issues + 51 standalone CR issues = 260 total issues; 224 closed retrospective, 36 open planned) as the optimal approved strategy preserving full traceability without artificial consolidation.
  3. *Metadata & Taxonomy:* Designed phase/lifecycle labels (`phase:p01`–`phase:p44`, `lifecycle:*`), type labels (`type:feat`, `type:fix`, `type:docs`, `type:chore`, `type:test`, `type:audit`), status labels (`status:done`, `status:planned`, `status:superseded`, `status:cancelled`), and release milestones (`v1.0.0`, `v1.1.0`, `v1.1.1`, `v1.2.0`, `v1.3.0`, `v1.3.1 (Next release)`, `v1.4.0 (Planned)`).
  4. *Truthful Timestamps & Body Contract:* Specified issue body format capturing original ledger dates, owning phase, placement rationale, and verified Git commits, PR numbers, and first-parent merge SHAs; standardized retrospective closure comments for completed work; confirmed GitHub server timestamps cannot and will not be backdated.
  5. *API Rate Limits & Batching:* Mitigated primary (5,000 req/hr) and secondary abuse limits via a 7-stage batch execution schedule with 2–3 second inter-request pacing; recommended notification muting during bulk creation.
  6. *Governance Boundary:* Zero GitHub issues were created, edited, commented on, or closed during this task; confirmed that issue creation requires a separate, dedicated execution task. Detailed report persisted to `/tmp/wealthwise-p43-e-issue-inventory-plan.md`.
- Pure documentation and repository-process scope; schema version remains 24; no runtime behavior changed.
- Updated `src/lib/__tests__/progressLedger.test.ts` to assert P43-E Done and CR-150 ledger entries.
- Ordered six gates run: Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 on upstream expo-sqlite ~57.0.6 patch advisory (20/21 checks passed).

> Earlier verification matrix records (CR-149 and earlier) are archived in [memory/archive/verification-matrix.md](memory/archive/verification-matrix.md).

## 11. Session and release log

### DOCS-REMOTE-SYNC-2026-11-22
- Local-only reconciliation uses the owner snapshot exported at `2026-11-22T11:12:56+05:30` plus a terminal transcript reconstructed from chat pastes (not an original capture). The snapshot has all 183 PRs, zero open PRs, zero issues, 42 remote branches and 51 tags. PR #39 is closed unmerged; all other numbers #1–#183 are merged. Remote phase branches are retained and merged task branch refs are absent. `develop` is `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db`; schema v24 and `.premigration.v23` handling are present. D3 tip `5424171b5eee69dc70606c8664da2e2f5c3f2e71`, origin phase and origin develop share tree `e56c0b89c671ff3c23bdd96886bfd2d8090f45cc`.
- Snapshot confirms PR #181's corrected body and comment #7067953238; PR #179's Gate 4 comment #7067676816; PR creators, mergers, merge times and SHAs for #179–#183. Reconstructed terminal evidence records both no-commits PR attempts at 01:19/01:20 IST (before pushes), Gate 4 on phase at 00:29 (exit not captured), develop at 00:51 (exit 1) and D3 task at 01:17 (exit 1; task tip 5424171). All captured runs show 20/21 and six known SDK 57 patch mismatches.
- The full inventory and all 1–183 PR-number dispositions are retained under `/tmp/sync/`. GitHub release v1.2.0 is latest and matches release-history; release documentation is unchanged. This task's Gate 4 was already invoked once in the previous continuation, with exit not captured, and was not rerun. O61–O74 remain Not run. This reconciliation updates R8 evidence instructions; test assertion replacements and reasons are recorded below. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, history map and touched files; related documentation lifecycle/CR-118; reason: permanent remote-state and evidence-process reconciliation.

### Owner-run actions log

Remote actions are logged only from owner terminal text, snapshot JSON or Git
refs. Terminal lines in the supplied file were reconstructed from the owner's
chat pastes and are not an original session capture. Snapshot timestamps and
merge metadata are authoritative for PR records. The original PR #181 body
claimed D3 integration; its corrected body and comment below preserve that
history without treating the original description as fact.

| Date and time (IST and UTC) | Evidence kind | Action | Branch or PR | SHA | Result | Source file |
|---|---|---|---|---|---|---|
| 2026-11-21 22:02:13 IST / 2026-11-21 16:32:13 UTC | remote snapshot | Create PR #178 (author sahilsheikh-dev) | task/P20-A-R3-linked-savings-paid-transactions → phase/20-budget | `b16bd5ef21c3cfc750c8ba4d7f330fb125481ccf` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-21 22:02:55 IST / 2026-11-21 16:32:55 UTC | remote snapshot | Merge PR #178 (mergedBy sahilsheikh-dev) | task/P20-A-R3-linked-savings-paid-transactions → phase/20-budget | `e1e2fc9cb6472daf6ec121d65e9075e421ceadde` | Merged 2026-11-21T16:32:55Z; merged. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-21 22:04:04 IST / 2026-11-21 16:34:04 UTC | remote snapshot | Create PR #179 (author sahilsheikh-dev) | phase/20-budget → develop | `e1e2fc9cb6472daf6ec121d65e9075e421ceadde` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:30:04 IST / 2026-11-21 19:00:04 UTC | remote snapshot + reconstructed terminal | Merge PR #179 (mergedBy sahilsheikh-dev) | phase/20-budget → develop | `f7d40f47d00aa14969799461de25631ae16d98c8` | Merged 2026-11-21T19:00:04Z; phase branch retained. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:44:15 IST / 2026-11-21 19:14:15 UTC | remote snapshot | Create PR #180 (author sahilsheikh-dev) | task/P20-U-R1-budget-edit-delete → phase/20-budget | `9098bb54cd09e4c956adbd134acb46c6fbbfe10c` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:45:49 IST / 2026-11-21 19:15:49 UTC | remote snapshot + reconstructed terminal | Merge PR #180 (mergedBy sahilsheikh-dev) | task/P20-U-R1-budget-edit-delete → phase/20-budget | `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` | Merged 2026-11-21T19:15:49Z; task branch deleted, phase retained. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:46:29 IST / 2026-11-21 19:16:29 UTC | remote snapshot | Create PR #181 (author sahilsheikh-dev) | phase/20-budget → develop | `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:47:06 IST / 2026-11-21 19:17:06 UTC | remote snapshot + reconstructed terminal | Merge PR #181 (mergedBy sahilsheikh-dev) | phase/20-budget → develop | `22f332fe9310e92c50d94cc6640c19f4e1552dcc` | Merged 2026-11-21T19:17:06Z; phase branch retained. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 01:24:17 IST / 2026-11-21 19:54:17 UTC | remote snapshot | Create PR #182 (author sahilsheikh-dev) | task/P20-W-D3-custom-earned-income → phase/20-budget | `5424171b5eee69dc70606c8664da2e2f5c3f2e71` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 01:24:42 IST / 2026-11-21 19:54:42 UTC | remote snapshot + reconstructed terminal | Merge PR #182 (mergedBy sahilsheikh-dev) | task/P20-W-D3-custom-earned-income → phase/20-budget | `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b` | Merged 2026-11-21T19:54:42Z; task branch deleted, phase retained. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 01:25:08 IST / 2026-11-21 19:55:08 UTC | remote snapshot | Create PR #183 (author sahilsheikh-dev) | phase/20-budget → develop | `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b` | Created; snapshot record. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 01:25:31 IST / 2026-11-21 19:55:31 UTC | remote snapshot + reconstructed terminal | Merge PR #183 (mergedBy sahilsheikh-dev) | phase/20-budget → develop | `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db` | Merged 2026-11-21T19:55:31Z; phase branch retained. | /tmp/wealthwise-remote-snapshot/prs.json |
| 2026-11-22 00:29:21 IST / 2026-11-21 18:59:21 UTC | terminal paste (reconstructed from the owner's chat pastes) | Run Gate 4 on phase/20-budget; printed exit field was empty | phase/20-budget | `not captured` | 20/21; one failing check, six exact SDK 57 package patch mismatches. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 1) |
| 2026-11-22 00:29 IST / 2026-11-21 18:59 UTC | terminal paste + PR detail snapshot | Comment PR #179 with Gate 4 evidence | PR #179 | `issuecomment-7067676816` | Comment exists; created 2026-11-21T18:59:43Z. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 1); pr-179-detail.json |
| 2026-11-22 00:43:41 IST / 2026-11-21 19:13:41 UTC | terminal paste (reconstructed from the owner's chat pastes) | Push phase/20-budget | phase/20-budget | `cb363423384923ef19f00399cd380baba01e9e59` | Push succeeded. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); remote-branches.txt |
| 2026-11-22 00:43:53 IST / 2026-11-21 19:13:53 UTC | terminal paste (reconstructed from the owner's chat pastes) | Push task branch | task/P20-U-R1-budget-edit-delete | `9098bb54cd09e4c956adbd134acb46c6fbbfe10c` | Push succeeded. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); prs.json |
| 2026-11-22 00:44:01 IST / 2026-11-21 19:14:01 UTC | terminal paste (reconstructed from the owner's chat pastes) | Create PR #180 | task/P20-U-R1-budget-edit-delete → phase/20-budget | `9098bb54cd09e4c956adbd134acb46c6fbbfe10c` | Created; merged 00:44:16 IST; see snapshot merge record. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); prs.json |
| 2026-11-22 00:44:16 IST / 2026-11-21 19:14:16 UTC | terminal paste + PR snapshot | Merge PR #180 and delete task branch | PR #180 | `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` | Merged and task branch deleted; phase retained. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); prs.json; remote-branches.txt |
| 2026-11-22 00:46:05 IST / 2026-11-21 19:16:05 UTC | terminal paste + PR snapshot | Create PR #181 | phase/20-budget → develop | `5cf3360a55cbd57f97945f6bed4c7cb7a2a03478` | Created; merged 00:46:29 IST. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); prs.json |
| 2026-11-22 00:46:29 IST / 2026-11-21 19:16:29 UTC | terminal paste + PR snapshot | Merge PR #181; CM-2 fast-forward develop | PR #181 | `22f332fe9310e92c50d94cc6640c19f4e1552dcc` | Merged; develop synchronized. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 2); prs.json |
| 2026-11-22 00:50:41 IST / 2026-11-21 19:20:41 UTC | terminal paste (reconstructed from the owner's chat pastes) | Correct PR #181 body | PR #181 | `22f332fe9310e92c50d94cc6640c19f4e1552dcc` | Current body states this PR integrates U-R1 only. Original D3 claim retained as historical record. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 3); pr-181-detail.json |
| 2026-11-22 00:50:48 IST / 2026-11-21 19:20:48 UTC | terminal paste + PR detail snapshot | Add PR #181 correction comment | PR #181 | `issuecomment-7067953238` | Comment verified; created 2026-11-21T19:20:47Z. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 3); pr-181-detail.json |
| 2026-11-22 00:51:36 IST / 2026-11-21 19:21:36 UTC | terminal paste + Gate 4 file | Run Gate 4 on develop | develop | `22f332fe9310e92c50d94cc6640c19f4e1552dcc` | Exit 1; 20/21; only six SDK 57 patch mismatches. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 3); gate4-develop-0051IST-exit1.txt |
| 2026-11-22 01:17:34 IST / 2026-11-21 19:47:34 UTC | terminal paste + Gate 4 file | Run Gate 4 on D3 task branch at tip 5424171 | task/P20-W-D3-custom-earned-income | `5424171b5eee69dc70606c8664da2e2f5c3f2e71` | Exit 1; 20/21; same six patch mismatches. File was renamed from gate4-phase-d3 to gate4-task-d3. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 4); gate4-task-d3-0117IST-exit1.txt |
| 2026-11-22 01:19:02 IST / 2026-11-21 19:49:02 UTC | terminal paste (reconstructed from the owner's chat pastes) | Failed phase-to-develop PR creation attempt 1 | phase/20-budget | `not applicable` | Rejected: “No commits between develop and phase/20-budget”; the phase/task changes had not yet been pushed. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 4) |
| 2026-11-22 01:20:34 IST / 2026-11-21 19:50:34 UTC | terminal paste (reconstructed from the owner's chat pastes) | Failed phase-to-develop PR creation attempt 2 | phase/20-budget | `not applicable` | Rejected: “No commits between develop and phase/20-budget”; the phase/task changes had not yet been pushed. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 4) |
| 2026-11-22 01:23:58 IST / 2026-11-21 19:53:58 UTC | terminal paste (reconstructed from the owner's chat pastes) | Push synced phase branch | phase/20-budget | `b5f8c52477ba88dce1c376904c36dee72b84a092` | Push succeeded. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); remote-branches.txt |
| 2026-11-22 01:24:06 IST / 2026-11-21 19:54:06 UTC | terminal paste (reconstructed from the owner's chat pastes) | Push D3 task branch | task/P20-W-D3-custom-earned-income | `5424171b5eee69dc70606c8664da2e2f5c3f2e71` | Push succeeded. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); prs.json |
| 2026-11-22 01:24:19 IST / 2026-11-21 19:54:19 UTC | terminal paste + PR snapshot | Create PR #182 | task/P20-W-D3-custom-earned-income → phase/20-budget | `5424171b5eee69dc70606c8664da2e2f5c3f2e71` | Created; merged at 19:54:42 UTC. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); prs.json |
| 2026-11-22 01:24:23 IST / 2026-11-21 19:54:23 UTC | terminal paste + PR snapshot | Merge PR #182 and delete task branch | PR #182 | `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b` | Merged; task branch deleted; phase retained. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); prs.json; remote-branches.txt |
| 2026-11-22 01:24:57 IST / 2026-11-21 19:54:57 UTC | terminal paste + PR snapshot | Create PR #183 | phase/20-budget → develop | `4ee154bab1cbc9b0b491b87c2f8bfb5a843dca7b` | Created; merged at 19:55:31 UTC. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); prs.json |
| 2026-11-22 01:25:08 IST / 2026-11-21 19:55:08 UTC | terminal paste + PR snapshot | Merge PR #183; CM-2 synchronize develop | PR #183 | `b3fa175b999f3ae62e2b099a412f5a9e9da5f0db` | Merged; develop synchronized to snapshot tip. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed.txt (segment 5); prs.json; exported-at.txt |

| 2026-11-22 11:11:30 IST / 2026-11-22 05:41:30 UTC | terminal paste (reconstructed from the owner's chat pastes) | Move reconstructed transcript into the snapshot folder; move export script at 11:11:40 IST | `/tmp/wealthwise-remote-snapshot/` | not applicable | Supplied evidence files were organized for the snapshot and subsequent export. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22-reconstructed-2.txt (segment 6) |
| 2026-11-22 11:12:56 IST / 2026-11-22 05:42:56 UTC | terminal paste (reconstructed from the owner's chat pastes) | Export remote snapshot before PR #184/#185 | pre-#184/#185 remote state | `not captured` | Terminal segment shows the export command and completed file listing, followed by the 11:12:56 IST prompt; the original `exported-at.txt` was overwritten by the later refresh, so the exact first snapshot stamp and tip are not available in the retained snapshot file. | owner-terminal-2026-11-22-reconstructed-2.txt (segment 6); current exported-at.txt (refreshed snapshot) |
| 2026-11-22 11:13:17 IST / 2026-11-22 05:43:17 UTC to 11:37:46 IST / 06:07:46 UTC | terminal session recording (script) | Start and end owner recording session | Owner terminal | not applicable | Recording contains only shell start/prompt/exit; no GitHub actions or push commands are captured. Correction (2026-11-22): comparison with reconstructed terminal paste segments 7–8 confirms this script log is incomplete: the pushes, PR operations, CM-2 and Gate 4 command are absent from the 2,188-byte recording; those actions are documented from the reconstructed paste below. | /tmp/wealthwise-remote-snapshot/owner-terminal-2026-11-22.log; owner-terminal-2026-11-22-reconstructed-2.txt (segments 7–8) |
| time not recorded / time not recorded | remote snapshot | Remote PR head confirms task branch was published for PR #184; exact push event/time not captured | task/docs-remote-sync-2026-11-22; PR #184 | `c14fc2a420f0efc791813ab5cc2f42d0a15ef5fc` | PR head OID is present; task branch is absent from current remote branch list after merge. No push time or deletion command inferred. Correction (2026-11-22): reconstructed terminal paste shows the task branch push at 11:33:15 IST / 06:03:15 UTC and confirms `gh pr merge --delete-branch`; `git fetch --all --prune` at 11:34:30 IST removed the remote task ref. | /tmp/wealthwise-remote-snapshot/prs.json; refs.txt; remote-branches.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| time not recorded / time not recorded | remote snapshot | Remote documentation branch tip present for PR #185; exact push event/time not captured | documentation; PR #185 | `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea` | PR head OID and `origin/documentation` ref agree at snapshot; branch remains listed. Correction (2026-11-22): reconstructed terminal paste shows `git push -u origin documentation` at 11:33:08 IST / 06:03:08 UTC; output confirms remote update `bfe86c5..e5808c4`. | /tmp/wealthwise-remote-snapshot/prs.json; refs.txt; remote-branches.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| 2026-11-22 11:33:25 IST / 2026-11-22 06:03:25 UTC | remote snapshot + terminal paste (reconstructed from the owner's chat pastes) | Create PR #184 (author sahilsheikh-dev) | task/docs-remote-sync-2026-11-22 → documentation | `c14fc2a420f0efc791813ab5cc2f42d0a15ef5fc` | Snapshot state MERGED; terminal shows PR URL/result at the 11:33:26 prompt. Snapshot `createdAt` remains authoritative at 11:33:25 IST. | /tmp/wealthwise-remote-snapshot/prs.json; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| 2026-11-22 11:34:08 IST / 2026-11-22 06:04:08 UTC | remote snapshot + terminal paste (reconstructed from the owner's chat pastes) | Merge PR #184 (mergedBy sahilsheikh-dev) | task/docs-remote-sync-2026-11-22 → documentation | `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea` | Merged; task branch absent from the remote branch list at snapshot. Correction (2026-11-22): terminal confirms `gh pr merge --delete-branch`; the 11:34:30 IST `git fetch --all --prune` confirms deletion of its remote-tracking ref. Snapshot merge time is authoritative. | /tmp/wealthwise-remote-snapshot/prs.json; remote-branches.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| 2026-11-22 11:34:43 IST / 2026-11-22 06:04:43 UTC | remote snapshot + terminal paste (reconstructed from the owner's chat pastes) | Create PR #185 (author sahilsheikh-dev) | documentation → develop | `6c69977fa12bfeb3c979ee6fd415df7deaaf1dea` | Snapshot state MERGED; terminal shows PR URL/result at the 11:34:45 prompt. Snapshot `createdAt` remains authoritative at 11:34:43 IST. | /tmp/wealthwise-remote-snapshot/prs.json; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| 2026-11-22 11:34:59 IST / 2026-11-22 06:04:59 UTC | remote snapshot + terminal paste (reconstructed from the owner's chat pastes) | Merge PR #185 (mergedBy sahilsheikh-dev) | documentation → develop | `a946baff7793e7485b54cb363048f7906983574c` | Merged; snapshot develop and local `origin/develop` agree. Correction (2026-11-22): terminal confirms merge success at the 11:35:00 prompt, then CM-2 `git fetch --all --prune && git switch develop && git pull --ff-only` completed by the 11:35:07 prompt; develop fast-forwarded to `a946baf`. | /tmp/wealthwise-remote-snapshot/prs.json; exported-at.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 7) |
| 2026-11-22 11:39:32 IST / 2026-11-22 06:09:32 UTC | remote snapshot + terminal paste (reconstructed from the owner's chat pastes) | Refresh remote snapshot after PR #185 and CM-2 | develop | `a946baff7793e7485b54cb363048f7906983574c` | `exported-at.txt` confirms timestamp and develop tip. | /tmp/wealthwise-remote-snapshot/exported-at.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 8) |
| time not recorded / time not recorded | remote snapshot | Gate 4 after PR #185 | develop at `a946baff7793e7485b54cb363048f7906983574c` | `not captured` | Output shows 20/21 and only six known SDK 57 patch mismatches; file has no printed exit code. Correction (2026-11-22): terminal paste shows exit 1 at 11:40:11 IST / 06:10:11 UTC; record as `exit 1 (terminal paste, reconstructed)` while the output file itself has no exit code because the command had an unterminated quote. | /tmp/wealthwise-remote-snapshot/gate4-develop-after185.txt; owner-terminal-2026-11-22-reconstructed-2.txt (segment 8) |
| 2026-11-22 12:42:12 IST / 2026-11-22 07:12:12 UTC | terminal session | Push documentation branch: git push -u origin documentation | documentation | `25c7b29d8fc3a2e7e6ecfe1660b6b9f32e385098` | Exit 0; origin/documentation updated 6c69977..25c7b29. | this terminal session |
| 2026-11-22 12:42:14 IST / 2026-11-22 07:12:14 UTC | terminal session | Push task branch: git push -u origin task/docs-device-checklist-by-release | task/docs-device-checklist-by-release | `37b52bcf88348402bd90a3008459ec791a6ff4ed` | Exit 0; new remote branch created. | this terminal session |
| 2026-11-22 12:42:31 IST / 2026-11-22 07:12:31 UTC | terminal session | Create PR #186: gh pr create --base documentation --head task/docs-device-checklist-by-release --title "docs(releases): split device checklist by release and add release gate" | task/docs-device-checklist-by-release → documentation; PR #186 | `37b52bcf88348402bd90a3008459ec791a6ff4ed` | Exit 0; PR #186 created; mergeable state verified CLEAN / MERGEABLE. | this terminal session |
| 2026-11-22 12:42:48 IST / 2026-11-22 07:12:48 UTC | terminal session | Merge PR #186: gh pr merge 186 --merge --delete-branch | PR #186 | `001df8b812e0b2c990137f22747be4d0e5cfd2a1` | Exit 0; merged into documentation; remote task branch deleted. | this terminal session |
| 2026-11-22 12:42:52 IST / 2026-11-22 07:12:52 UTC | terminal session | CM-2 sync documentation: git fetch --all --prune && git switch documentation && git pull --ff-only | documentation | `001df8b812e0b2c990137f22747be4d0e5cfd2a1` | Exit 0; documentation synchronized at 001df8b. | this terminal session |
| 2026-11-22 12:43:08 IST / 2026-11-22 07:13:08 UTC | terminal session | Create PR #187: gh pr create --base develop --head documentation --title "docs: sync documentation to develop (device checklist by release)" | documentation → develop; PR #187 | `001df8b812e0b2c990137f22747be4d0e5cfd2a1` | Exit 0; PR #187 created; mergeable state verified CLEAN / MERGEABLE. | this terminal session |
| 2026-11-22 12:43:16 IST / 2026-11-22 07:13:16 UTC | terminal session | Merge PR #187: gh pr merge 187 --merge | PR #187 | `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6` | Exit 0; merged into develop; documentation lifecycle branch retained. | this terminal session |
| 2026-11-22 12:43:19 IST / 2026-11-22 07:13:19 UTC | terminal session | CM-2 sync develop: git fetch --all --prune && git switch develop && git pull --ff-only | develop | `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6` | Exit 0; develop fast-forwarded to aeacbfd. | this terminal session |
| 2026-11-22 12:43:32 IST / 2026-11-22 07:13:32 UTC | terminal session | Gate 4: npx expo-doctor > /tmp/gate4.txt 2>&1; echo "exit=$?" | develop at `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6` | `not captured` | Exit 1; 20/21 checks passed, 1 failed (six known SDK 57 package patch mismatches). | this terminal session; /tmp/gate4.txt |
| 2026-11-22 12:50:00 IST / 2026-11-22 07:20:00 UTC | terminal session | Create and merge PR #188: gh pr create --base documentation --head task/docs-r8-publish-log --title "docs(ledger): record publish of device checklist (R8)" && gh pr merge 188 --merge --delete-branch | task/docs-r8-publish-log → documentation; PR #188 | not captured | merge hash: see git history, PR 188 | this terminal session |
| 2026-11-22 12:50:00 IST / 2026-11-22 07:20:00 UTC | terminal session | Create and merge PR #189: gh pr create --base develop --head documentation --title "docs: sync ledger R8 publish log to develop" && gh pr merge 189 --merge | documentation → develop; PR #189 | not captured | merge hash: see git history, PR 189 | this terminal session |
| 2026-11-22 13:50:11 IST / 2026-11-22 08:20:11 UTC | owner report | Owner reports physical-device validation Pass for O61–O74 | Next release device checks | not applicable | All 14 checks O61–O74 passed on physical device; device model, OS version and tester details omitted. | owner chat report |

### DOCS-R8-LOG-CORRECTIONS (2026-11-22)

Corrected the 2026-11-22 Owner-run actions log using the supplied snapshot and terminal paste reconstructed from the owner's chat pastes. Preserved the prior wording and appended dated corrections. The documentation/status statement that exact push actions and times were absent from the terminal recording now distinguishes the incomplete `script(1)` log from the reconstructed terminal paste. Added records for the evidence-file move, the initial and refreshed snapshot exports, both branch pushes, PR #184/#185 CLI observations, remote task-ref deletion confirmation, and CM-2 on `develop`. Corrected Gate 4 to `exit 1 (terminal paste, reconstructed)` at 11:40:11 IST / 06:10:11 UTC; `gate4-develop-after185.txt` itself still has no exit code because the command had an unterminated quote. The 2,188-byte script log is incomplete: it contains only shell start/prompt/exit and omits pushes, PR operations, CM-2 and Gate 4.

No existing test asserted the replaced wording, so no assertion changed and no test-only commit was applicable. Focused ledger/memory suites: 3 suites, 39 tests passed. Gates: Gate 1 `npm test -- --coverage --watchman=false` exit 0 (105 suites, 1,439 passed, 1 skipped); Gate 2 `npx tsc --noEmit` exit 0; Gate 3 `npx expo lint` exit 0; Gate 4 this run not captured (not run due the local-only no-network restriction); owner terminal paste reports exit 1, 20/21, six known SDK 57 patch mismatches at 11:40:11 IST; the output file itself has no exit code. Gates 5–6 Android/iOS exports exit 0. Protected-file hashes match; `git diff develop...HEAD --stat -- package.json package-lock.json app.json` is empty. No owner action, PR, merge, or network operation was performed in this local task.

Placement: rule 1; searched dashboard, register, phase history, roadmap, memory and R8/ledger tests; related CR-118 and the documentation lifecycle; reason: reconcile owner-run repository-process evidence with the permanent action log.

### DOCS-REMOTE-SYNC-2026-11-22 branch reconciliation

The supplied remote snapshot confirms phase branches are retained and merged task branches are absent. `documentation` is the active local task base and `task/docs-remote-sync-2026-11-22` is the current task branch. The 42 remote refs and full tips are listed in `/tmp/sync/inventory-cont.md`.

### DOCS-REMOTE-SYNC-2026-11-22 ordered gates

| Gate | Command | Result |
|---:|---|---|
| Focused | `npx jest src/lib/__tests__/branchingDocs.test.ts src/lib/__tests__/progressLedger.test.ts src/lib/__tests__/memoryDocs.test.ts --watchman=false` | Exit 0; 3 suites / 37 tests. |
| 1 | `npm test -- --coverage` | Exit 0; 105 suites, 1,437 passed, 1 skipped (1,438 total). |
| 2 | `npx tsc --noEmit` | Exit 0. |
| 3 | `npx expo lint` | Exit 0. |
| 4 | `npx expo-doctor` | Invoked once; exceeded the 30-second tool wait and exit was not captured; not rerun. |
| 5 | `npx expo export --platform android` | Exit 0. |
| 6 | `npx expo export --platform ios` | Exit 0. |

Protected-file hashes all match `docs/memory/rules.md`. Device checks O61–O74 remain Not run.

> Earlier session and release log entries (pre-2026-11-22) are archived in [memory/archive/session-and-release-log.md](memory/archive/session-and-release-log.md).

## 12. Phase branch index

Remote snapshot reconciliation at `2026-11-22T11:12:56+05:30`: `remote-branches.txt`
contains 42 refs, including the retained phase branches and no `origin/task/*`
refs; all 51 tags are included in `/tmp/sync/inventory-cont.md`. The 30 `phase-*`
completion tags and four version tags align with this index and the release
history. The four GitHub releases list v1.2.0 as latest; no release document
was changed. The complete remote branch/tag/release lists are retained in the
/tmp inventory report.

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
| P7 | `phase/07-cloud-backup` | — | — | 4 |
| P8 | `phase/08-investments` | `phase-08-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P9 | `phase/09-asset-links` | `phase-09-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P10 | `phase/10-schedules-and-dues` | `phase-10-complete` | `e31782c6452568a5908f987c1b85ec15ef22b0f0` | 1 |
| P11 | `phase/11-navigation-and-screens` | `phase-11-complete` | `beb971167116c0af6079bf3254d826eb72ac5650` | 1 |
| P12 | `phase/12-onboarding-and-theme` | `phase-12-complete` | `9c0762d9fef695bb6832ab41c36f622b1fbf8ec4` | 1 |
| P13 | `phase/13-income-and-goals` | `phase-13-complete` | `8987f229501e69989e829977cb1a4abcb65a92db` | 1 |
| P14 | `phase/14-ui-and-data-polish` | `phase-14-complete` | `5de5a440db2813f5bcd278e12d7eac1faa443c5a` | 1 |
| P15 | `phase/15-phase-14-audit` | `phase-15-complete` | `e155bcdb527c4f68b2173a8b98b3ca203b848281` | 4 |
| P16 | `phase/16-data-foundation` | `phase-16-complete` | `9399e23f86bbefe51ec3cf7eeeb350eec7217ae8` | 3 |
| P17 | `phase/17-cash-flow-budgets-sorting` | `phase-17-complete` | `1e206ad754e95cd53f7cc06e9cba4d2d9b151a68` | 4 |
| P18 | `phase/18-ui-fix-rounds` | `phase-18-complete` | `3e28f763502fa09b32c00fce1bae95c71285f556` | 9 |
| P19 | `phase/19-budget-model-and-sync` | `phase-19-complete` | `d3477f2e1266e686b611aa819be90dba113a7a5f` | 3 |
| P20 | `phase/20-budget` | `phase-20-complete` | `eed40750f68bebc9168907f79f74a67c1f301b83` | 51 |
| P21 | `phase/21-emergency-fund` | `phase-21-complete` | `abad2be714e3574f42f2c744a2d75e253ddd5a65` | 8 |
| P22 | `phase/22-demo-data` | `phase-22-complete` | `6cb4fa0a42be2c60ee3d4bf162bb41d6a2f0ea58` | 2 |
| P23 | `phase/23-insurance` | `phase-23-complete` | `04988e8366949c0cde04912ca1f472c4b31c227f` | 4 |
| P24 | `phase/24-reminders` | `phase-24-complete` | `afe54225c10d2a402d79fdc751c7c75225000e43` | 1 |
| P25 | `phase/25-release-and-backups` | `phase-25-complete` | `f99445790f44a20e022201452ddd4755ecc9d243` | 6 |
| P26 | `phase/26-accessibility-and-performance` | `phase-26-complete` | `643ef5bbb5b8481332d1416754d71b0647431f2f` | 1 |
| P27 | Empty (reserved); `cleanup` (historical branch name: `phase/27-cleanup`) | `phase-27-complete` | `a2fa24f930da15c49f779577eb749b33f11a7059` | 0 |
| P28 | Empty (reserved); `qa-and-release` (historical branch name: `phase/28-qa-and-release`) | `phase-28-complete` | `421e53f974b72f6869a725d39fd1a8dfd95baa99` | 0 |
| P29 | `phase/29-income-recurrence` | `phase-29-complete` | `9637d222c4feb4a001384a4d9094e472eff23728` | 43 |
| P30 | `phase/30-release-2-stabilization` | `phase-30-complete` | `a258579c4b580d6f3a157b8d13de53334aa8d34d` | 3 |
| P32 | Empty (reserved) | — | — | 0 |
| P40 | `phase/40-agent-context-hygiene` | — | — | 2 |
| P41 | `phase/41-types-frequency-completion` | — | — | 5 |
| P42 | `phase/42-owner-decision-reconciliation` | — | `15c517573ab892f8c26e2e9722669e389f8dd98f` | 2 |
| P43 | `phase/43-lifecycle-and-transaction-planning` | — | — | 7 |
| P44 | `phase/44-spending-heatmap` | — | — | 4 |

### Independent entity branch index

These are ongoing independent entities, not numbered development phases.

| Entity | Current branch | Historical branch name | Retained tag | Status | Notes |
|---|---|---|---|---|---|
| `cleanup` | `cleanup` | `phase/27-cleanup` | `phase-27-complete` | Active | Preserve P27, `phase-27-complete` and historical branch name: `phase/27-cleanup`; `origin/cleanup` verified at tip `a2fa24f930da15c49f779577eb749b33f11a7059`. |
| `qa-and-release` | `qa-and-release` | `phase/28-qa-and-release` | `phase-28-complete` | Active | Preserve P28, `phase-28-complete` and historical branch name: `phase/28-qa-and-release`; `origin/qa-and-release` verified at tip `9d914638e50462cbadef84df3294ed07cbf42732`. |
| `schema-migration` | `schema-migration` | `phase/07-schema-migration` | `phase-07-complete` | Active | Preserve P7, `phase-07-complete` and historical branch name: `phase/07-schema-migration`; `origin/schema-migration` verified at tip `487759ebe7bc0d423631ed16572afddc19f65ad0`. |
| `documentation` | `documentation` | — | — | Active | Standalone lifecycle branch for documentation, ledger, memory, rules, and release notes; `origin/documentation` verified at tip of `develop`. |

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


## 13. Independent entities

These activities are independent lifecycle entities (like `main` and `develop`),
not numbered product phases. They have dedicated branches and ongoing lifecycles,
and are not counted in the phase progress bars or dashboard denominator.

### cleanup

Ongoing dead-code removal, dependency maintenance, bundle size audits and repository hygiene. Dedicated branch: `cleanup` (historical branch name: `phase/27-cleanup`).

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| cleanup: SDK 57 patch alignment | — | Done | Upgraded expo (~57.0.32 -> ~57.0.33), expo-constants (~57.0.21 -> ~57.0.24), expo-linking (~57.0.13 -> ~57.0.14), expo-router (~57.0.30 -> ~57.0.31), expo-sharing (~57.0.25 -> ~57.0.26), expo-sqlite (~57.0.4 -> ~57.0.5). All six ordered gates pass; Gate 4 exits 0 (21/21). Six protected-file hashes match. Dependency commit `fac699e`. Placement: rule 1; searched dashboard, register, memory; related cleanup lifecycle; reason: dependency maintenance is ongoing cleanup lifecycle work. | 2026-11-22 |
| P27-A | — | Done | Dead-code/dependency cleanup, bundle audit and bounded schedule benchmark; 91 suites and all six ordered gates passed. Previously: P27-A. Placement: rule 1; searched dashboard, register, memory; related cleanup lifecycle; reason: dead-code and bundle cleanup are ongoing repository lifecycle work. | 2026-11-07 |

### qa-and-release

Ongoing release engineering, build automation, tag management, APK verification, publication and CI workflows. Dedicated branch: `qa-and-release` (historical branch name: `phase/28-qa-and-release`).

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| qa-and-release CI workflow (Previously: P31-E) | — | Planned | Gates 1–4 for PRs to develop/main, pinned actions, no secrets, minimal permissions, then branch protection after a real PR run. Placement: rule 1; searched dashboard, register, roadmap, memory, P31 files and GitHub workflow area; related qa-and-release lifecycle; reason: CI and branch protection are ongoing repository-process work. | not started |
| P28-A | `fbdcbac`, `41c4617`, `d0ddff8` | Done | Report-first release readiness, initial `0.2.0` metadata alignment, audit/data-safety/migration inventory, README and changelog corrections. Revised by P28-B for stable-version metadata; Revised by P28-A-R1 for the v13 backup equality regression. Protected routes remain unchanged. Previously: P28-A. Placement: rule 1; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release readiness and QA are ongoing lifecycle activities. | 2026-11-07 |
| P28-A-R1 | — | Done | Added a deterministic, checksummed synthetic v13 backup test through `parseBackup`; independently computed net worth, every goal's saved amount and Emergency Fund available amount match after import. No app behavior changed. Previously: P28-A-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-B | — | Done | Aligned first stable release metadata to v1.0.0 and updated release notes/changelog; no source behavior change. Previously: P28-B. Placement: rule 1; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release readiness and QA are ongoing lifecycle activities. | 2026-11-07 |
| P28-F | — | Done; Revised by P28-F-R1, P28-F-R2, P28-F-R2-R1, P28-F-R3, P28-F-R3-R1, P28-F-R3-R2, P28-F-R3-R3, P28-F-R3-R3-R1, P28-F-R4, P28-F-R4-R1-R1, P28-F-R4-R1-R1-R1-R1-R1, P28-F-R4-R1-R1-R1-R1-R1-R1, P28-F-R4-R1-R1-R1-R1-R1-R1-R1, P28-F-R5, P28-F-R6 and P28-F-R6-R2 | Prepared v1.1.0 on `release/v1.1.0`; all six gates passed. PR #2 merged the release into main and PR #3 back-merged main into develop. Revised by P28-F-R3 for verified EAS build, tag and publication evidence, P28-F-R3-R1 for the completed publication PR chain, P28-F-R3-R2 for historical asset rollover and checksum removal, P28-F-R3-R3 for versioned latest-asset naming, P28-F-R3-R3-R1 for the merged filename-policy PR chain, Revised by P28-F-R4 for a review-only v1.1.1 candidate, P28-F-R4-R1 for supplied screenshot integration and owner-led release workflow, P28-F-R4-R1-R1 for the approved v1.1.1 release integration, P28-F-R4-R1-R1-R1-R1-R1 for screenshot-asset naming, latest-version rules and APK handoff corrections, P28-F-R4-R1-R1-R1-R1-R1-R1 for template-aligned historical metadata and release preparation, P28-F-R4-R1-R1-R1-R1-R1-R1-R1 for v1.1.1 publication and post-publication asset/doc rollover, and P28-F-R5 for repository-backed, browser-viewable screenshots and roadmap cancellation. Previously: P28-F. Placement: rule 1; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release readiness and QA are ongoing lifecycle activities. | 2026-11-08 |
| P28-F-R6 | — | Done; Revised by P28-F-R6-R1, P28-F-R6-R2 and P28-F-R6-R3 | Published the owner-approved v1.2.0 minor release and completed the post-publication task/phase/develop/main PR chain. PRs #125/#126 merged into phase at `87c8e8f`/`9db08be`, #127 merged into `develop` at `d65ce75`, #128 merged into `main` at `48a64c0`, and #129 back-merged into `develop` at `c554c0b`. Final ledger correction task PR #130 merged into phase at `202dabe`, phase PR #131 into `develop` at `6f4f4df`, develop-to-main PR #132 at `b678493`, and back-merge PR #133 at `eedff48`. The `main` and `develop` trees match. The ordered six gates passed on code-integrated `develop` `3bd5be6`; final closeout regressions pass 2 suites / 24 tests. EAS build `6fccf7d1-0580-46a6-9e09-ff7467fb0a30` succeeded with `android-apk`/`versionCode` 3; its 112,163,081-byte APK is published and verified. All 104 screenshot links and five APK URLs returned HTTP 200 at expected sizes. Historical release bodies were updated without changing other content; v1.1.1 APK was renamed to its versioned filename. Previously: P28-F-R6. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-11 |
| P28-F-R1 | — | Done | Recorded owner-reported Pass results for device checklist N39-N43; device identification fields remain blank. Previously: P28-F-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R3 | — | Done; Revised by P28-F-R3-R1 and P28-F-R3-R2 | Published v1.1.0 after verifying the owner-uploaded APK against the EAS artifact, exact tag target, release notes, README parity and both public download links. Owner-approved exceptions: EAS `preview` profile and Android `versionCode` 1. Previously: P28-F-R3. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R3-R1 | — | Done | Recorded the complete publication PR chain (#11-#15) and verified the merged GitHub branch/tree and tag state. Previously: P28-F-R3-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R3-R2 | — | Done; Revised by P28-F-R3-R3 | Renamed the superseded v1.0.0 APK to a versioned asset, updated its download block and GitHub release body to remove the published checksum, and aligned release policy, history and tests. Previously: P28-F-R3-R2. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R3-R3 | — | Done; Revised by P28-F-R3-R3-R1 | Added the version and `latest` marker to the current APK filename, kept superseded APK filenames versioned without `latest`, and aligned the v1.1.0 release asset, Download links, policies and regression tests. Previously: P28-F-R3-R3. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R3-R3-R1 | — | Done | Verified chronological PR integration: task to P28 (#21), P28 to develop (#22), develop to release/v1.1.0 (#23), release to main (#24), and main back to develop (#25). The four remote trees match; the merged task branch was deleted and the phase branch retained. Previously: P28-F-R3-R3-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-08 |
| P28-F-R4-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1 | Owner-approved v1.1.1 app/package versions passed all six gates and merged through PRs #56/#57 to `develop`; the APK was verified and attached. Later revisions completed publication and post-publication asset/document rollover. Previously: P28-F-R4-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1 | Changed the release default to agent-run EAS `android-apk` build and GitHub draft upload after Markdown approval, merge to `develop`, and draft creation. Audited all 10 release Markdown files; every ordered sequence was consecutive, so no numbering edits were needed. Three focused documentation suites/19 tests and `git diff --check` pass. Task PR #60 merged into P28 as `3605468`; Phase PR #61 merged into `develop` as `c61272f`. Previously: P28-F-R4-R1-R1-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1-R1 | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1-R1-R1 | Add template metadata to v1.0.0, remove its duplicate legacy metadata block, and publish the owner-approved v1.1.1 release after the required task/phase/develop/release PR flow. Finalize README and release-history links and rename v1.1.0's APK only after publication. Previously: P28-F-R4-R1-R1-R1-R1-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: release engineering and build validation. | 2026-11-09 |
| P28-F-R5 | — | Done | `ff5a5a6`; cancelled screenshot capture because the owner supplied all 23 images, stored them by release in the repository and changed thumbnails to browser-viewable blob links. Release-note links, guide/tests and the screenshot decision are updated; PR #83 merged into P28. Previously: P28-F-R5. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-10 |
| P28-F-R6-R1 | — | Done | Expand release screenshots with five owner-supplied screens in every release, About only in v1.2.0; update the latest-published README gallery and record owner-reported O45-O53 Pass. Test-first commit `cb1db2b`, implementation commit `6bf46f8`; task PR #116 merged into phase as `f08f963`; phase PR #117 merged into `develop` as `25258ac`. Final gates pass on `3bd5be6`; screenshot sections for all releases are integrated, and all 104 image/link URLs returned HTTP 200. Historical GitHub release bodies now include the matching screenshot sets with all non-screenshot content preserved. v1.2.0 is published; its APK and the previous v1.1.1 asset are verified/renamed as required. O45-O53 remain owner-reported; device details were not supplied. Previously: P28-F-R6-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-11 |
| P28-F-R6-R2 | — | Done | Corrected final branch-closeout evidence after v1.2.0 publication. Test-first commit `b446fb5` proves the prior ledger expected 37/37 and stopped at PR #129 despite final PRs #130–#133. Task PR #134 merged this ledger/test correction into the phase branch as `2d3a0f6`. The last release sync is task PR #130 → phase `202dabe`, phase PR #131 → `develop` `6f4f4df`, develop-to-main PR #132 → `b678493`, and back-merge PR #133 → `eedff48`; `main` and `develop` trees match. The dashboard guard now requires the parent P28-F-R6 row to retain both revision links. Focused ledger and download-document tests pass 2 suites / 24 tests. Previously: P28-F-R6-R2. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-11 |
| P28-F-R6-R3 | — | Done; Revised by P28-F-R6-R3-R1 | Record the owner's report that all physical-device checks from the pending-check summary passed on 2026-11-11. Added O54-O60 for older grouped follow-ups; O45-O53 remain Pass. Device identity details were not supplied. Test-first commits `71250b2` and `b7c5891`; implementation commit `cf2b508`; task PR #138 merged into `qa-and-release` (historical branch name: `phase/28-qa-and-release`) at `6f5b1cb`; phase PR #139 merged to `develop` at `fd7ba55`. Previously: P28-F-R6-R3. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-11 |
| P28-F-R6-R3-R1 | — | Done | Record the verified task and phase PR merge SHAs for P28-F-R6-R3 and synchronize the current status. Test-first commit `1220b8a`; phase PR #139 merged to `develop` at `fd7ba55`. Previously: P28-F-R6-R3-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-11 |
| P28-F-R2 | — | Done; Revised by P28-F-R2-R1 | Corrected the v1.1.0 draft contributor credits using the published v1.0.0 format, added contributor guidance, and verified the PR integration path. Previously: P28-F-R2. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-08 |
| P28-F-R2-R1 | — | Done; Revised by P28-F-R3 | Corrected stale branch/GitHub audit records; task and P28 PRs are integrated into develop, with release and back-merge PRs carrying the correction through main. Latest six ordered gates pass: 98 suites, 1,243 passed, 1 skipped; coverage 95.96/92.01/98.01/97.62% overall, `src/data` 91.03/87.39/94.46/94.17%, `src/domain` 96.95/92.85/98.80/98.32%, `src/lib` 100%; TypeScript, lint, Doctor 21/21, Android export and iOS export all pass. At that revision v1.1.0 was untagged; publication is recorded by P28-F-R3. Previously: P28-F-R2-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-08 |
| P28-F-R4 | — | Done; Revised by P28-F-R4-R1 | Prepared proposed v1.1.1 release notes for owner review, added screenshot sections to README and the v1.0.0/v1.1.0 notes, and made the template safe for pending images. No app version, build, tag, GitHub release or merge was changed. Previously: P28-F-R4. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-09 |
| P28-F-R4-R1 | — | Done; Revised by P28-F-R4-R1-R1 | Added the owner-supplied Home screenshot to versioned v1.0.0, v1.1.0 and proposed v1.1.1 repository paths, README and release Markdown. Uploaded screenshot assets and updated the published v1.0.0/v1.1.0 GitHub release bodies; both image URLs returned HTTP 200 with Content-Length 244,108. Owner confirmed the identical image is intentional. Updated release policy for draft approval -> task/phase/develop PR merge -> GitHub draft -> owner build/APK upload/confirmation -> verification -> explicit publication approval. Previously: P28-F-R4-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-09 |
| P28-F-R4-R1-R1-R1 | — | Done; Revised by P28-F-R4-R1-R1-R1-R1 | Owner approved the complete v1.1.1 release note, now moved to `published/`. Added all 23 screenshots to versioned paths and all three GitHub releases; README now contains only latest screenshots under the generic heading. All galleries use 150-pixel images, four per row, in the requested category order. Removed Contributors sections, completed all release-template sections, clarified release/APK-path rules, and adjusted regression tests to distinguish finalized notes from actually published releases. Required task/phase/develop integration is recorded by the follow-up revision. Previously: P28-F-R4-R1-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1 | Done; Revised by P28-F-R4-R1-R1-R1-R1-R1-R1 | Corrected release-note numbering and latest-version routing; standardized screenshot assets, removed local screenshot files, verified the owner-supplied APK and aligned README, release notes, GitHub bodies, rules and regression tests. All six gates pass; task PR #64 merged to P28 as `dd8c6b6`, and Phase PR #65 promotes the change to `develop`. v1.1.1 publication and latest-asset rollover remain pending. Previously: P28-F-R4-R1-R1-R1-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-09 |
| P28-F-R4-R1-R1-R1-R1-R1-R1-R1 | P28-F-R4-R1-R1-R1-R1-R1-R1 | Done | Complete post-publication v1.1.1 date, README, release-history, screenshot and v1.1.0 APK rollover updates. The latest APK and three versioned APK URLs return HTTP 200 at expected sizes; all eight v1.1.1 screenshots return HTTP 200. Previously: P28-F-R4-R1-R1-R1-R1-R1-R1-R1. Placement: rule 2; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-09 |
| P28-F-R7 | — | Done | Prepare and publish owner-approved v1.3.0 minor release candidate: bump app and package manifests to 1.3.0, publish v1.3.0 release notes with 8 owner-supplied screenshots, align device-test checklist and build configuration, and verify all six gates. Candidate PRs #210/#211 merged to develop (afeb987); release/v1.3.0 created; EAS build c2ec9414-ae63-44cc-b34a-0f67f6cb51cb (profile android-apk, versionCode 4) verified and uploaded to GitHub draft; build record PRs #212/#213 merged to develop (58d9a26); README.md, release notes, release history, and release rules aligned for v1.3.0; release/v1.3.0 merged to main via PR #216 (341dbcb); tag v1.3.0 created; GitHub Release v1.3.0 published as Latest; post-publication sync PR #217 (97c6d02) merged to develop. Previously: P28-F-R7. Placement: rule 1; searched dashboard, register, memory; related qa-and-release lifecycle; reason: revision to release engineering and orchestration. | 2026-11-22 |
| P28-F-R8 | — | In progress | Prepare owner-approved v1.4.0 minor release candidate (`CR-174`, `#574`): bump `app.json`, `package.json`, and `package-lock.json` to `1.4.0`; move finalized note to `docs/releases/published/v1.4.0.md` with 13 owner-supplied screenshots under `docs/releases/screenshots/v1.4.0/`; update `CHANGELOG.md`, `README.md`, `v1.3.0.md` Download block, `device-test-checklist.md` (`O77`–`O85` moved to `## v1.4.0 device checks`), `releaseDownloadDocs.test.ts`, and `progressLedger.test.ts`; merge via `qa-and-release` -> `develop`, create `release/v1.4.0` + GitHub Release draft, and build `android-apk` via EAS. Placement: rule 1; searched dashboard, register, memory, release-history.md, device-test-checklist.md, README.md, and `releaseDownloadDocs.test.ts`; related qa-and-release lifecycle, P28-F-R7, #574; reason: ongoing release engineering under qa-and-release. | 2026-11-25 |

### schema-migration

Ongoing schema version migrations (v1 -> v23 foundation and future schema evolution). Dedicated branch: `schema-migration` (historical branch name: `phase/07-schema-migration`).

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| P7 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; schema-v2 migration code is present, historical phase commit not identified. Previously: P7. Placement: rule 1; searched dashboard, register, memory; related schema-migration lifecycle; reason: schema migration is an ongoing lifecycle entity. | 2026-10-15 |

### documentation

Ongoing repository documentation, README, release notes, screenshots, memory, rules and permanent ledger maintenance. Dedicated branch: `documentation`.

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| P28-C | — | Done | Release template, EAS build configuration guidance, build history, draft policy and release process documentation; no source behavior change. Revised by P28-C-R4 and earlier revisions. Previously: P28-C. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: repository documentation is an ongoing lifecycle activity. | 2026-11-08 |
| P28-C-R1 | — | Done | Added pending-safe app downloads and What's new, an Android APK profile, post-build asset/link/README/history checklist, and corrected README schema, recurrence, Insurance and test claims. Fixed the existing lint warning in its own commit. Its pending-APK status was updated by P28-C-R2. All six ordered gates passed at that revision; no build, publication, tag or protected-route changes. Previously: P28-C-R1. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| CR-118 | — | Done; PR #184/#185 merged; remote evidence reconciled. Correction (2026-11-22): see corrected push, merge and CM-2 timestamps in Owner-run actions log. | R8 action log records PR heads, merges, branch-ref evidence and Gate 4 output. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory and touched history; related documentation lifecycle; reason: permanent owner-action reconciliation. | 2026-11-22 |
| CR-119 | — | Done; PR #186/#187 merged into documentation and develop | One shared checklist H1; Next release O61–O74; published sections: v1.0.0 X1–M38, v1.1.0 N39–N43, v1.1.1 N44, v1.2.0 O45–O60. The 78 ID/Test/Result/Notes records compare identical to the baseline by ID. Test-first commits `1d9b574`, `9864859`, `7221ba5`, `c7eb5e1`, `26f7a92`; docs commit `855b666`. PR #186 merge `001df8b812e0b2c990137f22747be4d0e5cfd2a1`; PR #187 merge `aeacbfd65e74d0cc5428a9b2460864223e7d9cc6`. Gates: 1 exit 0 (105 suites, 1,439 passed, 1 skipped); 2–3 exit 0; 4 exit 1 (20/21, six SDK patch mismatches); 5–6 exit 0. Six protected hashes match. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, release notes/history/tags, checklist references and tests; related documentation lifecycle; reason: create durable release-by-release device evidence and release blocking. | 2026-11-22 |
| CR-121 | — | Done | Record owner-reported physical-device validation Pass for checks O61–O74. All 14 checks in Next release device checks updated from Not run to Pass; owner tested and validated on physical devices on 2026-11-22; device model, OS version and tester details omitted. All 78 rows in the device checklist now Pass; release gate unblocked. Placement: rule 1; searched dashboard, register, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device verification is ongoing documentation work. | 2026-11-22 |
| CR-122 | — | Done | Record physical device metadata across all release checklist tables (realme Narzo 60 Pro 5g, Android 15 Vanilla Ice Cream, tester sahilsheikh-dev, respective release dates), update Pass notes, and add checklist maintenance confirmation rule requiring agents to prompt for these details with suggestions from previous releases. Placement: rule 1; searched dashboard, register, memory, device checklist and policy docs; related documentation lifecycle; reason: checklist metadata and maintenance policy updates are ongoing documentation work. | 2026-11-22 |
| CR-124 | — | Done | Document that v1.0.0 and v1.1.0 APK downloads are preview build APKs (built with EAS preview profile and versionCode 1) rather than production builds, while v1.1.1 and v1.2.0 distribute production android-apk builds. Placement: rule 1; searched dashboard, register, memory, release notes and build history; related documentation lifecycle; reason: historical release artifact profile clarification is ongoing documentation work. | 2026-11-22 |
| P28-C-R2 | — | Done | Published the v1.0.0 APK Download details, tightened release requirements across shared policy files, and recorded the uploaded asset's name, size and digest. Its `/tmp` release-block staging approach was superseded by P28-C-R3. No release-body edit, build, tag or push. Previously: P28-C-R2. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| P28-C-R3 | — | Done | Finalized release rules, Download parity and its derived Jest regression; verified both public APK links and SHA-256, matched the EAS build, aligned the approved v1.0.0 tag, and added the owner-run device checklist. No app behavior changed; GitHub release-body edit and physical-device tests remain owner actions. Previously: P28-C-R3. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| P28-C-R4 | — | Done | Reorganized README user/developer/documentation sections; removed public APK digest and commit identifiers; aligned release notes, history, release rules and verification tests. GitHub release body was not edited per instruction. Previously: P28-C-R4. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| P28-D | — | Done | Established shared branching, commit and gate rules; added contributor/security guidance and GitHub templates. `develop` bootstrapped at `a258579c4b580d6f3a157b8d13de53334aa8d34d`; rule applies prospectively to legacy unreleased history. All six gates pass; Gate 1: 98 suites, 1,230 passed, 1 skipped. Previously: P28-D. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: repository documentation is an ongoing lifecycle activity. | 2026-11-08 |
| P28-E | — | Done; Revised by P28-E-R1, P28-E-R2, P28-E-R3, P28-E-R4, P28-E-R5 and P28-E-R5-R1 | Reconstructed phase/task history, established 30 phase branches and annotated tags, and verified the 131-commit archive. 512 original commits are mapped exactly once. P28-E-R3 records selected commits; P28-E-R4 connects the complete archive ancestry to `develop`; P28-E-R5 audits historical commit/PR feasibility and records the v1.0.0 release branch. Previously: P28-E. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: repository documentation is an ongoing lifecycle activity. | 2026-11-08 |
| P28-E-R1 | — | Done | Close out the phase-history evidence and record final integrated Release 2 gates, branch integrations, and remaining device/release follow-ups. Previously: P28-E-R1. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| P28-E-R2 | — | Done | Preserve the local final-remote-verification commit in GitHub history while reconciling its stale status text with the current ledger. Final remote branch/tag and archive checks are recorded; no tag was changed. Previously: P28-E-R2. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-08 |
| P28-E-R3 | — | Done | Added ancestry-only merge records for P25-F, the v1.1.0 merge and the P1 refactor on the task branch. Application source is unchanged; PR #46 remained separate at R3 completion, and P28-E-R4 later connected the complete archive ancestry. PR #47 merged to P28 and PR #48 merged to `develop`. Previously: P28-E-R3. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-09 |
| P28-E-R4 | — | Done | Connected the complete `history/by-phase` archive ancestry to `develop` through task PR #49 and phase PR #50. Every remote branch tip is reachable from `develop`; `main` and `release/v1.1.0` remain unchanged. The ancestry-only merge preserved application code. Previously: P28-E-R4. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-09 |
| P28-E-R5 | — | Done; Revised by P28-E-R5-R1 | Audited the 403 non-merge first-parent commits after the initial commit. They are already present in `main` and `develop`; all 30 phase branches exist, and none of these commits can be newly introduced by PR without rewriting history. Created `release/v1.0.0` at the existing v1.0.0 tag target. Task PR #52 merged into P28 as `f9bb715`; phase PR #53 later merged into `develop`. Previously: P28-E-R5. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-09 |
| P28-E-R5-R1 | — | Done | Finalized P28-E-R5 integration evidence: P28 PR #53 merged into `develop` as `0402592`; no historical commit subjects or hashes were changed, and `main` and release branch trees remain unchanged. Previously: P28-E-R5-R1. Placement: rule 2; searched dashboard, register, memory; related documentation lifecycle; reason: revision to release documentation. | 2026-11-09 |
| P28-G | — | Done | `e6395a1`; converted ledger/shared-memory phase labels to PN notation, added the derived glossary and notation/exclusion/prefix regression guards. Focused tests passed 2 suites/15 tests; PR #85 merged into P28. Previously: P28-G. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: repository documentation is an ongoing lifecycle activity. | 2026-11-10 |
| CR-114 | — | Done | Restructure independent entities, empty slots and R7. Test-first commits; PR #161 merged into `develop` as `9058386`; Gates 1–3, 5, 6 exit 0; Gate 4 exit 1 owner-approved exception (upstream Expo SDK 57 patch advisory: expo ~57.0.33, expo-constants ~57.0.24, expo-linking ~57.0.14, expo-router ~57.0.31, expo-sharing ~57.0.26, expo-sqlite ~57.0.5); origin/schema-migration and origin/documentation pushed. Previously: CR-114. Placement: rule 1; searched dashboard, register, memory, rules; related independent entities restructure; reason: documentation and repository process work. | 2026-11-12 |
| CR-106 | — | Done | Plan report-first external-guidance work for P31 privacy/CI rows, new P39 release audit and hardening, and P40 agent-context hygiene; record owner decisions and keep reports out of Git except for the findings summary table. Previously: CR-106. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: external guidance and repository planning are ongoing documentation work. | 2026-11-10 |
| CR-109 | — | Done | Record owner-approved future plans, close accepted follow-ups, explain the deleted codex-changes commit, and reconcile the pending list. Previously: CR-109. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: roadmap and documentation reconciliation are ongoing documentation work. | 2026-11-11 |
| CR-113 | — | Done | Record explicit owner approvals and placement decisions for Planned/Pending tasks without starting their work. Previously: CR-113. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: recording owner decisions is ongoing documentation work. | 2026-11-12 |
| CR-115 | — | Done | Record owner-reported Budget update and delete failure across single month and following months as Planned under P20-U-R1; owner instructed not to start work. Previously: CR-115. Placement: rule 1; searched dashboard, register, memory; related documentation lifecycle; reason: recording owner requests and ledger maintenance are ongoing documentation work. | 2026-11-13 |
| CR-135 | — | Done | Add check O77 to device test checklist (docs/releases/device-test-checklist.md) under Next release device checks for P20-Y-R3 budget item and section rename note preservation, and establish standing repository rule across policy docs requiring physical-device verification check(s) to be added for any feature, fix, bug fix, or revision that modifies user-facing behavior or core logic. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist, policy docs and touched files; related P20-Y-R3 and device checklist release gate; reason: standalone repository process rule and device checklist update for feature/bug-fix verification. | 2026-11-22 |
| CR-136 | — | Done | Rearrange device test checklist to move published v1.3.0 checks O61-O76 into dedicated v1.3.0 section below v1.2.0, retain unreleased O77 under Next release, and establish standing published-release checks rule across policy documents. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist, policy docs and touched files; related CR-135, P28-F-R7 and device checklist release gate; reason: standalone repository process rule and checklist rearrangement upon release publication. | 2026-11-23 |
| CR-137 | — | Done | Establish standing rule prohibiting app version assignment in checklist or repository until release draft finalization, and mark Next release device checks App version as TBD. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist, policy docs and touched files; related CR-135, CR-136, and release-policy rules; reason: standalone repository process rule prohibiting premature app version assignment until release draft finalization. | 2026-11-23 |
| CR-140 | — | Done | Record owner-reported physical-device validation Pass for check O77 in device-test-checklist.md under Next release device checks table after owner physical device validation on realme Narzo 60 Pro 5g (Android 15 Vanilla Ice Cream, tester sahilsheikh-dev, 2026-11-23); ledger and memory updated; all six gates pass with exit 0. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | 2026-11-23 |
| CR-141 | — | Done | Reconcile documentation to reflect completed v1.3.0 publication across release-history.md, docs/releases/README.md, memory status, open items, and PROGRESS.md; all six gates pass with exit 0. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, release docs; related documentation lifecycle; reason: reconciling documentation to reflect completed v1.3.0 publication is ongoing documentation lifecycle work. | 2026-11-23 |
| CR-142 | — | Done | Reconcile planned and unimplemented roadmap items across repository docs; correct stale historical plan notes and establish authoritative 12 active planned roadmap items; all six gates pass with exit 0. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, open-items; related documentation lifecycle; reason: roadmap and open-items reconciliation is ongoing documentation lifecycle work. | 2026-11-23 |
| CR-143 | — | Done | Record feature requests for Budget category filter (P20-Z) and Dynamic asset valuation (P29-U-R1) as Planned work only across repository ledgers, memory, and roadmap under Rule R6 (Rules 4 and 2); all six gates pass with exit 0. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, open-items; related documentation lifecycle; reason: recording feature requests as planned work in documentation is ongoing documentation lifecycle work. | 2026-11-23 |
| CR-162 | — | Done | Record owner-reported physical-device validation Pass for checks O81 and O82 in device-test-checklist.md under Next release device checks after owner physical device validation on realme Narzo 60 Pro 5g (Android 15 Vanilla Ice Cream, tester sahilsheikh-dev, 2026-11-24); ledger and memory updated; all six gates pass. Placement: rule 1; searched dashboard, register, memory, device checklist and tests; related documentation lifecycle; reason: recording owner-reported physical-device validation is ongoing documentation work. | 2026-11-24 |
| CR-163 | — | Done | Reconcile historical GitHub PR labels across all 277 PRs from fresh snapshot (`2026-11-25T10:01:47+05:30`), verify `DEC-P39-DEPS-01` (`decode-uri-component@0.2.2` via `expo-router@57.0.31`, fix requires Expo SDK 58 `expo-router@58.0.32`) for owner confirmation, and verify future tracking rules; all six gates run. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, work-placement.md, and remote snapshot; related CR-161, P39-E, DEC-P39-DEPS-01; reason: standalone repository-process and documentation lifecycle work. | 2026-11-25 |
| CR-164 | — | Done | Resolve `DEC-P39-DEPS-01` per owner approval: accept `decode-uri-component@0.2.2` ReDoS risk until next planned Expo SDK upgrade without changing dependencies or runtime behavior; re-evaluate at next Expo SDK upgrade; all six gates run. Placement: rule 1; searched dashboard, register, phase history, roadmap, memory, decisions.md, work-placement.md, package.json, and offlineRuntime.test.ts; related P39-E, CR-163, DEC-P39-DEPS-01; reason: recording an owner-approved dependency risk-acceptance decision and follow-up condition is standalone documentation lifecycle work. | 2026-11-25 |
| CR-165 | — | Done | Organize 312 WealthWise `/tmp` artifacts under `/tmp/wealthwise/` (`remote-snapshot/`: 177, `reports/`: 59, `logs/`: 74, `build-artifacts/`: 2; 0 conflicts), relocate `export-remote-snapshot.sh` to `scripts/export-remote-snapshot.sh` (zero secrets/tokens), update standing docs and tests, and preserve historical ledger paths with current-path note; all six gates run. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, scripts/, and /tmp; related R8, CR-163; reason: organizing repository temporary artifacts and tracking the project-specific snapshot exporter is standalone documentation and repository-process lifecycle work. | 2026-11-25 |
| CR-167 | — | Done | Refresh remote snapshot (`2026-11-25T12:28:13+05:30`), update `AGENTS.md`, `docs/memory/rules.md`, `docs/memory/README.md`, and `docs/memory/working-style.md` for conditional remote-snapshot refreshes and mandatory GitHub issue creation/closure, backfill missing Model A issues `#548`–`#555` (`CR-159`–`CR-166`) and open `#556` (`CR-167`), and add regression assertions in `progressLedger.test.ts`; all six gates run. Placement: rule 1; searched dashboard, register, memory, work-placement.md, AGENTS.md, rules.md, README.md, working-style.md, and gh issues; related R8, CR-159, CR-160, CR-165, CR-166; reason: updating repository-process rules and reconciling Model A GitHub issues is standalone documentation lifecycle work. | 2026-11-25 |
| CR-168 | — | Done | Record owner-reported physical-device verification Pass for `O83` and `O84` (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`) in `docs/releases/device-test-checklist.md`; update `PROGRESS.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; tracked in issue `#559`; all six gates run. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-H-R1, CR-166, #559; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | 2026-11-25 |
| CR-170 | — | Done | Record owner-reported physical-device verification Pass for `O85` (`realme Narzo 60 Pro 5g`, `15 Vanilla Ice Cream`, `sahilsheikh-dev`, `2026-11-25`) in `docs/releases/device-test-checklist.md`; update `PROGRESS.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; tracked in issue `#565`; all six gates run. Placement: rule 1; searched dashboard, register, memory, device-test-checklist.md, and progressLedger.test.ts; related P39-E-R1, CR-169, #562; reason: recording owner-reported physical-device verification results in the device checklist is standalone documentation lifecycle work. | 2026-11-25 |
| CR-171 | — | Done | Complete `CHANGELOG.md` for all published releases (`v1.0.0`–`v1.3.0`) and add mandatory per-release update rule to `AGENTS.md`, `docs/releases/README.md`, `docs/releases/TEMPLATE.md`, and `docs/releases/RELEASE_PROMPT.md`; verify `app/about.tsx` and `AboutScreen.test.tsx`; update `PROGRESS.md`, `status.md`, `open-items.md`, and `progressLedger.test.ts`; tracked in issue `#566`; all six gates run. Placement: rule 1; searched dashboard, register, memory, CHANGELOG.md, AGENTS.md, docs/releases/, app/about.tsx, and AboutScreen.test.tsx; related documentation lifecycle, P28-F-R7, #566; reason: completing historical changelog entries and adding a release-process rule is standalone documentation lifecycle work. | 2026-11-25 |

### Cancelled / unassigned

Historical cancelled or unassigned rows preserved outside the active phase denominator.

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| P32-A | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots. Dependencies: none. Previously: P32-A. Placement: rule 1; searched dashboard, register, memory; related screenshots; reason: cancelled by owner, preserved in cancelled bucket. | 2026-11-10 |
| P32-B | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots. Dependencies: P32-A. Previously: P32-B. Placement: rule 1; searched dashboard, register, memory; related screenshots; reason: cancelled by owner, preserved in cancelled bucket. | 2026-11-10 |
| P32-C | — | Cancelled by owner | Screenshot capture was cancelled because the owner already supplied the screenshots; repository-backed image organization is handled by P28-F-R5. Dependencies: P32-B. Previously: P32-C. Placement: rule 1; searched dashboard, register, memory; related screenshots; reason: cancelled by owner, preserved in cancelled bucket. | 2026-11-10 |

### Repository entity history map

Complete classification of ledger-referenced commits, PRs and merge commits across independent entities and phases. Full detail committed in [docs/history/entity-history-map.md](history/entity-history-map.md).

| Entity / Category | Total Commits Mapped | Docs-only Commits | Primary Responsibilities |
|---|---:|---:|---|
| `cleanup` | 4 | 2 | Dead-code removal, dependency cleanup, bundle size optimization |
| `qa-and-release` | 82 | 34 | Build management, release branching, APK verification, tag governance |
| `schema-migration` | 12 | 2 | Schema migrations (v1 -> v23), backward compatibility |
| `documentation` | 68 | 68 | Ledger maintenance, release notes, memory, rules, guides, history |
| Phase feature commits | 214 | 42 | Numbered product phase feature implementations (P1–P44) |
