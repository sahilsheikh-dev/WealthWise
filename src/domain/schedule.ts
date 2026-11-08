import { addMonths, addDays, compareISO } from './dates';
import { liabilityState } from './liability';
import { installmentsTracked, PERIODS_PER_YEAR, scheduledDate, totalPeriods } from './sip';
import type { AppData, ISODate, Liability, PlanHolding } from './types';

export type ScheduleStatus = 'paid' | 'ongoing' | 'overdue' | 'upcoming';
export type ScheduleRow = { id: string; index: number; dueDate: ISODate; amount: number; status: ScheduleStatus; paidOn?: ISODate; paidAmount?: number; entryId?: string; interest?: number; principal?: number; balanceAfter?: number };
export type ScheduleSummary = { paid: number; ongoing: number; overdue: number; upcoming: number; nextDue: ScheduleRow | null; paidAmount: number; remainingPlanned: number };
export type Schedule = { rows: ScheduleRow[]; summary: ScheduleSummary };

function status(dueDate: ISODate, nextDate: ISODate | null, asOf: ISODate): ScheduleStatus { if (dueDate > asOf) return 'upcoming'; return nextDate !== null && asOf < nextDate ? 'ongoing' : 'overdue'; }
function summary(rows: ScheduleRow[]): ScheduleSummary { const result = { paid: 0, ongoing: 0, overdue: 0, upcoming: 0, nextDue: null as ScheduleRow | null, paidAmount: 0, remainingPlanned: 0 }; rows.forEach((row) => { result[row.status] += 1; if (row.status !== 'paid') result.remainingPlanned += row.amount; else result.paidAmount += row.paidAmount ?? row.amount; if (!result.nextDue && row.status !== 'paid') result.nextDue = row; }); return result; }

export function planSchedule(plan: PlanHolding, asOf: ISODate): Schedule {
  const first = Array.from({ length: totalPeriods(plan) }, (_, k) => k).find((k) => scheduledDate(plan, k) >= plan.trackFrom) ?? totalPeriods(plan);
  const deposits = plan.logs.filter((entry) => entry.kind === 'Deposit' && entry.date >= plan.trackFrom).sort((a, b) => compareISO(a.date, b.date) || a.id.localeCompare(b.id));
  const rows: ScheduleRow[] = [];
  for (let k = first, depositIndex = 0; k < totalPeriods(plan); k += 1) {
    const dueDate = scheduledDate(plan, k); const amount = Math.round(plan.amount * (1 + plan.stepUpPct / 100) ** Math.floor(k / PERIODS_PER_YEAR[plan.frequency]) * 100) / 100; const paid = deposits[depositIndex++];
    if (paid) rows.push({ id: `plan-${plan.id}-${k}`, index: k, dueDate, amount, status: 'paid', paidOn: paid.date, paidAmount: paid.amount, entryId: paid.id });
    else { const nextDate = k + 1 < totalPeriods(plan) ? scheduledDate(plan, k + 1) : addDays(dueDate, plan.frequency === 'daily' ? 1 : plan.frequency === 'weekly' ? 7 : plan.frequency === 'monthly' ? 31 : 366); rows.push({ id: `plan-${plan.id}-${k}`, index: k, dueDate, amount, status: status(dueDate, nextDate, asOf) }); }
  }
  return { rows, summary: summary(rows) };
}

export function planNextRows(plan: PlanHolding, asOf: ISODate, count: number): ScheduleRow[] { return planSchedule(plan, asOf).rows.filter((row) => row.status !== 'paid').slice(0, count); }

function recurringSchedule(liability: Extract<Liability, { kind: 'recurring' }>, asOf: ISODate): Schedule {
  const state = liabilityState(liability, asOf); const payments = liability.payments.filter((payment) => payment.kind === 'EMI').sort((a, b) => compareISO(a.date, b.date) || a.id.localeCompare(b.id)); const rows: ScheduleRow[] = []; let paymentIndex = 0; let balance = state.balance;
  for (let slot = 1; slot <= liability.tenureMonths; slot += 1) {
    const dueDate = addMonths(liability.startDate, slot); const payment = payments[paymentIndex++];
    if (payment) { rows.push({ id: `liability-${liability.id}-${slot}`, index: slot, dueDate, amount: payment.amount, status: 'paid', paidOn: payment.date, paidAmount: payment.amount, entryId: payment.id }); continue; }
    if (balance < 1) break;
    const monthlyInterest = balance * liability.ratePct / 1200; const planned = Math.min(liability.emi, balance + monthlyInterest); const principal = Math.max(0, planned - monthlyInterest); balance = Math.max(0, balance - principal);
    const nextDate = slot < liability.tenureMonths ? addMonths(liability.startDate, slot + 1) : addMonths(dueDate, 1);
    rows.push({ id: `liability-${liability.id}-${slot}`, index: slot, dueDate, amount: liability.emi, status: status(dueDate, nextDate, asOf), interest: monthlyInterest, principal, balanceAfter: balance });
  }
  return { rows, summary: summary(rows) };
}

export function liabilitySchedule(liability: Liability, asOf: ISODate): Schedule {
  if (liability.kind === 'recurring') return recurringSchedule(liability, asOf);
  const state = liabilityState(liability, asOf); const dueDate = liability.dueDate; const row: ScheduleRow = { id: `liability-${liability.id}-one-time`, index: 0, dueDate: dueDate ?? asOf, amount: state.balance, status: state.balance < 1 ? 'paid' : dueDate === null ? 'ongoing' : dueDate > asOf ? 'upcoming' : 'ongoing' };
  return { rows: [row], summary: summary([row]) };
}

export type UpcomingDue = { kind: 'plan' | 'liability'; parentId: string; name: string; row: ScheduleRow };
export function upcomingDue(data: AppData, asOf: ISODate, limit = 5): UpcomingDue[] { const result: UpcomingDue[] = []; data.holdings.forEach((item) => { if (item.kind !== 'plan') return; const row = planNextRows(item, asOf, 1)[0]; if (row) result.push({ kind: 'plan', parentId: item.id, name: item.name, row }); }); data.liabilities.forEach((item) => { const row = liabilitySchedule(item, asOf).rows.find((entry) => entry.status !== 'paid'); if (row) result.push({ kind: 'liability', parentId: item.id, name: item.name, row }); }); const order: Record<ScheduleStatus, number> = { overdue: 0, ongoing: 1, upcoming: 2, paid: 3 }; return result.sort((a, b) => order[a.row.status] - order[b.row.status] || compareISO(a.row.dueDate, b.row.dueDate)).slice(0, limit); }

export function scheduleTrackedCount(plan: PlanHolding, asOf: ISODate): number { return installmentsTracked(plan, asOf); }
