import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteStorage } from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

import { createMigratingSQLiteStateStorage } from './sqliteStateStorage';
import { markSQLiteFallbackActive } from './sqliteFallback';

const sqliteStorage = new SQLiteStorage('wealthwise-state.db');
const legacyStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const stateStorage = createMigratingSQLiteStateStorage(
  sqliteStorage,
  legacyStorage,
  (stage, error) => {
    console.warn(`SQLite state storage ${stage} failed; continuing with legacy storage.`, error);
    markSQLiteFallbackActive();
  },
  (diagnostic) => {
    if (__DEV__) console.log(`[storage] ${diagnostic}`);
  },
);
