import type { StateStorage } from 'zustand/middleware';

import { appDataSchema, SCHEMA_VERSION } from '../domain/schemas';

export type CorruptionReason = 'invalid-json' | 'invalid-blob' | 'invalid-schema' | 'newer-version';

export type CorruptionInfo = {
  name: string;
  backupKey: string;
  reason: CorruptionReason;
};

export type SafeStorageHooks = {
  onWriteError: (message: string) => void;
  onCorrupt: (info: CorruptionInfo) => void;
};

export function createSafeStorage(
  base: StateStorage,
  hooks: SafeStorageHooks,
  options: { blockWrites: () => boolean },
): StateStorage {
  let premigration: { raw: string; version: 1 | 2 | 3 } | null = null;
  return {
    async getItem(name) {
      const raw = await base.getItem(name);
      if (raw === null) return null;

      let reason: CorruptionReason | null = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
          reason = 'invalid-blob';
        } else {
          const envelope = parsed as { state?: unknown; version?: unknown };
          if (typeof envelope.version === 'number' && envelope.version > SCHEMA_VERSION) {
            reason = 'newer-version';
          } else if (
            (envelope.version === 1 || envelope.version === 2 || envelope.version === 3) &&
            typeof envelope.state === 'object' &&
            envelope.state !== null &&
            'data' in envelope.state
          ) {
            premigration = { raw, version: envelope.version };
          } else if (
            typeof envelope.state !== 'object' ||
            envelope.state === null ||
            !('data' in envelope.state) ||
            !appDataSchema.safeParse((envelope.state as { data?: unknown }).data).success
          ) {
            reason = 'invalid-schema';
          }
        }
      } catch {
        reason = 'invalid-json';
      }

      if (reason === null) return raw;

      const backupKey = `${name}.corrupt.latest`;
      if (reason !== 'newer-version') {
        const latest = await base.getItem(backupKey);
        if (latest !== raw) {
          if (latest !== null) {
            await base.setItem(`${name}.corrupt.previous`, latest);
          }
          await base.setItem(backupKey, raw);
        }
      }
      hooks.onCorrupt({ name, backupKey, reason });
      return null;
    },
    async setItem(name, value) {
      if (options.blockWrites()) return;
      try {
        if (name && premigration !== null) {
          const premigrationKey = `${name}.premigration.v${premigration.version}`;
          const existing = await base.getItem(premigrationKey);
          if (existing === null) await base.setItem(premigrationKey, premigration.raw);
          premigration = null;
        }
        await base.setItem(name, value);
      } catch {
        hooks.onWriteError('Your last change could not be saved. Free up storage and try again.');
      }
    },
    async removeItem(name) {
      await base.removeItem(name);
    },
  };
}
