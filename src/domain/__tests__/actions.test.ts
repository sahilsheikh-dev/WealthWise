import {
  addTransaction, completeOnboarding, deleteTransaction, emptyAppData, NotFoundError, updateSettings, updateTransaction,
} from '../actions';
import { confirmHoldingValue } from '../holdingActions';
import { GoalTargetBelowMinimumError, updateGoal } from '../goalActions';
import type { AppData, Transaction } from '../types';

const input: Omit<Transaction, 'id'> = {
  type: 'expense',
  amount: 100,
  category: 'Food',
  note: 'Lunch',
  date: '2026-10-10',
};
const base = (transactions: Transaction[] = []): AppData => ({
  ...emptyAppData('2026-10-10'),
  transactions,
});

describe('immutable app actions', () => {
  it('creates an empty app with its pinned emergency fund goal', () => {
    expect(emptyAppData('2026-10-10')).toEqual({
      settings: { name: '', theme: 'system', monthlySalary: null, onboarded: false },
      transactions: [],
      goals: [{
        id: 'goal-emergency',
        name: 'Emergency fund',
        target: 300_000,
        saved: 0,
        year: 2028,
        auto: 'ef',
        links: [],
      }],
      holdings: [],
      liabilities: [],
      policies: [],
      budget: null,
      budgetTemplates: [],
      defaultBudgetTemplateId: null,
      monthBudgets: [],
      efEntries: [],
      efAllocation: null,
      efCustomBuckets: [],
      efBucketLinks: {},
    });
  });

  it('adds without mutating input and uses the injected id factory', () => {
    const data = base();
    const original = { ...input };
    const next = addTransaction(data, input, () => 'new-id');
    expect(next.transactions).toEqual([{ ...input, id: 'new-id' }]);
    expect(data.transactions).toEqual([]);
    expect(input).toEqual(original);
    expect(next).not.toBe(data);
  });

  it('updates only the selected transaction and preserves untouched data', () => {
    const first = { ...input, id: 'first' };
    const second = { ...input, id: 'second', note: 'Other' };
    const data = base([first, second]);
    const next = updateTransaction(data, 'first', { amount: 250, note: 'Updated' });
    expect(next.transactions).toEqual([{ ...first, amount: 250, note: 'Updated' }, second]);
    expect(data.transactions[0]).toEqual(first);
    expect(next.goals).toEqual(data.goals);
    expect(() => updateTransaction(data, 'missing', { amount: 10 })).toThrow(NotFoundError);
  });

  it('deletes only the requested transaction and reports unknown ids', () => {
    const first = { ...input, id: 'first' };
    const second = { ...input, id: 'second' };
    const data = base([first, second]);
    expect(deleteTransaction(data, 'first').transactions).toEqual([second]);
    expect(data.transactions).toEqual([first, second]);
    expect(() => deleteTransaction(data, 'missing')).toThrow(NotFoundError);
  });

  it('merges settings patches while preserving other preferences and app data', () => {
    const data = { ...base(), settings: { ...emptyAppData('2026-10-10').settings, name: 'A', theme: 'dark' as const } };
    expect(updateSettings(data, { name: 'B' })).toMatchObject({
      settings: { name: 'B', theme: 'dark' },
      goals: data.goals,
    });
  });

  it('completes onboarding with the supplied name, salary, and flag in one immutable result', () => {
    const data = base();
    const completed = completeOnboarding(data, { name: 'Asha', monthlySalary: 80_000 });
    expect(completed.settings).toEqual({
      name: 'Asha', theme: 'system', monthlySalary: 80_000, onboarded: true,
    });
    expect(data.settings.onboarded).toBe(false);
    expect(completeOnboarding(data, { name: '', monthlySalary: null }).settings.onboarded).toBe(true);
  });

  it('confirms a manual holding value without changing the value and rejects other holding ids', () => {
    const holding = {
      id: 'fd-1', kind: 'manual' as const, logs: [], name: 'FD', type: 'Fixed deposit' as const,
      invested: 100_000, value: 105_000, valueAsOf: '2026-01-01',
    };
    const data = { ...base(), holdings: [holding] };
    expect(confirmHoldingValue(data, holding.id, '2026-10-10').holdings).toEqual([
      { ...holding, valueAsOf: '2026-10-10' },
    ]);
    expect(data.holdings).toEqual([holding]);
    expect(() => confirmHoldingValue(data, 'missing', '2026-10-10')).toThrow(NotFoundError);
  });

  it('rejects below-minimum emergency targets without changing data and leaves regular goals unaffected', () => {
    const data = {
      ...base(),
      goals: [
        { id: 'ef', name: 'Emergency fund', target: 300_000, saved: 0, year: 2028, auto: 'ef' as const, links: [] },
        { id: 'trip', name: 'Trip', target: 10_000, saved: 0, year: 2028, links: [] },
      ],
    };
    const before = data;
    expect(() => updateGoal(data, 'ef', { target: 59_999 }, { expenseBaseline: 20_000 }))
      .toThrow(new GoalTargetBelowMinimumError(60_000));
    expect(data).toBe(before);
    expect(updateGoal(data, 'ef', { target: 60_000 }, { expenseBaseline: 20_000 }).goals[0])
      .toMatchObject({ target: 60_000 });
    expect(updateGoal(data, 'trip', { target: 1 }, { expenseBaseline: 20_000 }).goals[1])
      .toMatchObject({ target: 1 });
  });
});
