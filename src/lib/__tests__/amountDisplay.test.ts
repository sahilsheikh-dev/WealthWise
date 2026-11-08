import { chooseAmountStyle, formatAmount } from '../amountDisplay';
import { formatINR, formatINRCompact } from '../format';

describe('compact amount formatting', () => {
  it.each([
    [999, '₹999'],
    [1_000, '₹1.00 K'],
    [99_999.6, '₹1.00 L'],
    [100_000, '₹1.00 L'],
    [9_999_999.6, '₹1.00 Cr'],
    [10_000_000, '₹1.00 Cr'],
    [-1_000, '-₹1.00 K'],
    [-99_999.6, '-₹1.00 L'],
    [1_234.56, '₹1.23 K'],
  ])('formats %s as %s', (amount, expected) => {
    expect(formatINRCompact(amount)).toBe(expected);
  });

  it.each([
    ['exact', 12_345_678, 1, 'exact'],
    ['hero', 999, 1, 'exact'],
    ['hero', 1_000, 1, 'compact'],
    ['tile', 1_000, 1.5, 'compact'],
    ['row', 1_234_567, 1, 'exact'],
    ['row', 10_000_000, 1, 'compact'],
    ['row', 12_345_678, 1.5, 'compact'],
  ] as const)('chooses %s style for amount %s at font scale %s', (tier, amount, fontScale, expected) => {
    expect(chooseAmountStyle({ tier, amount, fontScale })).toBe(expected);
  });

  it('shortens long row amounts only at larger font scales and preserves exact helper output', () => {
    expect(chooseAmountStyle({ amount: 12_345_678, tier: 'row', fontScale: 1.5 })).toBe('compact');
    expect(formatAmount(-12_345_678, 'exact', 2)).toBe(formatINR(-12_345_678));
  });
});
