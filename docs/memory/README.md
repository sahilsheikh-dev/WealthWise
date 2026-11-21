<!-- Purpose: Index and protocol for shared repository AI memory. | Last updated: 2026-11-22 | Updates: owner and AI agents -->

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

Before work, reconcile remote state using the latest owner snapshot or available
Git refs as required by R8. Read this index, the relevant memory files, and the
matching ledger section. After work, update `status.md` and `open-items.md`; record
decisions, scope, assumptions, replaced assertions, tests, gate exit codes and
verified commit evidence in `docs/PROGRESS.md`. Update other memory pages only
when their facts change. Keep the ledger's historical material intact; link to
it instead of copying its tables. Use repository source as truth over memory,
and correct stale memory in the same task. Never store personal financial
data, credentials, tokens or private account information here.

## Remote snapshot export

Before repository work, an owner with authenticated GitHub CLI access can export
remote evidence without placing it in Git. Run from the repository root; keep
the resulting directory under `/tmp/wealthwise-remote-snapshot/` and supply it
with the task. These commands are for the owner to run; agents must not run them
when the task prohibits network access.

```bash
S=/tmp/wealthwise-remote-snapshot
mkdir -p "$S"
git for-each-ref --format='%(refname) %(objectname)' refs/remotes refs/tags > "$S/refs.txt"
for b in develop main documentation cleanup qa-and-release schema-migration; do
  git log --first-parent --merges --format='%H%x09%P%x09%cI%x09%s' "$b" > "$S/firstparent-$b.txt" 2>&1 || true
done
git log --all --merges --format='%H%x09%P%x09%cI%x09%s' > "$S/all-merges.txt"
git branch -r --format='%(refname:short) %(objectname)' > "$S/remote-branches.txt"
git tag --format='%(refname:short) %(objectname)' > "$S/tags.txt"
gh pr list --state all --limit 1000 --json number,title,state,baseRefName,headRefName,mergedAt,mergeCommit,url > "$S/prs.json"
gh issue list --state all --limit 1000 --json number,title,state,url,createdAt,closedAt > "$S/issues.json"
gh release list --limit 1000 --json tagName,name,isDraft,isLatest,publishedAt,url > "$S/releases.txt"
printf '%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$S/exported-at.txt"
for n in $(gh pr list --state all --limit 1000 --json number --jq '.[].number'); do
  gh pr view "$n" --json number,title,body,state,baseRefName,headRefName,mergedAt,mergeCommit,url,comments > "$S/pr-$n-detail.json"
done
```

Record each command's exit status and retain owner terminal output for actions
that are not represented by Git refs or the exported JSON.
