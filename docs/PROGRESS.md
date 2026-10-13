# Wealth Wise master progress ledger

## 1. How to use this file

This is the permanent status, decision, evidence, and verification ledger for
Wealth Wise. Every future prompt starts by reading this file and ends by
updating the dashboard, the prompt log, the change-request register, and the
verification matrix, then committing those updates. Use IDs `P<phase>-<part>`
for phase prompts, `FX-<id>` for fixes, and `CR-<n>` for change requests.
Never delete history: supersede an earlier entry with a dated note. When the
repository and this ledger disagree, the repository wins; correct the ledger
and record the correction. Do not infer completion from a prior summary or a
prompt: require a repository commit and named test evidence. Never push.

## 2. Status dashboard

`Done` requires a verified commit and test. `Held` means explicitly deferred by
the user. `Pending` means in scope but not yet verified. `Planned` means later
roadmap work. Hashes are repository evidence; user claims that cannot be proven
are called out as such.

| ID | Status | Evidence | Last updated |
|---|---|---|---|
| Phase 1 | Pending | user-reported, unverified; initial HTML prototype/Expo UI history not recoverable from current Git history | 2026-10-13 |
| Phase 2 | Pending | user-reported, unverified; no phase-tagged commit or original coverage report available | 2026-10-13 |
| Phase 3 | Pending | user-reported, unverified; current store exists, original schema-v1 commit not identified | 2026-10-13 |
| Phase 4 | Pending | user-reported, unverified; current implementation exists, original phase evidence unavailable | 2026-10-13 |
| Phase 5 | Pending | user-reported, unverified; exact original phase commit/test mapping unavailable | 2026-10-13 |
| Phase 6 | Pending | user-reported, unverified; current plain backup/security features do not prove all original acceptance criteria | 2026-10-13 |
| Phase 7 | Pending | user-reported, unverified; schema-v2 migration code is present, historical phase commit not identified | 2026-10-13 |
| Phase 8 | Pending | user-reported, unverified; current investment features do not prove the original phase report | 2026-10-13 |
| Phase 9 | Pending | user-reported, unverified; current link-management code does not prove the original phase report | 2026-10-13 |
| Phase 10 | Pending | user-reported, unverified; current schedules and virtualized history do not prove original acceptance | 2026-10-13 |
| Phase 11 | Pending | user-reported, unverified; exact original crash-fix evidence unavailable | 2026-10-13 |
| Phase 12 | Pending | user-reported, unverified; schema-v3/theme code is present, original phase report unavailable | 2026-10-13 |
| Phase 13 | Pending | user-reported, unverified; current UI has related work, no phase-tagged commit/test matrix | 2026-10-13 |
| Phase 14 A-G | Pending | user-reported, unverified as a phase; audited follow-up evidence is in Phase 15 A/A2 and later parts | 2026-10-13 |
| P15-A | Done | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; audit/gate evidence in this repository | 2026-10-13 |
| P15-A2 | Done | `0322c9d`; migration, premigration archive, restored assertions and coverage files | 2026-10-13 |
| P15-B | Done | `fbeb1d7`; Phase-14 UI follow-up files and screen tests | 2026-10-13 |
| P15-C | Done | `e155bcd`; date clarity and Home card tests | 2026-10-13 |
| P15-D | Done | `394d338`; schema v5 migration, policy and goal-link tests | 2026-10-13 |
| P15-E | Done | `f28657c`; shared due engine and due/store/screen tests | 2026-10-13 |
| P15-F | Held | Explicitly deferred by current user prompt; no insurance-management screen/action set yet | 2026-10-13 |
| P15-G | Done | `9399e23`; goal-link, projection, store and route tests | 2026-10-13 |
| P15-H | Done | `68d9cd4`; cash-flow, seeded conservation, movement and store tests | 2026-10-13 |
| P15-I | Done | `19afe88`; budget domain, store, backup, category, dues and route tests | 2026-10-13 |
| P15-J | Done | `1e206ad`; sort comparator, persistence, screen and route tests | 2026-10-13 |
| P15-K | Held | Explicitly deferred; no reminder planner/preferences/notifications route yet | 2026-10-13 |
| P15-L | Held | Explicitly deferred; encrypted-backup work not implemented | 2026-10-13 |
| P15-M | Held | Explicitly deferred; final accessibility/performance audit not implemented | 2026-10-13 |
| P15-fix-0 | Done | `db967bf`; `src/lib/__tests__/progressLedger.test.ts` passes | 2026-10-13 |
| FX-BASE | Done | `c0ba0da` plus Round 3 audit: `TransactionsScreen.test.tsx`, `StatPill.test.tsx`; full suite 520 tests, tsc, lint, Android/iOS export and Doctor pass | 2026-10-13 |
| FX-U1 | Partial | Compact amount formatter/component exist; comprehensive amount scan and exact accessibility labels remain unverified | 2026-10-13 |
| FX-U2 | Partial | SectionHeaderRow and fitting helper exist; all-sort-screen scan and font-scale-2 render proof remain | 2026-10-13 |
| FX-U3 | Partial | Route registry exists; route-specific header/back behavior and 44pt control tests remain | 2026-10-13 |
| FX-U4 | Partial | Shared FormScreen close/discard exists; dirty state is not wired/tested across every form route | 2026-10-13 |
| FX-B1 | Partial | Three category values and budget weights exist; Home breakdown, all category surfaces and v5 backup regression remain | 2026-10-13 |
| FX-B2 | Partial | Budget tab exists; header-menu reachability and complete tab/link/navigation verification remain | 2026-10-13 |
| FX-T1 | Partial | '+' routes to the form and movement menu remains; direct-route, menu and all-type save tests remain | 2026-10-13 |
| FX-T2 | Partial | `availableBalance` and initial tests exist; full requested edge-case/integration verification remains | 2026-10-13 |
| FX-T3 | Partial | New categories exist in domain/mock data; add/edit/filter/category-navigation tests remain | 2026-10-13 |
| FX-T4 | Partial | Expandable balance card exists; requested layout, row, review/dismissal and tone tests remain | 2026-10-13 |
| FX-E1 | Partial | Amount tiers are partially applied to EF surfaces; exact parent labels and specified screen render tests remain | 2026-10-13 |
| FX-E2 | Partial | Both suggested-mix actions and hints exist; behavior/result evidence and handler/no-orphaned-string tests remain | 2026-10-13 |
| CR-1 | Open | Deferred to held P15-K; verbatim request is in the change-request register | 2026-10-13 |
| Phase 16 | Planned | Cleanup, unused dependency/dead-code review, bundle audit, README | 2026-10-13 |
| Phase 17 | Planned | QA/release: property tests, QA checklist, release engineering, local diagnostics | 2026-10-13 |

### Resume point

FX-BASE is verified and committed; next is FX-E2. Round 3 baseline gates pass:
coverage 520 tests, tsc, Expo lint, Android/iOS exports, and Expo Doctor 21/21.
FX-U1 through FX-E1 and FX-E2 remain Partial pending their ordered work.

**FX-BASE root cause and audit:** the withdrawal-only screen mock lacked
`useWindowDimensions`; the selector already returned `rates: null` for zero
earned income. The Round 2 test changed the old “No earned income logged this
month” assertion to a summary-data assertion and changed the old “Includes
₹5,000 from withdrawals, borrowing, loan proceeds and own funds” assertion to
only check the “Other money in” label. Round 3 restored both visible messages
(the latter when expanded), and tests now assert them alongside `rates: null`
and no rendered `NaN`. StatPill accepts text, so monetary call sites retain
compact display while passing an exact accessibility label.

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
- Tabs, in order: Home, Txns, Goals, Budget.
- Add/Edit/Delete are icon actions. Deposit/Withdraw/Pay EMI/Log
  installment/Save/Clear due/Clear past dues are text with a small icon.
  `CardHeaderRow` or `ListRow` alone owns the edit pencil. Goal cards open the
  editor on tap and have no pencil. Home quick actions uniquely pair icons and
  text.
- Commit each part locally, never push, and update this ledger at each part.

## 4. Architecture and decisions

### Storage and purity

The app uses local AsyncStorage through Zustand persistence as one JSON blob.
Schema migrations are deterministic and versioned. There is no cloud,
authentication service or runtime network dependency. `src/domain` owns pure
calculation, validation, integrity and immutable actions. Inject dates and IDs.
One action that touches linked entities must be atomic and go through one store
write. UI state/preferences that are not app financial data belong in the
meta-store.

### Schema history

| Version | Recorded addition |
|---|---|
| v1 | Initial persisted app data and transaction records. Exact historical field inventory is user-reported; original schema artifact was not found. |
| v2 | Loans became recurring/one-time `Liability`; log entries became investment entries and liability payments; transaction source kinds renamed; migration and linked-entry requirements. |
| v3 | Onboarding state, `monthlySalary`, and `ThemeId`/theme preference. |
| v4 | Emergency-fund allocation percentages across seven buckets. |
| v5 | Liability settlement snapshots, goal asset links, policies, budget templates/month snapshots, and additional transaction source/category types. |

Current source of truth: `SCHEMA_VERSION = 5`. This fix round may add accepted
category strings, but must not change the stored schema version.

### Backups and migrations

Persisted migration functions and backup import remain pure apart from injected
checksum/digest adapters at their boundary. Legacy backups have their checksum
verified against the data as written before migration and current-schema
validation. Newer schema backups are refused. Premigration raw blobs are
preserved once; erase-all removes the archived copies.

### Amount display policy (FX-U1; design agreed, implementation pending)

| Surface | Tier | Planned rule |
|---|---|---|
| Details, inputs, dialogs, confirmations, toasts, backup summaries, month review | exact | Always Indian-grouped full figure |
| Hero values (>=24pt), tiles, pills, headlines, chart labels | hero/tile | Compact at absolute amount >= ₹1,000 |
| Rows, chips, captions, secondary values (<=14pt) | row | Exact below ₹1 crore; compact at/above ₹1 crore; compact sooner for font scale >1.3 when exact text exceeds 10 characters |
| Screen reader label | exact | Always announce the full exact amount, regardless of visual tier |
| Large money input helper | exact input + compact helper | Show full input; below it show compact check amount from ₹1 lakh |

These are requirements; the formatter and AmountText have partial
implementations, but application-wide integration, scan and accessibility
proof remain incomplete. `formatINRShort` must retain its existing output
while the new formatter handles K/L/Cr promotion.

### Route-kind registry (FX-U3; implementation pending)

| Kind | Planned routes | Left control |
|---|---|---|
| tab | Each route in `app/(tabs)/` | None |
| stack | Read-only/list/detail screens | Back arrow; router back, Home replacement for deep links |
| form | `*-form`, clear-dues, month-review and modal pickers | Close X; dirty state asks to discard |
| special | Onboarding and lock | None |

The route-kind registry and route enumeration test exist, but route-specific
header/back behavior, fallback behavior and control-target assertions remain
incomplete.

### Theme, navigation and shared UI

Theme IDs in source: `system`, `light`, `dark`, `sky`, `mint`, `blush`,
`midnight`. The current fix-round tree has four tabs (Home, Txns, Goals, Budget)
with Budget under `(tabs)`. Shared UI follows the standing text-versus-icon
rules in Section 3. Measured header layout, route-kind behavior, and
close/discard behavior remain partial.

## 5. Phase history

Historical Phases 1-13 below preserve the supplied project seed. Their exact
original commits/prompts are not identifiable from the current Git history;
do not treat the summaries as independently verified release evidence.

| Phase | History and reconciliation |
|---|---|
| 1 | User-reported: static UI, design system, theme tokens, mock data. Original phase commit not identifiable. |
| 2 | User-reported: pure SIP/loan/EF/goal/transaction/portfolio domain and Jest coverage. Original phase report unavailable. |
| 3 | User-reported: Zustand + AsyncStorage, transaction CRUD, schema v1 and corruption recovery. Current store exists; initial commit mapping unverified. |
| 4 | User-reported: SIP installments, loan payments, linked transactions and atomic writes. Current code contains related functionality; original phase mapping unverified. |
| 5 | User-reported: goals, manual holdings, EF entries/invariants and typed errors. Original phase mapping unverified. |
| 6 | User-reported: backup, app lock, screenshot privacy, erase-all and storage metadata. Existing features do not prove full historical acceptance. |
| 7 | User-reported: schema v2 migration, Liability union, renamed linked sources, withdrawals and Home navigation. Migration implementation is present; original prompt/commit mapping unavailable. |
| 8 | User-reported: unified investment form and manual ledger. Original phase mapping unverified. |
| 9 | User-reported: two-direction instrument transaction linking and retargeting. Original phase mapping unverified. |
| 10 | User-reported: schedules and virtualized entry/payment lists. Current schedules are present; original acceptance report unavailable. |
| 11 | User-reported: Transactions crash fix, error boundaries, tabs/header, unified cards and icon actions. Repo baseline currently has three tabs; exact release proof unavailable. |
| 12 | User-reported: schema v3, themes, onboarding and branding. Current source has schema v3-era fields/themes; historical checks unverified. |
| 13 | User-reported: income wording, EF minimum, quick action and header refinements. Original phase report unavailable. |
| 14 | User-reported parts A-G: UI, schema v4/EF allocation, storage guard, reminders, encrypted backup and polish. Initial report was deemed unreliable and audited under P15-A; implementation criteria not all proven. |
| 15-A/A2 | Audit and follow-up. Commits `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`, `0322c9d`. Restored tests/config, corrected migration and preserved raw premigration data; see dashboard and matrix. |
| 15-B/C/D/E | Commits `fbeb1d7`, `e155bcd`, `394d338`, `f28657c`. UI follow-up, SIP date clarity, schema v5 and shared due engine. |
| 15-F | Held by user; insurance management is not part of this run. |
| 15-G/H/J/I | Commits `9399e23`, `68d9cd4`, `1e206ad`, `19afe88`. Goal asset links/projection, historical cash flow/movements, list sorting, monthly budgets. |
| 15-K/L/M | Held by user; reminders (including CR-1), encrypted backups, and final accessibility/performance audit are later work. |
| 15 fix round | Round 2 requests compact amounts, section-header layout, route controls, budget categories/tab, Transactions summary/entry behavior, and EF allocation button clarification. FX-BASE is verified; remaining FX items are in progress. |
| 16 | Planned cleanup, dependency/dead-code review, bundle audit and README. |
| 17 | Planned QA/release, property tests, QA checklist, release engineering and local diagnostics. |

## 6. Prompt and session log

Dates below come from verified commits where stated; missing historic prompt
dates are marked rather than invented. The complete current prompt is saved
verbatim at `docs/prompts/p15-fix-round-1.md`.

| ID | Date | Purpose | Outcome / commits | Notes |
|---|---|---|---|---|
| P01-P06 | Not recoverable | Historical foundational work described in the supplied seed | User-reported, unverified | Original prompts and hashes not available in this checkout. |
| P07-P13 | Not recoverable | Schema migration, investments, linking, schedules, UI/theme and income wording described in the seed | User-reported, unverified | Current repository is not evidence for every historical acceptance criterion. |
| P14-A-G | Not recoverable | Prior close-out and EF/storage/reminders/encryption work | User-reported, unverified; audit continuation is P15-A | Prior status report was declared unreliable by user. |
| P15-A | 2026-10-11 | Audit Phase 14 and restore reliable gates | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7` | Coverage/review corrections recorded in existing ledger history. |
| P15-A2 | 2026-10-12 | Follow-up migration, premigration and assertion audit | `0322c9d` | Restored weakened assertions and corrected version-chain behavior. |
| P15-B | 2026-10-12 | Finish Phase 14 UI leftovers | `fbeb1d7` | Exact original Phase 14 complete scope remains unverified. |
| P15-C | 2026-10-12 | SIP date clarity and first-tap goal editor | `e155bcd` | Current commit title verifies scope. |
| P15-D | 2026-10-12 | Schema v5 | `394d338` | Current schema constant verified as 5. |
| P15-E | 2026-10-12 | Shared due engine | `f28657c` | Plan/liability/policy schedules and clearing added. |
| P15-G | 2026-10-12 | Goal asset links/projection | `9399e23` | Domain/store/UI/test commit. |
| P15-H | 2026-10-12 | Cash-flow history and money movement | `68d9cd4` | Seeded conservation proof documented in prior ledger. |
| P15-J | 2026-10-12 | Sorting | `1e206ad` | Sorting commit preceded Part I. |
| P15-I | 2026-10-12 | Monthly budget tracker | `19afe88` | Commit locally verified. Prior assistant misstated an initial test count before fixing it; final commit has 488-test gate evidence in its ledger entry. |
| P15-fix-1 (Part 0) | 2026-10-13 | Rebuild permanent ledger, save prompt and capture baseline | `db967bf` | Baseline test command has 7 withdrawal-only render failures; lint has four unused-state warnings. New ledger test passes (2 tests). No test was weakened. |
| P15-FIX-R1 | 2026-10-13 | Start Phase 15 fix round Parts 1-4 | Part 0 committed; interrupted fix edits were checkpointed in `6771f37` as unverified | Parts 1-4 remained unverified when the session ended. |
| P15-FIX-R2 | 2026-10-13 | Recover the interrupted work, repair baseline, inventory and finish FX items | Prompt archived at `docs/prompts/p15-fix-round-2.md`; WIP checkpoint `6771f37`; FX-BASE initially committed in `c0ba0da` | Prior edits crossed multiple FX scopes before item-level verification. Round 3 audited and restored the two missing visible messages; full baseline is now green. |
| P15-FIX-R3 | 2026-10-13 | Truthful full gate, audit FX-BASE, then finish items in revised order | Prompt saved at `docs/prompts/p15-fix-round-3.md`; baseline gates pass; FX-BASE audit follow-up committed with this item | Round 2 changed two user-visible assertions without preserving their UI behavior; corrected before continuing. No assertions or thresholds were weakened. |

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-1 | 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not' | Open | Build with P15-K after the user confirms this fix run; local notification design and permission behavior still require SDK-57 documentation and tests. |

## 8. Known issues and risks

- Checkpoint coverage gate was red (43 failures, 476 passed across 59 suites);
  the focused FX-BASE suites now pass. The entire coverage gate must be rerun
  after subsequent items and reach 0 failures.
- Checkpoint lint initially reported seven imported-module parse errors in
  `FormScreen`, then the error cleared after rerunning without the stale Expo
  lint cache. Standard Expo lint now exits 0; revisit if it recurs.
- Budget now exists under `(tabs)`; header-menu reachability and exhaustive
  route/link/tab verification remain open under FX-B2.
- Amount rendering uses direct formatters across app/components; the
  scan/allowlist and device accessibility results do not exist yet.
- No real iOS or Android device/development-build verification has been done
  for this fix round.
- `docs/prompts/README.md` establishes append-only verbatim prompt capture.
  This initial prompt is saved in this repository; old historical prompts are
  not available to reconstruct.

## 9. Upcoming roadmap

1. Implement FX-U1 through FX-U4 (universal amount, section-header, route and
   form-close behavior), update this ledger and commit.
2. Implement FX-B1 and FX-B2 (new categories and Budget tab), update and commit.
3. Implement FX-T1 through FX-T4, update and commit.
4. Resolve FX-E2 and verify FX-E1 across all Emergency fund surfaces, update
   and commit.
5. Run the full gates twice, update final evidence, and commit the final ledger.
6. After user confirmation only: P15-F insurance; P15-K local reminders with
   CR-1; P15-L encrypted backups; P15-M accessibility/performance and final
   gates.
7. Phase 16 cleanup; Phase 17 QA/release.

## 10. Verification matrix

An item is `Done` only when its named source and test evidence are available.
Paths below are repository-relative. Baseline results are not completion
evidence for the fixes.

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

### Phase 15 items

| Item | Status | Source evidence | Test evidence |
|---|---|---|---|
| P15-A/A2 audit and repairs | Done | `src/domain/efAllocation.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `jest.config.js` | `src/domain/__tests__/efAllocation.test.ts`, `src/data/__tests__/migrate.test.ts`, `src/data/__tests__/safeStorage.test.ts`; historical gate evidence in commit ledger. |
| P15-B UI leftovers | Done | `app/(tabs)/index.tsx`, `app/(tabs)/transactions.tsx`, `src/components/` | `src/components/__tests__/HomeThemeSmoke.test.tsx`, `src/components/__tests__/TransactionsScreen.test.tsx` |
| P15-C SIP date clarity | Done | `app/investment-form.tsx`, `app/(tabs)/index.tsx` | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/components/__tests__/HomeThemeSmoke.test.tsx` |
| P15-D schema v5 | Done | `src/domain/schemas.ts`, `src/domain/types.ts`, `src/data/migrate.ts`, `src/domain/backup.ts` | `src/data/__tests__/migrateV4.test.ts`, `src/domain/__tests__/backup.test.ts`, `src/domain/__tests__/schemas.test.ts`, `src/domain/__tests__/v5Integrity.test.ts` |
| P15-E clearing dues | Done | `src/domain/dues.ts`, `src/domain/schedule.ts`, `src/data/createAppStore.ts`, `app/clear-dues.tsx` | `src/domain/__tests__/dues.test.ts`, `src/domain/__tests__/schedule.test.ts`, `src/data/__tests__/createAppStore.test.ts` |
| P15-F insurance | Held | No policy CRUD action/screen set | No policy-action/UI tests |
| P15-G goal links | Done | `src/domain/goalLinks.ts`, `src/domain/goals.ts`, `app/goal-form.tsx` | `src/domain/__tests__/goalLinks.test.ts`, store and route smoke suites |
| P15-H cash flow/movements | Done | `src/domain/cashFlow.ts`, `app/month-review.tsx`, `app/money-movement-form.tsx` | `src/domain/__tests__/cashFlow.test.ts`, `src/data/__tests__/createAppStore.test.ts` |
| P15-I budgets | Done | `src/domain/budget.ts`, `app/budget.tsx`, `app/budget-template-form.tsx`, `app/budget-history.tsx` | `src/domain/__tests__/budget.test.ts`, `src/data/__tests__/createAppStore.test.ts`, route and Transactions screen suites |
| P15-J sorting | Done | `src/lib/sorting.ts`, `src/data/useSort.ts`, `src/components/SortChip.tsx`, sortable `app/` lists | `src/lib/__tests__/sorting.test.ts`, `src/data/__tests__/metaStore.test.ts`, screen and route smoke suites |
| P15-K reminders / CR-1 | Held | No verified planner, prefs, notification adapter or screen | No reminder tests |
| P15-L encrypted backup | Held | `src/domain/backup.ts` is unencrypted | No encryption tests |
| P15-M accessibility/performance | Held | No final audit artifact | No comprehensive device/accessibility suite |

### Fix round

| Item | Status | Planned source evidence | Required tests |
|---|---|---|---|
| P15-fix-0 | Done | `docs/PROGRESS.md`, `docs/prompts/README.md`, `docs/prompts/p15-fix-round-1.md` | `src/lib/__tests__/progressLedger.test.ts` |
| FX-BASE | Done | `app/(tabs)/transactions.tsx`, `app/(tabs)/index.tsx`, `app/assets.tsx`, `app/liabilities.tsx`, `src/components/ui.tsx` | `src/components/__tests__/TransactionsScreen.test.tsx` (withdrawal-only notice, expanded information, null rates/no NaN), `src/components/__tests__/StatPill.test.tsx` (exact accessible label), plus four prior focused suites; 520 full-suite tests pass |
| FX-U1 | Partial | `src/lib/amountDisplay.ts`, `src/lib/format.ts`, `src/components/AmountText.tsx`, `src/components/form/MoneyField.tsx`, amount consumers in `app/` | `src/lib/__tests__/amountDisplay.test.ts`, `src/components/__tests__/AmountText.test.tsx`; exhaustive scan, exact parent labels, money-input helper and broad tier coverage remain |
| FX-U2 | Partial | `src/lib/sectionLayout.ts`, `src/components/SectionHeaderRow.tsx`, sortable `app/` screens | `src/lib/__tests__/sectionLayout.test.ts`, `src/components/__tests__/SectionHeaderRow.test.tsx`; full SortChip scan and font-scale-2.0 all-surface proof remain |
| FX-U3 | Partial | `src/lib/routeKinds.ts`, `src/components/AppHeader.tsx`, `app/` route tree | `src/lib/__tests__/routeKinds.test.ts`, `src/components/__tests__/RouteRenderSmoke.test.tsx`; route/control-label/44pt/back-fallback coverage remains incomplete |
| FX-U4 | Partial | `src/components/form/FormScreen.tsx`, `app/*-form.tsx`, modal routes | `src/components/__tests__/FormScreen.test.tsx`; dirty state is not verified across every form and clean/dirty/cancel coverage is incomplete |
| FX-B1 | Partial | `src/domain/schemas.ts`, `src/domain/budget.ts`, `src/mock/data.ts`, category UI maps in `app/` and `src/` | `src/domain/__tests__/budget.test.ts`, `src/domain/__tests__/schemas.test.ts`; Home breakdown/filter and existing-v5-backup regression remain |
| FX-B2 | Partial | `app/(tabs)/budget.tsx`, `app/(tabs)/_layout.tsx`, route registry and links | `src/components/__tests__/RouteRenderSmoke.test.tsx`, `src/lib/__tests__/routeKinds.test.ts`; header menu and exhaustive links/deep-link/font-scale checks remain |
| FX-T1 | Partial | `app/(tabs)/transactions.tsx`, `app/transaction-form.tsx` | `src/components/__tests__/TransactionsScreen.test.tsx`; '+' routing, menu and all-three-type save assertions remain |
| FX-T2 | Partial | `src/domain/cashFlow.ts` | `src/domain/__tests__/cashFlow.test.ts`; function and initial tests exist, but complete carry/future/negative/no-data/past-month checks remain |
| FX-T3 | Partial | `src/domain/schemas.ts`, `src/mock/data.ts`, transaction and budget category screens | `src/domain/__tests__/budget.test.ts`, transaction screen tests; add/edit/filter and budget-to-filtered-list tests remain |
| FX-T4 | Partial | `app/(tabs)/transactions.tsx` | `src/components/__tests__/TransactionsScreen.test.tsx`; collapsed/expanded content, review dismissal, negative tone and height cap are not yet asserted |
| FX-E1 | Partial | `src/lib/amountDisplay.ts`, `src/components/AmountText.tsx`, `app/emergency-fund.tsx`, `app/ef-allocation-form.tsx`, Home/Goals | `src/lib/__tests__/amountDisplay.test.ts`, `src/components/__tests__/AmountText.test.tsx`, `EmergencyGoalScreens.test.tsx`; exact parent-label matrix and complete EF surface coverage remain |
| FX-E2 | Partial | `app/ef-allocation-form.tsx`, `src/domain/efAllocationActions.ts`, `src/data/createAppStore.ts` | `src/data/__tests__/createAppStore.test.ts`; both controls/hints exist, but stored-result behavior tests and orphaned-string scan remain |
