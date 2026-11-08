import { BUDGET_GROUPS, budgetLineActual, budgetGroupFor } from './budget';
import { monthKey } from './dates';
import { investCategoryFor } from './links';
import { liabilitySchedule, planSchedule } from './schedule';
import type { AppData, ISODate, Transaction } from './types';

export type PendingStatus = 'overdue' | 'due-today' | 'upcoming' | 'planned';

export type PendingSource =
  | { kind: 'plan'; parentId: string; slotId: string }
  | { kind: 'liability'; parentId: string; slotId: string; paymentKind: 'EMI' | 'Payment' }
  | { kind: 'budget'; category: string };

export type PendingItem = {
  id: string;
  kind: 'due' | 'budget';
  title: string;
  category: string;
  amount: number;
  dueDate?: ISODate;
  status: PendingStatus;
  source: PendingSource;
  actionable: boolean;
};

function validateMonth(month: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new RangeError(`Invalid month key: ${month}`);
  }
}

function dueStatus(dueDate: ISODate, month: string, today: ISODate): PendingStatus {
  if (month < monthKey(today) || dueDate < today) return 'overdue';
  if (dueDate === today) return 'due-today';
  return 'upcoming';
}

function compareItems(left: PendingItem, right: PendingItem): number {
  const order: Record<PendingStatus, number> = {
    overdue: 0,
    'due-today': 1,
    upcoming: 2,
    planned: 3,
  };
  return order[left.status] - order[right.status]
    || (left.dueDate ?? '').localeCompare(right.dueDate ?? '')
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id);
}

export function pendingItems(data: AppData, month: string, today: ISODate): PendingItem[] {
  validateMonth(month);
  const items: PendingItem[] = [];
  const representedCategories = new Set<string>();
  const instrumentCategories = new Set<string>(
    data.holdings.map((holding) => investCategoryFor(holding.type)),
  );

  for (const holding of data.holdings) {
    if (holding.kind !== 'plan') continue;
    const rows = planSchedule(holding, today).rows;
    const firstUnpaid = rows.find((row) => row.status !== 'paid');
    const category = investCategoryFor(holding.type);
    for (const row of rows) {
      if (row.status === 'paid' || monthKey(row.dueDate) !== month) continue;
      representedCategories.add(category);
      items.push({
        id: `due:plan:${holding.id}:${row.id}`,
        kind: 'due',
        title: holding.name,
        category,
        amount: row.amount,
        dueDate: row.dueDate,
        status: dueStatus(row.dueDate, month, today),
        source: { kind: 'plan', parentId: holding.id, slotId: row.id },
        actionable: row.id === firstUnpaid?.id,
      });
    }
  }

  for (const liability of data.liabilities) {
    if (liability.kind === 'one-time' && liability.dueDate === null) continue;
    const rows = liabilitySchedule(liability, today).rows;
    const firstUnpaid = rows.find((row) => row.status !== 'paid');
    for (const row of rows) {
      if (row.status === 'paid' || monthKey(row.dueDate) !== month) continue;
      items.push({
        id: `due:liability:${liability.id}:${row.id}`,
        kind: 'due',
        title: liability.name,
        category: 'EMI',
        amount: row.amount,
        dueDate: row.dueDate,
        status: dueStatus(row.dueDate, month, today),
        source: {
          kind: 'liability',
          parentId: liability.id,
          slotId: row.id,
          paymentKind: liability.kind === 'recurring' ? 'EMI' : 'Payment',
        },
        actionable: row.id === firstUnpaid?.id,
      });
    }
  }

  const budget = data.monthBudgets?.find((row) => row.month === month);
  if (budget) {
    for (const line of budget.lines) {
      if (line.category === 'EMI' || line.category === 'Insurance'
        || instrumentCategories.has(line.category)
        || representedCategories.has(line.category)) continue;
      const group = BUDGET_GROUPS.find((item) => item.categories.includes(line.category));
      if (!group) throw new Error(`No budget group is defined for category "${line.category}".`);
      const remaining = Math.max(0, line.planned - budgetLineActual(data, month, line.category));
      if (remaining === 0) continue;
      items.push({
        id: `budget:${month}:${line.category}`,
        kind: 'budget',
        title: line.category,
        category: line.category,
        amount: remaining,
        status: 'planned',
        source: { kind: 'budget', category: line.category },
        actionable: true,
      });
    }
  }

  return items.sort(compareItems);
}

export function pendingTransactionType(item: PendingItem): Transaction['type'] {
  if (item.source.kind === 'plan') return 'invest';
  if (item.source.kind === 'liability') return 'expense';
  const group = budgetGroupFor(item.category);
  if (!group) throw new Error(`No budget group is defined for category "${item.category}".`);
  return group.id === 'savings-investments' ? 'invest' : 'expense';
}
