import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { DEFAULT_TRANSACTION_DETECTION } from '../../data/metaStore';
import { metaStore, useAppStore } from '../../data/store';
import {
  ingestDetectedNotifications,
  postGenericDraftReviewNotification,
  removeTransactionDraft,
} from '../transactionDetectionRuntime';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  setNotificationChannelAsync: jest.fn(async () => undefined),
  setNotificationCategoryAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'notif-1'),
}));

const NOW = Date.UTC(2026, 10, 25, 14, 0, 0);

describe('transactionDetectionRuntime', () => {
  beforeEach(async () => {
    await metaStore.clearMeta();
    jest.clearAllMocks();
  });

  it('never ingests notifications or mutates AppData when disabled', async () => {
    const beforeTxCount = useAppStore.getState().data.transactions.length;
    const result = await ingestDetectedNotifications(
      [
        {
          packageName: 'com.google.android.apps.nbu.paisa.user',
          title: 'Paid ₹500 to Cafe',
          text: 'Debited ₹500 via UPI',
          postedAtMs: NOW,
        },
      ],
      NOW,
    );

    expect(result.addedDrafts).toHaveLength(0);
    expect(result.detection.pendingDrafts).toHaveLength(0);
    expect(useAppStore.getState().data.transactions.length).toBe(beforeTxCount);
  });

  it('respects allowedPackages and creates reviewable drafts without touching AppData', async () => {
    const beforeTxCount = useAppStore.getState().data.transactions.length;
    await metaStore.updateMeta({
      transactionDetection: {
        ...DEFAULT_TRANSACTION_DETECTION,
        enabled: true,
        allowedPackages: ['com.google.android.apps.nbu.paisa.user'],
      },
    });

    const result = await ingestDetectedNotifications(
      [
        {
          packageName: 'com.unknown.spam',
          title: 'Paid ₹999 to Unknown',
          text: 'Debited ₹999',
          postedAtMs: NOW,
        },
        {
          packageName: 'com.google.android.apps.nbu.paisa.user',
          title: 'Paid ₹250 to Metro',
          text: 'Debited ₹250 via UPI',
          postedAtMs: NOW,
        },
      ],
      NOW,
    );

    expect(result.addedDrafts).toHaveLength(1);
    expect(result.addedDrafts[0]?.amount).toBe(250);
    expect(useAppStore.getState().data.transactions.length).toBe(beforeTxCount);

    await removeTransactionDraft(result.addedDrafts[0]!.id);
    const metaAfter = await metaStore.getMeta();
    expect(metaAfter.transactionDetection?.pendingDrafts).toHaveLength(0);
  });

  it('posts generic privacy-safe notification on Android with Review action', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      await postGenericDraftReviewNotification('draft-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Wealth Wise',
            body: 'Transaction draft ready to review.',
            categoryIdentifier: 'transaction-draft-review',
            data: { type: 'wealthwise-transaction-draft', draftId: 'draft-123' },
          }),
        }),
      );
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });
});
