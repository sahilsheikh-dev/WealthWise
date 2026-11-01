import { holdingInvested, holdingValue } from '../portfolio';
import {
  absoluteGainAndReturn,
  calculateCagr,
  calculateXirr,
  investmentReturnSummary,
} from '../investmentReturns';
import type { InvestmentEntry, ManualHolding } from '../types';

function entry(id: string, date: string, amount: number, kind: 'Deposit' | 'Withdrawal' = 'Deposit'): InvestmentEntry {
  return { id, date, amount, note: '', kind };
}

describe('investment return reproduction and spec', () => {
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
      gain: -2400,
      absoluteReturnPct: -240,
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
    expect(twoDeposit).not.toBeNull();
    expect(calculateCagr(1000, 1250, 365)).toBeCloseTo(25, 9);
    expect(calculateXirr([
      { date: '2024-01-01', amount: -1000 },
      { date: '2024-01-01', amount: 1100 },
    ])).toBeNull();
    const summary = investmentReturnSummary(userPattern, 5400, '2024-06-01');
    expect(summary.absoluteReturnPct).toBe(-40);
    expect(summary.xirr).toBeNull();
    expect(summary.annualizedLabel).toBeNull();
  });
});
