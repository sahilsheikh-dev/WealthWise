<!-- Purpose: Engineering invariants, protected surfaces and verification commands. | Last updated: 2026-10-26 | Updates: owner and AI agents -->

# Rules

## Invariants

- No cloud/network runtime behavior. Keep `src/domain/` pure: no React/Expo,
  ambient clock or randomness; inject dates, IDs and digests.
- React Compiler is enabled. Forms use React Hook Form `Controller` and
  `useWatch` only.
- Multi-entity operations use one pure domain action, one Zustand `set()` and
  one persisted write.
- Preserve unrequested behavior; remove replaced implementations rather than
  keeping parallel paths. Never weaken tests to get green.
- No null-silencing `!` or `as` in `app/` or `src/components/`.
- Format monetary values through `AmountText`/`formatAmount` with an explicit
  display tier.
- Tabs remain Home, Transactions, Goals, Budget.
- Add/Edit/Delete are Feather icon actions. Reuse the established
  `plus`/`edit-2`/`trash-2` naming through shared icon/action components; do not
  substitute text or emoji for these actions.
- Demo fixtures use deterministic synthetic data, stable IDs/dates and valid
  links. Preserve demo constraints and domain integrity tests; never introduce
  private user financial data.

## Protected file hashes

Git blob IDs at the P25-C preflight (verify with `git hash-object` before
relying on them after an authorized edit):

| File | Git blob ID | Rule |
|---|---|---|
| `app/(tabs)/index.tsx` | `d2af16e94414bcebf3db84d295b47bc3eca553bf` | User-owned; do not edit without explicit authorization. |
| `app/(tabs)/budget.tsx` | `f2b8fba230d2c6d207ebf6b8627ee2ecc906cde6` | Preserve user-authored cash-flow labels and removed controls. |
| `src/components/SortChip.tsx` | `837a675af94dd056532bc63fc4697efc905a5af3` | Leave unchanged. |
| `src/lib/sorting.ts` | `7491663f0987d83d03f3ed72b01de5b376e3572d` | Leave unchanged. |
| `src/components/form/frozen-manifest.json` | `476418c7084f0774f1b6fb86ddfe08c7a265fc40` | Frozen inputs are governed by this manifest. |
| `src/components/__tests__/formComponentsFrozen.test.ts` | `44e6f7e1592dabf9de95d2ed09cbe65af7968d1c` | Leave unchanged; run the test. |

## Commits and ledger

Read and update `docs/PROGRESS.md` with each task commit. Preserve uncommitted
user changes; if dirty at preflight, checkpoint them with
`chore: user manual changes (checkpoint)`. Commit each task step separately.
Never push, amend, or rewrite history. Every reported/recorded commit hash must
be copied from `git log` and verified with `git cat-file -t`. Record assumptions
as `Assumed: ...`; state superseded assertions and the replacement/reason.

## Gates

Run sequentially, retaining actual exit codes:

```bash
npm test -- --coverage
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Coverage floors: `src/domain/` and pure `src/lib/` at least 90% lines and
branches; `src/data/` at least 85%, excluding hooks. Layout tests are simulated:
record unverified physical-device behavior in the ledger and `open-items.md`.
