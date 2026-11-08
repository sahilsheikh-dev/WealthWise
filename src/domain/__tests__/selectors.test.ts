import {
  buildPortfolioRows,
  defaultEfTarget,
  expenseCategoryBreakdown,
  effectiveEmergencyTarget,
  emergencyMinimumTarget,
  ensureEfGoal,
  filterRows,
  filterTransactions,
  goalProgressPct,
  goalTotals,
  goalView,
  groupByDate,
  holdingInvested,
  holdingValue,
  homeSummary,
  incomeBaselineFor,
  liabilitiesOverview,
  milestones,
  monthlyBaseline,
  monthlyCommitment,
  monthsCovered,
  monthSummary,
  monthsWithData,
  netWorth,
  portfolioTotals,
} from '../index';
import type { AppData, Goal, Holding, HoldingType, ManualHolding, PlanHolding, RecurringLiability, Transaction } from '../types';
import { goalSavedFor, linkableInstruments } from '../goalLinks';
import { holdingContributions } from '../portfolio';
import { pendingItems } from '../pending';
import { planReminders } from '../reminders';
import { holdingCapabilities } from '../holdingCapabilities';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import { budgetItemsFromLines, budgetPlanFromLines } from '../../testFixtures/budget';

const tx = (
  id: string,
  type: Transaction['type'],
  amount: number,
  date: string,
  note = id,
  category = 'General',
): Transaction => ({ id, type, amount, date, note, category });

const baseData = (changes: Partial<AppData> = {}): AppData => ({
  settings: { name: 'Test', theme: 'system', monthlySalary: null, onboarded: true },
  transactions: [],
  goals: [],
  holdings: [],
  liabilities: [],
  policies: [],
  budget: null,
  budgetPlan: null,
  efCustomBuckets: [],
  efBucketLinks: {},
  ...changes,
});

describe('income baseline selection', () => {
  it('prefers earned-income history, falls back to salary, and otherwise returns null', () => {
    expect(incomeBaselineFor(baseData({
      transactions: [
        tx('salary-history', 'income', 40_000, '2025-12-10', 'Salary', 'Salary'),
        tx('withdrawal', 'income', 20_000, '2025-12-12', 'Withdrawal', 'Withdrawal'),
        tx('borrowed', 'income', 15_000, '2025-12-13', 'Borrowed', 'Borrowed'),
        tx('own-funds', 'income', 5_000, '2025-12-14', 'Own funds', 'Own funds'),
      ],
      settings: { ...baseData().settings, monthlySalary: 70_000 },
    }), '2026-01-01')).toEqual({ amount: 40_000, source: 'transactions' });
    expect(incomeBaselineFor(baseData({
      settings: { ...baseData().settings, monthlySalary: 70_000 },
      transactions: [tx('withdrawal', 'income', 20_000, '2025-12-12', 'Withdrawal', 'Withdrawal')],
    }), '2026-01-01')).toEqual({ amount: 70_000, source: 'salary' });
    expect(incomeBaselineFor(baseData(), '2026-01-01')).toBeNull();
  });

  it('marks salary-based liability ratios without changing actual-history ratios', () => {
    const liability: RecurringLiability = {
      id: 'salary-liability', kind: 'recurring', name: 'Loan', type: 'Other',
      principal: 100_000, ratePct: 0, startDate: '2025-01-01', tenureMonths: 12, emi: 10_000, payments: [], settlement: null,
    };
    expect(liabilitiesOverview(baseData({
      liabilities: [liability],
      settings: { ...baseData().settings, monthlySalary: 50_000 },
    }), '2026-01-01', 0)).toMatchObject({ emiPctOfIncome: 20, incomeSource: 'salary' });
    expect(liabilitiesOverview(baseData({
      liabilities: [liability],
      settings: { ...baseData().settings, monthlySalary: 50_000 },
      transactions: [tx('salary', 'income', 40_000, '2025-12-10', 'Salary', 'Salary')],
    }), '2026-01-01', 0)).toMatchObject({ emiPctOfIncome: 25, incomeSource: 'transactions' });
  });
});

describe('emergency fund calculations', () => {
  it('uses historical three-month baselines and handles current-only/no data', () => {
    const transactions = [
      tx('jul', 'expense', 20_000, '2026-07-15'),
      tx('aug', 'expense', 24_000, '2026-08-15'),
      tx('sep', 'expense', 22_000, '2026-09-15'),
      tx('oct', 'expense', 5_000, '2026-10-09'),
      tx('future', 'expense', 100_000, '2026-11-01'),
    ];
    expect(monthlyBaseline(transactions, 'expense', '2026-10-09')).toBe(22_000);
    expect(monthlyBaseline([tx('only', 'expense', 4_000, '2026-10-01')], 'expense', '2026-10-09')).toBe(4_000);
    expect(monthlyBaseline([], 'expense', '2026-10-09')).toBe(0);
    expect(monthlyBaseline([tx('inc', 'income', 10, '2026-09-01')], 'expense', '2026-10-09')).toBe(0);
    expect(monthlyBaseline([
      tx('income', 'income', 40_000, '2026-09-01'),
      tx('withdrawal', 'income', 10_000, '2026-09-02', 'EF withdrawal', 'Withdrawal'),
    ], 'income', '2026-10-09', { excludeCategories: ['Withdrawal'] })).toBe(40_000);
    expect(monthsCovered(10_000, 0)).toBeNull();
    expect(monthsCovered(66_000, 22_000)).toBe(3);
    expect(milestones(66_000, 22_000)).toEqual([
      { months: 3, pct: 100, done: true },
      { months: 6, pct: 50, done: false },
      { months: 12, pct: 25, done: false },
    ]);
    expect(milestones(1, 0, [2])).toEqual([{ months: 2, pct: 0, done: false }]);
    expect(milestones(1, 10, [1])).toEqual([{ months: 1, pct: 10, done: false }]);
  });
});

describe('emergency-fund goal helpers', () => {
  const otherGoal: Goal = { id: 'other', name: 'Travel', target: 20_000, saved: 4_000, year: 2028, links: [] };

  it('creates, converts, pins, and idempotently preserves the emergency goal without mutation', () => {
    const empty: Goal[] = [];
    const inserted = ensureEfGoal(empty, { expenseBaseline: 22_000, asOf: '2026-10-09' });
    expect(inserted[0]).toEqual({
      id: 'goal-emergency',
      name: 'Emergency fund',
      target: 132_000,
      saved: 0,
      year: 2028,
      auto: 'ef',
      links: [],
    });
    expect(empty).toHaveLength(0);
    expect(defaultEfTarget(0)).toBe(300_000);
    const named: Goal[] = [{ id: 'ef-name', name: 'eMeRgEnCy FuNd', target: 30_000, saved: 2, year: 2027, links: [] }, otherGoal];
    const converted = ensureEfGoal(named, { expenseBaseline: 1, asOf: '2026-10-09' });
    expect(converted[0]).toMatchObject({ id: 'ef-name', auto: 'ef' });
    expect(named[0]!.auto).toBeUndefined();
    const alreadyAuto: Goal[] = [otherGoal, { id: 'auto', name: 'EF', target: 5_000, saved: 3, year: 2030, auto: 'ef', links: [] }];
    const pinned = ensureEfGoal(alreadyAuto, { expenseBaseline: 0, asOf: '2026-10-09' });
    expect(pinned.map((goal) => goal.id)).toEqual(['auto', 'other']);
    expect(ensureEfGoal(pinned, { expenseBaseline: 99, asOf: '2027-01-01' })).toEqual(pinned);
  });

  it('syncs emergency savings and calculates goal totals with clamped progress', () => {
    const linked: Goal = {
      id: 'ef', name: 'Emergency', target: 10_000, saved: 1, year: 2027, auto: 'ef',
      links: [{ instrumentId: 'cash', share: 100 }],
    };
    const data = baseData({
      holdings: [{ id: 'cash', kind: 'manual', name: 'Cash', type: 'Cash', invested: 12_000, value: 12_000, logs: [] }],
    });
    expect(goalSavedFor(linked, data, '2026-10-01')).toBe(12_000);
    expect(goalSavedFor(otherGoal, data, '2026-10-01')).toBe(4_000);
    expect(goalProgressPct(linked, 15_000)).toBe(100);
    expect(goalProgressPct(linked, -1)).toBe(0);
    expect(goalProgressPct({ ...linked, target: 0 }, 10)).toBe(0);
    expect(goalTotals([linked, otherGoal], 0, data, '2026-10-01')).toEqual({ target: 30_000, saved: 16_000, pct: 160 / 3 });
    expect(goalTotals([], 0, data, '2026-10-01')).toEqual({ target: 0, saved: 0, pct: 0 });
  });

  it('raises automatic targets at display time without mutating their stored value', () => {
    const emergency: Goal = {
      id: 'ef', name: 'Emergency fund', target: 80_000, saved: 0, year: 2027, auto: 'ef',
      links: [{ instrumentId: 'cash', share: 100 }],
    };
    const data = baseData({
      holdings: [{ id: 'cash', kind: 'manual', name: 'Cash', type: 'Cash', invested: 45_000, value: 45_000, logs: [] }],
    });
    expect(emergencyMinimumTarget(0)).toBe(0);
    expect(emergencyMinimumTarget(20_000)).toBe(60_000);
    expect(emergencyMinimumTarget(20_000.01)).toBe(60_001);
    expect(effectiveEmergencyTarget(emergency, 30_000)).toEqual({
      target: 90_000, minimum: 90_000, raised: true,
    });
    expect(effectiveEmergencyTarget(emergency, 20_000)).toEqual({
      target: 80_000, minimum: 60_000, raised: false,
    });
    expect(goalView(emergency, { data, asOf: '2026-10-01', expenseBaseline: 30_000 })).toEqual({
      target: 90_000, minimum: 90_000, raised: true, saved: 45_000, pct: 50,
    });
    expect(goalView(otherGoal, { data, asOf: '2026-10-01', expenseBaseline: 30_000 })).toEqual({
      target: otherGoal.target, saved: otherGoal.saved, pct: 20,
    });
    expect(emergency.target).toBe(80_000);
    expect(goalTotals([emergency, otherGoal], 30_000, data, '2026-10-01')).toEqual({
      target: 110_000,
      saved: 49_000,
      pct: 49 / 110 * 100,
    });
  });
});

describe('transaction selectors', () => {
  const transactions = [
    tx('a', 'income', 50_000, '2026-10-01', 'Salary'),
    tx('b', 'expense', 27_713, '2026-10-02', 'Rent'),
    tx('c', 'invest', 2_000, '2026-10-02', 'Index fund'),
  ];

  it('summarizes income, spending, savings, investment, and overspend', () => {
    const summary = monthSummary(transactions, '2026-10');
    expect(summary).toMatchObject({
      income: 50_000,
      nonEarnedIncome: 0,
      expense: 27_713,
      invest: 2_000,
      net: 20_287,
      overspend: 0,
    });
    expect(summary.rates?.savedPct).toBeCloseTo(44.6, 1);
    expect(summary.rates?.investedPct).toBe(4);
    const over = monthSummary([
      tx('i', 'income', 10_000, '2026-10-01'),
      tx('e', 'expense', 9_000, '2026-10-02'),
      tx('v', 'invest', 3_000, '2026-10-03'),
    ], '2026-10');
    expect(over.overspend).toBe(2_000);
    expect(monthSummary([tx('e', 'expense', 5, '2026-10-01')], '2026-10')).toMatchObject({
      income: 0,
      rates: null,
      overspend: 0,
    });
    const includesWithdrawal = monthSummary([
      tx('salary', 'income', 40_000, '2026-10-01', 'Salary'),
      tx('withdrawal', 'income', 10_000, '2026-10-02', 'EF withdrawal', 'Withdrawal'),
      tx('expenses', 'expense', 20_000, '2026-10-03'),
      tx('investments', 'invest', 4_000, '2026-10-04'),
    ], '2026-10');
    expect(includesWithdrawal).toMatchObject({
      income: 50_000,
      withdrawals: 10_000,
      nonEarnedIncome: 10_000,
      earnedIncome: 40_000,
      net: 26_000,
      rates: { savedPct: 50, investedPct: 10 },
      overspend: 0,
    });
  });

  it('returns null rates for exactly zero earned income and preserves expenses-only summaries', () => {
    expect(monthSummary([
      tx('withdrawal', 'income', 10_000, '2026-10-02', 'Withdrawal', 'Withdrawal'),
    ], '2026-10').rates).toBeNull();
    expect(monthSummary([
      tx('salary', 'income', 40_000, '2026-10-01', 'Salary', 'Salary'),
      tx('withdrawal', 'income', 10_000, '2026-10-02', 'Withdrawal', 'Withdrawal'),
      tx('borrowed', 'income', 15_000, '2026-10-03', 'Borrowed', 'Borrowed'),
      tx('own-funds', 'income', 5_000, '2026-10-04', 'Own funds', 'Own funds'),
    ], '2026-10')).toMatchObject({ income: 70_000, withdrawals: 10_000, earnedIncome: 40_000, nonEarnedIncome: 30_000 });
    expect(monthSummary([
      tx('expense', 'expense', 100, '2026-10-01'),
    ], '2026-10')).toMatchObject({ income: 0, expense: 100, rates: null });
  });

  it('breaks down current-month expenses by category and excludes income and other months', () => {
    expect(expenseCategoryBreakdown([
      tx('festival', 'expense', 1_500, '2026-10-01', 'Festival', 'Festival'),
      tx('donation', 'expense', 500, '2026-10-02', 'Donation', 'Donation'),
      tx('gifts', 'expense', 1_000, '2026-10-03', 'Gifts', 'Gifts'),
      tx('health-premium', 'expense', 750, '2026-10-03', 'Health premium', 'Health premium'),
      tx('food', 'expense', 250, '2026-10-04', 'Food', 'Food'),
      tx('last-month', 'expense', 5_000, '2026-09-30', 'Festival', 'Festival'),
      tx('income', 'income', 20_000, '2026-10-05', 'Festival', 'Festival'),
    ], '2026-10')).toEqual([
      { category: 'Festival', amount: 1_500 },
      { category: 'Gifts', amount: 1_000 },
      { category: 'Health premium', amount: 750 },
      { category: 'Donation', amount: 500 },
      { category: 'Food', amount: 250 },
    ]);
  });

  it('filters by month, type, and case-insensitive query, then groups in order', () => {
    const txs = [
      tx('b', 'expense', 3, '2026-10-02', 'Rent'),
      tx('c', 'invest', 4, '2026-10-02', 'Index fund'),
      tx('other-investment', 'invest', 5, '2026-10-03', 'Other', 'Other'),
      tx('custom-investment', 'invest', 7, '2026-10-03', 'Fund', 'Fund'),
      tx('other-expense', 'expense', 6, '2026-10-03', 'Other', 'Other'),
      tx('a', 'income', 2, '2026-10-01', 'Salary'),
      tx('z', 'expense', 1, '2026-09-30', 'Rent'),
    ];
    expect(filterTransactions(txs, { month: '2026-10', type: 'all', query: ' RENT ' }).map((item) => item.id)).toEqual(['b']);
    expect(filterTransactions(txs, { month: '2026-10', type: 'income', query: '' }).map((item) => item.id)).toEqual(['a']);
    expect(filterTransactions(txs, {
      month: '2026-10',
      type: 'invest',
      query: '',
      category: 'Other investments',
      customCategories: new Set(['Fund']),
    }).map((item) => item.id)).toEqual(['other-investment', 'c']);
    expect(filterTransactions(txs, {
      month: '2026-10', type: 'invest', query: '', category: 'Fund', customCategories: new Set(['Fund']),
    }).map((item) => item.id)).toEqual(['custom-investment']);
    const filtered = filterTransactions(txs, { month: '2026-10', type: 'all', query: '' });
    expect(filtered.map((item) => item.id)).toEqual(['other-investment', 'other-expense', 'custom-investment', 'c', 'b', 'a']);
    expect(groupByDate(filtered).map((group) => [group.date, group.items.map((item) => item.id)])).toEqual([
      ['2026-10-03', ['other-investment', 'other-expense', 'custom-investment']],
      ['2026-10-02', ['c', 'b']],
      ['2026-10-01', ['a']],
    ]);
    expect(groupByDate([])).toEqual([]);
    expect(monthsWithData(txs)).toEqual(['2026-10', '2026-09']);
  });
});

describe('portfolio selectors', () => {
  const manual: ManualHolding = {
    id: 'manual',
    kind: 'manual',
    name: 'Account',
    type: 'Savings account',
    invested: 100,
    value: 120,
    logs: [],
  };
  const plan: PlanHolding = {
    id: 'plan',
    kind: 'plan',
    name: 'SIP',
    type: 'Mutual fund / SIP',
    frequency: 'monthly',
    amount: 1_000,
    ratePct: 0,
    stepUpPct: 0,
    tenureYears: 1,
    startDate: '2026-01-01',
    trackFrom: '2026-01-01',
    opening: 50,
    actualValue: null,
    actualValueDate: null,
    logs: [{ id: 'log', date: '2026-01-01', amount: 200, note: '', kind: 'Deposit' }],
  };

  it('builds holding rows and calculates totals', () => {
    const data = baseData({
      holdings: [manual, plan],
    });
    expect(holdingInvested(manual)).toBe(100);
    expect(holdingInvested(plan)).toBe(250);
    expect(holdingValue(manual, '2026-01-01')).toBe(100);
    const rows = buildPortfolioRows(data, '2026-01-01');
    expect(rows.map((row) => row.kind)).toEqual(['manual', 'plan']);
    expect(rows[1]!.value).toBe(250);
    expect(rows[0]!.gainPct).toBeNull();
    expect(portfolioTotals(rows)).toEqual({ invested: 350, value: 350, gain: 0, gainPct: 0 });
    expect(portfolioTotals([])).toEqual({ invested: 0, value: 0, gain: 0, gainPct: null });
    const zeroInvested = buildPortfolioRows(baseData({
      holdings: [{ ...manual, invested: 0 }],
    }), '2026-01-01');
    expect(zeroInvested[0]!.gainPct).toBeNull();
    const withdrawalAfterValue = buildPortfolioRows(baseData({
      holdings: [{
        ...manual,
        value: 120,
        valueAsOf: '2025-12-01',
        logs: [{ id: 'withdrawal', date: '2026-02-01', amount: 20, note: '', kind: 'Withdrawal' }],
      }],
    }), '2026-03-01');
    expect(withdrawalAfterValue[0]!.value).toBe(100);
    const unknownValueDate = holdingValue({
      ...manual,
      valueAsOf: undefined,
      logs: [{ id: 'new-deposit', date: '2026-01-01', amount: 10, note: '', kind: 'Deposit' }],
    }, '2026-01-01');
    expect(unknownValueDate).toBe(110);
    expect(portfolioTotals([{
      id: 'plain',
      kind: 'manual',
      name: 'Plain',
      type: 'Cash',
      invested: 100,
      value: 120,
      gain: 20,
      costRecovered: false,
      gainPct: 20,
    }])).toEqual({ invested: 100, value: 120, gain: 20, gainPct: 20 });
  });

  it('filters rows by every supported type and recurring schedule', () => {
    const holdings: Holding[] = [manual, plan];
    const types: HoldingType[] = [
      'Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit', 'Recurring deposit', 'EPFO / PF',
      'Savings account', 'Cash', 'Gold', 'Silver', 'Other',
    ];
    const rows = buildPortfolioRows(baseData({ holdings }), '2026-01-01');
    expect(filterRows(rows, 'All')).toEqual(rows);
    expect(filterRows(rows, 'Recurring').map((row) => row.kind)).toEqual(['plan']);
    for (const type of types) {
      expect(filterRows(rows, type).every((row) => row.type === type)).toBe(true);
    }
    expect(monthlyCommitment(holdings)).toBe(1_000);
    expect(monthlyCommitment([{
      ...plan,
      frequency: 'weekly',
      amount: 520,
    }])).toBe(520 * 52 / 12);
  });
});

describe('summary selectors', () => {
  const loan: RecurringLiability = {
    id: 'loan',
    kind: 'recurring',
    type: 'Other',
    name: 'Liability',
    principal: 3_000,
    ratePct: 0,
    tenureMonths: 3,
    emi: 1_000,
    startDate: '2026-01-01',
    payments: [{ id: 'paid', date: '2026-01-01', amount: 1_000, note: '', kind: 'EMI' }],
    settlement: null,
  };

  it('calculates net worth by summing assets and subtracting loan balances', () => {
    const data = baseData({
      liabilities: [loan],
      holdings: [
        { id: 'manual', kind: 'manual', name: 'Manual', type: 'Cash', invested: 10_000, value: 12_000, logs: [] },
        {
          id: 'plan', kind: 'plan', name: 'Plan', type: 'Mutual fund / SIP', frequency: 'monthly',
          amount: 1_000, ratePct: 0, stepUpPct: 0, tenureYears: 1, startDate: '2026-01-01',
          trackFrom: '2026-01-01', opening: 0, actualValue: 2_000, actualValueDate: '2026-01-01',
          logs: [{ id: 'log', date: '2026-01-01', amount: 1_000, note: '', kind: 'Deposit' }],
        },
        { id: 'migrated-cash', kind: 'manual', name: 'Emergency cash', type: 'Cash', invested: 500, value: 500, logs: [] },
      ],
    });
    // Undated manual values use their opening balance; dated snapshots remain authoritative.
    // Assets: 10,000 + 2,000 + 500 = 12,500. Liability balance: 3,000 - 1,000 = 2,000.
    expect(netWorth(data, '2026-01-01')).toEqual({ assets: 12_500, liabilities: 2_000, netWorth: 10_500 });
  });

  it('returns the pinned EF goal and the expense-baseline coverage on Home', () => {
    const data = baseData({
      transactions: [
        tx('jul', 'expense', 20_000, '2026-07-01'),
        tx('aug', 'expense', 24_000, '2026-08-01'),
        tx('sep', 'expense', 22_000, '2026-09-01'),
      ],
      holdings: [{ id: 'cash', kind: 'manual', name: 'Emergency cash', type: 'Cash', invested: 155_000, value: 155_000, logs: [] }],
      goals: [
        { id: 'goal', name: 'Trip', target: 10_000, saved: 2_000, year: 2027, links: [] },
        { id: 'emergency', name: 'Emergency fund', target: 300_000, saved: 0, year: 2028, auto: 'ef', links: [{ instrumentId: 'cash', share: 100 }] },
      ],
    });
    const summary = homeSummary(data, '2026-10-01');
    expect(summary.emergencyMonths).toBe(155_000 / 22_000);
    expect(summary.goals[0]).toMatchObject({
      goal: { id: 'emergency', auto: 'ef' },
      target: 300_000,
      saved: 155_000,
      raised: false,
    });
  });

  describe('holding downstream selector preservation', () => {
    const asOf = '2026-11-04';

    function snapshot(data: AppData) {
      const linkedBudgetItems = (data.budgetPlan?.items ?? []).filter((item) => item.holdingId);
      const dues = pendingItems(data, asOf.slice(0, 7), asOf);
      const reminders = planReminders(
        data,
        { enabled: true, localTime: '09:00', dayBefore: true, sameDay: true, showAmounts: false, hidePreviews: false },
        new Date(2026, 10, 4, 8),
        10_000,
      );
      const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
      const emergencyLinkedIds = new Set(emergencyGoal?.links.map((link) => link.instrumentId) ?? []);
      const efAvailable = Object.fromEntries(Object.entries(data.efBucketLinks).map(([bucketId, holdingIds]) => [
        bucketId,
        holdingIds
          .filter((id) => emergencyLinkedIds.has(id))
          .reduce((sum, id) => {
            const holding = data.holdings.find((item) => item.id === id);
            return sum + (holding ? holdingValue(holding, asOf) : 0);
          }, 0),
      ]));
      const worth = netWorth(data, asOf);
      return {
        budgetLinks: {
          count: linkedBudgetItems.length,
          amount: linkedBudgetItems.reduce((sum, item) => sum + item.value, 0),
        },
        pending: { count: dues.length, amount: dues.reduce((sum, item) => sum + item.amount, 0) },
        reminders: { count: reminders.length },
        goals: { count: data.goals.length, saved: data.goals.reduce((sum, goal) => sum + goalSavedFor(goal, data, asOf), 0) },
        efAvailable: {
          buckets: efAvailable,
          total: Object.values(efAvailable).reduce((sum, amount) => sum + amount, 0),
        },
        netWorth: worth,
      };
    }

    it('preserves linked outputs and legacy linked-invested values for mock and demo data', () => {
      const datasets = [
        { name: 'mock', data: mockAppData },
        { name: 'demo', data: buildDemoData(asOf) },
      ];
      for (const { name, data } of datasets) {
        const plan = data.holdings.find((holding): holding is PlanHolding =>
          holding.kind === 'plan' && holdingCapabilities(holding.type).recurring,
        );
        if (!plan) throw new Error(`${name} fixture is missing a recurring holding.`);
        const baseBudgetPlan = data.budgetPlan ?? budgetPlanFromLines([], {
          incomes: [],
          repeatMonthly: true,
          repeatFrom: asOf.slice(0, 7),
        });
        const linkedItem = budgetItemsFromLines([
          { category: plan.type, planned: plan.amount, dueDay: 15 },
        ], baseBudgetPlan.sections)[0];
        if (!linkedItem) throw new Error(`${name} fixture budget row is missing.`);
        const linkedData = {
          ...data,
          budgetPlan: {
            ...baseBudgetPlan,
            items: [
              ...baseBudgetPlan.items.filter((item) => item.holdingId !== plan.id),
              { ...linkedItem, holdingId: plan.id },
            ],
          },
        };
        const current = snapshot(linkedData);
        const previousLinkedInvested = data.holdings.map((holding) => {
          const opening = holding.kind === 'plan' ? holding.opening : holding.invested;
          const deposits = holding.logs
            .filter((entry) => entry.kind === 'Deposit')
            .reduce((sum, entry) => sum + entry.amount, 0);
          const legacyValue = opening + deposits;
          expect(holdingContributions(holding)).toBe(legacyValue);
          return { id: holding.id, invested: legacyValue };
        });
        const holdingIds = new Set(data.holdings.map((holding) => holding.id));
        expect(linkableInstruments(data, asOf)
          .filter(({ id }) => holdingIds.has(id))
          .map(({ id, invested }) => ({ id, invested })))
          .toEqual(previousLinkedInvested);
        if (name === 'mock') {
          expect(current).toEqual({
            budgetLinks: { count: 1, amount: 21_200 },
            pending: { count: 2, amount: 30_101.32 },
            reminders: { count: 910 },
            goals: { count: 4, saved: 490_956 },
            efAvailable: { buckets: {}, total: 0 },
            netWorth: { assets: 505_441, liabilities: 327_903.9418739316, netWorth: 177_537.05812606838 },
          });
        } else {
          expect(current).toEqual({
            budgetLinks: { count: 1, amount: 2_000 },
            pending: { count: 34, amount: 38_900 },
            reminders: { count: 869 },
            goals: { count: 5, saved: 487_300 },
            efAvailable: { buckets: { cash: 25_000, bank: 92_000, 'fd-rd': 70_000 }, total: 187_000 },
            netWorth: { assets: 524_000, liabilities: 389_107.9299748545, netWorth: 134_892.07002514548 },
          });
        }
      }
    });
  });

  it('summarizes active loan commitments, payoff date, cleared and never cases', () => {
    const data = baseData({
      liabilities: [
        loan,
        { ...loan, id: 'shorter', principal: 1_000, emi: 1_000, payments: [] },
        { ...loan, id: 'cleared', principal: 0 },
      ],
      transactions: [
        tx('income', 'income', 40_000, '2025-12-01', 'Salary'),
        tx('withdrawal', 'income', 10_000, '2025-12-02', 'EF withdrawal', 'Withdrawal'),
      ],
    });
    const overview = liabilitiesOverview(data, '2026-01-01', 100);
    expect(overview.totalOutstanding).toBe(3_000);
    expect(overview.monthlyEmi).toBe(2_000);
    expect(overview.emiPctOfIncome).toBe(5);
    expect(overview.debtFreeBy).toBe('2026-03-01');
    expect(liabilitiesOverview(baseData(), '2026-01-01', 0)).toMatchObject({
      totalOutstanding: 0,
      monthlyEmi: 0,
      emiPctOfIncome: null,
      debtFreeBy: null,
    });
    const never = liabilitiesOverview(baseData({
      liabilities: [{ ...loan, emi: 1, ratePct: 12 }],
    }), '2026-01-01', 0);
    expect(never.debtFreeBy).toBe('never');
  });
});
