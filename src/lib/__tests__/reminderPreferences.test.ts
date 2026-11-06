import { DEFAULT_REMINDER_PREFERENCES } from '../../data/metaStore';
import { enableReminderPreferences } from '../reminderPreferences';

describe('enableReminderPreferences', () => {
  it('uses the granted permission and saves enabled preferences', async () => {
    const save = jest.fn(async (preferences) => preferences);
    const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
      getPermissionState: jest.fn(async () => 'granted'),
      requestPermission: jest.fn(async () => 'denied'),
      save,
    });

    expect(result).toEqual({
      permission: 'granted',
      preferences: { ...DEFAULT_REMINDER_PREFERENCES, enabled: true },
    });
    expect(save).toHaveBeenCalledWith({ ...DEFAULT_REMINDER_PREFERENCES, enabled: true });
  });

  it.each(['denied', 'blocked'] as const)('does not save when permission is %s', async (permission) => {
    const save = jest.fn(async (preferences) => preferences);
    const requestPermission = jest.fn(async () => permission);
    const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
      getPermissionState: jest.fn(async () => permission),
      requestPermission,
      save,
    });

    expect(result).toEqual({ permission, preferences: DEFAULT_REMINDER_PREFERENCES });
    expect(requestPermission).toHaveBeenCalledTimes(permission === 'denied' ? 1 : 0);
    expect(save).not.toHaveBeenCalled();
  });

  it('requests permission after a denied status and saves only when granted', async () => {
    const save = jest.fn(async (preferences) => preferences);
    const requestPermission = jest.fn(async () => 'granted' as const);
    const result = await enableReminderPreferences(DEFAULT_REMINDER_PREFERENCES, {
      getPermissionState: jest.fn(async () => 'denied'),
      requestPermission,
      save,
    });

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(result.permission).toBe('granted');
    expect(result.preferences.enabled).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
