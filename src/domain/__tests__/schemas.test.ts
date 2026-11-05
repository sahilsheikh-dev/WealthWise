import { mockAppData } from '../../mock/data';
import { validateImportData } from '../backup';
import { BUDGET_GROUPS } from '../budget';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';
import {
  appDataSchema,
  manualHoldingSchema,
  BUDGET_CATEGORIES,
  INVESTMENT_FORM_CATEGORIES,
  makeGoalFormSchema,
  makeHoldingFormSchema,
  makeLiabilityFormSchema,
  makeLiabilityPaymentFormSchema,
  makeOnboardingFormSchema,
  makeProfileFormSchema,
  makePlanFormSchema,
  makeInvestmentEntryFormSchema,
  makeTransactionFormSchema,
  makeBudgetItemEditSchema,
  makeMonthAllocationFormSchema,
  SCHEMA_VERSION,
  NON_EARNED_INCOME_CATEGORIES,
  TRANSACTION_CATEGORIES,
} from '../schemas';

const validInput = {
  amount: '1,500.50',
  date: '2026-10-10',
  note: '  October  ',
  type: 'expense' as const,
  category: 'Food',
};

describe('appDataSchema', () => {
  it('accepts the typed mock app data and exports schema version nineteen', () => {
    expect(appDataSchema.parse(mockAppData)).toEqual(mockAppData);
    expect(SCHEMA_VERSION).toBe(19);
    expect(new Set(TRANSACTION_CATEGORIES.expense).size).toBe(TRANSACTION_CATEGORIES.expense.length);
  });

  it('continues loading legacy goal links with explicit shares', () => {
    const holding = mockAppData.holdings[0];
    if (!holding) throw new Error('Mock holding fixture missing');
    const legacy = {
      ...mockAppData,
      goals: [{
        id: 'legacy-goal',
        name: 'Legacy goal',
        target: 1_000,
        saved: 0,
        year: 2030,
        links: [{ instrumentId: holding.id, share: 100 }],
      }],
    };

    expect(appDataSchema.parse(legacy).goals[0]?.links).toEqual([
      { instrumentId: holding.id, share: 100 },
    ]);
    const imported = validateImportData(legacy);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(`Legacy backup was rejected: ${imported.reason}`);
    expect(imported.data.goals.find((goal) => goal.id === 'legacy-goal')?.links).toEqual([
      { instrumentId: holding.id, share: 100 },
    ]);
  });

  it('accepts additive valuation fields and rejects incomplete accrual or price snapshots', () => {
    const manual = mockAppData.holdings.find((holding) => holding.kind === 'manual');
    if (!manual || manual.kind !== 'manual') throw new Error('Expected a manual holding.');
    expect(manualHoldingSchema.safeParse({
      ...manual,
      valuationMethod: 'accrual',
      ratePct: 7,
      compounding: 'quarterly',
      maturityDate: '2030-01-01',
    }).success).toBe(true);
    expect(manualHoldingSchema.safeParse({
      ...manual,
      valuationMethod: 'accrual',
    }).success).toBe(false);
    expect(manualHoldingSchema.safeParse({
      ...manual,
      latestPrice: 10,
    }).success).toBe(false);
    expect(manualHoldingSchema.safeParse({
      ...manual,
      logs: [{
        id: 'priced-entry',
        date: '2026-10-10',
        amount: 100,
        note: '',
        kind: 'Deposit',
        price: 0,
      }],
    }).success).toBe(false);
  });

  it('accepts an optional valid policy-payment due date and rejects invalid dates', () => {
    const policy = mockAppData.policies[0];
    if (!policy) throw new Error('Expected the policy schema fixture.');
    const payment = { id: 'premium', date: '2026-11-04', amount: 500, note: '' };
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, payments: [{ ...payment, dueDate: '2026-11-07' }] }],
    }).success).toBe(true);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, payments: [{ ...payment, dueDate: 'not-a-date' }] }],
    }).success).toBe(false);
  });

  it('validates custom-bucket bounds and case-insensitive names in app and import schemas', () => {
    const buckets = [
      { id: 'first', name: 'Safe reserve', access: 'instant' as const, marketLinked: false },
      { id: 'second', name: 'safe reserve', access: 'days' as const, marketLinked: true },
    ];
    expect(appDataSchema.safeParse({ ...mockAppData, efCustomBuckets: buckets }).success).toBe(false);
    expect(validateImportData({ ...mockAppData, efCustomBuckets: buckets }))
      .toMatchObject({ ok: false, reason: 'invalid-data' });
    const tooMany = Array.from({ length: 9 }, (_, index) => ({
      id: `option-${index}`, name: `Option ${index}`, access: 'slow' as const, marketLinked: false,
    }));
    expect(appDataSchema.safeParse({ ...mockAppData, efCustomBuckets: tooMany }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      efCustomBuckets: [{ id: 'fixed-cash', name: 'Cash', access: 'instant', marketLinked: false }],
    }).success).toBe(false);
  });

  it('validates the budget plan and stored month snapshots', () => {
    const budgeted = {
      ...mockAppData,
      budgetPlan: budgetPlanFromLines([{ category: 'Food', mode: 'percent', value: 20, dueDay: 31 }], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 50_000, day: 1 }],
      }),
      monthBudgets: [{
        ...monthBudgetFromLines('2026-10', [{ category: 'Food', planned: 10_000, dueDay: 31 }], {
          source: 'plan',
          incomes: [{ id: 'snapshot-income', name: 'Income', category: 'Salary', amount: 50_000 }],
          linkedIncluded: true,
        }),
        otherIncomes: [{ id: 'loan-income', name: 'Loan proceeds', category: 'Loan proceeds', amount: 8_000 }],
      }],
    };
    expect(appDataSchema.parse(budgeted)).toEqual(budgeted);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: { ...budgeted.budgetPlan, items: [{ ...budgeted.budgetPlan.items[0], value: 101 }] },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: { ...budgeted.budgetPlan, items: [{ ...budgeted.budgetPlan.items[0], sectionId: 'wants' }] },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      monthBudgets: [{
        ...budgeted.monthBudgets[0],
        items: [{ ...budgeted.monthBudgets[0].items[0], sectionId: 'missing-section' }],
      }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: { ...budgeted.budgetPlan, items: [{ ...budgeted.budgetPlan.items[0], mode: 'amount', value: 10, dueDay: 0 }] },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      monthBudgets: [{
        ...budgeted.monthBudgets[0],
        items: [{ ...budgeted.monthBudgets[0].items[0], dueDay: 32 }],
      }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: {
        ...budgeted.budgetPlan,
        items: [{ ...budgeted.budgetPlan.items[0], frequency: 'quarterly' }],
      },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: {
        ...budgeted.budgetPlan,
        items: [{
          ...budgeted.budgetPlan.items[0],
          frequency: 'quarterly',
          firstDueMonth: '2026-10',
        }],
      },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      budgetPlan: {
        ...budgeted.budgetPlan,
        items: [{
          ...budgeted.budgetPlan.items[0],
          frequency: 'quarterly',
          firstDueMonth: '2026-10',
          mode: 'amount',
          value: 500,
        }],
      },
    }).success).toBe(true);
    expect(appDataSchema.safeParse({
      ...budgeted,
      monthBudgets: [{ ...budgeted.monthBudgets[0], linkedIncluded: 'yes' }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...budgeted,
      monthBudgets: [{
        ...budgeted.monthBudgets[0],
        otherIncomes: [{ id: 'invalid-income', name: 'Loan proceeds', category: 'Loan proceeds', amount: 0 }],
      }],
    }).success).toBe(false);
  });

  describe('onboarding and profile schemas', () => {
    it('trims names, allows a cleared salary and returns normalized salary values', () => {
      expect(makeOnboardingFormSchema().parse({ name: '  Asha  ', monthlySalary: '50000' }))
        .toEqual({ name: 'Asha', monthlySalary: 50_000 });
      expect(makeProfileFormSchema().parse({ name: 'Asha', monthlySalary: '' }))
        .toEqual({ name: 'Asha', monthlySalary: null });
    });

    it('uses stable name and salary validation messages', () => {
      const schema = makeOnboardingFormSchema();
      expect(schema.safeParse({ name: '  ', monthlySalary: '' }).error?.issues[0]?.message)
        .toBe('Enter your name');
      expect(schema.safeParse({ name: 'x'.repeat(41), monthlySalary: '' }).error?.issues[0]?.message)
        .toBe('Keep your name under 40 characters');
      expect(schema.safeParse({ name: 'Asha', monthlySalary: '1000000001' }).error?.issues[0]?.message)
        .toBe('Monthly income must be 1,000,000,000 or less');
      expect(schema.safeParse({ name: 'Asha', monthlySalary: 'not money' }).success).toBe(false);
    });
  });

  it('rejects malformed holdings, invalid dates, negative transactions and mismatched snapshots', () => {
    expect(appDataSchema.safeParse({
      ...mockAppData,
      holdings: [{ ...mockAppData.holdings[0], kind: 'unknown' }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{ ...mockAppData.transactions[0], date: '2026-02-30' }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{ ...mockAppData.transactions[0], amount: -1 }],
    }).success).toBe(false);
    const plan = mockAppData.holdings.find((holding) => holding.kind === 'plan');
    expect(plan?.kind).toBe('plan');
    if (plan?.kind === 'plan') {
      expect(appDataSchema.safeParse({
        ...mockAppData,
        holdings: [{ ...plan, actualValueDate: null }],
      }).success).toBe(false);
      expect(appDataSchema.safeParse({
        ...mockAppData,
        holdings: [{ ...plan, actualValue: null, actualValueDate: null }],
      }).success).toBe(true);
    }
  });

  it('validates goal shares, liability settlements, insurance policy fields and budget lines', () => {
    const goal = mockAppData.goals.find((item) => item.links.length > 0);
    const policy = mockAppData.policies[0];
    const recurring = mockAppData.liabilities.find((item) => item.kind === 'recurring');
    if (!goal || !policy || !recurring || recurring.kind !== 'recurring') throw new Error('Expected v5 mock records.');

    expect(appDataSchema.safeParse({
      ...mockAppData,
      goals: mockAppData.goals.map((item) => item.id === goal.id
        ? { ...item, links: [{ instrumentId: 'holding-sip', share: 1.23 }] }
        : item),
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      liabilities: mockAppData.liabilities.map((item) => item.id === recurring.id
        ? { ...recurring, settlement: { asOf: '2026-03-31', balance: 100 } }
        : item),
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      liabilities: mockAppData.liabilities.map((item) => item.id === recurring.id
        ? {
          ...recurring,
          payments: [{
            id: 'invalid-payment',
            date: '2026-03-31',
            amount: 100,
            note: '',
            kind: 'Payment',
          }],
        }
        : item),
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, premium: 10_000_001 }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, kind: 'term-life', currentValue: 1 }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      budget: { plannedIncome: 0, lines: [] },
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      budget: { plannedIncome: null, lines: [
        { category: 'Food', planned: 100 },
        { category: 'Food', planned: 200 },
      ] },
    }).success).toBe(false);
    const oneTime = mockAppData.liabilities.find((item) => item.kind === 'one-time');
    if (!oneTime) throw new Error('Expected mock one-time liability.');
    expect(appDataSchema.safeParse({
      ...mockAppData,
      liabilities: [{ ...oneTime, settlement: null }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      liabilities: [{
        ...oneTime,
        dueDate: '2026-03-01',
        startDate: '2026-03-02',
      }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      liabilities: [{
        ...oneTime,
        payments: [{
          id: 'invalid-payment',
          date: '2026-03-31',
          amount: 100,
          note: '',
          kind: 'EMI',
        }],
      }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, policyNumber: 'P'.repeat(31) }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, nominee: 'N'.repeat(41) }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, note: 'N'.repeat(121) }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, sumAssured: -1 }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, sumAssured: 0 }],
    }).success).toBe(true);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, endDate: policy.startDate }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      policies: [{ ...policy, currentValue: 1, valueAsOf: null }],
    }).success).toBe(false);
    expect(NON_EARNED_INCOME_CATEGORIES).toEqual(['Withdrawal', 'Borrowed', 'Loan proceeds', 'Own funds']);
    expect(BUDGET_CATEGORIES).toContain('Recharge');
    expect(TRANSACTION_CATEGORIES.expense).toContain('Recharge');
    expect(TRANSACTION_CATEGORIES.expense).toContain('Insurance');
    expect(TRANSACTION_CATEGORIES.expense).toEqual(expect.arrayContaining([
      'Insurance premium',
      'Term life premium',
      'Health premium',
      'Motor premium',
      'Home premium',
    ]));
    expect(TRANSACTION_CATEGORIES.income).toEqual(expect.arrayContaining(['Borrowed', 'Loan proceeds', 'Own funds']));
  });

  it('validates optional metadata and every signed-money / identifier rule', () => {
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{
        ...mockAppData.transactions[0],
        source: { kind: 'holding-entry', parentId: 'plan', entryId: 'log' },
      }],
    }).success).toBe(true);
    const legacyEfField = appDataSchema.safeParse({
      ...mockAppData,
      efEntries: [{ id: 'removed', date: '2026-10-01', amount: 1, note: '' }],
    });
    expect(legacyEfField.success).toBe(true);
    if (legacyEfField.success) expect(legacyEfField.data).not.toHaveProperty('efEntries');
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{ ...mockAppData.transactions[0], id: '' }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{ ...mockAppData.transactions[0], amount: Number.POSITIVE_INFINITY }],
    }).success).toBe(false);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      settings: { ...mockAppData.settings, theme: 'unknown' },
    }).success).toBe(false);
  });
});

describe('makeTransactionFormSchema', () => {
  const schema = makeTransactionFormSchema('2026-10-10');

  it('normalizes and rounds valid amount and trimmed note strings', () => {
    expect(schema.parse(validInput)).toMatchObject({ amount: 1500.5, note: 'October' });
    expect(schema.safeParse({ ...validInput, amount: '1.239' }).success).toBe(false);
  });

  it('accepts legacy and typed insurance expense categories in the transaction form', () => {
    for (const category of [
      'Insurance',
      'Recharge',
      'Insurance premium',
      'Term life premium',
      'Health premium',
      'Motor premium',
      'Home premium',
    ]) {
      expect(schema.safeParse({ ...validInput, category }).success).toBe(true);
    }
  });

  it('accepts a custom category only in the selected month budget', () => {
    const customSchema = makeTransactionFormSchema('2026-10-10', {}, {
      instruments: [],
      withdrawable: {},
      mode: 'create',
      allowUnlinkedInvestment: true,
      budgetCategoriesForMonth: (type, date) =>
        type === 'expense' && date.startsWith('2026-11') ? ['Pet care'] : [],
    });
    const customExpense = { ...validInput, category: 'Pet care' };
    expect(customSchema.safeParse(customExpense).success).toBe(false);
    expect(customSchema.safeParse({ ...customExpense, date: '2026-11-01' }).success).toBe(true);
    expect(customSchema.safeParse({
      ...customExpense,
      type: 'invest',
      date: '2026-11-01',
    }).success).toBe(false);
  });

  it('requires the appropriate instrument for investment and withdrawal transaction modes', () => {
    const options = {
      instruments: [{ id: 'holding-1' }],
      withdrawable: { 'holding-1': 1_000 },
      mode: 'create' as const,
    };
    const instrumentSchema = makeTransactionFormSchema('2026-10-10', {}, options);
    const invest = { ...validInput, type: 'invest' as const, category: 'Gold / Silver' };
    expect(instrumentSchema.safeParse(invest).success).toBe(false);
    expect(instrumentSchema.safeParse({ ...invest, instrumentId: 'holding-1' }).success).toBe(true);
    expect(instrumentSchema.safeParse({ ...invest, instrumentId: 'missing' }).success).toBe(false);
    const pendingBudgetSchema = makeTransactionFormSchema('2026-10-10', {}, {
      ...options, allowUnlinkedInvestment: true,
    });
    expect(pendingBudgetSchema.safeParse(invest).success).toBe(true);
    expect(pendingBudgetSchema.safeParse({ ...invest, instrumentId: 'missing' }).success).toBe(false);
    const withdrawal = { ...validInput, type: 'income' as const, category: 'Withdrawal', amount: '500' };
    expect(instrumentSchema.safeParse(withdrawal).success).toBe(false);
    expect(instrumentSchema.safeParse({ ...withdrawal, instrumentId: 'ef' }).success).toBe(false);
    expect(instrumentSchema.safeParse({ ...withdrawal, instrumentId: 'holding-1' }).success).toBe(true);
    expect(instrumentSchema.safeParse({ ...withdrawal, instrumentId: 'holding-1', amount: '1000.01' }).success).toBe(false);
    expect(instrumentSchema.safeParse({ ...validInput, instrumentId: 'ef' }).success).toBe(false);

    const legacyEditSchema = makeTransactionFormSchema('2026-10-10', {}, {
      ...options, mode: 'edit-unlinked',
    });
    expect(legacyEditSchema.safeParse(invest).success).toBe(true);
    expect(legacyEditSchema.safeParse({ ...invest, instrumentId: 'holding-1' }).success).toBe(true);
    expect(legacyEditSchema.safeParse({ ...invest, instrumentId: 'missing' }).success).toBe(false);
    expect(legacyEditSchema.safeParse({ ...withdrawal, instrumentId: 'ef' }).success).toBe(false);

    const linkedSchema = makeTransactionFormSchema('2026-10-10', {}, {
      ...options, mode: 'edit-linked',
    });
    expect(linkedSchema.safeParse(invest).success).toBe(false);
    expect(linkedSchema.safeParse({ ...invest, instrumentId: 'holding-1' }).success).toBe(true);
    expect(linkedSchema.safeParse(withdrawal).success).toBe(false);
    expect(linkedSchema.safeParse({ ...withdrawal, instrumentId: 'ef' }).success).toBe(false);
  });

  const planValues = {
    name: ' Long term ',
    type: 'Mutual fund / SIP',
    frequency: 'monthly',
    amount: '10,000.25',
    ratePct: '12.25',
    stepUpPct: '',
    tenureYears: '10',
    startDate: '2026-10-10',
    trackFrom: '',
    opening: '0',
    actualValue: '',
    actualValueDate: '',
  };

  describe('Phase 4 forms', () => {
    it('validates, normalizes and enforces plan constraints at range boundaries', () => {
      const schema = makePlanFormSchema('2026-10-10', { otherNames: ['Another'], earliestLogDate: '2026-10-10' });
      const noLogConstraint = makePlanFormSchema('2026-10-10', { otherNames: [], earliestLogDate: null });
      expect(schema.parse(planValues)).toMatchObject({
        name: 'Long term', amount: 10_000.25, ratePct: 12.25, stepUpPct: 0, tenureYears: 10,
        trackFrom: '2026-10-10', opening: 0, actualValue: null, actualValueDate: null,
      });
      expect(schema.safeParse({ ...planValues, type: 'Fixed deposit' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, name: ' another ' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, name: '' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, name: 'x'.repeat(41) }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, amount: '0' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, amount: '10000000' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, amount: '10000000.01' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, amount: '10.123' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, amount: '1,000.50' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, ratePct: '30' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, ratePct: '30.01' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, ratePct: '1.123' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, stepUpPct: '50' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, stepUpPct: '50.01' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, stepUpPct: '0.123' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, tenureYears: '1' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, tenureYears: '50' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, tenureYears: '51' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, tenureYears: '1.5' }).success).toBe(false);
      expect(noLogConstraint.safeParse({ ...planValues, startDate: '2027-10-11' }).success).toBe(true);
      const tooFar = noLogConstraint.safeParse({ ...planValues, startDate: '2027-10-12' });
      expect(tooFar.success).toBe(false);
      if (!tooFar.success) expect(tooFar.error.issues.some((issue) => issue.message === 'Start date is too far ahead')).toBe(true);
      const beforeLog = schema.safeParse({ ...planValues, startDate: '2026-10-11' });
      expect(beforeLog.success).toBe(false);
      if (!beforeLog.success) expect(beforeLog.error.issues.some((issue) => issue.message === 'A logged deposit is dated before this start date')).toBe(true);
      expect(schema.safeParse({ ...planValues, trackFrom: '2026-10-09' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, trackFrom: 'bad-date' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, opening: '10000000000' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, opening: '10000000001' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValue: '20' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValueDate: '2026-10-10' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValue: '0', actualValueDate: '2026-10-10' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, actualValue: '1', actualValueDate: '2026-10-11' }).success).toBe(false);
      expect(schema.safeParse({
        ...planValues, valuationMethod: 'accrual', compounding: 'quarterly',
        maturityDate: '2030-10-10', actualValue: '0', actualValueDate: '2026-10-10',
      })).toMatchObject({
        success: true,
        data: { valuationMethod: 'accrual', compounding: 'quarterly', maturityDate: '2030-10-10' },
      });
      const earlyMaturity = schema.safeParse({
        ...planValues, maturityDate: '2026-10-09', actualValue: '0', actualValueDate: '2026-10-10',
      });
      expect(earlyMaturity.success).toBe(false);
      if (!earlyMaturity.success) {
        expect(earlyMaturity.error.issues.some((issue) =>
          issue.message === 'Enter a maturity date on or after the plan start date',
        )).toBe(true);
      }
      const earlySnapshot = schema.safeParse({ ...planValues, actualValue: '1', actualValueDate: '2026-10-09' });
      expect(earlySnapshot.success).toBe(false);
      if (!earlySnapshot.success) expect(earlySnapshot.error.issues.some((issue) => issue.message === 'Value date is before the plan started')).toBe(true);
      expect(schema.safeParse({ ...planValues, actualValue: '1', actualValueDate: 'bad-date' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, opening: '' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, actualValue: '100000000000000000000' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, startDate: '2026-02-30' }).success).toBe(false);
    });

    it('validates investment entries including date, kind and withdrawal bounds', () => {
      const schema = makeInvestmentEntryFormSchema('2026-10-10', { startDate: '2026-09-01', currentValue: 100 });
      const valid = { kind: 'Deposit', date: '2026-10-10', amount: '100000000', note: '  Monthly  ' };
      expect(schema.parse(valid)).toMatchObject({ amount: 100_000_000, note: 'Monthly' });
      expect(schema.safeParse({ ...valid, date: '2026-08-31' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, date: '2026-10-11' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, kind: 'Withdrawal', amount: '101' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, amount: '0' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, amount: '100000000.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, amount: '10.123' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, note: 'x'.repeat(61) }).success).toBe(false);
    });

    it('validates liability solver inputs and payment history boundaries', () => {
      const schema = makeLiabilityFormSchema('2026-10-10', { otherNames: ['Other loan'], earliestPaymentDate: '2026-10-01' });
      const valid = { kind: 'recurring', type: 'Car loan', name: 'Car loan', principal: '100000', ratePct: '12', tenureMonths: '12', startDate: '2026-10-01', emi: '' };
      expect(schema.parse(valid)).toMatchObject({ principal: 100_000, ratePct: 12, tenureMonths: 12, emi: 8_884.88 });
      const duplicateName = schema.safeParse({ ...valid, name: ' other loan ' });
      expect(duplicateName.success).toBe(false);
      if (!duplicateName.success) expect(duplicateName.error.issues.some((issue) => issue.message === 'A liability with this name already exists')).toBe(true);
      expect(schema.safeParse({ ...valid, name: '' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '0' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '1000000000' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, principal: '1000000000.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '10.123' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '100' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, ratePct: '100.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '1.111' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, tenureMonths: '1' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, tenureMonths: '600' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, tenureMonths: '601' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, tenureMonths: '2.5' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-02' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-11' }).success).toBe(false);
      const missingPrincipal = schema.safeParse({ ...valid, principal: '' });
      expect(missingPrincipal.success).toBe(false);
      if (!missingPrincipal.success) {
        expect(missingPrincipal.error.issues.some((issue) =>
          issue.message === 'Enter an amount like 1500 or 1500.50',
        )).toBe(true);
      }
      const missingStartDate = schema.safeParse({ ...valid, startDate: '' });
      expect(missingStartDate.success).toBe(false);
      if (!missingStartDate.success) {
        expect(missingStartDate.error.issues.some((issue) => issue.message === 'Enter a valid date')).toBe(true);
      }
      expect(schema.safeParse({ ...valid, emi: '1000' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, emi: '1001' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, emi: '1000.123' }).success).toBe(false);
    });

    it('requires two solver values and fills each omitted recurring value', () => {
      const schema = makeLiabilityFormSchema('2026-10-10', { otherNames: [], earliestPaymentDate: null });
      const base = {
        kind: 'recurring',
        type: 'Car loan',
        name: 'Car loan',
        principal: '1000000',
        ratePct: '',
        tenureMonths: '',
        startDate: '2026-10-01',
        emi: '',
      };
      const insufficient = schema.safeParse(base);
      expect(insufficient.success).toBe(false);
      if (!insufficient.success) {
        expect(insufficient.error.issues.some((issue) =>
          issue.message === 'Add one more of tenure, interest rate or EMI so we can work out the rest',
        )).toBe(true);
      }
      expect(schema.parse({ ...base, ratePct: '10', tenureMonths: '12' })).toMatchObject({
        ratePct: 10,
        tenureMonths: 12,
        emi: 87_915.89,
      });
      expect(schema.parse({ ...base, tenureMonths: '12', emi: '87915.89' })).toMatchObject({
        ratePct: 10,
        tenureMonths: 12,
        emi: 87_915.89,
      });
      expect(schema.parse({ ...base, ratePct: '10', emi: '87915.89' })).toMatchObject({
        ratePct: 10,
        tenureMonths: 12,
        emi: 87_915.89,
      });
    });

    it('validates one-time liabilities and optional due-date boundaries', () => {
      const schema = makeLiabilityFormSchema('2026-10-10', { otherNames: [], earliestPaymentDate: '2026-10-01' });
      const valid = {
        kind: 'one-time', type: 'Borrowed money', name: 'Friend', principal: '20000',
        ratePct: '0', startDate: '2026-10-01', dueDate: '',
      };
      expect(schema.parse(valid)).toMatchObject({ kind: 'one-time', principal: 20_000, dueDate: null });
      expect(schema.parse({ ...valid, dueDate: '2026-10-15' })).toMatchObject({ dueDate: '2026-10-15' });
      expect(schema.safeParse({ ...valid, dueDate: 'bad-date' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, dueDate: '2026-09-30' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-02' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-11' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '1000000000.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '60.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '' }).success).toBe(true);
      expect(makeLiabilityFormSchema('2026-10-10', { otherNames: [], earliestPaymentDate: null })
        .safeParse(valid).success).toBe(true);
    });

    it('enforces loan payment date, cleared state and ceiling balance rules', () => {
      const schema = makeLiabilityPaymentFormSchema('2026-10-10', { startDate: '2026-01-01', outstandingExcludingThis: 100.1 });
      const valid = { date: '2026-10-10', amount: '101', kind: 'EMI', note: '' };
      expect(schema.parse(valid).amount).toBe(101);
      expect(schema.safeParse({ ...valid, amount: '102' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, amount: '0' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, amount: '1.123' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, date: '2025-12-31' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, date: '2026-10-11' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, date: '2026-02-30' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, kind: 'cash' }).success).toBe(false);
      const oneTimeSchema = makeLiabilityPaymentFormSchema('2026-10-10', {
        startDate: '2026-01-01',
        outstandingExcludingThis: 100.1,
        oneTime: true,
      });
      expect(oneTimeSchema.parse({ ...valid, amount: '100', kind: 'Payment' }).amount).toBe(100);
      expect(oneTimeSchema.safeParse({ ...valid, kind: 'EMI' }).success).toBe(false);
      const cleared = makeLiabilityPaymentFormSchema('2026-10-10', { startDate: '2026-01-01', outstandingExcludingThis: 0.99 }).safeParse(valid);
      expect(cleared.success).toBe(false);
      if (!cleared.success) expect(cleared.error.issues.some((issue) => issue.message === 'This liability is already cleared')).toBe(true);
    });

    it('validates goal and holding forms', () => {
      const goalSchema = makeGoalFormSchema('2026-10-10', { otherNames: ['Vacation'], locked: false });
      const goal = { name: 'House', target: '100000', saved: '0', year: '2026' };
      expect(goalSchema.parse(goal)).toMatchObject({ name: 'House', target: 100_000, saved: 0, year: 2026 });
      expect(goalSchema.safeParse({ ...goal, saved: '100000' }).success).toBe(true);
      const duplicate = goalSchema.safeParse({ ...goal, name: ' vacation ' });
      expect(duplicate.success).toBe(false);
      if (!duplicate.success) expect(duplicate.error.issues.some((issue) => issue.message === 'A goal with this name already exists')).toBe(true);
      expect(goalSchema.safeParse({ ...goal, saved: '100001' }).success).toBe(false);
      expect(goalSchema.safeParse({ ...goal, year: '2025' }).success).toBe(true);
      expect(goalSchema.safeParse({ ...goal, year: '2086' }).success).toBe(true);
      expect(goalSchema.safeParse({ ...goal, year: '1990' }).success).toBe(true);
      expect(goalSchema.safeParse({ ...goal, year: '2100' }).success).toBe(true);
      const beforeMinimumYear = goalSchema.safeParse({ ...goal, year: '1989' });
      expect(beforeMinimumYear.success).toBe(false);
      if (!beforeMinimumYear.success) {
        expect(beforeMinimumYear.error.issues.find((issue) => issue.path[0] === 'year')?.message)
          .toBe('Enter a year between 1990 and 2100');
      }
      const afterMaximumYear = goalSchema.safeParse({ ...goal, year: '2101' });
      expect(afterMaximumYear.success).toBe(false);
      if (!afterMaximumYear.success) {
        expect(afterMaximumYear.error.issues.find((issue) => issue.path[0] === 'year')?.message)
          .toBe('Enter a year between 1990 and 2100');
      }
      const editingPastGoalSchema = makeGoalFormSchema('2026-10-10', {
        otherNames: [], locked: false, existingYear: 2020,
      });
      expect(editingPastGoalSchema.safeParse({ ...goal, year: '2020' }).success).toBe(true);
      expect(editingPastGoalSchema.safeParse({ ...goal, year: '2019' }).success).toBe(true);
      const minimumTargetSchema = makeGoalFormSchema('2026-10-10', {
        otherNames: [], locked: true, minTarget: 60_000,
      });
      const belowMinimum = minimumTargetSchema.safeParse({
        ...goal, target: '59999', year: '2026',
      });
      expect(belowMinimum.success).toBe(false);
      if (!belowMinimum.success) {
        expect(belowMinimum.error.issues.find((issue) => issue.path[0] === 'target')?.message)
          .toBe('Emergency fund target must be at least 3 months of cover (₹60,000)');
      }
      expect(minimumTargetSchema.safeParse({ ...goal, target: '60000', year: '2026' }).success).toBe(true);
      const lockedWithoutMinimum = makeGoalFormSchema('2026-10-10', {
        otherNames: [], locked: true,
      });
      expect(lockedWithoutMinimum.parse({
        ...goal, target: '1', saved: '100000', year: '2026',
      })).toMatchObject({ target: 1, saved: 0 });

      const holdingSchema = makeHoldingFormSchema({ otherNames: ['PF'] });
      const holding = { name: 'New FD', type: 'Fixed deposit', invested: '1000', value: '900' };
      expect(holdingSchema.parse(holding)).toMatchObject({
        invested: 1000, value: 900, valuationMethod: 'manual', ratePct: undefined, compounding: 'yearly',
      });
      expect(holdingSchema.parse({
        ...holding, valuationMethod: 'accrual', ratePct: '7',
        compounding: 'quarterly', maturityDate: '2030-01-01',
      })).toMatchObject({
        valuationMethod: 'accrual', ratePct: 7, compounding: 'quarterly', maturityDate: '2030-01-01',
      });
      expect(holdingSchema.safeParse({
        ...holding, valuationMethod: 'accrual', ratePct: '',
      }).success).toBe(false);
      expect(holdingSchema.safeParse({ ...holding, maturityDate: '2026-02-30' }).success).toBe(false);
      const holdingWithEntriesSchema = makeHoldingFormSchema({ otherNames: [], entriesExist: true });
      const blockedTypeChange = holdingWithEntriesSchema.safeParse({ ...holding, type: 'Fixed deposit' });
      expect(blockedTypeChange.success).toBe(false);
      if (!blockedTypeChange.success) {
        expect(blockedTypeChange.error.issues.some((issue) =>
          issue.message === 'Remove the existing entries before changing this holding to Fixed deposit.',
        )).toBe(true);
      }
      expect(holdingSchema.safeParse({ ...holding, name: 'pf' }).success).toBe(false);
      expect(holdingSchema.safeParse({ ...holding, invested: '10000000000.01' }).success).toBe(false);

    });
  });

  it.each(['0', '-5', 'abc', '10.999', '100000001', '1e3', ''])('rejects amount "%s"', (amount) => {
    const result = schema.safeParse({ ...validInput, amount });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'amount')).toBe(true);
  });

  it('accepts comma grouping, validates calendar dates and permits the 24-month planning horizon', () => {
    expect(schema.parse({ ...validInput, amount: '1,500.50', date: '2026-10-10' }).date).toBe('2026-10-10');
    const invalidDate = schema.safeParse({ ...validInput, date: '2026-02-30' });
    expect(invalidDate.success).toBe(false);
    if (!invalidDate.success) expect(invalidDate.error.issues[0]?.message).toBe('Enter a valid date');
    expect(schema.safeParse({ ...validInput, date: '2026-10-11' }).success).toBe(true);
    const beyondPlanningHorizon = schema.safeParse({ ...validInput, date: '2028-11-01' });
    expect(beyondPlanningHorizon.success).toBe(false);
    if (!beyondPlanningHorizon.success) {
      expect(beyondPlanningHorizon.error.issues[0]?.message)
        .toBe('Date cannot be more than 24 months ahead');
    }
  });

  it('validates budget-item edit amount and optional due day', () => {
    const editSchema = makeBudgetItemEditSchema();
    expect(editSchema.parse({ amount: '0', day: '31', scope: 'month' }))
      .toEqual({ amount: 0, day: 31, scope: 'month' });
    expect(editSchema.parse({ amount: '500.50', day: '', scope: 'following' }))
      .toEqual({ amount: 500.5, day: undefined, scope: 'following' });
    for (const day of ['0', '32', '2.5', 'no']) {
      expect(editSchema.safeParse({ amount: '1', day, scope: 'month' }).success).toBe(false);
    }
    expect(editSchema.safeParse({ amount: '-1', day: '', scope: 'month' }).success).toBe(false);
    expect(editSchema.safeParse({ amount: '', day: '', scope: 'month' }).success).toBe(false);
  });

  it('enforces note length and the category list for the chosen type', () => {
    expect(schema.safeParse({ ...validInput, note: 'n'.repeat(60) }).success).toBe(true);
    const longNote = schema.safeParse({ ...validInput, note: 'n'.repeat(61) });
    expect(longNote.success).toBe(false);
    if (!longNote.success) expect(longNote.error.issues[0]?.message).toBe('Keep the note under 60 characters');
    const category = schema.safeParse({ ...validInput, category: 'Salary' });
    expect(category.success).toBe(false);
    if (!category.success) expect(category.error.issues[0]).toMatchObject({ path: ['category'], message: 'Choose a category' });
    expect(TRANSACTION_CATEGORIES.invest).not.toContain('Emergency fund');
  });

  it('keeps the emergency fund out of investment, budget, and instrument choices', () => {
    const budgetCategories = [
      ...BUDGET_CATEGORIES,
      ...BUDGET_GROUPS.flatMap(({ categories }) => categories),
    ];
    expect(TRANSACTION_CATEGORIES.invest).not.toContain('Emergency fund');
    expect(INVESTMENT_FORM_CATEGORIES).not.toContain('Emergency fund');
    expect(budgetCategories).not.toContain('Emergency fund');

    const transactionSchema = makeTransactionFormSchema('2026-10-10', {}, {
      instruments: [{ id: 'holding-1' }],
      withdrawable: { 'holding-1': 1_000 },
      mode: 'create',
    });
    expect(transactionSchema.safeParse({
      ...validInput, type: 'invest', category: 'Emergency fund', instrumentId: 'holding-1',
    }).success).toBe(false);
    expect(transactionSchema.safeParse({
      ...validInput, type: 'invest', category: 'Other investments', instrumentId: 'ef',
    }).success).toBe(false);
  });
});

describe('cash-flow form schemas', () => {
  it('validates shortfall/surplus allocation kinds, targets and remaining amounts', () => {
    const schema = makeMonthAllocationFormSchema('shortfall', {
      liabilityIds: ['liability'], instrumentIds: ['asset'], maximumAmount: 100,
    });
    const input = {
      allocationKind: 'loan-proceeds',
      amount: '80',
      targetId: 'liability',
      lenderName: '',
      note: '',
    };
    expect(schema.safeParse(input).success).toBe(true);
    expect(schema.safeParse({ ...input, amount: '101' }).success).toBe(false);
    expect(schema.safeParse({ ...input, targetId: 'missing' }).success).toBe(false);
    expect(makeMonthAllocationFormSchema('surplus', {
      liabilityIds: ['liability'], instrumentIds: ['asset'], maximumAmount: 100,
    }).safeParse({ ...input, allocationKind: 'invest', targetId: 'asset' }).success).toBe(true);
  });
});
