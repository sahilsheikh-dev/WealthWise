import { addDays, monthKey, shiftMonth } from './dates';
import { effectiveMonthBudget, plannedIncomeOf } from './budget';
import { normalizeMoney } from './cashFlow';
import { policySchedule } from './policySchedule';
import { EARNED_INCOME_CATEGORIES, type AppData, type ISODate, type Policy } from './types';

const PAYMENTS_PER_YEAR: Record<Exclude<Policy['frequency'], 'custom' | 'once'>, number> = {
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  yearly: 1,
};
const EARNED_INCOME_SET = new Set<string>(EARNED_INCOME_CATEGORIES);

export type PolicyDueSummary = {
  policyId: string;
  name: string;
  date: ISODate;
  amount: number;
};

export type PolicySummary = {
  activeCount: number;
  totalCover: number;
  yearlyPremium: number;
  nextRenewal: PolicyDueSummary | null;
  upcoming: PolicyDueSummary[];
  termLifeCover: number;
  yearlyIncomeEstimate: number | null;
  coverMultiple: number | null;
};

export function policySummary(data: AppData, today: ISODate): PolicySummary {
  const activePolicies = data.policies.filter((policy) => policy.status === 'active');
  const dueRows = activePolicies.flatMap((policy) => {
    const schedule = policySchedule(policy, today);
    return schedule.rows
      .filter((row) => row.status !== 'paid')
      .map((row) => ({
        policyId: policy.id,
        name: policy.name,
        date: row.dueDate,
        amount: normalizeMoney(row.amount),
      }));
  }).sort((left, right) => left.date.localeCompare(right.date)
    || left.name.localeCompare(right.name)
    || left.policyId.localeCompare(right.policyId));
  const currentBudget = effectiveMonthBudget(data, monthKey(today), today).budget;
  const yearlyIncomeEstimate = currentBudget !== null
    ? normalizeMoney(Array.from({ length: 12 }, (_, index) => {
      const month = shiftMonth(monthKey(today), index);
      const budget = effectiveMonthBudget(data, month, today).budget ?? currentBudget;
      return budget && budget.incomes.length > 0 ? plannedIncomeOf(budget, month) : 0;
    }).reduce((sum, amount) => sum + amount, 0))
    : (() => {
      const earliestMonth = shiftMonth(monthKey(today), -2);
      const earned = data.transactions.reduce((total, transaction) => {
        if (transaction.type !== 'income'
          || !EARNED_INCOME_SET.has(transaction.category)
          || transaction.date < `${earliestMonth}-01`
          || transaction.date > today) return total;
        return total + transaction.amount;
      }, 0);
      return earned > 0 ? normalizeMoney(earned * 4) : null;
    })();
  const termLifeCover = normalizeMoney(activePolicies
    .filter((policy) => policy.kind === 'term-life')
    .reduce((total, policy) => total + (policy.sumAssured ?? 0), 0));
  const firstDue = dueRows.find((row) => row.date >= today) ?? null;
  const lastUpcomingDate = addDays(today, 60);
  const upcoming = dueRows.filter((row) => row.date >= today && row.date <= lastUpcomingDate);
  const totalCover = normalizeMoney(activePolicies.reduce(
    (total, policy) => total + (policy.sumAssured ?? 0), 0,
  ));
  const yearlyPremium = normalizeMoney(activePolicies.reduce((total, policy) => {
    if (policy.frequency === 'once') return total;
    return total + policy.premium * (policy.frequency === 'custom'
      ? 12 / (policy.customIntervalMonths ?? 1)
      : PAYMENTS_PER_YEAR[policy.frequency]);
  }, 0));
  return {
    activeCount: activePolicies.length,
    totalCover,
    yearlyPremium,
    nextRenewal: firstDue,
    upcoming,
    termLifeCover,
    yearlyIncomeEstimate,
    coverMultiple: yearlyIncomeEstimate === null || yearlyIncomeEstimate === 0
      ? null
      : termLifeCover / yearlyIncomeEstimate,
  };
}
