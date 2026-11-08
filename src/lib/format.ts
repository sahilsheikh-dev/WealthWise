import type { ISODate } from '../domain/types';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const shortMonthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function groupIndianDigits(value: string): string {
  if (value.length <= 3) return value;
  const lastThree = value.slice(-3);
  const prefix = value.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${prefix},${lastThree}`;
}

export function formatINR(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${groupIndianDigits(String(rounded))}`;
}

export function formatINRShort(amount: number): string {
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absolute >= 10_000_000) return `${sign}₹${(absolute / 10_000_000).toFixed(2)} Cr`;
  if (absolute >= 100_000) return `${sign}₹${(absolute / 100_000).toFixed(2)} L`;
  return formatINR(amount);
}

export function formatDate(date: ISODate): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${shortMonthNames[(month ?? 1) - 1]} ${year}`;
}

export function formatMonth(month: string): string {
  const [year, index] = month.split('-').map(Number);
  return `${monthNames[(index ?? 1) - 1]} ${year}`;
}

// Inline examples: 0 -> ₹0; 12 -> ₹12; 1234 -> ₹1,234; 123456 -> ₹1,23,456; 1234567 -> ₹12,34,567; -12345678 -> -₹1,23,45,678.
