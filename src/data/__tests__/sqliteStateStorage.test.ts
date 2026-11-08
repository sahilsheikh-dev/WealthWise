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
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    legacy.values.set('wealthwise.app.v1', 'legacy');
    sqlite.values.set('wealthwise.app.v1', 'sqlite');

    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('sqlite');
    await expect(storage.getItem('another-key')).resolves.toBeNull();
    legacy.values.set('another-key', 'legacy-only');
    await expect(storage.getItem('another-key')).resolves.toBe('legacy-only');
  });

  it('reports hydration source and last-write verification in one diagnostic line', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const diagnostics: string[] = [];
    const storage = createMigratingSQLiteStateStorage(
      sqlite,
      legacy,
      () => undefined,
      (line) => diagnostics.push(line),
    );

    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBeNull();
    await storage.setItem('wealthwise.app.v1', 'verified bytes');

    expect(diagnostics).toEqual([
      'hydration source=empty; last-write verification=not-run',
      'hydration source=empty; last-write verification=sqlite-verified',
    ]);
  });

  it('preserves the old value in SQLite before replacing it and removes the legacy copy', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    legacy.values.set('wealthwise.app.v1', 'old');

    await storage.setItem('wealthwise.app.v1', 'new');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('new');
    expect(legacy.values.has('wealthwise.app.v1')).toBe(false);
  });

  it('keeps and uses a mismatched legacy copy instead of discarding it', async () => {
    const sqlite = new MemoryStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    sqlite.values.set('wealthwise.app.v1', 'current');
    legacy.values.set('wealthwise.app.v1', 'stale');

    await storage.setItem('wealthwise.app.v1', 'next');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('current');
    expect(legacy.values.get('wealthwise.app.v1')).toBe('next');
    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('next');
  });

  it('falls back to legacy without losing the current value when an SQLite write fails', async () => {
    class FailingSQLiteStorage extends MemoryStorage {
      override async setItem(name: string, value: string): Promise<void> {
        throw new Error('disk full');
      }
    }

    const sqlite = new FailingSQLiteStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    legacy.values.set('wealthwise.app.v1', 'old');

    await storage.setItem('wealthwise.app.v1', 'new');

    expect(sqlite.values.has('wealthwise.app.v1')).toBe(false);
    expect(legacy.values.get('wealthwise.app.v1')).toBe('new');
    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('new');
  });

  it('uses the legacy value after an SQLite open/read failure', async () => {
    class OpenFailingSQLiteStorage extends MemoryStorage {
      override async getItem(): Promise<string | null> {
        throw new Error('database could not open');
      }

      override async setItem(): Promise<void> {
        throw new Error('SQLite must stay disabled');
      }
    }

    const sqlite = new OpenFailingSQLiteStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    legacy.values.set('wealthwise.app.v1', 'legacy bytes');

    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('legacy bytes');
    await storage.setItem('wealthwise.app.v1', 'latest bytes');

    expect(legacy.values.get('wealthwise.app.v1')).toBe('latest bytes');
    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('latest bytes');
  });

  it('keeps the legacy copy and falls back when SQLite read-back fails', async () => {
    class ReadBackFailingSQLiteStorage extends MemoryStorage {
      reads = 0;

      override async getItem(name: string): Promise<string | null> {
        this.reads += 1;
        if (this.reads === 2) throw new Error('read-back failed');
        return super.getItem(name);
      }
    }

    const sqlite = new ReadBackFailingSQLiteStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    legacy.values.set('wealthwise.app.v1', 'legacy bytes');

    await storage.setItem('wealthwise.app.v1', 'latest bytes');

    expect(sqlite.values.get('wealthwise.app.v1')).toBe('legacy bytes');
    expect(legacy.values.get('wealthwise.app.v1')).toBe('latest bytes');
    await expect(storage.getItem('wealthwise.app.v1')).resolves.toBe('latest bytes');
  });

  it('hydrates the newest value after a failed SQLite write and process restart', async () => {
    class FailingSQLiteStorage extends MemoryStorage {
      override async setItem(): Promise<void> {
        throw new Error('disk full');
      }
    }

    const sqlite = new FailingSQLiteStorage();
    const legacy = new MemoryStorage();
    sqlite.values.set('wealthwise.app.v1', 'old SQLite bytes');
    const firstProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await firstProcess.setItem('wealthwise.app.v1', 'newest bytes');

    const restartedProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await expect(restartedProcess.getItem('wealthwise.app.v1')).resolves.toBe('newest bytes');
  });

  it('hydrates the newest value after SQLite read-back mismatch and process restart', async () => {
    class ReadBackMismatchSQLiteStorage extends MemoryStorage {
      override async setItem(): Promise<void> {}
    }

    const sqlite = new ReadBackMismatchSQLiteStorage();
    const legacy = new MemoryStorage();
    sqlite.values.set('wealthwise.app.v1', 'old SQLite bytes');
    legacy.values.set('wealthwise.app.v1', 'old SQLite bytes');
    const firstProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await firstProcess.setItem('wealthwise.app.v1', 'newest bytes');

    const restartedProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await expect(restartedProcess.getItem('wealthwise.app.v1')).resolves.toBe('newest bytes');
  });

  it('hydrates a legacy-fallback write after SQLite recovers and the process restarts', async () => {
    class RecoveringSQLiteStorage extends MemoryStorage {
      failNextRead = true;

      override async getItem(name: string): Promise<string | null> {
        if (this.failNextRead) {
          this.failNextRead = false;
          throw new Error('database could not open');
        }
        return super.getItem(name);
      }
    }

    const sqlite = new RecoveringSQLiteStorage();
    const legacy = new MemoryStorage();
    sqlite.values.set('wealthwise.app.v1', 'old SQLite bytes');
    legacy.values.set('wealthwise.app.v1', 'old SQLite bytes');
    const firstProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await expect(firstProcess.getItem('wealthwise.app.v1')).resolves.toBe('old SQLite bytes');
    await firstProcess.setItem('wealthwise.app.v1', 'newest bytes');

    const restartedProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await expect(restartedProcess.getItem('wealthwise.app.v1')).resolves.toBe('newest bytes');
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

  it('surfaces an SQLite removal failure after removing the legacy copy', async () => {
    class RemoveFailingSQLiteStorage extends MemoryStorage {
      override async removeItem(): Promise<void> {
        throw new Error('SQLite remove failed');
      }
    }

    const sqlite = new RemoveFailingSQLiteStorage();
    const legacy = new MemoryStorage();
    const storage = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    sqlite.values.set('wealthwise.app.v1', 'SQLite bytes');
    legacy.values.set('wealthwise.app.v1', 'legacy bytes');

    await expect(storage.removeItem('wealthwise.app.v1')).rejects.toThrow(
      'SQLite could not remove the persisted value; the legacy copy was removed.',
    );
    expect(legacy.values.has('wealthwise.app.v1')).toBe(false);
    expect(sqlite.values.get('wealthwise.app.v1')).toBe('SQLite bytes');
    const restartedProcess = createMigratingSQLiteStateStorage(sqlite, legacy, () => undefined);
    await expect(restartedProcess.getItem('wealthwise.app.v1')).resolves.toBeNull();
  });
});
