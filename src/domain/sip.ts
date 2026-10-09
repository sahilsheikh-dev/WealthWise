import { addDays, addMonths, addYears, daysBetween, parseISO } from './dates';
import type { Frequency, ISODate, PlanHolding } from './types';

export const PERIODS_PER_YEAR: Record<Frequency, number> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

export function totalPeriods(plan: PlanHolding): number {
  return Math.round(plan.tenureYears * PERIODS_PER_YEAR[plan.frequency]);
}

export function scheduledDate(plan: PlanHolding, k: number): ISODate {
  switch (plan.frequency) {
    case 'daily':
      return addDays(plan.startDate, k);
    case 'weekly':
      return addDays(plan.startDate, 7 * k);
    case 'monthly':
      return addMonths(plan.startDate, k);
    case 'yearly':
      return addYears(plan.startDate, k);
  }
}

export function installmentsDue(plan: PlanHolding, asOf: ISODate): number {
  if (asOf < plan.startDate) return 0;
  // Calendar scheduling replaces the prototype's approximate days * frequency / 365 count.
  const total = totalPeriods(plan);
  let low = 0;
  let high = total;
  // Binary search avoids walking long daily/weekly plans one scheduled installment at a time.
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (scheduledDate(plan, middle) <= asOf) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function currentInstallmentAmount(plan: PlanHolding, asOf: ISODate): number {
  if (asOf < plan.startDate) return plan.amount;
  const start = parseISO(plan.startDate);
  const today = parseISO(asOf);
  let yearsElapsed = today.y - start.y;
  const anniversary = addYears(plan.startDate, yearsElapsed);
  if (asOf < anniversary) yearsElapsed -= 1;
  const stepYear = Math.max(0, Math.min(plan.tenureYears - 1, yearsElapsed));
  return plan.amount * (1 + plan.stepUpPct / 100) ** stepYear;
}

export function projection(plan: PlanHolding): {
  totalContributions: number;
  futureValue: number;
  periods: number;
} {
  const periodsPerYear = PERIODS_PER_YEAR[plan.frequency];
  const periods = totalPeriods(plan);
  const ratePerPeriod = (1 + plan.ratePct / 100) ** (1 / periodsPerYear) - 1;
  let totalContributions = 0;
  let futureValue = 0;
  for (let i = 0; i < periods; i += 1) {
    const installment = plan.amount * (1 + plan.stepUpPct / 100) ** Math.floor(i / periodsPerYear);
    futureValue = futureValue * (1 + ratePerPeriod) + installment;
    totalContributions += installment;
  }
  return { totalContributions, futureValue, periods };
}

export function loggedTotal(plan: PlanHolding): number {
  return plan.logs.reduce((total, entry) => total + entry.amount, 0);
}

export function loggedCount(plan: PlanHolding): number {
  return plan.logs.length;
}

export function behindBy(plan: PlanHolding, asOf: ISODate): number {
  return Math.max(0, installmentsDue(plan, asOf) - loggedCount(plan));
}

export function estimatedValue(plan: PlanHolding, asOf: ISODate): number {
  const factor = 1 + plan.ratePct / 100;
  return plan.opening + plan.logs.reduce((total, entry) => {
    const elapsedDays = Math.max(0, daysBetween(entry.date, asOf));
    return total + entry.amount * factor ** (elapsedDays / 365);
  }, 0);
}

export function planInvested(plan: PlanHolding): number {
  return plan.opening + loggedTotal(plan);
}

export function planValue(plan: PlanHolding, asOf: ISODate): number {
  return plan.actualValue ?? estimatedValue(plan, asOf);
}

export function planProgressPct(plan: PlanHolding): number {
  const total = projection(plan).totalContributions;
  return total === 0 ? 0 : Math.min(100, Math.max(0, loggedTotal(plan) / total * 100));
}
