import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { BottomTabBar } from '../ui';

let mockInsets = { bottom: 0 };

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    Feather: (props: Record<string, unknown>) => ReactModule.createElement('feather', props),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      surface: 'surface',
      border: 'border',
      primary: 'primary',
      text3: 'inactive',
    },
  }),
}));

function renderBar(activeTab: string, bottomInset: number) {
  mockInsets = { bottom: bottomInset };
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(<BottomTabBar activeTab={activeTab} onSelect={jest.fn()} />);
  });
  if (!renderer) throw new Error('Bottom tab bar did not render.');
  return renderer;
}

describe('shared bottom tab bar', () => {
  it('renders the canonical labels and icons with exactly one selected destination', () => {
    const onSelect = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<BottomTabBar activeTab="budget" onSelect={onSelect} />);
    });
    if (!renderer) throw new Error('Bottom tab bar did not render.');
    const root = renderer.root;

    const tabs = ['index', 'transactions', 'goals', 'budget']
      .map((key) => root.findByProps({ testID: `bottom-tab-${key}` }));
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Home', 'Transactions', 'Goals', 'Budget',
    ]);
    expect(tabs.map((tab) => tab.props.accessibilityState.selected)).toEqual([
      false, false, false, true,
    ]);
    expect(tabs.map((tab) => tab.props.testID)).toEqual([
      'bottom-tab-index', 'bottom-tab-transactions', 'bottom-tab-goals', 'bottom-tab-budget',
    ]);

    const icons = root.findAll((node) => String(node.type) === 'feather');
    expect(icons.map((icon) => icon.props.name)).toEqual(['home', 'repeat', 'target', 'pie-chart']);
    expect(icons.map((icon) => icon.props.color)).toEqual([
      'inactive', 'inactive', 'inactive', 'primary',
    ]);
    const labels = ['index', 'transactions', 'goals', 'budget']
      .map((key) => root.findByProps({ testID: `bottom-tab-label-${key}` }));
    expect(labels.map((label) => label.props.children)).toEqual(['Home', 'Transactions', 'Goals', 'Budget']);

    act(() => tabs[1]?.props.onPress());
    expect(onSelect).toHaveBeenCalledWith('transactions');
  });

  it('uses content-driven height, a 44-point target and top/bottom inset padding', () => {
    const renderer = renderBar('index', 24);
    const bar = renderer.root.findByProps({ testID: 'bottom-tab-bar' });
    const tab = renderer.root.findByProps({ testID: 'bottom-tab-index' });
    const label = renderer.root.findByProps({ testID: 'bottom-tab-label-index' });
    const barStyles = (bar.props.style as unknown[]).filter(
      (style): style is Record<string, unknown> => typeof style === 'object' && style !== null,
    );
    const itemStyles = tab.props.style as Record<string, unknown>;

    expect(barStyles).toEqual(expect.arrayContaining([
      expect.objectContaining({ paddingTop: 10 }),
      expect.objectContaining({ paddingBottom: 24 }),
    ]));
    expect(barStyles.every((style) => !('height' in style))).toBe(true);
    expect(itemStyles).toEqual(expect.objectContaining({ minHeight: 44 }));
    expect(label.props.allowFontScaling).toBe(true);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.75);
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ textAlign: 'center', flexShrink: 1 }),
    ]));
  });

  it.each([1, 1.3, 2])('keeps tab labels scalable without fixed-height clipping at font scale %s', (fontScale) => {
    const renderer = renderBar('transactions', 0);
    const tabs = ['index', 'transactions', 'goals', 'budget']
      .map((key) => renderer.root.findByProps({ testID: `bottom-tab-${key}` }));
    expect(tabs).toHaveLength(4);
    for (const tab of tabs) {
      const label = renderer.root.findByProps({
        testID: `bottom-tab-label-${String(tab.props.testID).replace('bottom-tab-', '')}`,
      });
      expect(label.props.allowFontScaling).toBe(true);
      expect(label.props.adjustsFontSizeToFit).toBe(true);
      expect(label.props.minimumFontScale).toBe(0.75);
      expect(label.props.numberOfLines).toBe(1);
      expect(label.props.style).toEqual(expect.arrayContaining([
        expect.objectContaining({ lineHeight: undefined }),
      ]));
      expect(tab.props.style).toEqual(expect.objectContaining({ minHeight: 44 }));
    }
    expect(fontScale).toBeGreaterThanOrEqual(1);
  });
});
