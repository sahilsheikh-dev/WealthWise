import { NotFoundError } from './actions';
import type { AppData, EfEntry, ISODate, Transaction } from './types';

export class EfLinkError extends Error {
  constructor(message = 'A linked entry cannot change direction.') {
    super(message);
    this.name = 'EfLinkError';
  }
}

export class EfBalanceError extends Error {
  constructor(date: ISODate) {
    super(`This would make the balance negative on ${date}`);
    this.name = 'EfBalanceError';
  }
}

export type EfEntryPatch = Partial<Pick<EfEntry, 'date' | 'amount' | 'note'>>;

export function efEndOfDayBalances(entries: EfEntry[]): { date: ISODate; balance: number }[] {
  const perDate = new Map<ISODate, number>();
  entries.forEach((entry) => perDate.set(entry.date, (perDate.get(entry.date) ?? 0) + entry.amount));
  let balance = 0;
  return [...perDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => {
    balance += amount;
    return { date, balance };
  });
}

function assertNonNegative(entries: EfEntry[]): void {
  const negative = efEndOfDayBalances(entries).find(({ balance }) => balance < 0);
  if (negative) throw new EfBalanceError(negative.date);
}

export function addEfEntry(
  data: AppData,
  input: Omit<EfEntry, 'id'>,
  options: { newId: () => string } | { newId?: () => string; recordTransaction?: boolean },
): AppData {
  const goal = data.goals.find((item) => item.auto === 'ef');
  if (!goal) throw new NotFoundError('Emergency fund Goal', 'auto:ef');
  const newId = options.newId ?? (() => { throw new Error('An id generator is required'); });
  const entry: EfEntry = { ...input, id: newId() };
  const efEntries = [...data.efEntries, entry];
  assertNonNegative(efEntries);
  const transaction: Transaction = {
    id: newId(),
    type: entry.amount > 0 ? 'invest' : 'income',
    amount: Math.abs(entry.amount),
    date: entry.date,
    category: entry.amount > 0 ? 'Emergency fund' : 'Withdrawal',
    note: entry.amount > 0 ? 'Emergency fund Deposit' : 'Emergency fund withdrawal',
    source: { kind: 'ef-entry', parentId: goal.id, entryId: entry.id },
  };
  return {
    ...data,
    efEntries,
    transactions: [...data.transactions, transaction],
  };
}

export function updateEfEntry(data: AppData, id: string, patch: EfEntryPatch): AppData {
  const current = data.efEntries.find((entry) => entry.id === id);
  if (!current) throw new NotFoundError('Emergency fund Entry', id);
  const updated = { ...current, ...patch };
  const linked = data.transactions.find((transaction) =>
    transaction.source?.kind === 'ef-entry' && transaction.source.entryId === id,
  );
  if (linked && Math.sign(updated.amount) !== Math.sign(current.amount)) throw new EfLinkError();
  const efEntries = data.efEntries.map((entry) => entry.id === id ? updated : entry);
  assertNonNegative(efEntries);
  return {
    ...data,
    efEntries,
    transactions: linked
      ? data.transactions.map((transaction) => transaction.id === linked.id
        ? { ...transaction, amount: Math.abs(updated.amount), date: updated.date, type: updated.amount > 0 ? 'invest' : 'income', category: updated.amount > 0 ? 'Emergency fund' : 'Withdrawal', note: updated.amount > 0 ? 'Emergency fund Deposit' : 'Emergency fund withdrawal' }
        : transaction)
      : data.transactions,
  };
}

export function deleteEfEntry(data: AppData, id: string): AppData {
  if (!data.efEntries.some((entry) => entry.id === id)) throw new NotFoundError('Emergency fund Entry', id);
  const efEntries = data.efEntries.filter((entry) => entry.id !== id);
  assertNonNegative(efEntries);
  return {
    ...data,
    efEntries,
    transactions: data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'ef-entry' && transaction.source.entryId === id),
    ),
  };
}

export function efBalanceOn(entries: EfEntry[], date: ISODate): number {
  return entries.reduce((balance, entry) => balance + (entry.date <= date ? entry.amount : 0), 0);
}
