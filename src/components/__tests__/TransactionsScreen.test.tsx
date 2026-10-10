import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TransactionsScreen from '../../../app/(tabs)/transactions';

const mockData = {
  settings: { name: 'Test', theme: 'light' as const },
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
const mockThemeColors = {
  bg: '#fff', surface: '#fff', surface2: '#eee', surface3: '#ddd', border: '#ccc',
  text1: '#111', text2: '#333', text3: '#666', primary: '#00f', primaryDim: '#eef',
  ok: '#0a0', okDim: '#efe', err: '#f00', errDim: '#fee', info: '#08f',
  infoDim: '#eef', purple: '#80f', purpleDim: '#fef',
};

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('../../data/useAppData', () => ({
  useAppData: () => mockData,
}));
jest.mock('../../data/uiStore', () => ({
  useUIStore: (selector: (state: { txMonth: string; setTxMonth: jest.Mock }) => unknown) =>
    selector({ txMonth: '2026-10', setTxMonth: jest.fn() }),
}));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: mockThemeColors, isDark: false, themePreference: 'light', toggleTheme: jest.fn() }),
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
  it('renders the no-earned-income and investment withdrawal lines without crashing', () => {
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
