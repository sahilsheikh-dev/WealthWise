export type ISODate = string;
export const EARNED_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Rental',
  'Business',
  'Interest',
  'Other',
] as const;
export type EarnedIncomeCategory = (typeof EARNED_INCOME_CATEGORIES)[number];
export const NON_EARNED_INCOME_CATEGORIES = ['Withdrawal', 'Borrowed', 'Loan proceeds', 'Own funds'] as const;
export type NonEarnedIncomeCategory = (typeof NON_EARNED_INCOME_CATEGORIES)[number];

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
    | { kind: 'liability-closure-charge'; parentId: string; entryId: string }
    | { kind: 'policy-payment'; parentId: string; entryId: string }
    | { kind: 'liability-origin'; parentId: string; entryId: string };
};

export type GoalLink = {
  instrumentId: string;
  share?: number;
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
  price?: number;
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
  'Custom',
] as const;

export type LiabilityType = (typeof LIABILITY_TYPES)[number];

export const HOLDING_TYPES = [
  'Mutual fund / SIP',
  'Stocks / ETF',
  'Real estate',
  'Fixed deposit',
  'Recurring deposit',
  'EPFO / PF',
  'Savings account',
  'Cash',
  'Gold',
  'Silver',
  'Other',
  'Custom',
] as const;

export type HoldingType = (typeof HOLDING_TYPES)[number];

export type ValuationMethod = 'balance' | 'balanceInterest' | 'accrual' | 'manual' | 'unitsPrice';
export type Compounding = 'monthly' | 'quarterly' | 'halfYearly' | 'yearly' | 'simple';

type HoldingValuation = {
  valuationMethod?: ValuationMethod;
  ratePct?: number;
  compounding?: Compounding;
  maturityDate?: ISODate;
  latestPrice?: number;
  priceAsOf?: ISODate;
};

export type ManualHolding = {
  id: string;
  kind: 'manual';
  name: string;
  type: HoldingType;
  customTypeName?: string;
  invested: number;
  value: number;
  valueAsOf?: ISODate;
  logs: InvestmentEntry[];
} & HoldingValuation;

export type PlanHolding = {
  id: string;
  kind: 'plan';
  name: string;
  type: HoldingType;
  customTypeName?: string;
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
  stopDate?: ISODate;
  logs: InvestmentEntry[];
} & HoldingValuation;

export type Holding = ManualHolding | PlanHolding;

type LiabilityBase = {
  id: string;
  name: string;
  type: LiabilityType;
  customTypeName?: string;
  principal: number;
  ratePct: number;
  startDate: ISODate;
  payments: LiabilityPayment[];
};

export type LiabilitySettlement = {
  asOf: ISODate;
  balance: number;
};

export type LiabilityClosure = {
  date: ISODate;
  paymentId: string;
  note?: string;
  chargeTransactionId?: string;
};

export type RecurringLiability = LiabilityBase & {
  kind: 'recurring';
  tenureMonths: number;
  emi: number;
  settlement: LiabilitySettlement | null;
  closure?: LiabilityClosure;
};

export type OneTimeLiability = LiabilityBase & {
  kind: 'one-time';
  dueDate: ISODate | null;
};

export type Liability = RecurringLiability | OneTimeLiability;

export type PolicyKind =
  | 'term-life'
  | 'health'
  | 'life-savings'
  | 'ulip'
  | 'motor'
  | 'home'
  | 'other';

export type PolicyFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'custom';
export type PolicyStatus = 'active' | 'lapsed' | 'matured' | 'cancelled';

export type PolicyPayment = {
  id: string;
  date: ISODate;
  amount: number;
  note: string;
  dueDate?: ISODate;
};

export type Policy = {
  id: string;
  name: string;
  insurer: string;
  kind: PolicyKind;
  premium: number;
  frequency: PolicyFrequency;
  customIntervalMonths?: number;
  startDate: ISODate;
  status: PolicyStatus;
  policyNumber?: string;
  sumAssured?: number;
  endDate?: ISODate;
  nominee?: string;
  note?: string;
  premiumYears: number;
  trackFrom: ISODate;
  currentValue: number | null;
  valueAsOf: ISODate | null;
  payments: PolicyPayment[];
};

export type BudgetLine = {
  category: string;
  planned: number;
  dueDay?: number;
};

export type BudgetIncomeItem = {
  id: string;
  name: string;
  category: EarnedIncomeCategory;
  amount: number;
  day?: number;
  frequency?: BudgetItemFrequency;
  firstDueMonth?: string;
};

export type BudgetOtherIncomeItem = {
  id: string;
  name: string;
  category: string;
  amount: number;
  day?: number;
};

export type Budget = {
  plannedIncome: number | null;
  lines: BudgetLine[];
};

export type BudgetSection = {
  id: string;
  name: string;
  type: 'spend' | 'invest';
  system?: 'income' | 'debt' | 'insurance';
};

export type BudgetItemFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export type BudgetItem = {
  id: string;
  sectionId: string;
  name: string;
  mode: 'amount' | 'percent';
  value: number;
  dueDay?: number;
  frequency?: BudgetItemFrequency;
  firstDueMonth?: string;
  holdingId?: string;
};

export type BudgetPlan = {
  incomes: BudgetIncomeItem[];
  sections: BudgetSection[];
  items: BudgetItem[];
  repeatMonthly: boolean;
  repeatFrom: string | null;
};

export type MonthBudget = {
  month: string;
  source: 'plan' | 'custom';
  incomes: BudgetIncomeItem[];
  otherIncomes?: BudgetOtherIncomeItem[];
  sections: BudgetSection[];
  items: BudgetItem[];
  linkedIncluded?: boolean;
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

export type EfAllocation = Record<string, number>;

export type EfCustomBucket = {
  id: string;
  name: string;
  access: 'instant' | 'days' | 'slow';
  marketLinked: boolean;
};

export type AppData = {
  settings: Settings;
  transactions: Transaction[];
  goals: Goal[];
  holdings: Holding[];
  liabilities: Liability[];
  policies: Policy[];
  budget: Budget | null;
  budgetPlan: BudgetPlan | null;
  monthBudgets?: MonthBudget[];
  efAllocation?: EfAllocation | null;
  efCustomBuckets: EfCustomBucket[];
  efBucketLinks: Record<string, string[]>;
};
