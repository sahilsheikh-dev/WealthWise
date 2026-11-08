<!-- Purpose: Snapshot of current project/task state and verification. | Last updated: 2026-11-03 | Updates: owner and AI agents -->

# Status

- Current task: P29-H asset invested/current-value/return correction. It is
  complete; `app/(tabs)/index.tsx` remains user-owned and was not edited.
- Phase 29 status: P29-A through P29-H are Done, including P29-F2, P29-F3 and
  P29-F4. The owner decision DEC-P29E-HOLDING-DELETE withdraws Undo after
  holding deletion; the retained requirement, clearing every Budget holding
  link in the same write, is proven by the existing store test.
- Schema version: v15. P29-E is the Budget holding-link migration; P29-G
  migrates v14 cover goals to editable records.
- Runtime: Node.js 26.13.0.
- Test counts: 84 suites, 1060 tests.
  Latest validated run: 84 suites, 1060 tests passed with
  `npm test -- --coverage` on 2026-11-03.
- All six P29-H gates exit 0: Jest coverage, TypeScript, Expo lint with zero
  warnings, Expo Doctor 21/21, Android export and iOS export. Exact commands
  and exit codes are in [PROGRESS.md](../PROGRESS.md).
- Fresh P29-H coverage was generated after deleting `coverage/`, then measured
  from `coverage-final.json`: `src/data` 658/696 lines (94.54%), 679/774
  branches (87.73%); `src/domain` 3279/3342 lines (98.11%), 3193/3436
  branches (92.93%); `src/lib` 107/107 lines and 126/126 branches (100%).
  Informational branch coverage: `src/domain/budget.ts` 762/841 (90.61%) and
  `src/data/createAppStore.ts` 93/107 (86.92%). Configured per-file thresholds
  remain authoritative; P29-F2's advisory headroom targets were withdrawn.
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
