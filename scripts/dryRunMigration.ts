import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

import { MAX_SCHEDULED_REMINDERS } from '../src/lib/reminderScheduler';
import {
  canonicalJson,
  parseBackup,
  validateImportData,
} from '../src/domain/backup';
import { decryptBackup, isEncryptedBackup } from '../src/domain/backupCrypto';
import { liabilitySummary } from '../src/domain/liability';
import { createPendingItemsReader } from '../src/domain/pending';
import { holdingInvested, holdingValue } from '../src/domain/portfolio';
import { planReminders } from '../src/domain/reminders';
import { netWorth } from '../src/domain/summary';
import { addMonths, monthKey, shiftMonth } from '../src/domain/dates';
import { appDataSchema, SCHEMA_VERSION } from '../src/domain/schemas';
import { goalSavedFor } from '../src/domain/goalLinks';
import type { AppData, ISODate } from '../src/domain/types';

const DEFAULT_BACKUP_PATH = join(
  homedir(),
  'Downloads',
  'wealthwise-backup-20261104-1810Z.json',
);

type BackupHeader = {
  schemaVersion: number;
  data: unknown;
};

type HoldingValues = {
  id: string;
  type: string;
  invested: number;
  value: number;
};

type ReminderRow = {
  dueDate: ISODate;
  kind: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function backupHeader(raw: string): BackupHeader {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || typeof parsed.schemaVersion !== 'number' || !('data' in parsed)) {
    throw new Error('InvalidBackupEnvelope');
  }
  return { schemaVersion: parsed.schemaVersion, data: parsed.data };
}

function todayISO(): ISODate {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function idFactory() {
  let next = 0;
  return () => `dry-run-migration-${next++}`;
}

function holdingValues(data: AppData, asOf: ISODate): HoldingValues[] {
  return data.holdings.map((holding) => ({
    id: holding.id,
    type: holding.type,
    invested: holdingInvested(holding),
    value: holdingValue(holding, asOf),
  }));
}

function reportHorizon(data: AppData, today: ISODate): string {
  let last = shiftMonth(monthKey(today), 24);
  const extendTo = (date: ISODate) => {
    const candidate = monthKey(date);
    if (candidate > last) last = candidate;
  };
  for (const holding of data.holdings) {
    if (holding.kind === 'plan') {
      extendTo(addMonths(holding.startDate, holding.tenureYears * 12));
    }
  }
  for (const liability of data.liabilities) {
    if (liability.kind === 'recurring') {
      extendTo(addMonths(liability.startDate, liability.tenureMonths));
    } else if (liability.dueDate) {
      extendTo(liability.dueDate);
    }
  }
  for (const policy of data.policies) {
    extendTo(policy.trackFrom);
    if (policy.endDate) extendTo(policy.endDate);
  }
  for (const budget of data.monthBudgets ?? []) {
    if (budget.month > last) last = budget.month;
  }
  return last;
}

function reportStart(data: AppData, today: ISODate): string {
  let first = monthKey(today);
  const extendTo = (date: ISODate) => {
    const candidate = monthKey(date);
    if (candidate < first) first = candidate;
  };
  for (const holding of data.holdings) {
    if (holding.kind === 'plan') extendTo(holding.trackFrom);
  }
  for (const liability of data.liabilities) extendTo(liability.startDate);
  for (const policy of data.policies) extendTo(policy.trackFrom);
  for (const budget of data.monthBudgets ?? []) {
    if (budget.month < first) first = budget.month;
  }
  return first;
}

function dueSummary(data: AppData, today: ISODate): Record<string, { count: number; amount: number }> {
  const totals: Record<string, { count: number; amount: number }> = {};
  const firstMonth = reportStart(data, today);
  const lastMonth = reportHorizon(data, today);
  const getPendingItems = createPendingItemsReader(data, today);
  for (let month = firstMonth; month <= lastMonth; month = shiftMonth(month, 1)) {
    for (const item of getPendingItems(month)) {
      if (item.kind !== 'due') continue;
      const key = `${month}|${item.status}|${item.source.kind}`;
      const current = totals[key] ?? { count: 0, amount: 0 };
      current.count += 1;
      current.amount += item.amount;
      totals[key] = current;
    }
  }
  return Object.fromEntries(Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)));
}

function reminderSummary(data: AppData, today: ISODate): ReminderRow[] {
  const [yearText, monthText, dayText] = today.split('-');
  const now = new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
    8,
    0,
  );
  const reminders = planReminders(
    data,
    {
      enabled: true,
      localTime: '09:00',
      dayBefore: true,
      sameDay: true,
      showAmounts: false,
      hidePreviews: true,
    },
    now,
    MAX_SCHEDULED_REMINDERS,
  );
  return reminders
    .map((reminder) => ({ dueDate: reminder.target.dueDate, kind: reminder.kind }))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate) || left.kind.localeCompare(right.kind));
}

function reminderTotals(reminders: ReminderRow[]) {
  const totals: Record<string, { count: number; firstDue: ISODate; lastDue: ISODate }> = {};
  for (const reminder of reminders) {
    const current = totals[reminder.kind];
    if (!current) {
      totals[reminder.kind] = { count: 1, firstDue: reminder.dueDate, lastDue: reminder.dueDate };
      continue;
    }
    current.count += 1;
    if (reminder.dueDate < current.firstDue) current.firstDue = reminder.dueDate;
    if (reminder.dueDate > current.lastDue) current.lastDue = reminder.dueDate;
  }
  return totals;
}

function pendingDueTotals(dues: ReturnType<typeof dueSummary>) {
  const totals: Record<string, { count: number; amount: number }> = {};
  for (const [key, value] of Object.entries(dues)) {
    const [, status, kind] = key.split('|');
    const totalKey = `${kind}|${status}`;
    const current = totals[totalKey] ?? { count: 0, amount: 0 };
    current.count += value.count;
    current.amount += value.amount;
    totals[totalKey] = current;
  }
  return Object.fromEntries(Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)));
}

function snapshot(data: AppData, today: ISODate) {
  const worth = netWorth(data, today);
  const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
  const dues = dueSummary(data, today);
  const reminders = reminderSummary(data, today);
  return {
    holdings: holdingValues(data, today),
    netWorth: worth.netWorth,
    assets: worth.assets,
    emergencyFundAvailable: emergencyGoal ? goalSavedFor(emergencyGoal, data, today) : 0,
    goals: data.goals.map((goal) => goalSavedFor(goal, data, today)),
    liabilities: data.liabilities.reduce(
      (total, liability) => total + liabilitySummary(liability, today, 0).balance,
      0,
    ),
    counts: {
      transactions: data.transactions.length,
      holdings: data.holdings.length,
      policies: data.policies.length,
    },
    pendingDues: dues,
    pendingDuesTotals: pendingDueTotals(dues),
    reminders,
    reminderTotals: reminderTotals(reminders),
  };
}

function amount(value: number | undefined): string {
  return value === undefined ? '—' : value.toFixed(2);
}

function printHoldingTable(before: HoldingValues[], after: HoldingValues[]): void {
  const afterById = new Map(after.map((holding) => [holding.id, holding]));
  const rows = before.map((oldHolding, index) => {
    const newHolding = afterById.get(oldHolding.id);
    afterById.delete(oldHolding.id);
    return {
      Holding: `Holding ${String(index + 1).padStart(2, '0')}`,
      Type: oldHolding.type,
      'Old invested': amount(oldHolding.invested),
      'New invested': amount(newHolding?.invested),
      'Old current value': amount(oldHolding.value),
      'New current value': amount(newHolding?.value),
    };
  });
  for (const newHolding of afterById.values()) {
    rows.push({
      Holding: `Added holding ${rows.length + 1}`,
      Type: newHolding.type,
      'Old invested': '—',
      'New invested': amount(newHolding.invested),
      'Old current value': '—',
      'New current value': amount(newHolding.value),
    });
  }
  console.table(rows);
}

function reportDifferences(before: ReturnType<typeof snapshot>, after: ReturnType<typeof snapshot>, sourceVersion: number): number {
  const differences: { path: string; before: unknown; after: unknown; cause: string }[] = [];
  const compare = (path: string, oldValue: unknown, newValue: unknown) => {
    if (typeof oldValue === 'number' && typeof newValue === 'number') {
      if (Math.abs(oldValue - newValue) > 1e-8) {
        differences.push({
          path,
          before: oldValue,
          after: newValue,
          cause: `The v${sourceVersion}→v${SCHEMA_VERSION} backup-import migration pipeline changed this derived value; inspect the migration transition(s) for this field.`,
        });
      }
      return;
    }
    if (canonicalJson(oldValue) !== canonicalJson(newValue)) {
      differences.push({
        path,
        before: oldValue,
        after: newValue,
        cause: `The v${sourceVersion}→v${SCHEMA_VERSION} backup-import migration pipeline changed this derived output; inspect the migration transition(s) affecting this selector.`,
      });
    }
  };

  compare('netWorth', before.netWorth, after.netWorth);
  compare('assets', before.assets, after.assets);
  compare('emergencyFundAvailable', before.emergencyFundAvailable, after.emergencyFundAvailable);
  compare('liabilities', before.liabilities, after.liabilities);
  compare('counts', before.counts, after.counts);
  const dueKeys = new Set([...Object.keys(before.pendingDues), ...Object.keys(after.pendingDues)]);
  for (const key of dueKeys) {
    compare(`pendingDues[${key}]`, before.pendingDues[key], after.pendingDues[key]);
  }
  const beforeReminderDates = new Map<string, number>();
  const afterReminderDates = new Map<string, number>();
  for (const reminder of before.reminders) {
    const key = `${reminder.dueDate}|${reminder.kind}`;
    beforeReminderDates.set(key, (beforeReminderDates.get(key) ?? 0) + 1);
  }
  for (const reminder of after.reminders) {
    const key = `${reminder.dueDate}|${reminder.kind}`;
    afterReminderDates.set(key, (afterReminderDates.get(key) ?? 0) + 1);
  }
  const reminderKeys = new Set([...beforeReminderDates.keys(), ...afterReminderDates.keys()]);
  for (const key of reminderKeys) {
    compare(`reminders[${key}]`, beforeReminderDates.get(key) ?? 0, afterReminderDates.get(key) ?? 0);
  }
  const goalCount = Math.max(before.goals.length, after.goals.length);
  for (let index = 0; index < goalCount; index += 1) {
    compare(`goal[${String(index + 1).padStart(2, '0')}].saved`, before.goals[index], after.goals[index]);
  }
  const afterHoldings = new Map(after.holdings.map((holding) => [holding.id, holding]));
  const beforeHoldingIds = new Set(before.holdings.map((holding) => holding.id));
  for (let index = 0; index < before.holdings.length; index += 1) {
    const oldHolding = before.holdings[index];
    if (!oldHolding) continue;
    const newHolding = afterHoldings.get(oldHolding.id);
    compare(`holding[${String(index + 1).padStart(2, '0')}].invested`, oldHolding.invested, newHolding?.invested);
    compare(`holding[${String(index + 1).padStart(2, '0')}].currentValue`, oldHolding.value, newHolding?.value);
  }
  for (let index = 0; index < after.holdings.length; index += 1) {
    const newHolding = after.holdings[index];
    if (!newHolding || beforeHoldingIds.has(newHolding.id)) continue;
    compare(`addedHolding[${String(index + 1).padStart(2, '0')}].invested`, undefined, newHolding.invested);
    compare(`addedHolding[${String(index + 1).padStart(2, '0')}].currentValue`, undefined, newHolding.value);
  }

  if (differences.length === 0) {
    console.log('Differences: none.');
    return 0;
  }
  console.log(`Differences: ${differences.length}.`);
  for (const difference of differences) {
    console.log(`${difference.path}: before=${JSON.stringify(difference.before)} after=${JSON.stringify(difference.after)}`);
    console.log(`  Cause: ${difference.cause}`);
  }
  return differences.length;
}

async function main(): Promise<void> {
  const backupPath = process.argv[2] ?? DEFAULT_BACKUP_PATH;
  const rawFile = await readFile(backupPath, 'utf8');
  let plainBackup = rawFile;
  if (isEncryptedBackup(rawFile)) {
    const passphrase = process.env.WEALTHWISE_BACKUP_PASSPHRASE;
    if (!passphrase) {
      console.error('Encrypted backup detected; set WEALTHWISE_BACKUP_PASSPHRASE in the environment.');
      process.exitCode = 2;
      return;
    }
    plainBackup = await decryptBackup(rawFile, passphrase);
  }

  const header = backupHeader(plainBackup);
  const today = todayISO();
  const imported = await parseBackup(plainBackup, {
    digest: async (text) => createHash('sha256').update(text).digest('hex'),
    today,
    newId: idFactory(),
  });
  if (!imported.ok) {
    console.error(`Backup import pipeline rejected the file (${imported.reason}); no personal fields were printed.`);
    process.exitCode = 2;
    return;
  }
  const sourceSchema = appDataSchema.safeParse(header.data);
  if (!sourceSchema.success) {
    console.error(`Source schema v${header.schemaVersion} cannot be measured by the current pre-migration selectors; migration completed but comparison is incomplete.`);
    console.log(`Migrated data validated at schema v${SCHEMA_VERSION}; the source payload was not displayed.`);
    process.exitCode = 2;
    return;
  }
  const beforeValidation = validateImportData(sourceSchema.data);
  if (!beforeValidation.ok) {
    console.error(`Source data is not valid for a pre-migration comparison (${beforeValidation.reason}); no personal fields were printed.`);
    process.exitCode = 2;
    return;
  }

  const before = snapshot(beforeValidation.data, today);
  const after = snapshot(imported.data, today);
  console.log(`Backup: ${basename(backupPath)} (contents and personal text fields are not printed)`);
  console.log(`Schema: v${header.schemaVersion} → v${SCHEMA_VERSION}; migrations executed through the real backup import pipeline.`);
  console.log(`As-of date: ${today}`);
  if (header.schemaVersion === SCHEMA_VERSION) {
    console.log('Migration path: no schema transition required; backup already uses the current schema.');
  } else {
    console.log(`Migration path: v${header.schemaVersion} → … → v${SCHEMA_VERSION}.`);
  }
  console.log('Reminder preview assumption: enabled, day-before and same-day at 09:00, amounts hidden; reminder preferences are not included in backup files.');
  console.log('\nHolding values (holding names and IDs are intentionally omitted):');
  printHoldingTable(before.holdings, after.holdings);
  console.log('\nSummary:');
  console.table([
    { Metric: 'Net worth', Before: amount(before.netWorth), After: amount(after.netWorth) },
    { Metric: 'Assets total', Before: amount(before.assets), After: amount(after.assets) },
    { Metric: 'Emergency fund available', Before: amount(before.emergencyFundAvailable), After: amount(after.emergencyFundAvailable) },
    { Metric: 'Liabilities total', Before: amount(before.liabilities), After: amount(after.liabilities) },
    { Metric: 'Transactions', Before: before.counts.transactions, After: after.counts.transactions },
    { Metric: 'Holdings', Before: before.counts.holdings, After: after.counts.holdings },
    { Metric: 'Policies', Before: before.counts.policies, After: after.counts.policies },
    { Metric: 'Pending dues by kind/status', Before: canonicalJson(before.pendingDuesTotals), After: canonicalJson(after.pendingDuesTotals) },
    { Metric: 'Reminder plan by kind', Before: canonicalJson(before.reminderTotals), After: canonicalJson(after.reminderTotals) },
  ]);
  console.log('\nGoal saved amounts (goals are numbered; names are omitted):');
  console.table(before.goals.map((value, index) => ({
    Goal: `Goal ${String(index + 1).padStart(2, '0')}`,
    Before: amount(value),
    After: amount(after.goals[index]),
  })));
  const differenceCount = reportDifferences(before, after, header.schemaVersion);
  if (differenceCount > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const errorType = error instanceof Error ? error.name : 'UnknownError';
  console.error(`Dry run failed (${errorType}); backup contents and personal text fields were not printed.`);
  process.exitCode = 2;
});
