import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import TabsLayout from '../../../app/(tabs)/_layout';

const mockFontScale = 2;

jest.mock('expo-router', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const Tabs = Object.assign(
    ({ children, screenOptions }: { children: React.ReactNode; screenOptions: unknown }) =>
      ReactModule.createElement('tabs', { screenOptions }, children),
    {
      Screen: (props: { name: string; options: unknown }) => ReactModule.createElement('screen', props),
    },
  );
  return { Tabs };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('../../../src/theme/useTheme', () => ({
  useTheme: () => ({ colors: { border: 'gray', primary: 'blue', surface: 'white', text3: 'gray' } }),
}));
jest.mock('../../../src/theme/tokens', () => ({ typography: { navLabel: { fontSize: 11 } } }));
jest.mock('../../../src/components/ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: (props: Record<string, unknown>) => {
      const scaleStyle = (style: unknown) => {
        if (!style || typeof style !== 'object') return style;
        const styleRecord = style as Record<string, unknown>;
        return typeof styleRecord.fontSize === 'number'
          ? { ...styleRecord, fontSize: styleRecord.fontSize * mockFontScale }
          : style;
      };
      const style = Array.isArray(props.style) ? props.style.map(scaleStyle) : scaleStyle(props.style);
      return ReactModule.createElement('text', { ...props, style });
    },
  };
});
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    Feather: (props: Record<string, unknown>) => ReactModule.createElement('feather', props),
  };
});
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('view', props, children),
  };
});

describe('bottom tab layout', () => {
  it('keeps Home, Txns, Goals, Budget ordered and labels usable at 2.0 font scale', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<TabsLayout />);
    });
    if (!renderer) throw new Error('Tabs layout did not render.');

    const tabs = renderer.root.findAll((node) => String(node.type) === 'tabs')[0];
    if (!tabs) throw new Error('Expo Tabs did not render.');
    expect(renderer.root.findAll((node) => String(node.type) === 'screen').map((node) => node.props.name))
      .toEqual(['index', 'transactions', 'goals', 'budget']);

    const optionsFor = tabs.props.screenOptions as (input: { route: { name: string } }) => {
      tabBarStyle: { height: number };
      tabBarIcon: (input: { color: string; size: number }) => React.ReactElement;
    };
    expect(optionsFor({ route: { name: 'budget' } }).tabBarStyle.height).toBeGreaterThanOrEqual(76);
    const icons: string[] = [];
    const labels: string[] = [];
    for (const route of ['index', 'transactions', 'goals', 'budget']) {
      const options = optionsFor({ route: { name: route } });
      let iconRenderer: TestRenderer.ReactTestRenderer | undefined;
      act(() => {
        iconRenderer = TestRenderer.create(options.tabBarIcon({ color: 'blue', size: 24 }));
      });
      if (!iconRenderer) throw new Error('Tab icon did not render.');
      const feather = iconRenderer.root.findAll((node) => String(node.type) === 'feather')[0];
      if (!feather) throw new Error('Feather icon did not render.');
      icons.push(feather.props.name);
      const label = iconRenderer.root.findAll((node) => String(node.type) === 'text')[0];
      if (!label) throw new Error('Tab label did not render.');
      labels.push(label.children.join(''));
      expect(label.props.numberOfLines).toBe(1);
      expect(label.props.allowFontScaling).not.toBe(false);
      expect(label.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ fontSize: 22 }),
      ]));
      const tabContent = iconRenderer.root.findAll((node) => String(node.type) === 'view')[0];
      if (!tabContent) throw new Error('Tab content did not render.');
      expect(tabContent.props.style).toEqual(expect.objectContaining({ width: 100, minHeight: 44 }));
      act(() => iconRenderer?.unmount());
    }
    expect(labels).toEqual(['Home', 'Txns', 'Goals', 'Budget']);
    expect(new Set(icons).size).toBe(4);
  });
});
