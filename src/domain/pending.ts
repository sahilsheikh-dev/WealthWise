import {
  budgetLineActual,
  effectiveMonthBudget,
} from './budget';
import { monthEndDate } from './cashFlow';
import { monthKey } from './dates';
import { investCategoryFor } from './links';
import { isInsuranceBudgetCategory, policyPremiumCategory } from './policyCategories';
import { policySchedule } from './policySchedule';
import { liabilitySchedule, planSchedule } from './schedule';
import type { AppData, ISODate, Transaction } from './types';

export type PendingStatus = 'overdue' | 'due-today' | 'upcoming' | 'planned';

export type PendingSource =
  | { kind: 'plan'; parentId: string; slotId: string }
  | { kind: 'liability'; parentId: string; slotId: string; paymentKind: 'EMI' | 'Payment' }
  | { kind: 'policy'; parentId: string; slotId: string }
  | { kind: 'budget'; category: string; type: 'expense' | 'invest' }
  | { kind: 'income'; incomeId: string };

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

  for (const policy of data.policies) {
    if (policy.status !== 'active') continue;
    const rows = policySchedule(policy, today).rows;
    const firstUnpaid = rows.find((row) => row.status !== 'paid');
    const category = policyPremiumCategory(policy.kind);
    for (const row of rows) {
      if (row.status === 'paid' || monthKey(row.dueDate) !== month) continue;
      items.push({
        id: `due:policy:${policy.id}:${row.id}`,
        kind: 'due',
        title: policy.name,
        category,
        amount: row.amount,
        dueDate: row.dueDate,
        status: dueStatus(row.dueDate, month, today),
        source: { kind: 'policy', parentId: policy.id, slotId: row.id },
        actionable: row.id === firstUnpaid?.id,
      });
    }
  }

  const budget = effectiveMonthBudget(data, month, today).budget;
  if (budget) {
    const earnedByCategory = new Map<string, number>();
    for (const transaction of data.transactions) {
      if (transaction.type !== 'income' || monthKey(transaction.date) !== month) continue;
      earnedByCategory.set(
        transaction.category,
        (earnedByCategory.get(transaction.category) ?? 0) + transaction.amount,
      );
    }
    for (const income of budget.incomes) {
      if (income.day === undefined) continue;
      const earned = earnedByCategory.get(income.category) ?? 0;
      const applied = Math.min(earned, income.amount);
      earnedByCategory.set(income.category, earned - applied);
      const remaining = Math.max(0, income.amount - applied);
      if (remaining === 0) continue;
      const dueDate = dueDateForLine(month, income.day);
      if (!dueDate) continue;
      items.push({
        id: `income:${month}:${income.id}`,
        kind: 'due',
        title: income.name,
        category: income.category,
        amount: remaining,
        dueDate,
        status: dueStatus(dueDate, month, today),
        source: { kind: 'income', incomeId: income.id },
        actionable: true,
      });
    }
    for (const item of budget.items) {
      const section = budget.sections.find((row) => row.id === item.sectionId);
      const manualInsurance = section?.system === 'insurance';
      if (item.name === 'EMI' || (isInsuranceBudgetCategory(item.name) && !manualInsurance)) continue;
      if (section?.system && !manualInsurance) continue;
      const type = section?.type === 'invest' ? 'invest' : 'expense';
      const category = item.name;
      if (instrumentCategories.has(category) || representedCategories.has(category)) continue;
      const planned = item.mode === 'amount'
        ? item.value
        : Math.round(item.value * budget.incomes.reduce((sum, income) => sum + income.amount, 0) / 100);
      const remaining = Math.max(0, planned - budgetLineActual(data, month, category, {
        excludePolicyPayments: true,
      }));
      if (remaining === 0) continue;
      const dueDate = dueDateForLine(month, item.dueDay);
      items.push({
        id: `budget:${month}:${item.id}`,
        kind: 'budget',
        title: category,
        category,
        amount: remaining,
        ...(dueDate === undefined ? {} : { dueDate }),
        status: dueDate === undefined ? 'planned' : dueStatus(dueDate, month, today),
        source: { kind: 'budget', category, type },
        actionable: true,
      });
    }
  }

  return items.sort(compareItems);
}

function dueDateForLine(month: string, dueDay: number | undefined): ISODate | undefined {
  if (dueDay === undefined) return undefined;
  const lastDay = Number(monthEndDate(month).slice(8, 10));
  return `${month}-${String(Math.min(dueDay, lastDay)).padStart(2, '0')}`;
}

export function pendingTransactionType(item: PendingItem): Transaction['type'] {
  if (item.source.kind === 'income') return 'income';
  if (item.source.kind === 'plan') return 'invest';
  if (item.source.kind === 'liability' || item.source.kind === 'policy') return 'expense';
  return item.source.type;
}

export function pendingActionLabel(type: Transaction['type']): 'Marked as paid' | 'Received' {
  return type === 'income' ? 'Received' : 'Marked as paid';
}
