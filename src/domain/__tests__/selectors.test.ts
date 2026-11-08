import {
  buildPortfolioRows,
  defaultEfTarget,
  efBalance,
  efPassbook,
  ensureEfGoal,
  filterRows,
  filterTransactions,
  goalProgressPct,
  goalSaved,
  goalTotals,
  groupByDate,
  holdingInvested,
  holdingValue,
  homeSummary,
  loansOverview,
  milestones,
  monthlyBaseline,
  monthlyCommitment,
  monthSummary,
  monthsCovered,
  monthsWithData,
  netWorth,
  portfolioTotals,
} from '../index';
import type { AppData, EfEntry, Goal, Holding, HoldingType, Loan, Transaction } from '../types';

const tx = (
  id: string,
  type: Transaction['type'],
  amount: number,
  date: string,
  note = id,
  category = 'General',
): Transaction => ({ id, type, amount, date, note, category });

const baseData = (changes: Partial<AppData> = {}): AppData => ({
  settings: { name: 'Test', theme: 'system' },
  transactions: [],
  goals: [],
  holdings: [],
  loans: [],
  efEntries: [],
  ...changes,
});

describe('emergency fund calculations', () => {
  it('calculates balance and a newest-first passbook with running balances', () => {
    const entries: EfEntry[] = [
      { id: 'opening', date: '2026-01-01', amount: 10_000, note: 'Opening' },
      { id: 'deposit', date: '2026-02-01', amount: 2_000, note: 'Deposit' },
      { id: 'withdrawal', date: '2026-03-01', amount: -3_000, note: 'Withdrawal' },
    ];
    expect(efBalance(entries)).toBe(9_000);
    expect(efPassbook(entries)).toEqual([
      { ...entries[2]!, balance: 9_000 },
      { ...entries[1]!, balance: 12_000 },
      { ...entries[0]!, balance: 10_000 },
    ]);
    const sameDate: EfEntry[] = [
      { id: 'first', date: '2026-01-01', amount: 10, note: '' },
      { id: 'second', date: '2026-01-01', amount: 20, note: '' },
    ];
    expect(efPassbook(sameDate).map((entry) => entry.id)).toEqual(['second', 'first']);
  });

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
  const otherGoal: Goal = { id: 'other', name: 'Travel', target: 20_000, saved: 4_000, year: 2028 };

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
    });
    expect(empty).toHaveLength(0);
    expect(defaultEfTarget(0)).toBe(300_000);
    const named: Goal[] = [{ id: 'ef-name', name: 'eMeRgEnCy FuNd', target: 30_000, saved: 2, year: 2027 }, otherGoal];
    const converted = ensureEfGoal(named, { expenseBaseline: 1, asOf: '2026-10-09' });
    expect(converted[0]).toMatchObject({ id: 'ef-name', auto: 'ef' });
    expect(named[0]!.auto).toBeUndefined();
    const alreadyAuto: Goal[] = [otherGoal, { id: 'auto', name: 'EF', target: 5_000, saved: 3, year: 2030, auto: 'ef' }];
    const pinned = ensureEfGoal(alreadyAuto, { expenseBaseline: 0, asOf: '2026-10-09' });
    expect(pinned.map((goal) => goal.id)).toEqual(['auto', 'other']);
    expect(ensureEfGoal(pinned, { expenseBaseline: 99, asOf: '2027-01-01' })).toEqual(pinned);
  });

  it('syncs emergency savings and calculates goal totals with clamped progress', () => {
    const linked: Goal = { id: 'ef', name: 'Emergency', target: 10_000, saved: 1, year: 2027, auto: 'ef' };
    expect(goalSaved(linked, 12_000)).toBe(12_000);
    expect(goalSaved(otherGoal, 12_000)).toBe(4_000);
    expect(goalProgressPct(linked, 15_000)).toBe(100);
    expect(goalProgressPct(linked, -1)).toBe(0);
    expect(goalProgressPct({ ...linked, target: 0 }, 10)).toBe(0);
    expect(goalTotals([linked, otherGoal], 12_000)).toEqual({ target: 30_000, saved: 16_000, pct: 160 / 3 });
    expect(goalTotals([], 0)).toEqual({ target: 0, saved: 0, pct: 0 });
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
      expense: 27_713,
      invest: 2_000,
      net: 20_287,
      investedPct: 4,
      overspend: 0,
    });
    expect(summary.savedPct).toBeCloseTo(44.6, 1);
    const over = monthSummary([
      tx('i', 'income', 10_000, '2026-10-01'),
      tx('e', 'expense', 9_000, '2026-10-02'),
      tx('v', 'invest', 3_000, '2026-10-03'),
    ], '2026-10');
    expect(over.overspend).toBe(2_000);
    expect(monthSummary([tx('e', 'expense', 5, '2026-10-01')], '2026-10')).toMatchObject({
      income: 0,
      savedPct: null,
      investedPct: null,
      overspend: 0,
    });
  });

  it('filters by month, type, and case-insensitive query, then groups in order', () => {
    const txs = [
      tx('b', 'expense', 3, '2026-10-02', 'Rent'),
      tx('c', 'invest', 4, '2026-10-02', 'Index fund'),
      tx('a', 'income', 2, '2026-10-01', 'Salary'),
      tx('z', 'expense', 1, '2026-09-30', 'Rent'),
    ];
    expect(filterTransactions(txs, { month: '2026-10', type: 'all', query: ' RENT ' }).map((item) => item.id)).toEqual(['b']);
    expect(filterTransactions(txs, { month: '2026-10', type: 'income', query: '' }).map((item) => item.id)).toEqual(['a']);
    const filtered = filterTransactions(txs, { month: '2026-10', type: 'all', query: '' });
    expect(filtered.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    expect(groupByDate(filtered).map((group) => [group.date, group.items.map((item) => item.id)])).toEqual([
      ['2026-10-02', ['c', 'b']],
      ['2026-10-01', ['a']],
    ]);
    expect(groupByDate([])).toEqual([]);
    expect(monthsWithData(txs)).toEqual(['2026-10', '2026-09']);
  });
});

describe('portfolio selectors', () => {
  const manual: Holding = {
    id: 'manual',
    kind: 'manual',
    name: 'Account',
    type: 'Savings account',
    invested: 100,
    value: 120,
  };
  const plan: Holding = {
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
    opening: 50,
    actualValue: null,
    logs: [{ id: 'log', date: '2026-01-01', amount: 200, note: '' }],
  };

  it('builds holding rows and auto-synced fund, and calculates totals', () => {
    const data = baseData({
      holdings: [manual, plan],
      efEntries: [{ id: 'ef', date: '2026-01-01', amount: 300, note: '' }],
    });
    expect(holdingInvested(manual)).toBe(100);
    expect(holdingInvested(plan)).toBe(250);
    expect(holdingValue(manual, '2026-01-01')).toBe(120);
    const rows = buildPortfolioRows(data, '2026-01-01');
    expect(rows.map((row) => row.kind)).toEqual(['manual', 'plan', 'auto-ef']);
    expect(rows[1]!.value).toBe(250);
    expect(rows[2]).toMatchObject({ invested: 300, value: 300, type: 'Emergency fund' });
    expect(rows[0]!.gainPct).toBe(20);
    expect(portfolioTotals(rows)).toEqual({ invested: 650, value: 670, gain: 20, gainPct: 20 / 650 * 100 });
    expect(portfolioTotals([])).toEqual({ invested: 0, value: 0, gain: 0, gainPct: null });
    const zeroInvested = buildPortfolioRows(baseData({
      holdings: [{ ...manual, invested: 0 }],
    }), '2026-01-01');
    expect(zeroInvested[0]!.gainPct).toBeNull();
  });

  it('filters rows by every supported type, recurring, and emergency fund', () => {
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
    expect(filterRows(rows, 'Emergency fund').map((row) => row.kind)).toEqual(['auto-ef']);
    expect(monthlyCommitment(holdings)).toBe(1_000);
    expect(monthlyCommitment([{
      ...plan,
      frequency: 'weekly',
      amount: 520,
    }])).toBe(520 * 52 / 12);
  });
});

describe('summary selectors', () => {
  const loan: Loan = {
    id: 'loan',
    name: 'Loan',
    principal: 3_000,
    ratePct: 0,
    tenureMonths: 3,
    emi: 1_000,
    startDate: '2026-01-01',
    payments: [{ id: 'paid', date: '2026-01-01', amount: 1_000, note: '' }],
  };

  it('calculates net worth by summing assets and subtracting loan balances', () => {
    const data = baseData({
      holdings: [
        { id: 'manual', kind: 'manual', name: 'Manual', type: 'Cash', invested: 10_000, value: 12_000 },
        {
          id: 'plan', kind: 'plan', name: 'Plan', type: 'Mutual fund / SIP', frequency: 'monthly',
          amount: 1_000, ratePct: 0, stepUpPct: 0, tenureYears: 1, startDate: '2026-01-01',
          opening: 0, actualValue: 2_000,
          logs: [{ id: 'log', date: '2026-01-01', amount: 1_000, note: '' }],
        },
      ],
      loans: [loan],
      efEntries: [{ id: 'ef', date: '2026-01-01', amount: 500, note: '' }],
    });
    // Assets: 12,000 + 2,000 + 500 = 14,500. Loan balance: 3,000 - 1,000 = 2,000.
    expect(netWorth(data, '2026-01-01')).toEqual({ assets: 14_500, liabilities: 2_000, netWorth: 12_500 });
  });

  it('returns the pinned EF goal and the expense-baseline coverage on Home', () => {
    const data = baseData({
      transactions: [
        tx('jul', 'expense', 20_000, '2026-07-01'),
        tx('aug', 'expense', 24_000, '2026-08-01'),
        tx('sep', 'expense', 22_000, '2026-09-01'),
      ],
      efEntries: [{ id: 'ef', date: '2026-09-01', amount: 155_000, note: '' }],
      goals: [{ id: 'goal', name: 'Trip', target: 10_000, saved: 2_000, year: 2027 }],
    });
    const summary = homeSummary(data, '2026-10-01');
    expect(summary.emergencyMonths).toBe(155_000 / 22_000);
    expect(summary.goals[0]).toMatchObject({ goal: { id: 'goal-emergency', auto: 'ef' }, saved: 155_000 });
  });

  it('summarizes active loan commitments, payoff date, cleared and never cases', () => {
    const data = baseData({
      loans: [
        loan,
        { ...loan, id: 'shorter', principal: 1_000, emi: 1_000, payments: [] },
        { ...loan, id: 'cleared', principal: 0 },
      ],
      transactions: [tx('income', 'income', 10_000, '2025-12-01')],
    });
    const overview = loansOverview(data, '2026-01-01', 100);
    expect(overview.totalOutstanding).toBe(3_000);
    expect(overview.monthlyEmi).toBe(2_000);
    expect(overview.emiPctOfIncome).toBe(20);
    expect(overview.loanFreeBy).toBe('2026-03-01');
    expect(loansOverview(baseData(), '2026-01-01', 0)).toMatchObject({
      totalOutstanding: 0,
      monthlyEmi: 0,
      emiPctOfIncome: null,
      loanFreeBy: null,
    });
    const never = loansOverview(baseData({
      loans: [{ ...loan, emi: 1, ratePct: 12 }],
    }), '2026-01-01', 0);
    expect(never.loanFreeBy).toBe('never');
  });
});
