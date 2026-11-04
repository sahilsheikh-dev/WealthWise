import type { Frequency, HoldingType, ISODate } from './types';

export const LEDGER_ENTRY_KINDS = ['deposit', 'withdrawal', 'valueUpdate'] as const;
export type LedgerEntryKind = (typeof LEDGER_ENTRY_KINDS)[number];

export const VALUATION_METHODS = [
  'balance',
  'balanceInterest',
  'accrual',
  'manual',
  'unitsPrice',
] as const;
export type ValuationMethod = (typeof VALUATION_METHODS)[number];

export const COMPOUNDING_FREQUENCIES = [
  'monthly',
  'quarterly',
  'halfYearly',
  'yearly',
  'simple',
] as const;
export type CompoundingFrequency = (typeof COMPOUNDING_FREQUENCIES)[number];

export type HoldingLedgerEntry = {
  id: string;
  date: ISODate;
  kind: LedgerEntryKind;
  amount: number;
  note: string;
  slotDate?: ISODate;
  price?: number;
  units?: number;
};

export type RecurringPlan = {
  frequency: Frequency;
  amount: number;
  start: ISODate;
  end?: ISODate;
  trackFrom?: ISODate;
  stepUpPct?: number;
};

export type LedgerHolding = {
  id: string;
  name: string;
  type: HoldingType;
  entries: HoldingLedgerEntry[];
  valuationMethod: ValuationMethod;
  rate?: number;
  compounding?: CompoundingFrequency;
  maturityDate?: ISODate;
  recurring?: RecurringPlan;
};

export type LedgerSummary = {
  deposits: number;
  withdrawals: number;
  invested: number;
  costRecovered: boolean;
  value: number;
  gain: number;
};

export function defaultValuationMethod(type: HoldingType): ValuationMethod {
  switch (type) {
    case 'Cash':
      return 'balance';
    case 'Savings account':
      return 'balanceInterest';
    case 'Fixed deposit':
    case 'Recurring deposit':
    case 'EPFO / PF':
      return 'accrual';
    case 'Stocks / ETF':
    case 'Mutual fund / SIP':
    case 'Gold':
    case 'Silver':
      return 'unitsPrice';
    case 'Other':
      return 'manual';
  }
}

export function ledgerSummary(holding: LedgerHolding, asOf: ISODate): LedgerSummary {
  const entries = holding.entries.filter((entry) => entry.date <= asOf);
  const deposits = entries
    .filter((entry) => entry.kind === 'deposit')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const withdrawals = entries
    .filter((entry) => entry.kind === 'withdrawal')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const adjustments = entries
    .filter((entry) => entry.kind === 'valueUpdate')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const rawInvested = deposits - withdrawals;
  const value = Math.max(0, rawInvested + adjustments);
  return {
    deposits,
    withdrawals,
    invested: Math.max(0, rawInvested),
    costRecovered: rawInvested < 0,
    value,
    gain: value + withdrawals - deposits,
  };
}

export function ledgerValue(holding: LedgerHolding, asOf: ISODate): number {
  return ledgerSummary(holding, asOf).value;
}
