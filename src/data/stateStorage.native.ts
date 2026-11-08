import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteStorage } from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

import { createMigratingSQLiteStateStorage } from './sqliteStateStorage';

const sqliteStorage = new SQLiteStorage('wealthwise-state.db');
const legacyStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const stateStorage = createMigratingSQLiteStateStorage(sqliteStorage, legacyStorage);
