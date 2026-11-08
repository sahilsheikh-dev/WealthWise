import { PERIODS_PER_YEAR, planValue } from './sip';
import {
  investmentLedgerSummary,
  investmentReturnSummary,
  type InvestmentLedgerSummary,
  type InvestmentReturnSummary,
} from './investmentReturns';
import { holdingCapabilities } from './holdingCapabilities';
import type { AppData, Holding, HoldingType, ISODate } from './types';

export type PortfolioRow = {
  id: string;
  kind: 'manual' | 'plan';
  name: string;
  type: HoldingType;
  invested: number;
  value: number;
  gain: number;
  costRecovered: boolean;
  gainPct: number | null;
  holding?: Holding;
  returnSummary?: InvestmentReturnSummary;
};

export function isCashOrBankHoldingType(type: HoldingType): boolean {
  return !holdingCapabilities(type).returns;
}

export function holdingInvested(holding: Holding): number {
  return holdingLedgerSummary(holding).invested;
}

export function holdingLedgerSummary(holding: Holding): InvestmentLedgerSummary {
  const openingAmount = holding.kind === 'plan' ? holding.opening : holding.invested;
  return investmentLedgerSummary(holding.logs, openingAmount);
}

export function holdingContributions(holding: Holding): number {
  return holdingLedgerSummary(holding).contributions;
}

export function holdingValue(holding: Holding, asOf: ISODate): number {
  if (holding.kind === 'plan') return planValue(holding, asOf);
  const valuationDate = holding.valueAsOf;
  const baseValue = valuationDate ? holding.value : holding.invested;
  const applicableEntries = holding.logs
    .filter((entry) => entry.date <= asOf && (!valuationDate || entry.date > valuationDate))
    .reduce((total, entry) => total + (entry.kind === 'Deposit' ? entry.amount : -entry.amount), 0);
  return Math.max(0, baseValue + applicableEntries);
}

export function holdingFinancialSummary(holding: Holding, asOf: ISODate): {
  ledger: InvestmentLedgerSummary;
  invested: number;
  value: number;
  gain: number;
  returnSummary: InvestmentReturnSummary;
} {
  const ledger = holdingLedgerSummary(holding);
  const value = holdingValue(holding, asOf);
  const openingAmount = holding.kind === 'plan' ? holding.opening : holding.invested;
  const openingDate = holding.kind === 'plan' ? holding.startDate : asOf;
  const returnSummary = investmentReturnSummary(
    holding.logs,
    value,
    asOf,
    openingAmount,
    openingDate,
  );
  return {
    ledger,
    invested: ledger.invested,
    value,
    gain: returnSummary.gain,
    returnSummary,
  };
}

function row(
  id: string,
  kind: PortfolioRow['kind'],
  name: string,
  type: PortfolioRow['type'],
  invested: number,
  value: number,
  holding?: Holding,
  financial?: ReturnType<typeof holdingFinancialSummary>,
): PortfolioRow {
  return {
    id,
    kind,
    name,
    type,
    invested,
    value,
    gain: financial?.gain ?? 0,
    costRecovered: financial?.ledger.costRecovered ?? false,
    gainPct: holding && isCashOrBankHoldingType(type) ? null : financial?.returnSummary.absoluteReturnPct ?? null,
    returnSummary: financial?.returnSummary,
    ...(holding ? { holding } : {}),
  };
}

export function buildPortfolioRows(data: AppData, asOf: ISODate): PortfolioRow[] {
  return data.holdings.map((holding) => {
    const financial = holdingFinancialSummary(holding, asOf);
    return row(
      holding.id,
      holding.kind,
      holding.name,
      holding.type,
      financial.invested,
      financial.value,
      holding,
      financial,
    );
  });
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
    && holdingCapabilities(holding.type).recurring
    ? sum + holding.amount * PERIODS_PER_YEAR[holding.frequency] / 12
    : sum, 0);
}
