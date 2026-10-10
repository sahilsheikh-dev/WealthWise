import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { ScreenErrorBoundary } from '../ScreenErrorBoundary';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement('text', null, children),
    Button: ({ label, onPress }: { label: string; onPress: () => void }) =>
      ReactModule.createElement('button', {
        accessibilityRole: 'button',
        accessibilityLabel: label,
        onPress,
      }, label),
    Card: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement('card', null, children),
    Screen: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement('screen', null, children),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { bg: '#000', surface: '#111', border: '#222', text1: '#fff', text3: '#888', primary: '#08f' },
    isDark: true,
    themePreference: 'dark',
    toggleTheme: jest.fn(),
  }),
}));

describe('ScreenErrorBoundary', () => {
  it('renders the fallback and invokes retry or home navigation', () => {
    const retry = jest.fn();
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(
        <ScreenErrorBoundary error={new Error('technical failure')} retry={retry} />,
      );
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Error boundary renderer was not created');
    const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' });
    expect(renderer.root.findByProps({ children: 'Something went wrong on this screen' })).toBeTruthy();
    const retryButton = buttons.find((button) => button.props.accessibilityLabel === 'Try again');
    const homeButton = buttons.find((button) => button.props.accessibilityLabel === 'Go to Home');
    expect(retryButton).toBeDefined();
    expect(homeButton).toBeDefined();
    act(() => retryButton?.props.onPress());
    expect(retry).toHaveBeenCalledTimes(1);
    act(() => homeButton?.props.onPress());
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
