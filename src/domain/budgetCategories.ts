import {
  BUDGET_GROUPS,
  budgetGroupFor,
  budgetMonthView,
  defaultBudgetSections,
  defaultBudgetSectionIdFor,
  effectiveMonthBudget,
} from './budget';
import { INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from './schemas';
import { normalizeMoney } from './cashFlow';
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
    const requestedId = item?.sectionId ?? builtIn?.id ?? defaultBudgetSectionIdFor(category);
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
  return [...grouped.values()].map(({ section, categories }) => {
    categories.sort((left, right) =>
      Number(right.planned > 0) - Number(left.planned > 0)
      || (BUDGET_GROUPS.find((group) => group.id === section.id)?.categories.indexOf(left.category) ?? -1)
        - (BUDGET_GROUPS.find((group) => group.id === section.id)?.categories.indexOf(right.category) ?? -1)
      || (items.findIndex((item) => item.name === left.category) - items.findIndex((item) => item.name === right.category))
      || left.category.localeCompare(right.category));
    return { id: section.id, name: section.name, categories };
  });
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
