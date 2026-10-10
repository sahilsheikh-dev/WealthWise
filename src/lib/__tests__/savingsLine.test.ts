import { savingsLine } from '../savingsLine';

describe('savingsLine', () => {
  it('distinguishes no income and expenses without income', () => {
    expect(savingsLine({ income: 0, earnedIncome: 0, withdrawals: 0, rates: null })).toEqual({ kind: 'none' });
  });

  it('reports withdrawals with no earned income', () => {
    expect(savingsLine({ income: 5_000, earnedIncome: 0, withdrawals: 5_000, rates: null }))
      .toEqual({ kind: 'no-earned-income', withdrawals: 5_000 });
  });

  it('uses earned income rates when withdrawals are present', () => {
    expect(savingsLine({
      income: 50_000,
      earnedIncome: 40_000,
      withdrawals: 10_000,
      rates: { savedPct: 50, investedPct: 10 },
    })).toEqual({
      kind: 'rates',
      basis: 'earned income',
      savedPct: 50,
      investedPct: 10,
      withdrawals: 10_000,
    });
  });

  it('preserves the existing income-based wording when there are no withdrawals', () => {
    expect(savingsLine({
      income: 50_000,
      earnedIncome: 50_000,
      withdrawals: 0,
      rates: { savedPct: 40, investedPct: 10 },
    })).toEqual({
      kind: 'rates',
      basis: 'income',
      savedPct: 40,
      investedPct: 10,
      withdrawals: 0,
    });
  });
});
