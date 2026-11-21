import type { PlannedReminder } from '../domain/reminders';

export const MAX_SCHEDULED_REMINDERS = 60;

export type ReminderNotificationAdapter = {
  ensureChannel: () => Promise<void>;
  cancelAll: () => Promise<void>;
  schedule: (reminder: PlannedReminder) => Promise<void>;
};

export function createReminderScheduler(adapter: ReminderNotificationAdapter) {
  let queue = Promise.resolve();

  function serialize(operation: () => Promise<void>): Promise<void> {
    const result = queue.then(operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  return {
    refresh(reminders: readonly PlannedReminder[]): Promise<void> {
      const planned = reminders.slice(0, MAX_SCHEDULED_REMINDERS);
      return serialize(async () => {
        if (planned.length > 0) await adapter.ensureChannel();
        await adapter.cancelAll();
        for (const reminder of planned) await adapter.schedule(reminder);
      });
    },
    cancel(): Promise<void> {
      return serialize(() => adapter.cancelAll());
    },
  };
}
