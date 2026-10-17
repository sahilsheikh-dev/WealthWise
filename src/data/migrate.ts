import { SCHEMA_VERSION } from '../domain/schemas';

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
    return result;
  };
  if (isRecord(persisted) && 'data' in persisted) {
    return { ...persisted, data: migrateData(persisted.data) };
  }
  return migrateData(persisted);
}
