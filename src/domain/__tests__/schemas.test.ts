import { mockAppData } from '../../mock/data';
import { efEndOfDayBalances } from '../efActions';
import {
  appDataSchema,
  makeEfEntryFormSchema,
  makeGoalFormSchema,
  makeHoldingFormSchema,
  makeLiabilityFormSchema,
  makeLiabilityPaymentFormSchema,
  makePlanFormSchema,
  makeInvestmentEntryFormSchema,
  makeTransactionFormSchema,
  SCHEMA_VERSION,
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
  it('accepts the typed mock app data and exports schema version two', () => {
    expect(appDataSchema.parse(mockAppData)).toEqual(mockAppData);
    expect(SCHEMA_VERSION).toBe(2);
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

  it('validates optional metadata and every signed-money / identifier rule', () => {
    expect(appDataSchema.safeParse({
      ...mockAppData,
      transactions: [{
        ...mockAppData.transactions[0],
        source: { kind: 'holding-entry', parentId: 'plan', entryId: 'log' },
      }],
      efEntries: [{ id: 'withdrawal', date: '2026-10-01', amount: -10, note: 'Cash' }],
    }).success).toBe(true);
    expect(appDataSchema.safeParse({
      ...mockAppData,
      efEntries: [{ id: 'zero', date: '2026-10-01', amount: 0, note: '' }],
    }).success).toBe(false);
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
      settings: { name: 'Test', theme: 'unknown' },
    }).success).toBe(false);
  });
});

describe('makeTransactionFormSchema', () => {
  const schema = makeTransactionFormSchema('2026-10-10');

  it('normalizes and rounds valid amount and trimmed note strings', () => {
    expect(schema.parse(validInput)).toMatchObject({ amount: 1500.5, note: 'October' });
    expect(schema.safeParse({ ...validInput, amount: '1.239' }).success).toBe(false);
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
      if (!beforeLog.success) expect(beforeLog.error.issues.some((issue) => issue.message === 'A logged installment is dated before this start date')).toBe(true);
      expect(schema.safeParse({ ...planValues, trackFrom: '2026-10-09' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, trackFrom: 'bad-date' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, opening: '10000000000' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, opening: '10000000001' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValue: '20' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValueDate: '2026-10-10' }).success).toBe(false);
      expect(schema.safeParse({ ...planValues, actualValue: '0', actualValueDate: '2026-10-10' }).success).toBe(true);
      expect(schema.safeParse({ ...planValues, actualValue: '1', actualValueDate: '2026-10-11' }).success).toBe(false);
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

    it('validates liabilities, interest-covering EMI and payment history boundaries', () => {
      const schema = makeLiabilityFormSchema('2026-10-10', { otherNames: ['Other loan'], earliestPaymentDate: '2026-10-01' });
      const valid = { kind: 'recurring', type: 'Car loan', name: 'Car loan', principal: '100000', ratePct: '12', tenureMonths: '12', startDate: '2026-10-01', emi: '' };
      expect(schema.parse(valid)).toMatchObject({ principal: 100_000, ratePct: 12, tenureMonths: 12, emi: null });
      const duplicateName = schema.safeParse({ ...valid, name: ' other loan ' });
      expect(duplicateName.success).toBe(false);
      if (!duplicateName.success) expect(duplicateName.error.issues.some((issue) => issue.message === 'A liability with this name already exists')).toBe(true);
      expect(schema.safeParse({ ...valid, name: '' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '0' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '1000000000' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, principal: '1000000000.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, principal: '10.123' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '60' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, ratePct: '60.01' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, ratePct: '1.111' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, tenureMonths: '1' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, tenureMonths: '480' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, tenureMonths: '481' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, tenureMonths: '2.5' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-02' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, startDate: '2026-10-11' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, emi: '1000' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, emi: '1001' }).success).toBe(true);
      expect(schema.safeParse({ ...valid, emi: '1000.123' }).success).toBe(false);
    });

    it('validates one-time liabilities and optional due-date boundaries', () => {
      const schema = makeLiabilityFormSchema('2026-10-10', { otherNames: [], earliestPaymentDate: '2026-10-01' });
      const valid = {
        kind: 'one-time', type: 'Borrowed money', name: 'Friend', principal: '20000',
        ratePct: '0', startDate: '2026-10-01', dueDate: '',
      };
      expect(schema.parse(valid)).toMatchObject({ kind: 'one-time', principal: 20_000, dueDate: null });
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
      const cleared = makeLiabilityPaymentFormSchema('2026-10-10', { startDate: '2026-01-01', outstandingExcludingThis: 0.99 }).safeParse(valid);
      expect(cleared.success).toBe(false);
      if (!cleared.success) expect(cleared.error.issues.some((issue) => issue.message === 'This liability is already cleared')).toBe(true);
    });

    it('validates goal, holding and emergency-fund entry forms', () => {
      const goalSchema = makeGoalFormSchema('2026-10-10', { otherNames: ['Vacation'], locked: false });
      const goal = { name: 'House', target: '100000', saved: '0', year: '2026' };
      expect(goalSchema.parse(goal)).toMatchObject({ name: 'House', target: 100_000, saved: 0, year: 2026 });
      const duplicate = goalSchema.safeParse({ ...goal, name: ' vacation ' });
      expect(duplicate.success).toBe(false);
      if (!duplicate.success) expect(duplicate.error.issues.some((issue) => issue.message === 'A goal with this name already exists')).toBe(true);
      expect(goalSchema.safeParse({ ...goal, saved: '100001' }).success).toBe(false);
      expect(goalSchema.safeParse({ ...goal, year: '2025' }).success).toBe(false);
      expect(goalSchema.safeParse({ ...goal, year: '2086' }).success).toBe(true);
      const editingPastGoalSchema = makeGoalFormSchema('2026-10-10', {
        otherNames: [], locked: false, existingYear: 2020,
      });
      expect(editingPastGoalSchema.safeParse({ ...goal, year: '2020' }).success).toBe(true);
      expect(editingPastGoalSchema.safeParse({ ...goal, year: '2019' }).success).toBe(false);

      const holdingSchema = makeHoldingFormSchema({ otherNames: ['PF'] });
      const holding = { name: 'New FD', type: 'Fixed deposit', invested: '1000', value: '900' };
      expect(holdingSchema.parse(holding)).toMatchObject({ invested: 1000, value: 900 });
      expect(holdingSchema.safeParse({ ...holding, name: 'pf' }).success).toBe(false);
      expect(holdingSchema.safeParse({ ...holding, invested: '10000000000.01' }).success).toBe(false);

      const efEntries = [
        { id: 'funding', date: '2026-10-01', amount: 100, note: '' },
        { id: 'later-spend', date: '2026-10-10', amount: -80, note: '' },
      ];
      const schemaFor = (existingId?: string) => makeEfEntryFormSchema('2026-10-10', {
        firstNegativeDate: (candidate) => efEndOfDayBalances([
          ...efEntries.filter((entry) => entry.id !== existingId),
          { id: 'candidate', ...candidate, note: '' },
        ]).find(({ balance }) => balance < 0)?.date ?? null,
      });
      const efSchema = schemaFor();
      const deposit = { kind: 'Deposit', amount: '100000000', date: '2026-10-10', note: '' };
      expect(efSchema.parse(deposit).amount).toBe(100_000_000);
      expect(efSchema.safeParse({ ...deposit, amount: '100000000.01' }).success).toBe(false);
      const backdated = efSchema.safeParse({ ...deposit, kind: 'Withdrawal', amount: '30', date: '2026-10-05' });
      expect(backdated.success).toBe(false);
      if (!backdated.success) expect(backdated.error.issues.some((issue) => issue.message.includes('10 Oct 2026'))).toBe(true);
      const fundingEditSchema = schemaFor('funding');
      const loweredDeposit = fundingEditSchema.safeParse({ ...deposit, kind: 'Deposit', amount: '50', date: '2026-10-01' });
      expect(loweredDeposit.success).toBe(false);
      expect(fundingEditSchema.safeParse({ ...deposit, kind: 'Deposit', amount: '100', date: '2026-10-01' }).success).toBe(true);
      expect(efSchema.safeParse({ ...deposit, kind: 'Withdrawal', amount: '20', date: '2026-10-05' }).success).toBe(true);
      const exceeded = efSchema.safeParse({ ...deposit, kind: 'Withdrawal', amount: '101', date: '2026-10-01' });
      expect(exceeded.success).toBe(false);
      if (!exceeded.success) expect(exceeded.error.issues.some((issue) => issue.message.includes('This would make the balance negative on'))).toBe(true);
      expect(efSchema.safeParse({ ...deposit, kind: 'Deposit', amount: '100', date: '2026-10-01' }).success).toBe(true);
      expect(efSchema.safeParse({ ...deposit, date: '2026-10-11' }).success).toBe(false);
      expect(efSchema.safeParse({ ...deposit, note: 'x'.repeat(61) }).success).toBe(false);
    });
  });

  it.each(['0', '-5', 'abc', '10.999', '100000001', '1e3', ''])('rejects amount "%s"', (amount) => {
    const result = schema.safeParse({ ...validInput, amount });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'amount')).toBe(true);
  });

  it('accepts comma grouping and rejects invalid calendar/future dates with the right errors', () => {
    expect(schema.parse({ ...validInput, amount: '1,500.50', date: '2026-10-10' }).date).toBe('2026-10-10');
    const invalidDate = schema.safeParse({ ...validInput, date: '2026-02-30' });
    expect(invalidDate.success).toBe(false);
    if (!invalidDate.success) expect(invalidDate.error.issues[0]?.message).toBe('Enter a valid date');
    const future = schema.safeParse({ ...validInput, date: '2026-10-11' });
    expect(future.success).toBe(false);
    if (!future.success) expect(future.error.issues[0]?.message).toBe('Date cannot be in the future');
  });

  it('enforces note length and the category list for the chosen type', () => {
    expect(schema.safeParse({ ...validInput, note: 'n'.repeat(60) }).success).toBe(true);
    const longNote = schema.safeParse({ ...validInput, note: 'n'.repeat(61) });
    expect(longNote.success).toBe(false);
    if (!longNote.success) expect(longNote.error.issues[0]?.message).toBe('Keep the note under 60 characters');
    const category = schema.safeParse({ ...validInput, category: 'Salary' });
    expect(category.success).toBe(false);
    if (!category.success) expect(category.error.issues[0]).toMatchObject({ path: ['category'], message: 'Choose a category' });
    expect(TRANSACTION_CATEGORIES.invest).toContain('Emergency fund');
  });
});
