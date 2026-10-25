import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import TestRenderer, { act } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';

import HomeScreen from '../../../app/(tabs)';
import GoalsScreen from '../../../app/(tabs)/goals';
import EmergencyFundScreen from '../../../app/emergency-fund';
import { emptyAppData } from '../../domain/actions';
import { defaultCoverGoals } from '../../domain/coverGoals';
import { homeSummary } from '../../domain/summary';
import { THEME_IDS, type AppData, type Policy, type ThemeId } from '../../domain/types';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

const mockData: { current: AppData } = { current: emptyAppData('2026-10-11') };
const mockThemeId: { current: ThemeId } = { current: 'system' };
const mockFontScale: { current: number } = { current: 1 };
const mockPush = jest.fn();

function lastChildTestID(node: ReactTestInstance): unknown {
  const child = node.children.at(-1);
  return typeof child === 'string' ? undefined : child?.props.testID;
}

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn(), back: jest.fn() },
  useIsFocused: () => true,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData.current,
  useAppActions: () => ({}),
}));
jest.mock('../../data/store', () => ({
  metaStore: { getMeta: async () => ({}), updateSortSpec: async () => ({}) },
}));
jest.mock('../../data/metaStore', () => ({
  createMetaStore: () => ({ getMeta: async () => ({}), updateMeta: async () => ({}) }),
}));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-11' }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const themeId = mockThemeId.current;
    const resolvedId = themeId === 'system' ? 'light' : themeId;
    const theme = jest.requireActual('../../theme/themes').themes[resolvedId];
    return { colors: theme.colors, isDark: theme.isDark, themeId, resolvedId, statusBar: theme.statusBar, setTheme: jest.fn() };
  },
}));
jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppHeader: (props: Record<string, unknown>) => ReactModule.createElement('header', props),
  };
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
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Text: node('text'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: mockFontScale.current }),
  };
});

function fixture(storedTarget: number, expenses: number, salary: number | null = null, linkedValue = 0): AppData {
  const empty = emptyAppData('2026-10-11');
  const holdings = linkedValue > 0 ? [{
    id: 'emergency-cash',
    kind: 'manual' as const,
    name: 'Emergency cash',
    type: 'Savings account' as const,
    invested: linkedValue,
    value: linkedValue,
    valueAsOf: '2026-10-11',
    logs: [],
  }] : [];
  return {
    ...empty,
    settings: { ...empty.settings, monthlySalary: salary },
    holdings,
    goals: [{
      id: 'ef-goal',
      name: 'Emergency fund',
      target: storedTarget,
      saved: 0,
      year: 2028,
      auto: 'ef',
      links: linkedValue > 0 ? [{ instrumentId: 'emergency-cash', share: 100 }] : [],
    }],
    transactions: expenses > 0 ? [{
      id: 'rent',
      type: 'expense',
      amount: expenses,
      category: 'Living',
      note: 'Rent',
      date: '2026-09-10',
    }] : [],
  };
}

const scenarios = [
  { label: 'without expense history or salary', stored: 100_000, expenses: 0, salary: null, linkedValue: 0, rowTarget: '₹1,00,000', heroTarget: '₹0', raised: false },
  { label: 'below the minimum', stored: 50_000, expenses: 20_000, salary: null, linkedValue: 0, rowTarget: '₹60,000', heroTarget: '₹0', raised: true },
  { label: 'above the minimum', stored: 80_000, expenses: 20_000, salary: null, linkedValue: 0, rowTarget: '₹80,000', heroTarget: '₹0', raised: false },
  { label: 'salary fallback', stored: 100_000, expenses: 0, salary: 75_000, linkedValue: 200_000, rowTarget: '₹2,25,000', heroTarget: '₹2.00 L', raised: true },
] as const;

function renderedText(root: TestRenderer.ReactTestInstance): string {
  const collect = (node: TestRenderer.ReactTestInstance): string =>
    node.children.map((child) => typeof child === 'string' ? child : collect(child)).join(' ');
  return collect(root);
}

describe('three-month emergency target screens', () => {
  it('shows the Home asset, emergency fund and liability pills with net worth as assets minus liabilities', async () => {
    const data = fixture(300_000, 0, 75_000, 200_000);
    mockData.current = {
      ...data,
      liabilities: [{
        id: 'borrowed',
        kind: 'one-time',
        name: 'Friend',
        type: 'Borrowed money',
        principal: 25_000,
        ratePct: 0,
        startDate: '2026-10-01',
        dueDate: null,
        payments: [],
      }],
    };
    let home: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      home = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!home) throw new Error('Home did not render.');

    const pills = home.root.findAll((node) =>
      ['Assets', 'Emergency fund', 'Liabilities'].includes(node.props.label));
    expect([...new Set(pills.map((pill) => pill.props.label))])
      .toEqual(['Assets', 'Liabilities', 'Emergency fund']);
    expect(pills.some((pill) => pill.props.accessibilityLabel === 'Assets, ₹2,00,000')).toBe(true);
    expect(pills.some((pill) =>
      pill.props.accessibilityLabel === 'Emergency fund, ₹2,00,000, 2.6 months of cover')).toBe(true);
    expect(pills.some((pill) => pill.props.accessibilityLabel === 'Liabilities, ₹25,000')).toBe(true);
    expect(renderedText(home.root)).toContain('₹1.75 L');
  });

  it.each(THEME_IDS.flatMap((themeId) => scenarios.map((scenario) => ({ ...scenario, themeId }))))(
    'shows effective goal targets across Home, Goals, and Emergency fund $label with $themeId theme',
    async ({ stored, expenses, salary, linkedValue, rowTarget, heroTarget, raised, themeId }) => {
      mockThemeId.current = themeId;
      mockData.current = fixture(stored, expenses, salary, linkedValue);
      let home: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        home = TestRenderer.create(<HomeScreen />);
        await Promise.resolve();
      });
      if (!home) throw new Error('Home did not render.');
      assertNoVerbText(home.root, { screen: 'home' });
      const homeText = renderedText(home.root);
      const goalsRenderer = (() => {
        let renderer: TestRenderer.ReactTestRenderer | undefined;
        act(() => { renderer = TestRenderer.create(<GoalsScreen />); });
        if (!renderer) throw new Error('Goals did not render.');
        return renderer;
      })();
      const emergencyRenderer = (() => {
        let renderer: TestRenderer.ReactTestRenderer | undefined;
        act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
        if (!renderer) throw new Error('Emergency fund did not render.');
        return renderer;
      })();
      assertNoVerbText(goalsRenderer.root);
      assertNoVerbText(emergencyRenderer.root);
      const goalsText = renderedText(goalsRenderer.root);
      const emergencyText = renderedText(emergencyRenderer.root);
      expect(goalsRenderer.root.findByProps({ accessibilityLabel: 'Track emergency fund' })).toBeDefined();
      expect(homeText).toContain(rowTarget);
      expect(goalsText).toContain(rowTarget);
      if (linkedValue > 0) expect(emergencyText).toContain(heroTarget);
      else expect(emergencyText).toContain('Current value');
      if (raised) {
      expect(homeText).toContain('Raised to the 3-month minimum');
      expect(goalsText).toContain('Raised to the 3-month minimum');
      } else {
      expect(homeText).not.toContain('Raised to the 3-month minimum');
      expect(goalsText).not.toContain('Raised to the 3-month minimum');
      }
      if (expenses > 0) {
      expect(homeText).toMatch(/Based on your average monthly expenses:\s+₹20,000/);
      expect(goalsText).toMatch(/Based on your average monthly expenses:\s+₹20,000/);
      expect(emergencyText).toContain('Based on your average monthly expenses');
      } else if (salary !== null) {
        expect(homeText).toContain('Based on your monthly income');
        expect(goalsText).toContain('Based on your monthly income');
        expect(emergencyText).toContain('Based on your monthly income');
        expect(homeText).toContain('2.6 mo');
        expect(goalsText).toContain('2.6 mo of cover');
        expect(emergencyText).toContain('2.6 mo');
      } else {
      expect(homeText).toContain('Add your monthly income to see cover');
      expect(goalsText).toContain('Add your monthly income to see cover');
      expect(emergencyText).toContain('Add your monthly income to see cover');
      }
    },
  );

  it('keeps normal allocation rows detail-first with a final progress bar and one header edit action', () => {
    const empty = emptyAppData('2026-10-11');
    mockData.current = {
      ...empty,
      holdings: [{
        id: 'holding-cash', kind: 'manual', name: 'Savings account', type: 'Savings account',
        invested: 2_500, value: 2_500, logs: [],
      }],
      goals: [{
        id: 'ef-goal', name: 'Emergency fund', target: 100_000, saved: 0, year: 2028, auto: 'ef',
        links: [{ instrumentId: 'holding-cash', share: 100 }],
      }],
      efCustomBuckets: [{
        id: 'custom-reserve', name: 'Home reserve', access: 'instant', marketLinked: false,
      }],
      efBucketLinks: { 'custom-reserve': ['holding-cash'] },
      efAllocation: {
        cash: 0, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'custom-reserve': 10,
      },
    };
    mockFontScale.current = 1;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
    if (!renderer) throw new Error('Emergency fund did not render.');
    const text = renderedText(renderer.root);
    expect(text).toContain('Home reserve');
    expect(text).not.toContain('Savings account');
    expect(renderer.root.findAllByProps({ label: 'Manage links' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ label: 'Link assets' })).toHaveLength(0);
    expect(text).not.toContain('Deposit');
    expect(text).not.toContain('Withdraw');
    expect(text).not.toContain('Passbook');
    expect(renderer.root.findAllByProps({ label: 'Link assets' })).toHaveLength(0);

    const header = renderer.root.findByType('header');
    expect(header.props).toMatchObject({
      title: 'Emergency fund',
      showBack: true,
      showDefaultMenu: false,
      rightActions: [{ icon: 'edit-2', label: 'Edit allocation' }],
    });
    expect(renderer.root.findAllByProps({ label: 'Edit emergency fund allocation' })).toHaveLength(0);
    expect(text).not.toContain('Over');
    expect(text).not.toContain('Under');
    expect(text).not.toContain('On target');
    const items = renderer.root.findAll((node) => {
      const testID = node.props.testID;
      return typeof testID === 'string'
        && testID.startsWith('emergency-fund-allocation-item-')
        && lastChildTestID(node)
          === `emergency-fund-progress-${testID.replace('emergency-fund-allocation-item-', '')}`;
    });
    expect(items).toHaveLength(4);
    for (const item of items) {
      const bucketId = String(item.props.testID).replace('emergency-fund-allocation-item-', '');
      expect(item.findAll((node) => node.props.testID === `emergency-fund-status-${bucketId}`)).toHaveLength(0);
    }
    expect(renderer.root.findAll((node) =>
      String(node.props.testID).startsWith('emergency-fund-progress-status-'))).toHaveLength(0);
    mockPush.mockClear();
    act(() => header.props.rightActions[0].onPress());
    expect(mockPush).toHaveBeenCalledWith('/ef-allocation-form');
  });

  it.each([1.3, 2])('keeps details first and the progress bar last at font scale %s', (fontScale) => {
    const empty = emptyAppData('2026-10-11');
    mockData.current = {
      ...empty,
      holdings: [{
        id: 'holding-cash', kind: 'manual', name: 'Savings account', type: 'Savings account',
        invested: 2_500, value: 2_500, logs: [],
      }],
      goals: [{
        id: 'ef-goal', name: 'Emergency fund', target: 100_000, saved: 0, year: 2028, auto: 'ef',
        links: [{ instrumentId: 'holding-cash', share: 100 }],
      }],
      efBucketLinks: { cash: ['holding-cash'] },
    };
    mockFontScale.current = fontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
    if (!renderer) throw new Error('Emergency fund did not render.');
    const item = renderer.root.findAllByProps({ testID: 'emergency-fund-allocation-item-cash' })
      .find((node) => lastChildTestID(node) === 'emergency-fund-progress-cash');
    if (!item) throw new Error('Cash allocation row did not render with its progress bar last.');
    expect(lastChildTestID(item)).toBe('emergency-fund-progress-cash');
    expect(item.findAll((node) => node.props.testID === 'emergency-fund-status-cash')).toHaveLength(0);
  });

  it('offers to link assets while showing the three requested default allocation items', () => {
    mockData.current = emptyAppData('2026-10-11');
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
    if (!renderer) throw new Error('Emergency fund did not render.');
    expect(renderer.root.findAllByProps({ title: 'No assets linked' }).length).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ label: 'Link assets' })).toBeDefined();
    const items = renderer.root.findAll((node) => {
      const testID = node.props.testID;
      return typeof testID === 'string'
        && testID.startsWith('emergency-fund-allocation-item-')
        && lastChildTestID(node)
          === `emergency-fund-progress-${testID.replace('emergency-fund-allocation-item-', '')}`;
    });
    expect(items).toHaveLength(3);
  });

  it('renders Home, Goals and Emergency fund for malformed persisted allocations', async () => {
    const empty = emptyAppData('2026-10-11');
    const custom = { id: 'renamed-option', name: 'Renamed', access: 'instant' as const, marketLinked: false };
    const scenarios: { name: string; allocation: Record<string, number>; customBuckets?: AppData['efCustomBuckets'] }[] = [
      { name: '99.99 total', allocation: { cash: 9.99, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 } },
      { name: '100.01 total', allocation: { cash: 10.01, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 } },
      { name: 'unknown deleted option', allocation: { ...empty.efAllocation, 'deleted-option': 0 } },
      { name: 'negative value', allocation: { cash: -1, bank: 41, 'fd-rd': 35, 'mutual-funds-bonds': 15 } },
      { name: 'NaN value', allocation: { cash: Number.NaN, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 } },
      { name: 'empty object', allocation: {} },
      { name: 'removed custom option', allocation: { ...empty.efAllocation, 'deleted-option': 0 }, customBuckets: [] },
      {
        name: 'renamed custom option',
        allocation: { cash: 10, bank: 30, 'fd-rd': 35, 'mutual-funds-bonds': 15, 'old-option': 10 },
        customBuckets: [custom],
      },
    ];

    for (const scenario of scenarios) {
      mockData.current = {
        ...empty,
        efAllocation: scenario.allocation,
        efCustomBuckets: scenario.customBuckets ?? [],
      };
      let home: TestRenderer.ReactTestRenderer | undefined;
      let goals: TestRenderer.ReactTestRenderer | undefined;
      let emergency: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        home = TestRenderer.create(<HomeScreen />);
        goals = TestRenderer.create(<GoalsScreen />);
        emergency = TestRenderer.create(<EmergencyFundScreen />);
        await Promise.resolve();
      });
      if (!home || !goals || !emergency) throw new Error(`${scenario.name}: a screen did not render.`);
      const repairMessage = 'Your allocation was adjusted to total 100%. Check it in Edit allocation.';
      expect(renderedText(emergency.root)).toContain(repairMessage);
      expect(emergency.root.findAllByType('text').filter((node) =>
        node.children.join('') === repairMessage)).toHaveLength(1);
      await act(async () => {
        home?.unmount();
        goals?.unmount();
        emergency?.unmount();
      });
    }
  });

  it.each([1.3, 2])('renders the Home Insurance section after upcoming dues and before Goal Progress at font scale %s', async (fontScale) => {
    const empty = emptyAppData('2026-10-11');
    const policy: Policy = {
      id: 'home-term-life',
      name: 'Term cover',
      insurer: 'Example insurer',
      kind: 'term-life',
      premium: 1_000,
      frequency: 'yearly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 20,
      trackFrom: '2026-01-01',
      currentValue: null,
      valueAsOf: null,
      sumAssured: 2_000_000,
      payments: [],
    };
    const data: AppData = {
      ...empty,
      policies: [policy],
      coverGoals: defaultCoverGoals(),
      liabilities: [{
        id: 'upcoming-friend-payment',
        kind: 'one-time',
        name: 'Friend',
        type: 'Borrowed money',
        principal: 20_000,
        ratePct: 0,
        startDate: '2026-01-01',
        dueDate: '2026-10-20',
        payments: [],
      }],
      transactions: [{
        id: 'recent-salary',
        type: 'income',
        amount: 50_000,
        category: 'Salary',
        note: '',
        date: '2026-09-10',
      }],
    };
    mockData.current = data;
    mockFontScale.current = fontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');

    const cards = renderer.root.findAll((node) => String(node.type) === 'card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const netWorthCard = cards.at(0);
    if (!netWorthCard) throw new Error('Home summary card is missing.');
    expect(renderedText(netWorthCard)).toContain('Net Worth');
    expect(netWorthCard.findByProps({ label: 'Emergency fund' })).toBeDefined();
    const insurancePressable = renderer.root.findByProps({ testID: 'home-insurance-card' });
    expect(insurancePressable.props.accessibilityRole).toBe('button');
    expect(insurancePressable.props.accessibilityLabel).toBe('Open Insurance');
    expect(insurancePressable.parent).toBeDefined();
    const orderedMarkers = renderer.root.findAll((node) => {
      const text = node.type === 'text' ? renderedText(node).trim() : '';
      return node.props.testID === 'home-insurance-card'
        || ['Upcoming and due', 'Insurance', 'Goal Progress'].includes(text);
    }).map((node) => node.props.testID ?? renderedText(node).trim());
    const upcomingIndex = orderedMarkers.indexOf('Upcoming and due');
    const insuranceHeadingIndex = orderedMarkers.indexOf('Insurance');
    const insuranceCardIndex = orderedMarkers.indexOf('home-insurance-card');
    const goalProgressIndex = orderedMarkers.indexOf('Goal Progress');
    expect(upcomingIndex).toBeGreaterThanOrEqual(0);
    expect(insuranceHeadingIndex).toBeGreaterThan(upcomingIndex);
    expect(insuranceCardIndex).toBeGreaterThan(insuranceHeadingIndex);
    expect(goalProgressIndex).toBeGreaterThan(insuranceCardIndex);
    const detailRowIds = [
      'home-insurance-row-total-cover',
      'home-insurance-row-yearly-premium',
      'home-insurance-row-next-renewal',
    ];
    expect(Array.from(new Set(insurancePressable.findAll((node) =>
      typeof node.props.testID === 'string' && detailRowIds.includes(node.props.testID),
    ).map((node) => node.props.testID)))).toEqual([
      'home-insurance-row-total-cover',
      'home-insurance-row-yearly-premium',
      'home-insurance-row-next-renewal',
    ]);
    const insuranceCard = insurancePressable.findByType('card');
    expect(lastChildTestID(insuranceCard)).toBe('home-insurance-term-progress');
    expect(insurancePressable.findByProps({ testID: 'home-insurance-term-progress' })
      .findByProps({ testID: 'goal-progress-row' })).toBeDefined();
    const totalRow = insurancePressable.findByProps({ testID: 'home-insurance-row-total-cover' });
    const rowStackStyles = totalRow.findAll((node) =>
      String(JSON.stringify(node.props.style)).includes('"flexDirection":"column"'));
    expect(rowStackStyles.length > 0).toBe(fontScale >= 1.3);
    expect(renderedText(insuranceCard)).toContain('₹20,00,000');
    expect(renderedText(insuranceCard)).toContain('Yearly premium');
    expect(renderedText(insuranceCard)).toContain('Term cover');

    const beforeSummary = homeSummary({ ...data, policies: [] }, '2026-10-11');
    const afterSummary = homeSummary(data, '2026-10-11');
    expect(afterSummary.netWorth).toBe(beforeSummary.netWorth);
    expect(afterSummary.goals.map(({ goal, saved }) => [goal.id, saved]))
      .toEqual(beforeSummary.goals.map(({ goal, saved }) => [goal.id, saved]));

    act(() => insurancePressable.props.onPress());
    expect(mockPush).toHaveBeenLastCalledWith('/insurance');
    await act(async () => renderer?.unmount());
  });

  it('hides the term-life bar without a known target and routes the empty-state Add policy action', async () => {
    const empty = emptyAppData('2026-10-11');
    const policy: Policy = {
      id: 'home-term-life',
      name: 'Term cover',
      insurer: 'Example insurer',
      kind: 'term-life',
      premium: 1_000,
      frequency: 'yearly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 20,
      trackFrom: '2026-01-01',
      currentValue: null,
      valueAsOf: null,
      sumAssured: 2_000_000,
      payments: [],
    };
    mockData.current = {
      ...empty,
      policies: [policy],
      coverGoals: defaultCoverGoals(),
      budgetPlan: null,
      monthBudgets: [],
      transactions: [],
    };
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    const card = renderer.root.findByProps({ testID: 'home-insurance-card' });
    expect(card.findAllByProps({ testID: 'home-insurance-term-progress' })).toHaveLength(0);
    expect(card.findByProps({ testID: 'home-insurance-row-next-renewal' })).toBeDefined();
    await act(async () => renderer?.unmount());

    mockData.current = { ...empty, policies: [] };
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Empty Home did not render.');
    const emptyCard = renderer.root.findByProps({ testID: 'home-insurance-card' });
    expect(emptyCard.findByProps({ title: 'No policies yet' })).toBeDefined();
    expect(emptyCard.findAllByProps({ testID: 'home-insurance-row-total-cover' })).toHaveLength(0);
    expect(emptyCard.findAllByProps({ testID: 'home-insurance-term-progress' })).toHaveLength(0);
    const addPolicy = emptyCard.findByProps({ label: 'Add policy' });
    const stopPropagation = jest.fn();
    act(() => addPolicy.props.onPress({ stopPropagation }));
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenLastCalledWith('/policy-form');
    await act(async () => renderer?.unmount());
  });

  it('removes all Insurance content and the old compact cover row from Goals and Home', () => {
    const empty = emptyAppData('2026-10-11');
    mockData.current = {
      ...empty,
      policies: [{
        id: 'home-term-life',
        name: 'Term cover',
        insurer: 'Example insurer',
        kind: 'term-life',
        premium: 1_000,
        frequency: 'yearly',
        startDate: '2026-01-01',
        status: 'active',
        premiumYears: 20,
        trackFrom: '2026-01-01',
        currentValue: null,
        valueAsOf: null,
        sumAssured: 2_000_000,
        payments: [],
      }],
      coverGoals: defaultCoverGoals(),
    };
    let goals: TestRenderer.ReactTestRenderer | undefined;
    let home: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      goals = TestRenderer.create(<GoalsScreen />);
      home = TestRenderer.create(<HomeScreen />);
    });
    if (!goals || !home) throw new Error('Goal screens did not render.');
    expect(renderedText(goals.root).toLowerCase()).not.toContain('insurance');
    expect(goals.root.findAll((node) => node.props.accessibilityLabel === 'Insurance cover')).toHaveLength(0);
    expect(home.root.findAllByProps({ testID: 'home-insurance-cover-link' })).toHaveLength(0);
    expect(readFileSync(join(process.cwd(), 'app/(tabs)/goals.tsx'), 'utf8')).not.toMatch(/insurance/i);
    expect(readFileSync(join(process.cwd(), 'app/(tabs)/index.tsx'), 'utf8'))
      .not.toMatch(/home-insurance-cover-link|coverGaps|coverLink/);
    act(() => {
      goals?.unmount();
      home?.unmount();
    });
  });
});
