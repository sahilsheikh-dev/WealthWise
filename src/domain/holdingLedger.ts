import type {
  HoldingLedgerEntry,
  LedgerHolding,
  ISODate,
  InvestmentEntry,
  ValuationMethod,
  HoldingType,
} from './types';

export type {
  CompoundingFrequency,
  HoldingLedgerEntry,
  LedgerHolding,
  LedgerEntryKind,
  RecurringPlan,
  ValuationMethod,
} from './types';
export {
  COMPOUNDING_FREQUENCIES,
  LEDGER_ENTRY_KINDS,
  VALUATION_METHODS,
} from './types';

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

export function legacyEntryToLedgerEntry(
  entry: InvestmentEntry,
  slotDate?: ISODate,
): HoldingLedgerEntry {
  return {
    id: entry.id,
    date: entry.date,
    kind: entry.kind === 'Deposit' ? 'deposit' : 'withdrawal',
    amount: entry.amount,
    note: entry.note,
    ...(slotDate === undefined ? {} : { slotDate }),
  };
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
  const value = rawInvested + adjustments;
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
