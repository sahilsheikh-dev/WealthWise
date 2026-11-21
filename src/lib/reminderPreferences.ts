import type { PersistedReminderPreferences } from '../data/metaStore';
import type { ReminderPermissionState } from './reminderPermissions';

export async function enableReminderPreferences(
  preferences: PersistedReminderPreferences,
  dependencies: {
    getPermissionState: () => Promise<ReminderPermissionState>;
    requestPermission: () => Promise<ReminderPermissionState>;
    save: (preferences: PersistedReminderPreferences) => Promise<PersistedReminderPreferences>;
  },
): Promise<{ permission: ReminderPermissionState; preferences: PersistedReminderPreferences }> {
  const currentPermission = await dependencies.getPermissionState();
  const permission = currentPermission === 'granted' || currentPermission === 'blocked'
    ? currentPermission
    : await dependencies.requestPermission();
  if (permission !== 'granted') return { permission, preferences };

  const enabledPreferences = { ...preferences, enabled: true };
  return {
    permission,
    preferences: await dependencies.save(enabledPreferences),
  };
}
