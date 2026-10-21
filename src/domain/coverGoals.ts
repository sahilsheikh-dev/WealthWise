import { normalizeMoney } from './cashFlow';
import { policySchedule } from './policySchedule';
import { policySummary } from './policySummary';
import { coverTypeForPremiumCategory } from './policyCategories';
import {
  COVER_POLICY_TYPES,
  type AppData,
  type CoverGoal,
  type CoverGoalTargetMode,
  type CoverPolicyType,
  type ISODate,
  type Policy,
  type Transaction,
} from './types';

export function defaultCoverGoals(): CoverGoal[] {
  return COVER_POLICY_TYPES.map((type) => {
    if (type === 'term-life') return { type, targetMode: 'income-multiple', targetValue: 10 };
    if (type === 'health') return { type, targetMode: 'amount' };
    return { type, targetMode: 'active-only' };
  });
}

export class CoverGoalNotFoundError extends Error {
  constructor(readonly type: CoverPolicyType) {
    super(`Cover goal for "${type}" was not found.`);
    this.name = 'CoverGoalNotFoundError';
  }
}

export class InvalidCoverGoalTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCoverGoalTargetError';
  }
}

export function setCoverGoalTarget(
  data: AppData,
  input: { type: CoverPolicyType; targetMode: CoverGoalTargetMode; targetValue?: number },
): AppData {
  if (input.targetMode === 'income-multiple'
    && (input.targetValue === undefined || !Number.isFinite(input.targetValue)
      || input.targetValue < 1 || input.targetValue > 50)) {
    throw new InvalidCoverGoalTargetError('Income multiple must be between 1 and 50.');
  }
  if (input.targetMode === 'amount'
    && input.targetValue !== undefined
    && (!Number.isFinite(input.targetValue) || input.targetValue < 0)) {
    throw new InvalidCoverGoalTargetError('Amount target must be zero or greater.');
  }
  if (input.targetMode === 'active-only' && input.targetValue !== undefined) {
    throw new InvalidCoverGoalTargetError('Active-only cover goals do not have a target value.');
  }
  if (!data.coverGoals.some((goal) => goal.type === input.type)) {
    throw new CoverGoalNotFoundError(input.type);
  }
  return {
    ...data,
    coverGoals: data.coverGoals.map((goal) => goal.type === input.type
      ? {
        type: input.type,
        targetMode: input.targetMode,
        ...(input.targetValue === undefined ? {} : { targetValue: input.targetValue }),
      }
      : goal),
  };
}

const PAYMENTS_PER_YEAR = {
  monthly: 12,
  quarterly: 4,
  'half-yearly': 2,
  yearly: 1,
} as const;

export type CoverGoalSummary = {
  type: CoverPolicyType;
  target: number | null;
  currentCover: number;
  gap: number | null;
  activePolicyIds: string[];
  yearlyPremium: number;
  nextRenewal: { policyId: string; name: string; date: ISODate; amount: number } | null;
  state: 'covered' | 'gap' | 'no-target' | 'missing';
};

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
      policy.kind === goal.type && policy.status === 'active',
    );
    const activePolicyIds = activePolicies.map((policy) => policy.id);
    const currentCover = normalizeMoney(activePolicies.reduce(
      (sum, policy) => sum + (policy.sumAssured ?? 0), 0,
    ));
    const target = goal.targetMode === 'amount'
      ? goal.targetValue ?? null
      : goal.targetMode === 'income-multiple' && yearlyIncomeEstimate !== null
        ? normalizeMoney(yearlyIncomeEstimate * (goal.targetValue ?? 0))
        : null;
    const gap = target === null ? null : normalizeMoney(Math.max(0, target - currentCover));
    const state = activePolicies.length === 0
      ? 'missing'
      : goal.targetMode === 'active-only'
        ? 'covered'
        : target === null
          ? 'no-target'
          : currentCover >= target ? 'covered' : 'gap';
    return {
      type: goal.type,
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

export function suggestPolicyForTransaction(
  data: AppData,
  transaction: Transaction,
): Policy | null {
  if (transaction.type !== 'expense') return null;
  const type = coverTypeForPremiumCategory(transaction.category);
  if (!type) return null;
  const matches = data.policies.filter((policy) =>
    policy.kind === type && policy.status === 'active',
  );
  return matches.length === 1 ? matches[0] ?? null : null;
}
