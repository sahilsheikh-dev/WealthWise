import { emptyAppData } from '../actions';
import { filterTransactions } from '../transactions';
import {
  appDataSchema,
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_GROUPS,
  TRANSACTION_CATEGORIES,
} from '../schemas';
import { mockAppData } from '../../mock/data';
import {
  BUDGET_WANT_WEIGHTS,
  applyTemplateToMonth,
  budgetHistory,
  budgetMonthView,
  clearMonthBudget,
  createBudgetTemplate,
  createBudgetTemplateAndApply,
  customizeMonthBudget,
  deleteBudgetTemplate,
  ensureMonthBudget,
  MissingPlannedIncomeError,
  monthlyCommitments,
  outstandingAt,
  resolveTemplate,
  saveMonthAsTemplate,
  setDefaultBudgetTemplate,
  suggestTemplate,
  updateBudgetTemplate,
} from '../budget';
import type { Liability, PlanHolding, Policy } from '../types';

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

describe('budget templates and monthly views', () => {
  it('groups every existing budget category and demonstrates each group in mock budget data', () => {
    expect(BUDGET_CATEGORY_GROUPS.map(({ name, categories }) => [name, categories])).toEqual([
      ['Survival (Needs)', ['Living', 'Food', 'Transport', 'Family', 'Bills', 'Education', 'EMI', 'Insurance']],
      ['Savings and Investments', ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Emergency fund', 'Other investments']],
      ['Wants', ['Shopping', 'Other']],
      ['Festival, Donations, Culture', ['Festival', 'Donation']],
      ['Unexpected Extras', ['Health', 'Gifts']],
    ]);
    const groupedCategories = BUDGET_CATEGORY_GROUPS.flatMap(({ categories }) => categories);
    expect([...groupedCategories].sort()).toEqual([...BUDGET_CATEGORIES].sort());
    expect(new Set(groupedCategories).size).toBe(BUDGET_CATEGORIES.length);
    expect(BUDGET_CATEGORY_GROUPS.find(({ id }) => id === 'unexpected-extras')?.categories)
      .toEqual(['Health', 'Gifts']);
    expect(appDataSchema.safeParse(mockAppData).success).toBe(true);
    const demoBudget = mockAppData.budget;
    if (!demoBudget) throw new Error('Mock data must include a demo budget.');
    const demoGroups = new Set(demoBudget.lines.map(({ category }) =>
      BUDGET_CATEGORY_GROUPS.find(({ categories }) => categories.some((item) => item === category))?.id,
    ));
    expect(demoGroups).toEqual(new Set(BUDGET_CATEGORY_GROUPS.map(({ id }) => id)));
  });

  it('resolves amount and percentage lines and requires income for percentages', () => {
    expect(resolveTemplate({
      plannedIncome: 12_345,
      lines: [
        { category: 'Food', mode: 'amount', value: 500 },
        { category: 'Bills', mode: 'percent', value: 12.5 },
      ],
    })).toEqual([{ category: 'Food', planned: 500 }, { category: 'Bills', planned: 1543 }]);
    expect(() => resolveTemplate({
      plannedIncome: null,
      lines: [{ category: 'Bills', mode: 'percent', value: 10 }],
    })).toThrow(MissingPlannedIncomeError);
  });

  it('suggests rounded 50/30/20 allocations and warns when commitments exceed a bucket', () => {
    const ordinary = suggestTemplate({ plannedIncome: 10_000, commitments: [] });
    expect(ordinary.lines).toHaveLength(18);
    expect(ordinary.lines.find((line) => line.category === 'Living')?.planned).toBe(1_500);
    expect(ordinary.lines.find((line) => line.category === 'Shopping')?.planned).toBe(1_100);
    expect(ordinary.lines.find((line) => line.category === 'Other')?.planned).toBe(800);
    expect(ordinary.lines.find((line) => line.category === 'Festival')?.planned).toBe(500);
    expect(ordinary.lines.find((line) => line.category === 'Donation')?.planned).toBe(300);
    expect(ordinary.lines.find((line) => line.category === 'Gifts')?.planned).toBe(500);
    expect(ordinary.lines.find((line) => line.category === 'Emergency fund')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Mutual fund / SIP')?.planned).toBe(400);
    expect(ordinary.warnings).toEqual([]);
    const overspent = suggestTemplate({
      plannedIncome: 10_000,
      commitments: [{ kind: 'liability', id: 'd', name: 'Debt', category: 'EMI',
        dueDate: '2026-03-20', plannedAmount: 6_000, status: 'overdue', paidAmount: 0 }],
    });
    expect(overspent.lines.find((line) => line.category === 'EMI')?.planned).toBe(6_000);
    expect(overspent.warnings).toHaveLength(1);
    expect(overspent.lines.every((line) => line.planned >= 0)).toBe(true);
    const savingsOver = suggestTemplate({
      plannedIncome: 10_000,
      commitments: [{ kind: 'plan', id: 'p', name: 'Plan', category: 'Mutual fund / SIP',
        dueDate: '2026-03-05', plannedAmount: 3_000, status: 'overdue', paidAmount: 0 }],
    });
    expect(savingsOver.warnings).toHaveLength(1);
    expect(savingsOver.lines.find((line) => line.category === 'Mutual fund / SIP')?.planned).toBe(3_000);
  });

  it('keeps the wants weights at 100% and rounds each category to the nearest hundred', () => {
    expect(Object.values(BUDGET_WANT_WEIGHTS).reduce((total, weight) => total + weight, 0)).toBe(100);
    const { lines } = suggestTemplate({ plannedIncome: 10_001, commitments: [] });
    expect(lines.filter(({ category }) => category in BUDGET_WANT_WEIGHTS)).toEqual([
      { category: 'Shopping', planned: 1_100 },
      { category: 'Other', planned: 800 },
      { category: 'Festival', planned: 500 },
      { category: 'Donation', planned: 300 },
      { category: 'Gifts', planned: 500 },
    ]);
  });

  it('accepts Festival, Donation and Gifts in transactions and budget actuals', () => {
    const categories = ['Festival', 'Donation', 'Gifts'] as const;
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
        templateId: null,
        templateName: null,
        plannedIncome: 1_000,
        customized: false,
        lines: categories.map((category) => ({ category, planned: 100 })),
      }],
      budgetTemplates: [{
        id: 'new-categories',
        name: 'New categories',
        plannedIncome: 1_000,
        lines: categories.map((category) => ({ category, mode: 'amount' as const, value: 100 })),
      }],
    };
    expect(appDataSchema.safeParse(data).success).toBe(true);
    expect(TRANSACTION_CATEGORIES.expense).toEqual(expect.arrayContaining(categories));
    const view = budgetMonthView(data, '2026-03');
    expect(view.lines.map(({ category, actual }) => [category, actual])).toEqual([
      ['Festival', 25], ['Donation', 26], ['Gifts', 27],
    ]);
    for (const category of categories) {
      expect(filterTransactions(transactions, {
        month: '2026-03', type: 'all', query: '', category,
      })).toHaveLength(1);
    }
  });

  it('creates, updates, applies, customizes, clears, saves and deletes templates without changing snapshots', () => {
    const initial = { ...emptyAppData('2026-03-01'), settings: { name: '', theme: 'system' as const, monthlySalary: 20_000, onboarded: false } };
    const created = createBudgetTemplate(initial, {
      name: 'Home', plannedIncome: 10_000,
      lines: [{ category: 'Food', mode: 'percent', value: 20 }],
    }, () => 'template');
    const defaulted = setDefaultBudgetTemplate(created, 'template');
    const applied = applyTemplateToMonth(defaulted, { month: '2026-03', templateId: 'template' });
    expect(applied.monthBudgets?.[0]?.lines).toEqual([{ category: 'Food', planned: 2_000 }]);
    const editedTemplate = updateBudgetTemplate(applied, 'template', { name: 'Changed', plannedIncome: 99_000 });
    expect(editedTemplate.monthBudgets?.[0]?.templateName).toBe('Home');
    const customized = customizeMonthBudget(editedTemplate, '2026-03', {
      plannedIncome: 12_000, lines: [{ category: 'Food', planned: 3_000 }],
    });
    expect(customized.monthBudgets?.[0]?.customized).toBe(true);
    const saved = saveMonthAsTemplate(customized, '2026-03', 'March copy', () => 'copy');
    expect(saved.budgetTemplates?.at(-1)?.lines).toEqual([{ category: 'Food', mode: 'amount', value: 3_000 }]);
    const deleted = deleteBudgetTemplate(saved, 'template');
    expect(deleted.defaultBudgetTemplateId).toBeNull();
    expect(deleted.monthBudgets?.[0]?.templateId).toBeNull();
    expect(deleted.monthBudgets?.[0]?.templateName).toBe('Home');
    expect(clearMonthBudget(deleted, '2026-03').monthBudgets).toEqual([]);
    expect(clearMonthBudget(deleted, '2026-02')).toBe(deleted);
    expect(() => setDefaultBudgetTemplate(initial, 'missing')).toThrow();
    expect(() => updateBudgetTemplate(initial, 'missing', { name: 'x' })).toThrow();
    expect(() => deleteBudgetTemplate(initial, 'missing')).toThrow();
    expect(() => applyTemplateToMonth(initial, { month: '2026-03', templateId: 'missing' })).toThrow();
    expect(() => saveMonthAsTemplate(initial, '2026-03', 'copy', () => 'id')).toThrow();
    expect(() => applyTemplateToMonth(initial, { month: '2026-13', templateId: 'missing' })).toThrow(RangeError);
    expect(() => customizeMonthBudget(initial, 'not-a-month', { plannedIncome: null })).toThrow(RangeError);
  });

  it('creates and applies a template atomically and customizes from the default or a blank budget', () => {
    const initial = emptyAppData('2026-03-01');
    const created = createBudgetTemplateAndApply(initial, {
      name: 'Starter', plannedIncome: 1_000,
      lines: [{ category: 'Food', mode: 'amount', value: 100 }],
    }, '2026-03', () => 'starter');
    expect(created.monthBudgets?.[0]).toMatchObject({
      templateId: 'starter', templateName: 'Starter', customized: false,
      plannedIncome: 1_000, lines: [{ category: 'Food', planned: 100 }],
    });
    const defaulted = setDefaultBudgetTemplate(created, 'starter');
    expect(customizeMonthBudget(defaulted, '2026-04', { plannedIncome: 2_000 }).monthBudgets?.[1])
      .toMatchObject({ templateId: 'starter', customized: true, plannedIncome: 2_000 });
    const blank = customizeMonthBudget(initial, '2026-04', { plannedIncome: null });
    expect(blank.monthBudgets?.[0]).toMatchObject({ templateId: null, customized: true, lines: [] });
    const percentOnly = setDefaultBudgetTemplate(createBudgetTemplate(initial, {
      name: 'Percent', plannedIncome: null,
      lines: [{ category: 'Food', mode: 'percent', value: 10 }],
    }, () => 'percent'), 'percent');
    expect(ensureMonthBudget(percentOnly, '2026-03', '2026-03-12')).toBe(percentOnly);
  });

  it('ensures only the current month from the default and is idempotent by reference', () => {
    const data = setDefaultBudgetTemplate(createBudgetTemplate(emptyAppData('2026-03-01'), {
      name: 'Default', plannedIncome: null, lines: [{ category: 'Food', mode: 'amount', value: 100 }],
    }, () => 'default'), 'default');
    const ensured = ensureMonthBudget(data, '2026-03', '2026-03-12');
    expect(ensured.monthBudgets?.[0]?.plannedIncome).toBeNull();
    expect(ensureMonthBudget(ensured, '2026-03', '2026-03-12')).toBe(ensured);
    expect(ensureMonthBudget(data, '2026-02', '2026-03-12')).toBe(data);
    const withoutDefault = emptyAppData('2026-03-01');
    expect(ensureMonthBudget(withoutDefault, '2026-03', '2026-03-12')).toBe(withoutDefault);
    const baselineTemplate = { ...data, budgetTemplates: data.budgetTemplates?.map((row) => ({ ...row, plannedIncome: null })) };
    expect(ensureMonthBudget(baselineTemplate, '2026-03', '2026-03-12')).toBeDefined();
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
        month: '2026-03', templateId: null, templateName: null, customized: false,
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
    expect(view.debt.prepaymentsActual).toBe(25);
    expect(view.debt.emiActual).toBe(25);
    expect(view.debt.emiPlanned).toBe(475);
    expect(view.lines.find((row) => row.category === 'Food')?.status).toBe('near');
    expect(budgetMonthView(emptyAppData('2026-03-01'), '2026-03').unallocated).toBeNull();
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
        month: '2026-03', templateId: null, templateName: null, customized: false,
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
        month: '2026-03', templateId: null, templateName: null, customized: false,
        plannedIncome: null,
        lines: [{ category: 'Food', planned: 0 }, { category: 'Other investments', planned: 10 }],
      }],
      transactions: [
        { id: 'prior', type: 'income' as const, amount: 50, category: 'Salary', note: '', date: '2026-02-01' },
        { id: 'food', type: 'expense' as const, amount: 1, category: 'Food', note: '', date: '2026-03-02' },
        { id: 'investment', type: 'invest' as const, amount: 5, category: 'Other', note: '', date: '2026-03-03' },
      ],
    };
    const view = budgetMonthView(data, '2026-03');
    expect(view.position.opening).toBe(50);
    expect(view.position.previousClosing).toBe(50);
    expect(view.position.flow).toBe(-6);
    expect(view.lines.find((row) => row.category === 'Food')).toMatchObject({ usedPct: null, status: 'over' });
    expect(view.lines.find((row) => row.category === 'Other investments')).toMatchObject({ actual: 5 });
    expect(view.unallocated).toBeNull();
    expect(outstandingAt(emptyAppData('2026-03-01'), '2026-03-31')).toEqual({ count: 0, amount: 0 });
  });

  it('reports overdue obligations and ordered history with null savings rate at zero earned income', () => {
    const olderPlan = { ...plan, startDate: '2026-01-05', trackFrom: '2026-01-05' };
    const data = {
      ...emptyAppData('2026-03-01'),
      holdings: [olderPlan], liabilities: [liability], policies: [policy],
      monthBudgets: [{
        month: '2026-01', templateId: null, templateName: 'January', customized: true,
        plannedIncome: 0, lines: [],
      }],
      transactions: [
        { id: 'expense', type: 'expense' as const, amount: 10, category: 'Food', note: '', date: '2026-02-01' },
        { id: 'salary', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-02-02' },
      ],
    };
    expect(outstandingAt(data, '2026-03-31').count).toBeGreaterThan(0);
    const rows = budgetHistory(data);
    expect(rows.map((row) => row.month)).toEqual(['2026-02', '2026-01']);
    expect(rows[1]?.templateName).toBe('January');
    expect(rows[0]?.savingsRatePct).toBe(90);
    expect(rows[1]?.savingsRatePct).toBeNull();
  });
});
