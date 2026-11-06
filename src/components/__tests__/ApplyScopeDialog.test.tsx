import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { ApplyScopeDialog } from '../ApplyScopeDialog';

let mockFontScale = 1;

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
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
    Text: node('text'),
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
      surface: 'white',
      surface2: 'lightgray',
      text1: 'black',
      text2: 'gray',
      text3: 'dimgray',
    },
  }),
}));

function renderDialog(props: Partial<React.ComponentProps<typeof ApplyScopeDialog>> = {}) {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(
      <ApplyScopeDialog visible onApply={jest.fn()} onClose={jest.fn()} {...props} />,
    );
  });
  if (!renderer) throw new Error('Apply scope dialog renderer was not created.');
  return renderer;
}

describe('ApplyScopeDialog', () => {
  afterEach(() => {
    mockFontScale = 1;
  });

  it.each([
    ['This month only', 'month'],
    ['This and following months', 'following'],
  ] as const)('applies %s immediately and at most once', (label, scope) => {
    const onApply = jest.fn();
    const renderer = renderDialog({ onApply });
    const option = renderer.root.findByProps({ accessibilityLabel: label });

    act(() => {
      option.props.onPress();
      option.props.onPress();
    });

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(scope);
    act(() => renderer.unmount());
  });

  it.each([
    ['Close', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ accessibilityLabel: 'Close' }).props.onPress();
    }],
    ['backdrop', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ testID: 'apply-scope-dialog-backdrop' }).props.onPress();
    }],
    ['Android back', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ testID: 'apply-scope-dialog-modal' }).props.onRequestClose();
    }],
  ])('%s closes without applying a change', (_label, dismiss) => {
    const onApply = jest.fn();
    const onClose = jest.fn();
    const renderer = renderDialog({ onApply, onClose });

    act(() => dismiss(renderer));

    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => renderer.unmount());
  });

  it('shows only the two scope choices and keeps counted delete copy in the dialog body', () => {
    const renderer = renderDialog({
      description: 'This category contains 2 budget items.',
    });
    const text = renderer.root.findAllByType('text')
      .map((node) => node.children.join(''))
      .filter(Boolean);

    expect(text).toContain('This category contains 2 budget items.');
    expect(text).toContain('This month only');
    expect(text).toContain('This and following months');
    expect(text.some((value) => /\b(?:Cancel|Apply)\b/i.test(value))).toBe(false);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Close' })).toBeDefined();
    const closeIcon = renderer.root.findAll((node) => String(node.type) === 'icon')
      .find((node) => node.props.name === 'x');
    expect(closeIcon).toBeDefined();
    act(() => renderer.unmount());
  });

  it.each([1.3, 2])('keeps options expandable and the content scrollable at font scale %s', (fontScale) => {
    mockFontScale = fontScale;
    const renderer = renderDialog({
      description: 'This category contains 12 budget items.',
    });

    expect(renderer.root.findAll((node) => String(node.type) === 'scrollview')).toHaveLength(1);
    for (const label of ['This month only', 'This and following months']) {
      const option = renderer.root.findByProps({ accessibilityLabel: label });
      const optionStyles = option.props.style({ pressed: false });
      expect(optionStyles).toEqual(expect.arrayContaining([
        expect.objectContaining({ width: '100%', minHeight: 52 }),
      ]));
      expect(optionStyles).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ height: expect.any(Number) }),
      ]));
      expect(renderer.root.findAllByType('text')
        .some((node) => node.props.numberOfLines !== undefined)).toBe(false);
    }

    const closeButton = renderer.root.findByProps({ accessibilityLabel: 'Close' });
    const closeStyles = closeButton.props.style({ pressed: false });
    expect(closeStyles).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: 44, height: 44 }),
    ]));
    act(() => renderer.unmount());
  });
});
