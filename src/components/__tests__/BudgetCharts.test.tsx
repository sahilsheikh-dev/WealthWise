import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PaceLine, SectionBars, StackedBar } from '../BudgetCharts';
import type { BudgetOverview } from '../../domain/budget';

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
jest.mock('../AmountText', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AmountText: ({ value }: { value: number }) => ReactModule.createElement('text', null, String(value)),
  };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: 'blue',
      ok: 'green',
      err: 'red',
      purple: 'purple',
      text1: 'black',
      text2: 'gray',
      text3: 'dimgray',
      surface: 'white',
      surface2: 'lightgray',
      surface3: 'gray',
      bg: 'white',
      border: 'gray',
    },
  }),
}));

const summary = 'Accessible chart summary.';
const sections: BudgetOverview['sections'] = [{
  id: 'survival',
  name: 'Survival (Needs)',
  planned: 100,
  actual: 125,
  items: [],
}];

describe('Budget overview charts', () => {
  it('renders proportional planned/actual stack segments, hides zero segments and describes overage', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <StackedBar
          summary={summary}
          values={{
            income: { planned: 1_000, actual: 100 },
            spend: { planned: 600, actual: 60 },
            invest: { planned: 200, actual: 40 },
            left: { planned: 200, actual: 0 },
          }}
        />,
      );
    });
    if (!renderer) throw new Error('StackedBar renderer was not created.');
    expect(renderer.root.findByProps({ testID: 'stacked-bar' }).props.accessibilityLabel).toBe(summary);
    expect(renderer.root.findByProps({ testID: 'stacked-segment-planned-spend' }).props.style.width).toBe('60%');
    expect(renderer.root.findByProps({ testID: 'stacked-segment-planned-invest' }).props.style.width).toBe('20%');
    expect(renderer.root.findByProps({ testID: 'stacked-segment-planned-left' }).props.style.width).toBe('20%');
    expect(renderer.root.findAllByProps({ testID: 'stacked-segment-actual-left' })).toHaveLength(0);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes(summary))).toBe(true);
    act(() => renderer?.update(
      <StackedBar
        summary="Actual over by ₹150."
        values={{
          income: { planned: 1_000, actual: 200 },
          spend: { planned: 600, actual: 250 },
          invest: { planned: 200, actual: 100 },
          left: { planned: 200, actual: -150 },
        }}
      />,
    ));
    expect(renderer.root.findByProps({ testID: 'stacked-segment-actual-over' }).props.style).toMatchObject({
      width: '30%',
      backgroundColor: 'red',
    });
    expect(renderer.root.findByProps({ testID: 'stacked-bar' }).props.accessibilityLabel)
      .toBe('Actual over by ₹150.');
  });

  it('clamps actual section overlays to the planned track and marks overages distinctly', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<SectionBars sections={sections} summary={summary} />);
    });
    if (!renderer) throw new Error('SectionBars renderer was not created.');
    expect(renderer.root.findByProps({ testID: 'section-bars' }).props.accessibilityLabel).toBe(summary);
    expect(renderer.root.findByProps({ testID: 'section-bar-overlay-survival' }).props.style).toMatchObject({
      width: '100%',
      backgroundColor: 'red',
    });
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes(summary))).toBe(true);
  });

  it('waits for measured width before drawing the pace lines and renders rotated segments with dots', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    const pace: NonNullable<BudgetOverview['pace']> = {
      days: 3,
      planned: [10, 20, 30],
      actual: [5, 15],
    };
    act(() => {
      renderer = TestRenderer.create(<PaceLine pace={pace} summary={summary} />);
    });
    if (!renderer) throw new Error('PaceLine renderer was not created.');
    expect(renderer.root.findAll((node) => node.props.testID === 'pace-planned-segment-0')).toHaveLength(0);
    const plot = renderer.root.findByProps({ testID: 'pace-line-container' });
    expect(plot.props.accessibilityLabel).toBe(summary);
    act(() => plot.props.onLayout({ nativeEvent: { layout: { width: 300, height: 92, x: 0, y: 0 } } }));
    expect(renderer.root.findByProps({ testID: 'pace-planned-segment-0' }).props.style.transform)
      .toEqual([expect.objectContaining({ rotate: expect.stringMatching(/rad$/) })]);
    expect(renderer.root.findAll((node) =>
      String(node.type) === 'view' && String(node.props.testID).startsWith('pace-planned-dot-'),
    )
      .map((node) => node.props.testID)).toEqual([
      'pace-planned-dot-0', 'pace-planned-dot-1', 'pace-planned-dot-2',
    ]);
    expect(renderer.root.findAll((node) =>
      String(node.type) === 'view' && String(node.props.testID).startsWith('pace-actual-segment-'),
    )).toHaveLength(1);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes(summary))).toBe(true);
  });
});
