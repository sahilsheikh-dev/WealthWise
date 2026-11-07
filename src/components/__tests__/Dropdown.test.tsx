import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { Dropdown } from '../Dropdown';

let mockFontScale = 1;

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
    useWindowDimensions: () => ({ fontScale: mockFontScale }),
  };
});
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});
jest.mock('../TopAnchoredSheet', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    TopAnchoredSheet: ({
      visible,
      onClose,
      centered,
      contentStyle,
      sheetTestID,
      children,
    }: React.PropsWithChildren<{
      visible: boolean;
      onClose: () => void;
      centered?: boolean;
      contentStyle?: unknown;
      sheetTestID?: string;
    }>) => visible
      ? ReactModule.createElement('sheet', { onClose, centered, contentStyle, sheetTestID }, children)
      : null,
  };
});
jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }) };
});
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { text1: 'black', text2: 'gray', text3: 'dimgray', border: 'gray', surface: 'white', err: 'red', primary: 'blue' },
  }),
}));

describe('Dropdown', () => {
  const options = [
    { value: 'food', title: 'Food', group: 'Essentials' },
    { value: 'rent', title: 'Rent', group: 'Essentials' },
    { value: 'pets', title: 'Pets', group: 'Other' },
  ];

  it('shows the selected title and an accessible closed control', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <Dropdown label="Category" accessibilityLabel="Transaction category" value="food" options={options} onChange={jest.fn()} />,
      );
    });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    const control = renderer.root.findByProps({ testID: 'dropdown-control' });
    expect(control.props.accessibilityRole).toBe('button');
    expect(control.props.accessibilityLabel).toBe('Transaction category');
    expect(control.props.accessibilityState).toEqual({ expanded: false });
    expect(control.findAllByType('text').map((node) => node.children.join(''))).toContain('Food');
    expect(renderer.root.findAll((node) => String(node.type) === 'sheet')).toHaveLength(0);
    expect(renderer.root.findAll((node) => String(node.type) === 'icon').map((node) => node.props.name)).toContain('chevron-down');
  });

  it('opens a centered sheet with grouped titles, checks selection, and closes on selection', () => {
    const onChange = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <Dropdown label="Category" accessibilityLabel="Category" value="food" options={options} onChange={onChange} />,
      );
    });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    const sheet = renderer.root.findAll((node) => String(node.type) === 'sheet')[0];
    if (!sheet) throw new Error('Dropdown sheet was not rendered.');
    expect(sheet.props.centered).toBe(true);
    expect(sheet.props.sheetTestID).toBe('dropdown-sheet');
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toEqual([
      'Essentials', 'Food', 'Rent', 'Other', 'Pets',
    ]);
    expect(sheet.findByProps({ accessibilityLabel: 'Food' }).props.accessibilityRole).toBe('radio');
    expect(sheet.findByProps({ accessibilityLabel: 'Food' }).props.accessibilityState).toEqual({ selected: true });
    expect(sheet.findAll((node) => String(node.type) === 'icon').map((node) => node.props.name)).toEqual(['check']);
    const rent = sheet.findByProps({ accessibilityLabel: 'Rent' });
    expect(JSON.stringify(rent.props.style)).toContain('"minHeight":44');
    act(() => rent.props.onPress());
    expect(onChange).toHaveBeenCalledWith('rent');
    expect(renderer.root.findAll((node) => String(node.type) === 'sheet')).toHaveLength(0);
  });

  it.each([1.3, 2])('keeps option rows expandable at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <Dropdown label="Category" accessibilityLabel="Category" value="" options={options} onChange={jest.fn()} />,
      );
    });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    const rows = renderer.root.findAll((node) =>
      String(node.type) === 'pressable' && node.props.accessibilityRole === 'radio',
    );
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => JSON.stringify(row.props.style)
      .includes(`"minHeight":${44 * fontScale}`))).toBe(true);
    act(() => renderer?.unmount());
    mockFontScale = 1;
  });

  it('closes through the sheet back action', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <Dropdown label="Type" accessibilityLabel="Type" value="" options={options} onChange={jest.fn()} />,
      );
    });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    const sheet = renderer.root.findAll((node) => String(node.type) === 'sheet')[0];
    if (!sheet) throw new Error('Dropdown sheet was not rendered.');
    act(() => sheet.props.onClose());
    expect(renderer.root.findAll((node) => String(node.type) === 'sheet')).toHaveLength(0);
  });
});
