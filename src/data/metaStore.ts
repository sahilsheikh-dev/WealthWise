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
const metaSchema = z.strictObject({
  lastExportAt: z.string().datetime().optional(),
  nudgeDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  storageWarnDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remindersPromptHandled: z.boolean().optional(),
  sortSpecs: z.record(z.string(), sortSpecSchema).optional(),
  reminders: reminderPreferencesSchema.optional(),
});

export type BackupMeta = z.infer<typeof metaSchema>;
export type PersistedReminderPreferences = z.infer<typeof reminderPreferencesSchema>;

export const DEFAULT_REMINDER_PREFERENCES: PersistedReminderPreferences = {
  enabled: false,
  localTime: '09:00',
  dayBefore: true,
  sameDay: true,
  showAmounts: false,
  updateValues: false,
};

export function createMetaStore(storage: StateStorage) {
  const listeners = new Set<(meta: BackupMeta) => void>();

  function publish(meta: BackupMeta): void {
    for (const listener of listeners) listener(meta);
  }

  async function getMeta(): Promise<BackupMeta> {
    let raw: string | null;
    try {
      raw = await storage.getItem(META_KEY);
      if (raw === null) return {};
      const parsed: unknown = JSON.parse(raw);
      const validated = metaSchema.safeParse(parsed);
      return validated.success ? validated.data : {};
    } catch {
      return {};
    }
  }

  async function updateMeta(patch: Partial<BackupMeta>): Promise<BackupMeta> {
    const current = await getMeta();
    const validated = metaSchema.safeParse({ ...current, ...patch });
    if (!validated.success) throw new Error('Backup metadata is invalid.');
    await storage.setItem(META_KEY, JSON.stringify(validated.data));
    publish(validated.data);
    return validated.data;
  }

  async function clearMeta(): Promise<void> {
    await storage.removeItem(META_KEY);
    publish({});
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
    const current = await getMeta();
    return updateMeta({
      sortSpecs: { ...current.sortSpecs, [screenId]: spec },
    });
  }

  return { getMeta, updateMeta, clearMeta, subscribe, getSortSpec, updateSortSpec };
}
