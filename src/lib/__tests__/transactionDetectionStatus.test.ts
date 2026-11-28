import { DEFAULT_TRANSACTION_DETECTION, type BackupMeta } from '../../data/metaStore';
import {
  getTransactionDetectionStatus,
  loadTransactionDetectionStatus,
} from '../transactionDetectionStatus';
import { notificationListenerAdapter } from '../notificationListener';

jest.mock('../reminderNotifications', () => ({
  reminderNotificationAdapter: {
    getPermissionState: jest.fn(async () => 'granted'),
  },
}));

describe('getTransactionDetectionStatus', () => {
  it('returns unavailable on non-Android platforms', () => {
    const result = getTransactionDetectionStatus({
      supported: false,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });
    expect(result.status).toBe('unavailable');
    expect(result.label).toBe('Unavailable on iOS');
    expect(result.actionLabel).toBe('Details');
  });

  it('returns not_setup when opt-in is disabled on Android', () => {
    const result = getTransactionDetectionStatus({
      supported: true,
      enabled: false,
      listenerGranted: false,
      notificationPermission: 'denied',
      pendingDraftCount: 0,
    });
    expect(result.status).toBe('not_setup');
    expect(result.label).toBe('Not set up');
    expect(result.actionLabel).toBe('Set up');
  });

  it('returns access_needed when enabled but Notification Access is revoked', () => {
    const result = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: false,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });
    expect(result.status).toBe('access_needed');
    expect(result.label).toBe('Notification access needed');
    expect(result.actionLabel).toBe('Fix access');
  });

  it('returns notifications_needed when listener is granted but POST_NOTIFICATIONS is missing', () => {
    const result = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'denied',
      pendingDraftCount: 0,
    });
    expect(result.status).toBe('notifications_needed');
    expect(result.label).toBe('Notification permission needed');
    expect(result.actionLabel).toBe('Allow');
  });

  it('returns enabled when Android permissions and opt-in are active, highlighting pending drafts', () => {
    const idle = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'granted',
      pendingDraftCount: 0,
    });
    expect(idle.status).toBe('enabled');
    expect(idle.label).toBe('Enabled');
    expect(idle.actionLabel).toBe('Settings');

    const withDrafts = getTransactionDetectionStatus({
      supported: true,
      enabled: true,
      listenerGranted: true,
      notificationPermission: 'granted',
      pendingDraftCount: 2,
    });
    expect(withDrafts.status).toBe('enabled');
    expect(withDrafts.actionLabel).toBe('Review');
    expect(withDrafts.description).toContain('2 detected transaction drafts');
  });

  it('loads status from adapters and metaStore without misreporting revoked access', async () => {
    const supportedSpy = jest.spyOn(notificationListenerAdapter, 'isSupported').mockReturnValue(true);
    const grantedSpy = jest.spyOn(notificationListenerAdapter, 'isPermissionGranted').mockResolvedValue(false);

    const status = await loadTransactionDetectionStatus({
      getMeta: async (): Promise<BackupMeta> => ({
        transactionDetection: {
          ...DEFAULT_TRANSACTION_DETECTION,
          enabled: true,
          allowedPackages: ['com.google.android.apps.nbu.paisa.user'],
        },
      }),
    });

    expect(status.status).toBe('access_needed');
    expect(status.label).toBe('Notification access needed');
    supportedSpy.mockRestore();
    grantedSpy.mockRestore();
  });
});
