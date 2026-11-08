import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import type { PlannedReminder } from '../domain/reminders';
import type { ReminderNotificationAdapter } from './reminderScheduler';
import { reminderPermissionState, type ReminderPermissionState } from './reminderPermissions';

export type NotificationResponseEnvelope = { identifier: string; data: unknown };

function dateFromLocalTime(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new RangeError('Reminder trigger time is invalid.');
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
}

export const reminderNotificationAdapter: ReminderNotificationAdapter & {
  getPermissionState: () => Promise<ReminderPermissionState>;
  requestPermission: () => Promise<ReminderPermissionState>;
  openSettings: () => Promise<void>;
  scheduleTest: () => Promise<void>;
  addResponseListener: (listener: (response: NotificationResponseEnvelope) => void) => () => void;
  getLastResponse: () => Promise<NotificationResponseEnvelope | null>;
  clearLastResponse: () => Promise<void>;
} = {
  async getPermissionState() {
    return reminderPermissionState(await Notifications.getPermissionsAsync());
  },
  async requestPermission() {
    await this.ensureChannel();
    return reminderPermissionState(await Notifications.requestPermissionsAsync());
  },
  async openSettings() {
    await Linking.openSettings();
  },
  async ensureChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  },
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
  async schedule(reminder: PlannedReminder) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { type: 'wealthwise-reminder', target: reminder.target },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: dateFromLocalTime(reminder.fireAt),
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      },
    });
  },
  async scheduleTest() {
    await this.ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Wealth Wise',
        body: 'This is a test notification.',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      },
    });
  },
  addResponseListener(listener) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      listener({
        identifier: response.notification.request.identifier,
        data: response.notification.request.content.data,
      });
    });
    return () => subscription.remove();
  },
  async getLastResponse() {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response
      ? {
        identifier: response.notification.request.identifier,
        data: response.notification.request.content.data,
      }
      : null;
  },
  async clearLastResponse() {
    await Notifications.clearLastNotificationResponseAsync();
  },
};
