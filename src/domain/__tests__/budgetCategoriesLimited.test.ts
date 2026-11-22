import { emptyAppData } from '../actions';
import { budgetCategoryChoiceSections, budgetItemCategoriesForTransaction } from '../budgetCategories';
import { budgetPlanFromLines } from '../../testFixtures/budget';
import type { AppData } from '../types';

describe('budgetCategoriesLimited: limit transaction expense categories to user-created or scheduled items', () => {
  const baseData: AppData = {
    ...emptyAppData('2026-11-01'),
    liabilities: [
      {
        id: 'home-loan',
        name: 'Home Loan',
        type: 'Home loan',
        kind: 'recurring',
        principal: 1_000_000,
        ratePct: 8.5,
        startDate: '2026-01-01',
        tenureMonths: 120,
        emi: 12_500,
        settlement: null,
        payments: [],
      },
    ],
    policies: [
      {
        id: 'term-life-1',
        name: 'Term Life Cover',
        kind: 'term-life',
        insurer: 'HDFC Life',
        policyNumber: 'TL-1234',
        sumAssured: 10_000_000,
        premium: 15_000,
        frequency: 'yearly',
        startDate: '2026-11-01',
        trackFrom: '2026-11-01',
        premiumYears: 10,
        status: 'active',
        currentValue: null,
        valueAsOf: null,
        payments: [],
      },
    ],
    budgetPlan: budgetPlanFromLines([
      { category: 'Groceries', mode: 'amount', value: 8_000 },
      { category: 'Rent', mode: 'amount', value: 20_000 },
      { category: 'Mutual fund / SIP', mode: 'amount', value: 10_000 },
    ], {
      incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 80_000 }],
      repeatMonthly: true,
      repeatFrom: '2026-11',
    }),
  };

  it('limits expense categories to user-created and applicable scheduled items, removing unwanted built-ins', () => {
    const sections = budgetCategoryChoiceSections(
      baseData,
      '2026-11',
      '2026-11-01',
      'expense',
      null,
      { limitExpenseToCreatedOrApplicable: true },
    );

    const allCategories = sections.flatMap((section) => section.categories.map((c) => c.category));

    // User-created budget items are present
    expect(allCategories).toContain('Groceries');
    expect(allCategories).toContain('Rent');

    // Applicable scheduled items are present (EMI from home loan, Insurance from policy)
    expect(allCategories).toContain('EMI');
    expect(allCategories).toContain('Term life premium');

    // Generic uncreated built-ins are NOT present
    expect(allCategories).not.toContain('Entertainment');
    expect(allCategories).not.toContain('Fashion');
    expect(allCategories).not.toContain('Subscriptions');
    expect(allCategories).not.toContain('Travel');
    expect(allCategories).not.toContain('Gifts');
    expect(allCategories).not.toContain('Shopping');
  });

  it('preserves historical category when editing existing transaction to avoid data loss', () => {
    const sections = budgetCategoryChoiceSections(
      baseData,
      '2026-11',
      '2026-11-01',
      'expense',
      null,
      {
        limitExpenseToCreatedOrApplicable: true,
        existingCategory: 'Gifts',
      },
    );

    const allCategories = sections.flatMap((section) => section.categories.map((c) => c.category));

    // Historical category is preserved
    expect(allCategories).toContain('Gifts');

    // Other uncreated categories still excluded
    expect(allCategories).not.toContain('Fashion');
    expect(allCategories).not.toContain('Travel');
  });

  it('preserves existing Investment category behavior without changes', () => {
    const sections = budgetCategoryChoiceSections(
      baseData,
      '2026-11',
      '2026-11-01',
      'invest',
      null,
      { limitExpenseToCreatedOrApplicable: true },
    );

    const allCategories = sections.flatMap((section) => section.categories.map((c) => c.category));

    // Standard investment categories are all preserved
    expect(allCategories).toContain('Mutual fund / SIP');
    expect(allCategories).toContain('Stocks / ETF');
    expect(allCategories).toContain('Real estate');
    expect(allCategories).toContain('Fixed deposit / RD');
    expect(allCategories).toContain('Gold / Silver');
    expect(allCategories).toContain('Other investments');
  });

  it('budgetItemCategoriesForTransaction filters expense categories but preserves invest categories', () => {
    const expenseCategories = budgetItemCategoriesForTransaction(baseData, '2026-11', '2026-11-01', 'expense');
    expect(expenseCategories).toContain('Groceries');
    expect(expenseCategories).not.toContain('Fashion');

    const investCategories = budgetItemCategoriesForTransaction(baseData, '2026-11', '2026-11-01', 'invest');
    expect(investCategories).toContain('Mutual fund / SIP');
    expect(investCategories).toContain('Stocks / ETF');
  });
});
