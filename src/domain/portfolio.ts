import { PERIODS_PER_YEAR, planInvested, planValue } from './sip';
import { investmentReturnSummary, type InvestmentReturnSummary } from './investmentReturns';
import type { AppData, Holding, HoldingType, ISODate } from './types';

export type PortfolioRow = {
  id: string;
  kind: 'manual' | 'plan';
  name: string;
  type: HoldingType;
  invested: number;
  value: number;
  gain: number;
  gainPct: number | null;
  holding?: Holding;
  returnSummary?: InvestmentReturnSummary;
};

export function holdingInvested(holding: Holding): number {
  if (holding.kind === 'plan') return planInvested(holding);
  return Math.max(0, holding.invested + holding.logs.reduce((total, entry) =>
    total + (entry.kind === 'Deposit' ? entry.amount : -entry.amount), 0));
}

export function holdingValue(holding: Holding, asOf: ISODate): number {
  if (holding.kind === 'plan') return planValue(holding, asOf);
  const valueAsOf = holding.valueAsOf;
  const entriesAfterValue = holding.logs
    .filter((entry) => !valueAsOf || entry.date > valueAsOf)
    .reduce((total, entry) => total + (entry.kind === 'Deposit' ? entry.amount : -entry.amount), 0);
  return Math.max(0, holding.value + entriesAfterValue);
}

function row(
  id: string,
  kind: PortfolioRow['kind'],
  name: string,
  type: PortfolioRow['type'],
  invested: number,
  value: number,
  asOf: ISODate,
  holding?: Holding,
): PortfolioRow {
  const returnSummary = holding
    ? investmentReturnSummary(
      holding.kind === 'manual'
        ? holding.logs
        : [
          {
            id: `${holding.id}-opening`,
            date: holding.trackFrom,
            amount: Math.max(0, holding.opening),
            note: '',
            kind: 'Deposit',
          },
          ...holding.logs,
        ],
      value,
      asOf,
    )
    : investmentReturnSummary([], value, asOf);
  return {
    id,
    kind,
    name,
    type,
    invested,
    value,
    gain: returnSummary.gain,
    gainPct: returnSummary.absoluteReturnPct,
    returnSummary,
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
      asOf,
      holding,
    ),
  );
  return holdings;
}

export function filterRows(
  rows: PortfolioRow[],
  chip: 'All' | 'Recurring' | HoldingType,
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
  const gain = rows.reduce((sum, item) => sum + (item.returnSummary?.gain ?? item.gain), 0);
  const contributions = rows.reduce((sum, item) =>
    sum + (item.returnSummary?.contributions ?? item.invested), 0);
  return { invested, value, gain, gainPct: contributions === 0 ? null : gain / contributions * 100 };
}

export function monthlyCommitment(holdings: Holding[]): number {
  return holdings.reduce((sum, holding) => holding.kind === 'plan'
    ? sum + holding.amount * PERIODS_PER_YEAR[holding.frequency] / 12
    : sum, 0);
}
