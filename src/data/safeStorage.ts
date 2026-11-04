import type { StateStorage } from 'zustand/middleware';

import { appDataSchema, SCHEMA_VERSION } from '../domain/schemas';
import { resolveEfAllocation } from '../domain/efAllocation';
import { utf8ByteLength } from '../lib/storageGuard';

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
  options: {
    blockWrites: () => boolean;
    trackedKey?: string;
    onReadSuccess?: (bytes: number) => void;
    onWriteSuccess?: (bytes: number) => void;
  },
): StateStorage {
  let premigration: { raw: string; version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 } | null = null;
  let prerepairRaw: string | null = null;
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
            (envelope.version === 1 || envelope.version === 2 || envelope.version === 3 || envelope.version === 4 || envelope.version === 5 || envelope.version === 6 || envelope.version === 7 || envelope.version === 8 || envelope.version === 9 || envelope.version === 10 || envelope.version === 11 || envelope.version === 12 || envelope.version === 13 || envelope.version === 14 || envelope.version === 15 || envelope.version === 16 || envelope.version === 17) &&
            typeof envelope.state === 'object' &&
            envelope.state !== null &&
            'data' in envelope.state
          ) {
            premigration = { raw, version: envelope.version };
            const rawData: unknown = envelope.state.data;
            const rawRecord = typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData)
              ? rawData as Record<string, unknown>
              : null;
            if (rawRecord && resolveEfAllocation({
              efAllocation: rawRecord.efAllocation,
              efCustomBuckets: Array.isArray(rawRecord.efCustomBuckets) ? rawRecord.efCustomBuckets : [],
            }).repaired) {
              prerepairRaw = raw;
            }
          } else if (typeof envelope.state !== 'object' || envelope.state === null || !('data' in envelope.state)) {
            reason = 'invalid-schema';
          } else {
            const rawData: unknown = (envelope.state as { data?: unknown }).data;
            const allocationlessData = typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData)
              ? { ...rawData, efAllocation: null }
              : rawData;
            const validatedData = appDataSchema.safeParse(allocationlessData);
            if (!validatedData.success) {
              reason = 'invalid-schema';
            } else {
              const rawAllocation = typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData)
                ? (rawData as Record<string, unknown>).efAllocation
                : undefined;
              if (resolveEfAllocation({
                efAllocation: rawAllocation,
                efCustomBuckets: validatedData.data.efCustomBuckets,
              }).repaired) {
                prerepairRaw = raw;
              }
            }
          }
        }
      } catch {
        reason = 'invalid-json';
      }

      if (reason === null) {
        if (name === options.trackedKey) options.onReadSuccess?.(utf8ByteLength(raw));
        return raw;
      }

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
        if (prerepairRaw !== null) {
          const prerepairKey = `${name}.prerepair-efallocation`;
          const existing = await base.getItem(prerepairKey);
          if (existing === null) await base.setItem(prerepairKey, prerepairRaw);
          prerepairRaw = null;
        }
        await base.setItem(name, value);
      } catch {
        hooks.onWriteError('Your last change could not be saved. Free up storage and try again.');
        return;
      }
      if (name === options.trackedKey) options.onWriteSuccess?.(utf8ByteLength(value));
    },
    async removeItem(name) {
      await base.removeItem(name);
    },
  };
}
