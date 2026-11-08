import type { StateStorage } from 'zustand/middleware';

import { mockAppData } from '../../mock/data';
import { makeV1Fixture, makeV2Fixture, makeV4Fixture, makeV5Fixture, makeV6Fixture } from '../testFixtures/v1';
import { createSafeStorage } from '../safeStorage';
import { utf8ByteLength } from '../../lib/storageGuard';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  failWrites = false;
  setCalls: string[] = [];

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    this.setCalls.push(name);
    if (this.failWrites) throw new Error('disk full');
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

const blob = (data: unknown = mockAppData, version = 3) => JSON.stringify({ state: { data }, version });

function makeLegacyData(version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): unknown {
  if (version === 1) return makeV1Fixture();
  if (version === 4) return makeV4Fixture();
  if (version === 5) return makeV5Fixture();
  if (version === 6) return makeV6Fixture();
  if (version === 7) {
    const { budgetPlan: _budgetPlan, ...rest } = mockAppData;
    return {
      ...rest,
      budgetTemplates: [],
      defaultBudgetTemplateId: null,
      monthBudgets: [],
    };
  }
  if (version === 8) {
    const budgetPlan = mockAppData.budgetPlan
      ? {
        ...mockAppData.budgetPlan,
        plannedIncome: mockAppData.budgetPlan.incomes.reduce((total, income) => total + income.amount, 0),
        incomes: undefined,
      }
      : null;
    return {
      ...mockAppData,
      budgetPlan,
      monthBudgets: (mockAppData.monthBudgets ?? []).map((budget) => ({
        ...budget,
        plannedIncome: budget.incomes.reduce((total, income) => total + income.amount, 0),
        incomes: undefined,
      })),
    };
  }
  const v2 = makeV2Fixture();
  if (version === 2) return v2;
  return {
    ...v2,
    settings: { ...v2.settings, monthlySalary: null, onboarded: true },
  };
}

describe('createSafeStorage', () => {
  it('returns valid serialized data without creating a backup', async () => {
    const base = new MemoryStorage();
    const raw = blob();
    base.values.set('wealthwise.app.v1', raw);
    const onCorrupt = jest.fn();
    const safe = createSafeStorage(base, { onWriteError: jest.fn(), onCorrupt }, { blockWrites: () => false });
    await expect(safe.getItem('wealthwise.app.v1')).resolves.toBe(raw);
    expect(onCorrupt).not.toHaveBeenCalled();
    await expect(safe.getItem('absent')).resolves.toBeNull();
  });

  it.each([
    ['invalid-blob', JSON.stringify({ other: true }), 'corrupt'],
    ['invalid-json', '{not json', 'corrupt'],
    ['invalid-schema', blob({ transactions: [] }, 0), 'corrupt'],
    ['newer-version', blob(mockAppData, 10), 'newer-version'],
  ] as const)('backs up a %s blob and reports its reason', async (expectedReason, raw, callbackReason) => {
    const base = new MemoryStorage();
    base.values.set('wealthwise.app.v1', raw);
    const onCorrupt = jest.fn();
    const safe = createSafeStorage(base, { onWriteError: jest.fn(), onCorrupt }, { blockWrites: () => false });
    await expect(safe.getItem('wealthwise.app.v1')).resolves.toBeNull();
    const backup = [...base.values.entries()].find(([key]) => key.startsWith('wealthwise.app.v1.corrupt.'));
    if (expectedReason === 'newer-version') {
      expect(backup).toBeUndefined();
    } else {
      expect(backup?.[1]).toBe(raw);
    }
    expect(onCorrupt).toHaveBeenCalledWith(expect.objectContaining({
      name: 'wealthwise.app.v1',
      backupKey: backup?.[0] ?? 'wealthwise.app.v1.corrupt.latest',
      reason: expectedReason,
    }));
    expect(callbackReason).toBe(expectedReason === 'newer-version' ? 'newer-version' : 'corrupt');
  });

  it('keeps at most latest and previous corruption backups and avoids duplicate writes', async () => {
    const base = new MemoryStorage();
    const hooks = { onWriteError: jest.fn(), onCorrupt: jest.fn() };
    const safe = createSafeStorage(base, hooks, { blockWrites: () => false });
    const first = '{first corrupt blob';
    base.values.set('wealthwise.app.v1', first);

    await safe.getItem('wealthwise.app.v1');
    const writesAfterFirst = [...base.values.keys()].filter((key) => key.includes('.corrupt.'));
    await safe.getItem('wealthwise.app.v1');
    await safe.getItem('wealthwise.app.v1');
    expect([...base.values.keys()].filter((key) => key.includes('.corrupt.'))).toEqual(writesAfterFirst);
    expect(base.setCalls.filter((key) => key.includes('.corrupt.'))).toHaveLength(1);
    expect(base.values.get('wealthwise.app.v1.corrupt.latest')).toBe(first);

    const second = '{second corrupt blob';
    base.values.set('wealthwise.app.v1', second);
    await safe.getItem('wealthwise.app.v1');
    expect(base.values.get('wealthwise.app.v1.corrupt.latest')).toBe(second);
    expect(base.values.get('wealthwise.app.v1.corrupt.previous')).toBe(first);
    expect([...base.values.keys()].filter((key) => key.includes('.corrupt.'))).toHaveLength(2);
    expect(base.setCalls.filter((key) => key.includes('.corrupt.'))).toHaveLength(3);
  });

  it('reports storage write failures without throwing and blocks writes on request', async () => {
    const base = new MemoryStorage();
    base.failWrites = true;
    const onWriteError = jest.fn();
    const safe = createSafeStorage(base, { onWriteError, onCorrupt: jest.fn() }, { blockWrites: () => false });
    await expect(safe.setItem('key', 'value')).resolves.toBeUndefined();
    expect(onWriteError).toHaveBeenCalledWith('Your last change could not be saved. Free up storage and try again.');
    base.failWrites = false;
    const blocked = createSafeStorage(base, { onWriteError, onCorrupt: jest.fn() }, { blockWrites: () => true });
    await blocked.setItem('blocked', 'value');
    expect(base.values.has('blocked')).toBe(false);
  });

  it('reports UTF-8 bytes for a valid read and successful writes to the tracked key', async () => {
    const base = new MemoryStorage();
    const onWriteSuccess = jest.fn();
    const safe = createSafeStorage(
      base,
      { onWriteError: jest.fn(), onCorrupt: jest.fn() },
      { blockWrites: () => false, trackedKey: 'app', onReadSuccess: onWriteSuccess, onWriteSuccess },
    );
    await safe.setItem('other', '₹');
    expect(onWriteSuccess).not.toHaveBeenCalled();
    await safe.setItem('app', '₹🙂');
    expect(onWriteSuccess).toHaveBeenCalledWith(7);
    onWriteSuccess.mockClear();
    const validValue = blob(mockAppData, 4);
    base.values.set('app', validValue);
    await safe.getItem('app');
    expect(onWriteSuccess).toHaveBeenCalledWith(utf8ByteLength(validValue));
    onWriteSuccess.mockClear();
    base.failWrites = true;
    await safe.setItem('app', 'failed');
    expect(onWriteSuccess).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)('copies the raw v%s payload exactly once and never overwrites its archive', async (version) => {
    const name = 'wealthwise.app.v1';
    const base = new MemoryStorage();
    const raw = blob(makeLegacyData(version), version);
    const migrated = JSON.stringify({ state: { data: mockAppData }, version: 9 });
    const premigrationKey = `${name}.premigration.v${version}`;
    base.values.set(name, raw);
    const safe = createSafeStorage(
      base,
      { onWriteError: jest.fn(), onCorrupt: jest.fn() },
      { blockWrites: () => false },
    );
    await safe.getItem(name);
    await safe.setItem(name, migrated);
    expect(base.values.get(premigrationKey)).toBe(raw);
    expect(base.setCalls.filter((key) => key === premigrationKey)).toHaveLength(1);

    const nextLaunch = createSafeStorage(
      base,
      { onWriteError: jest.fn(), onCorrupt: jest.fn() },
      { blockWrites: () => false },
    );
    await nextLaunch.getItem(name);
    await nextLaunch.setItem(name, migrated);
    expect(base.setCalls.filter((key) => key === premigrationKey)).toHaveLength(1);
    expect(base.values.get(premigrationKey)).toBe(raw);

    const existingArchive = 'previously archived bytes';
    const alreadyArchived = new MemoryStorage();
    alreadyArchived.values.set(name, raw);
    alreadyArchived.values.set(premigrationKey, existingArchive);
    const safeWithArchive = createSafeStorage(
      alreadyArchived,
      { onWriteError: jest.fn(), onCorrupt: jest.fn() },
      { blockWrites: () => false },
    );
    await safeWithArchive.getItem(name);
    await safeWithArchive.setItem(name, migrated);
    expect(alreadyArchived.values.get(premigrationKey)).toBe(existingArchive);
    expect(alreadyArchived.setCalls.filter((key) => key === premigrationKey)).toHaveLength(0);
  });
});
