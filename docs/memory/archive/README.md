<!-- Purpose: Index of archived completed-phase ledger narrative. | Last updated: 2026-11-25 | Updates: owner and AI agents -->

# Progress Ledger Archive

> Canonical current ledger: [docs/PROGRESS.md](../../PROGRESS.md) | Shared AI memory: [docs/memory/README.md](../README.md)

This directory holds completed-phase historical narrative moved out of [docs/PROGRESS.md](../../PROGRESS.md) under **P40-B** (`CR-173`) to keep per-prompt context reads fast while preserving 100% of the historical record and test coverage.

## Archive Files

| Archive file | Archived scope | Ledger section |
|---|---|---|
| [architecture-and-decisions.md](architecture-and-decisions.md) | Historical schema history (`v1`–`v23`) and completed-phase decisions | Section 4 |
| [phase-history.md](phase-history.md) | Completed-phase narrative summaries (`P1`–`P30`, `P41`–`P43`) | Section 5 |
| [prompt-and-session-log.md](prompt-and-session-log.md) | Prompt and session log rows (`CR-139` and earlier) | Section 6 |
| [change-request-register.md](change-request-register.md) | Closed change-request register rows (`CR-1` through `CR-139`) | Section 7 |
| [verification-matrix.md](verification-matrix.md) | Historical verification records (`CR-149` and earlier) | Section 10 |
| [session-and-release-log.md](session-and-release-log.md) | Historical session and release log entries (pre-`2026-11-22`) | Section 11 |

## Maintenance Rules

1. **Always update the canonical ledger first:** New work, active dashboard rows, standing rules, open items, current roadmap, recent prompt/CR rows, and current verification records belong in [docs/PROGRESS.md](../../PROGRESS.md).
2. **Archive only closed historical narrative:** When archiving future completed phases, move closed narrative subsections or older table rows into the corresponding archive file above, keeping the section heading and a link in `docs/PROGRESS.md`.
3. **Preserve test coverage:** [progressLedger.test.ts](../../../src/lib/__tests__/progressLedger.test.ts) reads both `docs/PROGRESS.md` and these archive files together so every historical assertion remains enforced.
