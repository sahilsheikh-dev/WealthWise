import { deleteTransaction, emptyAppData, updateTransaction, NotFoundError } from '../actions';
import { LinkedTransactionError, findLinkedTransaction, investCategoryFor, validateIntegrity } from '../links';
import { loanState } from '../liability';
import {
  addPlan, deletePlan, updatePlan,
} from '../planActions';
import { addInvestmentEntry, deleteInvestmentEntry, updateInvestmentEntry } from '../investmentActions';
import { addHolding } from '../holdingActions';
import {
  addLiability, addLiabilityPayment, deleteLiability, deleteLiabilityPayment, updateLiability, updateLiabilityPayment,
} from '../liabilityActions';
import { behindBy } from '../sip';
import { mockAppData } from '../../mock/data';
import type { AppData, OneTimeLiability, PlanHolding, RecurringLiability } from '../types';

const makePlan = (): Omit<PlanHolding, 'id' | 'kind' | 'logs'> => ({
  name: 'Monthly SIP',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 10_000,
  ratePct: 12,
  stepUpPct: 0,
  tenureYears: 10,
  startDate: '2026-07-01',
  trackFrom: '2026-07-01',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
});
const makeLiability = (): Omit<RecurringLiability, 'id' | 'payments' | 'emi' | 'settlement'> & { emi: number | null } => ({
  kind: 'recurring',
  type: 'Other',
  name: 'Home loan',
  principal: 100_000,
  ratePct: 12,
  tenureMonths: 12,
  startDate: '2026-01-01',
  emi: null,
});
const idSequence = (...ids: string[]) => {
  let index = 0;
  return () => ids[index++] ?? `id-${index}`;
};
const empty = (): AppData => emptyAppData('2026-07-01');

describe('linked log and payment actions', () => {
  it('validates empty/mock data, source integrity, duplicate ids and source lookups', () => {
    expect(validateIntegrity(empty())).toEqual([]);
    expect(validateIntegrity(mockAppData)).toEqual([]);
    const planData = addPlan(empty(), makePlan(), () => 'plan');
    const withLog = addInvestmentEntry(planData, 'plan', { date: '2026-07-01', amount: 10, note: '', kind: 'Deposit' }, idSequence('log', 'tx'), '2026-07-01');
    expect(findLinkedTransaction(withLog, 'holding-entry', 'log')).toMatchObject({ id: 'tx' });
    expect(investCategoryFor('Mutual fund / SIP')).toBe('Mutual fund / SIP');
    expect(investCategoryFor('Stocks / ETF')).toBe('Stocks / ETF');
    expect(investCategoryFor('Recurring deposit')).toBe('Fixed deposit / RD');
    expect(investCategoryFor('Fixed deposit')).toBe('Fixed deposit / RD');
    expect(investCategoryFor('Gold')).toBe('Gold / Silver');
    expect(investCategoryFor('Silver')).toBe('Gold / Silver');
    expect(investCategoryFor('EPFO / PF')).toBe('Other investments');
    expect(investCategoryFor('Savings account')).toBe('Other investments');
    expect(investCategoryFor('Cash')).toBe('Other investments');
    expect(investCategoryFor('Other')).toBe('Other investments');
    expect(validateIntegrity(withLog)).toEqual([]);
    const broken: AppData = {
      ...withLog,
      transactions: [
        ...withLog.transactions,
        { ...withLog.transactions[0]!, id: 'tx2' },
        { ...withLog.transactions[0]!, id: 'tx3', source: { kind: 'liability-payment', parentId: 'missing', entryId: 'log' } },
      ],
      goals: [],
      holdings: [{ ...withLog.holdings[0]!, ...(withLog.holdings[0]?.kind === 'plan' ? { logs: [...withLog.holdings[0].logs, withLog.holdings[0].logs[0]!] } : {}) }],
    };
    expect(validateIntegrity(broken).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'duplicate-source', 'orphan-source', 'emergency-goal-count', 'duplicate-id',
    ]));
  });

  it('leaves unrelated holdings unchanged when a plan is updated', () => {
    let data = addPlan(empty(), makePlan(), () => 'plan');
    data = addHolding(data, {
      name: 'Manual', type: 'Cash', invested: 10, value: 10, valueAsOf: '2026-07-01',
    }, () => 'manual');
    data = updatePlan(data, 'plan', { name: 'Updated plan' });
    expect(data.holdings[0]?.name).toBe('Updated plan');
    expect(data.holdings[1]?.name).toBe('Manual');
  });

  it('performs the complete plan scenario immutably, links, syncs, removes, and keeps transactions', () => {
    let data = empty();
    const planInput = makePlan();
    const initialInput = structuredClone(planInput);
    data = addPlan(data, planInput, () => 'plan-1');
    expect(planInput).toEqual(initialInput);
    expect(data.holdings[0]?.id).toBe('plan-1');
    expect(validateIntegrity(data)).toEqual([]);
    data = addInvestmentEntry(data, 'plan-1', { date: '2026-07-05', amount: 10_000, note: 'July', kind: 'Deposit' }, idSequence('jul', 'tx-jul'), '2026-10-09');
    data = addInvestmentEntry(data, 'plan-1', { date: '2026-08-05', amount: 10_000, note: 'August', kind: 'Deposit' }, idSequence('aug', 'tx-aug'), '2026-10-09');
    data = addInvestmentEntry(data, 'plan-1', { date: '2026-09-05', amount: 10_000, note: 'September', kind: 'Deposit' }, idSequence('sep', 'tx-sep'), '2026-10-09');
    expect(behindBy(data.holdings[0] as PlanHolding, '2026-10-09')).toBe(1);
    expect(validateIntegrity(data)).toEqual([]);
    const before = data;
    data = updateInvestmentEntry(data, 'plan-1', 'aug', { amount: 11_000, date: '2026-08-06' }, '2026-10-09');
    expect(data.transactions.find((row) => row.id === 'tx-aug')).toMatchObject({ amount: 11_000, date: '2026-08-06' });
    expect(before.transactions.find((row) => row.id === 'tx-aug')?.amount).toBe(10_000);
    data = deleteInvestmentEntry(data, 'plan-1', 'sep');
    expect(data.transactions.some((row) => row.id === 'tx-sep')).toBe(false);
    data = updatePlan(data, 'plan-1', { amount: 12_000 });
    expect((data.holdings[0] as PlanHolding).logs).toHaveLength(2);
    expect(validateIntegrity(data)).toEqual([]);
    data = deletePlan(data, 'plan-1', { linkedTransactions: 'keep' });
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions.every((row) => row.source === undefined)).toBe(true);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('deletes linked plan transactions in delete mode and rejects invalid/unknown mutations atomically', () => {
    let data = addPlan(empty(), makePlan(), () => 'p');
    data = addInvestmentEntry(data, 'p', { date: '2026-07-01', amount: 50, note: '', kind: 'Deposit' }, idSequence('entry', 'txn'), '2026-07-01');
    const original = data;
    expect(() => updatePlan(data, 'p', { trackFrom: '2026-06-30' })).toThrow("Tracking can't start before the plan");
    expect(data).toBe(original);
    expect(() => addInvestmentEntry(data, 'absent', { date: '2026-07-01', amount: 1, note: '', kind: 'Deposit' }, () => 'x', '2026-07-01')).toThrow(NotFoundError);
    expect(() => updateInvestmentEntry(data, 'p', 'absent', { note: 'x' }, '2026-07-01')).toThrow(NotFoundError);
    expect(() => deleteInvestmentEntry(data, 'p', 'absent')).toThrow(NotFoundError);
    expect(() => deletePlan(data, 'absent', { linkedTransactions: 'delete' })).toThrow(NotFoundError);
    data = deletePlan(data, 'p', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([]);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('creates an auto-EMI loan, syncs payments and removes linked transactions', () => {
    let data = addLiability(empty(), makeLiability(), () => 'loan-1');
    expect(data.liabilities[0]?.kind === 'recurring' ? data.liabilities[0].emi : null).toBe(8_885);
    expect(validateIntegrity(data)).toEqual([]);
    for (const [date, id] of [['2026-02-01', 'p1'], ['2026-03-01', 'p2'], ['2026-04-01', 'p3']] as const) {
      data = addLiabilityPayment(data, 'loan-1', { date, amount: 8_885, kind: 'EMI', note: '' }, { newId: idSequence(id, `tx-${id}`) });
      expect(validateIntegrity(data)).toEqual([]);
    }
    expect(loanState(data.liabilities[0]!, '2026-04-02').balance).toBeLessThan(100_000);
    data = updateLiabilityPayment(data, 'loan-1', 'p2', { amount: 9000, kind: 'Prepayment', date: '2026-03-02' });
    expect(findLinkedTransaction(data, 'liability-payment', 'p2')).toMatchObject({ amount: 9000, date: '2026-03-02', note: 'Home loan prepayment' });
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteLiabilityPayment(data, 'loan-1', 'p3');
    expect(findLinkedTransaction(data, 'liability-payment', 'p3')).toBeUndefined();
    data = updateLiability(data, 'loan-1', { emi: null, ratePct: 0 });
    expect(data.liabilities[0]?.kind === 'recurring' ? data.liabilities[0].emi : null).toBe(Math.round(100_000 / 12));
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteLiability(data, 'loan-1', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([]);
    expect(data.liabilities).toEqual([]);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('preserves linked transactions when deleting a loan and rejects unknown child ids', () => {
    let data = addLiability(empty(), makeLiability(), () => 'loan');
    data = addLiabilityPayment(data, 'loan', { date: '2026-01-02', amount: 100, kind: 'EMI', note: '' }, { newId: idSequence('payment', 'transaction') });
    expect(() => updateLiabilityPayment(data, 'loan', 'missing', { amount: 5 })).toThrow(NotFoundError);
    expect(() => deleteLiabilityPayment(data, 'loan', 'missing')).toThrow(NotFoundError);
    expect(() => updateLiability(data, 'missing', { name: 'no' })).toThrow(NotFoundError);
    expect(() => deleteLiability(data, 'missing', { linkedTransactions: 'keep' })).toThrow(NotFoundError);
    data = deleteLiability(data, 'loan', { linkedTransactions: 'keep' });
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]?.source).toBeUndefined();
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('creates, updates, partially pays, and deletes one-time liabilities with synchronized links', () => {
    const input: Omit<OneTimeLiability, 'id' | 'payments'> = {
      kind: 'one-time',
      name: 'Friend',
      type: 'Borrowed money',
      principal: 100,
      ratePct: 0,
      startDate: '2026-01-01',
      dueDate: null,
    };
    expect(() => addLiability(empty(), { ...input, dueDate: '2025-12-31' }, () => 'invalid'))
      .toThrow('Due date cannot be before the liability started');
    let data = addLiability(empty(), input, () => 'friend');
    expect(validateIntegrity(data)).toEqual([]);
    data = updateLiability(data, 'friend', { dueDate: '2026-02-01', name: 'Updated friend' });
    expect(() => addLiabilityPayment(
      data, 'friend', { date: '2026-01-02', amount: 20, kind: 'EMI', note: '' },
      { newId: idSequence('invalid-entry', 'invalid-tx') },
    )).toThrow('One-time liabilities use Payment entries');
    data = addLiabilityPayment(
      data, 'friend', { date: '2026-01-02', amount: 20, kind: 'Payment', note: '' },
      { newId: idSequence('payment', 'payment-tx') },
    );
    expect(findLinkedTransaction(data, 'liability-payment', 'payment'))
      .toMatchObject({ type: 'expense', category: 'Other', note: 'Updated friend payment' });
    expect(() => addLiabilityPayment(
      data, 'friend', { date: '2026-01-03', amount: 81, kind: 'Payment', note: '' },
      { newId: idSequence('too-large', 'too-large-tx') },
    )).toThrow('Payment exceeds the outstanding balance');
    expect(() => updateLiabilityPayment(data, 'friend', 'payment', { kind: 'EMI' }))
      .toThrow('One-time liabilities use Payment entries');
    expect(() => updateLiabilityPayment(data, 'friend', 'payment', { amount: 101 }))
      .toThrow('Payment exceeds the outstanding balance');
    data = updateLiabilityPayment(data, 'friend', 'payment', { amount: 25, date: '2026-01-03' });
    expect(findLinkedTransaction(data, 'liability-payment', 'payment'))
      .toMatchObject({ amount: 25, date: '2026-01-03' });
    data = updateLiability(data, 'friend', { dueDate: null });
    expect(data.liabilities[0]).toMatchObject({ dueDate: null });
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteLiabilityPayment(data, 'friend', 'payment');
    expect(findLinkedTransaction(data, 'liability-payment', 'payment')).toBeUndefined();
    data = addLiabilityPayment(
      data, 'friend', { date: '2026-01-05', amount: 10, kind: 'Payment', note: '' },
      { newId: idSequence('kept-payment', 'kept-tx') },
    );
    data = deleteLiability(data, 'friend', { linkedTransactions: 'keep' });
    expect(data.transactions[0]?.source).toBeUndefined();
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('restricts transaction editing and deletion when a transaction is linked', () => {
    let data = addPlan(empty(), makePlan(), () => 'p');
    data = addInvestmentEntry(data, 'p', { date: '2026-07-01', amount: 100, note: '', kind: 'Deposit' }, idSequence('l', 'tx'), '2026-07-01');
    const transaction = data.transactions[0]!;
    expect(updateTransaction(data, transaction.id, { note: 'Renamed' }).transactions[0]?.note).toBe('Renamed');
    expect(updateTransaction(data, transaction.id, { amount: transaction.amount, note: 'Renamed' }).transactions[0]?.note).toBe('Renamed');
    expect(() => updateTransaction(data, transaction.id, { amount: 200 })).toThrow(LinkedTransactionError);
    expect(() => updateTransaction(data, transaction.id, { type: 'expense' })).toThrow(LinkedTransactionError);
    expect(() => deleteTransaction(data, transaction.id)).toThrow(LinkedTransactionError);
  });

  it('covers linked plan logs, parent-kind checks, unmatched transactions and paired-value invariants', () => {
    let data = empty();
    const planInput = makePlan();
    expect(() => addPlan(data, { ...planInput, actualValue: 10 }, () => 'invalid')).toThrow('Actual value and snapshot date');
    data = { ...data, holdings: [mockAppData.holdings[0]!] };
    data = addPlan(data, makePlan(), () => 'p');
    expect(() => updatePlan(data, 'holding-pf', { amount: 1 })).toThrow(NotFoundError);
    expect(() => updatePlan(data, 'p', { actualValue: 10 })).toThrow('Actual value and snapshot date');
    const withLinkedLog = addInvestmentEntry(data, 'p', { date: '2026-07-01', amount: 20, note: '', kind: 'Deposit' }, idSequence('linked-log', 'linked-log-tx'), '2026-07-01');
    const noteOnly = updateInvestmentEntry(withLinkedLog, 'p', 'linked-log', { note: 'private' }, '2026-07-01');
    expect(noteOnly.transactions[0]).toMatchObject({ amount: 20, note: 'Monthly SIP installment' });
    const withTxn = addInvestmentEntry(noteOnly, 'p', { date: '2026-07-02', amount: 30, note: '', kind: 'Deposit' }, idSequence('linked', 'tx'), '2026-07-02');
    const noteUpdate = updateInvestmentEntry(withTxn, 'p', 'linked', { note: 'changed' }, '2026-07-02');
    expect(findLinkedTransaction(noteUpdate, 'holding-entry', 'linked')).toMatchObject({ amount: 30 });
    const firstTransaction = findLinkedTransaction(noteUpdate, 'holding-entry', 'linked-log')!;
    const extra = { ...firstTransaction, id: 'ordinary', source: undefined };
    const withOrdinary = { ...noteUpdate, transactions: [...noteUpdate.transactions, extra] };
    const removed = deleteInvestmentEntry(withOrdinary, 'p', 'linked');
    expect(removed.transactions).toEqual([noteOnly.transactions[0], extra]);
    expect(() => addPlan(data, { ...planInput, trackFrom: '2026-06-30' }, () => 'bad')).toThrow("Tracking can't start before the plan");
    expect(validateIntegrity({
      ...empty(),
      goals: [],
      efEntries: [{ id: 'e', date: '2026-07-01', amount: 1, note: '' }],
      transactions: [{
        id: 'ef-tx', type: 'expense', amount: 1, date: '2026-07-01', category: 'Other', note: '',
        source: { kind: 'ef-entry', parentId: 'goal-emergency', entryId: 'e' },
      }],
    })).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'emergency-goal-count' })]));
  });

  it('covers no-transaction loan payments, EMI alternatives and deletion filtering branches', () => {
    let data = addLiability(empty(), { ...makeLiability(), emi: 9000 }, () => 'loan');
    data = addLiability(data, makeLiability(), () => 'auto');
    expect(data.liabilities[1]?.kind === 'recurring' ? data.liabilities[1].emi : null).toBe(8_885);
    data = updateLiability(data, 'loan', { name: 'Updated' });
    data = updateLiability(data, 'loan', { emi: 9500 });
    expect(data.liabilities[0]?.kind === 'recurring' ? data.liabilities[0].emi : null).toBe(9500);
    data = addLiabilityPayment(data, 'loan', { date: '2026-02-01', amount: 50, kind: 'EMI', note: '' }, { newId: idSequence('private-entry', 'private-tx') });
    data = updateLiabilityPayment(data, 'loan', 'private-entry', { note: 'Only entry changed' });
    expect(data.transactions[0]).toMatchObject({ amount: 50, note: 'Updated EMI' });
    data = deleteLiabilityPayment(data, 'loan', 'private-entry');
    data = addLiabilityPayment(data, 'loan', { date: '2026-03-01', amount: 100, kind: 'EMI', note: '' }, { newId: idSequence('linked', 'linked-tx') });
    expect(data.transactions[0]?.note).toBe('Updated EMI');
    data = updateLiabilityPayment(data, 'loan', 'linked', { amount: 110 });
    expect(data.transactions[0]?.amount).toBe(110);
    data = updateLiabilityPayment(data, 'loan', 'linked', { kind: 'Prepayment' });
    expect(data.transactions[0]?.note).toBe('Updated prepayment');
    const ordinary = { ...data.transactions[0]!, id: 'ordinary', source: undefined };
    data = { ...data, transactions: [...data.transactions, ordinary] };
    data = deleteLiabilityPayment(data, 'loan', 'linked');
    expect(data.transactions).toEqual([ordinary]);
    data = deleteLiability(data, 'loan', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([ordinary]);
    expect(data.liabilities.map(({ id }) => id)).toEqual(['auto']);
    data = deleteLiability(data, 'auto', { linkedTransactions: 'keep' });
    expect(data.liabilities).toEqual([]);
  });
});
