import { NotFoundError } from './actions';
import { findLinkedTransaction } from './links';
import { liabilityState, emiAuto } from './liability';
import type { AppData, Liability, LiabilityPayment, RecurringLiability, OneTimeLiability, Transaction } from './types';

export type AddLiabilityInput = Omit<RecurringLiability, 'id' | 'payments' | 'emi'> & { emi: number | null } | Omit<OneTimeLiability, 'id' | 'payments'>;
export type LiabilityPatch = Partial<Omit<AddLiabilityInput, 'emi'>> & { emi?: number | null };
export type LiabilityPaymentPatch = Partial<Pick<LiabilityPayment, 'date' | 'amount' | 'note' | 'kind'>>;

function getLiability(data: AppData, id: string): Liability {
  const item = data.liabilities.find((liability) => liability.id === id);
  if (!item) throw new NotFoundError('Liability', id);
  return item;
}
function transactionNote(name: string, kind: LiabilityPayment['kind']): string { return `${name} ${kind === 'Prepayment' ? 'prepayment' : kind === 'Payment' ? 'payment' : 'EMI'}`; }

export function addLiability(data: AppData, input: AddLiabilityInput, newId: () => string): AppData {
  const liability: Liability = input.kind === 'recurring'
    ? { ...input, id: newId(), emi: input.emi ?? emiAuto(input.principal, input.ratePct, input.tenureMonths), payments: [] }
    : { ...input, id: newId(), payments: [] };
  return { ...data, liabilities: [...data.liabilities, liability] };
}
export function updateLiability(data: AppData, id: string, patch: LiabilityPatch): AppData {
  const current = getLiability(data, id);
  const { emi, ...other } = patch;
  const updated: Liability = current.kind === 'recurring'
    ? { ...current, ...other, ...(emi === null ? { emi: emiAuto((other.principal ?? current.principal), (other.ratePct ?? current.ratePct), (other.tenureMonths ?? current.tenureMonths)) } : emi === undefined ? {} : { emi }) } as RecurringLiability
    : { ...current, ...other } as OneTimeLiability;
  const transactions = data.transactions.map((transaction) => {
    if (transaction.source?.kind !== 'liability-payment' || transaction.source.parentId !== id || patch.name === undefined) return transaction;
    const payment = current.payments.find((entry) => entry.id === transaction.source?.entryId);
    const oldNote = payment ? transactionNote(current.name, payment.kind) : transaction.note;
    return transaction.note === oldNote ? { ...transaction, note: payment ? transactionNote(updated.name, payment.kind) : transaction.note } : transaction;
  });
  return { ...data, liabilities: data.liabilities.map((item) => item.id === id ? updated : item), transactions };
}
export function deleteLiability(data: AppData, id: string, options: { linkedTransactions: 'delete' | 'keep' }): AppData {
  const liability = getLiability(data, id);
  const ids = new Set(liability.payments.map(({ id: paymentId }) => paymentId));
  const transactions = options.linkedTransactions === 'delete'
    ? data.transactions.filter((transaction) => !(transaction.source?.kind === 'liability-payment' && transaction.source.parentId === id && ids.has(transaction.source.entryId)))
    : data.transactions.map((transaction) => {
      if (transaction.source?.kind !== 'liability-payment' || transaction.source.parentId !== id) return transaction;
      const { source: _source, ...ordinary } = transaction; return ordinary;
    });
  return { ...data, liabilities: data.liabilities.filter((item) => item.id !== id), transactions };
}
export function addLiabilityPayment(data: AppData, liabilityId: string, input: Omit<LiabilityPayment, 'id'>, newId: () => string): AppData {
  const liability = getLiability(data, liabilityId);
  const payment: LiabilityPayment = { ...input, kind: liability.kind === 'one-time' ? 'Payment' : input.kind, id: newId() };
  if (payment.amount > liabilityState(liability, payment.date).balance) throw new Error('Payment exceeds the outstanding balance');
  const updated = { ...liability, payments: [...liability.payments, payment] } as Liability;
  const transaction: Transaction = { id: newId(), type: 'expense', amount: payment.amount, date: payment.date, category: 'EMI', note: transactionNote(liability.name, payment.kind), source: { kind: 'liability-payment', parentId: liabilityId, entryId: payment.id } };
  return { ...data, liabilities: data.liabilities.map((item) => item.id === liabilityId ? updated : item), transactions: [...data.transactions, transaction] };
}
export function updateLiabilityPayment(data: AppData, liabilityId: string, paymentId: string, patch: LiabilityPaymentPatch): AppData {
  const liability = getLiability(data, liabilityId);
  if (!liability.payments.some((payment) => payment.id === paymentId)) throw new NotFoundError('Liability payment', paymentId);
  const payments = liability.payments.map((payment) => payment.id === paymentId ? { ...payment, ...patch, ...(liability.kind === 'one-time' ? { kind: 'Payment' as const } : {}) } : payment);
  const linked = findLinkedTransaction(data, 'liability-payment', paymentId);
  const payment = payments.find((item) => item.id === paymentId)!;
  return { ...data, liabilities: data.liabilities.map((item) => item.id === liabilityId ? { ...item, payments } as Liability : item), transactions: linked ? data.transactions.map((transaction) => transaction.id === linked.id ? { ...transaction, amount: payment.amount, date: payment.date, note: transactionNote(liability.name, payment.kind) } : transaction) : data.transactions };
}
export function deleteLiabilityPayment(data: AppData, liabilityId: string, paymentId: string): AppData {
  const liability = getLiability(data, liabilityId);
  if (!liability.payments.some((payment) => payment.id === paymentId)) throw new NotFoundError('Liability payment', paymentId);
  return { ...data, liabilities: data.liabilities.map((item) => item.id === liabilityId ? { ...item, payments: item.payments.filter((payment) => payment.id !== paymentId) } : item), transactions: data.transactions.filter((transaction) => !(transaction.source?.kind === 'liability-payment' && transaction.source.parentId === liabilityId && transaction.source.entryId === paymentId)) };
}
