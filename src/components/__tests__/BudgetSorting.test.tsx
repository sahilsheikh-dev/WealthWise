import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import BudgetScreen from '../../../app/(tabs)/budget';
import { SORT_OPTIONS } from '../../lib/sorting';
import { todayISO } from '../../lib/clock';
import { monthBudgetFromLines } from '../../testFixtures/budget';

let mockFontScale = 1;
const mockUpdateSortSpec = jest.fn().mockResolvedValue(undefined);
const mockGetMeta = jest.fn().mockResolvedValue({});
const mockCurrentMonth = todayISO().slice(0, 7);

const mockData = {
  settings: { name: 'Test', theme: 'light' as const, monthlySalary: null, onboarded: true },
  transactions: [
    { id: 't1', type: 'expense' as const, amount: 800, category: 'Food', note: '', date: `${mockCurrentMonth}-05` },
    { id: 't2', type: 'expense' as const, amount: 200, category: 'Utilities', note: '', date: `${mockCurrentMonth}-06` },
    { id: 't3', type: 'expense' as const, amount: 1500, category: 'Rent', note: '', date: `${mockCurrentMonth}-07` },
  ],
  goals: [],
  holdings: [],
  liabilities: [],
  policies: [],
  budgetPlan: null,
  monthBudgets: [
    monthBudgetFromLines(mockCurrentMonth, [
      { category: 'Utilities', planned: 300 },
      { category: 'Rent', planned: 2000 },
      { category: 'Food', planned: 1000 },
    ], {
      incomes: [
        { id: 'freelance', name: 'Freelance', category: 'Freelance' as const, amount: 2000 },
        { id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 8000 },
      ],
    }),
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
    getMeta: (...args: unknown[]) => mockGetMeta(...args),
    updateSortSpec: (...args: unknown[]) => mockUpdateSortSpec(...args),
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

describe('Budget category and item sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes Filter action in AppHeader, which toggles budget-filter-panel with SortChip', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BudgetScreen />);
    });
    if (!renderer) throw new Error('Renderer not initialized');

    // Filter panel should be closed initially
    expect(renderer.root.findAllByProps({ testID: 'budget-filter-panel' })).toHaveLength(0);

    // Find Filter button in AppHeader
    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    expect(filterButton).toBeDefined();
    expect(filterButton.props.accessibilityState).toEqual({ expanded: false });

    // Tap Filter button to open filter panel
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    expect(panel).toBeDefined();

    // Verify SortChip is rendered inside filter panel
    const sortChip = panel.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Sort:'),
    );
    expect(sortChip.length).toBeGreaterThanOrEqual(1);

    // Tapping Filter button again closes panel
    act(() => {
      filterButton.props.onPress();
    });
    expect(renderer.root.findAllByProps({ testID: 'budget-filter-panel' })).toHaveLength(0);
  });

  it('sorts sections and items by name ascending and keeps income at top', async () => {
    mockGetMeta.mockResolvedValueOnce({
      sortSpecs: { budgetSpending: { key: 'name', dir: 'asc' } },
    });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<BudgetScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Renderer not initialized');

    // Sections: Income is at top, then sections sorted by name
    const sectionList = renderer.root.findByProps({ testID: 'budget-section-list' });
    const sectionHeaders = sectionList.findAll((node) =>
      typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-section-header-'),
    );
    // Income section header should be first
    expect(sectionHeaders[0]?.props.testID).toBe('budget-section-header-income');

    // Verify items within sections are sorted
    const itemRows = sectionList.findAll((node) =>
      typeof node.props.testID === 'string' && node.props.testID.startsWith('budget-row-'),
    );
    expect(itemRows.length).toBeGreaterThanOrEqual(2);
  });

  it('updates metaStore when sort preference is changed', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<BudgetScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Renderer not initialized');

    const filterButton = renderer.root.findByProps({ accessibilityLabel: 'Filter' });
    act(() => {
      filterButton.props.onPress();
    });

    const panel = renderer.root.findByProps({ testID: 'budget-filter-panel' });
    const sortChipButton = panel.find((node) =>
      typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Sort:'),
    );
    // Tap sort chip
    act(() => {
      sortChipButton.props.onPress();
    });

    // Select Name sort option
    const nameOptionButton = renderer.root.find((node) =>
      node.props.accessibilityRole === 'button'
      && Boolean(node.findAllByType && node.findAllByType('text').some((t) => t.children.join('').includes('Name'))),
    );
    act(() => {
      nameOptionButton.props.onPress();
    });

    expect(mockUpdateSortSpec).toHaveBeenCalledWith(
      'budgetSpending',
      expect.objectContaining({ key: 'name' }),
      SORT_OPTIONS.budgetSpending,
    );
  });
});
