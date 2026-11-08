import { emiAuto, emiCoversInterest, isCleared, loanState, loanSummary, monthsLeft, payoffDate } from '../loan';
import type { Loan } from '../types';

const makeLoan = (changes: Partial<Loan> = {}): Loan => ({
  id: 'loan',
  name: 'Test loan',
  principal: 100_000,
  ratePct: 12,
  tenureMonths: 12,
  emi: 8_885,
  startDate: '2026-01-01',
  payments: [],
  ...changes,
});

describe('loan calculations', () => {
  it('computes rounded EMIs, including zero interest', () => {
    expect(emiAuto(100_000, 12, 12)).toBe(8_885);
    expect(emiAuto(12_000, 0, 12)).toBe(1_000);
  });

  it('handles zero-interest balances and monthly payoff estimates', () => {
    const zeroRate = makeLoan({
      principal: 12_000,
      ratePct: 0,
      emi: 1_000,
      payments: [1, 2, 3].map((month) => ({
        id: `p${month}`,
        date: `2026-0${month}-01`,
        amount: 1_000,
        note: '',
      })),
    });
    expect(loanState(zeroRate, '2026-03-01').balance).toBe(9_000);
    expect(monthsLeft(9_000, 1_000, 0)).toBe(9);
    expect(monthsLeft(100_000, 8_885, 12)).toBe(12);
    expect(monthsLeft(0, 0, 12)).toBe(0);
    expect(monthsLeft(100, 0, 0)).toBeNull();
    expect(emiCoversInterest(100_000, 12, 1_001)).toBe(true);
    expect(emiCoversInterest(100_000, 12, 1_000)).toBe(false);
  });

  it('returns null where the monthly payment cannot cover interest', () => {
    expect(monthsLeft(100_000, 1_000, 12)).toBeNull();
    expect(monthsLeft(100_000, 100, 12, 900)).toBeNull();
  });

  it('accrues daily interest and applies payments on their dates', () => {
    const noPayments = loanState(makeLoan({ ratePct: 10 }), '2027-01-01');
    expect(noPayments.balance).toBeCloseTo(110_000, 6);
    const withPayment = loanState(makeLoan({
      ratePct: 10,
      payments: [{ id: 'midyear', date: '2026-07-01', amount: 5_000, note: '' }],
    }), '2027-01-01');
    const daysBefore = 181;
    const daysAfter = 184;
    const independentEstimate = (100_000 * (1 + 0.1 * daysBefore / 365) - 5_000)
      * (1 + 0.1 * daysAfter / 365);
    expect(withPayment.balance).toBeCloseTo(independentEstimate, 2);
    expect(withPayment.balance).toBeCloseTo(104_997.92, 0);
  });

  it('clamps overpayments, ignores future payments and normalizes payment ordering', () => {
    const overpaid = loanState(makeLoan({
      ratePct: 0,
      payments: [{ id: 'pay', date: '2026-01-02', amount: 200_000, note: '' }],
    }), '2026-01-02');
    expect(overpaid.balance).toBe(0);
    expect(isCleared(overpaid.balance)).toBe(true);
    const future = makeLoan({ payments: [{ id: 'future', date: '2027-01-01', amount: 20_000, note: '' }] });
    expect(loanState(future, '2026-12-31')).toEqual(loanState(makeLoan(), '2026-12-31'));
    const payments = [
      { id: 'b', date: '2026-03-01', amount: 2_000, note: '' },
      { id: 'a', date: '2026-02-01', amount: 1_000, note: '' },
    ];
    expect(loanState(makeLoan({ payments }), '2026-06-01')).toEqual(
      loanState(makeLoan({ payments: [...payments].reverse() }), '2026-06-01'),
    );
  });

  it('does not accrue or process a loan before its start date', () => {
    const loan = makeLoan({
      startDate: '2027-01-01',
      payments: [{ id: 'early', date: '2026-12-01', amount: 1_000, note: '' }],
    });
    expect(loanState(loan, '2026-12-15')).toEqual({
      balance: 100_000,
      paidTotal: 0,
      interestAccrued: 0,
    });
  });

  it('summarizes payoff dates and extra-payment savings', () => {
    const loan = makeLoan();
    const summary = loanSummary(loan, '2026-01-01', 1_000);
    expect(summary.monthsLeft).toBe(12);
    expect(summary.monthsLeftWithExtra).toBeLessThan(12);
    expect(summary.monthsSaved).toBe(12 - summary.monthsLeftWithExtra!);
    expect(summary.payoffDate).toBe(payoffDate(12, '2026-01-01'));
    const impossible = loanSummary(makeLoan({ emi: 1 }), '2026-01-01', 0);
    expect(impossible.monthsLeft).toBeNull();
    expect(impossible.payoffDate).toBeNull();
    expect(impossible.monthsSaved).toBeNull();
    expect(loanSummary(makeLoan({ principal: 0 }), '2026-01-01', 0).cleared).toBe(true);
  });
});
