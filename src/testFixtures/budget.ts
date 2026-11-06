import { defaultBudgetSectionIdFor, defaultBudgetSections } from '../domain/budget';
import type { BudgetItem, BudgetPlan, BudgetSection, MonthBudget } from '../domain/types';

type LineInput = {
  category: string;
  mode?: 'amount' | 'percent';
  value?: number;
  planned?: number;
  dueDay?: number;
  frequency?: BudgetItem['frequency'];
  firstDueMonth?: string;
};

export function budgetItemsFromLines(lines: readonly LineInput[], sections = defaultBudgetSections()): BudgetItem[] {
  return lines.map((line, index) => ({
    id: `fixture-item-${index + 1}`,
    sectionId: sections.some((section) => section.id === defaultBudgetSectionIdFor(line.category))
      ? defaultBudgetSectionIdFor(line.category)
      : sections.find((section) => section.type === 'spend' && section.system === undefined)?.id ?? 'survival',
    name: line.category,
    mode: line.mode ?? 'amount',
    value: line.value ?? line.planned ?? 0,
    frequency: line.frequency ?? 'monthly',
    ...(line.firstDueMonth === undefined ? {} : { firstDueMonth: line.firstDueMonth }),
    ...(line.dueDay === undefined ? {} : { dueDay: line.dueDay }),
  }));
}

export function budgetPlanFromLines(
  lines: readonly LineInput[],
  options: {
    incomes: BudgetPlan['incomes'];
    repeatMonthly?: boolean;
    repeatFrom?: string | null;
    sections?: BudgetSection[];
  },
): BudgetPlan {
  const sections = options.sections ?? defaultBudgetSections();
  return {
    incomes: options.incomes,
    sections,
    items: budgetItemsFromLines(lines, sections),
    repeatMonthly: options.repeatMonthly ?? false,
    repeatFrom: options.repeatFrom ?? null,
  };
}

export function monthBudgetFromLines(
  month: string,
  lines: readonly LineInput[],
  options: {
    incomes: MonthBudget['incomes'];
    source?: MonthBudget['source'];
    sections?: BudgetSection[];
    linkedIncluded?: boolean;
  },
): MonthBudget {
  const sections = options.sections ?? defaultBudgetSections();
  return {
    month,
    source: options.source ?? 'custom',
    incomes: options.incomes,
    sections,
    items: budgetItemsFromLines(lines, sections),
    ...(options.linkedIncluded === undefined ? {} : { linkedIncluded: options.linkedIncluded }),
  };
}

export function monthBudgetLines(budget: MonthBudget | null | undefined): { category: string; planned: number; dueDay?: number }[] {
  return (budget?.items ?? []).map((item) => ({
    category: item.name,
    planned: item.value,
    ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
  }));
}
