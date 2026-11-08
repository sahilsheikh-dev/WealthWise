import { addMonths } from './dates';
import { classifySlot, generateSlots, matchEntriesFIFO, summarizeSlots } from './slots';
import type { PlanSchedule, ScheduleRow } from './schedule';
import type { Policy } from './types';

const MONTHS_PER_PAYMENT: Record<Policy['frequency'], number> = {
  monthly: 1,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
};

function dueDateAt(policy: Policy, index: number): string {
  return addMonths(policy.startDate, index * MONTHS_PER_PAYMENT[policy.frequency]);
}

function firstTrackedIndex(policy: Policy, count: number): number {
  let index = 0;
  while (index < count && dueDateAt(policy, index) < policy.trackFrom) index += 1;
  return index;
}

export function policySchedule(policy: Policy, asOf: string): PlanSchedule {
  if (policy.status !== 'active') return { rows: [], summary: summarizeSlots([]) };
  let count = (policy.premiumYears ?? 0) * (12 / MONTHS_PER_PAYMENT[policy.frequency]);
  while (count > 0 && policy.endDate !== undefined && dueDateAt(policy, count - 1) > policy.endDate) {
    count -= 1;
  }
  const first = firstTrackedIndex(policy, count);
  const slots = generateSlots(
    count,
    first,
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
