import type { StateStorage } from 'zustand/middleware';

import { emptyAppData } from '../../domain/actions';
import { createAppStore } from '../createAppStore';
import { monthBudgetFromLines, budgetPlanFromLines } from '../../testFixtures/budget';

class MemoryBudgetStorage implements StateStorage {
  values = new Map<string, string>();

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

const month = '2026-03';
const today = '2026-03-15';

async function waitForHydration(store: ReturnType<typeof createAppStore>): Promise<void> {
  for (let attempt = 0; attempt < 100 && store.getState().status !== 'ready'; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  expect(store.getState().status).toBe('ready');
}

describe('Budget income schedule edits applied to this and following months', () => {
  it.each([
    ['one-time', 'once' as const, 'start month', { frequency: 'once' as const, firstDueMonth: '2026-04' }],
    ['one-time', 'once' as const, 'frequency', { frequency: 'yearly' as const, firstDueMonth: month }],
    ['recurring', 'quarterly' as const, 'start month', { frequency: 'quarterly' as const, firstDueMonth: '2026-04' }],
    ['recurring', 'quarterly' as const, 'frequency', { frequency: 'yearly' as const, firstDueMonth: month }],
  ])('%s %s %s change updates the stored month, persists and rehydrates', async (_kind, oldFrequency, _field, change) => {
    const storage = new MemoryBudgetStorage();
    const income = {
      id: 'income', name: 'Contract work', category: 'Freelance' as const, amount: 12_000,
      day: 5, frequency: oldFrequency, firstDueMonth: month,
    };
    const budgetPlan = budgetPlanFromLines([], {
      incomes: [income], repeatMonthly: true, repeatFrom: month,
    });
    const monthBudget = monthBudgetFromLines(month, [], {
      source: 'plan', incomes: [income], sections: budgetPlan.sections,
    });
    const initialData = { ...emptyAppData(today), budgetPlan, monthBudgets: [monthBudget] };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: initialData }, version: 23 }));
    const makeStore = () => createAppStore(storage, {
      today: () => today,
      newId: () => 'unused',
      isDev: false,
    });
    const store = makeStore();
    await waitForHydration(store);

    store.getState().actions.editBudgetIncome(month, income.id, {
      ...income,
      ...change,
    }, 'following', today);

    const expectedIncome = { ...income, ...change };
    expect(store.getState().lastError).toBeNull();
    expect(store.getState().data.budgetPlan?.incomes).toContainEqual(expectedIncome);
    expect(store.getState().data.monthBudgets?.[0]?.incomes).toContainEqual(expectedIncome);
    const persisted = JSON.parse(storage.values.get('wealthwise.app.v1') ?? '{}') as {
      state?: { data?: typeof initialData };
    };
    expect(persisted.state?.data).toEqual(store.getState().data);

    const rehydrated = makeStore();
    await waitForHydration(rehydrated);
    expect(rehydrated.getState().data).toEqual(store.getState().data);
  });
});
