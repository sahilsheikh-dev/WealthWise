import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { LockGate } from '../LockGate';

let mockAuthenticationSucceeds = false;

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: mockAuthenticationSucceeds })),
}));

jest.mock('expo-screen-capture', () => ({
  allowScreenCaptureAsync: jest.fn(async () => undefined),
  preventScreenCaptureAsync: jest.fn(async () => undefined),
}));

jest.mock('../SecurityProvider', () => ({
  useSecuritySettings: () => ({
    settings: { enabled: true, hidePreviews: false, graceMs: 30_000 },
    update: jest.fn(async () => undefined),
  }),
}));

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({ colors: { bg: 'white', err: 'red', surface: 'white', text2: 'gray' } }),
}));

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    AppText: node('text'),
    Button: ({ label, onPress }: { label: string; onPress?: () => void }) =>
      ReactModule.createElement('button', { accessibilityLabel: label, onPress }, label),
    Card: node('card'),
    Screen: node('screen'),
  };
});

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    StyleSheet: { absoluteFill: {}, create: (styles: object) => styles },
    View: node('view'),
  };
});

describe('LockGate', () => {
  beforeEach(() => {
    mockAuthenticationSucceeds = false;
  });

  it('does not mount its children until the lock is passed', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      renderer = TestRenderer.create(
        <LockGate><text>First-launch prompt</text></LockGate>,
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    if (!renderer) throw new Error('Lock gate renderer was not created.');
    expect(renderer.root.findAllByProps({ children: 'First-launch prompt' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Unlock' })).toHaveLength(1);

    mockAuthenticationSucceeds = true;
    await act(async () => {
      renderer?.root.findByProps({ accessibilityLabel: 'Unlock' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(renderer.root.findAllByProps({ children: 'First-launch prompt' })).toHaveLength(1);
    act(() => renderer?.unmount());
  });
});
