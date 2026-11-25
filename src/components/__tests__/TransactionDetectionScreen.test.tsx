import React from 'react';
import { Platform, Switch } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import TransactionDetectionScreen from '../../../app/transaction-detection';
import { DEFAULT_TRANSACTION_DETECTION } from '../../data/metaStore';
import { metaStore } from '../../data/store';
import { notificationListenerAdapter } from '../../lib/notificationListener';
import { ThemeProvider } from '../../theme/ThemeProvider';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => ({}),
  usePathname: () => '/transaction-detection',
}));

jest.mock('../../lib/notificationListener', () => ({
  notificationListenerAdapter: {
    isSupported: () => true,
    hasNativeModule: () => true,
    isPermissionGranted: jest.fn(async () => false),
    openNotificationAccessSettings: jest.fn(async () => undefined),
    openAppInfoSettings: jest.fn(async () => undefined),
    setDetectionConfig: jest.fn(async () => undefined),
    drainQueuedEvents: jest.fn(async () => []),
    subscribeLiveEvents: jest.fn(() => () => undefined),
  },
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

function findButtonByLabel(root: TestRenderer.ReactTestInstance, label: string) {
  return root.findAll((node) => node.props?.accessibilityRole === 'button' && node.props?.accessibilityLabel === label)[0];
}

describe('TransactionDetectionScreen', () => {
  beforeEach(async () => {
    await metaStore.clearMeta();
    jest.clearAllMocks();
  });

  it('shows Android-only explanation and manual entry on iOS', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    try {
      let renderer: TestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = TestRenderer.create(
          <ThemeProvider>
            <TransactionDetectionScreen />
          </ThemeProvider>,
        );
        await flushPromises();
      });

      const treeText = JSON.stringify(renderer!.toJSON());
      expect(treeText).toContain('Android only');
      const manualBtn = findButtonByLabel(renderer!.root, 'Add transaction manually');
      expect(manualBtn).toBeDefined();
      await act(async () => {
        manualBtn.props.onPress();
      });
      expect(mockPush).toHaveBeenCalledWith('/transaction-form');
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });

  it('requires prominent disclosure before enabling detection on Android and handles draft review/dismiss', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      await metaStore.updateMeta({
        transactionDetection: {
          ...DEFAULT_TRANSACTION_DETECTION,
          pendingDrafts: [
            {
              id: 'draft-ui-1',
              type: 'expense',
              amount: 320,
              date: '2026-11-25',
              suggestedNote: 'Coffee Shop',
              sourcePackage: 'com.google.android.apps.nbu.paisa.user',
              confidence: 'high',
              fingerprint: 'abc123',
              createdAtMs: 1000,
              expiresAtMs: 9999999999999,
            },
          ],
        },
      });

      let renderer: TestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = TestRenderer.create(
          <ThemeProvider>
            <TransactionDetectionScreen />
          </ThemeProvider>,
        );
        await flushPromises();
      });

      expect(JSON.stringify(renderer!.toJSON())).toContain('Coffee Shop');

      const reviewBtn = findButtonByLabel(renderer!.root, 'Review & add');
      await act(async () => {
        reviewBtn.props.onPress();
      });
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/transaction-form',
        params: {
          draftId: 'draft-ui-1',
          type: 'expense',
          amount: '320',
          date: '2026-11-25',
          note: 'Coffee Shop',
        },
      });

      const switches = renderer!.root.findAllByType(Switch);
      await act(async () => {
        switches[0].props.onValueChange(true);
        await flushPromises();
      });
      expect(JSON.stringify(renderer!.toJSON())).toContain('Prominent disclosure: Notification access');

      const continueBtn = findButtonByLabel(renderer!.root, 'I understand & continue');
      await act(async () => {
        await continueBtn.props.onPress();
        await flushPromises();
      });
      expect(notificationListenerAdapter.openNotificationAccessSettings).toHaveBeenCalled();

      const dismissBtn = findButtonByLabel(renderer!.root, 'Dismiss');
      await act(async () => {
        dismissBtn.props.onPress();
        await flushPromises();
      });
      expect(JSON.stringify(renderer!.toJSON())).toContain('No pending drafts');
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });
});
