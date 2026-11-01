import { daysBetween } from './dates';
import type { InvestmentEntry, ISODate } from './types';

export type ReturnCashFlow = { date: ISODate; amount: number };

export type InvestmentReturnSummary = {
  contributions: number;
  withdrawals: number;
  gain: number;
  absoluteReturnPct: number | null;
  xirr: number | null;
  cagr: number | null;
  annualizedLabel: 'XIRR' | 'CAGR' | null;
  spanDays: number;
};

export function absoluteGainAndReturn(
  entries: readonly InvestmentEntry[],
  currentValue: number,
  valuationDate: ISODate,
): Pick<InvestmentReturnSummary, 'contributions' | 'withdrawals' | 'gain' | 'absoluteReturnPct'> {
  const merged = new Map<ISODate, number>();
  let contributions = 0;
  let withdrawals = 0;
  for (const entry of entries) {
    if (entry.amount === 0) continue;
    if (entry.kind === 'Deposit') contributions += entry.amount;
    else withdrawals += entry.amount;
    const signed = entry.kind === 'Deposit' ? -entry.amount : entry.amount;
    merged.set(entry.date, (merged.get(entry.date) ?? 0) + signed);
  }
  void merged;
  void valuationDate;
  const gain = currentValue + withdrawals - contributions;
  return {
    contributions,
    withdrawals,
    gain,
    absoluteReturnPct: contributions === 0 ? null : gain / contributions * 100,
  };
}

function mergedCashFlows(cashFlows: readonly ReturnCashFlow[]): ReturnCashFlow[] {
  const merged = new Map<ISODate, number>();
  for (const flow of cashFlows) {
    if (flow.amount === 0) continue;
    merged.set(flow.date, (merged.get(flow.date) ?? 0) + flow.amount);
  }
  return [...merged.entries()]
    .map(([date, amount]) => ({ date, amount }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function calculateXirr(cashFlows: readonly ReturnCashFlow[]): number | null {
  const flows = mergedCashFlows(cashFlows);
  if (flows.length < 2) return null;
  let hasNegative = false;
  let hasPositive = false;
  for (const flow of flows) {
    if (flow.amount < 0) hasNegative = true;
    if (flow.amount > 0) hasPositive = true;
  }
  if (!hasNegative || !hasPositive) return null;
  const firstDate = flows[0].date;

  const cashFlowExponent = (date: ISODate): number => {
    const dayOffset = daysBetween(firstDate, date);
    const first = firstDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const current = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (first && current && first[2] === current[2] && first[3] === current[3]) {
      const yearDifference = Number(current[1]) - Number(first[1]);
      if (yearDifference >= 0) return yearDifference;
    }
    return dayOffset / 365;
  };

  const npv = (rate: number): number => flows.reduce((total, flow) =>
    total + flow.amount / (1 + rate) ** cashFlowExponent(flow.date), 0);

  let low = -0.999999;
  let high = 1;
  while (npv(low) * npv(high) > 0 && high < 10_000) high = (high + 1) * 2;
  if (npv(low) * npv(high) > 0) return null;

  for (let iteration = 0; iteration < 300; iteration += 1) {
    const middle = (low + high) / 2;
    const value = npv(middle);
    if (Math.abs(value) < 1e-9) return middle;
    if (npv(low) * value <= 0) high = middle;
    else low = middle;
    if (Math.abs(high - low) < 1e-12) break;
  }
  const result = (low + high) / 2;
  return Number.isFinite(result) ? result : null;
}

export function calculateCagr(
  contributions: number,
  currentValue: number,
  spanDays: number,
): number | null {
  if (contributions <= 0 || currentValue < 0 || spanDays <= 0) return null;
  const ratio = currentValue / contributions;
  if (ratio <= 0 || !Number.isFinite(ratio)) return null;
  return ratio ** (365 / spanDays) - 1;
}

export function investmentReturnSummary(
  entries: readonly InvestmentEntry[],
  currentValue: number,
  valuationDate: ISODate,
): InvestmentReturnSummary {
  const absolute = absoluteGainAndReturn(entries, currentValue, valuationDate);
  const datedFlows = entries
    .filter((entry) => entry.amount !== 0)
    .map((entry) => ({
      date: entry.date,
      amount: entry.kind === 'Deposit' ? -entry.amount : entry.amount,
    }));
  datedFlows.push({ date: valuationDate, amount: currentValue });
  const mergedFlows = mergedCashFlows(datedFlows);
  const firstDate = mergedFlows.find((flow) => flow.amount !== 0)?.date ?? valuationDate;
  const spanDays = daysBetween(firstDate, valuationDate);
  const nonZeroEntries = entries.filter((entry) => entry.amount !== 0);
  const deposits = nonZeroEntries.filter((entry) => entry.kind === 'Deposit');
  let annualizedLabel: 'XIRR' | 'CAGR' | null = null;
  let xirr: number | null = null;
  let cagr: number | null = null;
  if (spanDays >= 365) {
    if (deposits.length === 1 && nonZeroEntries.length === 1) {
      annualizedLabel = 'CAGR';
      cagr = calculateCagr(absolute.contributions, currentValue, spanDays);
    } else if (nonZeroEntries.length > 1) {
      annualizedLabel = 'XIRR';
      xirr = calculateXirr(datedFlows);
    }
  }
  return {
    ...absolute,
    xirr,
    cagr,
    annualizedLabel,
    spanDays,
  };
}
