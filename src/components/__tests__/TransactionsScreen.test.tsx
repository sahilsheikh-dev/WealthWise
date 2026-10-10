import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionsScreen from '../../../app/(tabs)/transactions';
import { THEME_IDS, type ThemeId } from '../../domain/types';

const mockData = {
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

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
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
  AppHeader: ({ title }: { title: string }) => {
    const ReactModule = jest.requireActual('react') as typeof React;
    return ReactModule.createElement('text', null, title);
  },
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    View: node('view'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
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
    Fab: node('fab'),
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
    expect(text).toContain('No earned income logged this month');
    expect(text).toContain('Includes ₹5,000 withdrawn from investments');
  });
});
