import { addHolding } from '../holdingActions';
import {
  addInstrumentTransaction,
  createMissingTransactions,
  deleteLinkedTransaction,
  findUnlinkedEntries,
  linkExistingTransaction,
  listInstruments,
  updateLinkedTransaction,
} from '../instruments';
import { LinkedTransactionError, validateIntegrity } from '../links';
import { deleteInvestmentEntry, updateInvestmentEntry } from '../investmentActions';
import { addPlan } from '../planActions';
import { emptyAppData } from '../actions';
import type { AppData, Transaction } from '../types';
import { mockAppData } from '../../mock/data';

const today = '2026-10-10';
const ids = (...values: string[]) => {
  let index = 0;
  return () => values[index++] ?? `generated-${index}`;
};
const empty = () => emptyAppData(today);
const addManual = (data: AppData, id: string, name: string, value = 10_000) => ({
  ...addHolding(data, {
    name, type: 'Gold', invested: value, value, valueAsOf: today,
  }, () => id),
});

describe('instrument-linked transactions', () => {
  it('creates, edits and deletes linked manual investment entries', () => {
    let data = addHolding(empty(), {
      name: 'Gold', type: 'Gold', invested: 10_000, value: 10_000, valueAsOf: '2026-10-01',
    }, () => 'gold');
    expect(listInstruments(data, today)[0]).toMatchObject({ id: 'gold', type: 'Gold', valueNow: 10_000 });

    data = addInstrumentTransaction(data, {
      kind: 'deposit', instrumentId: 'gold', amount: 500, date: '2026-10-02', note: 'Broker transfer',
    }, ids('gold-entry', 'gold-tx'), today);
    expect(data.holdings[0]?.logs).toMatchObject([{ id: 'gold-entry', amount: 500, kind: 'Deposit' }]);
    expect(data.transactions.at(-1)).toMatchObject({
      id: 'gold-tx', type: 'invest', category: 'Gold / Silver', note: 'Broker transfer',
      source: { kind: 'holding-entry', parentId: 'gold', entryId: 'gold-entry' },
    });
    expect(validateIntegrity(data)).toEqual([]);

    data = updateLinkedTransaction(data, 'gold-tx', { amount: 750, date: '2026-10-03', note: 'Corrected' }, {
      newId: ids(), today,
    });
    expect(data.holdings[0]?.logs[0]).toMatchObject({ amount: 750, date: '2026-10-03' });
    expect(data.transactions.at(-1)).toMatchObject({ amount: 750, date: '2026-10-03', note: 'Corrected' });
    expect(validateIntegrity(data)).toEqual([]);

    data = addInstrumentTransaction(data, {
      kind: 'withdrawal', instrumentId: 'gold', amount: 250, date: '2026-10-04', note: 'Sale',
    }, ids('sale-entry', 'sale-tx'), today);
    expect(data.transactions.at(-1)).toMatchObject({ type: 'income', category: 'Withdrawal', amount: 250 });
    expect(listInstruments(data, today).find((item) => item.id === 'gold')?.valueNow).toBe(10_500);
    expect(validateIntegrity(data)).toEqual([]);

    data = updateInvestmentEntry(data, 'gold', 'sale-entry', { amount: 300 }, today);
    expect(data.transactions.find((item) => item.id === 'sale-tx')?.amount).toBe(300);
    data = deleteInvestmentEntry(data, 'gold', 'sale-entry');
    expect(data.transactions.some((item) => item.id === 'sale-tx')).toBe(false);
    data = deleteLinkedTransaction(data, 'gold-tx');
    expect(data.holdings[0]?.logs).toEqual([]);
    expect(data.transactions.some((item) => item.id === 'gold-tx')).toBe(false);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('retargets between holdings while preserving transaction identity', () => {
    let data = addManual(empty(), 'gold', 'Gold');
    data = addManual(data, 'cash', 'Cash', 5_000);
    data = addInstrumentTransaction(data, {
      kind: 'deposit', instrumentId: 'gold', amount: 400, date: '2026-10-01', note: 'Move me',
    }, ids('initial-entry', 'stable-tx'), today);
    const oldEntryId = data.transactions[0]!.source!.entryId;

    data = updateLinkedTransaction(data, 'stable-tx', { instrumentId: 'cash', note: 'Retargeted' }, {
      newId: ids('cash-entry'), today,
    });
    expect(data.transactions[0]).toMatchObject({
      id: 'stable-tx', note: 'Retargeted', source: { kind: 'holding-entry', parentId: 'cash', entryId: 'cash-entry' },
    });
    expect(data.holdings.find((item) => item.id === 'gold')?.logs).toEqual([]);
    expect(data.holdings.find((item) => item.id === 'cash')?.logs[0]?.id).toBe('cash-entry');
    expect(data.holdings.some((item) => item.logs.some((entry) => entry.id === oldEntryId))).toBe(false);

    data = updateLinkedTransaction(data, 'stable-tx', { instrumentId: 'gold' }, { newId: ids('gold-again'), today });
    expect(data.transactions[0]?.source).toMatchObject({ kind: 'holding-entry', parentId: 'gold', entryId: 'gold-again' });
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('includes new same-day manual entries in the saved snapshot and reverses edits/deletes', () => {
    let data = addManual(empty(), 'same-day', 'Same day', 1_000);
    data = addInstrumentTransaction(data, {
      kind: 'deposit', instrumentId: 'same-day', amount: 500, date: today, note: '',
    }, ids('deposit-entry', 'deposit-tx'), today);
    expect(listInstruments(data, today).find((item) => item.id === 'same-day')?.valueNow).toBe(1_500);
    expect(data.holdings[0]?.logs[0]?.snapshotAdjustment).toBe(500);
    data = updateLinkedTransaction(data, 'deposit-tx', { amount: 700 }, { newId: ids(), today });
    expect(listInstruments(data, today).find((item) => item.id === 'same-day')?.valueNow).toBe(1_700);
    data = deleteLinkedTransaction(data, 'deposit-tx');
    expect(listInstruments(data, today).find((item) => item.id === 'same-day')?.valueNow).toBe(1_000);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('rejects failed destination guards atomically', () => {
    const holdings = addManual(empty(), 'manual', 'Manual', 100);
    const beforeDeposit = holdings;
    expect(() => addInstrumentTransaction(holdings, {
      kind: 'withdrawal', instrumentId: 'manual', amount: 101, date: '2026-10-01', note: '',
    }, ids('unused'), today)).toThrow('Exceeds the current value');
    expect(holdings).toBe(beforeDeposit);
    const planData = addPlan(empty(), {
      name: 'Future plan', type: 'Mutual fund / SIP', frequency: 'monthly', amount: 100,
      ratePct: 0, stepUpPct: 0, tenureYears: 2, startDate: '2026-10-05', trackFrom: '2026-10-05',
      opening: 100, actualValue: null, actualValueDate: null,
    }, () => 'plan');
    expect(() => addInstrumentTransaction(planData, {
      kind: 'deposit', instrumentId: 'plan', amount: 10, date: '2026-10-04', note: '',
    }, ids('unused'), today)).toThrow('Date is before the plan started');
    expect(() => addInstrumentTransaction(planData, {
      kind: 'deposit', instrumentId: 'plan', amount: 10, date: '2026-10-11', note: '',
    }, ids('unused'), today)).toThrow('Date cannot be in the future');

    const fixedDeposit = addHolding(empty(), {
      name: 'Fixed deposit', type: 'Fixed deposit', invested: 100, value: 100, valueAsOf: today,
    }, () => 'fixed');
    expect(() => addInstrumentTransaction(fixedDeposit, {
      kind: 'deposit', instrumentId: 'fixed', amount: 10, date: today, note: '',
    }, ids('unused'), today))
      .toThrow('Fixed deposit does not allow deposits or investment entries. Use a withdrawal for maturity payout.');
    const payout = addInstrumentTransaction(fixedDeposit, {
      kind: 'withdrawal', instrumentId: 'fixed', amount: 100, date: today, note: 'Maturity payout',
    }, ids('payout-entry', 'payout-tx'), today);
    expect(payout.holdings[0]?.logs[0]).toMatchObject({ kind: 'Withdrawal', amount: 100 });
    expect(payout.transactions[0]).toMatchObject({ type: 'income', category: 'Withdrawal' });
  });

  it('blocks transaction type/category patching and preserves liability transaction locks', () => {
    let data = addManual(empty(), 'gold', 'Gold');
    data = addInstrumentTransaction(data, {
      kind: 'deposit', instrumentId: 'gold', amount: 50, date: '2026-10-01', note: '',
    }, ids('entry', 'tx'), today);
    expect(() => updateLinkedTransaction(data, 'tx', { type: 'income' } as never, { newId: ids(), today }))
      .toThrow(LinkedTransactionError);
    expect(() => updateLinkedTransaction(data, 'tx', { category: 'Other' } as never, { newId: ids(), today }))
      .toThrow(LinkedTransactionError);
    const liabilityTx: Transaction = {
      id: 'liability', type: 'expense', amount: 10, date: '2026-10-01', category: 'EMI', note: '',
      source: { kind: 'liability-payment', parentId: 'liability-id', entryId: 'payment' },
    };
    data = { ...data, transactions: [...data.transactions, liabilityTx] };
    expect(() => updateLinkedTransaction(data, 'liability', { note: 'No' }, { newId: ids(), today }))
      .toThrow(LinkedTransactionError);
    expect(() => deleteLinkedTransaction(data, 'liability')).toThrow(LinkedTransactionError);
    expect(() => deleteLinkedTransaction(data, 'missing')).toThrow('Transaction with id "missing" was not found');
    expect(() => updateLinkedTransaction(data, 'missing', {}, { newId: ids(), today }))
      .toThrow('Transaction with id "missing" was not found');
  });

  it('rejects unsupported legacy-link targets and missing source entries', () => {
    const deposit: Transaction = {
      id: 'legacy', type: 'invest', amount: 10, date: '2026-10-01', category: 'Other', note: '',
    };
    const manual = addManual(empty(), 'manual', 'Manual');
    const unlinked = { ...manual, transactions: [deposit] };
    expect(() => linkExistingTransaction(unlinked, 'legacy', 'missing', ids(), today))
      .toThrow('Investment with id "missing" was not found');
    expect(() => linkExistingTransaction({
      ...manual,
      transactions: [{ ...deposit, id: 'expense', type: 'expense' }],
    }, 'expense', 'manual', ids(), today)).toThrow(LinkedTransactionError);
    expect(() => linkExistingTransaction({
      ...manual,
      transactions: [{ ...deposit, source: { kind: 'holding-entry', parentId: 'manual', entryId: 'old' } }],
    }, 'legacy', 'manual', ids(), today)).toThrow(LinkedTransactionError);
    const brokenLinked = {
      ...manual,
      transactions: [{
        ...deposit,
        source: { kind: 'holding-entry' as const, parentId: 'manual', entryId: 'missing-entry' },
      }],
    };
    expect(() => updateLinkedTransaction(brokenLinked, 'legacy', {}, { newId: ids(), today }))
      .toThrow('Investment entry with id "missing-entry" was not found');
    expect(() => deleteLinkedTransaction(brokenLinked, 'legacy'))
      .toThrow('Investment entry with id "missing-entry" was not found');
  });

  it('links old unlinked investments and backfills every missing entry in one pure action', () => {
    let data = addManual(empty(), 'manual', 'Manual');
    const legacy: Transaction = {
      id: 'legacy-tx', type: 'invest', amount: 200, date: '2026-10-01', category: 'Old category', note: 'Old deposit',
    };
    data = { ...data, transactions: [legacy] };
    data = linkExistingTransaction(data, 'legacy-tx', 'manual', ids('legacy-entry'), today);
    expect(data.transactions[0]).toMatchObject({
      category: 'Gold / Silver',
      source: { kind: 'holding-entry', parentId: 'manual', entryId: 'legacy-entry' },
    });
    expect(findUnlinkedEntries(data)).toEqual([]);

    const base = addManual(empty(), 'manual', 'Manual');
    const planHolding = mockAppData.holdings.find((holding) => holding.id === 'holding-sip');
    if (!planHolding || planHolding.kind !== 'plan') throw new Error('Plan fixture missing.');
    const withOldEntries: AppData = {
      ...base,
      holdings: [
        ...base.holdings.map((holding) => ({ ...holding, logs: [
          { id: 'deposit', date: '2026-10-01', amount: 100, kind: 'Deposit' as const, note: '' },
          { id: 'withdrawal', date: '2026-10-02', amount: 20, kind: 'Withdrawal' as const, note: '' },
        ] })),
        { ...planHolding, logs: [{ id: 'plan-deposit', date: '2026-10-02', amount: 200, kind: 'Deposit', note: '' }] },
      ],
      liabilities: [{
        id: 'debt', kind: 'one-time', name: 'Debt', type: 'Other', principal: 100,
        ratePct: 0, startDate: '2026-09-01', dueDate: null,
        payments: [{ id: 'payment', date: '2026-10-03', amount: 10, kind: 'Payment', note: '' }],
      }],
    };
    expect(findUnlinkedEntries(withOldEntries)).toHaveLength(4);
    const backfilled = createMissingTransactions(
      withOldEntries,
      ids('tx-deposit', 'tx-withdrawal', 'tx-plan', 'tx-payment'),
    );
    expect(backfilled.transactions).toHaveLength(4);
    expect(backfilled.transactions.map((item) => item.type)).toEqual(['invest', 'income', 'invest', 'expense']);
    expect(backfilled.transactions[2]).toMatchObject({
      id: 'tx-plan',
      note: 'Retirement fund installment',
    });
    expect(validateIntegrity(backfilled)).toEqual([]);
    expect(findUnlinkedEntries(backfilled)).toEqual([]);
    expect(createMissingTransactions(backfilled, ids())).toBe(backfilled);
  });
});
