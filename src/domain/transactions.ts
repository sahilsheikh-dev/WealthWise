import type { ISODate, Transaction } from './types';

export type TransactionMonthSummary = {
  income: number;
  expense: number;
  invest: number;
  net: number;
  savedPct: number | null;
  investedPct: number | null;
  overspend: number;
};

export function monthSummary(txs: Transaction[], month: string): TransactionMonthSummary {
  const rows = txs.filter((transaction) => transaction.date.startsWith(month));
  const total = (kind: Transaction['type']) => rows
    .filter((transaction) => transaction.type === kind)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const income = total('income');
  const expense = total('expense');
  const invest = total('invest');
  return {
    income,
    expense,
    invest,
    net: income - expense - invest,
    savedPct: income === 0 ? null : (income - expense) / income * 100,
    investedPct: income === 0 ? null : invest / income * 100,
    overspend: income > 0 ? Math.max(0, expense + invest - income) : 0,
  };
}

export function filterTransactions(
  txs: Transaction[],
  options: { month: string; type: 'all' | Transaction['type']; query: string },
): Transaction[] {
  const query = options.query.trim().toLowerCase();
  return txs
    .filter((transaction) => transaction.date.startsWith(options.month))
    .filter((transaction) => options.type === 'all' || transaction.type === options.type)
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
