import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TabsLayout from '../../../app/(tabs)/_layout';

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const Tabs = Object.assign(
    ({
      children,
      screenOptions,
      tabBar,
    }: {
      children: React.ReactNode;
      screenOptions: unknown;
      tabBar: (props: unknown) => React.ReactElement;
    }) => ReactModule.createElement('tabs', { screenOptions, tabBar }, children),
    {
      Screen: (props: { name: string; options: unknown }) => ReactModule.createElement('screen', props),
    },
  );
  return { Tabs, router: { replace: jest.fn() } };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    Feather: (props: Record<string, unknown>) => ReactModule.createElement('feather', props),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('../../../src/theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: 'surface',
      border: 'border',
      primary: 'primary',
      text1: 'text',
      text3: 'inactive',
    },
  }),
}));
jest.mock('../../../src/components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    BottomTabBar: ({ activeTab, onSelect }: { activeTab: string; onSelect: (tab: string) => void }) =>
      ReactModule.createElement('bottomtabbar', { activeTab, onSelect }),
  };
});
jest.mock('../../components/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: () => null,
}));

const { BottomTabBar: ActualBottomTabBar } = jest.requireActual('../../../src/components/ui') as typeof import('../../../src/components/ui');

describe('bottom tab layout', () => {
  it('keeps the required route order and delegates its only bar to the shared presentation', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<TabsLayout />);
    });
    if (!renderer) throw new Error('Tabs layout did not render.');

    const tabs = renderer.root.findAll((node) => String(node.type) === 'tabs')[0];
    if (!tabs) throw new Error('Expo Tabs did not render.');
    expect(renderer.root.findAll((node) => String(node.type) === 'screen').map((node) => node.props.name))
      .toEqual(['index', 'transactions', 'goals', 'budget']);
    expect(tabs.props.screenOptions).toEqual({ headerShown: false, tabBarShowLabel: false });

    const navigate = jest.fn();
    let barRenderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      barRenderer = TestRenderer.create((tabs.props.tabBar as (props: unknown) => React.ReactElement)({
        state: {
          index: 2,
          routes: [{ name: 'index' }, { name: 'transactions' }, { name: 'goals' }, { name: 'budget' }],
        },
        navigation: { navigate },
      }));
    });
    if (!barRenderer) throw new Error('The shared bar renderer did not render.');
    const bars = barRenderer.root.findAll((node) => String(node.type) === 'bottomtabbar');
    expect(bars).toHaveLength(1);
    expect(bars[0]?.props.activeTab).toBe('goals');
    act(() => bars[0]?.props.onSelect('budget'));
    expect(navigate).toHaveBeenCalledWith('budget');
  });

  it.each([1, 1.3, 2])('keeps Transactions in one fitting line at font scale %s', (fontScale) => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<ActualBottomTabBar activeTab="transactions" onSelect={jest.fn()} />);
    });
    if (!renderer) throw new Error('Shared tab bar did not render.');

    const tab = renderer.root.findByProps({ testID: 'bottom-tab-transactions' });
    const label = renderer.root.findByProps({ testID: 'bottom-tab-label-transactions' });
    expect(label.props.children).toBe('Transactions');
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.allowFontScaling).toBe(true);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.75);
    expect(label.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ alignSelf: 'stretch', flexShrink: 1, textAlign: 'center' }),
    ]));
    expect(tab.props.style).toEqual(expect.objectContaining({ minHeight: 44 }));
    expect(fontScale).toBeGreaterThanOrEqual(1);
  });
});
