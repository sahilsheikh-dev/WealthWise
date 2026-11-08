import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { PaceLine } from '../BudgetCharts';
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
    colors: {
      primary: 'blue',
      ok: 'green',
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

const summary = 'Spending pace through day 2: ₹18.00 actual; ₹36.00 planned by month end.';
const pace: NonNullable<BudgetOverview['pace']> = {
  days: 3,
  elapsedDays: 2,
  sections: [
    {
      id: 'food',
      name: 'Food',
      planned: [10, 20, 30],
      actual: [5, 15],
      plannedToDate: 20,
      actualToDate: 15,
    },
    {
      id: 'transport',
      name: 'Transport',
      planned: [2, 4, 6],
      actual: [1, 3],
      plannedToDate: 4,
      actualToDate: 3,
    },
    {
      id: 'income',
      name: 'Income',
      planned: [100, 200, 300],
      actual: [50, 150],
      plannedToDate: 200,
      actualToDate: 150,
    },
  ],
};

describe('Budget pace chart', () => {
  it('draws the aggregate spending pace only after measuring width and exposes accessible detail', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <PaceLine
          pace={pace}
          spendingSectionIds={['food', 'transport']}
          summary={summary}
          shortSummary="Left ₹250"
        />,
      );
    });
    if (!renderer) throw new Error('PaceLine renderer was not created.');
    const plot = renderer.root.findByProps({ testID: 'pace-line-container' });
    expect(renderer.root.findAll((node) => String(node.props.testID).startsWith('pace-planned-segment-')))
      .toHaveLength(0);
    expect(plot.props).toMatchObject({
      accessibilityRole: 'image',
      accessibilityLabel: summary,
    });
    expect(renderer.root.findAllByType('text')
      .map((node) => node.children.join(''))
      .filter((label) => label === 'Actual' || label === 'Planned pace'))
      .toEqual(['Actual', 'Planned pace']);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes('Left ₹250'))).toBe(true);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes(summary))).toBe(false);

    act(() => plot.props.onLayout({ nativeEvent: { layout: { width: 300, height: 92, x: 0, y: 0 } } }));
    expect(renderer.root.findByProps({ testID: 'pace-planned-segment-0' }).props.style.transform)
      .toEqual([expect.objectContaining({ rotate: expect.stringMatching(/rad$/) })]);
    expect(renderer.root.findAll((node) =>
      String(node.type) === 'view' && String(node.props.testID).startsWith('pace-planned-dot-'),
    ).map((node) => node.props.testID)).toEqual([
      'pace-planned-dot-0',
      'pace-planned-dot-1',
      'pace-planned-dot-2',
    ]);
    expect(renderer.root.findAll((node) =>
      String(node.type) === 'view' && String(node.props.testID).startsWith('pace-actual-segment-'),
    )).toHaveLength(1);
    expect(renderer.root.findByProps({ testID: 'pace-planned-dot-0' }).props.style.left).toBe(-3);
    expect(renderer.root.findByProps({ testID: 'pace-planned-dot-2' }).props.style.left).toBe(297);
  });
});
