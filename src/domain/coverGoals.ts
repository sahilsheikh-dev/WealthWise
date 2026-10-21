import { COVER_POLICY_TYPES, type CoverGoal } from './types';

export function defaultCoverGoals(): CoverGoal[] {
  return COVER_POLICY_TYPES.map((type) => {
    if (type === 'term-life') return { type, targetMode: 'income-multiple', targetValue: 10 };
    if (type === 'health') return { type, targetMode: 'amount' };
    return { type, targetMode: 'active-only' };
  });
}
