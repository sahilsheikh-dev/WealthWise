import {
  behindBy,
  currentInstallmentAmount,
  installmentsDue,
  installmentsTracked,
  loggedCount,
  loggedTotal,
  loggedTrackedCount,
  planInvested,
  planProgressPct,
  planValue,
  projection,
  scheduledDate,
  totalPeriods,
} from '../sip';
import type { PlanHolding } from '../types';

const makePlan = (changes: Partial<PlanHolding> = {}): PlanHolding => ({
  id: 'sip',
  kind: 'plan',
  name: 'Test plan',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 10_000,
  ratePct: 12,
  stepUpPct: 0,
  tenureYears: 1,
  startDate: '2026-01-01',
  trackFrom: '2026-01-01',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
  logs: [],
  ...changes,
});

describe('SIP domain calculations', () => {
  it('matches closed-form future value and zero-rate contributions', () => {
    const plan = makePlan();
    const result = projection(plan);
    const periods = 12;
    const monthlyRate = (1 + 0.12) ** (1 / 12) - 1;
    const closedForm = 10_000 * (((1 + monthlyRate) ** periods - 1) / monthlyRate);
    expect(result.futureValue).toBeCloseTo(closedForm, 8);
    expect(result.periods).toBe(periods);
    const zeroRate = projection(makePlan({ ratePct: 0 }));
    expect(zeroRate.totalContributions).toBe(10_000 * 12);
    expect(zeroRate.futureValue).toBe(10_000 * 12);
  });

  it('applies annual step-ups in the projection schedule', () => {
    const plan = makePlan({ amount: 1_000, stepUpPct: 10, tenureYears: 2, ratePct: 0 });
    const result = projection(plan);
    let bruteValue = 0;
    let bruteContributions = 0;
    for (let period = 0; period < 24; period += 1) {
      const contribution = 1_000 * 1.1 ** Math.floor(period / 12);
      bruteValue += contribution;
      bruteContributions += contribution;
    }
    expect(result.totalContributions).toBe(25_200);
    expect(result.futureValue).toBe(bruteValue);
    expect(result.totalContributions).toBe(bruteContributions);
  });

  it('calculates due installments with calendar dates and a bounded search', () => {
    const monthEndPlan = makePlan({ startDate: '2026-01-31', tenureYears: 2 });
    expect(scheduledDate(monthEndPlan, 1)).toBe('2026-02-28');
    expect(installmentsDue(monthEndPlan, '2026-03-01')).toBe(2);
    const weeklyPlan = makePlan({ frequency: 'weekly', startDate: '2026-10-01', tenureYears: 1 });
    expect(installmentsDue(weeklyPlan, '2026-10-15')).toBe(3);
    expect(installmentsDue(makePlan({ startDate: '2027-01-01' }), '2026-12-31')).toBe(0);
    expect(installmentsDue(makePlan(), '2030-01-01')).toBe(totalPeriods(makePlan()));
    const yearlyPlan = makePlan({ frequency: 'yearly', startDate: '2024-02-29', tenureYears: 4 });
    expect(installmentsDue(yearlyPlan, '2025-02-28')).toBe(2);
    expect(scheduledDate(yearlyPlan, 1)).toBe('2025-02-28');
    expect(scheduledDate(makePlan({ frequency: 'daily' }), 2)).toBe('2026-01-03');
  });

  it('clamps behind counts and values plans from actual value or posted entries', () => {
    const plan = makePlan({
      opening: 500,
      logs: [
        { id: 'b', date: '2026-01-01', amount: 1_000, note: '', kind: 'Deposit' },
        { id: 'a', date: '2026-02-01', amount: 2_000, note: '', kind: 'Deposit' },
      ],
    });

    expect(behindBy(plan, '2026-01-01')).toBe(0);
    expect(planValue(plan, '2026-01-01')).toBe(1_500);
    expect(planValue(plan, '2026-03-01')).toBe(3_500);
    expect(planValue({ ...plan, actualValue: 9_999, actualValueDate: '2026-03-01' }, '2026-03-01')).toBe(9_999);
    expect(behindBy(makePlan(), '2026-06-01')).toBeGreaterThanOrEqual(0);
    expect(planProgressPct(makePlan())).toBe(0);
    expect(planProgressPct({ ...plan, amount: 0 })).toBe(0);
  });

  it('counts deposits only for tracked progress and clamps withdrawn balances at zero', () => {
    const plan = makePlan({
      opening: 100,
      trackFrom: '2026-02-01',
      logs: [
        { id: 'before', date: '2026-01-10', amount: 50, note: '', kind: 'Deposit' },
        { id: 'tracked', date: '2026-02-10', amount: 75, note: '', kind: 'Deposit' },
        { id: 'withdrawal', date: '2026-02-20', amount: 300, note: '', kind: 'Withdrawal' },
      ],
    });
    expect(loggedTotal(plan)).toBe(125);
    expect(loggedCount(plan)).toBe(2);
    expect(loggedTrackedCount(plan)).toBe(1);
    expect(planInvested(plan)).toBe(225);
    expect(planValue(plan, '2026-02-20')).toBe(0);
  });

  it('tracks only scheduled installments on or after trackFrom', () => {
    const plan = makePlan({ startDate: '2026-01-01', trackFrom: '2026-03-01' });
    expect(installmentsTracked(plan, '2026-04-01')).toBe(2);
    expect(installmentsTracked({ ...plan, trackFrom: '2025-12-01' }, '2026-04-01')).toBe(4);
    expect(installmentsTracked({ ...plan, trackFrom: '2026-05-01' }, '2026-04-01')).toBe(0);
    expect(installmentsTracked({ ...plan, startDate: '2026-04-01', trackFrom: '2026-01-01' }, '2026-04-01')).toBe(1);
    expect(behindBy({ ...plan, trackFrom: '2026-05-01' }, '2026-04-01')).toBe(0);
    expect(behindBy(plan, '2026-01-01')).toBe(0);
  });

  it('keeps dated actual snapshots fixed and includes only later logs', () => {
    const actualPlan = makePlan({
      actualValue: 10_000,
      actualValueDate: '2026-01-01',
      logs: [
        { id: 'before', date: '2025-12-31', amount: 500, note: '', kind: 'Deposit' },
        { id: 'same', date: '2026-01-01', amount: 600, note: '', kind: 'Deposit' },
        { id: 'after', date: '2026-07-02', amount: 1_000, note: '', kind: 'Deposit' },
      ],
    });

    expect(planValue(actualPlan, '2026-01-01')).toBe(10_000);
    expect(planValue(actualPlan, '2027-01-01')).toBe(11_000);
    expect(planValue({ ...actualPlan, actualValueDate: '2026-01-01', logs: [actualPlan.logs[0]!] }, '2026-01-01')).toBe(10_000);
    const seedPlan = makePlan({
      startDate: '2024-01-01',
      trackFrom: '2026-07-01',
      tenureYears: 34,
      actualValue: 118_000,
      actualValueDate: '2026-09-30',
      logs: [
        { id: 'jul', date: '2026-07-05', amount: 21_200, note: '', kind: 'Deposit' },
        { id: 'aug', date: '2026-08-05', amount: 21_200, note: '', kind: 'Deposit' },
        { id: 'sep', date: '2026-09-05', amount: 21_200, note: '', kind: 'Deposit' },
      ],
    });
    expect(behindBy(seedPlan, '2026-10-10')).toBe(1);
    expect(planValue(seedPlan, '2027-09-30')).toBe(118_000);
  });

  it('subtracts withdrawals dated after an actual-value snapshot and ignores earlier withdrawals', () => {
    const plan = makePlan({
      actualValue: 10_000,
      actualValueDate: '2026-01-01',
      ratePct: 0,
      logs: [
        { id: 'old-withdrawal', date: '2025-12-31', amount: 1_000, note: '', kind: 'Withdrawal' },
        { id: 'new-withdrawal', date: '2026-03-01', amount: 2_000, note: '', kind: 'Withdrawal' },
        { id: 'deposit', date: '2026-04-01', amount: 500, note: '', kind: 'Deposit' },
      ],
    });
    expect(planValue(plan, '2026-10-10')).toBe(8_500);
  });

  it('steps the installment amount on calendar anniversaries', () => {
    const plan = makePlan({ amount: 1_000, stepUpPct: 10, tenureYears: 3, startDate: '2024-06-15' });
    expect(currentInstallmentAmount(plan, '2024-06-14')).toBe(1_000);
    expect(currentInstallmentAmount(plan, '2025-06-14')).toBe(1_000);
    expect(currentInstallmentAmount(plan, '2025-06-15')).toBe(1_100);
    expect(currentInstallmentAmount(plan, '2030-06-15')).toBeCloseTo(1_210);
  });
});
