import type { ISODate, Transaction } from './types';

export const STRESS_TRANSACTION_COUNT = 20_000;

export function createStressTransactions(today: ISODate, newId: () => string): Transaction[] {
  return Array.from({ length: STRESS_TRANSACTION_COUNT }, (_, index) => ({
    id: newId(),
    type: index % 3 === 0 ? 'invest' : index % 3 === 1 ? 'expense' : 'income',
    amount: (index % 10_000) + 1,
    category: index % 3 === 0 ? 'Investment' : index % 3 === 1 ? 'Stress expense' : 'Stress income',
    note: `Stress test transaction ${index + 1}`,
    date: today,
  }));
}
