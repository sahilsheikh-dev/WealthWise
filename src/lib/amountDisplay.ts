import { formatINR, formatINRCompact } from './format';

export type AmountTier = 'exact' | 'hero' | 'tile' | 'row';

export function chooseAmountStyle(input: {
  amount: number;
  tier: AmountTier;
  fontScale: number;
}): 'exact' | 'compact' {
  const { amount, tier, fontScale } = input;
  const absolute = Math.abs(amount);
  if (tier === 'exact') return 'exact';
  if (tier === 'hero' || tier === 'tile') return absolute >= 1_000 ? 'compact' : 'exact';
  return absolute >= 10_000_000 || (fontScale > 1.3 && formatINR(amount).length > 10)
    ? 'compact'
    : 'exact';
}

export function formatAmount(amount: number, tier: AmountTier, fontScale: number): string {
  return chooseAmountStyle({ amount, tier, fontScale }) === 'compact'
    ? formatINRCompact(amount)
    : formatINR(amount);
}
