import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import HomeScreen, { HOME_QUICK_ACTIONS } from '../../../app/(tabs)';
import GoalsScreen from '../../../app/(tabs)/goals';
import { useUIStore } from '../../data/uiStore';
import { emptyAppData } from '../../domain/actions';
import { createDefaultBudgetPlan } from '../../domain/budget';
import { THEME_IDS, type ThemeId } from '../../domain/types';
import { budgetPlanFromLines } from '../../testFixtures/budget';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

const mockThemeId: { current: ThemeId } = { current: 'system' };
const mockData = { ...emptyAppData('2026-10-10'), settings: { ...emptyAppData('2026-10-10').settings, name: 'Demo' } };
const mockActions = {
  clearDue: jest.fn(),
  clearDuesThrough: jest.fn(),
  undoClearDue: jest.fn(),
  undoClearDuesThrough: jest.fn(),
  saveAndApplyBudgetPlan: jest.fn(),
  restoreBudgetPlanAndMonth: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useIsFocused: () => true,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
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
jest.mock('../../lib/confirm', () => ({ choiceAsync: async () => null, confirmAsync: async () => true }));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-10' }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    const themeId = mockThemeId.current;
    const resolvedId = themeId === 'system' ? 'light' : themeId;
    return {
      colors: themes[resolvedId].colors,
      isDark: themes[resolvedId].isDark,
      themeId,
      resolvedId,
      statusBar: themes[resolvedId].statusBar,
      setTheme: jest.fn(),
    };
  },
}));
jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title) };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    AppText: node('text'),
    Button: node('button'),
    Card: node('card'),
    EmptyState: node('empty'),
    Chip: node('chip'),
    ChipRow: node('chiprow'),
    SearchField: node('searchfield'),
    ProgressBar: node('progress'),
    Screen: node('screen'),
    SectionTitle: node('section'),
    StatPill: node('pill'),
    StatPillRow: node('pillrow'),
    StatusBadge: node('badge'),
    WarningBanner: node('warning'),
  };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Alert: { alert: jest.fn() },
    Modal: node('modal'),
    Pressable: node('pressable'),
    Platform: { OS: 'ios' },
    StyleSheet: { create: (styles: object) => styles },
    Text: node('text'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: 1 }),
  };
});

describe('Home screen theme smoke', () => {
  it('opens a goal editor on the first card tap from Home and Goals', async () => {
    const goal = { id: 'goal-tap', name: 'Trip', target: 50_000, saved: 1_000, year: 2027, links: [] };
    mockData.goals = [goal];
    const expectedRoute = { pathname: '/goal-form', params: { id: goal.id } };
    let home: TestRenderer.ReactTestRenderer | undefined;
    let goals: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      home = TestRenderer.create(<HomeScreen />);
      goals = TestRenderer.create(<GoalsScreen />);
      await Promise.resolve();
    });
    if (!home || !goals) throw new Error('Goal screens did not render.');
    jest.clearAllMocks();

    for (const renderer of [home, goals]) {
      const card = renderer.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.includes('Edit Trip'),
      )[0];
      if (!card) throw new Error('Goal card is not accessible.');
      act(() => card.props.onPress());
      expect(router.push).toHaveBeenLastCalledWith(expectedRoute);
    }
    act(() => {
      home?.unmount();
      goals?.unmount();
    });
    mockData.goals = [];
  });

  it('opens the Emergency fund route from its Home summary pill with one tap', async () => {
    jest.clearAllMocks();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    const emergencyFundPill = renderer.root.findAllByProps({ label: 'Emergency fund' })[0];
    if (!emergencyFundPill) throw new Error('Emergency fund pill did not render.');
    act(() => emergencyFundPill.props.onPress());
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/emergency-fund');
    act(() => renderer?.unmount());
  });

  it('creates a default budget without a plan and routes plan application through Budget', async () => {
    jest.clearAllMocks();
    const previous = { budgetPlan: mockData.budgetPlan, monthBudgets: mockData.monthBudgets };
    mockData.budgetPlan = null;
    mockData.monthBudgets = [];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    const create = renderer.root.findByProps({ accessibilityLabel: 'Create budget' });
    act(() => create.props.onPress());
    expect(mockActions.saveAndApplyBudgetPlan).toHaveBeenCalledTimes(1);
    expect(mockActions.saveAndApplyBudgetPlan).toHaveBeenCalledWith(
      createDefaultBudgetPlan('2026-10'),
      '2026-10',
    );
    expect(router.push).not.toHaveBeenCalled();
    await act(async () => renderer?.unmount());

    mockData.budgetPlan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 1_000 }], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
    });
    mockData.monthBudgets = [];
    jest.mocked(router.push).mockClear();
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    const apply = renderer.root.findByProps({ accessibilityLabel: 'Apply budget' });
    act(() => apply.props.onPress());
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/(tabs)/budget',
      params: { month: '2026-10', apply: '1' },
    });
    await act(async () => renderer?.unmount());
    mockData.budgetPlan = previous.budgetPlan;
    mockData.monthBudgets = previous.monthBudgets;
  });

  it('shows Festival, Donation and Gifts in the current-month Home spending breakdown', async () => {
    const previousTransactions = mockData.transactions;
    mockData.transactions = [
      { id: 'festival', type: 'expense', amount: 1_500, category: 'Festival', note: 'Festival', date: '2026-10-01' },
      { id: 'donation', type: 'expense', amount: 500, category: 'Donation', note: 'Donation', date: '2026-10-02' },
      { id: 'gifts', type: 'expense', amount: 1_000, category: 'Gifts', note: 'Gifts', date: '2026-10-03' },
      { id: 'salary', type: 'income', amount: 50_000, category: 'Festival', note: 'Salary', date: '2026-10-04' },
      { id: 'past-festival', type: 'expense', amount: 5_000, category: 'Festival', note: 'Old festival', date: '2026-09-30' },
    ];
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        renderer = TestRenderer.create(<HomeScreen />);
        await Promise.resolve();
      });
      if (!renderer) throw new Error('Home did not render.');
      expect(renderer.root.findByProps({ testID: 'home-spending-toggle', accessibilityRole: 'button' }).props.accessibilityState)
        .toEqual({ expanded: false });
      act(() => renderer?.root.findByProps({ testID: 'home-spending-toggle', accessibilityRole: 'button' }).props.onPress());
      const visibleText = renderer.root.findAllByType('text').map((node) => node.children.join(' '));
      expect(renderer.root.findByProps({ testID: 'home-spending-toggle', accessibilityRole: 'button' }).props.accessibilityLabel)
        .toBe('Hide spending by category');
      for (const category of ['Festival', 'Donation', 'Gifts']) expect(visibleText).toContain(category);
      for (const amount of ['₹1,500', '₹500', '₹1,000']) expect(visibleText).toContain(amount);
      expect(visibleText).not.toContain('Salary');
      await act(async () => renderer?.unmount());
    } finally {
      mockData.transactions = previousTransactions;
    }
  });

  it('keeps the critical storage warning visible without a dismissal action', async () => {
    act(() => useUIStore.setState({ persistedBytes: 1_600_000 }));
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    expect(renderer.root.findAll((node) => String(node.type) === 'warning')).toHaveLength(1);
    expect(renderer.root.findAllByType('button').filter((node) => node.props.label === 'Open backup')).toHaveLength(1);
    expect(renderer.root.findAllByProps({ label: 'Dismiss for 7 days' })).toHaveLength(0);
    act(() => {
      renderer?.unmount();
      useUIStore.setState({ persistedBytes: null });
    });
  });

  it.each(THEME_IDS)('renders Home with the %s palette', async (id) => {
    mockThemeId.current = id;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    expect(renderer.root.findAllByType('text').map((node) => node.children.join(' '))).toContain('Net Worth');
    expect(new Set(HOME_QUICK_ACTIONS.map((item) => item.icon)).size).toBe(3);
    assertNoVerbText(renderer.root, { screen: 'home' });
    await act(async () => renderer?.unmount());
  });

  it.each([1, 1.3, 2])('renders Home quick actions at font scale %s', async (fontScale) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error(`Home did not render at font scale ${fontScale}.`);
    const quickActionButtons = renderer.root.findAllByType(Pressable).filter((node) =>
      node.props.accessibilityRole === 'button'
      && ['New Transaction', 'New Investment', 'New Liability'].includes(
        node.props.accessibilityLabel,
      ),
    );
    expect(quickActionButtons).toHaveLength(3);
    expect(new Set(HOME_QUICK_ACTIONS.map((action) => action.icon)).size).toBe(3);
    expect(HOME_QUICK_ACTIONS.map((action) => action.label)).toEqual([
      'New Transaction',
      'New Investment',
      'New Liability',
    ]);
    assertNoVerbText(renderer.root, { screen: 'home' });
    act(() => renderer?.unmount());
  });
});
