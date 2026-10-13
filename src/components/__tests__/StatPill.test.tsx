import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { AppText, StatPill } from '../ui';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
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

describe('StatPill accessibility', () => {
  it('announces the supplied exact amount while displaying the compact value', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <StatPill
          label="Assets"
          value={<AppText>₹12.35 Cr</AppText>}
          accessibilityLabel="Assets, ₹12,34,56,789"
          onPress={jest.fn()}
        />,
      );
    });

    if (!renderer) throw new Error('StatPill renderer was not created.');
    const pill = renderer.root.findByProps({ accessibilityLabel: 'Assets, ₹12,34,56,789' });
    expect(pill.props.accessibilityLabel).toBe('Assets, ₹12,34,56,789');
    expect(renderer.root.findAllByType('text').some((text) => text.children.includes('₹12.35 Cr'))).toBe(true);
  });
});
