import { addDays, addMonths, addYears, compareISO, daysBetween, isValidISO, monthKey, parseISO, shiftMonth } from '../dates';

describe('UTC ISO date helpers', () => {
  it('validates real calendar dates and rejects malformed values', () => {
    expect(isValidISO('2024-02-29')).toBe(true);
    expect(isValidISO('2025-02-29')).toBe(false);
    expect(isValidISO('2026-13-01')).toBe(false);
    expect(isValidISO('2026-1-01')).toBe(false);
    expect(() => parseISO('2026-02-29')).toThrow(RangeError);
    expect(parseISO('2026-08-09')).toEqual({ y: 2026, m: 8, d: 9 });
  });

  it('counts UTC calendar days across DST boundaries and year ends', () => {
    expect(daysBetween('2026-03-08', '2026-03-09')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-02')).toBe(2);
    expect(daysBetween('2026-01-02', '2025-12-31')).toBe(-2);
  });

  it('compares and shifts ISO dates and month keys', () => {
    expect(compareISO('2026-01-01', '2026-01-02')).toBe(-1);
    expect(compareISO('2026-01-02', '2026-01-02')).toBe(0);
    expect(compareISO('2026-01-03', '2026-01-02')).toBe(1);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(monthKey('2026-12-31')).toBe('2026-12');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(() => shiftMonth('2026-13', 1)).toThrow(RangeError);
  });

  it('clamps month and year additions at the target month end', () => {
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });
});
