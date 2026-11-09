import type { StateStorage } from 'zustand/middleware';

import { canonicalJson, createBackup, parseBackup } from '../../domain/backup';
import { decryptBackup, encryptBackup } from '../../domain/backupCrypto';
import { describeSource, validateIntegrity } from '../../domain/links';
import { loanState } from '../../domain/liability';
import { deleteLiability as deleteLiabilityData } from '../../domain/liabilityActions';
import { monthPositionAt } from '../../domain/cashFlow';
import {
  budgetLineActual,
  budgetMonthView,
  budgetOverview,
  defaultBudgetSections,
  linkedRecurringForMonth,
  plannedIncomeOf,
} from '../../domain/budget';
import { liabilitiesOverview, netWorth } from '../../domain/summary';
import { makeLiabilityPaymentFormSchema } from '../../domain/schemas';
import { behindBy } from '../../domain/sip';
import { holdingInvested, holdingValue } from '../../domain/portfolio';
import { pendingItems } from '../../domain/pending';
import { policySchedule } from '../../domain/policySchedule';
import { policySummary } from '../../domain/policySummary';
import { planReminders } from '../../domain/reminders';
import { liabilitySchedule, upcomingDue } from '../../domain/schedule';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import { SUGGESTED_EF_ALLOCATION } from '../../domain/efAllocation';
import { createAppStore } from '../createAppStore';
import { useUIStore } from '../uiStore';
import { makeV1Fixture, makeV2Fixture, makeV4Fixture, makeV5Fixture, makeV6Fixture } from '../testFixtures/v1';
import { makeV10Fixture } from '../testFixtures/v10';
import { makeV11Fixture } from '../testFixtures/v11';
import { makeV12Fixture } from '../testFixtures/v12';
import { emptyAppData } from '../../domain/actions';
import type { AppData, ISODate } from '../../domain/types';
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
  clearUiMeta?: () => Promise<void>;
  cancelReminders?: () => Promise<void>;
  today?: () => ISODate;
} = {}) => createAppStore(storage, {
  newId: overrides.newId ?? (() => 'fixed-id'),
  today: overrides.today ?? (() => '2026-10-10'),
  reload: overrides.reload,
  removeLockSettings: overrides.removeLockSettings,
  clearUiMeta: overrides.clearUiMeta,
  cancelReminders: overrides.cancelReminders,
  ...(overrides.isDev === undefined ? {} : { isDev: overrides.isDev }),
});

it('hydrates v12 item recurrence defaults and archives the original bytes once', async () => {
  const storage = new MemoryStorage();
  const data = makeV12Fixture();
  const originalBytes = JSON.stringify({ state: { data }, version: 12 });
  storage.values.set('wealthwise.app.v1', originalBytes);

  const first = makeStore(storage, { today: () => '2026-10-21', isDev: false });
  await waitForHydration(first);
  expect(first.getState().data.budgetPlan?.items.every((item) => item.frequency === 'monthly')).toBe(true);
  expect(first.getState().data.monthBudgets?.every((budget) =>
    budget.items.every((item) => item.frequency === 'monthly'),
  )).toBe(true);
  const archiveKey = 'wealthwise.app.v1.premigration.v12';
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
  expect(archiveWrites).toBe(1);

  const second = makeStore(storage, { today: () => '2026-10-21', isDev: false });
  await waitForHydration(second);
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);
  await second.getState().actions.eraseAllData();
  expect(storage.values.has(archiveKey)).toBe(false);
});

it('hydrates v14 insurance data, archives exact original bytes once and erases the archive', async () => {
  const storage = new MemoryStorage();
  const data = {
    ...mockAppData,
    coverGoals: [
      { type: 'term-life', targetMode: 'income-multiple', targetValue: 10 },
      { type: 'health', targetMode: 'amount' },
      { type: 'motor', targetMode: 'active-only' },
      { type: 'home', targetMode: 'active-only' },
      { type: 'other', targetMode: 'active-only' },
    ],
  };
  const originalBytes = JSON.stringify({ state: { data }, version: 14 });
  storage.values.set('wealthwise.app.v1', originalBytes);

  const first = makeStore(storage, { isDev: false });
  await waitForHydration(first);
  const { coverGoals: _oldCoverGoals, ...otherData } = data;
  expect(first.getState().data).toEqual(otherData);
  const archiveKey = 'wealthwise.app.v1.premigration.v14';
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
  expect(archiveWrites).toBe(1);

  const second = makeStore(storage, { isDev: false });
  await waitForHydration(second);
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);

  storage.values.set('wealthwise.app.v1', originalBytes);
  storage.values.set(archiveKey, 'preserve-existing-v14-archive');
  const third = makeStore(storage, { isDev: false });
  await waitForHydration(third);
  expect(storage.values.get(archiveKey)).toBe('preserve-existing-v14-archive');
  expect((await third.getState().actions.eraseAllData()).ok).toBe(true);
  expect(storage.values.has(archiveKey)).toBe(false);
});

it('hydrates v15 holding types, archives exact original bytes once and erases the archive', async () => {
  const storage = new MemoryStorage();
  const data = {
    ...mockAppData,
    holdings: [
      ...mockAppData.holdings,
      {
        id: 'legacy-combined-fd',
        kind: 'manual' as const,
        name: 'Legacy fixed',
        type: 'FD / RD' as const,
        invested: 1_000,
        value: 1_000,
        logs: [],
      },
      {
        id: 'legacy-combined-rd',
        kind: 'manual' as const,
        name: 'Legacy recurring',
        type: 'Fixed deposit / RD' as const,
        invested: 2_000,
        value: 2_100,
        logs: [{ id: 'legacy-rd-entry', date: '2026-10-01', amount: 100, note: 'keep', kind: 'Deposit' as const }],
      },
    ],
  };
  const originalBytes = JSON.stringify({ state: { data }, version: 15 });
  storage.values.set('wealthwise.app.v1', originalBytes);

  const first = makeStore(storage, { isDev: false });
  await waitForHydration(first);
  expect(first.getState().data.holdings).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'legacy-combined-fd', type: 'Fixed deposit', logs: [] }),
    expect.objectContaining({
      id: 'legacy-combined-rd',
      type: 'Recurring deposit',
      logs: [{ id: 'legacy-rd-entry', date: '2026-10-01', amount: 100, note: 'keep', kind: 'Deposit' }],
    }),
  ]));
  const archiveKey = 'wealthwise.app.v1.premigration.v15';
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
  expect(archiveWrites).toBe(1);

  const second = makeStore(storage, { isDev: false });
  await waitForHydration(second);
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);

  storage.values.set('wealthwise.app.v1', originalBytes);
  storage.values.set(archiveKey, 'preserve-existing-v15-archive');
  const third = makeStore(storage, { isDev: false });
  await waitForHydration(third);
  expect(storage.values.get(archiveKey)).toBe('preserve-existing-v15-archive');
  expect((await third.getState().actions.eraseAllData()).ok).toBe(true);
  expect(storage.values.has(archiveKey)).toBe(false);
});

it('hydrates v16 policies, archives exact bytes once, and erases the v16 archive', async () => {
  const storage = new MemoryStorage();
  const data = {
    ...mockAppData,
    coverGoals: [{ id: 'legacy-cover', name: 'Legacy', kind: 'health', target: { mode: 'none' } }],
    policies: mockAppData.policies.map((policy) => ({ ...policy, coverGoalId: 'legacy-cover' })),
  };
  const originalBytes = JSON.stringify({ state: { data }, version: 16 });
  storage.values.set('wealthwise.app.v1', originalBytes);

  const first = makeStore(storage, { isDev: false });
  await waitForHydration(first);
  expect(first.getState().data).toEqual(mockAppData);
  const archiveKey = 'wealthwise.app.v1.premigration.v16';
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
  expect(archiveWrites).toBe(1);

  const second = makeStore(storage, { isDev: false });
  await waitForHydration(second);
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);

  storage.values.set('wealthwise.app.v1', originalBytes);
  storage.values.set(archiveKey, 'preserve-existing-v16-archive');
  const third = makeStore(storage, { isDev: false });
  await waitForHydration(third);
  expect(storage.values.get(archiveKey)).toBe('preserve-existing-v16-archive');
  expect((await third.getState().actions.eraseAllData()).ok).toBe(true);
  expect(storage.values.has(archiveKey)).toBe(false);
});

it('migrates v17 policy payments without changing the existing FIFO schedule and archives bytes once', async () => {
  const storage = new MemoryStorage();
  const policy = {
    ...mockAppData.policies[0],
    frequency: 'monthly' as const,
    trackFrom: '2026-11-07',
    endDate: '2026-12-31',
    payments: [
      { id: 'before-track', date: '2026-11-06', amount: 500, note: '' },
      { id: 'first-slot', date: '2026-11-08', amount: 500, note: '' },
      { id: 'second-slot', date: '2026-12-10', amount: 500, note: '' },
      { id: 'unmatched', date: '2026-12-11', amount: 500, note: '' },
    ],
  };
  if (!policy) throw new Error('Expected the policy migration fixture.');
  const data = { ...mockAppData, policies: [policy] };
  const originalBytes = JSON.stringify({ state: { data }, version: 17 });
  storage.values.set('wealthwise.app.v1', originalBytes);

  const first = makeStore(storage, { today: () => '2026-12-15', isDev: false });
  await waitForHydration(first);
  expect(first.getState().data.policies[0]?.payments).toEqual([
    { id: 'before-track', date: '2026-11-06', amount: 500, note: '' },
    { id: 'first-slot', date: '2026-11-08', amount: 500, note: '', dueDate: '2026-11-07' },
    { id: 'second-slot', date: '2026-12-10', amount: 500, note: '', dueDate: '2026-12-07' },
    { id: 'unmatched', date: '2026-12-11', amount: 500, note: '' },
  ]);
  expect(policySchedule(data.policies[0]!, '2026-12-15').rows.map((row) =>
    [row.dueDate, row.status, row.entryId],
  )).toEqual(policySchedule(first.getState().data.policies[0]!, '2026-12-15').rows.map((row) =>
    [row.dueDate, row.status, row.entryId],
  ));
  const archiveKey = 'wealthwise.app.v1.premigration.v17';
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
  expect(archiveWrites).toBe(1);

  const second = makeStore(storage, { today: () => '2026-12-15', isDev: false });
  await waitForHydration(second);
  expect(storage.values.get(archiveKey)).toBe(originalBytes);
  expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);
  storage.values.set('wealthwise.app.v1', originalBytes);
  storage.values.set(archiveKey, 'preserve-existing-v17-archive');
  const third = makeStore(storage, { today: () => '2026-12-15', isDev: false });
  await waitForHydration(third);
  expect(storage.values.get(archiveKey)).toBe('preserve-existing-v17-archive');
  expect((await third.getState().actions.eraseAllData()).ok).toBe(true);
  expect(storage.values.has(archiveKey)).toBe(false);
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
  it('records an early premium against its selected due date in one write and undoes both records', async () => {
    let sequence = 0;
    const storage = new MemoryStorage();
    const store = makeStore(storage, {
      newId: () => `early-payment-${++sequence}`,
      today: () => '2026-11-04',
      isDev: false,
    });
    await waitForHydration(store);
    store.getState().actions.addPolicy({
      name: 'Monthly cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 500,
      frequency: 'monthly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-11-07',
      currentValue: null,
      valueAsOf: null,
    });
    const policy = store.getState().data.policies[0];
    if (!policy) throw new Error('Policy fixture was not created.');
    const before = store.getState().data;
    const writes = storage.setItemCalls;

    const entryId = store.getState().actions.clearDue(
      { kind: 'policy', id: policy.id },
      'policy:0',
      500,
    );

    expect(storage.setItemCalls - writes).toBe(1);
    const paidPolicy = store.getState().data.policies.find((item) => item.id === policy.id);
    expect(paidPolicy?.payments.at(-1)).toMatchObject({
      id: entryId,
      date: '2026-11-04',
      dueDate: '2026-11-07',
      amount: 500,
    });
    expect(policySchedule(paidPolicy ?? policy, '2026-11-04').summary.nextDue?.dueDate).toBe('2026-12-07');
    expect(store.getState().data.transactions).toEqual([
      expect.objectContaining({
        date: '2026-11-04',
        amount: 500,
        category: 'Health premium',
        source: { kind: 'policy-payment', parentId: policy.id, entryId },
      }),
    ]);

    const writesBeforeUndo = storage.setItemCalls;
    store.getState().actions.undoClearDue({ kind: 'policy', id: policy.id }, entryId ?? '');
    expect(storage.setItemCalls - writesBeforeUndo).toBe(1);
    expect(store.getState().data).toEqual(before);
  });

  it.each([
    ['monthly', '2026-12-07'],
    ['quarterly', '2027-02-07'],
    ['yearly', '2027-11-07'],
    ['custom', '2027-01-07'],
  ] as const)('settles the exact %s slot and advances to %s for early, on-time and late payments', async (frequency, nextDueDate) => {
    for (const [paidDate, amount] of [
      ['2026-11-04', 300],
      ['2026-11-07', 500],
      ['2026-11-10', 700],
    ] as const) {
      let sequence = 0;
      const store = makeStore(new MemoryStorage(), {
        newId: () => `slot-${++sequence}`,
        today: () => paidDate,
        isDev: false,
      });
      await waitForHydration(store);
      store.getState().actions.addPolicy({
        name: 'Scheduled cover',
        insurer: 'Insurer',
        kind: 'health',
        premium: 500,
        frequency,
        ...(frequency === 'custom' ? { customIntervalMonths: 2 } : {}),
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        status: 'active',
        premiumYears: 5,
        trackFrom: '2026-11-07',
        currentValue: null,
        valueAsOf: null,
      });
      const policy = store.getState().data.policies[0];
      if (!policy) throw new Error('Policy fixture was not created.');
      const entryId = store.getState().actions.clearDue(
        { kind: 'policy', id: policy.id },
        'policy:0',
        amount,
      );
      const updated = store.getState().data.policies[0];
      expect(updated?.payments.at(-1)).toMatchObject({
        id: entryId,
        date: paidDate,
        dueDate: '2026-11-07',
        amount,
      });
      expect(policySchedule(updated ?? policy, paidDate).summary.nextDue?.dueDate).toBe(nextDueDate);
      expect(store.getState().data.transactions).toContainEqual(expect.objectContaining({
        amount,
        date: paidDate,
        category: 'Health premium',
        source: { kind: 'policy-payment', parentId: policy.id, entryId },
      }));
    }
  });

  it('settles consecutive policy slots separately, supports schedule edits and undoes both payments', async () => {
    let sequence = 0;
    const store = makeStore(new MemoryStorage(), {
      newId: () => `consecutive-${++sequence}`,
      today: () => '2026-11-04',
      isDev: false,
    });
    await waitForHydration(store);
    store.getState().actions.addPolicy({
      name: 'Consecutive cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 500,
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-11-07',
      currentValue: null,
      valueAsOf: null,
    });
    const policy = store.getState().data.policies[0];
    if (!policy) throw new Error('Policy fixture was not created.');
    const initialData = store.getState().data;
    const first = store.getState().actions.clearDue({ kind: 'policy', id: policy.id }, 'policy:0', 400);
    const second = store.getState().actions.clearDue({ kind: 'policy', id: policy.id }, 'policy:1', 600);
    expect(store.getState().data.policies[0]?.payments.map(({ dueDate, amount }) => [dueDate, amount]))
      .toEqual([['2026-11-07', 400], ['2026-12-07', 600]]);
    expect(policySchedule(store.getState().data.policies[0] ?? policy, '2026-11-04')
      .summary.nextDue?.dueDate).toBe('2027-01-07');

    store.getState().actions.updatePolicy(policy.id, { trackFrom: '2026-12-14' });
    expect(policySchedule(store.getState().data.policies[0] ?? policy, '2026-11-04')
      .summary.nextDue?.dueDate).toBe('2026-12-14');
    store.getState().actions.updatePolicy(policy.id, { trackFrom: '2026-11-07' });
    store.getState().actions.undoClearDue({ kind: 'policy', id: policy.id }, second ?? '');
    store.getState().actions.undoClearDue({ kind: 'policy', id: policy.id }, first ?? '');
    expect(store.getState().data).toEqual(initialData);
  });

  it('updates Insurance, Transactions, Budget, Home and reminder due selectors together', async () => {
    const store = makeStore(new MemoryStorage(), {
      newId: (() => { let sequence = 0; return () => `surface-${++sequence}`; })(),
      today: () => '2026-11-04',
      isDev: false,
    });
    await waitForHydration(store);
    store.getState().actions.addPolicy({
      name: 'Surface cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 500,
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-11-07',
      currentValue: null,
      valueAsOf: null,
    });
    const policy = store.getState().data.policies[0];
    if (!policy) throw new Error('Policy fixture was not created.');
    store.getState().actions.clearDue({ kind: 'policy', id: policy.id }, 'policy:0', 450);
    const data = store.getState().data;

    expect(policySchedule(data.policies[0] ?? policy, '2026-11-04').summary.nextDue?.dueDate)
      .toBe('2026-12-07');
    expect(policySummary(data, '2026-11-04').nextRenewal?.date).toBe('2026-12-07');
    expect(pendingItems(data, '2026-11', '2026-11-04').some((item) =>
      item.source.kind === 'policy' && item.source.parentId === policy.id,
    )).toBe(false);
    expect(pendingItems(data, '2026-12', '2026-11-04')).toContainEqual(expect.objectContaining({
      dueDate: '2026-12-07',
      source: expect.objectContaining({ kind: 'policy', parentId: policy.id }),
    }));
    expect(data.transactions).toContainEqual(expect.objectContaining({
      date: '2026-11-04',
      amount: 450,
      source: expect.objectContaining({ kind: 'policy-payment', parentId: policy.id }),
    }));
    expect(budgetLineActual(data, '2026-11', 'Health premium')).toBe(450);
    expect(budgetMonthView(data, '2026-11', '2026-11-04').lines).toContainEqual(expect.objectContaining({
      category: 'Health premium',
      planned: 500,
      actual: 450,
    }));
    expect(budgetMonthView(data, '2026-12', '2026-11-04').lines).toContainEqual(expect.objectContaining({
      category: 'Health premium',
      planned: 500,
      actual: 0,
    }));
    expect(linkedRecurringForMonth(data, '2026-11', '2026-11-04')).toContainEqual(expect.objectContaining({
      kind: 'policy',
      dueDate: '2026-11-07',
      status: 'paid',
    }));
    expect(linkedRecurringForMonth(data, '2026-12', '2026-11-04')).toContainEqual(expect.objectContaining({
      kind: 'policy',
      dueDate: '2026-12-07',
      status: 'upcoming',
    }));
    expect(upcomingDue(data, '2026-11-04')).toContainEqual(expect.objectContaining({
      kind: 'policy',
      parentId: policy.id,
      row: expect.objectContaining({ dueDate: '2026-12-07', status: 'upcoming' }),
    }));
    const reminders = planReminders(data, {
      enabled: true,
      dayBefore: true,
      sameDay: true,
      localTime: '09:00',
      showAmounts: false,
      hidePreviews: false,
    }, new Date(2026, 11, 6, 8), 20);
    expect(reminders).toContainEqual(expect.objectContaining({
      target: { dueItemId: `due:policy:${policy.id}:policy:1`, dueDate: '2026-12-07' },
      kind: 'day-before',
      fireAt: '2026-12-06T09:00',
    }));
  });

  it('settles a premium dated across the following month boundary', async () => {
    let sequence = 0;
    const store = makeStore(new MemoryStorage(), {
      newId: () => `boundary-${++sequence}`,
      today: () => '2026-12-01',
      isDev: false,
    });
    await waitForHydration(store);
    store.getState().actions.addPolicy({
      name: 'Month boundary cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 500,
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2027-12-31',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-11-30',
      currentValue: null,
      valueAsOf: null,
    });
    const policy = store.getState().data.policies[0];
    if (!policy) throw new Error('Policy fixture was not created.');
    store.getState().actions.clearDue({ kind: 'policy', id: policy.id }, 'policy:0', 500);
    const updated = store.getState().data.policies[0];
    expect(updated?.payments.at(-1)).toMatchObject({
      date: '2026-12-01',
      dueDate: '2026-11-30',
    });
    expect(policySchedule(updated ?? policy, '2026-12-01').summary.nextDue?.dueDate)
      .toBe('2026-12-30');
    expect(pendingItems(store.getState().data, '2026-11', '2026-12-01').some((item) =>
      item.source.kind === 'policy' && item.source.parentId === policy.id,
    )).toBe(false);
    expect(pendingItems(store.getState().data, '2026-12', '2026-12-01')).toContainEqual(
      expect.objectContaining({ dueDate: '2026-12-30' }),
    );
  });

  it('settles the due selected by Insurance, Home, Transactions, payment-confirm and reminder entry points', async () => {
    const entryPoints = ['Insurance', 'Home', 'Transactions', 'payment-confirm', 'reminder'] as const;
    for (const entryPoint of entryPoints) {
      let sequence = 0;
      const storage = new MemoryStorage();
      const store = makeStore(storage, {
        newId: () => `${entryPoint}-${++sequence}`,
        today: () => '2026-11-04',
        isDev: false,
      });
      await waitForHydration(store);
      store.getState().actions.addPolicy({
        name: `${entryPoint} cover`,
        insurer: 'Insurer',
        kind: 'health',
        premium: 500,
        frequency: 'monthly',
        startDate: '2026-01-01',
        endDate: '2027-12-31',
        status: 'active',
        premiumYears: 5,
        trackFrom: '2026-11-07',
        currentValue: null,
        valueAsOf: null,
      });
      const policy = store.getState().data.policies[0];
      if (!policy) throw new Error('Policy fixture was not created.');
      const data = store.getState().data;
      const monthItems = pendingItems(data, '2026-11', '2026-11-04');
      const policyDue = monthItems.find((item) =>
        item.source.kind === 'policy' && item.source.parentId === policy.id,
      );
      if (!policyDue || policyDue.source.kind !== 'policy') {
        throw new Error(`${entryPoint} selector did not produce the policy due.`);
      }
      const reminder = planReminders(data, {
        enabled: true,
        dayBefore: true,
        sameDay: true,
        localTime: '09:00',
        showAmounts: false,
        hidePreviews: false,
      }, new Date(2026, 10, 4, 8), 20).find((item) =>
        item.target.dueItemId === policyDue.id,
      );
      let selectedSlotId: string | undefined;
      if (entryPoint === 'Insurance') {
        selectedSlotId = policySchedule(policy, '2026-11-04').summary.nextDue?.id;
      } else if (entryPoint === 'Home') {
        selectedSlotId = upcomingDue(data, '2026-11-04').find((item) =>
          item.kind === 'policy' && item.parentId === policy.id,
        )?.row.id;
      } else {
        const selectedDueItemId = entryPoint === 'reminder'
          ? reminder?.target.dueItemId
          : policyDue.id;
        const selectedItem = monthItems.find((item) => item.id === selectedDueItemId);
        if (selectedItem?.source.kind === 'policy') selectedSlotId = selectedItem.source.slotId;
      }
      if (!selectedSlotId) throw new Error(`${entryPoint} selector did not provide a slot identity.`);
      const writes = storage.setItemCalls;
      store.getState().actions.clearDue({ kind: 'policy', id: policy.id }, selectedSlotId, 500);
      expect(storage.setItemCalls - writes).toBe(1);
      expect(store.getState().data.policies[0]?.payments.at(-1)).toMatchObject({
        date: '2026-11-04',
        dueDate: '2026-11-07',
        amount: 500,
      });
      expect(policySchedule(store.getState().data.policies[0] ?? policy, '2026-11-04')
        .summary.nextDue?.dueDate).toBe('2026-12-07');
    }
  });

  it('does not publish Undo or writes for unchanged or missing policies', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage);
    await waitForHydration(store);
    useUIStore.getState().setActionToast(null);
    const actions = store.getState().actions;
    const before = store.getState().data;

    actions.deletePolicy('missing-policy');
    expect(store.getState().data).toEqual(before);
    expect(useUIStore.getState().actionToast).toBeNull();

    actions.updatePolicy('missing-policy', { name: 'Missing' });
    expect(store.getState().data).toEqual(before);
    expect(useUIStore.getState().actionToast).toBeNull();

    store.setState({ status: 'loading' });
    const replacement = await actions.replaceAllData(before);
    expect(replacement).toEqual({
      ok: false,
      message: 'Data can only be replaced after the app has loaded.',
    });
    expect(store.getState().data).toEqual(before);

    store.setState({ status: 'ready' });
    const invalid = await actions.replaceAllData(JSON.parse('{}'));
    expect(invalid.ok).toBe(false);
    expect(store.getState().data).toEqual(before);

    storage.values.delete('wealthwise.app.v1.preimport');
    const undo = await actions.undoImport();
    expect(undo.ok).toBe(false);
  });

  it('persists policy add and delete atomically and Undo restores deep-equal data', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: () => 'created-policy' });
    await waitForHydration(store);
    useUIStore.getState().setActionToast(null);
    const actions = store.getState().actions;
    let writes = storage.setItemCalls;
    actions.addPolicy({
      name: 'Policy',
      insurer: 'Insurer',
      kind: 'health',
      premium: 100,
      frequency: 'monthly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-01-01',
      currentValue: null,
      valueAsOf: null,
    });
    expect(storage.setItemCalls - writes).toBe(1);
    const created = store.getState().data.policies.find((policy) => policy.id === 'created-policy');
    if (!created) throw new Error('Policy was not created.');
    const beforeDelete = store.getState().data;
    writes = storage.setItemCalls;
    actions.deletePolicy(created.id);
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data.policies).toEqual([]);
    const deleteUndo = useUIStore.getState().actionToast?.onAction;
    if (!deleteUndo) throw new Error('Policy deletion Undo was not set.');
    writes = storage.setItemCalls;
    deleteUndo();
    expect(storage.setItemCalls - writes).toBe(1);
    expect(store.getState().data).toEqual(beforeDelete);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    useUIStore.getState().setActionToast(null);
  });

  it('records a manual policy premium and linked transaction in one persisted write', async () => {
    let sequence = 0;
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: () => `policy-payment-${++sequence}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addPolicy({
      name: 'Health cover',
      insurer: 'Insurer',
      kind: 'health',
      premium: 100,
      frequency: 'monthly',
      startDate: '2026-01-01',
      status: 'active',
      premiumYears: 5,
      trackFrom: '2026-01-01',
      currentValue: null,
      valueAsOf: null,
    });
    const policy = store.getState().data.policies.find((item) => item.id === 'policy-payment-1');
    if (!policy) throw new Error('Policy fixture was not created.');
    const before = storage.setItemCalls;

    actions.addPolicyPayment(policy.id, {
      date: '2026-10-10',
      amount: 125,
      note: 'Paid at renewal',
    });

    expect(storage.setItemCalls - before).toBe(1);
    const entry = store.getState().data.policies.find((item) => item.id === policy.id)?.payments[0];
    expect(entry).toMatchObject({ id: 'policy-payment-2', date: '2026-10-10', amount: 125 });
    const transaction = store.getState().data.transactions.find((item) =>
      item.source?.kind === 'policy-payment' && item.source.entryId === 'policy-payment-2',
    );
    expect(transaction).toMatchObject({
      type: 'expense',
      amount: 125,
      category: 'Health premium',
      note: 'Paid at renewal',
      source: { kind: 'policy-payment', parentId: policy.id, entryId: 'policy-payment-2' },
    });
    expect(validateIntegrity(store.getState().data)).toEqual([]);
  });

  it('hydrates v10 policy data, archives the exact original bytes once, and never recopies them', async () => {
    const storage = new MemoryStorage();
    const originalData = makeV10Fixture();
    const originalBytes = JSON.stringify({ state: { data: originalData }, version: 10 });
    storage.values.set('wealthwise.app.v1', originalBytes);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data.policies[0]).toMatchObject({
      kind: 'life-savings',
      status: 'active',
      sumAssured: 500_000,
      endDate: '2042-01-15',
    });

    const archiveKey = 'wealthwise.app.v1.premigration.v10';
    expect(storage.values.get(archiveKey)).toBe(originalBytes);
    const archiveWrites = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
    expect(archiveWrites).toBe(1);

    const second = makeStore(storage);
    await waitForHydration(second);
    expect(storage.values.get(archiveKey)).toBe(originalBytes);
    expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(archiveWrites);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has(archiveKey)).toBe(false);
  });

  it('hydrates v11 data, removes cover goals and archives its raw bytes once', async () => {
    const storage = new MemoryStorage();
    const originalData = makeV11Fixture();
    const originalBytes = JSON.stringify({ state: { data: originalData }, version: 11 });
    storage.values.set('wealthwise.app.v1', originalBytes);
    const first = makeStore(storage);
    await waitForHydration(first);
    expect(first.getState().data).not.toHaveProperty('coverGoals');
    const archiveKey = 'wealthwise.app.v1.premigration.v11';
    expect(storage.values.get(archiveKey)).toBe(originalBytes);
    const writes = storage.calls.filter((call) => call === `set:${archiveKey}`).length;
    expect(writes).toBe(1);

    const second = makeStore(storage);
    await waitForHydration(second);
    expect(storage.values.get(archiveKey)).toBe(originalBytes);
    expect(storage.calls.filter((call) => call === `set:${archiveKey}`)).toHaveLength(writes);
    await second.getState().actions.eraseAllData();
    expect(storage.values.has(archiveKey)).toBe(false);
  });

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
      { id: 'migrated-1', name: 'Salary', category: 'Salary', amount: 12_000, day: 1, frequency: 'monthly' },
    ]);
    expect(first.getState().data.monthBudgets?.[0]?.incomes).toEqual([
      { id: 'migrated-2', name: 'Income', category: 'Salary', amount: 10_000, frequency: 'monthly' },
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
    const raw = JSON.stringify({ state: { data }, version: 13 });
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
    const raw = JSON.stringify({ state: { data }, version: 13 });
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
        incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000, day: 1, frequency: 'monthly' }],
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
      incomes: [{ id: 'salary', name: 'Salary', category: 'Salary', amount: 10_000, day: 1, frequency: 'monthly' }],
      sections: defaultBudgetSections(),
      items: [{
        id: 'unused', sectionId: 'survival', name: 'Food', mode: 'amount', value: 1_000, frequency: 'monthly',
      }],
      linkedIncluded: true,
    }]);
    expect(storage.values.get('wealthwise.app.v1.premigration.v9')).toBe(rawV9);
    expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1')).toHaveLength(1);
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
    let newId = 0;
    const store = makeStore(storage, { today: () => today, newId: () => `managed-${++newId}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const runOnce = (action: () => void) => {
      const writesBefore = storage.calls.filter((call) => call === 'set:wealthwise.app.v1').length;
      action();
      expect(store.getState().lastError).toBeNull();
      expect(storage.calls.filter((call) => call === 'set:wealthwise.app.v1').length - writesBefore).toBe(1);
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
    const beforeIncomeEdit = store.getState().data;
    runOnce(() => actions.editBudgetIncome(month, 'salary', {
      name: 'Contract work',
      category: 'Freelance',
      amount: 1_250,
      day: 18,
    }, 'following', today));
    expect(store.getState().data.budgetPlan?.incomes)
      .toContainEqual(expect.objectContaining({ name: 'Contract work', category: 'Freelance', amount: 1_250 }));
    expect(store.getState().data.monthBudgets?.[0]?.incomes)
      .toContainEqual(expect.objectContaining({ name: 'Contract work', category: 'Freelance', amount: 1_250 }));
    runOnce(() => actions.restoreBudgetPlanAndMonth(
      beforeIncomeEdit.budgetPlan,
      month,
      beforeIncomeEdit.monthBudgets?.find((budget) => budget.month === month) ?? null,
    ));
    expect(store.getState().data).toEqual(beforeIncomeEdit);
    runOnce(() => actions.addBudgetItem(month, {
      sectionId: addedSection.id, name: 'Pet care', mode: 'amount', value: 100,
      frequency: 'quarterly', firstDueMonth: month,
    }, 'month', today));
    const addedItem = store.getState().data.monthBudgets?.[0]?.items.find((item) => item.name === 'Pet care');
    if (!addedItem) throw new Error('Added budget item missing.');
    expect(addedItem).toMatchObject({ frequency: 'quarterly', firstDueMonth: month });
    runOnce(() => actions.editBudgetStructureItem(month, addedItem.id, { value: 200 }, 'month', today));
    const beforeDeleteItem = store.getState().data;
    runOnce(() => actions.deleteBudgetStructureItem(month, addedItem.id, 'month', today));
    runOnce(() => actions.restoreBudgetPlanAndMonth(
      beforeDeleteItem.budgetPlan,
      month,
      beforeDeleteItem.monthBudgets?.find((budget) => budget.month === month) ?? null,
    ));
    expect(store.getState().data).toEqual(beforeDeleteItem);
    runOnce(() => actions.addBudgetItem(month, {
      sectionId: 'insurance', name: 'Insurance', mode: 'amount', value: 400, dueDay: 20,
    }, 'following', today));
    const insuranceItem = store.getState().data.monthBudgets?.[0]?.items
      .find((item) => item.sectionId === 'insurance');
    if (!insuranceItem) throw new Error('Added Insurance budget item missing.');
    runOnce(() => actions.editBudgetStructureItem(month, insuranceItem.id, { value: 500 }, 'month', today));
    const beforeInsuranceDelete = store.getState().data;
    runOnce(() => actions.deleteBudgetStructureItem(month, insuranceItem.id, 'month', today));
    runOnce(() => actions.restoreBudgetPlanAndMonth(
      beforeInsuranceDelete.budgetPlan,
      month,
      beforeInsuranceDelete.monthBudgets?.find((budget) => budget.month === month) ?? null,
    ));
    expect(store.getState().data).toEqual(beforeInsuranceDelete);
    const beforeSectionDelete = store.getState().data;
    runOnce(() => actions.deleteSection(month, addedSection.id, 'month', today));
    runOnce(() => actions.restoreBudgetPlanAndMonth(
      beforeSectionDelete.budgetPlan,
      month,
      beforeSectionDelete.monthBudgets?.find((budget) => budget.month === month) ?? null,
    ));
    expect(store.getState().data).toEqual(beforeSectionDelete);
  });

  it('reproduces recurrence through exact income-form store payloads and hydration', async () => {
    const storage = new MemoryStorage();
    const today = '2026-02-15';
    const month = '2026-02';
    let incomeId = 0;
    const store = makeStore(storage, {
      newId: () => `income-${++incomeId}`,
      today: () => today,
      isDev: false,
    });
    await waitForHydration(store);
    const actions = store.getState().actions;
    const assertPersisted = () => {
      const persisted = JSON.parse(storage.values.get('wealthwise.app.v1') ?? '{}') as {
        state?: { data?: AppData };
      };
      expect(persisted.state?.data).toEqual(store.getState().data);
    };
    const plan = budgetPlanFromLines([], {
      incomes: [],
      repeatMonthly: true,
      repeatFrom: month,
    });
    actions.saveBudgetPlan(plan);
    assertPersisted();
    actions.applyBudgetPlan(month);
    assertPersisted();

    const quarterlyPayload = {
      name: 'Quarterly contract',
      amount: 12_000,
      category: 'Freelance' as const,
      day: 5,
      frequency: 'quarterly' as const,
      firstDueMonth: '2026-03',
    };
    actions.addBudgetIncome(month, quarterlyPayload, 'following', today);
    assertPersisted();

    const halfYearlyEditPayload = {
      ...quarterlyPayload,
      amount: 13_000,
      frequency: 'half-yearly' as const,
      firstDueMonth: '2026-04',
    };
    const frozenMonthSnapshot = store.getState().data.monthBudgets?.[0];
    actions.editBudgetIncome(month, 'income-1', halfYearlyEditPayload, 'following', today);
    assertPersisted();
    expect(store.getState().data.monthBudgets?.[0]).toEqual(frozenMonthSnapshot);
    expect(store.getState().data.budgetPlan?.incomes).toContainEqual(expect.objectContaining({
      id: 'income-1',
      amount: 13_000,
      frequency: 'half-yearly',
      firstDueMonth: '2026-04',
    }));

    const yearlyPayload = {
      name: 'Annual contract',
      amount: 24_000,
      category: 'Other' as const,
      day: 5,
      frequency: 'yearly' as const,
      firstDueMonth: '2026-05',
    };
    actions.addBudgetIncome(month, yearlyPayload, 'month', today);
    assertPersisted();
    const monthOnlyEditPayload = {
      ...yearlyPayload,
      amount: 25_000,
      frequency: 'quarterly' as const,
      firstDueMonth: '2026-06',
    };
    actions.editBudgetIncome(month, 'income-2', monthOnlyEditPayload, 'month', today);
    assertPersisted();
    expect(store.getState().data.budgetPlan?.incomes).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'income-2' })]),
    );
    expect(store.getState().data.monthBudgets?.[0]?.incomes).toContainEqual(expect.objectContaining({
      id: 'income-2',
      amount: 25_000,
      frequency: 'quarterly',
      firstDueMonth: '2026-06',
    }));

    const afterEdits = store.getState().data;
    assertPersisted();
    const freshStore = makeStore(storage, { today: () => today, isDev: false });
    await waitForHydration(freshStore);
    expect(freshStore.getState().data).toEqual(afterEdits);
    const months = [
      '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08',
      '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02',
    ];
    const table = months.map((monthName) => ({
      month: monthName,
      planIncome: plannedIncomeOf({ incomes: afterEdits.budgetPlan?.incomes ?? [] }, monthName),
      budgetOverviewIncome: budgetOverview(afterEdits, monthName, today).stacked.income.planned,
    }));
    console.log('P29-AB-R1 store-form-payload after-fix table', JSON.stringify(table, null, 2));
    expect(table.map((row) => row.budgetOverviewIncome)).toEqual(
      table.map((row) => row.planIncome),
    );
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

  it('P29-AA store reproduction: EF links use existing holdings and plan deletion leaves no dangling bucket link', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: (() => {
      let sequence = 0;
      return () => `p29-aa-${++sequence}`;
    })(), today: () => '2026-11-06' });
    await waitForHydration(store);
    const actions = store.getState().actions;

    actions.addHolding({ name: 'Manual Cash', type: 'Cash', invested: 1_000, value: 1_000 });
    actions.addHolding({ name: 'Manual Savings', type: 'Savings account', invested: 2_000, value: 2_000 });
    actions.addHolding({ name: 'Manual Fixed', type: 'Fixed deposit', invested: 3_000, value: 3_000 });
    actions.addPlan({
      name: 'Recurring plan',
      type: 'Recurring deposit',
      frequency: 'monthly',
      amount: 500,
      ratePct: 0,
      stepUpPct: 0,
      tenureYears: 1,
      startDate: '2026-01-01',
      trackFrom: '2026-01-01',
      opening: 500,
      actualValue: null,
      actualValueDate: null,
    });

    const report: string[] = [];
    for (const holding of store.getState().data.holdings) {
      actions.setEfBucketLinks('cash', [holding.id]);
      report.push(`${holding.kind}:${holding.type}:${holding.name}:${store.getState().lastError ?? 'linked'}`);
      actions.setEfBucketLinks('cash', []);
    }

    const plan = store.getState().data.holdings.find((holding) => holding.kind === 'plan');
    if (!plan) throw new Error('Expected the recurring plan reproduction holding.');
    actions.setEfBucketLinks('bank', [plan.id]);
    expect(store.getState().lastError).toBeNull();
    actions.deletePlan(plan.id, { linkedTransactions: 'delete' });

    // Replaced assertion target: dangling plan links must be removed in the same delete write.
    expect(store.getState().data.efBucketLinks.bank ?? []).toEqual([]);
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

  it('clears an actual due amount and undoes it with one persisted write per action', async () => {
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
    const beforeClear = structuredClone(store.getState().data);
    const firstPending = pendingItems(store.getState().data, '2026-08', '2026-10-10')
      .find((item) => item.source.kind === 'plan');
    if (!firstPending || firstPending.source.kind !== 'plan') throw new Error('Expected a plan due.');
    const entryId = actions.clearDue(
      { kind: 'plan', id: 'past-plan' },
      firstPending.source.slotId,
      75,
    );
    expect(entryId).toBe('due-1');
    expect(storage.setItemCalls - writesBefore).toBe(1);
    const afterClear = store.getState().data;
    const updatedHolding = afterClear.holdings.find((holding) => holding.id === 'past-plan');
    if (!updatedHolding || updatedHolding.kind !== 'plan') throw new Error('Updated plan missing.');
    expect(updatedHolding.logs[0]?.amount).toBe(75);
    expect(afterClear.transactions.at(-1)?.amount).toBe(75);
    expect(validateIntegrity(store.getState().data)).toEqual([]);

    if (!entryId) throw new Error('Expected the cleared due entry ID.');
    writesBefore = storage.setItemCalls;
    actions.undoClearDue({ kind: 'plan', id: 'past-plan' }, entryId);
    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(store.getState().data).toEqual(beforeClear);

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
      status: 'active',
      premiumYears: 1,
      trackFrom: '2026-08-10',
      currentValue: null,
      valueAsOf: null,
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

  it('updates configured value and price snapshots in one persisted store action', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, {
      newId: () => `valuation-${++id}`,
      today: () => '2025-04-01',
    });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addHolding({
      name: 'Priced gold',
      type: 'Gold',
      invested: 0,
      value: 0,
      valuationMethod: 'unitsPrice',
      latestPrice: 50,
      priceAsOf: '2025-01-01',
    });
    const holding = store.getState().data.holdings.at(-1);
    if (!holding) throw new Error('Configured holding was not created.');
    const performOnce = (action: () => void) => {
      const before = storage.setItemCalls;
      action();
      expect(storage.setItemCalls - before).toBe(1);
      expect(store.getState().lastError).toBeNull();
    };
    performOnce(() => actions.addInvestmentEntry(holding.id, {
      date: '2025-01-01',
      amount: 5_000,
      kind: 'Deposit',
      note: '',
      price: 50,
    }));
    expect(store.getState().data.holdings.find((item) => item.id === holding.id)?.logs[0]?.price).toBe(50);
    performOnce(() => actions.updateHoldingPrice(holding.id, 53.2, '2025-04-01'));
    expect(holdingValue(store.getState().data.holdings.find((item) => item.id === holding.id)!, '2025-04-01'))
      .toBe(5_320);
    performOnce(() => actions.updateHoldingValue(holding.id, 5_400, '2025-04-01', 'manual'));
    const updated = store.getState().data.holdings.find((item) => item.id === holding.id);
    if (updated?.kind !== 'manual') throw new Error('Updated holding is missing.');
    expect(updated).toMatchObject({
      value: 5_400,
      valueAsOf: '2025-04-01',
      valuationMethod: 'manual',
    });
  });

  it('creates and undoes a linked manual investment deposit in one persisted write each', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-10-12'),
      holdings: [{
        id: 'manual-cash',
        kind: 'manual' as const,
        name: 'Cash reserve',
        type: 'Cash' as const,
        invested: 30_000,
        value: 30_000,
        valueAsOf: '2026-10-10',
        logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'invest', name: 'Investments', type: 'invest' as const }],
        incomes: [],
        repeatMonthly: true,
        repeatFrom: '2026-10',
        items: [{
          id: 'cash-budget',
          sectionId: 'invest',
          name: 'Emergency cash',
          mode: 'amount' as const,
          value: 125,
          frequency: 'monthly' as const,
          firstDueMonth: '2026-10',
          holdingId: 'manual-cash',
        }],
      },
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: initial }, version: 14,
    }));
    let id = 0;
    const store = makeStore(storage, {
      newId: () => `linked-deposit-${++id}`,
      today: () => '2026-10-12',
    });
    await waitForHydration(store);
    const before = store.getState().data;
    const writesBefore = storage.setItemCalls;

    store.getState().actions.addInvestmentEntry('manual-cash', {
      date: '2026-10-12',
      amount: 125,
      kind: 'Deposit',
      note: 'Emergency cash',
    });

    expect(storage.setItemCalls - writesBefore).toBe(1);
    const holding = store.getState().data.holdings[0];
    if (holding?.kind !== 'manual') throw new Error('Manual linked holding is missing.');
    const entry = holding.logs[0];
    if (!entry) throw new Error('Manual linked deposit was not created.');
    expect(entry).toMatchObject({ date: '2026-10-12', amount: 125, kind: 'Deposit' });
    expect(store.getState().data.transactions).toContainEqual(expect.objectContaining({
      type: 'invest',
      amount: 125,
      date: '2026-10-12',
      source: { kind: 'holding-entry', parentId: 'manual-cash', entryId: entry.id },
    }));

    const writesBeforeUndo = storage.setItemCalls;
    store.getState().actions.deleteInvestmentEntry('manual-cash', entry.id);
    expect(storage.setItemCalls - writesBeforeUndo).toBe(1);
    expect(store.getState().data).toEqual(before);
  });

  it.each(['Savings account', 'Cash', 'Other'] as const)(
    'reproduces a generic paid Budget transaction without a manual %s entry',
    async (holdingType) => {
      const storage = new MemoryStorage();
      const snapshot = monthBudgetFromLines('2026-09', [{
        category: 'Emergency savings',
        planned: 5_000,
        dueDay: 10,
      }], {
        incomes: [],
        sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
      });
      const snapshotItem = snapshot.items[0];
      if (!snapshotItem) throw new Error('Savings snapshot fixture is missing.');
      snapshot.items = [{
        ...snapshotItem,
        sectionId: 'savings',
        holdingId: 'manual-savings',
      }];
      const initial = {
        ...emptyAppData('2026-10-12'),
        holdings: [{
          id: 'manual-savings',
          kind: 'manual' as const,
          name: 'Savings reserve',
          type: holdingType,
          invested: 10_000,
          value: 10_000,
          valueAsOf: '2026-09-01',
          logs: [],
        }],
        monthBudgets: [snapshot],
      };
      storage.values.set('wealthwise.app.v1', JSON.stringify({
        state: { data: initial }, version: 14,
      }));
      const store = makeStore(storage, {
        newId: (() => {
          let id = 0;
          return () => `generic-savings-${++id}`;
        })(),
        today: () => '2026-10-12',
        isDev: false,
      });
      await waitForHydration(store);
      const writesBefore = storage.setItemCalls;

      store.getState().actions.addTransaction({
        type: 'invest',
        amount: 5_000,
        category: 'Emergency savings',
        note: '',
        date: '2026-09-10',
      });

      const data = store.getState().data;
      const holding = data.holdings[0];
      if (holding?.kind !== 'manual') throw new Error('Savings holding fixture is missing.');
      const budgetLine = budgetMonthView(data, '2026-09').lines.find((line) =>
        line.category === 'Emergency savings');
      expect(data.transactions).toHaveLength(1);
      expect(holding.logs).toHaveLength(0);
      expect(storage.setItemCalls - writesBefore).toBe(1);
      expect(budgetLine).toMatchObject({ planned: 5_000, actual: 5_000, remaining: 0 });
      expect(pendingItems(data, '2026-09', '2026-10-12').some((item) =>
        item.category === 'Emergency savings')).toBe(false);
      expect(holdingInvested(holding)).toBe(10_000);
      expect(holdingValue(holding, '2026-10-12')).toBe(10_000);
    },
  );

  it.each(
    (['Savings account', 'Cash', 'Other'] as const).flatMap((type) => [
      { type, label: 'exact', amount: 5_000 },
      { type, label: 'lower', amount: 3_500 },
      { type, label: 'higher', amount: 6_500 },
    ]),
  )('clears and exactly undoes a linked one-time $type deposit at the $label amount', async ({ type, amount }) => {
    const storage = new MemoryStorage();
    const snapshot = monthBudgetFromLines('2026-09', [{
      category: 'Emergency savings',
      planned: 5_000,
      dueDay: 10,
    }], {
      incomes: [],
      sections: [{ id: 'savings', name: 'Savings', type: 'invest' }],
    });
    const snapshotItem = snapshot.items[0];
    if (!snapshotItem) throw new Error('Savings snapshot fixture is missing.');
    snapshot.items = [{
      ...snapshotItem,
      sectionId: 'savings',
      holdingId: 'manual-savings',
    }];
    const initial = {
      ...emptyAppData('2026-09-10'),
      holdings: [{
        id: 'manual-savings',
        kind: 'manual' as const,
        name: 'Savings reserve',
        type,
        invested: 10_000,
        value: 10_000,
        valueAsOf: '2026-09-01',
        logs: [],
      }],
      monthBudgets: [snapshot],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: initial }, version: 14,
    }));
    let id = 0;
    const store = makeStore(storage, {
      newId: () => `linked-savings-${++id}`,
      today: () => '2026-09-10',
      isDev: false,
    });
    await waitForHydration(store);
    const before = store.getState().data;
    const target = { kind: 'holding' as const, id: 'manual-savings' };
    const writesBefore = storage.setItemCalls;

    const entryId = store.getState().actions.clearDue(target, undefined, amount, 'Emergency savings');

    expect(store.getState().lastError).toBeNull();
    expect(entryId).toBe('linked-savings-1');
    expect(storage.setItemCalls - writesBefore).toBe(1);
    const data = store.getState().data;
    const holding = data.holdings[0];
    if (holding?.kind !== 'manual') throw new Error('Manual savings holding is missing.');
    const entry = holding.logs[0];
    expect(entry).toMatchObject({
      id: entryId,
      date: '2026-09-10',
      amount,
      kind: 'Deposit',
      note: 'Emergency savings',
    });
    expect(data.transactions).toEqual([expect.objectContaining({
      type: 'invest',
      amount,
      category: 'Other investments',
      source: { kind: 'holding-entry', parentId: holding.id, entryId },
    })]);
    expect(holdingInvested(holding)).toBe(10_000 + amount);
    expect(holdingValue(holding, '2026-09-10')).toBe(10_000 + amount);
    expect(budgetMonthView(data, '2026-09').lines.find((line) =>
      line.category === 'Emergency savings')).toMatchObject({
      planned: 5_000,
      actual: amount,
      remaining: 5_000 - amount,
    });

    const writesBeforeUndo = storage.setItemCalls;
    store.getState().actions.undoClearDue(target, entryId ?? '');
    expect(store.getState().lastError).toBeNull();
    expect(storage.setItemCalls - writesBeforeUndo).toBe(1);
    expect(store.getState().data).toEqual(before);
  });

  it('unlinks budget items when a holding is deleted in one persisted write', async () => {
    const storage = new MemoryStorage();
    const initial = {
      ...emptyAppData('2026-10-12'),
      holdings: [{
        id: 'manual-cash',
        kind: 'manual' as const,
        name: 'Cash reserve',
        type: 'Cash' as const,
        invested: 30_000,
        value: 30_000,
        valueAsOf: '2026-10-10',
        logs: [],
      }],
      budgetPlan: {
        sections: [{ id: 'invest', name: 'Investments', type: 'invest' as const }],
        incomes: [],
        repeatMonthly: true,
        repeatFrom: '2026-10',
        items: [{
          id: 'cash-budget',
          sectionId: 'invest',
          name: 'Emergency cash',
          mode: 'amount' as const,
          value: 125,
          frequency: 'monthly' as const,
          firstDueMonth: '2026-10',
          holdingId: 'manual-cash',
        }],
      },
      monthBudgets: [{
        month: '2026-10',
        source: 'custom' as const,
        linkedIncluded: false,
        incomes: [],
        sections: [{ id: 'invest', name: 'Investments', type: 'invest' as const }],
        items: [{
          id: 'cash-snapshot',
          sectionId: 'invest',
          name: 'Emergency cash',
          mode: 'amount' as const,
          value: 125,
          frequency: 'monthly' as const,
          firstDueMonth: '2026-10',
          holdingId: 'manual-cash',
        }],
      }],
    };
    storage.values.set('wealthwise.app.v1', JSON.stringify({
      state: { data: initial }, version: 14,
    }));
    const store = makeStore(storage);
    await waitForHydration(store);
    const writesBefore = storage.setItemCalls;

    store.getState().actions.deleteHolding('manual-cash', { linkedTransactions: 'keep' });

    expect(storage.setItemCalls - writesBefore).toBe(1);
    expect(store.getState().data.holdings).toEqual([]);
    expect(store.getState().data.budgetPlan?.items[0]?.holdingId).toBeUndefined();
    expect(store.getState().data.monthBudgets?.[0]?.items[0]?.holdingId).toBeUndefined();
    expect(validateIntegrity(store.getState().data)).toEqual([]);
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
    const legacyManual = first.getState().data.holdings.find((holding) => holding.id === 'legacy-manual');
    if (!legacyManual || legacyManual.kind !== 'manual') throw new Error('Expected v1 manual holding');
    const planValueBeforeMigration = holdingValue({
      ...legacyPlan,
      logs: legacyPlan.logs.map((log) => ({ ...log, kind: 'Deposit' as const })),
    }, '2026-09-03');
    expect(holdingValue(legacyManual, '2026-09-03')).toBe(900);
    expect(migratedTotals.liabilities).toBe(8_000);
    expect(migratedTotals.assets).toBe(900 + 500 + planValueBeforeMigration);
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

    it('imports an encrypted v1 backup through v13 migration and preserves Undo', async () => {
      const oldData = makeV1Fixture();
      const passphrase = 'a sufficiently long passphrase';
      const plainText = JSON.stringify({
        app: 'wealthwise',
        formatVersion: 1,
        schemaVersion: 1,
        exportedAt: '2026-10-10T10:00:00.000Z',
        checksum: { algorithm: 'sha256', value: await sha256(canonicalJson(oldData)) },
        data: oldData,
      });
      const encrypted = await encryptBackup(plainText, passphrase, {
        salt: Uint8Array.from({ length: 16 }, (_, index) => index),
        nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 16),
        kdf: { name: 'scrypt', params: { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } },
      });
      const decrypted = await decryptBackup(encrypted, passphrase);
      let generatedId = 0;
      const parsed = await parseBackup(decrypted, {
        digest: sha256,
        today: '2026-10-10',
        newId: () => `encrypted-migration-${++generatedId}`,
      });
      if (!parsed.ok) throw new Error(`${parsed.reason}: ${parsed.message}`);
      expect(parsed.data.liabilities[0]).toMatchObject({ kind: 'recurring', type: 'Other' });

      const storage = new MemoryStorage();
      const store = makeStore(storage);
      await waitForHydration(store);
      store.getState().actions.addTransaction({
        type: 'income', amount: 900, category: 'Other', note: 'Original data', date: '2026-10-10',
      });
      const original = store.getState().data;
      await expect(store.getState().actions.replaceAllData(parsed.data)).resolves.toEqual({ ok: true });
      expect(store.getState().data).toEqual(parsed.data);
      expect(storage.values.get('wealthwise.app.v1.preimport')).toContain('"Original data"');
      expect([...storage.values.values()].join('\n')).not.toContain(passphrase);
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

  it('loads a complete 50-year stress fixture through replace-all and restores the previous data with Undo', async () => {
    const storage = new MemoryStorage();
    let id = 0;
    const store = makeStore(storage, { isDev: true, newId: () => `stress-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().devActions;
    if (!actions) throw new Error('Developer stress action is unavailable.');
    const original = store.getState().data;
    const writesBefore = storage.setItemCalls;

    const result = await actions.loadStressData(50);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.loadMs).toBeGreaterThanOrEqual(0);
    expect(store.getState().data.transactions).toHaveLength(15_000);
    expect(store.getState().data.holdings).toHaveLength(12);
    expect(store.getState().data.monthBudgets).toHaveLength(600);
    expect(store.getState().undoImport).toEqual({ savedAt: '2026-10-10' });
    expect(storage.setItemCalls - writesBefore).toBe(2);
    await expect(store.getState().actions.undoImport()).resolves.toEqual({ ok: true });
    expect(store.getState().data).toEqual(original);
  });

  it('includes the persisted AppData write in stress-load timing', async () => {
    class DelayedStorage extends MemoryStorage {
      override async setItem(name: string, value: string): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 25));
        super.setItem(name, value);
      }
    }

    const storage = new DelayedStorage();
    let id = 0;
    const store = makeStore(storage, { isDev: true, newId: () => `timed-stress-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().devActions;
    if (!actions) throw new Error('Developer stress action is unavailable.');

    const startedAt = Date.now();
    const result = await actions.loadStressData(50);
    const elapsed = Date.now() - startedAt;

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.loadMs).toBeGreaterThanOrEqual(20);
    expect(elapsed).toBeGreaterThanOrEqual(20);
  });

  it('refuses to load an invalid generated stress fixture without replacing data', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage, { isDev: true, newId: () => '' });
    await waitForHydration(store);
    const original = store.getState().data;
    const writesBefore = storage.setItemCalls;
    const actions = store.getState().devActions;
    if (!actions) throw new Error('Developer stress action is unavailable.');

    await expect(actions.loadStressData(50)).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('Stress fixture validation failed'),
    });

    expect(store.getState().data).toBe(original);
    expect(storage.setItemCalls).toBe(writesBefore);
  });

  it('refuses stress fixtures with broken cross-entity links', async () => {
    const storage = new MemoryStorage();
    const store = makeStore(storage, { isDev: true, newId: () => 'duplicate-id' });
    await waitForHydration(store);
    const original = store.getState().data;
    const writesBefore = storage.setItemCalls;
    const actions = store.getState().devActions;
    if (!actions) throw new Error('Developer stress action is unavailable.');

    await expect(actions.loadStressData(50)).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('Stress fixture integrity failed'),
    });

    expect(store.getState().data).toBe(original);
    expect(storage.setItemCalls).toBe(writesBefore);
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

  it('runs the scheduled-deposit integration scenario with one write per action and rehydrates links', async () => {
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

  it('closes a recurring liability with one write and one Undo, removing all later dues', async () => {
    let id = 0;
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: () => `foreclosure-${++id}` });
    await waitForHydration(store);
    useUIStore.getState().setActionToast(null);
    const actions = store.getState().actions;
    actions.addLiability({
      kind: 'recurring',
      type: 'Other',
      name: 'Foreclosure loan',
      principal: 100_000,
      ratePct: 0,
      tenureMonths: 12,
      emi: 10_000,
      startDate: '2026-01-10',
    });
    const loanId = store.getState().data.liabilities[0]?.id;
    if (!loanId) throw new Error('Foreclosure loan was not created.');
    actions.addLiabilityPayment(loanId, {
      date: '2026-02-10',
      amount: 10_000,
      kind: 'EMI',
      note: '',
    });
    const before = store.getState().data;
    const loan = before.liabilities.find((entry) => entry.id === loanId);
    if (!loan || loan.kind !== 'recurring') throw new Error('Expected a recurring liability.');
    const outstanding = loanState(loan, '2026-03-10').balance;
    const writes = storage.setItemCalls;

    actions.closeLiabilityEarly(loanId, {
      date: '2026-03-10',
      amountPaid: outstanding + 250,
      note: 'Closed at lender',
      writeOffConfirmed: false,
    });

    expect(store.getState().lastError).toBeNull();
    expect(storage.setItemCalls - writes).toBe(1);
    const closedData = store.getState().data;
    const closed = closedData.liabilities.find((entry) => entry.id === loanId);
    if (!closed || closed.kind !== 'recurring' || !closed.closure) {
      throw new Error('Foreclosure did not set the closed state.');
    }
    expect(closed.closure).toMatchObject({ date: '2026-03-10', note: 'Closed at lender' });
    expect(closed.settlement).toEqual({ asOf: '2026-03-10', balance: 0 });
    expect(closed.payments).toHaveLength(2);
    expect(closed.payments.at(-1)).toMatchObject({ amount: outstanding, kind: 'Prepayment' });
    expect(closedData.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'expense',
        amount: outstanding,
        date: '2026-03-10',
        source: { kind: 'liability-payment', parentId: loanId, entryId: closed.closure.paymentId },
      }),
      expect.objectContaining({
        type: 'expense',
        amount: 250,
        date: '2026-03-10',
        category: 'Other',
        note: 'Loan closure charges',
        source: { kind: 'liability-closure-charge', parentId: loanId, entryId: closed.closure.chargeTransactionId },
      }),
    ]));
    const charge = closedData.transactions.find((transaction) =>
      transaction.source?.kind === 'liability-closure-charge');
    if (!charge?.source) throw new Error('Expected the closure charge source.');
    expect(describeSource(closedData, charge.source)).toEqual({
      label: 'Foreclosure loan',
      route: '/liability-payments',
      params: { id: loanId },
    });
    expect(describeSource(closedData, {
      kind: 'liability-closure-charge',
      parentId: loanId,
      entryId: 'missing-charge',
    })).toBeNull();
    expect(validateIntegrity({
      ...closedData,
      transactions: closedData.transactions.map((transaction) =>
        transaction.id === charge.id ? { ...transaction, category: 'Food' } : transaction),
    }).some((issue) => issue.code === 'linked-drift')).toBe(true);
    const deletedKeepingTransactions = deleteLiabilityData(closedData, loanId, { linkedTransactions: 'keep' });
    expect(deletedKeepingTransactions.liabilities.some((entry) => entry.id === loanId)).toBe(false);
    expect(deletedKeepingTransactions.transactions
      .filter((transaction) => transaction.source?.parentId === loanId)).toHaveLength(0);
    const deletedEverything = deleteLiabilityData(closedData, loanId, { linkedTransactions: 'delete' });
    expect(deletedEverything.transactions.some((transaction) =>
      transaction.source?.kind === 'liability-closure-charge')).toBe(false);
    expect(liabilitySchedule(closed, '2026-10-10').rows.every((row) => row.dueDate <= '2026-03-10')).toBe(true);
    expect(netWorth(closedData, '2026-10-10').liabilities).toBe(0);
    expect(liabilitiesOverview(closedData, '2026-10-10', 0).totalOutstanding).toBe(0);
    expect(pendingItems(closedData, '2026-10', '2026-10-10')
      .some((item) => item.source.kind === 'liability' && item.source.parentId === loanId)).toBe(false);
    expect(linkedRecurringForMonth(closedData, '2026-04', '2026-10-10')
      .some((row) => row.kind === 'liability' && row.parentId === loanId)).toBe(false);
    expect(planReminders(closedData, {
      enabled: true,
      localTime: '09:00',
      dayBefore: true,
      sameDay: true,
      showAmounts: true,
      hidePreviews: false,
    }, new Date('2026-04-01T00:00:00'), 100)
      .some((reminder) => reminder.dueItemId.startsWith(`due:liability:${loanId}:`))).toBe(false);
    expect(validateIntegrity(closedData)).toEqual([]);
    expect(useUIStore.getState().actionToast?.message).toBe('Loan closed early.');

    const undo = useUIStore.getState().actionToast?.onAction;
    if (!undo) throw new Error('Foreclosure Undo was not set.');
    undo();
    expect(store.getState().data).toEqual(before);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    useUIStore.getState().setActionToast(null);
  });

  it('requires explicit write-off confirmation for an underpaid closure', async () => {
    let id = 0;
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: () => `writeoff-${++id}` });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addLiability({
      kind: 'recurring',
      type: 'Other',
      name: 'Write-off loan',
      principal: 50_000,
      ratePct: 0,
      tenureMonths: 10,
      emi: 5_000,
      startDate: '2026-01-10',
    });
    const loanId = store.getState().data.liabilities[0]?.id;
    if (!loanId) throw new Error('Write-off loan was not created.');
    const before = store.getState().data;
    const writes = storage.setItemCalls;
    const outstanding = loanState(before.liabilities[0]!, '2026-03-10').balance;
    actions.closeLiabilityEarly(loanId, {
      date: '2026-03-10',
      amountPaid: outstanding - 100,
      note: '',
      writeOffConfirmed: false,
    });
    expect(store.getState().lastError).toContain('Confirm that the lender closed the loan for less');
    expect(store.getState().data).toEqual(before);
    expect(storage.setItemCalls).toBe(writes);

    actions.closeLiabilityEarly(loanId, {
      date: '2026-03-10',
      amountPaid: outstanding - 100,
      note: '',
      writeOffConfirmed: true,
    });
    expect(store.getState().lastError).toBeNull();
    expect(storage.setItemCalls - writes).toBe(1);
    const closed = store.getState().data.liabilities[0];
    if (!closed || closed.kind !== 'recurring') throw new Error('Expected a closed recurring liability.');
    expect(closed.closure).toMatchObject({
      date: '2026-03-10',
      note: 'Lender closed the loan for less',
    });
    expect(closed.payments.at(-1)?.amount).toBe(outstanding - 100);
    expect(store.getState().data.transactions.some((transaction) =>
      transaction.source?.kind === 'liability-closure-charge')).toBe(false);
    expect(validateIntegrity(store.getState().data)).toEqual([]);
    const closedLiability = store.getState().data.liabilities[0];
    if (!closedLiability || closedLiability.kind !== 'recurring') throw new Error('Expected the closed loan.');
    const closedPayment = closedLiability.payments.at(-1);
    if (!closedPayment) throw new Error('Expected the closing payment.');
    actions.addLiabilityPayment(loanId, {
      date: '2026-03-10', amount: 1, kind: 'Prepayment', note: '',
    });
    expect(store.getState().lastError).toContain('cannot be added to a closed liability');
    actions.updateLiabilityPayment(loanId, closedPayment.id, { amount: closedPayment.amount + 1 });
    expect(store.getState().lastError).toContain('cannot be edited on a closed liability');
    actions.deleteLiabilityPayment(loanId, closedPayment.id);
    expect(store.getState().lastError).toContain('cannot be deleted from a closed liability');
    actions.updateLiability(loanId, { closureNote: 'Updated closure note' });
    expect(store.getState().data.liabilities[0]).toMatchObject({
      closure: { note: 'Updated closure note' },
    });
    const closedData = store.getState().data;
    actions.updateLiability(loanId, { name: 'Must not change' });
    expect(store.getState().lastError).toContain('Only the closure note can be edited');
    expect(store.getState().data).toEqual(closedData);
  });

  it('rejects closure dates before the first payment and in the future without writing', async () => {
    let id = 0;
    const storage = new MemoryStorage();
    const store = makeStore(storage, { newId: () => `datecheck${++id}`, today: () => '2026-03-01' });
    await waitForHydration(store);
    const actions = store.getState().actions;
    actions.addLiability({
      kind: 'recurring',
      type: 'Other',
      name: 'Date check loan',
      principal: 50_000,
      ratePct: 0,
      tenureMonths: 10,
      emi: 5_000,
      startDate: '2026-01-10',
    });
    const loanId = store.getState().data.liabilities[0]?.id;
    if (!loanId) throw new Error('Date check loan was not created.');
    const before = store.getState().data;
    const writes = storage.setItemCalls;
    const input = { amountPaid: 50_000, note: '', writeOffConfirmed: false };
    actions.closeLiabilityEarly(loanId, { ...input, date: '2026-02-09' });
    expect(store.getState().lastError).toContain('before the first payment');
    expect(store.getState().data).toEqual(before);
    expect(storage.setItemCalls).toBe(writes);

    actions.closeLiabilityEarly(loanId, { ...input, date: '2026-03-02' });
    expect(store.getState().lastError).toContain('cannot be in the future');
    expect(store.getState().data).toEqual(before);
    expect(storage.setItemCalls).toBe(writes);
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
  storage.values.set('wealthwise.app.v1.premigration.v13', 'original-v13-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v14', 'original-v14-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v15', 'original-v15-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v16', 'original-v16-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v17', 'original-v17-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v18', 'original-v18-bytes');
  storage.values.set('wealthwise.app.v1.premigration.v19', 'original-v19-bytes');
  storage.values.set('wealthwise.app.v1.prerepair-efallocation', 'original-allocation-bytes');
  const reminderCalls: string[] = [];
  const store = makeStore(storage, {
    removeLockSettings: async () => { secureStore.delete('wealthwise.lock.v1'); },
    cancelReminders: async () => { reminderCalls.push('cancel'); },
  });
  await waitForHydration(store);
  store.getState().actions.addTransaction({
    type: 'expense', amount: 500, category: 'Food', note: 'Old', date: '2026-10-10',
  });
  storage.values.set('wealthwise.app.v1.corrupt.latest', 'bad');
  storage.values.set('wealthwise.app.v1.corrupt.previous', 'old bad');
  storage.values.set('wealthwise.meta.v1', '{"lastExportAt":"2026-10-10T00:00:00.000Z","remindersPromptHandled":true}');
  storage.values.set('wealthwise.app.v1.preimport', '{}');
  await expect(store.getState().actions.eraseAllData()).resolves.toEqual({ ok: true });
  expect(reminderCalls).toEqual(['cancel']);
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
    'wealthwise.app.v1.premigration.v13',
    'wealthwise.app.v1.premigration.v14',
    'wealthwise.app.v1.premigration.v15',
    'wealthwise.app.v1.premigration.v16',
    'wealthwise.app.v1.premigration.v17',
    'wealthwise.app.v1.premigration.v18',
    'wealthwise.app.v1.premigration.v19',
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
