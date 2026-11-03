<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-03 | Updates: owner and AI agents -->

# Status

- Current task: P29-K scope popup behavior is complete. Selecting either
  Budget scope applies immediately; Close, backdrop and Android back discard
  the pending change. Delete-category counts remain in the popup body and
  Undo is unchanged. `app/(tabs)/index.tsx` remains user-owned and was not
  edited.
- Phase 29 status: P29-A through P29-K are Done, including P29-F2, P29-F3 and
  P29-F4. DEC-P29E-HOLDING-DELETE withdraws Undo after holding deletion; the
  retained same-write Budget unlink requirement is proven.
- Schema version: v16. P29-E added Budget holding links, P29-G migrated v14
  cover goals, and P29-I migrated v15 holdings.
- Runtime: Node.js 26.13.0.
- Test counts: 86 suites, 1086 tests.
  Latest validated run: 86 suites, 1086 tests passed with
  `npm test -- --coverage` on 2026-11-03.
- All six P29-K gates exit 0: Jest coverage, TypeScript, Expo lint with zero
  warnings, Expo Doctor 21/21, Android export and iOS export. Exact commands
  and exit codes are in [PROGRESS.md](../PROGRESS.md).
- Fresh P29-I coverage was generated after deleting `coverage/`, then measured
  from `coverage-final.json` with `istanbul-lib-coverage`, grouped by each
  source file's immediate `src/` directory. `src/data`: 676/714 lines
  (94.67%), 713/809 branches (88.13%); `src/domain`: 3318/3381 lines
  (98.13%), 3262/3506 branches (93.04%); `src/lib`: 107/107 lines and
  126/126 branches (100%). Per-file branch coverage: `src/domain/budget.ts`
  770/849 (90.69%) and `src/data/createAppStore.ts` 93/107 (86.91%);
  configured thresholds of 90% and 85% are satisfied.
- `npx expo lint` exits 0 with zero warnings and no eslint-disable comments
  added.
- The P29-F4 assertion audit compares 531d659 with its audited worktree:
  2050 to 2184 `expect(` occurrences (+134); 41 removed expectation lines are
  documented replacements, not removed-only assertions.
- The P29-J final assertion audit compares 337fcc5 with HEAD: the two changed
  test files remain at 169 total `expect(` occurrences (0 added, 0 removed,
  0 net); the modified expected ledger counts and P29-J coverage are recorded
  in [PROGRESS.md](../PROGRESS.md).
- The P29-I assertion audit compares 34fa401 with HEAD: 1773 to 1823
  `expect(` occurrences (+58, -8, net +50) across 17 changed test files.
  Every changed/replaced expectation is listed in [PROGRESS.md](../PROGRESS.md).
- The prior Gate 1 timeout output is unavailable and cannot be quoted. The
  final fresh full run passes; see the ledger for the historical isolated-run
  information and the preliminary TypeScript correction.
- Coverage and UI tests are simulated. See [open-items.md](open-items.md) for
  physical-device checks not verified.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth
  for decisions, status, acceptance evidence, gates and device checks.
