import { SCHEMA_VERSION } from '../domain/schemas';

export class PersistedVersionError extends Error {
  constructor(readonly fromVersion: number, readonly reason: 'unknown-version' | 'future-version') {
    super(`Cannot migrate persisted data from version ${fromVersion}`);
    this.name = 'PersistedVersionError';
  }
}

export function migratePersisted<T>(persisted: T, fromVersion: number): T {
  if (fromVersion === SCHEMA_VERSION) return persisted;
  if (fromVersion > SCHEMA_VERSION) throw new PersistedVersionError(fromVersion, 'future-version');
  if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
    throw new PersistedVersionError(fromVersion, 'unknown-version');
  }
  // Add explicit version-by-version transformations here when the persisted schema changes.
  throw new PersistedVersionError(fromVersion, 'unknown-version');
}
