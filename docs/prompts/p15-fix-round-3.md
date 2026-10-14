<current_datetime>2026-10-13T08:46:47.719+05:30</current_datetime>

Act as a senior React Native / TypeScript engineer continuing the Wealth Wise Expo project (SDK 57). This is fix round 3 (ID P15-FIX-R3). You have no memory of earlier sessions: the repo and docs are the source of truth.

READ FIRST (cheaply)
- docs/PROGRESS.md: use grep and targeted reads for the dashboard, matrix, resume point and standing rules. Do NOT re-read the whole file in chunks.
- docs/prompts/p15-fix-round-1.md (full spec of every FX item) and docs/prompts/p15-fix-round-2.md (acceptance checklist and standing rules). They are the source of truth for scope. If either is missing or truncated, STOP and report.
- Save this prompt verbatim as docs/prompts/p15-fix-round-3.md, then run: date; git log --oneline -n 8; git status --short. Do not run git reset, checkout --, clean or stash drop.

COST AND LEDGER RULES (the previous sessions ran out of budget)
- Work in small verified slices and COMMIT after every FX item. Never stop to re-plan between items; stop only when you truly run out of room, after a committed item.
- Update docs/PROGRESS.md inside the SAME commit as each item: its dashboard row, its matrix row (files and test names) and the one-line '### Resume point'. No docs-only commits except the final one. No re-listing of history.
- Standing rules still apply: no cloud, no schema change (SCHEMA_VERSION stays 5), pure domain code, one write per multi-entity action, React Compiler rules, no `!` or `as` null-silencing in app/ or src/components, NEVER delete or weaken an existing assertion, never loosen coverage thresholds, every gate must exit 0 (paste real exit codes), UI icon-versus-text rules, bottom tabs Home, Txns, Goals, Budget.

STEP 0: Make the full gate truthful (do this first)
0.1 Run `npm test -- --coverage; echo "exit=$?"`, tsc, expo lint, expo export for android and ios, and expo-doctor. Paste the exit codes and the list of every failing suite with its failure count. At the last checkpoint 43 tests failed and only 4 suites were rerun afterwards, so expect more failures.
0.2 Classify each failing suite against an FX item (for example a route test still pointing at the old budget path belongs to FX-B2). Fix cross-cutting failures now; item-specific ones as part of that item. Do not weaken tests; if a test is wrong, fix it and say why.
0.3 FX-BASE audit: run `git diff 6771f37 c0ba0da -- src/components/__tests__/TransactionsScreen.test.tsx src/components/__tests__/EmergencyGoalScreens.test.tsx src/components/__tests__/HomeThemeSmoke.test.tsx` and list EVERY assertion that was removed or changed, with the old text, the new text, and where the same user-visible behavior is now asserted. Specifically: when income is withdrawal-only the user must still see that no earned income was logged (and the savings rate must stay unavailable, never NaN), and the 'Includes ₹X from withdrawals, borrowing, loan proceeds and own funds' information must still be visible (in the expanded card is fine). If a behavior is no longer shown anywhere, restore it in the UI and re-assert it. FX-BASE stays Done only after this audit and a fully green gate.
0.4 StatPill: it currently takes a string. Give it an optional `accessibilityLabel` or `exactValue` prop so the screen reader gets the EXACT figure while the face shows the compact one (or allow a ReactNode value); update every call site; add a test asserting the exact label.

WORK ORDER (cheap, high-value items first)
FX-E2 -> FX-T1 -> FX-T2 -> FX-T3 -> FX-T4 -> FX-B1 -> FX-B2 -> FX-U3 -> FX-U4 -> FX-U2 -> FX-U1 together with FX-E1 (the broad amount sweep goes last).
For each item: compare the working tree with its acceptance checklist in docs/prompts/p15-fix-round-2.md (details in round-1), write only the missing code and the missing tests, run the affected tests and tsc, commit 'Phase 15 fix: FX-xx', and move on. An item is Done only with a file and a test named in the matrix.
- FX-E2: first paste the two button handlers and exactly what each writes to the store (efAllocation stored value versus null). Then apply the rule: same result -> remove one button with its handler, tests and strings; different -> keep both with the two hint lines. Add a test per remaining button for the stored result, its label and hint, and a scan for orphaned strings.
- FX-U1 and FX-E1 must keep the accessibility rule: screen readers always get exact figures. Where an AmountText is nested inside a sentence, the PARENT text carries an accessibilityLabel built with formatAmount(..., 'exact', 1). Add the scan test (no direct formatINR, formatINRShort or toLocaleString('en-IN') outside the allowlist) and the render matrix with 12,34,56,789 and 1,23,45,678 on Home, Assets, Liabilities, Emergency fund, Goals, Budget and Transactions.

FINAL STEP
- Run all gates twice (exit codes, expo-doctor output) and the per-directory coverage script (lines and branches separately, from per-file istanbul summaries). Update the dashboard, the prompt log (P15-FIX-R3 outcome and any agent mistakes), the known issues and the roadmap. CR-1 stays Open for Part K; held parts F, K, L, M and Phases 16 and 17 stay on the roadmap. Commit.

REPORT AFTER EACH ITEM (short) and at the end (full)
- Per item: verdict, commit hash, tests added (names), anything unverified.
- At the end: commands with exit codes, git log of new commits, git diff --stat, git ls-files --others --exclude-standard, the FX-BASE audit table (0.3), the FX-E2 evidence, the coverage table with its script, and an explicit list of acceptance criteria NOT verified on a real device.
- PASTE IN FULL at the end: docs/PROGRESS.md (dashboard, matrix, resume point sections at minimum), src/lib/amountDisplay.ts, src/lib/format.ts, src/lib/sectionLayout.ts, src/lib/routeKinds.ts, src/components/AmountText.tsx and the availableBalance function.

<system_reminder>
The following attached files are read-only snapshots of content the user shared (pasted text, an unsaved editor, or a diff view) and must not be edited:
- /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/5b7c314a-7f9d-4289-b0d4-7fb4108b8722/file_Untitled-1.txt (59 lines)
</system_reminder>

<tagged_files>
* /Users/sahilaspaksheikh/Library/Application Support/Code/agentSessionData/ef8f30f4-09f1-4bae-b283-c80dd90b861e/attachments/5b7c314a-7f9d-4289-b0d4-7fb4108b8722/file_Untitled-1.txt (59 lines)
</tagged_files>
