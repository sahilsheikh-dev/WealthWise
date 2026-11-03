import { holdingInvested, holdingValue } from '../portfolio';
import {
  absoluteGainAndReturn,
  calculateCagr,
  calculateXirr,
  investmentReturnSummary,
} from '../investmentReturns';
import type { InvestmentEntry, ManualHolding } from '../types';
import { allocateAmounts } from '../efAllocation';

function entry(id: string, date: string, amount: number, kind: 'Deposit' | 'Withdrawal' = 'Deposit'): InvestmentEntry {
  return { id, date, amount, note: '', kind };
}

describe('investment return reproduction and spec', () => {
  it('reproduces P29-H opening, back-dated, pattern and withdrawal outputs before the fix', () => {
    const manual = (
      id: string,
      invested: number,
      value: number,
      valueAsOf: string,
      logs: InvestmentEntry[],
      type: ManualHolding['type'] = 'Fixed deposit',
    ): ManualHolding => ({
      id,
      kind: 'manual',
      name: id,
      type,
      invested,
      value,
      valueAsOf,
      logs,
    });
    const fourMonthlyDeposits = [
      entry('month-1', '2024-02-01', 2_000),
      entry('month-2', '2024-03-01', 2_000),
      entry('month-3', '2024-04-01', 2_000),
      entry('month-4', '2024-05-01', 2_000),
    ];
    const summarizeOldOutput = (holding: ManualHolding, asOf: string) => {
      const currentValue = holdingValue(holding, asOf);
      const invested = holdingInvested(holding);
      const totalDeposits = holding.logs
        .filter((item) => item.kind === 'Deposit')
        .reduce((sum, item) => sum + item.amount, 0);
      const totalWithdrawals = holding.logs
        .filter((item) => item.kind === 'Withdrawal')
        .reduce((sum, item) => sum + item.amount, 0);
      const returns = absoluteGainAndReturn(holding.logs, currentValue, asOf);
      return {
        invested,
        currentValue,
        totalDeposits,
        totalWithdrawals,
        gain: returns.gain,
        returnPct: returns.absoluteReturnPct,
      };
    };

    expect(summarizeOldOutput(
      manual('opening-after-valuation', 73_000, 73_000, '2024-01-01', fourMonthlyDeposits),
      '2024-06-01',
    )).toEqual({
      invested: 81_000,
      currentValue: 81_000,
      totalDeposits: 8_000,
      totalWithdrawals: 0,
      gain: 73_000,
      returnPct: 912.5,
    });
    expect(summarizeOldOutput(
      manual('opening-before-valuation', 73_000, 72_000, '2024-06-01', fourMonthlyDeposits),
      '2024-06-01',
    )).toEqual({
      invested: 81_000,
      currentValue: 72_000,
      totalDeposits: 8_000,
      totalWithdrawals: 0,
      gain: 64_000,
      returnPct: 800,
    });

    const cashPattern = [
      entry('pattern-1', '2024-01-01', 1_000),
      entry('pattern-2', '2024-02-01', 3_000),
      entry('pattern-3', '2024-03-01', 0),
      entry('pattern-4', '2024-04-01', 0),
      entry('pattern-5', '2024-05-01', 5_000),
    ];
    expect(summarizeOldOutput(
      manual('cash-pattern', 0, 5_400, '2024-06-01', cashPattern, 'Cash'),
      '2024-06-01',
    )).toEqual({
      invested: 9_000,
      currentValue: 5_400,
      totalDeposits: 9_000,
      totalWithdrawals: 0,
      gain: -3_600,
      returnPct: -40,
    });

    const depositAndWithdrawal = [
      entry('later-deposit', '2024-02-01', 2_000),
      entry('later-withdrawal', '2024-03-01', 300, 'Withdrawal'),
    ];
    expect(summarizeOldOutput(
      manual('deposit-withdrawal', 1_000, 1_000, '2024-01-01', depositAndWithdrawal),
      '2024-04-01',
    )).toEqual({
      invested: 2_700,
      currentValue: 2_700,
      totalDeposits: 2_000,
      totalWithdrawals: 300,
      gain: 1_000,
      returnPct: 50,
    });
  });

  const userPattern = [
    entry('a', '2024-01-01', 1000),
    entry('b', '2024-02-01', 3000),
    entry('c', '2024-03-01', 0),
    entry('d', '2024-04-01', 0),
    entry('e', '2024-05-01', 5000),
  ];
  const manual: ManualHolding = {
    id: 'manual',
    kind: 'manual',
    name: 'Manual cash',
    type: 'Cash',
    invested: 0,
    value: 5400,
    valueAsOf: '2024-06-01',
    logs: userPattern,
  };

  it('records the old gain formula and its -40 percent user pattern', () => {
    const invested = holdingInvested(manual);
    const value = holdingValue(manual, '2024-06-01');
    expect((value - invested) / invested * 100).toBe(-40);
    expect(absoluteGainAndReturn(userPattern, value, '2024-06-01').absoluteReturnPct).toBe(-40);
  });

  it('records the old +800 percent output and replaces it with absolute gain formula', () => {
    const current = { ...manual, value: 81000, invested: 9000, logs: [] };
    expect((current.value - holdingInvested(current)) / holdingInvested(current) * 100).toBe(800);
    expect(absoluteGainAndReturn(userPattern, current.value, '2024-06-01').absoluteReturnPct).toBe(800);
  });

  it('returns null absolute return for zero contributions and handles withdrawals', () => {
    expect(absoluteGainAndReturn([], 500, '2024-06-01').absoluteReturnPct).toBeNull();
    expect(absoluteGainAndReturn([
      entry('deposit', '2024-01-01', 1000),
      entry('withdrawal', '2024-02-01', 1500, 'Withdrawal'),
    ], 100, '2024-06-01')).toEqual({
      contributions: 1000,
      withdrawals: 1500,
      gain: 600,
      absoluteReturnPct: 60,
    });
  });

  it('has XIRR, CAGR, same-day, short-span and known-vector behavior', () => {
    expect(calculateXirr([
      { date: '2020-01-01', amount: -1000 },
      { date: '2021-01-01', amount: 1100 },
    ])).toBeCloseTo(0.1, 9);
    const twoDeposit = calculateXirr([
      { date: '2020-01-01', amount: -1000 },
      { date: '2020-07-01', amount: -500 },
      { date: '2021-01-01', amount: 1600 },
    ]);
    expect(twoDeposit).toBeCloseTo(0.08026584374015275, 12);
    expect(calculateCagr(1000, 1250, 365)).toBeCloseTo(0.25, 9);
    expect(calculateXirr([
      { date: '2024-01-01', amount: -1000 },
      { date: '2024-01-01', amount: 1100 },
    ])).toBeNull();
    const summary = investmentReturnSummary(userPattern, 5400, '2024-06-01');
    expect(summary.absoluteReturnPct).toBe(-40);
    expect(summary.xirr).toBeNull();
    expect(summary.annualizedLabel).toBeNull();
  });

  it('covers invalid annualization and no-sign-change branches', () => {
    expect(calculateXirr([{ date: '2024-01-01', amount: -100 }])).toBeNull();
    expect(calculateXirr([
      { date: '2024-01-01', amount: -100 },
      { date: '2024-01-01', amount: 100 },
    ])).toBeNull();
    expect(calculateXirr([
      { date: '2024-01-01', amount: 100 },
      { date: '2025-01-01', amount: 100 },
    ])).toBeNull();
    expect(calculateCagr(0, 100, 365)).toBeNull();
    expect(calculateCagr(100, -1, 365)).toBeNull();
    expect(calculateCagr(100, 100, 0)).toBeNull();
  });

  it('labels long-span lump sums CAGR and multi-entry ledgers XIRR', () => {
    const lump = investmentReturnSummary([
      entry('lump', '2020-01-01', 1000),
    ], 1100, '2021-01-01');
    expect(lump.annualizedLabel).toBe('CAGR');
    expect(lump.cagr).toBeCloseTo(0.09971358593414137, 9);
    const multiple = investmentReturnSummary([
      entry('first', '2020-01-01', 1000),
      entry('second', '2020-07-01', 500),
    ], 1600, '2021-01-01');
    expect(multiple.annualizedLabel).toBe('XIRR');
    expect(multiple.xirr).toBeCloseTo(0.08026584374015275, 8);
  });

  it('matches an independent plain implementation over 2000 seeded entry sequences (seed 290329)', () => {
    let seed = 290329;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x1_0000_0000;
    };
    for (let sample = 0; sample < 2000; sample += 1) {
      const entries: InvestmentEntry[] = [];
      let plainContributions = 0;
      let plainWithdrawals = 0;
      const count = 1 + Math.floor(random() * 8);
      for (let index = 0; index < count; index += 1) {
        const kind: 'Deposit' | 'Withdrawal' = random() < 0.75 ? 'Deposit' : 'Withdrawal';
        const amount = Math.floor(random() * 100001) / 100;
        const day = 1 + Math.floor(random() * 28);
        const month = 1 + Math.floor(random() * 12);
        entries.push(entry(`r-${sample}-${index}`, `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, amount, kind));
        if (amount !== 0) {
          if (kind === 'Deposit') plainContributions += amount;
          else plainWithdrawals += amount;
        }
      }
      const currentValue = Math.floor(random() * 200001) / 100;
      const result = absoluteGainAndReturn(entries, currentValue, '2025-01-01');
      const plainGain = currentValue + plainWithdrawals - plainContributions;
      const plainReturn = plainContributions === 0 ? null : plainGain / plainContributions * 100;
      expect(result).toEqual({
        contributions: plainContributions,
        withdrawals: plainWithdrawals,
        gain: plainGain,
        absoluteReturnPct: plainReturn,
      });
    }
  });

  it('allocates EF target totals exactly across 10/20/70 buckets and 1/2/3 goal assets', () => {
    const target = 38536;
    const buckets = allocateAmounts(target, { cash: 10, bank: 20, 'fd-rd': 70 });
    expect(buckets).toMatchObject({ cash: 3853.6, bank: 7707.2, 'fd-rd': 26975.2 });
    expect(Object.values(buckets).reduce((sum, amount) => sum + amount, 0)).toBeCloseTo(target, 2);
    expect(Object.values(buckets).reduce((sum, amount) => sum + (amount / target * 100), 0)).toBeCloseTo(100, 8);
  });
});
