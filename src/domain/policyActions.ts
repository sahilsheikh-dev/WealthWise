import { NotFoundError } from './actions';
import type { AppData, Policy, PolicyStatus } from './types';

export type PolicyPatch = Partial<Omit<Policy, 'id' | 'payments'>>;

export class DuplicatePolicyError extends Error {
  constructor(id: string) {
    super(`A policy with id "${id}" already exists.`);
    this.name = 'DuplicatePolicyError';
  }
}

export class PolicyGoalLinkError extends Error {
  constructor(readonly goalNames: string[]) {
    super(`This policy is linked to ${goalNames.join(', ')}. Remove those goal links before changing its kind.`);
    this.name = 'PolicyGoalLinkError';
  }
}

export class PolicyCoverGoalNotFoundError extends Error {
  constructor(readonly coverGoalId: string) {
    super(`Cover goal with id "${coverGoalId}" was not found.`);
    this.name = 'PolicyCoverGoalNotFoundError';
  }
}

function assertCoverGoalExists(data: AppData, coverGoalId: string | undefined): void {
  if (coverGoalId !== undefined && !data.coverGoals.some((goal) => goal.id === coverGoalId)) {
    throw new PolicyCoverGoalNotFoundError(coverGoalId);
  }
}

export function addPolicy(data: AppData, input: Policy): AppData {
  if (data.policies.some((policy) => policy.id === input.id)) {
    throw new DuplicatePolicyError(input.id);
  }
  assertCoverGoalExists(data, input.coverGoalId);
  return { ...data, policies: [...data.policies, { ...input, payments: [...input.payments] }] };
}

export function updatePolicy(
  data: AppData,
  input: { id: string; patch: PolicyPatch },
): AppData {
  const current = data.policies.find((policy) => policy.id === input.id);
  if (!current) throw new NotFoundError('Policy', input.id);
  assertCoverGoalExists(data, input.patch.coverGoalId);
  const updated = { ...current, ...input.patch };
  if (input.patch.kind !== undefined && input.patch.kind !== current.kind
    && input.patch.kind !== 'life-savings' && input.patch.kind !== 'ulip') {
    const linkedGoals = data.goals.filter((goal) =>
      goal.links.some((link) => link.instrumentId === current.id),
    );
    if (linkedGoals.length > 0) throw new PolicyGoalLinkError(linkedGoals.map((goal) => goal.name));
  }
  const transactions = input.patch.name === undefined || input.patch.name === current.name
    ? data.transactions
    : data.transactions.map((transaction) =>
      transaction.source?.kind === 'policy-payment' && transaction.source.parentId === current.id
        ? { ...transaction, note: `${updated.name} premium` }
        : transaction,
    );
  return {
    ...data,
    transactions,
    policies: data.policies.map((policy) => policy.id === input.id ? updated : policy),
  };
}

export function setPolicyStatus(
  data: AppData,
  input: { id: string; status: PolicyStatus },
): AppData {
  const policy = data.policies.find((item) => item.id === input.id);
  if (!policy) throw new NotFoundError('Policy', input.id);
  if (policy.status === input.status) return data;
  return {
    ...data,
    policies: data.policies.map((item) =>
      item.id === input.id ? { ...item, status: input.status } : item,
    ),
  };
}

export function deletePolicy(data: AppData, input: { id: string }): AppData {
  const policy = data.policies.find((item) => item.id === input.id);
  if (!policy) throw new NotFoundError('Policy', input.id);
  const transactions = data.transactions.map((transaction) => {
    if (transaction.source?.kind !== 'policy-payment'
      || transaction.source.parentId !== policy.id) return transaction;
    const { source: _source, ...plainTransaction } = transaction;
    return plainTransaction;
  });
  const goals = data.goals.map((goal) => ({
    ...goal,
    links: goal.links.filter((link) => link.instrumentId !== policy.id),
  }));
  const efBucketLinks = Object.fromEntries(
    Object.entries(data.efBucketLinks).map(([bucketId, ids]) => [
      bucketId,
      ids.filter((id) => id !== policy.id),
    ]),
  );
  return {
    ...data,
    policies: data.policies.filter((item) => item.id !== policy.id),
    transactions,
    goals,
    efBucketLinks,
  };
}
