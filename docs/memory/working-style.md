<!-- Purpose: Capture the owner's collaboration and reporting expectations. | Last updated: 2026-10-26 | Updates: owner and AI agents -->

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
- Preserve all user work; use a checkpoint commit when required and never
  rewrite history.
