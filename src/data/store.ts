import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { DevSettings } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

import { todayISO } from '../lib/clock';
import { LOCK_SETTINGS_KEY } from '../lib/securitySettings';
import { createAppStore } from './createAppStore';
import { createMetaStore } from './metaStore';

const asyncStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const metaStore = createMetaStore(asyncStorage);

export const useAppStore = createAppStore(asyncStorage, {
  newId: () => Crypto.randomUUID(),
  today: todayISO,
  reload: () => DevSettings.reload(),
  isDev: __DEV__,
  removeLockSettings: () => SecureStore.deleteItemAsync(LOCK_SETTINGS_KEY),
});
