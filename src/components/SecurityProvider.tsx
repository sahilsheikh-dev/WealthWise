import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import {
  createSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
  type SecuritySettings,
} from '../lib/securitySettings';

const settingsStore = createSecuritySettings({
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  deleteItem: SecureStore.deleteItemAsync,
});

type SecurityContextValue = {
  settings: SecuritySettings | null;
  update: (next: SecuritySettings) => Promise<void>;
  resetAfterErase: () => void;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  useEffect(() => {
    void settingsStore.get().then(setSettings).catch(() => setSettings({
      enabled: true, graceMs: 0, hidePreviews: true,
    }));
  }, []);
  const value = useMemo<SecurityContextValue>(() => ({
    settings,
    async update(next) {
      await settingsStore.set(next);
      setSettings(next);
    },
    resetAfterErase() {
      setSettings({ ...DEFAULT_SECURITY_SETTINGS });
    },
  }), [settings]);
  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecuritySettings(): SecurityContextValue {
  const value = useContext(SecurityContext);
  if (!value) throw new Error('SecurityProvider is missing.');
  return value;
}
