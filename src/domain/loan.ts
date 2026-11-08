import { addMonths, compareISO, daysBetween } from './dates';
import type { ISODate, Loan, LogEntry } from './types';

export function emiAuto(principal: number, ratePct: number, tenureMonths: number): number {
  const monthlyRate = ratePct / 1200;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = (1 + monthlyRate) ** tenureMonths;
  return Math.round(principal * monthlyRate * factor / (factor - 1));
}

export type LoanState = {
  balance: number;
  paidTotal: number;
  interestAccrued: number;
};

export function loanState(loan: Loan, asOf: ISODate): LoanState {
  if (asOf < loan.startDate) return { balance: loan.principal, paidTotal: 0, interestAccrued: 0 };
  let balance = loan.principal;
  let cursor = loan.startDate;
  let paidTotal = 0;
  let interestAccrued = 0;
  const payments: { payment: LogEntry; date: ISODate }[] = loan.payments
    .filter((payment) => payment.date <= asOf)
    .map((payment) => ({
      payment,
      date: compareISO(payment.date, loan.startDate) < 0 ? loan.startDate : payment.date,
    }))
    .sort((a, b) => compareISO(a.date, b.date) || a.payment.id.localeCompare(b.payment.id));

  // This is a daily-accrual ESTIMATE; banks using monthly reducing-balance schedules will differ slightly.
  for (const { payment, date } of payments) {
    const elapsedDays = Math.max(0, daysBetween(cursor, date));
    const interest = balance * loan.ratePct / 100 * elapsedDays / 365;
    balance += interest;
    interestAccrued += interest;
    if (date > cursor) cursor = date;
    balance = Math.max(0, balance - payment.amount);
    paidTotal += payment.amount;
  }

  if (asOf > cursor) {
    const interest = balance * loan.ratePct / 100 * daysBetween(cursor, asOf) / 365;
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

export type LoanSummary = {
  balance: number;
  paidTotal: number;
  interestAccrued: number;
  principalPaidPct: number;
  cleared: boolean;
  monthsLeft: number | null;
  monthsLeftWithExtra: number | null;
  monthsSaved: number | null;
  payoffDate: ISODate | null;
};

export function loanSummary(loan: Loan, asOf: ISODate, extraPerMonth: number): LoanSummary {
  const state = loanState(loan, asOf);
  const cleared = isCleared(state.balance);
  const months = monthsLeft(state.balance, loan.emi, loan.ratePct);
  const monthsWithExtra = monthsLeft(state.balance, loan.emi, loan.ratePct, extraPerMonth);
  return {
    ...state,
    principalPaidPct: loan.principal <= 0
      ? 0
      : Math.min(100, Math.max(0, (loan.principal - state.balance) / loan.principal * 100)),
    cleared,
    monthsLeft: months,
    monthsLeftWithExtra: monthsWithExtra,
    monthsSaved: months === null || monthsWithExtra === null ? null : Math.max(0, months - monthsWithExtra),
    payoffDate: cleared || months === null ? null : payoffDate(months, asOf),
  };
}
