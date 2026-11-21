import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createHash } from 'node:crypto';

import { createAppStore } from '../../data/createAppStore';
import { useUIStore } from '../../data/uiStore';
import { emptyAppData } from '../../domain/actions';
import { canonicalJson, createBackup, parseBackup } from '../../domain/backup';
import { budgetLineActual, budgetMonthView } from '../../domain/budget';
import { pendingItems } from '../../domain/pending';
import { monthBudgetFromLines } from '../../testFixtures/budget';
import { buildDemoData } from '../../mock/demoData';
import { PendingItemActions } from '../PendingItemActions';
import PaymentConfirmScreen from '../../../app/payment-confirm';
import TransactionsScreen from '../../../app/(tabs)/transactions';
import { NotificationResponseHandler } from '../ReminderRuntime';
import { todayISO } from '../../lib/clock';

type PersistedTestStore = ReturnType<typeof createAppStore> & {
  persist: { rehydrate: () => Promise<void> };
};

// Jest requires `var` for values referenced by hoisted mock factories.
// eslint-disable-next-line no-var
var mockActiveStore: PersistedTestStore | undefined;
// eslint-disable-next-line no-var
var mockRouteParams: Record<string, string> = {};
// eslint-disable-next-line no-var
var mockPathname = '/transactions';
// eslint-disable-next-line no-var
var mockLastResponse: { identifier: string; data: unknown } | null = null;

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
  useAppData: () => mockActiveStore?.getState().data,
  useAppActions: () => mockActiveStore?.getState().actions,
}));
jest.mock('../../data/useSort', () => ({
  useSort: () => ({
    spec: { key: 'date', dir: 'desc' }, selected: false, setSpec: jest.fn(),
    sort: <T,>(items: readonly T[]) => items,
  }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => mockPathname,
}));
jest.mock('../../lib/reminderRuntime', () => ({
  reminderNotificationAdapter: {
    addResponseListener: () => jest.fn(),
    getLastResponse: async () => mockLastResponse,
    clearLastResponse: jest.fn(async () => undefined),
  },
}));
jest.mock('../../lib/reminderNotifications', () => ({
  reminderNotificationAdapter: {
    addResponseListener: () => jest.fn(),
    getLastResponse: async () => mockLastResponse,
    clearLastResponse: jest.fn(async () => undefined),
  },
}));
jest.mock('../../components/ui', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  const node = (type: string) => ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
    ReactModule.createElement(type, props, children);
  return {
    Button: ({ label, ...props }: { label: string; [key: string]: unknown }) =>
      ReactModule.createElement('button', props, label),
    AppText: node('text'),
    Card: node('card'),
    Screen: node('screen'),
    SectionTitle: node('section-title'),
    Chip: node('chip'),
    ChipRow: node('chip-row'),
    EmptyState: node('empty-state'),
    ListItem: node('list-item'),
    SearchField: node('search-field'),
    StatPill: node('stat-pill'),
    WarningBanner: node('warning-banner'),
  };
});
jest.mock('../AppHeader', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return { AppHeader: ({ title }: { title: string }) => ReactModule.createElement('header', null, title) };
});
jest.mock('../SecurityProvider', () => ({
  useSecuritySettings: () => ({ settings: { enabled: false, hidePreviews: false, graceMs: 30_000 } }),
}));
jest.mock('../PendingItemRow', () => {
  const ReactModule = jest.requireActual<typeof React>('react');
  return {
    PendingItemRow: ({ item, actions }: { item: { title: string }; actions: React.ReactNode }) =>
      ReactModule.createElement('pending-item-row', null,
        ReactModule.createElement('text', null, item.title), actions),
  };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
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
    Pressable: node('pressable'),
    ScrollView: node('scroll-view'),
    PanResponder: { create: () => ({ panHandlers: {} }) },
    useWindowDimensions: () => ({ width: 390, height: 800, fontScale: 1 }),
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

function isPersistedTestStore(
  store: ReturnType<typeof createAppStore>,
): store is PersistedTestStore {
  return 'persist' in store
    && typeof store.persist === 'object'
    && store.persist !== null
    && 'rehydrate' in store.persist
    && typeof store.persist.rehydrate === 'function';
}

function createPersistedTestStore(
  storage: TestStorage,
  deps: Parameters<typeof createAppStore>[1],
): PersistedTestStore {
  const store = createAppStore(storage, deps);
  if (!isPersistedTestStore(store)) throw new Error('App store persistence API is missing.');
  return store;
}

const digest = async (value: string) => createHash('sha256').update(value).digest('hex');

describe('P20-A-R3 shared Paid flow with real store persistence', () => {
  const today = '2026-09-10';
  const month = '2026-09';

  afterEach(() => {
    mockActiveStore = undefined;
    mockRouteParams = {};
    mockPathname = '/transactions';
    mockLastResponse = null;
  });

  it('creates a linked one-time Budget row through the store, pays it from the shared action, and undoes it', async () => {
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => today,
      newId: (() => { let id = 0; return () => `integration-${++id}`; })(),
      isDev: false,
    });
    let store = mockActiveStore;
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
    const createdData = store.getState().data;
    const createdItem = createdData.budgetPlan?.items[0];
    if (!createdItem) throw new Error(`Real addBudgetItem action did not create the savings row: ${store.getState().lastError ?? 'no store error'}`);
    expect(createdItem).toMatchObject({ name: 'Emergency savings', frequency: 'once', holdingId: 'manual-savings' });
    expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - beforeCreationWrites).toBe(1);

    const rehydratedStore = createPersistedTestStore(storage, {
      today: () => today,
      newId: () => 'unused-rehydration-id',
      isDev: false,
    });
    await rehydratedStore.persist.rehydrate();
    mockActiveStore = rehydratedStore;
    store = rehydratedStore;
    const dataAfterCreation = store.getState().data;
    expect(dataAfterCreation).toEqual(createdData);

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
        type: 'invest', amount: 5_000, category: 'Other investments',
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
    const paidDate = '2026-10-15';
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => paidDate,
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
      ...emptyAppData(paidDate),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve',
        type: 'Savings account' as const, invested: 10_000, value: 10_000, valueAsOf: paidDate, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: viewMonth,
      },
      monthBudgets: [snapshot],
    };
    store.setState({ data });
    const pending = pendingItems(data, viewMonth, paidDate).find((row) => row.kind === 'budget');
    if (!pending) throw new Error('The linked savings item did not produce a pending row.');
    const before = store.getState().data;
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={paidDate} compact />);
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
      expect(entry).toMatchObject({ date: paidDate, amount: 5_000, kind: 'Deposit' });
      expect(paid.transactions).toHaveLength(1);
      expect(paid.transactions[0]).toMatchObject({
        type: 'invest', amount: 5_000,
        source: { kind: 'holding-entry', parentId: 'manual-savings', entryId: entry?.id },
      });
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - writesBefore).toBe(1);
      expect(budgetLineActual(paid, paidDate.slice(0, 7), 'Emergency savings')).toBe(5_000);
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

  it('does not infer a Savings holding link when neither plan nor snapshot stores the link', () => {
    const category = 'Other investments';
    const item = {
      id: 'unlinked-category-row', sectionId: 'savings', name: category, mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: month,
    };
    const snapshot = monthBudgetFromLines(month, [{ category, planned: item.value }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    snapshot.items = [item];
    const data = {
      ...emptyAppData(today),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve', type: 'Savings account' as const,
        invested: 10_000, value: 10_000, valueAsOf: today, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [item], incomes: [], repeatMonthly: true, repeatFrom: month,
      },
      monthBudgets: [snapshot],
    };
    expect(pendingItems(data, month, today).some((row) => row.category === category)).toBe(false);
  });

  it('keeps the following link when a month-only edit precedes payment in the next month', async () => {
    let actionDate = '2026-10-15';
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => actionDate,
      newId: () => 'scope-history-row',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    store.setState({ data: {
      ...emptyAppData(actionDate),
      holdings: [{
        id: 'manual-savings', kind: 'manual', name: 'Savings reserve',
        type: 'Savings account', invested: 10_000, value: 10_000, valueAsOf: actionDate, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
        items: [], incomes: [], repeatMonthly: true, repeatFrom: '2026-10',
      },
      monthBudgets: [monthBudgetFromLines('2026-10', [], {
        incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
      })],
    } });
    store.getState().actions.addBudgetItem('2026-10', {
      sectionId: 'savings', name: 'Emergency savings', mode: 'amount', value: 5_000,
      frequency: 'monthly', firstDueMonth: '2026-10', dueDay: 10, holdingId: 'manual-savings',
    }, 'following', actionDate);
    const item = store.getState().data.budgetPlan?.items[0];
    if (!item) throw new Error('Following-scope creation did not update the plan.');
    store.getState().actions.editBudgetStructureItem('2026-10', item.id, { value: 6_000 }, 'month', actionDate);
    expect(store.getState().data.monthBudgets?.find((row) => row.month === '2026-10')?.items[0]?.value).toBe(6_000);
    expect(store.getState().data.budgetPlan?.items[0]).toMatchObject({ value: 5_000, holdingId: 'manual-savings' });

    actionDate = '2026-11-15';
    store.getState().actions.ensureCurrentMonthBudget(actionDate);
    const dataBeforePaid = store.getState().data;
    const pending = pendingItems(dataBeforePaid, '2026-11', actionDate).find((row) => row.kind === 'budget');
    if (!pending) throw new Error('Next-month plan did not create a linked pending row.');
    expect(pending.source).toMatchObject({ kind: 'budget', month: '2026-11', holdingId: 'manual-savings' });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={actionDate} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      await act(async () => { renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const beforeWrites = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('Manual savings holding was lost.');
      expect(holding.logs).toHaveLength(1);
      expect(paid.transactions).toHaveLength(1);
      expect(budgetLineActual(paid, '2026-11', 'Emergency savings')).toBe(5_000);
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - beforeWrites).toBe(1);
      const toast = useUIStore.getState().actionToast;
      await act(async () => { toast?.onAction?.(); });
      expect(store.getState().data).toEqual(dataBeforePaid);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('keeps recurring Budget rows linked to a manual one-time holding instead of treating them as plan dues', async () => {
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => today,
      newId: () => 'recurring-linked-row',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    store.setState({ data: {
      ...emptyAppData(today),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve', type: 'Savings account' as const,
        invested: 10_000, value: 10_000, valueAsOf: today, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [], incomes: [], repeatMonthly: true, repeatFrom: month,
      },
      monthBudgets: [monthBudgetFromLines(month, [], {
        incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
      })],
    } });
    store.getState().actions.addBudgetItem(month, {
      sectionId: 'savings', name: 'Recurring reserve', mode: 'amount', value: 1_000,
      frequency: 'monthly', firstDueMonth: month, dueDay: 10, holdingId: 'manual-savings',
    }, 'following', today);
    const pending = pendingItems(store.getState().data, month, today)
      .find((row) => row.kind === 'budget' && row.category === 'Recurring reserve');
    if (!pending) throw new Error('The recurring linked row did not appear.');
    expect(pending.source).toMatchObject({ kind: 'budget', holdingId: 'manual-savings' });

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={today} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      await act(async () => { renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('The manual Savings account is missing.');
      expect(holding.logs).toHaveLength(1);
      expect(paid.transactions).toHaveLength(1);
      expect(budgetLineActual(paid, month, 'Recurring reserve')).toBe(1_000);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it.each([20, 21, 22, 23])('retains the linked savings item after plain backup import from schema v%s', async (schemaVersion) => {
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => today,
      newId: () => 'backup-id',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    const snapshot = monthBudgetFromLines(month, [{ category: 'Emergency savings', planned: 5_000, dueDay: 10 }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    const budgetItem = {
      id: 'backup-linked-row', sectionId: 'savings', name: 'Emergency savings', mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: month, dueDay: 10, holdingId: 'manual-savings',
    };
    snapshot.items = [budgetItem];
    const backupData = {
      ...emptyAppData(today),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve',
        type: 'Savings account' as const, invested: 10_000, value: 10_000, valueAsOf: today, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: month,
      },
      monthBudgets: [snapshot],
    };
    const plainBackup = await createBackup(backupData, { exportedAt: '2026-09-10T10:00:00.000Z', digest });
    const envelope = JSON.parse(plainBackup) as {
      schemaVersion: number;
      checksum: { algorithm: 'sha256'; value: string };
      data: unknown;
    };
    envelope.schemaVersion = schemaVersion;
    envelope.checksum.value = await digest(canonicalJson(envelope.data));
    const parsed = await parseBackup(JSON.stringify(envelope), {
      digest, today, newId: () => 'backup-migration-id',
    });
    if (!parsed.ok) throw new Error(`Schema v${schemaVersion} backup did not import: ${parsed.message}`);
    await expect(store.getState().actions.replaceAllData(parsed.data)).resolves.toMatchObject({ ok: true });
    const before = store.getState().data;
    const pending = pendingItems(before, month, today).find((row) => row.kind === 'budget');
    if (!pending) throw new Error(`Schema v${schemaVersion} import lost the pending savings row.`);

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={today} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      await act(async () => { renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const beforeWrites = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('The imported Savings account is missing.');
      expect(holding.logs).toHaveLength(1);
      expect(paid.transactions).toHaveLength(1);
      expect(budgetLineActual(paid, month, 'Emergency savings')).toBe(5_000);
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - beforeWrites).toBe(1);
      const toast = useUIStore.getState().actionToast;
      await act(async () => { toast?.onAction?.(); });
      expect(store.getState().data).toEqual(before);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('clears a linked Savings row through the actual payment-confirm route', async () => {
    const routeToday = todayISO();
    const routeMonth = routeToday.slice(0, 7);
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => routeToday,
      newId: () => 'payment-confirm-entry',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    const budgetItem = {
      id: 'payment-confirm-row', sectionId: 'savings', name: 'Emergency savings', mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: routeMonth, dueDay: Number(routeToday.slice(8, 10)),
      holdingId: 'manual-savings',
    };
    const snapshot = monthBudgetFromLines(routeMonth, [{ category: budgetItem.name, planned: budgetItem.value, dueDay: budgetItem.dueDay }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    snapshot.items = [budgetItem];
    const routeData = {
      ...emptyAppData(routeToday),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve',
        type: 'Savings account' as const, invested: 10_000, value: 10_000, valueAsOf: routeToday, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: routeMonth,
      },
      monthBudgets: [snapshot],
    };
    store.setState({ data: routeData });
    const pending = pendingItems(routeData, routeMonth, routeToday).find((row) => row.kind === 'budget');
    if (!pending?.dueDate) throw new Error('Payment-confirm route fixture has no dated pending savings row.');
    mockRouteParams = { dueItemId: pending.id, dueDate: pending.dueDate };

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => { renderer = TestRenderer.create(<PaymentConfirmScreen />); });
      if (!renderer) throw new Error('Payment-confirm did not render.');
      const paid = renderer.root.findByProps({ children: 'Paid' });
      await act(async () => { paid.props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const writesBefore = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });
      const result = store.getState().data;
      const holding = result.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('Payment-confirm lost the Savings account.');
      expect(holding.logs).toHaveLength(1);
      expect(result.transactions).toHaveLength(1);
      expect(budgetLineActual(result, routeMonth, 'Emergency savings')).toBe(5_000);
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - writesBefore).toBe(1);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('creates and clears a linked one-time savings row from the demo fixture through store actions', async () => {
    const demoToday = todayISO();
    const demoMonth = demoToday.slice(0, 7);
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => demoToday,
      newId: () => 'demo-linked-savings-row',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    store.setState({ data: buildDemoData(demoToday) });
    const section = store.getState().data.budgetPlan?.sections.find((row) => row.type === 'invest' && !row.system);
    if (!section) throw new Error('Demo investment section is missing.');
    store.getState().actions.addBudgetItem(demoMonth, {
      sectionId: section.id, name: 'Demo linked reserve', mode: 'amount', value: 5_000,
      frequency: 'once', firstDueMonth: demoMonth, dueDay: Number(demoToday.slice(8, 10)),
      holdingId: 'demo-holding-emergency-bank',
    }, 'following', demoToday);
    const pending = pendingItems(store.getState().data, demoMonth, demoToday)
      .find((row) => row.kind === 'budget' && row.category === 'Demo linked reserve');
    if (!pending) throw new Error('Demo-created linked row is not pending.');

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<PendingItemActions item={pending} today={demoToday} compact />);
      });
      if (!renderer) throw new Error('The shared pending action did not render.');
      await act(async () => { renderer?.root.findByProps({ children: 'Marked as paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'demo-holding-emergency-bank');
      if (holding?.kind !== 'manual') throw new Error('Demo Savings account is missing.');
      expect(holding.logs.at(-1)).toMatchObject({ amount: 5_000, kind: 'Deposit', note: 'Demo linked reserve' });
      expect(paid.transactions.filter((row) => row.source?.kind === 'holding-entry'
        && row.source.parentId === holding.id)).toHaveLength(1);
      expect(budgetLineActual(paid, demoMonth, 'Demo linked reserve')).toBe(5_000);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('clears a linked Savings row from the real Transactions pending list', async () => {
    const routeToday = todayISO();
    const routeMonth = routeToday.slice(0, 7);
    const storage = makeStorage();
    mockActiveStore = createPersistedTestStore(storage, {
      today: () => routeToday,
      newId: () => 'transactions-entry',
      isDev: false,
    });
    const store = mockActiveStore;
    if (!store) throw new Error('Real app store was not created.');
    await store.persist.rehydrate();
    const budgetItem = {
      id: 'transactions-row', sectionId: 'savings', name: 'Emergency savings', mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: routeMonth,
      dueDay: Number(routeToday.slice(8, 10)), holdingId: 'manual-savings',
    };
    const snapshot = monthBudgetFromLines(routeMonth, [{ category: budgetItem.name, planned: budgetItem.value, dueDay: budgetItem.dueDay }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    snapshot.items = [budgetItem];
    store.setState({ data: {
      ...emptyAppData(routeToday),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve', type: 'Savings account' as const,
        invested: 10_000, value: 10_000, valueAsOf: routeToday, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: routeMonth,
      },
      monthBudgets: [snapshot],
    } });
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => { renderer = TestRenderer.create(<TransactionsScreen />); });
      if (!renderer) throw new Error('Transactions did not render.');
      expect(renderer.root.findAllByType('text').some((node) => node.children.join('') === 'Emergency savings')).toBe(true);
      await act(async () => { renderer?.root.findByProps({ children: 'Paid' }).props.onPress(); });
      const confirm = renderer.root.findByProps({ accessibilityLabel: 'Confirm paid' });
      const beforeWrites = storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length;
      await act(async () => { confirm.props.onPress(); });
      const paid = store.getState().data;
      const holding = paid.holdings.find((row) => row.id === 'manual-savings');
      if (holding?.kind !== 'manual') throw new Error('Transactions lost the Savings account.');
      expect(holding.logs).toHaveLength(1);
      expect(paid.transactions).toHaveLength(1);
      expect(budgetLineActual(paid, routeMonth, 'Emergency savings')).toBe(5_000);
      expect(storage.writes.filter((write) => write.key === 'wealthwise.app.v1').length - beforeWrites).toBe(1);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });

  it('routes a cold-start reminder tap for a linked Budget due to payment-confirm', async () => {
    const routeToday = todayISO();
    const routeMonth = routeToday.slice(0, 7);
    const budgetItem = {
      id: 'reminder-savings-row', sectionId: 'savings', name: 'Emergency savings', mode: 'amount' as const,
      value: 5_000, frequency: 'once' as const, firstDueMonth: routeMonth,
      dueDay: Number(routeToday.slice(8, 10)), holdingId: 'manual-savings',
    };
    const snapshot = monthBudgetFromLines(routeMonth, [{ category: budgetItem.name, planned: budgetItem.value, dueDay: budgetItem.dueDay }], {
      incomes: [], sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    snapshot.items = [budgetItem];
    const data = {
      ...emptyAppData(routeToday),
      holdings: [{
        id: 'manual-savings', kind: 'manual' as const, name: 'Savings reserve', type: 'Savings account' as const,
        invested: 10_000, value: 10_000, valueAsOf: routeToday, logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' as const }],
        items: [budgetItem], incomes: [], repeatMonthly: true, repeatFrom: routeMonth,
      },
      monthBudgets: [snapshot],
    };
    const pending = pendingItems(data, routeMonth, routeToday).find((row) => row.kind === 'budget');
    if (!pending?.dueDate) throw new Error('Reminder fixture has no dated linked Budget due.');
    mockLastResponse = {
      identifier: 'cold-start-linked-savings',
      data: {
        type: 'wealthwise-reminder',
        target: { dueItemId: pending.id, dueDate: pending.dueDate },
      },
    };
    mockPathname = '/transactions';

    let renderer: TestRenderer.ReactTestRenderer | undefined;
    try {
      await act(async () => {
        renderer = TestRenderer.create(<NotificationResponseHandler />);
        await Promise.resolve();
        await Promise.resolve();
      });
      const router = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/payment-confirm',
        params: { dueItemId: pending.id, dueDate: pending.dueDate },
      });
      const adapter = jest.requireMock('../../lib/reminderNotifications') as {
        reminderNotificationAdapter: { clearLastResponse: jest.Mock };
      };
      expect(adapter.reminderNotificationAdapter.clearLastResponse).toHaveBeenCalledTimes(1);
    } finally {
      if (renderer) act(() => renderer?.unmount());
    }
  });
});
