import type { PlannedReminder } from '../../domain/reminders';
import { createReminderScheduler, MAX_SCHEDULED_REMINDERS } from '../reminderScheduler';

function reminder(id: string): PlannedReminder {
  return {
    id,
    dueItemId: id,
    kind: 'same-day',
    fireAt: '2026-03-01T09:00',
    title: 'Bill',
    body: 'Due today',
    target: { dueItemId: id, dueDate: '2026-03-01' },
  };
}

describe('reminder scheduler', () => {
  it('cancels the old set before scheduling the planned set on every refresh', async () => {
    const calls: string[] = [];
    const scheduler = createReminderScheduler({
      ensureChannel: async () => { calls.push('channel'); },
      cancelAll: async () => { calls.push('cancel'); },
      schedule: async (item) => { calls.push(`schedule:${item.id}`); },
    });

    await scheduler.refresh([reminder('one'), reminder('two')]);
    expect(calls).toEqual(['channel', 'cancel', 'schedule:one', 'schedule:two']);
    calls.length = 0;
    await scheduler.refresh([reminder('three')]);
    expect(calls).toEqual(['channel', 'cancel', 'schedule:three']);
  });

  it('serializes overlapping refreshes and leaves the newest set scheduled last', async () => {
    const calls: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstScheduleStarted = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const scheduler = createReminderScheduler({
      ensureChannel: async () => { calls.push('channel'); },
      cancelAll: async () => { calls.push('cancel'); },
      schedule: async (item) => {
        calls.push(`schedule:${item.id}`);
        if (item.id === 'first') {
          await firstScheduleStarted;
        }
      },
    });

    const first = scheduler.refresh([reminder('first')]);
    const second = scheduler.refresh([reminder('second')]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toEqual(['channel', 'cancel', 'schedule:first']);
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(calls).toEqual([
      'channel',
      'cancel',
      'schedule:first',
      'channel',
      'cancel',
      'schedule:second',
    ]);
  });

  it('cancels without creating a channel when the planned set is empty', async () => {
    const calls: string[] = [];
    const scheduler = createReminderScheduler({
      ensureChannel: async () => { calls.push('channel'); },
      cancelAll: async () => { calls.push('cancel'); },
      schedule: async () => { calls.push('schedule'); },
    });
    await scheduler.refresh([]);
    await scheduler.cancel();
    expect(calls).toEqual(['cancel', 'cancel']);
  });

  it('caps a planned set at the platform-safe rolling window', async () => {
    const scheduled: string[] = [];
    const scheduler = createReminderScheduler({
      ensureChannel: async () => {},
      cancelAll: async () => {},
      schedule: async (item) => { scheduled.push(item.id); },
    });
    const reminders = Array.from({ length: MAX_SCHEDULED_REMINDERS + 1 }, (_, index) =>
      reminder(`reminder-${index}`));
    await scheduler.refresh(reminders);
    expect(scheduled).toHaveLength(MAX_SCHEDULED_REMINDERS);
    expect(scheduled.at(-1)).toBe(`reminder-${MAX_SCHEDULED_REMINDERS - 1}`);
  });
});
