import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import ThemeScreen from '../../../app/theme';
import { THEME_IDS, type ThemeId } from '../../domain/types';

const mockThemeId: { current: ThemeId } = { current: 'system' };

jest.mock('expo-router', () => ({}));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => {
    const { themes } = jest.requireActual('../themes') as typeof import('../themes');
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
  return {
    AppHeader: ({ title }: { title: string }) => ReactModule.createElement('text', null, title),
  };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({ ScreenErrorBoundary: () => null }));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return { AppText: node('text'), Card: node('card'), Screen: node('screen') };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Pressable: node('pressable'),
    View: node('view'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
  };
});

describe('theme screen', () => {
  it.each(THEME_IDS)('renders the selectable palette list with %s active', (id) => {
    mockThemeId.current = id;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<ThemeScreen />); });
    if (!renderer) throw new Error('Theme screen did not render.');
    expect(renderer.root.findAllByType('text').map((node) => node.children.join(' '))).toContain('Theme');
    const choices = renderer.root.findAll((node) =>
      String(node.type) === 'pressable' && node.props.accessibilityState !== undefined,
    );
    expect(choices.filter((node) => node.props.accessibilityState.selected === true)).toHaveLength(1);
    expect(choices.filter((node) => node.props.accessibilityState.selected === false))
      .toHaveLength(THEME_IDS.length - 1);
  });
});
