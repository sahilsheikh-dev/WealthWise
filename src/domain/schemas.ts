import { z } from 'zod';

import { isValidISO } from './dates';
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

const amountInputSchema = z.string()
  .trim()
  .transform((value) => value.replaceAll(',', ''))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Enter an amount like 1500 or 1500.50')
  .transform((value) => Number(value))
  .refine((value) => value > 0, 'Amount must be greater than zero')
  .refine((value) => value <= 100_000_000, 'Amount is too large')
  .transform((value) => Math.round(value * 100) / 100);

export function makeTransactionFormSchema(
  today: ISODate,
  legacyCategories: Partial<Record<Transaction['type'], readonly string[]>> = {},
) {
  return z.object({
    amount: amountInputSchema,
    date: z.string()
      .refine(isValidISO, 'Enter a valid date')
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
