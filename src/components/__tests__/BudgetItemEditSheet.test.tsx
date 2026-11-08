import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { BudgetItemEditSheet } from '../BudgetItemEditSheet';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    KeyboardAvoidingView: node('keyboardavoidingview'),
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: {
      create: (styles: object) => styles,
      absoluteFill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
      hairlineWidth: 1,
    },
    View: node('view'),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { surface: 'white', border: 'gray', text2: 'gray', text3: 'dimgray' } }),
}));
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
    Button: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('button', { accessibilityLabel: label, ...props }, label),
  };
});
jest.mock('../form/MoneyField', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { MoneyField: (props: Record<string, unknown>) => ReactModule.createElement('moneyfield', props) };
});
jest.mock('../form/IntegerField', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { IntegerField: (props: Record<string, unknown>) => ReactModule.createElement('integerfield', props) };
});
jest.mock('../form/SegmentedControl', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { SegmentedControl: (props: Record<string, unknown>) => ReactModule.createElement('segmentedcontrol', props) };
});

describe('BudgetItemEditSheet', () => {
  it('uses a bottom-anchored, scrollable 60% sheet with safe-area padding and read-only income details', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <BudgetItemEditSheet
          visible
          title="Salary"
          incomeDetails={{ name: 'Salary', category: 'Salary' }}
          amount={2_000}
          day={15}
          laterCustomMonths={2}
          onClose={jest.fn()}
          onSave={jest.fn(() => true)}
          onRemove={jest.fn(() => true)}
        />,
      );
    });
    if (!renderer) throw new Error('BudgetItemEditSheet renderer was not created.');
    await act(async () => {
      renderer?.root.findByProps({ label: 'Apply changes to' }).props.onChange('following');
    });
    const overlay = renderer.root.findByProps({ testID: 'budget-item-edit-overlay' });
    expect(overlay.props.style).toEqual(expect.objectContaining({ justifyContent: 'flex-end' }));
    const sheet = renderer.root.findByProps({ testID: 'budget-item-edit-sheet' });
    expect(sheet.props.style[0]).toEqual(expect.objectContaining({
      maxHeight: '60%',
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    }));
    expect(sheet.props.style[1].paddingBottom).toBe(24);
    expect(renderer.root.findByProps({ keyboardShouldPersistTaps: 'handled' })).toBeDefined();
    const text = renderer.root.findAllByType('text').map((node) => node.children.join('')).join(' ');
    expect(text).toContain('Salary');
    expect(text).toContain('2 later months have their own values and are kept.');
  });

  it('validates before saving and removes with the selected scope', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn(() => true);
    const onRemove = jest.fn(() => true);
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <BudgetItemEditSheet
          visible
          title="Food"
          amount={300}
          laterCustomMonths={0}
          onClose={onClose}
          onSave={onSave}
          onRemove={onRemove}
        />,
      );
    });
    if (!renderer) throw new Error('BudgetItemEditSheet renderer was not created.');
    const amount = renderer.root.findByProps({ accessibilityLabel: 'Planned amount' });
    await act(async () => {
      amount.props.onChangeText('-1');
      await renderer?.root.findByProps({ accessibilityLabel: 'Save' }).props.onPress();
    });
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => {
      renderer?.root.findByProps({ accessibilityLabel: 'Planned amount' }).props.onChangeText('450');
      renderer?.root.findByProps({ accessibilityLabel: 'Due day (optional)' }).props.onChangeText('31');
      renderer?.root.findByProps({ label: 'Apply changes to' }).props.onChange('following');
    });
    await act(async () => {
      renderer?.root.findByProps({ accessibilityLabel: 'Remove item' }).props.onPress();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    expect(onRemove).toHaveBeenCalledWith('following');
    expect(onClose).toHaveBeenCalled();
    act(() => renderer?.unmount());
  });
});
