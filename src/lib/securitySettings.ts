import { z } from 'zod';

import { GRACE_OPTIONS } from './lockPolicy';

export const LOCK_SETTINGS_KEY = 'wealthwise.lock.v1';
export const DEFAULT_SECURITY_SETTINGS = {
  enabled: false,
  graceMs: 30_000,
  hidePreviews: false,
} as const;
const securitySettingsSchema = z.strictObject({
  enabled: z.boolean(),
  graceMs: z.union([
    z.literal(GRACE_OPTIONS.immediate),
    z.literal(GRACE_OPTIONS['30 seconds']),
    z.literal(GRACE_OPTIONS['5 minutes']),
  ]),
  hidePreviews: z.boolean(),
});

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type SecureSettingsAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
};

export function createSecuritySettings(adapter: SecureSettingsAdapter) {
  return {
    async get(): Promise<SecuritySettings> {
      let raw: string | null;
      try {
        raw = await adapter.getItem(LOCK_SETTINGS_KEY);
      } catch {
        return { enabled: true, graceMs: 0, hidePreviews: true };
      }
      if (raw === null) return { ...DEFAULT_SECURITY_SETTINGS };
      try {
        const result = securitySettingsSchema.safeParse(JSON.parse(raw));
        return result.success ? result.data : { enabled: true, graceMs: 0, hidePreviews: true };
      } catch {
        return { enabled: true, graceMs: 0, hidePreviews: true };
      }
    },
    async set(settings: SecuritySettings): Promise<void> {
      const validated = securitySettingsSchema.parse(settings);
      await adapter.setItem(LOCK_SETTINGS_KEY, JSON.stringify(validated));
    },
    async remove(): Promise<void> {
      await adapter.deleteItem(LOCK_SETTINGS_KEY);
    },
  };
}
