import { createContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { useAppStore } from '../data/store';
import type { ThemeId } from '../domain/types';
import { resolveTheme, themes, type ConcreteThemeId } from './themes';
import type { ThemeColors } from './tokens';

export type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  themeId: ThemeId;
  resolvedId: ConcreteThemeId;
  statusBar: 'light' | 'dark';
  setTheme: (theme: ThemeId) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const themeId = useAppStore((state) => state.data.settings.theme);
  const actions = useAppActions();
  const resolvedId = resolveTheme(themeId, systemScheme === 'dark' ? 'dark' : systemScheme === 'light' ? 'light' : null);
  const palette = themes[resolvedId];

  const value = useMemo<ThemeContextValue>(() => ({
    colors: palette.colors,
    isDark: palette.isDark,
    themeId,
    resolvedId,
    statusBar: palette.statusBar,
    setTheme: (theme) => actions.updateSettings({ theme }),
  }), [actions, palette, resolvedId, themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
