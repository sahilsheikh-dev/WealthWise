import type { ISODate } from './types';

export type ParsedISO = { y: number; m: number; d: number };

export function isValidISO(value: string): value is ISODate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function parseISO(value: string): ParsedISO {
  if (!isValidISO(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  const [y, m, d] = value.split('-').map(Number);
  return { y: y!, m: m!, d: d! };
}

function utcDate(value: ISODate): Date {
  const { y, m, d } = parseISO(value);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date): ISODate {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return (utcDate(to).getTime() - utcDate(from).getTime()) / 86_400_000;
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addDays(date: ISODate, days: number): ISODate {
  const result = utcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toISO(result);
}

function addCalendarMonths(date: ISODate, months: number): ISODate {
  const { y, m, d } = parseISO(date);
  const targetMonth = m - 1 + months;
  const targetYear = y + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return toISO(new Date(Date.UTC(targetYear, normalizedMonth, Math.min(d, lastDay))));
}

export function addMonths(date: ISODate, months: number): ISODate {
  return addCalendarMonths(date, months);
}

export function addYears(date: ISODate, years: number): ISODate {
  return addCalendarMonths(date, years * 12);
}

export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}

export function shiftMonth(key: string, delta: number): string {
  if (!/^\d{4}-\d{2}$/.test(key)) throw new RangeError(`Invalid month key: ${key}`);
  const [year, month] = key.split('-').map(Number);
  if (month! < 1 || month! > 12) throw new RangeError(`Invalid month key: ${key}`);
  const result = new Date(Date.UTC(year!, month! - 1 + delta, 1));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}`;
}
