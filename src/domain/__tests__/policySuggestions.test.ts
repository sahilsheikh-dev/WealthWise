import { emptyAppData } from '../actions';
import { suggestPolicyForTransaction } from '../policySuggestions';
import type { AppData, Policy, Transaction } from '../types';

const activePolicy: Policy = {
  id: 'health-policy',
  name: 'Health cover',
  insurer: 'Insurer',
  kind: 'health',
  premium: 600,
  frequency: 'monthly',
  startDate: '2026-01-01',
  status: 'active',
  premiumYears: 10,
  trackFrom: '2026-01-01',
  currentValue: null,
  valueAsOf: null,
  payments: [],
};

function transaction(changes: Partial<Transaction> = {}): Transaction {
  return {
    id: 'premium',
    type: 'expense',
    amount: 600,
    category: 'Health premium',
    note: 'Health policy premium',
    date: '2026-02-01',
    ...changes,
  };
}

function dataWithPolicies(...policies: Policy[]): AppData {
  return { ...emptyAppData('2026-02-01'), policies };
}

describe('suggestPolicyForTransaction', () => {
  it('suggests the sole active policy matching an unlinked typed premium', () => {
    expect(suggestPolicyForTransaction(dataWithPolicies(activePolicy), transaction()))
      .toBe(activePolicy);
  });

  it('returns no suggestion for non-expenses, linked entries, generic categories, or non-unique matches', () => {
    const data = dataWithPolicies(activePolicy);
    expect(suggestPolicyForTransaction(data, transaction({ type: 'income' }))).toBeNull();
    expect(suggestPolicyForTransaction(data, transaction({
      source: { kind: 'policy-payment', parentId: activePolicy.id, entryId: 'existing-payment' },
    }))).toBeNull();
    expect(suggestPolicyForTransaction(data, transaction({ category: 'Insurance premium' }))).toBeNull();
    expect(suggestPolicyForTransaction(dataWithPolicies(), transaction())).toBeNull();
    expect(suggestPolicyForTransaction(dataWithPolicies({
      ...activePolicy,
      status: 'lapsed',
    }), transaction())).toBeNull();
    expect(suggestPolicyForTransaction(dataWithPolicies(
      activePolicy,
      { ...activePolicy, id: 'second-health-policy' },
    ), transaction())).toBeNull();
  });
});
