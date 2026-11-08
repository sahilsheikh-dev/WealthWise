import { emptyAppData } from '../actions';
import { budgetCategoryChoiceSections } from '../budgetCategories';
import { INSURANCE_BUDGET_CATEGORIES } from '../policyCategories';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';

describe('budget-aware transaction categories', () => {
  it('groups the titles-only insurance transaction categories in the Insurance section', () => {
    const sections = budgetCategoryChoiceSections(
      emptyAppData('2026-03-01'),
      '2026-03',
      '2026-03-15',
      'expense',
    );
    const insurance = sections.find((section) => section.id === 'insurance');
    expect(insurance?.name).toBe('Insurance');
    expect(insurance?.categories.map((item) => item.category)).toEqual(INSURANCE_BUDGET_CATEGORIES);
  });

  it('groups categories, orders budgeted items first and calculates actuals by selected month', () => {
    const data = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: budgetPlanFromLines([
          { category: 'Food', mode: 'amount' as const, value: 500 },
          { category: 'Rent', mode: 'amount' as const, value: 1_000 },
        ], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      }),
      monthBudgets: [monthBudgetFromLines('2026-03', [
          { category: 'Food', planned: 500 },
          { category: 'Rent', planned: 1_000 },
        ], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
      })],
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
    expect(survival?.categories.slice(0, 2).map((item) => item.category)).toEqual(['Food', 'Rent']);
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
      budgetPlan: budgetPlanFromLines([
          { category: 'Rent', mode: 'amount' as const, value: 1_000 },
          { category: 'Mutual fund / SIP', mode: 'amount' as const, value: 2_000 },
        ], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000 }],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      }),
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

  it('follows user section order and treats a zero-value item as budgeted', () => {
    const plan = budgetPlanFromLines([
      { category: 'Food', mode: 'amount', value: 0 },
      { category: 'Zebra care', mode: 'amount', value: 0 },
      { category: 'Animal care', mode: 'amount', value: 0 },
    ], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
      repeatMonthly: true,
      repeatFrom: '2026-04',
    });
    plan.sections = [
      { id: 'pets', name: 'Pets', type: 'spend' },
      ...plan.sections,
    ];
    plan.items = plan.items.map((item) =>
      item.name === 'Zebra care' || item.name === 'Animal care'
        ? { ...item, sectionId: 'pets' }
        : item,
    );
    const data = { ...emptyAppData('2026-03-01'), budgetPlan: plan };
    const sections = budgetCategoryChoiceSections(data, '2026-04', '2026-03-15', 'expense');
    expect(sections[0]?.id).toBe('pets');
    expect(sections.find((section) => section.id === 'pets')?.categories.map((item) => item.category))
      .toEqual(['Zebra care', 'Animal care']);
    expect(sections.find((section) => section.id === 'survival')?.categories[0]?.category).toBe('Food');
  });

  it('falls back to a surviving spend section or the system catch-all when defaults are removed', () => {
    const base = monthBudgetFromLines('2026-03', [], { incomes: [] });
    const withoutSurvival = {
      ...emptyAppData('2026-03-01'),
      monthBudgets: [{
        ...base,
        sections: base.sections.filter((section) => section.id !== 'survival'),
      }],
    };
    const survivingSection = budgetCategoryChoiceSections(
      withoutSurvival,
      '2026-03',
      '2026-03-15',
      'expense',
    );
    expect(survivingSection.find((section) => section.id === 'wants')?.categories
      .some((item) => item.category === 'Food')).toBe(true);

    const systemOnly = {
      ...emptyAppData('2026-03-01'),
      monthBudgets: [{
        ...base,
        sections: base.sections.filter((section) => section.system !== undefined),
      }],
    };
    expect(budgetCategoryChoiceSections(systemOnly, '2026-03', '2026-03-15', 'expense')[0]?.id)
      .toBe('other-not-in-budget');
    expect(budgetCategoryChoiceSections(systemOnly, '2026-03', '2026-03-15', 'invest')[0]?.id)
      .toBe('other-not-in-budget');
  });
});
