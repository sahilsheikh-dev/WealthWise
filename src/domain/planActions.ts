import { NotFoundError } from './actions';
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
  const plan: PlanHolding = { ...input, id: newId(), kind: 'plan', logs: [] };
  assertPlanInvariants(plan);
  return { ...data, holdings: [...data.holdings, plan] };
}

export function updatePlan(data: AppData, id: string, patch: PlanPatch): AppData {
  const current = getPlan(data, id);
  const updated = { ...current, ...patch };
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
    transactions,
  };
}
