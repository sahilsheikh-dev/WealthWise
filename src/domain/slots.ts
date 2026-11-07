import type { ISODate } from './types';

export type ScheduleStatus = 'paid' | 'ongoing' | 'overdue' | 'upcoming';

export type ScheduleSlot = {
  id: string;
  index: number;
  dueDate: ISODate;
  nextDueDate: ISODate;
  amount: number;
};

export type SlotEntry = {
  id: string;
  date: ISODate;
  amount: number;
};

export type SlotRow = {
  id: string;
  index: number;
  dueDate: ISODate;
  amount: number;
  status: ScheduleStatus;
  paidOn?: ISODate;
  paidAmount?: number;
  entryId?: string;
  assumed?: boolean;
  interest?: number;
  principal?: number;
  balanceAfter?: number;
};

export type SlotSummary = {
  paid: number;
  ongoing: number;
  overdue: number;
  upcoming: number;
  nextDue: SlotRow | null;
  paidAmount: number;
  remainingPlanned: number;
};

export function generateSlots(
  count: number,
  firstIndex: number,
  dueDateAt: (index: number) => ISODate,
  amountAt: (index: number) => number,
  idAt: (index: number) => string,
): ScheduleSlot[] {
  return Array.from({ length: Math.max(0, count - firstIndex) }, (_, offset) => {
    const index = firstIndex + offset;
    return {
      id: idAt(index),
      index,
      dueDate: dueDateAt(index),
      nextDueDate: dueDateAt(index + 1),
      amount: amountAt(index),
    };
  });
}

export function matchEntriesFIFO<T extends SlotEntry>(
  slots: readonly ScheduleSlot[],
  entries: readonly T[],
): Map<number, T> {
  const orderedEntries = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const matches = new Map<number, T>();
  slots.forEach((slot, index) => {
    const entry = orderedEntries[index];
    if (entry) matches.set(slot.index, entry);
  });
  return matches;
}

export function classifySlot(dueDate: ISODate, nextDueDate: ISODate, asOf: ISODate): ScheduleStatus {
  if (dueDate > asOf) return 'upcoming';
  return asOf < nextDueDate ? 'ongoing' : 'overdue';
}

export function summarizeSlots(rows: readonly SlotRow[]): SlotSummary {
  const nextDue = rows.find((row) => row.status !== 'paid') ?? null;
  return {
    paid: rows.filter((row) => row.status === 'paid').length,
    ongoing: rows.filter((row) => row.status === 'ongoing').length,
    overdue: rows.filter((row) => row.status === 'overdue').length,
    upcoming: rows.filter((row) => row.status === 'upcoming').length,
    nextDue,
    paidAmount: rows.reduce((sum, row) => sum + (row.paidAmount ?? 0), 0),
    remainingPlanned: rows.reduce((sum, row) => sum + (row.status === 'paid' ? 0 : row.amount), 0),
  };
}
