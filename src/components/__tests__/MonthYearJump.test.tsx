import { router } from 'expo-router';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import BudgetScreen from '../../../app/(tabs)/budget';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { emptyAppData } from '../../domain/actions';
import { isMonthWithinBounds, MonthYearPicker, parseMonthParts } from '../MonthYearPicker';
import { useUIStore } from '../../data/uiStore';

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
  applyBudgetPlan: jest.fn(),
  restoreMonthBudget: jest.fn(),
  markPaid: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({}),
  usePathname: () => '/(tabs)/transactions',
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
    (selector: (state: { devActions: undefined; lastError: null }) => unknown) =>
      selector({ devActions: undefined, lastError: null }),
    { getState: () => ({ lastError: null, data: mockData }) },
  ),
  metaStore: {
    getMeta: async () => ({}),
    updateSortSpec: async () => ({}),
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
jest.mock('../../data/useSort', () => ({
  useSort: () => ({
    spec: { key: 'date', dir: 'desc' },
    sort: (items: unknown[]) => items,
    setSort: jest.fn(),
  }),
}));
jest.mock('../../lib/confirm', () => ({ choiceAsync: async () => null, confirmAsync: async () => true }));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-10' }));
jest.mock('../../lib/transactionDetectionStatus', () => ({
  loadTransactionDetectionStatus: jest.fn(async () => ({
    status: 'enabled',
    label: 'Enabled',
    description: 'Listening',
    actionLabel: 'Settings',
    pendingDraftCount: 0,
  })),
}));
jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title) };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
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

describe('Month/year jump selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUIStore.getState().setTxMonth('2026-10');
  });

  it('validates month parts and bounds', () => {
    expect(parseMonthParts('2024-03')).toEqual({ year: 2024, month: '03' });
    expect(isMonthWithinBounds('2028-10', undefined, '2028-10')).toBe(true);
    expect(isMonthWithinBounds('2028-11', undefined, '2028-10')).toBe(false);
    expect(isMonthWithinBounds('2020-01', undefined, '2028-10')).toBe(true);
  });

  it('jumps to a historical empty month on Transactions while keeping prev/next controls working', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TransactionsScreen />);
    });

    const selector = tree.root.findByProps({ testID: 'transactions-month-selector' });
    await act(async () => {
      selector.props.onPress();
    });

    const prevYear = tree.root.findByProps({ accessibilityLabel: 'Previous year' });
    await act(async () => {
      prevYear.props.onPress();
    });
    const march2025 = tree.root.findByProps({ testID: 'month-option-2025-03' });
    await act(async () => {
      march2025.props.onPress();
    });

    expect(useUIStore.getState().txMonth).toBe('2025-03');
    expect(router.setParams).toHaveBeenCalledWith({ month: '2025-03' });
    expect(tree.root.findByProps({ testID: 'transactions-month-selector' }).props.accessibilityLabel).toBe(
      'Selected month: March 2025',
    );

    const nextBtn = tree.root.findByProps({ accessibilityLabel: 'Next month' });
    await act(async () => {
      nextBtn.props.onPress();
    });
    expect(useUIStore.getState().txMonth).toBe('2025-04');
  });

  it('respects Budget 24-month forward bound and jumps to a valid future or historical month', async () => {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<BudgetScreen />);
    });

    const selector = tree.root.findByProps({ testID: 'budget-month-selector' });
    await act(async () => {
      selector.props.onPress();
    });

    const nextYear = tree.root.findByProps({ accessibilityLabel: 'Next year' });
    await act(async () => {
      nextYear.props.onPress();
    });
    await act(async () => {
      nextYear.props.onPress();
    });
    // 2028-10 is the 24-month bound from 2026-10; 2028-11 is disabled
    expect(tree.root.findByProps({ testID: 'month-option-2028-11' }).props.accessibilityState.disabled).toBe(true);
    const oct2028 = tree.root.findByProps({ testID: 'month-option-2028-10' });
    expect(oct2028.props.accessibilityState.disabled).toBe(false);
    await act(async () => {
      oct2028.props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'budget-month-selector' }).props.accessibilityLabel).toContain(
      'October 2028',
    );
  });

  it('calls onSelect only for in-bounds months in MonthYearPicker', async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <MonthYearPicker
          visible
          month="2028-10"
          maxMonth="2028-10"
          onSelect={onSelect}
          onClose={onClose}
        />,
      );
    });
    await act(async () => {
      tree.root.findByProps({ testID: 'month-option-2028-11' }).props.onPress();
    });
    expect(onSelect).not.toHaveBeenCalled();

    await act(async () => {
      tree.root.findByProps({ testID: 'month-option-2028-09' }).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('2028-09');
    expect(onClose).toHaveBeenCalled();
  });
});
