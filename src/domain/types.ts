export type ISODate = string;

export type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'invest';
  amount: number;
  category: string;
  note: string;
  date: ISODate;
  source?: { kind: 'holding-entry' | 'liability-payment' | 'ef-entry'; parentId: string; entryId: string };
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  year: number;
  auto?: 'ef';
};

export type InvestmentEntry = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
  kind: 'Deposit' | 'Withdrawal';
};

export type LiabilityPayment = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
  kind: 'EMI' | 'Prepayment' | 'Payment';
};

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const LIABILITY_TYPES = [
  'Home loan',
  'Car loan',
  'Personal loan',
  'Education loan',
  'Credit card',
  'Borrowed money',
  'Other',
] as const;

export type LiabilityType = (typeof LIABILITY_TYPES)[number];

export type HoldingType =
  | 'Mutual fund / SIP'
  | 'Stocks / ETF'
  | 'Fixed deposit'
  | 'Recurring deposit'
  | 'EPFO / PF'
  | 'Savings account'
  | 'Cash'
  | 'Gold'
  | 'Silver'
  | 'Other';

export type ManualHolding = {
  id: string;
  kind: 'manual';
  name: string;
  type: HoldingType;
  invested: number;
  value: number;
  valueAsOf?: ISODate;
  logs: InvestmentEntry[];
};

export type PlanHolding = {
  id: string;
  kind: 'plan';
  name: string;
  type: HoldingType;
  frequency: Frequency;
  amount: number;
  ratePct: number;
  stepUpPct: number;
  tenureYears: number;
  startDate: ISODate;
  trackFrom: ISODate;
  opening: number;
  actualValue: number | null;
  actualValueDate: ISODate | null;
  logs: InvestmentEntry[];
};

export type Holding = ManualHolding | PlanHolding;

type LiabilityBase = {
  id: string;
  name: string;
  type: LiabilityType;
  principal: number;
  ratePct: number;
  startDate: ISODate;
  payments: LiabilityPayment[];
};

export type RecurringLiability = LiabilityBase & {
  kind: 'recurring';
  tenureMonths: number;
  emi: number;
};

export type OneTimeLiability = LiabilityBase & {
  kind: 'one-time';
  dueDate: ISODate | null;
};

export type Liability = RecurringLiability | OneTimeLiability;

export type EfEntry = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
};

export type Settings = {
  name: string;
  theme: 'system' | 'dark' | 'light';
};

export type AppData = {
  settings: Settings;
  transactions: Transaction[];
  goals: Goal[];
  holdings: Holding[];
  liabilities: Liability[];
  efEntries: EfEntry[];
};
