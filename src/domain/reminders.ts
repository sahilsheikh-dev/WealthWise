import { addDays, addMonths, monthKey, shiftMonth } from './dates';
import { pendingItems } from './pending';
import type { AppData, ISODate } from './types';
import { formatAmount } from '../lib/amountDisplay';

export type ReminderPreferences = {
  enabled: boolean;
  localTime: string;
  dayBefore: boolean;
  sameDay: boolean;
  showAmounts: boolean;
};

export type ReminderKind = 'day-before' | 'same-day';

export type ReminderTarget = {
  dueItemId: string;
  dueDate: ISODate;
};

export type PlannedReminder = {
  id: string;
  dueItemId: string;
  kind: ReminderKind;
  fireAt: string;
  title: string;
  body: string;
  target: ReminderTarget;
};

function localDate(now: Date): ISODate {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid reminder planning date.');
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function searchHorizon(data: AppData, today: ISODate): string {
  let latestMonth = shiftMonth(monthKey(today), 24);
  const extendTo = (date: ISODate) => {
    const month = monthKey(date);
    if (month > latestMonth) latestMonth = month;
  };
  for (const holding of data.holdings) {
    if (holding.kind === 'plan') extendTo(addMonths(holding.startDate, holding.tenureYears * 12));
  }
  for (const liability of data.liabilities) {
    if (liability.kind === 'recurring') {
      extendTo(addMonths(liability.startDate, liability.tenureMonths));
    } else if (liability.dueDate) {
      extendTo(liability.dueDate);
    }
  }
  for (const policy of data.policies) {
    extendTo(addMonths(policy.startDate, policy.premiumYears * 12));
    if (policy.endDate) extendTo(policy.endDate);
  }
  for (const budget of data.monthBudgets ?? []) {
    if (budget.month > latestMonth) latestMonth = budget.month;
  }
  return latestMonth;
}

function localFireTime(date: ISODate, time: string): { value: string; timestamp: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^([01]\d|2[0-3]):([03]0)$/.exec(time);
  if (!match || !timeMatch) throw new RangeError('Reminder date or time is invalid.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime();
  return { value: `${date}T${time}`, timestamp };
}

export function planReminders(
  data: AppData,
  settings: ReminderPreferences & { hidePreviews: boolean },
  now: Date,
  limit: number,
): PlannedReminder[] {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError('Reminder limit must be a non-negative integer.');
  }
  const today = localDate(now);
  const fireTime = localFireTime(today, settings.localTime);
  if (!settings.enabled || limit === 0 || (!settings.dayBefore && !settings.sameDay)) return [];

  const reminders: PlannedReminder[] = [];
  const firstMonth = monthKey(today);
  const lastMonth = searchHorizon(data, today);
  for (let month = firstMonth; month <= lastMonth; month = shiftMonth(month, 1)) {
    for (const item of pendingItems(data, month, today)) {
      if (!item.dueDate) continue;
      const candidates: { kind: ReminderKind; date: ISODate }[] = [];
      if (settings.dayBefore) candidates.push({ kind: 'day-before', date: addDays(item.dueDate, -1) });
      if (settings.sameDay) candidates.push({ kind: 'same-day', date: item.dueDate });
      for (const candidate of candidates) {
        const scheduled = localFireTime(candidate.date, settings.localTime);
        if (scheduled.timestamp <= now.getTime()) continue;
        const when = candidate.kind === 'day-before' ? 'tomorrow' : 'today';
        const amount = settings.showAmounts ? ` · ${formatAmount(item.amount, 'exact', 1)}` : '';
        reminders.push({
          id: `${item.id}:${candidate.kind}`,
          dueItemId: item.id,
          kind: candidate.kind,
          fireAt: scheduled.value,
          title: settings.hidePreviews ? 'Wealth Wise' : item.title,
          body: settings.hidePreviews
            ? `A payment is due ${when}`
            : `Due ${when}${amount}`,
          target: { dueItemId: item.id, dueDate: item.dueDate },
        });
      }
    }
    if (reminders.length >= limit) break;
  }

  return reminders
    .sort((left, right) => left.fireAt.localeCompare(right.fireAt)
      || left.dueItemId.localeCompare(right.dueItemId)
      || left.kind.localeCompare(right.kind))
    .slice(0, limit);
}
