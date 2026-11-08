import { createContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './tokens';

export type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<boolean | null>(null);
  const isDark = override ?? systemScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      toggleTheme: () => setOverride((current) => !(current ?? systemScheme === 'dark')),
    }),
    [isDark, systemScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
