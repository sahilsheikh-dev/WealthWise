import {
  migratePersisted,
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV5ToV6,
  migrateV6ToV7,
  migrateV7ToV8,
  migrateV8ToV9,
  migrateV9ToV10,
  migrateV10ToV11,
  migrateV11ToV12,
  migrateV12ToV13,
  migrateV13ToV14,
  migrateV14ToV15,
  migrateV15ToV16,
  migrateV16ToV17,
  migrateV17ToV18,
  migrateV18ToV19,
  migrateV19ToV20,
  migrateV20ToV21,
  migrateV21ToV22,
  PersistedVersionError,
} from '../migrate';
import { makeV1Fixture, makeV2Fixture, makeV5Fixture, makeV6Fixture } from '../testFixtures/v1';
import { makeV9Fixture } from '../testFixtures/v9';
import { makeV10Fixture } from '../testFixtures/v10';
import { makeV11Fixture } from '../testFixtures/v11';
import { makeV12Fixture } from '../testFixtures/v12';
import { validateImportData } from '../../domain/backup';
import { netWorth } from '../../domain/summary';
import { goalSavedFor } from '../../domain/goalLinks';
import { holdingValue } from '../../domain/portfolio';
import { BUDGET_GROUPS } from '../../domain/budget';
import { mockAppData } from '../../mock/data';
import type { AppData } from '../../domain/types';

describe('schema migration', () => {
  it('migrates a v1 database to the exact v2 shape', () => {
    const v1 = makeV1Fixture();
    const legacyPlan = v1.holdings.find((holding) => holding.kind === 'plan')!;
    const expected = {
      settings: v1.settings,
      transactions: [
        { ...v1.transactions[0]!, source: { ...v1.transactions[0]!.source!, kind: 'holding-entry' } },
        { ...v1.transactions[1]!, source: { ...v1.transactions[1]!.source!, kind: 'liability-payment' } },
        v1.transactions[2],
      ],
      goals: v1.goals,
      holdings: [
        { ...v1.holdings[0], logs: [] },
        { ...legacyPlan, logs: [{ ...legacyPlan.logs[0]!, kind: 'Deposit' }] },
      ],
      liabilities: [{
        ...v1.loans[0]!,
        kind: 'recurring',
        type: 'Other',
        payments: [{ ...v1.loans[0]!.payments[0]!, kind: 'EMI' }],
      }],
      efEntries: v1.efEntries,
    };
    expect(migrateV1ToV2(v1)).toEqual(expected);
    const migrated = migratePersisted({ data: v1 }, 1, { today: '2026-10-10', newId: () => 'migrated-ef' }) as { data: Record<string, unknown> };
    expect(migrated.data).not.toHaveProperty('efEntries');
    expect(migrated.data.holdings).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'migrated-ef', name: 'Emergency fund (migrated)', invested: 500, value: 500 }),
    ]));
    expect(migrated.data.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'legacy-ef-tx', type: 'invest', category: 'Other investments' }),
    ]));
  });

  it('upgrades v2 settings and detects onboarded only for non-empty user data', () => {
    const v2 = makeV2Fixture();
    const expected = {
      ...v2,
      settings: { ...v2.settings, monthlySalary: null, onboarded: true },
    };
    expect(migrateV2ToV3(v2)).toEqual(expected);
    expect(migrateV2ToV3(v2)).not.toHaveProperty('efAllocation');
    const migrated = migratePersisted({ data: v2 }, 2, { today: '2026-10-10', newId: () => 'migrated-v2-fund' }) as { data: Record<string, unknown> };
    expect(migrated.data).not.toHaveProperty('efEntries');
    expect(migrated.data).toMatchObject({
      settings: { monthlySalary: null, onboarded: true },
      efAllocation: null,
      efCustomBuckets: [],
      efBucketLinks: {},
    });
    const validated = validateImportData(migrated.data);
    if (!validated.ok) throw new Error('Expected the v2 migration fixture to validate.');
    const empty = {
      ...v2,
      settings: { ...v2.settings, name: '' },
      transactions: [],
      goals: v2.goals.filter((goal) => goal.auto === 'ef'),
      holdings: [],
      liabilities: [],
      efEntries: [],
    };
    expect(migrateV2ToV3(empty)).toMatchObject({ settings: { onboarded: false, monthlySalary: null } });
    expect(migrateV2ToV3({ ...empty, settings: { ...empty.settings, name: 'Only name' } }))
      .toMatchObject({ settings: { onboarded: true } });
    expect(migrateV2ToV3({ ...empty, transactions: [v2.transactions[0]] }))
      .toMatchObject({ settings: { onboarded: true } });
    expect(migrateV2ToV3({ ...empty, holdings: [v2.holdings[0]] }))
      .toMatchObject({ settings: { onboarded: true } });
    expect(migrateV2ToV3({ ...empty, liabilities: [v2.liabilities[0]] }))
      .toMatchObject({ settings: { onboarded: true } });
    expect(migrateV2ToV3({
      ...empty,
      goals: [{ id: 'goal', name: 'Goal', target: 100, saved: 0, year: 2028 }],
    })).toMatchObject({ settings: { onboarded: true } });
  });

  it('rejects invalid input and unknown or future versions', () => {
    const v2 = migrateV1ToV2(makeV1Fixture());
    expect(() => migrateV1ToV2(v2)).toThrow(PersistedVersionError);
    expect(() => migrateV2ToV3({ settings: {}, transactions: 'bad', goals: [], holdings: [], liabilities: [], efEntries: [] } as any)).toThrow(PersistedVersionError);
    expect(() => migratePersisted({}, 0)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'unknown-version' }),
    );
    expect(() => migratePersisted({ foo: 'bar' }, 3)).toThrow(PersistedVersionError);
    expect(() => migratePersisted({}, 24)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
    expect(() => migratePersisted({}, -1)).toThrow(PersistedVersionError);
  });

  it('rejects malformed v1 and v6 records and preserves unknown v1 transaction shapes', () => {
    const v1 = makeV1Fixture();
    expect(() => migrateV1ToV2(null)).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({ ...v1, loans: null })).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({ ...v1, holdings: null })).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({ ...v1, transactions: null })).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({ ...v1, liabilities: [] })).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({ ...v1, holdings: [null] })).toThrow(PersistedVersionError);
    expect(() => migrateV1ToV2({
      ...v1,
      loans: [{ ...v1.loans[0]!, payments: [null] }],
    })).toThrow(PersistedVersionError);
    const unknownShape = { id: 'legacy-plain', type: 'income', amount: 1, category: 'Other' };
    expect(migrateV1ToV2({
      ...v1,
      holdings: [{ kind: 'plan' }, { kind: 'plan', logs: [null] }],
      transactions: [unknownShape, { ...unknownShape, source: 'unknown' }, {
        ...unknownShape, source: { kind: 'unmapped', parentId: 'x', entryId: 'y' },
      }],
    })).toEqual({
      settings: v1.settings,
      holdings: [{ kind: 'plan' }, { kind: 'plan', logs: [null] }],
      liabilities: v1.loans.map((loan) => ({
        ...loan,
        kind: 'recurring',
        type: 'Other',
        payments: loan.payments.map((payment) => ({ ...payment, kind: 'EMI' })),
      })),
      transactions: [
        unknownShape,
        { ...unknownShape, source: 'unknown' },
        { ...unknownShape, source: { kind: 'unmapped', parentId: 'x', entryId: 'y' } },
      ],
      goals: v1.goals,
      efEntries: v1.efEntries,
    });

    const v6 = makeV6Fixture();
    const options = { today: '2026-10-10', newId: () => 'migrated-fund' };
    expect(() => migrateV6ToV7(null, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, efEntries: null }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, holdings: null }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, goals: null }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, transactions: null }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, efEntries: [null] }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, goals: [null] }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV6ToV7({ ...v6, transactions: [null] }, options)).toThrow(PersistedVersionError);
    expect(() => migrateV3ToV4({ settings: {}, transactions: [], goals: [], holdings: [], liabilities: [] }))
      .toThrow(PersistedVersionError);
  });

  it('passes the current persisted schema through unchanged', () => {
    const persisted = { data: { version13: true } };
    expect(migratePersisted(persisted, 23)).toBe(persisted);
  });

  it('preserves v22 financial records unchanged through the v23 migration', () => {
    const holding = mockAppData.holdings[0];
    const liability = mockAppData.liabilities[0];
    if (!holding || !liability) throw new Error('Migration fixtures are incomplete.');
    const data = {
      ...mockAppData,
      holdings: mockAppData.holdings.map((item) => item.id === holding.id
        ? { ...item, type: 'Custom' as const, customTypeName: 'Vintage books' }
        : item),
      liabilities: mockAppData.liabilities.map((item) => item.id === liability.id
        ? { ...item, type: 'Custom' as const, customTypeName: 'Family loan' }
        : item),
    };

    expect(migratePersisted({ data }, 22)).toEqual({ data });
  });

  it('migrates v18 to v19 without changing any persisted holding values', () => {
    const data = mockAppData;
    expect(migrateV18ToV19(data)).toBe(data);
    expect(migratePersisted({ data }, 18)).toEqual({ data: migrateV21ToV22(data) });
    expect(() => migratePersisted({}, 24)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
  });

  it('migrates v19 to v20 without adding closure metadata to existing liabilities', () => {
    const data = mockAppData;
    expect(migrateV19ToV20(data)).toBe(data);
    expect(migratePersisted({ data }, 19)).toEqual({ data: migrateV21ToV22(data) });
  });

  it('migrates v20 to v21 without changing recurring-plan or holding values', () => {
    const data = mockAppData;
    expect(migrateV20ToV21(data)).toBe(data);
    expect(migratePersisted({ data }, 20)).toEqual({ data: migrateV21ToV22(data) });
  });

  it('migrates v21 income items to monthly recurrence', () => {
    const data = {
      ...mockAppData,
      budgetPlan: mockAppData.budgetPlan && {
        ...mockAppData.budgetPlan,
        incomes: mockAppData.budgetPlan.incomes.map((income) => ({ ...income })),
      },
      monthBudgets: mockAppData.monthBudgets?.map((budget) => ({
        ...budget,
        incomes: budget.incomes.map((income) => ({ ...income })),
      })),
    };
    const migrated = migrateV21ToV22(data);
    expect(migratePersisted({ data }, 21)).toEqual({ data: migrated });
    const migratedRecord = migrated as Record<string, unknown>;
    const plan = migratedRecord.budgetPlan as { incomes: Record<string, unknown>[] } | null;
    expect(plan?.incomes.every((income) => income.frequency === 'monthly' && income.firstDueMonth === undefined)).toBe(true);
  });

  it('migrates v13 to v14 without changing any persisted fields', () => {
    const data = {
      ...mockAppData,
      budgetPlan: mockAppData.budgetPlan && {
        ...mockAppData.budgetPlan,
        items: mockAppData.budgetPlan.items.map((item) => ({ ...item })),
      },
    };
    expect(migrateV13ToV14(data)).toEqual(data);
    expect(migratePersisted({ data }, 13, { today: '2026-11-04', newId: () => 'unused' }))
      .toEqual({ data: migrateV21ToV22(data) });
  });

  it('adds monthly recurrence to v12 plan and snapshot items without changing other fields', () => {
    const legacy = makeV12Fixture();
    const expected = {
      ...legacy,
      budgetPlan: legacy.budgetPlan && {
        ...legacy.budgetPlan,
        items: legacy.budgetPlan.items.map((item) => ({ ...item, frequency: 'monthly' })),
      },
      monthBudgets: legacy.monthBudgets?.map((budget) => ({
        ...budget,
        items: budget.items.map((item) => ({ ...item, frequency: 'monthly' })),
      })),
    };
    expect(migrateV12ToV13(legacy)).toEqual(expected);
    expect(() => migrateV12ToV13(null)).toThrow(PersistedVersionError);
    expect(migrateV12ToV13({
      settings: {},
      budgetPlan: { items: 'malformed', retained: true },
      monthBudgets: [{ items: [null] }],
    })).toEqual({
      settings: {},
      budgetPlan: { items: 'malformed', retained: true },
      monthBudgets: [{ items: [null] }],
    });
    expect(migratePersisted({ data: legacy }, 12, { today: '2026-11-04', newId: () => 'unused' })).toMatchObject({
      data: { budgetPlan: { items: expect.arrayContaining([expect.objectContaining({ frequency: 'monthly' })]) } },
    });
    expect(() => migratePersisted({}, 24)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
  });

  it('seeds legacy v12 cover goals before the v17 migration removes them', () => {
    const legacy = makeV11Fixture();
    expect(migrateV11ToV12(legacy)).toEqual({
      ...legacy,
      coverGoals: [
        { type: 'term-life', targetMode: 'income-multiple', targetValue: 10 },
        { type: 'health', targetMode: 'amount' },
        { type: 'motor', targetMode: 'active-only' },
        { type: 'home', targetMode: 'active-only' },
        { type: 'other', targetMode: 'active-only' },
      ],
    });

    expect(() => migrateV11ToV12(null)).toThrow(PersistedVersionError);
    const migrated = migratePersisted({ data: legacy }, 11, {
      today: '2026-11-04',
      newId: () => 'unused',
    }) as { data: Record<string, unknown> };
    expect(migrated.data).not.toHaveProperty('coverGoals');
  });

  it('migrates v14 cover-goal bytes through v15, then removes the superseded data in v17', () => {
    const legacy = {
      ...mockAppData,
      coverGoals: [
        { type: 'term-life', targetMode: 'income-multiple', targetValue: 12 },
        { type: 'health', targetMode: 'amount', targetValue: 900_000 },
        { type: 'motor', targetMode: 'active-only' },
        { type: 'home', targetMode: 'active-only' },
        { type: 'other', targetMode: 'active-only' },
      ],
    };
    const expected = {
      ...legacy,
      coverGoals: [
        { id: 'cover-term-life', name: 'Term life', kind: 'term-life', target: { mode: 'income-multiple', value: 12 } },
        { id: 'cover-health', name: 'Health', kind: 'health', target: { mode: 'amount', value: 900_000 } },
        { id: 'cover-motor', name: 'Motor', kind: 'motor', target: { mode: 'active-only' } },
        { id: 'cover-home', name: 'Home', kind: 'home', target: { mode: 'active-only' } },
        { id: 'cover-other', name: 'Other', kind: 'other', target: { mode: 'active-only' } },
      ],
    };
    expect(migrateV14ToV15(legacy)).toEqual(expected);
    const { coverGoals: _coverGoals, ...currentData } = expected;
    expect(migratePersisted({ data: legacy }, 14, {
      today: '2026-11-04',
      newId: () => 'unused',
    })).toEqual({ data: migrateV21ToV22(currentData) });
    expect(legacy.coverGoals[0]).toEqual({
      type: 'term-life', targetMode: 'income-multiple', targetValue: 12,
    });
  });

  it('splits legacy combined FD/RD holdings by entries and schedule without changing other data', () => {
      const data = {
        ...mockAppData,
        holdings: [
          {
            id: 'combined-empty',
            kind: 'manual',
            name: 'Unstarted deposit',
            type: 'FD / RD',
            invested: 1_000,
            value: 1_000,
            logs: [],
          },
          {
            id: 'combined-entry',
            kind: 'manual',
            name: 'Deposited monthly',
            type: 'Fixed deposit / RD',
            invested: 1_000,
            value: 1_100,
            logs: [{ id: 'old-entry', date: '2026-10-01', amount: 100, note: 'kept', kind: 'Deposit' }],
          },
          {
            id: 'combined-schedule',
            kind: 'plan',
            name: 'Scheduled deposit',
            type: 'FD / RD',
            frequency: 'monthly',
            logs: [],
          },
          {
            id: 'already-fixed-plan',
            kind: 'plan',
            name: 'Scheduled fixed',
            type: 'Fixed deposit',
            frequency: 'monthly',
            logs: [],
          },
          {
            id: 'already-fixed',
            kind: 'manual',
            name: 'Already fixed',
            type: 'Fixed deposit',
            invested: 500,
            value: 550,
            logs: [{ id: 'legacy-fixed-entry', date: '2026-10-02', amount: 50, note: 'preserve', kind: 'Withdrawal' }],
          },
          {
            id: 'already-fixed-linked',
            kind: 'manual',
            name: 'Fixed deposit with a Budget schedule',
            type: 'Fixed deposit',
            invested: 500,
            value: 550,
            logs: [],
          },
          {
            id: 'already-recurring',
            kind: 'plan',
            name: 'Already recurring',
            type: 'Recurring deposit',
            frequency: 'monthly',
            logs: [],
          },
        ],
        budgetPlan: { items: [{ id: 'budget-item', holdingId: 'already-fixed-linked' }] },
      };
      const originalHoldings = data.holdings;
      const migrated = migrateV15ToV16(data) as typeof data;
      expect(migrated.holdings.map(({ id, type }) => ({ id, type }))).toEqual([
        { id: 'combined-empty', type: 'Fixed deposit' },
        { id: 'combined-entry', type: 'Recurring deposit' },
        { id: 'combined-schedule', type: 'Recurring deposit' },
        { id: 'already-fixed-plan', type: 'Recurring deposit' },
        { id: 'already-fixed', type: 'Fixed deposit' },
        { id: 'already-fixed-linked', type: 'Recurring deposit' },
        { id: 'already-recurring', type: 'Recurring deposit' },
      ]);
      expect(migrated.holdings[1]?.logs).toEqual(data.holdings[1]?.logs);
      expect(migrated.holdings[3]?.logs).toEqual(data.holdings[3]?.logs);
      expect(migrated.budgetPlan).toEqual(data.budgetPlan);
      expect(migrated).toMatchObject({ transactions: data.transactions, goals: data.goals, efBucketLinks: data.efBucketLinks });
      expect(data.holdings).toBe(originalHoldings);
      expect(migratePersisted({ data }, 15, {
        today: '2026-11-04',
        newId: () => 'unused',
      })).toEqual({ data: migrateV21ToV22(migrated) });
  });

  it('leaves already-separated v15 holdings and malformed non-data inputs unchanged', () => {
    const alreadySeparated = {
      holdings: [{ id: 'fixed', type: 'Fixed deposit' }, { id: 'recurring', type: 'Recurring deposit' }],
    };
    expect(migrateV15ToV16(alreadySeparated)).toBe(alreadySeparated);
    expect(migrateV15ToV16({ holdings: null })).toEqual({ holdings: null });
    expect(migrateV15ToV16(null)).toBeNull();
  });

  it('removes only cover goals and policy assignments when migrating v16 to v17', () => {
    const data = {
      ...mockAppData,
      coverGoals: [{ id: 'legacy-cover', name: 'Legacy', kind: 'health', target: { mode: 'none' } }],
      policies: mockAppData.policies.map((policy) => ({ ...policy, coverGoalId: 'legacy-cover' })),
    };
    const migrated = migrateV16ToV17(data) as Record<string, unknown>;
    const { coverGoals: _coverGoals, ...withoutGoals } = data;
    expect(migrated).toEqual({
      ...withoutGoals,
      policies: data.policies.map(({ coverGoalId: _coverGoalId, ...policy }) => policy),
    });
    expect(migratePersisted({ data }, 16, { today: '2026-11-04', newId: () => 'unused' }))
      .toEqual({ data: migrateV21ToV22(migrated) });
    expect(() => migratePersisted(data, 24)).toThrow(
      new PersistedVersionError(24, 'future-version'),
    );
  });

  it('adds dueDate only to payments matched by the v17 FIFO schedule', () => {
    const policy = {
      ...mockAppData.policies[0],
      frequency: 'monthly' as const,
      trackFrom: '2026-11-07',
      endDate: '2026-12-31',
      payments: [
        { id: 'before-tracking', date: '2026-11-06', amount: 500, note: '' },
        { id: 'first-slot', date: '2026-11-08', amount: 500, note: '' },
        { id: 'second-slot', date: '2026-12-10', amount: 500, note: '' },
        { id: 'unmatched', date: '2026-12-11', amount: 500, note: '' },
      ],
    };
    if (!policy) throw new Error('Expected the policy migration fixture.');
    const legacy = { ...mockAppData, policies: [policy] };
    const migrated = migrateV17ToV18(legacy, { today: '2026-12-15' }) as typeof legacy;
    expect(migrated.policies[0]?.payments).toEqual([
      { id: 'before-tracking', date: '2026-11-06', amount: 500, note: '' },
      { id: 'first-slot', date: '2026-11-08', amount: 500, note: '', dueDate: '2026-11-07' },
      { id: 'second-slot', date: '2026-12-10', amount: 500, note: '', dueDate: '2026-12-07' },
      { id: 'unmatched', date: '2026-12-11', amount: 500, note: '' },
    ]);
    expect(migratePersisted({ data: legacy }, 17, {
      today: '2026-12-15',
      newId: () => 'unused',
    })).toEqual({ data: migrateV21ToV22(migrated) });
    expect(() => migrateV17ToV18({ policies: [null] }, { today: '2026-12-15' }))
      .toThrow(new PersistedVersionError(17, 'unknown-version'));
  });

  it('moves legacy manual Insurance items into the current Insurance system section', () => {
    const legacy = makeV11Fixture();
    const insuranceItem = {
      id: 'legacy-insurance',
      sectionId: 'survival',
      name: 'Insurance',
      mode: 'amount',
      value: 200,
    };
    const migrated = migrateV11ToV12({
      ...legacy,
      budgetPlan: {
        sections: [
          { id: 'survival', name: 'Needs', type: 'spend' },
          { id: 'insurance', name: 'Legacy section', type: 'invest' },
        ],
        items: [insuranceItem],
      },
      monthBudgets: [{
        month: '2026-10',
        sections: [{ id: 'survival', name: 'Needs', type: 'spend' }],
        items: [insuranceItem],
      }],
    });
    expect(migrated).toMatchObject({
      budgetPlan: {
        sections: [
          { id: 'survival', name: 'Needs', type: 'spend' },
          { id: 'insurance', name: 'Insurance', type: 'spend', system: 'insurance' },
        ],
        items: [{ ...insuranceItem, sectionId: 'insurance' }],
      },
      monthBudgets: [{
        sections: expect.arrayContaining([
          { id: 'insurance', name: 'Insurance', type: 'spend', system: 'insurance' },
        ]),
        items: [{ ...insuranceItem, sectionId: 'insurance' }],
      }],
    });

    const malformedBudget = { sections: [], items: null, preserved: true };
    expect(migrateV11ToV12({
      ...legacy,
      budgetPlan: malformedBudget,
      monthBudgets: 'not-an-array',
    })).toMatchObject({
      budgetPlan: malformedBudget,
      monthBudgets: 'not-an-array',
    });
  });

  it('migrates v10 policy kinds, status, metadata, date fallbacks and legacy frequency', () => {
    const policy = makeV10Fixture().policies[0];
    if (!policy) throw new Error('Expected a v10 policy fixture.');
    const migrated = migrateV10ToV11({
      policies: [
        { ...policy, id: 'term', kind: 'term', frequency: 'single', premiumYears: null },
        { ...policy, id: 'motor', kind: 'vehicle', frequency: 'quarterly' },
        {
          ...policy,
          id: 'payment-start',
          kind: 'health',
          startDate: undefined,
          trackFrom: undefined,
          frequency: undefined,
          premiumYears: undefined,
          payments: [{ id: 'paid', date: '2021-04-06', amount: 2, note: '' }],
        },
        {
          ...policy,
          id: 'today-start',
          kind: 'other',
          startDate: undefined,
          trackFrom: undefined,
          frequency: undefined,
          premiumYears: undefined,
          payments: [],
          coverAmount: null,
          maturityDate: null,
        },
      ],
    }, { today: '2026-10-10' }) as { policies: Record<string, unknown>[] };
    expect(migrated.policies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'term', kind: 'term-life', frequency: 'yearly', premiumYears: 1, status: 'active',
        sumAssured: policy.coverAmount, endDate: policy.maturityDate,
      }),
      expect.objectContaining({ id: 'motor', kind: 'motor', frequency: 'quarterly', status: 'active' }),
      expect.objectContaining({
        id: 'payment-start', startDate: '2021-04-06', trackFrom: '2021-04-06',
        frequency: 'yearly', premiumYears: 1, status: 'active',
      }),
      expect.objectContaining({
        id: 'today-start', startDate: '2026-10-10', trackFrom: '2026-10-10',
        frequency: 'yearly', premiumYears: 1, status: 'active',
      }),
    ]));
    const migratedTerm = migrated.policies.find((item) => item.id === 'term');
    expect(migratedTerm).not.toHaveProperty('coverAmount');
    expect(migratedTerm).not.toHaveProperty('maturityDate');
    expect(migratedTerm).not.toHaveProperty('policyNumber');
    expect(migratedTerm).not.toHaveProperty('nominee');
    expect(migratedTerm).not.toHaveProperty('note');
  });

  it('rejects malformed v10 policy data', () => {
    expect(() => migrateV10ToV11(null, { today: '2026-10-10' })).toThrow(PersistedVersionError);
    expect(() => migrateV10ToV11({ policies: null }, { today: '2026-10-10' })).toThrow(PersistedVersionError);
    expect(() => migrateV10ToV11({ policies: [null] }, { today: '2026-10-10' })).toThrow(PersistedVersionError);
    expect(() => migrateV10ToV11({ policies: [{ payments: [null] }] }, { today: '2026-10-10' }))
      .toThrow(PersistedVersionError);
  });

  it('migrates v9 plan lines and snapshots into section items with unmapped items in Survival', () => {
    const legacy = makeV9Fixture({
      ...mockAppData,
      budgetPlan: {
        ...mockAppData.budgetPlan!,
        items: [
          { id: 'food-item', sectionId: 'survival', name: 'Food', mode: 'percent', value: 10 },
          { id: 'custom-item', sectionId: 'survival', name: 'Domestic help', mode: 'amount', value: 1_000 },
        ],
      },
      monthBudgets: [{
        month: '2026-10',
        source: 'custom',
        incomes: [],
        sections: mockAppData.budgetPlan!.sections,
        items: [
          { id: 'snapshot-food', sectionId: 'survival', name: 'Food', mode: 'amount', value: 2_000 },
          { id: 'snapshot-custom', sectionId: 'survival', name: 'Pet care', mode: 'amount', value: 500 },
        ],
      }],
    });
    let nextId = 0;
    const migrated = migrateV9ToV10(legacy, {
      today: '2026-10-18',
      newId: () => `new-item-${++nextId}`,
    }) as AppData;
    expect(migrated.budgetPlan?.sections.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['survival', 'savings-investments', 'wants', 'festival-donations-culture', 'unexpected-extras']),
    );
    expect(migrated.budgetPlan?.items).toEqual([
      expect.objectContaining({ id: 'new-item-1', sectionId: 'survival', name: 'Food', mode: 'percent', value: 10 }),
      expect.objectContaining({ id: 'new-item-2', sectionId: 'survival', name: 'Domestic help', mode: 'amount', value: 1_000 }),
    ]);
    expect(migrated.monthBudgets?.[0]?.items).toEqual([
      expect.objectContaining({ id: 'v10-2026-10-0', sectionId: 'survival', name: 'Food', value: 2_000 }),
      expect.objectContaining({ id: 'v10-2026-10-1', sectionId: 'survival', name: 'Pet care', value: 500 }),
    ]);
    expect(migrated.monthBudgets?.[0]).not.toHaveProperty('lines');
  });

  it('migrates v7 snapshots and selects the plan by default, usage and recency', () => {
    const makeLegacy = (defaultId: string | null) => ({
      ...mockAppData,
      budgetPlan: undefined,
      budgetTemplates: [
        { id: 'first', name: 'First', plannedIncome: 10_000, lines: [
          { category: 'Food', mode: 'amount', value: 100 },
          { category: 'EMI', mode: 'amount', value: 500 },
          { category: 'Insurance', mode: 'amount', value: 200 },
        ] },
        { id: 'used', name: 'Used', plannedIncome: 20_000, lines: [
          { category: 'Bills', mode: 'amount', value: 250, dueDay: 31 },
        ] },
        { id: 'latest', name: 'Latest', plannedIncome: 30_000, lines: [
          { category: 'Food', mode: 'percent', value: 20 },
        ] },
      ],
      defaultBudgetTemplateId: defaultId,
      monthBudgets: [
        { month: '2026-01', templateId: 'used', templateName: 'Used', customized: false, plannedIncome: 20_000, linkedIncluded: true, lines: [{ category: 'Bills', planned: 250, dueDay: 31 }] },
        { month: '2026-02', templateId: 'used', templateName: 'Used', customized: true, plannedIncome: 20_000, linkedIncluded: true, lines: [{ category: 'Bills', planned: 300, dueDay: 31 }] },
        { month: '2026-02', templateId: 'latest', templateName: 'Latest', customized: false, plannedIncome: 30_000, linkedIncluded: true, lines: [{ category: 'Food', planned: 6_000 }] },
      ],
    });

    const selectedDefault = migrateV7ToV8(makeLegacy('first'));
    expect(selectedDefault).toMatchObject({
      budgetPlan: {
        plannedIncome: 10_000,
        lines: [{ category: 'Food', mode: 'amount', value: 100 }],
        repeatMonthly: false,
        repeatFrom: null,
      },
      monthBudgets: [
        { month: '2026-01', source: 'custom', linkedIncluded: false, lines: [{ category: 'Bills', planned: 250, dueDay: 31 }] },
        { month: '2026-02', source: 'custom', linkedIncluded: false, lines: [{ category: 'Bills', planned: 300, dueDay: 31 }] },
        { month: '2026-02', source: 'custom', linkedIncluded: false, lines: [{ category: 'Food', planned: 6_000 }] },
      ],
    });
    expect(selectedDefault).not.toHaveProperty('budgetTemplates');
    expect(selectedDefault).not.toHaveProperty('defaultBudgetTemplateId');

    const used = migrateV7ToV8(makeLegacy(null)) as { budgetPlan: { plannedIncome: number } };
    expect(used.budgetPlan.plannedIncome).toBe(20_000);
    const latestTie = migrateV7ToV8({
      ...makeLegacy(null),
      monthBudgets: [
        { month: '2026-01', templateId: 'used', lines: [] },
        { month: '2026-02', templateId: 'latest', lines: [] },
      ],
    }) as { budgetPlan: { plannedIncome: number } };
    expect(latestTie.budgetPlan.plannedIncome).toBe(30_000);
    const firstFallback = migrateV7ToV8({ ...makeLegacy(null), monthBudgets: [] }) as {
      budgetPlan: { plannedIncome: number };
    };
    expect(firstFallback.budgetPlan.plannedIncome).toBe(10_000);
  });

  it('migrates v8 income totals, category defaults, and dayless snapshots', () => {
    let id = 0;
    const v8 = {
      ...mockAppData,
      settings: { ...mockAppData.settings, monthlySalary: 900 },
      transactions: [
        { id: 'salary-1', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-08-01' },
        { id: 'salary-2', type: 'income' as const, amount: 100, category: 'Salary', note: '', date: '2026-09-01' },
        { id: 'freelance', type: 'income' as const, amount: 100, category: 'Freelance', note: '', date: '2026-10-01' },
      ],
      budgetPlan: {
        plannedIncome: null,
        lines: [],
        repeatMonthly: true,
        repeatFrom: '2026-11',
      },
      monthBudgets: [
        { month: '2026-09', source: 'custom' as const, plannedIncome: 500, lines: [] },
        { month: '2026-10', source: 'custom' as const, plannedIncome: null, lines: [] },
      ],
    };
    const migrated = migrateV8ToV9(v8, {
      today: '2026-10-10',
      newId: () => `migrated-${++id}`,
    }) as {
      budgetPlan: { incomes: { id: string; name: string; category: string; amount: number; day?: number }[] };
      monthBudgets: { incomes: { id: string; name: string; category: string; amount: number; day?: number }[] }[];
    };
    expect(migrated.budgetPlan.incomes).toEqual([
      { id: 'migrated-1', name: 'Salary', category: 'Salary', amount: 900, day: 1 },
    ]);
    expect(migrated.monthBudgets).toEqual([
      { month: '2026-09', source: 'custom', lines: [], incomes: [
        { id: 'migrated-2', name: 'Income', category: 'Salary', amount: 500 },
      ] },
      { month: '2026-10', source: 'custom', lines: [], incomes: [] },
    ]);
    const zero = migrateV8ToV9({
      ...v8,
      budgetPlan: { ...v8.budgetPlan, plannedIncome: 0 },
      settings: { ...v8.settings, monthlySalary: 0 },
    }, { today: '2026-10-10', newId: () => 'unused' }) as {
      budgetPlan: { incomes: unknown[] };
    };
    expect(zero.budgetPlan.incomes).toEqual([]);
  });

  it('rejects malformed v7 budget containers and migrates an empty template list', () => {
    expect(() => migrateV7ToV8(null)).toThrow(PersistedVersionError);
    expect(() => migrateV7ToV8({ budgetTemplates: [null] })).toThrow(PersistedVersionError);
    expect(() => migrateV7ToV8({ monthBudgets: {} })).toThrow(PersistedVersionError);
    expect(() => migrateV7ToV8({ budgetTemplates: [{ id: 'missing-lines' }] })).toThrow(PersistedVersionError);
    expect(() => migrateV7ToV8({ budgetTemplates: [{ lines: [] }] })).toThrow(PersistedVersionError);
    expect(migrateV7ToV8({ budgetTemplates: [], monthBudgets: [] })).toEqual({
      budgetPlan: null,
      monthBudgets: [],
    });
  });

  it('adds only empty custom emergency-fund fields when migrating v5 to v6', () => {
    const v5 = makeV5Fixture();
    expect(migrateV5ToV6(v5)).toEqual({ ...v5, efCustomBuckets: [], efBucketLinks: {} });
    const migrated = migratePersisted({ data: v5 }, 5, { today: '2026-10-10', newId: () => 'migrated-v5-fund' }) as { data: Record<string, unknown> };
    expect(migrated.data).not.toHaveProperty('efEntries');
    expect(migrated.data.efCustomBuckets).toEqual([]);
  });

  it('migrates v6 ledger balance into a linked manual holding and removes the ledger', () => {
    const v6 = makeV6Fixture();
    const migrated = migrateV6ToV7(v6, { today: '2026-10-10', newId: () => 'migrated-fund' }) as Record<string, unknown>;
    expect(migrated).not.toHaveProperty('efEntries');
    expect(migrated.holdings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'migrated-fund', kind: 'manual', name: 'Emergency fund (migrated)',
        invested: 500, value: 500, valueAsOf: '2026-10-10', logs: [],
      }),
    ]));
    expect(migrated.goals).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'legacy-ef-goal', links: [{ instrumentId: 'migrated-fund', share: 100 }] }),
    ]));
    expect(migrated.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'legacy-ef-tx', type: 'invest', category: 'Other investments' }),
    ]));
  });

  it('leaves a zero ledger unmaterialized and creates the missing emergency goal', () => {
    const v6 = {
      ...makeV6Fixture(),
      efEntries: [],
      goals: [],
      efBucketLinks: null,
      budget: { month: '2026-10' },
      budgetTemplates: [],
      monthBudgets: [{ month: '2026-10' }],
    };
    const migrated = migrateV6ToV7(v6, {
      today: '2026-10-10',
      newId: () => {
        throw new Error('A zero balance must not need a generated ID.');
      },
    }) as Record<string, unknown>;
    expect(migrated.goals).toEqual([
      expect.objectContaining({
        id: 'goal-emergency-fund',
        auto: 'ef',
        links: [],
        year: 2026,
      }),
    ]);
    expect(migrated.budget).toEqual({ month: '2026-10' });
    expect(migrated.monthBudgets).toEqual([{ month: '2026-10' }]);
    expect(migrated.efBucketLinks).toEqual({});
  });

  it('deduplicates migrated bucket links and drops links with no free goal share', () => {
    const v6 = makeV6Fixture();
    const migrationInput = {
      ...v6,
      holdings: [
        ...v6.holdings,
        {
          id: 'fully-allocated',
          kind: 'manual' as const,
          name: 'Fully allocated',
          type: 'Cash' as const,
          invested: 100,
          value: 100,
          logs: [],
        },
        {
          id: 'partially-allocated',
          kind: 'manual' as const,
          name: 'Partially allocated',
          type: 'Savings account' as const,
          invested: 100,
          value: 100,
          logs: [],
        },
      ],
      goals: [
        ...v6.goals.map((goal) => ({ ...goal, links: [] })),
        {
          id: 'other-goal',
          name: 'Other',
          target: 100,
          saved: 0,
          year: 2028,
          links: [
            { instrumentId: 'fully-allocated', share: 100 },
            { instrumentId: 'partially-allocated', share: 25 },
          ],
        },
      ],
      efBucketLinks: {
        bank: ['fully-allocated', 'partially-allocated', 'partially-allocated'],
        cash: ['partially-allocated'],
      },
    };
    const migrated = migrateV6ToV7(migrationInput, {
      today: '2026-10-10',
      newId: () => 'migrated-fund',
    }) as AppData;
    expect(migrated.efBucketLinks).toEqual({
      bank: ['partially-allocated'],
      cash: [],
    });
    expect(migrated.goals.find((goal) => goal.auto === 'ef')?.links)
      .toContainEqual({ instrumentId: 'partially-allocated', share: 75 });
    expect(migrated.goals.find((goal) => goal.auto === 'ef')?.links)
      .not.toContainEqual(expect.objectContaining({ instrumentId: 'fully-allocated' }));
  });

  it('preserves the mock portfolio net worth and emergency goal progress across the v6 migration', () => {
    const planLines = mockAppData.budgetPlan?.items.map((item) => ({
      category: item.name, mode: item.mode, value: item.value,
      ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
    })) ?? [];
    const legacy = {
      ...mockAppData,
      transactions: mockAppData.transactions.map((transaction) => transaction.id === 'tx-emergency-fund'
        ? { ...transaction, category: 'Emergency fund' }
        : transaction),
      holdings: mockAppData.holdings.filter((holding) => holding.id !== 'holding-cash' && holding.id !== 'holding-bank'),
      goals: mockAppData.goals.map((goal) => goal.auto === 'ef' ? { ...goal, links: [] } : goal),
      efEntries: [
        { id: 'legacy-open', date: '2026-08-10', amount: 153_000, note: '' },
        { id: 'legacy-add', date: '2026-09-08', amount: 2_000, note: '' },
      ],
      budget: {
        ...mockAppData.budget!,
        lines: [
          ...mockAppData.budget!.lines.filter((line) => line.category !== 'Other investments'),
          { category: 'Other investments', planned: 500 },
          { category: 'Emergency fund', planned: 1_000 },
        ],
      },
      budgetTemplates: [{
        id: 'migrated-template',
        name: 'Migrated plan',
        plannedIncome: mockAppData.budgetPlan?.incomes
          .reduce((sum, income) => sum + income.amount, 0) ?? null,
        lines: [
          ...planLines.filter((line) => line.category !== 'Other investments'),
          { category: 'Other investments', mode: 'amount' as const, value: 500 },
          { category: 'Emergency fund', mode: 'amount' as const, value: 1_000 },
        ],
      }],
      monthBudgets: mockAppData.monthBudgets!.map(({ items, sections: _sections, ...budget }) => ({
        ...budget,
        lines: [
          ...items.filter((item) => item.name !== 'Other investments').map((item) => ({
            category: item.name, planned: item.value,
            ...(item.dueDay === undefined ? {} : { dueDay: item.dueDay }),
          })),
          { category: 'Other investments', planned: 500 },
          { category: 'Emergency fund', planned: 1_000 },
        ],
      })),
    };
    const oldAssets = legacy.holdings.reduce((sum, holding) => sum + holdingValue(holding, '2026-10-10'), 0) + 155_000;
    const oldLiabilities = netWorth(mockAppData, '2026-10-10').liabilities;
    const oldNetWorth = oldAssets - oldLiabilities;
    const result = migrateV6ToV7(legacy, { today: '2026-10-10', newId: () => 'migrated-mock-fund' }) as AppData & {
      monthBudgets?: { lines: { category: string; planned: number }[] }[];
      budgetTemplates?: { lines: { category: string; mode: 'amount' | 'percent'; value: number }[] }[];
    };
    const emergency = result.goals.find((goal) => goal.auto === 'ef')!;
    expect(netWorth(result, '2026-10-10').netWorth).toBe(oldNetWorth);
    expect(goalSavedFor(emergency, result, '2026-10-10')).toBe(155_000);
    expect(result.monthBudgets?.[0]?.lines.reduce((sum, line) => sum + line.planned, 0))
      .toBe(legacy.monthBudgets?.[0]?.lines.reduce((sum, line) => sum + line.planned, 0));
    expect(result.budgetTemplates?.[0]?.lines.find((line) => line.category === 'Other investments'))
      .toMatchObject({ mode: 'amount', value: 1_500 });
  });

  it('preserves seeded budget group totals and net worth when migrating legacy emergency-fund lines', () => {
    let seed = 21;
    const next = (minimum: number, maximum: number) => {
      seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
      return minimum + seed % (maximum - minimum + 1);
    };
    const groupFor = (category: string) => category === 'Emergency fund'
      ? 'savings-investments'
      : BUDGET_GROUPS.find((group) => group.categories.includes(category))?.id;
    const groupTotals = (
      lines: readonly { category: string; planned?: number; mode?: 'amount' | 'percent'; value?: number }[],
      plannedIncome?: number,
    ) => {
      const totals = Object.fromEntries(BUDGET_GROUPS.map(({ id }) => [id, 0])) as Record<string, number>;
      for (const line of lines) {
        const group = groupFor(line.category);
        if (!group) throw new Error(`Missing budget group for ${line.category}.`);
        const value = line.planned ?? (line.mode === 'percent'
          ? (line.value ?? 0) * (plannedIncome ?? 0) / 100
          : line.value ?? 0);
        totals[group] = (totals[group] ?? 0) + value;
      }
      return totals;
    };

    for (let sample = 0; sample < 12; sample += 1) {
      const balance = next(1_000, 300_000);
      const plannedIncome = next(30_000, 250_000);
      const monthLines = BUDGET_GROUPS.flatMap(({ categories }) => categories.map((category) => ({
        category,
        planned: next(100, 20_000),
      })));
      const legacyMonthLines = [...monthLines, { category: 'Emergency fund', planned: next(100, 20_000) }];
      const templateLines: { category: string; mode: 'amount' | 'percent'; value: number }[] =
        BUDGET_GROUPS.flatMap(({ categories }) => categories.map((category) => ({
        category,
        mode: 'amount' as const,
        value: next(100, 20_000),
      })));
      const emergencyTemplateLine = {
        category: 'Emergency fund',
        mode: 'percent',
        value: next(1, 20),
      } as const;
      if (sample % 2 === 0) templateLines.push(emergencyTemplateLine);
      else templateLines.unshift(emergencyTemplateLine);
      const legacyHoldings = mockAppData.holdings.filter((holding) =>
        holding.id !== 'holding-cash' && holding.id !== 'holding-bank');
      const beforeAppData: AppData = {
        ...mockAppData,
        holdings: legacyHoldings,
      };
      const legacy = {
        ...beforeAppData,
        goals: mockAppData.goals.map((goal) => goal.auto === 'ef' ? { ...goal, links: [] } : goal),
        efEntries: [{ id: `legacy-${sample}`, date: '2026-10-01', amount: balance, note: '' }],
        budget: {
          month: '2026-10',
          plannedIncome,
          lines: legacyMonthLines,
        },
        budgetTemplates: [{
          id: `template-${sample}`,
          name: 'Seeded',
          plannedIncome,
          lines: templateLines,
        }],
        monthBudgets: [{
          month: '2026-10',
          plannedIncome,
          lines: legacyMonthLines,
        }],
      };
      const oldLiabilities = netWorth(beforeAppData, '2026-10-10').liabilities;
      const oldNetWorth = legacyHoldings.reduce(
        (total, holding) => total + holdingValue(holding, '2026-10-10'),
        balance,
      ) - oldLiabilities;
      const migrated = migrateV6ToV7(legacy, {
        today: '2026-10-10',
        newId: () => `migrated-${sample}`,
      }) as AppData & {
        monthBudgets?: { lines: { category: string; planned?: number; mode?: 'amount' | 'percent'; value?: number }[] }[];
        budgetTemplates?: { lines: { category: string; planned?: number; mode?: 'amount' | 'percent'; value?: number }[] }[];
      };
      expect(netWorth(migrated, '2026-10-10').netWorth).toBe(oldNetWorth);
      expect(groupTotals(legacyMonthLines)).toEqual(groupTotals(migrated.monthBudgets![0]!.lines));
      expect(legacyMonthLines.reduce((sum, line) => sum + line.planned, 0))
        .toBe(migrated.monthBudgets![0]!.lines.reduce((sum, line) => sum + (line.planned ?? 0), 0));
      const oldTemplateTotals = groupTotals(templateLines, plannedIncome);
      const newTemplateTotals = groupTotals(migrated.budgetTemplates![0]!.lines, plannedIncome);
      for (const group of BUDGET_GROUPS) {
        expect(newTemplateTotals[group.id]).toBeCloseTo(oldTemplateTotals[group.id] ?? 0, 8);
      }
    }
  });
});
