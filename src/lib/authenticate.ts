export type AuthErrorCode =
  | 'user_cancel' | 'system_cancel' | 'app_cancel' | 'user_fallback' | 'lockout'
  | 'not_available' | 'not_enrolled' | 'passcode_not_set' | 'invalid_context'
  | 'not_recognized' | 'authentication_failed' | 'unknown';

export type AuthenticationAdapter = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  authenticateAsync: (options: { promptMessage: string; disableDeviceFallback: boolean }) =>
    Promise<{ success: boolean; error?: string }>;
};

export type AuthResult =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'lockout' | 'failed' | 'unavailable'; message: string };

export function createAuthenticator(adapter: AuthenticationAdapter) {
  return {
    async getCapability(): Promise<'ready' | 'no-hardware' | 'not-enrolled'> {
      if (!(await adapter.hasHardwareAsync())) return 'no-hardware';
      if (!(await adapter.isEnrolledAsync())) return 'not-enrolled';
      return 'ready';
    },
    async authenticate(promptMessage: string): Promise<AuthResult> {
      try {
        const result = await adapter.authenticateAsync({ promptMessage, disableDeviceFallback: false });
        if (result.success) return { ok: true };
        switch (result.error as AuthErrorCode | undefined) {
          case 'user_cancel':
          case 'system_cancel':
          case 'app_cancel':
          case 'user_fallback':
            return { ok: false, reason: 'cancelled', message: 'Unlock was cancelled. Try again when you are ready.' };
          case 'lockout':
            return { ok: false, reason: 'lockout', message: 'Too many attempts. Try again later or use your device passcode.' };
          case 'not_available':
          case 'not_enrolled':
          case 'passcode_not_set':
          case 'invalid_context':
            return { ok: false, reason: 'unavailable', message: "Device security isn't available right now." };
          case 'authentication_failed':
          case 'not_recognized':
          case 'unknown':
          default:
            return { ok: false, reason: 'failed', message: 'We could not verify your identity. Try again.' };
        }
      } catch {
        return { ok: false, reason: 'unavailable', message: 'Device authentication is unavailable right now.' };
      }
    },
  };
}
