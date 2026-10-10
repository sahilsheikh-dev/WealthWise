import {
  appDataSchema,
  makeTransactionFormSchema,
  SCHEMA_VERSION,
  TRANSACTION_CATEGORIES,
} from '../schemas';
import { mockAppData } from '../../mock/data';

const validInput = {
  amount: '1,500.50',
  date: '2026-10-10',
  note: '  October  ',
  type: 'expense' as const,
  category: 'Food',
};

describe('appDataSchema', () => {
  it('accepts the typed mock app data and exports schema version one', () => {
    expect(appDataSchema.parse(mockAppData)).toEqual(mockAppData);
    expect(SCHEMA_VERSION).toBe(1);
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
        source: { kind: 'plan-log', parentId: 'plan', entryId: 'log' },
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
