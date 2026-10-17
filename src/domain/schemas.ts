import { z } from 'zod';

import { formatINR } from '../lib/format';
import { addDays, isValidISO } from './dates';
import { EF_BUCKETS, EF_BUCKET_META } from './efAllocation';
import { solveLoan } from './liability';
import { THEME_IDS, type AppData, type ISODate, type Transaction } from './types';

export const SCHEMA_VERSION = 8;

const isoDateSchema = z.string().refine(isValidISO, 'Enter a valid date');
const idSchema = z.string().min(1);
const moneySchema = z.number().finite().min(-100_000_000_000).max(100_000_000_000);
const frequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
const holdingTypeSchema = z.enum([
  'Mutual fund / SIP',
  'Stocks / ETF',
  'Fixed deposit',
  'Recurring deposit',
  'EPFO / PF',
  'Savings account',
  'Cash',
  'Gold',
  'Silver',
  'Other',
]);
const investmentEntrySchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  amount: moneySchema.positive(),
  note: z.string(),
  kind: z.enum(['Deposit', 'Withdrawal']),
  snapshotAdjustment: moneySchema.optional(),
});
const liabilityPaymentSchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  amount: moneySchema.positive(),
  note: z.string(),
  kind: z.enum(['EMI', 'Prepayment', 'Payment']),
});

const transactionSchema = z.object({
  id: idSchema,
  type: z.enum(['income', 'expense', 'invest']),
  amount: moneySchema.positive(),
  category: z.string(),
  note: z.string(),
  date: isoDateSchema,
  source: z.object({
    kind: z.enum(['holding-entry', 'liability-payment', 'policy-payment', 'liability-origin']),
    parentId: idSchema,
    entryId: idSchema,
  }).optional(),
});

const goalSchema = z.object({
  id: idSchema,
  name: z.string(),
  target: moneySchema,
  saved: moneySchema,
  year: z.number().int().finite(),
  auto: z.literal('ef').optional(),
  links: z.array(z.object({
    instrumentId: idSchema,
    share: z.number().finite().min(0.1).max(100).refine((share) => Number.isInteger(share * 10), 'Share must use at most one decimal place'),
  })).default([]),
});

const manualHoldingSchema = z.object({
  id: idSchema,
  kind: z.literal('manual'),
  name: z.string(),
  type: holdingTypeSchema,
  invested: moneySchema,
  value: moneySchema,
  valueAsOf: isoDateSchema.optional(),
  logs: z.array(investmentEntrySchema),
});

const planHoldingSchema = z.object({
  id: idSchema,
  kind: z.literal('plan'),
  name: z.string(),
  type: holdingTypeSchema,
  frequency: frequencySchema,
  amount: moneySchema,
  ratePct: moneySchema,
  stepUpPct: moneySchema,
  tenureYears: moneySchema,
  startDate: isoDateSchema,
  trackFrom: isoDateSchema,
  opening: moneySchema,
  actualValue: moneySchema.nullable(),
  actualValueDate: isoDateSchema.nullable(),
  logs: z.array(investmentEntrySchema),
}).superRefine((holding, context) => {
  if ((holding.actualValue === null) !== (holding.actualValueDate === null)) {
    context.addIssue({
      code: 'custom',
      path: ['actualValueDate'],
      message: 'Actual value and snapshot date must both be set or both be null',
    });
  }
});

const liabilityBaseSchema = {
  id: idSchema,
  name: z.string(),
  type: z.enum(['Home loan', 'Car loan', 'Personal loan', 'Education loan', 'Credit card', 'Borrowed money', 'Other']),
  principal: moneySchema.positive(),
  ratePct: moneySchema.min(0).max(100),
  startDate: isoDateSchema,
  payments: z.array(liabilityPaymentSchema),
};
const liabilitySettlementSchema = z.object({
  asOf: isoDateSchema,
  balance: moneySchema.min(0),
});
const recurringLiabilitySchema = z.object({
  ...liabilityBaseSchema,
  kind: z.literal('recurring'),
  tenureMonths: z.number().int().min(1).max(1200),
  emi: moneySchema.positive(),
  settlement: liabilitySettlementSchema.nullable(),
}).superRefine((liability, context) => {
  if (liability.settlement !== null && liability.settlement.asOf < liability.startDate) {
    context.addIssue({ code: 'custom', path: ['settlement', 'asOf'], message: 'Settlement cannot predate the liability start date' });
  }
  if (liability.payments.some((payment) => payment.kind === 'Payment')) {
    context.addIssue({ code: 'custom', path: ['payments'], message: 'Recurring liabilities use EMI or prepayment entries' });
  }
});
const oneTimeLiabilitySchema = z.strictObject({
  ...liabilityBaseSchema,
  kind: z.literal('one-time'),
  dueDate: isoDateSchema.nullable(),
}).superRefine((liability, context) => {
  if (liability.payments.some((payment) => payment.kind !== 'Payment')) {
    context.addIssue({ code: 'custom', path: ['payments'], message: 'One-time liabilities use Payment entries' });
  }
  if (liability.dueDate !== null && liability.dueDate < liability.startDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the liability started' });
  }
});

const policyKindSchema = z.enum(['term', 'health', 'life-savings', 'ulip', 'vehicle', 'home', 'other']);
const policyPaymentSchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  amount: moneySchema.positive(),
  note: z.string(),
});
const policySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(40),
  insurer: z.string().max(40),
  kind: policyKindSchema,
  premium: moneySchema.positive().max(10_000_000),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'single']),
  startDate: isoDateSchema,
  premiumYears: z.number().int().min(1).max(80).nullable(),
  trackFrom: isoDateSchema,
  coverAmount: moneySchema.positive().max(100_000_000_000).nullable(),
  currentValue: moneySchema.min(0).max(100_000_000_000).nullable(),
  valueAsOf: isoDateSchema.nullable(),
  maturityDate: isoDateSchema.nullable(),
  payments: z.array(policyPaymentSchema),
}).superRefine((policy, context) => {
  if ((policy.frequency === 'single') !== (policy.premiumYears === null)) {
    context.addIssue({ code: 'custom', path: ['premiumYears'], message: 'Single policies have no premium term; recurring policies require a term' });
  }
  if (policy.maturityDate !== null && policy.maturityDate < policy.startDate) {
    context.addIssue({ code: 'custom', path: ['maturityDate'], message: 'Maturity date cannot be before the policy started' });
  }
  const savingsKind = policy.kind === 'life-savings' || policy.kind === 'ulip';
  if (!savingsKind && policy.currentValue !== null) {
    context.addIssue({ code: 'custom', path: ['currentValue'], message: 'Only savings policies can have a current value' });
  }
  if ((policy.currentValue === null) !== (policy.valueAsOf === null)) {
    context.addIssue({ code: 'custom', path: ['valueAsOf'], message: 'Current value and value date must both be set or both be null' });
  }
});

const expenseBudgetCategories = [
  'Living', 'Food', 'Transport', 'Family', 'Shopping', 'Health', 'Bills', 'Education',
  'EMI', 'Insurance', 'Festival', 'Donation', 'Gifts', 'Other', 'Eating out',
  'Entertainment', 'Fashion', 'Culture', 'Unexpected',
] as const;
const investmentBudgetCategories = ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments'] as const;
export const BUDGET_CATEGORIES = [
  ...expenseBudgetCategories.filter((category) => category !== 'Other'),
  'Other',
  ...investmentBudgetCategories,
] as const;
const budgetCategorySet = new Set<string>(BUDGET_CATEGORIES);
const budgetDueDaySchema = z.number().int().min(1).max(31).optional();
const budgetPlanLineSchema = z.object({
  category: z.string().min(1).max(60),
  mode: z.enum(['amount', 'percent']),
  value: moneySchema.min(0).max(1_000_000_000),
  dueDay: budgetDueDaySchema,
}).superRefine((line, context) => {
  if (line.mode === 'percent' && line.value > 100) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Percent cannot exceed 100%' });
  }
});
const budgetPlanSchema = z.object({
  plannedIncome: moneySchema.positive().max(1_000_000_000).nullable(),
  lines: z.array(budgetPlanLineSchema).max(1000),
  repeatMonthly: z.boolean(),
  repeatFrom: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable(),
}).superRefine((plan, context) => {
  const seen = new Set<string>();
  plan.lines.forEach((line, index) => {
    if (line.category === 'EMI' || line.category === 'Insurance') {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Recurring liabilities and insurance are automatic budget items' });
    }
    if (!budgetCategorySet.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Choose an allowed budget category' });
    }
    if (seen.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Budget categories must be unique' });
    }
    seen.add(line.category);
  });
});
const monthBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  source: z.enum(['plan', 'custom']),
  plannedIncome: moneySchema.positive().max(1_000_000_000).nullable(),
  linkedIncluded: z.boolean().optional(),
  lines: z.array(z.object({
    category: z.string().min(1).max(60),
    planned: moneySchema.min(0).max(1_000_000_000),
    dueDay: budgetDueDaySchema,
  })).max(1000),
}).superRefine((budget, context) => {
  const seen = new Set<string>();
  budget.lines.forEach((line, index) => {
    if (!budgetCategorySet.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Choose an allowed budget category' });
    }
    if (seen.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Budget categories must be unique' });
    }
    seen.add(line.category);
  });
});
const budgetSchema = z.object({
  plannedIncome: moneySchema.positive().max(1_000_000_000).nullable(),
  lines: z.array(z.object({
    category: z.string(),
    planned: moneySchema.min(0).max(1_000_000_000),
    dueDay: budgetDueDaySchema,
  })).default([]),
}).superRefine((budget, context) => {
  const seen = new Set<string>();
  const allowed = new Set<string>(BUDGET_CATEGORIES);
  budget.lines.forEach((line, index) => {
    if (!allowed.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Choose an allowed budget category' });
    }
    if (seen.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Budget categories must be unique' });
    }
    seen.add(line.category);
  });
});

const settingsSchema = z.object({
  name: z.string().max(40),
  theme: z.enum(THEME_IDS),
  monthlySalary: z.number().finite().min(0.01).max(1_000_000_000).nullable(),
  onboarded: z.boolean(),
});

export const efAllocationSchema = z.record(
  idSchema,
  z.number().finite().min(0).max(100).refine((value) => Number.isInteger(value * 10)),
).refine((allocation) => {
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  return Math.abs(total - 100) < 0.0001;
}, { message: 'Percentages must add up to 100%', path: ['total'] }).nullable().optional();

export const efCustomBucketSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(24).refine((name) => name === name.trim()),
  access: z.enum(['instant', 'days', 'slow']),
  marketLinked: z.boolean(),
});

export const efCustomBucketsSchema = z.array(efCustomBucketSchema).max(8).superRefine((buckets, context) => {
  const names = new Set(EF_BUCKETS.map((id) => EF_BUCKET_META[id].label.trim().toLowerCase()));
  const ids = new Set<string>(EF_BUCKETS);
  buckets.forEach((bucket, index) => {
    const normalizedName = bucket.name.trim().toLowerCase();
    if (normalizedName.length === 0) {
      context.addIssue({ code: 'custom', path: [index, 'name'], message: 'Name must not be empty' });
    }
    if (names.has(normalizedName)) {
      context.addIssue({ code: 'custom', path: [index, 'name'], message: 'Custom option names must be unique and differ from fixed options' });
    }
    if (ids.has(bucket.id)) {
      context.addIssue({ code: 'custom', path: [index, 'id'], message: 'Bucket IDs must be unique' });
    }
    names.add(normalizedName);
    ids.add(bucket.id);
  });
});
export const efBucketLinksSchema = z.record(idSchema, z.array(idSchema).max(10));

export const appDataSchema = z.object({
  settings: settingsSchema,
  transactions: z.array(transactionSchema),
  goals: z.array(goalSchema),
  holdings: z.array(z.discriminatedUnion('kind', [manualHoldingSchema, planHoldingSchema])),
  liabilities: z.array(z.discriminatedUnion('kind', [recurringLiabilitySchema, oneTimeLiabilitySchema])),
  policies: z.array(policySchema),
  budget: budgetSchema.nullable(),
  budgetPlan: budgetPlanSchema.nullable(),
  monthBudgets: z.array(monthBudgetSchema).optional(),
  efAllocation: efAllocationSchema,
  efCustomBuckets: efCustomBucketsSchema,
  efBucketLinks: efBucketLinksSchema,
});

export type AppDataSchemaOutput = z.infer<typeof appDataSchema>;
type Assert<T extends true> = T;
type SchemaMatchesAppData = AppDataSchemaOutput extends AppData
  ? AppData extends AppDataSchemaOutput
    ? true
    : false
  : false;
export type AppDataSchemaMatchesAppData = Assert<SchemaMatchesAppData>;

export const TRANSACTION_CATEGORIES = {
  expense: [
    'Living', 'Food', 'Transport', 'Family', 'EMI', 'Insurance', 'Shopping', 'Health',
    'Bills', 'Education', 'Festival', 'Donation', 'Gifts', 'Other', 'Eating out',
    'Entertainment', 'Fashion', 'Culture', 'Unexpected',
  ],
  income: ['Salary', 'Freelance', 'Rental', 'Business', 'Interest', 'Withdrawal', 'Borrowed', 'Loan proceeds', 'Own funds', 'Other'],
  invest: ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments', 'Other'],
} as const satisfies Record<Transaction['type'], readonly string[]>;

export const INVESTMENT_FORM_CATEGORIES = TRANSACTION_CATEGORIES.invest
  .filter((category) => category !== 'Other');

export const NON_EARNED_INCOME_CATEGORIES = ['Withdrawal', 'Borrowed', 'Loan proceeds', 'Own funds'] as const;

type MoneyOptions = {
  minimum?: number;
  maximum?: number;
  minimumMessage?: string;
  maximumMessage?: string;
};

function requiredMoneyInputSchema(options: MoneyOptions) {
  return z.string()
    .trim()
    .transform((input) => input.replaceAll(',', ''))
    .refine((input) => /^\d+(\.\d{1,2})?$/.test(input), 'Enter an amount like 1500 or 1500.50')
    .transform((input) => Math.round(Number(input) * 100) / 100)
    .refine((amount) => amount >= (options.minimum ?? 0), options.minimumMessage ?? 'Amount must be greater than zero')
    .refine((amount) => amount <= (options.maximum ?? Number.MAX_SAFE_INTEGER), options.maximumMessage ?? 'Amount is too large');
}

function optionalMoneyInputSchema(options: MoneyOptions) {
  return z.union([z.literal('').transform(() => undefined), requiredMoneyInputSchema(options)]).optional();
}

function moneyInputSchema(options: MoneyOptions & { optional: true }): ReturnType<typeof optionalMoneyInputSchema>;
function moneyInputSchema(options: MoneyOptions & { optional?: false }): ReturnType<typeof requiredMoneyInputSchema>;
function moneyInputSchema(options: MoneyOptions & { optional?: boolean }) {
  return options.optional ? optionalMoneyInputSchema(options) : requiredMoneyInputSchema(options);
}

function dateInputSchema(message = 'Enter a valid date') {
  return z.string().refine(isValidISO, message);
}

const amountInputSchema = moneyInputSchema({
  minimum: 0.01,
  maximum: 100_000_000,
  minimumMessage: 'Amount must be greater than zero',
  maximumMessage: 'Amount is too large',
});

export function makeTransactionFormSchema(
  today: ISODate,
  legacyCategories: Partial<Record<Transaction['type'], readonly string[]>> = {},
  options: {
    instruments: { id: string }[];
    withdrawable: Record<string, number>;
    mode: 'create' | 'edit-unlinked' | 'edit-linked';
    allowUnlinkedInvestment?: boolean;
  } = { instruments: [], withdrawable: {}, mode: 'create' },
) {
  return z.object({
    amount: amountInputSchema,
    date: dateInputSchema()
      .refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future'),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
    type: z.enum(['income', 'expense', 'invest']),
    category: z.string(),
    instrumentId: z.string().trim().optional().transform((id) => id || undefined),
  }).superRefine((value, context) => {
    const allowedCategories: readonly string[] = TRANSACTION_CATEGORIES[value.type];
    if (
      !allowedCategories.includes(value.category) &&
      !legacyCategories[value.type]?.includes(value.category)
    ) {
      context.addIssue({ code: 'custom', path: ['category'], message: 'Choose a category' });
    }

    const instrumentId = value.instrumentId;
    const isInstrumentType = value.type === 'invest';
    const isWithdrawal = value.type === 'income' && value.category === 'Withdrawal';
    const maySelectInstrument = isInstrumentType || isWithdrawal;
    const requiredForMode = options.mode !== 'edit-unlinked'
      && !options.allowUnlinkedInvestment
      && isInstrumentType;
    const instruments = options.instruments.map((item) => item.id);

    if (instrumentId !== undefined && (!maySelectInstrument || options.mode === 'edit-unlinked' && !isInstrumentType)) {
      context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'This transaction cannot be linked to an investment' });
      return;
    }
    if (requiredForMode && isInstrumentType && instrumentId === undefined) {
      context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'Choose where this is invested' });
    } else if (instrumentId !== undefined && isInstrumentType && !instruments.includes(instrumentId)) {
      context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'Choose an investment' });
    }

    if (options.mode !== 'edit-unlinked' && isWithdrawal && instrumentId === undefined) {
      context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'Choose what you withdrew from' });
    } else if (isWithdrawal && instrumentId !== undefined) {
      const available = options.withdrawable[instrumentId];
      if (available === undefined) {
        context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'Choose what you withdrew from' });
      } else if (value.amount > available) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `Exceeds the current value of ${formatINR(available)}`,
        });
      }

    }

    if (
      instrumentId !== undefined &&
      options.mode === 'edit-unlinked' &&
      !isInstrumentType
    ) {
      context.addIssue({ code: 'custom', path: ['instrumentId'], message: 'Only investment transactions can be linked' });
    }
  });
}

export function makeMonthAllocationFormSchema(
  mode: 'shortfall' | 'surplus',
  options: { liabilityIds: string[]; instrumentIds: string[]; maximumAmount: number },
) {
  const kinds = mode === 'shortfall'
    ? ['borrowed', 'loan-proceeds', 'withdrawal', 'own-funds'] as const
    : ['invest', 'liability'] as const;
  return z.object({
    allocationKind: z.enum(kinds),
    amount: moneyInputSchema({
      minimum: 0.01,
      maximum: options.maximumAmount,
      maximumMessage: 'Amount exceeds the remaining balance',
    }),
    targetId: z.string(),
    lenderName: z.string().trim().max(40, 'Keep the lender name under 40 characters'),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
  }).superRefine((value, context) => {
    if (value.allocationKind === 'borrowed' && !value.lenderName) {
      context.addIssue({ code: 'custom', path: ['lenderName'], message: 'Enter who lent you the money' });
    }
    if ((value.allocationKind === 'loan-proceeds' || value.allocationKind === 'liability') &&
      !options.liabilityIds.includes(value.targetId)) {
      context.addIssue({ code: 'custom', path: ['targetId'], message: 'Choose a liability' });
    }
    if ((value.allocationKind === 'withdrawal' || value.allocationKind === 'invest') &&
      !options.instrumentIds.includes(value.targetId)) {
      context.addIssue({ code: 'custom', path: ['targetId'], message: 'Choose a savings or investment' });
    }
  });
}

export type TransactionFormInput = z.input<ReturnType<typeof makeTransactionFormSchema>>;
export type TransactionFormOutput = z.output<ReturnType<typeof makeTransactionFormSchema>>;
export type MonthAllocationFormInput = z.input<ReturnType<typeof makeMonthAllocationFormSchema>>;
export type MonthAllocationFormOutput = z.output<ReturnType<typeof makeMonthAllocationFormSchema>>;

const holdingTypeFormSchema = z.enum([
  'Mutual fund / SIP',
  'Stocks / ETF',
  'Fixed deposit',
  'Recurring deposit',
  'EPFO / PF',
  'Savings account',
  'Cash',
  'Gold',
  'Silver',
  'Other',
]);
const frequencyFormSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
const optionalRate = (max: number, message: string, emptyZero = false) => {
  const rate = z.string().trim()
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), message)
    .transform((value) => Math.round(Number(value) * 100) / 100)
    .refine((value) => value >= 0 && value <= max, message);
  return emptyZero ? z.union([z.literal('').transform(() => 0), rate]) : rate;
};

export function makePlanFormSchema(
  today: ISODate,
  ctx: { otherNames: string[]; earliestLogDate: ISODate | null },
) {
  return z.object({
    name: z.string().trim().min(1, 'Enter a name up to 40 characters').max(40, 'Enter a name up to 40 characters')
      .refine((name) => !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A holding with this name already exists'),
    type: holdingTypeFormSchema,
    frequency: frequencyFormSchema,
    amount: moneyInputSchema({ minimum: 0.01, maximum: 10_000_000, maximumMessage: 'Amount is too large' }),
    ratePct: optionalRate(30, 'Enter a rate between 0 and 30'),
    stepUpPct: optionalRate(50, 'Enter a step-up between 0 and 50', true),
    tenureYears: z.string().trim().refine((value) => /^\d+$/.test(value), 'Enter whole years from 1 to 50')
      .transform(Number).refine((value) => value >= 1 && value <= 50, 'Enter whole years from 1 to 50'),
    startDate: dateInputSchema().refine((date) => !isValidISO(date) || date <= addDays(today, 366), 'Start date is too far ahead'),
    trackFrom: z.string().trim(),
    opening: moneyInputSchema({ minimum: 0, maximum: 10_000_000_000, optional: true }),
    actualValue: moneyInputSchema({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER, optional: true }),
    actualValueDate: z.string().trim(),
  }).transform((value) => ({
    ...value,
    trackFrom: value.trackFrom || value.startDate,
    opening: value.opening ?? 0,
    actualValue: value.actualValue ?? null,
    actualValueDate: value.actualValueDate || null,
  })).superRefine((value, context) => {
    if (isValidISO(value.trackFrom) && value.trackFrom < value.startDate) {
      context.addIssue({ code: 'custom', path: ['trackFrom'], message: "Tracking can't start before the plan" });
    } else if (value.trackFrom && !isValidISO(value.trackFrom)) {
      context.addIssue({ code: 'custom', path: ['trackFrom'], message: 'Enter a valid date' });
    }
    if (value.actualValue !== null && value.actualValueDate === null) {
      context.addIssue({ code: 'custom', path: ['actualValueDate'], message: 'Enter the date for this value' });
    } else if (value.actualValue === null && value.actualValueDate !== null) {
      context.addIssue({ code: 'custom', path: ['actualValue'], message: 'Enter the value for this date' });
    }
    if (value.actualValueDate !== null) {
      if (!isValidISO(value.actualValueDate)) {
        context.addIssue({ code: 'custom', path: ['actualValueDate'], message: 'Enter a valid date' });
      } else if (value.actualValueDate > today) {
        context.addIssue({ code: 'custom', path: ['actualValueDate'], message: 'Date cannot be in the future' });
      } else if (value.actualValueDate < value.startDate) {
        context.addIssue({ code: 'custom', path: ['actualValueDate'], message: 'Value date is before the plan started' });
      }
    }
    if (ctx.earliestLogDate && value.startDate > ctx.earliestLogDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'A logged installment is dated before this start date' });
    }
  });
}

export function makeInvestmentEntryFormSchema(
  today: ISODate,
  ctx: { startDate: ISODate | null; currentValue: number },
) {
  return z.object({
    kind: z.enum(['Deposit', 'Withdrawal']),
    date: dateInputSchema().refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future')
      .refine((date) => !isValidISO(date) || ctx.startDate === null || date >= ctx.startDate, 'Date is before the plan started'),
    amount: moneyInputSchema({ minimum: 0.01, maximum: 100_000_000, maximumMessage: 'Amount is too large' }),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
  }).superRefine((value, context) => {
    if (value.kind === 'Withdrawal' && value.amount > ctx.currentValue) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: `Exceeds the current value of ${formatINR(ctx.currentValue)}`,
      });
    }
  });
}

export function makeLiabilityFormSchema(
  today: ISODate,
  ctx: { otherNames: string[]; earliestPaymentDate: ISODate | null },
) {
  const common = {
    name: z.string().trim().min(1, 'Enter a name up to 40 characters').max(40, 'Enter a name up to 40 characters')
      .refine((name) => !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A liability with this name already exists'),
    type: z.enum(['Home loan', 'Car loan', 'Personal loan', 'Education loan', 'Credit card', 'Borrowed money', 'Other']),
    principal: moneyInputSchema({ minimum: 0.01, maximum: 1_000_000_000, maximumMessage: 'Amount is too large' }),
    ratePct: optionalRate(60, 'Enter a rate between 0 and 60', true),
    startDate: dateInputSchema()
      .refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future'),
    received: z.boolean().default(false),
  };
  const recurring = z.object({
    ...common,
    kind: z.literal('recurring'),
    ratePct: z.union([
      z.literal('').transform(() => null),
      optionalRate(100, 'Enter a rate between 0 and 100'),
    ]),
    tenureMonths: z.union([
      z.literal('').transform(() => null),
      z.string().trim().refine((value) => /^\d+$/.test(value), 'Enter whole months from 1 to 600')
        .transform(Number).refine((value) => value >= 1 && value <= 600, 'Enter whole months from 1 to 600'),
    ]),
    emi: moneyInputSchema({ minimum: 0.01, maximum: 1_000_000_000, optional: true }),
    dueDate: z.string().optional(),
  }).superRefine((value, context) => {
    if (ctx.earliestPaymentDate && value.startDate > ctx.earliestPaymentDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'A payment is dated before this start date' });
    }
    const knownCount = [value.ratePct, value.tenureMonths, value.emi]
      .filter((field) => field !== null && field !== undefined).length;
    if (knownCount < 2) {
      context.addIssue({
        code: 'custom',
        path: ['tenureMonths'],
        message: 'Add one more of tenure, interest rate or EMI so we can work out the rest',
      });
    } else {
      try {
        solveLoan({
          principal: value.principal,
          ...(value.ratePct === null ? {} : { ratePct: value.ratePct }),
          ...(value.tenureMonths === null ? {} : { tenureMonths: value.tenureMonths }),
          ...(value.emi === undefined ? {} : { emi: value.emi }),
        });
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        context.addIssue({
          code: 'custom',
          path: value.tenureMonths === null ? ['tenureMonths'] : ['emi'],
          message: error.message,
        });
      }
    }
  }).transform(({ dueDate: _dueDate, ...value }) => {
    const solved = solveLoan({
      principal: value.principal,
      ...(value.ratePct === null ? {} : { ratePct: value.ratePct }),
      ...(value.tenureMonths === null ? {} : { tenureMonths: value.tenureMonths }),
      ...(value.emi === undefined ? {} : { emi: value.emi }),
    });
    if (solved.ratePct === null || solved.tenureMonths === null || solved.emi === null) {
      throw new Error('Add one more of tenure, interest rate or EMI so we can work out the rest');
    }
    return {
      ...value,
      ratePct: solved.ratePct,
      tenureMonths: solved.tenureMonths,
      emi: solved.emi,
    };
  });
  const oneTime = z.object({
    ...common,
    kind: z.literal('one-time'),
    tenureMonths: z.string().optional(),
    emi: z.string().optional(),
    dueDate: z.string().trim(),
  }).superRefine((value, context) => {
    if (ctx.earliestPaymentDate && value.startDate > ctx.earliestPaymentDate) {
      context.addIssue({ code: 'custom', path: ['startDate'], message: 'A payment is dated before this start date' });
    }
    if (value.dueDate) {
      if (!isValidISO(value.dueDate)) {
        context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Enter a valid date' });
      } else if (value.dueDate < value.startDate) {
        context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the liability started' });
      }
    }
  }).transform(({ tenureMonths: _tenureMonths, emi: _emi, dueDate, ...value }) => ({
    ...value,
    dueDate: dueDate || null,
  }));
  return z.discriminatedUnion('kind', [recurring, oneTime]);
}

export function makeGoalFormSchema(
  today: ISODate,
  ctx: { otherNames: string[]; locked: boolean; existingYear?: number; minTarget?: number },
) {
  const year = Number(today.slice(0, 4));
  const yearMessage = `Enter a year between ${year} and ${year + 60}`;
  const isAllowedYear = (value: number) =>
    (value >= year && value <= year + 60) || value === ctx.existingYear;
  return z.object({
    name: z.string().transform((name) => name.trim())
      .refine((name) => ctx.locked || (name.length >= 1 && name.length <= 40), 'Enter a name up to 40 characters')
      .refine((name) => ctx.locked || !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A goal with this name already exists'),
    target: moneyInputSchema({ minimum: 0.01, maximum: 10_000_000_000, maximumMessage: 'Amount is too large' }),
    saved: ctx.locked
      ? z.string().transform(() => 0)
      : moneyInputSchema({ minimum: 0, maximum: 10_000_000_000, maximumMessage: "Saved can't exceed the target" }),
    links: z.array(z.object({
      instrumentId: idSchema,
      share: z.string().trim().regex(/^(?:\d+\.?\d*|\.\d+)$/, 'Enter a valid asset share')
        .transform(Number)
        .refine((share) => share >= 0.1 && share <= 100, 'Share must be between 0.1% and 100%')
        .refine((share) => Math.round(share * 10) === share * 10, 'Share must use at most one decimal place'),
    })).default([]),
    year: z.string().trim().refine((value) => /^\d+$/.test(value), yearMessage)
      .transform(Number).refine(isAllowedYear, yearMessage),
  }).superRefine((value, context) => {
    if (!ctx.locked && value.saved > value.target) {
      context.addIssue({ code: 'custom', path: ['saved'], message: "Saved can't exceed the target" });
    }
    if (ctx.locked && (ctx.minTarget ?? 0) > 0 && value.target < (ctx.minTarget ?? 0)) {
      context.addIssue({
        code: 'custom',
        path: ['target'],
        message: `Emergency fund target must be at least 3 months of cover (${formatINR(ctx.minTarget ?? 0)})`,
      });
    }
  });
}

export function makeHoldingFormSchema(ctx: { otherNames: string[] }) {
  return z.object({
    name: z.string().trim().min(1, 'Enter a name up to 40 characters').max(40, 'Enter a name up to 40 characters')
      .refine((name) => !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A holding with this name already exists'),
    type: holdingTypeFormSchema,
    invested: moneyInputSchema({ minimum: 0, maximum: 10_000_000_000 }),
    value: moneyInputSchema({ minimum: 0, maximum: 10_000_000_000 }),
  });
}

export function makeLiabilityPaymentFormSchema(
  today: ISODate,
  ctx: { startDate: ISODate; outstandingExcludingThis: number; oneTime?: boolean },
) {
  return z.object({
    date: dateInputSchema().refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future')
      .refine((date) => !isValidISO(date) || date >= ctx.startDate, 'Date is before the liability started'),
    amount: moneyInputSchema({ minimum: 0.01, maximum: Number.MAX_SAFE_INTEGER }),
    kind: ctx.oneTime ? z.literal('Payment') : z.enum(['EMI', 'Prepayment']),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
  }).superRefine((value, context) => {
    if (ctx.outstandingExcludingThis < 1) {
      context.addIssue({ code: 'custom', path: ['amount'], message: 'This liability is already cleared' });
    } else if (value.amount > Math.ceil(ctx.outstandingExcludingThis)) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: `Exceeds the outstanding balance of ${formatINR(ctx.outstandingExcludingThis)}`,
      });
    }
  });
}

export type PlanFormInput = z.input<ReturnType<typeof makePlanFormSchema>>;
export type PlanFormOutput = z.output<ReturnType<typeof makePlanFormSchema>>;
export type InvestmentEntryFormInput = z.input<ReturnType<typeof makeInvestmentEntryFormSchema>>;
export type InvestmentEntryFormOutput = z.output<ReturnType<typeof makeInvestmentEntryFormSchema>>;
export type LiabilityFormInput = z.input<ReturnType<typeof makeLiabilityFormSchema>>;
export type LiabilityFormOutput = z.output<ReturnType<typeof makeLiabilityFormSchema>>;
export type LiabilityPaymentFormInput = z.input<ReturnType<typeof makeLiabilityPaymentFormSchema>>;
export type LiabilityPaymentFormOutput = z.output<ReturnType<typeof makeLiabilityPaymentFormSchema>>;
export type GoalFormInput = z.input<ReturnType<typeof makeGoalFormSchema>>;
export type GoalFormOutput = z.output<ReturnType<typeof makeGoalFormSchema>>;
export type HoldingFormInput = z.input<ReturnType<typeof makeHoldingFormSchema>>;
export type HoldingFormOutput = z.output<ReturnType<typeof makeHoldingFormSchema>>;

function profileFields() {
  return {
    name: z.string().trim().min(1, 'Enter your name').max(40, 'Keep your name under 40 characters'),
    monthlySalary: z.union([
      z.literal('').transform(() => null),
      moneyInputSchema({
        minimum: 0.01,
        maximum: 1_000_000_000,
        minimumMessage: 'Monthly income must be greater than zero',
        maximumMessage: 'Monthly income must be 1,000,000,000 or less',
      }),
    ]).optional().transform((salary) => salary ?? null),
  };
}

export function makeOnboardingFormSchema() {
  return z.object(profileFields());
}

export function makeProfileFormSchema() {
  return z.object(profileFields());
}

export type ProfileFormInput = z.input<ReturnType<typeof makeProfileFormSchema>>;
export type ProfileFormOutput = z.output<ReturnType<typeof makeProfileFormSchema>>;
