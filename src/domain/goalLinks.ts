import { addDays, addMonths, parseISO } from './dates';
import { holdingContributions, holdingValue } from './portfolio';
import { planValue, PERIODS_PER_YEAR } from './sip';
import type { AppData, Goal, GoalLink, ISODate, PlanHolding, Policy } from './types';

export type LinkableInstrument = {
  id: string;
  name: string;
  kind: 'manual' | 'plan' | 'policy';
  value: number;
  invested: number;
};

export class InvalidGoalLinksError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGoalLinksError';
  }
}

function isSavingsPolicy(policy: Policy): boolean {
  return policy.kind === 'life-savings' || policy.kind === 'ulip';
}

function policyInvested(policy: Policy): number {
  return policy.payments.reduce((total, payment) => total + payment.amount, 0);
}

function policyValue(policy: Policy): number {
  return isSavingsPolicy(policy) ? policy.currentValue ?? 0 : 0;
}

function linkedValue(data: AppData, instrumentId: string, asOf: ISODate): number | undefined {
  const holding = data.holdings.find((item) => item.id === instrumentId);
  if (holding) return holdingValue(holding, asOf);
  const policy = data.policies.find((item) => item.id === instrumentId && isSavingsPolicy(item));
  return policy ? policyValue(policy) : undefined;
}

function linkedInvested(data: AppData, instrumentId: string): number | undefined {
  const holding = data.holdings.find((item) => item.id === instrumentId);
  if (holding) return holdingContributions(holding);
  const policy = data.policies.find((item) => item.id === instrumentId && isSavingsPolicy(item));
  return policy ? policyInvested(policy) : undefined;
}

function hasLinkableInstrument(data: AppData, instrumentId: string): boolean {
  return data.holdings.some((holding) => holding.id === instrumentId)
    || data.policies.some((policy) => policy.id === instrumentId && isSavingsPolicy(policy));
}

export function linkableInstruments(data: AppData, asOf: ISODate): LinkableInstrument[] {
  const holdings = data.holdings.map((holding): LinkableInstrument => ({
    id: holding.id,
    name: holding.name,
    kind: holding.kind,
    value: holdingValue(holding, asOf),
    invested: holdingContributions(holding),
  }));
  const policies = data.policies.filter(isSavingsPolicy).map((policy): LinkableInstrument => ({
    id: policy.id,
    name: policy.name,
    kind: 'policy',
    value: policyValue(policy),
    invested: policyInvested(policy),
  }));
  return [...holdings, ...policies];
}

export function goalAssetValueFor(
  goal: Pick<Goal, 'id'>,
  data: AppData,
  instrumentId: string,
  value: number,
): number {
  void data;
  void goal;
  void instrumentId;
  return value;
}

export function goalSharedAssetCount(
  data: AppData,
  goalId: string,
  instrumentId: string,
): number {
  return new Set(data.goals
    .filter((goal) => goal.id !== goalId && goal.links.some((link) => link.instrumentId === instrumentId))
    .map((goal) => goal.id)).size;
}

export function goalSavedFor(
  goal: Goal,
  data: AppData,
  asOf: ISODate,
): number {
  if (goal.links.length === 0) return goal.auto === 'ef' ? 0 : goal.saved;
  return goal.links.reduce((total, link) =>
    total + goalAssetValueFor(goal, data, link.instrumentId, linkedValue(data, link.instrumentId, asOf) ?? 0), 0);
}

export function validateGoalLinks(data: AppData, goalId: string, links: GoalLink[]): void {
  const goal = data.goals.find((item) => item.id === goalId);
  if (!goal) throw new InvalidGoalLinksError('The selected goal could not be found.');
  const seen = new Set<string>();
  for (const link of links) {
    if (seen.has(link.instrumentId)) {
      throw new InvalidGoalLinksError('A goal cannot link the same asset more than once.');
    }
    seen.add(link.instrumentId);
    if (!hasLinkableInstrument(data, link.instrumentId)) {
      throw new InvalidGoalLinksError('Choose an existing holding or savings policy.');
    }
  }
}

export function setGoalLinks(data: AppData, goalId: string, links: GoalLink[]): AppData {
  validateGoalLinks(data, goalId, links);
  const goal = data.goals.find((item) => item.id === goalId);
  const linkedIds = new Set(links.map((link) => link.instrumentId));
  const efBucketLinks = goal?.auto === 'ef'
    ? Object.fromEntries(Object.entries(data.efBucketLinks).map(([bucketId, holdingIds]) => [
      bucketId,
      holdingIds.filter((holdingId) => linkedIds.has(holdingId)),
    ]))
    : data.efBucketLinks;
  return {
    ...data,
    efBucketLinks,
    goals: data.goals.map((goal) => goal.id === goalId
      ? { ...goal, links: links.map(({ instrumentId }) => ({ instrumentId })) }
      : goal),
  };
}

export function linkEmergencyGoalAssets(data: AppData, instrumentIds: readonly string[]): AppData {
  const emergencyGoal = data.goals.find((goal) => goal.auto === 'ef');
  if (!emergencyGoal) throw new InvalidGoalLinksError('The emergency fund goal could not be found.');
  const links = [...emergencyGoal.links];
  for (const instrumentId of instrumentIds) {
    if (links.some((link) => link.instrumentId === instrumentId)) continue;
    links.push({ instrumentId });
  }
  return setGoalLinks(data, emergencyGoal.id, links);
}

export type GoalProjection = {
  current: number;
  invested: number;
  remaining: number;
  percent: number;
  projectedDate: ISODate | 'Already reached' | null;
  deadline: ISODate;
  deltaMonths: number | null;
  status: 'ahead' | 'on-track' | 'behind' | 'none';
};

function monthEndAfter(date: ISODate, months: number): ISODate {
  const firstOfMonth = `${date.slice(0, 7)}-01`;
  return addDays(addMonths(firstOfMonth, months + 1), -1);
}

function monthIndex(date: ISODate): number {
  const parsed = parseISO(date);
  return parsed.y * 12 + parsed.m - 1;
}

export function goalProjection(goal: Goal, data: AppData, asOf: ISODate): GoalProjection {
  const current = goalSavedFor(goal, data, asOf);
  const invested = goal.links.reduce((total, link) =>
    total + goalAssetValueFor(goal, data, link.instrumentId, linkedInvested(data, link.instrumentId) ?? 0), 0);
  const remaining = Math.max(0, goal.target - current);
  const percent = goal.target <= 0 ? 0 : Math.min(100, Math.max(0, current / goal.target * 100));
  const deadline = `${goal.year}-12-31`;
  if (current >= goal.target) {
    return { current, invested, remaining, percent, projectedDate: 'Already reached', deadline, deltaMonths: null, status: 'ahead' };
  }

  const linkedPlans = goal.links.flatMap((link) => {
    const plan = data.holdings.find((holding): holding is PlanHolding =>
      holding.id === link.instrumentId && holding.kind === 'plan');
    return plan ? [{ plan }] : [];
  });
  if (linkedPlans.length === 0) {
    return { current, invested, remaining, percent, projectedDate: null, deadline, deltaMonths: null, status: 'none' };
  }

  const fixedValue = goal.links.reduce((total, link) => {
    const planExists = linkedPlans.some(({ plan }) => plan.id === link.instrumentId);
    return total + (planExists ? 0 : goalAssetValueFor(
      goal, data, link.instrumentId, linkedValue(data, link.instrumentId, asOf) ?? 0,
    ));
  }, 0);
  const states = linkedPlans.map(({ plan }) => ({
    plan,
    value: planValue(plan, asOf),
  }));
  const hasContribution = states.some(({ plan }) => plan.amount * PERIODS_PER_YEAR[plan.frequency] > 0);
  if (!hasContribution && states.every(({ plan }) => plan.ratePct <= 0)) {
    return { current, invested, remaining, percent, projectedDate: null, deadline, deltaMonths: null, status: 'none' };
  }

  let simulated = fixedValue + states.reduce((total, state) =>
    total + state.value, 0);
  let projectedDate: ISODate | null = null;
  for (let month = 1; month <= 600; month += 1) {
    const simulationDate = monthEndAfter(asOf, month);
    for (const state of states) {
      const monthlyRate = (1 + state.plan.ratePct / 100) ** (1 / 12) - 1;
      const elapsedMonths = Math.max(0, monthIndex(simulationDate) - monthIndex(state.plan.startDate));
      const active = simulationDate >= state.plan.startDate
        && elapsedMonths < state.plan.tenureYears * 12
        && (!state.plan.stopDate || simulationDate <= state.plan.stopDate);
      const annualStep = Math.floor(Math.max(0, elapsedMonths - 1) / 12);
      const annualAmount = state.plan.amount * (1 + state.plan.stepUpPct / 100) ** annualStep;
      const monthlyContribution = active
        ? annualAmount * PERIODS_PER_YEAR[state.plan.frequency] / 12
        : 0;
      state.value = state.value * (simulationDate >= state.plan.startDate ? 1 + monthlyRate : 1) + monthlyContribution;
    }
    simulated = fixedValue + states.reduce((total, state) =>
      total + state.value, 0);
    if (simulated >= goal.target) {
      projectedDate = monthEndAfter(asOf, month);
      break;
    }
  }
  if (!projectedDate) {
    return { current, invested, remaining, percent, projectedDate: null, deadline, deltaMonths: null, status: 'none' };
  }
  const deltaMonths = monthIndex(projectedDate) - monthIndex(deadline);
  return {
    current,
    invested,
    remaining,
    percent,
    projectedDate,
    deadline,
    deltaMonths,
    status: deltaMonths < 0 ? 'ahead' : deltaMonths === 0 ? 'on-track' : 'behind',
  };
}
