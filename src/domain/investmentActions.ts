import { NotFoundError } from './actions';
import { holdingCapabilities } from './holdingCapabilities';
import { findLinkedTransaction, investCategoryFor } from './links';
import { holdingValue } from './portfolio';
import { formatINR } from '../lib/format';
import type { AppData, Holding, InvestmentEntry, ISODate, Transaction } from './types';

export type InvestmentEntryInput = Pick<InvestmentEntry, 'date' | 'amount' | 'kind' | 'note'>;
export type InvestmentEntryPatch = Partial<Pick<InvestmentEntry, 'date' | 'amount' | 'note'>>;

export function snapshotAdjustmentForEntry(
  holding: Holding,
  entry: Pick<InvestmentEntry, 'date' | 'amount' | 'kind'>,
): number | undefined {
  if (holding.kind !== 'manual' || holding.valueAsOf !== entry.date) return undefined;
  return entry.kind === 'Deposit' ? entry.amount : -entry.amount;
}

function getHolding(data: AppData, id: string): Holding {
  const holding = data.holdings.find((item) => item.id === id);
  if (!holding) throw new NotFoundError('Holding', id);
  return holding;
}

function entryNote(holding: Holding, kind: InvestmentEntry['kind']): string {
  if (kind === 'Withdrawal') return `${holding.name} withdrawal`;
  return holding.kind === 'plan' ? `${holding.name} installment` : `${holding.name} deposit`;
}

function linkedTransaction(holding: Holding, entry: InvestmentEntry, id: string): Transaction {
  return {
    id,
    type: entry.kind === 'Deposit' ? 'invest' : 'income',
    amount: entry.amount,
    date: entry.date,
    category: entry.kind === 'Deposit' ? investCategoryFor(holding.type) : 'Withdrawal',
    note: entryNote(holding, entry.kind),
    source: { kind: 'holding-entry', parentId: holding.id, entryId: entry.id },
  };
}

export function addInvestmentEntry(
  data: AppData,
  holdingId: string,
  input: InvestmentEntryInput,
  newId: () => string,
  today: ISODate,
): AppData {
  const holding = getHolding(data, holdingId);
  if (input.kind === 'Deposit' && !holdingCapabilities(holding.type).entries) {
    throw new Error('Fixed deposit does not allow deposits or investment entries. Use a withdrawal for maturity payout.');
  }
  const adjustment = snapshotAdjustmentForEntry(holding, input);
  const entry: InvestmentEntry = {
    ...input,
    id: newId(),
    ...(adjustment === undefined ? {} : { snapshotAdjustment: adjustment }),
  };
  if (entry.kind === 'Withdrawal') {
    const currentValue = holdingValue(holding, today);
    if (entry.date > today) throw new Error('Date cannot be in the future');
    if (holding.kind === 'plan' && entry.date < holding.startDate) {
      throw new Error('Date is before the plan started');
    }
    if (entry.amount > currentValue) {
      throw new Error(`Exceeds the current value of ${formatINR(currentValue)}`);
    }
  }
  const transaction = linkedTransaction(holding, entry, newId());
  return {
    ...data,
    holdings: data.holdings.map((item) => item.id === holdingId
      ? {
        ...item,
        ...(item.kind === 'manual' && entry.snapshotAdjustment !== undefined
          ? { value: item.value + entry.snapshotAdjustment }
          : {}),
        logs: [...item.logs, entry],
      }
      : item),
    transactions: [...data.transactions, transaction],
  };
}

export function updateInvestmentEntry(
  data: AppData,
  holdingId: string,
  entryId: string,
  patch: InvestmentEntryPatch,
  today: ISODate,
): AppData {
  const holding = getHolding(data, holdingId);
  const entry = holding.logs.find((item) => item.id === entryId);
  if (!entry) throw new NotFoundError('Investment entry', entryId);
  const { snapshotAdjustment: _snapshotAdjustment, ...entryWithoutAdjustment } = entry;
  const updatedEntryBase = { ...entryWithoutAdjustment, ...patch };
  const adjustment = snapshotAdjustmentForEntry(holding, updatedEntryBase);
  const updatedEntry = {
    ...updatedEntryBase,
    ...(adjustment === undefined ? {} : { snapshotAdjustment: adjustment }),
  };
  if (updatedEntry.kind === 'Withdrawal') {
    const currentValue = holdingValue({
      ...holding,
      ...(holding.kind === 'manual' && entry.snapshotAdjustment !== undefined
        ? { value: holding.value - entry.snapshotAdjustment }
        : {}),
      logs: holding.logs.filter((item) => item.id !== entryId),
    }, today);
    if (updatedEntry.date > today) throw new Error('Date cannot be in the future');
    if (updatedEntry.amount > currentValue) {
      throw new Error(`Exceeds the current value of ${formatINR(currentValue)}`);
    }
    if (holding.kind === 'plan' && updatedEntry.date < holding.startDate) {
      throw new Error('Date is before the plan started');
    }
  }
  const linked = findLinkedTransaction(data, 'holding-entry', entryId);
  const transactions = linked
    ? data.transactions.map((transaction) => transaction.id === linked.id
      ? {
          ...transaction,
          amount: updatedEntry.amount,
          date: updatedEntry.date,
        }
      : transaction)
    : data.transactions;
  return {
    ...data,
    holdings: data.holdings.map((item) => item.id === holdingId
      ? {
        ...item,
        ...(item.kind === 'manual' && (entry.snapshotAdjustment !== undefined || adjustment !== undefined)
          ? { value: item.value - (entry.snapshotAdjustment ?? 0) + (adjustment ?? 0) }
          : {}),
        logs: item.logs.map((row) => row.id === entryId ? updatedEntry : row),
      }
      : item),
    transactions,
  };
}

export function deleteInvestmentEntry(data: AppData, holdingId: string, entryId: string): AppData {
  const holding = getHolding(data, holdingId);
  if (!holding.logs.some((item) => item.id === entryId)) throw new NotFoundError('Investment entry', entryId);
  const removedEntry = holding.logs.find((item) => item.id === entryId)!;
  return {
    ...data,
    holdings: data.holdings.map((item) => item.id === holdingId
      ? {
        ...item,
        ...(item.kind === 'manual' && removedEntry.snapshotAdjustment !== undefined
          ? { value: item.value - removedEntry.snapshotAdjustment }
          : {}),
        logs: item.logs.filter((entry) => entry.id !== entryId),
      }
      : item),
    transactions: data.transactions.filter((item) =>
      !(item.source?.kind === 'holding-entry' && item.source.parentId === holdingId && item.source.entryId === entryId)),
  };
}

export function deleteHoldingWithTransactions(
  data: AppData,
  holdingId: string,
  options: { linkedTransactions: 'delete' | 'keep' },
): AppData {
  getHolding(data, holdingId);
  const transactions = options.linkedTransactions === 'delete'
    ? data.transactions.filter((item) => !(item.source?.kind === 'holding-entry' && item.source.parentId === holdingId))
    : data.transactions.map((item) => {
      if (item.source?.kind !== 'holding-entry' || item.source.parentId !== holdingId) return item;
      const { source: _source, ...ordinary } = item;
      return ordinary;
    });
  return {
    ...data,
    holdings: data.holdings.filter((item) => item.id !== holdingId),
    transactions,
    ...(data.budgetPlan ? {
      budgetPlan: {
        ...data.budgetPlan,
        items: data.budgetPlan.items.map((item) => item.holdingId === holdingId
          ? { ...item, holdingId: undefined }
          : item),
      },
    } : {}),
    ...(data.monthBudgets ? {
      monthBudgets: data.monthBudgets.map((budget) => ({
        ...budget,
        items: budget.items.map((item) => item.holdingId === holdingId
          ? { ...item, holdingId: undefined }
          : item),
      })),
    } : {}),
  };
}

export function syncHoldingTransactions(
  transactions: Transaction[],
  current: Holding,
  updated: Holding,
): Transaction[] {
  return transactions.map((transaction) => {
    if (transaction.source?.kind !== 'holding-entry' || transaction.source.parentId !== current.id) return transaction;
    const entry = updated.logs.find((item) => item.id === transaction.source?.entryId);
    if (!entry) return transaction;
    const templates = [
      `${current.name} installment`, `${current.name} deposit`, `${current.name} withdrawal`,
    ];
    const note = templates.includes(transaction.note) ? entryNote(updated, entry.kind) : transaction.note;
    const category = entry.kind === 'Deposit' ? investCategoryFor(updated.type) : 'Withdrawal';
    return { ...transaction, note, category };
  });
}
