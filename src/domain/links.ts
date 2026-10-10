import type { AppData, HoldingType, InvestmentEntry, Transaction } from './types';

export type TransactionSource = NonNullable<Transaction['source']>;

export class LinkedTransactionError extends Error {
  constructor(message = 'This transaction is linked to a holding, liability, or emergency fund entry and must be changed there.') {
    super(message);
    this.name = 'LinkedTransactionError';
  }
}

export type IntegrityIssue = {
  code: string;
  message: string;
  path: (string | number)[];
};

export type DescribedSource = {
  label: string;
  route: string;
  params: Record<string, string>;
};

function holdingEntries(holding: AppData['holdings'][number]): InvestmentEntry[] {
  return holding.logs;
}

export function describeSource(data: AppData, source: TransactionSource): DescribedSource | null {
  if (source.kind === 'holding-entry') {
    const holding = data.holdings.find((item) => item.id === source.parentId);
    return holding && holdingEntries(holding).some((entry) => entry.id === source.entryId)
      ? { label: holding.name, route: '/plan-logs', params: { id: holding.id } }
      : null;
  }
  if (source.kind === 'liability-payment') {
    const liability = data.liabilities.find((entry) => entry.id === source.parentId);
    return liability?.payments.some((entry) => entry.id === source.entryId)
      ? { label: liability.name, route: '/liability-payments', params: { id: liability.id } }
      : null;
  }
  const goal = data.goals.find((entry) => entry.id === source.parentId && entry.auto === 'ef');
  return goal && data.efEntries.some((entry) => entry.id === source.entryId)
    ? { label: 'Emergency fund', route: '/emergency-fund', params: {} }
    : null;
}

export function findLinkedTransaction(
  data: AppData,
  kind: TransactionSource['kind'],
  entryId: string,
): Transaction | undefined {
  return data.transactions.find((transaction) =>
    transaction.source?.kind === kind && transaction.source.entryId === entryId,
  );
}

export function investCategoryFor(
  type: HoldingType,
): 'Mutual fund / SIP' | 'Stocks / ETF' | 'Fixed deposit / RD' | 'Gold / Silver' | 'Other' {
  switch (type) {
    case 'Mutual fund / SIP':
      return 'Mutual fund / SIP';
    case 'Stocks / ETF':
      return 'Stocks / ETF';
    case 'Recurring deposit':
      return 'Fixed deposit / RD';
    case 'Gold':
    case 'Silver':
      return 'Gold / Silver';
    default:
      return 'Other';
  }
}

export function validateIntegrity(data: AppData): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const add = (code: string, message: string, path: (string | number)[]) => {
    issues.push({ code, message, path });
  };

  const allHoldingEntries = data.holdings.flatMap((holding) => holdingEntries(holding));
  const collections: { name: string; ids: string[] }[] = [
    { name: 'transactions', ids: data.transactions.map(({ id }) => id) },
    { name: 'goals', ids: data.goals.map(({ id }) => id) },
    { name: 'holdings', ids: data.holdings.map(({ id }) => id) },
    { name: 'liabilities', ids: data.liabilities.map(({ id }) => id) },
    { name: 'efEntries', ids: data.efEntries.map(({ id }) => id) },
    { name: 'holdingEntries', ids: allHoldingEntries.map(({ id }) => id) },
    { name: 'liabilityPayments', ids: data.liabilities.flatMap((item) => item.payments.map(({ id }) => id)) },
  ];
  for (const collection of collections) {
    const seen = new Set<string>();
    collection.ids.forEach((id, index) => {
      if (seen.has(id)) add('duplicate-id', `Duplicate id "${id}" in ${collection.name}.`, [collection.name, index, 'id']);
      seen.add(id);
    });
  }

  const linked = new Map<string, Transaction[]>();
  for (const [index, transaction] of data.transactions.entries()) {
    const source = transaction.source;
    if (!source) continue;
    const rows = linked.get(source.entryId) ?? [];
    rows.push(transaction);
    linked.set(source.entryId, rows);
    if (rows.length > 1) {
      add('duplicate-source', 'More than one transaction points at the same source entry.', ['transactions', index, 'source']);
    }

    let entry: { amount: number; date: string } | undefined;
    let expectedType: Transaction['type'] | undefined;
    if (source.kind === 'holding-entry') {
      const holding = data.holdings.find((item) => item.id === source.parentId);
      entry = holding?.logs.find((item) => item.id === source.entryId);
      if (entry) expectedType = (entry as InvestmentEntry).kind === 'Withdrawal' ? 'income' : 'invest';
    } else if (source.kind === 'liability-payment') {
      const liability = data.liabilities.find((item) => item.id === source.parentId);
      entry = liability?.payments.find((item) => item.id === source.entryId);
      expectedType = 'expense';
    } else {
      const efGoal = data.goals.find((goal) => goal.auto === 'ef');
      entry = efGoal?.id === source.parentId
        ? data.efEntries.find((item) => item.id === source.entryId)
        : undefined;
      if (entry) expectedType = entry.amount < 0 ? 'income' : 'invest';
    }
    if (!entry) {
      add('orphan-source', 'Transaction source does not point at an existing parent entry.', ['transactions', index, 'source']);
    } else if (
      transaction.amount !== Math.abs(entry.amount) ||
      transaction.date !== entry.date ||
      transaction.type !== expectedType
    ) {
      add('linked-drift', 'Linked transaction fields differ from the source entry.', ['transactions', index]);
    }
  }

  const efGoals = data.goals.filter((goal) => goal.auto === 'ef');
  if (efGoals.length !== 1) {
    add('emergency-goal-count', `Expected exactly one emergency fund goal, found ${efGoals.length}.`, ['goals']);
  }
  for (const holding of data.holdings) {
    for (const [index, entry] of holding.logs.entries()) {
      const count = linked.get(entry.id)?.length ?? 0;
      if (count > 1) {
        add('duplicate-linked-entry', 'Holding entry has more than one linked transaction.', ['holdings', holding.id, 'logs', index]);
      }
    }
  }
  for (const liability of data.liabilities) {
    for (const [index, payment] of liability.payments.entries()) {
      const count = linked.get(payment.id)?.length ?? 0;
      if (count > 1) {
        add('duplicate-linked-entry', 'Liability payment has more than one linked transaction.', ['liabilities', liability.id, 'payments', index]);
      }
    }
  }
  return issues;
}
