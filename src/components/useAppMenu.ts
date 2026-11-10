import { router, usePathname, type Href } from 'expo-router';
import { Alert } from 'react-native';
import { useCallback, useMemo } from 'react';

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
  About: '/about',
  'Erase all data': '/erase-data',
};

const stressDataChoices = [
  { id: '50', label: '50 years', destructive: true },
  { id: '100', label: '100 years', destructive: true },
  { id: '126', label: '126 years', destructive: true },
  { id: 'dense', label: 'Dense (200-year record count + daily SIP)', destructive: true },
] as const;

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

  const loadStressTier = useCallback((choice: string) => {
    if (!devActions || !stressDataChoices.some(({ id }) => id === choice)) return;
    const years = choice === '50' ? 50 : choice === '100' ? 100 : 126;
    const dense = choice === 'dense';
    void devActions.loadStressData(years, dense).then(async (result) => {
      if (!result.ok) {
        Alert.alert('Could not load stress data', result.message);
        return;
      }
      const renderStartedAt = Date.now();
      await waitForRender();
      const renderMs = Date.now() - renderStartedAt;
      Alert.alert(
        'Stress data loaded',
        `${dense ? 'Dense 200-year record count within 126 years, including daily SIP' : `${years} years`}. Build, validate, save and replace: ${result.loadMs} ms. First render after replace: ${renderMs} ms.`,
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
  }, [devActions, setActionToast, undoImport]);

  return useMemo(() => buildAppMenu({
    isDev,
    themeLabel: themeLabels[themeId],
  }).map((item) => {
    const selection = item.label === 'Load stress data (50y/100y/126y/dense)' && devActions
      ? {
          title: 'Load stress data?',
          message: 'Replace all local app data with a deterministic long-history fixture. The previous data can be restored with Undo.',
          choices: stressDataChoices,
          onSelect: loadStressTier,
        }
      : undefined;
    return {
      ...item,
      ...(selection ? { selection } : {}),
      onPress: () => {
        const destination = destinations[item.label];
        if (destination) {
          if (pathname !== destination) router.push(destination as Href);
        } else if (item.label === 'Load demo data (6 months)' && devActions) {
          void confirmAsync({
            title: 'Load demo data?',
            message: 'Replace local app data with six months of sample data?',
            confirmLabel: 'Load demo data',
            destructive: true,
          }).then((confirmed) => {
            if (!confirmed) return;
            void devActions.loadDemoData().then((result) => {
              if (result.ok) {
                Alert.alert('Demo data loaded', 'Six months of sample data are ready.', [
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
        } else if (item.label === 'Simulate corrupt storage' && devActions) {
          void choiceAsync({
            title: 'Simulate Corrupt Storage?',
            message: 'The app will restart and show its recovery screen.',
            choices: [{ id: 'continue', label: 'Continue', destructive: true }],
          }).then((choice) => { if (choice === 'continue') void devActions.simulateCorruption(); });
        }
      },
    };
  }), [devActions, isDev, loadStressTier, pathname, setActionToast, themeId, undoImport]);
}
