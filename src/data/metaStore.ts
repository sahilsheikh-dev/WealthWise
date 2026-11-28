import { z } from 'zod';
import type { StateStorage } from 'zustand/middleware';
import {
  resolveSortSpec,
  type SortOption,
  type SortSpec,
} from '../lib/sorting';

const META_KEY = 'wealthwise.meta.v1';
const sortSpecSchema = z.strictObject({
  key: z.string(),
  dir: z.enum(['asc', 'desc']),
});
const reminderPreferencesSchema = z.strictObject({
  enabled: z.boolean(),
  localTime: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/),
  dayBefore: z.boolean(),
  sameDay: z.boolean(),
  showAmounts: z.boolean(),
  updateValues: z.boolean().optional(),
});
const pendingTransactionDraftSchema = z.strictObject({
  id: z.string(),
  type: z.enum(['expense', 'income']),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  suggestedNote: z.string().max(80),
  sourcePackage: z.string(),
  confidence: z.enum(['high', 'medium']),
  fingerprint: z.string(),
  createdAtMs: z.number(),
  expiresAtMs: z.number(),
});
const seenDetectionFingerprintSchema = z.strictObject({
  fingerprint: z.string(),
  seenAtMs: z.number(),
});
const transactionDetectionPreferencesSchema = z.strictObject({
  enabled: z.boolean(),
  disclosureAcceptedAt: z.string().datetime().optional(),
  allowedPackages: z.array(z.string()),
  pendingDrafts: z.array(pendingTransactionDraftSchema),
  seenFingerprints: z.array(seenDetectionFingerprintSchema),
});
const metaSchema = z.strictObject({
  lastExportAt: z.string().datetime().optional(),
  nudgeDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  storageWarnDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remindersPromptHandled: z.boolean().optional(),
  sortSpecs: z.record(z.string(), sortSpecSchema).optional(),
  reminders: reminderPreferencesSchema.optional(),
  transactionDetection: transactionDetectionPreferencesSchema.optional(),
});

export type BackupMeta = z.infer<typeof metaSchema>;
export type PersistedReminderPreferences = z.infer<typeof reminderPreferencesSchema>;
export type PersistedTransactionDetection = z.infer<typeof transactionDetectionPreferencesSchema>;

export const DEFAULT_REMINDER_PREFERENCES: PersistedReminderPreferences = {
  enabled: false,
  localTime: '09:00',
  dayBefore: true,
  sameDay: true,
  showAmounts: false,
  updateValues: false,
};

export const DEFAULT_TRANSACTION_DETECTION: PersistedTransactionDetection = {
  enabled: false,
  allowedPackages: [],
  pendingDrafts: [],
  seenFingerprints: [],
};

export function createMetaStore(storage: StateStorage) {
  const listeners = new Set<(meta: BackupMeta) => void>();
  let cachedMeta: BackupMeta | null = null;
  let writeQueue: Promise<unknown> = Promise.resolve();

  function publish(meta: BackupMeta): void {
    cachedMeta = meta;
    for (const listener of listeners) listener(meta);
  }

  async function getMeta(): Promise<BackupMeta> {
    let raw: string | null;
    try {
      raw = await storage.getItem(META_KEY);
      if (raw === null) {
        cachedMeta = {};
        return {};
      }
      const parsed: unknown = JSON.parse(raw);
      const validated = metaSchema.safeParse(parsed);
      const data = validated.success ? validated.data : {};
      cachedMeta = data;
      return data;
    } catch {
      cachedMeta = {};
      return {};
    }
  }

  function getCachedMeta(): BackupMeta | null {
    return cachedMeta;
  }

  async function updateMeta(patch: Partial<BackupMeta>): Promise<BackupMeta> {
    const operation = async () => {
      let current = cachedMeta;
      if (current === null) {
        let raw: string | null;
        try {
          raw = await storage.getItem(META_KEY);
          if (raw !== null) {
            const parsed: unknown = JSON.parse(raw);
            const validated = metaSchema.safeParse(parsed);
            if (validated.success) current = validated.data;
          }
        } catch {
          // ignore
        }
      }
      current = current ?? {};
      const next = { ...current, ...patch };
      if (patch.sortSpecs && current.sortSpecs) {
        next.sortSpecs = { ...current.sortSpecs, ...patch.sortSpecs };
      }
      const validated = metaSchema.safeParse(next);
      if (!validated.success) throw new Error('Backup metadata is invalid.');
      await storage.setItem(META_KEY, JSON.stringify(validated.data));
      publish(validated.data);
      return validated.data;
    };
    const queued = writeQueue.then(operation, operation);
    writeQueue = queued.catch(() => {});
    return queued;
  }

  async function clearMeta(): Promise<void> {
    const operation = async () => {
      await storage.removeItem(META_KEY);
      cachedMeta = {};
      publish({});
    };
    const queued = writeQueue.then(operation, operation);
    writeQueue = queued.catch(() => {});
    return queued;
  }

  function subscribe(listener: (meta: BackupMeta) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function getSortSpec(
    screenId: string,
    options: readonly SortOption[],
    defaultSpec: SortSpec,
  ): Promise<SortSpec | null> {
    const meta = await getMeta();
    return resolveSortSpec(meta.sortSpecs?.[screenId], options, defaultSpec);
  }

  async function updateSortSpec(
    screenId: string,
    spec: SortSpec,
    options: readonly SortOption[],
  ): Promise<BackupMeta> {
    if (!options.some((option) => option.key === spec.key) ||
      (spec.dir !== 'asc' && spec.dir !== 'desc')) {
      throw new Error('Sort preference is invalid.');
    }
    return updateMeta({
      sortSpecs: { [screenId]: spec },
    });
  }

  return { getMeta, updateMeta, clearMeta, subscribe, getSortSpec, updateSortSpec, getCachedMeta };
}
