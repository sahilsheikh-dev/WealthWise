import { reminderPermissionState } from '../reminderPermissions';

describe('reminder permission states', () => {
  it('distinguishes granted, denied, and blocked states', () => {
    expect(reminderPermissionState({ granted: true, canAskAgain: false })).toBe('granted');
    expect(reminderPermissionState({ granted: false, canAskAgain: true })).toBe('denied');
    expect(reminderPermissionState({ granted: false, canAskAgain: false })).toBe('blocked');
  });
});
