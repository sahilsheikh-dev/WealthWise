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

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

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
      } else if (item.label === 'Load stress data (50y/100y/200y)' && devActions) {
        void choiceAsync({
          title: 'Load stress data?',
          message: 'Replace all local app data with a deterministic long-history fixture. The previous data can be restored with Undo.',
          choices: [
            { id: '50', label: '50 years', destructive: true },
            { id: '100', label: '100 years', destructive: true },
            { id: '200', label: '200 years', destructive: true },
            { id: '200-daily', label: '200 years + daily SIP', destructive: true },
          ],
        }).then((choice) => {
          if (choice !== '50' && choice !== '100' && choice !== '200' && choice !== '200-daily') return;
          const years = choice === '50' ? 50 : choice === '100' ? 100 : 200;
          const dailySip = choice === '200-daily';
          void devActions.loadStressData(years, dailySip).then(async (result) => {
            if (!result.ok) {
              Alert.alert('Could not load stress data', result.message);
              return;
            }
            const renderStartedAt = Date.now();
            await waitForRender();
            const renderMs = Date.now() - renderStartedAt;
            Alert.alert(
              'Stress data loaded',
              `${years} years${dailySip ? ' with daily SIP' : ''}. Build, validate, save and replace: ${result.loadMs} ms. First render after replace: ${renderMs} ms.`,
              [
                {
                  text: 'Undo',
                  style: 'cancel',
                  onPress: () => {
                    void undoImport().then((undoResult) => {
                      if (undoResult.ok) {
                        setActionToast({ message: 'Stress data removed' });
                        return;
                      }
                      Alert.alert('Could not undo stress data', undoResult.message);
                    }).catch((error: unknown) => {
                      Alert.alert('Could not undo stress data', error instanceof Error ? error.message : 'An unexpected error occurred.');
                    });
                  },
                },
                { text: 'OK' },
              ],
            );
          }).catch((error: unknown) => {
            Alert.alert('Could not load stress data', error instanceof Error ? error.message : 'An unexpected error occurred.');
          });
        });
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
