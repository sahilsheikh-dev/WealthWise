import {
  migratePersisted,
  migrateV1ToV2,
  migrateV2ToV3,
  migrateV3ToV4,
  migrateV5ToV6,
  migrateV6ToV7,
  migrateV7ToV8,
  PersistedVersionError,
} from '../migrate';
import { makeV1Fixture, makeV2Fixture, makeV5Fixture, makeV6Fixture } from '../testFixtures/v1';
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
    expect(() => migratePersisted({}, 9)).toThrow(
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
    const persisted = { data: { version7: true } };
    expect(migratePersisted(persisted, 8)).toBe(persisted);
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
        plannedIncome: mockAppData.budgetPlan?.plannedIncome ?? null,
        lines: [
          ...(mockAppData.budgetPlan?.lines ?? []).filter((line) => line.category !== 'Other investments'),
          { category: 'Other investments', mode: 'amount' as const, value: 500 },
          { category: 'Emergency fund', mode: 'amount' as const, value: 1_000 },
        ],
      }],
      monthBudgets: mockAppData.monthBudgets!.map((budget) => ({
        ...budget,
        lines: [
          ...budget.lines.filter((line) => line.category !== 'Other investments'),
          { category: 'Other investments', planned: 500 },
          { category: 'Emergency fund', planned: 1_000 },
        ],
      })),
    };
    const oldAssets = legacy.holdings.reduce((sum, holding) => sum + holdingValue(holding, '2026-10-10'), 0) + 155_000;
    const oldLiabilities = netWorth(mockAppData, '2026-10-10').liabilities;
    const oldNetWorth = oldAssets - oldLiabilities;
    const result = migrateV6ToV7(legacy, { today: '2026-10-10', newId: () => 'migrated-mock-fund' }) as AppData & {
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
        budgetTemplates?: { lines: { category: string; planned?: number; mode?: 'amount' | 'percent'; value?: number }[] }[];
      };
      expect(netWorth(migrated, '2026-10-10').netWorth).toBe(oldNetWorth);
      expect(groupTotals(legacyMonthLines)).toEqual(groupTotals(migrated.monthBudgets![0]!.lines));
      expect(legacyMonthLines.reduce((sum, line) => sum + line.planned, 0))
        .toBe(migrated.monthBudgets![0]!.lines.reduce((sum, line) => sum + line.planned, 0));
      const oldTemplateTotals = groupTotals(templateLines, plannedIncome);
      const newTemplateTotals = groupTotals(migrated.budgetTemplates![0]!.lines, plannedIncome);
      for (const group of BUDGET_GROUPS) {
        expect(newTemplateTotals[group.id]).toBeCloseTo(oldTemplateTotals[group.id] ?? 0, 8);
      }
    }
  });
});
