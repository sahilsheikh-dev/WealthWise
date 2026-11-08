import { emptyAppData } from '../actions';
import { goalSaved } from '../goals';
import { GoalLockedError, addGoal, deleteGoal, updateGoal } from '../goalActions';
import { addHolding, deleteHolding, updateHolding, valueStaleness } from '../holdingActions';
import { EfBalanceError, EfLinkError, addEfEntry, deleteEfEntry, efBalanceOn, efEndOfDayBalances, updateEfEntry } from '../efActions';
import { describeSource, validateIntegrity } from '../links';
import { updateLoan } from '../loanActions';
import { addPlan, updatePlan } from '../planActions';
import { loggedTrackedCount, behindBy } from '../sip';
import { mockAppData } from '../../mock/data';
import type { AppData, Loan, PlanHolding } from '../types';

const initial = () => emptyAppData('2026-10-10');
const planInput = {
  name: 'Old SIP', type: 'Mutual fund / SIP' as const, frequency: 'monthly' as const, amount: 100,
  ratePct: 10, stepUpPct: 0, tenureYears: 1, startDate: '2026-01-01', trackFrom: '2026-03-01',
  opening: 0, actualValue: null, actualValueDate: null,
};

describe('Phase 5 domain actions', () => {
  it('counts only logs on or after tracking begins for behind calculations', () => {
    const plan: PlanHolding = {
      ...planInput, kind: 'plan', id: 'plan', logs: [
        { id: 'before', date: '2026-02-01', amount: 10, note: '' },
        { id: 'on', date: '2026-03-01', amount: 10, note: '' },
      ],
    };
    expect(loggedTrackedCount(plan)).toBe(1);
    expect(behindBy(plan, '2026-04-01')).toBe(1);
    expect(behindBy({ ...plan, logs: [plan.logs[1]!] }, '2026-03-01')).toBe(0);
    expect(behindBy({ ...plan, logs: [] }, '2026-04-01')).toBe(2);
  });

  it('updates linked plan and loan transactions on parent rename and type changes without overwriting edited notes', () => {
    let data = addPlan(initial(), planInput, () => 'plan');
    data = {
      ...data,
      holdings: data.holdings.map((holding) => holding.kind === 'plan' && holding.id === 'plan'
        ? { ...holding, logs: [
          { id: 'log', date: '2026-03-01', amount: 50, note: '' },
          { id: 'edited-log', date: '2026-03-02', amount: 40, note: '' },
        ] }
        : holding),
      transactions: [
        { id: 'linked', type: 'invest', amount: 50, date: '2026-03-01', category: 'Mutual fund / SIP', note: 'Old SIP installment', source: { kind: 'plan-log', parentId: 'plan', entryId: 'log' } },
        { id: 'edited', type: 'invest', amount: 40, date: '2026-03-02', category: 'Mutual fund / SIP', note: 'User note', source: { kind: 'plan-log', parentId: 'plan', entryId: 'edited-log' } },
      ],
    };
    data = updatePlan(data, 'plan', { name: 'New SIP', type: 'Gold' });
    expect(data.transactions[0]).toMatchObject({ note: 'New SIP installment', category: 'Gold / Silver' });
    expect(data.transactions[1]).toMatchObject({ note: 'User note', category: 'Gold / Silver' });
    expect(validateIntegrity(data)).toEqual([]);

    const loan: Loan = { id: 'loan', name: 'Old loan', principal: 1000, ratePct: 0, tenureMonths: 1, emi: 1000, startDate: '2026-01-01', payments: [{ id: 'pay', date: '2026-02-01', amount: 100, note: '', kind: 'Prepayment' }] };
    data = { ...data, loans: [loan], transactions: [...data.transactions, { id: 'loan-tx', type: 'expense', amount: 100, date: '2026-02-01', category: 'EMI', note: 'Old loan prepayment', source: { kind: 'loan-payment', parentId: 'loan', entryId: 'pay' } }] };
    data = updateLoan(data, 'loan', { name: 'New loan' });
    expect(data.transactions.find(({ id }) => id === 'loan-tx')?.note).toBe('New loan prepayment');
    data = { ...data, transactions: data.transactions.map((transaction) => transaction.id === 'loan-tx' ? { ...transaction, note: 'User changed' } : transaction) };
    data = updateLoan(data, 'loan', { name: 'Final loan' });
    expect(data.transactions.find(({ id }) => id === 'loan-tx')?.note).toBe('User changed');
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('detects linked drift for amount, date and transaction kind', () => {
    let data = addPlan(initial(), planInput, () => 'p');
    data = {
      ...data,
      holdings: data.holdings.map((holding) => holding.kind === 'plan'
        ? { ...holding, logs: [{ id: 'l', date: '2026-03-01', amount: 50, note: '' }] }
        : holding),
      transactions: [{ id: 't', type: 'expense', amount: 51, date: '2026-03-02', category: '', note: '', source: { kind: 'plan-log', parentId: 'p', entryId: 'l' } }],
    };
    expect(validateIntegrity(data).map((issue) => issue.code)).toContain('linked-drift');
  });

  it('locks the automatic emergency goal while supporting regular goal CRUD', () => {
    let data = initial();
    data = addGoal(data, { name: 'Trip', target: 1000, saved: 100, year: 2028 }, () => 'g');
    data = updateGoal(data, 'g', { name: 'Travel' });
    expect(data.goals.find((goal) => goal.id === 'g')?.name).toBe('Travel');
    expect(() => updateGoal(data, 'g', { auto: 'ef' })).toThrow(GoalLockedError);
    data = deleteGoal(data, 'g');
    const efGoal = data.goals[0]!;
    expect(() => updateGoal(data, efGoal.id, { name: 'Renamed' })).toThrow(GoalLockedError);
    expect(() => updateGoal(data, efGoal.id, { saved: 10 })).toThrow(GoalLockedError);
    expect(() => updateGoal(data, efGoal.id, { auto: 'ef' })).toThrow(GoalLockedError);
    expect(updateGoal(data, efGoal.id, { target: 700, year: 2030 }).goals[0]).toMatchObject({ target: 700, year: 2030 });
    expect(() => deleteGoal(data, efGoal.id)).toThrow(GoalLockedError);
    expect(() => updateGoal(data, 'missing', { name: 'Missing' })).toThrow('not found');
    expect(() => deleteGoal(data, 'missing')).toThrow('not found');
    expect(goalSaved(efGoal, 500)).toBe(500);
  });

  it('adds and edits manual holdings while retaining the caller-provided valuation date', () => {
    let data = addHolding(initial(), {
      name: 'PF', type: 'EPFO / PF', invested: 100, value: 120, valueAsOf: '2026-10-10',
    }, () => 'holding');
    data = addPlan(data, { ...planInput, name: 'Other plan' }, () => 'plan');
    data = updateHolding(data, 'holding', { name: 'EPFO' });
    expect(data.holdings[0]).toMatchObject({ name: 'EPFO', valueAsOf: '2026-10-10' });
    expect(() => updateHolding(data, 'missing', { name: 'Missing' })).toThrow('not found');
    expect(() => updateHolding(data, 'plan', { name: 'Not manual' })).toThrow('not found');
    expect(() => deleteHolding(data, 'plan')).toThrow('not found');
    expect(() => deleteHolding(data, 'missing')).toThrow('not found');
    data = updateHolding(data, 'holding', { value: 125 });
    expect(data.holdings[0]).toMatchObject({ value: 125, valueAsOf: '2026-10-10' });
    data = deleteHolding(data, 'holding');
    expect(data.holdings).toHaveLength(1);
  });

  it('marks holdings stale after 90 days and treats missing dates as unknown-stale', () => {
    expect(valueStaleness('2026-07-12', '2026-10-10')).toEqual({ stale: false, days: 90 });
    expect(valueStaleness('2026-07-11', '2026-10-10')).toEqual({ stale: true, days: 91 });
    expect(valueStaleness(undefined, '2026-10-10')).toEqual({ stale: true, days: null });
  });

  it('maintains non-negative end-of-day balances and keeps deposit links synchronized', () => {
    let data = initial();
    data = addEfEntry(data, { date: '2026-01-01', amount: 50_000, note: 'Deposit' }, { recordTransaction: true, newId: () => 'deposit' });
    data = addEfEntry(data, { date: '2026-01-02', amount: -20_000, note: 'Withdrawal' }, { recordTransaction: false, newId: () => 'withdrawal' });
    const before = data;
    expect(() => addEfEntry(data, { date: '2026-01-03', amount: -40_000, note: '' }, { recordTransaction: false, newId: () => 'too-much' })).toThrow(EfBalanceError);
    expect(data).toBe(before);
    expect(() => deleteEfEntry(data, 'deposit')).toThrow('This would make the balance negative on 2026-01-02');
    expect(() => updateEfEntry(data, 'withdrawal', { date: '2025-12-31' })).toThrow(EfBalanceError);
    data = updateEfEntry(data, 'deposit', { amount: 70_000 });
    expect(data.transactions[0]).toMatchObject({ amount: 70_000, date: '2026-01-01' });
    expect(efEndOfDayBalances(data.efEntries).at(-1)?.balance).toBe(50_000);
    expect(validateIntegrity(data)).toEqual([]);
    expect(() => addEfEntry(data, { date: '2026-01-04', amount: -1, note: '' }, { recordTransaction: true, newId: () => 'bad' })).toThrow(EfLinkError);
    expect(new EfLinkError()).toBeInstanceOf(Error);
    expect(() => updateEfEntry(data, 'missing', { note: 'Missing' })).toThrow('not found');
    expect(() => deleteEfEntry(data, 'missing')).toThrow('not found');

    const withoutGoal = { ...initial(), goals: [] };
    expect(() => addEfEntry(withoutGoal, { date: '2026-01-01', amount: 1, note: '' }, {
      recordTransaction: false, newId: () => 'no-goal',
    })).toThrow('not found');

    const unlinked = addEfEntry(initial(), { date: '2026-01-01', amount: 10, note: '' }, {
      recordTransaction: false, newId: () => 'unlinked',
    });
    const edited = updateEfEntry(unlinked, 'unlinked', { date: '2026-01-02', amount: 5 });
    expect(edited.efEntries[0]).toMatchObject({ date: '2026-01-02', amount: 5 });
    expect(edited.transactions).toEqual([]);
    expect(efBalanceOn(edited.efEntries, '2026-01-01')).toBe(0);
    expect(efBalanceOn(edited.efEntries, '2026-01-02')).toBe(5);
    expect(deleteEfEntry(edited, 'unlinked').efEntries).toEqual([]);

    const depositOnly = addEfEntry(initial(), { date: '2026-01-01', amount: 50, note: '' }, {
      recordTransaction: true, newId: (() => { let id = 0; return () => `linked-${++id}`; })(),
    });
    const withUnrelatedTransaction = {
      ...depositOnly,
      transactions: [...depositOnly.transactions, {
        id: 'unrelated', type: 'income' as const, amount: 1, date: '2026-01-01',
        category: 'Salary', note: 'Unrelated',
      }],
    };
    expect(updateEfEntry(withUnrelatedTransaction, depositOnly.efEntries[0]!.id, { date: '2026-01-03' }).transactions[1])
      .toMatchObject({ id: 'unrelated', date: '2026-01-01' });
  });

  it('describes valid transaction sources and omits orphan sources', () => {
    const source = { kind: 'ef-entry' as const, parentId: 'goal-emergency', entryId: 'entry' };
    const data: AppData = {
      ...initial(),
      efEntries: [{ id: 'entry', date: '2026-01-01', amount: 1, note: '' }],
    };
    expect(describeSource(data, source)).toEqual({ label: 'Emergency fund', route: '/emergency-fund', params: {} });
    expect(describeSource(data, { ...source, entryId: 'missing' })).toBeNull();

    const plan: PlanHolding = {
      ...planInput, id: 'plan', kind: 'plan', name: 'Travel SIP',
      logs: [{ id: 'plan-log', date: '2026-01-01', amount: 10, note: '' }],
    };
    const loan: Loan = {
      id: 'loan', name: 'Car loan', principal: 100, ratePct: 1, tenureMonths: 1,
      emi: 100, startDate: '2026-01-01',
      payments: [{ id: 'loan-payment', date: '2026-01-01', amount: 10, note: '', kind: 'EMI' }],
    };
    const withParents = { ...data, holdings: [plan], loans: [loan] };
    expect(describeSource(withParents, { kind: 'plan-log', parentId: 'plan', entryId: 'plan-log' }))
      .toEqual({ label: 'Travel SIP', route: '/plan-logs', params: { id: 'plan' } });
    expect(describeSource(withParents, { kind: 'plan-log', parentId: 'plan', entryId: 'missing' })).toBeNull();
    expect(describeSource(withParents, { kind: 'plan-log', parentId: 'wrong', entryId: 'plan-log' })).toBeNull();
    expect(describeSource(withParents, { kind: 'loan-payment', parentId: 'loan', entryId: 'loan-payment' }))
      .toEqual({ label: 'Car loan', route: '/loan-payments', params: { id: 'loan' } });
    expect(describeSource(withParents, { kind: 'loan-payment', parentId: 'loan', entryId: 'missing' })).toBeNull();
    expect(describeSource(withParents, { kind: 'loan-payment', parentId: 'wrong', entryId: 'loan-payment' })).toBeNull();
  });

  it('checks linked loan and emergency transactions and reports duplicate linked payments', () => {
    const loan: Loan = {
      id: 'loan', name: 'Car loan', principal: 100, ratePct: 1, tenureMonths: 1,
      emi: 100, startDate: '2026-01-01',
      payments: [{ id: 'payment', date: '2026-01-01', amount: 10, note: '', kind: 'EMI' }],
    };
    const efGoal = initial().goals[0]!;
    const base = {
      ...initial(),
      loans: [loan],
      efEntries: [{ id: 'ef-entry', date: '2026-01-02', amount: 20, note: '' }],
    };
    const transactions = [
      { id: 'loan-one', type: 'income' as const, amount: 11, date: '2026-01-03', category: '', note: '', source: { kind: 'loan-payment' as const, parentId: 'loan', entryId: 'payment' } },
      { id: 'loan-two', type: 'expense' as const, amount: 10, date: '2026-01-01', category: '', note: '', source: { kind: 'loan-payment' as const, parentId: 'loan', entryId: 'payment' } },
      { id: 'ef-tx', type: 'expense' as const, amount: 20, date: '2026-01-02', category: '', note: '', source: { kind: 'ef-entry' as const, parentId: efGoal.id, entryId: 'ef-entry' } },
      { id: 'orphan-plan', type: 'invest' as const, amount: 10, date: '2026-01-01', category: '', note: '', source: { kind: 'plan-log' as const, parentId: 'missing-plan', entryId: 'missing-log' } },
      { id: 'orphan-ef', type: 'invest' as const, amount: 10, date: '2026-01-01', category: '', note: '', source: { kind: 'ef-entry' as const, parentId: 'wrong-goal', entryId: 'missing-ef' } },
    ];
    const issues = validateIntegrity({ ...base, transactions });
    expect(issues.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'linked-drift', 'duplicate-source', 'duplicate-linked-entry', 'orphan-source',
    ]));
  });

  it('keeps the seeded EMI transaction amount aligned with its loan payments', () => {
    const transaction = mockAppData.transactions.find((item) => item.id === 'tx-emi');
    const loan = mockAppData.loans[0]!;
    expect(transaction?.amount).toBe(6_281);
    expect(transaction?.amount).toBe(loan.payments[0]?.amount);
  });
});
