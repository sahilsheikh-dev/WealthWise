import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionsScreen from '../../../app/(tabs)/transactions';
import { monthSummary } from '../../domain/transactions';
import { THEME_IDS, type ThemeId, type Transaction } from '../../domain/types';
import { shiftMonth } from '../../domain/dates';
import { formatMonth } from '../../lib/format';
import { todayISO } from '../../lib/clock';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

const mockData: { transactions: Transaction[]; [key: string]: unknown } = {
  settings: { name: 'Test', theme: 'light' as const, monthlySalary: null, onboarded: true },
  transactions: [{
    id: 'withdrawal',
    type: 'income' as const,
    amount: 5_000,
    category: 'Withdrawal',
    note: 'Cash withdrawal',
    date: '2026-10-10',
  }],
  goals: [],
  holdings: [],
  liabilities: [],
  policies: [],
};
const mockThemeId: { current: ThemeId } = { current: 'light' };
let mockFontScale = 1;
let mockTxMonth = '2026-10';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock('../../data/store', () => ({
  metaStore: { getMeta: async () => ({}), updateSortSpec: async () => ({}) },
}));
jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
}));
jest.mock('../../data/uiStore', () => ({
  useUIStore: (selector: (state: { txMonth: string; setTxMonth: jest.Mock }) => unknown) =>
    selector({ txMonth: mockTxMonth, setTxMonth: jest.fn((month: string) => { mockTxMonth = month; }) }),
}));
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
jest.mock('../AppHeader', () => ({
  AppHeader: ({ title, rightActions, menu }: {
    title: string;
    rightActions?: { label: string; icon: string; onPress: () => void }[];
    menu?: { label: string; icon: string; onPress: () => void }[];
  }) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('header', null,
      ReactModule.createElement('text', null, title),
      ...(rightActions ?? []).map((action) =>
        ReactModule.createElement('button', { accessibilityLabel: action.label, onPress: action.onPress }, action.icon),
      ),
      ...(menu ?? []).map((item) =>
        ReactModule.createElement('button', { accessibilityLabel: item.label, onPress: item.onPress }, item.label),
      ),
    );
  },
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    Platform: { OS: 'ios' },
    Alert: { alert: jest.fn() },
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    View: node('view'),
    Modal: ({ visible, children, ...props }: { visible: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
      visible ? ReactModule.createElement('modal', props, children) : null,
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    useWindowDimensions: () => ({ fontScale: mockFontScale }),
  };
});
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    AppText: node('text'),
    Button: node('button'),
    Card: node('card'),
    Chip: node('chip'),
    ChipRow: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement('scrollview', { horizontal: true, showsHorizontalScrollIndicator: false }, children),
    EmptyState: ({ title }: { title: string }) => ReactModule.createElement('text', null, title),
    ListItem: node('listitem'),
    Screen: node('screen'),
    SearchField: node('searchfield'),
    StatPill: node('statpill'),
    WarningBanner: node('warning'),
  };
});

function flattenStyles(style: unknown): Record<string, unknown>[] {
  const values = Array.isArray(style) ? style.flat(Infinity) : [style];
  return values.filter((value): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null,
  );
}

function hasAncestor(
  node: TestRenderer.ReactTestInstance,
  ancestor: TestRenderer.ReactTestInstance,
): boolean {
  let current: TestRenderer.ReactTestInstance | null = node;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function renderedText(root: TestRenderer.ReactTestInstance): string {
  const parts: string[] = [];
  const visit = (node: TestRenderer.ReactTestInstance) => {
    for (const child of node.children) {
      if (typeof child === 'string') parts.push(child);
      else if (typeof child === 'object') visit(child);
    }
  };
  visit(root);
  return parts.join(' ');
}

describe('Transactions available-balance card', () => {
  it('shows the normalized investment category label on transaction rows', () => {
    const previousTransactions = mockData.transactions;
    mockData.transactions = [{
      id: 'legacy-investment',
      type: 'invest',
      amount: 500,
      category: 'Other',
      note: '',
      date: '2026-10-10',
    }];
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const row = renderer.root.findAll((node) => String(node.type) === 'listitem')[0];
      if (!row) throw new Error('Invest transaction row did not render.');
      expect(row.props.title).toBe('Other investments');
      expect(row.props.subtitle).toBe('Other investments');
      expect(row.props.accessibilityLabel).toContain('Other investments');
    } finally {
      mockData.transactions = previousTransactions;
    }
  });

  it('keeps the sort chip in the horizontal filter row at font scale 2.0', () => {
    mockFontScale = 2;
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');

      const row = renderer.root.findByProps({ testID: 'transaction-filter-row' });
      const scroller = row.findAll((node) => String(node.type) === 'scrollview')[0];
      if (!scroller) throw new Error('Transactions filter scroller did not render.');
      expect(scroller.props.horizontal).toBe(true);
      expect(scroller.props.showsHorizontalScrollIndicator).toBe(false);
      const chips = renderer.root.findAll((node) => String(node.type) === 'chip');
      const sortChip = chips.find((node) => node.props.label === 'Sort: Date ↓');
      if (!sortChip) throw new Error('Transactions sort chip did not render.');
      expect(hasAncestor(sortChip, scroller)).toBe(true);
      expect(chips.map((node) => node.props.label))
        .toEqual(expect.arrayContaining(['All', 'Income', 'Expense', 'Invested', 'Sort: Date ↓']));
      expect(renderer.root.findAllByType('text').filter((node) =>
        node.children.join('') === 'Transactions',
      )).toHaveLength(1);
      expect(renderer.root.findAllByProps({ testID: 'unlinked-entry-notice' })).toHaveLength(0);
      expect(renderer.root.findByProps({ accessibilityLabel: 'Link missing transactions' })).toBeDefined();
    } finally {
      mockFontScale = 1;
    }
  });

  it.each(THEME_IDS)('renders the withdrawals-only state under the %s theme', (id) => {
    mockThemeId.current = id;
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(<TransactionsScreen />);
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Transactions renderer was not created.');
    const text = renderedText(renderer.root);
    expect(monthSummary(mockData.transactions, '2026-10')).toMatchObject({
      earnedIncome: 0,
      rates: null,
    });
    expect(text).toContain('No earned income logged this month');
    expect(text).toContain('Available balance');
    expect(text).not.toContain('NaN');
    const balanceCard = renderer.root.findByProps({ testID: 'available-balance-card' });
    expect(balanceCard.findAllByProps({ testID: 'available-balance-toggle' })).toHaveLength(0);
    expect(renderedText(balanceCard)).not.toContain('Other money in');
    expect(renderedText(balanceCard)).not.toContain('due');
    expect(renderedText(balanceCard)).not.toContain('NaN');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add transaction' })).toBeDefined();
    expect(renderer.root.findAll((node) => String(node.type) === 'fab')).toHaveLength(0);
    assertNoVerbText(renderer.root);
  });

  it('routes plus straight to the transaction form and has no money-movement menu action', () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<TransactionsScreen />);
    });
    if (!renderer) throw new Error('Transactions renderer was not created.');

    expect(renderer.root.findAll((node) => String(node.type) === 'modal')).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Record money movement' })).toHaveLength(0);
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Add transaction' }).props.onPress());
    expect(router.push).toHaveBeenCalledWith('/transaction-form');
    expect(renderer.root.findAll((node) => String(node.type) === 'modal')).toHaveLength(0);
  });

  it('shows and routes the unlinked-entry notice and header action at font scale 2.0', () => {
    const previousHoldings = mockData.holdings;
    mockData.holdings = [{
      id: 'unlinked-manual',
      kind: 'manual',
      name: 'Unlinked manual',
      type: 'Gold',
      invested: 100,
      value: 120,
      valueAsOf: '2026-10-10',
      logs: [
        { id: 'unlinked-one', date: '2026-10-08', amount: 10, note: 'First', kind: 'Deposit' },
        { id: 'unlinked-two', date: '2026-10-09', amount: 20, note: 'Second', kind: 'Deposit' },
      ],
    }];
    mockFontScale = 2;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const currentRenderer = renderer;

      const notice = currentRenderer.root.findByProps({ testID: 'unlinked-entry-notice' });
      expect(notice.props.accessibilityLabel).toBe('2 entries have no transaction. Link missing transactions');
      expect(notice.findAllByType('text')
        .flatMap((node) => node.children.filter((child): child is string => typeof child === 'string'))
        .join(''))
        .toBe('2 entries have no transaction. Link');
      expect(flattenStyles(notice.props.style)).toEqual(expect.arrayContaining([
        expect.objectContaining({ minHeight: 44, flexWrap: 'wrap', flexDirection: 'row' }),
      ]));
      expect(flattenStyles(notice.props.style).every((style) =>
        !('height' in style) && !('maxHeight' in style),
      )).toBe(true);
      const orderedIds = currentRenderer.root.findAll((node) =>
        ['available-balance-card', 'unlinked-entry-notice', 'transaction-filter-row'].includes(String(node.props.testID)),
      ).map((node) => node.props.testID).filter((id, index, ids) => ids.indexOf(id) === index);
      expect(orderedIds).toEqual([
        'available-balance-card',
        'unlinked-entry-notice',
        'transaction-filter-row',
      ]);

      act(() => notice.props.onPress());
      expect(router.push).toHaveBeenCalledWith('/link-missing');
      router.push.mockClear();
      act(() => currentRenderer.root.findByProps({ accessibilityLabel: 'Link missing transactions' }).props.onPress());
      expect(router.push).toHaveBeenCalledWith('/link-missing');
    } finally {
      mockData.holdings = previousHoldings;
      mockFontScale = 1;
    }
  });

  it('keeps the Review action and routes its selected month to Budget', () => {
    const previousTransactions = mockData.transactions;
    mockData.transactions = [
      { id: 'prior-income', type: 'income', amount: 1_000, category: 'Salary', note: 'Prior pay', date: '2026-09-02' },
      { id: 'prior-expense', type: 'expense', amount: 400, category: 'Food', note: 'Prior food', date: '2026-09-03' },
      { id: 'income', type: 'income', amount: 300, category: 'Salary', note: 'Pay', date: '2026-10-01' },
      { id: 'borrowed', type: 'income', amount: 20, category: 'Borrowed', note: 'Friend', date: '2026-10-02' },
      { id: 'expense', type: 'expense', amount: 50, category: 'Food', note: 'Meal', date: '2026-10-03' },
      { id: 'invest', type: 'invest', amount: 40, category: 'Stocks / ETF', note: 'ETF', date: '2026-10-04' },
    ];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    routeParams.mockReturnValue({});
    router.push.mockClear();
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<TransactionsScreen />);
      });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const currentRenderer = renderer;
      const cashCard = currentRenderer.root.findByProps({ testID: 'available-balance-card' });
      const card = cashCard.findAll((node) => String(node.type) === 'card')[0];
      if (!card) throw new Error('Balance Card did not render.');
      const cardStyles = flattenStyles(card.props.style);
      expect(cardStyles).toEqual(expect.arrayContaining([expect.objectContaining({ minHeight: 56 })]));
      expect(cardStyles.every((style) => !('height' in style) && !('maxHeight' in style))).toBe(true);
      expect(cashCard.findAllByProps({ testID: 'available-balance-toggle' })).toHaveLength(0);
      expect(cashCard.findAllByProps({ testID: 'available-balance-details' })).toHaveLength(0);
      const collapsedFigures = cashCard.findAll((node) =>
        node.props.accessibilityLabel === '₹830' || node.props.accessibilityLabel === '₹600',
      ).map((node) => node.props.accessibilityLabel);
      expect([...new Set(collapsedFigures)]).toEqual(['₹830']);
      const collapsedLabels = cashCard.findAllByType('text').map((node) => node.children.join(' '));
      expect(collapsedLabels).toContain('Available balance');
      expect(collapsedLabels.some((label) => label.includes('From') && label.includes('Sep'))).toBe(false);
      expect(collapsedLabels).not.toContain('Brought forward');
      expect(cashCard.findAll((node) =>
        String(node.type) === 'view' && String(node.props.testID).startsWith('balance-metric-'),
      )).toHaveLength(0);
      expect(cashCard.findAllByProps({ testID: 'available-balance-caption' })).toHaveLength(0);
      expect(cashCard.findAllByProps({ testID: 'balance-pending-caption' })).toHaveLength(0);
      expect(cashCard.findAll((node) =>
        flattenStyles(node.props.style).some((style) => style.position === 'absolute'),
      )).toHaveLength(0);
      expect(cashCard.findAll((node) =>
        String(node.type) === 'view' && node.props.testID === 'available-balance-divider',
      )).toHaveLength(1);

      const reviewLabel = `Review ${formatMonth('2026-09')}`;
      expect(currentRenderer.root.findAllByProps({ accessibilityLabel: reviewLabel }).length).toBeGreaterThan(0);
      expect(currentRenderer.root.findAllByProps({ accessibilityLabel: 'Dismiss month review reminder' })).toHaveLength(0);
      const reviewButton = currentRenderer.root.findAll((node) => String(node.type) === 'pressable')
        .find((node) => node.findAllByType('text').some((text) =>
          text.children.join(' ').replace(/\s+/g, ' ').trim() === reviewLabel,
        ));
      if (!reviewButton) throw new Error('Review action was not rendered.');
      act(() => reviewButton.props.onPress());
      expect(router.push).toHaveBeenCalledWith({ pathname: '/(tabs)/budget', params: { month: '2026-09' } });
      expect(cashCard.findAllByProps({ accessibilityLabel: reviewLabel }).length).toBeGreaterThan(0);
      expect(cashCard.findAllByType('text').map((node) => node.children.join(' ')).join(' '))
        .not.toContain('NaN');
    } finally {
      mockData.transactions = previousTransactions;
      routeParams.mockReturnValue({});
    }
  });

  it.each([1, 1.3, 2])('keeps the user-owned balance card always visible without fixed sizing at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const cashCard = renderer.root.findByProps({ testID: 'available-balance-card' });
      const card = cashCard.findAll((node) => String(node.type) === 'card')[0];
      if (!card) throw new Error('Balance Card did not render.');
      expect(flattenStyles(card.props.style).every((style) =>
        !('height' in style) && !('maxHeight' in style),
      )).toBe(true);
      expect(cashCard.findAllByProps({ testID: 'available-balance-toggle' })).toHaveLength(0);
      expect(cashCard.findAll((node) =>
        typeof node.props.testID === 'string' && node.props.testID.startsWith('balance-metric-'),
      )).toHaveLength(0);
      expect(cashCard.findAllByType('text').map((node) => node.children.join(' ')).join(' '))
        .not.toContain('NaN');
    } finally {
      mockFontScale = 1;
    }
  });

  it('does not show a recurring-due caption in the balance card', () => {
    const previousHoldings = mockData.holdings;
    const month = todayISO().slice(0, 7);
    mockData.holdings = [{
      id: 'pending-plan',
      kind: 'plan',
      name: 'Monthly plan',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 250,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: `${month}-01`,
      trackFrom: `${month}-01`,
      opening: 0,
      actualValue: null,
      actualValueDate: null,
      logs: [],
    }];
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const cashCard = renderer.root.findByProps({ testID: 'available-balance-card' });
      expect(cashCard.findAllByProps({ testID: 'balance-pending-caption' })).toHaveLength(0);
      expect(cashCard.findAllByType('text').map((node) => node.children.join(' ')).join(' '))
        .not.toContain('due');
    } finally {
      mockData.holdings = previousHoldings;
    }
  });

  it('switches the summary label from Available balance to Closing balance for a past month', () => {
    const previousMonth = mockTxMonth;
    mockTxMonth = shiftMonth(todayISO().slice(0, 7), -1);
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const text = renderedText(renderer.root);
      expect(text).toContain('Closing balance');
      expect(text).not.toContain('Available balance');
    } finally {
      mockTxMonth = previousMonth;
    }
  });

  it('keeps the always-visible card naturally sized and its sections in scroll flow at font scale 2.0', () => {
    mockFontScale = 2;
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const currentRenderer = renderer;
      const cashCard = currentRenderer.root.findByProps({ testID: 'available-balance-card' });
      const card = cashCard.findAll((node) => String(node.type) === 'card')[0];
      if (!card) throw new Error('Balance Card did not render.');
      const cardStyles = flattenStyles(card.props.style);
      expect(cardStyles.every((style) => !('height' in style) && !('maxHeight' in style))).toBe(true);
      expect(currentRenderer.root.findAllByProps({ testID: 'available-balance-toggle' })).toHaveLength(0);
      expect(cashCard.findAll((node) =>
        flattenStyles(node.props.style).some((style) => style.position === 'absolute'),
      )).toHaveLength(0);
      const metricRows = cashCard.findAll((node) =>
        String(node.type) === 'view'
        && typeof node.props.testID === 'string'
        && node.props.testID.startsWith('balance-metric-'),
      );
      expect(metricRows).toHaveLength(0);
      const contentScroll = currentRenderer.root.findByProps({ testID: 'transactions-content-scroll' });
      for (const testID of ['transactions-month-row', 'transaction-filter-row', 'transactions-list']) {
        const section = currentRenderer.root.findByProps({ testID });
        expect(hasAncestor(section, contentScroll)).toBe(true);
        expect(flattenStyles(section.props.style).some((style) => style.position === 'absolute')).toBe(false);
      }
    } finally {
      mockFontScale = 1;
    }
  });

  it('marks a negative available balance as a shortfall with the danger tone', () => {
    const previousTransactions = mockData.transactions;
    mockData.transactions = [
      { id: 'prior-income', type: 'income', amount: 100, category: 'Salary', note: 'Prior pay', date: '2026-09-01' },
      { id: 'small-income', type: 'income', amount: 20, category: 'Salary', note: 'Pay', date: '2026-10-01' },
      { id: 'large-expense', type: 'expense', amount: 150, category: 'Food', note: 'Food', date: '2026-10-02' },
    ];
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<TransactionsScreen />);
      });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const cashCard = renderer.root.findByProps({ testID: 'available-balance-card' });
      expect(cashCard.findAllByType('text').map((node) => node.children.join(' ')).join(' ')).toContain('Shortfall');
      const amount = renderer.root.findByProps({ accessibilityLabel: '-₹30' });
      expect(amount.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ color: expect.any(String) }),
      ]));
    } finally {
      mockData.transactions = previousTransactions;
    }
  });
});

describe('Transactions sorting', () => {
  it.each(['Festival', 'Donation', 'Gifts'] as const)(
    'shows only routed %s transactions from a category filter',
    async (category) => {
      mockData.transactions = [
        { id: 'festival', type: 'expense', amount: 100, category: 'Festival', note: 'festival entry', date: '2026-10-02' },
        { id: 'donation', type: 'expense', amount: 200, category: 'Donation', note: 'donation entry', date: '2026-10-03' },
        { id: 'gift', type: 'expense', amount: 300, category: 'Gifts', note: 'gift entry', date: '2026-10-04' },
      ];
      const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
      routeParams.mockReturnValue({ category, month: '2026-10' });
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        renderer = TestRenderer.create(<TransactionsScreen />);
        await Promise.resolve();
      });
      if (!renderer) throw new Error('Transactions renderer was not created.');

      expect(renderer.root.findByProps({ label: `Category: ${category} ×` })).toBeDefined();
      expect(renderer.root.findAll((node) => String(node.type) === 'listitem').map((node) => node.props.title))
        .toEqual([category === 'Gifts' ? 'gift entry' : `${category.toLowerCase()} entry`]);
      routeParams.mockReturnValue({});
    },
  );

  it('applies a routed category filter and can clear it without changing the month', async () => {
    mockData.transactions = [
      { id: 'food', type: 'expense', amount: 50, category: 'Food', note: 'Lunch', date: '2026-10-10' },
      { id: 'rent', type: 'expense', amount: 500, category: 'Living', note: 'Rent', date: '2026-10-10' },
    ];
    const routeParams = jest.requireMock('expo-router').useLocalSearchParams as jest.Mock;
    routeParams.mockReturnValue({ category: 'Food', month: '2026-10' });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionsScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Transactions renderer was not created.');
    const titles = () => renderer?.root.findAll((node) => String(node.type) === 'listitem').map((node) => node.props.title);
    expect(titles()).toEqual(['Lunch']);
    const categoryChip = renderer.root.findByProps({ label: 'Category: Food ×' });
    act(() => categoryChip.props.onPress());
    expect(titles()).toEqual(['Rent', 'Lunch']);
    routeParams.mockReturnValue({});
  });

  it('changes only the order after the active type filter and search', async () => {
    mockData.transactions = [
      { id: 'a', type: 'expense', amount: 500, category: 'Food', note: 'Food groceries', date: '2026-10-10' },
      { id: 'b', type: 'expense', amount: 50, category: 'Food', note: 'Food lunch', date: '2026-10-10' },
      { id: 'c', type: 'expense', amount: 200, category: 'Living', note: 'Rent', date: '2026-10-10' },
      { id: 'd', type: 'income', amount: 700, category: 'Food', note: 'Food income', date: '2026-10-10' },
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<TransactionsScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Transactions renderer was not created.');

    const chips = () => renderer?.root.findAll((node) => String(node.type) === 'chip') ?? [];
    const expenseFilter = chips().find((node) => node.props.label === 'Expense');
    if (!expenseFilter) throw new Error('Expense filter chip was not rendered.');
    act(() => expenseFilter.props.onPress());
    const search = renderer.root.findAll((node) => String(node.type) === 'searchfield')[0];
    if (!search) throw new Error('Search field was not rendered.');
    act(() => search.props.onChangeText('Food'));
    const titles = () => renderer?.root.findAll((node) => String(node.type) === 'listitem').map((node) => node.props.title);
    expect(titles()).toEqual(['Food lunch', 'Food groceries']);

    const sortChip = chips().find((node) =>
      typeof node.props.label === 'string' && node.props.label.startsWith('Sort:'),
    );
    if (!sortChip) throw new Error('Sort chip was not rendered.');
    act(() => sortChip.props.onPress());
    const amountOption = renderer.root.findAll((node) => String(node.type) === 'pressable').find((node) =>
      node.findAll((child) => String(child.type) === 'text').some((textNode) => textNode.children.join('') === 'Amount'),
    );
    if (!amountOption) throw new Error('Amount sort option was not rendered.');
    act(() => amountOption.props.onPress());
    expect(titles()).toEqual(['Food groceries', 'Food lunch']);
    mockData.transactions = [{
      id: 'withdrawal',
      type: 'income',
      amount: 5_000,
      category: 'Withdrawal',
      note: 'Cash withdrawal',
      date: '2026-10-10',
    }];
  });
});
