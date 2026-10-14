import { allocateAmounts, SUGGESTED_EF_ALLOCATION, allocationWarnings } from '../efAllocation';
import {
  addEfCustomBucket,
  deleteEfCustomBucket,
  InvalidAllocationError,
  InvalidEfCustomBucketError,
  renameEfCustomBucket,
  saveEfPlan,
  setEfBucketLinks,
  setEfCustomBucketAccess,
} from '../efAllocationActions';
import { emptyAppData } from '../actions';
import { deleteHolding } from '../holdingActions';
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
  it('adds and edits custom bucket metadata while keeping new options at zero allocation', () => {
    const added = addEfCustomBucket(
      { ...empty(), efAllocation: { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 } },
      { name: '  Safe box ', access: 'instant', marketLinked: false },
      () => 'custom-safe-box',
    );
    expect(added.efCustomBuckets).toEqual([{ ...custom('custom-safe-box'), access: 'instant' }]);
    expect(added.efCustomBuckets[0]?.access).toBe('instant');
    expect(added.efAllocation?.['custom-safe-box']).toBe(0);
    expect(renameEfCustomBucket(added, 'custom-safe-box', 'Household reserve').efCustomBuckets[0]?.name)
      .toBe('Household reserve');
    expect(setEfCustomBucketAccess(added, 'custom-safe-box', 'slow').efCustomBuckets[0]?.access).toBe('slow');
  });

  it('rejects invalid, duplicate, fixed-label and over-limit names', () => {
    expect(() => addEfCustomBucket(empty(), { name: 'Cash', access: 'instant', marketLinked: false }, () => 'custom-1'))
      .toThrow(InvalidEfCustomBucketError);
    expect(() => addEfCustomBucket(empty(), { name: '   ', access: 'instant', marketLinked: false }, () => 'custom-1'))
      .toThrow('1 to 24 characters');
    const eight = Array.from({ length: 8 }, (_, index) => custom(`custom-${index}`, `Option ${index}`));
    expect(() => addEfCustomBucket(
      { ...empty(), efCustomBuckets: eight },
      { name: 'Ninth option', access: 'days', marketLinked: false },
      () => 'ninth',
    )).toThrow('up to 8');
    expect(() => renameEfCustomBucket({
      ...empty(),
      efCustomBuckets: [custom('first'), custom('second', 'Emergency reserve')],
    }, 'second', 'Safe box')).toThrow('unique');
  });

  it('rejects malformed bucket metadata, duplicate IDs and missing bucket updates', () => {
    expect(() => addEfCustomBucket(
      empty(),
      { name: 'Fast access', access: 'invalid' as never, marketLinked: false },
      () => 'custom-1',
    )).toThrow('Choose an access option');
    expect(() => addEfCustomBucket(
      empty(),
      { name: 'Market option', access: 'instant', marketLinked: 'yes' as never },
      () => 'custom-1',
    )).toThrow('market-linked');
    expect(() => addEfCustomBucket(
      empty(),
      { name: 'Empty ID', access: 'instant', marketLinked: false },
      () => '',
    )).toThrow('IDs must be unique');
    expect(() => addEfCustomBucket(
      { ...empty(), efCustomBuckets: [custom('duplicate')] },
      { name: 'Another option', access: 'instant', marketLinked: false },
      () => 'duplicate',
    )).toThrow('IDs must be unique');
    expect(() => setEfCustomBucketAccess(empty(), 'missing', 'slow')).toThrow('was not found');
    const unchanged = addEfCustomBucket(empty(), {
      name: 'Valid bucket',
      access: 'instant',
      marketLinked: false,
    }, () => 'valid');
    expect(unchanged.efAllocation).toBeNull();
  });

  it('requires moving a positive allocation and deletes linked rows in the same pure result', () => {
    const data = {
      ...empty(),
      efCustomBuckets: [custom('custom-safe-box')],
      efAllocation: {
        cash: 10, bank: 35, 'fd-rd': 35, 'mutual-funds-bonds': 15,
        stocks: 0, insurance: 0, other: 0, 'custom-safe-box': 5,
      },
      efBucketLinks: { 'custom-safe-box': ['holding-a'] },
    };
    expect(() => deleteEfCustomBucket(data, 'custom-safe-box')).toThrow('Move this option');
    const deleted = deleteEfCustomBucket(data, 'custom-safe-box', { moveTo: 'bank' });
    expect(deleted.efCustomBuckets).toEqual([]);
    expect(deleted.efAllocation).toEqual({
      cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15,
      stocks: 0, insurance: 0, other: 0,
    });
    expect(deleted.efBucketLinks).toEqual({});
  });

  it('validates allocation move targets and handles zero-allocation deletion', () => {
    const data = {
      ...empty(),
      efCustomBuckets: [custom('first'), custom('second', 'Travel reserve')],
      efAllocation: { ...SUGGESTED_EF_ALLOCATION, first: 5, second: 0, bank: 20 },
    };
    expect(() => deleteEfCustomBucket(data, 'first', { moveTo: 'unknown' })).toThrow('another existing option');
    expect(() => deleteEfCustomBucket(data, 'first', { moveTo: 'first' })).toThrow('another existing option');
    expect(deleteEfCustomBucket(data, 'first', { moveTo: 'second' }).efAllocation?.second).toBe(5);
    expect(deleteEfCustomBucket({ ...empty(), efCustomBuckets: [custom('zero')] }, 'zero'))
      .toMatchObject({ efCustomBuckets: [], efAllocation: null, efBucketLinks: {} });
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
    expect(setEfBucketLinks(data, 'custom-safe-box', ['holding-a']).efBucketLinks)
      .toEqual({ 'custom-safe-box': ['holding-a'] });
    expect(setEfBucketLinks(data, 'bank', ['holding-a']).efBucketLinks)
      .toEqual({ bank: ['holding-a'] });
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
    const data = { ...empty(), holdings: [holding], efCustomBuckets: [custom('existing')] };
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
      links: { bank: ['holding-a'], existing: ['holding-a'] },
    }, () => 'unused');
    expect(saved.efBucketLinks).toEqual({
      bank: ['holding-a'],
      existing: ['holding-a'],
    });
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
