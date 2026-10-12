export type ISODate = string;

export const THEME_IDS = ['system', 'light', 'dark', 'sky', 'mint', 'blush', 'midnight'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type Transaction = {
  id: string;
  type: 'income' | 'expense' | 'invest';
  amount: number;
  category: string;
  note: string;
  date: ISODate;
  source?:
    | { kind: 'holding-entry'; parentId: string; entryId: string }
    | { kind: 'liability-payment'; parentId: string; entryId: string }
    | { kind: 'policy-payment'; parentId: string; entryId: string }
    | { kind: 'liability-origin'; parentId: string; entryId: string }
    | { kind: 'ef-entry'; parentId: string; entryId: string };
};

export type GoalLink = {
  instrumentId: string;
  share: number;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  year: number;
  auto?: 'ef';
  links: GoalLink[];
};

export type InvestmentEntry = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
  kind: 'Deposit' | 'Withdrawal';
  snapshotAdjustment?: number;
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

export type LiabilitySettlement = {
  asOf: ISODate;
  balance: number;
};

export type RecurringLiability = LiabilityBase & {
  kind: 'recurring';
  tenureMonths: number;
  emi: number;
  settlement: LiabilitySettlement | null;
};

export type OneTimeLiability = LiabilityBase & {
  kind: 'one-time';
  dueDate: ISODate | null;
};

export type Liability = RecurringLiability | OneTimeLiability;

export type PolicyKind =
  | 'term'
  | 'health'
  | 'life-savings'
  | 'ulip'
  | 'vehicle'
  | 'home'
  | 'other';

export type PolicyFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'single';

export type PolicyPayment = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
};

export type Policy = {
  id: string;
  name: string;
  insurer: string;
  kind: PolicyKind;
  premium: number;
  frequency: PolicyFrequency;
  startDate: ISODate;
  premiumYears: number | null;
  trackFrom: ISODate;
  coverAmount: number | null;
  currentValue: number | null;
  valueAsOf: ISODate | null;
  maturityDate: ISODate | null;
  payments: PolicyPayment[];
};

export type BudgetLine = {
  category: string;
  planned: number;
};

export type Budget = {
  plannedIncome: number | null;
  lines: BudgetLine[];
};

export type BudgetTemplateLine = {
  category: string;
  mode: 'amount' | 'percent';
  value: number;
};

export type BudgetTemplate = {
  id: string;
  name: string;
  plannedIncome: number | null;
  lines: BudgetTemplateLine[];
};

export type MonthBudget = {
  month: string;
  templateId: string | null;
  templateName: string | null;
  customized: boolean;
  plannedIncome: number | null;
  lines: BudgetLine[];
};

export type EfEntry = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
};

export type Settings = {
  name: string;
  theme: ThemeId;
  /** Stored key predates the user-facing "monthly take-home income" wording. */
  monthlySalary: number | null;
  onboarded: boolean;
};

export const EF_BUCKETS = [
  'cash',
  'bank',
  'fd-rd',
  'mutual-funds-bonds',
  'stocks',
  'insurance',
  'other',
] as const;

export type EfBucketId = (typeof EF_BUCKETS)[number];

export type EfAllocation = Record<EfBucketId, number>;

export type AppData = {
  settings: Settings;
  transactions: Transaction[];
  goals: Goal[];
  holdings: Holding[];
  liabilities: Liability[];
  policies: Policy[];
  budget: Budget | null;
  budgetTemplates?: BudgetTemplate[];
  defaultBudgetTemplateId?: string | null;
  monthBudgets?: MonthBudget[];
  efEntries: EfEntry[];
  efAllocation?: EfAllocation | null;
};
