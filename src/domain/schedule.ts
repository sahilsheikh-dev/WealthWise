import { addMonths } from './dates';
import { loanState } from './liability';
import { PERIODS_PER_YEAR, scheduledDate, totalPeriods } from './sip';
import type {
  AppData,
  ISODate,
  Liability,
  PlanHolding,
  RecurringLiability,
} from './types';

export type ScheduleStatus = 'paid' | 'ongoing' | 'overdue' | 'upcoming';

export type ScheduleRow = {
  id: string;
  index: number;
  dueDate: ISODate;
  amount: number;
  status: ScheduleStatus;
  paidOn?: ISODate;
  paidAmount?: number;
  entryId?: string;
  interest?: number;
  principal?: number;
  balanceAfter?: number;
};

export type ScheduleSummary = {
  paid: number;
  ongoing: number;
  overdue: number;
  upcoming: number;
  nextDue: ScheduleRow | null;
  paidAmount: number;
  remainingPlanned: number;
};

export type PlanSchedule = {
  rows: ScheduleRow[];
  summary: ScheduleSummary;
};

export type LiabilitySchedule = PlanSchedule & {
  shortfall: boolean;
  neverClears: boolean;
};

export type UpcomingDue = {
  kind: 'plan' | 'liability';
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

function planUnpaidStatus(plan: PlanHolding, index: number, asOf: ISODate): ScheduleStatus {
  const dueDate = scheduledDate(plan, index);
  if (dueDate > asOf) return 'upcoming';
  const nextDue = scheduledDate(plan, index + 1);
  return asOf < nextDue ? 'ongoing' : 'overdue';
}

function summarize(rows: ScheduleRow[]): ScheduleSummary {
  const nextDue = rows.find((row) => row.status !== 'paid') ?? null;
  return {
    paid: rows.filter((row) => row.status === 'paid').length,
    ongoing: rows.filter((row) => row.status === 'ongoing').length,
    overdue: rows.filter((row) => row.status === 'overdue').length,
    upcoming: rows.filter((row) => row.status === 'upcoming').length,
    nextDue,
    paidAmount: rows.reduce((sum, row) => sum + (row.paidAmount ?? 0), 0),
    remainingPlanned: rows.reduce((sum, row) => sum + (row.status === 'paid' ? 0 : row.amount), 0),
  };
}

function orderedByDate<T extends { date: ISODate; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

function planRow(
  plan: PlanHolding,
  index: number,
  asOf: ISODate,
  paidEntry?: PlanHolding['logs'][number],
): ScheduleRow {
  const amount = planAmount(plan, index);
  const dueDate = scheduledDate(plan, index);
  return paidEntry
    ? {
      id: `plan:${index}`,
      index,
      dueDate,
      amount,
      status: 'paid',
      paidOn: paidEntry.date,
      paidAmount: paidEntry.amount,
      entryId: paidEntry.id,
    }
    : {
      id: `plan:${index}`,
      index,
      dueDate,
      amount,
      status: planUnpaidStatus(plan, index, asOf),
    };
}

export function planSchedule(plan: PlanHolding, asOf: ISODate): PlanSchedule {
  const total = totalPeriods(plan);
  const first = firstPlanIndex(plan);
  const deposits = orderedByDate(plan.logs.filter((entry) => entry.kind === 'Deposit' && entry.date >= plan.trackFrom));
  const rows = Array.from({ length: Math.max(0, total - first) }, (_, offset) =>
    planRow(plan, first + offset, asOf, deposits[offset]));
  return { rows, summary: summarize(rows) };
}

export function planNextRows(plan: PlanHolding, asOf: ISODate, count: number): ScheduleRow[] {
  const take = Math.max(0, Math.floor(count));
  if (take === 0) return [];
  const total = totalPeriods(plan);
  const first = firstPlanIndex(plan);
  const depositCount = plan.logs.reduce((count, entry) =>
    count + (entry.kind === 'Deposit' && entry.date >= plan.trackFrom ? 1 : 0), 0);
  const firstUnpaid = Math.min(total, first + depositCount);
  const end = Math.min(total, firstUnpaid + take);
  const rows: ScheduleRow[] = [];
  for (let index = firstUnpaid; index < end; index += 1) {
    rows.push(planRow(plan, index, asOf));
  }
  return rows;
}

function liabilityDueDate(liability: RecurringLiability, index: number): ISODate {
  return addMonths(liability.startDate, index);
}

function statusForDueDate(dueDate: ISODate, nextDueDate: ISODate, asOf: ISODate): ScheduleStatus {
  if (dueDate > asOf) return 'upcoming';
  return asOf < nextDueDate ? 'ongoing' : 'overdue';
}

function recurringLiabilitySchedule(liability: RecurringLiability, asOf: ISODate): LiabilitySchedule {
  const emiPayments = orderedByDate(liability.payments.filter((payment) => payment.kind === 'EMI' && payment.date <= asOf));
  const matchedCount = Math.min(liability.tenureMonths, emiPayments.length);
  let balance = loanState(liability, asOf).balance;
  const monthlyRate = liability.ratePct / 1200;
  let neverClears = balance >= 1 && liability.emi <= balance * monthlyRate;
  const rows: ScheduleRow[] = [];

  for (let index = 1; index <= liability.tenureMonths; index += 1) {
    const dueDate = liabilityDueDate(liability, index);
    const nextDueDate = liabilityDueDate(liability, index + 1);
    const payment = index <= matchedCount ? emiPayments[index - 1] : undefined;
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
    if (balance < 1) break;
    const interest = balance * monthlyRate;
    if (liability.emi <= interest && liability.emi > 0) neverClears = true;
    const amount = Math.min(liability.emi, balance + interest);
    const principal = Math.max(0, amount - interest);
    balance = Math.max(0, balance + interest - amount);
    rows.push({
      id: `liability:${index}`,
      index,
      dueDate,
      amount,
      status: statusForDueDate(dueDate, nextDueDate, asOf),
      interest,
      principal,
      balanceAfter: balance,
    });
  }

  return {
    rows,
    summary: summarize(rows),
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
    summary: summarize([row]),
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
  return rows
    .sort((a, b) => STATUS_ORDER[a.row.status] - STATUS_ORDER[b.row.status]
      || a.row.dueDate.localeCompare(b.row.dueDate)
      || a.name.localeCompare(b.name)
      || a.row.index - b.row.index)
    .slice(0, take);
}
