import { NotFoundError } from './actions';
import type { AppData, Policy } from './types';

export type PolicyPatch = Partial<Pick<Policy, 'name' | 'insurer' | 'premium'>>;

export function updatePolicy(data: AppData, id: string, patch: PolicyPatch): AppData {
  const current = data.policies.find((policy) => policy.id === id);
  if (!current) throw new NotFoundError('Policy', id);
  const updated = { ...current, ...patch };
  return {
    ...data,
    policies: data.policies.map((policy) => policy.id === id ? updated : policy),
  };
}
