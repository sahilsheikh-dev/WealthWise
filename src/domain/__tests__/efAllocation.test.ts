import { mockAppData } from '../../mock/data';
import * as efAllocationModule from '../efAllocation';
import {
  allocateAmounts,
  allocationWarnings,
  effectiveAllocation,
  EF_BUCKETS,
  SUGGESTED_EF_ALLOCATION,
  validateAllocation,
} from '../efAllocation';
import { InvalidAllocationError, resetEfAllocation, setEfAllocation } from '../efAllocationActions';

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
  });

  it('warns at threshold boundaries', () => {
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, cash: 25, bank: 24.9 })).toEqual(
      expect.arrayContaining([{ id: 'low-instant-access', message: 'Less than half of your emergency fund is available instantly' }]),
    );
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, 'mutual-funds-bonds': 20, stocks: 0 })).not.toEqual(
      expect.arrayContaining([{ id: 'high-market-exposure', message: expect.any(String) }]),
    );
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, 'mutual-funds-bonds': 20, stocks: 1 })).toEqual(
      expect.arrayContaining([{ id: 'high-market-exposure', message: expect.any(String) }]),
    );
    expect(allocationWarnings({ ...SUGGESTED_EF_ALLOCATION, insurance: 10.1 })).toEqual(
      expect.arrayContaining([{ id: 'insurance-heavy', message: expect.any(String) }]),
    );
    expect(allocationWarnings(null)).toEqual([]);
  });

  it('normalizes partial and invalid allocations and applies set/reset actions', () => {
    expect(effectiveAllocation(null)).toEqual(SUGGESTED_EF_ALLOCATION);
    expect(effectiveAllocation(undefined as any)).toEqual(SUGGESTED_EF_ALLOCATION);
    expect(effectiveAllocation({ ...SUGGESTED_EF_ALLOCATION, cash: 20 })).toMatchObject({ cash: 20, bank: 40 });
    expect(validateAllocation(null, true)).toEqual({ valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] });
    expect(validateAllocation(undefined as any, true)).toEqual({ valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] });
    expect(validateAllocation({ ...SUGGESTED_EF_ALLOCATION, cash: Number.NaN }, true)).toMatchObject({ valid: false });

    const validationSpy = jest.spyOn(efAllocationModule, 'validateAllocation');
    expect(() => setEfAllocation(mockAppData, null as any)).toThrow(InvalidAllocationError);
    validationSpy.mockImplementationOnce(() => ({ valid: false, total: 0, issues: ['bad'] }));
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 10 })).toThrow(InvalidAllocationError);
    validationSpy.mockImplementationOnce(() => ({ valid: false, total: 0, issues: [] }));
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20 })).toThrow('Emergency fund allocation must total 100%.');
    validationSpy.mockImplementationOnce(() => false);
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20 })).toThrow(InvalidAllocationError);
    validationSpy.mockRestore();

    const updated = setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 20, bank: 30 });
    expect(updated.efAllocation).toMatchObject({ cash: 20, bank: 30 });
    expect(resetEfAllocation(updated)).toMatchObject({ efAllocation: null });
    expect(() => setEfAllocation(mockAppData, { ...SUGGESTED_EF_ALLOCATION, cash: 101 })).toThrow(InvalidAllocationError);
  });

  it('covers the mismatch rounding branch and partial defaults', () => {
    const originalAbs = Math.abs;
    let absCalls = 0;
    const absSpy = jest.spyOn(Math, 'abs').mockImplementation((value: number) => {
      absCalls += 1;
      if (absCalls === 1) return 5.01;
      return 5.02;
    });

    try {
      const mismatched = allocateAmounts(5, { ...SUGGESTED_EF_ALLOCATION, cash: 10, bank: 40, 'fd-rd': 35, 'mutual-funds-bonds': 15 });
      expect(mismatched.cash).toBeGreaterThan(0);
      expect(mismatched.bank).toBeGreaterThan(0);
      expect(effectiveAllocation({} as any)).toEqual(SUGGESTED_EF_ALLOCATION);
      expect(effectiveAllocation({ cash: 20 } as any)).toMatchObject({
        cash: 20,
        bank: 40,
        'fd-rd': 35,
        'mutual-funds-bonds': 15,
        stocks: 0,
        insurance: 0,
        other: 0,
      });
      expect(allocateAmounts(5, {} as any).cash).toBeGreaterThan(0);
      expect(allocateAmounts(5, { cash: 10 } as any).cash).toBeGreaterThan(0);
    } finally {
      absSpy.mockRestore();
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
      'mutual-funds-bonds': 2.22,
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
