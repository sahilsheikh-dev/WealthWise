import { addMonths, compareISO, daysBetween } from './dates';
import type { ISODate, LiabilityPayment, RecurringLiability, OneTimeLiability } from './types';

export function emiAuto(principal: number, ratePct: number, tenureMonths: number): number {
  const monthlyRate = ratePct / 1200;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = (1 + monthlyRate) ** tenureMonths;
  return Math.round(principal * monthlyRate * factor / (factor - 1));
}

export type LiabilityState = {
  balance: number;
  paidTotal: number;
  interestAccrued: number;
};

type LiabilityAccountingInput = {
  principal: number;
  ratePct: number;
  startDate: ISODate;
  payments: Pick<LiabilityPayment, 'id' | 'date' | 'amount'>[];
};

export function loanState(liability: LiabilityAccountingInput, asOf: ISODate): LiabilityState {
  if (asOf < liability.startDate) return { balance: liability.principal, paidTotal: 0, interestAccrued: 0 };
  let balance = liability.principal;
  let cursor = liability.startDate;
  let paidTotal = 0;
  let interestAccrued = 0;
  const payments: { payment: LiabilityAccountingInput['payments'][number]; date: ISODate }[] = liability.payments
    .filter((payment) => payment.date <= asOf)
    .map((payment) => ({
      payment,
      date: compareISO(payment.date, liability.startDate) < 0 ? liability.startDate : payment.date,
    }))
    .sort((a, b) => compareISO(a.date, b.date) || a.payment.id.localeCompare(b.payment.id));

  for (const { payment, date } of payments) {
    const elapsedDays = Math.max(0, daysBetween(cursor, date));
    const interest = balance * liability.ratePct / 100 * elapsedDays / 365;
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

export function isCleared(balance: number): boolean {
  return balance < 1;
}

export function monthsLeft(balance: number, emi: number, ratePct: number, extra = 0): number | null {
  if (isCleared(balance)) return 0;
  const payment = emi + extra;
  if (ratePct === 0) return payment > 0 ? Math.ceil(balance / payment) : null;
  const monthlyRate = ratePct / 1200;
  if (payment <= balance * monthlyRate) return null;
  return Math.ceil(-Math.log(1 - balance * monthlyRate / payment) / Math.log(1 + monthlyRate));
}

export function emiCoversInterest(principal: number, ratePct: number, emi: number): boolean {
  return emi > principal * ratePct / 1200;
}

export function payoffDate(months: number, asOf: ISODate): ISODate {
  return addMonths(asOf, months);
}

export type RecurringLiabilitySummary = LiabilityState & {
  principalPaidPct: number;
  cleared: boolean;
  monthsLeft: number | null;
  monthsLeftWithExtra: number | null;
  monthsSaved: number | null;
  payoffDate: ISODate | null;
};

export type OneTimeLiabilitySummary = LiabilityState & {
  principalPaidPct: number;
  cleared: boolean;
  dueDate: ISODate | null;
  daysToDue?: number;
  overdueDays?: number;
};

export type LiabilitySummary = RecurringLiabilitySummary | OneTimeLiabilitySummary;

export function liabilitySummary(
  liability: RecurringLiability,
  asOf: ISODate,
  extraPerMonth?: number,
): RecurringLiabilitySummary;
export function liabilitySummary(
  liability: OneTimeLiability,
  asOf: ISODate,
  extraPerMonth?: number,
): OneTimeLiabilitySummary;
export function liabilitySummary(
  liability: RecurringLiability | OneTimeLiability,
  asOf: ISODate,
  extraPerMonth?: number,
): LiabilitySummary;
export function liabilitySummary(
  liability: RecurringLiability | OneTimeLiability,
  asOf: ISODate,
  extraPerMonth = 0,
): LiabilitySummary {
  const state = loanState(liability, asOf);
  const cleared = isCleared(state.balance);
  const principalPaidPct = liability.principal <= 0
    ? 0
    : Math.min(100, Math.max(0, (liability.principal - state.balance) / liability.principal * 100));
  if (liability.kind === 'one-time') {
    return {
      ...state,
      principalPaidPct,
      cleared,
      dueDate: liability.dueDate,
      ...(liability.dueDate && liability.dueDate >= asOf
        ? { daysToDue: daysBetween(asOf, liability.dueDate) }
        : liability.dueDate
          ? { overdueDays: daysBetween(liability.dueDate, asOf) }
          : {}),
    };
  }
  const months = monthsLeft(state.balance, liability.emi, liability.ratePct);
  const monthsWithExtra = monthsLeft(state.balance, liability.emi, liability.ratePct, extraPerMonth);
  return {
    ...state,
    principalPaidPct,
    cleared,
    monthsLeft: months,
    monthsLeftWithExtra: monthsWithExtra,
    monthsSaved: months === null || monthsWithExtra === null ? null : Math.max(0, months - monthsWithExtra),
    payoffDate: cleared || months === null ? null : payoffDate(months, asOf),
  };
}
