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
const metaSchema = z.strictObject({
  lastExportAt: z.string().datetime().optional(),
  nudgeDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  storageWarnDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sortSpecs: z.record(z.string(), sortSpecSchema).optional(),
});

export type BackupMeta = z.infer<typeof metaSchema>;

export function createMetaStore(storage: StateStorage) {
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
    return validated.data;
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

  return { getMeta, updateMeta, getSortSpec, updateSortSpec };
}
