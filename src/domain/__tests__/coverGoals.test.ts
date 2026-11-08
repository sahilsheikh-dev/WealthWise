import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { emptyAppData } from '../actions';
import {
  addCoverGoal,
  CoverGoalLimitError,
  DuplicateCoverGoalKindError,
  DuplicateCoverGoalNameError,
  coverGoalSummaries,
  defaultCoverGoals,
  deleteCoverGoal,
  InvalidCoverGoalTargetError,
  policiesBecomingUnassigned,
  policiesNotInCoverGoal,
  suggestPolicyForTransaction,
  updateCoverGoal,
} from '../coverGoals';
import { validateIntegrity } from '../links';
import { addPolicy, PolicyCoverGoalNotFoundError } from '../policyActions';
import type { AppData, CoverGoal, Policy, Transaction } from '../types';

const policy = (
  id: string,
  kind: Policy['kind'],
  changes: Partial<Policy> = {},
): Policy => ({
  id,
  name: `${kind} policy ${id}`,
  insurer: 'Insurer',
  kind,
  premium: 1_000,
  frequency: 'yearly',
  startDate: '2026-01-31',
  status: 'active',
  premiumYears: 10,
  trackFrom: '2026-01-31',
  currentValue: null,
  valueAsOf: null,
  payments: [],
  ...changes,
});

const customGoal = (id: string, changes: Partial<CoverGoal> = {}): CoverGoal => ({
  id,
  name: `Custom ${id}`,
  kind: null,
  target: { mode: 'none' },
  ...changes,
});

describe('editable insurance cover goals', () => {
  it('creates stable default goals with the existing target behavior', () => {
    expect(defaultCoverGoals()).toEqual([
      { id: 'cover-term-life', name: 'Term life', kind: 'term-life', target: { mode: 'income-multiple', value: 10 } },
      { id: 'cover-health', name: 'Health', kind: 'health', target: { mode: 'none' } },
      { id: 'cover-motor', name: 'Motor', kind: 'motor', target: { mode: 'active-only' } },
      { id: 'cover-home', name: 'Home', kind: 'home', target: { mode: 'active-only' } },
      { id: 'cover-other', name: 'Other', kind: 'other', target: { mode: 'active-only' } },
    ]);
  });

  it('applies explicit assignment before kind fallback and excludes inactive and savings policies', () => {
    const data: AppData = {
      ...emptyAppData('2026-10-15'),
      coverGoals: [
        ...defaultCoverGoals().filter((goal) => goal.id !== 'cover-other'),
        customGoal('custom'),
      ],
      policies: [
        policy('explicit', 'health', { coverGoalId: 'cover-term-life', sumAssured: 100 }),
        policy('fallback', 'health', { sumAssured: 200 }),
        policy('custom-explicit', 'motor', { coverGoalId: 'custom', sumAssured: 300 }),
        policy('inactive', 'health', { status: 'lapsed', sumAssured: 400 }),
        policy('savings', 'life-savings', { coverGoalId: 'cover-health', sumAssured: 500 }),
        policy('unassigned', 'other', { sumAssured: 600 }),
      ],
    };

    const summaries = coverGoalSummaries(data, '2026-10-15');
    expect(summaries.find((goal) => goal.id === 'cover-term-life')).toMatchObject({
      activePolicyIds: ['explicit'],
      currentCover: 100,
    });
    expect(summaries.find((goal) => goal.id === 'cover-health')).toMatchObject({
      activePolicyIds: ['fallback'],
      currentCover: 200,
    });
    expect(summaries.find((goal) => goal.id === 'custom')).toMatchObject({
      activePolicyIds: ['custom-explicit'],
      currentCover: 300,
    });
    expect(summaries.flatMap((goal) => goal.activePolicyIds)).toEqual([
      'explicit',
      'fallback',
      'custom-explicit',
    ]);
    expect(policiesNotInCoverGoal(data).map((item) => item.id)).toEqual(['savings', 'unassigned']);
  });

  it('preserves cover, premium and renewal summary states using user-managed targets', () => {
    const data: AppData = {
      ...emptyAppData('2026-10-15'),
      transactions: [
        { id: 'aug-income', type: 'income', amount: 100_000, category: 'Salary', note: '', date: '2026-08-01' },
        { id: 'sep-income', type: 'income', amount: 100_000, category: 'Salary', note: '', date: '2026-09-01' },
        { id: 'oct-income', type: 'income', amount: 100_000, category: 'Salary', note: '', date: '2026-10-01' },
      ],
      coverGoals: [
        { ...defaultCoverGoals()[0]!, target: { mode: 'income-multiple', value: 12 } },
        { ...defaultCoverGoals()[1]!, target: { mode: 'amount', value: 1_000_000 } },
        ...defaultCoverGoals().slice(2),
      ],
      policies: [
        policy('term', 'term-life', { sumAssured: 13_000_000 }),
        policy('health-a', 'health', { sumAssured: 250_000 }),
        policy('health-b', 'health', { sumAssured: 250_000 }),
        policy('motor', 'motor'),
        policy('other', 'other'),
        policy('lapsed-home', 'home', { status: 'lapsed', sumAssured: 2_000_000 }),
      ],
    };

    const summaries = coverGoalSummaries(data, '2026-10-15');
    expect(summaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'cover-term-life', target: 14_400_000, gap: 1_400_000, state: 'gap' }),
      expect.objectContaining({ id: 'cover-health', target: 1_000_000, currentCover: 500_000, gap: 500_000, state: 'gap' }),
      expect.objectContaining({ id: 'cover-motor', target: null, gap: null, state: 'covered', activePolicyIds: ['motor'] }),
      expect.objectContaining({ id: 'cover-home', currentCover: 0, activePolicyIds: [], state: 'missing' }),
      expect.objectContaining({ id: 'cover-other', target: null, gap: null, state: 'covered' }),
    ]));
    expect(summaries.find((item) => item.id === 'cover-health')?.yearlyPremium).toBe(2_000);
  });

  it('adds, edits and removes complete goal records without mutating input', () => {
    const initial = { ...emptyAppData('2026-10-15'), coverGoals: [] };
    const added = addCoverGoal(initial, customGoal('custom', {
      name: '  Travel protection  ',
      kind: null,
      target: { mode: 'amount', value: 50_000 },
    }));
    expect(added.coverGoals.at(-1)).toEqual({
      id: 'custom',
      name: 'Travel protection',
      kind: null,
      target: { mode: 'amount', value: 50_000 },
    });
    const updated = updateCoverGoal(added, {
      id: 'custom',
      name: 'Family protection',
      kind: 'health',
      target: { mode: 'income-multiple', value: 5 },
    });
    expect(updated.coverGoals.at(-1)).toEqual({
      id: 'custom',
      name: 'Family protection',
      kind: 'health',
      target: { mode: 'income-multiple', value: 5 },
    });
    expect(deleteCoverGoal(updated, 'custom').coverGoals).toEqual(initial.coverGoals);
    expect(emptyAppData('2026-10-15').coverGoals).toEqual(defaultCoverGoals());
  });

  it('returns typed errors for duplicate names, kinds, limit and invalid targets', () => {
    const data = emptyAppData('2026-10-15');
    expect(() => addCoverGoal(data, customGoal('duplicate-name', { name: ' hEaLtH ' })))
      .toThrow(DuplicateCoverGoalNameError);
    expect(() => addCoverGoal(data, customGoal('duplicate-kind', { kind: 'health' })))
      .toThrow(DuplicateCoverGoalKindError);
    const twentyGoals = Array.from({ length: 15 }, (_, index) => customGoal(`goal-${index}`))
      .reduce((current, goal) => addCoverGoal(current, goal), data);
    expect(twentyGoals.coverGoals).toHaveLength(20);
    expect(() => addCoverGoal(twentyGoals, customGoal('overflow'))).toThrow(CoverGoalLimitError);
    expect(() => addCoverGoal(data, customGoal('invalid', {
      target: { mode: 'income-multiple', value: 51 },
    }))).toThrow(InvalidCoverGoalTargetError);
    expect(() => addCoverGoal(data, customGoal('zero-income', {
      target: { mode: 'income-multiple', value: 0 },
    }))).toThrow(InvalidCoverGoalTargetError);
    expect(() => addCoverGoal(data, customGoal('negative-amount', {
      target: { mode: 'amount', value: -1 },
    }))).toThrow(InvalidCoverGoalTargetError);
    expect(() => addCoverGoal(data, customGoal('oversized-amount', {
      target: { mode: 'amount', value: 100_000_000_001 },
    }))).toThrow(InvalidCoverGoalTargetError);
    expect(() => updateCoverGoal(data, {
      ...defaultCoverGoals()[0]!,
      kind: 'health',
    })).toThrow(DuplicateCoverGoalKindError);
  });

  it('deletes a goal, clears its explicit policy assignments and preserves policies and transactions', () => {
    const originalPolicy = policy('assigned', 'motor', { coverGoalId: 'custom' });
    const inactiveSavingsPolicy = policy('inactive-savings', 'life-savings', {
      status: 'cancelled',
      coverGoalId: 'custom',
    });
    const transaction: Transaction = {
      id: 'premium',
      type: 'expense',
      amount: 1_000,
      category: 'Insurance',
      note: 'Premium',
      date: '2026-02-01',
    };
    const data: AppData = {
      ...emptyAppData('2026-10-15'),
      coverGoals: [...defaultCoverGoals(), customGoal('custom')],
      policies: [originalPolicy, inactiveSavingsPolicy],
      transactions: [transaction],
    };

    expect(policiesBecomingUnassigned(data, 'custom')).toBe(2);
    const deleted = deleteCoverGoal(data, 'custom');
    expect(deleted.coverGoals).toEqual(defaultCoverGoals());
    expect(deleted.policies).toEqual([
      { ...originalPolicy, coverGoalId: undefined },
      { ...inactiveSavingsPolicy, coverGoalId: undefined },
    ]);
    expect(deleted.transactions).toEqual([transaction]);
    expect(data.policies).toEqual([originalPolicy, inactiveSavingsPolicy]);
    expect(validateIntegrity(deleted)).toEqual([]);
  });

  it('rejects missing policy goal references and permits valid assignments', () => {
    const base = emptyAppData('2026-10-15');
    const invalid = {
      ...base,
      policies: [policy('bad-link', 'health', { coverGoalId: 'missing' })],
    };
    expect(validateIntegrity(invalid).map((issue) => issue.code)).toContain('missing-policy-cover-goal');
    expect(() => addPolicy(base, policy('bad-link', 'health', { coverGoalId: 'missing' })))
      .toThrow(PolicyCoverGoalNotFoundError);
    expect(addPolicy(base, policy('valid-link', 'health', { coverGoalId: 'cover-health' })).policies)
      .toHaveLength(1);
  });

  it('suggests a policy only for one active policy matching a typed premium category', () => {
    const active = policy('health-one', 'health');
    const transaction: Transaction = {
      id: 'manual-health',
      type: 'expense',
      amount: 1_000,
      category: 'Health premium',
      note: '',
      date: '2026-10-15',
    };
    const data = { ...emptyAppData('2026-10-15'), policies: [active] };
    expect(suggestPolicyForTransaction(data, transaction)).toEqual(active);
    expect(suggestPolicyForTransaction(data, {
      ...transaction,
      source: { kind: 'policy-payment', parentId: active.id, entryId: 'existing-payment' },
    })).toBeNull();
    expect(suggestPolicyForTransaction({
      ...data,
      policies: [active, policy('health-two', 'health')],
    }, transaction)).toBeNull();
    expect(suggestPolicyForTransaction({
      ...data,
      policies: [policy('health-lapsed', 'health', { status: 'lapsed' })],
    }, transaction)).toBeNull();
    expect(suggestPolicyForTransaction(data, { ...transaction, type: 'income' })).toBeNull();
    expect(suggestPolicyForTransaction(data, { ...transaction, category: 'Insurance premium' })).toBeNull();
  });

  it('keeps cover goals out of net worth, savings goals and Emergency Fund calculations', () => {
    const files = [
      'src/domain/summary.ts',
      'src/domain/goalLinks.ts',
      'src/domain/ef.ts',
      'src/domain/efAllocation.ts',
    ];
    for (const file of files) {
      expect(readFileSync(join(process.cwd(), file), 'utf8')).not.toContain('coverGoals');
    }
  });
});
