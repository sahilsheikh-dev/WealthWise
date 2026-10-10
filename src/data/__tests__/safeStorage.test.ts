import type { StateStorage } from 'zustand/middleware';

import { mockAppData } from '../../mock/data';
import { createSafeStorage } from '../safeStorage';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  failWrites = false;

  getItem(name: string): string | null {
    return this.values.get(name) ?? null;
  }

  setItem(name: string, value: string): void {
    if (this.failWrites) throw new Error('disk full');
    this.values.set(name, value);
  }

  removeItem(name: string): void {
    this.values.delete(name);
  }
}

const blob = (data: unknown = mockAppData, version = 1) => JSON.stringify({ state: { data }, version });

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
    ['invalid-schema', blob({ transactions: [] }), 'corrupt'],
    ['newer-version', blob(mockAppData, 2), 'newer-version'],
  ] as const)('backs up a %s blob and reports its reason', async (expectedReason, raw, callbackReason) => {
    const base = new MemoryStorage();
    base.values.set('wealthwise.app.v1', raw);
    const onCorrupt = jest.fn();
    const safe = createSafeStorage(base, { onWriteError: jest.fn(), onCorrupt }, { blockWrites: () => false });
    await expect(safe.getItem('wealthwise.app.v1')).resolves.toBeNull();
    const backup = [...base.values.entries()].find(([key]) => key.startsWith('wealthwise.app.v1.corrupt.'));
    expect(backup?.[1]).toBe(raw);
    expect(onCorrupt).toHaveBeenCalledWith(expect.objectContaining({
      name: 'wealthwise.app.v1',
      backupKey: backup?.[0],
      reason: expectedReason,
    }));
    expect(callbackReason).toBe(expectedReason === 'newer-version' ? 'newer-version' : 'corrupt');
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
});
