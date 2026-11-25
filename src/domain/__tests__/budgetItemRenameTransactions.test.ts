import { addTransaction, emptyAppData } from '../actions';
import {
  addIncomeItem,
  addItem,
  addSection,
  budgetLineActual,
  editBudgetIncome,
  editItem,
  renameSection,
} from '../budget';
import {
  budgetItemForTransaction,
  reconcileBudgetItemTransactions,
} from '../budgetCategories';
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

  it('preserves transaction note and updates holding entry note when budget item is renamed, resolving linked budget item', () => {
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

    // Item 1 transaction note is preserved, linked budget item resolves to new name
    const tx1 = data.transactions.find((tx) => tx.source?.entryId === 'entry-bonus-id');
    expect(tx1).toBeDefined();
    expect(tx1?.note).toBe('Diwali Bonus Invest'); // preserved
    expect(budgetItemForTransaction(data, tx1!)?.name).toBe('Festival Bonus Invest');
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

    // 2026-11 transaction note preserved, linked budget item resolves to new name
    const novTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-nov-id');
    expect(novTx?.note).toBe('Bonus Invest'); // preserved
    expect(budgetItemForTransaction(data, novTx!)?.name).toBe('November Bonus Invest');
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

    // 2026-11 and 2026-12 transaction notes preserved
    const novTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-nov-id');
    expect(novTx?.note).toBe('Bonus Invest'); // preserved
    expect(budgetItemForTransaction(data, novTx!)?.name).toBe('Updated Bonus Invest');
    const decTx = data.transactions.find((tx) => tx.source?.entryId === 'entry-dec-id');
    expect(decTx?.note).toBe('Bonus Invest'); // preserved

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
    expect(txAfter?.note).toBe('Monthly RD Plan'); // preserved
    expect(budgetItemForTransaction(data, txAfter!)?.name).toBe('Premier RD Plan');
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

  it('renaming an expense budget item updates transaction.category across matching transactions, preserving amount, date, and note', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-groceries',
      sectionId: 'sec-spend',
      name: 'Groceries',
      mode: 'amount',
      value: 10_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    data = addTransaction(data, {
      type: 'expense',
      amount: 1500,
      category: 'Groceries',
      note: 'Weekly produce',
      date: '2026-11-12',
    }, () => 'tx-groceries-1');

    data = addTransaction(data, {
      type: 'expense',
      amount: 800,
      category: 'Groceries',
      note: '',
      date: '2026-11-18',
    }, () => 'tx-groceries-2');

    data = addTransaction(data, {
      type: 'expense',
      amount: 2000,
      category: 'Rent',
      note: 'November rent',
      date: '2026-11-05',
    }, () => 'tx-rent');

    expect(budgetLineActual(data, '2026-11', 'Groceries')).toBe(2300);

    // Rename budget item 'Groceries' to 'Food & Groceries'
    data = editItem(data, '2026-11', {
      itemId: 'item-groceries',
      patch: { name: 'Food & Groceries' },
    }, 'month', '2026-11-01');

    const tx1 = data.transactions.find((t) => t.id === 'tx-groceries-1');
    expect(tx1).toBeDefined();
    expect(tx1?.category).toBe('Food & Groceries');
    expect(tx1?.amount).toBe(1500);
    expect(tx1?.date).toBe('2026-11-12');
    expect(tx1?.note).toBe('Weekly produce');

    const tx2 = data.transactions.find((t) => t.id === 'tx-groceries-2');
    expect(tx2).toBeDefined();
    expect(tx2?.category).toBe('Food & Groceries');
    expect(tx2?.amount).toBe(800);
    expect(tx2?.date).toBe('2026-11-18');

    // Rent transaction remains untouched
    const rentTx = data.transactions.find((t) => t.id === 'tx-rent');
    expect(rentTx?.category).toBe('Rent');
    expect(rentTx?.amount).toBe(2000);

    // Actuals now attribute to the new name
    expect(budgetLineActual(data, '2026-11', 'Food & Groceries')).toBe(2300);
    expect(budgetLineActual(data, '2026-11', 'Groceries')).toBe(0);
  });

  it('month scope only updates expense transactions in viewed month', () => {
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
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-groceries',
            sectionId: 'sec-spend',
            name: 'Groceries',
            mode: 'amount' as const,
            value: 10_000,
            frequency: 'monthly' as const,
            firstDueMonth: '2026-10',
          }],
        },
        {
          month: '2026-11',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-groceries',
            sectionId: 'sec-spend',
            name: 'Groceries',
            mode: 'amount' as const,
            value: 10_000,
            frequency: 'monthly' as const,
            firstDueMonth: '2026-10',
          }],
        },
      ],
    };

    let data = addTransaction(dataWithOct, {
      type: 'expense',
      amount: 1000,
      category: 'Groceries',
      note: 'Oct Groceries',
      date: '2026-10-15',
    }, () => 'tx-oct');

    data = addTransaction(data, {
      type: 'expense',
      amount: 1200,
      category: 'Groceries',
      note: 'Nov Groceries',
      date: '2026-11-15',
    }, () => 'tx-nov');

    // Rename with month scope in 2026-11
    data = editItem(data, '2026-11', {
      itemId: 'item-groceries',
      patch: { name: 'November Groceries' },
    }, 'month', '2026-11-01');

    const novTx = data.transactions.find((t) => t.id === 'tx-nov');
    expect(novTx?.category).toBe('November Groceries');

    const octTx = data.transactions.find((t) => t.id === 'tx-oct');
    expect(octTx?.category).toBe('Groceries');

    expect(budgetLineActual(data, '2026-11', 'November Groceries')).toBe(1200);
    expect(budgetLineActual(data, '2026-10', 'Groceries')).toBe(1000);
  });

  it('following scope updates expense transactions from viewed month onwards while preserving earlier months', () => {
    const dataWithThreeMonths: AppData = {
      ...initialData,
      budgetPlan: initialData.budgetPlan ? {
        ...initialData.budgetPlan,
        repeatFrom: '2026-10',
        items: [{
          id: 'item-groceries',
          sectionId: 'sec-spend',
          name: 'Groceries',
          mode: 'amount',
          value: 10_000,
          frequency: 'monthly',
          firstDueMonth: '2026-10',
        }],
      } : null,
      monthBudgets: [
        {
          month: '2026-10',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-groceries',
            sectionId: 'sec-spend',
            name: 'Groceries',
            mode: 'amount' as const,
            value: 10_000,
            frequency: 'monthly' as const,
            firstDueMonth: '2026-10',
          }],
        },
        {
          month: '2026-11',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-groceries',
            sectionId: 'sec-spend',
            name: 'Groceries',
            mode: 'amount' as const,
            value: 10_000,
            frequency: 'monthly' as const,
            firstDueMonth: '2026-10',
          }],
        },
        {
          month: '2026-12',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-groceries',
            sectionId: 'sec-spend',
            name: 'Groceries',
            mode: 'amount' as const,
            value: 10_000,
            frequency: 'monthly' as const,
            firstDueMonth: '2026-10',
          }],
        },
      ],
    };

    let data = addTransaction(dataWithThreeMonths, {
      type: 'expense',
      amount: 1000,
      category: 'Groceries',
      note: 'Oct Groceries',
      date: '2026-10-15',
    }, () => 'tx-oct');

    data = addTransaction(data, {
      type: 'expense',
      amount: 1200,
      category: 'Groceries',
      note: 'Nov Groceries',
      date: '2026-11-15',
    }, () => 'tx-nov');

    data = addTransaction(data, {
      type: 'expense',
      amount: 1400,
      category: 'Groceries',
      note: 'Dec Groceries',
      date: '2026-12-15',
    }, () => 'tx-dec');

    // Rename with following scope starting from 2026-11
    data = editItem(data, '2026-11', {
      itemId: 'item-groceries',
      patch: { name: 'Household Food' },
    }, 'following', '2026-11-01');

    expect(data.transactions.find((t) => t.id === 'tx-oct')?.category).toBe('Groceries');
    expect(data.transactions.find((t) => t.id === 'tx-nov')?.category).toBe('Household Food');
    expect(data.transactions.find((t) => t.id === 'tx-dec')?.category).toBe('Household Food');

    expect(budgetLineActual(data, '2026-10', 'Groceries')).toBe(1000);
    expect(budgetLineActual(data, '2026-11', 'Household Food')).toBe(1200);
    expect(budgetLineActual(data, '2026-12', 'Household Food')).toBe(1400);
  });

  it('reconcileBudgetItemTransactions reconciles existing transactions whose category matches an older budget item name', () => {
    // Simulate data where budget item was renamed in the past, but a transaction still had the old category
    const dataWithRenamedItem: AppData = {
      ...initialData,
      budgetPlan: {
        ...initialData.budgetPlan!,
        items: [{
          id: 'item-food-id',
          sectionId: 'sec-spend',
          name: 'Supermarket',
          mode: 'amount',
          value: 10_000,
          frequency: 'monthly',
        }],
      },
      monthBudgets: [{
        month: '2026-10',
        source: 'custom',
        linkedIncluded: true,
        incomes: [],
        sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
        items: [{
          id: 'item-food-id',
          sectionId: 'sec-spend',
          name: 'Food',
          mode: 'amount',
          value: 10_000,
          frequency: 'monthly',
        }],
      }, {
        month: '2026-11',
        source: 'custom',
        linkedIncluded: true,
        incomes: [],
        sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
        items: [{
          id: 'item-food-id',
          sectionId: 'sec-spend',
          name: 'Supermarket',
          mode: 'amount',
          value: 10_000,
          frequency: 'monthly',
        }],
      }],
      transactions: [{
        id: 'tx-old-cat',
        type: 'expense',
        amount: 500,
        category: 'Food',
        note: '',
        date: '2026-11-10',
      }],
    };

    // Before reconciliation: budgetLineActual('Supermarket') is 0
    expect(budgetLineActual(dataWithRenamedItem, '2026-11', 'Supermarket')).toBe(0);

    const reconciled = reconcileBudgetItemTransactions(dataWithRenamedItem);
    const tx = reconciled.transactions.find((t) => t.id === 'tx-old-cat');
    expect(tx?.category).toBe('Supermarket');
    expect(budgetLineActual(reconciled, '2026-11', 'Supermarket')).toBe(500);
  });

  it('renaming a budget section updates transaction.category matching old section name', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-custom-sec',
      sectionId: 'sec-spend',
      name: 'Custom Spend',
      mode: 'amount',
      value: 5000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    data = addTransaction(data, {
      type: 'expense',
      amount: 400,
      category: 'Living',
      note: 'Household',
      date: '2026-11-14',
    }, () => 'tx-living-sec');

    data = renameSection(data, '2026-11', {
      sectionId: 'sec-spend',
      name: 'Home & Living',
    }, 'following', '2026-11-01');

    const tx = data.transactions.find((t) => t.id === 'tx-living-sec');
    expect(tx?.category).toBe('Home & Living');
  });

  it('editing budget income updates income transaction category and note', () => {
    const dataWithIncome: AppData = {
      ...initialData,
      monthBudgets: [{
        month: '2026-11',
        source: 'custom',
        linkedIncluded: true,
        sections: [],
        items: [],
        incomes: [{
          id: 'inc-freelance',
          name: 'Freelance Design',
          category: 'Freelance',
          amount: 50_000,
          frequency: 'monthly',
        }],
      }],
      transactions: [{
        id: 'tx-income-1',
        type: 'income',
        amount: 50_000,
        category: 'Freelance',
        note: 'Freelance Design',
        date: '2026-11-05',
      }],
    };

    const updated = editBudgetIncome(dataWithIncome, '2026-11', {
      incomeId: 'inc-freelance',
      values: {
        name: 'Design Studio',
        category: 'Consulting',
        amount: 60_000,
      },
    }, 'following', '2026-11-01');

    const tx = updated.transactions.find((t) => t.id === 'tx-income-1');
    expect(tx?.category).toBe('Consulting');
    expect(tx?.note).toBe('Freelance Design');
    expect(tx?.amount).toBe(50_000);
  });

  it('renaming budget item or section updates transaction category only and preserves note identical to old name', () => {
    let data = addItem(initialData, '2026-11', {
      id: 'item-food-groceries',
      sectionId: 'sec-spend',
      name: 'Groceries',
      mode: 'amount',
      value: 10_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    // Transaction where note is identical to category name 'Groceries'
    data = addTransaction(data, {
      type: 'expense',
      amount: 1500,
      category: 'Groceries',
      note: 'Groceries',
      date: '2026-11-12',
    }, () => 'tx-exact-note');

    // Rename item to 'Food & Groceries'
    data = editItem(data, '2026-11', {
      itemId: 'item-food-groceries',
      patch: { name: 'Food & Groceries' },
    }, 'following', '2026-11-01');

    const txItem = data.transactions.find((t) => t.id === 'tx-exact-note');
    expect(txItem?.category).toBe('Food & Groceries');
    expect(txItem?.note).toBe('Groceries'); // note is preserved, NOT changed to new name

    // Transaction where note is identical to section name 'Living'
    data = addTransaction(data, {
      type: 'expense',
      amount: 2000,
      category: 'Living',
      note: 'Living',
      date: '2026-11-14',
    }, () => 'tx-section-note');

    data = renameSection(data, '2026-11', {
      sectionId: 'sec-spend',
      name: 'Household Living',
    }, 'following', '2026-11-01');

    const txSec = data.transactions.find((t) => t.id === 'tx-section-note');
    expect(txSec?.category).toBe('Household Living');
    expect(txSec?.note).toBe('Living'); // note is preserved, NOT changed to new section name

    // Holding-linked budget item where transaction note is identical to item name
    data = addItem(data, '2026-11', {
      id: 'item-holding-sip',
      sectionId: 'sec-invest',
      holdingId: 'asset-mf',
      name: 'Monthly SIP',
      mode: 'amount',
      value: 5_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    data = addTransaction(data, {
      type: 'invest',
      amount: 5000,
      category: 'Mutual fund / SIP',
      note: 'Monthly SIP', // note is identical to budget item name
      date: '2026-11-15',
      source: { kind: 'holding-entry', parentId: 'asset-mf', entryId: 'entry-sip-1' },
    }, () => 'tx-holding-exact-note');

    // Add corresponding holding log entry
    data = {
      ...data,
      holdings: data.holdings.map((h) => h.id === 'asset-mf' ? {
        ...h,
        logs: [...h.logs, { id: 'entry-sip-1', date: '2026-11-15', amount: 5000, note: 'Monthly SIP', kind: 'Deposit' as const }],
      } : h),
    };

    // Rename holding budget item to 'Premier SIP'
    data = editItem(data, '2026-11', {
      itemId: 'item-holding-sip',
      patch: { name: 'Premier SIP' },
    }, 'following', '2026-11-01');

    const txHolding = data.transactions.find((t) => t.id === 'tx-holding-exact-note');
    expect(txHolding?.note).toBe('Monthly SIP'); // note is strictly preserved, NOT changed to 'Premier SIP'
    expect(budgetItemForTransaction(data, txHolding!)?.name).toBe('Premier SIP');

    // Income item where transaction note is identical to income name
    let dataIncome = addIncomeItem(data, '2026-11', {
      id: 'inc-freelance',
      name: 'Freelance',
      category: 'Freelance / Consulting',
      amount: 30_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    dataIncome = addTransaction(dataIncome, {
      type: 'income',
      amount: 30_000,
      category: 'Freelance / Consulting',
      note: 'Freelance', // note matches income name
      date: '2026-11-16',
    }, () => 'tx-income-note');

    dataIncome = editBudgetIncome(dataIncome, '2026-11', {
      incomeId: 'inc-freelance',
      values: {
        name: 'Consulting Retainer',
        category: 'Freelance / Consulting',
        amount: 35_000,
      },
    }, 'following', '2026-11-01');

    const txInc = dataIncome.transactions.find((t) => t.id === 'tx-income-note');
    expect(txInc?.note).toBe('Freelance'); // note is strictly preserved

    // User scenario: budget item is 'Bills', transaction category selected as 'Bills' and note is 'Bills' (or note is empty)
    // Rename budget item to 'Credit Card Bills':
    // category changes to 'Credit Card Bills', but note remains 'Bills'
    let dataBills = addSection(initialData, '2026-11', {
      id: 'survival',
      name: 'Survival (Needs)',
      type: 'spend',
    }, 'following', '2026-11-01');

    dataBills = addItem(dataBills, '2026-11', {
      id: 'item-bills-id',
      sectionId: 'survival',
      name: 'Bills',
      mode: 'amount',
      value: 5_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
    }, 'following', '2026-11-01');

    dataBills = addTransaction(dataBills, {
      type: 'expense',
      amount: 1200,
      category: 'Bills',
      note: 'Bills', // name/note is 'Bills'
      date: '2026-11-18',
    }, () => 'tx-bills-with-note');

    dataBills = addTransaction(dataBills, {
      type: 'expense',
      amount: 800,
      category: 'Bills',
      note: '', // note was left empty, transaction name was 'Bills'
      date: '2026-11-19',
    }, () => 'tx-bills-empty-note');

    dataBills = editItem(dataBills, '2026-11', {
      itemId: 'item-bills-id',
      patch: { name: 'Credit Card Bills' },
    }, 'following', '2026-11-01');

    const txWithNote = dataBills.transactions.find((t) => t.id === 'tx-bills-with-note');
    expect(txWithNote?.category).toBe('Credit Card Bills'); // budget category item updated
    expect(txWithNote?.note).toBe('Bills'); // name/note preserved as before

    const txEmptyNote = dataBills.transactions.find((t) => t.id === 'tx-bills-empty-note');
    expect(txEmptyNote?.category).toBe('Credit Card Bills'); // budget category item updated
    expect(txEmptyNote?.note).toBe('Bills'); // previously set name preserved in note
  });

  it('budgetItemForTransaction resolves non-holding budget item for expense transactions', () => {
    const data: AppData = {
      ...initialData,
      monthBudgets: [{
        month: '2026-11',
        source: 'custom',
        linkedIncluded: true,
        incomes: [],
        sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
        items: [{
          id: 'item-utilities',
          sectionId: 'sec-spend',
          name: 'Utilities',
          mode: 'amount',
          value: 4000,
          frequency: 'monthly',
        }],
      }],
    };

    const tx: AppData['transactions'][number] = {
      id: 'tx-util',
      type: 'expense',
      amount: 1200,
      category: 'Utilities',
      note: 'Electricity bill',
      date: '2026-11-08',
    };

    const item = budgetItemForTransaction(data, tx);
    expect(item?.id).toBe('item-utilities');
    expect(item?.name).toBe('Utilities');

    // Month with no budget returns undefined
    expect(budgetItemForTransaction(data, { ...tx, date: '2025-01-01' })).toBeUndefined();

    // Unknown category returns undefined
    expect(budgetItemForTransaction(data, { ...tx, category: 'Unbudgeted Category' })).toBeUndefined();

    // Historical rename resolution
    const dataWithRename: AppData = {
      ...data,
      monthBudgets: [
        {
          month: '2026-10',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-utilities',
            sectionId: 'sec-spend',
            name: 'Old Utility Bills',
            mode: 'amount',
            value: 4000,
            frequency: 'monthly',
          }],
        },
        ...data.monthBudgets!,
      ],
    };
    const historicalTx = { ...tx, category: 'Old Utility Bills' };
    expect(budgetItemForTransaction(dataWithRename, historicalTx)?.name).toBe('Utilities');

    // Historical item whose ID is not in current month's budget returns undefined
    const dataWithoutItemInNov: AppData = {
      ...dataWithRename,
      monthBudgets: [{
        month: '2026-11',
        source: 'custom',
        linkedIncluded: true,
        incomes: [],
        sections: [],
        items: [],
      }],
    };
    expect(budgetItemForTransaction(dataWithoutItemInNov, historicalTx)).toBeUndefined();
  });

  it('budgetItemForTransaction handles holding transactions with multiple items and non-matching notes', () => {
    const data: AppData = {
      ...initialData,
      holdings: [{
        id: 'holding-multi',
        kind: 'manual',
        name: 'Multi Asset',
        type: 'Mutual fund / SIP',
        invested: 10_000,
        value: 10_000,
        valueAsOf: '2026-11-01',
        logs: [
          { id: 'entry-unmatched', date: '2026-11-01', amount: 5000, note: 'Something else', kind: 'Deposit' },
        ],
      }],
      monthBudgets: [{
        month: '2026-11',
        source: 'custom',
        linkedIncluded: true,
        incomes: [],
        sections: [{ id: 'sec-invest', name: 'Investing', type: 'invest' }],
        items: [
          {
            id: 'item-invest-1',
            sectionId: 'sec-invest',
            holdingId: 'holding-multi',
            name: 'Goal Alpha',
            mode: 'amount',
            value: 5000,
            frequency: 'monthly',
          },
          {
            id: 'item-invest-2',
            sectionId: 'sec-invest',
            holdingId: 'holding-multi',
            name: 'Goal Beta',
            mode: 'amount',
            value: 5000,
            frequency: 'monthly',
          },
        ],
      }],
    };

    const tx: AppData['transactions'][number] = {
      id: 'tx-unmatched-holding',
      type: 'invest',
      amount: 5000,
      category: 'Mutual funds',
      note: 'Random Note',
      date: '2026-11-01',
      source: {
        kind: 'holding-entry',
        parentId: 'holding-multi',
        entryId: 'entry-unmatched',
      },
    };

    // When neither entry.note nor tx.note matches any of the sibling items, returns undefined
    expect(budgetItemForTransaction(data, tx)).toBeUndefined();
  });

  it('reconcileBudgetItemTransactions handles no renamed items and preserved custom notes', () => {
    // When no items have been renamed, data is returned unchanged
    const unchanged = reconcileBudgetItemTransactions(initialData);
    expect(unchanged).toBe(initialData);

    // When item was renamed and transaction has custom note, custom note is preserved
    const dataWithCustomNote: AppData = {
      ...initialData,
      budgetPlan: {
        ...initialData.budgetPlan!,
        items: [{
          id: 'item-custom-id',
          sectionId: 'sec-spend',
          name: 'Renamed Dining',
          mode: 'amount',
          value: 5000,
          frequency: 'monthly',
        }],
      },
      monthBudgets: [
        {
          month: '2026-10',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-custom-id',
            sectionId: 'sec-spend',
            name: 'Old Dining',
            mode: 'amount',
            value: 5000,
            frequency: 'monthly',
          }],
        },
        {
          month: '2026-11',
          source: 'custom',
          linkedIncluded: true,
          incomes: [],
          sections: [{ id: 'sec-spend', name: 'Living', type: 'spend' }],
          items: [{
            id: 'item-custom-id',
            sectionId: 'sec-spend',
            name: 'Renamed Dining',
            mode: 'amount',
            value: 5000,
            frequency: 'monthly',
          }],
        },
      ],
      transactions: [
        {
          id: 'tx-custom-note',
          type: 'expense',
          amount: 600,
          category: 'Old Dining',
          note: 'Italian restaurant dinner',
          date: '2026-11-04',
        },
        {
          id: 'tx-no-budget-month',
          type: 'expense',
          amount: 200,
          category: 'Old Dining',
          note: 'Old dinner',
          date: '2025-01-01',
        },
      ],
    };

    const reconciled = reconcileBudgetItemTransactions(dataWithCustomNote);
    const tx1 = reconciled.transactions.find((t) => t.id === 'tx-custom-note');
    expect(tx1?.category).toBe('Renamed Dining');
    expect(tx1?.note).toBe('Italian restaurant dinner'); // custom note preserved

    const txNoBudget = reconciled.transactions.find((t) => t.id === 'tx-no-budget-month');
    expect(txNoBudget?.category).toBe('Old Dining'); // month with no budget is untouched
  });
});
