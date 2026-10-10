import type { StateStorage } from 'zustand/middleware';

import { mockAppData } from '../../mock/data';
import { createSafeStorage } from '../safeStorage';

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
    ['invalid-schema', blob({ transactions: [] }, 3), 'corrupt'],
    ['newer-version', blob(mockAppData, 4), 'newer-version'],
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

  it('preserves the exact v2 payload once before its first migrated write', async () => {
    const base = new MemoryStorage();
    const raw = blob({
      ...mockAppData,
      settings: { name: 'Legacy v2', theme: 'dark' },
    }, 2);
    base.values.set('wealthwise.app.v1', raw);
    const safe = createSafeStorage(
      base,
      { onWriteError: jest.fn(), onCorrupt: jest.fn() },
      { blockWrites: () => false },
    );
    await safe.getItem('wealthwise.app.v1');
    await safe.setItem('wealthwise.app.v1', 'migrated');
    expect(base.values.get('wealthwise.app.v1.premigration.v2')).toBe(raw);
    await safe.getItem('wealthwise.app.v1');
    await safe.setItem('wealthwise.app.v1', 'migrated-again');
    expect(base.setCalls.filter((key) => key === 'wealthwise.app.v1.premigration.v2')).toHaveLength(1);
    expect(base.values.get('wealthwise.app.v1.premigration.v2')).toBe(raw);
  });
});
