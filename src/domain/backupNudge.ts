import { daysBetween } from './dates';
import type { ISODate } from './types';

export function shouldNudge(input: {
  recordCount: number;
  lastExportAt?: string;
  nudgeDismissedUntil?: ISODate;
  today: ISODate;
}): { show: boolean; reason: 'never' | 'stale' | null; days: number | null } {
  if (input.recordCount < 5 || (input.nudgeDismissedUntil && input.today <= input.nudgeDismissedUntil)) {
    return { show: false, reason: null, days: null };
  }
  if (!input.lastExportAt) return { show: true, reason: 'never', days: null };
  const exportedDay = input.lastExportAt.slice(0, 10);
  const days = daysBetween(exportedDay, input.today);
  return days > 30
    ? { show: true, reason: 'stale', days }
    : { show: false, reason: null, days: null };
}
