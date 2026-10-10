import { NotFoundError } from './actions';
import { daysBetween } from './dates';
import { deleteHoldingWithTransactions, syncHoldingTransactions } from './investmentActions';
import type { AppData, ISODate, ManualHolding } from './types';

export type AddHoldingInput = Omit<ManualHolding, 'id' | 'kind' | 'logs'>;
export type HoldingPatch = Partial<AddHoldingInput>;

export function addHolding(data: AppData, input: AddHoldingInput, newId: () => string): AppData {
  const holding: ManualHolding = { ...input, id: newId(), kind: 'manual', logs: [] };
  return { ...data, holdings: [...data.holdings, holding] };
}

export function updateHolding(data: AppData, id: string, patch: HoldingPatch): AppData {
  const current = data.holdings.find((holding) => holding.id === id);
  if (!current || current.kind !== 'manual') throw new NotFoundError('Manual holding', id);
  const updated = { ...current, ...patch };
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === id ? updated : holding),
    transactions: syncHoldingTransactions(data.transactions, current, updated),
  };
}

export function deleteHolding(
  data: AppData,
  id: string,
  options: { linkedTransactions: 'delete' | 'keep' } = { linkedTransactions: 'delete' },
): AppData {
  const current = data.holdings.find((holding) => holding.id === id);
  if (!current || current.kind !== 'manual') throw new NotFoundError('Manual holding', id);
  return deleteHoldingWithTransactions(data, id, options);
}

export function confirmHoldingValue(data: AppData, id: string, today: ISODate): AppData {
  const current = data.holdings.find((holding) => holding.id === id);
  if (!current || current.kind !== 'manual') throw new NotFoundError('Manual holding', id);
  return {
    ...data,
    holdings: data.holdings.map((holding) => holding.id === id ? { ...current, valueAsOf: today } : holding),
  };
}

export function valueStaleness(
  valueAsOf: ISODate | undefined,
  asOf: ISODate,
  thresholdDays = 90,
): { stale: boolean; days: number | null } {
  if (!valueAsOf) return { stale: true, days: null };
  const days = Math.max(0, daysBetween(valueAsOf, asOf));
  return { stale: days > thresholdDays, days };
}
