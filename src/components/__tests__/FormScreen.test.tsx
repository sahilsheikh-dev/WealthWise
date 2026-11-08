import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { FormScreen } from '../form/FormScreen';

const mockConfirmAsync = jest.fn<Promise<boolean>, [unknown]>();
let mockHardwareBack: (() => boolean) | undefined;

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../lib/confirm', () => ({
  confirmAsync: (...args: [unknown]) => mockConfirmAsync(...args),
}));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { bg: 'white', border: 'gray', text2: 'black' } }),
}));
jest.mock('../ui', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    AppText: ({ children }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', null, children),
  };
});
jest.mock('../IconButton', () => ({ IconButton: () => null }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  const node = (type: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(type, props, children);
  return {
    BackHandler: {
      addEventListener: (_event: string, callback: () => boolean) => {
        mockHardwareBack = callback;
        return { remove: jest.fn() };
      },
    },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scroll-view'),
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
  };
});

describe('FormScreen close behavior', () => {
  beforeEach(() => {
    mockConfirmAsync.mockReset();
    mockHardwareBack = undefined;
  });

  it('closes a clean form immediately with an accessible 44-point Close control', () => {
    const onClose = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<FormScreen title="Details" onClose={onClose} footer={null} />);
    });
    if (!renderer) throw new Error('Form screen did not render.');
    const close = renderer.root.findByProps({ accessibilityLabel: 'Close' });
    expect(close.props.style).toEqual(expect.objectContaining({ width: 44, height: 44 }));
    act(() => close.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockConfirmAsync).not.toHaveBeenCalled();
  });

  it('asks before discarding dirty changes and keeps the form when cancelled', async () => {
    const onClose = jest.fn();
    mockConfirmAsync.mockResolvedValue(false);
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<FormScreen title="Details" onClose={onClose} isDirty footer={null} />);
    });
    if (!renderer) throw new Error('Form screen did not render.');
    await act(async () => renderer?.root.findByProps({ accessibilityLabel: 'Close' }).props.onPress());
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Discard changes?',
      message: 'Your unsaved changes will be lost.',
      confirmLabel: 'Discard',
    });
    expect(onClose).not.toHaveBeenCalled();

    mockConfirmAsync.mockResolvedValue(true);
    await act(async () => { mockHardwareBack?.(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
