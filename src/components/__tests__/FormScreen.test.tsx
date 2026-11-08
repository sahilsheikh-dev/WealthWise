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
jest.mock('../IconButton', () => {
  const ReactModule = jest.requireActual('react') as typeof React;
  return {
    IconButton: (props: Record<string, unknown>) => ReactModule.createElement('iconbutton', props),
  };
});
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

describe('FormScreen shared shell and close behavior', () => {
  beforeEach(() => {
    mockConfirmAsync.mockReset();
    mockHardwareBack = undefined;
  });

  it('renders shared header, scrollable body and fixed footer with a 44-point Back action', () => {
    const onClose = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <FormScreen title="Details" onClose={onClose} footer={<button>Save</button>}>
          {React.createElement('field')}
        </FormScreen>,
      );
    });
    if (!renderer) throw new Error('Form screen did not render.');
    expect(renderer.root.findAll((node) => node.type === 'text' && node.children.join('') === 'Details')).toHaveLength(1);
    const body = renderer.root.findByProps({ testID: 'form-shell-body' });
    expect(body.props.keyboardShouldPersistTaps).toBe('handled');
    expect(body.findAll((node) => String(node.type) === 'field')).toHaveLength(1);
    expect(renderer.root.findByProps({ testID: 'form-shell-footer' }).findByType('button')).toBeDefined();
    const close = renderer.root.findByProps({ accessibilityLabel: 'Back' });
    expect(JSON.stringify(close.props.style)).toContain('"width":44');
    expect(JSON.stringify(close.props.style)).toContain('"height":44');
    act(() => close.props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockConfirmAsync).not.toHaveBeenCalled();
  });

  it('closes a clean form immediately through Android back', () => {
    const onClose = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<FormScreen title="Details" onClose={onClose} footer={null} />);
    });
    if (!renderer) throw new Error('Form screen did not render.');
    act(() => { mockHardwareBack?.(); });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockConfirmAsync).not.toHaveBeenCalled();
  });

  it('supports an accessible non-destructive plus action in the header', () => {
    const onAdd = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <FormScreen
          title="Details"
          onClose={jest.fn()}
          footer={null}
          headerAction={{ icon: 'plus', label: 'Add allocation item', variant: 'default', onPress: onAdd }}
        />,
      );
    });
    if (!renderer) throw new Error('Form screen did not render.');
    const action = renderer.root.findByProps({ accessibilityLabel: 'Add allocation item' });
    expect(action.props.accessibilityHint).toBe('Add allocation item');
    expect(JSON.stringify(action.props.style)).toContain('"width":44');
    expect(JSON.stringify(action.props.style)).toContain('"height":44');
    act(() => action.props.onPress());
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('supports an intentionally empty left slot and preserves custom hardware-back behavior', () => {
    const onClose = jest.fn();
    const onHardwareBack = jest.fn(() => true);
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <FormScreen title="Welcome" onClose={onClose} leftAction={null} onHardwareBack={onHardwareBack} footer={null} />,
      );
    });
    if (!renderer) throw new Error('Form screen did not render.');
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Back' })).toHaveLength(0);
    act(() => { mockHardwareBack?.(); });
    expect(onHardwareBack).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks before discarding dirty changes and keeps the form when cancelled', async () => {
    const onClose = jest.fn();
    mockConfirmAsync.mockResolvedValue(false);
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(<FormScreen title="Details" onClose={onClose} isDirty footer={null} />);
    });
    if (!renderer) throw new Error('Form screen did not render.');
    await act(async () => renderer?.root.findByProps({ accessibilityLabel: 'Back' }).props.onPress());
    expect(mockConfirmAsync).toHaveBeenCalledWith({
      title: 'Discard changes?',
      message: 'Your unsaved changes will be lost.',
      confirmLabel: 'Discard',
    });
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => { mockHardwareBack?.(); });
    expect(mockConfirmAsync).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();

    mockConfirmAsync.mockResolvedValue(true);
    await act(async () => { mockHardwareBack?.(); });
    expect(mockConfirmAsync).toHaveBeenCalledTimes(3);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
