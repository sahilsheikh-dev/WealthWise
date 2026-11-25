<!-- Purpose: Index and protocol for shared repository AI memory. | Last updated: 2026-11-25 | Updates: owner and AI agents -->

# Shared AI memory

This folder is the compact, repo-based long-term project memory. The root
[AGENTS.md](../../AGENTS.md) is the only AI instruction file for every tool;
do not add tool-specific instruction or pointer files. This memory complements,
but does not replace or shorten, the canonical [progress ledger](../PROGRESS.md).

## Reading order

1. [project.md](project.md) — product, stack, routes and schema.
2. [architecture.md](architecture.md) — persistence, migrations, backup,
   routing and shared UI.
3. [rules.md](rules.md) — invariants, protected files and gates.
4. [decisions.md](decisions.md) — decision IDs with ledger links.
5. [status.md](status.md) — current work and last verified project state.
6. [open-items.md](open-items.md) — unresolved requirements, risks and owner
   decisions.
7. [working-style.md](working-style.md) — collaboration and reporting norms.
8. [work-placement.md](work-placement.md) — classify work and select its
   phase, lifecycle table and branch.

## Files and update protocol

| File | Purpose |
|---|---|
| [README.md](README.md) | Index and update protocol |
| [project.md](project.md) | Product and repository overview |
| [architecture.md](architecture.md) | Architecture and data flow |
| [rules.md](rules.md) | Engineering rules and protected files |
| [decisions.md](decisions.md) | Decision index into `docs/PROGRESS.md` |
| [status.md](status.md) | Current phase, gates and blockers |
| [open-items.md](open-items.md) | Unresolved items, assumptions and device checks |
| [working-style.md](working-style.md) | Owner/AI working agreement |
| [work-placement.md](work-placement.md) | Work classification, placement rules and branch workflow |
| [archive/README.md](archive/README.md) | Index of archived completed-phase ledger narrative |

Before work, reconcile remote state using the latest owner snapshot or available
Git refs as required by R8. Read this index, the relevant memory files, and the
matching ledger section. After work, update `status.md` and `open-items.md`; record
decisions, scope, assumptions, replaced assertions, tests, gate exit codes and
verified commit evidence in `docs/PROGRESS.md`. Align corresponding GitHub issues
under Model A (open planned issues; retrospective closure for completed work).
Update other memory pages only when their facts change. Keep the ledger's
historical material intact; link to it instead of copying its tables. Use repository
source as truth over memory, and correct stale memory in the same task. Never store
personal financial data, credentials, tokens or private account information here.

## Remote snapshot export and terminal evidence

Before repository work, the owner should provide a fresh remote snapshot and
terminal evidence. Keep both under `/tmp/wealthwise/remote-snapshot/` (other
WealthWise temporary outputs belong under `/tmp/wealthwise/reports/`,
`/tmp/wealthwise/logs/`, and `/tmp/wealthwise/build-artifacts/`); agents
must not run the export script when the task prohibits network access.
After every manual merge, refresh the snapshot before the next agent task—and
refresh the snapshot with `scripts/export-remote-snapshot.sh` whenever remote state
changes (PR/issue updates or tag/release changes) or at task start if the latest
snapshot is older than current remote changes—so refs, PR records, issues, and
merge state describe the same point in time.

For manual authenticated terminal work, start a recording session and finish it
with `exit`:

```bash
script -a /tmp/wealthwise/remote-snapshot/owner-terminal-$(date +%F).log
# perform the owner-run GitHub/Git actions in this recorded shell
exit
```

`pbpaste` only copies the clipboard. It is not evidence of a terminal session
unless the complete terminal text was copied first. Preserve terminal output
for actions that Git refs or the JSON exports cannot establish. If transcript
text is reconstructed from chat, label it as reconstructed and identify its
source; do not call it an original terminal capture.

Use the owner's authenticated `scripts/export-remote-snapshot.sh` from the repository
root to export into `/tmp/wealthwise/remote-snapshot/`. The export includes
`prs.json` fields `number`, `title`, `state`, `base` (`baseRefName`),
`head` (`headRefName`), `headRefOid`,
`createdAt`, `updatedAt`, `mergedAt`, `closedAt`, `mergeCommit`, `mergedBy`,
`url`, `author`, `labels`, and `body`; detail files for the latest 60 PRs;
releases, tags, issues, remote branches, refs, first-parent logs, all merge
records, and an export timestamp. Use the supplied snapshot as evidence and
record its timestamp in the ledger; never infer remote facts from local commit
subjects alone.
