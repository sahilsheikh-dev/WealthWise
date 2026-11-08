import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import HomeScreen from '../../../app/(tabs)';
import GoalsScreen from '../../../app/(tabs)/goals';
import EmergencyFundScreen from '../../../app/emergency-fund';
import { emptyAppData } from '../../domain/actions';
import { THEME_IDS, type AppData, type ThemeId } from '../../domain/types';
import { assertNoVerbText } from '../testUtils/assertNoVerbText';

const mockData: { current: AppData } = { current: emptyAppData('2026-10-11') };
const mockThemeId: { current: ThemeId } = { current: 'system' };

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
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
  return { AppHeader: () => ReactModule.createElement('header') };
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
    useWindowDimensions: () => ({ fontScale: 1 }),
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

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return typeof style === 'object' && style !== null ? style as Record<string, unknown> : {};
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

  it('shows custom allocation rows, linked holding values, and wrap-safe styles', () => {
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
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
    if (!renderer) throw new Error('Emergency fund did not render.');
    const text = renderedText(renderer.root);
    expect(text).toContain('Home reserve');
    expect(text).toContain('Savings account');
    expect(renderer.root.findAllByProps({ label: 'Manage links' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ label: 'Link assets' })).toHaveLength(0);
    expect(text).not.toContain('Deposit');
    expect(text).not.toContain('Withdraw');
    expect(text).not.toContain('Passbook');
    expect(renderer.root.findAllByProps({ label: 'Link assets' })).toHaveLength(0);

    const customRow = renderer.root.findAll((node) => flattenStyle(node.props.style).paddingVertical === 10)[0];
    expect(customRow).toBeDefined();
    expect(flattenStyle(customRow?.props.style)).toMatchObject({ gap: 5, paddingVertical: 10, borderBottomWidth: 1 });
    const chip = renderer.root.findAll((node) => flattenStyle(node.props.style).borderRadius === 16)[0];
    expect(chip).toBeDefined();
    expect(flattenStyle(chip?.props.style)).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap', minHeight: 30 });
  });

  it('offers to link assets when the allocation table is empty', () => {
    mockData.current = emptyAppData('2026-10-11');
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<EmergencyFundScreen />); });
    if (!renderer) throw new Error('Emergency fund did not render.');
    expect(renderer.root.findAllByProps({ title: 'No assets linked' }).length).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ label: 'Link assets' })).toBeDefined();
  });
});
