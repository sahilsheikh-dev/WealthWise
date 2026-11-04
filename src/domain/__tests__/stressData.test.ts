import { mockAppData } from '../../mock/data';
import { validateImportData } from '../backup';
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

const today: ISODate = '2026-11-04';

function stressOptions(years: 50 | 100 | 200, dailySip = false) {
  return {
    today,
    years,
    seed: 0x29_51_0,
    dailySip,
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

  it('measures serialized bytes and records backup validation for each stress tier', () => {
    const rows = [...STRESS_YEARS.map((years) => ({ years, dailySip: false })), { years: 200 as const, dailySip: true }]
      .map(({ years, dailySip }) => {
        const byteSamples = Array.from({ length: 5 }, () => {
          const data = createStressData(stressOptions(years, dailySip));
          return utf8ByteLength(JSON.stringify({ state: { data }, version: SCHEMA_VERSION }));
        });
        const data = createStressData(stressOptions(years, dailySip));
        const sortedSamples = [...byteSamples].sort((left, right) => left - right);
        const validation = validateImportData(data);
        return {
          tier: dailySip ? `${years}y + daily SIP` : `${years}y`,
          medianBytesOf5: sortedSamples[2],
          transactions: data.transactions.length,
          holdingEntries: data.holdings.reduce((count, holding) => count + holding.logs.length, 0),
          monthBudgets: data.monthBudgets?.length ?? 0,
          importValidation: validation.ok ? 'accepted' : `${validation.reason}: ${validation.issues[0] ?? ''}`,
        };
      });

    console.table(rows);
    expect(rows).toHaveLength(4);
    expect(rows.slice(0, 3).map(({ tier }) => tier)).toEqual(['50y', '100y', '200y']);
  });

  it('requires an explicitly seeded 200-year tier for daily SIP data', () => {
    expect(() => createStressData(stressOptions(100, true))).toThrow('only at 200 years');
    expect(() => createStressData({ ...stressOptions(50), seed: Number.NaN })).toThrow('safe integer');
  });
});
