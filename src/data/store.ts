import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { DevSettings } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

import { todayISO } from '../lib/clock';
import { createAppStore } from './createAppStore';

const asyncStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

export const useAppStore = createAppStore(asyncStorage, {
  newId: () => Crypto.randomUUID(),
  today: todayISO,
  reload: () => DevSettings.reload(),
  isDev: __DEV__,
});
