<!-- Purpose: Rules for locating planned work in phases and lifecycle tracking. | Last updated: 2026-11-12 | Updates: owner and AI agents -->

# Work placement

## Quick start

1. Search the dashboard, register, phase history, roadmap, memory and touched files.
2. Apply the first matching placement rule below.
3. Add a `Placement: rule <1-5>; searched <what>; related <IDs or none>; reason <one sentence>` line.
4. Choose the branch from the placement table.
5. Write the failing regression first; never weaken an existing assertion.
6. Run the six gates in order and record actual exit codes.
7. Update the dashboard, register, prompt log, branch index and relevant memory.
8. Merge task to phase and phase to `develop` with `--no-ff` through PRs.
9. After each target merge, apply CM-2 synchronization.

## Placement rules

Search these sources before creating a row, task or branch: dashboard, change
request register, phase history, roadmap, phase branch index, memory pages,
and the source/tests for every screen or feature touched. Apply the rules in
order and stop at the first match.

1. **Ongoing standalone lifecycle.** Cleanup, QA/release, release/hotfix,
   branch/tag hygiene, CI and repository-process operations belong in the
   standalone lifecycle table, outside product phases. P43 is the explicitly
   designated, temporary repository-process phase for work that establishes
   this tracking model; its existing P43-A/B/E and this task's P43-F remain
   there as the one-time planning exception.
2. **Completed work.** A defect or adjustment to a completed part is the next
   sequential revision of that original ID, in its phase and reopened phase
   branch: `P20-A-R3`, not `P20-A-R2-R1-R1`. Mark the original row
   `Revised by <ID>-R<n>`. Existing chained IDs remain unchanged.
3. **Open work scope.** Widening an open Planned or In progress part amends
   that row in place; do not create another ID.
4. **Related feature area.** New work in an existing feature area, even a
   closed phase, takes the next free part letter in that phase and reopens its
   retained phase branch from `develop`.
5. **New feature area.** Start a new phase with parts A, B, C, and so on, on
   `phase/NN-slug` from `develop`.

Split requests with different work types and classify each separately; use one
`CR-<n>` register row to group the request. A revision is a fix/adjustment of
finished work; a part is one deliverable with its own tests; a phase is a
feature area; a CR groups a request. A task branch contains one part or one
revision.

Every new or moved ledger row includes a Placement line in this form:

```text
Placement: rule 1-5; searched dashboard, register, phase history, roadmap, memory and touched files; related <IDs or none>; reason <one sentence>.
```

A Planned row may move only when no commit, PR or Done-row evidence refers to
its ID. Move it instead of duplicating it, include `Previously: <old ID>`,
update dependencies, and add the old-to-new mapping to the Placement moves
table in `docs/PROGRESS.md` section 5. Done, Superseded and Cancelled rows
never change IDs. Ledger-only relocations do not reopen phase branches when
no work was done there; record that exception.

| Work | Placement | Branch |
|---|---|---|
| Fix completed P20-A-R2 behavior | Rule 2: P20-A-R3 | Reopen `phase/20-budget`; create `task/P20-A-R3-slug` |
| New spending heat map | Rule 5: P44-A–D | `phase/44-spending-heatmap` from `develop` |
| CM-2 repository sync rule | Rule 1: standalone repository rule; no dashboard part | No product phase branch |
| Separate cleanup and QA/release tracking | Rule 1 lifecycle tracking; P43 records the one-time setup work | `cleanup` and `qa-and-release` are ongoing branches |

## Branch and verification workflow

| Placement | Phase branch | Task branch |
|---|---|---|
| Completed-part revision | Reopen retained phase branch from `develop` | `task/<ID>-slug` |
| New part in an existing feature area | Reopen retained phase branch from `develop` | `task/<ID>-slug` |
| New feature area | `phase/NN-slug` from `develop` | `task/<ID>-slug` |
| Standalone lifecycle/repository operation | Existing lifecycle branch or no product branch for a rule-only change | One task branch only when an implementation deliverable needs review |

Do not implement unrelated planned features while performing placement work.
Run the six repository gates in order, record every real exit code, and list
physical-device checks as unverified unless they were actually observed.

## Placement audit decisions (2026-11-12)

- P20-A-R3 stays in P20 under rule 2 because it revises completed P20-A-R2.
- P43-C moves to P21-F under rule 4; Emergency Fund target editing belongs
  with the Emergency Fund model and screens.
- P43-D moves to P20-W under rule 4; P20-O/P own Budget item/category forms
  and transaction-category integration. P3 is generic persistence and is not
  the feature owner.
- P31-E moves to standalone QA/release lifecycle CI tracking under rule 1.
- P39-A–H stay in P39 under rule 5 by owner decision (CR-113); no lifecycle
  move. P40-A/B also remain under Agent-context hygiene by owner decision
  (CR-113); this finite documentation work does not move to lifecycle tracking.
- P43-A/B/E, P43-F and P43-G remain in the designated P43 repository-process phase
  as the task-specific setup exception above. P44 remains a new feature phase.

