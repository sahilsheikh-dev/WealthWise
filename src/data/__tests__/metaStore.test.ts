import type { StateStorage } from 'zustand/middleware';

import { DEFAULT_SORTS, SORT_OPTIONS } from '../../lib/sorting';
import { createMetaStore } from '../metaStore';

class MetaStorage implements StateStorage {
  values = new Map<string, string>();
  writes = 0;
  failRead = false;
  failWrite = false;
  getItem(name: string) {
    if (this.failRead) throw new Error('read failed');
    return this.values.get(name) ?? null;
  }
  setItem(name: string, value: string) {
    this.writes += 1;
    if (this.failWrite) throw new Error('write failed');
    this.values.set(name, value);
  }
  removeItem(name: string) { this.values.delete(name); }
}

describe('backup metadata storage', () => {
  it('silently resets absent, unreadable, and invalid metadata', async () => {
    const storage = new MetaStorage();
    const meta = createMetaStore(storage);
    await expect(meta.getMeta()).resolves.toEqual({});
    storage.failRead = true;
    await expect(meta.getMeta()).resolves.toEqual({});
    storage.failRead = false;
    storage.values.set('wealthwise.meta.v1', '{"lastExportAt":"bad"}');
    await expect(meta.getMeta()).resolves.toEqual({});
  });

  it('merges a patch with one write and propagates storage write failures', async () => {
    const storage = new MetaStorage();
    const meta = createMetaStore(storage);
    await meta.updateMeta({ lastExportAt: '2026-10-10T10:00:00.000Z' });
    expect(storage.writes).toBe(1);
    await expect(meta.updateMeta({ nudgeDismissedUntil: '2026-10-17' })).resolves.toEqual({
      lastExportAt: '2026-10-10T10:00:00.000Z',
      nudgeDismissedUntil: '2026-10-17',
    });
    expect(storage.writes).toBe(2);
    await expect(meta.updateMeta({ storageWarnDismissedUntil: '2026-10-24' })).resolves.toEqual({
      lastExportAt: '2026-10-10T10:00:00.000Z',
      nudgeDismissedUntil: '2026-10-17',
      storageWarnDismissedUntil: '2026-10-24',
    });
    expect(storage.writes).toBe(3);
    await expect(meta.updateMeta({ lastExportAt: 'bad' })).rejects.toThrow('Backup metadata is invalid.');
    storage.failWrite = true;
    await expect(meta.updateMeta({ nudgeDismissedUntil: '2026-10-18' })).rejects.toThrow('write failed');
  });

  it('persists validated sort choices and falls back for an unknown stored key', async () => {
    const storage = new MetaStorage();
    const meta = createMetaStore(storage);
    await meta.updateMeta({ lastExportAt: '2026-10-10T10:00:00.000Z' });
    await meta.updateSortSpec('transactions', { key: 'amount', dir: 'asc' }, SORT_OPTIONS.transactions);
    expect(storage.writes).toBe(2);
    await expect(meta.getSortSpec(
      'transactions',
      SORT_OPTIONS.transactions,
      DEFAULT_SORTS.transactions,
    )).resolves.toEqual({ key: 'amount', dir: 'asc' });
    expect(await meta.getMeta()).toMatchObject({
      lastExportAt: '2026-10-10T10:00:00.000Z',
      sortSpecs: { transactions: { key: 'amount', dir: 'asc' } },
    });

    storage.values.set('wealthwise.meta.v1', JSON.stringify({
      sortSpecs: { transactions: { key: 'unknown', dir: 'desc' } },
    }));
    await expect(meta.getSortSpec(
      'transactions',
      SORT_OPTIONS.transactions,
      DEFAULT_SORTS.transactions,
    )).resolves.toEqual(DEFAULT_SORTS.transactions);
  });

  it('rejects a sort key that is not registered for the selected list', async () => {
    const meta = createMetaStore(new MetaStorage());
    await expect(meta.updateSortSpec(
      'transactions',
      { key: 'status', dir: 'asc' },
      SORT_OPTIONS.transactions,
    )).rejects.toThrow('Sort preference is invalid.');
  });

  it('stores reminder preferences in UI metadata and publishes updates and erase', async () => {
    const storage = new MetaStorage();
    const meta = createMetaStore(storage);
    const updates: unknown[] = [];
    const unsubscribe = meta.subscribe((value) => updates.push(value));

    await meta.updateMeta({
      reminders: {
        enabled: true,
        localTime: '09:30',
        dayBefore: true,
        sameDay: false,
        showAmounts: true,
      },
    });
    expect(await meta.getMeta()).toMatchObject({
      reminders: {
        enabled: true,
        localTime: '09:30',
        dayBefore: true,
        sameDay: false,
        showAmounts: true,
      },
    });
    await expect(meta.updateMeta({
      reminders: {
        enabled: true,
        localTime: '09:15',
        dayBefore: true,
        sameDay: true,
        showAmounts: false,
      },
    })).rejects.toThrow('Backup metadata is invalid.');
    await meta.clearMeta();
    expect(updates).toHaveLength(2);
    expect(updates.at(-1)).toEqual({});
    expect(await meta.getMeta()).toEqual({});
    unsubscribe();
  });

});
