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
| Phase 1 | Done (user-reported, unverified) | user-reported; initial HTML prototype/Expo UI history not recoverable from current Git history | 2026-10-13 |
| Phase 2 | Done (user-reported, unverified) | user-reported; no phase-tagged commit or original coverage report available | 2026-10-13 |
| Phase 3 | Done (user-reported, unverified) | user-reported; current store exists, original schema-v1 commit not identified | 2026-10-13 |
| Phase 4 | Done (user-reported, unverified) | user-reported; current implementation exists, original phase evidence unavailable | 2026-10-13 |
| Phase 5 | Done (user-reported, unverified) | user-reported; exact original phase commit/test mapping unavailable | 2026-10-13 |
| Phase 6 | Done (user-reported, unverified) | user-reported; current plain backup/security features do not prove all original acceptance criteria | 2026-10-13 |
| Phase 7 | Done (user-reported, unverified) | user-reported; schema-v2 migration code is present, historical phase commit not identified | 2026-10-13 |
| Phase 8 | Done (user-reported, unverified) | user-reported; current investment features do not prove the original phase report | 2026-10-13 |
| Phase 9 | Done (user-reported, unverified) | user-reported; current link-management code does not prove the original phase report | 2026-10-13 |
| Phase 10 | Done (user-reported, unverified) | user-reported; current schedules and virtualized history do not prove original acceptance | 2026-10-13 |
| Phase 11 | Done (user-reported, unverified) | user-reported; exact original crash-fix evidence unavailable | 2026-10-13 |
| Phase 12 | Done (user-reported, unverified) | user-reported; schema-v3/theme code is present, original phase report unavailable | 2026-10-13 |
| Phase 13 | Done (user-reported, unverified) | user-reported; current UI has related work, no phase-tagged commit/test matrix | 2026-10-13 |
| Phase 14 A-G | Done (user-reported, unverified) | user-reported as a phase; audited follow-up evidence is in Phase 15 A/A2 and later parts | 2026-10-13 |
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
| FX-BASE | Done | `60b8c54`; `TransactionsScreen.test.tsx`, `StatPill.test.tsx`; full suite 520 tests, tsc, lint, Android/iOS export and Doctor pass | 2026-10-13 |
| FX-U1 | Done | `f805481`; compact formatter and explicit-tier rendering cover app/components; exact parent labels and the seven-screen large-amount matrix pass | 2026-10-13 |
| FX-U2 | Done | `src/components/SectionHeaderRow.tsx` waits for complete measurements before display; every app SortChip is AST-checked as its child; fit, no-flicker, inline/stacked and simulated font-scale-2 cases pass | 2026-10-13 |
| FX-U3 | Done | `b205a84`; route registry enumeration, each route's left control/label/44pt target, header fallback and Android back paths pass | 2026-10-13 |
| FX-U4 | Done | `FormScreen` now owns close/discard handling and each form route passes its real dirty state (or explicit clean state); 87 focused route/close tests pass | 2026-10-13 |
| FX-B1 | Done | `b8bc4a1`; current-month Home expense breakdown, wants weights, category flow and v5 backup tests pass | 2026-10-13 |
| FX-B2 | Done | `5e2f78f`; four ordered tabs, menu links, grouped Budget routes and simulated 2.0 font-scale labels verified | 2026-10-13 |
| FX-T1 | Done | `de94950`; direct plus route, header-menu behavior and all three add-form save paths are tested | 2026-10-13 |
| FX-T2 | Done | `a3423ec`; `availableBalance` edge cases for carry, current-day boundary, future exclusion, negative/no-history and past close | 2026-10-13 |
| FX-T3 | Done | `c1df77d`; Festival, Donation and Gifts are exercised through create/edit forms, routed filters and Budget links | 2026-10-13 |
| FX-T4 | Done | `88d5190`; compact card capped at 64pt; two collapsed figures, five expanded rows, review routing/dismissal, dot, and negative tone tests | 2026-10-13 |
| FX-S1 | Done | `0df1952`; filter/sort row layout, strict SortChip placement scan, and swipe suppression verified | 2026-10-13 |
| FX-S2 | Done | `8364053`; Budget history sort registry, both comparator directions, month-id tie breaks, persistence/fallback, and SortChip labels verified | 2026-10-13 |
| FX-T5 | Done | `03c67aa`; expanded available-balance card uses normal content sizing; only the collapsed state has the 64pt maximum | 2026-10-13 |
| FX-I1 | Done | `172b24e`; investment value explanations are visible and screen-reader accessible in recurring create/edit forms; actual value entry prefills today's date | 2026-10-13 |
| CH-3 | Done | Link-missing action moved to Transactions; count notice appears only for unlinked entries and routes to the existing link screen | 2026-10-13 |
| CH-2 | Done | Budget tab now owns History and Month review actions; reviewable months are indicated and routed directly | 2026-10-13 |
| CH-4 | Done | `1321e29`; removed the Transactions movement sheet and route, while preserving the shared liability-origin action still used by the liability form | 2026-10-13 |
| FX-L1 | Done | `ef7c5b0`; recurring liability solver and calculated form outputs are implemented | 2026-10-13 |
| FX-L2 | Done | `2bc35f0`; received-funds default and atomic liability-origin transactions are implemented | 2026-10-13 |
| CH-1 | Done | `pending`; custom EF buckets, holding links, atomic plan-save, and v5→v6 migration; final ledger commit will backfill this hash | 2026-10-13 |
| FX-E1 | Done | `f805481`; emergency fund balance, targets, allocation rows, passbook and Home/Goals cards use explicit tiers and exact accessible labels; large-amount matrix passes | 2026-10-13 |
| FX-E2 | Done | `5f6f883`; allocation control/hint tests and one-write reset assertion pass | 2026-10-13 |
| CR-1 | Open | Deferred to held P15-K; verbatim request is in the change-request register | 2026-10-13 |
| CR-2 | Planned | LEDGER-BACKFILL after P15-M and before Phase 16; details in change-request register | 2026-10-13 |
| Phase 16 | Planned | Cleanup, unused dependency/dead-code review, bundle audit, README | 2026-10-13 |
| Phase 17 | Planned | QA/release: property tests, QA checklist, release engineering, local diagnostics | 2026-10-13 |

### Resume point

CH-1 is implemented as the sole schema v6 bump. Custom EF options support metadata-driven allocation/warnings, holding links, link integrity and holding-delete cleanup; saving the allocation plan persists the complete plan in one store write. The v5 migration adds only the two empty custom fields and safe storage archives the original v5 bytes once. `solveLoan` covers all recurring solve directions; received-funds defaults on for new liabilities and records origin inflows through one action. Focused CH-1 suites and the first full test/coverage run pass (656 tests); final gates and ledger commit are next. No real-device verification. FX-L1 `ef7c5b0` and FX-L2 `2bc35f0` are recorded. Assumed mismatch tolerance: `max(₹1, 1% of calculated EMI)`; partial one-time `loan-received` calls retain their prior Loan proceeds category.

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
| v6 | Custom emergency-fund allocation buckets and holding links; v5→v6 migration preserves all earlier fields. |

Current source of truth: `SCHEMA_VERSION = 6`. CH-1 is the sole schema-version
bump in P15-FIX-R4; all other Round 4 items retained the schema version.

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
| P15-FIX-R3 | 2026-10-13 | Truthful full gate, FX-BASE audit, and all remaining FX items | Prompt saved at `docs/prompts/p15-fix-round-3.md`; FX-BASE `60b8c54`; FX-E2 `5f6f883`; FX-T1 `de94950`; FX-T2 `a3423ec`; FX-T3 `c1df77d`; FX-T4 `88d5190`; FX-B1 `b8bc4a1`; FX-B2 `5e2f78f`; FX-U3 `b205a84`; FX-U4 `862af8a`; FX-U2 `6627d03`; FX-U1/FX-E1 `f805481` | 604 tests/63 suites and every gate pass twice; full coverage exceeds floors. Chose the formal row cutoff of ₹1 crore over the conflicting example. Round 2's two removed visible messages were restored in FX-BASE. No assertions or thresholds were weakened. |
| P15-FIX-R4 | 2026-10-13 | Transactions filter-row sort placement and Round 4 follow-up items | Prompt saved at `docs/prompts/p15-fix-round-4.md`; FX-S1 `0df1952`; FX-S2 `8364053`; FX-T5 `03c67aa`; FX-I1 `172b24e`; CH-3 `cac7cc0`; CH-2 `e8b1d26`; CH-4 `1321e29`; FX-L1 `ef7c5b0`; FX-L2 `2bc35f0`; CH-1 hash to be backfilled in the final ledger commit | FX-S1 verified by focused Transactions, SectionHeaderRow AST scan, swipe-suppression and TypeScript checks; an initial broad Jest run exhausted Node heap after a failed assertion, then targeted reruns passed. FX-S2 tests verified the entire history sort registry, both comparator directions, persistence/fallback and rendered option labels. Corrected the expected tie order for the `customized` comparator to reflect ascending month-id tie breaks. FX-T5 root cause: `styles.cashCard` applied `maxHeight: 64` even while expanded. Expanded card has no height/maxHeight; styles, normal-flow ordering and scale 2.0 were simulated, but no real device was used. FX-I1 adds visible value helpers, accessibility hints, a worked example and date prefill; focused render tests, tsc and lint pass. Assumed: one-time/manual holdings remain without plan-specific value fields because their models have distinct invested/current-value fields and no matching editable actual-value date. The prefill test now awaits the RHF update, and the known async-act warning is gone from the full RouteRenderSmoke run. CH-3 removes link-missing from the app menu and exposes it in the Transactions header and conditional count notice; 20 focused tests, tsc and lint pass. CH-2 relocates History and Month review to the Budget tab, retains only templates in its header menu and selects/dots the latest reviewable month; full RouteRenderSmoke (91 tests), AppHeader/menu tests, tsc and lint pass. Both new rows were style-checked at simulated font scale 2.0; no device was used. CH-4 deletes the movement sheet/form/route and form-only schema/types, with an explicit source scan for orphaned UI strings; 193 tests across six related suites passed, including cash-flow and store behavior. Kept `recordMoneyMovement`/`MoneyMovement` after grep proved the liability form still needs received-proceeds behavior; month review allocation actions are unchanged. FX-L1 adds a pure three-direction loan solver and recurring-form calculated values; 127 tests in the solver/schema/route suites, tsc and lint pass. Assumed mismatch tolerance is `max(₹1, 1% of calculated EMI)`. FX-L2 defaults received funds on for new liabilities and auto-disables for past-month starts until touched; full-principal one-time origins use Borrowed, recurring origins use Loan proceeds, and focused tests verify the switch and one-write persistence. Assumed: partial one-time `loan-received` calls retain their prior Loan proceeds category; no device verification. CH-1 adds v5→v6 custom EF bucket persistence and migration, metadata-driven warnings, holding links/cascade, integrity validation, backup v6 export/import/refusal of v7, UI and one-write store save. Focused tests plus full coverage run pass (64 suites, 656 tests). Corrected the route-render fixtures for required v6 fields and changed the switch label from “New option is market-linked” to “Market-linked” after the existing verb-text scan rejected the initial wording; no assertions or thresholds were weakened. An initial test edit referenced an unimported error class; imported it and reran the suite successfully. Expo gates are being repeated after this ledger update; no real-device verification. |

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-1 | 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not' | Open | Build with P15-K after the user confirms this fix run; local notification design and permission behavior still require SDK-57 documentation and tests. |
| CR-2 | Planned for the end: LEDGER-BACKFILL. The user will run an export command in both Claude sessions (session 1 = Phases 1 to 6, session 2 = Phase 7 onward) that produces docs/prompts files (every prompt verbatim) and history files; a later agent prompt merges them into docs/prompts and docs/PROGRESS.md. | Open | Deferred until after P15-M and before Phase 16. |

## 8. Known issues and risks

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
- `docs/prompts/README.md` establishes append-only verbatim prompt capture.
  This initial prompt is saved in this repository; old historical prompts are
  not available to reconstruct.

## 9. Upcoming roadmap

1. P15-F insurance; P15-K local reminders with CR-1; P15-L encrypted backups;
   P15-M accessibility/performance and final gates remain held as directed.
2. CR-2 LEDGER-BACKFILL is planned for the end, after P15-M and before Phase
   16; it will reconcile verbatim prompts and session histories from both
   Claude sessions.
3. Phase 16 cleanup; Phase 17 QA/release.

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
| FX-L2 | Done | `app/liability-form.tsx` — received switch defaults on, auto-off for historical starts until user touch, and explanation; `src/domain/cashFlow.ts` — Borrowed category for full one-time origin inflow | `src/components/__tests__/RouteRenderSmoke.test.tsx` — default state, historical auto-off, touched override and form receipt action; `src/data/__tests__/createAppStore.test.ts` — recurring/one-time origin records and one persisted write; `src/domain/__tests__/cashFlow.test.ts` — legacy partial and linked movement behavior |
| FX-E1 | Done | `src/lib/amountDisplay.ts`, `src/components/AmountText.tsx`, `app/emergency-fund.tsx`, Home/Goals emergency cards and passbook | `src/components/__tests__/RouteRenderSmoke.test.tsx` — exact labels for large balance/baseline figures; `src/components/__tests__/EmergencyGoalScreens.test.tsx` — three-month target behavior; `AmountText.test.tsx` — exact accessibility |
| FX-E2 | Done | `app/ef-allocation-form.tsx`, `src/domain/efAllocationActions.ts`, `src/data/createAppStore.ts` | `src/components/__tests__/EfAllocationForm.test.tsx` — each remaining control's label, hint and stored result plus orphaned-string scan; `src/data/__tests__/createAppStore.test.ts` — reset persisted state and one write |
| CH-1 | Done | `src/domain/efAllocation.ts`, `src/domain/efAllocationActions.ts`, `src/domain/schemas.ts`, `src/domain/backup.ts`, `src/domain/links.ts`, `src/domain/holdingActions.ts`, `src/data/migrate.ts`, `src/data/safeStorage.ts`, `src/data/createAppStore.ts`, `app/ef-allocation-form.tsx`, `app/emergency-fund.tsx` — custom buckets, metadata-based warning/allocation, link cascade and one-write plan save; v5→v6 migration/archive and v6 backups | `src/domain/__tests__/efAllocationCustom.test.ts` — action validation, moveTo, integrity, warning metadata and seeded 20,000-case paise proof; `src/data/__tests__/migrateV4.test.ts` — v5 defaults/deep preservation; `src/data/__tests__/createAppStore.test.ts` — v6 hydration/archive/erase and one-write save; `src/domain/__tests__/backup.test.ts` — v6 round-trip and v7 refusal; `src/domain/__tests__/schemas.test.ts` — custom bounds; `src/components/__tests__/EfAllocationForm.test.tsx` — custom option, totals, picker and single save; `src/components/__tests__/EmergencyGoalScreens.test.tsx` — linked rows and values; `src/components/__tests__/RouteRenderSmoke.test.tsx` — routes use v6 state |
