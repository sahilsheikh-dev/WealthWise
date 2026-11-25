import { router, type Href } from 'expo-router';

/** Extract a trimmed single string route param, or undefined if missing/blank. */
export function singleParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Close a modal/detail route safely, falling back to a safe route when opened via deep link. */
export function closeRouteSafely(fallback: Href = '/(tabs)'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
