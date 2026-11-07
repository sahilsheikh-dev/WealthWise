import { createAuthenticator } from '../authenticate';
import { lockReducer, shouldLockOnResume, type LockState } from '../lockPolicy';
import { createSecuritySettings, LOCK_SETTINGS_KEY, type SecureSettingsAdapter } from '../securitySettings';

describe('lock policy', () => {
  const initial: LockState = { locked: false, authInFlight: false, backgroundedAt: null };

  it('locks at cold start and at the grace boundary, but not before it', () => {
    expect(lockReducer(initial, { type: 'cold-start', enabled: true }).locked).toBe(true);
    expect(lockReducer(initial, { type: 'cold-start', enabled: false }).locked).toBe(false);
    expect(shouldLockOnResume({ enabled: true, backgroundedAt: 1_000, now: 30_000, graceMs: 30_000 })).toBe(false);
    expect(shouldLockOnResume({ enabled: true, backgroundedAt: 1_000, now: 31_000, graceMs: 30_000 })).toBe(true);
    expect(shouldLockOnResume({ enabled: false, backgroundedAt: null, now: 1, graceMs: 0 })).toBe(false);
    expect(shouldLockOnResume({ enabled: true, backgroundedAt: null, now: 1, graceMs: 300_000 })).toBe(true);
  });

  it('ignores app-state transitions during authentication and unlocks when disabled', () => {
    const authenticating = lockReducer({ ...initial, locked: true }, { type: 'auth-start' });
    expect(lockReducer(authenticating, { type: 'background', now: 1_000 })).toEqual(authenticating);
    expect(lockReducer(authenticating, { type: 'foreground', enabled: true, now: 40_000, graceMs: 0 })).toEqual(authenticating);
    expect(lockReducer(authenticating, { type: 'settings-changed', enabled: false })).toMatchObject({
      locked: false, authInFlight: false, backgroundedAt: null,
    });
    const background = lockReducer(initial, { type: 'background', now: 1_000 });
    expect(background.backgroundedAt).toBe(1_000);
    expect(lockReducer(background, {
      type: 'foreground', enabled: true, now: 30_000, graceMs: 30_000,
    }).locked).toBe(false);
    expect(lockReducer(background, {
      type: 'foreground', enabled: true, now: 31_000, graceMs: 30_000,
    })).toMatchObject({ locked: true, backgroundedAt: null });
    expect(lockReducer(initial, { type: 'settings-changed', enabled: true })).toEqual(initial);
    expect(lockReducer({ ...initial, locked: true }, { type: 'auth-success' }).locked).toBe(false);
    expect(lockReducer(authenticating, { type: 'auth-finished' }).authInFlight).toBe(false);
  });
});

describe('secure lock settings', () => {
  class Adapter implements SecureSettingsAdapter {
    value: string | null = null;
    failWrite = false;
    failRead = false;
    async getItem(key: string) {
      expect(key).toBe(LOCK_SETTINGS_KEY);
      if (this.failRead) throw new Error('read failed');
      return this.value;
    }
    async setItem(key: string, value: string) {
      expect(key).toBe(LOCK_SETTINGS_KEY);
      if (this.failWrite) throw new Error('write failed');
      this.value = value;
    }
    async deleteItem() { this.value = null; }
  }

  it('returns defaults when absent and closes fail-safe for unreadable existing settings', async () => {
    const adapter = new Adapter();
    const settings = createSecuritySettings(adapter);
    await expect(settings.get()).resolves.toEqual({ enabled: false, graceMs: 30_000, hidePreviews: false });
    adapter.value = '{';
    await expect(settings.get()).resolves.toEqual({ enabled: true, graceMs: 0, hidePreviews: true });
    adapter.value = '{"enabled":false,"graceMs":1,"hidePreviews":false,"other":1}';
    await expect(settings.get()).resolves.toEqual({ enabled: true, graceMs: 0, hidePreviews: true });
    adapter.value = '{"enabled":false,"graceMs":1,"hidePreviews":false}';
    await expect(settings.get()).resolves.toEqual({ enabled: true, graceMs: 0, hidePreviews: true });
    adapter.value = '{"enabled":true,"graceMs":30000,"hidePreviews":true}';
    await expect(settings.get()).resolves.toEqual({ enabled: true, graceMs: 30_000, hidePreviews: true });
    adapter.failRead = true;
    await expect(settings.get()).resolves.toEqual({ enabled: true, graceMs: 0, hidePreviews: true });
    adapter.failRead = false;
    await settings.set({ enabled: false, graceMs: 0, hidePreviews: false });
    await settings.remove();
    expect(adapter.value).toBeNull();
  });

  it('surfaces secure-store write failures', async () => {
    const adapter = new Adapter();
    adapter.failWrite = true;
    await expect(createSecuritySettings(adapter).set({ enabled: true, graceMs: 0, hidePreviews: true }))
      .rejects.toThrow('write failed');
  });
});

describe('authentication adapter mapping', () => {
  const base = {
    hasHardwareAsync: async () => true,
    isEnrolledAsync: async () => true,
    authenticateAsync: async () => ({ success: false, error: 'user_cancel' }),
  };
  it('detects capability and maps biometric results to plain-language outcomes', async () => {
    const auth = createAuthenticator(base);
    await expect(auth.getCapability()).resolves.toBe('ready');
    await expect(auth.authenticate('Unlock Wealth Wise')).resolves.toMatchObject({ ok: false, reason: 'cancelled' });
    await expect(createAuthenticator({ ...base, authenticateAsync: async () => ({ success: false, error: 'lockout' }) })
      .authenticate('Unlock Wealth Wise')).resolves.toMatchObject({ ok: false, reason: 'lockout' });
    await expect(createAuthenticator({ ...base, hasHardwareAsync: async () => false }).getCapability()).resolves.toBe('no-hardware');
    await expect(createAuthenticator({ ...base, isEnrolledAsync: async () => false }).getCapability()).resolves.toBe('not-enrolled');
    await expect(createAuthenticator({ ...base, authenticateAsync: async () => ({ success: true }) })
      .authenticate('Unlock Wealth Wise')).resolves.toEqual({ ok: true });
    const mapped: [string, string][] = [
      ['system_cancel', 'cancelled'], ['app_cancel', 'cancelled'], ['user_fallback', 'cancelled'],
      ['not_available', 'unavailable'], ['not_enrolled', 'unavailable'], ['passcode_not_set', 'unavailable'],
      ['invalid_context', 'unavailable'], ['not_recognized', 'failed'], ['authentication_failed', 'failed'],
      ['unknown-code', 'failed'], ['lockout', 'lockout'],
    ];
    for (const [error, reason] of mapped) {
      await expect(createAuthenticator({
        ...base,
        authenticateAsync: async () => ({ success: false, error }),
      }).authenticate('Unlock Wealth Wise')).resolves.toMatchObject({ ok: false, reason });
    }
    await expect(createAuthenticator({
      ...base,
      authenticateAsync: async () => { throw new Error('native error'); },
    }).authenticate('Unlock Wealth Wise')).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
  });
});
