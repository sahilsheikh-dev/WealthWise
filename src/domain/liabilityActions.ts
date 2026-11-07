import { NotFoundError } from './actions';
import { addMonths, isValidISO } from './dates';
import { findLinkedTransaction } from './links';
import { emiAuto, loanState } from './liability';
import type {
  AppData,
  ISODate,
  Liability,
  LiabilityClosure,
  LiabilityPayment,
  OneTimeLiability,
  RecurringLiability,
  Transaction,
} from './types';

export type AddLiabilityInput =
  | (Omit<RecurringLiability, 'id' | 'payments' | 'emi' | 'settlement'> & { emi: number | null })
  | Omit<OneTimeLiability, 'id' | 'payments'>;
export type LiabilityPatch = Partial<
  Pick<RecurringLiability, 'name' | 'type' | 'principal' | 'ratePct' | 'startDate' | 'tenureMonths'>
  & Pick<OneTimeLiability, 'dueDate'>
> & { emi?: number | null; closureNote?: string };
export type LiabilityPaymentPatch = Partial<Pick<LiabilityPayment, 'date' | 'amount' | 'note' | 'kind'>>;
export type CloseLiabilityInput = {
  date: ISODate;
  amountPaid: number;
  note?: string;
  writeOffConfirmed: boolean;
};

function getLiability(data: AppData, id: string): Liability {
  const liability = data.liabilities.find((entry) => entry.id === id);
  if (!liability) throw new NotFoundError('Liability', id);
  return liability;
}

function assertLiabilityDates(liability: Pick<OneTimeLiability, 'startDate' | 'dueDate'>): void {
  if (liability.dueDate !== null && liability.dueDate < liability.startDate) {
    throw new Error('Due date cannot be before the liability started');
  }
}

function transactionNote(name: string, kind: LiabilityPayment['kind']): string {
  return `${name} ${kind === 'Prepayment' ? 'prepayment' : kind === 'Payment' ? 'payment' : 'EMI'}`;
}

function paymentCategory(liability: Liability, payment: LiabilityPayment): string {
  return liability.kind === 'recurring' && payment.kind !== 'Payment' ? 'EMI' : 'Other';
}

export function addLiability(data: AppData, input: AddLiabilityInput, newId: () => string): AppData {
  const liability: Liability = input.kind === 'recurring'
    ? {
      ...input,
      id: newId(),
      emi: input.emi ?? emiAuto(input.principal, input.ratePct, input.tenureMonths),
      payments: [],
      settlement: null,
    }
    : { ...input, id: newId(), payments: [] };
  if (liability.kind === 'one-time') assertLiabilityDates(liability);
  return { ...data, liabilities: [...data.liabilities, liability] };
}

export function updateLiability(data: AppData, id: string, patch: LiabilityPatch): AppData {
  const current = getLiability(data, id);
  if (current.kind === 'recurring' && current.closure) {
    if (Object.keys(patch).length !== 1 || patch.closureNote === undefined) {
      throw new Error('Only the closure note can be edited on a closed liability.');
    }
    if (patch.closureNote.length > 200) throw new RangeError('Closure note must be 200 characters or fewer.');
    const closure = current.closure;
    const closureNote = patch.closureNote;
    return {
      ...data,
      liabilities: data.liabilities.map((entry) => entry.id === id
        ? { ...current, closure: { ...closure, note: closureNote } }
        : entry),
    };
  }
  if (patch.closureNote !== undefined) {
    throw new Error('A closure note can only be edited on a closed liability.');
  }
  let updated: Liability;
  if (current.kind === 'recurring') {
    const base = { ...current, ...patch };
    updated = {
      ...base,
      kind: 'recurring',
      emi: patch.emi === null
        ? emiAuto(base.principal, base.ratePct, base.tenureMonths)
        : (patch.emi ?? current.emi),
    };
  } else {
    updated = { ...current, ...patch, kind: 'one-time' };
    assertLiabilityDates(updated);
  }
  const transactions = data.transactions.map((transaction) => {
    if (transaction.source?.kind === 'liability-origin' &&
      transaction.source.parentId === id &&
      (transaction.note === current.name || transaction.note === `${current.name} proceeds`)) {
      return {
        ...transaction,
        note: transaction.note === current.name ? updated.name : `${updated.name} proceeds`,
      };
    }
    if (transaction.source?.kind !== 'liability-payment' || transaction.source.parentId !== id) return transaction;
    const payment = current.payments.find((entry) => entry.id === transaction.source?.entryId);
    const expectedOldNote = payment ? transactionNote(current.name, payment.kind) : '';
    if (patch.name === undefined || transaction.note !== expectedOldNote || !payment) return transaction;
    return { ...transaction, note: transactionNote(updated.name, payment.kind) };
  });
  return {
    ...data,
    liabilities: data.liabilities.map((entry) => entry.id === id ? updated : entry),
    transactions,
  };
}

export function deleteLiability(
  data: AppData,
  id: string,
  options: { linkedTransactions: 'delete' | 'keep' },
): AppData {
  const liability = getLiability(data, id);
  const paymentIds = new Set(liability.payments.map(({ id: paymentId }) => paymentId));
  const transactions = options.linkedTransactions === 'delete'
    ? data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'liability-payment' &&
        transaction.source.parentId === id && paymentIds.has(transaction.source.entryId)) &&
      !(transaction.source?.kind === 'liability-closure-charge' && transaction.source.parentId === id) &&
      !(transaction.source?.kind === 'liability-origin' && transaction.source.parentId === id),
    )
    : data.transactions.map((transaction) => {
      if (transaction.source?.kind === 'liability-origin' && transaction.source.parentId === id) {
        const { source: _source, ...ordinary } = transaction;
        return ordinary;
      }
      if (transaction.source?.kind === 'liability-closure-charge' && transaction.source.parentId === id) {
        const { source: _source, ...ordinary } = transaction;
        return ordinary;
      }
      if (transaction.source?.kind !== 'liability-payment' || transaction.source.parentId !== id) return transaction;
      const { source: _source, ...ordinary } = transaction;
      return ordinary;
    });
  return {
    ...data,
    liabilities: data.liabilities.filter((entry) => entry.id !== id),
    transactions,
  };
}

export function closeRecurringLiability(
  data: AppData,
  liabilityId: string,
  input: CloseLiabilityInput,
  options: { today: string; newId: () => string },
): AppData {
  const liability = getLiability(data, liabilityId);
  if (liability.kind !== 'recurring') throw new Error('Only recurring liabilities can be closed early.');
  if (liability.closure) throw new Error('This liability is already closed.');
  if (!isValidISO(input.date) || input.date > options.today) {
    throw new RangeError('Closure date must be valid and cannot be in the future.');
  }
  const firstPaymentDate = addMonths(liability.startDate, 1);
  if (input.date < firstPaymentDate) {
    throw new RangeError('Closure date cannot be before the first payment.');
  }
  if (!Number.isFinite(input.amountPaid) || input.amountPaid <= 0 || input.amountPaid > 100_000_000_000) {
    throw new RangeError('Amount paid must be greater than zero and within the supported range.');
  }
  if (input.note !== undefined && input.note.length > 200) {
    throw new RangeError('Closure note must be 200 characters or fewer.');
  }

  const outstanding = loanState(liability, input.date).balance;
  if (outstanding < 1) throw new Error('This liability is already cleared.');
  if (input.amountPaid < outstanding && !input.writeOffConfirmed) {
    throw new Error('Confirm that the lender closed the loan for less before writing off the difference.');
  }

  const paymentId = options.newId();
  const paymentAmount = Math.min(input.amountPaid, outstanding);
  const enteredNote = input.note?.trim() ?? '';
  const note = enteredNote || (input.amountPaid < outstanding ? 'Lender closed the loan for less' : '');
  const payment: LiabilityPayment = {
    id: paymentId,
    date: input.date,
    amount: paymentAmount,
    kind: 'Prepayment',
    note: note || 'Loan closure payment',
  };
  const paymentTransaction: Transaction = {
    id: options.newId(),
    type: 'expense',
    amount: paymentAmount,
    date: input.date,
    category: 'EMI',
    note: `${liability.name} loan closure payment`,
    source: { kind: 'liability-payment', parentId: liability.id, entryId: paymentId },
  };
  const transactions = [...data.transactions, paymentTransaction];
  const excess = input.amountPaid - outstanding;
  let chargeTransactionId: string | undefined;
  if (excess > 0) {
    chargeTransactionId = options.newId();
    transactions.push({
      id: chargeTransactionId,
      type: 'expense',
      amount: excess,
      date: input.date,
      category: 'Other',
      note: 'Loan closure charges',
      source: { kind: 'liability-closure-charge', parentId: liability.id, entryId: chargeTransactionId },
    });
  }

  const closure: LiabilityClosure = {
    date: input.date,
    paymentId,
    note,
    ...(chargeTransactionId === undefined ? {} : { chargeTransactionId }),
  };
  const updated: RecurringLiability = {
    ...liability,
    payments: [...liability.payments, payment],
    settlement: { asOf: input.date, balance: 0 },
    closure,
  };
  return {
    ...data,
    liabilities: data.liabilities.map((entry) => entry.id === liabilityId ? updated : entry),
    transactions,
  };
}

function assertPaymentFits(
  liability: Liability,
  payments: LiabilityPayment[],
  payment: Pick<LiabilityPayment, 'id' | 'date' | 'amount'>,
): void {
  if (liability.kind !== 'one-time') return;
  const outstanding = loanState({ ...liability, payments }, payment.date).balance;
  if (payment.amount > outstanding) {
    throw new Error(`Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`);
  }
}

export function addLiabilityPayment(
  data: AppData,
  liabilityId: string,
  input: Pick<LiabilityPayment, 'date' | 'amount' | 'kind' | 'note'>,
  options: { newId: () => string },
): AppData {
  const liability = getLiability(data, liabilityId);
  if (liability.kind === 'recurring' && liability.closure) {
    throw new Error('Payments cannot be added to a closed liability.');
  }
  if (liability.kind === 'one-time' && input.kind !== 'Payment') {
    throw new Error('One-time liabilities use Payment entries');
  }
  const payment: LiabilityPayment = { ...input, id: options.newId() };
  assertPaymentFits(liability, liability.payments, payment);
  const updated: Liability = { ...liability, payments: [...liability.payments, payment] };
  const transaction: Transaction = {
    id: options.newId(),
    type: 'expense',
    amount: payment.amount,
    date: payment.date,
    category: paymentCategory(liability, payment),
    note: transactionNote(liability.name, payment.kind),
    source: { kind: 'liability-payment', parentId: liabilityId, entryId: payment.id },
  };
  return {
    ...data,
    liabilities: data.liabilities.map((entry) => entry.id === liabilityId ? updated : entry),
    transactions: [...data.transactions, transaction],
  };
}

export function updateLiabilityPayment(
  data: AppData,
  liabilityId: string,
  paymentId: string,
  patch: LiabilityPaymentPatch,
): AppData {
  const liability = getLiability(data, liabilityId);
  if (liability.kind === 'recurring' && liability.closure) {
    throw new Error('Payments cannot be edited on a closed liability.');
  }
  const currentPayment = liability.payments.find((payment) => payment.id === paymentId);
  if (!currentPayment) throw new NotFoundError('Liability payment', paymentId);
  const payments = liability.payments.map((payment) => payment.id === paymentId ? { ...payment, ...patch } : payment);
  const updatedPayment = payments.find((entry) => entry.id === paymentId)!;
  if (liability.kind === 'one-time' && updatedPayment.kind !== 'Payment') {
    throw new Error('One-time liabilities use Payment entries');
  }
  assertPaymentFits(liability, payments.filter((payment) => payment.id !== paymentId), updatedPayment);
  const updatedLiability: Liability = { ...liability, payments };
  const linked = findLinkedTransaction(data, 'liability-payment', paymentId);
  const updateLinked = Boolean(linked && (
    patch.amount !== undefined || patch.date !== undefined || patch.kind !== undefined
  ));
  const updatedTransaction = linked && updateLinked ? {
    ...linked,
    ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.kind !== undefined ? {
      note: transactionNote(liability.name, updatedPayment.kind),
      category: paymentCategory(updatedLiability, updatedPayment),
    } : {}),
  } : linked;
  return {
    ...data,
    liabilities: data.liabilities.map((entry) => entry.id === liabilityId ? updatedLiability : entry),
    transactions: updatedTransaction
      ? data.transactions.map((transaction) => transaction.id === linked?.id ? updatedTransaction : transaction)
      : data.transactions,
  };
}

export function deleteLiabilityPayment(data: AppData, liabilityId: string, paymentId: string): AppData {
  const liability = getLiability(data, liabilityId);
  if (liability.kind === 'recurring' && liability.closure) {
    throw new Error('Payments cannot be deleted from a closed liability.');
  }
  if (!liability.payments.some((payment) => payment.id === paymentId)) {
    throw new NotFoundError('Liability payment', paymentId);
  }
  return {
    ...data,
    liabilities: data.liabilities.map((entry) => entry.id === liabilityId
      ? { ...entry, payments: entry.payments.filter((payment) => payment.id !== paymentId) }
      : entry),
    transactions: data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'liability-payment' &&
        transaction.source.parentId === liabilityId && transaction.source.entryId === paymentId),
    ),
  };
}
