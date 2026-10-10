import { NotFoundError } from './actions';
import { daysBetween } from './dates';
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
  return { ...data, holdings: data.holdings.map((holding) => holding.id === id ? { ...current, ...patch } : holding) };
}

export function deleteHolding(data: AppData, id: string): AppData {
  const current = data.holdings.find((holding) => holding.id === id);
  if (!current || current.kind !== 'manual') throw new NotFoundError('Manual holding', id);
  return { ...data, holdings: data.holdings.filter((holding) => holding.id !== id) };
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
