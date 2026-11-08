import type { StateStorage } from 'zustand/middleware';

export function createMigratingSQLiteStateStorage(
  sqliteStorage: StateStorage,
  legacyStorage: StateStorage,
): StateStorage {
  return {
    async getItem(name) {
      const current = await sqliteStorage.getItem(name);
      return current !== null ? current : legacyStorage.getItem(name);
    },
    async setItem(name, value) {
      const legacyValue = await legacyStorage.getItem(name);
      if (legacyValue !== null) {
        const current = await sqliteStorage.getItem(name);
        if (current === null) await sqliteStorage.setItem(name, legacyValue);
        await legacyStorage.removeItem(name);
      }
      await sqliteStorage.setItem(name, value);
    },
    async removeItem(name) {
      await legacyStorage.removeItem(name);
      await sqliteStorage.removeItem(name);
    },
  };
}
