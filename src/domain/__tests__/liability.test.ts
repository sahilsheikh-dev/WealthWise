import { emiAuto, emiCoversInterest, isCleared, liabilitySummary, loanState, monthsLeft, payoffDate, solveLoan } from '../liability';
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
  settlement: null,
  ...changes,
});

describe('liability calculations', () => {
  it('computes rounded EMIs, including zero interest', () => {
    expect(emiAuto(100_000, 12, 12)).toBe(8_885);
    expect(emiAuto(12_000, 0, 12)).toBe(1_000);
  });

  describe('loan solver', () => {
    it('calculates a two-decimal EMI and zero-interest values', () => {
      expect(solveLoan({ principal: 1_000_000, ratePct: 10, tenureMonths: 12 })).toMatchObject({
        emi: 87_915.89,
        solved: 'emi',
      });
      expect(solveLoan({ principal: 12_000, ratePct: 0, tenureMonths: 12 })).toMatchObject({
        emi: 1_000,
        solved: 'emi',
      });
      expect(solveLoan({ principal: 12_000, ratePct: 0, emi: 1_000 })).toMatchObject({
        tenureMonths: 12,
        lastPayment: 1_000,
        solved: 'tenure',
      });
      expect(solveLoan({ principal: 12_000, tenureMonths: 12, emi: 1_000 })).toMatchObject({
        ratePct: 0,
        solved: 'rate',
      });
    });

    it('recovers rates and tenures across 2,000 seeded cases', () => {
      let seed = 20261010;
      const random = () => {
        seed = (seed * 16_807) % 2_147_483_647;
        return (seed - 1) / 2_147_483_646;
      };
      for (let index = 0; index < 2_000; index += 1) {
        const principal = 1_000_000 + random() * 10_000_000;
        const ratePct = 1 + random() * 30;
        const tenureMonths = 1 + Math.floor(random() * 480);
        const emi = solveLoan({ principal, ratePct, tenureMonths }).emi;
        expect(emi).not.toBeNull();
        if (emi === null) throw new Error('Expected the EMI calculation to return a value');
        const recoveredRate = solveLoan({ principal, tenureMonths, emi }).ratePct;
        expect(recoveredRate).not.toBeNull();
        if (recoveredRate === null) throw new Error('Expected the rate calculation to return a value');
        expect(Math.abs(recoveredRate - ratePct)).toBeLessThanOrEqual(0.01);
        const recoveredTenure = solveLoan({ principal, ratePct, emi }).tenureMonths;
        expect(recoveredTenure).not.toBeNull();
        if (recoveredTenure === null) throw new Error('Expected the tenure calculation to return a value');
        expect(Math.abs(recoveredTenure - tenureMonths)).toBeLessThanOrEqual(1);
      }
    });

    it('returns a mismatch warning without replacing the entered EMI', () => {
      expect(solveLoan({ principal: 1_000_000, ratePct: 10, tenureMonths: 12, emi: 90_000 })).toMatchObject({
        emi: 90_000,
        solved: 'none',
        warnings: [{ kind: 'emi-mismatch', calculatedEmi: 87_915.89 }],
      });
      expect(solveLoan({ principal: 1_000_000, ratePct: 10, tenureMonths: 12, emi: 88_000 }).warnings).toEqual([]);
    });

    it('reports input and repayment errors', () => {
      const failure = (input: Parameters<typeof solveLoan>[0], message: string) => {
        expect(() => solveLoan(input)).toThrow(message);
      };
      failure({ principal: 0 }, 'Principal must be greater than zero');
      failure({ principal: 1, ratePct: 101, tenureMonths: 1 }, 'Interest rate must be between 0 and 100%');
      failure({ principal: 1, ratePct: 0, tenureMonths: 601 }, 'Tenure must be between 1 and 600 whole months');
      failure({ principal: 1, ratePct: 0, tenureMonths: 1, emi: 0 }, 'EMI must be greater than zero');
      failure({ principal: 1_000, tenureMonths: 12, emi: 80 }, 'EMI is too low to repay this loan in that time');
      failure({ principal: 1_000, ratePct: 12, emi: 1 }, 'EMI does not even cover the monthly interest');
      failure({ principal: 1_000_000_000, ratePct: 0, emi: 1 }, 'Calculated tenure exceeds 600 months');
      failure({ principal: 1_000, tenureMonths: 1, emi: 1_000_000 }, 'Interest rate must be between 0 and 100% to match this EMI');
      expect(solveLoan({ principal: 1_000 }).solved).toBe('none');
    });
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
