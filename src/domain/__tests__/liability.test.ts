import { emiAuto, emiCoversInterest, isCleared, liabilitySummary, loanState, monthsLeft, payoffDate } from '../liability';
import type { OneTimeLiability, RecurringLiability } from '../types';

const makeLiability = (changes: Partial<RecurringLiability> = {}): RecurringLiability => ({
  id: 'liability',
  kind: 'recurring',
  name: 'Test liability',
  type: 'Other',
  principal: 100_000,
  ratePct: 12,
  tenureMonths: 12,
  emi: 8_885,
  startDate: '2026-01-01',
  payments: [],
  ...changes,
});

describe('liability calculations', () => {
  it('computes rounded EMIs, including zero interest', () => {
    expect(emiAuto(100_000, 12, 12)).toBe(8_885);
    expect(emiAuto(12_000, 0, 12)).toBe(1_000);
  });

  it('preserves the existing recurring balance and payoff math', () => {
    const zeroRate = makeLiability({
      principal: 12_000,
      ratePct: 0,
      emi: 1_000,
      payments: [1, 2, 3].map((month) => ({
        id: `p${month}`,
        date: `2026-0${month}-01`,
        amount: 1_000,
        note: '',
        kind: 'EMI',
      })),
    });
    expect(loanState(zeroRate, '2026-03-01').balance).toBe(9_000);
    expect(monthsLeft(9_000, 1_000, 0)).toBe(9);
    expect(monthsLeft(100_000, 8_885, 12)).toBe(12);
    expect(monthsLeft(0, 0, 12)).toBe(0);
    expect(monthsLeft(100, 0, 0)).toBeNull();
    expect(emiCoversInterest(100_000, 12, 1_001)).toBe(true);
    expect(emiCoversInterest(100_000, 12, 1_000)).toBe(false);
    expect(monthsLeft(100_000, 1_000, 12)).toBeNull();
    expect(monthsLeft(100_000, 100, 12, 900)).toBeNull();
  });

  it('accrues daily interest and applies payments on their dates', () => {
    const noPayments = loanState(makeLiability({ ratePct: 10 }), '2027-01-01');
    expect(noPayments.balance).toBeCloseTo(110_000, 6);
    const withPayment = loanState(makeLiability({
      ratePct: 10,
      payments: [{ id: 'midyear', date: '2026-07-01', amount: 5_000, note: '', kind: 'EMI' }],
    }), '2027-01-01');
    const daysBefore = 181;
    const daysAfter = 184;
    const independentEstimate = (100_000 * (1 + 0.1 * daysBefore / 365) - 5_000)
      * (1 + 0.1 * daysAfter / 365);
    expect(withPayment.balance).toBeCloseTo(independentEstimate, 2);
    expect(withPayment.balance).toBeCloseTo(104_997.92, 0);
  });

  it('clamps overpayments, ignores future payments and normalizes ordering', () => {
    const overpaid = loanState(makeLiability({
      ratePct: 0,
      payments: [{ id: 'pay', date: '2026-01-02', amount: 200_000, note: '', kind: 'EMI' }],
    }), '2026-01-02');
    expect(overpaid.balance).toBe(0);
    expect(isCleared(overpaid.balance)).toBe(true);
    const future = makeLiability({ payments: [{ id: 'future', date: '2027-01-01', amount: 20_000, note: '', kind: 'EMI' }] });
    expect(loanState(future, '2026-12-31')).toEqual(loanState(makeLiability(), '2026-12-31'));
    const payments: RecurringLiability['payments'] = [
      { id: 'b', date: '2026-03-01', amount: 2_000, note: '', kind: 'EMI' },
      { id: 'a', date: '2026-02-01', amount: 1_000, note: '', kind: 'EMI' },
    ];
    expect(loanState(makeLiability({ payments }), '2026-06-01')).toEqual(
      loanState(makeLiability({ payments: [...payments].reverse() }), '2026-06-01'),
    );
  });

  it('does not accrue or process a liability before its start date', () => {
    const liability = makeLiability({
      startDate: '2027-01-01',
      payments: [{ id: 'early', date: '2026-12-01', amount: 1_000, note: '', kind: 'EMI' }],
    });
    expect(loanState(liability, '2026-12-15')).toEqual({
      balance: 100_000,
      paidTotal: 0,
      interestAccrued: 0,
    });
  });

  it('summarizes recurring payoff dates and extra-payment savings', () => {
    const liability = makeLiability();
    const summary = liabilitySummary(liability, '2026-01-01', 1_000);
    expect(summary.monthsLeft).toBe(12);
    expect(summary.monthsLeftWithExtra).toBeLessThan(12);
    expect(summary.monthsSaved).toBe(12 - summary.monthsLeftWithExtra!);
    expect(summary.payoffDate).toBe(payoffDate(12, '2026-01-01'));
    const impossible = liabilitySummary(makeLiability({ emi: 1 }), '2026-01-01', 0);
    expect(impossible.monthsLeft).toBeNull();
    expect(impossible.payoffDate).toBeNull();
    expect(impossible.monthsSaved).toBeNull();
    expect(liabilitySummary(makeLiability({ principal: 0 }), '2026-01-01', 0).cleared).toBe(true);
  });

  it('uses daily interest for one-time balances and reports due or overdue days', () => {
    const liability: OneTimeLiability = {
      id: 'once',
      kind: 'one-time',
      name: 'Friend',
      type: 'Borrowed money',
      principal: 20_000,
      ratePct: 0,
      startDate: '2026-10-01',
      dueDate: '2026-10-20',
      payments: [{ id: 'part', date: '2026-10-05', amount: 5_000, note: '', kind: 'Payment' }],
    };
    expect(liabilitySummary(liability, '2026-10-10')).toMatchObject({
      balance: 15_000,
      paidTotal: 5_000,
      interestAccrued: 0,
      principalPaidPct: 25,
      cleared: false,
      dueDate: '2026-10-20',
      daysToDue: 10,
    });
    expect(liabilitySummary(liability, '2026-10-22')).toMatchObject({ overdueDays: 2 });
    expect(liabilitySummary({ ...liability, dueDate: null }, '2026-10-10')).not.toHaveProperty('daysToDue');
  });
});
