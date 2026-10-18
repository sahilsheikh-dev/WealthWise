import { incomeBaselineFor } from './summary';
import { liabilitySchedule, planSchedule } from './schedule';
import { policySchedule } from './policySchedule';
import { investCategoryFor } from './links';
import { monthEndDate, monthPositionAt } from './cashFlow';
import { monthKey, shiftMonth } from './dates';
import { BUDGET_CATEGORIES, NON_EARNED_INCOME_CATEGORIES } from './schemas';
import type { ScheduleRow } from './schedule';
import type {
  AppData,
  BudgetLine,
  BudgetPlan,
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

export type LinkedRecurringRow = {
  kind: 'plan' | 'liability' | 'policy';
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: ISODate;
  status: BudgetCommitment['status'];
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
    hint: 'Essentials: living, rent, utilities, food, transport, family, health, bills, education, EMI and insurance.',
    weight: 50,
    categories: ['Living', 'Rent', 'Utilities', 'Food', 'Transport', 'Family', 'Health', 'Bills', 'Education', 'EMI', 'Insurance'],
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
    hint: 'Non-essential or lifestyle spending: subscriptions, personal spending, travel, eating out, online shopping, entertainment and fashion.',
    weight: 15,
    categories: ['Shopping', 'Other', 'Eating out', 'Entertainment', 'Fashion', 'Subscriptions', 'Personal spending', 'Travel'],
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
  survival: { Living: 20, Rent: 5, Utilities: 5, Food: 20, Transport: 10, Family: 10, Health: 5, Bills: 10, Education: 5, EMI: 5, Insurance: 5 },
  'savings-investments': {
    'Mutual fund / SIP': 25, 'Stocks / ETF': 15,
    'Fixed deposit / RD': 10, 'Gold / Silver': 10, 'Other investments': 40,
  },
  wants: {
    Shopping: 25, Other: 10, 'Eating out': 10, Entertainment: 10, Fashion: 10,
    Subscriptions: 15, 'Personal spending': 10, Travel: 10,
  },
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
      'policy', policy.id, policy.name, 'Insurance', key, policySchedule(policy, asOf).rows,
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

export function resolveBudgetPlan(
  plan: Pick<BudgetPlan, 'plannedIncome' | 'lines'>,
  plannedIncome = plan.plannedIncome,
): BudgetLine[] {
  return plan.lines.map((line) => {
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

export function suggestBudgetSplit(input: {
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
  const plan = data.budgetPlan;
  if (!plan) return data;
  const plannedIncome = plan.plannedIncome ?? incomeBaselineFor(data, options.today)?.amount ?? null;
  const lines = resolveBudgetPlan(plan, plannedIncome);
  return replaceMonth(data, {
    month, source: 'plan', plannedIncome, lines, linkedIncluded: true,
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
  input: { plannedIncome: number | null; lines?: BudgetLine[] },
): AppData {
  const month = monthOf(monthInput);
  const stored = monthRows(data).find((row) => row.month === month);
  const baseLines = stored?.lines ?? [];
  const base = stored ?? { month, source: 'custom' as const, plannedIncome: input.plannedIncome, lines: baseLines };
  return replaceMonth(data, {
    ...base, source: 'custom', plannedIncome: input.plannedIncome, lines: input.lines ?? baseLines,
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
  if (plan.plannedIncome === null && plan.lines.some((line) => line.mode === 'percent')
    && incomeBaselineFor(data, today) === null) return data;
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
  linkedByCategory?: { category: string; rows: LinkedRecurringRow[] }[];
  groupTotals?: { groupId: BudgetGroup['id']; groupName: string; planned: number }[];
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
  const includeLinked = budget?.linkedIncluded === true;
  const linkedRows = includeLinked ? linkedRecurringForMonth(data, key, monthEndDate(key)) : [];
  const planned = new Map((budget?.lines ?? []).map((line) => [line.category, line.planned]));
  if (includeLinked) {
    for (const row of linkedRows) {
      planned.set(row.category, (planned.get(row.category) ?? 0) + row.amount);
    }
  } else {
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
  const linkedByCategory = includeLinked
    ? BUDGET_CATEGORIES.flatMap((category) => {
      const rows = linkedRows.filter((row) => row.category === category);
      return rows.length === 0 ? [] : [{ category, rows }];
    })
    : [];
  const groupTotals = includeLinked
    ? BUDGET_GROUPS.map((group) => ({
      groupId: group.id,
      groupName: group.name,
      planned: lines.filter((line) => group.categories.includes(line.category))
        .reduce((sum, line) => sum + line.planned, 0),
    }))
    : [];
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
    ...(includeLinked ? { linkedByCategory, groupTotals } : {}),
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
