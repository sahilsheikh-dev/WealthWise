import { upcomingDue, liabilitySchedule, planNextRows, planSchedule } from '../schedule';
import { behindBy, scheduledDate } from '../sip';
import type {
  AppData,
  ManualHolding,
  OneTimeLiability,
  PlanHolding,
  RecurringLiability,
} from '../types';

const plan = (changes: Partial<PlanHolding> = {}): PlanHolding => ({
  id: 'plan',
  kind: 'plan',
  name: 'Monthly plan',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 1_000,
  ratePct: 0,
  stepUpPct: 10,
  tenureYears: 2,
  startDate: '2026-01-31',
  trackFrom: '2026-02-28',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
  logs: [],
  ...changes,
});

const recurringLiability = (changes: Partial<RecurringLiability> = {}): RecurringLiability => ({
  id: 'recurring',
  kind: 'recurring',
  name: 'Car finance',
  type: 'Car loan',
  principal: 12_000,
  ratePct: 0,
  startDate: '2026-01-31',
  tenureMonths: 6,
  emi: 2_000,
  payments: [],
  settlement: null,
  ...changes,
});

const oneTimeLiability: OneTimeLiability = {
  id: 'once',
  kind: 'one-time',
  name: 'Friend',
  type: 'Borrowed money',
  principal: 1_000,
  ratePct: 0,
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
  payments: [],
};

const appData = (holdings: AppData['holdings'], liabilities: (RecurringLiability | OneTimeLiability)[] = []): AppData => ({
  settings: { name: '', theme: 'system', monthlySalary: null, onboarded: false },
  transactions: [],
  goals: [],
  holdings,
  liabilities,
  policies: [],
  budget: null,
  efCustomBuckets: [],
  efBucketLinks: {},
});

describe('plan schedules', () => {
  it('matches deposits FIFO, ignores withdrawals and excludes slots before trackFrom', () => {
    const result = planSchedule(plan({
      logs: [
        { id: 'later', date: '2026-04-10', amount: 900, note: '', kind: 'Deposit' },
        { id: 'withdrawal', date: '2026-03-01', amount: 500, note: '', kind: 'Withdrawal' },
        { id: 'early', date: '2026-03-05', amount: 1_100, note: '', kind: 'Deposit' },
      ],
    }), '2026-04-15');
    expect(result.rows.map(({ dueDate, status, entryId, paidOn }) => ({ dueDate, status, entryId, paidOn }))).toEqual([
      { dueDate: '2026-02-28', status: 'paid', entryId: 'early', paidOn: '2026-03-05' },
      { dueDate: '2026-03-31', status: 'paid', entryId: 'later', paidOn: '2026-04-10' },
      { dueDate: '2026-04-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-05-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-06-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-07-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-08-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-09-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-10-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-11-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2026-12-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-01-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-02-28', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-03-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-04-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-05-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-06-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-07-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-08-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-09-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-10-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-11-30', status: 'upcoming', entryId: undefined, paidOn: undefined },
      { dueDate: '2027-12-31', status: 'upcoming', entryId: undefined, paidOn: undefined },
    ]);
    expect(result.summary).toMatchObject({ paid: 2, paidAmount: 2_000, remainingPlanned: 22_200 });
  });

  it('classifies due-today, between-slot, overdue and final-slot boundaries', () => {
    const monthly = plan({ tenureYears: 1, startDate: '2026-01-01', trackFrom: '2026-01-01', stepUpPct: 0 });
    expect(planSchedule(monthly, '2026-01-01').rows[0]?.status).toBe('ongoing');
    expect(planSchedule(monthly, '2026-01-31').rows[0]?.status).toBe('ongoing');
    expect(planSchedule(monthly, '2026-02-01').rows[0]?.status).toBe('overdue');
    expect(planSchedule(monthly, '2026-12-31').rows.at(-1)?.status).toBe('ongoing');
    expect(planSchedule(monthly, '2027-01-01').rows.at(-1)?.status).toBe('overdue');
  });

  it('applies annual step-ups and clamps calendar dates for each frequency', () => {
    const monthly = plan({ startDate: '2026-01-31', trackFrom: '2026-01-31', tenureYears: 2 });
    const monthlyRows = planSchedule(monthly, '2026-01-31').rows;
    expect(monthlyRows.slice(0, 3).map((row) => [row.dueDate, row.amount])).toEqual([
      ['2026-01-31', 1_000],
      ['2026-02-28', 1_000],
      ['2026-03-31', 1_000],
    ]);
    expect(monthlyRows[12]?.amount).toBe(1_100);
    expect(planSchedule(plan({ frequency: 'daily', startDate: '2026-01-01', trackFrom: '2026-01-01', tenureYears: 1 }), '2026-01-01').rows[1]?.dueDate).toBe('2026-01-02');
    expect(planSchedule(plan({ frequency: 'weekly', startDate: '2026-01-01', trackFrom: '2026-01-01', tenureYears: 1 }), '2026-01-01').rows[1]?.dueDate).toBe('2026-01-08');
    expect(planSchedule(plan({ frequency: 'yearly', startDate: '2024-02-29', trackFrom: '2024-02-29', tenureYears: 4 }), '2024-02-29').rows[1]?.dueDate).toBe('2025-02-28');
  });

  it('returns only next unpaid slots without changing the full-schedule result', () => {
    const value = plan({
      frequency: 'weekly',
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      tenureYears: 2,
      logs: [1, 2, 3].map((n) => ({
        id: String(n),
        date: `2026-01-0${n}`,
        amount: 1_000,
        note: '',
        kind: 'Deposit' as const,
      })),
    });
    const allUnpaid = planSchedule(value, '2026-02-01').rows.filter((row) => row.status !== 'paid');
    expect(planNextRows(value, '2026-02-01', 8)).toEqual(allUnpaid.slice(0, 8));
    expect(planNextRows(value, '2026-02-01', 0)).toEqual([]);
  });

  it('keeps ongoing plus overdue equal to behindBy across frequencies and tracking dates', () => {
    const frequencies: PlanHolding['frequency'][] = ['daily', 'weekly', 'monthly', 'yearly'];
    for (const frequency of frequencies) {
      for (const trackFrom of ['2025-12-01', '2026-01-01', '2026-03-15', '2027-01-01']) {
        for (const asOf of ['2025-12-31', '2026-01-01', '2026-02-28', '2026-10-10', '2030-01-01']) {
          const seed = plan({ frequency, tenureYears: 3, trackFrom, startDate: '2026-01-01' });
          for (const logCount of [0, 1, 5]) {
            const value = {
              ...seed,
              logs: Array.from({ length: logCount }, (_, index) => ({
                id: `deposit-${index}`,
                date: scheduledDate(seed, index),
                amount: 1_000,
                note: '',
                kind: 'Deposit' as const,
              })),
            };
            const result = planSchedule(value, asOf);
            expect(result.summary.ongoing + result.summary.overdue).toBe(behindBy(value, asOf));
          }
        }
      }
    }
  });

  it('builds a fifty-year daily schedule within two seconds', () => {
    const value = plan({
      frequency: 'daily',
      tenureYears: 50,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
    });
    const started = Date.now();
    const result = planSchedule(value, '2026-01-01');
    expect(result.rows).toHaveLength(18_250);
    expect(Date.now() - started).toBeLessThan(2_000);
  });
});

describe('liability schedules', () => {
  it('matches EMI payments FIFO, including advance payments, and estimates interest', () => {
    const value = recurringLiability({
      ratePct: 12,
      payments: [
        { id: 'second', date: '2026-02-15', amount: 2_000, note: '', kind: 'EMI' },
        { id: 'first', date: '2026-01-01', amount: 2_000, note: '', kind: 'EMI' },
      ],
    });
    const result = liabilitySchedule(value, '2026-03-01');
    expect(result.rows[0]).toMatchObject({ status: 'paid', entryId: 'first', paidOn: '2026-01-01' });
    expect(result.rows[1]).toMatchObject({ status: 'paid', entryId: 'second', paidOn: '2026-02-15' });
    expect(result.rows[2]).toMatchObject({ interest: expect.any(Number), principal: expect.any(Number), balanceAfter: expect.any(Number) });
  });

  it('classifies recurring unpaid rows, shortens after prepayment and reports non-clearing EMI', () => {
    const asOf = '2026-03-31';
    const base = liabilitySchedule(recurringLiability(), asOf);
    expect(base.rows[0]?.status).toBe('overdue');
    expect(base.rows[1]?.status).toBe('ongoing');
    expect(base.summary.overdue).toBeGreaterThan(0);
    const prepaid = liabilitySchedule(recurringLiability({
      ratePct: 0,
      payments: [{ id: 'prepay', date: '2026-01-31', amount: 8_000, note: '', kind: 'Prepayment' }],
    }), asOf);
    expect(prepaid.rows.length).toBeLessThan(base.rows.length);
    const impossible = liabilitySchedule(recurringLiability({ ratePct: 24, emi: 100 }), asOf);
    expect(impossible.neverClears).toBe(true);
    expect(impossible.shortfall).toBe(true);
  });

  it('handles cleared and one-time liability schedule statuses', () => {
    const cleared = liabilitySchedule(recurringLiability({
      payments: [{ id: 'clear', date: '2026-01-31', amount: 20_000, note: '', kind: 'EMI' }],
    }), '2026-01-31');
    expect(cleared.rows[0]?.status).toBe('paid');
    expect(cleared.summary.nextDue).toBeNull();

    expect(liabilitySchedule(oneTimeLiability, '2026-01-31').rows[0]?.status).toBe('upcoming');
    expect(liabilitySchedule(oneTimeLiability, '2026-02-01').rows[0]?.status).toBe('ongoing');
    expect(liabilitySchedule(oneTimeLiability, '2026-02-02').rows[0]?.status).toBe('overdue');
    expect(liabilitySchedule({ ...oneTimeLiability, dueDate: null }, '2026-02-02').rows[0]?.status).toBe('ongoing');
    expect(liabilitySchedule({
      ...oneTimeLiability,
      payments: [{ id: 'paid', date: '2026-01-02', amount: 1_000, note: '', kind: 'Payment' }],
    }, '2026-02-02').rows[0]?.status).toBe('paid');
  });
});

describe('upcoming due items', () => {
  it('orders overdue before ongoing and upcoming, then applies the limit', () => {
    const overduePlan = plan({
      id: 'old',
      name: 'Old plan',
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      logs: Array.from({ length: 8 }, (_, index) => ({
        id: `paid-${index}`,
        date: scheduledDate(plan({ startDate: '2026-01-01', trackFrom: '2026-01-01' }), index),
        amount: 1_000,
        note: '',
        kind: 'Deposit' as const,
      })),
    });
    const ongoingPlan = plan({ id: 'current', name: 'Current plan', startDate: '2026-10-10', trackFrom: '2026-10-10' });
    const upcomingPlan = plan({ id: 'new', name: 'New plan', startDate: '2027-01-01', trackFrom: '2027-01-01' });
    const all = upcomingDue(appData([overduePlan, ongoingPlan, upcomingPlan], [oneTimeLiability]), '2026-10-10');
    expect(all.map((item) => item.row.status)).toEqual(['overdue', 'overdue', 'ongoing', 'ongoing', 'upcoming']);
    const result = upcomingDue(appData([overduePlan, upcomingPlan], [oneTimeLiability]), '2026-10-10', 2);
    expect(result).toHaveLength(2);
    expect(result[0]?.row.status).toBe('overdue');
    expect(result[1]?.row.status).toBe('overdue');
    expect(upcomingDue(appData([overduePlan]), '2026-10-10', 0)).toEqual([]);
    expect(upcomingDue(appData([overduePlan]), '2026-10-10', -1)).toEqual([]);

    const manual: ManualHolding = {
      id: 'manual',
      kind: 'manual',
      name: 'Manual',
      type: 'Gold',
      invested: 1,
      value: 1,
      logs: [],
    };
    const cleared = recurringLiability({
      principal: 1_000,
      emi: 2_000,
      payments: [{ id: 'clear', date: '2026-01-31', amount: 1_000, note: '', kind: 'EMI' }],
    });
    expect(upcomingDue(appData([manual], [cleared]), '2026-02-01')).toEqual([]);

    const first = plan({ id: 'first', name: 'Same name', startDate: '2026-01-01', trackFrom: '2026-01-01', stepUpPct: 0 });
    const second = { ...first, id: 'second' };
    const ties = upcomingDue(appData([second, first]), '2026-01-01', 2);
    expect(ties.map((item) => item.parentId)).toEqual(['second', 'first']);
  });
});
