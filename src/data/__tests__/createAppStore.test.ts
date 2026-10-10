import type { StateStorage } from 'zustand/middleware';

import { mockAppData } from '../../mock/data';
import { createAppStore } from '../createAppStore';
import { behindBy } from '../../domain/sip';
import { validateIntegrity } from '../../domain/links';
import { loanState } from '../../domain/loan';
import { makeLoanPaymentFormSchema } from '../../domain/schemas';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  setItemCalls = 0;

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    this.setItemCalls += 1;
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
  today?: () => '2026-10-10' | '2026-10-11';
} = {}) => createAppStore(storage, {
  newId: overrides.newId ?? (() => 'fixed-id'),
  today: overrides.today ?? (() => '2026-10-10'),
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

  it('refuses start-fresh for newer-version data without changing its bytes or recovery status', async () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ state: { data: mockAppData }, version: 99 });
    storage.values.set('wealthwise.app.v1', raw);
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState().recoveryReason).toBe('newer-version');
    expect(storage.values.get('wealthwise.app.v1')).toBe(raw);
    const originalData = store.getState().data;
    const writes = storage.setItemCalls;
    store.getState().actions.resolveRecovery('start-fresh');
    expect(store.getState()).toMatchObject({
      status: 'recovery',
      recoveryReason: 'newer-version',
      storageError: 'This data was saved by a newer version of the app. Update the app to open it.',
    });
    expect(store.getState().data).toBe(originalData);
    expect(storage.values.get('wealthwise.app.v1')).toBe(raw);
    expect(storage.setItemCalls).toBe(writes);
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

  it('runs the plan installment integration scenario with one write per action and rehydrates links', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `id-${++id}` });
    await waitForHydration(store);
    const initialWrites = storage.setItemCalls;
    store.getState().actions.addPlan({
      name: 'Test SIP', type: 'Mutual fund / SIP', frequency: 'monthly', amount: 10_000,
      ratePct: 12, stepUpPct: 0, tenureYears: 10, startDate: '2026-07-01',
      trackFrom: '2026-07-01', opening: 0, actualValue: null, actualValueDate: null,
    });
    expect(storage.setItemCalls - initialWrites).toBe(1);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    const planId = store.getState().data.holdings[0]!.id;
    for (const date of ['2026-07-05', '2026-08-05', '2026-09-05']) {
      const before = storage.setItemCalls;
      store.getState().actions.addPlanLog(planId, { date, amount: 10_000, note: '' }, { recordTransaction: true });
      expect(storage.setItemCalls - before).toBe(1);
      expect(store.getState().lastError).toBeNull();
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    }
    const plan = store.getState().data.holdings[0]!;
    expect(plan.kind).toBe('plan');
    if (plan.kind === 'plan') {
      expect(behindBy(plan, '2026-10-09')).toBe(1);
    }
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    const restored = makeStore(storage, { newId: () => `restored-${++id}` });
    await waitForHydration(restored);
    expect(restored.getState().data.holdings).toEqual(store.getState().data.holdings);
    expect(restored.getState().data.transactions).toEqual(store.getState().data.transactions);

    const planAfterRestore = restored.getState().data.holdings[0]!;
    if (planAfterRestore.kind !== 'plan') throw new Error('Expected a plan after restore');
    const august = planAfterRestore.logs.find((log) => log.date === '2026-08-05')!;
    const augustTransaction = restored.getState().data.transactions.find((row) => row.source?.entryId === august.id)!;
    restored.getState().actions.updatePlanLog(planId, august.id, { amount: 11_000 });
    expect(restored.getState().data.transactions.find((row) => row.id === augustTransaction.id)?.amount).toBe(11_000);
    expect(validateIntegrity(restored.getState().data)).toEqual([]);
    const september = planAfterRestore.logs.find((log) => log.date === '2026-09-05')!;
    restored.getState().actions.deletePlanLog(planId, september.id);
    expect(restored.getState().data.transactions.some((row) => row.source?.entryId === september.id)).toBe(false);
    expect(validateIntegrity(restored.getState().data)).toEqual([]);
    restored.getState().actions.deletePlan(planId, { linkedTransactions: 'keep' });
    expect(restored.getState().data.transactions.every((row) => row.source === undefined)).toBe(true);
    expect(validateIntegrity(restored.getState().data)).toEqual([]);
  });

  it('supports deleting plans in both modes and records loan payment transactions atomically', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `id-${++id}` });
    await waitForHydration(store);
    const planInput = {
      name: 'Delete test', type: 'Mutual fund / SIP' as const, frequency: 'monthly' as const,
      amount: 100, ratePct: 1, stepUpPct: 0, tenureYears: 1, startDate: '2026-01-01',
      trackFrom: '2026-01-01', opening: 0, actualValue: null, actualValueDate: null,
    };
    store.getState().actions.addPlan(planInput);
    const keepPlanId = store.getState().data.holdings[0]!.id;
    store.getState().actions.addPlanLog(keepPlanId, { date: '2026-01-02', amount: 100, note: '' }, { recordTransaction: true });
    store.getState().actions.deletePlan(keepPlanId, { linkedTransactions: 'keep' });
    expect(store.getState().data.transactions[0]?.source).toBeUndefined();

    store.getState().actions.addPlan(planInput);
    const deletePlanId = store.getState().data.holdings[0]!.id;
    store.getState().actions.addPlanLog(deletePlanId, { date: '2026-01-02', amount: 100, note: '' }, { recordTransaction: true });
    store.getState().actions.deletePlan(deletePlanId, { linkedTransactions: 'delete' });
    expect(store.getState().data.transactions).toHaveLength(1);
    expect(store.getState().data.transactions[0]?.source).toBeUndefined();

    store.getState().actions.addLoan({
      name: 'Bank loan', principal: 100_000, ratePct: 12, tenureMonths: 12, emi: null, startDate: '2026-01-01',
    });
    const loanId = store.getState().data.loans[0]!.id;
    const before = storage.setItemCalls;
    store.getState().actions.addLoanPayment(loanId, { date: '2026-02-01', amount: 8_885, kind: 'EMI', note: '' }, { recordTransaction: true });
    expect(storage.setItemCalls - before).toBe(1);
    const linked = store.getState().data.transactions.find((transaction) => transaction.source?.kind === 'loan-payment');
    expect(linked?.source).toMatchObject({ kind: 'loan-payment', parentId: loanId });
    expect(linked).toMatchObject({ type: 'expense', category: 'EMI', note: 'Bank loan EMI' });
  });

  it('exercises every plan and loan store wrapper and captures linked/not-found errors', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `wrapper-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addPlan({
      name: 'Wrapper SIP', type: 'Gold', frequency: 'monthly', amount: 500, ratePct: 5,
      stepUpPct: 0, tenureYears: 1, startDate: '2026-01-01', trackFrom: '2026-01-01',
      opening: 0, actualValue: null, actualValueDate: null,
    });
    const planId = store.getState().data.holdings[0]!.id;
    actions.updatePlan(planId, { amount: 600 });
    actions.addPlanLog(planId, { date: '2026-02-01', amount: 600, note: '' }, { recordTransaction: true });
    const plan = store.getState().data.holdings[0]!;
    if (plan.kind !== 'plan') throw new Error('Expected plan');
    const logId = plan.logs[0]!.id;
    const txId = store.getState().data.transactions[0]!.id;
    actions.updatePlanLog(planId, logId, { note: 'Updated' });
    actions.updateTransaction(txId, { amount: 100 });
    expect(store.getState().lastError).toContain('linked');
    actions.deleteTransaction(txId);
    expect(store.getState().lastError).toContain('linked');
    actions.deletePlanLog(planId, logId);
    actions.deletePlan(planId, { linkedTransactions: 'delete' });

    actions.addLoan({ name: 'Wrapper loan', principal: 10_000, ratePct: 0, tenureMonths: 10, emi: 1000, startDate: '2026-01-01' });
    const loanId = store.getState().data.loans[0]!.id;
    actions.updateLoan(loanId, { emi: null });
    actions.addLoanPayment(loanId, { date: '2026-02-01', amount: 1000, kind: 'EMI', note: '' }, { recordTransaction: true });
    const paymentId = store.getState().data.loans[0]!.payments[0]!.id;
    actions.updateLoanPayment(loanId, paymentId, { amount: 1100 });
    actions.deleteLoanPayment(loanId, paymentId);
    actions.deleteLoan(loanId, { linkedTransactions: 'delete' });
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    actions.updatePlan('missing', { amount: 1 });
    expect(store.getState().lastError).toContain('not found');
    actions.updateLoanPayment('missing', 'missing', { amount: 1 });
    expect(store.getState().lastError).toContain('not found');
  });

  it('warns in development when a persisted action produces broken integrity', async () => {
    const storage = new MemoryStorage();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const store = makeStore(storage, { isDev: true });
    await waitForHydration(store);
    store.getState().actions.addPlan({
      name: 'Duplicate', type: 'Gold', frequency: 'monthly', amount: 1, ratePct: 0, stepUpPct: 0,
      tenureYears: 1, startDate: '2026-01-01', trackFrom: '2026-01-01', opening: 0,
      actualValue: null, actualValueDate: null,
    });
    store.getState().actions.addPlan({
      name: 'Duplicate again', type: 'Gold', frequency: 'monthly', amount: 1, ratePct: 0, stepUpPct: 0,
      tenureYears: 1, startDate: '2026-01-01', trackFrom: '2026-01-01', opening: 0,
      actualValue: null, actualValueDate: null,
    });
    expect(warn).toHaveBeenCalledWith('AppData integrity issues', expect.any(Array));
    warn.mockRestore();
  });

  it('runs the loan payment scenario through store actions and deletes all linked records', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `loan-scenario-${++id}` });
    await waitForHydration(store);
    store.getState().actions.addLoan({
      name: 'Scenario loan', principal: 100_000, ratePct: 12,
      tenureMonths: 12, emi: null, startDate: '2026-01-01',
    });

    const loanId = store.getState().data.loans[0]!.id;
    expect(store.getState().data.loans[0]?.emi).toBe(8_885);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    for (const date of ['2026-02-01', '2026-03-01', '2026-04-01']) {
      store.getState().actions.addLoanPayment(loanId, {
        date, amount: 8_885, kind: 'EMI', note: '',
      }, { recordTransaction: true });
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    }
    const loan = store.getState().data.loans[0]!;
    expect(loanState(loan, '2026-04-02').balance).toBeLessThan(100_000);
    const outstanding = loanState(loan, '2026-04-02').balance;
    expect(makeLoanPaymentFormSchema('2026-04-02', {
      startDate: loan.startDate, outstandingExcludingThis: outstanding,
    }).safeParse({
      date: '2026-04-02', amount: String(Math.ceil(outstanding) + 1),
      kind: 'Prepayment', note: '', recordTransaction: true,
    }).success).toBe(false);
    store.getState().actions.deleteLoan(loanId, { linkedTransactions: 'delete' });
    expect(store.getState().data.loans).toEqual([]);
    expect(store.getState().data.transactions).toEqual([]);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });
});
