import type { StateStorage } from 'zustand/middleware';

import { createBackup, parseBackup } from '../../domain/backup';
import { validateIntegrity } from '../../domain/links';
import { loanState } from '../../domain/liability';
import { monthPositionAt } from '../../domain/cashFlow';
import { budgetMonthView, defaultBudgetSections } from '../../domain/budget';
import { netWorth } from '../../domain/summary';
import { makeLiabilityPaymentFormSchema } from '../../domain/schemas';
import { behindBy } from '../../domain/sip';
import { holdingValue } from '../../domain/portfolio';
import { pendingItems } from '../../domain/pending';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import { SUGGESTED_EF_ALLOCATION } from '../../domain/efAllocation';
import { createAppStore } from '../createAppStore';
import { makeV1Fixture, makeV2Fixture, makeV4Fixture, makeV5Fixture, makeV6Fixture } from '../testFixtures/v1';
import { emptyAppData } from '../../domain/actions';
import type { ISODate } from '../../domain/types';
import { budgetPlanFromLines, monthBudgetFromLines } from '../../testFixtures/budget';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  setItemCalls = 0;
  calls: string[] = [];
  failSetKey: string | null = null;

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    this.calls.push(`set:${name}`);
    this.setItemCalls += 1;
    if (name === this.failSetKey) throw new Error('write failed');
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.calls.push(`remove:${name}`);
    this.values.delete(name);
  }
}

const makeStore = (storage: StateStorage, overrides: {
  newId?: () => string;
  reload?: () => void;
  isDev?: boolean;
  removeLockSettings?: () => Promise<void>;
  today?: () => ISODate;
} = {}) => createAppStore(storage, {
  newId: overrides.newId ?? (() => 'fixed-id'),
  today: overrides.today ?? (() => '2026-10-10'),
  reload: overrides.reload,
  removeLockSettings: overrides.removeLockSettings,
  ...(overrides.isDev === undefined ? {} : { isDev: overrides.isDev }),
});
const { createHash } = jest.requireActual<{
  createHash: (algorithm: string) => { update: (text: string) => { digest: (encoding: 'hex') => string } };
}>('crypto');
const sha256 = async (text: string) => createHash('sha256').update(text).digest('hex');

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
  it('updates linked policy details with one persisted write', async () => {
    const storage = new MemoryStorage();
    const policy = {
      id: 'policy-update',
      name: 'Health cover',
      insurer: 'Old insurer',
      kind: 'health' as const,
      premium: 600,
      frequency: 'monthly' as const,
      startDate: '2026-01-01',
      premiumYears: 10,
      trackFrom: '2026-01-01',
      coverAmount: 100_000,
      currentValue: null,
      valueAsOf: null,
      maturityDate: null,
      payments: [],
    };
    const data = { ...emptyAppData('2026-10-10'), policies: [policy] };
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data }, version: 10,
    }));
    const store = makeStore(storage);
    await waitForHydration(store);
    const writes = storage.setItemCalls;
    store.getState().actions.updatePolicy(policy.id, { name: 'Family cover', premium: 750 });
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.policies[0]).toMatchObject({
      id: policy.id,
      name: 'Family cover',
      insurer: 'Old insurer',
      premium: 750,
    });
  });

  it('stores a single budget plan and applied month with one write per action', async () => {
    const storage = new MemoryStorage();
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: emptyAppData('2026-03-01') }, version: 10,
    }));
    let nextId = 0;
    const store = createAppStore(storage, {
      newId: () => `budget-${++nextId}`,
      today: () => '2026-10-10',
      isDev: false,
    });
    await waitForHydration(store);

    let writes = storage.setItemCalls;
    store.getState().actions.saveBudgetPlan(budgetPlanFromLines([
      { category: 'Food', mode: 'percent', value: 20 },
    ], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 20_000 }],
    }));
    expect(storage.setItemCalls - writes).toBe(1);
    writes = storage.setItemCalls;
    store.getState().actions.setBudgetRepeat(true, '2026-11');
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.budgetPlan?.repeatFrom).toBe('2026-11');
    writes = storage.setItemCalls;
    store.getState().actions.setBudgetRepeat(false, null);
    expect(storage.setItemCalls - writes).toBe(1);
    writes = storage.setItemCalls;
    store.getState().actions.applyBudgetPlan('2026-03');
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.monthBudgets?.[0]?.items).toEqual([
      expect.objectContaining({ name: 'Food', value: 4_000 }),
    ]);
    expect(pendingItems(store.getState().data, '2026-03', '2026-10-10'))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'budget', title: 'Food', amount: 4_000, status: 'planned' }),
      ]));
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    writes = storage.setItemCalls;
    store.getState().actions.applyBudgetPlan('2026-10');
    expect(storage.setItemCalls - writes).toBe(1);
    const plannedRow = pendingItems(store.getState().data, '2026-10', '2026-10-10')
      .find((item) => item.kind === 'budget' && item.category === 'Food');
    if (!plannedRow) throw new Error('Expected a planned Food row.');
    const closingBeforeClear = monthPositionAt(store.getState().data.transactions, '2026-10').closing;
    writes = storage.setItemCalls;
    store.getState().actions.addTransaction({
      type: 'expense',
      amount: plannedRow.amount,
      category: plannedRow.category,
      note: '',
      date: '2026-10-10',
    });
    expect(storage.setItemCalls - writes).toBe(1);
    expect(budgetMonthView(store.getState().data, '2026-10').lines
      .find((line) => line.category === 'Food')?.actual).toBe(plannedRow.amount);
    expect(pendingItems(store.getState().data, '2026-10', '2026-10-10')
      .some((item) => item.kind === 'budget' && item.category === 'Food')).toBe(false);
    expect(monthPositionAt(store.getState().data.transactions, '2026-10').closing)
      .toBe(closingBeforeClear - plannedRow.amount);
    const transaction = store.getState().data.transactions.at(-1);
    if (!transaction) throw new Error('Planned item transaction was not created.');
    writes = storage.setItemCalls;
    store.getState().actions.deleteTransaction(transaction.id);
    expect(storage.setItemCalls - writes).toBe(1);
    expect(pendingItems(store.getState().data, '2026-10', '2026-10-10')
      .some((item) => item.kind === 'budget' && item.category === 'Food')).toBe(true);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    writes = storage.setItemCalls;
    store.getState().actions.saveAndApplyBudgetPlan(budgetPlanFromLines([
      { category: 'Bills', mode: 'amount', value: 1_000 },
    ], {
      incomes: [{ id: 'salary-2', name: 'Salary', category: 'Salary', amount: 10_000 }],
    }), '2026-04');
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.monthBudgets).toHaveLength(3);
    expect(store.getState().data.monthBudgets?.map((budget) => budget.month))
      .toEqual(expect.arrayContaining(['2026-03', '2026-04', '2026-10']));
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('edits and removes budget items in one write and restores exact data with one Undo write', async () => {
    const storage = new MemoryStorage();
    const before = {
      ...emptyAppData('2026-03-15'),
      budgetPlan: budgetPlanFromLines([
        { category: 'Food', mode: 'percent' as const, value: 10, dueDay: 5 },
      ], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000, day: 1 }],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      }),
      monthBudgets: [monthBudgetFromLines('2026-03', [
        { category: 'Food', planned: 1_000, dueDay: 5 },
      ], {
        source: 'plan',
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary' as const, amount: 10_000, day: 1 }],
        linkedIncluded: true,
      })],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: before }, version: 10,
    }));
    const store = makeStore(storage, { isDev: false, today: () => '2026-03-15' });
    await waitForHydration(store);

    let writes = storage.setItemCalls;
    store.getState().actions.editBudgetItem(
      '2026-03',
      { kind: 'line', category: 'Food' },
      { amount: 1_500, dueDay: 12 },
      'following',
      '2026-03-15',
    );
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.budgetPlan?.items[0]).toMatchObject({
      name: 'Food', mode: 'amount', value: 1_500, dueDay: 12,
    });
    writes = storage.setItemCalls;
    store.getState().actions.restoreBudgetPlanAndMonth(
      before.budgetPlan,
      '2026-03',
      before.monthBudgets[0] ?? null,
    );
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data).toEqual(before);

    writes = storage.setItemCalls;
    store.getState().actions.removeBudgetItem(
      '2026-03',
      { kind: 'line', category: 'Food' },
      'month',
      '2026-03-15',
    );
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.monthBudgets?.[0]?.items).toEqual([]);
    writes = storage.setItemCalls;
    store.getState().actions.restoreBudgetPlanAndMonth(
      before.budgetPlan,
      '2026-03',
      before.monthBudgets[0] ?? null,
    );
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data).toEqual(before);
  });

  it('migrates the default v7 template to a non-repeating plan without applying a month', async () => {
    const storage = new MemoryStorage();
    const { budgetPlan: _budgetPlan, ...v7Base } = emptyAppData('2026-03-01');
    const data = {
      ...v7Base,
      budgetTemplates: [{
        id: 'default', name: 'Default', plannedIncome: 20_000,
        lines: [{ category: 'Food', mode: 'amount' as const, value: 5_000 }],
      }],
      defaultBudgetTemplateId: 'default',
    };
    const raw = JSON.stringify({ state: { data }, version: 7 });
    storage.values.set('wealthwise.app.v1', raw);
    const store = createAppStore(storage, {
      newId: () => 'unused', today: () => '2026-03-15', isDev: false,
    });
    await waitForHydration(store);
    expect(store.getState().data.budgetPlan).toMatchObject({
      incomes: [{ id: 'unused', name: 'Salary', category: 'Salary', amount: 20_000, day: 1 }],
      repeatMonthly: false,
    });
    expect(store.getState().data.monthBudgets).toEqual([]);
    expect(storage.setItemCalls).toBe(2);
    expect(storage.values.get('wealthwise.app.v1.premigration.v7')).toBe(raw);
  });

  it('archives v8 bytes once, migrates income totals, and removes the archive on erase', async () => {
    const storage = new MemoryStorage();
    const data = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: {
        plannedIncome: 12_000,
        lines: [{ category: 'Food', mode: 'amount' as const, value: 2_000 }],
        repeatMonthly: true,
        repeatFrom: '2026-04',
      },
      monthBudgets: [{
        month: '2026-03',
        source: 'custom' as const,
        plannedIncome: 10_000,
        lines: [{ category: 'Food', planned: 1_000 }],
      }],
    };
    const key = 'wealthwise.app.v1';
    const raw = JSON.stringify({ state: { data }, version: 8 });
    storage.values.set(key, raw);
    let id = 0;
    const first = makeStore(storage, {
      today: () => '2026-03-15',
      newId: () => `migrated-${++id}`,
      isDev: false,
    });
    await waitForHydration(first);
    expect(first.getState().data.budgetPlan?.incomes).toEqual([
      { id: 'migrated-1', name: 'Salary', category: 'Salary', amount: 12_000, day: 1 },
    ]);
    expect(first.getState().data.monthBudgets?.[0]?.incomes).toEqual([
      { id: 'migrated-2', name: 'Income', category: 'Salary', amount: 10_000 },
    ]);
    expect(storage.values.get(`${key}.premigration.v8`)).toBe(raw);
    const archiveWrites = storage.calls.filter((call) => call === `set:${key}.premigration.v8`).length;
    const second = makeStore(storage, { today: () => '2026-03-15', isDev: false });
    await waitForHydration(second);
    expect(storage.calls.filter((call) => call === `set:${key}.premigration.v8`)).toHaveLength(archiveWrites);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has(`${key}.premigration.v8`)).toBe(false);
  });

  it('repairs a stale emergency allocation once and archives the exact original bytes', async () => {
    const storage = new MemoryStorage();
    const key = 'wealthwise.app.v1';
    const data = {
      ...emptyAppData('2026-03-01'),
      goals: [{
        id: 'ef-goal', name: 'Emergency fund', target: 100_000, saved: 0,
        year: 2028, auto: 'ef' as const, links: [],
      }],
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, 'deleted-custom-option': 0 },
    };
    const raw = JSON.stringify({ state: { data }, version: 10 });
    storage.values.set(key, raw);

    const store = makeStore(storage, { today: () => '2026-03-15', isDev: false });
    await waitForHydration(store);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(store.getState().status).toBe('ready');
    expect(store.getState().data.efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
    });
    expect(storage.values.get(`${key}.prerepair-efallocation`)).toBe(raw);
    expect(storage.calls.filter((call) => call === `set:${key}`)).toHaveLength(1);

    const writesBeforeSecondHydration = storage.setItemCalls;
    const secondStore = makeStore(storage, { today: () => '2026-03-15', isDev: false });
    await waitForHydration(secondStore);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(storage.setItemCalls).toBe(writesBeforeSecondHydration);
    expect(storage.calls.filter((call) => call === `set:${key}.prerepair-efallocation`)).toHaveLength(1);
    expect(storage.values.get(`${key}.prerepair-efallocation`)).toBe(raw);
  });

  it('repairs an empty allocation to the three requested defaults only once', async () => {
    const storage = new MemoryStorage();
    const key = 'wealthwise.app.v1';
    const data = {
      ...emptyAppData('2026-03-01'),
      goals: [{
        id: 'ef-goal', name: 'Emergency fund', target: 100_000, saved: 0,
        year: 2028, auto: 'ef' as const, links: [],
      }],
      efAllocation: {},
    };
    const raw = JSON.stringify({ state: { data }, version: 10 });
    storage.values.set(key, raw);

    const store = makeStore(storage, { today: () => '2026-03-15', isDev: false });
    await waitForHydration(store);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(store.getState().data.efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 50,
    });
    expect(storage.values.get(`${key}.prerepair-efallocation`)).toBe(raw);
    expect(storage.calls.filter((call) => call === `set:${key}`)).toHaveLength(1);

    const writesAfterRepair = storage.setItemCalls;
    const secondStore = makeStore(storage, { today: () => '2026-03-15', isDev: false });
    await waitForHydration(secondStore);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(storage.setItemCalls).toBe(writesAfterRepair);
    expect(storage.calls.filter((call) => call === `set:${key}.prerepair-efallocation`)).toHaveLength(1);
  });

  it('restores a replaced plan and month with one write and deep-equal data', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 1_000 }], {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000 }],
      }),
      monthBudgets: [monthBudgetFromLines('2026-03', [{ category: 'Bills', planned: 500 }], {
        incomes: [{ id: 'income', name: 'Income', category: 'Salary', amount: 9_000 }],
      })],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: initial }, version: 10 }));
    const store = createAppStore(storage, {
      newId: () => 'unused',
      today: () => '2026-03-15',
      isDev: false,
    });
    await waitForHydration(store);
    const before = store.getState().data;
    const previous = before.monthBudgets?.find((budget) => budget.month === '2026-03') ?? null;

    let writes = storage.setItemCalls;
    store.getState().actions.saveAndApplyBudgetPlan(budgetPlanFromLines([
      { category: 'Food', mode: 'percent', value: 25 },
    ], {
      incomes: [{ id: 'salary-next', name: 'Salary', category: 'Salary', amount: 20_000 }],
      repeatMonthly: true,
      repeatFrom: '2026-04',
    }), '2026-03');
    expect(storage.setItemCalls - writes).toBe(1);

    writes = storage.setItemCalls;
    store.getState().actions.restoreBudgetPlanAndMonth(before.budgetPlan, '2026-03', previous);
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data).toEqual(before);
  });

  it('applies a repeating plan once after hydration and stays idempotent on the next launch', async () => {
    const storage = new MemoryStorage();
    const data = {
      ...emptyAppData('2026-03-01'),
      budgetPlan: {
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000, day: 1 }],
        lines: [{ category: 'Food', mode: 'amount' as const, value: 1_000 }],
        repeatMonthly: true,
        repeatFrom: '2026-03',
      },
      monthBudgets: [],
    };
    const rawV9 = JSON.stringify({ state: { data }, version: 9 });
    storage.values.set('wealthwise.app.v1', rawV9);
    const createStore = () => createAppStore(storage, {
      newId: () => 'unused',
      today: () => '2026-03-15',
      isDev: false,
    });
    const firstStore = createStore();
    await waitForHydration(firstStore);
    expect(firstStore.getState().data.monthBudgets).toEqual([{
      month: '2026-03',
      source: 'plan',
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000, day: 1 }],
      sections: defaultBudgetSections(),
      items: [{
        id: 'unused', sectionId: 'survival', name: 'Food', mode: 'amount', value: 1_000,
      }],
      linkedIncluded: true,
    }]);
    expect(storage.values.get('wealthwise.app.v1.premigration.v9')).toBe(rawV9);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1')).toHaveLength(2);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v9')).toHaveLength(1);

    storage.setItemCalls = 0;
    const secondStore = createStore();
    await waitForHydration(secondStore);
    expect(secondStore.getState().data.monthBudgets).toEqual(firstStore.getState().data.monthBudgets);
    expect(storage.setItemCalls).toBe(0);
  });

  it('applies each managed budget mutation with one persisted write', async () => {
    const storage = new MemoryStorage();
    const today = '2026-03-15';
    const month = '2026-03';
    const plan = budgetPlanFromLines([{ category: 'Food', mode: 'amount', value: 100 }], {
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 1_000 }],
    });
    plan.sections.push({ id: 'pets', name: 'Pets', type: 'spend' });
    const snapshot = monthBudgetFromLines(month, [{ category: 'Food', planned: 100 }], {
      source: 'plan',
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 1_000 }],
    });
    snapshot.sections = plan.sections.map((section) => ({ ...section }));
    const data = { ...emptyAppData(today), budgetPlan: plan, monthBudgets: [snapshot] };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data }, version: 10 }));
    const store = makeStore(storage, { today: () => today });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const runOnce = (action: () => void) => {
      const writesBefore = storage.calls.filter((call) => call === 'set:wealthwise.app.v1').length;
      action();
      expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1').length - writesBefore).toBe(1);
      expect(store.getState().lastError).toBeNull();
    };

    runOnce(() => actions.addSection(month, { name: 'Travel extras', type: 'spend' }, 'month', today));
    const addedSection = store.getState().data.monthBudgets?.[0]?.sections.find((section) =>
      section.name === 'Travel extras');
    if (!addedSection) throw new Error('Added budget section missing.');
    runOnce(() => actions.renameSection(month, addedSection.id, 'Trips', 'month', today));
    runOnce(() => actions.changeSectionType(month, addedSection.id, 'invest', 'month', today));
    const beforeIncome = store.getState().data;
    runOnce(() => actions.addBudgetIncome(month, {
      name: 'Freelance', category: 'Freelance', amount: 500, day: 12,
    }, 'following', today));
    expect(store.getState().data.budgetPlan?.incomes)
      .toContainEqual(expect.objectContaining({ name: 'Freelance', amount: 500, day: 12 }));
    expect(store.getState().data.monthBudgets?.[0]?.incomes)
      .toContainEqual(expect.objectContaining({ name: 'Freelance', amount: 500, day: 12 }));
    runOnce(() => actions.restoreBudgetPlanAndMonth(
      beforeIncome.budgetPlan,
      month,
      beforeIncome.monthBudgets?.find((budget) => budget.month === month) ?? null,
    ));
    expect(store.getState().data).toEqual(beforeIncome);
    runOnce(() => actions.addBudgetItem(month, {
      sectionId: addedSection.id, name: 'Pet care', mode: 'amount', value: 100,
    }, 'month', today));
    const addedItem = store.getState().data.monthBudgets?.[0]?.items.find((item) => item.name === 'Pet care');
    if (!addedItem) throw new Error('Added budget item missing.');
    runOnce(() => actions.editBudgetStructureItem(month, addedItem.id, { value: 200 }, 'month', today));
    runOnce(() => actions.deleteBudgetStructureItem(month, addedItem.id, 'month', today));
    runOnce(() => actions.deleteSection(month, addedSection.id, 'month', today));
  });

  it('records a shortfall allocation atomically with one persisted write', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-01-01'),
      transactions: [
        { id: 'income', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-01-01' },
        { id: 'expense', type: 'expense' as const, amount: 300, category: 'Living', note: '', date: '2026-01-02' },
      ],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: initial }, version: 7 }));
    let nextId = 0;
    const store = createAppStore(storage, {
      newId: () => `movement-${++nextId}`,
      today: () => '2026-02-10',
      isDev: false,
    });
    await waitForHydration(store);
    const before = storage.setItemCalls;

    store.getState().actions.fundShortfall('2026-01', [
      { kind: 'borrowed', amount: 50, lenderName: 'Friend' },
    ]);

    expect(storage.setItemCalls - before).toBe(1);
    expect(store.getState().data.liabilities).toHaveLength(1);
    expect(store.getState().data.transactions).toHaveLength(3);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    const movementWrites = storage.setItemCalls;
    store.getState().actions.recordMoneyMovement({
      kind: 'borrowed-in', lenderName: 'Aunt', amount: 30, date: '2026-01-15',
    });
    expect(storage.setItemCalls - movementWrites).toBe(1);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    const referenceBeforeFailure = store.getState().data;
    const writesBeforeFailure = storage.setItemCalls;
    store.getState().actions.fundShortfall('2026-01', [
      { kind: 'own-funds', amount: 500, note: 'Too much' },
    ]);
    expect(store.getState().data).toBe(referenceBeforeFailure);
    expect(storage.setItemCalls).toBe(writesBeforeFailure);
  });

  it.each(['recurring', 'one-time'] as const)(
    'records received %s liability proceeds with one persisted write',
    async (kind) => {
      const storage = new MemoryStorage();
      let nextId = 0;
      const store = makeStore(storage, { newId: () => `received-${++nextId}` });
      await waitForHydration(store);
      const liability = kind === 'recurring'
        ? {
          kind,
          type: 'Personal loan' as const,
          name: 'Personal loan',
          principal: 20_000,
          ratePct: 8,
          tenureMonths: 12,
          emi: null,
          startDate: '2026-10-01',
        }
        : {
          kind,
          type: 'Borrowed money' as const,
          name: 'Friend',
          principal: 20_000,
          ratePct: 0,
          dueDate: '2027-01-01',
          startDate: '2026-10-01',
        };
      const writesBefore = storage.setItemCalls;

      store.getState().actions.recordMoneyMovement({
        kind: 'loan-received',
        amount: 20_000,
        date: '2026-10-01',
        liability,
      });

      const result = store.getState();
      expect(storage.setItemCalls - writesBefore).toBe(1);
      expect(result.data.liabilities).toHaveLength(1);
      expect(result.data.transactions.at(-1)).toMatchObject({
        type: 'income',
        amount: 20_000,
        date: '2026-10-01',
        category: kind === 'recurring' ? 'Loan proceeds' : 'Borrowed',
        source: {
          kind: 'liability-origin',
          parentId: result.data.liabilities[0]?.id,
        },
      });
      expect(validateIntegrity(result.data)).toEqual([]);
    },
  );

  it('sets goal asset links with exactly one write and keeps failed actions reference-identical', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-10-01'),
      holdings: [{
        id: 'asset',
        kind: 'manual' as const,
        name: 'Savings',
        type: 'Savings account' as const,
        invested: 500,
        value: 1_000,
        valueAsOf: '2026-10-01',
        logs: [],
      }],
      goals: [
        ...emptyAppData('2026-10-01').goals,
        { id: 'goal', name: 'Trip', target: 10_000, saved: 0, year: 2028, links: [] },
      ],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: initial }, version: 7 }));
    const store = makeStore(storage);
    await waitForHydration(store);
    const actions = store.getState().actions;
    const writesBefore = storage.setItemCalls;

    actions.setGoalLinks('goal', [{ instrumentId: 'asset', share: 75 }]);

    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(store.getState().data.goals.find((goal) => goal.id === 'goal')?.links)
      .toEqual([{ instrumentId: 'asset' }]);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    const dataBeforeFailure = store.getState().data;
    const writesBeforeFailure = storage.setItemCalls;
    actions.setGoalLinks('missing-goal', [{ instrumentId: 'asset', share: 25 }]);
    expect(store.getState().data).toBe(dataBeforeFailure);
    expect(storage.setItemCalls).toBe(writesBeforeFailure);
  });

  it('saves emergency fund allocation with one persisted write and rehydrates it', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    const writesBefore = storage.setItemCalls;
    const allocation = { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 };

    store.getState().actions.setEfAllocation(allocation);

    expect(storage.setItemCalls - writesBefore).toBe(1);
    const resolvedAllocation = {
      cash: 20,
      bank: 30,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
    };
    expect(store.getState().data.efAllocation).toEqual(resolvedAllocation);
    const relaunchedStore = makeStore(storage);
    await waitForHydration(relaunchedStore);
    expect(relaunchedStore.getState().data.efAllocation).toEqual(resolvedAllocation);
  });

  it('saves custom buckets, percentages, and investment links in one persisted write', async () => {
    const storage = new MemoryStorage();
    let nextId = 0;
    const store = makeStore(storage, { newId: () => `ef-plan-${++nextId}` });
    await waitForHydration(store);
    store.getState().actions.addHolding({
      name: 'Savings', type: 'Savings account', invested: 1_000, value: 1_000,
    });
    const holding = store.getState().data.holdings[0];
    if (!holding) throw new Error('Expected the added holding.');
    const writesBefore = storage.setItemCalls;

    store.getState().actions.saveEfPlan({
      customBuckets: [{ id: 'draft-1', name: 'Safe box', access: 'instant', marketLinked: false }],
      allocation: {
        cash: 0, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'draft-1': 10,
      },
      links: { 'draft-1': [holding.id] },
    });

    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(store.getState().data.efCustomBuckets).toEqual([{
      id: 'ef-plan-2', name: 'Safe box', access: 'instant', marketLinked: false,
    }]);
    expect(store.getState().data.efCustomBuckets[0]?.id).toBe('ef-plan-2');
    expect(store.getState().data.efBucketLinks).toEqual({ 'ef-plan-2': [holding.id] });
    expect(store.getState().data.efAllocation?.['ef-plan-2']).toBe(10);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    const writesBeforeUngroup = storage.setItemCalls;
    store.getState().actions.saveEfPlan({
      customBuckets: [],
      allocation: { cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 },
      links: {},
    });
    expect(storage.setItemCalls - writesBeforeUngroup).toBe(1);
    expect(store.getState().data.efCustomBuckets).toEqual([]);
    expect(store.getState().data.efBucketLinks).toEqual({});
    expect(store.getState().data.goals.find((goal) => goal.auto === 'ef')?.links)
      .toContainEqual({ instrumentId: holding.id });
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    const writesBeforeDelete = storage.setItemCalls;
    store.getState().actions.deleteHolding(holding.id);
    expect(storage.setItemCalls - writesBeforeDelete).toBe(1);
    expect(store.getState().data.efBucketLinks).toEqual({});
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('clears one due and bulk-settles dues with one persisted write per action', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-01-01'),
      holdings: [{
        id: 'past-plan',
        kind: 'plan' as const,
        name: 'Past plan',
        type: 'Mutual fund / SIP' as const,
        frequency: 'monthly' as const,
        amount: 100,
        ratePct: 0,
        stepUpPct: 0,
        tenureYears: 1,
        startDate: '2026-08-01',
        trackFrom: '2026-08-01',
        opening: 0,
        actualValue: null,
        actualValueDate: null,
        logs: [],
      }],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: initial }, version: 7 }));
    let id = 0;
    const store = makeStore(storage, { newId: () => `due-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;

    let writesBefore = storage.setItemCalls;
    const firstPending = pendingItems(store.getState().data, '2026-08', '2026-10-10')
      .find((item) => item.source.kind === 'plan');
    if (!firstPending || firstPending.source.kind !== 'plan') throw new Error('Expected a plan due.');
    const entryId = actions.clearDue(
      { kind: 'plan', id: 'past-plan' },
      firstPending.source.slotId,
    );
    expect(entryId).toBe('due-1');
    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    writesBefore = storage.setItemCalls;
    const summary = actions.clearPastDues({ kind: 'plan', id: 'past-plan' }, {
      mode: 'settle',
      addSkippedToOpening: true,
    });
    expect(summary?.count).toBeGreaterThan(0);
    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('persists clear undo and each add-with-history action in exactly one write', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `history-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const assertOneWrite = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
      expect(store.getState().lastError).toBeNull();
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };

    assertOneWrite(() => actions.addPlan({
      name: 'Today plan',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-10-10',
      trackFrom: '2026-10-10',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
    }));
    const plan = store.getState().data.holdings.find((holding) => holding.kind === 'plan');
    if (!plan || plan.kind !== 'plan') throw new Error('Test plan was not created.');
    let entryId: string | undefined;
    const beforeClear = storage.setItemCalls;
    entryId = actions.clearDue({ kind: 'plan', id: plan.id });
    expect(storage.setItemCalls - beforeClear).toBe(1);
    expect(entryId).toBeDefined();
    assertOneWrite(() => actions.undoClearDue({ kind: 'plan', id: plan.id }, entryId ?? ''));

    assertOneWrite(() => actions.addPlanWithHistory({
      name: 'Past plan',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-08-10',
      trackFrom: '2026-08-10',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
    }, 'settle'));
    assertOneWrite(() => actions.addLiabilityWithHistory({
      kind: 'recurring',
      name: 'Past liability',
      type: 'Personal loan',
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-08-10',
      tenureMonths: 12,
      emi: 100,
    }, 'settle'));
    assertOneWrite(() => actions.addPolicyWithHistory({
      name: 'Past policy',
      insurer: '',
      kind: 'health',
      premium: 50,
      frequency: 'monthly',
      startDate: '2026-08-10',
      premiumYears: 1,
      trackFrom: '2026-08-10',
      coverAmount: null,
      currentValue: null,
      valueAsOf: null,
      maturityDate: null,
    }, 'settle'));
  });

  it('clears multiple plan dues and fully undoes them with one persisted write per action', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `through-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addPlan({
      name: 'Four month plan',
      type: 'Mutual fund / SIP',
      frequency: 'monthly',
      amount: 100,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-08-10',
      trackFrom: '2026-08-10',
      opening: 0,
      actualValue: null,
      actualValueDate: null,
    });
    const plan = store.getState().data.holdings.find((holding) => holding.kind === 'plan');
    if (!plan || plan.kind !== 'plan') throw new Error('Test plan was not created.');
    const original = store.getState().data;
    const closingBefore = monthPositionAt(original.transactions, '2026-10').closing;

    const clearWrites = storage.setItemCalls;
    const entryIds = actions.clearDuesThrough({ kind: 'plan', id: plan.id }, '2026-10-10');
    expect(storage.setItemCalls - clearWrites).toBe(1);
    expect(entryIds).toHaveLength(3);
    expect(store.getState().lastError).toBeNull();
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    const cleared = store.getState().data;
    const updatedPlan = cleared.holdings.find((holding) => holding.id === plan.id);
    if (!updatedPlan || updatedPlan.kind !== 'plan') throw new Error('Plan missing after clearing.');
    expect(updatedPlan.logs).toHaveLength(3);
    expect(pendingItems(cleared, '2026-10', '2026-10-10')
      .some((item) => item.source.kind === 'plan' && item.source.parentId === plan.id)).toBe(false);
    expect(cleared.transactions.filter((transaction) => transaction.date.slice(0, 7) === '2026-10'))
      .toHaveLength(3);
    expect(monthPositionAt(cleared.transactions, '2026-10').closing).toBe(closingBefore - 300);

    const undoWrites = storage.setItemCalls;
    actions.undoClearDuesThrough({ kind: 'plan', id: plan.id }, entryIds ?? []);
    expect(storage.setItemCalls - undoWrites).toBe(1);
    expect(store.getState().lastError).toBeNull();
    expect(store.getState().data).toEqual(original);
  });

  it('clears recurring liability installments and undoes linked payments in one write each', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `liability-through-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const addWrites = storage.setItemCalls;
    actions.addLiability({
      kind: 'recurring',
      name: 'Monthly repayment',
      type: 'Personal loan',
      principal: 1_200,
      ratePct: 0,
      startDate: '2026-08-10',
      tenureMonths: 12,
      emi: 100,
    });
    expect(storage.setItemCalls - addWrites).toBe(1);
    const liability = store.getState().data.liabilities.find((item) => item.kind === 'recurring');
    if (!liability || liability.kind !== 'recurring') throw new Error('Test liability was not created.');
    const original = store.getState().data;

    const clearWrites = storage.setItemCalls;
    const entryIds = actions.clearDuesThrough({ kind: 'liability', id: liability.id }, '2026-10-10');
    expect(storage.setItemCalls - clearWrites).toBe(1);
    expect(entryIds).toHaveLength(2);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    const cleared = store.getState().data;
    expect(cleared.transactions.filter((transaction) =>
      transaction.source?.kind === 'liability-payment' && transaction.source.parentId === liability.id,
    )).toHaveLength(2);
    expect(pendingItems(cleared, '2026-10', '2026-10-10')
      .some((item) => item.source.kind === 'liability' && item.source.parentId === liability.id)).toBe(false);
    const clearedLiability = cleared.liabilities.find((item) => item.id === liability.id);
    if (!clearedLiability) throw new Error('Liability missing after clearing.');
    expect(loanState(clearedLiability, '2026-10-10').balance)
      .toBeLessThan(loanState(liability, '2026-10-10').balance);

    const undoWrites = storage.setItemCalls;
    actions.undoClearDuesThrough({ kind: 'liability', id: liability.id }, entryIds ?? []);
    expect(storage.setItemCalls - undoWrites).toBe(1);
    expect(store.getState().data).toEqual(original);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('clears and undoes a one-time liability due with exactly one persisted write per action', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `one-time-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    let writes = storage.setItemCalls;
    actions.addLiability({
      kind: 'one-time',
      name: 'Friend loan',
      type: 'Borrowed money',
      principal: 1_000,
      ratePct: 0,
      startDate: '2026-10-10',
      dueDate: '2026-10-10',
    });
    expect(storage.setItemCalls - writes).toBe(1);
    const liability = store.getState().data.liabilities.find((item) => item.kind === 'one-time');
    if (!liability || liability.kind !== 'one-time') throw new Error('Test one-time liability was not created.');
    const original = store.getState().data;

    writes = storage.setItemCalls;
    const entryId = actions.clearDue({ kind: 'liability', id: liability.id });
    expect(storage.setItemCalls - writes).toBe(1);
    expect(entryId).toBeDefined();
    const cleared = store.getState().data;
    const paid = cleared.liabilities.find((item) => item.id === liability.id);
    if (!paid || paid.kind !== 'one-time') throw new Error('One-time liability missing after clearing.');
    expect(paid.payments).toHaveLength(1);
    expect(loanState(paid, '2026-10-10').balance).toBe(0);
    expect(cleared.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'expense',
        amount: 1_000,
        date: '2026-10-10',
        source: { kind: 'liability-payment', parentId: liability.id, entryId },
      }),
    ]));
    expect(pendingItems(cleared, '2026-10', '2026-10-10')
      .some((item) => item.source.kind === 'liability' && item.source.parentId === liability.id)).toBe(false);
    expect(validateIntegrity(cleared)).toEqual([]);

    writes = storage.setItemCalls;
    actions.undoClearDue({ kind: 'liability', id: liability.id }, entryId ?? '');
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data).toEqual(original);
  });

  it.each(['manual', 'plan'] as const)('links and guards a withdrawal from a %s instrument', async (kind) => {
    const storage = new MemoryStorage();
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: mockAppData }, version: 10 }));
    let id = 0;
    const store = makeStore(storage, { newId: () => `withdrawal-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const writesBefore = storage.setItemCalls;

    if (kind === 'manual' || kind === 'plan') {
      const holding = store.getState().data.holdings.find((item) => item.kind === kind);
      if (!holding) throw new Error(`Missing ${kind} holding fixture.`);
      actions.addInvestmentEntry(holding.id, {
        date: '2026-10-10',
        amount: 1,
        kind: 'Withdrawal',
        note: 'Test withdrawal',
      });
    }

    const result = store.getState();
    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(result.lastError).toBeNull();
    expect(result.data.transactions.at(-1)).toMatchObject({
      type: 'income',
      category: 'Withdrawal',
      amount: 1,
    });
    expect(validateIntegrity(result.data)).toEqual([]);

    const beforeRejectedWithdrawal = result.data;
    if (kind === 'manual' || kind === 'plan') {
      const holding = beforeRejectedWithdrawal.holdings.find((item) => item.kind === kind);
      if (!holding) throw new Error(`Missing ${kind} holding after withdrawal.`);
      actions.addInvestmentEntry(holding.id, {
        date: '2026-10-10',
        amount: 1_000_000_000,
        kind: 'Withdrawal',
        note: 'Too large',
      });
    }
    expect(store.getState().lastError).toBeTruthy();
    expect(store.getState().data).toBe(beforeRejectedWithdrawal);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('persists each instrument transaction action once', async () => {
    const storage = new MemoryStorage();
    const seed = emptyAppData('2026-10-10');
    seed.holdings.push({
      id: 'seed-holding',
      kind: 'manual',
      name: 'Seed holding',
      type: 'Gold',
      invested: 100,
      value: 100,
      valueAsOf: '2026-10-10',
      logs: [{ id: 'old-entry', date: '2026-10-01', amount: 50, kind: 'Deposit', note: '' }],
    });
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: seed }, version: 10 }));
    let id = 0;
    const store = makeStore(storage, { newId: () => `instrument-${++id}` });
    await waitForHydration(store);
    const perform = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
      expect(store.getState().lastError).toBeNull();
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };

    perform(() => store.getState().actions.createMissingTransactions());
    const seededTransaction = store.getState().data.transactions[0]!;
    perform(() => store.getState().actions.updateLinkedTransaction(seededTransaction.id, { amount: 60 }));
    perform(() => store.getState().actions.deleteLinkedTransaction(seededTransaction.id));

    store.getState().actions.addTransaction({
      type: 'invest', amount: 75, date: '2026-10-02', category: 'Other', note: 'Legacy',
    });
    const legacy = store.getState().data.transactions.at(-1)!;
    perform(() => store.getState().actions.linkExistingTransaction(legacy.id, 'seed-holding', 'Linked legacy'));
    const linkedLegacy = store.getState().data.transactions.find((item) => item.id === legacy.id)!;
    expect(linkedLegacy).toMatchObject({ note: 'Linked legacy', source: { kind: 'holding-entry' } });

    perform(() => store.getState().actions.addInstrumentTransaction({
      kind: 'deposit', instrumentId: 'seed-holding', amount: 30, date: '2026-10-03', note: 'New deposit',
    }));
    const created = store.getState().data.transactions.at(-1)!;
    perform(() => store.getState().actions.updateLinkedTransaction(created.id, { amount: 25 }));
    perform(() => store.getState().actions.deleteLinkedTransaction(created.id));
  });

  it('persists each manual ledger action once with its linked transaction', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `ledger-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const performOnce = (action: () => void) => {
      const writes = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - writes).toBe(1);
      expect(store.getState().lastError).toBeNull();
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };
    performOnce(() => actions.addHolding({
      name: 'Ledger manual', type: 'Gold', invested: 10_000, value: 10_000,
    }));
    const holding = store.getState().data.holdings.find((item) => item.name === 'Ledger manual')!;
    performOnce(() => actions.addInvestmentEntry(holding.id, {
      date: '2026-10-02', amount: 5_000, kind: 'Deposit', note: '',
    }));
    const deposit = store.getState().data.holdings.find((item) => item.id === holding.id)!.logs[0]!;
    performOnce(() => actions.addInvestmentEntry(holding.id, {
      date: '2026-10-03', amount: 2_000, kind: 'Withdrawal', note: '',
    }));
    const withdrawal = store.getState().data.holdings.find((item) => item.id === holding.id)!.logs[1]!;
    performOnce(() => actions.updateInvestmentEntry(holding.id, withdrawal.id, { amount: 1_500 }));
    performOnce(() => actions.updateHolding(holding.id, { name: 'Renamed manual' }));
    expect(store.getState().data.transactions.find((tx) => tx.source?.entryId === deposit.id)?.note).toBe('Renamed manual deposit');
    performOnce(() => actions.deleteInvestmentEntry(holding.id, deposit.id));
    expect(store.getState().data.transactions.some((tx) => tx.source?.entryId === deposit.id)).toBe(false);
  });

  it('migrates a v1 database once and preserves the exact pre-migration bytes', async () => {
    const storage = new MemoryStorage();
    const v1 = makeV1Fixture();
    const raw = JSON.stringify({ state: { data: v1 }, version: 1 });
    storage.values.set('wealthwise.app.v1', raw);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.liabilities).toHaveLength(1);
    expect(first.getState().data.liabilities[0]).toMatchObject({ kind: 'recurring', type: 'Other' });
    expect(first.getState().data.holdings[0]).toMatchObject({ kind: 'manual', logs: [] });
    expect(storage.values.get('wealthwise.app.v1.premigration.v1')).toBe(raw);
    expect(first.getState().data.holdings).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Emergency fund (migrated)', invested: 500, value: 500 }),
    ]));
    const migratedTotals = netWorth(first.getState().data, '2026-09-03');
    const legacyPlan = v1.holdings.find((holding) => holding.kind === 'plan');
    if (!legacyPlan || legacyPlan.kind !== 'plan') throw new Error('Expected v1 plan fixture');
    const planValueBeforeMigration = holdingValue({
      ...legacyPlan,
      logs: legacyPlan.logs.map((log) => ({ ...log, kind: 'Deposit' as const })),
    }, '2026-09-03');
    expect(migratedTotals.liabilities).toBe(8_000);
    expect(migratedTotals.assets).toBe(1_500 + planValueBeforeMigration);
    expect(migratedTotals.netWorth).toBe(migratedTotals.assets - 8_000);
    const copyWrites = storage.setItemCalls;
    const second = makeStore(storage);
    await waitForHydration(second);
    expect(second.getState().data).toEqual(first.getState().data);
    expect(storage.values.get('wealthwise.app.v1.premigration.v1')).toBe(raw);
    expect(storage.setItemCalls).toBe(copyWrites);
  });

  it('migrates a v2 database once and does not overwrite its premigration copy', async () => {
    const storage = new MemoryStorage();
    const v2 = makeV2Fixture();
    const raw = JSON.stringify({ state: { data: v2 }, version: 2 });
    storage.values.set('wealthwise.app.v1', raw);
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState().data.settings).toEqual({
      ...v2.settings,
      monthlySalary: null,
      onboarded: true,
    });
    expect(storage.values.get('wealthwise.app.v1.premigration.v2')).toBe(raw);
    const writesAfterMigration = storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v2').length;
    const restored = makeStore(storage);
    await waitForHydration(restored);
    expect(restored.getState().data).toEqual(store.getState().data);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v2'))
      .toHaveLength(writesAfterMigration);
  });

  it('hydrates v4 into v7, archives the original bytes once, and removes that archive on erase', async () => {
    const storage = new MemoryStorage();
    const v4 = makeV4Fixture();
    const raw = JSON.stringify({ state: { data: v4 }, version: 4 });
    storage.values.set('wealthwise.app.v1', raw);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.goals.find((goal) => goal.auto === 'ef')?.links)
      .toEqual(expect.arrayContaining([expect.objectContaining({ instrumentId: 'fixed-id', share: 100 })]));
    expect(first.getState().data.liabilities.find((entry) => entry.kind === 'recurring')?.settlement).toBeNull();
    expect(first.getState().data.policies).toEqual([]);
    expect(first.getState().data.budget).toBeNull();
    expect(storage.values.get('wealthwise.app.v1.premigration.v4')).toBe(raw);
    const archivedWrites = storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v4').length;
    const second = makeStore(storage);
    await waitForHydration(second);
    expect(second.getState().data).toEqual(first.getState().data);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v4'))
      .toHaveLength(archivedWrites);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has('wealthwise.app.v1.premigration.v4')).toBe(false);
  });

  it('hydrates v5 into v7, archives exact bytes once, and removes the archive on erase', async () => {
    const storage = new MemoryStorage();
    const v5 = makeV5Fixture();
    const raw = JSON.stringify({ state: { data: v5 }, version: 5 });
    storage.values.set('wealthwise.app.v1', raw);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.efCustomBuckets).toEqual([]);
    expect(first.getState().data.efBucketLinks).toEqual({});
    expect(first.getState().data.liabilities).toEqual(v5.liabilities);
    expect(storage.values.get('wealthwise.app.v1.premigration.v5')).toBe(raw);
    const archiveWrites = storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v5');

    const second = makeStore(storage);
    await waitForHydration(second);
    expect(second.getState().data).toEqual(first.getState().data);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v5')).toHaveLength(archiveWrites.length);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has('wealthwise.app.v1.premigration.v5')).toBe(false);
  });

  it('hydrates v6 into v7 and archives exact raw bytes only once', async () => {
    const storage = new MemoryStorage();
    const v6 = makeV6Fixture();
    const raw = JSON.stringify({ state: { data: v6 }, version: 6 });
    storage.values.set('wealthwise.app.v1', raw);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.holdings).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Emergency fund (migrated)', invested: 500, value: 500 }),
    ]));
    expect(storage.values.get('wealthwise.app.v1.premigration.v6')).toBe(raw);
    const archiveWrites = storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v6');
    const second = makeStore(storage);
    await waitForHydration(second);
    expect(second.getState().data).toEqual(first.getState().data);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1.premigration.v6')).toHaveLength(archiveWrites.length);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has('wealthwise.app.v1.premigration.v6')).toBe(false);
  });

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

  it('does not start fresh after a read error and retries hydration successfully', async () => {
    class RetryReadStorage extends MemoryStorage {
      reads = 0;
      getItem(name: string): string | null {
        if (name === 'wealthwise.app.v1' && this.reads++ === 0) throw new Error('temporary read failure');
        return super.getItem(name);
      }
    }
    const storage = new RetryReadStorage();
    const raw = JSON.stringify({ state: { data: makeV1Fixture() }, version: 1 });
    storage.values.set('wealthwise.app.v1', raw);
    const store = makeStore(storage);
    await waitForHydration(store);
    expect(store.getState()).toMatchObject({
      status: 'recovery',
      recoveryReason: 'read-error',
      storageError: "Your saved data couldn't be read right now. It has not been changed.",
    });
    expect([...storage.values.keys()].some((key) => key.includes('.corrupt.'))).toBe(false);
    expect(storage.values.get('wealthwise.app.v1')).toBe(raw);
    const beforeData = store.getState().data;
    const beforeBytes = storage.values.get('wealthwise.app.v1');
    const writes = storage.setItemCalls;
    store.getState().actions.resolveRecovery('start-fresh');
    expect(store.getState().data).toBe(beforeData);
    expect(storage.values.get('wealthwise.app.v1')).toBe(beforeBytes);
    expect(storage.setItemCalls).toBe(writes);

    store.getState().actions.retryHydration();
    await new Promise<void>((resolve) => {
      if (store.getState().status === 'ready') return resolve();
      const unsubscribe = store.subscribe((state) => {
        if (state.status === 'ready') {
          unsubscribe();
          resolve();
        }
      });
    });
    expect(store.getState().status).toBe('ready');
    expect(store.getState().data.liabilities[0]).toMatchObject({ kind: 'recurring', type: 'Other' });
    expect(storage.values.get('wealthwise.app.v1.premigration.v1')).toBe(raw);
    expect(storage.values.get('wealthwise.app.v1')).not.toBe(raw);
  });

    it('confirms a holding valuation through one persisted write without changing its value', async () => {
      const storage = new MemoryStorage();
      const store = makeStore(storage);
      await waitForHydration(store);
      store.getState().actions.addHolding({
        name: 'Old FD', type: 'Fixed deposit', invested: 100_000, value: 110_000,
      });
      const holding = store.getState().data.holdings[0]!;
      if (holding.kind !== 'manual') throw new Error('Expected a manual holding.');
      const beforeWrites = storage.setItemCalls;
      store.getState().actions.confirmHoldingValue(holding.id);
      expect(storage.setItemCalls - beforeWrites).toBe(1);
      expect(store.getState().data.holdings[0]).toMatchObject({
        id: holding.id, value: 110_000, valueAsOf: '2026-10-10',
      });
    });

    it('writes a preimport snapshot before replacement and undo restores and consumes it', async () => {
      const storage = new MemoryStorage();
      const store = makeStore(storage);
      await waitForHydration(store);
      store.getState().actions.addTransaction({
        type: 'income', amount: 900, category: 'Other', note: 'Old data', date: '2026-10-10',
      });
      const original = store.getState().data;
      storage.calls = [];
      const beforeWrites = storage.setItemCalls;
      await expect(store.getState().actions.replaceAllData(mockAppData)).resolves.toEqual({ ok: true });
      expect(storage.setItemCalls - beforeWrites).toBe(2);
      expect(storage.calls.slice(0, 2)).toEqual([
        'set:wealthwise.app.v1.preimport',
        'set:wealthwise.app.v1',
      ]);
      expect(store.getState().data).toEqual(mockAppData);
      await expect(store.getState().actions.undoImport()).resolves.toEqual({ ok: true });
      expect(store.getState().data).toEqual(original);
      expect(storage.values.has('wealthwise.app.v1.preimport')).toBe(false);
    });

    it('does not change data or main storage when saving the preimport snapshot fails', async () => {
      const storage = new MemoryStorage();
      const store = makeStore(storage);
      await waitForHydration(store);
      store.getState().actions.addTransaction({
        type: 'income', amount: 900, category: 'Other', note: 'Old data', date: '2026-10-10',
      });
      const originalData = store.getState().data;
      const originalMain = storage.values.get('wealthwise.app.v1');
      const writesBeforeInvalid = storage.setItemCalls;
      const invalidData = {
        ...mockAppData,
        transactions: [{ ...mockAppData.transactions[0]!, amount: -1 }],
      };
      await expect(store.getState().actions.replaceAllData(invalidData)).resolves.toMatchObject({ ok: false });
      expect(storage.setItemCalls).toBe(writesBeforeInvalid);
      expect(storage.values.get('wealthwise.app.v1')).toBe(originalMain);
      storage.failSetKey = 'wealthwise.app.v1.preimport';
      await expect(store.getState().actions.replaceAllData(mockAppData)).resolves.toMatchObject({ ok: false });
      expect(store.getState().data).toBe(originalData);
      expect(storage.values.get('wealthwise.app.v1')).toBe(originalMain);
    });

    it('refuses replacement in recovery and restores the undo marker on a new store', async () => {
      const storage = new MemoryStorage();
      const store = makeStore(storage);
      await waitForHydration(store);
      await store.getState().actions.replaceAllData(mockAppData);
      const restored = makeStore(storage);
      await new Promise<void>((resolve) => {
        const unsubscribe = restored.subscribe((state) => {
          if (state.undoImport) {
            unsubscribe();
            resolve();
          }
        });
        if (restored.getState().undoImport) {
          unsubscribe();
          resolve();
        }
      });
      expect(restored.getState().undoImport).toEqual({ savedAt: '2026-10-10' });

      const recoveryStorage = new MemoryStorage();
      recoveryStorage.values.set('wealthwise.app.v1', '{invalid');
      const recovery = makeStore(recoveryStorage);
      await waitForHydration(recovery);
      const beforeWrites = recoveryStorage.setItemCalls;
      await expect(recovery.getState().actions.replaceAllData(mockAppData)).resolves.toMatchObject({ ok: false });
      expect(recoveryStorage.setItemCalls).toBe(beforeWrites);
    });
  it('persists name and theme settings', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    const themeWrites = storage.setItemCalls;
    store.getState().actions.updateSettings({ theme: 'midnight' });
    expect(storage.setItemCalls - themeWrites).toBe(1);
    store.getState().actions.updateSettings({ name: 'Asha', theme: 'dark' });
    const restored = makeStore(storage);
    await waitForHydration(restored);
    expect(restored.getState().data.settings).toEqual({
      name: 'Asha', theme: 'dark', monthlySalary: null, onboarded: false,
    });
  });

  it('completes onboarding in one persisted write', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    const before = storage.setItemCalls;
    store.getState().actions.completeOnboarding({ name: 'Asha', monthlySalary: 75_000 });
    expect(storage.setItemCalls - before).toBe(1);
    expect(store.getState().data.settings).toMatchObject({
      name: 'Asha', monthlySalary: 75_000, onboarded: true,
    });
  });

  it('materializes the emergency fund goal after hydrating legacy valid data', async () => {
    const storage = new MemoryStorage();
    const dataWithoutGoal = { ...mockAppData, goals: [] };
    storage.values.set('wealthwise.app.v1', JSON.stringify({ state: { data: dataWithoutGoal }, version: 7 }));
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

  it('exposes developer-only demo and corruption controls', async () => {
    const reload = jest.fn();
    const storage = new MemoryStorage();
    const store = makeStore(storage, { reload, isDev: true });
    await waitForHydration(store);
    const dev = store.getState().devActions;
    expect(dev).toBeDefined();
    const original = store.getState().data;
    await expect(dev!.loadDemoData()).resolves.toEqual({ ok: true });
    expect(store.getState().data).toEqual(buildDemoData('2026-10-10'));
    expect(store.getState().undoImport).toEqual({ savedAt: '2026-10-10' });
    await expect(store.getState().actions.undoImport()).resolves.toEqual({ ok: true });
    expect(store.getState().data).toEqual(original);
    await dev!.simulateCorruption();
    expect(storage.values.get('wealthwise.app.v1')).toBe('{not json');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('replaces transactions with 20,000 stress entries using one persisted write', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { isDev: true, newId: () => `stress-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().devActions;
    if (!actions) throw new Error('Developer stress action is unavailable.');
    const existingGoals = store.getState().data.goals;
    const writesBefore = storage.setItemCalls;

    actions.loadStressData();

    expect(store.getState().data.transactions).toHaveLength(20_000);
    expect(store.getState().data.goals).toBe(existingGoals);
    expect(storage.setItemCalls - writesBefore).toBe(1);
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
      store.getState().actions.addInvestmentEntry(planId, { date, amount: 10_000, note: '', kind: 'Deposit' });
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
    restored.getState().actions.updateInvestmentEntry(planId, august.id, { amount: 11_000 });
    expect(restored.getState().data.transactions.find((row) => row.id === augustTransaction.id)?.amount).toBe(11_000);
    expect(validateIntegrity(restored.getState().data)).toEqual([]);
    const september = planAfterRestore.logs.find((log) => log.date === '2026-09-05')!;
    restored.getState().actions.deleteInvestmentEntry(planId, september.id);
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
    store.getState().actions.addInvestmentEntry(keepPlanId, { date: '2026-01-02', amount: 100, note: '', kind: 'Deposit' });
    store.getState().actions.deletePlan(keepPlanId, { linkedTransactions: 'keep' });
    expect(store.getState().data.transactions[0]?.source).toBeUndefined();

    store.getState().actions.addPlan(planInput);
    const deletePlanId = store.getState().data.holdings[0]!.id;
    store.getState().actions.addInvestmentEntry(deletePlanId, { date: '2026-01-02', amount: 100, note: '', kind: 'Deposit' });
    store.getState().actions.deletePlan(deletePlanId, { linkedTransactions: 'delete' });
    expect(store.getState().data.transactions).toHaveLength(1);
    expect(store.getState().data.transactions[0]?.source).toBeUndefined();

    store.getState().actions.addLiability({
      kind: 'recurring', type: 'Other', name: 'Bank loan', principal: 100_000, ratePct: 12, tenureMonths: 12, emi: null, startDate: '2026-01-01',
    });
    const loanId = store.getState().data.liabilities[0]!.id;
    const before = storage.setItemCalls;
    store.getState().actions.addLiabilityPayment(loanId, { date: '2026-02-01', amount: 8_885, kind: 'EMI', note: '' });
    expect(storage.setItemCalls - before).toBe(1);
    const linked = store.getState().data.transactions.find((transaction) => transaction.source?.kind === 'liability-payment');
    expect(linked?.source).toMatchObject({ kind: 'liability-payment', parentId: loanId });
    expect(linked).toMatchObject({ type: 'expense', category: 'EMI', note: 'Bank loan EMI' });
  });

  it('persists each one-time liability action once and preserves integrity', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { newId: () => `one-time-${++id}` });
    await waitForHydration(store);
    const perform = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
      expect(store.getState().lastError).toBeNull();
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };
    perform(() => store.getState().actions.addLiability({
      kind: 'one-time', name: 'Friend', type: 'Borrowed money', principal: 20_000,
      ratePct: 0, startDate: '2026-10-01', dueDate: '2026-10-20',
    }));
    const liabilityId = store.getState().data.liabilities[0]!.id;
    perform(() => store.getState().actions.updateLiability(liabilityId, { name: 'Friend loan' }));
    perform(() => store.getState().actions.addLiabilityPayment(liabilityId, {
      date: '2026-10-05', amount: 5_000, kind: 'Payment', note: '',
    }));
    const paymentId = store.getState().data.liabilities[0]!.payments[0]!.id;
    perform(() => store.getState().actions.updateLiabilityPayment(liabilityId, paymentId, { amount: 4_000 }));
    perform(() => store.getState().actions.deleteLiabilityPayment(liabilityId, paymentId));
    perform(() => store.getState().actions.addLiabilityPayment(liabilityId, {
      date: '2026-10-06', amount: 1_000, kind: 'Payment', note: '',
    }));
    perform(() => store.getState().actions.deleteLiability(liabilityId, { linkedTransactions: 'keep' }));
    expect(store.getState().data.transactions[0]?.source).toBeUndefined();
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
    actions.addInvestmentEntry(planId, { date: '2026-02-01', amount: 600, note: '', kind: 'Deposit' });
    const plan = store.getState().data.holdings[0]!;
    if (plan.kind !== 'plan') throw new Error('Expected plan');
    const logId = plan.logs[0]!.id;
    const txId = store.getState().data.transactions[0]!.id;
    actions.updateInvestmentEntry(planId, logId, { note: 'Updated' });
    actions.updateTransaction(txId, { amount: 100 });
    expect(store.getState().lastError).toContain('linked');
    actions.deleteTransaction(txId);
    expect(store.getState().lastError).toContain('linked');
    actions.deleteInvestmentEntry(planId, logId);
    actions.deletePlan(planId, { linkedTransactions: 'delete' });

    actions.addLiability({ kind: 'recurring', type: 'Other', name: 'Wrapper loan', principal: 10_000, ratePct: 0, tenureMonths: 10, emi: 1000, startDate: '2026-01-01' });
    const loanId = store.getState().data.liabilities[0]!.id;
    actions.updateLiability(loanId, { emi: null });
    actions.addLiabilityPayment(loanId, { date: '2026-02-01', amount: 1000, kind: 'EMI', note: '' });
    const paymentId = store.getState().data.liabilities[0]!.payments[0]!.id;
    actions.updateLiabilityPayment(loanId, paymentId, { amount: 1100 });
    actions.deleteLiabilityPayment(loanId, paymentId);
    actions.deleteLiability(loanId, { linkedTransactions: 'delete' });
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    actions.updatePlan('missing', { amount: 1 });
    expect(store.getState().lastError).toContain('not found');
    actions.updateLiabilityPayment('missing', 'missing', { amount: 1 });
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
    store.getState().actions.addLiability({
      kind: 'recurring', type: 'Other', name: 'Scenario loan', principal: 100_000, ratePct: 12,
      tenureMonths: 12, emi: null, startDate: '2026-01-01',
    });

    const loanId = store.getState().data.liabilities[0]!.id;
    const scenarioLiability = store.getState().data.liabilities[0]!;
    expect(scenarioLiability.kind === 'recurring' ? scenarioLiability.emi : null).toBe(8_885);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    for (const date of ['2026-02-01', '2026-03-01', '2026-04-01']) {
      store.getState().actions.addLiabilityPayment(loanId, {
        date, amount: 8_885, kind: 'EMI', note: '',
      });
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    }
    const loan = store.getState().data.liabilities[0]!;
    expect(loanState(loan, '2026-04-02').balance).toBeLessThan(100_000);
    const outstanding = loanState(loan, '2026-04-02').balance;
    expect(makeLiabilityPaymentFormSchema('2026-04-02', {
      startDate: loan.startDate, outstandingExcludingThis: outstanding,
    }).safeParse({
      date: '2026-04-02', amount: String(Math.ceil(outstanding) + 1),
      kind: 'Prepayment', note: '',
    }).success).toBe(false);
    store.getState().actions.deleteLiability(loanId, { linkedTransactions: 'delete' });
    expect(store.getState().data.liabilities).toEqual([]);
    expect(store.getState().data.transactions).toEqual([]);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });
});

it('erases all supported storage keys and hydrates to empty data', async () => {
  const storage = new MemoryStorage();
  const secureStore = new Map([['wealthwise.lock.v1', '{"enabled":true}']]);
  storage.values.set('wealthwise.app.v1.premigration.v1', 'original-v1-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v2', 'original-v2-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v3', 'original-v3-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v4', 'original-v4-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v5', 'original-v5-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v6', 'original-v6-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v7', 'original-v7-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v8', 'original-v8-bytes');
  storage.values.set('wealthwise.app.v1.prerepair-efallocation', 'original-allocation-bytes');
  const store = makeStore(storage, {
    removeLockSettings: async () => { secureStore.delete('wealthwise.lock.v1'); },
  });
  await waitForHydration(store);
  store.getState().actions.addTransaction({
    type: 'expense', amount: 500, category: 'Food', note: 'Old', date: '2026-10-10',
  });
  storage.values.set('wealthwise.app.v1.corrupt.latest', 'bad');
  storage.values.set('wealthwise.app.v1.corrupt.previous', 'old bad');
  storage.values.set('wealthwise.meta.v1', '{"lastExportAt":"2026-10-10T00:00:00.000Z"}');
  storage.values.set('wealthwise.app.v1.preimport', '{}');
  await expect(store.getState().actions.eraseAllData()).resolves.toEqual({ ok: true });
  expect(store.getState().data.transactions).toEqual([]);
  expect(storage.values.has('wealthwise.app.v1')).toBe(true);
  expect(JSON.parse(storage.values.get('wealthwise.app.v1')!).state.data.transactions).toEqual([]);
  for (const key of [
    'wealthwise.app.v1.preimport',
    'wealthwise.app.v1.premigration.v1',
    'wealthwise.app.v1.premigration.v2',
    'wealthwise.app.v1.premigration.v3',
    'wealthwise.app.v1.premigration.v4',
    'wealthwise.app.v1.premigration.v5',
    'wealthwise.app.v1.premigration.v6',
    'wealthwise.app.v1.premigration.v7',
    'wealthwise.app.v1.premigration.v8',
    'wealthwise.app.v1.prerepair-efallocation',
    'wealthwise.app.v1.corrupt.latest',
    'wealthwise.app.v1.corrupt.previous',
    'wealthwise.meta.v1',
    'wealthwise.lock.v1',
  ]) {
    expect(storage.values.has(key)).toBe(false);
  }
  expect(secureStore.has('wealthwise.lock.v1')).toBe(false);
  const restored = makeStore(storage);
  await waitForHydration(restored);
  expect(restored.getState().data.transactions).toEqual([]);
});

it('round-trips linked plans, liability payments, goals and holdings', async () => {
  const storage = new MemoryStorage();
  let sequence = 0;
  const store = makeStore(storage, { newId: () => `generated-${++sequence}` });
  await waitForHydration(store);
  const actions = store.getState().actions;
  actions.addPlan({
    name: 'Round trip SIP', type: 'Mutual fund / SIP', frequency: 'monthly',
    amount: 2_000, ratePct: 10, stepUpPct: 0, tenureYears: 5, startDate: '2026-01-01',
    trackFrom: '2026-01-01', opening: 0, actualValue: null, actualValueDate: null,
  });
  const plan = store.getState().data.holdings.find((holding) => holding.kind === 'plan')!;
  actions.addInvestmentEntry(plan.id, { date: '2026-02-01', amount: 2_000, note: '', kind: 'Deposit' });
  actions.addLiability({
  kind: 'recurring', type: 'Other', name: 'Round trip loan', principal: 50_000, ratePct: 8, tenureMonths: 12,
    emi: null, startDate: '2026-01-01',
  });
  const loan = store.getState().data.liabilities[0]!;
  actions.addLiabilityPayment(loan.id, {
    date: '2026-02-01', amount: 4_350, kind: 'EMI', note: '',
  });
  actions.addGoal({ name: 'Travel', target: 30_000, saved: 2_000, year: 2028 });
  actions.addHolding({ name: 'Round trip FD', type: 'Fixed deposit', invested: 10_000, value: 10_200 });
  const emergencyGoal = store.getState().data.goals.find((goal) => goal.auto === 'ef')!;
  const newHolding = store.getState().data.holdings.find((holding) => holding.name === 'Round trip FD')!;
  actions.setGoalLinks(emergencyGoal.id, [{ instrumentId: newHolding.id, share: 100 }]);
  const original = store.getState().data;
  const backup = await createBackup(original, { exportedAt: '2026-10-10T10:00:00.000Z', digest: sha256 });
  const parsed = await parseBackup(backup, { digest: sha256, today: '2026-10-10', newId: () => 'unused-id' });
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.message);
  const emptyStore = makeStore(new MemoryStorage());
  await waitForHydration(emptyStore);
  await expect(emptyStore.getState().actions.replaceAllData(parsed.data)).resolves.toEqual({ ok: true });
  expect(emptyStore.getState().data).toEqual(original);
  expect(validateIntegrity(emptyStore.getState().data)).toEqual([]);
});
