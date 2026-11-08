import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { MoneyField } from '../form/MoneyField';
import { PercentField } from '../form/PercentField';
import { SegmentedControl } from '../form/SegmentedControl';

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    TextInput: node('textinput'),
    View: node('view'),
  };
});

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      border: 'gray',
      err: 'red',
      primary: 'blue',
      primaryDim: 'lightblue',
      surface: 'white',
      surface2: 'lightgray',
      text1: 'black',
      text2: 'darkgray',
      text3: 'gray',
    },
  }),
}));

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});

function flattenedStyles(style: unknown): Record<string, unknown>[] {
  const values = Array.isArray(style) ? style.flat(Infinity) : [style];
  return values.filter((value): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null,
  );
}

describe('compact budget field styles', () => {
  it('keeps amount and percentage inputs compact with 44pt hit targets', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <>
          <MoneyField size="compact" label="Amount" accessibilityLabel="Planned amount" value=""
            onChangeText={jest.fn()} />
          <PercentField size="compact" label="Percent" accessibilityLabel="Planned percent" value=""
            onChangeText={jest.fn()} />
        </>,
      );
    });
    if (!renderer) throw new Error('Compact budget fields did not render.');

    for (const label of ['Planned amount', 'Planned percent']) {
      const input = renderer.root.findAll((node) => String(node.type) === 'textinput')
        .find((node) => node.props.accessibilityLabel === label);
      if (!input) throw new Error(`${label} input did not render.`);
      expect(input.props.hitSlop).toBe(4);
      expect(flattenedStyles(input.props.style)).toEqual(expect.arrayContaining([
        expect.objectContaining({ minHeight: 38, fontSize: 13 }),
      ]));
    }
    const amountWraps = renderer.root.findAll((node) => String(node.type) === 'view')
      .filter((node) => flattenedStyles(node.props.style).some((style) => style.minHeight === 40));
    expect(amountWraps).toHaveLength(2);

    act(() => renderer?.unmount());
  });

  it('keeps the compact Amount/% segmented options at 36pt plus hit slop', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <SegmentedControl
          size="compact"
          label="Enter as"
          value="amount"
          options={[
            { label: 'Amount (₹)', value: 'amount' },
            { label: '% of income', value: 'percent' },
          ]}
          onChange={jest.fn()}
        />,
      );
    });
    if (!renderer) throw new Error('Compact amount mode control did not render.');

    for (const label of ['Amount (₹)', '% of income']) {
      const option = renderer.root.findAll((node) => String(node.type) === 'pressable')
        .find((node) => node.props.accessibilityLabel === label);
      if (!option) throw new Error(`${label} option did not render.`);
      expect(option.props.hitSlop).toBe(4);
      expect(flattenedStyles(option.props.style)).toEqual(expect.arrayContaining([
        expect.objectContaining({ minHeight: 36 }),
      ]));
      const optionText = option.findByType('text');
      expect(flattenedStyles(optionText.props.style)).toEqual(expect.arrayContaining([
        expect.objectContaining({ fontSize: 13 }),
      ]));
    }

    const control = renderer.root.findAll((node) => String(node.type) === 'view')
      .find((node) => flattenedStyles(node.props.style).some((style) => style.minHeight === 40));
    expect(control).toBeDefined();
    act(() => renderer?.unmount());
  });
});
