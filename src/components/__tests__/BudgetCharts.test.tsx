import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PaceLine, paceChartPalettes } from '../BudgetCharts';
import type { BudgetOverview } from '../../domain/budget';
import { contrastRatio } from '../../theme/contrast';
import { themes } from '../../theme/themes';

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    StyleSheet: {
      create: (styles: object) => styles,
      absoluteFill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
      hairlineWidth: 1,
    },
    View: node('view'),
    Pressable: node('pressable'),
    Text: node('text'),
    useWindowDimensions: () => ({ fontScale: 1 }),
  };
});
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      primary: '#4f46e5',
      ok: '#15803d',
      err: '#b91c1c',
      purple: '#7e22ce',
      text1: '#09090b',
      text2: '#52525b',
      text3: '#6b6b73',
      surface: '#ffffff',
      surface2: '#f4f4f5',
      surface3: '#e4e4e7',
      bg: '#ffffff',
      border: '#e4e4e7',
    },
  }),
}));

const summary = 'Survival: ₹15.00 actual vs ₹20.00 planned to date; ₹5.00 behind plan.';
const pace: NonNullable<BudgetOverview['pace']> = {
  days: 3,
  elapsedDays: 2,
  sections: [
    {
      id: 'survival',
      name: 'Survival',
      planned: [10, 20, 30],
      actual: [5, 15],
      plannedToDate: 20,
      actualToDate: 15,
    },
    {
      id: 'wants',
      name: 'Wants',
      planned: [2, 4, 6],
      actual: [1, 3],
      plannedToDate: 4,
      actualToDate: 3,
    },
  ],
};

describe('Budget pace chart', () => {
  it('draws one planned dashed and actual solid line per visible section with accessible comparisons', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PaceLine pace={pace} summary={summary} shortSummary="Left ₹250" />,
      );
    });
    if (!renderer) throw new Error('PaceLine renderer was not created.');
    const plot = renderer.root.findByProps({ testID: 'pace-line-container' });
    expect(renderer.root.findAllByProps({ testID: 'pace-series-survival-planned-segment-0-dash-0' }))
      .toHaveLength(0);
    expect(renderer.root.findByProps({ testID: 'pace-section-series-survival' }).props)
      .toMatchObject({
        accessibilityRole: 'image',
        accessibilityLabel: expect.stringContaining('actual vs'),
      });
    expect(renderer.root.findByProps({ testID: 'pace-section-toggle-survival' }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(renderer.root.findByProps({ testID: 'pace-section-toggle-wants' }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(renderer.root.findByProps({ testID: 'pace-y-axis' })).toBeDefined();
    expect(renderer.root.findByProps({ testID: 'pace-x-axis' }).findAllByType('text')
      .map((node) => node.children.join(''))).toEqual(['Day 1', 'Day 3']);
    expect(renderer.root.findByProps({ testID: 'pace-series-legend' }).findAllByType('text')
      .map((node) => node.children.join(''))).toEqual(['Actual', 'Planned']);
    expect([0, 1, 2].map((index) =>
      renderer?.root.findByProps({ testID: `pace-gridline-${index}` }),
    )).toHaveLength(3);

    act(() => plot.props.onLayout({ nativeEvent: { layout: { width: 300, height: 132, x: 0, y: 0 } } }));
    expect(renderer.root.findByProps({ testID: 'pace-series-survival-planned' })).toBeDefined();
    expect(renderer.root.findByProps({ testID: 'pace-series-survival-planned-segment-0-dash-0' }))
      .toBeDefined();
    expect(renderer.root.findByProps({ testID: 'pace-series-survival-actual-segment-0' })).toBeDefined();
    expect(renderer.root.findByProps({ testID: 'pace-series-wants-planned-segment-0-dash-0' }))
      .toBeDefined();
    expect(renderer.root.findByProps({ testID: 'pace-series-survival-planned-marker-0' }).props.testID)
      .toBe('pace-series-survival-planned-marker-0');
    expect(renderer.root.findByProps({ testID: 'pace-series-survival-actual-marker-0' }).props.testID)
      .toBe('pace-series-survival-actual-marker-0');
    expect(renderer.root.findByProps({ testID: 'pace-short-summary' }).props.accessibilityLabel).toBe(summary);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes(summary))).toBe(false);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes('Left ₹250'))).toBe(true);
  });

  it('uses legend chips to hide and restore each section pair', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PaceLine pace={pace} summary={summary} shortSummary="Left ₹250" />,
      );
    });
    if (!renderer) throw new Error('PaceLine renderer was not created.');
    const toggle = renderer.root.findByProps({ testID: 'pace-section-toggle-survival' });
    act(() => toggle.props.onPress());
    expect(renderer.root.findAllByProps({ testID: 'pace-section-series-survival' })).toHaveLength(0);
    expect(renderer.root.findByProps({ testID: 'pace-section-toggle-survival' }).props.accessibilityState)
      .toEqual({ selected: false });
    expect(renderer.root.findByProps({ testID: 'pace-section-series-wants' })).toBeDefined();
    act(() => renderer?.root.findByProps({ testID: 'pace-section-toggle-survival' }).props.onPress());
    expect(renderer.root.findByProps({ testID: 'pace-section-series-survival' })).toBeDefined();
  });

  it('keeps every section color at or above 3:1 contrast in light and dark themes', () => {
    for (const theme of Object.values(themes)) {
      const palette = theme.isDark ? paceChartPalettes.dark : paceChartPalettes.light;
      expect(new Set(palette).size).toBe(palette.length);
      for (const color of palette) {
        expect(contrastRatio(color, theme.colors.surface)).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
