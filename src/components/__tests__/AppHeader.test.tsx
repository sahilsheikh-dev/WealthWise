import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { AppHeader } from '../AppHeader';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);
jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    canGoBack: () => mockCanGoBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../HeaderMenu', () => ({ HeaderMenu: () => null }));
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: { children: React.ReactNode }) => ReactModule.createElement('text', null, children),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { bg: '#000', surface: '#111', border: '#222', text1: '#fff', text2: '#ddd', text3: '#888', primary: '#08f', err: '#f00' },
  }),
}));

describe('AppHeader', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReturnValue(false);
  });

  it('renders back, icon actions, and the menu affordance', () => {
    const onAdd = jest.fn();
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(
        <AppHeader
          title="Assets"
          showBack
          fallbackHref="/assets"
          rightActions={[{ icon: 'plus', label: 'New asset', onPress: onAdd }]}
          menu={[]}
        />,
      );
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Header renderer was not created.');
    const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' });
    expect(buttons.some((button) => button.props.accessibilityLabel === 'Go back')).toBe(true);
    const addButton = buttons.find((button) => button.props.accessibilityLabel === 'New asset');
    const menuButton = buttons.find((button) => button.props.accessibilityLabel === 'More options');
    expect(addButton).toBeDefined();
    expect(menuButton).toBeDefined();
    act(() => addButton?.props.onPress());
    expect(onAdd).toHaveBeenCalledTimes(1);
    act(() => buttons.find((button) => button.props.accessibilityLabel === 'Go back')?.props.onPress());
    expect(mockReplace).toHaveBeenCalledWith('/assets');
  });

  it('uses navigation history when available', () => {
    mockCanGoBack.mockReturnValue(true);
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(<AppHeader title="Details" showBack />);
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Header renderer was not created.');
    const backButton = renderer.root.findByProps({ accessibilityLabel: 'Go back' });
    act(() => backButton.props.onPress());
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
