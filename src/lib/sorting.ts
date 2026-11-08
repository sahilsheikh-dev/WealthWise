export type SortSpec = { key: string; dir: 'asc' | 'desc' };
export type SortOption = { key: string; label: string };

export const SORT_OPTIONS = {
  transactions: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type' },
    { key: 'created', label: 'Created' },
  ],
  goals: [
    { key: 'targetYear', label: 'Target year' },
    { key: 'progress', label: 'Progress' },
    { key: 'targetAmount', label: 'Target amount' },
    { key: 'name', label: 'Name' },
    { key: 'remaining', label: 'Remaining' },
    { key: 'created', label: 'Created' },
  ],
  assets: [
    { key: 'value', label: 'Value' },
    { key: 'invested', label: 'Invested' },
    { key: 'gainPct', label: 'Gain %' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'nextDue', label: 'Next due' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  sips: [
    { key: 'value', label: 'Value' },
    { key: 'invested', label: 'Invested' },
    { key: 'gainPct', label: 'Gain %' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'nextDue', label: 'Next due' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  recurringPlans: [
    { key: 'value', label: 'Value' },
    { key: 'invested', label: 'Invested' },
    { key: 'gainPct', label: 'Gain %' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'nextDue', label: 'Next due' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  liabilities: [
    { key: 'balance', label: 'Balance' },
    { key: 'emi', label: 'EMI' },
    { key: 'nextDue', label: 'Next due' },
    { key: 'name', label: 'Name' },
    { key: 'rate', label: 'Rate' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  emis: [
    { key: 'balance', label: 'Balance' },
    { key: 'emi', label: 'EMI' },
    { key: 'nextDue', label: 'Next due' },
    { key: 'name', label: 'Name' },
    { key: 'rate', label: 'Rate' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  insurance: [
    { key: 'nextDue', label: 'Next due' },
    { key: 'premium', label: 'Premium' },
    { key: 'cover', label: 'Cover' },
    { key: 'maturityDate', label: 'Maturity date' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
  ],
  schedules: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ],
  entries: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ],
  payments: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ],
  logs: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ],
  emergencyFund: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
  ],
  budgetSpending: [
    { key: 'planned', label: 'Planned' },
    { key: 'actual', label: 'Actual' },
    { key: 'percentUsed', label: 'Percent used' },
    { key: 'name', label: 'Name' },
  ],
  budgetHistory: [
    { key: 'month', label: 'Month' },
    { key: 'plannedSpend', label: 'Planned spend' },
    { key: 'actualSpend', label: 'Actual spend' },
    { key: 'plannedSave', label: 'Planned saving' },
    { key: 'actualInvested', label: 'Actual invested' },
    { key: 'savingsRate', label: 'Savings rate' },
    { key: 'closing', label: 'Closing balance' },
    { key: 'outstanding', label: 'Outstanding amount' },
    { key: 'templateName', label: 'Template name' },
    { key: 'customized', label: 'Customized' },
  ],
  monthReview: [{ key: 'month', label: 'Month' }],
  linkMissing: [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
  ],
  reminders: [{ key: 'date', label: 'Date' }],
} as const satisfies Record<string, readonly SortOption[]>;

export type SortList = keyof typeof SORT_OPTIONS;

export const DEFAULT_SORTS: Record<SortList, SortSpec> = {
  transactions: { key: 'date', dir: 'desc' },
  goals: { key: 'targetYear', dir: 'asc' },
  assets: { key: 'value', dir: 'desc' },
  sips: { key: 'value', dir: 'desc' },
  recurringPlans: { key: 'value', dir: 'desc' },
  liabilities: { key: 'balance', dir: 'desc' },
  emis: { key: 'balance', dir: 'desc' },
  insurance: { key: 'nextDue', dir: 'asc' },
  schedules: { key: 'date', dir: 'asc' },
  entries: { key: 'date', dir: 'desc' },
  payments: { key: 'date', dir: 'desc' },
  logs: { key: 'date', dir: 'desc' },
  emergencyFund: { key: 'date', dir: 'desc' },
  budgetSpending: { key: 'planned', dir: 'asc' },
  budgetHistory: { key: 'month', dir: 'desc' },
  monthReview: { key: 'month', dir: 'desc' },
  linkMissing: { key: 'date', dir: 'desc' },
  reminders: { key: 'date', dir: 'asc' },
};

function valueFor(item: object, key: string, index: number): unknown {
  if (key === 'created') {
    const createdIndex: unknown = Reflect.get(item, 'sortCreatedIndex');
    return typeof createdIndex === 'number' ? createdIndex : index;
  }
  if (key === 'outstanding') {
    const outstanding: unknown = Reflect.get(item, 'outstanding');
    return typeof outstanding === 'object' && outstanding !== null
      ? Reflect.get(outstanding, 'amount')
      : undefined;
  }
  const aliases: Record<string, string[]> = {
    targetYear: ['targetYear', 'year'],
    targetAmount: ['targetAmount', 'target'],
    progress: ['progress', 'progressPct', 'pct', 'principalPaidPct'],
    remaining: ['remaining', 'remainingAmount'],
    gainPct: ['gainPct'],
    nextDue: ['nextDue', 'nextDueDate', 'dueDate'],
    rate: ['rate', 'ratePct'],
    emi: ['sortEmi', 'emi'],
    premium: ['premium', 'premiumAmount'],
    cover: ['cover', 'coverAmount'],
    percentUsed: ['percentUsed', 'usedPct'],
    savingsRate: ['savingsRatePct'],
    month: ['month'],
  };
  for (const field of aliases[key] ?? [key]) {
    const value: unknown = Reflect.get(item, field);
    if (value !== undefined) return value;
  }
  return undefined;
}

function compareValues(a: unknown, b: unknown): number {
  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull || bNull) return aNull === bNull ? 0 : aNull ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function resolveSortSpec(
  stored: unknown,
  options: readonly SortOption[],
  defaultSpec: SortSpec,
): SortSpec | null {
  if (stored === undefined || stored === null) return null;
  if (typeof stored !== 'object') return defaultSpec;
  const candidate = stored as { key?: unknown; dir?: unknown };
  return typeof candidate.key === 'string' &&
    (candidate.dir === 'asc' || candidate.dir === 'desc') &&
    options.some((option) => option.key === candidate.key)
    ? { key: candidate.key, dir: candidate.dir }
    : defaultSpec;
}

export function sortItems<T extends object>(
  items: readonly T[],
  list: SortList,
  spec: SortSpec,
): T[] {
  if (!SORT_OPTIONS[list].some((option) => option.key === spec.key) ||
    (spec.dir !== 'asc' && spec.dir !== 'desc')) return [...items];
  const direction = spec.dir === 'asc' ? 1 : -1;
  return items
    .map((item, index) => ({ item, index, value: valueFor(item, spec.key, index) }))
    .sort((a, b) => {
      const compared = compareValues(a.value, b.value);
      if (compared !== 0) {
        const nullSort = a.value === null || a.value === undefined ||
          b.value === null || b.value === undefined;
        return nullSort ? compared : compared * direction;
      }
      const idOrder = itemId(a.item, a.index).localeCompare(itemId(b.item, b.index));
      return idOrder || a.index - b.index;
    })
    .map(({ item }) => item);
}

function itemId(item: object, index: number): string {
  for (const key of ['id', 'entryId', 'slotKey', 'month']) {
    const value: unknown = Reflect.get(item, key);
    if (typeof value === 'string') return value;
  }
  return String(index);
}

export function sortIfSelected<T extends object>(
  items: readonly T[],
  list: SortList,
  spec: SortSpec | null,
): T[] {
  return spec ? sortItems(items, list, spec) : [...items];
}
