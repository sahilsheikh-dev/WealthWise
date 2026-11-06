import { monthKey } from './dates';
import type { ISODate, Transaction } from './types';

export function monthlyBaseline(
  transactions: Transaction[],
  kind: 'expense' | 'income',
  asOf: ISODate,
  options: { excludeCategories?: readonly string[] } = {},
): number {
  const currentMonth = monthKey(asOf);
  const monthlyTotals = new Map<string, number>();
  const excluded = new Set(options.excludeCategories ?? []);
  for (const transaction of transactions) {
    if (transaction.type !== kind) continue;
    if (excluded.has(transaction.category)) continue;
    const key = monthKey(transaction.date);
    monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + transaction.amount);
  }
  const allMonths = [...monthlyTotals.keys()].sort((a, b) => b.localeCompare(a));
  const historicalMonths = allMonths.filter((key) => key < currentMonth);
  const includedMonths = historicalMonths.length > 0
    ? historicalMonths.slice(0, 3)
    : allMonths.filter((key) => key === currentMonth).slice(0, 1);
  if (includedMonths.length === 0) return 0;
  return includedMonths.reduce((sum, month) => sum + monthlyTotals.get(month)!, 0) / includedMonths.length;
}

export type EmergencyFundBaseline = { amount: number; source: 'expenses' | 'salary' | null };

export function emergencyFundBaseline(
  transactions: Transaction[],
  monthlySalary: number | null,
  asOf: ISODate,
): EmergencyFundBaseline {
  const expenses = monthlyBaseline(transactions, 'expense', asOf);
  if (expenses > 0) return { amount: expenses, source: 'expenses' };
  if (monthlySalary !== null && monthlySalary > 0) return { amount: monthlySalary, source: 'salary' };
  return { amount: 0, source: null };
}

export function monthsCovered(balance: number, baseline: number): number | null {
  return baseline <= 0 ? null : balance / baseline;
}

export type Milestone = { months: number; pct: number; done: boolean };

export function milestones(
  balance: number,
  baseline: number,
  months: number[] = [3, 6, 12],
): Milestone[] {
  return months.map((targetMonths) => {
    const pct = baseline <= 0
      ? 0
      : Math.min(100, Math.max(0, balance / (baseline * targetMonths) * 100));
    return { months: targetMonths, pct, done: baseline > 0 && pct >= 100 };
  });
}
