<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-02 | Updates: owner and AI agents -->

# Status

- Current task: P29-G editable Insurance cover goals, after Phase 29 stabilization
  closeout. `app/(tabs)/index.tsx` remains user-owned and must not be edited.
- Phase 29 status: P29-B, P29-C, P29-D, P29-E, P29-F, P29-F2, P29-F3 and
  P29-F4 are Done. The owner decision DEC-P29E-HOLDING-DELETE withdraws Undo
  after holding deletion; the retained requirement, clearing every Budget
  holding link in the same write, is proven by the existing store test.
- Schema version: v14. P29-E is the Budget holding-link migration.
- Runtime: Node.js 26.13.0.
- Test counts: 84 suites, 1037 tests. Latest validated run: 84 suites, 1037 tests
  passed on 2026-11-02.
- Final Gate 1 run: 84 suites, 1037 tests passed on 2026-11-02.
- Final six gates all exit 0: Jest coverage, TypeScript, Expo lint, Expo Doctor
  21/21, Android export and iOS export. The exact commands and fresh coverage
  are in [PROGRESS.md](../PROGRESS.md). These gates authorize starting P29-G;
  its final gate results will be recorded at closeout.
- Fresh per-directory coverage from `coverage-final.json` after deleting
  `coverage/`: `src/data` excluding hooks 638/676 lines (94.38%), 645/734
  branches (87.87%); `src/domain` 3207/3261 lines (98.34%), 3116/3350
  branches (93.01%); pure `src/lib` 107/107 lines and 126/126 branches (100%).
  Informational branch coverage: `src/domain/budget.ts` 762/841 (90.60%);
  `src/data/createAppStore.ts` 87/99 (87.87%). Configured per-file thresholds
  are authoritative; P29-F2's advisory headroom targets were withdrawn.
- `npx expo lint` exits 0 with zero warnings and no eslint-disable comments
  added.
- The P29-F4 assertion audit compares 531d659 with its audited worktree:
  2050 to 2184 `expect(` occurrences (+134); 41 removed expectation lines are
  documented replacements, not removed-only assertions.
- The prior Gate 1 timeout output is unavailable and cannot be quoted. The
  final fresh full run passes; see the ledger for the historical isolated-run
  information and the preliminary TypeScript correction.
- Coverage and UI tests are simulated. See [open-items.md](open-items.md) for
  physical-device checks not verified.
- Encrypted backups protect exported files only. On-device data remains
  unencrypted; app lock is not encryption. A lost passphrase is unrecoverable.
- The ledger at [`docs/PROGRESS.md`](../PROGRESS.md) is the source of truth
  for decisions, status, acceptance evidence, gates and device checks.
