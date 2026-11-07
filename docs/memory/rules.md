<!-- Purpose: Engineering invariants, protected surfaces and verification commands. | Last updated: 2026-11-08 | Updates: owner and AI agents -->

# Rules

## Invariants

- **R1 — Dirty-file preflight:** list every dirty file before other work. If
  files are dirty, inspect their diff and commit exactly those named files
  before proceeding, using a Conventional Commit subject derived from the
  actual changes. If dirty files cover unrelated areas, make one commit per
  area and name only the files in that area. Never use a generic checkpoint
  subject. Preserve owner edits; never use checkout, restore, stash, reset, or
  old-code reapplication to revert them.
- **R2 — Phase and revision IDs:** align each task with existing work. A fix
  or change to a completed subtask stays in its original phase and is logged
  as `<ID>-R<n>` (for example, `P29-AB-R1`); the original row must say
  `Revised by <ID>-R<n>`. Create a new phase with subtasks only for genuinely
  new areas.
- **R3 — History and release approval:** never push, amend or rewrite history
  unless the owner explicitly asks. Release publication and tag creation,
  movement or deletion require explicit owner approval.
- **R4 — Documentation scope:** keep routine committed documentation within
  `docs/memory/*`, `docs/PROGRESS.md`, and `docs/releases/**`; do not commit
  release-draft contents (the `docs/releases/drafts/.gitkeep` exception is
  allowed). Other documentation files may be changed only when explicitly
  named in the owner's task. Reports and generated output belong in chat or
  `/tmp`.
- No cloud/network runtime behavior. Keep `src/domain/` pure: no React/Expo,
  ambient clock or randomness; inject dates, IDs and digests.
- React Compiler is enabled. Forms use React Hook Form `Controller` and
  `useWatch` only.
- Multi-entity operations use one pure domain action, one Zustand `set()` and
  one persisted write.
- Preserve unrequested behavior; remove replaced implementations rather than
  keeping parallel paths. Never weaken tests to get green.
- Reports, audits, checklists, and generated output belong in chat replies or
  `/tmp`, never in the repository.
- Keep release drafts under `docs/releases/drafts/`. After GitHub publication
  is verified, move each released Markdown file into
  `docs/releases/published/`; never leave published records at the release
  root or duplicated in the drafts folder.
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

Reverified with `git hash-object` on 2026-11-08; all six current blob IDs below
match the recorded values.

| File | Git blob ID | Rule |
|---|---|---|
| `app/(tabs)/index.tsx` | `d3d1e465fe9f5d238d338afeb033e2a54889ddc6` | User-owned; no Copilot edits authorized. |
| `app/(tabs)/budget.tsx` | `7beea9dd1ee7a3f46d95b8dbc13009b90b184dec` | Preserve user-authored cash-flow labels and removed controls. |
| `src/components/SortChip.tsx` | `837a675af94dd056532bc63fc4697efc905a5af3` | Leave unchanged. |
| `src/lib/sorting.ts` | `7491663f0987d83d03f3ed72b01de5b376e3572d` | Leave unchanged. |
| `src/components/form/frozen-manifest.json` | `476418c7084f0774f1b6fb86ddfe08c7a265fc40` | Frozen inputs are governed by this manifest. |
| `src/components/__tests__/formComponentsFrozen.test.ts` | `44e6f7e1592dabf9de95d2ed09cbe65af7968d1c` | Leave unchanged; run the test. |

## Commits and ledger

Read and update `docs/PROGRESS.md` with each task commit. Preserve uncommitted
user changes; if dirty at preflight, commit named files with descriptive
Conventional Commit messages derived from their diffs. Commit each task step
separately. Never push, amend, or rewrite history unless the owner explicitly
asks; release publication and tag changes require explicit owner approval.
Every reported/recorded commit hash must
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
