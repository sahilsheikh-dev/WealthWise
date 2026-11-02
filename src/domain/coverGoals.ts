import { NotFoundError } from './actions';
import { normalizeMoney } from './cashFlow';
import { policySchedule } from './policySchedule';
import { policySummary } from './policySummary';
import { coverTypeForPremiumCategory } from './policyCategories';
import {
  COVER_POLICY_TYPES,
  type AppData,
  type CoverGoal,
  type CoverGoalTarget,
  type CoverPolicyType,
  type ISODate,
  type Policy,
  type Transaction,
} from './types';

const COVER_GOAL_NAMES: Record<CoverPolicyType, string> = {
  'term-life': 'Term life',
  health: 'Health',
  motor: 'Motor',
  home: 'Home',
  other: 'Other',
};

export type CoverGoalInput = Omit<CoverGoal, 'id'>;

export function defaultCoverGoals(): CoverGoal[] {
  return COVER_POLICY_TYPES.map((kind) => ({
    id: `cover-${kind}`,
    name: COVER_GOAL_NAMES[kind],
    kind,
    target: kind === 'term-life'
      ? { mode: 'income-multiple', value: 10 }
      : kind === 'health'
        ? { mode: 'none' }
        : { mode: 'active-only' },
  }));
}

export class DuplicateCoverGoalNameError extends Error {
  constructor(readonly nameValue: string) {
    super(`A cover goal named "${nameValue}" already exists.`);
    this.name = 'DuplicateCoverGoalNameError';
  }
}

export class DuplicateCoverGoalKindError extends Error {
  constructor(readonly kind: CoverPolicyType) {
    super(`A cover goal already counts policies of type "${kind}".`);
    this.name = 'DuplicateCoverGoalKindError';
  }
}

export class CoverGoalLimitError extends Error {
  constructor() {
    super('You can have at most 20 cover goals.');
    this.name = 'CoverGoalLimitError';
  }
}

export class DuplicateCoverGoalIdError extends Error {
  constructor(readonly id: string) {
    super(`A cover goal with id "${id}" already exists.`);
    this.name = 'DuplicateCoverGoalIdError';
  }
}

export class InvalidCoverGoalTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCoverGoalTargetError';
  }
}

function normalizedGoal(input: CoverGoalInput): CoverGoalInput {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 40) {
    throw new InvalidCoverGoalTargetError('Cover goal name must be between 1 and 40 characters.');
  }
  validateTarget(input.target);
  if (input.kind !== null && !COVER_POLICY_TYPES.includes(input.kind)) {
    throw new InvalidCoverGoalTargetError('Choose a supported policy type or None.');
  }
  return { name, kind: input.kind, target: input.target };
}

function validateTarget(target: CoverGoalTarget): void {
  if (target.mode === 'income-multiple'
    && (!Number.isFinite(target.value) || target.value < 1 || target.value > 50)) {
    throw new InvalidCoverGoalTargetError('Income multiple must be between 1 and 50.');
  }
  if (target.mode === 'amount'
    && (!Number.isFinite(target.value) || target.value < 0 || target.value > 100_000_000_000)) {
    throw new InvalidCoverGoalTargetError('Amount target must be between zero and 100,000,000,000.');
  }
}

function assertUniqueGoal(data: AppData, goal: CoverGoal, excludeId?: string): void {
  if (data.coverGoals.some((item) => item.id !== excludeId
    && item.name.trim().toLowerCase() === goal.name.toLowerCase())) {
    throw new DuplicateCoverGoalNameError(goal.name);
  }
  if (goal.kind !== null && data.coverGoals.some((item) =>
    item.id !== excludeId && item.kind === goal.kind,
  )) {
    throw new DuplicateCoverGoalKindError(goal.kind);
  }
}

export function addCoverGoal(data: AppData, input: CoverGoal): AppData {
  if (data.coverGoals.some((goal) => goal.id === input.id)) {
    throw new DuplicateCoverGoalIdError(input.id);
  }
  if (data.coverGoals.length >= 20) throw new CoverGoalLimitError();
  const goal = { id: input.id, ...normalizedGoal(input) };
  assertUniqueGoal(data, goal);
  return { ...data, coverGoals: [...data.coverGoals, goal] };
}

export function updateCoverGoal(data: AppData, input: CoverGoal): AppData {
  if (!data.coverGoals.some((goal) => goal.id === input.id)) {
    throw new NotFoundError('Cover goal', input.id);
  }
  const goal = { id: input.id, ...normalizedGoal(input) };
  assertUniqueGoal(data, goal, input.id);
  return {
    ...data,
    coverGoals: data.coverGoals.map((item) => item.id === goal.id ? goal : item),
  };
}

export function deleteCoverGoal(data: AppData, id: string): AppData {
  if (!data.coverGoals.some((goal) => goal.id === id)) {
    throw new NotFoundError('Cover goal', id);
  }
  return {
    ...data,
    coverGoals: data.coverGoals.filter((goal) => goal.id !== id),
    policies: data.policies.map((policy) => {
      if (policy.coverGoalId !== id) return policy;
      const { coverGoalId: _coverGoalId, ...unassigned } = policy;
      return unassigned;
    }),
  };
}

export function policiesBecomingUnassigned(data: AppData, id: string): number {
  const goal = data.coverGoals.find((item) => item.id === id);
  if (!goal) return 0;
  return data.policies.filter((policy) =>
    policy.coverGoalId === id
      || (isCoverPolicy(policy) && policy.status === 'active' && policy.coverGoalId === undefined
        && goal.kind !== null && policy.kind === goal.kind),
  ).length;
}

const PAYMENTS_PER_YEAR = {
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  yearly: 1,
} as const;

export type CoverGoalSummary = {
  id: string;
  name: string;
  kind: CoverPolicyType | null;
  target: number | null;
  currentCover: number;
  gap: number | null;
  activePolicyIds: string[];
  yearlyPremium: number;
  nextRenewal: { policyId: string; name: string; date: ISODate; amount: number } | null;
  state: 'covered' | 'gap' | 'no-target' | 'missing';
};

function isCoverPolicy(policy: Policy): boolean {
  return policy.kind !== 'life-savings' && policy.kind !== 'ulip';
}

function goalForPolicy(data: AppData, policy: Policy): CoverGoal | undefined {
  if (policy.coverGoalId !== undefined) {
    return data.coverGoals.find((goal) => goal.id === policy.coverGoalId);
  }
  return data.coverGoals.find((goal) => goal.kind !== null && goal.kind === policy.kind);
}

function nextRenewalFor(policies: Policy[], today: ISODate): CoverGoalSummary['nextRenewal'] {
  return policies.flatMap((policy) => policySchedule(policy, today).rows
    .filter((row) => row.status !== 'paid' && row.dueDate >= today)
    .map((row) => ({
      policyId: policy.id,
      name: policy.name,
      date: row.dueDate,
      amount: normalizeMoney(row.amount),
    })))
    .sort((left, right) => left.date.localeCompare(right.date)
      || left.name.localeCompare(right.name)
      || left.policyId.localeCompare(right.policyId))[0] ?? null;
}

export function coverGoalSummaries(data: AppData, today: ISODate): CoverGoalSummary[] {
  const yearlyIncomeEstimate = policySummary(data, today).yearlyIncomeEstimate;
  return data.coverGoals.map((goal) => {
    const activePolicies = data.policies.filter((policy) =>
      isCoverPolicy(policy) && policy.status === 'active' && goalForPolicy(data, policy)?.id === goal.id,
    );
    const activePolicyIds = activePolicies.map((policy) => policy.id);
    const currentCover = normalizeMoney(activePolicies.reduce(
      (sum, policy) => sum + (policy.sumAssured ?? 0), 0,
    ));
    const target = goal.target.mode === 'amount'
      ? goal.target.value
      : goal.target.mode === 'income-multiple' && yearlyIncomeEstimate !== null
        ? normalizeMoney(yearlyIncomeEstimate * goal.target.value)
        : null;
    const gap = target === null ? null : normalizeMoney(Math.max(0, target - currentCover));
    const state = activePolicies.length === 0
      ? 'missing'
      : goal.target.mode === 'active-only'
        ? 'covered'
        : target === null
          ? 'no-target'
          : currentCover >= target ? 'covered' : 'gap';
    return {
      id: goal.id,
      name: goal.name,
      kind: goal.kind,
      target,
      currentCover,
      gap,
      activePolicyIds,
      yearlyPremium: normalizeMoney(activePolicies.reduce(
        (sum, policy) => sum + policy.premium * PAYMENTS_PER_YEAR[policy.frequency], 0,
      )),
      nextRenewal: nextRenewalFor(activePolicies, today),
      state,
    };
  });
}

export function policiesNotInCoverGoal(data: AppData): Policy[] {
  return data.policies.filter((policy) =>
    policy.status === 'active'
      && (!isCoverPolicy(policy) || goalForPolicy(data, policy) === undefined),
  );
}

export function suggestPolicyForTransaction(
  data: AppData,
  transaction: Transaction,
): Policy | null {
  if (transaction.type !== 'expense' || transaction.source !== undefined) return null;
  const type = coverTypeForPremiumCategory(transaction.category);
  if (!type) return null;
  const matches = data.policies.filter((policy) =>
    policy.kind === type && policy.status === 'active',
  );
  return matches.length === 1 ? matches[0] ?? null : null;
}
