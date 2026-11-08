import { emptyAppData, NotFoundError } from '../actions';
import {
  addLiabilityWithHistory,
  addPlanWithHistory,
  addPolicyWithHistory,
  clearDue,
  clearPastDues,
  NothingToClearError,
  pendingDues,
  TooManyDuesError,
  undoClearDue,
} from '../dues';
import { loanState, amortizedBalanceAfter } from '../liability';
import { validateIntegrity } from '../links';
import { liabilitySchedule, planSchedule, upcomingDue } from '../schedule';
import { policySchedule } from '../policySchedule';
import type { OneTimeLiability, PlanHolding, Policy, RecurringLiability } from '../types';

const base = () => emptyAppData('2026-01-01');

const plan = (changes: Partial<PlanHolding> = {}): PlanHolding => ({
  id: 'plan',
  kind: 'plan',
  name: 'Monthly plan',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 100,
  ratePct: 0,
  stepUpPct: 0,
  tenureYears: 1,
  startDate: '2026-01-01',
  trackFrom: '2026-01-01',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
  logs: [],
  ...changes,
});

const liability = (changes: Partial<RecurringLiability> = {}): RecurringLiability => ({
  id: 'liability',
  kind: 'recurring',
  name: 'Monthly liability',
  type: 'Personal loan',
  principal: 1_200,
  ratePct: 0,
  startDate: '2026-01-01',
  tenureMonths: 12,
  emi: 100,
  payments: [],
  settlement: null,
  ...changes,
});

const oneTimeLiability = (changes: Partial<OneTimeLiability> = {}): OneTimeLiability => ({
  id: 'one-time',
  kind: 'one-time',
  name: 'Friend',
  type: 'Borrowed money',
  principal: 1_000,
  ratePct: 0,
  startDate: '2026-01-01',
  dueDate: '2026-01-01',
  payments: [],
  ...changes,
});

const policy = (changes: Partial<Policy> = {}): Policy => ({
  id: 'policy',
  name: 'Health cover',
  insurer: 'Insurer',
  kind: 'health',
  premium: 50,
  frequency: 'monthly',
  startDate: '2026-01-01',
  premiumYears: 1,
  trackFrom: '2026-01-01',
  coverAmount: null,
  currentValue: null,
  valueAsOf: null,
  maturityDate: null,
  payments: [],
  ...changes,
});

function withPlan(item = plan()) {
  return { ...base(), holdings: [item] };
}

function withLiability(item = liability()) {
  return { ...base(), liabilities: [item] };
}

function withPolicy(item = policy()) {
  return { ...base(), policies: [item] };
}

describe('schedule slot compatibility', () => {
  it('keeps the pre-refactor plan and recurring-liability outputs across a fixed date grid', () => {
    const planGrid = ['2026-01-30', '2026-01-31', '2026-03-01', '2027-01-31'].map((asOf) => {
      const schedule = planSchedule(plan({
        startDate: '2026-01-31',
        trackFrom: '2026-01-31',
      }), asOf);
      return {
        first: schedule.rows.slice(0, 3).map(({ dueDate, amount, status }) => [dueDate, amount, status]),
        summary: [schedule.summary.paid, schedule.summary.ongoing, schedule.summary.overdue, schedule.summary.upcoming],
      };
    });
    expect(planGrid).toEqual([
      {
        first: [['2026-01-31', 100, 'upcoming'], ['2026-02-28', 100, 'upcoming'], ['2026-03-31', 100, 'upcoming']],
        summary: [0, 0, 0, 12],
      },
      {
        first: [['2026-01-31', 100, 'ongoing'], ['2026-02-28', 100, 'upcoming'], ['2026-03-31', 100, 'upcoming']],
        summary: [0, 1, 0, 11],
      },
      {
        first: [['2026-01-31', 100, 'overdue'], ['2026-02-28', 100, 'ongoing'], ['2026-03-31', 100, 'upcoming']],
        summary: [0, 1, 1, 10],
      },
      {
        first: [['2026-01-31', 100, 'overdue'], ['2026-02-28', 100, 'overdue'], ['2026-03-31', 100, 'overdue']],
        summary: [0, 0, 12, 0],
      },
    ]);

    const liabilityGrid = ['2026-01-31', '2026-02-28', '2026-04-30'].map((asOf) => {
      const schedule = liabilitySchedule(liability({
        principal: 300,
        tenureMonths: 3,
        emi: 100,
        startDate: '2026-01-31',
      }), asOf);
      return {
        rows: schedule.rows.map(({ dueDate, amount, status, balanceAfter }) => [dueDate, amount, status, balanceAfter]),
        shortfall: schedule.shortfall,
      };
    });
    expect(liabilityGrid).toEqual([
      {
        rows: [
          ['2026-02-28', 100, 'upcoming', 200],
          ['2026-03-31', 100, 'upcoming', 100],
          ['2026-04-30', 100, 'upcoming', 0],
        ],
        shortfall: false,
      },
      {
        rows: [
          ['2026-02-28', 100, 'ongoing', 200],
          ['2026-03-31', 100, 'upcoming', 100],
          ['2026-04-30', 100, 'upcoming', 0],
        ],
        shortfall: false,
      },
      {
        rows: [
          ['2026-02-28', 100, 'overdue', 200],
          ['2026-03-31', 100, 'overdue', 100],
          ['2026-04-30', 100, 'ongoing', 0],
        ],
        shortfall: false,
      },
    ]);
  });
});

describe('pending dues', () => {
  it.each([
    { label: 'plan', item: plan(), count: 2, amount: 200, firstAmount: 100 },
    { label: 'recurring liability', item: liability(), count: 1, amount: 100, firstAmount: 100 },
    { label: 'policy', item: policy(), count: 2, amount: 100, firstAmount: 50 },
  ])('includes due-today slots and excludes upcoming slots for a $label', ({ label, item, count, amount, firstAmount }) => {
    const result = pendingDues(item, '2026-02-01');
    expect(result.count).toBe(count);
    expect(result.amount).toBe(amount);
    expect(result.months).toEqual([
      ...(label === 'recurring liability' ? [] : [{ month: '2026-01', amount: firstAmount }]),
      { month: '2026-02', amount: label === 'policy' ? 50 : 100 },
    ]);
  });

  it('includes policy dues in Home upcoming dues when there are no liabilities', () => {
    const dues = upcomingDue(withPolicy(), '2026-01-01');
    expect(dues).toHaveLength(1);
    expect(dues[0]).toMatchObject({ kind: 'policy', parentId: 'policy', name: 'Health cover' });
  });

  it('generates a single-premium policy schedule with one slot', () => {
    const schedule = policySchedule(policy({
      frequency: 'single',
      startDate: '2026-01-31',
      trackFrom: '2026-01-31',
    }), '2026-02-01');
    expect(schedule.rows).toHaveLength(1);
    expect(schedule.rows[0]).toMatchObject({ dueDate: '2026-01-31', amount: 50, status: 'overdue' });
  });

  it('starts policy tracking at the selected date and FIFO-matches existing payments', () => {
    const schedule = policySchedule(policy({
      frequency: 'quarterly',
      premiumYears: 2,
      startDate: '2026-01-31',
      trackFrom: '2026-07-31',
      payments: [{ id: 'premium', date: '2026-08-01', amount: 50, note: '' }],
    }), '2026-09-01');
    expect(schedule.rows.map(({ dueDate, status, entryId }) => [dueDate, status, entryId]))
      .toEqual([
        ['2026-07-31', 'paid', 'premium'],
        ['2026-10-31', 'upcoming', undefined],
        ['2027-01-31', 'upcoming', undefined],
        ['2027-04-30', 'upcoming', undefined],
        ['2027-07-31', 'upcoming', undefined],
        ['2027-10-31', 'upcoming', undefined],
      ]);
  });
});

describe('one-tap dues and undo', () => {
  it('clears a one-time liability due with a linked Payment transaction', () => {
    const result = clearDue({ ...base(), liabilities: [oneTimeLiability()] }, {
      kind: 'liability', id: 'one-time',
    }, {
      date: '2026-01-01',
      newId: (() => { let id = 0; return () => `new-${++id}`; })(),
    });
    const updated = result.data.liabilities[0];
    expect(updated?.kind).toBe('one-time');
    if (updated?.kind !== 'one-time') throw new Error('Expected one-time liability.');
    expect(updated.payments[0]).toMatchObject({ amount: 1_000, kind: 'Payment', date: '2026-01-01' });
    expect(result.data.transactions).toHaveLength(1);
    expect(validateIntegrity(result.data)).toEqual([]);
  });

  it('skips a one-time liability without a due date when clearing pending dues', () => {
    const data = { ...base(), liabilities: [oneTimeLiability({ dueDate: null })] };
    expect(() => clearDue(data, { kind: 'liability', id: 'one-time' }, {
      date: '2026-01-01', newId: () => 'unused',
    })).toThrow(NothingToClearError);
    expect(data.liabilities[0]).toMatchObject({ kind: 'one-time', dueDate: null, payments: [] });
  });

  it('clears a plan installment with FIFO matching and undo restores the original data', () => {
    const original = withPlan(plan({
      logs: [{ id: 'deposit-existing', date: '2026-01-31', amount: 100, note: '', kind: 'Deposit' }],
    }));
    const withPending = withPlan();
    const cleared = clearDue(withPending, { kind: 'plan', id: 'plan' }, {
      date: '2026-02-01',
      newId: (() => { let id = 0; return () => `new-${++id}`; })(),
    });
    expect(cleared.entryId).toBe('new-1');
    expect(cleared.data.holdings[0]?.logs[0]).toMatchObject({ id: 'new-1', date: '2026-02-01', amount: 100, kind: 'Deposit' });
    expect(cleared.data.transactions[0]).toMatchObject({
      type: 'invest',
      date: '2026-02-01',
      amount: 100,
      source: { kind: 'holding-entry', parentId: 'plan', entryId: 'new-1' },
    });
    expect(validateIntegrity(cleared.data)).toEqual([]);
    expect(undoClearDue(cleared.data, { kind: 'plan', id: 'plan' }, cleared.entryId)).toEqual(withPending);
    expect(original).not.toEqual(withPending);
  });

  it('clears only the oldest selected future slot and rejects later slots', () => {
    const withFirstPaid = withPlan(plan({
      trackFrom: '2026-02-01',
      logs: [{ id: 'feb-deposit', date: '2026-02-01', amount: 100, note: '', kind: 'Deposit' }],
    }));
    expect(() => clearDue(withFirstPaid, { kind: 'plan', id: 'plan' }, {
      date: '2026-02-01',
      rowId: 'plan:3',
      newId: () => 'unused',
    })).toThrow(NothingToClearError);

    const cleared = clearDue(withFirstPaid, { kind: 'plan', id: 'plan' }, {
      date: '2026-02-01',
      rowId: 'plan:2',
      newId: (() => { let id = 0; return () => `future-${++id}`; })(),
    });
    expect(cleared.data.holdings[0]?.logs).toHaveLength(2);
    expect(cleared.data.transactions[0]).toMatchObject({
      date: '2026-02-01',
      amount: 100,
      source: { kind: 'holding-entry', parentId: 'plan', entryId: cleared.entryId },
    });
    expect(validateIntegrity(cleared.data)).toEqual([]);
  });

  it('clears recurring liability and policy dues with their source transaction', () => {
    const liabilityResult = clearDue(withLiability(), { kind: 'liability', id: 'liability' }, {
      date: '2026-02-01', newId: (() => { let id = 0; return () => `liability-${++id}`; })(),
    });
    expect(liabilityResult.data.transactions[0]).toMatchObject({
      type: 'expense',
      category: 'EMI',
      amount: 100,
      source: { kind: 'liability-payment', parentId: 'liability', entryId: 'liability-1' },
    });
    expect(validateIntegrity(liabilityResult.data)).toEqual([]);
    expect(undoClearDue(liabilityResult.data, { kind: 'liability', id: 'liability' }, liabilityResult.entryId))
      .toEqual(withLiability());

    const policyData = withPolicy();
    const otherPolicy = policy({ id: 'other-policy', name: 'Other policy' });
    const policyResult = clearDue({
      ...policyData,
      policies: [...policyData.policies, otherPolicy],
      transactions: [{
        id: 'unrelated',
        type: 'income',
        amount: 1,
        category: 'Salary',
        note: '',
        date: '2026-01-01',
      }],
    }, { kind: 'policy', id: 'policy' }, {
      date: '2026-02-01', newId: (() => { let id = 0; return () => `policy-${++id}`; })(),
    });
    expect(policyResult.data.transactions.find((transaction) => transaction.source?.kind === 'policy-payment')).toMatchObject({
      type: 'expense',
      category: 'Insurance',
      note: 'Health cover premium',
      amount: 50,
      source: { kind: 'policy-payment', parentId: 'policy', entryId: 'policy-1' },
    });
    expect(validateIntegrity(policyResult.data)).toEqual([]);
    const undone = undoClearDue(policyResult.data, { kind: 'policy', id: 'policy' }, policyResult.entryId);
    expect(undone.policies[1]).toEqual(otherPolicy);
    expect(undone.transactions).toEqual([{
      id: 'unrelated',
      type: 'income',
      amount: 1,
      category: 'Salary',
      note: '',
      date: '2026-01-01',
    }]);
  });

  it('throws NothingToClearError without changing the input reference', () => {
    const data = withPlan(plan({ startDate: '2026-01-01', trackFrom: '2026-03-01' }));
    expect(() => clearDue(data, { kind: 'plan', id: 'plan' }, {
      date: '2026-02-01', newId: () => 'unused',
    })).toThrow(NothingToClearError);
    expect(data.holdings[0]).toMatchObject({ trackFrom: '2026-03-01' });
  });

  it('reports missing schedules and guards a failed entry creation without mutating data', () => {
    const data = base();
    expect(() => pendingDues(plan(), '2026-01-01')).not.toThrow();
    expect(() => clearDue(data, { kind: 'plan', id: 'missing' }, {
      date: '2026-01-01', newId: () => 'unused',
    })).toThrow(NotFoundError);
    expect(() => clearDue(data, { kind: 'liability', id: 'missing' }, {
      date: '2026-01-01', newId: () => 'unused',
    })).toThrow(NotFoundError);
    expect(() => clearDue(data, { kind: 'policy', id: 'missing' }, {
      date: '2026-01-01', newId: () => 'unused',
    })).toThrow(NotFoundError);

    const dueData = withPlan();
    expect(() => clearDue(dueData, { kind: 'plan', id: 'plan' }, {
      date: '2026-02-01', newId: () => '',
    })).toThrow('The investment entry was not created.');
    expect(dueData).toEqual(withPlan());
  });

  it('rejects undoing a missing policy payment', () => {
    expect(() => undoClearDue(withPolicy(), { kind: 'policy', id: 'policy' }, 'missing'))
      .toThrow('Policy payment with id "missing" was not found');
  });
});

describe('bulk due handling', () => {
  it('settles missed plan slots without transactions and moves tracking beyond the pending period', () => {
    const otherPlan = plan({ id: 'other-plan', name: 'Other plan' });
    const data = { ...withPlan(plan()), holdings: [plan(), otherPlan] };
    const result = clearPastDues(data, { kind: 'plan', id: 'plan' }, {
      mode: 'settle',
      addSkippedToOpening: true,
    }, { asOf: '2026-03-01', newId: () => 'unused' });
    expect(result.summary).toEqual({
      count: 3,
      amount: 300,
      months: [{ month: '2026-01', amount: 100 }, { month: '2026-02', amount: 100 }, { month: '2026-03', amount: 100 }],
    });
    expect(result.data.transactions).toEqual(data.transactions);
    expect(result.data.holdings[0]).toMatchObject({ opening: 300, trackFrom: '2026-04-01' });
    expect(result.data.holdings[1]).toBe(otherPlan);
    expect(validateIntegrity(result.data)).toEqual([]);
  });

  it('records exactly the overdue plan dues on their slot dates and leaves future slots unchanged', () => {
    const data = withPlan(plan({ stepUpPct: 100 }));
    const result = clearPastDues(data, { kind: 'plan', id: 'plan' }, { mode: 'record' }, {
      asOf: '2026-02-01',
      newId: (() => { let id = 0; return () => `record-${++id}`; })(),
    });
    expect(result.summary).toMatchObject({ count: 2, amount: 200 });
    expect(result.data.holdings[0]?.logs.map(({ date, amount }) => [date, amount]))
      .toEqual([['2026-01-01', 100], ['2026-02-01', 100]]);
    expect(result.data.transactions).toHaveLength(2);
    expect(result.data.transactions.map(({ date }) => date)).toEqual(['2026-01-01', '2026-02-01']);
    expect(validateIntegrity(result.data)).toEqual([]);
  });

  it('settles recurring liabilities at an explicit or amortized balance and ignores historical payments after settlement', () => {
    const value = liability({
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-01-01',
      tenureMonths: 12,
      emi: 300,
      payments: [
        { id: 'before', date: '2026-01-15', amount: 300, note: '', kind: 'EMI' },
        { id: 'after', date: '2026-02-15', amount: 100, note: '', kind: 'EMI' },
      ],
    });

    expect(amortizedBalanceAfter(value, '2026-03-01')).toBe(400);
    expect(loanState({ ...value, settlement: { asOf: '2026-02-01', balance: 800 } }, '2026-01-20').balance).toBe(800);
    expect(loanState({ ...value, settlement: { asOf: '2026-02-01', balance: 800 } }, '2026-03-01'))
      .toEqual({ balance: 700, paidTotal: 400, interestAccrued: 0 });

    const postSettlementPayment = value.payments.find((payment) => payment.id === 'after');
    const settleValue = { ...value, payments: postSettlementPayment ? [postSettlementPayment] : [] };
    const data = withLiability(settleValue);
    const settled = clearPastDues(data, { kind: 'liability', id: value.id }, { mode: 'settle' }, {
      asOf: '2026-03-01', newId: () => 'unused',
    });
    const updated = settled.data.liabilities[0];
    expect(updated?.kind === 'recurring' ? updated.settlement : null).toEqual({ asOf: '2026-03-01', balance: 400 });
    expect(settled.data.transactions).toEqual(data.transactions);
    expect(validateIntegrity(settled.data)).toEqual([]);
  });

  it('records recurring-liability dues by due date and caps each payment at the remaining balance', () => {
    const data = withLiability(liability({ principal: 150, tenureMonths: 3, emi: 100 }));
    const result = clearPastDues(data, { kind: 'liability', id: 'liability' }, { mode: 'record' }, {
      asOf: '2026-03-01',
      newId: (() => { let id = 0; return () => `emi-${++id}`; })(),
    });
    const updated = result.data.liabilities[0];
    expect(updated?.kind === 'recurring'
      ? updated.payments.map(({ date, amount }) => [date, amount])
      : []).toEqual([['2026-02-01', 100], ['2026-03-01', 50]]);
    expect(result.data.transactions).toHaveLength(2);
    expect(validateIntegrity(result.data)).toEqual([]);
  });

  it('marks installments through settlement as assumed paid and stops after a zero balance', () => {
    const value = liability({
      settlement: { asOf: '2026-03-01', balance: 0 },
      tenureMonths: 3,
    });
    const schedule = liabilitySchedule(value, '2026-04-01');
    expect(schedule.rows.slice(0, 2).map(({ status, assumed }) => [status, assumed]))
      .toEqual([['paid', true], ['paid', true]]);
    expect(schedule.rows).toHaveLength(2);
  });

  it('records each policy payment on the slot date and settles policy tracking without writes', () => {
    const data = withPolicy();
    const recorded = clearPastDues(data, { kind: 'policy', id: 'policy' }, { mode: 'record' }, {
      asOf: '2026-02-01', newId: (() => { let id = 0; return () => `policy-${++id}`; })(),
    });
    expect(recorded.data.policies[0]?.payments.map(({ date, amount }) => [date, amount]))
      .toEqual([['2026-01-01', 50], ['2026-02-01', 50]]);
    expect(validateIntegrity(recorded.data)).toEqual([]);
    const settled = clearPastDues(data, { kind: 'policy', id: 'policy' }, { mode: 'settle' }, {
      asOf: '2026-02-01', newId: () => 'unused',
    });
    expect(settled.data.transactions).toEqual(data.transactions);
    expect(settled.data.policies[0]?.trackFrom).toBe('2026-03-01');
  });

  it('refuses more than 400 recorded dues and creates nothing', () => {
    const daily = plan({
      frequency: 'daily',
      tenureYears: 2,
      startDate: '2025-01-01',
      trackFrom: '2025-01-01',
    });
    const data = withPlan(daily);
    expect(() => clearPastDues(data, { kind: 'plan', id: daily.id }, { mode: 'record' }, {
      asOf: '2026-02-10',
      newId: () => 'unused',
    })).toThrow(TooManyDuesError);
    expect(data.holdings[0]).toBe(daily);
    expect(data.transactions).toHaveLength(0);
  });

  it('adds a plan and settles its past due slots as one immutable action', () => {
    const data = base();
    const result = addPlanWithHistory(data, {
      name: 'Added late',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
    }, {
      mode: 'settle',
      asOf: '2026-02-01',
      addSkippedToOpening: true,
      newId: () => 'created-plan',
    });
    expect(result.data.holdings).toHaveLength(1);
    expect(result.data.holdings[0]).toMatchObject({ id: 'created-plan', opening: 200, trackFrom: '2026-03-01' });
    expect(result.summary).toMatchObject({ count: 2, amount: 200 });
    expect(data.holdings).toHaveLength(0);
  });

  it('moves tracking one day after the final slot when an ended plan is settled', () => {
    const data = withPlan(plan({ tenureYears: 1, startDate: '2025-01-01', trackFrom: '2025-01-01' }));
    const result = clearPastDues(data, { kind: 'plan', id: 'plan' }, { mode: 'settle' }, {
      asOf: '2026-01-01', newId: () => 'unused',
    });
    expect(result.data.holdings[0]).toMatchObject({ trackFrom: '2025-12-02' });
  });

  it('rejects invalid settlements and unsupported one-time liability history without mutation', () => {
    const liabilityData = withLiability();
    const originalLiability = liabilityData.liabilities[0];
    expect(() => clearPastDues(liabilityData, { kind: 'liability', id: 'liability' }, {
      mode: 'settle', balance: -1,
    }, { asOf: '2026-03-01', newId: () => 'unused' })).toThrow('Outstanding balance must be zero or more.');
    expect(liabilityData.liabilities[0]).toBe(originalLiability);

    expect(() => addLiabilityWithHistory(base(), {
      kind: 'one-time',
      name: 'One-time',
      type: 'Borrowed money',
      principal: 100,
      ratePct: 0,
      startDate: '2026-01-01',
      dueDate: null,
    }, { mode: 'settle', asOf: '2026-02-01', newId: () => 'one-time' }))
      .toThrow('A recurring liability was not created.');
  });

  it('throws NothingToClearError and preserves identity when bulk clearing has no pending dues', () => {
    const data = withPlan(plan({ startDate: '2026-01-01', trackFrom: '2026-04-01' }));
    expect(() => clearPastDues(data, { kind: 'plan', id: 'plan' }, { mode: 'settle' }, {
      asOf: '2026-03-01',
      newId: () => 'unused',
    })).toThrow(NothingToClearError);
    expect(data.holdings[0]?.trackFrom).toBe('2026-04-01');
  });

  it('adds liability and policy history atomically with past installments', () => {
    const liabilityResult = addLiabilityWithHistory(base(), {
      kind: 'recurring',
      name: 'Old liability',
      type: 'Personal loan',
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-01-01',
      tenureMonths: 12,
      emi: 100,
    }, { mode: 'record', asOf: '2026-03-01', newId: (() => { let id = 0; return () => `new-liability-${++id}`; })() });
    expect(liabilityResult.data.liabilities).toHaveLength(1);
    expect(liabilityResult.data.transactions).toHaveLength(2);
    expect(validateIntegrity(liabilityResult.data)).toEqual([]);

    const policyResult = addPolicyWithHistory(base(), {
      name: 'Old policy',
      insurer: '',
      kind: 'health',
      premium: 50,
      frequency: 'monthly',
      startDate: '2026-01-01',
      premiumYears: 1,
      trackFrom: '2026-01-01',
      coverAmount: null,
      currentValue: null,
      valueAsOf: null,
      maturityDate: null,
    }, { mode: 'record', asOf: '2026-02-01', newId: (() => { let id = 0; return () => `new-policy-${++id}`; })() });
    expect(policyResult.data.policies).toHaveLength(1);
    expect(policyResult.data.transactions).toHaveLength(2);
    expect(validateIntegrity(policyResult.data)).toEqual([]);
  });
});
