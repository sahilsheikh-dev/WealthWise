import { mockAppData } from '../../mock/data';
import { createStressTransactions, STRESS_TRANSACTION_COUNT } from '../stressData';
import { storageLevel, utf8ByteLength } from '../../lib/storageGuard';

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
});
