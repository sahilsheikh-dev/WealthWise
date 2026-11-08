import { parseISO } from './dates';
import type { Goal, ISODate } from './types';

export const EF_MIN_MONTHS = 3;

export function emergencyMinimumTarget(expenseBaseline: number): number {
  return expenseBaseline <= 0 ? 0 : Math.ceil(EF_MIN_MONTHS * expenseBaseline);
}

export function effectiveEmergencyTarget(
  goal: Goal,
  expenseBaseline: number,
): { target: number; minimum: number; raised: boolean } {
  const minimum = emergencyMinimumTarget(expenseBaseline);
  return {
    target: Math.max(goal.target, minimum),
    minimum,
    raised: minimum > goal.target,
  };
}

export function goalSaved(goal: Goal, emergencyBalance: number): number {
  return goal.auto === 'ef' ? emergencyBalance : goal.saved;
}

export function defaultEfTarget(expenseBaseline: number): number {
  return expenseBaseline > 0
    ? Math.max(emergencyMinimumTarget(expenseBaseline), Math.round(6 * expenseBaseline / 1000) * 1000)
    : 300_000;
}

export function ensureEfGoal(
  goals: Goal[],
  options: { expenseBaseline: number; asOf: ISODate },
): Goal[] {
  const autoIndex = goals.findIndex((goal) => goal.auto === 'ef');
  let pinned: Goal;
  let remaining: Goal[];
  if (autoIndex >= 0) {
    pinned = { ...goals[autoIndex]! };
    remaining = goals.filter((_, index) => index !== autoIndex).map((goal) => ({ ...goal }));
  } else {
    const namedIndex = goals.findIndex((goal) => goal.name.toLowerCase() === 'emergency fund');
    if (namedIndex >= 0) {
      pinned = { ...goals[namedIndex]!, auto: 'ef' };
      remaining = goals.filter((_, index) => index !== namedIndex).map((goal) => ({ ...goal }));
    } else {
      pinned = {
        id: 'goal-emergency',
        name: 'Emergency fund',
        target: defaultEfTarget(options.expenseBaseline),
        saved: 0,
        year: parseISO(options.asOf).y + 2,
        auto: 'ef',
      };
      remaining = goals.map((goal) => ({ ...goal }));
    }
  }
  return [pinned, ...remaining];
}

export function goalProgressPct(goal: Goal, saved: number): number {
  return goal.target <= 0
    ? 0
    : Math.min(100, Math.max(0, saved / goal.target * 100));
}

export function goalView(
  goal: Goal,
  ctx: { emergencyBalance: number; expenseBaseline: number },
): { target: number; saved: number; pct: number; minimum?: number; raised?: boolean } {
  const saved = goalSaved(goal, ctx.emergencyBalance);
  if (goal.auto !== 'ef') return { target: goal.target, saved, pct: goalProgressPct(goal, saved) };
  const effective = effectiveEmergencyTarget(goal, ctx.expenseBaseline);
  return {
    ...effective,
    saved,
    pct: effective.target <= 0
      ? 0
      : Math.min(100, Math.max(0, saved / effective.target * 100)),
  };
}

export function goalTotals(goals: Goal[], emergencyBalance: number, expenseBaseline: number): {
  target: number;
  saved: number;
  pct: number;
} {
  const target = goals.reduce((total, goal) =>
    total + goalView(goal, { emergencyBalance, expenseBaseline }).target, 0);
  const saved = goals.reduce((total, goal) => total + goalView(goal, { emergencyBalance, expenseBaseline }).saved, 0);
  return { target, saved, pct: target <= 0 ? 0 : Math.min(100, Math.max(0, saved / target * 100)) };
}
