import { emptyAppData } from '../actions';
import { planReminders, type ReminderPreferences } from '../reminders';
import type {
  AppData,
  ManualHolding,
  OneTimeLiability,
  PlanHolding,
  Policy,
  RecurringLiability,
} from '../types';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';

const preferences: ReminderPreferences & { hidePreviews: boolean } = {
  enabled: true,
  localTime: '09:00',
  dayBefore: true,
  sameDay: true,
  showAmounts: false,
  hidePreviews: false,
};

function oneTimeLiability(changes: Partial<OneTimeLiability> = {}): OneTimeLiability {
  return {
    id: 'one-time',
    kind: 'one-time',
    name: 'Rent',
    type: 'Other',
    principal: 200,
    ratePct: 0,
    startDate: '2024-02-01',
    dueDate: '2024-02-12',
    payments: [],
    ...changes,
  };
}

function dataWithLiabilities(...liabilities: OneTimeLiability[]): AppData {
  return { ...emptyAppData('2024-02-01'), liabilities };
}

function plannedHolding(changes: Partial<PlanHolding> = {}): PlanHolding {
  return {
    id: 'plan',
    kind: 'plan',
    name: 'Monthly SIP',
    type: 'Mutual fund / SIP',
    frequency: 'monthly',
    amount: 100,
    ratePct: 0,
    stepUpPct: 0,
    tenureYears: 1,
    startDate: '2024-02-02',
    trackFrom: '2024-02-02',
    opening: 0,
    actualValue: null,
    actualValueDate: null,
    logs: [],
    ...changes,
  };
}

describe('reminder planner', () => {
  it('does not plan reminders for a fixed deposit with legacy schedule fields', () => {
    const data = {
      ...emptyAppData('2024-02-01'),
      holdings: [plannedHolding({ type: 'Fixed deposit', tenureYears: 20 })],
    };

    expect(planReminders(data, preferences, new Date(2024, 1, 1, 8), 60))
      .toEqual([]);
  });

  it('includes unpaid plans, recurring liabilities, active policies, and skips manual or inactive sources', () => {
    const manual: ManualHolding = {
      id: 'manual',
      kind: 'manual',
      name: 'Savings',
      type: 'Savings account',
      invested: 100,
      value: 100,
      logs: [],
    };
    const recurring: RecurringLiability = {
      id: 'recurring',
      kind: 'recurring',
      name: 'Monthly loan',
      type: 'Home loan',
      principal: 1_200,
      ratePct: 0,
      startDate: '2024-02-01',
      tenureMonths: 12,
      emi: 100,
      payments: [],
      settlement: null,
    };
    const policy: Policy = {
      id: 'policy',
      name: 'Active policy',
      insurer: 'Insurer',
      kind: 'health',
      premium: 50,
      frequency: 'monthly',
      startDate: '2024-02-04',
      status: 'active',
      premiumYears: 1,
      trackFrom: '2024-02-04',
      currentValue: null,
      valueAsOf: null,
      payments: [],
    };
    const expiredPolicy: Policy = {
      ...policy,
      id: 'ended-policy',
      name: 'Ended policy',
      endDate: '2024-05-01',
      startDate: '2024-02-06',
      status: 'lapsed',
      trackFrom: '2024-02-06',
    };
    const reminders = planReminders({
      ...emptyAppData('2024-02-01'),
      holdings: [manual, plannedHolding()],
      liabilities: [recurring],
      policies: [policy, expiredPolicy],
    }, preferences, new Date(2024, 1, 1, 8), 60);
    expect(reminders.some((item) => item.dueItemId.startsWith('due:plan:plan:'))).toBe(true);
    expect(reminders.some((item) => item.dueItemId.startsWith('due:liability:recurring:'))).toBe(true);
    expect(reminders.some((item) => item.dueItemId.startsWith('due:policy:policy:'))).toBe(true);
    expect(reminders.some((item) => item.dueItemId.includes('ended-policy'))).toBe(false);
    expect(reminders.some((item) => item.dueItemId.includes('manual'))).toBe(false);
  });

  it('plans a reminder for a premium due the following week', () => {
    const policy: Policy = {
      id: 'next-week-policy',
      name: 'Next week policy',
      insurer: 'Insurer',
      kind: 'health',
      premium: 50,
      frequency: 'monthly',
      startDate: '2026-10-01',
      status: 'active',
      premiumYears: 1,
      trackFrom: '2026-10-23',
      endDate: '2026-12-31',
      currentValue: null,
      valueAsOf: null,
      payments: [],
    };
    const reminders = planReminders({
      ...emptyAppData('2026-10-16'),
      policies: [policy],
    }, preferences, new Date(2026, 9, 16, 8), 60);
    expect(reminders).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'day-before',
        dueItemId: 'due:policy:next-week-policy:policy:0',
        target: expect.objectContaining({ dueDate: '2026-10-23' }),
      }),
      expect.objectContaining({
        kind: 'same-day',
        dueItemId: 'due:policy:next-week-policy:policy:0',
        target: expect.objectContaining({ dueDate: '2026-10-23' }),
      }),
    ]));
    expect(reminders).toHaveLength(6);
  });

  it('schedules a once-only insurance premium reminder once', () => {
    const policy: Policy = {
      id: 'one-time-policy',
      name: 'One-time premium',
      insurer: 'Insurer',
      kind: 'health',
      premium: 50,
      frequency: 'monthly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 1,
      trackFrom: '2026-02-15',
      currentValue: null,
      valueAsOf: null,
      payments: [],
    };
    Object.assign(policy, { frequency: 'once' });
    const reminders = planReminders({
      ...emptyAppData('2026-02-01'),
      policies: [policy],
    }, preferences, new Date(2026, 1, 1, 8), 60);

    expect(reminders.filter((reminder) => reminder.dueItemId.includes('one-time-policy'))).toEqual([
      expect.objectContaining({
        kind: 'day-before',
        fireAt: '2026-02-14T09:00',
        target: expect.objectContaining({ dueDate: '2026-02-15' }),
      }),
      expect.objectContaining({
        kind: 'same-day',
        fireAt: '2026-02-15T09:00',
        target: expect.objectContaining({ dueDate: '2026-02-15' }),
      }),
    ]);
  });

  it('plans the day before and same-day local times with deterministic targets', () => {
    const data = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-03-01' }));
    const reminders = planReminders(data, preferences, new Date(2024, 1, 28, 8), 60);
    expect(reminders).toEqual([
      expect.objectContaining({
        dueItemId: 'due:liability:one-time:liability:one-time',
        kind: 'day-before',
        fireAt: '2024-02-29T09:00',
        target: {
          dueItemId: 'due:liability:one-time:liability:one-time',
          dueDate: '2024-03-01',
        },
      }),
      expect.objectContaining({
        dueItemId: 'due:liability:one-time:liability:one-time',
        kind: 'same-day',
        fireAt: '2024-03-01T09:00',
      }),
    ]);
  });

  it('uses clamped leap-day, quarterly, and yearly budget due dates', () => {
    const lines = [
      { category: 'Quarterly bill', value: 120, dueDay: 31, frequency: 'quarterly' as const, firstDueMonth: '2024-02' },
      { category: 'Yearly bill', value: 360, dueDay: 31, frequency: 'yearly' as const, firstDueMonth: '2024-02' },
    ];
    const budgetPlan = budgetPlanFromLines(lines, {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: '2024-02',
    });
    const data: AppData = {
      ...emptyAppData('2024-02-01'),
      budgetPlan,
      monthBudgets: [monthBudgetFromLines('2024-02', lines, {
        incomes: [],
        sections: budgetPlan.sections,
      })],
    };

    const reminders = planReminders(data, preferences, new Date(2024, 1, 1, 8), 100);
    expect(reminders).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: expect.objectContaining({ dueDate: '2024-02-29' }) }),
      expect.objectContaining({ target: expect.objectContaining({ dueDate: '2024-05-31' }) }),
      expect.objectContaining({ target: expect.objectContaining({ dueDate: '2025-02-28' }) }),
    ]));
  });

  it('plans income Received dues from the budget', () => {
    const data: AppData = {
      ...emptyAppData('2024-02-01'),
      monthBudgets: [{
        ...monthBudgetFromLines('2024-02', [], {
          incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 1_000, day: 15 }],
        }),
      }],
    };
    const reminders = planReminders(data, preferences, new Date(2024, 1, 1, 8), 10);
    expect(reminders[0]).toEqual(expect.objectContaining({
      dueItemId: 'income:2024-02:salary',
      fireAt: '2024-02-14T09:00',
      target: { dueItemId: 'income:2024-02:salary', dueDate: '2024-02-15' },
    }));
  });

  it('extends the search horizon for a future saved month budget', () => {
    const data: AppData = {
      ...emptyAppData('2024-02-01'),
      monthBudgets: [monthBudgetFromLines('2029-01', [{
        category: 'Future custom due',
        value: 300,
        dueDay: 2,
      }], { incomes: [] })],
    };
    const reminders = planReminders(data, preferences, new Date(2024, 1, 1, 8), 2);
    expect(reminders).toHaveLength(2);
    expect(reminders[0]?.target.dueDate).toBe('2029-01-02');
  });

  it('does not expose names or amounts when hide-previews is enabled', () => {
    const reminders = planReminders(
      dataWithLiabilities(oneTimeLiability({ dueDate: '2024-02-02' })),
      { ...preferences, showAmounts: true, hidePreviews: true },
      new Date(2024, 1, 1, 8),
      10,
    );
    expect(reminders).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: 'Wealth Wise',
        body: 'A payment is due tomorrow',
        fireAt: '2024-02-01T09:00',
      }),
      expect.objectContaining({
        title: 'Wealth Wise',
        body: 'A payment is due today',
        fireAt: '2024-02-02T09:00',
      }),
    ]));
    expect(JSON.stringify(reminders)).not.toContain('Rent');
    expect(JSON.stringify(reminders)).not.toContain('₹');
  });

  it('includes amounts only when enabled', () => {
    const data = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-02-02' }));
    expect(planReminders(data, preferences, new Date(2024, 1, 1, 8), 10).map((item) => item.body))
      .toEqual(['Due tomorrow', 'Due today']);
    expect(planReminders(
      data,
      { ...preferences, showAmounts: true },
      new Date(2024, 1, 1, 8),
      10,
    ).map((item) => item.body)).toEqual(['Due tomorrow · ₹200', 'Due today · ₹200']);
  });

  it('skips reminders whose fire time has passed and schedules tomorrow when it has not', () => {
    const dueTomorrow = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-02-02' }));
    expect(planReminders(dueTomorrow, preferences, new Date(2024, 1, 1, 8), 10))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'day-before', fireAt: '2024-02-01T09:00' }),
        expect.objectContaining({ kind: 'same-day', fireAt: '2024-02-02T09:00' }),
      ]));

    const dueToday = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-02-01' }));
    expect(planReminders(dueToday, preferences, new Date(2024, 1, 1, 10), 10)).toEqual([]);
    const pastDue = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-01-31' }));
    expect(planReminders(pastDue, preferences, new Date(2024, 1, 1, 8), 10)).toEqual([]);
  });

  it('excludes paid and undated items', () => {
    const paid = oneTimeLiability({
      payments: [{ id: 'payment', date: '2024-02-01', amount: 200, note: '', kind: 'Payment' }],
    });
    const undated = oneTimeLiability({ id: 'undated', dueDate: null });
    expect(planReminders(
      dataWithLiabilities(paid, undated),
      preferences,
      new Date(2024, 1, 1, 8),
      10,
    )).toEqual([]);
  });

  it('sorts nearest first, applies the cap, and is deterministic', () => {
    const data = dataWithLiabilities(
      oneTimeLiability({ id: 'later', name: 'Later', dueDate: '2024-02-12' }),
      oneTimeLiability({ id: 'near', name: 'Near', dueDate: '2024-02-10' }),
      oneTimeLiability({ id: 'middle', name: 'Middle', dueDate: '2024-02-11' }),
    );
    const now = new Date(2024, 1, 1, 8);
    const first = planReminders(data, preferences, now, 3);
    expect(first).toHaveLength(3);
    expect(first.map((item) => item.fireAt)).toEqual([
      '2024-02-09T09:00',
      '2024-02-10T09:00',
      '2024-02-10T09:00',
    ]);
    expect(planReminders(data, preferences, now, 3)).toEqual(first);
  });

  it('respects disabled and independently disabled reminder kinds', () => {
    const data = dataWithLiabilities(oneTimeLiability({ dueDate: '2024-02-02' }));
    const now = new Date(2024, 1, 1, 8);
    expect(planReminders(data, { ...preferences, enabled: false }, now, 10)).toEqual([]);
    expect(planReminders(data, { ...preferences, dayBefore: false }, now, 10).map((item) => item.kind))
      .toEqual(['same-day']);
    expect(planReminders(data, { ...preferences, sameDay: false }, now, 10).map((item) => item.kind))
      .toEqual(['day-before']);
    expect(planReminders(
      data,
      { ...preferences, dayBefore: false, sameDay: false },
      now,
      10,
    )).toEqual([]);
    expect(planReminders(data, preferences, now, 0)).toEqual([]);
  });

  it('plans one optional monthly values reminder without payment reminders', () => {
    const data = emptyAppData('2024-02-01');
    const reminders = planReminders(data, {
      ...preferences,
      dayBefore: false,
      sameDay: false,
      updateValues: true,
    }, new Date(2024, 1, 1, 8), 2);
    expect(reminders).toHaveLength(2);
    expect(reminders[0]).toMatchObject({
      id: 'update-values:2024-02',
      kind: 'update-values',
      target: { dueItemId: 'update-values', dueDate: '2024-02-01' },
      fireAt: '2024-02-01T09:00',
    });
    expect(planReminders(data, preferences, new Date(2024, 1, 1, 8), 2))
      .toEqual([]);
  });

  it('rejects invalid limits, dates, and local times', () => {
    const data = dataWithLiabilities(oneTimeLiability());
    expect(() => planReminders(data, preferences, new Date(2024, 1, 1), -1)).toThrow(RangeError);
    expect(() => planReminders(data, preferences, new Date(Number.NaN), 1)).toThrow(RangeError);
    expect(() => planReminders(
      data,
      { ...preferences, localTime: '09:15' },
      new Date(2024, 1, 1),
      1,
    )).toThrow(RangeError);
    expect(planReminders({
      ...emptyAppData('2024-02-01'),
      monthBudgets: undefined,
    }, preferences, new Date(2024, 1, 1, 8), 10)).toEqual([]);
  });
});
