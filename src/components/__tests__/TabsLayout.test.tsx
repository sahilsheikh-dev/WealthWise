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
  return { Tabs };
});

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
});
