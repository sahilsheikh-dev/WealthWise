import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { AppHeader } from '../AppHeader';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);
const mockMenuAction = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    canGoBack: () => mockCanGoBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../useAppMenu', () => ({
  useAppMenu: () => [
    { label: 'Backup and restore', icon: 'download', onPress: mockMenuAction },
    { label: 'Security', icon: 'lock', onPress: mockMenuAction },
    { label: 'Profile', icon: 'user', onPress: mockMenuAction },
    { label: 'Theme', icon: 'sliders', onPress: mockMenuAction },
    { label: 'Erase all data', icon: 'trash-2', destructive: true, onPress: mockMenuAction },
  ],
}));
jest.mock('../HeaderMenu', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    HeaderMenu: ({ visible, items }: { visible: boolean; items: { label: string; onPress: () => void }[] }) =>
      visible
        ? ReactModule.createElement('menu', null, ...items.map((item) =>
          ReactModule.createElement('button', {
            key: item.label,
            accessibilityRole: 'menuitem',
            accessibilityLabel: item.label,
            onPress: item.onPress,
          }, item.label)))
        : null,
  };
});
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: { children: React.ReactNode }) => ReactModule.createElement('text', null, children),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: jest.requireActual('../../theme/themes').themes.dark.colors,
  }),
}));

describe('AppHeader', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack.mockReturnValue(false);
    mockMenuAction.mockClear();
  });

  it('renders back, icon actions, and an explicit menu without adding the default', () => {
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

  it('shows the default menu when there are no right-side props and opens the global items', () => {
    const rendererRef: { current?: TestRenderer.ReactTestRenderer } = {};
    act(() => {
      rendererRef.current = TestRenderer.create(<AppHeader title="Transactions" />);
    });
    const renderer = rendererRef.current;
    if (!renderer) throw new Error('Header renderer was not created.');
    const more = renderer.root.findByProps({ accessibilityLabel: 'More options' });
    act(() => more.props.onPress());
    const menuItems = renderer.root.findAllByProps({ accessibilityRole: 'menuitem' });
    expect(menuItems.map((item) => item.props.accessibilityLabel)).toEqual([
      'Backup and restore', 'Security', 'Profile', 'Theme', 'Erase all data',
    ]);
    act(() => menuItems.find((item) => item.props.accessibilityLabel === 'Backup and restore')?.props.onPress());
    expect(mockMenuAction).toHaveBeenCalledTimes(1);
  });

  it('renders only the supplied right-side content for every menu/action combination', () => {
    const menu = [{ label: 'Only menu', icon: 'edit' as const, onPress: jest.fn() }];
    const action = { icon: 'plus' as const, label: 'Add', onPress: jest.fn() };
    const cases = [
      { props: { title: 'Actions', rightActions: [action] }, expected: ['Add'] },
      { props: { title: 'Menu', menu }, expected: ['More options'] },
      { props: { title: 'Both', rightActions: [action], menu }, expected: ['Add', 'More options'] },
      { props: { title: 'No menu', showDefaultMenu: false }, expected: [] },
    ];
    for (const { props, expected } of cases) {
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => { renderer = TestRenderer.create(<AppHeader {...props} />); });
      if (!renderer) throw new Error('Header renderer was not created.');
      const labels = [...new Set(renderer.root.findAllByProps({ accessibilityRole: 'button' })
        .map((button) => button.props.accessibilityLabel)
        .filter((label) => label !== 'Go back'))];
      expect(labels).toEqual(expected);
      act(() => renderer?.unmount());
    }
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
