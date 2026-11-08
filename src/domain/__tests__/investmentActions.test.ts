import { emptyAppData } from '../actions';
import { validateIntegrity } from '../links';
import { addHolding } from '../holdingActions';
import {
  addInvestmentEntry,
  deleteHoldingWithTransactions,
  deleteInvestmentEntry,
  syncHoldingTransactions,
  updateInvestmentEntry,
} from '../investmentActions';
import { holdingInvested, holdingValue } from '../portfolio';
import { addPlan } from '../planActions';
import { planInvested, planValue } from '../sip';
import type { AppData, PlanHolding } from '../types';

const idSequence = (...ids: string[]) => {
  let index = 0;
  return () => ids[index++] ?? `generated-${index}`;
};

const empty = (): AppData => emptyAppData('2026-10-10');

describe('investment ledger actions and valuation', () => {
  it('records manual deposits and withdrawals with linked transactions and updates/deletes both sides', () => {
    let data = addHolding(empty(), {
      name: 'Gold', type: 'Gold', invested: 10_000, value: 10_000, valueAsOf: '2026-10-01',
    }, () => 'manual');
    data = addInvestmentEntry(data, 'manual', {
      date: '2026-10-02', amount: 5_000, kind: 'Deposit', note: '',
    }, idSequence('deposit', 'deposit-tx'), '2026-10-10');
    expect(data.transactions[0]).toMatchObject({
      type: 'invest', category: 'Gold / Silver', note: 'Gold deposit', amount: 5_000,
    });
    expect(holdingInvested(data.holdings[0]!)).toBe(15_000);
    expect(holdingValue(data.holdings[0]!, '2026-10-10')).toBe(15_000);
    expect(validateIntegrity(data)).toEqual([]);

    data = addInvestmentEntry(data, 'manual', {
      date: '2026-10-03', amount: 2_000, kind: 'Withdrawal', note: '',
    }, idSequence('withdrawal', 'withdrawal-tx'), '2026-10-10');
    expect(data.transactions[1]).toMatchObject({
      type: 'income', category: 'Withdrawal', note: 'Gold withdrawal', amount: 2_000,
    });
    expect(holdingInvested(data.holdings[0]!)).toBe(15_000);
    expect(holdingValue(data.holdings[0]!, '2026-10-10')).toBe(13_000);
    expect(validateIntegrity(data)).toEqual([]);

    const beforeRejectedWithdrawal = data;
    expect(() => addInvestmentEntry(data, 'manual', {
      date: '2026-10-04', amount: 13_001, kind: 'Withdrawal', note: '',
    }, idSequence('bad', 'bad-tx'), '2026-10-10')).toThrow('Exceeds the current value of ₹13,000');
    expect(data).toBe(beforeRejectedWithdrawal);

    data = updateInvestmentEntry(data, 'manual', 'withdrawal', { amount: 1_500, date: '2026-10-05' }, '2026-10-10');
    expect(data.transactions[1]).toMatchObject({ amount: 1_500, date: '2026-10-05' });
    expect(holdingValue(data.holdings[0]!, '2026-10-10')).toBe(13_500);
    expect(validateIntegrity(data)).toEqual([]);
    data = deleteInvestmentEntry(data, 'manual', 'deposit');
    expect(data.transactions.some((transaction) => transaction.source?.entryId === 'deposit')).toBe(false);
    expect(holdingValue(data.holdings[0]!, '2026-10-10')).toBe(8_500);
    expect(validateIntegrity(data)).toEqual([]);
  });

  it('rejects withdrawals outside the date or current-value bounds without changing data', () => {
    const manual = addHolding(empty(), {
      name: 'Cash', type: 'Cash', invested: 100, value: 100, valueAsOf: '2026-10-01',
    }, () => 'manual');
    expect(() => addInvestmentEntry(manual, 'manual', {
      date: '2026-10-11', amount: 10, kind: 'Withdrawal', note: '',
    }, () => 'unused', '2026-10-10')).toThrow('Date cannot be in the future');
    const planData = addPlan(empty(), {
      name: 'SIP', type: 'Mutual fund / SIP', frequency: 'monthly', amount: 100,
      ratePct: 0, stepUpPct: 0, tenureYears: 1, startDate: '2026-10-02', trackFrom: '2026-10-02',
      opening: 0, actualValue: null, actualValueDate: null,
    }, () => 'plan');
    expect(() => addInvestmentEntry(planData, 'plan', {
      date: '2026-10-01', amount: 1, kind: 'Withdrawal', note: '',
    }, () => 'unused', '2026-10-10')).toThrow('Date is before the plan started');
    const startedPlan = addPlan(empty(), {
      name: 'Started SIP', type: 'Mutual fund / SIP', frequency: 'monthly', amount: 100,
      ratePct: 0, stepUpPct: 0, tenureYears: 1, startDate: '2026-10-01', trackFrom: '2026-10-01',
      opening: 100, actualValue: null, actualValueDate: null,
    }, () => 'started');
    const withWithdrawal = addInvestmentEntry(startedPlan, 'started', {
      date: '2026-10-02', amount: 50, kind: 'Withdrawal', note: '',
    }, idSequence('withdrawal', 'withdrawal-tx'), '2026-10-10');
    expect(() => updateInvestmentEntry(withWithdrawal, 'started', 'withdrawal', { date: '2026-10-11' }, '2026-10-10'))
      .toThrow('Date cannot be in the future');
    expect(() => updateInvestmentEntry(withWithdrawal, 'started', 'withdrawal', { date: '2026-09-30' }, '2026-10-10'))
      .toThrow('Date is before the plan started');
    expect(() => updateInvestmentEntry(withWithdrawal, 'started', 'withdrawal', { amount: 101 }, '2026-10-10'))
      .toThrow('Exceeds the current value');
    expect(validateIntegrity(manual)).toEqual([]);
    expect(validateIntegrity(planData)).toEqual([]);
  });

  it('updates legacy unlinked entries and applies keep/delete choices to manual holdings', () => {
    const manual = addHolding(empty(), {
      name: 'Cash', type: 'Cash', invested: 500, value: 500, valueAsOf: '2026-10-10',
    }, () => 'manual');
    const withUnlinkedEntry: AppData = {
      ...manual,
      holdings: manual.holdings.map((holding) => holding.kind === 'manual'
        ? { ...holding, logs: [{ id: 'legacy', date: '2026-10-01', amount: 100, kind: 'Deposit', note: '' }] }
        : holding),
    };
    const changed = updateInvestmentEntry(withUnlinkedEntry, 'manual', 'legacy', { amount: 110 }, '2026-10-10');
    expect(changed.transactions).toEqual([]);
    const linked = addInvestmentEntry(manual, 'manual', {
      date: '2026-10-02', amount: 100, kind: 'Deposit', note: '',
    }, idSequence('entry', 'transaction'), '2026-10-10');
    const kept = deleteHoldingWithTransactions(linked, 'manual', { linkedTransactions: 'keep' });
    expect(kept.holdings).toEqual([]);
    expect(kept.transactions[0]?.source).toBeUndefined();
    const deleted = deleteHoldingWithTransactions(linked, 'manual', { linkedTransactions: 'delete' });
    expect(deleted.transactions).toEqual([]);
  });

  it('syncs only recognized transaction templates while updating entry categories', () => {
    const data = addHolding(empty(), {
      name: 'Old', type: 'Cash', invested: 0, value: 100, valueAsOf: '2026-10-10',
    }, () => 'manual');
    const holding = data.holdings[0]!;
    const entry = { id: 'deposit', date: '2026-10-01', amount: 1, kind: 'Deposit' as const, note: '' };
    const withdrawal = { id: 'withdrawal', date: '2026-10-02', amount: 1, kind: 'Withdrawal' as const, note: '' };
    const updated = { ...holding, name: 'New', type: 'Gold' as const, logs: [entry, withdrawal] };
    const rows = syncHoldingTransactions([
      { id: 'a', type: 'invest', amount: 1, date: entry.date, category: 'Other', note: 'Old deposit', source: { kind: 'holding-entry', parentId: 'manual', entryId: 'deposit' } },
      { id: 'b', type: 'income', amount: 1, date: withdrawal.date, category: 'Withdrawal', note: 'Custom note', source: { kind: 'holding-entry', parentId: 'manual', entryId: 'withdrawal' } },
      { id: 'c', type: 'invest', amount: 1, date: entry.date, category: 'Other', note: 'Old installment', source: { kind: 'holding-entry', parentId: 'manual', entryId: 'missing' } },
      { id: 'd', type: 'income', amount: 1, date: entry.date, category: 'Other', note: 'Other source' },
    ], holding, updated);
    expect(rows[0]).toMatchObject({ note: 'New deposit', category: 'Gold / Silver' });
    expect(rows[1]).toMatchObject({ note: 'Custom note', category: 'Withdrawal' });
    expect(rows[2]).toMatchObject({ note: 'Old installment', category: 'Other' });
    expect(rows[3]).toMatchObject({ note: 'Other source', category: 'Other' });
  });

  it('keeps plan current value to the opening balance and recorded entries', () => {
    const plan: PlanHolding = {
      id: 'plan', kind: 'plan', name: 'Growth', type: 'Mutual fund / SIP', frequency: 'monthly',
      amount: 100, ratePct: 12, stepUpPct: 0, tenureYears: 1, startDate: '2025-10-10',
      trackFrom: '2025-10-10', opening: 1_000, actualValue: null, actualValueDate: null,
      logs: [
        { id: 'deposit', date: '2025-10-10', amount: 1_000, note: '', kind: 'Deposit' },
        { id: 'withdrawal', date: '2026-04-10', amount: 500, note: '', kind: 'Withdrawal' },
      ],
    };
    expect(planValue(plan, '2026-10-10')).toBe(1_500);
    expect(planInvested(plan)).toBe(2_000);
  });

  it('includes manual entries only after a value snapshot and preserves no-entry valuation', () => {
    const data = addHolding(empty(), {
      name: 'PF', type: 'EPFO / PF', invested: 5_000, value: 6_000, valueAsOf: '2026-10-01',
    }, () => 'manual');
    expect(holdingInvested(data.holdings[0]!)).toBe(5_000);
    expect(holdingValue(data.holdings[0]!, '2026-10-10')).toBe(6_000);
    const withBackdated = {
      ...data,
      holdings: data.holdings.map((holding) => holding.kind === 'manual'
        ? { ...holding, logs: [{ id: 'old', date: '2026-09-30', amount: 500, note: '', kind: 'Deposit' as const }] }
        : holding),
    };
    expect(holdingInvested(withBackdated.holdings[0]!)).toBe(5_500);
    expect(holdingValue(withBackdated.holdings[0]!, '2026-10-10')).toBe(6_000);
    const undatedSnapshot = {
      ...withBackdated,
      holdings: withBackdated.holdings.map((holding) => holding.kind === 'manual'
        ? { ...holding, valueAsOf: undefined }
        : holding),
    };
    expect(holdingValue(undatedSnapshot.holdings[0]!, '2026-10-10')).toBe(5_500);
  });

  it('clears holding links in plan and snapshot budget items without changing the asset links elsewhere', () => {
    const manual = addHolding(empty(), {
      name: 'Cash reserve', type: 'Cash', invested: 0, value: 30_000, valueAsOf: '2026-10-10',
    }, () => 'manual');
    const data: AppData = {
      ...manual,
      budgetPlan: {
        ...manual.budgetPlan,
        incomes: [],
        sections: [{ id: 'investments', name: 'Investments', type: 'invest' }],
        repeatMonthly: true,
        repeatFrom: '2026-10',
        items: [{
          id: 'linked-plan', sectionId: 'investments', name: 'Emergency cash',
          mode: 'amount', value: 30_000, frequency: 'monthly',
          firstDueMonth: '2026-10', holdingId: 'manual',
        }],
      },
      monthBudgets: [{
        month: '2026-10', source: 'custom', linkedIncluded: false, incomes: [],
        sections: [{ id: 'investments', name: 'Investments', type: 'invest' }],
        items: [{
          id: 'linked-snapshot', sectionId: 'investments', name: 'Emergency cash',
          mode: 'amount', value: 30_000, frequency: 'monthly',
          firstDueMonth: '2026-10', holdingId: 'manual',
        }],
      }],
    };
    const kept = deleteHoldingWithTransactions(data, 'manual', { linkedTransactions: 'keep' });
    expect(kept.budgetPlan?.items[0]?.holdingId).toBeUndefined();
    expect(kept.monthBudgets?.[0]?.items[0]?.holdingId).toBeUndefined();
    expect(kept.transactions.every((transaction) => transaction.source === undefined)).toBe(true);

    const deleted = deleteHoldingWithTransactions(data, 'manual', { linkedTransactions: 'delete' });
    expect(deleted.budgetPlan?.items[0]?.holdingId).toBeUndefined();
    expect(deleted.transactions).toEqual([]);
  });
});
