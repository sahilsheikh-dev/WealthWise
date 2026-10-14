import { migratePersisted, migrateV1ToV2, migrateV2ToV3, migrateV5ToV6, PersistedVersionError } from '../migrate';
import { makeV1Fixture, makeV2Fixture, makeV5Fixture } from '../testFixtures/v1';
import { validateImportData } from '../../domain/backup';
import { efBalance } from '../../domain/ef';
import { netWorth } from '../../domain/summary';

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
    expect(migratePersisted({ data: v1 }, 1)).toEqual({
      data: {
        ...expected,
        settings: { ...expected.settings, monthlySalary: null, onboarded: true },
        goals: expected.goals.map((goal) => ({ ...goal, links: [] })),
        liabilities: expected.liabilities.map((liability) => ({ ...liability, settlement: null })),
        policies: [],
        budget: null,
        efAllocation: null,
        efCustomBuckets: [],
        efBucketLinks: {},
      },
    });
  });

  it('upgrades v2 settings and detects onboarded only for non-empty user data', () => {
    const v2 = makeV2Fixture();
    const expected = {
      ...v2,
      settings: { ...v2.settings, monthlySalary: null, onboarded: true },
    };
    expect(migrateV2ToV3(v2)).toEqual(expected);
    expect(migrateV2ToV3(v2)).not.toHaveProperty('efAllocation');
    const expectedV5 = {
      ...expected,
      goals: expected.goals.map((goal) => ({ ...goal, links: [] })),
      liabilities: expected.liabilities.map((liability) => ({ ...liability, settlement: null })),
      policies: [],
      budget: null,
      efAllocation: null,
      efCustomBuckets: [],
      efBucketLinks: {},
    };
    expect(migratePersisted({ data: v2 }, 2)).toEqual({ data: expectedV5 });
    const before = validateImportData({
      ...expectedV5,
    });
    const after = validateImportData(migratePersisted(v2, 2));
    if (!before.ok || !after.ok) throw new Error('Expected the v2 migration fixture to validate.');
    expect(netWorth(after.data, '2026-09-03')).toEqual(netWorth(before.data, '2026-09-03'));
    expect(efBalance(after.data.efEntries)).toBe(efBalance(before.data.efEntries));
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
    expect(migrateV2ToV3({ ...empty, efEntries: [v2.efEntries[0]] }))
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
    expect(() => migratePersisted({}, 7)).toThrow(
      expect.objectContaining({ name: 'PersistedVersionError', reason: 'future-version' }),
    );
    expect(() => migratePersisted({}, -1)).toThrow(PersistedVersionError);
  });

  it('passes the current persisted schema through unchanged', () => {
    const persisted = { data: { version6: true } };
    expect(migratePersisted(persisted, 6)).toBe(persisted);
  });

  it('adds only empty custom emergency-fund fields when migrating v5 to v6', () => {
    const v5 = makeV5Fixture();
    expect(migrateV5ToV6(v5)).toEqual({ ...v5, efCustomBuckets: [], efBucketLinks: {} });
    expect(migratePersisted({ data: v5 }, 5))
      .toEqual({ data: { ...v5, efCustomBuckets: [], efBucketLinks: {} } });
  });
});
