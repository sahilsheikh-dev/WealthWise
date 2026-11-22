import { emptyAppData } from '../actions';
import {
  addItem,
  budgetLineActual,
  deleteItem,
  editItem,
} from '../budget';
import { clearDue } from '../dues';
import { deleteHolding } from '../holdingActions';
import { pendingItems } from '../pending';
import type { AppData, Holding } from '../types';

describe('budgetMultiAssetLink: multi-budget asset linking and payment attribution', () => {
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

  it('allows linking a manual asset to multiple one-time investment budget items', () => {
    // Add first one-time investment budget item linked to asset-mf
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

    // Add second one-time investment budget item linked to the SAME asset-mf
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

    expect(data.budgetPlan?.items).toHaveLength(2);
    expect(data.budgetPlan?.items[0]?.holdingId).toBe('asset-mf');
    expect(data.budgetPlan?.items[1]?.holdingId).toBe('asset-mf');

    // Add third one-time investment budget item linked to the SAME asset-mf
    data = addItem(data, '2026-11', {
      id: 'item-year-end',
      sectionId: 'sec-invest',
      name: 'Year End Invest',
      mode: 'amount',
      value: 5_000,
      frequency: 'once',
      firstDueMonth: '2026-11',
      holdingId: 'asset-mf',
    }, 'following', '2026-11-01');

    expect(data.budgetPlan?.items).toHaveLength(3);
  });

  it('still enforces 1-to-1 linking for recurring plan holdings', () => {
    const data = addItem(initialData, '2026-11', {
      id: 'item-plan-1',
      sectionId: 'sec-invest',
      name: 'RD Plan 1',
      mode: 'amount',
      value: 1_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
      holdingId: 'plan-rd',
    }, 'following', '2026-11-01');

    expect(() => addItem(data, '2026-11', {
      id: 'item-plan-2',
      sectionId: 'sec-invest',
      name: 'RD Plan 2',
      mode: 'amount',
      value: 1_000,
      frequency: 'monthly',
      firstDueMonth: '2026-11',
      holdingId: 'plan-rd',
    }, 'following', '2026-11-01')).toThrow('This holding is already linked to another budget item.');
  });

  it('preserves payment attribution and updates right asset and budget actuals when paying each linked item', () => {
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

    // Both are pending before payment
    let pending = pendingItems(data, '2026-11', '2026-11-01');
    const bonusPendingBefore = pending.find((p) => p.title === 'Diwali Bonus Invest');
    const taxPendingBefore = pending.find((p) => p.title === 'Tax Refund Invest');
    expect(bonusPendingBefore?.amount).toBe(15_000);
    expect(taxPendingBefore?.amount).toBe(10_000);

    // Pay Item 1 (Diwali Bonus Invest)
    const result1 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-10',
      actualAmount: 15_000,
      note: 'Diwali Bonus Invest',
      newId: () => 'entry-bonus-id',
    });
    data = result1.data;

    // Verify actuals: Diwali Bonus Invest has 15000 actual, Tax Refund has 0 actual
    expect(budgetLineActual(data, '2026-11', 'Diwali Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-11', 'Tax Refund Invest')).toBe(0);

    // Verify pending: Diwali Bonus Invest is cleared, Tax Refund remains pending for 10000
    pending = pendingItems(data, '2026-11', '2026-11-10');
    expect(pending.find((p) => p.title === 'Diwali Bonus Invest')).toBeUndefined();
    expect(pending.find((p) => p.title === 'Tax Refund Invest')?.amount).toBe(10_000);

    // Pay Item 2 (Tax Refund Invest)
    const result2 = clearDue(data, { kind: 'holding', id: 'asset-mf' }, {
      date: '2026-11-15',
      actualAmount: 10_000,
      note: 'Tax Refund Invest',
      newId: () => 'entry-tax-id',
    });
    data = result2.data;

    // Verify actuals: both items reflect their exact paid actuals
    expect(budgetLineActual(data, '2026-11', 'Diwali Bonus Invest')).toBe(15_000);
    expect(budgetLineActual(data, '2026-11', 'Tax Refund Invest')).toBe(10_000);

    // Both pending items cleared
    pending = pendingItems(data, '2026-11', '2026-11-15');
    expect(pending.find((p) => p.title === 'Diwali Bonus Invest')).toBeUndefined();
    expect(pending.find((p) => p.title === 'Tax Refund Invest')).toBeUndefined();

    // Verify holding has both entries recorded
    const holding = data.holdings.find((h) => h.id === 'asset-mf');
    expect(holding?.logs).toHaveLength(2);
    expect(holding?.logs.find((e) => e.note === 'Diwali Bonus Invest')?.amount).toBe(15_000);
    expect(holding?.logs.find((e) => e.note === 'Tax Refund Invest')?.amount).toBe(10_000);
  });

  it('supports editing and deleting one linked item while preserving the other', () => {
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

    // Edit item-bonus planned value to 20,000
    data = editItem(data, '2026-11', {
      itemId: 'item-bonus',
      patch: { value: 20_000 },
    }, 'following', '2026-11-01');

    expect(data.budgetPlan?.items.find((i) => i.id === 'item-bonus')?.value).toBe(20_000);
    expect(data.budgetPlan?.items.find((i) => i.id === 'item-tax-refund')?.value).toBe(10_000);
    expect(data.budgetPlan?.items.find((i) => i.id === 'item-tax-refund')?.holdingId).toBe('asset-mf');

    // Delete item-bonus
    data = deleteItem(data, '2026-11', { itemId: 'item-bonus' }, 'following', '2026-11-01');
    expect(data.budgetPlan?.items.find((i) => i.id === 'item-bonus')).toBeUndefined();
    expect(data.budgetPlan?.items.find((i) => i.id === 'item-tax-refund')?.holdingId).toBe('asset-mf');

    // Delete holding clears remaining link
    data = deleteHolding(data, 'asset-mf');
    expect(data.budgetPlan?.items.find((i) => i.id === 'item-tax-refund')?.holdingId).toBeUndefined();
  });
});
