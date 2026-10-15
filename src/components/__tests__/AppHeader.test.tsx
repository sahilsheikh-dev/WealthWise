import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { AppHeader } from '../AppHeader';
import { ROUTE_KINDS } from '../../lib/routeKinds';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);
const mockMenuAction = jest.fn();
let mockPathname = '/';
let mockHardwareBack: (() => boolean) | undefined;
jest.mock('expo-router', () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    canGoBack: () => mockCanGoBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  usePathname: () => mockPathname,
}));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    BackHandler: {
      addEventListener: (_event: string, listener: () => boolean) => {
        mockHardwareBack = listener;
        return { remove: jest.fn() };
      },
    },
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
  };
});
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return { Feather: (props: Record<string, unknown>) => ReactModule.createElement('feather', props) };
});
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
    AppText: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      ReactModule.createElement('text', props, children),
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
    mockPathname = '/';
    mockHardwareBack = undefined;
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

  it('supports three 44pt actions and truncates a long title before the icons', () => {
    const actions = [
      { icon: 'clock' as const, label: 'History', onPress: jest.fn() },
      { icon: 'check-circle' as const, label: 'Month review, review pending', onPress: jest.fn(), showIndicator: true },
      { icon: 'layers' as const, label: 'Templates', onPress: jest.fn() },
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <AppHeader title="A very long budget title that should truncate" rightActions={actions} showDefaultMenu={false} />,
      );
    });
    if (!renderer) throw new Error('Budget header did not render.');

    const actionButtons = renderer.root.findAll((node) =>
      String(node.type) === 'pressable' && actions.some((action) => action.label === node.props.accessibilityLabel),
    );
    expect(actionButtons.map((button) => button.props.accessibilityLabel))
      .toEqual(['History', 'Month review, review pending', 'Templates']);
    for (const button of actionButtons) {
      expect(button.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ width: 44, height: 44 }),
      ]));
    }
    expect(renderer.root.findAll((node) => String(node.type) === 'feather').map((icon) => icon.props.name))
      .toEqual(['clock', 'check-circle', 'layers']);
    expect(renderer.root.findAll((node) =>
      String(node.type) === 'view' && node.props.testID === 'header-action-indicator',
    )).toHaveLength(1);
    const title = renderer.root.findAllByType('text').find((node) =>
      node.children.join('') === 'A very long budget title that should truncate',
    );
    expect(title?.props.numberOfLines).toBe(1);
    expect(title?.props.ellipsizeMode).toBe('tail');
    const titleBlock = renderer.root.findAllByType('view').find((node) =>
      (Array.isArray(node.props.style) ? node.props.style : [node.props.style]).some((style: unknown) =>
        typeof style === 'object' && style !== null && 'flex' in style && 'minWidth' in style,
      ),
    );
    expect(titleBlock?.props.style).toEqual(expect.objectContaining({ flex: 1, minWidth: 0 }));
    expect(360 - 40 - 10 - (3 * 44 + 2 * 8)).toBeGreaterThan(0);
  });

  it('preserves two-line title fitting for headers with no more than two actions', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <AppHeader title="Transactions" rightActions={[
          { icon: 'plus', label: 'Add transaction', onPress: jest.fn() },
        ]} />,
      );
    });
    if (!renderer) throw new Error('Header did not render.');
    const title = renderer.root.findAllByType('text').find((node) =>
      node.children.join('') === 'Transactions',
    );
    expect(title?.props.numberOfLines).toBe(2);
    expect(title?.props.ellipsizeMode).toBeUndefined();
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

  it('derives the correct left control and 44-point target for every registered route', () => {
    for (const [route, kind] of Object.entries(ROUTE_KINDS)) {
      mockPathname = `/${route}`;
      let renderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        renderer = TestRenderer.create(<AppHeader title={route} />);
      });
      if (!renderer) throw new Error(`Header did not render for ${route}.`);
      const expectedLabel = kind === 'form' ? 'Close' : kind === 'stack' ? 'Go back' : undefined;
      const controls = renderer.root.findAll((node) => String(node.type) === 'pressable')
        .filter((node) => node.props.accessibilityRole === 'button');
      if (expectedLabel) {
        const control = controls.find((node) => node.props.accessibilityLabel === expectedLabel);
        if (!control) throw new Error(`${route} did not render its ${expectedLabel} control.`);
        expect(control.props.style).toEqual(expect.arrayContaining([
          expect.objectContaining({ width: 44, height: 44 }),
        ]));
      } else {
        expect(controls.some((node) =>
          node.props.accessibilityLabel === 'Close' || node.props.accessibilityLabel === 'Go back',
        )).toBe(false);
      }
      act(() => renderer?.unmount());
    }
  });

  it('uses the Home fallback for both the header control and Android hardware back', () => {
    mockPathname = '/assets';
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<AppHeader title="Assets" />);
    });
    if (!renderer) throw new Error('Assets header did not render.');
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress());
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();

    mockReplace.mockClear();
    mockCanGoBack.mockReturnValue(true);
    act(() => {
      expect(mockHardwareBack?.()).toBe(true);
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    act(() => renderer?.unmount());
  });
});
