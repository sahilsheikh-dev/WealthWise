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
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('../../data/useAppData', () => ({ useAppData: () => mockData.current }));
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
    Chip: node('chip'),
    ChipRow: node('chiprow'),
    DetailTabBar: node('tabbar'),
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
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Text: node('text'),
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: 1 }),
  };
});

function fixture(storedTarget: number, expenses: number): AppData {
  const empty = emptyAppData('2026-10-11');
  return {
    ...empty,
    goals: [{
      id: 'ef-goal',
      name: 'Emergency fund',
      target: storedTarget,
      saved: 0,
      year: 2028,
      auto: 'ef',
      links: [],
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
  { label: 'without expense history', stored: 100_000, expenses: 0, rowTarget: '₹1,00,000', heroTarget: '₹1.00 L', raised: false },
  { label: 'below the minimum', stored: 50_000, expenses: 20_000, rowTarget: '₹60,000', heroTarget: '₹60,000', raised: true },
  { label: 'above the minimum', stored: 80_000, expenses: 20_000, rowTarget: '₹80,000', heroTarget: '₹80,000', raised: false },
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
  it.each(THEME_IDS.flatMap((themeId) => scenarios.map((scenario) => ({ ...scenario, themeId }))))(
    'shows effective goal targets across Home, Goals, and Emergency fund $label with $themeId theme',
    async ({ stored, expenses, rowTarget, heroTarget, raised, themeId }) => {
      mockThemeId.current = themeId;
      mockData.current = fixture(stored, expenses);
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
      expect(homeText).toContain(rowTarget);
      expect(goalsText).toContain(rowTarget);
      expect(emergencyText).toContain(heroTarget);
      if (raised) {
      expect(homeText).toContain('Raised to the 3-month minimum');
      expect(goalsText).toContain('Raised to the 3-month minimum');
      expect(emergencyText).toContain('Raised to the 3-month minimum');
      } else {
      expect(homeText).not.toContain('Raised to the 3-month minimum');
      expect(goalsText).not.toContain('Raised to the 3-month minimum');
      expect(emergencyText).not.toContain('Raised to the 3-month minimum');
      }
      if (expenses > 0) {
      expect(homeText).toMatch(/Based on an average of\s+₹20,000\s+monthly expenses/);
      expect(goalsText).toMatch(/Based on an average of\s+₹20,000\s+monthly expenses/);
      expect(emergencyText).toMatch(/Based on an average of\s+₹20,000\s+monthly expenses/);
      } else {
      expect(homeText).toContain('Add expenses to calculate your 3-month minimum');
      expect(goalsText).toContain('Add expenses to calculate your 3-month minimum');
      expect(emergencyText).toContain('Add expenses to calculate your 3-month minimum');
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
    expect(text).toContain('Linking does not move money or change your net worth.');
    expect(text).toContain('Do not record the same money as both an emergency fund balance and an investment.');
    expect(renderer.root.findByProps({
      accessibilityLabel: 'Linked ₹2,500 of ₹0 planned',
    })).toBeDefined();

    const customRow = renderer.root.findAll((node) => flattenStyle(node.props.style).paddingVertical === 8)[0];
    expect(customRow).toBeDefined();
    expect(flattenStyle(customRow?.props.style)).toMatchObject({ gap: 8, paddingVertical: 8, borderBottomWidth: 1 });
    const chip = renderer.root.findAll((node) => flattenStyle(node.props.style).borderRadius === 16)[0];
    expect(chip).toBeDefined();
    expect(flattenStyle(chip?.props.style)).toMatchObject({ flexDirection: 'row', flexWrap: 'wrap', minHeight: 34 });
  });
});
