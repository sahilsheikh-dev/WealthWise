import { addMonths, compareISO, daysBetween } from './dates';
import type { ISODate, LiabilityPayment, RecurringLiability, OneTimeLiability } from './types';

export function emiAuto(principal: number, ratePct: number, tenureMonths: number): number {
  const monthlyRate = ratePct / 1200;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const factor = (1 + monthlyRate) ** tenureMonths;
  return Math.round(principal * monthlyRate * factor / (factor - 1));
}

export type LoanSolverWarning = {
  kind: 'emi-mismatch';
  calculatedEmi: number;
};

export type LoanSolverResult = {
  ratePct: number | null;
  tenureMonths: number | null;
  emi: number | null;
  solved: 'emi' | 'rate' | 'tenure' | 'none';
  totalInterest: number | null;
  lastPayment: number | null;
  warnings: LoanSolverWarning[];
};

export function solveLoan(input: {
  principal: number;
  ratePct?: number;
  tenureMonths?: number;
  emi?: number;
}): LoanSolverResult {
  const { principal } = input;
  const ratePct = input.ratePct;
  const tenureMonths = input.tenureMonths;
  const emi = input.emi;
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error('Principal must be greater than zero');
  }
  if (ratePct !== undefined && (!Number.isFinite(ratePct) || ratePct < 0 || ratePct > 100)) {
    throw new Error('Interest rate must be between 0 and 100%');
  }
  if (tenureMonths !== undefined &&
    (!Number.isInteger(tenureMonths) || tenureMonths < 1 || tenureMonths > 600)) {
    throw new Error('Tenure must be between 1 and 600 whole months');
  }
  if (emi !== undefined && (!Number.isFinite(emi) || emi <= 0)) {
    throw new Error('EMI must be greater than zero');
  }

  const knownCount = [ratePct, tenureMonths, emi].filter((value) => value !== undefined).length;
  if (knownCount < 2) {
    return {
      ratePct: ratePct ?? null,
      tenureMonths: tenureMonths ?? null,
      emi: emi ?? null,
      solved: 'none',
      totalInterest: null,
      lastPayment: null,
      warnings: [],
    };
  }

  const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
  const paymentAtRate = (annualRatePct: number, months: number) => {
    const monthlyRate = annualRatePct / 1200;
    if (monthlyRate === 0) return principal / months;
    const factor = (1 + monthlyRate) ** months;
    return principal * monthlyRate * factor / (factor - 1);
  };

  if (ratePct !== undefined && tenureMonths !== undefined) {
    const calculatedEmi = roundMoney(paymentAtRate(ratePct, tenureMonths));
    const warnings = emi !== undefined
      && Math.abs(emi - calculatedEmi) > Math.max(1, calculatedEmi * 0.01)
      ? [{ kind: 'emi-mismatch' as const, calculatedEmi }]
      : [];
    const amountPaid = (emi ?? calculatedEmi) * tenureMonths;
    return {
      ratePct,
      tenureMonths,
      emi: emi ?? calculatedEmi,
      solved: emi === undefined ? 'emi' : 'none',
      totalInterest: roundMoney(amountPaid - principal),
      lastPayment: null,
      warnings,
    };
  }

  if (tenureMonths !== undefined && emi !== undefined) {
    if (emi * tenureMonths < principal - 0.01) {
      throw new Error('EMI is too low to repay this loan in that time');
    }
    let solvedRate = 0;
    if (Math.abs(emi * tenureMonths - principal) > 0.01) {
      const maximumRatePayment = paymentAtRate(100, tenureMonths);
      if (emi > maximumRatePayment) {
        throw new Error('Interest rate must be between 0 and 100% to match this EMI');
      }
      let low = 0;
      let high = 100;
      for (let iteration = 0; iteration < 80; iteration += 1) {
        const middle = (low + high) / 2;
        if (paymentAtRate(middle, tenureMonths) < emi) low = middle;
        else high = middle;
      }
      solvedRate = roundMoney((low + high) / 2);
    }
    return {
      ratePct: solvedRate,
      tenureMonths,
      emi,
      solved: 'rate',
      totalInterest: roundMoney(emi * tenureMonths - principal),
      lastPayment: null,
      warnings: [],
    };
  }

  if (ratePct !== undefined && emi !== undefined) {
    const monthlyRate = ratePct / 1200;
    if (emi <= principal * monthlyRate) {
      throw new Error('EMI does not even cover the monthly interest');
    }
    const exactMonths = monthlyRate === 0
      ? principal / emi
      : -Math.log(1 - principal * monthlyRate / emi) / Math.log(1 + monthlyRate);
    const solvedTenure = Math.ceil(exactMonths);
    if (solvedTenure > 600) throw new Error('Calculated tenure exceeds 600 months');
    const balanceBeforeFinalPayment = monthlyRate === 0
      ? Math.max(0, principal - emi * (solvedTenure - 1))
      : Math.max(
        0,
        principal * (1 + monthlyRate) ** (solvedTenure - 1)
          - emi * (((1 + monthlyRate) ** (solvedTenure - 1) - 1) / monthlyRate),
      );
    const lastPayment = roundMoney(balanceBeforeFinalPayment * (1 + monthlyRate));
    return {
      ratePct,
      tenureMonths: solvedTenure,
      emi,
      solved: 'tenure',
      totalInterest: roundMoney(emi * (solvedTenure - 1) + lastPayment - principal),
      lastPayment,
      warnings: [],
    };
  }

  return {
    ratePct: ratePct ?? null,
    tenureMonths: tenureMonths ?? null,
    emi: emi ?? null,
    solved: 'none',
    totalInterest: null,
    lastPayment: null,
    warnings: [],
  };
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
  settlement?: { asOf: ISODate; balance: number } | null;
};

export function loanState(liability: LiabilityAccountingInput, asOf: ISODate): LiabilityState {
  if (!liability.settlement && asOf < liability.startDate) {
    return { balance: liability.principal, paidTotal: 0, interestAccrued: 0 };
  }
  const paidTotal = liability.payments
    .filter((payment) => payment.date <= asOf)
    .reduce((total, payment) => total + payment.amount, 0);
  if (liability.settlement && asOf < liability.settlement.asOf) {
    return { balance: liability.settlement.balance, paidTotal, interestAccrued: 0 };
  }
  const settled = liability.settlement ?? null;
  let balance = settled?.balance ?? liability.principal;
  let cursor = settled?.asOf ?? liability.startDate;
  let interestAccrued = 0;
  if (asOf < cursor) return { balance, paidTotal, interestAccrued };
  const payments: { payment: LiabilityAccountingInput['payments'][number]; date: ISODate }[] = liability.payments
    .filter((payment) => payment.date <= asOf && (!settled || payment.date > settled.asOf))
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
  }

  if (asOf > cursor) {
    const interest = balance * liability.ratePct / 100 * daysBetween(cursor, asOf) / 365;
    balance += interest;
    interestAccrued += interest;
  }

  return { balance, paidTotal, interestAccrued };
}

export function amortizedBalanceAfter(
  liability: Pick<RecurringLiability, 'principal' | 'ratePct' | 'startDate' | 'tenureMonths' | 'emi'>,
  throughDate: ISODate,
): number {
  const payments: Pick<LiabilityPayment, 'id' | 'date' | 'amount'>[] = [];
  for (let index = 1; index <= liability.tenureMonths; index += 1) {
    const date = addMonths(liability.startDate, index);
    if (date > throughDate) break;
    payments.push({ id: `amortized:${index}`, date, amount: liability.emi });
  }
  return loanState({ ...liability, payments, settlement: null }, throughDate).balance;
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
