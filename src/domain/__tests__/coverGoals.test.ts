import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { emptyAppData } from '../actions';
import {
  coverGoalSummaries,
  defaultCoverGoals,
  InvalidCoverGoalTargetError,
  setCoverGoalTarget,
  suggestPolicyForTransaction,
} from '../coverGoals';
import { validateIntegrity } from '../links';
import type { AppData, Policy, Transaction } from '../types';

const policy = (id: string, kind: Policy['kind'], changes: Partial<Policy> = {}): Policy => ({
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

describe('insurance cover goals', () => {
  it('creates separate defaults and summarizes covered, gap, no-target and missing states', () => {
    let data: AppData = {
      ...emptyAppData('2026-10-15'),
      transactions: [
        { id: 'aug-income', type: 'income' as const, amount: 100_000, category: 'Salary', note: '', date: '2026-08-01' },
        { id: 'sep-income', type: 'income' as const, amount: 100_000, category: 'Salary', note: '', date: '2026-09-01' },
        { id: 'oct-income', type: 'income' as const, amount: 100_000, category: 'Salary', note: '', date: '2026-10-01' },
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
    expect(data.coverGoals).toEqual(defaultCoverGoals());
    data = setCoverGoalTarget(data, { type: 'health', targetMode: 'amount', targetValue: 1_000_000 });
    data = setCoverGoalTarget(data, { type: 'other', targetMode: 'amount' });
    const summaries = coverGoalSummaries(data, '2026-10-15');
    expect(summaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'term-life', target: 12_000_000, gap: 0, state: 'covered' }),
      expect.objectContaining({ type: 'health', target: 1_000_000, currentCover: 500_000, gap: 500_000, state: 'gap' }),
      expect.objectContaining({ type: 'motor', target: null, gap: null, state: 'covered', activePolicyIds: ['motor'] }),
      expect.objectContaining({ type: 'home', currentCover: 0, activePolicyIds: [], state: 'missing' }),
      expect.objectContaining({ type: 'other', target: null, gap: null, state: 'no-target' }),
    ]));
    expect(summaries.find((item) => item.type === 'health')?.yearlyPremium).toBe(2_000);
  });

  it('returns no-target for unknown income and excludes inactive cover', () => {
    const data = {
      ...emptyAppData('2026-10-15'),
      policies: [
        policy('active-term', 'term-life', { sumAssured: 3_000_000 }),
        policy('inactive-term', 'term-life', { status: 'cancelled', sumAssured: 9_000_000 }),
      ],
    };
    const term = coverGoalSummaries(data, '2026-10-15').find((item) => item.type === 'term-life');
    expect(term).toMatchObject({
      target: null,
      currentCover: 3_000_000,
      gap: null,
      activePolicyIds: ['active-term'],
      state: 'no-target',
    });
  });

  it('validates target updates and rejects absent goals with typed errors', () => {
    const data = emptyAppData('2026-10-15');
    expect(() => setCoverGoalTarget(data, {
      type: 'term-life', targetMode: 'income-multiple', targetValue: 0.5,
    })).toThrow(InvalidCoverGoalTargetError);
    expect(() => setCoverGoalTarget(data, {
      type: 'term-life', targetMode: 'amount', targetValue: -1,
    })).toThrow(InvalidCoverGoalTargetError);
    expect(() => setCoverGoalTarget(data, {
      type: 'term-life', targetMode: 'active-only', targetValue: 1,
    })).toThrow(InvalidCoverGoalTargetError);
    expect(() => setCoverGoalTarget({
      ...data,
      coverGoals: data.coverGoals.filter((goal) => goal.type !== 'other'),
    }, { type: 'other', targetMode: 'active-only' })).toThrow(
      expect.objectContaining({ name: 'CoverGoalNotFoundError' }),
    );
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

  it('reports duplicate and missing cover types through integrity validation', () => {
    const data = emptyAppData('2026-10-15');
    const invalid = {
      ...data,
      coverGoals: [
        ...data.coverGoals.filter((goal) => goal.type !== 'other'),
        { type: 'home' as const, targetMode: 'active-only' as const },
      ],
    };
    expect(validateIntegrity(invalid).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'duplicate-cover-goal-type',
      'missing-cover-goal-type',
    ]));
  });
});
