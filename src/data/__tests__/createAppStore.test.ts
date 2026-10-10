import type { StateStorage } from 'zustand/middleware';

import { mockAppData } from '../../mock/data';
import { createAppStore } from '../createAppStore';

class MemoryStorage implements StateStorage {
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

const makeStore = (storage: StateStorage, overrides: {
  newId?: () => string;
  reload?: () => void;
  isDev?: boolean;
} = {}) => createAppStore(storage, {
  newId: overrides.newId ?? (() => 'fixed-id'),
  today: () => '2026-10-10',
  reload: overrides.reload,
  ...(overrides.isDev === undefined ? {} : { isDev: overrides.isDev }),
});

async function waitForHydration(store: ReturnType<typeof makeStore>) {
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

describe('createAppStore persistence', () => {
  it('starts empty with an emergency fund goal and rehydrates transactions across instances', async () => {
    const storage = new MemoryStorage();
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.transactions).toEqual([]);
    expect(first.getState().data.goals).toEqual([expect.objectContaining({ auto: 'ef' })]);

    first.getState().actions.addTransaction({
      type: 'income',
      amount: 2_500,
      category: 'Freelance',
      note: 'Work',
      date: '2026-10-10',
    });
    expect(first.getState().data.transactions[0]).toMatchObject({ id: 'fixed-id', amount: 2_500 });

    const second = makeStore(storage);
    await waitForHydration(second);
    expect(second.getState().data.transactions).toEqual(first.getState().data.transactions);
  });

  it('keeps corrupt data untouched during recovery and preserves the backup on start fresh', async () => {
    const storage = new MemoryStorage();
    const corrupt = '{not json';
    storage.values.set('wealthwise.app.v1', corrupt);
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState()).toMatchObject({ status: 'recovery', recoveryReason: 'corrupt' });
    store.getState().actions.addTransaction({
      type: 'expense',
      amount: 10,
      category: 'Food',
      note: 'Blocked',
      date: '2026-10-10',
    });
    expect(storage.values.get('wealthwise.app.v1')).toBe(corrupt);
    const backupKey = [...storage.values.keys()].find((key) => key.startsWith('wealthwise.app.v1.corrupt.'));
    expect(backupKey).toBeDefined();
    store.getState().actions.resolveRecovery('start-fresh');
    expect(store.getState().status).toBe('ready');
    expect(storage.values.has(backupKey!)).toBe(true);
    expect(JSON.parse(storage.values.get('wealthwise.app.v1')!).state.data.transactions).toEqual([]);
  });

  it('keeps newer-version data in recovery rather than allowing fresh-state writes', async () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ state: { data: mockAppData }, version: 99 });
    storage.values.set('wealthwise.app.v1', raw);
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState().recoveryReason).toBe('newer-version');
    expect(storage.values.get('wealthwise.app.v1')).toBe(raw);
    expect(() => store.getState().actions.resolveRecovery('start-fresh')).not.toThrow();
  });

  it('persists name and theme settings', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    store.getState().actions.updateSettings({ name: 'Asha', theme: 'dark' });
    const restored = makeStore(storage);
    await waitForHydration(restored);
    expect(restored.getState().data.settings).toEqual({ name: 'Asha', theme: 'dark' });
  });

  it('materializes the emergency fund goal after hydrating legacy valid data', async () => {
    const storage = new MemoryStorage();
    const dataWithoutGoal = { ...mockAppData, goals: [] };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: dataWithoutGoal }, version: 1 }));
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState().data.goals[0]).toMatchObject({ name: 'Emergency fund', auto: 'ef' });
  });

  it('captures failed action lookups and allows clearing the storage error', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    store.getState().actions.updateTransaction('missing', { note: 'No row' });
    expect(store.getState().lastError).toContain('not found');
    store.getState().actions.deleteTransaction('missing');
    expect(store.getState().lastError).toContain('not found');
    store.getState().actions.dismissStorageError();
    expect(store.getState().storageError).toBeNull();
  });

  it('exposes developer-only demo, erase, and corruption controls', async () => {
    const reload = jest.fn();
    const storage = new MemoryStorage();
    const store = makeStore(storage, { reload, isDev: true });
    await waitForHydration(store);
    const dev = store.getState().devActions;
    expect(dev).toBeDefined();
    dev!.loadDemoData();
    expect(store.getState().data.transactions).toEqual(mockAppData.transactions);
    dev!.eraseAll();
    expect(store.getState().data.transactions).toEqual([]);
    await dev!.simulateCorruption();
    expect(storage.values.get('wealthwise.app.v1')).toBe('{not json');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reports an unavailable reload when simulating corruption without a reload dependency', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage, { isDev: true });
    await waitForHydration(store);
    await expect(store.getState().devActions!.simulateCorruption()).rejects.toThrow('App reload is unavailable');
    expect(storage.values.get('wealthwise.app.v1')).toBe('{not json');
  });

  it('turns a persistence write failure into a dismissible user-facing error', async () => {
    class FailingStorage extends MemoryStorage {
      failWrites = false;

      setItem(name: string, value: string): void {
        if (this.failWrites) throw new Error('disk full');
        super.setItem(name, value);
      }
    }
    const storage = new FailingStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    storage.failWrites = true;
    store.getState().actions.updateSettings({ name: 'Unsaved' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getState().storageError).toMatch(/Free up storage/);
    store.getState().actions.dismissStorageError();
    expect(store.getState().storageError).toBeNull();
  });

  it('captures store hydration read errors as recovery', async () => {
    class FailingReadStorage extends MemoryStorage {
      getItem(name: string): string | null {
        if (name === 'wealthwise.app.v1') throw new Error('storage unavailable');
        return super.getItem(name);
      }
    }
    const store = makeStore(new FailingReadStorage());
    await waitForHydration(store);
    expect(store.getState()).toMatchObject({ status: 'recovery', recoveryReason: 'corrupt', hydrated: true });
  });

  it('covers successful action updates and non-Error factory failures', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    store.getState().actions.addTransaction({
      type: 'expense', amount: 50, category: 'Food', note: 'A', date: '2026-10-10',
    });
    const transactionId = store.getState().data.transactions[0]!.id;
    store.getState().actions.updateTransaction(transactionId, { amount: 75 });
    expect(store.getState().data.transactions[0]?.amount).toBe(75);
    store.getState().actions.deleteTransaction(transactionId);
    expect(store.getState().data.transactions).toEqual([]);

    const badIdStore = makeStore(new MemoryStorage(), { newId: () => { throw 'id unavailable'; } });
    await waitForHydration(badIdStore);
    badIdStore.getState().actions.addTransaction({
      type: 'expense', amount: 50, category: 'Food', note: 'A', date: '2026-10-10',
    });
    expect(badIdStore.getState().lastError).toBe('The requested change could not be completed.');
  });

  it('captures a settings update failure without throwing', async () => {
    const store = makeStore(new MemoryStorage());
    await waitForHydration(store);
    const patch = Object.defineProperty({}, 'name', {
      enumerable: true,
      get() {
        throw new Error('invalid settings patch');
      },
    });
    store.getState().actions.updateSettings(patch);
    expect(store.getState().lastError).toBe('invalid settings patch');
  });
});
