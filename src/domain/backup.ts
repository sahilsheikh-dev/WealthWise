import { z } from 'zod';

import { ensureEfGoal } from './goals';
import { validateIntegrity } from './links';
import { budgetGroupFor } from './budgetGroups';
import { migratePersisted } from '../data/migrate';
import { EF_BUCKETS, EF_BUCKET_META } from './efAllocation';
import {
  appDataSchema,
  EARNED_INCOME_CATEGORIES,
  SCHEMA_VERSION,
} from './schemas';
import { THEME_IDS, type AppData, type ISODate } from './types';

export const BACKUP_APP = 'wealthwise';
export const BACKUP_FORMAT_VERSION = 1;
export const MAX_BACKUP_CHARS = 5_000_000;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => date >= '1900-01-01' && date <= '2100-12-31');
const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const money = z.number().finite().max(100_000_000_000).min(-100_000_000_000);
const positiveMoney = money.positive();
const note = z.string().max(200);
const name = z.string().max(40);
const investmentEntrySchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: positiveMoney, note,
  kind: z.enum(['Deposit', 'Withdrawal']),
  snapshotAdjustment: money.optional(),
  price: positiveMoney.optional(),
});
const liabilityPaymentSchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: positiveMoney, note,
  kind: z.enum(['EMI', 'Prepayment', 'Payment']),
});
const policyPaymentSchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: positiveMoney, note,
  dueDate: dateSchema.optional(),
});
const transactionSchema = z.strictObject({
  id: idSchema,
  type: z.enum(['income', 'expense', 'invest']),
  amount: positiveMoney,
  category: z.string().max(60),
  note,
  date: dateSchema,
  source: z.strictObject({
    kind: z.enum(['holding-entry', 'liability-payment', 'liability-closure-charge', 'policy-payment', 'liability-origin']),
    parentId: idSchema,
    entryId: idSchema,
  }).optional(),
});
const goalSchema = z.strictObject({
  id: idSchema, name, target: money, saved: money, year: z.number().int().min(1900).max(2100),
  auto: z.literal('ef').optional(),
  links: z.array(z.strictObject({
    instrumentId: idSchema,
    share: z.number().finite().min(0.1).max(100).refine((share) => Number.isInteger(share * 10)).optional(),
  })).max(1000),
});
const holdingType = z.enum([
  'Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit',
  'EPFO / PF', 'Savings account', 'Cash', 'Gold', 'Silver', 'Other',
]);
const valuationFields = {
  valuationMethod: z.enum(['balance', 'balanceInterest', 'accrual', 'manual', 'unitsPrice']).optional(),
  ratePct: z.number().finite().min(0).max(100).optional(),
  compounding: z.enum(['monthly', 'quarterly', 'halfYearly', 'yearly', 'simple']).optional(),
  maturityDate: dateSchema.optional(),
  latestPrice: positiveMoney.optional(),
  priceAsOf: dateSchema.optional(),
};
const manualHoldingSchema = z.strictObject({
  id: idSchema, kind: z.literal('manual'), name, type: holdingType,
  invested: money, value: money, valueAsOf: dateSchema.optional(),
  ...valuationFields,
  logs: z.array(investmentEntrySchema).max(100_000),
});
const planHoldingSchema = z.strictObject({
  id: idSchema, kind: z.literal('plan'), name, type: holdingType,
  ...valuationFields,
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  amount: money, ratePct: z.number().min(0).max(100), stepUpPct: z.number().min(0).max(100),
  tenureYears: z.number().int().min(1).max(100), startDate: dateSchema, trackFrom: dateSchema,
  opening: money, actualValue: money.nullable(), actualValueDate: dateSchema.nullable(),
  logs: z.array(investmentEntrySchema).max(100_000),
});
const liabilityCommon = {
  id: idSchema, name,
  type: z.enum(['Home loan', 'Car loan', 'Personal loan', 'Education loan', 'Credit card', 'Borrowed money', 'Other']),
  principal: money, ratePct: z.number().min(0).max(100), startDate: dateSchema,
  payments: z.array(liabilityPaymentSchema).max(100_000),
};
const liabilityClosureSchema = z.strictObject({
  date: dateSchema,
  paymentId: idSchema,
  note: z.string().max(200).optional(),
  chargeTransactionId: idSchema.optional(),
});
const recurringLiabilitySchema = z.strictObject({
  ...liabilityCommon, kind: z.literal('recurring'),
  tenureMonths: z.number().int().min(1).max(1200), emi: positiveMoney,
  settlement: z.strictObject({ asOf: dateSchema, balance: money.min(0) }).nullable(),
  closure: liabilityClosureSchema.optional(),
}).superRefine((liability, context) => {
  if (liability.settlement !== null && liability.settlement.asOf < liability.startDate) {
    context.addIssue({ code: 'custom', path: ['settlement', 'asOf'], message: 'Settlement cannot predate the liability start date' });
  }
  if (liability.closure
    && (liability.settlement?.asOf !== liability.closure.date || liability.settlement.balance !== 0)) {
    context.addIssue({ code: 'custom', path: ['closure'], message: 'Closed liabilities require a zero settlement on the closure date' });
  }
});
const oneTimeLiabilitySchema = z.strictObject({
  ...liabilityCommon, kind: z.literal('one-time'), dueDate: dateSchema.nullable(),
}).superRefine((liability, context) => {
  if (liability.dueDate !== null && liability.dueDate < liability.startDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the liability started' });
  }
});
const importEfAllocationSchema = z.record(
  idSchema,
  z.number().finite().min(0).max(100).refine((value) => Number.isInteger(value * 100)),
).refine((allocation) => {
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  return Math.abs(Number(total.toFixed(2)) - 100) < 0.005;
})
  .nullable().optional();
const importEfCustomBucketsSchema = z.array(z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(24).refine((value) => value === value.trim()),
  access: z.enum(['instant', 'days', 'slow']),
  marketLinked: z.boolean(),
})).max(8).superRefine((buckets, context) => {
  const names = new Set(EF_BUCKETS.map((id) => EF_BUCKET_META[id].label.trim().toLowerCase()));
  const ids = new Set<string>(EF_BUCKETS);
  buckets.forEach((bucket, index) => {
    const normalizedName = bucket.name.trim().toLowerCase();
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
const importEfBucketLinksSchema = z.record(idSchema, z.array(idSchema).max(10));
const policySchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(40),
  insurer: z.string().max(40),
  kind: z.enum(['term-life', 'health', 'life-savings', 'ulip', 'motor', 'home', 'other']),
  premium: z.number().finite().positive().max(10_000_000),
  frequency: z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly', 'custom']),
  customIntervalMonths: z.number().int().min(1).max(120).optional(),
  startDate: dateSchema,
  status: z.enum(['active', 'lapsed', 'matured', 'cancelled']),
  policyNumber: z.string().max(30).optional(),
  sumAssured: z.number().finite().min(0).max(100_000_000_000).optional(),
  endDate: dateSchema.optional(),
  nominee: z.string().max(40).optional(),
  note: z.string().max(120).optional(),
  premiumYears: z.number().int().min(1).max(80),
  trackFrom: dateSchema,
  currentValue: z.number().finite().min(0).max(100_000_000_000).nullable(),
  valueAsOf: dateSchema.nullable(),
  payments: z.array(policyPaymentSchema).max(100_000),
}).superRefine((policy, context) => {
  if (policy.endDate !== undefined && policy.endDate <= policy.startDate) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after policy start' });
  }
  const savingsKind = policy.kind === 'life-savings' || policy.kind === 'ulip';
  if (!savingsKind && policy.currentValue !== null) {
    context.addIssue({ code: 'custom', path: ['currentValue'], message: 'Only savings policies can have a current value' });
  }
  if ((policy.currentValue === null) !== (policy.valueAsOf === null)) {
    context.addIssue({ code: 'custom', path: ['valueAsOf'], message: 'Current value and date must be set together' });
  }
  if (policy.frequency === 'custom' && policy.customIntervalMonths === undefined) {
    context.addIssue({ code: 'custom', path: ['customIntervalMonths'], message: 'Custom frequency requires an interval in months.' });
  }
});
const budgetSchema = z.strictObject({
  plannedIncome: z.number().finite().positive().max(1_000_000_000).nullable(),
  lines: z.array(z.strictObject({
    category: z.string().max(60),
    planned: z.number().finite().min(0).max(1_000_000_000),
    dueDay: z.number().int().min(1).max(31).optional(),
  })).max(1000),
}).superRefine((budget, context) => {
  const seen = new Set<string>();
  budget.lines.forEach((line, index) => {
    if (seen.has(line.category)) {
      context.addIssue({ code: 'custom', path: ['lines', index, 'category'], message: 'Budget categories must be unique' });
    }
    seen.add(line.category);
  });
});
const budgetIncomeSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(40),
  category: z.enum(EARNED_INCOME_CATEGORIES),
  amount: z.number().finite().positive().max(1_000_000_000),
  day: z.number().int().min(1).max(31).optional(),
});
const budgetOtherIncomeSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(40),
  category: z.string().min(1).max(60),
  amount: z.number().finite().positive().max(1_000_000_000),
  day: z.number().int().min(1).max(31).optional(),
});
const budgetSectionSchema = z.strictObject({
  id: idSchema,
  name: z.string().min(1).max(30).refine((value) => value === value.trim()),
  type: z.enum(['spend', 'invest']),
  system: z.enum(['income', 'debt', 'insurance']).optional(),
});
const budgetItemFrequencySchema = z.enum(['monthly', 'quarterly', 'half-yearly', 'yearly']).optional();
const budgetFirstDueMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional();
const budgetItemSchema = z.strictObject({
  id: idSchema,
  sectionId: idSchema,
  name: z.string().min(1).max(30).refine((value) => value === value.trim()),
  mode: z.enum(['amount', 'percent']),
  value: z.number().finite().min(0).max(1_000_000_000),
  dueDay: z.number().int().min(1).max(31).optional(),
  frequency: budgetItemFrequencySchema,
  firstDueMonth: budgetFirstDueMonthSchema,
  holdingId: z.string().min(1).optional(),
}).superRefine((item, context) => {
  if (item.mode === 'percent' && item.value > 100) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Percent cannot exceed 100%' });
  }
  if ((item.frequency ?? 'monthly') !== 'monthly' && item.firstDueMonth === undefined) {
    context.addIssue({ code: 'custom', path: ['firstDueMonth'], message: 'Choose the first due month.' });
  }
  if (item.mode === 'percent' && (item.frequency ?? 'monthly') !== 'monthly') {
    context.addIssue({ code: 'custom', path: ['frequency'], message: 'Percent items can only be monthly.' });
  }
});
const budgetPlanSchema = z.strictObject({
  incomes: z.array(budgetIncomeSchema).max(1000),
  sections: z.array(budgetSectionSchema).max(12),
  items: z.array(budgetItemSchema).max(100),
  repeatMonthly: z.boolean(),
  repeatFrom: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable(),
}).superRefine((plan, context) => {
  const sections = new Set(plan.sections.map((section) => section.id));
  const names = new Set<string>();
  const itemIds = new Set<string>();
  plan.items.forEach((item, index) => {
    const section = plan.sections.find((row) => row.id === item.sectionId);
    const isInsuranceSection = section?.system === 'insurance';
    if (!sections.has(item.sectionId)) context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: 'Choose an existing section' });
    if (names.has(item.name.toLowerCase())) context.addIssue({ code: 'custom', path: ['items', index, 'name'], message: 'Budget item names must be unique' });
    if (itemIds.has(item.id)) context.addIssue({ code: 'custom', path: ['items', index, 'id'], message: 'Budget item IDs must be unique' });
    if (section?.system && !isInsuranceSection) context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: 'System sections cannot contain editable budget items' });
    const builtInSection = budgetGroupFor(item.name);
    if (builtInSection && builtInSection.id !== item.sectionId) {
      context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: `${item.name} belongs to ${builtInSection.name}` });
    }
    names.add(item.name.toLowerCase());
    itemIds.add(item.id);
  });
});
const monthBudgetSchema = z.strictObject({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  source: z.enum(['plan', 'custom']),
  incomes: z.array(budgetIncomeSchema).max(1000),
  otherIncomes: z.array(budgetOtherIncomeSchema).max(1000).optional(),
  sections: z.array(budgetSectionSchema).max(12),
  items: z.array(budgetItemSchema).max(100),
  linkedIncluded: z.boolean().optional(),
}).superRefine((budget, context) => {
  const sections = new Set(budget.sections.map((section) => section.id));
  const names = new Set<string>();
  budget.items.forEach((item, index) => {
    const section = budget.sections.find((row) => row.id === item.sectionId);
    const isInsuranceSection = section?.system === 'insurance';
    if (!sections.has(item.sectionId)) context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: 'Choose an existing section' });
    if (names.has(item.name.toLowerCase())) context.addIssue({ code: 'custom', path: ['items', index, 'name'], message: 'Budget item names must be unique' });
    if (section?.system && !isInsuranceSection) context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: 'System sections cannot contain editable budget items' });
    const builtInSection = budgetGroupFor(item.name);
    if (builtInSection && builtInSection.id !== item.sectionId) {
      context.addIssue({ code: 'custom', path: ['items', index, 'sectionId'], message: `${item.name} belongs to ${builtInSection.name}` });
    }
    names.add(item.name.toLowerCase());
  });
});
export const importDataSchema = z.strictObject({
  settings: z.strictObject({
    name,
    theme: z.enum(THEME_IDS),
    monthlySalary: z.number().finite().min(0.01).max(1_000_000_000).nullable(),
    onboarded: z.boolean(),
  }),
  transactions: z.array(transactionSchema).max(100_000),
  goals: z.array(goalSchema).max(100_000),
  holdings: z.array(z.discriminatedUnion('kind', [manualHoldingSchema, planHoldingSchema])).max(100_000),
  liabilities: z.array(z.discriminatedUnion('kind', [recurringLiabilitySchema, oneTimeLiabilitySchema])).max(100_000),
  policies: z.array(policySchema).max(100_000),
  budget: budgetSchema.nullable(),
  budgetPlan: budgetPlanSchema.nullable(),
  monthBudgets: z.array(monthBudgetSchema).max(1512).optional(),
  efAllocation: importEfAllocationSchema,
  efCustomBuckets: importEfCustomBucketsSchema,
  efBucketLinks: importEfBucketLinksSchema,
});

const envelopeSchema = z.strictObject({
  app: z.string(),
  formatVersion: z.number().int().nonnegative(),
  schemaVersion: z.number().int().nonnegative(),
  exportedAt: z.string().datetime(),
  checksum: z.strictObject({ algorithm: z.literal('sha256'), value: z.string().min(1) }),
  data: z.unknown(),
});

export type BackupSummary = {
  transactions: number;
  goals: number;
  holdings: number;
  plans: number;
  liabilities: number;
  policies: number;
  firstDate: ISODate | null;
  lastDate: ISODate | null;
};

export type ParseBackupResult =
  | { ok: true; data: AppData; exportedAt: string; summary: BackupSummary }
  | {
    ok: false;
    reason: 'too-large' | 'not-json' | 'not-a-backup' | 'newer-version' | 'unsupported-version'
      | 'checksum-mismatch' | 'invalid-data' | 'integrity';
    message: string;
    issues?: string[];
  };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined).map(canonicalize);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, canonicalize(item)]),
  );
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value)) ?? 'null';
}

export async function createBackup(
  data: AppData,
  options: { exportedAt: string; digest: (text: string) => Promise<string> },
): Promise<string> {
  if (!z.string().datetime().safeParse(options.exportedAt).success) {
    throw new BackupExportError('The export timestamp is invalid; no file was written.');
  }
  const validation = validateImportData(data);
  if (!validation.ok) {
    throw new BackupExportError(`This data cannot be imported as a backup (${validation.issues[0] ?? validation.reason}); no file was written.`);
  }
  if (canonicalJson(validation.data) !== canonicalJson(data)) {
    throw new BackupExportError('This data would change when imported; export was cancelled before writing a file.');
  }
  const checksum = await options.digest(canonicalJson(data));
  const text = JSON.stringify({
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: options.exportedAt,
    checksum: { algorithm: 'sha256', value: checksum },
    data,
  }, null, 2);
  if (text.length > MAX_BACKUP_CHARS) {
    throw new BackupExportError(
      `This backup is ${text.length.toLocaleString('en-US')} characters; the import limit is ${MAX_BACKUP_CHARS.toLocaleString('en-US')} characters. No file was written.`,
    );
  }
  return text;
}

export class BackupExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupExportError';
  }
}

function zodIssues(error: z.ZodError): string[] {
  return error.issues.slice(0, 10).map((issue) => `${issue.path.join('.') || 'data'}: ${issue.message}`);
}

export function validateImportData(data: unknown):
  | { ok: true; data: AppData }
  | { ok: false; reason: 'invalid-data' | 'integrity'; issues: string[] } {
  const parsed = importDataSchema.safeParse(data);
  if (!parsed.success) return { ok: false, reason: 'invalid-data', issues: zodIssues(parsed.error) };
  const validAppData = appDataSchema.safeParse(parsed.data);
  if (!validAppData.success) {
    return { ok: false, reason: 'invalid-data', issues: zodIssues(validAppData.error) };
  }
  const appData = validAppData.data;
  const transactionDates = appData.transactions.map((transaction) => transaction.date);
  const repaired: AppData = appData.goals.some((goal) => goal.auto === 'ef')
    ? appData
    : {
      ...appData,
      goals: ensureEfGoal(appData.goals, {
        expenseBaseline: 0,
        asOf: transactionDates.sort()[0] ?? '2000-01-01',
      }),
    };
  const integrityIssues = validateIntegrity(repaired);
  if (integrityIssues.length > 0) {
    return { ok: false, reason: 'integrity', issues: integrityIssues.slice(0, 10).map((issue) => `${issue.path.join('.') || 'data'}: ${issue.message}`) };
  }
  return { ok: true, data: repaired };
}

export async function parseBackup(
  raw: string,
  options: { digest: (text: string) => Promise<string>; today?: ISODate; newId?: () => string },
): Promise<ParseBackupResult> {
  if (raw.length > MAX_BACKUP_CHARS) {
    return { ok: false, reason: 'too-large', message: 'This file is too large to import.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json', message: 'This file is not readable as a backup.' };
  }
  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success || envelope.data.app !== BACKUP_APP) {
    return { ok: false, reason: 'not-a-backup', message: 'This file is not a Wealth Wise backup.' };
  }
  const value = envelope.data;
  if (value.formatVersion > BACKUP_FORMAT_VERSION || value.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, reason: 'newer-version', message: 'This backup was made by a newer version of Wealth Wise. Update the app before importing it.' };
  }
  if (value.formatVersion !== BACKUP_FORMAT_VERSION || value.schemaVersion < 1) {
    return { ok: false, reason: 'unsupported-version', message: 'This backup format is no longer supported.' };
  }
  const digest = await options.digest(canonicalJson(value.data));
  if (digest !== value.checksum.value) {
    return { ok: false, reason: 'checksum-mismatch', message: "This file was changed after it was exported, so it can't be trusted." };
  }
  let migrated: unknown = value.data;
  try {
    if (value.schemaVersion < SCHEMA_VERSION) {
      if (!options.today || !options.newId) {
        return { ok: false, reason: 'unsupported-version', message: 'This backup version cannot be imported by this app.' };
      }
      migrated = migratePersisted(value.data, value.schemaVersion, {
        today: options.today,
        newId: options.newId,
      });
    }
  } catch {
    return { ok: false, reason: 'unsupported-version', message: 'This backup version cannot be imported by this app.' };
  }
  const validated = validateImportData(migrated);
  if (!validated.ok) {
    return {
      ok: false,
      reason: validated.reason,
      message: validated.reason === 'integrity'
        ? 'Some records in this file do not match each other, so it cannot be imported safely.'
        : 'Some information in this file is invalid, so it cannot be imported.',
      issues: validated.issues,
    };
  }
  return {
    ok: true,
    data: validated.data,
    exportedAt: value.exportedAt,
    summary: summarizeData(validated.data),
  };
}

export function summarizeData(data: AppData): BackupSummary {
  const dates = data.transactions.map((transaction) => transaction.date).sort();
  return {
    transactions: data.transactions.length,
    goals: data.goals.length,
    holdings: data.holdings.length,
    plans: data.holdings.filter((holding) => holding.kind === 'plan').length,
    liabilities: data.liabilities.length,
    policies: data.policies.length,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
  };
}

export function backupFileName(exportedAt: string): string {
  const date = new Date(exportedAt);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid export date');
  const iso = date.toISOString();
  return `wealthwise-backup-${iso.slice(0, 10).replaceAll('-', '')}-${iso.slice(11, 16).replaceAll(':', '')}Z.json`;
}

export function encryptedBackupFileName(exportedAt: string): string {
  return backupFileName(exportedAt).replace('.json', '-encrypted.json');
}
