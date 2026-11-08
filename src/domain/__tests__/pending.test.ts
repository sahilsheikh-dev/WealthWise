import { emptyAppData } from '../actions';
import { availableBalance, monthPositionAt } from '../cashFlow';
import { pendingItems } from '../pending';
import { clearDue, undoClearDue } from '../dues';
import { validateIntegrity } from '../links';
import { monthSummary } from '../transactions';
import type { AppData, OneTimeLiability, PlanHolding, RecurringLiability } from '../types';

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
        templateId: null,
        templateName: null,
        customized: true,
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
          month, templateId: null, templateName: null, customized: true, plannedIncome: null,
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
        month: '2026-05', templateId: null, templateName: null, customized: true,
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
        month: '2026-02', templateId: null, templateName: null, customized: true,
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
});
