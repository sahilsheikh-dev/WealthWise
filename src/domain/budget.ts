import { liabilitySchedule, planSchedule } from './schedule';
import { policySchedule } from './policySchedule';
import { investCategoryFor } from './links';
import { monthEndDate, monthPositionAt, normalizeMoney } from './cashFlow';
import { monthKey, shiftMonth } from './dates';
import { BUDGET_CATEGORIES, NON_EARNED_INCOME_CATEGORIES } from './schemas';
import { EARNED_INCOME_CATEGORIES } from './types';
import { formatINR } from '../lib/format';
import { BUDGET_GROUPS, budgetGroupFor, type BudgetGroup } from './budgetGroups';
import { isInsuranceBudgetCategory, policyPremiumCategory } from './policyCategories';
import type { ScheduleRow } from './schedule';
import type {
  AppData,
  BudgetItem,
  BudgetItemFrequency,
  BudgetSection,
  EarnedIncomeCategory,
  BudgetIncomeItem,
  BudgetLine,
  BudgetPlan,
  ISODate,
  MonthBudget,
  Transaction,
} from './types';
export { BUDGET_CATEGORIES };
const BUILT_IN_BUDGET_CATEGORY_SET = new Set<string>(BUDGET_CATEGORIES);

export type BudgetCommitment = {
  kind: 'plan' | 'liability' | 'policy';
  id: string;
  name: string;
  category: string;
  dueDate: ISODate;
  plannedAmount: number;
  status: 'paid' | 'overdue' | 'ongoing' | 'upcoming';
  paidAmount: number;
};

export type LinkedRecurringRow = {
  kind: 'plan' | 'liability' | 'policy';
  id: string;
  parentId: string;
  entryId?: string;
  name: string;
  category: string;
  amount: number;
  dueDate: ISODate;
  status: BudgetCommitment['status'];
};

export { BUDGET_GROUPS, budgetGroupFor };
export type { BudgetGroup };

const SYSTEM_BUDGET_SECTIONS: readonly BudgetSection[] = [
  { id: 'income', name: 'Income', type: 'spend', system: 'income' },
  { id: 'debt-repayments', name: 'Debt repayments', type: 'spend', system: 'debt' },
  { id: 'insurance', name: 'Insurance', type: 'spend', system: 'insurance' },
];

export function defaultBudgetSections(): BudgetSection[] {
  return [
    ...BUDGET_GROUPS.map((group) => ({
      id: group.id,
      name: group.name,
      type: group.id === 'savings-investments' ? 'invest' as const : 'spend' as const,
    })),
    ...SYSTEM_BUDGET_SECTIONS.map((section) => ({ ...section })),
  ];
}

export function createDefaultBudgetPlan(monthInput: string): BudgetPlan {
  const month = monthOf(monthInput);
  return {
    incomes: [],
    sections: defaultBudgetSections(),
    items: [],
    repeatMonthly: true,
    repeatFrom: month,
  };
}

export function defaultBudgetSectionIdFor(category: string): string {
  return budgetGroupFor(category)?.id ?? 'survival';
}

const INVESTMENT_CATEGORIES = new Set(BUDGET_GROUPS[1]?.categories ?? []);

function isEarnedIncomeCategory(category: string): category is EarnedIncomeCategory {
  return (EARNED_INCOME_CATEGORIES as readonly string[]).includes(category);
}

function isInvestmentCategory(category: string): boolean {
  return INVESTMENT_CATEGORIES.has(category);
}

function isInvestmentCategoryForBudget(
  budget: Pick<MonthBudget, 'sections' | 'items'> | null,
  category: string,
): boolean {
  const item = budget?.items.find((row) => row.name === category);
  if (item) return budget?.sections.find((section) => section.id === item.sectionId)?.type === 'invest';
  return defaultBudgetSectionIdFor(category) === 'savings-investments' || isInvestmentCategory(category);
}

function budgetCategoryForTransaction(transaction: Transaction, customCategories: ReadonlySet<string> = new Set()): string {
  return transaction.type === 'invest' && !INVESTMENT_CATEGORIES.has(transaction.category)
    && !customCategories.has(transaction.category)
    ? 'Other investments'
    : transaction.category;
}

export function customBudgetCategories(data: AppData): ReadonlySet<string> {
  return new Set([
    ...(data.budgetPlan?.items.map((item) => item.name) ?? []),
    ...(data.monthBudgets ?? []).flatMap((budget) => budget.items.map((item) => item.name)),
    ...data.transactions
      .filter((transaction) =>
        (transaction.type === 'expense' || transaction.type === 'invest')
        && !BUILT_IN_BUDGET_CATEGORY_SET.has(transaction.category),
      )
      .map((transaction) => transaction.category),
  ]);
}

function monthOf(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12) {
    throw new RangeError(`Invalid month key: ${month}`);
  }
  return month;
}

function frequencyStep(frequency: BudgetItemFrequency): number {
  if (frequency === 'quarterly') return 3;
  if (frequency === 'half-yearly') return 6;
  if (frequency === 'yearly') return 12;
  return 1;
}

function monthOrdinal(month: string): number {
  const key = monthOf(month);
  return Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;
}

function monthFromOrdinal(ordinal: number): string {
  const year = Math.floor(ordinal / 12);
  const month = ordinal % 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

export function isItemDueInMonth(item: BudgetItem, month: string): boolean {
  const monthIndex = monthOrdinal(month);
  const frequency = item.frequency ?? 'monthly';
  if (frequency === 'monthly') return true;
  if (!item.firstDueMonth) {
    throw new BudgetMutationError('invalid-frequency', 'Choose the first due month for a recurring item.');
  }
  const firstDueIndex = monthOrdinal(item.firstDueMonth);
  const difference = monthIndex - firstDueIndex;
  return difference >= 0 && difference % frequencyStep(frequency) === 0;
}

export function plannedForMonth(item: BudgetItem, month: string): number {
  return isItemDueInMonth(item, month) ? item.value : 0;
}

export function nextDueMonth(item: BudgetItem, month: string): string {
  const currentIndex = monthOrdinal(month);
  const frequency = item.frequency ?? 'monthly';
  if (frequency === 'monthly') return monthFromOrdinal(currentIndex + 1);
  if (!item.firstDueMonth) {
    throw new BudgetMutationError('invalid-frequency', 'Choose the first due month for a recurring item.');
  }
  const firstDueIndex = monthOrdinal(item.firstDueMonth);
  if (currentIndex < firstDueIndex) return item.firstDueMonth;
  const step = frequencyStep(frequency);
  const elapsed = currentIndex - firstDueIndex;
  return monthFromOrdinal(firstDueIndex + (Math.floor(elapsed / step) + 1) * step);
}

function orderedRows<T extends { dueDate: ISODate }>(rows: T[]): T[] {
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function monthlyCommitments(data: AppData, month: string): BudgetCommitment[] {
  monthOf(month);
  const asOf = monthEndDate(month);
  const rows: BudgetCommitment[] = [];
  for (const holding of data.holdings) {
    if (holding.kind !== 'plan') continue;
    for (const row of planSchedule(holding, asOf).rows) {
      if (monthKey(row.dueDate) !== month) continue;
      rows.push({
        kind: 'plan', id: holding.id, name: holding.name,
        category: investCategoryFor(holding.type),
        dueDate: row.dueDate, plannedAmount: row.amount, status: row.status,
        paidAmount: row.paidAmount ?? 0,
      });
    }
  }
  for (const liability of data.liabilities) {
    if (liability.kind === 'one-time' && liability.dueDate === null) continue;
    for (const row of liabilitySchedule(liability, asOf).rows) {
      if (monthKey(row.dueDate) !== month) continue;
      rows.push({
        kind: 'liability', id: liability.id, name: liability.name, category: 'EMI',
        dueDate: row.dueDate, plannedAmount: row.amount, status: row.status,
        paidAmount: liability.kind === 'one-time'
          ? liability.payments.filter((payment) => payment.date <= asOf)
            .reduce((sum, payment) => sum + payment.amount, 0)
          : row.paidAmount ?? 0,
      });
    }
  }
  for (const policy of data.policies) {
    for (const row of policySchedule(policy, asOf).rows) {
      if (monthKey(row.dueDate) !== month) continue;
      rows.push({
        kind: 'policy', id: policy.id, name: policy.name, category: policyPremiumCategory(policy.kind),
        dueDate: row.dueDate, plannedAmount: row.amount, status: row.status,
        paidAmount: row.paidAmount ?? 0,
      });
    }
  }
  return orderedRows(rows);
}

function linkedRowsFor(
  kind: LinkedRecurringRow['kind'],
  parentId: string,
  name: string,
  category: string,
  month: string,
  rows: ScheduleRow[],
): LinkedRecurringRow[] {
  return rows.flatMap((row) => row.amount <= 0 || monthKey(row.dueDate) !== month
    ? []
    : [{
      kind,
      id: `${kind}:${parentId}:${row.id}`,
      parentId,
      ...(row.entryId === undefined ? {} : { entryId: row.entryId }),
      name,
      category,
      amount: row.amount,
      dueDate: row.dueDate,
      status: row.status,
    }]);
}

export function linkedRecurringForMonth(data: AppData, month: string, asOf: ISODate): LinkedRecurringRow[] {
  const key = monthOf(month);
  const rows: LinkedRecurringRow[] = [];
  for (const holding of data.holdings) {
    if (holding.kind !== 'plan') continue;
    rows.push(...linkedRowsFor(
      'plan', holding.id, holding.name, investCategoryFor(holding.type), key, planSchedule(holding, asOf).rows,
    ));
  }
  for (const liability of data.liabilities) {
    if (liability.kind === 'one-time' && liability.dueDate === null) continue;
    rows.push(...linkedRowsFor(
      'liability', liability.id, liability.name, 'EMI', key, liabilitySchedule(liability, asOf).rows,
    ));
  }
  for (const policy of data.policies) {
    rows.push(...linkedRowsFor(
      'policy', policy.id, policy.name, policyPremiumCategory(policy.kind), key, policySchedule(policy, asOf).rows,
    ));
  }
  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate)
    || a.name.localeCompare(b.name)
    || a.kind.localeCompare(b.kind)
    || a.id.localeCompare(b.id));
}

export class MissingPlannedIncomeError extends Error {
  constructor() {
    super('A planned income is required to resolve percentage budget lines.');
    this.name = 'MissingPlannedIncomeError';
  }
}

export function plannedIncomeOf(value: { incomes: readonly BudgetIncomeItem[] }): number {
  return value.incomes.reduce((total, income) => total + income.amount, 0);
}

export function resolveBudgetPlan(
  plan: Pick<BudgetPlan, 'incomes' | 'sections' | 'items'>,
  plannedIncome: number | null = plan.incomes.length > 0 ? plannedIncomeOf(plan) : null,
  month?: string,
  frozenSnapshot = false,
): BudgetLine[] {
  return plan.items.map((item) => {
    const itemValue = month === undefined
      ? item.value
      : plannedForMonth(frozenSnapshot ? { ...item, frequency: 'monthly' } : item, month);
    const line = {
      category: item.name,
      mode: item.mode,
      value: itemValue,
      dueDay: item.dueDay,
    };
    if (line.mode === 'amount') {
      return {
        category: line.category,
        planned: line.value,
        ...(line.dueDay === undefined ? {} : { dueDay: line.dueDay }),
      };
    }
    if (plannedIncome === null) throw new MissingPlannedIncomeError();
    return {
      category: line.category,
      planned: Math.round(line.value * plannedIncome / 100),
      ...(line.dueDay === undefined ? {} : { dueDay: line.dueDay }),
    };
  });
}

function monthRows(data: AppData): MonthBudget[] {
  return data.monthBudgets ?? [];
}

function replaceMonth(data: AppData, budget: MonthBudget): AppData {
  return {
    ...data,
    monthBudgets: [...monthRows(data).filter((row) => row.month !== budget.month), budget]
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export function setBudgetPlan(data: AppData, plan: BudgetPlan | null): AppData {
  return { ...data, budgetPlan: plan };
}

export function applyBudgetPlanToMonth(
  data: AppData,
  monthInput: string,
  options: { newId: () => string; today: ISODate },
): AppData {
  const month = monthOf(monthInput);
  void options.newId;
  void options.today;
  const plan = data.budgetPlan;
  if (!plan) return data;
  const plannedIncome = plan.incomes.length > 0 ? plannedIncomeOf(plan) : null;
  const lines = new Map(resolveBudgetPlan(plan, plannedIncome, month).map((line) => [line.category, line]));
  return replaceMonth(data, {
    month,
    source: 'plan',
    incomes: plan.incomes.map((income) => ({ ...income })),
    sections: plan.sections.map((section) => ({ ...section })),
    items: plan.items.map((item) => ({
      ...item,
      mode: 'amount' as const,
      value: lines.get(item.name)?.planned ?? 0,
    })),
    linkedIncluded: true,
  });
}

export function effectiveMonthBudget(
  data: AppData,
  monthInput: string,
  today: ISODate,
): { budget: MonthBudget | null; virtual: boolean } {
  const month = monthOf(monthInput);
  const stored = monthRows(data).find((row) => row.month === month);
  if (stored) return { budget: stored, virtual: false };
  const currentMonth = monthKey(today);
  const monthDistance = (Number(month.slice(0, 4)) - Number(currentMonth.slice(0, 4))) * 12
    + Number(month.slice(5, 7)) - Number(currentMonth.slice(5, 7));
  const plan = data.budgetPlan;
  if (!plan || !plan.repeatMonthly || !plan.repeatFrom
    || month <= currentMonth || month < plan.repeatFrom || monthDistance > 24) {
    return { budget: null, virtual: false };
  }
  if (plan.incomes.length === 0 && plan.items.some((item) => item.mode === 'percent')) {
    return { budget: null, virtual: false };
  }
  const lines = resolveBudgetPlan(plan, undefined, month);
  return {
    budget: {
      month,
      source: 'plan',
      incomes: plan.incomes.map((income) => ({ ...income })),
      sections: plan.sections.map((section) => ({ ...section })),
      items: plan.items.map((item) => ({
        ...item,
        mode: 'amount',
        value: lines.find((line) => line.category === item.name)?.planned ?? 0,
      })),
      linkedIncluded: true,
    },
    virtual: true,
  };
}

export type BudgetItemSource =
  | { kind: 'line'; category: string }
  | { kind: 'income'; incomeId: string; category: EarnedIncomeCategory };

export type BudgetItemScope = 'month' | 'following';

export type BudgetItemValues = { amount: number; dueDay?: number };

function validateBudgetItemValues(values: BudgetItemValues): BudgetItemValues {
  if (!Number.isFinite(values.amount) || values.amount < 0 || values.amount > 1_000_000_000) {
    throw new RangeError('Planned amount must be between 0 and 1,000,000,000.');
  }
  if (values.dueDay !== undefined
    && (!Number.isInteger(values.dueDay) || values.dueDay < 1 || values.dueDay > 31)) {
    throw new RangeError('Due day must be between 1 and 31.');
  }
  return {
    amount: normalizeMoney(values.amount),
    ...(values.dueDay === undefined ? {} : { dueDay: values.dueDay }),
  };
}

function updateBudgetItemInMonth(
  budget: MonthBudget,
  source: BudgetItemSource,
  values: BudgetItemValues,
  remove: boolean,
): MonthBudget {
  if (source.kind === 'line') {
    const existing = budget.items.find((item) => item.name === source.category);
    const nextItem: BudgetItem = {
      id: existing?.id ?? `item:${source.category}`,
      sectionId: existing?.sectionId ?? defaultBudgetSectionIdFor(source.category),
      name: source.category,
      mode: 'amount',
      value: values.amount,
      frequency: existing?.frequency ?? 'monthly',
      ...(existing?.firstDueMonth === undefined ? {} : { firstDueMonth: existing.firstDueMonth }),
      ...(values.dueDay === undefined ? {} : { dueDay: values.dueDay }),
    };
    const items = remove
      ? budget.items.filter((item) => item.name !== source.category)
      : existing
        ? budget.items.map((item) => item.name === source.category ? nextItem : item)
        : [...budget.items, nextItem];
    return { ...budget, items };
  }

  const existing = budget.incomes.find((income) => income.id === source.incomeId);
  if (!existing) throw new Error(`Budget income "${source.incomeId}" was not found.`);
  return {
    ...budget,
    incomes: remove
      ? budget.incomes.filter((income) => income.id !== source.incomeId)
      : budget.incomes.map((income) => income.id === source.incomeId
        ? updateIncomeValues(income, values)
        : income),
  };
}

function updateIncomeValues(income: BudgetIncomeItem, values: BudgetItemValues): BudgetIncomeItem {
  const updated = { ...income, amount: values.amount };
  if (values.dueDay === undefined) {
    const { day: removedDay, ...withoutDay } = updated;
    void removedDay;
    return withoutDay;
  }
  return { ...updated, day: values.dueDay };
}

function snapshotAsPlan(budget: MonthBudget): BudgetPlan {
  return {
    incomes: budget.incomes.map((income) => ({ ...income })),
    sections: budget.sections.map((section) => ({ ...section })),
    items: budget.items.map((item) => ({ ...item })),
    repeatMonthly: false,
    repeatFrom: null,
  };
}

function updateBudgetItemInPlan(
  plan: BudgetPlan,
  source: BudgetItemSource,
  values: BudgetItemValues,
  remove: boolean,
  base: MonthBudget,
): BudgetPlan {
  if (source.kind === 'line') {
    const existing = plan.items.find((item) => item.name === source.category);
    const nextItem: BudgetItem = {
      id: existing?.id ?? `item:${source.category}`,
      sectionId: existing?.sectionId ?? defaultBudgetSectionIdFor(source.category),
      name: source.category,
      mode: 'amount',
      value: values.amount,
      frequency: existing?.frequency ?? 'monthly',
      ...(existing?.firstDueMonth === undefined ? {} : { firstDueMonth: existing.firstDueMonth }),
      ...(values.dueDay === undefined ? {} : { dueDay: values.dueDay }),
    };
    const items = remove
      ? plan.items.filter((item) => item.name !== source.category)
      : existing
        ? plan.items.map((item) => item.name === source.category ? nextItem : item)
        : [...plan.items, nextItem];
    return { ...plan, items };
  }

  const inPlan = plan.incomes.some((income) => income.id === source.incomeId);
  const inBase = base.incomes.find((income) => income.id === source.incomeId);
  if (!inPlan && !inBase) throw new Error(`Budget income "${source.incomeId}" was not found.`);
  let incomes = plan.incomes.filter((income) => income.id !== source.incomeId);
  if (!remove) {
    const income = inPlan
      ? plan.incomes.find((item) => item.id === source.incomeId)
      : inBase;
    if (!income) throw new Error(`Budget income "${source.incomeId}" was not found.`);
    const updatedIncome = updateIncomeValues(income, values);
    incomes = inPlan
      ? plan.incomes.map((item) => item.id === source.incomeId ? updatedIncome : item)
      : [...incomes, updatedIncome];
  }
  return { ...plan, incomes };
}

function updateBudgetItem(
  data: AppData,
  monthInput: string,
  source: BudgetItemSource,
  values: BudgetItemValues,
  scope: BudgetItemScope,
  today: ISODate,
  remove: boolean,
): AppData {
  const month = monthOf(monthInput);
  const normalizedValues = validateBudgetItemValues(values);
  const stored = monthRows(data).find((row) => row.month === month);
  const { budget } = effectiveMonthBudget(data, month, today);
  if (!budget) throw new Error(`There is no budget to edit for ${month}.`);

  if (scope === 'month') {
    const edited = updateBudgetItemInMonth(
      { ...budget, source: 'custom' },
      source,
      normalizedValues,
      remove,
    );
    return replaceMonth(data, edited);
  }

  const plan = updateBudgetItemInPlan(
    data.budgetPlan ?? snapshotAsPlan(budget),
    source,
    normalizedValues,
    remove,
    budget,
  );
  if (!stored) return { ...data, budgetPlan: plan };
  const edited = updateBudgetItemInMonth(stored, source, normalizedValues, remove);
  return {
    ...data,
    budgetPlan: plan,
    monthBudgets: monthRows(data).map((row) => row.month === month ? edited : row),
  };
}

export function editBudgetItem(
  data: AppData,
  month: string,
  source: BudgetItemSource,
  values: BudgetItemValues,
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  return updateBudgetItem(data, month, source, values, scope, today, false);
}

export function removeBudgetItem(
  data: AppData,
  month: string,
  source: BudgetItemSource,
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  return updateBudgetItem(data, month, source, { amount: 0 }, scope, today, true);
}

export type BudgetMutationErrorCode =
  | 'invalid-name'
  | 'duplicate-name'
  | 'reserved-category'
  | 'section-not-found'
  | 'system-section'
  | 'section-not-empty'
  | 'item-not-found'
  | 'item-limit'
  | 'section-limit'
  | 'invalid-item'
  | 'invalid-frequency'
  | 'percent-only-monthly';

export class BudgetMutationError extends Error {
  constructor(readonly code: BudgetMutationErrorCode, message: string) {
    super(message);
    this.name = 'BudgetMutationError';
  }
}

export type BudgetSectionInput = Pick<BudgetSection, 'name' | 'type'> & { id: string };
export type BudgetItemInput = BudgetItem;
export type BudgetIncomeInput = Omit<BudgetIncomeItem, 'id'> & { id: string };
export type BudgetIncomeUpdateInput = Omit<BudgetIncomeItem, 'id'>;
export type BudgetItemPatch = {
  name?: string;
  mode?: BudgetItem['mode'];
  value?: number;
  dueDay?: number | null;
  frequency?: BudgetItemFrequency;
  firstDueMonth?: string | null;
};

function validateItemFrequency(
  mode: BudgetItem['mode'],
  frequency: BudgetItemFrequency | undefined,
  firstDueMonth: string | undefined,
): { frequency: BudgetItemFrequency; firstDueMonth?: string } {
  const resolvedFrequency = frequency ?? 'monthly';
  if (!(['monthly', 'quarterly', 'half-yearly', 'yearly'] as const).includes(resolvedFrequency)) {
    throw new BudgetMutationError('invalid-frequency', 'Choose a valid payment frequency.');
  }
  if (mode === 'percent' && resolvedFrequency !== 'monthly') {
    throw new BudgetMutationError('percent-only-monthly', 'Percent items can only be monthly.');
  }
  if (resolvedFrequency === 'monthly') return { frequency: resolvedFrequency };
  if (firstDueMonth === undefined) {
    throw new BudgetMutationError('invalid-frequency', 'Choose the first due month for a recurring item.');
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(firstDueMonth)) {
    throw new BudgetMutationError('invalid-frequency', 'Choose a valid first due month.');
  }
  return { frequency: resolvedFrequency, firstDueMonth };
}

function validateStructuralItemValues(
  mode: BudgetItem['mode'],
  value: number,
  dueDay: number | undefined,
): number {
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000
    || (mode === 'percent' && value > 100)
    || (dueDay !== undefined && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31))) {
    throw new BudgetMutationError('invalid-item', 'Enter a valid amount, percentage, and due day.');
  }
  return normalizeMoney(value);
}

function validateBudgetName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 30 || trimmed !== name) {
    throw new BudgetMutationError('invalid-name', 'Names must be 1 to 30 characters and trimmed.');
  }
  return trimmed;
}

function validateStructure(sections: BudgetSection[], items: BudgetItem[]): void {
  if (sections.length > 12) throw new BudgetMutationError('section-limit', 'A budget can have at most 12 sections.');
  if (items.length > 100) throw new BudgetMutationError('item-limit', 'A budget can have at most 100 items.');
  const sectionIds = new Set<string>();
  const sectionNames = new Set<string>();
  for (const section of sections) {
    if (!section.id || section.name.trim() !== section.name || section.name.length < 1 || section.name.length > 30) {
      throw new BudgetMutationError('invalid-name', 'Names must be 1 to 30 characters and trimmed.');
    }
    if (sectionIds.has(section.id) || sectionNames.has(section.name.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Section names and IDs must be unique.');
    }
    sectionIds.add(section.id);
    sectionNames.add(section.name.toLowerCase());
  }
  const itemNames = new Set<string>();
  const itemIds = new Set<string>();
  const itemCounts = new Map<string, number>();
  for (const item of items) {
    validateItemFrequency(item.mode, item.frequency, item.firstDueMonth);
    if (!item.id || item.name.trim() !== item.name || item.name.length < 1 || item.name.length > 30) {
      throw new BudgetMutationError('invalid-name', 'Names must be 1 to 30 characters and trimmed.');
    }
    if (!sectionIds.has(item.sectionId)) {
      throw new BudgetMutationError('section-not-found', 'Choose an existing section for each budget item.');
    }
    const section = sections.find((row) => row.id === item.sectionId);
    const isInsuranceSection = section?.system === 'insurance';
    if (section?.system && !isInsuranceSection) {
      throw new BudgetMutationError('system-section', 'System sections cannot contain items, except manual Insurance items.');
    }
    if (itemIds.has(item.id) || itemNames.has(item.name.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Budget item names and IDs must be unique.');
    }
    const builtInSection = budgetGroupFor(item.name);
    if (builtInSection && builtInSection.id !== item.sectionId) {
      throw new BudgetMutationError('reserved-category', `${item.name} belongs to ${builtInSection.name}.`);
    }
    itemIds.add(item.id);
    itemNames.add(item.name.toLowerCase());
    itemCounts.set(item.sectionId, (itemCounts.get(item.sectionId) ?? 0) + 1);
  }
  if ([...itemCounts.values()].some((count) => count > 40)) {
    throw new BudgetMutationError('item-limit', 'A section can have at most 40 items.');
  }
}

function mutateBudgetStructure(
  data: AppData,
  monthInput: string,
  scope: BudgetItemScope,
  today: ISODate,
  update: (sections: BudgetSection[], items: BudgetItem[]) => { sections: BudgetSection[]; items: BudgetItem[] },
): AppData {
  const month = monthOf(monthInput);
  const { budget } = effectiveMonthBudget(data, month, today);
  if (!budget) throw new BudgetMutationError('invalid-item', `There is no budget to edit for ${month}.`);
  const stored = monthRows(data).find((row) => row.month === month);
  if (scope === 'month') {
    const changed = update(budget.sections, budget.items);
    validateStructure(changed.sections, changed.items);
    return replaceMonth(data, { ...budget, ...changed, source: 'custom' });
  }
  const basePlan = data.budgetPlan ?? snapshotAsPlan(budget);
  const planChange = update(basePlan.sections, basePlan.items);
  validateStructure(planChange.sections, planChange.items);
  if (!stored) return { ...data, budgetPlan: { ...basePlan, ...planChange } };
  const snapshotChange = update(stored.sections, stored.items);
  validateStructure(snapshotChange.sections, snapshotChange.items);
  return {
    ...data,
    budgetPlan: { ...basePlan, ...planChange },
    monthBudgets: monthRows(data).map((row) => row.month === month
      ? { ...row, ...snapshotChange }
      : row),
  };
}

export function addIncomeItem(
  data: AppData,
  monthInput: string,
  input: BudgetIncomeInput,
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const month = monthOf(monthInput);
  const name = input.name.trim();
  if (!input.id || !name || name.length > 40) {
    throw new BudgetMutationError('invalid-name', 'Enter an income name under 40 characters.');
  }
  const normalizedAmount = normalizeMoney(input.amount);
  if (!isEarnedIncomeCategory(input.category)
    || !Number.isFinite(input.amount) || input.amount <= 0 || normalizedAmount <= 0 || input.amount > 1_000_000_000
    || (input.day !== undefined && (!Number.isInteger(input.day) || input.day < 1 || input.day > 31))) {
    throw new BudgetMutationError('invalid-item', 'Enter a valid income category, amount, and due day.');
  }
  const { budget } = effectiveMonthBudget(data, month, today);
  if (!budget) throw new BudgetMutationError('invalid-item', `There is no budget to edit for ${month}.`);
  if (budget.incomes.some((income) => income.id === input.id)) {
    throw new BudgetMutationError('duplicate-name', 'Income item IDs must be unique.');
  }
  const income = { ...input, name, amount: normalizedAmount };
  if (scope === 'month') {
    return replaceMonth(data, { ...budget, source: 'custom', incomes: [...budget.incomes, income] });
  }
  const stored = monthRows(data).find((row) => row.month === month);
  const plan = data.budgetPlan ?? snapshotAsPlan(budget);
  if (plan.incomes.some((row) => row.id === input.id)) {
    throw new BudgetMutationError('duplicate-name', 'Income item IDs must be unique.');
  }
  const updatedPlan = { ...plan, incomes: [...plan.incomes, income] };
  if (!stored) return { ...data, budgetPlan: updatedPlan };
  return {
    ...data,
    budgetPlan: updatedPlan,
    monthBudgets: monthRows(data).map((row) => row.month === month
      ? { ...row, incomes: [...row.incomes, income] }
      : row),
  };
}

export function editBudgetIncome(
  data: AppData,
  monthInput: string,
  input: { incomeId: string; values: BudgetIncomeUpdateInput },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const month = monthOf(monthInput);
  const name = input.values.name.trim();
  if (!name || name.length > 40) {
    throw new BudgetMutationError('invalid-name', 'Enter an income name under 40 characters.');
  }
  if (!isEarnedIncomeCategory(input.values.category)
    || !Number.isFinite(input.values.amount) || input.values.amount <= 0
    || input.values.amount > 1_000_000_000
    || (input.values.day !== undefined
      && (!Number.isInteger(input.values.day) || input.values.day < 1 || input.values.day > 31))) {
    throw new BudgetMutationError('invalid-item', 'Enter a valid income category, amount, and due day.');
  }
  const normalizedAmount = normalizeMoney(input.values.amount);
  if (normalizedAmount <= 0) {
    throw new BudgetMutationError('invalid-item', 'Enter a valid income category, amount, and due day.');
  }

  const { budget } = effectiveMonthBudget(data, month, today);
  if (!budget) throw new BudgetMutationError('invalid-item', `There is no budget to edit for ${month}.`);
  const currentIncome = budget.incomes.find((income) => income.id === input.incomeId);
  if (!currentIncome) throw new BudgetMutationError('item-not-found', 'The budget income no longer exists.');
  const updatedIncome: BudgetIncomeItem = {
    ...input.values,
    id: input.incomeId,
    name,
    amount: normalizedAmount,
  };

  if (scope === 'month') {
    return replaceMonth(data, {
      ...budget,
      source: 'custom',
      incomes: budget.incomes.map((income) => income.id === input.incomeId ? updatedIncome : income),
    });
  }

  const stored = monthRows(data).find((row) => row.month === month);
  const plan = data.budgetPlan ?? snapshotAsPlan(budget);
  const planHasIncome = plan.incomes.some((income) => income.id === input.incomeId);
  const updatedPlan: BudgetPlan = {
    ...plan,
    incomes: planHasIncome
      ? plan.incomes.map((income) => income.id === input.incomeId ? updatedIncome : income)
      : [...plan.incomes, updatedIncome],
  };
  if (!stored) return { ...data, budgetPlan: updatedPlan };
  return {
    ...data,
    budgetPlan: updatedPlan,
    monthBudgets: monthRows(data).map((row) => row.month === month
      ? {
        ...row,
        incomes: row.incomes.map((income) => income.id === input.incomeId ? updatedIncome : income),
      }
      : row),
  };
}

export function addSection(
  data: AppData,
  month: string,
  input: BudgetSectionInput,
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const name = validateBudgetName(input.name);
  if (!input.id) throw new BudgetMutationError('invalid-name', 'A section ID is required.');
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    if (sections.some((section) => section.name.toLowerCase() === name.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Section names must be unique.');
    }
    return { sections: [...sections, { id: input.id, name, type: input.type }], items };
  });
}

export function renameSection(
  data: AppData,
  month: string,
  input: { sectionId: string; name: string },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const name = validateBudgetName(input.name);
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    const target = sections.find((section) => section.id === input.sectionId);
    if (!target) throw new BudgetMutationError('section-not-found', 'The budget section no longer exists.');
    if (target.system) throw new BudgetMutationError('system-section', 'System sections cannot be renamed.');
    if (sections.some((section) => section.id !== target.id && section.name.toLowerCase() === name.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Section names must be unique.');
    }
    return { sections: sections.map((section) => section.id === target.id ? { ...section, name } : section), items };
  });
}

export function changeSectionType(
  data: AppData,
  month: string,
  input: { sectionId: string; type: BudgetSection['type'] },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    const target = sections.find((section) => section.id === input.sectionId);
    if (!target) throw new BudgetMutationError('section-not-found', 'The budget section no longer exists.');
    if (target.system) throw new BudgetMutationError('system-section', 'System section types cannot be changed.');
    if (items.some((item) => item.sectionId === target.id)) {
      throw new BudgetMutationError('section-not-empty', 'Change section type only after removing its items.');
    }
    return { sections: sections.map((section) => section.id === target.id ? { ...section, type: input.type } : section), items };
  });
}

export function deleteSection(
  data: AppData,
  month: string,
  input: { sectionId: string },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    const target = sections.find((section) => section.id === input.sectionId);
    if (!target) throw new BudgetMutationError('section-not-found', 'The budget section no longer exists.');
    if (target.system) throw new BudgetMutationError('system-section', 'System sections cannot be deleted.');
    return {
      sections: sections.filter((section) => section.id !== target.id),
      items: items.filter((item) => item.sectionId !== target.id),
    };
  });
}

export function addItem(
  data: AppData,
  month: string,
  input: BudgetItemInput,
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const name = validateBudgetName(input.name);
  const value = validateStructuralItemValues(input.mode, input.value, input.dueDay);
  const schedule = validateItemFrequency(input.mode, input.frequency, input.firstDueMonth);
  if (!input.id) throw new BudgetMutationError('invalid-item', 'An item ID is required.');
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Budget item names must be unique.');
    }
    return { sections, items: [...items, { ...input, ...schedule, name, value }] };
  });
}

export function editItem(
  data: AppData,
  month: string,
  input: { itemId: string; patch: BudgetItemPatch },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const requestedItem = effectiveMonthBudget(data, month, today).budget?.items
    .find((item) => item.id === input.itemId);
  if (!requestedItem) throw new BudgetMutationError('item-not-found', 'The budget item no longer exists.');
  const name = input.patch.name === undefined ? undefined : validateBudgetName(input.patch.name);
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    const target = items.find((item) => item.id === input.itemId)
      ?? items.find((item) => item.name === requestedItem.name);
    if (!target) throw new BudgetMutationError('item-not-found', 'The budget item no longer exists.');
    const nextName = name ?? target.name;
    const nextMode = input.patch.mode ?? target.mode;
    const nextValue = input.patch.value ?? target.value;
    const nextDueDay = input.patch.dueDay === null
      ? undefined
      : input.patch.dueDay ?? target.dueDay;
    const normalizedValue = validateStructuralItemValues(nextMode, nextValue, nextDueDay);
    const nextFrequency = input.patch.frequency ?? target.frequency ?? 'monthly';
    const nextFirstDueMonth = input.patch.firstDueMonth === null
      || (input.patch.frequency === 'monthly' && input.patch.firstDueMonth === undefined)
      ? undefined
      : input.patch.firstDueMonth ?? target.firstDueMonth;
    const schedule = validateItemFrequency(nextMode, nextFrequency, nextFirstDueMonth);
    if (items.some((item) => item.id !== target.id && item.name.toLowerCase() === nextName.toLowerCase())) {
      throw new BudgetMutationError('duplicate-name', 'Budget item names must be unique.');
    }
    const section = sections.find((row) => row.id === target.sectionId);
    const builtInSection = budgetGroupFor(nextName);
    if (builtInSection && builtInSection.id !== section?.id) {
      throw new BudgetMutationError('reserved-category', `${nextName} belongs to ${builtInSection.name}.`);
    }
    return {
      sections,
      items: items.map((item) => item.id !== target.id ? item : {
        ...(() => {
          const { firstDueMonth: _firstDueMonth, ...withoutFirstDueMonth } = item;
          return withoutFirstDueMonth;
        })(),
        ...(name === undefined ? {} : { name }),
        ...(input.patch.mode === undefined ? {} : { mode: input.patch.mode }),
        ...(input.patch.value === undefined ? {} : { value: normalizedValue }),
        ...(input.patch.dueDay === undefined ? {} : input.patch.dueDay === null
          ? (() => { const { dueDay: _dueDay, ...withoutDay } = item; return withoutDay; })()
          : { dueDay: input.patch.dueDay }),
        ...schedule,
      }),
    };
  });
}

export function deleteItem(
  data: AppData,
  month: string,
  input: { itemId: string },
  scope: BudgetItemScope,
  today: ISODate,
): AppData {
  const requestedItem = effectiveMonthBudget(data, month, today).budget?.items
    .find((item) => item.id === input.itemId);
  if (!requestedItem) throw new BudgetMutationError('item-not-found', 'The budget item no longer exists.');
  return mutateBudgetStructure(data, month, scope, today, (sections, items) => {
    const target = items.find((item) => item.id === input.itemId)
      ?? items.find((item) => item.name === requestedItem.name);
    if (!target) {
      throw new BudgetMutationError('item-not-found', 'The budget item no longer exists.');
    }
    return { sections, items: items.filter((item) => item.name !== requestedItem.name) };
  });
}

export function saveAndApplyBudgetPlan(
  data: AppData,
  plan: BudgetPlan,
  month: string,
  options: { newId: () => string; today: ISODate },
): AppData {
  return applyBudgetPlanToMonth(setBudgetPlan(data, plan), month, options);
}

export function customizeMonthBudget(
  data: AppData,
  monthInput: string,
  input: { incomes: BudgetIncomeItem[]; lines?: BudgetLine[] },
  today: ISODate,
): AppData {
  const month = monthOf(monthInput);
  const stored = monthRows(data).find((row) => row.month === month);
  const base = stored ?? effectiveMonthBudget(data, month, today).budget ?? {
    month,
    source: 'custom' as const,
    incomes: input.incomes,
    sections: defaultBudgetSections(),
    items: [],
  };
  const lines = input.lines ?? base.items.map((item) => ({
    category: item.name,
    planned: plannedForMonth({ ...item, frequency: 'monthly' }, month),
    ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
  }));
  const lineCategories = new Set(lines.map((line) => line.category));
  const retainedCustomItems = base.items.filter((item) =>
    !lineCategories.has(item.name) && !BUILT_IN_BUDGET_CATEGORY_SET.has(item.name),
  );
  return replaceMonth(data, {
    ...base,
    source: 'custom',
    incomes: input.incomes.map((income) => ({ ...income })),
    items: [
      ...lines.map((line) => {
      const existing = base.items.find((item) => item.name === line.category);
      return {
        id: existing?.id ?? `item:${line.category}`,
        sectionId: existing?.sectionId ?? defaultBudgetSectionIdFor(line.category),
        name: line.category,
        mode: 'amount' as const,
        value: line.planned,
        ...(line.dueDay === undefined ? {} : { dueDay: line.dueDay }),
      };
      }),
      ...retainedCustomItems,
    ],
  });
}

export function restoreMonthBudget(data: AppData, monthInput: string, budget: MonthBudget | null): AppData {
  const month = monthOf(monthInput);
  if (budget === null) return clearMonthBudget(data, month);
  if (budget.month !== month) throw new Error('Cannot restore a budget to a different month.');
  return replaceMonth(data, budget);
}

export function restoreBudgetPlanAndMonth(
  data: AppData,
  plan: BudgetPlan | null,
  month: string,
  budget: MonthBudget | null,
): AppData {
  return restoreMonthBudget(setBudgetPlan(data, plan), month, budget);
}

export function clearMonthBudget(data: AppData, monthInput: string): AppData {
  const month = monthOf(monthInput);
  const remaining = monthRows(data).filter((row) => row.month !== month);
  if (remaining.length === monthRows(data).length) return data;
  return { ...data, monthBudgets: remaining };
}

export function setBudgetRepeat(data: AppData, repeatMonthly: boolean, repeatFrom: string | null): AppData {
  if (!data.budgetPlan) return data;
  return {
    ...data,
    budgetPlan: { ...data.budgetPlan, repeatMonthly, repeatFrom: repeatMonthly ? repeatFrom : null },
  };
}

export function ensureCurrentMonthBudget(data: AppData, today: ISODate, newId: () => string): AppData {
  const month = monthKey(today);
  const plan = data.budgetPlan;
  if (!plan || !plan.repeatMonthly || plan.repeatFrom === null || plan.repeatFrom > month
    || monthRows(data).some((row) => row.month === month)) return data;
  if (plan.incomes.length === 0 && plan.items.some((item) => item.mode === 'percent')) return data;
  return applyBudgetPlanToMonth(data, month, { newId, today });
}

export type OutstandingSummary = { count: number; amount: number };

export function outstandingAt(data: AppData, asOf: ISODate): OutstandingSummary {
  const unpaid = [
    ...data.holdings.filter((holding) => holding.kind === 'plan')
      .flatMap((holding) => planSchedule(holding, asOf).rows),
    ...data.liabilities.flatMap((liability) => liabilitySchedule(liability, asOf).rows),
    ...data.policies.flatMap((policy) => policySchedule(policy, asOf).rows),
  ].filter((row) => row.dueDate < asOf && row.status === 'overdue');
  return {
    count: unpaid.length,
    amount: unpaid.reduce((sum, row) => sum + row.amount, 0),
  };
}

export function budgetLineActual(
  data: AppData,
  month: string,
  category: string,
  options: { excludePolicyPayments?: boolean } = {},
): number {
  const customCategories = customBudgetCategories(data);
  return data.transactions.filter((row) =>
    monthKey(row.date) === month
    && budgetCategoryForTransaction(row, customCategories) === category
    && (row.type === 'expense' || row.type === 'invest')
    && !(options.excludePolicyPayments && isInsuranceBudgetCategory(category) && row.source?.kind === 'policy-payment'),
  ).reduce((sum, row) => sum + row.amount, 0);
}

export type BudgetIncomeSource = { category: string; amount: number };

export type BudgetMonthView = {
  budget: MonthBudget | null;
  position: ReturnType<typeof monthPositionAt> & { previousClosing: number; flow: number };
  plannedIncome: number | null;
  actualEarned: number;
  income: {
    planned: number | null;
    actual: number;
    bySource: BudgetIncomeSource[];
    extra: number;
  };
  otherMoneyIn: number;
  lines: { category: string; planned: number; actual: number; remaining: number; usedPct: number | null; status: 'ok' | 'near' | 'over' }[];
  unbudgetedByGroup: { groupId: string; groupName: string; amount: number }[];
  commitments: BudgetCommitment[];
  linkedByCategory?: { category: string; rows: LinkedRecurringRow[] }[];
  groupTotals?: { groupId: string; groupName: string; planned: number }[];
  plannedSpend: number;
  actualSpend: number;
  plannedSave: number;
  actualSave: number;
  debt: { emiPlanned: number; emiActual: number; prepaymentsPlanned: number; prepaymentsActual: number };
  unallocated: number | null;
  unbudgeted: number;
  outstanding: OutstandingSummary;
};

export function budgetMonthView(data: AppData, month: string, today: ISODate = `${month}-01`): BudgetMonthView {
  const key = monthOf(month);
  const { budget, virtual } = effectiveMonthBudget(data, key, today);
  const commitments = monthlyCommitments(data, key);
  const includeLinked = budget?.linkedIncluded === true;
  const linkedRows = includeLinked ? linkedRecurringForMonth(data, key, monthEndDate(key)) : [];
  const plannedLines = budget
    ? resolveBudgetPlan(
      { incomes: budget.incomes, sections: budget.sections, items: budget.items },
      undefined,
      key,
      !virtual,
    )
    : [];
  const planned = new Map(plannedLines.map((line) => [line.category, line.planned]));
  if (includeLinked) {
    for (const row of linkedRows) {
      planned.set(row.category, (planned.get(row.category) ?? 0) + row.amount);
    }

  } else {
    const linkedCategories = new Set([
      'EMI',
      ...commitments.filter((item) => isInsuranceBudgetCategory(item.category))
        .map((item) => item.category),
    ]);
    for (const category of linkedCategories) {
      const amount = commitments.filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.plannedAmount, 0);
      if (amount > 0) {
        planned.set(category, isInsuranceBudgetCategory(category)
          ? (planned.get(category) ?? 0) + amount
          : amount);
      }
    }
    for (const item of commitments) {
      if (item.category === 'EMI' || item.category === 'Insurance'
        || !isInvestmentCategoryForBudget(budget, item.category)) continue;
      const amount = commitments.filter((row) => row.category === item.category)
        .reduce((sum, row) => sum + row.plannedAmount, 0);
      if (amount > 0) planned.set(item.category, Math.max(planned.get(item.category) ?? 0, amount));
    }
  }
  const lines = [...planned].map(([category, amount]) => {
    const actual = budgetLineActual(data, key, category);
    const usedPct = amount === 0 ? (actual === 0 ? 0 : null) : actual / amount * 100;
    return {
      category, planned: amount, actual, remaining: amount - actual, usedPct,
      status: actual > amount ? 'over' as const : usedPct !== null && usedPct >= 80 ? 'near' as const : 'ok' as const,
    };
  });
  const actualSpend = data.transactions.filter((row) =>
    monthKey(row.date) === key && row.type === 'expense',
  ).reduce((sum, row) => sum + row.amount, 0);
  const actualSave = data.transactions.filter((row) =>
    monthKey(row.date) === key && row.type === 'invest',
  ).reduce((sum, row) => sum + row.amount, 0);
  const plannedSpend = lines.filter((line) => !isInvestmentCategoryForBudget(budget, line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const plannedSave = lines.filter((line) => isInvestmentCategoryForBudget(budget, line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const linkedByCategory = includeLinked
    ? [...new Set(linkedRows.map((row) => row.category))].map((category) => ({
      category,
      rows: linkedRows.filter((row) => row.category === category),
    }))
    : [];
  const groupTotals = includeLinked
    ? budget.sections.filter((section) => section.system !== 'income').map((section) => ({
      groupId: section.id,
      groupName: section.name,
      planned: lines.filter((line) => budget.items.some((item) => item.name === line.category && item.sectionId === section.id)
        || (line.category === 'EMI' && section.system === 'debt')
        || (isInsuranceBudgetCategory(line.category) && section.system === 'insurance'))
        .reduce((sum, line) => sum + line.planned, 0),
    }))
    : [];
  const budgetCategories = new Set(lines.map((line) => line.category));
  const customCategories = customBudgetCategories(data);
  const unbudgetedAmounts = new Map<string, number>();
  for (const row of data.transactions) {
    if (monthKey(row.date) !== key || (row.type !== 'expense' && row.type !== 'invest')) continue;
    const category = budgetCategoryForTransaction(row, customCategories);
    if (budgetCategories.has(category)) continue;
    const group = budgetGroupFor(category);
    const itemSectionId = budget?.items.find((item) => item.name === category)?.sectionId
      ?? data.budgetPlan?.items.find((item) => item.name === category)?.sectionId;
    const insuranceSectionId = budget?.sections.find((section) => section.system === 'insurance')?.id;
    const sectionId = itemSectionId && budget?.sections.some((section) => section.id === itemSectionId)
      ? itemSectionId
      : category === 'Insurance' && insuranceSectionId
        ? insuranceSectionId
      : group && budget?.sections.some((section) => section.id === group.id)
        ? group.id
        : 'other-not-in-budget';
    unbudgetedAmounts.set(sectionId, (unbudgetedAmounts.get(sectionId) ?? 0) + row.amount);
  }
  const unbudgetedByGroup = [
    ...(budget?.sections ?? defaultBudgetSections())
      .filter((section) => section.system === undefined || section.system === 'debt' || section.system === 'insurance')
      .map((section) => ({
    groupId: section.id,
    groupName: section.name,
    amount: unbudgetedAmounts.get(section.id) ?? 0,
  })),
    ...(unbudgetedAmounts.has('other-not-in-budget') ? [{
      groupId: 'other-not-in-budget',
      groupName: 'Other (not in budget)',
      amount: unbudgetedAmounts.get('other-not-in-budget') ?? 0,
    }] : []),
  ];
  const unbudgeted = unbudgetedByGroup.reduce((sum, row) => sum + row.amount, 0);
  const currentPosition = monthPositionAt(data.transactions, key);
  const previousClosing = monthPositionAt(data.transactions, shiftMonth(key, -1)).closing;
  const position = {
    ...currentPosition,
    previousClosing,
    flow: currentPosition.closing - currentPosition.opening,
  };
  const monthPayments = data.liabilities.flatMap((item) => item.payments.map((payment) => ({
    payment,
    isEmi: item.kind === 'recurring'
      ? payment.kind === 'EMI'
      : payment.kind === 'Payment',
  }))).filter(({ payment }) => monthKey(payment.date) === key);
  const monthIncome = data.transactions.filter((row) => monthKey(row.date) === key && row.type === 'income');
  const earnedSources = new Map<string, number>();
  for (const row of monthIncome) {
    if ((NON_EARNED_INCOME_CATEGORIES as readonly string[]).includes(row.category)) continue;
    earnedSources.set(row.category, (earnedSources.get(row.category) ?? 0) + row.amount);
  }
  const otherMoneyIn = monthIncome
    .filter((row) => (NON_EARNED_INCOME_CATEGORIES as readonly string[]).includes(row.category))
    .reduce((sum, row) => sum + row.amount, 0);
  const actualEarned = position.earnedIncome;
  const plannedIncome = budget && budget.incomes.length > 0 ? plannedIncomeOf(budget) : null;
  return {
    budget, position, plannedIncome,
    actualEarned,
    income: {
      planned: plannedIncome,
      actual: actualEarned,
      bySource: [...earnedSources]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => a.category.localeCompare(b.category)),
      extra: plannedIncome === null ? 0 : Math.max(0, actualEarned - plannedIncome),
    },
    otherMoneyIn,
    lines, unbudgetedByGroup, commitments, plannedSpend, actualSpend, plannedSave, actualSave,
    ...(includeLinked ? { linkedByCategory, groupTotals } : {}),
    debt: {
      emiPlanned: commitments.filter((item) => item.kind === 'liability').reduce((sum, item) => sum + item.plannedAmount, 0),
      emiActual: monthPayments.filter((row) => row.isEmi).reduce((sum, row) => sum + row.payment.amount, 0),
      prepaymentsPlanned: 0,
      prepaymentsActual: monthPayments.filter((row) => row.payment.kind === 'Prepayment')
        .reduce((sum, row) => sum + row.payment.amount, 0),
    },
    unallocated: plannedIncome === null
      ? null : plannedIncome - plannedSpend - plannedSave,
    unbudgeted, outstanding: outstandingAt(data, monthEndDate(key)),
  };
}

export function projectedCashFlow(
  data: AppData,
  monthInput: string,
  today: ISODate,
): { opening: number; closing: number; projected: boolean } {
  const month = monthOf(monthInput);
  const currentMonth = monthKey(today);
  if (month <= currentMonth) {
    const position = monthPositionAt(data.transactions, month);
    return { opening: position.opening, closing: position.closing, projected: false };
  }
  const prior = projectedCashFlow(data, shiftMonth(month, -1), today);
  const opening = prior.closing;
  const { budget } = effectiveMonthBudget(data, month, today);
  if (!budget) return { opening, closing: opening, projected: true };
  const view = budgetMonthView(data, month, today);
  const monthDistance = (Number(month.slice(0, 4)) - Number(currentMonth.slice(0, 4))) * 12
    + Number(month.slice(5, 7)) - Number(currentMonth.slice(5, 7));
  if (monthDistance > 1) {
    const plannedIncome = plannedIncomeOf(budget);
    return {
      opening,
      closing: normalizeMoney(opening + plannedIncome - view.plannedSpend - view.plannedSave),
      projected: true,
    };
  }
  const plannedIncome = plannedIncomeOf(budget);
  const income = Math.max(0, plannedIncome - view.actualEarned);
  const spend = Math.max(0, view.plannedSpend - view.actualSpend);
  const save = Math.max(0, view.plannedSave - view.actualSave);
  return {
    opening,
    closing: normalizeMoney(opening + income - spend - save),
    projected: true,
  };
}

export type BudgetOverviewItem = {
  id: string;
  title: string;
  planned: number;
  actual: number;
  frequency?: BudgetItemFrequency;
  nextDueMonth?: string;
  kind: 'line' | 'linked' | 'income';
  editable: boolean;
  source: { kind: 'line'; category: string }
    | { kind: 'income'; incomeId: string; category: EarnedIncomeCategory }
    | { kind: 'plan' | 'liability' | 'policy'; parentId: string };
};

export type BudgetOverviewSection = {
  id: string;
  name: string;
  planned: number;
  actual: number;
  items: BudgetOverviewItem[];
};

export type BudgetOverview = {
  mode: 'past' | 'current' | 'future';
  cashFlow: ReturnType<typeof projectedCashFlow>;
  stacked: {
    income: { planned: number; actual: number };
    spend: { planned: number; actual: number };
    invest: { planned: number; actual: number };
    left: { planned: number; actual: number };
  };
  sections: BudgetOverviewSection[];
  pace: { days: number; planned: number[]; actual: number[] } | null;
  summary: { stacked: string; sections: string; pace: string | null };
};

function overviewSectionFor(
  category: string,
  budget: MonthBudget,
  plan: BudgetPlan | null,
): string {
  if (category === 'EMI') return budget.sections.find((section) => section.system === 'debt')?.id ?? 'debt-repayments';
  if (isInsuranceBudgetCategory(category)) return budget.sections.find((section) => section.system === 'insurance')?.id ?? 'insurance';
  const item = budget.items.find((row) => row.name === category)
    ?? plan?.items.find((row) => row.name === category);
  if (item && budget.sections.some((section) => section.id === item.sectionId)) return item.sectionId;
  const group = budgetGroupFor(category);
  return group && budget.sections.some((section) => section.id === group.id)
    ? group.id
    : 'other-not-in-budget';
}

function overviewSourceKind(
  kind: NonNullable<Transaction['source']>['kind'],
): 'plan' | 'liability' | 'policy' | null {
  if (kind === 'holding-entry') return 'plan';
  if (kind === 'liability-payment') return 'liability';
  if (kind === 'policy-payment') return 'policy';
  return null;
}

function monthActualTransactions(data: AppData, month: string, today: ISODate): Transaction[] {
  const currentMonth = monthKey(today);
  if (month > currentMonth) return [];
  const through = month < currentMonth ? monthEndDate(month) : today;
  return data.transactions.filter((row) => monthKey(row.date) === month && row.date <= through);
}

function moneySum(values: readonly number[]): number {
  return normalizeMoney(values.reduce((total, value) => total + value, 0));
}

export function budgetOverview(data: AppData, monthInput: string, today: ISODate): BudgetOverview {
  const month = monthOf(monthInput);
  const currentMonth = monthKey(today);
  const mode = month < currentMonth ? 'past' : month === currentMonth ? 'current' : 'future';
  const cashFlow = projectedCashFlow(data, month, today);
  const { budget } = effectiveMonthBudget(data, month, today);
  const emptyStacked = {
    income: { planned: 0, actual: 0 },
    spend: { planned: 0, actual: 0 },
    invest: { planned: 0, actual: 0 },
    left: { planned: 0, actual: 0 },
  };
  if (!budget) {
    return {
      mode,
      cashFlow,
      stacked: emptyStacked,
      sections: [],
      pace: null,
      summary: {
        stacked: 'No budget for this month.',
        sections: 'No budget sections.',
        pace: null,
      },
    };
  }

  const view = budgetMonthView(data, month, today);
  const actualTransactions = monthActualTransactions(data, month, today);
  const overviewDefinitions = budget.sections.map((section) => ({ ...section }));
  const incomeSectionId = budget.sections.find((section) => section.system === 'income')?.id ?? 'income';
  if (!overviewDefinitions.some((section) => section.id === incomeSectionId)) {
    overviewDefinitions.unshift({ id: incomeSectionId, name: 'Income', type: 'spend', system: 'income' });
  }
  overviewDefinitions.sort((left, right) =>
    left.id === incomeSectionId ? -1 : right.id === incomeSectionId ? 1 : 0,
  );
  const sectionItems = new Map<string, BudgetOverviewItem[]>(
    overviewDefinitions.map((section) => [section.id, []]),
  );
  const itemsForSection = (id: string): BudgetOverviewItem[] => {
    let items = sectionItems.get(id);
    if (!items) {
      const definition = { id, name: 'Other (not in budget)', type: 'spend' as const };
      overviewDefinitions.push(definition);
      items = [];
      sectionItems.set(id, items);
    }
    return items;
  };
  const actualEarnedByCategory = new Map<EarnedIncomeCategory, number>();
  for (const transaction of actualTransactions) {
    if (transaction.type !== 'income'
      || (NON_EARNED_INCOME_CATEGORIES as readonly string[]).includes(transaction.category)
      || !isEarnedIncomeCategory(transaction.category)) continue;
    const category = transaction.category;
    actualEarnedByCategory.set(
      category,
      normalizeMoney((actualEarnedByCategory.get(category) ?? 0) + transaction.amount),
    );
  }

  const remainingEarned = new Map(actualEarnedByCategory);
  for (const income of budget.incomes) {
    const actual = Math.min(income.amount, remainingEarned.get(income.category) ?? 0);
    remainingEarned.set(income.category, normalizeMoney(
      (remainingEarned.get(income.category) ?? 0) - actual,
    ));
    itemsForSection(incomeSectionId).push({
      id: `income:${income.id}`,
      title: income.name,
      planned: normalizeMoney(income.amount),
      actual: normalizeMoney(actual),
      kind: 'income',
      editable: true,
      source: { kind: 'income', incomeId: income.id, category: income.category },
    });
  }
  for (const category of EARNED_INCOME_CATEGORIES) {
    const extra = remainingEarned.get(category) ?? 0;
    if (extra <= 0) continue;
    itemsForSection(incomeSectionId).push({
      id: `income:actual:${category}`,
      title: category,
      planned: 0,
      actual: normalizeMoney(extra),
      kind: 'income',
      editable: true,
      source: { kind: 'income', incomeId: `actual:${category}`, category },
    });
  }

  const actualByCategory = new Map<string, number>();
  for (const transaction of actualTransactions) {
    if (transaction.type !== 'expense' && transaction.type !== 'invest') continue;
    const category = budgetCategoryForTransaction(transaction, customBudgetCategories(data));
    actualByCategory.set(
      category,
      normalizeMoney((actualByCategory.get(category) ?? 0) + transaction.amount),
    );
  }

  const linkedRows = linkedRecurringForMonth(data, month, monthEndDate(month));
  const matchedEntryIds = new Set<string>();
  const linkedPlannedByCategory = new Map<string, number>();
  const linkedActualByCategory = new Map<string, number>();
  for (const row of linkedRows) {
    const linkedActualTransactions = row.kind === 'liability'
      && data.liabilities.find((item) => item.id === row.parentId)?.kind === 'one-time'
      ? actualTransactions.filter((transaction) =>
        transaction.source?.kind === 'liability-payment'
        && transaction.source.parentId === row.parentId,
      )
      : row.entryId
        ? actualTransactions.filter((transaction) =>
          overviewSourceKind(transaction.source?.kind ?? 'liability-origin') === row.kind
          && transaction.source?.parentId === row.parentId
          && transaction.source.entryId === row.entryId,
        )
        : [];
    const linkedActual = linkedActualTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    if (row.entryId) matchedEntryIds.add(row.entryId);
    if (row.kind === 'liability'
      && data.liabilities.find((item) => item.id === row.parentId)?.kind === 'one-time') {
      for (const transaction of actualTransactions) {
        if (transaction.source?.kind === 'liability-payment'
          && transaction.source.parentId === row.parentId) {
          matchedEntryIds.add(transaction.source.entryId);
        }
      }
    }
    const category = row.category;
    const sectionRows = itemsForSection(overviewSectionFor(category, budget, data.budgetPlan));
    const itemId = row.kind === 'policy' ? `linked:policy:${category}` : row.id;
    const existingPolicyItem = row.kind === 'policy'
      ? sectionRows.find((item) => item.id === itemId)
      : undefined;
    if (existingPolicyItem) {
      existingPolicyItem.planned = normalizeMoney(existingPolicyItem.planned + row.amount);
      existingPolicyItem.actual = normalizeMoney(existingPolicyItem.actual + linkedActual);
    } else {
      sectionRows.push({
        id: itemId,
        title: row.kind === 'policy' ? category : row.name,
        planned: normalizeMoney(row.amount),
        actual: normalizeMoney(linkedActual),
        kind: 'linked',
        editable: false,
        source: { kind: row.kind, parentId: row.parentId },
      });
    }
    linkedPlannedByCategory.set(
      category,
      normalizeMoney((linkedPlannedByCategory.get(category) ?? 0) + row.amount),
    );
    for (const transaction of linkedActualTransactions) {
      const actualCategory = budgetCategoryForTransaction(
        transaction,
        customBudgetCategories(data),
      );
      linkedActualByCategory.set(
        actualCategory,
        normalizeMoney((linkedActualByCategory.get(actualCategory) ?? 0) + transaction.amount),
      );
    }
  }

  for (const transaction of actualTransactions) {
    const source = transaction.source;
    if (!source) continue;
    const kind = overviewSourceKind(source.kind);
    if (!kind || matchedEntryIds.has(source.entryId)) continue;
    const isKnownParent = kind === 'plan'
      ? data.holdings.some((holding) => holding.id === source.parentId)
      : kind === 'liability'
        ? data.liabilities.some((liability) => liability.id === source.parentId)
        : data.policies.some((policy) => policy.id === source.parentId);
    if (!isKnownParent) continue;
    const category = kind === 'plan'
      ? investCategoryFor(data.holdings.find((holding) => holding.id === source.parentId)?.type ?? 'Other')
      : kind === 'liability'
        ? 'EMI'
        : isInsuranceBudgetCategory(transaction.category)
          ? transaction.category
          : policyPremiumCategory(data.policies.find((policy) => policy.id === source.parentId)?.kind ?? 'other');
    const title = kind === 'plan'
      ? data.holdings.find((holding) => holding.id === source.parentId)?.name ?? 'Investment'
      : kind === 'liability'
        ? data.liabilities.find((liability) => liability.id === source.parentId)?.name ?? 'Liability'
        : data.policies.find((policy) => policy.id === source.parentId)?.name ?? 'Policy';
    const sectionRows = itemsForSection(overviewSectionFor(category, budget, data.budgetPlan));
    const id = kind === 'policy'
      ? `linked:policy:${category}`
      : `linked:${kind}:${source.parentId}:${source.entryId}`;
    const existingPolicyItem = kind === 'policy'
      ? sectionRows.find((item) => item.id === id)
      : undefined;
    if (existingPolicyItem) {
      existingPolicyItem.actual = normalizeMoney(existingPolicyItem.actual + transaction.amount);
    } else {
      sectionRows.push({
        id,
        title: kind === 'policy' ? category : title,
        planned: 0,
        actual: normalizeMoney(transaction.amount),
        kind: 'linked',
        editable: false,
        source: { kind, parentId: source.parentId },
      });
    }
    const actualCategory = budgetCategoryForTransaction(transaction, customBudgetCategories(data));
    linkedActualByCategory.set(
      actualCategory,
      normalizeMoney((linkedActualByCategory.get(actualCategory) ?? 0) + transaction.amount),
    );
  }

  const categories = new Set([
    ...view.lines.map((line) => line.category),
    ...actualByCategory.keys(),
  ]);
  for (const category of categories) {
    const sectionId = overviewSectionFor(category, budget, data.budgetPlan);
    const line = view.lines.find((row) => row.category === category);
    const planned = normalizeMoney(Math.max(
      0,
      (line?.planned ?? 0) - (linkedPlannedByCategory.get(category) ?? 0),
    ));
    const actual = normalizeMoney(Math.max(
      0,
      (actualByCategory.get(category) ?? 0) - (linkedActualByCategory.get(category) ?? 0),
    ));
    const budgetItem = budget.items.find((item) => item.name === category);
    const frequency = budgetItem?.frequency ?? 'monthly';
    const isRecurringBudgetItem = budgetItem !== undefined && frequency !== 'monthly';
    if (planned === 0 && actual === 0 && !isRecurringBudgetItem) continue;
    itemsForSection(sectionId).push({
      id: `line:${month}:${category}`,
      title: category,
      planned,
      actual,
      ...(isRecurringBudgetItem ? {
        frequency,
        ...(isItemDueInMonth(budgetItem, month) ? {} : { nextDueMonth: nextDueMonth(budgetItem, month) }),
      } : {}),
      kind: 'line',
      editable: true,
      source: { kind: 'line', category },
    });
  }

  const sections = overviewDefinitions.map((definition) => {
    const items = sectionItems.get(definition.id) ?? [];
    return {
      ...definition,
      planned: moneySum(items.map((item) => item.planned)),
      actual: moneySum(items.map((item) => item.actual)),
      items,
    };
  });
  const income = sections.find((section) => section.id === incomeSectionId);
  const spendSections = sections.filter((section) =>
    overviewDefinitions.find((definition) => definition.id === section.id)?.type === 'spend'
      && section.id !== incomeSectionId,
  );
  const spendPlanned = moneySum(spendSections.map((section) => section.planned));
  const spendActual = moneySum(spendSections.map((section) => section.actual));
  const investSections = sections.filter((section) =>
    overviewDefinitions.find((definition) => definition.id === section.id)?.type === 'invest',
  );
  const investPlanned = moneySum(investSections.map((section) => section.planned));
  const investActual = moneySum(investSections.map((section) => section.actual));
  const plannedIncome = income?.planned ?? 0;
  const actualIncome = income?.actual ?? 0;
  const stacked = {
    income: { planned: plannedIncome, actual: actualIncome },
    spend: { planned: spendPlanned, actual: spendActual },
    invest: { planned: investPlanned, actual: investActual },
    left: {
      planned: normalizeMoney(plannedIncome - spendPlanned - investPlanned),
      actual: normalizeMoney(actualIncome - spendActual - investActual),
    },
  };

  const endDay = Number(monthEndDate(month).slice(8, 10));
  const elapsedDays = mode === 'past' ? endDay : mode === 'current' ? Number(today.slice(8, 10)) : 0;
  const dailyExpenses = new Map<number, number>();
  for (const transaction of actualTransactions) {
    if (transaction.type !== 'expense') continue;
    const day = Number(transaction.date.slice(8, 10));
    dailyExpenses.set(day, normalizeMoney((dailyExpenses.get(day) ?? 0) + transaction.amount));
  }
  const actualPace: number[] = [];
  let cumulativeActual = 0;
  for (let day = 1; day <= elapsedDays; day += 1) {
    cumulativeActual = normalizeMoney(cumulativeActual + (dailyExpenses.get(day) ?? 0));
    actualPace.push(cumulativeActual);
  }
  const plannedSpend = stacked.spend.planned;
  const pace = mode === 'future' ? null : {
    days: endDay,
    planned: Array.from({ length: endDay }, (_, index) =>
      normalizeMoney(plannedSpend * (index + 1) / endDay)),
    actual: actualPace,
  };
  const leftSummary = [
    stacked.left.planned < 0 ? `Planned over by ${formatINR(Math.abs(stacked.left.planned))}.` : '',
    stacked.left.actual < 0 ? `Actual over by ${formatINR(Math.abs(stacked.left.actual))}.` : '',
  ].filter(Boolean).join(' ');
  return {
    mode,
    cashFlow,
    stacked,
    sections,
    pace,
    summary: {
      stacked: `Income ${formatINR(plannedIncome)} planned and ${formatINR(actualIncome)} actual; spending ${formatINR(spendPlanned)} planned and ${formatINR(spendActual)} actual; investing ${formatINR(stacked.invest.planned)} planned and ${formatINR(stacked.invest.actual)} actual; left ${formatINR(stacked.left.planned)} planned and ${formatINR(stacked.left.actual)} actual.${leftSummary ? ` ${leftSummary}` : ''}`,
      sections: sections.map((section) =>
        `${section.name}: ${formatINR(section.actual)} actual of ${formatINR(section.planned)} planned.`,
      ).join(' '),
      pace: pace
        ? `Spending pace through day ${elapsedDays}: ${formatINR(pace.actual.at(-1) ?? 0)} actual; ${formatINR(plannedSpend)} planned by month end.`
        : null,
    },
  };
}
