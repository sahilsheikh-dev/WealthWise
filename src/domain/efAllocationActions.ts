import { EF_BUCKET_META, EF_BUCKETS, effectiveAllocation, type EfAllocation, validateAllocation } from './efAllocation';
import type { AppData, EfCustomBucket } from './types';

export class InvalidAllocationError extends Error {
  constructor(message = 'Emergency fund allocation must total 100%.') {
    super(message);
    this.name = 'InvalidAllocationError';
  }
}

export class InvalidEfCustomBucketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEfCustomBucketError';
  }
}

const ACCESS_LEVELS = ['instant', 'days', 'slow'] as const;
const MAX_CUSTOM_BUCKETS = 8;
const MAX_LINKED_HOLDINGS = 10;

function normalizedName(name: string): string {
  return name.trim().toLowerCase();
}

function validateCustomBuckets(buckets: readonly EfCustomBucket[]): void {
  if (buckets.length > MAX_CUSTOM_BUCKETS) {
    throw new InvalidEfCustomBucketError('You can add up to 8 custom options.');
  }
  const names = new Set<string>(EF_BUCKETS.map((id) => normalizedName(EF_BUCKET_META[id].label)));
  const ids = new Set<string>(EF_BUCKETS);
  for (const bucket of buckets) {
    const name = bucket.name.trim();
    const normalized = normalizedName(name);
    if (name.length < 1 || name.length > 24) {
      throw new InvalidEfCustomBucketError('Custom option names must be 1 to 24 characters.');
    }
    if (names.has(normalized)) {
      throw new InvalidEfCustomBucketError('Custom option names must be unique and different from the fixed options.');
    }
    if (!ACCESS_LEVELS.includes(bucket.access)) {
      throw new InvalidEfCustomBucketError('Choose an access option.');
    }
    if (typeof bucket.marketLinked !== 'boolean') {
      throw new InvalidEfCustomBucketError('Choose whether this option is market-linked.');
    }
    if (!bucket.id || ids.has(bucket.id)) {
      throw new InvalidEfCustomBucketError('Custom option IDs must be unique.');
    }
    names.add(normalized);
    ids.add(bucket.id);
  }
}

function assertCustomBucket(data: AppData, bucketId: string): EfCustomBucket {
  const bucket = data.efCustomBuckets.find(({ id }) => id === bucketId);
  if (!bucket) throw new InvalidEfCustomBucketError('Custom emergency-fund option was not found.');
  return bucket;
}

function assertValidLinks(data: AppData, holdingIds: readonly string[]): void {
  if (holdingIds.length > MAX_LINKED_HOLDINGS) {
    throw new InvalidEfCustomBucketError('Link up to 10 investments per option.');
  }
  if (new Set(holdingIds).size !== holdingIds.length) {
    throw new InvalidEfCustomBucketError('An investment can only be linked once to an option.');
  }
  if (holdingIds.some((id) => !data.holdings.some((holding) => holding.id === id))) {
    throw new InvalidEfCustomBucketError('Every linked investment must exist.');
  }
}

export function setEfAllocation(data: AppData, allocation: EfAllocation): AppData {
  const check = validateAllocation(allocation, true, data.efCustomBuckets);

  if (typeof check === 'object' && !check.valid) {
    throw new InvalidAllocationError(check.issues[0] ?? 'Emergency fund allocation must total 100%.');
  }
  if (!check) throw new InvalidAllocationError();

  return { ...data, efAllocation: effectiveAllocation(allocation, data.efCustomBuckets) };
}

export function resetEfAllocation(data: AppData): AppData {
  return { ...data, efAllocation: null };
}

export function addEfCustomBucket(
  data: AppData,
  input: Omit<EfCustomBucket, 'id'>,
  newId: () => string,
): AppData {
  const bucket = { ...input, name: input.name.trim(), id: newId() };
  const efCustomBuckets = [...data.efCustomBuckets, bucket];
  validateCustomBuckets(efCustomBuckets);
  const efAllocation = data.efAllocation === null || data.efAllocation === undefined
    ? data.efAllocation
    : { ...data.efAllocation, [bucket.id]: 0 };
  return { ...data, efCustomBuckets, efAllocation };
}

export function renameEfCustomBucket(data: AppData, bucketId: string, name: string): AppData {
  assertCustomBucket(data, bucketId);
  const efCustomBuckets = data.efCustomBuckets.map((bucket) =>
    bucket.id === bucketId ? { ...bucket, name: name.trim() } : bucket,
  );
  validateCustomBuckets(efCustomBuckets);
  return { ...data, efCustomBuckets };
}

export function setEfCustomBucketAccess(
  data: AppData,
  bucketId: string,
  access: EfCustomBucket['access'],
): AppData {
  assertCustomBucket(data, bucketId);
  const efCustomBuckets = data.efCustomBuckets.map((bucket) =>
    bucket.id === bucketId ? { ...bucket, access } : bucket,
  );
  validateCustomBuckets(efCustomBuckets);
  return { ...data, efCustomBuckets };
}

export function deleteEfCustomBucket(
  data: AppData,
  bucketId: string,
  options: { moveTo?: string } = {},
): AppData {
  assertCustomBucket(data, bucketId);
  const amount = data.efAllocation?.[bucketId] ?? 0;
  if (amount > 0 && !options.moveTo) {
    throw new InvalidEfCustomBucketError('Move this option’s allocation before deleting it.');
  }
  const efAllocation = data.efAllocation ? { ...data.efAllocation } : null;
  if (efAllocation && options.moveTo) {
    const moveTarget = options.moveTo;
    const isKnownTarget = EF_BUCKETS.some((id) => id === moveTarget)
      || data.efCustomBuckets.some(({ id }) => id === moveTarget && id !== bucketId);
    if (!isKnownTarget || moveTarget === bucketId) {
      throw new InvalidEfCustomBucketError('Choose another existing option for the allocation.');
    }
    efAllocation[moveTarget] = (efAllocation[moveTarget] ?? 0) + amount;
  }
  if (efAllocation) delete efAllocation[bucketId];
  const efBucketLinks = { ...data.efBucketLinks };
  delete efBucketLinks[bucketId];
  return {
    ...data,
    efCustomBuckets: data.efCustomBuckets.filter(({ id }) => id !== bucketId),
    efAllocation,
    efBucketLinks,
  };
}

export function setEfBucketLinks(data: AppData, bucketId: string, holdingIds: string[]): AppData {
  const knownBucket = EF_BUCKETS.some((id) => id === bucketId)
    || data.efCustomBuckets.some(({ id }) => id === bucketId);
  if (!knownBucket) throw new InvalidEfCustomBucketError('Emergency-fund option was not found.');
  assertValidLinks(data, holdingIds);
  return {
    ...data,
    efBucketLinks: { ...data.efBucketLinks, [bucketId]: [...holdingIds] },
  };
}

export type EfPlanDraft = {
  customBuckets: EfCustomBucket[];
  allocation: EfAllocation;
  links: Record<string, string[]>;
};

export function saveEfPlan(
  data: AppData,
  plan: EfPlanDraft,
  newId: () => string,
): AppData {
  const existingIds = new Set(data.efCustomBuckets.map(({ id }) => id));
  const ids = new Map<string, string>();
  for (const bucket of plan.customBuckets) {
    ids.set(bucket.id, existingIds.has(bucket.id) ? bucket.id : newId());
  }
  const customBuckets = plan.customBuckets.map((bucket) => ({
    ...bucket,
    id: ids.get(bucket.id) ?? bucket.id,
    name: bucket.name.trim(),
  }));
  validateCustomBuckets(customBuckets);

  const allocation: EfAllocation = {};
  for (const [id, value] of Object.entries(plan.allocation)) {
    allocation[ids.get(id) ?? id] = value;
  }
  const allocationCheck = validateAllocation(allocation, true, customBuckets);
  if (typeof allocationCheck !== 'object' || !allocationCheck.valid) {
    throw new InvalidAllocationError(
      typeof allocationCheck === 'object'
        ? allocationCheck.issues[0] ?? 'Emergency fund allocation must total 100%.'
        : undefined,
    );
  }

  const links: Record<string, string[]> = {};
  for (const [id, holdingIds] of Object.entries(plan.links)) {
    const mappedId = ids.get(id) ?? id;
    const knownBucket = EF_BUCKETS.some((fixedId) => fixedId === mappedId)
      || customBuckets.some(({ id: customId }) => customId === mappedId);
    if (!knownBucket) throw new InvalidEfCustomBucketError('Emergency-fund option was not found.');
    assertValidLinks(data, holdingIds);
    links[mappedId] = [...holdingIds];
  }
  return {
    ...data,
    efCustomBuckets: customBuckets,
    efAllocation: allocation,
    efBucketLinks: links,
  };
}
