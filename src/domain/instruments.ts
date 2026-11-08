import { NotFoundError } from './actions';
import { EfBalanceError, efEndOfDayBalances } from './efActions';
import { findLinkedTransaction, investCategoryFor, LinkedTransactionError } from './links';
import { holdingValue } from './portfolio';
import type { AppData, Holding, HoldingType, InvestmentEntry, Transaction } from './types';

export type Instrument = { id: 'ef' | string; kind: 'ef' | 'holding'; name: string; type: HoldingType | 'Emergency fund'; valueNow: number; canWithdraw: boolean };
export type InstrumentTransactionInput = { kind: 'deposit' | 'withdrawal'; instrumentId: string; amount: number; date: string; note: string };

function holding(data: AppData, id: string): Holding {
  const result = data.holdings.find((item) => item.id === id);
  if (!result) throw new NotFoundError('Holding', id);
  return result;
}
function entries(item: Holding): InvestmentEntry[] { return item.logs ?? []; }
function efGoal(data: AppData) { const goal = data.goals.find((item) => item.auto === 'ef'); if (!goal) throw new NotFoundError('Emergency fund Goal', 'auto:ef'); return goal; }
function assertEf(data: AppData, next: AppData['efEntries']): void { const negative = efEndOfDayBalances(next).find((item) => item.balance < 0); if (negative) throw new EfBalanceError(negative.date); }
function instrumentValue(data: AppData, id: string, asOf: string): number { return id === 'ef' ? data.efEntries.reduce((sum, entry) => sum + entry.amount, 0) : holdingValue(holding(data, id), asOf); }
function entryFor(input: InstrumentTransactionInput, id: string): InvestmentEntry { return { id, date: input.date, amount: input.amount, note: input.note, kind: input.kind === 'deposit' ? 'Deposit' : 'Withdrawal' }; }
function makeTransaction(item: { id: string; name: string; type: HoldingType | 'Emergency fund' }, entry: InvestmentEntry, source: Transaction['source'], id: string): Transaction { const withdrawal = entry.kind === 'Withdrawal'; return { id, type: withdrawal ? 'income' : 'invest', amount: entry.amount, date: entry.date, category: withdrawal ? 'Withdrawal' : item.type === 'Emergency fund' ? 'Emergency fund' : investCategoryFor(item.type as HoldingType), note: `${item.name} ${withdrawal ? 'withdrawal' : item.type === 'Emergency fund' ? 'Deposit' : 'deposit'}`, source }; }

export function listInstruments(data: AppData, asOf: string): Instrument[] {
  return [{ id: 'ef', kind: 'ef', name: 'Emergency fund', type: 'Emergency fund', valueNow: instrumentValue(data, 'ef', asOf), canWithdraw: true }, ...data.holdings.map((item) => ({ id: item.id, kind: 'holding' as const, name: item.name, type: item.type, valueNow: holdingValue(item, asOf), canWithdraw: true }))];
}

export function addInstrumentTransaction(data: AppData, input: InstrumentTransactionInput, newId: () => string): AppData {
  if (input.amount <= 0) throw new Error('Amount must be greater than zero');
  const entry = entryFor(input, newId());
  if (input.instrumentId === 'ef') {
    const goal = efGoal(data); const amount = entry.kind === 'Withdrawal' ? -entry.amount : entry.amount; const nextEntries = [...data.efEntries, { id: entry.id, date: entry.date, amount, note: entry.note }]; assertEf(data, nextEntries);
    const tx = makeTransaction({ id: goal.id, name: goal.name, type: 'Emergency fund' }, entry, { kind: 'ef-entry', parentId: goal.id, entryId: entry.id }, newId());
    return { ...data, efEntries: nextEntries, transactions: [...data.transactions, tx] };
  }
  const item = holding(data, input.instrumentId); if (entry.kind === 'Withdrawal' && entry.amount > instrumentValue(data, item.id, input.date)) throw new Error(`Exceeds the current value of ₹${instrumentValue(data, item.id, input.date)}`);
  const next = { ...item, logs: [...entries(item), entry] } as Holding; const tx = makeTransaction(item, entry, { kind: 'holding-entry', parentId: item.id, entryId: entry.id }, newId());
  return { ...data, holdings: data.holdings.map((value) => value.id === item.id ? next : value), transactions: [...data.transactions, tx] };
}

export function updateLinkedTransaction(data: AppData, id: string, patch: { amount?: number; date?: string; note?: string; instrumentId?: string }): AppData {
  const tx = data.transactions.find((item) => item.id === id); if (!tx) throw new NotFoundError('Transaction', id); const source = tx.source;
  if (!source || (source.kind !== 'holding-entry' && source.kind !== 'ef-entry')) throw new LinkedTransactionError();
  if (patch.instrumentId && patch.instrumentId !== source.parentId && !(source.kind === 'ef-entry' && patch.instrumentId === 'ef') ) {
    const input: InstrumentTransactionInput = { kind: tx.type === 'income' ? 'withdrawal' : 'deposit', instrumentId: patch.instrumentId, amount: patch.amount ?? tx.amount, date: patch.date ?? tx.date, note: patch.note ?? tx.note };
    const removed = deleteLinkedTransaction(data, id); return addInstrumentTransaction(removed, input, (() => { let used = false; return () => { if (!used) { used = true; return source.entryId; } return id; }; })());
  }
  if (patch.instrumentId && patch.instrumentId !== source.parentId) throw new LinkedTransactionError();
  const amount = patch.amount ?? tx.amount; const date = patch.date ?? tx.date;
  if (source.kind === 'ef-entry') { const entry = data.efEntries.find((item) => item.id === source.entryId); if (!entry) throw new NotFoundError('Emergency fund entry', source.entryId); const nextEntries = data.efEntries.map((item) => item.id === entry.id ? { ...item, amount: entry.amount < 0 ? -amount : amount, date } : item); assertEf(data, nextEntries); return { ...data, efEntries: nextEntries, transactions: data.transactions.map((item) => item.id === id ? { ...item, amount, date, ...(patch.note === undefined ? {} : { note: patch.note }) } : item) }; }
  const item = holding(data, source.parentId); const entry = entries(item).find((value) => value.id === source.entryId); if (!entry) throw new NotFoundError('Investment entry', source.entryId); if (entry.kind === 'Withdrawal' && amount > instrumentValue(data, item.id, date)) throw new Error(`Exceeds the current value of ₹${instrumentValue(data, item.id, date)}`); const next = { ...item, logs: entries(item).map((value) => value.id === entry.id ? { ...value, amount, date } : value) } as Holding; return { ...data, holdings: data.holdings.map((value) => value.id === item.id ? next : value), transactions: data.transactions.map((value) => value.id === id ? { ...value, amount, date, ...(patch.note === undefined ? {} : { note: patch.note }) } : value) };
}

export function deleteLinkedTransaction(data: AppData, id: string): AppData { const tx = data.transactions.find((item) => item.id === id); if (!tx?.source || (tx.source.kind !== 'holding-entry' && tx.source.kind !== 'ef-entry')) throw new LinkedTransactionError(); const source = tx.source; if (source.kind === 'ef-entry') { const next = data.efEntries.filter((entry) => entry.id !== source.entryId); assertEf(data, next); return { ...data, efEntries: next, transactions: data.transactions.filter((item) => item.id !== id) }; } const item = holding(data, source.parentId); return { ...data, holdings: data.holdings.map((value) => value.id === item.id ? { ...item, logs: entries(item).filter((entry) => entry.id !== source.entryId) } : value), transactions: data.transactions.filter((item) => item.id !== id) }; }

export function linkExistingTransaction(data: AppData, txId: string, instrumentId: string): AppData { const tx = data.transactions.find((item) => item.id === txId); if (!tx) throw new NotFoundError('Transaction', txId); if (tx.source || tx.type !== 'invest') throw new LinkedTransactionError('Only unlinked investment transactions can be linked.'); return addInstrumentTransaction(data, { kind: 'deposit', instrumentId, amount: tx.amount, date: tx.date, note: tx.note }, (() => { let count = 0; return () => `linked-${txId}-${count++}`; })()); }

export function findUnlinkedEntries(data: AppData): { kind: 'ef' | 'holding' | 'liability'; parentId: string; entryId: string; amount: number; date: string; note: string }[] { const linked = new Set(data.transactions.map((tx) => tx.source?.entryId).filter(Boolean)); return [...data.efEntries.map((entry) => ({ kind: 'ef' as const, parentId: 'ef', entryId: entry.id, amount: entry.amount, date: entry.date, note: entry.note })), ...data.holdings.flatMap((item) => entries(item).map((entry) => ({ kind: 'holding' as const, parentId: item.id, entryId: entry.id, amount: entry.kind === 'Withdrawal' ? -entry.amount : entry.amount, date: entry.date, note: entry.note }))), ...data.liabilities.flatMap((item) => item.payments.map((entry) => ({ kind: 'liability' as const, parentId: item.id, entryId: entry.id, amount: -entry.amount, date: entry.date, note: entry.note })))].filter((entry) => !linked.has(entry.entryId)); }

export function createMissingTransactions(data: AppData, newId: () => string): AppData { let next = data; for (const entry of findUnlinkedEntries(data)) { if (entry.kind === 'holding') next = addInstrumentTransaction(next, { kind: entry.amount < 0 ? 'withdrawal' : 'deposit', instrumentId: entry.parentId, amount: Math.abs(entry.amount), date: entry.date, note: entry.note }, newId); else if (entry.kind === 'ef') next = addInstrumentTransaction(next, { kind: entry.amount < 0 ? 'withdrawal' : 'deposit', instrumentId: 'ef', amount: Math.abs(entry.amount), date: entry.date, note: entry.note }, newId); } return next; }
