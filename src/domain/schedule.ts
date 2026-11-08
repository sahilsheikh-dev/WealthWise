import { addMonths } from './dates';
import { loanState } from './liability';
import {
  classifySlot,
  generateSlots,
  matchEntriesFIFO,
  summarizeSlots,
  type ScheduleStatus,
  type SlotRow,
  type SlotSummary,
} from './slots';
import { policySchedule } from './policySchedule';
import { holdingCapabilities } from './holdingCapabilities';
import { PERIODS_PER_YEAR, scheduledDate, totalPeriods } from './sip';
import type {
  AppData,
  ISODate,
  Liability,
  PlanHolding,
  RecurringLiability,
} from './types';

export type { ScheduleStatus } from './slots';
export type ScheduleRow = SlotRow;
export type ScheduleSummary = SlotSummary;

export type PlanSchedule = {
  rows: ScheduleRow[];
  summary: ScheduleSummary;
};

export type LiabilitySchedule = PlanSchedule & {
  shortfall: boolean;
  neverClears: boolean;
};

export type UpcomingDue = {
  kind: 'plan' | 'liability' | 'policy';
  parentId: string;
  name: string;
  row: ScheduleRow;
};

function firstPlanIndex(plan: PlanHolding): number {
  const periods = totalPeriods(plan);
  let low = 0;
  let high = periods;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (scheduledDate(plan, middle) < plan.trackFrom) low = middle + 1;
    else high = middle;
  }
  return low;
}

function planAmount(plan: PlanHolding, index: number): number {
  const stepUp = plan.stepUpPct / 100;
  return Math.round(plan.amount * (1 + stepUp) ** Math.floor(index / PERIODS_PER_YEAR[plan.frequency]) * 100) / 100;
}

function orderedByDate<T extends { date: ISODate; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

function planSlots(plan: PlanHolding, first: number, count: number) {
  return generateSlots(
    count,
    first,
    (index) => scheduledDate(plan, index),
    (index) => planAmount(plan, index),
    (index) => `plan:${index}`,
  );
}

function planRows(plan: PlanHolding, asOf: ISODate): ScheduleRow[] {
  const first = firstPlanIndex(plan);
  const slots = planSlots(plan, first, totalPeriods(plan));
  const stopDate = plan.stopDate;
  const visibleSlots = slots.filter((slot) =>
    (!stopDate || slot.dueDate <= stopDate)
    && (!plan.maturityDate || slot.dueDate <= plan.maturityDate),
  );
  const deposits = plan.logs.filter((entry) => entry.kind === 'Deposit' && entry.date >= plan.trackFrom);
  const matches = matchEntriesFIFO(visibleSlots, deposits.filter((entry) => entry.date <= asOf));
  return visibleSlots.map((slot) => {
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
}

export function planSchedule(plan: PlanHolding, asOf: ISODate): PlanSchedule {
  if (!holdingCapabilities(plan.type).recurring) {
    const rows: ScheduleRow[] = [];
    return { rows, summary: summarizeSlots(rows) };
  }
  const rows = planRows(plan, asOf);
  return { rows, summary: summarizeSlots(rows) };
}

export function planNextRows(plan: PlanHolding, asOf: ISODate, count: number): ScheduleRow[] {
  const take = Math.max(0, Math.floor(count));
  if (take === 0 || !holdingCapabilities(plan.type).recurring) return [];
  const total = totalPeriods(plan);
  const first = firstPlanIndex(plan);
  const depositCount = plan.logs.reduce((count, entry) =>
    count + (entry.kind === 'Deposit' && entry.date >= plan.trackFrom ? 1 : 0), 0);
  const firstUnpaid = Math.min(total, first + depositCount);
  const end = Math.min(total, firstUnpaid + take);
  const visibleSlots = planSlots(plan, firstUnpaid, end)
    .filter((slot) =>
      (!plan.stopDate || slot.dueDate <= plan.stopDate)
      && (!plan.maturityDate || slot.dueDate <= plan.maturityDate),
    );
  return visibleSlots.map((slot) => ({
    id: slot.id,
    index: slot.index,
    dueDate: slot.dueDate,
    amount: slot.amount,
    status: classifySlot(slot.dueDate, slot.nextDueDate, asOf),
  }));
}

function liabilityDueDate(liability: RecurringLiability, index: number): ISODate {
  return addMonths(liability.startDate, index);
}

function recurringLiabilitySchedule(liability: RecurringLiability, asOf: ISODate): LiabilitySchedule {
  const slots = generateSlots(
    liability.tenureMonths + 1,
    1,
    (index) => liabilityDueDate(liability, index),
    () => liability.emi,
    (index) => `liability:${index}`,
  );
  const emiPayments = liability.payments.filter((payment) => payment.kind === 'EMI' && payment.date <= asOf);
  const matches = matchEntriesFIFO(slots, emiPayments);
  const settlement = liability.settlement;
  let balance = loanState(liability, asOf).balance;
  const monthlyRate = liability.ratePct / 1200;
  let neverClears = balance >= 1 && liability.emi <= balance * monthlyRate;
  const rows: ScheduleRow[] = [];

  if (settlement !== null) balance = settlement.balance;
  for (const slot of slots) {
    const { index, dueDate, nextDueDate } = slot;
    const payment = matches.get(index);
    if (payment) {
      rows.push({
        id: `liability:${index}`,
        index,
        dueDate,
        amount: payment.amount,
        status: 'paid',
        paidOn: payment.date,
        paidAmount: payment.amount,
        entryId: payment.id,
      });
      continue;
    }
    if (settlement !== null && dueDate <= settlement.asOf) {
      rows.push({
        id: slot.id,
        index,
        dueDate,
        amount: slot.amount,
        status: 'paid',
        paidAmount: slot.amount,
        assumed: true,
      });
      continue;
    }
    if (balance < 1) break;
    const interest = balance * monthlyRate;
    if (liability.emi <= interest && liability.emi > 0) neverClears = true;
    const amount = Math.min(liability.emi, balance + interest);
    const principal = Math.max(0, amount - interest);
    balance = Math.max(0, balance + interest - amount);
    rows.push({
      id: slot.id,
      index,
      dueDate,
      amount,
      status: classifySlot(dueDate, nextDueDate, asOf),
      interest,
      principal,
      balanceAfter: balance,
    });
  }

  return {
    rows,
    summary: summarizeSlots(rows),
    shortfall: balance >= 1,
    neverClears,
  };
}

function oneTimeLiabilitySchedule(liability: Extract<Liability, { kind: 'one-time' }>, asOf: ISODate): LiabilitySchedule {
  const state = loanState(liability, asOf);
  const dueDate = liability.dueDate ?? liability.startDate;
  const payment = orderedByDate(liability.payments.filter((row) => row.kind === 'Payment' && row.date <= asOf)).at(-1);
  const status: ScheduleStatus = state.balance < 1
    ? 'paid'
    : liability.dueDate === null || liability.dueDate === asOf
      ? 'ongoing'
      : liability.dueDate > asOf
        ? 'upcoming'
        : 'overdue';
  const row: ScheduleRow = {
    id: `liability:${liability.id}`,
    index: 1,
    dueDate,
    amount: state.balance,
    status,
    ...(status === 'paid' && payment
      ? { paidOn: payment.date, paidAmount: payment.amount, entryId: payment.id }
      : {}),
  };
  return {
    rows: [row],
    summary: summarizeSlots([row]),
    shortfall: false,
    neverClears: false,
  };
}

export function liabilitySchedule(liability: Liability, asOf: ISODate): LiabilitySchedule {
  return liability.kind === 'recurring'
    ? recurringLiabilitySchedule(liability, asOf)
    : oneTimeLiabilitySchedule(liability, asOf);
}

const STATUS_ORDER: Record<ScheduleStatus, number> = {
  overdue: 0,
  ongoing: 1,
  upcoming: 2,
  paid: 3,
};

export function upcomingDue(data: AppData, asOf: ISODate, limit = 5): UpcomingDue[] {
  const take = Math.max(0, Math.floor(limit));
  if (take === 0) return [];
  const rows: UpcomingDue[] = [];
  for (const holding of data.holdings) {
    if (holding.kind !== 'plan') continue;
    for (const row of planNextRows(holding, asOf, take)) {
      rows.push({ kind: 'plan', parentId: holding.id, name: holding.name, row });
    }
  }
  for (const liability of data.liabilities) {
    const schedule = liabilitySchedule(liability, asOf);
    if (schedule.summary.nextDue) {
      rows.push({
        kind: 'liability',
        parentId: liability.id,
        name: liability.name,
        row: schedule.summary.nextDue,
      });
    }
  }
  for (const policy of data.policies) {
    const schedule = policySchedule(policy, asOf);
    if (schedule.summary.nextDue) {
      rows.push({
        kind: 'policy',
        parentId: policy.id,
        name: policy.name,
        row: schedule.summary.nextDue,
      });
    }
  }
  return rows
    .sort((a, b) => STATUS_ORDER[a.row.status] - STATUS_ORDER[b.row.status]
      || a.row.dueDate.localeCompare(b.row.dueDate)
      || a.name.localeCompare(b.name)
      || a.row.index - b.row.index)
    .slice(0, take);
}
