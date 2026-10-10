import { NotFoundError } from './actions';
import { findLinkedTransaction, investCategoryFor } from './links';
import type { AppData, LogEntry, PlanHolding, Transaction } from './types';

export type AddPlanInput = Omit<PlanHolding, 'id' | 'kind' | 'logs'>;
export type PlanPatch = Partial<AddPlanInput>;
export type PlanLogPatch = Partial<Pick<LogEntry, 'date' | 'amount' | 'note'>>;

function getPlan(data: AppData, id: string): PlanHolding {
  const plan = data.holdings.find((holding) => holding.id === id);
  if (!plan || plan.kind !== 'plan') throw new NotFoundError('Plan', id);
  return plan;
}

function assertPlanInvariants(plan: Pick<PlanHolding, 'startDate' | 'trackFrom' | 'actualValue' | 'actualValueDate'>) {
  if (plan.trackFrom < plan.startDate) throw new Error("Tracking can't start before the plan");
  if ((plan.actualValue === null) !== (plan.actualValueDate === null)) {
    throw new Error('Actual value and snapshot date must both be set or both be null');
  }
}

export function addPlan(data: AppData, input: AddPlanInput, newId: () => string): AppData {
  const plan: PlanHolding = { ...input, id: newId(), kind: 'plan', logs: [] };
  assertPlanInvariants(plan);
  return { ...data, holdings: [...data.holdings, plan] };
}

export function updatePlan(data: AppData, id: string, patch: PlanPatch): AppData {
  const current = getPlan(data, id);
  const updated = { ...current, ...patch };
  assertPlanInvariants(updated);
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === id ? updated : holding),
  };
}

export function deletePlan(
  data: AppData,
  id: string,
  options: { linkedTransactions: 'delete' | 'keep' },
): AppData {
  const plan = getPlan(data, id);
  const entryIds = new Set(plan.logs.map(({ id: entryId }) => entryId));
  const transactions = options.linkedTransactions === 'delete'
    ? data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'plan-log' && transaction.source.parentId === id && entryIds.has(transaction.source.entryId)),
    )
    : data.transactions.map((transaction) => {
      if (transaction.source?.kind !== 'plan-log' || transaction.source.parentId !== id) return transaction;
      const { source: _source, ...ordinary } = transaction;
      return ordinary;
    });
  return {
    ...data,
    holdings: data.holdings.filter((holding) => holding.id !== id),
    transactions,
  };
}

export function addPlanLog(
  data: AppData,
  planId: string,
  input: Pick<LogEntry, 'date' | 'amount' | 'note'>,
  options: { recordTransaction: boolean; newId: () => string },
): AppData {
  const plan = getPlan(data, planId);
  const log: LogEntry = { ...input, id: options.newId() };
  const updated: PlanHolding = { ...plan, logs: [...plan.logs, log] };
  const transaction: Transaction | null = options.recordTransaction ? {
    id: options.newId(),
    type: 'invest',
    amount: log.amount,
    date: log.date,
    category: investCategoryFor(plan.type),
    note: `${plan.name} installment`,
    source: { kind: 'plan-log', parentId: planId, entryId: log.id },
  } : null;
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === planId ? updated : holding),
    transactions: transaction ? [...data.transactions, transaction] : data.transactions,
  };
}

export function updatePlanLog(data: AppData, planId: string, logId: string, patch: PlanLogPatch): AppData {
  const plan = getPlan(data, planId);
  if (!plan.logs.some((log) => log.id === logId)) throw new NotFoundError('Plan log', logId);
  const logs = plan.logs.map((log) => log.id === logId ? { ...log, ...patch } : log);
  const updatedPlan = { ...plan, logs };
  const linked = findLinkedTransaction(data, 'plan-log', logId);
  const updatedTransaction = linked && (patch.amount !== undefined || patch.date !== undefined)
    ? { ...linked, ...(patch.amount !== undefined ? { amount: patch.amount } : {}), ...(patch.date !== undefined ? { date: patch.date } : {}) }
    : linked;
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === planId ? updatedPlan : holding),
    transactions: updatedTransaction
      ? data.transactions.map((transaction) => transaction.id === linked?.id ? updatedTransaction : transaction)
      : data.transactions,
  };
}

export function deletePlanLog(data: AppData, planId: string, logId: string): AppData {
  const plan = getPlan(data, planId);
  if (!plan.logs.some((log) => log.id === logId)) throw new NotFoundError('Plan log', logId);
  return {
    ...data,
    holdings: data.holdings.map((holding) =>
      holding.id === planId && holding.kind === 'plan'
        ? { ...holding, logs: holding.logs.filter((log) => log.id !== logId) }
        : holding,
    ),
    transactions: data.transactions.filter((transaction) =>
      !(transaction.source?.kind === 'plan-log' && transaction.source.parentId === planId && transaction.source.entryId === logId),
    ),
  };
}
