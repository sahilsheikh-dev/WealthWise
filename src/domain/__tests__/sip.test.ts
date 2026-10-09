import {
  behindBy,
  currentInstallmentAmount,
  estimatedValue,
  installmentsDue,
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
  opening: 0,
  actualValue: null,
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

  it('clamps behind counts and values plans from actual value or estimate', () => {
    const plan = makePlan({
      opening: 500,
      logs: [
        { id: 'b', date: '2026-01-01', amount: 1_000, note: '' },
        { id: 'a', date: '2026-02-01', amount: 2_000, note: '' },
      ],
    });
    expect(behindBy(plan, '2026-01-01')).toBe(0);
    expect(estimatedValue(plan, '2026-01-01')).toBe(3_500);
    expect(planValue(plan, '2026-03-01')).toBeCloseTo(500 + 1_000 * 1.12 ** (59 / 365) + 2_000 * 1.12 ** (28 / 365), 6);
    expect(planValue({ ...plan, actualValue: 9_999 }, '2026-03-01')).toBe(9_999);
    expect(behindBy(makePlan(), '2026-06-01')).toBeGreaterThanOrEqual(0);
    expect(planProgressPct(makePlan())).toBe(0);
    expect(planProgressPct({ ...plan, amount: 0 })).toBe(0);
  });

  it('steps the installment amount on calendar anniversaries', () => {
    const plan = makePlan({ amount: 1_000, stepUpPct: 10, tenureYears: 3, startDate: '2024-06-15' });
    expect(currentInstallmentAmount(plan, '2024-06-14')).toBe(1_000);
    expect(currentInstallmentAmount(plan, '2025-06-14')).toBe(1_000);
    expect(currentInstallmentAmount(plan, '2025-06-15')).toBe(1_100);
    expect(currentInstallmentAmount(plan, '2030-06-15')).toBeCloseTo(1_210);
  });
});
