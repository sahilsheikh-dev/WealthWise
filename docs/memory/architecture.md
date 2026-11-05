<!-- Purpose: Durable architecture facts and data boundaries. | Last updated: 2026-11-05 | Updates: owner and AI agents -->

# Architecture

## Domain and state

`src/domain/` contains pure rules, types, Zod validation, calculations,
migrations and backup integrity logic. Do not import React or Expo there, read
the clock, or generate random identifiers/digests; inject changing values at
the boundary. Zustand owns app state and persists the application data blob
through Expo SQLite's `SQLiteStorage` on iOS/Android and AsyncStorage on web.
Native storage falls back to the prior AsyncStorage value and migrates it on
the first write. UI-only preferences remain in the AsyncStorage-backed meta
store.

The SQLite adapter remains a key-value blob, not a normalized AppData schema.
It preserves the existing Zustand envelope, safe-storage archives, schema
version and replace/Undo semantics. The installed Expo SQLite adapter has no
app-level per-value limit; device disk capacity and native performance still
require physical-device verification. See the P29-Q record in the
[progress ledger](../PROGRESS.md). The measured 50-year state is 2.67 MB,
above the requested 1.5 MB target; this remains a documented size miss, not a
device-capacity result.

An action that changes linked entities is one domain operation, one Zustand
`set()`, and one persisted write. Tests count writes where the behavior
requires atomicity.

## Asset values and returns

Pure portfolio selectors in `src/domain/portfolio.ts` and `src/domain/sip.ts`
derive Invested from opening capital plus deposits; withdrawals do not reduce
Invested. A dated valuation includes only later deposits/withdrawals through
the requested as-of date. With no dated valuation, value starts from opening
capital and posted ledger activity. Unconfigured holdings retain that legacy
calculation; `src/domain/valuation.ts` supplies the shared configured accrual
and units-price methods, with date inputs supplied by callers. Quarterly
compounding is `(1 + r/4)^(4t)`, where `t` is actual days / 365. Values are
clamped at zero. `src/domain/investmentReturns.ts` supplies shared gain,
absolute-return, XIRR and CAGR calculations. Cash and Savings holdings suppress
holding-level return percentages. The asset list, cards, portfolio totals,
goals, Emergency Fund and net worth route holding values through the same
selector.

Recurring liability balances in `src/domain/liability.ts` accrue actual
calendar days over 365, applying each recorded payment on its date and
continuing accrual to the requested as-of date. No per-period monetary
rounding is performed. This describes the app's current calculation only; a
lender's statement convention must be confirmed before changing it. The
P29-J audit is recorded in the [progress ledger](../PROGRESS.md).

## Schema and archives

Current persisted schema is v20. `src/data/migrate.ts` contains the ordered
upgrade chain from legacy schemas v1 through v19. The v14-to-v15 migration
converted legacy Insurance goals; the v15-to-v16 migration applies holding
capabilities and separates legacy FD/RD records without dropping entries or
schedules. The v16-to-v17 migration removes only retired cover-goal records
and policy cover-goal assignments. The v17-to-v18 migration annotates legacy
policy payments with the due date already matched by the v17 FIFO schedule,
preserving unmatched and pre-trackFrom payment history. New payments carry
their exact settled slot date, and `policySchedule` matches dated entries by
slot while keeping the legacy FIFO rule for undated entries.
`createAppStore.ts` sets the persist version from `SCHEMA_VERSION`. The
v18-to-v19 migration is additive and preserves its input; inferred valuation
methods are suggestions until a method is explicitly configured or a
value/price is confirmed. The v19-to-v20 migration is identity-preserving;
recurring liabilities can optionally store a closure date, linked payment,
note, and separate charge transaction id.

Safe storage retains original bytes once, without overwriting an existing
archive, under `${persistName}.premigration.v1` through
`${persistName}.premigration.v19` before the migrated write. With the current
persist name `wealthwise.app.v1`, other recovery keys are
`.prerepair-efallocation`, `.corrupt.latest`, and `.corrupt.previous`; import
staging uses `.preimport`. Erase-all removes the persisted data, all migration
archives, repair/corruption archives, import staging, and metadata. Verify the
implementation before changing archive semantics.

## Backups

Backups keep the existing versioned JSON payload and SHA-256 checksum over
canonical JSON. Import verifies the checksum against data as written, then
migrates supported historical schemas, validates the current schema and
linked-entity integrity, and refuses newer schemas. Encrypted exports wrap
that payload in a versioned AES-256-GCM envelope; the header is authenticated
as additional data and scrypt derives the key from a Unicode NFKC-normalized
passphrase. The passphrase is transient; there is no recovery. Plain export
remains an explicit, warned choice, and legacy plain imports remain supported.

Encryption protects exported files only. On-device app data remains
unencrypted and app lock is not encryption. Encrypted export writes
ciphertext-only cache files and decrypts imports in memory. SDK 57's
cross-platform sharing and picked-file APIs require temporary cache files for
the explicit plain export and reading picked files; those files are deleted
after use. The plaintext result of decrypting an encrypted backup is never
written to disk.

## Navigation and forms

Expo Router screens live in `app/`; main tabs are Home, Transactions, Goals
and Budget. Reuse `FormScreen`/`FormShell` for data-entry routes: shared
header/actions, scrollable body, sticky-header support and footer, with safe
area and keyboard handling in the screen wrapper.

`Dropdown` is a shared component in `src/components/Dropdown.tsx`; it presents
options in a top-anchored sheet, supports grouped options, selected radio
state, font-scaled row height and error/accessibility text. Frozen form input
components are protected by the manifest and freeze test.
