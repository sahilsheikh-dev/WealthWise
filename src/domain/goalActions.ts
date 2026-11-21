import { NotFoundError } from './actions';
import { emergencyMinimumTarget } from './goals';
import { validateGoalLinks } from './goalLinks';
import { formatINR } from '../lib/format';
import type { AppData, Goal } from './types';

export class GoalLockedError extends Error {
  constructor() {
    super('The Emergency fund Goal can only have its target and year changed.');
    this.name = 'GoalLockedError';
  }
}

export class GoalTargetBelowMinimumError extends Error {
  constructor(minimum: number) {
    super(`The emergency fund target must be at least 3 months of cover (${formatINR(minimum)})`);
    this.name = 'GoalTargetBelowMinimumError';
  }
}

export class InvalidEmergencyFundTargetError extends Error {
  constructor() {
    super('Enter a positive Emergency Fund target with at most two decimal places, up to ₹10,000,000,000.');
    this.name = 'InvalidEmergencyFundTargetError';
  }
}

export type AddGoalInput = Omit<Goal, 'id' | 'auto' | 'links'> & { links?: Goal['links'] };
export type GoalPatch = Partial<Pick<Goal, 'name' | 'target' | 'saved' | 'year' | 'auto' | 'links'>>;

export function addGoal(data: AppData, input: AddGoalInput, newId: () => string): AppData {
  const goal: Goal = { ...input, links: input.links ?? [], id: newId() };
  const result = { ...data, goals: [...data.goals, goal] };
  validateGoalLinks(result, goal.id, goal.links);
  return result;
}

export function updateGoal(
  data: AppData,
  id: string,
  patch: GoalPatch,
  options: { expenseBaseline: number },
): AppData {
  const current = data.goals.find((goal) => goal.id === id);
  if (!current) throw new NotFoundError('Goal', id);
  if (current.auto === 'ef' && ('name' in patch || 'saved' in patch || 'auto' in patch)) {
    throw new GoalLockedError();
  }
  if (current.auto !== 'ef' && patch.auto !== undefined) throw new GoalLockedError();
  const minimum = emergencyMinimumTarget(options.expenseBaseline);
  if (current.auto === 'ef' && patch.target !== undefined && minimum > 0 && patch.target < minimum) {
    throw new GoalTargetBelowMinimumError(minimum);
  }
  const result = { ...data, goals: data.goals.map((goal) => goal.id === id ? { ...goal, ...patch } : goal) };
  if (patch.links !== undefined) validateGoalLinks(result, id, patch.links);
  return result;
}

export function updateEmergencyFundTarget(
  data: AppData,
  target: number,
  options: { expenseBaseline: number },
): AppData {
  const targetInPaise = target * 100;
  if (
    !Number.isFinite(target)
    || target <= 0
    || target > 10_000_000_000
    || Math.abs(targetInPaise - Math.round(targetInPaise)) > 0.00001
  ) {
    throw new InvalidEmergencyFundTargetError();
  }
  const goal = data.goals.find((item) => item.auto === 'ef');
  if (!goal) throw new NotFoundError('Emergency fund goal', 'ef');
  return updateGoal(data, goal.id, { target }, options);
}

export function deleteGoal(data: AppData, id: string): AppData {
  const goal = data.goals.find((item) => item.id === id);
  if (!goal) throw new NotFoundError('Goal', id);
  if (goal.auto === 'ef') throw new GoalLockedError();
  return { ...data, goals: data.goals.filter((item) => item.id !== id) };
}
