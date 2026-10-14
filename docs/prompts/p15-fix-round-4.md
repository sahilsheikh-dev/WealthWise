<current_datetime>2026-10-14T06:11:45.379+05:30</current_datetime>

Act as a senior React Native / TypeScript engineer continuing the Wealth Wise Expo project (SDK 57). This is fix round 4 (ID P15-FIX-R4). You have no memory of earlier sessions: the repo and docs are the source of truth.

READ FIRST (cheaply)
- docs/PROGRESS.md via grep and targeted reads (dashboard, matrix, resume point, standing rules). Do NOT re-read the whole file in chunks.
- Run: date; git log --oneline -n 6; git status --short. Never run git reset, checkout --, clean or stash drop. If the worktree is not clean, checkpoint it as 'WIP before P15-FIX-R4 (unverified)' and note it in the ledger.
- Save this prompt verbatim as docs/prompts/p15-fix-round-4.md and log it as P15-FIX-R4.

COST AND DECISION RULES
- Work in small verified slices and COMMIT after every item. Update docs/PROGRESS.md inside the SAME commit as each item (dashboard row with the commit hash, matrix row with files and test names, one-line '### Resume point'). No docs-only commits except the final one.
- NEVER ask me questions (no ask-user tool). If something is ambiguous, apply the rule written here or the most conservative option and record it in the ledger as 'Assumed: ...' for me to confirm. Never write 'chosen by the user' unless the prompt says so.
- Standing rules: no cloud; pure domain code (no React/Expo imports, clock or randomness; today and ids injected); React Compiler rules (Controller/useWatch); a multi-entity change is ONE pure action and ONE store write; no `!` or `as` null-silencing in app/ or src/components; NEVER delete or weaken an existing assertion (if a test is wrong fix it and say why); every gate exits 0 with real exit codes pasted; never loosen coverage thresholds; icons for Add/Edit/Delete, text plus icon for action buttons (Save, Clear due, Clear past dues, Deposit, Withdraw, Pay EMI, Log installment); the edit pencil only via CardHeaderRow or ListRow; bottom tabs Home, Txns, Goals, Budget; all amounts go through AmountText or formatAmount with an explicit tier and screen readers always get exact figures; every new route is registered in src/lib/routeKinds.ts, has a back or close control and a render test.
- SCHEMA_VERSION stays 5 for everything except CH-1, which bumps it to 6 with ONE migration. Do CH-1 LAST.
- The tests are simulated and cannot see layout. For every visual or layout item, also assert the style props that would cause the bug, and say what was NOT verified on a device.

ITEMS (in this order; each needs its own files, tests and commit)

FX-S1 Transactions sort chip in the filter row
- Remove the 'Transactions' subtitle row on the Transactions screen. Put the SortChip in the SAME row as the All / Income / Expense / Invested chips, pinned at the right end: the filter chips live in a horizontally scrollable flex:1 container and the SortChip sits outside the scroller so it is always visible (including at font scale 2.0). The category-filter chip from the budget stays in that row. Swipes that start in that row keep being ignored by the month swipe.
- Update the FX-U2 scan test with an explicit, documented exception for the Transactions filter row only (assert the Transactions screen renders the SortChip as a sibling of the filter chips); every other screen must still use SectionHeaderRow and the scan still fails for any other placement. Do not weaken it otherwise.
- Tests: same parent row as the four filters; no 'Transactions' subtitle; chips still filter; sorting keeps filters, search and category filter; swipe-ignore in that row; font scale 2.0 keeps the sort chip visible.

FX-S2 Budget history sorting
- Extend the sort registry for 'Budget history' beyond month: month (default, newest first), planned spend, actual spend, planned saving, actual invested, savings rate (null last), closing balance, outstanding amount, template name, customized. Every key supports ascending and descending with id tie-breakers. Tests per comparator, persistence and the invalid-stored-value fallback, and that the SortChip lists every key.

FX-T5 Available balance card overlaps the content below when expanded
- Find the ROOT CAUSE in app/(tabs)/transactions.tsx (likely a fixed height, maxHeight, absolute positioning, negative margin or overflow clipping that was meant for the collapsed 64pt cap and is also applied when expanded). Fix: the 64pt cap applies ONLY while collapsed; the expanded card sizes to its content in normal flow; nothing inside uses absolute positioning; following sections (notice rows, filter row, list) sit below in normal flow; rows grow with the font scale.
- Tests: flatten the styles and assert collapsed has the cap, expanded has no height or maxHeight and no absolute-positioned descendant, toggling works, and the same at font scale 2.0. Report the offending style lines.

FX-I1 New Investment: explanations for Opening balance, Latest actual value and Actual value date
- Inspect app/investment-form.tsx in EVERY mode (recurring SIP/RD, one-time, manual holding; create and edit). Wherever those three fields appear (the screen may still use the old labels), show a visible helper text under each field (not only behind an info icon):
  - Opening balance: 'Money you had already put in before you started tracking here. It counts towards your invested amount.'
  - Latest actual value: 'Today's value from your statement or investment app. Leave it blank and we will use our estimate.'
  - Actual value date: 'The date you checked that value. We fill in today's date when you enter a value.'
- Keep the plain-language section titles, the 'Count installments from' control and the 'i' info sheet with the worked example from the earlier SIP clarity work if present; if any of it is missing in some mode, add it. When a value is entered and the date is empty, prefill today.
- Tests: render each mode and assert the three helper texts and their accessibilityHint, the info sheet opens, the date prefill, and that no mode shows the fields without the helper.

CH-3 Link missing transactions moves to Transactions
- Remove it from the app menu. On Transactions, when findUnlinkedEntries returns N > 0 show a compact notice row 'N entries have no transaction. Link' (below the balance card, above the filter row; hidden at N = 0) that opens the existing link-missing route, and add 'Link missing transactions' to the Transactions header menu (always shown). Route and screen stay.
- Tests: menu contents, notice visible only when N > 0 with the right count, navigation, font scale 2.0.

CH-2 Budget history and Month review move to the Budget screen
- On the Budget tab add a compact row of two text-plus-icon buttons under the month header: 'History' and 'Month review' ('Month review' shows a small dot when a reviewable month exists and opens the review for that month). Remove 'Budget history' and 'Month review' from the app menu and from the Budget header menu ('Budget templates' stays in the Budget header menu). Routes stay and keep their route kinds. The tab must remain usable at font scale 2.0.
- Tests: menus no longer contain them; the Budget screen shows both buttons and navigates; the dot logic; font scale 2.0.

CH-4 Remove 'Record money movement' completely
- Delete the Transactions menu item, the 'What happened?' sheet and its strings, app/money-movement-form.tsx and its route kind, the tests for them, and recordMoneyMovement plus its types ONLY if grep shows nothing else uses them (month review keeps fundShortfall and allocateSurplus; the liability form keeps its own received-money logic). Keep any pure function that is still referenced elsewhere. Leave no dead code or orphaned strings.
- Tests: the Transactions menu has no such item; the route registry has no 'money-movement-form'; a string scan finds no orphaned movement text; month review shortfall and surplus flows still pass.

FX-L1 Liability: solve the missing loan values
- Pure solver in src/domain/liability.ts (or loanSolver.ts): solveLoan({ principal, ratePct?, tenureMonths?, emi? }) => { ratePct, tenureMonths, emi, solved: 'emi' | 'rate' | 'tenure' | 'none', totalInterest, lastPayment, warnings }. Principal is mandatory (> 0) and the start date is mandatory. At least TWO of rate, tenure, EMI must be known (explain in the UI: 'Add one more of tenure, interest rate or EMI so we can work out the rest'); a 'No interest' chip sets the rate to exactly 0, after which one of tenure or EMI is enough.
  - EMI from rate and tenure: r = rate/1200, EMI = P*r*(1+r)^n / ((1+r)^n - 1) (rate 0: P/n), rounded to 2 decimals.
  - Rate from EMI and tenure: if EMI*n < P error 'EMI is too low to repay this loan in that time'; if EMI*n is within a paisa of P the rate is 0; otherwise bisection (at least 60 iterations) on the annual rate in 0..100, rounded to 2 decimals.
  - Tenure from rate and EMI: if EMI <= P*r error 'EMI does not even cover the monthly interest'; n = ceil(-ln(1 - P*r/EMI)/ln(1 + r)) (rate 0: ceil(P/EMI)); more than 600 months is an error; report lastPayment when n was rounded up.
  - All three given: compute the EMI for the entered rate and tenure; if it differs from the entered EMI by more than 1 rupee or 1%, show a NON-blocking hint 'These do not match: the EMI for this rate and tenure would be ₹X' with a 'Use calculated EMI' action; the entered values are saved unless the user taps it.
  - Bounds: rate 0..100, tenure 1..600 whole months, EMI > 0.
- Form: live read-only 'Calculated' values via useWatch for whatever is missing, shown BEFORE saving; saving stores the calculated values in the existing liability fields (inspect the existing RecurringLiability model and use its real field names; derive anything the model does not store). Applies to recurring liabilities only. Existing flows (settlement, past installments, 'Outstanding balance today') stay unchanged.
- Tests: known values (1,000,000 at 10% for 12 months gives an EMI of about 87,915.89), a seeded 2,000-case round trip (compute EMI, then recover the rate and the tenure within tolerance), zero interest, every error message, the mismatch hint, required-field validation messages, and form render tests for each solve direction proving the calculated values appear before save and are the values saved.

FX-L2 'I received this money in my account' defaults to ON
- For NEW liabilities the switch defaults to on. If the user has not touched it and the start date is before the current month, turn it off automatically and show why ('This loan started before this month, so we left this off to avoid changing that month's balance'); once the user touches it their choice wins. When on, saving creates the origin inflow (category 'Loan proceeds' for recurring, 'Borrowed' for one-time, amount = principal, dated the start date) in the same single write. Hidden when editing.
- Tests: default state, the auto-off rule and the touched override, the saved records (liability plus inflow in one write), and the explanatory text.

CH-1 Emergency fund: custom allocation options linked to investments (schema v6; do this LAST)
- Stored additions: AppData.efCustomBuckets: { id, name, access: 'instant' | 'days' | 'slow', marketLinked: boolean }[] (max 8; name 1..24 characters, unique case-insensitively and different from the fixed bucket labels; ids from the injected generator); AppData.efBucketLinks: Record<bucketId, string[]> of holding ids (existing holdings only; max 10 per bucket). EfAllocation widens to Record<string, number> keyed by the 7 fixed ids plus custom ids; efAllocation null still means the suggested mix (custom buckets 0%).
- Migration v5 to v6 (pure, in src/data/migrate.ts): add efCustomBuckets: [] and efBucketLinks: {}; everything else identical; copy the raw v5 string to `${name}.premigration.v5` exactly once; backups write schemaVersion 6 and refuse 7; keep fixtures for v1 to v5; extend appDataSchema and importDataSchema; integrity checks (link targets exist, bucket ids in the allocation exist, custom bucket names valid and unique).
- Domain: generalize allocateAmounts, validateAllocation and allocationWarnings to use access and marketLinked metadata from fixed and custom buckets (warnings behave exactly as today for the fixed ones); largest-remainder rounding across all buckets stays exact in paise (re-run the seeded 20,000-case proof with a random number of custom buckets from 0 to 8). Pure actions: addEfCustomBucket, renameEfCustomBucket, setEfCustomBucketAccess, deleteEfCustomBucket(id, { moveTo }) (a bucket with a percent above 0 needs moveTo, which receives that percent; deleting removes its links), setEfBucketLinks(bucketId, holdingIds), and saveEfPlan(data, { customBuckets, allocation, links }) as ONE write for the form. Deleting a holding also removes it from efBucketLinks in the same action.
- UI: app/ef-allocation-form.tsx gets '+ Add custom option' (name, access segmented 'Instant / Within days / Slow', 'Market-linked' switch), per-row percent fields with the live Total and Remaining, rename and remove controls on custom rows, and 'Link investments' per bucket opening a multi-select of holdings with their current values; Save writes everything at once. Keep 'Use suggested mix' and 'Reset to suggested allocation' behavior and hints. The Emergency fund screen's allocation card shows custom rows, chips for linked investments with their values (AmountText row tier) and 'Linked ₹X of ₹Y planned' per bucket, plus one muted line: 'Linking does not move money or change your net worth. Do not record the same money as both an emergency fund balance and an investment.'
- Tests: migration v5 to v6 deep-equal with identical totals; backup round trip and refusal of schemaVersion 7; every action including the moveTo rule and the holding-delete cascade; integrity failures on hand-broken data; the seeded paise-exactness proof with custom buckets; warnings from metadata; form render tests (add bucket, totals, link picker, save as one write); the Emergency fund screen rows and chips.

LEDGER (inside the item commits, final cleanup in the last commit)
- Dashboard rows with commit hashes for FX-S1, FX-S2, FX-T5, FX-I1, CH-3, CH-2, CH-4, FX-L1, FX-L2, CH-1. Relabel Phases 1 to 14 from 'Pending' to 'Done (user-reported, unverified)' and add the commit hashes missing from the earlier FX rows (see git log).
- Add to the change-request register: CR-2 'Planned for the end: LEDGER-BACKFILL. The user will run an export command in both Claude sessions (session 1 = Phases 1 to 6, session 2 = Phase 7 onward) that produces docs/prompts files (every prompt verbatim) and history files; a later agent prompt merges them into docs/prompts and docs/PROGRESS.md'. Add it to the roadmap after P15-M and before Phase 16. CR-1 stays Open (to be built in Part K). Held parts F, K, L, M and Phases 16 and 17 stay on the roadmap.

FINAL STEP
- Run all gates twice (npm test -- --coverage, tsc, expo lint, expo export for android and ios, expo-doctor) and the per-directory coverage script (lines and branches separately from per-file istanbul summaries). Update the prompt log with the P15-FIX-R4 outcome and any agent mistakes. Commit.

REPORT AFTER EACH ITEM (short) and at the end (full)
- Per item: verdict, commit hash, tests added, anything unverified, any 'Assumed' decision.
- At the end: commands with exit codes, git log of the new commits, git diff --stat, git ls-files --others --exclude-standard, the coverage table with its script, and an explicit list of acceptance criteria NOT verified on a real device.
- PASTE IN FULL at the end: the solveLoan source file, src/domain/efAllocation.ts, the EF plan action file, src/data/migrate.ts, the Transactions balance-card component or styles with the FX-T5 root cause, the sorting registry diff for Budget history, and the docs/PROGRESS.md dashboard and resume point.

<system_reminder>
The following attached files are read-only snapshots of content the user shared (pasted text, an unsaved editor, or a diff view) and must not be edited:
- /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/c7d9d4da-9199-4d95-92ea-738144faed76/file_Untitled-1.txt (59 lines)
</system_reminder>

<tagged_files>
* /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/c7d9d4da-9199-4d95-92ea-738144faed76/file_Untitled-1.txt (59 lines)
</tagged_files>
