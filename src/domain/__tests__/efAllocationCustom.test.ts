import { allocateAmounts, SUGGESTED_EF_ALLOCATION, allocationWarnings } from '../efAllocation';
import {
  InvalidAllocationError,
  saveEfPlan,
  setEfBucketLinks,
} from '../efAllocationActions';
import { emptyAppData } from '../actions';
import { deleteHolding } from '../holdingActions';
import { setGoalLinks } from '../goalLinks';
import { validateIntegrity } from '../links';
import type { EfAllocation } from '../types';

const empty = () => emptyAppData('2026-10-11');
const custom = (id: string, name = 'Safe box') => ({
  id,
  name,
  access: 'days' as const,
  marketLinked: false,
});

describe('custom emergency-fund options', () => {
  it('adds and edits custom item metadata through the saved-plan action at zero allocation', () => {
    const data = {
      ...empty(),
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 },
    };
    const added = saveEfPlan(data, {
      customBuckets: [{ ...custom('draft-1'), name: '  Safe box ', access: 'instant' }],
      allocation: { ...data.efAllocation, 'draft-1': 0 },
      links: {},
    }, () => 'custom-safe-box');
    expect(added.efCustomBuckets).toEqual([{ ...custom('custom-safe-box'), access: 'instant' }]);
    expect(added.efAllocation?.['custom-safe-box'] ?? 0).toBe(0);
    const edited = saveEfPlan(added, {
      customBuckets: [{ ...custom('custom-safe-box'), name: 'Household reserve', access: 'slow' }],
      allocation: added.efAllocation ?? {},
      links: added.efBucketLinks,
    }, () => 'unused');
    expect(edited.efCustomBuckets[0]).toEqual({
      ...custom('custom-safe-box', 'Household reserve'),
      access: 'slow',
    });
  });

  it('rejects invalid, duplicate, fixed-label and over-limit names in a saved plan', () => {
    expect(() => saveEfPlan(empty(), {
      customBuckets: [custom('custom-1', 'Cash')],
      allocation: {},
      links: {},
    }, () => 'unused')).toThrow('unique and different from the fixed options');
    expect(() => saveEfPlan(empty(), {
      customBuckets: [{ ...custom('custom-1'), name: '   ' }],
      allocation: {},
      links: {},
    }, () => 'unused'))
      .toThrow('1 to 24 characters');
    const eight = Array.from({ length: 8 }, (_, index) => custom(`custom-${index}`, `Option ${index}`));
    expect(() => saveEfPlan({ ...empty(), efCustomBuckets: eight }, {
      customBuckets: [...eight, custom('ninth', 'Ninth option')],
      allocation: {},
      links: {},
    }, () => 'unused')).toThrow('up to 8');
    expect(() => saveEfPlan({ ...empty(), efCustomBuckets: [custom('existing')] }, {
      customBuckets: [custom('existing', 'Cash')],
      allocation: {},
      links: {},
    }, () => 'unused')).toThrow('unique and different from the fixed options');
  });

  it('rejects malformed access metadata and duplicate or empty saved IDs', () => {
    expect(() => saveEfPlan(empty(), {
      customBuckets: [{ ...custom('invalid-access', 'Fast access'), access: 'invalid' as never }],
      allocation: {},
      links: {},
    }, () => 'unused')).toThrow('Choose an access option');
    expect(() => saveEfPlan(empty(), {
      customBuckets: [{ ...custom('invalid-market', 'Market option'), marketLinked: 'yes' as never }],
      allocation: {},
      links: {},
    }, () => 'unused')).toThrow('market-linked');
    expect(() => saveEfPlan(empty(), {
      customBuckets: [custom('draft', 'Empty ID')],
      allocation: {},
      links: {},
    }, () => '')).toThrow('IDs must be unique');
    let nextId = 0;
    expect(() => saveEfPlan(empty(), {
      customBuckets: [custom('draft', 'First'), custom('draft', 'Second')],
      allocation: {},
      links: {},
    }, () => `generated-${++nextId}`)).toThrow('IDs must be unique');
  });

  it('removes fixed and custom items in the saved plan while retaining emergency-goal links', () => {
    const data = {
      ...empty(),
      holdings: [{
        id: 'holding-a',
        kind: 'manual' as const,
        name: 'Savings',
        type: 'Savings account' as const,
        invested: 100,
        value: 100,
        logs: [],
      }, {
        id: 'holding-b',
        kind: 'manual' as const,
        name: 'Index fund',
        type: 'Mutual fund / SIP' as const,
        invested: 100,
        value: 100,
        logs: [],
      }],
      goals: [{
        id: 'ef-goal',
        name: 'Emergency fund',
        target: 1_000,
        saved: 0,
        year: 2028,
        auto: 'ef' as const,
        links: [
          { instrumentId: 'holding-a', share: 100 },
          { instrumentId: 'holding-b', share: 100 },
        ],
      }],
      efCustomBuckets: [custom('custom-safe-box')],
      efAllocation: {
        cash: 10, bank: 35, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'custom-safe-box': 5,
      },
      efBucketLinks: { 'custom-safe-box': ['holding-a'], stocks: ['holding-b'] },
    };
    const saved = saveEfPlan(data, {
      customBuckets: [],
      allocation: { cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 },
      links: {},
    }, () => 'unused');

    expect(saved.efCustomBuckets).toEqual([]);
    expect(saved.efAllocation).toEqual({
      cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
    });
    expect(saved.efBucketLinks).toEqual({});
    expect(saved.goals[0]?.links).toEqual([
      { instrumentId: 'holding-a' },
      { instrumentId: 'holding-b' },
    ]);
    expect(validateIntegrity(saved)).toEqual([]);
  });

  it('validates link targets, uniqueness and the ten-holding limit', () => {
    const data = {
      ...empty(),
      holdings: [{
        id: 'holding-a', kind: 'manual' as const, name: 'Savings', type: 'Savings account' as const,
        invested: 100, value: 100, logs: [],
      }],
      efCustomBuckets: [custom('custom-safe-box')],
    };
    const bucketLinked = setEfBucketLinks(data, 'custom-safe-box', ['holding-a']);
    expect(bucketLinked.efBucketLinks)
      .toEqual({ 'custom-safe-box': ['holding-a'] });
    expect(bucketLinked.goals.find((goal) => goal.auto === 'ef')?.links)
      .toEqual([{ instrumentId: 'holding-a' }]);
    expect(validateIntegrity(bucketLinked)).toEqual([]);
    expect(setEfBucketLinks(bucketLinked, 'custom-safe-box', ['holding-a']).efBucketLinks)
      .toEqual({ 'custom-safe-box': ['holding-a'] });
    expect(() => setEfBucketLinks({
      ...data,
      efBucketLinks: { bank: ['holding-a'] },
    }, 'custom-safe-box', ['holding-a'])).toThrow('only be linked once');
    expect(() => setEfBucketLinks(data, 'unknown', [])).toThrow('not found');
    expect(setEfBucketLinks(data, 'bank', ['holding-a']).efBucketLinks)
      .toEqual({ bank: ['holding-a'] });
    const fullyAllocated = setGoalLinks({
      ...data,
      goals: [...data.goals, { id: 'other', name: 'Other', target: 100, saved: 0, year: 2028, links: [] }],
    }, 'other', [{ instrumentId: 'holding-a' }]);
    const shared = setEfBucketLinks(fullyAllocated, 'custom-safe-box', ['holding-a']);
    expect(shared.goals.flatMap((goal) => goal.links)
      .filter((link) => link.instrumentId === 'holding-a')).toHaveLength(2);
    expect(validateIntegrity(shared)).toEqual([]);
    expect(() => setEfBucketLinks(data, 'custom-safe-box', ['missing'])).toThrow('must exist');
    expect(() => setEfBucketLinks(data, 'custom-safe-box', ['holding-a', 'holding-a'])).toThrow('only be linked once');
    expect(() => setEfBucketLinks(data, 'custom-safe-box', Array.from({ length: 11 }, (_, index) => `h-${index}`)))
      .toThrow('up to 10');
  });

  it('saves draft bucket IDs, allocation and links as one pure plan transformation', () => {
    const data = {
      ...empty(),
      holdings: [{
        id: 'holding-a', kind: 'manual' as const, name: 'Savings', type: 'Savings account' as const,
        invested: 100, value: 100, logs: [],
      }],
    };
    const plan = {
      customBuckets: [{ ...custom('draft-1'), name: 'Safe box' }],
      allocation: {
        cash: 0, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'draft-1': 10,
      },
      links: { 'draft-1': ['holding-a'] },
    };
    const saved = saveEfPlan(data, plan, () => 'generated-id');
    expect(saved.efCustomBuckets).toEqual([{ ...custom('generated-id'), name: 'Safe box' }]);
    expect(saved.efAllocation?.['generated-id']).toBe(10);
    expect(saved.efAllocation).not.toHaveProperty('draft-1');
    expect(saved.efBucketLinks).toEqual({ 'generated-id': ['holding-a'] });
    expect(validateIntegrity(saved)).toEqual([]);
  });

  it('rejects invalid plans and supports fixed and existing custom link IDs', () => {
    const holding = {
      id: 'holding-a', kind: 'manual' as const, name: 'Savings', type: 'Savings account' as const,
      invested: 100, value: 100, logs: [],
    };
    const secondHolding = { ...holding, id: 'holding-b', name: 'Bank account' };
    const data = { ...empty(), holdings: [holding, secondHolding], efCustomBuckets: [custom('existing')] };
    const allocation: EfAllocation = {
      cash: 0, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
      stocks: 0, insurance: 0, other: 0, existing: 10,
    };
    expect(() => saveEfPlan(data, {
      customBuckets: [custom('existing')],
      allocation: { ...allocation, cash: 1 },
      links: {},
    }, () => 'unused')).toThrow(InvalidAllocationError);
    expect(() => saveEfPlan(data, {
      customBuckets: [custom('existing')],
      allocation,
      links: { unknown: [] },
    }, () => 'unused')).toThrow('option was not found');
    const saved = saveEfPlan(data, {
      customBuckets: [custom('existing')],
      allocation,
      links: { bank: ['holding-a'], existing: ['holding-b'] },
    }, () => 'unused');
    expect(saved.efBucketLinks).toEqual({
      bank: ['holding-a'],
      existing: ['holding-b'],
    });
    expect(() => saveEfPlan(data, {
      customBuckets: [custom('existing')],
      allocation,
      links: { bank: ['holding-a'], existing: ['holding-a'] },
    }, () => 'unused')).toThrow('only be linked once');
  });

  it('cascades holding deletion through emergency-fund links', () => {
    const data = {
      ...empty(),
      holdings: [{
        id: 'holding-a', kind: 'manual' as const, name: 'Savings', type: 'Savings account' as const,
        invested: 100, value: 100, logs: [],
      }],
      efCustomBuckets: [custom('custom-safe-box')],
      efBucketLinks: { 'custom-safe-box': ['holding-a'] },
    };
    expect(deleteHolding(data, 'holding-a').efBucketLinks).toEqual({ 'custom-safe-box': [] });
  });

  it('reports hand-broken custom links, allocation IDs and names as integrity failures', () => {
    const broken = {
      ...empty(),
      efCustomBuckets: [custom('cash', 'Cash'), custom('cash', ' cash ')],
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, unknown: 0 },
      efBucketLinks: { unknown: ['missing-holding'] },
    };
    const codes = validateIntegrity(broken).map(({ code }) => code);
    expect(codes).toEqual(expect.arrayContaining([
      'duplicate-id',
      'invalid-ef-bucket-name',
      'duplicate-ef-bucket-name',
      'duplicate-ef-bucket-id',
      'missing-ef-allocation-bucket',
      'missing-ef-bucket-link-target',
      'missing-ef-linked-holding',
      'ef-bucket-missing-goal-link',
    ]));
  });

  it('derives access and market warnings from custom bucket metadata', () => {
    const instant = {
      ...SUGGESTED_EF_ALLOCATION,
      cash: 15,
      bank: 15,
      'fd-rd': 45,
      'mutual-funds-bonds': 20,
      stocks: 0,
      insurance: 0,
      other: 0,
      'custom-instant': 5,
    };
    expect(allocationWarnings(instant, [custom('custom-instant', 'Instant reserve')]).map(({ id }) => id))
      .toContain('low-instant-access');
    const market = {
      ...SUGGESTED_EF_ALLOCATION,
      cash: 10,
      bank: 30,
      'fd-rd': 30,
      'mutual-funds-bonds': 10,
      stocks: 0,
      insurance: 0,
      other: 0,
      'custom-market': 20,
    };
    expect(allocationWarnings(market, [{
      id: 'custom-market', name: 'Market option', access: 'slow', marketLinked: true,
    }]).map(({ id }) => id)).toContain('high-market-exposure');
  });

  it('preserves paise-exact largest-remainder totals with 0 to 8 custom buckets (20,000 seeded cases)', () => {
    let seed = 0x521bf3;
    const random = () => {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      return seed;
    };
    const fixedIds = Object.keys(SUGGESTED_EF_ALLOCATION);
    for (let caseIndex = 0; caseIndex < 20_000; caseIndex += 1) {
      const customCount = random() % 9;
      const buckets = Array.from({ length: customCount }, (_, index) => custom(`case-${caseIndex}-custom-${index}`, `Option ${index}`));
      const ids = [...fixedIds, ...buckets.map(({ id }) => id)];
      let remainingTenths = 1000;
      const allocation: EfAllocation = {};
      ids.forEach((id, index) => {
        const tenths = index === ids.length - 1 ? remainingTenths : random() % (remainingTenths + 1);
        allocation[id] = tenths / 10;
        remainingTenths -= tenths;
      });
      const balancePaise = random() % 100_000_000;
      const allocationAmounts = allocateAmounts(balancePaise / 100, allocation, buckets);
      const allocatedPaise = Object.values(allocationAmounts)
        .reduce((sum, amount) => sum + Math.round(amount * 100), 0);
      expect(allocatedPaise).toBe(balancePaise);
      expect(Object.keys(allocationAmounts)).toHaveLength(ids.length);
    }
  });
});
