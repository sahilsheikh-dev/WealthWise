import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { DEFAULT_REMINDER_PREFERENCES, type BackupMeta } from '../../data/metaStore';
import { FirstLaunchReminderPrompt } from '../FirstLaunchReminderPrompt';

let mockPathname = '/';
let mockFontScale = 1;
let mockMeta: BackupMeta = {};
let mockPermission: 'granted' | 'denied' | 'blocked' = 'denied';
const mockListeners = new Set<(meta: BackupMeta) => void>();
const mockMetaStore = {
  getMeta: jest.fn(async () => mockMeta),
  updateMeta: jest.fn(async (patch: Partial<BackupMeta>) => {
    mockMeta = { ...mockMeta, ...patch };
    for (const listener of mockListeners) listener(mockMeta);
    return mockMeta;
  }),
  subscribe: jest.fn((listener: (meta: BackupMeta) => void) => {
    mockListeners.add(listener);
    return () => mockListeners.delete(listener);
  }),
};
const mockAdapter = {
  getPermissionState: jest.fn(async () => mockPermission),
  requestPermission: jest.fn(async () => mockPermission),
};
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  usePathname: () => mockPathname,
}));

jest.mock('../../data/store', () => ({
  metaStore: {
    getMeta: (...args: Parameters<typeof mockMetaStore.getMeta>) => mockMetaStore.getMeta(...args),
    updateMeta: (...args: Parameters<typeof mockMetaStore.updateMeta>) => mockMetaStore.updateMeta(...args),
    subscribe: (...args: Parameters<typeof mockMetaStore.subscribe>) => mockMetaStore.subscribe(...args),
  },
  useAppStore: (selector: (state: unknown) => unknown) => selector({
    status: 'ready',
    data: { settings: { onboarded: true } },
  }),
}));

jest.mock('../../lib/reminderNotifications', () => ({
  reminderNotificationAdapter: {
    getPermissionState: () => mockAdapter.getPermissionState(),
    requestPermission: () => mockAdapter.requestPermission(),
  },
}));

jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (name: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    ReactModule.createElement(name, props, children);
  return {
    Alert: { alert: jest.fn() },
    Keyboard: { addListener: jest.fn(() => ({ remove: jest.fn() })) },
    KeyboardAvoidingView: node('keyboard-avoiding-view'),
    Modal: ({ visible, children, ...props }: React.PropsWithChildren<{ visible: boolean }>) =>
      visible ? ReactModule.createElement('modal', props, children) : null,
    Platform: { OS: 'ios' },
    Pressable: node('pressable'),
    ScrollView: node('scrollview'),
    StyleSheet: { absoluteFill: {}, create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
    useWindowDimensions: () => ({ height: 844, fontScale: mockFontScale }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { Feather: ({ name }: { name: string }) => ReactModule.createElement('icon', { name }) };
});

jest.mock('../../theme/useTheme', () => ({
  useTheme: () => ({
    colors: { border: 'gray', primary: 'blue', surface: 'white', surface2: 'lightgray', text1: 'black', text2: 'gray' },
  }),
}));

jest.mock('../ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    AppText: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      ReactModule.createElement('text', props, children),
    Button: ({ label, onPress, ...props }: { label: string; onPress?: () => void; [key: string]: unknown }) =>
      ReactModule.createElement('button', { ...props, accessibilityLabel: label, onPress }, label),
  };
});

async function renderPrompt() {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = TestRenderer.create(<FirstLaunchReminderPrompt />);
  });
  if (!renderer) throw new Error('First-launch reminder prompt renderer was not created.');
  return renderer;
}

async function advanceToPrompt() {
  await act(async () => {
    jest.advanceTimersByTime(400);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('FirstLaunchReminderPrompt', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPathname = '/';
    mockFontScale = 1;
    mockMeta = {};
    mockPermission = 'denied';
    mockListeners.clear();
    mockPush.mockClear();
    mockMetaStore.getMeta.mockClear();
    mockMetaStore.updateMeta.mockClear();
    mockAdapter.getPermissionState.mockClear();
    mockAdapter.requestPermission.mockClear();
    mockAdapter.getPermissionState.mockImplementation(async () => mockPermission);
    mockAdapter.requestPermission.mockImplementation(async () => mockPermission);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows once and persists Not now across a remount', async () => {
    const renderer = await renderPrompt();
    await advanceToPrompt();
    expect(renderer.root.findAllByType('text')
      .some((node) => node.children.join('') === 'Payment reminders')).toBe(true);
    expect(mockAdapter.requestPermission).not.toHaveBeenCalled();
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Not now' }).props.onPress());
    expect(mockMeta.remindersPromptHandled).toBe(true);
    act(() => renderer.unmount());

    const restarted = await renderPrompt();
    await advanceToPrompt();
    expect(restarted.root.findAllByType('text')
      .some((node) => node.children.join('') === 'Payment reminders')).toBe(false);
    expect(mockAdapter.getPermissionState).toHaveBeenCalledTimes(1);
    act(() => restarted.unmount());
  });

  it.each([
    ['Close', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ accessibilityLabel: 'Close' }).props.onPress();
    }],
    ['backdrop', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ testID: 'first-launch-reminders-prompt-backdrop' }).props.onPress();
    }],
    ['Android back', (renderer: TestRenderer.ReactTestRenderer) => {
      renderer.root.findByProps({ testID: 'first-launch-reminders-prompt-modal' }).props.onRequestClose();
    }],
  ])('%s dismisses without requesting permission and remains dismissed', async (_label, dismiss) => {
    const renderer = await renderPrompt();
    await advanceToPrompt();
    act(() => dismiss(renderer));
    expect(mockAdapter.requestPermission).not.toHaveBeenCalled();
    expect(mockMeta.remindersPromptHandled).toBe(true);
    expect(renderer.root.findAllByType('text')
      .some((node) => node.children.join('') === 'Payment reminders')).toBe(false);
    act(() => renderer.unmount());
  });

  it.each([
    ['granted', 'granted', {}],
    ['denied', 'denied', { setup: 'denied' }],
    ['blocked', 'blocked', { setup: 'blocked' }],
  ] as const)('runs the Turn on flow for %s permission', async (permission, requested, routeParams) => {
    mockPermission = permission;
    mockAdapter.getPermissionState.mockResolvedValue('denied');
    mockAdapter.requestPermission.mockResolvedValue(requested);
    const renderer = await renderPrompt();
    await advanceToPrompt();

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Turn on reminders' }).props.onPress();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    if (permission === 'granted') {
      expect(mockMeta.reminders).toEqual({ ...DEFAULT_REMINDER_PREFERENCES, enabled: true });
      expect(mockMeta.reminders?.enabled).toBe(true);
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/reminders', params: routeParams });
    } else {
      expect(mockMeta.reminders).toBeUndefined();
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/reminders', params: routeParams });
    }
    act(() => renderer.unmount());
  });

  it('skips the prompt when reminders are already enabled and permission is granted', async () => {
    mockPermission = 'granted';
    mockMeta = { reminders: { ...DEFAULT_REMINDER_PREFERENCES, enabled: true } };
    const renderer = await renderPrompt();
    await advanceToPrompt();

    expect(mockAdapter.getPermissionState).toHaveBeenCalledTimes(1);
    expect(mockMetaStore.updateMeta).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType('text')
      .some((node) => node.children.join('') === 'Payment reminders')).toBe(false);
    act(() => renderer.unmount());
  });

  it('does not show over payment confirmation or another route', async () => {
    mockPathname = '/payment-confirm';
    const renderer = await renderPrompt();
    await advanceToPrompt();

    expect(renderer.root.findAllByType('text')
      .some((node) => node.children.join('') === 'Payment reminders')).toBe(false);
    expect(mockAdapter.getPermissionState).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it.each([1.3, 2])('keeps content scrollable and buttons full width at font scale %s', async (fontScale) => {
    mockFontScale = fontScale;
    const renderer = await renderPrompt();
    await advanceToPrompt();

    expect(renderer.root.findAll((node) => String(node.type) === 'scrollview')).toHaveLength(1);
    for (const label of ['Turn on reminders', 'Not now']) {
      const button = renderer.root.findByProps({ accessibilityLabel: label });
      const style = typeof button.props.style === 'function'
        ? button.props.style({ pressed: false })
        : button.props.style;
      const styleList = Array.isArray(style) ? style : [style];
      expect(styleList).toEqual(expect.arrayContaining([
        expect.objectContaining({ width: '100%', minHeight: 48 }),
      ]));
    }
    const close = renderer.root.findByProps({ accessibilityLabel: 'Close' });
    const closeStyles = close.props.style({ pressed: false });
    expect(closeStyles).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: 44, height: 44 }),
    ]));
    expect(renderer.root.findAllByType('text')
      .every((node) => node.props.numberOfLines === undefined)).toBe(true);
    act(() => renderer.unmount());
  });
});
