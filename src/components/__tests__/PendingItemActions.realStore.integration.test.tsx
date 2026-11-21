import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { createAppStore } from '../../data/createAppStore';
import { useUIStore } from '../../data/uiStore';
import { emptyAppData } from '../../domain/actions';
import { budgetLineActual, budgetMonthView } from '../../domain/budget';
import { pendingItems } from '../../domain/pending';
import { monthBudgetFromLines } from '../../testFixtures/budget';
import { PendingItemActions } from '../PendingItemActions';

var mockActiveStore: ReturnType<typeof createAppStore> | undefined;

jest.mock('../../data/store', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const useAppStore = Object.assign(
    (selector: (state: unknown) => unknown) => ReactModule.useSyncExternalStore(
      (notify) => mockActiveStore?.subscribe(notify) ?? (() => undefined),
      () => selector(mockActiveStore?.getState()),
      () => selector(mockActiveStore?.getState()),
    ),
    { getState: () => mockActiveStore?.getState() },
  );
  return { useAppStore };
});

jest.mock('../../data/useAppData', () => ({
  useAppActions: () => mockActiveStore?.getState().actions,
}));

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    Button: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('button', props, label),
  };
});
jest.mock('../PaidAmountDialog', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    PaidAmountDialog: ({ visible, dueAmount, onPaid }: {
      visible: boolean;
      dueAmount: number;
      onPaid: (amount: number) => void;
    }) => visible ? ReactModule.createElement('button', {
      accessibilityLabel: 'Confirm paid',
      onPress: () => onPaid(dueAmount),
    }) : null,
  };
});
jest.mock('../../theme/useTheme', () => ({ useTheme: () => ({ colors: { text2: '#222', text3: '#666' } }) }));
jest.mock('react-native', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
    View: node('view'),
  };
});

type TestStorage = {
  values: Map<string, string>;
  writes: { key: string; value: string }[];
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function makeStorage(): TestStorage {
  const storage: TestStorage = {
    values: new Map(),
    writes: [],
    getItem(key) { return this.values.get(key) ?? null; },
    setItem(key, value) { this.writes.push({ key, value }); this.values.set(key, value); },
    removeItem(key) { this.values.delete(key); },
  };
  return storage;
}

describe('P20-A-R3 shared Paid flow with real store persistence', () => {
  const today = '2026-09-10';
  const month = '2026-09';

  afterEach(() => {
    mockActiveStore = undefined;
  });

  it('creates a linked one-time Budget row through the store, pays it from the shared action, and undoes it', async () => {
    const storage = makeStorage();
    mockActiveStore = createAppStore(storage, {
      today: () => today,
      newId: (() => { let id = 0; return () => `integration-${++id}`; })(),
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();

    const initial = {
      ...emptyAppData(today),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve',
        type: 'Savings account' as const, invested: 10_000, value: 10_000,
        valueAsOf: today, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [], incomes: [], repeatMonthly: true, repeatFrom: month,
      },
      monthBudgets: [monthBudgetFromLines(month, [], {
        incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
      })],
    };
    store.setState({ data: initial });
    const beforeCreationWrites = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
    store.getState().actions.addBudgetItem(month, {
      sectionId: 'savings', name: 'Emergency savings', mode: 'amount', value: 5_000,
      frequency: 'once', firstDueMonth: month, dueDay: 10, holdingId: 'manual-savings',
    }, 'following', today);
    const dataAfterCreation = store.getState().data;
    const createdItem = dataAfterCreation.budgetPlan?.items[0];
    if (!createdItem) throw new Error(`Real addBudgetItem action did not create the savings row: ${store.getState().lastError ?? 'no store error'}`);
    expect(createdItem).toMatchObject({ name: 'Emergency savings', frequency: 'once', holdingId: 'manual-savings' });
    expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - beforeCreationWrites).toBe(1);

    const pending = pendingItems(dataAfterCreation, month, today).find((row) => row.kind === 'budget');
    if (!pending) throw new Error('The newly created savings row was not in the pending list.');
    expect(pending.source).toMatchObject({ kind: 'budget', month, holdingId: 'manual-savings' });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={today} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      const paidButton = renderer.root.findByProps({ children: 'Marked as paid' });
      await act(async () => { paidButton.props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const writesBeforePaid = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });

      const paidData = store.getState().data;
      const paidHolding = paidData.holdings.find((holding) => holding.id === 'manual-savings');
      if (paidHolding?.kind !== 'manual') throw new Error('Manual savings holding was lost.');
      const entry = paidHolding.logs[0];
      if (!entry) throw new Error('Paid did not create a holding deposit.');
      expect(entry).toMatchObject({ date: today, amount: 5_000, kind: 'Deposit', note: 'Emergency savings' });
      expect(paidData.transactions).toEqual([expect.objectContaining({
        type: 'invest', amount: 5_000,
        source: { kind: 'holding-entry', parentId: 'manual-savings', entryId: entry.id },
      })]);
      expect(budgetMonthView(paidData, month).lines.find((line) => line.category === 'Emergency savings'))
        .toMatchObject({ planned: 5_000, actual: 5_000, remaining: 0 });
      expect(pendingItems(paidData, month, today).some((row) => row.category === 'Emergency savings')).toBe(false);
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - writesBeforePaid).toBe(1);
      const persisted = storage.values.get('wealthwise.app.v1');
      if (!persisted) throw new Error('Paid state was not persisted.');
      expect(JSON.parse(persisted).state.data).toEqual(paidData);

      const toast = useUIStore.getState().actionToast;
      expect(toast?.actionLabel).toBe('Undo');
      const writesBeforeUndo = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { toast?.onAction?.(); });
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - writesBeforeUndo).toBe(1);
      expect(store.getState().data).toEqual(dataAfterCreation);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it.each(
    (['plan-only', 'snapshot-only', 'both'] as const).flatMap((linkLocation) => [
      { linkLocation, viewMonth: '2026-10' },
      { linkLocation, viewMonth: '2026-08' },
    ]),
  )('preserves a $linkLocation holding link when paying from viewed month $viewMonth', async ({ linkLocation, viewMonth }) => {
    const storage = makeStorage();
    mockActiveStore = createAppStore(storage, {
      today: () => today,
      newId: (() => { let id = 0; return () => `placement-${++id}`; })(),
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();

    const hasPlanLink = linkLocation !== 'snapshot-only';
    const hasSnapshotLink = linkLocation !== 'plan-only';
    const budgetItem = {
      id: 'linked-row', sectionId: 'savings', name: 'Emergency savings', mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: viewMonth, dueDay: 10,
      ...(hasPlanLink ? { holdingId: 'manual-savings' } : {}),
    };
    const snapshot = monthBudgetFromLines(viewMonth, [{ category: budgetItem.name, planned: budgetItem.value, dueDay: 10 }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    snapshot.items = [{ ...budgetItem, ...(hasSnapshotLink ? { holdingId: 'manual-savings' } : { holdingId: undefined }) }];
    const data = {
      ...emptyAppData(today),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve',
        type: 'Savings account' as const, invested: 10_000, value: 10_000, valueAsOf: today, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: viewMonth,
      },
      monthBudgets: [snapshot],
    };
    store.setState({ data });
    const pending = pendingItems(data, viewMonth, today).find((row) => row.kind === 'budget');
    if (!pending) throw new Error('The linked savings item did not produce a pending row.');
    const before = store.getState().data;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={today} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      await act(async () => { renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const writesBefore = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('Manual savings holding was lost.');
      const entry = holding.logs[0];
      expect(entry).toMatchObject({ date: today, amount: 5_000, kind: 'Deposit' });
      expect(paid.transactions).toHaveLength(1);
      expect(paid.transactions[0]).toMatchObject({
        type: 'invest', amount: 5_000,
        source: { kind: 'holding-entry', parentId: 'manual-savings', entryId: entry?.id },
      });
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - writesBefore).toBe(1);
      expect(budgetLineActual(paid, today.slice(0, 7), 'Emergency savings')).toBe(5_000);
      const toast = useUIStore.getState().actionToast;
      expect(toast?.actionLabel).toBe('Undo');
      const undoWritesBefore = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { toast?.onAction?.(); });
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - undoWritesBefore).toBe(1);
      expect(store.getState().data).toEqual(before);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });
});
