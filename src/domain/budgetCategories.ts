import { budgetMonthView, BUDGET_GROUPS, type BudgetGroup } from './budget';
import { INVESTMENT_FORM_CATEGORIES, TRANSACTION_CATEGORIES } from './schemas';
import { normalizeMoney } from './cashFlow';
import type { AppData, ISODate } from './types';

export type BudgetCategoryChoice = {
  category: string;
  planned: number;
  actual: number;
};

export type BudgetCategoryChoiceSection = {
  id: BudgetGroup['id'];
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
  const view = budgetMonthView(data, month, today);
  return BUDGET_GROUPS.flatMap((group) => {
    const categories = group.categories.filter((category) => allowed.has(category))
      .map((category) => {
        const line = view.lines.find((item) => item.category === category);
        return {
          category,
          planned: normalizeMoney(line?.planned ?? 0),
          actual: normalizeMoney(line?.actual ?? 0),
        };
      })
      .sort((left, right) => Number(right.planned > 0) - Number(left.planned > 0)
        || group.categories.indexOf(left.category) - group.categories.indexOf(right.category));
    return categories.length === 0 ? [] : [{ id: group.id, name: group.name, categories }];
  });
}
