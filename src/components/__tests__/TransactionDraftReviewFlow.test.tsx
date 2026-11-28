import { router } from 'expo-router';
import React from 'react';
import { AppState } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionFormScreen from '../../../app/transaction-form';
import { NotificationResponseHandler, TransactionDetectionRuntime } from '../ReminderRuntime';
import { emptyAppData } from '../../domain/actions';
import { buildSourceAppPickerItems, isTrustedSourcePackage } from '../../domain/transactionDetection';
import { notificationListenerAdapter } from '../../lib/notificationListener';
import { reminderNotificationAdapter } from '../../lib/reminderNotifications';
import { removeTransactionDraft } from '../../lib/transactionDetectionDrafts';

const mockAddTransaction = jest.fn();
const mockConfirmAsync = jest.fn(async (_opts?: unknown) => false);
let mockLastError: string | null = null;
let mockPathname = '/(tabs)/transactions';
let mockCanGoBack = true;
let mockParams: Record<string, string> = {};
let mockData = {
  ...emptyAppData('2026-11-28'),
  transactions: [] as ReturnType<typeof emptyAppData>['transactions'],
};

const sampleDraft = {
  id: 'draft-1',
  type: 'expense' as const,
  amount: 450,
  date: '2026-11-28',
  suggestedNote: 'Coffee House',
  sourcePackage: 'com.google.android.apps.nbu.paisa.user',
  confidence: 'high' as const,
  fingerprint: 'fp-1',
  createdAtMs: 1700000000000,
  expiresAtMs: 1700604800000,
};

let mockListenerCallback: ((event: { packageName: string; title: string; text: string; postedAtMs: number }) => void) | null = null;
let mockResponseCallback: ((response: { identifier: string; data: unknown }) => void) | null = null;

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => mockCanGoBack,
  },
  useLocalSearchParams: () => mockParams,
  usePathname: () => mockPathname,
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
jest.mock('../SecurityProvider', () => ({
  useSecuritySettings: () => ({ settings: { hidePreviews: false } }),
}));
jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
  useAppActions: () => ({
    addTransaction: (input: Record<string, unknown>) => {
      mockAddTransaction(input);
      if (!mockLastError) {
        mockData = {
          ...mockData,
          transactions: [
            ...mockData.transactions,
            {
              id: 'tx-saved-1',
              type: input.type as 'expense',
              amount: input.amount as number,
              category: input.category as string,
              date: input.date as string,
              note: (input.note as string) ?? '',
            },
          ],
        };
      }
    },
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    deleteLinkedTransaction: jest.fn(),
  }),
}));
jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: { data: typeof mockData; status: string; lastError: string | null }) => unknown) =>
      selector({ data: mockData, status: 'ready', lastError: mockLastError }),
    { getState: () => ({ data: mockData, status: 'ready', lastError: mockLastError }) },
  ),
  metaStore: {
    getMeta: jest.fn(async () => ({
      transactionDetection: {
        enabled: true,
        disclosureAcceptedAt: '2026-11-28T00:00:00.000Z',
        allowedPackages: ['com.google.android.apps.nbu.paisa.user'],
        pendingDrafts: [sampleDraft],
        seenFingerprints: [],
      },
    })),
    updateMeta: jest.fn(async () => ({})),
    subscribe: () => () => undefined,
  },
}));
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (opts: unknown) => mockConfirmAsync(opts),
}));
jest.mock('../../lib/clock', () => ({ todayISO: () => '2026-11-28' }));
jest.mock('../../lib/transactionDetectionDrafts', () => ({
  removeTransactionDraft: jest.fn(async () => undefined),
}));
jest.mock('../../lib/transactionDetectionRuntime', () => {
  const actual = jest.requireActual('../../lib/transactionDetectionRuntime');
  return {
    ...actual,
    ensureTransactionDraftNotificationCategory: jest.fn(async () => undefined),
    syncNativeDetectionConfig: jest.fn(async () => undefined),
    ingestDetectedNotifications: jest.fn(async () => ({
      detection: { pendingDrafts: [sampleDraft] },
      addedDrafts: [sampleDraft],
    })),
    postGenericDraftReviewNotification: jest.fn(async () => undefined),
  };
});
jest.mock('../../lib/reminderNotifications', () => ({
  reminderNotificationAdapter: {
    getPermissionState: jest.fn(async () => 'granted'),
    addResponseListener: jest.fn((cb: (r: { identifier: string; data: unknown }) => void) => {
      mockResponseCallback = cb;
      return () => undefined;
    }),
    getLastResponse: jest.fn(async () => null),
    clearLastResponse: jest.fn(async () => undefined),
  },
}));
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

describe('P35-C-R3 direct draft modal review flow and source-app picker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLastError = null;
    mockPathname = '/(tabs)/transactions';
    mockCanGoBack = true;
    mockParams = {};
    mockListenerCallback = null;
    mockResponseCallback = null;
    mockData = { ...emptyAppData('2026-11-28'), transactions: [] };
  });

  it('opens /transaction-form directly on foreground detection and avoids stacking when already on /transaction-form', async () => {
    const drainSpy = jest.spyOn(notificationListenerAdapter, 'drainQueuedEvents').mockResolvedValue([]);
    const subSpy = jest.spyOn(notificationListenerAdapter, 'subscribeLiveEvents').mockImplementation((cb) => {
      mockListenerCallback = cb;
      return () => undefined;
    });
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });

    await act(async () => {
      TestRenderer.create(<TransactionDetectionRuntime />);
    });

    await act(async () => {
      mockListenerCallback?.({
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid Rs. 450',
        text: 'Paid Rs. 450 to Coffee House',
        postedAtMs: 1700000000000,
      });
    });

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/transaction-form',
        params: expect.objectContaining({
          draftId: 'draft-1',
          type: 'expense',
          amount: '450',
          sourcePackage: 'com.google.android.apps.nbu.paisa.user',
        }),
      }),
    );

    jest.clearAllMocks();
    mockPathname = '/transaction-form';
    await act(async () => {
      TestRenderer.create(<TransactionDetectionRuntime />);
    });
    await act(async () => {
      mockListenerCallback?.({
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid Rs. 120',
        text: 'Paid Rs. 120 to Tea Stall',
        postedAtMs: 1700000001000,
      });
    });
    expect(router.push).not.toHaveBeenCalled();

    drainSpy.mockRestore();
    subSpy.mockRestore();
  });

  it('routes background notification tap directly to /transaction-form', async () => {
    await act(async () => {
      TestRenderer.create(<NotificationResponseHandler />);
    });

    await act(async () => {
      mockResponseCallback?.({
        identifier: 'notif-1',
        data: { type: 'wealthwise-transaction-draft', draftId: 'draft-1' },
      });
    });

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/transaction-form',
        params: expect.objectContaining({
          draftId: 'draft-1',
          amount: '450',
        }),
      }),
    );
    expect(reminderNotificationAdapter.clearLastResponse).toHaveBeenCalled();
  });

  it('Dismiss closes /transaction-form without saving and retains draft; Save removes draft only after save succeeds', async () => {
    mockParams = {
      draftId: 'draft-1',
      type: 'expense',
      category: 'Food',
      amount: '450',
      date: '2026-11-28',
      note: 'Coffee House',
      sourcePackage: 'com.google.android.apps.nbu.paisa.user',
    };
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TransactionFormScreen />);
    });

    const dismissBtn = tree.root.findByProps({ accessibilityLabel: 'Dismiss draft' });
    await act(async () => {
      dismissBtn.props.onPress();
    });
    expect(mockAddTransaction).not.toHaveBeenCalled();
    expect(removeTransactionDraft).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    mockCanGoBack = false;
    const saveBtn = tree.root.findByProps({ accessibilityLabel: 'Save transaction' });
    await act(async () => {
      saveBtn.props.onPress();
    });
    expect(mockAddTransaction).toHaveBeenCalledTimes(1);
    expect(removeTransactionDraft).toHaveBeenCalledWith('draft-1');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('marks only verified catalogue packages Trusted and keeps lookalike unverified packages Unverified', () => {
    expect(isTrustedSourcePackage('com.google.android.apps.nbu.paisa.user')).toBe(true);
    expect(isTrustedSourcePackage('com.fake.gpay.clone')).toBe(false);

    const items = buildSourceAppPickerItems({
      installedPackages: ['com.google.android.apps.nbu.paisa.user'],
      observedApps: [{ packageName: 'com.fake.gpay.clone', label: 'Google Pay' }],
      allowedPackages: ['com.google.android.apps.nbu.paisa.user'],
      query: 'google pay',
    });

    const real = items.find((i) => i.packageName === 'com.google.android.apps.nbu.paisa.user');
    const lookalike = items.find((i) => i.packageName === 'com.fake.gpay.clone');
    expect(real?.trusted).toBe(true);
    expect(real?.installed).toBe(true);
    expect(lookalike?.trusted).toBe(false);
    expect(lookalike?.observed).toBe(true);
  });

  it('opens /transaction-form directly when queued background events are drained while active', async () => {
    const drainSpy = jest.spyOn(notificationListenerAdapter, 'drainQueuedEvents').mockResolvedValueOnce([
      {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Paid ₹450 to Coffee House',
        text: 'Debited ₹450 from A/C XX1234',
        postedAtMs: 1700000000000,
      },
    ]);
    mockPathname = '/(tabs)/transactions';
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });

    await act(async () => {
      TestRenderer.create(<TransactionDetectionRuntime />);
    });
    drainSpy.mockRestore();

    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/transaction-form',
        params: expect.objectContaining({
          type: 'expense',
          amount: '450',
          sourcePackage: 'com.google.android.apps.nbu.paisa.user',
        }),
      }),
    );
  });

  it('hydrates the newest pending draft when opened via reviewLatest=1 from native notification', async () => {
    const prevData = mockData;
    const { buildDemoData } = jest.requireActual('../../mock/demoData') as typeof import('../../mock/demoData');
    mockData = buildDemoData('2026-11-28');
    mockParams = { reviewLatest: '1' };
    try {
      let tree!: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(<TransactionFormScreen />);
        await Promise.resolve();
        await Promise.resolve();
      });

      const treeText = JSON.stringify(tree.toJSON());
      expect(treeText).toContain('Google Pay');
      expect(treeText).toContain('Trusted');
      expect(treeText).toContain('450');
      expect(treeText).toContain('Coffee House');
      const saveBtn = tree.root.findByProps({ accessibilityLabel: 'Save transaction' });
      await act(async () => {
        saveBtn.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(JSON.stringify(tree.toJSON())).not.toContain('Fix ');
      expect(mockAddTransaction).toHaveBeenCalledTimes(1);
      expect(removeTransactionDraft).toHaveBeenCalledWith('draft-1');
    } finally {
      mockData = prevData;
    }
  });
});
