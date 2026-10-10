import { z } from 'zod';
import type { StateStorage } from 'zustand/middleware';

const META_KEY = 'wealthwise.meta.v1';
const metaSchema = z.strictObject({
  lastExportAt: z.string().datetime().optional(),
  nudgeDismissedUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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

  return { getMeta, updateMeta };
}
