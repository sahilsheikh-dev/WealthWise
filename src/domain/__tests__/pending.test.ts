import { emptyAppData } from '../actions';
import { deletePolicy } from '../policyActions';
import { availableBalance, monthPositionAt } from '../cashFlow';
import { budgetMonthView } from '../budget';
import { pendingActionLabel, pendingItems } from '../pending';
import { clearDue, undoClearDue } from '../dues';
import { validateIntegrity } from '../links';
import { monthSummary } from '../transactions';
import type { AppData, OneTimeLiability, PlanHolding, Policy, RecurringLiability } from '../types';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';

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

const policy = (changes: Partial<Policy> = {}): Policy => ({
  id: 'policy',
  name: 'Health cover',
  insurer: 'Insurer',
  kind: 'health',
  premium: 60,
  frequency: 'monthly',
  startDate: '2026-02-05',
  status: 'active',
  premiumYears: 1,
  trackFrom: '2026-02-05',
  currentValue: null,
  valueAsOf: null,
  payments: [],
  ...changes,
});

describe('pending item projection', () => {
  it('excludes a non-recurring fixed deposit plan from pending dues', () => {
    const data = { ...base(), holdings: [plan({ type: 'Fixed deposit' })] };

    expect(pendingItems(data, '2026-02', '2026-02-01')).toEqual([]);
  });

  it('creates recurring budget dues only in due months and clamps the due day', () => {
    const data = {
      ...base(),
      budgetPlan: budgetPlanFromLines([{
        category: 'Quarterly bill',
        mode: 'amount',
        value: 1_200,
        dueDay: 31,
        frequency: 'quarterly',
        firstDueMonth: '2026-04',
      }], {
        incomes: [],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      }),
    };

    expect(pendingItems(data, '2026-04', '2026-03-15')).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: 'Quarterly bill',
        amount: 1_200,
        dueDate: '2026-04-30',
        source: { kind: 'budget', category: 'Quarterly bill', type: 'expense', month: '2026-04' },
      }),
    ]));
    expect(pendingItems(data, '2026-05', '2026-03-15'))
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Quarterly bill' })]));
    expect(pendingItems(data, '2026-07', '2026-03-15')).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Quarterly bill', dueDate: '2026-07-31' }),
    ]));
  });

  it('creates once-only item, income, and policy dues only in their first due month', () => {
    const income = Object.assign({
      id: 'one-time-income',
      name: 'One-time income',
      category: 'Freelance' as const,
      amount: 1_000,
      day: 10,
      frequency: 'monthly' as const,
      firstDueMonth: '2026-03',
    }, { frequency: 'once' });
    const budgetPlan = budgetPlanFromLines([{
      category: 'One-time expense',
      mode: 'amount',
      value: 250,
      dueDay: 15,
      frequency: 'monthly',
      firstDueMonth: '2026-03',
    }], {
      incomes: [income],
      repeatMonthly: true,
      repeatFrom: '2026-03',
    });
    const item = budgetPlan.items[0];
    if (!item) throw new Error('Once-only Budget item fixture is missing.');
    Object.assign(item, { frequency: 'once' });
    const oncePolicy = policy({ name: 'One-time premium', trackFrom: '2026-03-20' });
    Object.assign(oncePolicy, { frequency: 'once' });
    const data = { ...base(), budgetPlan, policies: [oncePolicy] };

    expect(pendingItems(data, '2026-03', '2026-03-01')).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'One-time expense', dueDate: '2026-03-15' }),
      expect.objectContaining({ title: 'One-time income', dueDate: '2026-03-10' }),
      expect.objectContaining({ title: 'One-time premium', dueDate: '2026-03-20' }),
    ]));
    expect(pendingItems(data, '2026-04', '2026-03-01')).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'One-time expense' }),
      expect.objectContaining({ title: 'One-time income' }),
      expect.objectContaining({ title: 'One-time premium' }),
    ]));
  });

  it('creates clamped income dues, allocates recorded earnings across same-category items, and supports future months', () => {
    const data = {
      ...base(),
      budgetPlan: budgetPlanFromLines([], {
        incomes: [
          { id: 'salary-1', name: 'Salary', category: 'Salary' as const, amount: 1_000, day: 31 },
          { id: 'salary-2', name: 'Bonus', category: 'Salary' as const, amount: 500, day: 15 },
        ],
        repeatMonthly: true,
        repeatFrom: '2026-02',
      }),
      monthBudgets: [monthBudgetFromLines('2026-02', [], {
        incomes: [
          { id: 'salary-1', name: 'Salary', category: 'Salary' as const, amount: 1_000, day: 31 },
          { id: 'salary-2', name: 'Bonus', category: 'Salary' as const, amount: 500, day: 15 },
        ],
        source: 'plan',
        linkedIncluded: true,
      })],
    };
    const future = pendingItems(data, '2026-02', '2026-01-20');
    expect(future.filter((item) => item.source.kind === 'income')).toEqual([
      expect.objectContaining({
        title: 'Bonus', category: 'Salary', amount: 500,
        dueDate: '2026-02-15', status: 'upcoming',
      }),
      expect.objectContaining({
        title: 'Salary', category: 'Salary', amount: 1_000,
        dueDate: '2026-02-28', status: 'upcoming',
      }),
    ]);
    data.transactions.push({
      id: 'partial-income', type: 'income', amount: 1_200, category: 'Salary',
      note: '', date: '2026-02-03',
    });
    expect(pendingItems(data, '2026-02', '2026-02-05')
      .filter((item) => item.source.kind === 'income')
      .map((item) => [item.title, item.amount]))
      .toEqual([['Bonus', 300]]);
    data.transactions.push({
      id: 'remaining-income', type: 'income', amount: 300, category: 'Salary',
      note: '', date: '2026-02-04',
    });
    expect(pendingItems(data, '2026-02', '2026-02-05')
      .some((item) => item.source.kind === 'income')).toBe(false);
  });

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

  it('projects active policy dues with their typed insurance category and excludes inactive policies', () => {
    const data = {
      ...base(),
      policies: [
        policy(),
        policy({ id: 'lapsed-policy', kind: 'motor', status: 'lapsed' }),
      ],
    };
    const rows = pendingItems(data, '2026-02', '2026-02-15')
      .filter((item) => item.source.kind === 'policy');
    expect(rows).toEqual([
      expect.objectContaining({
        title: 'Health cover',
        category: 'Health premium',
        amount: 60,
        dueDate: '2026-02-05',
        source: { kind: 'policy', parentId: 'policy', slotId: 'policy:0' },
      }),
    ]);
  });

  it('creates an upcoming premium due on the selected date in its month', () => {
    const due = pendingItems({
      ...base(),
      policies: [policy({
        startDate: '2026-01-01',
        trackFrom: '2026-02-22',
        endDate: '2026-03-31',
      })],
    }, '2026-02', '2026-02-15').filter((item) => item.source.kind === 'policy');
    expect(due).toEqual([
      expect.objectContaining({
        title: 'Health cover',
        category: 'Health premium',
        amount: 60,
        dueDate: '2026-02-22',
        status: 'upcoming',
      }),
    ]);
  });

  it('projects savings-policy dues under the generic insurance category', () => {
    const data = base();
    const rows = pendingItems({
      ...data,
      policies: [policy({ kind: 'life-savings' })],
    }, '2026-02', '2026-02-15').filter((item) => item.source.kind === 'policy');
    expect(rows).toEqual([
      expect.objectContaining({ category: 'Insurance premium' }),
    ]);
  });

  it('removes pending premium dues when a policy is deleted', () => {
    const data = {
      ...base(),
      policies: [policy()],
    };
    expect(pendingItems(data, '2026-02', '2026-02-15')
      .some((item) => item.source.kind === 'policy')).toBe(true);
    const deleted = deletePolicy(data, { id: 'policy' });
    expect(pendingItems(deleted, '2026-02', '2026-02-15')
      .some((item) => item.source.kind === 'policy')).toBe(false);
  });

  it('projects remaining budget lines once and suppresses commitments and represented investment dues', () => {
    const data: AppData = {
      ...base(),
      holdings: [plan()],
      monthBudgets: [monthBudgetFromLines('2026-02', [
        { category: 'Food', planned: 300 },
        { category: 'Fashion', planned: 250 },
        { category: 'EMI', planned: 400 },
        { category: 'Insurance', planned: 100 },
        { category: 'Mutual fund / SIP', planned: 500 },
      ], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 10_000 }],
      })],
      transactions: [
        { id: 'food', type: 'expense', amount: 100, category: 'Food', note: '', date: '2026-02-04' },
        { id: 'fashion', type: 'expense', amount: 250, category: 'Fashion', note: '', date: '2026-02-05' },
      ],
    };
    const rows = pendingItems(data, '2026-02', '2026-02-15');
    expect(rows.filter((row) => row.kind === 'budget')).toEqual([
      expect.objectContaining({ title: 'Food', amount: 200, status: 'planned', actionable: true }),
      expect.objectContaining({ title: 'Insurance', amount: 100, status: 'planned', actionable: true }),
    ]);
    expect(rows.find((row) => row.title === 'Food')).not.toHaveProperty('dueDate');
  });

  it('does not duplicate a linked plan due and counts its linked transaction once', () => {
    const snapshot = monthBudgetFromLines('2026-02', [
      { category: 'Mutual fund / SIP', planned: 100 },
    ], { incomes: [] });
    const snapshotItem = snapshot.items[0];
    if (!snapshotItem) throw new Error('Linked plan budget fixture is missing.');
    snapshot.items = [{ ...snapshotItem, holdingId: 'plan' }];
    const data: AppData = {
      ...base(),
      holdings: [plan({
        startDate: '2026-02-01',
        trackFrom: '2026-02-01',
      })],
      monthBudgets: [snapshot],
    };

    const unpaidRows = pendingItems(data, '2026-02', '2026-02-15');
    expect(unpaidRows).toHaveLength(1);
    expect(unpaidRows[0]).toMatchObject({
      kind: 'due',
      title: 'Monthly SIP',
      source: { kind: 'plan', parentId: 'plan' },
    });

    const entry = {
      id: 'feb-deposit',
      date: '2026-02-01',
      amount: 100,
      note: '',
      kind: 'Deposit' as const,
    };
    const paidData: AppData = {
      ...data,
      holdings: [plan({
        startDate: '2026-02-01',
        trackFrom: '2026-02-01',
        logs: [entry],
      })],
      transactions: [{
        id: 'linked-deposit',
        type: 'invest',
        amount: 100,
        category: 'Mutual fund / SIP',
        note: 'Monthly SIP deposit',
        date: '2026-02-01',
        source: { kind: 'holding-entry', parentId: 'plan', entryId: entry.id },
      }],
    };
    expect(pendingItems(paidData, '2026-02', '2026-02-15')).toEqual([]);
    expect(budgetMonthView(paidData, '2026-02').lines).toContainEqual(expect.objectContaining({
      category: 'Mutual fund / SIP',
      planned: 100,
      actual: 100,
      remaining: 0,
    }));
  });

  it.each(['Savings account', 'Cash', 'Other'] as const)(
    'keeps an explicitly linked manual %s budget row and exposes its month and holding',
    (type) => {
      const snapshot = monthBudgetFromLines('2026-02', [
        { category: 'Other investments', planned: 100 },
      ], {
        incomes: [],
        sections: [{ id: 'investments', name: 'Investments', type: 'invest' }],
      });
      const snapshotItem = snapshot.items[0];
      if (!snapshotItem) throw new Error('Manual holding budget fixture is missing.');
      snapshot.items = [{
        ...snapshotItem,
        sectionId: 'investments',
        holdingId: 'manual-holding',
      }];
      const data: AppData = {
        ...base(),
        holdings: [{
          id: 'manual-holding',
          kind: 'manual',
          name: 'Savings reserve',
          type,
          invested: 1_000,
          value: 1_000,
          valueAsOf: '2026-02-01',
          logs: [],
        }],
        monthBudgets: [snapshot],
      };

      expect(pendingItems(data, '2026-02', '2026-02-15')).toContainEqual(
        expect.objectContaining({
          kind: 'budget',
          category: 'Other investments',
          source: {
            kind: 'budget',
            category: 'Other investments',
            type: 'invest',
            month: '2026-02',
            holdingId: 'manual-holding',
          },
        }),
      );
    },
  );

  it('carries a plan-only holding link into a virtual future-month Budget row', () => {
    const data: AppData = {
      ...base(),
      holdings: [{
        id: 'manual-savings',
        kind: 'manual',
        name: 'Savings reserve',
        type: 'Savings account',
        invested: 1_000,
        value: 1_000,
        valueAsOf: '2026-03-01',
        logs: [],
      }],
      budgetPlan: {
        incomes: [],
        sections: [{ id: 'investments', name: 'Investments', type: 'invest' }],
        repeatMonthly: true,
        repeatFrom: '2026-02',
        items: [{
          id: 'savings-item',
          sectionId: 'investments',
          name: 'Emergency savings',
          mode: 'amount',
          value: 100,
          dueDay: 10,
          frequency: 'monthly',
          firstDueMonth: '2026-02',
          holdingId: 'manual-savings',
        }],
      },
    };

    expect(pendingItems(data, '2026-04', '2026-03-15')).toContainEqual(
      expect.objectContaining({
        kind: 'budget',
        amount: 100,
        dueDate: '2026-04-10',
        source: {
          kind: 'budget',
          category: 'Emergency savings',
          type: 'invest',
          month: '2026-04',
          holdingId: 'manual-savings',
        },
      }),
    );
  });

  it('does not duplicate an active policy due with a manual budget line in the same typed category', () => {
    const data: AppData = {
      ...base(),
      policies: [policy()],
      monthBudgets: [monthBudgetFromLines('2026-02', [
        { category: 'Health premium', planned: 100, dueDay: 20 },
      ], {
        incomes: [],
        linkedIncluded: true,
      })],
    };
    const rows = pendingItems(data, '2026-02', '2026-02-15');
    expect(rows.filter((row) => row.category === 'Health premium')).toEqual([
      expect.objectContaining({
        kind: 'due',
        title: 'Health cover',
        amount: 60,
        source: { kind: 'policy', parentId: 'policy', slotId: 'policy:0' },
      }),
    ]);
  });

  it('clamps budget due days to the month length, including leap February', () => {
    const dueOnLastDay = (month: string, today: string) => {
      const data = {
        ...base(),
        monthBudgets: [monthBudgetFromLines(month, [{ category: 'Bills', planned: 100, dueDay: 31 }], { incomes: [] })],
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
      monthBudgets: [monthBudgetFromLines('2026-05', [{ category: 'Bills', planned: 100, dueDay: 5 }], { incomes: [] })],
    };
    expect(pendingItems(earlyDue, '2026-05', '2026-05-06').find((item) => item.kind === 'budget'))
      .toMatchObject({ dueDate: '2026-05-05', status: 'overdue' });
  });

  it('does not add pending projections to month totals or the available balance', () => {
    const data: AppData = {
      ...base(),
      holdings: [plan()],
      liabilities: [oneTime()],
      monthBudgets: [monthBudgetFromLines('2026-02', [{ category: 'Food', planned: 500 }], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 1_000 }],
      })],
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

});
