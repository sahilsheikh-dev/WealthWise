import { emptyAppData } from '../actions';
import { policySummary } from '../policySummary';
import type { Policy } from '../types';

const policy = (overrides: Partial<Policy>): Policy => ({
  id: 'policy',
  name: 'Policy',
  insurer: 'Insurer',
  kind: 'health',
  premium: 100,
  frequency: 'monthly',
  startDate: '2026-01-15',
  status: 'active',
  premiumYears: 5,
  trackFrom: '2026-01-15',
  currentValue: null,
  valueAsOf: null,
  payments: [],
  ...overrides,
});

describe('policySummary', () => {
  it('summarizes active cover, annualized premiums, next renewal, upcoming dues and income cover', () => {
    const data = {
      ...emptyAppData('2026-01-01'),
      policies: [
        policy({ id: 'term', name: 'Term cover', kind: 'term-life', premium: 1_000, frequency: 'yearly', sumAssured: 10_000 }),
        policy({ id: 'health', name: 'Health cover', premium: 200, frequency: 'quarterly', sumAssured: 5_000 }),
        policy({ id: 'lapsed', name: 'Old policy', status: 'lapsed', sumAssured: 50_000 }),
      ],
      monthBudgets: [{
        month: '2026-01',
        source: 'custom' as const,
        incomes: [{ id: 'income', name: 'Salary', category: 'Salary' as const, amount: 5_000 }],
        sections: [],
        items: [],
      }],
    };
    expect(policySummary(data, '2026-01-01')).toEqual({
      activeCount: 2,
      totalCover: 15_000,
      yearlyPremium: 1_800,
      nextRenewal: { policyId: 'health', name: 'Health cover', date: '2026-01-15', amount: 200 },
      upcoming: [
        { policyId: 'health', name: 'Health cover', date: '2026-01-15', amount: 200 },
        { policyId: 'term', name: 'Term cover', date: '2026-01-15', amount: 1_000 },
      ],
      termLifeCover: 10_000,
      yearlyIncomeEstimate: 60_000,
      coverMultiple: 10_000 / 60_000,
    });
  });

  it('uses the last three months of earned income when no effective budget exists', () => {
    const data = {
      ...emptyAppData('2026-01-15'),
      policies: [policy({ kind: 'term-life', sumAssured: 50_000 })],
      transactions: [
        { id: 'nov', type: 'income' as const, amount: 1_000, category: 'Salary', note: '', date: '2025-11-01' },
        { id: 'dec', type: 'income' as const, amount: 2_000, category: 'Rental', note: '', date: '2025-12-01' },
        { id: 'jan', type: 'income' as const, amount: 3_000, category: 'Business', note: '', date: '2026-01-10' },
        { id: 'borrowed', type: 'income' as const, amount: 100_000, category: 'Borrowed', note: '', date: '2026-01-10' },
      ],
    };
    expect(policySummary(data, '2026-01-15')).toMatchObject({
      yearlyIncomeEstimate: 24_000,
      coverMultiple: 50_000 / 24_000,
    });
  });

  it('returns a null cover multiple when earned income is missing or zero', () => {
    const noIncome = {
      ...emptyAppData('2026-01-15'),
      policies: [policy({ kind: 'term-life', sumAssured: 50_000 })],
    };
    expect(policySummary(noIncome, '2026-01-15')).toMatchObject({
      yearlyIncomeEstimate: null,
      coverMultiple: null,
    });
    const zeroBudget = {
      ...noIncome,
      monthBudgets: [{
        month: '2026-01',
        source: 'custom' as const,
        incomes: [],
        sections: [],
        items: [],
      }],
    };
    expect(policySummary(zeroBudget, '2026-01-15')).toMatchObject({
      yearlyIncomeEstimate: 0,
      coverMultiple: null,
    });
  });

  it('excludes paid, overdue and distant dues and tolerates missing cover amounts', () => {
    const data = {
      ...emptyAppData('2026-01-15'),
      policies: [
        policy({
          id: 'paid',
          name: 'Paid policy',
          frequency: 'yearly',
          startDate: '2026-01-01',
          trackFrom: '2026-01-01',
          premiumYears: 1,
          payments: [{ id: 'premium', date: '2026-01-01', amount: 100, note: '' }],
        }),
        policy({
          id: 'quarterly',
          name: 'Quarterly policy',
          frequency: 'quarterly',
          premiumYears: 1,
          startDate: '2026-01-01',
          trackFrom: '2026-01-01',
        }),
        policy({
          id: 'overdue',
          name: 'Overdue policy',
          frequency: 'monthly',
          startDate: '2025-11-01',
          trackFrom: '2025-11-01',
          premiumYears: 1,
          endDate: '2025-11-01',
        }),
      ],
    };
    const summary = policySummary(data, '2026-01-15');
    expect(summary.totalCover).toBe(0);
    expect(summary.termLifeCover).toBe(0);
    expect(summary.nextRenewal).toMatchObject({
      policyId: 'quarterly',
      date: '2026-04-01',
    });
    expect(summary.upcoming).toEqual([]);
  });

  it('orders same-date renewals deterministically and returns null when no future dues remain', () => {
    const tiedData = {
      ...emptyAppData('2026-01-15'),
      policies: [
        policy({
          id: 'policy-b',
          name: 'Same name',
          kind: 'term-life',
          startDate: '2026-02-01',
          trackFrom: '2026-02-01',
          endDate: '2026-02-01',
          sumAssured: undefined,
        }),
        policy({
          id: 'policy-a',
          name: 'Same name',
          kind: 'term-life',
          startDate: '2026-02-01',
          trackFrom: '2026-02-01',
          endDate: '2026-02-01',
          sumAssured: undefined,
        }),
      ],
    };
    expect(policySummary(tiedData, '2026-01-15')).toMatchObject({
      nextRenewal: { policyId: 'policy-a' },
      upcoming: [
        { policyId: 'policy-a', date: '2026-02-01' },
        { policyId: 'policy-b', date: '2026-02-01' },
      ],
      termLifeCover: 0,
    });

    const overdueData = {
      ...emptyAppData('2026-01-15'),
      policies: [policy({
        id: 'ended',
        frequency: 'monthly',
        startDate: '2025-11-01',
        trackFrom: '2025-11-01',
        endDate: '2025-11-01',
      })],
    };
    expect(policySummary(overdueData, '2026-01-15')).toMatchObject({
      nextRenewal: null,
      upcoming: [],
    });
  });
});
