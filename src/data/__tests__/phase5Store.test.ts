import type { StateStorage } from 'zustand/middleware';

import { emptyAppData } from '../../domain/actions';
import { budgetLineActual } from '../../domain/budget';
import { goalSavedFor } from '../../domain/goalLinks';
import { valueStaleness } from '../../domain/holdingActions';
import { validateIntegrity } from '../../domain/links';
import { buildInstrumentCardModel } from '../../domain/instrumentCard';
import { buildPortfolioRows, holdingFinancialSummary, holdingValue } from '../../domain/portfolio';
import { SCHEMA_VERSION } from '../../domain/schemas';
import { netWorth } from '../../domain/summary';
import { createAppStore } from '../createAppStore';
import { useUIStore } from '../uiStore';

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
  it('reproduces backdated entries against a stored manual and plan valuation', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const today = '2026-11-05';
    const store = createStore(storage, () => `p29t-${++id}`, () => today);
    await hydrated(store);
    const actions = store.getState().actions;

    actions.addHolding({
      name: 'Manual reproduction',
      type: 'Gold',
      invested: 73_000,
      value: 73_000,
    });
    const manual = store.getState().data.holdings.find((holding) => holding.kind === 'manual');
    if (!manual) throw new Error('Manual reproduction holding was not created.');

    actions.addPlan({
      name: 'Plan reproduction',
      type: 'Recurring deposit',
      frequency: 'monthly',
      amount: 2_000,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 10,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 73_000,
      actualValue: 73_000,
      actualValueDate: today,
    });
    const plan = store.getState().data.holdings.find((holding) => holding.kind === 'plan');
    if (!plan) throw new Error('Plan reproduction holding was not created.');

    for (const [holdingId, prefix] of [[manual.id, 'manual'], [plan.id, 'plan']] as const) {
      for (const [index, date] of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'].entries()) {
        actions.addInvestmentEntry(holdingId, {
          date,
          amount: 2_000,
          kind: 'Deposit',
          note: `${prefix} historical deposit ${index + 1}`,
        });
      }
    }

    const summaries = [manual.id, plan.id].map((holdingId) => {
      const holding = store.getState().data.holdings.find((item) => item.id === holdingId);
      if (!holding) throw new Error(`Holding ${holdingId} disappeared.`);
      const summary = holdingFinancialSummary(holding, today);
      return {
        kind: holding.kind,
        invested: summary.invested,
        value: summary.value,
        gain: summary.gain,
        absoluteReturnPct: summary.returnSummary.absoluteReturnPct,
        annualizedLabel: summary.returnSummary.annualizedLabel,
      };
    });
    expect(summaries.map(({ value }) => value)).toEqual([81_000, 81_000]);
    expect(summaries.map(({ invested, gain, absoluteReturnPct }) => ({
      invested,
      gain,
      absoluteReturnPct,
    }))).toEqual([
      { invested: 81_000, gain: 0, absoluteReturnPct: 0 },
      { invested: 81_000, gain: 0, absoluteReturnPct: 0 },
    ]);

    const data = store.getState().data;
    actions.addGoal({ name: 'Travel', target: 100_000, saved: 0, year: 2030 });
    const goal = store.getState().data.goals.find((item) => item.name === 'Travel');
    const emergencyGoal = store.getState().data.goals.find((item) => item.auto === 'ef');
    if (!goal || !emergencyGoal) throw new Error('Goal fixtures were not created.');
    actions.setGoalLinks(goal.id, [{ instrumentId: manual.id, share: 50 }]);
    actions.setEfBucketLinks('other', [manual.id]);
    actions.saveBudgetPlan({
      incomes: [],
      sections: [{ id: 'investments', name: 'Investments', type: 'invest' }],
      items: [manual, plan].map((holding, index) => {
        const category = store.getState().data.transactions.find((transaction) =>
          transaction.source?.kind === 'holding-entry' && transaction.source.parentId === holding.id)?.category;
        if (!category) throw new Error(`Missing linked transaction category for ${holding.id}.`);
        return {
          id: `budget-link-${index}`,
          sectionId: 'investments',
          name: category,
          mode: 'amount' as const,
          value: 0,
          holdingId: holding.id,
        };
      }),
      repeatMonthly: false,
      repeatFrom: null,
    });

    const linkedData = store.getState().data;
    const linkedGoal = linkedData.goals.find((item) => item.id === goal.id);
    const linkedEmergencyGoal = linkedData.goals.find((item) => item.id === emergencyGoal.id);
    if (!linkedGoal || !linkedEmergencyGoal) throw new Error('Linked goals disappeared.');
    expect(goalSavedFor(linkedGoal, linkedData, today)).toBe(81_000);
    expect(goalSavedFor(linkedEmergencyGoal, linkedData, today)).toBe(81_000);
    expect((linkedData.efBucketLinks.other ?? []).reduce((total, holdingId) => {
      const holding = linkedData.holdings.find((item) => item.id === holdingId);
      return total + (holding ? holdingValue(holding, today) : 0);
    }, 0)).toBe(81_000);
    expect(netWorth(linkedData, today)).toMatchObject({ assets: 162_000, netWorth: 162_000 });
    for (const holding of [manual, plan]) {
      const category = linkedData.transactions.find((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.parentId === holding.id)?.category;
      if (!category) throw new Error(`Missing linked transaction category for ${holding.id}.`);
      expect(budgetLineActual(linkedData, '2026-11', category)).toBe(8_000);
    }
    expect(data.holdings.map((holding) => holding.id)).toEqual([manual.id, plan.id]);
  });

  it.each(['manual', 'plan'] as const)(
    'updates %s stored valuations for entries before, on and after the snapshot, including edit/delete/Undo',
    async (kind) => {
      const storage = new MemoryStorage();
      let id = 0;
      const today = '2026-11-10';
      const valuationDate = '2026-11-05';
      const initial = emptyAppData(today);
      if (kind === 'manual') {
        initial.holdings.push({
          id: 'snapshot-manual',
          kind: 'manual',
          name: 'Snapshot manual',
          type: 'Gold',
          invested: 73_000,
          value: 73_000,
          valueAsOf: valuationDate,
          logs: [],
        });
      } else {
        initial.holdings.push({
          id: 'snapshot-plan',
          kind: 'plan',
          name: 'Snapshot plan',
          type: 'Recurring deposit',
          frequency: 'monthly',
          amount: 2_000,
          ratePct: 0,
          stepUpPct: 0,
          tenureYears: 10,
          startDate: '2026-01-01',
          trackFrom: '2026-01-01',
          opening: 73_000,
          actualValue: 73_000,
          actualValueDate: valuationDate,
          logs: [],
        });
      }
      storage.values.set('wealthwise.app.v1', JSON.stringify({
        state: { data: initial },
        version: SCHEMA_VERSION,
      }));
      const store = createStore(storage, () => `p29t-${kind}-${++id}`, () => today);
      await hydrated(store);
      useUIStore.getState().setActionToast(null);
      const actions = store.getState().actions;
      const perform = (action: () => void) => {
        const writes = storage.setItemCalls;
        action();
        expect(store.getState().lastError).toBeNull();
        expect(storage.setItemCalls - writes).toBe(1);
        expect(validateIntegrity(store.getState().data)).toEqual([]);
      };

      const holdingId = kind === 'manual' ? 'snapshot-manual' : 'snapshot-plan';

      const addEntry = (date: string, note: string) => {
        perform(() => actions.addInvestmentEntry(holdingId, {
          date,
          amount: 2_000,
          kind: 'Deposit',
          note,
        }));
        const holding = store.getState().data.holdings.find((item) => item.id === holdingId);
        const entry = holding?.logs.find((row) => row.date === date && row.note === note);
        if (!entry) throw new Error(`Missing ${date} entry.`);
        return entry.id;
      };
      const beforeDateEntry = addEntry('2026-11-04', 'Before snapshot');
      const onDateEntry = addEntry(valuationDate, 'On snapshot');
      const afterDateEntry = addEntry('2026-11-06', 'After snapshot');
      const getHolding = () => {
        const holding = store.getState().data.holdings.find((item) => item.id === holdingId);
        if (!holding) throw new Error('Snapshot holding disappeared.');
        return holding;
      };
      const summary = () => holdingFinancialSummary(getHolding(), today);

      expect(summary()).toMatchObject({ invested: 79_000, value: 79_000, gain: 0 });
      expect(summary().returnSummary.absoluteReturnPct).toBe(0);
      if (kind === 'manual') expect(getHolding()).toMatchObject({ value: 77_000, valueAsOf: valuationDate });
      else expect(getHolding()).toMatchObject({ actualValue: 77_000, actualValueDate: valuationDate });

      perform(() => actions.updateInvestmentEntry(holdingId, beforeDateEntry, { amount: 3_000 }));
      expect(summary()).toMatchObject({ invested: 80_000, value: 80_000, gain: 0 });
      expect(store.getState().data.transactions.find((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === beforeDateEntry)?.amount).toBe(3_000);

      const beforeDelete = store.getState().data;
      perform(() => actions.deleteInvestmentEntry(holdingId, onDateEntry));
      expect(summary()).toMatchObject({ invested: 78_000, value: 78_000, gain: 0 });
      expect(store.getState().data.transactions.some((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === onDateEntry)).toBe(false);
      const deletedUndo = useUIStore.getState().actionToast?.onAction;
      if (!deletedUndo) throw new Error('Entry deletion did not expose Undo.');
      const undoWrites = storage.setItemCalls;
      deletedUndo();
      expect(storage.setItemCalls - undoWrites).toBe(1);
      expect(store.getState().data).toEqual(beforeDelete);
      expect(summary()).toMatchObject({ invested: 80_000, value: 80_000, gain: 0 });

      perform(() => actions.updateInvestmentEntry(holdingId, beforeDateEntry, { date: '2026-11-07' }));
      expect(summary()).toMatchObject({ invested: 80_000, value: 80_000, gain: 0 });
      if (kind === 'manual') expect(getHolding()).toMatchObject({ value: 75_000, valueAsOf: valuationDate });
      else expect(getHolding()).toMatchObject({ actualValue: 75_000, actualValueDate: valuationDate });
      expect(store.getState().data.transactions.find((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === beforeDateEntry)?.date).toBe('2026-11-07');

      perform(() => actions.deleteInvestmentEntry(holdingId, afterDateEntry));
      expect(summary()).toMatchObject({ invested: 78_000, value: 78_000, gain: 0 });
      const deletedAfterDateUndo = useUIStore.getState().actionToast?.onAction;
      if (!deletedAfterDateUndo) throw new Error('Entry deletion did not expose Undo.');
      deletedAfterDateUndo();
      expect(summary()).toMatchObject({ invested: 80_000, value: 80_000, gain: 0 });
      expect(store.getState().data.transactions.some((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === afterDateEntry)).toBe(true);
    },
  );

  it.each(['manual', 'plan'] as const)(
    'adjusts %s valuation by signed withdrawal changes and reverses the value on delete/Undo',
    async (kind) => {
      const storage = new MemoryStorage();
      let id = 0;
      const today = '2026-11-05';
      const store = createStore(storage, () => `p29t-withdrawal-${kind}-${++id}`, () => today);
      await hydrated(store);
      useUIStore.getState().setActionToast(null);
      const actions = store.getState().actions;
      const perform = (action: () => void) => {
        const writes = storage.setItemCalls;
        action();
        expect(storage.setItemCalls - writes).toBe(1);
        expect(store.getState().lastError).toBeNull();
      };

      let holdingId = '';
      if (kind === 'manual') {
        perform(() => actions.addHolding({
          name: 'Withdrawal manual',
          type: 'Gold',
          invested: 73_000,
          value: 73_000,
        }));
        const holding = store.getState().data.holdings.find((item) => item.name === 'Withdrawal manual');
        if (!holding || holding.kind !== 'manual') throw new Error('Manual holding was not created.');
        holdingId = holding.id;
      } else {
        perform(() => actions.addPlan({
          name: 'Withdrawal plan',
          type: 'Recurring deposit',
          frequency: 'monthly',
          amount: 2_000,
          ratePct: 0,
          stepUpPct: 0,
          tenureYears: 10,
          startDate: '2026-01-01',
          trackFrom: '2026-01-01',
          opening: 73_000,
          actualValue: 73_000,
          actualValueDate: today,
        }));
        const holding = store.getState().data.holdings.find((item) => item.name === 'Withdrawal plan');
        if (!holding || holding.kind !== 'plan') throw new Error('Plan holding was not created.');
        holdingId = holding.id;
      }

      perform(() => actions.addInvestmentEntry(holdingId, {
        date: '2026-11-04',
        amount: 2_000,
        kind: 'Withdrawal',
        note: 'Historical withdrawal',
      }));
      const holding = store.getState().data.holdings.find((item) => item.id === holdingId);
      const entry = holding?.logs[0];
      if (!holding || !entry) throw new Error('Historical withdrawal was not recorded.');
      expect(holdingFinancialSummary(holding, today)).toMatchObject({
        invested: 71_000,
        value: 71_000,
        gain: 0,
      });

      perform(() => actions.updateInvestmentEntry(holdingId, entry.id, { amount: 3_000 }));
      const updated = store.getState().data.holdings.find((item) => item.id === holdingId);
      if (!updated) throw new Error('Holding disappeared after withdrawal edit.');
      expect(holdingFinancialSummary(updated, today)).toMatchObject({
        invested: 70_000,
        value: 70_000,
        gain: 0,
      });

      const beforeDelete = store.getState().data;
      perform(() => actions.deleteInvestmentEntry(holdingId, entry.id));
      const deleted = store.getState().data.holdings.find((item) => item.id === holdingId);
      if (!deleted) throw new Error('Holding disappeared after withdrawal delete.');
      expect(holdingFinancialSummary(deleted, today)).toMatchObject({
        invested: 73_000,
        value: 73_000,
        gain: 0,
      });
      expect(store.getState().data.transactions.some((transaction) =>
        transaction.source?.kind === 'holding-entry' && transaction.source.entryId === entry.id)).toBe(false);
      const undo = useUIStore.getState().actionToast?.onAction;
      if (!undo) throw new Error('Withdrawal deletion did not expose Undo.');
      undo();
      expect(store.getState().data).toEqual(beforeDelete);
    },
  );

  it('applies the same snapshot adjustments through linked transaction add, edit, move, delete and Undo', async () => {
    const storage = new MemoryStorage();
    const today = '2026-11-10';
    const valuationDate = '2026-11-05';
    const initial = emptyAppData(today);
    initial.holdings.push(
      {
        id: 'linked-manual',
        kind: 'manual',
        name: 'Linked manual',
        type: 'Gold',
        invested: 73_000,
        value: 73_000,
        valueAsOf: valuationDate,
        logs: [],
      },
      {
        id: 'linked-plan',
        kind: 'plan',
        name: 'Linked plan',
        type: 'Recurring deposit',
        frequency: 'monthly',
        amount: 2_000,
        ratePct: 0,
        stepUpPct: 0,
        tenureYears: 10,
        startDate: '2026-01-01',
        trackFrom: '2026-01-01',
        opening: 73_000,
        actualValue: 73_000,
        actualValueDate: valuationDate,
        logs: [],
      },
    );
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: initial },
      version: SCHEMA_VERSION,
    }));
    let id = 0;
    const store = createStore(storage, () => `p29t-linked-${++id}`, () => today);
    await hydrated(store);
    useUIStore.getState().setActionToast(null);
    const actions = store.getState().actions;
    const perform = (action: () => void) => {
      const writes = storage.setItemCalls;
      action();
      expect(store.getState().lastError).toBeNull();
      expect(storage.setItemCalls - writes).toBe(1);
      expect(validateIntegrity(store.getState().data)).toEqual([]);
    };

    perform(() => actions.addInstrumentTransaction({
      kind: 'deposit',
      instrumentId: 'linked-manual',
      amount: 2_000,
      date: '2026-11-04',
      note: 'Linked deposit',
    }));
    const added = store.getState().data.transactions.find((transaction) =>
      transaction.source?.kind === 'holding-entry');
    if (!added) throw new Error('Linked investment transaction was not created.');
    expect(store.getState().data.holdings.find((item) => item.id === 'linked-manual'))
      .toMatchObject({ kind: 'manual', value: 75_000 });

    perform(() => actions.updateLinkedTransaction(added.id, { amount: 3_000, date: '2026-11-06' }));
    expect(store.getState().data.holdings.find((item) => item.id === 'linked-manual'))
      .toMatchObject({ kind: 'manual', value: 73_000 });
    const linkedManual = store.getState().data.holdings.find((item) => item.id === 'linked-manual');
    if (!linkedManual) throw new Error('Linked manual holding disappeared.');
    expect(holdingValue(linkedManual, today)).toBe(76_000);

    perform(() => actions.updateLinkedTransaction(added.id, {
      instrumentId: 'linked-plan',
      date: '2026-11-04',
    }));
    expect(store.getState().data.holdings.find((item) => item.id === 'linked-plan'))
      .toMatchObject({ kind: 'plan', actualValue: 76_000 });
    const beforeDelete = store.getState().data;
    perform(() => actions.deleteLinkedTransaction(added.id));
    expect(store.getState().data.holdings.find((item) => item.id === 'linked-plan'))
      .toMatchObject({ kind: 'plan', actualValue: 73_000, logs: [] });
    const undo = useUIStore.getState().actionToast?.onAction;
    if (!undo) throw new Error('Linked transaction deletion did not expose Undo.');
    undo();
    expect(store.getState().data).toEqual(beforeDelete);
  });

  it('undoes adding and editing a backdated entry with its linked transaction and stored value', async () => {
    const storage = new MemoryStorage();
    const today = '2026-11-05';
    const initial = emptyAppData(today);
    initial.holdings.push({
      id: 'undo-manual',
      kind: 'manual',
      name: 'Undo manual',
      type: 'Gold',
      invested: 73_000,
      value: 73_000,
      valueAsOf: today,
      logs: [],
    });
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: initial },
      version: SCHEMA_VERSION,
    }));
    let id = 0;
    const store = createStore(storage, () => `p29t-undo-${++id}`, () => today);
    await hydrated(store);
    useUIStore.getState().setActionToast(null);
    const actions = store.getState().actions;
    const beforeAdd = store.getState().data;
    const beforeAddWrites = storage.setItemCalls;
    actions.addInvestmentEntry('undo-manual', {
      date: '2026-11-04',
      amount: 2_000,
      kind: 'Deposit',
      note: 'Undo add',
    });
    expect(storage.setItemCalls - beforeAddWrites).toBe(1);
    const entry = store.getState().data.holdings.find((holding) => holding.id === 'undo-manual')?.logs[0];
    if (!entry) throw new Error('Backdated entry was not added.');
    expect(store.getState().data.holdings.find((holding) => holding.id === 'undo-manual'))
      .toMatchObject({ kind: 'manual', value: 75_000 });
    const undoAdd = useUIStore.getState().actionToast?.onAction;
    if (!undoAdd) throw new Error('Entry addition did not expose Undo.');
    const beforeUndoAddWrites = storage.setItemCalls;
    undoAdd();
    expect(storage.setItemCalls - beforeUndoAddWrites).toBe(1);
    expect(store.getState().data).toEqual(beforeAdd);

    const beforeReaddWrites = storage.setItemCalls;
    actions.addInvestmentEntry('undo-manual', {
      date: '2026-11-04',
      amount: 2_000,
      kind: 'Deposit',
      note: 'Undo edit',
    });
    expect(storage.setItemCalls - beforeReaddWrites).toBe(1);
    const editEntry = store.getState().data.holdings.find((holding) => holding.id === 'undo-manual')?.logs[0];
    if (!editEntry) throw new Error('Backdated entry was not re-added.');
    const beforeEdit = store.getState().data;
    const beforeEditWrites = storage.setItemCalls;
    actions.updateInvestmentEntry('undo-manual', editEntry.id, { amount: 3_000 });
    expect(storage.setItemCalls - beforeEditWrites).toBe(1);
    expect(store.getState().data.holdings.find((holding) => holding.id === 'undo-manual'))
      .toMatchObject({ kind: 'manual', value: 76_000 });
    expect(store.getState().data.transactions.find((transaction) =>
      transaction.source?.kind === 'holding-entry' && transaction.source.entryId === editEntry.id)?.amount).toBe(3_000);
    const undoEdit = useUIStore.getState().actionToast?.onAction;
    if (!undoEdit) throw new Error('Entry edit did not expose Undo.');
    const beforeUndoEditWrites = storage.setItemCalls;
    undoEdit();
    expect(storage.setItemCalls - beforeUndoEditWrites).toBe(1);
    expect(store.getState().data).toEqual(beforeEdit);
  });

  it.each(['manual', 'plan'] as const)(
    'continues to count every %s entry when there is no valuation date',
    async (kind) => {
      const storage = new MemoryStorage();
      const today = '2026-11-05';
      const initial = emptyAppData(today);
      if (kind === 'manual') {
        initial.holdings.push({
          id: 'undated-manual',
          kind: 'manual',
          name: 'Undated manual',
          type: 'Gold',
          invested: 73_000,
          value: 73_000,
          logs: [],
        });
      } else {
        initial.holdings.push({
          id: 'undated-plan',
          kind: 'plan',
          name: 'Undated plan',
          type: 'Recurring deposit',
          frequency: 'monthly',
          amount: 2_000,
          ratePct: 0,
          stepUpPct: 0,
          tenureYears: 10,
          startDate: '2026-01-01',
          trackFrom: '2026-01-01',
          opening: 73_000,
          actualValue: null,
          actualValueDate: null,
          logs: [],
        });
      }
      storage.values.set('wealthwise.app.v1', JSON.stringify({
        state: { data: initial },
        version: SCHEMA_VERSION,
      }));
      let id = 0;
      const store = createStore(storage, () => `p29t-undated-${++id}`, () => today);
      await hydrated(store);
      const holdingId = kind === 'manual' ? 'undated-manual' : 'undated-plan';
      store.getState().actions.addInvestmentEntry(holdingId, {
        date: '2026-11-04',
        amount: 2_000,
        kind: 'Deposit',
        note: 'No valuation date',
      });
      const holding = store.getState().data.holdings.find((item) => item.id === holdingId);
      if (!holding) throw new Error('Undated holding disappeared.');
      expect(holdingFinancialSummary(holding, today)).toMatchObject({
        invested: 75_000,
        value: 75_000,
        gain: 0,
      });
    },
  );

  it('keeps Cash and Savings returns hidden while shared value selectors follow the adjusted balance', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const today = '2026-11-05';
    const store = createStore(storage, () => `p29t-cash-${++id}`, () => today);
    await hydrated(store);
    const actions = store.getState().actions;
    for (const type of ['Cash', 'Savings account'] as const) {
      actions.addHolding({ name: type, type, invested: 10_000, value: 10_000 });
      const holding = store.getState().data.holdings.find((item) => item.name === type);
      if (!holding || holding.kind !== 'manual') throw new Error(`${type} holding was not created.`);
      actions.addInvestmentEntry(holding.id, {
        date: '2026-11-04',
        amount: 2_000,
        kind: 'Deposit',
        note: 'Backdated balance entry',
      });
    }
    const data = store.getState().data;
    expect(netWorth(data, today)).toMatchObject({ assets: 24_000, netWorth: 24_000 });
    for (const row of buildPortfolioRows(data, today)) {
      expect(row.value).toBe(12_000);
      expect(row.gainPct).toBeNull();
      const card = buildInstrumentCardModel(row, { asOf: today, totalAssets: 24_000 });
      expect(card.description.some((item) => 'text' in item && /return/i.test(item.text))).toBe(false);
    }
  });

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
    )).toBe(50_000);

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
