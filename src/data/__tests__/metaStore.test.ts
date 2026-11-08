import type { StateStorage } from 'zustand/middleware';

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
    await expect(meta.updateMeta({ lastExportAt: 'bad' })).rejects.toThrow('Backup metadata is invalid.');
    storage.failWrite = true;
    await expect(meta.updateMeta({ nudgeDismissedUntil: '2026-10-18' })).rejects.toThrow('write failed');
  });
});
