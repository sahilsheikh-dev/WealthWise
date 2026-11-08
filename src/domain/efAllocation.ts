export const EF_BUCKETS = [
  'cash',
  'bank',
  'fd-rd',
  'mutual-funds-bonds',
  'stocks',
  'insurance',
  'other',
] as const;

export type EfBucketId = (typeof EF_BUCKETS)[number];

export type EfAllocation = Record<EfBucketId, number>;

export const LOW_INSTANT_ACCESS_THRESHOLD = 50;
export const HIGH_MARKET_EXPOSURE_THRESHOLD = 20;
export const INSURANCE_HEAVY_THRESHOLD = 10;

export const SUGGESTED_EF_ALLOCATION: EfAllocation = {
  cash: 10,
  bank: 40,
  'fd-rd': 35,
  'mutual-funds-bonds': 15,
  stocks: 0,
  insurance: 0,
  other: 0,
};

export const EF_BUCKET_META: Record<EfBucketId, {
  label: string;
  access: 'instant' | 'days' | 'slow';
  marketLinked: boolean;
  description: string;
}> = {
  cash: {
    label: 'Cash',
    access: 'instant',
    marketLinked: false,
    description: 'Physical cash kept for immediate needs.',
  },
  bank: {
    label: 'Bank account',
    access: 'instant',
    marketLinked: false,
    description: 'Savings or current balances you can access quickly.',
  },
  'fd-rd': {
    label: 'FD / RD',
    access: 'days',
    marketLinked: false,
    description: 'Fixed deposits and recurring deposits with a short lock-in.',
  },
  'mutual-funds-bonds': {
    label: 'Mutual funds / Bonds',
    access: 'days',
    marketLinked: true,
    description: 'Balanced funds and bond investments with some market risk.',
  },
  stocks: {
    label: 'Stock market',
    access: 'days',
    marketLinked: true,
    description: 'Equity exposure that can fall when you need it most.',
  },
  insurance: {
    label: 'LIC / Insurance',
    access: 'slow',
    marketLinked: false,
    description: 'Insurance value that can be difficult to access at short notice.',
  },
  other: {
    label: 'Other',
    access: 'slow',
    marketLinked: false,
    description: 'Other emergency fund holdings that are less liquid.',
  },
};

function normalizeAllocation(allocation: Partial<EfAllocation> | null | undefined): EfAllocation {
  const source = allocation ?? SUGGESTED_EF_ALLOCATION;
  return EF_BUCKETS.reduce((acc, id) => {
    acc[id] = Number(source[id] ?? SUGGESTED_EF_ALLOCATION[id]);
    return acc;
  }, {} as EfAllocation);
}

export function effectiveAllocation(allocation: Partial<EfAllocation> | null | undefined): EfAllocation {
  return normalizeAllocation(allocation);
}

export function allocateAmounts(balance: number, allocation: EfAllocation): Record<EfBucketId, number> {
  const balancePaise = Math.max(0, Math.round(Math.abs(balance) * 100));
  const totals = normalizeAllocation(allocation);
  if (!validateAllocation(totals)) {
    throw new RangeError('Allocation must contain percentages that total 100%.');
  }

  const shares = EF_BUCKETS.map((id, index) => {
    const numerator = balancePaise * Math.round(totals[id] * 10);
    return { id, index, amount: Math.floor(numerator / 1000), remainder: numerator % 1000 };
  });
  let unallocatedPaise = balancePaise - shares.reduce((sum, share) => sum + share.amount, 0);
  const byLargestRemainder = [...shares].sort((left, right) =>
    right.remainder - left.remainder || left.index - right.index,
  );
  for (const share of byLargestRemainder) {
    if (unallocatedPaise === 0) break;
    const bucket = shares[share.index];
    bucket.amount += 1;
    unallocatedPaise -= 1;
  }

  const result = shares.reduce((acc, share) => {
    acc[share.id] = share.amount / 100;
    return acc;
  }, {} as Record<EfBucketId, number>);
  return result;
}

export function validateAllocation(
  allocation: Partial<EfAllocation> | null | undefined,
  details?: true,
): boolean | { valid: boolean; total: number; issues: string[] } {
  if (!allocation) {
    const result = { valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] };
    return details ? result : false;
  }

  const values = EF_BUCKETS.map((id) => ({ id, value: Number(allocation[id] ?? 0) }));
  const issues: string[] = [];
  for (const { id, value } of values) {
    if (!Number.isFinite(value) || value < 0 || value > 100 || !/^\d+(?:\.\d)?$/.test(String(value).replace(/\.0$/, ''))) {
      issues.push(`${id}: Enter a percentage between 0 and 100`);
    }
  }

  const totalTenths = Number(values.reduce((sum, { value }) => sum + value, 0).toFixed(1));
  if (Math.abs(totalTenths - 100) > 0.0001) {
    issues.push(`Percentages must add up to 100% (now ${totalTenths}%)`);
  }

  const valid = issues.length === 0;
  const result = { valid, total: totalTenths, issues };
  return details ? result : valid;
}

export function allocationWarnings(allocation: EfAllocation | null | undefined): { id: string; message: string }[] {
  const current = effectiveAllocation(allocation);
  const warnings: { id: string; message: string }[] = [];
  const instant = current.cash + current.bank;
  const market = current['mutual-funds-bonds'] + current.stocks;
  if (instant < LOW_INSTANT_ACCESS_THRESHOLD) {
    warnings.push({ id: 'low-instant-access', message: 'Less than half of your emergency fund is available instantly' });
  }
  if (market > HIGH_MARKET_EXPOSURE_THRESHOLD) {
    warnings.push({ id: 'high-market-exposure', message: 'More than 20% is market-linked; its value can fall just when you need it' });
  }
  if (current.insurance > INSURANCE_HEAVY_THRESHOLD) {
    warnings.push({ id: 'insurance-heavy', message: 'Money in insurance can lose value if you surrender it early' });
  }
  return warnings;
}
