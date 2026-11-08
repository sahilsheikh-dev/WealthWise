import type { StateStorage } from 'zustand/middleware';

import { goalSavedFor } from '../../domain/goalLinks';
import { valueStaleness } from '../../domain/holdingActions';
import { validateIntegrity } from '../../domain/links';
import { createAppStore } from '../createAppStore';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  setItemCalls = 0;
  getItem(name: string): string | null { return this.values.get(name) ?? null; }
  setItem(name: string, value: string): void { this.setItemCalls += 1; this.values.set(name, value); }
  removeItem(name: string): void { this.values.delete(name); }
}

function createStore(storage: StateStorage, newId: () => string, today: () => string = () => '2026-10-10') {
  return createAppStore(storage, { newId, today, isDev: false });
}

async function hydrated(store: ReturnType<typeof createStore>) {
  if (store.getState().hydrated) return;
  await new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe((state) => {
      if (state.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
}

describe('Phase 5 store integration', () => {
  it('funds the emergency goal through linked assets and persists links atomically', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = createStore(storage, () => `ef-${++id}`);
    await hydrated(store);
    const perform = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };

    perform(() => store.getState().actions.addHolding({
      name: 'Emergency cash', type: 'Savings account', invested: 50_000, value: 50_000,
    }));
    const holding = store.getState().data.holdings[0]!;
    const goal = store.getState().data.goals.find(({ auto }) => auto === 'ef')!;
    perform(() => store.getState().actions.setGoalLinks(goal.id, [{ instrumentId: holding.id, share: 60 }]));
    expect(goalSavedFor(
      store.getState().data.goals.find(({ auto }) => auto === 'ef')!,
      store.getState().data,
      '2026-10-10',
    )).toBe(30_000);

    const restored = createStore(storage, () => `restored-${++id}`);
    await hydrated(restored);
    expect(restored.getState().data).toEqual(store.getState().data);
    expect(validateIntegrity(restored.getState().data)).toEqual([]);
    const beforeUnlink = storage.setItemCalls;
    restored.getState().actions.setGoalLinks(goal.id, []);
    expect(storage.setItemCalls - beforeUnlink).toBe(1);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    expect(goalSavedFor(
      restored.getState().data.goals.find(({ auto }) => auto === 'ef')!,
      restored.getState().data,
      '2026-10-10',
    )).toBe(0);
  });

  it('persists goal and holding actions in one write and dates value changes with injected today', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    let asOf = '2026-10-10';
    const store = createStore(storage, () => `row-${++id}`, () => asOf);
    await hydrated(store);
    const perform = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
    };

    perform(() => store.getState().actions.addGoal({ name: 'Trip', target: 100_000, saved: 500, year: 2028 }));
    const goalId = store.getState().data.goals.find((goal) => goal.name === 'Trip')!.id;
    perform(() => store.getState().actions.updateGoal(goalId, { name: 'Travel' }));
    const withGoal = createStore(storage, () => `goal-reload-${++id}`);
    await hydrated(withGoal);
    expect(withGoal.getState().data.goals).toEqual(store.getState().data.goals);
    perform(() => store.getState().actions.deleteGoal(goalId));
    const efGoalId = store.getState().data.goals.find((goal) => goal.auto === 'ef')!.id;
    const beforeGuard = storage.setItemCalls;
    const originalGoals = store.getState().data.goals;
    store.getState().actions.updateGoal(efGoalId, { name: 'Not allowed' });
    expect(store.getState().data.goals).toBe(originalGoals);
    expect(store.getState().lastError).toContain('Emergency fund Goal');
    expect(storage.setItemCalls).toBe(beforeGuard);
    store.getState().actions.deleteGoal(efGoalId);
    expect(store.getState().data.goals).toBe(originalGoals);
    expect(storage.setItemCalls).toBe(beforeGuard);

    const input = { name: 'Savings', type: 'Savings account' as const, invested: 10_000, value: 11_000 };
    perform(() => store.getState().actions.addHolding(input));
    const holdingId = store.getState().data.holdings[0]!.id;
    expect(store.getState().data.holdings[0]).toMatchObject({ valueAsOf: '2026-10-10' });
    asOf = '2026-10-11';
    perform(() => store.getState().actions.updateHolding(holdingId, { name: 'Savings account' }));
    expect(store.getState().data.holdings[0]).toMatchObject({ valueAsOf: '2026-10-10' });
    perform(() => store.getState().actions.updateHolding(holdingId, { value: 12_000 }));
    expect(store.getState().data.holdings[0]).toMatchObject({ valueAsOf: '2026-10-11' });
    const withHolding = createStore(storage, () => `holding-reload-${++id}`, () => asOf);
    await hydrated(withHolding);
    expect(withHolding.getState().data.holdings).toEqual(store.getState().data.holdings);
    perform(() => store.getState().actions.deleteHolding(holdingId));
    expect(valueStaleness('2026-07-11', '2026-10-10')).toEqual({ stale: true, days: 91 });
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });
});
