import { NotFoundError } from './actions';
import { holdingCapabilities } from './holdingCapabilities';
import { syncHoldingTransactions } from './investmentActions';
import type { AppData, PlanHolding } from './types';

export type AddPlanInput = Omit<PlanHolding, 'id' | 'kind' | 'logs'>;
export type PlanPatch = Partial<AddPlanInput>;
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
  if (!holdingCapabilities(input.type).recurring) {
    throw new Error(`${input.type} does not support a recurring deposit schedule.`);
  }
  const plan: PlanHolding = { ...input, id: newId(), kind: 'plan', logs: [] };
  assertPlanInvariants(plan);
  return { ...data, holdings: [...data.holdings, plan] };
}

export function updatePlan(data: AppData, id: string, patch: PlanPatch): AppData {
  const current = getPlan(data, id);
  const updated = { ...current, ...patch };
  if (!holdingCapabilities(updated.type).recurring) {
    throw new Error(`${updated.type} does not support a recurring deposit schedule.`);
  }
  assertPlanInvariants(updated);
  const transactions = syncHoldingTransactions(data.transactions, current, updated);
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === id ? updated : holding),
    transactions,
  };
}

export function stopPlan(data: AppData, id: string, stopDate: string, today: string): AppData {
  const current = getPlan(data, id);
  if (stopDate > today) throw new Error('Stop date cannot be in the future');
  const lastPaidDate = current.logs
    .filter((entry) => entry.kind === 'Deposit')
    .reduce((latest: string | null, entry) => !latest || entry.date > latest ? entry.date : latest, null);
  if (lastPaidDate && stopDate < lastPaidDate) {
    throw new Error('Stop date cannot be before the last paid entry');
  }
  return updatePlan(data, id, { stopDate });
}

export function resumePlan(data: AppData, id: string): AppData {
  const current = getPlan(data, id);
  const updated = { ...current };
  delete updated.stopDate;
  assertPlanInvariants(updated);
  const transactions = syncHoldingTransactions(data.transactions, current, updated);
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === id ? updated : holding),
    transactions,
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
      !(transaction.source?.kind === 'holding-entry' && transaction.source.parentId === id && entryIds.has(transaction.source.entryId)),
    )
    : data.transactions.map((transaction) => {
      if (transaction.source?.kind !== 'holding-entry' || transaction.source.parentId !== id) return transaction;
      const { source: _source, ...ordinary } = transaction;
      return ordinary;
    });
  return {
    ...data,
    holdings: data.holdings.filter((holding) => holding.id !== id),
    goals: data.goals.map((goal) => ({
      ...goal,
      links: goal.links.filter((link) => link.instrumentId !== id),
    })),
    efBucketLinks: Object.fromEntries(
      Object.entries(data.efBucketLinks).map(([bucketId, holdingIds]) => [
        bucketId,
        holdingIds.filter((holdingId) => holdingId !== id),
      ]),
    ),
    transactions,
  };
}
