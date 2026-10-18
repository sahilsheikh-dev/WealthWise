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
  budgetOverview,
  applyBudgetPlanToMonth,
  editBudgetItem,
  budgetGroupFor,
  budgetMonthView,
  clearMonthBudget,
  customizeMonthBudget,
  effectiveMonthBudget,
  ensureCurrentMonthBudget,
  linkedRecurringForMonth,
  MissingPlannedIncomeError,
  monthlyCommitments,
  outstandingAt,
  projectedCashFlow,
  resolveBudgetPlan,
  restoreBudgetPlanAndMonth,
  restoreMonthBudget,
  removeBudgetItem,
  saveAndApplyBudgetPlan,
  setBudgetPlan,
  setBudgetRepeat,
  suggestBudgetSplit,
} from '../budget';
import { validateImportData } from '../backup';
import type { BudgetIncomeItem, Liability, PlanHolding, Policy, Transaction } from '../types';
import { budgetPlanFromLines, monthBudgetFromLines, monthBudgetLines } from './budgetFixtures';

const incomes = (amount: number): BudgetIncomeItem[] => amount <= 0
  ? []
  : [{ id: 'income', name: 'Income', category: 'Salary', amount }];

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
  it('uses frozen snapshots before deriving future months from the current plan', () => {
    const data = emptyAppData('2026-01-15');
    data.budgetPlan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 200 }], {
      incomes: incomes(1_000), repeatMonthly: true, repeatFrom: '2026-02',
    });
    data.monthBudgets = [monthBudgetFromLines('2026-02', [{ category: 'Food', planned: 100 }], {
      incomes: incomes(800),
    })];
    data.budgetPlan.incomes = incomes(2_000);
    data.budgetPlan.items = [{ ...data.budgetPlan.items[0]!, value: 500 }];
    expect(effectiveMonthBudget(data, '2026-02', '2026-01-15')).toEqual({
      budget: data.monthBudgets[0],
      virtual: false,
    });
    expect(effectiveMonthBudget(data, '2026-03', '2026-01-15')).toMatchObject({
      budget: {
        source: 'plan',
        incomes: incomes(2_000),
        items: [expect.objectContaining({ name: 'Food', value: 500 })],
      },
      virtual: true,
    });
    expect(effectiveMonthBudget(data, '2028-02', '2026-01-15').budget).toBeNull();
    data.budgetPlan.repeatMonthly = false;
    expect(effectiveMonthBudget(data, '2026-03', '2026-01-15').budget).toBeNull();
  });

  it('does not derive percentage budgets when the plan has no income', () => {
    const data = {
      ...emptyAppData('2026-01-15'),
      budgetPlan: budgetPlanFromLines([{ category: 'Food', mode: 'percent', value: 10 }], {
        incomes: [], repeatMonthly: true, repeatFrom: '2026-02',
      }),
    };
    expect(effectiveMonthBudget(data, '2026-02', '2026-01-15')).toEqual({
      budget: null,
      virtual: false,
    });
  });

  it('projects cash flow through the 24-month plan horizon without mutating data', () => {
    const data = emptyAppData('2026-01-15');
    data.transactions = [
      { id: 'salary', type: 'income', amount: 1_000, category: 'Salary', note: '', date: '2026-01-01' },
      { id: 'food', type: 'expense', amount: 400, category: 'Food', note: '', date: '2026-01-02' },
    ];
    data.budgetPlan = budgetPlanFromLines([
        { category: 'Food', mode: 'amount', value: 500 },
        { category: 'Mutual fund / SIP', mode: 'amount', value: 100 },
      ], { incomes: incomes(1_000), repeatMonthly: true, repeatFrom: '2026-02' });
    const before = JSON.stringify(data);
    expect(projectedCashFlow(data, '2026-01', '2026-01-15')).toEqual({
      opening: 0, closing: 600, projected: false,
    });
    expect(projectedCashFlow(data, '2026-02', '2026-01-15')).toEqual({
      opening: 600, closing: 1_000, projected: true,
    });
    expect(projectedCashFlow(data, '2026-03', '2026-01-15')).toEqual({
      opening: 1_000, closing: 1_400, projected: true,
    });
    expect(projectedCashFlow(data, '2028-01', '2026-01-15')).toMatchObject({ projected: true });
    expect(effectiveMonthBudget(data, '2028-02', '2026-01-15').budget).toBeNull();
    const flatProjection = projectedCashFlow(data, '2028-02', '2026-01-15');
    expect(flatProjection.closing).toBe(flatProjection.opening);
    expect(JSON.stringify(data)).toBe(before);
  });
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
    const amountPlan = budgetPlanFromLines([
        { category: 'Food', mode: 'amount', value: 500 },
        { category: 'Bills', mode: 'percent', value: 12.5 },
      ], { incomes: incomes(12_345) });
    expect(resolveBudgetPlan(amountPlan)).toEqual([
      { category: 'Food', planned: 500 },
      { category: 'Bills', planned: 1543 },
    ]);
    expect(() => resolveBudgetPlan(budgetPlanFromLines([
      { category: 'Bills', mode: 'percent', value: 10 },
    ], { incomes: [] }))).toThrow(MissingPlannedIncomeError);
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
      monthBudgets: [monthBudgetFromLines('2026-03', categories.map((category) => ({ category, planned: 100 })), {
        incomes: incomes(1_000),
      })],
      budgetPlan: budgetPlanFromLines(categories.map((category) => ({ category, mode: 'amount' as const, value: 100 })), {
        incomes: incomes(1_000),
      }),
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
    const plan = budgetPlanFromLines([
        { category: 'Food', mode: 'percent' as const, value: 20 },
        { category: 'Bills', mode: 'amount' as const, value: 500, dueDay: 31 },
      ], { incomes: incomes(10_000) });
    const saved = setBudgetPlan({ ...initial, transactions }, plan);
    const applied = applyBudgetPlanToMonth(saved, '2026-03', { newId: () => 'unused', today: '2026-03-10' });
    expect(applied.monthBudgets?.[0]).toEqual(monthBudgetFromLines('2026-03', [
      { category: 'Food', planned: 2_000 },
      { category: 'Bills', planned: 500, dueDay: 31 },
    ], { incomes: incomes(10_000), source: 'plan', linkedIncluded: true }));
    expect(applied.transactions).toEqual(transactions);
    expect(applied.budgetPlan).toEqual(plan);
  });

  it('customizes one month and restores its exact previous snapshot', () => {
    const data = emptyAppData('2026-03-01');
    const original = monthBudgetFromLines('2026-03', [{ category: 'Food', planned: 500, dueDay: 5 }], {
      incomes: incomes(10_000), source: 'plan', linkedIncluded: true,
    });
    const withSnapshot = { ...data, monthBudgets: [original] };
    const customized = customizeMonthBudget(withSnapshot, '2026-03', {
      incomes: incomes(12_000),
      lines: [{ category: 'Food', planned: 1_000 }],
    });
    expect(customized.monthBudgets?.[0]).toMatchObject({
      month: '2026-03',
      source: 'custom' as const,
      incomes: incomes(12_000),
      items: [expect.objectContaining({ name: 'Food', value: 1_000 })],
    });
    expect(restoreMonthBudget(customized, '2026-03', original)).toEqual(withSnapshot);
    expect(clearMonthBudget(withSnapshot, '2026-03').monthBudgets).toEqual([]);
    expect(clearMonthBudget(withSnapshot, '2026-02')).toBe(withSnapshot);
    expect(() => customizeMonthBudget(data, 'not-a-month', { incomes: [] })).toThrow(RangeError);
  });

  describe('budget item edits', () => {
    const today = '2026-03-15';
    const planWithItems = budgetPlanFromLines([
        { category: 'Food', mode: 'amount' as const, value: 1_000, dueDay: 5 },
        { category: 'Travel', mode: 'percent' as const, value: 10 },
      ], {
        incomes: [
        { id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000, day: 1 },
        { id: 'freelance', name: 'Freelance', category: 'Freelance' as const, amount: 2_000, day: 15 },
      ],
      repeatMonthly: true,
      repeatFrom: '2026-04',
    });

    function withPlanAndMonth() {
      const data = setBudgetPlan(emptyAppData(today), planWithItems);
      return applyBudgetPlanToMonth(data, '2026-03', { newId: () => 'unused', today });
    }

    it('edits the current snapshot only and marks it custom', () => {
      const before = withPlanAndMonth();
      const edited = editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 1_500,
      }, 'month', today);
      expect(edited.budgetPlan).toEqual(before.budgetPlan);
      const editedSnapshot = edited.monthBudgets?.find((row) => row.month === '2026-03');
      expect(editedSnapshot?.source).toBe('custom');
      expect(monthBudgetLines(editedSnapshot)).toContainEqual({ category: 'Food', planned: 1_500 });
    });

    it('updates the current snapshot and plan together for following months', () => {
      const before = withPlanAndMonth();
      const edited = editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 2_500, dueDay: 12,
      }, 'following', today);
      expect(edited.budgetPlan?.items.map(({ name, mode, value, dueDay }) => ({
        category: name, mode, value, ...(dueDay === undefined ? {} : { dueDay }),
      }))).toEqual([
        { category: 'Food', mode: 'amount', value: 2_500, dueDay: 12 },
        { category: 'Travel', mode: 'percent', value: 10 },
      ]);
      expect(monthBudgetLines(edited.monthBudgets?.find((row) => row.month === '2026-03')))
        .toContainEqual({ category: 'Food', planned: 2_500, dueDay: 12 });
      expect(edited.monthBudgets?.find((row) => row.month === '2026-03')?.source).toBe('plan');
    });

    it('materializes an upcoming derived month for month-only edits', () => {
      const before = withPlanAndMonth();
      const virtual = effectiveMonthBudget(before, '2026-04', today);
      expect(virtual.virtual).toBe(true);
      const edited = editBudgetItem(before, '2026-04', { kind: 'line', category: 'Food' }, {
        amount: 3_000, dueDay: 31,
      }, 'month', today);
      expect(edited.budgetPlan).toEqual(before.budgetPlan);
      expect(edited.monthBudgets?.find((row) => row.month === '2026-04')).toMatchObject({
        source: 'custom',
        items: expect.arrayContaining([expect.objectContaining({ name: 'Food', value: 3_000, dueDay: 31 })]),
        incomes: planWithItems.incomes,
        linkedIncluded: true,
      });
      expect(effectiveMonthBudget(edited, '2026-04', today).virtual).toBe(false);
    });

    it('updates the plan for an upcoming derived month and preserves later custom snapshots', () => {
      const before = withPlanAndMonth();
      const customLater = monthBudgetFromLines('2026-05', [{ category: 'Food', planned: 777 }], {
        incomes: planWithItems.incomes, linkedIncluded: true,
      });
      const data = { ...before, monthBudgets: [...(before.monthBudgets ?? []), customLater] };
      const edited = editBudgetItem(data, '2026-04', { kind: 'line', category: 'Food' }, {
        amount: 2_000,
      }, 'following', today);
      expect(edited.budgetPlan?.items[0]).toMatchObject({
        name: 'Food', mode: 'amount', value: 2_000,
      });
      expect(edited.monthBudgets?.find((row) => row.month === '2026-04')).toBeUndefined();
      expect(edited.monthBudgets?.find((row) => row.month === '2026-05')).toEqual(customLater);
      expect(monthBudgetLines(effectiveMonthBudget(edited, '2026-04', today).budget))
        .toContainEqual({ category: 'Food', planned: 2_000 });
    });

    it('adds absent lines to both scopes and leaves other stored months unchanged', () => {
      const data = {
        ...emptyAppData(today),
        budgetPlan: { ...planWithItems, items: [] },
        monthBudgets: [
          monthBudgetFromLines('2026-03', [], { incomes: [] }),
          monthBudgetFromLines('2026-04', [], { incomes: [] }),
        ],
      };
      const monthOnly = editBudgetItem(data, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 250,
      }, 'month', today);
      expect(monthBudgetLines(monthOnly.monthBudgets?.[0])).toEqual([{ category: 'Food', planned: 250 }]);
      expect(monthOnly.budgetPlan).toEqual(data.budgetPlan);

      const following = editBudgetItem(data, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 350,
      }, 'following', today);
      expect(following.budgetPlan?.items.map(({ name, mode, value }) => ({ category: name, mode, value }))).toEqual([
        { category: 'Food', mode: 'amount', value: 350 },
      ]);
      expect(monthBudgetLines(following.monthBudgets?.[0])).toEqual([{ category: 'Food', planned: 350 }]);
      expect(following.monthBudgets?.[1]).toEqual(data.monthBudgets[1]);
    });

    it('uses the viewed snapshot as the base when a following-scope income is absent from the plan', () => {
      const data = {
        ...emptyAppData(today),
        budgetPlan: { ...planWithItems, incomes: [], items: [] },
        monthBudgets: [monthBudgetFromLines('2026-03', [], {
          incomes: [{ id: 'legacy-income', name: 'Legacy', category: 'Salary' as const, amount: 500 }],
        })],
      };
      const edited = editBudgetItem(data, '2026-03', {
        kind: 'income', incomeId: 'legacy-income', category: 'Salary',
      }, { amount: 750, dueDay: 10 }, 'following', today);
      expect(edited.budgetPlan?.incomes).toEqual([
        { id: 'legacy-income', name: 'Legacy', category: 'Salary', amount: 750, day: 10 },
      ]);
      expect(edited.monthBudgets?.[0]?.incomes).toEqual(edited.budgetPlan?.incomes);

      const withoutPlan = editBudgetItem({ ...data, budgetPlan: null }, '2026-03', {
        kind: 'income', incomeId: 'legacy-income', category: 'Salary',
      }, { amount: 800 }, 'following', today);
      expect(withoutPlan.budgetPlan?.incomes).toEqual([
        { id: 'legacy-income', name: 'Legacy', category: 'Salary', amount: 800 },
      ]);
    });

    it('rejects unavailable budgets and missing income sources', () => {
      expect(() => editBudgetItem(emptyAppData(today), '2026-03', {
        kind: 'line', category: 'Food',
      }, { amount: 100 }, 'month', today)).toThrow('There is no budget to edit');

      const data = withPlanAndMonth();
      const missingIncome = { kind: 'income' as const, incomeId: 'missing', category: 'Salary' as const };
      expect(() => editBudgetItem(data, '2026-03', missingIncome, {
        amount: 100,
      }, 'month', today)).toThrow('Budget income "missing" was not found');
      expect(() => editBudgetItem(data, '2026-03', missingIncome, {
        amount: 100,
      }, 'following', today)).toThrow('Budget income "missing" was not found');
    });

    it('edits/removes income items and removes planned lines by scope', () => {
      const before = withPlanAndMonth();
      const editedIncome = editBudgetItem(before, '2026-03', {
        kind: 'income', incomeId: 'salary', category: 'Salary',
      }, { amount: 12_000 }, 'following', today);
      expect(editedIncome.budgetPlan?.incomes[0]).toEqual({
        id: 'salary', name: 'Salary', category: 'Salary', amount: 12_000,
      });
      expect(editedIncome.monthBudgets?.[0]?.incomes[0]).toEqual({
        id: 'salary', name: 'Salary', category: 'Salary', amount: 12_000,
      });
      const removed = removeBudgetItem(editedIncome, '2026-03', {
        kind: 'income', incomeId: 'salary', category: 'Salary',
      }, 'following', today);
      expect(removed.budgetPlan?.incomes.map((income) => income.id)).toEqual(['freelance']);
      expect(removed.monthBudgets?.[0]?.incomes.map((income) => income.id)).toEqual(['freelance']);
      const removedLine = removeBudgetItem(before, '2026-03', {
        kind: 'line', category: 'Food',
      }, 'month', today);
      expect(monthBudgetLines(removedLine.monthBudgets?.[0]).map((line) => line.category)).not.toContain('Food');
      expect(removedLine.budgetPlan).toEqual(before.budgetPlan);
    });

    it('rejects invalid edit values', () => {
      const before = withPlanAndMonth();
      expect(() => editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: -1,
      }, 'month', today)).toThrow(RangeError);
      expect(() => editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 100, dueDay: 32,
      }, 'month', today)).toThrow(RangeError);
      expect(() => editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 1_000_000_001,
      }, 'month', today)).toThrow(RangeError);
      expect(() => editBudgetItem(before, '2026-03', { kind: 'line', category: 'Food' }, {
        amount: 100, dueDay: 1.5,
      }, 'month', today)).toThrow(RangeError);
    });
  });

  it('undoes applying a changed plan and month snapshot to a deep-equal state', () => {
    const previousPlan = budgetPlanFromLines(
      [{ category: 'Food', mode: 'amount', value: 2_000 }],
      { incomes: incomes(10_000) },
    );
    const previousMonth = monthBudgetFromLines('2026-03', [{ category: 'Bills', planned: 500 }], {
      incomes: incomes(9_000),
    });
    const before = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: previousPlan,
      monthBudgets: [previousMonth],
    };
    const applied = saveAndApplyBudgetPlan(before, budgetPlanFromLines(
      [{ category: 'Food', mode: 'percent', value: 25 }],
      { incomes: incomes(12_000), repeatMonthly: true, repeatFrom: '2026-04' },
    ), '2026-03', { newId: () => 'unused', today: '2026-03-10' });
    expect(restoreBudgetPlanAndMonth(applied, previousPlan, '2026-03', previousMonth)).toEqual(before);
  });

  it('repeats only from the configured month, applies current month once and never backfills', () => {
    const plan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 100 }], {
      incomes: incomes(1_000), repeatMonthly: true, repeatFrom: '2026-03',
    });
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
    const percentPlan = setBudgetPlan(incomeData, budgetPlanFromLines([
      { category: 'Bills', mode: 'percent', value: 25 },
    ], { incomes: incomes(1_000), repeatMonthly: true, repeatFrom: '2026-03' }));
    const percentApplied = ensureCurrentMonthBudget(percentPlan, '2026-03-12', () => 'unused');
    expect(monthBudgetLines(percentApplied.monthBudgets?.[0])).toEqual([{ category: 'Bills', planned: 250 }]);
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
      monthBudgets: [monthBudgetFromLines('2026-03', [
          { category: 'Bills', planned: 50, dueDay: 5 },
          { category: 'EMI', planned: 10 },
          { category: 'Mutual fund / SIP', planned: 20 },
        ], { incomes: incomes(1_000) })],
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
      monthBudgets: [monthBudgetFromLines('2026-03', [
        { category: 'Food', planned: 500 },
        { category: 'Mutual fund / SIP', planned: 50 },
      ], { incomes: incomes(3_000) })],
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
      monthBudgets: [monthBudgetFromLines('2026-03', [], { incomes: incomes(2_000) })],
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
      monthBudgets: data.monthBudgets.map((monthBudget) => ({ ...monthBudget, incomes: [] })),
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
        monthBudgets: [monthBudgetFromLines('2026-03', lines, { incomes: incomes(next() % 100_000) })],
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
      monthBudgets: [monthBudgetFromLines('2026-03', [{ category: 'Food', planned: 1_000 }], {
        incomes: incomes(1_000),
      })],
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
      monthBudgets: [monthBudgetFromLines('2026-03', [
        { category: 'Food', planned: 0 }, { category: 'Other investments', planned: 10 },
      ], { incomes: [] })],
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

  it('returns an empty overview when no effective budget exists', () => {
    const overview = budgetOverview(emptyAppData('2026-03-01'), '2026-02', '2026-03-15');
    expect(overview).toMatchObject({
      mode: 'past',
      sections: [],
      pace: null,
      summary: { stacked: 'No budget for this month.', sections: 'No budget sections.', pace: null },
    });
    expect(overview.stacked).toEqual({
      income: { planned: 0, actual: 0 },
      spend: { planned: 0, actual: 0 },
      invest: { planned: 0, actual: 0 },
      left: { planned: 0, actual: 0 },
    });
  });

  it('builds ordered, reconciled overview sections with shared income categories and linked rows', () => {
    const linkedPlan: PlanHolding = {
      ...plan,
      logs: [{ id: 'sip-entry', date: '2026-03-05', amount: 100, note: '', kind: 'Deposit' }],
    };
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [linkedPlan],
      liabilities: [liability],
      monthBudgets: [monthBudgetFromLines('2026-03', [
        { category: 'Food', planned: 1_000 },
        { category: 'Rent', planned: 500 },
        { category: 'Mutual fund / SIP', planned: 0 },
        { category: 'Unexpected', planned: 50 },
      ], {
        linkedIncluded: true,
        incomes: [
          { id: 'salary-one', name: 'Primary salary', category: 'Salary' as const, amount: 6_000 },
          { id: 'salary-two', name: 'Second salary', category: 'Salary' as const, amount: 4_000 },
          { id: 'freelance', name: 'Freelance', category: 'Freelance' as const, amount: 1_000 },
        ],
      })],
      transactions: [
        { id: 'salary', type: 'income' as const, amount: 7_000, category: 'Salary', note: '', date: '2026-03-02' },
        { id: 'freelance-earned', type: 'income' as const, amount: 400, category: 'Freelance', note: '', date: '2026-03-03' },
        { id: 'food', type: 'expense' as const, amount: 200, category: 'Food', note: '', date: '2026-03-04' },
        { id: 'rent', type: 'expense' as const, amount: 700, category: 'Rent', note: '', date: '2026-03-08' },
        { id: 'future-expense', type: 'expense' as const, amount: 999, category: 'Travel', note: '', date: '2026-03-20' },
        {
          id: 'sip-transaction', type: 'invest' as const, amount: 100, category: 'Mutual fund / SIP',
          note: '', date: '2026-03-05',
          source: { kind: 'holding-entry' as const, parentId: linkedPlan.id, entryId: 'sip-entry' },
        },
        {
          id: 'liability-payment', type: 'expense' as const, amount: 25, category: 'EMI',
          note: '', date: '2026-03-10',
          source: { kind: 'liability-payment' as const, parentId: liability.id, entryId: 'partial' },
        },
      ],
    };
    const overview = budgetOverview(data, '2026-03', '2026-03-15');
    expect(overview.mode).toBe('current');
    expect(overview.sections.map(({ id, name }) => [id, name])).toEqual([
      ['income', 'Income'],
      ['survival', 'Survival (Needs)'],
      ['savings-investments', 'Savings and Investments'],
      ['wants', 'Wants'],
      ['festival-donations-culture', 'Festival, Donations, Culture'],
      ['unexpected-extras', 'Unexpected Extras'],
      ['debt-repayments', 'Debt repayments'],
      ['insurance', 'Insurance'],
    ]);
    expect(overview.sections[0]?.items.map(({ title, actual }) => [title, actual])).toEqual([
      ['Primary salary', 6_000],
      ['Second salary', 1_000],
      ['Freelance', 400],
    ]);
    expect(overview.sections.find(({ id }) => id === 'savings-investments')?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'linked', title: 'Monthly fund', planned: 100, actual: 100, editable: false }),
      ]),
    );
    expect(overview.sections.find(({ id }) => id === 'debt-repayments')?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'linked', title: 'Friend', planned: 475, actual: 25, editable: false }),
      ]),
    );
    expect(overview.stacked).toEqual({
      income: { planned: 11_000, actual: 7_400 },
      spend: { planned: 2_025, actual: 925 },
      invest: { planned: 100, actual: 100 },
      left: { planned: 8_875, actual: 6_375 },
    });
    expect(overview.sections.reduce((sum, section) => sum + section.planned, 0)).toBe(13_125);
    expect(overview.sections.reduce((sum, section) => sum + section.actual, 0)).toBe(8_425);
    expect(overview.pace).toMatchObject({ days: 31, actual: [0, 0, 0, 200, 200, 200, 200, 900, 900, 925, 925, 925, 925, 925, 925] });
    expect(overview.pace?.planned.at(-1)).toBe(2_025);
  });

  it('derives future overviews from plan edits and describes negative left as over budget', () => {
    const data = emptyAppData('2026-03-01');
    data.budgetPlan = {
      incomes: incomes(500),
      lines: [{ category: 'Food', mode: 'amount', value: 700 }],
      repeatMonthly: true,
      repeatFrom: '2026-04',
    };
    const before = budgetOverview(data, '2026-04', '2026-03-15');
    expect(before.mode).toBe('future');
    expect(before.pace).toBeNull();
    expect(before.stacked.left.planned).toBe(-200);
    expect(before.summary.stacked).toContain('Planned over by ₹200');
    data.budgetPlan.lines = [{ category: 'Food', mode: 'amount', value: 400 }];
    const after = budgetOverview(data, '2026-04', '2026-03-15');
    expect(after.sections.find(({ id }) => id === 'survival')?.planned).toBe(400);
    expect(after.stacked.left.planned).toBe(100);
  });

  it('includes unmatched policy payments and unplanned income in an actual overspend summary', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      policies: [policy],
      monthBudgets: [{
        month: '2026-03',
        source: 'custom' as const,
        incomes: incomes(100),
        lines: [{ category: 'Food', planned: 50 }],
      }],
      transactions: [
        { id: 'salary', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-03-02' },
        { id: 'rental', type: 'income' as const, amount: 30, category: 'Rental', note: '', date: '2026-03-03' },
        { id: 'food', type: 'expense' as const, amount: 150, category: 'Food', note: '', date: '2026-03-04' },
        {
          id: 'unmatched-policy-payment',
          type: 'expense' as const,
          amount: 20,
          category: 'Insurance',
          note: '',
          date: '2026-03-06',
          source: { kind: 'policy-payment' as const, parentId: policy.id, entryId: 'unmatched-entry' },
        },
      ],
    };
    const overview = budgetOverview(data, '2026-03', '2026-03-15');
    expect(overview.sections.find(({ id }) => id === 'income')?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Rental', planned: 0, actual: 30, kind: 'income' }),
      ]),
    );
    expect(overview.sections.find(({ id }) => id === 'insurance')?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Health cover', planned: 0, actual: 20, kind: 'linked' }),
      ]),
    );
    expect(overview.stacked.left.actual).toBe(-40);
    expect(overview.summary.stacked).toContain('Actual over by ₹40');
  });

  it('reports overdue obligations without a separate budget history model', () => {
    const olderPlan = { ...plan, startDate: '2026-01-05', trackFrom: '2026-01-05' };
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [olderPlan], liabilities: [liability], policies: [policy],
      monthBudgets: [{
        month: '2026-01', source: 'custom' as const,
        incomes: [], lines: [],
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
