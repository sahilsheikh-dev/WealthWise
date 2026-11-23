import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import BudgetScreen from '../../../app/(tabs)/budget';
import { todayISO } from '../../lib/clock';
import { monthBudgetFromLines } from '../../testFixtures/budget';

let mockFontScale = 1;
const mockCurrentMonth = todayISO().slice(0, 7);

const mockData = {
  settings: { name: 'Test', theme: 'light' as const, monthlySalary: null, onboarded: true },
  transactions: [
    { id: 't1', type: 'expense' as const, amount: 800, category: 'Food', note: '', date: `${mockCurrentMonth}-05` },
    { id: 't2', type: 'expense' as const, amount: 200, category: 'Utilities', note: '', date: `${mockCurrentMonth}-06` },
    { id: 't3', type: 'expense' as const, amount: 1500, category: 'Rent', note: '', date: `${mockCurrentMonth}-07` },
  ],
  goals: [],
  holdings: [
    {
      id: 'h1',
      name: 'Nifty 50 Index',
      kind: 'plan' as const,
      type: 'Mutual fund / SIP',
      currency: 'INR',
      initialValue: 50000,
      createdAt: `${mockCurrentMonth}-01`,
      trackFrom: `${mockCurrentMonth}-01`,
      entries: [],
      logs: [],
      cadence: 'monthly' as const,
      dayOfMonth: 10,
      amount: 5000,
      status: 'active' as const,
    },
  ],
  liabilities: [
    {
      id: 'l1',
      name: 'Car Loan',
      kind: 'recurring' as const,
      type: 'Auto',
      principal: 300000,
      rate: 9,
      termMonths: 36,
      startDate: `${mockCurrentMonth}-01`,
      emi: 9500,
      dueDay: 5,
      entries: [],
      payments: [],
      settlement: null,
    },
  ],
  policies: [],
  budgetPlan: null,
  monthBudgets: [
    {
      ...monthBudgetFromLines(mockCurrentMonth, [
        { category: 'Utilities', planned: 300 },
        { category: 'Rent', planned: 2000 },
        { category: 'Food', planned: 1000 },
        { category: 'Shopping', planned: 500 },
      ], {
        incomes: [
          { id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 8000 },
        ],
      }),
      sections: [
        { id: 'survival', name: 'Survival (Needs)', type: 'spend' as const },
        { id: 'wants', name: 'Wants', type: 'spend' as const },
        { id: 'savings-investments', name: 'Savings and Investments', type: 'invest' as const },
        { id: 'debt-repayments', name: 'Debt repayments', type: 'spend' as const, system: 'debt' as const },
        { id: 'income', name: 'Income', type: 'spend' as const, system: 'income' as const },
        { id: 'sec-custom', name: 'Freelance Expenses', type: 'spend' as const },
      ],
      items: [
        { id: 'item-rent', sectionId: 'survival', name: 'Rent', mode: 'amount' as const, value: 2000 },
        { id: 'item-food', sectionId: 'survival', name: 'Food', mode: 'amount' as const, value: 1000 },
        { id: 'item-util', sectionId: 'survival', name: 'Utilities', mode: 'amount' as const, value: 300 },
        { id: 'item-shop', sectionId: 'wants', name: 'Shopping', mode: 'amount' as const, value: 500 },
        { id: 'item-custom', sectionId: 'sec-custom', name: 'Software Subscriptions', mode: 'amount' as const, value: 400 },
      ],
    },
  ],
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ month: mockCurrentMonth })),
  usePathname: jest.fn(() => '/(tabs)/budget'),
}));

jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: { data: typeof mockData; lastError: string | null; actions: { undoImport: jest.Mock }; devActions: object }) => unknown) =>
      selector({ data: mockData, lastError: null, actions: { undoImport: jest.fn() }, devActions: {} }),
    {
      getState: () => ({ data: mockData, lastError: null, actions: { undoImport: jest.fn() }, devActions: {} }),
    },
  ),
  metaStore: {
    getMeta: jest.fn().mockResolvedValue({}),
    updateSortSpec: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
  useAppActions: () => ({}),
}));

jest.mock('../../data/uiStore', () => ({
  useUIStore: (selector: (state: { setActionToast: jest.Mock }) => unknown) =>
    selector({ setActionToast: jest.fn() }),
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../../theme/themes');
    return { colors: themes.light.colors, themeId: 'light', resolvedId: 'light', isDark: false, statusBar: 'dark' };
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('safeareaview', props, children),
  };
});

jest.mock('@expo/vector-icons', () => ({ Feather: () => null, Ionicons: () => null }));

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof import('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Alert: { alert: jest.fn() },
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Text: node('text'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: mockFontScale, width: 390, height: 844, scale: 1 }),
    PanResponder: { create: () => ({ panHandlers: {} }) },
  };
});

describe('P20-Z: Dynamic Budget category filter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category filter chips alongside SortChip in budget-filter-panel defaulting to "All"', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BudgetScreen />);
    });
    if (!renderer) throw new Error('Renderer not initialized');

    // Open filter panel
    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    expect(panel).toBeDefined();

    // Verify SortChip is present
    const sortChip = panel.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Sort:'),
    );
    expect(sortChip.length).toBeGreaterThanOrEqual(1);

    // Verify category chips are rendered
    const chips = panel.findAllByProps({ accessibilityRole: 'button' })
      .filter((node) => node.props.accessibilityLabel !== 'Filter' && !node.props.accessibilityLabel?.startsWith('Sort:'));

    const chipLabels = chips.map((c) => c.props.accessibilityLabel);
    expect(chipLabels).toContain('All');
    expect(chipLabels).toContain('Income');
    expect(chipLabels).toContain('Expenses');
    expect(chipLabels).toContain('Needs');
    expect(chipLabels).toContain('Wants');
    expect(chipLabels).toContain('Debt');
    expect(chipLabels).toContain('Assets');
    expect(chipLabels).toContain('Liabilities');

    // "All" should be selected by default
    const allChip = chips.find((c) => c.props.accessibilityLabel === 'All');
    expect(allChip?.props.accessibilityState).toEqual({ selected: true });
  });

  it('automatically includes newly created categories in the filter chips', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BudgetScreen />);
    });
    if (!renderer) throw new Error('Renderer not initialized');

    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    const chips = panel.findAllByProps({ accessibilityRole: 'button' })
      .filter((node) => !node.props.accessibilityLabel?.startsWith('Sort:'));
    const chipLabels = chips.map((c) => c.props.accessibilityLabel);

    // Newly created category "Freelance Expenses" should be included
    expect(chipLabels).toContain('Freelance Expenses');
  });

  it('filters visible budget sections when category chips are selected', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BudgetScreen />);
    });
    if (!renderer) throw new Error('Renderer not initialized');

    // Open filter panel
    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    const chips = panel.findAllByProps({ accessibilityRole: 'button' });

    // 1. Select "Income"
    const incomeChip = chips.find((c) => c.props.accessibilityLabel === 'Income');
    expect(incomeChip).toBeDefined();
    act(() => {
      incomeChip?.props.onPress();
    });

    let sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    let visibleSectionIds = sectionList.findAll((node) =>
      node.type === 'view' && typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    ).map((n) => n.props.testID);

    expect(visibleSectionIds).toEqual(['budget-section-header-income']);

    // 2. Select "Needs"
    const needsChip = chips.find((c) => c.props.accessibilityLabel === 'Needs');
    expect(needsChip).toBeDefined();
    act(() => {
      needsChip?.props.onPress();
    });

    sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    visibleSectionIds = sectionList.findAll((node) =>
      node.type === 'view' && typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    ).map((n) => n.props.testID);

    expect(visibleSectionIds).toEqual(['budget-section-header-survival']);

    // 3. Select "Wants"
    const wantsChip = chips.find((c) => c.props.accessibilityLabel === 'Wants');
    act(() => {
      wantsChip?.props.onPress();
    });

    sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    visibleSectionIds = sectionList.findAll((node) =>
      node.type === 'view' && typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    ).map((n) => n.props.testID);

    expect(visibleSectionIds).toEqual(['budget-section-header-wants']);

    // 4. Select "Freelance Expenses" (custom category)
    const customChip = chips.find((c) => c.props.accessibilityLabel === 'Freelance Expenses');
    act(() => {
      customChip?.props.onPress();
    });

    sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    visibleSectionIds = sectionList.findAll((node) =>
      node.type === 'view' && typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    ).map((n) => n.props.testID);

    expect(visibleSectionIds).toEqual(['budget-section-header-sec-custom']);

    // 5. Select "All" again
    const allChip = chips.find((c) => c.props.accessibilityLabel === 'All');
    act(() => {
      allChip?.props.onPress();
    });

    sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    visibleSectionIds = sectionList.findAll((node) =>
      node.type === 'view' && typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    ).map((n) => n.props.testID);

    expect(visibleSectionIds.length).toBeGreaterThan(1);
    expect(visibleSectionIds).toContain('budget-section-header-income');
    expect(visibleSectionIds).toContain('budget-section-header-survival');
  });

  it('shows filter indicator on AppHeader filter action when a category filter is active', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BudgetScreen />);
    });
    if (!renderer) throw new Error('Renderer not initialized');

    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    // Initially "All" is active, so filter indicator is false and no dot is rendered
    expect(filterButton.props.accessibilityState).toEqual({ expanded: false });
    expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

    // Open filter panel
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    const needsChip = panel.findAllByProps({ accessibilityRole: 'button' })
      .find((c) => c.props.accessibilityLabel === 'Needs');

    // Select "Needs"
    act(() => {
      needsChip?.props.onPress();
    });

    // Close panel
    act(() => {
      filterButton.props.onPress();
    });

    // Filter indicator dot should now be active
    const updatedFilterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    expect(updatedFilterButton.props.accessibilityState).toEqual({ expanded: false });
    expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(1);

    // Reopen panel and select "All"
    act(() => {
      updatedFilterButton.props.onPress();
    });
    const reopenedPanel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    const allChip = reopenedPanel.findAllByProps({ accessibilityRole: 'button' })
      .find((c) => c.props.accessibilityLabel === 'All');
    act(() => {
      allChip?.props.onPress();
    });
    act(() => {
      updatedFilterButton.props.onPress();
    });

    // Filter indicator dot should be removed (clean filter icon like other screens)
    expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
  });
});
