import type { ISODate, Transaction } from './types';
import { NON_EARNED_INCOME_CATEGORIES } from './schemas';

export type TransactionMonthSummary = {
  income: number;
  withdrawals: number;
  nonEarnedIncome: number;
  earnedIncome: number;
  expense: number;
  invest: number;
  net: number;
  rates: { savedPct: number; investedPct: number } | null;
  overspend: number;
};

export function monthSummary(txs: Transaction[], month: string): TransactionMonthSummary {
  const rows = txs.filter((transaction) => transaction.date.startsWith(month));
  const total = (kind: Transaction['type']) => rows
    .filter((transaction) => transaction.type === kind)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const income = total('income');
  const withdrawals = rows
    .filter((transaction) => transaction.type === 'income' && transaction.category === 'Withdrawal')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const nonEarnedIncome = rows
    .filter((transaction) => transaction.type === 'income' && (NON_EARNED_INCOME_CATEGORIES as readonly string[]).includes(transaction.category))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const earnedIncome = income - nonEarnedIncome;
  const expense = total('expense');
  const invest = total('invest');
  return {
    income,
    withdrawals,
    nonEarnedIncome: income - earnedIncome,
    earnedIncome,
    expense,
    invest,
    net: income - expense - invest,
    rates: earnedIncome <= 0
      ? null
      : {
        savedPct: (earnedIncome - expense) / earnedIncome * 100,
        investedPct: invest / earnedIncome * 100,
      },
    overspend: income > 0 ? Math.max(0, expense + invest - income) : 0,
  };
}

export function filterTransactions(
  txs: Transaction[],
  options: { month: string; type: 'all' | Transaction['type']; query: string; category?: string },
): Transaction[] {
  const query = options.query.trim().toLowerCase();
  return txs
    .filter((transaction) => transaction.date.startsWith(options.month))
    .filter((transaction) => options.type === 'all' || transaction.type === options.type)
    .filter((transaction) => !options.category || transaction.category === options.category
      || (options.category === 'Other investments' && transaction.type === 'invest' && transaction.category === 'Other'))
    .filter((transaction) => !query || `${transaction.note} ${transaction.category}`.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export type DateGroup = { date: ISODate; items: Transaction[] };

export function groupByDate(rows: Transaction[]): DateGroup[] {
  const groups = new Map<ISODate, Transaction[]>();
  for (const row of rows) {
    const items = groups.get(row.date);
    if (items) items.push(row);
    else groups.set(row.date, [row]);
  }
  return [...groups].map(([date, items]) => ({ date, items }));
}

export function monthsWithData(txs: Transaction[]): string[] {
  return [...new Set(txs.map((transaction) => transaction.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
}
