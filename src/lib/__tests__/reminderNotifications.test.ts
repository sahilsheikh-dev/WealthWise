import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { DEFAULT_REMINDER_PREFERENCES } from '../../data/metaStore';
import { reminderNotificationAdapter } from '../reminderNotifications';
import { enableReminderPreferences } from '../reminderPreferences';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  setNotificationChannelAsync: jest.fn(async () => undefined),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, canAskAgain: true })),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'id-1'),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
}));

describe('reminderNotificationAdapter (P24-A-R1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works when requestPermission and getPermissionState are passed as unbound callbacks', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      const { getPermissionState, requestPermission } = reminderNotificationAdapter;
      const save = jest.fn(async (prefs) => prefs);

      const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
        getPermissionState,
        requestPermission,
        save,
      });

      expect(result.permission).toBe('granted');
      expect(result.preferences.enabled).toBe(true);
      expect(save).toHaveBeenCalledWith({ ...DEFAULT_REMINDER_PREFERENCES, enabled: true });

      const channelOrder = (Notifications.setNotificationChannelAsync as jest.Mock).mock.invocationCallOrder[0];
      const requestOrder = (Notifications.requestPermissionsAsync as jest.Mock).mock.invocationCallOrder[0];
      expect(channelOrder).toBeDefined();
      expect(requestOrder).toBeDefined();
      expect(channelOrder!).toBeLessThan(requestOrder!);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });

  it('keeps reminders disabled on denial and reports blocked when canAskAgain is false', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        canAskAgain: true,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        canAskAgain: false,
      });
      const save = jest.fn(async (prefs) => prefs);
      const { getPermissionState, requestPermission } = reminderNotificationAdapter;

      const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
        getPermissionState,
        requestPermission,
        save,
      });

      expect(result.permission).toBe('blocked');
      expect(result.preferences.enabled).toBe(false);
      expect(save).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    }
  });
});
