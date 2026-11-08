import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionsScreen from '../../../app/(tabs)/transactions';
import { monthSummary } from '../../domain/transactions';
import { THEME_IDS, type ThemeId, type Transaction } from '../../domain/types';
import { formatMonth } from '../../lib/format';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

const mockData: { transactions: Transaction[]; [key: string]: unknown } = {
  settings: { name: 'Test', theme: 'light' as const, monthlySalary: null, onboarded: true },
  transactions: [{
    id: 'withdrawal',
    type: 'income' as const,
    amount: 5_000,
    category: 'Withdrawal',
    note: 'Emergency fund withdrawal',
    date: '2026-10-10',
  }],
  goals: [],
  holdings: [],
  liabilities: [],
  efEntries: [],
};
const mockThemeId: { current: ThemeId } = { current: 'light' };

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
    selector({ txMonth: '2026-10', setTxMonth: jest.fn() }),
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
    PanResponder: { create: (handlers: object) => ({ panHandlers: handlers }) },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    View: node('view'),
    Modal: ({ visible, children, ...props }: { visible: boolean; children?: React.ReactNode; [key: string]: unknown }) =>
      visible ? ReactModule.createElement('modal', props, children) : null,
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    useWindowDimensions: () => ({ fontScale: 1 }),
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
    ChipRow: node('chiprow'),
    EmptyState: ({ title }: { title: string }) => ReactModule.createElement('text', null, title),
    ListItem: node('listitem'),
    Screen: node('screen'),
    SearchField: node('searchfield'),
    StatPill: node('statpill'),
    WarningBanner: node('warning'),
  };
});

describe('Transactions screen withdrawals-only month', () => {
  it.each(THEME_IDS)('renders the withdrawals-only state under the %s theme', (id) => {
    mockThemeId.current = id;
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(<TransactionsScreen />);
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Transactions renderer was not created.');
    const text = renderer.root.findAllByType('text').map((element) => element.children.join('')).join(' ');
    expect(monthSummary(mockData.transactions, '2026-10')).toMatchObject({
      earnedIncome: 0,
      rates: null,
    });
    expect(text).toContain('No earned income logged this month');
    expect(text).toContain('Available balance');
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('What happened?');
    act(() => renderer.root.findAll((node) =>
      typeof node.props.accessibilityLabel === 'string'
      && node.props.accessibilityLabel.startsWith('Expand Available balance'),
    )[0]?.props.onPress());
    const expandedText = renderer.root.findAllByType('text').map((element) => element.children.join('')).join(' ');
    expect(expandedText).toContain('Other money in');
    expect(expandedText).toContain('Includes ₹5,000 from withdrawals, borrowing, loan proceeds and own funds');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add transaction' })).toBeDefined();
    expect(renderer.root.findAll((node) => String(node.type) === 'fab')).toHaveLength(0);
    assertNoVerbText(renderer.root);
  });

  it('routes plus straight to the transaction form and keeps money movement in the menu', () => {
    const { router } = jest.requireMock('expo-router') as { router: { push: jest.Mock } };
    router.push.mockClear();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<TransactionsScreen />);
    });
    if (!renderer) throw new Error('Transactions renderer was not created.');

    expect(renderer.root.findAll((node) => String(node.type) === 'modal')).toHaveLength(0);
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Add transaction' }).props.onPress());
    expect(router.push).toHaveBeenCalledWith('/transaction-form');
    expect(renderer.root.findAll((node) => String(node.type) === 'modal')).toHaveLength(0);

    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Record money movement' }).props.onPress());
    expect(renderer.root.findAll((node) => String(node.type) === 'modal')).toHaveLength(1);
    expect(renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' '))
      .toContain('What happened?');
  });

  it('keeps the collapsed balance card compact and expands its five rows and review actions', () => {
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
      const hasReviewDot = () => renderer?.root.findAll((node) => {
        const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
        return styles.some((style) =>
          style && typeof style === 'object' && style.width === 6 && style.height === 6,
        );
      }).length ?? 0;
      const cashCard = renderer.root.findAll((node) => {
        const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
        return styles.some((style) => style && typeof style === 'object' && style.maxHeight === 64);
      })[0];
      if (!cashCard) throw new Error('The constrained cash-flow card was not rendered.');
      expect(cashCard.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ minHeight: 60, maxHeight: 64 }),
      ]));
      const collapsedFigures = cashCard.findAll((node) =>
        node.props.accessibilityLabel === '₹830' || node.props.accessibilityLabel === '₹600',
      ).map((node) => node.props.accessibilityLabel);
      expect([...new Set(collapsedFigures)]).toEqual(['₹830', '₹600']);
      expect(hasReviewDot()).toBeGreaterThan(0);
      const collapsedLabels = cashCard.findAllByType('text').map((node) => node.children.join(' '));
      expect(collapsedLabels.filter((label) => /^-?₹/.test(label))).toEqual(['₹830', '₹600']);
      expect(collapsedLabels).toContain('Available balance');
      expect(collapsedLabels.some((label) => label.includes('From') && label.includes('Sep'))).toBe(true);
      expect(collapsedLabels).not.toContain('Brought forward');

      act(() => renderer?.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Expand Available balance'),
      )[0]?.props.onPress());
      const expandedText = cashCard.findAllByType('text')
        .map((node) => node.children.join(' '))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      for (const label of ['Brought forward', 'Income', 'Other money in', 'Spent', 'Invested']) {
        expect(expandedText).toContain(label);
      }
      expect(expandedText).toContain('Includes ₹20 from withdrawals, borrowing, loan proceeds and own funds');

      const reviewLabel = `Review ${formatMonth('2026-09')}`;
      expect(renderer.root.findByProps({ accessibilityLabel: reviewLabel })).toBeDefined();
      const reviewButton = renderer.root.findAll((node) => String(node.type) === 'pressable')
        .find((node) => node.findAllByType('text').some((text) =>
          text.children.join(' ').replace(/\s+/g, ' ').trim() === reviewLabel,
        ));
      if (!reviewButton) throw new Error('Expanded review action was not rendered.');
      act(() => reviewButton.props.onPress());
      expect(router.push).toHaveBeenCalledWith({ pathname: '/month-review', params: { month: '2026-09' } });
      act(() => renderer?.root.findByProps({ accessibilityLabel: 'Dismiss month review reminder' }).props.onPress());
      expect(cashCard.findAllByType('text')
        .map((node) => node.children.join(' '))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()).not.toContain(reviewLabel);
      expect(hasReviewDot()).toBe(0);
    } finally {
      mockData.transactions = previousTransactions;
      routeParams.mockReturnValue({});
    }
  });

  it('marks a negative available balance as a shortfall with the danger tone', () => {
    const previousTransactions = mockData.transactions;
    mockData.transactions = [
      { id: 'small-income', type: 'income', amount: 20, category: 'Salary', note: 'Pay', date: '2026-10-01' },
      { id: 'large-expense', type: 'expense', amount: 150, category: 'Food', note: 'Food', date: '2026-10-02' },
    ];
    try {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<TransactionsScreen />);
      });
      if (!renderer) throw new Error('Transactions renderer was not created.');
      const balanceLabel = renderer.root.findAll((node) =>
        typeof node.props.accessibilityLabel === 'string'
        && node.props.accessibilityLabel.startsWith('Expand Available balance'),
      )[0];
      if (!balanceLabel) throw new Error('Available balance control was not rendered.');
      expect(balanceLabel.props.accessibilityLabel).toContain('-₹130');
      expect(balanceLabel.findAllByType('text').map((node) => node.children.join(' ')).join(' ')).toContain('Shortfall');
      const amount = renderer.root.findByProps({ accessibilityLabel: '-₹130' });
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
      note: 'Emergency fund withdrawal',
      date: '2026-10-10',
    }];
  });
});
