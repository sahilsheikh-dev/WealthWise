<!-- Purpose: Capture the owner's collaboration and reporting expectations. | Last updated: 2026-11-22 | Updates: owner and AI agents -->

# Working style

- One prompt/task at a time; stop at the requested phase boundary.
- Treat frozen specifications as acceptance contracts. If they conflict with
  current user-owned code or a newer explicit order, report the conflict and
  apply the closest authorized behavior without editing frozen files.
- Work in staged steps: preflight and audit, implementation, focused tests,
  ledger update, then ordered full gates.
- Give honest verdicts with real exit codes; distinguish pass, failure,
  assumption and device behavior that was not tested.
- Record replaced assertions with old behavior, new assertion and reason.
- Do not use emojis in reports or memory.
- Preserve all user work; describe each committed change accurately and never
  rewrite history.

- Maintain the **Owner-run actions log** in `docs/PROGRESS.md` from verifiable terminal output, owner snapshots, or Git refs; mark absent exit codes `not captured`. End reports with an **Owner actions pending** list.
- Maintain **GitHub issue tracking** and PR tracking under Model A: every ledger item has a corresponding GitHub issue, and every PR carries matching phase/lifecycle, type, status, and semantic standard labels. Apply standard labels (`enhancement`, `bug`, `documentation`, `wontfix`) accurately, keep planned issues updated with scope/dependencies as work proceeds, and maintain test enforcement via `progressLedger.test.ts`. Record verified PRs, merge commits, and test evidence upon retrospective closure. PR #39 is verified Closed Unmerged (`status:superseded`, `wontfix`); commit `b779c21` was connected as ancestry in P28-E-R3 and released in `v1.1.1`. Never invent or open speculative issues for unapproved ideas.
