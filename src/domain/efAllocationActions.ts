import type { AppData } from './types';
import { effectiveAllocation, type EfAllocation, validateAllocation } from './efAllocation';

export class InvalidAllocationError extends Error {
  constructor(message = 'Emergency fund allocation must total 100%.') {
    super(message);
    this.name = 'InvalidAllocationError';
  }
}

export function setEfAllocation(data: AppData, allocation: EfAllocation): AppData {
  const check = validateAllocation(allocation, true);

  if (typeof check === 'object' && !check.valid) {
    throw new InvalidAllocationError(check.issues[0] ?? 'Emergency fund allocation must total 100%.');
  }

  if (!check) {
    throw new InvalidAllocationError();
  }

  return { ...data, efAllocation: effectiveAllocation(allocation) };
}

export function resetEfAllocation(data: AppData): AppData {
  return { ...data, efAllocation: null };
}
