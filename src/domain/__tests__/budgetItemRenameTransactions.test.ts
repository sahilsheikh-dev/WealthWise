import { emptyAppData } from '../actions';
import {
  addItem,
  budgetLineActual,
  editItem,
} from '../budget';
import { budgetItemForTransaction } from '../budgetCategories';
import { clearDue } from '../dues';
import type { AppData, Holding } from '../types';

describe('budgetItemRenameTransactions: budget item rename updates linked transactions', () => {
  const manualAsset: Holding = {
    id: 'asset-mf',
    name: 'Nifty Index Fund',
    type: 'Mutual fund / SIP',
    kind: 'manual',
    invested: 10_000,
    value: 12_000,
    valueAsOf: '2026-11-01',
    logs: [],
  };

  const planAsset: Holding = {
    id: 'plan-rd',
    name: 'Recurring Deposit RD',
    type: 'Recurring deposit',
    kind: 'plan',
    amount: 1_000,
    frequency: 'monthly',
    ratePct: 7,
    stepUpPct: 0,
    tenureYears: 1,
    opening: 0,
    actualValue: null,
    actualValueDate: null,
    startDate: '2026-01-01',
    trackFrom: '2026-01-01',
    logs: [],
  };

  const initialData: AppData = {
    ...emptyAppData('2026-11-01'),
    holdings: [manualAsset, planAsset],
    budgetPlan: {
      incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
      sections: [
        { id: 'sec-invest', name: 'Investments', type: 'invest' },
        { id: 'sec-spend', name: 'Living', type: 'spend' },
      ],
      items: [],
      repeatMonthly: true,
      repeatFrom: '2026-11',
    },
    monthBudgets: [{
      month: '2026-11',
      source: 'custom',
      linkedIncluded: true,
      incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
      sections: [
        { id: 'sec-invest', name: 'Investments', type: 'invest' },
        { id: 'sec-spend', name: 'Living', type: 'spend' },
      ],
      items: [],
    }],
  };

  it('updates linked transaction note and holding entry note when budget item is renamed, preserving category and link', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-bonus',
      sectionId: 'sec-invest',
      name: 'Diwali Bonus Invest',
      mode: 'amount',
      value: 15_000,
      frequency: 'once',
      firstDueMonth: '2026-11',
      holdingId: 'asset-mf',
    }, 'following', '2026-11-01');

    data = addItem(data, '2026-11', {
      id: 'item-tax-refund',
      sectionId: 'sec-invest',
      name: 'Tax Refund Invest',
      mode: 'amount',
      value: 10_000,
      frequency: 'once',
      firstDueMonth: '2026-11',
      holdingId: 'asset-mf',
    }, 'following', '2026-11-01');

    // Pay both items
    const res1 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-10',
      actualAmount: 15_000,
      note: 'Diwali Bonus Invest',
      newId: () => 'entry-bonus-id',
    });
    data = res1.data;

    const res2 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-15',
      actualAmount: 10_000,
      note: 'Tax Refund Invest',
      newId: () => 'entry-tax-id',
    });
    data = res2.data;

    expect(budgetLineActual(data, '2026-11', 'Diwali Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-11', 'Tax Refund Invest')).toBe(10_000);

    // Rename Item 1 in month 2026-11
    data = editItem(data, '2026-11', {
      itemId: 'item-bonus',
      patch: { name: 'Festival Bonus Invest' },
    }, 'month', '2026-11-01');

    // Item 1 transaction should reflect the new budget item name
    const tx1 = data.transactions.find((tx) => tx.source?.entryId === 'entry-bonus-id');
    expect(tx1).toBeDefined();
    expect(tx1?.note).toBe('Festival Bonus Invest');
    // Category, amount, date, and source are preserved
    expect(tx1?.category).toBe('Mutual fund / SIP');
    expect(tx1?.amount).toBe(15_000);
    expect(tx1?.date).toBe('2026-11-10');
    expect(tx1?.source).toEqual({ kind: 'holding-entry', parentId: 'asset-mf', entryId: 'entry-bonus-id' });

    // Item 1 holding entry note should also be updated
    const holding = data.holdings.find((h) => h.id === 'asset-mf');
    const entry1 = holding?.logs.find((e) => e.id === 'entry-bonus-id');
    expect(entry1?.note).toBe('Festival Bonus Invest');

    // Item 2 transaction and holding entry are untouched
    const tx2 = data.transactions.find((tx) => tx.source?.entryId === 'entry-tax-id');
    expect(tx2?.note).toBe('Tax Refund Invest');
    expect(tx2?.category).toBe('Mutual fund / SIP');
    expect(tx2?.amount).toBe(10_000);
    const entry2 = holding?.logs.find((e) => e.id === 'entry-tax-id');
    expect(entry2?.note).toBe('Tax Refund Invest');

    // Budget actuals reflect the new budget item name
    expect(budgetLineActual(data, '2026-11', 'Festival Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-11', 'Tax Refund Invest')).toBe(10_000);
  });

  it('handles month-specific items: month scope only renames transactions in the viewed month', () => {
    const dataWithOct: AppData = {
      ...initialData,
      budgetPlan: initialData.budgetPlan ? {
        ...initialData.budgetPlan,
        repeatFrom: '2026-10',
      } : null,
      monthBudgets: [
        {
          month: '2026-10',
          source: 'custom',
          linkedIncluded: true,
          incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
          sections: [
            { id: 'sec-invest', name: 'Investments', type: 'invest' },
            { id: 'sec-spend', name: 'Living', type: 'spend' },
          ],
          items: [],
        },
        {
          month: '2026-11',
          source: 'custom',
          linkedIncluded: true,
          incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
          sections: [
            { id: 'sec-invest', name: 'Investments', type: 'invest' },
            { id: 'sec-spend', name: 'Living', type: 'spend' },
          ],
          items: [],
        },
      ],
    };
    let data = addItem(dataWithOct, '2026-10', {
      id: 'item-bonus',
      sectionId: 'sec-invest',
      name: 'Bonus Invest',
      mode: 'amount',
      value: 15_000,
      frequency: 'monthly',
      firstDueMonth: '2026-10',
      holdingId: 'asset-mf',
    }, 'following', '2026-10-01');

    // Also populate 2026-11 snapshot with the item
    data = {
      ...data,
      monthBudgets: data.monthBudgets?.map((m) => m.month === '2026-11' ? {
        ...m,
        items: [{
          id: 'item-bonus',
          sectionId: 'sec-invest',
          name: 'Bonus Invest',
          mode: 'amount' as const,
          value: 15_000,
          frequency: 'monthly' as const,
          firstDueMonth: '2026-10',
          holdingId: 'asset-mf',
        }],
      } : m),
    };

    // Pay in 2026-10
    const res1 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-10-10',
      actualAmount: 15_000,
      note: 'Bonus Invest',
      newId: () => 'entry-oct-id',
    });
    data = res1.data;

    // Pay in 2026-11
    const res2 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-10',
      actualAmount: 15_000,
      note: 'Bonus Invest',
      newId: () => 'entry-nov-id',
    });
    data = res2.data;

    // Rename only for month 2026-11
    data = editItem(data, '2026-11', {
      itemId: 'item-bonus',
      patch: { name: 'November Bonus Invest' },
    }, 'month', '2026-11-01');

    // 2026-11 transaction updated
    const novTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-nov-id');
    expect(novTx?.note).toBe('November Bonus Invest');
    expect(novTx?.category).toBe('Mutual fund / SIP');

    // 2026-10 transaction remains 'Bonus Invest'
    const octTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-oct-id');
    expect(octTx?.note).toBe('Bonus Invest');
    expect(octTx?.category).toBe('Mutual fund / SIP');

    // Actuals in each month
    expect(budgetLineActual(data, '2026-11', 'November Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-10', 'Bonus Invest')).toBe(15_000);
  });

  it('handles following scope: updates transactions from viewed month onwards while preserving earlier months', () => {
    const dataWithOct: AppData = {
      ...initialData,
      budgetPlan: initialData.budgetPlan ? {
        ...initialData.budgetPlan,
        repeatFrom: '2026-10',
      } : null,
      monthBudgets: [
        {
          month: '2026-10',
          source: 'custom',
          linkedIncluded: true,
          incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
          sections: [
            { id: 'sec-invest', name: 'Investments', type: 'invest' },
            { id: 'sec-spend', name: 'Living', type: 'spend' },
          ],
          items: [],
        },
        {
          month: '2026-11',
          source: 'custom',
          linkedIncluded: true,
          incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
          sections: [
            { id: 'sec-invest', name: 'Investments', type: 'invest' },
            { id: 'sec-spend', name: 'Living', type: 'spend' },
          ],
          items: [],
        },
        {
          month: '2026-12',
          source: 'custom',
          linkedIncluded: true,
          incomes: [{ id: 'inc-1', name: 'Salary', category: 'Salary', amount: 50_000, frequency: 'monthly' }],
          sections: [
            { id: 'sec-invest', name: 'Investments', type: 'invest' },
            { id: 'sec-spend', name: 'Living', type: 'spend' },
          ],
          items: [],
        },
      ],
    };

    let data = addItem(dataWithOct, '2026-10', {
      id: 'item-bonus',
      sectionId: 'sec-invest',
      name: 'Bonus Invest',
      mode: 'amount',
      value: 15_000,
      frequency: 'monthly',
      firstDueMonth: '2026-10',
      holdingId: 'asset-mf',
    }, 'following', '2026-10-01');

    data = {
      ...data,
      monthBudgets: data.monthBudgets?.map((m) => m.month === '2026-11' || m.month === '2026-12' ? {
        ...m,
        items: [{
          id: 'item-bonus',
          sectionId: 'sec-invest',
          name: 'Bonus Invest',
          mode: 'amount' as const,
          value: 15_000,
          frequency: 'monthly' as const,
          firstDueMonth: '2026-10',
          holdingId: 'asset-mf',
        }],
      } : m),
    };

    // Pay in 2026-10
    const res1 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-10-10',
      actualAmount: 15_000,
      note: 'Bonus Invest',
      newId: () => 'entry-oct-id',
    });
    data = res1.data;

    // Pay in 2026-11
    const res2 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-10',
      actualAmount: 15_000,
      note: 'Bonus Invest',
      newId: () => 'entry-nov-id',
    });
    data = res2.data;

    // Pay in 2026-12
    const res3 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-12-10',
      actualAmount: 15_000,
      note: 'Bonus Invest',
      newId: () => 'entry-dec-id',
    });
    data = res3.data;

    // Rename with following scope starting from 2026-11
    data = editItem(data, '2026-11', {
      itemId: 'item-bonus',
      patch: { name: 'Updated Bonus Invest' },
    }, 'following', '2026-11-01');

    // 2026-10 is before 2026-11: remains 'Bonus Invest'
    const octTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-oct-id');
    expect(octTx?.note).toBe('Bonus Invest');

    // 2026-11 and 2026-12 are updated
    const novTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-nov-id');
    expect(novTx?.note).toBe('Updated Bonus Invest');
    const decTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-dec-id');
    expect(decTx?.note).toBe('Updated Bonus Invest');

    // Budget actuals
    expect(budgetLineActual(data, '2026-10', 'Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-11', 'Updated Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-12', 'Updated Bonus Invest')).toBe(15_000);
  });

  it('handles recurring plan holding budget item: title propagation, rename, and filterTransactions matching', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-plan',
      sectionId: 'sec-invest',
      name: 'Monthly RD Plan',
      mode: 'amount',
      value: 1_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
      holdingId: 'plan-rd',
    }, 'following', '2026-11-01');

    // Pay plan due with note
    const res = clearDue(data, { kind: 'plan', id: 'plan-rd' }, {
      date: '2026-11-10',
      actualAmount: 1_000,
      note: 'Monthly RD Plan',
      newId: () => 'entry-plan-id',
    });
    data = res.data;

    const txBefore = data.transactions.find((tx) => tx.source?.entryId === 'entry-plan-id');
    expect(txBefore?.note).toBe('Monthly RD Plan');
    expect(txBefore?.category).toBe('Fixed deposit / RD');

    // Rename plan budget item
    data = editItem(data, '2026-11', {
      itemId: 'item-plan',
      patch: { name: 'Premier RD Plan' },
    }, 'month', '2026-11-01');

    const txAfter = data.transactions.find((tx) => tx.source?.entryId === 'entry-plan-id');
    expect(txAfter?.note).toBe('Premier RD Plan');
    expect(txAfter?.category).toBe('Fixed deposit / RD');
    expect(txAfter?.amount).toBe(1_000);
    expect(txAfter?.date).toBe('2026-11-10');

    // Holding entry note
    const holding = data.holdings.find((h) => h.id === 'plan-rd');
    expect(holding?.logs.find((e) => e.id === 'entry-plan-id')?.note).toBe('Premier RD Plan');

    // budgetLineActual matches
    expect(budgetLineActual(data, '2026-11', 'Premier RD Plan')).toBe(1_000);
  });

  it('budgetItemForTransaction resolves current budget item for linked transaction', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-bonus',
      sectionId: 'sec-invest',
      name: 'Diwali Bonus Invest',
      mode: 'amount',
      value: 15_000,
      frequency: 'once',
      firstDueMonth: '2026-11',
      holdingId: 'asset-mf',
    }, 'following', '2026-11-01');

    const res = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-10',
      actualAmount: 15_000,
      note: 'Diwali Bonus Invest',
      newId: () => 'entry-bonus-id',
    });
    data = res.data;

    const tx = data.transactions.find((t) => t.source?.entryId === 'entry-bonus-id')!;
    const itemBefore = budgetItemForTransaction(data, tx);
    expect(itemBefore?.name).toBe('Diwali Bonus Invest');

    // Rename
    data = editItem(data, '2026-11', {
      itemId: 'item-bonus',
      patch: { name: 'Festival Bonus Invest' },
    }, 'month', '2026-11-01');

    const updatedTx = data.transactions.find((t) => t.source?.entryId === 'entry-bonus-id')!;
    const itemAfter = budgetItemForTransaction(data, updatedTx);
    expect(itemAfter?.name).toBe('Festival Bonus Invest');
  });
});
