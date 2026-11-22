import {
  BUDGET_GROUPS,
  budgetGroupFor,
  budgetMonthView,
  defaultBudgetSections,
  effectiveMonthBudget,
} from './budget';
import { INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from './schemas';
import { normalizeMoney } from './cashFlow';
import { sortItems, type SortSpec } from '../lib/sorting';
import type { AppData, BudgetSection, ISODate } from './types';

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

export function budgetCategoryChoiceSections(
  data: AppData,
  month: string,
  today: ISODate,
  type: 'expense' | 'invest',
  sortSpec?: SortSpec | null,
): BudgetCategoryChoiceSection[] {
  const allowed = new Set<string>(type === 'expense'
    ? TRANSACTION_CATEGORIES.expense
    : INVESTMENT_FORM_CATEGORIES);
  const { budget } = effectiveMonthBudget(data, month, today);
  const sections = budget?.sections ?? defaultBudgetSections();
  const items = budget?.items ?? [];
  const available = new Set([
    ...allowed,
    ...items.filter((item) => sections.find((section) => section.id === item.sectionId)?.type === (type === 'invest' ? 'invest' : 'spend'))
      .map((item) => item.name),
  ]);
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
  const sections = budgetCategoryChoiceSections(data, month, today, type);
  return sections.flatMap((section) => section.categories.map((category) => category.category));
}
