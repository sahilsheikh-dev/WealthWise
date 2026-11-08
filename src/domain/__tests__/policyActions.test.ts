import { emptyAppData } from '../actions';
import { validateIntegrity } from '../links';
import {
  addPolicy,
  deletePolicy,
  DuplicatePolicyError,
  PolicyGoalLinkError,
  setPolicyStatus,
  updatePolicy,
} from '../policyActions';
import type { Policy } from '../types';

const policy: Policy = {
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
  payments: [{ id: 'payment', date: '2026-02-01', amount: 600, note: '' }],
};

describe('policyActions', () => {
  it('adds and updates policies while retaining their schedule and payment history', () => {
    const data = emptyAppData('2026-03-01');
    const added = addPolicy(data, policy);
    const otherPolicy = { ...policy, id: 'other-policy' };
    const withTransactions = {
      ...added,
      policies: [...added.policies, otherPolicy],
      transactions: [
        {
          id: 'linked',
          type: 'expense' as const,
          amount: 600,
          category: 'Insurance',
          note: 'Health cover premium',
          date: '2026-02-01',
          source: { kind: 'policy-payment' as const, parentId: policy.id, entryId: 'payment' },
        },
        {
          id: 'other-linked',
          type: 'expense' as const,
          amount: 600,
          category: 'Insurance',
          note: 'Health cover premium',
          date: '2026-02-01',
          source: { kind: 'policy-payment' as const, parentId: otherPolicy.id, entryId: 'payment' },
        },
        { id: 'plain', type: 'expense' as const, amount: 10, category: 'Food', note: '', date: '2026-02-01' },
      ],
    };
    const updated = updatePolicy(withTransactions, {
      id: policy.id,
      patch: { name: 'Family cover', insurer: 'New insurer', premium: 750, policyNumber: 'P-01' },
    });
    expect(updated.policies[0]).toEqual({
      ...policy,
      name: 'Family cover',
      insurer: 'New insurer',
      premium: 750,
      policyNumber: 'P-01',
    });
    expect(updated.transactions).toEqual([
      expect.objectContaining({ id: 'linked', note: 'Family cover premium' }),
      withTransactions.transactions[1],
      withTransactions.transactions[2],
    ]);
    const noNameChange = updatePolicy(updated, { id: policy.id, patch: { premium: 800 } });
    expect(noNameChange.transactions).toBe(updated.transactions);
    expect(noNameChange.policies[0]?.premium).toBe(800);
    expect(added.policies[0]).toEqual(policy);
    expect(data.policies).toEqual([]);
  });

  it('throws for duplicate and missing policy IDs', () => {
    expect(() => addPolicy({ ...emptyAppData('2026-03-01'), policies: [policy] }, policy))
      .toThrow(DuplicatePolicyError);
    expect(() => updatePolicy(emptyAppData('2026-03-01'), {
      id: 'missing', patch: { name: 'Missing' },
    })).toThrow('Policy with id "missing" was not found');
  });

  it('only allows linked policies to change to another goal-eligible kind', () => {
    const savings = { ...policy, kind: 'life-savings' as const, currentValue: 1_000, valueAsOf: '2026-02-01' };
    const empty = emptyAppData('2026-03-01');
    const data = {
      ...empty,
      policies: [savings],
      goals: [...empty.goals, {
        id: 'linked-goal', name: 'Home goal', target: 10_000, saved: 0, year: 2030,
        links: [{ instrumentId: savings.id }],
      }],
    };
    expect(updatePolicy(data, { id: savings.id, patch: { kind: 'ulip' } }).policies[0]?.kind).toBe('ulip');
    expect(updatePolicy(data, { id: savings.id, patch: { kind: 'life-savings' } })).toEqual(data);
    expect(() => updatePolicy(data, { id: savings.id, patch: { kind: 'health' } }))
      .toThrow(PolicyGoalLinkError);
    try {
      updatePolicy(data, { id: savings.id, patch: { kind: 'health' } });
    } catch (error) {
      expect(error).toBeInstanceOf(PolicyGoalLinkError);
      expect((error as PolicyGoalLinkError).goalNames).toEqual(['Home goal']);
    }
  });

  it('sets status and deletes a policy without deleting its insurance transaction', () => {
    const savings = { ...policy, kind: 'life-savings' as const, currentValue: 1_000, valueAsOf: '2026-02-01' };
    const otherPolicy = { ...policy, id: 'other-policy', payments: [
      { id: 'other-payment', date: '2026-02-01', amount: 50, note: '' },
    ] };
    const holding = {
      id: 'unrelated-holding',
      kind: 'manual' as const,
      name: 'Savings',
      type: 'Savings account' as const,
      invested: 500,
      value: 500,
      logs: [],
    };
    const empty = emptyAppData('2026-03-01');
    const data = {
      ...empty,
      holdings: [holding],
      policies: [savings, otherPolicy],
      goals: [...empty.goals.map((goal) => goal.auto === 'ef'
        ? { ...goal, links: [{ instrumentId: holding.id }] }
        : goal), {
        id: 'linked-goal', name: 'Home goal', target: 10_000, saved: 0, year: 2030,
        links: [{ instrumentId: savings.id }],
      }],
      transactions: [{
        id: 'linked-transaction',
        type: 'expense' as const,
        amount: 600,
        category: 'Insurance',
        note: 'Health cover premium',
        date: '2026-02-01',
        source: { kind: 'policy-payment' as const, parentId: savings.id, entryId: 'payment' },
      }, {
        id: 'unrelated-linked-transaction',
        type: 'expense' as const,
        amount: 50,
        category: 'Insurance',
        note: 'Another policy premium',
        date: '2026-02-01',
        source: { kind: 'policy-payment' as const, parentId: 'other-policy', entryId: 'other-payment' },
      }, {
        id: 'plain-transaction',
        type: 'expense' as const,
        amount: 10,
        category: 'Food',
        note: '',
        date: '2026-02-01',
      }],
      efBucketLinks: { cash: [savings.id, holding.id] },
    };
    const inactive = setPolicyStatus(data, { id: savings.id, status: 'lapsed' });
    expect(inactive.policies[0]?.status).toBe('lapsed');
    expect(setPolicyStatus(inactive, { id: savings.id, status: 'lapsed' })).toBe(inactive);
    const deleted = deletePolicy(data, { id: savings.id });
    expect(deleted.policies).toEqual([otherPolicy]);
    expect(deleted.transactions).toEqual([{
      id: 'linked-transaction',
      type: 'expense',
      amount: 600,
      category: 'Insurance',
      note: 'Health cover premium',
      date: '2026-02-01',
    }, {
      id: 'unrelated-linked-transaction',
      type: 'expense',
      amount: 50,
      category: 'Insurance',
      note: 'Another policy premium',
      date: '2026-02-01',
      source: { kind: 'policy-payment', parentId: 'other-policy', entryId: 'other-payment' },
    }, {
      id: 'plain-transaction',
      type: 'expense',
      amount: 10,
      category: 'Food',
      note: '',
      date: '2026-02-01',
    }]);
    expect(deleted.goals.find((goal) => goal.id === 'linked-goal')?.links).toEqual([]);
    expect(deleted.efBucketLinks).toEqual({ cash: [holding.id] });
    expect(validateIntegrity(deleted)).toEqual([]);
    expect(data.policies).toEqual([savings, otherPolicy]);
  });

  it('throws typed not-found errors for status changes and deletes', () => {
    const empty = emptyAppData('2026-03-01');
    expect(() => setPolicyStatus(empty, { id: 'missing', status: 'active' }))
      .toThrow('Policy with id "missing" was not found');
    expect(() => deletePolicy(empty, { id: 'missing' }))
      .toThrow('Policy with id "missing" was not found');
  });
});
