export const SQLITE_FALLBACK_WARNING =
  'Primary database unavailable; using backup local storage. Your data is preserved.';

let fallbackActive = false;
const listeners = new Set<() => void>();

/** Return whether SQLite has fallen back to legacy AsyncStorage in this session. */
export function isSQLiteFallbackActive(): boolean {
  return fallbackActive;
}

/** Mark SQLite fallback active and notify subscribers without losing logging/recovery state. */
export function markSQLiteFallbackActive(): void {
  if (fallbackActive) return;
  fallbackActive = true;
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribe to SQLite fallback activation; returns an unsubscribe callback. */
export function subscribeSQLiteFallback(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reset fallback state for unit tests. */
export function resetSQLiteFallbackForTests(): void {
  fallbackActive = false;
  listeners.clear();
}
