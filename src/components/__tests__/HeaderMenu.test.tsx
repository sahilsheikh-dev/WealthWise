import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { HeaderMenu, type HeaderMenuItem } from '../HeaderMenu';

let mockFontScale = 1;

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    BackHandler: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
    Keyboard: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: node('modal'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: {
      absoluteFill: {},
      create: (styles: object) => styles,
      hairlineWidth: 1,
    },
    View: node('view'),
    useWindowDimensions: () => ({ height: 844, fontScale: mockFontScale }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }),
  };
});

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      border: 'gray',
      err: 'red',
      primary: 'blue',
      surface: 'white',
      surface2: 'lightgray',
      text1: 'black',
      text2: 'gray',
      text3: 'dimgray',
    },
  }),
}));

const choices = [
  { id: '50', label: '50 years', destructive: true },
  { id: '100', label: '100 years', destructive: true },
  { id: '126', label: '126 years', destructive: true },
  { id: 'dense', label: 'Dense (200-year record count + daily SIP)', destructive: true },
] as const;

function renderMenu(onSelect: (id: string) => void) {
  const selection = {
    title: 'Load stress data?',
    message: 'Replace local app data with a deterministic long-history fixture.',
    choices,
    onSelect,
  };
  const items: HeaderMenuItem[] = [{
    label: 'Load stress data',
    icon: 'database',
    onPress: jest.fn(),
    selection,
  }];
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(<HeaderMenu visible items={items} onClose={jest.fn()} />);
  });
  if (!renderer) throw new Error('Header menu renderer was not created.');
  return renderer;
}

describe('HeaderMenu selection dialog', () => {
  afterEach(() => {
    mockFontScale = 1;
  });

  it('lets the user cancel without selecting a stress tier', () => {
    const onSelect = jest.fn();
    const renderer = renderMenu(onSelect);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Load stress data' }).props.onPress();
    });
    expect(renderer.root.findByProps({ testID: 'header-menu-selection-modal' }).props.visible).toBe(true);
    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Cancel' }).props.onPress();
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ testID: 'header-menu-selection-modal' }).props.visible).toBe(false);
    act(() => renderer.unmount());
  });

  it.each([1.3, 2])('keeps all stress choices accessible at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    const onSelect = jest.fn();
    const renderer = renderMenu(onSelect);

    for (const choice of choices) {
      act(() => {
        renderer.root.findByProps({ accessibilityLabel: 'Load stress data' }).props.onPress();
      });
      const option = renderer.root.findByProps({ accessibilityLabel: choice.label });
      const optionStyle = option.props.style({ pressed: false });
      expect(optionStyle).toEqual(expect.arrayContaining([
        expect.objectContaining({ minHeight: Math.max(52, 48 * fontScale) }),
      ]));
      act(() => option.props.onPress());
      expect(onSelect).toHaveBeenLastCalledWith(choice.id);
    }

    act(() => renderer.unmount());
  });
});
