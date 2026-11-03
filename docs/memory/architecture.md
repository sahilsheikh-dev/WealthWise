<!-- Purpose: Durable architecture facts and data boundaries. | Last updated: 2026-11-03 | Updates: owner and AI agents -->

# Architecture

## Domain and state

`src/domain/` contains pure rules, types, Zod validation, calculations,
migrations and backup integrity logic. Do not import React or Expo there, read
the clock, or generate random identifiers/digests; inject changing values at
the boundary. Zustand owns app state and persists the application data blob
through AsyncStorage. UI-only preferences are in the meta store.

An action that changes linked entities is one domain operation, one Zustand
`set()`, and one persisted write. Tests count writes where the behavior
requires atomicity.

## Asset values and returns

Pure portfolio selectors in `src/domain/portfolio.ts` and `src/domain/sip.ts`
derive Invested from opening capital plus deposits; withdrawals do not reduce
Invested. A dated valuation includes only later deposits/withdrawals through
the requested as-of date. With no dated valuation, value starts from opening
capital and posted ledger activity; rate-based interest is not estimated.
Values are clamped at zero. `src/domain/investmentReturns.ts` supplies the
shared gain, absolute-return, XIRR and CAGR calculations. Cash and Bank
holdings show balance and deposit/withdrawal totals but no holding-level return.
The asset list, holding cards and portfolio totals use the same domain
calculations; the investment-entry screen shows values and ledger totals.

Recurring liability balances in `src/domain/liability.ts` accrue actual
calendar days over 365, applying each recorded payment on its date and
continuing accrual to the requested as-of date. No per-period monetary
rounding is performed. This describes the app's current calculation only; a
lender's statement convention must be confirmed before changing it. The
P29-J audit is recorded in the [progress ledger](../PROGRESS.md).

## Schema and archives

Current persisted schema is v15. `src/data/migrate.ts` contains the ordered
upgrade chain from legacy schemas v1 through v14. The v14-to-v15 migration
converts the five legacy Insurance cover goals to stable editable records.
`createAppStore.ts` sets the
persist version from `SCHEMA_VERSION`.

Safe storage retains original bytes once, without overwriting an existing
archive, under `${persistName}.premigration.v1` through
`${persistName}.premigration.v14` before the migrated write. With the current
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
