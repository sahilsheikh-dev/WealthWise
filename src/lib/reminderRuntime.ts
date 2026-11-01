import { reminderNotificationAdapter } from './reminderNotifications';
import { createReminderScheduler } from './reminderScheduler';

export const reminderScheduler = createReminderScheduler(reminderNotificationAdapter);
