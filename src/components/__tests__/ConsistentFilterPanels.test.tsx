import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import GoalsScreen from '../../../app/(tabs)/goals';
import AssetsScreen from '../../../app/assets';
import LiabilitiesScreen from '../../../app/liabilities';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import BudgetScreen from '../../../app/(tabs)/budget';
import { todayISO } from '../../lib/clock';
import { monthBudgetFromLines } from '../../testFixtures/budget';

const mockCurrentMonth = todayISO().slice(0, 7);
const asOf = todayISO();
const currentYear = Number(asOf.slice(0, 4));

const mockData = {
  settings: { name: 'Test User', theme: 'light' as const, monthlySalary: 50000, onboarded: true },
  transactions: [
    { id: 't1', type: 'expense' as const, amount: 800, category: 'Food', note: '', date: `${mockCurrentMonth}-05` },
    { id: 't2', type: 'income' as const, amount: 50000, category: 'Salary', note: '', date: `${mockCurrentMonth}-01` },
    { id: 't3', type: 'invest' as const, amount: 5000, category: 'Mutual fund / SIP', note: '', date: `${mockCurrentMonth}-10` },
  ],
  goals: [
    {
      id: 'g1',
      name: 'Emergency Fund',
      target: 150000,
      saved: 150000,
      year: currentYear,
      auto: 'ef' as const,
      links: [],
    },
    {
      id: 'g2',
      name: 'New Car',
      target: 600000,
      saved: 200000,
      year: currentYear + 1,
      links: [],
    },
    {
      id: 'g3',
      name: 'Europe Vacation',
      target: 300000,
      saved: 300000,
      year: currentYear,
      links: [],
    },
    {
      id: 'g4',
      name: 'House Down Payment',
      target: 2000000,
      saved: 500000,
      year: currentYear + 5,
      links: [],
    },
  ],
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
  efCustomBuckets: [],
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
      ], {
        incomes: [
          { id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 8000 },
        ],
      }),
      sections: [
        { id: 'survival', name: 'Survival (Needs)', type: 'spend' as const },
        { id: 'income', name: 'Income', type: 'spend' as const, system: 'income' as const },
      ],
      items: [
        { id: 'item-rent', sectionId: 'survival', name: 'Rent', mode: 'amount' as const, value: 2000 },
        { id: 'item-food', sectionId: 'survival', name: 'Food', mode: 'amount' as const, value: 1000 },
      ],
    },
  ],
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ month: mockCurrentMonth })),
  usePathname: jest.fn(() => '/(tabs)/goals'),
}));

jest.mock('../../data/store', () => ({
  useAppStore: Object.assign(
    (selector: (state: { data: typeof mockData; lastError: string | null; actions: object; devActions: object }) => unknown) =>
      selector({ data: mockData, lastError: null, actions: {}, devActions: {} }),
    {
      getState: () => ({ data: mockData, lastError: null, actions: {}, devActions: {} }),
    },
  ),
  useAppData: () => mockData,
  useAppActions: () => ({}),
}));

jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
  useAppActions: () => ({}),
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

describe('ConsistentFilterPanels and No-Dot Indicator Suite', () => {
  describe('Goals filter panel controls', () => {
    it('renders goal-filter-panel with SortChip, status chips, and dynamic year chips', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<GoalsScreen />);
      });
      if (!renderer) throw new Error('GoalsScreen failed to render');

      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      expect(filterButton.props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel
      act(() => {
        filterButton.props.onPress();
      });

      const panel = renderer.root.findByProps({ testID: 'goal-filter-panel' });
      expect(panel).toBeDefined();

      // Verify SortChip is present
      const sortChip = panel.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Sort:'),
      )[0];
      expect(sortChip).toBeDefined();

      // Verify Status chips
      const chips = panel.findAllByProps({ accessibilityRole: 'button' });
      const chipLabels = chips.map((c) => c.props.accessibilityLabel);
      expect(chipLabels).toContain('All');
      expect(chipLabels).toContain('In progress');
      expect(chipLabels).toContain('Achieved');

      // Verify dynamic year chips from mockData.goals
      expect(chipLabels).toContain(String(currentYear));
      expect(chipLabels).toContain(String(currentYear + 1));
      expect(chipLabels).toContain(String(currentYear + 5));
    });

    it('filters goals by In progress status and excludes achieved goals', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<GoalsScreen />);
      });
      if (!renderer) throw new Error('GoalsScreen failed to render');

      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      act(() => { filterButton.props.onPress(); });

      const panel = renderer.root.findByProps({ testID: 'goal-filter-panel' });
      const inProgressChip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === 'In progress');
      expect(inProgressChip).toBeDefined();

      act(() => {
        inProgressChip?.props.onPress();
      });

      // Filter indicator should remain absent
      const updatedFilterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      expect(updatedFilterButton.props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Verify rendered goals: New Car (in progress) and House Down Payment (in progress)
      const renderedGoalNames = renderer.root.findAll((node) =>
        node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel);

      expect(renderedGoalNames.some((l) => l.includes('New Car'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('House Down Payment'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('Europe Vacation'))).toBe(false);
    });

    it('filters goals by Achieved status and expands achieved goals view', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<GoalsScreen />);
      });
      if (!renderer) throw new Error('GoalsScreen failed to render');

      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      act(() => { filterButton.props.onPress(); });

      const panel = renderer.root.findByProps({ testID: 'goal-filter-panel' });
      const achievedChip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === 'Achieved');
      expect(achievedChip).toBeDefined();

      act(() => {
        achievedChip?.props.onPress();
      });

      // Filter indicator must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      const renderedGoalNames = renderer.root.findAll((node) =>
        node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel);

      expect(renderedGoalNames.some((l) => l.includes('Europe Vacation'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('New Car'))).toBe(false);
      expect(renderedGoalNames.some((l) => l.includes('House Down Payment'))).toBe(false);
    });

    it('filters goals by target year', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<GoalsScreen />);
      });
      if (!renderer) throw new Error('GoalsScreen failed to render');

      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      act(() => { filterButton.props.onPress(); });

      const panel = renderer.root.findByProps({ testID: 'goal-filter-panel' });
      const targetYearChip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === String(currentYear + 1));
      expect(targetYearChip).toBeDefined();

      act(() => {
        targetYearChip?.props.onPress();
      });

      const renderedGoalNames = renderer.root.findAll((node) =>
        node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel);

      expect(renderedGoalNames.some((l) => l.includes('New Car'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('House Down Payment'))).toBe(false);
      expect(renderedGoalNames.some((l) => l.includes('Europe Vacation'))).toBe(false);
    });

    it('composes status filter and year filter, and resets both on All', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<GoalsScreen />);
      });
      if (!renderer) throw new Error('GoalsScreen failed to render');

      const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
      act(() => { filterButton.props.onPress(); });

      const panel = renderer.root.findByProps({ testID: 'goal-filter-panel' });
      const inProgressChip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === 'In progress');
      const year5Chip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === String(currentYear + 5));

      act(() => {
        inProgressChip?.props.onPress();
        year5Chip?.props.onPress();
      });

      let renderedGoalNames = renderer.root.findAll((node) =>
        node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel);

      expect(renderedGoalNames.some((l) => l.includes('House Down Payment'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('New Car'))).toBe(false);

      // Now tap "All" to reset
      const allChip = panel.findAllByProps({ accessibilityRole: 'button' })
        .find((c) => c.props.accessibilityLabel === 'All');
      act(() => {
        allChip?.props.onPress();
      });

      renderedGoalNames = renderer.root.findAll((node) =>
        node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Edit '),
      ).map((node) => node.props.accessibilityLabel);

      expect(renderedGoalNames.some((l) => l.includes('New Car'))).toBe(true);
      expect(renderedGoalNames.some((l) => l.includes('House Down Payment'))).toBe(true);
    });
  });

  describe('Dot indicator removal across all 5 screens', () => {
    it('Goals screen: filter icon has no dot indicator initially and after sort/filter change', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<GoalsScreen />); });
      if (!renderer) throw new Error('Failed to render');

      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel and select In progress
      act(() => { renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress(); });
      const chip = renderer.root.findByProps({ testID: 'goal-filter-panel' })
        .findAllByProps({ accessibilityRole: 'button' }).find((c) => c.props.accessibilityLabel === 'In progress');
      act(() => { chip?.props.onPress(); });

      // Must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
    });

    it('Assets screen: filter icon has no dot indicator initially and after filter change', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<AssetsScreen />); });
      if (!renderer) throw new Error('Failed to render');

      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel and select Recurring
      act(() => { renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress(); });
      const chip = renderer.root.findByProps({ testID: 'asset-filter-panel' })
        .findAllByProps({ accessibilityRole: 'button' }).find((c) => c.props.accessibilityLabel === 'Recurring');
      act(() => { chip?.props.onPress(); });

      // Must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
    });

    it('Liabilities screen: filter icon has no dot indicator initially and after filter change', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<LiabilitiesScreen />); });
      if (!renderer) throw new Error('Failed to render');

      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel and select Recurring
      act(() => { renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress(); });
      const chip = renderer.root.findByProps({ testID: 'liability-filter-panel' })
        .findAllByProps({ accessibilityRole: 'button' }).find((c) => c.props.accessibilityLabel === 'Recurring');
      act(() => { chip?.props.onPress(); });

      // Must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
    });

    it('Transactions screen: filter icon has no dot indicator initially and after filter change', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Failed to render');

      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel and select Expense
      act(() => { renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress(); });
      const chip = renderer.root.findByProps({ testID: 'transaction-filter-panel' })
        .findAllByProps({ accessibilityRole: 'button' }).find((c) => c.props.accessibilityLabel === 'Expense');
      act(() => { chip?.props.onPress(); });

      // Must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
    });

    it('Budget screen: filter icon has no dot indicator initially and after filter change', () => {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<BudgetScreen />); });
      if (!renderer) throw new Error('Failed to render');

      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);

      // Open filter panel and select Survival (Needs)
      act(() => { renderer?.root.findByProps({ accessibilityLabel: 'Filter' }).props.onPress(); });
      const chip = renderer.root.findByProps({ testID: 'budget-filter-panel' })
        .findAllByProps({ accessibilityRole: 'button' }).find((c) => c.props.accessibilityLabel === 'Needs');
      act(() => { chip?.props.onPress(); });

      // Must remain absent
      expect(renderer.root.findByProps({ accessibilityLabel: 'Filter' }).props.showIndicator).toBeFalsy();
      expect(renderer.root.findAll((node) => String(node.type) === 'view' && node.props.testID === 'header-action-indicator')).toHaveLength(0);
    });
  });
});
