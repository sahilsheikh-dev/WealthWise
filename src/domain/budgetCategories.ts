import {
  BUDGET_GROUPS,
  budgetGroupFor,
  budgetMonthView,
  defaultBudgetSections,
  effectiveMonthBudget,
  monthlyCommitments,
} from './budget';
import { INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from './schemas';
import { isInsuranceBudgetCategory } from './policyCategories';
import { pendingItems, pendingTransactionType } from './pending';
import { normalizeMoney } from './cashFlow';
import { sortItems, type SortSpec } from '../lib/sorting';
import type { AppData, BudgetItem, BudgetSection, ISODate, Transaction } from './types';

export type BudgetCategoryChoice = {
  category: string;
  planned: number;
  actual: number;
};

export type BudgetCategoryChoiceSection = {
  id: string;
  name: string;
  categories: BudgetCategoryChoice[];
};

export type BudgetCategoryChoiceOptions = {
  limitExpenseToCreatedOrApplicable?: boolean;
  existingCategory?: string;
};

export function budgetCategoryChoiceSections(
  data: AppData,
  month: string,
  today: ISODate,
  type: 'expense' | 'invest',
  sortSpec?: SortSpec | null,
  options: BudgetCategoryChoiceOptions = {},
): BudgetCategoryChoiceSection[] {
  const { budget } = effectiveMonthBudget(data, month, today);
  const sections = budget?.sections ?? data.budgetPlan?.sections ?? defaultBudgetSections();
  const items = (budget?.items && budget.items.length > 0)
    ? budget.items
    : (data.budgetPlan?.items ?? []);

  let available: Set<string>;
  if (type === 'expense' && options.limitExpenseToCreatedOrApplicable) {
    const createdSpendItems = items
      .filter((item) => sections.find((section) => section.id === item.sectionId)?.type === 'spend')
      .map((item) => item.name);
    const commitments = monthlyCommitments(data, month);
    const applicableScheduled = new Set<string>();
    if (commitments.some((c) => c.category === 'EMI')) {
      applicableScheduled.add('EMI');
    }
    for (const c of commitments) {
      if (isInsuranceBudgetCategory(c.category)) {
        applicableScheduled.add(c.category);
      }
    }
    const dues = pendingItems(data, month, today);
    for (const due of dues) {
      if (pendingTransactionType(due) === 'expense') {
        applicableScheduled.add(due.category);
      }
    }
    available = new Set([
      ...createdSpendItems,
      ...applicableScheduled,
      ...(options.existingCategory && options.existingCategory !== '__custom-expense-category__'
        ? [options.existingCategory]
        : []),
    ]);
  } else {
    const allowed = new Set<string>(type === 'expense'
      ? TRANSACTION_CATEGORIES.expense
      : INVESTMENT_FORM_CATEGORIES);
    available = new Set([
      ...allowed,
      ...items.filter((item) => sections.find((section) => section.id === item.sectionId)?.type === (type === 'invest' ? 'invest' : 'spend'))
        .map((item) => item.name),
    ]);
  }
  const view = budgetMonthView(data, month, today);
  const grouped = new Map<string, { section: BudgetSection; categories: BudgetCategoryChoice[] }>();
  for (const category of available) {
    const item = items.find((row) => row.name === category);
    const builtIn = budgetGroupFor(category);
    const requestedId = item?.sectionId ?? builtIn?.id;
    const section = sections.find((row) => row.id === requestedId)
      ?? sections.find((row) => row.type === (type === 'invest' ? 'invest' : 'spend') && row.system === undefined)
      ?? { id: 'other-not-in-budget', name: 'Other (not in budget)', type: type === 'invest' ? 'invest' as const : 'spend' as const };
    if (!grouped.has(section.id)) grouped.set(section.id, { section, categories: [] });
    const line = view.lines.find((row) => row.category === category);
    grouped.get(section.id)?.categories.push({
      category,
      planned: normalizeMoney(line?.planned ?? 0),
      actual: normalizeMoney(line?.actual ?? 0),
    });
  }
  const rawSections = [...grouped.values()]
    .map(({ section, categories }) => {
      const sortedCategories = sortSpec
        ? sortItems(
            categories.map((c) => ({
              ...c,
              name: c.category,
              percentUsed: c.planned === 0 ? (c.actual === 0 ? 0 : null) : (c.actual / c.planned) * 100,
            })),
            'budgetSpending',
            sortSpec,
          ).map(({ category, planned, actual }) => ({ category, planned, actual }))
        : [...categories].sort((left, right) => {
            const categoryOrder = (category: string) => {
              const itemIndex = items.findIndex((item) =>
                item.sectionId === section.id && item.name === category,
              );
              const builtInIndex = BUDGET_GROUPS.flatMap((group) => group.categories).indexOf(category);
              if (itemIndex >= 0) return itemIndex;
              return 1_000 + Math.max(0, builtInIndex);
            };
            return categoryOrder(left.category) - categoryOrder(right.category);
          });
      const plannedSum = normalizeMoney(categories.reduce((total, c) => total + c.planned, 0));
      const actualSum = normalizeMoney(categories.reduce((total, c) => total + c.actual, 0));
      return {
        id: section.id,
        name: section.name,
        planned: plannedSum,
        actual: actualSum,
        percentUsed: plannedSum === 0 ? (actualSum === 0 ? 0 : null) : (actualSum / plannedSum) * 100,
        originalIndex: sections.indexOf(section),
        categories: sortedCategories,
      };
    });

  if (sortSpec) {
    return sortItems(rawSections, 'budgetSpending', sortSpec)
      .map(({ id, name, categories }) => ({ id, name, categories }));
  }

  return rawSections
    .sort((left, right) => left.originalIndex - right.originalIndex)
    .map(({ id, name, categories }) => ({ id, name, categories }));
}

export function budgetItemCategoriesForTransaction(
  data: AppData,
  month: string,
  today: ISODate,
  type: 'expense' | 'invest',
): string[] {
  const sections = budgetCategoryChoiceSections(data, month, today, type, undefined, {
    limitExpenseToCreatedOrApplicable: type === 'expense',
  });
  return sections.flatMap((section) => section.categories.map((category) => category.category));
}

export function budgetItemForTransaction(
  data: AppData,
  transaction: Transaction,
): BudgetItem | undefined {
  const month = transaction.date.slice(0, 7);
  const { budget } = effectiveMonthBudget(data, month, transaction.date);
  if (!budget) return undefined;

  if (transaction.source?.kind === 'holding-entry') {
    const matchingItems = budget.items.filter((item) => item.holdingId === transaction.source?.parentId);
    if (matchingItems.length === 1) return matchingItems[0];
    const holding = data.holdings.find((h) => h.id === transaction.source?.parentId);
    const entry = holding?.logs.find((e) => e.id === transaction.source?.entryId);
    return matchingItems.find((item) => item.name === entry?.note || item.name === transaction.note);
  }

  const direct = budget.items.find((item) => item.name === transaction.category);
  if (direct) return direct;

  const allItems = [...(data.budgetPlan?.items ?? []), ...(data.monthBudgets ?? []).flatMap((m) => m.items)];
  const oldItem = allItems.find((item) => item.name === transaction.category);
  return oldItem ? budget.items.find((item) => item.id === oldItem.id) : undefined;
}

export function reconcileBudgetItemTransactions(data: AppData): AppData {
  const allItems = [...(data.budgetPlan?.items ?? []), ...(data.monthBudgets ?? []).flatMap((m) => m.items)];
  const namesById = new Map<string, Set<string>>();
  for (const item of allItems) {
    let set = namesById.get(item.id);
    if (!set) {
      set = new Set();
      namesById.set(item.id, set);
    }
    set.add(item.name);
  }

  const renamed = new Map<string, Set<string>>();
  for (const [id, names] of namesById) {
    if (names.size > 1) renamed.set(id, names);
  }
  if (renamed.size === 0) return data;

  let changed = false;
  const nextTransactions = data.transactions.map((tx) => {
    const month = tx.date.slice(0, 7);
    const { budget } = effectiveMonthBudget(data, month, tx.date);
    if (!budget) return tx;

    for (const [itemId, names] of renamed) {
      if (names.has(tx.category)) {
        const currentItem = budget.items.find((i) => i.id === itemId);
        if (currentItem && currentItem.name !== tx.category) {
          changed = true;
          return {
            ...tx,
            category: currentItem.name,
            note: tx.note === tx.category ? currentItem.name : tx.note,
          };
        }
      }
    }
    return tx;
  });

  return changed ? { ...data, transactions: nextTransactions } : data;
}

export { budgetGroupFor };
