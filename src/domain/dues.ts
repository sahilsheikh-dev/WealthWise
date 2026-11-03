import { addDays, isValidISO } from './dates';
import { NotFoundError } from './actions';
import { addLiability, addLiabilityPayment, deleteLiabilityPayment } from './liabilityActions';
import { addInvestmentEntry, deleteInvestmentEntry } from './investmentActions';
import { addPlan, type AddPlanInput } from './planActions';
import { amortizedBalanceAfter, loanState } from './liability';
import { liabilitySchedule, planSchedule, type ScheduleRow } from './schedule';
import { policySchedule } from './policySchedule';
import { policyPremiumCategory } from './policyCategories';
import type {
  AppData,
  Liability,
  PlanHolding,
  Policy,
  PolicyPayment,
  RecurringLiability,
  Transaction,
} from './types';
import type { AddLiabilityInput } from './liabilityActions';

export type DueTarget =
  | { kind: 'plan'; id: string }
  | { kind: 'liability'; id: string }
  | { kind: 'policy'; id: string };

export type DueMonth = { month: string; amount: number };

export type PendingDues = {
  rows: ScheduleRow[];
  count: number;
  amount: number;
  months: DueMonth[];
};

export class NothingToClearError extends Error {
  constructor() {
    super('There are no pending dues to clear.');
    this.name = 'NothingToClearError';
  }
}

export class TooManyDuesError extends Error {
  constructor(count: number) {
    super(`${count} dues cannot be recorded at once. Choose “Already paid” to settle them instead.`);
    this.name = 'TooManyDuesError';
  }
}

function pendingRowsFor(data: AppData, target: DueTarget, asOf: string, rowId?: string): ScheduleRow[] {
  const unpaid = (rows: ScheduleRow[]) => {
    const pending = rows.filter((row) => row.status !== 'paid');
    if (rowId !== undefined) {
      const first = pending[0];
      return first?.id === rowId ? [first] : [];
    }
    return pending.filter((row) =>
      row.dueDate <= asOf && (row.status === 'overdue' || row.status === 'ongoing'));
  };
  if (target.kind === 'plan') {
    const holding = data.holdings.find((item) => item.id === target.id);
    if (!holding || holding.kind !== 'plan') throw new NotFoundError('Plan', target.id);
    return unpaid(planSchedule(holding, asOf).rows);
  }
  if (target.kind === 'liability') {
    const liability = data.liabilities.find((item) => item.id === target.id);
    if (!liability) throw new NotFoundError('Liability', target.id);
    if (liability.kind === 'one-time' && liability.dueDate === null) return [];
    return unpaid(liabilitySchedule(liability, asOf).rows);
  }
  const policy = data.policies.find((item) => item.id === target.id);
  if (!policy) throw new NotFoundError('Policy', target.id);
  return unpaid(policySchedule(policy, asOf).rows);
}

function unpaidRows(data: AppData, target: DueTarget, asOf: string): ScheduleRow[] {
  if (target.kind === 'plan') {
    const holding = data.holdings.find((item) => item.id === target.id);
    if (!holding || holding.kind !== 'plan') throw new NotFoundError('Plan', target.id);
    return planSchedule(holding, asOf).rows.filter((row) => row.status !== 'paid');
  }
  if (target.kind === 'liability') {
    const liability = data.liabilities.find((item) => item.id === target.id);
    if (!liability) throw new NotFoundError('Liability', target.id);
    if (liability.kind === 'one-time' && liability.dueDate === null) return [];
    return liabilitySchedule(liability, asOf).rows.filter((row) => row.status !== 'paid');
  }
  const policy = data.policies.find((item) => item.id === target.id);
  if (!policy) throw new NotFoundError('Policy', target.id);
  return policySchedule(policy, asOf).rows.filter((row) => row.status !== 'paid');
}

export function duesThroughPreview(
  data: AppData,
  target: DueTarget,
  dueDate: string,
  asOf: string,
): { count: number; amount: number } {
  const scheduled = unpaidRows(data, target, asOf);
  if (!scheduled.some((row) => row.dueDate === dueDate)) return { count: 0, amount: 0 };
  const rows = scheduled.filter((row) => row.dueDate <= dueDate);
  return {
    count: rows.length,
    amount: rows.reduce((sum, row) => sum + row.amount, 0),
  };
}

function summarizePending(rows: ScheduleRow[]): PendingDues {
  const byMonth = new Map<string, number>();
  for (const row of rows) {
    const month = row.dueDate.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + row.amount);
  }
  return {
    rows,
    count: rows.length,
    amount: rows.reduce((sum, row) => sum + row.amount, 0),
    months: [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount })),
  };
}

export function pendingDues(
  item: PlanHolding | RecurringLiability | Policy,
  asOf: string,
): PendingDues {
  if (item.kind === 'plan') {
    return summarizePending(planSchedule(item, asOf).rows.filter((row) =>
      row.dueDate <= asOf && (row.status === 'overdue' || row.status === 'ongoing')));
  }
  if (item.kind === 'recurring') {
    return summarizePending(liabilitySchedule(item, asOf).rows.filter((row) =>
      row.dueDate <= asOf && (row.status === 'overdue' || row.status === 'ongoing')));
  }
  return summarizePending(policySchedule(item, asOf).rows.filter((row) =>
    row.dueDate <= asOf && (row.status === 'overdue' || row.status === 'ongoing')));
}

function createPolicyPayment(
  data: AppData,
  policy: Policy,
  paymentInput: Omit<PolicyPayment, 'id'>,
  newId: () => string,
): { data: AppData; entryId: string } {
  const entryId = newId();
  const payment: PolicyPayment = { ...paymentInput, id: entryId };
  const transaction: Transaction = {
    id: newId(),
    type: 'expense',
    amount: payment.amount,
    category: policyPremiumCategory(policy.kind),
    note: payment.note || `${policy.name} premium`,
    date: payment.date,
    source: { kind: 'policy-payment', parentId: policy.id, entryId },
  };
  return {
    entryId,
    data: {
      ...data,
      policies: data.policies.map((item) => item.id === policy.id
        ? { ...item, payments: [...item.payments, payment] }
        : item),
      transactions: [...data.transactions, transaction],
    },
  };
}

export function addPolicyPayment(
  data: AppData,
  input: { policyId: string; payment: Omit<PolicyPayment, 'id'> },
  newId: () => string,
): { data: AppData; entryId: string } {
  const policy = data.policies.find((item) => item.id === input.policyId);
  if (!policy) throw new NotFoundError('Policy', input.policyId);
  if (!Number.isFinite(input.payment.amount) || input.payment.amount <= 0) {
    throw new RangeError('Policy payment amount must be greater than zero.');
  }
  if (!isValidISO(input.payment.date)) {
    throw new RangeError('Policy payment date must be a valid ISO date.');
  }
  return createPolicyPayment(data, policy, input.payment, newId);
}

export function clearDue(
  data: AppData,
  target: DueTarget,
  options: { date: string; newId: () => string; rowId?: string; actualAmount?: number },
): { data: AppData; entryId: string } {
  const [row] = pendingRowsFor(data, target, options.date, options.rowId);
  if (!row) throw new NothingToClearError();
  const actualAmount = options.actualAmount ?? row.amount;
  if (!Number.isFinite(actualAmount) || actualAmount <= 0 || actualAmount > 100_000_000_000) {
    throw new RangeError('Paid amount must be greater than zero and within the supported range.');
  }
  if (target.kind === 'plan') {
    let entryId: string | undefined;
    const result = addInvestmentEntry(data, target.id, {
      date: options.date,
      amount: actualAmount,
      note: '',
      kind: 'Deposit',
    }, () => {
      const id = options.newId();
      entryId ??= id;
      return id;
    }, options.date);
    if (!entryId) throw new Error('The investment entry was not created.');
    return {
      data: result,
      entryId,
    };
  }
  if (target.kind === 'liability') {
    const liability = data.liabilities.find((item) => item.id === target.id);
    if (!liability) throw new NotFoundError('Liability', target.id);
    const balance = loanState(liability, options.date).balance;
    const amount = liability.kind === 'one-time' ? actualAmount : actualAmount;
    if (actualAmount > balance && liability.kind === 'one-time') {
      throw new RangeError('Paid amount exceeds the outstanding liability balance.');
    }
    if (amount <= 0) throw new NothingToClearError();
    const before = liability.payments.map((payment) => payment.id);
    const result = addLiabilityPayment(data, target.id, {
      date: options.date,
      amount,
      note: '',
      kind: liability.kind === 'recurring' ? 'EMI' : 'Payment',
    }, options);
    const updated = result.liabilities.find((item) => item.id === target.id);
    const entry = updated?.payments.find((payment) => !before.includes(payment.id));
    if (!entry) throw new Error('The liability payment was not created.');
    return { data: result, entryId: entry.id };
  }
  const policy = data.policies.find((item) => item.id === target.id);
  if (!policy) throw new NotFoundError('Policy', target.id);
  return createPolicyPayment(data, policy, {
    date: options.date,
    amount: actualAmount,
    note: '',
  }, options.newId);
}

export function clearDuesThrough(
  data: AppData,
  target: DueTarget,
  dueDate: string,
  options: { date: string; newId: () => string; actualAmount?: number },
): { data: AppData; entryIds: string[] } {
  const scheduled = unpaidRows(data, target, options.date);
  if (!scheduled.some((row) => row.dueDate === dueDate)) throw new NothingToClearError();
  const rows = scheduled.filter((row) => row.dueDate <= dueDate);
  if (rows.length > 400) throw new TooManyDuesError(rows.length);

  let result = data;
  const entryIds: string[] = [];
  for (const row of rows) {
    const cleared = clearDue(result, target, {
      ...options,
      rowId: row.id,
      actualAmount: row.dueDate === dueDate ? options.actualAmount : undefined,
    });
    result = cleared.data;
    entryIds.push(cleared.entryId);
  }
  return { data: result, entryIds };
}

export function undoClearDue(data: AppData, target: DueTarget, entryId: string): AppData {
  if (target.kind === 'plan') return deleteInvestmentEntry(data, target.id, entryId);
  if (target.kind === 'liability') return deleteLiabilityPayment(data, target.id, entryId);
  const policy = data.policies.find((item) => item.id === target.id);
  if (!policy || !policy.payments.some((payment) => payment.id === entryId)) {
    throw new NotFoundError('Policy payment', entryId);
  }
  return {
    ...data,
    policies: data.policies.map((item) => item.id === target.id
      ? { ...item, payments: item.payments.filter((payment) => payment.id !== entryId) }
      : item),
    transactions: data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'policy-payment'
        && transaction.source.parentId === target.id
        && transaction.source.entryId === entryId)),
  };
}

export function undoClearDuesThrough(data: AppData, target: DueTarget, entryIds: string[]): AppData {
  let result = data;
  for (const entryId of [...entryIds].reverse()) {
    result = undoClearDue(result, target, entryId);
  }
  return result;
}

function nextTrackingDate(rows: ScheduleRow[], asOf: string): string {
  const next = rows.find((row) => row.dueDate > asOf);
  if (next) return next.dueDate;
  const final = rows[rows.length - 1];
  return addDays(final.dueDate, 1);
}

function recordPastDues(
  data: AppData,
  target: DueTarget,
  rows: ScheduleRow[],
  asOf: string,
  newId: () => string,
): AppData {
  let result = data;
  for (const row of rows) {
    if (target.kind === 'plan') {
      result = addInvestmentEntry(result, target.id, {
        date: row.dueDate,
        amount: row.amount,
        note: '',
        kind: 'Deposit',
      }, newId, asOf);
      continue;
    }
    if (target.kind === 'liability') {
      const liability = result.liabilities.find((item) => item.id === target.id);
      if (!liability || liability.kind !== 'recurring') throw new NotFoundError('Recurring liability', target.id);
      const amount = Math.min(row.amount, loanState(liability, row.dueDate).balance);
      if (amount > 0) {
        result = addLiabilityPayment(result, target.id, {
          date: row.dueDate,
          amount,
          note: '',
          kind: 'EMI',
        }, { newId });
      }
      continue;
    }
    const policy = result.policies.find((item) => item.id === target.id);
    if (!policy) throw new NotFoundError('Policy', target.id);
    result = createPolicyPayment(result, policy, {
      date: row.dueDate,
      amount: row.amount,
      note: '',
    }, newId).data;
  }
  return result;
}

export function clearPastDues(
  data: AppData,
  target: DueTarget,
  options: { mode: 'settle' | 'record'; balance?: number; addSkippedToOpening?: boolean },
  deps: { asOf: string; newId: () => string },
): { data: AppData; summary: Omit<PendingDues, 'rows'> } {
  const pending = summarizePending(pendingRowsFor(data, target, deps.asOf));
  if (pending.count === 0) throw new NothingToClearError();
  if (options.mode === 'record' && pending.count > 400) throw new TooManyDuesError(pending.count);

  let result = data;
  if (options.mode === 'record') {
    result = recordPastDues(data, target, pending.rows, deps.asOf, deps.newId);
  } else if (target.kind === 'plan') {
    const plan = data.holdings.find((item) => item.id === target.id);
    if (!plan || plan.kind !== 'plan') throw new NotFoundError('Plan', target.id);
    const allRows = planSchedule(plan, deps.asOf).rows;
    result = {
      ...data,
      holdings: data.holdings.map((item) => item.kind === 'plan' && item.id === plan.id
        ? {
          ...item,
          trackFrom: nextTrackingDate(allRows, deps.asOf),
          opening: item.opening + (options.addSkippedToOpening ? pending.amount : 0),
        }
        : item),
    };
  } else if (target.kind === 'liability') {
    const liability = data.liabilities.find((item) => item.id === target.id);
    if (!liability || liability.kind !== 'recurring') throw new NotFoundError('Recurring liability', target.id);
    const balance = options.balance ?? amortizedBalanceAfter(liability, deps.asOf);
    if (!Number.isFinite(balance) || balance < 0) throw new Error('Outstanding balance must be zero or more.');
    result = {
      ...data,
      liabilities: data.liabilities.map((item) => item.id === liability.id
        ? { ...item, settlement: { asOf: deps.asOf, balance } }
        : item),
    };
  } else {
    const policy = data.policies.find((item) => item.id === target.id);
    if (!policy) throw new NotFoundError('Policy', target.id);
    const allRows = policySchedule(policy, deps.asOf).rows;
    result = {
      ...data,
      policies: data.policies.map((item) => item.id === policy.id
        ? {
          ...item,
          trackFrom: nextTrackingDate(allRows, deps.asOf),
        }
        : item),
    };
  }
  return {
    data: result,
    summary: { count: pending.count, amount: pending.amount, months: pending.months },
  };
}

export type PastDuesMode = 'settle' | 'record';

export function addPlanWithHistory(
  data: AppData,
  input: AddPlanInput,
  options: { mode: PastDuesMode; asOf: string; newId: () => string; addSkippedToOpening?: boolean },
): { data: AppData; summary: Omit<PendingDues, 'rows'> } {
  const created = addPlan(data, input, options.newId);
  const plan = created.holdings.at(-1);
  if (!plan || plan.kind !== 'plan') throw new Error('The plan was not created.');
  return clearPastDues(created, { kind: 'plan', id: plan.id }, {
    mode: options.mode,
    addSkippedToOpening: options.addSkippedToOpening,
  }, options);
}

export function addLiabilityWithHistory(
  data: AppData,
  input: AddLiabilityInput,
  options: { mode: PastDuesMode; asOf: string; newId: () => string; balance?: number },
): { data: AppData; summary: Omit<PendingDues, 'rows'> } {
  const created = addLiability(data, input, options.newId);
  const liability: Liability | undefined = created.liabilities.at(-1);
  if (!liability || liability.kind !== 'recurring') throw new Error('A recurring liability was not created.');
  return clearPastDues(created, { kind: 'liability', id: liability.id }, {
    mode: options.mode,
    balance: options.balance,
  }, options);
}

export type AddPolicyInput = Omit<Policy, 'id' | 'payments'>;

export function addPolicyWithHistory(
  data: AppData,
  input: AddPolicyInput,
  options: { mode: PastDuesMode; asOf: string; newId: () => string },
): { data: AppData; summary: Omit<PendingDues, 'rows'> } {
  const policy: Policy = { ...input, id: options.newId(), payments: [] };
  const created = { ...data, policies: [...data.policies, policy] };
  return clearPastDues(created, { kind: 'policy', id: policy.id }, { mode: options.mode }, options);
}
