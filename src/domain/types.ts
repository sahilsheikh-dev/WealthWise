export type ISODate = string;

export type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'invest';
  amount: number;
  category: string;
  note: string;
  date: ISODate;
  source?: { kind: 'plan-log' | 'loan-payment' | 'ef-entry'; parentId: string; entryId: string };
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  year: number;
  auto?: 'ef';
};

export type LogEntry = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
  kind?: 'EMI' | 'Prepayment';
};

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

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
  logs: LogEntry[];
};

export type Holding = ManualHolding | PlanHolding;

export type Loan = {
  id: string;
  name: string;
  principal: number;
  ratePct: number;
  tenureMonths: number;
  emi: number;
  startDate: ISODate;
  payments: LogEntry[];
};

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
  loans: Loan[];
  efEntries: EfEntry[];
};
