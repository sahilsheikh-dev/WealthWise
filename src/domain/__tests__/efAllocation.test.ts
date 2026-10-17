import { mockAppData } from '../../mock/data';
import * as efAllocationModule from '../efAllocation';
import {
  allocateAmounts,
  activeEfBucketMetadata,
  allocationWarnings,
  DEFAULT_EF_ALLOCATION,
  EF_BUCKETS,
  resolveEfAllocation,
  SUGGESTED_EF_ALLOCATION,
  validateAllocation,
  type EfAllocation,
} from '../efAllocation';
import { InvalidAllocationError, saveEfPlan, setEfAllocation } from '../efAllocationActions';

describe('ef allocation', () => {
  it('suggested allocation totals 100%', () => {
    const total = Object.values(SUGGESTED_EF_ALLOCATION).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(100);
  });

  it('allocateAmounts keeps exact total for awkward balances', () => {
    const first = allocateAmounts(100000.01, {
      cash: 33.3,
      bank: 33.3,
      'fd-rd': 33.4,
      'mutual-funds-bonds': 0,
      stocks: 0,
      insurance: 0,
      other: 0,
    });
    const sum = Number(Object.values(first).reduce((acc, value) => acc + value, 0).toFixed(2));
    expect(sum).toBe(100000.01);

    const zero = allocateAmounts(0, SUGGESTED_EF_ALLOCATION);
    expect(Object.values(zero).every((value) => value === 0)).toBe(true);

    const odd = allocateAmounts(0.01, SUGGESTED_EF_ALLOCATION);
    expect(Number(Object.values(odd).reduce((acc, value) => acc + value, 0).toFixed(2))).toBe(0.01);

    expect(() => allocateAmounts(1, {
      cash: 0,
      bank: 0,
      'fd-rd': 0,
      'mutual-funds-bonds': 0,
      stocks: 0,
      insurance: 0,
      other: 0,
    })).toThrow('Allocation must contain percentages that total 100%.');
    expect(() => allocateAmounts(100, { ...SUGGESTED_EF_ALLOCATION, cash: 101 })).toThrow(RangeError);
  });

  it('warns at threshold boundaries', () => {
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, cash: 25, bank: 24.9 })).toEqual(
      expect.arrayContaining([{ id: 'low-instant-access', message: 'Less than half of your emergency fund is available instantly' }]),
    );
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, bank: 35, 'mutual-funds-bonds': 20, stocks: 0 })).not.toEqual(
      expect.arrayContaining([{ id: 'high-market-exposure', message: expect.any(String) }]),
    );
    expect(allocationWarnings({
      ...SUGGESTED_EF_ALLOCATION,
      bank: 34,
      'mutual-funds-bonds': 20,
      stocks: 1,
    })).toEqual(
      expect.arrayContaining([{ id: 'high-market-exposure', message: expect.any(String) }]),
    );
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, bank: 29.9, insurance: 10.1 })).toEqual(
      expect.arrayContaining([{ id: 'insurance-heavy', message: expect.any(String) }]),
    );
    expect(allocationWarnings(null)).toEqual([]);
  });

  it('normalizes partial and invalid allocations and validates set actions', () => {
    expect(resolveEfAllocation({ efAllocation: null }).allocation).toEqual(DEFAULT_EF_ALLOCATION);
    expect(resolveEfAllocation({ efAllocation: undefined }).allocation).toEqual(DEFAULT_EF_ALLOCATION);
    expect(resolveEfAllocation({ efAllocation: {} }).allocation).toEqual(DEFAULT_EF_ALLOCATION);
    expect(resolveEfAllocation({ efAllocation: { cash: 20 } })).toMatchObject({
      allocation: { cash: 100 },
      repaired: true,
    });
    expect(validateAllocation(null, true)).toEqual({ valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] });
    expect(validateAllocation(undefined, true)).toEqual({ valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] });
    expect(validateAllocation(null)).toBe(false);
    expect(validateAllocation(undefined)).toBe(false);
    expect(validateAllocation({})).toBe(false);
    expect(validateAllocation({ ...SUGGESTED_EF_ALLOCATION, cash: Number.NaN }, true)).toMatchObject({ valid: false });

    const validationSpy = jest.spyOn(efAllocationModule, 'validateAllocation');
    expect(() => Reflect.apply(setEfAllocation, undefined, [mockAppData, null])).toThrow(InvalidAllocationError);
    validationSpy.mockImplementationOnce(() => ({ valid: false, total: 0, issues: ['bad'] }));
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 10 })).toThrow(InvalidAllocationError);
    validationSpy.mockImplementationOnce(() => ({ valid: false, total: 0, issues: [] }));
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20 })).toThrow('Emergency fund allocation must total 100%.');
    validationSpy.mockImplementationOnce(() => false);
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20 })).toThrow(InvalidAllocationError);
    validationSpy.mockRestore();

    const updated = setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 });
    expect(updated.efAllocation).toMatchObject({ cash: 20, bank: 30 });
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 101 })).toThrow(InvalidAllocationError);

    const floatDrift = {
      cash: 10.0000000001,
      bank: 39.9999999999,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
    };
    expect(setEfAllocation(mockAppData, floatDrift).efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
    });
    const invalidAllocations = [
      { ...SUGGESTED_EF_ALLOCATION, 'deleted-custom': 0 },
      { ...SUGGESTED_EF_ALLOCATION, cash: -1, bank: 41 },
      { ...SUGGESTED_EF_ALLOCATION, cash: Number.NaN },
      { ...SUGGESTED_EF_ALLOCATION, cash: 9.99 },
      { ...SUGGESTED_EF_ALLOCATION, cash: 10.01 },
    ];
    for (const invalidAllocation of invalidAllocations) {
      expect(() => setEfAllocation(mockAppData, invalidAllocation)).toThrow(InvalidAllocationError);
      expect(() => saveEfPlan(mockAppData, {
        customBuckets: [],
        allocation: invalidAllocation,
        links: {},
      }, () => 'unused-id')).toThrow(InvalidAllocationError);
    }
    expect(saveEfPlan(mockAppData, {
      customBuckets: [],
      allocation: floatDrift,
      links: {},
    }, () => 'unused-id').efAllocation).toEqual({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
    });
  });

  it('uses the four default groups and drops legacy zero groups without linked assets', () => {
    expect(activeEfBucketMetadata(null).map(({ id }) => id)).toEqual([
      'cash',
      'bank',
      'fd-rd',
      'mutual-funds-bonds',
    ]);
    expect(activeEfBucketMetadata({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    }).map(({ id }) => id)).toEqual([
      'cash',
      'bank',
      'fd-rd',
      'mutual-funds-bonds',
    ]);
    expect(activeEfBucketMetadata({ cash: 100, insurance: 0 }, [], { insurance: ['policy-or-holding'] })
      .map(({ id }) => id)).toEqual(['cash', 'insurance']);
  });

  it('apportions 20,000 seeded balances exactly in whole paise (seed 0x015A110C)', () => {
    const seed = 0x15a110c;
    let state = seed;
    const nextUint32 = (): number => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    };

    for (let caseIndex = 0; caseIndex < 20_000; caseIndex += 1) {
      const random53 = (nextUint32() & 0x1fffff) * 0x1_0000_0000 + nextUint32();
      const balancePaise = random53 % 10_000_000_001;
      let remainingTenths = 1000;
      const tenths = EF_BUCKETS.map((_, index) => {
        if (index === EF_BUCKETS.length - 1) return remainingTenths;
        const value = nextUint32() % (remainingTenths + 1);
        remainingTenths -= value;
        return value;
      });
      const allocation = Object.fromEntries(
        EF_BUCKETS.map((id, index) => [id, tenths[index] / 10]),
      ) as EfAllocation;
      const amounts = allocateAmounts(balancePaise / 100, allocation);
      const amountPaise = EF_BUCKETS.map((id) => Math.round(amounts[id] * 100));
      const exactShares = EF_BUCKETS.map((_, index) => balancePaise * tenths[index] / 1000);

      expect(amountPaise.reduce((sum, amount) => sum + amount, 0)).toBe(balancePaise);
      expect(amountPaise.every((amount) => amount >= 0)).toBe(true);
      amountPaise.forEach((amount, index) => {
        expect(Math.abs(amount - exactShares[index])).toBeLessThanOrEqual(1);
      });
    }
  });

  it('validates partial defaults and invalid value ranges', () => {
    const missingDefaults = validateAllocation({ cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 } as any, true);
    expect(missingDefaults).toMatchObject({ valid: true, total: 100 });
    expect(validateAllocation({} as any, true)).toMatchObject({ valid: false, total: 0 });

    const invalid = validateAllocation({
      cash: Number.NaN,
      bank: -1,
      'fd-rd': 101,
      'mutual-funds-bonds': 102.22,
      stocks: 0,
      insurance: 0,
      other: 0,
    }, true);
    expect(invalid).toMatchObject({ valid: false });
    expect(Number.isNaN((invalid as { total: number }).total)).toBe(true);
    expect(Array.isArray((invalid as { issues: string[] }).issues)).toBe(true);
    expect((invalid as { issues: string[] }).issues).toEqual(expect.arrayContaining([
      'cash: Enter a percentage between 0 and 100',
      'bank: Enter a percentage between 0 and 100',
      'fd-rd: Enter a percentage between 0 and 100',
      'mutual-funds-bonds: Enter a percentage between 0 and 100',
    ]));
  });

  it('validates totals and decimals', () => {
    expect(validateAllocation(undefined, true)).toMatchObject({ valid: false, total: 0 });
    expect(validateAllocation({}, true)).toMatchObject({ valid: false, total: 0 });
    expect(validateAllocation({
      cash: 99,
      bank: 0,
      'fd-rd': 0,
      'mutual-funds-bonds': 0,
      stocks: 0,
      insurance: 0,
      other: 0,
    })).toBe(false);
    expect(validateAllocation({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    })).toBe(true);
    expect(validateAllocation({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    })).toBe(true);
    expect(validateAllocation({
      cash: 10.1,
      bank: 40,
      'fd-rd': 34.9,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    })).toBe(true);
    const details = validateAllocation({
      cash: 10,
      bank: 40,
      'fd-rd': 35,
      'mutual-funds-bonds': 15,
      stocks: 0,
      insurance: 0,
      other: 0,
    }, true);
    expect(typeof details).toBe('object');
    expect(details).toMatchObject({ valid: true, total: 100 });
    expect(validateAllocation({
      cash: 33.33,
      bank: 33.33,
      'fd-rd': 33.34,
    })).toBe(true);
  });

  it('resolves malformed stored allocations to safe, exact totals', () => {
    const deletedOption = {
      ...SUGGESTED_EF_ALLOCATION,
      'deleted-custom': 0,
    };
    const renamedOption = {
      ...SUGGESTED_EF_ALLOCATION,
      bank: 30,
      'old-custom-id': 10,
    };
    const cases = [
      { allocation: { ...SUGGESTED_EF_ALLOCATION, cash: 9.99 }, customBuckets: [] },
      { allocation: { ...SUGGESTED_EF_ALLOCATION, cash: 10.01 }, customBuckets: [] },
      { allocation: deletedOption, customBuckets: [] },
      { allocation: { ...SUGGESTED_EF_ALLOCATION, cash: -1, bank: 41 }, customBuckets: [] },
      { allocation: { ...SUGGESTED_EF_ALLOCATION, cash: Number.NaN }, customBuckets: [] },
      { allocation: {}, customBuckets: [] },
      { allocation: deletedOption, customBuckets: [] },
      {
        allocation: renamedOption,
        customBuckets: [{ id: 'new-custom-id', name: 'Renamed', access: 'instant' as const, marketLinked: false }],
      },
    ];

    for (const { allocation, customBuckets } of cases) {
      const resolved = resolveEfAllocation({ ...mockAppData, efAllocation: allocation, efCustomBuckets: customBuckets });
      const total = Number(Object.values(resolved.allocation).reduce((sum, value) => sum + value, 0).toFixed(2));
      expect(total).toBe(100);
      expect(resolved.repaired).toBe(true);
    }
    expect(resolveEfAllocation({ ...mockAppData, efAllocation: {} }).allocation).toEqual(DEFAULT_EF_ALLOCATION);
    expect(resolveEfAllocation({ ...mockAppData, efAllocation: null })).toEqual({
      allocation: DEFAULT_EF_ALLOCATION,
      repaired: false,
    });
    expect(() => allocateAmounts(100, { cash: 100, 'deleted-custom': 0 })).toThrow(RangeError);
  });

  it('resolves seeded random allocations and deleted custom options to exact 100% totals', () => {
    let state = 0x39e6b71;
    const fixedIds = new Set<string>(EF_BUCKETS);
    const random = () => {
      state = (state * 1_664_525 + 1_013_904_223) >>> 0;
      return state;
    };

    for (let caseIndex = 0; caseIndex < 2_000; caseIndex += 1) {
      const customBuckets = Array.from({ length: random() % 5 }, (_, index) => ({
        id: `random-${caseIndex}-${index}`,
        name: `Option ${index}`,
        access: 'instant' as const,
        marketLinked: false,
      }));
      const includedBuckets = customBuckets.filter(() => random() % 2 === 0);
      const allocation: EfAllocation = {};
      for (const id of [...EF_BUCKETS, ...customBuckets.map(({ id }) => id)]) {
        const next = random() % 101;
        allocation[id] = next === 0 ? 0 : next;
      }
      if (caseIndex % 7 === 0) allocation['deleted-option'] = random() % 101;
      if (caseIndex % 11 === 0) allocation.cash = -1;
      const resolved = resolveEfAllocation({ efAllocation: allocation, efCustomBuckets: includedBuckets });
      const values = Object.values(resolved.allocation);
      expect(Number(values.reduce((sum, value) => sum + value, 0).toFixed(2))).toBe(100);
      const hasPositiveKnownValue = [...EF_BUCKETS, ...includedBuckets.map(({ id }) => id)]
        .some((id) => {
          const value = allocation[id];
          return Number.isFinite(value) && value > 0;
        });
      if (hasPositiveKnownValue) {
        expect(values.every((value) => value > 0 && Number.isFinite(value))).toBe(true);
      } else {
        expect(resolved.allocation).toEqual(DEFAULT_EF_ALLOCATION);
      }
      expect(Object.keys(resolved.allocation).every((id) =>
        fixedIds.has(id) || includedBuckets.some((bucket) => bucket.id === id))).toBe(true);
      expect(resolved.repaired).toBe(true);
    }
  });

  it('keeps the bucket list stable', () => {
    expect(EF_BUCKETS).toEqual([
      'cash',
      'bank',
      'fd-rd',
      'mutual-funds-bonds',
      'stocks',
      'insurance',
      'other',
    ]);
  });
});
