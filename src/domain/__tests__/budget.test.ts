import { emptyAppData } from '../actions';
import { pendingItems } from '../pending';
import { filterTransactions, monthSummary, transactionCategoryLabel } from '../transactions';
import {
  appDataSchema,
  BUDGET_CATEGORIES,
  TRANSACTION_CATEGORIES,
} from '../schemas';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import {
  BUDGET_CATEGORY_WEIGHTS,
  BUDGET_GROUPS,
  applyBudgetPlanToMonth,
  budgetGroupFor,
  budgetMonthView,
  clearMonthBudget,
  customizeMonthBudget,
  ensureCurrentMonthBudget,
  linkedRecurringForMonth,
  MissingPlannedIncomeError,
  monthlyCommitments,
  outstandingAt,
  resolveBudgetPlan,
  restoreBudgetPlanAndMonth,
  restoreMonthBudget,
  saveAndApplyBudgetPlan,
  setBudgetPlan,
  setBudgetRepeat,
  suggestBudgetSplit,
} from '../budget';
import { validateImportData } from '../backup';
import type { Liability, PlanHolding, Policy, Transaction } from '../types';

const plan: PlanHolding = {
  id: 'plan', kind: 'plan', name: 'Monthly fund', type: 'Mutual fund / SIP',
  frequency: 'monthly', amount: 100, ratePct: 0, stepUpPct: 0, tenureYears: 1,
  startDate: '2026-03-05', trackFrom: '2026-03-05', opening: 0,
  actualValue: null, actualValueDate: null, logs: [],
};
const liability: Liability = {
  id: 'debt', kind: 'one-time', name: 'Friend', type: 'Borrowed money', principal: 500,
  ratePct: 0, startDate: '2026-03-01', dueDate: '2026-03-20',
  payments: [{ id: 'partial', date: '2026-03-10', amount: 25, note: '', kind: 'Payment' }],
};
const policy: Policy = {
  id: 'policy', name: 'Health cover', insurer: '', kind: 'health', premium: 60,
  frequency: 'monthly', startDate: '2026-03-05', premiumYears: 1,
  trackFrom: '2026-03-05', coverAmount: null, currentValue: null, valueAsOf: null,
  maturityDate: null, payments: [],
};
const recurringLiability: Liability = {
  id: 'recurring', kind: 'recurring', name: 'Monthly loan', type: 'Personal loan',
  principal: 1_000, ratePct: 0, startDate: '2026-02-05', tenureMonths: 12, emi: 100,
  settlement: null,
  payments: [{ id: 'emi-paid', date: '2026-03-06', amount: 100, note: '', kind: 'EMI' }],
};
const quarterlyPolicy: Policy = {
  ...policy, id: 'quarterly', name: 'Quarterly cover', premium: 90,
  frequency: 'quarterly', premiumYears: 1, startDate: '2025-12-05', trackFrom: '2025-12-05',
};

describe('budget plans and monthly views', () => {
  it('maps every budget category to exactly one requested group and demonstrates each in mock budget data', () => {
    expect(BUDGET_GROUPS.map(({ name, weight, categories }) => [name, weight, categories])).toEqual([
      ['Survival (Needs)', 50, ['Living', 'Rent', 'Utilities', 'Food', 'Transport', 'Family', 'Health', 'Bills', 'Education', 'EMI', 'Insurance']],
      ['Savings and Investments', 20, ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments']],
      ['Wants', 15, ['Shopping', 'Other', 'Eating out', 'Entertainment', 'Fashion', 'Subscriptions', 'Personal spending', 'Travel']],
      ['Festival, Donations, Culture', 5, ['Festival', 'Donation', 'Gifts', 'Culture']],
      ['Unexpected Extras', 10, ['Unexpected']],
    ]);
    const groupedCategories = BUDGET_GROUPS.flatMap(({ categories }) => categories);
    expect([...groupedCategories].sort()).toEqual([...BUDGET_CATEGORIES].sort());
    expect(new Set(groupedCategories).size).toBe(BUDGET_CATEGORIES.length);
    for (const category of BUDGET_CATEGORIES) {
      expect(BUDGET_GROUPS.filter((group) => group.categories.includes(category))).toHaveLength(1);
      expect(budgetGroupFor(category)?.categories).toContain(category);
    }
    expect(BUDGET_GROUPS.reduce((total, group) => total + group.weight, 0)).toBe(100);
    expect(appDataSchema.safeParse(mockAppData).success).toBe(true);
    const demoBudget = mockAppData.budget;
    if (!demoBudget) throw new Error('Mock data must include a demo budget.');
    const demoGroups = new Set(demoBudget.lines.map(({ category }) =>
      budgetGroupFor(category)?.id,
    ));
    expect(demoGroups).toEqual(new Set(BUDGET_GROUPS.map(({ id }) => id)));
  });

  it('resolves amount and percentage lines and requires income for percentages', () => {
    expect(resolveBudgetPlan({
      plannedIncome: 12_345,
      lines: [
        { category: 'Food', mode: 'amount', value: 500 },
        { category: 'Bills', mode: 'percent', value: 12.5 },
      ],
    })).toEqual([{ category: 'Food', planned: 500 }, { category: 'Bills', planned: 1543 }]);
    expect(() => resolveBudgetPlan({
      plannedIncome: null,
      lines: [{ category: 'Bills', mode: 'percent', value: 10 }],
    })).toThrow(MissingPlannedIncomeError);
  });

  it('suggests rounded five-group allocations, respects commitments, and warns on group overages', () => {
    const ordinary = suggestBudgetSplit({ plannedIncome: 10_000, commitments: [] });
    expect(ordinary.lines).toHaveLength(BUDGET_CATEGORIES.length);
    expect(ordinary.lines.find((line) => line.category === 'Living')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Food')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Shopping')?.planned).toBe(400);
    expect(ordinary.lines.find((line) => line.category === 'Other')?.planned).toBe(200);
    expect(ordinary.lines.find((line) => line.category === 'Festival')?.planned).toBe(200);
    expect(ordinary.lines.find((line) => line.category === 'Unexpected')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Other investments')?.planned).toBe(800);
    expect(ordinary.lines.find((line) => line.category === 'Mutual fund / SIP')?.planned).toBe(500);
    expect(ordinary.warnings).toEqual([]);
    const committed = suggestBudgetSplit({
      plannedIncome: 10_000,
      commitments: [{ kind: 'liability', id: 'd', name: 'Debt', category: 'EMI',
        dueDate: '2026-03-20', plannedAmount: 1_000, status: 'upcoming', paidAmount: 0 }],
    });
    expect(committed.lines.find((line) => line.category === 'EMI')?.planned).toBe(1_200);
    expect(committed.lines.find((line) => line.category === 'Food')?.planned).toBe(800);
    const overspent = suggestBudgetSplit({
      plannedIncome: 10_000,
      commitments: [{ kind: 'liability', id: 'd', name: 'Debt', category: 'EMI',
        dueDate: '2026-03-20', plannedAmount: 6_000, status: 'overdue', paidAmount: 0 }],
    });
    expect(overspent.lines.find((line) => line.category === 'EMI')?.planned).toBe(6_000);
    expect(overspent.warnings).toEqual(['Survival (Needs) commitments exceed its 50% allocation.']);
    expect(overspent.lines.every((line) => line.planned >= 0)).toBe(true);
    const savingsOver = suggestBudgetSplit({
      plannedIncome: 10_000,
      commitments: [{ kind: 'plan', id: 'p', name: 'Plan', category: 'Mutual fund / SIP',
        dueDate: '2026-03-05', plannedAmount: 3_000, status: 'overdue', paidAmount: 0 }],
    });
    expect(savingsOver.warnings).toHaveLength(1);
    expect(savingsOver.lines.find((line) => line.category === 'Mutual fund / SIP')?.planned).toBe(3_000);
    expect(savingsOver.lines.every((line) => line.planned >= 0)).toBe(true);
  });

  it('keeps fixed within-group weights at 100% and rounds each category to the nearest hundred', () => {
    for (const group of BUDGET_GROUPS) {
      const weights = BUDGET_CATEGORY_WEIGHTS[group.id];
      if (!weights) throw new Error(`Missing weights for ${group.id}`);
      expect(Object.values(weights).reduce((total, weight) => total + weight, 0)).toBe(100);
    }
    const { lines } = suggestBudgetSplit({ plannedIncome: 10_001, commitments: [] });
    expect(lines.find(({ category }) => category === 'Living')?.planned).toBe(1_000);
    expect(lines.find(({ category }) => category === 'Eating out')?.planned).toBe(200);
    expect(lines.every(({ planned }) => planned >= 0 && planned % 100 === 0)).toBe(true);
  });

  it('accepts the new expense categories in transactions, filters and budget schemas', () => {
    const categories = [
      'Eating out', 'Entertainment', 'Fashion', 'Culture', 'Unexpected',
      'Rent', 'Utilities', 'Subscriptions', 'Personal spending', 'Travel',
    ] as const;
    const transactions = categories.map((category, index) => ({
      id: `expense-${index}`,
      date: '2026-03-10',
      type: 'expense' as const,
      amount: 25 + index,
      category,
      note: category,
    }));
    const data = {
      ...emptyAppData('2026-03-01'),
      transactions,
      monthBudgets: [{
        month: '2026-03',
        source: 'custom' as const,
        plannedIncome: 1_000,
        lines: categories.map((category) => ({ category, planned: 100 })),
      }],
      budgetPlan: {
        plannedIncome: 1_000,
        lines: categories.map((category) => ({ category, mode: 'amount' as const, value: 100 })),
        repeatMonthly: false,
        repeatFrom: null,
      },
    };
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(validateImportData(data).ok).toBe(true);
    expect(TRANSACTION_CATEGORIES.expense).toEqual(expect.arrayContaining(categories));
    for (const category of categories) {
      expect(transactionCategoryLabel(category, 'expense'))
        .toBe(category === 'Unexpected' ? 'Unexpected extras' : category);
    }
    const view = budgetMonthView(data, '2026-03');
    expect(view.lines.map(({ category, actual }) => [category, actual])).toEqual(
      categories.map((category, index) => [category, 25 + index]),
    );
    for (const category of categories) {
      expect(filterTransactions(transactions, {
        month: '2026-03', type: 'all', query: '', category,
      })).toHaveLength(1);
    }
  });

  it('saves and applies the single plan with percent conversion, due days and untouched transactions', () => {
    const initial = emptyAppData('2026-03-01');
    const transactions = [{
      id: 'existing',
      type: 'expense' as const,
      amount: 50,
      category: 'Food',
      note: 'recorded',
      date: '2026-03-02',
    }];
    const plan = {
      plannedIncome: 10_000,
      lines: [
        { category: 'Food', mode: 'percent' as const, value: 20 },
        { category: 'Bills', mode: 'amount' as const, value: 500, dueDay: 31 },
      ],
      repeatMonthly: false,
      repeatFrom: null,
    };
    const saved = setBudgetPlan({ ...initial, transactions }, plan);
    const applied = applyBudgetPlanToMonth(saved, '2026-03', { newId: () => 'unused', today: '2026-03-10' });
    expect(applied.monthBudgets?.[0]).toEqual({
      month: '2026-03',
      source: 'plan',
      plannedIncome: 10_000,
      lines: [
        { category: 'Food', planned: 2_000 },
        { category: 'Bills', planned: 500, dueDay: 31 },
      ],
      linkedIncluded: true,
    });
    expect(applied.transactions).toEqual(transactions);
    expect(applied.budgetPlan).toEqual(plan);
  });

  it('customizes one month and restores its exact previous snapshot', () => {
    const data = emptyAppData('2026-03-01');
    const original = {
      month: '2026-03',
      source: 'plan' as const,
      plannedIncome: 10_000,
      lines: [{ category: 'Food', planned: 500, dueDay: 5 }],
      linkedIncluded: true,
    };
    const withSnapshot = { ...data, monthBudgets: [original] };
    const customized = customizeMonthBudget(withSnapshot, '2026-03', {
      plannedIncome: 12_000,
      lines: [{ category: 'Food', planned: 1_000 }],
    });
    expect(customized.monthBudgets?.[0]).toMatchObject({
      month: '2026-03',
      source: 'custom' as const,
      plannedIncome: 12_000,
      lines: [{ category: 'Food', planned: 1_000 }],
    });
    expect(restoreMonthBudget(customized, '2026-03', original)).toEqual(withSnapshot);
    expect(clearMonthBudget(withSnapshot, '2026-03').monthBudgets).toEqual([]);
    expect(clearMonthBudget(withSnapshot, '2026-02')).toBe(withSnapshot);
    expect(() => customizeMonthBudget(data, 'not-a-month', { plannedIncome: null })).toThrow(RangeError);
  });

  it('undoes applying a changed plan and month snapshot to a deep-equal state', () => {
    const previousPlan = {
      plannedIncome: 10_000,
      lines: [{ category: 'Food', mode: 'amount' as const, value: 2_000 }],
      repeatMonthly: false,
      repeatFrom: null,
    };
    const previousMonth = {
      month: '2026-03',
      source: 'custom' as const,
      plannedIncome: 9_000,
      lines: [{ category: 'Bills', planned: 500 }],
    };
    const before = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: previousPlan,
      monthBudgets: [previousMonth],
    };
    const applied = saveAndApplyBudgetPlan(before, {
      plannedIncome: 12_000,
      lines: [{ category: 'Food', mode: 'percent', value: 25 }],
      repeatMonthly: true,
      repeatFrom: '2026-04',
    }, '2026-03', { newId: () => 'unused', today: '2026-03-10' });
    expect(restoreBudgetPlanAndMonth(applied, previousPlan, '2026-03', previousMonth)).toEqual(before);
  });

  it('repeats only from the configured month, applies current month once and never backfills', () => {
    const plan = {
      plannedIncome: 1_000,
      lines: [{ category: 'Food', mode: 'amount' as const, value: 100 }],
      repeatMonthly: true,
      repeatFrom: '2026-03',
    };
    const data = setBudgetPlan(emptyAppData('2026-03-01'), plan);
    expect(ensureCurrentMonthBudget(data, '2026-02-12', () => 'unused')).toBe(data);
    const ensured = ensureCurrentMonthBudget(data, '2026-03-12', () => 'unused');
    expect(ensured.monthBudgets?.map((row) => row.month)).toEqual(['2026-03']);
    expect(ensureCurrentMonthBudget(ensured, '2026-03-12', () => 'unused')).toBe(ensured);
    expect(ensureCurrentMonthBudget(ensured, '2026-04-12', () => 'unused').monthBudgets?.map((row) => row.month))
      .toEqual(['2026-03', '2026-04']);
    const nonRepeating = setBudgetRepeat(data, false, null);
    expect(ensureCurrentMonthBudget(nonRepeating, '2026-03-12', () => 'unused')).toBe(nonRepeating);
    expect(ensureCurrentMonthBudget(emptyAppData('2026-03-01'), '2026-03-12', () => 'unused'))
      .toEqual(emptyAppData('2026-03-01'));

    const incomeData = emptyAppData('2026-03-01');
    incomeData.settings.monthlySalary = 1_000;
    const percentPlan = setBudgetPlan(incomeData, {
      plannedIncome: null,
      lines: [{ category: 'Bills', mode: 'percent', value: 25 }],
      repeatMonthly: true,
      repeatFrom: '2026-03',
    });
    const percentApplied = ensureCurrentMonthBudget(percentPlan, '2026-03-12', () => 'unused');
    expect(percentApplied.monthBudgets?.[0]?.lines).toEqual([{ category: 'Bills', planned: 250 }]);
  });

  it('lists scheduled commitments for plans, one-time liabilities, and premiums', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [plan, {
        id: 'manual', kind: 'manual' as const, name: 'Cash', type: 'Cash' as const,
        invested: 100, value: 100, logs: [],
      }],
      liabilities: [liability, recurringLiability, { ...liability, id: 'undated', dueDate: null }],
      policies: [policy, quarterlyPolicy],
    };
    const commitments = monthlyCommitments(data, '2026-03');
    expect(commitments).toHaveLength(5);
    expect(commitments.map(({ kind, category }) => `${kind}:${category}`)).toEqual([
      'plan:Mutual fund / SIP',
      'liability:EMI',
      'policy:Insurance',
      'policy:Insurance',
      'liability:EMI',
    ]);
    expect(commitments[1]?.status).toBe('paid');
    expect(commitments[1]?.paidAmount).toBe(100);
    expect(commitments[4]?.paidAmount).toBe(25);
    expect(() => monthlyCommitments(data, '2026-13')).toThrow(RangeError);
  });

  it('projects paid and unpaid recurring schedule rows by month and category', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [{
        ...plan,
        logs: [{ id: 'plan-paid', date: '2026-03-05', amount: 100, note: '', kind: 'Deposit' as const }],
      }],
      liabilities: [
        recurringLiability,
        liability,
        {
          ...liability,
          id: 'settled',
          payments: [{ id: 'full', date: '2026-03-10', amount: 500, note: '', kind: 'Payment' as const }],
        },
        { ...liability, id: 'undated', dueDate: null },
      ],
      policies: [{
        ...policy,
        payments: [{ id: 'premium-paid', date: '2026-03-05', amount: 60, note: '' }],
      }, quarterlyPolicy],
    };
    const rows = linkedRecurringForMonth(data, '2026-03', '2026-03-31');

    expect(rows.map(({ kind, category, dueDate, status }) => [kind, category, dueDate, status])).toEqual([
      ['policy', 'Insurance', '2026-03-05', 'paid'],
      ['plan', 'Mutual fund / SIP', '2026-03-05', 'paid'],
      ['liability', 'EMI', '2026-03-05', 'paid'],
      ['policy', 'Insurance', '2026-03-05', 'ongoing'],
      ['liability', 'EMI', '2026-03-20', 'overdue'],
    ]);
    expect(rows.map((row) => row.id)).toEqual(expect.arrayContaining([
      'plan:plan:plan:0',
      'liability:recurring:liability:1',
    ]));
    expect(rows.find((row) => row.id.startsWith('liability:debt:'))?.amount).toBe(475);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(linkedRecurringForMonth(data, '2026-03', '2026-03-04')
      .find((row) => row.kind === 'plan')?.status).toBe('upcoming');
    expect(() => linkedRecurringForMonth(data, '2026-13', '2026-03-31')).toThrow(RangeError);
  });

  it('matches calendar months, including leap February and demo schedule rows', () => {
    const monthEndPlan: PlanHolding = {
      ...plan,
      id: 'month-end-plan',
      startDate: '2024-01-31',
      trackFrom: '2024-01-31',
    };
    expect(linkedRecurringForMonth({
      ...emptyAppData('2024-01-01'),
      holdings: [monthEndPlan],
    }, '2024-02', '2024-02-01')).toMatchObject([
      { dueDate: '2024-02-29', status: 'upcoming' },
    ]);
    const demoRows = linkedRecurringForMonth(
      buildDemoData('2026-10-17'), '2026-10', '2026-10-17',
    );
    expect(demoRows.length).toBeGreaterThan(0);
    expect(demoRows.every((row) => row.dueDate.startsWith('2026-10-'))).toBe(true);
    expect(demoRows.map((row) => row.category)).toEqual(expect.arrayContaining([
      'EMI', 'Insurance', 'Fixed deposit / RD',
    ]));
    expect(linkedRecurringForMonth(emptyAppData('2026-03-01'), '2026-03', '2026-03-01')).toEqual([]);
    expect(() => linkedRecurringForMonth(emptyAppData('2026-03-01'), '2026-13', '2026-03-01'))
      .toThrow(RangeError);
  });

  it('adds opt-in linked rows to planned category and group totals without changing actuals or dues', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [plan],
      liabilities: [recurringLiability],
      monthBudgets: [{
        month: '2026-03', source: 'custom' as const,
        plannedIncome: 1_000,
        lines: [
          { category: 'Bills', planned: 50, dueDay: 5 },
          { category: 'EMI', planned: 10 },
          { category: 'Mutual fund / SIP', planned: 20 },
        ],
      }],
      transactions: [
        { id: 'bill-actual', type: 'expense' as const, amount: 20, category: 'Bills', note: '', date: '2026-03-06' },
        { id: 'emi-actual', type: 'expense' as const, amount: 40, category: 'EMI', note: '', date: '2026-03-06' },
        { id: 'sip-actual', type: 'invest' as const, amount: 30, category: 'Mutual fund / SIP', note: '', date: '2026-03-06' },
      ],
    };
    const legacyView = budgetMonthView(data, '2026-03');
    const explicitFalseView = budgetMonthView({
      ...data,
      monthBudgets: data.monthBudgets.map((budget) => ({ ...budget, linkedIncluded: false })),
    }, '2026-03');
    expect({ ...legacyView, budget: undefined }).toEqual({ ...explicitFalseView, budget: undefined });
    expect(legacyView.lines.map(({ category, planned }) => [category, planned])).toEqual([
      ['Bills', 50],
      ['EMI', 100],
      ['Mutual fund / SIP', 100],
    ]);
    expect(legacyView).not.toHaveProperty('linkedByCategory');
    expect(legacyView).not.toHaveProperty('groupTotals');

    const includedData = {
      ...data,
      monthBudgets: data.monthBudgets.map((budget) => ({ ...budget, linkedIncluded: true })),
    };
    const includedView = budgetMonthView(includedData, '2026-03');
    expect(includedView.lines.map(({ category, planned }) => [category, planned])).toEqual([
      ['Bills', 50],
      ['EMI', 110],
      ['Mutual fund / SIP', 120],
    ]);
    expect(includedView.linkedByCategory?.map(({ category, rows }) => [category, rows.length])).toEqual([
      ['EMI', 1],
      ['Mutual fund / SIP', 1],
    ]);
    expect(includedView.linkedByCategory?.find(({ category }) => category === 'EMI')?.rows[0]?.status)
      .toBe('paid');
    expect(includedView.groupTotals).toEqual([
      { groupId: 'survival', groupName: 'Survival (Needs)', planned: 160 },
      { groupId: 'savings-investments', groupName: 'Savings and Investments', planned: 120 },
      { groupId: 'wants', groupName: 'Wants', planned: 0 },
      { groupId: 'festival-donations-culture', groupName: 'Festival, Donations, Culture', planned: 0 },
      { groupId: 'unexpected-extras', groupName: 'Unexpected Extras', planned: 0 },
    ]);
    expect(includedView.actualSpend).toBe(60);
    expect(includedView.actualSave).toBe(30);
    expect(includedView.lines.map(({ category, actual }) => [category, actual])).toEqual([
      ['Bills', 20], ['EMI', 40], ['Mutual fund / SIP', 30],
    ]);

    const dueRows = pendingItems(includedData, '2026-03', '2026-03-04');
    expect(dueRows).toHaveLength(3);
    expect(dueRows.map(({ title, dueDate, kind }) => [title, dueDate, kind])).toEqual([
      ['Bills', '2026-03-05', 'budget'],
      ['Monthly fund', '2026-03-05', 'due'],
      ['Monthly loan', '2026-03-05', 'due'],
    ]);
  });

  it('builds monthly cash-flow, planned and actual totals, prepayments, and unbudgeted spending', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [plan],
      liabilities: [
        liability,
        {
          id: 'recurring', kind: 'recurring' as const, name: 'Recurring', type: 'Personal loan' as const,
          principal: 1_000, ratePct: 0, startDate: '2026-03-01', tenureMonths: 12, emi: 100, settlement: null,
          payments: [{ id: 'prepay', date: '2026-03-15', amount: 25, note: '', kind: 'Prepayment' as const }],
        },
      ],
      policies: [policy],
      monthBudgets: [{
        month: '2026-03', source: 'custom' as const,
        plannedIncome: 3_000, lines: [{ category: 'Food', planned: 500 }, { category: 'Mutual fund / SIP', planned: 50 }],
      }],
      transactions: [
        { id: 'salary', type: 'income' as const, amount: 2_000, category: 'Salary', note: '', date: '2026-03-01' },
        { id: 'borrowed', type: 'income' as const, amount: 100, category: 'Borrowed', note: '', date: '2026-03-02' },
        { id: 'food', type: 'expense' as const, amount: 400, category: 'Food', note: '', date: '2026-03-03' },
        { id: 'other', type: 'expense' as const, amount: 10, category: 'Other', note: '', date: '2026-03-03' },
        { id: 'invest', type: 'invest' as const, amount: 100, category: 'Mutual fund / SIP', note: '', date: '2026-03-05' },
      ],
    };
    const view = budgetMonthView(data, '2026-03');
    expect(view.position.earnedIncome).toBe(2_000);
    expect(view.position.closing).toBe(1_590);
    expect(view.position.flow).toBe(1_590);
    expect(view.position.previousClosing).toBe(0);
    expect(view.plannedSpend).toBe(1_035);
    expect(view.plannedSave).toBe(100);
    expect(view.actualSpend).toBe(410);
    expect(view.actualSave).toBe(100);
    expect(view.unbudgeted).toBe(10);
    expect(view.income).toEqual({
      planned: 3_000,
      actual: 2_000,
      bySource: [{ category: 'Salary', amount: 2_000 }],
      extra: 0,
    });
    expect(view.otherMoneyIn).toBe(100);
    expect(view.unbudgetedByGroup.find(({ groupId }) => groupId === 'wants')?.amount).toBe(10);
    expect(view.debt.prepaymentsActual).toBe(25);
    expect(view.debt.emiActual).toBe(25);
    expect(view.debt.emiPlanned).toBe(475);
    expect(view.lines.find((row) => row.category === 'Food')?.status).toBe('near');
    expect(budgetMonthView(emptyAppData('2026-03-01'), '2026-03').unallocated).toBeNull();
  });

  it('reconciles every earned income source separately from non-earned money in', () => {
    const categories = [
      ['Salary', 1_000],
      ['Freelance', 200],
      ['Rental', 300],
      ['Business', 400],
      ['Other', 500],
      ['Withdrawal', 50],
      ['Borrowed', 60],
      ['Loan proceeds', 70],
      ['Own funds', 80],
    ] as const;
    const data = {
      ...emptyAppData('2026-03-01'),
      monthBudgets: [{
        month: '2026-03', source: 'custom' as const,
        plannedIncome: 2_000, lines: [],
      }],
      transactions: categories.map(([category, amount], index) => ({
        id: `income-${index}`, type: 'income' as const, amount, category, note: '', date: '2026-03-10',
      })),
    };
    expect(appDataSchema.safeParse(data).success).toBe(true);
    const view = budgetMonthView(data, '2026-03');
    expect(view.income).toEqual({
      planned: 2_000,
      actual: 2_400,
      bySource: [
        { category: 'Business', amount: 400 },
        { category: 'Freelance', amount: 200 },
        { category: 'Other', amount: 500 },
        { category: 'Rental', amount: 300 },
        { category: 'Salary', amount: 1_000 },
      ],
      extra: 400,
    });
    expect(view.otherMoneyIn).toBe(260);
    const unplanned = budgetMonthView({
      ...data,
      monthBudgets: data.monthBudgets.map((monthBudget) => ({ ...monthBudget, plannedIncome: null })),
    }, '2026-03');
    expect(unplanned.income.extra).toBe(0);
  });

  it('reconciles every transaction in 500 seeded budget-month cases (seed 19052026)', () => {
    const seed = 19_052_026;
    console.info(`budget reconciliation property seed: ${seed}`);
    let state = seed;
    const next = () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state;
    };
    const incomeCategories = TRANSACTION_CATEGORIES.income;
    const expenseCategories = TRANSACTION_CATEGORIES.expense;
    const investCategories = TRANSACTION_CATEGORIES.invest;

    for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
      const transactions: Transaction[] = [];
      const transactionCount = 1 + next() % 24;
      for (let transactionIndex = 0; transactionIndex < transactionCount; transactionIndex += 1) {
        const transactionType = next() % 3;
        const type = transactionType === 0 ? 'income' : transactionType === 1 ? 'expense' : 'invest';
        const categories = type === 'income' ? incomeCategories
          : type === 'expense' ? expenseCategories : investCategories;
        transactions.push({
          id: `case-${caseIndex}-transaction-${transactionIndex}`,
          type,
          amount: 1 + next() % 20_000,
          category: categories[next() % categories.length] ?? categories[0],
          note: '',
          date: `2026-03-${String(1 + next() % 28).padStart(2, '0')}`,
        });
      }

      const plannedCategories = new Set<string>();
      const lines = BUDGET_CATEGORIES.filter(() => next() % 3 === 0)
        .filter((category) => {
          if (plannedCategories.has(category)) return false;
          plannedCategories.add(category);
          return true;
        })
        .map((category) => ({ category, planned: next() % 20_000 }));
      const data = {
        ...emptyAppData('2026-03-01'),
        transactions,
        monthBudgets: [{
          month: '2026-03',
          source: 'custom' as const,
          plannedIncome: next() % 100_000,
          lines,
        }],
      };
      const view = budgetMonthView(data, '2026-03');
      const summary = monthSummary(transactions, '2026-03');
      expect(view.lines.reduce((sum, line) => sum + line.actual, 0) + view.unbudgeted)
        .toBe(summary.expense + summary.invest);
      expect(view.unbudgetedByGroup.reduce((sum, group) => sum + group.amount, 0))
        .toBe(view.unbudgeted);
      expect(view.income.bySource.reduce((sum, source) => sum + source.amount, 0))
        .toBe(summary.earnedIncome);
      expect(view.income.actual).toBe(summary.earnedIncome);
      expect(view.position.earnedIncome).toBe(summary.earnedIncome);
      expect(view.position.expense).toBe(summary.expense);
      expect(view.position.invest).toBe(summary.invest);
      expect(view.position.flow).toBe(summary.net);
    }
  });

  it.each([
    [79.9, 'ok'],
    [80, 'near'],
    [100, 'near'],
    [100.1, 'over'],
  ] as const)('classifies budget usage at %s%%', (usedPct, status) => {
    const data = {
      ...emptyAppData('2026-03-01'),
      monthBudgets: [{
        month: '2026-03', source: 'custom' as const,
        plannedIncome: 1_000, lines: [{ category: 'Food', planned: 1_000 }],
      }],
      transactions: [{
        id: 'food', type: 'expense' as const, amount: usedPct * 10,
        category: 'Food', note: '', date: '2026-03-10',
      }],
    };
    expect(budgetMonthView(data, '2026-03').lines[0]?.status).toBe(status);
  });

  it('uses the previous closing balance and maps Other investment actuals to their budget line', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      monthBudgets: [{
        month: '2026-03', source: 'custom' as const,
        plannedIncome: null,
        lines: [{ category: 'Food', planned: 0 }, { category: 'Other investments', planned: 10 }],
      }],
      transactions: [
        { id: 'prior', type: 'income' as const, amount: 50, category: 'Salary', note: '', date: '2026-02-01' },
        { id: 'food', type: 'expense' as const, amount: 1, category: 'Food', note: '', date: '2026-03-02' },
        { id: 'investment', type: 'invest' as const, amount: 5, category: 'Other', note: '', date: '2026-03-03' },
        { id: 'legacy-investment', type: 'invest' as const, amount: 7, category: 'Fund', note: '', date: '2026-03-04' },
      ],
    };
    const view = budgetMonthView(data, '2026-03');
    expect(view.position.opening).toBe(50);
    expect(view.position.previousClosing).toBe(50);
    expect(view.position.flow).toBe(-13);
    expect(view.lines.find((row) => row.category === 'Food')).toMatchObject({ usedPct: null, status: 'over' });
    expect(view.lines.find((row) => row.category === 'Other investments')).toMatchObject({ actual: 12 });
    expect(filterTransactions(data.transactions, {
      month: '2026-03', type: 'invest', query: '', category: 'Other investments',
    })).toHaveLength(2);
    expect(transactionCategoryLabel('Fund', 'invest')).toBe('Other investments');
    expect(view.unallocated).toBeNull();
    expect(outstandingAt(emptyAppData('2026-03-01'), '2026-03-31')).toEqual({ count: 0, amount: 0 });
  });

  it('reports overdue obligations without a separate budget history model', () => {
    const olderPlan = { ...plan, startDate: '2026-01-05', trackFrom: '2026-01-05' };
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [olderPlan], liabilities: [liability], policies: [policy],
      monthBudgets: [{
        month: '2026-01', source: 'custom' as const,
        plannedIncome: 0, lines: [],
      }],
      transactions: [
        { id: 'expense', type: 'expense' as const, amount: 10, category: 'Food', note: '', date: '2026-02-01' },
        { id: 'salary', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-02-02' },
      ],
    };
    expect(outstandingAt(data, '2026-03-31').count).toBeGreaterThan(0);
    expect(budgetMonthView(data, '2026-01').budget?.source).toBe('custom');
  });
});
