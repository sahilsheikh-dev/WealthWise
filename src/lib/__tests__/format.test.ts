import { formatDate, formatINR, formatINRShort, formatMonth } from '../format';

describe('rupee and date formatters', () => {
  it('groups Indian digits using the six documented examples', () => {
    const examples: [number, string][] = [
      [0, '₹0'],
      [12, '₹12'],
      [1_234, '₹1,234'],
      [123_456, '₹1,23,456'],
      [1_234_567, '₹12,34,567'],
      [-12_345_678, '-₹1,23,45,678'],
    ];
    for (const [input, expected] of examples) expect(formatINR(input)).toBe(expected);
  });

  it('uses L and Cr abbreviations at the required thresholds', () => {
    expect(formatINRShort(99_999)).toBe('₹99,999');
    expect(formatINRShort(100_000)).toBe('₹1.00 L');
    expect(formatINRShort(12_34_56_789)).toBe('₹12.35 Cr');
  });

  it('formats fixed ISO dates and month keys', () => {
    expect(formatDate('2026-10-09')).toBe('9 Oct 2026');
    expect(formatMonth('2026-10')).toBe('October 2026');
  });
});
