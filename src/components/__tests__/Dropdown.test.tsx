import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { Dropdown } from '../Dropdown';

let mockFontScale = 1;
let mockPlatformOS = 'android';
const mockAnnounce = jest.fn();

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    TextInput: node('input'),
    AccessibilityInfo: { get announceForAccessibility() { return mockAnnounce; } },
    Platform: { get OS() { return mockPlatformOS; } },
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
    expect(JSON.stringify(sheet.props.contentStyle)).toContain('"flexShrink":1');
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toEqual([
      'Search', '3 results', 'Essentials', 'Food', 'Rent', 'Other', 'Pets',
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

  it('shows search by default, filters and ranks, and clears the query', () => {
    const ranked = [
      { value: 'contains', title: 'Blue Food' },
      { value: 'prefix', title: 'Foodie' },
      { value: 'exact', title: 'Food' },
      { value: 'custom', title: 'Custom' },
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Category" accessibilityLabel="Category" value="" options={ranked} onChange={jest.fn()} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    const input = renderer.root.findByProps({ accessibilityLabel: 'Search' });
    expect(input.props.placeholder).toBe('Search');
    expect(input.props.autoFocus).toBe(false);
    act(() => input.props.onChangeText(' food '));
    const sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    expect(sheet.findAll((node) => String(node.type) === 'pressable' && node.props.accessibilityRole === 'radio').map((node) => node.props.accessibilityLabel))
      .toEqual(['Food', 'Foodie', 'Blue Food', 'Custom']);
    expect(JSON.stringify(sheet.findByProps({ accessibilityLabel: 'Clear search' }).props.style)).toContain('"width":44');
    expect(JSON.stringify(sheet.findByProps({ accessibilityLabel: 'Clear search' }).props.style)).toContain('"height":44');
    act(() => sheet.findByProps({ accessibilityLabel: 'Clear search' }).props.onPress());
    expect(renderer.root.findByProps({ accessibilityLabel: 'Search' }).props.value).toBe('');
  });

  it('shows no matches without closing and retains Custom at the bottom', () => {
    const options = [{ value: 'x', title: 'Alpha' }, { value: 'custom', title: 'Custom' }];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Type" accessibilityLabel="Type" value="custom" options={options} onChange={jest.fn()} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    const input = renderer.root.findByProps({ accessibilityLabel: 'Search' });
    act(() => input.props.onChangeText('missing'));
    const sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toContain('No matches');
    expect(sheet.findAllByProps({ accessibilityLiveRegion: 'polite' }).map((node) => node.children.join(''))).toContain('No matches');
    expect(sheet.findByProps({ accessibilityLabel: 'Custom' }).props.accessibilityState).toEqual({ selected: true });
    expect(renderer.root.findAll((node) => String(node.type) === 'sheet')).toHaveLength(1);
  });

  it('does not pin a selected option that does not match the query', () => {
    const choices = [{ value: 'selected', title: 'Selected value' }, { value: 'other', title: 'Other value' }];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Type" accessibilityLabel="Type" value="selected" options={choices} onChange={jest.fn()} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Search' }).props.onChangeText('other'));
    const sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    expect(sheet.findAll((node) => String(node.type) === 'pressable' && node.props.accessibilityRole === 'radio').map((node) => node.props.accessibilityLabel))
      .toEqual(['Other value']);
  });

  it('omits search when searchable is false and resets query on reopen', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Type" accessibilityLabel="Type" value="" options={options} onChange={jest.fn()} searchable={false} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Search' })).toHaveLength(0);
    const sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    act(() => sheet.props.onClose());
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Search' })).toHaveLength(0);
  });

  it('resets search on reopen and drops empty group headings while preserving group order', () => {
    const grouped = [
      { value: 'a', title: 'Alpha', group: 'First' },
      { value: 'b', title: 'Beta', group: 'Second' },
      { value: 'custom', title: 'Custom', group: 'First' },
    ];
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Category" accessibilityLabel="Category" value="" options={grouped} onChange={jest.fn()} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Search' }).props.onChangeText('beta'));
    let sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toContain('Second');
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).not.toContain('First');
    act(() => sheet.props.onClose());
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    sheet = renderer.root.findByProps({ sheetTestID: 'dropdown-sheet' });
    expect(renderer.root.findByProps({ accessibilityLabel: 'Search' }).props.value).toBe('');
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toContain('First');
    expect(sheet.findAllByType('text').map((node) => node.children.join(''))).toContain('Second');
    expect(sheet.findAll((node) => String(node.type) === 'pressable' && node.props.accessibilityRole === 'radio').at(-1)?.props.accessibilityLabel).toBe('Custom');
  });

  it('announces filtered result counts with AccessibilityInfo on iOS', () => {
    mockPlatformOS = 'ios';
    mockAnnounce.mockClear();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => { renderer = TestRenderer.create(<Dropdown label="Type" accessibilityLabel="Type" value="" options={options} onChange={jest.fn()} />); });
    if (!renderer) throw new Error('Dropdown renderer was not created.');
    act(() => renderer?.root.findByProps({ testID: 'dropdown-control' }).props.onPress());
    act(() => renderer?.root.findByProps({ accessibilityLabel: 'Search' }).props.onChangeText('rent'));
    expect(mockAnnounce).toHaveBeenCalledWith('1 results');
    act(() => renderer?.unmount());
    mockPlatformOS = 'android';
  });

  it.each([1, 1.3, 2])('keeps option rows expandable at font scale %s', (fontScale) => {
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
