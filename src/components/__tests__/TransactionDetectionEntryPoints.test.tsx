import { router } from 'expo-router';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import HomeScreen from '../../../app/(tabs)';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { emptyAppData } from '../../domain/actions';
import {
  getTransactionDetectionStatus,
  loadTransactionDetectionStatus,
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

let mockCurrentStatus: TransactionDetectionStatusInfo = getTransactionDetectionStatus({
  supported: true,
  enabled: false,
  listenerGranted: false,
  notificationPermission: 'denied',
  pendingDraftCount: 0,
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('SafeAreaView', props, children),
  };
});
jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title) };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'denied', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied', canAskAgain: true })),
  setNotificationChannelAsync: jest.fn(async () => null),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
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
    getMeta: async () => ({}),
    updateSortSpec: async () => ({}),
  },
}));
jest.mock('../../data/metaStore', () => ({
  createMetaStore: () => ({ getMeta: async () => ({}), updateMeta: async () => ({}) }),
}));
jest.mock('../../data/useSort', () => ({
  useSort: () => ({
    spec: { key: 'date', dir: 'desc' },
    sort: (items: unknown[]) => items,
    setSort: jest.fn(),
  }),
}));
jest.mock('../../lib/confirm', () => ({ choiceAsync: async () => null, confirmAsync: async () => true }));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-10' }));
jest.mock('../../lib/transactionDetectionStatus', () => {
  const actual = jest.requireActual('../../lib/transactionDetectionStatus');
  return {
    ...actual,
    loadTransactionDetectionStatus: jest.fn(async () => mockCurrentStatus),
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

describe('Home & Transactions auto-detection entry points', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Home entry point with Not set up status and navigates to /transaction-detection', async () => {
    mockCurrentStatus = getTransactionDetectionStatus({
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
    expect(loadTransactionDetectionStatus).toHaveBeenCalled();
    const entry = tree.root.findByProps({ testID: 'home-transaction-detection-entry' });
    expect(entry.props.accessibilityLabel).toContain('Automatically detect transactions: Not set up');
    await act(async () => {
      entry.props.onPress();
    });
    expect(router.push).toHaveBeenCalledWith('/transaction-detection');
  }, 15000);

  it('renders Transactions entry point with revoked Notification access needed and iOS Unavailable states', async () => {
    mockCurrentStatus = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: false,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TransactionsScreen />);
    });
    const entry = tree.root.findByProps({ testID: 'transaction-detection-entry' });
    expect(entry.props.accessibilityLabel).toContain('Notification access needed');

    mockCurrentStatus = getTransactionDetectionStatus({
      supported: false,
      enabled: false,
      listenerGranted: false,
      notificationPermission: 'denied',
      pendingDraftCount: 0,
    });
    let iosTree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      iosTree = TestRenderer.create(<TransactionsScreen />);
    });
    const iosEntry = iosTree.root.findByProps({ testID: 'transaction-detection-entry' });
    expect(iosEntry.props.accessibilityLabel).toContain('Unavailable on iOS');
    await act(async () => {
      iosEntry.props.onPress();
    });
    expect(router.push).toHaveBeenCalledWith('/transaction-detection');
  }, 15000);
});
