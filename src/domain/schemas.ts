import { z } from 'zod';

import { addDays, isValidISO } from './dates';
import { emiCoversInterest } from './loan';
import { formatINR } from '../lib/format';
import type { AppData, ISODate, Transaction } from './types';

export const SCHEMA_VERSION = 1;

const isoDateSchema = z.string().refine(isValidISO, 'Enter a valid date');
const idSchema = z.string().min(1);
const moneySchema = z.number().finite();
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
const logEntrySchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  amount: moneySchema,
  note: z.string(),
  kind: z.enum(['EMI', 'Prepayment']).optional(),
});

const transactionSchema = z.object({
  id: idSchema,
  type: z.enum(['income', 'expense', 'invest']),
  amount: moneySchema.positive(),
  category: z.string(),
  note: z.string(),
  date: isoDateSchema,
  source: z.object({
    kind: z.enum(['plan-log', 'loan-payment', 'ef-entry']),
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
});

const manualHoldingSchema = z.object({
  id: idSchema,
  kind: z.literal('manual'),
  name: z.string(),
  type: holdingTypeSchema,
  invested: moneySchema,
  value: moneySchema,
  valueAsOf: isoDateSchema.optional(),
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
  logs: z.array(logEntrySchema),
}).superRefine((holding, context) => {
  if ((holding.actualValue === null) !== (holding.actualValueDate === null)) {
    context.addIssue({
      code: 'custom',
      path: ['actualValueDate'],
      message: 'Actual value and snapshot date must both be set or both be null',
    });
  }
});

const loanSchema = z.object({
  id: idSchema,
  name: z.string(),
  principal: moneySchema,
  ratePct: moneySchema,
  tenureMonths: moneySchema,
  emi: moneySchema,
  startDate: isoDateSchema,
  payments: z.array(logEntrySchema),
});

const efEntrySchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  amount: moneySchema.refine((amount) => amount !== 0),
  note: z.string(),
});

const settingsSchema = z.object({
  name: z.string(),
  theme: z.enum(['system', 'dark', 'light']),
});

export const appDataSchema = z.object({
  settings: settingsSchema,
  transactions: z.array(transactionSchema),
  goals: z.array(goalSchema),
  holdings: z.array(z.discriminatedUnion('kind', [manualHoldingSchema, planHoldingSchema])),
  loans: z.array(loanSchema),
  efEntries: z.array(efEntrySchema),
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
  expense: ['Living', 'Food', 'Transport', 'Family', 'EMI', 'Shopping', 'Health', 'Bills', 'Education', 'Other'],
  income: ['Salary', 'Freelance', 'Business', 'Interest', 'Other'],
  invest: ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Emergency fund', 'Other'],
} as const satisfies Record<Transaction['type'], readonly string[]>;

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
) {
  return z.object({
    amount: amountInputSchema,
    date: dateInputSchema()
      .refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future'),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
    type: z.enum(['income', 'expense', 'invest']),
    category: z.string(),
  }).superRefine((value, context) => {
    const allowedCategories: readonly string[] = TRANSACTION_CATEGORIES[value.type];
    if (
      !allowedCategories.includes(value.category) &&
      !legacyCategories[value.type]?.includes(value.category)
    ) {
      context.addIssue({ code: 'custom', path: ['category'], message: 'Choose a category' });
    }
  });
}

export type TransactionFormInput = z.input<ReturnType<typeof makeTransactionFormSchema>>;
export type TransactionFormOutput = z.output<ReturnType<typeof makeTransactionFormSchema>>;

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

export function makePlanLogFormSchema(today: ISODate, ctx: { startDate: ISODate }) {
  return z.object({
    date: dateInputSchema().refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future')
      .refine((date) => !isValidISO(date) || date >= ctx.startDate, 'Date is before the plan started'),
    amount: moneyInputSchema({ minimum: 0.01, maximum: 100_000_000, maximumMessage: 'Amount is too large' }),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
    recordTransaction: z.boolean(),
  });
}

export function makeLoanFormSchema(
  today: ISODate,
  ctx: { otherNames: string[]; earliestPaymentDate: ISODate | null },
) {
  return z.object({
    name: z.string().trim().min(1, 'Enter a name up to 40 characters').max(40, 'Enter a name up to 40 characters')
      .refine((name) => !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A loan with this name already exists'),
    principal: moneyInputSchema({ minimum: 0.01, maximum: 1_000_000_000, maximumMessage: 'Amount is too large' }),
    ratePct: optionalRate(60, 'Enter a rate between 0 and 60'),
    tenureMonths: z.string().trim().refine((value) => /^\d+$/.test(value), 'Enter whole months from 1 to 480')
      .transform(Number).refine((value) => value >= 1 && value <= 480, 'Enter whole months from 1 to 480'),
    startDate: dateInputSchema()
      .refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future')
      .refine((date) => !ctx.earliestPaymentDate || !isValidISO(date) || date <= ctx.earliestPaymentDate, 'A payment is dated before this start date'),
    emi: moneyInputSchema({ minimum: 0.01, maximum: 1_000_000_000, optional: true }),
  }).transform((value) => ({ ...value, emi: value.emi ?? null }))
    .superRefine((value, context) => {
      if (value.emi !== null && !emiCoversInterest(value.principal, value.ratePct, value.emi)) {
        const monthlyInterest = formatINR(value.principal * value.ratePct / 1200);
        context.addIssue({ code: 'custom', path: ['emi'], message: `EMI must be more than the monthly interest of ${monthlyInterest}` });
      }
    });
}

export function makeGoalFormSchema(
  today: ISODate,
  ctx: { otherNames: string[]; locked: boolean },
) {
  const year = Number(today.slice(0, 4));
  const yearMessage = `Enter a year between ${year} and ${year + 60}`;
  return z.object({
    name: z.string().transform((name) => name.trim())
      .refine((name) => ctx.locked || (name.length >= 1 && name.length <= 40), 'Enter a name up to 40 characters')
      .refine((name) => ctx.locked || !ctx.otherNames.some((other) => other.toLocaleLowerCase() === name.toLocaleLowerCase()), 'A goal with this name already exists'),
    target: moneyInputSchema({ minimum: 0.01, maximum: 10_000_000_000, maximumMessage: 'Amount is too large' }),
    saved: ctx.locked
      ? z.string().transform(() => 0)
      : moneyInputSchema({ minimum: 0, maximum: 10_000_000_000, maximumMessage: "Saved can't exceed the target" }),
    year: z.string().trim().refine((value) => /^\d+$/.test(value), yearMessage)
      .transform(Number).refine((value) => value >= year && value <= year + 60, yearMessage),
  }).superRefine((value, context) => {
    if (!ctx.locked && value.saved > value.target) {
      context.addIssue({ code: 'custom', path: ['saved'], message: "Saved can't exceed the target" });
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

export function makeEfEntryFormSchema(
  today: ISODate,
  ctx: { balanceOn: (date: ISODate) => number },
) {
  return z.object({
    kind: z.enum(['Deposit', 'Withdrawal']),
    amount: moneyInputSchema({ minimum: 0.01, maximum: 100_000_000, maximumMessage: 'Amount is too large' }),
    date: dateInputSchema()
      .refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future'),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
    recordTransaction: z.boolean(),
  }).superRefine((value, context) => {
    if (value.kind === 'Withdrawal' && value.amount > ctx.balanceOn(value.date)) {
      context.addIssue({
        code: 'custom',
        path: ['amount'],
        message: `Exceeds the balance of ${formatINR(ctx.balanceOn(value.date))} on that date`,
      });
    }
    if (value.kind === 'Withdrawal' && value.recordTransaction) {
      context.addIssue({ code: 'custom', path: ['recordTransaction'], message: 'Withdrawals cannot be recorded as transactions' });
    }
  });
}

export function makeLoanPaymentFormSchema(
  today: ISODate,
  ctx: { startDate: ISODate; outstandingExcludingThis: number },
) {
  return z.object({
    date: dateInputSchema().refine((date) => !isValidISO(date) || date <= today, 'Date cannot be in the future')
      .refine((date) => !isValidISO(date) || date >= ctx.startDate, 'Date is before the loan started'),
    amount: moneyInputSchema({ minimum: 0.01, maximum: Number.MAX_SAFE_INTEGER }),
    kind: z.enum(['EMI', 'Prepayment']),
    note: z.string().trim().max(60, 'Keep the note under 60 characters'),
    recordTransaction: z.boolean(),
  }).superRefine((value, context) => {
    if (ctx.outstandingExcludingThis < 1) {
      context.addIssue({ code: 'custom', path: ['amount'], message: 'This loan is already cleared' });
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
export type PlanLogFormInput = z.input<ReturnType<typeof makePlanLogFormSchema>>;
export type PlanLogFormOutput = z.output<ReturnType<typeof makePlanLogFormSchema>>;
export type LoanFormInput = z.input<ReturnType<typeof makeLoanFormSchema>>;
export type LoanFormOutput = z.output<ReturnType<typeof makeLoanFormSchema>>;
export type LoanPaymentFormInput = z.input<ReturnType<typeof makeLoanPaymentFormSchema>>;
export type LoanPaymentFormOutput = z.output<ReturnType<typeof makeLoanPaymentFormSchema>>;
export type GoalFormInput = z.input<ReturnType<typeof makeGoalFormSchema>>;
export type GoalFormOutput = z.output<ReturnType<typeof makeGoalFormSchema>>;
export type HoldingFormInput = z.input<ReturnType<typeof makeHoldingFormSchema>>;
export type HoldingFormOutput = z.output<ReturnType<typeof makeHoldingFormSchema>>;
export type EfEntryFormInput = z.input<ReturnType<typeof makeEfEntryFormSchema>>;
export type EfEntryFormOutput = z.output<ReturnType<typeof makeEfEntryFormSchema>>;
