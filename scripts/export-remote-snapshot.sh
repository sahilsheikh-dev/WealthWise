#!/usr/bin/env bash
# Export a snapshot of the remote state of the WealthWise repo for agents (rule R8).
# Run from the repo root, with network and `gh` logged in:   bash scripts/export-remote-snapshot.sh
# Writes everything to /tmp/wealthwise/remote-snapshot/ (existing gate4-* and owner-terminal-* files are kept).
set -u
S=/tmp/wealthwise/remote-snapshot
REPO=sahilsheikh-dev/WealthWise
mkdir -p "$S"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Run this from inside the WealthWise repo."; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh is not logged in (run: gh auth login)."; exit 1; }

echo "[1/8] git fetch"
git fetch --all --prune --tags || echo "WARN: fetch failed, using existing refs"

echo "[2/8] refs and history"
git for-each-ref --format='%(refname:short)|%(objectname)|%(committerdate:iso-strict)' refs/remotes refs/tags > "$S/refs.txt"
for b in develop main documentation cleanup qa-and-release schema-migration phase/20-budget; do
  f="$S/firstparent-$(echo "$b" | tr '/' '_').txt"
  git log "origin/$b" --first-parent --format='%H|%cI|%an|%s' > "$f" 2>/dev/null || rm -f "$f"
done
git log --all --merges --format='%H|%cI|%P|%s' > "$S/all-merges.txt"

echo "[3/8] pull requests (all)"
gh pr list --repo "$REPO" --state all --limit 1000 \
  --json number,title,state,isDraft,baseRefName,headRefName,headRefOid,createdAt,updatedAt,mergedAt,closedAt,mergeCommit,mergedBy,url,author,labels,body \
  > "$S/prs.json"

echo "[4/8] PR comments, reviews and commits (latest 60 PRs)"
for n in $(gh pr list --repo "$REPO" --state all --limit 1000 --json number -q '.[].number' | sort -n | tail -60); do
  gh pr view "$n" --repo "$REPO" --json number,title,body,comments,reviews,commits > "$S/pr-$n-detail.json" 2>/dev/null || echo "WARN: PR $n detail failed"
done

echo "[5/8] releases and tags"
gh release list --repo "$REPO" --limit 100 > "$S/releases.txt"
git tag -l --format='%(refname:short)|%(objectname)|%(creatordate:iso-strict)' > "$S/tags.txt"

echo "[6/8] issues"
gh issue list --repo "$REPO" --state all --limit 500 --json number,title,state,labels,createdAt,closedAt > "$S/issues.json"

echo "[7/8] remote branches"
gh api "repos/$REPO/branches" --paginate -q '.[].name' > "$S/remote-branches.txt"

echo "[8/8] stamp"
{
  date -Iseconds
  echo "develop=$(git rev-parse origin/develop 2>/dev/null)"
  echo "phase/20-budget=$(git rev-parse origin/phase/20-budget 2>/dev/null)"
  echo "local-branch=$(git branch --show-current)"
} > "$S/exported-at.txt"

echo
echo "Snapshot written to $S:"
ls -la "$S"
