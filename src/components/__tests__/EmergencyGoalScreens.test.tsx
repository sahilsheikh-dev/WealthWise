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
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Text: node('text'),
    View: node('view'),
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
  { label: 'without expense history', stored: 100_000, expenses: 0, shortTarget: '₹1.00 L', fullTarget: '₹1,00,000', raised: false },
  { label: 'below the minimum', stored: 50_000, expenses: 20_000, shortTarget: '₹60,000', fullTarget: '₹60,000', raised: true },
  { label: 'above the minimum', stored: 80_000, expenses: 20_000, shortTarget: '₹80,000', fullTarget: '₹80,000', raised: false },
] as const;

describe('three-month emergency target screens', () => {
  it.each(THEME_IDS.flatMap((themeId) => scenarios.map((scenario) => ({ ...scenario, themeId }))))(
    'shows effective goal targets across Home, Goals, and Emergency fund $label with $themeId theme',
    async ({ stored, expenses, shortTarget, fullTarget, raised, themeId }) => {
      mockThemeId.current = themeId;
      mockData.current = fixture(stored, expenses);
      let home: TestRenderer.ReactTestRenderer | undefined;
      await act(async () => {
        home = TestRenderer.create(<HomeScreen />);
        await Promise.resolve();
      });
      if (!home) throw new Error('Home did not render.');
      assertNoVerbText(home.root);
      const homeText = home.root.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
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
      const goalsText = goalsRenderer.root.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
      const emergencyText = emergencyRenderer.root.findAllByType('text').map((node) => node.children.join(' ')).join(' ');
      expect(homeText).toContain(shortTarget);
      expect(goalsText).toContain(shortTarget);
      expect(emergencyText).toContain(fullTarget);
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
});
