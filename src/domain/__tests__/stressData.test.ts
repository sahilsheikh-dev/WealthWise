import { mockAppData } from '../../mock/data';
import { netWorth } from '../summary';
import {
  createStressData,
  createStressTransactions,
  STRESS_HOLDING_COUNT,
  STRESS_MONTHLY_TRANSACTION_COUNT,
  STRESS_TRANSACTION_COUNT,
  STRESS_YEARS,
} from '../stressData';
import { appDataSchema, SCHEMA_VERSION } from '../schemas';
import type { ISODate, RecurringLiability } from '../types';
import { storageLevel, utf8ByteLength } from '../../lib/storageGuard';
import { encryptBackup, decryptBackup } from '../backupCrypto';
import { canonicalJson, createBackup, MAX_BACKUP_CHARS, parseBackup, validateImportData } from '../backup';
import { monthKey } from '../dates';
import { monthSummary } from '../transactions';
import { budgetOverview } from '../budget';
import { pendingItems } from '../pending';
import { planReminders } from '../reminders';
import { migratePersisted } from '../../data/migrate';
import { createAppStore } from '../../data/createAppStore';
import type { StateStorage } from 'zustand/middleware';

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = sorted[Math.floor(sorted.length / 2)];
  if (middle === undefined) throw new Error('Cannot compute the median of an empty sample.');
  return middle;
}

async function medianDuration(operation: () => void | Promise<void>): Promise<number> {
  const samples: number[] = [];
  for (let sample = 0; sample < 5; sample += 1) {
    const started = performance.now();
    await operation();
    samples.push(performance.now() - started);
  }
  return median(samples);
}

class BenchmarkStorage implements StateStorage {
  readonly values = new Map<string, string>();
  writes = 0;
  lastWrite: Promise<void> = Promise.resolve();

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): Promise<void> {
    this.writes += 1;
    this.lastWrite = Promise.resolve().then(() => { this.values.set(name, value); });
    return this.lastWrite;
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

async function measureHydrationAndAction(data: ReturnType<typeof createStressData>): Promise<{ hydrateMs: number; writeMs: number }> {
  const storage = new BenchmarkStorage();
  storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data }, version: SCHEMA_VERSION }));
  let id = 0;
  const started = performance.now();
  const store = createAppStore(storage, {
    today: () => today,
    newId: () => `benchmark-${++id}`,
    isDev: false,
  });
  if (!store.getState().hydrated) {
    await new Promise<void>((resolve) => {
      const unsubscribe = store.subscribe((state) => {
        if (state.hydrated) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
  const hydrateMs = performance.now() - started;
  const writesBefore = storage.writes;
  const writeStarted = performance.now();
  store.getState().actions.updateSettings({ name: 'Benchmark action' });
  await storage.lastWrite;
  const writeMs = performance.now() - writeStarted;
  if (storage.writes - writesBefore !== 1) throw new Error('Benchmark action did not produce exactly one write.');
  return { hydrateMs, writeMs };
}

const today: ISODate = '2026-11-04';
const stressBenchmark = process.env.WEALTHWISE_STRESS_BENCHMARK === '1' ? it : it.skip;

function stressOptions(years: 50 | 100 | 126, dense = false) {
  return {
    today,
    years,
    seed: 0x29_51_0,
    dense,
    newId: (() => {
      let id = 0;
      return () => `stress-${++id}`;
    })(),
  };
}

describe('storage calibration data', () => {
  it('covers a year of daily entries, demo data, and 20,000 stress transactions', () => {
    let id = 0;
    const dailySip = Array.from({ length: 365 }, (_, index) => ({
      id: `daily-${index}`,
      type: 'invest',
      amount: 500,
      category: 'Daily SIP',
      note: 'Daily contribution',
      date: '2026-01-01',
    }));
    const stress = createStressTransactions('2026-10-10', () => `stress-${++id}`);
    const dailyBytes = utf8ByteLength(JSON.stringify(dailySip));
    const demoBytes = utf8ByteLength(JSON.stringify(mockAppData));
    const stressBytes = utf8ByteLength(JSON.stringify(stress));

    expect(dailySip).toHaveLength(365);
    expect(stress).toHaveLength(STRESS_TRANSACTION_COUNT);
    expect(storageLevel(dailyBytes)).toBe('ok');
    expect(storageLevel(demoBytes)).toBe('ok');
    expect(storageLevel(stressBytes)).toBe('critical');
  });

  it('generates deterministic valid transaction types and injected identifiers', () => {
    const transactions = createStressTransactions('2026-10-10', (() => {
      let id = 0;
      return () => `stress-${++id}`;
    })());

    expect(transactions.slice(0, 3)).toEqual([
      { id: 'stress-1', type: 'invest', amount: 1, category: 'Investment', note: 'Stress test transaction 1', date: '2026-10-10' },
      { id: 'stress-2', type: 'expense', amount: 2, category: 'Stress expense', note: 'Stress test transaction 2', date: '2026-10-10' },
      { id: 'stress-3', type: 'income', amount: 3, category: 'Stress income', note: 'Stress test transaction 3', date: '2026-10-10' },
    ]);
    expect(new Set(transactions.map(({ id }) => id)).size).toBe(STRESS_TRANSACTION_COUNT);
  });

  it.each(STRESS_YEARS)('generates a deterministic %i-year AppData fixture ending today', (years) => {
    const data = createStressData(stressOptions(years));
    const sameData = createStressData(stressOptions(years));

    expect(data).toEqual(sameData);
    expect(data.transactions).toHaveLength(years * 12 * STRESS_MONTHLY_TRANSACTION_COUNT);
    expect(data.holdings).toHaveLength(STRESS_HOLDING_COUNT);
    expect(data.holdings.every((holding) => holding.kind === 'manual' && holding.logs.length === years * 12)).toBe(true);
    expect(data.liabilities).toHaveLength(6);
    const recurringLiabilities = data.liabilities.filter(
      (liability): liability is RecurringLiability => liability.kind === 'recurring',
    );
    expect(recurringLiabilities.filter(({ settlement }) => settlement?.balance === 0)).toHaveLength(3);
    expect(recurringLiabilities.filter(({ settlement }) => settlement === null)).toHaveLength(3);
    expect(data.policies).toHaveLength(3);
    expect(data.goals).toHaveLength(3);
    expect(data.goals.filter(({ name }) => name.startsWith('Stress '))).toHaveLength(2);
    expect(data.monthBudgets).toHaveLength(years * 12);
    expect(data.transactions.at(-1)?.date).toBe(today);
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(Number.isFinite(netWorth(data, today).netWorth)).toBe(true);
  });

  it('generates a dense 200-year record count inside the supported 126-year date window', () => {
    const data = createStressData(stressOptions(126, true));

    expect(data.transactions).toHaveLength(200 * 12 * STRESS_MONTHLY_TRANSACTION_COUNT);
    expect(data.holdings).toHaveLength(STRESS_HOLDING_COUNT + 1);
    expect(data.holdings.slice(0, STRESS_HOLDING_COUNT).every(
      (holding) => holding.kind === 'manual' && holding.logs.length === 200 * 12,
    )).toBe(true);
    const dailySip = data.holdings.at(-1);
    expect(dailySip?.kind).toBe('plan');
    expect(dailySip?.logs).toHaveLength(200 * 365);
    expect(data.monthBudgets).toHaveLength(126 * 12);
    expect(data.transactions[0]?.date).toBe('1900-12-01');
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(validateImportData(data).ok).toBe(true);
  });

  stressBenchmark('measures five-sample final-model persistence, selectors, and backups by tier', async () => {
    const tiers = [
      ...STRESS_YEARS.map((years) => ({ years, dense: false })),
      { years: 126 as const, dense: true },
    ];
    const rows: {
      tier: string;
      stateBytes: number;
      transactions: number;
      holdingEntries: number;
      monthBudgets: number;
      export: string;
      plainExportImportMs: string;
      encrypted: string;
      encryptedExportImportMs: string;
      validateMigrateMs: string;
      hydrateWriteMs: string;
      selectorsMs: string;
      heapUsedBytes: number;
    }[] = [];

    for (const { years, dense } of tiers) {
      const data = createStressData(stressOptions(years, dense));
      const stateBytes = median(Array.from({ length: 5 }, () =>
        utf8ByteLength(JSON.stringify({ state: { data }, version: SCHEMA_VERSION }))));
      const validationMs = await medianDuration(() => {
        const validation = validateImportData(data);
        if (!validation.ok) throw new Error(validation.issues[0] ?? validation.reason);
      });
      const migrationMs = await medianDuration(() => {
        migratePersisted(data, SCHEMA_VERSION);
      });
      const hydrateAndWrite = [];
      for (let sample = 0; sample < 5; sample += 1) hydrateAndWrite.push(await measureHydrationAndAction(data));

      const month = monthKey(today);
      const selectorTimes = {
        netWorth: await medianDuration(() => { netWorth(data, today); }),
        month: await medianDuration(() => { monthSummary(data.transactions, month); }),
        budget: await medianDuration(() => { budgetOverview(data, month, today); }),
        pending: await medianDuration(() => { pendingItems(data, month, today); }),
        reminders: await medianDuration(() => {
          planReminders(data, {
            enabled: true,
            localTime: '08:00',
            dayBefore: true,
            sameDay: true,
            showAmounts: false,
            hidePreviews: true,
          }, new Date(`${today}T08:00:00`), 500);
        }),
      };

      const exportMessages: string[] = [];
      let plainText: string | null = null;
      let plainExportCount = 0;
      const plainExportMs = await medianDuration(async () => {
        try {
          const text = await createBackup(data, {
            exportedAt: '2026-11-04T00:00:00.000Z',
            digest: async () => '0'.repeat(64),
          });
          plainText ??= text;
          plainExportCount += 1;
        } catch (error) {
          if (!(error instanceof Error)) throw error;
          exportMessages.push(error.message);
        }
      });

      let plainBackupImportMs: number | null = null;
      let encryptedLength = 'refused at plain export';
      let encryptedExportImportMs = 'refused at plain export';
      if (plainExportCount > 0) {
        if (!plainText) throw new Error('Plain backup export produced no data.');
        const plainBackupText = plainText;
        plainBackupImportMs = await medianDuration(async () => {
          const imported = await parseBackup(plainBackupText, { digest: async () => '0'.repeat(64) });
          if (!imported.ok || canonicalJson(imported.data) !== canonicalJson(data)) {
            throw new Error(imported.ok ? 'Plain backup changed data.' : imported.message);
          }
        });
        let encryptedText: string | null = null;
        const encryptedExportMs = await medianDuration(async () => {
          const text = await encryptBackup(plainBackupText, 'stress test passphrase', {
            salt: new Uint8Array(16).fill(1),
            nonce: new Uint8Array(12).fill(2),
            kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
          });
          encryptedText ??= text;
        });
        if (!encryptedText) throw new Error('Encrypted backup export produced no data.');
        const encryptedBackupText = encryptedText;
        const encryptedImportMs = await medianDuration(async () => {
          const plain = await decryptBackup(encryptedBackupText, 'stress test passphrase');
          const imported = await parseBackup(plain, { digest: async () => '0'.repeat(64) });
          if (!imported.ok || canonicalJson(imported.data) !== canonicalJson(data)) {
            throw new Error(imported.ok ? 'Encrypted backup changed data.' : imported.message);
          }
        });
        encryptedLength = String(utf8ByteLength(encryptedBackupText));
        encryptedExportImportMs = `${Math.round(encryptedExportMs)} / ${Math.round(encryptedImportMs)}`;
      }

      if (exportMessages.length > 0) {
        expect(exportMessages.every((message) => message.includes(
          `import limit is ${MAX_BACKUP_CHARS.toLocaleString('en-US')} characters`,
        ))).toBe(true);
      }
      const hydrateMs = median(hydrateAndWrite.map(({ hydrateMs: time }) => time));
      const writeMs = median(hydrateAndWrite.map(({ writeMs: time }) => time));
      const heapUsedBytes = process.memoryUsage().heapUsed;
      rows.push({
        tier: dense ? 'dense (200y records + daily SIP)' : `${years}y`,
        stateBytes,
        transactions: data.transactions.length,
        holdingEntries: data.holdings.reduce((count, holding) => count + holding.logs.length, 0),
        monthBudgets: data.monthBudgets?.length ?? 0,
        export: plainExportCount > 0
          ? `accepted: ${utf8ByteLength(plainText ?? '')} bytes`
          : exportMessages[0] ?? 'refused without explanation',
        plainExportImportMs: plainBackupImportMs === null
          ? 'refused'
          : `${Math.round(plainExportMs)} / ${Math.round(plainBackupImportMs)}`,
        encrypted: encryptedLength,
        encryptedExportImportMs,
        validateMigrateMs: `${Math.round(validationMs)} / ${Math.round(migrationMs)}`,
        hydrateWriteMs: `${Math.round(hydrateMs)} / ${Math.round(writeMs)}`,
        selectorsMs: Object.values(selectorTimes).map(Math.round).join(' / '),
        heapUsedBytes,
      });
    }

    console.table(rows);
    expect(rows).toHaveLength(4);
    expect(rows.slice(0, 3).map(({ tier }) => tier)).toEqual(['50y', '100y', '126y']);
    expect(rows.slice(1).every(({ export: exportResult }) => exportResult.includes('import limit'))).toBe(true);
    expect(rows[0]?.export).toContain('accepted');
    const first = rows[0];
    if (!first) throw new Error('50-year stress row is missing.');
    const [hydrateMs, actionWriteMs] = first.hydrateWriteMs.split(' / ').map(Number);
    if (hydrateMs === undefined || actionWriteMs === undefined) {
      throw new Error('50-year hydration/write samples are missing.');
    }
    expect(hydrateMs).toBeLessThan(2_000);
    expect(actionWriteMs).toBeLessThan(100);
  }, 180_000);

  it('round-trips the 50-year tier plain and encrypted, and refuses oversize exports clearly', async () => {
    const data = createStressData(stressOptions(50));
    const plain = await createBackup(data, {
      exportedAt: '2026-11-04T00:00:00.000Z',
      digest: async () => '0'.repeat(64),
    });
    const plainImport = await parseBackup(plain, { digest: async () => '0'.repeat(64) });
    expect(plainImport.ok).toBe(true);
    if (!plainImport.ok) throw new Error(plainImport.message);
    expect(plainImport.data).toEqual(data);

    const encrypted = await encryptBackup(plain, 'stress test passphrase', {
      salt: new Uint8Array(16).fill(1),
      nonce: new Uint8Array(12).fill(2),
      kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
    });
    const decrypted = await decryptBackup(encrypted, 'stress test passphrase');
    const encryptedImport = await parseBackup(decrypted, { digest: async () => '0'.repeat(64) });
    expect(encryptedImport.ok).toBe(true);
    if (!encryptedImport.ok) throw new Error(encryptedImport.message);
    expect(encryptedImport.data).toEqual(data);
  }, 30_000);

  it('requires a dense 126-year tier for compressed 200-year records', () => {
    expect(() => createStressData(stressOptions(100, true))).toThrow('only at 126 years');
    expect(() => createStressData({ ...stressOptions(50), seed: Number.NaN })).toThrow('safe integer');
  });
});
