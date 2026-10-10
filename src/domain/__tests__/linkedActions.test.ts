import { deleteTransaction, emptyAppData, updateTransaction, NotFoundError } from '../actions';
import { LinkedTransactionError, findLinkedTransaction, investCategoryFor, validateIntegrity } from '../links';
import { loanState } from '../loan';
import {
  addPlan, addPlanLog, deletePlan, deletePlanLog, updatePlan, updatePlanLog,
} from '../planActions';
import {
  addLoan, addLoanPayment, deleteLoan, deleteLoanPayment, updateLoan, updateLoanPayment,
} from '../loanActions';
import { behindBy } from '../sip';
import { mockAppData } from '../../mock/data';
import type { AppData, Loan, PlanHolding } from '../types';

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
const makeLoan = (): Omit<Loan, 'id' | 'payments' | 'emi'> & { emi: number | null } => ({
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
    const withLog = addPlanLog(planData, 'plan', { date: '2026-07-01', amount: 10, note: '' }, { recordTransaction: true, newId: idSequence('log', 'tx') });
    expect(findLinkedTransaction(withLog, 'plan-log', 'log')).toMatchObject({ id: 'tx' });
    expect(investCategoryFor('Mutual fund / SIP')).toBe('Mutual fund / SIP');
    expect(investCategoryFor('Stocks / ETF')).toBe('Stocks / ETF');
    expect(investCategoryFor('Recurring deposit')).toBe('Fixed deposit / RD');
    expect(investCategoryFor('Gold')).toBe('Gold / Silver');
    expect(investCategoryFor('Silver')).toBe('Gold / Silver');
    expect(investCategoryFor('EPFO / PF')).toBe('Other');
    expect(validateIntegrity(withLog)).toEqual([]);
    const broken: AppData = {
      ...withLog,
      transactions: [
        ...withLog.transactions,
        { ...withLog.transactions[0]!, id: 'tx2' },
        { ...withLog.transactions[0]!, id: 'tx3', source: { kind: 'loan-payment', parentId: 'missing', entryId: 'log' } },
      ],
      goals: [],
      holdings: [{ ...withLog.holdings[0]!, ...(withLog.holdings[0]?.kind === 'plan' ? { logs: [...withLog.holdings[0].logs, withLog.holdings[0].logs[0]!] } : {}) }],
    };
    expect(validateIntegrity(broken).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'duplicate-source', 'orphan-source', 'emergency-goal-count', 'duplicate-id',
    ]));
  });

  it('performs the complete plan scenario immutably, links, syncs, removes, and keeps transactions', () => {
    let data = empty();
    const planInput = makePlan();
    const initialInput = structuredClone(planInput);
    data = addPlan(data, planInput, () => 'plan-1');
    expect(planInput).toEqual(initialInput);
    expect(data.holdings[0]?.id).toBe('plan-1');
    expect(validateIntegrity(data)).toEqual([]);
    data = addPlanLog(data, 'plan-1', { date: '2026-07-05', amount: 10_000, note: 'July' }, { recordTransaction: true, newId: idSequence('jul', 'tx-jul') });
    data = addPlanLog(data, 'plan-1', { date: '2026-08-05', amount: 10_000, note: 'August' }, { recordTransaction: true, newId: idSequence('aug', 'tx-aug') });
    data = addPlanLog(data, 'plan-1', { date: '2026-09-05', amount: 10_000, note: 'September' }, { recordTransaction: true, newId: idSequence('sep', 'tx-sep') });
    expect(behindBy(data.holdings[0] as PlanHolding, '2026-10-09')).toBe(1);
    expect(validateIntegrity(data)).toEqual([]);
    const before = data;
    data = updatePlanLog(data, 'plan-1', 'aug', { amount: 11_000, date: '2026-08-06' });
    expect(data.transactions.find((row) => row.id === 'tx-aug')).toMatchObject({ amount: 11_000, date: '2026-08-06' });
    expect(before.transactions.find((row) => row.id === 'tx-aug')?.amount).toBe(10_000);
    data = deletePlanLog(data, 'plan-1', 'sep');
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
    data = addPlanLog(data, 'p', { date: '2026-07-01', amount: 50, note: '' }, { recordTransaction: true, newId: idSequence('entry', 'txn') });
    const original = data;
    expect(() => updatePlan(data, 'p', { trackFrom: '2026-06-30' })).toThrow("Tracking can't start before the plan");
    expect(data).toBe(original);
    expect(() => addPlanLog(data, 'absent', { date: '2026-07-01', amount: 1, note: '' }, { recordTransaction: false, newId: () => 'x' })).toThrow(NotFoundError);
    expect(() => updatePlanLog(data, 'p', 'absent', { note: 'x' })).toThrow(NotFoundError);
    expect(() => deletePlanLog(data, 'p', 'absent')).toThrow(NotFoundError);
    expect(() => deletePlan(data, 'absent', { linkedTransactions: 'delete' })).toThrow(NotFoundError);
    data = deletePlan(data, 'p', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([]);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('creates an auto-EMI loan, syncs payments and removes linked transactions', () => {
    let data = addLoan(empty(), makeLoan(), () => 'loan-1');
    expect(data.loans[0]?.emi).toBe(8_885);
    expect(validateIntegrity(data)).toEqual([]);
    for (const [date, id] of [['2026-02-01', 'p1'], ['2026-03-01', 'p2'], ['2026-04-01', 'p3']] as const) {
      data = addLoanPayment(data, 'loan-1', { date, amount: 8_885, kind: 'EMI', note: '' }, { recordTransaction: true, newId: idSequence(id, `tx-${id}`) });
      expect(validateIntegrity(data)).toEqual([]);
    }
    expect(loanState(data.loans[0]!, '2026-04-02').balance).toBeLessThan(100_000);
    data = updateLoanPayment(data, 'loan-1', 'p2', { amount: 9000, kind: 'Prepayment', date: '2026-03-02' });
    expect(findLinkedTransaction(data, 'loan-payment', 'p2')).toMatchObject({ amount: 9000, date: '2026-03-02', note: 'Home loan prepayment' });
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteLoanPayment(data, 'loan-1', 'p3');
    expect(findLinkedTransaction(data, 'loan-payment', 'p3')).toBeUndefined();
    data = updateLoan(data, 'loan-1', { emi: null, ratePct: 0 });
    expect(data.loans[0]?.emi).toBe(Math.round(100_000 / 12));
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteLoan(data, 'loan-1', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([]);
    expect(data.loans).toEqual([]);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('preserves linked transactions when deleting a loan and rejects unknown child ids', () => {
    let data = addLoan(empty(), makeLoan(), () => 'loan');
    data = addLoanPayment(data, 'loan', { date: '2026-01-02', amount: 100, kind: 'EMI', note: '' }, { recordTransaction: true, newId: idSequence('payment', 'transaction') });
    expect(() => updateLoanPayment(data, 'loan', 'missing', { amount: 5 })).toThrow(NotFoundError);
    expect(() => deleteLoanPayment(data, 'loan', 'missing')).toThrow(NotFoundError);
    expect(() => updateLoan(data, 'missing', { name: 'no' })).toThrow(NotFoundError);
    expect(() => deleteLoan(data, 'missing', { linkedTransactions: 'keep' })).toThrow(NotFoundError);
    data = deleteLoan(data, 'loan', { linkedTransactions: 'keep' });
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0]?.source).toBeUndefined();
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('restricts transaction editing and deletion when a transaction is linked', () => {
    let data = addPlan(empty(), makePlan(), () => 'p');
    data = addPlanLog(data, 'p', { date: '2026-07-01', amount: 100, note: '' }, { recordTransaction: true, newId: idSequence('l', 'tx') });
    const transaction = data.transactions[0]!;
    expect(updateTransaction(data, transaction.id, { note: 'Renamed' }).transactions[0]?.note).toBe('Renamed');
    expect(updateTransaction(data, transaction.id, { amount: transaction.amount, note: 'Renamed' }).transactions[0]?.note).toBe('Renamed');
    expect(() => updateTransaction(data, transaction.id, { amount: 200 })).toThrow(LinkedTransactionError);
    expect(() => updateTransaction(data, transaction.id, { type: 'expense' })).toThrow(LinkedTransactionError);
    expect(() => deleteTransaction(data, transaction.id)).toThrow(LinkedTransactionError);
  });

  it('covers unlinked plan logs, parent-kind checks, unmatched transactions and paired-value invariants', () => {
    let data = empty();
    const planInput = makePlan();
    expect(() => addPlan(data, { ...planInput, actualValue: 10 }, () => 'invalid')).toThrow('Actual value and snapshot date');
    data = { ...data, holdings: [mockAppData.holdings[0]!] };
    data = addPlan(data, makePlan(), () => 'p');
    expect(() => updatePlan(data, 'holding-pf', { amount: 1 })).toThrow(NotFoundError);
    expect(() => updatePlan(data, 'p', { actualValue: 10 })).toThrow('Actual value and snapshot date');
    const withNoTxn = addPlanLog(data, 'p', { date: '2026-07-01', amount: 20, note: '' }, { recordTransaction: false, newId: () => 'unlinked' });
    const noteOnly = updatePlanLog(withNoTxn, 'p', 'unlinked', { note: 'private' });
    expect(noteOnly.transactions).toEqual([]);
    const withTxn = addPlanLog(noteOnly, 'p', { date: '2026-07-02', amount: 30, note: '' }, { recordTransaction: true, newId: idSequence('linked', 'tx') });
    const noteUpdate = updatePlanLog(withTxn, 'p', 'linked', { note: 'changed' });
    expect(noteUpdate.transactions[0]?.amount).toBe(30);
    const extra = { ...noteUpdate.transactions[0]!, id: 'ordinary', source: undefined };
    const withOrdinary = { ...noteUpdate, transactions: [...noteUpdate.transactions, extra] };
    const removed = deletePlanLog(withOrdinary, 'p', 'linked');
    expect(removed.transactions).toEqual([extra]);
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
    let data = addLoan(empty(), { ...makeLoan(), emi: 9000 }, () => 'loan');
    data = addLoan(data, makeLoan(), () => 'auto');
    expect(data.loans[1]?.emi).toBe(8_885);
    data = updateLoan(data, 'loan', { name: 'Updated' });
    data = updateLoan(data, 'loan', { emi: 9500 });
    expect(data.loans[0]?.emi).toBe(9500);
    data = addLoanPayment(data, 'loan', { date: '2026-02-01', amount: 50, note: '' }, { recordTransaction: false, newId: () => 'private' });
    data = updateLoanPayment(data, 'loan', 'private', { note: 'Only entry changed' });
    expect(data.transactions).toEqual([]);
    data = addLoanPayment(data, 'loan', { date: '2026-03-01', amount: 100, note: '' }, { recordTransaction: true, newId: idSequence('linked', 'linked-tx') });
    expect(data.transactions[0]?.note).toBe('Updated EMI');
    data = updateLoanPayment(data, 'loan', 'linked', { amount: 110 });
    expect(data.transactions[0]?.amount).toBe(110);
    data = updateLoanPayment(data, 'loan', 'linked', { kind: 'Prepayment' });
    expect(data.transactions[0]?.note).toBe('Updated prepayment');
    const ordinary = { ...data.transactions[0]!, id: 'ordinary', source: undefined };
    data = { ...data, transactions: [...data.transactions, ordinary] };
    data = deleteLoanPayment(data, 'loan', 'linked');
    expect(data.transactions).toEqual([ordinary]);
    data = deleteLoan(data, 'loan', { linkedTransactions: 'delete' });
    expect(data.transactions).toEqual([ordinary]);
    expect(data.loans.map(({ id }) => id)).toEqual(['auto']);
    data = deleteLoan(data, 'auto', { linkedTransactions: 'keep' });
    expect(data.loans).toEqual([]);
  });
});
