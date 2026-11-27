import { DEFAULT_TRANSACTION_DETECTION, type BackupMeta } from '../data/metaStore';
import { notificationListenerAdapter } from './notificationListener';
import type { ReminderPermissionState } from './reminderPermissions';

export type TransactionDetectionStatusCode =
  | 'unavailable'
  | 'not_setup'
  | 'access_needed'
  | 'notifications_needed'
  | 'enabled';

export type TransactionDetectionStatusInfo = {
  status: TransactionDetectionStatusCode;
  label: string;
  description: string;
  actionLabel: string;
  pendingDraftCount: number;
};

export function getTransactionDetectionStatus(input: {
  supported: boolean;
  enabled: boolean;
  listenerGranted: boolean;
  notificationPermission: ReminderPermissionState;
  pendingDraftCount: number;
}): TransactionDetectionStatusInfo {
  const { supported, enabled, listenerGranted, notificationPermission, pendingDraftCount } = input;
  const draftPrefix =
    pendingDraftCount > 0
      ? `${pendingDraftCount} detected draft${pendingDraftCount === 1 ? '' : 's'} ready. `
      : '';

  if (!supported) {
    return {
      status: 'unavailable',
      label: 'Unavailable on iOS',
      description: 'Automatic notification detection is Android-only. Add transactions manually or import a backup.',
      actionLabel: 'Details',
      pendingDraftCount,
    };
  }

  if (!enabled) {
    return {
      status: 'not_setup',
      label: 'Not set up',
      description: `${draftPrefix}Opt in to detect likely transactions from selected Android payment notifications.`,
      actionLabel: pendingDraftCount > 0 ? 'Review' : 'Set up',
      pendingDraftCount,
    };
  }

  if (!listenerGranted) {
    return {
      status: 'access_needed',
      label: 'Notification access needed',
      description: `${draftPrefix}Grant Android Notification Access (separate from post notifications) so WealthWise can read selected payment alerts.`,
      actionLabel: 'Fix access',
      pendingDraftCount,
    };
  }

  if (notificationPermission !== 'granted') {
    return {
      status: 'notifications_needed',
      label: 'Notification permission needed',
      description: `${draftPrefix}Allow WealthWise to post notifications so background detections can show a Review alert.`,
      actionLabel: 'Allow',
      pendingDraftCount,
    };
  }

  return {
    status: 'enabled',
    label: 'Enabled',
    description:
      pendingDraftCount > 0
        ? `${pendingDraftCount} detected transaction draft${pendingDraftCount === 1 ? '' : 's'} ready to review.`
        : 'Listening for selected payment notifications on this Android device.',
    actionLabel: pendingDraftCount > 0 ? 'Review' : 'Settings',
    pendingDraftCount,
  };
}

async function readNotificationPermission(): Promise<ReminderPermissionState> {
  try {
    const { reminderNotificationAdapter } = await import('./reminderNotifications');
    if (typeof reminderNotificationAdapter?.getPermissionState === 'function') {
      return await reminderNotificationAdapter.getPermissionState();
    }
  } catch {
    return 'denied';
  }
  return 'denied';
}

export async function loadTransactionDetectionStatus(
  metaSource?: { getMeta?: () => Promise<BackupMeta> },
): Promise<TransactionDetectionStatusInfo> {
  const supported = notificationListenerAdapter.isSupported();
  const [meta, listenerGranted, notificationPermission] = await Promise.all([
    typeof metaSource?.getMeta === 'function' ? metaSource.getMeta() : Promise.resolve({} as BackupMeta),
    supported ? notificationListenerAdapter.isPermissionGranted() : Promise.resolve(false),
    supported ? readNotificationPermission() : Promise.resolve<ReminderPermissionState>('denied'),
  ]);
  const detection = meta.transactionDetection ?? DEFAULT_TRANSACTION_DETECTION ?? {
    enabled: false,
    pendingDrafts: [],
  };
  return getTransactionDetectionStatus({
    supported,
    enabled: detection.enabled,
    listenerGranted,
    notificationPermission,
    pendingDraftCount: detection.pendingDrafts.length,
  });
}
