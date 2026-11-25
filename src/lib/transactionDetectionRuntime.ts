import { Platform } from 'react-native';

import { DEFAULT_TRANSACTION_DETECTION, type PersistedTransactionDetection } from '../data/metaStore';
import { metaStore } from '../data/store';
import {
  pruneExpiredDetectionState,
  reconcileTransactionDrafts,
  type PendingTransactionDraft,
  type RawDetectedNotification,
} from '../domain/transactionDetection';
import { notificationListenerAdapter } from './notificationListener';

export const DRAFT_REVIEW_CATEGORY_ID = 'transaction-draft-review';
export const DRAFT_REVIEW_ACTION_ID = 'review_draft';

type NotificationsModule = typeof import('expo-notifications');

function loadNotifications(): NotificationsModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as NotificationsModule;
}

export async function ensureTransactionDraftNotificationCategory(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = loadNotifications();
  await Notifications.setNotificationChannelAsync('transaction-drafts', {
    name: 'Transaction Drafts',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationCategoryAsync(DRAFT_REVIEW_CATEGORY_ID, [
    {
      identifier: DRAFT_REVIEW_ACTION_ID,
      buttonTitle: 'Review',
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function postGenericDraftReviewNotification(draftId: string): Promise<void> {
  if (Platform.OS !== 'android') return;
  const Notifications = loadNotifications();
  await ensureTransactionDraftNotificationCategory();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Wealth Wise',
      body: 'Transaction draft ready to review.',
      categoryIdentifier: DRAFT_REVIEW_CATEGORY_ID,
      data: { type: 'wealthwise-transaction-draft', draftId },
    },
    trigger: null,
  });
}

function makeDraftId(nowMs: number, index: number): string {
  return `draft-${nowMs}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function ingestDetectedNotifications(
  incoming: readonly RawDetectedNotification[],
  nowMs = Date.now(),
): Promise<{
  detection: PersistedTransactionDetection;
  addedDrafts: PendingTransactionDraft[];
}> {
  const meta = await metaStore.getMeta();
  const current = meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION;
  if (!current.enabled) {
    const pruned = pruneExpiredDetectionState(current.pendingDrafts, current.seenFingerprints, nowMs);
    if (
      pruned.drafts.length !== current.pendingDrafts.length ||
      pruned.seenFingerprints.length !== current.seenFingerprints.length
    ) {
      const updated: PersistedTransactionDetection = {
        ...current,
        pendingDrafts: pruned.drafts,
        seenFingerprints: pruned.seenFingerprints,
      };
      await metaStore.updateMeta({ transactionDetection: updated });
      return { detection: updated, addedDrafts: [] };
    }
    return { detection: current, addedDrafts: [] };
  }

  const allowedSet = new Set(current.allowedPackages);
  const filteredIncoming = allowedSet.size > 0
    ? incoming.filter((item) => allowedSet.has(item.packageName))
    : incoming;

  const reconciled = reconcileTransactionDrafts(
    current.pendingDrafts,
    current.seenFingerprints,
    filteredIncoming,
    nowMs,
    (index) => makeDraftId(nowMs, index),
  );

  const next: PersistedTransactionDetection = {
    ...current,
    pendingDrafts: reconciled.drafts,
    seenFingerprints: reconciled.seenFingerprints,
  };
  await metaStore.updateMeta({ transactionDetection: next });
  return { detection: next, addedDrafts: reconciled.addedDrafts };
}

export { removeTransactionDraft } from './transactionDetectionDrafts';

export async function syncNativeDetectionConfig(): Promise<void> {
  const meta = await metaStore.getMeta();
  const current = meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION;
  await notificationListenerAdapter.setDetectionConfig(current.enabled, current.allowedPackages);
}
