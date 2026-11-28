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
    getMeta: jest.fn(async () => ({})),
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
    let iosHomeTree!: TestRenderer.ReactTestRenderer;
    let iosTree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      iosHomeTree = TestRenderer.create(<HomeScreen />);
      iosTree = TestRenderer.create(<TransactionsScreen />);
    });
    expect(iosHomeTree.root.findAllByProps({ testID: 'home-transaction-detection-entry' })).toHaveLength(0);
    expect(iosTree.root.findAllByProps({ testID: 'transaction-detection-entry' })).toHaveLength(0);
  }, 15000);

  it('hides Home and Transactions entry points while detection is enabled', async () => {
    mockCurrentStatus = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'granted',
      pendingDraftCount: 1,
    });
    let homeTree!: TestRenderer.ReactTestRenderer;
    let txTree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      homeTree = TestRenderer.create(<HomeScreen />);
      txTree = TestRenderer.create(<TransactionsScreen />);
    });
    expect(homeTree.root.findAllByProps({ testID: 'home-transaction-detection-entry' })).toHaveLength(0);
    expect(txTree.root.findAllByProps({ testID: 'transaction-detection-entry' })).toHaveLength(0);
  });

  it('renders Pending review drafts on Transactions on Android with Review & add and Discard', async () => {
    const { Platform } = jest.requireActual('react-native') as typeof import('react-native');
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const { metaStore } = jest.requireMock('../../data/store') as {
      metaStore: { getMeta: jest.Mock };
    };
    metaStore.getMeta.mockResolvedValueOnce({
      transactionDetection: {
        enabled: true,
        allowedPackages: ['com.google.android.apps.nbu.paisa.user'],
        pendingDrafts: [
          {
            id: 'draft-tx-1',
            type: 'expense',
            amount: 240,
            date: '2026-11-28',
            suggestedNote: 'Tea House',
            sourcePackage: 'com.google.android.apps.nbu.paisa.user',
            confidence: 'high',
            fingerprint: 'fp-tx-1',
            createdAtMs: 1700000000000,
            expiresAtMs: 1700604800000,
          },
        ],
        seenFingerprints: [],
      },
    });
    try {
      let txTree!: TestRenderer.ReactTestRenderer;
      await act(async () => {
        txTree = TestRenderer.create(<TransactionsScreen />);
      });
      const section = txTree.root.findByProps({ testID: 'transactions-pending-drafts' });
      expect(JSON.stringify(txTree.toJSON())).toContain('Tea House');
      const reviewBtn = section.findByProps({ accessibilityLabel: 'Review & add' });
      await act(async () => {
        reviewBtn.props.onPress();
      });
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/transaction-form',
          params: expect.objectContaining({ draftId: 'draft-tx-1', amount: '240' }),
        }),
      );
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });
});
