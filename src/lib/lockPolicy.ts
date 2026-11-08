export const GRACE_OPTIONS = {
  immediate: 0,
  '30 seconds': 30_000,
  '5 minutes': 300_000,
} as const;

export type LockState = {
  locked: boolean;
  authInFlight: boolean;
  backgroundedAt: number | null;
};

export type LockEvent =
  | { type: 'cold-start'; enabled: boolean }
  | { type: 'background'; now: number }
  | { type: 'foreground'; enabled: boolean; now: number; graceMs: number }
  | { type: 'auth-start' }
  | { type: 'auth-success' }
  | { type: 'auth-finished' }
  | { type: 'settings-changed'; enabled: boolean };

export function shouldLockOnResume(input: {
  enabled: boolean;
  backgroundedAt: number | null;
  now: number;
  graceMs: number;
}): boolean {
  return input.enabled && (input.backgroundedAt === null || input.now - input.backgroundedAt >= input.graceMs);
}

export function lockReducer(state: LockState, event: LockEvent): LockState {
  switch (event.type) {
    case 'cold-start':
      return { ...state, locked: event.enabled, backgroundedAt: null };
    case 'background':
      return state.authInFlight ? state : { ...state, backgroundedAt: event.now };
    case 'foreground':
      if (state.authInFlight) return state;
      return {
        ...state,
        locked: shouldLockOnResume({
          enabled: event.enabled,
          backgroundedAt: state.backgroundedAt,
          now: event.now,
          graceMs: event.graceMs,
        }),
        backgroundedAt: null,
      };
    case 'auth-start':
      return { ...state, authInFlight: true };
    case 'auth-success':
      return { ...state, locked: false };
    case 'auth-finished':
      return { ...state, authInFlight: false };
    case 'settings-changed':
      return event.enabled ? state : { ...state, locked: false, authInFlight: false, backgroundedAt: null };
  }
}
