import { router, usePathname, type Href } from 'expo-router';
import { useMemo } from 'react';

import { useAppStore } from '../data/store';
import { buildAppMenu } from '../lib/appMenu';
import { choiceAsync, confirmAsync } from '../lib/confirm';
import { useTheme } from '../theme/useTheme';
import type { HeaderMenuItem } from './HeaderMenu';

const themeLabels = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  sky: 'Sky',
  mint: 'Mint',
  blush: 'Blush',
  midnight: 'Midnight',
} as const;

const destinations: Record<string, string> = {
  'Backup and restore': '/backup',
  Security: '/security',
  Profile: '/profile-form',
  Theme: '/theme',
  'Erase all data': '/erase-data',
};

export function useAppMenu(): HeaderMenuItem[] {
  const devActions = useAppStore((state) => state.devActions);
  const pathname = usePathname();
  const { themeId } = useTheme();
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  return useMemo(() => buildAppMenu({
    isDev,
    themeLabel: themeLabels[themeId],
  }).map((item) => ({
    ...item,
    onPress: () => {
      const destination = destinations[item.label];
      if (destination) {
        if (pathname !== destination) router.push(destination as Href);
      } else if (item.label === 'Load demo data (4 months)' && devActions) {
        void confirmAsync({
          title: 'Load demo data?',
          message: 'Replace local app data with four months of sample data? You can undo this from Backup and restore.',
          confirmLabel: 'Load demo data',
          destructive: true,
        }).then((confirmed) => {
          if (!confirmed) return;
          void devActions.loadDemoData().then((result) => {
            if (result.ok) {
              router.push('/backup');
              return;
            }
            void confirmAsync({
              title: 'Could not load demo data',
              message: result.message,
              confirmLabel: 'OK',
            });
          });
        });
      } else if (item.label === 'Generate stress-test data' && devActions) {
        void choiceAsync({
          title: 'Generate stress-test data?',
          message: 'Replace your transactions with 20,000 local test entries to check storage limits and list performance.',
          choices: [{ id: 'generate', label: 'Generate data', destructive: true }],
        }).then((choice) => { if (choice === 'generate') devActions.loadStressData(); });
      } else if (item.label === 'Simulate corrupt storage' && devActions) {
        void choiceAsync({
          title: 'Simulate Corrupt Storage?',
          message: 'The app will restart and show its recovery screen.',
          choices: [{ id: 'continue', label: 'Continue', destructive: true }],
        }).then((choice) => { if (choice === 'continue') void devActions.simulateCorruption(); });
      }
    },
  })), [devActions, isDev, pathname, themeId]);
}
