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
Wealth Wise. Prompts are not saved in this repository; the user keeps their
prompt text. Every future prompt starts by reading this file and ends by
updating the dashboard, prompt log, change-request register, and verification
matrix with the prompt ID, purpose, and outcome, then committing the updates.
Use IDs `P<phase>-<part>` for phase prompts, `FX-<id>` for fixes, and `CR-<n>`
for change requests. Never delete history: supersede an earlier entry with a
dated note. When the repository and this ledger disagree, Git and current
source win; correct the ledger and record the conflict. Do not infer
completion from a prior summary or a prompt: require a repository commit and
named test evidence. Historical claims without that evidence remain
user-reported, unverified. Never push.

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
| FX-S1 | Done | `0df1952`; filter/sort row layout, strict SortChip placement scan, and swipe suppression verified | 2026-10-14 |
| FX-S2 | Done | `8364053`; Budget history sort registry, both comparator directions, month-id tie breaks, persistence/fallback, and SortChip labels verified | 2026-10-14 |
| FX-T5 | Done | `03c67aa`; expanded available-balance card uses normal content sizing; only the collapsed state has the 64pt maximum | 2026-10-14 |
| FX-I1 | Done | `172b24e`; investment value explanations are visible and screen-reader accessible in recurring create/edit forms; actual value entry prefills today's date | 2026-10-14 |
| CH-3 | Done | `cac7cc0`; link-missing action moved to Transactions; conditional count notice routes to the existing link screen | 2026-10-14 |
| CH-2 | Done | `e8b1d26`; Budget tab owns History and Month review; reviewable months are indicated and routed directly | 2026-10-14 |
| CH-4 | Done | `1321e29`; removed the Transactions movement sheet and route, while preserving the shared liability-origin action still used by the liability form | 2026-10-14 |
| FX-L1 | Done | `ef7c5b0`; recurring liability solver and calculated form outputs are implemented | 2026-10-14 |
| FX-L2 | Done | `2bc35f0`; received-funds default and atomic liability-origin transactions are implemented | 2026-10-14 |
| CH-1 | Done | `c831fe6`; custom EF buckets, holding links, atomic plan-save, and v5→v6 migration | 2026-10-14 |
| FX-E1 | Done | `f805481`; emergency fund balance, targets, allocation rows, passbook and Home/Goals cards use explicit tiers and exact accessible labels; large-amount matrix passes | 2026-10-13 |
| FX-E2 | Done | `5f6f883`; allocation control/hint tests and one-write reset assertion pass | 2026-10-13 |
| CR-1 | Open | Deferred to held P15-K; verbatim request is in the change-request register | 2026-10-13 |
| P15-SEED | Unknown | No seed-backup prompt or matching commit was found in the available exports or Git history | unknown |
| P15-LEDGER | Done | Ledger consolidation, prompt archive removal, restored existing sort-header/Transactions-row acceptance, four progress-ledger assertions; commit recorded below | 2026-10-14 |
| CR-2 | Closed | P15-LEDGER consolidates the available session exports into this file; unavailable seed inputs and reconstructed history are disclosed in Section 8 | 2026-10-14 |
| Phase 16 | Planned | Cleanup, unused dependency/dead-code review, bundle audit, README | 2026-10-13 |
| Phase 17 | Planned | QA/release: property tests, QA checklist, release engineering, local diagnostics | 2026-10-13 |

### Resume point

CH-1 is implemented as the sole schema v6 bump (`c831fe6`). Custom EF options support metadata-driven allocation/warnings, holding links, link integrity and holding-delete cleanup; saving the allocation plan persists the complete plan in one store write. The v5 migration adds only the two empty custom fields and safe storage archives the original v5 bytes once. `solveLoan` covers all recurring solve directions; received-funds defaults on for new liabilities and records origin inflows through one action. Both complete gate passes are green: 64 suites/656 tests, TypeScript, lint, Android/iOS exports and Expo Doctor. Per-directory coverage clears all floors. No real-device verification. FX-L1 `ef7c5b0` and FX-L2 `2bc35f0` are recorded. Assumed mismatch tolerance: `max(₹1, 1% of calculated EMI)`; partial one-time `loan-received` calls retain their prior Loan proceeds category.

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

Current schema is `SCHEMA_VERSION = 6`. CH-1 was the sole schema-version
change in P15-FIX-R4; do not change the version without an explicit migration.

### Financial and UI rules

- Phase 1 uses Expo/React Native, TypeScript, Expo Router, bundled Montserrat
  and Feather, typed theme/components, and mobile-first screens; the initial
  static-only/no-persistence scope was superseded by later phases. The original
  five-tab design (Home, Txns, Goals, Invest, More) was superseded by the
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
- Investments, manual holdings, liabilities, and EF entries maintain
  transaction links in both directions. Deletion supports keeping or deleting
  linked transactions where applicable. The automatic EF goal is pinned and
  derived from the EF balance.
- EF allocations use fixed plus custom bucket IDs and largest-remainder
  rounding exact in paise. Links are explanatory and do not move money or
  change net worth.
- Amounts use explicit visual tiers while accessibility labels preserve exact
  Indian-grouped values. The formal row cutoff is ₹1 crore; screen-reader
  output remains exact. `formatINRShort` retains its existing behavior.
- Theme IDs are `system`, `light`, `dark`, `sky`, `mint`, `blush`, and
  `midnight`. Tabs are Home, Txns, Goals, Budget.
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
| Five tabs including Invest and More | FX-B2 established Home, Txns, Goals, Budget. |
| Loans as the feature/entity name | Schema v2 and later UI renamed the feature to Liabilities. |
| Schema v1, then v2, v3, v4, or v5 as current | Successive migrations; current schema is v6. Phase 4's no-new-fields rule was amended by Phase 5's `ManualHolding.valueAsOf`, then later schemas. |
| Saving every prompt in the repository prompt archive | P15-LEDGER: the user keeps prompt text; this file records ID, purpose, outcome, source quality, and Git evidence only. |
| Global-menu placement for Link missing transactions, Budget history, and Month review | CH-3 and CH-2 placed those actions on their relevant screens; routes remain. |
| Standalone Record money movement UI/route | CH-4 removed the UI/route; the shared pure logic remains only where still used by liability receipt flows. |

## 5. Phase history

Historical descriptions without a repository commit are user-reported,
unverified. Commit hashes below are from Git; source quality describes the
available prompt/history evidence, not a new verification of every acceptance
criterion.

| Phase / prompt | Purpose and agent-reported delivery | Review findings / user corrections | Outcome; Git commits | Source quality |
|---|---|---|---|---|
| 1 | Expo/Router mobile foundation, theme/components, mock data and static screens; later checkpoint reported UI and bundling complete. | Visible user scope specified five tabs and no-op future actions; remainder of prompt and later corrections/review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 2 | Pure financial domain calculations/selectors with explicit dates, tests, mock seam, and screen wiring; later checkpoint reported done. | User corrections are unknown. Early checkpoint recorded a self-import, unnecessary extras, missing tests/config, and unwired screens; later resolution is reported but not independently evidenced. | Done (user-reported, unverified); none identified. | Reconstructed |
| 3 | Validated local persistence, Zustand/AsyncStorage, transaction CRUD/forms, recovery and settings. | User corrections/review are unknown; native force-quit persistence was not device-verified. | Done (user-reported, unverified); none identified. | Reconstructed |
| 4 | Plan/loan flows, linked transactions, schemas, atomic store actions and forms. | User rules included schema stability, injected dates/IDs and one store write. A checkpoint noted a linked-transaction patch awaiting revalidation; later report said phase completed. Exact review/corrections are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 5 | Goals, manual holdings, EF ledger/invariants, typed errors and UI. | Exact user corrections are unavailable; an intermediate checkpoint left coverage/browser/device checks outstanding. | Done (user-reported, unverified); none identified. | Reconstructed |
| 6 | Backup/import/undo, lock/privacy, erase-all, reminder and configuration. | No user review/correction record is preserved. Agent reported tests, typecheck, lint and platform exports; device/APK, biometric/privacy and several export/import UX checks remain unverified. | Done (user-reported, unverified); none identified. | Verbatim prompt archived in session export |
| 7 | Schema v2; Loans→Liabilities, typed holding/liability entries, migration, source kinds and link integrity. | The visible initial request is truncated; historical corrections and review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 8 | Unified investment flows and manual holding ledger. | Original request details, tests, user corrections and review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 9 | Two-way instrument transaction linking, missing-link handling and retargeting. | Original request details, tests, user corrections and review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 10 | Investment/liability schedules, dues, entry/payment lists and virtualization. | Original request details, tests, user corrections and review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 11 | Transactions/navigation refinements, crash/error handling, headers and shared cards. | Original test/review evidence and corrections are unknown; later FX-BASE restored two user-visible messages after tests had been weakened. The later four-tab rule superseded the reported earlier tab arrangement. | Done (user-reported, unverified); follow-up `60b8c54`. | Reconstructed |
| 12 | Schema v3 onboarding, salary/theme fields, palettes, contrast tests and branding. | Original request details, user corrections, review and gate evidence are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 13 | Income wording, EF minimum target, transaction/goal/menu refinements. | Repeated checkpoints exist; exact prompt sequence, user corrections and review are unknown. | Done (user-reported, unverified); none identified. | Reconstructed |
| 14 | Parts A–G: UI, v4 EF allocation, storage guard, reminders, encrypted backup and polish. | User later judged the close-out report unreliable (wrong coverage arithmetic, skipped work and weakened tests) and required a re-audit; exact original omissions/corrections are unavailable. Audited in P15-A. | Done (user-reported, unverified); follow-up commits are listed under Phase 15. | Reconstructed |
| 15 | A/A2 audit and migration/assertion repair; B/C UI and date clarity; D schema v5; E dues; G goal links; H cash flow; I budgets; J sorting. | User required trustworthy coverage/counts and restoration of assertions. Coverage/test-count reporting was corrected; assertions were restored. P15-F and K/L/M were held. | A `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7`; A2 `0322c9d`; B `fbeb1d7`; C `e155bcd`; D `394d338`; E `f28657c`; G `9399e23`; H `68d9cd4`; I `19afe88`; J `1e206ad`. | Reconstructed |
| P15-FIX-R1 | Rebuilt ledger/baseline and began fixes. | Baseline had seven withdrawal-only render failures and lint warnings; later work was interrupted and left unverified. No assertion was weakened per report. | Part 0 `db967bf`, `6562de1`; unverified checkpoint `6771f37`. | Verbatim prompt archived |
| P15-FIX-R2 | Recover interrupted work, repair baseline and inventory FX items. | FX-BASE initially committed; R3 found two visible messages had been replaced by weaker assertions and restored them. | WIP `6771f37`; initial FX-BASE `c0ba0da`; superseded by R3 repair. | Verbatim prompt archived |
| P15-FIX-R3 | Audit FX-BASE and complete baseline FX items with truthful gates. | Restored messages and assertions; followed the formal ₹1 crore row cutoff over a conflicting example; no thresholds/assertions weakened. | `60b8c54`, `5f6f883`, `de94950`, `a3423ec`, `c1df77d`, `88d5190`, `b8bc4a1`, `5e2f78f`, `b205a84`, `862af8a`, `6627d03`, `f805481`. | Verbatim prompt archived |
| P15-FIX-R4 | FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2, then CH-1 v5→v6. | Fixed route-render fixture, v6 defaults, market-linked label and test import issues without weakening assertions. Full gates were reported green twice; simulated layout is not device evidence. | `0df1952`, `8364053`, `03c67aa`, `172b24e`, `cac7cc0`, `e8b1d26`, `1321e29`, `ef7c5b0`, `2bc35f0`, `c831fe6`, `17f4748`. | Verbatim prompt archived |
| P15-SEED | Seed backup tool prompt/work. | No corresponding prompt, output, or commit was found in available Git history or export files; scope and outcome are unknown. | Unknown; none identified. | Unknown |
| P15-LEDGER | Consolidate available session exports into this file, remove the prompt archive, and test ledger invariants. | Seed zip inputs were absent; prior session-state exports were used. Initial full suite exposed 26 failures across five suites from an existing UI refactor; restored required SortChip placement, Transactions scroller/sort sibling, `Txns` tab label, and missing `ChipRow` test mocks without weakening assertions. Final full gates pass. | Current ledger commit is recorded in Section 6 when available. | Verbatim current request; not archived |

## 6. Prompt and session log

No full prompt text is duplicated here. Historical dates are `unknown` unless
verified by Git commit dates. For the archived fix prompts the exact text is
recoverable from the first Git commit that added each file. “None identified”
means no matching commit was found, not proof that no historical work occurred.

| ID | Date | One-line purpose | Outcome | Commits (Git only) | Source quality / notes |
|---|---|---|---|---|---|
| P01 | unknown | Project setup, design system and static screens. | Done (user-reported, unverified). | none identified | Reconstructed from partial prompt/checkpoints. |
| P02 | unknown | Pure domain logic and computed screens. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P03 | unknown | Validated local persistence and transaction forms. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P04 | unknown | Plan and loan flows with linked transactions. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P05 | unknown | Goals, holdings and Emergency Fund flows. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P06 | unknown | Review fixes, backup, lock/privacy and erase. | Done (user-reported, unverified); device/APK checks not evidenced. | none identified | Verbatim prompt in session export; raw transcript unavailable. |
| P06-FIX-R1 | unknown | Date labels and full-width form save buttons. | Incomplete/unverified in available history. | none identified | Verbatim prompt in session export; raw transcript unavailable. |
| P07 | unknown | Schema v2 and Liability migration. | Done (user-reported, unverified). | none identified | Reconstructed; opening prompt fragment is truncated. |
| P08 | unknown | Unified investment ledger and manual holdings. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P09 | unknown | Instrument transaction linking/retargeting. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P10 | unknown | Schedules and virtualized lists. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P11 | unknown | Transactions and navigation refinements. | Done (user-reported, unverified); later FX-BASE audit restored visible messages/assertions. | none identified for original phase | Reconstructed. |
| P12 | unknown | Schema v3, themes, onboarding and branding. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P13 | unknown | Income wording, EF minimum and UI refinements. | Done (user-reported, unverified). | none identified | Reconstructed. |
| P14 | unknown | Parts A–G close-out and features. | User-reported done; later audit found report unreliable. | none identified for original phase | Reconstructed; exact skipped deliverables unknown. |
| P15-A | 2026-10-11 | Audit Phase 14 and restore reliable gates. | Done; coverage/test follow-ups recorded. | `d8dc666`, `85a0a52`, `e3c8500`, `6ac4ca7` | Reconstructed; source prompt absent. |
| P15-A2 | 2026-10-12 | Migration/premigration and assertion audit. | Done; restored assertions and version chain. | `0322c9d` | Reconstructed. |
| P15-B | 2026-10-12 | Phase 14 UI leftovers. | Done. | `fbeb1d7` | Reconstructed. |
| P15-C | 2026-10-12 | SIP date clarity and goal-card behavior. | Done. | `e155bcd` | Reconstructed. |
| P15-D | 2026-10-12 | Schema v5. | Done. | `394d338` | Reconstructed. |
| P15-E | 2026-10-12 | Shared schedule/due engine. | Done. | `f28657c` | Reconstructed. |
| P15-F | unknown | Insurance feature. | Held; no prompt/implementation evidence in the available exports. | none identified | Unknown prompt text. |
| P15-G | 2026-10-12 | Goal asset links/projection. | Done. | `9399e23` | Reconstructed. |
| P15-H | 2026-10-12 | Cash-flow history and money movement. | Done. | `68d9cd4` | Reconstructed. |
| P15-I | 2026-10-12 | Monthly budget tracker. | Done; earlier test-count misstatement was corrected. | `19afe88` | Reconstructed. |
| P15-J | 2026-10-12 | Sorting infrastructure/integrations. | Done. | `1e206ad` | Reconstructed. |
| P15-FIX-R1 | 2026-10-13 | Ledger/baseline and initial fix work. | Part 0 done; subsequent FX work left unverified/interrupted. | `db967bf`, `6562de1`, `6771f37` | Verbatim prompt archived. verbatim text: `git show db967bf:docs/prompts/p15-fix-round-1.md`. |
| P15-FIX-R2 | 2026-10-13 | Recover work, repair baseline and inventory FX items. | Superseded by Round 3 audit/repair. | `6771f37`, `c0ba0da` | Verbatim prompt archived. verbatim text: `git show 6771f37:docs/prompts/p15-fix-round-2.md`. |
| P15-FIX-R3 | 2026-10-13 | Audit baseline and complete remaining FX work. | Done; gates reported green twice; restored two visible messages/assertions. | `60b8c54`, `5f6f883`, `de94950`, `a3423ec`, `c1df77d`, `88d5190`, `b8bc4a1`, `5e2f78f`, `b205a84`, `862af8a`, `6627d03`, `f805481` | Verbatim prompt archived. verbatim text: `git show 60b8c54:docs/prompts/p15-fix-round-3.md`. |
| P15-FIX-R4 | 2026-10-14 | Complete FX-S1/S2, FX-T5, FX-I1, CH-3/2/4, FX-L1/L2 and CH-1 last. | Done; all gates reported green twice; device layout remains unverified. | `0df1952`, `8364053`, `03c67aa`, `172b24e`, `cac7cc0`, `e8b1d26`, `1321e29`, `ef7c5b0`, `2bc35f0`, `c831fe6`, `17f4748` | Verbatim prompt archived. verbatim text: `git show 0df1952:docs/prompts/p15-fix-round-4.md`. |
| P15-SEED | unknown | Seed backup tool prompt/work. | Unknown; no matching prompt or commit found. | none identified | Unknown. No seed zip was available in this checkout. |
| P15-LEDGER | 2026-10-14 | Fold available session exports into this ledger; remove the prompt archive. | Done; seed archives absent, so available session-state exports were used and gaps recorded. Initial failing test run was repaired without weakening assertions; final gates all exit 0. | Recorded in the ledger-closing commit. | Verbatim current request; not archived. |

## 7. Change-request register

| ID | Request | Status | Owner / evidence |
|---|---|---|---|
| CR-1 | 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not' | Open | Held for P15-K; notification design, permission behavior, and tests remain outstanding. |
| CR-2 | LEDGER-BACKFILL: merge the two available session exports into the permanent project record, reconcile commits against Git, and remove prompt archives from the repository. | Closed | P15-LEDGER completed this reconciliation. The expected seed zip inputs were unavailable; exports from session state were used and source gaps are recorded in Section 8. |

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
- P15-FIX-R4 final automated gates ran twice and exited 0: 64/64 suites,
  656/656 tests each run; TypeScript; Expo lint; Android and iOS exports; and
  Expo Doctor (21/21 checks). Simulated font-scale tests are not device
  verification.
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
  available Git history. Their reported outcomes remain user-reported,
  unverified. P15 per-part hashes/dates in this ledger were checked against
  Git; where export summaries conflict with Git, Git wins. No unverified
  export-only commit hash or date is recorded as repository evidence.
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
- `seed/export-session-1.zip` and `seed/export-session-2.zip` were missing in
  this checkout. Prior session-state export directories supplied the
  available prompt/history/decision summaries; these are not a replacement
  for absent raw transcripts or seed archives.
- Assumed: the two available session-state export directories are the
  intended Phase 1–6 and Phase 7 onward export contents; no absent prompt or
  transcript text has been fabricated as verbatim.

## 9. Upcoming roadmap

1. P15-F insurance; P15-K local reminders with CR-1; P15-L encrypted backups;
   P15-M accessibility/performance and final gates remain held.
2. P15-SEED seed backup tool remains planned/unknown; no prompt, artifact, or
   commit was found in the available inputs.
3. Phase 16 cleanup, unused-dependency/dead-code review, bundle audit, and
   README.
4. Phase 17 QA/release: property tests, QA checklist, release engineering,
   and local diagnostics.

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
| P15-fix-0 | Done | `docs/PROGRESS.md` | `src/lib/__tests__/progressLedger.test.ts` |
| P15-LEDGER | Done | `docs/PROGRESS.md`; archived prompt directory removed | `src/lib/__tests__/progressLedger.test.ts` — ten headings in order; every prompt ID logged exactly once; all FX/CH/CR IDs accounted for; deleted archive directory asserted absent |
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
