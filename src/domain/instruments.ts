import { NotFoundError } from './actions';
import { efBalanceOn, efEndOfDayBalances, EfBalanceError } from './efActions';
import { investCategoryFor, LinkedTransactionError } from './links';
import { snapshotAdjustmentForEntry, updateInvestmentEntry } from './investmentActions';
import { holdingValue } from './portfolio';
import type {
  AppData,
  EfEntry,
  Holding,
  HoldingType,
  InvestmentEntry,
  ISODate,
  LiabilityPayment,
  Transaction,
} from './types';

export type Instrument = {
  id: 'ef' | string;
  kind: 'ef' | 'holding';
  name: string;
  type: HoldingType | 'Emergency fund';
  valueNow: number;
  canWithdraw: boolean;
};

export type InstrumentTransactionInput = {
  kind: 'deposit' | 'withdrawal';
  instrumentId: string;
  amount: number;
  date: ISODate;
  note: string;
};

export type LinkedTransactionPatch = {
  amount?: number;
  date?: ISODate;
  note?: string;
  instrumentId?: string;
};

type InstrumentSource = Extract<
  NonNullable<Transaction['source']>,
  { kind: 'holding-entry' | 'ef-entry' }
>;

export type UnlinkedEntry =
  | { kind: 'ef'; entry: EfEntry }
  | { kind: 'holding'; holdingId: string; holdingName: string; holdingKind: Holding['kind']; entry: InvestmentEntry }
  | { kind: 'liability'; liabilityId: string; liabilityName: string; entry: LiabilityPayment };

function efGoal(data: AppData) {
  const goal = data.goals.find((item) => item.auto === 'ef');
  if (!goal) throw new NotFoundError('Emergency fund Goal', 'auto:ef');
  return goal;
}

function assertDate(date: ISODate, today: ISODate): void {
  if (date > today) throw new Error('Date cannot be in the future');
}

function assertAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero');
}

function assertHoldingDate(holding: Holding, date: ISODate): void {
  if (holding.kind === 'plan' && date < holding.startDate) {
    throw new Error('Date is before the plan started');
  }
}

function assertWithdrawalFits(holding: Holding, entry: Pick<InvestmentEntry, 'id' | 'amount'>, today: ISODate): void {
  const available = holdingValue({
    ...holding,
    logs: holding.logs.filter((item) => item.id !== entry.id),
  }, today);
  if (entry.amount > available) {
    throw new Error(`Exceeds the current value of ₹${available.toLocaleString('en-IN')}`);
  }
}

function assertEfNonNegative(entries: EfEntry[]): void {
  const negative = efEndOfDayBalances(entries).find(({ balance }) => balance < 0);
  if (negative) throw new EfBalanceError(negative.date);
}

function instrument(data: AppData, id: string, asOf: ISODate): Instrument {
  if (id === 'ef') {
    const valueNow = efBalanceOn(data.efEntries, asOf);
    return { id: 'ef', kind: 'ef', name: 'Emergency fund', type: 'Emergency fund', valueNow, canWithdraw: valueNow > 0 };
  }
  const holding = data.holdings.find((item) => item.id === id);
  if (!holding) throw new NotFoundError('Investment', id);
  const valueNow = holdingValue(holding, asOf);
  return {
    id: holding.id,
    kind: 'holding',
    name: holding.name,
    type: holding.type,
    valueNow,
    canWithdraw: valueNow > 0,
  };
}

export function listInstruments(data: AppData, asOf: ISODate): Instrument[] {
  return [
    instrument(data, 'ef', asOf),
    ...data.holdings.map((holding) => instrument(data, holding.id, asOf)),
  ];
}

function replaceTransaction(data: AppData, updated: Transaction): AppData {
  return {
    ...data,
    transactions: data.transactions.map((transaction) => transaction.id === updated.id ? updated : transaction),
  };
}

function entryForTransaction(
  data: AppData,
  source: InstrumentSource,
): InvestmentEntry | EfEntry {
  if (source.kind === 'holding-entry') {
    const holding = data.holdings.find((item) => item.id === source.parentId);
    const entry = holding?.logs.find((item) => item.id === source.entryId);
    if (!entry) throw new NotFoundError('Investment entry', source.entryId);
    return entry;
  }
  const entry = data.efEntries.find((item) => item.id === source.entryId);
  if (!entry) throw new NotFoundError('Emergency fund entry', source.entryId);
  return entry;
}

function removeLinkedEntry(data: AppData, source: InstrumentSource): AppData {
  if (source.kind === 'holding-entry') {
    return {
      ...data,
      holdings: data.holdings.map((holding) => holding.id === source.parentId
        ? {
          ...holding,
          ...(holding.kind === 'manual'
            ? {
              value: holding.value - (
                holding.logs.find((entry) => entry.id === source.entryId)?.snapshotAdjustment ?? 0
              ),
            }
            : {}),
          logs: holding.logs.filter((entry) => entry.id !== source.entryId),
        }
        : holding),
    };
  }
  return { ...data, efEntries: data.efEntries.filter((entry) => entry.id !== source.entryId) };
}

function appendEntry(
  data: AppData,
  targetId: string,
  entryId: string,
  kind: InvestmentEntry['kind'],
  amount: number,
  date: ISODate,
  note: string,
  today: ISODate,
): { data: AppData; source: NonNullable<Transaction['source']>; category: string; type: Transaction['type'] } {
  assertAmount(amount);
  assertDate(date, today);
  const signedAmount = kind === 'Deposit' ? amount : -amount;
  if (targetId === 'ef') {
    const goal = efGoal(data);
    const efEntry: EfEntry = { id: entryId, date, amount: signedAmount, note };
    const efEntries = [...data.efEntries, efEntry];
    assertEfNonNegative(efEntries);
    return {
      data: { ...data, efEntries },
      source: { kind: 'ef-entry', parentId: goal.id, entryId },
      category: kind === 'Deposit' ? 'Emergency fund' : 'Withdrawal',
      type: kind === 'Deposit' ? 'invest' : 'income',
    };
  }
  const holding = data.holdings.find((item) => item.id === targetId);
  if (!holding) throw new NotFoundError('Investment', targetId);
  assertHoldingDate(holding, date);
  const entry: InvestmentEntry = { id: entryId, date, amount, kind, note };
  if (kind === 'Withdrawal') assertWithdrawalFits(holding, entry, today);
  const adjustment = snapshotAdjustmentForEntry(holding, entry);
  const adjustedEntry = adjustment === undefined ? entry : { ...entry, snapshotAdjustment: adjustment };
  return {
    data: {
      ...data,
      holdings: data.holdings.map((item) => item.id === holding.id
        ? {
          ...item,
          ...(item.kind === 'manual' && adjustment !== undefined ? { value: item.value + adjustment } : {}),
          logs: [...item.logs, adjustedEntry],
        }
        : item),
    },
    source: { kind: 'holding-entry', parentId: holding.id, entryId },
    category: kind === 'Deposit' ? investCategoryFor(holding.type) : 'Withdrawal',
    type: kind === 'Deposit' ? 'invest' : 'income',
  };
}

export function addInstrumentTransaction(
  data: AppData,
  input: InstrumentTransactionInput,
  newId: () => string,
  today: ISODate,
): AppData {
  const entryId = newId();
  const entryKind = input.kind === 'deposit' ? 'Deposit' : 'Withdrawal';
  const appended = appendEntry(data, input.instrumentId, entryId, entryKind, input.amount, input.date, input.note, today);
  const transaction: Transaction = {
    id: newId(),
    type: appended.type,
    amount: input.amount,
    category: appended.category,
    note: input.note,
    date: input.date,
    source: appended.source,
  };
  return { ...appended.data, transactions: [...appended.data.transactions, transaction] };
}

export function updateLinkedTransaction(
  data: AppData,
  id: string,
  patch: LinkedTransactionPatch,
  options: { newId: () => string; today: ISODate },
): AppData {
  const transaction = data.transactions.find((item) => item.id === id);
  if (!transaction) throw new NotFoundError('Transaction', id);
  if ('type' in (patch as object) || 'category' in (patch as object)) throw new LinkedTransactionError();
  const source = transaction.source;
  if (!source || (source.kind !== 'holding-entry' && source.kind !== 'ef-entry')) {
    throw new LinkedTransactionError();
  }
  const oldEntry = entryForTransaction(data, source);
  const nextAmount = patch.amount ?? transaction.amount;
  const nextDate = patch.date ?? transaction.date;
  assertAmount(nextAmount);
  assertDate(nextDate, options.today);
  const nextKind = transaction.type === 'income' ? 'Withdrawal' : 'Deposit';
  const targetId = patch.instrumentId ?? (source.kind === 'ef-entry' ? 'ef' : source.parentId);

  if (targetId === (source.kind === 'ef-entry' ? 'ef' : source.parentId)) {
    let updatedData = data;
    if (source.kind === 'holding-entry') {
      updatedData = updateInvestmentEntry(data, source.parentId, source.entryId, {
        amount: nextAmount,
        date: nextDate,
      }, options.today);
    } else {
      const current = oldEntry as EfEntry;
      const updatedEntry = { ...current, amount: nextKind === 'Deposit' ? nextAmount : -nextAmount, date: nextDate };
      const efEntries = data.efEntries.map((entry) => entry.id === source.entryId ? updatedEntry : entry);
      assertEfNonNegative(efEntries);
      updatedData = { ...data, efEntries };
    }
    return replaceTransaction(updatedData, {
      ...transaction,
      amount: nextAmount,
      date: nextDate,
      ...(patch.note === undefined ? {} : { note: patch.note }),
    });
  }

  const withoutOld = removeLinkedEntry(data, source);
  if (source.kind === 'ef-entry') assertEfNonNegative(withoutOld.efEntries);
  const appended = appendEntry(
    withoutOld,
    targetId,
    options.newId(),
    nextKind,
    nextAmount,
    nextDate,
    oldEntry.note,
    options.today,
  );
  return replaceTransaction(appended.data, {
    ...transaction,
    type: appended.type,
    amount: nextAmount,
    date: nextDate,
    category: appended.category,
    note: patch.note ?? transaction.note,
    source: appended.source,
  });
}

export function deleteLinkedTransaction(data: AppData, id: string): AppData {
  const transaction = data.transactions.find((item) => item.id === id);
  if (!transaction) throw new NotFoundError('Transaction', id);
  if (!transaction.source || (transaction.source.kind !== 'holding-entry' && transaction.source.kind !== 'ef-entry')) {
    throw new LinkedTransactionError();
  }
  entryForTransaction(data, transaction.source);
  const withoutEntry = removeLinkedEntry(data, transaction.source);
  if (transaction.source.kind === 'ef-entry') assertEfNonNegative(withoutEntry.efEntries);
  return {
    ...withoutEntry,
    transactions: withoutEntry.transactions.filter((item) => item.id !== id),
  };
}

export function linkExistingTransaction(
  data: AppData,
  transactionId: string,
  instrumentId: string,
  newId: () => string,
  today: ISODate,
  note?: string,
): AppData {
  const transaction = data.transactions.find((item) => item.id === transactionId);
  if (!transaction) throw new NotFoundError('Transaction', transactionId);
  if (transaction.source || transaction.type !== 'invest') throw new LinkedTransactionError('Only unlinked investment transactions can be linked.');
  const appended = appendEntry(data, instrumentId, newId(), 'Deposit', transaction.amount, transaction.date, transaction.note, today);
  return replaceTransaction(appended.data, {
    ...transaction,
    category: appended.category,
    ...(note === undefined ? {} : { note }),
    source: appended.source,
  });
}

function hasLinkedSource(
  data: AppData,
  kind: NonNullable<Transaction['source']>['kind'],
  parentId: string,
  entryId: string,
): boolean {
  return data.transactions.some((transaction) =>
    transaction.source?.kind === kind &&
    transaction.source.parentId === parentId &&
    transaction.source.entryId === entryId,
  );
}

export function findUnlinkedEntries(data: AppData): UnlinkedEntry[] {
  const rows: UnlinkedEntry[] = [];
  const goal = data.goals.find((item) => item.auto === 'ef');
  for (const entry of data.efEntries) {
    if (goal && !hasLinkedSource(data, 'ef-entry', goal.id, entry.id)) rows.push({ kind: 'ef', entry });
  }
  for (const holding of data.holdings) {
    for (const entry of holding.logs) {
      if (!hasLinkedSource(data, 'holding-entry', holding.id, entry.id)) {
        rows.push({ kind: 'holding', holdingId: holding.id, holdingName: holding.name, holdingKind: holding.kind, entry });
      }
    }
  }
  for (const liability of data.liabilities) {
    for (const entry of liability.payments) {
      if (!hasLinkedSource(data, 'liability-payment', liability.id, entry.id)) {
        rows.push({ kind: 'liability', liabilityId: liability.id, liabilityName: liability.name, entry });
      }
    }
  }
  return rows;
}

export function createMissingTransactions(data: AppData, newId: () => string): AppData {
  const missing = findUnlinkedEntries(data);
  if (missing.length === 0) return data;
  const efParentId = efGoal(data).id;
  const transactions = missing.map((item): Transaction => {
    if (item.kind === 'ef') {
      const withdrawal = item.entry.amount < 0;
      return {
        id: newId(),
        type: withdrawal ? 'income' : 'invest',
        amount: Math.abs(item.entry.amount),
        category: withdrawal ? 'Withdrawal' : 'Emergency fund',
        note: withdrawal ? 'Emergency fund withdrawal' : 'Emergency fund Deposit',
        date: item.entry.date,
        source: { kind: 'ef-entry', parentId: efParentId, entryId: item.entry.id },
      };
    }
    if (item.kind === 'holding') {
      const withdrawal = item.entry.kind === 'Withdrawal';
      const holding = data.holdings.find((entry) => entry.id === item.holdingId)!;
      return {
        id: newId(),
        type: withdrawal ? 'income' : 'invest',
        amount: item.entry.amount,
        category: withdrawal ? 'Withdrawal' : investCategoryFor(holding.type),
        note: withdrawal
          ? `${item.holdingName} withdrawal`
          : item.holdingKind === 'plan' ? `${item.holdingName} installment` : `${item.holdingName} deposit`,
        date: item.entry.date,
        source: { kind: 'holding-entry', parentId: item.holdingId, entryId: item.entry.id },
      };
    }
    const payment = item.entry;
    const liability = data.liabilities.find((entry) => entry.id === item.liabilityId)!;
    return {
      id: newId(),
      type: 'expense',
      amount: payment.amount,
      category: liability.kind === 'recurring' && payment.kind !== 'Payment' ? 'EMI' : 'Other',
      note: `${item.liabilityName} ${payment.kind === 'Prepayment' ? 'prepayment' : payment.kind === 'Payment' ? 'payment' : 'EMI'}`,
      date: payment.date,
      source: { kind: 'liability-payment', parentId: item.liabilityId, entryId: payment.id },
    };
  });
  return { ...data, transactions: [...data.transactions, ...transactions] };
}
