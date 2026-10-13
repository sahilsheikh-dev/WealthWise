import { NotFoundError } from './actions';
import { incomeBaselineFor } from './summary';
import { liabilitySchedule, planSchedule } from './schedule';
import { policySchedule } from './policySchedule';
import { investCategoryFor } from './links';
import { monthEndDate, monthPositionAt } from './cashFlow';
import { monthKey, shiftMonth } from './dates';
import type {
  AppData,
  BudgetLine,
  BudgetTemplate,
  ISODate,
  MonthBudget,
} from './types';

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

const NEED_WEIGHTS: Record<string, number> = {
  Living: 30, Food: 20, Transport: 10, Family: 10, Health: 10, Bills: 10, Education: 10,
};
const WANT_WEIGHTS: Record<string, number> = {
  Shopping: 35, Other: 25, Festival: 15, Donation: 10, Gifts: 15,
};
const SAVING_WEIGHTS: Record<string, number> = {
  'Emergency fund': 50, 'Mutual fund / SIP': 20, 'Stocks / ETF': 10,
  'Fixed deposit / RD': 10, 'Gold / Silver': 5, 'Other investments': 5,
};
const SAVING_CATEGORIES = new Set(Object.keys(SAVING_WEIGHTS));

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
        category: investCategoryFor(holding.type) === 'Other' ? 'Other investments' : investCategoryFor(holding.type),
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
    if (line.mode === 'amount') return { category: line.category, planned: line.value };
    if (plannedIncome === null) throw new MissingPlannedIncomeError();
    return {
      category: line.category,
      planned: Math.round(line.value * plannedIncome / 100),
    };
  });
}

export function suggestTemplate(input: {
  plannedIncome: number;
  commitments: BudgetCommitment[];
}): { lines: BudgetLine[]; warnings: string[] } {
  const buckets = [
    { target: input.plannedIncome * 0.5, weights: NEED_WEIGHTS, categories: new Set(['EMI', 'Insurance']) },
    { target: input.plannedIncome * 0.3, weights: WANT_WEIGHTS, categories: new Set<string>() },
    { target: input.plannedIncome * 0.2, weights: SAVING_WEIGHTS, categories: new Set<string>() },
  ];
  const lines: BudgetLine[] = [];
  const warnings: string[] = [];
  for (const bucket of buckets) {
    const commitments = input.commitments.filter((item) => bucket.categories.has(item.category)
      || (bucket.weights === SAVING_WEIGHTS && SAVING_CATEGORIES.has(item.category)));
    const committed = commitments.reduce((sum, item) => sum + item.plannedAmount, 0);
    const remaining = Math.max(0, bucket.target - committed);
    if (committed > bucket.target) {
      const categories = [...new Set(commitments.map((item) => item.category))].join(', ');
      warnings.push(`${categories} exceed their 50/30/20 allocation.`);
    }
    const totalWeight = Object.values(bucket.weights).reduce((sum, weight) => sum + weight, 0);
    for (const [category, weight] of Object.entries(bucket.weights)) {
      const amount = Math.max(0, Math.round(remaining * weight / totalWeight / 100) * 100);
      const categoryCommitment = commitments.filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.plannedAmount, 0);
      lines.push({ category, planned: amount + categoryCommitment });
    }
    for (const item of commitments) {
      if (item.category === 'EMI' || item.category === 'Insurance') {
        lines.push({ category: item.category, planned: item.plannedAmount });
      }
    }
  }
  const merged = new Map<string, number>();
  for (const line of lines) merged.set(line.category, (merged.get(line.category) ?? 0) + line.planned);
  return { lines: [...merged].map(([category, planned]) => ({ category, planned })), warnings };
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
    lines: budget.lines.map((line) => ({ category: line.category, mode: 'amount', value: line.planned })),
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

function lineActual(data: AppData, month: string, category: string): number {
  return data.transactions.filter((row) =>
    monthKey(row.date) === month
    && (row.category === category || (category === 'Other investments' && row.type === 'invest' && row.category === 'Other'))
    && (row.type === 'expense' || row.type === 'invest'),
  ).reduce((sum, row) => sum + row.amount, 0);
}

export type BudgetMonthView = {
  budget: MonthBudget | null;
  position: ReturnType<typeof monthPositionAt> & { previousClosing: number; flow: number };
  plannedIncome: number | null;
  actualEarned: number;
  lines: { category: string; planned: number; actual: number; remaining: number; usedPct: number | null; status: 'ok' | 'near' | 'over' }[];
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
  for (const category of SAVING_CATEGORIES) {
    const amount = commitments.filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.plannedAmount, 0);
    if (amount > 0) planned.set(category, Math.max(planned.get(category) ?? 0, amount));
  }
  const lines = [...planned].map(([category, amount]) => {
    const actual = lineActual(data, key, category);
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
  const plannedSpend = lines.filter((line) => !SAVING_CATEGORIES.has(line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const plannedSave = lines.filter((line) => SAVING_CATEGORIES.has(line.category))
    .reduce((sum, line) => sum + line.planned, 0);
  const budgetCategories = new Set(lines.map((line) => line.category));
  const unbudgeted = data.transactions.filter((row) =>
    monthKey(row.date) === key && (row.type === 'expense' || row.type === 'invest')
      && !budgetCategories.has(row.type === 'invest' && row.category === 'Other' ? 'Other investments' : row.category),
  ).reduce((sum, row) => sum + row.amount, 0);
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
  return {
    budget, position, plannedIncome: budget?.plannedIncome ?? null,
    actualEarned: position.earnedIncome, lines, commitments, plannedSpend, actualSpend, plannedSave, actualSave,
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
