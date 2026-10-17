import { emptyAppData } from '../actions';
import { deleteHolding } from '../holdingActions';
import { validateIntegrity } from '../links';
import { mockAppData } from '../../mock/data';
import { buildDemoData } from '../../mock/demoData';
import {
  InvalidGoalLinksError,
  goalAssetValueFor,
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
  it('lists all holdings and savings policies but never the automatic emergency fund', () => {
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
    const allocated = setGoalLinks(data, 'goal', [{ instrumentId: 'manual' }]);
    expect(linkableInstruments(allocated, '2026-10-12').map(({ id }) => id))
      .toContain('manual');
  });

  it('computes linked saved value and falls back to manual saved', () => {
    const data = setGoalLinks(baseData(), 'goal', [
      { instrumentId: 'manual' },
      { instrumentId: 'plan' },
    ]);
    const goal = data.goals.find((item) => item.id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    expect(goalSavedFor(goal, data, '2026-10-12')).toBe(1_000);
    expect(goalSavedFor({ ...goal, links: [] }, data, '2026-10-12')).toBe(700);
    const emergency = data.goals.find((item) => item.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal fixture missing');
    expect(goalSavedFor(emergency, data, '2026-10-12')).toBe(0);
    const linkedEmergency = setGoalLinks(data, emergency.id, [{ instrumentId: 'manual' }]);
    const linkedGoal = linkedEmergency.goals.find((item) => item.auto === 'ef')!;
    expect(goalSavedFor(linkedGoal, linkedEmergency, '2026-10-12')).toBe(500);
  });

  it('splits an asset equally across one, two and three goals with deterministic paise remainder', () => {
    let data = baseData();
    data = setGoalLinks(data, 'goal', [{ instrumentId: 'manual', share: 30 }]);
    let goal = data.goals.find(({ id }) => id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    expect(goalAssetValueFor(goal, data, 'manual', 1_000)).toBe(1_000);
    data = {
      ...data,
      goals: [...data.goals,
        { id: 'second', name: 'Home', target: 10_000, saved: 0, year: 2030, links: [] },
        { id: 'third', name: 'Education', target: 10_000, saved: 0, year: 2031, links: [] }],
    };
    data = setGoalLinks(data, 'second', [{ instrumentId: 'manual', share: 99.9 }]);
    goal = data.goals.find(({ id }) => id === 'goal');
    const second = data.goals.find(({ id }) => id === 'second');
    if (!goal || !second) throw new Error('Shared goal fixtures missing');
    expect(goalSavedFor(goal, data, '2026-10-12')).toBe(500);
    expect(goalSavedFor(second, data, '2026-10-12')).toBe(500);

    data = setGoalLinks(data, 'third', [{ instrumentId: 'manual' }]);
    const shares = data.goals
      .filter((item) => item.links.some((link) => link.instrumentId === 'manual'))
      .map((item) => goalAssetValueFor(item, data, 'manual', 1_000.01));
    expect(shares).toEqual([333.34, 333.34, 333.33]);
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(1_000.01);
  });

  it('rebalance links after unlinking, accepts legacy shares and rejects duplicates', () => {
    let data = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'manual', share: 60 }]);
    data = {
      ...data,
      goals: [...data.goals, { id: 'second', name: 'Home', target: 10_000, saved: 0, year: 2030, links: [] }],
    };
    data = setGoalLinks(data, 'second', [{ instrumentId: 'manual', share: 40 }]);
    expect(data.goals.find(({ id }) => id === 'goal')?.links).toEqual([{ instrumentId: 'manual' }]);
    const first = data.goals.find(({ id }) => id === 'goal');
    const second = data.goals.find(({ id }) => id === 'second');
    if (!first || !second) throw new Error('Shared goal fixtures missing');
    expect(goalSavedFor(first, data, '2026-10-12')).toBe(500);
    expect(goalSavedFor(second, data, '2026-10-12')).toBe(500);
    data = setGoalLinks(data, 'second', []);
    const unlinkedFirst = data.goals.find(({ id }) => id === 'goal');
    if (!unlinkedFirst) throw new Error('Goal fixture missing');
    expect(goalSavedFor(unlinkedFirst, data, '2026-10-12')).toBe(1_000);
    expect(() => setGoalLinks(data, 'goal', [
      { instrumentId: 'manual' },
      { instrumentId: 'manual' },
    ])).toThrow('cannot link the same asset more than once');
    expect(() => setGoalLinks(data, 'second', [{ instrumentId: 'missing' }]))
      .toThrow('Choose an existing holding or savings policy');
    expect(() => setGoalLinks(data, 'unknown', [])).toThrow(InvalidGoalLinksError);
    const emergency = data.goals.find((goal) => goal.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal fixture missing');
    expect(setGoalLinks(data, emergency.id, [])).not.toBe(data);
    expect(setGoalLinks(data, emergency.id, [{ instrumentId: 'plan' }]))
      .not.toBe(data);
    const existingGoal = data.goals.find((item) => item.id === 'goal');
    if (!existingGoal) throw new Error('Goal fixture missing');
    expect(goalSavedFor({ ...existingGoal, links: [{ instrumentId: 'removed', share: 50 }] }, data, '2026-10-12'))
      .toBe(0);
  });

  it('removes an emergency-goal link from its allocation bucket', () => {
    const linked = {
      ...baseData(),
      efBucketLinks: { bank: ['manual'] },
    };
    const emergency = linked.goals.find((goal) => goal.auto === 'ef');
    if (!emergency) throw new Error('Emergency goal fixture missing');
    const withGoalLink = setGoalLinks(linked, emergency.id, [{ instrumentId: 'manual' }]);
    expect(withGoalLink.efBucketLinks).toEqual({ bank: ['manual'] });
    const withoutGoalLink = setGoalLinks(withGoalLink, emergency.id, []);
    expect(withoutGoalLink.efBucketLinks).toEqual({ bank: [] });
  });

  it('removes dangling links atomically when either holding kind is deleted', () => {
    const linked = setGoalLinks(baseData(), 'goal', [
      { instrumentId: 'manual', share: 25 },
      { instrumentId: 'plan', share: 25 },
    ]);
    const withoutManual = deleteHolding(linked, 'manual');
    expect(withoutManual.goals.find((goal) => goal.id === 'goal')?.links)
      .toEqual([{ instrumentId: 'plan' }]);
    const withoutPlan = deletePlan(withoutManual, 'plan', { linkedTransactions: 'keep' });
    expect(withoutPlan.goals.find((goal) => goal.id === 'goal')?.links).toEqual([]);
    expect(validateIntegrity(withoutPlan)).toEqual([]);
  });

  it('projects monthly contributions and reports completion relative to the target deadline', () => {
    const data = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'plan' }]);
    const goal = data.goals.find((item) => item.id === 'goal');
    if (!goal) throw new Error('Goal fixture missing');
    const result = goalProjection({ ...goal, target: 250, year: 2027 }, data, '2026-03-15');
    expect(result).toMatchObject({
      current: 0,
      invested: 0,
      remaining: 250,
      percent: 0,
      projectedDate: '2026-06-30',
      deadline: '2027-12-31',
      deltaMonths: -18,
      status: 'ahead',
    });
    const onTrackData = setGoalLinks(baseData(), 'goal', [{ instrumentId: 'plan' }]);
    const onTrackGoal = onTrackData.goals.find((item) => item.id === 'goal');
    if (!onTrackGoal) throw new Error('Goal fixture missing');
    expect(goalProjection({ ...onTrackGoal, target: 250, year: 2026 }, onTrackData, '2026-07-01'))
      .toMatchObject({ projectedDate: '2026-10-31', deltaMonths: -2, status: 'ahead' });
    expect(goalProjection({ ...onTrackGoal, target: 250, year: 2026 }, onTrackData, '2027-01-01'))
      .toMatchObject({ projectedDate: '2027-04-30', deltaMonths: 4, status: 'behind' });
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
    expect(stepProjection.projectedDate).toBe('2027-05-31');
    expect(stepProjection.current).toBe(5_000);
    expect(stepProjection.invested).toBe(1_300);
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

  it('records the legacy-share and equal-split saved totals for both shipped fixtures', () => {
    const asOf = '2026-10-12';
    const dataSets = [mockAppData, buildDemoData(asOf)];
    const totals = dataSets.map((data) => {
      const instruments = new Map(linkableInstruments(data, asOf).map((item) => [item.id, item.value]));
      return data.goals.map((goal) => ({
        id: goal.id,
        before: goal.links.length === 0
          ? (goal.auto === 'ef' ? 0 : goal.saved)
          : goal.links.reduce((total, link) =>
            total + (instruments.get(link.instrumentId) ?? 0) * (link.share ?? 100) / 100, 0),
        after: goalSavedFor(goal, data, asOf),
      }));
    });

    expect(totals).toEqual([
      [
        { id: 'goal-portfolio', before: 35_532.141979678534, after: 118_440.47 },
        { id: 'goal-home', before: 20_625, after: 82_500 },
        { id: 'goal-farm', before: 0, after: 0 },
        { id: 'goal-emergency', before: 155_000, after: 290_456 },
      ],
      [
        { id: 'demo-goal-emergency', before: 189_000, after: 189_000 },
        { id: 'demo-goal-retirement', before: 9_626.447377234414, after: 8_022.04 },
        { id: 'demo-goal-home', before: 56_363.2236886172, after: 214_222.04 },
        { id: 'demo-goal-education', before: 7_250, after: 29_000 },
        { id: 'demo-goal-travel', before: 25_000, after: 25_000 },
      ],
    ]);
  });
});
