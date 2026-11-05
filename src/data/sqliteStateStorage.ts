import type { StateStorage } from 'zustand/middleware';

export function createMigratingSQLiteStateStorage(
  sqliteStorage: StateStorage,
  legacyStorage: StateStorage,
  onSQLiteFailure: (stage: string, error: unknown) => void = (stage, error) => {
    console.warn(`SQLite state storage ${stage} failed; continuing with legacy storage.`, error);
  },
): StateStorage {
  let useLegacyStorage = false;

  const fallBack = async (stage: string, error: unknown, name: string, value: string) => {
    useLegacyStorage = true;
    onSQLiteFailure(stage, error);
    await legacyStorage.setItem(name, value);
  };

  return {
    async getItem(name) {
      if (useLegacyStorage) return legacyStorage.getItem(name);
      try {
        const current = await sqliteStorage.getItem(name);
        return current !== null ? current : legacyStorage.getItem(name);
      } catch (error) {
        useLegacyStorage = true;
        onSQLiteFailure('read', error);
        const legacyValue = await legacyStorage.getItem(name);
        if (legacyValue === null) {
          throw new Error('SQLite could not be read and no legacy copy is available.');
        }
        return legacyValue;
      }
    },
    async setItem(name, value) {
      if (useLegacyStorage) {
        await legacyStorage.setItem(name, value);
        return;
      }
      try {
        const legacyValue = await legacyStorage.getItem(name);
        if (legacyValue !== null) {
          const current = await sqliteStorage.getItem(name);
          if (current !== null && current !== legacyValue) {
            await fallBack('migration verification', new Error('SQLite data differs from the legacy copy.'), name, value);
            return;
          }
          if (current === null) {
            await sqliteStorage.setItem(name, legacyValue);
            const migrated = await sqliteStorage.getItem(name);
            if (migrated !== legacyValue) {
              await fallBack('migration verification', new Error('SQLite did not preserve the legacy bytes.'), name, value);
              return;
            }
          }
        }

        await sqliteStorage.setItem(name, value);
        const written = await sqliteStorage.getItem(name);
        if (written !== value) {
          await fallBack('write verification', new Error('SQLite did not preserve the written bytes.'), name, value);
          return;
        }
        if (legacyValue !== null) await legacyStorage.removeItem(name);
      } catch (error) {
        await fallBack('read or write', error, name, value);
      }
    },
    async removeItem(name) {
      let sqliteFailed = false;
      try {
        await sqliteStorage.removeItem(name);
      } catch (error) {
        sqliteFailed = true;
        useLegacyStorage = true;
        onSQLiteFailure('remove', error);
      }
      await legacyStorage.removeItem(name);
      if (sqliteFailed) {
        throw new Error('SQLite could not remove the persisted value; the legacy copy was removed.');
      }
    },
  };
}
