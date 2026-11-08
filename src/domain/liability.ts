import { addMonths, compareISO, daysBetween } from './dates';
import type { ISODate, Liability, RecurringLiability } from './types';

export function emiAuto(principal: number, ratePct: number, tenureMonths: number): number {
  const monthlyRate = ratePct / 1200;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = (1 + monthlyRate) ** tenureMonths;
  return Math.round(principal * monthlyRate * factor / (factor - 1));
}

export type LiabilityState = { balance: number; paidTotal: number; interestAccrued: number };

export function liabilityState(liability: Liability, asOf: ISODate): LiabilityState {
  if (asOf < liability.startDate) return { balance: liability.principal, paidTotal: 0, interestAccrued: 0 };
  let balance = liability.principal;
  let cursor = liability.startDate;
  let paidTotal = 0;
  let interestAccrued = 0;
  const payments = liability.payments.filter((payment) => payment.date <= asOf)
    .map((payment) => ({ payment, date: compareISO(payment.date, liability.startDate) < 0 ? liability.startDate : payment.date }))
    .sort((a, b) => compareISO(a.date, b.date) || a.payment.id.localeCompare(b.payment.id));
  for (const { payment, date } of payments) {
    const interest = balance * liability.ratePct / 100 * Math.max(0, daysBetween(cursor, date)) / 365;
    balance += interest;
    interestAccrued += interest;
    if (date > cursor) cursor = date;
    balance = Math.max(0, balance - payment.amount);
    paidTotal += payment.amount;
  }
  if (asOf > cursor) {
    const interest = balance * liability.ratePct / 100 * daysBetween(cursor, asOf) / 365;
    balance += interest;
    interestAccrued += interest;
  }
  return { balance, paidTotal, interestAccrued };
}

export function isCleared(balance: number): boolean { return balance < 1; }
export function monthsLeft(balance: number, emi: number, ratePct: number, extra = 0): number | null {
  if (isCleared(balance)) return 0;
  const payment = emi + extra;
  if (ratePct === 0) return payment > 0 ? Math.ceil(balance / payment) : null;
  const monthlyRate = ratePct / 1200;
  if (payment <= balance * monthlyRate) return null;
  return Math.ceil(-Math.log(1 - balance * monthlyRate / payment) / Math.log(1 + monthlyRate));
}
export function emiCoversInterest(principal: number, ratePct: number, emi: number): boolean { return emi > principal * ratePct / 1200; }
export function payoffDate(months: number, asOf: ISODate): ISODate { return addMonths(asOf, months); }

export type RecurringLiabilitySummary = LiabilityState & {
  principalPaidPct: number; cleared: boolean; monthsLeft: number | null; monthsLeftWithExtra: number | null;
  monthsSaved: number | null; payoffDate: ISODate | null;
};
export type OneTimeLiabilitySummary = LiabilityState & {
  principalPaidPct: number; cleared: boolean; dueDate: ISODate | null; daysToDue?: number; overdueDays?: number;
};
export type LiabilitySummary = RecurringLiabilitySummary | OneTimeLiabilitySummary;

export function liabilitySummary(liability: Liability, asOf: ISODate, extraPerMonth: number): LiabilitySummary {
  const state = liabilityState(liability, asOf);
  const principalPaidPct = liability.principal <= 0 ? 0 : Math.min(100, Math.max(0, (liability.principal - state.balance) / liability.principal * 100));
  const cleared = isCleared(state.balance);
  if (liability.kind === 'one-time') {
    const delta = liability.dueDate ? daysBetween(asOf, liability.dueDate) : 0;
    return { ...state, principalPaidPct, cleared, dueDate: liability.dueDate, ...(liability.dueDate && delta >= 0 ? { daysToDue: delta } : {}), ...(liability.dueDate && delta < 0 ? { overdueDays: -delta } : {}) };
  }
  const months = monthsLeft(state.balance, liability.emi, liability.ratePct);
  const monthsWithExtra = monthsLeft(state.balance, liability.emi, liability.ratePct, extraPerMonth);
  return { ...state, principalPaidPct, cleared, monthsLeft: months, monthsLeftWithExtra: monthsWithExtra, monthsSaved: months === null || monthsWithExtra === null ? null : Math.max(0, months - monthsWithExtra), payoffDate: cleared || months === null ? null : payoffDate(months, asOf) };
}

export type LiabilityStateForRecurring = ReturnType<typeof liabilityState>;
export type LoanState = LiabilityStateForRecurring;
export type LoanSummary = RecurringLiabilitySummary;
export function loanState(liability: Liability, asOf: ISODate) { return liabilityState(liability, asOf); }
export function loanSummary(liability: RecurringLiability, asOf: ISODate, extra: number) { return liabilitySummary(liability, asOf, extra) as RecurringLiabilitySummary; }
