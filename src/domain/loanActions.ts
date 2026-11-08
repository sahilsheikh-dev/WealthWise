import { NotFoundError } from './actions';
import { findLinkedTransaction } from './links';
import { emiAuto } from './loan';
import type { AppData, Loan, LogEntry, Transaction } from './types';

export type AddLoanInput = Omit<Loan, 'id' | 'payments' | 'emi'> & { emi: number | null };
export type LoanPatch = Partial<Omit<AddLoanInput, 'emi'>> & { emi?: number | null };
export type LoanPaymentPatch = Partial<Pick<LogEntry, 'date' | 'amount' | 'note' | 'kind'>>;

function getLoan(data: AppData, id: string): Loan {
  const loan = data.loans.find((entry) => entry.id === id);
  if (!loan) throw new NotFoundError('Loan', id);
  return loan;
}

function transactionNote(loanName: string, kind: 'EMI' | 'Prepayment' | undefined): string {
  return `${loanName} ${kind === 'Prepayment' ? 'prepayment' : 'EMI'}`;
}

export function addLoan(data: AppData, input: AddLoanInput, newId: () => string): AppData {
  const { emi, ...rest } = input;
  const loan: Loan = { ...rest, id: newId(), emi: emi ?? emiAuto(input.principal, input.ratePct, input.tenureMonths), payments: [] };
  return { ...data, loans: [...data.loans, loan] };
}

export function updateLoan(data: AppData, id: string, patch: LoanPatch): AppData {
  const current = getLoan(data, id);
  const { emi, ...otherPatch } = patch;
  const base = { ...current, ...otherPatch };
  const updated: Loan = { ...base, emi: emi === null ? emiAuto(base.principal, base.ratePct, base.tenureMonths) : (emi ?? current.emi) };
  const transactions = data.transactions.map((transaction) => {
    if (transaction.source?.kind !== 'loan-payment' || transaction.source.parentId !== id) return transaction;
    const payment = current.payments.find((entry) => entry.id === transaction.source?.entryId);
    const expectedOldNote = payment?.kind === 'Prepayment' ? `${current.name} prepayment` : `${current.name} EMI`;
    if (patch.name === undefined || transaction.note !== expectedOldNote) return transaction;
    return { ...transaction, note: payment?.kind === 'Prepayment' ? `${updated.name} prepayment` : `${updated.name} EMI` };
  });
  return { ...data, loans: data.loans.map((loan) => loan.id === id ? updated : loan), transactions };
}

export function deleteLoan(
  data: AppData,
  id: string,
  options: { linkedTransactions: 'delete' | 'keep' },
): AppData {
  const loan = getLoan(data, id);
  const paymentIds = new Set(loan.payments.map(({ id: paymentId }) => paymentId));
  const transactions = options.linkedTransactions === 'delete'
    ? data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'loan-payment' && transaction.source.parentId === id && paymentIds.has(transaction.source.entryId)),
    )
    : data.transactions.map((transaction) => {
      if (transaction.source?.kind !== 'loan-payment' || transaction.source.parentId !== id) return transaction;
      const { source: _source, ...ordinary } = transaction;
      return ordinary;
    });
  return { ...data, loans: data.loans.filter((entry) => entry.id !== id), transactions };
}

export function addLoanPayment(
  data: AppData,
  loanId: string,
  input: Pick<LogEntry, 'date' | 'amount' | 'kind' | 'note'>,
  options: { recordTransaction: boolean; newId: () => string },
): AppData {
  const loan = getLoan(data, loanId);
  const payment: LogEntry = { ...input, id: options.newId() };
  const updated: Loan = { ...loan, payments: [...loan.payments, payment] };
  const transaction: Transaction | null = options.recordTransaction ? {
    id: options.newId(),
    type: 'expense',
    amount: payment.amount,
    date: payment.date,
    category: 'EMI',
    note: transactionNote(loan.name, payment.kind),
    source: { kind: 'loan-payment', parentId: loanId, entryId: payment.id },
  } : null;
  return {
    ...data,
    loans: data.loans.map((entry) => entry.id === loanId ? updated : entry),
    transactions: transaction ? [...data.transactions, transaction] : data.transactions,
  };
}

export function updateLoanPayment(data: AppData, loanId: string, paymentId: string, patch: LoanPaymentPatch): AppData {
  const loan = getLoan(data, loanId);
  if (!loan.payments.some((payment) => payment.id === paymentId)) throw new NotFoundError('Loan payment', paymentId);
  const payments = loan.payments.map((payment) => payment.id === paymentId ? { ...payment, ...patch } : payment);
  const updatedLoan = { ...loan, payments };
  const linked = findLinkedTransaction(data, 'loan-payment', paymentId);
  const updateLinked = Boolean(linked && (
    patch.amount !== undefined || patch.date !== undefined || patch.kind !== undefined
  ));
  const payment = payments.find((entry) => entry.id === paymentId)!;
  const updatedTransaction = linked && updateLinked ? {
    ...linked,
    ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
    ...(patch.date !== undefined ? { date: patch.date } : {}),
    ...(patch.kind !== undefined ? { note: transactionNote(loan.name, payment.kind) } : {}),
  } : linked;
  return {
    ...data,
    loans: data.loans.map((entry) => entry.id === loanId ? updatedLoan : entry),
    transactions: updatedTransaction
      ? data.transactions.map((transaction) => transaction.id === linked?.id ? updatedTransaction : transaction)
      : data.transactions,
  };
}

export function deleteLoanPayment(data: AppData, loanId: string, paymentId: string): AppData {
  const loan = getLoan(data, loanId);
  if (!loan.payments.some((payment) => payment.id === paymentId)) throw new NotFoundError('Loan payment', paymentId);
  return {
    ...data,
    loans: data.loans.map((entry) => entry.id === loanId
      ? { ...entry, payments: entry.payments.filter((payment) => payment.id !== paymentId) }
      : entry),
    transactions: data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'loan-payment' && transaction.source.parentId === loanId && transaction.source.entryId === paymentId),
    ),
  };
}
