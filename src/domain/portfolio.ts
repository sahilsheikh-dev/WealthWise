import { efBalance } from './ef';
import { PERIODS_PER_YEAR, planInvested, planValue } from './sip';
import type { AppData, Holding, HoldingType, ISODate } from './types';

export type PortfolioRow = {
  id: string;
  kind: 'manual' | 'plan' | 'auto-ef';
  name: string;
  type: HoldingType | 'Emergency fund';
  invested: number;
  value: number;
  gain: number;
  gainPct: number | null;
  holding?: Holding;
};

export function holdingInvested(holding: Holding): number {
  return holding.kind === 'plan' ? planInvested(holding) : holding.invested;
}

export function holdingValue(holding: Holding, asOf: ISODate): number {
  if (holding.kind === 'plan') return planValue(holding, asOf);
  const cutoff = holding.valueAsOf;
  return Math.max(0, holding.value + (holding.logs ?? []).filter((entry) => !cutoff || entry.date > cutoff).reduce((sum, entry) => sum + (entry.kind === 'Withdrawal' ? -entry.amount : entry.amount), 0));
}

function row(
  id: string,
  kind: PortfolioRow['kind'],
  name: string,
  type: PortfolioRow['type'],
  invested: number,
  value: number,
  holding?: Holding,
): PortfolioRow {
  return {
    id,
    kind,
    name,
    type,
    invested,
    value,
    gain: value - invested,
    gainPct: invested === 0 ? null : (value - invested) / invested * 100,
    ...(holding ? { holding } : {}),
  };
}

export function buildPortfolioRows(data: AppData, asOf: ISODate): PortfolioRow[] {
  const holdings = data.holdings.map((holding) =>
    row(
      holding.id,
      holding.kind,
      holding.name,
      holding.type,
      holdingInvested(holding),
      holdingValue(holding, asOf),
      holding,
    ),
  );
  const emergencyBalance = efBalance(data.efEntries);
  return [
    ...holdings,
    row('auto-ef', 'auto-ef', 'Emergency fund', 'Emergency fund', emergencyBalance, emergencyBalance),
  ];
}

export function filterRows(
  rows: PortfolioRow[],
  chip: 'All' | 'Recurring' | HoldingType | 'Emergency fund',
): PortfolioRow[] {
  if (chip === 'All') return [...rows];
  if (chip === 'Recurring') return rows.filter((item) => item.kind === 'plan');
  return rows.filter((item) => item.type === chip);
}

export function portfolioTotals(rows: PortfolioRow[]): {
  invested: number;
  value: number;
  gain: number;
  gainPct: number | null;
} {
  const invested = rows.reduce((sum, item) => sum + item.invested, 0);
  const value = rows.reduce((sum, item) => sum + item.value, 0);
  const gain = value - invested;
  return { invested, value, gain, gainPct: invested === 0 ? null : gain / invested * 100 };
}

export function monthlyCommitment(holdings: Holding[]): number {
  return holdings.reduce((sum, holding) => holding.kind === 'plan'
    ? sum + holding.amount * PERIODS_PER_YEAR[holding.frequency] / 12
    : sum, 0);
}
