import { NotFoundError } from './actions';
import { incomeBaselineFor } from './summary';
import { liabilitySchedule, planSchedule } from './schedule';
import { policySchedule } from './policySchedule';
import { investCategoryFor } from './links';
import { monthEndDate, monthPositionAt } from './cashFlow';
import { monthKey, shiftMonth } from './dates';
import { BUDGET_CATEGORIES, NON_EARNED_INCOME_CATEGORIES } from './schemas';
import type {
  AppData,
  BudgetLine,
  BudgetTemplate,
  ISODate,
  MonthBudget,
  Transaction,
} from './types';
export { BUDGET_CATEGORIES };

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

export type BudgetGroup = {
  id: 'survival' | 'savings-investments' | 'wants' | 'festival-donations-culture' | 'unexpected-extras';
  name: string;
  hint: string;
  weight: number;
  categories: readonly string[];
};

export const BUDGET_GROUPS: readonly BudgetGroup[] = [
  {
    id: 'survival',
    name: 'Survival (Needs)',
    hint: 'Essentials: living, food, transport, family, health, bills, education, EMI and insurance.',
    weight: 50,
    categories: ['Living', 'Food', 'Transport', 'Family', 'Health', 'Bills', 'Education', 'EMI', 'Insurance'],
  },
  {
    id: 'savings-investments',
    name: 'Savings and Investments',
    hint: 'Savings and every investment category.',
    weight: 20,
    categories: ['Mutual fund / SIP', 'Stocks / ETF', 'Fixed deposit / RD', 'Gold / Silver', 'Other investments'],
  },
  {
    id: 'wants',
    name: 'Wants',
    hint: 'Non-essential or lifestyle spending: eating out, online shopping, entertainment and fashion.',
    weight: 15,
    categories: ['Shopping', 'Other', 'Eating out', 'Entertainment', 'Fashion'],
  },
  {
    id: 'festival-donations-culture',
    name: 'Festival, Donations, Culture',
    hint: 'Festival, donation, gifts and culture-related spending.',
    weight: 5,
    categories: ['Festival', 'Donation', 'Gifts', 'Culture'],
  },
  {
    id: 'unexpected-extras',
    name: 'Unexpected Extras',
    hint: 'Surprises and emergencies: medical bills, home or vehicle repairs, or sudden gifts.',
    weight: 10,
    categories: ['Unexpected'],
  },
];

export const BUDGET_CATEGORY_WEIGHTS: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  survival: { Living: 25, Food: 20, Transport: 10, Family: 10, Health: 5, Bills: 10, Education: 5, EMI: 10, Insurance: 5 },
  'savings-investments': {
    'Mutual fund / SIP': 25, 'Stocks / ETF': 15,
    'Fixed deposit / RD': 10, 'Gold / Silver': 10, 'Other investments': 40,
  },
  wants: { Shopping: 35, Other: 20, 'Eating out': 15, Entertainment: 15, Fashion: 15 },
  'festival-donations-culture': { Festival: 30, Donation: 20, Gifts: 20, Culture: 30 },
  'unexpected-extras': { Unexpected: 100 },
};

const INVESTMENT_CATEGORIES = new Set(BUDGET_GROUPS[1]?.categories ?? []);

export function budgetGroupFor(category: string): BudgetGroup | undefined {
  return BUDGET_GROUPS.find((group) => group.categories.includes(category));
}

function isInvestmentCategory(category: string): boolean {
  return INVESTMENT_CATEGORIES.has(category);
}

function budgetCategoryForTransaction(transaction: Transaction): string {
  return transaction.type === 'invest' && !INVESTMENT_CATEGORIES.has(transaction.category)
    ? 'Other investments'
    : transaction.category;
}

function monthOf(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12) {
    throw new RangeError(`Invalid month key: ${month}`);
  }
  return month;
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
        kind: 'policy', id: policy.id, name: policy.name, category: 'Insurance',
        dueDate: row.dueDate, plannedAmount: row.amount, status: row.status,
        paidAmount: row.paidAmount ?? 0,
      });
    }
  }
  return orderedRows(rows);
}

export class MissingPlannedIncomeError extends Error {
  constructor() {
    super('A planned income is required to resolve percentage budget lines.');
    this.name = 'MissingPlannedIncomeError';
  }
}

export function resolveTemplate(
  template: Pick<BudgetTemplate, 'plannedIncome' | 'lines'>,
  plannedIncome = template.plannedIncome,
): BudgetLine[] {
  return template.lines.map((line) => {
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

export function suggestTemplate(input: {
  plannedIncome: number;
  commitments: BudgetCommitment[];
}): { lines: BudgetLine[]; warnings: string[] } {
  const lines: BudgetLine[] = [];
  const warnings: string[] = [];
  for (const group of BUDGET_GROUPS) {
    const weights = BUDGET_CATEGORY_WEIGHTS[group.id];
    if (!weights) throw new Error(`Missing category weights for ${group.id}.`);
    const commitments = input.commitments.filter((item) => group.categories.includes(item.category));
    const committed = commitments.reduce((sum, item) => sum + item.plannedAmount, 0);
    const target = input.plannedIncome * group.weight / 100;
    const remaining = Math.max(0, target - committed);
    if (committed > target) {
      warnings.push(`${group.name} commitments exceed its ${group.weight}% allocation.`);
    }
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    for (const category of group.categories) {
      const weight = weights[category];
      if (weight === undefined) throw new Error(`Missing budget weight for ${category}.`);
      const amount = Math.max(0, Math.round(remaining * weight / totalWeight / 100) * 100);
      const categoryCommitment = commitments.filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.plannedAmount, 0);
      lines.push({ category, planned: amount + categoryCommitment });
    }
  }
  return { lines, warnings };
}

function templateRows(data: AppData): BudgetTemplate[] {
  return data.budgetTemplates ?? [];
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

export function createBudgetTemplate(
  data: AppData,
  input: Omit<BudgetTemplate, 'id'>,
  newId: () => string,
): AppData {
  const template = { ...input, id: newId() };
  return { ...data, budgetTemplates: [...templateRows(data), template] };
}

export function createBudgetTemplateAndApply(
  data: AppData,
  input: Omit<BudgetTemplate, 'id'>,
  month: string,
  newId: () => string,
): AppData {
  const template: BudgetTemplate = { ...input, id: newId() };
  const withTemplate = { ...data, budgetTemplates: [...templateRows(data), template] };
  return applyTemplateToMonth(withTemplate, { month, templateId: template.id });
}

export function updateBudgetTemplate(data: AppData, id: string, patch: Partial<Omit<BudgetTemplate, 'id'>>): AppData {
  if (!templateRows(data).some((template) => template.id === id)) throw new NotFoundError('Budget template', id);
  return {
    ...data,
    budgetTemplates: templateRows(data).map((template) => template.id === id ? { ...template, ...patch } : template),
  };
}

export function deleteBudgetTemplate(data: AppData, id: string): AppData {
  const template = templateRows(data).find((row) => row.id === id);
  if (!template) throw new NotFoundError('Budget template', id);
  return {
    ...data,
    budgetTemplates: templateRows(data).filter((row) => row.id !== id),
    defaultBudgetTemplateId: data.defaultBudgetTemplateId === id ? null : data.defaultBudgetTemplateId,
    monthBudgets: monthRows(data).map((row) => row.templateId === id
      ? { ...row, templateId: null, templateName: row.templateName ?? template.name }
      : row),
  };
}

export function setDefaultBudgetTemplate(data: AppData, id: string | null): AppData {
  if (id !== null && !templateRows(data).some((template) => template.id === id)) {
    throw new NotFoundError('Budget template', id);
  }
  return { ...data, defaultBudgetTemplateId: id };
}

export function applyTemplateToMonth(
  data: AppData,
  input: { month: string; templateId: string; plannedIncome?: number | null },
): AppData {
  const month = monthOf(input.month);
  const template = templateRows(data).find((row) => row.id === input.templateId);
  if (!template) throw new NotFoundError('Budget template', input.templateId);
  const plannedIncome = input.plannedIncome ?? template.plannedIncome ?? incomeBaselineFor(data, `${month}-01`)?.amount ?? null;
  return replaceMonth(data, {
    month, templateId: template.id, templateName: template.name, customized: false,
    plannedIncome, lines: resolveTemplate(template, plannedIncome),
  });
}

export function customizeMonthBudget(
  data: AppData,
  monthInput: string,
  input: { plannedIncome: number | null; lines?: BudgetLine[] },
): AppData {
  const month = monthOf(monthInput);
  const stored = monthRows(data).find((row) => row.month === month);
  const defaultTemplate = templateRows(data).find((row) => row.id === data.defaultBudgetTemplateId);
  const defaultIncome = input.plannedIncome ?? defaultTemplate?.plannedIncome
    ?? incomeBaselineFor(data, `${month}-01`)?.amount ?? null;
  const baseLines = stored?.lines ?? (defaultTemplate ? resolveTemplate(defaultTemplate, defaultIncome) : []);
  const base = stored ?? (defaultTemplate ? {
    month, templateId: defaultTemplate.id, templateName: defaultTemplate.name, customized: true,
    plannedIncome: input.plannedIncome, lines: baseLines,
  } : {
    month, templateId: null, templateName: null, customized: true,
    plannedIncome: input.plannedIncome, lines: baseLines,
  });
  return replaceMonth(data, {
    ...base, customized: true, plannedIncome: input.plannedIncome, lines: input.lines ?? baseLines,
  });
}

export function clearMonthBudget(data: AppData, monthInput: string): AppData {
  const month = monthOf(monthInput);
  const remaining = monthRows(data).filter((row) => row.month !== month);
  if (remaining.length === monthRows(data).length) return data;
  return { ...data, monthBudgets: remaining };
}

export function saveMonthAsTemplate(
  data: AppData,
  monthInput: string,
  name: string,
  newId: () => string,
): AppData {
  const budget = monthRows(data).find((row) => row.month === monthOf(monthInput));
  if (!budget) throw new NotFoundError('Month budget', monthInput);
  return createBudgetTemplate(data, {
    name, plannedIncome: budget.plannedIncome,
    lines: budget.lines.map((line) => ({
      category: line.category,
      mode: 'amount',
      value: line.planned,
      ...(line.dueDay === undefined ? {} : { dueDay: line.dueDay }),
    })),
  }, newId);
}

export function ensureMonthBudget(data: AppData, month: string, today: ISODate): AppData {
  monthOf(month);
  if (month !== monthKey(today) || monthRows(data).some((row) => row.month === month)) return data;
  const template = templateRows(data).find((row) => row.id === data.defaultBudgetTemplateId);
  if (!template) return data;
  const plannedIncome = template.plannedIncome ?? incomeBaselineFor(data, today)?.amount ?? null;
  if (plannedIncome === null && template.lines.some((line) => line.mode === 'percent')) return data;
  return applyTemplateToMonth(data, {
    month, templateId: template.id,
    plannedIncome,
  });
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

export function budgetLineActual(data: AppData, month: string, category: string): number {
  return data.transactions.filter((row) =>
    monthKey(row.date) === month
    && budgetCategoryForTransaction(row) === category
    && (row.type === 'expense' || row.type === 'invest'),
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
  unbudgetedByGroup: { groupId: BudgetGroup['id']; groupName: string; amount: number }[];
  commitments: BudgetCommitment[];
  plannedSpend: number;
  actualSpend: number;
  plannedSave: number;
  actualSave: number;
  debt: { emiPlanned: number; emiActual: number; prepaymentsPlanned: number; prepaymentsActual: number };
  unallocated: number | null;
  unbudgeted: number;
  outstanding: OutstandingSummary;
};

export function budgetMonthView(data: AppData, month: string): BudgetMonthView {
  const key = monthOf(month);
  const budget = monthRows(data).find((row) => row.month === key) ?? null;
  const commitments = monthlyCommitments(data, key);
  const planned = new Map((budget?.lines ?? []).map((line) => [line.category, line.planned]));
  for (const category of ['EMI', 'Insurance']) {
    const amount = commitments.filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.plannedAmount, 0);
    if (amount > 0) planned.set(category, amount);
  }
  for (const category of INVESTMENT_CATEGORIES) {
    const amount = commitments.filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.plannedAmount, 0);
    if (amount > 0) planned.set(category, Math.max(planned.get(category) ?? 0, amount));
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
  const plannedSpend = lines.filter((line) => !isInvestmentCategory(line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const plannedSave = lines.filter((line) => isInvestmentCategory(line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const budgetCategories = new Set(lines.map((line) => line.category));
  const unbudgetedAmounts = new Map<BudgetGroup['id'], number>();
  for (const row of data.transactions) {
    if (monthKey(row.date) !== key || (row.type !== 'expense' && row.type !== 'invest')) continue;
    const category = budgetCategoryForTransaction(row);
    if (budgetCategories.has(category)) continue;
    const group = budgetGroupFor(category);
    if (!group) throw new Error(`No budget group is defined for transaction category "${category}".`);
    unbudgetedAmounts.set(group.id, (unbudgetedAmounts.get(group.id) ?? 0) + row.amount);
  }
  const unbudgetedByGroup = BUDGET_GROUPS.map((group) => ({
    groupId: group.id,
    groupName: group.name,
    amount: unbudgetedAmounts.get(group.id) ?? 0,
  }));
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
  const plannedIncome = budget?.plannedIncome ?? null;
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
    debt: {
      emiPlanned: commitments.filter((item) => item.kind === 'liability').reduce((sum, item) => sum + item.plannedAmount, 0),
      emiActual: monthPayments.filter((row) => row.isEmi).reduce((sum, row) => sum + row.payment.amount, 0),
      prepaymentsPlanned: 0,
      prepaymentsActual: monthPayments.filter((row) => row.payment.kind === 'Prepayment')
        .reduce((sum, row) => sum + row.payment.amount, 0),
    },
    unallocated: budget?.plannedIncome === null || budget?.plannedIncome === undefined
      ? null : budget.plannedIncome - plannedSpend - plannedSave,
    unbudgeted, outstanding: outstandingAt(data, monthEndDate(key)),
  };
}

export type BudgetHistoryRow = {
  month: string;
  templateName: string;
  customized: boolean;
  plannedIncome: number | null;
  plannedSpend: number;
  plannedSave: number;
  actualEarned: number;
  actualSpend: number;
  actualInvested: number;
  savingsRatePct: number | null;
  closing: number;
  outstanding: OutstandingSummary;
};

export function budgetHistory(data: AppData): BudgetHistoryRow[] {
  const months = new Set([
    ...(data.monthBudgets ?? []).map((row) => row.month),
    ...data.transactions.map((row) => monthKey(row.date)),
  ]);
  return [...months].sort((a, b) => b.localeCompare(a)).map((month) => {
    const view = budgetMonthView(data, month);
    const actualInvested = data.transactions.filter((row) =>
      monthKey(row.date) === month && row.type === 'invest',
    ).reduce((sum, row) => sum + row.amount, 0);
    return {
      month, templateName: view.budget?.templateName ?? 'No budget',
      customized: view.budget?.customized ?? false, plannedIncome: view.plannedIncome,
      plannedSpend: view.plannedSpend, plannedSave: view.plannedSave,
      actualEarned: view.actualEarned, actualSpend: view.actualSpend,
      actualInvested,
      savingsRatePct: view.actualEarned === 0 ? null : (view.actualEarned - view.actualSpend) / view.actualEarned * 100,
      closing: view.position.closing, outstanding: view.outstanding,
    };
  });
}
