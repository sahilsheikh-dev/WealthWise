import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { SearchField } from '../ui';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (name: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(name, props, children);
  return {
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    Text: node('text'),
    TextInput: node('input'),
    View: node('view'),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: React.PropsWithChildren) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: 'blue',
      ok: 'green',
      err: 'red',
      info: 'cyan',
      purple: 'purple',
      text1: 'black',
      text2: 'gray',
      text3: 'darkgray',
      surface: 'white',
      surface2: 'white',
      surface3: 'gray',
      bg: 'white',
      border: 'gray',
    },
  }),
}));

describe('SearchField', () => {
  it('shows a labelled clear action only when a clear handler is supplied', () => {
    const onClear = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <SearchField
          accessibilityLabel="Search assets"
          placeholder="Search name or type"
          value="gold"
          onChangeText={jest.fn()}
          onClear={onClear}
        />,
      );
    });
    if (!renderer) throw new Error('SearchField renderer was not created.');
    const searchRenderer = renderer;

    const clear = searchRenderer.root.findByProps({ accessibilityLabel: 'Clear search' });
    expect(clear.props.accessibilityRole).toBe('button');
    act(() => clear.props.onPress());
    expect(onClear).toHaveBeenCalledTimes(1);

    act(() => searchRenderer.update(
      <SearchField
        accessibilityLabel="Search transactions"
        placeholder="Search note or category"
        value="rent"
        onChangeText={jest.fn()}
      />,
    ));
    expect(searchRenderer.root.findAllByProps({ accessibilityLabel: 'Clear search' })).toHaveLength(0);
  });
});
