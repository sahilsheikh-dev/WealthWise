import type { StateStorage } from 'zustand/middleware';

import { createMigratingSQLiteStateStorage } from '../sqliteStateStorage';

class MemoryStorage implements StateStorage {
  readonly values = new Map<string, string>();

  async getItem(name: string): Promise<string | null> {
    return this.values.get(name) ?? null;
  }

  async setItem(name: string, value: string): Promise<void> {
    this.values.set(name, value);
  }

  async removeItem(name: string): Promise<void> {
    this.values.delete(name);
  }
}

describe('SQLite state storage migration', () => {
  it('prefers the SQLite value and falls back to legacy AsyncStorage', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy);
    legacy.values.set('wealthwise.app.v1', 'legacy');
    sqlite.values.set('wealthwise.app.v1', 'sqlite');

    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('sqlite');
    await expect(storage.getItem('another-key')).resolves.toBeNull();
    legacy.values.set('another-key', 'legacy-only');
    await expect(storage.getItem('another-key')).resolves.toBe('legacy-only');
  });

  it('preserves the old value in SQLite before replacing it and removes the legacy copy', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy);
    legacy.values.set('wealthwise.app.v1', 'old');

    await storage.setItem('wealthwise.app.v1', 'new');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('new');
    expect(legacy.values.has('wealthwise.app.v1')).toBe(false);
  });

  it('keeps an existing SQLite value when replacing a stale legacy copy', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy);
    sqlite.values.set('wealthwise.app.v1', 'current');
    legacy.values.set('wealthwise.app.v1', 'stale');

    await storage.setItem('wealthwise.app.v1', 'next');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('next');
    expect(legacy.values.has('wealthwise.app.v1')).toBe(false);
  });

  it('retains the previous data if the new SQLite write fails after legacy migration', async () => {
    class FailingSQLiteStorage extends MemoryStorage {
      writes = 0;

      override async setItem(name: string, value: string): Promise<void> {
        this.writes += 1;
        if (this.writes === 2) throw new Error('disk full');
        await super.setItem(name, value);
      }
    }

    const sqlite = new FailingSQLiteStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy);
    legacy.values.set('wealthwise.app.v1', 'old');

    await expect(storage.setItem('wealthwise.app.v1', 'new')).rejects.toThrow('disk full');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('old');
    expect(legacy.values.has('wealthwise.app.v1')).toBe(false);
  });

  it('removes keys from both backends', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy);
    sqlite.values.set('archive', 'sqlite');
    legacy.values.set('archive', 'legacy');

    await storage.removeItem('archive');

    expect(sqlite.values.has('archive')).toBe(false);
    expect(legacy.values.has('archive')).toBe(false);
  });
});
