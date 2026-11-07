export type ReminderPermissionState = 'granted' | 'denied' | 'blocked';

export function reminderPermissionState(response: {
  granted: boolean;
  canAskAgain: boolean;
}): ReminderPermissionState {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'denied' : 'blocked';
}
