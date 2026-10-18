import { emptyAppData } from '../actions';
import { updatePolicy } from '../policyActions';
import type { Policy } from '../types';

const policy: Policy = {
  id: 'health-policy',
  name: 'Health cover',
  insurer: 'Insurer',
  kind: 'health',
  premium: 600,
  frequency: 'monthly',
  startDate: '2026-01-01',
  premiumYears: 10,
  trackFrom: '2026-01-01',
  coverAmount: 100_000,
  currentValue: null,
  valueAsOf: null,
  maturityDate: null,
  payments: [{ id: 'payment', date: '2026-02-01', amount: 600, note: '' }],
};

describe('policyActions', () => {
  it('updates editable policy details while retaining schedule and payment history', () => {
    const data = { ...emptyAppData('2026-03-01'), policies: [policy] };
    const updated = updatePolicy(data, policy.id, { name: 'Family cover', insurer: 'New insurer', premium: 750 });
    expect(updated.policies[0]).toEqual({
      ...policy,
      name: 'Family cover',
      insurer: 'New insurer',
      premium: 750,
    });
    expect(data.policies[0]).toEqual(policy);
  });

  it('throws for a missing policy', () => {
    expect(() => updatePolicy(emptyAppData('2026-03-01'), 'missing', { name: 'Missing' }))
      .toThrow('Policy with id "missing" was not found');
  });
});
