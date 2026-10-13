Act as a senior React Native / TypeScript engineer on the Wealth Wise Expo project (SDK 57, expo-router in /app, pure domain logic in src/domain, zod schemas in src/domain/schemas.ts, zustand store in src/data, shared components in src/components). READ THE CURRENT CODE before changing anything: this prompt describes intent and may use names that differ slightly from the repo; find the real names.

PURPOSE OF THIS RUN
1) Rebuild docs/PROGRESS.md as the permanent master ledger of everything done, in progress and upcoming (Part 0).
2) Apply the Phase 15 fix round (Parts 1 to 4).
Do NOT build the held Phase 15 parts F (insurance), K (reminders), L (encrypted backups) or M (final accessibility/performance gates). They come in a later prompt after the user confirms this one. Fixes must not change the stored schema: SCHEMA_VERSION stays 5 (stop and report if it is not 5 now).

STANDING RULES
- No cloud, no network at runtime. Domain code is pure (no React/Expo imports, no clock reads, no randomness; today and ids are injected).
- React Compiler is on: forms use react-hook-form Controller and useWatch only.
- Any change touching more than one entity is ONE pure action applied through ONE store set() = ONE persisted write.
- Anything this prompt does not mention must keep working exactly as it does today. When you replace something, delete the old version in the same change (no parallel old and new paths, no dead code).
- Never use non-null assertions (!) or `as` casts to silence nullable values in app/ or src/components.
- NEVER delete or weaken an existing test assertion to get green; if a test is wrong, fix it and say why. Never edit production logic only to raise a coverage number.
- EVERY gate must exit 0. A non-zero exit is NEVER explained away. Run each gate as `cmd; echo "exit=$?"` and paste the exit code. Never loosen coverage thresholds, collectCoverageFrom or exclusions.
- COVERAGE REPORTING: per-directory totals with lines and branches computed SEPARATELY from per-file istanbul summaries; paste the script and output.
- Gates: npm test -- --coverage (>=90% lines and branches on src/domain and pure src/lib modules, >=85% on src/data excluding hooks), npx tsc --noEmit, npx expo lint (name every warning), npx expo export --platform android and --platform ios, npx expo-doctor (paste its output).
- Standing UI decisions: Add/Edit/Delete are icons; Deposit/Withdraw/Pay EMI/Log installment/Save/Clear due/Clear past dues are text plus a small icon; the edit pencil is rendered ONLY by CardHeaderRow or ListRow (a test enforces it); goal cards have no pencil (tap opens the editor); the four Home quick actions are the one place icons AND text are required. UPDATED RULE: the bottom tabs are Home, Txns, Goals and Budget (this supersedes 'Home, Txns, Goals only').
- Commit locally after each part ('Phase 15 fix: <part>'); never push. Update docs/PROGRESS.md at the end of every part.
- OUTPUT FORMAT (all required; summaries do not count): 1) commands run with exit codes. 2) git diff --stat AND git ls-files --others --exclude-standard. 3) The FULL contents of the files named under 'PASTE IN FULL'; for every other changed file under src/domain, src/data, src/lib and src/theme paste its git diff (or, above 1500 lines, the file names and stat); UI files under app/ and src/components by name only. 4) test output and the per-directory coverage table. 5) decisions or deviations, and an explicit list of acceptance criteria NOT verified on a real device.

PART 0: Rebuild docs/PROGRESS.md (do this FIRST and commit before any fix)
0.1 Evidence first: run `git log --oneline --decorate -n 100`, `git status --short`, print SCHEMA_VERSION, run every gate once (exit codes) and the per-directory coverage script. Paste all of it.
0.2 Rewrite docs/PROGRESS.md (keep any existing useful content, reorganize it) with these sections IN THIS ORDER:
  1. How to use this file (the protocol below).
  2. Status dashboard: a table of every phase, part and fix ID with Status (Done / Held / Pending / Planned), Evidence (commit hash, or 'user-reported, unverified'), and Last updated.
  3. Standing rules (the current set, including the updated four-tab rule).
  4. Architecture and decisions (storage, schema versions v1 to v5 with what each added, domain purity, store rules, backup and migration rules, amount display tiers from Fix U1, the route-kind registry from Fix U3, the theme list, the Text-versus-icons rules).
  5. Phase history (Phases 1 to 15 and this fix round; use the seed below, reconcile with git).
  6. Prompt and session log: one entry per prompt or session in order, with an ID, date, purpose, outcome, commits, and notes (agent mistakes, user corrections).
  7. Change-request register (open and closed).
  8. Known issues and risks.
  9. Upcoming roadmap.
  10. Verification matrix: Phase 14 and Phase 15 items, each with file path(s) and test name(s); an item with no file and test is NOT Done.
0.3 Protocol (write it into section 1): every future prompt starts by reading this file and ends by updating the dashboard, the prompt log, the register and the matrix, then committing it. IDs: Phase prompts 'P<phase>-<part>'; fixes 'FX-<id>'; change requests 'CR-<n>'. Never delete history; supersede it with a dated note. When the repo and this file disagree, the repo wins and the file is corrected with a note.
0.4 Reconciliation: do not invent commit hashes or dates. Items the user reports as done but the repo cannot prove are marked 'user-reported, unverified' with what is missing. Use `date` for today's date.
0.5 Add a test (src/lib/__tests__/progressLedger.test.ts) that reads docs/PROGRESS.md and asserts the ten section headings exist in order and that every fix ID below (FX-U1 to FX-E2) and CR-1 appears in the dashboard.
0.6 Save this prompt verbatim as docs/prompts/p15-fix-round-1.md and add docs/prompts/README.md (naming scheme, 'every prompt given to the agent is saved here verbatim before work starts'); log both in the prompt log.

SEED FOR SECTION 5 (verify against git; flag anything you cannot confirm)
Project: Wealth Wise, a personal finance mobile app for Sahil (Bangalore, India). Started as an HTML prototype, converted to React Native Expo SDK 57. No cloud/auth/network at runtime; local storage via AsyncStorage with zustand persist (single JSON blob, schema versioning with migrations).
- Phase 1: static UI, design system, theme tokens, mock data.
- Phase 2: pure domain logic (SIP, loan, emergency fund, goals, transactions, portfolio); Jest >= 90% coverage.
- Phase 3: zustand store plus AsyncStorage persistence; transaction CRUD; schema v1; safe storage with corruption recovery.
- Phase 4: SIP plans with installment logs; loans with payments; linked transactions (source field); atomic writes.
- Phase 5: goals, manual holdings, emergency fund entries; emergency fund invariants; cross-platform confirm helper; GoalLockedError, EfBalanceError, EfLinkError.
- Phase 6: backup export/import with undo; app lock (expo-local-authentication); screenshot privacy; erase-all; storage metadata.
- Phase 7: schema v2 (Loan became the Liability union Recurring/OneTime; LogEntry became InvestmentEntry/LiabilityPayment; source kinds renamed); migrations; emergency fund withdrawals as income; mandatory transaction links; Home navigation pills.
- Phase 8: one investment form (recurring/one-time); manual holding ledger; withdrawal transactions as income; updated portfolio valuation.
- Phase 9: transactions manage instruments in both directions; linkExistingTransaction; findUnlinkedEntries and createMissingTransactions; retargeting entries.
- Phase 10: schedules (planSchedule, liabilitySchedule, upcomingDue); Schedule/Entries tabs; FlatList virtualization.
- Phase 11: Transactions crash fix (savedPct null on withdrawal-only income); error boundaries; tabs reduced to Home/Txns/Goals; AppHeader; unified InstrumentCard; icon-only actions.
- Phase 12: schema v3 (onboarded, monthlySalary, ThemeId); six palettes (light, dark, sky, mint, blush, midnight) plus system with WCAG contrast tests; first-run onboarding; logo and splash.
- Phase 13: monthly take-home income wording (stored field stays monthlySalary); emergency fund 3-month minimum target; Transactions '+' icon; edit icons far right; goals edit by tap; default header menu; appMenu rename.
- Phase 14 (Parts A to G: close-out, UI refinements, schema v4 with emergency fund diversification (7 buckets, suggested 10/40/35/15 mix, largest-remainder rounding in paise), storage size guard, reminders, encrypted backups, polish): its first report was unreliable (coverage table computed wrongly, deliverables skipped, tests weakened), so it was re-audited in Phase 15 Part A.
- Phase 15: Part A (audit and honest gates; commits d8dc666, 85a0a52, e3c8500, 6ac4ca7); then A2 (follow-ups: restore weakened tests, coverage/ untracked, migration fixes, premigration proof), B (Phase 14 UI leftovers), C (SIP date clarity, two-tap card fix), D (schema v5: liability settlement, goal links, policies, budget templates and month budgets, new categories and source kinds), E (clearing dues: single, bulk, at creation), G (goals linked to assets with projection), H (historical transactions, month carry-over, money movements), I (monthly budget with templates and history), J (sorting everywhere). User-reported done: A, A2, B, C, D, E, G, H, I, J (unverified here until evidence is shown). HELD: F (insurance), K (payment reminders), L (encrypted backups), M (accessibility, performance, final gates).
- Upcoming: this fix round; then the held Phase 15 parts F, K (with CR-1), L, M; Phase 16 cleanup (dead code, unused dependencies, bundle audit, README); Phase 17 QA and release (property tests, QA checklist, release engineering, local diagnostics).
CHANGE REQUEST CR-1 (record verbatim, status Open, to be built in Part K): 'Notification for all assets, liabilities, SIPs, EMIs, one time loan, or anything which are being scheduled or saved for future date before a day and on the same day and also it should ask for the confirmation if it is paid or not'.
Also record each fix below as an open item with its ID.

PART 1: Universal fixes
FX-U1 Compact amounts (everywhere, including every Emergency fund screen).
 - src/lib/amountDisplay.ts (pure) and src/lib/format.ts: formatINRCompact(amount): below 1,000 exact; 1,000 to 99,999 as '₹12.50 K'; then lakh '₹1.25 L' and crore '₹3.40 Cr' in the EXISTING style of formatINRShort (keep its current outputs and tests); rounding that reaches the next unit promotes it (99,999.6 becomes '₹1.00 L', 99,99,999.6 becomes '₹1.00 Cr'); negatives keep the sign before the symbol.
 - chooseAmountStyle({ amount, tier, fontScale }) returns 'exact' or 'compact': tier 'exact' is always exact (details, add and edit forms, dialogs, confirm messages, toasts, backup summaries, month-review figures); tiers 'hero' (>= 24pt) and 'tile' (stat tiles, pills, card headline values, chart labels) are compact whenever |amount| >= 1,000; tier 'row' (list rows, chips, captions, secondary lines, <= 14pt) is exact when |amount| < 1,00,00,000 and compact at or above one crore, and also compact when fontScale > 1.3 and the exact string is longer than 10 characters.
 - AmountText component (src/components) with props value, tier, tone and style: renders per chooseAmountStyle, uses the live font scale, and ALWAYS sets accessibilityLabel to the exact figure. A string helper formatAmount(amount, tier, fontScale) covers text interpolation (banners, toasts, alerts use 'exact' or 'row').
 - Replace every direct amount rendering in app/ and src/components with AmountText or formatAmount and give each an explicit tier. A test scans app/ and src/components and fails on direct formatINR, formatINRShort or toLocaleString('en-IN') use outside AmountText, formatAmount, the money input component, and a short documented allowlist. Document the screen-to-tier table in PROGRESS.md section 4.
 - Money inputs show the exact figure; below the field show a helper '= ₹1.25 L' once the value is >= 1 lakh so the zeros can be checked.
 - Emergency fund (FX-E1): balance, target, remaining, monthly expense minimum, allocation rows, passbook rows, entry form and the Goals and Home emergency cards all follow these tiers.
 - Tests: boundaries (999, 1,000, 99,999.6, 1,00,000, 99,99,999.6, 1,00,00,000, negatives, paise), every tier at font scale 1.0 and 1.5, accessibilityLabel always exact, the scan test, and render tests of Home, Assets, Liabilities, Emergency fund, Goals, Budget and Transactions with an amount of 12,34,56,789 (compact in tile tier, compact in row tier) and 1,23,45,678 (exact in row tier) and the exact figure on a detail and a form.
FX-U2 Sort chip inline with the sub-title.
 - A shared SectionHeaderRow component (title and optional subtitle on the left, an optional right slot) used by every list header that has a SortChip. The chip sits on the SAME line, aligned right, whenever the title block's natural single-line width plus the chip width plus a 12pt gap fits the container width; otherwise it drops below the sub-title. Put the decision in a pure fitsInline(containerWidth, titleWidth, chipWidth, gap) in src/lib/sectionLayout.ts and measure with onLayout; no layout flicker (hidden until measured or measured via an initial pass).
 - Apply to every screen that has a SortChip (Transactions, Goals, Assets and plans, Liabilities, schedules, entries and payments, passbook, budget rows, budget history, month review, link-missing list, reminders list if present).
 - Tests: fitsInline boundaries; render tests with mocked layout widths asserting inline versus stacked; at font scale 2.0 the stacked layout is used.
FX-U3 Back button on every non-tab screen.
 - src/lib/routeKinds.ts: a registry mapping EVERY route in app/ to a kind: 'tab' (no left control), 'stack' (back arrow top-left), 'form' (close 'x' top-left, see FX-U4), 'special' (onboarding and lock: none). Document the table in PROGRESS.md.
 - AppHeader derives its left control from the registry. Back uses router.back() and, when there is nothing to go back to (deep link, notification tap), router.replace to the Home tab. Android hardware back follows the same logic.
 - Tests: a test enumerates the files in app/ (excluding _layout and not-found) and fails if any is missing from the registry; render each route and assert the correct left control, label ('Back' or 'Close') and 44pt target.
FX-U4 Close button on every form.
 - Every route of kind 'form' (all *-form screens, clear-dues, month-review, money-movement forms, link pickers presented as modals, template forms, backup passphrase dialogs if they are screens) has a visible 'x' close control top-left. When the form is dirty (react-hook-form isDirty or equivalent) closing asks confirmAsync 'Discard changes?'; a clean form closes immediately. Android hardware back behaves the same.
 - Tests: every form route shows Close; dirty versus clean behavior; discard confirmation cancel keeps the form.
PASTE IN FULL: src/lib/amountDisplay.ts, src/lib/format.ts, src/lib/sectionLayout.ts, src/lib/routeKinds.ts.

PART 2: Budget fixes
FX-B1 Festival, Donation and Gifts.
 - Add the expense categories 'Festival', 'Donation' and 'Gifts' everywhere categories exist: the transaction form and filter chips, Home category breakdown, icons and colors, category label maps, the allowed budget line categories (schemas and the zod enums), mock data. In suggestTemplate (50/30/20) they belong to the 'wants' bucket with fixed weights Shopping 0.35, Other 0.25, Festival 0.15, Donation 0.10, Gifts 0.15 (sum 1.0). Existing stored data and backups stay valid and the schema version stays 5; accept the new strings in importDataSchema.
 - Tests: suggestTemplate sums and rounding with the new weights; template and month validation accept the new categories; a transaction in each new category flows into budgetMonthView actuals, the category filter and the Home breakdown; an existing v5 backup still imports.
FX-B2 Budget in the bottom navigation.
 - Move the budget screen into the tab group as app/(tabs)/budget.tsx; tab order Home, Txns, Goals, Budget; label 'Budget'; a Feather icon distinct from the other three (for example 'pie-chart'); remove 'Budget' from the app menu; keep 'Budget history' and 'Budget templates' reachable from the Budget tab's header ⋯ menu and from in-screen links. Update every router.push or href to the old path, the Home budget card, the category-filter navigation, deep links, tests (tab count, smoke, AppHeaderUsage, routeKinds). The tab bar must stay usable at font scale 2.0 (labels truncate cleanly, 44pt targets).
 - Tests: four tabs in the expected order; the old route is gone; every link lands on the tab; month swipe still works on the tab.

PART 3: Transactions fixes
FX-T1 The '+' shows the old form.
 - Find the transaction add form as it was before the Part H change (use `git log -S`, `git log --oneline -- app/` and the Part H commit) and restore its behavior: tapping '+' navigates DIRECTLY to the add form with the Income / Expense / Invest selector, category chips, amount, date and note, with no intermediate sheet. Keep everything added since that is still needed (new categories, close button, locked linked-transaction handling, compact helper under the amount).
 - The 'What happened?' money-movement sheet stays but moves to the Transactions header ⋯ menu as 'Record money movement'; its forms are unchanged.
 - Tests: pressing '+' navigates straight to the form route (no sheet rendered); the menu item opens the sheet; the three types still save.
FX-T2 Available balance.
 - Add availableBalance(transactions, month, today) in src/domain/cashFlow.ts (pure, built on monthPositions): previous month's closing carried forward as the opening balance, plus the month's income transactions, minus expenses and investments, counting only transactions dated on or before today for the current month (future-dated ones excluded) and everything for past months. Label 'Available balance' for the current month and 'Closing balance' for a past month. Negative values show a danger tone and the caption 'Shortfall'.
 - Tests: opening carried; future-dated excluded; negative; no previous data; past month equals its position closing; consistency with monthPositions for months without future-dated rows.
FX-T3 Festival, Donation and Gifts also appear in the transaction category lists (covered by FX-B1; verify in the add form, the edit form, the filter chips and the category-filtered list opened from the budget).
FX-T4 Minimal 'brought forward' card.
 - Replace the bulky summary and the separate review banner with ONE compact card: collapsed height <= 64pt showing only 'Available balance' (AmountText tile tier) and a small 'From {Mon} ₹X' chip (hidden when the brought-forward amount is 0). Tapping the card expands a short list: Brought forward, Income, Other money in, Spent, Invested (row tier). When a reviewable previous month exists, show a one-line 'Review {Mon}' text button inside the expanded area and a small dot on the collapsed card; the dismissal logic still works; month review stays in the app menu.
 - Tests: collapsed render has exactly the two figures; expansion shows the five rows; the review link and dismissal; negative balance tone; the card height cap in a layout test.

PART 4: Emergency fund allocation buttons
FX-E2 'Use suggested mix' versus 'Reset to suggested allocation'.
 - Read what each button does today (the domain actions it calls and the stored result). If they produce the same visible and stored result, REMOVE one (keep 'Reset to suggested' in the form and delete the other along with its handler, tests and strings) and say which and why. If they do different jobs (for example one saves the suggested numbers as your own fixed mix while the other clears the custom mix so it follows the app's suggestion), keep both and add a one-line hint under each: 'Use suggested mix: saves the suggested percentages as your own, so they stay fixed.' and 'Reset to suggested: clears your custom mix and goes back to the app's suggestion.' Paste the evidence (the two handlers and what they write).
 - Tests: whichever path you take, one test per remaining button for the stored result and the label; no orphaned strings.
FX-E1 Verify the compact-amount rules on every Emergency fund screen (Part 1 tests include them) and list the screens checked in PROGRESS.md.

PART 5: Final gates and ledger
- Run all gates twice (exit codes, expo-doctor output, the correct coverage table). Update docs/PROGRESS.md: dashboard (each FX item Done only with a commit and a test), prompt log (this prompt and every correction), register (CR-1 Open, to be built in Part K), known issues, upcoming roadmap (F, K with CR-1, L, M, Phase 16, Phase 17). Commit.
PASTE IN FULL: docs/PROGRESS.md and the availableBalance function.

ACCEPTANCE (state which were verified on a real device or development build)
- All gates exit 0; coverage table computed correctly; no earlier assertion deleted; SCHEMA_VERSION still 5.
- docs/PROGRESS.md has the ten sections, the full history Phases 1 to 15, the prompt log with this prompt saved under docs/prompts, CR-1 recorded, and a dashboard that lists every held and upcoming item.
- Lists and tiles show K, L and Cr figures; small-font rows show exact figures below one crore; every detail, form, dialog and toast shows the exact figure; screen readers get the exact figure; Emergency fund screens follow the same rules.
- Every sort chip sits on the sub-title line when it fits and below it when it does not.
- Every non-tab screen has a back arrow and every form has a close 'x' with a discard check when dirty.
- Budget has its own bottom tab (Home, Txns, Goals, Budget) and is gone from the more menu; Festival, Donation and Gifts exist in transactions and the budget.
- '+' on Transactions opens the old Income/Expense/Invest form directly; 'Record money movement' lives in the header menu.
- The Transactions card shows Available balance and a small brought-forward chip, expanding to the essentials.
- The emergency fund allocation has no duplicate button (or both have hints).

<system_reminder>
The following attached files are read-only snapshots of content the user shared (pasted text, an unsaved editor, or a diff view) and must not be edited:
- /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/a7019018-041a-447c-9da0-fc91af6f0044/file_Untitled-1.txt (59 lines)
</system_reminder>

<tagged_files>
* /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/a7019018-041a-447c-9da0-fc91af6f0044/file_Untitled-1.txt (59 lines)
</tagged_files>
