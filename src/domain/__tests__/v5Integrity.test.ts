import { describeSource, validateIntegrity } from '../links';
import { mockAppData } from '../../mock/data';
import type { AppData, OneTimeLiability } from '../types';

describe('schema v5 cross-record integrity', () => {
  it('accepts v5 mock data and matching insurance premium links', () => {
    const policy = mockAppData.policies[0];
    if (!policy) throw new Error('Expected mock savings policy.');
    const payment = { id: 'policy-payment-1', date: '2026-10-01', amount: 1_500, note: 'Annual premium' };
    const data: AppData = {
      ...mockAppData,
      policies: [{ ...policy, payments: [payment] }],
      transactions: [...mockAppData.transactions, {
        id: 'policy-transaction-1',
        type: 'expense',
        amount: payment.amount,
        category: 'Insurance',
        note: 'Future Builder premium',
        date: payment.date,
        source: { kind: 'policy-payment', parentId: policy.id, entryId: payment.id },
      }],
    };
    expect(validateIntegrity(data)).toEqual([]);
    expect(describeSource(data, {
      kind: 'policy-payment', parentId: policy.id, entryId: payment.id,
    })).toEqual({ label: policy.name, route: '/policy-payments', params: { id: policy.id } });
    expect(describeSource(data, {
      kind: 'policy-payment', parentId: policy.id, entryId: 'missing',
    })).toBeNull();
  });

  it('resolves and validates borrowed-origin source records', () => {
    const liability: OneTimeLiability = {
      id: 'origin',
      kind: 'one-time',
      name: 'Borrowed from Maya',
      type: 'Borrowed money',
      principal: 20_000,
      ratePct: 0,
      startDate: '2026-10-01',
      dueDate: null,
      payments: [],
    };
    const data: AppData = {
      ...mockAppData,
      liabilities: [...mockAppData.liabilities, liability],
      transactions: [...mockAppData.transactions, {
        id: 'origin-income',
        type: 'income',
        amount: liability.principal,
        category: 'Borrowed',
        note: 'Borrowed from Maya',
        date: liability.startDate,
        source: { kind: 'liability-origin', parentId: liability.id, entryId: liability.id },
      }],
    };
    expect(validateIntegrity(data)).toEqual([]);
    expect(describeSource(data, {
      kind: 'liability-origin', parentId: liability.id, entryId: liability.id,
    })).toEqual({ label: liability.name, route: '/liability-payments', params: { id: liability.id } });
    expect(describeSource(data, {
      kind: 'liability-origin', parentId: liability.id, entryId: 'other',
    })).toBeNull();
    expect(describeSource(data, {
      kind: 'liability-origin', parentId: 'missing', entryId: liability.id,
    })).toBeNull();
    const recurring = data.liabilities.find((entry) => entry.kind === 'recurring');
    if (!recurring) throw new Error('Expected recurring liability.');
    expect(describeSource(data, {
      kind: 'liability-origin', parentId: recurring.id, entryId: recurring.id,
    })).toEqual({ label: recurring.name, route: '/liability-payments', params: { id: recurring.id } });
  });

  it('reports multiple transactions linked to one policy payment', () => {
    const policy = mockAppData.policies[0];
    if (!policy) throw new Error('Expected mock savings policy.');
    const payment = { id: 'duplicate-policy-payment', date: '2026-10-01', amount: 1_500, note: '' };
    const source = { kind: 'policy-payment' as const, parentId: policy.id, entryId: payment.id };
    const data: AppData = {
      ...mockAppData,
      policies: [{ ...policy, payments: [payment] }],
      transactions: [...mockAppData.transactions,
        { id: 'policy-tx-1', type: 'expense', amount: 1_500, category: 'Insurance', note: '', date: payment.date, source },
        { id: 'policy-tx-2', type: 'expense', amount: 1_500, category: 'Insurance', note: '', date: payment.date, source },
      ],
    };
    expect(validateIntegrity(data).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'duplicate-source',
      'duplicate-linked-entry',
    ]));
  });

  it('rejects policy payment or borrowed-origin transactions that drift from their source', () => {
    const policy = mockAppData.policies[0];
    if (!policy) throw new Error('Expected mock savings policy.');
    const payment = { id: 'policy-payment-1', date: '2026-10-01', amount: 1_500, note: '' };
    const borrowed: OneTimeLiability = {
      id: 'borrowed-origin',
      kind: 'one-time',
      name: 'Borrowed from Maya',
      type: 'Borrowed money',
      principal: 20_000,
      ratePct: 0,
      startDate: '2026-10-01',
      dueDate: null,
      payments: [],
    };
    const data: AppData = {
      ...mockAppData,
      policies: [{ ...policy, payments: [payment] }],
      liabilities: [...mockAppData.liabilities, borrowed],
      transactions: [
        ...mockAppData.transactions,
        {
          id: 'policy-transaction-1',
          type: 'income',
          amount: 1_499,
          category: 'Other',
          note: '',
          date: '2026-10-02',
          source: { kind: 'policy-payment', parentId: policy.id, entryId: payment.id },
        },
        {
          id: 'borrowed-transaction-1',
          type: 'expense',
          amount: 20_000,
          category: 'Other',
          note: '',
          date: '2026-10-02',
          source: { kind: 'liability-origin', parentId: borrowed.id, entryId: borrowed.id },
        },
      ],
    };
    expect(validateIntegrity(data).filter((issue) => issue.code === 'linked-drift')).toHaveLength(2);
  });

  it('checks goal target existence, duplicates, total allocation, settlement dates and budget categories', () => {
    const recurring = mockAppData.liabilities.find((item) => item.kind === 'recurring');
    if (!recurring) throw new Error('Expected mock recurring liability.');
    const data: AppData = {
      ...mockAppData,
      policies: [...mockAppData.policies, {
        ...mockAppData.policies[0]!,
        id: 'policy-protection',
        name: 'Protection only',
        kind: 'term',
        currentValue: null,
        valueAsOf: null,
      }],
      goals: mockAppData.goals.map((goal) => goal.id === 'goal-farm' ? {
        ...goal,
        links: [
          { instrumentId: 'holding-sip', share: 80 },
          { instrumentId: 'holding-sip', share: 25 },
          { instrumentId: 'missing-asset', share: 1 },
        ],
      } : goal),
      liabilities: mockAppData.liabilities.map((item) => item.id === recurring.id ? {
        ...recurring,
        settlement: { asOf: '2026-03-31', balance: 100 },
      } : item),
      budget: { plannedIncome: 10_000, lines: [
        { category: 'Food', planned: 1_000 },
        { category: 'Food', planned: 2_000 },
        { category: 'Unknown', planned: 10 },
      ] },
    };
    const codes = validateIntegrity(data).map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      'missing-goal-link-target',
      'duplicate-goal-link',
      'settlement-before-start',
      'duplicate-budget-category',
      'invalid-budget-category',
    ]));
    expect(validateIntegrity({
      ...data,
      goals: data.goals.map((goal) => goal.id === 'goal-farm'
        ? { ...goal, links: [{ instrumentId: 'policy-protection', share: 1 }] }
        : goal),
    }).map((issue) => issue.code)).toContain('missing-goal-link-target');
  });
});
