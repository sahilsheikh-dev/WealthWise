import { createContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useAppActions } from '../data/useAppData';
import { useAppStore } from '../data/store';
import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ThemePreference = 'system' | 'dark' | 'light';

export type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  themePreference: ThemePreference;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const themePreference = useAppStore((state) => state.data.settings.theme);
  const actions = useAppActions();
  const isDark = themePreference === 'system' ? systemScheme === 'dark' : themePreference === 'dark';

  const value = useMemo<ThemeContextValue>(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    themePreference,
    toggleTheme: () => {
      const next: Record<ThemePreference, ThemePreference> = {
        system: 'dark',
        dark: 'light',
        light: 'system',
      };
      actions.updateSettings({ theme: next[themePreference] });
    },
  }), [actions, isDark, themePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
