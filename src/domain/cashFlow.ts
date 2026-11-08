import { addInvestmentEntry } from './investmentActions';
import { addEfEntry } from './efActions';
import { addLiability, addLiabilityPayment, type AddLiabilityInput } from './liabilityActions';
import { NotFoundError } from './actions';
import { monthKey, shiftMonth } from './dates';
import { loanState } from './liability';
import { NON_EARNED_INCOME_CATEGORIES } from './schemas';
import type { AppData, ISODate, Liability, Transaction } from './types';

export type MonthPosition = {
  month: string;
  opening: number;
  earnedIncome: number;
  withdrawals: number;
  borrowed: number;
  loanProceeds: number;
  ownFunds: number;
  expense: number;
  invest: number;
  closing: number;
};

export type AvailableBalance = {
  label: 'Available balance' | 'Closing balance';
  amount: number;
  broughtForward: number;
  income: number;
  otherMoneyIn: number;
  spent: number;
  invested: number;
};

export function monthEndDate(month: string): ISODate {
  const nextMonth = shiftMonth(month, 1);
  const year = Number(nextMonth.slice(0, 4));
  const monthNumber = Number(nextMonth.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, monthNumber - 1, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

function sum(rows: Transaction[], predicate: (row: Transaction) => boolean): number {
  return rows.filter(predicate).reduce((total, row) => total + row.amount, 0);
}

export function monthPositions(transactions: Transaction[]): MonthPosition[] {
  if (transactions.length === 0) return [];
  const months = transactions.map((row) => monthKey(row.date)).sort();
  const first = months[0];
  const last = months[months.length - 1];
  if (!first || !last) return [];
  const positions: MonthPosition[] = [];
  let month = first;
  let opening = 0;
  while (month <= last) {
    const rows = transactions.filter((row) => monthKey(row.date) === month);
    const income = sum(rows, (row) => row.type === 'income');
    const earnedIncome = sum(rows, (row) =>
      row.type === 'income' && !(NON_EARNED_INCOME_CATEGORIES as readonly string[]).includes(row.category),
    );
    const withdrawals = sum(rows, (row) => row.type === 'income' && row.category === 'Withdrawal');
    const borrowed = sum(rows, (row) => row.type === 'income' && row.category === 'Borrowed');
    const loanProceeds = sum(rows, (row) => row.type === 'income' && row.category === 'Loan proceeds');
    const ownFunds = sum(rows, (row) => row.type === 'income' && row.category === 'Own funds');
    const expense = sum(rows, (row) => row.type === 'expense');
    const invest = sum(rows, (row) => row.type === 'invest');
    const closing = opening + income - expense - invest;
    positions.push({
      month, opening, earnedIncome, withdrawals, borrowed, loanProceeds, ownFunds,
      expense, invest, closing,
    });
    opening = closing;
    month = shiftMonth(month, 1);
  }
  return positions;
}

export function monthPositionAt(transactions: Transaction[], month: string): MonthPosition {
  const positions = monthPositions(transactions);
  const existing = positions.find((position) => position.month === month);
  if (existing) return existing;
  const previous = [...positions].reverse().find((position) => position.month < month);
  const opening = previous?.closing ?? 0;
  return {
    month, opening, earnedIncome: 0, withdrawals: 0, borrowed: 0, loanProceeds: 0,
    ownFunds: 0, expense: 0, invest: 0, closing: opening,
  };
}

export function availableBalance(
  transactions: Transaction[],
  month: string,
  today: ISODate,
): AvailableBalance {
  const currentMonth = monthKey(today);
  const monthTransactions = month < currentMonth
    ? transactions
    : transactions.filter((transaction) => monthKey(transaction.date) !== month || transaction.date <= today);
  const position = monthPositionAt(monthTransactions, month);
  return {
    label: month === currentMonth ? 'Available balance' : 'Closing balance',
    amount: position.closing,
    broughtForward: position.opening,
    income: position.earnedIncome,
    otherMoneyIn: position.withdrawals + position.borrowed + position.loanProceeds + position.ownFunds,
    spent: position.expense,
    invested: position.invest,
  };
}

export function reviewableMonths(data: AppData, today: ISODate): MonthPosition[] {
  const currentMonth = monthKey(today);
  return monthPositions(data.transactions)
    .filter((position) => position.month < currentMonth && Math.abs(position.closing) >= 1)
    .sort((a, b) => b.month.localeCompare(a.month));
}

export class AllocationMismatchError extends Error {
  constructor(message = 'Allocations must be positive and no greater than the available amount.') {
    super(message);
    this.name = 'AllocationMismatchError';
  }
}

export type ShortfallAllocation =
  | { kind: 'borrowed'; amount: number; lenderName: string }
  | { kind: 'loan-proceeds'; liabilityId: string; amount: number }
  | { kind: 'withdrawal'; instrumentId: string; amount: number }
  | { kind: 'own-funds'; amount: number; note: string };

export type SurplusAllocation =
  | { kind: 'invest'; instrumentId: string; amount: number }
  | { kind: 'ef'; amount: number }
  | { kind: 'liability'; liabilityId: string; amount: number };

function assertAllocations(allocations: { amount: number }[], available: number): void {
  const total = allocations.reduce((sumAmount, allocation) => sumAmount + allocation.amount, 0);
  if (allocations.length === 0 || allocations.some(({ amount }) => !Number.isFinite(amount) || amount <= 0) ||
    total > available + 0.000001) {
    throw new AllocationMismatchError();
  }
}

function uniqueLiabilityName(data: AppData, preferredName: string): string {
  const names = new Set(data.liabilities.map(({ name }) => name.toLowerCase()));
  if (!names.has(preferredName.toLowerCase())) return preferredName;
  let suffix = 2;
  while (names.has(`${preferredName} (${suffix})`.toLowerCase())) suffix += 1;
  return `${preferredName} (${suffix})`;
}

function appendOriginTransaction(
  data: AppData,
  liability: Liability,
  amount: number,
  category: 'Borrowed' | 'Loan proceeds',
  newId: () => string,
  date: ISODate = liability.startDate,
): AppData {
  const transaction: Transaction = {
    id: newId(),
    type: 'income',
    amount,
    date,
    category,
    note: category === 'Borrowed' ? liability.name : `${liability.name} proceeds`,
    source: { kind: 'liability-origin', parentId: liability.id, entryId: liability.id },
  };
  return { ...data, transactions: [...data.transactions, transaction] };
}

function addBorrowing(
  data: AppData,
  amount: number,
  name: string,
  date: ISODate,
  category: 'Borrowed' | 'Loan proceeds',
  newId: () => string,
): AppData {
  const liability = addLiability(data, {
    kind: 'one-time',
    name: uniqueLiabilityName(data, name),
    type: 'Borrowed money',
    principal: amount,
    ratePct: 0,
    startDate: date,
    dueDate: null,
  }, newId);
  const created = liability.liabilities.find((item) => !data.liabilities.some((previous) => previous.id === item.id));
  if (!created) throw new Error('The new liability could not be created.');
  return appendOriginTransaction(liability, created, amount, category, newId);
}

export function shortfallForMonth(data: AppData, month: string): number {
  const position = monthPositions(data.transactions).find((row) => row.month === month);
  return Math.max(0, -(position?.closing ?? 0));
}

export function surplusForMonth(data: AppData, month: string): number {
  const position = monthPositions(data.transactions).find((row) => row.month === month);
  return Math.max(0, position?.closing ?? 0);
}

export function fundShortfall(
  data: AppData,
  input: { month: string; allocations: ShortfallAllocation[] },
  newId: () => string,
): AppData {
  const available = shortfallForMonth(data, input.month);
  assertAllocations(input.allocations, available);
  const date = monthEndDate(input.month);
  return input.allocations.reduce((result, allocation) => {
    if (allocation.kind === 'borrowed') {
      return addBorrowing(result, allocation.amount, `Borrowed from ${allocation.lenderName}`, date, 'Borrowed', newId);
    }
    if (allocation.kind === 'loan-proceeds') {
      const liability = result.liabilities.find((item) => item.id === allocation.liabilityId);
      if (!liability) throw new NotFoundError('Liability', allocation.liabilityId);
      if (allocation.amount > liability.principal) throw new AllocationMismatchError();
      if (result.transactions.some((item) => item.source?.kind === 'liability-origin' && item.source.parentId === liability.id)) {
        throw new Error('This liability already has a proceeds transaction.');
      }
      if (date < liability.startDate) throw new Error('Proceeds cannot predate the liability start date.');
      return appendOriginTransaction(result, liability, allocation.amount, 'Loan proceeds', newId, date);
    }
    if (allocation.kind === 'withdrawal') {
      if (allocation.instrumentId === 'ef') {
        return addEfEntry(result, {
          date, amount: -allocation.amount, note: 'Withdrawal',
        }, { newId });
      }
      return addInvestmentEntry(result, allocation.instrumentId, {
        date, amount: allocation.amount, kind: 'Withdrawal', note: 'Withdrawal',
      }, newId, date);
    }
    const transaction: Transaction = {
      id: newId(),
      type: 'income',
      amount: allocation.amount,
      date,
      category: 'Own funds',
      note: allocation.note,
    };
    return { ...result, transactions: [...result.transactions, transaction] };
  }, data);
}

export function allocateSurplus(
  data: AppData,
  input: { date: ISODate; allocations: SurplusAllocation[] },
  newId: () => string,
  today: ISODate,
): AppData {
  if (input.date > today) throw new Error('Date cannot be in the future.');
  const month = monthKey(input.date);
  assertAllocations(input.allocations, surplusForMonth(data, month));
  return input.allocations.reduce((result, allocation) => {
    if (allocation.kind === 'invest') {
      const holding = result.holdings.find((item) => item.id === allocation.instrumentId);
      if (!holding) throw new NotFoundError('Holding', allocation.instrumentId);
      return addInvestmentEntry(result, holding.id, {
        date: input.date, amount: allocation.amount, kind: 'Deposit', note: 'Deposit',
      }, newId, today);
    }
    if (allocation.kind === 'ef') {
      return addEfEntry(result, { date: input.date, amount: allocation.amount, note: 'Deposit' }, { newId });
    }
    const liability = result.liabilities.find((item) => item.id === allocation.liabilityId);
    if (!liability) throw new NotFoundError('Liability', allocation.liabilityId);
    const kind = liability.kind === 'recurring' ? 'Prepayment' : 'Payment';
    const outstanding = loanState(liability, input.date).balance;
    if (allocation.amount > outstanding) {
      throw new Error(`Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`);
    }
    return addLiabilityPayment(result, liability.id, {
      date: input.date, amount: allocation.amount, kind, note: 'Repayment',
    }, { newId });
  }, data);
}

export type MoneyMovement =
  | { kind: 'borrowed-in'; lenderName: string; amount: number; date: ISODate; note?: string }
  | { kind: 'loan-received'; amount: number; date: ISODate; liability?: AddLiabilityInput; liabilityId?: string; note?: string }
  | { kind: 'repay'; liabilityId: string; amount: number; date: ISODate; note?: string }
  | { kind: 'withdraw'; instrumentId: string; amount: number; date: ISODate; note?: string }
  | { kind: 'own-funds'; amount: number; date: ISODate; note: string };

export function recordMoneyMovement(
  data: AppData,
  movement: MoneyMovement,
  newId: () => string,
  today: ISODate,
): AppData {
  if (movement.date > today) throw new Error('Date cannot be in the future.');
  if (!Number.isFinite(movement.amount) || movement.amount <= 0) {
    throw new AllocationMismatchError('Amount must be greater than zero.');
  }
  if (movement.kind === 'borrowed-in') {
    return addBorrowing(
      data, movement.amount, `Borrowed from ${movement.lenderName}`, movement.date, 'Borrowed', newId,
    );
  }
  if (movement.kind === 'loan-received') {
    if (movement.liability) {
      if (movement.amount > movement.liability.principal) throw new AllocationMismatchError();
      const input = { ...movement.liability, startDate: movement.date };
      const created = addLiability(data, input, newId);
      const liability = created.liabilities.find((item) => !data.liabilities.some((previous) => previous.id === item.id));
      if (!liability) throw new Error('The new liability could not be created.');
      const fullOneTimeReceipt = liability.kind === 'one-time'
        && movement.amount === liability.principal
        && movement.date === liability.startDate;
      const category = fullOneTimeReceipt ? 'Borrowed' : 'Loan proceeds';
      return appendOriginTransaction(created, liability, movement.amount, category, newId, movement.date);
    }
    if (!movement.liabilityId) throw new Error('Choose a liability for the loan proceeds.');
    const liability = data.liabilities.find((item) => item.id === movement.liabilityId);
    if (!liability) throw new NotFoundError('Liability', movement.liabilityId);
    if (movement.amount > liability.principal) throw new AllocationMismatchError();
    if (data.transactions.some((item) => item.source?.kind === 'liability-origin' && item.source.parentId === liability.id)) {
      throw new Error('This liability already has a proceeds transaction.');
    }
    if (movement.date < liability.startDate) throw new Error('Proceeds cannot predate the liability start date.');
    return appendOriginTransaction(data, liability, movement.amount, 'Loan proceeds', newId, movement.date);
  }
  if (movement.kind === 'repay') {
    const liability = data.liabilities.find((item) => item.id === movement.liabilityId);
    if (!liability) throw new NotFoundError('Liability', movement.liabilityId);
    return addLiabilityPayment(data, liability.id, {
      date: movement.date,
      amount: movement.amount,
      kind: liability.kind === 'recurring' ? 'Prepayment' : 'Payment',
      note: movement.note ?? 'Repayment',
    }, { newId });
  }
  if (movement.kind === 'withdraw') {
    if (movement.instrumentId === 'ef') {
      return addEfEntry(data, {
        date: movement.date, amount: -movement.amount, note: movement.note ?? 'Withdrawal',
      }, { newId });
    }
    return addInvestmentEntry(data, movement.instrumentId, {
      date: movement.date,
      amount: movement.amount,
      kind: 'Withdrawal',
      note: movement.note ?? 'Withdrawal',
    }, newId, today);
  }
  const transaction: Transaction = {
    id: newId(),
    type: 'income',
    amount: movement.amount,
    date: movement.date,
    category: 'Own funds',
    note: movement.note,
  };
  return { ...data, transactions: [...data.transactions, transaction] };
}
