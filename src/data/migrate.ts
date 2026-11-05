import {
  policySchema,
  SCHEMA_VERSION,
} from '../domain/schemas';
import { shiftMonth } from '../domain/dates';
import { budgetGroupFor, defaultBudgetSections } from '../domain/budget';
import { policySchedule } from '../domain/policySchedule';

export class PersistedVersionError extends Error {
  constructor(readonly fromVersion: number, readonly reason: 'unknown-version' | 'future-version') {
    super(`Cannot migrate persisted data from version ${fromVersion}`);
    this.name = 'PersistedVersionError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateV1ToV2(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !Array.isArray(data.loans) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.transactions) ||
    'liabilities' in data
  ) {
    throw new PersistedVersionError(1, 'unknown-version');
  }
  const holdings = data.holdings.map((holding) => {
    if (!isRecord(holding)) throw new PersistedVersionError(1, 'unknown-version');
    if (holding.kind === 'manual') return { ...holding, logs: [] };
    if (holding.kind === 'plan' && Array.isArray(holding.logs)) {
      return {
        ...holding,
        logs: holding.logs.map((entry) =>
          isRecord(entry) ? { ...entry, kind: 'Deposit' } : entry,
        ),
      };
    }
    return holding;
  });
  const liabilities = data.loans.map((loan) => {
    if (!isRecord(loan) || !Array.isArray(loan.payments)) {
      throw new PersistedVersionError(1, 'unknown-version');
    }
    return {
      ...loan,
      kind: 'recurring',
      type: 'Other',
      payments: loan.payments.map((payment) => {
        if (!isRecord(payment)) throw new PersistedVersionError(1, 'unknown-version');
        return { ...payment, kind: payment.kind === 'Prepayment' ? 'Prepayment' : 'EMI' };
      }),
    };
  });
  const transactions = data.transactions.map((transaction) => {
    if (!isRecord(transaction) || !isRecord(transaction.source)) return transaction;
    const kind = transaction.source.kind;
    const migratedKind = kind === 'plan-log'
      ? 'holding-entry'
      : kind === 'loan-payment'
        ? 'liability-payment'
        : kind;
    return { ...transaction, source: { ...transaction.source, kind: migratedKind } };
  });
  const { loans: _loans, ...rest } = data;
  return { ...rest, holdings, liabilities, transactions };
}

export function migrateV2ToV3(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(2, 'unknown-version');
  }
  const settings = {
    ...data.settings,
    monthlySalary: null,
    onboarded: data.settings.name !== ''
      || data.transactions.length > 0
      || data.goals.some((goal) => !isRecord(goal) || goal.auto !== 'ef')
      || data.holdings.length > 0
      || data.liabilities.length > 0
      || data.efEntries.length > 0,
  };
  return { ...data, settings };
}

export function migrateV3ToV4(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(3, 'unknown-version');
  }
  return {
    ...data,
    efAllocation: data.efAllocation ?? null,
  };
}

export function migrateV4ToV5(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(4, 'unknown-version');
  }
  return {
    ...data,
    goals: data.goals.map((goal) => {
      if (!isRecord(goal)) throw new PersistedVersionError(4, 'unknown-version');
      return { ...goal, links: [] };
    }),
    liabilities: data.liabilities.map((liability) => {
      if (!isRecord(liability)) throw new PersistedVersionError(4, 'unknown-version');
      return liability.kind === 'recurring'
        ? { ...liability, settlement: null }
        : liability;
    }),
    policies: [],
    budget: null,
  };
}

export function migrateV5ToV6(data: unknown): unknown {
  if (
    !isRecord(data) ||
    !isRecord(data.settings) ||
    !Array.isArray(data.transactions) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.liabilities) ||
    !Array.isArray(data.policies) ||
    !Array.isArray(data.efEntries)
  ) {
    throw new PersistedVersionError(5, 'unknown-version');
  }
  return {
    ...data,
    efCustomBuckets: [],
    efBucketLinks: {},
  };
}

export type V6ToV7Options = {
  today: string;
  newId: () => string;
};

export function migrateV9ToV10(data: unknown, options: V6ToV7Options): unknown {
  if (!isRecord(data)
    || (data.budgetPlan !== null && !isRecord(data.budgetPlan))
    || (data.monthBudgets !== undefined && !Array.isArray(data.monthBudgets))) {
    throw new PersistedVersionError(9, 'unknown-version');
  }
  const sections = defaultBudgetSections();
  const mapCategory = (category: unknown): string => {
    if (typeof category !== 'string') throw new PersistedVersionError(9, 'unknown-version');
    const mapped = budgetGroupFor(category);
    return mapped?.id
      ?? sections.find((section) => section.type === 'spend' && section.system === undefined)?.id
      ?? 'survival';
  };
  const plan = data.budgetPlan;
  const budgetPlan = plan === null ? null : (() => {
    if (!isRecord(plan) || !Array.isArray(plan.incomes) || !Array.isArray(plan.lines)) {
      throw new PersistedVersionError(9, 'unknown-version');
    }
    const items = plan.lines.map((line) => {
      if (!isRecord(line) || typeof line.category !== 'string' || typeof line.value !== 'number'
        || (line.mode !== 'amount' && line.mode !== 'percent')) {
        throw new PersistedVersionError(9, 'unknown-version');
      }
      return {
        id: options.newId(),
        sectionId: mapCategory(line.category),
        name: line.category,
        mode: line.mode,
        value: line.value,
        ...(typeof line.dueDay === 'number' ? { dueDay: line.dueDay } : {}),
      };
    });
    const { lines: _lines, ...planWithoutLines } = plan;
    return { ...planWithoutLines, sections: sections.map((section) => ({ ...section })), items };
  })();
  const monthBudgets = data.monthBudgets?.map((snapshot) => {
    if (!isRecord(snapshot) || typeof snapshot.month !== 'string'
      || !Array.isArray(snapshot.incomes) || !Array.isArray(snapshot.lines)) {
      throw new PersistedVersionError(9, 'unknown-version');
    }
    const items = snapshot.lines.map((line, index) => {
      if (!isRecord(line) || typeof line.category !== 'string' || typeof line.planned !== 'number') {
        throw new PersistedVersionError(9, 'unknown-version');
      }
      const sectionId = mapCategory(line.category);
      return {
        id: `v10-${snapshot.month}-${index}`,
        sectionId,
        name: line.category,
        mode: 'amount',
        value: line.planned,
        ...(typeof line.dueDay === 'number' ? { dueDay: line.dueDay } : {}),
      };
    });
    const { lines: _lines, ...snapshotWithoutLines } = snapshot;
    return {
      ...snapshotWithoutLines,
      sections: sections.map((section) => ({ ...section })),
      items,
    };
  });
  return {
    ...data,
    budgetPlan,
    ...(monthBudgets === undefined ? {} : { monthBudgets }),
  };
}

function migrateBudgetLines<T extends Record<string, unknown>>(
  container: T,
  categoryKey: 'category',
  valueKey: 'planned',
): T {
  const lines = container.lines;
  if (!Array.isArray(lines)) return container;
  const migrated = new Map<string, Record<string, unknown>>();
  for (const line of lines) {
    if (!isRecord(line) || typeof line[categoryKey] !== 'string') {
      throw new PersistedVersionError(6, 'unknown-version');
    }
    const category = line[categoryKey] === 'Emergency fund' ? 'Other investments' : line[categoryKey];
    const current = migrated.get(category);
    if (current) {
      if (typeof current[valueKey] !== 'number' || typeof line[valueKey] !== 'number') {
        throw new PersistedVersionError(6, 'unknown-version');
      }
      current[valueKey] += line[valueKey];
    } else {
      migrated.set(category, { ...line, [categoryKey]: category });
    }
  }
  return { ...container, lines: [...migrated.values()] };
}

function migrateTemplate(template: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(template.lines)) throw new PersistedVersionError(6, 'unknown-version');
  const lines = new Map<string, Record<string, unknown>>();
  for (const line of template.lines) {
    if (!isRecord(line) || typeof line.category !== 'string' || typeof line.mode !== 'string' || typeof line.value !== 'number') {
      throw new PersistedVersionError(6, 'unknown-version');
    }
    const category = line.category === 'Emergency fund' ? 'Other investments' : line.category;
    const current = lines.get(category);
    if (!current) {
      lines.set(category, { ...line, category });
      continue;
    }
    if (current.mode === line.mode) {
      current.value = (current.value as number) + line.value;
      continue;
    }
    const income = template.plannedIncome;
    if (typeof income !== 'number' && (current.value !== 0 || line.value !== 0)) {
      throw new PersistedVersionError(6, 'unknown-version');
    }
    const currentAmount = current.mode === 'amount'
      ? current.value as number
      : (typeof income === 'number' ? (current.value as number) * income / 100 : 0);
    const lineAmount = line.mode === 'amount'
      ? line.value
      : (typeof income === 'number' ? line.value * income / 100 : 0);
    lines.set(category, { category, mode: 'amount', value: currentAmount + lineAmount });
  }
  return { ...template, lines: [...lines.values()] };
}

function migratedInvestCategory(type: unknown): string {
  if (type === 'Mutual fund / SIP') return 'Mutual fund / SIP';
  if (type === 'Stocks / ETF') return 'Stocks / ETF';
  if (type === 'Fixed deposit' || type === 'Recurring deposit') return 'Fixed deposit / RD';
  if (type === 'Gold' || type === 'Silver') return 'Gold / Silver';
  return 'Other investments';
}

export function migrateV6ToV7(data: unknown, options: V6ToV7Options): unknown {
  if (
    !isRecord(data) ||
    !Array.isArray(data.efEntries) ||
    !Array.isArray(data.holdings) ||
    !Array.isArray(data.goals) ||
    !Array.isArray(data.transactions)
  ) {
    throw new PersistedVersionError(6, 'unknown-version');
  }

  const balance = data.efEntries.reduce((total, entry) => {
    if (!isRecord(entry) || typeof entry.amount !== 'number' || !Number.isFinite(entry.amount)) {
      throw new PersistedVersionError(6, 'unknown-version');
    }
    return total + entry.amount;
  }, 0);
  const holdings = [...data.holdings];
  type MigrationGoal = Record<string, unknown> & { links: Record<string, unknown>[] };
  let goals: MigrationGoal[] = data.goals.map((goal) => {
    if (!isRecord(goal)) throw new PersistedVersionError(6, 'unknown-version');
    const links = Array.isArray(goal.links) ? goal.links : [];
    if (!links.every(isRecord)) throw new PersistedVersionError(6, 'unknown-version');
    return { ...goal, links: links.map((link) => ({ ...link })) };
  });
  let emergency = goals.find((goal) => goal.auto === 'ef');
  if (!emergency) {
    emergency = {
      id: 'goal-emergency-fund',
      name: 'Emergency fund',
      target: 0,
      saved: 0,
      year: Number(options.today.slice(0, 4)),
      auto: 'ef',
      links: [],
    };
    goals = [...goals, emergency];
  }
  if (balance > 0) {
    const id = options.newId();
    if (!id || holdings.some((holding) => isRecord(holding) && holding.id === id)) {
      throw new PersistedVersionError(6, 'unknown-version');
    }
    holdings.push({
      id,
      kind: 'manual',
      name: 'Emergency fund (migrated)',
      type: 'Savings account',
      invested: balance,
      value: balance,
      valueAsOf: options.today,
      logs: [],
    });
    emergency.links = [...emergency.links, { instrumentId: id, share: 100 }];
  }

  const firstBucket = new Map<string, string>();
  const migratedBucketLinks: Record<string, string[]> = {};
  if (isRecord(data.efBucketLinks)) {
    for (const [bucketId, value] of Object.entries(data.efBucketLinks)) {
      if (!Array.isArray(value)) continue;
      const retained = value.filter((holdingId): holdingId is string => {
        if (typeof holdingId !== 'string' || !holdings.some((holding) => isRecord(holding) && holding.id === holdingId)) return false;
        if (firstBucket.has(holdingId)) return false;
        firstBucket.set(holdingId, bucketId);
        return true;
      });
      migratedBucketLinks[bucketId] = retained;
    }
  }
  for (const holdingId of firstBucket.keys()) {
    const existing = emergency.links.find((link) => isRecord(link) && link.instrumentId === holdingId);
    if (existing) continue;
    const allocated = goals.flatMap((goal) => Array.isArray(goal.links) ? goal.links : [])
      .filter((link) => isRecord(link) && link.instrumentId === holdingId)
      .reduce((sum, link) => sum + (typeof link.share === 'number' ? link.share : 0), 0);
    const free = Math.floor(Math.max(0, 100 - allocated) * 10) / 10;
    if (free < 0.1) {
      const bucketId = firstBucket.get(holdingId);
      if (bucketId) migratedBucketLinks[bucketId] = migratedBucketLinks[bucketId].filter((id) => id !== holdingId);
    } else {
      emergency.links.push({ instrumentId: holdingId, share: free });
    }
  }

  const transactions = data.transactions.map((transaction) => {
    if (!isRecord(transaction)) throw new PersistedVersionError(6, 'unknown-version');
    const { source, ...withoutSource } = transaction;
    const next: Record<string, unknown> = source && isRecord(source) && source.kind === 'ef-entry'
      ? withoutSource
      : { ...transaction };
    if (transaction.category === 'Emergency fund') {
      let holdingType: unknown;
      if (source && isRecord(source) && source.kind === 'holding-entry') {
        const holding = holdings.find((item) => isRecord(item) && item.id === source.parentId);
        holdingType = isRecord(holding) ? holding.type : undefined;
      }
      next.category = migratedInvestCategory(holdingType);
    }
    return next;
  });
  const result: Record<string, unknown> = { ...data, holdings, goals, transactions, efBucketLinks: migratedBucketLinks };
  delete result.efEntries;
  if (isRecord(result.budget)) result.budget = migrateBudgetLines(result.budget, 'category', 'planned');
  if (Array.isArray(result.budgetTemplates)) {
    result.budgetTemplates = result.budgetTemplates.map((template) => {
      if (!isRecord(template)) throw new PersistedVersionError(6, 'unknown-version');
      return migrateTemplate(template);
    });
  }
  if (Array.isArray(result.monthBudgets)) {
    result.monthBudgets = result.monthBudgets.map((budget) => {
      if (!isRecord(budget)) throw new PersistedVersionError(6, 'unknown-version');
      return migrateBudgetLines(budget, 'category', 'planned');
    });
  }
  return result;
}

export function migrateV7ToV8(data: unknown): unknown {
  if (!isRecord(data)) {
    throw new PersistedVersionError(7, 'unknown-version');
  }
  const templates = Array.isArray(data.budgetTemplates) ? data.budgetTemplates : [];
  if (!templates.every(isRecord)) throw new PersistedVersionError(7, 'unknown-version');
  if (data.monthBudgets !== undefined && !Array.isArray(data.monthBudgets)) {
    throw new PersistedVersionError(7, 'unknown-version');
  }

  const templateById = new Map<string, Record<string, unknown>>();
  for (const template of templates) {
    if (typeof template.id !== 'string' || !Array.isArray(template.lines)) {
      throw new PersistedVersionError(7, 'unknown-version');
    }
    templateById.set(template.id, template);
  }

  const snapshots = Array.isArray(data.monthBudgets) ? data.monthBudgets : [];
  if (!snapshots.every(isRecord)) throw new PersistedVersionError(7, 'unknown-version');
  const counts = new Map<string, number>();
  const latestMonth = new Map<string, string>();
  for (const snapshot of snapshots) {
    if (typeof snapshot.templateId !== 'string') continue;
    const id = snapshot.templateId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (typeof snapshot.month === 'string'
      && snapshot.month > (latestMonth.get(id) ?? '')) latestMonth.set(id, snapshot.month);
  }

  const defaultId = typeof data.defaultBudgetTemplateId === 'string'
    ? data.defaultBudgetTemplateId
    : null;
  const templateOrder = new Map(templates.map((template, index) => [template.id as string, index]));
  const selected = (defaultId === null ? undefined : templateById.get(defaultId))
    ?? [...templateById.entries()].sort(([leftId], [rightId]) => {
      const countDifference = (counts.get(rightId) ?? 0) - (counts.get(leftId) ?? 0);
      if (countDifference !== 0) return countDifference;
      const monthDifference = (latestMonth.get(rightId) ?? '').localeCompare(latestMonth.get(leftId) ?? '');
      if (monthDifference !== 0) return monthDifference;
      return (templateOrder.get(leftId) ?? 0) - (templateOrder.get(rightId) ?? 0);
    })[0]?.[1];

  let budgetPlan: Record<string, unknown> | null = null;
  if (selected) {
    if (!Array.isArray(selected.lines)) throw new PersistedVersionError(7, 'unknown-version');
    budgetPlan = {
      plannedIncome: selected.plannedIncome ?? null,
      lines: selected.lines.filter((line): line is Record<string, unknown> =>
        isRecord(line) && line.category !== 'EMI' && line.category !== 'Insurance',
      ),
      repeatMonthly: false,
      repeatFrom: null,
    };
  }

  const monthBudgets = snapshots.map((snapshot) => {
    const { templateId: _templateId, templateName: _templateName, customized: _customized, linkedIncluded: _linkedIncluded, ...rest } = snapshot;
    return { ...rest, source: 'custom', linkedIncluded: false };
  });
  const { budgetTemplates: _budgetTemplates, defaultBudgetTemplateId: _defaultBudgetTemplateId, ...rest } = data;
  return { ...rest, budgetPlan, monthBudgets };
}

const earnedIncomeCategories = new Set([
  'Salary', 'Freelance', 'Rental', 'Business', 'Interest', 'Other',
]);
const nonEarnedIncomeCategories = new Set([
  'Withdrawal', 'Borrowed', 'Loan proceeds', 'Own funds',
]);

function mostCommonEarnedIncomeCategory(transactions: unknown[], today: string): string {
  const currentMonth = today.slice(0, 7);
  const firstMonth = shiftMonth(currentMonth, -2);
  const counts = new Map<string, number>();
  for (const transaction of transactions) {
    if (!isRecord(transaction)
      || transaction.type !== 'income'
      || typeof transaction.category !== 'string'
      || !earnedIncomeCategories.has(transaction.category)
      || typeof transaction.date !== 'string'
      || transaction.date > today
      || transaction.date.slice(0, 7) < firstMonth
      || transaction.date.slice(0, 7) > currentMonth
      || nonEarnedIncomeCategories.has(transaction.category)) continue;
    counts.set(transaction.category, (counts.get(transaction.category) ?? 0) + 1);
  }
  return [...counts]
    .sort(([leftCategory, leftCount], [rightCategory, rightCount]) =>
      rightCount - leftCount || leftCategory.localeCompare(rightCategory),
    )[0]?.[0] ?? 'Salary';
}

export function migrateV8ToV9(data: unknown, options: V6ToV7Options): unknown {
  if (!isRecord(data)
    || !isRecord(data.settings)
    || !Array.isArray(data.transactions)
    || (data.budgetPlan !== null && !isRecord(data.budgetPlan))
    || (data.monthBudgets !== undefined && !Array.isArray(data.monthBudgets))) {
    throw new PersistedVersionError(8, 'unknown-version');
  }
  const category = mostCommonEarnedIncomeCategory(data.transactions, options.today);
  const budgetPlan = data.budgetPlan === null
    ? null
    : (() => {
      const plan = data.budgetPlan;
      if (!isRecord(plan) || (plan.plannedIncome !== null && typeof plan.plannedIncome !== 'number')) {
        throw new PersistedVersionError(8, 'unknown-version');
      }
      const salary = data.settings.monthlySalary;
      if (salary !== null && typeof salary !== 'number') {
        throw new PersistedVersionError(8, 'unknown-version');
      }
      const amount = plan.plannedIncome ?? salary ?? 0;
      if (!Number.isFinite(amount) || amount < 0) {
        throw new PersistedVersionError(8, 'unknown-version');
      }
      const { plannedIncome: _plannedIncome, ...rest } = plan;
      return {
        ...rest,
        incomes: amount === 0
          ? []
          : [{ id: options.newId(), name: 'Salary', category, amount, day: 1 }],
      };
    })();
  const monthBudgets = data.monthBudgets?.map((snapshot) => {
    if (!isRecord(snapshot)
      || (snapshot.plannedIncome !== null && typeof snapshot.plannedIncome !== 'number')) {
      throw new PersistedVersionError(8, 'unknown-version');
    }
    const { plannedIncome: _plannedIncome, ...rest } = snapshot;
    const amount = snapshot.plannedIncome;
    if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
      throw new PersistedVersionError(8, 'unknown-version');
    }
    return {
      ...rest,
      incomes: amount === null
        ? []
        : [{ id: options.newId(), name: 'Income', category, amount }],
    };
  });
  return {
    ...data,
    budgetPlan,
    ...(monthBudgets === undefined ? {} : { monthBudgets }),
  };
}

export function migrateV10ToV11(data: unknown, options: Pick<V6ToV7Options, 'today'>): unknown {
  if (!isRecord(data) || !Array.isArray(data.policies)) {
    throw new PersistedVersionError(10, 'unknown-version');
  }
  const policies = data.policies.map((value) => {
    if (!isRecord(value) || !Array.isArray(value.payments)) {
      throw new PersistedVersionError(10, 'unknown-version');
    }
    const payments = value.payments;
    if (!payments.every(isRecord)) throw new PersistedVersionError(10, 'unknown-version');
    const paymentDates = payments.flatMap((payment) =>
      typeof payment.date === 'string' ? [payment.date] : [],
    ).sort();
    const startDate = typeof value.startDate === 'string'
      ? value.startDate
      : paymentDates[0] ?? options.today;
    const legacyKind = value.kind;
    const kind = legacyKind === 'term'
      ? 'term-life'
      : legacyKind === 'vehicle'
        ? 'motor'
        : legacyKind;
    if (kind !== 'term-life' && kind !== 'health' && kind !== 'life-savings'
      && kind !== 'ulip' && kind !== 'motor' && kind !== 'home' && kind !== 'other') {
      throw new PersistedVersionError(10, 'unknown-version');
    }
    const frequency = value.frequency === 'single'
      ? 'yearly'
      : value.frequency === 'monthly' || value.frequency === 'quarterly'
        || value.frequency === 'half-yearly' || value.frequency === 'yearly'
        ? value.frequency
        : 'yearly';
    const premiumYears = value.frequency === 'single'
      ? 1
      : typeof value.premiumYears === 'number' ? value.premiumYears : 1;
    const sumAssured = typeof value.coverAmount === 'number' && value.coverAmount >= 0
      ? value.coverAmount
      : undefined;
    const endDate = typeof value.maturityDate === 'string' && value.maturityDate > startDate
      ? value.maturityDate
      : undefined;
    const { coverAmount: _coverAmount, maturityDate: _maturityDate, ...rest } = value;
    return {
      ...rest,
      kind,
      frequency,
      startDate,
      trackFrom: typeof value.trackFrom === 'string' ? value.trackFrom : startDate,
      premiumYears,
      status: 'active',
      ...(sumAssured === undefined ? {} : { sumAssured }),
      ...(endDate === undefined ? {} : { endDate }),
    };
  });
  return { ...data, policies };
}

export function migrateV11ToV12(data: unknown): unknown {
  if (!isRecord(data)) throw new PersistedVersionError(11, 'unknown-version');
  const moveLegacyInsuranceItems = (budget: unknown): unknown => {
    if (!isRecord(budget) || !Array.isArray(budget.sections) || !Array.isArray(budget.items)) {
      return budget;
    }
    const needsInsuranceSection = budget.items.some((item) =>
      isRecord(item) && item.name === 'Insurance' && item.sectionId !== 'insurance',
    );
    if (!needsInsuranceSection) return budget;
    const sections = [...budget.sections];
    const existingIndex = sections.findIndex((section) =>
      isRecord(section) && section.id === 'insurance',
    );
    if (existingIndex >= 0) {
      const existing = sections[existingIndex];
      if (isRecord(existing)) {
        sections[existingIndex] = { ...existing, id: 'insurance', name: 'Insurance', type: 'spend', system: 'insurance' };
      }
    } else {
      const insuranceSection = defaultBudgetSections().find((section) => section.system === 'insurance');
      if (insuranceSection) sections.push(insuranceSection);
    }
    return {
      ...budget,
      sections,
      items: budget.items.map((item) =>
        isRecord(item) && item.name === 'Insurance' ? { ...item, sectionId: 'insurance' } : item,
      ),
    };
  };
  return {
    ...data,
    coverGoals: [
      { type: 'term-life', targetMode: 'income-multiple', targetValue: 10 },
      { type: 'health', targetMode: 'amount' },
      { type: 'motor', targetMode: 'active-only' },
      { type: 'home', targetMode: 'active-only' },
      { type: 'other', targetMode: 'active-only' },
    ],
    ...(data.budgetPlan === null || data.budgetPlan === undefined
      ? {}
      : { budgetPlan: moveLegacyInsuranceItems(data.budgetPlan) }),
    ...(Array.isArray(data.monthBudgets)
      ? { monthBudgets: data.monthBudgets.map(moveLegacyInsuranceItems) }
      : {}),
  };
}

export function migrateV12ToV13(data: unknown): unknown {
  if (!isRecord(data)) throw new PersistedVersionError(12, 'unknown-version');
  const migrateBudget = (budget: unknown): unknown => {
    if (!isRecord(budget) || !Array.isArray(budget.items)) return budget;
    return {
      ...budget,
      items: budget.items.map((item) => {
        if (!isRecord(item)) return item;
        const { firstDueMonth: _firstDueMonth, ...monthlyItem } = item;
        return { ...monthlyItem, frequency: 'monthly' };
      }),
    };
  };
  return {
    ...data,
    ...(data.budgetPlan === null || data.budgetPlan === undefined
      ? {}
      : { budgetPlan: migrateBudget(data.budgetPlan) }),
    ...(Array.isArray(data.monthBudgets)
      ? { monthBudgets: data.monthBudgets.map(migrateBudget) }
      : {}),
  };
}

export function migrateV13ToV14(persisted: unknown): unknown {
  if (!isRecord(persisted)) return persisted;
  const migrateBudget = (budget: unknown): unknown => budget;
  return {
    ...persisted,
    ...(persisted.budgetPlan === null || persisted.budgetPlan === undefined
      ? {}
      : { budgetPlan: migrateBudget(persisted.budgetPlan) }),
    ...(Array.isArray(persisted.monthBudgets)
      ? { monthBudgets: persisted.monthBudgets.map(migrateBudget) }
      : {}),
  };
}

export function migrateV14ToV15(persisted: unknown): unknown {
  if (!isRecord(persisted) || !Array.isArray(persisted.coverGoals)) return persisted;
  const names: Record<string, string> = {
    'term-life': 'Term life',
    health: 'Health',
    motor: 'Motor',
    home: 'Home',
    other: 'Other',
  };
  const coverGoals = persisted.coverGoals.map((goal) => {
    if (!isRecord(goal) || typeof goal.type !== 'string' || typeof goal.targetMode !== 'string') return goal;
    const target = goal.targetMode === 'income-multiple' && typeof goal.targetValue === 'number'
      ? { mode: 'income-multiple', value: goal.targetValue }
      : goal.targetMode === 'amount' && typeof goal.targetValue === 'number'
        ? { mode: 'amount', value: goal.targetValue }
        : goal.targetMode === 'amount' && goal.targetValue === undefined
          ? { mode: 'none' }
          : goal.targetMode === 'active-only' && goal.targetValue === undefined
            ? { mode: 'active-only' }
            : null;
    if (target === null) return goal;
    return {
      id: `cover-${goal.type}`,
      name: names[goal.type] ?? goal.type,
      kind: goal.type,
      target,
    };
  });
  return { ...persisted, coverGoals };
}

export function migrateV15ToV16(persisted: unknown): unknown {
  if (!isRecord(persisted) || !Array.isArray(persisted.holdings)) return persisted;
  const budgets = [
    persisted.budgetPlan,
    ...(Array.isArray(persisted.monthBudgets) ? persisted.monthBudgets : []),
  ];
  const hasBudgetSchedule = (holdingId: unknown) => budgets.some((budget) =>
    isRecord(budget) &&
    Array.isArray(budget.items) &&
    budget.items.some((item) => isRecord(item) && item.holdingId === holdingId),
  );
  let changed = false;
  const holdings = persisted.holdings.map((holding) => {
    if (!isRecord(holding)) return holding;
    const combinedType = holding.type === 'Fixed deposit / RD' || holding.type === 'FD / RD';
    const hasSchedule = holding.kind === 'plan' || hasBudgetSchedule(holding.id);
    const scheduledFixedDeposit = holding.type === 'Fixed deposit' && hasSchedule;
    if (!combinedType && !scheduledFixedDeposit) return holding;
    const hasEntries = Array.isArray(holding.logs) && holding.logs.length > 0;
    changed = true;
    return {
      ...holding,
      type: combinedType && !hasEntries && !hasSchedule
        ? 'Fixed deposit'
        : 'Recurring deposit',
    };
  });
  return changed ? { ...persisted, holdings } : persisted;
}

export function migrateV16ToV17(persisted: unknown): unknown {
  if (!isRecord(persisted) || !Array.isArray(persisted.policies)) {
    throw new PersistedVersionError(16, 'unknown-version');
  }
  const policies = persisted.policies.map((policy) => {
    if (!isRecord(policy)) throw new PersistedVersionError(16, 'unknown-version');
    const { coverGoalId: _coverGoalId, ...withoutCoverGoal } = policy;
    return withoutCoverGoal;
  });
  const { coverGoals: _coverGoals, ...withoutCoverGoals } = persisted;
  return { ...withoutCoverGoals, policies };
}

export function migrateV17ToV18(persisted: unknown, options: Pick<V6ToV7Options, 'today'>): unknown {
  if (!isRecord(persisted) || !Array.isArray(persisted.policies)) {
    throw new PersistedVersionError(17, 'unknown-version');
  }
  const policies = persisted.policies.map((value) => {
    if (!isRecord(value) || typeof value.id !== 'string' || !Array.isArray(value.payments)) {
      throw new PersistedVersionError(17, 'unknown-version');
    }
    const parsed = policySchema.safeParse(value);
    if (!parsed.success) throw new PersistedVersionError(17, 'unknown-version');
    const policy = parsed.data;
    const dueDates = new Map<string, string>();
    for (const row of policySchedule(policy, options.today).rows) {
      if (row.status === 'paid' && row.entryId !== undefined) dueDates.set(row.entryId, row.dueDate);
    }
    const payments = value.payments.map((entry) => {
      if (!isRecord(entry) || typeof entry.id !== 'string') {
        throw new PersistedVersionError(17, 'unknown-version');
      }
      const dueDate = dueDates.get(entry.id);
      return dueDate === undefined ? entry : { ...entry, dueDate };
    });
    return { ...value, payments };
  });
  return { ...persisted, policies };
}

export function migratePersisted(
  persisted: unknown,
  fromVersion: number,
  options?: V6ToV7Options,
): unknown {
  if (fromVersion === SCHEMA_VERSION) return persisted;
  if (fromVersion > SCHEMA_VERSION) throw new PersistedVersionError(fromVersion, 'future-version');
  if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
    throw new PersistedVersionError(fromVersion, 'unknown-version');
  }
  const migrateData = (data: unknown) => {
    let result = data;
    if (fromVersion === 1) result = migrateV1ToV2(result);
    if (fromVersion <= 2) result = migrateV2ToV3(result);
    if (fromVersion <= 3) result = migrateV3ToV4(result);
    if (fromVersion <= 4) result = migrateV4ToV5(result);
    if (fromVersion <= 5) result = migrateV5ToV6(result);
    if (fromVersion <= 6) {
      if (!options) throw new PersistedVersionError(6, 'unknown-version');
      result = migrateV6ToV7(result, options);
    }
    if (fromVersion <= 7) result = migrateV7ToV8(result);
    if (fromVersion <= 8) {
      if (!options) throw new PersistedVersionError(8, 'unknown-version');
      result = migrateV8ToV9(result, options);
    }
    if (fromVersion <= 9) {
      if (!options) throw new PersistedVersionError(9, 'unknown-version');
      result = migrateV9ToV10(result, options);
    }
    if (fromVersion <= 10) {
      if (!options) throw new PersistedVersionError(10, 'unknown-version');
      result = migrateV10ToV11(result, options);
    }
    if (fromVersion <= 11) result = migrateV11ToV12(result);
    if (fromVersion <= 12) result = migrateV12ToV13(result);
    if (fromVersion <= 13) result = migrateV13ToV14(result);
    if (fromVersion <= 14) result = migrateV14ToV15(result);
    if (fromVersion <= 15) result = migrateV15ToV16(result);
    if (fromVersion <= 16) result = migrateV16ToV17(result);
    if (fromVersion <= 17) {
      if (!options) throw new PersistedVersionError(17, 'unknown-version');
      result = migrateV17ToV18(result, options);
    }
    return result;
  };
  if (isRecord(persisted) && 'data' in persisted) {
    return { ...persisted, data: migrateData(persisted.data) };
  }
  return migrateData(persisted);
}
