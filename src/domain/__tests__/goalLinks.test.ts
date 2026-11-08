import { emptyAppData } from '../actions';
import { deleteHolding } from '../holdingActions';
import { validateIntegrity } from '../links';
import {
  AssetOverAllocatedError,
  InvalidGoalLinksError,
  goalProjection,
  goalSavedFor,
  linkableInstruments,
  setGoalLinks,
} from '../goalLinks';
import { deletePlan } from '../planActions';
import type { Goal, ManualHolding, PlanHolding, Policy } from '../types';

const manual: ManualHolding = {
  id: 'manual',
  kind: 'manual',
  name: 'Savings',
  type: 'Savings account',
  invested: 800,
  value: 1_000,
  valueAsOf: '2026-10-01',
  logs: [],
};

const plan: PlanHolding = {
  id: 'plan',
  kind: 'plan',
  name: 'Monthly plan',
  type: 'Mutual fund / SIP',
  frequency: 'monthly',
  amount: 100,
  ratePct: 0,
  stepUpPct: 0,
  tenureYears: 10,
  startDate: '2026-01-01',
  trackFrom: '2026-01-01',
  opening: 0,
  actualValue: null,
  actualValueDate: null,
  logs: [],
};

const policy: Policy = {
  id: 'policy',
  name: 'Savings policy',
  insurer: '',
  kind: 'life-savings',
  premium: 500,
  frequency: 'yearly',
  startDate: '2026-01-01',
  premiumYears: 10,
  trackFrom: '2026-01-01',
  coverAmount: 20_000,
  currentValue: 4_000,
  valueAsOf: '2026-10-01',
  maturityDate: null,
  payments: [{ id: 'premium', date: '2026-01-01', amount: 500, note: '' }],
};

function baseData() {
  const data = emptyAppData('2026-10-01');
  const goal: Goal = { id: 'goal', name: 'Trip', target: 100_000, saved: 700, year: 2028, links: [] };
  return { ...data, goals: [...data.goals, goal], holdings: [manual, plan] };
}

describe('goal asset links', () => {
  it('lists holdings and savings policies but never the automatic emergency fund', () => {
    const data = {
      ...baseData(),
      policies: [
        policy,
        { ...policy, id: 'ulip', kind: 'ulip' as const, currentValue: null, valueAsOf: null },
        { ...policy, id: 'term', kind: 'term' as const },
      ],
    };
    expect(linkableInstruments(data, '2026-10-12').map(({ id, kind, value, invested }) =>
      ({ id, kind, value, invested }))).toEqual([
      { id: 'manual', kind: 'manual', value: 1_000, invested: 800 },
      { id: 'plan', kind: 'plan', value: 0, invested: 0 },
      { id: 'policy', kind: 'policy', value: 4_000, invested: 500 },
      { id: 'ulip', kind: 'policy', value: 0, invested: 500 },
    ]);
    const allocated = setGoalLinks(data, 'goal', [{ instrumentId: 'manual', share: 30 }]);
    expect(linkableInstruments(allocated, '2026-10-12').find((item) => item.id === 'manual')?.freeShare)
      .toBe(70);
  });

  it('computes linked saved value by share, falls back to manual saved, and preserves emergency balance', () => {
    const data = setGoalLinks(baseData(), 'goal', [
      { instrumentId: 'manual', share: 50 },
      { instrumentId: 'plan', share: 25 },
    ]);
    const goal = data.goals.find((item) => item.id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    expect(goalSavedFor(goal, data, '2026-10-12', 90_000)).toBe(500);
    expect(goalSavedFor({ ...goal, links: [] }, data, '2026-10-12', 90_000)).toBe(700);
    const emergency = data.goals.find((item) => item.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal fixture missing');
    expect(goalSavedFor(emergency, data, '2026-10-12', 90_000)).toBe(90_000);
  });

  it('supports shared allocation across goals and rejects duplicates and over-allocation', () => {
    let data = baseData();
    data = setGoalLinks(data, 'goal', [{ instrumentId: 'manual', share: 60 }]);
    data = {
      ...data,
      goals: [...data.goals, { id: 'second', name: 'Home', target: 10_000, saved: 0, year: 2030, links: [] }],
    };
    data = setGoalLinks(data, 'second', [{ instrumentId: 'manual', share: 40 }]);
    expect(data.goals.flatMap((goal) => goal.links).reduce((sum, link) => sum + link.share, 0)).toBe(100);
    expect(() => setGoalLinks(data, 'second', [{ instrumentId: 'manual', share: 40.1 }]))
      .toThrow('This asset is already 60% allocated to other goals; at most 40% is left');
    expect(() => setGoalLinks(data, 'second', [{ instrumentId: 'manual', share: 40.1 }]))
      .toThrow(AssetOverAllocatedError);
    expect(() => setGoalLinks(data, 'goal', [
      { instrumentId: 'manual', share: 20 },
      { instrumentId: 'manual', share: 20 },
    ])).toThrow('cannot link the same asset more than once');
    expect(() => setGoalLinks(data, 'second', [{ instrumentId: 'missing', share: 1 }]))
      .toThrow('Choose an existing holding or savings policy');
    expect(() => setGoalLinks(data, 'unknown', [])).toThrow(InvalidGoalLinksError);
    const emergency = data.goals.find((goal) => goal.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal fixture missing');
    expect(() => setGoalLinks(data, emergency.id, [{ instrumentId: 'manual', share: 1 }]))
      .toThrow('cannot be linked');
    expect(setGoalLinks(data, emergency.id, [])).not.toBe(data);
    for (const share of [0, 0.05, 100.1, Number.NaN, 20.05]) {
      expect(() => setGoalLinks(data, 'second', [{ instrumentId: 'plan', share }]))
        .toThrow('Asset shares must be');
    }
    const existingGoal = data.goals.find((item) => item.id === 'goal');
    if (!existingGoal) throw new Error('Goal fixture missing');
    expect(goalSavedFor({ ...existingGoal, links: [{ instrumentId: 'removed', share: 50 }] }, data, '2026-10-12', 0))
      .toBe(0);
  });

  it('removes dangling links atomically when either holding kind is deleted', () => {
    const linked = setGoalLinks(baseData(), 'goal', [
      { instrumentId: 'manual', share: 25 },
      { instrumentId: 'plan', share: 25 },
    ]);
    const withoutManual = deleteHolding(linked, 'manual');
    expect(withoutManual.goals.find((goal) => goal.id === 'goal')?.links)
      .toEqual([{ instrumentId: 'plan', share: 25 }]);
    const withoutPlan = deletePlan(withoutManual, 'plan', { linkedTransactions: 'keep' });
    expect(withoutPlan.goals.find((goal) => goal.id === 'goal')?.links).toEqual([]);
    expect(validateIntegrity(withoutPlan)).toEqual([]);
  });

  it('projects monthly contributions and reports completion relative to the target deadline', () => {
    const data = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'plan', share: 50 }]);
    const goal = data.goals.find((item) => item.id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    const result = goalProjection({ ...goal, target: 250, year: 2027 }, data, '2026-03-15');
    expect(result).toMatchObject({
      current: 0,
      invested: 0,
      remaining: 250,
      percent: 0,
      projectedDate: '2026-08-31',
      deadline: '2027-12-31',
      deltaMonths: -16,
      status: 'ahead',
    });
    const onTrackData = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'plan', share: 50 }]);
    const onTrackGoal = onTrackData.goals.find((item) => item.id === 'goal');
    if (!onTrackGoal) throw new Error('Goal fixture missing');
    expect(goalProjection({ ...onTrackGoal, target: 250, year: 2026 }, onTrackData, '2026-07-01'))
      .toMatchObject({ projectedDate: '2026-12-31', deltaMonths: 0, status: 'on-track' });
    expect(goalProjection({ ...onTrackGoal, target: 250, year: 2026 }, onTrackData, '2027-01-01'))
      .toMatchObject({ projectedDate: '2027-06-30', deltaMonths: 6, status: 'behind' });
  });

  it('accounts for annual step-up, treats non-plan assets as flat, and handles already reached and no-contribution goals', () => {
    const stepPlan = { ...plan, amount: 100, stepUpPct: 100 };
    const data = setGoalLinks({ ...baseData(), holdings: [manual, stepPlan], policies: [policy] }, 'goal', [
      { instrumentId: 'manual', share: 50 },
      { instrumentId: 'policy', share: 50 },
      { instrumentId: 'plan', share: 50 },
    ]);
    const goal = data.goals.find((item) => item.id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    const stepProjection = goalProjection({ ...goal, target: 7_000, year: 2030 }, data, '2026-01-01');
    expect(stepProjection.projectedDate).toBe('2029-02-28');
    expect(stepProjection.current).toBe(2_500);
    expect(stepProjection.invested).toBe(650);
    expect(goalProjection({ ...goal, target: 100 }, data, '2026-01-01').projectedDate)
      .toBe('Already reached');

    const noContribution = { ...data, holdings: [manual, { ...stepPlan, amount: 0, ratePct: 0 }] };
    const noContributionGoal = noContribution.goals.find((item) => item.id === 'goal');
    if (!noContributionGoal) throw new Error('Goal fixture missing');
    expect(goalProjection({ ...noContributionGoal, target: 50_000 }, noContribution, '2026-01-01'))
      .toMatchObject({ projectedDate: null, deltaMonths: null, status: 'none' });

    const flatPlanData = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'plan', share: 50 }]);
    const flatPlanGoal = flatPlanData.goals.find((item) => item.id === 'goal');
    if (!flatPlanGoal) throw new Error('Goal fixture missing');
    const unreachable = goalProjection({ ...flatPlanGoal, target: 50_000 }, flatPlanData, '2026-01-01');
    expect(unreachable).toMatchObject({ projectedDate: null, deltaMonths: null, status: 'none' });
    const manualOnly = setGoalLinks({ ...baseData(), policies: [policy] }, 'goal', [
      { instrumentId: 'manual', share: 50 },
      { instrumentId: 'policy', share: 50 },
    ]);
    const manualGoal = manualOnly.goals.find((item) => item.id === 'goal');
    if (!manualGoal) throw new Error('Goal fixture missing');
    expect(goalProjection({ ...manualGoal, target: 100_000 }, manualOnly, '2026-01-01'))
      .toMatchObject({ projectedDate: null, status: 'none' });
    expect(goalProjection({ ...manualGoal, target: 0 }, manualOnly, '2026-01-01'))
      .toMatchObject({ percent: 0, projectedDate: 'Already reached' });
  });

  it('checks integrity after linking savings assets across multiple goals', () => {
    const data = setGoalLinks({ ...baseData(), policies: [policy] }, 'goal', [
      { instrumentId: 'manual', share: 25 },
      { instrumentId: 'policy', share: 75 },
    ]);
    expect(validateIntegrity(data)).toEqual([]);
  });
});
