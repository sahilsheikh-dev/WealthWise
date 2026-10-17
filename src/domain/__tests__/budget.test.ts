import { emptyAppData } from '../actions';
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
  applyTemplateToMonth,
  budgetHistory,
  budgetGroupFor,
  budgetMonthView,
  clearMonthBudget,
  createBudgetTemplate,
  createBudgetTemplateAndApply,
  customizeMonthBudget,
  deleteBudgetTemplate,
  ensureMonthBudget,
  linkedRecurringForMonth,
  MissingPlannedIncomeError,
  monthlyCommitments,
  outstandingAt,
  resolveTemplate,
  saveMonthAsTemplate,
  setDefaultBudgetTemplate,
  suggestTemplate,
  updateBudgetTemplate,
} from '../budget';
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

describe('budget templates and monthly views', () => {
  it('maps every budget category to exactly one requested group and demonstrates each in mock budget data', () => {
    expect(BUDGET_GROUPS.map(({ name, weight, categories }) => [name, weight, categories])).toEqual([
      ['Survival (Needs)', 50, ['Living', 'Food', 'Transport', 'Family', 'Health', 'Bills', 'Education', 'EMI', 'Insurance']],
      ['Savings and Investments', 20, ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments']],
      ['Wants', 15, ['Shopping', 'Other', 'Eating out', 'Entertainment', 'Fashion']],
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

  it('suggests rounded five-group allocations, respects commitments, and warns on group overages', () => {
    const ordinary = suggestTemplate({ plannedIncome: 10_000, commitments: [] });
    expect(ordinary.lines).toHaveLength(BUDGET_CATEGORIES.length);
    expect(ordinary.lines.find((line) => line.category === 'Living')?.planned).toBe(1_300);
    expect(ordinary.lines.find((line) => line.category === 'Food')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Shopping')?.planned).toBe(500);
    expect(ordinary.lines.find((line) => line.category === 'Other')?.planned).toBe(300);
    expect(ordinary.lines.find((line) => line.category === 'Festival')?.planned).toBe(200);
    expect(ordinary.lines.find((line) => line.category === 'Unexpected')?.planned).toBe(1_000);
    expect(ordinary.lines.find((line) => line.category === 'Other investments')?.planned).toBe(800);
    expect(ordinary.lines.find((line) => line.category === 'Mutual fund / SIP')?.planned).toBe(500);
    expect(ordinary.warnings).toEqual([]);
    const committed = suggestTemplate({
      plannedIncome: 10_000,
      commitments: [{ kind: 'liability', id: 'd', name: 'Debt', category: 'EMI',
        dueDate: '2026-03-20', plannedAmount: 1_000, status: 'upcoming', paidAmount: 0 }],
    });
    expect(committed.lines.find((line) => line.category === 'EMI')?.planned).toBe(1_400);
    expect(committed.lines.find((line) => line.category === 'Food')?.planned).toBe(800);
    const overspent = suggestTemplate({
      plannedIncome: 10_000,
      commitments: [{ kind: 'liability', id: 'd', name: 'Debt', category: 'EMI',
        dueDate: '2026-03-20', plannedAmount: 6_000, status: 'overdue', paidAmount: 0 }],
    });
    expect(overspent.lines.find((line) => line.category === 'EMI')?.planned).toBe(6_000);
    expect(overspent.warnings).toEqual(['Survival (Needs) commitments exceed its 50% allocation.']);
    expect(overspent.lines.every((line) => line.planned >= 0)).toBe(true);
    const savingsOver = suggestTemplate({
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
    const { lines } = suggestTemplate({ plannedIncome: 10_001, commitments: [] });
    expect(lines.find(({ category }) => category === 'Living')?.planned).toBe(1_300);
    expect(lines.find(({ category }) => category === 'Eating out')?.planned).toBe(200);
    expect(lines.every(({ planned }) => planned >= 0 && planned % 100 === 0)).toBe(true);
  });

  it('accepts the new expense categories in transactions, filters and budget schemas', () => {
    const categories = ['Eating out', 'Entertainment', 'Fashion', 'Culture', 'Unexpected'] as const;
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
    expect(view.lines.map(({ category, actual }) => [category, actual])).toEqual(
      categories.map((category, index) => [category, 25 + index]),
    );
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

  it('carries optional due days from templates into month lines and saved templates', () => {
    const initial = emptyAppData('2026-03-01');
    const template = createBudgetTemplate(initial, {
      name: 'Bills', plannedIncome: 10_000,
      lines: [{ category: 'Bills', mode: 'amount', value: 500, dueDay: 5 }],
    }, () => 'bills');
    const applied = applyTemplateToMonth(template, { month: '2026-03', templateId: 'bills' });
    expect(applied.monthBudgets?.[0]?.lines).toEqual([
      { category: 'Bills', planned: 500, dueDay: 5 },
    ]);
    const customized = customizeMonthBudget(applied, '2026-03', {
      plannedIncome: 10_000,
      lines: applied.monthBudgets?.[0]?.lines,
    });
    expect(saveMonthAsTemplate(customized, '2026-03', 'March bills', () => 'march')
      .budgetTemplates?.at(-1)?.lines).toEqual([
      { category: 'Bills', mode: 'amount', value: 500, dueDay: 5 },
    ]);
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
        month: '2026-03', templateId: null, templateName: null, customized: false,
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
          templateId: null,
          templateName: null,
          customized: false,
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
