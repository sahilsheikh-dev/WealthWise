import { z } from 'zod';

import { ensureEfGoal } from './goals';
import { validateIntegrity } from './links';
import { migratePersisted } from '../data/migrate';
import { appDataSchema, SCHEMA_VERSION } from './schemas';
import type { AppData, ISODate } from './types';

export const BACKUP_APP = 'wealthwise';
export const BACKUP_FORMAT_VERSION = 1;
export const MAX_BACKUP_CHARS = 5_000_000;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((date) => date >= '1990-01-01' && date <= '2100-12-31');
const idSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const money = z.number().finite().max(100_000_000_000).min(-100_000_000_000);
const positiveMoney = money.positive();
const note = z.string().max(200);
const name = z.string().max(80);
const investmentEntrySchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: positiveMoney, note,
  kind: z.enum(['Deposit', 'Withdrawal']),
});
const liabilityPaymentSchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: positiveMoney, note,
  kind: z.enum(['EMI', 'Prepayment', 'Payment']),
});
const transactionSchema = z.strictObject({
  id: idSchema,
  type: z.enum(['income', 'expense', 'invest']),
  amount: positiveMoney,
  category: z.string().max(60),
  note,
  date: dateSchema,
  source: z.strictObject({
    kind: z.enum(['holding-entry', 'liability-payment', 'ef-entry']),
    parentId: idSchema,
    entryId: idSchema,
  }).optional(),
});
const goalSchema = z.strictObject({
  id: idSchema, name, target: money, saved: money, year: z.number().int(),
  auto: z.literal('ef').optional(),
});
const holdingType = z.enum([
  'Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit',
  'EPFO / PF', 'Savings account', 'Cash', 'Gold', 'Silver', 'Other',
]);
const manualHoldingSchema = z.strictObject({
  id: idSchema, kind: z.literal('manual'), name, type: holdingType,
  invested: money, value: money, valueAsOf: dateSchema.optional(),
  logs: z.array(investmentEntrySchema).max(100_000),
});
const planHoldingSchema = z.strictObject({
  id: idSchema, kind: z.literal('plan'), name, type: holdingType,
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
const recurringLiabilitySchema = z.strictObject({
  ...liabilityCommon, kind: z.literal('recurring'),
  tenureMonths: z.number().int().min(1).max(1200), emi: positiveMoney,
});
const oneTimeLiabilitySchema = z.strictObject({
  ...liabilityCommon, kind: z.literal('one-time'), dueDate: dateSchema.nullable(),
}).superRefine((liability, context) => {
  if (liability.dueDate !== null && liability.dueDate < liability.startDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before the liability started' });
  }
});
const efEntrySchema = z.strictObject({
  id: idSchema, date: dateSchema, amount: money.refine((amount) => amount !== 0), note,
});
export const importDataSchema = z.strictObject({
  settings: z.strictObject({ name, theme: z.enum(['system', 'dark', 'light']) }),
  transactions: z.array(transactionSchema).max(100_000),
  goals: z.array(goalSchema).max(100_000),
  holdings: z.array(z.discriminatedUnion('kind', [manualHoldingSchema, planHoldingSchema])).max(100_000),
  liabilities: z.array(z.discriminatedUnion('kind', [recurringLiabilitySchema, oneTimeLiabilitySchema])).max(100_000),
  efEntries: z.array(efEntrySchema).max(100_000),
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
  efEntries: number;
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
  const checksum = await options.digest(canonicalJson(data));
  return JSON.stringify({
    app: BACKUP_APP,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: options.exportedAt,
    checksum: { algorithm: 'sha256', value: checksum },
    data,
  }, null, 2);
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
        asOf: transactionDates.sort()[0] ?? appData.efEntries[0]?.date ?? '2000-01-01',
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
  options: { digest: (text: string) => Promise<string> },
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
  if (value.formatVersion !== BACKUP_FORMAT_VERSION) {
    return { ok: false, reason: 'unsupported-version', message: 'This backup format is no longer supported.' };
  }
  const digest = await options.digest(canonicalJson(value.data));
  if (digest !== value.checksum.value) {
    return { ok: false, reason: 'checksum-mismatch', message: "This file was changed after it was exported, so it can't be trusted." };
  }
  let migrated: unknown = value.data;
  try {
    migrated = migratePersisted(value.data, value.schemaVersion);
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
    efEntries: data.efEntries.length,
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
