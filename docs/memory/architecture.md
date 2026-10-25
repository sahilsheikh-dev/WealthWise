<!-- Purpose: Durable architecture facts and data boundaries. | Last updated: 2026-10-26 | Updates: owner and AI agents -->

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

## Schema and archives

Current persisted schema is v13. `src/data/migrate.ts` contains the ordered
upgrade chain from legacy schemas v1 through v13. `createAppStore.ts` sets the
persist version from `SCHEMA_VERSION`.

Safe storage retains original bytes once, without overwriting an existing
archive, under `${persistName}.premigration.v1` through
`${persistName}.premigration.v12` before the migrated write. With the current
persist name `wealthwise.app.v1`, other recovery keys are
`.prerepair-efallocation`, `.corrupt.latest`, and `.corrupt.previous`; import
staging uses `.preimport`. Erase-all removes the persisted data, all migration
archives, repair/corruption archives, import staging, and metadata. Verify the
implementation before changing archive semantics.

## Backups

Backups are user-exported JSON with a format version, schema version, export
timestamp, and SHA-256 checksum over canonical JSON. Import verifies the
checksum against data as written, then migrates supported historical schemas,
validates the current schema and linked-entity integrity, and refuses newer
schemas. The checksum is not encryption or authentication; backups remain
readable unless a future task changes this.

## Navigation and forms

Expo Router screens live in `app/`; main tabs are Home, Transactions, Goals
and Budget. Reuse `FormScreen`/`FormShell` for data-entry routes: shared
header/actions, scrollable body, sticky-header support and footer, with safe
area and keyboard handling in the screen wrapper.

`Dropdown` is a shared component in `src/components/Dropdown.tsx`; it presents
options in a top-anchored sheet, supports grouped options, selected radio
state, font-scaled row height and error/accessibility text. Frozen form input
components are protected by the manifest and freeze test.
