import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { BudgetCategoryPicker, budgetCategoryHint } from '../BudgetCategoryPicker';

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
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
  useTheme: () => ({ colors: { primaryDim: 'blueDim', border: 'gray', surface: 'white', text2: 'gray', text3: 'dimgray' } }),
}));

describe('BudgetCategoryPicker', () => {
  it('shows grouped budget hints and accessible equivalents, then selects a category', () => {
    const onChange = jest.fn();
    const sections = [{
      id: 'survival' as const,
      name: 'Survival (Needs)',
      categories: [
        { category: 'Rent', planned: 1_000, actual: 1_200 },
        { category: 'Food', planned: 0, actual: 10 },
      ],
    }];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <BudgetCategoryPicker
          sections={sections}
          value="Food"
          labels={{ Rent: 'Rent', Food: 'Food' }}
          onChange={onChange}
        />,
      );
    });
    if (!renderer) throw new Error('BudgetCategoryPicker renderer was not created.');
    const rent = renderer.root.findByProps({ testID: 'budget-category-Rent' });
    const food = renderer.root.findByProps({ testID: 'budget-category-Food' });
    expect(rent.props.accessibilityLabel).toBe('Rent, Over by ₹200');
    expect(food.props.accessibilityLabel).toBe('Food, No budget');
    expect(food.props.accessibilityState.selected).toBe(true);
    expect(renderer.root.findAllByType('text').some((node) => node.children.includes('Survival (Needs)'))).toBe(true);
    act(() => rent.props.onPress());
    expect(onChange).toHaveBeenCalledWith('Rent');
    expect(budgetCategoryHint(500, 200)).toBe('Left ₹300 of ₹500');
  });

  it('keeps extra legacy categories visible without assigning a budget', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <BudgetCategoryPicker sections={[]} value="Legacy" labels={{}} extraCategories={['Legacy']} onChange={jest.fn()} />,
      );
    });
    if (!renderer) throw new Error('BudgetCategoryPicker renderer was not created.');
    expect(renderer.root.findByProps({ testID: 'budget-category-Legacy' }).props.accessibilityLabel)
      .toBe('Legacy, No budget');
  });
});
