import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import HomeScreen from '../../../app/(tabs)';
import { emptyAppData } from '../../domain/actions';
import { THEME_IDS, type ThemeId } from '../../domain/types';

const mockThemeId: { current: ThemeId } = { current: 'system' };
const mockData = { ...emptyAppData('2026-10-10'), settings: { ...emptyAppData('2026-10-10').settings, name: 'Demo' } };

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('../../data/useAppData', () => ({ useAppData: () => mockData }));
jest.mock('../../data/store', () => ({
  useAppStore: (selector: (state: { devActions: undefined }) => unknown) => selector({ devActions: undefined }),
}));
jest.mock('../../data/metaStore', () => ({
  createMetaStore: () => ({ getMeta: async () => ({}), updateMeta: async () => ({}) }),
}));
jest.mock('../../lib/confirm', () => ({ choiceAsync: async () => null, confirmAsync: async () => true }));
jest.mock('../../lib/clock', () => ({ currentHour: () => 9, todayISO: () => '2026-10-10' }));
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
jest.mock('../../components/AppHeader', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title) };
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
    Platform: { OS: 'ios' },
    StyleSheet: { create: (styles: object) => styles },
    View: node('view'),
  };
});

describe('Home screen theme smoke', () => {
  it.each(THEME_IDS)('renders Home with the %s palette', async (id) => {
    mockThemeId.current = id;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(<HomeScreen />);
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Home did not render.');
    expect(renderer.root.findAllByType('text').map((node) => node.children.join(' '))).toContain('Net Worth');
  });
});
