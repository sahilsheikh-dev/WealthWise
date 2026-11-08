import { router, usePathname, type Href } from 'expo-router';
import { Alert } from 'react-native';
import { useMemo } from 'react';

import { useAppStore } from '../data/store';
import { useUIStore } from '../data/uiStore';
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
  Reminders: '/reminders',
  Security: '/security',
  Profile: '/profile-form',
  Theme: '/theme',
  'Erase all data': '/erase-data',
};

export function useAppMenu(): HeaderMenuItem[] {
  const devActions = useAppStore((state) => state.devActions);
  const undoImport = useAppStore((state) => state.actions.undoImport);
  const setActionToast = useUIStore((state) => state.setActionToast);
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
          message: 'Replace local app data with four months of sample data?',
          confirmLabel: 'Load demo data',
          destructive: true,
        }).then((confirmed) => {
          if (!confirmed) return;
          void devActions.loadDemoData().then((result) => {
            if (result.ok) {
              Alert.alert('Demo data loaded', 'Four months of sample data are ready.', [
                {
                  text: 'Undo',
                  style: 'cancel',
                  onPress: () => {
                    void undoImport().then((undoResult) => {
                      if (undoResult.ok) {
                        setActionToast({ message: 'Demo data removed' });
                        return;
                      }
                      Alert.alert('Could not undo demo data', undoResult.message);
                    }).catch((error: unknown) => {
                      Alert.alert('Could not undo demo data', error instanceof Error ? error.message : 'An unexpected error occurred.');
                    });
                  },
                },
                { text: 'OK' },
              ]);
              return;
            }
            void confirmAsync({
              title: 'Could not load demo data',
              message: result.message,
              confirmLabel: 'OK',
            });
          }).catch((error: unknown) => {
            Alert.alert('Could not load demo data', error instanceof Error ? error.message : 'An unexpected error occurred.');
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
  })), [devActions, isDev, pathname, setActionToast, themeId, undoImport]);
}
