import { ensureEfGoal } from './goals';
import { LinkedTransactionError } from './links';
import type { AppData, ISODate, Settings, Transaction } from './types';

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`);
    this.name = 'NotFoundError';
  }
}

export function emptyAppData(asOf: ISODate): AppData {
  return {
    settings: { name: '', theme: 'system', monthlySalary: null, onboarded: false },
    transactions: [],
    goals: ensureEfGoal([], { expenseBaseline: 0, asOf }),
    holdings: [],
    liabilities: [],
    policies: [],
    budget: null,
    budgetTemplates: [],
    defaultBudgetTemplateId: null,
    monthBudgets: [],
    efEntries: [],
    efAllocation: null,
    efCustomBuckets: [],
    efBucketLinks: {},
  };
}

export function addTransaction(
  data: AppData,
  input: Omit<Transaction, 'id'>,
  newId: () => string,
): AppData {
  const transaction: Transaction = { ...input, id: newId() };
  return { ...data, transactions: [...data.transactions, transaction] };
}

export function updateTransaction(
  data: AppData,
  id: string,
  patch: Partial<Omit<Transaction, 'id'>>,
): AppData {
  if (!data.transactions.some((transaction) => transaction.id === id)) {
    throw new NotFoundError('Transaction', id);
  }
  const current = data.transactions.find((transaction) => transaction.id === id)!;
  const linkedFields: (keyof Omit<Transaction, 'id' | 'note'>)[] = ['type', 'amount', 'category', 'date', 'source'];
  if (current.source && linkedFields.some((field) =>
    field in patch && !Object.is(current[field], patch[field]),
  )) {
    throw new LinkedTransactionError();
  }
  return {
    ...data,
    transactions: data.transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, ...patch } : transaction,
    ),
  };
}

export function deleteTransaction(data: AppData, id: string): AppData {
  const transaction = data.transactions.find((item) => item.id === id);
  if (!transaction) {
    throw new NotFoundError('Transaction', id);
  }
  if (transaction.source) throw new LinkedTransactionError();
  return { ...data, transactions: data.transactions.filter((transaction) => transaction.id !== id) };
}

export function updateSettings(data: AppData, patch: Partial<Settings>): AppData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

export function completeOnboarding(
  data: AppData,
  profile: { name: string; monthlySalary: number | null },
): AppData {
  return updateSettings(data, { ...profile, onboarded: true });
}
