import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';

import { IconButton, TEXT_ACTIONS_ALLOWED } from '../IconButton';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: jest.requireActual('../../theme/themes').themes.light.colors,
  }),
}));

describe('IconButton', () => {
  it.each(['default', 'primary', 'destructive'] as const)('has an accessible label and 44pt target for %s', (variant) => {
    const onPress = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <IconButton icon="plus" label="Add record" onPress={onPress} variant={variant} />,
      );
    });
    if (!renderer) throw new Error('IconButton did not render.');
    const button = renderer.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.accessibilityLabel).toBe('Add record');
    expect(button.props.accessibilityLabel.trim()).not.toBe('');
    const style = StyleSheet.flatten(button.props.style({ pressed: false }));
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
    act(() => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets the disabled state and supports hints', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    act(() => {
      renderer = TestRenderer.create(
        <IconButton icon="trash-2" label="Delete record" onPress={jest.fn()} disabled hint="Cannot delete" />,
      );
    });
    if (!renderer) throw new Error('IconButton did not render.');
    const button = renderer.root.findByProps({ accessibilityRole: 'button' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
    expect(button.props.accessibilityHint).toBe('Cannot delete');
    expect(button.props.disabled).toBe(true);
  });

  it('exports the approved text-action allow-list', () => {
    expect(TEXT_ACTIONS_ALLOWED).toEqual(expect.arrayContaining([
      'Deposit', 'Withdraw', 'Pay EMI', 'Log installment', 'Entries', 'Schedule', 'Payments',
      'Confirm', 'Save', 'Continue', 'Skip for now', 'Cancel', 'Try again', 'Go to Home',
      'Start fresh', 'Export', 'Import', 'Undo import', 'Share', 'Create N transactions',
      'Use calculated EMI', 'Send test notification',
    ]));
  });
});
