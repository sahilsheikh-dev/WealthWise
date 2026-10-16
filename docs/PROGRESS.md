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

## 1. How to use this file

This is the permanent status, decision, evidence, and verification ledger for
Wealth Wise. Prompt text is not stored in the repo. Every prompt is logged in
the Prompt log (ID, purpose, outcome, commits, agent mistakes). Verbatim
texts of P15-FIX-R1 to R4 and earlier archived files are recoverable from git:
`git show <RECOVERY>:docs/prompts/<file>`. For this ledger, RECOVERY is
`5aeefb96e70df7c388e5eb39454285204adb5707`, the last commit containing the
archive; current HEAD already removed the directory. Every future prompt
starts by reading this file and ends by updating the dashboard, prompt log,
change-request register, and verification matrix with the prompt ID, purpose,
and outcome, then committing the updates.
Use IDs `P<phase>-<part>` for phase prompts, `FX-<id>` for fixes, and `CR-<n>`
for change requests. Never delete history: supersede an earlier entry with a
dated note. When the repository and this ledger disagree, Git and current
source win; correct the ledger and record the conflict. Do not infer
completion from a prior summary or a prompt: require a repository commit and
named test evidence. Historical claims without that evidence remain
user-reported, unverified. Never push.

## 2. Status dashboard

Repository-backed `Done` requires a verified commit and test; app completion
confirmed by the user is explicitly marked with its confirmation date. `Held`
means explicitly deferred by the user. `Pending` means in scope but not yet
verified. `Planned` means later roadmap work. Hashes are repository evidence;
user claims that cannot be proven are called out as such.

Progress bars use the percentage rounded to the nearest whole number and a
10-character bar with `round(10 × closed / total)` filled blocks. A part is
closed when its status starts with `Done` or starts with `Superseded`; both
statuses count in the numerator and denominator. Phases 1–14 count as one part
each.

```text
Overall progress ████████░░ 78% (39/50)
Phase 1          ██████████ 100% (1/1)
Phase 2          ██████████ 100% (1/1)
Phase 3          ██████████ 100% (1/1)
Phase 4          ██████████ 100% (1/1)
Phase 5          ██████████ 100% (1/1)
Phase 6          ██████████ 100% (1/1)
Phase 7          ██████████ 100% (1/1)
Phase 8          ██████████ 100% (1/1)
Phase 9          ██████████ 100% (1/1)
Phase 10         ██████████ 100% (1/1)
Phase 11         ██████████ 100% (1/1)
Phase 12         ██████████ 100% (1/1)
Phase 13         ██████████ 100% (1/1)
Phase 14         ██████████ 100% (1/1)
Phase 15         ██████████ 100% (4/4)
Phase 16         ██████████ 100% (3/3)
Phase 17         ██████████ 100% (3/3)
Phase 18         ██████████ 100% (9/9)
Phase 19         ██████████ 100% (3/3)
Phase 20         ████████░░ 75% (3/4)
Phase 21         ░░░░░░░░░░ 0% (0/2)
Phase 22         ░░░░░░░░░░ 0% (0/2)
Phase 23         ░░░░░░░░░░ 0% (0/1)
Phase 24         ░░░░░░░░░░ 0% (0/1)
Phase 25         ░░░░░░░░░░ 0% (0/1)
Phase 26         ░░░░░░░░░░ 0% (0/1)
Phase 27         ░░░░░░░░░░ 0% (0/1)
Phase 28         ░░░░░░░░░░ 0% (0/1)
```

| ID | Legacy ID | Status | Evidence | Last updated |
|---|---|---|---|---|
| Phase 1 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; original HTML prototype/Expo UI history not recoverable from current Git history. | 2026-10-15 |
| Phase 2 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; no phase-tagged commit or original coverage report available. | 2026-10-15 |
| Phase 3 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current store exists, original schema-v1 commit not identified. | 2026-10-15 |
| Phase 4 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current implementation exists, original phase evidence unavailable. | 2026-10-15 |
| Phase 5 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; exact original phase commit/test mapping unavailable. | 2026-10-15 |
| Phase 6 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current plain backup/security features do not prove all original acceptance criteria. | 2026-10-15 |
| Phase 7 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; schema-v2 migration code is present, historical phase commit not identified. | 2026-10-15 |
| Phase 8 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current investment features do not prove the original phase report. | 2026-10-15 |
| Phase 9 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current link-management code does not prove the original phase report. | 2026-10-15 |
| Phase 10 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current schedules and virtualized history do not prove original acceptance. | 2026-10-15 |
| Phase 11 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; exact original crash-fix evidence unavailable. | 2026-10-15 |
| Phase 12 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; schema-v3/theme code is present, original phase report unavailable. | 2026-10-15 |
| Phase 13 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; current UI has related work, no phase-tagged commit/test matrix. | 2026-10-15 |
| Phase 14 | — | Done (user-confirmed in app, 2026-10-15) | User confirmation; audited follow-up evidence is in Phase 15 A/A2 and later parts. | 2026-10-15 |
| P15-A | — | Done | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; audit/gate evidence in this repository. | 2026-10-15 |
| P15-A2 | — | Done | `0322c9d`; migration, premigration archive, restored assertions and coverage files. | 2026-10-15 |
| P15-B | — | Done | `fbeb1d7`; Phase-14 UI follow-up files and screen tests. | 2026-10-15 |
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
| P19-A | — | Done | Five-group model and category mapping; five-group suggestions; grouped setup/month editors with compact controls, subtotals and recurring-items summary; v6 schema compatibility and demo data. Commits `acc94df`, `af885c1`; see the Phase 19 gate record. | 2026-10-15 |
| P19-B | — | Done | Invest category and earned-income sync, reconciliation, Month review sources, and History/Month review/Templates actions with no Budget header menu; commit `221d2ed` and the Phase 19 gate record. | 2026-10-15 |
| P19-C | — | Done (automated gates pass; device checks outstanding) | Restore/freeze user-owned inputs; Budget header icons; compact expandable Transactions balance card. See the Phase 19-C gate record. | 2026-10-15 |
| P20-A | — | Done | Derived pending rows for unpaid plan/liability dues and remaining budget lines; Pay/Clear due actions, FIFO and Undo; mock data covers overdue, upcoming and applied-budget rows. | 2026-10-15 |
| P20-B | — | Done | Home due action sheet and collapsed category spending with conditional Apply budget (CR-7, CR-10; formerly P19-C). | 2026-10-16 |
| P20-C | — | Done | Restrict bottom tabs to Home, Transactions, Goals and Budget; remove detail-screen tab bars (CR-11). | 2026-10-16 |
| P20-D | — | Pending | Due-payment clearing, balance-section simplification, Home sheet positioning and Budget layout/menu changes (CR-21–CR-26). | 2026-10-16 |
| P21-A | — | Pending | Implementation and feature tests complete; not closed because Expo Doctor reports an app.json schema error. | 2026-10-16 |
| P21-B | — | Pending | Implementation and feature tests complete; not closed because Expo Doctor reports an app.json schema error. | 2026-10-16 |
| P22-A | — | Pending | `1f2d9c8`; deterministic four-month linked demo data and undoable dev loader implemented; Expo Doctor remains non-green. | 2026-10-16 |
| P22-B | P15-SEED | Planned | Optional spreadsheet seed importer (formerly P19-E / P15-SEED). | 2026-10-15 |
| P23-A | P15-F | Planned | Insurance management. | 2026-10-15 |
| P24-A | P15-K | Planned | Reminders and notifications, including CR-1. | 2026-10-15 |
| P25-A | P15-L | Planned | Encrypted backups. | 2026-10-15 |
| P26-A | P15-M | Planned | Accessibility, performance and final gates. | 2026-10-15 |
| P27-A | — | Planned | Cleanup, dead-code/dependency review, bundle audit, README, robust schedule benchmark. | 2026-10-15 |
| P28-A | — | Planned | QA and release. | 2026-10-15 |

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
| CR-1 | Open | Deferred to P24-A; notification design, permission behavior, and tests remain outstanding. | 2026-10-13 |
| CR-2 | Done | Session/checkpoint backfill and prompt archive removal; source limitations remain in Section 8. | 2026-10-14 |
| CR-3 | Open | Save narrows with validation summaries in `profile-form.tsx` and `transaction-form.tsx`. | 2026-10-14 |
| CR-4 | Done | Tab label is Transactions, never the superseded short label; verified by tab tests and the source guard. | 2026-10-15 |
| CR-5 | Done | Five-group categories, suggestions, compact inputs, subtotals and recurring-items summary; P19-A gates pass. | P19-A |
| CR-6 | Done | Applied budgets and all recurring assets/liabilities, past and future, appear as pending Transactions with Pay and Clear due. | P20-A |
| CR-7 | Done | Home upcoming/due rows offer Pay and Clear due and update Transactions. | P20-B |
| CR-8 | Pending | Implementation complete; P21-A remains open until the Expo Doctor gate is green. | P21-A |
| CR-9 | Done | Investment categories remain distinct; every earned-income source appears in budget review and month review, with non-earned inflows separated. | P19-B |
| CR-10 | Done | Home spending by category is collapsed initially and offers Apply budget. | P20-B |
| CR-11 | Done | Bottom tabs appear only on Home, Transactions, Goals and Budget. | P20-C |
| CR-12 | Pending | Four-month deterministic demo builder, linked records, validation and route smoke tests are implemented; P22-A remains open until Expo Doctor is green. | P22-A |
| CR-13 | Pending | Implementation complete; v6→v7 migration and linked-asset conversion preserve net worth; P21-A awaits green Doctor gate. | P21-A |
| CR-14 | Pending | Implementation complete; expense/salary fallback and truncated one-decimal cover tested; P21-B awaits green Doctor gate. | P21-B |
| CR-15 | Pending | Implementation complete; compact editor and linked-assets table tested; P21-B awaits green Doctor gate. | P21-B |
| CR-16 | Superseded by CR-17 | Former Budget body action row, replaced by header icons. | P19-C |
| CR-17 | Done | Budget History/Month review/Templates header icons, ordered actions, labels, indicator and navigation. | P19-C |
| CR-18 | Done | Compact expandable Available balance card with four metrics and optional pending/review details. | P19-C |
| CR-19 | Done | User-owned input components restored/current, frozen by SHA-256 guard. | P19-C |
| CR-20 | Pending | Implementation complete; ledger/category/instrument removed and screen is visualization-only; P21 awaits green Doctor gate. | P21-A/B |

### Resume point

P19-A/B/C and P20-A/B/C passed their gates and are complete. P21-A/B implementation is present, but the parts remain Pending because Expo Doctor reports an app.json schema error. P22-A implementation and feature tests are present, but P22-A and CR-12 remain Pending until the required Expo Doctor gate is green. Resume with that config gate, rerun the gates, then close P21 and P22-A; P22-B remains Planned. The previously planned P19-B, P19-C and P19-D became P20-A, P20-B and P21-A/P21-B, respectively; P19-E became P22-B. **Assumed:** category assignment follows the five groups specified in this request, and the starter split is Survival 50%, Savings and Investments 20%, Wants 15%, Festival 5%, and Unexpected Extras 10% of income. **Assumed:** within-group template weights are Survival (Living 25, Food 20, Transport 10, Family 10, Health 5, Bills 10, Education 5, EMI 10, Insurance 5); Savings and Investments (Emergency fund 35, Mutual fund / SIP 25, Stocks / ETF 15, Fixed deposit / RD 10, Gold / Silver 10, Other investments 5); Wants (Shopping 35, Other 20, Eating out 15, Entertainment 15, Fashion 15); Festival, Donations, Culture (Festival 30, Donation 20, Gifts 20, Culture 30); Unexpected Extras (Unexpected 100). Each group's weights sum to 100. **Superseded by CR-20:** remove Emergency fund as a category and combine its former 35% with Other investments for 40%. **Assumed:** “no header menu on Budget” means removing the entire Budget header menu. **Assumed:** Home's existing five-item due preview cap remains unchanged. Schema stayed v6 through P20 and changed from v6 to v7 in P21-A.

**FX-BASE root cause and audit:** the withdrawal-only screen mock lacked
`useWindowDimensions`; the selector already returned `rates: null` for zero
earned income. The Round 2 test changed the old “No earned income logged this
month” assertion to a summary-data assertion and changed the old “Includes
₹5,000 from withdrawals, borrowing, loan proceeds and own funds” assertion to
only check the “Other money in” label. Round 3 restored both visible messages
(the latter when expanded), and tests now assert them alongside `rates: null`
and no rendered `NaN`. StatPill accepts text, so monetary call sites retain
compact display while passing an exact accessibility label.

**FX-E2 evidence:** “Use suggested mix” sets the seven React Hook Form values
to `SUGGESTED_EF_ALLOCATION`; it does not write to the store until “Save
allocation” calls `setEfAllocation(nextAllocation)`, which stores the explicit
percentages. “Reset to suggested allocation” immediately calls
`resetEfAllocation`, whose pure action writes `efAllocation: null`. These
produce different persisted states, so both controls remain with their
respective explanatory hints. The store test asserts reset performs exactly
one persisted write.

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
- Commit each part locally, never push, and update this ledger at each part.

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
| v7 | Emergency fund becomes a goal funded by linked assets; legacy ledger/category removed with v6→v7 migration. | P21-A implementation; gate status remains Pending below |

Current schema is `SCHEMA_VERSION = 7`. P21-A is the explicit v6→v7 migration;
P21-B does not change the schema.

### Financial and UI rules

- Phase 1 uses Expo/React Native, TypeScript, Expo Router, bundled Montserrat
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
- Phase 6 lock is device biometric/passcode only (no custom PIN/auth service);
  locked content must not mount. Hide previews includes app switching and
  screenshot blocking where supported. Erase requires typed `ERASE` and clears
  financial data plus separate metadata/lock keys. Android
  `allowBackup: false` remains unverified in a built APK.
- Phase 6 backup is readable plain text; checksum detects accidental
  modification, not tampering/security. Import uses bounded schema and
  integrity checks; only a missing EF goal may be repaired. Reminder threshold
  is five records, stale/never-exported is 30 days, and dismissal is seven
  days. Corrupt-blob recovery keeps latest/previous slots and avoids rewriting
  identical latest content; storage-read failure is distinct from corruption
  and must not silently start fresh.
- Phase 1 amounts are rupees and `ISODate` is `YYYY-MM-DD`. Historical rules
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
  deterministic IDs and amounts, explicit injected date, and four complete
  months ending with the current month. Keep `src/mock/data.ts` and its
  established fixtures stable. The data covers all current budget/investment
  categories, linked instrument/payment transactions, dues, a Month-review
  shortfall and surplus allocation, goals, linked emergency assets, allocation,
  policies and stored month budgets. Load it only from the confirmed
  development-menu action through `replaceAllData`, preserving its existing
  backup/Undo path; never load it automatically. The strict backup/import entry
  schema accepts `snapshotAdjustment`, matching the app schema so valid
  manual-holding entries can be replaced and restored without losing metadata.
- DEC-USER-CHANGES: preserve all changes from commits `0e965d4` and `e57fd0f`
  (both authored by Sahil Sheikh without a Copilot co-author trailer). File
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
  Transaction balance card final user-kept elements: balance label and amount
  (including “Shortfall” and danger tone when negative), optional “From {Mon}
  ₹X” chip, divider, and review link when available. There are no retained
  metric columns or captions.
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
- Phase 6 backup checksum detects accidental changes; it is not encryption.
  App lock is not encryption. Biometric/passcode authentication is device
  local; no custom PIN or auth service. OS backup inclusion and device
  privacy behavior require platform verification.

### Superseded decisions

| Earlier decision | Superseded by |
|---|---|
| Phase 1 static-only/no-persistence boundary | Later phases added persistence, domain actions, forms, and routes. |
| Five tabs including Invest and More | FX-B2 established Home, Transactions, Goals, Budget. |
| P11-era three-tab navigation (exact provenance approximate) | FX-B2's four-tab Home, Transactions, Goals, Budget rule. |
| Loans as the feature/entity name | Schema v2 and later UI renamed the feature to Liabilities. |
| Schema v1, then v2, v3, v4, v5, or v6 as current | Successive migrations; current schema is v7. Phase 4's no-new-fields rule was amended by Phase 5's `ManualHolding.valueAsOf`, then later schemas. |
| Saving every prompt in the repository prompt archive | P15-LEDGER: the user keeps prompt text; this file records ID, purpose, outcome, source quality, and Git evidence only. |
| Global-menu placement for Link missing transactions, Budget history, and Month review | CH-3 and CH-2 placed those actions on their relevant screens; routes remain. |
| Standalone Record money movement UI/route | CH-4 removed the UI/route; the shared pure logic remains only where still used by liability receipt flows. |
| Earlier short tab label “Txns” | Superseded on 2026-10-15: the tab must read “Transactions”; tab order is Home, Transactions, Goals, Budget. |
| P18-R5 detail-tab-bar behavior | Superseded by DEC-TABS; tabs appear only on the four main screens, effective P20-C. |
| P19-B Budget body action row (CR-16) | Superseded by CR-17: History, Month review and Templates are right-side Budget header icons. |

## 5. Phase history

Historical descriptions without a repository commit have the user confirmation
recorded below; that confirmation does not supply missing Git hashes or original
test reports. Commit hashes below are from Git; source quality describes the
available prompt/history evidence, not a new verification of every acceptance
criterion.

### Phases 1–14 — single-part phases

### Phase 1

Expo Router static mobile MVP, design system, mock data and screens.

### Phase 2

Pure deterministic domain calculations, selectors, tests and screen wiring.

### Phase 3

Validated local persistence, Zustand/AsyncStorage, transaction CRUD/forms and settings.

### Phase 4

Pure plan/loan actions, schemas, linked transactions, forms and routes.

### Phase 5

Goals, holdings, Emergency Fund ledger/invariants, typed errors and UI.

### Phase 6

Recovery fixes, plain backup/import/undo, lock/privacy, erase and configuration.

### Phase 7

Schema v2 migration; Loans-to-Liabilities and typed transaction links.

### Phase 8

Recurring/one-time investment flows and manual holding ledger.

### Phase 9

Instrument transaction linking, missing-link creation and retargeting.

### Phase 10

Schedules, upcoming dues, entries/payments lists and virtualization.

### Phase 11

Transactions/navigation behavior, error boundaries and shared headers/cards.

### Phase 12

Schema v3 onboarding, salary/theme fields, palettes and branding.

### Phase 13

Income wording, EF minimum target and transaction/goal/menu refinements.

### Phase 14

A–G close-out: UI, v4 EF allocation, storage guard, reminders, encrypted backup and polish.

### Phase 15 — Audit and Phase 14 completion

| New ID | Legacy ID | History |
|---|---|---|
| P15-A | — | Audit Phase 14 and restore reliable gates; coverage-summary command failed and follow-up addressed coverage/test issues. |
| P15-A2 | — | Audit migration/premigration and assertions; restored version-chain behavior; exact earlier assertion details unavailable. |
| P15-B | — | Complete Phase 14 UI leftovers; exact scope unavailable. |
| P15-C | — | Clarify SIP dates and goal-card behavior; exact review unavailable. |

### Phase 16 — Data foundation (schema v5, dues engine, goal links)

| New ID | Legacy ID | History |
|---|---|---|
| P16-A | P15-D | Schema v5 and related data features; the one-time origin transaction ID interpretation was an assumption and approval is unknown. |
| P16-B | P15-E | Shared schedules and due-clearing behavior; exact prompt unavailable. |
| P16-C | P15-G | Goal asset links and projection; exact review unavailable. |

### Phase 17 — Cash flow, budgets and sorting

| New ID | Legacy ID | History |
|---|---|---|
| P17-A | P15-H | Cash-flow history and money movement; CH-4 removed movement UI/route but retained shared liability-receipt logic. |
| P17-B | P15-I | Monthly budget tracker; earlier test-count report was corrected. |
| P17-C | P15-J | Sorting infrastructure and integrations; exact prompt unavailable. |

### Phase 18 — UI fix rounds and ledger

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

### Phase 19 — Budget model and sync

P19-A (CR-5), P19-B (CR-9, CR-16) and P19-C (CR-17–CR-19) are Done. CR-16's
body action row was superseded by the header icons in CR-17. The earlier
grouped-form delivery remains historical and does not substitute for the
expanded scope verified here. Next planned work is P20-A.

### Phase 20 — Pending items, Home and navigation

P20-A [former P19-B; CR-6], P20-B [former P19-C; CR-7, CR-10], and P20-C
[CR-11] are complete. P20-D (CR-21–CR-26) is in progress.

### Phase 21 — Emergency fund as a goal-linked model

Implementation delivered: P21-A [former P19-D, split; CR-8, CR-13] and P21-B
[CR-14, CR-15, CR-20]. Schema version advanced from v6 to v7 in P21-A; P21-B
did not change the schema. Feature tests, typecheck, lint and both exports
pass, but the phase remains Pending because Expo Doctor reports an app.json
schema error. Migration, linked asset integrity, backup import, salary fallback,
allocation UI, Home/Goals summaries and device-only limitations are recorded
below.

### Phase 22 — Demo data and seed importer

P22-A (CR-12) has implementation and feature tests; it remains Pending until
Expo Doctor is green. P22-B (optional spreadsheet importer, formerly P19-E /
P15-SEED) remains Planned.

### Phase 23 — Insurance

Planned P23-A [P15-F].

### Phase 24 — Reminders and notifications

Planned P24-A, including CR-1 [P15-K].

### Phase 25 — Encrypted backups

Planned P25-A [P15-L].

### Phase 26 — Accessibility, performance and final gates

Planned P26-A [P15-M].

### Phase 27 — Cleanup

Planned P27-A: dead-code/dependency review (including whether
`SectionHeaderRow` and `fitsInline` remain used after the ChipRow redesign),
bundle audit, README and a robust schedule benchmark.

### Phase 28 — QA and release

Planned P28-A: property tests, QA checklist, release engineering and local
diagnostics.

**Assumed:** historical commits are assigned to the new part whose delivery
they most directly evidence; round/ledger close-out commits use that round or
ledger label.

### Commit label map

| Hash | Original subject (`git log --format=%s`) | New label |
|---|---|---|
| `5de5a44` | Minor UI Changes | Pre-Phase-15 manual commit: Minor UI Changes |
| `d1a30d8` | Soft Button UI Fix | Pre-Phase-15 manual commit: Soft Button UI Fix |
| `d8b40da` | Minor UI Changes | Pre-Phase-15 manual commit: Minor UI Changes |
| `d64d298` | chore: update gitignore and remove generated files | Pre-Phase-15 manual commit: chore: update gitignore and remove generated files |
| `a89fa2a` | Phase 15 Part A | P15-A Phase 15 Part A |
| `d8dc666` | Phase 15 Part A | P15-A Phase 15 Part A |
| `3a29ea3` | Phase 15 Part A property range fix | P15-A Phase 15 Part A property range fix |
| `235a738` | Phase 15 Part A coverage follow-up | P15-A Phase 15 Part A coverage follow-up |
| `f697403` | Phase 15 Part A progress ledger | P15-A Phase 15 Part A progress ledger |
| `85a0a52` | Phase 15 Part A coverage cleanup | P15-A Phase 15 Part A coverage cleanup |
| `e3c8500` | Phase 15 Part A gate follow-up | P15-A Phase 15 Part A gate follow-up |
| `6ac4ca7` | Phase 15 Part A coverage totals | P15-A Phase 15 Part A coverage totals |
| `0322c9d` | Phase 15 Part A2 | P15-A2 Phase 15 Part A2 |
| `fbeb1d7` | Phase 15 Part B | P15-B Phase 15 Part B |
| `e155bcd` | Phase 15 Part C | P15-C Phase 15 Part C |
| `394d338` | Phase 15 Part D | P16-A Phase 15 Part D |
| `f28657c` | Phase 15 Part E | P16-B Phase 15 Part E |
| `9399e23` | Phase 15 Part G | P16-C Phase 15 Part G |
| `68d9cd4` | Phase 15 Part H | P17-A Phase 15 Part H |
| `19afe88` | Phase 15 Part I | P17-B Phase 15 Part I |
| `1e206ad` | Phase 15 Part J | P17-C Phase 15 Part J |
| `db967bf` | Phase 15 fix: Part 0 | P18-R0 Phase 15 fix: Part 0 |
| `6562de1` | Phase 15 fix: Part 0 evidence | P18-R1 Phase 15 fix: Part 0 evidence |
| `6771f37` | WIP: Phase 15 fix round checkpoint (unverified) | P18-R1 WIP: Phase 15 fix round checkpoint (unverified) |
| `c0ba0da` | Phase 15 fix: FX-BASE | P18-R2 Phase 15 fix: FX-BASE |
| `60b8c54` | Phase 15 fix: FX-BASE | P18-R3 Phase 15 fix: FX-BASE |
| `5f6f883` | Phase 15 fix: FX-E2 | P18-R3 Phase 15 fix: FX-E2 |
| `de94950` | Phase 15 fix: FX-T1 | P18-R3 Phase 15 fix: FX-T1 |
| `a3423ec` | Phase 15 fix: FX-T2 | P18-R3 Phase 15 fix: FX-T2 |
| `c1df77d` | Phase 15 fix: FX-T3 | P18-R3 Phase 15 fix: FX-T3 |
| `88d5190` | Phase 15 fix: FX-T4 | P18-R3 Phase 15 fix: FX-T4 |
| `b8bc4a1` | Phase 15 fix: FX-B1 | P18-R3 Phase 15 fix: FX-B1 |
| `5e2f78f` | Phase 15 fix: FX-B2 | P18-R3 Phase 15 fix: FX-B2 |
| `b205a84` | Phase 15 fix: FX-U3 | P18-R3 Phase 15 fix: FX-U3 |
| `862af8a` | Phase 15 fix: FX-U4 | P18-R3 Phase 15 fix: FX-U4 |
| `6627d03` | Phase 15 fix: FX-U2 | P18-R3 Phase 15 fix: FX-U2 |
| `f805481` | Phase 15 fix: FX-U1 + FX-E1 | P18-R3 Phase 15 fix: FX-U1 + FX-E1 |
| `0df1952` | Phase 15 fix: FX-S1 | P18-R4 Phase 15 fix: FX-S1 |
| `8364053` | Phase 15 fix: FX-S2 | P18-R4 Phase 15 fix: FX-S2 |
| `03c67aa` | Phase 15 fix: FX-T5 | P18-R4 Phase 15 fix: FX-T5 |
| `172b24e` | Phase 15 fix: FX-I1 | P18-R4 Phase 15 fix: FX-I1 |
| `cac7cc0` | Phase 15 fix: CH-3 | P18-R4 Phase 15 fix: CH-3 |
| `e8b1d26` | Phase 15 fix: CH-2 | P18-R4 Phase 15 fix: CH-2 |
| `1321e29` | Phase 15 fix: CH-4 | P18-R4 Phase 15 fix: CH-4 |
| `ef7c5b0` | Phase 15 fix: FX-L1 | P18-R4 Phase 15 fix: FX-L1 |
| `2bc35f0` | Phase 15 fix: FX-L2 | P18-R4 Phase 15 fix: FX-L2 |
| `c831fe6` | Phase 15 fix: CH-1 | P18-R4 Phase 15 fix: CH-1 |
| `17f4748` | Phase 15 fix: record CH-1 close-out | P18-R4 Phase 15 fix: record CH-1 close-out |
| `9859d73` | feat: Implement shared bottom navigation and UI improvements for Month Review and Budget screens | P18-R5 feat: Implement shared bottom navigation and UI improvements for Month Review and Budget screens |
| `798e8ef` | expo doctor fix | P18-R6 expo doctor fix |
| `367361c` | Phase 15 fix: P15-FIX-R5 close-out | P18-R6 Phase 15 fix: P15-FIX-R5 close-out |
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
| 1 | Expo Router static mobile MVP, theme/components, mock data and screens. | Partial prompt specified five tabs and no-op future actions; remainder and review unknown. Checkpoint reports static routes/UI and Expo/browser checks. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed (partial visible prompt) |
| 2 | Pure deterministic domain calculations, selectors, tests and screen wiring. | Early checkpoint found self-import, unnecessary summary extras, missing tests/config and unwired screens; later checkpoints report fixes/done, but exact correction record is absent. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 3 | Validated local persistence, Zustand/AsyncStorage, transaction CRUD/forms and settings. | Checkpoint reports schemas, recovery and 11 suites/76 tests; force-quit persistence was not device-verified. User review/corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 4 | Pure plan/loan actions, schemas, linked transactions, forms and routes. | Later checkpoint reports 12 suites/93 tests and browser checks; final linked-transaction validation edit awaited recheck at checkpoint. Exact user correction/review unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 5 | Goals, holdings, EF ledger/invariants, typed errors and UI. | Checkpoint reports implementation and 5 focused suites/50 tests; coverage/browser/device work still pending at that checkpoint. User review unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 6 | Recovery fixes, plain backup/import/undo, lock/privacy, erase, reminders/configuration. | Checkpoint reports 20 suites/132 tests, typecheck/lint/platform exports; requested full changed-source output was omitted. Device/APK, biometric, share/import UX and privacy checks remain unverified. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Verbatim (session export only) |
| P06-FIX-R1 | Visible date labels and full-width Save buttons across forms (2026-10-10). | Patch partially failed after `DateField` label support; not validated before export. Current repository was explicitly rechecked below, rather than trusting old checkpoint. | Held / unverified at export; now audited as CR-3. | Verbatim (session export only) |
| 7 | Schema v2 migration; Loans→Liabilities and typed entries/source links. | Initial prompt truncated; history reports completion but exact code/test/review mapping and user corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 8 | Unified recurring/one-time investment flows and manual holding ledger. | Checkpoint records implementation; original tests, review, corrections and final counts unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 9 | Instrument transaction linking both directions, missing-link creation and retargeting. | Checkpoints document instrument transaction work; exact prompt, test map and user review unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 10 | Schedules, upcoming dues, entries/payments lists and virtualization. | Checkpoint documents schedules and screens; exact acceptance/test mapping and user corrections unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 11 | Transaction/navigation behavior, error boundaries and shared headers/cards. | Later R3 audit found two user-visible assertions weakened/removed in intermediate work and restored them. Three-tab direction was superseded by four tabs. | Done (user-confirmed in app, 2026-10-15); FX-BASE follow-up `60b8c54`. | Reconstructed |
| 12 | Schema v3 onboarding, monthly salary/theme fields, palettes and branding. | Checkpoints report completion; exact version provenance, tests and user corrections unavailable. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 13 | Income wording, EF minimum target and transaction/goal/menu refinements. | Multiple checkpoints report work; exact prompt sequence, review, user corrections and final test map unknown. | Done (user-confirmed in app, 2026-10-15); no commit identified. | Reconstructed |
| 14 | A–G close-out: UI, v4 EF allocation, storage guard, reminders, encrypted backup and polish. | Initial completion report was challenged by user for wrong coverage arithmetic, skipped work and weakened tests; P15-A re-audited. Exact omissions unknown. | Done (user-confirmed in app, 2026-10-15); P15 follow-up commits below. | Reconstructed |
| 15 | Audit/fixes A/A2; B/C; schema v5 D; due engine E; G–J. | User required correct counts and restored assertions; P15-F/K/L/M held. P15-I count was corrected; CH/R4 mistakes and repairs recorded below. | A `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; A2 `0322c9d`; B `fbeb1d7`; C `e155bcd`; D `394d338`; E `f28657c`; G `9399e23`; H `68d9cd4`; I `19afe88`; J `1e206ad`. | Reconstructed |
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
| P01 | Phase 1 | — | 1 | unknown | Mobile foundation, design system and static screens. | Done (user-confirmed in app, 2026-10-15). | none identified | Partial prompt and later review unavailable. | reconstructed |
| P02 | Phase 2 | — | 1 | unknown | Pure domain logic and computed screens. | Done (user-confirmed in app, 2026-10-15). | none identified | Early self-import, unnecessary extras, missing tests/config and unwired screens; later resolution reported only. | reconstructed |
| P03 | Phase 3 | — | 1 | unknown | Validated local persistence and transaction forms. | Done (user-confirmed in app, 2026-10-15). | none identified | Native force-quit persistence not verified. | reconstructed |
| P04 | Phase 4 | — | 1 | unknown | Plan/loan flows and linked transactions. | Done (user-confirmed in app, 2026-10-15). | none identified | Final linked-transaction edit awaited revalidation at checkpoint. | reconstructed |
| P05 | Phase 5 | — | 1 | unknown | Goals, holdings and Emergency Fund flows. | Done (user-confirmed in app, 2026-10-15). | none identified | Coverage/browser/device checks remained pending at checkpoint. | reconstructed |
| P06 | Phase 6 | — | 1 | unknown | Review fixes, backup, lock/privacy and erase. | Done (user-confirmed in app, 2026-10-15); device/APK acceptance unverified. | none identified | Required full source contents were omitted from response. | verbatim in session export |
| P06-FIX-R1 | Phase 6 | — | 1 | 2026-10-10 | Visible form labels and full-width Save buttons. | Held / unverified at export; current state audited as CR-3. | none identified | Multi-file patch failed partway and was not validated. | verbatim in session export |
| P07 | Phase 7 | — | 2 | unknown | Schema v2 and Loans-to-Liabilities migration. | Done (user-confirmed in app, 2026-10-15). | none identified | Initial prompt truncated; exact review/tests unavailable. | reconstructed |
| P08 | Phase 8 | — | 2 | unknown | Unified investment ledger and manual holdings. | Done (user-confirmed in app, 2026-10-15). | none identified | Original request/review/test mapping unavailable. | reconstructed |
| P09 | Phase 9 | — | 2 | unknown | Instrument transaction linking/retargeting. | Done (user-confirmed in app, 2026-10-15). | none identified | Exact acceptance evidence unavailable. | reconstructed |
| P10 | Phase 10 | — | 2 | unknown | Schedules, dues, entry/payment lists and virtualization. | Done (user-confirmed in app, 2026-10-15). | none identified | Original test map and corrections unavailable. | reconstructed |
| P11 | Phase 11 | — | 2 | unknown | Transactions/navigation and crash/error handling. | Done (user-confirmed in app, 2026-10-15); later audited in FX-BASE. | none identified for P11 | R3 found two visible-message assertions weakened/removed in intermediate work; restored. | reconstructed |
| P12 | Phase 12 | — | 2 | unknown | Schema v3 onboarding, themes and branding. | Done (user-confirmed in app, 2026-10-15). | none identified | Exact schema-version provenance and review unavailable. | reconstructed |
| P13 | Phase 13 | — | 2 | unknown | Income wording, EF minimum and UI refinements. | Done (user-confirmed in app, 2026-10-15). | none identified | Prompt sequence and full review unavailable. | reconstructed |
| P14 | Phase 14 | — | 2 | unknown | Close-out/features A–G. | Done (user-confirmed in app, 2026-10-15); audited in P15-A. | none identified for original phase | User later reported wrong coverage arithmetic, skipped work and weakened tests. | reconstructed |
| P15-A | Phase 15 | — | 2 | 2026-10-11 | Audit Phase 14 and restore reliable gates. | Done (audit work). | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7` | Coverage-summary command failed; follow-up addressed coverage/test issues. | reconstructed |
| P15-A2 | Phase 15 | — | 2 | 2026-10-12 | Migration/premigration and assertion audit. | Done. | `0322c9d` | Restored assertions/version-chain behavior; exact prior assertion details unavailable. | reconstructed |
| P15-B | Phase 15 | — | 2 | 2026-10-12 | Phase 14 UI leftovers. | Done. | `fbeb1d7` | Exact scope unavailable. | reconstructed |
| P15-C | Phase 15 | — | 2 | 2026-10-12 | SIP date clarity and goal-card behavior. | Done. | `e155bcd` | Exact review unavailable. | reconstructed |
| P16-A | Phase 16 | P15-D | 2 | 2026-10-12 | Schema v5 and related data features. | Done. | `394d338` | One-time origin transaction ID interpretation was an assumption; approval unknown. | reconstructed |
| P16-B | Phase 16 | P15-E | 2 | 2026-10-12 | Shared schedules and due-clearing behavior. | Done. | `f28657c` | Exact prompt unavailable. | reconstructed |
| P23-A | Phase 23 | P15-F | 2 | unknown | Insurance management. | Planned; no delivery claimed. | none identified | Prompt details unknown. | unknown |
| P16-C | Phase 16 | P15-G | 2 | 2026-10-12 | Goal asset links and projection. | Done. | `9399e23` | Exact review unavailable. | reconstructed |
| P17-A | Phase 17 | P15-H | 2 | 2026-10-12 | Cash-flow history and money movement. | Done. | `68d9cd4` | CH-4 removed movement UI/route but retained shared logic required by liability receipt. | reconstructed |
| P17-B | Phase 17 | P15-I | 2 | 2026-10-12 | Monthly budget tracker. | Done. | `19afe88` | Earlier test-count report was corrected. | reconstructed |
| P17-C | Phase 17 | P15-J | 2 | 2026-10-12 | Sorting infrastructure and integrations. | Done. | `1e206ad` | Exact prompt unavailable. | reconstructed |
| P18-R1 | Phase 18 | P15-FIX-R1 | 2 | 2026-10-13 | Ledger/baseline and initial FX fixes. | Part 0 done; remaining FX work interrupted/unverified. | `db967bf`, `6562de1`, `6771f37` | Baseline had seven withdrawal-only render failures; work was left unverified. | verbatim in git at `5aeefb9` |
| P18-R2 | Phase 18 | P15-FIX-R2 | 2 | 2026-10-13 | Recover interrupted work and fix baseline. | Superseded by R3 audit/repair. | `6771f37`, `c0ba0da` | Two visible-message assertions were replaced with weaker checks; R3 restored them. | verbatim in git at `5aeefb9` |
| P18-R3 | Phase 18 | P15-FIX-R3 | 2 | 2026-10-13 | Audit FX-BASE and complete fixes with truthful gates. | Done; gates reported green twice. | `60b8c54`, `5f6f883`, `de94950`, `a3423ec`, `c1df77d`, `88d5190`, `b8bc4a1`, `5e2f78f`, `b205a84`, `862af8a`, `6627d03`, `f805481` | Restored UI messages/assertions; followed formal ₹1 crore cutoff over a conflicting example. | verbatim in git at `5aeefb9` |
| P18-R4 | Phase 18 | P15-FIX-R4 | 2 | 2026-10-14 | FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2, then CH-1. | Done; gates reported green twice; real-device behavior unverified. | `0df1952`, `8364053`, `03c67aa`, `172b24e`, `cac7cc0`, `e8b1d26`, `1321e29`, `ef7c5b0`, `2bc35f0`, `c831fe6`, `17f4748` | Fixed missing v6 fixture defaults, label-scan wording and unimported test error class without weakening assertions. Export date conflict resolved in favor of Git. | verbatim in git at `5aeefb9` |
| P18-R5 | Phase 18 | P15-FIX-R5 | 2 | 2026-10-15 | Unify bottom navigation; align Budget History/Month review actions; improve Cash flow and editable plan summary while preserving Sort UI. | Delivered in `9859d73`; R6 verified the full gates and corrected superseded layout expectations. Real-device checks remain outstanding. | `9859d73`; verification close-out in R6 | No SortChip appearance, options, logic, or placement changes. Visible/accessibility label is Transactions. | verbatim prior request |
| P18-R6 | Phase 18 | P15-FIX-R6 | 2 | 2026-10-15 | Close out R5: green baseline, SortChip/header history audit, Expo SDK patch alignment and complete gates. | Baseline 64 suites/659 tests, current 65 suites/669 tests, source coverage above floors, Doctor 21/21, both exports, TypeScript and lint pass; device checks remain unverified. | `798e8ef`, `367361c` | Updated superseded layout assertions; SortChip and sorting logic untouched. No WIP commit because the tree was clean. | verbatim current request |
| P22-B | Phase 22 | P15-SEED | 2 | unknown | Optional user spreadsheet/seed backup importer (formerly P19-E). | Planned; no prompt, implementation or matching commit found. | none identified | Scope/outcome unknown. | unknown |
| P18-LEDGER | Phase 18 | P15-LEDGER | 2 | 2026-10-14 | Merge exports/checkpoints, verify forms, remove prompt archive and close CR-2. | Earlier ledger task had already removed archive; form audit opened CR-3. | `d11af45`, `b92e145`, `2e5d594` | No application code changed in the ledger close-out. | verbatim in current request |
| P18-R0 | Phase 18 | P15-fix-0 | 2 | 2026-10-13 | Initial fix-round ledger/baseline. | Done. | `db967bf` | Progress-ledger test passed. | reconstructed |
| P18-R7 | Phase 18 | — | 2 | 2026-10-15 | Restore Transactions label, restructure phase tree/progress bars, record confirmation and CR-4–CR-8, and label old commits locally. | Focused tests and all required gates pass; device checks remain outstanding. | `e7d8173`, `0304acd`; this ledger commit | No history rewrite or push. | verbatim current request |
| P19-A | Phase 19 | — | — | 2026-10-15 | Five-group budget model, categories, suggestion, compact setup, subtotals and recurring items (CR-5). | Done; focused and full gates pass. | `acc94df`, `af885c1` | Assumed starter split and within-group weights are recorded in Section 4; schema remains v6. | current request |
| P19-B | Phase 19 | — | — | 2026-10-15 | Investment category and earned-income sync; History, Month review and Templates buttons; no Budget header menu (CR-9, CR-16). | Done; focused and full gates pass, including 500-case reconciliation. | `221d2ed` | Assumed the entire Budget header menu is removed. | current request |
| P19-C | Phase 19 | — | — | 2026-10-15 | Restore and freeze user-owned input components; Budget header icons (CR-17); compact Transactions balance card (CR-18); user-owned components (CR-19). | Done; focused and full gates pass; physical-device layout remains unverified. | this commit | Assumed commits without a Copilot co-author trailer are user-authored; current field files already matched `bf4adf3`, so no restore-only commit was needed. | current request |
| P20-A | Phase 20 | — | — | 2026-10-15 | Derived pending rows, FIFO Pay/Clear due and Undo, Transactions section and balance caption; applied budgets and recurring schedule slots (CR-6). | Done; focused 10 suites/246 tests and full 70 suites/720 tests pass; coverage, TypeScript, lint, Doctor and Android/iOS exports exit 0. | `8545909` | No new assumptions. | current request |
| P20-B | Phase 20 | — | — | 2026-10-16 | Home due action sheet and collapsed category spending with conditional Apply budget (CR-7, CR-10; formerly P19-C). | Done; focused Home/route tests pass; full 70-suite/720-test coverage run and all final gates pass. | `1c596e0` | Assumed Home's existing five-item due preview cap remains unchanged. | current request |
| P20-C | Phase 20 | — | — | 2026-10-16 | Bottom tabs only on Home, Transactions, Goals and Budget; no detail-route tab bars (CR-11). | Done; focused route/tab tests pass; full 70-suite/720-test coverage run and all final gates pass. | this commit | Replaced the P18-R5 test that expected one Budget-selected bar on history/review with route-registry no-bar checks and exactly one correctly selected bar on each main tab; DEC-TABS supersedes the old behavior. | current request |
| P20-D | Phase 20 | — | — | 2026-10-16 | Due-payment clearing, the user-kept always-visible balance card, Home due sheet position, Budget menu and due formatting (CR-21–CR-26). | In progress; CR-21 implementation/style test passes; CR-26 Doctor 21/21 and both exports pass. | `8590a4a`, `13fbae8`; P20-D commit pending | Assumed sheet max height is 60% of window height and bottom inset is added to 12pt spacing. | current request |
| P21-A | Phase 21 | — | — | 2026-10-16 | Emergency-fund goal links; remove EF entries and exclude EF from net worth; schema v7 (CR-8, CR-13, CR-20; split from P19-D). | Implementation and feature tests complete; Pending until Expo Doctor is green. | `3ac13a7` | Migrated positive ledger balances into a manual holding; bucket links gain emergency-goal shares or are dropped if fully allocated. | current request |
| P21-B | Phase 21 | — | — | 2026-10-16 | Months of cover, salary fallback, allocation edit and linked-assets table (CR-14, CR-15, CR-20; split from P19-D). | Implementation and feature tests complete; Pending until Expo Doctor is green. | this commit | Visualization-only EF screen; only goal-link management and allocation editing remain. Device behavior unverified. | current request |
| P22-A | Phase 22 | — | — | 2026-10-16 | Deterministic four-month linked demo data, undoable development loader, and DEC-DEMO (CR-12). | Implementation and acceptance tests pass; Pending because Expo Doctor reports the existing `ios.icon` app-config schema error. | `1f2d9c8` | Preserved existing `mockAppData` fixtures; expanded strict import validation to preserve supported `snapshotAdjustment`. Device behavior remains unverified. | current request |
| P24-A | Phase 24 | P15-K | 2 | unknown | Reminders and notifications, including CR-1. | Planned; no delivery claimed. | none identified | No verified planner/preferences/notification adapter or screen. | unknown |
| P25-A | Phase 25 | P15-L | 2 | unknown | Encrypted backups. | Planned; no delivery claimed. | none identified | Current backup remains unencrypted. | unknown |
| P26-A | Phase 26 | P15-M | 2 | unknown | Accessibility/performance and final gates. | Planned; no delivery claimed. | none identified | No comprehensive device/accessibility audit. | unknown |
| P27-A | Phase 27 | — | — | planned | Cleanup: dead code, dependencies, bundle, README and schedule benchmark. | Planned; no implementation claimed. | none | New roadmap item. | planned |
| P28-A | Phase 28 | — | — | planned | QA and release. | Planned; no implementation claimed. | none | New roadmap item. | planned |

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-1 | 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not' | Open | Held for P24-A; notification design, permission behavior, and tests remain outstanding. |
| CR-2 | LEDGER-BACKFILL: merge session exports and checkpoint evidence into the permanent project record, reconcile against Git, and remove prompt archives from the repository. | Done | This commit completes the checkpoint-informed merge and CR-3 form audit. The earlier P15-LEDGER commits removed the prompt archive; recovery is `5aeefb9`. |
| CR-3 | Form labels and full-width Save follow-up from 2026-10-10. | Open | Every current `app/*-form.tsx` field has a visible label. Save is not full width while an error summary is visible in `profile-form.tsx` and `transaction-form.tsx`; no code changed. |
| CR-4 | Tab label must read Transactions, never Txns. | Done | `0304acd`; single-line fit behavior, 44pt target and source guard tested. |
| CR-5 | Budget divided into five groups: Survival (Needs); Savings and Investments; Wants (non-essential or lifestyle spending: eating out, online shopping, entertainment, fashion); Festival, Donations, Culture; Unexpected Extras (surprises and emergencies: medical bills, home or vehicle repairs, sudden gifts); compact Set up your budget inputs; replace the Line type label. | Done | P19-A; focused and full gates pass. |
| CR-6 | Applied budget and all recurring items (assets and liabilities, past and future) show in Transactions as pending, with Pay and Clear due. | Done | P20-A (formerly P19-B). |
| CR-7 | Home upcoming and due rows offer Pay and Clear due and update Transactions. | Done | P20-B (formerly P19-C). |
| CR-8 | Emergency fund goal can link assets like other goals; Emergency fund is not listed as an asset. | Pending | P21-A implementation/tests complete; phase held by non-green Expo Doctor gate. |
| CR-9 | Budget review retains every investment category and includes Freelance, Rental, Business and Other earned income by source. | Done | P19-B; category/source reconciliation tests pass. |
| CR-10 | Home spending by category is collapsed, with Apply budget. | Done | P20-B. |
| CR-11 | Bottom tabs appear only on Home, Transactions, Goals and Budget. | Done | P20-C; DEC-TABS. |
| CR-12 | Four months of linked demo data; every feature part extends demo data and tests. | Pending | `buildDemoData`, integrity/budget/pending/net-worth/storage tests, loader Undo test and every-route smoke test pass; Expo Doctor gate remains non-green. |
| CR-13 | Remove emergency-fund entries and exclude emergency fund from net worth; schema v7. | Pending | P21-A implementation/tests complete; phase held by non-green Expo Doctor gate. |
| CR-14 | Emergency-fund months of cover use salary fallback. | Pending | P21-B implementation/tests complete; phase held by non-green Expo Doctor gate. |
| CR-15 | Minimal emergency-fund allocation edit UI and linked-assets allocation table. | Pending | P21-B implementation/tests complete; phase held by non-green Expo Doctor gate. |
| CR-16 | Templates joins History and Month review; remove Budget header menu. | Superseded by CR-17 | P19-B's body action row was replaced by the Budget header icons in P19-C. |
| CR-17 | Put History, Month review and Templates in the Budget header as ordered, accessible right-side icons; no body action row or header menu. | Done | P19-C; action labels, icon order, routing, pending dot and style contracts tested. |
| CR-18 | Compact expandable Transactions balance card with four balanced metrics, secondary money/pending caption and review action. | Done | P19-C; collapsed/expanded structure, responsive 2x2 grid, labels, review and negative-balance behavior tested. |
| CR-19 | Input components are user-owned; restore the user's versions and freeze them against agent edits. | Done | P19-C; current field files matched the latest user-authored version; SHA-256 manifest and guard test added. |
| CR-20 | Emergency fund is a goal, not an entity: remove ledger entries and the Emergency fund invest category and instrument reference; visualization-only screen. | Pending | P21-A/B implementation/tests complete; phase held by non-green Expo Doctor gate. |
| CR-21 | Anchor Home due popup to the bottom safe area, bound and scroll the sheet, and support backdrop dismissal. | Pending | P20-D. |
| CR-22 | Keep only the user's surviving Available/Closing balance elements and remove its expansion behavior. | Pending | P20-D; DEC-USER-CHANGES records the preserved element set. |
| CR-23 | Clear later due slots by paying through them in FIFO order, with atomic records and one-step Undo. | Pending | P20-D; no per-installment payment-tracking schema change. |
| CR-24 | Replace Budget's three header actions with a single three-dot menu and ordered Budget/global entries. | Pending | P20-D; supersedes CR-17. |
| CR-25 | Format Budget bills/dues and the no-budget card with responsive row layout and actions. | Pending | P20-D. |
| CR-26 | Repair the redundant iOS icon override so Expo Doctor passes. | Done | `8590a4a`; top-level and iOS icon paths were identical; `npx expo-doctor` now passes 21/21. |

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
- **Phase 19-C device acceptance not verified:** actual title/icon fit at 360pt and OS font scale 2.0; native 44pt touch targets and VoiceOver/TalkBack announcements; rendered 130pt expanded-card height, clipping and scrolling at font scales 1.0/1.3/2.0; and route behavior on physical iOS/Android devices. Tests assert styles and simulated font-scale state only.
- **P21-A/B device acceptance not verified:** actual screen-reader announcements and link/edit flow on physical devices; native dynamic type scaling and clipping in Emergency fund and allocation screens; allocation table wrapping/scrolling; and safe-area/sticky-total behavior on physical iOS/Android. Tests cover pure links/migrations, style contracts, and simulated font scales but no real device.
- **P21 Expo Doctor blocker, resolved by P20-D CR-26:** the original Doctor result was 20/21 because user-authored `beb9711` set `ios.icon` to the same PNG as the top-level icon. Commit `8590a4a` removes only the duplicate iOS override. `npx expo-doctor` now passes 21/21; Android and iOS exports also pass. The P21 closure status will be recomputed after final sequential gates.
- **P22-A real-device acceptance not verified:** menu confirmation and navigation to Backup/restore, platform persistence and Undo after app restart, and usability/rendering of every screen with the generated four-month dataset have only been checked in Jest/TestRenderer and the store mock; no physical iOS/Android device was used. Automated gates are being rerun for final close-out.
- **P20-D CR-21 device acceptance not verified:** bottom placement above physical iOS/Android home indicators, backdrop hit testing, scroll gestures with system font scale 2.0, and action-sheet clipping/keyboard interaction; Jest asserts container inset, `justifyContent`, max-height and `scrollEnabled` style props only.
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
- Phase 1–14 original commit hashes/dates are not identifiable in the
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
- **Phase 20 device checks:** all layout and interaction checks were simulated
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
- Phase 6 real-device/emulator items remain unverified: share-sheet backup and
  import, document picker, biometric/passcode behavior, foreground/background
  lock grace, app-switcher/screenshot privacy, erase UX, force-quit persistence,
  and `allowBackup: false` in a built APK. Phase 6 web execution is unknown.
- P14 review details and exact skipped deliverables remain unknown beyond
  the user's report of incorrect coverage arithmetic, skipped work and
  weakened tests. Original prompt and commit mapping for Phases 1–14 remain
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
  delivery evidence; Phase 15-F's prompt/scope is unknown and its status is
  explicitly Held. Phase 1–14 original hashes remain unidentifiable.
- **Current form audit (2026-10-14):** every field has a visible label;
  `DateField` and `MoneyField` supply visible defaults (`Date`, `Amount`)
  where a route omits an explicit label. Two Save buttons become narrower
  when validation summaries are present; these are recorded as CR-3. No form
  source was changed for this audit.

| Form route | Visible field labels | Save full width |
|---|---|---|
| `budget-month-form.tsx` | Yes | Yes; footer column stretches the Save button. |
| `budget-template-form.tsx` | Yes | Yes; footer column stretches the Save button. |
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

1. **Phase 19 — Budget model and sync** (Done): P19-A five-group setup (CR-5),
   P19-B investment/income reconciliation and Budget actions (CR-9, CR-16), and
   P19-C header icons, user-owned inputs and balance card (CR-17–CR-19).
2. **Phase 20 — Pending items, Home and navigation** (Done): P20-A pending
   Transactions with Pay/Clear due (CR-6), P20-B Home due actions and collapsed
   spending plan (CR-7, CR-10), and P20-C main-screen-only tabs (CR-11).
3. **Phase 21 — Emergency fund as a goal-linked model** (Pending; implementation
   delivered, Expo Doctor gate unresolved): P21-A links,
   entries and net-worth/schema v7 changes (CR-8, CR-13); P21-B cover,
   allocation editing and linked-asset table (CR-14, CR-15).
4. **Phase 22 — Demo data and seed importer** (Pending; P22-A awaits green
   Expo Doctor): P22-A four months of linked demo data (CR-12); P22-B optional
   spreadsheet importer [P15-SEED].
5. **Phase 23 — Insurance** (Planned) [P15-F].
6. **Phase 24 — Reminders and notifications** (Planned), including CR-1
   [P15-K].
7. **Phase 25 — Encrypted backups** (Planned) [P15-L].
8. **Phase 26 — Accessibility, performance and final gates** (Planned)
   [P15-M].
9. **Phase 27 — Cleanup** (Planned): dead-code audit (including whether
   `SectionHeaderRow` and `fitsInline` remain used after the ChipRow redesign),
   unused dependencies, bundle audit, README, and a more robust schedule
   benchmark.
10. **Phase 28 — QA and release** (Planned).

## 10. Verification matrix

An item is `Done` only when its named source and test evidence are available.
Paths below are repository-relative. Baseline results are not completion
evidence for the fixes.

### P18-R7 housekeeping

| Step | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| STEP 1 — Transactions tab label | Done | `src/components/ui.tsx`; `src/components/__tests__/BottomTabBar.test.tsx`; `src/components/__tests__/TabsLayout.test.tsx`; `src/lib/__tests__/noTxnsLabel.test.ts`; commit `0304acd` | Four focused suites / 18 tests; single-line fit contract, minimum font scale, accessibility label and 44pt target checked at 1.0, 1.3 and 2.0. |
| STEP 2 — Phase tree | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts` | Ten-section heading order; new IDs are unique in dashboard/log; legacy IDs occur once in dashboard mapping column; FX/CH/CR identifiers retained. |
| STEP 3 — Progress bars | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts` | Test recomputes each 10-character bar, percentage, and done/total from dashboard status. |
| STEP 4 — Confirmations and CRs | Done | `docs/PROGRESS.md` | Dated user-confirmation line; CR-4 Done and CR-5–CR-8 Planned, mapped to P19-A–D. |
| STEP 5 — Local commit labels | Done | `docs/PROGRESS.md`; local `refs/notes/phases` and annotated tags | Commit-subject map cross-checked against Git; notes and tags created locally, without history rewrite or push. |
| STEP 6 — Gates and ledger | Done | `docs/PROGRESS.md`; `src/lib/__tests__/progressLedger.test.ts`; tab tests | Focused tests, coverage, TypeScript, lint, Doctor, Android/iOS exports, and line/branch coverage aggregation are recorded in the close-out. |

### Phase 19 — budget model and sync

| Part | Status | Files / source evidence | Test / verification evidence |
|---|---|---|---|
| P19-A — expanded five-group budget setup | Done | `src/domain/budget.ts`, `src/domain/schemas.ts`, budget forms, grouped/compact form components, recurring-items summary, mock data | Focused 11 suites/235 tests; full 68 suites/702 tests; tsc, lint, Doctor 21/21, Android/iOS exports all exit 0. Domain 98.48% lines/93.59% branches; data excluding hooks 92.45%/90.87%; pure lib 100%/100%. |
| P19-A — earlier grouped-form delivery | Historical baseline only | `src/domain/schemas.ts`; `src/components/form/BudgetCategorySections.tsx`; `app/budget-template-form.tsx`; `app/budget-month-form.tsx`; `src/mock/data.ts`; `src/domain/__tests__/budget.test.ts`; `src/components/__tests__/RouteRenderSmoke.test.tsx` | Prior gates were reported green for the older scope; they do not verify current P19-A requirements. Schema v6 remained unchanged. |
| P19-B — budget category/income sync and actions | Done | `src/domain/budget.ts`, `src/domain/links.ts`, `src/domain/transactions.ts`, `app/(tabs)/budget.tsx`, `app/month-review.tsx`, investment/income demo data | Every invest category through form/store/Transactions/budget; earned sources and non-earned inflows in review; 500 seeded reconciliation cases (seed 19052026); 11 focused suites/235 tests and 68 full suites/702 tests. All gates exit 0; device checks remain listed in Section 8. |
| P19-C — owned inputs, Budget header icons and balance card | Done (automated; device checks outstanding) | `src/components/form/frozen-manifest.json`, `scripts/freezeFormComponents.js`, `src/components/AppHeader.tsx`, `app/(tabs)/budget.tsx`, `app/(tabs)/transactions.tsx`; focused UI/form/ledger tests | Focused 9 suites/203 tests; full 68 suites/707 tests; TypeScript, lint, Doctor (21/21), Android/iOS exports and `git diff --check` all exit 0. Istanbul: domain 98.48% lines/93.59% branches; data excluding hooks 92.45%/90.87%; pure lib 100%/100%. Input source diff against `bf4adf3` is empty. Device layout and screen-reader behavior remain unverified. |

### Phase 14 items

| Item | Status | Source evidence | Test evidence / gap |
|---|---|---|---|
| P14-A close-out/UI | Pending, user-reported | `app/`, `src/components/` | Phase 14-specific test mapping unavailable; Part 15 A/B/C evidence is not full P14 acceptance. |
| P14-B refinements | Pending, user-reported | `app/`, `src/components/` | Original acceptance/test names unavailable. |
| P14-C schema v4 / EF allocation | Pending as P14; follow-up verified in P15-A/A2 | `src/domain/efAllocation.ts`, `src/domain/schemas.ts`, `src/data/migrate.ts` | `src/domain/__tests__/efAllocation.test.ts`; `src/data/__tests__/migrateV4.test.ts`; does not prove all P14 criteria. |
| P14-D storage guard | Pending, user-reported | `src/lib/storageGuard.ts`, `src/data/safeStorage.ts` | `src/lib/__tests__/storageGuard.test.ts`; P14 phase acceptance not established. |
| P14-E reminders | Pending / held follow-up | No verified reminder planner or route | No reminder tests; P15-K held. |
| P14-F encrypted backup | Pending / held follow-up | Plain backup only: `src/domain/backup.ts` | `src/domain/__tests__/backup.test.ts` only covers plain backup; P15-L held. |
| P14-G polish | Pending, user-reported | `app/`, `src/components/` | Original test matrix unavailable. |

### Phase 15–17 data and UI items

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

#### Phase 20 final gates

All commands ran sequentially after the Phase 20 source changes; each exited 0.

| Gate | Result | Exit |
|---|---|---:|
| Focused Phase 20/ledger tests | 9 suites, 213 tests passed | 0 |
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
### Phase 21 — Emergency fund goal model and allocation

Schema changed from v6 to v7 in P21-A; P21-B did not change the schema. Feature
implementation and feature-specific tests are complete. P21-A/B and CR-8,
CR-13, CR-14, CR-15 and CR-20 remain Pending because Expo Doctor did not pass.

| Part | Status | Coverage evidence | Test / verification evidence |
|---|---|---|---|
| P21-A emergency-fund linked model [schema v7] | Pending | v6→v7 migration, backups, premigration archive, link integrity, category remap and total preservation | `src/data/__tests__/migrate.test.ts`, `migrateV4.test.ts`, `safeStorage.test.ts`, `createAppStore.test.ts`; `src/domain/__tests__/backup.test.ts`, `goalLinks.test.ts`, `schemas.test.ts` |
| P21-B emergency-fund cover/allocation | Pending | Expense/salary fallback, truncation, minimum target, linked table and compact allocation UI | `src/components/__tests__/EmergencyGoalScreens.test.tsx`, `EfAllocationForm.test.tsx`; `src/domain/__tests__/selectors.test.ts`, `efAllocationCustom.test.ts` |

#### Phase 21 gates

| Gate | Result | Exit |
|---|---|---:|
| `npm test -- --coverage` | 69 suites / 723 tests passed. Domain: 98.33% lines, 93.54% branches; data excluding hooks: 93.38% lines, 87.73% branches; pure lib: 100% lines and branches. | 0 |
| `npx tsc --noEmit` | Typecheck passed. | 0 |
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

#### Phase 22-A gates

P22-A implementation and acceptance tests are green, but the part is Pending
because the required Expo Doctor gate is not green. No schema change was made;
`SCHEMA_VERSION` remains 7.

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

| P22-A four-month linked demo | Pending | `src/mock/demoData.ts`, development-menu loader, and strict import preservation of `snapshotAdjustment` | `src/mock/__tests__/demoData.test.ts`, `src/data/__tests__/createAppStore.test.ts`, `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/lib/__tests__/appMenu.test.ts`; all acceptance tests pass, but required Expo Doctor gate is non-green |
| P22-B spreadsheet importer [P15-SEED] | Planned | No importer implementation | Importer tests pending |
| P23-A insurance [P15-F] | Planned | No policy CRUD action/screen set | No policy-action/UI tests |
| P16-C goal links | Done | `src/domain/goalLinks.ts`, `src/domain/goals.ts`, `app/goal-form.tsx` | `src/domain/__tests__/goalLinks.test.ts`, store and route smoke suites |
| P17-A cash flow/movements | Done | `src/domain/cashFlow.ts`, `app/month-review.tsx`, `app/money-movement-form.tsx` | `src/domain/__tests__/cashFlow.test.ts`, `src/data/__tests__/createAppStore.test.ts` |
| P17-B budgets | Done | `src/domain/budget.ts`, `app/budget.tsx`, `app/budget-template-form.tsx`, `app/budget-history.tsx` | `src/domain/__tests__/budget.test.ts`, `src/data/__tests__/createAppStore.test.ts`, route and Transactions screen suites |
| P17-C sorting | Done | `src/lib/sorting.ts`, `src/data/useSort.ts`, `src/components/SortChip.tsx`, sortable `app/` lists | `src/lib/__tests__/sorting.test.ts`, `src/data/__tests__/metaStore.test.ts`, screen and route smoke suites |
| P24-A reminders / CR-1 [P15-K] | Planned | No verified planner, prefs, notification adapter or screen | No reminder tests |
| P25-A encrypted backup [P15-L] | Planned | `src/domain/backup.ts` is unencrypted | No encryption tests |
| P26-A accessibility/performance [P15-M] | Planned | No final audit artifact | No comprehensive device/accessibility suite |
| P27-A cleanup | Planned | Dead-code/dependency, bundle, README and schedule benchmark audit pending | Cleanup gates pending |
| P28-A QA and release | Planned | QA and release work not started | Release checklist pending |

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
