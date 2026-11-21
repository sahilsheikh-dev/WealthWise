import { addMonths } from './dates';
import { classifySlot, generateSlots, matchEntriesFIFO, summarizeSlots } from './slots';
import type { PlanSchedule, ScheduleRow } from './schedule';
import type { Policy } from './types';

const MONTHS_PER_PAYMENT: Record<Policy['frequency'], number> = {
  monthly: 1,
  quarterly: 3,
  'half-yearly': 6,
  yearly: 12,
  once: 1,
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
  if (policy.frequency === 'once') {
    count = policy.trackFrom <= lastDate ? 1 : 0;
  } else {
    while (count < 1400 && dueDateAt(policy, count) <= lastDate) count += 1;
  }
  const slots = generateSlots(
    count,
    0,
    (index) => dueDateAt(policy, index),
    () => policy.premium,
    (index) => `policy:${index}`,
  );
  const eligiblePayments = policy.payments.filter((payment) => payment.date <= asOf);
  const slotsByDate = new Map(slots.map((slot) => [slot.dueDate, slot]));
  const matches = new Map<number, (typeof eligiblePayments)[number]>();
  const matchedSlotIndices = new Set<number>();
  for (const payment of eligiblePayments
    .filter((entry) => entry.dueDate !== undefined)
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))) {
    const slot = slotsByDate.get(payment.dueDate ?? '');
    if (!slot || matchedSlotIndices.has(slot.index)) continue;
    matches.set(slot.index, payment);
    matchedSlotIndices.add(slot.index);
  }
  const legacySlots = slots.filter((slot) => !matchedSlotIndices.has(slot.index));
  const legacyMatches = matchEntriesFIFO(
    legacySlots,
    eligiblePayments.filter((payment) =>
      payment.dueDate === undefined && payment.date >= policy.trackFrom),
  );
  for (const [index, payment] of legacyMatches) matches.set(index, payment);
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
