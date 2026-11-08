import { NotFoundError } from './actions';
import type { AppData, Goal } from './types';

export class GoalLockedError extends Error {
  constructor() {
    super('The Emergency fund goal can only have its target and year changed.');
    this.name = 'GoalLockedError';
  }
}

export type AddGoalInput = Omit<Goal, 'id' | 'auto'>;
export type GoalPatch = Partial<Pick<Goal, 'name' | 'target' | 'saved' | 'year' | 'auto'>>;

export function addGoal(data: AppData, input: AddGoalInput, newId: () => string): AppData {
  const goal: Goal = { ...input, id: newId() };
  return { ...data, goals: [...data.goals, goal] };
}

export function updateGoal(data: AppData, id: string, patch: GoalPatch): AppData {
  const current = data.goals.find((goal) => goal.id === id);
  if (!current) throw new NotFoundError('Goal', id);
  if (current.auto === 'ef' && ('name' in patch || 'saved' in patch || 'auto' in patch)) {
    throw new GoalLockedError();
  }
  if (current.auto !== 'ef' && patch.auto !== undefined) throw new GoalLockedError();
  return { ...data, goals: data.goals.map((goal) => goal.id === id ? { ...goal, ...patch } : goal) };
}

export function deleteGoal(data: AppData, id: string): AppData {
  const goal = data.goals.find((item) => item.id === id);
  if (!goal) throw new NotFoundError('Goal', id);
  if (goal.auto === 'ef') throw new GoalLockedError();
  return { ...data, goals: data.goals.filter((item) => item.id !== id) };
}
