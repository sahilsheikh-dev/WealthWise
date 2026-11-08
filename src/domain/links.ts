import { EF_BUCKETS, EF_BUCKET_META } from './efAllocation';
import { GENERIC_INSURANCE_CATEGORY, policyPremiumCategory, policyPremiumCategoryFor } from './policyCategories';
import type { AppData, CoverGoal, HoldingType, InvestmentEntry, Transaction } from './types';

export type TransactionSource = NonNullable<Transaction['source']>;

export class LinkedTransactionError extends Error {
  constructor(message = 'This transaction is linked to a holding, liability, or policy entry and must be changed there.') {
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
      ? { label: holding.name, route: '/investment-entries', params: { id: holding.id } }
      : null;
  }
  if (source.kind === 'liability-payment') {
    const liability = data.liabilities.find((entry) => entry.id === source.parentId);
    return liability?.payments.some((entry) => entry.id === source.entryId)
      ? { label: liability.name, route: '/liability-payments', params: { id: liability.id } }
      : null;
  }
  if (source.kind === 'policy-payment') {
    const policy = data.policies.find((entry) => entry.id === source.parentId);
    return policy?.payments.some((entry) => entry.id === source.entryId)
      ? { label: policy.name, route: '/policy-payments', params: { id: policy.id } }
      : null;
  }
  if (source.kind === 'liability-origin') {
    const liability = data.liabilities.find((entry) => entry.id === source.parentId && entry.id === source.entryId);
    return liability ? { label: liability.name, route: '/liability-payments', params: { id: liability.id } } : null;
  }
  return null;
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
): 'Mutual fund / SIP' | 'Stocks / ETF' | 'Fixed deposit / RD' | 'Gold / Silver' | 'Other investments' {
  switch (type) {
    case 'Mutual fund / SIP':
      return 'Mutual fund / SIP';
    case 'Stocks / ETF':
      return 'Stocks / ETF';
    case 'Fixed deposit':
    case 'Recurring deposit':
      return 'Fixed deposit / RD';
    case 'Gold':
    case 'Silver':
      return 'Gold / Silver';
    default:
      return 'Other investments';
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
    { name: 'policies', ids: data.policies.map(({ id }) => id) },
    { name: 'coverGoals', ids: data.coverGoals.map(({ id }) => id) },
    { name: 'efCustomBuckets', ids: data.efCustomBuckets.map(({ id }) => id) },
    { name: 'holdingEntries', ids: allHoldingEntries.map(({ id }) => id) },
    { name: 'liabilityPayments', ids: data.liabilities.flatMap((item) => item.payments.map(({ id }) => id)) },
    { name: 'policyPayments', ids: data.policies.flatMap((item) => item.payments.map(({ id }) => id)) },
  ];
  for (const collection of collections) {
    const seen = new Set<string>();
    collection.ids.forEach((id, index) => {
      if (seen.has(id)) add('duplicate-id', `Duplicate id "${id}" in ${collection.name}.`, [collection.name, index, 'id']);
      seen.add(id);
    });
  }

  const coverGoalNames = new Set<string>();
  const coverGoalKinds = new Set<string>();
  if (data.coverGoals.length > 20) {
    add('cover-goal-limit', 'There can be at most 20 cover goals.', ['coverGoals']);
  }
  data.coverGoals.forEach((goal: CoverGoal, index) => {
    const normalizedName = goal.name.trim().toLowerCase();
    if (coverGoalNames.has(normalizedName)) {
      add('duplicate-cover-goal-name', `Duplicate cover goal name "${goal.name}".`, ['coverGoals', index, 'name']);
    }
    coverGoalNames.add(normalizedName);
    if (goal.kind !== null && coverGoalKinds.has(goal.kind)) {
      add('duplicate-cover-goal-kind', `Duplicate cover goal kind "${goal.kind}".`, ['coverGoals', index, 'kind']);
    }
    if (goal.kind !== null) coverGoalKinds.add(goal.kind);
    if (goal.name.trim().length === 0 || goal.name.length > 40) {
      add('invalid-cover-goal-name', 'Cover goal names must contain 1 to 40 characters.', ['coverGoals', index, 'name']);
    }
    if ((goal.target.mode === 'income-multiple'
      && (!Number.isFinite(goal.target.value) || goal.target.value < 1 || goal.target.value > 50))
      || (goal.target.mode === 'amount'
        && (!Number.isFinite(goal.target.value) || goal.target.value < 0))) {
      add('invalid-cover-goal-target', 'Cover goal target is outside its supported range.', ['coverGoals', index, 'target']);
    }
  });
  const coverGoalIds = new Set(data.coverGoals.map((goal) => goal.id));
  data.policies.forEach((policy, index) => {
    if (policy.coverGoalId !== undefined && !coverGoalIds.has(policy.coverGoalId)) {
      add('missing-policy-cover-goal', `Policy "${policy.id}" references a missing cover goal.`, [
        'policies', index, 'coverGoalId',
      ]);
    }
  });

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
    let expectedCategory: string | undefined;
    let historicalPolicyCategory: string | undefined;
    let validLiabilityOrigin = true;
    if (source.kind === 'holding-entry') {
      const holding = data.holdings.find((item) => item.id === source.parentId);
      const holdingEntry = holding?.logs.find((item) => item.id === source.entryId);
      entry = holdingEntry;
      if (holdingEntry) {
        expectedType = holdingEntry.kind === 'Withdrawal' ? 'income' : 'invest';
        expectedCategory = holdingEntry.kind === 'Withdrawal' ? 'Withdrawal' : holding ? investCategoryFor(holding.type) : undefined;
      }
    } else if (source.kind === 'liability-payment') {
      const liability = data.liabilities.find((item) => item.id === source.parentId);
      entry = liability?.payments.find((item) => item.id === source.entryId);
      expectedType = 'expense';
    } else if (source.kind === 'policy-payment') {
      const policy = data.policies.find((item) => item.id === source.parentId);
      entry = policy?.payments.find((item) => item.id === source.entryId);
      expectedType = 'expense';
      expectedCategory = policy ? policyPremiumCategoryFor(policy, data.coverGoals) : undefined;
      historicalPolicyCategory = policy ? policyPremiumCategory(policy.kind) : undefined;
    } else if (source.kind === 'liability-origin') {
      const liability = data.liabilities.find((item) =>
        item.id === source.parentId && item.id === source.entryId);
      entry = liability ? { amount: transaction.amount, date: transaction.date } : undefined;
      expectedType = 'income';
      validLiabilityOrigin = liability !== undefined &&
        transaction.amount <= liability.principal &&
        (transaction.category === 'Borrowed'
          ? transaction.amount === liability.principal && transaction.date === liability.startDate
          : transaction.category === 'Loan proceeds' && transaction.date >= liability.startDate);
    }
    if (!entry) {
      add('orphan-source', 'Transaction source does not point at an existing parent entry.', ['transactions', index, 'source']);
    } else if (
      transaction.amount !== Math.abs(entry.amount) ||
      transaction.date !== entry.date ||
      transaction.type !== expectedType ||
      (expectedCategory !== undefined
        && transaction.category !== expectedCategory
        && !(source.kind === 'policy-payment'
          && (transaction.category === historicalPolicyCategory
            || transaction.category === GENERIC_INSURANCE_CATEGORY))
        && !(source.kind === 'policy-payment' && transaction.category === 'Insurance')) ||
      !validLiabilityOrigin
    ) {
      add('linked-drift', 'Linked transaction fields differ from the source entry.', ['transactions', index]);
    }
  }

  const efGoals = data.goals.filter((goal) => goal.auto === 'ef');
  if (efGoals.length !== 1) {
    add('emergency-goal-count', `Expected exactly one emergency fund goal, found ${efGoals.length}.`, ['goals']);
  }
  if (data.efCustomBuckets.length > 8) {
    add('too-many-ef-custom-buckets', 'Emergency fund supports up to 8 custom options.', ['efCustomBuckets']);
  }
  const efBucketIds = new Set<string>([...EF_BUCKETS, ...data.efCustomBuckets.map(({ id }) => id)]);
  const efBucketNames = new Set(EF_BUCKETS.map((id) => EF_BUCKET_META[id].label.trim().toLowerCase()));
  for (const [index, bucket] of data.efCustomBuckets.entries()) {
    const name = bucket.name.trim();
    const normalizedName = name.toLowerCase();
    if (name.length < 1 || name.length > 24 || name !== bucket.name) {
      add('invalid-ef-bucket-name', 'Custom emergency fund option names must be 1 to 24 characters.', ['efCustomBuckets', index, 'name']);
    }
    if (efBucketNames.has(normalizedName)) {
      add('duplicate-ef-bucket-name', 'Custom emergency fund option names must be unique and differ from fixed options.', ['efCustomBuckets', index, 'name']);
    }
    if (EF_BUCKETS.some((fixedId) => fixedId === bucket.id)) {
      add('duplicate-ef-bucket-id', 'Custom emergency fund option IDs must differ from fixed options.', ['efCustomBuckets', index, 'id']);
    }
    efBucketNames.add(normalizedName);
  }
  if (data.efAllocation) {
    for (const bucketId of Object.keys(data.efAllocation)) {
      if (!efBucketIds.has(bucketId)) {
        add('missing-ef-allocation-bucket', 'Emergency fund allocation references an unknown option.', ['efAllocation', bucketId]);
      }
    }
  }
  for (const [bucketId, holdingIds] of Object.entries(data.efBucketLinks)) {
    if (!efBucketIds.has(bucketId)) {
      add('missing-ef-bucket-link-target', 'Emergency fund investment links reference an unknown option.', ['efBucketLinks', bucketId]);
    }
    if (holdingIds.length > 10) {
      add('too-many-ef-bucket-links', 'Link up to 10 investments per emergency fund option.', ['efBucketLinks', bucketId]);
    }
    const seenHoldingIds = new Set<string>();
    holdingIds.forEach((holdingId, index) => {
      if (!data.holdings.some((holding) => holding.id === holdingId)) {
        add('missing-ef-linked-holding', 'Emergency fund link does not point at an existing holding.', ['efBucketLinks', bucketId, index]);
      }
      if (seenHoldingIds.has(holdingId)) {
        add('duplicate-ef-linked-holding', 'An investment can only be linked once to an option.', ['efBucketLinks', bucketId, index]);
      }
      if (Object.entries(data.efBucketLinks).some(([otherBucketId, otherIds]) =>
        otherBucketId !== bucketId && otherIds.includes(holdingId))) {
        add('multiple-ef-buckets', 'An asset can belong to at most one emergency-fund option.', ['efBucketLinks', bucketId, index]);
      }
      seenHoldingIds.add(holdingId);
      const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
      if (!emergencyGoal?.links.some((link) => link.instrumentId === holdingId)) {
        add('ef-bucket-missing-goal-link', 'Every emergency-fund option asset must also be linked to the emergency goal.', ['efBucketLinks', bucketId, index]);
      }
    });
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
    if (liability.kind === 'recurring' && liability.settlement !== null && liability.settlement.asOf < liability.startDate) {
      add('settlement-before-start', 'Settlement cannot predate the liability start date.', ['liabilities', liability.id, 'settlement', 'asOf']);
    }
    for (const [index, payment] of liability.payments.entries()) {
      const count = linked.get(payment.id)?.length ?? 0;
      if (count > 1) {
        add('duplicate-linked-entry', 'Liability payment has more than one linked transaction.', ['liabilities', liability.id, 'payments', index]);
      }
    }
  }
  const savingsPolicies = new Set(data.policies
    .filter((policy) => policy.kind === 'life-savings' || policy.kind === 'ulip')
    .map((policy) => policy.id));
  for (const [goalIndex, goal] of data.goals.entries()) {
    const seen = new Set<string>();
    for (const [linkIndex, link] of goal.links.entries()) {
      const exists = data.holdings.some((holding) => holding.id === link.instrumentId)
        || savingsPolicies.has(link.instrumentId);
      if (!exists) add('missing-goal-link-target', 'Goal link does not point at an eligible asset.', ['goals', goalIndex, 'links', linkIndex, 'instrumentId']);
      if (seen.has(link.instrumentId)) {
        add('duplicate-goal-link', 'A goal cannot link the same asset more than once.', ['goals', goalIndex, 'links', linkIndex, 'instrumentId']);
      }
      seen.add(link.instrumentId);
    }
  }
  if (data.budget) {
    const seen = new Set<string>();
    for (const [index, line] of data.budget.lines.entries()) {
      if (seen.has(line.category)) add('duplicate-budget-category', 'Budget categories must be unique.', ['budget', 'lines', index, 'category']);
      seen.add(line.category);
    }
  }
  if (data.budgetPlan) {
    const sectionIds = new Set(data.budgetPlan.sections.map((section) => section.id));
    for (const [itemIndex, item] of data.budgetPlan.items.entries()) {
      if (!sectionIds.has(item.sectionId)) add('missing-budget-section', 'Budget item section does not exist.', ['budgetPlan', 'items', itemIndex, 'sectionId']);
    }
  }
  for (const [monthIndex, budget] of (data.monthBudgets ?? []).entries()) {
    const sectionIds = new Set(budget.sections.map((section) => section.id));
    for (const [itemIndex, item] of budget.items.entries()) {
      if (!sectionIds.has(item.sectionId)) add('missing-budget-section', 'Budget item section does not exist.', ['monthBudgets', monthIndex, 'items', itemIndex, 'sectionId']);
    }
  }
  for (const policy of data.policies) {
    for (const [index, payment] of policy.payments.entries()) {
      const count = linked.get(payment.id)?.length ?? 0;
      if (count > 1) add('duplicate-linked-entry', 'Policy payment has more than one linked transaction.', ['policies', policy.id, 'payments', index]);
    }

  }
  return issues;
}
