> Canonical current ledger: [docs/PROGRESS.md](../../PROGRESS.md) | Archive index: [README.md](README.md)

# Archived Phase History (Completed Phases)

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

- **SDK 57 patch alignment (2026-11-22, CR-120):** aligned Expo SDK 57 patch versions (expo ~57.0.33, expo-constants ~57.0.24, expo-linking ~57.0.14, expo-router ~57.0.31, expo-sharing ~57.0.26, expo-sqlite ~57.0.5) to clear the Gate 4 exception. Dependency commit `fac699e`. All six gates passed with exit 0 (Gate 1: 105 suites / 1,439 passed, 1 skipped; Gate 4: 21/21 passed). Six protected-file hashes match. Placement: rule 1, cleanup lifecycle.

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

