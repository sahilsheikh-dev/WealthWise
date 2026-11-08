import { emptyAppData } from '../actions';
import { availableBalance, monthPositionAt } from '../cashFlow';
import { budgetGroupRows, pendingActionLabel, pendingItems } from '../pending';
import { clearDue, undoClearDue } from '../dues';
import { validateIntegrity } from '../links';
import { monthSummary } from '../transactions';
import type { AppData, OneTimeLiability, PlanHolding, Policy, RecurringLiability } from '../types';

const base = () => emptyAppData('2026-01-01');

const plan = (changes: Partial<PlanHolding> = {}): PlanHolding => ({
  id: 'plan',
  kind: 'plan',
  name: 'Monthly SIP',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 100,
  ratePct: 0,
  stepUpPct: 0,
  tenureYears: 1,
  startDate: '2026-01-01',
  trackFrom: '2026-02-01',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
  logs: [],
  ...changes,
});

const liability = (changes: Partial<RecurringLiability> = {}): RecurringLiability => ({
  id: 'liability',
  kind: 'recurring',
  name: 'Car loan',
  type: 'Car loan',
  principal: 1_200,
  ratePct: 0,
  startDate: '2026-01-01',
  tenureMonths: 12,
  emi: 100,
  payments: [],
  settlement: null,
  ...changes,
});

const oneTime = (changes: Partial<OneTimeLiability> = {}): OneTimeLiability => ({
  id: 'friend',
  kind: 'one-time',
  name: 'Friend',
  type: 'Borrowed money',
  principal: 200,
  ratePct: 0,
  startDate: '2026-01-01',
  dueDate: '2026-02-15',
  payments: [],
  ...changes,
});

describe('pending item projection', () => {
  it('uses Paid wording for expense/investment rows and Received for income rows', () => {
    expect(pendingActionLabel('expense')).toBe('Marked as paid');
    expect(pendingActionLabel('invest')).toBe('Marked as paid');
    expect(pendingActionLabel('income')).toBe('Received');
  });

  it('places unpaid schedule slots into past, current, and future months with FIFO actions', () => {
    const data = {
      ...base(),
      holdings: [plan({ trackFrom: '2026-01-01' })],
      liabilities: [liability(), oneTime()],
    };

    expect(pendingItems(data, '2026-01', '2026-02-15')).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Monthly SIP', dueDate: '2026-01-01', status: 'overdue', actionable: true }),
    ]));
    expect(pendingItems(data, '2026-02', '2026-02-15')).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'due', title: 'Monthly SIP', category: 'Mutual fund / SIP',
        dueDate: '2026-02-01', amount: 100, status: 'overdue', actionable: false,
      }),
      expect.objectContaining({
        kind: 'due', title: 'Car loan', category: 'EMI',
        dueDate: '2026-02-01', status: 'overdue', actionable: true,
      }),
      expect.objectContaining({
        kind: 'due', title: 'Friend', dueDate: '2026-02-15', status: 'due-today', amount: 200,
      }),
    ]));
    expect(pendingItems(data, '2026-03', '2026-02-15')).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Monthly SIP', dueDate: '2026-03-01', status: 'upcoming', actionable: false }),
      expect.objectContaining({ title: 'Car loan', dueDate: '2026-03-01', status: 'upcoming', actionable: false }),
    ]));

    const fifoData = {
      ...data,
      holdings: [plan({
        trackFrom: '2026-02-01',
      })],
    };
    expect(pendingItems(fifoData, '2026-02', '2026-02-15')
      .find((item) => item.source.kind === 'plan')).toMatchObject({ actionable: true });
    const withHistory = {
      ...fifoData,
      holdings: [plan({
        trackFrom: '2026-02-01',
        logs: [{ id: 'feb-deposit', date: '2026-02-15', amount: 100, note: '', kind: 'Deposit' }],
      })],
    };
    expect(pendingItems(withHistory, '2026-03', '2026-02-15')
      .find((item) => item.source.kind === 'plan')).toMatchObject({ actionable: true });
  });

  it('projects remaining budget lines once and suppresses commitments and represented investment dues', () => {
    const data: AppData = {
      ...base(),
      holdings: [plan()],
      monthBudgets: [{
        month: '2026-02',
        source: 'custom' as const,
        plannedIncome: 10_000,
        lines: [
          { category: 'Food', planned: 300 },
          { category: 'Fashion', planned: 250 },
          { category: 'EMI', planned: 400 },
          { category: 'Insurance', planned: 100 },
          { category: 'Mutual fund / SIP', planned: 500 },
        ],
      }],
      transactions: [
        { id: 'food', type: 'expense', amount: 100, category: 'Food', note: '', date: '2026-02-04' },
        { id: 'fashion', type: 'expense', amount: 250, category: 'Fashion', note: '', date: '2026-02-05' },
      ],
    };
    const rows = pendingItems(data, '2026-02', '2026-02-15');
    expect(rows.filter((row) => row.kind === 'budget')).toEqual([
      expect.objectContaining({ title: 'Food', amount: 200, status: 'planned', actionable: true }),
    ]);
    expect(rows.find((row) => row.title === 'Food')).not.toHaveProperty('dueDate');
  });

  it('clamps budget due days to the month length, including leap February', () => {
    const dueOnLastDay = (month: string, today: string) => {
      const data = {
        ...base(),
        monthBudgets: [{
          month, source: 'custom' as const, plannedIncome: null,
          lines: [{ category: 'Bills', planned: 100, dueDay: 31 }],
        }],
      };
      return pendingItems(data, month, today).find((item) => item.kind === 'budget');
    };

    expect(dueOnLastDay('2025-02', '2025-02-01')).toMatchObject({
      dueDate: '2025-02-28', status: 'upcoming',
    });
    expect(dueOnLastDay('2024-02', '2024-02-01')).toMatchObject({
      dueDate: '2024-02-29', status: 'upcoming',
    });
    expect(dueOnLastDay('2026-04', '2026-04-01')).toMatchObject({
      dueDate: '2026-04-30', status: 'upcoming',
    });
    const earlyDue = {
      ...base(),
      monthBudgets: [{
        month: '2026-05', source: 'custom' as const,
        plannedIncome: null, lines: [{ category: 'Bills', planned: 100, dueDay: 5 }],
      }],
    };
    expect(pendingItems(earlyDue, '2026-05', '2026-05-06').find((item) => item.kind === 'budget'))
      .toMatchObject({ dueDate: '2026-05-05', status: 'overdue' });
  });

  it('does not add pending projections to month totals or the available balance', () => {
    const data: AppData = {
      ...base(),
      holdings: [plan()],
      liabilities: [oneTime()],
      monthBudgets: [{
        month: '2026-02', source: 'custom' as const,
        plannedIncome: 1_000, lines: [{ category: 'Food', planned: 500 }],
      }],
      transactions: [
        { id: 'salary', type: 'income', amount: 1_000, category: 'Salary', note: '', date: '2026-02-01' },
        { id: 'food', type: 'expense', amount: 100, category: 'Food', note: '', date: '2026-02-02' },
      ],
    };
    const summaryBefore = monthSummary(data.transactions, '2026-02');
    const positionBefore = monthPositionAt(data.transactions, '2026-02');
    const availableBefore = availableBalance(data.transactions, '2026-02', '2026-02-15');

    expect(pendingItems(data, '2026-02', '2026-02-15').length).toBeGreaterThan(0);
    expect(monthSummary(data.transactions, '2026-02')).toEqual(summaryBefore);
    expect(monthPositionAt(data.transactions, '2026-02')).toEqual(positionBefore);
    expect(availableBalance(data.transactions, '2026-02', '2026-02-15')).toEqual(availableBefore);
  });

  it('clears the oldest projected due with a linked transaction and restores it on undo', () => {
    const data = { ...base(), holdings: [plan({ trackFrom: '2026-02-01' })] };
    const pending = pendingItems(data, '2026-02', '2026-02-15')
      .find((item) => item.source.kind === 'plan');
    if (!pending || pending.source.kind !== 'plan') throw new Error('Expected an actionable plan due.');
    let id = 0;
    const cleared = clearDue(data, { kind: 'plan', id: pending.source.parentId }, {
      date: '2026-02-15',
      rowId: pending.source.slotId,
      newId: () => `cleared-${++id}`,
    });

    expect(cleared.data.transactions).toEqual([
      expect.objectContaining({
        type: 'invest',
        amount: pending.amount,
        source: { kind: 'holding-entry', parentId: 'plan', entryId: 'cleared-1' },
      }),
    ]);
    expect(validateIntegrity(cleared.data)).toEqual([]);
    expect(pendingItems(cleared.data, '2026-02', '2026-02-15')
      .some((item) => item.id === pending.id)).toBe(false);
    expect(undoClearDue(cleared.data, { kind: 'plan', id: 'plan' }, cleared.entryId)).toEqual(data);
  });

  it('projects 400 due rows without imposing a result cap', () => {
    const liabilities: OneTimeLiability[] = Array.from({ length: 400 }, (_, index) => oneTime({
      id: `friend-${index}`,
      name: `Friend ${index}`,
    }));
    const started = Date.now();
    const rows = pendingItems({ ...base(), liabilities }, '2026-02', '2026-02-15');
    const elapsed = Date.now() - started;

    expect(rows).toHaveLength(400);
    expect(elapsed).toBeLessThan(1_000);
  });

  it('rejects an invalid month and excludes one-time liabilities without due dates', () => {
    expect(() => pendingItems(base(), '2026-13', '2026-02-15')).toThrow('Invalid month key');
    expect(pendingItems({ ...base(), liabilities: [oneTime({ dueDate: null })] }, '2026-02', '2026-02-15'))
      .toEqual([]);
  });

  it('projects paid, partial, overdue, and linked rows once in due-date order', () => {
    const month = '2026-02';
    const today = '2026-02-15';
    const sip = plan({
      startDate: '2026-02-05',
      trackFrom: '2026-02-05',
      logs: [{ id: 'sip-paid', date: '2026-02-05', amount: 100, note: '', kind: 'Deposit' }],
    });
    const emi = liability({ startDate: '2026-01-01' });
    const policy: Policy = {
      id: 'policy',
      name: 'Health cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 80,
      frequency: 'monthly',
      startDate: '2026-02-06',
      premiumYears: 1,
      trackFrom: '2026-02-01',
      coverAmount: null,
      currentValue: null,
      valueAsOf: null,
      maturityDate: null,
      payments: [{ id: 'policy-paid', date: '2026-02-06', amount: 80, note: '' }],
    };
    const data: AppData = {
      ...base(),
      holdings: [sip],
      liabilities: [emi],
      policies: [policy],
      monthBudgets: [{
        month,
        source: 'custom',
        plannedIncome: 2_000,
        linkedIncluded: true,
        lines: [
          { category: 'Bills', planned: 120, dueDay: 5 },
          { category: 'Food', planned: 100 },
          { category: 'Shopping', planned: 200 },
        ],
      }],
      transactions: [
        {
          id: 'sip-tx', type: 'invest', amount: 100, category: 'Mutual fund / SIP', note: '',
          date: '2026-02-05', source: { kind: 'holding-entry', parentId: sip.id, entryId: 'sip-paid' },
        },
        { id: 'food-tx', type: 'expense', amount: 25, category: 'Food', note: '', date: '2026-02-10' },
        { id: 'shopping-tx', type: 'expense', amount: 200, category: 'Shopping', note: '', date: '2026-02-11' },
        {
          id: 'policy-tx', type: 'expense', amount: 80, category: 'Insurance', note: '',
          date: '2026-02-06', source: { kind: 'policy-payment', parentId: policy.id, entryId: 'policy-paid' },
        },
      ],
    };

    const rows = budgetGroupRows(data, month, today);
    expect(rows.map((row) => row.id)).toEqual([...rows]
      .sort((left, right) => (left.dueDate ?? '9999-12-31').localeCompare(right.dueDate ?? '9999-12-31')
        || left.title.localeCompare(right.title)
        || left.id.localeCompare(right.id))
      .map((row) => row.id));
    expect(rows.filter((row) => row.id === `budget:${month}:Bills`)).toMatchObject([{
      dueDate: '2026-02-05',
      status: 'overdue',
      plannedAmount: 120,
      actualAmount: 0,
      amount: 120,
    }]);
    expect(rows.find((row) => row.id === `budget:${month}:Food`)).toMatchObject({
      status: 'planned', plannedAmount: 100, actualAmount: 25, amount: 75,
    });
    expect(rows.find((row) => row.id === `budget:${month}:Food`)).not.toHaveProperty('dueDate');
    expect(rows.find((row) => row.id === `budget:${month}:Shopping`)).toMatchObject({
      status: 'paid', plannedAmount: 200, actualAmount: 200, amount: 0, actionable: false,
    });
    expect(rows.find((row) => row.source.kind === 'plan')).toMatchObject({
      category: 'Mutual fund / SIP', status: 'paid', actualAmount: 100, automatic: true,
    });
    expect(rows.find((row) => row.source.kind === 'liability')).toMatchObject({
      category: 'EMI', status: 'overdue', amount: 100, automatic: true,
    });
    expect(rows.find((row) => row.source.kind === 'policy')).toMatchObject({
      category: 'Insurance', status: 'paid', actualAmount: 80, automatic: true,
    });
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it('shows the paid amount for a scheduled row cleared after its due month', () => {
    const holding = plan({
      startDate: '2026-01-05',
      trackFrom: '2026-01-05',
      logs: [{ id: 'late-deposit', date: '2026-02-15', amount: 100, note: '', kind: 'Deposit' }],
    });
    const data: AppData = {
      ...base(),
      holdings: [holding],
      transactions: [{
        id: 'late-deposit-transaction',
        type: 'invest',
        amount: 100,
        category: 'Mutual fund / SIP',
        note: '',
        date: '2026-02-15',
        source: { kind: 'holding-entry', parentId: holding.id, entryId: 'late-deposit' },
      }],
    };

    expect(budgetGroupRows(data, '2026-01', '2026-02-15')).toContainEqual(expect.objectContaining({
      category: 'Mutual fund / SIP',
      status: 'paid',
      plannedAmount: 100,
      actualAmount: 100,
      actionable: false,
    }));
  });
});
