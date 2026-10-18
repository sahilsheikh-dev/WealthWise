import { emptyAppData } from '../actions';
import { budgetCategoryChoiceSections } from '../budgetCategories';

describe('budget-aware transaction categories', () => {
  it('groups categories, orders budgeted items first and calculates actuals by selected month', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
        lines: [
          { category: 'Food', mode: 'amount' as const, value: 500 },
          { category: 'Rent', mode: 'amount' as const, value: 1_000 },
        ],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      },
      monthBudgets: [{
        month: '2026-03',
        source: 'custom' as const,
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
        lines: [
          { category: 'Food', planned: 500 },
          { category: 'Rent', planned: 1_000 },
        ],
      }],
      transactions: [{
        id: 'rent-actual',
        type: 'expense' as const,
        amount: 1_200,
        category: 'Rent',
        note: '',
        date: '2026-03-10',
      }],
    };
    const sections = budgetCategoryChoiceSections(data, '2026-03', '2026-03-15', 'expense');
    expect(sections.map((section) => section.name)).toContain('Survival (Needs)');
    const survival = sections.find((section) => section.id === 'survival');
    expect(survival?.categories[0]?.category).toBe('Rent');
    expect(survival?.categories.find((item) => item.category === 'Rent')).toMatchObject({
      planned: 1_000,
      actual: 1_200,
    });
    expect(survival?.categories.find((item) => item.category === 'Living')).toMatchObject({
      planned: 0,
      actual: 0,
    });
  });

  it('uses virtual upcoming budgets and groups derived investment categories', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
        lines: [
          { category: 'Rent', mode: 'amount' as const, value: 1_000 },
          { category: 'Mutual fund / SIP', mode: 'amount' as const, value: 2_000 },
        ],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      },
    };
    const futureExpenses = budgetCategoryChoiceSections(data, '2026-04', '2026-03-15', 'expense');
    expect(futureExpenses.find((section) => section.id === 'survival')?.categories
      .find((item) => item.category === 'Rent')?.planned).toBe(1_000);
    const investments = budgetCategoryChoiceSections(data, '2026-04', '2026-03-15', 'invest');
    expect(investments.map((section) => section.id)).toEqual(['savings-investments']);
    expect(investments[0]?.categories[0]).toEqual({
      category: 'Mutual fund / SIP',
      planned: 2_000,
      actual: 0,
    });
  });
});
