import type { StateStorage } from 'zustand/middleware';

type LegacyAuthority = { kind: 'value'; value: string } | { kind: 'deleted' };
type HydrationSource = 'sqlite' | 'legacy' | 'legacy-authority' | 'empty';

const LEGACY_AUTHORITY_PREFIX = 'wealthwise.sqlite.authority:';

function authorityKey(name: string): string {
  return `${LEGACY_AUTHORITY_PREFIX}${name}`;
}

function readLegacyAuthority(raw: string): LegacyAuthority {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Legacy SQLite authority marker is invalid.');
  }
  if (typeof parsed !== 'object' || parsed === null || !('kind' in parsed)) {
    throw new Error('Legacy SQLite authority marker is invalid.');
  }
  if (parsed.kind === 'deleted') return { kind: 'deleted' };
  if (parsed.kind === 'value' && 'value' in parsed && typeof parsed.value === 'string') {
    return { kind: 'value', value: parsed.value };
  }
  throw new Error('Legacy SQLite authority marker is invalid.');
}

function encodeLegacyAuthority(authority: LegacyAuthority): string {
  return JSON.stringify(authority);
}

export function createMigratingSQLiteStateStorage(
  sqliteStorage: StateStorage,
  legacyStorage: StateStorage,
  onSQLiteFailure: (stage: string, error: unknown) => void = (stage, error) => {
    console.warn(`SQLite state storage ${stage} failed; continuing with legacy storage.`, error);
  },
  onDiagnostic?: (line: string) => void,
): StateStorage {
  let useLegacyStorage = false;
  let hydrationSource: HydrationSource = 'empty';
  let lastWriteVerification = 'not-run';

  const reportDiagnostic = () => {
    onDiagnostic?.(`hydration source=${hydrationSource}; last-write verification=${lastWriteVerification}`);
  };

  const readLegacy = async (name: string): Promise<{ source: HydrationSource; value: string | null }> => {
    const rawAuthority = await legacyStorage.getItem(authorityKey(name));
    if (rawAuthority !== null) {
      const authority = readLegacyAuthority(rawAuthority);
      return {
        source: 'legacy-authority',
        value: authority.kind === 'value' ? authority.value : null,
      };
    }
    const value = await legacyStorage.getItem(name);
    return { source: value === null ? 'empty' : 'legacy', value };
  };

  const writeLegacy = async (name: string, value: string): Promise<void> => {
    const encodedAuthority = encodeLegacyAuthority({ kind: 'value', value });
    await legacyStorage.setItem(authorityKey(name), encodedAuthority);
    if (await legacyStorage.getItem(authorityKey(name)) !== encodedAuthority) {
      lastWriteVerification = 'failed';
      reportDiagnostic();
      throw new Error('Legacy storage did not preserve the authoritative value.');
    }
    lastWriteVerification = 'legacy-authority';
    reportDiagnostic();
    try {
      await legacyStorage.setItem(name, value);
    } catch (error) {
      onSQLiteFailure('legacy mirror write', error);
    }
  };

  return {
    async getItem(name) {
      if (useLegacyStorage) {
        const legacy = await readLegacy(name);
        hydrationSource = legacy.source;
        reportDiagnostic();
        return legacy.value;
      }
      const rawAuthority = await legacyStorage.getItem(authorityKey(name));
      if (rawAuthority !== null) {
        const authority = readLegacyAuthority(rawAuthority);
        hydrationSource = 'legacy-authority';
        reportDiagnostic();
        return authority.kind === 'value' ? authority.value : null;
      }
      try {
        const current = await sqliteStorage.getItem(name);
        if (current !== null) {
          hydrationSource = 'sqlite';
          reportDiagnostic();
          return current;
        }
        const legacyValue = await legacyStorage.getItem(name);
        hydrationSource = legacyValue === null ? 'empty' : 'legacy';
        reportDiagnostic();
        return legacyValue;
      } catch (error) {
        useLegacyStorage = true;
        onSQLiteFailure('read', error);
        const legacy = await readLegacy(name);
        hydrationSource = legacy.source;
        reportDiagnostic();
        if (legacy.value === null) {
          throw new Error('SQLite could not be read and no legacy copy is available.');
        }
        return legacy.value;
      }
    },
    async setItem(name, value) {
      if (useLegacyStorage) {
        try {
          await writeLegacy(name, value);
        } catch (error) {
          lastWriteVerification = 'failed';
          reportDiagnostic();
          throw error;
        }
        return;
      }
      let fallbackAttempted = false;
      const fallBack = async (stage: string, error: unknown) => {
        fallbackAttempted = true;
        useLegacyStorage = true;
        onSQLiteFailure(stage, error);
        await writeLegacy(name, value);
      };
      try {
        const rawAuthority = await legacyStorage.getItem(authorityKey(name));
        const authority = rawAuthority === null ? null : readLegacyAuthority(rawAuthority);
        const legacyValue = authority?.kind === 'value' ? authority.value
          : authority?.kind === 'deleted' ? null
            : await legacyStorage.getItem(name);
        if (legacyValue !== null) {
          const current = await sqliteStorage.getItem(name);
          if (current !== null && current !== legacyValue) {
            await fallBack('migration verification', new Error('SQLite data differs from the legacy copy.'));
            return;
          }
          if (current === null) {
            await sqliteStorage.setItem(name, legacyValue);
            const migrated = await sqliteStorage.getItem(name);
            if (migrated !== legacyValue) {
              await fallBack('migration verification', new Error('SQLite did not preserve the legacy bytes.'));
              return;
            }
          }
        }

        await sqliteStorage.setItem(name, value);
        const written = await sqliteStorage.getItem(name);
        if (written !== value) {
          await fallBack('write verification', new Error('SQLite did not preserve the written bytes.'));
          return;
        }
        await legacyStorage.removeItem(name);
        await legacyStorage.removeItem(authorityKey(name));
        lastWriteVerification = 'sqlite-verified';
        reportDiagnostic();
      } catch (error) {
        if (fallbackAttempted) {
          lastWriteVerification = 'failed';
          reportDiagnostic();
          throw error;
        }
        try {
          await fallBack('read or write', error);
        } catch (fallbackError) {
          lastWriteVerification = 'failed';
          reportDiagnostic();
          throw fallbackError;
        }
      }
    },
    async removeItem(name) {
      const encodedAuthority = encodeLegacyAuthority({ kind: 'deleted' });
      await legacyStorage.setItem(authorityKey(name), encodedAuthority);
      if (await legacyStorage.getItem(authorityKey(name)) !== encodedAuthority) {
        lastWriteVerification = 'failed';
        reportDiagnostic();
        throw new Error('Legacy storage did not preserve the deletion marker.');
      }
      lastWriteVerification = 'legacy-authority';
      reportDiagnostic();
      let sqliteFailed = false;
      try {
        await sqliteStorage.removeItem(name);
      } catch (error) {
        sqliteFailed = true;
        useLegacyStorage = true;
        onSQLiteFailure('remove', error);
      }
      await legacyStorage.removeItem(name);
      if (sqliteFailed) throw new Error('SQLite could not remove the persisted value; the legacy copy was removed.');
      await legacyStorage.removeItem(authorityKey(name));
      lastWriteVerification = 'sqlite-verified';
      reportDiagnostic();
    },
  };
}
