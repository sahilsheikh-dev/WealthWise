import { router } from 'expo-router';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import HomeScreen from '../../../app/(tabs)';
import SettingsScreen from '../../../app/settings';
import { emptyAppData } from '../../domain/actions';
import { notificationListenerAdapter } from '../../lib/notificationListener';
import {
  getTransactionDetectionStatus,
  type TransactionDetectionStatusInfo,
} from '../../lib/transactionDetectionStatus';

const mockData = {
  ...emptyAppData('2026-10-10'),
  settings: { ...emptyAppData('2026-10-10').settings, name: 'Demo' },
};
const mockActions = {
  clearDue: jest.fn(),
  clearDuesThrough: jest.fn(),
  undoClearDue: jest.fn(),
  undoClearDuesThrough: jest.fn(),
  saveAndApplyBudgetPlan: jest.fn(),
  restoreBudgetPlanAndMonth: jest.fn(),
  markPaid: jest.fn(),
};
const mockMenuPress = jest.fn();
let mockMenuItems: {
  label: string;
  description?: string;
  icon: 'download' | 'calendar' | 'lock' | 'user' | 'sliders' | 'info' | 'trash-2' | 'database';
  destructive?: boolean;
  onPress: () => void;
}[] = [
  { label: 'Backup and restore', icon: 'download' as const, onPress: mockMenuPress },
  { label: 'Reminders', icon: 'calendar' as const, onPress: mockMenuPress },
  { label: 'Security', icon: 'lock' as const, onPress: mockMenuPress },
  { label: 'Profile', icon: 'user' as const, onPress: mockMenuPress },
  { label: 'Theme', description: 'Current theme: Light', icon: 'sliders' as const, onPress: mockMenuPress },
  { label: 'About', icon: 'info' as const, onPress: mockMenuPress },
  { label: 'Erase all data', icon: 'trash-2' as const, destructive: true, onPress: mockMenuPress },
];
let mockDetectionEnabled = false;
let mockStatus: TransactionDetectionStatusInfo = getTransactionDetectionStatus({
  supported: true,
  enabled: false,
  listenerGranted: false,
  notificationPermission: 'denied',
  pendingDraftCount: 0,
});
const mockUpdateMeta = jest.fn(async (_patch: unknown) => ({}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useIsFocused: () => true,
  usePathname: () => '/settings',
}));
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('SafeAreaView', props, children),
  };
});
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
  useAppActions: () => mockActions,
}));
jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: { devActions: undefined }) => unknown) => selector({ devActions: undefined }),
    { getState: () => ({ lastError: null }) },
  ),
  metaStore: {
    getMeta: async () => ({
      transactionDetection: {
        enabled: mockDetectionEnabled,
        allowedPackages: [],
        pendingDrafts: [],
        recentFingerprints: [],
      },
    }),
    updateMeta: (patch: unknown) => mockUpdateMeta(patch),
    subscribe: () => () => undefined,
  },
}));
jest.mock('../../data/metaStore', () => {
  const actual = jest.requireActual('../../data/metaStore');
  return {
    ...actual,
    createMetaStore: () => ({ getMeta: async () => ({}), updateMeta: async () => ({}) }),
  };
});
jest.mock('../../components/useAppMenu', () => ({
  useAppMenu: () => mockMenuItems,
}));
jest.mock('../../lib/confirm', () => ({ choiceAsync: async () => null, confirmAsync: async () => true }));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-10' }));
jest.mock('../../lib/transactionDetectionStatus', () => {
  const actual = jest.requireActual('../../lib/transactionDetectionStatus');
  return {
    ...actual,
    loadTransactionDetectionStatus: jest.fn(async () => mockStatus),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return {
      colors: themes.light.colors,
      isDark: themes.light.isDark,
      themeId: 'light',
      setThemeId: jest.fn(),
    };
  },
}));

describe('Settings screen and Home gear entry point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDetectionEnabled = false;
    mockMenuItems = [
      { label: 'Backup and restore', icon: 'download', onPress: mockMenuPress },
      { label: 'Reminders', icon: 'calendar', onPress: mockMenuPress },
      { label: 'Security', icon: 'lock', onPress: mockMenuPress },
      { label: 'Profile', icon: 'user', onPress: mockMenuPress },
      { label: 'Theme', description: 'Current theme: Light', icon: 'sliders', onPress: mockMenuPress },
      { label: 'About', icon: 'info', onPress: mockMenuPress },
      { label: 'Erase all data', icon: 'trash-2', destructive: true, onPress: mockMenuPress },
    ];
  });

  it('replaces Home three-dot menu with a Settings gear button that opens /settings', async () => {
    mockStatus = getTransactionDetectionStatus({
      supported: true,
      enabled: false,
      listenerGranted: false,
      notificationPermission: 'denied',
      pendingDraftCount: 0,
    });
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<HomeScreen />);
    });
    expect(tree.root.findAllByProps({ accessibilityLabel: 'More options' })).toHaveLength(0);
    const gear = tree.root.findByProps({ accessibilityLabel: 'Settings' });
    await act(async () => {
      gear.props.onPress();
    });
    expect(router.push).toHaveBeenCalledWith('/settings');
  }, 15000);

  it('renders all useAppMenu items (including dev items when present) in Settings', async () => {
    mockMenuItems.push({ label: 'Load demo data (6 months)', icon: 'database', onPress: mockMenuPress });
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SettingsScreen />);
    });
    for (const label of [
      'Backup and restore',
      'Reminders',
      'Security',
      'Profile',
      'Theme, Current theme: Light',
      'About',
      'Load demo data (6 months)',
      'Erase all data',
    ]) {
      const row = tree.root.findByProps({ accessibilityLabel: label });
      await act(async () => {
        row.props.onPress();
      });
    }
    expect(mockMenuPress).toHaveBeenCalledTimes(8);
  });

  it('shows accurate detection states in Settings and supports disabling detection', async () => {
    const supportedSpy = jest.spyOn(notificationListenerAdapter, 'isSupported').mockReturnValue(true);
    const configSpy = jest.spyOn(notificationListenerAdapter, 'setDetectionConfig').mockResolvedValue();
    mockDetectionEnabled = true;
    mockStatus = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });

    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SettingsScreen />);
    });
    const statusText = tree.root.findByProps({ testID: 'settings-detection-status' });
    expect(statusText.props.children.join('')).toContain('Enabled');

    const switchControl = tree.root.findByProps({ accessibilityLabel: 'Automatically detect transactions' });
    await act(async () => {
      switchControl.props.onValueChange(false);
    });
    expect(mockUpdateMeta).toHaveBeenCalled();
    expect(configSpy).toHaveBeenCalledWith(false, []);

    mockStatus = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: false,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });
    await act(async () => {
      tree = TestRenderer.create(<SettingsScreen />);
    });
    expect(tree.root.findByProps({ accessibilityLabel: 'Grant Android Notification Access' })).toBeTruthy();

    mockStatus = getTransactionDetectionStatus({
      supported: false,
      enabled: false,
      listenerGranted: false,
      notificationPermission: 'denied',
      pendingDraftCount: 0,
    });
    await act(async () => {
      tree = TestRenderer.create(<SettingsScreen />);
    });
    expect(tree.root.findByProps({ testID: 'settings-detection-status' }).props.children.join('')).toContain(
      'Unavailable on iOS',
    );
    supportedSpy.mockRestore();
    configSpy.mockRestore();
  });
});
