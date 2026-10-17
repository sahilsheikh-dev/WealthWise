import { EF_BUCKETS, type EfAllocation, type EfBucketId, type EfCustomBucket } from './types';

export { EF_BUCKETS };
export type { EfAllocation, EfBucketId };

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

export type EfBucketMetadata = {
  id: string;
  label: string;
  access: 'instant' | 'days' | 'slow';
  marketLinked: boolean;
  description: string;
};

export function efBucketMetadata(customBuckets: readonly EfCustomBucket[] = []): EfBucketMetadata[] {
  const fixed = EF_BUCKETS.map((id) => ({ id, ...EF_BUCKET_META[id] }));
  const custom = customBuckets.map((bucket) => ({
    id: bucket.id,
    label: bucket.name,
    access: bucket.access,
    marketLinked: bucket.marketLinked,
    description: '',
  }));
  return [...fixed, ...custom];
}

export function activeEfBucketMetadata(
  allocation: Partial<EfAllocation> | null | undefined,
  customBuckets: readonly EfCustomBucket[] = [],
  links: Record<string, readonly string[]> = {},
): EfBucketMetadata[] {
  const linkedIds = new Set(
    Object.entries(links)
      .filter(([, holdingIds]) => holdingIds.length > 0)
      .map(([id]) => id),
  );
  const customIds = new Set(customBuckets.map(({ id }) => id));
  const fixedIds = new Set<string>(EF_BUCKETS.filter((id) => allocation == null
    ? Number(SUGGESTED_EF_ALLOCATION[id] ?? 0) > 0 || linkedIds.has(id)
    : (Number(allocation[id] ?? 0) !== 0 && Object.hasOwn(allocation, id)) || linkedIds.has(id)));
  return efBucketMetadata(customBuckets).filter(({ id }) =>
    fixedIds.has(id) || customIds.has(id) || linkedIds.has(id));
}

function normalizeAllocation(
  allocation: Partial<EfAllocation> | null | undefined,
  customBuckets: readonly EfCustomBucket[] = [],
): EfAllocation {
  const source = allocation ?? SUGGESTED_EF_ALLOCATION;
  const normalized: EfAllocation = {};
  for (const id of EF_BUCKETS) {
    normalized[id] = Number(source[id] ?? SUGGESTED_EF_ALLOCATION[id]);
  }
  for (const bucket of customBuckets) {
    normalized[bucket.id] = Number(source[bucket.id] ?? 0);
  }
  return normalized;
}

export function effectiveAllocation(
  allocation: Partial<EfAllocation> | null | undefined,
  customBuckets: readonly EfCustomBucket[] = [],
): EfAllocation {
  return normalizeAllocation(allocation, customBuckets);
}

export function allocateAmounts(
  balance: number,
  allocation: EfAllocation,
  customBuckets: readonly EfCustomBucket[] = [],
): Record<string, number> {
  const bucketIds = efBucketMetadata(customBuckets).map(({ id }) => id);
  if (!validateAllocation(allocation, undefined, customBuckets)) {
    throw new RangeError('Allocation must contain percentages that total 100%.');
  }
  const totals = normalizeAllocation(allocation, customBuckets);

  const balancePaise = Math.max(0, Math.round(Math.abs(balance) * 100));
  const shares = bucketIds.map((id, index) => {
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

  const result: Record<string, number> = {};
  for (const share of shares) result[share.id] = share.amount / 100;
  return result;
}

export function validateAllocation(
  allocation: Partial<EfAllocation> | null | undefined,
  details?: true,
  customBuckets: readonly EfCustomBucket[] = [],
): boolean | { valid: boolean; total: number; issues: string[] } {
  if (!allocation) {
    const result = { valid: false, total: 0, issues: ['Percentages must add up to 100% (now 0%)'] };
    return details ? result : false;
  }

  const allowedIds = efBucketMetadata(customBuckets).map(({ id }) => id);
  const values = allowedIds.map((id) => ({ id, value: Number(allocation[id] ?? 0) }));
  const issues: string[] = [];
  for (const id of Object.keys(allocation)) {
    if (!allowedIds.includes(id)) issues.push(`${id}: Unknown allocation bucket`);
  }
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

export function allocationWarnings(
  allocation: EfAllocation | null | undefined,
  customBuckets: readonly EfCustomBucket[] = [],
): { id: string; message: string }[] {
  const current = effectiveAllocation(allocation, customBuckets);
  const metadata = efBucketMetadata(customBuckets);
  const instant = metadata
    .filter(({ access }) => access === 'instant')
    .reduce((sum, { id }) => sum + current[id], 0);
  const market = metadata
    .filter(({ marketLinked }) => marketLinked)
    .reduce((sum, { id }) => sum + current[id], 0);
  const warnings: { id: string; message: string }[] = [];
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
