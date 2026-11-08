import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { FormShell } from '../FormShell';

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
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
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }) };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { border: 'gray', text2: 'gray', err: 'red', surface: 'white' } }),
}));

describe('FormShell', () => {
  it('renders header, scrollable body and fixed footer with accessible action slots', () => {
    const onClose = jest.fn();
    const onDelete = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <FormShell
          title="Edit item"
          headerTestID="sheet-header"
          bodyTestID="sheet-body"
          leftAction={{ icon: 'x', label: 'Close', hint: 'Close form', onPress: onClose }}
          rightActions={[{ icon: 'trash-2', label: 'Delete item', hint: 'Delete item', onPress: onDelete, destructive: true }]}
          footer={<button>Save</button>}>
          {React.createElement('form-field')}
        </FormShell>,
      );
    });
    if (!renderer) throw new Error('FormShell renderer was not created.');
    expect(renderer.root.findByProps({ testID: 'form-shell' })).toBeDefined();
    expect(renderer.root.findByProps({ testID: 'sheet-header' }).findByType('text').children.join('')).toBe('Edit item');
    expect(renderer.root.findByProps({ testID: 'sheet-body' }).props.keyboardShouldPersistTaps).toBe('handled');
    expect(renderer.root.findByProps({ testID: 'sheet-body' })
      .findAll((node) => String(node.type) === 'form-field')).toHaveLength(1);
    expect(renderer.root.findByProps({ testID: 'form-shell-footer' }).findByType('button')).toBeDefined();
    const actions = renderer.root.findAll((node) =>
      String(node.type) === 'pressable' && node.props.accessibilityRole === 'button',
    );
    expect(actions.map((action) => action.props.accessibilityLabel)).toEqual(['Close', 'Delete item']);
    expect(actions.every((action) => JSON.stringify(action.props.style)
      .includes('"width":44') && JSON.stringify(action.props.style).includes('"height":44'))).toBe(true);
    expect(actions.map((action) => action.props.accessibilityHint)).toEqual(['Close form', 'Delete item']);
    act(() => actions[0]?.props.onPress());
    act(() => actions[1]?.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
