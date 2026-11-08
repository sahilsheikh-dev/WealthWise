import { addMonths } from './dates';
import { classifySlot, generateSlots, matchEntriesFIFO, summarizeSlots } from './slots';
import type { PlanSchedule, ScheduleRow } from './schedule';
import type { Policy } from './types';

const MONTHS_PER_PAYMENT: Record<Policy['frequency'], number> = {
  monthly: 1,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
  custom: 1,
};

function dueDateAt(policy: Policy, index: number): string {
  const interval = policy.frequency === 'custom'
    ? policy.customIntervalMonths ?? 1
    : MONTHS_PER_PAYMENT[policy.frequency];
  return addMonths(policy.trackFrom, index * interval);
}

export function policySchedule(policy: Policy, asOf: string): PlanSchedule {
  if (policy.status !== 'active') return { rows: [], summary: summarizeSlots([]) };
  const lastDate = policy.endDate ?? '2100-12-31';
  let count = 0;
  while (count < 1400 && dueDateAt(policy, count) <= lastDate) count += 1;
  const slots = generateSlots(
    count,
    0,
    (index) => dueDateAt(policy, index),
    () => policy.premium,
    (index) => `policy:${index}`,
  );
  const matches = matchEntriesFIFO(
    slots,
    policy.payments.filter((payment) => payment.date >= policy.trackFrom && payment.date <= asOf),
  );
  const rows: ScheduleRow[] = slots.map((slot) => {
    const payment = matches.get(slot.index);
    return payment
      ? {
        id: slot.id,
        index: slot.index,
        dueDate: slot.dueDate,
        amount: slot.amount,
        status: 'paid',
        paidOn: payment.date,
        paidAmount: payment.amount,
        entryId: payment.id,
      }
      : {
        id: slot.id,
        index: slot.index,
        dueDate: slot.dueDate,
        amount: slot.amount,
        status: classifySlot(slot.dueDate, slot.nextDueDate, asOf),
      };
  });
  return { rows, summary: summarizeSlots(rows) };
}
